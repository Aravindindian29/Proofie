import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Folder, GitBranch, Bell, User, Settings, Menu, ChevronLeft } from 'lucide-react'

const mainNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#0A84FF' },
  { to: '/proofs', icon: ClipboardList, label: 'Proofs', color: '#FF375F' },
  { to: '/folders', icon: Folder, label: 'Folders', color: '#8E44AD' },
  { to: '/workflows', icon: GitBranch, label: 'Users', color: '#30D158' },
  { to: '/notifications', icon: Bell, label: 'Notifications', color: '#FF9F0A' },
  { to: '/profile', icon: User, label: 'Profile', color: '#8E44AD' },
  { to: '/settings', icon: Settings, label: 'Settings', color: '#FF6B35' },
]

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString())
  }, [isCollapsed])

  return (
    <aside style={{
      width: isCollapsed ? 80 : 240,
      minHeight: '100vh',
      transition: 'width 0.3s ease',
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 12px',
      flexShrink: 0,
    }}>
      {/* Hamburger Menu Toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: isCollapsed ? 'center' : 'flex-end', 
        padding: '0 12px 20px',
        width: '100%'
      }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            color: 'rgba(255,255,255,0.7)',
            '&:hover': {
              background: 'rgba(255,255,255,0.15)',
              color: '#fff'
            }
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.15)'
            e.target.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)'
            e.target.style.color = 'rgba(255,255,255,0.7)'
          }}
        >
          {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Logo */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 12, 
        padding: '0 12px 28px',
        justifyContent: isCollapsed ? 'center' : 'flex-start'
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: 'linear-gradient(135deg, #5E5CE6, #FF375F)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 18, color: '#fff',
          boxShadow: '0 4px 16px rgba(94,92,230,0.45)',
          flexShrink: 0,
        }}>P</div>
        {!isCollapsed && (
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#fff' }}>
            Proofie
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {mainNavItems.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: isCollapsed ? 0 : 12,
              padding: isCollapsed ? '11px' : '11px 14px',
              borderRadius: 14,
              textDecoration: 'none',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.9rem',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
              background: isActive
                ? `linear-gradient(135deg, ${color}33, ${color}18)`
                : 'transparent',
              border: isActive
                ? `1px solid ${color}44`
                : '1px solid transparent',
              boxShadow: isActive ? `0 4px 16px ${color}30` : 'none',
              transition: 'all 0.2s',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
            })}
          >
            {({ isActive }) => (
              <>
                <div 
                  title={isCollapsed ? label : ''}
                  style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: isActive ? `${color}30` : 'rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                >
                  <Icon size={17} color={isActive ? color : 'rgba(255,255,255,0.5)'} />
                  {isCollapsed && (
                    <div style={{
                      position: 'absolute',
                      left: '100%',
                      marginLeft: '8px',
                      background: 'rgba(0,0,0,0.9)',
                      color: '#fff',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      opacity: 0,
                      pointerEvents: 'none',
                      transition: 'opacity 0.2s',
                      zIndex: 1000,
                    }}>
                      {label}
                    </div>
                  )}
                </div>
                {!isCollapsed && label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom label */}
      {!isCollapsed && (
        <div style={{ marginTop: 'auto', padding: '0 12px' }}>
          <div style={{
            fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)',
            textAlign: 'center', letterSpacing: '0.08em',
          }}>
            PROOFIE v1.0
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
