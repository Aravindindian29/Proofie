# Final fix for backticks
with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the line without backticks with the correct version
content = content.replace(
    '      const response = await api.post(/workflows/review-cycles//track_view/)',
    '      const response = await api.post(/workflows/review-cycles//track_view/)'
)

with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Backticks fixed!')
