with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = '  const trackView = async () => {\n    try {\n      await api.post(/workflows/review-cycles/$' + '{reviewCycleId}/track_view/)\n      console.log(\'View tracked successfully\')\n    } catch (error) {\n      console.error(\'Failed to track view:\', error)\n    }\n  }'

new_code = '  const trackView = async () => {\n    try {\n      const response = await api.post(/workflows/review-cycles/$' + '{reviewCycleId}/track_view/)\n      console.log(\'✅ View tracked successfully:\', response.data)\n      console.log(\'📊 Review cycle status updated to:\', response.data.review_cycle_status)\n      setViewTracked(true)\n      \n      // Refresh asset data to get updated review cycle status\n      setTimeout(() => {\n        fetchAssetData()\n      }, 500)\n    } catch (error) {\n      console.error(\'❌ Failed to track view:\', error)\n      console.error(\'Error details:\', error.response?.data)\n    }\n  }'

content = content.replace(old_code, new_code)

with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('trackView function updated successfully')
