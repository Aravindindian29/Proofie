import React, { useState, useEffect } from 'react'







import { X, ChevronLeft, Link, Send, Download, MoreHorizontal, Eye, Users, Calendar, Clock, User, Trash2, MessageSquare, CheckCircle, XCircle, RefreshCw, Lock, ArrowRight, ChevronDown } from 'lucide-react'







import api from '../services/api'







import { toastManager } from '../utils/toastManager'







import DeleteConfirmationModal from './DeleteConfirmationModal'



import DecisionModal from './workflow/DecisionModal'



import CreateProofModal from './CreateProofModal'



import { useAuthStore } from '../stores/authStore'















const colors = [







  'linear-gradient(135deg,#0A84FF,#5E5CE6)',







  'linear-gradient(135deg,#5E5CE6,#FF375F)',







  'linear-gradient(135deg,#30D158,#0A84FF)',







  'linear-gradient(135deg,#FF9F0A,#FF375F)',







  'linear-gradient(135deg,#FF375F,#5E5CE6)',







  'linear-gradient(135deg,#FFD60A,#FF9F0A)',







]















function ProjectDetailsTray({ isOpen, onClose, project, onProjectDeleted, onProjectCreated, onProjectChanged }) {







  const { canDeleteContent } = useAuthStore()







  const [projectWithAssets, setProjectWithAssets] = useState(null)







  const [loadingAssets, setLoadingAssets] = useState(false)







  const [showDeleteModal, setShowDeleteModal] = useState(false)







  const [deleting, setDeleting] = useState(false)







  const [activeSubTab, setActiveSubTab] = useState('workflow')







  const [reviewCycle, setReviewCycle] = useState(null)







  const [myMember, setMyMember] = useState(null)







  // Extract review cycle data immediately from project data (no API call)
  const extractReviewCycleFromProject = () => {
    if (!project) {
      console.log('No project data available')
      return
    }
    
    console.log('Extracting review cycle from project:', project)
    console.log('Project assets:', project.assets)
    
    // Check if project has assets with review cycles
    if (project.assets && project.assets.length > 0) {
      const firstAsset = project.assets[0]
      console.log('First asset:', firstAsset)
      
      // Check if asset has review cycles and set immediately
      if (firstAsset.review_cycles && firstAsset.review_cycles.length > 0) {
        const activeReview = firstAsset.review_cycles[0]
        setReviewCycle(activeReview)
        console.log('Review cycle extracted from project data:', activeReview.status)
      } else {
        console.log('No review cycles found in first asset')
      }
    } else {
      console.log('No assets found in project data')
      
      // Try alternative data structures
      if (project.review_cycles && project.review_cycles.length > 0) {
        const activeReview = project.review_cycles[0]
        setReviewCycle(activeReview)
        console.log('Review cycle extracted from project.review_cycles:', activeReview.status)
      } else if (project.current_review_cycle) {
        setReviewCycle(project.current_review_cycle)
        console.log('Review cycle extracted from project.current_review_cycle:', project.current_review_cycle.status)
      } else {
        console.log('No review cycles found in any expected location')
      }
    }
  }

  // Extract review cycle data immediately when project changes
  useEffect(() => {
    extractReviewCycleFromProject()
  }, [project])




  const [groups, setGroups] = useState([])







  const [currentUser, setCurrentUser] = useState(null)







  const [loadingWorkflow, setLoadingWorkflow] = useState(false)







  const [showDecisionModal, setShowDecisionModal] = useState(false)





  const [preselectedDecision, setPreselectedDecision] = useState(null)

  const [showVersionDropdown, setShowVersionDropdown] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)

  const [allVersions, setAllVersions] = useState([])

  const [loadingVersions, setLoadingVersions] = useState(false)

  const [highestVersionId, setHighestVersionId] = useState(null)

  const [versionsFetched, setVersionsFetched] = useState(false)



  const handleCreateNewProof = () => {

    setShowCreateModal(true)

  }



  // Fetch all versions of the current proof

  const fetchAllVersions = async () => {

    if (!project?.id) return

    

    setLoadingVersions(true)

    try {

      const response = await api.get(`/versioning/projects/${project.id}/versions/`)

      setAllVersions(response.data.versions || [])

      setHighestVersionId(response.data.highest_version_id)

      setVersionsFetched(true)

    } catch (error) {

      console.error('Failed to fetch versions:', error)

      setAllVersions([])

      setHighestVersionId(null)

      setVersionsFetched(false)

    } finally {

      setLoadingVersions(false)

    }

  }



  // Fetch versions when version dropdown is opened (but only if not already fetched)

  useEffect(() => {

    if (showVersionDropdown && project?.id && !versionsFetched) {

      fetchAllVersions()

    }

  }, [showVersionDropdown, project?.id, versionsFetched])



  // Reset versions fetched when project changes

  useEffect(() => {

    if (project?.id) {

      setVersionsFetched(false)

      setAllVersions([])

      setHighestVersionId(null)

    }

  }, [project?.id])



  // ... rest of the code remains the same ...













  const handleDeleteClick = (e) => {







    e.stopPropagation()







    setShowDeleteModal(true)







  }















  const handleConfirmDelete = async () => {







    setDeleting(true)







    try {







      await api.delete(`/versioning/projects/${displayProject.id}/`)







      toastManager.success('Proof deleted successfully', 'folder-toast')







      setShowDeleteModal(false)







      onClose()







      if (onProjectDeleted) {







        onProjectDeleted(displayProject.id)







      }







    } catch (error) {







      console.error('Delete error:', error)







      // Check for 403 Forbidden error and show appropriate message







      if (error.response?.status === 403) {







        toastManager.error('You do not have permission to perform this action.\nPlease contact your administrator for assistance.', 'folder-toast', {







          style: {







            textAlign: 'center',







            whiteSpace: 'pre-line'







          }







        })







      } else {







        toastManager.error('Failed to delete proof: ' + (error.response?.data?.error || error.message), 'folder-toast')







      }







    } finally {







      setDeleting(false)







    }







  }















  const handleCancelDelete = () => {







    setShowDeleteModal(false)







  }















  // Fetch current user







  useEffect(() => {







    const fetchCurrentUser = async () => {







      try {







        const response = await api.get('/accounts/users/me/')







        setCurrentUser(response.data)







      } catch (error) {







        console.error('Failed to fetch current user:', error)







      }







    }







    if (isOpen) {







      fetchCurrentUser()







    }







  }, [isOpen])















  // Setup WebSocket listener for real-time updates







  useEffect(() => {







    if (!currentUser || !isOpen || !reviewCycle?.id) return















    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'







    const wsUrl = `${wsProtocol}//localhost:8000/ws/notifications/${currentUser.id}/`







    







    let ws = null







    let reconnectAttempts = 0







    const maxReconnectAttempts = 5







    const reconnectDelay = 3000















    const connectWebSocket = () => {







      try {







        ws = new WebSocket(wsUrl)







        







        ws.onopen = () => {







          console.log('✅ ProjectDetailsTray WebSocket connected')







          reconnectAttempts = 0







        }







        







        ws.onmessage = (event) => {







          try {







            const data = JSON.parse(event.data)







            console.log('📨 ProjectDetailsTray WebSocket message:', data)







            







            // Handle review cycle status updates







            if (data.type === 'review_cycle_update') {







              console.log('🔄 ProjectDetailsTray: Review cycle update received:', data.review_cycle_id, 'Status:', data.status)







              







              // Check if this update is for our current review cycle
              if (reviewCycle && data.review_cycle_id === reviewCycle.id) {
                console.log('✅ Update matches current review cycle - updating state')

                // Update local state immediately with full review cycle data
                if (data.review_cycle_data) {
                  setReviewCycle(data.review_cycle_data)

                  // Update groups with new status data
                  if (data.review_cycle_data.groups) {
                    setGroups(data.review_cycle_data.groups)
                  }
                } else {
                  // Fallback to just updating status
                  setReviewCycle(prev => ({ 
                    ...prev, 
                    status: data.status,
                    proof_status: data.proof_status || data.status
                  }))
                }
              }

              // Always refresh workflow data to ensure we have the latest information
              // This handles cases where review cycle was just created or updated
              console.log('🔄 Refreshing workflow data...')

              fetchWorkflowData()
            }







          } catch (error) {







            console.error('Failed to parse WebSocket message:', error)







          }







        }







        







        ws.onerror = (error) => {







          console.error('❌ ProjectDetailsTray WebSocket error:', error)







        }







        







        ws.onclose = () => {







          console.log('❌ ProjectDetailsTray WebSocket disconnected')







          // Attempt to reconnect







          if (reconnectAttempts < maxReconnectAttempts) {







            reconnectAttempts++







            console.log(`ProjectDetailsTray attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`)







            setTimeout(connectWebSocket, reconnectDelay)







          }







        }







      } catch (error) {







        console.error('Failed to connect ProjectDetailsTray WebSocket:', error)







      }







    }















    connectWebSocket()















    // Cleanup on unmount







    return () => {







      if (ws) {







        ws.close()







      }







    }







  }, [currentUser, isOpen, reviewCycle?.id])















  // Fetch project assets when tray opens or project changes







  useEffect(() => {







    if (isOpen && project?.id) {







      fetchProjectAssets()







      fetchWorkflowData()







    } else if (!isOpen) {







      setProjectWithAssets(null)







      setReviewCycle(null)







      setMyMember(null)







      setGroups([])







      setActiveSubTab('workflow')







    }







  }, [isOpen, project?.id])















  // Refresh data when window regains focus (user returns from PDF viewer)







  useEffect(() => {







    if (!isOpen) return















    const handleFocus = () => {







      console.log('🔄 Window focused - refreshing tray data')







      fetchWorkflowData()







    }















    window.addEventListener('focus', handleFocus)















    return () => {







      window.removeEventListener('focus', handleFocus)







    }







  }, [isOpen, project?.id])















  // Fetch workflow data







  const fetchWorkflowData = async () => {







    if (!project?.id) return







    







    setLoadingWorkflow(true)







    try {







      // Get the first asset from the project







      const assetsResponse = await api.get(`/versioning/projects/${project.id}/assets/`)







      const assets = assetsResponse.data







      







      if (assets && assets.length > 0) {







        const firstAsset = assets[0]







        







        // Check if asset has review cycles







        if (firstAsset.review_cycles && firstAsset.review_cycles.length > 0) {







          const activeReview = firstAsset.review_cycles[0]







          setReviewCycle(activeReview)







          







          // Fetch my status







          try {







            const statusResponse = await api.get(`/workflows/review-cycles/${activeReview.id}/my_status/`)







            if (statusResponse.data.is_member) {







              setMyMember(statusResponse.data.member)







            }







          } catch (error) {







            console.error('Failed to fetch member status:', error)







          }







          







          // Fetch group status







          try {







            const groupResponse = await api.get(`/workflows/review-cycles/${activeReview.id}/group_status/`)







            setGroups(groupResponse.data.groups.map(g => g.group))







          } catch (error) {







            console.error('Failed to fetch group status:', error)







          }







        }







      }







    } catch (error) {







      console.error('Failed to fetch workflow data:', error)







    } finally {







      setLoadingWorkflow(false)







    }







  }















  // Reset version dropdown when tray closes







  useEffect(() => {







    if (!isOpen) {







      setShowVersionDropdown(false)







    }







  }, [isOpen])















  // Close dropdown when clicking outside







  useEffect(() => {







    const handleClickOutside = (event) => {







      if (showVersionDropdown) {







        setShowVersionDropdown(false)







      }







    }















    if (showVersionDropdown) {







      document.addEventListener('click', handleClickOutside)







      return () => {







        document.removeEventListener('click', handleClickOutside)







      }







    }







  }, [showVersionDropdown])















  // Action handlers







  const handleAddComment = () => {

    // Navigate to ProofReviewer with the project's share_token

    if (project?.share_token) {

      window.open(`/proof-review/${project.share_token}`, '_blank')

    }

  } 



























  const handleApprove = () => {







    setPreselectedDecision('approved')







    setShowDecisionModal(true)







  }















  const handleReject = () => {







    setPreselectedDecision('rejected')







    setShowDecisionModal(true)







  }















  const handleRequestChanges = () => {







    setPreselectedDecision('changes_requested')







    setShowDecisionModal(true)







  }















  const handleDecisionSuccess = () => {







    setShowDecisionModal(false)







    fetchWorkflowData()







    toastManager.success('Decision submitted successfully', 'folder-toast')







  }















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







          







          {/* Version and Actions Container */}







          <div style={{







            display: 'flex',







            justifyContent: 'space-between',







            alignItems: 'center',







            marginTop: '12px',







            marginBottom: '8px',







            position: 'relative'







          }}>







            {/* Action Buttons */}







            <div style={{







              display: 'flex',







              gap: '8px',







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















            {/* Version Label */}







            <div style={{







              display: 'flex',







              alignItems: 'center',







              gap: '8px'







            }}>







              <button







                onClick={(e) => {







                  e.stopPropagation()







                  setShowVersionDropdown(!showVersionDropdown)







                }}







                title={displayProject?.name || 'Untitled Proof'}







                style={{







                  display: 'flex',







                  alignItems: 'center',







                  gap: '6px',







                  fontSize: '0.85rem',







                  fontWeight: 700,







                  color: '#fff',







                  background: 'rgba(156, 163, 175, 0.15)',







                  padding: '4px 10px',







                  borderRadius: '6px',







                  border: '1px solid rgba(156, 163, 175, 0.3)',







                  textTransform: 'uppercase',







                  letterSpacing: '0.5px',







                  cursor: 'pointer',







                  transition: 'all 0.2s'







                }}







                onMouseEnter={(e) => {







                  e.target.style.background = 'rgba(156, 163, 175, 0.25)'







                  e.target.style.borderColor = 'rgba(156, 163, 175, 0.5)'







                }}







                onMouseLeave={(e) => {







                  e.target.style.background = 'rgba(156, 163, 175, 0.15)'







                  e.target.style.borderColor = 'rgba(156, 163, 175, 0.3)'







                }}







              >







                V{displayProject?.version_number || 1}







                <ChevronDown 







                  size={12} 







                  strokeWidth={3}







                  style={{







                    transition: 'transform 0.2s',







                    transform: showVersionDropdown ? 'rotate(180deg)' : 'rotate(0deg)',







                    filter: 'none',







                    boxShadow: 'none'







                  }}







                />

              </button>

              <span style={{

                fontSize: '0.85rem',

                fontWeight: 900,

                color: '#fff',

                background: 'rgba(59, 130, 246, 0.8)',

                padding: '4px 10px',

                borderRadius: '6px',

                border: '1px solid rgba(59, 130, 246, 0.5)',

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'center',

                cursor: 'pointer',

                transition: 'all 0.2s'

              }}

              title="Create New Proof"

              onClick={handleCreateNewProof}

              onMouseEnter={(e) => {

                e.target.style.background = 'rgba(59, 130, 246, 1)'

                e.target.style.borderColor = 'rgba(59, 130, 246, 0.7)'

              }}

              onMouseLeave={(e) => {

                e.target.style.background = 'rgba(59, 130, 246, 0.8)'

                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'

              }}

            >

              <span style={{

                fontSize: '1.2rem',

                fontWeight: 900,

                lineHeight: 1,

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'center',

                width: '100%',

                height: '100%',

                transform: 'translateY(-2px)'

              }}>+</span>

            </span>



            <span style={{

              fontSize: '0.85rem',

              fontWeight: 900,

              color: '#fff',

              background: 'rgba(59, 130, 246, 0.8)',

              padding: '4px 10px',

              borderRadius: '6px',

              border: '1px solid rgba(59, 130, 246, 0.5)',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center',

              cursor: 'pointer',

              transition: 'all 0.2s'

            }}

            title="View PDF in new tab"

            onClick={() => {

              // Handle PDF review functionality

              if (project?.share_token) {

                window.open(`/proof-review/${project.share_token}`, '_blank');

              } else {

                toastManager.add('No proof ID available for this proof', 'error');

              }

            }}

            onMouseEnter={(e) => {

              e.target.style.background = 'rgba(59, 130, 246, 1)'

              e.target.style.borderColor = 'rgba(59, 130, 246, 0.7)'

            }}

            onMouseLeave={(e) => {

              e.target.style.background = 'rgba(59, 130, 246, 0.8)'

              e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'

            }}

          >

            Review

          </span>



            </div>















            {/* Version Dropdown Tray */}



            {showVersionDropdown && (



              <div style={{



                position: 'absolute',



                top: '100%',



                right: '0',



                marginTop: '8px',



                background: 'rgba(30, 30, 40, 0.95)',



                backdropFilter: 'blur(20px)',



                WebkitBackdropFilter: 'blur(20px)',



                border: '1px solid rgba(255, 255, 255, 0.1)',



                borderRadius: '12px',



                padding: '12px',



                minWidth: '320px',



                maxWidth: '320px',



                maxHeight: '400px',



                overflow: 'auto',



                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',



                zIndex: 1000



              }}>



                <div style={{



                  fontSize: '0.75rem',



                  color: 'rgba(255, 255, 255, 0.6)',



                  fontWeight: 600,



                  textTransform: 'uppercase',



                  letterSpacing: '0.5px',



                  marginBottom: '8px',



                  paddingBottom: '8px',



                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',



                  textAlign: 'center'



                }}>



                  All Versions



                </div>



                {loadingVersions && !versionsFetched ? (



                  <div style={{



                    display: 'flex',



                    justifyContent: 'center',



                    alignItems: 'center',



                    padding: '20px',



                    color: 'rgba(255, 255, 255, 0.6)'



                  }}>



                    Loading versions...



                  </div>



                ) : allVersions.length > 0 ? (



                  <div style={{



                    display: 'flex',



                    flexDirection: 'column',



                    gap: '6px'



                  }}>



                    {allVersions.map((version) => (



                      <div



                        key={version.id}



                        onClick={() => {

                          // Close current dropdown and switch to the selected version

                          setShowVersionDropdown(false)

                          

                          // Trigger switching to the selected version

                          if (onProjectChanged) {

                            onProjectChanged(version)

                          } else if (onProjectCreated) {

                            // Fallback to onProjectCreated if onProjectChanged is not provided

                            onProjectCreated(version)

                          } else {

                            // Final fallback: navigate to the project view

                            window.location.href = `/project/${version.id}`

                          }

                        }}



                        style={{



                          display: 'flex',



                          alignItems: 'center',



                          gap: '8px',



                          padding: '8px 10px',



                          borderRadius: '6px',



                          cursor: 'pointer',



                          transition: 'all 0.2s',



                          background: version.id === highestVersionId ? 'rgba(255, 255, 255, 0.1)' : 'transparent',



                          border: version.id === highestVersionId ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent'



                        }}



                        onMouseEnter={(e) => {



                          if (version.id !== highestVersionId) {



                            e.target.style.background = 'rgba(255, 255, 255, 0.05)'



                          }



                        }}



                        onMouseLeave={(e) => {



                          if (version.id !== highestVersionId) {



                            e.target.style.background = 'transparent'



                          }



                        }}



                      >



                        <span style={{



                          fontSize: '0.75rem',



                          fontWeight: 700,



                          color: '#fff',



                          textTransform: 'uppercase',



                          letterSpacing: '0.5px',



                          flexShrink: 0,



                          minWidth: '30px'



                        }}>



                          V{version.version_number || 1}



                        </span>



                        <span style={{



                          overflow: 'hidden',



                          textOverflow: 'ellipsis',



                          whiteSpace: 'nowrap',



                          flex: 1,



                          fontSize: '0.8rem',



                          color: 'rgba(255, 255, 255, 0.9)'



                        }}>



                          {version.name || 'Untitled Proof'}



                        </span>



                        {version.id === highestVersionId && (



                          <span style={{



                            fontSize: '0.7rem',



                            color: 'rgba(255, 255, 255, 0.5)',



                            fontWeight: 500



                          }}>



                            Current



                          </span>



                        )}



                      </div>



                    ))}



                  </div>



                ) : (



                  <div style={{



                    display: 'flex',



                    justifyContent: 'center',



                    alignItems: 'center',



                    padding: '20px',



                    color: 'rgba(255, 255, 255, 0.6)',



                    fontSize: '0.8rem'



                  }}>



                    No other versions found



                  </div>



                )}



              </div>



            )}







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

                  if (project?.share_token) {

                    window.open(`/proof-review/${project.share_token}`, '_blank')

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







                  {displayProject?.folder?.name || displayProject?.folder_name || 'N/A'}







                </span>







              </div>















              {/* Status */}







              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '36px' }}>







                <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, width: '80px' }}>Status</span>







                {(() => {







                  // Show loading state instead of defaulting to not_started to prevent incorrect display
                  const status = reviewCycle?.status || (project ? 'loading' : 'not_started')









                  const statusConfig = {









                    loading: {









                      color: 'rgba(255,255,255,0.5)',



                      background: 'transparent',



                      border: '1px solid rgba(255,255,255,0.3)',



                      icon: '...',



                      label: 'Loading' 









                    }, 







                    not_started: {









                      color: '#FFFFFF', 







                      background: 'transparent', 







                      border: '1px solid #D1D5DB', 







                      icon: '\ud83d\ude34', 







                      label: 'Not Started' 









}, 







in_progress: {









color: '#D97706', 







background: 'transparent', 









                      border: '1px solid #F59E0B', 







                      icon: '\u231B', 







                      label: 'In Progress' 







                    }, 







                    approved: {











                      color: '#10B981',







                      background: 'rgba(16,185,129,0.15)',







                      border: '1px solid rgba(16,185,129,0.4)',







                      icon: '✅',







                      label: 'Approved'







                    },







                    approved_with_changes: {







                      color: '#3B82F6',







                      background: 'rgba(59,130,246,0.15)',







                      border: '1px solid rgba(59,130,246,0.4)',







                      icon: '✓',







                      label: 'Approved with Changes'







                    },







                    rejected: {







                      color: '#EF4444',







                      background: 'rgba(239,68,68,0.15)',







                      border: '1px solid rgba(239,68,68,0.4)',







                      icon: '❌',







                      label: 'Rejected'







                    }







                  }







                  const config = statusConfig[status] || statusConfig.not_started







                  







                  return (







                    <span style={{ 







                      fontSize: '0.75rem', 







                      color: config.color, 







                      fontWeight: 600,







                      display: 'flex',







                      alignItems: 'center',







                      gap: '6px',







                      padding: '4px 10px',







                      background: config.background,







                      borderRadius: '6px',







                      border: config.border







                    }}>







                      {typeof config.icon === 'string' ? (







                        <span style={{ fontSize: (config.icon === '\u231B' || config.icon === '\ud83d\ude34') ? '18px' : '14px' }}>{config.icon}</span>







                      ) : (







                        config.icon







                      )}







                      {config.label}







                    </span>







                  )







                })()}







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















          {/* Workflow Section Divider */}







          <div style={{







            width: '100%',







            height: '1px',







            background: 'rgba(255, 255, 255, 0.15)',







            margin: '32px 0 24px 0'







          }} />















          {/* Sub-Tab Navigation */}







          <div style={{







            display: 'flex',







            gap: '4px',







            marginBottom: '20px',







            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',







            paddingBottom: '0'







          }}>







            {['workflow', 'brief', 'integrations', 'settings', 'activity', 'emails'].map((tab) => (







              <button







                key={tab}







                onClick={() => setActiveSubTab(tab)}







                style={{







                  padding: '10px 16px',







                  background: activeSubTab === tab ? 'rgba(10, 132, 255, 0.1)' : 'transparent',







                  border: 'none',







                  borderBottom: activeSubTab === tab ? '2px solid #0A84FF' : '2px solid transparent',







                  color: activeSubTab === tab ? '#0A84FF' : 'rgba(255, 255, 255, 0.6)',







                  fontSize: '0.85rem',







                  fontWeight: 600,







                  cursor: 'pointer',







                  transition: 'all 0.2s',







                  textTransform: 'capitalize',







                  borderRadius: '6px 6px 0 0'







                }}







                onMouseEnter={(e) => {







                  if (activeSubTab !== tab) {







                    e.target.style.background = 'rgba(255, 255, 255, 0.05)'







                    e.target.style.color = 'rgba(255, 255, 255, 0.8)'







                  }







                }}







                onMouseLeave={(e) => {







                  if (activeSubTab !== tab) {







                    e.target.style.background = 'transparent'







                    e.target.style.color = 'rgba(255, 255, 255, 0.6)'







                  }







                }}







              >







                {tab}







              </button>







            ))}







          </div>















          {/* Sub-Tab Content */}







          {activeSubTab === 'workflow' ? (







            <div>







              {loadingWorkflow ? (







                <div style={{ textAlign: 'center', padding: '40px 0' }}>







                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>







                    Loading workflow...







                  </div>







                </div>







              ) : !reviewCycle ? (







                <div style={{ textAlign: 'center', padding: '40px 0' }}>







                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>







                  <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>







                    No Active Workflow







                  </h3>







                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>







                    This proof doesn't have an active workflow yet.







                  </p>







                </div>







              ) : (







                <>

                  {/* Workflow Status Overview - HIDDEN */}

                  {/* <div style={{

                    background: 'rgba(255,255,255,0.03)',

                    border: '1px solid rgba(255,255,255,0.08)',

                    borderRadius: '12px',

                    padding: '16px 20px',

                    marginBottom: '24px',

                    display: 'flex',

                    alignItems: 'center',

                    justifyContent: 'space-between'

                  }}>

                    <div>

                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>

                        Overall Status

                      </div>

                      {(() => {

                        // Show loading state instead of defaulting to not_started to prevent incorrect display
                  const status = reviewCycle?.proof_status || (project ? 'loading' : 'not_started')

                        const statusConfig = {

                          loading: {

                            color: 'rgba(255,255,255,0.5)',

                            background: 'transparent',

                            border: '1px solid rgba(255,255,255,0.3)',

                            icon: '...',

                            label: 'Loading'

                          },

                          not_started: {

                            color: '#FFFFFF',

                            background: 'transparent',

                            border: '1px solid #D1D5DB',

                            icon: '\ud83d\ude34',

                            label: 'Not Started'

                          },

                          in_progress: {

                            color: '#D97706',

                            background: 'transparent',

                            border: '1px solid #F59E0B',

                            icon: '\u231B',

                            label: 'In Progress'

                          },

                          approved: {

                            color: '#10B981',

                            background: 'rgba(16,185,129,0.15)',

                            border: '1px solid rgba(16,185,129,0.4)',

                            icon: '✅',

                            label: 'Approved'

                          },

                          approved_with_changes: {

                            color: '#3B82F6',

                            background: 'rgba(59,130,246,0.15)',

                            border: '1px solid rgba(59,130,246,0.4)',

                            icon: '✓',

                            label: 'Approved with Changes'

                          },

                          rejected: {

                            color: '#EF4444',

                            background: 'rgba(239,68,68,0.15)',

                            border: '1px solid rgba(239,68,68,0.4)',

                            icon: '❌',

                            label: 'Rejected'

                          }

                        }

                        const config = statusConfig[status] || statusConfig.not_started

                        

                        return (

                          <span style={{ 

                            fontSize: '0.85rem', 

                            color: config.color, 

                            fontWeight: 600,

                            display: 'flex',

                            alignItems: 'center',

                            gap: '8px',

                            padding: '6px 12px',

                            background: config.background,

                            borderRadius: '8px',

                            border: config.border,

                            width: 'fit-content'

                          }}>

                            {typeof config.icon === 'string' ? (

                              <span style={{ fontSize: (config.icon === '\u231B' || config.icon === '\ud83d\ude34') ? '20px' : '16px' }}>{config.icon}</span>

                            ) : (

                              config.icon

                            )}

                            {config.label}

                          </span>

                        )

                      })()}

                    </div>

                  </div> */}



                  {/* User Status Card - HIDDEN */}

                  {/* {myMember && (

                    <div style={{

                      background: 'rgba(255,255,255,0.05)',

                      border: '1px solid rgba(255,255,255,0.1)',

                      borderRadius: '12px',

                      padding: '20px',

                      marginBottom: '24px'

                    }}>

                      <div style={{ marginBottom: '16px' }}>

                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>

                          Your Status

                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                          <span style={{

                            padding: '6px 12px',

                            borderRadius: '6px',

                            fontSize: '0.85rem',

                            fontWeight: 600,

                            background: myMember.socd_status === 'sent' ? 'rgba(156,163,175,0.2)' :

                                       myMember.socd_status === 'open' ? 'rgba(16,185,129,0.2)' :

                                       myMember.socd_status === 'commented' ? 'rgba(59,130,246,0.2)' :

                                       'rgba(16,185,129,0.2)',

                            color: myMember.socd_status === 'sent' ? '#9CA3AF' :

                                   myMember.socd_status === 'open' ? '#10B981' :

                                   myMember.socd_status === 'commented' ? '#3B82F6' :

                                   '#10B981',

                            border: myMember.socd_status === 'sent' ? '1px solid rgba(156,163,175,0.3)' :

                                    myMember.socd_status === 'open' ? '1px solid rgba(16,185,129,0.3)' :

                                    myMember.socd_status === 'commented' ? '1px solid rgba(59,130,246,0.3)' :

                                    '1px solid rgba(16,185,129,0.3)'

                          }}>

                            {myMember.socd_status === 'sent' ? '⚪ Sent' :

                             myMember.socd_status === 'open' ? '🟢 Opened' :

                             myMember.socd_status === 'commented' ? '🔵 Commented' :

                             '✅ Decision Made'}

                          </span>

                        </div>

                      </div>

                      

                      <div style={{ marginBottom: '16px' }}>

                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>

                          Group

                        </div>

                        <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>

                          {myMember.group?.name || 'Unknown Group'}

                        </div>

                      </div>



                      {myMember.group?.status === 'locked' && (

                        <div style={{

                          display: 'flex',

                          alignItems: 'center',

                          gap: '8px',

                          padding: '12px',

                          background: 'rgba(251,191,36,0.1)',

                          border: '1px solid rgba(251,191,36,0.3)',

                          borderRadius: '8px',

                          color: '#FBBF24',

                          fontSize: '0.85rem'

                        }}>

                          <Lock size={16} />

                          <span>Group is locked - waiting for previous stage</span>

                        </div>

                      )}



                      {myMember.decision !== 'pending' && (

                        <div style={{

                          display: 'flex',

                          alignItems: 'center',

                          gap: '8px',

                          padding: '12px',

                          background: 'rgba(16,185,129,0.1)',

                          border: '1px solid rgba(16,185,129,0.3)',

                          borderRadius: '8px',

                          color: '#10B981',

                          fontSize: '0.85rem'

                        }}>

                          <CheckCircle size={16} />

                          <span>You have made your decision: {myMember.decision}</span>

                        </div>

                      )}

                    </div>

                  )} */}



                  {/* Action Buttons - HIDDEN */}

                  {/* {myMember && currentUser?.profile?.role !== 'lite_user' && (

                    <div style={{ marginBottom: '24px' }}>

                      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '12px', fontWeight: 600 }}>

                        Actions

                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        <button

                          onClick={handleAddComment}

                          disabled={myMember.group?.status === 'locked' || myMember.decision !== 'pending'}

                          style={{

                            display: 'flex',

                            alignItems: 'center',

                            gap: '12px',

                            padding: '14px 18px',

                            background: myMember.group?.status === 'locked' || myMember.decision !== 'pending' 

                              ? 'rgba(255,255,255,0.05)' 

                              : 'rgba(59,130,246,0.15)',

                            border: myMember.group?.status === 'locked' || myMember.decision !== 'pending'

                              ? '1px solid rgba(255,255,255,0.1)'

                              : '1px solid rgba(59,130,246,0.3)',

                            borderRadius: '10px',

                            color: myMember.group?.status === 'locked' || myMember.decision !== 'pending'

                              ? 'rgba(255,255,255,0.4)'

                              : '#3B82F6',

                            fontSize: '0.95rem',

                            fontWeight: 600,

                            cursor: myMember.group?.status === 'locked' || myMember.decision !== 'pending' ? 'not-allowed' : 'pointer',

                            transition: 'all 0.2s'

                          }}

                          onMouseEnter={(e) => {

                            if (myMember.group?.status !== 'locked' && myMember.decision === 'pending') {

                              e.target.style.background = 'rgba(59,130,246,0.25)'

                            }

                          }}

                          onMouseLeave={(e) => {

                            if (myMember.group?.status !== 'locked' && myMember.decision === 'pending') {

                              e.target.style.background = 'rgba(59,130,246,0.15)'

                            }

                          }}

                        >

                          <MessageSquare size={20} />

                          <span>Add Comment</span>

                        </button>



                        <button

                          onClick={handleApprove}

                          disabled={myMember.group?.status === 'locked' || myMember.decision !== 'pending'}

                          style={{

                            display: 'flex',

                            alignItems: 'center',

                            gap: '12px',

                            padding: '14px 18px',

                            background: myMember.group?.status === 'locked' || myMember.decision !== 'pending'

                              ? 'rgba(255,255,255,0.05)'

                              : 'rgba(16,185,129,0.15)',

                            border: myMember.group?.status === 'locked' || myMember.decision !== 'pending'

                              ? '1px solid rgba(255,255,255,0.1)'

                              : '1px solid rgba(16,185,129,0.3)',

                            borderRadius: '10px',

                            color: myMember.group?.status === 'locked' || myMember.decision !== 'pending'

                              ? 'rgba(255,255,255,0.4)'

                              : '#10B981',

                            fontSize: '0.95rem',

                            fontWeight: 600,

                            cursor: myMember.group?.status === 'locked' || myMember.decision !== 'pending' ? 'not-allowed' : 'pointer',

                            transition: 'all 0.2s'

                          }}

                          onMouseEnter={(e) => {

                            if (myMember.group?.status !== 'locked' && myMember.decision === 'pending') {

                              e.target.style.background = 'rgba(16,185,129,0.25)'

                            }

                          }}

                          onMouseLeave={(e) => {

                            if (myMember.group?.status !== 'locked' && myMember.decision === 'pending') {

                              e.target.style.background = 'rgba(16,185,129,0.15)'

                            }

                          }}

                        >

                          <CheckCircle size={20} />

                          <span>Approve</span>

                        </button>



                        <button

                          onClick={handleReject}

                          disabled={myMember.group?.status === 'locked' || myMember.decision !== 'pending'}

                          style={{

                            display: 'flex',

                            alignItems: 'center',

                            gap: '12px',

                            padding: '14px 18px',

                            background: myMember.group?.status === 'locked' || myMember.decision !== 'pending'

                              ? 'rgba(255,255,255,0.05)'

                              : 'rgba(239,68,68,0.15)',

                            border: myMember.group?.status === 'locked' || myMember.decision !== 'pending'

                              ? '1px solid rgba(255,255,255,0.1)'

                              : '1px solid rgba(239,68,68,0.3)',

                            borderRadius: '10px',

                            color: myMember.group?.status === 'locked' || myMember.decision !== 'pending'

                              ? 'rgba(255,255,255,0.4)'

                              : '#EF4444',

                            fontSize: '0.95rem',

                            fontWeight: 600,

                            cursor: myMember.group?.status === 'locked' || myMember.decision !== 'pending' ? 'not-allowed' : 'pointer',

                            transition: 'all 0.2s'

                          }}

                          onMouseEnter={(e) => {

                            if (myMember.group?.status !== 'locked' && myMember.decision === 'pending') {

                              e.target.style.background = 'rgba(239,68,68,0.25)'

                            }

                          }}

                          onMouseLeave={(e) => {

                            if (myMember.group?.status !== 'locked' && myMember.decision === 'pending') {

                              e.target.style.background = 'rgba(239,68,68,0.15)'

                            }

                          }}

                        >

                          <XCircle size={20} />

                          <span>Reject</span>

                        </button>

                      </div>

                    </div>

                  )} */}



                  {/* Lite User View Only Message - HIDDEN */}

                  {/* {currentUser?.profile?.role === 'lite_user' && (

                    <div style={{

                      padding: '20px',

                      background: 'rgba(156,163,175,0.1)',

                      border: '1px solid rgba(156,163,175,0.2)',

                      borderRadius: '12px',

                      textAlign: 'center',

                      marginBottom: '24px'

                    }}>

                      <Eye size={32} style={{ color: '#9CA3AF', marginBottom: '12px' }} />

                      <div style={{ color: '#9CA3AF', fontSize: '0.95rem', fontWeight: 600 }}>

                        View Only Access

                      </div>

                      <div style={{ color: 'rgba(156,163,175,0.7)', fontSize: '0.85rem', marginTop: '4px' }}>

                        You can view the workflow but cannot make decisions

                      </div>

                    </div>

                  )} */}



                  {/* Workflow Progress */}







                  {groups.length > 0 && (







                    <div>







                      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '12px', fontWeight: 600 }}>







                        Workflow Progress







                      </div>







                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>







                        {groups.map((group, index) => (







                          <div







                            key={group.id}







                            style={{







                              padding: '16px',







                              background: group.status === 'in_progress' || group.status === 'unlocked'







                                ? 'rgba(10,132,255,0.1)'







                                : group.status === 'completed'







                                ? 'rgba(16,185,129,0.1)'







                                : 'rgba(255,255,255,0.05)',







                              border: group.status === 'in_progress' || group.status === 'unlocked'







                                ? '1px solid rgba(10,132,255,0.3)'







                                : group.status === 'completed'







                                ? '1px solid rgba(16,185,129,0.3)'







                                : '1px solid rgba(255,255,255,0.1)',







                              borderRadius: '10px'







                            }}







                          >







                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>







                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>







                                <span style={{







                                  width: '28px',







                                  height: '28px',







                                  borderRadius: '50%',







                                  background: group.status === 'completed' ? '#10B981' : group.status === 'locked' ? '#6B7280' : '#0A84FF',







                                  color: '#fff',







                                  display: 'flex',







                                  alignItems: 'center',







                                  justifyContent: 'center',







                                  fontSize: '0.85rem',







                                  fontWeight: 700







                                }}>







                                  {group.status === 'completed' ? '✓' : index + 1}







                                </span>







                                <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>







                                  {group.name}







                                </span>







                              </div>







                              <span style={{







                                padding: '4px 10px',







                                borderRadius: '6px',







                                fontSize: '0.75rem',







                                fontWeight: 600,



                                background: group.stage_status === 'not_started' ? 'rgba(107,114,128,0.2)' :



                                           group.stage_status === 'in_progress' ? 'rgba(10,132,255,0.2)' :



                                           group.stage_status === 'approved' ? 'rgba(16,185,129,0.2)' :



                                           group.stage_status === 'rejected' ? 'rgba(239,68,68,0.2)' :



                                           group.stage_status === 'approved_with_changes' ? 'rgba(251,191,36,0.2)' :



                                           'rgba(251,191,36,0.2)',



                                color: group.stage_status === 'not_started' ? '#6B7280' :



                                       group.stage_status === 'in_progress' ? '#0A84FF' :



                                       group.stage_status === 'approved' ? '#10B981' :



                                       group.stage_status === 'rejected' ? '#EF4444' :



                                       group.stage_status === 'approved_with_changes' ? '#FBB024' :



                                       '#FBB024'





                              }}>



                                {group.stage_status === 'not_started' ? 'Not Started' :



                                 group.stage_status === 'in_progress' ? 'In Progress' :



                                 group.stage_status === 'approved' ? '✓ Approved' :



                                 group.stage_status === 'rejected' ? '✗ Rejected' :



                                 group.stage_status === 'approved_with_changes' ? 'Approved with Changes' :

                                 'Action Required'}

                              </span>







                            </div>







                            {group.members && group.members.length > 0 && (







                              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>







                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>







                                  Members ({group.members.length})







                                </div>







                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>







                                  {group.members.map(member => (







                                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>







                                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>







                                        {member.user?.username || 'Unknown'}







                                      </span>







                                      <span style={{ 
                                        fontSize: '0.7rem',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                        background: member.reviewer_progress === 'not_started' ? 'rgba(107,114,128,0.2)' :
                                                   member.reviewer_progress === 'reviewing' ? 'rgba(10,132,255,0.2)' :
                                                   member.reviewer_progress === 'approved' ? 'rgba(16,185,129,0.2)' :
                                                   member.reviewer_progress === 'rejected' ? 'rgba(239,68,68,0.2)' :
                                                   'rgba(251,191,36,0.2)',
                                        color: member.reviewer_progress === 'not_started' ? '#6B7280' :
                                               member.reviewer_progress === 'reviewing' ? '#0A84FF' :
                                               member.reviewer_progress === 'approved' ? '#10B981' :
                                               member.reviewer_progress === 'rejected' ? '#EF4444' :
                                               '#FBB024'
                                      }}>
                                        {member.reviewer_progress === 'not_started' ? 'Not Started' :
                                         member.reviewer_progress === 'reviewing' ? 'Reviewing' :
                                         member.reviewer_progress === 'approved' ? 'Approved' :
                                         member.reviewer_progress === 'rejected' ? 'Rejected' :
                                         'Approved with Changes'}
                                      </span>







                                    </div>







                                  ))}







                                </div>







                              </div>







                            )}







                          </div>







                        ))}







                      </div>







                    </div>







                  )}







                </>







              )}







            </div>







          ) : (







            /* Placeholder for other sub-tabs */







            <div style={{







              textAlign: 'center',







              padding: '60px 20px',







              background: 'rgba(255,255,255,0.02)',







              borderRadius: '12px',







              border: '1px solid rgba(255,255,255,0.05)'







            }}>







              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>







              <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>







                Coming Soon







              </h3>







              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>







                The {activeSubTab} section is under development







              </p>







            </div>







          )}







        </div>







      </div>







      







      {/* Decision Modal */}







      {showDecisionModal && reviewCycle && myMember && (







        <DecisionModal







          isOpen={showDecisionModal}







          onClose={() => setShowDecisionModal(false)}







          reviewCycleId={reviewCycle.id}







          myMember={myMember}







          onDecisionSuccess={handleDecisionSuccess}







          preselectedDecision={preselectedDecision}







        />







      )}







      







      <DeleteConfirmationModal







        isOpen={showDeleteModal}







        onClose={handleCancelDelete}







        onConfirm={handleConfirmDelete}







        title={displayProject?.name || 'Untitled Proof'}







        deleting={deleting}







      />







      <CreateProofModal







        isOpen={showCreateModal}







        onClose={() => setShowCreateModal(false)}







        onSuccess={() => {

          setShowCreateModal(false)

          onClose() // Close the ProjectDetailsTray

          if (onProjectCreated) {

            onProjectCreated() // Refresh parent data

          }

        }}







        parentProject={displayProject}







      />







    </>







  )







}















export default ProjectDetailsTray







