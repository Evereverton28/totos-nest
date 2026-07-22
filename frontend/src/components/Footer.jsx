import { Link } from 'react-router-dom'
import SocialLinks from './SocialLinks'
import { CONTACT } from '../site'
import logo from '../assets/logo.jpeg'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="nav-logo" style={{ marginBottom: 12 }}>
              <img src={logo} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--sage-deep)' }}>toto's nest</span>
            </div>
            <p>Thoughtfully made baby &amp; kids essentials, delivered with love across Kenya.</p>
          </div>
          <div>
            <h5>Shop</h5>
            <Link to="/shop">All products</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/shop?sort=popular">Best sellers</Link>
            <Link to="/shop?sort=newest">New arrivals</Link>
          </div>
          <div>
            <h5>Help</h5>
            <Link to="/faq">FAQ</Link>
            <Link to="/contact">Contact us</Link>
            <Link to="/about">About us</Link>
            <p>Delivery &amp; returns</p>
          </div>
          <div>
            <h5>Get in touch</h5>
            <p>{CONTACT.location}</p>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <p>{CONTACT.phone}</p>
            <SocialLinks variant="labelled" className="footer-socials" />
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Toto's Nest. Made with care in Nairobi.
        </div>
      </div>
    </footer>
  )
}
