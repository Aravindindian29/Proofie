import React, { useState } from 'react'
import { X, Check, AlertCircle, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import SOCDIcon from './SOCDIcon'

const DecisionModal = ({ isOpen, onClose, reviewCycleId, myMember, onDecisionSuccess }) => {
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDecision = async (decision) => {
    // Validate feedback requirement for non-approval decisions
    if (!feedback.trim() && decision !== 'approved') {
      toast.error('Please provide feedback for your decision', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#1F2937',
          color: '#fff',
          border: '1px solid #EF4444'
        }
      })
      return
    }

    setLoading(true)
    try {
      console.log('Submitting decision:', { decision, feedback, reviewCycleId })
      
      const response = await api.post(
        `/workflows/review-cycles/${reviewCycleId}/member_decision/`,
        { 
          decision, 
          feedback: feedback.trim() 
        }
      )

      console.log('Decision submitted successfully:', response.data)
      
      // Show success toast based on decision type
      const successMessages = {
        approved: '✅ Proof approved successfully!',
        changes_requested: '⚠️ Changes requested successfully!',
        rejected: '❌ Proof rejected successfully!'
      }
      
      toast.success(successMessages[decision] || 'Decision submitted successfully!', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#1F2937',
          color: '#fff',
          border: decision === 'approved' ? '1px solid #10B981' :
                 decision === 'rejected' ? '1px solid #EF4444' :
                 '1px solid #F59E0B'
        }
      })
      
      if (onDecisionSuccess) {
        onDecisionSuccess(response.data)
      }
      setFeedback('')
      onClose()
    } catch (error) {
      console.error('Failed to submit decision:', error)
      console.error('Error response:', error.response?.data)
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to submit decision'
      
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#1F2937',
          color: '#fff',
          border: '1px solid #EF4444'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">
            {myMember?.decision === 'pending' ? 'Make Decision' : 'Change Decision'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Current SOCD Status */}
          {myMember && (
            <div className="mb-4 p-3 bg-gray-900 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Your Status</div>
              <div className="flex items-center gap-2">
                <SOCDIcon status={myMember.socd_status} size="sm" showLabel />
              </div>
              {myMember.decision !== 'pending' && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="text-sm text-gray-400">Current Decision</div>
                  <div className="text-sm font-medium text-gray-200 capitalize">
                    {myMember.decision.replace('_', ' ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback Textarea */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Feedback {myMember?.decision !== 'approved' && <span className="text-red-400">*</span>}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add your feedback..."
              rows={4}
              className="
                w-full px-3 py-2
                bg-gray-900 border border-gray-700
                text-gray-200 placeholder-gray-500
                rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500
                resize-none
              "
            />
          </div>
        </div>

        {/* Footer - Decision Buttons */}
        <div className="p-4 border-t border-gray-700 flex gap-2">
          <button
            onClick={() => handleDecision('approved')}
            disabled={loading}
            className="
              flex-1 px-4 py-2
              bg-green-600 hover:bg-green-700
              text-white font-medium
              rounded-lg
              flex items-center justify-center gap-2
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Check size={18} />
            Approve
          </button>
          <button
            onClick={() => handleDecision('changes_requested')}
            disabled={loading}
            className="
              flex-1 px-4 py-2
              bg-orange-600 hover:bg-orange-700
              text-white font-medium
              rounded-lg
              flex items-center justify-center gap-2
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Edit3 size={18} />
            Request Changes
          </button>
          <button
            onClick={() => handleDecision('rejected')}
            disabled={loading}
            className="
              flex-1 px-4 py-2
              bg-red-600 hover:bg-red-700
              text-white font-medium
              rounded-lg
              flex items-center justify-center gap-2
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <AlertCircle size={18} />
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

export default DecisionModal
