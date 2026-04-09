import { create } from 'zustand'
import api from '../services/api'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const response = await api.get('/notifications/')
      set({ notifications: response.data.results || response.data })
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread_count/')
      set({ unreadCount: response.data.unread_count })
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/mark_as_read/`)
      const notifications = get().notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
      set({ notifications })
      get().fetchUnreadCount()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/mark_all_as_read/')
      const notifications = get().notifications.map(n => ({ ...n, is_read: true }))
      set({ notifications, unreadCount: 0 })
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  },

  addNotification: (notification) => {
    set({ notifications: [notification, ...get().notifications] })
    get().fetchUnreadCount()
  },

  deleteNotification: async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}/`)
      const notifications = get().notifications.filter(n => n.id !== notificationId)
      set({ notifications })
      get().fetchUnreadCount()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  },
}))
