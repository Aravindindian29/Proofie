import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, RefreshCw } from 'lucide-react'
import axios from 'axios'
import SOCDIcon from '../components/workflow/SOCDIcon'
import StatusBadge from '../components/workflow/StatusBadge'
import MemberAvatar from '../components/workflow/MemberAvatar'

const WorkflowDashboard = () => {
  const navigate = useNavigate()
  const [proofs, setProofs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchProofs()
  }, [])

  const fetchProofs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        'http://localhost:8000/api/workflows/review-cycles/',
        {
          headers: { Authorization: `Token ${token}` }
        }
      )
      setProofs(response.data)
    } catch (error) {
      console.error('Failed to fetch proofs:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSOCDProgress = (groups) => {
    if (!groups || groups.length === 0) return { sent: 0, open: 0, commented: 0, decision_made: 0 }
    
    const allMembers = groups.flatMap(g => g.members || [])
    return {
      sent: allMembers.filter(m => m.socd_status === 'sent').length,
      open: allMembers.filter(m => m.socd_status === 'open').length,
      commented: allMembers.filter(m => m.socd_status === 'commented').length,
      decision_made: allMembers.filter(m => m.socd_status === 'decision_made').length,
      total: allMembers.length
    }
  }

  const calculateDecisions = (groups) => {
    if (!groups || groups.length === 0) return { completed: 0, total: 0 }
    
    const allMembers = groups.flatMap(g => g.members || [])
    const completed = allMembers.filter(m => m.decision !== 'pending').length
    return { completed, total: allMembers.length }
  }

  const filteredProofs = proofs.filter(proof => {
    const matchesSearch = proof.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || proof.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workflow Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage and track all proof approvals
            </p>
          </div>
          <button
            onClick={fetchProofs}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search proofs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="approved">Approved</option>
              <option value="approved_with_changes">Approved with Changes</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Loading proofs...
          </div>
        ) : filteredProofs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No proofs found
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-750 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Decisions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Owner
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredProofs.map((proof) => {
                  const socdProgress = calculateSOCDProgress(proof.groups)
                  const decisions = calculateDecisions(proof.groups)

                  return (
                    <tr
                      key={proof.id}
                      onClick={() => navigate(`/file/${proof.asset?.id}`)}
                      className="hover:bg-gray-750 cursor-pointer transition-colors"
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center text-xl">
                            📄
                          </div>
                          <div>
                            <div className="font-medium text-gray-200">
                              {proof.asset?.name || 'Untitled'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {proof.asset?.file_type?.toUpperCase() || 'FILE'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Progress (SOCD) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <SOCDIcon status="sent" size="sm" active={socdProgress.sent > 0} />
                          <span className="text-xs text-gray-400">{socdProgress.sent}</span>
                          <SOCDIcon status="open" size="sm" active={socdProgress.open > 0} />
                          <span className="text-xs text-gray-400">{socdProgress.open}</span>
                          <SOCDIcon status="commented" size="sm" active={socdProgress.commented > 0} />
                          <span className="text-xs text-gray-400">{socdProgress.commented}</span>
                          <SOCDIcon status="decision_made" size="sm" active={socdProgress.decision_made > 0} />
                          <span className="text-xs text-gray-400">{socdProgress.decision_made}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={proof.status} size="sm" />
                      </td>

                      {/* Decisions */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">
                          {decisions.completed} of {decisions.total}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400">
                          {formatDate(proof.initiated_at)}
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-6 py-4">
                        <MemberAvatar 
                          user={proof.created_by || proof.initiated_by} 
                          size="sm" 
                          showName 
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkflowDashboard
