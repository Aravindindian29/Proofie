import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useNotificationStore } from '../stores/notificationStore'

function Layout() {
  const { fetchNotifications, fetchUnreadCount } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Navbar />
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
