# Fix the template string backticks and add fetchAssetData logging
with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the missing backticks in trackView
content = content.replace(
    "      const response = await api.post(/workflows/review-cycles//track_view/)",
    "      const response = await api.post(/workflows/review-cycles//track_view/)"
)

# Add logging to fetchAssetData
content = content.replace(
    '      // Check if asset has an active review cycle\n      if (response.data?.review_cycles && response.data.review_cycles.length > 0) {\n        // Get the most recent review cycle\n        const activeReview = response.data.review_cycles[0]\n        setReviewCycleId(activeReview.id)',
    '      // Check if asset has an active review cycle\n      if (response.data?.review_cycles && response.data.review_cycles.length > 0) {\n        // Get the most recent review cycle\n        const activeReview = response.data.review_cycles[0]\n        console.log(\'📋 Active review cycle:\', activeReview)\n        console.log(\'📊 Review cycle status:\', activeReview.status)\n        setReviewCycleId(activeReview.id)'
)

with open(r'e:\Proofie\frontend\src\pages\FileViewer.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed backticks and added fetchAssetData logging!')
