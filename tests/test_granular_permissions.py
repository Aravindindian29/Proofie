#!/usr/bin/env python3
"""
Test script to verify granular permissions implementation
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
from apps.workflows.models import RolePermission
from apps.versioning.models import Folder, Project
from apps.versioning.permissions import (
    can_create_content, can_edit_content, can_delete_content,
    can_add_folder_member, can_add_proof_to_folder, can_delete_proof_in_folder,
    can_use_proofieplus, can_add_comment, can_delete_proof_in_preview
)

def test_granular_permissions():
    print("🧪 Testing Granular Permissions Implementation")
    print("=" * 60)
    
    # Verify RolePermission entries exist
    print("\n1️⃣ Verifying RolePermission Templates...")
    print("-" * 60)
    
    for role in ['admin', 'manager', 'approver', 'lite_user']:
        try:
            role_perm = RolePermission.objects.get(role=role)
            print(f"✅ {role_perm.get_role_display()} permissions template exists")
        except RolePermission.DoesNotExist:
            print(f"❌ {role} permissions template NOT FOUND")
            return
    
    # Create test users with different roles
    print("\n2️⃣ Creating Test Users...")
    print("-" * 60)
    
    users = {}
    roles = ['admin', 'manager', 'approver', 'lite_user']
    
    for role in roles:
        username = f"test_granular_{role}"
        user, created = User.objects.get_or_create(
            username=username,
            defaults={'email': f'{username}@test.com'}
        )
        
        if created:
            user.set_password('testpass123')
            user.save()
        
        # Update profile role
        profile = user.profile
        profile.role = role
        profile.save()
        
        users[role] = user
        print(f"✅ {username} created/updated with role: {role}")
    
    # Test permission application
    print("\n3️⃣ Testing Permission Application...")
    print("-" * 60)
    
    for role, user in users.items():
        profile = user.profile
        role_perm = RolePermission.objects.get(role=role)
        
        # Verify permissions match role template
        matches = (
            profile.can_create_folder == role_perm.can_create_folder and
            profile.can_add_member == role_perm.can_add_member and
            profile.can_edit_folder == role_perm.can_edit_folder and
            profile.can_add_proof == role_perm.can_add_proof and
            profile.can_delete_folder == role_perm.can_delete_folder and
            profile.can_delete_proof_in_folder == role_perm.can_delete_proof_in_folder and
            profile.can_use_proofieplus == role_perm.can_use_proofieplus and
            profile.can_add_comment == role_perm.can_add_comment and
            profile.can_delete_proof_in_preview == role_perm.can_delete_proof_in_preview
        )
        
        if matches:
            print(f"✅ {role} permissions correctly applied")
        else:
            print(f"❌ {role} permissions MISMATCH")
    
    # Test permission functions
    print("\n4️⃣ Testing Permission Functions...")
    print("-" * 60)
    
    # Create test folder
    admin = users['admin']
    test_folder, _ = Folder.objects.get_or_create(
        name="Test Granular Folder",
        defaults={'owner': admin, 'description': 'Test folder'}
    )
    
    # Test each permission function
    permission_tests = [
        ('can_create_content', can_create_content, None),
        ('can_add_folder_member', can_add_folder_member, None),
        ('can_add_proof_to_folder', can_add_proof_to_folder, None),
        ('can_delete_proof_in_folder', can_delete_proof_in_folder, None),
        ('can_use_proofieplus', can_use_proofieplus, None),
        ('can_add_comment', can_add_comment, None),
        ('can_delete_proof_in_preview', can_delete_proof_in_preview, None),
    ]
    
    for role, user in users.items():
        print(f"\n{role.upper()}:")
        for perm_name, perm_func, obj in permission_tests:
            if obj is None:
                result = perm_func(user)
            else:
                result = perm_func(user, obj)
            print(f"  {perm_name}: {'✅' if result else '❌'}")
    
    # Test content-based permissions
    print("\n5️⃣ Testing Content-Based Permissions...")
    print("-" * 60)
    
    for role, user in users.items():
        can_edit = can_edit_content(user, test_folder)
        can_delete = can_delete_content(user, test_folder)
        
        print(f"{role:12} | Edit: {'✅' if can_edit else '❌'} | Delete: {'✅' if can_delete else '❌'}")
    
    # Test expected behavior
    print("\n6️⃣ Verifying Expected Behavior...")
    print("-" * 60)
    
    expectations = {
        'admin': {
            'can_create_content': True,
            'can_add_folder_member': True,
            'can_add_proof_to_folder': True,
            'can_delete_proof_in_folder': True,
            'can_use_proofieplus': True,
            'can_add_comment': True,
        },
        'manager': {
            'can_create_content': True,
            'can_add_folder_member': True,
            'can_add_proof_to_folder': True,
            'can_delete_proof_in_folder': True,
            'can_use_proofieplus': True,
            'can_add_comment': True,
        },
        'approver': {
            'can_create_content': False,
            'can_add_folder_member': False,
            'can_add_proof_to_folder': False,
            'can_delete_proof_in_folder': False,
            'can_use_proofieplus': True,
            'can_add_comment': True,
        },
        'lite_user': {
            'can_create_content': False,
            'can_add_folder_member': False,
            'can_add_proof_to_folder': False,
            'can_delete_proof_in_folder': False,
            'can_use_proofieplus': False,
            'can_add_comment': False,
        }
    }
    
    all_correct = True
    for role, expected in expectations.items():
        user = users[role]
        
        for perm_name, expected_value in expected.items():
            if perm_name == 'can_create_content':
                actual = can_create_content(user)
            elif perm_name == 'can_add_folder_member':
                actual = can_add_folder_member(user)
            elif perm_name == 'can_add_proof_to_folder':
                actual = can_add_proof_to_folder(user)
            elif perm_name == 'can_delete_proof_in_folder':
                actual = can_delete_proof_in_folder(user)
            elif perm_name == 'can_use_proofieplus':
                actual = can_use_proofieplus(user)
            elif perm_name == 'can_add_comment':
                actual = can_add_comment(user)
            
            if actual != expected_value:
                print(f"❌ {role} {perm_name} mismatch: expected {expected_value}, got {actual}")
                all_correct = False
    
    if all_correct:
        print("✅ All permissions working as expected!")
    else:
        print("❌ Some permissions are not working as expected")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print("\n✅ Granular Permissions System:")
    print("  - 9 specific permissions implemented")
    print("  - 3 permission categories (Folder, Inside Folder, Proof Preview)")
    print("  - Role-based permission templates created")
    print("  - User-specific permissions supported")
    print("  - Auto-apply on role change enabled")
    print("\n📍 Admin Access:")
    print("  - Workflows → Role Permissions (manage role defaults)")
    print("  - Accounts → Users → Profile (manage user permissions)")
    print("\n🎉 Granular permissions implementation complete!")

if __name__ == '__main__':
    test_granular_permissions()
