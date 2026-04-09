import React, { useState } from 'react'
import { X, Check, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import SOCDIcon from './SOCDIcon'

const DecisionModal = ({ isOpen, onClose, reviewCycleId, myMember, onDecisionSuccess }) => {
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDecision = async (decision) => {
    // Validate feedback requirement for non-approval decisions
    if (!feedback.trim() && decision !== 'approved') {
      toast.dismiss() // Clear any existing toasts
      toast.error('Please provide feedback for your decision', {
        duration: 3000,
        position: 'top-center',
        style: {
          color: '#fff',
          border: '1px solid #EF4444',
          borderLeft: '4px solid #EF4444',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500'
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
        approved: 'Proof approved successfully!',
        changes_requested: 'Changes requested successfully!',
        rejected: 'Proof rejected successfully!'
      }
      
      toast.dismiss() // Clear any existing toasts
      toast.success(successMessages[decision] || 'Decision submitted successfully!', { id: 'decision-toast' })
      
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
      
      toast.dismiss() // Clear any existing toasts
      toast.error(errorMessage, { id: 'decision-toast' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ 
        padding: '48px', 
        width: '100%', 
        maxWidth: '500px', 
        minHeight: 'auto',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {myMember?.decision === 'pending' ? 'Make Decision' : 'Change Decision'}
          </h2>
          <button 
            onClick={onClose} 
            style={{
              width: 32, 
              height: 32, 
              borderRadius: 10, 
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)', 
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ marginBottom: '32px' }}>
          {/* Feedback Textarea */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.78rem', 
              fontWeight: 600,
              color: 'rgba(255,255,255,0.45)', 
              marginBottom: '12px', 
              letterSpacing: '0.06em',
              textTransform: 'uppercase' 
            }}>
              Feedback {myMember?.decision !== 'approved' && <span style={{ color: '#FF6B35' }}>*</span>}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add your feedback..."
              rows={4}
              style={{
                width: '100%',
                padding: '16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                placeholder: 'rgba(255,255,255,0.4)',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(10,132,255,0.5)'
                e.target.style.background = 'rgba(255,255,255,0.08)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                e.target.style.background = 'rgba(255,255,255,0.05)'
              }}
            />
          </div>
        </div>

        {/* Footer - Decision Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={() => handleDecision('approved')}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: loading ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.6 : 1,
              boxShadow: loading ? 'none' : '0 4px 12px rgba(16,185,129,0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)'
              }
            }}
          >
            <Check size={18} />
            Approve
          </button>
          <button
            onClick={() => handleDecision('changes_requested')}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: loading ? 'rgba(245,158,11,0.3)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.6 : 1,
              boxShadow: loading ? 'none' : '0 4px 12px rgba(245,158,11,0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.3)'
              }
            }}
          >
            <Edit3 size={18} />
            Request Changes
          </button>
          <button
            onClick={() => handleDecision('rejected')}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 16px',
              background: loading ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #EF4444, #DC2626)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.6 : 1,
              boxShadow: loading ? 'none' : '0 4px 12px rgba(239,68,68,0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)'
              }
            }}
          >
            <X size={18} />
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

export default DecisionModal
