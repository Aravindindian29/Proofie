import React, { useState, useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'
import axios from 'axios'
import WorkflowOverview from './WorkflowOverview'
import WorkflowStageCard from './WorkflowStageCard'

const WorkflowPanel = ({ reviewCycleId, isOpen, onClose, currentUser }) => {
  const [reviewCycle, setReviewCycle] = useState(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchWorkflowData = async () => {
    if (!reviewCycleId) return

    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `http://localhost:8000/api/workflows/review-cycles/${reviewCycleId}/group_status/`,
        {
          headers: { Authorization: `Token ${token}` }
        }
      )

      setReviewCycle({ status: response.data.status })
      setGroups(response.data.groups.map(g => g.group))
      
      // Auto-expand first unlocked or in-progress group
      const activeGroup = response.data.groups.find(
        g => g.group.status === 'in_progress' || g.group.status === 'unlocked'
      )
      if (activeGroup && !expandedGroups.includes(activeGroup.group.id)) {
        setExpandedGroups([activeGroup.group.id])
      }
    } catch (error) {
      console.error('Failed to fetch workflow data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (isOpen && reviewCycleId) {
      fetchWorkflowData()
      
      // Poll for updates every 10 seconds
      const interval = setInterval(fetchWorkflowData, 10000)
      return () => clearInterval(interval)
    }
  }, [isOpen, reviewCycleId])

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchWorkflowData()
  }

  const handleSkipSuccess = () => {
    fetchWorkflowData()
  }

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-100">Workflow</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw 
              size={18} 
              className={`text-gray-400 ${refreshing ? 'animate-spin' : ''}`} 
            />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Hide Workflow"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading workflow...</div>
          </div>
        ) : (
          <>
            {/* Overview Section */}
            <WorkflowOverview reviewCycle={reviewCycle} groups={groups} />

            {/* Stages List */}
            <div className="space-y-3">
              {groups.map((group) => (
                <WorkflowStageCard
                  key={group.id}
                  group={group}
                  isExpanded={expandedGroups.includes(group.id)}
                  onToggle={() => toggleGroup(group.id)}
                  currentUser={currentUser}
                  reviewCycleId={reviewCycleId}
                  onSkipSuccess={handleSkipSuccess}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default WorkflowPanel
