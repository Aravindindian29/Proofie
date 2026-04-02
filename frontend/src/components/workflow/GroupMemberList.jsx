import React from 'react'
import MemberAvatar from './MemberAvatar'
import RoleBadge from './RoleBadge'
import SOCDIcon from './SOCDIcon'
import StatusBadge from './StatusBadge'

const GroupMemberList = ({ members }) => {
  if (!members || members.length === 0) {
    return (
      <div className="text-gray-400 text-sm py-4 text-center">
        No members assigned
      </div>
    )
  }

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case 'approved':
        return <StatusBadge status="approved" size="sm" />
      case 'rejected':
        return <StatusBadge status="rejected" size="sm" />
      case 'changes_requested':
        return <StatusBadge status="approved_with_changes" size="sm" />
      case 'pending':
        return <StatusBadge status="pending" size="sm" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
        >
          {/* Avatar and Name */}
          <MemberAvatar user={member.user} size="sm" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-gray-200 text-sm font-medium truncate">
                {member.user?.username || member.user?.email || 'Unknown'}
              </span>
              {member.user?.profile?.role && (
                <RoleBadge role={member.user.profile.role} size="xs" />
              )}
            </div>
          </div>

          {/* SOCD Status Icons */}
          <div className="flex items-center gap-1">
            <SOCDIcon 
              status="sent" 
              size="sm" 
              active={member.socd_status !== 'sent'}
            />
            <SOCDIcon 
              status="open" 
              size="sm" 
              active={['open', 'commented', 'decision_made'].includes(member.socd_status)}
            />
            <SOCDIcon 
              status="commented" 
              size="sm" 
              active={['commented', 'decision_made'].includes(member.socd_status)}
            />
            <SOCDIcon 
              status="decision_made" 
              size="sm" 
              active={member.socd_status === 'decision_made'}
            />
          </div>

          {/* Decision Badge */}
          <div className="ml-2">
            {getDecisionBadge(member.decision)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default GroupMemberList
