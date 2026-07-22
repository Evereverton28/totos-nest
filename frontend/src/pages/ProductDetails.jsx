import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import Rating from '../components/Rating'
import ProductCard from '../components/ProductCard'
import Loader from '../components/Loader'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { trackEvent } from '../hooks/useAnalytics'
import { formatPrice, formatDate } from '../utils/format'

export default function ProductDetails() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { push } = useToast()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [activeImg, setActiveImg] = useState(0)
  const [size, setSize] = useState(null)
  const [qty, setQty] = useState(1)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', author_name: '' })

  useEffect(() => {
    setProduct(null)
    api.get(`/products/${slug}`).then((r) => {
      setProduct(r.data)
      setSize(r.data.sizes?.[0] || null)
      setActiveImg(0); setQty(1)
    }).catch(() => setProduct(false))
    api.get(`/products/${slug}/related`).then((r) => setRelated(r.data)).catch(() => {})
  }, [slug])

  if (product === null) return <Loader />
  if (product === false) return <div className="container section center"><h2>Product not found</h2></div>

  const needsSize = product.sizes?.length > 0

  const add = () => {
    if (needsSize && !size) return push('Please choose a size', 'info')
    addItem(product, size, qty)
    trackEvent('add_to_cart', product.slug)
    push(`${product.name} added to cart`)
  }
  const buyNow = () => { add(); navigate('/cart') }

  const submitReview = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post(`/products/${slug}/reviews`, reviewForm)
      setProduct({ ...product, reviews: [data, ...product.reviews], review_count: product.review_count + 1 })
      setReviewForm({ rating: 5, comment: '', author_name: '' })
      push('Thanks for your review!')
    } catch { push('Could not submit review', 'error') }
  }

  return (
    <div className="container section" style={{ paddingTop: 32 }}>
      <div className="breadcrumb" style={{ marginBottom: 20 }}>
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / {product.name}
      </div>

      <div className="pdp">
        {/* Gallery */}
        <div className="pdp-gallery">
          <div className="main">
            <img src={product.images[activeImg] || product.image} alt={product.name} />
          </div>
          {product.images.length > 1 && (
            <div className="pdp-thumbs">
              {product.images.map((img, i) => (
                <button key={i} className={i === activeImg ? 'active' : ''} onClick={() => setActiveImg(i)}>
                  <img src={img} alt={`View ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="cat" style={{ color: 'var(--clay)', fontWeight: 700, fontSize: '.8rem', textTransform: 'uppercase' }}>{product.category}</span>
          <h1>{product.name}</h1>
          <Rating value={product.rating} count={product.review_count} />
          <div className="pdp-price price">
            {formatPrice(product.price)}
            {product.on_sale && <span className="price-old">{formatPrice(product.compare_at_price)}</span>}
          </div>
          <p className="muted">{product.description}</p>

          {needsSize && (
            <>
              <h5 style={{ marginTop: 22, marginBottom: 4 }}>Size</h5>
              <div className="size-opts">
                {product.sizes.map((s) => (
                  <button key={s} className={size === s ? 'active' : ''} onClick={() => setSize(s)}>{s}</button>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)} aria-label="Increase">+</button>
            </div>
            <span className={product.in_stock ? '' : 'muted'} style={{ fontWeight: 600, color: product.in_stock ? 'var(--success)' : 'var(--danger)' }}>
              {product.in_stock ? `In stock (${product.stock})` : 'Out of stock'}
            </span>
          </div>

          <div className="pdp-actions">
            <button className="btn btn-primary" onClick={add} disabled={!product.in_stock}>Add to cart</button>
            <button className="btn btn-clay" onClick={buyNow} disabled={!product.in_stock}>Buy now</button>
          </div>

          <div className="card" style={{ padding: 16, fontSize: '.9rem' }}>
            <div>🚚 Free delivery on orders over KES 5,000</div>
            <div style={{ marginTop: 6 }}>↩️ 7-day easy returns</div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section style={{ marginTop: 60 }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 20 }}>Customer reviews ({product.review_count})</h2>
        <div className="reviews-layout">
          <div>
            {product.reviews.length === 0 && <p className="muted">No reviews yet — be the first!</p>}
            {product.reviews.map((r) => (
              <div key={r.id} className="card" style={{ padding: 18, marginBottom: 14 }}>
                <div className="spread">
                  <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--sage-deep)' }}>{r.author}</strong>
                  <span className="muted" style={{ fontSize: '.82rem' }}>{formatDate(r.created_at)}</span>
                </div>
                <Rating value={r.rating} />
                <p style={{ marginTop: 8 }}>{r.comment}</p>
              </div>
            ))}
          </div>
          <form className="card" style={{ padding: 22 }} onSubmit={submitReview}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 14 }}>Write a review</h3>
            <div className="field">
              <label>Your rating</label>
              <select className="select" value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Your name</label>
              <input className="input" value={reviewForm.author_name}
                onChange={(e) => setReviewForm({ ...reviewForm, author_name: e.target.value })} placeholder="e.g. Amina W." />
            </div>
            <div className="field">
              <label>Your review</label>
              <textarea className="input" rows="3" required value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="What did you love?" />
            </div>
            <button className="btn btn-primary btn-block" type="submit">Submit review</button>
          </form>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 20 }}>You may also like</h2>
          <div className="products-grid">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
