import React, { useState, useEffect } from 'react'
import CrushLoader from '../components/CrushLoader'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, FolderOpen, Users, Calendar, Clock, Hourglass, Trash2, X, Folder, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import ProjectDetailsTray from '../components/ProjectDetailsTray'
import CreateProofModal from '../components/CreateProofModal'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'

const colors = [
  'linear-gradient(135deg,#0A84FF,#5E5CE6)',
  'linear-gradient(135deg,#5E5CE6,#FF375F)',
  'linear-gradient(135deg,#30D158,#0A84FF)',
  'linear-gradient(135deg,#FF9F0A,#FF375F)',
  'linear-gradient(135deg,#FF375F,#5E5CE6)',
  'linear-gradient(135deg,#FFD60A,#FF9F0A)',
]

function Projects() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [isTrayOpen, setIsTrayOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentUser, setCurrentUser] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const itemsPerPage = 7 // 7 projects + 1 create card = 8 total

  useEffect(() => { 
    fetchCurrentUser()
    fetchProjects() 
  }, [])

  // Handle folder filter from URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const folderId = searchParams.get('folder')
    if (folderId) {
      // Fetch folder details
      api.get(`/versioning/folders/${folderId}/`).then(response => {
        setSelectedFolder(response.data)
      }).catch(() => {
        toast.error('Failed to load folder', { id: 'projects-toast' })
        setSelectedFolder(null)
      })
    } else {
      setSelectedFolder(null)
    }
  }, [location.search])

  // Filter projects by selected folder
  const filteredProjects = selectedFolder
    ? projects.filter(p => p.folder?.id === selectedFolder.id || p.folder_id === selectedFolder.id)
    : projects

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex)

  const clearFolderFilter = () => {
    navigate('/proofs', { replace: true })
    setSelectedFolder(null)
    setCurrentPage(1)
  }

  const handleCreateSuccess = (newProject) => {
    console.log('handleCreateSuccess called with:', newProject)
    console.log('New project has share_token:', newProject?.share_token)
    setProjects([newProject, ...projects])
    setCurrentPage(1) // Go to first page to see the new project
    // Refresh projects to get thumbnail URL
    setTimeout(() => fetchProjects(), 500)
  }

  const handleProjectClick = (project) => {
    console.log('handleProjectClick called with project:', project)
    console.log('Project share_token:', project?.share_token)
    setSelectedProject(project)
    setIsTrayOpen(true)
    // Update URL to include the proof's share token
    if (project.share_token) {
      console.log('Navigating to proof URL with token:', project.share_token)
      navigate(`/proofs/proof/${project.share_token}`, { replace: true })
    } else {
      console.warn('No share_token found on project!')
    }
  }

  const closeTray = () => {
    setIsTrayOpen(false)
    setTimeout(() => setSelectedProject(null), 300)
    // Revert URL back to /proofs
    navigate('/proofs', { replace: true })
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/accounts/users/me/')
      setCurrentUser(response.data)
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await api.get('/versioning/projects/')
      console.log('Projects API response:', response.data)
      const projectsData = response.data.results || response.data
      console.log('Projects data:', projectsData)
      setProjects(projectsData)
    } catch (err) { 
      console.error('Failed to fetch projects:', err)
      toast.error('Failed to fetch projects', { id: 'projects-toast' }) 
    }
    finally { setLoading(false) }
  }

  useEffect(() => { 
    fetchCurrentUser()
    fetchProjects() 
  }, [])

  useEffect(() => { 
    console.log('isTrayOpen changed to:', isTrayOpen)
  }, [isTrayOpen])

  // Handle direct navigation to /proofs/proof/:token
  useEffect(() => {
    console.log('useEffect running - location.pathname:', location.pathname, 'isTrayOpen:', isTrayOpen)
    if (projects.length > 0 && location.pathname.startsWith('/proofs/proof/')) {
      const token = location.pathname.split('/proofs/proof/')[1]
      console.log('Token from URL:', token)
      if (token) {
        const project = projects.find(p => p.share_token === token)
        console.log('Found project:', project, 'isTrayOpen:', isTrayOpen)
        if (project && !isTrayOpen) {
          console.log('Opening tray for project:', project.name)
          setSelectedProject(project)
          setIsTrayOpen(true)
        } else if (!project) {
          console.warn('No project found with token:', token)
        }
      }
    }
  }, [projects, location.pathname])

  const openModal = () => {
    setShowModal(true)
  }

  const handleDeleteClick = (e, project) => {
    e.stopPropagation()
    
    // Check ownership
    const isOwner = project.owner?.id === currentUser.id || project.owner?.username === currentUser.username
    if (!isOwner) {
      toast.error('You can only delete proofs you created', { id: 'projects-toast' })
      return
    }
    
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
      fetchProjects()
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
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
        <div className="fade-up">
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em',
            textTransform: 'uppercase', marginBottom: 6 }}>Creative Hub</p>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
            Proofs
          </h1>
        </div>
      </div>

      {/* Folder Filter Indicator */}
      {selectedFolder && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
          padding: '12px 16px',
          background: 'rgba(142, 68, 173, 0.15)',
          border: '1px solid rgba(142, 68, 173, 0.3)',
          borderRadius: 10
        }}>
          <Folder size={18} color="#9B59B6" />
          <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
            Folder: {selectedFolder.name}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            ({filteredProjects.length} {filteredProjects.length === 1 ? 'proof' : 'proofs'})
          </span>
          <button
            onClick={clearFolderFilter}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <X size={14} /> Clear Filter
          </button>
        </div>
      )}

      {loading ? (
        <CrushLoader text="Loading proofs..." />
      ) : filteredProjects.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {/* Create New Proof Card - First in grid */}
            <div
              onClick={openModal}
              className="glass-card"
              style={{ 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '1px solid rgba(10, 132, 255, 0.2)',
                background: 'rgba(10, 132, 255, 0.05)',
                minHeight: '160px',
                gap: 12
              }}>
              <Plus size={28} color="#0A84FF" strokeWidth={2.5} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                Click here to start a new proof
              </span>
            </div>
            {paginatedProjects.map((project, i) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className="glass-card"
                style={{ padding: '0', textDecoration: 'none', display: 'flex', flexDirection: 'column', cursor: 'pointer', overflow: 'hidden' }}>
              {/* Thumbnail Preview Area */}
              <div style={{
                width: '100%',
                height: '160px',
                backgroundImage: project.thumbnail_url ? 'none' : colors[i % colors.length],
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
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
                {project.thumbnail_url ? (
                  <img 
                    src={project.thumbnail_url} 
                    alt={project.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.style.backgroundImage = colors[i % colors.length]
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
                      e.target.parentElement.style.backgroundImage = colors[i % colors.length]
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
              </div>
              
              {/* Content Area */}
              <div style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', marginBottom: 4 }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: project.is_active ? 'rgba(255,214,10,0.15)' : 'rgba(255,55,95,0.15)',
                    color: project.is_active ? '#FFD60A' : '#FF375F',
                    border: project.is_active ? '2px solid rgba(255,214,10,0.4)' : '2px solid rgba(255,55,95,0.4)'
                  }}>
                    {project.is_active ? (
                      <><Hourglass size={10} strokeWidth={2.5} /> In Progress</>
                    ) : 'Inactive'}
                  </span>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4, alignItems: 'center' }}>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32 }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <ChevronLeft size={20} />
            </button>
            
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: currentPage === page ? '#FF375F' : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </>
      ) : selectedFolder ? (
        <div className="glass-card-static" style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
            background: 'rgba(142, 68, 173, 0.15)', border: '1px solid rgba(142, 68, 173, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FolderOpen size={32} color="#9B59B6" />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
            No proofs in "{selectedFolder.name}" folder
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', marginBottom: 20 }}>
            This folder is empty. Create a new proof or clear the filter.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={clearFolderFilter} className="btn-secondary" style={{ borderRadius: 14 }}>
              Clear Filter
            </button>
            <button onClick={openModal} className="btn-primary" style={{ borderRadius: 14 }}>
              Create New Proof
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card-static" style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
            background: 'rgba(10,132,255,0.1)', border: '1px solid rgba(10,132,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FolderOpen size={32} color="#0A84FF" />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>No Proofs Yet</p>
          <button onClick={openModal} className="btn-primary" style={{ borderRadius: 14 }}>
            Create New Proof
          </button>
        </div>
      )}

      {/* Project Details Tray */}
      <ProjectDetailsTray
        isOpen={isTrayOpen}
        onClose={closeTray}
        project={selectedProject}
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

export default Projects
