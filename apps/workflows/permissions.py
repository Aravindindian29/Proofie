from rest_framework import permissions


class IsReviewCycleProjectMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        project = obj.asset.project
        return project.owner == request.user or project.members.filter(user=request.user).exists()
