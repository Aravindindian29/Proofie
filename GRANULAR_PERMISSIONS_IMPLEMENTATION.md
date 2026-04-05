# Granular Permissions System Implementation

## Overview

Successfully implemented a comprehensive granular permission system with 9 specific permissions organized into three categories, accessible via Django admin under Workflows section and individual user profiles, replacing the previous role-based permission logic.

## Permission Categories

### 1. Folder Permissions (5 permissions)
- **Create Folder** - Ability to create new folders
- **Add Member** - Ability to add members to folders
- **Edit Folder** - Ability to edit folder details
- **Add Proof** - Ability to add proofs/projects to folders
- **Delete Folder** - Ability to delete folders

### 2. Inside Folder Permissions (1 permission)
- **Delete Proof** - Ability to delete proofs inside folders

### 3. Proof Preview Permissions (3 permissions)
- **ProofiePlus** - Access to ProofiePlus features
- **Add Comment** - Ability to add comments on proofs
- **Delete Proof** - Ability to delete proofs in preview mode

## Default Permission Matrix

| Role | Create Folder | Add Member | Edit Folder | Add Proof | Delete Folder | Delete Proof (Folder) | ProofiePlus | Add Comment | Delete Proof (Preview) |
|------|---------------|------------|-------------|-----------|---------------|-----------------------|-------------|-------------|------------------------|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approver | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Lite User | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Implementation Details

### Backend Changes

#### 1. Database Models

**UserProfile Model** (`apps/accounts/models.py`)
- Added 9 boolean permission fields
- Added `apply_role_permissions()` method to sync with role defaults
- All permissions default to `False` for security

**RolePermission Model** (`apps/workflows/models.py`)
- New model to define default permissions for each role
- Same 9 permission fields as UserProfile
- Serves as template when assigning roles

#### 2. Django Admin Interface

**Workflows Admin** (`apps/workflows/admin.py`)
- Registered `RolePermission` model with custom admin
- Organized fieldsets by permission category:
  - Role Information
  - Folder Permissions
  - Inside Folder Permissions
  - Proof Preview Permissions
- List display shows key permissions at a glance

**Accounts Admin** (`apps/accounts/admin.py`)
- Updated `UserProfileInline` with permission fieldsets
- Permissions organized in collapsible sections
- Same category structure as RolePermission admin

#### 3. Signal Handlers (`apps/accounts/signals.py`)

**Auto-Apply Permissions:**
- When user is created → Apply Lite User permissions
- When role changes → Apply new role's default permissions
- Uses `pre_save` signal to detect role changes

#### 4. Permission Functions (`apps/versioning/permissions.py`)

**Replaced role-based checks with granular permissions:**
- `can_create_content()` → Checks `can_create_folder`
- `can_edit_content()` → Checks `can_edit_folder` + ownership
- `can_delete_content()` → Checks `can_delete_folder` + ownership

**New granular permission functions:**
- `can_add_folder_member(user)`
- `can_add_proof_to_folder(user)`
- `can_delete_proof_in_folder(user)`
- `can_use_proofieplus(user)`
- `can_add_comment(user)`
- `can_delete_proof_in_preview(user)`

#### 5. API Serializer (`apps/accounts/serializers.py`)

**UserProfileSerializer updated to include:**
- All 9 permission fields exposed to frontend
- Allows frontend to make permission-aware UI decisions

### Frontend Changes

#### Auth Store (`frontend/src/stores/authStore.js`)

**New granular permission helpers:**
- `canCreateFolder()` - Check create folder permission
- `canAddMember()` - Check add member permission
- `canEditFolder()` - Check edit folder permission
- `canAddProof()` - Check add proof permission
- `canDeleteFolder()` - Check delete folder permission
- `canDeleteProofInFolder()` - Check delete proof in folder permission
- `canUseProofiePlus()` - Check ProofiePlus access
- `canAddComment()` - Check comment permission
- `canDeleteProofInPreview()` - Check delete in preview permission

**Legacy compatibility maintained:**
- `canCreateContent()` → Maps to `canCreateFolder()`
- `canEditContent()` → Uses `canEditFolder()` + ownership check
- `canDeleteContent()` → Uses `canDeleteFolder()` + ownership check

## Admin Access Points

### 1. Workflows → Role Permissions
- Manage default permissions for each role
- Set permission templates that apply to all users of that role
- Changes here affect new users and users when role changes

### 2. Accounts → Users → Individual User → Profile
- View and customize permissions for specific users
- Override role defaults if needed
- Permissions organized in collapsible sections:
  - Folder Permissions
  - Inside Folder Permissions
  - Proof Preview Permissions

## Behavior

### New User Creation
1. User is created with default role: `lite_user`
2. Signal automatically applies Lite User permissions (all disabled)
3. Admin can change role in Django admin
4. Permissions auto-update when role changes

### Role Change
1. Admin changes user's role in Django admin
2. `pre_save` signal detects role change
3. Permissions automatically updated from RolePermission template
4. User gets new permission set on next login

### Permission Override
1. Admin can manually adjust individual user permissions
2. Changes persist even if role changes (unless admin wants to reapply)
3. Provides flexibility for special cases

## Files Modified

### Backend
1. `apps/accounts/models.py` - Added 9 permission fields to UserProfile
2. `apps/workflows/models.py` - Created RolePermission model
3. `apps/workflows/admin.py` - Registered RolePermission admin
4. `apps/accounts/admin.py` - Updated UserProfile inline
5. `apps/accounts/signals.py` - Added auto-apply permission signals
6. `apps/versioning/permissions.py` - Updated to use granular permissions
7. `apps/accounts/serializers.py` - Exposed permissions in API

### Frontend
8. `frontend/src/stores/authStore.js` - Added granular permission helpers

### Database
9. Migration: `apps/accounts/migrations/0005_userprofile_can_add_comment_and_more.py`
10. Migration: `apps/workflows/migrations/0006_rolepermission.py`

### Scripts
11. `populate_role_permissions.py` - Populate default role permissions
12. `test_granular_permissions.py` - Comprehensive permission tests

## Testing Results

✅ **All tests passed:**
- RolePermission templates created for all 4 roles
- User permissions correctly applied from role templates
- Permission functions return correct values
- Content-based permissions work as expected
- Auto-apply on role change functioning

### Test Coverage
- Admin: All 9 permissions enabled
- Manager: All 9 permissions enabled
- Approver: Only ProofiePlus and Add Comment enabled
- Lite User: All permissions disabled

## Migration Path

### For Existing Users
1. Run `python populate_role_permissions.py` to create role templates
2. Existing users keep their current permissions until role changes
3. When admin changes a user's role, permissions auto-update
4. Or admin can manually adjust permissions per user

### For New Users
1. Automatically get Lite User permissions (all disabled)
2. Admin assigns appropriate role
3. Permissions auto-apply from role template

## Security Considerations

- **Backend Authoritative**: All permissions enforced at API level
- **Frontend UX**: Permission checks for UI visibility only
- **Default Deny**: All permissions default to `False`
- **Explicit Grant**: Permissions must be explicitly enabled
- **Audit Trail**: Django admin logs all permission changes
- **Role Templates**: Consistent permission sets across users

## Usage Examples

### Admin User
```python
# Has all permissions
can_create_folder = True
can_add_member = True
can_edit_folder = True
can_add_proof = True
can_delete_folder = True
can_delete_proof_in_folder = True
can_use_proofieplus = True
can_add_comment = True
can_delete_proof_in_preview = True
```

### Manager User
```python
# Has all permissions (same as Admin)
# But edit/delete restricted to owned content in backend logic
```

### Approver User
```python
# Limited to review permissions
can_create_folder = False
can_add_member = False
can_edit_folder = False
can_add_proof = False
can_delete_folder = False
can_delete_proof_in_folder = False
can_use_proofieplus = True  # Can use ProofiePlus
can_add_comment = True       # Can add comments
can_delete_proof_in_preview = False
```

### Lite User
```python
# View-only access
# All permissions = False
```

## Benefits

1. **Granular Control**: 9 specific permissions vs 4 broad roles
2. **Flexibility**: Per-user customization possible
3. **Consistency**: Role templates ensure uniform permissions
4. **Automation**: Auto-apply on role changes
5. **Admin Friendly**: Clear UI in Django admin
6. **API Exposed**: Frontend can make permission-aware decisions
7. **Backward Compatible**: Legacy functions still work

## Future Enhancements

- Add permission history/audit log
- Implement permission groups for bulk management
- Add time-based permission expiry
- Create permission presets for common scenarios
- Add permission inheritance for nested structures

## Conclusion

The granular permissions system successfully replaces the previous role-based approach with a flexible, fine-grained permission model. All 9 permissions are fully functional, accessible via Django admin in both the Workflows section (for role defaults) and individual user profiles (for customization). The system automatically applies permissions based on roles while allowing manual overrides when needed.
