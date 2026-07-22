import { NavLink, Outlet, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../../components/ThemeToggle'
import { landingFor } from '../../permissions'
import logo from '../../assets/logo.jpeg'

// Each section is tied to the permission that unlocks it, so the sidebar only
// shows what the signed-in role can actually open.
const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true, perm: 'dashboard' },
  { to: '/admin/products', label: 'Products', icon: '🧸', perm: 'products:read' },
  { to: '/admin/orders', label: 'Orders', icon: '📦', perm: 'orders' },
  { to: '/admin/customers', label: 'Customers', icon: '👥', perm: 'customers' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈', perm: 'analytics' },
]

const ROLE_LABEL = { super_admin: 'Super admin', manager: 'Manager', staff: 'Staff' }

export default function AdminLayout() {
  const { user, logout, can } = useAuth()
  const location = useLocation()

  // If a role can't view the dashboard, /admin index sends them to their landing.
  if (location.pathname === '/admin' && !can('dashboard')) {
    return <Navigate to={landingFor(user)} replace />
  }

  const links = NAV.filter((n) => can(n.perm))

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="brand">
          <img src={logo} alt="" style={{ width: 30, height: 30, borderRadius: '50%' }} /> Toto's Nest
        </div>
        {links.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>{n.icon} {n.label}</NavLink>
        ))}
        <Link to="/" style={{ color: 'rgba(255,255,255,.7)', display: 'block', padding: '11px 14px', marginTop: 10 }}>← View store</Link>
      </aside>
      <main className="admin-main">
        <div className="spread" style={{ marginBottom: 24 }}>
          <div className="muted">
            Signed in as <strong style={{ color: 'var(--ink)' }}>{user?.name}</strong>
            <span className="role-badge">{ROLE_LABEL[user?.role] || user?.role}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle />
            <button className="btn btn-ghost" style={{ padding: '8px 16px' }} onClick={logout}>Logout</button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
