# Fix line 93 with proper backticks
with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Replace line 93 (index 92) with correct backticks
lines[92] = '      const response = await api.post(/workflows/review-cycles//track_view/)\n'

with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

# Verify the fix
with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    print('Line 93 after fix:', repr(lines[92]))
    print('Has backtick:', chr(96) in lines[92])
