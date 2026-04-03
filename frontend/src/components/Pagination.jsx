import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Reusable Pagination Component
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current active page
 * @param {number} props.totalPages - Total number of pages
 * @param {function} props.onPageChange - Callback function when page changes
 * @param {boolean} props.showPageNumbers - Whether to show page number buttons (default: true)
 */
function Pagination({ currentPage, totalPages, onPageChange, showPageNumbers = true }) {
  if (totalPages <= 1) return null

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : '#fff',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
      >
        <ChevronLeft size={20} />
      </button>
      
      {showPageNumbers && (
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: currentPage === page ? '#FF375F' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {page}
            </button>
          ))}
        </div>
      )}
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : '#fff',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

export default Pagination
