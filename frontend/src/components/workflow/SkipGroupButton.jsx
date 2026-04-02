import React, { useState } from 'react'
import { FastForward } from 'lucide-react'
import axios from 'axios'

const SkipGroupButton = ({ groupId, groupName, reviewCycleId, onSkipSuccess }) => {
  const [loading, setLoading] = useState(false)

  const handleSkip = async () => {
    const confirmed = window.confirm(
      `Skip approval for "${groupName}"?\n\nAll pending members will be marked as approved and the next group will be unlocked.`
    )

    if (!confirmed) return

    setLoading(true)
    try {
      const response = await axios.post(
        `http://localhost:8000/api/workflows/review-cycles/${reviewCycleId}/skip_group/`,
        { group_id: groupId },
        {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`
          }
        }
      )

      if (onSkipSuccess) {
        onSkipSuccess(response.data)
      }

      alert(`Group "${groupName}" skipped successfully`)
    } catch (error) {
      console.error('Failed to skip group:', error)
      alert(error.response?.data?.error || 'Failed to skip group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSkip}
      disabled={loading}
      className="
        flex-1 px-4 py-2
        bg-yellow-600 hover:bg-yellow-700
        text-white font-medium text-sm
        rounded-lg
        flex items-center justify-center gap-2
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      <FastForward size={16} />
      {loading ? 'Skipping...' : 'Skip Group'}
    </button>
  )
}

export default SkipGroupButton
