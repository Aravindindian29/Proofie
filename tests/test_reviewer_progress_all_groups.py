"""
Test script to verify reviewer progress updates for all groups.
This simulates members from different groups opening the file viewer.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.workflows.models import ReviewCycle, ApprovalGroup, GroupMember
from apps.workflows.services import WorkflowService
from django.contrib.auth.models import User

def test_reviewer_progress_all_groups():
    """Test that reviewer progress updates for members from all groups"""
    
    # Get a review cycle with multiple groups
    review_cycle = ReviewCycle.objects.filter(
        groups__isnull=False
    ).prefetch_related('groups__members__user').first()
    
    if not review_cycle:
        print("❌ No review cycle found with groups")
        return
    
    print(f"\n🔍 Testing Review Cycle: {review_cycle.id}")
    print(f"   Asset: {review_cycle.asset.name if review_cycle.asset else 'N/A'}")
    print(f"   Current Status: {review_cycle.status}")
    print(f"   Proof Status: {review_cycle.proof_status}")
    
    groups = review_cycle.groups.all().order_by('order')
    print(f"\n📋 Found {groups.count()} groups:")
    
    for group in groups:
        print(f"\n   Group {group.order}: {group.name}")
        print(f"   Status: {group.status}")
        print(f"   Stage Status: {group.stage_status}")
        
        members = group.members.all()
        print(f"   Members ({members.count()}):")
        
        for member in members:
            print(f"      - {member.user.username}: {member.reviewer_progress}")
    
    # Test updating reviewer progress for a member from each group
    print(f"\n🧪 Testing reviewer progress updates...")
    
    for group in groups:
        members = group.members.filter(reviewer_progress='not_started')
        if members.exists():
            member = members.first()
            print(f"\n   Testing Group {group.order} ({group.name}):")
            print(f"      Member: {member.user.username}")
            print(f"      Before: {member.reviewer_progress}")
            
            # Simulate opening file viewer
            WorkflowService.update_reviewer_progress(member, 'reviewing')
            
            # Refresh from database
            member.refresh_from_db()
            group.refresh_from_db()
            review_cycle.refresh_from_db()
            
            print(f"      After: {member.reviewer_progress}")
            print(f"      Group Stage Status: {group.stage_status}")
            print(f"      Proof Status: {review_cycle.proof_status}")
            
            if member.reviewer_progress == 'reviewing':
                print(f"      ✅ SUCCESS - Reviewer progress updated!")
            else:
                print(f"      ❌ FAILED - Reviewer progress NOT updated!")
        else:
            print(f"\n   ⚠️ No members with 'not_started' status in Group {group.order}")
    
    # Final status check
    print(f"\n📊 Final Status:")
    review_cycle.refresh_from_db()
    print(f"   Review Cycle Status: {review_cycle.status}")
    print(f"   Proof Status: {review_cycle.proof_status}")
    
    for group in groups:
        group.refresh_from_db()
        print(f"\n   Group {group.order} ({group.name}):")
        print(f"      Stage Status: {group.stage_status}")
        
        for member in group.members.all():
            member.refresh_from_db()
            print(f"      - {member.user.username}: {member.reviewer_progress}")

if __name__ == '__main__':
    test_reviewer_progress_all_groups()
