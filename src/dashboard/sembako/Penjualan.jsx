import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import {
  Search, Plus, CreditCard, TrendingUp, CheckCircle2, AlertTriangle,
  FileText, ChevronDown, X, Truck, Store, Package, Star, Phone, MapPin,
} from 'lucide-react'
import {
  useSembakoSales, useSembakoCustomers, useSembakoSuppliers,
  useSembakoProducts, useSembakoDeliveries, useSembakoEmployees,
  useCreateSembakoSale, useRecordSembakoPayment,
  useCreateSembakoCustomer, useUpdateSembakoCustomer,
  useCreateSembakoSupplier, useUpdateSembakoSupplier,
  useCreateSembakoDelivery,
} from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import TopBar from '@/dashboard/components/TopBar'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'

// ── Palette (matches Beranda.jsx) ───────────────────────────────────────────
const C = {
  bg: '#06090F', card: '#1C1208', input: '#231A0E',
  accent: '#EA580C', amber: '#F59E0B', green: '#34D399', red: '#EF4444',
  text: '#FEF3C7', muted: '#92400E',
  border: 'rgba(234,88,12,0.15)', borderAm: 'rgba(245,158,11,0.25)',
}

const PAYMENT_TERMS_DAYS = { cash: 0, net3: 3, net7: 7, net14: 14, net30: 30 }
const PAYMENT_TERMS_LABEL = { cash: 'Cash', net3: 'NET 3', net7: 'NET 7', net14: 'NET 14', net30: 'NET 30' }
const STATUS_STYLE = {
  lunas:       { bg: 'rgba(52,211,153,0.12)', color: C.green, label: 'Lunas' },
  sebagian:    { bg: 'rgba(245,158,11,0.12)', color: C.amber, label: 'Sebagian' },
  belum_lunas: { bg: 'rgba(239,68,68,0.12)',  color: C.red,   label: 'Belum Lunas' },
}
const DELIVERY_STATUS = {
  pending:   { bg: 'rgba(245,158,11,0.12)', color: C.amber, label: 'Pending' },
  on_route:  { bg: 'rgba(96,165,250,0.12)',  color: '#60A5FA', label: 'On Route' },
  delivered: { bg: 'rgba(52,211,153,0.12)',  color: C.green, label: 'Delivered' },
  cancelled: { bg: 'rgba(239,68,68,0.12)',   color: C.red,   label: 'Cancelled' },
}
const CUSTOMER_TYPES = [
  'warung','toko_retail','supermarket','restoran','catering','grosir','lainnya'
]

// ── Shared UI Primitives ────────────────────────────────────────────────────
const sInput = {
  background: C.input, border: `1px solid ${C.border}`, borderRadius: '10px',
  padding: '10px 12px', color: C.text, fontSize: '16px', fontWeight: 600,
  outline: 'none', width: '100%', appearance: 'none', WebkitAppearance: 'none',
  minHeight: '44px',
}

function SelectWrap({ children, style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      {children}
      <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
    </div>
  )
}
const sBtn = (primary) => ({
  background: primary ? C.accent : 'transparent',
  border: primary ? 'none' : `1px solid ${C.border}`,
  color: primary ? '#fff' : C.text, borderRadius: '10px',
  padding: '10px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
})
const sLabel = { fontSize: '11px', color: C.muted, fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }

function fmtDate(d) {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return '-' }
}
function InputRupiah({ value, onChange, placeholder, style }) {
  const display = value ? Number(value).toLocaleString('id-ID') : ''
  return (
    <input style={{ ...sInput, ...style }} placeholder={placeholder || 'Rp 0'}
      value={display ? `Rp ${display}` : ''}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9]/g, '')
        onChange(raw ? parseInt(raw) : 0)
      }} />
  )
}

// ── MAIN ────────────────────────────────────────────────────────────────────
export default function SembakoPenjualan() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const location = useLocation()
  const [tab, setTab] = useState('invoice')
  const [openCreate, setOpenCreate] = useState(false)

  // Handle FAB action from BottomNav (?action=new)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'new') {
      setTab('invoice')
      setOpenCreate(true)
      // Optional: clear param if you don't want it to re-open on refresh
      // window.history.replaceState({}, '', location.pathname)
    }
  }, [location.search])

  const TABS = [
    { id: 'invoice', label: 'Invoice' },
    { id: 'toko', label: 'Toko & Supplier' },
    { id: 'pengiriman', label: 'Pengiriman' },
  ]

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: '96px' }}>
      {!isDesktop && <TopBar title="Penjualan" />}
      <div style={{ padding: isDesktop ? '32px 40px' : '20px 16px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: isDesktop ? '28px' : '22px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans', marginBottom: '20px' }}>
          Penjualan
        </h1>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '4px', background: C.card, borderRadius: '12px', padding: '4px', marginBottom: '24px', border: `1px solid ${C.border}` }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: tab === t.id ? C.accent : 'transparent',
              color: tab === t.id ? '#fff' : C.muted,
              fontWeight: 800, fontSize: '12px', letterSpacing: '0.04em',
              transition: 'all 0.2s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'invoice' && <TabInvoice isDesktop={isDesktop} openCreate={openCreate} setOpenCreate={setOpenCreate} />}
        {tab === 'toko' && <TabTokoSupplier isDesktop={isDesktop} />}
        {tab === 'pengiriman' && <TabPengiriman isDesktop={isDesktop} />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1: INVOICE
// ═══════════════════════════════════════════════════════════════════════════
function TabInvoice({ isDesktop, openCreate, setOpenCreate }) {
  const { data: sales = [], isLoading } = useSembakoSales()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [payTarget, setPayTarget] = useState(null)
  const PER_PAGE = 20
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 86400000)

  const stats = useMemo(() => {
    const thisMonth = sales.filter(s => new Date(s.transaction_date) > thirtyDaysAgo)
    return {
      piutang: sales.reduce((s, i) => s + (i.remaining_amount || 0), 0),
      revenue: thisMonth.reduce((s, i) => s + (i.total_amount || 0), 0),
      lunas: sales.filter(s => s.payment_status === 'lunas').length,
      overdue: sales.filter(s => s.payment_status !== 'lunas' && s.due_date && new Date(s.due_date) < now).length,
    }
  }, [sales])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return sales.filter(s =>
      (s.invoice_number || '').toLowerCase().includes(q) ||
      (s.customer_name || '').toLowerCase().includes(q) ||
      (s.sembako_customers?.customer_name || '').toLowerCase().includes(q)
    )
  }, [sales, search])

  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon={CreditCard} label="Piutang" value={formatIDR(stats.piutang)} color={C.red} />
        <StatCard icon={TrendingUp} label="Revenue Bulan Ini" value={formatIDR(stats.revenue)} color={C.accent} />
        <StatCard icon={CheckCircle2} label="Lunas" value={stats.lunas} color={C.green} />
        <StatCard icon={AlertTriangle} label="Jatuh Tempo" value={stats.overdue} color={stats.overdue > 0 ? C.red : C.green} />
      </div>

      {/* Search + Add */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} color={C.muted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input placeholder="Cari invoice / toko..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...sInput, paddingLeft: '36px' }} />
        </div>
        <button onClick={() => setOpenCreate(true)} style={{ ...sBtn(true), display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <Plus size={15} /> Invoice Baru
        </button>
      </div>

      {/* Table */}
      {isLoading ? <LoadingSkeleton /> : paged.length === 0 ? (
        <EmptyBox icon={FileText} text="Belum ada invoice" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {paged.map(sale => <InvoiceRow key={sale.id} sale={sale} now={now} onPay={() => setPayTarget(sale)} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} style={{
              width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: page === i ? C.accent : C.card, color: page === i ? '#fff' : C.muted,
              fontWeight: 700, fontSize: '12px',
            }}>{i + 1}</button>
          ))}
        </div>
      )}

      <SheetCreateInvoice open={openCreate} onClose={() => setOpenCreate(false)} />
      <SheetPayment sale={payTarget} onClose={() => setPayTarget(null)} />
    </div>
  )
}

function InvoiceRow({ sale, now, onPay }) {
  const st = STATUS_STYLE[sale.payment_status] || STATUS_STYLE.belum_lunas
  const name = sale.sembako_customers?.customer_name || sale.customer_name || '-'
  const overdue = sale.payment_status !== 'lunas' && sale.due_date && new Date(sale.due_date) < now
  return (
    <div style={{
      background: C.card, borderRadius: '12px', padding: '12px 14px',
      border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : C.border}`,
      display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
        <p style={{ fontSize: '10px', color: C.muted, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sale.invoice_number} · {fmtDate(sale.transaction_date)}
        </p>
      </div>
      <div style={{ textAlign: 'right', minWidth: '80px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{formatIDR(sale.total_amount)}</p>
        {sale.remaining_amount > 0 && (
          <p style={{ fontSize: '10px', color: C.red, marginTop: '2px' }}>Sisa: {formatIDR(sale.remaining_amount)}</p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          background: st.bg, color: st.color, fontSize: '10px', fontWeight: 700,
          padding: '2px 8px', borderRadius: '6px',
        }}>{st.label}</span>
        {overdue && <span style={{ background: 'rgba(239,68,68,0.15)', color: C.red, fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '5px' }}>OVERDUE</span>}
      </div>
      {sale.payment_status !== 'lunas' && (
        <button onClick={onPay} style={{ ...sBtn(false), padding: '5px 12px', fontSize: '11px' }}>Bayar</button>
      )}
    </div>
  )
}

// ── Sheet: Create Invoice ───────────────────────────────────────────────────
function SheetCreateInvoice({ open, onClose }) {
  const { data: customers = [] } = useSembakoCustomers()
  const { data: products = [] } = useSembakoProducts()
  const createSale = useCreateSembakoSale()
  const createCustomer = useCreateSembakoCustomer()

  const [custId, setCustId] = useState('')
  const [txnDate, setTxnDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [deliveryCost, setDeliveryCost] = useState(0)
  const [otherCost, setOtherCost] = useState(0)
  const [notes, setNotes] = useState('')
  const [showAddCust, setShowAddCust] = useState(false)
  const [newCust, setNewCust] = useState({ customer_name: '', phone: '', payment_terms: 'cash' })

  const selectedCust = customers.find(c => c.id === custId)

  function emptyItem() { return { product_id: '', product_name: '', unit: 'kg', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 } }

  function handleSelectCustomer(id) {
    setCustId(id)
    const c = customers.find(x => x.id === id)
    if (c?.payment_terms && PAYMENT_TERMS_DAYS[c.payment_terms]) {
      const d = new Date(txnDate)
      d.setDate(d.getDate() + PAYMENT_TERMS_DAYS[c.payment_terms])
      setDueDate(d.toISOString().slice(0, 10))
    }
  }

  function handleItemChange(idx, field, val) {
    const next = [...items]
    next[idx] = { ...next[idx], [field]: val }
    if (field === 'product_id') {
      const p = products.find(x => x.id === val)
      if (p) {
        next[idx].product_name = p.product_name
        next[idx].unit = p.unit
        next[idx].price_per_unit = p.sell_price || 0
        next[idx].cogs_per_unit = p.avg_buy_price || 0
      }
    }
    setItems(next)
  }

  const totalAmount = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.price_per_unit || 0)), 0)
  const totalCogs = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.cogs_per_unit || 0)), 0)
  const grossProfit = totalAmount - totalCogs
  const netProfit = grossProfit - (deliveryCost || 0) - (otherCost || 0)

  async function handleAddCustomer() {
    if (!newCust.customer_name) return
    try {
      const data = await createCustomer.mutateAsync(newCust)
      setCustId(data.id)
      setShowAddCust(false)
      setNewCust({ customer_name: '', phone: '', payment_terms: 'cash' })
    } catch {}
  }

  async function handleSubmit() {
    const validItems = items.filter(i => i.product_name && i.quantity > 0)
    if (!validItems.length) return
    const custName = selectedCust?.customer_name || 'Umum'
    await createSale.mutateAsync({
      customer_id: custId || null,
      customer_name: custName,
      transaction_date: txnDate,
      due_date: dueDate || null,
      items: validItems,
      delivery_cost: deliveryCost,
      other_cost: otherCost,
      notes,
    })
    // reset
    setCustId(''); setItems([emptyItem()]); setDeliveryCost(0); setOtherCost(0); setNotes('')
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, width: '100%', maxWidth: '520px', overflowY: 'auto', overflowX: 'hidden', padding: '24px' }}>
        <SheetHeader>
          <SheetTitle style={{ color: C.text, fontWeight: 900, fontSize: '18px' }}>Buat Invoice Baru</SheetTitle>
          <SheetDescription className="sr-only">Form untuk membuat invoice penjualan sembako baru.</SheetDescription>
        </SheetHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px', paddingBottom: '120px' }}>
          {/* Customer Select */}
          <div>
            <p style={sLabel}>TOKO / CUSTOMER</p>
            <SelectWrap>
              <select id="invoice-customer" name="customer" value={custId} onChange={e => e.target.value === '__new__' ? setShowAddCust(true) : handleSelectCustomer(e.target.value)} style={{ ...sInput, paddingRight: 32 }}>
                <option value="">— Pilih toko —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
                <option value="__new__">+ Tambah Toko Baru</option>
              </select>
            </SelectWrap>
            {selectedCust && (
              <div style={{ marginTop: '6px', padding: '8px 10px', background: C.input, borderRadius: '8px', fontSize: '11px', color: C.muted }}>
                <span style={{ marginRight: '12px' }}>Terms: {PAYMENT_TERMS_LABEL[selectedCust.payment_terms] || selectedCust.payment_terms}</span>
                <span>Piutang: {formatIDR(selectedCust.total_outstanding || 0)}</span>
              </div>
            )}
          </div>

          {/* Inline add customer */}
          {showAddCust && (
            <div style={{ background: C.card, borderRadius: '12px', padding: '14px', border: `1px solid ${C.borderAm}` }}>
              <p style={{ ...sLabel, color: C.amber }}>TAMBAH TOKO BARU</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input id="new-cust-name" name="customer_name" style={sInput} placeholder="Nama toko" value={newCust.customer_name} onChange={e => setNewCust({ ...newCust, customer_name: e.target.value })} />
                <input id="new-cust-phone" name="phone" style={sInput} placeholder="No HP" value={newCust.phone || ''} onChange={e => setNewCust({ ...newCust, phone: e.target.value.replace(/[^0-9+]/g, '') })} />
                <SelectWrap>
                  <select value={newCust.payment_terms} onChange={e => setNewCust({ ...newCust, payment_terms: e.target.value })} style={{ ...sInput, paddingRight: 32 }}>
                    {Object.entries(PAYMENT_TERMS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </SelectWrap>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleAddCustomer} style={sBtn(true)} disabled={createCustomer.isPending}>Simpan</button>
                  <button onClick={() => setShowAddCust(false)} style={sBtn(false)}>Batal</button>
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={sLabel}>TANGGAL</p>
              <DatePicker value={txnDate} onChange={setTxnDate} placeholder="Pilih tanggal" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p style={sLabel}>JATUH TEMPO</p>
              <DatePicker value={dueDate || ''} onChange={setDueDate} placeholder="Pilih jatuh tempo (opsional)" />
            </div>
          </div>

          {/* Items */}
          <div>
            <p style={sLabel}>ITEM PRODUK</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((item, idx) => {
                const prod = products.find(p => p.id === item.product_id)
                const overStock = prod && item.quantity > (prod.current_stock || 0)
                return (
                  <div key={idx} style={{ background: C.card, borderRadius: '10px', padding: '12px', border: `1px solid ${overStock ? 'rgba(239,68,68,0.4)' : C.border}` }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <SelectWrap style={{ flex: 2 }}>
                        <select id={`prod-${idx}`} name={`product-${idx}`} value={item.product_id} onChange={e => handleItemChange(idx, 'product_id', e.target.value)} style={{ ...sInput, paddingRight: 32 }}>
                          <option value="">Pilih produk</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.product_name} ({p.current_stock} {p.unit})</option>)}
                        </select>
                      </SelectWrap>
                      {items.length > 1 && (
                        <button onClick={() => setItems(items.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.red, padding: '4px' }}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <p style={{ ...sLabel, fontSize: '9px' }}>QTY ({item.unit})</p>
                          <input id={`qty-${idx}`} name={`quantity-${idx}`} type="number" min={0} value={item.quantity || ''} onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)} style={{...sInput, width: '100%'}} />
                        </div>
                        <div>
                          <p style={{ ...sLabel, fontSize: '9px' }}>HARGA/UNIT</p>
                          <InputRupiah value={item.price_per_unit} onChange={v => handleItemChange(idx, 'price_per_unit', v)} />
                        </div>
                      </div>
                      <div>
                        <p style={{ ...sLabel, fontSize: '9px' }}>HPP/UNIT</p>
                        <input style={{ ...sInput, opacity: 0.6, width: '100%' }} value={formatIDR(item.cogs_per_unit)} readOnly />
                      </div>
                    </div>
                    {overStock && <p style={{ fontSize: '10px', color: C.red, marginTop: '4px', fontWeight: 700 }}>⚠ Stok hanya {prod.current_stock} {prod.unit}</p>}
                    <p style={{ fontSize: '11px', color: C.text, fontWeight: 700, textAlign: 'right', marginTop: '6px' }}>
                      Subtotal: {formatIDR(Math.round((item.quantity || 0) * (item.price_per_unit || 0)))}
                    </p>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setItems([...items, emptyItem()])} style={{ ...sBtn(false), marginTop: '8px', width: '100%', fontSize: '12px' }}>
              + Tambah Item
            </button>
          </div>

          {/* Extra costs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><p style={sLabel}>BIAYA PENGIRIMAN</p><InputRupiah value={deliveryCost} onChange={setDeliveryCost} /></div>
            <div><p style={sLabel}>BIAYA LAIN-LAIN</p><InputRupiah value={otherCost} onChange={setOtherCost} /></div>
          </div>

          {/* Summary */}
          <div style={{ background: C.card, borderRadius: '12px', padding: '14px', border: `1px solid ${C.border}` }}>
            <SummaryLine label="Total Penjualan" value={formatIDR(totalAmount)} bold />
            <SummaryLine label="Total HPP" value={formatIDR(totalCogs)} />
            <SummaryLine label="Gross Profit" value={formatIDR(grossProfit)} color={grossProfit >= 0 ? C.green : C.red} />
            <SummaryLine label="Net Profit" value={formatIDR(netProfit)} color={netProfit >= 0 ? C.green : C.red} bold />
          </div>

          <div><p style={sLabel}>CATATAN</p><textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} style={{ ...sInput, resize: 'vertical' }} /></div>

          <button onClick={handleSubmit} disabled={createSale.isPending} style={{ ...sBtn(true), width: '100%', padding: '14px', fontSize: '14px', opacity: createSale.isPending ? 0.6 : 1 }}>
            {createSale.isPending ? 'Menyimpan...' : 'Buat Invoice'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Sheet: Payment ──────────────────────────────────────────────────────────
function SheetPayment({ sale, onClose }) {
  const recordPayment = useRecordSembakoPayment()
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState('cash')
  const [refNo, setRefNo] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))

  async function handleSubmit() {
    if (!amount || !sale) return
    await recordPayment.mutateAsync({
      sale_id: sale.id,
      customer_id: sale.customer_id,
      amount, payment_date: payDate, payment_method: method,
      reference_no: refNo || null, notes: null,
    })
    setAmount(0); setRefNo('')
    onClose()
  }

  return (
    <Sheet open={!!sale} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, width: '100%', maxWidth: '420px', padding: '24px', overflowY: 'auto' }}>
        <SheetHeader>
          <SheetTitle style={{ color: C.text, fontWeight: 900 }}>Catat Pembayaran</SheetTitle>
          <SheetDescription className="sr-only">Form untuk mencatat pembayaran invoice sembako.</SheetDescription>
        </SheetHeader>
        {sale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px', paddingBottom: '100px' }}>
            <div style={{ background: C.card, borderRadius: '10px', padding: '12px', border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{sale.invoice_number}</p>
              <p style={{ fontSize: '11px', color: C.muted }}>{sale.customer_name} · Total: {formatIDR(sale.total_amount)}</p>
              <p style={{ fontSize: '11px', color: C.red, fontWeight: 700 }}>Sisa: {formatIDR(sale.remaining_amount)}</p>
            </div>
            <div><p style={sLabel}>JUMLAH BAYAR</p><InputRupiah value={amount} onChange={setAmount} /></div>
            <div><p style={sLabel}>METODE</p>
              <SelectWrap>
                <select value={method} onChange={e => setMethod(e.target.value)} style={{ ...sInput, paddingRight: 32 }}>
                  {['cash','transfer','qris','giro','cek'].map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                </select>
              </SelectWrap>
            </div>
            <div><p style={sLabel}>NO REFERENSI</p><input style={sInput} value={refNo} onChange={e => setRefNo(e.target.value)} placeholder="Opsional" /></div>
            <div><p style={sLabel}>TANGGAL</p><input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} style={sInput} /></div>
            <button onClick={handleSubmit} disabled={recordPayment.isPending} style={{ ...sBtn(true), width: '100%', padding: '14px' }}>
              {recordPayment.isPending ? 'Menyimpan...' : 'Catat Pembayaran'}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2: TOKO & SUPPLIER
// ═══════════════════════════════════════════════════════════════════════════
function TabTokoSupplier({ isDesktop }) {
  const [sub, setSub] = useState('toko')
  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['toko', 'supplier'].map(s => (
          <button key={s} onClick={() => setSub(s)} style={{
            padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: sub === s ? 'rgba(234,88,12,0.15)' : C.card,
            color: sub === s ? C.accent : C.muted, fontWeight: 700, fontSize: '12px',
          }}>{s === 'toko' ? 'Toko / Customer' : 'Supplier'}</button>
        ))}
      </div>
      {sub === 'toko' ? <TokoSection isDesktop={isDesktop} /> : <SupplierSection isDesktop={isDesktop} />}
    </div>
  )
}

function TokoSection({ isDesktop }) {
  const { data: customers = [] } = useSembakoCustomers()
  const createCust = useCreateSembakoCustomer()
  const updateCust = useUpdateSembakoCustomer()
  const [editing, setEditing] = useState(null) // null | 'new' | customer obj
  const [form, setForm] = useState({})

  function openNew() { setForm({ customer_name: '', customer_type: 'warung', phone: '', address: '', area: '', payment_terms: 'cash', credit_limit: 0, reliability_score: 3, notes: '' }); setEditing('new') }
  function openEdit(c) { setForm({ ...c }); setEditing(c) }

  async function handleSave() {
    if (!form.customer_name) return
    if (editing === 'new') await createCust.mutateAsync(form)
    else await updateCust.mutateAsync({ id: editing.id, ...form })
    setEditing(null)
  }

  return (
    <div>
      <button onClick={openNew} style={{ ...sBtn(true), marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Plus size={14} /> Tambah Toko
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3,1fr)' : '1fr', gap: '12px' }}>
        {customers.map(c => (
          <div key={c.id} onClick={() => openEdit(c)} style={{
            background: C.card, borderRadius: '14px', padding: '14px', border: `1px solid ${C.border}`, cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(234,88,12,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Store size={16} color={C.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.customer_name}</p>
                <p style={{ fontSize: '10px', color: C.muted }}>{c.customer_type || 'warung'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '11px', color: c.total_outstanding > 0 ? C.red : C.muted, fontWeight: 600 }}>
                Piutang: {formatIDR(c.total_outstanding || 0)}
              </p>
              <div style={{ display: 'flex', gap: '1px' }}>
                {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={i <= (c.reliability_score || 0) ? C.amber : 'transparent'} color={i <= (c.reliability_score || 0) ? C.amber : C.muted} />)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CRUD Sheet */}
      <Sheet open={editing !== null} onOpenChange={v => !v && setEditing(null)}>
        <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, maxWidth: '420px', width: '100%', padding: '24px', overflowY: 'auto' }}>
          <SheetHeader>
            <SheetTitle style={{ color: C.text, fontWeight: 900 }}>{editing === 'new' ? 'Tambah Toko' : 'Edit Toko'}</SheetTitle>
            <SheetDescription className="sr-only">Form untuk mengelola data toko/customer sembako.</SheetDescription>
          </SheetHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', paddingBottom: '100px' }}>
            <div><p style={sLabel}>NAMA TOKO</p><input style={sInput} value={form.customer_name || ''} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></div>
            <div><p style={sLabel}>TIPE</p>
              <SelectWrap>
                <select style={{ ...sInput, paddingRight: 32 }} value={form.customer_type || 'warung'} onChange={e => setForm({ ...form, customer_type: e.target.value })}>
                  {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </SelectWrap>
            </div>
            <div><p style={sLabel}>NO HP</p><input style={sInput} value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9+]/g, '') })} /></div>
            <div><p style={sLabel}>ALAMAT</p><input style={sInput} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><p style={sLabel}>AREA</p><input style={sInput} value={form.area || ''} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="Kecamatan / kelurahan" /></div>
            <div><p style={sLabel}>PAYMENT TERMS</p>
              <SelectWrap>
                <select style={{ ...sInput, paddingRight: 32 }} value={form.payment_terms || 'cash'} onChange={e => setForm({ ...form, payment_terms: e.target.value })}>
                  {Object.entries(PAYMENT_TERMS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </SelectWrap>
            </div>
            <div><p style={sLabel}>CREDIT LIMIT</p><InputRupiah value={form.credit_limit || 0} onChange={v => setForm({ ...form, credit_limit: v })} /></div>
            <div><p style={sLabel}>RELIABILITY (1-5)</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1,2,3,4,5].map(i => (
                  <button key={i} onClick={() => setForm({ ...form, reliability_score: i })} style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: i <= (form.reliability_score || 0) ? 'rgba(245,158,11,0.2)' : C.input,
                    color: i <= (form.reliability_score || 0) ? C.amber : C.muted, fontWeight: 700,
                  }}>{i}</button>
                ))}
              </div>
            </div>
            <div><p style={sLabel}>CATATAN</p><textarea rows={2} style={{ ...sInput, resize: 'vertical' }} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <button onClick={handleSave} style={{ ...sBtn(true), width: '100%', padding: '14px' }}>Simpan</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function SupplierSection({ isDesktop }) {
  const { data: suppliers = [] } = useSembakoSuppliers()
  const createSup = useCreateSembakoSupplier()
  const updateSup = useUpdateSembakoSupplier()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})

  function openNew() { setForm({ supplier_name: '', phone: '', address: '', notes: '' }); setEditing('new') }
  function openEdit(s) { setForm({ ...s }); setEditing(s) }

  async function handleSave() {
    if (!form.supplier_name) return
    if (editing === 'new') await createSup.mutateAsync(form)
    else await updateSup.mutateAsync({ id: editing.id, ...form })
    setEditing(null)
  }

  return (
    <div>
      <button onClick={openNew} style={{ ...sBtn(true), marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Plus size={14} /> Tambah Supplier
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {suppliers.map(s => (
          <div key={s.id} onClick={() => openEdit(s)} style={{
            background: C.card, borderRadius: '12px', padding: '12px 14px',
            border: `1px solid ${C.border}`, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} color={C.green} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{s.supplier_name}</p>
              <p style={{ fontSize: '10px', color: C.muted }}>{s.phone || '-'} · {s.address || '-'}</p>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && <EmptyBox icon={Package} text="Belum ada supplier" />}
      </div>

      <Sheet open={editing !== null} onOpenChange={v => !v && setEditing(null)}>
        <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, maxWidth: '420px', width: '100%', padding: '24px', overflowY: 'auto' }}>
          <SheetHeader>
            <SheetTitle style={{ color: C.text, fontWeight: 900 }}>{editing === 'new' ? 'Tambah Supplier' : 'Edit Supplier'}</SheetTitle>
            <SheetDescription className="sr-only">Form untuk mengelola data supplier sembako.</SheetDescription>
          </SheetHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', paddingBottom: '100px' }}>
            <div><p style={sLabel}>NAMA SUPPLIER</p><input style={sInput} value={form.supplier_name || ''} onChange={e => setForm({ ...form, supplier_name: e.target.value })} /></div>
            <div><p style={sLabel}>NO HP</p><input style={sInput} value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9+]/g, '') })} /></div>
            <div><p style={sLabel}>ALAMAT</p><input style={sInput} value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div><p style={sLabel}>CATATAN</p><textarea rows={2} style={{ ...sInput, resize: 'vertical' }} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <button onClick={handleSave} style={{ ...sBtn(true), width: '100%', padding: '14px' }}>Simpan</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3: PENGIRIMAN
// ═══════════════════════════════════════════════════════════════════════════
function TabPengiriman({ isDesktop }) {
  const { data: deliveries = [] } = useSembakoDeliveries()
  const { data: sales = [] } = useSembakoSales()
  const { data: employees = [] } = useSembakoEmployees()
  const createDelivery = useCreateSembakoDelivery()
  const [openAdd, setOpenAdd] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ sale_id: '', employee_id: '', vehicle_type: '', vehicle_plate: '', delivery_date: new Date().toISOString().slice(0, 10), delivery_area: '', delivery_cost: 0, other_cost: 0, notes: '' })

  const filtered = filterStatus ? deliveries.filter(d => d.status === filterStatus) : deliveries

  async function handleCreate() {
    if (!form.delivery_date) return
    await createDelivery.mutateAsync({
      ...form,
      sale_id: form.sale_id || null,
      employee_id: form.employee_id || null,
      driver_name: employees.find(e => e.id === form.employee_id)?.full_name || form.driver_name || null,
    })
    setForm({ sale_id: '', employee_id: '', vehicle_type: '', vehicle_plate: '', delivery_date: new Date().toISOString().slice(0, 10), delivery_area: '', delivery_cost: 0, other_cost: 0, notes: '' })
    setOpenAdd(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setOpenAdd(true)} style={{ ...sBtn(true), display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={14} /> Tambah Trip
        </button>
        <SelectWrap style={{ width: 'auto', minWidth: '140px' }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...sInput, width: 'auto', minWidth: '140px', paddingRight: 32 }}>
            <option value="">Semua Status</option>
            {Object.entries(DELIVERY_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </SelectWrap>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2,1fr)' : '1fr', gap: '12px' }}>
        {filtered.map(d => {
          const st = DELIVERY_STATUS[d.status] || DELIVERY_STATUS.pending
          return (
            <div key={d.id} style={{ background: C.card, borderRadius: '14px', padding: '14px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>
                  {d.sembako_employees?.full_name || d.driver_name || 'Kurir'}
                </span>
                <span style={{ background: st.bg, color: st.color, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>{st.label}</span>
              </div>
              <p style={{ fontSize: '11px', color: C.muted }}>
                {d.vehicle_type && `${d.vehicle_type} `}{d.vehicle_plate && `· ${d.vehicle_plate} `}· {fmtDate(d.delivery_date)}
              </p>
              {d.delivery_area && <p style={{ fontSize: '11px', color: C.muted }}>Area: {d.delivery_area}</p>}
              <p style={{ fontSize: '11px', color: C.text, fontWeight: 600, marginTop: '6px' }}>
                Biaya: {formatIDR((d.delivery_cost || 0) + (d.other_cost || 0))}
              </p>
              {d.sembako_sales && <p style={{ fontSize: '10px', color: C.muted, marginTop: '4px' }}>Invoice: {d.sembako_sales.invoice_number}</p>}
            </div>
          )
        })}
        {filtered.length === 0 && <EmptyBox icon={Truck} text="Belum ada pengiriman" />}
      </div>

      {/* Add Trip Sheet */}
      <Sheet open={openAdd} onOpenChange={v => !v && setOpenAdd(false)}>
        <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, maxWidth: '420px', width: '100%', padding: '24px', overflowY: 'auto' }}>
          <SheetHeader>
            <SheetTitle style={{ color: C.text, fontWeight: 900 }}>Tambah Trip</SheetTitle>
            <SheetDescription className="sr-only">Form untuk menambah jadwal pengiriman sembako.</SheetDescription>
          </SheetHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', paddingBottom: '100px' }}>
            <div><p style={sLabel}>INVOICE (OPSIONAL)</p>
              <SelectWrap>
                <select style={{ ...sInput, paddingRight: 32 }} value={form.sale_id} onChange={e => setForm({ ...form, sale_id: e.target.value })}>
                  <option value="">— Tanpa Invoice —</option>
                  {sales.filter(s => s.payment_status !== 'lunas').map(s => <option key={s.id} value={s.id}>{s.invoice_number} — {s.customer_name}</option>)}
                </select>
              </SelectWrap>
            </div>
            <div><p style={sLabel}>SOPIR / KURIR</p>
              <SelectWrap>
                <select style={{ ...sInput, paddingRight: 32 }} value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                  <option value="">— Pilih pegawai —</option>
                  {employees.filter(e => e.status === 'aktif').map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.role})</option>)}
                </select>
              </SelectWrap>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><p style={sLabel}>KENDARAAN</p><input style={sInput} value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })} placeholder="Truk / Pickup" /></div>
              <div><p style={sLabel}>PLAT</p><input style={sInput} value={form.vehicle_plate} onChange={e => setForm({ ...form, vehicle_plate: e.target.value.toUpperCase() })} placeholder="B 1234 XX" /></div>
            </div>
            <div><p style={sLabel}>TANGGAL KIRIM</p><input type="date" style={sInput} value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} /></div>
            <div><p style={sLabel}>AREA PENGIRIMAN</p><input style={sInput} value={form.delivery_area} onChange={e => setForm({ ...form, delivery_area: e.target.value })} placeholder="Kecamatan / kota" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><p style={sLabel}>BIAYA KIRIM</p><InputRupiah value={form.delivery_cost} onChange={v => setForm({ ...form, delivery_cost: v })} /></div>
              <div><p style={sLabel}>BIAYA LAIN</p><InputRupiah value={form.other_cost} onChange={v => setForm({ ...form, other_cost: v })} /></div>
            </div>
            <div><p style={sLabel}>CATATAN</p><textarea rows={2} style={{ ...sInput, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <button onClick={handleCreate} disabled={createDelivery.isPending} style={{ ...sBtn(true), width: '100%', padding: '14px' }}>
              {createDelivery.isPending ? 'Menyimpan...' : 'Simpan Trip'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ── Shared Small Components ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{
      background: C.card, borderRadius: '14px', padding: '14px', border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(234,88,12,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
        <Icon size={14} color={color} />
      </div>
      <p style={{ fontSize: '10px', color: C.muted, fontWeight: 700, letterSpacing: '0.06em' }}>{label.toUpperCase()}</p>
      <p style={{ fontSize: '18px', fontWeight: 800, color: C.text, fontFamily: 'DM Sans', lineHeight: 1.2 }}>{value}</p>
    </motion.div>
  )
}

function SummaryLine({ label, value, color, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: '12px', color: C.muted, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '13px', color: color || C.text, fontWeight: bold ? 800 : 600 }}>{value}</span>
    </div>
  )
}

function EmptyBox({ icon: Icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted, gridColumn: '1 / -1' }}>
      <Icon size={32} color={C.muted} style={{ margin: '0 auto 8px' }} />
      <p style={{ fontSize: '13px', fontWeight: 600 }}>{text}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ background: C.card, borderRadius: '12px', height: '64px', border: `1px solid ${C.border}`, opacity: 0.5 }} />
      ))}
    </div>
  )
}
