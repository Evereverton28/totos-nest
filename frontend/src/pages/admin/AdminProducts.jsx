import { useEffect, useState } from 'react'
import api from '../../api/client'
import Loader from '../../components/Loader'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../utils/format'

const BLANK = { name: '', price: '', compare_at_price: '', stock: '', category_id: '',
                gender: 'unisex', age_group: '0-2y', description: '', sizes: '', images: '',
                is_featured: false, is_best_seller: false }

export default function AdminProducts() {
  const { push } = useToast()
  const [data, setData] = useState(null)
  const [categories, setCategories] = useState([])
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | product object
  const [form, setForm] = useState(BLANK)

  const load = () => api.get('/admin/products', { params: { q, per_page: 50 } })
    .then((r) => setData(r.data)).catch(() => setData({ products: [] }))
  useEffect(() => { load() }, [q])
  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data)).catch(() => {}) }, [])

  const openNew = () => { setForm(BLANK); setEditing('new') }
  const openEdit = (p) => {
    setForm({ ...p, price: p.price, compare_at_price: p.compare_at_price || '',
      category_id: categories.find((c) => c.name === p.category)?.id || '',
      sizes: (p.sizes || []).join(', '), images: (p.images || []).join(', ') })
    setEditing(p)
  }

  const save = async (e) => {
    e.preventDefault()
    const payload = { ...form,
      price: Number(form.price), stock: Number(form.stock),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      sizes: form.sizes ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean) : [],
      images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }
    try {
      if (editing === 'new') await api.post('/admin/products', payload)
      else await api.put(`/admin/products/${editing.id}`, payload)
      push('Product saved'); setEditing(null); load()
    } catch { push('Could not save product', 'error') }
  }

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return
    try { await api.delete(`/admin/products/${p.id}`); push('Product deleted'); load() }
    catch { push('Could not delete', 'error') }
  }

  if (!data) return <Loader />

  return (
    <div>
      <div className="spread" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.8rem' }}>Products</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Add product</button>
      </div>
      <input className="input" placeholder="Search products…" value={q}
        onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320, marginBottom: 18 }} />

      <div className="card" style={{ padding: 20 }}>
        <div className="table-wrap"><table className="data">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Flags</th><th></th></tr></thead>
          <tbody>
            {data.products.map((p) => (
              <tr key={p.id}>
                <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={p.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                </td>
                <td>{p.category}</td>
                <td>{formatPrice(p.price)}</td>
                <td style={{ color: p.stock <= 5 ? 'var(--danger)' : 'inherit', fontWeight: p.stock <= 5 ? 700 : 400 }}>{p.stock}</td>
                <td style={{ fontSize: '.8rem' }}>{p.is_featured && '⭐'} {p.is_best_seller && '🔥'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-ghost" style={{ padding: '5px 12px', marginRight: 6 }} onClick={() => openEdit(p)}>Edit</button>
                  <button className="btn btn-ghost" style={{ padding: '5px 12px', color: 'var(--danger)' }} onClick={() => remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(74,70,54,.4)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: 20 }}
             onClick={() => setEditing(null)}>
          <form className="card" style={{ padding: 28, maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto' }}
                onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <h2 style={{ marginBottom: 18 }}>{editing === 'new' ? 'Add product' : 'Edit product'}</h2>
            <div className="field"><label>Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-row">
              <div className="field"><label>Price (KES)</label><input className="input" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div className="field"><label>Compare-at price</label><input className="input" type="number" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} /></div>
              <div className="field"><label>Stock</label><input className="input" type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              <div className="field"><label>Category</label>
                <select className="select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}>
                  <option value="">—</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field"><label>Gender</label>
                <select className="select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="unisex">Unisex</option><option value="girl">Girl</option><option value="boy">Boy</option>
                </select>
              </div>
              <div className="field"><label>Age group</label>
                <select className="select" value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })}>
                  <option value="newborn">Newborn</option><option value="0-2y">0–2y</option><option value="3-5y">3–5y</option><option value="6-8y">6–8y</option>
                </select>
              </div>
            </div>
            <div className="field"><label>Sizes (comma-separated)</label><input className="input" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="0-3m, 3-6m, 6-12m" /></div>
            <div className="field"><label>Image URLs (comma-separated)</label><input className="input" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} /></div>
            <div className="field"><label>Description</label><textarea className="input" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <label style={{ display: 'flex', gap: 6 }}><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
              <label style={{ display: 'flex', gap: 6 }}><input type="checkbox" checked={form.is_best_seller} onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })} /> Best seller</label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit">Save</button>
              <button className="btn btn-ghost" type="button" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
