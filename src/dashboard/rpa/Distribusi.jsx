import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText, Store, Plus, Search, X, Package, Star, Phone,
  Pencil, AlertTriangle, TrendingUp, DollarSign, Download,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import TopBar from '../components/TopBar'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { addDays, parseISO, format, isAfter } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import {
  useRPACustomers, useRPAProducts, useRPAInvoices,
  useCreateCustomer, useUpdateCustomer, useCreateProduct,
  useCreateInvoice, useRecordCustomerPayment,
} from '@/lib/hooks/useRPAData'
import { useAuth } from '@/lib/hooks/useAuth'
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const INVOICE_STATUS_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'belum_lunas', label: 'Belum Lunas' },
  { key: 'sebagian', label: 'Sebagian' },
  { key: 'lunas', label: 'Lunas' },
  { key: 'overdue', label: 'Jatuh Tempo' },
]

const STATUS_CONFIG = {
  lunas: { label: 'Lunas', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  sebagian: { label: 'Sebagian', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  belum_lunas: { label: 'Belum Lunas', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
}

const CUSTOMER_TYPES = [
  { value: 'toko', label: 'Toko' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'restoran', label: 'Restoran' },
  { value: 'warung', label: 'Warung' },
  { value: 'pengepul', label: 'Pengepul' },
  { value: 'lainnya', label: 'Lainnya' },
]

const PRODUCT_TYPES = [
  { value: 'karkas', label: 'Karkas' },
  { value: 'fillet', label: 'Fillet' },
  { value: 'potongan', label: 'Potongan' },
  { value: 'jeroan', label: 'Jeroan' },
  { value: 'lainnya', label: 'Lainnya' },
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tunai' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'qris', label: 'QRIS' },
  { value: 'giro', label: 'Giro' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

const fmtDate = (d) => {
  if (!d) return '-'
  try { return format(new Date(d), 'd MMM yyyy', { locale: localeId }) } catch { return d }
}

const isOverdue = (inv) =>
  inv.payment_status !== 'lunas' && inv.due_date && isAfter(new Date(), new Date(inv.due_date))

const emptyItem = () => ({
  _id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  product_id: '', product_name: '', quantity_kg: '', price_per_kg: '', cost_per_kg: '',
})

const inputBase = (hasError) => ({
  width: '100%', padding: '9px 11px',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${hasError ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: '10px', color: '#F1F5F9', fontSize: '13px', outline: 'none',
  fontFamily: 'inherit',
})

const labelStyle = { fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '5px' }
const srOnly = { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0 }

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, overdue }) {
  const cfg = overdue && status !== 'lunas'
    ? { label: 'Jatuh Tempo', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' }
    : (STATUS_CONFIG[status] ?? { label: status, color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' })
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
    }}>
      {overdue && status !== 'lunas' && <AlertTriangle size={10} />}
      {cfg.label}
    </span>
  )
}

// ─── CustomerTypeBadge ────────────────────────────────────────────────────────

function CustomerTypeBadge({ type }) {
  const label = CUSTOMER_TYPES.find(t => t.value === type)?.label ?? type
  return (
    <span style={{
      background: 'rgba(167,139,250,0.12)', color: '#A78BFA',
      padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
    }}>
      {label}
    </span>
  )
}

// ─── InvoiceCard (mobile) ────────────────────────────────────────────────────

function InvoiceCard({ inv, onPay, onDetail, onPrintInvoice }) {
  const od = isOverdue(inv)
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${od && inv.payment_status !== 'lunas' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '14px', padding: '14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#F59E0B', fontWeight: 700 }}>
            {inv.invoice_number}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9', marginTop: '2px' }}>
            {inv.customer_name ?? inv.rpa_customers?.customer_name}
          </div>
          <div style={{ fontSize: '12px', color: '#4B6478', marginTop: '2px' }}>
            {fmtDate(inv.transaction_date)}
            {inv.due_date && (
              <span style={{ marginLeft: '8px', color: od ? '#EF4444' : '#4B6478' }}>
                Jatuh: {fmtDate(inv.due_date)}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={inv.payment_status} overdue={od} />
      </div>

      <div style={{
        marginTop: '12px', paddingTop: '10px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#4B6478' }}>Total</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>{fmt(inv.total_amount)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#4B6478' }}>Dibayar</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#34D399' }}>{fmt(inv.paid_amount)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#4B6478' }}>Sisa</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>
            {fmt(inv.remaining_amount ?? (inv.total_amount - inv.paid_amount))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        {inv.payment_status !== 'lunas' && (
          <button
            onClick={() => onPay(inv)}
            style={{
              flex: 1, padding: '8px',
              background: '#F59E0B', border: 'none', borderRadius: '9px',
              color: '#0D1117', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            }}
          >
            Catat Pembayaran
          </button>
        )}
        {onPrintInvoice && (
          <button
            onClick={() => onPrintInvoice(inv)}
            style={{
              flex: inv.payment_status !== 'lunas' ? '0 0 auto' : 1,
              padding: '8px 12px',
              background: 'transparent',
              border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: '9px', color: '#F59E0B',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            }}
          >
            <Download size={13} />
            Invoice PDF
          </button>
        )}
      </div>
    </div>
  )
}

// ─── CreateInvoiceSheet ───────────────────────────────────────────────────────

function CreateInvoiceSheet({ open, onClose, customers, products }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const createInvoice = useCreateInvoice()

  const [form, setForm] = useState({
    customer_id: '', transaction_date: new Date().toISOString().slice(0, 10),
    due_date: '', notes: '',
  })
  const [items, setItems] = useState([emptyItem()])
  const [errors, setErrors] = useState({})

  const selectedCustomer = customers.find(c => c.id === form.customer_id)

  // Outstanding for selected customer (from invoices — not needed here, computed in parent)
  const outstanding = useMemo(() => {
    // placeholder — actual outstanding is per customer, passed via prop or computed
    return null
  }, [form.customer_id])

  function handleCustomerChange(val) {
    const customer = customers.find(c => c.id === val)
    const newDueDate = form.transaction_date && customer?.payment_terms
      ? format(addDays(parseISO(form.transaction_date), Number(customer.payment_terms)), 'yyyy-MM-dd')
      : form.due_date
    setForm(prev => ({ ...prev, customer_id: val, due_date: newDueDate }))
  }

  function handleDateChange(date) {
    const customer = customers.find(c => c.id === form.customer_id)
    const newDueDate = date && customer?.payment_terms
      ? format(addDays(parseISO(date), Number(customer.payment_terms)), 'yyyy-MM-dd')
      : form.due_date
    setForm(prev => ({ ...prev, transaction_date: date, due_date: newDueDate }))
  }

  function handleItemProductSelect(itemId, productId) {
    const product = products.find(p => p.id === productId)
    setItems(prev => prev.map(it => it._id !== itemId ? it : {
      ...it,
      product_id: productId,
      product_name: product?.product_name ?? '',
      price_per_kg: product?.sell_price ?? it.price_per_kg,
      cost_per_kg: product?.cost_price ?? it.cost_per_kg,
    }))
  }

  function updateItem(itemId, field, value) {
    setItems(prev => prev.map(it => it._id !== itemId ? it : { ...it, [field]: value }))
  }

  const totals = useMemo(() => {
    const totalAmount = items.reduce((s, it) =>
      s + Math.round((Number(it.quantity_kg) || 0) * (Number(it.price_per_kg) || 0)), 0)
    const totalCost = items.reduce((s, it) =>
      s + Math.round((Number(it.quantity_kg) || 0) * (Number(it.cost_per_kg) || 0)), 0)
    return { totalAmount, totalCost, grossProfit: totalAmount - totalCost }
  }, [items])

  function validate() {
    const e = {}
    if (!form.customer_id) e.customer_id = 'Pilih toko'
    if (!form.transaction_date) e.transaction_date = 'Isi tanggal'
    const validItems = items.filter(it => it.product_name && Number(it.quantity_kg) > 0)
    if (validItems.length === 0) e.items = 'Minimal satu item'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const validItems = items.filter(it => it.product_name && Number(it.quantity_kg) > 0)
    const customer = customers.find(c => c.id === form.customer_id)
    createInvoice.mutate({
      customer_id: form.customer_id,
      customer_name: customer?.customer_name ?? '',
      transaction_date: form.transaction_date,
      due_date: form.due_date || null,
      items: validItems.map(it => ({
        product_id: it.product_id || null,
        product_name: it.product_name,
        quantity_kg: Number(it.quantity_kg),
        price_per_kg: Number(it.price_per_kg),
        cost_per_kg: Number(it.cost_per_kg) || 0,
      })),
      notes: form.notes || null,
    }, {
      onSuccess: () => {
        setForm({ customer_id: '', transaction_date: new Date().toISOString().slice(0, 10), due_date: '', notes: '' })
        setItems([emptyItem()])
        setErrors({})
        onClose()
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        style={{
          background: '#0D1117', border: 'none',
          ...(isDesktop ? { width: '520px', maxWidth: '100vw', overflowY: 'auto' } : { maxHeight: '95vh', borderRadius: '20px 20px 0 0', overflowY: 'auto' }),
        }}
      >
        <SheetHeader style={{ padding: '20px 20px 0' }}>
          <SheetTitle style={{ color: '#F1F5F9', fontFamily: 'Sora', fontSize: '18px' }}>
            Buat Invoice Baru
          </SheetTitle>
        </SheetHeader>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Customer Select */}
          <div>
            <label htmlFor="inv-customer" style={labelStyle}>
              Toko / Pelanggan <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              id="inv-customer"
              name="customer_id"
              value={form.customer_id}
              onChange={e => handleCustomerChange(e.target.value)}
              style={{ ...inputBase(!!errors.customer_id), padding: '10px 12px' }}
            >
              <option value="" style={{ background: '#0D1117' }}>Pilih toko...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#0D1117' }}>
                  {c.customer_name}
                </option>
              ))}
            </select>
            {customers.length === 0 && (
              <p style={{ fontSize: '12px', color: '#F59E0B', marginTop: '4px' }}>
                Belum ada toko. Tambah toko di tab "Toko & Produk" terlebih dahulu.
              </p>
            )}
            {errors.customer_id && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '3px' }}>{errors.customer_id}</p>}
            {selectedCustomer && (
              <div style={{
                marginTop: '6px', padding: '8px 12px',
                background: 'rgba(245,158,11,0.05)', borderRadius: '8px',
                fontSize: '12px', color: '#94A3B8',
                display: 'flex', gap: '12px',
              }}>
                <CustomerTypeBadge type={selectedCustomer.customer_type} />
                {selectedCustomer.payment_terms && (
                  <span>Tempo: {selectedCustomer.payment_terms} hari</span>
                )}
              </div>
            )}
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Tanggal Invoice <span style={{ color: '#EF4444' }}>*</span></label>
              <DatePicker
                value={form.transaction_date}
                onChange={handleDateChange}
                placeholder="Pilih tanggal"
              />
              {errors.transaction_date && <p style={{ fontSize: '11px', color: '#EF4444', marginTop: '3px' }}>{errors.transaction_date}</p>}
            </div>
            <div>
              <label style={labelStyle}>Jatuh Tempo</label>
              <DatePicker
                value={form.due_date}
                onChange={v => setForm(prev => ({ ...prev, due_date: v }))}
                placeholder="Otomatis"
              />
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ ...labelStyle, margin: 0 }}>
                Item Produk <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <span style={{ fontSize: '11px', color: '#4B6478' }}>
                {items.length} item
              </span>
            </div>
            {errors.items && <p style={{ fontSize: '12px', color: '#EF4444', marginBottom: '6px' }}>{errors.items}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((item, idx) => {
                const subtotal = Math.round((Number(item.quantity_kg) || 0) * (Number(item.price_per_kg) || 0))
                return (
                  <div key={item._id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', padding: '12px',
                  }}>
                    {/* Row 1: Product name + X */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label htmlFor={`pname-${item._id}`} style={labelStyle}>Produk</label>
                        {products.length > 0 ? (
                          <select
                            id={`pname-${item._id}`}
                            name={`product-select-${idx}`}
                            value={item.product_id}
                            onChange={e => {
                              const val = e.target.value
                              if (val === '__manual__') {
                                updateItem(item._id, 'product_id', '')
                              } else {
                                handleItemProductSelect(item._id, val)
                              }
                            }}
                            style={{ ...inputBase(false), fontSize: '13px' }}
                          >
                            <option value="" style={{ background: '#0D1117' }}>Ketik manual...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id} style={{ background: '#0D1117' }}>{p.product_name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={`pname-${item._id}`}
                            name={`product_name_${idx}`}
                            type="text"
                            value={item.product_name}
                            onChange={e => updateItem(item._id, 'product_name', e.target.value)}
                            placeholder="Nama produk"
                            style={inputBase(false)}
                          />
                        )}
                        {/* Editable name when product selected */}
                        {item.product_id && (
                          <input
                            id={`pname-manual-${item._id}`}
                            name={`product_name_manual_${idx}`}
                            type="text"
                            value={item.product_name}
                            onChange={e => updateItem(item._id, 'product_name', e.target.value)}
                            placeholder="Nama tampilan"
                            style={{ ...inputBase(false), marginTop: '6px', fontSize: '12px' }}
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setItems(prev => prev.filter(it => it._id !== item._id))}
                        disabled={items.length === 1}
                        style={{
                          marginTop: '18px', width: '30px', height: '30px', borderRadius: '8px',
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                          color: '#EF4444', cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                          opacity: items.length === 1 ? 0.4 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Row 2: Qty | Price | Cost | Subtotal */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      <div>
                        <label htmlFor={`qty-${item._id}`} style={labelStyle}>Qty (kg)</label>
                        <input
                          id={`qty-${item._id}`}
                          name={`qty_${idx}`}
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.quantity_kg}
                          onChange={e => updateItem(item._id, 'quantity_kg', e.target.value)}
                          placeholder="0"
                          style={inputBase(false)}
                        />
                      </div>
                      <div>
                        <label htmlFor={`price-${item._id}`} style={labelStyle}>Harga/kg</label>
                        <InputRupiah
                          id={`price-${item._id}`}
                          name={`price_${idx}`}
                          value={item.price_per_kg}
                          onChange={v => updateItem(item._id, 'price_per_kg', v)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label htmlFor={`cost-${item._id}`} style={labelStyle}>HPP/kg</label>
                        <InputRupiah
                          id={`cost-${item._id}`}
                          name={`cost_${idx}`}
                          value={item.cost_per_kg}
                          onChange={v => updateItem(item._id, 'cost_per_kg', v)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <div style={labelStyle}>Subtotal</div>
                        <div style={{
                          padding: '9px 8px', background: 'rgba(245,158,11,0.05)',
                          borderRadius: '10px', fontSize: '12px',
                          fontWeight: 700, color: '#F59E0B',
                        }}>
                          {subtotal > 0 ? fmt(subtotal).replace('Rp', '').trim() : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setItems(prev => [...prev, emptyItem()])}
              style={{
                marginTop: '8px', width: '100%', padding: '8px',
                background: 'transparent',
                border: '1px dashed rgba(245,158,11,0.4)',
                borderRadius: '10px', color: '#F59E0B',
                fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              <Plus size={14} />
              Tambah Item
            </button>
          </div>

          {/* Summary */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', padding: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>Total Revenue</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>{fmt(totals.totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>Total HPP</span>
              <span style={{ fontSize: '13px', color: '#64748B' }}>{fmt(totals.totalCost)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>Gross Profit</span>
              <span style={{
                fontSize: '14px', fontWeight: 700,
                color: totals.grossProfit >= 0 ? '#34D399' : '#EF4444',
              }}>
                {fmt(totals.grossProfit)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="inv-notes" style={labelStyle}>Catatan (opsional)</label>
            <textarea
              id="inv-notes"
              name="notes"
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              placeholder="Catatan tambahan..."
              style={{ ...inputBase(false), resize: 'none' }}
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={createInvoice.isPending}
            style={{
              padding: '13px', borderRadius: '12px',
              background: createInvoice.isPending ? 'rgba(245,158,11,0.4)' : '#F59E0B',
              border: 'none', color: '#0D1117', fontWeight: 700,
              fontSize: '15px', cursor: createInvoice.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {createInvoice.isPending ? 'Menyimpan...' : 'Buat Invoice'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── RecordPaymentSheet ───────────────────────────────────────────────────────

function RecordPaymentSheet({ invoice, onClose }) {
  const recordPayment = useRecordCustomerPayment()
  const [amount, setAmount] = useState(
    invoice ? (invoice.remaining_amount ?? (invoice.total_amount - invoice.paid_amount)) : ''
  )
  const [method, setMethod] = useState('transfer')
  const [refNo, setRefNo] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  if (!invoice) return null

  const remaining = invoice.remaining_amount ?? (invoice.total_amount - invoice.paid_amount)
  const afterPay = Math.max(0, remaining - (Number(amount) || 0))

  function handleSubmit() {
    if (!amount || Number(amount) <= 0) return
    recordPayment.mutate({
      invoice_id: invoice.id,
      customer_id: invoice.customer_id,
      amount: Number(amount),
      payment_date: payDate,
      payment_method: method,
      reference_no: refNo || null,
      notes: notes || null,
    }, { onSuccess: onClose })
  }

  return (
    <Sheet open={!!invoice} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        style={{ background: '#0D1117', border: 'none', maxHeight: '92vh', borderRadius: '20px 20px 0 0', overflowY: 'auto' }}
      >
        <SheetHeader style={{ padding: '20px 20px 0' }}>
          <SheetTitle style={{ color: '#F1F5F9', fontFamily: 'Sora', fontSize: '18px' }}>
            Catat Pembayaran
          </SheetTitle>
        </SheetHeader>

        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Invoice info */}
          <div style={{
            padding: '12px', background: 'rgba(245,158,11,0.05)',
            border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px',
          }}>
            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#F59E0B' }}>{invoice.invoice_number}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#F1F5F9', marginTop: '2px' }}>
              {invoice.customer_name ?? invoice.rpa_customers?.customer_name}
            </div>
            <div style={{ fontSize: '12px', color: '#4B6478', marginTop: '2px' }}>
              Sisa tagihan: <span style={{ color: '#F59E0B', fontWeight: 700 }}>{fmt(remaining)}</span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="pay-amount" style={labelStyle}>
              Jumlah Bayar <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <InputRupiah
              id="pay-amount"
              name="amount"
              value={amount}
              onChange={setAmount}
              placeholder="0"
            />
          </div>

          {/* Payment method pills */}
          <div>
            <label style={labelStyle}>Metode Pembayaran</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  style={{
                    padding: '8px 4px', borderRadius: '8px',
                    border: `1px solid ${method === m.value ? '#F59E0B' : 'rgba(255,255,255,0.08)'}`,
                    background: method === m.value ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                    color: method === m.value ? '#F59E0B' : '#64748B',
                    cursor: 'pointer', fontSize: '12px', fontWeight: method === m.value ? 700 : 400,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ref + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label htmlFor="pay-ref" style={labelStyle}>No. Bukti (opsional)</label>
              <input
                id="pay-ref"
                name="reference_no"
                type="text"
                value={refNo}
                onChange={e => setRefNo(e.target.value)}
                placeholder="Ref transfer, nota"
                style={inputBase(false)}
              />
            </div>
            <div>
              <label style={labelStyle}>Tanggal Bayar</label>
              <DatePicker value={payDate} onChange={setPayDate} />
            </div>
          </div>

          {/* Preview after pay */}
          <div style={{
            padding: '10px 12px', background: 'rgba(52,211,153,0.05)',
            border: '1px solid rgba(52,211,153,0.15)', borderRadius: '10px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>Sisa setelah bayar</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: afterPay === 0 ? '#34D399' : '#F59E0B' }}>
              {afterPay === 0 ? 'LUNAS 🎉' : fmt(afterPay)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={recordPayment.isPending || !amount || Number(amount) <= 0}
            style={{
              padding: '13px', borderRadius: '12px',
              background: recordPayment.isPending ? 'rgba(245,158,11,0.4)' : '#F59E0B',
              border: 'none', color: '#0D1117', fontWeight: 700,
              fontSize: '15px', cursor: recordPayment.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {recordPayment.isPending ? 'Menyimpan...' : 'Konfirmasi Pembayaran'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── CustomerFormSheet ────────────────────────────────────────────────────────

function CustomerFormSheet({ open, customer, onClose }) {
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const isEdit = !!customer

  const [form, setForm] = useState({
    customer_name: customer?.customer_name ?? '',
    customer_type: customer?.customer_type ?? 'toko',
    phone: customer?.phone ?? '',
    address: customer?.address ?? '',
    payment_terms: customer?.payment_terms ?? 14,
    credit_limit: customer?.credit_limit ?? '',
    reliability: customer?.reliability ?? 5,
  })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  function handleSubmit() {
    if (!form.customer_name.trim()) return
    const payload = {
      customer_name: form.customer_name.trim(),
      customer_type: form.customer_type,
      phone: form.phone || null,
      address: form.address || null,
      payment_terms: Number(form.payment_terms) || null,
      credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
      reliability: Number(form.reliability),
    }
    if (isEdit) {
      updateCustomer.mutate({ id: customer.id, updates: payload }, { onSuccess: onClose })
    } else {
      createCustomer.mutate(payload, { onSuccess: onClose })
    }
  }

  const isPending = createCustomer.isPending || updateCustomer.isPending

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        style={{ background: '#0D1117', border: 'none', maxHeight: '92vh', borderRadius: '20px 20px 0 0', overflowY: 'auto' }}
      >
        <SheetHeader style={{ padding: '20px 20px 0' }}>
          <SheetTitle style={{ color: '#F1F5F9', fontFamily: 'Sora', fontSize: '18px' }}>
            {isEdit ? 'Edit Toko' : 'Tambah Toko'}
          </SheetTitle>
        </SheetHeader>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label htmlFor="cust-name" style={labelStyle}>Nama Toko <span style={{ color: '#EF4444' }}>*</span></label>
            <input id="cust-name" name="customer_name" type="text" value={form.customer_name}
              onChange={e => set('customer_name', e.target.value)} placeholder="Toko Maju Jaya"
              style={inputBase(!form.customer_name)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="cust-type" style={labelStyle}>Tipe Pelanggan</label>
              <select id="cust-type" name="customer_type" value={form.customer_type}
                onChange={e => set('customer_type', e.target.value)} style={inputBase(false)}>
                {CUSTOMER_TYPES.map(t => (
                  <option key={t.value} value={t.value} style={{ background: '#0D1117' }}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cust-phone" style={labelStyle}>No. Telepon</label>
              <input id="cust-phone" name="phone" type="tel" value={form.phone}
                onChange={e => set('phone', e.target.value)} placeholder="0812..."
                style={inputBase(false)} />
            </div>
          </div>

          <div>
            <label htmlFor="cust-address" style={labelStyle}>Alamat</label>
            <input id="cust-address" name="address" type="text" value={form.address}
              onChange={e => set('address', e.target.value)} placeholder="Jl. ..."
              style={inputBase(false)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="cust-terms" style={labelStyle}>Tempo Bayar (hari)</label>
              <input id="cust-terms" name="payment_terms" type="number" min="0" value={form.payment_terms}
                onChange={e => set('payment_terms', e.target.value)} placeholder="14"
                style={inputBase(false)} />
            </div>
            <div>
              <label htmlFor="cust-limit" style={labelStyle}>Credit Limit (Rp)</label>
              <InputRupiah id="cust-limit" name="credit_limit" value={form.credit_limit}
                onChange={v => set('credit_limit', v)} placeholder="0" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Reliabilitas (1-5 bintang)</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => set('reliability', n)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    border: `1px solid ${n <= form.reliability ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    background: n <= form.reliability ? 'rgba(245,158,11,0.1)' : 'transparent',
                    color: n <= form.reliability ? '#F59E0B' : '#4B6478',
                    cursor: 'pointer', fontSize: '18px',
                  }}>
                  ★
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleSubmit} disabled={isPending}
            style={{
              padding: '13px', borderRadius: '12px',
              background: isPending ? 'rgba(245,158,11,0.4)' : '#F59E0B',
              border: 'none', color: '#0D1117', fontWeight: 700, fontSize: '15px',
              cursor: isPending ? 'not-allowed' : 'pointer',
            }}>
            {isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Toko'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── ProductFormSheet ─────────────────────────────────────────────────────────

function ProductFormSheet({ open, onClose }) {
  const createProduct = useCreateProduct()
  const [form, setForm] = useState({
    product_name: '', product_type: 'karkas', sell_price: '', cost_price: '',
  })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  function handleSubmit() {
    if (!form.product_name.trim()) return
    createProduct.mutate({
      product_name: form.product_name.trim(),
      product_type: form.product_type,
      sell_price: Number(form.sell_price) || 0,
      cost_price: Number(form.cost_price) || 0,
    }, {
      onSuccess: () => {
        setForm({ product_name: '', product_type: 'karkas', sell_price: '', cost_price: '' })
        onClose()
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        style={{ background: '#0D1117', border: 'none', maxHeight: '80vh', borderRadius: '20px 20px 0 0', overflowY: 'auto' }}
      >
        <SheetHeader style={{ padding: '20px 20px 0' }}>
          <SheetTitle style={{ color: '#F1F5F9', fontFamily: 'Sora', fontSize: '18px' }}>Tambah Produk</SheetTitle>
        </SheetHeader>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label htmlFor="prod-name" style={labelStyle}>Nama Produk <span style={{ color: '#EF4444' }}>*</span></label>
            <input id="prod-name" name="product_name" type="text" value={form.product_name}
              onChange={e => set('product_name', e.target.value)} placeholder="Karkas Broiler"
              style={inputBase(!form.product_name)} />
          </div>
          <div>
            <label htmlFor="prod-type" style={labelStyle}>Jenis Produk</label>
            <select id="prod-type" name="product_type" value={form.product_type}
              onChange={e => set('product_type', e.target.value)} style={inputBase(false)}>
              {PRODUCT_TYPES.map(t => (
                <option key={t.value} value={t.value} style={{ background: '#0D1117' }}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="prod-sell" style={labelStyle}>Harga Jual/kg</label>
              <InputRupiah id="prod-sell" name="sell_price" value={form.sell_price}
                onChange={v => set('sell_price', v)} placeholder="35.000" />
            </div>
            <div>
              <label htmlFor="prod-cost" style={labelStyle}>HPP/kg</label>
              <InputRupiah id="prod-cost" name="cost_price" value={form.cost_price}
                onChange={v => set('cost_price', v)} placeholder="28.000" />
            </div>
          </div>
          {form.sell_price && form.cost_price && (
            <div style={{
              padding: '10px 12px', background: 'rgba(52,211,153,0.05)',
              border: '1px solid rgba(52,211,153,0.1)', borderRadius: '10px',
              fontSize: '13px', color: '#94A3B8',
            }}>
              Margin:{' '}
              <span style={{ color: '#34D399', fontWeight: 700 }}>
                {((Number(form.sell_price) - Number(form.cost_price)) / Number(form.sell_price) * 100).toFixed(1)}%
              </span>
            </div>
          )}
          <button type="button" onClick={handleSubmit} disabled={createProduct.isPending}
            style={{
              padding: '13px', borderRadius: '12px',
              background: createProduct.isPending ? 'rgba(245,158,11,0.4)' : '#F59E0B',
              border: 'none', color: '#0D1117', fontWeight: 700, fontSize: '15px',
              cursor: createProduct.isPending ? 'not-allowed' : 'pointer',
            }}>
            {createProduct.isPending ? 'Menyimpan...' : 'Tambah Produk'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── CustomerCard ─────────────────────────────────────────────────────────────

function CustomerCard({ customer, outstanding, onClick, onEdit }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px', padding: '14px', cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>{customer.customer_name}</div>
          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <CustomerTypeBadge type={customer.customer_type} />
            {customer.phone && (
              <span style={{ fontSize: '12px', color: '#4B6478', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Phone size={11} />{customer.phone}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onEdit() }}
          style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#64748B', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Pencil size={13} />
        </button>
      </div>

      <div style={{
        marginTop: '10px', paddingTop: '10px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#4B6478' }}>Piutang</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: outstanding > 0 ? '#F59E0B' : '#4B6478' }}>
            {outstanding > 0 ? fmt(outstanding) : 'Lunas'}
          </div>
        </div>
        {customer.reliability && (
          <div style={{ display: 'flex', gap: '2px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={12}
                fill={i < (customer.reliability || 0) ? '#F59E0B' : 'transparent'}
                color={i < (customer.reliability || 0) ? '#F59E0B' : '#334155'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function RPADistribusi() {
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { tenant, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [mainTab, setMainTab] = useState('invoice')
  const [subTab, setSubTab] = useState('toko')
  const [invoiceFilter, setInvoiceFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [payingInvoice, setPayingInvoice] = useState(null)
  const [printingInvoice, setPrintingInvoice] = useState(null)
  const [customerSheet, setCustomerSheet] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [productSheet, setProductSheet] = useState(false)

  const { data: customers = [], isLoading: custLoading } = useRPACustomers()
  const { data: products = [], isLoading: prodLoading } = useRPAProducts()
  const { data: invoices = [], isLoading: invLoading } = useRPAInvoices()

  const invoiceSheetOpen = searchParams.get('action') === 'new'
  const openInvoiceSheet = () => setSearchParams({ action: 'new' })
  const closeInvoiceSheet = () => setSearchParams({}, { replace: true })

  // Per-customer outstanding map
  const outstandingByCustomer = useMemo(() => {
    const map = {}
    invoices.forEach(inv => {
      if (inv.payment_status !== 'lunas' && inv.customer_id) {
        map[inv.customer_id] = (map[inv.customer_id] || 0) +
          (inv.remaining_amount ?? (inv.total_amount - inv.paid_amount))
      }
    })
    return map
  }, [invoices])

  // Invoice stats
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const stats = useMemo(() => ({
    totalOutstanding: invoices.filter(i => i.payment_status !== 'lunas')
      .reduce((s, i) => s + (i.remaining_amount ?? (i.total_amount - i.paid_amount)), 0),
    revenueThisMonth: invoices.filter(i => new Date(i.transaction_date) > thirtyDaysAgo)
      .reduce((s, i) => s + (i.total_amount || 0), 0),
    lunas: invoices.filter(i => i.payment_status === 'lunas').length,
    overdue: invoices.filter(i => isOverdue(i)).length,
  }), [invoices])

  // Filtered invoices
  const filtered = useMemo(() => {
    let list = invoices
    if (invoiceFilter === 'overdue') list = list.filter(i => isOverdue(i))
    else if (invoiceFilter !== 'all') list = list.filter(i => i.payment_status === invoiceFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        (i.customer_name ?? '').toLowerCase().includes(q) ||
        (i.invoice_number ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [invoices, invoiceFilter, search])

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const AddInvoiceButton = (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={openInvoiceSheet}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 14px', borderRadius: '10px',
        background: '#F59E0B', border: 'none',
        color: '#0D1117', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <Plus size={15} />
      {isDesktop ? 'Buat Invoice' : 'Invoice'}
    </motion.button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#06090F' }}>
      {!isDesktop ? (
        <TopBar title="Distribusi" subtitle="Invoice & Toko" rightAction={mainTab === 'invoice' ? AddInvoiceButton : null} />
      ) : (
        <div style={{ padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 700, color: '#F1F5F9' }}>Distribusi</h1>
            <p style={{ fontSize: '14px', color: '#4B6478', marginTop: '4px' }}>Kelola invoice & penjualan ke toko</p>
          </div>
          {mainTab === 'invoice' && AddInvoiceButton}
        </div>
      )}

      <div style={{ padding: isDesktop ? '20px 32px' : '16px 16px 0' }}>
        {/* Main Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px' }}>
          {[{ key: 'invoice', label: 'Invoice', icon: FileText }, { key: 'toko', label: 'Toko & Produk', icon: Store }].map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setMainTab(t.key)} style={{
                flex: 1, padding: '9px', borderRadius: '9px',
                background: mainTab === t.key ? 'rgba(245,158,11,0.15)' : 'transparent',
                border: mainTab === t.key ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                color: mainTab === t.key ? '#F59E0B' : '#4B6478',
                cursor: 'pointer', fontSize: '13px', fontWeight: mainTab === t.key ? 700 : 400,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* ── TAB 1: INVOICE ── */}
        {mainTab === 'invoice' && (
          <div>
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Total Piutang', value: fmt(stats.totalOutstanding), color: '#F59E0B', warn: stats.totalOutstanding > 0 },
                { label: 'Revenue Bulan Ini', value: fmt(stats.revenueThisMonth), color: '#34D399' },
                { label: 'Invoice Lunas', value: stats.lunas, color: '#60A5FA' },
                { label: 'Jatuh Tempo', value: stats.overdue, color: '#EF4444', warn: stats.overdue > 0 },
              ].map(s => (
                <div key={s.label} style={{
                  background: s.warn ? `rgba(${s.color === '#EF4444' ? '239,68,68' : '245,158,11'},0.05)` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${s.warn ? (s.color === '#EF4444' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)') : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '12px', padding: '12px',
                }}>
                  <div style={{ fontSize: '11px', color: '#4B6478', marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: typeof s.value === 'number' ? '22px' : '14px', fontWeight: 700, color: s.color }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Filter + Search */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', flex: 1 }}>
                {INVOICE_STATUS_TABS.map(t => (
                  <button key={t.key} onClick={() => { setInvoiceFilter(t.key); setPage(0) }} style={{
                    flexShrink: 0, padding: '6px 12px', borderRadius: '20px',
                    border: invoiceFilter === t.key ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    background: invoiceFilter === t.key ? '#F59E0B' : 'rgba(255,255,255,0.03)',
                    color: invoiceFilter === t.key ? '#0D1117' : '#64748B',
                    fontSize: '12px', fontWeight: invoiceFilter === t.key ? 700 : 400,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative', minWidth: '160px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#4B6478' }} />
                <input
                  id="inv-search"
                  name="search"
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0) }}
                  placeholder="Cari toko / no. invoice"
                  style={{
                    padding: '8px 10px 8px 30px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', color: '#F1F5F9', fontSize: '13px', outline: 'none',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            {/* Invoice List */}
            {invLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: '120px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : paginated.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                <FileText size={40} color="#1E293B" />
                <p style={{ color: '#4B6478', marginTop: '12px', fontSize: '14px' }}>
                  {search || invoiceFilter !== 'all' ? 'Tidak ada invoice sesuai filter.' : 'Belum ada invoice.'}
                </p>
                {!search && invoiceFilter === 'all' && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={openInvoiceSheet} style={{
                    marginTop: '14px', padding: '10px 20px', borderRadius: '10px',
                    background: '#F59E0B', border: 'none', color: '#0D1117',
                    fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                  }}>
                    Buat Invoice Pertama
                  </motion.button>
                )}
              </div>
            ) : (
              <>
                {isDesktop ? (
                  /* Desktop Table */
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['Invoice #', 'Toko', 'Tanggal', 'Jatuh Tempo', 'Total', 'Dibayar', 'Sisa', 'Status', 'Aksi'].map(h => (
                            <th key={h} style={{
                              padding: '10px 14px', textAlign: 'left',
                              fontSize: '11px', fontWeight: 700,
                              color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((inv, idx) => {
                          const od = isOverdue(inv)
                          return (
                            <tr key={inv.id} style={{
                              borderBottom: idx < paginated.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            }}>
                              <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#F59E0B' }}>{inv.invoice_number}</td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: '#E2E8F0', fontWeight: 600 }}>
                                {inv.customer_name ?? inv.rpa_customers?.customer_name}
                              </td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: '#94A3B8' }}>{fmtDate(inv.transaction_date)}</td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: od ? '#EF4444' : '#94A3B8' }}>{fmtDate(inv.due_date)}</td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: '#F1F5F9', fontWeight: 600 }}>{fmt(inv.total_amount)}</td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: '#34D399' }}>{fmt(inv.paid_amount)}</td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: '#F59E0B', fontWeight: 600 }}>
                                {fmt(inv.remaining_amount ?? (inv.total_amount - inv.paid_amount))}
                              </td>
                              <td style={{ padding: '12px 14px' }}><StatusBadge status={inv.payment_status} overdue={od} /></td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  {inv.payment_status !== 'lunas' && (
                                    <button onClick={() => setPayingInvoice(inv)} style={{
                                      padding: '5px 10px', borderRadius: '7px',
                                      background: '#F59E0B', border: 'none',
                                      color: '#0D1117', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                                    }}>Bayar</button>
                                  )}
                                  <button
                                    onClick={() => setPrintingInvoice(inv)}
                                    title="Invoice PDF"
                                    style={{
                                      padding: '5px 8px', borderRadius: '7px',
                                      background: 'transparent',
                                      border: '1px solid rgba(245,158,11,0.3)',
                                      color: '#F59E0B', cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '4px',
                                      fontSize: '11px', fontWeight: 600,
                                    }}
                                  >
                                    <Download size={12} />
                                    PDF
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Mobile Cards */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {paginated.map(inv => (
                      <InvoiceCard
                        key={inv.id}
                        inv={inv}
                        onPay={setPayingInvoice}
                        onPrintInvoice={setPrintingInvoice}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{
                      padding: '7px 14px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#94A3B8', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1,
                    }}>‹ Prev</button>
                    <span style={{ padding: '7px 12px', fontSize: '13px', color: '#64748B' }}>
                      {page + 1} / {totalPages}
                    </span>
                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{
                      padding: '7px 14px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#94A3B8', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1,
                    }}>Next ›</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB 2: TOKO & PRODUK ── */}
        {mainTab === 'toko' && (
          <div>
            {/* Sub Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '3px', width: 'fit-content' }}>
              {[{ key: 'toko', label: 'Daftar Toko' }, { key: 'produk', label: 'Produk' }].map(t => (
                <button key={t.key} onClick={() => setSubTab(t.key)} style={{
                  padding: '7px 16px', borderRadius: '8px',
                  background: subTab === t.key ? 'rgba(245,158,11,0.15)' : 'transparent',
                  border: subTab === t.key ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                  color: subTab === t.key ? '#F59E0B' : '#4B6478',
                  cursor: 'pointer', fontSize: '13px', fontWeight: subTab === t.key ? 700 : 400,
                }}>{t.label}</button>
              ))}
            </div>

            {/* Toko Sub-Tab */}
            {subTab === 'toko' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#4B6478' }} />
                    <input
                      id="cust-search"
                      name="cust-search"
                      type="text"
                      placeholder="Cari nama toko..."
                      style={{ padding: '9px 10px 9px 30px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#F1F5F9', fontSize: '13px', outline: 'none', width: '100%' }}
                    />
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setCustomerSheet(true)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '10px',
                    background: '#F59E0B', border: 'none', color: '#0D1117',
                    fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0,
                  }}>
                    <Plus size={15} />
                    Tambah Toko
                  </motion.button>
                </div>

                {custLoading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: '10px' }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ height: '100px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
                    ))}
                  </div>
                ) : customers.length === 0 ? (
                  <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                    <Store size={40} color="#1E293B" />
                    <p style={{ color: '#4B6478', marginTop: '12px', fontSize: '14px' }}>Belum ada toko. Tambah toko pertama.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr', gap: '10px' }}>
                    {customers.map(c => (
                      <CustomerCard
                        key={c.id}
                        customer={c}
                        outstanding={outstandingByCustomer[c.id] || 0}
                        onClick={() => navigate(`/rpa-buyer/distribusi/${c.id}`)}
                        onEdit={() => setEditingCustomer(c)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Produk Sub-Tab */}
            {subTab === 'produk' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setProductSheet(true)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '10px',
                    background: '#F59E0B', border: 'none', color: '#0D1117',
                    fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                  }}>
                    <Plus size={15} />
                    Tambah Produk
                  </motion.button>
                </div>

                {prodLoading ? (
                  <div style={{ height: '100px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
                ) : products.length === 0 ? (
                  <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                    <Package size={40} color="#1E293B" />
                    <p style={{ color: '#4B6478', marginTop: '12px', fontSize: '14px' }}>Belum ada produk.</p>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
                    {products.map((p, idx) => {
                      const margin = p.sell_price && p.cost_price
                        ? ((p.sell_price - p.cost_price) / p.sell_price * 100).toFixed(1)
                        : null
                      return (
                        <div key={p.id} style={{
                          padding: '12px 16px',
                          borderBottom: idx < products.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#E2E8F0' }}>{p.product_name}</div>
                            <div style={{ fontSize: '12px', color: '#4B6478', marginTop: '2px' }}>
                              {PRODUCT_TYPES.find(t => t.value === p.product_type)?.label ?? p.product_type}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>{fmt(p.sell_price)}/kg</div>
                            <div style={{ fontSize: '11px', color: '#4B6478' }}>HPP: {fmt(p.cost_price)}/kg</div>
                            {margin && (
                              <div style={{ fontSize: '11px', color: '#34D399', fontWeight: 600 }}>Margin {margin}%</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sheets */}
      <CreateInvoiceSheet open={invoiceSheetOpen} onClose={closeInvoiceSheet} customers={customers} products={products} />
      <RecordPaymentSheet invoice={payingInvoice} onClose={() => setPayingInvoice(null)} />
      <CustomerFormSheet open={customerSheet} customer={null} onClose={() => setCustomerSheet(false)} />
      {editingCustomer && (
        <CustomerFormSheet open={!!editingCustomer} customer={editingCustomer} onClose={() => setEditingCustomer(null)} />
      )}
      <ProductFormSheet open={productSheet} onClose={() => setProductSheet(false)} />
      <InvoicePreviewModal
        type="rpa_to_toko"
        isOpen={!!printingInvoice}
        onClose={() => setPrintingInvoice(null)}
        data={printingInvoice ? {
          tenant,
          invoice: printingInvoice,
          customer: printingInvoice.rpa_customers,
          items: printingInvoice.rpa_invoice_items || [],
          showProfit: false,
          generatedBy: profile?.full_name,
        } : null}
      />
    </div>
  )
}
