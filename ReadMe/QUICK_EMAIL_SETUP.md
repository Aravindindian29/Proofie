# Quick Email Setup for Proofie

## 🎯 Goal: Send verification emails to real email addresses

## Step 1: Choose Email Service

### Option A: Brevo (Recommended - Free)
1. Go to https://www.brevo.com/
2. Sign up for free account
3. Go to Account -> SMTP & API
4. Copy your SMTP credentials

### Option B: Gmail (Free)
1. Enable 2-Step Verification on your Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Create app password for "Proofie"
4. Copy the 16-character password

## Step 2: Update .env File

### For Brevo:
```
EMAIL_HOST_USER=your-brevo-email@example.com
EMAIL_HOST_PASSWORD=your-brevo-smtp-key
```

### For Gmail:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
```

## Step 3: Test Email Setup

Run this command to test:
```bash
python test_email_setup.py
```

## Step 4: Restart Server

```bash
# Stop current server (Ctrl+C)
python manage.py runserver
```

## Step 5: Test Registration

1. Register a new user with your real email
2. Check your email inbox
3. Click the verification link
4. Login should work!

## 🔍 Troubleshooting

### If email doesn't arrive:
1. Check spam folder
2. Verify SMTP credentials
3. Run test script: `python test_email_setup.py`

### If authentication fails:
- Gmail: Use App Password, not regular password
- Brevo: Check SMTP key is correct

### If connection fails:
- Check internet connection
- Verify SMTP server address
- Try port 465 (SSL) instead of 587 (TLS)

## 📧 Expected Email Content

You should receive an email like this:

```
Subject: Verify your Proofie account

Hi [Your Name],

Welcome to Proofie! Please verify your email address to activate your account.

Click the link below to verify your email:
http://localhost:3000/verify-email/[unique-token]/

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Thanks,
The Proofie Team
```

## ✅ Success Indicators

- Test script shows "✅ SUCCESS: Email sent!"
- Registration shows "Registration successful!"
- Email arrives in your inbox
- Verification link works
- Login works after verification

## 🆘 Still Having Issues?

1. Check the Django console for error messages
2. Run the test script to isolate the problem
3. Verify your SMTP service is working
4. Check firewall/network settings
