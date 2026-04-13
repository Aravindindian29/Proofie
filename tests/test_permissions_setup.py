#!/usr/bin/env python
"""
Test script to verify the permission display setup in Django admin
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import UserProfile
from apps.accounts.admin import UserProfileInline

def test_permission_setup():
    print("=== Testing Permission Display Setup ===\n")
    
    # Check if user exists
    try:
        user = User.objects.get(username='Aravind')
        print(f"✅ Found user: {user.username}")
        
        # Check if user profile exists
        try:
            profile = user.profile
            print(f"✅ Found user profile for: {user.username}")
            
            # Check permission fields
            folder_fields = [
                'can_create_folder', 'can_add_member', 'can_edit_folder', 
                'can_add_proof', 'can_delete_folder'
            ]
            folder_tray_fields = ['can_add_proof_in_folder', 'can_delete_proof_in_folder']
            proof_preview_fields = ['can_use_proofieplus', 'can_add_comment', 'can_delete_proof_in_preview']
            
            print("\n📁 Folder Permissions:")
            for field in folder_fields:
                if hasattr(profile, field):
                    value = getattr(profile, field)
                    verbose_name = profile._meta.get_field(field).verbose_name
                    print(f"  ✅ {field}: {verbose_name} = {value}")
                else:
                    print(f"  ❌ {field}: MISSING")
            
            print("\n📂 Folder Tray Permissions:")
            for field in folder_tray_fields:
                if hasattr(profile, field):
                    value = getattr(profile, field)
                    verbose_name = profile._meta.get_field(field).verbose_name
                    print(f"  ✅ {field}: {verbose_name} = {value}")
                else:
                    print(f"  ❌ {field}: MISSING")
            
            print("\n👁️ Proof Preview Permissions:")
            for field in proof_preview_fields:
                if hasattr(profile, field):
                    value = getattr(profile, field)
                    verbose_name = profile._meta.get_field(field).verbose_name
                    print(f"  ✅ {field}: {verbose_name} = {value}")
                else:
                    print(f"  ❌ {field}: MISSING")
            
        except UserProfile.DoesNotExist:
            print(f"❌ No user profile found for: {user.username}")
            
    except User.DoesNotExist:
        print(f"❌ User 'Aravind' not found")
    
    # Check admin configuration
    print("\n=== Admin Configuration Check ===")
    
    # Check fieldsets from class definition
    if hasattr(UserProfileInline, 'fieldsets'):
        print("✅ UserProfileInline has fieldsets configured")
        
        fieldsets = UserProfileInline.fieldsets
        for fieldset_name, fieldset_config in fieldsets:
            print(f"\n📋 Fieldset: {fieldset_name}")
            if 'fields' in fieldset_config:
                fields = fieldset_config['fields']
                print(f"  Fields: {fields}")
            if 'classes' in fieldset_config:
                classes = fieldset_config['classes']
                print(f"  Classes: {classes}")
                if 'permissions-horizontal' in classes:
                    print("  ✅ permissions-horizontal class found")
    else:
        print("❌ UserProfileInline fieldsets not configured")
    
    # Check Media configuration from class
    if hasattr(UserProfileInline, 'Media'):
        media = UserProfileInline.Media()
        if hasattr(media, 'css') and 'admin/css/permissions_layout.css' in media.css.get('all', []):
            print("✅ CSS file configured in Media")
        else:
            print("❌ CSS file not found in Media configuration")
    else:
        print("❌ Media configuration not found")
    
    print("\n=== Template Check ===")
    template_path = "templates/admin/auth/user/change_form.html"
    if os.path.exists(template_path):
        print(f"✅ Template exists: {template_path}")
        with open(template_path, 'r') as f:
            content = f.read()
            if 'permission-category-label' in content:
                print("✅ JavaScript for category labels found in template")
            else:
                print("❌ JavaScript for category labels not found in template")
            if 'permissions-horizontal' in content:
                print("✅ Permissions fieldset reference found in template")
            else:
                print("❌ Permissions fieldset reference not found in template")
    else:
        print(f"❌ Template not found: {template_path}")
    
    print("\n=== CSS Check ===")
    css_path = "static/admin/css/permissions_layout.css"
    if os.path.exists(css_path):
        print(f"✅ CSS file exists: {css_path}")
        with open(css_path, 'r') as f:
            content = f.read()
            if 'permission-category-label' in content:
                print("✅ Category label styling found in CSS")
            else:
                print("❌ Category label styling not found in CSS")
            if 'permissions-horizontal' in content:
                print("✅ Permissions horizontal styling found in CSS")
            else:
                print("❌ Permissions horizontal styling not found in CSS")
    else:
        print(f"❌ CSS file not found: {css_path}")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_permission_setup()
