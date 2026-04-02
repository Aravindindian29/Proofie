"""
Force thumbnail generation for a specific asset
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.versioning.models import FileVersion, CreativeAsset
from apps.versioning.thumbnail_utils import generate_thumbnail_for_asset

# Get the most recent PDF asset
asset = CreativeAsset.objects.filter(file_type='pdf').order_by('-created_at').first()

if not asset:
    print("No PDF assets found")
    exit()

print(f"Asset: {asset.name}")
print(f"Asset ID: {asset.id}")

# Get current version
version = asset.versions.filter(is_current=True).first()

if not version:
    print("No current version found")
    exit()

print(f"Version: {version.id}")
print(f"File: {version.file.name}")
print(f"File path: {version.file.path}")
print(f"File exists: {os.path.exists(version.file.path)}")
print(f"Current thumbnail: {version.thumbnail}")

# Generate thumbnail
print("\nGenerating thumbnail...")
thumbnail_content = generate_thumbnail_for_asset(version.file.path, 'pdf')

if thumbnail_content:
    print("✅ Thumbnail generated successfully")
    print(f"Thumbnail size: {len(thumbnail_content.read())} bytes")
    thumbnail_content.seek(0)
    
    # Save thumbnail
    thumb_filename = f"thumb_{os.path.basename(version.file.name)}.jpg"
    version.thumbnail.save(thumb_filename, thumbnail_content, save=True)
    
    print(f"✅ Thumbnail saved: {version.thumbnail.name}")
    print(f"Thumbnail path: {version.thumbnail.path}")
    print(f"Thumbnail URL: /api/versioning/media/{version.thumbnail.name}")
else:
    print("❌ Thumbnail generation failed")
