# 🔍 PDF Not Rendering - Debug Guide

## Issue
PDF uploads successfully and shows thumbnail, but doesn't render in the FileViewer for you (works for coworker).

## Quick Debug Steps

### 1. Check Browser Console
Open the FileViewer page and check the console for:
- What does `asset.current_version` contain?
- What is the `file_url` value?
- Are there any CORS errors?
- Are there any 404 errors for the PDF file?

### 2. Check Network Tab
1. Open Developer Tools → Network tab
2. Reload the FileViewer page
3. Look for the PDF file request
4. Check:
   - Is the request being made?
   - What's the status code? (200 = success, 404 = not found)
   - What's the full URL being requested?

### 3. Test Direct URL Access
1. Copy the PDF URL from the console (should be like: `http://localhost:8000/api/versioning/media/assets/2026/03/29/filename.pdf`)
2. Paste it directly in a new browser tab
3. Does the PDF open?

### 4. Check Backend Logs
Look at your Django console for:
- Any errors when serving the PDF
- The file path being accessed
- Whether the file exists

## Common Issues & Fixes

### Issue 1: File URL is null or undefined
**Symptom**: Console shows `file_url: null` or `file_url: undefined`

**Fix**: The asset doesn't have a current_version. Check:
```javascript
// In browser console on FileViewer page:
console.log('Asset:', asset)
console.log('Current Version:', asset.current_version)
console.log('File URL:', asset.current_version?.file_url)
```

### Issue 2: 404 Not Found
**Symptom**: Network tab shows 404 error for PDF

**Fix**: File doesn't exist at the path. Check:
1. Is the file actually in the media directory?
2. Is the path correct in the database?

### Issue 3: CORS Error
**Symptom**: Console shows CORS policy error

**Fix**: Backend CORS settings issue (unlikely since it works for coworker)

### Issue 4: Chrome PDF Viewer Disabled
**Symptom**: PDF doesn't render but "Open in New Tab" works

**Fix**: 
1. Go to `chrome://settings/content/pdfDocuments`
2. Enable "Open PDFs in Chrome"

### Issue 5: Browser Cache
**Symptom**: Old/stale data showing

**Fix**: Hard refresh (Ctrl+Shift+R) or clear browser cache

## Manual Test

Run this in browser console on the FileViewer page:

```javascript
// Check asset data
console.log('=== ASSET DEBUG ===')
console.log('Asset:', asset)
console.log('File Type:', asset?.file_type)
console.log('Current Version:', asset?.current_version)
console.log('File URL:', asset?.current_version?.file_url)

// Test if URL is accessible
if (asset?.current_version?.file_url) {
  const testUrl = asset.current_version.file_url
  console.log('Testing URL:', testUrl)
  
  fetch(testUrl)
    .then(response => {
      console.log('✅ URL is accessible')
      console.log('Status:', response.status)
      console.log('Content-Type:', response.headers.get('content-type'))
    })
    .catch(error => {
      console.error('❌ URL not accessible:', error)
    })
}
```

## What to Share

If the issue persists, share:
1. Browser console output (especially the asset object)
2. Network tab screenshot showing the PDF request
3. Django console output when loading the page
4. Result of the manual test above
