# Fix trackView function in FileViewer.jsx
with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    if i < len(lines) and 'const trackView = async () => {' in lines[i]:
        # Add the function declaration
        new_lines.append(lines[i])
        # Skip the old function body (7 lines)
        i += 1
        while i < len(lines) and '  }' not in lines[i]:
            i += 1
        i += 1  # Skip the closing brace
        
        # Insert new function body
        new_lines.append('    try {\n')
        new_lines.append('      const response = await api.post(/workflows/review-cycles//track_view/)\n')
        new_lines.append('      console.log(\'✅ View tracked successfully:\', response.data)\n')
        new_lines.append('      console.log(\'📊 Review cycle status updated to:\', response.data.review_cycle_status)\n')
        new_lines.append('      setViewTracked(true)\n')
        new_lines.append('      \n')
        new_lines.append('      // Refresh asset data to get updated review cycle status\n')
        new_lines.append('      setTimeout(() => {\n')
        new_lines.append('        fetchAssetData()\n')
        new_lines.append('      }, 500)\n')
        new_lines.append('    } catch (error) {\n')
        new_lines.append('      console.error(\'❌ Failed to track view:\', error)\n')
        new_lines.append('      console.error(\'Error details:\', error.response?.data)\n')
        new_lines.append('    }\n')
        new_lines.append('  }\n')
    else:
        new_lines.append(lines[i])
        i += 1

with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('trackView function updated successfully!')
