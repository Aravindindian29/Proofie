import React from 'react'
import StatusBadge from './StatusBadge'
import SOCDIcon from './SOCDIcon'

const WorkflowOverview = ({ reviewCycle, groups }) => {
  // Calculate overall SOCD progress
  const calculateOverallSOCD = () => {
    if (!groups || groups.length === 0) {
      return { sent: 0, open: 0, commented: 0, decision_made: 0, total: 0 }
    }

    const allMembers = groups.flatMap(g => g.members || [])
    const total = allMembers.length

    return {
      sent: allMembers.filter(m => m.socd_status === 'sent').length,
      open: allMembers.filter(m => m.socd_status === 'open').length,
      commented: allMembers.filter(m => m.socd_status === 'commented').length,
      decision_made: allMembers.filter(m => m.socd_status === 'decision_made').length,
      total
    }
  }

  const socdStats = calculateOverallSOCD()
  const completedGroups = groups?.filter(g => g.status === 'completed').length || 0
  const totalGroups = groups?.length || 0

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold text-gray-200 mb-3">Overview</h3>
      
      {/* Overall Status */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-1">Status</div>
        <StatusBadge status={reviewCycle?.status} size="md" />
      </div>

      {/* Group Progress */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-1">Groups Progress</div>
        <div className="text-gray-200 font-medium">
          {completedGroups} of {totalGroups} completed
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalGroups > 0 ? (completedGroups / totalGroups) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Overall SOCD Status */}
      <div>
        <div className="text-sm text-gray-400 mb-2">Overall SOCD Progress</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <SOCDIcon status="sent" size="sm" />
            <span className="text-xs text-gray-400">{socdStats.sent}</span>
          </div>
          <div className="flex items-center gap-1">
            <SOCDIcon status="open" size="sm" />
            <span className="text-xs text-gray-400">{socdStats.open}</span>
          </div>
          <div className="flex items-center gap-1">
            <SOCDIcon status="commented" size="sm" />
            <span className="text-xs text-gray-400">{socdStats.commented}</span>
          </div>
          <div className="flex items-center gap-1">
            <SOCDIcon status="decision_made" size="sm" />
            <span className="text-xs text-gray-400">{socdStats.decision_made}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Total: {socdStats.total} member{socdStats.total !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

export default WorkflowOverview
