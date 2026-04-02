#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

# Create or get superuser
username = 'Admin'
email = 'admin@proofie.com'
password = 'Chennai@1234'

try:
    user = User.objects.get(username=username)
    print(f'Superuser {username} already exists')
except User.DoesNotExist:
    user = User.objects.create_superuser(username=username, email=email, password=password)
    print(f'Created superuser: {username}')

print(f'Login credentials:')
print(f'Username: {username}')
print(f'Password: {password}')
print(f'Admin URL: http://localhost:8000/admin/')
