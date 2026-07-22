import { useEffect, useState } from 'react'
import { NavLink, Routes, Route, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import api from '../../api/client'
import ProductCard from '../../components/ProductCard'
import EmptyState from '../../components/EmptyState'
import { formatPrice, formatDate } from '../../utils/format'

function Overview() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  useEffect(() => { api.get('/orders/mine').then((r) => setOrders(r.data)).catch(() => {}) }, [])
  const spent = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  return (
    <div>
      <h2 style={{ marginBottom: 6 }}>Hi, {user.name.split(' ')[0]} 👋</h2>
      <p className="muted" style={{ marginBottom: 24 }}>Here's a quick look at your account.</p>
      <div className="stat-grid cols-3">
        <div className="stat card"><div className="label">Orders</div><div className="value">{orders.length}</div></div>
        <div className="stat card"><div className="label">Total spent</div><div className="value" style={{ fontSize: '1.4rem' }}>{formatPrice(spent)}</div></div>
        <div className="stat card"><div className="label">Member since</div><div className="value" style={{ fontSize: '1.1rem' }}>{formatDate(user.created_at)}</div></div>
      </div>
    </div>
  )
}

function Profile() {
  const { user, setUser } = useAuth()
  const { push } = useToast()
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', password: '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const save = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.put('/auth/profile', form)
      setUser(data); setForm({ ...form, password: '' }); push('Profile updated')
    } catch { push('Could not update profile', 'error') }
  }
  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ marginBottom: 20 }}>Profile</h2>
      <form className="card" style={{ padding: 24 }} onSubmit={save}>
        <div className="field"><label>Name</label><input className="input" value={form.name} onChange={set('name')} /></div>
        <div className="field"><label>Email</label><input className="input" value={user.email} disabled /></div>
        <div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
        <div className="field"><label>New password (leave blank to keep)</label><input className="input" type="password" value={form.password} onChange={set('password')} /></div>
        <button className="btn btn-primary" type="submit">Save changes</button>
      </form>
    </div>
  )
}

function Orders() {
  const [orders, setOrders] = useState(null)
  useEffect(() => { api.get('/orders/mine').then((r) => setOrders(r.data)).catch(() => setOrders([])) }, [])
  if (orders === null) return <p className="muted">Loading…</p>
  if (orders.length === 0) return <EmptyState emoji="📦" title="No orders yet" message="Your orders will appear here once you've shopped." />
  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>My orders</h2>
      {orders.map((o) => (
        <div key={o.id} className="card" style={{ padding: 20, marginBottom: 14 }}>
          <div className="spread" style={{ marginBottom: 10 }}>
            <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--sage-deep)' }}>{o.reference}</strong>
            <span className={`status-pill status-${o.status}`}>{o.status}</span>
          </div>
          <div className="spread muted" style={{ fontSize: '.88rem' }}>
            <span>{formatDate(o.created_at)} · {o.items?.length || 0} item(s)</span>
            <span className="price">{formatPrice(o.total)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function Wishlist() {
  const [items, setItems] = useState(null)
  useEffect(() => { api.get('/wishlist').then((r) => setItems(r.data)).catch(() => setItems([])) }, [])
  if (items === null) return <p className="muted">Loading…</p>
  if (items.length === 0) return <EmptyState emoji="♡" title="Your wishlist is empty" message="Tap the heart on any product to save it here." />
  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Wishlist</h2>
      <div className="products-grid">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
    </div>
  )
}

export default function Account() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const doLogout = () => { logout(); navigate('/') }
  return (
    <div className="container section" style={{ paddingTop: 32 }}>
      <div className="page-head" style={{ padding: 0, marginBottom: 24 }}><h1>My account</h1></div>
      <div className="account-layout">
        <aside className="side-nav card">
          <NavLink to="/account" end>🏠 Overview</NavLink>
          <NavLink to="/account/orders">📦 Orders</NavLink>
          <NavLink to="/account/wishlist">♡ Wishlist</NavLink>
          <NavLink to="/account/profile">👤 Profile</NavLink>
          <button onClick={doLogout} style={{ color: 'var(--danger)' }}>↪ Logout</button>
        </aside>
        <div>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="orders" element={<Orders />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
