import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/client'
import ProductCard from '../components/ProductCard'
import { GridSkeleton } from '../components/Skeleton'
import { SOCIALS } from '../social'

const FEATURES = [
  { ic: '🌿', title: 'Gentle on skin', text: 'Soft, breathable, skin-friendly fabrics chosen for little ones.' },
  { ic: '🚚', title: 'Nationwide delivery', text: 'Fast, tracked courier delivery across every county in Kenya.' },
  { ic: '💛', title: 'Made with care', text: 'Ethically sourced and thoughtfully finished, piece by piece.' },
  { ic: '↩️', title: 'Easy returns', text: '7-day hassle-free returns if it isn’t quite the right fit.' },
]

const TESTIMONIALS = [
  { text: 'The quality is beautiful and delivery to Nairobi was so quick. My little one practically lives in the bodysuits!', who: 'Amina W.', role: 'Nairobi' },
  { text: 'Gifted the coming-home set to my sister and she was in tears. Toto’s Nest is now my go-to for baby gifts.', who: 'Grace M.', role: 'Nakuru' },
  { text: 'Soft fabrics, gentle prices, and lovely packaging. It just feels like a brand that cares.', who: 'Joy K.', role: 'Mombasa' },
]

export default function Home() {
  const [featured, setFeatured] = useState(null)
  const [newArrivals, setNewArrivals] = useState(null)
  const [bestSellers, setBestSellers] = useState(null)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    api.get('/products/featured').then((r) => setFeatured(r.data)).catch(() => setFeatured([]))
    api.get('/products/new-arrivals').then((r) => setNewArrivals(r.data)).catch(() => setNewArrivals([]))
    api.get('/products/best-sellers').then((r) => setBestSellers(r.data)).catch(() => setBestSellers([]))
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="hero section-tint">
        <div className="container hero-inner">
          <motion.div className="hero-copy"
            initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <span className="eyebrow">Baby &amp; kids essentials</span>
            <h1>Softness for the <span className="accent">littlest</span> ones.</h1>
            <p>Thoughtfully made clothing, blankets and gifts — chosen for comfort,
               made to be loved, and delivered across Kenya.</p>
            <div className="hero-cta">
              <Link to="/shop" className="btn btn-primary">Shop the collection</Link>
              <Link to="/categories" className="btn btn-ghost">Browse categories</Link>
            </div>
          </motion.div>
          <motion.div className="hero-art"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <span className="hero-leaf" style={{ top: -10, right: 20 }}>🌿</span>
            <span className="hero-leaf" style={{ bottom: 40, left: -14 }}>🍃</span>
            <div className="frame">
              <img src="https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800" alt="Baby in soft clothing" />
            </div>
            <div className="hero-badge">
              <span className="dot">🌟</span>
              <div>
                <div style={{ fontSize: '.9rem' }}>Loved by</div>
                <div style={{ color: 'var(--sage-deep)' }}>2,000+ families</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---- Featured categories ---- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Shop by</span>
            <h2>Featured categories</h2>
            <p>Everything the nursery needs, sorted for easy browsing.</p>
          </div>
          <div className="cat-grid">
            {categories.slice(0, 6).map((c) => (
              <Link key={c.id} to={`/shop?category=${c.slug}`} className="cat-tile">
                <img src={c.image} alt={c.name} loading="lazy" />
                <div className="overlay">
                  <div>
                    <h3>{c.name}</h3>
                    <small>{c.product_count} items</small>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---- New arrivals ---- */}
      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Fresh in the nest</span>
            <h2>New arrivals</h2>
          </div>
          {newArrivals === null ? <GridSkeleton /> : (
            <div className="products-grid">
              {newArrivals.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
          <div className="center" style={{ marginTop: 34 }}>
            <Link to="/shop?sort=newest" className="btn btn-ghost">View all new arrivals</Link>
          </div>
        </div>
      </section>

      {/* ---- Best sellers ---- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Family favourites</span>
            <h2>Best sellers</h2>
          </div>
          {bestSellers === null ? <GridSkeleton /> : (
            <div className="products-grid">
              {bestSellers.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ---- Why choose ---- */}
      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">The Toto’s Nest promise</span>
            <h2>Why families choose us</h2>
          </div>
          <div className="features">
            {FEATURES.map((f) => (
              <motion.div key={f.title} className="feature card"
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.35 }}>
                <div className="ic">{f.ic}</div>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Testimonials ---- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kind words</span>
            <h2>Loved by parents</h2>
          </div>
          <div className="testi-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.who} className="testi card">
                <div className="rating">★★★★★</div>
                <p>“{t.text}”</p>
                <div className="who">{t.who} <span className="muted" style={{ fontWeight: 400 }}>· {t.role}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Instagram preview ---- */}
      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{SOCIALS.instagram.handle}</span>
            <h2>From our Instagram</h2>
          </div>
          <div className="ig-grid">
            {[
              '1522771930-78848d9293e8', '1518831959646-742c3a14ebf7',
              '1560769629-975ec94e6a86', '1584839404042-8d1e50e37e0e',
              '1596870230751-ebdfce98ec42', '1503919545889-aef636e10ad4',
            ].map((id) => (
              <a key={id} href={SOCIALS.instagram.url} target="_blank" rel="noopener noreferrer"
                 aria-label={`Toto's Nest on Instagram (${SOCIALS.instagram.handle})`}>
                <img src={`https://images.unsplash.com/photo-${id}?w=300`} alt="Instagram post" loading="lazy" />
              </a>
            ))}
          </div>
          <div className="center" style={{ marginTop: 24 }}>
            <a className="btn btn-primary" href={SOCIALS.instagram.url}
               target="_blank" rel="noopener noreferrer">
              Follow {SOCIALS.instagram.handle}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
