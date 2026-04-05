from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from .models import UserProfile
from apps.notifications.models import NotificationPreference
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created and not instance.is_superuser:
        # Only create profile for non-superuser accounts
        # Superusers are backend-only and don't need frontend permissions
        profile = UserProfile.objects.create(user=instance)
        # Apply default Lite User permissions
        profile.apply_role_permissions()
        profile.save()
        NotificationPreference.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    # Only save profile if user has one (non-superusers)
    if hasattr(instance, 'profile'):
        instance.profile.save()


@receiver(pre_save, sender=UserProfile)
def apply_permissions_on_role_change(sender, instance, **kwargs):
    """Apply role permissions when role changes"""
    if instance.pk:
        try:
            old_instance = UserProfile.objects.get(pk=instance.pk)
            # If role has changed, apply new role permissions
            if old_instance.role != instance.role:
                instance.apply_role_permissions()
        except UserProfile.DoesNotExist:
            pass
    else:
        # New profile being created
        instance.apply_role_permissions()


@receiver(pre_delete, sender=User)
def handle_user_deletion(sender, instance, **kwargs):
    """
    Handle user deletion by reassigning ownership of folders, projects, and assets.
    This signal is triggered before a user is deleted.
    
    IMPORTANT: Only ownership fields are reassigned. Historical action fields
    (annotations.author, comments.author, versions.uploaded_by, etc.) remain null
    to preserve audit trail integrity.
    """
    from apps.versioning.models import Folder, Project, CreativeAsset
    
    # Check if reassignment_user is provided in kwargs
    reassignment_user_id = kwargs.get('reassignment_user_id')
    
    # Get owned content counts
    folders_count = Folder.objects.filter(owner=instance).count()
    projects_count = Project.objects.filter(owner=instance).count()
    assets_count = CreativeAsset.objects.filter(created_by=instance).count()
    
    total_owned = folders_count + projects_count + assets_count
    
    if total_owned > 0:
        if not reassignment_user_id:
            # User owns content but no reassignment user provided
            raise ValidationError(
                f"Cannot delete user '{instance.username}'. "
                f"User owns {folders_count} folder(s), {projects_count} project(s), "
                f"and {assets_count} asset(s). Please select a user to reassign ownership to."
            )
        
        try:
            reassignment_user = User.objects.get(id=reassignment_user_id)
            
            # Prevent reassigning to the user being deleted
            if reassignment_user.id == instance.id:
                raise ValidationError("Cannot reassign ownership to the user being deleted.")
            
            # Reassign ONLY ownership fields
            folders_updated = Folder.objects.filter(owner=instance).update(owner=reassignment_user)
            projects_updated = Project.objects.filter(owner=instance).update(owner=reassignment_user)
            assets_updated = CreativeAsset.objects.filter(created_by=instance).update(created_by=reassignment_user)
            
            logger.info(
                f"User '{instance.username}' deletion: Reassigned {folders_updated} folders, "
                f"{projects_updated} projects, and {assets_updated} assets to '{reassignment_user.username}'"
            )
            
            # Historical action fields (uploaded_by, author, etc.) will automatically
            # become NULL due to on_delete=models.SET_NULL in model definitions
            
        except User.DoesNotExist:
            raise ValidationError(f"Reassignment user with ID {reassignment_user_id} does not exist.")
    else:
        logger.info(f"User '{instance.username}' has no owned content. Proceeding with deletion.")
