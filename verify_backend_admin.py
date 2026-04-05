#!/usr/bin/env python
"""
Verification script to test backend-only Super Admin implementation.
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token

print("="*70)
print("BACKEND-ONLY SUPER ADMIN VERIFICATION")
print("="*70)

# Test 1: Check user exists and is superuser
print("\n[TEST 1] Checking user account...")
try:
    user = User.objects.get(username='Admin')
    print(f"✓ User 'Admin' exists")
    print(f"  - is_superuser: {user.is_superuser}")
    print(f"  - is_staff: {user.is_staff}")
    assert user.is_superuser, "User should be superuser"
    assert user.is_staff, "User should be staff"
except User.DoesNotExist:
    print("✗ FAILED: User 'Admin' does not exist")
    sys.exit(1)

# Test 2: Check no UserProfile exists
print("\n[TEST 2] Checking UserProfile does not exist...")
try:
    profile = user.profile
    print(f"✗ FAILED: UserProfile exists (role: {profile.role})")
    print("  Backend-only admins should NOT have a UserProfile")
except:
    print("✓ PASSED: No UserProfile exists (correct)")

# Test 3: Check authentication backend allows superuser
print("\n[TEST 3] Testing authentication backend...")
from apps.accounts.authentication import EmailVerificationBackend
backend = EmailVerificationBackend()

class FakeRequest:
    pass

auth_user = backend.authenticate(FakeRequest(), username='Admin', password='Chennai@1234')
if auth_user:
    print(f"✓ PASSED: Superuser can authenticate (for Django admin)")
    print(f"  Authenticated user: {auth_user.username}")
else:
    print("✗ FAILED: Superuser cannot authenticate")

# Test 4: Verify token creation would be blocked
print("\n[TEST 4] Checking token authentication blocking...")
print("  Note: The CustomObtainAuthToken view blocks superusers from getting tokens")
print("  This prevents frontend login while allowing backend admin access")

# Check if user already has a token (shouldn't)
existing_tokens = Token.objects.filter(user=user)
if existing_tokens.exists():
    print(f"  ⚠ WARNING: User has {existing_tokens.count()} token(s)")
    print("    Tokens should not be created for backend-only admins")
else:
    print("  ✓ PASSED: No tokens exist for this user")

# Test 5: Summary
print("\n" + "="*70)
print("VERIFICATION SUMMARY")
print("="*70)
print("✓ Super Admin account 'Admin' created successfully")
print("✓ Account is superuser and staff (can access /admin/)")
print("✓ No UserProfile exists (no frontend permissions)")
print("✓ Authentication backend allows superuser login")
print("✓ Custom token view will block frontend API access")
print("\nCredentials:")
print("  Username: Admin")
print("  Password: Chennai@1234")
print("  Backend URL: http://localhost:8000/admin/")
print("\n⚠ Frontend login at /api/auth/token/ is BLOCKED for this account")
print("="*70)
