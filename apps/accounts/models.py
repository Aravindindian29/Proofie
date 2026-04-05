from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class EmailVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Email verification for {self.user.username}"
    
    def is_expired(self):
        return (timezone.now() - self.created_at).days > 1


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('approver', 'Approver'),
        ('lite_user', 'Lite User'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='lite_user')
    avatar = models.ImageField(upload_to='avatars/%Y/%m/%d/', blank=True, null=True)
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=255, blank=True)
    job_title = models.CharField(max_length=255, blank=True)
    
    # Folder Permissions
    can_create_folder = models.BooleanField(default=False, verbose_name='Create Folder')
    can_add_member = models.BooleanField(default=False, verbose_name='Add Member')
    can_edit_folder = models.BooleanField(default=False, verbose_name='Edit Folder')
    can_add_proof = models.BooleanField(default=False, verbose_name='Add Proof')
    can_delete_folder = models.BooleanField(default=False, verbose_name='Delete Folder')
    
    # Inside Folder Permissions
    can_add_proof_in_folder = models.BooleanField(default=False, verbose_name='Add Proof')
    can_delete_proof_in_folder = models.BooleanField(default=False, verbose_name='Delete Proof')
    
    # Proof Preview Permissions
    can_use_proofieplus = models.BooleanField(default=False, verbose_name='ProofiePlus')
    can_add_comment = models.BooleanField(default=False, verbose_name='Add Comment')
    can_delete_proof_in_preview = models.BooleanField(default=False, verbose_name='Delete Proof')
    can_make_decisions = models.BooleanField(default=False, verbose_name='Make Decisions')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    permissions_updated_at = models.DateTimeField(auto_now=True)

    def delete(self, using=None, keep_parents=False):
        """
        Override delete to cascade to User model.
        
        When a UserProfile is deleted, it will also delete the associated User,
        which in turn will delete EmailVerification records via CASCADE relationships.
        """
        from django.db import transaction
        from apps.versioning.models import Folder, Project, CreativeAsset
        
        with transaction.atomic(using=using):
            # Check if user owns content that needs reassignment
            if self.user:
                folders_count = Folder.objects.filter(owner=self.user).count()
                projects_count = Project.objects.filter(owner=self.user).count()
                assets_count = CreativeAsset.objects.filter(created_by=self.user).count()
                
                total_owned = folders_count + projects_count + assets_count
                
                if total_owned > 0:
                    from django.core.exceptions import ValidationError
                    raise ValidationError(
                        f"Cannot delete user profile for '{self.user.username}'. "
                        f"User owns {folders_count} folder(s), {projects_count} project(s), "
                        f"and {assets_count} asset(s). Please delete the user from Authentication "
                        f"& Authorization -> Users section to handle ownership reassignment."
                    )
                
                # Delete the User first, which will cascade to EmailVerification
                # and also trigger the pre_delete signal for User
                user_id = self.user.id
                self.user.delete(using=using)
                
                # Log the deletion
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"UserProfile deletion: Deleted User ID {user_id} and associated records")
            else:
                # If no user exists, just delete the profile
                super().delete(using=using, keep_parents=keep_parents)
    
    def can_delete_safely(self):
        """
        Check if this user profile can be deleted safely (no owned content)
        
        Returns:
            dict: Safety check result with details
        """
        from apps.versioning.models import Folder, Project, CreativeAsset
        
        if not self.user:
            return {
                'can_delete': True,
                'reason': 'No associated user account',
                'owned_content': {'total_count': 0}
            }
        
        folders = Folder.objects.filter(owner=self.user)
        projects = Project.objects.filter(owner=self.user)
        assets = CreativeAsset.objects.filter(created_by=self.user)
        
        total_count = folders.count() + projects.count() + assets.count()
        
        return {
            'can_delete': total_count == 0,
            'reason': 'User owns content that needs reassignment' if total_count > 0 else 'No owned content',
            'owned_content': {
                'folders': folders.count(),
                'projects': projects.count(),
                'assets': assets.count(),
                'total_count': total_count
            }
        }
    
    def __str__(self):
        return f"Profile - {self.user.username}"
    
    def apply_role_permissions(self):
        """Apply default permissions based on role"""
        from apps.workflows.models import RolePermission
        try:
            role_perm = RolePermission.objects.get(role=self.role)
            self.can_create_folder = role_perm.can_create_folder
            self.can_add_member = role_perm.can_add_member
            self.can_edit_folder = role_perm.can_edit_folder
            self.can_add_proof = role_perm.can_add_proof
            self.can_delete_folder = role_perm.can_delete_folder
            self.can_add_proof_in_folder = role_perm.can_add_proof_in_folder if hasattr(role_perm, 'can_add_proof_in_folder') else False
            self.can_delete_proof_in_folder = role_perm.can_delete_proof_in_folder
            self.can_use_proofieplus = role_perm.can_use_proofieplus
            self.can_add_comment = role_perm.can_add_comment
            self.can_delete_proof_in_preview = role_perm.can_delete_proof_in_preview
            self.can_make_decisions = role_perm.can_make_decisions
        except RolePermission.DoesNotExist:
            # If no role permission template exists, set all to False (Lite User default)
            self.can_create_folder = False
            self.can_add_member = False
            self.can_edit_folder = False
            self.can_add_proof = False
            self.can_delete_folder = False
            self.can_add_proof_in_folder = False
            self.can_delete_proof_in_folder = False
            self.can_use_proofieplus = False
            self.can_add_comment = False
            self.can_delete_proof_in_preview = False
            self.can_make_decisions = False
