"""
Regenerate thumbnails for all existing assets
Run this after installing PyMuPDF to generate missing thumbnails
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.versioning.models import FileVersion
from apps.versioning.thumbnail_utils import generate_thumbnail_for_asset
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("=" * 60)
print("REGENERATING THUMBNAILS FOR ALL ASSETS")
print("=" * 60)

# Get all file versions without thumbnails
versions_without_thumbnails = FileVersion.objects.filter(thumbnail__isnull=True)
total = versions_without_thumbnails.count()

print(f"\nFound {total} file versions without thumbnails")

if total == 0:
    print("\n✅ All file versions already have thumbnails!")
else:
    success_count = 0
    fail_count = 0
    
    for i, version in enumerate(versions_without_thumbnails, 1):
        print(f"\n[{i}/{total}] Processing: {version.asset.name}")
        print(f"  File: {version.file.name}")
        print(f"  Type: {version.asset.file_type}")
        
        try:
            if not version.file:
                print(f"  ⚠️ No file attached")
                fail_count += 1
                continue
            
            file_path = version.file.path
            
            if not os.path.exists(file_path):
                print(f"  ❌ File not found: {file_path}")
                fail_count += 1
                continue
            
            file_type = version.asset.file_type
            
            if not file_type:
                print(f"  ⚠️ No file type specified")
                fail_count += 1
                continue
            
            # Generate thumbnail
            print(f"  🖼️ Generating thumbnail...")
            thumbnail_content = generate_thumbnail_for_asset(file_path, file_type)
            
            if thumbnail_content:
                # Save thumbnail
                thumb_filename = f"thumb_{os.path.basename(file_path)}.jpg"
                version.thumbnail.save(thumb_filename, thumbnail_content, save=True)
                print(f"  ✅ Thumbnail saved: {version.thumbnail.name}")
                success_count += 1
            else:
                print(f"  ❌ Thumbnail generation failed")
                fail_count += 1
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
            fail_count += 1
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total processed: {total}")
    print(f"✅ Success: {success_count}")
    print(f"❌ Failed: {fail_count}")
    print("=" * 60)

print("\nDone! Thumbnails have been regenerated.")
print("Restart your Django server to see the changes.\n")
