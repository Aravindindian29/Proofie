from django.test import TestCase
from django.contrib.auth.models import User
from apps.versioning.models import Project, CreativeAsset, FileVersion
from .models import Annotation


class AnnotationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.project = Project.objects.create(name='Test Project', owner=self.user)
        self.asset = CreativeAsset.objects.create(
            project=self.project,
            name='Test Asset',
            file_type='image',
            created_by=self.user
        )
        self.version = FileVersion.objects.create(
            asset=self.asset,
            version_number=1,
            file='test.jpg',
            file_size=1024,
            uploaded_by=self.user
        )

    def test_annotation_creation(self):
        annotation = Annotation.objects.create(
            version=self.version,
            author=self.user,
            x_coordinate=100.0,
            y_coordinate=200.0,
            content='Test annotation'
        )
        self.assertEqual(annotation.version, self.version)
        self.assertEqual(annotation.author, self.user)
