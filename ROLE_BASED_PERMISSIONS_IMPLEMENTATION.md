# Role-Based Permissions Implementation

## Overview

Successfully implemented comprehensive role-based permissions for folders and projects (proofs) where Admin has global access, Manager has owner-based access, and Approver/Lite User have view-only access to shared content.

## Permission Matrix

| Role | Create Folders | Edit Folders | Delete Folders | Create Projects | Edit Projects | Delete Projects | View Scope |
|------|----------------|--------------|----------------|-----------------|---------------|-----------------|------------|
| Admin | ✓ (all) | ✓ (all) | ✓ (all) | ✓ (all) | ✓ (all) | ✓ (all) | Global |
| Manager | ✓ (own) | ✓ (own) | ✓ (own) | ✓ (own) | ✓ (own) | ✓ (own) | Own + Member View |
| Approver | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | Member Only |
| Lite User | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | Member Only |

## Implementation Details

### Backend Changes

#### 1. Enhanced Permission System (`apps/versioning/permissions.py`)

**New Permission Classes Added:**
- `IsAdminOrOwner` - Check if admin or object owner
- `CanViewContent` - Check if user can view based on role/membership
- `CanEditContent` - Check if user can edit based on role/ownership
- `CanDeleteContent` - Check if user can delete based on role/ownership
- `CanCreateContent` - Check if user can create content

**Permission Helper Functions:**
- `get_user_role(user)` - Get user's system role with fallback
- `can_view_content(user, obj)` - Unified view permission check
- `can_edit_content(user, obj)` - Unified edit permission check
- `can_delete_content(user, obj)` - Unified delete permission check
- `can_create_content(user)` - Unified create permission check
- `get_user_accessible_folders(user)` - Get folders user can view
- `get_user_accessible_projects(user)` - Get projects user can view

#### 2. Updated ViewSet Permissions (`apps/versioning/views.py`)

**FolderViewSet Changes:**
- Added `get_permissions()` method for action-based permissions
- Updated `get_queryset()` to use role-based filtering
- Applied different permissions for create/edit/delete/view actions

**ProjectViewSet Changes:**
- Added `get_permissions()` method for action-based permissions
- Updated `get_queryset()` to use role-based filtering
- Applied different permissions for create/edit/delete/view actions

### Frontend Changes

#### 3. Enhanced Auth Store (`frontend/src/stores/authStore.js`)

**New Permission Functions Added:**
- `getUserRole()` - Get current user's role
- `isAdmin()`, `isManager()`, `isApprover()`, `isLiteUser()` - Role checks
- `canCreateContent()` - Create permission check
- `canEditContent(content)` - Edit permission check
- `canDeleteContent(content)` - Delete permission check
- `canViewContent(content)` - View permission check

#### 4. Updated Folder UI (`frontend/src/pages/Folders.jsx`)

**UI Permission Controls:**
- "Create Folder" button only shows for Admin/Manager
- Edit button only shows for content user can edit
- Delete button only shows for content user can delete
- Permission-aware UI throughout the component

## Test Results

✅ **All permission tests passed:**
- Admin: Global access to all folders and projects
- Manager: Owner-based access + member view access
- Approver: View-only access to member content
- Lite User: View-only access to member content
- Create permissions: Admin/Manager only
- Edit/Delete permissions: Owner-based or Admin global

## Key Features Implemented

1. **Role-Based Access Control**: System roles determine all content permissions
2. **Global vs Owner-Based**: Admin has global access, Manager has owner-based access
3. **Member-Only Viewing**: Approvers/Lite Users can only view content they're members of
4. **UI Adaptation**: Interface adapts based on user permissions
5. **Backend Security**: All permissions enforced at API level
6. **Frontend UX**: Permission-aware UI for better user experience

## Security Considerations

- **Backend Authorization**: All CRUD operations protected by permission classes
- **Frontend Protection**: UI elements hidden for unauthorized users
- **Role Hierarchy**: Clear permission escalation from Lite User to Admin
- **Member-Based Access**: Proper membership verification for shared content
- **Fallback Handling**: Graceful handling for users without profiles

## Usage Examples

### Admin User
- Can create, edit, delete any folder or project
- Can view all content in the system
- Has full management capabilities

### Manager User
- Can create, edit, delete their own folders and projects
- Can view folders/projects they're members of (but not edit/delete)
- Cannot access content they're not members of

### Approver/Lite User
- Can only view folders and projects they're members of
- Cannot create, edit, or delete any content
- Limited to view-only access

## Files Modified

### Backend
- `apps/versioning/permissions.py` - Added comprehensive permission system
- `apps/versioning/views.py` - Updated ViewSets with role-based permissions

### Frontend
- `frontend/src/stores/authStore.js` - Added permission helper functions
- `frontend/src/pages/Folders.jsx` - Added permission-aware UI controls

## Testing

Created comprehensive test suite (`test_role_based_permissions.py`) that verifies:
- All role combinations work correctly
- Permission inheritance and overrides
- Member-based access control
- Create/edit/delete restrictions
- View access permissions

## Migration Notes

- **No database migrations required**
- **Backward compatible** with existing content
- **Existing permissions replaced** with new role-based system
- **User roles** must be properly set in UserProfile model

## Deployment Considerations

- Ensure all user profiles have correct roles assigned
- Test with different user roles to verify UI behavior
- Monitor API logs for permission-related errors
- Consider adding role management interface for admins

## Future Enhancements

- Add role management interface for administrators
- Implement permission inheritance for nested folders
- Add audit logging for permission-sensitive actions
- Consider adding custom role capabilities
- Implement permission caching for performance optimization
