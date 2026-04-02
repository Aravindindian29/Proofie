#!/usr/bin/env python
"""
Management command to test email configuration and resend verification emails
"""
import os
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import django
django.setup()

from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from apps.accounts.models import EmailVerification

def test_email_configuration():
    """Test current email configuration"""
    print("=" * 60)
    print("EMAIL CONFIGURATION TEST")
    print("=" * 60)
    print(f"Backend: {settings.EMAIL_BACKEND}")
    print(f"Host: {settings.EMAIL_HOST}")
    print(f"Port: {settings.EMAIL_PORT}")
    print(f"TLS: {settings.EMAIL_USE_TLS}")
    print(f"User: {settings.EMAIL_HOST_USER}")
    print(f"Password: {'SET' if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
    print(f"From: {settings.DEFAULT_FROM_EMAIL}")
    print("=" * 60)
    
    # Test sending email
    print("\nTesting email send...")
    try:
        result = send_mail(
            'Proofie Email Test',
            '''
This is a test email from Proofie.

If you received this email, your email configuration is working correctly!

Time: Test Email
            ''',
            settings.DEFAULT_FROM_EMAIL,
            [settings.EMAIL_HOST_USER] if settings.EMAIL_HOST_USER else ['test@example.com'],
            fail_silently=False,
        )
        print(f"✅ SUCCESS: Email sent! Result: {result}")
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        print(f"\nTo fix this:")
        print("1. Get a free email service account (Mailgun, SendGrid, or Elastic Email)")
        print("2. Update .env file with real credentials")
        print("3. Restart Django server")
        return False

def resend_verification_email(username):
    """Resend verification email to a user"""
    print("\n" + "=" * 60)
    print(f"RESENDING VERIFICATION EMAIL FOR: {username}")
    print("=" * 60)
    
    try:
        user = User.objects.get(username=username)
        verification = EmailVerification.objects.get(user=user)
        
        # Generate verification link
        verification_link = f"http://localhost:3000/verify-email/{verification.token}/"
        
        # Send email
        subject = "Verify your Proofie account"
        message = f"""
Hi {user.first_name or user.username},

Welcome to Proofie! Please verify your email address to activate your account.

Click the link below to verify your email:
{verification_link}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Thanks,
The Proofie Team
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            print(f"✅ Verification email sent to: {user.email}")
            print(f"✅ Verification link: {verification_link}")
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            print(f"❌ User email: {user.email}")
            print(f"❌ Token: {verification.token}")
            
    except User.DoesNotExist:
        print(f"❌ User '{username}' not found")
    except EmailVerification.DoesNotExist:
        print(f"❌ No verification record for user '{username}'")

def list_unverified_users():
    """List all users who haven't verified their email"""
    print("\n" + "=" * 60)
    print("UNVERIFIED USERS")
    print("=" * 60)
    
    unverified = EmailVerification.objects.filter(is_verified=False)
    
    if not unverified:
        print("All users have verified their emails!")
        return
    
    for ev in unverified:
        print(f"- {ev.user.username} ({ev.user.email}) - Token: {ev.token}")

def main():
    print("\n🚀 PROOFIE EMAIL MANAGEMENT TOOL")
    print("=" * 60)
    
    # Test current configuration
    test_email_configuration()
    
    # List unverified users
    list_unverified_users()
    
    # Ask if user wants to resend verification
    print("\n" + "=" * 60)
    username = input("\nEnter username to resend verification email (or press Enter to skip): ")
    
    if username.strip():
        resend_verification_email(username.strip())
    
    print("\n" + "=" * 60)
    print("Setup Instructions:")
    print("=" * 60)
    print("""
To get real email delivery working:

1. Sign up for free email service:
   - Mailgun: https://www.mailgun.com/ (5,000 emails/month free)
   - SendGrid: https://sendgrid.com/ (100 emails/day free)
   - Elastic Email: https://elasticemail.com/ (100 emails/day free)

2. Get SMTP credentials from the service dashboard

3. Update .env file:
   EMAIL_HOST_USER=your-smtp-username
   EMAIL_HOST_PASSWORD=your-smtp-password

4. Restart Django server

5. Test by registering a new user

The verification email will be sent to the registered email address!
    """)

if __name__ == "__main__":
    main()
