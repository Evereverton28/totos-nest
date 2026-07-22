export default function About() {
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <div className="page-head" style={{ padding: '10px 0 24px' }}>
        <span className="eyebrow">Our story</span>
        <h1>Made for the littlest ones, by people who care</h1>
      </div>
      <img src="https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1000" alt="Baby essentials"
        style={{ borderRadius: 'var(--r-lg)', marginBottom: 26, aspectRatio: '16/8', objectFit: 'cover' }} />
      <p style={{ marginBottom: 16 }}>Toto's Nest began with a simple belief: that the things closest to a baby's
        skin should be soft, safe and thoughtfully made. As parents ourselves, we struggled to find
        pieces that felt gentle, looked lovely, and didn't cost a fortune — so we built the little shop
        we wished existed.</p>
      <p style={{ marginBottom: 16 }}>Every item in the nest is chosen for comfort first. We work with careful
        makers, favour breathable natural fabrics, and keep our range small and considered rather than
        overwhelming. From coming-home sets to first shoes, we want each piece to feel like a warm welcome.</p>
      <p>Today we deliver across Kenya, wrapping every order with the same care we'd want for our own.
        Thank you for letting us be part of your family's story.</p>
      <div className="features" style={{ marginTop: 40 }}>
        {[['🌿', 'Gentle materials'], ['🇰🇪', 'Kenyan owned'], ['💛', 'Family first'], ['♻️', 'Made to last']].map(([ic, t]) => (
          <div key={t} className="feature card"><div className="ic">{ic}</div><h4>{t}</h4></div>
        ))}
      </div>
    </div>
  )
}
