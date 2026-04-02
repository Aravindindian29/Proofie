from django.utils import timezone
from django.db.models import Q
from .models import ApprovalGroup, GroupMember, ReviewCycle


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
            
            # If rejected, stop workflow
            if rejected_count > 0:
                return
            
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
            
            # Update group status to in_progress if opened
            if status == 'open' and group.status == 'unlocked':
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
        member.save()
        
        # Update SOCD to decision_made
        WorkflowService.update_member_socd(member, 'decide')
    
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
                status='locked' if idx > 0 else 'unlocked',
                unlocked_at=timezone.now() if idx == 0 else None
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
