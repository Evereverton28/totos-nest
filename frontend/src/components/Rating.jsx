// Star rating display (read-only).
export default function Rating({ value = 0, count }) {
  const full = Math.round(value)
  return (
    <span className="rating" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= full ? '' : 'empty'}>★</span>
      ))}
      {count != null && <span className="muted" style={{ fontSize: '.8rem', marginLeft: 4 }}>({count})</span>}
    </span>
  )
}
