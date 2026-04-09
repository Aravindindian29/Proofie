"""
Script to unlock all existing groups in the database.
Run this after removing the group locking logic.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.workflows.models import ApprovalGroup
from django.utils import timezone

def unlock_all_groups():
    """Unlock all groups that are currently locked"""
    locked_groups = ApprovalGroup.objects.filter(status='locked')
    count = locked_groups.count()
    
    if count == 0:
        print("✅ No locked groups found. All groups are already unlocked.")
        return
    
    print(f"Found {count} locked groups. Unlocking...")
    
    for group in locked_groups:
        group.status = 'unlocked'
        if not group.unlocked_at:
            group.unlocked_at = timezone.now()
        group.save()
        print(f"  ✓ Unlocked: {group.name} (Review Cycle {group.review_cycle.id})")
    
    print(f"\n✅ Successfully unlocked {count} groups!")

if __name__ == '__main__':
    unlock_all_groups()
