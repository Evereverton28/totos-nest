import { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { trackEvent } from '../hooks/useAnalytics'
import api from '../api/client'
import { formatPrice } from '../utils/format'

const DELIVERY_FEE = 350
const FREE_THRESHOLD = 5000

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    customer_name: '', email: '', phone: '',
    address: '', city: '', county: 'Nairobi',
    payment_method: 'mpesa',
  })

  useEffect(() => {
    trackEvent('checkout_started')
    if (user) setForm((f) => ({ ...f, customer_name: user.name, email: user.email, phone: user.phone || '' }))
  }, [user])

  if (items.length === 0) return <Navigate to="/cart" replace />

  const delivery = subtotal >= FREE_THRESHOLD ? 0 : DELIVERY_FEE
  const total = subtotal + delivery
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const placeOrder = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await api.post('/orders', {
        ...form,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, size: i.size })),
      })
      trackEvent('purchase', data.reference)
      clearCart()
      navigate(`/order/${data.reference}`)
    } catch (err) {
      push(err.response?.data?.error || 'Could not place order', 'error')
      setSubmitting(false)
    }
  }

  return (
    <div className="container section" style={{ paddingTop: 32 }}>
      <div className="page-head" style={{ padding: 0, marginBottom: 24 }}><h1>Checkout</h1></div>
      <form className="checkout-layout" onSubmit={placeOrder}>
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16 }}>Customer details</h3>
            <div className="field"><label>Full name</label>
              <input className="input" required value={form.customer_name} onChange={set('customer_name')} /></div>
            <div className="form-row">
              <div className="field"><label>Email</label>
                <input className="input" type="email" required value={form.email} onChange={set('email')} /></div>
              <div className="field"><label>Phone (M-Pesa)</label>
                <input className="input" required value={form.phone} onChange={set('phone')} placeholder="07XX XXX XXX" /></div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16 }}>Shipping address</h3>
            <div className="field"><label>Address / estate / building</label>
              <input className="input" required value={form.address} onChange={set('address')} /></div>
            <div className="form-row">
              <div className="field"><label>Town / city</label>
                <input className="input" required value={form.city} onChange={set('city')} /></div>
              <div className="field"><label>County</label>
                <input className="input" required value={form.county} onChange={set('county')} /></div>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Payment method</h3>
            {[['mpesa', 'M-Pesa', '📱'], ['card', 'Card (Visa / Mastercard)', '💳'], ['cod', 'Pay on delivery', '💵']].map(([v, l, ic]) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1.5px solid var(--line)', borderRadius: 'var(--r-sm)', marginBottom: 8, cursor: 'pointer', background: form.payment_method === v ? 'var(--sage-tint)' : 'var(--surface)' }}>
                <input type="radio" name="pay" checked={form.payment_method === v} onChange={() => setForm({ ...form, payment_method: v })} />
                <span>{ic} {l}</span>
              </label>
            ))}
            <p className="muted" style={{ fontSize: '.82rem', marginTop: 8 }}>
              Payment is simulated in this build — orders are created as “pending”.
              M-Pesa / card integration plugs in at the marked backend point.
            </p>
          </div>
        </div>

        <div className="summary card">
          <h3 style={{ marginBottom: 18 }}>Your order</h3>
          {items.map((it) => (
            <div className="line" key={`${it.product_id}-${it.size}`}>
              <span>{it.name} {it.size && `(${it.size})`} × {it.quantity}</span>
              <span>{formatPrice(it.price * it.quantity)}</span>
            </div>
          ))}
          <div className="line" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="line"><span>Delivery</span><span>{delivery === 0 ? 'Free' : formatPrice(delivery)}</span></div>
          <div className="line total"><span>Total</span><span>{formatPrice(total)}</span></div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={submitting} type="submit">
            {submitting ? 'Placing order…' : `Place order · ${formatPrice(total)}`}
          </button>
        </div>
      </form>
    </div>
  )
}
