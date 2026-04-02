#!/usr/bin/env python
"""
Setup script for real email delivery
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_current_config():
    print("=== Current Email Configuration ===")
    print(f"Backend: {settings.EMAIL_BACKEND}")
    print(f"Host: {settings.EMAIL_HOST}")
    print(f"Port: {settings.EMAIL_PORT}")
    print(f"TLS: {settings.EMAIL_USE_TLS}")
    print(f"User: {settings.EMAIL_HOST_USER}")
    print(f"Password Set: {'Yes' if settings.EMAIL_HOST_PASSWORD else 'No'}")
    
def setup_mailtrap():
    """Setup Mailtrap for email testing"""
    print("\n=== Setting up Mailtrap ===")
    print("1. Go to https://mailtrap.io/")
    print("2. Sign up for free account")
    print("3. Go to SMTP Settings -> Integration")
    print("4. Copy your username and password")
    
    # Example credentials (you need to replace these)
    mailtrap_user = "your-mailtrap-username"  # Replace with real
    mailtrap_pass = "your-mailtrap-password"  # Replace with real
    
    # Update .env file
    env_content = f"""
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

DATABASE_URL=sqlite:///db.sqlite3

REDIS_URL=redis://localhost:6379/0

# Email Configuration for Mailtrap (Free testing)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USE_TLS=False
EMAIL_HOST_USER={mailtrap_user}
EMAIL_HOST_PASSWORD={mailtrap_pass}
DEFAULT_FROM_EMAIL=noreply@proofie.com

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=us-east-1
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ .env file updated with Mailtrap configuration")
    print("🔄 Please restart Django server to apply changes")

def test_email_sending():
    """Test email sending with current configuration"""
    print("\n=== Testing Email Sending ===")
    
    try:
        result = send_mail(
            'Proofie Test Email',
            '''
This is a test email from Proofie to verify email configuration.

If you receive this email, your setup is working correctly!

You can now:
1. Register new users
2. They will receive verification emails
3. Email verification will work properly

Thanks,
Proofie Team
            ''',
            settings.DEFAULT_FROM_EMAIL,
            ['test@example.com'],  # Test email address
            fail_silently=False,
        )
        
        print(f"✅ SUCCESS: Email sent! (Result: {result})")
        print("📧 Check your email service inbox for the test email")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        
        # Provide specific help
        if "535" in str(e) or "Authentication" in str(e):
            print("\n🔧 Fix: Check your username/password")
            print("   - For Mailtrap: Use credentials from SMTP Settings")
            
        if "Connection refused" in str(e):
            print("\n🔧 Fix: Check SMTP server and port")
            print("   - Mailtrap uses smtp.mailtrap.io:2525")
            
        return False

def main():
    print("🚀 Proofie Email Setup Assistant")
    print("=" * 50)
    
    test_current_config()
    
    choice = input("\nChoose option:\n1. Test current email setup\n2. Setup Mailtrap\n3. Setup Gmail\nEnter choice (1-3): ")
    
    if choice == "1":
        test_email_sending()
    elif choice == "2":
        setup_mailtrap()
        print("\n📝 Next steps:")
        print("1. Get Mailtrap credentials from https://mailtrap.io/")
        print("2. Update .env with real credentials")
        print("3. Restart Django server")
        print("4. Run this script again to test")
    elif choice == "3":
        print("\n📧 Gmail Setup Instructions:")
        print("1. Enable 2-Step Verification on your Gmail")
        print("2. Go to https://myaccount.google.com/apppasswords")
        print("3. Create App Password for 'Proofie'")
        print("4. Update .env with your Gmail and app password")
        print("5. Change EMAIL_HOST to smtp.gmail.com")
        print("6. Change EMAIL_PORT to 587")
        print("7. Set EMAIL_USE_TLS to True")
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()
