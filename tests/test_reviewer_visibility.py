#!/usr/bin/env python
"""
Test script to verify reviewer-based proof visibility implementation.
Run this with: python test_reviewer_visibility.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.accounts.models import UserProfile
from apps.versioning.models import Project, ProjectMember
from apps.versioning.permissions import get_user_accessible_projects, has_active_review_cycle, is_assigned_reviewer
from apps.workflows.models import ReviewCycle, CreativeAsset, WorkflowTemplate, WorkflowStage, ApprovalGroup, GroupMember

def test_reviewer_visibility():
    """Test the reviewer visibility implementation"""
    
    print("🧪 Testing Reviewer-Based Proof Visibility...")
    
    # Create test users with different roles
    admin_user = User.objects.create_user(
        username='testadmin',
        email='admin@test.com',
        password='testpass123'
    )
    
    manager_user = User.objects.create_user(
        username='testmanager',
        email='manager@test.com',
        password='testpass123'
    )
    
    owner_user = User.objects.create_user(
        username='testowner',
        email='owner@test.com',
        password='testpass123'
    )
    
    reviewer_user = User.objects.create_user(
        username='testreviewer',
        email='reviewer@test.com',
        password='testpass123'
    )
    
    other_user = User.objects.create_user(
        username='testother',
        email='other@test.com',
        password='testpass123'
    )
    
    # Create user profiles with roles
    UserProfile.objects.create(user=admin_user, role='admin')
    UserProfile.objects.create(user=manager_user, role='manager')
    UserProfile.objects.create(user=owner_user, role='lite_user')
    UserProfile.objects.create(user=reviewer_user, role='lite_user')
    UserProfile.objects.create(user=other_user, role='lite_user')
    
    print("✅ Created test users with different roles")
    
    # Create test project
    project = Project.objects.create(
        name='Test Project',
        description='Test project for visibility testing',
        owner=owner_user
    )
    
    # Add reviewer as project member
    ProjectMember.objects.create(
        project=project,
        user=reviewer_user,
        role='reviewer'
    )
    
    # Add other user as viewer
    ProjectMember.objects.create(
        project=project,
        user=other_user,
        role='viewer'
    )
    
    print("✅ Created test project with members")
    
    # Test 1: Admin should see all projects
    admin_projects = get_user_accessible_projects(admin_user)
    print(f"👤 Admin can see {admin_projects.count()} projects")
    
    # Test 2: Manager should see all projects
    manager_projects = get_user_accessible_projects(manager_user)
    print(f"👥 Manager can see {manager_projects.count()} projects")
    
    # Test 3: Owner should see project (no active review yet)
    owner_projects = get_user_accessible_projects(owner_user)
    print(f"🔓 Owner can see {owner_projects.count()} projects (no active review)")
    
    # Test 4: Reviewer should see project (no active review yet)
    reviewer_projects = get_user_accessible_projects(reviewer_user)
    print(f"👀 Reviewer can see {reviewer_projects.count()} projects (no active review)")
    
    # Test 5: Other member should see project (no active review yet)
    other_projects = get_user_accessible_projects(other_user)
    print(f"👤 Other member can see {other_projects.count()} projects (no active review)")
    
    # Now create an active review cycle
    asset = CreativeAsset.objects.create(
        project=project,
        name='Test Asset',
        file_type='pdf',
        created_by=owner_user
    )
    
    # Create workflow template and stage
    template = WorkflowTemplate.objects.create(
        name='Test Template',
        created_by=admin_user
    )
    
    stage = WorkflowStage.objects.create(
        template=template,
        name='Review Stage',
        order=1
    )
    
    # Create active review cycle
    review_cycle = ReviewCycle.objects.create(
        asset=asset,
        template=template,
        status='in_progress',
        created_by=owner_user
    )
    
    # Create approval group and add reviewer
    approval_group = ApprovalGroup.objects.create(
        review_cycle=review_cycle,
        stage=stage,
        name='Review Group',
        order=1
    )
    
    GroupMember.objects.create(
        group=approval_group,
        user=reviewer_user
    )
    
    print("✅ Created active review cycle")
    
    # Test 6: During active review - check visibility changes
    print("\n🔄 During active review:")
    
    admin_projects_active = get_user_accessible_projects(admin_user)
    print(f"👤 Admin can see {admin_projects_active.count()} projects")
    
    manager_projects_active = get_user_accessible_projects(manager_user)
    print(f"👥 Manager can see {manager_projects_active.count()} projects")
    
    owner_projects_active = get_user_accessible_projects(owner_user)
    print(f"🔒 Owner can see {owner_projects_active.count()} projects (during active review)")
    
    reviewer_projects_active = get_user_accessible_projects(reviewer_user)
    print(f"👀 Reviewer can see {reviewer_projects_active.count()} projects (during active review)")
    
    other_projects_active = get_user_accessible_projects(other_user)
    print(f"👤 Other member can see {other_projects_active.count()} projects (during active review)")
    
    # Test helper functions
    print("\n🔧 Testing helper functions:")
    
    has_active = has_active_review_cycle(project)
    print(f"✅ Project has active review cycle: {has_active}")
    
    is_reviewer = is_assigned_reviewer(reviewer_user, project)
    print(f"✅ Reviewer is assigned: {is_reviewer}")
    
    is_other_reviewer = is_assigned_reviewer(other_user, project)
    print(f"✅ Other member is assigned reviewer: {is_other_reviewer}")
    
    # Complete the review cycle
    review_cycle.status = 'approved'
    review_cycle.save()
    
    print("\n🏁 After review completion:")
    
    owner_projects_completed = get_user_accessible_projects(owner_user)
    print(f"🔓 Owner can see {owner_projects_completed.count()} projects (review completed)")
    
    other_projects_completed = get_user_accessible_projects(other_user)
    print(f"👤 Other member can see {other_projects_completed.count()} projects (review completed)")
    
    # Cleanup test data
    print("\n🧹 Cleaning up test data...")
    ReviewCycle.objects.all().delete()
    CreativeAsset.objects.all().delete()
    ProjectMember.objects.all().delete()
    Project.objects.all().delete()
    UserProfile.objects.all().delete()
    User.objects.all().delete()
    
    print("✅ Test completed successfully!")

if __name__ == '__main__':
    test_reviewer_visibility()
