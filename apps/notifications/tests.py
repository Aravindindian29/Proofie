from django.test import TestCase
from django.contrib.auth.models import User
from .models import Notification, NotificationPreference


class NotificationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

    def test_notification_creation(self):
        notification = Notification.objects.create(
            recipient=self.user,
            notification_type='comment_added',
            title='Test Notification',
            message='This is a test notification'
        )
        self.assertEqual(notification.recipient, self.user)
        self.assertFalse(notification.is_read)

    def test_notification_preference_creation(self):
        preference = NotificationPreference.objects.create(user=self.user)
        self.assertEqual(preference.user, self.user)
        self.assertTrue(preference.email_on_comment)
