"""
Test the fixed status transition functionality.
Tests that any authenticated user can trigger status transition.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from apps.workflows.models import ReviewCycle, ApprovalGroup, WorkflowTemplate, WorkflowStage, WorkflowStageApprover, GroupMember
from apps.versioning.models import CreativeAsset, Project
from apps.accounts.models import UserProfile
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token


class StatusTransitionFixTest(TestCase):
    """Test that status transition works for any authenticated user"""
    
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
        
        self.non_member = User.objects.create_user(
            username='nonmember',
            email='nonmember@test.com',
            password='testpass123'
        )
        UserProfile.objects.get_or_create(user=self.non_member, defaults={'role': 'approver'})
        
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
        
        # Create workflow template and stage
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
        
        # Create approver in stage
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
        
        # Add approver to group
        self.member = GroupMember.objects.create(
            group=self.group,
            user=self.approver,
            socd_status='sent'
        )
        
        # Create API clients
        self.manager_client = APIClient()
        self.manager_client.force_authenticate(user=self.manager)
        
        self.approver_client = APIClient()
        self.approver_client.force_authenticate(user=self.approver)
        
        self.non_member_client = APIClient()
        self.non_member_client.force_authenticate(user=self.non_member)
    
    def test_manager_can_trigger_status_transition(self):
        """Test that manager can trigger status transition"""
        self.assertEqual(self.review_cycle.status, 'not_started')
        
        response = self.manager_client.post(
            f'/api/workflows/review-cycles/{self.review_cycle.id}/track_view/',
            format='json'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['status_changed'])
        self.assertEqual(response.data['review_cycle_status'], 'in_progress')
        self.assertFalse(response.data['user_is_member'])  # Manager is not a group member
        
        self.review_cycle.refresh_from_db()
        self.assertEqual(self.review_cycle.status, 'in_progress')
    
    def test_approver_can_trigger_status_transition(self):
        """Test that approver (group member) can trigger status transition"""
        self.assertEqual(self.review_cycle.status, 'not_started')
        
        response = self.approver_client.post(
            f'/api/workflows/review-cycles/{self.review_cycle.id}/track_view/',
            format='json'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['status_changed'])
        self.assertEqual(response.data['review_cycle_status'], 'in_progress')
        self.assertTrue(response.data['user_is_member'])  # Approver is a group member
        self.assertEqual(response.data['socd_status'], 'open')
        
        self.review_cycle.refresh_from_db()
        self.assertEqual(self.review_cycle.status, 'in_progress')
        
        self.member.refresh_from_db()
        self.assertEqual(self.member.socd_status, 'open')
    
    def test_non_member_can_trigger_status_transition(self):
        """Test that non-member can trigger status transition"""
        self.assertEqual(self.review_cycle.status, 'not_started')
        
        response = self.non_member_client.post(
            f'/api/workflows/review-cycles/{self.review_cycle.id}/track_view/',
            format='json'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['status_changed'])
        self.assertEqual(response.data['review_cycle_status'], 'in_progress')
        self.assertFalse(response.data['user_is_member'])  # Non-member is not a group member
        
        self.review_cycle.refresh_from_db()
        self.assertEqual(self.review_cycle.status, 'in_progress')
    
    def test_status_transition_is_idempotent(self):
        """Test that status transition only happens once"""
        # First transition
        response = self.manager_client.post(
            f'/api/workflows/review-cycles/{self.review_cycle.id}/track_view/',
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['status_changed'])
        
        self.review_cycle.refresh_from_db()
        self.assertEqual(self.review_cycle.status, 'in_progress')
        
        # Second attempt should not change status
        response = self.approver_client.post(
            f'/api/workflows/review-cycles/{self.review_cycle.id}/track_view/',
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['status_changed'])  # No change this time
        self.assertEqual(response.data['review_cycle_status'], 'in_progress')
        
        self.review_cycle.refresh_from_db()
        self.assertEqual(self.review_cycle.status, 'in_progress')  # Still in_progress
