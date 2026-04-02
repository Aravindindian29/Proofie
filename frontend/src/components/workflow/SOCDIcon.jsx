import React from 'react'
import { Check } from 'lucide-react'

const SOCDIcon = ({ status, size = 'md', showLabel = false, active = true }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'sent':
        return {
          bg: active ? 'bg-gray-400' : 'bg-gray-600',
          text: 'text-white',
          label: 'S',
          name: 'Sent',
          icon: null
        }
      case 'open':
        return {
          bg: active ? 'bg-green-500' : 'bg-gray-600',
          text: 'text-white',
          label: 'O',
          name: 'Open',
          icon: null
        }
      case 'commented':
        return {
          bg: active ? 'bg-blue-500' : 'bg-gray-600',
          text: 'text-white',
          label: 'C',
          name: 'Commented',
          icon: null
        }
      case 'decision_made':
        return {
          bg: active ? 'bg-green-500' : 'bg-gray-600',
          text: 'text-white',
          label: 'D',
          name: 'Decision Made',
          icon: <Check size={size === 'sm' ? 12 : size === 'md' ? 16 : 20} />
        }
      default:
        return {
          bg: 'bg-gray-600',
          text: 'text-white',
          label: '?',
          name: 'Unknown',
          icon: null
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="flex items-center gap-1">
      <div
        className={`
          ${sizeClasses[size]}
          ${config.bg}
          ${config.text}
          rounded-full
          flex items-center justify-center
          font-semibold
          transition-all duration-200
          ${!active ? 'opacity-50' : ''}
        `}
        title={config.name}
      >
        {config.icon || config.label}
      </div>
      {showLabel && (
        <span className={`text-gray-300 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {config.name}
        </span>
      )}
    </div>
  )
}

export default SOCDIcon
