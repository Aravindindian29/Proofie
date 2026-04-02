# 🎯 Workflow Approval Module - SOCD Implementation Summary

**Date:** March 30, 2026  
**Status:** ✅ Backend Complete (Phase 1)  
**Next Phase:** Frontend Development

---

## 📊 **Implementation Status**

### **✅ Completed (Phase 1: Backend)**
- ✅ Database models created
- ✅ Business logic service layer implemented
- ✅ API endpoints and serializers created
- ✅ Database migrations applied
- ✅ Admin panel configured

### **⏳ Pending (Phase 2-3: Frontend & Testing)**
- ⏳ Workflow Dashboard component
- ⏳ Proof Review page with SOCD indicators
- ⏳ Group Status Sidebar component
- ⏳ Admin Workflow Builder
- ⏳ Integration testing

---

## 🏗️ **Architecture Implemented**

### **1. Database Models**

#### **UserProfile (Enhanced)**
**File:** `apps/accounts/models.py`

Added role field with choices:
- `admin` - Full system access
- `owner` - Creates proofs (Product Owners)
- `manager` - Reviews at S1 stage (ProofManagers)
- `lite_user` - Reviews at S2-S5 stages

#### **ApprovalGroup**
**File:** `apps/workflows/models.py`

Tracks each workflow stage as a group:
```python
- review_cycle: ForeignKey to ReviewCycle
- stage: ForeignKey to WorkflowStage
- name: CharField (e.g., "ProofManagers", "Initial L&C")
- order: PositiveIntegerField (1-5 for S1-S5)
- status: locked/unlocked/in_progress/completed
- group_decision: pending/approved/approved_with_changes/rejected
- socd_status: sent/open/commented/decision_made
- unlocked_at: DateTime
- completed_at: DateTime
```

#### **GroupMember**
**File:** `apps/workflows/models.py`

Tracks individual member SOCD and decisions:
```python
- group: ForeignKey to ApprovalGroup
- user: ForeignKey to User
- socd_status: sent/open/commented/decision_made
- decision: pending/approved/changes_requested/rejected
- feedback: TextField
- sent_at, opened_at, commented_at, decision_made_at: DateTimes
```

#### **ReviewCycle (Updated)**
**File:** `apps/workflows/models.py`

Updated status choices:
- `not_started` - Initial state
- `in_progress` - Active review
- `approved` - All groups approved
- `approved_with_changes` - Some groups requested changes
- `rejected` - Any group rejected

---

### **2. Business Logic Service**

**File:** `apps/workflows/services.py`

#### **WorkflowService Methods:**

1. **`check_and_unlock_next_group(group)`**
   - Calculates majority approval (e.g., 3 out of 5)
   - Applies strictest decision aggregation
   - Unlocks next group when majority decides
   - Finalizes review when all groups complete

2. **`finalize_review(review_cycle)`**
   - Determines final status based on all groups
   - Strictest decision wins logic

3. **`update_member_socd(member, action)`**
   - Updates individual SOCD: sent → open → commented → decision_made
   - Triggers group SOCD updates
   - Actions: 'view', 'comment', 'decide'

4. **`update_group_socd(group, status)`**
   - Updates group-level SOCD based on first occurrence
   - Changes group status to in_progress when opened

5. **`record_member_decision(member, decision, feedback)`**
   - Records approve/reject/changes_requested
   - Triggers group unlocking check

6. **`create_groups_for_review(review_cycle, template)`**
   - Creates all groups for 5 stages
   - First group unlocked, rest locked
   - Adds members from stage approvers

7. **`get_member_for_user(review_cycle, user)`**
   - Finds user's group membership

8. **`can_user_access_group(user, group)`**
   - Role-based access control

9. **`get_group_progress(group)`**
   - Returns progress statistics

---

### **3. API Endpoints**

**Base URL:** `/api/workflows/review-cycles/`

#### **New Endpoints:**

1. **`POST /{id}/track_view/`**
   - Track when user views proof
   - Updates SOCD: Sent → Open
   - Response: `{message, socd_status}`

2. **`POST /{id}/member_decision/`**
   - Record member decision
   - Body: `{decision: 'approved'|'rejected'|'changes_requested', feedback: ''}`
   - Validates group is unlocked
   - Triggers majority check and group unlocking
   - Response: Full ReviewCycleDetail

3. **`GET /{id}/group_status/`**
   - Get all groups status
   - Returns progress for each group
   - Response: `{review_cycle_id, status, groups: [{group, progress}]}`

4. **`GET /{id}/my_status/`**
   - Get current user's SOCD status
   - Returns member info and group info
   - Response: `{is_member, member, group, can_decide}`

#### **Updated Endpoints:**

- `GET /{id}/` - Now uses ReviewCycleDetailSerializer with groups
- `POST /` - Now creates groups automatically via WorkflowService

---

### **4. Serializers**

**File:** `apps/workflows/serializers.py`

#### **New Serializers:**

1. **GroupMemberSerializer**
   - Includes user, SOCD status, decision, timestamps

2. **ApprovalGroupSerializer**
   - Includes stage, members, status, SOCD

3. **ReviewCycleDetailSerializer**
   - Enhanced with groups array
   - Full nested data for UI

---

### **5. Database Migrations**

**Applied Migrations:**
- `accounts.0003_userprofile_role` - Added role field
- `workflows.0002_alter_reviewcycle_status_approvalgroup_groupmember` - Added new models

---

## 🔄 **Workflow Logic**

### **SOCD Progression (Individual Member)**
```
Sent → Open → Commented → Decision Made
  ↓      ↓         ↓            ↓
Created  View    Comment     Approve/Reject/Changes
```

### **SOCD Progression (Group Level)**
```
Sent → Open → Commented → Decision Made
  ↓      ↓         ↓            ↓
All    First    First      Majority
Sent   View     Comment    Decided
```

### **Group Unlocking Logic**
```
Group 1 (ProofManagers - S1)
  ├─ 5 members
  ├─ 3 approve, 1 changes, 1 pending
  ├─ Majority reached (3/5)
  └─ ✅ Unlock Group 2

Group 2 (Initial L&C - S2)
  ├─ Status: Unlocked
  ├─ Members can now view/comment/decide
  └─ Waiting for majority...
```

### **Decision Aggregation (Strictest Wins)**
```
Group Members:
- Member 1: Approved
- Member 2: Approved  
- Member 3: Approved
- Member 4: Changes Requested
- Member 5: Pending

Result: Group = "Approved with Changes"
(Because ANY member requested changes)

If ANY member rejects → Group = "Rejected"
```

---

## 📝 **Usage Examples**

### **1. Create Review Cycle with Groups**
```python
POST /api/workflows/review-cycles/
{
  "asset": 123,
  "template_id": 1,
  "notes": "Q1 2026 Product Launch Review"
}

# Automatically creates 5 groups (S1-S5)
# Group 1 unlocked, Groups 2-5 locked
```

### **2. Track Proof View**
```python
POST /api/workflows/review-cycles/456/track_view/

Response:
{
  "message": "View tracked successfully",
  "socd_status": "open"
}
```

### **3. Make Decision**
```python
POST /api/workflows/review-cycles/456/member_decision/
{
  "decision": "approved",
  "feedback": "Looks good, approved!"
}

# If majority reached, next group unlocks automatically
```

### **4. Check Group Status**
```python
GET /api/workflows/review-cycles/456/group_status/

Response:
{
  "review_cycle_id": 456,
  "status": "in_progress",
  "groups": [
    {
      "group": {
        "id": 1,
        "name": "ProofManagers",
        "order": 1,
        "status": "completed",
        "group_decision": "approved",
        "socd_status": "decision_made"
      },
      "progress": {
        "total_members": 5,
        "decided": 5,
        "approved": 5,
        "rejected": 0,
        "changes_requested": 0,
        "progress_percentage": 100
      }
    },
    {
      "group": {
        "id": 2,
        "name": "Initial L&C",
        "order": 2,
        "status": "in_progress",
        "group_decision": "pending",
        "socd_status": "commented"
      },
      "progress": {
        "total_members": 4,
        "decided": 2,
        "approved": 1,
        "rejected": 0,
        "changes_requested": 1,
        "progress_percentage": 50
      }
    }
  ]
}
```

### **5. Check My Status**
```python
GET /api/workflows/review-cycles/456/my_status/

Response:
{
  "is_member": true,
  "member": {
    "id": 789,
    "user": {
      "id": 10,
      "username": "john.doe",
      "email": "john@example.com"
    },
    "socd_status": "commented",
    "decision": "pending",
    "feedback": "",
    "sent_at": "2026-03-30T10:00:00Z",
    "opened_at": "2026-03-30T10:05:00Z",
    "commented_at": "2026-03-30T10:15:00Z",
    "decision_made_at": null
  },
  "group": {
    "id": 2,
    "name": "Initial L&C",
    "order": 2,
    "status": "in_progress",
    "socd_status": "commented"
  },
  "can_decide": true
}
```

---

## 🎨 **Frontend Requirements (Phase 2)**

### **Components to Build:**

1. **WorkflowDashboard.jsx**
   - List all active review cycles
   - Show current stage/group
   - SOCD status badges
   - Filter by role

2. **ProofReview.jsx**
   - PDF viewer integration
   - SOCD status header (S → O → C → D)
   - Decision buttons (Approve, Request Changes, Reject)
   - Feedback textarea
   - Lock indicators

3. **GroupStatusSidebar.jsx**
   - List all 5 stages
   - Show locked/unlocked status
   - Display group SOCD
   - Member list with individual SOCD
   - Progress bars

4. **WorkflowBuilder.jsx** (Admin)
   - Create workflow templates
   - Define 5 stages
   - Assign users to groups by role
   - Set group size (3-5 members)

---

## 🔐 **Role-Based Access Control**

### **Permissions Matrix:**

| Role | S1 (ProofManagers) | S2-S5 (L&C, Group, Compliance, FEB) | Create Proof | View All |
|------|-------------------|-------------------------------------|--------------|----------|
| Admin | ✅ View | ✅ View | ✅ | ✅ |
| Owner | ❌ | ❌ | ✅ | ✅ Own |
| Manager | ✅ Participate | ❌ | ❌ | ✅ Assigned |
| Lite User | ❌ | ✅ Participate | ❌ | ✅ Assigned |

---

## 🧪 **Testing Checklist**

### **Backend Tests (Completed):**
- ✅ Models created and migrated
- ✅ Service methods implemented
- ✅ API endpoints functional
- ✅ Admin panel accessible

### **Integration Tests (Pending):**
- ⏳ Create review cycle with 5 groups
- ⏳ Test majority approval unlocking
- ⏳ Test strictest decision aggregation
- ⏳ Test SOCD progression (individual + group)
- ⏳ Test role-based access restrictions
- ⏳ Test locked group access prevention
- ⏳ Test notification triggers

---

## 📊 **Database Schema**

```
ReviewCycle
├── ApprovalGroup (order=1, S1)
│   ├── GroupMember (user=manager1)
│   ├── GroupMember (user=manager2)
│   └── GroupMember (user=manager3)
├── ApprovalGroup (order=2, S2)
│   ├── GroupMember (user=lite1)
│   ├── GroupMember (user=lite2)
│   └── GroupMember (user=lite3)
├── ApprovalGroup (order=3, S3)
├── ApprovalGroup (order=4, S4)
└── ApprovalGroup (order=5, S5)
```

---

## 🚀 **Next Steps**

### **Immediate (Week 2):**
1. Build WorkflowDashboard component
2. Build ProofReview page with SOCD
3. Build GroupStatusSidebar
4. Integrate with existing FileViewer

### **Short-term (Week 3):**
1. Build WorkflowBuilder (Admin)
2. Add notification integration
3. End-to-end testing
4. Bug fixes and polish

---

## 📁 **Files Modified/Created**

### **Backend Files:**
- ✅ `apps/accounts/models.py` - Added role field
- ✅ `apps/workflows/models.py` - Added ApprovalGroup, GroupMember
- ✅ `apps/workflows/services.py` - Created WorkflowService (NEW)
- ✅ `apps/workflows/serializers.py` - Added new serializers
- ✅ `apps/workflows/views.py` - Added SOCD endpoints
- ✅ `apps/workflows/admin.py` - Registered new models
- ✅ `apps/accounts/migrations/0003_userprofile_role.py` - Migration
- ✅ `apps/workflows/migrations/0002_alter_reviewcycle_status_approvalgroup_groupmember.py` - Migration

### **Frontend Files (Pending):**
- ⏳ `frontend/src/pages/WorkflowDashboard.jsx`
- ⏳ `frontend/src/pages/ProofReview.jsx`
- ⏳ `frontend/src/components/GroupStatusSidebar.jsx`
- ⏳ `frontend/src/components/SOCDStatusIndicator.jsx`
- ⏳ `frontend/src/pages/WorkflowBuilder.jsx`

---

## ✅ **Success Criteria Met (Phase 1)**

- ✅ Role-based user model implemented
- ✅ ApprovalGroup model with SOCD tracking
- ✅ GroupMember model with individual SOCD
- ✅ Majority approval unlocking logic
- ✅ Strictest decision aggregation
- ✅ Sequential group unlocking
- ✅ Comprehensive API endpoints
- ✅ Database migrations applied
- ✅ Admin panel configured

---

**Phase 1 Status:** ✅ **COMPLETE**  
**Overall Progress:** 40% (Backend complete, Frontend pending)  
**Ready for:** Frontend development and UI implementation
