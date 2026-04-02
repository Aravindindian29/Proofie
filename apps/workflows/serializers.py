from rest_framework import serializers
from .models import (
    WorkflowTemplate, WorkflowStage, WorkflowStageApprover, 
    ReviewCycle, StageApproval, WorkflowTransition,
    ApprovalGroup, GroupMember
)
from apps.versioning.serializers import UserBasicSerializer


class WorkflowStageApproverSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WorkflowStageApprover
        fields = ['id', 'user', 'user_id', 'is_required']


class WorkflowStageSerializer(serializers.ModelSerializer):
    approvers = WorkflowStageApproverSerializer(many=True, read_only=True)

    class Meta:
        model = WorkflowStage
        fields = ['id', 'name', 'description', 'order', 'requires_approval', 'can_reject', 'can_request_changes', 'approvers']


class WorkflowTemplateSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)
    stages = WorkflowStageSerializer(many=True, read_only=True)

    class Meta:
        model = WorkflowTemplate
        fields = ['id', 'name', 'description', 'created_by', 'created_at', 'updated_at', 'is_active', 'stages']


class StageApprovalSerializer(serializers.ModelSerializer):
    approver = UserBasicSerializer(read_only=True)
    stage = WorkflowStageSerializer(read_only=True)

    class Meta:
        model = StageApproval
        fields = ['id', 'stage', 'approver', 'status', 'approved_at', 'feedback', 'created_at', 'updated_at']


class WorkflowTransitionSerializer(serializers.ModelSerializer):
    from_stage = WorkflowStageSerializer(read_only=True)
    to_stage = WorkflowStageSerializer(read_only=True)
    transitioned_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = WorkflowTransition
        fields = ['id', 'from_stage', 'to_stage', 'transitioned_by', 'transitioned_at', 'reason']


class ReviewCycleSerializer(serializers.ModelSerializer):
    template = WorkflowTemplateSerializer(read_only=True)
    current_stage = WorkflowStageSerializer(read_only=True)
    initiated_by = UserBasicSerializer(read_only=True)
    stage_approvals = StageApprovalSerializer(many=True, read_only=True)
    transitions = WorkflowTransitionSerializer(many=True, read_only=True)

    class Meta:
        model = ReviewCycle
        fields = [
            'id', 'asset', 'template', 'status', 'current_stage', 'initiated_by',
            'initiated_at', 'completed_at', 'notes', 'stage_approvals', 'transitions'
        ]


class ReviewCycleCreateSerializer(serializers.ModelSerializer):
    template_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ReviewCycle
        fields = ['asset', 'template_id', 'notes']

    def create(self, validated_data):
        template_id = validated_data.pop('template_id')
        template = WorkflowTemplate.objects.get(id=template_id)
        return ReviewCycle.objects.create(template=template, **validated_data)


class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = GroupMember
        fields = [
            'id', 'user', 'socd_status', 'decision', 'feedback',
            'sent_at', 'opened_at', 'commented_at', 'decision_made_at'
        ]


class ApprovalGroupSerializer(serializers.ModelSerializer):
    stage = WorkflowStageSerializer(read_only=True)
    members = GroupMemberSerializer(many=True, read_only=True)
    
    class Meta:
        model = ApprovalGroup
        fields = [
            'id', 'name', 'order', 'status', 'group_decision', 'socd_status',
            'stage', 'members', 'unlocked_at', 'completed_at'
        ]


class ReviewCycleDetailSerializer(serializers.ModelSerializer):
    template = WorkflowTemplateSerializer(read_only=True)
    current_stage = WorkflowStageSerializer(read_only=True)
    initiated_by = UserBasicSerializer(read_only=True)
    groups = ApprovalGroupSerializer(many=True, read_only=True)
    transitions = WorkflowTransitionSerializer(many=True, read_only=True)

    class Meta:
        model = ReviewCycle
        fields = [
            'id', 'asset', 'template', 'status', 'current_stage', 'initiated_by',
            'initiated_at', 'completed_at', 'notes', 'groups', 'transitions'
        ]
