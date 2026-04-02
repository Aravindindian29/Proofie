from django.core.management.base import BaseCommand
from apps.versioning.models import CreativeAsset, FileVersion


class Command(BaseCommand):
    help = 'Backfill filename and file_url for existing CreativeAssets'

    def handle(self, *args, **options):
        updated_count = 0
        
        assets = CreativeAsset.objects.all()
        self.stdout.write(f"Found {assets.count()} CreativeAssets to process...")
        
        for asset in assets:
            # Get the current version
            current_version = asset.versions.filter(is_current=True).first()
            
            if current_version and current_version.file:
                # Update filename and file_url
                asset.filename = current_version.file.name
                asset.file_url = f'/media/{current_version.file.name}'
                asset.save(update_fields=['filename', 'file_url'])
                updated_count += 1
                self.stdout.write(f"  Updated: {asset.name} -> {asset.filename}")
            else:
                self.stdout.write(f"  Skipped (no file): {asset.name}")
        
        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully updated {updated_count} assets!"))
