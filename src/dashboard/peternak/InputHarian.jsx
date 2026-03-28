import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit3, CheckCircle2, AlertCircle, Save } from 'lucide-react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import FarmContextBar from './components/FarmContextBar'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  useActiveCycles, useUpsertDailyRecord, calcCurrentAge,
} from '../../lib/hooks/usePeternakData'
import LoadingSpinner from '../components/LoadingSpinner'

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

const CHICKEN_TYPE_LABELS = {
  ayam_broiler:  'Broiler 🐔',
  ayam_kampung:  'Kampung',
  ayam_pejantan: 'Pejantan',
  ayam_layer:    'Layer 🥚',
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function daysBetween(from, to) {
  if (!from || !to) return 0
  return Math.max(0, Math.floor((new Date(to) - new Date(from)) / 86400000))
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InputHarian() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { farmId } = useParams()           // present when at /peternak/kandang/:farmId/input
  const paramCycleId = searchParams.get('cycle')

  const { data: allActiveCycles = [], isLoading } = useActiveCycles()
  const upsert = useUpsertDailyRecord()

  // When at Level-2 route, only show this farm's cycles
  const activeCycles = farmId
    ? allActiveCycles.filter(c => c.peternak_farm_id === farmId)
    : allActiveCycles

  const [selectedCycleId, setSelectedCycleId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [form, setForm] = useState({ mortality_count: '', feed_kg: '', avg_weight_kg: '', notes: '' })

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Resolve active cycle
  const resolvedId = paramCycleId || selectedCycleId || activeCycles[0]?.id
  const cycle = activeCycles.find(c => c.id === resolvedId) ?? activeCycles[0] ?? null
  const farm  = cycle?.peternak_farms ?? {}

  // All records sorted desc for history display
  const allRecords = useMemo(
    () => [...(cycle?.daily_records ?? [])].sort((a, b) => new Date(b.record_date) - new Date(a.record_date)),
    [cycle]
  )

  // Running totals (excluding the selected date row)
  const totals = useMemo(() => {
    const excl = allRecords.filter(r => r.record_date !== selectedDate)
    const mort  = excl.reduce((s, r) => s + (r.mortality_count || 0), 0)
    const feed  = excl.reduce((s, r) => s + (parseFloat(r.feed_kg) || 0), 0)
    return { mort, feed }
  }, [allRecords, selectedDate])

  // Pre-fill form when date or cycle changes
  useEffect(() => {
    const existing = allRecords.find(r => r.record_date === selectedDate)
    if (existing) {
      setForm({
        mortality_count: existing.mortality_count != null ? String(existing.mortality_count) : '',
        feed_kg:         existing.feed_kg != null         ? String(existing.feed_kg)         : '',
        avg_weight_kg:   existing.avg_weight_kg != null   ? String(existing.avg_weight_kg)   : '',
        notes:           existing.notes ?? '',
      })
    } else {
      setForm({ mortality_count: '', feed_kg: '', avg_weight_kg: '', notes: '' })
    }
  }, [selectedDate, cycle?.id])

  // Derived preview values
  const ageDays = daysBetween(cycle?.start_date, selectedDate)
  const existingToday = allRecords.find(r => r.record_date === selectedDate)
  const hasRecord = !!existingToday

  const totalMortPreview   = totals.mort + (parseInt(form.mortality_count) || 0)
  const totalFeedPreview   = totals.feed + (parseFloat(form.feed_kg) || 0)
  const alivePreview       = Math.max(0, (cycle?.doc_count ?? 0) - totalMortPreview)
  const mortPctPreview     = cycle?.doc_count ? ((totalMortPreview / cycle.doc_count) * 100).toFixed(1) : '0.0'
  const avgWeightPreview   = parseFloat(form.avg_weight_kg) || 0
  const estFCR = avgWeightPreview > 0 && alivePreview > 0
    ? (totalFeedPreview / (alivePreview * avgWeightPreview)).toFixed(2)
    : null

  const last7 = allRecords.slice(0, 7)

  const canSubmit = cycle && selectedDate && !upsert.isPending

  const handleSubmit = async () => {
    if (!canSubmit) return
    await upsert.mutateAsync({
      cycle_id:        cycle.id,
      record_date:     selectedDate,
      age_days:        ageDays,
      mortality_count: parseInt(form.mortality_count) || 0,
      feed_kg:         parseFloat(form.feed_kg) || 0,
      avg_weight_kg:   parseFloat(form.avg_weight_kg) || null,
      notes:           form.notes || null,
    })
  }

  if (isLoading) return <LoadingSpinner fullPage />

  if (activeCycles.length === 0) {
    return (
      <div className="text-slate-100 pb-10">
        <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
          <h1 className="font-['Sora'] font-extrabold text-xl">Input Harian</h1>
        </header>
        <div className="mx-4 mt-8 py-12 text-center bg-[#0C1319] rounded-2xl border border-dashed border-white/[0.05]">
          <span className="text-4xl">📋</span>
          <p className="text-[#4B6478] text-sm mt-3">Belum ada siklus aktif untuk di-input</p>
          <button
            className="mt-4 px-5 py-2.5 bg-[#7C3AED] text-white text-sm font-bold font-['Sora'] rounded-xl border-none cursor-pointer"
            onClick={() => navigate('/peternak/siklus?action=new')}
          >
            Mulai Siklus Baru
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-slate-100 pb-10">

      {farmId && <FarmContextBar subPath="input" />}

      {/* ── Header ── */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04] flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              className="text-[#4B6478] hover:text-slate-100 transition-colors cursor-pointer bg-transparent border-none p-0 md:hidden"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-['Sora'] font-extrabold text-xl">Input Harian</h1>
          </div>
          <p className="text-xs text-[#4B6478]">
            {farm.farm_name ?? '—'} · Siklus #{cycle?.cycle_number}
          </p>
        </div>
        <span className="text-[11px] font-extrabold text-[#A78BFA] bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] px-2.5 py-1 rounded-full flex-shrink-0">
          Hari ke-{calcCurrentAge(cycle?.start_date)}
        </span>
      </header>

      <div className="px-4">

        {/* ── Cycle selector (multi-cycle) ── */}
        {activeCycles.length > 1 && !paramCycleId && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {activeCycles.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCycleId(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  cycle?.id === c.id
                    ? 'bg-[rgba(124,58,237,0.12)] border-[rgba(124,58,237,0.3)] text-[#A78BFA]'
                    : 'bg-white/[0.04] border-white/[0.08] text-[#4B6478]'
                }`}
              >
                {c.peternak_farms?.farm_name ?? `Siklus #${c.cycle_number}`}
              </button>
            ))}
          </div>
        )}

        {/* ── SECTION A — Cycle Summary Card ── */}
        <section className="mt-4 bg-[#111C24] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-['Sora'] font-bold text-[14px] text-slate-100">
                🏠 {farm.farm_name ?? '—'} · Siklus #{cycle?.cycle_number}
              </p>
              <p className="text-[11px] text-[#4B6478] mt-0.5">
                {CHICKEN_TYPE_LABELS[cycle?.chicken_type] ?? cycle?.chicken_type ?? '—'}
                {farm.mitra_company ? ` · ${farm.mitra_company}` : ''}
              </p>
            </div>
            <span className="text-[11px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full font-bold">
              Aktif
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <SummaryStat label="Umur" value={`${calcCurrentAge(cycle?.start_date)}hr`} color="text-[#A78BFA]" />
            <SummaryStat label="Populasi" value={(alivePreview).toLocaleString('id-ID')} color="text-emerald-400" />
            <SummaryStat label="Total Mati" value={totalMortPreview} color={totalMortPreview > 0 ? 'text-red-400' : 'text-slate-400'} />
            <SummaryStat label="Total Pakan" value={`${totalFeedPreview.toFixed(0)}kg`} color="text-amber-400" />
          </div>
        </section>

        {/* ── SECTION B — Date Picker ── */}
        <section className="mt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">
                Tanggal Input
              </label>
              <DatePicker
                value={selectedDate}
                onChange={v => setSelectedDate(v)}
                placeholder="Pilih tanggal"
              />
            </div>
            <div className="mt-5 flex-shrink-0">
              {hasRecord
                ? <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1.5 rounded-xl">
                    <CheckCircle2 size={12} /> Sudah diisi
                  </span>
                : <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1.5 rounded-xl">
                    <AlertCircle size={12} /> Belum diisi
                  </span>
              }
            </div>
          </div>
          <p className="text-[11px] text-[#4B6478] mt-1.5">
            Hari ke-{ageDays} · {fmtDate(selectedDate)}
          </p>
        </section>

        {/* ── SECTION C — Form Input ── */}
        <section className="mt-4 bg-[#111C24] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-4">

          <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest">
            Catatan Hari ke-{ageDays}
          </p>

          {/* Kematian */}
          <div>
            <label htmlFor="mortality_count" className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Kematian Hari Ini (ekor)
            </label>
            <input
              id="mortality_count"
              name="mortality_count"
              type="number"
              min="0"
              placeholder="0"
              value={form.mortality_count}
              onChange={e => setField('mortality_count', e.target.value)}
              className="w-full px-3.5 py-3 bg-[#0C1319] border border-white/[0.08] rounded-xl text-[15px] text-slate-100 placeholder-[#4B6478] outline-none"
            />
            <p className="text-[11px] text-[#4B6478] mt-1">
              Total kematian: <span className={`font-bold ${totalMortPreview > 0 ? 'text-red-400' : 'text-slate-400'}`}>{totalMortPreview} ekor ({mortPctPreview}%)</span>
            </p>
          </div>

          {/* Pakan */}
          <div>
            <label htmlFor="feed_kg" className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Pakan Hari Ini (kg)
            </label>
            <input
              id="feed_kg"
              name="feed_kg"
              type="number"
              min="0"
              step="0.5"
              placeholder="0.0"
              value={form.feed_kg}
              onChange={e => setField('feed_kg', e.target.value)}
              className="w-full px-3.5 py-3 bg-[#0C1319] border border-white/[0.08] rounded-xl text-[15px] text-slate-100 placeholder-[#4B6478] outline-none"
            />
            <p className="text-[11px] text-[#4B6478] mt-1">
              Total pakan: <span className="font-bold text-amber-400">{totalFeedPreview.toFixed(1)} kg</span>
            </p>
          </div>

          {/* Berat rata-rata */}
          <div>
            <label htmlFor="avg_weight_kg" className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Berat Rata-rata (kg) <span className="text-[#4B6478] font-normal normal-case">— opsional</span>
            </label>
            <input
              id="avg_weight_kg"
              name="avg_weight_kg"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.000"
              value={form.avg_weight_kg}
              onChange={e => setField('avg_weight_kg', e.target.value)}
              className="w-full px-3.5 py-3 bg-[#0C1319] border border-white/[0.08] rounded-xl text-[15px] text-slate-100 placeholder-[#4B6478] outline-none"
            />
            {estFCR && (
              <p className="text-[11px] mt-1">
                Est. FCR saat ini: <span className={`font-bold ${parseFloat(estFCR) < 1.7 ? 'text-emerald-400' : parseFloat(estFCR) < 1.9 ? 'text-amber-400' : 'text-red-400'}`}>{estFCR}</span>
              </p>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label htmlFor="input_notes" className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Catatan <span className="text-[#4B6478] font-normal normal-case">— opsional</span>
            </label>
            <textarea
              id="input_notes"
              name="input_notes"
              placeholder="Kondisi kandang, cuaca, dll..."
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3.5 py-3 bg-[#0C1319] border border-white/[0.08] rounded-xl text-[14px] text-slate-100 placeholder-[#4B6478] outline-none resize-none leading-relaxed"
            />
            <p className="text-[10px] text-[#4B6478] mt-0.5 text-right">{form.notes.length}/500</p>
          </div>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-3.5 rounded-xl text-white text-[15px] font-extrabold font-['Sora'] border-none flex items-center justify-center gap-2 transition-opacity ${
              canSubmit
                ? 'bg-[#7C3AED] shadow-[0_4px_16px_rgba(124,58,237,0.3)] cursor-pointer'
                : 'opacity-40 cursor-not-allowed bg-[#7C3AED]'
            }`}
          >
            <Save size={16} />
            {upsert.isPending ? 'Menyimpan...' : hasRecord ? 'Update Catatan' : 'Simpan Catatan'}
          </motion.button>
        </section>

        {/* ── SECTION D — Riwayat 7 Hari ── */}
        {last7.length > 0 && (
          <section className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-['Sora'] font-extrabold text-[14px] text-slate-100 uppercase tracking-wider text-[10px] text-[#4B6478]">
                RIWAYAT INPUT
              </h2>
              <span className="text-[11px] text-[#A78BFA] bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] px-2 py-0.5 rounded-full font-bold">
                {last7.length} hari
              </span>
            </div>

            <div className="bg-[#0C1319] border border-white/[0.08] rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[80px_40px_48px_64px_64px_40px] gap-0 px-3 py-2.5 border-b border-white/[0.05]">
                {['Tanggal', 'Umur', 'Mati', 'Pakan', 'Berat', ''].map((h, i) => (
                  <span key={i} className="text-[9px] font-extrabold text-[#4B6478] uppercase tracking-wider">{h}</span>
                ))}
              </div>

              {last7.map((rec, idx) => (
                <HistoryRow
                  key={rec.id ?? rec.record_date}
                  rec={rec}
                  isLast={idx === last7.length - 1}
                  isSelected={rec.record_date === selectedDate}
                  onEdit={() => setSelectedDate(rec.record_date)}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

// ─── Summary Stat ─────────────────────────────────────────────────────────────

function SummaryStat({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="text-[9px] text-[#4B6478] font-semibold uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`font-['Sora'] text-sm font-extrabold ${color}`}>{value}</p>
    </div>
  )
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({ rec, isLast, isSelected, onEdit }) {
  const mort = rec.mortality_count ?? 0
  const weightG = rec.avg_weight_kg ? Math.round(rec.avg_weight_kg * 1000) : null

  return (
    <div className={`grid grid-cols-[80px_40px_48px_64px_64px_40px] gap-0 px-3 py-2.5 items-center ${
      isSelected ? 'bg-[rgba(124,58,237,0.08)]' : ''
    } ${!isLast ? 'border-b border-white/[0.04]' : ''}`}>
      <span className={`text-[11px] font-bold ${isSelected ? 'text-[#A78BFA]' : 'text-slate-300'}`}>
        {new Date(rec.record_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
      </span>
      <span className="text-[11px] text-[#4B6478]">{rec.age_days ?? '—'}hr</span>
      <span className={`text-[11px] font-bold ${mort > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{mort}</span>
      <span className="text-[11px] text-slate-400">{parseFloat(rec.feed_kg || 0).toFixed(1)}kg</span>
      <span className="text-[11px] text-slate-400">{weightG ? `${weightG}g` : '—'}</span>
      <button
        className="flex items-center justify-center text-[#4B6478] hover:text-[#A78BFA] transition-colors cursor-pointer bg-transparent border-none p-0"
        onClick={onEdit}
        title="Edit record ini"
      >
        <Edit3 size={13} />
      </button>
    </div>
  )
}
