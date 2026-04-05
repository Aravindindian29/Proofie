"""
Script to delete ALL users from the database
WARNING: This will delete ALL users including admins!
You will need to create a new superuser after running this.
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


def delete_all_users():
    """Delete all users from the database"""
    
    print("\n" + "="*70)
    print("DELETE ALL USERS - WARNING")
    print("="*70)
    
    # Get all users
    users = User.objects.all()
    total_users = users.count()
    
    if total_users == 0:
        print("\n✓ No users found in the database.")
        return
    
    print(f"\nFound {total_users} user(s) in the database:")
    print("-" * 70)
    
    for user in users:
        user_type = []
        if user.is_superuser:
            user_type.append("SUPERUSER")
        if user.is_staff:
            user_type.append("STAFF")
        if not user_type:
            user_type.append("REGULAR")
        
        # Get owned content
        folders = Folder.objects.filter(owner=user).count()
        projects = Project.objects.filter(owner=user).count()
        assets = CreativeAsset.objects.filter(created_by=user).count()
        
        print(f"  • {user.username} ({user.email})")
        print(f"    Type: {', '.join(user_type)}")
        print(f"    Owns: {folders} folder(s), {projects} project(s), {assets} asset(s)")
    
    print("-" * 70)
    
    # Confirm deletion
    print("\n⚠️  WARNING: This action will:")
    print("  1. Delete ALL users including superusers/admins")
    print("  2. Delete ALL owned content (folders, projects, assets)")
    print("  3. Delete ALL user-related data (profiles, notifications, etc.)")
    print("  4. Make the system inaccessible until you create a new superuser")
    print("\nThis action CANNOT be undone!")
    
    confirmation = input("\nType 'DELETE ALL USERS' to confirm: ")
    
    if confirmation != "DELETE ALL USERS":
        print("\n✗ Deletion cancelled. No users were deleted.")
        return
    
    print("\n" + "="*70)
    print("DELETING USERS...")
    print("="*70)
    
    # Delete all users
    # Note: Since we're deleting ALL users, we don't need reassignment
    # The CASCADE relationships will handle cleanup
    deleted_count = 0
    
    for user in users:
        username = user.username
        try:
            # For users without owned content, direct deletion works
            # For users with owned content, we need to delete their content first
            # or the signal will raise ValidationError
            
            # Delete owned content first
            Folder.objects.filter(owner=user).delete()
            Project.objects.filter(owner=user).delete()
            CreativeAsset.objects.filter(created_by=user).delete()
            
            # Now delete the user
            user.delete()
            deleted_count += 1
            print(f"✓ Deleted user: {username}")
            
        except Exception as e:
            print(f"✗ Failed to delete user {username}: {str(e)}")
    
    print("\n" + "="*70)
    print(f"DELETION COMPLETE: {deleted_count}/{total_users} users deleted")
    print("="*70)
    
    if deleted_count > 0:
        print("\n📝 NEXT STEPS:")
        print("  1. Create a new superuser:")
        print("     python manage.py createsuperuser")
        print("\n  2. Or run the setup script:")
        print("     .\\setup.ps1")
        print("\n  3. Then login to Django admin with your new credentials")
    
    print("\n✓ All users have been deleted from the database.\n")


if __name__ == '__main__':
    delete_all_users()
