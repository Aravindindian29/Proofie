import React, { useState, useEffect, useRef } from 'react'



import { X, Plus, Users, XCircle, Folder } from 'lucide-react'



import toast from 'react-hot-toast'



import api from '../services/api'



import { useAuthStore } from '../stores/authStore'

function CreateProofModal({ isOpen, onClose, onSuccess, parentProject }) {
  const { canCreateFolder, user } = useAuthStore()
  const [formData, setFormData] = useState({ name: '', description: '' })



  const [nameError, setNameError] = useState(false)



  const [selectedReviewers, setSelectedReviewers] = useState([])



  const [availableUsers, setAvailableUsers] = useState([])



  const [selectedUsername, setSelectedUsername] = useState('')



  const [showUserDropdown, setShowUserDropdown] = useState(false)



  const [isReviewersExpanded, setIsReviewersExpanded] = useState(false)



  const [reviewersHover, setReviewersHover] = useState(false)



  const [reviewerPermissions, setReviewerPermissions] = useState({})



  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploadStatus, setUploadStatus] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)



  const [isDragging, setIsDragging] = useState(false)



  const [highlightedIndex, setHighlightedIndex] = useState(-1)



  // Folder state



  const [availableFolders, setAvailableFolders] = useState([])



  const [selectedFolder, setSelectedFolder] = useState(null)



  const [showFolderDropdown, setShowFolderDropdown] = useState(false)



  const [folderHighlightedIndex, setFolderHighlightedIndex] = useState(-1)



  const [folderNameInput, setFolderNameInput] = useState('')
  // Workflow template state
  const [workflowTemplates, setWorkflowTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)
  const [templateHighlightedIndex, setTemplateHighlightedIndex] = useState(-1)
  const templateDropdownRef = useRef(null)
  const [stageReviewers, setStageReviewers] = useState({})
  const [expandedStages, setExpandedStages] = useState({})
  const usernameInputRef = useRef(null)

  // Custom reviewer dropdown state
  const [showReviewerDropdowns, setShowReviewerDropdowns] = useState({})
  const [reviewerHighlightedIndexes, setReviewerHighlightedIndexes] = useState({})
  const [reviewerSearchTerms, setReviewerSearchTerms] = useState({})
  const reviewerDropdownRefs = useRef({})

  const dropdownRef = useRef(null)

  // Generate avatar colors for users
  const getReviewerAvatarColor = (username, index, stageId) => {
    const colors = [
      'linear-gradient(135deg, #0A84FF, #5E5CE6)',
      'linear-gradient(135deg, #FF375F, #FF9F0A)',
      'linear-gradient(135deg, #30D158, #0A84FF)',
      'linear-gradient(135deg, #FFD60A, #FF9F0A)',
      'linear-gradient(135deg, #5E5CE6, #AF52DE)',
      'linear-gradient(135deg, #FF2D92, #FF375F)',
      'linear-gradient(135deg, #64D2FF, #0A84FF)',
      'linear-gradient(135deg, #FF6B35, #F7931E)',
      'linear-gradient(135deg, #4ECDC4, #44A08D)',
      'linear-gradient(135deg, #F7B731, #E17055)',
      'linear-gradient(135deg, #667EEA, #764BA2)',
      'linear-gradient(135deg, #F093FB, #F5576C)',
      'linear-gradient(135deg, #4FACFE, #00F2FE)',
      'linear-gradient(135deg, #43E97B, #38F9D7)',
      'linear-gradient(135deg, #FA709A, #FEE140)',
      'linear-gradient(135deg, #30C3FD, #330867)',
      'linear-gradient(135deg, #A8EDEA, #FED6E3)',
      'linear-gradient(135deg, #FF9A9E, #FAD0C4)',
      'linear-gradient(135deg, #FF6B9D, #FEC8D8)',
      'linear-gradient(135deg, #C1DFC4, #DEECDD)'
    ]
    
    // Create a unique seed based on username and stage to ensure variety
    const seed = username + stageId + index
    const hash = seed.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0)
    
    // Use index as primary factor to ensure consecutive users get different colors
    const baseIndex = index % colors.length
    const offset = hash % (colors.length / 2)
    const finalIndex = (baseIndex + offset) % colors.length
    
    return colors[finalIndex]
  }

  // Filter reviewers based on search term
  const getFilteredReviewers = (stageId) => {
    const availableUsersForStage = getAvailableUsersForStage(stageId)
    const searchTerm = (reviewerSearchTerms[stageId] || '').toLowerCase()
    
    if (!searchTerm) {
      return availableUsersForStage
    }
    
    return availableUsersForStage.filter(user => 
      user.username.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    )
  }



  const folderDropdownRef = useRef(null)



  const itemRefs = useRef([])



  const isSelectingRef = useRef(false)







  // Reset form state when modal opens



  useEffect(() => {



    if (isOpen) {



      resetFormState()



    }



  }, [isOpen])







  const resetFormState = () => {



    setFormData({ name: '', description: '' })



    setNameError(false)



    setSelectedReviewers([])



    setReviewerPermissions({})



    setSelectedUsername('')



    setShowUserDropdown(false)



    setIsReviewersExpanded(false)



    setUploadedFiles([])



    setIsDragging(false)



    setHighlightedIndex(-1)



    // Reset folder state



    setAvailableFolders([])



    setSelectedFolder(null)



    setShowFolderDropdown(false)



    setFolderHighlightedIndex(-1)



    setFolderNameInput('')
    // Reset workflow state
    setStageReviewers({})
    setExpandedStages({})
    setShowTemplateDropdown(false)
    setTemplateHighlightedIndex(-1)
    // Fetch templates and set default
    fetchWorkflowTemplates()
  }

  // Fetch workflow templates
  const fetchWorkflowTemplates = async () => {
    try {
      const response = await api.get('/workflows/templates/')
      const templates = response.data.results || response.data
      setWorkflowTemplates(templates)
      // Set default template (3-stage) - prioritize 3-Stage template
      const defaultTemplate = templates.find(t => t.name.includes('3-Stage')) || 
                             templates.find(t => t.is_default) || 
                             templates[0]
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate)
        // Initialize stage reviewers and expanded states
        const initialStageReviewers = {}
        const initialExpandedStages = {}
        defaultTemplate.stages.forEach(stage => {
          initialStageReviewers[stage.id] = []
          initialExpandedStages[stage.id] = false // Keep all stages closed by default
        })
        setStageReviewers(initialStageReviewers)
        setExpandedStages(initialExpandedStages)
      }
    } catch (error) {
      console.error('Failed to fetch workflow templates:', error)
      toast.error('Failed to load workflow templates')
    }
  }

  // Add reviewer to specific stage
  const addReviewerToStage = (stageId, user) => {
    const currentReviewers = stageReviewers[stageId] || []
    // Check if user is already added to this stage
    if (currentReviewers.find(r => r.id === user.id)) {
      toast.error('Reviewer already added to this stage', { id: 'duplicate-reviewer' })
      return
    }
    setStageReviewers({
      ...stageReviewers,
      [stageId]: [...currentReviewers, user]
    })
  }

  // Remove reviewer from specific stage
  const removeReviewerFromStage = (stageId, userId) => {
    setStageReviewers({
      ...stageReviewers,
      [stageId]: (stageReviewers[stageId] || []).filter(r => r.id !== userId)
    })
  }

  // Get available users for a stage (exclude already added)
  const getAvailableUsersForStage = (stageId) => {
    const currentReviewers = stageReviewers[stageId] || []
    return availableUsers.filter(user => !currentReviewers.find(r => r.id === user.id))
  }

  const handleCreateProject = async (e) => {



    e.preventDefault()



    



    // Validation: Check for required fields



    let hasError = false



    



    if (!formData.name.trim()) {



      setNameError(true)



      hasError = true



    } else {



      setNameError(false)
    }

    if (uploadedFiles.length === 0) {
      toast.error('Please upload an asset', { id: 'validation-error' })
      return
    }

    // Validate stage reviewers - at least Stage 1 must have reviewers
    if (selectedTemplate && stageReviewers) {
      const firstStage = selectedTemplate.stages.find(s => s.order === 1)
      if (firstStage && (!stageReviewers[firstStage.id] || stageReviewers[firstStage.id].length === 0)) {
        toast.error('Please add at least one reviewer to Stage 1', { id: 'validation-error' })
        return
      }
    }

    if (hasError) return

    setIsSubmitting(true)

    try {
      // ... (rest of the code remains the same)



      // Step 1: Create the project with workflow



      const projectPayload = {
        ...formData,
        reviewers: selectedReviewers.map(r => r.id),
        version_number: parentProject ? (parentProject.version_number || 1) + 1 : 1
      }
      
      // Include folder_name if user entered one (will auto-create folder on backend)



      if (folderNameInput && folderNameInput.trim()) {



        // Check if user has permission to create folders



        if (!canCreateFolder()) {



          toast.error(



            'You do not have permission to perform this action.\nPlease contact your administrator for assistance.',



            { 



              id: 'folder-creation-denied',



              style: {



                textAlign: 'center',



                whiteSpace: 'pre-line'



              }



            }



          )



          return



        }



        projectPayload.folder_name = folderNameInput.trim()



      }



      



      // Include selected folder from dropdown if any



      if (selectedFolder) {



        projectPayload.folder_id = selectedFolder.id



      }



      



      // Add workflow template and stage reviewers
      if (selectedTemplate) {
        projectPayload.template_id = selectedTemplate.id
        // Convert stageReviewers from user objects to user IDs
        const stageReviewerIds = {}
        Object.keys(stageReviewers).forEach(stageId => {
          stageReviewerIds[stageId] = stageReviewers[stageId].map(user => user.id)
        })
        projectPayload.stage_reviewers = stageReviewerIds
      }
      
      const projectResponse = await api.post('/versioning/projects/create_with_workflow/', projectPayload)



      



      const project = projectResponse.data



      const projectId = project.id



      



      // Step 2: Upload each file as a CreativeAsset in parallel



      let projectWithToken = project



      const uploadPromises = uploadedFiles.map(uploadedFile => {



        const assetData = new FormData()



        assetData.append('name', uploadedFile.name)



        assetData.append('file', uploadedFile.file)



        assetData.append('project', projectId)



        



        // Determine file_type from MIME type



        let fileType = 'pdf'



        if (uploadedFile.type.includes('image')) {



          fileType = 'image'



        } else if (uploadedFile.type.includes('video')) {



          fileType = 'video'



        }



        assetData.append('file_type', fileType)



        



        return api.post('/versioning/assets/', assetData, {



          headers: { 'Content-Type': 'multipart/form-data' }



        })



      })



      



      const uploadResponses = await Promise.all(uploadPromises)



      



      // Process responses to capture project with token



      for (const response of uploadResponses) {



        console.log('Asset creation response:', response.data)



        



        // Handle both new format { asset, project } and old format (project directly)



        const responseProject = response.data.project || response.data



        const responseAsset = response.data.asset || null



        



        console.log('Share token in response:', responseProject?.share_token)



        console.log('Asset current_version:', responseAsset?.current_version)



        



        // The asset creation API returns the project data with share_token



        if (responseProject && responseProject.share_token) {



          projectWithToken = responseProject



          console.log('Captured project with token:', projectWithToken)



        }



      }



      



      console.log('Calling onSuccess with project:', projectWithToken)



      console.log('Project has share_token:', projectWithToken?.share_token)



      onSuccess(projectWithToken)



      resetFormState()



      onClose()



      toast.success('Proof created with assets', { id: 'proof-action-toast' })

    } catch (error) {
      const errorMessage = error.response?.data?.detail || 



                          error.response?.data?.name?.[0] || 



                          error.response?.data?.description?.[0] ||



                          error.message || 



                          'Failed to create proof'



      



      if (error.response?.status === 403) {



        toast.error(



          'You do not have permission to perform this action.\nPlease contact your administrator for assistance.',



          { 



            id: 'proof-action-toast',



            style: {



              textAlign: 'center',



              whiteSpace: 'pre-line'



            }



          }



        )



      } else {



        toast.error(errorMessage, { id: 'proof-action-toast' })



      }



    } finally {
      setIsSubmitting(false)
    }
  }







  const fetchUsers = async () => {



    try {



      const response = await api.get('/accounts/users/')



      setAvailableUsers(response.data.results || response.data)



    } catch {



      toast.error('Failed to fetch users')



    }



  }







  // Fetch available folders from API



  const fetchFolders = async () => {



    try {



      const response = await api.get('/versioning/folders/')



      setAvailableFolders(response.data.results || response.data)



    } catch {



      toast.error('Failed to fetch folders')



    }



  }







  const handleFolderKeyDown = (e) => {



    if (!showFolderDropdown || availableFolders.length === 0) return







    if (e.key === 'ArrowDown') {



      e.preventDefault()



      setFolderHighlightedIndex(prev => (prev + 1) % availableFolders.length)



    } else if (e.key === 'ArrowUp') {



      e.preventDefault()



      setFolderHighlightedIndex(prev => prev <= 0 ? availableFolders.length - 1 : prev - 1)



    } else if (e.key === 'Enter') {



      e.preventDefault()



      if (folderHighlightedIndex >= 0 && folderHighlightedIndex < availableFolders.length) {



        const folder = availableFolders[folderHighlightedIndex]



        setSelectedFolder(folder)



        setShowFolderDropdown(false)



        setFolderHighlightedIndex(-1)



      }



    } else if (e.key === 'Escape') {



      setShowFolderDropdown(false)



      setFolderHighlightedIndex(-1)



    }



  }







  const filteredUsers = availableUsers



    .filter(user => 



      !selectedReviewers.find(r => r.id === user.id) &&



      (user.username.toLowerCase().includes(selectedUsername.toLowerCase()) ||



       user.email.toLowerCase().includes(selectedUsername.toLowerCase()))



    )







  const handleKeyDown = (e) => {



    if (!showUserDropdown || filteredUsers.length === 0) return







    if (e.key === 'ArrowDown') {



      e.preventDefault()



      setHighlightedIndex(prev => (prev + 1) % filteredUsers.length)



    } else if (e.key === 'ArrowUp') {



      e.preventDefault()



      setHighlightedIndex(prev => prev <= 0 ? filteredUsers.length - 1 : prev - 1)



    } else if (e.key === 'Enter') {



      e.preventDefault()



      if (highlightedIndex >= 0 && highlightedIndex < filteredUsers.length) {



        const user = filteredUsers[highlightedIndex]



        setSelectedReviewers([...selectedReviewers, user])



        setReviewerPermissions({ ...reviewerPermissions, [user.id]: { comment: true, approve: false }})



        setSelectedUsername('')



        setShowUserDropdown(false)



        setHighlightedIndex(-1)



        usernameInputRef.current?.blur()



      }



    } else if (e.key === 'Escape') {



      setShowUserDropdown(false)



      setHighlightedIndex(-1)



    }



  }







  // Scroll highlighted item into view



  useEffect(() => {



    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {



      itemRefs.current[highlightedIndex].scrollIntoView({



        behavior: 'smooth',



        block: 'nearest'



      })



    }



  }, [highlightedIndex])







  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if we're currently selecting
      if (isSelectingRef.current) {
        return
      }
      
      // Close user dropdown
      if (showUserDropdown && 
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target) &&
          usernameInputRef.current &&
          !usernameInputRef.current.contains(event.target)) {
        setShowUserDropdown(false)
      }
      
      // Close template dropdown only if clicking outside the dropdown container
      if (showTemplateDropdown && 
          templateDropdownRef.current && 
          !templateDropdownRef.current.contains(event.target)) {
        setShowTemplateDropdown(false)
      }
      
      // Close reviewer dropdowns
      Object.keys(showReviewerDropdowns).forEach(stageId => {
        if (showReviewerDropdowns[stageId] &&
            reviewerDropdownRefs.current[stageId] &&
            !reviewerDropdownRefs.current[stageId].contains(event.target)) {
          setShowReviewerDropdowns(prev => ({ ...prev, [stageId]: false }))
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserDropdown, showTemplateDropdown, showReviewerDropdowns])

// ... (rest of the code remains the same)


  const getAvatarColor = (username, index, previousColors) => {



    const colors = [



      'linear-gradient(135deg,#5E5CE6,#FF375F)',



      'linear-gradient(135deg,#30D158,#0A84FF)',



      'linear-gradient(135deg,#FF9F0A,#FF375F)',



      'linear-gradient(135deg,#FF375F,#5E5CE6)',



      'linear-gradient(135deg,#FFD60A,#FF9F0A)',



    ]



    let colorIndex = username.charCodeAt(0) % colors.length



    let selectedColor = colors[colorIndex]



    



    if (index > 0 && previousColors.length > 0 && selectedColor === previousColors[index - 1]) {



      let attempts = 0



      do {



        colorIndex = (colorIndex + 1) % colors.length



        selectedColor = colors[colorIndex]



        attempts++



      } while (previousColors.includes(selectedColor) && attempts < colors.length)



    }



    return selectedColor



  }







  const handleFileUpload = (files) => {



    const maxSize = 500 * 1024 * 1024



    const validTypes = [



      'application/pdf',



      'image/jpeg',



      'image/png',



      'image/gif',



      'video/mp4',



      'video/webm',



      'video/quicktime'



    ]



    



    const validFiles = Array.from(files).filter(file => {



      if (file.size > maxSize) {



        toast.error(`${file.name} exceeds 500MB limit`)



        return false



      }



      if (!validTypes.includes(file.type)) {



        toast.error(`${file.name} is not a supported file type`)



        return false



      }



      return true



    })



    



    const newFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status: 'uploading'
    }))

    setUploadedFiles([...uploadedFiles, ...newFiles])
    
    // Simulate upload progress for each file
    newFiles.forEach(file => {
      simulateFileUpload(file.id)
    })
    



  }







  const handleDragOver = (e) => {



    e.preventDefault()



    setIsDragging(true)



  }







  const handleDragLeave = (e) => {



    e.preventDefault()



    setIsDragging(false)



  }







  const handleDrop = (e) => {



    e.preventDefault()



    setIsDragging(false)



    handleFileUpload(e.dataTransfer.files)



  }







  const simulateFileUpload = (fileId) => {
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
    setUploadStatus(prev => ({ ...prev, [fileId]: 'uploading' }))
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const currentProgress = prev[fileId] || 0
        if (currentProgress >= 100) {
          clearInterval(interval)
          setUploadStatus(prevStatus => ({ ...prevStatus, [fileId]: 'success' }))
          return { ...prev, [fileId]: 100 }
        }
        return { ...prev, [fileId]: Math.min(currentProgress + Math.random() * 15 + 5, 100) }
      })
    }, 200)
  }

  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId))
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[fileId]
      return newProgress
    })
    setUploadStatus(prev => {
      const newStatus = { ...prev }
      delete newStatus[fileId]
      return newStatus
    })
  }







  const getFileIcon = (fileType) => {



    if (fileType.includes('pdf')) return '📄'



    if (fileType.includes('image')) return '🖼️'



    if (fileType.includes('video')) return '🎬'



    return '📎'



  }







  if (!isOpen) return null







  return (



    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>



      <div className="modal-box">



        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>



          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>New Proof</h2>



          <button onClick={onClose} style={{



            width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)',



            border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',



            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',



          }}><X size={16} /></button>



        </div>



        <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: 32, height: '100%', alignItems: 'flex-start' }}>



          {/* Left Column - Attachments */}



          <div style={{ width: '380px', display: 'flex', flexDirection: 'column', position: 'relative' }}>



            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,



              color: 'rgba(255,255,255,0.45)', marginBottom: 8, letterSpacing: '0.06em',



              textTransform: 'uppercase', textAlign: 'center' }}>Attachments</label>



            



            {/* Scrollable Content Container */}



            <div style={{



              flex: 1,



              display: 'flex',



              flexDirection: 'column',



              marginBottom: '80px', // Space for fixed buttons



              minHeight: '400px'



            }}>



              {/* Drag & Drop Zone */}



              <div



                onDragOver={handleDragOver}



                onDragLeave={handleDragLeave}



                onDrop={handleDrop}



                onClick={() => document.getElementById('file-input').click()}



                style={{



                  border: `2px dashed ${isDragging ? '#0A84FF' : 'rgba(255,255,255,0.2)'}`,



                  borderRadius: 12,



                  background: isDragging ? 'rgba(10,132,255,0.1)' : 'rgba(255,255,255,0.02)',



                  display: 'flex',



                  flexDirection: 'column',



                  alignItems: 'center',



                  justifyContent: 'center',



                  padding: uploadedFiles.length > 0 ? '20px 20px' : '40px 20px',



                  cursor: 'pointer',



                  transition: 'all 0.2s ease',



                  minHeight: uploadedFiles.length > 0 ? '200px' : '300px'



                }}



              >



              <div style={{



                width: 64,



                height: 64,



                borderRadius: '50%',



                background: 'rgba(10,132,255,0.1)',



                display: 'flex',



                alignItems: 'center',



                justifyContent: 'center',



                marginBottom: 16



              }}>



                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2">



                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>



                  <polyline points="17 8 12 3 7 8"/>



                  <line x1="12" y1="3" x2="12" y2="15"/>



                </svg>



              </div>



              <p style={{ color: '#fff', fontSize: '0.95rem', marginBottom: 8, textAlign: 'center' }}>



                {isDragging ? 'Drop files here' : uploadedFiles.length > 0 ? 'Click or drag more files to upload' : 'Click or drag files to upload'}



              </p>



              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textAlign: 'center' }}>



                {uploadedFiles.length > 0 ? `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} attached` : 'PDF, Images, Videos up to 500MB'}



              </p>



            </div>



            



            <input



              id="file-input"



              type="file"



              multiple



              accept=".pdf,image/*,video/*"



              onChange={(e) => {
                handleFileUpload(e.target.files)
                // Reset input value to allow re-uploading the same file
                e.target.value = ''
              }}



              style={{ display: 'none' }}



            />







            {/* Uploaded Files List */}



            {uploadedFiles.length > 0 && (



              <div style={{ marginTop: 16, maxHeight: '200px', overflowY: 'auto' }}>



                {uploadedFiles.map((uploadedFile) => (



                  <div key={uploadedFile.id} style={{



                    display: 'flex',



                    alignItems: 'center',



                    gap: 12,



                    padding: '12px',



                    background: 'rgba(255,255,255,0.05)',



                    borderRadius: 16, marginTop: 8, maxHeight: '200px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)', padding: '8px',



                    marginBottom: 8



                  }}>



                    <div style={{



                      width: 40,



                      height: 40,



                      borderRadius: 16, marginTop: 8, maxHeight: '200px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)', padding: '8px',



                      background: uploadedFile.preview ? `url(${uploadedFile.preview})` : 'rgba(10,132,255,0.1)',



                      backgroundSize: 'cover',



                      backgroundPosition: 'center',



                      display: 'flex',



                      alignItems: 'center',



                      justifyContent: 'center',



                      fontSize: '1.2rem'



                    }}>



                      {!uploadedFile.preview && getFileIcon(uploadedFile.type)}



                    </div>



                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontSize: '0.85rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {uploadedFile.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', margin: 0 }}>
                          {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        {/* Upload Status Indicator */}
                        {uploadStatus[uploadedFile.id] === 'success' && (
                          <span style={{
                            fontSize: '0.65rem',
                            color: '#30D158',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="3">
                              <path d="M5 12l5 5L20 7"/>
                            </svg>
                            Uploaded
                          </span>
                        )}
                        {uploadStatus[uploadedFile.id] === 'uploading' && (
                          <span style={{
                            fontSize: '0.65rem',
                            color: '#0A84FF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {Math.round(uploadProgress[uploadedFile.id] || 0)}%
                          </span>
                        )}
                      </div>
                      {/* Progress Bar */}
                      {uploadStatus[uploadedFile.id] === 'uploading' && (
                        <div style={{
                          width: '100%',
                          height: 3,
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: 2,
                          marginTop: 6,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${uploadProgress[uploadedFile.id] || 0}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #0A84FF, #5E5CE6)',
                            borderRadius: 2,
                            transition: 'width 0.2s ease'
                          }} />
                        </div>
                      )}
                    </div>



                    <button



                      type="button"



                      onClick={(e) => { e.stopPropagation(); removeFile(uploadedFile.id); }}



                      style={{



                        width: 18,



                        height: 18,



                        borderRadius: 4,



                        background: '#ff3b30',



                        border: 'none',



                        color: '#fff',



                        cursor: 'pointer',



                        display: 'flex',



                        alignItems: 'center',



                        justifyContent: 'center'



                      }}



                    >



                      <X size={10} strokeWidth={3} />



                    </button>



                  </div>



                ))}



              </div>



            )}



            </div>







            {/* Fixed Position Buttons */}



            <div style={{ 



              position: 'absolute', 



              bottom: 0, 



              left: 0, 



              right: 0, 



              display: 'flex', 



              gap: 12, 



              padding: '20px 0 0 0'



            }}>



              <button type="submit" className="btn-primary" disabled={isSubmitting}
                style={{ 
                  width: '120px', 
                  justifyContent: 'center', 
                  borderRadius: 14, 
                  padding: '10px',
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}>
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                      </path>
                    </svg>
                    Creating...
                  </span>
                ) : 'Create'}
              </button>



              <button type="button" onClick={onClose} className="btn-secondary"



                style={{ width: '120px', justifyContent: 'center', borderRadius: 14, padding: '10px' }}>



                Cancel



              </button>



            </div>



          </div>







          {/* Right Column - Project Details Panel */}



          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>



            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,



              color: 'rgba(255,255,255,0.45)', marginBottom: 8, letterSpacing: '0.06em',



              textTransform: 'uppercase', textAlign: 'center' }}>Proof Details</label>



            <div style={{ 



              border: '1px solid rgba(255,255,255,0.1)', 



              borderRadius: 12, 



              background: 'rgba(255,255,255,0.02)',



              padding: '20px',



              display: 'flex',



              flexDirection: 'column',



              gap: 16,



              minHeight: '480px',



              maxHeight: 'calc(90vh - 200px)',



              overflowY: 'auto',



              contain: 'layout style paint',



              willChange: 'scroll-position'



            }}>



              {/* Proof Name */}



              <div>



                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,



                  color: 'rgba(255,255,255,0.45)', marginBottom: 8, letterSpacing: '0.06em',



                  textTransform: 'uppercase' }}>Proof Name</label>



                <div style={{ position: 'relative' }}>



                  <input type="text" value={formData.name}



                    onChange={(e) => {



                      setFormData({ ...formData, name: e.target.value })



                      if (e.target.value.trim()) setNameError(false)



                    }}



                    className="input-field" placeholder="Enter Proof Name"



                    style={{



                      ...(nameError ? { borderColor: 'rgba(255,55,95,0.6)', boxShadow: '0 0 0 3px rgba(255,55,95,0.15)' } : {}),



                      ...(nameError ? { paddingRight: '40px' } : {})



                    }} />



                  {nameError && (



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



                {nameError && (



                  <p style={{ color: '#FF375F', fontSize: '0.78rem', marginTop: 6, fontWeight: 600, letterSpacing: '0.01em' }}>



                    Please enter the proof name



                  </p>



                )}



              </div>







              {/* Workflow Template Selection - Only for Manager/Admin */}
              {(user?.profile?.role === 'manager' || user?.profile?.role === 'admin') && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    color: 'var(--text-secondary)', 
                    marginBottom: 10, 
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase' 
                  }}>
                    Workflow Template
                  </label>
                  
                  {/* Custom Dropdown */}
                  <div style={{ position: 'relative' }} ref={templateDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                      style={{
                        width: '100%',
                        padding: '14px 44px 14px 16px',
                        background: 'rgba(255,255,255,0.07)',
                        border: showTemplateDropdown ? '1px solid var(--ios-blue)' : '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: showTemplateDropdown ? '0 0 0 3px rgba(10,132,255,0.2)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                      }}
                    >
                      <span style={{ 
                        color: selectedTemplate ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        flex: 1
                      }}>
                        {selectedTemplate?.name || 'Select a template...'}
                      </span>
                      
                      {/* Dropdown Chevron */}
                      <div style={{
                        position: 'absolute',
                        right: 16,
                        color: 'var(--text-secondary)'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </div>
                    </button>
                    
                    {/* Template Dropdown Menu */}
                    {showTemplateDropdown && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          left: 0,
                          right: 0,
                          background: 'rgba(20, 20, 40, 0.98)',
                          backdropFilter: 'blur(24px) saturate(180%)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(10,132,255,0.1)',
                          zIndex: 1000,
                          maxHeight: 200,
                          overflow: 'hidden',
                          animation: 'fadeUp 0.2s cubic-bezier(0.4,0,0.2,1)'
                        }}
                      >
                        {/* Template Options */}
                        <div style={{
                          maxHeight: 200,
                          overflowY: 'auto',
                          padding: 6
                        }}>
                          {workflowTemplates
                            .sort((a, b) => {
                              // Sort by stage count (3 stages first, then 5 stages)
                              const aStages = a.stages?.length || 0
                              const bStages = b.stages?.length || 0
                              if (aStages === 3 && bStages !== 3) return -1
                              if (aStages !== 3 && bStages === 3) return 1
                              if (aStages === 5 && bStages !== 5) return -1
                              if (aStages !== 5 && bStages === 5) return 1
                              return a.order - b.order
                            })
                            .map((template, index) => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => {
                                setSelectedTemplate(template)
                                const newStageReviewers = {}
                                const newExpandedStages = {}
                                template?.stages.forEach(stage => {
                                  newStageReviewers[stage.id] = []
                                  newExpandedStages[stage.id] = false
                                })
                                setStageReviewers(newStageReviewers)
                                setExpandedStages(newExpandedStages)
                                setShowTemplateDropdown(false)
                              }}
                              onMouseEnter={() => setTemplateHighlightedIndex(index)}
                              style={{
                                width: '100%',
                                padding: '12px 14px',
                                background: selectedTemplate?.id === template.id 
                                  ? 'rgba(10,132,255,0.15)' 
                                  : templateHighlightedIndex === index 
                                    ? 'rgba(255,255,255,0.06)' 
                                    : 'transparent',
                                border: 'none',
                                borderTop: index > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                                borderRadius: 0,
                                color: 'var(--text-primary)',
                                fontSize: '0.85rem',
                                fontWeight: selectedTemplate?.id === template.id ? 600 : 500,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 0
                              }}
                            >
                              {/* Template Icon */}
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: selectedTemplate?.id === template.id 
                                  ? 'var(--gradient-blue)' 
                                  : 'rgba(255,255,255,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s ease'
                              }}>
                                <span style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  color: selectedTemplate?.id === template.id ? '#fff' : 'var(--text-secondary)'
                                }}>
                                  {template.order || index + 1}
                                </span>
                              </div>
                              
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  marginBottom: 2
                                }}>
                                  <span style={{
                                    fontSize: '0.85rem',
                                    fontWeight: selectedTemplate?.id === template.id ? 600 : 500,
                                    color: 'var(--text-primary)'
                                  }}>
                                    {template.name}
                                  </span>
                                  {template.is_default && (
                                    <span style={{
                                      fontSize: '0.55rem',
                                      fontWeight: 700,
                                      color: 'var(--ios-green)',
                                      background: 'rgba(48,209,88,0.15)',
                                      padding: '2px 6px',
                                      borderRadius: 4,
                                      border: '1px solid rgba(48,209,88,0.3)'
                                    }}>
                                      DEFAULT
                                    </span>
                                  )}
                                </div>
                                <span style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--text-secondary)',
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {template.stages?.length || 0} stages · {template.description || 'No description'}
                                </span>
                              </div>
                              
                              {/* Checkmark for selected */}
                              {selectedTemplate?.id === template.id && (
                                <div style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  background: 'var(--ios-blue)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                    <path d="M5 12l5 5L20 7"/>
                                  </svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Template Info */}
                  {selectedTemplate && (
                    <div style={{ 
                      marginTop: 14
                    }}>
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.8rem', 
                        margin: '0 0 10px 0',
                        lineHeight: 1.5
                      }}>
                        {selectedTemplate.description}
                      </p>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        color: '#0A84FF', 
                        fontSize: '1.1rem',
                        fontWeight: 600
                      }}>
                        <Users size={22} strokeWidth={2} />
                        <span>Reviewers</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stage Reviewers Section - Dynamic based on template */}
              {selectedTemplate && selectedTemplate.stages && selectedTemplate.stages.map((stage, index) => (
                <div 
                  key={stage.id}
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16, marginTop: index === 0 ? -28 : 8, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)', padding: '6px',
                    background: 'rgba(255,255,255,0.02)',
                    position: 'relative'
                  }}>
                  {/* Stage Header */}
                  <div
                    onClick={() => {
                      // Accordion behavior: close all other stages, open only this one
                      const newExpandedStages = {}
                      selectedTemplate.stages.forEach(s => {
                        newExpandedStages[s.id] = s.id === stage.id ? !expandedStages[stage.id] : false
                      })
                      setExpandedStages(newExpandedStages)
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      borderBottom: expandedStages[stage.id] ? '1px solid rgba(255,255,255,0.1)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0A84FF' }}>
                          S{stage.order}:
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
                          {stage.name}
                        </span>
                        {stageReviewers[stage.id] && stageReviewers[stage.id].length > 0 && (
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: '#14B8A6',
                            background: 'rgba(20,184,166,0.15)',
                            padding: '2px 6px',
                            borderRadius: 12,
                            border: '1px solid rgba(20,184,166,0.3)'
                          }}>
                            {stageReviewers[stage.id].length}
                          </span>
                        )}
                      </div>
                      <div style={{
                        transform: expandedStages[stage.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        color: 'rgba(255,255,255,0.5)'
                      }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
                          <path d="m6 9 6 6 6-6"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Stage Content - Expanded */}
                  {expandedStages[stage.id] && (
                    <div style={{ padding: '8px 12px' }}>
                      {/* Selected Reviewers for this stage */}
                      {stageReviewers[stage.id] && stageReviewers[stage.id].length > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 8, 
                          marginBottom: 12,
                          maxHeight: '120px',
                          overflowY: 'auto',
                          paddingRight: '4px'
                        }}>
                          {stageReviewers[stage.id].map((reviewer, index) => (
                            <div
                              key={reviewer.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: getReviewerAvatarColor(reviewer.username, index, stage.id),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: '#fff',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                  textAlign: 'center',
                                  lineHeight: 1
                                }}>
                                  {reviewer.username?.[0]?.toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                                    {reviewer.username}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                    {reviewer.email}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeReviewerFromStage(stage.id, reviewer.id)}
                                style={{
                                  background: '#ff3b30',
                                  border: 'none',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  width: 18,
                                  height: 18,
                                  borderRadius: 3,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <X size={10} strokeWidth={3} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* User Selection Dropdown */}
                      <div style={{ marginBottom: 8, position: 'relative', width: '100%' }}>
                        {/* Search Input Field */}
                        <input
                          type="text"
                          placeholder="Search Reviewers"
                          value={reviewerSearchTerms[stage.id] || ''}
                          onChange={(e) => {
                            setReviewerSearchTerms({ ...reviewerSearchTerms, [stage.id]: e.target.value })
                            setShowReviewerDropdowns({ ...showReviewerDropdowns, [stage.id]: true })
                            setReviewerHighlightedIndexes({ ...reviewerHighlightedIndexes, [stage.id]: -1 })
                            if (availableUsers.length === 0) fetchUsers()
                          }}
                          onFocus={() => {
                            setShowReviewerDropdowns({ ...showReviewerDropdowns, [stage.id]: true })
                            if (availableUsers.length === 0) fetchUsers()
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                            outline: 'none'
                          }}
                        />

                        {/* Custom Dropdown Menu */}
                        {showReviewerDropdowns[stage.id] && getFilteredReviewers(stage.id).length > 0 && (
                          <div 
                            ref={el => reviewerDropdownRefs.current[stage.id] = el}
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 2px)',
                              left: 0,
                              right: 0,
                              background: 'rgba(20, 20, 40, 0.98)',
                              backdropFilter: 'blur(24px) saturate(180%)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: 'var(--radius-sm)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(10,132,255,0.1)',
                              zIndex: 1000,
                              maxHeight: 180,
                              overflow: 'hidden',
                              animation: 'fadeUp 0.2s cubic-bezier(0.4,0,0.2,1)',
                              minWidth: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div style={{
                              maxHeight: 180,
                              overflowY: 'auto',
                              padding: 4
                            }}>
                              {getFilteredReviewers(stage.id).map((user, index) => (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => {
                                    addReviewerToStage(stage.id, user)
                                    setReviewerSearchTerms({ ...reviewerSearchTerms, [stage.id]: '' })
                                    const currentShow = { ...showReviewerDropdowns }
                                    currentShow[stage.id] = false
                                    setShowReviewerDropdowns(currentShow)
                                  }}
                                  onMouseEnter={() => setReviewerHighlightedIndexes({ ...reviewerHighlightedIndexes, [stage.id]: index })}
                                  style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    background: reviewerHighlightedIndexes[stage.id] === index 
                                      ? 'rgba(10,132,255,0.15)' 
                                      : 'transparent',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginBottom: 2
                                  }}
                                >
                                  {/* Profile Icon */}
                                  <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: getReviewerAvatarColor(user.username, index, stage.id),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    textAlign: 'center',
                                    lineHeight: 1
                                  }}>
                                    <span style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      color: '#fff'
                                    }}>
                                      {user.username.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  
                                  {/* User Info */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      fontSize: '0.8rem',
                                      fontWeight: 500,
                                      color: 'var(--text-primary)',
                                      marginBottom: 1
                                    }}>
                                      {user.username}
                                    </div>
                                    <div style={{
                                      fontSize: '0.7rem',
                                      color: 'var(--text-secondary)',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {user.email}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* No Results Message */}
                        {showReviewerDropdowns[stage.id] && getFilteredReviewers(stage.id).length === 0 && reviewerSearchTerms[stage.id] && (
                          <div 
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 2px)',
                              left: 0,
                              right: 0,
                              background: 'rgba(20, 20, 40, 0.98)',
                              backdropFilter: 'blur(24px) saturate(180%)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '12px 16px',
                              color: 'var(--text-tertiary)',
                              fontSize: '0.8rem',
                              textAlign: 'center',
                              zIndex: 1000,
                              minWidth: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            No reviewers found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Legacy Reviewers Section - Hidden when using workflow */}



              <div 



                onMouseEnter={() => setReviewersHover(true)}



                onMouseLeave={() => setReviewersHover(false)}



                style={{



                  border: '1px solid rgba(255,255,255,0.1)',



                  borderRadius: 16, marginTop: 8, maxHeight: '200px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)', padding: '8px',



                  background: 'rgba(255,255,255,0.02)',



                  position: 'relative',
                  display: 'none' // Hidden when using workflow templates



                }}>



                {/* Add Reviewers Button - Top Right */}



                <button



                  type="button"



                  onClick={(e) => {



                    e.stopPropagation()



                    setIsReviewersExpanded(true)



                    setTimeout(() => {



                      usernameInputRef.current?.focus()



                    }, 100)



                    if (availableUsers.length === 0) fetchUsers()



                    setShowUserDropdown(true)



                  }}



                  style={{



                    position: 'absolute',



                    top: 12,



                    right: 40,



                    display: 'flex',



                    alignItems: 'center',



                    gap: 4,



                    padding: '6px 10px',



                    background: 'rgba(10, 132, 255, 0.1)',



                    border: '2px solid rgba(10, 132, 255, 0.5)',



                    borderRadius: 6,



                    color: '#0A84FF',



                    fontSize: '0.75rem',



                    fontWeight: 700,



                    cursor: 'pointer',



                    zIndex: 10



                  }}



                >



                  <Plus size={12} strokeWidth={3} /> Add Reviewers



                </button>







                {/* Expand/Collapse Chevron - Next to Add Reviewers Button */}



                <div



                  onClick={() => setIsReviewersExpanded(!isReviewersExpanded)}



                  style={{



                    position: 'absolute',



                    top: 12,



                    right: 4,



                    width: 32,



                    height: 32,



                    display: 'flex',



                    alignItems: 'center',



                    justifyContent: 'center',



                    cursor: 'pointer',



                    zIndex: 10,



                    transform: isReviewersExpanded ? 'rotate(180deg)' : 'rotate(0deg)',



                    transition: 'transform 0.3s ease'



                  }}



                >



                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">



                    <path d="m6 9 6 6 6-6"/>



                  </svg>



                </div>







                <div 



                  onClick={() => setIsReviewersExpanded(!isReviewersExpanded)}



                  style={{



                    display: 'flex',



                    flexDirection: 'column',



                    padding: '12px 16px',



                    cursor: 'pointer',



                    background: 'rgba(255,255,255,0.03)'



                  }}



                >



                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: '8px 0 0 0', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 6 }}>



                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">



                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>



                      <circle cx="9" cy="7" r="4"/>



                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>



                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>



                    </svg>



                    Reviewers



                  </h4>



                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: '12px 0 0 0', lineHeight: 1.4 }}>



                    Share and customize proof stages by defining reviewers, deadlines, and notifications. Use workflow templates to streamline approvals and keep everyone on track.



                  </p>



                </div>







                {isReviewersExpanded && (



                  <div style={{ 



                    padding: '16px', 



                    background: 'rgba(255,255,255,0.03)'



                  }}>



                    {/* Stage 1 Bordered Container - Blue Tint */}



                    <div style={{



                      border: '1px solid rgba(10, 132, 255, 0.2)',



                      borderRadius: 16, marginTop: 8, maxHeight: '200px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)', padding: '8px',



                      padding: '16px',



                      marginBottom: 16,



                      background: 'rgba(10, 132, 255, 0.05)'



                    }}>



                      {/* Header Labels */}



                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>



                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>



                          <div style={{



                            display: 'inline-block',



                            fontSize: '0.65rem',



                            fontWeight: 700,



                            color: '#fff',



                            padding: '1px 5px',



                            border: '1px solid #0A6DD8',



                            borderRadius: 4,



                            background: '#0A6DD8',



                            textAlign: 'center',



                            minWidth: '24px'



                          }}>



                            S1



                          </div>



                          <div style={{



                            fontSize: '0.85rem',



                            fontWeight: 600,



                            color: '#fff',



                            padding: '2px 8px',



                            border: '2px dashed rgba(255,255,255,0.5)',



                            borderRadius: 4



                          }}>



                            Stage 1



                          </div>



                        </div>



                      </div>







                      {/* User Search */}



                      <div style={{ position: 'relative', marginBottom: 8 }}>



                        <input



                          ref={usernameInputRef}



                          type="text"



                          placeholder="Enter Username or Email id"



                          value={selectedUsername}



                          onChange={(e) => {



                            setSelectedUsername(e.target.value)



                            setHighlightedIndex(-1)



                            if (availableUsers.length === 0) fetchUsers()



                            setShowUserDropdown(true)



                          }}



                          onFocus={() => {



                            if (availableUsers.length === 0) fetchUsers()



                            setShowUserDropdown(true)



                          }}



                          onKeyDown={handleKeyDown}



                          className="input-field"



                          style={{ width: '100%' }}



                        />



                        



                        {showUserDropdown && filteredUsers.length > 0 && (
                          <div ref={dropdownRef} style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            right: 0,
                            background: 'rgba(20, 20, 40, 0.98)',
                            backdropFilter: 'blur(24px) saturate(180%)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(10,132,255,0.1)',
                            zIndex: 1000,
                            maxHeight: 280,
                            overflow: 'hidden',
                            animation: 'fadeUp 0.2s cubic-bezier(0.4,0,0.2,1)'
                          }}>
                            {/* Dropdown Header */}
                            <div style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid var(--glass-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: 'var(--text-tertiary)',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase'
                              }}>
                                Available Users ({filteredUsers.length})
                              </span>
                              <span style={{
                                fontSize: '0.65rem',
                                color: 'var(--text-tertiary)'
                              }}>
                                Click to select
                              </span>
                            </div>
                            
                            {/* User Options */}
                            <div style={{
                              maxHeight: 220,
                              overflowY: 'auto',
                              padding: 8
                            }}>
                              {filteredUsers.map((user, index) => (
                                <button
                                  key={user.id}
                                  type="button"
                                  ref={el => itemRefs.current[index] = el}
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    isSelectingRef.current = true
                                    setSelectedReviewers([...selectedReviewers, user])
                                    setReviewerPermissions({ ...reviewerPermissions, [user.id]: { comment: true, approve: false }})
                                    setSelectedUsername('')
                                    setHighlightedIndex(-1)
                                    setTimeout(() => {
                                      isSelectingRef.current = false
                                    }, 200)
                                  }}
                                  onClick={(e) => e.preventDefault()}
                                  onMouseEnter={() => setHighlightedIndex(index)}
                                  style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    background: highlightedIndex === index 
                                      ? 'rgba(10,132,255,0.15)' 
                                      : 'transparent',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    marginBottom: 4
                                  }}
                                >
                                  {/* Avatar */}
                                  <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: getAvatarColor(user.username, 0, []),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    boxShadow: highlightedIndex === index 
                                      ? '0 4px 12px rgba(0,0,0,0.3)' 
                                      : 'none',
                                    transition: 'all 0.2s ease'
                                  }}>
                                    <span style={{
                                      fontSize: '0.85rem',
                                      fontWeight: 700,
                                      color: '#fff'
                                    }}>
                                      {user.username.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  
                                  {/* User Info */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      marginBottom: 2
                                    }}>
                                      <span style={{
                                        fontSize: '0.9rem',
                                        fontWeight: highlightedIndex === index ? 600 : 500,
                                        color: 'var(--text-primary)'
                                      }}>
                                        {user.username}
                                      </span>
                                      {user.profile?.role && (
                                        <span style={{
                                          fontSize: '0.6rem',
                                          fontWeight: 700,
                                          color: 'var(--text-tertiary)',
                                          background: 'rgba(255,255,255,0.08)',
                                          padding: '2px 6px',
                                          borderRadius: 4,
                                          border: '1px solid var(--glass-border)',
                                          textTransform: 'uppercase'
                                        }}>
                                          {user.profile.role}
                                        </span>
                                      )}
                                    </div>
                                    <span style={{
                                      fontSize: '0.75rem',
                                      color: 'var(--text-secondary)',
                                      display: 'block',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {user.email}
                                    </span>
                                  </div>
                                  
                                  {/* Selection Indicator */}
                                  <div style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    border: highlightedIndex === index 
                                      ? '2px solid var(--ios-blue)' 
                                      : '2px solid rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease'
                                  }}>
                                    {highlightedIndex === index && (
                                      <div style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: 'var(--ios-blue)'
                                      }} />
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                            
                            {/* Dropdown Footer - Keyboard hints */}
                            <div style={{
                              padding: '10px 16px',
                              borderTop: '1px solid var(--glass-border)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 16
                            }}>
                              <span style={{
                                fontSize: '0.65rem',
                                color: 'var(--text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <kbd style={{
                                  background: 'rgba(255,255,255,0.1)',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontFamily: 'inherit',
                                  fontSize: '0.7rem'
                                }}>↑↓</kbd>
                                <span>Navigate</span>
                              </span>
                              <span style={{
                                fontSize: '0.65rem',
                                color: 'var(--text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <kbd style={{
                                  background: 'rgba(255,255,255,0.1)',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontFamily: 'inherit',
                                  fontSize: '0.7rem'
                                }}>Enter</kbd>
                                <span>Select</span>
                              </span>
                              <span style={{
                                fontSize: '0.65rem',
                                color: 'var(--text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <kbd style={{
                                  background: 'rgba(255,255,255,0.1)',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontFamily: 'inherit',
                                  fontSize: '0.7rem'
                                }}>Esc</kbd>
                                <span>Close</span>
                              </span>
                            </div>
                          </div>
                        )}



                      </div>







                      {/* Enter Folder Name (optional) - Inside S1 Container */}



                      <div style={{ marginBottom: 16 }}>



                        <input



                          type="text"



                          placeholder={canCreateFolder() ? "Enter Folder Name (optional)" : "Folder creation requires permission"}



                          value={folderNameInput}



                          onChange={(e) => setFolderNameInput(e.target.value)}



                          className="input-field"



                          style={{ 



                            width: '100%',



                            opacity: canCreateFolder() ? 1 : 0.5,



                            cursor: canCreateFolder() ? 'text' : 'not-allowed'



                          }}



                          disabled={!canCreateFolder()}



                          title={!canCreateFolder() ? "You do not have permission to create folders" : ""}



                        />



                      </div>







                      {/* Selected Reviewers Section - Gray Tint */}



                      <div style={{



                        border: '1px solid rgba(255,255,255,0.15)',



                        borderRadius: 16, marginTop: 8, maxHeight: '200px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)', padding: '8px',



                        padding: '12px',



                        background: 'rgba(255,255,255,0.04)'



                      }}>



                        {/* Status Text */}



                        <p style={{ 



                          fontSize: '0.75rem', 



                          fontWeight: 600,



                          color: 'rgba(255,255,255,0.5)', 



                          marginBottom: 12 



                        }}>



                          {selectedReviewers.length > 0 



                            ? `${selectedReviewers.length} reviewer${selectedReviewers.length > 1 ? 's' : ''} selected` 



                            : 'No reviewers selected'}



                        </p>







                        {/* Selected Reviewers List */}



                        {selectedReviewers.length > 0 && (



                          <div style={{ 



                            display: 'flex', 



                            flexDirection: 'column', 



                            gap: 8,



                            maxHeight: '120px',



                            overflowY: 'auto',



                            paddingRight: '8px'



                          }}>



                          {selectedReviewers.map((reviewer, index) => (



                            <div key={reviewer.id} style={{



                              display: 'flex',



                              alignItems: 'center',



                              gap: 10,



                              padding: '10px',



                              background: 'rgba(255,255,255,0.05)',



                              borderRadius: 6



                            }}>



                              <div style={{



                                width: 32,



                                height: 32,



                                borderRadius: '50%',



                                background: getAvatarColor(reviewer.username, index, []),



                                display: 'flex',



                                alignItems: 'center',



                                justifyContent: 'center',



                                fontSize: '0.8rem',



                                fontWeight: 600,



                                color: '#fff'



                              }}>



                                {reviewer.username.charAt(0).toUpperCase()}



                              </div>



                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>



                                <span style={{ fontSize: '0.8rem', color: '#fff' }}>{reviewer.username}</span>



                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{reviewer.email}</span>



                              </div>



                              <button



                                type="button"



                                onClick={() => {



                                  setSelectedReviewers(selectedReviewers.filter(r => r.id !== reviewer.id))



                                  const newPermissions = { ...reviewerPermissions }



                                  delete newPermissions[reviewer.id]



                                  setReviewerPermissions(newPermissions)



                                }}



                                style={{
                                  width: 18,



                                  height: 18,



                                  borderRadius: 4,



                                  background: "rgba(255, 255, 255, 0.08)",



                                  border: 'none',



                                  color: '#ff3b30',



                                  cursor: 'pointer',



                                  display: 'flex',



                                  alignItems: 'center',



                                  justifyContent: 'center'



                                }}

                              >

                                <X size={10} strokeWidth={3} />



                              </button>



                            </div>



                          ))}



                          </div>



                        )}



                      </div>



                    </div>



                  </div>



                )}



              </div>



            </div>



          </div>



        </form>



      </div>



    </div>



  )



}







export default CreateProofModal



