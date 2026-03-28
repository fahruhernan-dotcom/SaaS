import React, { useState, useMemo } from 'react'
import { Plus, ChevronDown, ChevronUp, X, Search, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  useSembakoProducts,
  useSembakoSuppliers,
  useSembakoAllBatches,
  useSembakoStockOut,
  useAddStockBatch,
  useCreateSembakoSupplier,
} from '../../lib/hooks/useSembakoData'
import { useSearchParams } from 'react-router-dom'

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCENT   = '#EA580C'
const BG_CARD  = '#1C1208'
const BG_PAGE  = '#06090F'
const TEXT_PRI = '#FEF3C7'
const TEXT_SEC = '#A8764A'
const BORDER   = 'rgba(234,88,12,0.15)'

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

function genBatchCode() {
  const now = new Date()
  const d = now.toISOString().slice(0, 10).replace(/-/g, '')
  const r = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `BATCH-${d}-${r}`
}

// ── Tambah Stok Sheet ─────────────────────────────────────────────────────────

function TambahStokSheet({ preselectedProductId, products, suppliers, onClose }) {
  const addBatch  = useAddStockBatch()
  const createSup = useCreateSembakoSupplier()

  const [form, setForm] = useState({
    product_id:    preselectedProductId || '',
    supplier_id:   '',
    qty_masuk:     '',
    buy_price:     '',
    purchase_date: new Date().toISOString().slice(0, 10),
    expiry_date:   '',
    notes:         '',
    batch_code:    genBatchCode(),
  })
  const [newSupplier, setNewSupplier] = useState('')
  const [showAddSup,  setShowAddSup]  = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const selectedProduct = products.find(p => p.id === form.product_id)

  const handleAddSupplier = async () => {
    if (!newSupplier.trim()) return
    try {
      const sup = await createSup.mutateAsync({ supplier_name: newSupplier.trim() })
      set('supplier_id', sup.id)
      setNewSupplier('')
      setShowAddSup(false)
    } catch (_) {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.product_id) return toast.error('Pilih produk terlebih dahulu')
    if (!form.qty_masuk || Number(form.qty_masuk) <= 0) return toast.error('Jumlah harus > 0')
    if (!form.buy_price || Number(String(form.buy_price).replace(/\D/g, '')) <= 0) return toast.error('Harga beli wajib diisi')

    await addBatch.mutateAsync({
      product_id:    form.product_id,
      supplier_id:   form.supplier_id || null,
      qty_masuk:     Number(form.qty_masuk),
      buy_price:     Number(String(form.buy_price).replace(/\D/g, '')),
      purchase_date: form.purchase_date,
      expiry_date:   form.expiry_date || null,
      notes:         form.notes || null,
    })
    onClose()
  }

  const isLoading = addBatch.isPending || createSup.isPending
  const canSubmit = form.product_id && Number(form.qty_masuk) > 0 && form.buy_price

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
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
          <h2 style={{ fontFamily: 'Sora', fontSize: 17, fontWeight: 700, color: TEXT_PRI, margin: 0 }}>Tambah Stok Masuk</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#94A3B8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Produk */}
          <SField label="Produk *">
            <SelectWrap>
              <select
                id="stok-product" name="product_id"
                value={form.product_id}
                onChange={e => set('product_id', e.target.value)}
                style={{ ...inputSt, cursor: 'pointer', paddingRight: 36 }}
              >
                <option value="">-- Pilih produk --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.product_name} ({p.unit})</option>
                ))}
              </select>
            </SelectWrap>
          </SField>

          {/* Batch code (read-only) */}
          <SField label="Kode Batch">
            <input
              id="batch-code" name="batch_code" type="text"
              value={form.batch_code} readOnly
              style={{ ...inputSt, opacity: 0.6, cursor: 'not-allowed' }}
            />
          </SField>

          {/* Supplier */}
          <SField label="Supplier">
            {showAddSup ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="new-supplier" name="new_supplier" type="text"
                  value={newSupplier}
                  onChange={e => setNewSupplier(e.target.value)}
                  placeholder="Nama supplier baru"
                  style={{ ...inputSt, flex: 1 }}
                />
                <button type="button" onClick={handleAddSupplier} disabled={createSup.isPending || !newSupplier.trim()}
                  style={{ background: ACCENT, border: 'none', borderRadius: 10, padding: '0 14px', color: 'white', fontFamily: 'DM Sans', fontSize: 13, cursor: 'pointer' }}>
                  {createSup.isPending ? '...' : 'Tambah'}
                </button>
                <button type="button" onClick={() => setShowAddSup(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <SelectWrap style={{ flex: 1 }}>
                  <select
                    id="stok-supplier" name="supplier_id"
                    value={form.supplier_id}
                    onChange={e => set('supplier_id', e.target.value)}
                    style={{ ...inputSt, cursor: 'pointer', paddingRight: 36 }}
                  >
                    <option value="">-- Pilih supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name}</option>
                    ))}
                  </select>
                </SelectWrap>
                <button type="button" onClick={() => setShowAddSup(true)}
                  style={{ background: 'rgba(234,88,12,0.1)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '0 12px', color: ACCENT, fontSize: 13, fontFamily: 'DM Sans', cursor: 'pointer', flexShrink: 0 }}>
                  + Baru
                </button>
              </div>
            )}
          </SField>

          {/* Qty + harga */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <SField label={`Jumlah${selectedProduct ? ` (${selectedProduct.unit})` : ''} *`}>
              <input
                id="stok-qty" name="qty_masuk" type="number" min="0.01" step="0.01"
                value={form.qty_masuk}
                onChange={e => set('qty_masuk', e.target.value)}
                placeholder="0"
                style={inputSt}
              />
            </SField>
            <SField label="Harga Beli / satuan *">
              <input
                id="stok-price" name="buy_price" type="text" inputMode="numeric"
                value={form.buy_price ? fmt(form.buy_price) : ''}
                onChange={e => set('buy_price', e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                style={inputSt}
              />
            </SField>
          </div>

          {/* Total preview */}
          {form.qty_masuk && form.buy_price && (
            <div style={{ background: 'rgba(234,88,12,0.06)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: TEXT_SEC }}>Total nilai</span>
              <span style={{ fontFamily: 'Sora', fontSize: 14, fontWeight: 700, color: ACCENT }}>
                Rp {fmt(Number(form.qty_masuk) * Number(String(form.buy_price).replace(/\D/g, '')))}
              </span>
            </div>
          )}

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <SField label="Tanggal Masuk *">
              <input
                id="stok-date" name="purchase_date" type="date"
                value={form.purchase_date}
                onChange={e => set('purchase_date', e.target.value)}
                style={inputSt}
              />
            </SField>
            <SField label="Tanggal Kadaluarsa">
              <input
                id="stok-expiry" name="expiry_date" type="date"
                value={form.expiry_date}
                onChange={e => set('expiry_date', e.target.value)}
                style={inputSt}
              />
            </SField>
          </div>

          {/* Notes */}
          <SField label="Catatan">
            <input
              id="stok-notes" name="notes" type="text"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Opsional"
              style={inputSt}
            />
          </SField>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            style={{
              marginTop: 4, width: '100%', height: 50,
              background: canSubmit && !isLoading ? ACCENT : 'rgba(234,88,12,0.3)',
              border: 'none', borderRadius: 14, color: 'white',
              fontFamily: 'Sora', fontSize: 15, fontWeight: 700,
              cursor: canSubmit && !isLoading ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 4px 16px rgba(234,88,12,0.3)' : 'none',
            }}
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Stok Masuk'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

function SField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontFamily: 'DM Sans', color: TEXT_SEC, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const inputSt = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${BORDER}`, borderRadius: 10,
  padding: '10px 14px', color: TEXT_PRI, fontSize: 14,
  fontFamily: 'DM Sans', outline: 'none', boxSizing: 'border-box',
  appearance: 'none', WebkitAppearance: 'none',
}

function SelectWrap({ children, style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      {children}
      <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: TEXT_SEC, pointerEvents: 'none' }} />
    </div>
  )
}

// ── Tab: Stok Saat Ini ────────────────────────────────────────────────────────

function StokSaatIni({ products, onTambah }) {
  const [expanded, setExpanded] = useState(null)
  const [search,   setSearch]   = useState('')

  // For each product, fetch its batches
  const { data: allBatches = [] } = useSembakoAllBatches()

  const filtered = useMemo(() => {
    if (!search) return products.filter(p => p.is_active && !p.is_deleted)
    return products.filter(p =>
      (p.is_active && !p.is_deleted) &&
      p.product_name.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  const batchesForProduct = (productId) =>
    allBatches.filter(b => b.product_id === productId && b.qty_sisa > 0)

  return (
    <div>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} color="#6B7280" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          id="gudang-search" name="gudang_search" type="text"
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari produk..."
          style={{ ...inputSt, paddingLeft: 36 }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={14} color="#6B7280" />
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Package size={32} color="#4B5563" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'DM Sans', color: TEXT_SEC }}>Belum ada produk aktif</p>
        </div>
      )}

      {filtered.map(product => {
        const batches  = batchesForProduct(product.id)
        const isOpen   = expanded === product.id
        const isLow    = product.min_stock_alert > 0 && product.current_stock <= product.min_stock_alert
        const isFirst  = batches[0] // FIFO next

        return (
          <div key={product.id} style={{ marginBottom: 8, background: BG_CARD, border: `1px solid ${isLow ? 'rgba(248,113,113,0.3)' : BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            {/* Row header */}
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : product.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', gap: 12 }}
            >
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'Sora', fontSize: 14, fontWeight: 700, color: TEXT_PRI }}>{product.product_name}</span>
                  {isLow && <span style={{ fontSize: 10, background: 'rgba(248,113,113,0.15)', color: '#F87171', padding: '1px 8px', borderRadius: 20, fontFamily: 'DM Sans', fontWeight: 600 }}>Menipis</span>}
                </div>
                <span style={{ fontSize: 13, color: isLow ? '#F87171' : ACCENT, fontFamily: 'DM Sans', fontWeight: 600 }}>
                  {fmt(product.current_stock)} {product.unit}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'DM Sans' }}>{batches.length} batch</div>
                {isOpen ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
              </div>
            </button>

            {/* Expandable batch rows */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ borderTop: `1px solid ${BORDER}`, padding: '8px 14px 12px' }}>
                    {batches.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#6B7280', fontFamily: 'DM Sans', padding: '8px 0' }}>Tidak ada stok tersisa di batch manapun.</p>
                    ) : (
                      batches.map((batch, i) => (
                        <div key={batch.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < batches.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, fontFamily: 'DM Sans', color: '#94A3B8' }}>{batch.batch_code || 'N/A'}</span>
                              {i === 0 && <span style={{ fontSize: 9, background: 'rgba(234,88,12,0.15)', color: ACCENT, padding: '1px 6px', borderRadius: 10, fontWeight: 700, letterSpacing: '0.04em' }}>FIFO NEXT</span>}
                            </div>
                            <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'DM Sans', marginTop: 2 }}>
                              {fmtDate(batch.purchase_date)}
                              {batch.expiry_date && <span style={{ color: new Date(batch.expiry_date) < new Date() ? '#F87171' : '#6B7280' }}> · exp {fmtDate(batch.expiry_date)}</span>}
                            </div>
                            {batch.sembako_suppliers?.supplier_name && (
                              <div style={{ fontSize: 11, color: '#4B5563', fontFamily: 'DM Sans' }}>{batch.sembako_suppliers.supplier_name}</div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: TEXT_PRI }}>{fmt(batch.qty_sisa)} {product.unit}</div>
                            <div style={{ fontSize: 11, color: TEXT_SEC, fontFamily: 'DM Sans' }}>@ Rp {fmt(batch.buy_price)}</div>
                          </div>
                        </div>
                      ))
                    )}
                    {/* Quick add stok */}
                    <button
                      type="button"
                      onClick={() => onTambah(product.id)}
                      style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(234,88,12,0.08)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '7px 14px', color: ACCENT, fontFamily: 'DM Sans', fontSize: 12, cursor: 'pointer' }}
                    >
                      <Plus size={14} /> Tambah Stok Produk Ini
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ── Tab: Riwayat Masuk ────────────────────────────────────────────────────────

function RiwayatMasuk() {
  const { data: batches = [], isLoading } = useSembakoAllBatches()

  if (isLoading) return <LoadingRow />

  return (
    <div>
      {batches.length === 0 && (
        <EmptyState label="Belum ada riwayat stok masuk" />
      )}
      {batches.map(batch => (
        <div key={batch.id} style={{ marginBottom: 8, background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: TEXT_PRI, marginBottom: 2 }}>
              {batch.sembako_products?.product_name || '-'}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Sans' }}>{batch.batch_code}</div>
            <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans', marginTop: 2 }}>
              {fmtDate(batch.purchase_date)}
              {batch.sembako_suppliers?.supplier_name && ` · ${batch.sembako_suppliers.supplier_name}`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: ACCENT }}>
              +{fmt(batch.qty_masuk)} {batch.sembako_products?.unit}
            </div>
            <div style={{ fontSize: 11, color: TEXT_SEC, fontFamily: 'DM Sans' }}>@ Rp {fmt(batch.buy_price)}</div>
            <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }}>
              Sisa: {fmt(batch.qty_sisa)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Riwayat Keluar ───────────────────────────────────────────────────────

function RiwayatKeluar() {
  const { data: stockOuts = [], isLoading } = useSembakoStockOut()

  if (isLoading) return <LoadingRow />

  if (stockOuts.length === 0) return <EmptyState label="Belum ada riwayat stok keluar" sub="Stok berkurang otomatis saat penjualan dicatat" />

  return (
    <div>
      {stockOuts.map(s => (
        <div key={s.id} style={{ marginBottom: 8, background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: TEXT_PRI, marginBottom: 2 }}>
              {s.sembako_products?.product_name || '-'}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Sans' }}>
              {s.sembako_stock_batches?.batch_code || '-'}
            </div>
            {s.sembako_sales?.invoice_number && (
              <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }}>{s.sembako_sales.invoice_number}</div>
            )}
            <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }}>{fmtDate(s.created_at)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: '#F87171' }}>
              -{fmt(s.qty_out)} {s.sembako_products?.unit}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function LoadingRow() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <p style={{ fontFamily: 'DM Sans', color: TEXT_SEC }}>Memuat...</p>
    </div>
  )
}

function EmptyState({ label, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <Package size={32} color="#4B5563" style={{ margin: '0 auto 12px' }} />
      <p style={{ fontFamily: 'Sora', fontSize: 14, color: TEXT_SEC, marginBottom: 4 }}>{label}</p>
      {sub && <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#4B5563' }}>{sub}</p>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = ['Stok Saat Ini', 'Riwayat Masuk', 'Riwayat Keluar']

export default function Gudang() {
  const [searchParams] = useSearchParams()
  const preProductId   = searchParams.get('product') || null

  const { data: products  = [] } = useSembakoProducts()
  const { data: suppliers = [] } = useSembakoSuppliers()

  const [activeTab,        setActiveTab]        = useState(0)
  const [showTambahSheet,  setShowTambahSheet]  = useState(!!preProductId)
  const [tambahProductId,  setTambahProductId]  = useState(preProductId)

  const openTambah = (productId = null) => {
    setTambahProductId(productId)
    setShowTambahSheet(true)
  }

  // Summary stats
  const totalStokNilai = useMemo(() =>
    products.filter(p => p.is_active && !p.is_deleted)
      .reduce((s, p) => s + (p.current_stock * (p.avg_buy_price || 0)), 0),
    [products]
  )
  const lowStockCount = useMemo(() =>
    products.filter(p => p.is_active && !p.is_deleted && p.min_stock_alert > 0 && p.current_stock <= p.min_stock_alert).length,
    [products]
  )

  return (
    <div style={{ minHeight: '100vh', background: BG_PAGE, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora', fontSize: 20, fontWeight: 800, color: TEXT_PRI, margin: 0 }}>Gudang</h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: TEXT_SEC, marginTop: 2 }}>
            Stok · {products.filter(p => p.is_active && !p.is_deleted).length} produk
          </p>
        </div>
        <button
          onClick={() => openTambah()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: ACCENT, border: 'none', borderRadius: 12, padding: '10px 16px', color: 'white', fontFamily: 'Sora', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(234,88,12,0.35)' }}
        >
          <Plus size={16} /> Stok Masuk
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px 0', overflowX: 'auto' }}>
        <Chip label="Nilai Stok" value={`Rp ${totalStokNilai >= 1_000_000 ? (totalStokNilai / 1_000_000).toFixed(1) + 'jt' : new Intl.NumberFormat('id-ID').format(totalStokNilai)}`} color={ACCENT} />
        <Chip label="Stok Menipis" value={`${lowStockCount} produk`} color={lowStockCount > 0 ? '#F87171' : '#34D399'} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '16px 16px 0', gap: 0, borderBottom: `1px solid ${BORDER}`, marginTop: 8 }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              borderBottom: activeTab === i ? `2px solid ${ACCENT}` : '2px solid transparent',
              padding: '10px 0', color: activeTab === i ? ACCENT : TEXT_SEC,
              fontFamily: activeTab === i ? 'Sora' : 'DM Sans',
              fontSize: 13, fontWeight: activeTab === i ? 700 : 400,
              cursor: 'pointer', transition: 'color 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '14px 16px 0' }}>
        {activeTab === 0 && (
          <StokSaatIni products={products} onTambah={openTambah} />
        )}
        {activeTab === 1 && <RiwayatMasuk />}
        {activeTab === 2 && <RiwayatKeluar />}
      </div>

      {/* Sheet */}
      <AnimatePresence>
        {showTambahSheet && (
          <TambahStokSheet
            preselectedProductId={tambahProductId}
            products={products.filter(p => p.is_active && !p.is_deleted)}
            suppliers={suppliers}
            onClose={() => { setShowTambahSheet(false); setTambahProductId(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Chip({ label, value, color }) {
  return (
    <div style={{ flexShrink: 0, background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'DM Sans', fontSize: 11, color: TEXT_SEC }}>{label}</span>
      <span style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  )
}
