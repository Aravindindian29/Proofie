import React from 'react'
import { Hourglass } from 'lucide-react'

const StatusBadge = ({ status, size = 'default' }) => {
  const statusConfig = {
    not_started: {
      color: '#9CA3AF',
      background: 'rgba(156,163,175,0.15)',
      border: '2px solid rgba(156,163,175,0.4)',
      icon: '💤',
      label: 'Not Started'
    },
    in_progress: {
      color: '#FFD60A',
      background: 'rgba(255,214,10,0.15)',
      border: '2px solid rgba(255,214,10,0.4)',
      icon: 'hourglass',
      label: 'In Progress'
    },
    approved: {
      color: '#10B981',
      background: 'rgba(16,185,129,0.15)',
      border: '2px solid rgba(16,185,129,0.4)',
      icon: '✅',
      label: 'Approved'
    },
    approved_with_changes: {
      color: '#3B82F6',
      background: 'rgba(59,130,246,0.15)',
      border: '2px solid rgba(59,130,246,0.4)',
      icon: '✓',
      label: 'Approved with Changes'
    },
    rejected: {
      color: '#EF4444',
      background: 'rgba(239,68,68,0.15)',
      border: '2px solid rgba(239,68,68,0.4)',
      icon: '❌',
      label: 'Rejected'
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
      {config.icon === 'hourglass' ? (
        <Hourglass size={sizeStyle.iconSize} strokeWidth={2.5} />
      ) : (
        <span style={{ fontSize: sizeStyle.iconSize }}>{config.icon}</span>
      )}
      {config.label}
    </span>
  )
}

export default StatusBadge
