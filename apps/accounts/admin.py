from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, EmailVerification


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = True
    verbose_name_plural = 'Profile'


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
    
    # Ensure delete permissions are enabled
    actions = ['delete_selected']
    
    def delete_selected(self, request, queryset):
        # Custom delete action with confirmation
        from django.contrib.admin.actions import delete_selected
        return delete_selected(self, request, queryset)
    delete_selected.short_description = "Delete selected users"
    
    # Override change_form_template to use custom template
    change_form_template = 'admin/auth/user/change_form.html'


# Re-register User with our custom admin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Register other models
admin.site.register(UserProfile)
admin.site.register(EmailVerification)
