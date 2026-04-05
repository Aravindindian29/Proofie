# Manual line-by-line replacement for trackView function
with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the trackView function and replace it
new_lines = []
i = 0
while i < len(lines):
    if i < len(lines) and 'const trackView = async () => {' in lines[i]:
        # Keep the function declaration
        new_lines.append(lines[i])
        i += 1
        
        # Skip old try block opening
        while i < len(lines) and 'try {' in lines[i]:
            i += 1
            break
        
        # Add new try block with updated code
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
        
        # Skip old function body until we find the catch block
        while i < len(lines) and 'catch (error)' not in lines[i]:
            i += 1
        
        # Add catch block
        new_lines.append('    } catch (error) {\n')
        new_lines.append('      console.error(\'❌ Failed to track view:\', error)\n')
        new_lines.append('      console.error(\'Error details:\', error.response?.data)\n')
        i += 1
        
        # Skip old catch body until closing brace
        while i < len(lines) and lines[i].strip() != '}':
            i += 1
        
        # Add closing braces
        new_lines.append('    }\n')
        i += 1
        if i < len(lines) and lines[i].strip() == '}':
            new_lines.append('  }\n')
            i += 1
    else:
        new_lines.append(lines[i])
        i += 1

# Write back
with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('trackView function updated!')
