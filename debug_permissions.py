#!/usr/bin/env python
"""
Test script to debug the permission display issue
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
from django.contrib.admin.sites import site

def debug_permissions_display():
    print("=== Debugging Permissions Display ===\n")
    
    # Get user and profile
    try:
        user = User.objects.get(username='Aravind')
        profile = user.profile
        print(f"✅ Found user: {user.username}")
        
        # Create admin inline instance
        inline = UserProfileInline(UserProfile, site)
        
        # Check the fieldsets
        fieldsets = inline.get_fieldsets(request=None, obj=profile)
        print(f"✅ Fieldsets: {len(fieldsets)}")
        
        for i, (name, config) in enumerate(fieldsets):
            print(f"\n📋 Fieldset {i}: {name}")
            print(f"  Fields: {config.get('fields', 'N/A')}")
            print(f"  Classes: {config.get('classes', 'N/A')}")
            print(f"  Description: {config.get('description', 'N/A')}")
            
            # Check if this is the permissions fieldset
            if name == 'Permissions' and 'permissions-horizontal' in config.get('classes', []):
                print(f"  ✅ This is the permissions fieldset!")
                
                # Show the field structure
                fields = config.get('fields', [])
                for j, field_group in enumerate(fields):
                    print(f"    Field Group {j}: {field_group}")
                    if isinstance(field_group, tuple):
                        for k, field_name in enumerate(field_group):
                            try:
                                field = profile._meta.get_field(field_name)
                                print(f"      {k}: {field_name} -> {field.verbose_name}")
                            except:
                                print(f"      {k}: {field_name} -> (field not found)")
        
        # Now let's create a simple test to see the actual HTML structure
        print(f"\n🔍 Testing HTML structure...")
        
        # Create a simple form to see the structure
        from django import forms
        from django.forms import ModelForm
        
        class UserProfileForm(ModelForm):
            class Meta:
                model = UserProfile
                fields = '__all__'
        
        form = UserProfileForm(instance=profile)
        
        # Check each field
        print(f"Form fields: {list(form.fields.keys())}")
        
        permission_fields = [
            'can_create_folder', 'can_add_member', 'can_edit_folder', 'can_add_proof', 'can_delete_folder',
            'can_add_proof_in_folder', 'can_delete_proof_in_folder',
            'can_use_proofieplus', 'can_add_comment', 'can_delete_proof_in_preview'
        ]
        
        print(f"\n📋 Permission Fields:")
        for field_name in permission_fields:
            if field_name in form.fields:
                field = form.fields[field_name]
                print(f"  ✅ {field_name}: {field.label}")
            else:
                print(f"  ❌ {field_name}: NOT FOUND")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_permissions_display()
