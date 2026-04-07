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
  const [stageReviewers, setStageReviewers] = useState({})
  const [expandedStages, setExpandedStages] = useState({})
  const usernameInputRef = useRef(null)



  const dropdownRef = useRef(null)



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
          initialExpandedStages[stage.id] = stage.order === 1 // Expand first stage by default
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



    



    try {



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







  // Handle click outside to close dropdown



  useEffect(() => {



    const handleClickOutside = (event) => {



      // Don't close if we're currently selecting



      if (isSelectingRef.current) {



        return



      }



      



      if (showUserDropdown && 



          dropdownRef.current && 



          !dropdownRef.current.contains(event.target) &&



          usernameInputRef.current &&



          !usernameInputRef.current.contains(event.target)) {



        setShowUserDropdown(false)



      }



    }







    document.addEventListener('mousedown', handleClickOutside)



    return () => {



      document.removeEventListener('mousedown', handleClickOutside)



    }



  }, [showUserDropdown])







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



      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null



    }))



    



    setUploadedFiles([...uploadedFiles, ...newFiles])



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







  const removeFile = (fileId) => {



    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId))



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



              onChange={(e) => handleFileUpload(e.target.files)}



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



                    borderRadius: 8,



                    marginBottom: 8



                  }}>



                    <div style={{



                      width: 40,



                      height: 40,



                      borderRadius: 8,



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



                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', margin: '2px 0 0 0' }}>



                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB



                      </p>



                    </div>



                    <button



                      type="button"



                      onClick={(e) => { e.stopPropagation(); removeFile(uploadedFile.id); }}



                      style={{



                        width: 28,



                        height: 28,



                        borderRadius: 6,



                        background: 'transparent',



                        border: 'none',



                        color: '#ff3b30',



                        cursor: 'pointer',



                        display: 'flex',



                        alignItems: 'center',



                        justifyContent: 'center'



                      }}



                    >



                      <X size={16} strokeWidth={3} />



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



              <button type="submit" className="btn-primary"



                style={{ width: '120px', justifyContent: 'center', borderRadius: 14, padding: '10px' }}>



                Create



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



              minHeight: '480px'



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
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.45)', marginBottom: 8, letterSpacing: '0.06em',
                    textTransform: 'uppercase' }}>Workflow Template</label>
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const template = workflowTemplates.find(t => t.id === parseInt(e.target.value))
                      setSelectedTemplate(template)
                      // Reset stage reviewers when template changes
                      const newStageReviewers = {}
                      const newExpandedStages = {}
                      template?.stages.forEach(stage => {
                        newStageReviewers[stage.id] = []
                        newExpandedStages[stage.id] = stage.order === 1
                      })
                      setStageReviewers(newStageReviewers)
                      setExpandedStages(newExpandedStages)
                    }}
                    className="input-field"
                    style={{ cursor: 'pointer' }}
                  >
                    {workflowTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {selectedTemplate && (
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: 6 }}>
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>
              )}

              {/* Stage Reviewers Section - Dynamic based on template */}
              {selectedTemplate && selectedTemplate.stages && selectedTemplate.stages.map((stage, index) => (
                <div 
                  key={stage.id}
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.02)',
                    position: 'relative'
                  }}>
                  {/* Stage Header */}
                  <div
                    onClick={() => setExpandedStages({ ...expandedStages, [stage.id]: !expandedStages[stage.id] })}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: expandedStages[stage.id] ? '1px solid rgba(255,255,255,0.1)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0A84FF' }}>
                        S{stage.order}:
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                        {stage.name}
                      </span>
                      {stageReviewers[stage.id] && stageReviewers[stage.id].length > 0 && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#10B981',
                          background: 'rgba(16,185,129,0.15)',
                          padding: '2px 8px',
                          borderRadius: 12,
                          border: '1px solid rgba(16,185,129,0.3)'
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
                      ▼
                    </div>
                  </div>

                  {/* Stage Content - Expanded */}
                  {expandedStages[stage.id] && (
                    <div style={{ padding: '12px 16px' }}>
                      {/* Selected Reviewers for this stage */}
                      {stageReviewers[stage.id] && stageReviewers[stage.id].length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                          {stageReviewers[stage.id].map(reviewer => (
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
                                  background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: '#fff'
                                }}>
                                  {reviewer.username?.[0]?.toUpperCase()}
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                                  {reviewer.username}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeReviewerFromStage(stage.id, reviewer.id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#ff3b30',
                                  cursor: 'pointer',
                                  padding: 4
                                }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* User Selection Dropdown */}
                      <div style={{ marginBottom: 8 }}>
                        <select
                          className="input-field"
                          style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                          value=""
                          onChange={(e) => {
                            const userId = parseInt(e.target.value)
                            const user = availableUsers.find(u => u.id === userId)
                            if (user) {
                              addReviewerToStage(stage.id, user)
                            }
                            e.target.value = '' // Reset selection
                          }}
                          onFocus={() => {
                            if (availableUsers.length === 0) fetchUsers()
                          }}
                        >
                          <option value="">Select a reviewer...</option>
                          {getAvailableUsersForStage(stage.id).map(user => (
                            <option key={user.id} value={user.id}>
                              {user.username} ({user.email})
                            </option>
                          ))}
                        </select>
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



                  borderRadius: 8,



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



                      borderRadius: 8,



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



                            top: '100%',



                            left: 0,



                            right: 0,



                            background: 'rgba(30, 30, 40, 0.95)',



                            border: '1px solid rgba(255,255,255,0.2)',



                            borderRadius: 8,



                            marginTop: 4,



                            maxHeight: '150px',



                            overflow: 'auto',



                            zIndex: 1000



                          }}>



                            {filteredUsers



                              .map((user, index) => (



                                <div



                                  key={user.id}



                                  ref={el => itemRefs.current[index] = el}



                                  onMouseDown={(e) => {



                                    e.preventDefault()



                                    e.stopPropagation()



                                    isSelectingRef.current = true



                                    setSelectedReviewers([...selectedReviewers, user])



                                    setReviewerPermissions({ ...reviewerPermissions, [user.id]: { comment: true, approve: false }})



                                    setSelectedUsername('')



                                    setHighlightedIndex(-1)



                                    // Reset the ref after a short delay



                                    setTimeout(() => {



                                      isSelectingRef.current = false



                                    }, 200)



                                  }}



                                  onClick={(e) => e.preventDefault()}



                                  style={{



                                    padding: '4px 10px',



                                    color: '#fff',



                                    cursor: 'pointer',



                                    borderBottom: '1px solid rgba(255,255,255,0.05)',



                                    display: 'flex',



                                    alignItems: 'center',



                                    gap: 6,



                                    background: highlightedIndex === index ? 'rgba(10, 132, 255, 0.2)' : 'transparent'



                                  }}



                                >



                                  <div style={{



                                    width: 28,



                                    height: 28,



                                    borderRadius: '50%',



                                    background: getAvatarColor(user.username, 0, []),



                                    display: 'flex',



                                    alignItems: 'center',



                                    justifyContent: 'center',



                                    fontSize: '0.75rem',



                                    fontWeight: 600



                                  }}>



                                    {user.username.charAt(0).toUpperCase()}



                                  </div>



                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>



                                    <span style={{ fontSize: '0.85rem' }}>{user.username}</span>



                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{user.email}</span>



                                  </div>



                                </div>



                              ))}



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



                        borderRadius: 8,



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



                                  width: 24,



                                  height: 24,



                                  borderRadius: 5,



                                  background: 'transparent',



                                  border: 'none',



                                  color: '#ff3b30',



                                  cursor: 'pointer',



                                  display: 'flex',



                                  alignItems: 'center',



                                  justifyContent: 'center'



                                }}



                              >



                                <X size={14} strokeWidth={3} />



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



