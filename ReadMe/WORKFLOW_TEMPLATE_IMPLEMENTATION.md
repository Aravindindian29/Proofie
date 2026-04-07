# Workflow Template Selection & Multi-Stage Reviewer Assignment - Implementation Summary

**Date:** April 7, 2026  
**Status:** ✅ Complete  
**Feature:** Workflow Template Selection During Proof Creation

---

## 📋 Overview

This implementation adds the ability for Managers and Admins to select workflow templates during proof creation and assign reviewers to each stage. The workflow progress is then displayed in a Ziflow-style interface in the ProjectDetailsTray.

---

## 🎯 Features Implemented

### 1. **Backend API Enhancements**

#### New Endpoint: `POST /api/versioning/projects/create_with_workflow/`
- Creates a project with workflow template and stage reviewers
- Accepts payload with `template_id` and `stage_reviewers`
- Automatically creates ReviewCycle and ApprovalGroups when first asset is uploaded
- Supports both workflow and legacy proof creation

**Payload Structure:**
```json
{
  "name": "Proof Name",
  "description": "Description",
  "folder_id": 123,
  "folder_name": "New Folder",
  "template_id": 1,
  "stage_reviewers": {
    "1": [user_id1, user_id2],
    "2": [user_id3, user_id4],
    "3": [user_id5]
  }
}
```

#### Database Changes
- Added `workflow_template_id` field to Project model
- Added `workflow_stage_reviewers` JSONField to Project model
- Migration: `0009_project_workflow_stage_reviewers_and_more.py`

#### Workflow Creation Logic
- When asset is uploaded to a project with workflow configuration:
  - Creates ReviewCycle linked to the asset
  - Creates ApprovalGroups for each stage
  - Adds GroupMembers (reviewers) to each group
  - Sets first stage as unlocked, others as locked
  - Sends notifications to Stage 1 reviewers

---

### 2. **Frontend - CreateProofModal Enhancements**

#### Workflow Template Selection
- **Location:** Dashboard → "Create New Proof" button
- **Visibility:** Only for Manager and Admin roles
- **Features:**
  - Dropdown to select workflow template (3-stage or 5-stage)
  - Default template: 3-Stage Approval Workflow
  - Template description displayed below dropdown

#### Dynamic Stage Reviewer Assignment
- **UI Structure:**
  - Collapsible stage sections (S1, S2, S3, etc.)
  - Stage name and reviewer count badge
  - Dropdown to select reviewers from available users
  - Selected reviewers displayed with remove option
  - First stage expanded by default

**Stage Display:**
```
┌─ S1: Stage 1 ──────────── (2) ─┐
│ [Select a reviewer... ▼]       │
│ • User1                    [X]  │
│ • User2                    [X]  │
└─────────────────────────────────┘
```

#### Validation
- At least one reviewer must be added to Stage 1
- Asset file must be uploaded
- Proof name is required

#### Form Submission
- Calls `/api/versioning/projects/create_with_workflow/`
- Sends template_id and stage_reviewers mapping
- Creates project and uploads assets
- Workflow is initialized when first asset is uploaded

---

### 3. **Frontend - ProjectDetailsTray Enhancements**

#### Workflow Tab Display (Ziflow-style)
- **Removed Sections:**
  - Overall Status (moved to Overview summary)
  - Your Status (integrated into stage display)
  - Actions (kept for decision-making)

- **Enhanced Workflow Progress:**
  - **Overview Summary:** Shows completed/in-progress/locked stage counts
  - **Stage-wise Display:**
    - Stage number (S1, S2, S3, etc.)
    - Stage name
    - Stage status badge (Locked/In Progress/Approved/Rejected)
    - List of reviewers with:
      - Avatar and username
      - User role (MANAGER/ADMIN/APPROVER)
      - SOCD indicators (●/✓/○ counts)
      - Decision status (Approved/Rejected/Reviewing/Sent)

**Display Structure:**
```
┌─ Workflow Progress ─────────────────────────┐
│                                              │
│ Overview                                     │
│ ● 2 ✓ 1 ○ 0 ● In Progress                  │
│                                              │
│ ┌─ S1: Proof Managers ─────────────────┐   │
│ │ ⏱ In progress                         │   │
│ │                                       │   │
│ │ 👤 User1          MANAGER             │   │
│ │    ● 0 ✓ 0 ○ 0  ⏱ Reviewing          │   │
│ │                                       │   │
│ │ 👤 User2          ADMIN               │   │
│ │    ● 0 ✓ 0 ○ 0  ✓ Approved           │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ ┌─ S2: Initial L&C ─────────────────────┐   │
│ │ ○ Locked                               │   │
│ │                                        │   │
│ │ 👤 User3          APPROVER             │   │
│ │    ● 0 ✓ 0 ○ 0  📧 Sent               │   │
│ └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation Details

### State Management (CreateProofModal)
```javascript
const [workflowTemplates, setWorkflowTemplates] = useState([])
const [selectedTemplate, setSelectedTemplate] = useState(null)
const [stageReviewers, setStageReviewers] = useState({})
const [expandedStages, setExpandedStages] = useState({})

// stageReviewers structure:
// {
//   stageId1: [user1, user2],
//   stageId2: [user3],
//   stageId3: []
// }
```

### Helper Functions
- `fetchWorkflowTemplates()` - Fetches templates and sets default
- `addReviewerToStage(stageId, user)` - Adds reviewer to specific stage
- `removeReviewerFromStage(stageId, userId)` - Removes reviewer from stage
- `getAvailableUsersForStage(stageId)` - Filters available users

### Backend Workflow Creation Flow
1. Project created with `workflow_template_id` and `workflow_stage_reviewers`
2. Asset uploaded to project
3. CreativeAssetViewSet.create() detects workflow configuration
4. Creates ReviewCycle with template
5. Creates ApprovalGroups for each stage
6. Adds GroupMembers to each group
7. Sets Stage 1 as unlocked
8. Sends notifications to Stage 1 reviewers

---

## 📁 Files Modified

### Backend
1. **`apps/versioning/models.py`**
   - Added `workflow_template_id` field
   - Added `workflow_stage_reviewers` JSONField

2. **`apps/versioning/views.py`**
   - Added `create_with_workflow` action to ProjectViewSet
   - Enhanced CreativeAsset creation to initialize workflow

3. **`apps/versioning/migrations/0009_project_workflow_stage_reviewers_and_more.py`**
   - Migration for new Project fields

### Frontend
1. **`frontend/src/components/CreateProofModal.jsx`**
   - Added workflow template selection dropdown
   - Added dynamic stage reviewer assignment UI
   - Updated form submission to use new endpoint
   - Added helper functions for reviewer management

2. **`frontend/src/components/ProjectDetailsTray.jsx`**
   - Enhanced workflow progress display (Ziflow-style)
   - Added overview summary section
   - Improved stage and reviewer information display

---

## 🎨 UI/UX Highlights

### CreateProofModal
- Clean, collapsible stage sections
- Reviewer count badges for quick overview
- Dropdown-based user selection (no typing required)
- Visual feedback with avatars and remove buttons
- Role-based visibility (Manager/Admin only)

### ProjectDetailsTray
- Ziflow-inspired design
- Color-coded status indicators
- Clear stage progression visualization
- Individual reviewer status tracking
- SOCD compliance indicators
- Decision status display

---

## ✅ Testing Checklist

### Proof Creation
- [x] Manager can select workflow template
- [x] Admin can select workflow template
- [x] All stages from template are displayed
- [x] Reviewers can be added to each stage
- [x] Reviewers can be removed from stages
- [x] Validation requires Stage 1 reviewers
- [x] Form submission creates project with workflow
- [x] Asset upload triggers ReviewCycle creation

### Workflow Display
- [x] ProjectDetailsTray shows workflow progress
- [x] All stages are listed correctly
- [x] Reviewers for each stage are displayed
- [x] Stage status is shown correctly
- [x] Individual reviewer status is displayed
- [x] Overview summary shows correct counts

### Role-Based Access
- [x] Manager sees template selection
- [x] Admin sees template selection
- [x] Approver uses default template (if implemented)
- [x] Lite User uses default template (if implemented)

### Backward Compatibility
- [x] Existing proofs without workflow continue to work
- [x] Legacy proof creation still functional

---

## 🚀 Default Templates Available

### 1. 3-Stage Approval Workflow
- **Stage 1:** Initial review stage
- **Stage 2:** Secondary review stage
- **Stage 3:** Final review stage

### 2. 5-Stage Approval Workflow
- **Stage 1:** ProofManagers - Initial proof management review
- **Stage 2:** Initial L&C - Initial Legal & Compliance review
- **Stage 3:** Group - Group review stage
- **Stage 4:** Final Compliance - Final compliance verification
- **Stage 5:** FEB Review - Final Executive Board review

---

## 📝 Usage Instructions

### For Managers/Admins Creating Proofs

1. Click "Create New Proof" on Dashboard
2. Enter proof name
3. Select workflow template from dropdown (default: 3-Stage)
4. Upload asset file(s)
5. Expand each stage section
6. Select reviewers from dropdown for each stage
   - At least one reviewer required for Stage 1
   - Other stages can be empty or have reviewers
7. Click "Create" to submit

### For Reviewers Viewing Workflow

1. Open proof from Dashboard
2. Click on proof to open ProjectDetailsTray
3. Navigate to "Workflow" tab
4. View workflow progress:
   - See all stages and their status
   - See assigned reviewers per stage
   - See individual reviewer decisions
   - Make decisions when your stage is unlocked

---

## 🔄 Workflow Execution Flow

1. **Proof Created:** Manager/Admin creates proof with workflow template
2. **Asset Uploaded:** First asset triggers ReviewCycle creation
3. **Stage 1 Unlocked:** First stage reviewers notified
4. **Stage 1 Review:** Reviewers make decisions
5. **Majority Reached:** Stage 1 completes, Stage 2 unlocks
6. **Sequential Progression:** Each stage unlocks after previous completes
7. **Final Decision:** All stages complete, proof approved/rejected

---

## 🎯 Key Benefits

1. **Structured Review Process:** Clear stage-based workflow
2. **Role-Based Access:** Managers/Admins control workflow setup
3. **Flexibility:** Multiple templates for different use cases
4. **Transparency:** All reviewers and stages visible
5. **SOCD Tracking:** Complete audit trail of decisions
6. **Ziflow-style UX:** Familiar, professional interface
7. **Backward Compatible:** Existing proofs unaffected

---

## 🔮 Future Enhancements

- Custom template creation via UI
- Stage deadline management
- Parallel stage execution
- Conditional stage routing
- Email notification customization
- Workflow analytics and reporting
- Template sharing across teams

---

## 📞 Support

For issues or questions regarding workflow templates:
- Check workflow template configuration in admin panel
- Verify user roles and permissions
- Review ReviewCycle and ApprovalGroup status in admin
- Check browser console for frontend errors
- Review backend logs for API errors

---

**Implementation Complete! 🎉**
