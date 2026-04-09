# Fix: Reviewer Progress Not Updating for All Groups

## Issue Description

**Problem**: When members from Group 1 or Group 3 opened the PDF in the file viewer and returned to the Project Details Tray, their reviewer progress remained as "Not Started" instead of changing to "Reviewing". However, Group 2 members' progress updated correctly.

**Root Cause**: The `trackView` function in FileViewer.jsx was only being called when the review cycle status was `'not_started'`. After the first member (e.g., from Group 2) opened the file viewer, the review cycle status changed to `'in_progress'`, preventing subsequent members from other groups from triggering the `trackView` API call.

## Solution

### Frontend Fix (`frontend/src/pages/FileViewer.jsx`)

**Before**:
```javascript
// Auto-track view when review cycle is available and status is Not Started (only once)
useEffect(() => {
  if (reviewCycleId && !viewTracked && asset?.review_cycles?.[0]?.status === 'not_started') {
    trackView()
    fetchMyStatus()
  } else if (reviewCycleId && !viewTracked) {
    // Just fetch status if already in progress or other status
    fetchMyStatus()
  }
}, [reviewCycleId, viewTracked, asset?.review_cycles?.[0]?.status])
```

**After**:
```javascript
// Auto-track view when review cycle is available (only once per session)
useEffect(() => {
  if (reviewCycleId && !viewTracked) {
    // Always track view regardless of review cycle status
    // This ensures every member's view is tracked, not just the first one
    trackView()
    fetchMyStatus()
  }
}, [reviewCycleId, viewTracked])
```

**Key Changes**:
1. Removed the condition `asset?.review_cycles?.[0]?.status === 'not_started'`
2. Removed the `else if` branch that was skipping `trackView()`
3. Simplified dependencies to only `[reviewCycleId, viewTracked]`
4. Now **always** calls `trackView()` for every member, regardless of review cycle status

### Backend Enhancements

#### Enhanced Logging (`apps/workflows/views.py`)

Added detailed logging to `track_view` endpoint:
- Logs when member is found and their current progress
- Logs when progress is updated from 'not_started' to 'reviewing'
- Logs warnings when member is not found or progress is not 'not_started'

#### Enhanced Logging (`apps/workflows/services.py`)

Added detailed logging to `update_reviewer_progress`:
- Logs the old and new reviewer progress status
- Logs calculated stage status
- Logs calculated proof status
- Logs when WebSocket broadcast is sent

## How It Works Now

### Flow for Any Member from Any Group:

```
Member opens file viewer
    ↓
FileViewer.jsx: useEffect triggers (reviewCycleId && !viewTracked)
    ↓
Calls trackView() API
    ↓
Backend: track_view endpoint
    ↓
Finds member in their group (Group 1, 2, or 3)
    ↓
Checks: member.reviewer_progress == 'not_started'?
    ↓
YES → update_reviewer_progress(member, 'reviewing')
    ↓
Updates member.reviewer_progress = 'reviewing'
    ↓
Calculates stage_status for member's group
    ↓
Calculates proof_status for review cycle
    ↓
Broadcasts full review_cycle_data via WebSocket
    ↓
Frontend receives update
    ↓
Updates reviewCycle and groups state
    ↓
UI shows "Reviewing" badge for member ✅
```

## Testing

### Manual Testing Steps:

1. **Create a review cycle** with 3 groups (Group 1, Group 2, Group 3)
2. **Member from Group 2** opens file viewer
   - ✅ Reviewer progress should change to "Reviewing"
   - ✅ Group 2 stage status should change to "In Progress"
3. **Member from Group 1** opens file viewer
   - ✅ Reviewer progress should change to "Reviewing"
   - ✅ Group 1 stage status should change to "In Progress"
4. **Member from Group 3** opens file viewer
   - ✅ Reviewer progress should change to "Reviewing"
   - ✅ Group 3 stage status should change to "In Progress"
5. **All changes should reflect in real-time** without page refresh

### Automated Testing:

Run the test script:
```bash
python test_reviewer_progress_all_groups.py
```

This script will:
- Find a review cycle with multiple groups
- Simulate members from each group opening the file viewer
- Verify that reviewer progress updates correctly for all groups
- Display before/after status for verification

## Files Modified

1. **`frontend/src/pages/FileViewer.jsx`**
   - Removed status check from trackView useEffect
   - Now always tracks view for every member

2. **`apps/workflows/views.py`**
   - Added detailed logging to track_view endpoint

3. **`apps/workflows/services.py`**
   - Added detailed logging to update_reviewer_progress method

4. **`test_reviewer_progress_all_groups.py`** (New)
   - Test script to verify the fix

## Expected Behavior

### Before Fix:
- ❌ Only first member (who opens when status is 'not_started') gets tracked
- ❌ Subsequent members from other groups don't trigger trackView
- ❌ Their reviewer progress stays "Not Started"

### After Fix:
- ✅ Every member from every group triggers trackView
- ✅ Every member's reviewer progress updates to "Reviewing"
- ✅ Each group's stage status updates independently
- ✅ Real-time updates via WebSocket for all changes

## Logging Output

When a member opens the file viewer, you should see logs like:

```
Member found: john_doe, Group: Group 1, Current progress: not_started
Updating reviewer progress from 'not_started' to 'reviewing' for user john_doe
✅ Updated reviewer progress to 'reviewing' for user john_doe in review cycle 18, Group: Group 1
📊 Updated reviewer progress: john_doe (Group 1) - not_started → reviewing
📊 Calculated stage status for Group 1: in_progress
📊 Calculated proof status: in_progress
📡 Broadcasted review cycle update for review cycle 18
```

## Notes

- The fix is **generic** and works for all groups (1, 2, 3, or any number)
- The `viewTracked` state ensures `trackView` is only called **once per session**
- Backend still validates that progress is 'not_started' before updating to 'reviewing'
- WebSocket broadcasts ensure real-time updates across all open tabs/users
