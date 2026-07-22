import { useEffect, useState } from 'react'
import api from '../../api/client'
import Loader from '../../components/Loader'
import { formatPrice, formatDate } from '../../utils/format'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState(null)
  const [q, setQ] = useState('')
  useEffect(() => {
    api.get('/admin/customers', { params: { q } }).then((r) => setCustomers(r.data)).catch(() => setCustomers([]))
  }, [q])
  if (!customers) return <Loader />
  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', marginBottom: 20 }}>Customers</h1>
      <input className="input" placeholder="Search customers…" value={q}
        onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320, marginBottom: 18 }} />
      <div className="card" style={{ padding: 20 }}>
        <div className="table-wrap"><table className="data">
          <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Total spent</th><th>Joined</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.order_count}</td>
                <td>{formatPrice(c.total_spent)}</td>
                <td>{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}
