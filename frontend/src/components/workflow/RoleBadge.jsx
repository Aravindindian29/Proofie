import React from 'react'

const RoleBadge = ({ role, size = 'sm' }) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs'
  }

  const getRoleConfig = () => {
    switch (role) {
      case 'admin':
        return {
          bg: 'bg-purple-600',
          text: 'text-white',
          label: 'ADMIN'
        }
      case 'manager':
        return {
          bg: 'bg-blue-600',
          text: 'text-white',
          label: 'MANAGER'
        }
      case 'approver':
        return {
          bg: 'bg-green-600',
          text: 'text-white',
          label: 'APPROVER'
        }
      case 'lite_user':
        return {
          bg: 'bg-gray-600',
          text: 'text-gray-200',
          label: 'VIEWER'
        }
      default:
        return {
          bg: 'bg-gray-600',
          text: 'text-gray-200',
          label: role?.toUpperCase() || 'USER'
        }
    }
  }

  const config = getRoleConfig()

  return (
    <span
      className={`
        ${sizeClasses[size]}
        ${config.bg}
        ${config.text}
        rounded
        font-bold
        inline-block
        uppercase
      `}
    >
      {config.label}
    </span>
  )
}

export default RoleBadge
