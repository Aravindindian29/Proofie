import React, { useState, useEffect } from 'react'
import CrushLoader from '../components/CrushLoader'
import { Bell, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNotificationStore } from '../stores/notificationStore'

function Notifications() {
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore()

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

  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36 }}>
        <div className="fade-up">
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Activity</p>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>Notifications</h1>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button className="btn-secondary" style={{ borderRadius: 12 }}
            onClick={() => { markAllAsRead(); toast.success('All marked as read') }}>
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <CrushLoader />
      ) : notifications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifications.map((notif) => {
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
                    <div>
                      <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem', marginBottom: 4 }}>{notif.title}</p>
                      <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{notif.message}</p>
                    </div>
                    {!notif.is_read && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0A84FF', flexShrink: 0, marginTop: 6, boxShadow: '0 0 8px rgba(10,132,255,0.8)' }} />
                    )}
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
        <div className="glass-card-static" style={{ textAlign: 'center', padding: '80px 40px' }}>
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
