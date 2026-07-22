import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { landingFor } from '../permissions'
import logo from '../assets/logo.jpeg'

export default function Login() {
  const { login } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      push(`Welcome back, ${user.name.split(' ')[0]}!`)
      // Role decides the destination; customers stay on the storefront.
      navigate(landingFor(user, location.state?.from || '/account'), { replace: true })
    } catch (err) {
      push(err.response?.data?.error || 'Login failed', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 420 }}>
      <div className="card" style={{ padding: 34 }}>
        <div className="center" style={{ marginBottom: 20 }}>
          <img src={logo} alt="" style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 10px' }} />
          <h1 style={{ fontSize: '1.5rem' }}>Welcome back</h1>
          <p className="muted" style={{ fontSize: '.9rem' }}>Log in to your Toto's Nest account</p>
        </div>
        <form onSubmit={submit}>
          <div className="field"><label>Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field"><label>Password</label><input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <button className="btn btn-primary btn-block" disabled={loading} type="submit">{loading ? 'Logging in…' : 'Log in'}</button>
        </form>
        <p className="center muted" style={{ marginTop: 16, fontSize: '.9rem' }}>
          New here? <Link to="/register" style={{ color: 'var(--sage-deep)', fontWeight: 600 }}>Create an account</Link>
        </p>
        <p className="center muted" style={{ marginTop: 12, fontSize: '.8rem', background: 'var(--sage-tint)', padding: 10, borderRadius: 8 }}>
          Demo admin: admin@totosnest.co.ke / admin123
        </p>
      </div>
    </div>
  )
}
