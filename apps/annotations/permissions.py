from rest_framework import permissions


class IsAnnotationAuthorOrProjectMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        project = obj.version.asset.project
        is_member = project.owner == request.user or project.members.filter(user=request.user).exists()
        return is_member
