export default function EmptyState({ emoji = '🪺', title, message, children }) {
  return (
    <div className="empty-state">
      <div className="em">{emoji}</div>
      <h3>{title}</h3>
      {message && <p className="muted" style={{ marginTop: 8 }}>{message}</p>}
      {children && <div style={{ marginTop: 20 }}>{children}</div>}
    </div>
  )
}
