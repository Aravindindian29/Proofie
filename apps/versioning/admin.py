from django.contrib import admin
from django.utils.html import format_html
from .models import Project, ProjectMember, CreativeAsset, FileVersion, VersionComment, Folder

class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 0
    readonly_fields = ['user', 'role', 'added_at']

class CreativeAssetInline(admin.TabularInline):
    model = CreativeAsset
    extra = 0
    readonly_fields = ['name', 'filename', 'file_type', 'file_url_link', 'created_by', 'created_at', 'is_archived']
    fields = ['name', 'filename', 'file_type', 'file_url_link', 'created_by', 'created_at', 'is_archived']

    def file_url_link(self, obj):
        if obj.file_url:
            return format_html('<a href="{}" target="_blank">{}</a>', obj.file_url, obj.file_url)
        return '-'
    file_url_link.short_description = 'File URL'

class ProjectAdmin(admin.ModelAdmin):
    exclude = ('description',)
    list_display = ['name', 'owner', 'member_count_display', 'created_at', 'is_active', 'asset_file_type_display']
    readonly_fields = ['created_at', 'asset_filename', 'asset_file_type', 'asset_file_url_link']
    fieldsets = (
        ('Project Information', {
            'fields': ('name', 'owner', 'is_active')
        }),
        ('Asset File Information', {
            'fields': ('asset_filename', 'asset_file_type', 'asset_file_url_link'),
            'classes': ('collapse',)
        }),
    )
    inlines = [ProjectMemberInline]
    
    def member_count_display(self, obj):
        return obj.members.count()
    member_count_display.short_description = 'Member Count'
    
    def asset_file_type_display(self, obj):
        if obj.asset_file_type:
            return obj.asset_file_type.upper()
        return '-'
    asset_file_type_display.short_description = 'Asset Type'
    
    def asset_file_url_link(self, obj):
        if obj.asset_file_url:
            return format_html('<a href="{}" target="_blank">{}</a>', obj.asset_file_url, obj.asset_file_url)
        return '-'
    asset_file_url_link.short_description = 'Asset File URL'

admin.site.register(Project, ProjectAdmin)
admin.site.register(ProjectMember)
admin.site.register(CreativeAsset)
admin.site.register(FileVersion)
admin.site.register(VersionComment)


class FolderAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'project_count_display', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    def project_count_display(self, obj):
        return obj.project_count
    project_count_display.short_description = 'Projects'

admin.site.register(Folder, FolderAdmin)
