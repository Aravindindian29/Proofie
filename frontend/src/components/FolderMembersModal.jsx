import React, { useState, useEffect } from 'react'
import { X, Users, Trash2, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

function FolderMembersModal({ isOpen, onClose, folder }) {
  const { user } = useAuthStore()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [availableUsers, setAvailableUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [selectedRole, setSelectedRole] = useState('viewer')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const getAvatarColor = (username, index, previousColors) => {
    const colors = [
      'linear-gradient(135deg,#5E5CE6,#FF375F)',
      'linear-gradient(135deg,#30D158,#0A84FF)',
      'linear-gradient(135deg,#FF9F0A,#FF375F)',
      'linear-gradient(135deg,#FF375F,#5E5CE6)',
      'linear-gradient(135deg,#FFD60A,#FF9F0A)',
    ]
    let colorIndex = username.charCodeAt(0) % colors.length
    let selectedColor = colors[colorIndex]
    
    if (index > 0 && previousColors.length > 0 && selectedColor === previousColors[index - 1]) {
      let attempts = 0
      do {
        colorIndex = (colorIndex + 1) % colors.length
        selectedColor = colors[colorIndex]
        attempts++
      } while (previousColors.includes(selectedColor) && attempts < colors.length)
    }
    return selectedColor
  }

  // Permission checking functions
  const canManageFolderMembers = () => {
    if (!user?.profile?.role) return false
    
    const role = user.profile.role
    
    // Admin and Manager have global permissions
    if (['admin', 'manager'].includes(role)) return true
    
    // Approvers have folder-scoped permissions (must be a member)
    if (role === 'approver') {
      return members.some(m => m.user.id === user?.id)
    }
    
    return false
  }

  const canRemoveMember = (member) => {
    // Check if user has elevated role (Admin/Manager/Approver with proper scope)
    if (canManageFolderMembers()) return true
    
    // Check if user is folder owner
    const userMember = members.find(m => m.user.id === user?.id)
    return userMember?.role === 'owner'
  }

  const canRemoveOwner = (member) => {
    // Only elevated roles can remove owners (no self-removal for Lite Users)
    return canManageFolderMembers()
  }

  const showAddMemberButton = () => {
    return canManageFolderMembers() || members.some(m => m.user.id === user?.id && m.role === 'owner')
  }

  useEffect(() => {
    if (isOpen && folder) {
      fetchMembers()
      fetchAvailableUsers()
    }
  }, [isOpen, folder])

  // Clear all state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setMembers([])
      setLoading(false)
      setShowAddMember(false)
      setAvailableUsers([])
      setSelectedUsers([])
      setSelectedRole('viewer')
      setSearchQuery('')
      setIsSearchFocused(false)
    }
  }, [isOpen])

  // Close user suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAddMember && isSearchFocused) {
        // Check if click is inside the search input or any part of the user list
        const isClickInsideSearch = event.target.closest('input[placeholder="Search users..."]')
        const isClickInsideUserList = event.target.closest('div[style*="maxHeight: 250"]')
        
        // Also check if click is inside any user item (including username, avatar, checkbox)
        const isClickInsideUserItem = event.target.closest('div[style*="cursor: pointer"]')
        
        if (!isClickInsideSearch && !isClickInsideUserList && !isClickInsideUserItem) {
          setIsSearchFocused(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAddMember, isSearchFocused])

  const fetchMembers = async () => {
    if (!folder) return
    
    setLoading(true)
    try {
      const response = await api.get(`/versioning/folders/${folder.id}/members/`)
      setMembers(response.data)
    } catch (error) {
      toast.error('Failed to fetch folder members', { id: 'members-error' })
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/versioning/projects/list_users/')
      console.log('Fetched users:', response.data.users)
      setAvailableUsers(response.data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddMember = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user', { id: 'add-member-error' })
      return
    }

    console.log('Selected users:', selectedUsers)
    try {
      // Add all selected users
      const promises = selectedUsers.map(user => 
        api.post(`/versioning/folders/${folder.id}/add_member/`, {
          user_id: user.id,
          role: selectedRole
        })
      )
      
      await Promise.all(promises)
      
      const count = selectedUsers.length
      toast.success(`${count} member${count > 1 ? 's' : ''} added successfully`, { id: 'add-member-success' })
      setShowAddMember(false)
      setSelectedUsers([])
      setSelectedRole('viewer')
      setSearchQuery('')
      fetchMembers()
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to add members'
      toast.error(errorMsg, { id: 'add-member-error' })
    }
  }

  const handleRemoveMember = async (memberId) => {
    try {
      await api.delete(`/versioning/folders/${folder.id}/remove_member/`, {
        data: { member_id: memberId }
      })
      toast.success('Member removed successfully', { id: 'remove-member-success' })
      fetchMembers()
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to remove member'
      toast.error(errorMsg, { id: 'remove-member-error' })
    }
  }

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await api.patch(`/versioning/folders/${folder.id}/update_member_role/`, {
        member_id: memberId,
        role: newRole
      })
      toast.success('Role updated successfully', { id: 'update-role-success' })
      fetchMembers()
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to update role'
      toast.error(errorMsg, { id: 'update-role-error' })
    }
  }

  const toggleUserSelection = (user) => {
    console.log('Toggling user:', user)
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.username === user.username)
      if (isSelected) {
        return prev.filter(u => u.username !== user.username)
      } else {
        return [...prev, user]
      }
    })
  }

  const filteredUsers = availableUsers.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const notAlreadyMember = !members.some(m => m.user.id === user.id)
    return matchesSearch && notAlreadyMember
  })

  const shouldShowUserList = showAddMember && (searchQuery || isSearchFocused)

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return '#FF9500'
      case 'editor':
        return '#30D158'
      case 'viewer':
        return '#0A84FF'
      default:
        return '#8E8E93'
    }
  }

  if (!isOpen) return null

  return (
    <>
      <style>
        {`
          .role-selector option {
            background: rgba(20, 20, 30, 0.95) !important;
            color: #fff !important;
          }
          .role-selector option:hover {
            background: rgba(10, 132, 255, 0.2) !important;
          }
        `}
      </style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }}>
        <div className="glass-card" style={{
        width: '100%',
        maxWidth: 450,
        maxHeight: '70vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users size={24} color="#fff" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Folder Members
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {/* Add Member Button */}
          {!showAddMember && showAddMemberButton() && (
            <button
              onClick={() => setShowAddMember(true)}
              className="btn-primary"
              style={{
                width: '100%',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <UserPlus size={18} />
              Add Member
            </button>
          )}

          {/* Add Member Form */}
          {showAddMember && (
            <div style={{
              padding: 16,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              marginBottom: 20
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                Add New Member
              </h3>
              
              {/* User Search */}
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: '#fff',
                  marginBottom: 12
                }}
              />

              {/* User List - Show when search field is focused or has query */}
              {shouldShowUserList && (
                <div style={{
                  maxHeight: 250,
                  overflowY: 'auto',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  marginBottom: 20
                }}>
                  {filteredUsers.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map(user => {
                      const isSelected = selectedUsers.some(u => u.username === user.username)
                      return (
                      <div
                        key={user.username}
                        onClick={() => toggleUserSelection(user)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: isSelected
                            ? 'rgba(10,132,255,0.2)'
                            : 'transparent',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        {/* Checkbox - FIRST (matching New Proofs layout) */}
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          border: '2px solid',
                          borderColor: isSelected ? '#0A84FF' : 'rgba(255,255,255,0.3)',
                          background: isSelected ? '#0A84FF' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isSelected && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>

                        {/* User Avatar/Icon - SECOND */}
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: getAvatarColor(user.username, 0, []),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          flexShrink: 0
                        }}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>

                        {/* User Info - THIRD */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginBottom: 2
                          }}>
                            {user.username}
                          </h4>
                          <p style={{
                            fontSize: '0.75rem',
                            color: 'rgba(255,255,255,0.4)'
                          }}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    )})
                  )}
                </div>
              )}

              {/* Role Selector */}
              <select
                className="role-selector"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  paddingLeft: '12px',
                  paddingRight: '32px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: '#fff',
                  marginBottom: 12,
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px',
                  cursor: 'pointer'
                }}
              >
                <option value="viewer" style={{ background: 'transparent', color: '#fff' }}>Viewer</option>
                <option value="editor" style={{ background: 'transparent', color: '#fff' }}>Editor</option>
              </select>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleAddMember}
                  className="btn-primary"
                  style={{ 
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  disabled={selectedUsers.length === 0}
                >
                  Add {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                </button>
                <button
                  onClick={() => {
                    setShowAddMember(false)
                    setSelectedUsers([])
                    setSearchQuery('')
                    setIsSearchFocused(false)
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Members List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.5)' }}>
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.5)' }}>
              No members yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(member => (
                <div
                  key={member.id}
                  style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                      {member.user.username}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                      {member.user.email}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Role Badge */}
                    <span style={{
                      padding: '4px 12px',
                      background: getRoleBadgeColor(member.role),
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#fff',
                      textTransform: 'uppercase'
                    }}>
                      {member.role}
                    </span>

                    {/* Remove Button */}
                    {(() => {
                      const canRemove = member.role === 'owner' 
                        ? canRemoveOwner(member)
                        : canRemoveMember(member)
                      
                      return canRemove && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: 'rgba(255,55,95,0.2)',
                            border: '1px solid rgba(255,55,95,0.3)',
                            color: '#FF375F',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}

export default FolderMembersModal
