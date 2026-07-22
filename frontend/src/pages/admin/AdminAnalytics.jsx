import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import api from '../../api/client'
import Loader from '../../components/Loader'

const COLORS = ['#8A9A6B', '#B5855A', '#C9D0B4', '#8B6849', '#EDF0E3']

export default function AdminAnalytics() {
  const [funnel, setFunnel] = useState(null)
  const [visitors, setVisitors] = useState([])
  const [top, setTop] = useState(null)

  useEffect(() => {
    api.get('/analytics/funnel').then((r) => setFunnel(r.data)).catch(() => {})
    api.get('/analytics/visitors-series', { params: { days: 30 } }).then((r) => setVisitors(r.data)).catch(() => {})
    api.get('/analytics/top').then((r) => setTop(r.data)).catch(() => {})
  }, [])

  if (!funnel || !top) return <Loader />

  const funnelSteps = [
    { label: 'Sessions', value: funnel.sessions },
    { label: 'Added to cart', value: funnel.add_to_cart },
    { label: 'Checkout started', value: funnel.checkout_started },
    { label: 'Purchases', value: funnel.purchases },
  ]
  const max = Math.max(...funnelSteps.map((s) => s.value), 1)

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', marginBottom: 20 }}>Analytics</h1>

      <div className="stat-grid">
        <div className="stat card"><div className="label">Sessions (30d)</div><div className="value">{funnel.sessions}</div></div>
        <div className="stat card"><div className="label">Add to cart</div><div className="value">{funnel.add_to_cart}</div></div>
        <div className="stat card"><div className="label">Purchases</div><div className="value">{funnel.purchases}</div></div>
        <div className="stat card"><div className="label">Conversion rate</div><div className="value">{funnel.conversion_rate}%</div></div>
      </div>

      <div className="chart-row">
        <div className="chart-card card">
          <h3>Visitors trend (30 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={visitors}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7DDC8" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#7A745F" interval={4} />
              <YAxis tick={{ fontSize: 11 }} stroke="#7A745F" />
              <Tooltip /><Legend />
              <Line type="monotone" dataKey="visitors" stroke="#8A9A6B" strokeWidth={2} dot={false} name="Pageviews" />
              <Line type="monotone" dataKey="unique" stroke="#B5855A" strokeWidth={2} dot={false} name="Unique" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card card">
          <h3>Conversion funnel</h3>
          <div style={{ padding: '10px 0' }}>
            {funnelSteps.map((s, i) => (
              <div key={s.label} style={{ marginBottom: 16 }}>
                <div className="spread" style={{ fontSize: '.88rem', marginBottom: 4 }}>
                  <span>{s.label}</span><strong>{s.value.toLocaleString()}</strong>
                </div>
                <div style={{ height: 14, background: 'var(--cream-deep)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${(s.value / max) * 100}%`, height: '100%', background: COLORS[i], borderRadius: 8, transition: 'width .5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card card">
          <h3>Devices</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={top.devices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {top.devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card card">
          <h3>Traffic sources</h3>
          <div className="table-wrap"><table className="data">
            <thead><tr><th>Source</th><th>Visits</th></tr></thead>
            <tbody>
              {top.sources.map((s) => (
                <tr key={s.name}><td style={{ wordBreak: 'break-all' }}>{s.name}</td><td>{s.value}</td></tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card card">
          <h3>Most viewed products</h3>
          <div className="table-wrap"><table className="data">
            <thead><tr><th>Product</th><th>Views</th><th>Sold</th></tr></thead>
            <tbody>
              {top.top_products.map((p) => (
                <tr key={p.name}><td>{p.name}</td><td>{p.views}</td><td>{p.sold}</td></tr>
              ))}
            </tbody>
          </table></div>
        </div>
        <div className="chart-card card">
          <h3>Most visited pages</h3>
          <div className="table-wrap"><table className="data">
            <thead><tr><th>Page</th><th>Views</th></tr></thead>
            <tbody>
              {top.top_pages.map((p) => (
                <tr key={p.path}><td>{p.path}</td><td>{p.views}</td></tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  )
}
