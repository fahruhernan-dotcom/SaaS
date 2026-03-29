import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { CreditCard, Plus, ArrowUpRight, ArrowDownRight, Landmark, Wallet } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { InputRupiah } from '@/components/ui/InputRupiah'
import TopBar from '../../_shared/components/TopBar'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useRPAPurchaseOrders, useRPAPaymentsToSend, useCreateRPAPayment } from '@/lib/hooks/useRPAData'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: 'transfer', label: 'Transfer Bank', icon: '🏦' },
  { value: 'cash', label: 'Tunai', icon: '💵' },
  { value: 'giro', label: 'Giro', icon: '📃' },
  { value: 'qris', label: 'QRIS', icon: '📲' },
]

const CHICKEN_LABELS = { broiler: 'Broiler', layer: 'Layer', kampung: 'Kampung' }

// ─── Schema ───────────────────────────────────────────────────────────────────

const paymentSchema = z.object({
  broker_tenant_id: z.string().min(1, 'Pilih broker'),
  amount: z.coerce.number().min(1000, 'Minimal Rp 1.000'),
  payment_method: z.string().min(1, 'Pilih metode'),
  reference_no: z.string().optional(),
  notes: z.string().optional(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

const fmtDate = (d) => {
  if (!d) return '-'
  try { return format(new Date(d), 'd MMM yyyy', { locale: localeId }) } catch { return d }
}

const calcOrderValue = (o) => (o.requested_weight_kg || 0) * (o.target_price_per_kg || 0)

// ─── Catat Pembayaran Sheet ────────────────────────────────────────────────────

function CatatPembayaranSheet({ open, onClose, brokers }) {
  const createPayment = useCreateRPAPayment()

  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      broker_tenant_id: '',
      amount: '',
      payment_method: 'transfer',
      reference_no: '',
      notes: '',
    },
  })

  const selectedMethod = watch('payment_method')

  const onSubmit = (data) => {
    createPayment.mutate(data, {
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
            Catat Pembayaran
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Broker */}
          <div>
            <label htmlFor="broker_tenant_id" style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
              Broker <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              id="broker_tenant_id"
              name="broker_tenant_id"
              {...register('broker_tenant_id')}
              style={{
                width: '100%', padding: '10px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${errors.broker_tenant_id ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '10px', color: '#F1F5F9', fontSize: '14px', outline: 'none',
              }}
            >
              <option value="" style={{ background: '#0D1117' }}>Pilih broker...</option>
              {brokers.map(b => (
                <option key={b.id} value={b.id} style={{ background: '#0D1117' }}>
                  {b.business_name}
                </option>
              ))}
            </select>
            {errors.broker_tenant_id && (
              <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{errors.broker_tenant_id.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
              Jumlah Bayar <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <InputRupiah
                  id="amount"
                  name="amount"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="0"
                  hasError={!!errors.amount}
                />
              )}
            />
            {errors.amount && (
              <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{errors.amount.message}</p>
            )}
          </div>

          {/* Payment Method Pills */}
          <div>
            <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '8px' }}>
              Metode Pembayaran <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setValue('payment_method', m.value)}
                  style={{
                    padding: '8px 4px', borderRadius: '8px',
                    border: `1px solid ${selectedMethod === m.value ? '#F59E0B' : 'rgba(255,255,255,0.08)'}`,
                    background: selectedMethod === m.value ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                    color: selectedMethod === m.value ? '#F59E0B' : '#64748B',
                    cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference No */}
          <div>
            <label htmlFor="reference_no" style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
              No. Referensi / Bukti (opsional)
            </label>
            <input
              id="reference_no"
              name="reference_no"
              type="text"
              placeholder="No. transfer, nota, dll."
              {...register('reference_no')}
              style={{
                width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#F1F5F9', fontSize: '14px', outline: 'none',
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="pay_notes" style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
              Catatan (opsional)
            </label>
            <textarea
              id="pay_notes"
              name="notes"
              {...register('notes')}
              rows={2}
              placeholder="Keterangan tambahan..."
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
            disabled={createPayment.isPending}
            style={{
              padding: '13px', borderRadius: '12px',
              background: createPayment.isPending ? 'rgba(245,158,11,0.4)' : '#F59E0B',
              border: 'none', color: '#0D1117', fontWeight: 700,
              fontSize: '15px', cursor: createPayment.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {createPayment.isPending ? 'Menyimpan...' : 'Catat Pembayaran'}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function RPAHutang() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: orders = [], isLoading: ordersLoading } = useRPAPurchaseOrders()
  const { data: payments = [], isLoading: paymentsLoading } = useRPAPaymentsToSend()

  const sheetOpen = searchParams.get('action') === 'new'
  const openSheet = () => setSearchParams({ action: 'new' })
  const closeSheet = () => setSearchParams({}, { replace: true })

  // Delivered/completed orders = hutang
  const debtOrders = orders.filter(o =>
    o.status === 'delivered' || o.status === 'completed'
  )

  // Unique brokers from purchase orders (for the payment form)
  const brokerMap = {}
  orders.forEach(o => {
    if (o.broker_tenant_id && o.tenants?.business_name) {
      brokerMap[o.broker_tenant_id] = { id: o.broker_tenant_id, business_name: o.tenants.business_name }
    }
  })
  const brokers = Object.values(brokerMap)

  const totalHutang = debtOrders.reduce((s, o) => s + calcOrderValue(o), 0)
  const totalDibayar = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const sisaHutang = Math.max(0, totalHutang - totalDibayar)

  const isLoading = ordersLoading || paymentsLoading

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
      {isDesktop ? 'Catat Pembayaran' : 'Bayar'}
    </motion.button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#06090F' }}>
      {/* Header */}
      {!isDesktop ? (
        <TopBar title="Hutang ke Broker" subtitle={sisaHutang > 0 ? `Sisa ${fmt(sisaHutang)}` : 'Lunas'} rightAction={AddButton} />
      ) : (
        <div style={{ padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 700, color: '#F1F5F9' }}>
              Hutang ke Broker
            </h1>
            <p style={{ fontSize: '14px', color: '#4B6478', marginTop: '4px' }}>
              Rekap pembayaran atas pembelian ayam
            </p>
          </div>
          {AddButton}
        </div>
      )}

      <div style={{ padding: isDesktop ? '24px 32px' : '20px 16px' }}>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '12px', padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <CreditCard size={14} color="#EF4444" />
              <span style={{ fontSize: '11px', color: '#4B6478' }}>Total Hutang</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#EF4444' }}>
              {isLoading ? '—' : fmt(totalHutang)}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(52,211,153,0.15)',
            borderRadius: '12px', padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <ArrowUpRight size={14} color="#34D399" />
              <span style={{ fontSize: '11px', color: '#4B6478' }}>Sudah Dibayar</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#34D399' }}>
              {isLoading ? '—' : fmt(totalDibayar)}
            </div>
          </div>
          <div style={{
            background: sisaHutang > 0 ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${sisaHutang > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '12px', padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Wallet size={14} color={sisaHutang > 0 ? '#F59E0B' : '#4B6478'} />
              <span style={{ fontSize: '11px', color: '#4B6478' }}>Sisa Hutang</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: sisaHutang > 0 ? '#F59E0B' : '#34D399' }}>
              {isLoading ? '—' : sisaHutang > 0 ? fmt(sisaHutang) : 'Lunas'}
            </div>
          </div>
        </div>

        {/* Aging Table — delivered/completed orders */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8', marginBottom: '12px' }}>
            Rincian Pembelian
          </h3>

          {isLoading ? (
            <div style={{ height: '120px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
          ) : debtOrders.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '24px', textAlign: 'center',
            }}>
              <Landmark size={32} color="#1E293B" />
              <p style={{ color: '#4B6478', marginTop: '10px', fontSize: '13px' }}>
                Belum ada pembelian yang perlu dibayar.
              </p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              {debtOrders.map((order, idx) => {
                const val = calcOrderValue(order)
                const ct = CHICKEN_LABELS[order.chicken_type] ?? order.chicken_type
                return (
                  <div
                    key={order.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: idx < debtOrders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0' }}>
                        {ct} — {order.requested_count?.toLocaleString('id-ID')} ekor
                      </div>
                      <div style={{ fontSize: '11px', color: '#4B6478', marginTop: '2px' }}>
                        {order.tenants?.business_name ?? 'Broker belum terisi'} &bull; {fmtDate(order.requested_date)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#F59E0B' }}>{fmt(val)}</div>
                      <div style={{ fontSize: '11px', color: '#4B6478', marginTop: '1px' }}>
                        {order.requested_weight_kg?.toLocaleString('id-ID')} kg
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8', marginBottom: '12px' }}>
            Riwayat Pembayaran
          </h3>

          {isLoading ? (
            <div style={{ height: '100px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
          ) : payments.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '24px', textAlign: 'center',
            }}>
              <p style={{ color: '#4B6478', fontSize: '13px' }}>Belum ada pembayaran yang dicatat.</p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              {payments.map((p, idx) => {
                const method = PAYMENT_METHODS.find(m => m.value === p.payment_method)
                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: idx < payments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '8px',
                        background: 'rgba(52,211,153,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px',
                      }}>
                        {method?.icon ?? '💰'}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0' }}>
                          {p.tenants?.business_name ?? 'Broker'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#4B6478', marginTop: '1px' }}>
                          {method?.label ?? p.payment_method} &bull; {fmtDate(p.created_at)}
                        </div>
                        {p.reference_no && (
                          <div style={{ fontSize: '11px', color: '#4B6478' }}>Ref: {p.reference_no}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#34D399' }}>
                      {fmt(p.amount)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <CatatPembayaranSheet open={sheetOpen} onClose={closeSheet} brokers={brokers} />
    </div>
  )
}
