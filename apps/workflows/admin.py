from django.contrib import admin
from .models import (
    WorkflowTemplate, WorkflowStage, WorkflowStageApprover, 
    ReviewCycle, StageApproval, WorkflowTransition,
    ApprovalGroup, GroupMember
)


class GroupMemberInline(admin.TabularInline):
    model = GroupMember
    extra = 0
    readonly_fields = ['sent_at', 'opened_at', 'commented_at', 'decision_made_at']


@admin.register(ApprovalGroup)
class ApprovalGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'review_cycle', 'order', 'status', 'group_decision', 'socd_status']
    list_filter = ['status', 'group_decision', 'socd_status']
    search_fields = ['name', 'review_cycle__asset__name']
    inlines = [GroupMemberInline]
    readonly_fields = ['unlocked_at', 'completed_at']


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'group', 'socd_status', 'decision']
    list_filter = ['socd_status', 'decision']
    search_fields = ['user__username', 'group__name']
    readonly_fields = ['sent_at', 'opened_at', 'commented_at', 'decision_made_at']


admin.site.register(WorkflowTemplate)
admin.site.register(WorkflowStage)
admin.site.register(WorkflowStageApprover)
admin.site.register(ReviewCycle)
admin.site.register(StageApproval)
admin.site.register(WorkflowTransition)
