"""
Test suite for proof status update and reviewer notifications feature.
Minimal tests focusing on core functionality:
1. Status transition from "Not Started" to "In Progress" when tracking view
2. Notification creation for reviewers
3. WebSocket broadcast method availability
"""
import json
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.utils import timezone
from apps.workflows.models import ReviewCycle, ApprovalGroup, GroupMember, WorkflowTemplate, WorkflowStage, WorkflowStageApprover
from apps.versioning.models import CreativeAsset, Project
from apps.notifications.models import Notification, NotificationLog
from apps.accounts.models import UserProfile


class ProofStatusTransitionTest(TestCase):
    """Test proof status transitions from 'not_started' to 'in_progress'"""
    
    def setUp(self):
        """Set up test data"""
        # Create users
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
        
        # Create project and asset
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.manager
        )
        
        self.asset = CreativeAsset.objects.create(
            name='Test Proof',
            project=self.project,
            file_type='pdf'
        )
        
        # Create workflow template
        self.template = WorkflowTemplate.objects.create(
            name='Test Template',
            created_by=self.manager,
            is_active=True
        )
        
        # Create workflow stage
        self.stage = WorkflowStage.objects.create(
            template=self.template,
            name='Review Stage',
            order=1
        )
        
        # Add approver to stage
        WorkflowStageApprover.objects.create(
            stage=self.stage,
            user=self.approver
        )
        
        # Create review cycle
        self.review_cycle = ReviewCycle.objects.create(
            asset=self.asset,
            template=self.template,
            status='not_started',
            initiated_by=self.manager,
            created_by=self.manager
        )
        
        # Create approval group
        self.group = ApprovalGroup.objects.create(
            review_cycle=self.review_cycle,
            stage=self.stage,
            name='Review Group',
            order=1,
            status='unlocked'
        )
        
        # Add group member
        self.member = GroupMember.objects.create(
            group=self.group,
            user=self.approver,
            socd_status='sent'
        )
        
        self.client = Client()
    
    def test_status_transitions_on_track_view(self):
        """Test that status transitions from 'not_started' to 'in_progress' when tracking view"""
        # Verify initial status
        self.review_cycle.refresh_from_db()
        self.assertEqual(self.review_cycle.status, 'not_started')
        
        # Call track_view endpoint with force_authenticate
        from rest_framework.test import APIClient
        api_client = APIClient()
        api_client.force_authenticate(user=self.approver)
        
        response = api_client.post(
            f'/api/workflows/review-cycles/{self.review_cycle.id}/track_view/',
            format='json'
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['review_cycle_status'], 'in_progress')
        self.assertTrue(data['status_changed'])
        
        # Verify status in database
        self.review_cycle.refresh_from_db()
        self.assertEqual(self.review_cycle.status, 'in_progress')
    
    def test_member_socd_updates_on_track_view(self):
        """Test that member SOCD status updates from 'sent' to 'open'"""
        # Verify initial SOCD status
        self.member.refresh_from_db()
        self.assertEqual(self.member.socd_status, 'sent')
        
        # Call track_view endpoint with force_authenticate
        from rest_framework.test import APIClient
        api_client = APIClient()
        api_client.force_authenticate(user=self.approver)
        
        response = api_client.post(
            f'/api/workflows/review-cycles/{self.review_cycle.id}/track_view/',
            format='json'
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['socd_status'], 'open')
        
        # Verify SOCD status in database
        self.member.refresh_from_db()
        self.assertEqual(self.member.socd_status, 'open')


class ReviewerNotificationTest(TestCase):
    """Test reviewer notifications on proof creation"""
    
    def setUp(self):
        """Set up test data"""
        # Create users
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
        
        # Create project and asset
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.manager
        )
        
        self.asset = CreativeAsset.objects.create(
            name='Test Proof',
            project=self.project,
            file_type='pdf'
        )
        
        # Create workflow template
        self.template = WorkflowTemplate.objects.create(
            name='Test Template',
            created_by=self.manager,
            is_active=True
        )
        
        # Create workflow stage
        self.stage = WorkflowStage.objects.create(
            template=self.template,
            name='Review Stage',
            order=1
        )
        
        # Add approvers to stage
        WorkflowStageApprover.objects.create(
            stage=self.stage,
            user=self.approver1
        )
        WorkflowStageApprover.objects.create(
            stage=self.stage,
            user=self.approver2
        )
    
    def test_notifications_created_for_all_reviewers(self):
        """Test that notifications are created for all reviewers when proof is created"""
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
        from apps.notifications.services import NotificationService
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
        from apps.notifications.services import NotificationService
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
        from apps.notifications.services import NotificationService
        NotificationService.notify_reviewers_new_proof(review_cycle)
        
        # Verify email notification logs
        email_logs = NotificationLog.objects.filter(
            delivery_method='email'
        )
        self.assertEqual(email_logs.count(), 2)


class WebSocketBroadcastTest(TestCase):
    """Test WebSocket broadcasting functionality"""
    
    def setUp(self):
        """Set up test data"""
        # Create users
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
        
        # Create project and asset
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.manager
        )
        
        self.asset = CreativeAsset.objects.create(
            name='Test Proof',
            project=self.project,
            file_type='pdf'
        )
        
        # Create workflow template
        self.template = WorkflowTemplate.objects.create(
            name='Test Template',
            created_by=self.manager,
            is_active=True
        )
        
        # Create workflow stage
        self.stage = WorkflowStage.objects.create(
            template=self.template,
            name='Review Stage',
            order=1
        )
        
        # Add approver to stage
        WorkflowStageApprover.objects.create(
            stage=self.stage,
            user=self.approver
        )
        
        # Create review cycle
        self.review_cycle = ReviewCycle.objects.create(
            asset=self.asset,
            template=self.template,
            status='not_started',
            initiated_by=self.manager,
            created_by=self.manager
        )
        
        # Create approval group
        self.group = ApprovalGroup.objects.create(
            review_cycle=self.review_cycle,
            stage=self.stage,
            name='Review Group',
            order=1,
            status='unlocked'
        )
        
        # Add group member
        self.member = GroupMember.objects.create(
            group=self.group,
            user=self.approver,
            socd_status='sent'
        )
    
    def test_broadcast_method_exists_and_callable(self):
        """Test that broadcast method exists and can be called without errors"""
        from apps.workflows.services import WorkflowService
        
        # Should not raise an error
        try:
            WorkflowService.broadcast_review_cycle_update(self.review_cycle)
        except Exception as e:
            self.fail(f"broadcast_review_cycle_update raised {type(e).__name__}: {e}")
