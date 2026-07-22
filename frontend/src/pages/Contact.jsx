import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import SocialLinks from '../components/SocialLinks'
import { CONTACT } from '../site'

export default function Contact() {
  const { push } = useToast()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const submit = (e) => {
    e.preventDefault()
    // Wire this to a /api/contact endpoint or email service when ready.
    push('Thanks! We\'ll get back to you shortly 💛')
    setForm({ name: '', email: '', message: '' })
  }
  return (
    <div className="container section">
      <div className="page-head center" style={{ padding: '10px 0 30px' }}>
        <span className="eyebrow">Say hello</span>
        <h1>Get in touch</h1>
      </div>
      <div className="contact-grid">
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h4 style={{ color: 'var(--ink)' }}>📍 Location</h4>
            <p className="muted">{CONTACT.location}</p>
          </div>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h4 style={{ color: 'var(--ink)' }}>✉️ Email</h4>
            <a className="muted" href={`mailto:${CONTACT.email}`} style={{ color: 'var(--sage-deep)', fontWeight: 600 }}>{CONTACT.email}</a>
          </div>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h4 style={{ color: 'var(--ink)' }}>📞 Phone / WhatsApp</h4>
            <p className="muted">{CONTACT.phone}</p>
          </div>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <h4 style={{ color: 'var(--ink)' }}>💛 Follow us</h4>
            <SocialLinks variant="labelled" />
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden', height: 180, background: 'var(--sage-tint)', display: 'grid', placeItems: 'center' }}>
            <span className="muted">🗺 Google Map placeholder</span>
          </div>
        </div>
        <form className="card" style={{ padding: 26 }} onSubmit={submit}>
          <div className="field"><label>Name</label><input className="input" required value={form.name} onChange={set('name')} /></div>
          <div className="field"><label>Email</label><input className="input" type="email" required value={form.email} onChange={set('email')} /></div>
          <div className="field"><label>Message</label><textarea className="input" rows="5" required value={form.message} onChange={set('message')} /></div>
          <button className="btn btn-primary btn-block" type="submit">Send message</button>
        </form>
      </div>
    </div>
  )
}
