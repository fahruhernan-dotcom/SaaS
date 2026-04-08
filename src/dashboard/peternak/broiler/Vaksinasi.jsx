import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'
import {
  useAllCycles, useVaccinationRecords, calcCurrentAge,
} from '@/lib/hooks/usePeternakData'
import { toast } from 'sonner'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

// Standard broiler vaccination schedule (Cobb 500 / Arbor Acres)
// windowStart/windowEnd = hari ke berapa vaksin harus diberikan
const STANDARD_SCHEDULE = [
  {
    id: 'nd_ib_1',
    name: 'ND + IB',
    disease: 'Newcastle Disease + Infectious Bronchitis',
    windowStart: 1,
    windowEnd: 4,
    method: 'tetes_mata',
    methodLabel: 'Tetes Mata',
    color: '#A78BFA',
    icon: '💉',
    notes: 'Vaksin kombinasi ND-IB pertama pada DOC tiba.',
  },
  {
    id: 'gumboro_1',
    name: 'Gumboro IBD',
    disease: 'Infectious Bursal Disease (Gumboro)',
    windowStart: 7,
    windowEnd: 10,
    method: 'air_minum',
    methodLabel: 'Air Minum',
    color: '#34D399',
    icon: '💧',
    notes: 'Vaksin Gumboro pertama, diberikan lewat air minum 2 jam.',
  },
  {
    id: 'nd_ib_2',
    name: 'ND + IB Booster',
    disease: 'Newcastle Disease + Infectious Bronchitis (Ulangan)',
    windowStart: 14,
    windowEnd: 17,
    method: 'air_minum',
    methodLabel: 'Air Minum / Spray',
    color: '#60A5FA',
    icon: '💉',
    notes: 'Booster ND-IB kedua untuk mempertahankan kekebalan.',
  },
  {
    id: 'gumboro_2',
    name: 'Gumboro IBD Booster',
    disease: 'Infectious Bursal Disease (Ulangan)',
    windowStart: 18,
    windowEnd: 22,
    method: 'air_minum',
    methodLabel: 'Air Minum',
    color: '#34D399',
    icon: '💧',
    notes: 'Booster Gumboro kedua. Wajib sebelum maternal antibodi turun.',
  },
  {
    id: 'nd_3',
    name: 'ND Booster',
    disease: 'Newcastle Disease (Opsional)',
    windowStart: 28,
    windowEnd: 35,
    method: 'spray',
    methodLabel: 'Spray',
    color: '#F59E0B',
    icon: '🌬️',
    notes: 'Opsional — diperlukan jika periode panen > 35 hari.',
    optional: true,
  },
]

const METHOD_LABELS = {
  tetes_mata:  'Tetes Mata',
  air_minum:   'Air Minum',
  spray:       'Spray',
  suntik:      'Suntik',
}

const METHOD_OPTIONS = Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label }))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getScheduleStatus(schedule, age, records) {
  const done = records.find(r =>
    r.disease_target === schedule.disease ||
    r.vaccine_name?.toLowerCase().includes(schedule.name.toLowerCase().split(' ')[0].toLowerCase())
  )
  if (done) return { status: 'done', record: done }
  if (age > schedule.windowEnd) return { status: 'overdue' }
  if (age >= schedule.windowStart) return { status: 'due_now' }
  return { status: 'upcoming' }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Vaksinasi() {
  const { tenant } = useAuth()
  const p = usePeternakPermissions()
  const [searchParams] = useSearchParams()
  const [selectedCycleId, setSelectedCycleId] = useState(searchParams.get('cycle') ?? null)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [prefillSchedule, setPrefillSchedule] = useState(null)

  const { data: allCycles = [], isLoading } = useAllCycles()
  const activeCycles = allCycles.filter(c => c.status === 'active')
  const effectiveCycleId = selectedCycleId ?? activeCycles[0]?.id ?? null
  const selectedCycle = allCycles.find(c => c.id === effectiveCycleId) ?? null

  const { data: records = [], isLoading: recordsLoading } = useVaccinationRecords(effectiveCycleId)
  const queryClient = useQueryClient()

  const age = selectedCycle ? calcCurrentAge(selectedCycle.start_date) : 0
  const farmName = selectedCycle?.peternak_farms?.farm_name ?? '—'

  // Build schedule status for selected cycle
  const scheduleStatus = useMemo(
    () => STANDARD_SCHEDULE.map(s => ({ ...s, ...getScheduleStatus(s, age, records) })),
    [age, records]
  )

  const overdueCount   = scheduleStatus.filter(s => s.status === 'overdue').length
  const dueNowCount    = scheduleStatus.filter(s => s.status === 'due_now').length
  const doneCount      = scheduleStatus.filter(s => s.status === 'done').length

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-10">

      {/* ── Header ── */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <h1 className="font-['Sora'] font-extrabold text-xl text-slate-100">Program Vaksinasi</h1>
        <p className="text-xs text-[#4B6478] mt-0.5">Jadwal & Pencatatan Vaksinasi Broiler</p>
      </header>

      <div className="px-4 mt-4 flex flex-col gap-5">

        {/* ── Cycle selector ── */}
        {activeCycles.length > 1 && (
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-2 min-w-max">
              {activeCycles.map(c => {
                const isSelected = c.id === effectiveCycleId
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCycleId(c.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border cursor-pointer transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-[rgba(124,58,237,0.12)] border-[rgba(124,58,237,0.4)] text-[#A78BFA]'
                        : 'bg-white/[0.04] border-white/[0.08] text-[#4B6478]'
                    }`}
                  >
                    🏠 {c.peternak_farms?.farm_name ?? '—'} · Siklus #{c.cycle_number}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {activeCycles.length === 0 && (
          <div className="py-12 text-center bg-[#0C1319] rounded-2xl border border-dashed border-white/[0.06]">
            <span className="text-4xl">💉</span>
            <p className="text-[#4B6478] text-sm mt-3">Belum ada siklus aktif.</p>
            <p className="text-[10px] text-[#4B6478] mt-1">Mulai siklus terlebih dahulu untuk mencatat vaksinasi.</p>
          </div>
        )}

        {selectedCycle && (
          <>
            {/* ── Cycle info + summary chips ── */}
            <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-['Sora'] font-extrabold text-[14px] text-slate-100">
                    🏠 {farmName} · Siklus #{selectedCycle.cycle_number}
                  </p>
                  <p className="text-[11px] text-[#4B6478] mt-0.5">
                    Hari ke-{age} · DOC: {(selectedCycle.doc_count ?? 0).toLocaleString('id-ID')} ekor
                  </p>
                </div>
                {p.canCatatVaksinasi && (
                  <button
                    onClick={() => { setPrefillSchedule(null); setAddSheetOpen(true) }}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#A78BFA] bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] px-2.5 py-1.5 rounded-lg cursor-pointer"
                  >
                    <Plus size={11} />
                    Catat Vaksin
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <StatusChip count={doneCount}    label="Selesai"  color="#34D399" bg="rgba(52,211,153,0.08)"   border="rgba(52,211,153,0.2)" />
                <StatusChip count={dueNowCount}  label="Sekarang" color="#F59E0B" bg="rgba(245,158,11,0.08)"   border="rgba(245,158,11,0.2)" />
                <StatusChip count={overdueCount} label="Terlambat" color="#F87171" bg="rgba(248,113,113,0.08)" border="rgba(248,113,113,0.2)" />
              </div>
            </div>

            {/* ── Vaccination schedule timeline ── */}
            <section>
              <h2 className="font-['Sora'] font-extrabold text-[13px] text-slate-100 mb-3">
                Jadwal Standar Broiler
              </h2>
              <div className="flex flex-col gap-3">
                {scheduleStatus.map((s, i) => (
                  <ScheduleCard
                    key={s.id}
                    schedule={s}
                    isLast={i === scheduleStatus.length - 1}
                    onLog={() => { setPrefillSchedule(s); setAddSheetOpen(true) }}
                    canCatat={p.canCatatVaksinasi}
                  />
                ))}
              </div>
            </section>

            {/* ── Vaccination history ── */}
            {records.length > 0 && (
              <section>
                <h2 className="font-['Sora'] font-extrabold text-[13px] text-slate-100 mb-3">
                  Riwayat Vaksinasi ({records.length} catatan)
                </h2>
                <div className="bg-[#0C1319] border border-white/[0.08] rounded-2xl overflow-hidden">
                  {[...records].reverse().map((r, idx, arr) => (
                    <div
                      key={r.id}
                      className={`px-4 py-3 flex items-start justify-between gap-3 ${idx < arr.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[13px] text-slate-100">{r.vaccine_name}</p>
                        {r.disease_target && (
                          <p className="text-[11px] text-[#4B6478] mt-0.5">{r.disease_target}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] text-[#4B6478]">{fmt(r.vaccination_date)}</span>
                          {r.age_days != null && (
                            <span className="text-[10px] font-bold text-[#A78BFA] bg-[rgba(124,58,237,0.1)] px-1.5 py-0.5 rounded-full">
                              Hari ke-{r.age_days}
                            </span>
                          )}
                          {r.method && (
                            <span className="text-[10px] text-[#4B6478]">· {METHOD_LABELS[r.method] ?? r.method}</span>
                          )}
                          {r.dose_per_bird && (
                            <span className="text-[10px] text-[#4B6478]">· {r.dose_per_bird} dosis/ekor</span>
                          )}
                        </div>
                        {r.notes && (
                          <p className="text-[11px] text-[#4B6478] mt-1 italic">"{r.notes}"</p>
                        )}
                      </div>
                      <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {records.length === 0 && !recordsLoading && (
              <div className="py-8 text-center bg-[#0C1319] rounded-2xl border border-dashed border-white/[0.06]">
                <span className="text-3xl">💉</span>
                <p className="text-[#4B6478] text-sm mt-2">Belum ada catatan vaksinasi untuk siklus ini.</p>
                <button
                  onClick={() => { setPrefillSchedule(null); setAddSheetOpen(true) }}
                  className="mt-3 px-4 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  + Catat Vaksinasi Pertama
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add vaccination sheet (write-capable roles only) ── */}
      {selectedCycle && p.canCatatVaksinasi && (
        <AddVaccinationSheet
          open={addSheetOpen}
          onClose={() => { setAddSheetOpen(false); setPrefillSchedule(null) }}
          cycle={selectedCycle}
          tenantId={tenant?.id}
          prefill={prefillSchedule}
          cycleAge={age}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['vaccination-records', effectiveCycleId] })}
        />
      )}
    </div>
  )
}

// ─── Schedule Card ─────────────────────────────────────────────────────────────

function ScheduleCard({ schedule, isLast, onLog, canCatat = true }) {
  const [expanded, setExpanded] = useState(false)

  const statusCfg = {
    done:     { label: 'Selesai ✓',     bg: 'rgba(52,211,153,0.08)',   border: 'rgba(52,211,153,0.25)',   dot: '#34D399', text: 'text-emerald-400' },
    due_now:  { label: 'Waktunya Kini', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.3)',    dot: '#F59E0B', text: 'text-amber-400' },
    overdue:  { label: 'Terlambat ⚠️',  bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.3)',   dot: '#F87171', text: 'text-red-400' },
    upcoming: { label: `Hari ${schedule.windowStart}–${schedule.windowEnd}`, bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.07)', dot: '#4B6478', text: 'text-[#4B6478]' },
  }[schedule.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, borderRadius: 16, padding: 14 }}
    >
      <div className="flex items-start gap-3">
        {/* Timeline dot */}
        <div className="flex flex-col items-center mt-1 flex-shrink-0">
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusCfg.dot, boxShadow: `0 0 0 3px ${statusCfg.dot}22` }} />
          {!isLast && <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)', marginTop: 4 }} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base leading-none">{schedule.icon}</span>
                <span className="font-['Sora'] font-extrabold text-[13px] text-slate-100">{schedule.name}</span>
                {schedule.optional && (
                  <span className="text-[9px] font-bold text-[#4B6478] bg-white/[0.06] px-1.5 py-0.5 rounded-full">Opsional</span>
                )}
              </div>
              <p className="text-[11px] text-[#4B6478] mt-0.5">{schedule.methodLabel} · Hari ke-{schedule.windowStart}–{schedule.windowEnd}</p>
            </div>
            <span className={`text-[10px] font-extrabold flex-shrink-0 ${statusCfg.text}`}>
              {statusCfg.label}
            </span>
          </div>

          {/* Done: show record info */}
          {schedule.status === 'done' && schedule.record && (
            <div className="mt-2 text-[10px] text-emerald-400 font-semibold">
              ✓ Dilaksanakan {fmt(schedule.record.vaccination_date)}
              {schedule.record.age_days != null ? ` (hari ke-${schedule.record.age_days})` : ''}
            </div>
          )}

          {/* Expandable notes */}
          {schedule.status !== 'done' && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 mt-2 text-[10px] text-[#4B6478] bg-transparent border-none cursor-pointer p-0"
            >
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {expanded ? 'Sembunyikan' : 'Info vaksin'}
            </button>
          )}
          {expanded && (
            <p className="text-[11px] text-[#4B6478] mt-1.5 leading-relaxed">{schedule.notes}</p>
          )}

          {/* Action button */}
          {(schedule.status === 'due_now' || schedule.status === 'overdue') && canCatat && (
            <button
              type="button"
              onClick={onLog}
              className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#7C3AED] border-none px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <Plus size={11} />
              Catat Sekarang
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Status Chip ──────────────────────────────────────────────────────────────

function StatusChip({ count, label, color, bg, border }) {
  if (count === 0) return null
  return (
    <span style={{ fontSize: 10, fontWeight: 800, color, background: bg, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: 99 }}>
      {count} {label}
    </span>
  )
}

// ─── Add Vaccination Sheet ────────────────────────────────────────────────────

function AddVaccinationSheet({ open, onClose, cycle, tenantId, prefill, cycleAge, onSuccess }) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    vaccination_date: today,
    vaccine_name: prefill?.name ?? '',
    disease_target: prefill?.disease ?? '',
    method: prefill?.method ?? 'air_minum',
    dose_per_bird: '',
    batch_number: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  // When prefill changes (user taps a different schedule card)
  React.useEffect(() => {
    if (prefill) {
      setForm(f => ({
        ...f,
        vaccine_name: prefill.name,
        disease_target: prefill.disease,
        method: prefill.method,
      }))
    }
  }, [prefill])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Calculate age_days from selected date
  const ageDays = useMemo(() => {
    if (!cycle?.start_date || !form.vaccination_date) return cycleAge
    const start = new Date(cycle.start_date)
    const rec   = new Date(form.vaccination_date)
    return Math.max(0, Math.floor((rec - start) / 86400000))
  }, [cycle?.start_date, form.vaccination_date, cycleAge])

  const handleSubmit = async () => {
    if (!form.vaccine_name.trim()) return toast.error('Nama vaksin wajib diisi')
    setLoading(true)
    try {
      const { error } = await supabase.from('vaccination_records').insert({
        tenant_id: tenantId,
        cycle_id: cycle.id,
        vaccination_date: form.vaccination_date,
        age_days: ageDays,
        vaccine_name: form.vaccine_name.trim(),
        disease_target: form.disease_target.trim() || null,
        method: form.method || null,
        dose_per_bird: form.dose_per_bird ? parseFloat(form.dose_per_bird) : null,
        batch_number: form.batch_number.trim() || null,
        notes: form.notes.trim() || null,
      })
      if (error) throw error
      toast.success(`Vaksinasi ${form.vaccine_name} berhasil dicatat`)
      if (onSuccess) onSuccess()
      setForm({ vaccination_date: today, vaccine_name: '', disease_target: '', method: 'air_minum', dose_per_bird: '', batch_number: '', notes: '' })
      onClose()
    } catch (err) {
      toast.error('Gagal mencatat vaksinasi')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="bg-[#0C1319] border-white/8 rounded-t-[24px] max-h-[90vh] overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/5">
          <SheetTitle className="text-white font-display font-black text-base text-left">Catat Vaksinasi</SheetTitle>
          <SheetDescription className="sr-only">Form pencatatan vaksinasi</SheetDescription>
          <p className="text-[#4B6478] text-xs mt-0.5 text-left">
            🏠 {cycle?.peternak_farms?.farm_name ?? '—'} · Hari ke-{cycleAge}
          </p>
        </SheetHeader>

        <div style={{ padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Quick-select from standard schedule */}
          <div>
            <label style={labelStyle}>Pilih dari Jadwal Standar</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {STANDARD_SCHEDULE.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setField('vaccine_name', s.name)
                    setField('disease_target', s.disease)
                    setField('method', s.method)
                  }}
                  style={{
                    padding: '9px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                    background: form.vaccine_name === s.name ? `${s.color}18` : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${form.vaccine_name === s.name ? s.color : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: form.vaccine_name === s.name ? s.color : '#94A3B8' }}>
                      {s.name}
                    </span>
                    <span style={{ fontSize: 10, color: '#4B6478', marginLeft: 6 }}>
                      Hari {s.windowStart}–{s.windowEnd}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Date */}
          <div>
            <label style={labelStyle}>Tanggal Vaksinasi *</label>
            <DatePicker value={form.vaccination_date} onChange={v => setField('vaccination_date', v)} />
            {ageDays != null && (
              <p style={{ fontSize: 10, color: '#A78BFA', marginTop: 4 }}>
                = Hari ke-{ageDays} siklus
              </p>
            )}
          </div>

          {/* Vaccine name */}
          <div>
            <label style={labelStyle}>Nama Vaksin *</label>
            <input
              type="text"
              placeholder="cth. ND-IB Clone 30, Gumboro D78, ..."
              value={form.vaccine_name}
              onChange={e => setField('vaccine_name', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Disease target */}
          <div>
            <label style={labelStyle}>Target Penyakit</label>
            <input
              type="text"
              placeholder="cth. Newcastle Disease + IB"
              value={form.disease_target}
              onChange={e => setField('disease_target', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Method */}
          <div>
            <label style={labelStyle}>Metode Pemberian</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {METHOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField('method', opt.value)}
                  style={{
                    padding: '10px 12px',
                    background: form.method === opt.value ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${form.method === opt.value ? '#7C3AED' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, color: form.method === opt.value ? '#A78BFA' : '#4B6478',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dose per bird */}
          <div>
            <label style={labelStyle}>Dosis per Ekor (opsional)</label>
            <input
              type="number"
              placeholder="cth. 0.5"
              value={form.dose_per_bird}
              onChange={e => setField('dose_per_bird', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Batch */}
          <div>
            <label style={labelStyle}>Nomor Batch Vaksin (opsional)</label>
            <input
              type="text"
              placeholder="cth. VAX2024-001"
              value={form.batch_number}
              onChange={e => setField('batch_number', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Catatan (opsional)</label>
            <textarea
              placeholder="cth. Kondisi ayam baik, diberikan pagi hari..."
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!form.vaccine_name.trim() || loading}
            style={{
              width: '100%', padding: 14,
              background: !form.vaccine_name.trim() || loading ? 'rgba(124,58,237,0.4)' : '#7C3AED',
              border: 'none', borderRadius: 12, color: 'white',
              fontSize: 15, fontWeight: 800,
              cursor: !form.vaccine_name.trim() || loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Sora', boxShadow: '0 4px 16px rgba(124,58,237,0.3)', marginTop: 4,
            }}
          >
            {loading ? 'Menyimpan...' : '💉 Simpan Vaksinasi'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block', fontSize: 10, fontWeight: 800,
  color: '#4B6478', textTransform: 'uppercase',
  letterSpacing: '0.1em', marginBottom: 6,
}
const inputStyle = {
  width: '100%', padding: '12px 14px',
  background: '#111C24', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, color: '#F1F5F9',
  fontSize: 15, fontFamily: 'DM Sans', outline: 'none',
  boxSizing: 'border-box',
}
