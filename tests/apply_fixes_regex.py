import re

with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix trackView function using regex
old_pattern = r"  const trackView = async \(\) => \{\s+try \{\s+await api\.post\(/workflows/review-cycles/\$\{reviewCycleId\}/track_view/\)\s+console\.log\('View tracked successfully'\)\s+\} catch \(error\) \{\s+console\.error\('Failed to track view:', error\)\s+\}\s+\}"

new_trackview = '''  const trackView = async () => {
    try {
      const response = await api.post(/workflows/review-cycles/{reviewCycleId}/track_view/)
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

content = re.sub(old_pattern, new_trackview, content, flags=re.MULTILINE)

# Fix 3: Add logging to fetchAssetData
content = content.replace(
    '      // Check if asset has an active review cycle\n      if (response.data?.review_cycles && response.data.review_cycles.length > 0) {\n        // Get the most recent review cycle\n        const activeReview = response.data.review_cycles[0]\n        setReviewCycleId(activeReview.id)',
    '      // Check if asset has an active review cycle\n      if (response.data?.review_cycles && response.data.review_cycles.length > 0) {\n        // Get the most recent review cycle\n        const activeReview = response.data.review_cycles[0]\n        console.log(\'📋 Active review cycle:\', activeReview)\n        console.log(\'📊 Review cycle status:\', activeReview.status)\n        setReviewCycleId(activeReview.id)'
)

with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('All fixes applied successfully!')
