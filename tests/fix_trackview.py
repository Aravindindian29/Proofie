with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = '''  const trackView = async () => {
    try {
      await api.post(/workflows/review-cycles//track_view/)
      console.log('View tracked successfully')
    } catch (error) {
      console.error('Failed to track view:', error)
    }
  }'''

new_code = '''  const trackView = async () => {
    try {
      const response = await api.post(/workflows/review-cycles//track_view/)
      console.log('✅ View tracked successfully:', response.data)
      console.log('📊 Review cycle status updated to:', response.data.review_cycle_status)
      setViewTracked(true)
      
      // Refresh asset data to get updated review cycle status
      setTimeout(() => {
        fetchAssetData()
      }, 500)
    } catch (error) {
      console.error('❌ Failed to track view:', error)
      console.error('Error details:', error.response?.data)
    }
  }'''

content = content.replace(old_code, new_code)

with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('trackView function updated successfully')
