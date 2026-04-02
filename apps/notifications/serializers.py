from rest_framework import serializers
from .models import Notification, NotificationPreference, NotificationLog
from apps.versioning.serializers import UserBasicSerializer


class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = ['id', 'delivery_method', 'status', 'sent_at', 'error_message']


class NotificationSerializer(serializers.ModelSerializer):
    recipient = UserBasicSerializer(read_only=True)
    logs = NotificationLogSerializer(many=True, read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'notification_type', 'title', 'message',
            'is_read', 'read_at', 'created_at', 'updated_at', 'logs'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'email_on_comment', 'email_on_annotation', 'email_on_approval',
            'email_on_rejection', 'email_on_mention', 'push_on_comment',
            'push_on_annotation', 'push_on_approval', 'push_on_rejection',
            'push_on_mention', 'digest_frequency'
        ]
