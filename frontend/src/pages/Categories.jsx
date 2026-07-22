import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Loader from '../components/Loader'

export default function Categories() {
  const [cats, setCats] = useState(null)
  useEffect(() => { api.get('/categories').then((r) => setCats(r.data)).catch(() => setCats([])) }, [])
  if (cats === null) return <Loader />
  return (
    <div className="container section">
      <div className="page-head center" style={{ padding: '10px 0 30px' }}>
        <span className="eyebrow">Browse</span>
        <h1>Shop by category</h1>
      </div>
      <div className="cat-grid">
        {cats.map((c) => (
          <Link key={c.id} to={`/shop?category=${c.slug}`} className="cat-tile" style={{ aspectRatio: '4/3' }}>
            <img src={c.image} alt={c.name} loading="lazy" />
            <div className="overlay"><div><h3>{c.name}</h3><small>{c.product_count} items</small></div></div>
          </Link>
        ))}
      </div>
    </div>
  )
}
