# Folder Member Permissions Implementation

## Overview

Successfully implemented role-based folder member management permissions where Admin, Manager, and Approver roles have equal permissions to manage members across all folders, while Lite Users have restricted access.

## Implementation Details

### Backend Changes

#### 1. Enhanced Permission System (`apps/versioning/permissions.py`)

**New Functions Added:**
- `can_manage_folder_members(user, folder)` - Checks if user can manage folder members based on system role
- `can_remove_folder_member(user, target_user, folder)` - Checks if user can remove specific member
- `is_folder_owner(user, folder)` - Checks if user is folder owner

**Permission Logic:**
- **Admin/Manager/Approver**: Full management rights across ALL folders
- **Lite User**: Can only remove themselves from folders

#### 2. Updated Folder Member Management (`apps/versioning/views.py`)

**Add Member Action:**
- Allows Admin/Manager/Approver to add members to any folder
- Preserves existing folder owner permissions
- Uses new permission system for authorization

**Remove Member Action:**
- Allows Admin/Manager/Approver to remove any member including owners
- Allows self-removal for all roles
- Prevents removing the last owner of a folder
- Blocks Lite Users from removing others (except themselves)

#### 3. Enhanced User Profile Data (`apps/accounts/serializers.py`)

**Added role field to UserProfileSerializer** so frontend can access user's system role.

### Frontend Changes

#### 4. Permission-Aware UI (`frontend/src/components/FolderMembersModal.jsx`)

**Permission Functions:**
- `canManageFolderMembers()` - Checks if user has elevated system role
- `canRemoveMember(member)` - Checks if user can remove specific member
- `canRemoveOwner(member)` - Checks if user can remove owner
- `showAddMemberButton()` - Determines if Add Member button should be visible

**UI Updates:**
- "Add Member" button only shows for Admin/Manager/Approver or folder owners
- Trash icons show/hide based on permissions for each member
- Self-removal always available
- Owner removal only available for Admin/Manager/Approver

## Permission Matrix

| User Role | Can Add Members | Can Remove Members | Can Remove Owners | Self-Remove | Scope |
|----------|----------------|-------------------|-------------------|-------------|-------|
| Admin    | ✓ (all folders) | ✓ (all folders)   | ✓                 | ✓           | Global |
| Manager  | ✓ (all folders) | ✓ (all folders)   | ✓                 | ✓           | Global |
| Approver | ✓ (member folders only) | ✓ (member folders only) | ✓ (member folders only) | ✓ (member folders only) | Folder-Scoped |
| Lite User| ✗              | ✗                 | ✗                 | ✗           | None |

## Test Results

✅ **All permission tests passed:**
- Admin/Manager have global permissions (all folders)
- Approvers have folder-scoped permissions (member folders only)
- Lite Users have no permissions
- Self-removal works for Admin/Manager/Approver within their scope
- Owner removal restricted to authorized roles within scope
- Last owner protection works correctly

## Key Features Implemented

1. **Role-Based Access Control**: System roles determine folder management permissions
2. **Mixed Scope**: Admin/Manager have global permissions, Approvers have folder-scoped permissions
3. **Scoped Self-Management**: Users can remove themselves within their permission scope
4. **Owner Protection**: Only authorized roles can remove folder owners within scope
5. **UI Adaptation**: Interface adapts based on user permissions and folder membership
6. **Fallback Handling**: Graceful handling when user profiles don't exist

## Security Considerations

- Permission checks happen on both backend and frontend
- Backend permissions are authoritative (frontend only for UX)
- Self-removal always allowed regardless of role
- Last owner cannot be removed to prevent orphaned folders
- System roles override folder member roles as specified

## Usage Examples

### Admin User
- Can add any user to any folder
- Can remove any member including owners
- Full folder management across system

### Lite User
- Can only see "Add Member" if they own the folder
- Can only remove themselves from folders
- Cannot remove other members or owners

### Self-Removal
- Any user can remove themselves from any folder
- Works regardless of system role or folder role
- Prevents accidental lockout

## Files Modified

### Backend
- `apps/versioning/permissions.py` - Added permission helper functions
- `apps/versioning/views.py` - Updated add_member/remove_member actions
- `apps/accounts/serializers.py` - Added role to user profile data

### Frontend
- `frontend/src/components/FolderMembersModal.jsx` - Added permission-aware UI

## Testing

Created comprehensive test suite (`test_folder_permissions.py`) that verifies:
- All permission combinations work correctly
- Edge cases handled properly
- Self-removal functionality
- Owner protection mechanisms

## Deployment Notes

- No database migrations required
- Backward compatible with existing folder structure
- Existing folder owners retain their permissions
- New permission system works alongside existing folder roles
