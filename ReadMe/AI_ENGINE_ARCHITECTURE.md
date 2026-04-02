# 🤖 ProofiePlus AI Engine - Architecture & Implementation Plan

## 📋 Overview

**ProofiePlus** is the AI-powered assistant integrated into Proofie's PDF viewer that provides intelligent document analysis, comparison, and JIRA integration capabilities.

---

## 🎯 Features

1. **Document Summarization** - AI-powered PDF content summary
2. **Diff Analysis** - AS-IS vs TO-BE version comparison
3. **Content Analysis** - Language improvements & legal/compliance checks
4. **JIRA Integration** - Auto-comment on JIRA tickets using CPI ID
5. **Test Case Generation** - Generate test cases in Excel and attach to JIRA

---

## 🏗️ Architecture Design

### **Module Structure**

```
apps/
├── ai_engine/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py              # AI analysis results storage
│   ├── views.py               # API endpoints
│   ├── urls.py                # URL routing
│   ├── serializers.py         # DRF serializers
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_provider.py     # OpenAI/Anthropic integration
│   │   ├── pdf_extractor.py   # PDF text extraction
│   │   ├── diff_analyzer.py   # Version comparison logic
│   │   ├── content_analyzer.py # Language & compliance checks
│   │   ├── jira_client.py     # JIRA API integration
│   │   └── test_generator.py  # Test case generation
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── cpi_parser.py      # Extract CPI ID from PDF
│   │   ├── excel_generator.py # Excel file creation
│   │   └── cache_manager.py   # Caching for AI responses
│   └── migrations/
```

---

## 📊 Database Models

### **1. AIAnalysis Model**
Stores AI analysis results for caching and history

```python
class AIAnalysis(models.Model):
    ANALYSIS_TYPES = [
        ('summary', 'Document Summary'),
        ('diff', 'Version Diff'),
        ('content_analysis', 'Content Analysis'),
        ('test_cases', 'Test Cases'),
    ]
    
    asset = models.ForeignKey('versioning.CreativeAsset', on_delete=models.CASCADE)
    version = models.ForeignKey('versioning.FileVersion', on_delete=models.CASCADE)
    analysis_type = models.CharField(max_length=20, choices=ANALYSIS_TYPES)
    result = models.JSONField()  # Store AI response
    cpi_id = models.CharField(max_length=100, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    tokens_used = models.IntegerField(default=0)
    processing_time = models.FloatField(default=0.0)  # seconds
```

### **2. DiffAnalysis Model**
Stores comparison results between versions

```python
class DiffAnalysis(models.Model):
    as_is_version = models.ForeignKey('versioning.FileVersion', on_delete=models.CASCADE, related_name='as_is_diffs')
    to_be_version = models.ForeignKey('versioning.FileVersion', on_delete=models.CASCADE, related_name='to_be_diffs')
    diff_summary = models.JSONField()  # Structured diff data
    changes_count = models.IntegerField(default=0)
    pages_affected = models.JSONField(default=list)  # List of page numbers
    severity_score = models.FloatField(default=0.0)  # 0-10 scale
    created_at = models.DateTimeField(auto_now_add=True)
```

### **3. JIRAIntegration Model**
Tracks JIRA ticket interactions

```python
class JIRAIntegration(models.Model):
    asset = models.ForeignKey('versioning.CreativeAsset', on_delete=models.CASCADE)
    cpi_id = models.CharField(max_length=100, db_index=True)
    jira_ticket_key = models.CharField(max_length=50)  # e.g., PROJ-123
    jira_comment_id = models.CharField(max_length=100, blank=True)
    summary_posted = models.BooleanField(default=False)
    test_cases_attached = models.BooleanField(default=False)
    last_sync_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### **4. TestCaseGeneration Model**
Stores generated test cases

```python
class TestCaseGeneration(models.Model):
    diff_analysis = models.ForeignKey(DiffAnalysis, on_delete=models.CASCADE)
    test_cases = models.JSONField()  # Array of test case objects
    excel_file = models.FileField(upload_to='test_cases/%Y/%m/%d/', blank=True)
    jira_attachment_id = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 🔌 API Endpoints

### **Base URL:** `/api/ai-engine/`

#### **1. Document Summarization**
```
POST /api/ai-engine/summarize/
Request:
{
  "version_id": "uuid",
  "detail_level": "brief|detailed"  // optional
}

Response:
{
  "summary": {
    "title": "Document Title",
    "type": "Contract|Agreement|Specification",
    "pages": 15,
    "key_highlights": ["...", "..."],
    "sections": [
      {"name": "Introduction", "pages": "1-2", "summary": "..."}
    ],
    "complexity": "low|medium|high",
    "estimated_review_time": "30 minutes",
    "cpi_id": "CPI-12345"  // if found
  },
  "tokens_used": 1500,
  "processing_time": 3.2
}
```

#### **2. Diff Analysis**
```
POST /api/ai-engine/compare/
Request:
{
  "as_is_version_id": "uuid",
  "to_be_version_id": "uuid"
}

Response:
{
  "diff_summary": {
    "total_changes": 12,
    "pages_affected": [1, 2, 5],
    "severity_score": 7.5,
    "changes": [
      {
        "page": 2,
        "type": "text_modified|text_added|text_deleted",
        "section": "Legal Disclaimer",
        "old_text": "...",
        "new_text": "...",
        "severity": "high|medium|low",
        "coordinates": {"x": 100, "y": 200}
      }
    ],
    "summary": "AI-generated summary of changes"
  }
}
```

#### **3. Content Analysis**
```
POST /api/ai-engine/analyze-content/
Request:
{
  "version_id": "uuid",
  "analysis_types": ["language", "compliance", "formatting"]
}

Response:
{
  "language_suggestions": [
    {
      "page": 3,
      "severity": "low|medium|high",
      "current": "The party of the first part shall...",
      "suggested": "Company A shall...",
      "reason": "Simplify legal language"
    }
  ],
  "compliance_issues": [
    {
      "page": 7,
      "severity": "high",
      "issue": "Missing GDPR compliance clause",
      "suggested_action": "Add data protection clause per GDPR Article 13"
    }
  ],
  "formatting_recommendations": [...]
}
```

#### **4. JIRA Integration**
```
POST /api/ai-engine/jira/sync/
Request:
{
  "version_id": "uuid",
  "cpi_id": "CPI-12345",  // optional, will auto-detect if not provided
  "action": "post_summary|attach_test_cases"
}

Response:
{
  "success": true,
  "jira_ticket_key": "PROJ-123",
  "comment_id": "10001",
  "message": "Summary posted to JIRA ticket PROJ-123"
}
```

#### **5. Test Case Generation**
```
POST /api/ai-engine/generate-test-cases/
Request:
{
  "diff_analysis_id": "uuid",
  "include_regression": true,
  "attach_to_jira": true
}

Response:
{
  "test_cases": [
    {
      "test_case_id": "TC001",
      "title": "Verify updated legal disclaimer",
      "description": "...",
      "preconditions": "...",
      "steps": ["Step 1", "Step 2"],
      "expected_result": "...",
      "priority": "high|medium|low",
      "type": "functional|regression|smoke"
    }
  ],
  "excel_file_url": "/media/test_cases/2026/04/01/test_cases_123.xlsx",
  "jira_attachment_id": "10002"
}
```

---

## 🧠 AI Provider Integration

### **Service Layer: `ai_provider.py`**

```python
class AIProvider:
    """Abstract base class for AI providers"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    def summarize_text(self, text: str, detail_level: str) -> dict:
        raise NotImplementedError
    
    def analyze_diff(self, old_text: str, new_text: str) -> dict:
        raise NotImplementedError
    
    def analyze_content(self, text: str, analysis_types: list) -> dict:
        raise NotImplementedError
    
    def generate_test_cases(self, diff_data: dict) -> list:
        raise NotImplementedError


class OpenAIProvider(AIProvider):
    """OpenAI GPT-4 implementation"""
    
    def __init__(self, api_key: str):
        super().__init__(api_key)
        import openai
        self.client = openai.OpenAI(api_key=api_key)
    
    def summarize_text(self, text: str, detail_level: str) -> dict:
        # Implementation using GPT-4
        pass


class AnthropicProvider(AIProvider):
    """Anthropic Claude implementation"""
    
    def __init__(self, api_key: str):
        super().__init__(api_key)
        import anthropic
        self.client = anthropic.Anthropic(api_key=api_key)
    
    def summarize_text(self, text: str, detail_level: str) -> dict:
        # Implementation using Claude
        pass
```

---

## 📄 PDF Text Extraction

### **Service: `pdf_extractor.py`**

```python
import fitz  # PyMuPDF

class PDFExtractor:
    """Extract text and metadata from PDF files"""
    
    def extract_full_text(self, pdf_path: str) -> dict:
        """Extract all text with page numbers"""
        doc = fitz.open(pdf_path)
        pages = []
        
        for page_num, page in enumerate(doc, start=1):
            text = page.get_text()
            pages.append({
                'page_number': page_num,
                'text': text,
                'word_count': len(text.split())
            })
        
        return {
            'total_pages': len(doc),
            'pages': pages,
            'metadata': doc.metadata
        }
    
    def extract_text_with_coordinates(self, pdf_path: str) -> dict:
        """Extract text with bounding box coordinates"""
        # For diff highlighting
        pass
    
    def find_cpi_id(self, pdf_path: str) -> str:
        """Search for CPI ID pattern in PDF"""
        import re
        doc = fitz.open(pdf_path)
        
        # Pattern: CPI-XXXXX or CPI_XXXXX
        pattern = r'CPI[_-]\d{5,}'
        
        for page in doc:
            text = page.get_text()
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        
        return None
```

---

## 🔗 JIRA Integration

### **Service: `jira_client.py`**

```python
from jira import JIRA

class JIRAClient:
    """JIRA API integration"""
    
    def __init__(self, server: str, email: str, api_token: str):
        self.jira = JIRA(server=server, basic_auth=(email, api_token))
    
    def find_ticket_by_cpi(self, cpi_id: str) -> str:
        """Search for JIRA ticket by CPI ID"""
        jql = f'text ~ "{cpi_id}"'
        issues = self.jira.search_issues(jql, maxResults=1)
        
        if issues:
            return issues[0].key
        return None
    
    def post_comment(self, ticket_key: str, comment: str) -> str:
        """Post comment to JIRA ticket"""
        comment_obj = self.jira.add_comment(ticket_key, comment)
        return comment_obj.id
    
    def attach_file(self, ticket_key: str, file_path: str) -> str:
        """Attach file to JIRA ticket"""
        attachment = self.jira.add_attachment(ticket_key, file_path)
        return attachment.id
    
    def format_summary_comment(self, summary_data: dict) -> str:
        """Format AI summary as JIRA comment"""
        comment = f"""
h2. 📄 ProofiePlus AI Summary

*Document:* {summary_data['title']}
*Pages:* {summary_data['pages']}
*Complexity:* {summary_data['complexity']}
*Review Time:* {summary_data['estimated_review_time']}

h3. Key Highlights:
{self._format_list(summary_data['key_highlights'])}

h3. Sections:
{self._format_sections(summary_data['sections'])}

_Generated by ProofiePlus AI Engine_
        """
        return comment.strip()
```

---

## 📊 Test Case Generation

### **Service: `test_generator.py`**

```python
import openpyxl
from openpyxl.styles import Font, PatternFill

class TestCaseGenerator:
    """Generate test cases from diff analysis"""
    
    def generate_from_diff(self, diff_data: dict, ai_provider) -> list:
        """Generate test cases based on changes"""
        
        test_cases = []
        
        for change in diff_data['changes']:
            # Use AI to generate test case
            prompt = self._build_test_case_prompt(change)
            test_case = ai_provider.generate_test_case(prompt)
            test_cases.append(test_case)
        
        return test_cases
    
    def create_excel_file(self, test_cases: list, output_path: str) -> str:
        """Create Excel file with test cases"""
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Test Cases"
        
        # Headers
        headers = ['Test Case ID', 'Title', 'Description', 'Preconditions', 
                   'Steps', 'Expected Result', 'Priority', 'Type']
        
        # Style headers
        header_fill = PatternFill(start_color='366092', end_color='366092', fill_type='solid')
        header_font = Font(bold=True, color='FFFFFF')
        
        for col, header in enumerate(headers, start=1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.fill = header_fill
            cell.font = header_font
        
        # Add test cases
        for row, tc in enumerate(test_cases, start=2):
            ws.cell(row=row, column=1, value=tc['test_case_id'])
            ws.cell(row=row, column=2, value=tc['title'])
            ws.cell(row=row, column=3, value=tc['description'])
            ws.cell(row=row, column=4, value=tc['preconditions'])
            ws.cell(row=row, column=5, value='\n'.join(tc['steps']))
            ws.cell(row=row, column=6, value=tc['expected_result'])
            ws.cell(row=row, column=7, value=tc['priority'])
            ws.cell(row=row, column=8, value=tc['type'])
        
        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column = [cell for cell in column]
            for cell in column:
                if len(str(cell.value)) > max_length:
                    max_length = len(cell.value)
            adjusted_width = min(max_length + 2, 50)
            ws.column_dimensions[column[0].column_letter].width = adjusted_width
        
        wb.save(output_path)
        return output_path
```

---

## 🎨 Frontend Integration

### **Component: `ProofiePlusModal.jsx`**

```jsx
import React, { useState } from 'react';
import { Sparkles, FileText, GitCompare, CheckCircle, ExternalLink, FileSpreadsheet } from 'lucide-react';

const ProofiePlusModal = ({ versionId, assetId, onClose }) => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const features = [
    {
      id: 'summarize',
      title: 'Summarize Document',
      icon: FileText,
      description: 'Get AI-powered summary of document content',
      color: 'blue'
    },
    {
      id: 'compare',
      title: 'Compare Versions',
      icon: GitCompare,
      description: 'Analyze differences between AS-IS and TO-BE',
      color: 'purple'
    },
    {
      id: 'analyze',
      title: 'Content Analysis',
      icon: CheckCircle,
      description: 'Language improvements & compliance checks',
      color: 'green'
    },
    {
      id: 'jira',
      title: 'JIRA Integration',
      icon: ExternalLink,
      description: 'Post summary to JIRA ticket',
      color: 'orange'
    },
    {
      id: 'testcases',
      title: 'Generate Test Cases',
      icon: FileSpreadsheet,
      description: 'Create test cases and attach to JIRA',
      color: 'pink'
    }
  ];

  const handleFeatureClick = async (featureId) => {
    setActiveFeature(featureId);
    setLoading(true);
    
    try {
      // API call based on feature
      const response = await fetch(`/api/ai-engine/${featureId}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id: versionId })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">ProofiePlus AI</h2>
              <p className="text-purple-100">Intelligent Document Analysis</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="p-6 grid grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => handleFeatureClick(feature.id)}
                className={`p-4 rounded-lg border-2 hover:shadow-lg transition-all ${
                  activeFeature === feature.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
              >
                <Icon className={`w-8 h-8 text-${feature.color}-500 mb-2`} />
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </button>
            );
          })}
        </div>

        {/* Results Area */}
        {loading && (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Processing with AI...</p>
          </div>
        )}

        {result && (
          <div className="p-6 bg-gray-50 max-h-96 overflow-y-auto">
            {/* Render results based on feature type */}
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProofiePlusModal;
```

---

## ⚙️ Configuration

### **Environment Variables (.env)**

```bash
# AI Provider
AI_PROVIDER=openai  # or 'anthropic'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# JIRA Integration
JIRA_SERVER=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token

# Feature Flags
ENABLE_AI_SUMMARIZATION=true
ENABLE_DIFF_ANALYSIS=true
ENABLE_CONTENT_ANALYSIS=true
ENABLE_JIRA_INTEGRATION=true
ENABLE_TEST_GENERATION=true

# Caching
AI_CACHE_TTL=3600  # 1 hour
```

### **Settings Update**

```python
# config/settings.py

# AI Engine Configuration
AI_PROVIDER = config('AI_PROVIDER', default='openai')
OPENAI_API_KEY = config('OPENAI_API_KEY', default='')
ANTHROPIC_API_KEY = config('ANTHROPIC_API_KEY', default='')

# JIRA Configuration
JIRA_SERVER = config('JIRA_SERVER', default='')
JIRA_EMAIL = config('JIRA_EMAIL', default='')
JIRA_API_TOKEN = config('JIRA_API_TOKEN', default='')

# AI Feature Flags
AI_FEATURES = {
    'summarization': config('ENABLE_AI_SUMMARIZATION', default=True, cast=bool),
    'diff_analysis': config('ENABLE_DIFF_ANALYSIS', default=True, cast=bool),
    'content_analysis': config('ENABLE_CONTENT_ANALYSIS', default=True, cast=bool),
    'jira_integration': config('ENABLE_JIRA_INTEGRATION', default=True, cast=bool),
    'test_generation': config('ENABLE_TEST_GENERATION', default=True, cast=bool),
}
```

---

## 📦 Dependencies

### **Backend (requirements.txt)**

```
openai>=1.0.0
anthropic>=0.18.0
PyMuPDF>=1.23.0
jira>=3.5.0
openpyxl>=3.1.0
python-dotenv>=1.0.0
redis>=5.0.0  # for caching
celery>=5.3.0  # for async processing
```

### **Frontend (package.json)**

```json
{
  "dependencies": {
    "lucide-react": "^0.294.0",
    "react-hot-toast": "^2.4.1"
  }
}
```

---

## 🚀 Implementation Timeline

### **Phase 1: Infrastructure (Week 1)**
- ✅ Create `apps/ai_engine/` Django app
- ✅ Set up models and migrations
- ✅ Configure AI provider integration
- ✅ Set up JIRA client

### **Phase 2: Feature 1 - Summarization (Week 1-2)**
- ✅ PDF text extraction
- ✅ AI summarization endpoint
- ✅ Frontend modal UI
- ✅ CPI ID detection

### **Phase 3: Feature 2 - Diff Analysis (Week 2-3)**
- ✅ Text comparison algorithm
- ✅ AI-powered diff summary
- ✅ Visual diff display

### **Phase 4: Feature 3 - Content Analysis (Week 3)**
- ✅ Language analysis
- ✅ Compliance checking
- ✅ Suggestions UI

### **Phase 5: Feature 4 - JIRA Integration (Week 4)**
- ✅ JIRA API integration
- ✅ Auto-comment posting
- ✅ Ticket linking

### **Phase 6: Feature 5 - Test Case Generation (Week 4-5)**
- ✅ Test case generation logic
- ✅ Excel file creation
- ✅ JIRA attachment

### **Phase 7: Polish & Testing (Week 5)**
- ✅ Error handling
- ✅ Caching optimization
- ✅ UI/UX refinements
- ✅ End-to-end testing

---

## 🎯 Success Metrics

- **Response Time:** < 5 seconds for summarization
- **Accuracy:** > 90% for diff detection
- **JIRA Integration:** 100% success rate for ticket linking
- **User Adoption:** > 70% of users try ProofiePlus
- **Cost Efficiency:** < $0.10 per analysis

---

## 🔒 Security Considerations

1. **API Key Management:** Store in environment variables, never in code
2. **Rate Limiting:** Implement per-user rate limits
3. **Data Privacy:** Don't send sensitive data to AI providers
4. **JIRA Permissions:** Validate user has access to JIRA tickets
5. **File Access:** Verify user permissions before processing

---

## 📝 Next Steps

1. **Review & Approve Architecture**
2. **Set up development environment**
3. **Create Django app structure**
4. **Implement Feature 1 (Summarization)**
5. **Test & iterate**

---

**Document Version:** 1.0  
**Last Updated:** April 1, 2026  
**Status:** Awaiting Approval ✅
