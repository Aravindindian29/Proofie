from rest_framework import permissions
from django.db.models import Q


class IsProjectMemberOrOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user or obj.members.filter(user=request.user).exists()


class IsAssetProjectMemberOrOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        project = obj.project
        return project.owner == request.user or project.members.filter(user=request.user).exists()


class IsAdminOrOwner(permissions.BasePermission):
    """
    Permission class that allows access if user is admin or object owner.
    Used for edit/delete operations.
    """
    def has_object_permission(self, request, view, obj):
        return self.is_admin(request.user) or obj.owner == request.user
    
    def is_admin(self, user):
        try:
            from apps.accounts.models import UserProfile
            profile = UserProfile.objects.get(user=user)
            return profile.role == 'admin'
        except UserProfile.DoesNotExist:
            return False


class CanViewContent(permissions.BasePermission):
    """
    Permission class that allows view access based on user role and membership.
    """
    def has_object_permission(self, request, view, obj):
        return can_view_content(request.user, obj)


class CanEditContent(permissions.BasePermission):
    """
    Permission class that allows edit access based on user role and ownership.
    """
    def has_object_permission(self, request, view, obj):
        return can_edit_content(request.user, obj)


class CanDeleteContent(permissions.BasePermission):
    """
    Permission class that allows delete access based on user role and ownership.
    """
    def has_object_permission(self, request, view, obj):
        return can_delete_content(request.user, obj)


class CanCreateContent(permissions.BasePermission):
    """
    Permission class that allows create access based on user role.
    """
    def has_permission(self, request, view):
        return can_create_content(request.user)


def can_manage_folder_members(user, folder=None):
    """
    Check if a user can manage folder members based on their system role.
    
    Args:
        user: The user to check permissions for
        folder: The folder to check permissions for
    
    Returns:
        dict: Permission details including can_add, can_remove, can_remove_owner
    """
    try:
        from apps.accounts.models import UserProfile
        user_profile = UserProfile.objects.get(user=user)
        system_role = user_profile.role
    except (UserProfile.DoesNotExist, AttributeError):
        # Fallback if profile doesn't exist
        system_role = 'lite_user'
    
    # Admin and Manager have global management rights
    global_roles = ['admin', 'manager']
    
    if system_role in global_roles:
        return {
            'can_manage': True,
            'can_add': True,
            'can_remove': True,
            'can_remove_owner': True,
            'can_manage_all_folders': True
        }
    
    # Approvers have folder-scoped management rights
    if system_role == 'approver':
        if folder and folder.members.filter(user=user).exists():
            return {
                'can_manage': True,
                'can_add': True,
                'can_remove': True,
                'can_remove_owner': True,
                'can_manage_all_folders': False
            }
        else:
            return {
                'can_manage': False,
                'can_add': False,
                'can_remove': False,
                'can_remove_owner': False,
                'can_manage_all_folders': False
            }
    
    # Lite Users have restricted permissions
    return {
        'can_manage': False,
        'can_add': False,
        'can_remove': False,
        'can_remove_owner': False,
        'can_manage_all_folders': False
    }


def can_remove_folder_member(user, target_user, folder):
    """
    Check if a user can remove a specific member from a folder.
    
    Args:
        user: The user attempting to remove
        target_user: The user being removed
        folder: The folder
    
    Returns:
        bool: True if removal is allowed
    """
    # Check system permissions first
    permissions = can_manage_folder_members(user, folder)
    
    # Lite Users cannot remove anyone (including themselves)
    if not permissions['can_remove']:
        return False
    
    # Self-removal logic
    if user == target_user:
        # For global roles (Admin/Manager), always allow self-removal
        if permissions['can_manage_all_folders']:
            return True
        # For folder-scoped roles (Approver), allow self-removal if they're a member
        elif folder.members.filter(user=user).exists():
            return True
        else:
            return False
    
    # Check if target is folder owner
    try:
        target_member = folder.members.get(user=target_user)
        if target_member.role == 'owner':
            return permissions['can_remove_owner']
    except:
        pass
    
    return permissions['can_remove']


def is_folder_owner(user, folder):
    """Check if user is folder owner"""
    try:
        member = folder.members.get(user=user)
        return member.role == 'owner'
    except:
        return False


def get_user_role(user):
    """Get user's system role with fallback"""
    try:
        from apps.accounts.models import UserProfile
        profile = UserProfile.objects.get(user=user)
        return profile.role
    except UserProfile.DoesNotExist:
        return 'lite_user'


def can_view_content(user, obj):
    """Check if user can view content (folder or project)"""
    try:
        profile = user.profile
        # Users with any permission can view content they have access to
        # Check if user is owner
        if obj.owner == user:
            return True
        
        # Check if user is a member
        if hasattr(obj, 'members') and obj.members.filter(user=user).exists():
            return True
        
        # Admin can view everything (has all permissions)
        if profile.can_create_folder and profile.can_edit_folder and profile.can_delete_folder:
            return True
            
    except AttributeError:
        pass
    
    return False


def can_edit_content(user, obj):
    """Check if user can edit content (folder or project) - Admin and Manager can edit all content"""
    try:
        profile = user.profile
        
        # Check granular permission
        if not profile.can_edit_folder:
            return False
        
        # Admin and Manager (have all three core permissions) can edit everything
        if profile.can_create_folder and profile.can_delete_folder and profile.can_edit_folder:
            return True
        
        # Others cannot edit (Approver/Lite don't have can_edit_folder permission)
        return False
        
    except AttributeError:
        return False


def can_delete_content(user, obj):
    """Check if user can delete content (folder or project) - Admin and Manager can delete all content"""
    try:
        profile = user.profile
        
        # Check granular permission
        if not profile.can_delete_folder:
            return False
        
        # Admin and Manager (have all three core permissions) can delete everything
        if profile.can_create_folder and profile.can_edit_folder and profile.can_delete_folder:
            return True
        
        # Others cannot delete (Approver/Lite don't have can_delete_folder permission)
        return False
        
    except AttributeError:
        return False


def can_create_content(user):
    """Check if user can create content - uses can_create_folder permission"""
    try:
        profile = user.profile
        return profile.can_create_folder
    except AttributeError:
        return False


def can_add_folder_member(user):
    """Check if user can add members to folders"""
    try:
        profile = user.profile
        return profile.can_add_member
    except AttributeError:
        return False


def can_add_proof_to_folder(user):
    """Check if user can add proofs to folders"""
    try:
        profile = user.profile
        return profile.can_add_proof
    except AttributeError:
        return False


def can_delete_proof_in_folder(user):
    """Check if user can delete proofs inside folders"""
    try:
        profile = user.profile
        return profile.can_delete_proof_in_folder
    except AttributeError:
        return False


def can_use_proofieplus(user):
    """Check if user can use ProofiePlus features"""
    try:
        profile = user.profile
        return profile.can_use_proofieplus
    except AttributeError:
        return False


def can_add_comment(user):
    """Check if user can add comments"""
    try:
        profile = user.profile
        return profile.can_add_comment
    except AttributeError:
        return False


def can_delete_proof_in_preview(user):
    """Check if user can delete proofs in preview"""
    try:
        profile = user.profile
        return profile.can_delete_proof_in_preview
    except AttributeError:
        return False


def get_user_accessible_folders(user):
    """Get folders user can access based on role"""
    user_role = get_user_role(user)
    
    if user_role == 'admin':
        # Admin can see all folders
        from .models import Folder
        return Folder.objects.filter(is_active=True)
    
    # Other roles can see folders they own or are members of
    from .models import Folder
    return Folder.objects.filter(
        Q(owner=user) | Q(members__user=user),
        is_active=True
    ).distinct()


def get_user_accessible_projects(user):
    """Get projects user can access based on role and review status"""
    user_role = get_user_role(user)
    
    # Admin and Manager can see all projects
    if user_role in ['admin', 'manager']:
        from .models import Project
        return Project.objects.filter(is_active=True)
    
    from .models import Project
    
    # For other roles, implement simpler logic
    # Start with projects user owns or is member of or is folder member of
    accessible_projects = Project.objects.filter(
        Q(owner=user) | Q(members__user=user) | Q(folder__members__user=user),
        is_active=True
    ).distinct()
    
    # Apply reviewer restriction logic
    # This is a simplified version - in production you might want to optimize this
    final_project_ids = []
    
    for project in accessible_projects:
        # Check if project has active review cycles
        has_active_review = project.assets.filter(
            review_cycles__status__in=['not_started', 'in_progress']
        ).exists()
        
        if not has_active_review:
            # No active review - allow access
            final_project_ids.append(project.id)
        else:
            # Has active review - check if user is assigned reviewer
            is_reviewer = False
            
            # Check if user is reviewer via ProjectMember
            if project.members.filter(user=user, role='reviewer').exists():
                is_reviewer = True
            
            # Check if user is reviewer via GroupMember (simplified check)
            if not is_reviewer:
                try:
                    from apps.workflows.models import ReviewCycle, GroupMember
                    if project.assets.filter(
                        review_cycles__group_members__user=user
                    ).exists():
                        is_reviewer = True
                except:
                    # If there's an error with the complex query, default to not reviewer
                    pass
            
            if is_reviewer:
                final_project_ids.append(project.id)
    
    return Project.objects.filter(id__in=final_project_ids)


def has_active_review_cycle(project):
    """Check if project has an active review cycle"""
    from apps.workflows.models import ReviewCycle
    return project.assets.filter(
        review_cycles__status__in=['not_started', 'in_progress']
    ).exists()


def is_assigned_reviewer(user, project):
    """Check if user is assigned as reviewer to active review cycle"""
    from apps.workflows.models import ReviewCycle
    return project.assets.filter(
        review_cycles__status__in=['not_started', 'in_progress'],
        review_cycles__group_members__user=user
    ).exists() or project.members.filter(
        user=user, 
        role='reviewer'
    ).exists()
