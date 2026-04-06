import toast from 'react-hot-toast'

export const toastManager = {
  success: (message, id = 'success-action', options = {}) => {
    toast.dismiss() // Clear ALL existing toasts
    toast.success(message, { id, duration: 4000, ...options })
  },
  
  error: (message, id = 'error-general', options = {}) => {
    toast.dismiss() // Clear ALL existing toasts
    toast.error(message, { id, duration: 5000, ...options })
  },
  
  permission: (message, id = 'permission-denied', options = {}) => {
    toast.dismiss() // Clear ALL existing toasts
    toast.error(message, { id, duration: 5000, ...options })
  },
  
  deleteError: (message, id = 'delete-error', options = {}) => {
    toast.dismiss() // Clear ALL existing toasts
    toast.error(message, { id, duration: 5000, ...options })
  },
  
  createError: (message, id = 'create-error', options = {}) => {
    toast.dismiss() // Clear ALL existing toasts
    toast.error(message, { id, duration: 5000, ...options })
  },
  
  fetchError: (message, id = 'fetch-error', options = {}) => {
    toast.dismiss() // Clear ALL existing toasts
    toast.error(message, { id, duration: 5000, ...options })
  },
  
  clearAll: () => toast.dismiss()
}
