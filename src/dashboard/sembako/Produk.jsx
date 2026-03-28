import React, { useState, useMemo } from 'react'
import { Plus, Search, X, ChevronDown, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  useSembakoProducts,
  useCreateSembakoProduct,
  useUpdateSembakoProduct,
  useSoftDeleteSembakoProduct,
} from '../../lib/hooks/useSembakoData'

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT   = '#EA580C'
const BG_CARD  = '#1C1208'
const BG_PAGE  = '#06090F'
const TEXT_PRI = '#FEF3C7'
const TEXT_SEC = '#A8764A'
const BORDER   = 'rgba(234,88,12,0.15)'

const CATEGORIES = [
  'Beras', 'Gula', 'Minyak Goreng', 'Tepung', 'Telur',
  'Bumbu', 'Minuman', 'Snack', 'Lainnya',
]

const UNITS = ['kg', 'liter', 'pcs', 'karton', 'sak', 'lusin', 'ton', 'gram']

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))

// ── Stock bar helpers ─────────────────────────────────────────────────────────

function stockPercent(product) {
  const { current_stock, min_stock_alert } = product
  if (!min_stock_alert || min_stock_alert <= 0) return null
  return Math.min(100, Math.round((current_stock / (min_stock_alert * 3)) * 100))
}

function stockColor(pct) {
  if (pct === null) return '#4B5563'
  if (pct > 50) return '#34D399'
  if (pct > 20) return '#FBBF24'
  return '#F87171'
}

function stockLabel(product) {
  const { current_stock, min_stock_alert, unit } = product
  if (!min_stock_alert || current_stock > min_stock_alert) return null
  return `Stok menipis: ${current_stock} ${unit}`
}

// ── Margin badge ──────────────────────────────────────────────────────────────

function marginInfo(product) {
  const { sell_price, avg_buy_price } = product
  if (!sell_price || !avg_buy_price || avg_buy_price === 0) return null
  const margin = ((sell_price - avg_buy_price) / sell_price) * 100
  return { pct: margin.toFixed(1), color: margin > 15 ? '#34D399' : margin > 5 ? '#FBBF24' : '#F87171' }
}

// ── Sheet overlay ─────────────────────────────────────────────────────────────

function ProductSheet({ product, onClose }) {
  const isEdit = !!product?.id
  const createMut = useCreateSembakoProduct()
  const updateMut = useUpdateSembakoProduct()

  const [form, setForm] = useState({
    product_name:    product?.product_name    || '',
    category:        product?.category        || '',
    unit:            product?.unit            || 'kg',
    sell_price:      product?.sell_price      || '',
    avg_buy_price:   product?.avg_buy_price   || '',
    current_stock:   product?.current_stock   || 0,
    min_stock_alert: product?.min_stock_alert || '',
    notes:           product?.notes           || '',
    is_active:       product?.is_active       ?? true,
  })
  const [catOpen, setCatOpen] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.product_name.trim()) return toast.error('Nama produk wajib diisi')
    const payload = {
      ...form,
      sell_price:      form.sell_price      ? Number(String(form.sell_price).replace(/\D/g, ''))      : null,
      avg_buy_price:   form.avg_buy_price   ? Number(String(form.avg_buy_price).replace(/\D/g, ''))   : null,
      min_stock_alert: form.min_stock_alert ? Number(String(form.min_stock_alert).replace(/\D/g, '')) : null,
    }
    if (isEdit) {
      await updateMut.mutateAsync({ id: product.id, ...payload })
    } else {
      await createMut.mutateAsync(payload)
    }
    onClose()
  }

  const isLoading = createMut.isPending || updateMut.isPending

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ background: '#100A03', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '540px', padding: '0 0 32px', borderTop: `1px solid ${BORDER}`, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 16px' }}>
          <h2 style={{ fontFamily: 'Sora', fontSize: 17, fontWeight: 700, color: TEXT_PRI, margin: 0 }}>
            {isEdit ? 'Edit Produk' : 'Tambah Produk'}
          </h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#94A3B8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nama produk */}
          <Field label="Nama Produk *">
            <input
              id="product-name" name="product_name" type="text"
              value={form.product_name}
              onChange={e => set('product_name', e.target.value)}
              placeholder="contoh: Beras Premium 5kg"
              style={inputStyle}
            />
          </Field>

          {/* Kategori — autocomplete dropdown */}
          <Field label="Kategori">
            <div style={{ position: 'relative' }}>
              <input
                id="product-category" name="category" type="text"
                value={form.category}
                onChange={e => { set('category', e.target.value); setCatOpen(true) }}
                onFocus={() => setCatOpen(true)}
                onBlur={() => setTimeout(() => setCatOpen(false), 150)}
                placeholder="Pilih atau ketik kategori"
                style={inputStyle}
                autoComplete="off"
              />
              {catOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#1C1208', border: `1px solid ${BORDER}`, borderRadius: 10, marginTop: 4, overflow: 'hidden' }}>
                  {CATEGORIES
                    .filter(c => !form.category || c.toLowerCase().includes(form.category.toLowerCase()))
                    .map(c => (
                      <button
                        key={c} type="button"
                        onMouseDown={() => { set('category', c); setCatOpen(false) }}
                        style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: TEXT_PRI, fontSize: 14, fontFamily: 'DM Sans', textAlign: 'left', cursor: 'pointer' }}
                      >
                        {c}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </Field>

          {/* Unit */}
          <Field label="Satuan">
            <SelectWrap>
              <select
                id="product-unit" name="unit"
                value={form.unit}
                onChange={e => set('unit', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', paddingRight: 36 }}
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </SelectWrap>
          </Field>

          {/* Harga jual + beli — 2 col */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Harga Jual">
              <input
                id="sell-price" name="sell_price" type="text" inputMode="numeric"
                value={form.sell_price ? fmt(form.sell_price) : ''}
                onChange={e => set('sell_price', e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                style={inputStyle}
              />
            </Field>
            <Field label="Harga Beli (avg)">
              <input
                id="buy-price" name="avg_buy_price" type="text" inputMode="numeric"
                value={form.avg_buy_price ? fmt(form.avg_buy_price) : ''}
                onChange={e => set('avg_buy_price', e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Stok alert */}
          <Field label="Alert Stok Minimum">
            <input
              id="min-stock" name="min_stock_alert" type="text" inputMode="numeric"
              value={form.min_stock_alert || ''}
              onChange={e => set('min_stock_alert', e.target.value.replace(/\D/g, ''))}
              placeholder="contoh: 50"
              style={inputStyle}
            />
          </Field>

          {/* Keterangan */}
          <Field label="Keterangan">
            <textarea
              id="product-notes" name="notes"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Opsional"
              rows={2}
              style={{ ...inputStyle, resize: 'none', lineHeight: '1.5' }}
            />
          </Field>

          {/* Toggle aktif */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <label htmlFor="product-active" style={{ fontFamily: 'DM Sans', fontSize: 14, color: TEXT_SEC, cursor: 'pointer' }}>
              Produk Aktif
            </label>
            <button
              id="product-active" type="button"
              onClick={() => set('is_active', !form.is_active)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: form.is_active ? ACCENT : '#4B5563', display: 'flex' }}
            >
              {form.is_active
                ? <ToggleRight size={32} color={ACCENT} />
                : <ToggleLeft  size={32} color="#4B5563" />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !form.product_name.trim()}
            style={{
              marginTop: 4,
              width: '100%',
              height: 50,
              background: form.product_name.trim() && !isLoading ? ACCENT : 'rgba(234,88,12,0.3)',
              border: 'none', borderRadius: 14,
              color: 'white', fontFamily: 'Sora', fontSize: 15, fontWeight: 700,
              cursor: form.product_name.trim() && !isLoading ? 'pointer' : 'not-allowed',
              boxShadow: form.product_name.trim() ? '0 4px 16px rgba(234,88,12,0.3)' : 'none',
            }}
          >
            {isLoading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ── Field helper ─────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontFamily: 'DM Sans', color: TEXT_SEC, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${BORDER}`,
  borderRadius: 10,
  padding: '10px 14px',
  color: TEXT_PRI,
  fontSize: 14,
  fontFamily: 'DM Sans',
  outline: 'none',
  boxSizing: 'border-box',
  appearance: 'none',
  WebkitAppearance: 'none',
}

function SelectWrap({ children, style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      {children}
      <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: TEXT_SEC, pointerEvents: 'none' }} />
    </div>
  )
}

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ product, onEdit, onDelete }) {
  const pct    = stockPercent(product)
  const sColor = stockColor(pct)
  const margin = marginInfo(product)
  const warning = stockLabel(product)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: BG_CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: '14px 14px 12px',
        cursor: 'pointer',
        position: 'relative',
        opacity: product.is_active ? 1 : 0.5,
      }}
      onClick={() => onEdit(product)}
      whileTap={{ scale: 0.98 }}
    >
      {/* Badge kategori */}
      {product.category && (
        <span style={{ fontSize: 10, fontFamily: 'DM Sans', fontWeight: 600, color: ACCENT, background: 'rgba(234,88,12,0.12)', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.03em' }}>
          {product.category}
        </span>
      )}

      {/* Nama produk */}
      <p style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: TEXT_PRI, margin: '8px 0 4px', lineHeight: 1.3, wordBreak: 'break-word' }}>
        {product.product_name}
      </p>

      {/* Harga jual */}
      <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: ACCENT, fontWeight: 600, margin: '0 0 10px' }}>
        Rp {fmt(product.sell_price)} / {product.unit}
      </p>

      {/* Margin badge */}
      {margin && (
        <span style={{ fontSize: 11, fontWeight: 600, color: margin.color, background: `${margin.color}18`, padding: '2px 8px', borderRadius: 20, marginBottom: 8, display: 'inline-block' }}>
          Margin {margin.pct}%
        </span>
      )}

      {/* Stock bar */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }}>Stok</span>
          <span style={{ fontSize: 11, color: sColor, fontFamily: 'DM Sans', fontWeight: 600 }}>
            {fmt(product.current_stock)} {product.unit}
          </span>
        </div>
        {pct !== null && (
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: sColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        )}
      </div>

      {/* Warning */}
      {warning && (
        <p style={{ fontSize: 11, color: '#F87171', marginTop: 6, fontFamily: 'DM Sans' }}>
          ⚠ {warning}
        </p>
      )}

      {/* Delete button — top right */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(product) }}
        style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.5 }}
      >
        <Trash2 size={14} color="#F87171" />
      </button>
    </motion.div>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px' }}>
      <p style={{ fontSize: 11, color: TEXT_SEC, fontFamily: 'DM Sans', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Sora', color: color || TEXT_PRI, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Produk() {
  const { data: products = [], isLoading } = useSembakoProducts()
  const deleteMut = useSoftDeleteSembakoProduct()

  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('Semua')
  const [sheet,     setSheet]     = useState(null) // null | 'new' | product object
  const [showInactive, setShowInactive] = useState(false)

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))]
    return ['Semua', ...cats]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (!showInactive && !p.is_active) return false
      if (catFilter !== 'Semua' && p.category !== catFilter) return false
      if (search && !p.product_name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [products, search, catFilter, showInactive])

  const stats = useMemo(() => {
    const active   = products.filter(p => p.is_active && !p.is_deleted)
    const lowStock = active.filter(p => p.min_stock_alert > 0 && p.current_stock <= p.min_stock_alert)
    const nilaiStok = active.reduce((s, p) => s + (p.current_stock * (p.avg_buy_price || 0)), 0)
    return { total: active.length, lowStock: lowStock.length, nilaiStok }
  }, [products])

  const handleDelete = (product) => {
    if (!window.confirm(`Hapus "${product.product_name}"? Data tidak bisa dipulihkan.`)) return
    deleteMut.mutate(product.id)
  }

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: BG_PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: TEXT_SEC, fontFamily: 'DM Sans' }}>Memuat produk...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG_PAGE, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora', fontSize: 20, fontWeight: 800, color: TEXT_PRI, margin: 0 }}>Manajemen Produk</h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: TEXT_SEC, marginTop: 2 }}>{stats.total} produk aktif</p>
        </div>
        <button
          onClick={() => setSheet('new')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: ACCENT, border: 'none', borderRadius: 12, padding: '10px 16px', color: 'white', fontFamily: 'Sora', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(234,88,12,0.35)' }}
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '16px 16px 0' }}>
        <StatCard label="Total Produk"  value={stats.total}         color={TEXT_PRI} />
        <StatCard label="Stok Menipis"  value={stats.lowStock}      color={stats.lowStock > 0 ? '#F87171' : '#34D399'} sub={stats.lowStock > 0 ? 'perlu restock' : 'aman'} />
        <StatCard label="Nilai Stok"    value={`Rp ${stats.nilaiStok >= 1_000_000 ? (stats.nilaiStok / 1_000_000).toFixed(1) + 'jt' : fmt(stats.nilaiStok)}`} color={ACCENT} />
      </div>

      {/* Search + filter */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} color="#6B7280" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            id="product-search" name="search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari produk..."
            style={{ ...inputStyle, paddingLeft: 36, background: BG_CARD }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={14} color="#6B7280" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              style={{
                flexShrink: 0, background: catFilter === cat ? 'rgba(234,88,12,0.15)' : BG_CARD,
                border: `1px solid ${catFilter === cat ? 'rgba(234,88,12,0.5)' : BORDER}`,
                borderRadius: 20, padding: '6px 14px',
                color: catFilter === cat ? ACCENT : TEXT_SEC,
                fontSize: 12, fontFamily: 'DM Sans', fontWeight: catFilter === cat ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle non-aktif */}
      <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setShowInactive(v => !v)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: showInactive ? ACCENT : '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {showInactive ? <ToggleRight size={20} color={ACCENT} /> : <ToggleLeft size={20} color="#6B7280" />}
          <span style={{ fontFamily: 'DM Sans', fontSize: 12 }}>Tampilkan non-aktif</span>
        </button>
      </div>

      {/* Product grid */}
      <div style={{ padding: '14px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontFamily: 'Sora', fontSize: 16, color: TEXT_SEC, marginBottom: 8 }}>
                {search ? 'Produk tidak ditemukan' : 'Belum ada produk'}
              </p>
              <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#4B5563' }}>
                {search ? 'Coba kata kunci lain' : 'Klik "+ Tambah" untuk menambahkan produk'}
              </p>
            </div>
          ) : (
            filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={setSheet}
                onDelete={handleDelete}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Sheet */}
      <AnimatePresence>
        {sheet && (
          <ProductSheet
            product={sheet === 'new' ? null : sheet}
            onClose={() => setSheet(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
