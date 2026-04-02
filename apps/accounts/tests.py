from django.test import TestCase
from django.contrib.auth.models import User
from .models import UserProfile


class UserProfileTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

    def test_user_profile_creation(self):
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(profile.user, self.user)

    def test_user_profile_update(self):
        profile = self.user.profile
        profile.bio = 'Test bio'
        profile.save()
        self.assertEqual(profile.bio, 'Test bio')
