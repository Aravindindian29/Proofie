import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

# Set password for existing testuser
try:
    user = User.objects.get(username='testuser')
    user.set_password('Test123456')
    user.save()
    print("✅ Password set for testuser!")
    print("Username: testuser")
    print("Password: Test123456")
    print("Email: test@example.com")
except:
    print("testuser not found")

# Also set password for admin
try:
    admin = User.objects.get(username='admin')
    admin.set_password('Admin123456')
    admin.save()
    print("\n✅ Password set for admin!")
    print("Username: admin")
    print("Password: Admin123456")
    print("Email: admin@proofie.com")
except:
    print("admin not found")
