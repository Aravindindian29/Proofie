"""
Quick script to get the PDF URL for testing
Run this to get the direct URL to test in browser
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.versioning.models import CreativeAsset, FileVersion

# Get the most recent PDF asset
pdf_assets = CreativeAsset.objects.filter(file_type='pdf').order_by('-created_at')

if pdf_assets.exists():
    asset = pdf_assets.first()
    print(f"\n{'='*60}")
    print(f"MOST RECENT PDF ASSET")
    print(f"{'='*60}")
    print(f"Asset ID: {asset.id}")
    print(f"Asset Name: {asset.name}")
    print(f"Project: {asset.project.name if asset.project else 'None'}")
    print(f"Created: {asset.created_at}")
    
    # Get current version
    current_version = asset.versions.filter(is_current=True).first()
    
    if current_version:
        print(f"\nCurrent Version:")
        print(f"  Version Number: {current_version.version_number}")
        print(f"  File: {current_version.file.name}")
        print(f"  File Size: {current_version.file_size} bytes")
        print(f"  File exists on disk: {current_version.file.path and os.path.exists(current_version.file.path)}")
        
        if current_version.file.path:
            print(f"  Full file path: {current_version.file.path}")
        
        # Build the URL
        file_url = f"http://localhost:8000/api/versioning/media/{current_version.file.name}"
        print(f"\n{'='*60}")
        print(f"TEST THIS URL IN YOUR BROWSER:")
        print(f"{'='*60}")
        print(file_url)
        print(f"{'='*60}")
        
        # Also show FileViewer URL
        viewer_url = f"http://localhost:3000/files/{asset.id}"
        print(f"\nFileViewer URL:")
        print(viewer_url)
        
        # Check thumbnail
        if current_version.thumbnail:
            thumb_url = f"http://localhost:8000/api/versioning/media/{current_version.thumbnail.name}"
            print(f"\nThumbnail URL:")
            print(thumb_url)
        else:
            print(f"\n⚠️ No thumbnail generated")
    else:
        print("\n❌ No current version found for this asset")
else:
    print("\n❌ No PDF assets found in database")

print(f"\n{'='*60}\n")
