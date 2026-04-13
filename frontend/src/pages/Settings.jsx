import React, { useState, useEffect } from 'react'
import CrushLoader from '../components/CrushLoader'
import { Settings as SettingsIcon, User, Bell, Shield, HelpCircle, LogOut } from 'lucide-react'
import api from '../services/api'

function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      console.log('Settings: Fetching fresh user data from API...')
      const userResponse = await api.get('/accounts/users/me/')
      console.log('Settings: Fresh user data received:', userResponse.data)
      
      if (userResponse.data) {
        setUser(userResponse.data)
        console.log('Settings: User details to display:', {
          username: userResponse.data.username,
          email: userResponse.data.email,
          firstName: userResponse.data.first_name,
          lastName: userResponse.data.last_name,
          fullName: `${userResponse.data.first_name} ${userResponse.data.last_name}`.trim() || userResponse.data.username
        })
      }
    } catch (error) {
      console.error('Settings: Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ]

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh'
      }}>
        <CrushLoader text="Loading settings..." />
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '32px' }}>
        {/* Sidebar */}
        <div style={{ width: '280px', flexShrink: 0 }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#fff', 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <SettingsIcon size={24} />
            Settings
          </h2>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: activeTab === id 
                    ? 'linear-gradient(135deg, #0A84FF33, #0A84FF18)'
                    : 'transparent',
                  border: activeTab === id ? '1px solid #0A84FF44' : '1px solid transparent',
                  boxShadow: activeTab === id ? '0 4px 16px #0A84FF30' : 'none',
                  color: activeTab === id ? '#fff' : 'rgba(255,255,255,0.7)',
                  fontWeight: activeTab === id ? '600' : '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== id) {
                    e.target.style.background = 'rgba(255,255,255,0.05)'
                    e.target.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== id) {
                    e.target.style.background = 'transparent'
                    e.target.style.color = 'rgba(255,255,255,0.7)'
                  }
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '32px',
            minHeight: '400px'
          }}>
            {activeTab === 'profile' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', marginBottom: '24px' }}>
                  Profile Settings
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={user ? `${user.first_name} ${user.last_name}`.trim() || user.username : ''}
                      readOnly
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.02)',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.9rem',
                        cursor: 'not-allowed',
                      }}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                      This field is managed during registration
                    </p>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      disabled
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.02)',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.9rem',
                        cursor: 'not-allowed',
                      }}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                      Contact support to change your email address
                    </p>
                  </div>
                  <div style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.85rem',
                    lineHeight: '1.5'
                  }}>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>📋 Profile Information</strong>
                    Your profile details (name and email) are set during registration and cannot be modified through these settings. If you need to update this information, please contact your system administrator.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', marginBottom: '24px' }}>
                  Notification Preferences
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    'Email notifications for new annotations',
                    'Push notifications for workflow updates',
                    'Weekly summary emails',
                    'Browser notifications for real-time updates'
                  ].map((item, index) => (
                    <label key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      color: 'rgba(255,255,255,0.9)',
                      cursor: 'pointer'
                    }}>
                      <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', marginBottom: '24px' }}>
                  Security Settings
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <button style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}>
                    Change Password
                  </button>
                  <button style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}>
                    Enable Two-Factor Authentication
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', marginBottom: '24px' }}>
                  Help & Support
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <a href="#" style={{ 
                    color: '#0A84FF', 
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem'
                  }}>
                    Documentation
                  </a>
                  <a href="#" style={{ 
                    color: '#0A84FF', 
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem'
                  }}>
                    Contact Support
                  </a>
                  <a href="#" style={{ 
                    color: '#0A84FF', 
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem'
                  }}>
                    Report a Bug
                  </a>
                  <a href="#" style={{ 
                    color: '#0A84FF', 
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.9rem'
                  }}>
                    Feature Requests
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
