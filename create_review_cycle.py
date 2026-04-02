from apps.versioning.models import CreativeAsset
from apps.workflows.models import ReviewCycle, ApprovalGroup, GroupMember
from django.contrib.auth.models import User

# Get asset
asset = CreativeAsset.objects.first()

if not asset:
    print("❌ No assets found. Please create a proof first.")
    exit()

# Get users
try:
    murali = User.objects.get(username='Murali')
    ganpat = User.objects.get(username='Ganpat')
    raj = User.objects.get(username='Raj')
    saranya = User.objects.get(username='Saranya')
except User.DoesNotExist as e:
    print(f"❌ User not found: {e}")
    exit()

# Create review cycle
review = ReviewCycle.objects.create(
    asset=asset,
    initiated_by=saranya,
    created_by=saranya,
    status='in_progress'
)

# Create Group 1 - Reviewers (unlocked)
group1 = ApprovalGroup.objects.create(
    review_cycle=review,
    name='Stage 1 - Reviewers',
    order=1,
    status='unlocked'
)
GroupMember.objects.create(group=group1, user=murali, role='approver')
GroupMember.objects.create(group=group1, user=ganpat, role='approver')

# Create Group 2 - Managers (locked)
group2 = ApprovalGroup.objects.create(
    review_cycle=review,
    name='Stage 2 - Managers',
    order=2,
    status='locked'
)
GroupMember.objects.create(group=group2, user=raj, role='approver')

print(f"✅ Review cycle created: {review.id}")
print(f"📄 Asset: {asset.name} (ID: {asset.id})")
print(f"👥 Group 1: {group1.name} - {group1.members.count()} members (Murali, Ganpat)")
print(f"👥 Group 2: {group2.name} - {group2.members.count()} members (Raj)")
print(f"\n🎯 Next steps:")
print(f"1. Refresh your browser")
print(f"2. Open the proof: {asset.name}")
print(f"3. You should see 'Show Workflow' button in FileViewer")
