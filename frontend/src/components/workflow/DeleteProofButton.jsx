import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'

const DeleteProofButton = ({ reviewCycleId, reviewCycle, currentUser }) => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { canDeleteProofInPreview } = useAuthStore()

  // Check if user can delete using permission system
  if (!canDeleteProofInPreview()) return null

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this proof?\n\nThis action cannot be undone and will delete all associated comments and workflow data.'
    )

    if (!confirmed) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        `http://localhost:8000/api/workflows/review-cycles/${reviewCycleId}/`,
        {
          headers: { Authorization: `Token ${token}` }
        }
      )

      toast.success('Proof deleted successfully')
      navigate('/projects')
    } catch (error) {
      console.error('Failed to delete proof:', error)
      // Check for 403 Forbidden error and show appropriate message
      if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action.\nPlease contact your administrator for assistance.', { id: 'delete-access-denied' })
      } else {
        toast.error(error.response?.data?.error || 'Failed to delete proof', { id: 'delete-proof-toast' })
      }
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="
        px-3 py-2
        bg-red-600 hover:bg-red-700
        text-white font-medium text-sm
        rounded-lg
        flex items-center gap-2
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
      "
      title="Delete Proof"
    >
      <Trash2 size={16} />
      {loading ? 'Deleting...' : 'Delete Proof'}
    </button>
  )
}

export default DeleteProofButton
