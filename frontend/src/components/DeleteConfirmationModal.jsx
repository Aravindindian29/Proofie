import React from 'react'
import { Trash2, X } from 'lucide-react'

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title = 'Untitled Proof', deleting = false, message, confirmText, icon: Icon }) {
  if (!isOpen) return null

  return (
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
      onClick={onClose}
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
        {/* Close X Button */}
        <button
          onClick={onClose}
          disabled={deleting}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: 'rgba(255, 255, 255, 0.5)',
            cursor: deleting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>

        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: Icon ? 'rgba(255, 214, 10, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          {Icon ? <Icon size={28} color="#FFD60A" /> : <Trash2 size={28} color="#EF4444" />}
        </div>
        <h3
          style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '12px',
          }}
        >
          {confirmText || 'Delete Proof'}
        </h3>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '28px',
            lineHeight: 1.5,
          }}
        >
          {message || 'Are you sure you want to delete?'}
          <br />
          <span style={{ color: '#fff', fontWeight: 600 }}>
            {title}
          </span>
        </p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            No
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              padding: '12px 24px',
              background: '#EF4444',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: deleting ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!deleting) e.target.style.background = '#DC2626'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#EF4444'
            }}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal
