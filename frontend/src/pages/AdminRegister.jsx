import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { landingFor } from '../permissions'
import logo from '../assets/logo.jpeg'

// The deliberately-separate admin door. Requires an invite code (a shared
// secret the server checks). Without it, the API returns 403 and no account
// is created — public signup can never mint an admin.
export default function AdminRegister() {
  const { adminRegister } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'staff', invite_code: '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await adminRegister(form)
      push(`Admin account created — welcome, ${user.name.split(' ')[0]}!`)
      navigate(landingFor(user), { replace: true })
    } catch (err) {
      push(err.response?.data?.error || 'Could not create admin account', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="container section" style={{ maxWidth: 440 }}>
      <div className="card" style={{ padding: 34 }}>
        <div className="center" style={{ marginBottom: 20 }}>
          <img src={logo} alt="" style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 10px' }} />
          <h1 style={{ fontSize: '1.5rem' }}>Create an admin account</h1>
          <p className="muted" style={{ fontSize: '.9rem' }}>Invite code required</p>
        </div>
        <form onSubmit={submit}>
          <div className="field"><label>Full name</label>
            <input className="input" required value={form.name} onChange={set('name')} /></div>
          <div className="field"><label>Email</label>
            <input className="input" type="email" required value={form.email} onChange={set('email')} /></div>
          <div className="field"><label>Password</label>
            <input className="input" type="password" required minLength={6} value={form.password} onChange={set('password')} /></div>
          <div className="field"><label>Role</label>
            <select className="input" value={form.role} onChange={set('role')}>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="super_admin">Super admin</option>
            </select></div>
          <div className="field"><label>Invite code</label>
            <input className="input" required value={form.invite_code} onChange={set('invite_code')}
              placeholder="Provided by the store owner" /></div>
          <button className="btn btn-primary btn-block" disabled={loading} type="submit">
            {loading ? 'Creating…' : 'Create admin account'}
          </button>
        </form>
        <p className="center muted" style={{ marginTop: 16, fontSize: '.9rem' }}>
          Not an admin? <Link to="/register" style={{ color: 'var(--sage-deep)', fontWeight: 600 }}>Create a customer account</Link>
        </p>
      </div>
    </div>
  )
}
