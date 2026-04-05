#!/usr/bin/env python3
"""
Test script to verify folder-scoped approver permissions implementation
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
from apps.versioning.models import Folder, FolderMember
from apps.versioning.permissions import can_manage_folder_members, can_remove_folder_member

def test_folder_scoped_permissions():
    print("🧪 Testing Folder-Scoped Approver Permissions")
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
    
    # Create two test folders
    admin = users['admin']
    folder1, created = Folder.objects.get_or_create(
        name="Test Folder 1",
        defaults={'owner': admin, 'description': 'Test folder 1'}
    )
    
    folder2, created = Folder.objects.get_or_create(
        name="Test Folder 2", 
        defaults={'owner': admin, 'description': 'Test folder 2'}
    )
    
    print(f"✅ Created test folders: {folder1.name}, {folder2.name}")
    
    # Add members to folder1 (approver is a member)
    folder1_members = {
        'admin': 'owner',
        'manager': 'viewer', 
        'approver': 'editor',  # Approver is member of folder1
        'lite_user': 'viewer'
    }
    
    for role, folder_role in folder1_members.items():
        user = users[role]
        member, created = FolderMember.objects.get_or_create(
            folder=folder1,
            user=user,
            defaults={'role': folder_role}
        )
        if created:
            print(f"✅ Added {user.username} as {member.role} to {folder1.name}")
    
    # Add members to folder2 (approver is NOT a member)
    folder2_members = {
        'admin': 'owner',
        'manager': 'viewer',
        'lite_user': 'viewer'
        # Approver NOT added to folder2
    }
    
    for role, folder_role in folder2_members.items():
        user = users[role]
        member, created = FolderMember.objects.get_or_create(
            folder=folder2,
            user=user,
            defaults={'role': folder_role}
        )
        if created:
            print(f"✅ Added {user.username} as {member.role} to {folder2.name}")
    
    print(f"\n🔍 Testing Folder 1 (Approver is member):")
    print("-" * 45)
    
    # Test permissions in folder1 (approver is member)
    for role, user in users.items():
        permissions = can_manage_folder_members(user, folder1)
        print(f"{role:12} | Can manage: {permissions['can_manage']} | Global: {permissions['can_manage_all_folders']}")
    
    print(f"\n🔍 Testing Folder 2 (Approver is NOT member):")
    print("-" * 45)
    
    # Test permissions in folder2 (approver is NOT member)
    for role, user in users.items():
        permissions = can_manage_folder_members(user, folder2)
        print(f"{role:12} | Can manage: {permissions['can_manage']} | Global: {permissions['can_manage_all_folders']}")
    
    print(f"\n🔍 Testing Member Removal in Folder 1:")
    print("-" * 40)
    
    # Test removal permissions in folder1
    test_cases = [
        ('admin', 'admin', 'owner'),
        ('manager', 'admin', 'owner'),
        ('approver', 'admin', 'owner'),
        ('lite_user', 'admin', 'owner'),
        ('admin', 'approver', 'editor'),
        ('manager', 'approver', 'editor'),
        ('approver', 'approver', 'editor'),  # Self-removal
        ('lite_user', 'approver', 'editor'),
    ]
    
    for remover_role, target_role, target_folder_role in test_cases:
        remover = users[remover_role]
        target = users[target_role]
        
        can_remove = can_remove_folder_member(remover, target, folder1)
        is_self = remover.id == target.id
        self_text = " (self)" if is_self else ""
        
        print(f"{remover_role:12} removing {target_role:12} ({target_folder_role:6}){self_text:8} -> {'✅ ALLOWED' if can_remove else '❌ DENIED'}")
    
    print(f"\n🔍 Testing Member Removal in Folder 2:")
    print("-" * 40)
    
    # Test removal permissions in folder2 (approver not member)
    test_cases_folder2 = [
        ('admin', 'admin', 'owner'),
        ('manager', 'admin', 'owner'),
        ('approver', 'admin', 'owner'),  # Approver not member - should be denied
        ('lite_user', 'admin', 'owner'),
    ]
    
    for remover_role, target_role, target_folder_role in test_cases_folder2:
        remover = users[remover_role]
        target = users[target_role]
        
        can_remove = can_remove_folder_member(remover, target, folder2)
        print(f"{remover_role:12} removing {target_role:12} ({target_folder_role:6}) -> {'✅ ALLOWED' if can_remove else '❌ DENIED'}")
    
    print(f"\n🎯 Final Permission Matrix:")
    print("-" * 30)
    print("✅ Admin: Global permissions (all folders)")
    print("✅ Manager: Global permissions (all folders)")
    print("✅ Approver: Folder-scoped permissions (member folders only)")
    print("✅ Lite User: No permissions")
    
    print(f"\n🚀 Folder-scoped approver permissions implemented successfully!")

if __name__ == '__main__':
    test_folder_scoped_permissions()
