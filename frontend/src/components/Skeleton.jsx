// Product-card shaped skeleton used while data loads.
export function CardSkeleton() {
  return (
    <div className="product-card">
      <div className="skeleton" style={{ aspectRatio: '1/1', borderRadius: 0 }} />
      <div className="body">
        <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 20, width: '50%' }} />
      </div>
    </div>
  )
}
export function GridSkeleton({ count = 8 }) {
  return (
    <div className="products-grid">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  )
}
