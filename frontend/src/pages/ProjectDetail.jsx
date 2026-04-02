import React, { useState, useEffect, useRef } from 'react'
import CrushLoader from '../components/CrushLoader'
import { useParams, Link } from 'react-router-dom'
import { Plus, Users, FileText, X, Upload, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

const getMediaUrl = (fileUrl) => {
  if (!fileUrl) return null
  if (fileUrl.includes('localhost:8000')) {
    return fileUrl
  }
  if (fileUrl.startsWith('/api/versioning/media/')) {
    return `http://localhost:8000${fileUrl}`
  }
  if (fileUrl.startsWith('/media/')) {
    return `http://localhost:8000/api/versioning/media${fileUrl.replace('/media', '')}`
  }
  return `http://localhost:8000/api/versioning/media${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`
}

function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [assets, setAssets] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [uploadData, setUploadData] = useState({ name: '', file_type: 'pdf', file: null })
  const [memberData, setMemberData] = useState({ username: '', role: 'viewer' })
  const [usernameValidation, setUsernameValidation] = useState({ isValid: false, message: '', checking: false })
  const [debouncedUsername, setDebouncedUsername] = useState('')
  const [availableUsers, setAvailableUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [createdAssetId, setCreatedAssetId] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const uploadFormRef = useRef(null)

  useEffect(() => {
    fetchProjectData()
  }, [id])

  // Debounce username input to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(memberData.username)
    }, 500)

    return () => clearTimeout(timer)
  }, [memberData.username])

  // Check username when debounced value changes
  useEffect(() => {
    if (debouncedUsername) {
      checkUsernameExists(debouncedUsername)
    } else {
      setUsernameValidation({ isValid: false, message: '', checking: false })
    }
  }, [debouncedUsername])

  // Fetch available users when modal opens
  useEffect(() => {
    if (showMemberModal) {
      fetchAvailableUsers()
    }
  }, [showMemberModal])

  const fetchAvailableUsers = async () => {
    setUsersLoading(true)
    try {
      const response = await api.get('/versioning/projects/list_users/')
      setAvailableUsers(response.data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setUsersLoading(false)
    }
  }

  const fetchProjectData = async () => {
    try {
      const [projectRes, assetsRes] = await Promise.all([
        api.get(`/versioning/projects/${id}/`),
        api.get(`/versioning/assets/?project_id=${id}`),
      ])
      setProject(projectRes.data)
      setAssets(assetsRes.data.results || assetsRes.data)
      setMembers(projectRes.data.members || [])
    } catch (error) {
      toast.error('Failed to fetch project data')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadAsset = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Prevent multiple submissions
    if (isUploading) {
      console.log('Upload already in progress, ignoring...')
      return
    }
    
    if (!uploadData.file) {
      toast.error('Please select a file')
      return
    }

    console.log('Starting upload process...')
    setIsUploading(true)
    
    try {
      // First create the asset
      const assetData = {
        project: id,
        name: uploadData.name,
        file_type: uploadData.file_type,
        description: ''
      }
      
      const assetResponse = await api.post('/versioning/assets/', assetData)
      const asset = assetResponse.data
      
      // Store the created asset ID for cleanup if needed
      setCreatedAssetId(asset.id)
      
      // Then upload the file as a version
      const formData = new FormData()
      formData.append('file', uploadData.file)
      formData.append('change_notes', 'Initial upload')
      
      const versionResponse = await api.post(`/versioning/assets/${asset.id}/upload_version/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      
      // Update the asset with version info
      const updatedAsset = {
        ...asset,
        versions: [versionResponse.data],
        current_version: versionResponse.data,
        version_count: 1
      }
      
      setAssets([updatedAsset, ...assets])
      setUploadData({ name: '', file_type: 'pdf', file: null })
      setCreatedAssetId(null)
      setShowUploadModal(false)
      toast.success('Asset uploaded successfully!')
    } catch (error) {
      console.error('Asset upload error:', error)
      
      // Clear any existing toasts to prevent duplicates
      toast.dismiss()
      
      let errorMessage = 'Failed to upload asset'
      
      if (error.response?.data?.detail) {
        // Replace common error messages with user-friendly ones
        const detail = error.response.data.detail
        if (detail.includes('Unsupported media type') || detail.includes('media type')) {
          errorMessage = 'Unsupported file type. Please upload a valid file (Images, PDFs, or Videos).'
        } else if (detail.includes('File extension')) {
          errorMessage = 'Unsupported file type. Please upload a valid file (Images, PDFs, or Videos).'
        } else if (detail.includes('File too large')) {
          errorMessage = 'File is too large. Please upload a file smaller than 500MB.'
        } else {
          errorMessage = detail
        }
      } else if (error.response?.data?.file?.[0]) {
        const fileError = error.response.data.file[0]
        if (fileError.includes('Unsupported media type') || fileError.includes('media type')) {
          errorMessage = 'Unsupported file type. Please upload a valid file (Images, PDFs, or Videos).'
        } else if (fileError.includes('File extension')) {
          errorMessage = 'Unsupported file type. Please upload a valid file (Images, PDFs, or Videos).'
        } else if (fileError.includes('File too large')) {
          errorMessage = 'File is too large. Please upload a file smaller than 500MB.'
        } else {
          errorMessage = fileError
        }
      } else if (error.response?.data?.name?.[0]) {
        errorMessage = error.response.data.name[0]
      } else if (error.response?.data?.file_type?.[0]) {
        errorMessage = error.response.data.file_type[0]
      } else if (error.response?.data?.project?.[0]) {
        errorMessage = error.response.data.project[0]
      } else if (error.message) {
        errorMessage = error.message
      }
      
      console.log('Showing error toast:', errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
      console.log('Upload process completed, isUploading set to false')
    }
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Prevent multiple submissions
    if (isUploading) {
      console.log('Form submitted while uploading, ignoring...')
      return
    }
    
    handleUploadAsset(e)
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    
    // No validation needed since dropdown only contains valid users
    if (!memberData.username) {
      toast.error('Please select a user')
      return
    }
    
    try {
      await api.post(`/versioning/projects/${id}/add_member/`, memberData)
      fetchProjectData()
      setMemberData({ username: '', role: 'viewer' })
      setUsernameValidation({ isValid: false, message: '', checking: false })
      setShowMemberModal(false)
      toast.success('Member added successfully!')
    } catch (error) {
      toast.error('Failed to add member')
    }
  }

  const checkUsernameExists = async (username) => {
    if (!username.trim()) {
      setUsernameValidation({ isValid: false, message: '', checking: false })
      return
    }

    setUsernameValidation({ isValid: false, message: '', checking: true })

    try {
      console.log('Checking username:', username.trim())
      const response = await api.get(`/versioning/projects/check_username/?username=${username.trim()}`)
      console.log('API Response:', response.data)
      
      if (response.data.exists) {
        setUsernameValidation({ 
          isValid: true, 
          message: `${response.data.user_info.first_name} ${response.data.user_info.last_name} (${response.data.user_info.username})`, 
          checking: false 
        })
      } else {
        setUsernameValidation({ isValid: false, message: response.data.message, checking: false })
      }
    } catch (error) {
      console.error('Error checking username:', error)
      setUsernameValidation({ isValid: false, message: 'Error checking username', checking: false })
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      setUploadData({ ...uploadData, file })
      
      // Auto-detect file type based on extension
      const extension = file.name.split('.').pop().toLowerCase()
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        setUploadData(prev => ({ ...prev, file, file_type: 'image' }))
      } else if (extension === 'pdf') {
        setUploadData(prev => ({ ...prev, file, file_type: 'pdf' }))
      } else if (['mp4', 'webm', 'mov', 'avi'].includes(extension)) {
        setUploadData(prev => ({ ...prev, file, file_type: 'video' }))
      }
      
      // Auto-fill name if empty
      if (!uploadData.name) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '')
        setUploadData(prev => ({ ...prev, file, name: nameWithoutExtension }))
      }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadData({ ...uploadData, file })
      
      // Auto-detect file type based on extension
      const extension = file.name.split('.').pop().toLowerCase()
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        setUploadData(prev => ({ ...prev, file, file_type: 'image' }))
      } else if (extension === 'pdf') {
        setUploadData(prev => ({ ...prev, file, file_type: 'pdf' }))
      } else if (['mp4', 'webm', 'mov', 'avi'].includes(extension)) {
        setUploadData(prev => ({ ...prev, file, file_type: 'video' }))
      }
      
      // Auto-fill name if empty
      if (!uploadData.name) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '')
        setUploadData(prev => ({ ...prev, file, name: nameWithoutExtension }))
      }
    }
  }

  const handleCancelUpload = async () => {
    // If we created an asset but haven't uploaded the file yet, delete it
    if (createdAssetId) {
      try {
        await api.delete(`/versioning/assets/${createdAssetId}/`)
      } catch (error) {
        console.error('Failed to cleanup asset:', error)
      }
    }
    
    // Reset all upload data
    setUploadData({ name: '', file_type: 'pdf', file: null })
    setCreatedAssetId(null)
    setShowUploadModal(false)
  }

  const handleAssetClick = (asset, e) => {
    e.preventDefault()
    // Open the FileViewer in a new tab while keeping Proofie website open
    const fileUrl = `/files/${asset.id}`
    console.log('Asset ID:', asset.id)
    console.log('Asset ID type:', typeof asset.id)
    console.log('Asset ID length:', asset.id.length)
    console.log('Opening FileViewer URL in new tab:', fileUrl)
    window.open(fileUrl, '_blank')
  }

  const fetchComments = async (assetId) => {
    try {
      const response = await api.get(`/versioning/assets/${assetId}/comments/`)
      setComments(response.data.results || response.data || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      setComments([])
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) {
      toast.error('Please enter a comment')
      return
    }

    try {
      const response = await api.post(`/versioning/assets/${selectedAsset.id}/comments/`, {
        content: commentText.trim()
      })
      setComments([response.data, ...comments])
      setCommentText('')
      toast.success('Comment added successfully!')
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast.error('Failed to add comment')
    }
  }

  const ModalLabel = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,
      color: 'rgba(255,255,255,0.45)', marginBottom: 8,
      letterSpacing: '0.06em', textTransform: 'uppercase' }}>{children}</label>
  )

  if (loading) return (
    <div style={{ padding: '36px 40px' }}><CrushLoader text="Loading project..." /></div>
  )

  return (
    <div style={{ padding: '36px 40px' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <Link to="/proofs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.82rem',
          fontWeight: 500, marginBottom: 16 }}>
          <ArrowLeft size={14} /> Projects
        </Link>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
          {project?.name}
        </h1>
        {project?.description && (
          <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 8, fontSize: '0.95rem' }}>
            {project.description}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
        {/* Assets panel */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>Assets</p>
          </div>
          {assets.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assets.map((asset) => (
                <div 
                key={asset.id}
                onClick={(e) => handleAssetClick(asset, e)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', borderRadius: 14, textDecoration: 'none',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
              >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden',
                      background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative' }}>
                      {asset.current_version?.file_url ? (
                        asset.file_type === 'image' ? (
                          <img 
                            src={getMediaUrl(asset.current_version.file_url)} 
                            alt={asset.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0
                            }}
                            onError={(e) => {
                              // Fallback if image fails to load
                              e.target.style.display = 'none'
                              e.target.parentElement.innerHTML = `
                                <div style="
                                  width: 100%; 
                                  height: 100%; 
                                  display: flex; 
                                  align-items: center; 
                                  justify-content: center;
                                  background: linear-gradient(135deg, #0A84FF, #5E5CE6);
                                  color: #fff;
                                  font-size: 0.6rem;
                                  font-weight: 700;
                                  text-align: center;
                                ">IMG</div>
                              `
                            }}
                          />
                        ) : asset.file_type === 'pdf' ? (
                          <div style={{ 
                            width: '100%', 
                            height: '100%', 
                            position: 'relative',
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <iframe
                              src={`${getMediaUrl(asset.current_version.file_url)}#view=FitV&toolbar=0&navpanes=0&scrollbar=0`}
                              style={{
                                width: '200%',
                                height: '200%',
                                position: 'absolute',
                                top: '-50%',
                                left: '-50%',
                                border: 'none',
                                transform: 'scale(0.5)',
                                transformOrigin: 'top left'
                              }}
                              title={asset.name}
                              onLoad={() => {
                                // PDF loaded successfully
                              }}
                              onError={() => {
                                // Fallback if iframe fails
                                this.parentElement.innerHTML = `
                                  <div style="
                                    width: 100%; 
                                    height: 100%; 
                                    display: flex; 
                                    align-items: center; 
                                    justify-content: center;
                                    background: linear-gradient(135deg, #ff4444, #cc0000);
                                    color: #fff;
                                    font-size: 0.6rem;
                                    font-weight: 700;
                                    text-align: center;
                                  ">PDF</div>
                                `
                              }}
                            />
                          </div>
                        ) : asset.file_type === 'video' ? (
                          <video
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              muted: true
                            }}
                            muted
                            playsInline
                          >
                            <source src={getMediaUrl(asset.current_version.file_url)} type="video/mp4" />
                          </video>
                        ) : (
                          <FileText size={24} color="#0A84FF" />
                        )
                      ) : (
                        <FileText size={24} color="#0A84FF" />
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>{asset.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                        {asset.version_count || 0} version{asset.version_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="badge badge-primary">{asset.file_type}</span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!confirm(`Delete "${asset.name}"? This action cannot be undone.`)) return
                        try {
                          await api.delete(`/versioning/assets/${asset.id}/`)
                          toast.success('Asset deleted successfully')
                          fetchProjectData()
                        } catch (error) {
                          toast.error('Failed to delete asset: ' + (error.response?.data?.error || error.message))
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#EF4444',
                        border: 'none',
                        borderRadius: 8,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='#DC2626'}
                      onMouseLeave={e => e.currentTarget.style.background='#EF4444'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <FileText size={36} color="rgba(255,255,255,0.12)" style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>No assets yet</p>
              <button onClick={() => setShowUploadModal(true)} className="btn-primary"
                style={{ borderRadius: 12, fontSize: '0.85rem' }}>
                <Upload size={15} /> Upload first asset
              </button>
            </div>
          )}
        </div>

        {/* Members panel */}
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Members</p>
            <button onClick={() => setShowMemberModal(true)} style={{
              width: 30, height: 30, borderRadius: 9, background: 'rgba(10,132,255,0.2)',
              border: '1px solid rgba(10,132,255,0.35)', color: '#0A84FF',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={15} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map((member) => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9,
                  background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.82rem', color: '#fff', flexShrink: 0 }}>
                  {member.user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>{member.user?.username}</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: 1, textTransform: 'capitalize' }}>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCancelUpload()}>
          <div className="modal-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Upload Asset</h2>
              <button onClick={handleCancelUpload} style={{
                width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <form ref={uploadFormRef} onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><ModalLabel>Asset Name</ModalLabel>
                <input type="text" value={uploadData.name}
                  onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                  className="input-field" placeholder="e.g. Hero Banner" required /></div>
              <div><ModalLabel>File Type</ModalLabel>
                <select value={uploadData.file_type}
                  onChange={(e) => setUploadData({ ...uploadData, file_type: e.target.value })}
                  className="input-field"
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                    paddingRight: '40px',
                    textAlign: 'left'
                  }}>
                  <option value="image">Image</option>
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                </select></div>
              <div><ModalLabel>File</ModalLabel>
                <div style={{ position: 'relative' }}>
                  <input type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    required />
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      gap: 10,
                      padding: '20px',
                      background: isDragging ? 
                        'rgba(10, 132, 255, 0.2)' : 
                        uploadData.file ? 'rgba(10, 132, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                      border: isDragging ?
                        '2px solid #0A84FF' :
                        uploadData.file ? '2px solid #0A84FF' : '2px dashed rgba(255, 255, 255, 0.2)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                      color: isDragging ? '#0A84FF' : uploadData.file ? '#0A84FF' : 'rgba(255, 255, 255, 0.7)',
                      textAlign: 'left',
                      transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isDragging ? '0 8px 25px rgba(10, 132, 255, 0.3)' : 'none'
                    }}>
                    <Upload size={20} style={{ 
                      flexShrink: 0,
                      color: 'rgba(255, 255, 255, 0.6)'
                    }} />
                    <label htmlFor="file-upload" style={{ 
                      cursor: 'pointer', 
                      display: 'block',
                      width: '100%',
                      margin: 0,
                      textAlign: 'left'
                    }}>
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>
                          {isDragging ? 
                            'Drop file here' : 
                            uploadData.file ? uploadData.file.name : 
                            'Choose File or Drag & Drop'
                          }
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, textAlign: 'center' }}>
                          {uploadData.file ? 
                            `${(uploadData.file.size / 1024 / 1024).toFixed(2)} MB` : 
                            isDragging ?
                              'Release to upload' :
                              'Supported: Images, PDFs, Videos (Max 500MB)'
                          }
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button type="submit" className="btn-primary" disabled={isUploading}
                  style={{ flex: 1, justifyContent: 'center', borderRadius: 14, padding: '13px', opacity: isUploading ? 0.7 : 1 }}>
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
                <button type="button" onClick={handleCancelUpload} className="btn-secondary" disabled={isUploading}
                  style={{ flex: 1, justifyContent: 'center', borderRadius: 14, padding: '13px', opacity: isUploading ? 0.7 : 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowMemberModal(false)}>
          <div className="modal-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Add Member</h2>
              <button onClick={() => setShowMemberModal(false)} style={{
                width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><ModalLabel>Username</ModalLabel>
                <select 
                  value={memberData.username}
                  onChange={(e) => {
                    const selectedUsername = e.target.value
                    setMemberData({ ...memberData, username: selectedUsername })
                    setUsernameValidation({ 
                      isValid: selectedUsername !== '', 
                      message: '', 
                      checking: false 
                    })
                  }}
                  className="input-field" 
                  required
                  disabled={usersLoading}
                  style={{
                    borderColor: memberData.username ? '#30D158' : undefined,
                    boxShadow: memberData.username ? '0 0 0 2px rgba(48, 209, 88, 0.2)' : undefined,
                    opacity: usersLoading ? 0.6 : 1,
                    cursor: usersLoading ? 'not-allowed' : 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.7)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                    paddingRight: '40px'
                  }}
                >
                  <option value="" disabled>Select User</option>
                  {availableUsers.map(user => (
                    <option key={user.username} value={user.username}>
                      {user.username}
                    </option>
                  ))}
                </select>
                {usersLoading && (
                  <div style={{ fontSize: '0.8rem', color: '#0A84FF', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', border: '2px solid #0A84FF', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Loading users...
                  </div>
                )}
                {!usersLoading && availableUsers.length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#FF375F', marginTop: '4px' }}>
                    No users available
                  </div>
                )}
              </div>
              <div><ModalLabel>Role</ModalLabel>
                <select value={memberData.role}
                  onChange={(e) => setMemberData({ ...memberData, role: e.target.value })}
                  className="input-field"
                  style={{
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.7)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                    paddingRight: '40px'
                  }}>
                  <option value="viewer">Viewer</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Admin</option>
                </select></div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={!memberData.username || usersLoading}
                  style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    borderRadius: 14, 
                    padding: '13px',
                    opacity: (!memberData.username || usersLoading) ? 0.6 : 1,
                    cursor: (!memberData.username || usersLoading) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Add Member
                </button>
                <button type="button" onClick={() => setShowMemberModal(false)} className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', borderRadius: 14, padding: '13px' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCommentModal(false)}>
          <div className="modal-box" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                {selectedAsset?.name} - Comments
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedAsset?.current_version?.file_url && (
                  <button
                    onClick={() => {
                      const assetUrl = `${window.location.origin}/assets/${selectedAsset.id}`
                      window.open(assetUrl, '_blank', 'noopener,noreferrer')
                    }}
                    className="btn-primary"
                    style={{
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    Open in Tab
                  </button>
                )}
                <button onClick={() => setShowCommentModal(false)} style={{
                  width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* Asset Preview */}
            {selectedAsset?.current_version?.file_url && (
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                {selectedAsset.file_type === 'image' ? (
                  <img 
                    src={getMediaUrl(selectedAsset.current_version.file_url)} 
                    alt={selectedAsset.name}
                    style={{
                      maxWidth: '200px',
                      maxHeight: '150px',
                      borderRadius: 8,
                      objectFit: 'contain',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  />
                ) : selectedAsset.file_type === 'pdf' ? (
                  <div style={{ 
                    width: '200px', 
                    height: '150px', 
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    margin: '0 auto'
                  }}>
                    <iframe
                      src={`${getMediaUrl(selectedAsset.current_version.file_url)}#view=FitV&toolbar=0&navpanes=0&scrollbar=0`}
                      style={{
                        width: '200%',
                        height: '200%',
                        position: 'absolute',
                        top: '-50%',
                        left: '-50%',
                        border: 'none',
                        transform: 'scale(0.5)',
                        transformOrigin: 'top left'
                      }}
                      title={selectedAsset.name}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    width: '200px', 
                    height: '150px', 
                    background: 'rgba(10,132,255,0.15)', 
                    border: '1px solid rgba(10,132,255,0.25)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <FileText size={32} color="#0A84FF" />
                  </div>
                )}
              </div>
            )}

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} style={{ marginBottom: 24 }}>
              <div>
                <ModalLabel>Add Comment</ModalLabel>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="Enter your comment..."
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="submit" className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', borderRadius: 14, padding: '13px' }}>
                  Add Comment
                </button>
                <button type="button" onClick={() => setCommentText('')} className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', borderRadius: 14, padding: '13px' }}>
                  Clear
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div>
              <ModalLabel>Comments ({comments.length})</ModalLabel>
              {comments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '300px', overflowY: 'auto' }}>
                  {comments.map((comment) => (
                    <div key={comment.id} style={{
                      padding: '16px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: 8, 
                            background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {comment.author?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>
                              {comment.author?.username || 'Unknown User'}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                              {new Date(comment.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)' }}>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetail
