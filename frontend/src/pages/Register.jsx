import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import logo from '../assets/logo.jpeg'

export default function Register() {
  const { register } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await register(form)
      push(`Welcome to the nest, ${user.name.split(' ')[0]}!`)
      navigate('/account')
    } catch (err) {
      push(err.response?.data?.error || 'Registration failed', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 420 }}>
      <div className="card" style={{ padding: 34 }}>
        <div className="center" style={{ marginBottom: 20 }}>
          <img src={logo} alt="" style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 10px' }} />
          <h1 style={{ fontSize: '1.5rem' }}>Create your account</h1>
          <p className="muted" style={{ fontSize: '.9rem' }}>Join the Toto's Nest family</p>
        </div>
        <form onSubmit={submit}>
          <div className="field"><label>Full name</label><input className="input" required value={form.name} onChange={set('name')} /></div>
          <div className="field"><label>Email</label><input className="input" type="email" required value={form.email} onChange={set('email')} /></div>
          <div className="field"><label>Phone (optional)</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
          <div className="field"><label>Password</label><input className="input" type="password" required minLength="6" value={form.password} onChange={set('password')} /></div>
          <button className="btn btn-primary btn-block" disabled={loading} type="submit">{loading ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="center muted" style={{ marginTop: 16, fontSize: '.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--sage-deep)', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
