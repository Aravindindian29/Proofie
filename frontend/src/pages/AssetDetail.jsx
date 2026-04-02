import React, { useState, useEffect } from 'react'
import CrushLoader from '../components/CrushLoader'
import { useParams, Link } from 'react-router-dom'
import { Plus, MessageSquare, Check, X, ArrowLeft, Clock, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import AssetViewer from '../components/AssetViewer'

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

function AssetDetail() {
  const { id } = useParams()
  const [asset, setAsset] = useState(null)
  const [currentVersion, setCurrentVersion] = useState(null)
  const [versions, setVersions] = useState([])
  const [annotations, setAnnotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAnnotationModal, setShowAnnotationModal] = useState(false)
  const [showAssetViewer, setShowAssetViewer] = useState(false)
  const [annotationData, setAnnotationData] = useState({
    x_coordinate: 0,
    y_coordinate: 0,
    content: '',
    annotation_type: 'comment',
    color: '#FF0000',
  })

  useEffect(() => {
    fetchAssetData()
  }, [id])

  const fetchAssetData = async () => {
    try {
      const assetRes = await api.get(`/versioning/assets/${id}/`)
      setAsset(assetRes.data)
      setCurrentVersion(assetRes.data.current_version)
      setVersions(assetRes.data.versions || [])

      if (assetRes.data.current_version) {
        const annotationsRes = await api.get(`/annotations/?version_id=${assetRes.data.current_version.id}`)
        setAnnotations(annotationsRes.data.results || annotationsRes.data)
      }
    } catch (error) {
      toast.error('Failed to fetch asset data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnotation = async (e) => {
    e.preventDefault()
    if (!currentVersion) {
      toast.error('No version selected')
      return
    }

    try {
      const response = await api.post('/annotations/', {
        version: currentVersion.id,
        ...annotationData,
      })
      setAnnotations([response.data, ...annotations])
      setAnnotationData({
        x_coordinate: 0,
        y_coordinate: 0,
        content: '',
        annotation_type: 'comment',
        color: '#FF0000',
      })
      setShowAnnotationModal(false)
      toast.success('Annotation created!')
    } catch (error) {
      toast.error('Failed to create annotation')
    }
  }

  const handleResolveAnnotation = async (annotationId) => {
    try {
      const response = await api.post(`/annotations/${annotationId}/resolve/`)
      setAnnotations(annotations.map(a => a.id === annotationId ? response.data : a))
      toast.success('Annotation resolved!')
    } catch (error) {
      toast.error('Failed to resolve annotation')
    }
  }

  const ML = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,
      color: 'rgba(255,255,255,0.45)', marginBottom: 8,
      letterSpacing: '0.06em', textTransform: 'uppercase' }}>{children}</label>
  )

  if (loading) return (
    <div style={{ padding: '36px 40px' }}><CrushLoader text="Loading asset..." /></div>
  )

  return (
    <div style={{ padding: '36px 40px' }}>
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <Link to={`/proofs/${asset?.project}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.82rem',
          fontWeight: 500, marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back to Project
        </Link>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>
          {asset?.name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <span className="badge badge-primary">{asset?.file_type}</span>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.38)' }}>
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, alignItems: 'start' }}>
        {/* Left: version preview + annotations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Current version preview */}
          {currentVersion && (
            <div className="glass-card-static" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>Current Version</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => setShowAssetViewer(true)}
                    className="btn-primary"
                    style={{ 
                      borderRadius: 12, 
                      padding: '8px 16px', 
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                    <Eye size={14} />
                    Open Viewer
                  </button>
                  <a 
                    href={getMediaUrl(currentVersion.file_url)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ 
                      borderRadius: 12, 
                      padding: '8px 16px', 
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                    Open File
                  </a>
                  <button onClick={() => setShowAnnotationModal(true)} className="btn-primary"
                    style={{ borderRadius: 12, padding: '8px 16px', fontSize: '0.82rem' }}>
                    <Plus size={14} /> Annotate
                  </button>
                </div>
              </div>
              
              {/* File Preview */}
              <div style={{
                background: 'rgba(10,132,255,0.06)', border: '1px solid rgba(10,132,255,0.15)',
                borderRadius: 16, padding: '20px', textAlign: 'center', marginBottom: 16,
                minHeight: '300px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {asset?.file_type === 'image' && currentVersion.file_url ? (
                  <img 
                    src={getMediaUrl(currentVersion.file_url)} 
                    alt={asset.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      borderRadius: 8,
                      objectFit: 'contain'
                    }}
                  />
                ) : asset?.file_type === 'pdf' && currentVersion.file_url ? (
                  <div style={{ width: '100%', height: '500px' }}>
                    <iframe
                      src={getMediaUrl(currentVersion.file_url)}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: 8
                      }}
                      title={asset.name}
                    />
                  </div>
                ) : asset?.file_type === 'video' && currentVersion.file_url ? (
                  <video
                    controls
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      borderRadius: 8
                    }}
                  >
                    <source src={getMediaUrl(currentVersion.file_url)} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                      background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(10,132,255,0.4)' }}>
                      <MessageSquare size={24} color="#fff" />
                    </div>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                      Version {currentVersion.version_number}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                      Uploaded by {currentVersion.uploaded_by?.username}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                      File size: {currentVersion.file_size ? `${(currentVersion.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Annotations */}
          <div className="glass-card-static" style={{ padding: '24px' }}>
            <p style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: 20 }}>Annotations</p>
            {annotations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {annotations.map((ann) => (
                  <div key={ann.id} style={{
                    padding: '16px', borderRadius: 14,
                    background: `${ann.color}12`,
                    border: `1px solid ${ann.color}35`,
                    borderLeft: `3px solid ${ann.color}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8,
                          background: `${ann.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: ann.color }}>
                            {ann.author?.username?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>{ann.author?.username}</p>
                          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                            ({ann.x_coordinate}, {ann.y_coordinate})
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {ann.is_resolved
                          ? <span className="badge badge-success">Resolved</span>
                          : <button onClick={() => handleResolveAnnotation(ann.id)} style={{
                              width: 28, height: 28, borderRadius: 8,
                              background: 'rgba(48,209,88,0.15)', border: '1px solid rgba(48,209,88,0.3)',
                              color: '#30D158', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={14} />
                            </button>
                        }
                      </div>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{ann.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <MessageSquare size={32} color="rgba(255,255,255,0.12)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ color: 'rgba(255,255,255,0.3)' }}>No annotations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: version history */}
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: 16 }}>Version History</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {versions.map((ver) => {
              const isCurrent = currentVersion?.id === ver.id
              return (
                <div key={ver.id} style={{
                  padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                  background: isCurrent ? 'rgba(10,132,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: isCurrent ? '1px solid rgba(10,132,255,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                      background: isCurrent ? 'rgba(10,132,255,0.25)' : 'rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={14} color={isCurrent ? '#0A84FF' : 'rgba(255,255,255,0.4)'} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: isCurrent ? '#60b3ff' : '#fff', fontSize: '0.88rem' }}>
                        v{ver.version_number}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>
                        {new Date(ver.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {ver.change_notes && (
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 1.4 }}>{ver.change_notes}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Annotation Modal */}
      {showAnnotationModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAnnotationModal(false)}>
          <div className="modal-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Add Annotation</h2>
              <button onClick={() => setShowAnnotationModal(false)} style={{
                width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateAnnotation} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><ML>X Coordinate</ML>
                  <input type="number" step="0.1" value={annotationData.x_coordinate}
                    onChange={(e) => setAnnotationData({ ...annotationData, x_coordinate: parseFloat(e.target.value) })}
                    className="input-field" /></div>
                <div><ML>Y Coordinate</ML>
                  <input type="number" step="0.1" value={annotationData.y_coordinate}
                    onChange={(e) => setAnnotationData({ ...annotationData, y_coordinate: parseFloat(e.target.value) })}
                    className="input-field" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12 }}>
                <div><ML>Type</ML>
                  <select value={annotationData.annotation_type}
                    onChange={(e) => setAnnotationData({ ...annotationData, annotation_type: e.target.value })}
                    className="input-field">
                    <option value="comment">Comment</option>
                    <option value="highlight">Highlight</option>
                    <option value="shape">Shape</option>
                  </select></div>
                <div><ML>Color</ML>
                  <input type="color" value={annotationData.color}
                    onChange={(e) => setAnnotationData({ ...annotationData, color: e.target.value })}
                    style={{ width: '100%', height: 46, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.07)', cursor: 'pointer', padding: 4 }} /></div>
              </div>
              <div><ML>Comment</ML>
                <textarea value={annotationData.content}
                  onChange={(e) => setAnnotationData({ ...annotationData, content: e.target.value })}
                  className="input-field" rows="4" placeholder="Describe your annotation..." required /></div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button type="submit" className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', borderRadius: 14, padding: '13px' }}>Create</button>
                <button type="button" onClick={() => setShowAnnotationModal(false)} className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', borderRadius: 14, padding: '13px' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AssetViewer Modal */}
      {showAssetViewer && asset && currentVersion && (
        <AssetViewer
          asset={asset}
          version={currentVersion}
          onClose={() => setShowAssetViewer(false)}
        />
      )}
    </div>
  )
}

export default AssetDetail
