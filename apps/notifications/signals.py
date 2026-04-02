from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.annotations.models import Annotation, AnnotationReply
from apps.workflows.models import StageApproval
from .models import Notification
from django.contrib.contenttypes.models import ContentType


@receiver(post_save, sender=Annotation)
def notify_on_annotation(sender, instance, created, **kwargs):
    if created:
        project_members = instance.version.asset.project.members.all()
        for member in project_members:
            if member.user != instance.author:
                Notification.objects.create(
                    recipient=member.user,
                    notification_type='annotation_created',
                    title='New Annotation',
                    message=f'{instance.author.username} added an annotation on {instance.version.asset.name}',
                    content_type=ContentType.objects.get_for_model(Annotation),
                    object_id=instance.id
                )


@receiver(post_save, sender=AnnotationReply)
def notify_on_annotation_reply(sender, instance, created, **kwargs):
    if created:
        annotation = instance.annotation
        if annotation.author != instance.author:
            Notification.objects.create(
                recipient=annotation.author,
                notification_type='comment_added',
                title='New Reply',
                message=f'{instance.author.username} replied to your annotation',
                content_type=ContentType.objects.get_for_model(AnnotationReply),
                object_id=instance.id
            )


@receiver(post_save, sender=StageApproval)
def notify_on_stage_approval(sender, instance, created, **kwargs):
    if not created:
        if instance.status == 'approved':
            notification_type = 'stage_approved'
            title = 'Stage Approved'
            message = f'{instance.approver.username} approved {instance.stage.name}'
        elif instance.status == 'rejected':
            notification_type = 'stage_rejected'
            title = 'Stage Rejected'
            message = f'{instance.approver.username} rejected {instance.stage.name}'
        elif instance.status == 'changes_requested':
            notification_type = 'changes_requested'
            title = 'Changes Requested'
            message = f'{instance.approver.username} requested changes on {instance.stage.name}'
        else:
            return

        project_members = instance.review_cycle.asset.project.members.all()
        for member in project_members:
            if member.user != instance.approver:
                Notification.objects.create(
                    recipient=member.user,
                    notification_type=notification_type,
                    title=title,
                    message=message,
                    content_type=ContentType.objects.get_for_model(StageApproval),
                    object_id=instance.id
                )
