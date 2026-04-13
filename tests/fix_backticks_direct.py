# Fix backticks using direct character code
with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and fix the line with backticks
backtick = ''
for i, line in enumerate(lines):
    if 'const response = await api.post(/workflows/review-cycles/' in line:
        lines[i] = '      const response = await api.post(' + backtick + '/workflows/review-cycles//track_view/' + backtick + ')\n'
        print(f'Fixed line {i+1}: {lines[i]}')
        break

with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Backticks fixed successfully!')
