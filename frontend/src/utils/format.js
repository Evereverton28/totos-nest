// Currency + date helpers. Currency symbol is loaded once from /api/settings
// but we default to KES so this stays synchronous for render.
let CURRENCY = 'KES'
export function setCurrency(c) { CURRENCY = c }

export function formatPrice(amount) {
  if (amount == null) return ''
  return `${CURRENCY} ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}
