import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Restore token from localStorage on initialization
try {
  const authStorage = localStorage.getItem('auth-storage')
  if (authStorage) {
    const authData = JSON.parse(authStorage)
    if (authData?.state?.token) {
      api.defaults.headers.common['Authorization'] = `Token ${authData.state.token}`
    }
  }
} catch (e) {
  console.error('Failed to restore auth token:', e)
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
