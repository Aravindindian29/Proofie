import React from 'react'

const StatusBadge = ({ status, size = 'default' }) => {
  const statusConfig = {
    not_started: {
      color: '#FFFFFF',
      background: 'transparent',
      border: '2px solid #D1D5DB',
      icon: <span style={{ fontSize: '12.5px' }}>😴</span>,
      label: <span style={{ fontSize: '12px', marginLeft: '-2px' }}><b>Not Started</b></span>
    },
    in_progress: {
      color: '#EAB308',
      background: 'transparent',
      border: '2px solid rgba(255, 214, 10)',
      icon: <span style={{ fontSize: '12.5px' }}>⌛</span>,
      label: <span style={{ fontSize: '12px', marginLeft: '-2px' }}><b>In Progress</b></span>
    },
    approved: {
      color: '#10B981',
      background: 'transparent',
      border: '2px solid rgba(9, 237, 161, 0.86)',
      icon: <span style={{ fontSize: '12.5px' }}>✅</span>,
      label: <span style={{ fontSize: '12px', marginLeft: '-2px' }}><b>Approved</b></span>
    },
    approved_with_changes: {
      color: '#EAB308',
      background: 'transparent',
      border: '2px solid rgba(255, 214, 10)',
      icon: <span style={{ fontSize: '12.5px' }}>⚠️</span>,
      label: <span style={{ fontSize: '12px', marginLeft: '-2px' }}><b>Approved with Changes</b></span>
    },
    rejected: {
      color: '#EF4444',
      background: 'transparent',
      border: '2px solid rgba(242, 8, 8, 0.87)',
      icon: <span style={{ fontSize: '12px' }}>❌</span>,
      label: <span style={{ fontSize: '12px', marginLeft: '-1px' }}><b>Rejected</b></span>
    }
  }

  const config = statusConfig[status] || statusConfig.not_started
  
  const sizeStyles = {
    small: {
      padding: '3px 8px',
      fontSize: '0.7rem',
      iconSize: 10,
      gap: '4px'
    },
    default: {
      padding: '4px 10px',
      fontSize: '0.75rem',
      iconSize: 12,
      gap: '6px'
    },
    large: {
      padding: '6px 12px',
      fontSize: '0.85rem',
      iconSize: 14,
      gap: '8px'
    }
  }

  const sizeStyle = sizeStyles[size] || sizeStyles.default

  return (
    <span style={{
      padding: sizeStyle.padding,
      borderRadius: '4px',
      fontSize: sizeStyle.fontSize,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: sizeStyle.gap,
      background: config.background,
      color: config.color,
      border: config.border
    }}>
      <span style={{ 
        fontSize: (config.icon === '\u231B' || config.icon === '\ud83d\ude34' || config.icon === ' ') ? sizeStyle.iconSize + 4 : sizeStyle.iconSize,
        display: 'flex',
        alignItems: 'center'
      }}>{config.icon}</span>
      {config.label}
    </span>
  )
}

export default StatusBadge
