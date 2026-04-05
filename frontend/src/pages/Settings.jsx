import React, { useState, useEffect } from 'react'
import CrushLoader from '../components/CrushLoader'
import { Settings as SettingsIcon, User, Bell, Shield, Palette, HelpCircle, LogOut } from 'lucide-react'
import api from '../services/api'

function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [theme, setTheme] = useState('dark')
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
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ]

  if (loading) {
    return (
      <CrushLoader text="Loading settings..." />
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

            {activeTab === 'appearance' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', marginBottom: '24px' }}>
                  Appearance
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    color: 'rgba(255,255,255,0.9)',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="radio" 
                      name="theme" 
                      checked={theme === 'dark'}
                      onChange={() => {
                        setTheme('dark')
                        // Remove light theme styles
                        const lightThemeStyles = document.getElementById('light-theme-styles')
                        if (lightThemeStyles) {
                          lightThemeStyles.remove()
                        }
                        
                        // Remove light theme classes
                        document.body.classList.remove('light-theme')
                        const sidebar = document.querySelector('aside')
                        if (sidebar) {
                          sidebar.classList.remove('light-theme-sidebar')
                        }
                        
                        // Remove light theme classes from all elements
                        document.querySelectorAll('.light-theme-card, .light-theme-text').forEach(el => {
                          el.classList.remove('light-theme-card', 'light-theme-text')
                        })
                        
                        // Reset body styles
                        document.body.style.background = ''
                        document.body.style.color = ''
                      }}
                      style={{ width: '18px', height: '18px' }} 
                    />
                    Dark Theme (Default)
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    color: 'rgba(255,255,255,0.9)',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="radio" 
                      name="theme" 
                      checked={theme === 'light'}
                      onChange={() => {
                        setTheme('light')
                        
                        // Remove any existing theme styles first
                        const existingStyle = document.getElementById('light-theme-styles')
                        if (existingStyle) {
                          existingStyle.remove()
                        }
                        
                        // Create an exceptional white theme inspired by iOS and modern design
                        const style = document.createElement('style')
                        style.id = 'light-theme-styles'
                        style.textContent = `
                          /* Exceptional white theme - iOS inspired */
                          body {
                            background: #ffffff !important;
                            color: #1c1c1e !important;
                            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
                            line-height: 1.47059 !important;
                            font-weight: 400 !important;
                            -webkit-font-smoothing: antialiased !important;
                            -moz-osx-font-smoothing: grayscale !important;
                          }
                          
                          /* Header with iOS-style navigation */
                          header {
                            background: rgba(255, 255, 255, 0.72) !important;
                            color: #1c1c1e !important;
                            border-bottom: 0.5px solid rgba(60, 60, 67, 0.18) !important;
                            backdrop-filter: blur(20px) !important;
                            -webkit-backdrop-filter: blur(20px) !important;
                          }
                          header * {
                            color: #1c1c1e !important;
                          }
                          
                          /* Sidebar */
                          aside {
                            background: #f2f2f7 !important;
                            border-right: 1px solid rgba(60, 60, 67, 0.18) !important;
                            color: #1c1c1e !important;
                          }
                          
                          /* Main content */
                          main {
                            background: #ffffff !important;
                            color: #1c1c1e !important;
                          }
                          
                          /* Cards with iOS-style design */
                          div[style*="background: rgba"] {
                            background: #ffffff !important;
                            color: #1c1c1e !important;
                            border: 0.5px solid rgba(60, 60, 67, 0.18) !important;
                            border-radius: 12px !important;
                            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
                          }
                          
                          /* Typography - iOS style hierarchy */
                          h1, h2, h3, h4, h5, h6, p, span, div, label {
                            color: #1c1c1e !important;
                          }
                          
                          /* Large titles - iOS style */
                          h1 {
                            font-size: 34px !important;
                            font-weight: 700 !important;
                            line-height: 1.12119 !important;
                            letter-spacing: 0.374px !important;
                          }
                          
                          /* Title 1 */
                          h2 {
                            font-size: 28px !important;
                            font-weight: 700 !important;
                            line-height: 1.13333 !important;
                            letter-spacing: 0.364px !important;
                          }
                          
                          /* Title 2 */
                          h3 {
                            font-size: 22px !important;
                            font-weight: 700 !important;
                            line-height: 1.27273 !important;
                            letter-spacing: 0.352px !important;
                          }
                          
                          /* Headline */
                          h4 {
                            font-size: 17px !important;
                            font-weight: 600 !important;
                            line-height: 1.47059 !important;
                          }
                          
                          /* Body */
                          p, span, div, label {
                            font-size: 17px !important;
                            font-weight: 400 !important;
                            line-height: 1.47059 !important;
                            color: #1c1c1e !important;
                          }
                          
                          /* Secondary text */
                          .secondary, .caption {
                            font-size: 15px !important;
                            color: #3c3c43 !important;
                            opacity: 0.6 !important;
                          }
                          
                          /* Override all white text */
                          [style*="color: #fff"],
                          [style*="color: white"],
                          [style*="color: rgba(255,255,255,0.9)"],
                          [style*="color: rgba(255,255,255,0.8)"],
                          [style*="color: rgba(255,255,255,0.7)"],
                          [style*="color: rgba(255,255,255,0.6)"],
                          [style*="color: rgba(255,255,255,0.5)"] {
                            color: #1c1c1e !important;
                          }
                          
                          /* Dashboard elements */
                          .welcome-message,
                          .dashboard-stats .number,
                          .dashboard-stats .label,
                          .no-projects-message {
                            color: #1c1c1e !important;
                            font-weight: 600 !important;
                          }
                          
                          .dashboard-stats .number {
                            font-size: 34px !important;
                            font-weight: 700 !important;
                            line-height: 1.12119 !important;
                            letter-spacing: 0.374px !important;
                          }
                          
                          /* Sidebar elements */
                          aside h2,
                          aside h3,
                          aside span,
                          aside button,
                          aside label,
                          aside div {
                            color: #1c1c1e !important;
                          }
                          
                          /* iOS-style navigation */
                          nav a {
                            color: #007aff !important;
                            border-radius: 0 !important;
                            transition: all 0.15s ease !important;
                            padding: 12px 16px !important;
                            margin: 0 !important;
                            font-weight: 400 !important;
                            font-size: 17px !important;
                            border-left: none !important;
                            background: transparent !important;
                          }
                          nav a:hover {
                            background: rgba(0, 122, 255, 0.08) !important;
                            color: #007aff !important;
                          }
                          nav a[class*="active"] {
                            background: rgba(0, 122, 255, 0.08) !important;
                            color: #007aff !important;
                            font-weight: 600 !important;
                            border-left: none !important;
                            box-shadow: none !important;
                          }
                          nav a[class*="active"] svg {
                            color: #007aff !important;
                            fill: #007aff !important;
                          }
                          
                          /* iOS-style buttons */
                          button {
                            background: #007aff !important;
                            color: #ffffff !important;
                            border: none !important;
                            border-radius: 8px !important;
                            padding: 12px 24px !important;
                            font-weight: 600 !important;
                            font-size: 17px !important;
                            transition: all 0.15s ease !important;
                            box-shadow: none !important;
                            min-height: 44px !important;
                            min-width: 44px !important;
                          }
                          button:hover {
                            background: #0051d5 !important;
                            opacity: 0.8 !important;
                          }
                          button:active {
                            background: #0041ad !important;
                            opacity: 0.6 !important;
                          }
                          
                          /* Secondary buttons */
                          button.secondary {
                            background: transparent !important;
                            color: #007aff !important;
                            border: none !important;
                            font-weight: 400 !important;
                          }
                          button.secondary:hover {
                            background: rgba(0, 122, 255, 0.08) !important;
                          }
                          
                          /* Destructive buttons */
                          button.destructive {
                            background: #ff3b30 !important;
                            color: #ffffff !important;
                          }
                          button.destructive:hover {
                            background: #d70015 !important;
                          }
                          
                          /* iOS-style form elements */
                          input, select, textarea {
                            background: #ffffff !important;
                            color: #1c1c1e !important;
                            border: 0.5px solid rgba(60, 60, 67, 0.18) !important;
                            border-radius: 10px !important;
                            padding: 12px 16px !important;
                            font-size: 17px !important;
                            font-weight: 400 !important;
                            transition: all 0.15s ease !important;
                            min-height: 44px !important;
                          }
                          input:focus, select:focus, textarea:focus {
                            border-color: #007aff !important;
                            box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1) !important;
                            outline: none !important;
                          }
                          input:hover, select:hover, textarea:hover {
                            border-color: rgba(60, 60, 67, 0.36) !important;
                          }
                          
                          /* Links */
                          a {
                            color: #007aff !important;
                            text-decoration: none !important;
                            transition: all 0.15s ease !important;
                          }
                          a:hover {
                            color: #0051d5 !important;
                            text-decoration: underline !important;
                          }
                          
                          /* iOS system colors */
                          .system-blue {
                            color: #007aff !important;
                          }
                          .system-green {
                            color: #34c759 !important;
                          }
                          .system-indigo {
                            color: #5856d6 !important;
                          }
                          .system-orange {
                            color: #ff9500 !important;
                          }
                          .system-pink {
                            color: #ff2d92 !important;
                          }
                          .system-purple {
                            color: #af52de !important;
                          }
                          .system-red {
                            color: #ff3b30 !important;
                          }
                          .system-teal {
                            color: #5ac8fa !important;
                          }
                          .system-yellow {
                                    color: #ffcc00 !important;
                          }
                          
                          /* Icons */
                          svg {
                            color: #8e8e93 !important;
                            opacity: 1 !important;
                            fill: #8e8e93 !important;
                          }
                          
                          /* Images */
                          img {
                            opacity: 1 !important;
                            filter: none !important;
                            border-radius: 10px !important;
                          }
                          
                          /* Icon containers */
                          div[style*="background: linear-gradient"] {
                            opacity: 1 !important;
                            border-radius: 12px !important;
                          }
                          
                          /* Navigation icons */
                          nav a svg,
                          aside svg {
                            color: #8e8e93 !important;
                            opacity: 1 !important;
                            fill: #8e8e93 !important;
                          }
                          
                          nav a:hover svg,
                          aside a:hover svg {
                            color: #007aff !important;
                            fill: #007aff !important;
                          }
                          
                          nav a[class*="active"] svg,
                          aside a[class*="active"] svg {
                            color: #007aff !important;
                            fill: #007aff !important;
                          }
                          
                          /* Dashboard icons */
                          .dashboard-stats svg,
                          .stat-icon svg {
                            color: #8e8e93 !important;
                            opacity: 1 !important;
                            fill: #8e8e93 !important;
                          }
                          
                          /* iOS-style lists */
                          .list-item {
                            background: #ffffff !important;
                            border: none !important;
                            border-radius: 0 !important;
                            border-bottom: 0.5px solid rgba(60, 60, 67, 0.18) !important;
                            padding: 12px 16px !important;
                            margin: 0 !important;
                            box-shadow: none !important;
                          }
                          .list-item:last-child {
                            border-bottom: none !important;
                          }
                          
                          /* Force all text to be dark */
                          * {
                            color: #1c1c1e !important;
                          }
                          
                          /* Exceptions */
                          button {
                            color: #ffffff !important;
                          }
                          button.secondary {
                            color: #007aff !important;
                          }
                          button.destructive {
                            color: #ffffff !important;
                          }
                          a {
                            color: #007aff !important;
                          }
                          nav a[class*="active"] {
                            color: #007aff !important;
                          }
                          nav a {
                            color: #007aff !important;
                          }
                          nav a:hover {
                            color: #007aff !important;
                          }
                          svg {
                            color: #8e8e93 !important;
                            fill: #8e8e93 !important;
                          }
                          
                          /* Professional scrollbar */
                          ::-webkit-scrollbar {
                            width: 8px !important;
                            height: 8px !important;
                          }
                          ::-webkit-scrollbar-track {
                            background: #f2f2f7 !important;
                          }
                          ::-webkit-scrollbar-thumb {
                            background: #c7c7cc !important;
                            border-radius: 4px !important;
                          }
                          ::-webkit-scrollbar-thumb:hover {
                            background: #8e8e93 !important;
                          }
                          
                          /* Selection */
                          ::selection {
                            background: #007aff !important;
                            color: #ffffff !important;
                          }
                          ::-moz-selection {
                            background: #007aff !important;
                            color: #ffffff !important;
                          }
                          
                          /* iOS-style focus ring */
                          :focus {
                            outline: none !important;
                          }
                          :focus-visible {
                            outline: 2px solid #007aff !important;
                            outline-offset: 2px !important;
                            border-radius: 4px !important;
                          }
                        `
                        
                        // Add the styles to head
                        document.head.appendChild(style)
                      }}
                      style={{ width: '18px', height: '18px' }} 
                    />
                    Light Theme
                  </label>
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
