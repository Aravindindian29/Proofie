from django.db import models
from django.contrib.auth.models import User
from apps.versioning.models import CreativeAsset


class RolePermission(models.Model):
    """Define default permissions for each user role"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('approver', 'Approver'),
        ('lite_user', 'Lite User'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True, verbose_name='Role')
    
    # Folder Permissions
    can_create_folder = models.BooleanField(default=False, verbose_name='Create Folder')
    can_add_member = models.BooleanField(default=False, verbose_name='Add Member')
    can_edit_folder = models.BooleanField(default=False, verbose_name='Edit Folder')
    can_add_proof = models.BooleanField(default=False, verbose_name='Add Proof')
    can_delete_folder = models.BooleanField(default=False, verbose_name='Delete Folder')
    
    # Inside Folder Permissions
    can_delete_proof_in_folder = models.BooleanField(default=False, verbose_name='Delete Proof')
    
    # Proof Preview Permissions
    can_use_proofieplus = models.BooleanField(default=False, verbose_name='ProofiePlus')
    can_add_comment = models.BooleanField(default=False, verbose_name='Add Comment')
    can_delete_proof_in_preview = models.BooleanField(default=False, verbose_name='Delete Proof')
    can_make_decisions = models.BooleanField(default=False, verbose_name='Make Decisions')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Role Permission'
        verbose_name_plural = 'Role Permissions'
        ordering = ['role']
    
    def __str__(self):
        return f"{self.get_role_display()} Permissions"


class WorkflowTemplate(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class WorkflowStage(models.Model):
    template = models.ForeignKey(WorkflowTemplate, on_delete=models.CASCADE, related_name='stages')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField()
    requires_approval = models.BooleanField(default=True)
    can_reject = models.BooleanField(default=True)
    can_request_changes = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']
        unique_together = ('template', 'order')

    def __str__(self):
        return f"{self.template.name} - {self.name}"


class WorkflowStageApprover(models.Model):
    stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE, related_name='approvers')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_required = models.BooleanField(default=True)

    class Meta:
        unique_together = ('stage', 'user')

    def __str__(self):
        return f"{self.user.username} - {self.stage.name}"


class ReviewCycle(models.Model):
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('approved', 'Approved'),
        ('approved_with_changes', 'Approved with Changes'),
        ('rejected', 'Rejected'),
    ]

    asset = models.ForeignKey(CreativeAsset, on_delete=models.CASCADE, related_name='review_cycles')
    template = models.ForeignKey(WorkflowTemplate, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='not_started')
    current_stage = models.ForeignKey(WorkflowStage, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_reviews')
    initiated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='initiated_reviews')
    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-initiated_at']

    def __str__(self):
        return f"Review - {self.asset.name}"


class ApprovalGroup(models.Model):
    STATUS_CHOICES = [
        ('locked', 'Locked'),
        ('unlocked', 'Unlocked'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    DECISION_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('approved_with_changes', 'Approved with Changes'),
        ('rejected', 'Rejected'),
    ]
    
    SOCD_CHOICES = [
        ('sent', 'Sent'),
        ('open', 'Open'),
        ('commented', 'Comment Made'),
        ('decision_made', 'Decision Made'),
    ]
    
    review_cycle = models.ForeignKey(ReviewCycle, on_delete=models.CASCADE, related_name='groups')
    stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='locked')
    group_decision = models.CharField(max_length=30, choices=DECISION_CHOICES, default='pending')
    socd_status = models.CharField(max_length=20, choices=SOCD_CHOICES, default='sent')
    
    unlocked_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['order']
        unique_together = ('review_cycle', 'order')
    
    def __str__(self):
        return f"{self.name} - {self.review_cycle.asset.name}"


class GroupMember(models.Model):
    SOCD_STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('open', 'Open'),
        ('commented', 'Comment Made'),
        ('decision_made', 'Decision Made'),
    ]
    
    DECISION_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('changes_requested', 'Changes Requested'),
        ('rejected', 'Rejected'),
    ]
    
    group = models.ForeignKey(ApprovalGroup, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    socd_status = models.CharField(max_length=20, choices=SOCD_STATUS_CHOICES, default='sent')
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES, default='pending')
    feedback = models.TextField(blank=True)
    
    sent_at = models.DateTimeField(auto_now_add=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    commented_at = models.DateTimeField(null=True, blank=True)
    decision_made_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('group', 'user')
    
    def __str__(self):
        return f"{self.user.username} - {self.group.name}"


class StageApproval(models.Model):
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('changes_requested', 'Changes Requested'),
    ]

    review_cycle = models.ForeignKey(ReviewCycle, on_delete=models.CASCADE, related_name='stage_approvals')
    stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE)
    approver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='pending')
    
    approved_at = models.DateTimeField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['review_cycle', 'stage', 'approver'],
                condition=models.Q(approver__isnull=False),
                name='unique_stage_approval_with_approver'
            )
        ]

    def __str__(self):
        approver_name = self.approver.username if self.approver else "Unassigned"
        return f"{approver_name} - {self.stage.name}"


class WorkflowTransition(models.Model):
    review_cycle = models.ForeignKey(ReviewCycle, on_delete=models.CASCADE, related_name='transitions')
    from_stage = models.ForeignKey(WorkflowStage, on_delete=models.SET_NULL, null=True, blank=True, related_name='transitions_from')
    to_stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE, related_name='transitions_to')
    
    transitioned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    transitioned_at = models.DateTimeField(auto_now_add=True)
    
    reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-transitioned_at']

    def __str__(self):
        return f"Transition to {self.to_stage.name}"
