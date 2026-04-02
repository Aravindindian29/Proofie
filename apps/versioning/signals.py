import os
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import FileVersion

logger = logging.getLogger(__name__)

@receiver(post_save, sender=FileVersion)
def generate_thumbnail_on_save(sender, instance, created, **kwargs):
    """
    Automatically generate thumbnail when a FileVersion is created or updated with a file.
    This runs in a separate signal handler to ensure it happens after the transaction commits.
    """
    if not instance.file:
        return
    
    # Only generate if thumbnail doesn't exist
    if instance.thumbnail:
        return
    
    try:
        from .thumbnail_utils import generate_thumbnail_for_asset
        
        file_path = instance.file.path
        file_type = instance.asset.file_type if instance.asset else None
        
        logger.info(f"🖼️ Signal: Generating thumbnail for {file_path} (type: {file_type})")
        
        if not file_type:
            logger.warning(f"🖼️ Signal: No file_type available for asset {instance.asset.id if instance.asset else 'N/A'}")
            return
            
        if not os.path.exists(file_path):
            logger.warning(f"🖼️ Signal: File not found at {file_path}")
            return
        
        thumbnail_content = generate_thumbnail_for_asset(file_path, file_type)
        
        if thumbnail_content:
            thumb_filename = f"thumb_{os.path.basename(file_path)}.jpg"
            instance.thumbnail.save(thumb_filename, thumbnail_content, save=True)
            logger.info(f"🖼️ Signal: Thumbnail saved successfully: {instance.thumbnail.name}")
        else:
            logger.warning(f"🖼️ Signal: Thumbnail generation returned None for {file_path}")
            
    except Exception as e:
        logger.error(f"🖼️ Signal: Thumbnail generation failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
