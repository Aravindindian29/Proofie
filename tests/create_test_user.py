#!/usr/bin/env python
import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

# Create test user
try:
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='Test123456'
    )
    print("✅ Test user created successfully!")
    print("Username: testuser")
    print("Password: Test123456")
except Exception as e:
    if "already exists" in str(e):
        print("✅ Test user already exists!")
        print("Username: testuser")
        print("Password: Test123456")
    else:
        print(f"❌ Error: {e}")

# Check existing users
print("\n📋 Existing users:")
for user in User.objects.all():
    print(f"- {user.username} ({user.email})")
