import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'
import { can as canDo, isAdminRole } from '../permissions'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from a stored token on first load.
  useEffect(() => {
    const token = localStorage.getItem('tn_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('tn_token'))
      .finally(() => setLoading(false))
  }, [])

  const persist = (token, user) => {
    localStorage.setItem('tn_token', token)
    setUser(user)
  }

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    persist(data.token, data.user)
    return data.user
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    persist(data.token, data.user)
    return data.user
  }

  // Admin signup goes through a separate, invite-gated endpoint.
  const adminRegister = async (payload) => {
    const { data } = await api.post('/auth/admin-register', payload)
    persist(data.token, data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('tn_token')
    setUser(null)
  }

  const value = {
    user, loading, login, register, adminRegister, logout, setUser,
    role: user?.role || null,
    isAdmin: isAdminRole(user?.role),
    can: (permission) => canDo(user, permission),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
