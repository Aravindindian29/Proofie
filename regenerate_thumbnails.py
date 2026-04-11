"""
Script to regenerate thumbnails for all FileVersions that don't have them
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.versioning.models import FileVersion
from apps.versioning.thumbnail_utils import generate_thumbnail_for_asset

def regenerate_thumbnails():
    """Regenerate thumbnails for all FileVersions without thumbnails"""
    versions_without_thumbnails = FileVersion.objects.filter(thumbnail='')
    
    print(f"Found {versions_without_thumbnails.count()} versions without thumbnails")
    
    for version in versions_without_thumbnails:
        if not version.file:
            print(f"[SKIP] Version {version.id} has no file")
            continue
            
        try:
            file_path = version.file.path
            print(f"\n[PROCESSING] Version {version.id}: {file_path}")
            
            if not os.path.exists(file_path):
                print(f"[ERROR] File not found: {file_path}")
                continue
            
            # Determine file type
            file_type = None
            if file_path.lower().endswith('.pdf'):
                file_type = 'pdf'
            elif file_path.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                file_type = 'image'
            elif file_path.lower().endswith(('.mp4', '.mov', '.avi', '.webm')):
                file_type = 'video'
            
            if not file_type:
                print(f"[SKIP] Unknown file type for {file_path}")
                continue
            
            print(f"[INFO] File type: {file_type}")
            
            # Generate thumbnail
            thumbnail_content = generate_thumbnail_for_asset(file_path, file_type)
            
            if thumbnail_content:
                thumb_filename = f"thumb_{os.path.basename(file_path)}.jpg"
                version.thumbnail.save(thumb_filename, thumbnail_content, save=True)
                print(f"[SUCCESS] Thumbnail saved: {version.thumbnail.name}")
            else:
                print(f"[ERROR] Thumbnail generation returned None")
                
        except Exception as e:
            print(f"[ERROR] Failed to generate thumbnail for version {version.id}: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n[DONE] Thumbnail regeneration complete")

if __name__ == '__main__':
    regenerate_thumbnails()
