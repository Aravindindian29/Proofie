import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: false,
      error: null,
      permissionsUpdatedAt: null,
      pollingInterval: null,

      // Permission helper functions
      getUserRole: () => {
        const { user } = get()
        return user?.profile?.role || 'lite_user'
      },

      isAdmin: () => {
        return get().getUserRole() === 'admin'
      },

      isManager: () => {
        return get().getUserRole() === 'manager'
      },

      isApprover: () => {
        return get().getUserRole() === 'approver'
      },

      isLiteUser: () => {
        return get().getUserRole() === 'lite_user'
      },

      // Granular permission checks - Proof Permissions
      canCreateProof: () => {
        const { user } = get()
        return user?.profile?.can_create_proof || false
      },

      // Granular permission checks - Folder Permissions
      canCreateFolder: () => {
        const { user } = get()
        return user?.profile?.can_create_folder || false
      },

      canAddMember: () => {
        const { user } = get()
        return user?.profile?.can_add_delete_member || false
      },

      canEditFolder: () => {
        const { user } = get()
        return user?.profile?.can_edit_folder || false
      },

      canAddProof: () => {
        const { user } = get()
        return user?.profile?.can_add_delete_proof || false
      },

      canDeleteFolder: () => {
        const { user } = get()
        return user?.profile?.can_delete_folder || false
      },

      // Inside Folder Permissions
      canDeleteProofInFolder: () => {
        const { user } = get()
        return user?.profile?.can_delete_proof_in_folder || false
      },

      // Proof Preview Permissions
      canUseProofiePlus: () => {
        const { user } = get()
        return user?.profile?.can_use_proofieplus || false
      },

      canAddComment: () => {
        const { user } = get()
        return user?.profile?.can_add_comment || false
      },

      canDeleteProofInPreview: () => {
        const { user } = get()
        return user?.profile?.can_delete_proof_in_preview || false
      },

      canMakeDecisions: () => {
        const { user } = get()
        return user?.profile?.can_make_decisions || false
      },

      // Legacy compatibility functions
      canCreateContent: () => {
        return get().canCreateFolder()
      },

      canEditContent: (content) => {
        const { user } = get()
        
        // Check if user has specific edit folder permission
        if (!user?.profile?.can_edit_folder) return false
        
        // If user has edit permission, they can edit
        return true
      },

      canDeleteContent: (content) => {
        const { user } = get()
        
        // Check if user has specific delete folder permission
        if (!user?.profile?.can_delete_folder) return false
        
        // If user has delete permission, they can delete
        return true
      },

      canViewContent: (content) => {
        const { user } = get()
        
        if (content?.owner?.id === user?.id) return true
        if (content?.members?.some(member => member.user?.id === user?.id)) return true
        
        // Admin can view everything
        const isAdmin = user?.profile?.can_create_folder && 
                       user?.profile?.can_delete_folder && 
                       user?.profile?.can_edit_folder
        if (isAdmin) return true
        
        return false
      },

      login: async (username, password) => {
        set({ loading: true, error: null })
        try {
          const response = await api.post('/auth/token/', { username, password })
          const token = response.data.token
          set({ token, loading: false })
          api.defaults.headers.common['Authorization'] = `Token ${token}`
          
          const userResponse = await api.get('/accounts/users/me/')
          set({ user: userResponse.data })
        } catch (error) {
          // Handle 401 errors specifically for login to avoid interceptor interference
          if (error.response?.status === 401) {
            const errorMessage = error.response?.data?.detail || 'Invalid credentials'
            set({ error: errorMessage, loading: false })
            throw new Error(errorMessage)
          } else {
            const errorMessage = error.response?.data?.detail || 'Login failed'
            set({ error: errorMessage, loading: false })
            throw new Error(errorMessage)
          }
        }
      },

      register: async (username, email, password, passwordConfirm, firstName = '', lastName = '') => {
        set({ loading: true, error: null })
        try {
          await api.post('/accounts/users/register/', {
            username,
            email,
            first_name: firstName,
            last_name: lastName,
            password,
            password_confirm: passwordConfirm,
          })
          set({ loading: false })
        } catch (error) {
          const errorMessage = error.response?.data?.detail || 'Registration failed'
          set({ error: errorMessage, loading: false })
          throw new Error(errorMessage)
        }
      },

      logout: () => {
        // Stop polling before logout
        get().stopPermissionPolling()
        set({ token: null, user: null, permissionsUpdatedAt: null })
        delete api.defaults.headers.common['Authorization']
        localStorage.removeItem('auth-storage')
      },

      refreshUserData: async () => {
        try {
          const response = await api.get('/accounts/users/me/')
          set({ 
            user: response.data, 
            permissionsUpdatedAt: response.data.profile?.permissions_updated_at 
          })
          return response.data
        } catch (error) {
          console.error('Failed to refresh user data:', error)
          throw error
        }
      },

      startPermissionPolling: () => {
        const { token, pollingInterval } = get()
        
        // Don't start if already polling or no token
        if (pollingInterval || !token) return
        
        // Initial version capture
        const currentUser = get().user
        set({ permissionsUpdatedAt: currentUser?.profile?.permissions_updated_at })
        
        const interval = setInterval(async () => {
          try {
            const response = await api.get('/accounts/users/permissions-version/')
            const newVersion = response.data.permissions_updated_at
            const currentVersion = get().permissionsUpdatedAt
            
            if (currentVersion && newVersion !== currentVersion) {
              console.log('Permission change detected, refreshing user data...')
              await get().refreshUserData()
              
              // Show toast notification
              const toast = (await import('react-hot-toast')).default
              toast.success('Your permissions have been updated', { 
                id: 'permission-update',
                duration: 5000 
              })
            }
          } catch (error) {
            console.error('Permission polling error:', error)
          }
        }, 15000) // Poll every 15 seconds
        
        set({ pollingInterval: interval })
      },

      stopPermissionPolling: () => {
        const { pollingInterval } = get()
        if (pollingInterval) {
          clearInterval(pollingInterval)
          set({ pollingInterval: null })
        }
      },

      clearCacheAndRefresh: async () => {
        // Clear all cached data
        localStorage.removeItem('auth-storage')
        set({ token: null, user: null })
        delete api.defaults.headers.common['Authorization']
        
        // Check if there's a token in the old format and migrate it
        const oldToken = localStorage.getItem('auth-token')
        if (oldToken) {
          try {
            api.defaults.headers.common['Authorization'] = `Token ${oldToken}`
            const userResponse = await api.get('/accounts/users/me/')
            set({ token: oldToken, user: userResponse.data })
            // Store in new format
            localStorage.setItem('auth-storage', JSON.stringify({
              state: { token: oldToken, user: userResponse.data }
            }))
          } catch (error) {
            console.error('Failed to refresh with old token:', error)
          }
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth-storage')
        if (token) {
          try {
            const parsed = JSON.parse(token)
            if (parsed.state?.token) {
              set({ token: parsed.state.token })
              api.defaults.headers.common['Authorization'] = `Token ${parsed.state.token}`
              
              // Fetch user data
              try {
                const userResponse = await api.get('/accounts/users/me/')
                set({ user: userResponse.data })
              } catch (error) {
                console.error('Failed to fetch user data:', error)
                // Clear invalid token
                set({ token: null, user: null })
                delete api.defaults.headers.common['Authorization']
              }
            }
          } catch (error) {
            console.error('Failed to parse auth storage:', error)
            set({ token: null, user: null })
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => async (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Token ${state.token}`
          
          // Fetch user data on rehydration
          try {
            const userResponse = await api.get('/accounts/users/me/')
            state.user = userResponse.data
          } catch (error) {
            console.error('Failed to fetch user data on rehydration:', error)
            // Clear invalid token
            state.token = null
            state.user = null
            delete api.defaults.headers.common['Authorization']
          }
        }
      },
    }
  )
)
