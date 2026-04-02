#!/usr/bin/env python
"""
Quick Email Service Setup for Proofie
This script will help you configure email service for registration verification
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def create_env_file():
    """Create .env file with email configuration"""
    env_content = """
# Django Configuration
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Database Configuration
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Email Configuration - Choose ONE of the options below

# OPTION 1: Console Backend (for development/testing - no real emails sent)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@proofie.com
SUPPORT_EMAIL=support@proofie.com
TEST_EMAIL=test@proofie.com

# OPTION 2: Elastic Email (Free - 100 emails/day)
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.elasticemail.com
# EMAIL_PORT=2525
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your-elastic-email
# EMAIL_HOST_PASSWORD=your-elastic-password
# DEFAULT_FROM_EMAIL=noreply@proofie.com

# OPTION 3: Gmail (for testing - use app password)
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your-gmail@gmail.com
# EMAIL_HOST_PASSWORD=your-app-password
# DEFAULT_FROM_EMAIL=your-gmail@gmail.com

# AWS Configuration (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=us-east-1
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print("✅ .env file created with email configuration")
    print("📝 Next steps:")
    print("1. Edit .env file to choose your email service")
    print("2. Uncomment and configure your chosen email service")
    print("3. Restart Django server")
    print("4. Test registration")

def test_email_setup():
    """Test current email configuration"""
    from apps.accounts.services import EmailService
    
    print("\n=== Testing Email Configuration ===")
    result = EmailService.test_email_configuration()
    
    if result['success']:
        print(f"✅ SUCCESS: {result['message']}")
    else:
        print(f"❌ FAILED: {result['message']}")
        print("\n💡 Troubleshooting tips:")
        print("1. Check your internet connection")
        print("2. Verify SMTP credentials in .env file")
        print("3. Ensure email service is active")
        print("4. Try using console backend for testing")

def setup_elastic_email():
    """Quick setup for Elastic Email"""
    print("\n🚀 Setting up Elastic Email...")
    print("1. Go to https://elasticemail.com/")
    print("2. Sign up for free account")
    print("3. Go to Settings → SMTP")
    print("4. Copy your SMTP credentials")
    
    username = input("\nEnter your Elastic Email username: ").strip()
    password = input("Enter your Elastic Email password: ").strip()
    
    if username and password:
        # Update .env file
        env_content = f"""
# Django Configuration
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Database Configuration
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Email Configuration - Elastic Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.elasticemail.com
EMAIL_PORT=2525
EMAIL_USE_TLS=True
EMAIL_HOST_USER={username}
EMAIL_HOST_PASSWORD={password}
DEFAULT_FROM_EMAIL=noreply@proofie.com
SUPPORT_EMAIL=support@proofie.com
TEST_EMAIL=test@proofie.com

# AWS Configuration
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=us-east-1
"""
        
        with open('.env', 'w') as f:
            f.write(env_content)
        
        print("✅ Elastic Email configuration saved to .env")
        print("🔄 Please restart Django server and test registration")

def main():
    print("🚀 Proofie Email Service Setup")
    print("=" * 40)
    
    print("\nChoose an option:")
    print("1. Create .env file with email templates")
    print("2. Test current email configuration")
    print("3. Quick setup with Elastic Email")
    print("4. Setup with Gmail (app password)")
    print("5. Use console backend (no real emails)")
    
    choice = input("\nEnter your choice (1-5): ").strip()
    
    if choice == "1":
        create_env_file()
    elif choice == "2":
        test_email_setup()
    elif choice == "3":
        setup_elastic_email()
    elif choice == "4":
        print("\n📧 Gmail Setup Instructions:")
        print("1. Enable 2-factor authentication on your Gmail account")
        print("2. Go to Google Account settings → Security")
        print("3. Generate an App Password")
        print("4. Use the app password in your .env file")
        print("\nUpdate your .env file with:")
        print("EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend")
        print("EMAIL_HOST=smtp.gmail.com")
        print("EMAIL_PORT=587")
        print("EMAIL_USE_TLS=True")
        print("EMAIL_HOST_USER=your-gmail@gmail.com")
        print("EMAIL_HOST_PASSWORD=your-app-password")
    elif choice == "5":
        print("\n📝 Console Backend Setup:")
        print("This will print emails to console instead of sending them.")
        print("Add to your .env file:")
        print("EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend")
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()
