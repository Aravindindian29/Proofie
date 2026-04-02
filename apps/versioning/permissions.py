from rest_framework import permissions


class IsProjectMemberOrOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user or obj.members.filter(user=request.user).exists()


class IsAssetProjectMemberOrOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        project = obj.project
        return project.owner == request.user or project.members.filter(user=request.user).exists()
