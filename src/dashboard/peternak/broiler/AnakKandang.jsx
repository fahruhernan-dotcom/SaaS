import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Phone, Edit2, Clock } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePeternakFarms } from '@/lib/hooks/usePeternakData'
import { toast } from 'sonner'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'

// ─── Styles ───────────────────────────────────────────────────────────────────

const headerStyle = {
  padding: '24px 16px 16px',
  background: 'linear-gradient(180deg, #0C1319 0%, #06090F 100%)',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
}
const pageTitleStyle = { fontFamily: 'Sora', fontWeight: 800, fontSize: 20, color: '#F1F5F9', marginBottom: 4 }
const pageSubStyle   = { fontSize: 12, color: '#4B6478' }

const addBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '9px 14px',
  background: '#7C3AED', border: 'none', borderRadius: 10,
  color: 'white', fontSize: 12, fontWeight: 800,
  cursor: 'pointer', flexShrink: 0, fontFamily: 'Sora',
  boxShadow: '0 3px 12px rgba(124,58,237,0.3)',
}

const sectionTitleStyle = { fontFamily: 'Sora', fontWeight: 800, fontSize: 14, color: '#F1F5F9' }

const cardStyle = {
  padding: '14px',
  background: '#0C1319',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
}

const avatarStyle = {
  width: 44, height: 44, borderRadius: '50%',
  background: 'rgba(124,58,237,0.15)',
  border: '1.5px solid rgba(124,58,237,0.3)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'Sora', fontWeight: 800, fontSize: 15, color: '#A78BFA',
  flexShrink: 0,
}

const workerNameStyle  = { fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: '#F1F5F9' }
const workerFarmStyle  = { fontSize: 11, color: '#4B6478', marginTop: 2 }
const statusBadgeStyle = { fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, flexShrink: 0 }
const activeStatusStyle   = { background: 'rgba(52,211,153,0.1)',  color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }
const inactiveStatusStyle = { background: 'rgba(248,113,113,0.08)', color: '#F87171', border: '1px solid rgba(248,113,113,0.15)' }

const salaryRowStyle  = { display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }
const salaryItemStyle = { display: 'flex', flexDirection: 'column', gap: 2 }
const salaryLabelStyle = { fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.08em' }
const salaryValueStyle = { fontFamily: 'Sora', fontWeight: 700, fontSize: 12, color: '#F1F5F9' }

const metaChipStyle = { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#4B6478' }

const editBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '6px 10px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, color: '#94A3B8', fontSize: 11, fontWeight: 700, cursor: 'pointer',
}
const payBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '6px 10px',
  background: 'rgba(124,58,237,0.08)',
  border: '1px solid rgba(124,58,237,0.2)',
  borderRadius: 8, color: '#A78BFA', fontSize: 11, fontWeight: 700, cursor: 'pointer',
}

const paymentRowStyle = {
  padding: '12px 14px',
  background: '#111C24',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.05)',
}

const addFormBoxStyle = {
  padding: 16,
  background: 'rgba(124,58,237,0.05)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 14,
  display: 'flex', flexDirection: 'column', gap: 14,
}
const addFormTitleStyle = {
  fontSize: 11, fontWeight: 900, color: '#7C3AED',
  textTransform: 'uppercase', letterSpacing: '0.1em',
}

const labelStyle = {
  display: 'block', fontSize: 10, fontWeight: 800,
  color: '#4B6478', textTransform: 'uppercase',
  letterSpacing: '0.1em', marginBottom: 6,
}
const inputStyle = {
  width: '100%', padding: '12px 14px',
  background: '#111C24',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, color: '#F1F5F9',
  fontSize: 15, fontFamily: 'DM Sans', outline: 'none',
  boxSizing: 'border-box',
}
const submitBtnStyle = {
  width: '100%', padding: '14px',
  background: '#7C3AED', border: 'none', borderRadius: 12,
  color: 'white', fontSize: 15, fontWeight: 800,
  cursor: 'pointer', fontFamily: 'Sora',
  boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
}
const cancelBtnStyle = {
  flex: 1, padding: '12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10, color: '#4B6478',
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
}
const emptyStyle = {
  marginTop: 24, padding: '48px 20px', textAlign: 'center',
  background: '#0C1319', borderRadius: 20,
  border: '1px dashed rgba(255,255,255,0.05)',
}



// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatIDR(n) {
  if (!n) return 'Rp 0'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const PAYMENT_TYPES = [
  { value: 'gaji',  label: '💰 Gaji',       color: '#34D399' },
  { value: 'bonus', label: '🎁 Bonus',       color: '#A78BFA' },
  { value: 'makan', label: '🍱 Uang Makan',  color: '#F59E0B' },
  { value: 'lain',  label: '📌 Lainnya',     color: '#94A3B8' },
]

function typeColor(t) { return PAYMENT_TYPES.find(p => p.value === t)?.color ?? '#94A3B8' }
function typeLabel(t) { return PAYMENT_TYPES.find(p => p.value === t)?.label ?? t }

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnakKandang() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const { data: farms = [] } = usePeternakFarms()

  const [workerSheet, setWorkerSheet] = useState({ open: false, worker: null })
  const [paymentSheet, setPaymentSheet] = useState({ open: false, worker: null })

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['farm-workers', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farm_workers')
        .select('*, peternak_farms(farm_name)')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })

  if (isLoading) return <LoadingSpinner fullPage />

  const activeWorkers   = workers.filter(w => w.status === 'aktif')
  const inactiveWorkers = workers.filter(w => w.status === 'nonaktif')

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['farm-workers', tenant.id] })

  return (
    <div style={{ color: '#F1F5F9', paddingBottom: 40 }}>

      {/* ── Header ── */}
      <header style={headerStyle}>
        <div>
          <h1 style={pageTitleStyle}>Anak Kandang</h1>
          <p style={pageSubStyle}>
            {workers.length} pekerja · {activeWorkers.length} aktif
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          style={addBtnStyle}
          onClick={() => setWorkerSheet({ open: true, worker: null })}
        >
          <Plus size={14} strokeWidth={2.5} />
          Tambah
        </motion.button>
      </header>

      <div style={{ padding: '0 16px' }}>

        {/* ── Empty state ── */}
        {workers.length === 0 && (
          <div style={emptyStyle}>
            <span style={{ fontSize: 40 }}>👤</span>
            <p style={{ color: '#4B6478', fontSize: 13, marginTop: 12 }}>
              Belum ada data anak kandang
            </p>
            <button
              style={{ ...addBtnStyle, marginTop: 16 }}
              onClick={() => setWorkerSheet({ open: true, worker: null })}
            >
              <Plus size={14} /> Tambah Pekerja
            </button>
          </div>
        )}

        {/* ── Active workers ── */}
        {activeWorkers.length > 0 && (
          <section style={{ marginTop: 20 }}>
            <h2 style={sectionTitleStyle}>Aktif · {activeWorkers.length}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {activeWorkers.map(w => (
                <WorkerCard
                  key={w.id}
                  worker={w}
                  onEdit={() => setWorkerSheet({ open: true, worker: w })}
                  onPayment={() => setPaymentSheet({ open: true, worker: w })}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Inactive workers ── */}
        {inactiveWorkers.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ ...sectionTitleStyle, color: '#4B6478' }}>
              Nonaktif · {inactiveWorkers.length}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {inactiveWorkers.map(w => (
                <WorkerCard
                  key={w.id}
                  worker={w}
                  onEdit={() => setWorkerSheet({ open: true, worker: w })}
                  onPayment={() => setPaymentSheet({ open: true, worker: w })}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <WorkerSheet
        open={workerSheet.open}
        onClose={() => setWorkerSheet({ open: false, worker: null })}
        worker={workerSheet.worker}
        farms={farms}
        onSaved={invalidate}
      />

      <PaymentSheet
        open={paymentSheet.open}
        onClose={() => setPaymentSheet({ open: false, worker: null })}
        worker={paymentSheet.worker}
      />
    </div>
  )
}

// ─── Worker Card ──────────────────────────────────────────────────────────────

function WorkerCard({ worker, onEdit, onPayment }) {
  const isActive = worker.status === 'aktif'

  return (
    <div style={{ ...cardStyle, opacity: isActive ? 1 : 0.75 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{ ...avatarStyle, opacity: isActive ? 1 : 0.6 }}>
          {initials(worker.full_name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={workerNameStyle}>{worker.full_name}</p>
              <p style={workerFarmStyle}>🏠 {worker.peternak_farms?.farm_name ?? '—'}</p>
            </div>
            <span style={{
              ...statusBadgeStyle,
              ...(isActive ? activeStatusStyle : inactiveStatusStyle),
            }}>
              {isActive ? '● Aktif' : '○ Nonaktif'}
            </span>
          </div>

          {/* Salary info */}
          <div style={salaryRowStyle}>
            {worker.base_salary > 0 && (
              <div style={salaryItemStyle}>
                <span style={salaryLabelStyle}>Gaji Pokok</span>
                <span style={salaryValueStyle}>{formatIDR(worker.base_salary)}/bln</span>
              </div>
            )}
            {worker.bonus_per_kg > 0 && (
              <div style={salaryItemStyle}>
                <span style={salaryLabelStyle}>Bonus Panen</span>
                <span style={{ ...salaryValueStyle, color: '#A78BFA' }}>
                  {formatIDR(worker.bonus_per_kg)}/kg
                </span>
              </div>
            )}
            {worker.fcr_target > 0 && (
              <div style={salaryItemStyle}>
                <span style={salaryLabelStyle}>Target FCR</span>
                <span style={{ ...salaryValueStyle, color: '#34D399' }}>
                  ≤ {worker.fcr_target}
                </span>
              </div>
            )}
          </div>

          {/* Meta chips */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            {worker.phone && (
              <span style={metaChipStyle}>
                <Phone size={10} /> {worker.phone}
              </span>
            )}
            {worker.join_date && (
              <span style={metaChipStyle}>
                <Clock size={10} /> Sejak {fmt(worker.join_date)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={editBtnStyle} onClick={onEdit}>
              <Edit2 size={11} /> Edit
            </button>
            <button style={payBtnStyle} onClick={onPayment}>
              <Clock size={11} /> Riwayat Bayar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Worker Sheet (Add / Edit) ────────────────────────────────────────────────

function WorkerSheet({ open, onClose, worker, farms, onSaved }) {
  const { tenant } = useAuth()
  const isEdit = !!worker
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    peternak_farm_id: '',
    full_name: '',
    phone: '',
    join_date: today,
    base_salary: 0,
    bonus_per_kg: 0,
    fcr_target: '',
    notes: '',
    status: 'aktif',
  })
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (open) {
      setForm(worker ? {
        peternak_farm_id: worker.peternak_farm_id ?? '',
        full_name: worker.full_name ?? '',
        phone: worker.phone ?? '',
        join_date: worker.join_date ?? today,
        base_salary: worker.base_salary ?? 0,
        bonus_per_kg: worker.bonus_per_kg ?? 0,
        fcr_target: worker.fcr_target ?? '',
        notes: worker.notes ?? '',
        status: worker.status ?? 'aktif',
      } : {
        peternak_farm_id: '', full_name: '', phone: '', join_date: today,
        base_salary: 0, bonus_per_kg: 0, fcr_target: '', notes: '', status: 'aktif',
      })
    }
  }, [open, worker])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const canSubmit = form.full_name && form.peternak_farm_id

  const handleSubmit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    try {
      const payload = {
        tenant_id: tenant.id,
        peternak_farm_id: form.peternak_farm_id,
        full_name: form.full_name,
        phone: form.phone || null,
        join_date: form.join_date || null,
        salary_system: 'flat_bonus',
        base_salary: Number(form.base_salary) || 0,
        bonus_per_kg: Number(form.bonus_per_kg) || 0,
        fcr_target: form.fcr_target ? parseFloat(form.fcr_target) : null,
        notes: form.notes || null,
        status: form.status,
      }

      if (isEdit) {
        const { error } = await supabase.from('farm_workers').update(payload).eq('id', worker.id)
        if (error) throw error
        toast.success('Data anak kandang diperbarui!')
      } else {
        const { error } = await supabase.from('farm_workers').insert([payload])
        if (error) throw error
        toast.success('Anak kandang berhasil ditambahkan!')
      }

      onSaved()
      onClose()
    } catch (err) {
      console.error('WorkerSheet error:', err)
      toast.error('Gagal menyimpan data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-[#0C1319] border-white/8 rounded-t-[24px] max-h-[94vh] overflow-y-auto p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/5">
          <SheetTitle className="text-white font-display font-black text-base">
            {isEdit ? 'Edit Anak Kandang' : 'Tambah Anak Kandang'}
          </SheetTitle>
          <p className="text-[#4B6478] text-xs mt-0.5">Sistem gaji: Flat + Bonus Panen</p>
        </SheetHeader>

        <div style={{ padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Kandang */}
          <div>
            <label htmlFor="worker_farm" style={labelStyle}>Kandang *</label>
            <select
              id="worker_farm"
              name="worker_farm"
              value={form.peternak_farm_id}
              onChange={e => setField('peternak_farm_id', e.target.value)}
              style={inputStyle}
            >
              <option value="">— Pilih Kandang —</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.farm_name}</option>
              ))}
            </select>
          </div>

          {/* Nama */}
          <div>
            <label htmlFor="worker_name" style={labelStyle}>Nama Lengkap *</label>
            <input
              id="worker_name"
              name="worker_name"
              type="text"
              placeholder="cth. Budi Santoso"
              value={form.full_name}
              onChange={e => setField('full_name', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* HP */}
          <div>
            <label htmlFor="worker_phone" style={labelStyle}>No. HP</label>
            <PhoneInput
              id="worker_phone"
              name="worker_phone"
              placeholder="cth. 08123456789"
              value={form.phone}
              onChange={e => setField('phone', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Tanggal bergabung */}
          <div>
            <label style={labelStyle}>Tanggal Bergabung</label>
            <DatePicker
              value={form.join_date}
              onChange={v => setField('join_date', v)}
              placeholder="Pilih tanggal"
            />
          </div>

          {/* Gaji pokok */}
          <div>
            <label style={labelStyle}>Gaji Pokok per Bulan</label>
            <InputRupiah
              value={form.base_salary}
              onChange={v => setField('base_salary', v)}
              placeholder="2500000"
            />
          </div>

          {/* Bonus per kg */}
          <div>
            <label style={labelStyle}>
              Bonus per kg saat Panen
              <span style={{ color: '#4B6478', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                {' '}— opsional
              </span>
            </label>
            <InputRupiah
              value={form.bonus_per_kg}
              onChange={v => setField('bonus_per_kg', v)}
              placeholder="100"
            />
          </div>

          {/* Target FCR */}
          <div>
            <label htmlFor="worker_fcr_target" style={labelStyle}>
              Target FCR untuk Bonus
              <span style={{ color: '#4B6478', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                {' '}— opsional, cth. 1.6
              </span>
            </label>
            <input
              id="worker_fcr_target"
              name="worker_fcr_target"
              type="number"
              step="0.1"
              min="0"
              placeholder="1.6"
              value={form.fcr_target}
              onChange={e => setField('fcr_target', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'aktif',    label: '✅ Aktif' },
                { value: 'nonaktif', label: '⛔ Nonaktif' },
              ].map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setField('status', s.value)}
                  style={{
                    flex: 1, padding: '10px 8px',
                    background: form.status === s.value
                      ? s.value === 'aktif' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${form.status === s.value
                      ? s.value === 'aktif' ? '#34D399' : '#F87171'
                      : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10,
                    color: form.status === s.value
                      ? s.value === 'aktif' ? '#34D399' : '#F87171'
                      : '#4B6478',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label htmlFor="worker_notes" style={labelStyle}>Catatan</label>
            <textarea
              id="worker_notes"
              name="worker_notes"
              placeholder="Catatan tambahan..."
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            style={{
              ...submitBtnStyle,
              ...(!canSubmit || loading ? { opacity: 0.4, cursor: 'not-allowed', boxShadow: 'none' } : {}),
            }}
          >
            {loading ? 'Menyimpan...' : isEdit ? '✏️ Perbarui Data' : '👤 Tambah Pekerja'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Payment Sheet ────────────────────────────────────────────────────────────

function PaymentSheet({ open, onClose, worker }) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split('T')[0]

  const [addMode, setAddMode] = useState(false)
  const [form, setForm] = useState({
    payment_date: today,
    payment_type: 'gaji',
    amount: 0,
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['worker-payments', worker?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worker_payments')
        .select('*')
        .eq('worker_id', worker.id)
        .order('payment_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!worker?.id && open,
  })

  const totalPaid = useMemo(
    () => payments.reduce((s, p) => s + (p.amount || 0), 0),
    [payments]
  )

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = async () => {
    if (!form.amount || loading || !worker) return
    setLoading(true)
    try {
      const { error } = await supabase.from('worker_payments').insert([{
        tenant_id: tenant.id,
        worker_id: worker.id,
        payment_date: form.payment_date,
        payment_type: form.payment_type,
        amount: Number(form.amount),
        notes: form.notes || null,
      }])
      if (error) throw error
      toast.success('Pembayaran tercatat!')
      queryClient.invalidateQueries({ queryKey: ['worker-payments', worker.id] })
      setForm({ payment_date: today, payment_type: 'gaji', amount: 0, notes: '' })
      setAddMode(false)
    } catch (err) {
      console.error('PaymentSheet error:', err)
      toast.error('Gagal mencatat pembayaran.')
    } finally {
      setLoading(false)
    }
  }

  if (!worker) return null

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-[#0C1319] border-white/8 rounded-t-[24px] max-h-[94vh] overflow-y-auto p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/5">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <SheetTitle className="text-white font-display font-black text-base">
                Riwayat Bayar — {worker.full_name}
              </SheetTitle>
              <p className="text-[#4B6478] text-xs mt-0.5">
                {payments.length} transaksi · Total {formatIDR(totalPaid)}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={addBtnStyle}
              onClick={() => setAddMode(v => !v)}
            >
              <Plus size={12} /> Catat
            </motion.button>
          </div>
        </SheetHeader>

        <div style={{ padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── Add form ── */}
          {addMode && (
            <div style={addFormBoxStyle}>
              <p style={addFormTitleStyle}>Catat Pembayaran Baru</p>

              <div>
                <label style={labelStyle}>Tanggal</label>
                <DatePicker
                  value={form.payment_date}
                  onChange={v => setField('payment_date', v)}
                  placeholder="Pilih tanggal"
                />
              </div>

              <div>
                <label style={labelStyle}>Tipe Pembayaran</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PAYMENT_TYPES.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setField('payment_type', opt.value)}
                      style={{
                        padding: '7px 12px',
                        background: form.payment_type === opt.value
                          ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${form.payment_type === opt.value
                          ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 99,
                        color: form.payment_type === opt.value ? '#A78BFA' : '#4B6478',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Jumlah *</label>
                <InputRupiah
                  value={form.amount}
                  onChange={v => setField('amount', v)}
                  placeholder="500000"
                />
              </div>

              <div>
                <label htmlFor="pay_notes" style={labelStyle}>Catatan</label>
                <input
                  id="pay_notes"
                  name="pay_notes"
                  type="text"
                  placeholder="cth. Gaji bulan Maret"
                  value={form.notes}
                  onChange={e => setField('notes', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setAddMode(false)}
                  style={cancelBtnStyle}
                >
                  Batal
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!form.amount || loading}
                  style={{
                    flex: 2, ...submitBtnStyle,
                    ...(!form.amount || loading
                      ? { opacity: 0.4, cursor: 'not-allowed', boxShadow: 'none' } : {}),
                  }}
                >
                  {loading ? 'Menyimpan...' : '💾 Simpan'}
                </button>
              </div>
            </div>
          )}

          {/* ── Payment list ── */}
          {isLoading ? (
            <LoadingSpinner />
          ) : payments.length === 0 ? (
            <div style={{ ...emptyStyle, marginTop: 8 }}>
              <p style={{ color: '#4B6478', fontSize: 13 }}>Belum ada riwayat pembayaran</p>
            </div>
          ) : (
            payments.map(p => (
              <div key={p.id} style={paymentRowStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: '#F1F5F9' }}>
                      {formatIDR(p.amount)}
                    </p>
                    <p style={{ fontSize: 11, color: '#4B6478', marginTop: 2 }}>
                      {fmt(p.payment_date)}
                      {p.notes ? ` · ${p.notes}` : ''}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                    color: typeColor(p.payment_type),
                    background: `${typeColor(p.payment_type)}18`,
                    border: `1px solid ${typeColor(p.payment_type)}33`,
                  }}>
                    {typeLabel(p.payment_type)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}


