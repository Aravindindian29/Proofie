from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.conf import settings
import os
import logging
import uuid

logger = logging.getLogger(__name__)


class Folder(models.Model):
    """Folder model for organizing projects"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['name', 'owner']  # Prevent duplicate folder names per user
    
    def __str__(self):
        return self.name
    
    @property
    def project_count(self):
        """Return the number of projects in this folder"""
        return self.projects.count()


class FolderMember(models.Model):
    """Model for managing folder membership and access control"""
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('editor', 'Editor'),
        ('viewer', 'Viewer'),
    ]
    
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folder_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    added_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='added_folder_members')
    
    class Meta:
        unique_together = ('folder', 'user')
        ordering = ['-added_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.folder.name} ({self.role})"


class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    folder = models.ForeignKey(Folder, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    # Asset file fields
    asset_file_url = models.URLField(max_length=500, blank=True, null=True)
    asset_file_type = models.CharField(max_length=20, blank=True, null=True)
    asset_filename = models.CharField(max_length=255, blank=True, null=True)
    
    # Unique share token for URL-based access
    share_token = models.UUIDField(null=True, blank=True, unique=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Generate share_token if not set (for new projects)
        if not self.share_token:
            self.share_token = uuid.uuid4()
        super().save(*args, **kwargs)
    
    def update_asset_info(self, file_url=None, file_type=None, filename=None):
        """Update asset information from uploaded file"""
        if file_url:
            self.asset_file_url = file_url
        if file_type:
            self.asset_file_type = file_type
        if filename:
            self.asset_filename = filename
        self.save(update_fields=['asset_file_url', 'asset_file_type', 'asset_filename', 'updated_at'])


class ProjectMember(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('reviewer', 'Reviewer'),
        ('viewer', 'Viewer'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.project.name}"


class CreativeAsset(models.Model):
    FILE_TYPE_CHOICES = [
        ('pdf', 'PDF'),
        ('image', 'Image'),
        ('video', 'Video'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES)
    file_url = models.URLField(max_length=500, blank=True, null=True)
    filename = models.CharField(max_length=255, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_assets')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name
    
    def generate_share_token(self, user, **kwargs):
        """Generate a share token for this asset"""
        from .token_models import AssetShareToken
        return AssetShareToken.generate_token(self, user, **kwargs)
    
    def generate_access_token(self, user, purpose='view', **kwargs):
        """Generate an access token for this asset"""
        from .token_models import AssetAccessToken
        return AssetAccessToken.generate_token(self, user, purpose, **kwargs)


class FileVersion(models.Model):
    asset = models.ForeignKey(CreativeAsset, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    file = models.FileField(
        upload_to='assets/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=settings.ALLOWED_FILE_TYPES)]
    )
    file_size = models.BigIntegerField()
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    change_notes = models.TextField(blank=True)
    is_current = models.BooleanField(default=True)
    thumbnail = models.ImageField(upload_to='thumbnails/%Y/%m/%d/', blank=True, null=True)

    class Meta:
        ordering = ['-version_number']
        unique_together = ('asset', 'version_number')

    def __str__(self):
        return f"{self.asset.name} - v{self.version_number}"

    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
            # Update the parent CreativeAsset with filename and file_url
            if self.asset:
                self.asset.filename = self.file.name
                # Build the file URL
                from django.conf import settings
                self.asset.file_url = f'{settings.MEDIA_URL}{self.file.name}'
                self.asset.save(update_fields=['filename', 'file_url'])
        
        # Save the model first
        super().save(*args, **kwargs)
        
        # Generate thumbnail after saving (so file exists on disk)
        # This is a fallback in case the view doesn't generate it
        if self.file and not self.thumbnail:
            try:
                from .thumbnail_utils import generate_thumbnail_for_asset
                import os
                
                file_path = self.file.path
                file_type = self.asset.file_type if self.asset else None
                
                if file_type and os.path.exists(file_path):
                    thumbnail_content = generate_thumbnail_for_asset(file_path, file_type)
                    
                    if thumbnail_content:
                        # Save the generated thumbnail
                        thumb_filename = f"thumb_{os.path.basename(file_path)}.jpg"
                        self.thumbnail.save(
                            thumb_filename,
                            thumbnail_content,
                            save=False
                        )
                        thumb_path = self.thumbnail.name
                        # Update thumbnail field without triggering full save
                        FileVersion.objects.filter(pk=self.pk).update(
                            thumbnail=thumb_path
                        )
                        
            except Exception as e:
                # Log error but don't crash the upload process
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Auto thumbnail generation failed: {e}")


class VersionComment(models.Model):
    version = models.ForeignKey(FileVersion, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on {self.version}"
