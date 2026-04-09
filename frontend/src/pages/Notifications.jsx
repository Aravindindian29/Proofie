import React, { useState, useEffect } from 'react'
import CrushLoader from '../components/CrushLoader'
import { Bell, CheckCircle, AlertCircle, MessageSquare, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNotificationStore } from '../stores/notificationStore'
import Pagination from '../components/Pagination'

function Notifications() {
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore()
  const [currentPage, setCurrentPage] = useState(1)
  const NOTIFICATIONS_PER_PAGE = 4

  useEffect(() => {
    fetchNotifications()
  }, [])

  const typeConfig = {
    stage_approved:    { icon: CheckCircle,   color: '#30D158', bg: 'rgba(48,209,88,0.15)',  border: 'rgba(48,209,88,0.3)' },
    stage_rejected:    { icon: AlertCircle,   color: '#FF375F', bg: 'rgba(255,55,95,0.15)',  border: 'rgba(255,55,95,0.3)' },
    comment_added:     { icon: MessageSquare, color: '#0A84FF', bg: 'rgba(10,132,255,0.15)', border: 'rgba(10,132,255,0.3)' },
    annotation_created:{ icon: MessageSquare, color: '#5E5CE6', bg: 'rgba(94,92,230,0.15)',  border: 'rgba(94,92,230,0.3)' },
  }
  const getConfig = (type) => typeConfig[type] || { icon: Bell, color: '#FF9F0A', bg: 'rgba(255,159,10,0.15)', border: 'rgba(255,159,10,0.3)' }

  // Calculate pagination
  const totalPages = Math.ceil(notifications.length / NOTIFICATIONS_PER_PAGE)
  const startIndex = (currentPage - 1) * NOTIFICATIONS_PER_PAGE
  const endIndex = startIndex + NOTIFICATIONS_PER_PAGE
  const currentNotifications = notifications.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleDeleteNotification = async (notificationId) => {
    try {
      // Dismiss any existing toasts to prevent stacking
      toast.dismiss()
      await deleteNotification(notificationId)
      toast.success('Notification deleted')
      
      // Adjust current page if necessary after deletion
      const newTotalPages = Math.ceil((notifications.length - 1) / NOTIFICATIONS_PER_PAGE)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to delete notification')
    }
  }

  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
        <div className="fade-up">
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Activity</p>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>Notifications</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
          {notifications.some(n => !n.is_read) && (
            <button className="btn-secondary" style={{ borderRadius: 12 }}
              onClick={() => { 
                toast.dismiss();
                markAllAsRead(); 
                toast.success('All marked as read') 
              }}>
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <CrushLoader />
      ) : notifications.length > 0 ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          {currentNotifications.map((notif) => {
            const cfg = getConfig(notif.notification_type)
            const Icon = cfg.icon
            return (
              <div key={notif.id}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                  padding: '18px 20px',
                  background: notif.is_read ? 'rgba(255,255,255,0.04)' : 'rgba(10,132,255,0.07)',
                  border: `1px solid ${notif.is_read ? 'rgba(255,255,255,0.07)' : 'rgba(10,132,255,0.2)'}`,
                  borderRadius: 16, cursor: notif.is_read ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = notif.is_read ? 'rgba(255,255,255,0.07)' : 'rgba(10,132,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = notif.is_read ? 'rgba(255,255,255,0.04)' : 'rgba(10,132,255,0.07)'}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem', marginBottom: 4 }}>{notif.title}</p>
                      <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{notif.message}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNotification(notif.id)
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(255, 55, 95, 0.1)',
                          border: '1px solid rgba(255, 55, 95, 0.2)',
                          color: '#FF375F',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          flexShrink: 0,
                          marginTop: 2
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 55, 95, 0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 55, 95, 0.1)'}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)', marginTop: 8 }}>
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: '80px 40px',
          textAlign: 'center'
        }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
            background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={32} color="#FF9F0A" />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)' }}>No notifications yet</p>
        </div>
      )}
    </div>
  )
}

export default Notifications
