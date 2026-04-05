import toast from 'react-hot-toast'

export const toastManager = {
  success: (message, id = 'success-action') => {
    toast.dismiss(id) // Clear any existing with same ID
    toast.success(message, { id, duration: 4000 })
  },
  
  error: (message, id = 'error-general') => {
    toast.dismiss(id) // Clear any existing with same ID
    toast.error(message, { id, duration: 5000 })
  },
  
  permission: (message) => {
    toast.dismiss('permission-denied')
    toast.error(message, { id: 'permission-denied', duration: 5000 })
  },
  
  deleteError: (message) => {
    toast.dismiss('delete-error')
    toast.error(message, { id: 'delete-error', duration: 5000 })
  },
  
  createError: (message) => {
    toast.dismiss('create-error')
    toast.error(message, { id: 'create-error', duration: 5000 })
  },
  
  fetchError: (message) => {
    toast.dismiss('fetch-error')
    toast.error(message, { id: 'fetch-error', duration: 5000 })
  },
  
  clearAll: () => toast.dismiss()
}
