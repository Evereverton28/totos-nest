import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div className="container section center" style={{ padding: '100px 0' }}>
      <div style={{ fontSize: '4rem' }}>🪺</div>
      <h1 style={{ fontSize: '3rem', marginTop: 10 }}>404</h1>
      <p className="muted" style={{ marginBottom: 24 }}>This little nest is empty — the page you're looking for flew away.</p>
      <Link to="/" className="btn btn-primary">Back home</Link>
    </div>
  )
}
