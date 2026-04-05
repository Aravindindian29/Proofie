from django.contrib import admin
from .models import (
    WorkflowTemplate, WorkflowStage, WorkflowStageApprover, 
    ReviewCycle, StageApproval, WorkflowTransition,
    ApprovalGroup, GroupMember, RolePermission
)


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ['role', 'can_create_folder', 'can_add_member', 'can_edit_folder', 'can_delete_folder', 'can_use_proofieplus']
    list_filter = ['role']
    search_fields = ['role']
    
    fieldsets = (
        ('Role Information', {
            'fields': ('role',)
        }),
        ('Permissions', {
            'fields': (
                ('can_create_folder', 'can_add_member', 'can_edit_folder', 'can_add_proof', 'can_delete_folder'),
                ('can_delete_proof_in_folder',),
                ('can_use_proofieplus', 'can_add_comment', 'can_delete_proof_in_preview'),
            ),
            'description': 'Configure role-specific permissions',
            'classes': ('permissions-horizontal',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    class Media:
        css = {
            'all': ('admin/css/permissions_layout.css',)
        }


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
