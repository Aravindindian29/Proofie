from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User
from .models import EmailVerification


class EmailVerificationBackend(BaseBackend):
    """
    Custom authentication backend that checks email verification
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return None
        
        if user.check_password(password):
            # Superusers bypass email verification (backend-only access)
            if user.is_superuser:
                print(f"Login successful: {user.username} - Superuser (backend-only)")
                return user
            
            # Regular users need email verification
            try:
                verification = EmailVerification.objects.get(user=user)
                if not verification.is_verified:
                    print(f"Login denied: {user.username} - Email not verified")
                    return None  # Email not verified
            except EmailVerification.DoesNotExist:
                print(f"Login denied: {user.username} - No verification record")
                return None  # No verification record
            
            print(f"Login successful: {user.username} - Email verified")
            return user
        
        return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
