import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, MessageSquare, Plus, Check, Reply, Palette, Move, MousePointer } from 'lucide-react'
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

function AssetViewer({ asset, version, onClose }) {
  const [annotations, setAnnotations] = useState([])
  const [selectedAnnotation, setSelectedAnnotation] = useState(null)
  const [showCommentPanel, setShowCommentPanel] = useState(false)
  const [isAnnotating, setIsAnnotating] = useState(false)
  const [annotationMode, setAnnotationMode] = useState('comment')
  const [annotationColor, setAnnotationColor] = useState('#FF0000')
  const [newComment, setNewComment] = useState('')
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const viewerRef = useRef(null)
  const imageRef = useRef(null)

  useEffect(() => {
    if (version) {
      fetchAnnotations()
    }
  }, [version])

  const fetchAnnotations = async () => {
    try {
      const response = await api.get(`/annotations/?version_id=${version.id}`)
      setAnnotations(response.data.results || response.data)
    } catch (error) {
      toast.error('Failed to load annotations')
    } finally {
      setLoading(false)
    }
  }

  const handleViewerClick = useCallback((e) => {
    if (!isAnnotating || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    createAnnotation(x, y)
  }, [isAnnotating])

  const createAnnotation = async (x, y) => {
    try {
      const response = await api.post('/annotations/', {
        version: version.id,
        x_coordinate: x,
        y_coordinate: y,
        content: newComment || 'New annotation',
        annotation_type: annotationMode,
        color: annotationColor,
      })

      setAnnotations([response.data, ...annotations])
      setNewComment('')
      setIsAnnotating(false)
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

  const handleAddReply = async (annotationId) => {
    if (!replyText.trim()) return

    try {
      const response = await api.post(`/annotations/${annotationId}/add_reply/`, {
        content: replyText
      })

      setAnnotations(annotations.map(a => 
        a.id === annotationId 
          ? { ...a, replies: [...(a.replies || []), response.data] }
          : a
      ))
      setReplyText('')
      toast.success('Reply added!')
    } catch (error) {
      toast.error('Failed to add reply')
    }
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prevScale => Math.min(Math.max(prevScale * delta, 0.1), 5))
  }

  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
      e.preventDefault()
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const getAnnotationPosition = (annotation) => {
    if (!imageRef.current) return { x: 0, y: 0 }
    const rect = imageRef.current.getBoundingClientRect()
    return {
      x: (annotation.x_coordinate / 100) * rect.width,
      y: (annotation.y_coordinate / 100) * rect.height
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 backdrop-blur-sm p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-white text-xl font-bold">{asset?.name}</h2>
            <span className="text-gray-300 text-sm">Version {version?.version_number}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Annotation Tools */}
            <div className="flex items-center gap-2 mr-4">
              {!isAnnotating ? (
                <button
                  onClick={() => setIsAnnotating(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} />
                  <span>Annotate</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={annotationMode}
                    onChange={(e) => setAnnotationMode(e.target.value)}
                    className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600"
                  >
                    <option value="comment">Comment</option>
                    <option value="highlight">Highlight</option>
                    <option value="shape">Shape</option>
                  </select>
                  
                  <input
                    type="color"
                    value={annotationColor}
                    onChange={(e) => setAnnotationColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  
                  <input
                    type="text"
                    placeholder="Comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 text-sm"
                  />
                  
                  <button
                    onClick={() => setIsAnnotating(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2 mr-4">
              <button
                onClick={() => setScale(1)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm"
              >
                Reset
              </button>
              <span className="text-white text-sm">{Math.round(scale * 100)}%</span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative" style={{ marginTop: '80px' }}>
        {/* Asset Viewer */}
        <div 
          ref={viewerRef}
          className="flex-1 relative overflow-hidden cursor-crosshair"
          onClick={handleViewerClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center',
              transition: isDragging ? 'none' : 'transform 0.2s'
            }}
          >
            {asset?.file_type === 'image' && version?.file_url && (
              <img
                ref={imageRef}
                src={getMediaUrl(version.file_url)}
                alt={asset.name}
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            )}
            
            {asset?.file_type === 'pdf' && version?.file_url && (
              <iframe
                ref={imageRef}
                src={getMediaUrl(version.file_url)}
                className="w-full h-full"
                style={{ width: '800px', height: '600px' }}
                title={asset.name}
              />
            )}
            
            {asset?.file_type === 'video' && version?.file_url && (
              <video
                ref={imageRef}
                controls
                className="max-w-full max-h-full"
              >
                <source src={getMediaUrl(version.file_url)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          {/* Annotation Overlays */}
          {annotations.map((annotation) => {
            const pos = getAnnotationPosition(annotation)
            return (
              <div
                key={annotation.id}
                className="absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 transition-transform"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  backgroundColor: annotation.color,
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedAnnotation(annotation)
                  setShowCommentPanel(true)
                }}
              >
                {annotation.is_resolved && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check size={12} color="white" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Comments Panel */}
        {showCommentPanel && (
          <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Annotations</h3>
                <button
                  onClick={() => setShowCommentPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {annotations.length > 0 ? (
                <div className="space-y-4">
                  {annotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAnnotation?.id === annotation.id
                          ? 'bg-gray-800 border-blue-500'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedAnnotation(annotation)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: annotation.color }}
                          />
                          <span className="text-white font-medium text-sm">
                            {annotation.author?.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {annotation.is_resolved && (
                            <span className="text-green-400 text-xs">Resolved</span>
                          )}
                          {!annotation.is_resolved && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleResolveAnnotation(annotation.id)
                              }}
                              className="text-green-400 hover:text-green-300"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-2">{annotation.content}</p>
                      
                      <div className="text-xs text-gray-500">
                        ({Math.round(annotation.x_coordinate)}%, {Math.round(annotation.y_coordinate)}%)
                      </div>

                      {/* Replies */}
                      {annotation.replies && annotation.replies.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {annotation.replies.map((reply) => (
                            <div key={reply.id} className="pl-3 border-l border-gray-600">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-400 text-xs">
                                  {reply.author?.username}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {new Date(reply.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-gray-300 text-xs">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input */}
                      {selectedAnnotation?.id === annotation.id && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddReply(annotation.id)}
                            className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm"
                          />
                          <button
                            onClick={() => handleAddReply(annotation.id)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Reply size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-8">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No annotations yet</p>
                  <p className="text-sm mt-2">Click on the asset to add annotations</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {isAnnotating && (
        <div className="absolute bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
          Click on the asset to place an annotation
        </div>
      )}

      {/* Instructions for navigation */}
      {!isAnnotating && (
        <div className="absolute bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
          Scroll to zoom • Shift+drag or middle mouse to pan • Click annotations to view comments
        </div>
      )}
    </div>
  )
}

export default AssetViewer
