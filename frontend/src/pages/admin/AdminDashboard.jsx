import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import api from '../../api/client'
import Loader from '../../components/Loader'
import { formatPrice, formatDate } from '../../utils/format'

const SAGE = '#8A9A6B'
const CLAY = '#B5855A'

export default function AdminDashboard() {
  const [dash, setDash] = useState(null)
  const [overview, setOverview] = useState(null)
  const [visitors, setVisitors] = useState([])
  const [sales, setSales] = useState([])

  useEffect(() => {
    api.get('/admin/dashboard').then((r) => setDash(r.data)).catch(() => {})
    api.get('/analytics/overview').then((r) => setOverview(r.data)).catch(() => {})
    api.get('/analytics/visitors-series', { params: { days: 14 } }).then((r) => setVisitors(r.data)).catch(() => {})
    api.get('/analytics/sales-series', { params: { days: 14 } }).then((r) => setSales(r.data)).catch(() => {})
  }, [])

  if (!dash || !overview) return <Loader />

  const stats = [
    { label: "Visitors today", value: overview.visitors_today },
    { label: "This week", value: overview.visitors_week },
    { label: "Orders today", value: overview.orders_today },
    { label: "Revenue today", value: formatPrice(overview.revenue_today), small: true },
    { label: "Total revenue", value: formatPrice(dash.total_revenue), small: true },
    { label: "Total orders", value: dash.total_orders },
    { label: "Customers", value: dash.total_customers },
    { label: "Low stock", value: overview.low_stock_items },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', marginBottom: 20 }}>Dashboard</h1>

      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat card">
            <div className="label">{s.label}</div>
            <div className="value" style={s.small ? { fontSize: '1.35rem' } : {}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="chart-row">
        <div className="chart-card card">
          <h3>Daily visitors (14 days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={visitors}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SAGE} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={SAGE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7DDC8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#7A745F" />
              <YAxis tick={{ fontSize: 11 }} stroke="#7A745F" />
              <Tooltip />
              <Area type="monotone" dataKey="visitors" stroke={SAGE} strokeWidth={2} fill="url(#gv)" />
              <Area type="monotone" dataKey="unique" stroke={CLAY} strokeWidth={2} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card card">
          <h3>Daily sales (14 days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7DDC8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#7A745F" />
              <YAxis tick={{ fontSize: 11 }} stroke="#7A745F" />
              <Tooltip formatter={(v, n) => n === 'revenue' ? formatPrice(v) : v} />
              <Bar dataKey="revenue" fill={SAGE} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card card">
          <h3>Latest orders</h3>
          <div className="table-wrap"><table className="data">
            <thead><tr><th>Ref</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {dash.latest_orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.reference}</td>
                  <td>{o.customer_name}</td>
                  <td>{formatPrice(o.total)}</td>
                  <td><span className={`status-pill status-${o.status}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>

        <div className="chart-card card">
          <h3>Top products</h3>
          <div className="table-wrap"><table className="data">
            <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {dash.top_products.map((p) => (
                <tr key={p.name}><td>{p.name}</td><td>{p.sold}</td><td>{formatPrice(p.revenue)}</td></tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>

      {dash.low_stock.length > 0 && (
        <div className="chart-card card">
          <h3>⚠️ Low stock alerts</h3>
          <div className="table-wrap"><table className="data">
            <thead><tr><th>Product</th><th>Stock left</th></tr></thead>
            <tbody>
              {dash.low_stock.map((p) => (
                <tr key={p.id}><td>{p.name}</td><td style={{ color: 'var(--danger)', fontWeight: 700 }}>{p.stock}</td></tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  )
}
