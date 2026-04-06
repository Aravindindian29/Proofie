from rest_framework import viewsets, status, permissions, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import UserProfile, EmailVerification, UserStatusLog
from .serializers import UserDetailSerializer, UserRegistrationSerializer, UserProfileSerializer
from .services import RegistrationService, EmailService


class UsersPagination(PageNumberPagination):
    """Custom pagination for users list - 5 users per page"""
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(is_superuser=False)

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

    @action(detail=False, methods=['get'])
    def permissions_version(self, request):
        """Lightweight endpoint for permission polling - returns only permissions_updated_at timestamp"""
        try:
            permissions_updated_at = request.user.profile.permissions_updated_at
            return Response({
                'permissions_updated_at': permissions_updated_at.isoformat() if permissions_updated_at else None
            })
        except AttributeError:
            return Response({'permissions_updated_at': None})

    @action(detail=False, methods=['get'], pagination_class=UsersPagination)
    def list_all_users(self, request):
        """
        List all users with pagination, search, and sorting capabilities.
        Available to all authenticated users.
        """
        queryset = User.objects.filter(is_superuser=False).select_related('profile')
        
        # Search functionality
        search_query = request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(username__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query)
            )
        
        # Sorting functionality
        sort_by = request.query_params.get('sort', 'username')
        sort_order = request.query_params.get('order', 'asc')
        
        # Validate sort field
        valid_sort_fields = ['username', 'first_name', 'last_name', 'email', 'date_joined', 'is_active', 'role']
        if sort_by not in valid_sort_fields:
            sort_by = 'username'
        
        # Apply sorting
        if sort_order == 'desc':
            sort_by = f'-{sort_by}'
        
        queryset = queryset.order_by(sort_by)
        
        # Paginate results
        paginator = UsersPagination()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            # Serialize users with their profile data
            users_data = []
            for user in page:
                user_data = {
                    'id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'is_active': user.is_active,
                    'date_joined': user.date_joined,
                    'role': getattr(user.profile, 'role', 'lite_user') if hasattr(user, 'profile') else 'lite_user'
                }
                users_data.append(user_data)
            
            return paginator.get_paginated_response(users_data)
        
        # Fallback for no pagination
        users_data = []
        for user in queryset:
            user_data = {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'role': getattr(user.profile, 'role', 'lite_user') if hasattr(user, 'profile') else 'lite_user'
            }
            users_data.append(user_data)
        
        return Response(users_data)

    @action(detail=True, methods=['put'], permission_classes=[permissions.IsAdminUser])
    def update_status(self, request, pk=None):
        """
        Update user status with audit logging
        Only admin users can modify user status
        """
        try:
            user = User.objects.get(pk=pk)
            
            # Prevent self-deactivation
            if user == request.user and not request.data.get('is_active', True):
                return Response(
                    {'error': 'You cannot deactivate your own account'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if this is the last active admin
            if user.is_staff and not request.data.get('is_active', True):
                active_admins = User.objects.filter(is_staff=True, is_active=True).exclude(pk=user.pk)
                if active_admins.count() == 0:
                    return Response(
                        {'error': 'Cannot deactivate the last active admin user'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            old_status = user.is_active
            new_status = request.data.get('is_active')
            
            if new_status is None:
                return Response(
                    {'error': 'is_active field is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if old_status == new_status:
                return Response(
                    {'message': 'Status unchanged', 'is_active': user.is_active},
                    status=status.HTTP_200_OK
                )
            
            # Update user status
            user.is_active = new_status
            user.save()
            
            # Log the status change
            UserStatusLog.objects.create(
                user=user,
                changed_by=request.user,
                old_status=old_status,
                new_status=new_status,
                change_reason=request.data.get('change_reason', 'Status updated via admin interface')
            )
            
            return Response({
                'message': f'User status updated to {"Active" if new_status else "Inactive"}',
                'is_active': user.is_active,
                'user_id': user.id,
                'username': user.username
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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


class CustomObtainAuthToken(views.APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(request, username=username, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Block superusers from frontend access
        if user.is_superuser:
            return Response(
                {'error': 'This account is restricted to backend administration only. Please use the admin panel at /admin/'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create or get token for regular users
        token, created = Token.objects.get_or_create(user=user)
        
        return Response(
            {'token': token.key},
            status=status.HTTP_200_OK
        )
