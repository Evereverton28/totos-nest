import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'
import api from '../api/client'
import { formatPrice } from '../utils/format'
import logo from '../assets/logo.jpeg'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/categories', label: 'Categories' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { count } = useCart()
  const { user, isAdmin } = useAuth()
  const [term, setTerm] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const boxRef = useRef()

  // Debounced live search suggestions.
  useEffect(() => {
    if (term.trim().length < 2) { setSuggestions([]); return }
    const t = setTimeout(() => {
      api.get('/products/suggest', { params: { q: term } })
        .then((r) => setSuggestions(r.data)).catch(() => {})
    }, 220)
    return () => clearTimeout(t)
  }, [term])

  // Close suggestions on outside click.
  useEffect(() => {
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setSuggestions([]) }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const submitSearch = (e) => {
    e.preventDefault()
    if (term.trim()) { navigate(`/shop?q=${encodeURIComponent(term)}`); setSuggestions([]) }
  }

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">
          <img src={logo} alt="Toto's Nest" />
          <span>toto's nest</span>
        </Link>

        <nav className="nav-links">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <div className="nav-search" ref={boxRef}>
            <form onSubmit={submitSearch}>
              <input value={term} onChange={(e) => setTerm(e.target.value)}
                     placeholder="Search products…" aria-label="Search" />
            </form>
            {suggestions.length > 0 && (
              <div className="suggest">
                {suggestions.map((s) => (
                  <Link key={s.id} to={`/product/${s.slug}`} onClick={() => { setTerm(''); setSuggestions([]) }}>
                    <img src={s.image} alt="" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{s.name}</div>
                      <div className="price" style={{ fontSize: '.85rem' }}>{formatPrice(s.price)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <ThemeToggle />
          <Link to={user ? '/account' : '/login'} className="icon-btn" aria-label="Account">☺</Link>
          <Link to="/cart" className="icon-btn" aria-label="Cart">
            🛍
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
          {isAdmin && <Link to="/admin" className="btn btn-ghost" style={{ padding: '7px 14px' }}>Admin</Link>}
          <button className="nav-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">☰</button>
        </div>
      </div>

      {mobileOpen && (
        <div className="container mobile-menu">
          <form className="m-search" onSubmit={(e) => { submitSearch(e); setMobileOpen(false) }}>
            <input value={term} onChange={(e) => setTerm(e.target.value)}
                   placeholder="Search products…" aria-label="Search" />
          </form>
          <nav>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setMobileOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <NavLink to={user ? '/account' : '/login'} onClick={() => setMobileOpen(false)}>
              {user ? 'My account' : 'Log in'}
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" onClick={() => setMobileOpen(false)}>Admin panel</NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
