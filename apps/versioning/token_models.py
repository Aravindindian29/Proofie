from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
import secrets
import hashlib
from datetime import datetime, timedelta


class AssetShareToken(models.Model):
    """Token for secure asset sharing"""
    asset = models.ForeignKey('CreativeAsset', on_delete=models.CASCADE, related_name='share_tokens')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tokens')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    max_uses = models.PositiveIntegerField(default=None, null=True, blank=True)  # None = unlimited
    use_count = models.PositiveIntegerField(default=0)
    
    # Permissions
    can_download = models.BooleanField(default=True)
    can_view = models.BooleanField(default=True)
    can_comment = models.BooleanField(default=False)
    
    # Access control
    allowed_domains = models.TextField(blank=True, help_text="Comma-separated list of allowed domains")
    password = models.CharField(max_length=255, blank=True, help_text="Optional password protection")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token', 'is_active']),
            models.Index(fields=['expires_at', 'is_active']),
        ]
    
    def __str__(self):
        return f"Token for {self.asset.name} (expires {self.expires_at.date()})"
    
    @classmethod
    def generate_token(cls, asset, created_by, expires_in_hours=24, **kwargs):
        """Generate a new secure token for an asset"""
        # Generate secure random token
        token = secrets.token_urlsafe(48)
        
        # Set expiration time
        expires_at = datetime.now() + timedelta(hours=expires_in_hours)
        
        return cls.objects.create(
            asset=asset,
            token=token,
            created_by=created_by,
            expires_at=expires_at,
            **kwargs
        )
    
    def is_valid(self):
        """Check if token is valid and not expired"""
        if not self.is_active:
            return False
        
        if datetime.now() > self.expires_at:
            return False
        
        if self.max_uses and self.use_count >= self.max_uses:
            return False
        
        return True
    
    def increment_use(self):
        """Increment the use count"""
        self.use_count += 1
        if self.max_uses and self.use_count >= self.max_uses:
            self.is_active = False
        self.save(update_fields=['use_count', 'is_active'])
    
    def get_share_url(self, request=None):
        """Get the full share URL for this token"""
        base_url = getattr(settings, 'BASE_URL', 'http://localhost:3000')
        if request:
            base_url = f"{request.scheme}://{request.get_host()}"
        
        return f"{base_url}/shared/asset/{self.token}"
    
    def is_domain_allowed(self, domain):
        """Check if domain is in allowed list"""
        if not self.allowed_domains:
            return True  # No restriction
        
        allowed = [d.strip().lower() for d in self.allowed_domains.split(',')]
        return domain.lower() in allowed
    
    def verify_password(self, password):
        """Verify password protection"""
        if not self.password:
            return True  # No password required
        
        return hashlib.sha256(password.encode()).hexdigest() == self.password
    
    def set_password(self, password):
        """Set password protection"""
        if password:
            self.password = hashlib.sha256(password.encode()).hexdigest()
        else:
            self.password = ""


class AssetAccessToken(models.Model):
    """Short-lived access token for specific asset operations"""
    asset = models.ForeignKey('CreativeAsset', on_delete=models.CASCADE, related_name='access_tokens')
    token = models.CharField(max_length=32, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='access_tokens')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    purpose = models.CharField(max_length=20, choices=[
        ('view', 'View'),
        ('download', 'Download'),
        ('edit', 'Edit'),
        ('comment', 'Comment'),
    ])
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token', 'expires_at']),
            models.Index(fields=['user', 'purpose']),
        ]
    
    def __str__(self):
        return f"{self.purpose.title()} token for {self.asset.name}"
    
    @classmethod
    def generate_token(cls, asset, user, purpose='view', expires_in_minutes=15):
        """Generate a short-lived access token"""
        token = secrets.token_urlsafe(24)
        expires_at = datetime.now() + timedelta(minutes=expires_in_minutes)
        
        return cls.objects.create(
            asset=asset,
            token=token,
            user=user,
            expires_at=expires_at,
            purpose=purpose
        )
    
    def is_valid(self):
        """Check if token is valid and not expired"""
        return datetime.now() < self.expires_at
