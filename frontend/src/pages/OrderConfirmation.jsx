import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import Loader from '../components/Loader'
import { formatPrice } from '../utils/format'

export default function OrderConfirmation() {
  const { reference } = useParams()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    api.get(`/orders/${reference}`).then((r) => setOrder(r.data)).catch(() => setOrder(false))
  }, [reference])

  if (order === null) return <Loader />
  if (order === false) return <div className="container section center"><h2>Order not found</h2></div>

  return (
    <div className="container section" style={{ maxWidth: 640 }}>
      <div className="card center" style={{ padding: 40 }}>
        <div style={{ fontSize: '3.5rem' }}>🎉</div>
        <h1 style={{ marginTop: 10 }}>Thank you!</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Your order <strong style={{ color: 'var(--sage-deep)' }}>{order.reference}</strong> has been placed.
          We'll send a confirmation to {order.email}.
        </p>
        <div style={{ textAlign: 'left', marginTop: 26, borderTop: '1px solid var(--line)', paddingTop: 20 }}>
          {order.items?.map((it, i) => (
            <div className="line" key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span>{it.name} {it.size && `(${it.size})`} × {it.quantity}</span>
              <span>{formatPrice(it.line_total)}</span>
            </div>
          ))}
          <div className="spread" style={{ marginTop: 10 }}><span className="muted">Delivery</span><span>{order.delivery_fee === 0 ? 'Free' : formatPrice(order.delivery_fee)}</span></div>
          <div className="spread total" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--sage-deep)', marginTop: 8 }}>
            <span>Total</span><span>{formatPrice(order.total)}</span>
          </div>
          <div className="spread" style={{ marginTop: 12 }}>
            <span className="muted">Status</span>
            <span className={`status-pill status-${order.status}`}>{order.status}</span>
          </div>
        </div>
        <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/shop" className="btn btn-primary">Continue shopping</Link>
          <Link to="/account/orders" className="btn btn-ghost">View my orders</Link>
        </div>
      </div>
    </div>
  )
}
