# Remove Group Locking Implementation Summary

## Overview
Removed sequential group locking logic to allow all workflow groups to review proofs simultaneously, regardless of other groups' progress.

## Changes Made

### 1. Backend Changes

#### Service Layer (`apps/workflows/services.py`)

**`create_groups_for_review()`**:
- Changed all groups to be created with `status='unlocked'`
- Set `unlocked_at=timezone.now()` for all groups
- Removed conditional logic that locked groups after the first one

**`check_and_unlock_next_group()`**:
- Removed logic that unlocks next group sequentially
- Changed to check if ALL groups are completed before finalizing review
- Rejected groups no longer stop other groups from reviewing

**`update_group_socd()`**:
- Updated to allow status change to `in_progress` even if group was previously locked
- Now checks for both `'unlocked'` and `'locked'` statuses

**`broadcast_review_cycle_update()`**:
- Added full serialized review cycle data to WebSocket broadcast
- Includes `proof_status` field
- Includes complete `review_cycle_data` with all groups and members
- Frontend now receives all updated status fields in real-time

#### API Endpoints (`apps/workflows/views.py`)

**`member_decision()`**:
- Removed group locking check
- Members from any group can now make decisions at any time
- Only checks if user has permission (Lite users cannot make decisions)

### 2. Database Updates

**Script**: `unlock_all_groups.py`
- Created utility script to unlock all existing locked groups
- Successfully unlocked 7 groups in the database
- Sets `unlocked_at` timestamp for groups that didn't have one

### 3. Frontend Changes

#### ProjectDetailsTray (`frontend/src/components/ProjectDetailsTray.jsx`)

**WebSocket Handler**:
- Updated to use full `review_cycle_data` from WebSocket broadcast
- Immediately updates `reviewCycle` state with complete data
- Updates `groups` state with new status information
- Fallback to partial update if full data not available
- Ensures all groups' `reviewer_progress` and `stage_status` update in real-time

## How It Works Now

### Before (Sequential Locking):
1. Only Group 1 unlocked initially
2. Group 2, 3, etc. locked
3. Group 2 unlocks only after Group 1 completes
4. Members from locked groups cannot review

### After (Parallel Review):
1. **All groups unlocked** from the start
2. **Any member from any group** can review at any time
3. Each group's `stage_status` calculated independently
4. Overall `proof_status` based on last workflow stage
5. **Real-time updates** for all groups via WebSocket

## Status Calculation Logic

### Reviewer Progress (Individual Member):
- `not_started` → `reviewing` (file viewer opens) → `approved/rejected/approved_with_changes` (decision made)

### Workflow Stage Status (Group Level):
- Aggregates all members' `reviewer_progress` in the group
- Updates independently for each group
- Possible values: Not Started, In Progress, Approved, Rejected, Approved with Changes, Action Required

### Proof Status (Overall):
- Based on last workflow stage's `stage_status`
- Any stage `in_progress` → proof is `in_progress`
- Updates as any group makes progress

## Real-time Update Flow

```
Member from ANY group opens file viewer
    ↓
Backend: update_reviewer_progress('reviewing')
    ↓
Backend: calculate_stage_status(member's group)
    ↓
Backend: calculate_proof_status(review_cycle)
    ↓
Backend: broadcast_review_cycle_update() with FULL data
    ↓
Frontend WebSocket receives complete review_cycle_data
    ↓
Frontend updates reviewCycle and groups state
    ↓
UI reflects new status immediately (no page refresh)
```

## Files Modified

### Backend
1. `apps/workflows/services.py` - Removed locking logic, enhanced WebSocket broadcast
2. `apps/workflows/views.py` - Removed group locking check from member_decision
3. `unlock_all_groups.py` - New utility script to unlock existing groups

### Frontend
1. `frontend/src/components/ProjectDetailsTray.jsx` - Enhanced WebSocket handler to use full data

## Testing Checklist

- [x] All groups created as unlocked
- [x] Existing locked groups unlocked via script
- [x] Member from Group 2 can review without Group 1 completing
- [x] Backend broadcasts full review cycle data
- [ ] Test: Group 1 member opens file viewer → status updates
- [ ] Test: Group 2 member opens file viewer → status updates
- [ ] Test: Both groups' statuses visible and correct in UI
- [ ] Test: WebSocket updates work for all groups simultaneously
- [ ] Test: Proof status reflects last workflow stage correctly

## Benefits

1. **Parallel Workflow**: All groups can work simultaneously
2. **Faster Reviews**: No waiting for previous groups
3. **Better Visibility**: All groups see real-time progress
4. **Flexible Process**: Groups can review in any order
5. **Real-time Sync**: WebSocket broadcasts complete data

## Notes

- Group `status` field still exists (unlocked/in_progress/completed) but no longer restricts access
- `stage_status` is the new field that shows actual workflow progress
- All existing review cycles with locked groups have been unlocked
- WebSocket now sends complete serialized data for accurate frontend updates
