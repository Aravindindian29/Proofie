import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Lock, Unlock, UserPlus } from 'lucide-react'
import StatusBadge from './StatusBadge'
import SOCDIcon from './SOCDIcon'
import GroupMemberList from './GroupMemberList'
import SkipGroupButton from './SkipGroupButton'
import EditReviewersModal from './EditReviewersModal'

const WorkflowStageCard = ({ 
  group, 
  isExpanded, 
  onToggle, 
  currentUser,
  reviewCycleId,
  onSkipSuccess 
}) => {
  const [showEditModal, setShowEditModal] = useState(false)
  const isLocked = group.status === 'locked'
  const canSkip = currentUser?.profile?.role === 'manager' || currentUser?.profile?.role === 'admin'
  const canEdit = currentUser?.profile?.role === 'manager' || currentUser?.profile?.role === 'admin'

  return (
    <div
      className={`
        border rounded-lg overflow-hidden
        ${isLocked ? 'border-gray-700 bg-gray-800/50' : 'border-gray-600 bg-gray-800'}
        ${isExpanded ? 'ring-2 ring-blue-500/50' : ''}
      `}
    >
      {/* Stage Header */}
      <div
        onClick={onToggle}
        className="p-4 cursor-pointer hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Lock/Unlock Icon */}
            <div className="text-gray-400">
              {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
            </div>

            {/* Stage Name and Status */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-semibold ${isLocked ? 'text-gray-400' : 'text-gray-200'}`}>
                  {group.name}
                </h4>
                <StatusBadge status={group.status} size="sm" />
              </div>
              <div className="text-xs text-gray-400">
                {group.members?.length || 0} member{group.members?.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* SOCD Status */}
            <div className="flex items-center gap-1">
              <SOCDIcon status={group.socd_status} size="sm" />
            </div>

            {/* Expand/Collapse Icon */}
            <div className="text-gray-400">
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </div>
        </div>
      </div>

      {/* Stage Body (Expanded) */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-700">
          <div className="pt-4">
            <GroupMemberList members={group.members} />
            
            {/* Manager Controls */}
            <div className="flex gap-2 mt-3">
              {/* Edit Reviewers Button (Manager/Admin only) */}
              {canEdit && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="
                    flex-1 px-4 py-2
                    bg-blue-600 hover:bg-blue-700
                    text-white font-medium text-sm
                    rounded-lg
                    flex items-center justify-center gap-2
                    transition-colors
                  "
                >
                  <UserPlus size={16} />
                  Edit Reviewers
                </button>
              )}
              
              {/* Skip Group Button (Manager/Admin only) */}
              {canSkip && group.status !== 'completed' && !isLocked && (
                <SkipGroupButton
                  groupId={group.id}
                  groupName={group.name}
                  reviewCycleId={reviewCycleId}
                  onSkipSuccess={onSkipSuccess}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Reviewers Modal */}
      <EditReviewersModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        reviewCycleId={reviewCycleId}
        group={group}
        onSuccess={() => {
          setShowEditModal(false)
          if (onSkipSuccess) onSkipSuccess() // Refresh workflow data
        }}
      />
    </div>
  )
}

export default WorkflowStageCard
