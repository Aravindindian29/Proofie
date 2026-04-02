from rest_framework import serializers
from .models import Project, ProjectMember, CreativeAsset, FileVersion, VersionComment, Folder
from django.contrib.auth.models import User


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class FolderSerializer(serializers.ModelSerializer):
    owner = UserBasicSerializer(read_only=True)
    project_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Folder
        fields = ['id', 'name', 'description', 'owner', 'project_count', 'created_at', 'updated_at', 'is_active']
    
    def get_project_count(self, obj):
        return obj.project_count
    
    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Folder name is required.")
        return value.strip()


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'user_id', 'role', 'added_at']


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserBasicSerializer(read_only=True)
    members = ProjectMemberSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    folder = FolderSerializer(read_only=True)
    folder_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'members', 'member_count', 
                  'created_at', 'updated_at', 'is_active', 
                  'asset_file_url', 'asset_file_type', 'asset_filename', 'thumbnail_url',
                  'folder', 'folder_id', 'share_token']

    def get_member_count(self, obj):
        return obj.members.count()
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail URL from the first asset with a thumbnail"""
        request = self.context.get('request')
        
        try:
            # Query for first asset with non-archived status
            asset = obj.assets.filter(is_archived=False).first()
            if asset:
                # Get the current version
                current_version = asset.versions.filter(is_current=True).first()
                if current_version and current_version.thumbnail:
                    thumbnail_name = current_version.thumbnail.name
                    if request and hasattr(request, 'build_absolute_uri'):
                        try:
                            return request.build_absolute_uri(f'/api/versioning/media/{thumbnail_name}')
                        except:
                            return f'http://localhost:8000/api/versioning/media/{thumbnail_name}'
                    else:
                        return f'http://localhost:8000/api/versioning/media/{thumbnail_name}'
        except Exception as e:
            # Log error but don't crash
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting thumbnail_url: {e}")
        
        return None
    
    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Project name is required.")
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Project name must be at least 2 characters long.")
        return value.strip()
    
    def validate_description(self, value):
        if value and len(value) > 1000:
            raise serializers.ValidationError("Description must be less than 1000 characters.")
        return value


class FileVersionSerializer(serializers.ModelSerializer):
    uploaded_by = UserBasicSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = FileVersion
        fields = ['id', 'version_number', 'file', 'file_url', 'file_size', 'uploaded_by', 'uploaded_at', 'change_notes', 'is_current', 'thumbnail']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            # Use the chrome-fixed media URL pattern for better Chrome compatibility
            file_path = obj.file.name  # Gets relative path like 'assets/2026/.../filename.pdf'
            return request.build_absolute_uri(f'/api/versioning/media/{file_path}')
        return None


class VersionCommentSerializer(serializers.ModelSerializer):
    author = UserBasicSerializer(read_only=True)

    class Meta:
        model = VersionComment
        fields = ['id', 'author', 'content', 'created_at', 'updated_at']


class CreativeAssetSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)
    versions = FileVersionSerializer(many=True, read_only=True)
    current_version = serializers.SerializerMethodField()
    version_count = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    review_cycles = serializers.SerializerMethodField()

    class Meta:
        model = CreativeAsset
        fields = ['id', 'name', 'description', 'file_type', 'project', 'created_by', 'created_at', 'updated_at', 'is_archived', 'versions', 'current_version', 'version_count', 'thumbnail_url', 'review_cycles']

    def get_current_version(self, obj):
        current = obj.versions.filter(is_current=True).first()
        return FileVersionSerializer(current, context=self.context).data if current else None

    def get_version_count(self, obj):
        return obj.versions.count()
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail URL from current version"""
        request = self.context.get('request')
        current = obj.versions.filter(is_current=True).first()
        if current and current.thumbnail:
            # Build URL manually if request is not available or has no host
            if request and hasattr(request, 'build_absolute_uri'):
                try:
                    return request.build_absolute_uri(f'/api/versioning/media/{current.thumbnail.name}')
                except:
                    return f'http://localhost:8000/api/versioning/media/{current.thumbnail.name}'
            else:
                return f'http://localhost:8000/api/versioning/media/{current.thumbnail.name}'
        return None
    
    def get_review_cycles(self, obj):
        """Get review cycles for this asset"""
        try:
            from apps.workflows.models import ReviewCycle
            cycles = ReviewCycle.objects.filter(asset=obj).order_by('-initiated_at')
            return [{
                'id': cycle.id,
                'status': cycle.status,
                'initiated_at': cycle.initiated_at,
                'created_by': {
                    'id': cycle.created_by.id if cycle.created_by else None,
                    'username': cycle.created_by.username if cycle.created_by else None
                }
            } for cycle in cycles]
        except Exception as e:
            return []


class FileVersionUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileVersion
        fields = ['file', 'change_notes']
