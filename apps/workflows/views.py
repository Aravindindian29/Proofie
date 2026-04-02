from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    WorkflowTemplate, WorkflowStage, ReviewCycle, StageApproval, 
    WorkflowTransition, ApprovalGroup, GroupMember
)
from .serializers import (
    WorkflowTemplateSerializer, WorkflowStageSerializer, ReviewCycleSerializer,
    ReviewCycleCreateSerializer, StageApprovalSerializer, ReviewCycleDetailSerializer,
    ApprovalGroupSerializer, GroupMemberSerializer
)
from .services import WorkflowService


class WorkflowTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = WorkflowTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkflowTemplate.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ReviewCycleViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewCycleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ReviewCycle.objects.filter(
            asset__project__owner=user
        ) | ReviewCycle.objects.filter(
            asset__project__members__user=user
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCycleCreateSerializer
        elif self.action == 'retrieve':
            return ReviewCycleDetailSerializer
        return ReviewCycleSerializer

    def perform_create(self, serializer):
        serializer.save(
            initiated_by=self.request.user,
            created_by=self.request.user
        )
        review_cycle = serializer.instance
        
        if review_cycle.template:
            # Use service to create groups
            WorkflowService.create_groups_for_review(review_cycle, review_cycle.template)

    @action(detail=True, methods=['post'])
    def approve_stage(self, request, pk=None):
        review_cycle = self.get_object()
        feedback = request.data.get('feedback', '')

        stage_approval = get_object_or_404(
            StageApproval,
            review_cycle=review_cycle,
            stage=review_cycle.current_stage,
            approver=request.user
        )

        stage_approval.status = 'approved'
        stage_approval.approved_at = timezone.now()
        stage_approval.feedback = feedback
        stage_approval.save()

        all_approved = not StageApproval.objects.filter(
            review_cycle=review_cycle,
            stage=review_cycle.current_stage,
            status='pending'
        ).exists()

        if all_approved:
            next_stage = review_cycle.template.stages.filter(
                order__gt=review_cycle.current_stage.order
            ).first()

            if next_stage:
                WorkflowTransition.objects.create(
                    review_cycle=review_cycle,
                    from_stage=review_cycle.current_stage,
                    to_stage=next_stage,
                    transitioned_by=request.user
                )
                review_cycle.current_stage = next_stage
                review_cycle.save()

                for approver in next_stage.approvers.all():
                    StageApproval.objects.create(
                        review_cycle=review_cycle,
                        stage=next_stage,
                        approver=approver.user
                    )
            else:
                review_cycle.status = 'completed'
                review_cycle.completed_at = timezone.now()
                review_cycle.save()

        serializer = self.get_serializer(review_cycle)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject_stage(self, request, pk=None):
        review_cycle = self.get_object()
        feedback = request.data.get('feedback', '')

        stage_approval = get_object_or_404(
            StageApproval,
            review_cycle=review_cycle,
            stage=review_cycle.current_stage,
            approver=request.user
        )

        stage_approval.status = 'rejected'
        stage_approval.approved_at = timezone.now()
        stage_approval.feedback = feedback
        stage_approval.save()

        review_cycle.status = 'rejected'
        review_cycle.save()

        serializer = self.get_serializer(review_cycle)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def request_changes(self, request, pk=None):
        review_cycle = self.get_object()
        feedback = request.data.get('feedback', '')

        stage_approval = get_object_or_404(
            StageApproval,
            review_cycle=review_cycle,
            stage=review_cycle.current_stage,
            approver=request.user
        )

        stage_approval.status = 'changes_requested'
        stage_approval.approved_at = timezone.now()
        stage_approval.feedback = feedback
        stage_approval.save()

        serializer = self.get_serializer(review_cycle)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def track_view(self, request, pk=None):
        """Track when a user views the proof (SOCD: Sent -> Open)"""
        review_cycle = self.get_object()
        member = WorkflowService.get_member_for_user(review_cycle, request.user)
        
        if not member:
            return Response(
                {'error': 'You are not a member of any group in this review cycle'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        WorkflowService.update_member_socd(member, 'view')
        
        return Response({
            'message': 'View tracked successfully',
            'socd_status': member.socd_status
        })
    
    @action(detail=True, methods=['post'])
    def member_decision(self, request, pk=None):
        """Record a member's decision (approve, reject, request changes)"""
        review_cycle = self.get_object()
        decision = request.data.get('decision')  # 'approved', 'rejected', 'changes_requested'
        feedback = request.data.get('feedback', '')
        
        if decision not in ['approved', 'rejected', 'changes_requested']:
            return Response(
                {'error': 'Invalid decision. Must be approved, rejected, or changes_requested'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        member = WorkflowService.get_member_for_user(review_cycle, request.user)
        
        if not member:
            return Response(
                {'error': 'You are not a member of any group in this review cycle'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user can participate (Lite users cannot)
        if not WorkflowService.can_user_participate(request.user, member.group):
            return Response(
                {'error': 'You do not have permission to make decisions. Lite users can only view.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if group is unlocked
        if member.group.status == 'locked':
            return Response(
                {'error': 'This group is still locked. Wait for previous groups to complete.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        WorkflowService.record_member_decision(member, decision, feedback)
        
        serializer = ReviewCycleDetailSerializer(review_cycle)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def skip_group(self, request, pk=None):
        """Manager can skip a group's approval process"""
        review_cycle = self.get_object()
        group_id = request.data.get('group_id')
        
        if not group_id:
            return Response(
                {'error': 'group_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is manager or admin
        user_role = getattr(request.user.profile, 'role', None)
        if user_role not in ['manager', 'admin']:
            return Response(
                {'error': 'Only managers and admins can skip groups'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            group = ApprovalGroup.objects.get(id=group_id, review_cycle=review_cycle)
            result = WorkflowService.skip_group(group, request.user)
            
            return Response({
                'message': f'Group {group.name} skipped successfully',
                'group': ApprovalGroupSerializer(group).data,
                'next_group_unlocked': result.get('next_group_unlocked', False)
            })
        except ApprovalGroup.DoesNotExist:
            return Response(
                {'error': 'Group not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def add_reviewer(self, request, pk=None):
        """Add a reviewer to a specific group in the review cycle"""
        review_cycle = self.get_object()
        
        # Check if user is manager or admin
        user_role = getattr(request.user.profile, 'role', None)
        if user_role not in ['manager', 'admin']:
            return Response(
                {'error': 'Only managers and admins can add reviewers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        group_id = request.data.get('group_id')
        user_id = request.data.get('user_id')
        
        if not group_id or not user_id:
            return Response(
                {'error': 'group_id and user_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth.models import User
            group = ApprovalGroup.objects.get(id=group_id, review_cycle=review_cycle)
            user = User.objects.get(id=user_id)
            
            # Check if user already exists in this group
            if GroupMember.objects.filter(group=group, user=user).exists():
                return Response(
                    {'error': 'User is already a member of this group'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create new group member
            member = GroupMember.objects.create(
                group=group,
                user=user,
                socd_status='sent',
                decision='pending'
            )
            
            return Response({
                'message': f'Added {user.username} to {group.name}',
                'member': GroupMemberSerializer(member).data
            })
        except ApprovalGroup.DoesNotExist:
            return Response(
                {'error': 'Group not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def remove_reviewer(self, request, pk=None):
        """Remove a reviewer from a specific group in the review cycle"""
        review_cycle = self.get_object()
        
        # Check if user is manager or admin
        user_role = getattr(request.user.profile, 'role', None)
        if user_role not in ['manager', 'admin']:
            return Response(
                {'error': 'Only managers and admins can remove reviewers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        member_id = request.data.get('member_id')
        
        if not member_id:
            return Response(
                {'error': 'member_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            member = GroupMember.objects.get(id=member_id, group__review_cycle=review_cycle)
            group_name = member.group.name
            user_name = member.user.username
            
            # Don't allow removing if they've already made a decision
            if member.decision != 'pending':
                return Response(
                    {'error': 'Cannot remove reviewer who has already made a decision'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            member.delete()
            
            return Response({
                'message': f'Removed {user_name} from {group_name}'
            })
        except GroupMember.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def available_reviewers(self, request):
        """Get list of users who can be added as reviewers (approvers and managers)"""
        from django.contrib.auth.models import User
        from apps.accounts.models import UserProfile
        
        # Get users with approver or manager roles
        reviewer_profiles = UserProfile.objects.filter(
            role__in=['approver', 'manager', 'admin']
        ).select_related('user')
        
        reviewers = []
        for profile in reviewer_profiles:
            reviewers.append({
                'id': profile.user.id,
                'username': profile.user.username,
                'email': profile.user.email,
                'first_name': profile.user.first_name,
                'last_name': profile.user.last_name,
                'role': profile.role
            })
        
        return Response(reviewers)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a review cycle - only managers who created it or admins"""
        review_cycle = self.get_object()
        
        # Check if user is admin or the manager who created it
        is_admin = hasattr(request.user, 'profile') and request.user.profile.role == 'admin'
        is_creator_manager = (
            hasattr(request.user, 'profile') and 
            request.user.profile.role == 'manager' and
            review_cycle.created_by == request.user
        )
        
        if not (is_admin or is_creator_manager):
            return Response(
                {'error': 'Only admins or the manager who created this proof can delete it'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        review_cycle.delete()
        return Response(
            {'message': 'Review cycle deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=True, methods=['get'])
    def group_status(self, request, pk=None):
        """Get status of all groups in the review cycle"""
        review_cycle = self.get_object()
        groups = review_cycle.groups.all()
        
        group_data = []
        for group in groups:
            progress = WorkflowService.get_group_progress(group)
            group_data.append({
                'group': ApprovalGroupSerializer(group).data,
                'progress': progress
            })
        
        return Response({
            'review_cycle_id': review_cycle.id,
            'status': review_cycle.status,
            'groups': group_data
        })
    
    @action(detail=True, methods=['get'])
    def my_status(self, request, pk=None):
        """Get current user's SOCD status and group information"""
        review_cycle = self.get_object()
        member = WorkflowService.get_member_for_user(review_cycle, request.user)
        
        if not member:
            return Response({
                'is_member': False,
                'message': 'You are not a member of any group in this review cycle'
            })
        
        return Response({
            'is_member': True,
            'member': GroupMemberSerializer(member).data,
            'group': ApprovalGroupSerializer(member.group).data,
            'can_decide': member.group.status in ['unlocked', 'in_progress'] and member.decision == 'pending'
        })
