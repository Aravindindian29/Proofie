import React from 'react'
import { User } from 'lucide-react'

const MemberAvatar = ({ user, size = 'md', showName = false }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getAvatarColor = (name) => {
    if (!name) return 'bg-gray-600'
    const colors = [
      'bg-blue-600',
      'bg-green-600',
      'bg-purple-600',
      'bg-pink-600',
      'bg-yellow-600',
      'bg-indigo-600',
      'bg-red-600',
      'bg-teal-600'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const displayName = user?.username || user?.email || user?.first_name || 'Unknown'
  const initials = getInitials(displayName)
  const avatarColor = getAvatarColor(displayName)

  return (
    <div className="flex items-center gap-2">
      {user?.profile?.avatar ? (
        <img
          src={user.profile.avatar}
          alt={displayName}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`
            ${sizeClasses[size]}
            ${avatarColor}
            rounded-full
            flex items-center justify-center
            text-white
            font-semibold
          `}
          title={displayName}
        >
          {initials}
        </div>
      )}
      {showName && (
        <span className="text-gray-200 text-sm font-medium">
          {displayName}
        </span>
      )}
    </div>
  )
}

export default MemberAvatar
