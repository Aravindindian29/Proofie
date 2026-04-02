from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('comment_added', 'Comment Added'),
        ('annotation_created', 'Annotation Created'),
        ('stage_approved', 'Stage Approved'),
        ('stage_rejected', 'Stage Rejected'),
        ('changes_requested', 'Changes Requested'),
        ('review_completed', 'Review Completed'),
        ('mentioned', 'Mentioned'),
        ('version_uploaded', 'Version Uploaded'),
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', '-created_at']),
        ]

    def __str__(self):
        return f"{self.notification_type} - {self.recipient.username}"


class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preference')
    
    email_on_comment = models.BooleanField(default=True)
    email_on_annotation = models.BooleanField(default=True)
    email_on_approval = models.BooleanField(default=True)
    email_on_rejection = models.BooleanField(default=True)
    email_on_mention = models.BooleanField(default=True)
    
    push_on_comment = models.BooleanField(default=True)
    push_on_annotation = models.BooleanField(default=True)
    push_on_approval = models.BooleanField(default=True)
    push_on_rejection = models.BooleanField(default=True)
    push_on_mention = models.BooleanField(default=True)
    
    digest_frequency = models.CharField(
        max_length=20,
        choices=[
            ('instant', 'Instant'),
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
            ('never', 'Never'),
        ],
        default='instant'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification Preferences - {self.user.username}"


class NotificationLog(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='logs')
    delivery_method = models.CharField(
        max_length=20,
        choices=[
            ('in_app', 'In App'),
            ('email', 'Email'),
            ('push', 'Push'),
            ('websocket', 'WebSocket'),
        ]
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('sent', 'Sent'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"{self.delivery_method} - {self.status}"
