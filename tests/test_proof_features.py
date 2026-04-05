"""
Unit tests for proof status update and reviewer notification features.
Tests focus on service logic and model behavior.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from apps.workflows.models import ReviewCycle, ApprovalGroup, GroupMember, WorkflowTemplate, WorkflowStage, WorkflowStageApprover
from apps.versioning.models import CreativeAsset, Project
from apps.notifications.models import Notification, NotificationLog
from apps.notifications.services import NotificationService
from apps.workflows.services import WorkflowService
from apps.accounts.models import UserProfile


class StatusTransitionTest(TestCase):
    """Test status transition logic"""
    
    def setUp(self):
        """Set up test data"""
        self.manager = User.objects.create_user(
            username='manager',
            email='manager@test.com',
            password='testpass123'
        )
        UserProfile.objects.get_or_create(user=self.manager, defaults={'role': 'manager'})
        
        self.approver = User.objects.create_user(
            username='approver',
            email='approver@test.com',
            password='testpass123'
        )
        UserProfile.objects.get_or_create(user=self.approver, defaults={'role': 'approver'})
        
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.manager
        )
        
        self.asset = CreativeAsset.objects.create(
            name='Test Proof',
            project=self.project,
            file_type='pdf'
        )
        
        self.template = WorkflowTemplate.objects.create(
            name='Test Template',
            created_by=self.manager,
            is_active=True
        )
        
        self.stage = WorkflowStage.objects.create(
            template=self.template,
            name='Review Stage',
            order=1
        )
        
        WorkflowStageApprover.objects.create(
            stage=self.stage,
            user=self.approver
        )
        
        self.review_cycle = ReviewCycle.objects.create(
            asset=self.asset,
            template=self.template,
            status='not_started',
            initiated_by=self.manager,
            created_by=self.manager
        )
        
        self.group = ApprovalGroup.objects.create(
            review_cycle=self.review_cycle,
            stage=self.stage,
            name='Review Group',
            order=1,
            status='unlocked'
        )
        
        self.member = GroupMember.objects.create(
            group=self.group,
            user=self.approver,
            socd_status='sent'
        )
    
    def test_status_transitions_from_not_started_to_in_progress(self):
        """Test that status can transition from 'not_started' to 'in_progress'"""
        # Verify initial status
        self.assertEqual(self.review_cycle.status, 'not_started')
        
        # Simulate status transition
        self.review_cycle.status = 'in_progress'
        self.review_cycle.save()
        
        # Verify status changed
        self.review_cycle.refresh_from_db()
        self.assertEqual(self.review_cycle.status, 'in_progress')
    
    def test_member_socd_updates_from_sent_to_open(self):
        """Test that member SOCD status updates from 'sent' to 'open'"""
        # Verify initial SOCD status
        self.assertEqual(self.member.socd_status, 'sent')
        
        # Update SOCD status
        WorkflowService.update_member_socd(self.member, 'view')
        
        # Verify SOCD status changed
        self.member.refresh_from_db()
        self.assertEqual(self.member.socd_status, 'open')
    
    def test_group_socd_updates_when_member_opens(self):
        """Test that group SOCD status updates when first member opens"""
        # Verify initial group SOCD status
        self.assertEqual(self.group.socd_status, 'sent')
        
        # Update member SOCD
        WorkflowService.update_member_socd(self.member, 'view')
        
        # Verify group SOCD status changed
        self.group.refresh_from_db()
        self.assertEqual(self.group.socd_status, 'open')


class ReviewerNotificationTest(TestCase):
    """Test reviewer notification creation"""
    
    def setUp(self):
        """Set up test data"""
        self.manager = User.objects.create_user(
            username='manager',
            email='manager@test.com',
            password='testpass123'
        )
        UserProfile.objects.get_or_create(user=self.manager, defaults={'role': 'manager'})
        
        self.approver1 = User.objects.create_user(
            username='approver1',
            email='approver1@test.com',
            password='testpass123'
        )
        UserProfile.objects.get_or_create(user=self.approver1, defaults={'role': 'approver'})
        
        self.approver2 = User.objects.create_user(
            username='approver2',
            email='approver2@test.com',
            password='testpass123'
        )
        UserProfile.objects.get_or_create(user=self.approver2, defaults={'role': 'approver'})
        
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.manager
        )
        
        self.asset = CreativeAsset.objects.create(
            name='Test Proof',
            project=self.project,
            file_type='pdf'
        )
        
        self.template = WorkflowTemplate.objects.create(
            name='Test Template',
            created_by=self.manager,
            is_active=True
        )
        
        self.stage = WorkflowStage.objects.create(
            template=self.template,
            name='Review Stage',
            order=1
        )
        
        WorkflowStageApprover.objects.create(
            stage=self.stage,
            user=self.approver1
        )
        WorkflowStageApprover.objects.create(
            stage=self.stage,
            user=self.approver2
        )
    
    def test_notifications_created_for_all_reviewers(self):
        """Test that notifications are created for all reviewers"""
        # Create review cycle
        review_cycle = ReviewCycle.objects.create(
            asset=self.asset,
            template=self.template,
            status='not_started',
            initiated_by=self.manager,
            created_by=self.manager
        )
        
        # Create approval group
        group = ApprovalGroup.objects.create(
            review_cycle=review_cycle,
            stage=self.stage,
            name='Review Group',
            order=1,
            status='unlocked'
        )
        
        # Add group members
        GroupMember.objects.create(
            group=group,
            user=self.approver1,
            socd_status='sent'
        )
        GroupMember.objects.create(
            group=group,
            user=self.approver2,
            socd_status='sent'
        )
        
        # Trigger notification service
        NotificationService.notify_reviewers_new_proof(review_cycle)
        
        # Verify notifications were created
        notifications = Notification.objects.filter(
            notification_type='new_proof_assigned'
        )
        self.assertEqual(notifications.count(), 2)
        
        # Verify both approvers received notifications
        recipient_ids = set(n.recipient.id for n in notifications)
        self.assertIn(self.approver1.id, recipient_ids)
        self.assertIn(self.approver2.id, recipient_ids)
    
    def test_in_app_notification_logs_created(self):
        """Test that in-app notification logs are created"""
        # Create review cycle
        review_cycle = ReviewCycle.objects.create(
            asset=self.asset,
            template=self.template,
            status='not_started',
            initiated_by=self.manager,
            created_by=self.manager
        )
        
        # Create approval group
        group = ApprovalGroup.objects.create(
            review_cycle=review_cycle,
            stage=self.stage,
            name='Review Group',
            order=1,
            status='unlocked'
        )
        
        # Add group members
        GroupMember.objects.create(
            group=group,
            user=self.approver1,
            socd_status='sent'
        )
        GroupMember.objects.create(
            group=group,
            user=self.approver2,
            socd_status='sent'
        )
        
        # Trigger notification service
        NotificationService.notify_reviewers_new_proof(review_cycle)
        
        # Verify in-app notification logs
        in_app_logs = NotificationLog.objects.filter(
            delivery_method='in_app',
            status='sent'
        )
        self.assertEqual(in_app_logs.count(), 2)
    
    def test_email_notification_logs_created(self):
        """Test that email notification logs are created"""
        # Create review cycle
        review_cycle = ReviewCycle.objects.create(
            asset=self.asset,
            template=self.template,
            status='not_started',
            initiated_by=self.manager,
            created_by=self.manager
        )
        
        # Create approval group
        group = ApprovalGroup.objects.create(
            review_cycle=review_cycle,
            stage=self.stage,
            name='Review Group',
            order=1,
            status='unlocked'
        )
        
        # Add group members
        GroupMember.objects.create(
            group=group,
            user=self.approver1,
            socd_status='sent'
        )
        GroupMember.objects.create(
            group=group,
            user=self.approver2,
            socd_status='sent'
        )
        
        # Trigger notification service
        NotificationService.notify_reviewers_new_proof(review_cycle)
        
        # Verify email notification logs
        email_logs = NotificationLog.objects.filter(
            delivery_method='email'
        )
        self.assertEqual(email_logs.count(), 2)


class WebSocketBroadcastTest(TestCase):
    """Test WebSocket broadcast functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.manager = User.objects.create_user(
            username='manager',
            email='manager@test.com',
            password='testpass123'
        )
        UserProfile.objects.get_or_create(user=self.manager, defaults={'role': 'manager'})
        
        self.approver = User.objects.create_user(
            username='approver',
            email='approver@test.com',
            password='testpass123'
        )
        UserProfile.objects.get_or_create(user=self.approver, defaults={'role': 'approver'})
        
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.manager
        )
        
        self.asset = CreativeAsset.objects.create(
            name='Test Proof',
            project=self.project,
            file_type='pdf'
        )
        
        self.template = WorkflowTemplate.objects.create(
            name='Test Template',
            created_by=self.manager,
            is_active=True
        )
        
        self.stage = WorkflowStage.objects.create(
            template=self.template,
            name='Review Stage',
            order=1
        )
        
        WorkflowStageApprover.objects.create(
            stage=self.stage,
            user=self.approver
        )
        
        self.review_cycle = ReviewCycle.objects.create(
            asset=self.asset,
            template=self.template,
            status='not_started',
            initiated_by=self.manager,
            created_by=self.manager
        )
        
        self.group = ApprovalGroup.objects.create(
            review_cycle=self.review_cycle,
            stage=self.stage,
            name='Review Group',
            order=1,
            status='unlocked'
        )
        
        self.member = GroupMember.objects.create(
            group=self.group,
            user=self.approver,
            socd_status='sent'
        )
    
    def test_broadcast_method_callable(self):
        """Test that broadcast method exists and can be called"""
        # Should not raise an error
        try:
            WorkflowService.broadcast_review_cycle_update(self.review_cycle)
        except Exception as e:
            self.fail(f"broadcast_review_cycle_update raised {type(e).__name__}: {e}")
    
    def test_broadcast_with_multiple_members(self):
        """Test that broadcast method handles multiple members"""
        # Create additional approver
        approver2 = User.objects.create_user(
            username='approver2',
            email='approver2@test.com',
            password='testpass123'
        )
        UserProfile.objects.get_or_create(user=approver2, defaults={'role': 'approver'})
        
        # Add second member to group
        GroupMember.objects.create(
            group=self.group,
            user=approver2,
            socd_status='sent'
        )
        
        # Should not raise an error
        try:
            WorkflowService.broadcast_review_cycle_update(self.review_cycle)
        except Exception as e:
            self.fail(f"broadcast_review_cycle_update raised {type(e).__name__}: {e}")
