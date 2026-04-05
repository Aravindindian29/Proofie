from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import path
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils.html import format_html
from .models import UserProfile, EmailVerification
from .services import UserDeletionService
import logging

logger = logging.getLogger(__name__)


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = True
    verbose_name_plural = 'Profile'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('role', 'avatar', 'bio', 'phone', 'company', 'job_title')
        }),
        ('Permissions', {
            'fields': (
                ('can_create_folder', 'can_add_member', 'can_edit_folder', 'can_add_proof', 'can_delete_folder'),
                ('can_add_proof_in_folder', 'can_delete_proof_in_folder'),
                ('can_use_proofieplus', 'can_add_comment', 'can_delete_proof_in_preview'),
            ),
            'description': 'User-specific permissions (overrides role defaults)',
            'classes': ('permissions-horizontal',)
        }),
    )
    
    class Media:
        css = {
            'all': ('admin/css/permissions_layout.css',)
        }


class EmailVerificationInline(admin.TabularInline):
    model = EmailVerification
    can_delete = True
    extra = 0
    verbose_name_plural = 'Email Verifications'


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline, EmailVerificationInline)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)
    
    # Custom delete action
    actions = ['delete_users_with_reassignment']
    
    def delete_users_with_reassignment(self, request, queryset):
        """Custom delete action that handles ownership reassignment"""
        # Store selected user IDs in session
        request.session['users_to_delete'] = list(queryset.values_list('id', flat=True))
        
        # Redirect to custom delete confirmation page
        return redirect('admin:accounts_user_delete_confirmation')
    
    delete_users_with_reassignment.short_description = "Delete selected users (with reassignment)"
    
    def get_urls(self):
        """Add custom URL for delete confirmation page"""
        urls = super().get_urls()
        custom_urls = [
            path('delete-confirmation/', 
                 self.admin_site.admin_view(self.delete_confirmation_view),
                 name='accounts_user_delete_confirmation'),
        ]
        return custom_urls + urls
    
    def delete_confirmation_view(self, request):
        """Custom view for delete confirmation with reassignment"""
        user_ids = request.session.get('users_to_delete', [])
        
        if not user_ids:
            messages.error(request, "No users selected for deletion.")
            return redirect('admin:auth_user_changelist')
        
        users_to_delete = User.objects.filter(id__in=user_ids)
        
        if request.method == 'POST':
            reassignment_user_id = request.POST.get('reassignment_user')
            
            if not reassignment_user_id:
                messages.error(request, "Please select a user to reassign ownership to.")
                return render(request, 'admin/accounts/user/delete_confirmation.html', {
                    'users': users_to_delete,
                    'available_users': User.objects.exclude(id__in=user_ids),
                    'owned_content': {user: UserDeletionService.get_owned_content_summary(user) for user in users_to_delete}
                })
            
            try:
                reassignment_user = User.objects.get(id=reassignment_user_id)
                
                # Delete users with reassignment
                with transaction.atomic():
                    deleted_count = 0
                    for user in users_to_delete:
                        try:
                            # Delete user - signal will handle reassignment
                            user.delete(reassignment_user_id=reassignment_user.id)
                            deleted_count += 1
                        except ValidationError as e:
                            messages.error(request, f"Error deleting {user.username}: {str(e)}")
                            continue
                
                # Clear session
                del request.session['users_to_delete']
                
                messages.success(
                    request, 
                    f"Successfully deleted {deleted_count} user(s). "
                    f"Ownership reassigned to {reassignment_user.username}."
                )
                return redirect('admin:auth_user_changelist')
                
            except User.DoesNotExist:
                messages.error(request, "Selected reassignment user does not exist.")
            except Exception as e:
                logger.error(f"Error during user deletion: {str(e)}")
                messages.error(request, f"Error during deletion: {str(e)}")
        
        # GET request - show confirmation form
        owned_content_summary = {}
        for user in users_to_delete:
            owned_content_summary[user] = UserDeletionService.get_owned_content_summary(user)
        
        context = {
            'users': users_to_delete,
            'available_users': User.objects.exclude(id__in=user_ids).filter(is_active=True),
            'owned_content': owned_content_summary,
            'title': 'Delete Users with Ownership Reassignment',
            'site_header': self.admin_site.site_header,
            'site_title': self.admin_site.site_title,
        }
        
        return render(request, 'admin/accounts/user/delete_confirmation.html', context)
    
    # Override change_form_template to use custom template
    change_form_template = 'admin/auth/user/change_form.html'


# Re-register User with our custom admin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Register other models
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Custom admin for UserProfile with cascade deletion and safety checks"""
    
    list_display = ('username', 'email', 'role', 'owned_content_count', 'can_delete_status', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('user', 'owned_content_summary', 'created_at', 'updated_at')
    
    # Custom delete action
    actions = ['delete_user_profiles_safely']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'role')
        }),
        ('Profile Details', {
            'fields': ('avatar', 'bio', 'phone', 'company', 'job_title')
        }),
        ('Permissions', {
            'fields': (
                ('can_create_folder', 'can_add_member', 'can_edit_folder', 'can_add_proof', 'can_delete_folder'),
                ('can_add_proof_in_folder', 'can_delete_proof_in_folder'),
                ('can_use_proofieplus', 'can_add_comment', 'can_delete_proof_in_preview'),
            ),
            'description': 'User-specific permissions (overrides role defaults)',
            'classes': ('permissions-horizontal',)
        }),
        ('Ownership Information', {
            'fields': ('owned_content_summary',),
            'description': 'Summary of content owned by this user'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    class Media:
        css = {
            'all': ('admin/css/permissions_layout.css',)
        }
    
    def username(self, obj):
        return obj.user.username if obj.user else 'No User'
    username.short_description = 'Username'
    username.admin_order_field = 'user__username'
    
    def email(self, obj):
        return obj.user.email if obj.user else 'No User'
    email.short_description = 'Email'
    email.admin_order_field = 'user__email'
    
    def owned_content_count(self, obj):
        """Display count of owned content"""
        if not obj.user:
            return 0
        summary = obj.can_delete_safely()
        total = summary['owned_content']['total_count']
        if total > 0:
            return format_html(
                '<span style="color: #d32f2f; font-weight: bold;">{}</span>',
                total
            )
        return format_html(
            '<span style="color: #388e3c;">{}</span>',
            total
        )
    owned_content_count.short_description = 'Owned Content'
    
    def can_delete_status(self, obj):
        """Show whether profile can be deleted safely"""
        summary = obj.can_delete_safely()
        if summary['can_delete']:
            return format_html(
                '<span style="color: #388e3c;">✓ Safe to Delete</span>'
            )
        else:
            return format_html(
                '<span style="color: #d32f2f;">⚠ Has Owned Content</span>'
            )
    can_delete_status.short_description = 'Delete Status'
    
    def owned_content_summary(self, obj):
        """Display detailed ownership summary"""
        if not obj.user:
            return "No associated user"
        
        summary = obj.can_delete_safely()
        content = summary['owned_content']
        
        if content['total_count'] == 0:
            return format_html(
                '<div style="color: #388e3c;">'
                '<strong>✓ No owned content</strong><br>'
                'This profile can be safely deleted.'
                '</div>'
            )
        
        return format_html(
            '<div style="color: #d32f2f;">'
            '<strong>⚠ Owned Content Summary:</strong><br>'
            '• Folders: {}<br>'
            '• Projects: {}<br>'
            '• Assets: {}<br>'
            '<br>'
            '<em>Delete from Authentication & Authorization → Users section '
            'to handle ownership reassignment.</em>'
            '</div>',
            content['folders'], content['projects'], content['assets']
        )
    owned_content_summary.short_description = 'Ownership Summary'
    
    def delete_model(self, request, obj):
        """Override delete_model to handle cascade deletion"""
        try:
            # The overridden delete() method will handle the cascade
            obj.delete()
            self.message_user(
                request,
                f'User profile for "{obj.user.username if obj.user else "Unknown"}" has been deleted '
                f'along with the user account and email verification records.',
                messages.SUCCESS
            )
        except ValidationError as e:
            self.message_user(request, str(e), messages.ERROR)
    
    def delete_user_profiles_safely(self, request, queryset):
        """Custom delete action with safety checks"""
        safe_profiles = []
        unsafe_profiles = []
        
        for profile in queryset:
            if profile.can_delete_safely()['can_delete']:
                safe_profiles.append(profile)
            else:
                unsafe_profiles.append(profile)
        
        if unsafe_profiles:
            # Show warning for unsafe profiles
            unsafe_usernames = [p.user.username for p in unsafe_profiles if p.user]
            self.message_user(
                request,
                f'The following users own content and cannot be deleted via profile deletion: '
                f'{", ".join(unsafe_usernames)}. Please delete them from Authentication & '
                f'Authorization → Users section to handle ownership reassignment.',
                messages.WARNING
            )
        
        if safe_profiles:
            # Delete safe profiles
            deleted_count = 0
            for profile in safe_profiles:
                try:
                    profile.delete()
                    deleted_count += 1
                except Exception as e:
                    self.message_user(
                        request,
                        f'Error deleting profile for {profile.user.username}: {str(e)}',
                        messages.ERROR
                    )
            
            if deleted_count > 0:
                self.message_user(
                    request,
                    f'Successfully deleted {deleted_count} user profile(s) along with '
                    f'their user accounts and email verification records.',
                    messages.SUCCESS
                )
    
    delete_user_profiles_safely.short_description = "Delete selected user profiles (cascade to user)"
    
    def get_actions(self, request):
        """Remove default delete action to force users to use our custom action"""
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions

admin.site.register(EmailVerification)
