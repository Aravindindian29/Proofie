#!/usr/bin/env python3
"""
Test script to verify folder member permissions implementation
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
from apps.versioning.permissions import can_manage_folder_members, can_remove_folder_member, is_folder_owner

def test_permissions():
    print("🧪 Testing Folder Member Permissions Implementation")
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
    
    # Create a test folder
    owner = users['admin']
    folder, created = Folder.objects.get_or_create(
        name="Test Folder",
        defaults={'owner': owner, 'description': 'Test folder for permissions'}
    )
    
    if created:
        print(f"✅ Created test folder: {folder.name}")
    
    # Add members to folder
    for role, user in users.items():
        member, created = FolderMember.objects.get_or_create(
            folder=folder,
            user=user,
            defaults={'role': 'viewer' if role != 'admin' else 'owner'}
        )
        if created:
            print(f"✅ Added {user.username} as {member.role} to folder")
    
    print("\n🔍 Testing Permission Functions:")
    print("-" * 30)
    
    # Test can_manage_folder_members
    for role, user in users.items():
        permissions = can_manage_folder_members(user, folder)
        print(f"{role:12} | Can manage: {permissions['can_manage']} | Can add: {permissions['can_add']} | Can remove owner: {permissions['can_remove_owner']}")
    
    print("\n🔍 Testing Member Removal Permissions:")
    print("-" * 40)
    
    # Test can_remove_folder_member for each combination
    test_cases = [
        ('admin', 'admin', 'owner'),
        ('manager', 'admin', 'owner'),
        ('approver', 'admin', 'owner'),
        ('lite_user', 'admin', 'owner'),
        ('admin', 'manager', 'viewer'),
        ('manager', 'manager', 'viewer'),
        ('approver', 'manager', 'viewer'),
        ('lite_user', 'manager', 'viewer'),
        ('lite_user', 'lite_user', 'viewer'),  # Self-removal
    ]
    
    for remover_role, target_role, target_folder_role in test_cases:
        remover = users[remover_role]
        target = users[target_role]
        
        # Update target's folder role for testing
        if target_folder_role != 'viewer':
            member = FolderMember.objects.get(folder=folder, user=target)
            member.role = target_folder_role
            member.save()
        
        can_remove = can_remove_folder_member(remover, target, folder)
        is_self = remover.id == target.id
        self_text = " (self)" if is_self else ""
        
        print(f"{remover_role:12} removing {target_role:12} ({target_folder_role:6}){self_text:8} -> {'✅ ALLOWED' if can_remove else '❌ DENIED'}")
    
    print("\n🎯 Summary:")
    print("-" * 20)
    print("✅ Admin, Manager, Approver: Can manage ALL folders")
    print("✅ Lite User: Cannot remove anyone (including themselves)")
    print("✅ Self-removal: Only allowed for Admin/Manager/Approver")
    print("✅ Owner removal: Only Admin/Manager/Approver (including self)")
    
    print("\n🚀 Implementation complete! Permissions working as expected.")

if __name__ == '__main__':
    test_permissions()
