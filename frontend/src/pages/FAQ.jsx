import { useState } from 'react'

const FAQS = [
  ['How long does delivery take?', 'Within Nairobi, 1–2 business days. Elsewhere in Kenya, 2–4 business days via tracked courier.'],
  ['What are your delivery fees?', 'A flat KES 350 within Kenya, and free on all orders over KES 5,000.'],
  ['Can I return an item?', 'Yes — we offer 7-day returns on unworn items with tags. Reach out via Contact and we\'ll guide you.'],
  ['How do I pay?', 'We accept M-Pesa, card, and pay-on-delivery. Your payment details are never stored by us.'],
  ['Do you restock sold-out items?', 'Often! Join our newsletter or follow us on Instagram to hear about restocks first.'],
  ['Are the fabrics safe for newborns?', 'Absolutely. We prioritise soft, breathable, skin-friendly fabrics suitable for delicate newborn skin.'],
]

export default function FAQ() {
  const [open, setOpen] = useState(0)
  return (
    <div className="container section" style={{ maxWidth: 760 }}>
      <div className="page-head center" style={{ padding: '10px 0 30px' }}>
        <span className="eyebrow">Help centre</span>
        <h1>Frequently asked questions</h1>
      </div>
      {FAQS.map(([q, a], i) => (
        <div key={i} className="card" style={{ padding: 0, marginBottom: 12, overflow: 'hidden' }}>
          <button onClick={() => setOpen(open === i ? -1 : i)}
            style={{ width: '100%', textAlign: 'left', padding: '18px 22px', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--ink)' }}>
            {q} <span style={{ color: 'var(--sage)', fontSize: '1.3rem' }}>{open === i ? '−' : '+'}</span>
          </button>
          {open === i && <p className="muted" style={{ padding: '0 22px 20px' }}>{a}</p>}
        </div>
      ))}
    </div>
  )
}
