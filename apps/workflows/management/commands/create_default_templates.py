from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.workflows.models import WorkflowTemplate, WorkflowStage


class Command(BaseCommand):
    help = 'Create default workflow templates (3-stage and 5-stage)'

    def handle(self, *args, **options):
        self.stdout.write('Creating default workflow templates...')
        
        # Get or create a system user for default templates
        system_user, _ = User.objects.get_or_create(
            username='system',
            defaults={
                'email': 'system@proofie.local',
                'is_active': False
            }
        )
        
        # Create 3-stage workflow template
        template_3_stage, created = WorkflowTemplate.objects.get_or_create(
            name='3-Stage Approval Workflow',
            is_default=True,
            defaults={
                'description': 'Standard 3-stage approval workflow with sequential review stages',
                'created_by': system_user,
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('✓ Created 3-Stage Approval Workflow'))
            
            # Create stages for 3-stage template
            WorkflowStage.objects.create(
                template=template_3_stage,
                name='Stage 1',
                description='Initial review stage',
                order=1,
                requires_approval=True,
                can_reject=True,
                can_request_changes=True
            )
            
            WorkflowStage.objects.create(
                template=template_3_stage,
                name='Stage 2',
                description='Secondary review stage',
                order=2,
                requires_approval=True,
                can_reject=True,
                can_request_changes=True
            )
            
            WorkflowStage.objects.create(
                template=template_3_stage,
                name='Stage 3',
                description='Final review stage',
                order=3,
                requires_approval=True,
                can_reject=True,
                can_request_changes=True
            )
            
            self.stdout.write(self.style.SUCCESS('  ✓ Created 3 stages'))
        else:
            self.stdout.write(self.style.WARNING('  → 3-Stage template already exists'))
        
        # Create 5-stage workflow template
        template_5_stage, created = WorkflowTemplate.objects.get_or_create(
            name='5-Stage Approval Workflow',
            is_default=True,
            defaults={
                'description': 'Comprehensive 5-stage approval workflow for detailed review process',
                'created_by': system_user,
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('✓ Created 5-Stage Approval Workflow'))
            
            # Create stages for 5-stage template with specific names
            stage_configs = [
                {
                    'name': 'ProofManagers',
                    'description': 'Initial proof management review',
                    'order': 1
                },
                {
                    'name': 'Initial L&C',
                    'description': 'Initial Legal & Compliance review',
                    'order': 2
                },
                {
                    'name': 'Group',
                    'description': 'Group review stage',
                    'order': 3
                },
                {
                    'name': 'Final Compliance',
                    'description': 'Final compliance verification',
                    'order': 4
                },
                {
                    'name': 'FEB Review',
                    'description': 'Final Executive Board review',
                    'order': 5
                }
            ]
            
            for stage_config in stage_configs:
                WorkflowStage.objects.create(
                    template=template_5_stage,
                    name=stage_config['name'],
                    description=stage_config['description'],
                    order=stage_config['order'],
                    requires_approval=True,
                    can_reject=True,
                    can_request_changes=True
                )
            
            self.stdout.write(self.style.SUCCESS('  ✓ Created 5 stages'))
        else:
            self.stdout.write(self.style.WARNING('  → 5-Stage template already exists'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Default templates setup complete!'))
        self.stdout.write('\nAvailable templates:')
        self.stdout.write('  1. 3-Stage Approval Workflow (3 stages)')
        self.stdout.write('  2. 5-Stage Approval Workflow (5 stages)')
        self.stdout.write('\nAdmins can customize stage names and add approvers via the admin panel.')
