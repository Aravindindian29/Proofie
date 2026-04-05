#!/usr/bin/env python3
"""
Script to populate default RolePermission entries for all roles
"""

import os
import sys
import django

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.workflows.models import RolePermission

def populate_role_permissions():
    print("🔧 Populating Role Permissions...")
    print("=" * 50)
    
    # Define default permissions for each role
    role_permissions = {
        'admin': {
            'can_create_folder': True,
            'can_add_member': True,
            'can_edit_folder': True,
            'can_add_proof': True,
            'can_delete_folder': True,
            'can_delete_proof_in_folder': True,
            'can_use_proofieplus': True,
            'can_add_comment': True,
            'can_delete_proof_in_preview': True,
            'can_make_decisions': True,
        },
        'manager': {
            'can_create_folder': True,
            'can_add_member': True,
            'can_edit_folder': True,
            'can_add_proof': True,
            'can_delete_folder': True,
            'can_delete_proof_in_folder': True,
            'can_use_proofieplus': True,
            'can_add_comment': True,
            'can_delete_proof_in_preview': True,
            'can_make_decisions': True,
        },
        'approver': {
            'can_create_folder': False,
            'can_add_member': False,
            'can_edit_folder': False,
            'can_add_proof': False,
            'can_delete_folder': False,
            'can_delete_proof_in_folder': False,
            'can_use_proofieplus': True,
            'can_add_comment': True,
            'can_delete_proof_in_preview': False,
            'can_make_decisions': True,
        },
        'lite_user': {
            'can_create_folder': False,
            'can_add_member': False,
            'can_edit_folder': False,
            'can_add_proof': False,
            'can_delete_folder': False,
            'can_delete_proof_in_folder': False,
            'can_use_proofieplus': False,
            'can_add_comment': True,
            'can_delete_proof_in_preview': False,
            'can_make_decisions': False,
        },
    }
    
    # Create or update RolePermission entries
    for role, permissions in role_permissions.items():
        role_perm, created = RolePermission.objects.update_or_create(
            role=role,
            defaults=permissions
        )
        
        action = "Created" if created else "Updated"
        print(f"✅ {action} permissions for {role_perm.get_role_display()}")
        
        # Display permissions
        print(f"   Folder Permissions:")
        print(f"     - Create Folder: {'✓' if permissions['can_create_folder'] else '✗'}")
        print(f"     - Add Member: {'✓' if permissions['can_add_member'] else '✗'}")
        print(f"     - Edit Folder: {'✓' if permissions['can_edit_folder'] else '✗'}")
        print(f"     - Add Proof: {'✓' if permissions['can_add_proof'] else '✗'}")
        print(f"     - Delete Folder: {'✓' if permissions['can_delete_folder'] else '✗'}")
        print(f"   Inside Folder Permissions:")
        print(f"     - Delete Proof: {'✓' if permissions['can_delete_proof_in_folder'] else '✗'}")
        print(f"   Proof Preview Permissions:")
        print(f"     - ProofiePlus: {'✓' if permissions['can_use_proofieplus'] else '✗'}")
        print(f"     - Add Comment: {'✓' if permissions['can_add_comment'] else '✗'}")
        print(f"     - Delete Proof: {'✓' if permissions['can_delete_proof_in_preview'] else '✗'}")
        print(f"     - Make Decisions: {'✓' if permissions['can_make_decisions'] else '✗'}")
        print()
    
    print("🎉 Role permissions populated successfully!")
    print("\n📝 Next steps:")
    print("1. Existing users will get permissions applied when their role changes")
    print("2. New users will automatically get Lite User permissions")
    print("3. You can customize permissions in Django Admin:")
    print("   - Workflows → Role Permissions (for role defaults)")
    print("   - Accounts → Users → Individual User (for user-specific permissions)")

if __name__ == '__main__':
    populate_role_permissions()
