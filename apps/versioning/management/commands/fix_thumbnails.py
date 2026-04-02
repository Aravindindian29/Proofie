from django.core.management.base import BaseCommand
from apps.versioning.models import FileVersion
from apps.versioning.thumbnail_utils import generate_thumbnail_for_asset
import os

class Command(BaseCommand):
    help = 'Generate thumbnails for all file versions that don\'t have them'

    def handle(self, *args, **options):
        versions = FileVersion.objects.filter(thumbnail='', file__isnull=False)
        self.stdout.write(f'Found {versions.count()} versions without thumbnails')
        
        for version in versions:
            try:
                if not version.file:
                    continue
                    
                file_path = version.file.path
                file_type = version.asset.file_type if version.asset else None
                
                self.stdout.write(f'\nProcessing version {version.id}: {version.file.name}')
                self.stdout.write(f'  File type: {file_type}')
                self.stdout.write(f'  File exists: {os.path.exists(file_path)}')
                
                if not file_type:
                    self.stdout.write(self.style.WARNING('  Skipping: No file_type'))
                    continue
                    
                if not os.path.exists(file_path):
                    self.stdout.write(self.style.WARNING('  Skipping: File not found'))
                    continue
                
                thumbnail_content = generate_thumbnail_for_asset(file_path, file_type)
                
                if thumbnail_content:
                    thumb_filename = f'thumb_{os.path.basename(file_path)}.jpg'
                    version.thumbnail.save(thumb_filename, thumbnail_content, save=True)
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Thumbnail saved: {version.thumbnail.name}'))
                else:
                    self.stdout.write(self.style.ERROR(f'  ✗ Generation returned None'))
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ✗ Error: {e}'))
                import traceback
                self.stdout.write(traceback.format_exc())
        
        self.stdout.write(self.style.SUCCESS('\nDone!'))
