from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import Notification, NotificationLog
from apps.workflows.models import GroupMember
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def notify_reviewers_new_proof(review_cycle):
        """
        Send notifications to all reviewers when a new proof is created.
        Sends both in-app and email notifications.
        
        Args:
            review_cycle: ReviewCycle instance
            
        Returns:
            List of created Notification instances
        """
        # Get all group members from all groups in this review cycle
        # Use a set to deduplicate by user since distinct('user') is not supported by SQLite
        member_dict = {}
        for member in GroupMember.objects.filter(
            group__review_cycle=review_cycle
        ).select_related('user', 'group'):
            if member.user.id not in member_dict:
                member_dict[member.user.id] = member
        members = list(member_dict.values())
        
        notifications = []
        asset_name = review_cycle.asset.name if review_cycle.asset else 'Untitled Proof'
        
        for member in members:
            # Create notification
            notification = Notification.objects.create(
                recipient=member.user,
                notification_type='new_proof_assigned',
                title='New Proof Available for Review',
                message=f'You have been assigned to review "{asset_name}" in {member.group.name}.',
                content_type=ContentType.objects.get_for_model(review_cycle),
                object_id=review_cycle.id,
                is_read=False
            )
            notifications.append(notification)
            
            # Log in-app notification
            NotificationLog.objects.create(
                notification=notification,
                delivery_method='in_app',
                status='sent',
                sent_at=timezone.now()
            )
            
            # Send WebSocket notification
            try:
                NotificationService.send_websocket_notification(notification)
            except Exception as e:
                logger.error(f"Failed to send WebSocket notification: {e}")
            
            # Send email notification
            try:
                NotificationService.send_reviewer_notification_email(
                    member.user, asset_name, member.group.name, review_cycle
                )
                # Log email notification
                NotificationLog.objects.create(
                    notification=notification,
                    delivery_method='email',
                    status='sent',
                    sent_at=timezone.now()
                )
            except Exception as e:
                logger.error(f"Failed to send email notification to {member.user.email}: {e}")
                # Log failed email notification
                NotificationLog.objects.create(
                    notification=notification,
                    delivery_method='email',
                    status='failed',
                    error_message=str(e)
                )
        
        return notifications
    
    @staticmethod
    def send_websocket_notification(notification):
        """
        Send notification via WebSocket to user's channel.
        
        Args:
            notification: Notification instance
        """
        channel_layer = get_channel_layer()
        
        if channel_layer:
            # Send to user's notification channel
            async_to_sync(channel_layer.group_send)(
                f'notifications_{notification.recipient.id}',
                {
                    'type': 'notification_message',
                    'notification': {
                        'id': notification.id,
                        'type': notification.notification_type,
                        'title': notification.title,
                        'message': notification.message,
                        'is_read': notification.is_read,
                        'created_at': notification.created_at.isoformat(),
                    }
                }
            )
    
    @staticmethod
    def mark_as_read(notification_id, user):
        """
        Mark a notification as read.
        
        Args:
            notification_id: ID of the notification
            user: User instance
            
        Returns:
            Updated Notification instance or None
        """
        try:
            notification = Notification.objects.get(id=notification_id, recipient=user)
            if not notification.is_read:
                notification.is_read = True
                notification.read_at = timezone.now()
                notification.save()
            return notification
        except Notification.DoesNotExist:
            return None
    
    @staticmethod
    def send_reviewer_notification_email(user, asset_name, group_name, review_cycle):
        """
        Send email notification to reviewer when assigned to a new proof.
        
        Args:
            user: User instance (reviewer)
            asset_name: Name of the proof/asset
            group_name: Name of the approval group
            review_cycle: ReviewCycle instance
            
        Returns:
            int: Result of send_mail (1 if successful)
        """
        try:
            context = {
                'user': user,
                'asset_name': asset_name,
                'group_name': group_name,
                'review_cycle_id': review_cycle.id,
                'frontend_url': settings.FRONTEND_URL,
                'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@proofie.com'),
            }
            
            # Try to render HTML template
            try:
                html_message = render_to_string('emails/new_proof_notification.html', context)
                message = strip_tags(html_message)
            except:
                # Fallback to plain text if template doesn't exist
                message = f"""
Hi {user.first_name or user.username},

A new proof has been assigned to you for review.

Proof: {asset_name}
Group: {group_name}

Please log in to Proofie to review the proof:
{settings.FRONTEND_URL}

If you have any questions, feel free to contact our support team.

Thanks,
The Proofie Team
                """
                html_message = None
            
            # Send email
            result = send_mail(
                subject=f'New Proof Available for Review: {asset_name}',
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@proofie.com'),
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Reviewer notification email sent to {user.email} for proof {asset_name}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to send reviewer notification email to {user.email}: {str(e)}")
            raise
    
    @staticmethod
    def get_unread_count(user):
        """
        Get count of unread notifications for a user.
        
        Args:
            user: User instance
            
        Returns:
            Integer count of unread notifications
        """
        return Notification.objects.filter(recipient=user, is_read=False).count()
