import React, { useState } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'

const CommentMarker = ({ x, y, annotation, onClick, isActive }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      data-annotation-id={annotation.id}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: isActive ? 1000 : 100,
        pointerEvents: 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(annotation)
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: isActive ? '#FF375F' : '#FF0000',
        border: '2px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        animation: isActive ? 'pulse 1.5s infinite' : 'none',
        transition: 'all 0.2s'
      }}>
        <MessageSquare size={14} color="white" />
      </div>

      {annotation.replies && annotation.replies.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#0A84FF',
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          color: 'white'
        }}>
          {annotation.replies.length}
        </div>
      )}

      {isHovered && (
        <div style={{
          position: 'absolute',
          top: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1C1C1E',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          padding: '8px 12px',
          minWidth: '200px',
          maxWidth: '300px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 1001,
          pointerEvents: 'none'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '4px'
          }}>
            {annotation.author?.username || 'Unknown'}
          </div>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)',
            lineHeight: '1.4'
          }}>
            {annotation.content.substring(0, 100)}
            {annotation.content.length > 100 && '...'}
          </div>
        </div>
      )}
    </div>
  )
}

const PDFAnnotationLayer = ({ 
  annotations, 
  currentPage, 
  onAddAnnotation, 
  onCommentClick,
  activeCommentId,
  isEnabled = false,
  showNavigationLine = false,
  navigationTarget = null
}) => {
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })
  const [commentText, setCommentText] = useState('')
  const [clickCoordinates, setClickCoordinates] = useState({ x: 0, y: 0 })

  const handleLayerClick = (e) => {
    if (!isEnabled) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setClickCoordinates({ x, y })
    setModalPosition({ x: e.clientX, y: e.clientY })
    setShowCommentModal(true)
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return

    await onAddAnnotation({
      x: clickCoordinates.x,
      y: clickCoordinates.y,
      page: currentPage,
      content: commentText
    })

    setCommentText('')
    setShowCommentModal(false)
  }

  const handleCancelComment = () => {
    setCommentText('')
    setShowCommentModal(false)
  }

  // Only show annotations for the current page
  const currentPageAnnotations = annotations.filter(
    a => a.page_number === currentPage
  )

  console.log('Current page:', currentPage)
  console.log('Total annotations:', annotations.length)
  console.log('Current page annotations:', currentPageAnnotations.length)

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        {/* Clickable overlay for adding comments */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: isEnabled ? 'auto' : 'none',
            cursor: isEnabled ? 'crosshair' : 'default',
            zIndex: 1
          }}
          onClick={handleLayerClick}
        />
        
        {/* Comment markers - only for current page */}
        <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
          {currentPageAnnotations.map(annotation => (
            <CommentMarker
              key={annotation.id}
              x={annotation.x_coordinate}
              y={annotation.y_coordinate}
              annotation={annotation}
              onClick={onCommentClick}
              isActive={activeCommentId === annotation.id}
            />
          ))}
          
          {/* Navigation line indicator - draws from right edge to comment coordinates */}
          {showNavigationLine && navigationTarget && (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 2000
              }}
            >
              {/* Line from right edge (sidebar) to comment coordinates */}
              <line
                x1="100%"
                y1={`${navigationTarget.y}%`}
                x2={`${navigationTarget.x}%`}
                y2={`${navigationTarget.y}%`}
                stroke="#FF0000"
                strokeWidth="3"
                strokeDasharray="8,4"
                style={{
                  animation: 'dash 1s linear infinite'
                }}
              />
              
              {/* Arrow head at the comment location */}
              <polygon
                points={`
                  ${navigationTarget.x - 1},${navigationTarget.y - 1.5}
                  ${navigationTarget.x - 1},${navigationTarget.y + 1.5}
                  ${navigationTarget.x + 1},${navigationTarget.y}
                `}
                fill="#FF0000"
                transform={`translate(0, 0)`}
              />
              
              {/* Pulsing dot at comment location */}
              <circle
                cx={`${navigationTarget.x}%`}
                cy={`${navigationTarget.y}%`}
                r="6"
                fill="#FF0000"
                opacity="0.8"
                style={{
                  animation: 'pulse-dot 1s ease-in-out infinite'
                }}
              />
            </svg>
          )}
        </div>
        
        {/* Add keyframe animations */}
        <style>{`
          @keyframes dash {
            to {
              stroke-dashoffset: -12;
            }
          }
          
          @keyframes pulse-dot {
            0%, 100% {
              r: 6;
              opacity: 0.8;
            }
            50% {
              r: 9;
              opacity: 1;
            }
          }
        `}</style>
      </div>

      {showCommentModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 9998
            }}
            onClick={handleCancelComment}
          />

          <div
            style={{
              position: 'fixed',
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
              transform: 'translate(-50%, -50%)',
              background: '#1C1C1E',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '16px',
              minWidth: '320px',
              maxWidth: '400px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              zIndex: 9999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <MessageSquare size={18} color="#0A84FF" />
                <span style={{
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600
                }}>
                  Add Comment to Page {currentPage}
                </span>
              </div>
              <button
                onClick={handleCancelComment}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} color="#fff" />
              </button>
            </div>

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment here..."
              autoFocus
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit',
                marginBottom: '12px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmitComment()
                }
              }}
            />

            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancelComment}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                style={{
                  padding: '8px 16px',
                  background: commentText.trim() ? '#0A84FF' : 'rgba(10,132,255,0.3)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send size={16} />
                Post Comment
              </button>
            </div>

            <div style={{
              marginTop: '12px',
              padding: '8px',
              background: 'rgba(10,132,255,0.1)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.7)'
            }}>
              💡 Tip: Press Cmd/Ctrl + Enter to post quickly
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </>
  )
}

export default PDFAnnotationLayer
