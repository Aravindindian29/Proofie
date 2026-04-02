import React, { useState, useEffect } from 'react'
import { X, UserPlus, Trash2, Search } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const EditReviewersModal = ({ isOpen, onClose, group, reviewCycleId, onSuccess }) => {
  const [availableUsers, setAvailableUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers()
    }
  }, [isOpen])

  const fetchAvailableUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/workflows/review-cycles/${reviewCycleId}/available-reviewers/`)
      setAvailableUsers(response.data.users || [])
    } catch (error) {
      console.error('Failed to fetch available users:', error)
      toast.error('Failed to load available reviewers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (userId) => {
    try {
      await api.post(`/workflows/review-cycles/${reviewCycleId}/add-reviewer/`, {
        group_id: group.id,
        user_id: userId
      })
      toast.success('Reviewer added successfully')
      if (onSuccess) onSuccess()
      fetchAvailableUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add reviewer')
    }
  }

  const handleRemoveMember = async (memberId) => {
    try {
      await api.post(`/workflows/review-cycles/${reviewCycleId}/remove-reviewer/`, {
        group_id: group.id,
        member_id: memberId
      })
      toast.success('Reviewer removed successfully')
      if (onSuccess) onSuccess()
      fetchAvailableUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove reviewer')
    }
  }

  const filteredUsers = availableUsers.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentMemberIds = group.members?.map(m => m.user?.id) || []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Reviewers - {group.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Current Members */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Current Reviewers</h3>
          <div className="space-y-2">
            {group.members && group.members.length > 0 ? (
              group.members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {member.user?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-white font-medium">{member.user?.username}</div>
                      <div className="text-gray-400 text-sm">{member.user?.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-400 hover:text-red-300 transition-colors p-2"
                    title="Remove reviewer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-4">No reviewers assigned</div>
            )}
          </div>
        </div>

        {/* Add New Members */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Add Reviewers</h3>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Available Users */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="text-gray-400 text-center py-4">Loading...</div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => {
                const isAlreadyMember = currentMemberIds.includes(user.id)
                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between bg-gray-700 rounded-lg p-3 ${
                      isAlreadyMember ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold text-sm">
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.username}</div>
                        <div className="text-gray-400 text-sm">{user.email}</div>
                      </div>
                    </div>
                    {isAlreadyMember ? (
                      <span className="text-gray-500 text-sm">Already added</span>
                    ) : (
                      <button
                        onClick={() => handleAddMember(user.id)}
                        className="text-blue-400 hover:text-blue-300 transition-colors p-2"
                        title="Add reviewer"
                      >
                        <UserPlus size={18} />
                      </button>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-gray-400 text-center py-4">
                {searchTerm ? 'No users found' : 'No available users'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditReviewersModal
