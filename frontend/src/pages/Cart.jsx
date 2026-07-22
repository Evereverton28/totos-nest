import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import EmptyState from '../components/EmptyState'
import api from '../api/client'
import { formatPrice } from '../utils/format'

const DELIVERY_FEE = 350
const FREE_THRESHOLD = 5000

export default function Cart() {
  const { items, updateQty, removeItem, subtotal } = useCart()
  const { push } = useToast()
  const navigate = useNavigate()
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)

  const delivery = subtotal >= FREE_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE
  const total = Math.max(0, subtotal + delivery - discount)

  const applyCoupon = async () => {
    if (!coupon.trim()) return
    try {
      const { data } = await api.post('/coupons/validate', { code: coupon, subtotal })
      setDiscount(data.discount)
      push(`Coupon applied — you saved ${formatPrice(data.discount)}`)
    } catch (err) {
      setDiscount(0)
      push(err.response?.data?.error || 'Invalid coupon', 'error')
    }
  }

  if (items.length === 0) {
    return (
      <div className="container section">
        <EmptyState emoji="🛍" title="Your cart is empty"
          message="Looks like you haven’t added anything yet.">
          <Link to="/shop" className="btn btn-primary">Start shopping</Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="container section" style={{ paddingTop: 32 }}>
      <div className="page-head" style={{ padding: 0, marginBottom: 24 }}><h1>Your cart</h1></div>
      <div className="cart-layout">
        <div className="card" style={{ padding: 24 }}>
          {items.map((it) => (
            <div className="cart-line" key={`${it.product_id}-${it.size}`}>
              <img src={it.image} alt={it.name} />
              <div>
                <Link to={`/product/${it.slug}`} style={{ fontWeight: 600 }}>{it.name}</Link>
                {it.size && <div className="muted" style={{ fontSize: '.85rem' }}>Size: {it.size}</div>}
                <div className="price" style={{ marginTop: 4 }}>{formatPrice(it.price)}</div>
                <button className="muted" style={{ background: 'none', fontSize: '.82rem', textDecoration: 'underline', marginTop: 6 }}
                  onClick={() => removeItem(it.product_id, it.size)}>Remove</button>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="qty" style={{ marginBottom: 8 }}>
                  <button onClick={() => updateQty(it.product_id, it.size, it.quantity - 1)} aria-label="Decrease">−</button>
                  <span>{it.quantity}</span>
                  <button onClick={() => updateQty(it.product_id, it.size, it.quantity + 1)} aria-label="Increase">+</button>
                </div>
                <div className="price">{formatPrice(it.price * it.quantity)}</div>
              </div>
            </div>
          ))}
          <Link to="/shop" className="btn btn-ghost" style={{ marginTop: 20 }}>← Continue shopping</Link>
        </div>

        <div className="summary card">
          <h3 style={{ marginBottom: 18 }}>Order summary</h3>
          <div className="line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="line"><span>Delivery</span><span>{delivery === 0 ? 'Free' : formatPrice(delivery)}</span></div>
          {discount > 0 && <div className="line" style={{ color: 'var(--success)' }}><span>Discount</span><span>−{formatPrice(discount)}</span></div>}

          <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
            <input className="input" placeholder="Coupon code" value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
            <button className="btn btn-ghost" onClick={applyCoupon} style={{ padding: '10px 16px' }}>Apply</button>
          </div>

          <div className="line total"><span>Total</span><span>{formatPrice(total)}</span></div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }}
            onClick={() => navigate('/checkout')}>Proceed to checkout</button>
          {subtotal < FREE_THRESHOLD && (
            <p className="muted center" style={{ fontSize: '.82rem', marginTop: 10 }}>
              Add {formatPrice(FREE_THRESHOLD - subtotal)} more for free delivery
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
