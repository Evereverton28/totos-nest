import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Rating from './Rating'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { trackEvent } from '../hooks/useAnalytics'
import api from '../api/client'
import { formatPrice } from '../utils/format'

// A single product tile used across Home, Shop, Related, etc.
export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const { push } = useToast()
  const { user } = useAuth()

  const quickAdd = (e) => {
    e.preventDefault()
    // Products with sizes should be configured on the detail page.
    const firstSize = product.sizes?.length ? product.sizes[0] : null
    addItem(product, firstSize, 1)
    trackEvent('add_to_cart', product.slug)
    push(`${product.name} added to cart`)
  }

  const toggleWish = async (e) => {
    e.preventDefault()
    if (!user) return push('Log in to save favourites', 'info')
    try {
      const { data } = await api.post(`/wishlist/${product.id}`)
      push(data.in_wishlist ? 'Saved to wishlist' : 'Removed from wishlist')
    } catch { push('Could not update wishlist', 'error') }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
    >
      <Link to={`/product/${product.slug}`} className="product-card" style={{ display: 'block' }}>
        <div className="media">
          <img src={product.image} alt={product.name} loading="lazy" />
          <div className="badges">
            {product.on_sale && <span className="badge badge-sale">Sale</span>}
            {!product.in_stock && <span className="badge badge-out">Sold out</span>}
          </div>
          <button className="wish" onClick={toggleWish} aria-label="Save to wishlist">♡</button>
        </div>
        <div className="body">
          <span className="cat">{product.category}</span>
          <h3>{product.name}</h3>
          <Rating value={product.rating} count={product.review_count} />
          <div className="row" style={{ marginTop: 10 }}>
            <span className="price">
              {formatPrice(product.price)}
              {product.on_sale && <span className="price-old">{formatPrice(product.compare_at_price)}</span>}
            </span>
            <button className="add" onClick={quickAdd} disabled={!product.in_stock}>
              Add
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
