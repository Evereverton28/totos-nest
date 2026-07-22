import { useEffect, useState } from 'react'
import api from '../../api/client'
import Loader from '../../components/Loader'
import { useToast } from '../../context/ToastContext'
import { formatPrice, formatDate } from '../../utils/format'

const STATUSES = ['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled']

export default function AdminOrders() {
  const { push } = useToast()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [expanded, setExpanded] = useState(null)

  const load = () => api.get('/admin/orders', { params: { status, q, per_page: 50 } })
    .then((r) => setData(r.data)).catch(() => setData({ orders: [] }))
  useEffect(() => { load() }, [status, q])

  const updateStatus = async (order, newStatus) => {
    try { await api.put(`/admin/orders/${order.id}/status`, { status: newStatus }); push('Status updated'); load() }
    catch { push('Could not update', 'error') }
  }

  if (!data) return <Loader />
  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', marginBottom: 20 }}>Orders</h1>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input className="input" placeholder="Search ref / name / email…" value={q}
          onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 300 }} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div className="table-wrap"><table className="data">
          <thead><tr><th>Ref</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data.orders.map((o) => (
              <>
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.reference}</td>
                  <td>{o.customer_name}<div className="muted" style={{ fontSize: '.8rem' }}>{o.email}</div></td>
                  <td>{formatDate(o.created_at)}</td>
                  <td>{formatPrice(o.total)}</td>
                  <td>
                    <select className="select" value={o.status} onChange={(e) => updateStatus(o, e.target.value)}
                      style={{ padding: '5px 8px', fontSize: '.82rem', width: 130 }}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><button className="btn btn-ghost" style={{ padding: '5px 12px' }}
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}>{expanded === o.id ? 'Hide' : 'View'}</button></td>
                </tr>
                {expanded === o.id && (
                  <tr><td colSpan="6" style={{ background: 'var(--cream-soft)' }}>
                    <div style={{ padding: '10px 4px' }}>
                      <strong>Ship to:</strong> {o.address}, {o.city}, {o.county} · {o.phone}
                      <div style={{ marginTop: 10 }}>
                        {o.items?.map((it, i) => (
                          <div key={i} className="spread" style={{ fontSize: '.88rem', padding: '4px 0' }}>
                            <span>{it.name} {it.size && `(${it.size})`} × {it.quantity}</span>
                            <span>{formatPrice(it.line_total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td></tr>
                )}
              </>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
