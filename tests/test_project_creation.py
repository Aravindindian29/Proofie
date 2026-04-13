#!/usr/bin/env python3
"""
Simple test script to verify that project creation works without proof_family_id error
"""
import os
import sys
import django
import requests

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.versioning.models import Project

def test_project_creation():
    """Test that we can create a project without proof_family_id error"""
    print("Testing project creation...")
    
    try:
        # Get or create a test user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@example.com', 'is_active': True}
        )
        if created:
            user.set_password('testpass123')
            user.save()
            print(f"Created test user: {user.username}")
        else:
            print(f"Using existing test user: {user.username}")
        
        # Try to create a project
        project = Project.objects.create(
            name='Test Project',
            description='Test project for verifying proof_family_id removal',
            owner=user
        )
        
        print(f"✅ Successfully created project: {project.name} (ID: {project.id})")
        print(f"   Share token: {project.share_token}")
        print(f"   Created at: {project.created_at}")
        
        # Clean up
        project.delete()
        print("✅ Test completed successfully - no proof_family_id constraint error!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating project: {e}")
        return False

if __name__ == '__main__':
    success = test_project_creation()
    sys.exit(0 if success else 1)
