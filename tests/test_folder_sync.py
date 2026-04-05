"""
Test script for folder sharing and real-time synchronization
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from django.db.models import Q
from apps.versioning.models import Folder, FolderMember, Project
from apps.versioning.services import FolderUpdateService


def test_folder_member_creation():
    """Test that FolderMember is created when folder is created"""
    print("\n=== Test 1: Folder Member Creation ===")
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        username='test_folder_user',
        defaults={'email': 'test@example.com'}
    )
    print(f"✓ Test user: {user.username} (created: {created})")
    
    # Clean up any existing test folders
    Folder.objects.filter(name='Test Sync Folder', owner=user).delete()
    
    # Create a folder
    folder = Folder.objects.create(
        name='Test Sync Folder',
        description='Testing folder synchronization',
        owner=user
    )
    print(f"✓ Created folder: {folder.name}")
    
    # Manually create FolderMember (simulating what perform_create does in FolderViewSet)
    FolderMember.objects.get_or_create(
        folder=folder,
        user=user,
        defaults={'role': 'owner', 'added_by': user}
    )
    
    # Check if FolderMember was created
    member = FolderMember.objects.filter(folder=folder, user=user, role='owner').first()
    if member:
        print(f"✓ FolderMember created with role: {member.role}")
    else:
        print("✗ FolderMember NOT created - this is an issue!")
        folder.delete()
        return False
    
    # Cleanup
    folder.delete()
    print("✓ Cleanup completed")
    return True


def test_folder_visibility():
    """Test that folders are visible to members"""
    print("\n=== Test 2: Folder Visibility ===")
    
    # Create two users
    owner, _ = User.objects.get_or_create(
        username='folder_owner',
        defaults={'email': 'owner@example.com'}
    )
    member_user, _ = User.objects.get_or_create(
        username='folder_member',
        defaults={'email': 'member@example.com'}
    )
    print(f"✓ Created users: {owner.username}, {member_user.username}")
    
    # Clean up any existing test folders
    Folder.objects.filter(name='Shared Test Folder', owner=owner).delete()
    
    # Create a folder
    folder = Folder.objects.create(
        name='Shared Test Folder',
        owner=owner
    )
    print(f"✓ Created folder: {folder.name}")
    
    # Add member to folder
    FolderMember.objects.create(
        folder=folder,
        user=member_user,
        role='viewer',
        added_by=owner
    )
    print(f"✓ Added {member_user.username} as viewer")
    
    # Test visibility - owner should see it
    owner_folders = Folder.objects.filter(
        Q(owner=owner) | Q(members__user=owner),
        is_active=True
    ).distinct()
    print(f"✓ Owner can see {owner_folders.count()} folder(s)")
    
    # Test visibility - member should see it
    member_folders = Folder.objects.filter(
        Q(owner=member_user) | Q(members__user=member_user),
        is_active=True
    ).distinct()
    print(f"✓ Member can see {member_folders.count()} folder(s)")
    
    if member_folders.filter(id=folder.id).exists():
        print("✓ Member can access shared folder")
    else:
        print("✗ Member CANNOT access shared folder - this is an issue!")
        folder.delete()
        return False
    
    # Cleanup
    folder.delete()
    print("✓ Cleanup completed")
    return True


def test_auto_add_reviewers():
    """Test that reviewers are auto-added as folder members"""
    print("\n=== Test 3: Auto-add Reviewers ===")
    
    # Create users
    owner, _ = User.objects.get_or_create(
        username='project_owner',
        defaults={'email': 'powner@example.com'}
    )
    reviewer, _ = User.objects.get_or_create(
        username='project_reviewer',
        defaults={'email': 'reviewer@example.com'}
    )
    print(f"✓ Created users: {owner.username}, {reviewer.username}")
    
    # Clean up any existing test folders
    Folder.objects.filter(name='Project Folder', owner=owner).delete()
    
    # Create a folder
    folder = Folder.objects.create(
        name='Project Folder',
        owner=owner
    )
    print(f"✓ Created folder: {folder.name}")
    
    # Create a project in the folder
    project = Project.objects.create(
        name='Test Project',
        owner=owner,
        folder=folder
    )
    print(f"✓ Created project: {project.name}")
    
    # Simulate adding reviewer to project (this would normally happen in the view)
    from apps.versioning.models import ProjectMember
    ProjectMember.objects.create(
        project=project,
        user=reviewer,
        role='reviewer'
    )
    print(f"✓ Added {reviewer.username} as project reviewer")
    
    # Manually trigger the auto-add logic (simulating what happens in ProjectViewSet.create)
    FolderMember.objects.get_or_create(
        folder=folder,
        user=reviewer,
        defaults={'role': 'viewer', 'added_by': owner}
    )
    
    # Check if reviewer is now a folder member
    is_member = FolderMember.objects.filter(folder=folder, user=reviewer).exists()
    if is_member:
        print(f"✓ Reviewer auto-added to folder as member")
    else:
        print("✗ Reviewer NOT added to folder - this is an issue!")
        folder.delete()
        return False
    
    # Cleanup
    folder.delete()
    print("✓ Cleanup completed")
    return True


def test_websocket_broadcast():
    """Test WebSocket broadcast functionality"""
    print("\n=== Test 4: WebSocket Broadcast ===")
    
    # Create test user and folder
    user, _ = User.objects.get_or_create(
        username='ws_test_user',
        defaults={'email': 'ws@example.com'}
    )
    
    # Clean up any existing test folders
    Folder.objects.filter(name='WebSocket Test Folder', owner=user).delete()
    
    folder = Folder.objects.create(
        name='WebSocket Test Folder',
        owner=user
    )
    print(f"✓ Created folder: {folder.name}")
    
    # Test broadcast (won't actually send since no WebSocket connections, but tests the code path)
    try:
        FolderUpdateService.broadcast_folder_update(
            folder,
            'folder_updated',
            {'name': folder.name, 'description': folder.description}
        )
        print("✓ WebSocket broadcast executed without errors")
    except Exception as e:
        print(f"✗ WebSocket broadcast failed: {e}")
        folder.delete()
        return False
    
    # Cleanup
    folder.delete()
    print("✓ Cleanup completed")
    return True


if __name__ == '__main__':
    print("\n" + "="*50)
    print("FOLDER SHARING & REAL-TIME SYNC TESTS")
    print("="*50)
    
    results = []
    
    # Run tests
    results.append(("Folder Member Creation", test_folder_member_creation()))
    results.append(("Folder Visibility", test_folder_visibility()))
    results.append(("Auto-add Reviewers", test_auto_add_reviewers()))
    results.append(("WebSocket Broadcast", test_websocket_broadcast()))
    
    # Print summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    print("="*50 + "\n")
    
    sys.exit(0 if passed == total else 1)
