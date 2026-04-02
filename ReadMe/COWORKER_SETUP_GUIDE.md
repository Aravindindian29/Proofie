# 🚀 Coworker Setup Guide - PDF Thumbnails Not Showing

## Issue
PDF thumbnails not appearing on `/proofs` page - showing generic document icon instead.

## Root Cause
Missing Python dependency: **PyMuPDF** (required for PDF thumbnail generation)

---

## ✅ Solution - Install Dependencies

### Step 1: Activate Virtual Environment
```powershell
cd d:\Hackathon\Proofie\Proofie
.\venv\Scripts\Activate.ps1
```

### Step 2: Install/Update Requirements
```powershell
pip install -r requirements.txt
```

This will install:
- `PyMuPDF>=1.23.0` (for PDF thumbnails)
- `Pillow>=10.2` (for image processing)
- All other dependencies

### Step 3: Generate Thumbnails for Existing PDFs
```powershell
python manage.py fix_thumbnails
```

This command will:
- Find all PDFs without thumbnails
- Generate thumbnails for them
- Save them to the database

### Step 4: Restart Backend Server
```powershell
# Stop current server (Ctrl+C)
python manage.py runserver
```

### Step 5: Refresh Browser
- Press `Ctrl + Shift + F5` (hard refresh)
- Or clear cache and refresh

---

## 🧪 Test Thumbnail Generation

### Create a test script to verify PyMuPDF is working:
```python
# test_pymupdf.py
try:
    import fitz  # PyMuPDF
    print("✅ PyMuPDF installed successfully!")
    print(f"Version: {fitz.version}")
except ImportError:
    print("❌ PyMuPDF not installed")
    print("Run: pip install PyMuPDF")
```

Run it:
```powershell
python test_pymupdf.py
```

---

## 📋 Complete Setup Checklist

- [ ] Activate virtual environment
- [ ] Run `pip install -r requirements.txt`
- [ ] Verify PyMuPDF installed: `python test_pymupdf.py`
- [ ] Run `python manage.py fix_thumbnails`
- [ ] Restart backend server
- [ ] Hard refresh browser (Ctrl+Shift+F5)
- [ ] Check `/proofs` page - thumbnails should appear

---

## 🐛 Troubleshooting

### If thumbnails still don't show:

**1. Check if PyMuPDF is installed:**
```powershell
pip list | Select-String "PyMuPDF"
```
Should show: `PyMuPDF  1.23.x`

**2. Check backend logs for errors:**
Look for lines starting with `📄 PDF THUMBNAIL:` in the Django console

**3. Manually test thumbnail generation:**
```python
python manage.py shell

from apps.versioning.models import FileVersion
from apps.versioning.thumbnail_utils import generate_pdf_thumbnail

# Get a PDF version
version = FileVersion.objects.filter(asset__file_type='pdf').first()
if version:
    print(f"Testing: {version.file.path}")
    result = generate_pdf_thumbnail(version.file.path)
    if result:
        print("✅ Thumbnail generated successfully!")
    else:
        print("❌ Thumbnail generation failed")
```

**4. Check file permissions:**
- Ensure the `media/thumbnails/` directory exists
- Ensure Django has write permissions

**5. Check database:**
```python
python manage.py shell

from apps.versioning.models import FileVersion

# Check if thumbnails exist in DB
pdfs = FileVersion.objects.filter(asset__file_type='pdf')
print(f"Total PDFs: {pdfs.count()}")
print(f"With thumbnails: {pdfs.exclude(thumbnail='').count()}")
print(f"Without thumbnails: {pdfs.filter(thumbnail='').count()}")
```

---

## 🔧 Alternative: Install PyMuPDF Manually

If `requirements.txt` installation fails:

```powershell
pip install --upgrade pip
pip install PyMuPDF==1.23.26
pip install Pillow==10.2.0
```

---

## 📝 Notes

- **PyMuPDF** is the primary library for PDF thumbnail generation
- **pdf2image** is a fallback (requires Poppler, more complex setup)
- Thumbnails are generated automatically when uploading new PDFs
- Existing PDFs need `fix_thumbnails` command to generate thumbnails
- Thumbnails are stored in `media/thumbnails/YYYY/MM/DD/`

---

## ✅ Expected Result

After setup, the `/proofs` page should show:
- PDF thumbnails (preview of first page)
- Image thumbnails (resized preview)
- Video thumbnails (first frame)
- Generic icons only for unsupported file types

---

**If issues persist after following all steps, check the Django console for error messages starting with `📄 PDF THUMBNAIL ERROR:`**
