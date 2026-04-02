import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, Link, Send, Download, MoreHorizontal, Eye, Users, Calendar, Clock, Hourglass, User, Trash2 } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import DeleteConfirmationModal from './DeleteConfirmationModal'

const colors = [
  'linear-gradient(135deg,#0A84FF,#5E5CE6)',
  'linear-gradient(135deg,#5E5CE6,#FF375F)',
  'linear-gradient(135deg,#30D158,#0A84FF)',
  'linear-gradient(135deg,#FF9F0A,#FF375F)',
  'linear-gradient(135deg,#FF375F,#5E5CE6)',
  'linear-gradient(135deg,#FFD60A,#FF9F0A)',
]

function ProjectDetailsTray({ isOpen, onClose, project }) {
  const [projectWithAssets, setProjectWithAssets] = useState(null)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/versioning/projects/${displayProject.id}/`)
      toast.success('Project deleted successfully')
      setShowDeleteModal(false)
      onClose()
      window.location.reload()
    } catch (error) {
      toast.error('Failed to delete project: ' + (error.response?.data?.error || error.message))
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
  }

  // Fetch project assets when tray opens or project changes
  useEffect(() => {
    if (isOpen && project?.id) {
      fetchProjectAssets()
    } else if (!isOpen) {
      setProjectWithAssets(null)
    }
  }, [isOpen, project?.id])

  const fetchProjectAssets = async () => {
    setLoadingAssets(true)
    try {
      console.log('🔍 Fetching assets for project:', project.id)
      console.log('🔍 Project object:', project)
      
      // Try the new assets endpoint first
      try {
        const assetsResponse = await api.get(`/versioning/projects/${project.id}/assets/`)
        console.log('✅ Success with assets endpoint:', assetsResponse.data)
        
        // Combine project data with assets
        const projectWithAssets = {
          ...project,
          assets: assetsResponse.data
        }
        
        console.log('📦 Final project with assets:', projectWithAssets)
        setProjectWithAssets(projectWithAssets)
        
      } catch (assetsError) {
        console.log('❌ Assets endpoint failed:', assetsError.message)
        
        // Fallback: try global assets endpoint and filter
        try {
          const allAssetsResponse = await api.get('/versioning/assets/')
          const projectAssets = allAssetsResponse.data.results?.filter(asset => asset.project === project.id)
          console.log('📦 Filtered assets for project:', projectAssets)
          
          const projectWithAssets = {
            ...project,
            assets: projectAssets || []
          }
          
          setProjectWithAssets(projectWithAssets)
          
        } catch (fallbackError) {
          console.log('❌ Fallback assets call failed:', fallbackError.message)
          
          // Final fallback: empty assets array
          setProjectWithAssets({ ...project, assets: [] })
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch project assets:', error)
      console.error('❌ Error details:', error.response?.data || error.message)
      
      // Use basic project data as fallback
      setProjectWithAssets({ ...project, assets: [] })
      
      // Show user-friendly error
      if (error.response?.status === 404) {
        console.log('💡 Project not found - using fallback data')
      } else if (error.response?.status === 403) {
        console.log('💡 Access denied - using fallback data')
      } else {
        console.log('💡 API error - using fallback data')
      }
    } finally {
      setLoadingAssets(false)
    }
  }

  const displayProject = projectWithAssets || project

  // Helper to get the first asset for preview
  const getFirstAsset = () => {
    if (displayProject?.assets?.length > 0) {
      return displayProject.assets[0]
    }
    return null
  }

  const firstAsset = getFirstAsset()

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          pointerEvents: isOpen ? 'auto' : 'none',
          visibility: isOpen ? 'visible' : 'hidden'
        }}
        onClick={onClose}
      />

      {/* Tray */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? '0px' : '-750px',
          width: '750px',
          height: '100vh',
          background: 'rgba(20, 20, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1000,
          transition: 'right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          boxShadow: isOpen ? '-10px 0 40px rgba(0, 0, 0, 0.3)' : 'none',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                color: 'rgba(255, 255, 255, 0.7)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)'
                e.target.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                e.target.style.color = 'rgba(255, 255, 255, 0.7)'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <h2 style={{ 
                color: '#fff', 
                fontSize: '1.3rem', 
                fontWeight: 700, 
                margin: 0 
              }}>
                {project?.name || 'Untitled Project'}
              </h2>
            </div>
            <button
              onClick={handleDeleteClick}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#EF4444',
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                color: '#fff'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#DC2626'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#EF4444'
              }}
              title="Delete project"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          {/* Header Divider Line */}
          <div style={{
            width: '100%',
            height: '1px',
            background: 'rgba(255, 255, 255, 0.2)',
          }} />
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            alignItems: 'center'
          }}>
            {/* Copy Link Button */}
            <button
              title="Copy link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.12)'
                e.target.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                e.target.style.color = 'rgba(255, 255, 255, 0.8)'
              }}
            >
              <Link size={14} />
              Copy link
            </button>

            {/* Export Proof Report Button */}
            <button
              title="Export proof report"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.12)'
                e.target.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                e.target.style.color = 'rgba(255, 255, 255, 0.8)'
              }}
            >
              <Send size={14} />
            </button>

            {/* Download Original File Button */}
            <button
              title="Download original file"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.12)'
                e.target.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                e.target.style.color = 'rgba(255, 255, 255, 0.8)'
              }}
            >
              <Download size={14} />
            </button>

            {/* Periods Button (Copy Proof ID) */}
            <button
              title="Copy proof ID"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.12)'
                e.target.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                e.target.style.color = 'rgba(255, 255, 255, 0.8)'
              }}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Proof Preview Card with Labels - Side by side layout */}
          <div style={{ display: 'flex', gap: '60px', marginBottom: '24px', alignItems: 'flex-start' }}>
            {/* Left side - Proof Preview Card */}
            <div
              style={{
                width: '220px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                flexShrink: 0,
              }}
            >
              {/* Thumbnail Preview Area Only - No Content Section */}
              <div 
                style={{
                  width: '100%',
                  height: '160px',
                  background: displayProject?.thumbnail_url ? 'transparent' : colors[0],
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: firstAsset ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (firstAsset) {
                    window.open(`/files/${firstAsset.id}`, '_blank')
                  }
                }}
              >
                {displayProject?.thumbnail_url ? (
                  <img 
                    src={displayProject.thumbnail_url} 
                    alt={displayProject.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.style.background = colors[0]
                    }}
                  />
                ) : displayProject?.asset_file_type === 'pdf' ? (
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
                ) : displayProject?.asset_file_type === 'image' ? (
                  <img 
                    src={displayProject.asset_file_url} 
                    alt={displayProject.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.style.background = colors[0]
                    }}
                  />
                ) : displayProject?.asset_file_type === 'video' ? (
                  <video
                    src={displayProject.asset_file_url}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    muted
                    preload="metadata"
                  />
                ) : firstAsset?.file_type === 'pdf' ? (
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
                ) : firstAsset?.file_type === 'image' ? (
                  <img 
                    src={firstAsset.file_url} 
                    alt={firstAsset.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.style.background = colors[0]
                    }}
                  />
                ) : firstAsset?.file_type === 'video' ? (
                  <video
                    src={firstAsset.file_url}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    muted
                    preload="metadata"
                  />
                ) : (
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: colors[0],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', fontWeight: 900, color: '#fff',
                    boxShadow: '0 6px 20px rgba(10,132,255,0.3)',
                  }}>
                    {displayProject?.name?.[0]?.toUpperCase()}
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
                  {displayProject?.asset_file_type || firstAsset?.file_type || 'Project'}
                </div>
              </div>
            </div>

            {/* Right side - Labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {/* Folder */}
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '36px' }}>
                <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, width: '80px' }}>Folder</span>
                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                  {displayProject?.folder?.name || displayProject?.folder_name || '—'}
                </span>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '36px' }}>
                <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, width: '80px' }}>Status</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: displayProject?.is_active ? '#FFD60A' : '#FF375F', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: displayProject?.is_active ? 'rgba(255,214,10,0.15)' : 'rgba(255,55,95,0.15)',
                  borderRadius: '6px',
                  border: displayProject?.is_active ? '1px solid rgba(255,214,10,0.4)' : '1px solid rgba(255,55,95,0.4)'
                }}>
                  {displayProject?.is_active ? (
                    <Hourglass size={14} color="#FFD60A" strokeWidth={3.5} />
                  ) : (
                    <span style={{ 
                      width: 8, height: 8, borderRadius: '50%', 
                      background: '#FF375F',
                      display: 'inline-block'
                    }} />
                  )}
                  {displayProject?.is_active ? 'In Progress' : 'Inactive'}
                </span>
              </div>

              {/* Owner */}
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '36px' }}>
                <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, width: '80px' }}>Owner</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Profile Icon */}
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#0A84FF,#5E5CE6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {displayProject?.owner?.username?.[0]?.toUpperCase() || 
                     displayProject?.created_by?.username?.[0]?.toUpperCase() || 
                     <User size={18} />}
                  </div>
                  {/* Username and Email */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                      {displayProject?.owner?.username || 
                       displayProject?.owner_name || 
                       displayProject?.created_by?.username || 
                       '—'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
                      {displayProject?.owner?.email || 
                       displayProject?.created_by?.email || 
                       ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Created */}
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '36px' }}>
                <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, width: '80px' }}>Created</span>
                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                  {displayProject?.created_at 
                    ? (() => {
                        const date = new Date(displayProject.created_at)
                        const dateStr = date.toLocaleDateString()
                        let timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})
                        timeStr = timeStr.replace(/\s?(am|pm)$/i, (match) => match.toUpperCase())
                        return `${dateStr} ${timeStr}`
                      })()
                    : '—'}
                </span>
              </div>

              {/* Assets */}
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '36px' }}>
                <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, width: '80px', flexShrink: 0 }}>Assets</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {displayProject?.assets?.length > 0 ? (
                    displayProject.assets.map((asset, index) => (
                      <div key={asset.id || index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                          {asset.name || displayProject?.name || 'Untitled Proof'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>0</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {loadingAssets ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                Loading assets...
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={displayProject?.name || 'Untitled Proof'}
        deleting={deleting}
      />
    </>
  )
}

export default ProjectDetailsTray
