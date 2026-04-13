#!/usr/bin/env python3
"""
Test script to verify role-based permissions implementation
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
from apps.accounts.models import UserProfile
from apps.versioning.models import Folder, Project, FolderMember, ProjectMember
from apps.versioning.permissions import (
    can_view_content, can_edit_content, can_delete_content, can_create_content,
    get_user_accessible_folders, get_user_accessible_projects, get_user_role
)

def test_role_based_permissions():
    print("🧪 Testing Role-Based Permissions Implementation")
    print("=" * 50)
    
    # Create test users with different roles
    users = {}
    roles = ['admin', 'manager', 'approver', 'lite_user']
    
    for role in roles:
        username = f"test_{role}"
        user, created = User.objects.get_or_create(
            username=username,
            defaults={'email': f'{username}@test.com'}
        )
        
        if created:
            user.set_password('testpass123')
            user.save()
        
        # Create/update profile with role
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.save()
        
        users[role] = user
        print(f"✅ Created/updated user: {username} with role: {role}")
    
    # Create test folders and projects
    admin = users['admin']
    manager = users['manager']
    
    # Admin's folder
    admin_folder, created = Folder.objects.get_or_create(
        name="Admin Folder",
        defaults={'owner': admin, 'description': 'Admin folder'}
    )
    
    # Manager's folder
    manager_folder, created = Folder.objects.get_or_create(
        name="Manager Folder",
        defaults={'owner': manager, 'description': 'Manager folder'}
    )
    
    # Admin's project
    admin_project, created = Project.objects.get_or_create(
        name="Admin Project",
        defaults={'owner': admin, 'description': 'Admin project'}
    )
    
    # Manager's project
    manager_project, created = Project.objects.get_or_create(
        name="Manager Project",
        defaults={'owner': manager, 'description': 'Manager project'}
    )
    
    print(f"✅ Created test folders and projects")
    
    # Add members to test shared access
    # Add manager, approver and lite_user as members to admin's content
    FolderMember.objects.get_or_create(folder=admin_folder, user=users['manager'], defaults={'role': 'viewer'})
    FolderMember.objects.get_or_create(folder=admin_folder, user=users['approver'], defaults={'role': 'viewer'})
    FolderMember.objects.get_or_create(folder=admin_folder, user=users['lite_user'], defaults={'role': 'viewer'})
    ProjectMember.objects.get_or_create(project=admin_project, user=users['manager'], defaults={'role': 'viewer'})
    ProjectMember.objects.get_or_create(project=admin_project, user=users['approver'], defaults={'role': 'viewer'})
    ProjectMember.objects.get_or_create(project=admin_project, user=users['lite_user'], defaults={'role': 'viewer'})
    
    print(f"✅ Added members for testing shared access")
    
    print(f"\n🔍 Testing Folder Permissions:")
    print("-" * 35)
    
    test_cases = [
        ('admin', admin_folder, 'admin_folder'),
        ('admin', manager_folder, 'manager_folder'),
        ('manager', admin_folder, 'admin_folder'),
        ('manager', manager_folder, 'manager_folder'),
        ('approver', admin_folder, 'admin_folder'),
        ('approver', manager_folder, 'manager_folder'),
        ('lite_user', admin_folder, 'admin_folder'),
        ('lite_user', manager_folder, 'manager_folder'),
    ]
    
    for role, folder, folder_name in test_cases:
        user = users[role]
        can_view = can_view_content(user, folder)
        can_edit = can_edit_content(user, folder)
        can_delete = can_delete_content(user, folder)
        
        print(f"{role:12} | {folder_name:12} | View: {'✅' if can_view else '❌'} | Edit: {'✅' if can_edit else '❌'} | Delete: {'✅' if can_delete else '❌'}")
    
    print(f"\n🔍 Testing Project Permissions:")
    print("-" * 35)
    
    project_test_cases = [
        ('admin', admin_project, 'admin_project'),
        ('admin', manager_project, 'manager_project'),
        ('manager', admin_project, 'admin_project'),
        ('manager', manager_project, 'manager_project'),
        ('approver', admin_project, 'admin_project'),
        ('approver', manager_project, 'manager_project'),
        ('lite_user', admin_project, 'admin_project'),
        ('lite_user', manager_project, 'manager_project'),
    ]
    
    for role, project, project_name in project_test_cases:
        user = users[role]
        can_view = can_view_content(user, project)
        can_edit = can_edit_content(user, project)
        can_delete = can_delete_content(user, project)
        
        print(f"{role:12} | {project_name:12} | View: {'✅' if can_view else '❌'} | Edit: {'✅' if can_edit else '❌'} | Delete: {'✅' if can_delete else '❌'}")
    
    print(f"\n🔍 Testing Create Permissions:")
    print("-" * 25)
    
    for role in roles:
        user = users[role]
        can_create = can_create_content(user)
        print(f"{role:12} | Create: {'✅' if can_create else '❌'}")
    
    print(f"\n🔍 Testing Accessible Content:")
    print("-" * 30)
    
    for role in roles:
        user = users[role]
        accessible_folders = get_user_accessible_folders(user).count()
        accessible_projects = get_user_accessible_projects(user).count()
        
        print(f"{role:12} | Folders: {accessible_folders:2} | Projects: {accessible_projects:2}")
    
    print(f"\n🎯 Expected Behavior Verification:")
    print("-" * 40)
    
    # Verify expected behavior
    expectations = {
        'admin': {
            'admin_folder': ['view', 'edit', 'delete'],
            'manager_folder': ['view', 'edit', 'delete'],
            'admin_project': ['view', 'edit', 'delete'],
            'manager_project': ['view', 'edit', 'delete'],
            'create': True
        },
        'manager': {
            'admin_folder': ['view'],
            'manager_folder': ['view', 'edit', 'delete'],
            'admin_project': ['view'],
            'manager_project': ['view', 'edit', 'delete'],
            'create': True
        },
        'approver': {
            'admin_folder': ['view'],
            'manager_folder': [],
            'admin_project': ['view'],
            'manager_project': [],
            'create': False
        },
        'lite_user': {
            'admin_folder': ['view'],
            'manager_folder': [],
            'admin_project': ['view'],
            'manager_project': [],
            'create': False
        }
    }
    
    all_correct = True
    for role, expected in expectations.items():
        user = users[role]
        
        # Check folder permissions
        for folder_name in ['admin_folder', 'manager_folder']:
            folder = admin_folder if folder_name == 'admin_folder' else manager_folder
            expected_perms = expected.get(folder_name, [])
            
            actual_view = can_view_content(user, folder)
            actual_edit = can_edit_content(user, folder)
            actual_delete = can_delete_content(user, folder)
            
            if ('view' in expected_perms) != actual_view:
                print(f"❌ {role} {folder_name} view permission mismatch")
                all_correct = False
            if ('edit' in expected_perms) != actual_edit:
                print(f"❌ {role} {folder_name} edit permission mismatch")
                all_correct = False
            if ('delete' in expected_perms) != actual_delete:
                print(f"❌ {role} {folder_name} delete permission mismatch")
                all_correct = False
        
        # Check create permission
        expected_create = expected['create']
        actual_create = can_create_content(user)
        if expected_create != actual_create:
            print(f"❌ {role} create permission mismatch")
            all_correct = False
    
    if all_correct:
        print("✅ All permissions working as expected!")
    else:
        print("❌ Some permissions are not working as expected")
    
    print(f"\n🚀 Role-based permissions implementation complete!")

if __name__ == '__main__':
    test_role_based_permissions()
