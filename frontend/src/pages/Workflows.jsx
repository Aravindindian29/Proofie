import React, { useState, useEffect } from 'react'
import CrushLoader from '../components/CrushLoader'
import { CheckCircle, AlertCircle, Clock, X, GitBranch } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

function Workflows() {
  const [reviewCycles, setReviewCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCycle, setSelectedCycle] = useState(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackData, setFeedbackData] = useState({ feedback: '', action: 'approve' })

  useEffect(() => {
    fetchReviewCycles()
  }, [])

  const fetchReviewCycles = async () => {
    try {
      const response = await api.get('/workflows/review-cycles/')
      setReviewCycles(response.data.results || response.data)
    } catch (error) {
      toast.error('Failed to fetch review cycles')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveStage = async () => {
    if (!selectedCycle) return

    try {
      const response = await api.post(
        `/workflows/review-cycles/${selectedCycle.id}/approve_stage/`,
        { feedback: feedbackData.feedback }
      )
      setReviewCycles(reviewCycles.map(rc => rc.id === selectedCycle.id ? response.data : rc))
      setShowFeedbackModal(false)
      setFeedbackData({ feedback: '', action: 'approve' })
      toast.success('Stage approved!')
    } catch (error) {
      toast.error('Failed to approve stage')
    }
  }

  const handleRejectStage = async () => {
    if (!selectedCycle) return

    try {
      const response = await api.post(
        `/workflows/review-cycles/${selectedCycle.id}/reject_stage/`,
        { feedback: feedbackData.feedback }
      )
      setReviewCycles(reviewCycles.map(rc => rc.id === selectedCycle.id ? response.data : rc))
      setShowFeedbackModal(false)
      setFeedbackData({ feedback: '', action: 'approve' })
      toast.success('Stage rejected!')
    } catch (error) {
      toast.error('Failed to reject stage')
    }
  }

  const statusConfig = {
    completed:   { icon: CheckCircle, color: '#30D158', badge: 'badge-success', label: 'Completed' },
    rejected:    { icon: AlertCircle, color: '#FF375F', badge: 'badge-danger',  label: 'Rejected' },
    in_progress: { icon: Clock,       color: '#0A84FF', badge: 'badge-primary', label: 'In Progress' },
  }

  return (
    <div style={{ padding: '36px 40px' }}>
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Approvals</p>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>Review Workflows</h1>
      </div>

      {loading ? (
        <CrushLoader text="Loading workflows..." />
      ) : reviewCycles.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviewCycles.map((cycle) => {
            const cfg = statusConfig[cycle.status] || statusConfig.in_progress
            const Icon = cfg.icon
            return (
              <div key={cycle.id} className="glass-card" style={{ padding: '24px', cursor: 'pointer' }}
                onClick={() => setSelectedCycle(cycle)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 13,
                      background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={20} color={cfg.color} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{cycle.asset?.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{cycle.template?.name}</p>
                    </div>
                  </div>
                  <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                </div>

                {cycle.current_stage && (
                  <div style={{
                    background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.2)',
                    borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                  }}>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Current Stage</p>
                    <p style={{ fontWeight: 600, color: '#60b3ff' }}>{cycle.current_stage.name}</p>
                  </div>
                )}

                {cycle.status === 'in_progress' && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-primary" style={{ borderRadius: 12, padding: '8px 18px', fontSize: '0.85rem' }}
                      onClick={(e) => { e.stopPropagation(); setSelectedCycle(cycle); setFeedbackData({ ...feedbackData, action: 'approve' }); setShowFeedbackModal(true) }}>
                      <CheckCircle size={15} /> Approve
                    </button>
                    <button className="btn-danger" style={{ borderRadius: 12, padding: '8px 18px', fontSize: '0.85rem' }}
                      onClick={(e) => { e.stopPropagation(); setSelectedCycle(cycle); setFeedbackData({ ...feedbackData, action: 'reject' }); setShowFeedbackModal(true) }}>
                      <X size={15} /> Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass-card-static" style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
            background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><GitBranch size={32} color="#0A84FF" /></div>
          <p style={{ color: 'rgba(255,255,255,0.35)' }}>No review cycles yet</p>
        </div>
      )}

      {showFeedbackModal && selectedCycle && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowFeedbackModal(false)}>
          <div className="modal-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                {feedbackData.action === 'approve' ? '✅ Approve Stage' : '❌ Reject Stage'}
              </h2>
              <button onClick={() => setShowFeedbackModal(false)} style={{
                width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><X size={16} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); feedbackData.action === 'approve' ? handleApproveStage() : handleRejectStage() }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,
                  color: 'rgba(255,255,255,0.45)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Feedback</label>
                <textarea value={feedbackData.feedback}
                  onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                  className="input-field" rows="4" placeholder="Add your feedback..." />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit"
                  className={feedbackData.action === 'approve' ? 'btn-primary' : 'btn-danger'}
                  style={{ flex: 1, justifyContent: 'center', borderRadius: 14, padding: '13px' }}>
                  {feedbackData.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
                <button type="button" onClick={() => setShowFeedbackModal(false)} className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', borderRadius: 14, padding: '13px' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Workflows
