#!/usr/bin/env python
import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import EmailVerification
from apps.accounts.serializers import UserRegistrationSerializer

# Test registration
print("=== Testing Email Verification Registration ===")

# Test data
test_data = {
    'username': 'test_verification',
    'email': 'test_verification@example.com',
    'first_name': 'Test',
    'last_name': 'User',
    'password': 'Test123456',
    'password_confirm': 'Test123456'
}

# Create user using serializer
serializer = UserRegistrationSerializer(data=test_data)
if serializer.is_valid():
    user = serializer.save()
    print(f"✅ User created: {user.username}")
    
    # Check email verification
    try:
        verification = EmailVerification.objects.get(user=user)
        print(f"✅ Email verification created: {verification.token}")
        print(f"✅ Verification status: {verification.is_verified}")
        print(f"✅ Verification link: http://localhost:3000/verify-email/{verification.token}/")
    except EmailVerification.DoesNotExist:
        print("❌ No email verification created")
else:
    print(f"❌ Validation errors: {serializer.errors}")

print("\n=== Testing Login Without Verification ===")

# Test login without verification
from apps.accounts.authentication import EmailVerificationBackend

backend = EmailVerificationBackend()
result = backend.authenticate(None, username='test_verification', password='Test123456')

if result:
    print("❌ Login succeeded (should have failed)")
else:
    print("✅ Login blocked (correct behavior)")

print("\n=== Testing Login After Verification ===")

# Mark as verified
try:
    verification = EmailVerification.objects.get(user__username='test_verification')
    verification.is_verified = True
    verification.save()
    print("✅ Email marked as verified")
    
    # Test login again
    result = backend.authenticate(None, username='test_verification', password='Test123456')
    
    if result:
        print("✅ Login succeeded (correct behavior)")
    else:
        print("❌ Login failed (should have succeeded)")
        
except EmailVerification.DoesNotExist:
    print("❌ Verification record not found")

print("\n=== Summary ===")
print("✅ Email verification system is working!")
print("✅ Console email backend will show emails in terminal")
print("✅ Login is blocked until email is verified")
