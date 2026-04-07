import React, { useState, useEffect } from 'react'



import CrushLoader from '../components/CrushLoader'



import Pagination from '../components/Pagination'



import { Folder, Plus, Trash2, Edit2, X, ChevronDown, ChevronRight, FileText, Search, XCircle, ChevronLeft, Users } from 'lucide-react'



import { toastManager } from '../utils/toastManager'



import StatusBadge from '../components/StatusBadge'



import api from '../services/api'



import { useNavigate } from 'react-router-dom'



import DeleteConfirmationModal from '../components/DeleteConfirmationModal'



import ProjectDetailsTray from '../components/ProjectDetailsTray'



import FolderMembersModal from '../components/FolderMembersModal'



import { useAuthStore } from '../stores/authStore'



const FOLDER_COLORS = [

  { gradient: 'linear-gradient(135deg, #FF9500, #FF8C00)', label: 'Orange' },

  { gradient: 'linear-gradient(135deg, #FF69B4, #FF1493)', label: 'Pink' },

  { gradient: 'linear-gradient(135deg, #FF6B6B, #FF4444)', label: 'Red' },

  { gradient: 'linear-gradient(135deg, #9B59B6, #8E44AD)', label: 'Purple' },

  { gradient: 'linear-gradient(135deg, #20B2AA, #17A2B8)', label: 'Teal' }

]



const getFolderColor = (folderId) => {

  return FOLDER_COLORS[folderId % FOLDER_COLORS.length]

}



function Folders() {



  const navigate = useNavigate()

  

  const { 

    canCreateContent, 

    canEditContent, 

    canDeleteContent,

    canViewContent,

    canAddMember,

    canCreateFolder,

    canAddProof,

    user 

  } = useAuthStore()



  const [folders, setFolders] = useState([])



  const [loading, setLoading] = useState(true)



  const [showCreateModal, setShowCreateModal] = useState(false)



  const [newFolderName, setNewFolderName] = useState('')



  const [newFolderDescription, setNewFolderDescription] = useState('')



  const [newFolderNameError, setNewFolderNameError] = useState('')



  const [editingFolder, setEditingFolder] = useState(null)



  const [editName, setEditName] = useState('')



  const [editDescription, setEditDescription] = useState('')



  const [editNameError, setEditNameError] = useState('')



  const [expandedFolder, setExpandedFolder] = useState(null)



  const [folderProjects, setFolderProjects] = useState({})



  const [showDeleteModal, setShowDeleteModal] = useState(false)



  const [projectToDelete, setProjectToDelete] = useState(null)



  const [deleting, setDeleting] = useState(false)



  const [selectedProject, setSelectedProject] = useState(null)



  const [isTrayOpen, setIsTrayOpen] = useState(false)



  // Add Proofs modal state

  const [showAddProofsModal, setShowAddProofsModal] = useState(false)

  const [allProofs, setAllProofs] = useState([])

  const [proofsLoading, setProofsLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')

  const [showProofsDropdown, setShowProofsDropdown] = useState(false)

  const [selectedProofsToAdd, setSelectedProofsToAdd] = useState([])

  const [addingProofs, setAddingProofs] = useState(false)

  const [folderToDelete, setFolderToDelete] = useState(null)

  const [showFolderDeleteModal, setShowFolderDeleteModal] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)

  const foldersPerPage = 5

  const [currentUser, setCurrentUser] = useState(null)

  const [showMembersModal, setShowMembersModal] = useState(false)

  const [selectedFolderForMembers, setSelectedFolderForMembers] = useState(null)







  const fetchFolders = async () => {



    try {



      setLoading(true)



      let allFolders = []

      let nextUrl = '/versioning/folders/'



      // Fetch all folders across all backend pagination pages

      while (nextUrl) {

        const response = await api.get(nextUrl)

        const folders = response.data.results || response.data

        

        if (Array.isArray(folders)) {

          allFolders = allFolders.concat(folders)

        } else {

          allFolders = folders

          break

        }



        // Check if there's a next page

        nextUrl = response.data.next || null

      }



      setFolders(allFolders)



    } catch (error) {



      toastManager.fetchError('Failed to fetch folders', 'fetch-error')



      console.error('Error fetching folders:', error)



    } finally {



      setLoading(false)



    }



  }



  const fetchFolderProjects = async (folderId) => {

    try {

      const response = await api.get(`/versioning/folders/${folderId}/projects/`)

      setFolderProjects(prev => ({ ...prev, [folderId]: response.data }))

    } catch (error) {

      console.error('Failed to fetch folder projects:', error)

    }

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

    fetchCurrentUser()

  }, [])



  // Setup WebSocket listener for real-time updates

  useEffect(() => {

    if (!currentUser) return



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

          console.log('✅ Folders WebSocket connected')

          reconnectAttempts = 0

        }

        

        ws.onmessage = (event) => {

          try {

            const data = JSON.parse(event.data)

            console.log('📨 Folders WebSocket message:', data)

            

            // Handle review cycle status updates

            if (data.type === 'review_cycle_update') {

              console.log('🔄 Folders: Review cycle updated:', data.review_cycle_id, 'Status:', data.status)

              

              // Update folder projects data directly if available

              setFolderProjects(prevProjects => {

                const updatedProjects = { ...prevProjects }

                Object.keys(updatedProjects).forEach(folderId => {

                  updatedProjects[folderId] = updatedProjects[folderId].map(project => {

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

                })

                return updatedProjects

              })

              

              // Refresh folder projects if expanded

              if (expandedFolder) {

                fetchFolderProjects(expandedFolder)

              }

              

              // Also refresh folders to get updated counts/stats

              fetchFolders()

            }

            

            // Handle folder updates

            if (data.type === 'folder_update') {

              console.log('🔄 Folders: Folder update received:', data.update_type, 'Folder:', data.folder_id)

              

              const updateType = data.update_type

              const folderId = data.folder_id

              

              if (updateType === 'folder_updated') {

                // Folder name or description changed

                toast.info(`Folder "${data.folder_name}" was updated`, { id: 'folder-update' })

                fetchFolders()

              } else if (updateType === 'folder_deleted') {

                // Folder was deleted

                toast.info(`Folder "${data.folder_name}" was deleted`, { id: 'folder-delete' })

                setFolders(prev => prev.filter(f => f.id !== folderId))

                if (expandedFolder === folderId) {

                  setExpandedFolder(null)

                }

              } else if (updateType === 'proof_added') {

                // Proof was added to folder

                toast.info(`Proof added to "${data.folder_name}"`, { id: 'proof-added' })

                if (expandedFolder === folderId) {

                  fetchFolderProjects(folderId)

                }

                fetchFolders()

              } else if (updateType === 'proof_removed') {

                // Proof was removed from folder

                toast.info(`Proof removed from "${data.folder_name}"`, { id: 'proof-removed' })

                if (expandedFolder === folderId) {

                  fetchFolderProjects(folderId)

                }

                fetchFolders()

              } else if (updateType === 'member_added') {

                // Member was added to folder

                toast.info(`New member added to "${data.folder_name}"`, { id: 'member-added' })

                fetchFolders()

              } else if (updateType === 'member_removed') {

                // Member was removed from folder

                if (data.data.user_id === currentUser.id) {

                  toast.warning(`You were removed from "${data.folder_name}"`, { id: 'member-removed' })

                  setFolders(prev => prev.filter(f => f.id !== folderId))

                  if (expandedFolder === folderId) {

                    setExpandedFolder(null)

                  }

                } else {

                  toast.info(`Member removed from "${data.folder_name}"`, { id: 'member-removed' })

                  fetchFolders()

                }

              } else if (updateType === 'member_role_updated') {

                // Member role was updated

                toast.info(`Member role updated in "${data.folder_name}"`, { id: 'role-updated' })

                fetchFolders()

              }

            }

          } catch (error) {

            console.error('Failed to parse WebSocket message:', error)

          }

        }

        

        ws.onerror = (error) => {

          console.error('❌ Folders WebSocket error:', error)

        }

        

        ws.onclose = () => {

          console.log('❌ Folders WebSocket disconnected')

          // Attempt to reconnect

          if (reconnectAttempts < maxReconnectAttempts) {

            reconnectAttempts++

            console.log(`Folders attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`)

            setTimeout(connectWebSocket, reconnectDelay)

          }

        }

      } catch (error) {

        console.error('Failed to connect Folders WebSocket:', error)

      }

    }



    connectWebSocket()



    // Cleanup on unmount

    return () => {

      if (ws) {

        ws.close()

      }

    }

  }, [currentUser, expandedFolder])



  // Refresh data when window regains focus (user returns from PDF viewer)

  useEffect(() => {

    const handleFocus = () => {

      console.log('🔄 Folders: Window focused - refreshing folders data')

      fetchFolders()

      // Also refresh expanded folder projects if a folder is expanded

      if (expandedFolder) {

        fetchFolderProjects(expandedFolder)

      }

    }



    window.addEventListener('focus', handleFocus)



    return () => {

      window.removeEventListener('focus', handleFocus)

    }

  }, [expandedFolder])



  useEffect(() => {



    fetchFolders()



  }, [])







  const handleCreateFolder = async (e) => {



    e.preventDefault()



    if (!newFolderName.trim()) {



      setNewFolderNameError('Please enter the folder name.')



      return



    }







    // Only check for duplicate folder name if there's actually a name entered



    const folderNameTrimmed = newFolderName.trim()



    const folderNameLower = folderNameTrimmed.toLowerCase()



    const existingFolder = folders.find(folder => folder.name.toLowerCase() === folderNameLower)



    if (existingFolder) {



      toastManager.error('Folder Already Exists', 'folder-toast')



      return



    }







    try {



      await api.post('/versioning/folders/', {



        name: folderNameTrimmed,



        description: newFolderDescription.trim()



      })



      toastManager.clearAll() // Clear all existing toasts



      toastManager.success('Folder created successfully', 'folder-toast')



      setShowCreateModal(false)



      setNewFolderName('')



      setNewFolderDescription('')



      setNewFolderNameError('')



      setCurrentPage(1)



      fetchFolders()



    } catch (error) {



      // Show the actual error from backend

      const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Failed to create folder'

      

      if (error.response?.status === 403) {

        toastManager.error(

          'You do not have permission to perform this action.\nPlease contact your administrator for assistance.',

          'permission-denied',

          {

            style: {

              textAlign: 'center',

              whiteSpace: 'pre-line'

            }

          }

        )

      } else {

        toastManager.error(errorMsg, 'folder-toast')

      }



    }



  }







  const handleDeleteFolder = (folderId) => {

    setFolderToDelete(folderId)

    setShowFolderDeleteModal(true)

  }



  const confirmDeleteFolder = async () => {

    if (!folderToDelete) return

    

    try {

      // Check if this is the only item on current page before deletion

      const isOnlyItemOnPage = paginatedFolders.length === 1

      const shouldGoToPreviousPage = isOnlyItemOnPage && currentPage > 1

      

      await api.delete(`/versioning/folders/${folderToDelete}/`)

      toastManager.clearAll() // Clear all existing toasts

      toastManager.success('Folder deleted successfully', 'folder-toast')

      

      // Fetch updated folders

      const response = await api.get('/versioning/folders/')

      const foldersData = response.data.results || response.data || []

      setFolders(foldersData)

      

      // If there's only one item on current page and we're not on page 1, go to previous page

      if (shouldGoToPreviousPage) {

        setCurrentPage(currentPage - 1)

      }

    } catch (error) {

      const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Failed to delete folder'

      

      if (error.response?.status === 403) {

        toastManager.error(

          'You do not have permission to perform this action.\nPlease contact your administrator for assistance.',

          'permission-denied',

          {

            style: {

              textAlign: 'center',

              whiteSpace: 'pre-line'

            }

          }

        )

      } else {

        toastManager.deleteError(errorMsg, 'folder-toast')

      }

    } finally {

      setShowFolderDeleteModal(false)

      setFolderToDelete(null)

    }

  }



  const cancelDeleteFolder = () => {

    setShowFolderDeleteModal(false)

    setFolderToDelete(null)

  }







  const handleEditFolder = async (e) => {



    e.preventDefault()



    if (!editName.trim()) {



      setEditNameError('Please enter the folder name.')



      return



    }







    try {



      await api.patch(`/versioning/folders/${editingFolder.id}/`, {



        name: editName.trim(),



        description: editDescription.trim()



      })



      toastManager.clearAll() // Clear all existing toasts

      toastManager.success('Folder updated successfully', 'folder-toast')



      setEditingFolder(null)



      setEditName('')



      setEditDescription('')



      setEditNameError('')



      fetchFolders()



    } catch (error) {



      const errorMsg = error.response?.data?.name?.[0] || error.response?.data?.detail || 'Failed to update folder'

      

      if (error.response?.status === 403) {

        toastManager.error(

          'You do not have permission to perform this action.\nPlease contact your administrator for assistance.',

          'permission-denied',

          {

            style: {

              textAlign: 'center',

              whiteSpace: 'pre-line'

            }

          }

        )

      } else {

        toastManager.error(errorMsg, 'folder-toast')

      }



    }



  }







  // Close Create Folder modal and clear values

  const closeCreateModal = () => {

    setShowCreateModal(false)

    setNewFolderName('')

    setNewFolderDescription('')

    setNewFolderNameError('')

  }



  // Close Edit Folder modal and clear values

  const closeEditModal = () => {

    setEditingFolder(null)

    setEditName('')

    setEditDescription('')

    setEditNameError('')

  }



  const openEditModal = (folder) => {

    setEditingFolder(folder)

    setEditName(folder.name)

    setEditDescription(folder.description || '')

    setEditNameError('')

  }







  const toggleFolder = async (folderId) => {



    if (expandedFolder === folderId) {



      setExpandedFolder(null)



    } else {



      setExpandedFolder(folderId)



      // Fetch projects for this folder if not already loaded



      if (!folderProjects[folderId]) {



        try {



          const response = await api.get(`/versioning/folders/${folderId}/projects/`)



          setFolderProjects(prev => ({ ...prev, [folderId]: response.data }))



        } catch (error) {



          toastManager.fetchError('Failed to load folder projects', 'fetch-error')



        }



      }



    }



  }







  const navigateToProof = (project) => {



    setSelectedProject(project)



    setIsTrayOpen(true)



    navigate(`/folders/proof/${project.share_token}`)



  }







  const closeTray = () => {



    setIsTrayOpen(false)



    setTimeout(() => setSelectedProject(null), 300)



  }







  const handleDeleteClick = (e, project) => {



    e.stopPropagation()



    setProjectToDelete(project)



    setShowDeleteModal(true)



  }







  const handleConfirmDelete = async () => {

    if (!projectToDelete) return

    

    const projectId = projectToDelete.id

    setDeleting(true)

    try {

      console.log('[Remove] Starting removal of project', projectId, 'from folder', expandedFolder)

      

      // First, let's check the current project state

      const beforeCheck = await api.get(`/versioning/projects/${projectId}/`)

      console.log('[Remove] Project before update:', beforeCheck.data)

      

      // Remove project from folder by setting folder_id to null

      const updateResponse = await api.patch(`/versioning/projects/${projectId}/`, {

        folder_id: null

      })

      console.log('[Remove] Update response:', updateResponse.data)

      

      // Verify the project was updated

      const afterCheck = await api.get(`/versioning/projects/${projectId}/`)

      console.log('[Remove] Project after update:', afterCheck.data)

      

      toastManager.clearAll() // Clear all existing toasts

      toastManager.success('Proof removed from folder', 'folder-toast')

      setShowDeleteModal(false)

      setProjectToDelete(null)

      

      // Update local state - force a clean update

      if (expandedFolder) {

        console.log('[Remove] Refreshing folder projects for folder', expandedFolder)

        

        // Clear the folder projects first to force re-render

        setFolderProjects(prev => ({

          ...prev,

          [expandedFolder]: []

        }))

        

        // Small delay to ensure state updates

        await new Promise(resolve => setTimeout(resolve, 100))

        

        // Fetch fresh data

        const refreshResponse = await api.get(`/versioning/folders/${expandedFolder}/projects/`)

        console.log('[Remove] Refreshed projects:', refreshResponse.data)

        

        setFolderProjects(prev => ({

          ...prev,

          [expandedFolder]: refreshResponse.data

        }))

        

        // Refresh folders to update project count

        fetchFolders()

      }

    } catch (error) {

      console.error('[Remove] Error:', error)

      console.error('[Remove] Response:', error.response?.data)

      

      // Check for 403 Forbidden error and show appropriate message

      if (error.response?.status === 403) {

        toastManager.permission('You do not have permission to perform this action.\nPlease contact your administrator for assistance.', 'folder-toast')

      } else {

        toastManager.deleteError('Failed to remove proof: ' + (error.response?.data?.error || error.message), 'folder-toast')

      }

    } finally {

      setDeleting(false)

    }

  }







  const handleCancelDelete = () => {



    setShowDeleteModal(false)



    setProjectToDelete(null)



  }



  // Add Proofs feature functions

  const fetchAllProofs = async () => {

    setProofsLoading(true)

    try {

      const response = await api.get('/versioning/projects/')

      const proofs = response.data.results || response.data || []

      const currentFolderProofs = folderProjects[expandedFolder] || []

      const currentFolderProofIds = currentFolderProofs.map(p => p.id)

      const availableProofs = proofs.filter(p => !currentFolderProofIds.includes(p.id) && p.folder_id !== expandedFolder)

      setAllProofs(availableProofs)

    } catch (error) {

      toastManager.fetchError('Failed to fetch proofs', 'fetch-error')

      console.error('Error fetching proofs:', error)

    } finally {

      setProofsLoading(false)

    }

  }



  const openAddProofsModal = () => {

    setShowAddProofsModal(true)

    setSearchQuery('')

    setShowProofsDropdown(false)

    setSelectedProofsToAdd([])

    fetchAllProofs()

  }



  const closeAddProofsModal = () => {

    setShowAddProofsModal(false)

    setSearchQuery('')

    setShowProofsDropdown(false)

    setSelectedProofsToAdd([])

  }



  const toggleProofSelection = (proof) => {

    setSelectedProofsToAdd(prev => {

      const isSelected = prev.some(p => p.id === proof.id)

      if (isSelected) {

        return prev.filter(p => p.id !== proof.id)

      } else {

        return [...prev, proof]

      }

    })

  }



  const handleAddProofsToFolder = async () => {

    if (selectedProofsToAdd.length === 0) {

      toastManager.clearAll() // Clear all existing toasts

      toastManager.error('Please select at least one proof', 'folder-toast')

      return

    }



    setAddingProofs(true)

    try {

      await Promise.all(

        selectedProofsToAdd.map(proof =>

          api.patch(`/versioning/projects/${proof.id}/`, {

            folder_id: expandedFolder

          })

        )

      )

      toastManager.clearAll() // Clear all existing toasts

      toastManager.success('Added proofs to folder', 'folder-toast')

      closeAddProofsModal()

      const response = await api.get(`/versioning/folders/${expandedFolder}/projects/`)

      setFolderProjects(prev => ({ ...prev, [expandedFolder]: response.data }))

      fetchFolders()

    } catch (error) {

      console.error('Error adding proofs:', error)

      toastManager.clearAll() // Clear all existing toasts

      toastManager.error(

        'You do not have permission to perform this action.\nPlease contact your administrator for assistance.',

        'folder-toast',

        {

          style: {

            textAlign: 'center',

            whiteSpace: 'pre-line'

          }

        }

      )

    } finally {

      setAddingProofs(false)

    }

  }



  const filteredProofs = allProofs.filter(proof =>

    proof.name.toLowerCase().includes(searchQuery.toLowerCase())

  )



  // Pagination calculations

  const totalPages = Math.ceil(folders.length / foldersPerPage)

  const startIndex = (currentPage - 1) * foldersPerPage

  const endIndex = startIndex + foldersPerPage

  const paginatedFolders = folders.slice(startIndex, endIndex)



  return (



    <div style={{ padding: '36px 40px' }}>



      {/* Header */}



      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>



        <div>



          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', marginBottom: 8 }}>



            Folders



          </h1>



          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>



            Organize your proofs into folders for easy management



          </p>



        </div>



        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

          <Pagination

            currentPage={currentPage}

            totalPages={totalPages}

            onPageChange={setCurrentPage}

          />



          <button



            onClick={() => {

              setShowCreateModal(true)

              setNewFolderNameError('')

            }}



            className="btn-primary"



            style={{ borderRadius: 14, display: 'flex', alignItems: 'center', gap: 8 }}



          >



            <Plus size={18} /> Create Folder



          </button>

        </div>



      </div>







      {/* Folders Grid */}



      {loading ? (

        <CrushLoader text="Loading folders..." />



      ) : folders.length === 0 ? (



        <div style={{ textAlign: 'center', padding: '60px 0' }}>



          <Folder size={48} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 16px', display: 'block' }} />



          <p style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>No Folders Yet</p>



          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>



            Create your first folder to organize your proofs



          </p>



        </div>



      ) : (

        <>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>



          {paginatedFolders.map((folder) => (



            <div key={folder.id} className="glass-card" style={{ overflow: 'hidden' }}>



              {/* Folder Header */}



              <div



                onClick={() => toggleFolder(folder.id)}



                style={{



                  padding: '16px 20px',



                  cursor: 'pointer',



                  display: 'flex',



                  alignItems: 'center',



                  gap: 16,



                  transition: 'transform 0.2s, box-shadow 0.2s'



                }}



                onMouseEnter={(e) => {



                  e.currentTarget.style.transform = 'translateX(4px)'



                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3), 0 0 20px rgba(142,68,173,0.15)'



                }}



                onMouseLeave={(e) => {



                  e.currentTarget.style.transform = 'translateX(0)'



                  e.currentTarget.style.boxShadow = ''



                }}



              >



                {/* Expand/Collapse Icon */}



                <div style={{



                  width: 24,



                  height: 24,



                  display: 'flex',



                  alignItems: 'center',



                  justifyContent: 'center',



                  flexShrink: 0,



                  color: 'rgba(255,255,255,0.5)'



                }}>



                  {expandedFolder === folder.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}



                </div>







                {/* Folder Icon */}



                <div style={{



                  width: 48,



                  height: 48,



                  borderRadius: 12,



                  background: getFolderColor(folder.id).gradient,



                  display: 'flex',



                  alignItems: 'center',



                  justifyContent: 'center',



                  flexShrink: 0



                }}>



                  <Folder size={24} color="#fff" />



                </div>







                {/* Folder Info */}



                <div style={{ flex: 1, minWidth: 0 }}>



                  <h3 style={{



                    fontSize: '1rem',



                    fontWeight: 700,



                    color: '#fff',



                    marginBottom: 4,



                    whiteSpace: 'nowrap',



                    overflow: 'hidden',



                    textOverflow: 'ellipsis'



                  }}>



                    {folder.name}



                  </h3>



                </div>







                {/* Proof Count */}



                <span style={{



                  fontSize: '0.75rem',



                  color: 'rgba(255,255,255,0.4)',



                  display: 'flex',



                  alignItems: 'center',



                  gap: 4,



                  flexShrink: 0,



                  padding: '4px 10px',



                  background: 'rgba(255,255,255,0.05)',



                  borderRadius: 6



                }}>



                  {folder.project_count || 0} {folder.project_count === 1 ? 'proof' : 'proofs'}



                </span>







                {/* Action Buttons */}



                <div style={{



                  display: 'flex',



                  gap: 8,



                  flexShrink: 0



                }}>



                  <button



                    onClick={(e) => {



                      e.stopPropagation()



                      setSelectedFolderForMembers(folder)



                      setShowMembersModal(true)



                    }}



                    style={{



                      width: 32,



                      height: 32,



                      borderRadius: 8,



                      background: 'rgba(255,255,255,0.08)',



                      border: '1px solid rgba(255,255,255,0.1)',



                      color: 'rgba(255,255,255,0.6)',



                      cursor: 'pointer',



                      display: 'flex',



                      alignItems: 'center',



                      justifyContent: 'center',



                      transition: 'all 0.2s'



                    }}



                    onMouseEnter={(e) => {



                      e.currentTarget.style.background = 'rgba(142,68,173,0.2)'



                      e.currentTarget.style.color = '#8E44AD'



                    }}



                    onMouseLeave={(e) => {



                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'



                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)'



                    }}



                    title="Manage Members"



                  >



                    <Users size={14} />



                  </button>



                  <button

                    onClick={(e) => {

                      e.stopPropagation()

                      openEditModal(folder)

                    }}

                    style={{

                      width: 32,

                      height: 32,

                      borderRadius: 8,

                      background: 'rgba(255,255,255,0.08)',

                      border: '1px solid rgba(255,255,255,0.1)',

                      color: 'rgba(255,255,255,0.6)',

                      cursor: 'pointer',

                      display: 'flex',

                      alignItems: 'center',

                      justifyContent: 'center',

                      transition: 'all 0.2s'

                    }}

                    onMouseEnter={(e) => {

                      e.currentTarget.style.background = 'rgba(10,132,255,0.2)'

                      e.currentTarget.style.color = '#0A84FF'

                    }}

                    onMouseLeave={(e) => {

                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'

                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)'

                    }}

                    title="Edit Folder"

                  >

                    <Edit2 size={14} />

                  </button>



                  <button



                    onClick={(e) => {



                      e.stopPropagation()



                      setExpandedFolder(folder.id)



                      openAddProofsModal()



                    }}



                    title="Add Proof"



                    style={{



                      width: 32,



                      height: 32,



                      borderRadius: 8,



                      background: 'rgba(255,255,255,0.08)',



                      border: '1px solid rgba(255,255,255,0.1)',



                      color: 'rgba(255,255,255,0.6)',



                      cursor: 'pointer',



                      display: 'flex',



                      alignItems: 'center',



                      justifyContent: 'center',



                      transition: 'all 0.2s'



                    }}



                    onMouseEnter={(e) => {



                      e.currentTarget.style.background = 'rgba(48,209,88,0.2)'



                      e.currentTarget.style.color = '#30D158'



                    }}



                    onMouseLeave={(e) => {



                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'



                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)'



                    }}



                  >



                    <Plus size={14} />



                  </button>



                  <button

                    onClick={(e) => {

                      e.stopPropagation()

                      handleDeleteFolder(folder.id)

                    }}

                    style={{

                      width: 32,

                      height: 32,

                      borderRadius: 8,

                      background: 'rgba(255,255,255,0.08)',

                      border: '1px solid rgba(255,255,255,0.1)',

                      color: 'rgba(255,255,255,0.6)',

                      cursor: 'pointer',

                      display: 'flex',

                      alignItems: 'center',

                      justifyContent: 'center',

                      transition: 'all 0.2s'

                    }}

                    onMouseEnter={(e) => {

                      e.currentTarget.style.background = 'rgba(255,55,95,0.2)'

                      e.currentTarget.style.color = '#FF375F'

                    }}

                    onMouseLeave={(e) => {

                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'

                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)'

                    }}

                    title="Delete Folder"

                  >

                    <Trash2 size={14} />

                  </button>



                </div>



              </div>







              {/* Expanded Projects List */}



              {expandedFolder === folder.id && (



                <div style={{



                  borderTop: '1px solid rgba(255,255,255,0.1)',



                  background: 'rgba(0,0,0,0.2)'



                }}>



                  {!folderProjects[folder.id] ? (



                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>



                      Loading projects...



                    </div>



                  ) : folderProjects[folder.id].length === 0 ? (



                    <div style={{ padding: '20px', textAlign: 'center' }}>



                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>



                        No proofs in this folder



                      </p>



                    </div>



                  ) : (



                    <div style={{ padding: '12px' }}>



                      {/* Header Row */}



                      <div style={{



                        display: 'flex',



                        alignItems: 'center',



                        padding: '8px 16px',



                        marginBottom: 8,



                        borderBottom: '1px solid rgba(255,255,255,0.1)',



                        fontSize: '0.75rem',



                        fontWeight: 600,



                        color: '#fff',



                        letterSpacing: '0.05em'



                      }}>



                        <div style={{ flex: 2, minWidth: 0, paddingLeft: 8 }}>Name</div>



                        <div style={{ width: 110, textAlign: 'left', paddingLeft: 0 }}>Status</div>



                        <div style={{ width: 160, textAlign: 'left', paddingLeft: 41 }}>Created</div>



                        <div style={{ width: 100, textAlign: 'left', paddingLeft: 8 }}>Owner</div>



                      </div>



                      {folderProjects[folder.id].map((project) => (



                        <div



                          key={project.id}



                          onClick={() => navigateToProof(project)}



                          style={{



                            padding: '12px 16px',



                            marginBottom: 8,



                            background: 'rgba(255,255,255,0.05)',



                            borderRadius: 8,



                            cursor: 'pointer',



                            display: 'flex',



                            alignItems: 'center',



                            gap: 12,



                            transition: 'background 0.2s',



                            borderLeft: `4px solid ${

                              project.review_cycle_status === 'not_started' ? '#9CA3AF' :

                              project.review_cycle_status === 'in_progress' ? '#FFD60A' :

                              project.review_cycle_status === 'approved' ? '#10B981' :

                              project.review_cycle_status === 'rejected' ? '#EF4444' : '#9CA3AF'

                            }`,



                            ':hover': {



                              background: 'rgba(255,255,255,0.1)'



                            }



                          }}



                          onMouseEnter={(e) => {



                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'



                            const deleteBtn = e.currentTarget.querySelector('.project-delete-btn')



                            if (deleteBtn) deleteBtn.style.opacity = '1'



                          }}



                          onMouseLeave={(e) => {



                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'



                            const deleteBtn = e.currentTarget.querySelector('.project-delete-btn')



                            if (deleteBtn) deleteBtn.style.opacity = '0'



                          }}



                        >



                          {/* Name */}



                          <div style={{ flex: 2, minWidth: 0 }}>



                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>



                              <div style={{



                                width: 36,



                                height: 36,



                                borderRadius: 8,



                                background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',



                                display: 'flex',



                                alignItems: 'center',



                                justifyContent: 'center',



                                flexShrink: 0



                              }}>



                                <FileText size={18} color="#fff" />



                              </div>



                              <div style={{ minWidth: 0 }}>



                                <h4 style={{



                                  fontSize: '0.9rem',



                                  fontWeight: 600,



                                  color: '#fff',



                                  whiteSpace: 'nowrap',



                                  overflow: 'hidden',



                                  textOverflow: 'ellipsis',



                                  marginBottom: 2



                                }}>



                                  {project.name}



                                </h4>



                                <p style={{



                                  fontSize: '0.75rem',



                                  color: 'rgba(255,255,255,0.4)',



                                  textTransform: 'uppercase'



                                }}>



                                  {project.asset_file_type || 'Project'}



                                </p>



                              </div>



                            </div>



                          </div>



                          {/* Status */}



                          <div style={{ width: 110, textAlign: 'left' }}>



                            <span



                              style={{

                                fontSize: '0.7rem',

                                fontWeight: 600,

                                color: '#fff',

                                background: 'rgba(156, 163, 175, 0.15)',

                                padding: '4px 10px',

                                borderRadius: '4px',

                                border: '1px solid rgba(156, 163, 175, 0.3)',

                                textTransform: 'uppercase',

                                letterSpacing: '0.5px',

                                marginRight: '8px'

                              }}

                            >

                              V{project.version_number || 1}

                            </span>



                            <span



                              onClick={(e) => {



                                e.stopPropagation()



                                navigateToProof(project)



                              }}



                              style={{



                                padding: '4px 10px',



                                borderRadius: '4px',



                                fontSize: '0.7rem',



                                fontWeight: 600,



                                display: 'inline-flex',



                                alignItems: 'center',



                                justifyContent: 'center',



                                gap: 5,



                                cursor: 'pointer',



                                textDecoration: 'none',



                                whiteSpace: 'nowrap',



                                lineHeight: 1



                              }}



                            >



                              <StatusBadge status={project.review_cycle_status || 'not_started'} size="small" />



                            </span>



                          </div>



                          {/* Created Date & Time */}



                          <div style={{ width: 160, textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>



                            {new Date(project.created_at).toLocaleDateString()}<br />



                            {new Date(project.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}).toUpperCase()}



                          </div>



                          {/* Owner */}



                          <div style={{ width: 100, textAlign: 'left', paddingLeft: 8, fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>



                            {project.owner?.username || 'Unknown'}



                          </div>



                          {/* Delete Button - Hover Visible */}



                          <button



                            onClick={(e) => handleDeleteClick(e, project)}



                            className="project-delete-btn"



                            style={{



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



                            title="Remove from folder"



                          >



                            <Trash2 size={16} />



                          </button>



                        </div>



                      ))}



                    </div>



                  )}



                </div>



              )}



            </div>



          ))}



        </div>

        </>



      )}







      {/* Create Folder Modal */}



      {showCreateModal && (



        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeCreateModal()}>



          <div className="modal-box" style={{ maxWidth: '500px', minHeight: 'auto', padding: '32px' }}>



            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>



              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>Create New Folder</h2>



              <button



                onClick={() => closeCreateModal()}



                style={{



                  width: 32,



                  height: 32,



                  borderRadius: 8,



                  background: 'rgba(255,255,255,0.08)',



                  border: '1px solid rgba(255,255,255,0.1)',



                  color: 'rgba(255,255,255,0.5)',



                  cursor: 'pointer',



                  display: 'flex',



                  alignItems: 'center',



                  justifyContent: 'center'



                }}



              >



                <X size={16} />



              </button>



            </div>



            <form onSubmit={handleCreateFolder}>



              <div style={{ marginBottom: 16 }}>



                <label style={{



                  display: 'block',



                  fontSize: '0.78rem',



                  fontWeight: 600,



                  color: 'rgba(255,255,255,0.45)',



                  marginBottom: 8,



                  textTransform: 'uppercase',



                  letterSpacing: '0.06em'



                }}>



                  Folder Name *



                </label>



                <div style={{ position: 'relative' }}>



                  <input



                    type="text"



                    value={newFolderName}



                    onChange={(e) => {



                      setNewFolderName(e.target.value)



                      if (newFolderNameError) setNewFolderNameError('')



                    }}



                    className="input-field"



                    placeholder="Enter folder name"



                    autoFocus



                    style={newFolderNameError ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)', paddingRight: '40px' } : { paddingRight: '40px' }}



                  />



                  {newFolderNameError && (



                    <div style={{



                      position: 'absolute',



                      right: '12px',



                      top: '50%',



                      transform: 'translateY(-50%)',



                      color: '#FF375F',



                    }}>



                      <XCircle size={18} />



                    </div>



                  )}



                </div>



                {newFolderNameError && (



                  <p style={{



                    color: '#FF375F',



                    fontSize: '0.75rem',



                    marginTop: 6,



                    fontWeight: 500



                  }}>



                    {newFolderNameError}



                  </p>



                )}



              </div>



              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>



                <button



                  type="button"



                  onClick={() => closeCreateModal()}



                  className="btn-secondary"



                  style={{ borderRadius: 12 }}



                >



                  Cancel



                </button>



                <button



                  type="submit"



                  className="btn-primary"



                  style={{ borderRadius: 12 }}



                >



                  Create Folder



                </button>



              </div>



            </form>



          </div>



        </div>



      )}







      {/* Edit Folder Modal */}



      {editingFolder && (



        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeEditModal()}>



          <div className="modal-box" style={{ maxWidth: '500px', minHeight: 'auto', padding: '32px' }}>



            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>



              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>Edit Folder</h2>



              <button



                onClick={() => closeEditModal()}



                style={{



                  width: 32,



                  height: 32,



                  borderRadius: 8,



                  background: 'rgba(255,255,255,0.08)',



                  border: '1px solid rgba(255,255,255,0.1)',



                  color: 'rgba(255,255,255,0.5)',



                  cursor: 'pointer',



                  display: 'flex',



                  alignItems: 'center',



                  justifyContent: 'center'



                }}



              >



                <X size={16} />



              </button>



            </div>



            <form onSubmit={handleEditFolder}>



              <div style={{ marginBottom: 16 }}>



                <label style={{



                  display: 'block',



                  fontSize: '0.78rem',



                  fontWeight: 600,



                  color: 'rgba(255,255,255,0.45)',



                  marginBottom: 8,



                  textTransform: 'uppercase',



                  letterSpacing: '0.06em'



                }}>



                  Folder Name *



                </label>



                <div style={{ position: 'relative' }}>



                  <input



                    type="text"



                    value={editName}



                    onChange={(e) => {



                      setEditName(e.target.value)



                      if (editNameError) setEditNameError('')



                    }}



                    className="input-field"



                    placeholder="Enter folder name"



                    autoFocus



                    style={editNameError ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)', paddingRight: '40px' } : { paddingRight: '40px' }}



                  />



                  {editNameError && (



                    <div style={{



                      position: 'absolute',



                      right: '12px',



                      top: '50%',



                      transform: 'translateY(-50%)',



                      color: '#FF375F',



                    }}>



                      <XCircle size={18} />



                    </div>



                  )}



                </div>



                {editNameError && (



                  <p style={{



                    color: '#FF375F',



                    fontSize: '0.75rem',



                    marginTop: 6,



                    fontWeight: 500



                  }}>



                    {editNameError}



                  </p>



                )}



              </div>



              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>



                <button



                  type="button"



                  onClick={() => closeEditModal()}



                  className="btn-secondary"



                  style={{ borderRadius: 12 }}



                >



                  Cancel



                </button>



                <button



                  type="submit"



                  className="btn-primary"



                  style={{ borderRadius: 12 }}



                >



                  Save Changes



                </button>



              </div>



            </form>



          </div>



        </div>



      )}







      {/* Delete Confirmation Modal */}

      <DeleteConfirmationModal

        isOpen={showDeleteModal}

        onClose={handleCancelDelete}

        onConfirm={handleConfirmDelete}

        title={projectToDelete?.name || 'Untitled Proof'}

        deleting={deleting}

        confirmText="Remove from Folder"

        message="Are you sure you want to remove this proof?"

      />



      {/* Add Proofs Modal */}

      {showAddProofsModal && (

        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAddProofsModal()}>

          <div className="modal-box" style={{ maxWidth: '500px', minHeight: 'auto', padding: '32px' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>

              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>Add Proofs to Folder</h2>

              <button

                onClick={closeAddProofsModal}

                style={{

                  width: 32,

                  height: 32,

                  borderRadius: 8,

                  background: 'rgba(255,255,255,0.08)',

                  border: '1px solid rgba(255,255,255,0.1)',

                  color: 'rgba(255,255,255,0.5)',

                  cursor: 'pointer',

                  display: 'flex',

                  alignItems: 'center',

                  justifyContent: 'center'

                }}

              >

                <X size={16} />

              </button>

            </div>



            {/* Search Field with Icon */}

            <div style={{ marginBottom: 20 }}>

              <label style={{

                display: 'block',

                fontSize: '0.78rem',

                fontWeight: 600,

                color: 'rgba(255,255,255,0.45)',

                marginBottom: 8,

                textTransform: 'uppercase',

                letterSpacing: '0.06em'

              }}>

                Search Proofs

              </label>

              <div style={{ position: 'relative' }}>

                <button

                  onClick={() => setShowProofsDropdown(!showProofsDropdown)}

                  style={{

                    position: 'absolute',

                    left: 12,

                    top: '50%',

                    transform: 'translateY(-50%)',

                    background: 'none',

                    border: 'none',

                    color: 'rgba(255,255,255,0.5)',

                    cursor: 'pointer',

                    display: 'flex',

                    alignItems: 'center',

                    justifyContent: 'center',

                    padding: 4,

                    zIndex: 2

                  }}

                  title="Click to show all proofs"

                >

                  <Search size={18} />

                </button>

                <input

                  type="text"

                  value={searchQuery}

                  onChange={(e) => {

                    setSearchQuery(e.target.value)

                    setShowProofsDropdown(true)

                  }}

                  onClick={() => setShowProofsDropdown(true)}

                  className="input-field"

                  placeholder="Click search icon or type to search..."

                  style={{ paddingLeft: 44 }}

                />

              </div>

            </div>



            {/* Proofs Dropdown */}

            {showProofsDropdown && (

              <div style={{

                maxHeight: '250px',

                overflowY: 'auto',

                background: 'rgba(0,0,0,0.3)',

                borderRadius: 12,

                border: '1px solid rgba(255,255,255,0.1)',

                marginBottom: 20

              }}>

                {proofsLoading ? (

                  <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>

                    Loading proofs...

                  </div>

                ) : filteredProofs.length === 0 ? (

                  <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>

                    No proofs available

                  </div>

                ) : (

                  filteredProofs.map((proof) => (

                    <div

                      key={proof.id}

                      onClick={() => toggleProofSelection(proof)}

                      style={{

                        padding: '12px 16px',

                        cursor: 'pointer',

                        display: 'flex',

                        alignItems: 'center',

                        gap: 12,

                        borderBottom: '1px solid rgba(255,255,255,0.05)',

                        background: selectedProofsToAdd.some(p => p.id === proof.id)

                          ? 'rgba(10,132,255,0.2)'

                          : 'transparent',

                        transition: 'background 0.2s'

                      }}

                      onMouseEnter={(e) => {

                        if (!selectedProofsToAdd.some(p => p.id === proof.id)) {

                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'

                        }

                      }}

                      onMouseLeave={(e) => {

                        if (!selectedProofsToAdd.some(p => p.id === proof.id)) {

                          e.currentTarget.style.background = 'transparent'

                        }

                      }}

                    >

                      {/* Checkbox */}

                      <div style={{

                        width: 20,

                        height: 20,

                        borderRadius: 4,

                        border: '2px solid',

                        borderColor: selectedProofsToAdd.some(p => p.id === proof.id) ? '#0A84FF' : 'rgba(255,255,255,0.3)',

                        background: selectedProofsToAdd.some(p => p.id === proof.id) ? '#0A84FF' : 'transparent',

                        display: 'flex',

                        alignItems: 'center',

                        justifyContent: 'center',

                        flexShrink: 0

                      }}>

                        {selectedProofsToAdd.some(p => p.id === proof.id) && (

                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">

                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

                          </svg>

                        )}

                      </div>



                      {/* Proof Icon */}

                      <div style={{

                        width: 36,

                        height: 36,

                        borderRadius: 8,

                        background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',

                        display: 'flex',

                        alignItems: 'center',

                        justifyContent: 'center',

                        flexShrink: 0

                      }}>

                        <FileText size={18} color="#fff" />

                      </div>



                      {/* Proof Info */}

                      <div style={{ flex: 1, minWidth: 0 }}>

                        <h4 style={{

                          fontSize: '0.9rem',

                          fontWeight: 600,

                          color: '#fff',

                          whiteSpace: 'nowrap',

                          overflow: 'hidden',

                          textOverflow: 'ellipsis',

                          marginBottom: 2

                        }}>

                          {proof.name}

                        </h4>

                        <p style={{

                          fontSize: '0.75rem',

                          color: 'rgba(255,255,255,0.4)'

                        }}>

                          {proof.asset_file_type || 'Project'}

                        </p>

                      </div>

                    </div>

                  ))

                )}

              </div>

            )}



            {/* Selected Count */}

            {selectedProofsToAdd.length > 0 && (

              <div style={{

                padding: '12px 16px',

                background: 'rgba(10,132,255,0.1)',

                borderRadius: 8,

                marginBottom: 20,

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'space-between'

              }}>

                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>

                  {selectedProofsToAdd.length} proof{selectedProofsToAdd.length > 1 ? 's' : ''} selected

                </span>

                <button

                  onClick={() => setSelectedProofsToAdd([])}

                  style={{

                    fontSize: '0.75rem',

                    color: '#FF375F',

                    background: 'none',

                    border: 'none',

                    cursor: 'pointer',

                    fontWeight: 600

                  }}

                >

                  Clear all

                </button>

              </div>

            )}



            {/* Action Buttons */}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>

              <button

                type="button"

                onClick={closeAddProofsModal}

                className="btn-secondary"

                style={{ borderRadius: 12 }}

              >

                Cancel

              </button>

              <button

                type="button"

                onClick={handleAddProofsToFolder}

                disabled={selectedProofsToAdd.length === 0 || addingProofs}

                className="btn-primary"

                style={{

                  borderRadius: 12,

                  opacity: selectedProofsToAdd.length === 0 || addingProofs ? 0.5 : 1,

                  cursor: selectedProofsToAdd.length === 0 || addingProofs ? 'not-allowed' : 'pointer'

                }}

              >

                {`Add${selectedProofsToAdd.length > 0 ? ` (${selectedProofsToAdd.length})` : ''}`}

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Folder Delete Confirmation Modal */}

      {showFolderDeleteModal && (

        <div

          style={{

            position: 'fixed',

            top: 0,

            left: 0,

            right: 0,

            bottom: 0,

            background: 'rgba(0, 0, 0, 0.7)',

            backdropFilter: 'blur(8px)',

            zIndex: 2000,

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'center',

          }}

          onClick={(e) => e.target === e.currentTarget && cancelDeleteFolder()}

        >

          <div

            style={{

              background: 'rgba(30, 30, 40, 0.95)',

              border: '1px solid rgba(255, 255, 255, 0.1)',

              borderRadius: '16px',

              padding: '32px',

              maxWidth: '400px',

              width: '90%',

              textAlign: 'center',

              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',

              position: 'relative',

            }}

            onClick={(e) => e.stopPropagation()}

          >

            <div style={{

              width: 56,

              height: 56,

              borderRadius: '50%',

              background: 'rgba(255,55,95,0.15)',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center',

              margin: '0 auto 20px'

            }}>

              <Trash2 size={28} color="#FF375F" />

            </div>

            

            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: 12 }}>

              Delete Folder?

            </h2>

            

            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: 24, lineHeight: 1.5 }}>

              Are you sure you want to delete this folder?<br />

              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Projects in this folder will not be deleted.</span>

            </p>

            

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>

              <button

                type="button"

                onClick={cancelDeleteFolder}

                className="btn-secondary"

                style={{ borderRadius: 12, padding: '10px 24px' }}

              >

                Cancel

              </button>

              <button

                type="button"

                onClick={confirmDeleteFolder}

                style={{

                  borderRadius: 12,

                  padding: '10px 24px',

                  background: '#FF375F',

                  color: '#fff',

                  border: 'none',

                  cursor: 'pointer',

                  fontWeight: 600,

                  fontSize: '0.9rem'

                }}

              >

                Delete

              </button>

            </div>

          </div>

        </div>

      )}



      

      {/* Project Details Tray */}

      <ProjectDetailsTray

        isOpen={isTrayOpen}

        onClose={closeTray}

        project={selectedProject}

        onProjectDeleted={(projectId) => {

          // Remove deleted project from folderProjects

          if (expandedFolder) {

            setFolderProjects(prev => ({

              ...prev,

              [expandedFolder]: prev[expandedFolder].filter(p => p.id !== projectId)

            }))

          }

          

          // Handle pagination redirect when deleting from tray

          const currentFolderProjects = expandedFolder ? (folderProjects[expandedFolder] || []) : []

          const isOnlyItemOnPage = currentFolderProjects.length === 1

          const shouldGoToPreviousPage = isOnlyItemOnPage && currentPage > 1

          

          if (shouldGoToPreviousPage) {
            setCurrentPage(currentPage - 1)
          }
        }}
        onVersionCreated={() => {
          // Refresh folder projects to show new version
          if (expandedFolder) {
            fetchFolderProjects(expandedFolder)
          }
          // Also refresh folders to get updated counts/stats
          fetchFolders()
        }}
        onProjectCreated={() => {
          // Refresh folder projects and folders to show new proof
          if (expandedFolder) {
            fetchFolderProjects(expandedFolder)
          }
          fetchFolders()
        }}
        onProjectChanged={(selectedVersion) => {
          // Update the selected project to the chosen version
          setSelectedProject(selectedVersion)
        }}
      />

      {/* Folder Members Modal */}
      <FolderMembersModal
        isOpen={showMembersModal}
        onClose={() => {
          setShowMembersModal(false)
          setSelectedFolderForMembers(null)
        }}
        folder={selectedFolderForMembers}
      />



    </div>



  )



}







export default Folders



