"""
Email Services for Proofie
Handles all email-related functionality including registration verification
"""
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from .models import EmailVerification

logger = logging.getLogger(__name__)


class EmailService:
    """Centralized email service for Proofie"""
    
    @staticmethod
    def send_verification_email(user, verification):
        """
        Send email verification link to newly registered user
        
        Args:
            user: User object
            verification: EmailVerification object
            
        Returns:
            dict: Result with success status and message
        """
        try:
            # Generate verification link
            verification_link = f"{settings.FRONTEND_URL}/verify-email/{verification.token}/"
            
            # Prepare email context
            context = {
                'user': user,
                'verification_link': verification_link,
                'frontend_url': settings.FRONTEND_URL,
                'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@proofie.com'),
            }
            
            # Render email templates
            try:
                html_message = render_to_string('emails/verification.html', context)
                message = strip_tags(html_message)
            except:
                # Fallback to plain text if templates fail
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
                html_message = None
            
            # Send email
            logger.info(f"Attempting to send verification email to {user.email}")
            logger.info(f"From: {getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@proofie.com')}")
            logger.info(f"SMTP Host: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
            
            result = send_mail(
                subject='Verify your Proofie account',
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@proofie.com'),
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Verification email sent successfully to {user.email}. Result: {result}")
            return {
                'success': True,
                'message': f'Verification email sent to {user.email}',
                'result': result
            }
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {user.email}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error details: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'message': f'Failed to send verification email: {str(e)}',
                'error': str(e)
            }
    
    @staticmethod
    def send_welcome_email(user):
        """
        Send welcome email after successful email verification
        
        Args:
            user: User object
            
        Returns:
            dict: Result with success status and message
        """
        try:
            context = {
                'user': user,
                'frontend_url': settings.FRONTEND_URL,
                'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@proofie.com'),
            }
            
            # Render email templates
            try:
                html_message = render_to_string('emails/welcome.html', context)
                message = strip_tags(html_message)
            except:
                # Fallback to plain text if templates fail
                message = f"""
Hi {user.first_name or user.username},

Welcome to Proofie! Your email has been successfully verified and your account is now active.

You can now:
- Create and manage projects
- Upload and review creative assets
- Collaborate with your team
- Track approval workflows

Get started by logging in to your account at:
{settings.FRONTEND_URL}/login

If you have any questions, feel free to contact our support team.

Thanks,
The Proofie Team
                """
                html_message = None
            
            # Send email
            result = send_mail(
                subject='Welcome to Proofie!',
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@proofie.com'),
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Welcome email sent to {user.email}. Result: {result}")
            return {
                'success': True,
                'message': f'Welcome email sent to {user.email}',
                'result': result
            }
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to send welcome email: {str(e)}',
                'error': str(e)
            }
    
    @staticmethod
    def send_password_reset_email(user, reset_link):
        """
        Send password reset email
        
        Args:
            user: User object
            reset_link: Password reset link
            
        Returns:
            dict: Result with success status and message
        """
        try:
            context = {
                'user': user,
                'reset_link': reset_link,
                'frontend_url': settings.FRONTEND_URL,
                'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@proofie.com'),
            }
            
            # Render email templates
            try:
                html_message = render_to_string('emails/password_reset.html', context)
                message = strip_tags(html_message)
            except:
                # Fallback to plain text if templates fail
                message = f"""
Hi {user.username},

You requested a password reset for your Proofie account.

Click the link below to reset your password:
{reset_link}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Thanks,
The Proofie Team
                """
                html_message = None
            
            # Send email
            result = send_mail(
                subject='Reset your Proofie password',
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@proofie.com'),
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Password reset email sent to {user.email}. Result: {result}")
            return {
                'success': True,
                'message': f'Password reset email sent to {user.email}',
                'result': result
            }
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to send password reset email: {str(e)}',
                'error': str(e)
            }
    
    @staticmethod
    def test_email_configuration():
        """
        Test email configuration by sending a test email
        
        Returns:
            dict: Result with success status and message
        """
        try:
            test_email = getattr(settings, 'TEST_EMAIL', 'test@proofie.com')
            
            message = """
This is a test email from Proofie to verify that the email configuration is working correctly.

If you receive this email, it means:
✅ Email backend is configured correctly
✅ SMTP connection is working
✅ Authentication is successful

Email Configuration Details:
- Backend: {backend}
- Host: {host}
- Port: {port}
- User: {user}

Thanks,
The Proofie Team
            """.format(
                backend=settings.EMAIL_BACKEND,
                host=getattr(settings, 'EMAIL_HOST', 'Not configured'),
                port=getattr(settings, 'EMAIL_PORT', 'Not configured'),
                user=getattr(settings, 'EMAIL_HOST_USER', 'Not configured'),
            )
            
            result = send_mail(
                subject='Proofie Email Configuration Test',
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@proofie.com'),
                recipient_list=[test_email],
                fail_silently=False,
            )
            
            logger.info(f"Test email sent successfully to {test_email}. Result: {result}")
            return {
                'success': True,
                'message': f'Test email sent successfully to {test_email}',
                'result': result
            }
            
        except Exception as e:
            logger.error(f"Email configuration test failed: {str(e)}")
            return {
                'success': False,
                'message': f'Email configuration test failed: {str(e)}',
                'error': str(e)
            }


class RegistrationService:
    """Service for handling user registration and email verification"""
    
    @staticmethod
    def complete_registration(user):
        """
        Complete the registration process by sending verification email
        
        Args:
            user: User object
            
        Returns:
            dict: Result with success status and message
        """
        try:
            # Get or create email verification
            verification, created = EmailVerification.objects.get_or_create(
                user=user,
                defaults={'token': default_token_generator.make_token(user)}
            )
            
            if not created and verification.is_verified:
                return {
                    'success': True,
                    'message': 'Email already verified',
                    'verified': True
                }
            
            # Send verification email
            email_result = EmailService.send_verification_email(user, verification)
            
            return {
                'success': email_result['success'],
                'message': email_result['message'],
                'verified': False,
                'email_sent': email_result['success']
            }
            
        except Exception as e:
            logger.error(f"Registration completion failed for user {user.username}: {str(e)}")
            return {
                'success': False,
                'message': f'Registration completion failed: {str(e)}',
                'error': str(e)
            }
    
    @staticmethod
    def verify_email(token):
        """
        Verify email using token
        
        Args:
            token: Verification token
            
        Returns:
            dict: Result with success status and message
        """
        try:
            verification = EmailVerification.objects.get(token=token)
            
            if verification.is_verified:
                return {
                    'success': True,
                    'message': 'Email already verified',
                    'verified': True
                }
            
            if verification.is_expired():
                return {
                    'success': False,
                    'message': 'Verification link has expired',
                    'expired': True
                }
            
            # Mark email as verified
            verification.is_verified = True
            verification.save()
            
            # Send welcome email
            welcome_result = EmailService.send_welcome_email(verification.user)
            
            return {
                'success': True,
                'message': 'Email verified successfully! You can now login.',
                'verified': True,
                'welcome_email_sent': welcome_result['success']
            }
            
        except EmailVerification.DoesNotExist:
            return {
                'success': False,
                'message': 'Invalid verification link',
                'invalid': True
            }
        except Exception as e:
            logger.error(f"Email verification failed for token {token}: {str(e)}")
            return {
                'success': False,
                'message': f'Email verification failed: {str(e)}',
                'error': str(e)
            }
