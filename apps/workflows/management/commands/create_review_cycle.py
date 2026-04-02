from django.core.management.base import BaseCommand
from apps.versioning.models import CreativeAsset
from apps.workflows.models import ReviewCycle, ApprovalGroup, GroupMember, WorkflowTemplate, WorkflowStage
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Create a review cycle for testing workflow features'

    def handle(self, *args, **options):
        # Get asset
        asset = CreativeAsset.objects.first()
        
        if not asset:
            self.stdout.write(self.style.ERROR('❌ No assets found. Please create a proof first.'))
            return

        # Get users
        try:
            murali = User.objects.get(username='Murali')
            ganpat = User.objects.get(username='Ganpat')
            raj = User.objects.get(username='Raj')
            saranya = User.objects.get(username='Saranya')
        except User.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f'❌ User not found: {e}'))
            return

        # Create or get workflow template
        template, created = WorkflowTemplate.objects.get_or_create(
            name='Standard Approval Workflow',
            defaults={
                'description': '2-stage approval process for testing',
                'created_by': saranya,
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Created workflow template: {template.name}'))
        
        # Create workflow stages
        stage1, _ = WorkflowStage.objects.get_or_create(
            template=template,
            order=1,
            defaults={
                'name': 'Initial Review',
                'description': 'First stage review by approvers',
                'requires_approval': True,
                'can_reject': True,
                'can_request_changes': True
            }
        )
        
        stage2, _ = WorkflowStage.objects.get_or_create(
            template=template,
            order=2,
            defaults={
                'name': 'Manager Approval',
                'description': 'Final approval by managers',
                'requires_approval': True,
                'can_reject': True,
                'can_request_changes': True
            }
        )

        # Create review cycle
        review = ReviewCycle.objects.create(
            asset=asset,
            template=template,
            initiated_by=saranya,
            created_by=saranya,
            status='in_progress',
            current_stage=stage1
        )

        # Create Group 1 - Reviewers (unlocked)
        group1 = ApprovalGroup.objects.create(
            review_cycle=review,
            stage=stage1,
            name='Stage 1 - Reviewers',
            order=1,
            status='unlocked'
        )
        GroupMember.objects.create(group=group1, user=murali)
        GroupMember.objects.create(group=group1, user=ganpat)

        # Create Group 2 - Managers (locked)
        group2 = ApprovalGroup.objects.create(
            review_cycle=review,
            stage=stage2,
            name='Stage 2 - Managers',
            order=2,
            status='locked'
        )
        GroupMember.objects.create(group=group2, user=raj)

        self.stdout.write(self.style.SUCCESS(f'✅ Review cycle created: {review.id}'))
        self.stdout.write(f'📄 Asset: {asset.name} (ID: {asset.id})')
        self.stdout.write(f'👥 Group 1: {group1.name} - {group1.members.count()} members (Murali, Ganpat)')
        self.stdout.write(f'👥 Group 2: {group2.name} - {group2.members.count()} members (Raj)')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('🎯 Next steps:'))
        self.stdout.write('1. Refresh your browser')
        self.stdout.write(f'2. Open the proof: {asset.name}')
        self.stdout.write('3. You should see "Show Workflow" button in FileViewer')
