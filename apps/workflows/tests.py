from django.test import TestCase
from django.contrib.auth.models import User
from apps.versioning.models import Project, CreativeAsset
from .models import WorkflowTemplate, WorkflowStage, ReviewCycle


class WorkflowTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.reviewer = User.objects.create_user(username='reviewer', password='testpass')
        self.template = WorkflowTemplate.objects.create(
            name='Test Workflow',
            created_by=self.user
        )
        self.stage = WorkflowStage.objects.create(
            template=self.template,
            name='Review',
            order=1
        )

    def test_workflow_template_creation(self):
        self.assertEqual(self.template.name, 'Test Workflow')
        self.assertEqual(self.template.created_by, self.user)

    def test_workflow_stage_creation(self):
        self.assertEqual(self.stage.template, self.template)
        self.assertEqual(self.stage.name, 'Review')
