import React, { useState, useEffect, useRef } from 'react'
import { Users as UsersIcon, Search, ChevronUp, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import Pagination from '../components/Pagination'

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sortConfig, setSortConfig] = useState({ key: 'first_name', direction: 'asc' })
  const debounceTimeoutRef = useRef(null)

  // Avatar color function - same as FolderMembersModal
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

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return '#FF375F'
      case 'manager':
        return '#FF9F0A'
      case 'approver':
        return '#30D158'
      case 'lite_user':
        return '#0A84FF'
      default:
        return '#8E8E93'
    }
  }

  const getStatusBadgeColor = (isActive) => {
    return isActive ? '#30D158' : '#FF375F'
  }

  const fetchUsers = async (overrideSearchQuery = null) => {
    const effectiveSearchQuery = overrideSearchQuery !== null ? overrideSearchQuery : searchQuery
    console.log('fetchUsers called with searchQuery:', searchQuery, 'overrideSearchQuery:', overrideSearchQuery, 'effectiveSearchQuery:', effectiveSearchQuery)
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', currentPage)
      if (effectiveSearchQuery && effectiveSearchQuery.trim()) {
        // Enhanced search that looks across multiple fields
        // For multi-word names, search the full query first
        // If no results, the backend will handle individual word searches
        params.append('search', effectiveSearchQuery.trim())
      }
      if (sortConfig.key) params.append('sort', sortConfig.key)
      params.append('order', sortConfig.direction)
      
      console.log('API call URL:', `/accounts/users/list_all_users/?${params}`)

      const response = await api.get(`/accounts/users/list_all_users/?${params}`)
      
      console.log('Full API response:', response.data)
      let users = response.data.results || []
      console.log('Users from response:', users)
      console.log('Total count from response:', response.data.count)
      
      // Only do fallback search if there's actually a search query
      if (users.length === 0 && effectiveSearchQuery && effectiveSearchQuery.trim() && effectiveSearchQuery.includes(' ')) {
        const words = effectiveSearchQuery.trim().split(' ').filter(word => word.length > 0)
        
        // Try first word only
        const firstWordParams = new URLSearchParams()
        firstWordParams.append('page', currentPage)
        firstWordParams.append('search', words[0])
        if (sortConfig.key) firstWordParams.append('sort', sortConfig.key)
        firstWordParams.append('order', sortConfig.direction)
        
        try {
          const firstWordResponse = await api.get(`/accounts/users/list_all_users/?${firstWordParams}`)
          users = firstWordResponse.data.results || []
        } catch (error) {
          console.log('First word search failed:', error)
        }
      }
      
      console.log('Setting users:', users.length, 'users')
      console.log('Setting totalPages to:', Math.ceil(response.data.count / 5))
      console.log('Setting totalCount to:', response.data.count)
      setUsers(users)
      setTotalPages(Math.ceil(response.data.count / 5))
      setTotalCount(response.data.count)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('useEffect triggered - currentPage:', currentPage, 'sortConfig:', sortConfig)
    fetchUsers()
    
    // Set up periodic refresh to get latest status updates
    const interval = setInterval(() => {
      fetchUsers()
    }, 30000) // Refresh every 30 seconds
    
    // Cleanup function to clear timeout and interval on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      clearInterval(interval)
    }
  }, [currentPage, sortConfig])

  const handleSort = (key) => {
    console.log('handleSort called with key:', key, 'current sortConfig:', sortConfig)
    setSortConfig(prevConfig => {
      let direction = 'asc'
      if (prevConfig.key === key && prevConfig.direction === 'asc') {
        direction = 'desc'
      }
      const newConfig = { key, direction }
      console.log('New sortConfig:', newConfig)
      return newConfig
    })
    setCurrentPage(1) // Reset to first page when sorting
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const getFullName = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.username
  }

  const getDisplayName = (user) => {
    return getFullName(user)
  }

  return (
    <div style={{ padding: '12px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '16px' }}>
        <UsersIcon size={28} color="#fff" />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: 0 }}>
          Users
        </h1>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ position: 'relative', maxWidth: '180px' }}>
          <Search 
            size={18} 
            color="rgba(255,255,255,0.5)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search Username"
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value
              setCurrentPage(1)
              
              // Clear existing timeout
              if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current)
              }
              
              // If search is cleared, fetch all users immediately
              if (!value.trim()) {
                console.log('Search field cleared, fetching all users')
                setSearchQuery('') // Clear state first
                setCurrentPage(1) // Reset to first page when clearing search
                fetchUsers('') // Then fetch without search parameter using override
              } else {
                console.log('Search field has value:', value, 'setting timeout')
                setSearchQuery(value) // Set state for non-empty values
                // Set new timeout for debounced search
                debounceTimeoutRef.current = setTimeout(() => {
                  fetchUsers()
                }, 800) // 800ms delay to allow more time for typing
              }
            }}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      {/* Pagination - Top Right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', minHeight: '40px' }}>
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Users Table */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '14px',
        overflow: 'hidden',
        minHeight: '400px'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 320px 1fr 1fr',
          padding: '12px 20px',
          background: 'rgba(255,255,255,0.07)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          fontWeight: 600,
          fontSize: '0.9rem',
          color: 'rgba(255,255,255,0.7)'
        }}>
          <div></div>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              cursor: 'pointer',
              userSelect: 'none',
              justifyContent: 'flex-start',
              paddingLeft: '8px'
            }}
            onClick={() => handleSort('first_name')}
          >
            Name
            {sortConfig.key === 'first_name' ? (
              sortConfig.direction === 'asc' ? <ChevronUp size={16} color="rgba(255,255,255,0.8)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.8)" />
            ) : (
              <ChevronDown size={16} color="rgba(255,255,255,0.8)" />
            )}
          </div>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              cursor: 'pointer',
              userSelect: 'none',
              justifyContent: 'center'
            }}
            onClick={() => handleSort('email')}
          >
            Email ID
            {sortConfig.key === 'email' && (
              sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            )}
          </div>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              cursor: 'pointer',
              userSelect: 'none',
              justifyContent: 'center'
            }}
            onClick={() => handleSort('is_active')}
          >
            User Status
            {sortConfig.key === 'is_active' && (
              sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            )}
          </div>
        </div>

        {/* Table Content */}
        <div style={{ maxHeight: '500px', minHeight: '200px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: 'rgba(255,255,255,0.5)' 
            }}>
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: 'rgba(255,255,255,0.5)' 
            }}>
              {searchQuery ? 'No users found matching your search' : 'No users available'}
            </div>
          ) : (
            users.map((user, index) => {
              const previousColors = users.slice(0, index).map(u => getAvatarColor(u.username, 0, []))
              return (
                <div
                  key={user.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 320px 1fr 1fr',
                    padding: '12px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    transition: 'background 0.2s',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {/* Profile Icon Column */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: getAvatarColor(user.username, index, previousColors),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#fff'
                    }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Username and Role Column */}
                  <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: '8px', alignItems: 'center', gap: '6px' }}>
                    <div style={{ 
                      color: '#fff', 
                      fontWeight: 600, 
                      fontSize: '0.95rem'
                    }}>
                      {getDisplayName(user)}
                    </div>
                    <span style={{
                      padding: '0px 2px',
                      background: 'transparent',
                      borderRadius: '2px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.8)',
                      textTransform: 'uppercase',
                      display: 'inline-block',
                      border: '1px solid rgba(255,255,255,0.3)',
                      lineHeight: '1.1',
                      minWidth: 'auto'
                    }}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Email Column */}
                  <div style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    {user.email}
                  </div>

                  {/* Status Column */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: getStatusBadgeColor(user.is_active),
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#fff',
                      textTransform: 'uppercase'
                    }}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* User Count */}
      <div style={{ 
        marginTop: '16px', 
        color: 'rgba(255,255,255,0.5)', 
        fontSize: '0.85rem',
        textAlign: 'center'
      }}>
        Showing {users.length} of {totalCount} users
      </div>
    </div>
  )
}

export default Users
