import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      loading: false,
      error: null,

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
          const errorMessage = error.response?.data?.detail || 'Login failed'
          set({ error: errorMessage, loading: false })
          throw new Error(errorMessage)
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
        set({ token: null, user: null })
        delete api.defaults.headers.common['Authorization']
        localStorage.removeItem('auth-storage')
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
