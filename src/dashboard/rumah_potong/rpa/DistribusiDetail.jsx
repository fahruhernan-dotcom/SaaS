import { useState, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Phone, MapPin, Star, CreditCard, FileText, Pencil,
  TrendingUp, AlertTriangle, Plus,
} from 'lucide-react'
import { format, isAfter } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import TopBar from '../../_shared/components/TopBar'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import {
  useRPACustomers, useRPAInvoices,
  useCreateCustomer, useUpdateCustomer, useCreateInvoice, useRecordCustomerPayment,
} from '@/lib/hooks/useRPAData'

// Lazy-import sheets from Distribusi to avoid circular deps — inline them here
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { InputRupiah } from '@/components/ui/InputRupiah'

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  lunas: { label: 'Lunas', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  sebagian: { label: 'Sebagian', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  belum_lunas: { label: 'Belum Lunas', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
}

const CUSTOMER_TYPES = [
  { value: 'toko', label: 'Toko' }, { value: 'supermarket', label: 'Supermarket' },
  { value: 'restoran', label: 'Restoran' }, { value: 'warung', label: 'Warung' },
  { value: 'pengepul', label: 'Pengepul' }, { value: 'lainnya', label: 'Lainnya' },
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tunai' }, { value: 'transfer', label: 'Transfer' },
  { value: 'qris', label: 'QRIS' }, { value: 'giro', label: 'Giro' },
]

const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

const fmtDate = (d) => {
  if (!d) return '-'
  try { return format(new Date(d), 'd MMM yyyy', { locale: localeId }) } catch { return d }
}

const isOverdue = (inv) =>
  inv.payment_status !== 'lunas' && inv.due_date && isAfter(new Date(), new Date(inv.due_date))

const labelStyle = { fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '5px' }
const inputBase = (hasError) => ({
  width: '100%', padding: '9px 11px',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${hasError ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
  borderRadius: '10px', color: '#F1F5F9', fontSize: '13px', outline: 'none', fontFamily: 'inherit',
})

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, overdue }) {
  const cfg = overdue && status !== 'lunas'
    ? { label: 'Jatuh Tempo', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' }
    : (STATUS_CONFIG[status] ?? { label: status, color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' })
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
    }}>{cfg.label}</span>
  )
}

// ─── EditCustomerSheet ────────────────────────────────────────────────────────

function EditCustomerSheet({ open, customer, onClose }) {
  const updateCustomer = useUpdateCustomer()
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
    if (!form.customer_name.trim() || !customer) return
    updateCustomer.mutate({
      id: customer.id,
      updates: {
        customer_name: form.customer_name.trim(),
        customer_type: form.customer_type,
        phone: form.phone || null,
        address: form.address || null,
        payment_terms: Number(form.payment_terms) || null,
        credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
        reliability: Number(form.reliability),
      },
    }, { onSuccess: onClose })
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent
        side="bottom"
        style={{ background: '#0D1117', border: 'none', maxHeight: '92vh', borderRadius: '20px 20px 0 0', overflowY: 'auto' }}
      >
        <SheetHeader style={{ padding: '20px 20px 0' }}>
          <SheetTitle style={{ color: '#F1F5F9', fontFamily: 'Sora', fontSize: '18px' }}>Edit Info Toko</SheetTitle>
        </SheetHeader>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label htmlFor="edit-cust-name" style={labelStyle}>Nama Toko <span style={{ color: '#EF4444' }}>*</span></label>
            <input id="edit-cust-name" name="customer_name" type="text" value={form.customer_name}
              onChange={e => set('customer_name', e.target.value)} style={inputBase(!form.customer_name)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="edit-cust-type" style={labelStyle}>Tipe</label>
              <select id="edit-cust-type" name="customer_type" value={form.customer_type}
                onChange={e => set('customer_type', e.target.value)} style={inputBase(false)}>
                {CUSTOMER_TYPES.map(t => (
                  <option key={t.value} value={t.value} style={{ background: '#0D1117' }}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-cust-phone" style={labelStyle}>Telepon</label>
              <PhoneInput
                id="edit-cust-phone"
                name="phone"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                style={inputBase(false)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="edit-cust-address" style={labelStyle}>Alamat</label>
            <input id="edit-cust-address" name="address" type="text" value={form.address}
              onChange={e => set('address', e.target.value)} style={inputBase(false)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="edit-cust-terms" style={labelStyle}>Tempo Bayar (hari)</label>
              <input id="edit-cust-terms" name="payment_terms" type="number" min="0"
                value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)}
                style={inputBase(false)} />
            </div>
            <div>
              <label htmlFor="edit-cust-limit" style={labelStyle}>Credit Limit</label>
              <InputRupiah id="edit-cust-limit" name="credit_limit" value={form.credit_limit}
                onChange={v => set('credit_limit', v)} placeholder="0" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Reliabilitas</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => set('reliability', n)} style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  border: `1px solid ${n <= form.reliability ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  background: n <= form.reliability ? 'rgba(245,158,11,0.1)' : 'transparent',
                  color: n <= form.reliability ? '#F59E0B' : '#4B6478',
                  cursor: 'pointer', fontSize: '18px',
                }}>★</button>
              ))}
            </div>
          </div>
          <button type="button" onClick={handleSubmit} disabled={updateCustomer.isPending} style={{
            padding: '13px', borderRadius: '12px',
            background: updateCustomer.isPending ? 'rgba(245,158,11,0.4)' : '#F59E0B',
            border: 'none', color: '#0D1117', fontWeight: 700, fontSize: '15px',
            cursor: updateCustomer.isPending ? 'not-allowed' : 'pointer',
          }}>
            {updateCustomer.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
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

  if (!invoice) return null
  const remaining = invoice.remaining_amount ?? (invoice.total_amount - invoice.paid_amount)
  const afterPay = Math.max(0, remaining - (Number(amount) || 0))

  return (
    <Sheet open={!!invoice} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent side="bottom" style={{ background: '#0D1117', border: 'none', maxHeight: '88vh', borderRadius: '20px 20px 0 0', overflowY: 'auto' }}>
        <SheetHeader style={{ padding: '20px 20px 0' }}>
          <SheetTitle style={{ color: '#F1F5F9', fontFamily: 'Sora', fontSize: '18px' }}>Catat Pembayaran</SheetTitle>
        </SheetHeader>
        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px' }}>
            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#F59E0B' }}>{invoice.invoice_number}</div>
            <div style={{ fontSize: '12px', color: '#4B6478', marginTop: '2px' }}>
              Sisa: <span style={{ color: '#F59E0B', fontWeight: 700 }}>{fmt(remaining)}</span>
            </div>
          </div>
          <div>
            <label htmlFor="dp-amount" style={labelStyle}>Jumlah Bayar <span style={{ color: '#EF4444' }}>*</span></label>
            <InputRupiah id="dp-amount" name="amount" value={amount} onChange={setAmount} placeholder="0" />
          </div>
          <div>
            <label style={labelStyle}>Metode</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {PAYMENT_METHODS.map(m => (
                <button key={m.value} type="button" onClick={() => setMethod(m.value)} style={{
                  padding: '8px', borderRadius: '8px',
                  border: `1px solid ${method === m.value ? '#F59E0B' : 'rgba(255,255,255,0.08)'}`,
                  background: method === m.value ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                  color: method === m.value ? '#F59E0B' : '#64748B',
                  cursor: 'pointer', fontSize: '12px', fontWeight: method === m.value ? 700 : 400,
                }}>{m.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label htmlFor="dp-ref" style={labelStyle}>No. Bukti</label>
              <input id="dp-ref" name="reference_no" type="text" value={refNo}
                onChange={e => setRefNo(e.target.value)} placeholder="Ref..." style={inputBase(false)} />
            </div>
            <div>
              <label style={labelStyle}>Tanggal Bayar</label>
              <DatePicker value={payDate} onChange={setPayDate} />
            </div>
          </div>
          <div style={{
            padding: '10px 12px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '10px',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>Sisa setelah bayar</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: afterPay === 0 ? '#34D399' : '#F59E0B' }}>
              {afterPay === 0 ? 'LUNAS 🎉' : fmt(afterPay)}
            </span>
          </div>
          <button type="button" disabled={recordPayment.isPending || !amount || Number(amount) <= 0}
            onClick={() => recordPayment.mutate({
              invoice_id: invoice.id, customer_id: invoice.customer_id,
              amount: Number(amount), payment_date: payDate, payment_method: method,
              reference_no: refNo || null, notes: null,
            }, { onSuccess: onClose })}
            style={{
              padding: '13px', borderRadius: '12px',
              background: recordPayment.isPending ? 'rgba(245,158,11,0.4)' : '#F59E0B',
              border: 'none', color: '#0D1117', fontWeight: 700, fontSize: '15px',
              cursor: recordPayment.isPending ? 'not-allowed' : 'pointer',
            }}>
            {recordPayment.isPending ? 'Menyimpan...' : 'Konfirmasi Pembayaran'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function RPADistribusiDetail() {
  const { customerId } = useParams()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [invFilter, setInvFilter] = useState('all')
  const [editOpen, setEditOpen] = useState(false)
  const [payingInvoice, setPayingInvoice] = useState(null)

  const { data: customers = [] } = useRPACustomers()
  const { data: invoices = [], isLoading } = useRPAInvoices()

  const customer = customers.find(c => c.id === customerId)
  const custInvoices = useMemo(() =>
    invoices.filter(i => i.customer_id === customerId),
    [invoices, customerId]
  )

  const filtered = useMemo(() => {
    if (invFilter === 'all') return custInvoices
    if (invFilter === 'belum_lunas') return custInvoices.filter(i => i.payment_status !== 'lunas')
    return custInvoices.filter(i => i.payment_status === invFilter)
  }, [custInvoices, invFilter])

  const stats = useMemo(() => ({
    totalPurchases: custInvoices.reduce((s, i) => s + (i.total_amount || 0), 0),
    outstanding: custInvoices.filter(i => i.payment_status !== 'lunas')
      .reduce((s, i) => s + (i.remaining_amount ?? (i.total_amount - i.paid_amount)), 0),
    count: custInvoices.length,
    reliability: customer?.reliability ?? 0,
  }), [custInvoices, customer])

  if (!customer && customers.length > 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#06090F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#4B6478' }}>Toko tidak ditemukan.</p>
      </div>
    )
  }

  const customerTypeLbl = CUSTOMER_TYPES.find(t => t.value === customer?.customer_type)?.label ?? customer?.customer_type

  return (
    <div style={{ minHeight: '100vh', background: '#06090F' }}>
      {/* Header */}
      {!isDesktop ? (
        <TopBar
          title={customer?.customer_name ?? '...'}
          subtitle={customerTypeLbl}
          showBack
          rightAction={
            <button onClick={() => setEditOpen(true)} style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#94A3B8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Pencil size={15} />
            </button>
          }
        />
      ) : (
        <div style={{ padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 700, color: '#F1F5F9' }}>
                {customer?.customer_name ?? '...'}
              </h1>
              {customerTypeLbl && (
                <span style={{
                  background: 'rgba(167,139,250,0.12)', color: '#A78BFA',
                  padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                }}>
                  {customerTypeLbl}
                </span>
              )}
            </div>
            {customer?.address && (
              <p style={{ fontSize: '13px', color: '#4B6478', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} />{customer.address}
              </p>
            )}
          </div>
          <button onClick={() => setEditOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#94A3B8', cursor: 'pointer', fontSize: '13px',
          }}>
            <Pencil size={14} />
            Edit Info Toko
          </button>
        </div>
      )}

      <div style={{ padding: isDesktop ? '24px 32px' : '20px 16px' }}>
        <div style={{ display: isDesktop ? 'grid' : 'block', gridTemplateColumns: '1fr 300px', gap: '24px' }}>

          {/* Left: Stats + Invoice History */}
          <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '11px', color: '#4B6478', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <TrendingUp size={12} />Total Pembelian
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9' }}>{fmt(stats.totalPurchases)}</div>
              </div>
              <div style={{
                background: stats.outstanding > 0 ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${stats.outstanding > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '12px', padding: '14px',
              }}>
                <div style={{ fontSize: '11px', color: '#4B6478', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CreditCard size={12} />Outstanding
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: stats.outstanding > 0 ? '#F59E0B' : '#34D399' }}>
                  {stats.outstanding > 0 ? fmt(stats.outstanding) : 'Lunas'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '11px', color: '#4B6478', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileText size={12} />Total Invoice
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#60A5FA' }}>{stats.count}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '11px', color: '#4B6478', marginBottom: '4px' }}>Reliabilitas</div>
                <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16}
                      fill={i < stats.reliability ? '#F59E0B' : 'transparent'}
                      color={i < stats.reliability ? '#F59E0B' : '#334155'}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Invoice History */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>Riwayat Invoice</h3>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'belum_lunas', label: 'Belum Lunas' },
                  { key: 'lunas', label: 'Lunas' },
                ].map(t => (
                  <button key={t.key} onClick={() => setInvFilter(t.key)} style={{
                    padding: '5px 10px', borderRadius: '16px', fontSize: '12px',
                    border: invFilter === t.key ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    background: invFilter === t.key ? '#F59E0B' : 'rgba(255,255,255,0.03)',
                    color: invFilter === t.key ? '#0D1117' : '#64748B',
                    cursor: 'pointer', fontWeight: invFilter === t.key ? 700 : 400,
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div style={{ height: '120px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <FileText size={36} color="#1E293B" />
                <p style={{ color: '#4B6478', marginTop: '10px', fontSize: '13px' }}>Belum ada invoice.</p>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
                {filtered.map((inv, idx) => {
                  const od = isOverdue(inv)
                  return (
                    <div key={inv.id} style={{
                      padding: '12px 16px',
                      borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#F59E0B' }}>{inv.invoice_number}</div>
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
                        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginTop: '10px',
                        paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#4B6478' }}>Total</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>{fmt(inv.total_amount)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#4B6478' }}>Dibayar</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#34D399' }}>{fmt(inv.paid_amount)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#4B6478' }}>Sisa</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>
                            {fmt(inv.remaining_amount ?? (inv.total_amount - inv.paid_amount))}
                          </div>
                        </div>
                      </div>
                      {inv.payment_status !== 'lunas' && (
                        <button onClick={() => setPayingInvoice(inv)} style={{
                          marginTop: '8px', padding: '6px 14px', borderRadius: '8px',
                          background: '#F59E0B', border: 'none', color: '#0D1117',
                          fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                        }}>Catat Pembayaran</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right (desktop only): Customer Info */}
          {isDesktop && customer && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Info Toko
                </h3>
                {[
                  { label: 'Tipe', value: customerTypeLbl },
                  { label: 'Telepon', value: customer.phone },
                  { label: 'Alamat', value: customer.address },
                  { label: 'Tempo Bayar', value: customer.payment_terms ? `${customer.payment_terms} hari` : null },
                  {
                    label: 'Credit Limit',
                    value: customer.credit_limit ? fmt(customer.credit_limit) : null,
                  },
                ].map(row => row.value ? (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    fontSize: '13px',
                  }}>
                    <span style={{ color: '#4B6478' }}>{row.label}</span>
                    <span style={{ color: '#E2E8F0', fontWeight: 500, textAlign: 'right', maxWidth: '160px' }}>{row.value}</span>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </div>

        {/* Mobile: Customer Info card at bottom */}
        {!isDesktop && customer && (
          <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#4B6478', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Info Toko</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Tipe', value: customerTypeLbl },
                { label: 'Telepon', value: customer.phone },
                { label: 'Tempo', value: customer.payment_terms ? `${customer.payment_terms} hari` : null },
                { label: 'Credit Limit', value: customer.credit_limit ? fmt(customer.credit_limit) : null },
              ].map(row => row.value ? (
                <div key={row.label}>
                  <div style={{ fontSize: '11px', color: '#4B6478' }}>{row.label}</div>
                  <div style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 500, marginTop: '2px' }}>{row.value}</div>
                </div>
              ) : null)}
            </div>
          </div>
        )}
      </div>

      {/* Sheets */}
      {customer && (
        <EditCustomerSheet open={editOpen} customer={customer} onClose={() => setEditOpen(false)} />
      )}
      <RecordPaymentSheet invoice={payingInvoice} onClose={() => setPayingInvoice(null)} />
    </div>
  )
}
