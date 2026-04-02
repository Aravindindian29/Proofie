from django.test import TestCase
from django.contrib.auth.models import User
from .models import Project, CreativeAsset, FileVersion


class ProjectTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.project = Project.objects.create(name='Test Project', owner=self.user)

    def test_project_creation(self):
        self.assertEqual(self.project.name, 'Test Project')
        self.assertEqual(self.project.owner, self.user)

    def test_asset_creation(self):
        asset = CreativeAsset.objects.create(
            project=self.project,
            name='Test Asset',
            file_type='image',
            created_by=self.user
        )
        self.assertEqual(asset.project, self.project)
        self.assertEqual(asset.name, 'Test Asset')
