# Folder Sharing & Real-Time Synchronization Implementation

## Overview
This document describes the implementation of shared folder access with real-time synchronization for the Proofie application. Folders can now be shared with multiple users, and all changes are synchronized in real-time via WebSockets.

## Features Implemented

### 1. **Folder Membership System**
- Added `FolderMember` model with three roles:
  - **Owner**: Full control (edit, delete, manage members)
  - **Editor**: Can add/remove proofs
  - **Viewer**: Read-only access
- Folder owners are automatically added as members when creating folders
- Multiple users can access the same folder based on their membership

### 2. **Auto-Add Reviewers**
- When a proof is created with a folder, all reviewers are automatically added as folder members (viewer role)
- When a proof is moved to a different folder, reviewers are auto-added to the new folder
- Prevents manual member management overhead

### 3. **Real-Time Synchronization**
All folder changes are broadcast via WebSocket to all folder members:
- **Folder Updates**: Name/description changes
- **Folder Deletion**: Removes folder from all members' views
- **Proof Added**: Shows new proof in folder
- **Proof Removed**: Removes proof from folder view
- **Member Added**: Notifies all members of new member
- **Member Removed**: Updates member list and removes access for removed user
- **Role Updated**: Reflects permission changes

### 4. **Folder Members Management UI**
- New "Manage Members" button on each folder (Users icon)
- Modal interface for:
  - Viewing all folder members
  - Adding new members with role selection
  - Removing members (except owner)
  - Updating member roles
- User search functionality for easy member addition

## Backend Changes

### Models (`apps/versioning/models.py`)
```python
class FolderMember(models.Model):
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folder_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    added_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        unique_together = ('folder', 'user')
```

### Serializers (`apps/versioning/serializers.py`)
- `FolderMemberSerializer`: Serializes folder membership data
- Updated `FolderSerializer` to include:
  - `members`: List of all folder members
  - `member_count`: Total number of members
  - `user_role`: Current user's role in the folder

### ViewSet Updates (`apps/versioning/views.py`)

#### FolderViewSet
- **get_queryset()**: Returns folders where user is owner OR member
- **perform_create()**: Auto-creates owner membership
- **update()**: Broadcasts folder updates via WebSocket
- **destroy()**: Broadcasts deletion before removing folder

#### New API Endpoints
- `POST /api/versioning/folders/{id}/add_member/` - Add user to folder
- `DELETE /api/versioning/folders/{id}/remove_member/` - Remove user from folder
- `PATCH /api/versioning/folders/{id}/update_member_role/` - Update member role
- `GET /api/versioning/folders/{id}/members/` - List all folder members

#### ProjectViewSet
- **create()**: Auto-adds reviewers as folder members when proof created with folder
- **update()**: Handles proof folder changes and broadcasts updates

### WebSocket Service (`apps/versioning/services.py`)
```python
class FolderUpdateService:
    @staticmethod
    def broadcast_folder_update(folder, update_type, data=None):
        # Broadcasts updates to all folder members via WebSocket
        # Update types: folder_updated, folder_deleted, proof_added, 
        #               proof_removed, member_added, member_removed, member_role_updated
```

### WebSocket Consumer (`apps/notifications/consumers.py`)
Added `folder_update` handler to process and forward folder update messages to connected clients.

## Frontend Changes

### Components

#### FolderMembersModal (`frontend/src/components/FolderMembersModal.jsx`)
New modal component for managing folder members:
- Lists all current members with their roles
- User search and selection for adding members
- Role selector (Owner/Editor/Viewer)
- Remove member functionality
- Real-time updates when members change

#### Folders.jsx Updates
- Added "Manage Members" button (Users icon) to folder action buttons
- Integrated `FolderMembersModal` component
- Enhanced WebSocket listener to handle folder update events:
  - `folder_updated`: Refreshes folder data
  - `folder_deleted`: Removes folder from view
  - `proof_added`: Refreshes folder projects
  - `proof_removed`: Refreshes folder projects
  - `member_added`: Shows notification and refreshes
  - `member_removed`: Handles current user removal
  - `member_role_updated`: Refreshes folder data
- Toast notifications for all real-time updates

## Database Migrations

### Migration 0007: Create FolderMember Model
Creates the `FolderMember` table with all necessary fields and constraints.

### Migration 0008: Data Migration
Automatically creates `FolderMember` entries for all existing folder owners with role='owner'.

## API Usage Examples

### Add Member to Folder
```javascript
POST /api/versioning/folders/1/add_member/
{
  "user_id": 5,
  "role": "editor"
}
```

### Remove Member from Folder
```javascript
DELETE /api/versioning/folders/1/remove_member/
{
  "member_id": 3
}
```

### Update Member Role
```javascript
PATCH /api/versioning/folders/1/update_member_role/
{
  "member_id": 3,
  "role": "viewer"
}
```

## WebSocket Message Format

### Folder Update Message
```javascript
{
  "type": "folder_update",
  "folder_id": 1,
  "folder_name": "My Folder",
  "update_type": "proof_added",
  "data": {
    "project_id": 5,
    "project_name": "New Proof"
  }
}
```

## Testing

All functionality has been tested with automated tests in `tests/test_folder_sync.py`:

✅ **Test 1: Folder Member Creation** - Verifies FolderMember is created when folder is created
✅ **Test 2: Folder Visibility** - Confirms folders are visible to all members
✅ **Test 3: Auto-add Reviewers** - Validates reviewers are auto-added as folder members
✅ **Test 4: WebSocket Broadcast** - Tests WebSocket broadcasting functionality

Run tests with:
```bash
python tests/test_folder_sync.py
```

## User Experience Flow

1. **Creating a Folder**:
   - User creates folder → Automatically becomes owner member
   - Can immediately manage members via "Manage Members" button

2. **Adding Proofs to Folder**:
   - User creates proof with folder → Reviewers auto-added as folder members
   - All folder members see the new proof in real-time

3. **Managing Members**:
   - Click Users icon on folder
   - Search and add users with specific roles
   - Update roles or remove members as needed
   - All changes broadcast to affected users

4. **Real-Time Updates**:
   - All folder members see changes instantly
   - Toast notifications inform users of changes
   - Removed members lose access immediately

## Permissions

| Action | Owner | Editor | Viewer |
|--------|-------|--------|--------|
| View folder & proofs | ✅ | ✅ | ✅ |
| Edit folder name/description | ✅ | ❌ | ❌ |
| Add proofs to folder | ✅ | ✅ | ❌ |
| Remove proofs from folder | ✅ | ✅ | ❌ |
| Add members | ✅ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ |
| Update member roles | ✅ | ❌ | ❌ |
| Delete folder | ✅ | ❌ | ❌ |

## Files Modified/Created

### Backend
- ✅ `apps/versioning/models.py` - Added FolderMember model
- ✅ `apps/versioning/serializers.py` - Added FolderMemberSerializer, updated FolderSerializer
- ✅ `apps/versioning/views.py` - Updated FolderViewSet and ProjectViewSet
- ✅ `apps/versioning/services.py` - Created FolderUpdateService
- ✅ `apps/notifications/consumers.py` - Added folder_update handler
- ✅ `apps/versioning/migrations/0007_foldermember.py` - Model migration
- ✅ `apps/versioning/migrations/0008_auto_20260404_1742.py` - Data migration

### Frontend
- ✅ `frontend/src/components/FolderMembersModal.jsx` - New component
- ✅ `frontend/src/pages/Folders.jsx` - Updated with member management and WebSocket handlers

### Tests
- ✅ `tests/test_folder_sync.py` - Comprehensive test suite

## Future Enhancements

Potential improvements for future iterations:
- Folder templates with default member roles
- Bulk member operations
- Member activity logs
- Email notifications for folder changes
- Folder access analytics
- Nested folder support with inherited permissions

## Troubleshooting

### Members not seeing folder updates
- Check WebSocket connection in browser console
- Verify user is a folder member in database
- Ensure Redis/channel layer is running

### Auto-add reviewers not working
- Verify proof has reviewers assigned
- Check that proof is associated with a folder
- Review ProjectViewSet.create() logic

### Permission errors
- Confirm user's role in folder
- Check FolderViewSet permission logic
- Verify user is authenticated

## Conclusion

The folder sharing and real-time synchronization feature is now fully implemented and tested. All folder changes are instantly visible to all members, reviewers are automatically added to folders, and a comprehensive member management UI provides full control over folder access.
