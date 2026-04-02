#!/usr/bin/env python
"""
Instant Email Setup for Proofie
This will set up working email verification immediately
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def setup_working_email():
    print("🚀 Setting up working email for Proofie...")
    print("=" * 50)
    
    # Use a temporary working solution
    print("\n📧 OPTION 1: Use Elastic Email (Free - 100 emails/day)")
    print("1. Go to https://elasticemail.com/")
    print("2. Sign up for free account")
    print("3. Go to Settings -> SMTP")
    print("4. Copy your SMTP credentials")
    
    print("\n📧 OPTION 2: Use Mailgun (Free - 1000 emails/month)")
    print("1. Go to https://www.mailgun.com/")
    print("2. Sign up for free account")
    print("3. Go to Domain Settings -> SMTP")
    print("4. Copy your SMTP credentials")
    
    print("\n📧 OPTION 3: Use SendGrid (Free - 100 emails/day)")
    print("1. Go to https://sendgrid.com/")
    print("2. Sign up for free account")
    print("3. Go to Settings -> API Keys")
    print("4. Create API key and get SMTP credentials")
    
    print("\n📧 OPTION 4: Quick Test with Any Email Service")
    print("Update your .env file with:")
    print("""
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-username
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=noreply@proofie.com
    """)
    
    choice = input("\nWhich service do you want to use? (1-4): ")
    
    if choice == "1":
        setup_elastic_email()
    elif choice == "2":
        setup_mailgun()
    elif choice == "3":
        setup_sendgrid()
    else:
        print("\n📝 Manual setup instructions provided above")

def setup_elastic_email():
    """Setup Elastic Email"""
    env_content = """
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0

# Email Configuration - Elastic Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.elasticemail.com
EMAIL_PORT=2525
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-elastic-email
EMAIL_HOST_PASSWORD=your-elastic-password
DEFAULT_FROM_EMAIL=noreply@proofie.com

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=us-east-1
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ .env updated for Elastic Email")
    print("📝 Next steps:")
    print("1. Get Elastic Email credentials from https://elasticemail.com/")
    print("2. Replace 'your-elastic-email' and 'your-elastic-password' in .env")
    print("3. Restart Django server")
    print("4. Test registration")

def setup_mailgun():
    """Setup Mailgun"""
    env_content = """
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0

# Email Configuration - Mailgun
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@your-domain.mailgun.org
EMAIL_HOST_PASSWORD=your-mailgun-password
DEFAULT_FROM_EMAIL=noreply@proofie.com

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=us-east-1
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ .env updated for Mailgun")
    print("📝 Next steps:")
    print("1. Get Mailgun credentials from https://www.mailgun.com/")
    print("2. Replace domain and password in .env")
    print("3. Restart Django server")
    print("4. Test registration")

def setup_sendgrid():
    """Setup SendGrid"""
    env_content = """
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0

# Email Configuration - SendGrid
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=YOUR_SENDGRID_API_KEY
DEFAULT_FROM_EMAIL=noreply@proofie.com

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=us-east-1
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ .env updated for SendGrid")
    print("📝 Next steps:")
    print("1. Get SendGrid API key from https://sendgrid.com/")
    print("2. Replace YOUR_SENDGRID_API_KEY in .env")
    print("3. Restart Django server")
    print("4. Test registration")

def test_email_setup():
    """Test current email setup"""
    from django.core.mail import send_mail
    from django.conf import settings
    
    print("\n=== Testing Email Setup ===")
    print(f"Backend: {settings.EMAIL_BACKEND}")
    print(f"Host: {settings.EMAIL_HOST}")
    print(f"User: {settings.EMAIL_HOST_USER}")
    
    try:
        result = send_mail(
            'Proofie Test Email',
            'This is a test email from Proofie. Email setup is working!',
            settings.DEFAULT_FROM_EMAIL,
            ['test@example.com'],
            fail_silently=False,
        )
        print(f"✅ SUCCESS: Email sent! Result: {result}")
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Proofie Instant Email Setup")
    print("=" * 40)
    
    choice = input("Choose option:\n1. Setup email service\n2. Test current setup\nEnter choice (1-2): ")
    
    if choice == "1":
        setup_working_email()
    elif choice == "2":
        test_email_setup()
    else:
        print("Invalid choice")
