# 🎯 Workflow Approval Module - Ziflow-Based Implementation

**Date:** March 30, 2026  
**Status:** ✅ Backend Complete (Updated based on Ziflow screens)  
**Reference:** Ziflow UI screenshots provided

---

## 📸 **Key Observations from Ziflow Screens**

### **Screen 1: Proof List View**
- Table layout with columns: Name, Progress, Status, Decisions, Created, Owner
- Progress indicators show SOCD icons (S, O, C, D) with color coding
- Status badges: "In progress", "Approved"
- Decision count: "8 of 10", "3 of 3"

### **Screen 2: Workflow Panel (Expanded)**
- Vertical list of workflow stages
- Each stage shows:
  - Stage name (e.g., "Initial L&C", "Group", "Final Compliance")
  - Member avatars with role badges
  - Individual member status
  - Expandable/collapsible groups
- Color-coded status indicators

### **Screen 3: Workflow Tab**
- "Hide Workflow" toggle button
- Overview section with SOCD progress
- Stage breakdown with member details
- Real-time status updates

### **Screen 4: Detailed Workflow View**
- Shows all 5 stages vertically
- Member names with roles (OWNER, MANAGER)
- SOCD indicators per member
- Status per stage: "In progress", "Not started", "Decision pending", "Reviewing"

---

## 🔄 **Changes Made Based on Ziflow**

### **1. Role System Updated**

#### **Previous (Incorrect):**
- Admin, Owner, Manager, Lite User
- Role-to-stage restrictions (Manager→S1, Lite User→S2-S5)

#### **Current (Ziflow-Based):**
- ✅ **Admin** - Full system access
- ✅ **Manager** - Review, approve, skip groups, delete own proofs
- ✅ **Approver** - Review, comment, approve (any stage)
- ✅ **Lite User** - View only, no actions

### **2. Key Functional Changes**

#### **Approver Flexibility**
- ❌ Removed: Role-to-stage restrictions
- ✅ Added: Approvers can be assigned to ANY stage (S1-S5)
- ✅ Added: `can_user_participate()` method to check action permissions

#### **Manager Skip Functionality**
- ✅ Added: `skip_group()` service method
- ✅ Added: `POST /skip_group/` API endpoint
- ✅ Logic: Manager marks group as approved, unlocks next group
- ✅ Records: "Skipped by {username}" in member feedback

#### **Manager Delete Permission**
- ✅ Added: `created_by` field to ReviewCycle
- ✅ Added: `destroy()` method override in ViewSet
- ✅ Logic: Only creator manager or admin can delete

#### **Lite User View-Only**
- ✅ Added: `can_user_participate()` check in decision endpoint
- ✅ Lite users can view but cannot comment/approve
- ✅ Error message: "You do not have permission to make decisions"

---

## 🏗️ **Updated Architecture**

### **Database Models**

#### **UserProfile Roles**
```python
ROLE_CHOICES = [
    ('admin', 'Admin'),           # Full access
    ('manager', 'Manager'),       # Review + skip + delete own
    ('approver', 'Approver'),     # Review + approve (any stage)
    ('lite_user', 'Lite User'),   # View only
]
```

#### **ReviewCycle (Enhanced)**
```python
created_by = ForeignKey(User)  # NEW: Track creator for delete permission
initiated_by = ForeignKey(User)
status = CharField(choices=STATUS_CHOICES)
```

---

## 🔐 **Permission Matrix**

| Role | View | Comment | Approve | Skip Group | Delete Proof | All Stages |
|------|------|---------|---------|------------|--------------|------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ All | ✅ |
| **Manager** | ✅ | ✅ | ✅ | ✅ | ✅ Own | ✅ |
| **Approver** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ If member |
| **Lite User** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ If member |

---

## 🚀 **New API Endpoints**

### **1. Skip Group (Manager Only)**
```http
POST /api/workflows/review-cycles/{id}/skip_group/
Content-Type: application/json

{
  "group_id": 123
}

Response:
{
  "message": "Group 'Initial L&C' skipped successfully",
  "review_cycle": { ... }
}
```

**Behavior:**
- Marks group as completed with "approved" status
- Sets all pending members to approved
- Adds feedback: "Skipped by {username}"
- Unlocks next group automatically
- Only managers and admins can skip

---

### **2. Delete Review Cycle (Manager/Admin)**
```http
DELETE /api/workflows/review-cycles/{id}/

Response: 204 No Content
```

**Permissions:**
- ✅ Admin can delete any proof
- ✅ Manager can delete proofs they created
- ❌ Others cannot delete

---

### **3. Member Decision (Updated)**
```http
POST /api/workflows/review-cycles/{id}/member_decision/
Content-Type: application/json

{
  "decision": "approved",  // or "rejected", "changes_requested"
  "feedback": "Looks good!"
}
```

**New Checks:**
- ✅ Verifies user can participate (not Lite User)
- ✅ Checks group is unlocked
- ✅ Validates decision type
- ✅ Triggers majority check

---

## 📊 **Workflow Logic**

### **SOCD Progression**
```
Individual Member:
Sent → Open → Commented → Decision Made
  ↓      ↓         ↓            ↓
Created  View    Comment     Approve/Reject/Changes

Group Level:
Sent → Open → Commented → Decision Made
  ↓      ↓         ↓            ↓
All    First    First      Majority
Sent   View     Comment    Decided
```

### **Group Unlocking**
```
Group 1 (ProofManagers - S1)
  ├─ 5 members (mix of Managers, Approvers)
  ├─ 3 approve, 1 changes, 1 pending
  ├─ Majority reached (3/5)
  └─ ✅ Unlock Group 2

OR

Manager clicks "Skip Group"
  ├─ Group marked as approved
  ├─ All members auto-approved
  └─ ✅ Unlock Group 2 immediately
```

### **Overall Proof Status**
```
Based on all group decisions:
- ANY group rejected → Proof = "Rejected"
- ANY group approved with changes → Proof = "Approved with Changes"
- ALL groups approved → Proof = "Approved"
```

---

## 🎨 **Frontend UI Requirements (From Ziflow)**

### **1. Proof List Table**
```
Columns:
- Name (with thumbnail)
- Progress (SOCD icons: ⚪ S, 🟢 O, 🔵 C, ✅ D)
- Status (badge: In progress, Approved, Rejected)
- Decisions (e.g., "8 of 10")
- Created (date)
- Owner (avatar + name)
```

### **2. Workflow Panel (Sidebar)**
```
Header:
- "Workflow" tab
- "Hide Workflow" toggle

Body:
- Overview section (overall SOCD)
- Stage list (vertical):
  ├─ ProofManagers (S1)
  │   ├─ Status: In progress
  │   ├─ Members: 3
  │   └─ [Expand to see members]
  ├─ Initial L&C (S2)
  │   ├─ Status: Not started (locked)
  │   └─ Members: 4
  ├─ Group (S3)
  ├─ Final Compliance (S4)
  └─ FEB Review (S5)
```

### **3. Expanded Group View**
```
ProofManagers (In progress)
├─ Prateeksha Parthar (OWNER) - 🟢 O 🔵 C ⚪ D - Reviewing
├─ Santosh Bhandari (MANAGER) - ✅ S ✅ O ✅ C ✅ D - Approved
├─ Admin Ziflow (MANAGER) - 🟢 O 🔵 C ⚪ D - Reviewing
└─ [+ Add member button]

Actions (Manager only):
[Skip Group] button
```

### **4. SOCD Icons**
```
⚪ Sent - Gray circle
🟢 Open - Green circle
🔵 Commented - Blue circle
✅ Decision Made - Green checkmark
```

---

## 💻 **Implementation Status**

### **✅ Backend Complete**
- ✅ Role system updated (Admin, Manager, Approver, Lite User)
- ✅ Approver flexibility (any stage)
- ✅ Manager skip group functionality
- ✅ Manager delete own proofs
- ✅ Lite user view-only enforcement
- ✅ Permission checks in all endpoints
- ✅ Database migrations applied

### **⏳ Frontend Pending**
- ⏳ Proof list table with SOCD indicators
- ⏳ Workflow panel sidebar
- ⏳ Expandable group view
- ⏳ Skip group button (Manager only)
- ⏳ Delete proof button (Manager/Admin)
- ⏳ SOCD icon components
- ⏳ Status badges
- ⏳ Member avatars with roles

---

## 🧪 **Testing Scenarios**

### **1. Approver at Any Stage**
```
✅ Create workflow with Approver in S1
✅ Create workflow with Approver in S3
✅ Verify Approver can participate in assigned stage
✅ Verify Approver cannot participate in non-assigned stages
```

### **2. Manager Skip Group**
```
✅ Manager skips locked group → Error
✅ Manager skips unlocked group → Success
✅ Verify all members marked as approved
✅ Verify next group unlocked
✅ Verify feedback: "Skipped by {username}"
```

### **3. Manager Delete Proof**
```
✅ Manager deletes own proof → Success
✅ Manager deletes other's proof → Error
✅ Admin deletes any proof → Success
✅ Approver deletes proof → Error
```

### **4. Lite User Restrictions**
```
✅ Lite user views proof → Success
✅ Lite user tries to comment → Error
✅ Lite user tries to approve → Error
✅ Error message: "Lite users can only view"
```

---

## 📁 **Files Modified**

### **Backend:**
- ✅ `apps/accounts/models.py` - Updated roles
- ✅ `apps/workflows/models.py` - Added created_by field
- ✅ `apps/workflows/services.py` - Added skip_group, can_user_participate
- ✅ `apps/workflows/views.py` - Added skip_group, destroy endpoints
- ✅ Migrations: `0004_alter_userprofile_role`, `0003_reviewcycle_created_by`

### **Documentation:**
- ✅ `ReadMe/WORKFLOW_ZIFLOW_IMPLEMENTATION.md` - This file

---

## 🎯 **Next Steps: Frontend Development**

### **Week 1: Core Components**
1. **SOCDIndicator.jsx** - Reusable SOCD icon component
2. **WorkflowPanel.jsx** - Sidebar with stage list
3. **GroupCard.jsx** - Expandable group component
4. **ProofListTable.jsx** - Table with SOCD progress

### **Week 2: Manager Features**
1. **SkipGroupButton.jsx** - Manager skip functionality
2. **DeleteProofButton.jsx** - Manager/Admin delete
3. **RoleBadge.jsx** - Display user roles
4. **MemberAvatar.jsx** - Avatar with role indicator

### **Week 3: Integration**
1. Integrate with FileViewer
2. Real-time status updates
3. Notification integration
4. End-to-end testing

---

## ✅ **Success Criteria**

- ✅ Roles match Ziflow (Admin, Manager, Approver, Lite User)
- ✅ Approvers can be assigned to any stage
- ✅ Managers can skip groups
- ✅ Managers can delete own proofs
- ✅ Lite users are view-only
- ✅ SOCD tracking at individual + group level
- ✅ Majority approval unlocking
- ✅ Strictest decision aggregation
- ⏳ UI matches Ziflow design patterns

---

## 📊 **API Summary**

| Endpoint | Method | Role Required | Description |
|----------|--------|---------------|-------------|
| `/review-cycles/` | POST | Any | Create review cycle |
| `/review-cycles/{id}/` | GET | Any | Get review details |
| `/review-cycles/{id}/` | DELETE | Manager/Admin | Delete proof |
| `/review-cycles/{id}/track_view/` | POST | Any member | Track view (S→O) |
| `/review-cycles/{id}/member_decision/` | POST | Approver/Manager/Admin | Make decision |
| `/review-cycles/{id}/skip_group/` | POST | Manager/Admin | Skip group |
| `/review-cycles/{id}/group_status/` | GET | Any | Get all groups status |
| `/review-cycles/{id}/my_status/` | GET | Any | Get user's status |

---

**Implementation Status:** ✅ **Backend Complete**  
**Overall Progress:** 50% (Backend done, Frontend pending)  
**Ready for:** Frontend development matching Ziflow UI patterns
