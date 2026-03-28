import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { loginRequest, logoutRequest } from '../api/auth'

interface AuthUser {
  email: string
  role: string
}

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Tokens stored in memory only — never persisted to localStorage
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password)
    // Expected response shape: { access_token, token_type, user: { email, role } }
    setToken(data.access_token)
    setUser(data.user ?? { email, role: data.role ?? 'admin' })
  }, [])

  const logout = useCallback(async () => {
    try {
      if (token) {
        await logoutRequest()
      }
    } catch {
      // Silently ignore logout errors — clear state regardless
    } finally {
      setToken(null)
      setUser(null)
    }
  }, [token])

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  return (
    <AuthContext.Provider value={{ token, user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
