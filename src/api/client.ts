import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Store a reference to the current token so interceptors can read it.
// Updated by setAuthToken() below — called from AuthContext when token changes.
let _token: string | null = null

export function setAuthToken(token: string | null) {
  _token = token
}

// Request interceptor: attach Bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    if (_token) {
      config.headers.Authorization = `Bearer ${_token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor: convert 401 into a user-friendly error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored token and let the ProtectedRoute redirect handle navigation.
      // We can't call the AuthContext logout here (circular dep), so just clear.
      setAuthToken(null)
      // Dispatch a custom event so AuthContext can react if needed
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export default apiClient
