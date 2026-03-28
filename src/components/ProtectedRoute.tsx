import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { setAuthToken } from '../api/client'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, logout } = useAuth()
  const location = useLocation()

  // Keep the axios client's token in sync with the context token
  useEffect(() => {
    setAuthToken(token)
  }, [token])

  // Listen for 401 events fired by the axios response interceptor
  useEffect(() => {
    function handleUnauthorized() {
      logout()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [logout])

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
