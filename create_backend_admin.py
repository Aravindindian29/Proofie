#!/usr/bin/env python
"""
Script to create a backend-only Super Admin account.
This account can only access the Django admin panel at /admin/
and is blocked from frontend login.
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

# Create or get superuser
username = 'Admin'
email = 'admin@proofie.com'
password = 'Chennai@1234'

try:
    user = User.objects.get(username=username)
    print(f'✓ Superuser "{username}" already exists')
    print(f'  - is_superuser: {user.is_superuser}')
    print(f'  - is_staff: {user.is_staff}')
    
    # Check if user has a profile (shouldn't have one)
    try:
        profile = user.profile
        print(f'  ⚠ WARNING: User has a UserProfile (should not have one for backend-only access)')
        print(f'    Profile role: {profile.role}')
    except:
        print(f'  ✓ No UserProfile (correct - backend-only access)')
    
except User.DoesNotExist:
    user = User.objects.create_superuser(
        username=username, 
        email=email, 
        password=password
    )
    print(f'✓ Created superuser: {username}')
    print(f'  - is_superuser: {user.is_superuser}')
    print(f'  - is_staff: {user.is_staff}')
    
    # Verify no profile was created
    try:
        profile = user.profile
        print(f'  ⚠ WARNING: UserProfile was created (should not happen)')
    except:
        print(f'  ✓ No UserProfile created (correct - backend-only access)')

print(f'\n{"="*60}')
print(f'Backend Admin Credentials:')
print(f'{"="*60}')
print(f'Username: {username}')
print(f'Password: {password}')
print(f'Admin URL: http://localhost:8000/admin/')
print(f'\n⚠ This account is BLOCKED from frontend login at /api/auth/token/')
print(f'  It can ONLY access the Django admin panel.')
print(f'{"="*60}')
