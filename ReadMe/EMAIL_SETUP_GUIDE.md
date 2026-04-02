# Proofie Email Service Setup Guide

## Overview

Proofie includes a comprehensive email notification service for user registration verification. This guide will help you set up email functionality quickly and easily.

## What's Included

### ✅ Email Service Features
- **Registration Verification**: Automatic email verification for new users
- **Welcome Emails**: Sent after successful email verification
- **Password Reset**: Secure password reset functionality
- **HTML Templates**: Professional, responsive email templates
- **Fallback Text**: Plain text versions for compatibility
- **Error Handling**: Comprehensive logging and error management
- **Service Architecture**: Clean, maintainable service-based design

### ✅ Email Templates
- `verification.html`: Professional email verification template
- `welcome.html`: Welcome email with feature highlights
- `password_reset.html`: Security-focused password reset template

## Quick Setup (5 Minutes)

### Option 1: Console Backend (Development/Testing)
```bash
python setup_email_service.py
# Choose option 1, then edit .env to use:
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Option 2: Elastic Email (Free - 100 emails/day)
```bash
python setup_email_service.py
# Choose option 3 and follow the prompts
```

### Option 3: Gmail (Testing - requires app password)
1. Enable 2-factor authentication on Gmail
2. Generate an App Password
3. Configure in .env file

## Manual Configuration

### Step 1: Create .env File
```bash
python setup_email_service.py
# Choose option 1 to create .env template
```

### Step 2: Configure Email Service
Edit `.env` file and choose ONE of the following:

#### Console Backend (Development)
```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@proofie.com
SUPPORT_EMAIL=support@proofie.com
```

#### Elastic Email (Free)
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.elasticemail.com
EMAIL_PORT=2525
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-elastic-email
EMAIL_HOST_PASSWORD=your-elastic-password
DEFAULT_FROM_EMAIL=noreply@proofie.com
```

#### Gmail (Testing)
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-gmail@gmail.com
```

### Step 3: Restart Django Server
```bash
python manage.py runserver
```

### Step 4: Test Email Configuration
```bash
python setup_email_service.py
# Choose option 2 to test email setup
```

Or use the API endpoint:
```bash
curl -X POST http://localhost:8000/api/accounts/users/test_email/ \
  -H "Authorization: Token YOUR_ADMIN_TOKEN"
```

## Email Service Architecture

### Core Components

#### 1. EmailService (`apps/accounts/services.py`)
Centralized email service with methods for:
- `send_verification_email()`
- `send_welcome_email()`
- `send_password_reset_email()`
- `test_email_configuration()`

#### 2. RegistrationService
Handles registration workflow:
- `complete_registration()`
- `verify_email()`

#### 3. Updated Views
- `UserViewSet.register()` - Uses RegistrationService
- `EmailVerificationView` - Uses RegistrationService
- `test_email` - Admin-only email testing endpoint

#### 4. Email Templates
Professional HTML templates in `templates/emails/`:
- Responsive design
- Brand-consistent styling
- Fallback to plain text

### Email Flow

#### Registration Flow
1. User registers via frontend
2. User created in database
3. EmailVerification record created
4. Verification email sent via EmailService
5. User clicks verification link
6. Email verified via RegistrationService
7. Welcome email sent
8. User can now login

#### Error Handling
- Email failures don't block registration
- Comprehensive logging
- Graceful fallbacks
- User-friendly error messages

## Testing Email Functionality

### Method 1: Setup Script
```bash
python setup_email_service.py
# Choose option 2
```

### Method 2: API Endpoint
```bash
# Login as admin first
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin-123"}'

# Test email
curl -X POST http://localhost:8000/api/accounts/users/test_email/ \
  -H "Authorization: Token YOUR_TOKEN"
```

### Method 3: Test Registration
1. Register a new user at http://localhost:3000/register
2. Check console or email for verification link
3. Click verification link
4. Verify welcome email is sent

## Email Service Providers

### Recommended Providers

#### 1. Elastic Email (Free Tier)
- **Cost**: Free (100 emails/day)
- **Setup**: Easy SMTP setup
- **Features**: Templates, analytics
- **Best for**: Development and small projects

#### 2. Mailgun (Free Tier)
- **Cost**: Free (1,000 emails/month)
- **Setup**: Domain verification required
- **Features**: Advanced analytics, routing
- **Best for**: Production applications

#### 3. SendGrid (Free Tier)
- **Cost**: Free (100 emails/day)
- **Setup**: API key setup
- **Features**: Templates, marketing
- **Best for**: Marketing emails

#### 4. Gmail (Testing Only)
- **Cost**: Free
- **Setup**: App password required
- **Features**: Basic SMTP
- **Best for**: Development testing

## Troubleshooting

### Common Issues

#### 1. Emails Not Sending
**Check:**
- Email backend configuration in .env
- SMTP credentials are correct
- Internet connection
- Email service account status

**Solution:**
```bash
python setup_email_service.py
# Choose option 2 to test configuration
```

#### 2. Verification Link Not Working
**Check:**
- FRONTEND_URL in settings
- Token generation
- Email template link format

**Solution:**
Ensure FRONTEND_URL matches your frontend URL:
```env
FRONTEND_URL=http://localhost:3000
```

#### 3. Template Errors
**Check:**
- Template files exist in `templates/emails/`
- Django template configuration
- Context variables

**Solution:**
Service includes fallback to plain text if templates fail.

#### 4. Authentication Issues
**Check:**
- EmailVerificationBackend is configured
- User has EmailVerification record
- Email verification status

**Solution:**
```python
# Check verification status
python manage.py shell
>>> from apps.accounts.models import EmailVerification
>>> EmailVerification.objects.filter(user__username='youruser', is_verified=True)
```

### Debug Mode

Enable detailed email logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Check Django logs for email sending details.

## Production Considerations

### Security
- Use environment variables for credentials
- Enable TLS/SSL for SMTP
- Monitor email sending limits
- Implement rate limiting

### Performance
- Use Celery for background email sending
- Cache email templates
- Monitor email delivery rates
- Implement retry logic

### Compliance
- Include unsubscribe links
- Honor email preferences
- Comply with GDPR/CCPA
- Maintain email sending records

## API Endpoints

### Registration
```http
POST /api/accounts/users/register/
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "securepassword123",
  "first_name": "Test",
  "last_name": "User"
}
```

### Email Verification
```http
GET /api/accounts/users/verify-email/{token}/
```

### Test Email (Admin Only)
```http
POST /api/accounts/users/test_email/
Authorization: Token YOUR_ADMIN_TOKEN
```

## Support

For email service issues:
1. Check this guide first
2. Run the setup script test
3. Check Django logs
4. Review email provider documentation
5. Contact support with error details

---

**The email service is now ready for use!** 🎉

Users will receive professional verification emails, and you can easily test and monitor email functionality through the provided tools and endpoints.
