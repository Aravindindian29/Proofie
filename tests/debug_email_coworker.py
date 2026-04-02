"""
Debug script for coworker to test email configuration
Run this to verify email setup is working correctly
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings
import traceback

print("=" * 60)
print("PROOFIE EMAIL CONFIGURATION DEBUG")
print("=" * 60)

# Step 1: Check environment variables
print("\n1. CHECKING .ENV SETTINGS:")
print("-" * 60)
print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
print(f"EMAIL_HOST_PASSWORD: {settings.EMAIL_HOST_PASSWORD[:4]}... (first 4 chars)")
print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

# Step 2: Verify password format
print("\n2. CHECKING PASSWORD FORMAT:")
print("-" * 60)
password = settings.EMAIL_HOST_PASSWORD
print(f"Password length: {len(password)}")
print(f"Has spaces: {' ' in password}")
print(f"Password format: {password}")

if len(password) != 19:  # 16 chars + 3 spaces
    print("⚠️  WARNING: Password should be 19 characters (16 letters + 3 spaces)")
    print("   Expected format: 'xxxx xxxx xxxx xxxx'")
else:
    print("✅ Password length looks correct")

# Step 3: Check if correct email
print("\n3. CHECKING EMAIL ADDRESS:")
print("-" * 60)
if settings.EMAIL_HOST_USER == "proofie.adf@gmail.com":
    print("✅ Email address is correct: proofie.adf@gmail.com")
else:
    print(f"❌ Email address is wrong: {settings.EMAIL_HOST_USER}")
    print("   Should be: proofie.adf@gmail.com")

# Step 4: Test email sending
print("\n4. TESTING EMAIL SEND:")
print("-" * 60)
test_email = input("Enter your email address to test: ").strip()

if not test_email:
    print("❌ No email provided, skipping test")
else:
    try:
        print(f"Sending test email to: {test_email}")
        result = send_mail(
            subject='Proofie Email Test - Coworker Setup',
            message='If you receive this email, your email configuration is working correctly!',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[test_email],
            fail_silently=False,
        )
        print(f"✅ EMAIL SENT SUCCESSFULLY! Result: {result}")
        print(f"   Check {test_email} for the test email")
    except Exception as e:
        print(f"❌ EMAIL FAILED!")
        print(f"   Error: {e}")
        print("\nFull error details:")
        traceback.print_exc()
        
        # Provide specific help based on error
        error_str = str(e).lower()
        if 'authentication' in error_str or 'username' in error_str or 'password' in error_str:
            print("\n🔧 FIX: Authentication failed - check password")
            print("   1. Verify password is exactly: wgxw qbuf gbft nwrm")
            print("   2. Check for extra spaces or missing spaces")
            print("   3. Restart Django server after fixing")
        elif 'connection' in error_str or 'refused' in error_str:
            print("\n🔧 FIX: Connection failed - check network/firewall")
            print("   1. Check internet connection")
            print("   2. Check firewall settings")
            print("   3. Try different network")
        elif 'tls' in error_str or 'ssl' in error_str:
            print("\n🔧 FIX: TLS/SSL issue")
            print("   1. Verify EMAIL_USE_TLS=True in .env")
            print("   2. Check EMAIL_PORT=587 in .env")

# Step 5: Check registration email function
print("\n5. CHECKING REGISTRATION EMAIL FUNCTION:")
print("-" * 60)
try:
    from apps.accounts.services import EmailService
    print("✅ EmailService imported successfully")
    
    # Test if we can create instance
    email_service = EmailService()
    print("✅ EmailService instance created")
    
    print("\nRegistration email will use:")
    print(f"   From: {settings.DEFAULT_FROM_EMAIL}")
    print(f"   Subject: 'Verify your Proofie account'")
    
except Exception as e:
    print(f"❌ Error importing EmailService: {e}")

print("\n" + "=" * 60)
print("DEBUG COMPLETE")
print("=" * 60)
print("\nIf email test passed (✅), your setup is correct!")
print("If email test failed (❌), check the error messages above.")
print("\nNext steps:")
print("1. Fix any issues shown above")
print("2. Restart Django server")
print("3. Try registration again")
print("=" * 60)
