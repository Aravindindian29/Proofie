from django.utils import timezone
from django.db.models import Q
from .models import ApprovalGroup, GroupMember, ReviewCycle
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)


class WorkflowService:
    """
    Business logic for workflow approval and SOCD tracking
    """
    
    @staticmethod
    def check_and_unlock_next_group(group):
        """
        Check if majority approved and unlock next group.
        Uses strictest decision aggregation logic.
        """
        members = group.members.all()
        total_members = members.count()
        
        if total_members == 0:
            return
        
        # Count decisions
        approved_count = members.filter(decision='approved').count()
        rejected_count = members.filter(decision='rejected').count()
        changes_count = members.filter(decision='changes_requested').count()
        
        # Calculate if majority reached decision
        decided_count = approved_count + rejected_count + changes_count
        majority_threshold = (total_members // 2) + 1
        
        if decided_count >= majority_threshold:
            # Determine group decision (strictest wins)
            if rejected_count > 0:
                group.group_decision = 'rejected'
                group.review_cycle.status = 'rejected'
                group.review_cycle.completed_at = timezone.now()
                group.review_cycle.save()
            elif changes_count > 0:
                group.group_decision = 'approved_with_changes'
            else:
                group.group_decision = 'approved'
            
            group.status = 'completed'
            group.completed_at = timezone.now()
            group.socd_status = 'decision_made'
            group.save()
            
            # If rejected, mark review as rejected but don't stop other groups
            if rejected_count > 0:
                # Don't return - allow other groups to continue reviewing
                pass
            
            # No need to unlock next group - all groups are already unlocked
            # Check if all groups completed to finalize review
            all_groups = group.review_cycle.groups.all()
            if all(g.status == 'completed' for g in all_groups):
                WorkflowService.finalize_review(group.review_cycle)
    
    @staticmethod
    def finalize_review(review_cycle):
        """
        Determine final review status based on all groups.
        Uses strictest decision aggregation.
        """
        groups = review_cycle.groups.all()
        
        # Strictest decision wins
        if groups.filter(group_decision='rejected').exists():
            review_cycle.status = 'rejected'
        elif groups.filter(group_decision='approved_with_changes').exists():
            review_cycle.status = 'approved_with_changes'
        else:
            review_cycle.status = 'approved'
        
        review_cycle.completed_at = timezone.now()
        review_cycle.save()
    
    @staticmethod
    def update_member_socd(member, action):
        """
        Update individual member SOCD status.
        
        Args:
            member: GroupMember instance
            action: 'view', 'comment', or 'decide'
        """
        if action == 'view' and member.socd_status == 'sent':
            member.socd_status = 'open'
            member.opened_at = timezone.now()
            member.save()
            
            # Update group SOCD if first view
            WorkflowService.update_group_socd(member.group, 'open')
        
        elif action == 'comment' and member.socd_status in ['sent', 'open']:
            member.socd_status = 'commented'
            member.commented_at = timezone.now()
            member.save()
            
            WorkflowService.update_group_socd(member.group, 'commented')
        
        elif action == 'decide':
            member.socd_status = 'decision_made'
            member.decision_made_at = timezone.now()
            member.save()
            
            # Check if group should unlock next
            WorkflowService.check_and_unlock_next_group(member.group)
    
    @staticmethod
    def update_group_socd(group, status):
        """
        Update group-level SOCD based on first occurrence.
        
        Args:
            group: ApprovalGroup instance
            status: 'sent', 'open', 'commented', or 'decision_made'
        """
        socd_order = ['sent', 'open', 'commented', 'decision_made']
        current_index = socd_order.index(group.socd_status)
        new_index = socd_order.index(status)
        
        if new_index > current_index:
            group.socd_status = status
            
            # Update group status to in_progress if opened (all groups start as unlocked)
            if status == 'open' and group.status in ['unlocked', 'locked']:
                group.status = 'in_progress'
            
            group.save()
    
    @staticmethod
    def record_member_decision(member, decision, feedback=''):
        """
        Record a member's decision (approve, reject, request changes).
        
        Args:
            member: GroupMember instance
            decision: 'approved', 'rejected', or 'changes_requested'
            feedback: Optional feedback text
        """
        member.decision = decision
        member.feedback = feedback
        
        # Map decision to reviewer_progress
        decision_to_progress = {
            'approved': 'approved',
            'changes_requested': 'approved_with_changes',
            'rejected': 'rejected'
        }
        member.reviewer_progress = decision_to_progress.get(decision, 'not_started')
        member.save()
        
        # Update SOCD to decision_made
        WorkflowService.update_member_socd(member, 'decide')
        
        # Calculate and update stage status
        WorkflowService.calculate_stage_status(member.group)
        
        # Calculate and update proof status
        WorkflowService.calculate_proof_status(member.group.review_cycle)
        
        # Broadcast updates
        WorkflowService.broadcast_review_cycle_update(member.group.review_cycle)
    
    @staticmethod
    def update_reviewer_progress(member, progress_status):
        """
        Update individual member's reviewer progress.
        
        Args:
            member: GroupMember instance
            progress_status: 'not_started', 'reviewing', 'approved', 'approved_with_changes', 'rejected'
        """
        import logging
        logger = logging.getLogger(__name__)
        
        old_progress = member.reviewer_progress
        member.reviewer_progress = progress_status
        member.save()
        logger.info(f"📊 Updated reviewer progress: {member.user.username} ({member.group.name}) - {old_progress} → {progress_status}")
        
        # Calculate and update stage status
        WorkflowService.calculate_stage_status(member.group)
        logger.info(f"📊 Calculated stage status for {member.group.name}: {member.group.stage_status}")
        
        # Calculate and update proof status
        WorkflowService.calculate_proof_status(member.group.review_cycle)
        logger.info(f"📊 Calculated proof status: {member.group.review_cycle.proof_status}")
        
        # Broadcast updates
        WorkflowService.broadcast_review_cycle_update(member.group.review_cycle)
        logger.info(f"📡 Broadcasted review cycle update for review cycle {member.group.review_cycle.id}")
    
    @staticmethod
    def calculate_stage_status(group):
        """
        Calculate workflow stage status based on all members' reviewer progress.
        
        Args:
            group: ApprovalGroup instance
        """
        members = group.members.all()
        total_members = members.count()
        
        if total_members == 0:
            group.stage_status = 'not_started'
            group.save()
            return
        
        # Count reviewer progress statuses
        not_started_count = members.filter(reviewer_progress='not_started').count()
        reviewing_count = members.filter(reviewer_progress='reviewing').count()
        approved_count = members.filter(reviewer_progress='approved').count()
        approved_with_changes_count = members.filter(reviewer_progress='approved_with_changes').count()
        rejected_count = members.filter(reviewer_progress='rejected').count()
        
        # Logic for stage status
        if not_started_count == total_members:
            group.stage_status = 'not_started'
        elif reviewing_count > 0:
            group.stage_status = 'in_progress'
        elif approved_count == total_members:
            group.stage_status = 'approved'
        elif rejected_count == total_members:
            group.stage_status = 'rejected'
        elif approved_with_changes_count == total_members:
            group.stage_status = 'approved_with_changes'
        else:
            # Mixed decisions
            group.stage_status = 'action_required'
        
        group.save()
    
    @staticmethod
    def calculate_proof_status(review_cycle):
        """
        Calculate overall proof status based on last workflow stage.
        
        Args:
            review_cycle: ReviewCycle instance
        """
        groups = review_cycle.groups.all().order_by('order')
        
        if not groups.exists():
            review_cycle.proof_status = 'not_started'
            review_cycle.save()
            return
        
        # Check if any stage is in progress
        if groups.filter(stage_status='in_progress').exists():
            review_cycle.proof_status = 'in_progress'
            review_cycle.save()
            return
        
        # Get the last workflow stage
        last_group = groups.last()
        
        # Map last stage status to proof status
        if last_group.stage_status == 'approved':
            review_cycle.proof_status = 'approved'
        elif last_group.stage_status == 'rejected':
            review_cycle.proof_status = 'rejected'
        elif last_group.stage_status == 'approved_with_changes':
            review_cycle.proof_status = 'approved_with_changes'
        elif last_group.stage_status == 'action_required':
            review_cycle.proof_status = 'in_progress'
        else:
            review_cycle.proof_status = 'not_started'
        
        review_cycle.save()
    
    @staticmethod
    def track_file_viewer_open(review_cycle_id, user):
        """
        Track when member opens file viewer and set progress to 'reviewing'.
        
        Args:
            review_cycle_id: ReviewCycle ID
            user: User instance
        """
        try:
            review_cycle = ReviewCycle.objects.get(id=review_cycle_id)
            member = WorkflowService.get_member_for_user(review_cycle, user)
            
            if member and member.reviewer_progress == 'not_started':
                WorkflowService.update_reviewer_progress(member, 'reviewing')
                logger.info(f"Member {user.username} started reviewing - progress set to 'reviewing'")
        except ReviewCycle.DoesNotExist:
            logger.error(f"ReviewCycle {review_cycle_id} not found")
        except Exception as e:
            logger.error(f"Failed to track file viewer open: {e}")
    
    @staticmethod
    def create_groups_for_review(review_cycle, template):
        """
        Create approval groups for a review cycle based on workflow template.
        
        Args:
            review_cycle: ReviewCycle instance
            template: WorkflowTemplate instance
        """
        stages = template.stages.all().order_by('order')
        
        for idx, stage in enumerate(stages):
            group = ApprovalGroup.objects.create(
                review_cycle=review_cycle,
                stage=stage,
                name=stage.name,
                order=idx + 1,
                status='unlocked',  # All groups unlocked - no sequential restriction
                unlocked_at=timezone.now()
            )
            
            # Add approvers as group members
            for approver in stage.approvers.all():
                GroupMember.objects.create(
                    group=group,
                    user=approver.user
                )
        
        # Set first group as current
        first_group = review_cycle.groups.first()
        if first_group:
            review_cycle.current_stage = first_group.stage
            review_cycle.status = 'in_progress'
            review_cycle.save()
    
    @staticmethod
    def get_member_for_user(review_cycle, user):
        """
        Get the GroupMember instance for a user in the current active group.
        
        Args:
            review_cycle: ReviewCycle instance
            user: User instance
            
        Returns:
            GroupMember instance or None
        """
        # Find the user's group in this review cycle
        return GroupMember.objects.filter(
            group__review_cycle=review_cycle,
            user=user
        ).select_related('group').first()
    
    @staticmethod
    def can_user_access_group(user, group):
        """
        Check if user can access a specific group.
        
        Args:
            user: User instance
            group: ApprovalGroup instance
            
        Returns:
            bool
        """
        # Admin and Manager can access everything
        if hasattr(user, 'profile') and user.profile.role in ['admin', 'manager']:
            return True
        
        # Approvers and Lite Users can access if they're members
        return GroupMember.objects.filter(group=group, user=user).exists()
    
    @staticmethod
    def can_user_participate(user, group):
        """
        Check if user can participate (comment, approve) in a group.
        Lite users can only view, not participate.
        
        Args:
            user: User instance
            group: ApprovalGroup instance
            
        Returns:
            bool
        """
        # Lite users cannot participate
        if hasattr(user, 'profile') and user.profile.role == 'lite_user':
            return False
        
        # Admin and Manager can participate in any group
        if hasattr(user, 'profile') and user.profile.role in ['admin', 'manager']:
            return True
        
        # Approvers can participate if they're members
        if hasattr(user, 'profile') and user.profile.role == 'approver':
            return GroupMember.objects.filter(group=group, user=user).exists()
        
        return False
    
    @staticmethod
    def skip_group(group, skipped_by):
        """
        Manager can skip a group's approval process.
        Only managers can skip groups.
        
        Args:
            group: ApprovalGroup instance
            skipped_by: User instance (must be manager)
            
        Returns:
            bool: True if skipped successfully
        """
        # Verify user is manager or admin
        if not hasattr(skipped_by, 'profile') or skipped_by.profile.role not in ['admin', 'manager']:
            return False
        
        # Mark group as completed with approved status
        group.status = 'completed'
        group.group_decision = 'approved'
        group.socd_status = 'decision_made'
        group.completed_at = timezone.now()
        group.save()
        
        # Mark all members as approved (for record keeping)
        for member in group.members.all():
            if member.decision == 'pending':
                member.decision = 'approved'
                member.socd_status = 'decision_made'
                member.decision_made_at = timezone.now()
                member.feedback = f'Skipped by {skipped_by.username}'
                member.save()
        
        # Unlock next group
        next_group = ApprovalGroup.objects.filter(
            review_cycle=group.review_cycle,
            order=group.order + 1
        ).first()
        
        if next_group:
            next_group.status = 'unlocked'
            next_group.unlocked_at = timezone.now()
            next_group.save()
            
            group.review_cycle.current_stage = next_group.stage
            group.review_cycle.save()
        else:
            # All groups completed - finalize review
            WorkflowService.finalize_review(group.review_cycle)
        
        return True
    
    @staticmethod
    def get_group_progress(group):
        """
        Calculate group progress statistics.
        
        Args:
            group: ApprovalGroup instance
            
        Returns:
            dict with progress information
        """
        members = group.members.all()
        total = members.count()
        
        if total == 0:
            return {
                'total_members': 0,
                'sent': 0,
                'opened': 0,
                'commented': 0,
                'decided': 0,
                'approved': 0,
                'rejected': 0,
                'changes_requested': 0,
                'progress_percentage': 0
            }
        
        return {
            'total_members': total,
            'sent': members.filter(socd_status='sent').count(),
            'opened': members.filter(socd_status='open').count(),
            'commented': members.filter(socd_status='commented').count(),
            'decided': members.filter(socd_status='decision_made').count(),
            'approved': members.filter(decision='approved').count(),
            'rejected': members.filter(decision='rejected').count(),
            'changes_requested': members.filter(decision='changes_requested').count(),
            'progress_percentage': int((members.filter(socd_status='decision_made').count() / total) * 100)
        }
    
    @staticmethod
    def broadcast_review_cycle_update(review_cycle):
        """
        Broadcast review cycle status update via WebSocket to all relevant users.
        Includes group members, creator, and managers/admins who can view the proof.
        
        Args:
            review_cycle: ReviewCycle instance
        """
        try:
            channel_layer = get_channel_layer()
            
            if not channel_layer:
                logger.warning("Channel layer not configured for WebSocket broadcasting")
                return
            
            # Collect all relevant users
            users_to_notify = set()
            
            # Add all group members
            for member in GroupMember.objects.filter(
                group__review_cycle=review_cycle
            ).select_related('user'):
                users_to_notify.add(member.user)
            
            # Add the creator/initiator
            if review_cycle.created_by:
                users_to_notify.add(review_cycle.created_by)
            if review_cycle.initiated_by:
                users_to_notify.add(review_cycle.initiated_by)
            
            # Add managers and admins who might be viewing
            from django.contrib.auth.models import User
            from apps.accounts.models import UserProfile
            managers_and_admins = User.objects.filter(
                profile__role__in=['manager', 'admin']
            )
            users_to_notify.update(managers_and_admins)
            
            # Prepare update data with all status fields
            from .serializers import ReviewCycleDetailSerializer
            serializer = ReviewCycleDetailSerializer(review_cycle)
            
            update_data = {
                'type': 'review_cycle_update',
                'review_cycle_id': review_cycle.id,
                'status': review_cycle.status,
                'proof_status': review_cycle.proof_status,
                'current_stage_id': review_cycle.current_stage.id if review_cycle.current_stage else None,
                'updated_at': review_cycle.updated_at.isoformat() if hasattr(review_cycle, 'updated_at') else timezone.now().isoformat(),
                'asset_name': review_cycle.asset.name if review_cycle.asset else 'Untitled Proof',
                'asset_id': review_cycle.asset.id if review_cycle.asset else None,
                'review_cycle_data': serializer.data,  # Include full serialized data with all groups and members
            }
            
            # Send update to each user's notification channel
            success_count = 0
            for user in users_to_notify:
                try:
                    async_to_sync(channel_layer.group_send)(
                        f'notifications_{user.id}',
                        update_data
                    )
                    success_count += 1
                except Exception as e:
                    logger.error(f"Failed to send update to user {user.id}: {e}")
            
            logger.info(f"Broadcasted review cycle {review_cycle.id} update to {success_count}/{len(users_to_notify)} users")
            
        except Exception as e:
            logger.error(f"Failed to broadcast review cycle update: {e}")

    @staticmethod
    def create_review_cycle_for_asset(asset, user):
        """
        Automatically create a review cycle for an asset with default settings
        
        Args:
            asset: CreativeAsset instance
            user: User instance creating the review cycle
            
        Returns:
            ReviewCycle: The created review cycle
        """
        try:
            # Get the default active workflow template
            from apps.workflows.models import WorkflowTemplate
            template = WorkflowTemplate.objects.filter(is_active=True).first()
            if not template:
                raise ValueError("No active workflow template found")
            
            # Create review cycle
            review_cycle = ReviewCycle.objects.create(
                asset=asset,
                template=template,
                status='not_started',
                initiated_by=user,
                created_by=user
            )
            
            logger.info(f"Created review cycle {review_cycle.id} for asset {asset.id}")
            
            # Get the first stage of the template
            from apps.workflows.models import WorkflowStage
            stage = WorkflowStage.objects.filter(template=template).order_by('order').first()
            if stage:
                # Create approval group
                group = ApprovalGroup.objects.create(
                    review_cycle=review_cycle,
                    stage=stage,
                    name='Review Group',
                    order=1,
                    status='unlocked'
                )
                
                logger.info(f"Created approval group {group.id} for review cycle {review_cycle.id}")
                
                # Add the creating user as a member if they're not already a stage approver
                from apps.workflows.models import WorkflowStageApprover
                if WorkflowStageApprover.objects.filter(stage=stage, user=user).exists():
                    # User is already a stage approver, add them as group member
                    member = GroupMember.objects.create(
                        group=group,
                        user=user,
                        socd_status='sent'
                    )
                    logger.info(f"Added user {user.username} as group member with SOCD status: sent")
                else:
                    # Add user as stage approver and group member
                    WorkflowStageApprover.objects.create(
                        stage=stage,
                        user=user
                    )
                    member = GroupMember.objects.create(
                        group=group,
                        user=user,
                        socd_status='sent'
                    )
                    logger.info(f"Added user {user.username} as stage approver and group member")
            
            return review_cycle
            
        except Exception as e:
            logger.error(f"Failed to create review cycle for asset {asset.id}: {e}")
            raise
