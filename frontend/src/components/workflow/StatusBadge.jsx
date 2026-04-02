import React from 'react'

const StatusBadge = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'not_started':
        return {
          bg: 'bg-gray-600',
          text: 'text-gray-200',
          label: 'Not Started',
          pulse: false
        }
      case 'in_progress':
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-900',
          label: 'In Progress',
          pulse: true
        }
      case 'approved':
        return {
          bg: 'bg-green-500',
          text: 'text-white',
          label: 'Approved',
          pulse: false
        }
      case 'approved_with_changes':
        return {
          bg: 'bg-orange-500',
          text: 'text-white',
          label: 'Approved with Changes',
          pulse: false
        }
      case 'rejected':
        return {
          bg: 'bg-red-500',
          text: 'text-white',
          label: 'Rejected',
          pulse: false
        }
      case 'locked':
        return {
          bg: 'bg-gray-700',
          text: 'text-gray-300',
          label: 'Locked',
          pulse: false
        }
      case 'unlocked':
        return {
          bg: 'bg-blue-600',
          text: 'text-white',
          label: 'Unlocked',
          pulse: false
        }
      case 'completed':
        return {
          bg: 'bg-green-600',
          text: 'text-white',
          label: 'Completed',
          pulse: false
        }
      case 'pending':
        return {
          bg: 'bg-gray-500',
          text: 'text-white',
          label: 'Pending',
          pulse: false
        }
      default:
        return {
          bg: 'bg-gray-600',
          text: 'text-gray-200',
          label: status || 'Unknown',
          pulse: false
        }
    }
  }

  const config = getStatusConfig()

  return (
    <span
      className={`
        ${sizeClasses[size]}
        ${config.bg}
        ${config.text}
        rounded-full
        font-medium
        inline-flex items-center
        ${config.pulse ? 'animate-pulse' : ''}
      `}
    >
      {config.label}
    </span>
  )
}

export default StatusBadge
