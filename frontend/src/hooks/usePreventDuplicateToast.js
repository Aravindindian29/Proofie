import toast from 'react-hot-toast'

// Custom toast hook to prevent duplicate notifications
export const usePreventDuplicateToast = () => {
  const activeToasts = new Set()

  const showToast = (type, message, options = {}) => {
    const toastId = options.id || `${type}-${message}`
    
    if (activeToasts.has(toastId)) {
      return // Prevent duplicate toast
    }

    activeToasts.add(toastId)
    
    const toastOptions = {
      ...options,
      id: toastId,
      onClose: () => {
        activeToasts.delete(toastId)
        if (options.onClose) {
          options.onClose()
        }
      }
    }

    switch (type) {
      case 'success':
        toast.success(message, toastOptions)
        break
      case 'error':
        toast.error(message, toastOptions)
        break
      case 'loading':
        toast.loading(message, toastOptions)
        break
      default:
        toast(message, toastOptions)
    }
  }

  const dismissToast = (toastId) => {
    toast.dismiss(toastId)
    activeToasts.delete(toastId)
  }

  const clearAllToasts = () => {
    toast.dismiss()
    activeToasts.clear()
  }

  return { showToast, dismissToast, clearAllToasts }
}
