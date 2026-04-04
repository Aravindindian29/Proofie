import React, { useState, useEffect } from 'react'
import CrushLoader from '../components/CrushLoader'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FolderOpen, FileText, CheckCircle, Clock, ArrowRight, Plus, Users, Calendar, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import ProjectDetailsTray from '../components/ProjectDetailsTray'
import CreateProofModal from '../components/CreateProofModal'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import StatusBadge from '../components/StatusBadge'

const colors = [
  'linear-gradient(135deg,#0A84FF,#5E5CE6)',
  'linear-gradient(135deg,#5E5CE6,#FF375F)',
  'linear-gradient(135deg,#30D158,#0A84FF)',
  'linear-gradient(135deg,#FF9F0A,#FF375F)',
  'linear-gradient(135deg,#FF375F,#5E5CE6)',
  'linear-gradient(135deg,#FFD60A,#FF9F0A)',
]
const statCards = [
  { key: 'projects',        label: 'Proofs',          icon: FolderOpen,   gradient: 'linear-gradient(135deg,#0A84FF,#5E5CE6)', glow: 'rgba(10,132,255,0.35)' },
  { key: 'assets',          label: 'Assets',            icon: FileText,     gradient: 'linear-gradient(135deg,#5E5CE6,#FF375F)', glow: 'rgba(94,92,230,0.35)' },
  { key: 'reviewCycles',    label: 'Review Cycles',     icon: CheckCircle,  gradient: 'linear-gradient(135deg,#30D158,#0A84FF)', glow: 'rgba(48,209,88,0.35)' },
  { key: 'pendingApprovals',label: 'Pending Approvals', icon: Clock,        gradient: 'linear-gradient(135deg,#FF9F0A,#FF375F)', glow: 'rgba(255,159,10,0.35)' },
]

function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [stats, setStats] = useState({ projects: 0, assets: 0, reviewCycles: 0, pendingApprovals: 0 })
  const [recentProjects, setRecentProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  const [isTrayOpen, setIsTrayOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleCreateSuccess = (newProject) => {
    setRecentProjects([newProject, ...recentProjects])
    setStats(prev => ({ ...prev, projects: prev.projects + 1 }))
  }

  const handleProjectClick = (project) => {
    setSelectedProject(project)
    setIsTrayOpen(true)
    // Navigate to dashboard/proof/:token URL
    if (project.share_token) {
      navigate(`/dashboard/proof/${project.share_token}`, { replace: true })
    }
  }

  const closeTray = () => {
    setIsTrayOpen(false)
    setTimeout(() => setSelectedProject(null), 300)
    // Revert URL back to /dashboard
    navigate('/dashboard', { replace: true })
  }

  const fetchDashboardData = async () => {
    try {
      const [projectsRes] = await Promise.all([api.get('/versioning/projects/')])
      const projects = projectsRes.data.results || projectsRes.data || []
      setRecentProjects(projects)
      setStats(prev => ({ ...prev, projects: projects.length }))
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to fetch dashboard data')
      setRecentProjects([])
      setStats(prev => ({ ...prev, projects: 0 }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboardData() }, [])

  // Setup WebSocket listener for real-time updates
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/accounts/users/me/')
        const user = response.data
        
        if (!user) return

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${wsProtocol}//localhost:8000/ws/notifications/${user.id}/`
        
        let ws = null
        let reconnectAttempts = 0
        const maxReconnectAttempts = 5
        const reconnectDelay = 3000

        const connectWebSocket = () => {
          try {
            ws = new WebSocket(wsUrl)
            
            ws.onopen = () => {
              console.log('✅ Dashboard WebSocket connected')
              reconnectAttempts = 0
            }
            
            ws.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data)
                console.log('📨 Dashboard WebSocket message:', data)
                
                // Handle review cycle status updates
                if (data.type === 'review_cycle_update') {
                  console.log('🔄 Dashboard: Review cycle updated:', data.review_cycle_id, 'Status:', data.status)
                  
                  // Update the specific project in recentProjects if it has this review cycle
                  setRecentProjects(prevProjects => 
                    prevProjects.map(project => {
                      // Check if this project has the updated review cycle
                      const hasUpdatedCycle = project.review_cycles && 
                        project.review_cycles.some(rc => rc.id === data.review_cycle_id)
                      
                      if (hasUpdatedCycle) {
                        // Update the review cycle status within the project
                        return {
                          ...project,
                          review_cycles: project.review_cycles.map(rc => 
                            rc.id === data.review_cycle_id 
                              ? { ...rc, status: data.status }
                              : rc
                          )
                        }
                      }
                      return project
                    })
                  )
                  
                  // Refresh dashboard data to get updated stats
                  fetchDashboardData()
                }
              } catch (error) {
                console.error('Failed to parse WebSocket message:', error)
              }
            }
            
            ws.onerror = (error) => {
              console.error('❌ Dashboard WebSocket error:', error)
            }
            
            ws.onclose = () => {
              console.log('❌ Dashboard WebSocket disconnected')
              // Attempt to reconnect
              if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++
                console.log(`Dashboard attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`)
                setTimeout(connectWebSocket, reconnectDelay)
              }
            }
          } catch (error) {
            console.error('Failed to connect Dashboard WebSocket:', error)
          }
        }

        connectWebSocket()

        // Cleanup on unmount
        return () => {
          if (ws) {
            ws.close()
          }
        }
      } catch (error) {
        console.error('Failed to fetch current user for WebSocket:', error)
      }
    }

    fetchCurrentUser()
  }, [])

  // Refresh data when window regains focus (user returns from PDF viewer)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Dashboard: Window focused - refreshing dashboard data')
      fetchDashboardData()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Handle direct navigation to /dashboard/proof/:token
  useEffect(() => {
    if (recentProjects.length > 0 && location.pathname.startsWith('/dashboard/proof/')) {
      const token = location.pathname.split('/dashboard/proof/')[1]
      if (token) {
        const project = recentProjects.find(p => p.share_token === token)
        if (project && !isTrayOpen) {
          setSelectedProject(project)
          setIsTrayOpen(true)
        }
      }
    }
  }, [recentProjects, location.pathname])

  const openModal = () => {
    setShowModal(true)
  }

  const handleDeleteClick = (e, project) => {
    e.stopPropagation()
    setProjectToDelete(project)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/versioning/projects/${projectToDelete.id}/`)
      toast.success('Proof deleted successfully', { id: 'proof-action-toast' })
      setShowDeleteModal(false)
      setProjectToDelete(null)
      // Refresh the list to show next available proof
      await fetchDashboardData()
    } catch (error) {
      toast.error('Failed to delete proof: ' + (error.response?.data?.error || error.message), { id: 'proof-action-toast' })
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setProjectToDelete(null)
  }

  return (
    <div style={{ padding: '36px 40px' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8, letterSpacing: '0.01em' }}>
            <span style={{
              background: 'linear-gradient(90deg, #ffffff, #a0c4ff, #ffffff)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 3s linear infinite',
            }}>Welcome {user?.username}</span>
            {' '}{'\u{1F60E}'}
          </p>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
            Dashboard
          </h1>
        </div>
        {recentProjects.length > 0 && (
          <button
            onClick={openModal}
            className="btn-primary"
            style={{ borderRadius: 14, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={18} /> Create New Proof
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 36 }}>
        {statCards.map(({ key, label, icon: Icon, gradient, glow }, i) => (
          <Link 
            key={key} 
            to={key === 'projects' ? '/proofs' : '#'} 
            className="glass-card" 
            style={{
              padding: '24px', 
              animationDelay: `${i * 0.08}s`,
              textDecoration: 'none',
              display: 'block',
              cursor: key === 'projects' ? 'pointer' : 'default'
            }}
            onClick={key === 'projects' ? (e) => {
              // Allow navigation for projects card
              return
            } : (e) => {
              e.preventDefault()
              // Prevent navigation for other cards
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                  {label}
                </p>
                <p style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {loading ? '—' : stats[key]}
                </p>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px ${glow}`,
                flexShrink: 0,
              }}>
                <Icon size={20} color="#fff" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="glass-card-static" style={{ padding: '28px 28px', minHeight: '280px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Recent Proofs</h2>
          {recentProjects.length > 0 && (
            <Link to="/proofs" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#0A84FF', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700,
            }}>
              <span style={{ fontWeight: 700 }}>View all</span> <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          )}
        </div>

        {loading ? (
          <CrushLoader />
        ) : recentProjects.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, alignItems: 'start' }}>
            {recentProjects.slice(0, 4).map((project, i) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className="glass-card"
                style={{ padding: '0', textDecoration: 'none', display: 'flex', flexDirection: 'column', cursor: 'pointer', overflow: 'hidden' }}>
                {/* Thumbnail Preview Area */}
                <div style={{
                  width: '100%',
                  height: '160px',
                  background: project.thumbnail_url ? 'transparent' : colors[i % colors.length],
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {project.thumbnail_url ? (
                    <img 
                      src={project.thumbnail_url} 
                      alt={project.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.style.background = colors[i % colors.length]
                      }}
                    />
                  ) : project.asset_file_type === 'pdf' ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                      fontSize: '48px'
                    }}>
                      📄
                    </div>
                  ) : project.asset_file_type === 'image' ? (
                    <img 
                      src={project.asset_file_url} 
                      alt={project.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.style.background = colors[i % colors.length]
                      }}
                    />
                  ) : project.asset_file_type === 'video' ? (
                    <video
                      src={project.asset_file_url}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: colors[i % colors.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', fontWeight: 900, color: '#fff',
                      boxShadow: '0 6px 20px rgba(10,132,255,0.3)',
                    }}>
                      {project.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  {/* File type badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    padding: '4px 8px',
                    background: 'rgba(0,0,0,0.7)',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: '#fff',
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}>
                    {project.asset_file_type || 'Project'}
                  </div>

                  {/* Delete Button - Hover Visible */}
                  <button
                    onClick={(e) => handleDeleteClick(e, project)}
                    className="proof-delete-btn"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '6px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      border: 'none',
                      borderRadius: 6,
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                      zIndex: 10,
                      backdropFilter: 'blur(4px)'
                    }}
                    title="Delete Proof"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {/* Content Area */}
                <div style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', marginBottom: 4 }}>
                    <StatusBadge status={project.review_cycle_status || 'not_started'} size="small" />
                  </div>
                  <h3 style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 700, 
                    color: '#fff', 
                    marginBottom: 8,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {project.name}
                  </h3>
                  {project.description && (
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: 6, lineHeight: 1.3, minHeight: 'auto' }}>
                      {project.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3,
                      fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      <Users size={11} strokeWidth={2.5} /> {project.reviewers?.length || project.reviewer_count || project.member_count || 0} members
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3,
                      fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      <Calendar size={11} strokeWidth={2.5} />
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3,
                      fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      <Clock size={11} strokeWidth={2.5} />
                      {(new Date(project.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})).replace(/\s?(am|pm)$/i, (match) => match.toUpperCase())}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <FolderOpen size={40} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 14px', display: 'block' }} />
            <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 18 }}>No Proofs Yet</p>
            <button onClick={openModal} className="btn-primary" style={{ borderRadius: 14 }}>
              Create New Proof
            </button>
          </div>
        )}
      </div>

      {/* Project Details Tray */}
      <ProjectDetailsTray 
        isOpen={isTrayOpen} 
        onClose={closeTray} 
        project={selectedProject}
        onProjectDeleted={(projectId) => {
          setRecentProjects(recentProjects.filter(p => p.id !== projectId))
        }}
      />

      <CreateProofModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={projectToDelete?.name || 'Untitled Proof'}
        deleting={deleting}
      />
    </div>
  )
}

export default Dashboard
