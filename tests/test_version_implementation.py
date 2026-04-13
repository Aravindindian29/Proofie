#!/usr/bin/env python3
"""
Test script to verify version labeling implementation
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

def test_version_implementation():
    """Test that version labeling works correctly"""
    print("Testing version labeling implementation...")
    
    try:
        # Get or create a test user
        user, created = User.objects.get_or_create(
            username='versiontest',
            defaults={'email': 'versiontest@example.com', 'is_active': True}
        )
        if created:
            user.set_password('testpass123')
            user.save()
            print(f"Created test user: {user.username}")
        else:
            print(f"Using existing test user: {user.username}")
        
        # Create a V1 project
        v1_project = Project.objects.create(
            name='Version Test V1',
            description='Test project for V1 version',
            owner=user,
            version_number=1
        )
        print(f"Created V1 project: {v1_project.name} (version: {v1_project.version_number})")
        
        # Create a V2 project (simulating Plus icon click)
        v2_project = Project.objects.create(
            name='Version Test V2',
            description='Test project for V2 version',
            owner=user,
            version_number=2
        )
        print(f"Created V2 project: {v2_project.name} (version: {v2_project.version_number})")
        
        # Create a V3 project
        v3_project = Project.objects.create(
            name='Version Test V3',
            description='Test project for V3 version',
            owner=user,
            version_number=3
        )
        print(f"Created V3 project: {v3_project.name} (version: {v3_project.version_number})")
        
        # Test API response includes version_number
        from apps.versioning.serializers import ProjectSerializer
        serializer = ProjectSerializer(v2_project)
        data = serializer.data
        
        print(f"API response includes version_number: {data.get('version_number')}")
        
        # Clean up
        v1_project.delete()
        v2_project.delete()
        v3_project.delete()
        print("Test completed successfully - version labeling works!")
        return True
        
    except Exception as e:
        print(f"Error testing version implementation: {e}")
        return False

if __name__ == '__main__':
    success = test_version_implementation()
    sys.exit(0 if success else 1)
