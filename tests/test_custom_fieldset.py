from django.contrib import admin
from django.contrib.admin.helpers import Fieldset
from django.template.loader import render_to_string


class PermissionFieldset(Fieldset):
    """Custom fieldset that includes category names"""
    
    def __init__(self, form, name=None, fields=(), classes=(), description=None, template=None):
        super().__init__(form, name, fields, classes, description, template)
        self.categories = ['Folder', 'Folder Tray', 'Proof Preview']
    
    def __iter__(self):
        for i, line in enumerate(super().__iter__()):
            if i < len(self.categories):
                line.category_name = self.categories[i]
            yield line


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = True
    verbose_name_plural = 'Profile'
    
    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        
        # Find the permissions fieldset and replace it with our custom one
        for i, fieldset in enumerate(fieldsets):
            if fieldset[0] == 'Permissions':
                # Create custom fieldset with categories
                fields = fieldset[1]['fields']
                classes = fieldset[1].get('classes', ())
                description = fieldset[1].get('description', '')
                
                # Return custom fieldset structure
                return (
                    ('Basic Information', {
                        'fields': ('role', 'avatar', 'bio', 'phone', 'company', 'job_title')
                    }),
                    ('Permissions', {
                        'fields': (
                            ('Folder: can_create_folder, can_add_member, can_edit_folder, can_add_proof, can_delete_folder'),
                            ('Folder Tray: can_add_proof_in_folder, can_delete_proof_in_folder'),
                            ('Proof Preview: can_use_proofieplus, can_add_comment, can_delete_proof_in_preview'),
                        ),
                        'description': 'User-specific permissions (overrides role defaults)',
                        'classes': ('permissions-horizontal',)
                    }),
                )
        
        return fieldsets
    
    class Media:
        css = {
            'all': ('admin/css/permissions_layout.css',)
        }
