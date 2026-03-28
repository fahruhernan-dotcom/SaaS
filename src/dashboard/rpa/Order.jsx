import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ShoppingCart, Plus, Clock, CheckCircle2, Truck, XCircle, Ban } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import TopBar from '../components/TopBar'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import {
  useRPAPurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
} from '@/lib/hooks/useRPAData'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// ─── Constants ────────────────────────────────────────────────────────────────

const CHICKEN_TYPES = [
  { value: 'broiler', label: 'Broiler', icon: '🐔' },
  { value: 'layer', label: 'Layer', icon: '🥚' },
  { value: 'kampung', label: 'Kampung', icon: '🐓' },
]

const STATUS_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'open', label: 'Menunggu' },
  { key: 'confirmed', label: 'Dikonfirmasi' },
  { key: 'in_delivery', label: 'Dikirim' },
  { key: 'completed', label: 'Selesai' },
]

const STATUS_CONFIG = {
  open: { label: 'Menunggu', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  responded: { label: 'Direspon', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', icon: CheckCircle2 },
  confirmed: { label: 'Dikonfirmasi', color: '#34D399', bg: 'rgba(52,211,153,0.12)', icon: CheckCircle2 },
  in_delivery: { label: 'Dikirim', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', icon: Truck },
  delivered: { label: 'Terkirim', color: '#34D399', bg: 'rgba(52,211,153,0.12)', icon: Truck },
  completed: { label: 'Selesai', color: '#4B6478', bg: 'rgba(75,100,120,0.12)', icon: CheckCircle2 },
  cancelled: { label: 'Dibatalkan', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle },
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const orderSchema = z.object({
  chicken_type: z.string().min(1, 'Pilih jenis ayam'),
  requested_count: z.coerce.number().int().min(1, 'Minimal 1 ekor'),
  requested_weight_kg: z.coerce.number().min(0.1, 'Isi berat estimasi'),
  target_price_per_kg: z.coerce.number().min(1000, 'Isi target harga'),
  requested_date: z.string().min(1, 'Pilih tanggal pengiriman'),
  notes: z.string().optional(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d) => {
  if (!d) return '-'
  try { return format(new Date(d), 'd MMM yyyy', { locale: localeId }) } catch { return d }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' }
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
    }}>
      {Icon && <Icon size={11} />}
      {cfg.label}
    </span>
  )
}

function OrderCard({ order, onCancel }) {
  const ct = CHICKEN_TYPES.find(t => t.value === order.chicken_type)
  const estimatedValue = (order.requested_weight_kg || 0) * (order.target_price_per_kg || 0)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '14px',
      padding: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'rgba(245,158,11,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>
            {ct?.icon ?? '🐔'}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#F1F5F9', fontSize: '14px' }}>
              {ct?.label ?? order.chicken_type}
            </div>
            <div style={{ fontSize: '12px', color: '#4B6478', marginTop: '2px' }}>
              {order.requested_count?.toLocaleString('id-ID')} ekor &bull;{' '}
              {order.requested_weight_kg?.toLocaleString('id-ID')} kg
            </div>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div style={{
        marginTop: '12px', paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: '#4B6478' }}>Target Harga/kg</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#F59E0B' }}>
            {fmt(order.target_price_per_kg || 0)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#4B6478' }}>Est. Nilai</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>
            {fmt(estimatedValue)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#4B6478' }}>Tgl Pengiriman</div>
          <div style={{ fontSize: '13px', color: '#CBD5E1' }}>{fmtDate(order.requested_date)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#4B6478' }}>Broker</div>
          <div style={{ fontSize: '13px', color: '#CBD5E1' }}>
            {order.tenants?.business_name ?? <span style={{ color: '#4B6478' }}>Belum ditentukan</span>}
          </div>
        </div>
      </div>

      {order.notes && (
        <div style={{
          marginTop: '10px', padding: '8px 10px',
          background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
          fontSize: '12px', color: '#64748B',
        }}>
          {order.notes}
        </div>
      )}

      {order.status === 'open' && (
        <button
          onClick={() => onCancel(order.id)}
          style={{
            marginTop: '12px', width: '100%', padding: '8px',
            background: 'transparent',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', color: '#EF4444',
            fontSize: '13px', cursor: 'pointer', fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <Ban size={14} />
          Batalkan Order
        </button>
      )}
    </div>
  )
}

// ─── Create Order Sheet ────────────────────────────────────────────────────────

function CreateOrderSheet({ open, onClose }) {
  const createOrder = useCreatePurchaseOrder()

  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      chicken_type: '',
      requested_count: '',
      requested_weight_kg: '',
      target_price_per_kg: '',
      requested_date: '',
      notes: '',
    },
  })

  const selectedType = watch('chicken_type')

  const onSubmit = (data) => {
    createOrder.mutate(data, {
      onSuccess: () => {
        reset()
        onClose()
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <SheetContent side="bottom" style={{ background: '#0D1117', border: 'none', maxHeight: '92vh', overflowY: 'auto', borderRadius: '20px 20px 0 0' }}>
        <SheetHeader style={{ padding: '20px 20px 0' }}>
          <SheetTitle style={{ color: '#F1F5F9', fontFamily: 'Sora', fontSize: '18px' }}>
            Order ke Broker
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Chicken Type Pills */}
          <div>
            <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '8px' }}>
              Jenis Ayam <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {CHICKEN_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setValue('chicken_type', t.value, { shouldValidate: true })}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: '10px',
                    border: `1px solid ${selectedType === t.value ? '#F59E0B' : 'rgba(255,255,255,0.08)'}`,
                    background: selectedType === t.value ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                    color: selectedType === t.value ? '#F59E0B' : '#94A3B8',
                    cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            {errors.chicken_type && (
              <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{errors.chicken_type.message}</p>
            )}
          </div>

          {/* Count + Weight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="requested_count" style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                Jumlah (ekor) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="requested_count"
                name="requested_count"
                type="number"
                min="1"
                placeholder="500"
                {...register('requested_count')}
                style={{
                  width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.requested_count ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '10px', color: '#F1F5F9', fontSize: '14px', outline: 'none',
                }}
              />
              {errors.requested_count && (
                <p style={{ fontSize: '11px', color: '#EF4444', marginTop: '3px' }}>{errors.requested_count.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="requested_weight_kg" style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                Berat Est. (kg) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="requested_weight_kg"
                name="requested_weight_kg"
                type="number"
                step="0.1"
                min="0"
                placeholder="1200"
                {...register('requested_weight_kg')}
                style={{
                  width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.requested_weight_kg ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '10px', color: '#F1F5F9', fontSize: '14px', outline: 'none',
                }}
              />
              {errors.requested_weight_kg && (
                <p style={{ fontSize: '11px', color: '#EF4444', marginTop: '3px' }}>{errors.requested_weight_kg.message}</p>
              )}
            </div>
          </div>

          {/* Target Price */}
          <div>
            <label htmlFor="target_price_per_kg" style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
              Target Harga/kg <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <Controller
              name="target_price_per_kg"
              control={control}
              render={({ field }) => (
                <InputRupiah
                  id="target_price_per_kg"
                  name="target_price_per_kg"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="32.000"
                  hasError={!!errors.target_price_per_kg}
                />
              )}
            />
            {errors.target_price_per_kg && (
              <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{errors.target_price_per_kg.message}</p>
            )}
          </div>

          {/* Requested Date */}
          <div>
            <label htmlFor="requested_date" style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
              Tanggal Pengiriman <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <Controller
              name="requested_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="requested_date"
                  name="requested_date"
                  value={field.value}
                  onChange={field.onChange}
                  hasError={!!errors.requested_date}
                />
              )}
            />
            {errors.requested_date && (
              <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{errors.requested_date.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
              Catatan (opsional)
            </label>
            <textarea
              id="notes"
              name="notes"
              {...register('notes')}
              rows={2}
              placeholder="Spesifikasi tambahan, preferensi broker, dll."
              style={{
                width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#F1F5F9', fontSize: '14px', outline: 'none',
                resize: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={createOrder.isPending}
            style={{
              padding: '13px', borderRadius: '12px',
              background: createOrder.isPending ? 'rgba(245,158,11,0.4)' : '#F59E0B',
              border: 'none', color: '#0D1117', fontWeight: 700,
              fontSize: '15px', cursor: createOrder.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {createOrder.isPending ? 'Mengirim...' : 'Kirim ke Broker'}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function RPAOrder() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('all')

  const { data: orders = [], isLoading } = useRPAPurchaseOrders()
  const updateOrder = useUpdatePurchaseOrder()

  const sheetOpen = searchParams.get('action') === 'new'

  const openSheet = () => setSearchParams({ action: 'new' })
  const closeSheet = () => setSearchParams({}, { replace: true })

  const handleCancel = (orderId) => {
    updateOrder.mutate({ orderId, updates: { status: 'cancelled' } })
  }

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab)

  const stats = {
    total: orders.length,
    open: orders.filter(o => o.status === 'open').length,
    inDelivery: orders.filter(o => o.status === 'in_delivery' || o.status === 'delivered').length,
  }

  const AddButton = (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={openSheet}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 14px', borderRadius: '10px',
        background: '#F59E0B', border: 'none',
        color: '#0D1117', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
      }}
    >
      <Plus size={16} />
      {isDesktop ? 'Order Baru' : 'Order'}
    </motion.button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#06090F' }}>
      {/* Header */}
      {!isDesktop ? (
        <TopBar title="Order ke Broker" subtitle={`${stats.open} menunggu konfirmasi`} rightAction={AddButton} />
      ) : (
        <div style={{ padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 700, color: '#F1F5F9' }}>
              Order ke Broker
            </h1>
            <p style={{ fontSize: '14px', color: '#4B6478', marginTop: '4px' }}>
              Manajemen pembelian ayam dari broker
            </p>
          </div>
          {AddButton}
        </div>
      )}

      <div style={{ padding: isDesktop ? '24px 32px' : '20px 16px' }}>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Total Order', value: stats.total, color: '#F59E0B' },
            { label: 'Menunggu', value: stats.open, color: '#60A5FA' },
            { label: 'Dalam Pengiriman', value: stats.inDelivery, color: '#A78BFA' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#4B6478', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px',
          marginBottom: '16px',
          scrollbarWidth: 'none',
        }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: '20px',
                border: activeTab === tab.key ? 'none' : '1px solid rgba(255,255,255,0.08)',
                background: activeTab === tab.key ? '#F59E0B' : 'rgba(255,255,255,0.03)',
                color: activeTab === tab.key ? '#0D1117' : '#64748B',
                fontSize: '13px', fontWeight: activeTab === tab.key ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span style={{ marginLeft: '5px', opacity: 0.7 }}>
                  {orders.filter(o => o.status === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Order List */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: '140px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite',
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <ShoppingCart size={40} color="#1E293B" />
            <p style={{ color: '#4B6478', marginTop: '12px', fontSize: '14px' }}>
              {activeTab === 'all' ? 'Belum ada order. Buat order pertama Anda.' : 'Tidak ada order dengan status ini.'}
            </p>
            {activeTab === 'all' && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={openSheet}
                style={{
                  marginTop: '16px', padding: '10px 20px', borderRadius: '10px',
                  background: '#F59E0B', border: 'none', color: '#0D1117',
                  fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                }}
              >
                Buat Order Baru
              </motion.button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} onCancel={handleCancel} />
            ))}
          </div>
        )}
      </div>

      <CreateOrderSheet open={sheetOpen} onClose={closeSheet} />
    </div>
  )
}
