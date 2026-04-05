# Fix the backticks in line 93
with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix line 93 (index 92) - add backticks
lines[92] = '      const response = await api.post(/workflows/review-cycles/$' + '{reviewCycleId}/track_view/)\n'

with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Fixed backticks successfully!')
