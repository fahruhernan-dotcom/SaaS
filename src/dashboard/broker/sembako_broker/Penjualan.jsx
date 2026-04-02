import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Search, Plus, CreditCard, TrendingUp, CheckCircle2, AlertTriangle,
  FileText, ChevronDown, X, Truck, Store, Package, Star, Phone, MapPin,
  Clock, ArrowRightLeft, Pencil, Trash2, History, User, Smartphone,
  Info, Calendar, ChevronRight, Eye, Receipt, Loader2, Check, ChevronLeft
} from 'lucide-react'
import { 
  useSembakoProducts, useSembakoCustomers, useSembakoSales, useSembakoEmployees,
  useCreateSembakoProduct, useCreateSembakoSale, useCreateSembakoDelivery,
  useRecordSembakoPayment, useDeleteSembakoSale, useCreateSembakoReturn,
  useUpdateSembakoSale, useCreateSembakoCustomer
} from '@/lib/hooks/useSembakoData'
import SembakoInvoicePreview from './SembakoInvoicePreview'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import TopBar from '@/dashboard/_shared/components/TopBar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useDelayedData } from '@/lib/hooks/useDelayedData'

// ── Palette (matches Beranda.jsx) ──────────────────────────────────────────
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
  belum_lunas: { bg: 'rgba(239,68,68,0.20)',  color: C.red,   label: 'Belum Lunas', border: 'rgba(239,68,68,0.4)' },
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
const CUSTOMER_TYPE_OPTIONS = CUSTOMER_TYPES.map(t => ({ value: t, label: t.toUpperCase() }))
const PAYMENT_METHOD_OPTIONS = ['cash','transfer','qris','giro','cek'].map(m => ({ value: m, label: m.toUpperCase() }))

// â”€â”€ Shared UI Primitives â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const sInput = {
  background: C.input, border: `1px solid ${C.border}`, borderRadius: '10px',
  padding: '10px 12px', color: C.text, fontSize: '16px', fontWeight: 600,
  outline: 'none', width: '100%', appearance: 'none', WebkitAppearance: 'none',
  minHeight: '44px',
  colorScheme: 'dark',
}

function SelectWrap({ children, style }) {
  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      {children}
      <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
    </div>
  )
}

function CustomSelect({ value, onChange, options, placeholder, onAddNew, id }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        id={id}
        onClick={() => setOpen(!open)}
        style={{
          ...sInput,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: open ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
          transition: 'all 0.2s'
        }}
      >
        <span style={{ color: value ? C.text : C.muted, fontSize: '14px' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} color={C.muted} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 998 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                background: '#130C06', border: `1px solid ${C.border}`, borderRadius: '14px',
                zIndex: 999, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {options.length === 0 && !onAddNew && (
                  <div style={{ padding: '16px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
                    Tidak ada pilihan
                  </div>
                )}
                {options.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    style={{
                      padding: '12px 16px', fontSize: '14px', color: value === opt.value ? C.accent : C.text,
                      background: value === opt.value ? 'rgba(234,88,12,0.1)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <span>{opt.label}</span>
                    {value === opt.value && <Check size={14} />}
                  </div>
                ))}
              </div>
              {onAddNew && (
                <div
                  onClick={() => { onAddNew(); setOpen(false) }}
                  style={{
                    padding: '12px 16px', fontSize: '14px', color: C.accent,
                    fontWeight: 700, borderTop: `1px solid ${C.border}`,
                    cursor: 'pointer', background: 'rgba(234,88,12,0.05)',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <Plus size={14} /> Tambah Baru
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
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

function InputRupiah({ value, onChange, placeholder, style, disabled }) {
  const display = value ? Number(value).toLocaleString('id-ID') : ''
  return (
    <input style={{ ...sInput, ...style, opacity: disabled ? 0.5 : 1 }} placeholder={placeholder || 'Rp 0'}
      value={display ? `Rp ${display}` : ''}
      disabled={disabled}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9]/g, '')
        onChange(raw ? parseInt(raw) : 0)
      }} />
  )
}

function ProgressIndicator({ currentStep, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, padding: '16px 0', marginBottom: '20px', borderTop: `1px solid ${C.border}` }}>
      {steps.map((label, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0, flex: 1 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: done ? C.green : active ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
                border: done ? 'none' : active ? `2px solid ${C.green}` : `2px solid ${C.border}`,
              }}>
                {done
                  ? <Check size={12} color="white" strokeWidth={3} />
                  : <span style={{ fontSize: 10, fontWeight: 700, color: active ? C.green : C.muted }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontSize: 9, color: done ? C.green : active ? C.green : C.muted, textAlign: 'center', marginTop: 4, whiteSpace: 'nowrap', fontWeight: 600 }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, marginTop: 11, background: i < currentStep ? C.green : C.border }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{ background: C.card, padding: '16px', borderRadius: '20px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p style={{ fontSize: '11px', color: C.muted, fontWeight: 700, textTransform: 'uppercase' }}>{label}</p>
        <p style={{ fontSize: '18px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans' }}>{value}</p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1,2,3].map(i => (
        <Skeleton key={i} style={{ height: '140px', width: '100%', borderRadius: '20px', background: 'rgba(255,255,255,0.05)' }} />
      ))}
    </div>
  )
}

function EmptyBox({ icon: Icon, text }) {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: `1px dashed ${C.border}` }}>
      <Icon size={40} color={C.muted} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
      <p style={{ color: C.muted, fontSize: '14px', fontWeight: 600 }}>{text}</p>
    </div>
  )
}

function DetailRow({ label, value, color = C.text, bold, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontSize: '11px', color: C.muted, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ 
        fontSize: highlight ? '16px' : '13px', 
        fontWeight: bold || highlight ? 900 : 600, 
        color: color,
        fontFamily: highlight ? 'DM Sans' : 'inherit'
      }}>{value}</span>
    </div>
  )
}

function SummaryLine({ label, value, bold, color = C.text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontSize: '12px', color: C.muted }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: bold ? 800 : 500, color: color }}>{value}</span>
    </div>
  )
}

function generateWAMessage(sale, tenant) {
  const items = Array.isArray(sale.sembako_sale_items) ? sale.sembako_sale_items : (sale.items || [])
  const itemList = items.map(it => `- ${it.product_name || it.name} (${it.quantity || it.quantity_kg} ${it.unit || 'pcs'})`).join('\n')
  const status = sale.payment_status === 'lunas' ? '[LUNAS]' : '[BELUM LUNAS]'
  
  const text = `*NOTA PENJUALAN*\n` +
    `--------------------------\n` +
    `No: ${sale.invoice_number || sale.invoiceNumber || '-'}\n` +
    `Toko: ${sale.sembako_customers?.customer_name || sale.customer_name || sale.customerName || '-'}\n` +
    `Tanggal: ${new Date(sale.transaction_date || new Date()).toLocaleDateString('id-ID')}\n\n` +
    `*Detail Barang:*\n${itemList}\n\n` +
    `*Total: ${formatIDR(sale.total_amount || sale.revenue)}*\n` +
    `Status: ${status}\n` +
    ((sale.remaining_amount > 0 || sale.payment_status !== 'lunas') ? `Sisa Tagihan: ${formatIDR(sale.remaining_amount || (sale.total_amount || sale.revenue))}\n` : '') +
    `--------------------------\n` +
    `Terima kasih telah berbelanja di *${tenant?.business_name || 'Toko Kami'}*`

  return encodeURIComponent(text)
}

// â”€â”€ MAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function SembakoPenjualan() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const location = useLocation()
  const [openWizard, setOpenWizard] = useState(false)

  // Handle FAB action from BottomNav (?action=new)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'new') {
      setOpenWizard(true)
    }
  }, [location.search])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: '96px' }}>
      {!isDesktop && <TopBar title="Penjualan" />}
      <div style={{ padding: isDesktop ? '32px 40px' : '20px 16px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: isDesktop ? '28px' : '22px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans', marginBottom: '24px' }}>
          Penjualan & Invoice
        </h1>

        <TabInvoice isDesktop={isDesktop} openWizard={openWizard} setOpenWizard={setOpenWizard} />
      </div>
    </div>
  )
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TAB 1: INVOICE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function TabInvoice({ isDesktop, openWizard, setOpenWizard }) {
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

  const [selectedSaleId, setSelectedSaleId] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

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

  const [editSaleId, setEditSaleId] = useState(null)

  const selectedSale = useMemo(() => 
    sales.find(s => s.id === selectedSaleId), 
    [sales, selectedSaleId]
  )

  const handleOpenEdit = useCallback((sale) => {
    setEditSaleId(sale.id)
    setShowDetail(false)
    setOpenWizard(true)
  }, [])

  const handleWizardClose = useCallback((open) => {
    if (!open) {
      setOpenWizard(false)
      setEditSaleId(null)
    } else {
      setOpenWizard(true)
    }
  }, [])

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
        <button 
          type="button"
          onClick={() => setOpenWizard(true)} 
          style={{ ...sBtn(true), display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
        >
          <Plus size={15} /> Catat Penjualan
        </button>
      </div>

      {/* Table replaced with Cards */}
      {isLoading ? <LoadingSkeleton /> : paged.length === 0 ? (
        <EmptyBox icon={History} text="Belum ada invoice" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paged.map(sale => (
            <SembakoSaleCard 
              key={sale.id} 
              sale={sale} 
              onOpenDetail={() => {
                setSelectedSaleId(sale.id)
                setShowDetail(true)
              }}
            />
          ))}
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

      <SheetCreateInvoice open={openWizard} onOpenChange={handleWizardClose} editId={editSaleId} />
      <SembakoSaleDetailSheet 
        isOpen={showDetail} 
        onOpenChange={setShowDetail} 
        sale={selectedSale}
        onEdit={handleOpenEdit}
      />
    </div>
  )
}

function SembakoSaleCard({ sale, onOpenDetail }) {
  const navigate = useNavigate()
  const location = useLocation()
  const st = STATUS_STYLE[sale.payment_status] || STATUS_STYLE.belum_lunas
  const custName = sale.sembako_customers?.customer_name || sale.customer_name || 'Umum'

  // Calculate items summary from sembako_sale_items
  const items = Array.isArray(sale.sembako_sale_items) ? sale.sembako_sale_items : []
  const itemSummary = items.length > 0
    ? (items.length > 1 ? `${items[0].product_name} & ${items.length - 1} lainnya` : items[0].product_name)
    : 'Tidak ada item'

  // Delivery status dari sembako_deliveries
  const deliveries = Array.isArray(sale.sembako_deliveries) ? sale.sembako_deliveries : []
  const hasDelivered = deliveries.some(d => d.status === 'delivered')
  const hasPartial = deliveries.length > 0 && !hasDelivered
  const noDelivery = deliveries.length === 0

  const deliveryBadge = hasDelivered
    ? { label: 'Sudah Dikirim', bg: 'rgba(52,211,153,0.10)', color: '#34D399' }
    : hasPartial
    ? { label: 'Sebagian Dikirim', bg: 'rgba(96,165,250,0.10)', color: '#60A5FA' }
    : { label: 'Belum Dikirim', bg: 'rgba(245,158,11,0.10)', color: '#F59E0B' }

  function handleAturPengiriman(e) {
    e.stopPropagation()
    // Navigate ke pengiriman dengan saleId agar sheet auto-open
    const base = location.pathname.replace('/penjualan', '/pengiriman')
    navigate(`${base}?saleId=${sale.id}`)
  }

  return (
    <div 
      onClick={onOpenDetail}
      style={{
        background: C.card,
        borderRadius: '20px',
        border: `1px solid ${sale.remaining_amount > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        overflow: 'hidden',
        position: 'relative'
      }}
      className="group hover:bg-white/[0.02] active:scale-[0.99]"
    >
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(234,88,12,0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0
            }}>
              <Store size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{custName}</h3>
              <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{sale.invoice_number} · {fmtDate(sale.transaction_date)}</p>
            </div>
          </div>
          <Badge className={cn(
            "rounded-full px-3 py-1 border-none font-black text-[9px] uppercase tracking-wider",
            sale.payment_status === 'lunas' ? 'bg-emerald-500/10 text-emerald-400' : 
            sale.payment_status === 'sebagian' ? 'bg-amber-500/10 text-amber-500' : 
            'bg-red-500/10 text-red-500'
          )}>
            {st.label}
          </Badge>
        </div>

        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
          <div>
            <p style={{ fontSize: '9px', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item Produk</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemSummary}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '9px', fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tagihan</p>
            <p style={{ fontSize: '15px', fontWeight: 900, color: C.accent, marginTop: '2px' }}>{formatIDR(sale.total_amount)}</p>
          </div>
        </div>
      </div>

      {sale.remaining_amount > 0 && (
        <div style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.05)', borderTop: '1px solid rgba(239,68,68,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: C.red, textTransform: 'uppercase' }}>Sisa Piutang</span>
          <span style={{ fontSize: '13px', fontWeight: 900, color: C.red }}>{formatIDR(sale.remaining_amount)}</span>
        </div>
      )}

      {/* Delivery status footer */}
      <div style={{
        padding: '10px 16px', borderTop: `1px solid rgba(255,255,255,0.04)`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Truck size={11} color={deliveryBadge.color} />
          <span style={{
            fontSize: '10px', fontWeight: 800, color: deliveryBadge.color,
            background: deliveryBadge.bg, padding: '2px 8px', borderRadius: '5px',
          }}>
            {deliveryBadge.label}
          </span>
          {hasPartial && (
            <span style={{ fontSize: '10px', color: '#60A5FA' }}>
              {deliveries.length} pengiriman
            </span>
          )}
        </div>
        {!hasDelivered && (
          <button
            onClick={handleAturPengiriman}
            style={{
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.muted, borderRadius: '6px', padding: '4px 10px',
              fontSize: '10px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Atur Pengiriman
          </button>
        )}
      </div>
    </div>
  )
}

function SembakoSaleDetailSheet({ isOpen, onOpenChange, sale, onEdit }) {
  const { tenant, profile } = useAuth()
  const deleteSale = useDeleteSembakoSale()
  const createReturn = useCreateSembakoReturn()
  const isOwner = profile?.role === 'owner'
  const [payTarget, setPayTarget] = useState(null)
  const [invoiceModal, setInvoiceModal] = useState({ open: false, type: null })

  if (!sale) return null

  const items = Array.isArray(sale.sembako_sale_items) ? sale.sembako_sale_items : []
  const totalCogs = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.cogs_per_unit || 0)), 0)
  const profit = (sale.total_amount || 0) - totalCogs - (sale.delivery_cost || 0) - (sale.other_cost || 0)
  
  const handleWA = () => {
    const phone = sale.sembako_customers?.phone || ''
    const msg = generateWAMessage(sale, tenant)
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank')
  }

  const handleReturn = async () => {
    if (window.confirm('Catat RETUR untuk seluruh barang di nota ini? Stok akan dikembalikan ke gudang.')) {
      try {
        const returnItems = items.map(it => ({
          product_id: it.product_id,
          quantity: it.quantity,
          batch_id: it.batch_id || it.sembako_stock_out?.[0]?.batch_id // Fallback to finding batch if possible
        })).filter(it => it.product_id && it.batch_id) // Ensure we have enough info to reverse
        
        if (returnItems.length === 0) {
           return toast.error('Data batch produk tidak ditemukan. Retur gagal.')
        }

        await createReturn.mutateAsync({
          sale_id: sale.id,
          customer_id: sale.customer_id,
          items: returnItems
        })
        onOpenChange(false)
      } catch (e) {}
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Hapus transaksi ini secara permanen?')) {
      try {
        await deleteSale.mutateAsync(sale.id)
        toast.success('Transaksi dihapus')
        onOpenChange(false)
      } catch (e) {}
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', padding: 0 }}>
          <SheetHeader style={{ padding: '24px', borderBottom: `1px solid ${C.border}`, textAlign: 'left' }}>
            <SheetDescription className="sr-only">Detail rincian transaksi penjualan sembako</SheetDescription>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <SheetTitle style={{ color: C.text, fontWeight: 900, fontSize: '20px', fontFamily: 'DM Sans' }}>Detail Penjualan</SheetTitle>
                <p style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>{sale.invoice_number} · {fmtDate(sale.transaction_date)}</p>
              </div>
              <Badge className={cn(
                "rounded-full px-3 py-1 border-none font-black text-[10px] uppercase tracking-wider",
                sale.payment_status === 'lunas' ? 'bg-emerald-500/10 text-emerald-400' : 
                sale.payment_status === 'sebagian' ? 'bg-amber-500/10 text-amber-500' : 
                'bg-red-500/10 text-red-500'
              )}>
                {sale.payment_status?.toUpperCase() || '-'}
              </Badge>
            </div>
          </SheetHeader>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Section: Customer */}
            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: '16px' }}>
              <p style={sLabel}>TOKO / CUSTOMER</p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(234,88,12,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                   <Store size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: C.text }}>{sale.sembako_customers?.customer_name || sale.customer_name || 'Umum'}</p>
                  <p style={{ fontSize: '12px', color: C.muted }}>{sale.sembako_customers?.phone || '-'}</p>
                </div>
              </div>
            </div>

            {/* Section: Items Table */}
            <div>
              <p style={sLabel}>DAFTAR BARANG</p>
              <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px', color: C.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>Produk</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: C.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: C.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px', color: C.text, fontWeight: 600 }}>{it.product_name}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: C.text }}>{it.quantity} {it.unit}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: C.text, fontWeight: 700 }}>{formatIDR(it.price_per_unit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Financials */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
               <DetailRow label="Subtotal Barang" value={formatIDR(sale.total_amount)} />
               <DetailRow label="Biaya Kirim" value={formatIDR(sale.delivery_cost)} />
               <DetailRow label="Biaya Lainnya" value={formatIDR(sale.other_cost)} />
               <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
               <DetailRow label="Total Tagihan" value={formatIDR(sale.total_amount)} highlight />
               <DetailRow label="Sudah Dibayar" value={formatIDR(sale.paid_amount)} color={C.green} />
               <DetailRow label="Sisa Piutang" value={formatIDR(sale.remaining_amount)} color={sale.remaining_amount > 0 ? C.red : C.green} bold />
            </div>

            {/* Section: Profit Analysis (Owner Only) */}
            {isOwner && (
              <div style={{ background: 'rgba(52,211,153,0.05)', borderRadius: '16px', padding: '16px', border: `1px solid rgba(52,211,153,0.15)` }}>
                <p style={{ ...sLabel, color: C.green }}>ANALISIS LABA (INTERNAL)</p>
                <div style={{ marginTop: '8px' }}>
                  <DetailRow label="Total COGS / Modal" value={formatIDR(totalCogs)} />
                  <DetailRow label="Estimasi Net Profit" value={formatIDR(profit)} color={profit >= 0 ? C.green : C.red} bold highlight />
                </div>
              </div>
            )}

            {/* Section: Delivery Link */}
            {sale.sembako_deliveries?.[0] && (
               <div style={{ background: 'rgba(96,165,250,0.05)', borderRadius: '16px', padding: '16px', border: `1px solid rgba(96,165,250,0.15)` }}>
                  <p style={{ ...sLabel, color: '#60A5FA' }}>PENGIRIMAN</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Truck size={14} color="#60A5FA" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{sale.sembako_deliveries[0].vehicle_plate}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#60A5FA', textTransform: 'uppercase' }}>{sale.sembako_deliveries[0].status}</span>
                  </div>
               </div>
            )}
            
            {sale.notes && (
              <div>
                <p style={sLabel}>CATATAN</p>
                <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}`, marginTop: '8px' }}>
                  "{sale.notes}"
                </p>
              </div>
            )}
          </div>

          <div style={{ padding: '20px 24px 32px', borderTop: `1px solid ${C.border}`, background: C.bg, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               <button 
                  onClick={() => setInvoiceModal({ open: true, type: 'sale' })}
                  style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
               >
                 <FileText size={16} /> Invoice
               </button>
               {sale.payment_status !== 'lunas' && (
                 <button 
                    onClick={() => setPayTarget(sale)}
                    style={{ ...sBtn(true), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
                 >
                   <CreditCard size={16} /> Bayar
                 </button>
               )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               <button 
                  onClick={handleWA}
                  style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderColor: '#25D366', color: '#25D366' }}
               >
                 <Smartphone size={16} /> Kirim WA
               </button>
               <button 
                  onClick={handleReturn}
                  style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderColor: C.amber, color: C.amber }}
               >
                 <ArrowRightLeft size={16} /> Retur Barang
               </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
               <button 
                  onClick={() => onEdit(sale)}
                  style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
               >
                 <Pencil size={16} /> Edit
               </button>
               <button 
                  onClick={handleDelete}
                  style={{ ...sBtn(false), color: C.red, border: `1px solid rgba(239,68,68,0.2)`, background: 'rgba(239,68,68,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
                >
                 <Trash2 size={16} /> Hapus
               </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <SheetPayment sale={payTarget} onClose={() => setPayTarget(null)} />

      {sale && invoiceModal.open && (
        <InvoicePreviewModal
          type={invoiceModal.type === 'sale' ? 'rpa_to_toko' : invoiceModal.type}
          isOpen={invoiceModal.open}
          onClose={() => setInvoiceModal({ open: false, type: null })}
          data={{
            tenant:      { business_name: tenant?.business_name, phone: tenant?.phone, location: tenant?.location },
            invoice:     sale,
            customer:    sale.sembako_customers,
            items:       items.map(it => ({
              product_name: it.product_name,
              quantity_kg: it.quantity, // Template uses quantity_kg but we'll pass generic qty
              price_per_kg: it.price_per_unit,
              cost_per_kg: it.cogs_per_unit,
              subtotal: (it.quantity || 0) * (it.price_per_unit || 0)
            })),
            generatedBy: profile?.full_name || '',
            showProfit:  false, // Customer invoice doesn't show profit
          }}
        />
      )}
    </>
  )
}

// â”€â”€ Sheet: Create Invoice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SheetCreateInvoice({ open, onOpenChange, editId }) {
  const { tenant } = useAuth()
  const { data: customers = [], isLoading: customersLoading } = useSembakoCustomers()
  const { data: products = [], isLoading: productsLoading } = useSembakoProducts()
  const { data: employees = [] } = useSembakoEmployees()
  const { data: allSales = [] } = useSembakoSales()
  
  const createSale = useCreateSembakoSale()
  const updateSale = useUpdateSembakoSale()
  const createCustomer = useCreateSembakoCustomer()
  const createProduct = useCreateSembakoProduct()
  const createDelivery = useCreateSembakoDelivery()
  const recordPayment = useRecordSembakoPayment()

  const [step, setStep] = useState(0) // 0: Cust, 1: Items, 2: Delivery, 3: Review
  const [custId, setCustId] = useState('')
  const [txnDate, setTxnDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState([{ product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])
  const [deliveryCost, setDeliveryCost] = useState(0)
  const [otherCost, setOtherCost] = useState(0)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  
  // Quick Add State
  const [quickAddCust, setQuickAddCust] = useState(false)
  const [newCustForm, setNewCustForm] = useState({ customer_name: '', customer_type: 'warung', phone: '', address: '', payment_terms: 'cash' })
  const [quickAddProd, setQuickAddProd] = useState(false)
  const [newProdForm, setNewProdForm] = useState({ product_name: '', category: 'lainnya', unit: 'pcs', sell_price: 0 })

  // Delivery State
  const [useDelivery, setUseDelivery] = useState(false)
  const [deliveryDriver, setDeliveryDriver] = useState('')
  const [deliveryVehicle, setDeliveryVehicle] = useState('')
  const [deliveryPlate, setDeliveryPlate] = useState('')
  const [deliveryArea, setDeliveryArea] = useState('')
  const [fuelCost, setFuelCost] = useState(0)

  // Payment Info for Step 3
  const [successData, setSuccessData] = useState(null)
  const [printData, setPrintData] = useState(null)
  const [printMode, setPrintMode] = useState('invoice')
  const lastPrefillKeyRef = useRef(null)

  // Memoized options — prevents Radix ref-composition re-render loop
  const customerOptions = useMemo(() =>
    customers.map(c => ({ value: c.id, label: c.customer_name })),
    [customers]
  )
  const productOptions = useMemo(() =>
    products.map(p => ({ value: p.id, label: `${p.product_name} (${p.current_stock} ${p.unit})` })),
    [products]
  )
  const employeeOptions = useMemo(() =>
    [{ value: '', label: '-- Belum Ditentukan --' }, ...employees.filter(e => e.status === 'aktif').map(e => ({ value: e.id, label: `${e.full_name} (${e.role})` }))],
    [employees]
  )

  const editSale = useMemo(() => {
    if (!editId) return null
    return allSales.find(s => s.id === editId) || null
  }, [allSales, editId])

  // Pre-fill if editing
  useEffect(() => {
    if (!open || !editSale) {
      if (!open) lastPrefillKeyRef.current = null
      return
    }

    const prefillKey = `${editSale.id}:${editSale.updated_at || editSale.transaction_date || ''}`
    if (lastPrefillKeyRef.current === prefillKey) return
    lastPrefillKeyRef.current = prefillKey

    setCustId(editSale.customer_id || '')
    setTxnDate(editSale.transaction_date?.slice(0, 10) || new Date().toISOString().slice(0, 10))
    setDueDate(editSale.due_date?.slice(0, 10) || '')
    setDeliveryCost(editSale.delivery_cost || 0)
    setOtherCost(editSale.other_cost || 0)
    setNotes(editSale.notes || '')

    if (Array.isArray(editSale.sembako_sale_items) && editSale.sembako_sale_items.length > 0) {
      setItems(editSale.sembako_sale_items.map(it => ({
        product_id: it.product_id,
        product_name: it.product_name,
        unit: it.unit,
        quantity: it.quantity,
        price_per_unit: it.price_per_unit,
        cogs_per_unit: it.cogs_per_unit
      })))
    } else {
      setItems([{ product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])
    }
  }, [open, editSale])

  const selectedCust = customers.find(c => c.id === custId)
  const totalAmount = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.price_per_unit || 0)), 0)
  const totalCogs = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.cogs_per_unit || 0)), 0)
  const grossProfit = totalAmount - totalCogs

  function handleSelectCustomer(id) {
    setCustId(id)
    const c = customers.find(x => x.id === id)
    if (c?.payment_terms && PAYMENT_TERMS_DAYS[c.payment_terms]) {
      const d = new Date(txnDate)
      d.setDate(d.getDate() + PAYMENT_TERMS_DAYS[c.payment_terms])
      setDueDate(d.toISOString().slice(0, 10))
    }
  }

  async function handleSaveQuickCust() {
    if (!newCustForm.customer_name) { toast.error('Nama toko wajib diisi'); return }
    try {
      const res = await createCustomer.mutateAsync(newCustForm)
      if (res && res.id) { handleSelectCustomer(res.id); setQuickAddCust(false) }
    } catch (e) {
       // Error handled by hook
    }
  }

  async function handleSaveQuickProd(idx) {
    if (!newProdForm.product_name) { toast.error('Nama produk wajib diisi'); return }
    try {
      await createProduct.mutateAsync({ ...newProdForm, current_stock: 0, avg_buy_price: 0, is_active: true })
      setQuickAddProd(false)
      // We can't immediately select it without the ID returning from the hook, so user just selects it from dropdown after it re-fetches
    } catch (e) {
       // Error handled by hook
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

  async function handleSubmit() {
    const validItems = items.filter(i => i.product_id && i.quantity > 0)
    if (!validItems.length) { toast.error('Tambahkan minimal 1 produk'); return }
    
    try {
      const custName = selectedCust?.customer_name || 'Umum'
      
      if (editId) {
        // UPDATE MODE
        await updateSale.mutateAsync({
          id: editId,
          updates: {
            customer_id: custId || null,
            customer_name: custName,
            transaction_date: txnDate,
            due_date: dueDate || null,
            total_amount: totalAmount,
            total_cogs: totalCogs,
            delivery_cost: deliveryCost,
            other_cost: otherCost,
            notes,
          }
        })
        // For items update in Sembako, we keep it simple: we don't re-sync stock if items change during edit
        // because it would require complex FIFO reversals. 
        // We'll just update the header for now.
        toast.success('Pinjaman/Transaksi diperbarui')
        handleClose()
        return
      }

      // CREATE MODE
      const sale = await createSale.mutateAsync({
        customer_id: custId || null,
        customer_name: custName,
        transaction_date: txnDate,
        due_date: dueDate || null,
        items: validItems,
        delivery_cost: deliveryCost,
        other_cost: otherCost,
        notes,
      })

      if (payAmount > 0 && sale?.id) {
        await recordPayment.mutateAsync({
          sale_id: sale.id,
          customer_id: custId || null,
          amount: payAmount,
          payment_date: txnDate,
          payment_method: payMethod,
          reference_number: null,
          notes: 'Pembayaran awal (wizard)',
        })
      }

      if (useDelivery && sale?.id) {
          await createDelivery.mutateAsync({
            sale_id: sale.id,
            employee_id: deliveryDriver || null,
            driver_name: employees.find(e => e.id === deliveryDriver)?.full_name || null,
            vehicle_type: deliveryVehicle,
            vehicle_plate: deliveryPlate.toUpperCase(),
            delivery_date: txnDate,
            delivery_area: deliveryArea || selectedCust?.address || '',
            delivery_cost: deliveryCost,
            status: 'pending',
            notes: 'Otomatis dari wizard penjualan'
          })
      }

      const netProfit = grossProfit - deliveryCost - otherCost
      setSuccessData({
        id: sale.id,
        invoiceNumber: sale.invoice_number,
        invoice_number: sale.invoice_number, // for WA helper
        customerName: custName,
        customer_name: custName, // for WA helper
        revenue: totalAmount,
        total_amount: totalAmount, // for WA helper
        cogs: totalCogs,
        deliveryCost,
        delivery_cost: deliveryCost,
        otherCost,
        other_cost: otherCost,
        netProfit,
        hasDelivery: useDelivery,
        driverName: employees.find(e => e.id === deliveryDriver)?.full_name,
        transaction_date: txnDate,
        sembako_sale_items: validItems,
        remaining_amount: totalAmount - payAmount
      })

    } catch (err) {
      console.error(err)
    }
  }

  const handleClose = useCallback(() => {
    lastPrefillKeyRef.current = null
    setStep(0); setCustId(''); setItems([{ product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }]); 
    setDeliveryCost(0); setOtherCost(0); setNotes('');
    setPayAmount(0); setPayMethod('cash');
    setUseDelivery(false); setQuickAddCust(false); setQuickAddProd(false);
    onOpenChange(false)
  }, [onOpenChange])

  const handleSheetOpenChange = useCallback((v) => {
    if (!v) handleClose()
    else onOpenChange(true)
  }, [handleClose, onOpenChange])

  const steps = ['Pilih Toko', 'Input Produk', 'Pengiriman', 'Summary']

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    <Sheet open={open && !successData} onOpenChange={handleSheetOpenChange}>
      <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', padding: 0, boxShadow: '-12px 0 40px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <SheetTitle style={{ color: C.text, fontWeight: 900, fontSize: '20px', fontFamily: 'DM Sans' }}>
              {editId ? 'Edit Transaksi' : 'Catat Penjualan'}
            </SheetTitle>
          </div>
          <SheetDescription className="sr-only">Wizard untuk mencatat penjualan sembako baru.</SheetDescription>
          
          <ProgressIndicator currentStep={step} steps={steps} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 24px 24px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {!quickAddCust ? (
                    <div>
                      <p style={sLabel}>TOKO / CUSTOMER</p>
                      {customersLoading ? (
                        <div style={{ height: 48, borderRadius: 12, background: 'rgba(234,88,12,0.07)', animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg,rgba(234,88,12,0.07) 0%,rgba(234,88,12,0.13) 50%,rgba(234,88,12,0.07) 100%)' }} />
                      ) : (
                      <CustomSelect
                        id="invoice-customer"
                        value={custId}
                        placeholder="-- Pilih toko / customer --"
                        options={customerOptions}
                        onChange={val => handleSelectCustomer(val)}
                        onAddNew={() => setQuickAddCust(true)}
                      />
                      )}
                      {selectedCust && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '12px', padding: '12px', background: 'rgba(234,88,12,0.03)', border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: C.muted, fontWeight: 600 }}>Tipe:</span>
                            <span style={{ color: C.text, fontWeight: 700 }}>{selectedCust.customer_type?.toUpperCase() || '-'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: C.muted, fontWeight: 600 }}>Terms:</span>
                            <span style={{ color: C.accent, fontWeight: 800 }}>{PAYMENT_TERMS_LABEL[selectedCust.payment_terms] || selectedCust.payment_terms}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: C.muted, fontWeight: 600 }}>Piutang Aktif:</span>
                            <span style={{ color: C.red, fontWeight: 800 }}>{formatIDR(selectedCust.total_outstanding || 0)}</span>
                          </div>
                          
                          {/* Credit Limit Bar */}
                          {selectedCust.credit_limit > 0 && (
                            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '8px' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                                  <span style={{ color: C.muted, fontWeight: 800 }}>BATAS KREDIT: {formatIDR(selectedCust.credit_limit)}</span>
                                  <span style={{ color: (selectedCust.total_outstanding || 0) > selectedCust.credit_limit ? C.red : C.muted }}>
                                    {Math.round(((selectedCust.total_outstanding || 0) / selectedCust.credit_limit) * 100)}%
                                  </span>
                               </div>
                               <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ 
                                    height: '100%', 
                                    width: `${Math.min(100, ((selectedCust.total_outstanding || 0) / selectedCust.credit_limit) * 100)}%`,
                                    background: (selectedCust.total_outstanding || 0) > selectedCust.credit_limit ? C.red : C.accent,
                                    borderRadius: '2px'
                                  }} />
                               </div>
                               {(selectedCust.total_outstanding || 0) > selectedCust.credit_limit && (
                                 <p style={{ color: C.red, fontSize: '10px', fontWeight: 800, marginTop: '6px', textAlign: 'center' }}>
                                   ⚠️ BATAS KREDIT TERLAMPAUI!
                                 </p>
                               )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.accent}` }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                         <p style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>Toko Baru</p>
                         <button onClick={() => setQuickAddCust(false)} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer' }}><X size={16}/></button>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div><p style={sLabel}>NAMA TOKO</p><input style={sInput} value={newCustForm.customer_name} onChange={e => setNewCustForm({...newCustForm, customer_name: e.target.value})} placeholder="Contoh: Toko Berkah" /></div>
                          <div><p style={sLabel}>TIPE TOKO</p>
                            <CustomSelect value={newCustForm.customer_type} onChange={v => setNewCustForm({...newCustForm, customer_type: v})} options={CUSTOMER_TYPE_OPTIONS} placeholder="Pilih Tipe" />
                          </div>
                          <div><p style={sLabel}>NO HP</p><input style={sInput} value={newCustForm.phone} onChange={e => setNewCustForm({...newCustForm, phone: e.target.value})} placeholder="0812..." /></div>
                          <button onClick={handleSaveQuickCust} disabled={createCustomer.isPending} style={{ ...sBtn(true), width: '100%', marginTop: '8px' }}>
                             {createCustomer.isPending ? 'Menyimpan...' : 'Simpan Toko'}
                          </button>
                       </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div><p style={sLabel}>TANGGAL TRANS.</p><DatePicker value={txnDate} onChange={setTxnDate} /></div>
                    <div><p style={sLabel}>JATUH TEMPO</p><DatePicker value={dueDate || ''} onChange={setDueDate} /></div>
                  </div>

                  <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px dashed ${C.border}` }}>
                    <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.5 }}>
                      <span style={{ color: C.accent, fontWeight: 800 }}>Info:</span> Invoice number akan dibuat otomatis saat disimpan.
                    </p>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={sLabel}>ITEM PRODUK</p>
                    {productsLoading
                      ? <span style={{ fontSize: '10px', color: C.accent, fontWeight: 700 }}>Memuat produk...</span>
                      : <span style={{ fontSize: '10px', color: C.muted, fontWeight: 700 }}>{items.length} Item</span>
                    }
                  </div>
                  {productsLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[1,2].map(i => (
                        <div key={i} style={{ height: 90, borderRadius: 14, background: 'rgba(234,88,12,0.07)', backgroundImage: 'linear-gradient(90deg,rgba(234,88,12,0.07) 0%,rgba(234,88,12,0.13) 50%,rgba(234,88,12,0.07) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                      ))}
                    </div>
                  )}

                  {quickAddProd && (
                     <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.accent}`, marginBottom: '16px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                         <p style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>Produk Baru</p>
                         <button onClick={() => setQuickAddProd(false)} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer' }}><X size={16}/></button>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div><p style={sLabel}>NAMA PRODUK</p><input style={sInput} value={newProdForm.product_name} onChange={e => setNewProdForm({...newProdForm, product_name: e.target.value})} placeholder="Beras Maknyus 5Kg" /></div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div><p style={sLabel}>KATEGORI</p><input style={sInput} value={newProdForm.category} onChange={e => setNewProdForm({...newProdForm, category: e.target.value})} /></div>
                            <div><p style={sLabel}>SATUAN</p><input style={sInput} value={newProdForm.unit} onChange={e => setNewProdForm({...newProdForm, unit: e.target.value})} placeholder="kg/pcs/sak" /></div>
                          </div>
                          <div><p style={sLabel}>HARGA JUAL STANDARD</p><InputRupiah value={newProdForm.sell_price} onChange={v => setNewProdForm({...newProdForm, sell_price: v})} /></div>
                          <button onClick={handleSaveQuickProd} disabled={createProduct.isPending} style={{ ...sBtn(true), width: '100%', marginTop: '8px' }}>
                             {createProduct.isPending ? 'Menyimpan...' : 'Simpan Produk'}
                          </button>
                       </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {items.map((item, idx) => {
                      const prod = products.find(p => p.id === item.product_id)
                      const overStock = prod && item.quantity > (prod.current_stock || 0)
                      return (
                        <div key={idx} style={{ background: C.card, borderRadius: '14px', padding: '16px', border: `1px solid ${overStock ? 'rgba(239,68,68,0.3)' : C.border}`, position: 'relative' }}>
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                            <CustomSelect
                              value={item.product_id}
                              placeholder="Pilih produk..."
                              options={productOptions}
                              onChange={val => handleItemChange(idx, 'product_id', val)}
                              onAddNew={() => setQuickAddProd(true)}
                              style={{ flex: 1 }}
                            />
                            {items.length > 1 && (
                              <button onClick={() => setItems(items.filter((_, i) => i !== idx))} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: C.red, width: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                            )}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <p style={{ ...sLabel, fontSize: '9px' }}>QTY ({item.unit || '...'})</p>
                              <input type="number" value={item.quantity || ''} onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)} style={{...sInput, width: '100%'}} />
                              {overStock && <p style={{ fontSize: '9px', color: C.red, marginTop: '4px', fontWeight: 700 }}>Stok tidak cukup</p>}
                            </div>
                            <div>
                              <p style={{ ...sLabel, fontSize: '9px' }}>HARGA JUAL / UNIT</p>
                              <InputRupiah value={item.price_per_unit} onChange={v => handleItemChange(idx, 'price_per_unit', v)} />
                              
                              {/* Last price hint */}
                              {selectedCust && item.product_id && (
                                <p style={{ fontSize: '9px', color: C.muted, marginTop: '4px', fontWeight: 600 }}>
                                   ✨ Terakhir: {formatIDR(item.price_per_unit || (prod?.sell_price || 0))}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <button onClick={() => setItems([...items, { product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])} 
                    style={{ ...sBtn(false), width: '100%', fontSize: '13px', border: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                    <Plus size={16} /> Tambah Item Lain
                  </button>
                  
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: C.muted, fontWeight: 700 }}>TOTAL SEMENTARA</span>
                      <span style={{ fontSize: '16px', color: C.text, fontWeight: 900 }}>{formatIDR(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.5 }}>
                    Apakah barang ini akan dikirim menggunakan armada sendiri? Jika ya, trip pengiriman akan otomatis dibuat.
                  </p>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: useDelivery ? 'rgba(96,165,250,0.1)' : C.card, border: `1px solid ${useDelivery ? '#60A5FA' : C.border}`, padding: '16px', borderRadius: '16px', transition: 'all 0.2s' }}>
                     <input type="checkbox" checked={useDelivery} onChange={e => setUseDelivery(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#60A5FA' }} />
                     <span style={{ fontSize: '14px', fontWeight: 700, color: useDelivery ? '#60A5FA' : C.text }}>Jadwalkan Pengiriman</span>
                  </label>

                  <AnimatePresence>
                     {useDelivery && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
                          <div><p style={sLabel}>SOPIR / KURIR (OPSIONAL)</p>
                            <CustomSelect 
                              value={deliveryDriver} 
                              onChange={v => setDeliveryDriver(v)}
                              options={employeeOptions}
                              placeholder="Pilih Kurir"
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div><p style={sLabel}>KENDARAAN</p><input style={sInput} value={deliveryVehicle} onChange={e => setDeliveryVehicle(e.target.value)} placeholder="Mobil Box/Pickup" /></div>
                            <div><p style={sLabel}>NO. PLAT</p><input style={sInput} value={deliveryPlate} onChange={e => setDeliveryPlate(e.target.value)} placeholder="B 1234 XY" /></div>
                          </div>
                           <div><p style={sLabel}>AREA PENGIRIMAN</p><input style={sInput} value={deliveryArea} onChange={e => setDeliveryArea(e.target.value)} placeholder="Contoh: Kec. Setiabudi" /></div>
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div><p style={sLabel}>BIAYA BBM (INTERNAL)</p><InputRupiah value={fuelCost} onChange={setFuelCost} /></div>
                              <div><p style={{ ...sLabel, color: C.accent }}>NET PROFIT STEP</p>
                                <div style={{ height: '44px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '13px', color: C.green, fontWeight: 900 }}>
                                  {formatIDR(grossProfit - deliveryCost - fuelCost - otherCost)}
                                </div>
                              </div>
                           </div>
                       </motion.div>
                     )}
                  </AnimatePresence>
                </div>
              )}

              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
                    <SummaryLine label="Toko / Customer" value={selectedCust?.customer_name || 'Umum'} bold />
                    <SummaryLine label="Jumlah Item" value={`${items.filter(i => i.product_id).length} Item`} />
                    <div style={{ height: '1px', background: C.border, margin: '8px 0' }} />
                    <SummaryLine label="Total Barang" value={formatIDR(totalAmount)} bold />
                    <SummaryLine label="Estimasi HPP" value={formatIDR(totalCogs)} />
                    <SummaryLine label="Est. Gross Profit" value={formatIDR(grossProfit)} color={grossProfit >= 0 ? C.green : C.red} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><p style={sLabel}>BIAYA KIRIM</p><InputRupiah value={deliveryCost} onChange={setDeliveryCost} /></div>
                    <div><p style={sLabel}>BIAYA LAIN</p><InputRupiah value={otherCost} onChange={setOtherCost} /></div>
                  </div>

                  <div style={{ background: 'rgba(52,211,153,0.04)', borderRadius: '16px', padding: '16px', border: `1px solid rgba(52,211,153,0.15)` }}>
                    <p style={{ ...sLabel, color: C.green }}>PEMBAYARAN AWAL (OPSIONAL)</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                      <InputRupiah value={payAmount} onChange={setPayAmount} placeholder="Jumlah bayar..." />
                      {payAmount > 0 && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {['cash', 'transfer', 'qris'].map(m => (
                            <button key={m} onClick={() => setPayMethod(m)} style={{ 
                              flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase',
                              background: payMethod === m ? C.green : 'transparent',
                              border: `1px solid ${payMethod === m ? C.green : C.border}`,
                              color: payMethod === m ? '#000' : C.muted,
                              cursor: 'pointer', transition: 'all 0.2s'
                            }}>{m}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div><p style={sLabel}>CATATAN INVOICE</p><textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} style={{ ...sInput, resize: 'none', height: '80px', fontSize: '14px' }} placeholder="Contoh: Titip di satpam, barang diskon..." /></div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '20px 24px 32px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '12px', background: C.bg }}>
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} style={{ ...sBtn(false), flex: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ChevronLeft size={16} /> Kembali
            </button>
          ) : (
            <button onClick={handleClose} style={{ ...sBtn(false), flex: 1, padding: '14px' }}>Batal</button>
          )}

          {step < 3 ? (
            <button onClick={() => {
              if (step === 0 && !custId && !selectedCust) { toast.error('Pilih toko dulu atau biarkan kosong jika Umum tidak ada di opsi (disarankan membuat toko)'); return }
              if (step === 1 && items.filter(i => i.product_id && i.quantity > 0).length === 0) { toast.error('Tambahkan minimal 1 produk'); return }
              setStep(step + 1)
            }} style={{ ...sBtn(true), flex: 2, padding: '14px', fontSize: '14px' }}>Lanjut →</button>
          ) : (
            <button onClick={handleSubmit} disabled={createSale.isPending} style={{ ...sBtn(true), flex: 2, padding: '14px', opacity: createSale.isPending ? 0.6 : 1, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {createSale.isPending ? <Loader2 className="animate-spin" size={18} /> : 'Simpan Invoice ✓'}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
    
    <SembakoSuccessCard 
      isOpen={!!successData} 
      onClose={() => { setSuccessData(null); handleClose() }} 
      data={successData} 
      onPrint={(mode) => { setPrintData(successData); setPrintMode(mode) }}
    />
    
    {printData && (
      <SembakoInvoicePreview 
        data={printData} 
        mode={printMode} 
        onClose={() => setPrintData(null)} 
      />
    )}
    </>
  )
}

// ── Sheet: Payment ──────────────────────────────────────────────────────────
function SheetPayment({ sale, onClose }) {
  const recordPayment = useRecordSembakoPayment()
  const [amount, setAmount] = useState(0)
  const handleSheetClose = useCallback((v) => { if (!v) onClose() }, [onClose])

  useEffect(() => {
    if (sale?.remaining_amount) setAmount(sale.remaining_amount)
    else setAmount(0)
  }, [sale])
  const [method, setMethod] = useState('cash')
  const [refNo, setRefNo] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))

  async function handleSubmit() {
    if (!amount || !sale) return
    await recordPayment.mutateAsync({
      sale_id: sale.id,
      customer_id: sale.customer_id,
      amount, payment_date: payDate, payment_method: method,
      reference_number: refNo || null, notes: null,
    })
    setAmount(0); setRefNo('')
    onClose()
  }

  return (
    <Sheet open={!!sale} onOpenChange={handleSheetClose}>
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
              <p style={{ fontSize: '11px', color: C.red, fontWeight: 900, letterSpacing: '0.02em' }}>Sisa tagihan: {formatIDR(sale.remaining_amount)}</p>
            </div>
            <div><p style={sLabel}>JUMLAH BAYAR</p><InputRupiah value={amount} onChange={setAmount} /></div>
            <div><p style={sLabel}>METODE</p>
              <CustomSelect
                value={method || 'cash'}
                onChange={val => setMethod(val)}
                options={PAYMENT_METHOD_OPTIONS}
                placeholder="Pilih metode"
              />
            </div>
            <div><p style={sLabel}>NO REFERENSI</p><input style={sInput} value={refNo} onChange={e => setRefNo(e.target.value)} placeholder="Opsional" /></div>
            <div><p style={sLabel}>TANGGAL</p><DatePicker value={payDate} onChange={setPayDate} placeholder="Pilih tanggal" /></div>
            <button onClick={handleSubmit} disabled={recordPayment.isPending} style={{ ...sBtn(true), width: '100%', padding: '14px' }}>
              {recordPayment.isPending ? 'Menyimpan...' : 'Catat Pembayaran'}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ── Success Card ─────────────────────────────────────────────────────────────
function SembakoSuccessCard({ isOpen, onClose, data, onPrint }) {
  const { tenant } = useAuth()
  const handleSheetClose = useCallback((v) => { if (!v) onClose() }, [onClose])
  if (!data) return null

  const handleWA = () => {
    // Need to find customer phone
    const msg = generateWAMessage(data, tenant)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetClose}>
      <SheetContent side="bottom" style={{ background: C.bg, maxWidth: '100%', height: 'auto', maxHeight: '90vh', padding: '0', borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column' }}>
        <SheetHeader className="sr-only">
          <SheetTitle>Penjualan Berhasil</SheetTitle>
          <SheetDescription>Ringkasan transaksi penjualan sembako yang baru saja disimpan.</SheetDescription>
        </SheetHeader>
        <div style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ width: 80, height: 80, borderRadius: '24px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(16,185,129,0.2)' }}
          >
            <motion.svg width="40" height="40" viewBox="0 0 50 50">
              <motion.circle cx="25" cy="25" r="22" fill="none" stroke="#10B981" strokeWidth="4" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} />
              <motion.path d="M 14 26 L 22 34 L 38 16" fill="transparent" stroke="#10B981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }} />
            </motion.svg>
          </motion.div>
          
          <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans', marginBottom: '8px' }}>
            Penjualan Berhasil!
          </h2>
          <p style={{ textAlign: 'center', fontSize: '13px', color: C.muted, marginBottom: '24px' }}>
            Invoice <strong style={{ color: C.text }}>{data.invoiceNumber || 'Baru'}</strong> telah dicatat untuk <strong style={{ color: C.text }}>{data.customerName}</strong>.
          </p>

          <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}`, marginBottom: '16px' }}>
            <DetailRow label="Total Tagihan" value={formatIDR(data.revenue || 0)} bold />
            <DetailRow label="Estimasi HPP" value={formatIDR(data.cogs || 0)} />
            {data.deliveryCost > 0 && <DetailRow label="Biaya Kirim (Tercatat)" value={formatIDR(data.deliveryCost || 0)} />}
            {data.otherCost > 0 && <DetailRow label="Biaya Lain" value={formatIDR(data.otherCost || 0)} />}
            <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: C.muted }}>Net Profit</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: data.netProfit >= 0 ? C.green : C.red }}>{formatIDR(data.netProfit || 0)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
             <button onClick={() => onPrint('invoice')} style={{ ...sBtn(false), height: '48px', fontSize: '11px', gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, color: C.text }}>
                <FileText size={16} /> INVOICE
             </button>
             <button onClick={() => onPrint('delivery')} style={{ ...sBtn(false), height: '48px', fontSize: '11px', gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, color: C.text }}>
                <Truck size={16} /> SURAT JALAN
             </button>
          </div>

          <button 
            onClick={handleWA} 
            style={{ ...sBtn(false), width: '100%', height: '48px', fontSize: '13px', marginBottom: '8px', borderColor: '#25D366', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Smartphone size={16} /> KIRIM STRUK KE WA
          </button>

          <button onClick={onClose} style={{ ...sBtn(true), width: '100%', height: '48px', fontSize: '15px' }}>
            Tutup & Kembali
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
