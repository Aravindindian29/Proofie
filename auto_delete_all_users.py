"""
Auto-delete ALL users from the database (no prompts)
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.versioning.models import Folder, Project, CreativeAsset


def auto_delete_all_users():
    """Automatically delete all users from the database"""
    
    print("\n" + "="*70)
    print("AUTO-DELETING ALL USERS")
    print("="*70)
    
    # Get all users
    users = User.objects.all()
    total_users = users.count()
    
    if total_users == 0:
        print("\n✓ No users found in the database.")
        return
    
    print(f"\nDeleting {total_users} user(s)...")
    
    deleted_count = 0
    
    for user in users:
        username = user.username
        try:
            # Delete owned content first to avoid signal validation errors
            folders_deleted = Folder.objects.filter(owner=user).delete()[0]
            projects_deleted = Project.objects.filter(owner=user).delete()[0]
            assets_deleted = CreativeAsset.objects.filter(created_by=user).delete()[0]
            
            # Now delete the user
            user.delete()
            deleted_count += 1
            print(f"✓ Deleted: {username} (Folders: {folders_deleted}, Projects: {projects_deleted}, Assets: {assets_deleted})")
            
        except Exception as e:
            print(f"✗ Failed to delete {username}: {str(e)}")
    
    print("\n" + "="*70)
    print(f"✓ DELETION COMPLETE: {deleted_count}/{total_users} users deleted")
    print("="*70)
    
    if deleted_count > 0:
        print("\n📝 Next: Create a new superuser with:")
        print("   python manage.py createsuperuser")
    
    print()


if __name__ == '__main__':
    auto_delete_all_users()
