# Email Configuration Guide

This guide explains how to configure email providers for Proofie.

## Supported Email Providers

Proofie supports two email providers:
1. **Gmail SMTP** - Good for development and testing
2. **SendGrid** - Recommended for production, better deliverability to corporate domains

## Configuration

### Option 1: Gmail SMTP (Default)

Add these settings to your `.env` file:

```env
# Email Provider Selection
EMAIL_PROVIDER=gmail

# Gmail Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Common Settings
FRONTEND_URL=http://localhost:3000
SUPPORT_EMAIL=support@proofie.com
TEST_EMAIL=test@proofie.com
```

**Note:** You need to generate an App Password from your Gmail account:
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Create a new app password for "Mail"
5. Use that password in `EMAIL_HOST_PASSWORD`

### Option 2: SendGrid (Recommended for Production)

Add these settings to your `.env` file:

```env
# Email Provider Selection
EMAIL_PROVIDER=sendgrid

# SendGrid Configuration
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=proofie.adf@gmail.com
SENDGRID_FROM_NAME=Proofie

# Common Settings
FRONTEND_URL=http://localhost:3000
SUPPORT_EMAIL=support@proofie.com
TEST_EMAIL=test@proofie.com
```

**How to get SendGrid API Key:**
1. Sign up at https://signup.sendgrid.com/ (Free tier: 100 emails/day)
2. Go to Settings → API Keys
3. Create a new API key with "Full Access" or "Mail Send" permission
4. Copy the API key (starts with `SG.`)
5. Verify your sender email at Settings → Sender Authentication

## Switching Between Providers

Simply change the `EMAIL_PROVIDER` value in your `.env` file:
- `EMAIL_PROVIDER=gmail` - Use Gmail SMTP
- `EMAIL_PROVIDER=sendgrid` - Use SendGrid

Then restart the backend server for changes to take effect.

## Benefits of Each Provider

### Gmail SMTP
✅ Easy to set up
✅ Works well for Gmail recipients
❌ May be blocked by corporate email servers
❌ Lower sending limits (100-500 emails/day)
❌ Emails often go to spam for corporate domains

### SendGrid
✅ Professional email service
✅ Better deliverability to corporate domains
✅ Proper SPF/DKIM authentication
✅ Free tier: 100 emails/day forever
✅ Detailed analytics and tracking
✅ Rarely blocked by corporate email servers

## Troubleshooting

### Gmail emails not received by corporate domains
- Switch to SendGrid (`EMAIL_PROVIDER=sendgrid`)
- Ask recipient to check spam folder
- Ask IT admin to whitelist your Gmail address

### SendGrid emails not sending
- Verify your sender email is verified in SendGrid dashboard
- Check API key is correct and has proper permissions
- Check SendGrid dashboard for error logs
- Ensure you're within free tier limits (100 emails/day)

## Testing Email Configuration

You can test your email configuration using the admin endpoint:
```bash
POST /api/accounts/users/test_email/
```

This will send a test email to the address specified in `TEST_EMAIL` environment variable.
