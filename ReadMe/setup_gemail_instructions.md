# Gmail Setup for Email Verification

## Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/
2. Click on "Security"
3. Enable "2-Step Verification"

## Step 2: Create App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" for the app
3. Select "Other (Custom name)" and name it "Proofie"
4. Click "Generate"
5. Copy the 16-character password (without spaces)

## Step 3: Update .env file
Replace these lines in your .env file:
```
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

With:
```
EMAIL_HOST_USER=your-actual-gmail@gmail.com
EMAIL_HOST_PASSWORD=the-16-character-app-password
```

## Step 4: Restart Django Server
```bash
# Stop current server (Ctrl+C)
# Restart to pick up new .env settings
python manage.py runserver
```

## Step 5: Test Email Registration
1. Register a new user with your real email
2. Check your Gmail inbox (including spam folder)
3. You should receive the verification email

## Alternative: Use Outlook/Hotmail
```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@outlook.com
EMAIL_HOST_PASSWORD=your-password
```

## Alternative: Use SendGrid (Recommended for Production)
1. Sign up at https://sendgrid.com/
2. Get API key
3. Update settings:
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
```

## Troubleshooting
- If you get "SMTPAuthenticationError": Check app password
- If you get "Connection refused": Check firewall/internet
- If email goes to spam: Check SPF/DKIM settings
