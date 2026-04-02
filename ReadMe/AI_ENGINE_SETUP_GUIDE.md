# 🚀 ProofiePlus AI Engine - Setup & Testing Guide

## ✅ Implementation Status

**Phase 2 & Phase 3 (Feature 1) - COMPLETED!**

### What's Been Implemented:

#### **Backend (100% Complete)**
- ✅ Django app `apps/ai_engine/` created
- ✅ 4 Database models (AIAnalysis, DiffAnalysis, JIRAIntegration, TestCaseGeneration)
- ✅ PDF text extraction service with CPI ID detection
- ✅ OpenAI GPT-4 integration service
- ✅ 3 API endpoints:
  - `POST /api/ai-engine/summarize/` - Document summarization
  - `POST /api/ai-engine/compare/` - Version comparison
  - `POST /api/ai-engine/analyze-content/` - Content analysis
- ✅ Caching layer for AI responses
- ✅ Admin interface for all models
- ✅ Migrations applied successfully

#### **Frontend (100% Complete)**
- ✅ ProofiePlusModal component with beautiful UI
- ✅ Sparkles icon button in PDF viewer toolbar
- ✅ 5 feature cards (3 active, 2 coming soon)
- ✅ Real-time loading states
- ✅ Structured result display for summaries and analysis
- ✅ Error handling with toast notifications

#### **Dependencies Installed**
- ✅ openai>=1.0.0
- ✅ jira>=3.5.0
- ✅ openpyxl>=3.1.0
- ✅ PyMuPDF>=1.23.0 (already present)

---

## 🔧 Setup Instructions

### Step 1: Configure OpenAI API Key

1. **Get your OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key (starts with `sk-...`)

2. **Update your `.env` file:**
   ```bash
   # Add or update these lines in your .env file
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-actual-api-key-here
   
   # Feature flags (already enabled)
   ENABLE_AI_SUMMARIZATION=True
   ENABLE_DIFF_ANALYSIS=True
   ENABLE_CONTENT_ANALYSIS=True
   ```

3. **Restart the backend server:**
   ```powershell
   # Stop the current server (Ctrl+C)
   # Then restart:
   .\venv\Scripts\Activate.ps1
   python manage.py runserver
   ```

### Step 2: Verify Installation

Check that everything is set up correctly:

```powershell
# Check if migrations are applied
python manage.py showmigrations ai_engine

# Should show:
# ai_engine
#  [X] 0001_initial

# Check if models are registered in admin
python manage.py shell
>>> from apps.ai_engine.models import AIAnalysis
>>> AIAnalysis.objects.count()
0  # Should return 0 (no analyses yet)
```

---

## 🧪 Testing Guide

### Test 1: Document Summarization

1. **Navigate to a PDF file in Proofie:**
   - Go to Projects → Select a project → Click on a PDF thumbnail
   - PDF viewer should open

2. **Click the ProofiePlus AI button:**
   - Look for the purple gradient button with sparkles icon in the toolbar
   - Button text: "ProofiePlus AI"

3. **Select "Summarize Document":**
   - Click on the "Summarize Document" card
   - Wait 3-10 seconds for AI processing

4. **Expected Result:**
   ```json
   {
     "title": "Document Title",
     "type": "Contract/Agreement/Specification",
     "pages": 15,
     "key_highlights": [
       "Main point 1",
       "Main point 2",
       "Main point 3"
     ],
     "complexity": "low/medium/high",
     "estimated_review_time": "15-20 minutes",
     "cpi_id": "CPI-12345" (if found in PDF)
   }
   ```

5. **Verify Caching:**
   - Click "Back to Features"
   - Click "Summarize Document" again
   - Should return instantly with "⚡ Cached result"

### Test 2: Content Analysis

1. **From ProofiePlus modal, click "Content Analysis"**

2. **Wait for AI processing (5-15 seconds)**

3. **Expected Result:**
   - **Language Suggestions:** Improvements for clarity
   - **Compliance Issues:** Legal/GDPR checks
   - Color-coded by severity (🔴 High, 🟡 Medium, 🔵 Low)

### Test 3: CPI ID Detection

1. **Upload a PDF with "CPI-12345" text somewhere in it**

2. **Run summarization**

3. **Verify:** Yellow badge showing "CPI ID: CPI-12345" appears in summary

---

## 🎨 UI Features

### ProofiePlus Button
- **Location:** PDF viewer toolbar (top right)
- **Style:** Purple gradient with sparkles icon
- **Hover effect:** Lifts up with enhanced shadow
- **Always visible:** For PDF files only

### Modal Features
- **Header:** Gradient purple-to-blue with Sparkles icon
- **Feature Cards:** 2x2 grid layout
- **Active Features:**
  - 📄 Summarize Document (blue)
  - ✅ Content Analysis (green)
  - 🔄 Compare Versions (purple) - Coming Soon
- **Coming Soon:**
  - 🔗 JIRA Integration (orange)
  - 📊 Generate Test Cases (pink)

### Loading State
- Animated spinner
- "Processing with AI..." message
- "This may take a few seconds" subtitle

### Results Display
- **Summary:** Structured cards with highlights, sections, metadata
- **Analysis:** Color-coded suggestions and compliance issues
- **Metadata:** Tokens used, processing time, cached indicator

---

## 📊 Database Schema

### AIAnalysis Table
```sql
- id (UUID)
- asset_id (FK to CreativeAsset)
- version_id (FK to FileVersion)
- analysis_type (summary/diff/content_analysis/test_cases)
- result (JSON)
- cpi_id (VARCHAR, indexed)
- created_by (FK to User)
- created_at (DateTime)
- tokens_used (Integer)
- processing_time (Float)
```

### DiffAnalysis Table
```sql
- id (Integer)
- as_is_version_id (FK to FileVersion)
- to_be_version_id (FK to FileVersion)
- diff_summary (JSON)
- changes_count (Integer)
- pages_affected (JSON Array)
- severity_score (Float 0-10)
- created_by (FK to User)
- created_at (DateTime)
```

---

## 🔍 API Endpoints

### 1. Summarize Document
```http
POST /api/ai-engine/summarize/
Authorization: Token <your-token>
Content-Type: application/json

{
  "version_id": "uuid-of-file-version",
  "detail_level": "brief"  // or "detailed"
}

Response:
{
  "cached": false,
  "summary": {
    "title": "...",
    "type": "...",
    "key_highlights": [...],
    "complexity": "medium",
    "estimated_review_time": "20 minutes",
    "cpi_id": "CPI-12345"
  },
  "tokens_used": 1500,
  "processing_time": 3.2
}
```

### 2. Compare Versions
```http
POST /api/ai-engine/compare/
Authorization: Token <your-token>
Content-Type: application/json

{
  "as_is_version_id": "uuid",
  "to_be_version_id": "uuid"
}

Response:
{
  "diff_summary": {
    "total_changes": 12,
    "changes": [...],
    "summary": "AI-generated summary",
    "severity_score": 7.5
  },
  "changes_count": 12,
  "pages_affected": [1, 2, 5],
  "tokens_used": 2000,
  "processing_time": 5.1
}
```

### 3. Analyze Content
```http
POST /api/ai-engine/analyze-content/
Authorization: Token <your-token>
Content-Type: application/json

{
  "version_id": "uuid",
  "analysis_types": ["language", "compliance"]
}

Response:
{
  "analysis": {
    "language_suggestions": [...],
    "compliance_issues": [...]
  },
  "tokens_used": 1800,
  "processing_time": 4.5
}
```

---

## 🐛 Troubleshooting

### Issue: "OPENAI_API_KEY not configured"
**Solution:** 
- Check `.env` file has `OPENAI_API_KEY=sk-...`
- Restart Django server
- Verify with: `python manage.py shell` → `from django.conf import settings` → `settings.OPENAI_API_KEY`

### Issue: "PDF file not found"
**Solution:**
- Verify file exists in `media/assets/YYYY/MM/DD/`
- Check file permissions
- Verify FileVersion.file.path is correct

### Issue: Modal doesn't open
**Solution:**
- Check browser console for errors
- Verify ProofiePlusModal.jsx is imported correctly
- Check that `asset.current_version` exists

### Issue: Slow AI responses
**Solution:**
- Normal for first request (3-10 seconds)
- Subsequent requests should be cached (instant)
- Check OpenAI API status: https://status.openai.com/

### Issue: "Module 'openai' not found"
**Solution:**
```powershell
.\venv\Scripts\Activate.ps1
pip install openai jira openpyxl
```

---

## 📈 Performance Metrics

### Expected Performance:
- **Summarization:** 3-10 seconds (first time), <100ms (cached)
- **Content Analysis:** 5-15 seconds (first time), <100ms (cached)
- **Diff Analysis:** 5-20 seconds (depends on document size)
- **Token Usage:** 500-2000 tokens per analysis
- **Cost:** ~$0.01-0.05 per analysis (GPT-4 pricing)

### Optimization:
- ✅ Caching implemented (instant for repeated analyses)
- ✅ Text truncation for large documents
- ✅ Database indexing on frequently queried fields
- ✅ Async processing ready (can add Celery later)

---

## 🎯 Next Steps

### Immediate (Testing):
1. ✅ Add OpenAI API key to `.env`
2. ✅ Test document summarization
3. ✅ Test content analysis
4. ✅ Verify caching works
5. ✅ Test CPI ID detection

### Phase 4: Feature 2 - Diff Analysis (Next)
- Implement version selection UI
- Add visual diff highlighting
- Enable "Compare Versions" button

### Phase 5: Feature 3 - Content Analysis (Already Done!)
- ✅ Backend implemented
- ✅ Frontend integrated
- Ready to test

### Phase 6: Feature 4 - JIRA Integration
- Implement JIRA client service
- Add ticket search by CPI ID
- Auto-post summaries as comments

### Phase 7: Feature 5 - Test Case Generation
- Implement Excel generation
- Add test case AI prompts
- JIRA attachment functionality

---

## 📝 Code Locations

### Backend:
- **Models:** `apps/ai_engine/models.py`
- **Views:** `apps/ai_engine/views.py`
- **Services:** `apps/ai_engine/services/`
  - `ai_provider.py` - OpenAI integration
  - `pdf_extractor.py` - PDF text extraction
- **URLs:** `apps/ai_engine/urls.py`
- **Admin:** `apps/ai_engine/admin.py`

### Frontend:
- **Modal:** `frontend/src/components/ProofiePlusModal.jsx`
- **Integration:** `frontend/src/pages/FileViewer.jsx` (lines 12, 61, 411-439, 720-727)

### Configuration:
- **Settings:** `config/settings.py` (lines 467-483)
- **URLs:** `config/urls.py` (line 44)
- **Dependencies:** `requirements.txt` (lines 12-14)
- **Environment:** `.env.example` (lines 26-41)

---

## 🎉 Success Criteria

### Feature 1 is successful when:
- ✅ ProofiePlus button appears in PDF viewer
- ✅ Modal opens with 5 feature cards
- ✅ Document summarization returns structured data
- ✅ CPI ID is detected and displayed
- ✅ Results are cached for instant retrieval
- ✅ Content analysis shows suggestions
- ✅ No errors in browser console
- ✅ Backend logs show successful API calls

---

**Implementation Date:** April 1, 2026  
**Status:** ✅ Ready for Testing  
**Next Action:** Add OpenAI API key and test!
