import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useNotificationStore } from '../stores/notificationStore'

function Navbar() {
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header style={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 12,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>

      {/* Notification Bell */}
      <Link to="/notifications" data-tooltip="Notifications" style={{
        position: 'relative', width: 40, height: 40, borderRadius: 12,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none', transition: 'all 0.2s',
      }}>
        <Bell size={18} color="rgba(255,255,255,0.7)" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 18, height: 18, borderRadius: 9,
            background: 'linear-gradient(135deg, #FF375F, #FF6B6B)',
            color: '#fff', fontSize: '0.65rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid #05050f',
            boxShadow: '0 2px 8px rgba(255,55,95,0.6)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

      {/* User Menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 14px 7px 7px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, #0A84FF, #5E5CE6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '0.85rem',
            boxShadow: '0 2px 10px rgba(10,132,255,0.4)',
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.88rem' }}>
            {user?.username}
          </span>
          <ChevronDown size={14} color="rgba(255,255,255,0.4)" />
        </button>

        {showMenu && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            background: '#14142a',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            minWidth: 180,
            animation: 'fadeUp 0.15s ease',
            zIndex: 200,
          }}>
            <Link
              to="/profile"
              onClick={() => setShowMenu(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <User size={15} /> Profile
            </Link>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 10px' }} />
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '12px 16px',
                color: '#FF375F', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,55,95,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
