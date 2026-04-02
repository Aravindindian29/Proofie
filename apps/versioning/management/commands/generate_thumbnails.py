import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.versioning.models import FileVersion, CreativeAsset
from apps.versioning.thumbnail_utils import generate_thumbnail_for_asset

class Command(BaseCommand):
    help = 'Generate thumbnails for existing files that don\'t have them'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting thumbnail generation...'))
        
        # Get all file versions without thumbnails but with files
        versions = FileVersion.objects.filter(thumbnail='', file__isnull=False)
        self.stdout.write(f'Found {versions.count()} versions without thumbnails')
        
        for version in versions:
            self.stdout.write(f'\nProcessing version {version.id}: {version.file.name}')
            
            # Check if file exists
            file_path = version.file.path
            if not os.path.exists(file_path):
                self.stdout.write(self.style.WARNING(f'  File not found: {file_path}'))
                continue
            
            # Get file type from asset
            asset = version.asset
            if not asset:
                self.stdout.write(self.style.WARNING(f'  No asset linked to version'))
                continue
            
            file_type = asset.file_type
            self.stdout.write(f'  File type: {file_type}')
            self.stdout.write(f'  File path: {file_path}')
            self.stdout.write(f'  File size: {os.path.getsize(file_path)} bytes')
            
            # Generate thumbnail
            try:
                thumbnail_content = generate_thumbnail_for_asset(file_path, file_type)
                
                if thumbnail_content:
                    # Save the generated thumbnail
                    thumb_filename = f'thumb_{os.path.basename(file_path)}.jpg'
                    version.thumbnail.save(
                        thumb_filename,
                        thumbnail_content,
                        save=True
                    )
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Thumbnail saved: {version.thumbnail.name}'))
                else:
                    self.stdout.write(self.style.ERROR(f'  ✗ Thumbnail generation returned None'))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ✗ Error: {e}'))
                import traceback
                self.stdout.write(traceback.format_exc())
        
        self.stdout.write(self.style.SUCCESS('\nThumbnail generation complete!'))
