#!/usr/bin/env python
"""
Test script to verify email configuration
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    print("=== Email Configuration Test ===")
    print(f"Backend: {settings.EMAIL_BACKEND}")
    print(f"Host: {settings.EMAIL_HOST}")
    print(f"Port: {settings.EMAIL_PORT}")
    print(f"TLS: {settings.EMAIL_USE_TLS}")
    print(f"User: {settings.EMAIL_HOST_USER}")
    print(f"Password Set: {'Yes' if settings.EMAIL_HOST_PASSWORD else 'No'}")
    print(f"From: {settings.DEFAULT_FROM_EMAIL}")
    
    print("\n=== Sending Test Email ===")
    
    try:
        result = send_mail(
            'Proofie Email Test',
            f'''
This is a test email from Proofie to verify your email configuration.

If you receive this email, your SMTP setup is working correctly!

Configuration:
- Backend: {settings.EMAIL_BACKEND}
- Host: {settings.EMAIL_HOST}
- Port: {settings.EMAIL_PORT}

Thanks,
Proofie Team
            ''',
            settings.DEFAULT_FROM_EMAIL,
            [settings.EMAIL_HOST_USER],  # Send to yourself for testing
            fail_silently=False,
        )
        
        print(f"✅ SUCCESS: Email sent! (Result: {result})")
        print("📧 Check your inbox for the test email")
        
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        print("\n🔧 Troubleshooting:")
        
        if "535" in str(e) or "Authentication" in str(e):
            print("- Check your username/password")
            print("- For Gmail: Use App Password, not regular password")
            
        if "Connection refused" in str(e):
            print("- Check your internet connection")
            print("- Verify SMTP server is correct")
            
        if "timeout" in str(e):
            print("- Check firewall settings")
            print("- Try different port (465 for SSL)")

if __name__ == "__main__":
    test_email()
