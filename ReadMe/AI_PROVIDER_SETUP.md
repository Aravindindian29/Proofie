# 🤖 AI Provider Setup Guide

## Three AI Provider Options

ProofiePlus now supports **three AI providers**:

### 1. 🎭 Mock Provider (FREE - Recommended for Testing)
- **No API costs**
- **No API key required**
- Provides realistic demo responses
- Perfect for development and testing
- Instant responses (0.5-2 seconds)

**Setup:**
```bash
AI_PROVIDER=mock
```

### 2. 🤖 OpenAI (GPT-3.5-turbo / GPT-4)
- **Requires OpenAI API key**
- High-quality AI responses
- Costs: ~$0.01-0.05 per analysis
- Get API key: https://platform.openai.com/api-keys

**Setup:**
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

**Note:** If you get "quota exceeded" error, you need to add billing to your OpenAI account.

### 3. 🧠 Anthropic Claude (Claude 3.5 Sonnet)
- **Requires Anthropic API key**
- Excellent quality responses
- Costs: ~$0.015-0.075 per analysis
- Get API key: https://console.anthropic.com/

**Setup:**
```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-key-here
```

---

## Quick Start with Mock Provider (No API Costs!)

**1. Update your `.env` file:**
```bash
AI_PROVIDER=mock
```

**2. Restart backend server:**
```powershell
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

**3. Test ProofiePlus:**
- Open a PDF in the viewer
- Click "ProofiePlus AI" button
- Try "Summarize Document"
- Get instant demo responses!

---

## Switching Between Providers

Simply change `AI_PROVIDER` in your `.env` file and restart the backend:

```bash
# For testing (free)
AI_PROVIDER=mock

# For OpenAI
AI_PROVIDER=openai

# For Claude
AI_PROVIDER=anthropic
```

---

## Mock Provider Features

The Mock Provider provides realistic responses for:

✅ **Document Summarization**
- Title, type, and complexity analysis
- Key highlights (3-6 points)
- Section summaries
- Estimated review time
- Action items

✅ **Content Analysis**
- Language improvement suggestions
- Compliance issues (GDPR, legal)
- Formatting recommendations
- Severity scoring (high/medium/low)

✅ **Diff Analysis**
- Change detection (modified/added/deleted)
- Section-level changes
- Severity scoring
- Summary of changes

✅ **Test Case Generation**
- Functional test cases
- Regression tests
- Step-by-step instructions
- Expected results

---

## Cost Comparison

| Provider | Cost per Analysis | Quality | Speed |
|----------|------------------|---------|-------|
| **Mock** | $0 (FREE) | Demo | Instant |
| **OpenAI GPT-3.5** | ~$0.01 | Good | 3-10s |
| **OpenAI GPT-4** | ~$0.05 | Excellent | 5-15s |
| **Claude 3.5** | ~$0.015-0.075 | Excellent | 3-12s |

---

## Troubleshooting

### "OPENAI_API_KEY not configured"
**Solution:** Change to mock provider:
```bash
AI_PROVIDER=mock
```

### "You exceeded your current quota"
**Solution:** Either:
1. Use mock provider (free)
2. Add billing to OpenAI account
3. Switch to Anthropic Claude

### "ANTHROPIC_API_KEY not configured"
**Solution:** Get API key from https://console.anthropic.com/ or use mock provider

---

## Installation

If using Anthropic Claude, install the library:
```powershell
.\venv\Scripts\Activate.ps1
pip install anthropic
```

---

## Recommendation

**For Development/Testing:** Use `mock` provider (free, instant)  
**For Production:** Use `anthropic` (Claude) or `openai` (GPT-4)

---

**Current Status:** Mock provider is ready to use with zero setup! 🎉
