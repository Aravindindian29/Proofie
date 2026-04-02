from rest_framework import viewsets, status, permissions, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from .models import UserProfile, EmailVerification
from .serializers import UserDetailSerializer, UserRegistrationSerializer, UserProfileSerializer
from .services import RegistrationService, EmailService


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.all()

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Complete registration using the service
            registration_result = RegistrationService.complete_registration(user)
            
            return Response(
                {
                    'user': UserDetailSerializer(user).data,
                    'message': registration_result['message'],
                    'email_sent': registration_result.get('email_sent', False),
                    'verified': registration_result.get('verified', False)
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def test_email(self, request):
        """Test email configuration (admin only)"""
        result = EmailService.test_email_configuration()
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            user_serializer = UserDetailSerializer(request.user)
            return Response(user_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(views.APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            # Generate reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Create reset link
            reset_link = f"http://localhost:3000/reset-password/{uid}/{token}/"
            
            # Send email
            subject = "Reset your Proofie password"
            message = f"""
Hi {user.username},

You requested a password reset for your Proofie account.

Click the link below to reset your password:
{reset_link}

If you didn't request this, please ignore this email.

Thanks,
The Proofie Team
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            return Response(
                {'message': 'Password reset link sent to your email'},
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            # Don't reveal if email exists or not
            return Response(
                {'message': 'If email exists, reset link will be sent'},
                status=status.HTTP_200_OK
            )


class PasswordResetConfirmView(views.APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')
        
        if not all([uid, token, password]):
            return Response(
                {'error': 'UID, token, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Decode user ID
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            # Verify token
            if default_token_generator.check_token(user, token):
                user.set_password(password)
                user.save()
                return Response(
                    {'message': 'Password reset successfully'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Invalid or expired token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid reset link'},
                status=status.HTTP_400_BAD_REQUEST
            )


class EmailVerificationView(views.APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, token):
        # Use the service to verify email
        verification_result = RegistrationService.verify_email(token)
        
        if verification_result['success']:
            return Response(
                {'message': verification_result['message']},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': verification_result['message']},
                status=status.HTTP_400_BAD_REQUEST
            )
