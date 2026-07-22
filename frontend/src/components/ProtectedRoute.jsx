import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { landingFor } from '../permissions'
import Loader from './Loader'

// Guards routes that require login. Optionally require admin (any admin role)
// or a specific permission. This is convenience/UX only — the server enforces
// the same rules on every API call.
export default function ProtectedRoute({ children, adminOnly = false, perm = null }) {
  const { user, loading, isAdmin, can } = useAuth()
  const location = useLocation()

  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  // Lacks the specific permission: send them somewhere they can go.
  if (perm && !can(perm)) return <Navigate to={landingFor(user)} replace />
  return children
}
