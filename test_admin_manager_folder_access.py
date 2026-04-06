#!/usr/bin/env python3
"""
Test script to verify Admin and Manager access to all folders and operations
"""

import os
import sys
import django

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.versioning.models import Folder, FolderMember
from apps.versioning.permissions import (
    get_user_accessible_folders, 
    get_user_accessible_projects,
    can_edit_content,
    can_delete_content,
    can_manage_folder_members
)

def test_admin_manager_folder_access():
    print("🧪 Testing Admin and Manager Folder Access")
    print("=" * 50)
    
    # Create test users with different roles
    users = {}
    
    try:
        # Create or get test users
        admin_user, _ = User.objects.get_or_create(
            username='test_admin', 
            defaults={'email': 'admin@test.com', 'is_staff': True}
        )
        admin_user.set_password('test123')
        admin_user.save()
        
        manager_user, _ = User.objects.get_or_create(
            username='test_manager', 
            defaults={'email': 'manager@test.com'}
        )
        manager_user.set_password('test123')
        manager_user.save()
        
        lite_user, _ = User.objects.get_or_create(
            username='test_lite', 
            defaults={'email': 'lite@test.com'}
        )
        lite_user.set_password('test123')
        lite_user.save()
        
        # Set user profiles with roles
        from apps.accounts.models import UserProfile
        
        for user, role in [(admin_user, 'admin'), (manager_user, 'manager'), (lite_user, 'lite_user')]:
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.role = role
            profile.apply_role_permissions()
            profile.save()
            users[role] = user
            print(f"✓ Created {role} user: {user.username}")
        
    except Exception as e:
        print(f"❌ Error creating test users: {e}")
        return
    
    # Create test folders with different owners
    print("\n📁 Creating test folders...")
    try:
        folder1, _ = Folder.objects.get_or_create(
            name="Admin's Folder",
            defaults={'owner': admin_user, 'is_active': True}
        )
        
        folder2, _ = Folder.objects.get_or_create(
            name="Manager's Folder", 
            defaults={'owner': manager_user, 'is_active': True}
        )
        
        folder3, _ = Folder.objects.get_or_create(
            name="Lite User's Folder",
            defaults={'owner': lite_user, 'is_active': True}
        )
        
        print(f"✓ Created 3 test folders")
        
    except Exception as e:
        print(f"❌ Error creating test folders: {e}")
        return
    
    # Test folder access for each role
    print(f"\n🔍 Testing Folder Access:")
    print("-" * 40)
    
    total_folders = Folder.objects.filter(is_active=True).count()
    print(f"Total folders in system: {total_folders}")
    
    for role, user in users.items():
        accessible_folders = get_user_accessible_folders(user)
        accessible_count = accessible_folders.count()
        
        print(f"{role:12} | Can access: {accessible_count}/{total_folders} folders")
        
        # Check specific folder access
        for folder in [folder1, folder2, folder3]:
            can_access = folder in accessible_folders
            owner_name = folder.owner.profile.role if hasattr(folder.owner, 'profile') else 'Unknown'
            print(f"            | {folder.name} (owner: {owner_name}): {'✓' if can_access else '✗'}")
    
    # Test operation permissions
    print(f"\n🔧 Testing Operation Permissions:")
    print("-" * 40)
    
    test_folder = folder2  # Use Manager's folder for testing
    
    for role, user in users.items():
        can_edit = can_edit_content(user, test_folder)
        can_delete = can_delete_content(user, test_folder)
        can_manage = can_manage_folder_members(user, test_folder)['can_manage']
        
        print(f"{role:12} | Edit: {'✓' if can_edit else '✗'} | Delete: {'✓' if can_delete else '✗'} | Manage Members: {'✓' if can_manage else '✗'}")
    
    # Test project access consistency
    print(f"\n📊 Testing Project Access:")
    print("-" * 40)
    
    for role, user in users.items():
        accessible_projects = get_user_accessible_projects(user)
        accessible_count = accessible_projects.count()
        print(f"{role:12} | Can access: {accessible_count} projects")
    
    # Verify results
    print(f"\n✅ Expected Results:")
    print("-" * 20)
    print("Admin:   Should see all folders and have all permissions")
    print("Manager: Should see all folders and have all permissions") 
    print("Lite:    Should see only own folders and limited permissions")
    
    # Check if implementation is correct
    admin_folders = get_user_accessible_folders(users['admin']).count()
    manager_folders = get_user_accessible_folders(users['manager']).count()
    lite_folders = get_user_accessible_folders(users['lite_user']).count()
    
    success = (admin_folders == total_folders and 
              manager_folders == total_folders and 
              lite_folders < total_folders)
    
    if success:
        print(f"\n🎉 SUCCESS: Admin and Manager folder access implementation is working correctly!")
    else:
        print(f"\n❌ ISSUE: Implementation needs review")
        print(f"   Admin folders: {admin_folders} (expected: {total_folders})")
        print(f"   Manager folders: {manager_folders} (expected: {total_folders})")
        print(f"   Lite folders: {lite_folders} (expected: < {total_folders})")

if __name__ == '__main__':
    test_admin_manager_folder_access()
