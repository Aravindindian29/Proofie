import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Reply, Check, X, Send, Trash2 } from 'lucide-react'
import api from '../services/api'

const CommentSidebar = ({ versionId, currentPage, onCommentClick, activeCommentId }) => {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const commentRefs = useRef({})

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (versionId) {
      fetchComments()
    }
  }, [versionId])

  useEffect(() => {
    if (activeCommentId && commentRefs.current[activeCommentId]) {
      commentRefs.current[activeCommentId].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
    }
  }, [activeCommentId])

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/accounts/users/me/')
      setCurrentUser(response.data)
      console.log('Current user:', response.data)
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      console.error('Error details:', error.response?.data)
    }
  }

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/annotations/?version=${versionId}`)
      setComments(response.data.results || response.data || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (annotationId) => {
    if (!replyText.trim()) return

    try {
      await api.post(`/annotations/${annotationId}/reply/`, {
        content: replyText
      })
      setReplyText('')
      setReplyingTo(null)
      fetchComments()
    } catch (error) {
      console.error('Failed to add reply:', error)
    }
  }

  const handleResolve = async (annotationId, currentStatus) => {
    try {
      if (currentStatus) {
        await api.post(`/annotations/${annotationId}/unresolve/`)
      } else {
        await api.post(`/annotations/${annotationId}/resolve/`)
      }
      fetchComments()
    } catch (error) {
      console.error('Failed to resolve comment:', error)
    }
  }

  const handleDelete = async (annotationId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      await api.delete(`/annotations/${annotationId}/`)
      fetchComments()
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Failed to delete comment. Please try again.')
    }
  }

  const groupedComments = comments.reduce((acc, comment) => {
    const page = comment.page_number || 1
    if (!acc[page]) acc[page] = []
    acc[page].push(comment)
    return acc
  }, {})

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div style={{
        width: '350px',
        height: '100%',
        background: '#1C1C1E',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.6)'
      }}>
        Loading comments...
      </div>
    )
  }

  return (
    <div style={{
      width: '350px',
      height: '100%',
      background: '#1C1C1E',
      borderLeft: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={20} color="#fff" />
          <span style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
            Comments ({comments.length})
          </span>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {Object.keys(groupedComments).length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '14px', margin: 0 }}>No comments yet</p>
            <p style={{ fontSize: '12px', margin: '8px 0 0', opacity: 0.7 }}>
              Click on the PDF to add a comment
            </p>
          </div>
        ) : (
          Object.keys(groupedComments).sort((a, b) => Number(a) - Number(b)).map(page => (
            <div key={page} style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📄 Page {page}
                {currentPage === Number(page) && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: '#0A84FF',
                    borderRadius: '4px',
                    color: '#fff'
                  }}>
                    Current
                  </span>
                )}
              </div>

              {groupedComments[page].map(comment => (
                <div
                  key={comment.id}
                  ref={el => commentRefs.current[comment.id] = el}
                  style={{
                    background: activeCommentId === comment.id 
                      ? 'rgba(10,132,255,0.15)' 
                      : 'rgba(255,255,255,0.05)',
                    border: activeCommentId === comment.id
                      ? '1px solid rgba(10,132,255,0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => onCommentClick && onCommentClick(comment)}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      {comment.author?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 600
                        }}>
                          {comment.author?.username || 'Unknown'}
                        </span>
                        <span style={{
                          color: 'rgba(255,255,255,0.5)',
                          fontSize: '12px'
                        }}>
                          {formatTimestamp(comment.created_at)}
                        </span>
                        {comment.is_resolved && (
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            background: 'rgba(48,209,88,0.2)',
                            color: '#30D158',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}>
                            Resolved
                          </span>
                        )}
                      </div>
                      <p style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '14px',
                        margin: 0,
                        lineHeight: '1.5',
                        wordBreak: 'break-word'
                      }}>
                        {comment.content}
                      </p>
                    </div>
                  </div>

                  {comment.replies && comment.replies.length > 0 && (
                    <div style={{
                      marginTop: '12px',
                      paddingLeft: '40px',
                      borderLeft: '2px solid rgba(255,255,255,0.1)'
                    }}>
                      {comment.replies.map((reply, idx) => (
                        <div key={idx} style={{ marginBottom: '8px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '4px'
                          }}>
                            <span style={{
                              color: '#fff',
                              fontSize: '13px',
                              fontWeight: 600
                            }}>
                              {reply.author?.username || 'Unknown'}
                            </span>
                            <span style={{
                              color: 'rgba(255,255,255,0.5)',
                              fontSize: '11px'
                            }}>
                              {formatTimestamp(reply.created_at)}
                            </span>
                          </div>
                          <p style={{
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '13px',
                            margin: 0,
                            lineHeight: '1.4'
                          }}>
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setReplyingTo(replyingTo === comment.id ? null : comment.id)
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Reply size={14} />
                      Reply
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleResolve(comment.id, comment.is_resolved)
                      }}
                      style={{
                        padding: '6px 12px',
                        background: comment.is_resolved 
                          ? 'rgba(255,255,255,0.1)' 
                          : 'rgba(48,209,88,0.2)',
                        border: 'none',
                        borderRadius: '6px',
                        color: comment.is_resolved ? '#fff' : '#30D158',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {comment.is_resolved ? <X size={14} /> : <Check size={14} />}
                      {comment.is_resolved ? 'Unresolve' : 'Resolve'}
                    </button>
                    {currentUser && comment.author?.id === currentUser.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(comment.id)
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(255,59,48,0.2)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#FF3B30',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>

                  {replyingTo === comment.id && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        style={{
                          width: '100%',
                          minHeight: '60px',
                          padding: '8px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '13px',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '8px'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleReply(comment.id)
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#0A84FF',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Send size={14} />
                          Send
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setReplyingTo(null)
                            setReplyText('')
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CommentSidebar
