import { useEffect, useState } from 'react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ROLE_LABELS } from '../../permissions'

const BLANK = { name: '', email: '', phone: '', password: '', role: '' }

/**
 * Team management. The server decides what this admin may do; the UI simply
 * reflects it — `creatable_roles` comes back from the API, so a manager only
 * ever sees "Staff" in the role picker and only staff accounts in the list.
 * Customers never appear here: they self-register on the public Sign Up page.
 */
export default function AdminTeam() {
  const { user } = useAuth()
  const { push } = useToast()
  const [members, setMembers] = useState([])
  const [creatable, setCreatable] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)   // account being edited, or null
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get('/admin/team')
      setMembers(data.members)
      setCreatable(data.creatable_roles)
    } catch {
      push('Could not load the team', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const openCreate = () => {
    setEditing(null)
    setForm({ ...BLANK, role: creatable[0] || '' })
    setShowForm(true)
  }

  const openEdit = (m) => {
    setEditing(m)
    setForm({ name: m.name, email: m.email, phone: m.phone || '', password: '', role: m.role })
    setShowForm(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const payload = { ...form }
        if (!payload.password) delete payload.password  // don't reset unless typed
        await api.put(`/admin/team/${editing.id}`, payload)
        push('Account updated')
      } else {
        await api.post('/admin/team', form)
        push('Account created')
      }
      setShowForm(false)
      load()
    } catch (err) {
      push(err.response?.data?.error || 'Could not save the account', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (m) => {
    try {
      await api.put(`/admin/team/${m.id}/active`, { is_active: !m.is_active })
      push(m.is_active ? `${m.name} deactivated` : `${m.name} reactivated`)
      load()
    } catch (err) {
      push(err.response?.data?.error || 'Could not update the account', 'error')
    }
  }

  const remove = async (m) => {
    if (!window.confirm(`Permanently delete ${m.name}'s account? This can't be undone.`)) return
    try {
      await api.delete(`/admin/team/${m.id}`)
      push(`${m.name}'s account deleted`)
      load()
    } catch (err) {
      push(err.response?.data?.error || 'Could not delete the account', 'error')
    }
  }

  const canCreate = creatable.length > 0

  return (
    <div>
      <div className="spread" style={{ marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>Team</h1>
          <p className="muted" style={{ fontSize: '.9rem' }}>
            {user?.role === 'super_admin'
              ? 'Create and manage Manager and Staff accounts.'
              : 'Create and manage Staff accounts.'}
          </p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={openCreate}>+ Add account</button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 22 }}>
          <h3 style={{ marginBottom: 16 }}>
            {editing ? `Edit ${editing.name}` : 'New account'}
          </h3>
          <form onSubmit={save}>
            <div className="form-row">
              <div className="field"><label>Full name</label>
                <input className="input" required value={form.name} onChange={set('name')} /></div>
              <div className="field"><label>Email</label>
                <input className="input" type="email" required value={form.email} onChange={set('email')} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Phone (optional)</label>
                <input className="input" value={form.phone} onChange={set('phone')} /></div>
              <div className="field"><label>Role</label>
                <select className="input" value={form.role} onChange={set('role')} required>
                  {creatable.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                  ))}
                </select></div>
            </div>
            <div className="field">
              <label>{editing ? 'New password (leave blank to keep current)' : 'Password'}</label>
              <input className="input" type="password" minLength={6}
                     required={!editing} value={form.password} onChange={set('password')} />
            </div>
            <div className="flex" style={{ gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : members.length === 0 ? (
          <p className="muted">No accounts yet. {canCreate && 'Use “Add account” to create one.'}</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} style={{ opacity: m.is_active ? 1 : 0.55 }}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td><span className="role-badge">{ROLE_LABELS[m.role] || m.role}</span></td>
                    <td>
                      <span className={`status-pill ${m.is_active ? 'status-delivered' : 'status-cancelled'}`}>
                        {m.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '.82rem' }}
                                onClick={() => openEdit(m)}>Edit</button>
                        <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '.82rem' }}
                                onClick={() => toggleActive(m)}>
                          {m.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '.82rem', color: 'var(--danger)' }}
                                onClick={() => remove(m)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
