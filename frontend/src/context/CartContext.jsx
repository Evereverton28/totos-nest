import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

const STORE_KEY = 'tn_cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || [] }
    catch { return [] }
  })

  // Persist cart to localStorage on every change (survives refresh).
  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(items))
  }, [items])

  // A cart line is uniquely identified by product + chosen size.
  const lineKey = (id, size) => `${id}__${size || ''}`

  const addItem = (product, size = null, qty = 1) => {
    setItems((prev) => {
      const key = lineKey(product.id, size)
      const existing = prev.find((i) => lineKey(i.product_id, i.size) === key)
      if (existing) {
        return prev.map((i) =>
          lineKey(i.product_id, i.size) === key
            ? { ...i, quantity: i.quantity + qty } : i)
      }
      return [...prev, {
        product_id: product.id, name: product.name, slug: product.slug,
        image: product.image, price: product.price, size, quantity: qty,
      }]
    })
  }

  const updateQty = (productId, size, qty) => {
    if (qty < 1) return
    setItems((prev) => prev.map((i) =>
      lineKey(i.product_id, i.size) === lineKey(productId, size)
        ? { ...i, quantity: qty } : i))
  }

  const removeItem = (productId, size) => {
    setItems((prev) => prev.filter((i) =>
      lineKey(i.product_id, i.size) !== lineKey(productId, size)))
  }

  const clearCart = () => setItems([])

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])
  const count = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0), [items])

  const value = { items, addItem, updateQty, removeItem, clearCart,
                  subtotal, count }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
