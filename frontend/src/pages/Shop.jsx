import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import ProductCard from '../components/ProductCard'
import { GridSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

const GENDERS = [['', 'All'], ['girl', 'Girl'], ['boy', 'Boy'], ['unisex', 'Unisex']]
const AGES = [['', 'All ages'], ['newborn', 'Newborn'], ['0-2y', '0–2 yrs'], ['3-5y', '3–5 yrs'], ['6-8y', '6–8 yrs']]
const SORTS = [['newest', 'Newest'], ['price_asc', 'Price: Low to High'], ['price_desc', 'Price: High to Low'], ['popular', 'Most popular']]

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState(null)
  const [meta, setMeta] = useState({})
  const [categories, setCategories] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Read current filter values straight from the URL (shareable/bookmarkable).
  const get = (k, d = '') => params.get(k) || d
  const setParam = useCallback((key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    next.delete('page')
    setParams(next)
  }, [params, setParams])

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setProducts(null)
    api.get('/products', { params: Object.fromEntries(params) })
      .then((r) => { setProducts(r.data.products); setMeta(r.data.meta) })
      .catch(() => setProducts([]))
  }, [params])

  return (
    <div className="container">
      <div className="page-head">
        <div className="breadcrumb"><a href="/">Home</a> / Shop</div>
        <h1>Shop all</h1>
      </div>

      <button className="btn btn-ghost filters-toggle" style={{ marginBottom: 16 }}
        onClick={() => setFiltersOpen(!filtersOpen)}>
        {filtersOpen ? 'Hide' : 'Show'} filters
      </button>

      <div className="shop-layout">
        {/* ---- Filters sidebar ---- */}
        <aside className={`filters card ${filtersOpen ? 'open' : ''}`}>
          <div className="filter-group">
            <h5>Category</h5>
            <label>
              <input type="radio" name="cat" checked={!get('category')}
                     onChange={() => setParam('category', '')} /> All
            </label>
            {categories.map((c) => (
              <label key={c.id}>
                <input type="radio" name="cat" checked={get('category') === c.slug}
                       onChange={() => setParam('category', c.slug)} /> {c.name}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h5>Gender</h5>
            {GENDERS.map(([v, l]) => (
              <label key={v}>
                <input type="radio" name="gender" checked={get('gender') === v}
                       onChange={() => setParam('gender', v)} /> {l}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h5>Age</h5>
            {AGES.map(([v, l]) => (
              <label key={v}>
                <input type="radio" name="age" checked={get('age') === v}
                       onChange={() => setParam('age', v)} /> {l}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h5>Max price (KES)</h5>
            <input type="range" min="500" max="4000" step="100"
                   value={get('max_price', '4000')}
                   onChange={(e) => setParam('max_price', e.target.value)}
                   style={{ width: '100%' }} />
            <div className="muted" style={{ fontSize: '.85rem' }}>Up to KES {Number(get('max_price', 4000)).toLocaleString()}</div>
          </div>

          <div className="filter-group">
            <label>
              <input type="checkbox" checked={get('availability') === 'in_stock'}
                     onChange={(e) => setParam('availability', e.target.checked ? 'in_stock' : '')} />
              In stock only
            </label>
          </div>

          <button className="btn btn-ghost btn-block" onClick={() => setParams(new URLSearchParams())}>
            Clear filters
          </button>
        </aside>

        {/* ---- Results ---- */}
        <div>
          <div className="shop-toolbar">
            <span className="muted">
              {products === null ? 'Loading…' : `${meta.total || 0} products`}
              {get('q') && <> for “{get('q')}”</>}
            </span>
            <select className="select" style={{ width: 220 }}
                    value={get('sort', 'newest')} onChange={(e) => setParam('sort', e.target.value)}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {products === null ? <GridSkeleton /> :
           products.length === 0 ? (
             <EmptyState emoji="🔍" title="No products found"
               message="Try adjusting your filters or search term." />
           ) : (
            <>
              <div className="products-grid">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {meta.pages > 1 && (
                <div className="center" style={{ marginTop: 34, display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {Array.from({ length: meta.pages }).map((_, i) => (
                    <button key={i}
                      className={`btn ${meta.page === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ padding: '8px 16px' }}
                      onClick={() => setParam('page', String(i + 1))}>{i + 1}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
