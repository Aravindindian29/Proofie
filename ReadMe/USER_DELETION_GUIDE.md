# User Deletion Guide

## Overview

This guide explains how user deletion works in Proofie, including ownership reassignment, data preservation, and the complete cleanup process.

## Key Concepts

### Ownership vs. Historical Actions

When a user is deleted, the system distinguishes between:

1. **Ownership Fields** (REASSIGNED to selected admin):
   - `Folder.owner` - Who owns the folder
   - `Project.owner` - Who owns the project
   - `CreativeAsset.created_by` - Who owns the asset

2. **Historical Action Fields** (SET TO NULL, display "Deleted User"):
   - `FileVersion.uploaded_by` - Who uploaded the version
   - `Annotation.author` - Who created the annotation
   - `AnnotationReply.author` - Who replied to annotation
   - `VersionComment.author` - Who wrote the comment
   - `ReviewCycle.created_by` - Who created the review
   - `StageApproval.approver` - Who approved the stage
   - And other historical tracking fields

## Deletion Process

### Step 1: Select Users to Delete

1. Navigate to Django Admin → Users
2. Select the user(s) you want to delete
3. Choose "Delete selected users (with reassignment)" from the Actions dropdown
4. Click "Go"

### Step 2: Review Owned Content

The system will display:
- List of users to be deleted
- All folders, projects, and assets owned by each user
- Total count of owned items

### Step 3: Select Reassignment User

1. Choose a user from the "Reassignment User" dropdown
2. This user will receive ownership of all folders, projects, and assets
3. **Important**: You cannot select a user that is being deleted

### Step 4: Confirm Deletion

1. Review the information carefully
2. Click "Delete Users and Reassign Ownership"
3. Confirm the action in the popup dialog

## What Happens During Deletion

### Automatic Reassignment
- All folders owned by deleted user → Reassigned to selected user
- All projects owned by deleted user → Reassigned to selected user
- All assets created by deleted user → Reassigned to selected user

### Historical Preservation
- Version upload history → User reference set to NULL
- Annotations and comments → Author set to NULL
- Review cycle history → Creator/initiator set to NULL
- Approval records → Approver set to NULL

### Automatic Cleanup (CASCADE)
- User profile → Deleted
- Email verification records → Deleted
- Notifications → Deleted
- Notification preferences → Deleted
- Folder memberships → Deleted
- Project memberships → Deleted
- Workflow approver assignments → Deleted
- Group memberships → Deleted
- Access tokens → Deleted
- Share tokens → Deleted

## Frontend Display

### Ownership Display
After deletion, the frontend will show:
- Folder owner: **Admin** (reassigned user)
- Project owner: **Admin** (reassigned user)
- Asset owner: **Admin** (reassigned user)

### Historical Action Display
For historical records, the frontend will show:
- Version uploaded by: **Deleted User** (italicized, grayed out)
- Annotation by: **Deleted User** (italicized, grayed out)
- Comment by: **Deleted User** (italicized, grayed out)

## Example Scenario

**Before Deletion:**
```
User: John (being deleted)
- Owns: Marketing Folder
- Owns: Campaign 2024 Project
- Owns: Banner.pdf Asset
- Uploaded: Version 1 of Banner.pdf
- Created: Annotation on Version 1
```

**After Deletion (reassigned to Admin):**
```
User: John (DELETED)
- Marketing Folder → Owner: Admin ✅
- Campaign 2024 Project → Owner: Admin ✅
- Banner.pdf Asset → Owner: Admin ✅
- Version 1 uploaded by: Deleted User 🔒
- Annotation by: Deleted User 🔒
```

## Benefits of This Approach

1. **Content Preservation**: No data loss - all folders, projects, and assets are preserved
2. **Audit Trail**: Historical records show work was done by a deleted user, not falsely attributed
3. **Ownership Transfer**: New owner can manage and modify all content
4. **Data Integrity**: No broken references or orphaned records
5. **Compliance**: Maintains accurate historical records for compliance and auditing

## Validation and Safety

### Pre-Deletion Checks
- System checks if user owns any content
- If content exists, reassignment user MUST be selected
- Cannot reassign to the user being deleted
- Cannot delete if reassignment user doesn't exist

### Transaction Safety
- All operations performed in a database transaction
- If any step fails, entire deletion is rolled back
- No partial deletions or inconsistent state

### Logging
- All deletion operations are logged
- Includes: username, reassignment user, counts of reassigned items
- Logs stored in application logs for audit purposes

## Troubleshooting

### Error: "Please select a user to reassign ownership to"
**Solution**: User owns content. Select a reassignment user from the dropdown.

### Error: "Cannot reassign ownership to the user being deleted"
**Solution**: Choose a different user who is not being deleted.

### Error: "Selected reassignment user does not exist"
**Solution**: The selected user may have been deleted. Refresh and select a valid user.

## Testing User Deletion

Run the test script to verify user deletion functionality:

```bash
python tests/test_user_deletion.py
```

This will test:
- Owned content summary
- Deletion without reassignment (should fail)
- Deletion with reassignment (should succeed)
- Historical record preservation
- Deletion without owned content

## Technical Details

### Signal Handler
Location: `apps/accounts/signals.py`

The `handle_user_deletion` signal:
1. Checks for owned content
2. Validates reassignment user
3. Reassigns ownership fields
4. Allows CASCADE and SET_NULL to handle other relationships

### Admin Interface
Location: `apps/accounts/admin.py`

Custom delete action:
1. Stores selected user IDs in session
2. Redirects to custom confirmation page
3. Displays owned content summary
4. Processes deletion with reassignment

### Frontend Utility
Location: `frontend/src/utils/userDisplay.js`

Functions:
- `getUserDisplayName(user)` - Returns username or "Deleted User"
- `getUserInitials(user)` - Returns initials or "?"
- `isDeletedUser(user)` - Checks if user is null/deleted

## Best Practices

1. **Always review owned content** before deletion
2. **Choose appropriate reassignment user** (usually an admin or manager)
3. **Communicate with team** before deleting active users
4. **Export data if needed** before deletion (deletion is permanent)
5. **Test in development** before deleting production users

## Support

For issues or questions about user deletion:
1. Check application logs for error details
2. Verify reassignment user has appropriate permissions
3. Contact system administrator if problems persist
