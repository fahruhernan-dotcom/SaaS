import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Plus, Truck, User, MapPin,
  CheckCircle, Clock, Navigation,
} from 'lucide-react'
import {
  useSembakoSalesPendingDelivery, useSembakoDeliveries,
  useSembakoEmployees, useSembakoCustomers,
  useCreateSembakoDelivery, useCompleteSembakoDelivery,
} from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import TopBar from '@/dashboard/_shared/components/TopBar'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { Button } from '@/components/ui/button'
import {
  C, sInput, sLabel, sBtn, fmtDate, EmptyBox, CustomSelect,
} from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'

// ── Delivery-specific constants ───────────────────────────────────────────────
const DELIVERY_STATUS = {
  pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', label: 'Menunggu',         icon: Clock },
  on_route:  { bg: 'rgba(96,165,250,0.12)',  color: '#60A5FA', label: 'Dalam Perjalanan', icon: Navigation },
  delivered: { bg: 'rgba(52,211,153,0.12)',  color: '#34D399', label: 'Selesai',           icon: CheckCircle },
}

const FILTER_TABS = [
  { id: '',          label: 'Semua' },
  { id: 'pending',   label: 'Menunggu' },
  { id: 'on_route',  label: 'Dalam Perjalanan' },
  { id: 'delivered', label: 'Selesai' },
]

// ── Local UI ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const st = DELIVERY_STATUS[status] || DELIVERY_STATUS.pending
  return (
    <span style={{
      background: st.bg, color: st.color,
      fontSize: '10px', fontWeight: 800, padding: '3px 10px',
      borderRadius: '6px', letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {st.label}
    </span>
  )
}

// ── Sale Pending Card ─────────────────────────────────────────────────────────
function SalePendingCard({ sale, onBuatDelivery }) {
  const customer = sale.sembako_customers || {}
  const custName = customer.customer_name || sale.customer_name || 'Umum'
  const items = sale.sembako_sale_items || []
  const itemSummary = items.length > 0
    ? (items.length > 1 ? `${items[0].product_name} +${items.length - 1} lainnya` : items[0].product_name)
    : '-'
  const hasPartial = (sale.sembako_deliveries || []).length > 0

  return (
    <div style={{
      background: C.card, borderRadius: '16px', border: `1px solid ${C.borderAm}`,
      padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: C.text, margin: 0 }}>{custName}</p>
          <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
            {sale.invoice_number} · {fmtDate(sale.transaction_date)}
          </p>
        </div>
        <span style={{
          background: hasPartial ? 'rgba(96,165,250,0.12)' : 'rgba(245,158,11,0.12)',
          color: hasPartial ? C.blue : C.amber,
          fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '5px',
          letterSpacing: '0.05em', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '8px',
        }}>
          {hasPartial ? 'SEBAGIAN' : 'BELUM DIKIRIM'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <p style={{ ...sLabel, marginBottom: '2px' }}>Produk</p>
          <p style={{ fontSize: '12px', color: C.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemSummary}</p>
        </div>
        <div>
          <p style={{ ...sLabel, marginBottom: '2px' }}>Total</p>
          <p style={{ fontSize: '12px', color: C.accent, fontWeight: 800 }}>{formatIDR(sale.total_amount)}</p>
        </div>
      </div>

      {customer.address && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <MapPin size={11} color={C.muted} />
          <p style={{ fontSize: '11px', color: C.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.address}</p>
        </div>
      )}

      <button
        onClick={onBuatDelivery}
        style={{ ...sBtn(true), width: '100%', padding: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <Truck size={13} /> Buat Pengiriman
      </button>
    </div>
  )
}

// ── Delivery Card ─────────────────────────────────────────────────────────────
function DeliveryCard({ delivery, onComplete }) {
  const [expanded, setExpanded] = useState(false)
  const sale = delivery.sembako_sales
  const emp = delivery.sembako_employees
  const custName = sale?.sembako_customers?.customer_name || sale?.customer_name || delivery.delivery_area || '-'
  const items = sale?.sembako_sale_items || []

  return (
    <div style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ padding: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: C.text, margin: 0 }}>{custName}</p>
            <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>{fmtDate(delivery.delivery_date)}</p>
          </div>
          <StatusBadge status={delivery.status} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <User size={11} color={C.muted} />
            <p style={{ fontSize: '11px', color: C.text, margin: 0 }}>{emp?.full_name || '—'}</p>
          </div>
          {sale && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', color: C.muted, margin: 0 }}>Invoice</p>
              <p style={{ fontSize: '11px', color: C.accent, fontWeight: 700 }}>{sale.invoice_number}</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {delivery.delivery_area && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                  <MapPin size={11} color={C.muted} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ fontSize: '11px', color: C.text, margin: 0 }}>{delivery.delivery_area}</p>
                </div>
              )}

              {items.length > 0 && (
                <div>
                  <p style={sLabel}>Produk</p>
                  {items.map((item, i) => (
                    <p key={i} style={{ fontSize: '11px', color: C.text, margin: '2px 0' }}>
                      {item.product_name} — {item.quantity} {item.unit}
                    </p>
                  ))}
                </div>
              )}

              {!sale && (
                <p style={{ fontSize: '11px', color: C.muted }}>Trip independen (tanpa invoice)</p>
              )}

              {delivery.delivery_cost > 0 && (
                <p style={{ fontSize: '11px', color: C.text }}>
                  Biaya kirim: <span style={{ fontWeight: 700, color: C.accent }}>{formatIDR(delivery.delivery_cost)}</span>
                </p>
              )}

              {delivery.notes && (
                <p style={{ fontSize: '11px', color: C.muted, fontStyle: 'italic' }}>{delivery.notes}</p>
              )}

              {delivery.status !== 'delivered' && (
                <button
                  onClick={e => { e.stopPropagation(); onComplete(delivery.id) }}
                  style={{
                    ...sBtn(true), width: '100%', padding: '10px', fontSize: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    background: '#10B981',
                  }}
                >
                  <CheckCircle size={13} /> Selesaikan Pengiriman
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── TambahTripSheet ───────────────────────────────────────────────────────────
const BLANK_FORM = {
  sale_id: null,
  employee_id: null,
  delivery_area: '',
  delivery_date: new Date().toISOString().slice(0, 10),
  delivery_cost: 0,
  notes: '',
}

function TambahTripSheet({ open, onClose, prefillSale, salesPending, employees, customers }) {
  const createDelivery = useCreateSembakoDelivery()
  const isLinkedMode = !!prefillSale
  const [destinationMode, setDestinationMode] = useState('customer')
  const [linkSale, setLinkSale] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)

  React.useEffect(() => {
    if (open) {
      if (prefillSale) {
        const customer = prefillSale.sembako_customers || {}
        setForm({
          ...BLANK_FORM,
          sale_id: prefillSale.id,
          delivery_area: customer.address || '',
          delivery_date: new Date().toISOString().slice(0, 10),
        })
      } else {
        setForm(BLANK_FORM)
        setLinkSale(false)
        setDestinationMode('customer')
      }
    }
  }, [open, prefillSale])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const employeeOptions = [
    { value: '', label: '— Tanpa sopir / ambil sendiri —' },
    ...employees.filter(e => e.status === 'aktif' && !e.is_deleted).map(e => ({
      value: e.id, label: `${e.full_name} (${e.role})`,
    })),
  ]
  const saleOptions = salesPending.map(s => ({
    value: s.id,
    label: `${s.invoice_number} — ${s.sembako_customers?.customer_name || s.customer_name || 'Umum'}`,
  }))
  const customerOptions = [
    { value: '', label: '— Pilih customer —' },
    ...customers.map(c => ({ value: c.id, label: `${c.customer_name} (${c.address || '-'})` })),
  ]

  async function handleSubmit() {
    const payload = {
      sale_id: isLinkedMode
        ? prefillSale.id
        : (linkSale && form.sale_id ? form.sale_id : null),
      employee_id: form.employee_id || null,
      delivery_area: form.delivery_area || null,
      delivery_date: form.delivery_date,
      delivery_cost: form.delivery_cost || 0,
      notes: form.notes || null,
      status: 'pending',
    }
    try {
      await createDelivery.mutateAsync(payload)
      onClose()
    } catch { /* error handled by hook */ }
  }

  const linkedCustomer = prefillSale?.sembako_customers || {}
  const linkedItems = prefillSale?.sembako_sale_items || []

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        style={{
          background: C.bg, borderLeft: `1px solid ${C.border}`,
          maxWidth: '420px', width: '100%', padding: '24px', overflowY: 'auto',
        }}
      >
        <SheetHeader>
          <SheetTitle style={{ color: C.text, fontWeight: 900, fontSize: '18px' }}>
            {isLinkedMode ? 'Buat Pengiriman' : 'Tambah Trip'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Form pengiriman sembako
          </SheetDescription>
        </SheetHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px', paddingBottom: '80px' }}>

          {/* MODE A: Linked ke sale */}
          {isLinkedMode && (
            <>
              <div style={{ background: 'rgba(234,88,12,0.06)', borderRadius: '12px', padding: '12px', border: `1px solid ${C.border}` }}>
                <p style={sLabel}>Invoice Terkait</p>
                <p style={{ fontSize: '14px', fontWeight: 800, color: C.accent, margin: 0 }}>
                  {prefillSale.invoice_number}
                </p>
                <p style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
                  {prefillSale.sembako_customers?.customer_name || prefillSale.customer_name}
                </p>
              </div>

              {linkedItems.length > 0 && (
                <div>
                  <p style={sLabel}>Produk yang Dikirim</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {linkedItems.map((item, i) => (
                      <p key={i} style={{ fontSize: '12px', color: C.text, margin: 0 }}>
                        • {item.product_name} — {item.quantity} {item.unit}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p style={sLabel}>Tujuan Pengiriman</p>
                <input
                  style={sInput}
                  value={form.delivery_area}
                  onChange={e => set('delivery_area', e.target.value)}
                  placeholder={linkedCustomer.address || 'Alamat tujuan...'}
                />
              </div>
            </>
          )}

          {/* MODE B: Trip independent */}
          {!isLinkedMode && (
            <>
              <div>
                <p style={sLabel}>Tujuan Pengiriman</p>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {['customer', 'manual'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setDestinationMode(mode); set('delivery_area', '') }}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                        cursor: 'pointer', border: 'none',
                        background: destinationMode === mode ? C.accent : 'rgba(255,255,255,0.05)',
                        color: destinationMode === mode ? '#fff' : C.muted,
                        transition: 'all 0.2s',
                      }}
                    >
                      {mode === 'customer' ? 'Dari Customer' : 'Input Manual'}
                    </button>
                  ))}
                </div>
                {destinationMode === 'customer' ? (
                  <CustomSelect
                    value={customers.find(c => c.address === form.delivery_area)?.id || ''}
                    onChange={id => {
                      const c = customers.find(x => x.id === id)
                      set('delivery_area', c?.address || '')
                    }}
                    options={customerOptions}
                    placeholder="Pilih customer..."
                  />
                ) : (
                  <input
                    style={sInput}
                    value={form.delivery_area}
                    onChange={e => set('delivery_area', e.target.value)}
                    placeholder="Masukkan alamat tujuan..."
                  />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <p style={{ ...sLabel, margin: 0 }}>Linked ke Invoice?</p>
                  <button
                    onClick={() => { setLinkSale(v => !v); set('sale_id', null) }}
                    style={{
                      width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                      background: linkSale ? C.accent : 'rgba(255,255,255,0.1)',
                      position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: '3px',
                      left: linkSale ? '20px' : '3px',
                      width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
                {linkSale && (
                  <CustomSelect
                    value={form.sale_id || ''}
                    onChange={val => set('sale_id', val || null)}
                    options={[{ value: '', label: '— Tanpa invoice —' }, ...saleOptions]}
                    placeholder="Pilih invoice..."
                  />
                )}
              </div>
            </>
          )}

          <div>
            <p style={sLabel}>Sopir / Kurir</p>
            <CustomSelect
              value={form.employee_id || ''}
              onChange={val => set('employee_id', val || null)}
              options={employeeOptions}
              placeholder="— Tanpa sopir —"
            />
          </div>

          <div>
            <p style={sLabel}>Tanggal Berangkat</p>
            <DatePicker
              value={form.delivery_date}
              onChange={val => set('delivery_date', val)}
              placeholder="Pilih tanggal"
            />
          </div>

          <div>
            <p style={sLabel}>Biaya Pengiriman (opsional)</p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: '13px', pointerEvents: 'none' }}>Rp</span>
              <input
                type="number"
                style={{ ...sInput, paddingLeft: '32px' }}
                value={form.delivery_cost || ''}
                onChange={e => set('delivery_cost', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <p style={sLabel}>Catatan (opsional)</p>
            <textarea
              rows={2}
              style={{ ...sInput, resize: 'vertical', minHeight: '72px' }}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Instruksi khusus, dll..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={createDelivery.isPending || !form.delivery_date}
            style={{
              ...sBtn(true), width: '100%', padding: '14px', fontSize: '14px',
              opacity: (createDelivery.isPending || !form.delivery_date) ? 0.6 : 1,
            }}
          >
            {createDelivery.isPending ? 'Menyimpan...' : 'Simpan Trip'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function SembakoPengiriman() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const location = useLocation()
  const navigate = useNavigate()

  const { data: deliveries = [], isLoading: loadingDeliveries } = useSembakoDeliveries()
  const { data: salesPending = [], isLoading: loadingSales } = useSembakoSalesPendingDelivery()
  const { data: employees = [] } = useSembakoEmployees()
  const { data: customers = [] } = useSembakoCustomers()
  const completeDelivery = useCompleteSembakoDelivery()

  const [filterTab, setFilterTab] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [prefillSale, setPrefillSale] = useState(null)

  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    const saleId = params.get('saleId')
    if (saleId && salesPending.length > 0) {
      const sale = salesPending.find(s => s.id === saleId)
      if (sale) {
        setPrefillSale(sale)
        setSheetOpen(true)
        navigate(location.pathname, { replace: true })
      }
    }
  }, [location.search, salesPending, navigate, location.pathname])

  const filteredDeliveries = useMemo(() => {
    if (!filterTab) return deliveries
    return deliveries.filter(d => d.status === filterTab)
  }, [deliveries, filterTab])

  const activeCount = deliveries.filter(d => d.status !== 'delivered').length

  function openForSale(sale) { setPrefillSale(sale); setSheetOpen(true) }
  function openIndependent() { setPrefillSale(null); setSheetOpen(true) }
  function closeSheet() { setSheetOpen(false); setPrefillSale(null) }

  async function handleComplete(deliveryId) {
    try {
      await completeDelivery.mutateAsync(deliveryId)
    } catch { /* error handled by hook */ }
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: '96px' }}>
      {!isDesktop && <TopBar title="Pengiriman" />}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <SembakoPageHeader
          title="Pengiriman & Trip"
          subtitle={`${activeCount} pengiriman aktif`}
          isDesktop={isDesktop}
          filters={FILTER_TABS}
          activeFilter={filterTab}
          onFilterChange={setFilterTab}
          actionButton={
            <Button
              type="button"
              onClick={openIndependent}
              className="h-10 rounded-xl bg-[#EA580C] px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-950/20"
            >
              <Plus size={15} className="mr-1" /> Tambah Trip
            </Button>
          }
        />

        <div style={{ padding: isDesktop ? '24px 40px' : '20px 16px' }}>
          {/* Sales Perlu Dikirim */}
          {!loadingSales && salesPending.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <p style={{ ...sLabel, fontSize: '11px', marginBottom: '12px', color: C.amber }}>
                Sales Perlu Dikirim ({salesPending.length})
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isDesktop ? 'repeat(2,1fr)' : '1fr',
                gap: '10px',
              }}>
                {salesPending.map(sale => (
                  <SalePendingCard
                    key={sale.id}
                    sale={sale}
                    onBuatDelivery={() => openForSale(sale)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Delivery list */}
          {loadingDeliveries ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '90px', borderRadius: '16px', background: C.card, opacity: 0.5 }} />
              ))}
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <EmptyBox icon={Truck} text="Belum ada pengiriman di kategori ini" />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(2,1fr)' : '1fr',
              gap: '10px',
            }}>
              {filteredDeliveries.map(d => (
                <DeliveryCard key={d.id} delivery={d} onComplete={handleComplete} />
              ))}
            </div>
          )}
        </div>
      </div>

      <TambahTripSheet
        open={sheetOpen}
        onClose={closeSheet}
        prefillSale={prefillSale}
        salesPending={salesPending}
        employees={employees}
        customers={customers}
      />
    </div>
  )
}
