import toast from 'react-hot-toast'

// Store active toasts globally to persist across renders
const activeToasts = new Set()

// Custom toast hook to prevent duplicate notifications
export const usePreventDuplicateToast = () => {
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
    
    // Fallback cleanup: Remove from activeToasts after duration + buffer
    // This ensures cleanup even if onClose doesn't fire (e.g., manual dismiss)
    const duration = options.duration || 2000
    setTimeout(() => {
      activeToasts.delete(toastId)
    }, duration + 500)
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
