# 🧪 Testing Workflow Approval System

## ✅ What's Been Implemented

### **1. Delete Proof Button** ✅
- **Location**: Top-right corner of each proof card on `/proofs` page
- **Visibility**: Only for managers/admins who own the proof
- **Icon**: Red trash icon
- **Action**: Deletes entire proof with all assets

### **2. Delete Asset Button** ✅
- **Location**: Next to each asset in ProjectDetailsTray (Dashboard view)
- **Visibility**: All users (can be restricted if needed)
- **Action**: Deletes individual asset

### **3. Comment Isolation** ✅
- **Fixed**: Comments now properly filtered by asset
- **Each asset has its own comment thread**

---

## 🚀 How to Test Workflow Features

### **Why You Don't See Workflow UI Yet**

The workflow panel, decision buttons, and SOCD tracking only appear when:
1. A proof has a **review cycle** created
2. You open the proof in **FileViewer** (not just the tray)

Currently, your proofs don't have review cycles attached.

---

## 📝 Steps to Create and Test Workflow

### **Step 1: Create a Workflow Template**

1. **Via Django Admin** (Easiest):
   ```
   http://localhost:8000/admin/
   ```
   - Login with superuser credentials
   - Go to **Workflows → Workflow Templates**
   - Click **Add Workflow Template**
   - Fill in:
     - Name: "Standard Approval"
     - Description: "3-stage approval process"
     - Is Active: ✓
   - Save

2. **Create Workflow Stages**:
   - Go to **Workflows → Workflow Stages**
   - Create 3 stages:
     - Stage 1: Order=1, Name="Initial Review"
     - Stage 2: Order=2, Name="Manager Review"
     - Stage 3: Order=3, Name="Final Approval"

### **Step 2: Create Review Cycle for a Proof**

**Option A: Via API (Postman/curl)**
```bash
POST http://localhost:8000/api/workflows/review-cycles/
Authorization: Token <your_token>
Content-Type: application/json

{
  "asset": <asset_id>,
  "template": <template_id>,
  "groups": [
    {
      "name": "Stage 1 - Reviewers",
      "order": 1,
      "members": [
        {"user_id": <murali_user_id>},
        {"user_id": <ganpat_user_id>}
      ]
    },
    {
      "name": "Stage 2 - Managers",
      "order": 2,
      "members": [
        {"user_id": <raj_user_id>}
      ]
    }
  ]
}
```

**Option B: Via Django Shell**
```python
python manage.py shell

from apps.versioning.models import CreativeAsset
from apps.workflows.models import ReviewCycle, ApprovalGroup, GroupMember
from django.contrib.auth.models import User

# Get asset
asset = CreativeAsset.objects.first()

# Get users
murali = User.objects.get(username='Murali')
ganpat = User.objects.get(username='Ganpat')
raj = User.objects.get(username='Raj')
saranya = User.objects.get(username='Saranya')

# Create review cycle
review = ReviewCycle.objects.create(
    asset=asset,
    initiated_by=saranya,
    created_by=saranya,
    status='in_progress'
)

# Create Group 1
group1 = ApprovalGroup.objects.create(
    review_cycle=review,
    name='Stage 1 - Reviewers',
    order=1,
    status='unlocked'
)
GroupMember.objects.create(group=group1, user=murali)
GroupMember.objects.create(group=group1, user=ganpat)

# Create Group 2 (locked)
group2 = ApprovalGroup.objects.create(
    review_cycle=review,
    name='Stage 2 - Managers',
    order=2,
    status='locked'
)
GroupMember.objects.create(group=group2, user=raj)

print(f"✅ Review cycle created: {review.id}")
```

### **Step 3: View Workflow UI**

1. **Refresh browser** (Ctrl+F5)
2. **Navigate to Proofs** page (`/proofs`)
3. **Click on the proof** that has a review cycle
4. **Click "Copy link"** button to open in FileViewer
5. **You should now see**:
   - "Show Workflow" button in header
   - "Make Decision" button (if you're a reviewer)
   - "Delete Proof" button (if you're the manager who created it)

### **Step 4: Test Workflow Features**

**As Approver (Murali or Ganpat):**
1. Open the proof
2. View is auto-tracked (S→O)
3. Add a comment (O→C)
4. Click "Make Decision" → Approve (C→D)
5. See SOCD status update in workflow panel

**As Manager (Raj or Saranya):**
1. Open the proof
2. Click "Show Workflow"
3. Expand Stage 1 group
4. Click "Edit Reviewers" to add/remove
5. Click "Skip Group" to bypass approval
6. Click "Delete Proof" to delete

---

## 🎯 Quick Test Checklist

### **Delete Proof Button**
- ✅ Refresh browser (Ctrl+F5)
- ✅ Go to `/proofs` page
- ✅ Look for red trash icon on top-right of proof cards
- ✅ Only visible on proofs you created (as manager)

### **Workflow UI**
- ⏳ Create review cycle (see Step 2 above)
- ⏳ Open proof in FileViewer
- ⏳ See "Show Workflow" button
- ⏳ Test SOCD tracking
- ⏳ Test decision making

---

## 🐛 Troubleshooting

### **Delete Button Not Showing**
1. Hard refresh: `Ctrl + Shift + F5`
2. Clear cache: `Ctrl + Shift + Delete`
3. Check console for errors: `F12` → Console tab
4. Verify you're logged in as manager
5. Verify you own the proof (created by you)

### **Workflow UI Not Showing**
1. Proof must have a review cycle
2. Must open in FileViewer (not just tray)
3. Check browser console for errors
4. Verify backend is running on port 8000
5. Check if `review_cycles` data is in API response

### **Comments Showing Across Assets**
- ✅ Already fixed
- Backend now filters by version ID
- Each asset has isolated comments

---

## 📞 Test Users

| Username | Password | Role | Use For |
|----------|----------|------|---------|
| Saranya | Chennai-1234 | Manager | Create proofs, manage workflow |
| Raj | Chennai-1234 | Manager | Approve, skip groups |
| Prateeksha | Chennai-1234 | Manager | Approve, skip groups |
| Murali | Chennai-1234 | Approver | Review and approve |
| Ganpat | Chennai-1234 | Approver | Review and approve |
| Poorna | Chennai-1234 | Lite User | View only |
| Ashok | Chennai-1234 | Lite User | View only |

---

## 🎉 Expected Results

After creating a review cycle and opening the proof:

**FileViewer Header:**
- "Show Workflow" button (blue)
- "Make Decision" button (green) - if you're a pending reviewer
- "Delete Proof" button (red) - if you're the manager who created it

**Workflow Panel (Right Side):**
- Overview section with status
- Expandable group cards (S1, S2, etc.)
- SOCD icons for each member
- "Edit Reviewers" button (blue) - for managers
- "Skip Group" button (yellow) - for managers

**Proofs Page:**
- Red trash icon on top-right of each proof card you created

---

**Next Step**: Create a review cycle using Django shell (Step 2, Option B) to see the workflow UI! 🚀
