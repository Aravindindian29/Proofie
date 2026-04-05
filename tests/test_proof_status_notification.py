"""
Test suite for proof status update and reviewer notifications feature.
Tests:
1. Status transition from "Not Started" to "In Progress" when opening PDF viewer
2. Email and in-app notifications sent to reviewers on proof creation
3. Real-time WebSocket updates for status changes
"""
import json
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.utils import timezone
from apps.workflows.models import ReviewCycle, ApprovalGroup, GroupMember, WorkflowTemplate, WorkflowStage, WorkflowStageApprover
from apps.versioning.models import CreativeAsset, Project
from apps.notifications.models import Notification, NotificationLog
from apps.accounts.models import UserProfile


class ProofStatusUpdateTestCase(TestCase):
    """Test proof status transitions"""
    
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
        StageApproval.objects.create(
            stage=self.stage,
            approver=self.approver
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
    
    def test_status_transition_on_track_view(self):
        """Test that status transitions from 'not_started' to 'in_progress' when tracking view"""
        # Login as approver
        self.client.login(username='approver', password='testpass123')
        
        # Verify initial status
        self.review_cycle.refresh_from_db()
        self.assertEqual(self.review_cycle.status, 'not_started')
        
        # Call track_view endpoint
        response = self.client.post(
            f'/api/workflows/review-cycles/{self.review_cycle.id}/track_view/',
            content_type='application/json'
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['review_cycle_status'], 'in_progress')
        self.assertTrue(data['status_changed'])
        
        # Verify status in database
        self.review_cycle.refresh_from_db()
        self.assertEqual(self.review_cycle.status, 'in_progress')
    
    def test_member_socd_update_on_track_view(self):
        """Test that member SOCD status updates from 'sent' to 'open' when tracking view"""
        # Login as approver
        self.client.login(username='approver', password='testpass123')
        
        # Verify initial SOCD status
        self.member.refresh_from_db()
        self.assertEqual(self.member.socd_status, 'sent')
        
        # Call track_view endpoint
        response = self.client.post(
            f'/api/workflows/review-cycles/{self.review_cycle.id}/track_view/',
            content_type='application/json'
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['socd_status'], 'open')
        
        # Verify SOCD status in database
        self.member.refresh_from_db()
        self.assertEqual(self.member.socd_status, 'open')


class ReviewerNotificationTestCase(TestCase):
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
        StageApproval.objects.create(
            stage=self.stage,
            approver=self.approver1
        )
        StageApproval.objects.create(
            stage=self.stage,
            approver=self.approver2
        )
        
        self.client = Client()
    
    def test_notifications_created_on_proof_creation(self):
        """Test that notifications are created for all reviewers when proof is created"""
        # Login as manager
        self.client.login(username='manager', password='testpass123')
        
        # Create review cycle via API
        response = self.client.post(
            '/api/workflows/review-cycles/',
            data=json.dumps({
                'asset': self.asset.id,
                'template_id': self.template.id,
                'notes': 'Test proof'
            }),
            content_type='application/json'
        )
        
        # Verify response
        self.assertEqual(response.status_code, 201)
        
        # Verify notifications were created
        notifications = Notification.objects.filter(
            notification_type='new_proof_assigned'
        )
        self.assertEqual(notifications.count(), 2)
        
        # Verify both approvers received notifications
        recipient_ids = set(n.recipient.id for n in notifications)
        self.assertIn(self.approver1.id, recipient_ids)
        self.assertIn(self.approver2.id, recipient_ids)
    
    def test_in_app_notification_log_created(self):
        """Test that in-app notification logs are created"""
        # Create review cycle
        review_cycle = ReviewCycle.objects.create(
            asset=self.asset,
            template=self.template,
            status='not_started',
            initiated_by=self.manager,
            created_by=self.manager
        )
        
        # Create approval groups
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
    
    def test_email_notification_log_created(self):
        """Test that email notification logs are created"""
        # Create review cycle
        review_cycle = ReviewCycle.objects.create(
            asset=self.asset,
            template=self.template,
            status='not_started',
            initiated_by=self.manager,
            created_by=self.manager
        )
        
        # Create approval groups
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
        
        # Verify email notification logs (may be failed if email not configured)
        email_logs = NotificationLog.objects.filter(
            delivery_method='email'
        )
        self.assertEqual(email_logs.count(), 2)


class WebSocketBroadcastTestCase(TestCase):
    """Test WebSocket broadcasting of status updates"""
    
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
        StageApproval.objects.create(
            stage=self.stage,
            approver=self.approver
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
    
    def test_broadcast_method_exists(self):
        """Test that broadcast method exists and can be called"""
        from apps.workflows.services import WorkflowService
        
        # Should not raise an error
        try:
            WorkflowService.broadcast_review_cycle_update(self.review_cycle)
        except Exception as e:
            self.fail(f"broadcast_review_cycle_update raised {type(e).__name__}: {e}")
