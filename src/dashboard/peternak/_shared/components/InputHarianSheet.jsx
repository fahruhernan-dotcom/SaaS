import React, { useState, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const CONDITION_OPTIONS = [
  { value: 'normal',   label: '✅ Normal',  color: '#34D399' },
  { value: 'waspada',  label: '⚠️ Waspada', color: '#F59E0B' },
  { value: 'kritis',   label: '🔴 Kritis',  color: '#F87171' },
]

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000))
}

export default function InputHarianSheet({ open, onClose, cycle }) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    record_date: today,
    mortality_count: '',
    feed_kg: '',
    avg_weight_gram: '',   // sample berat (gram → convert to kg on submit)
    condition: 'normal',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Real-time calculations ──
  const calc = useMemo(() => {
    const mortality = parseInt(form.mortality_count) || 0
    const feedKg = parseFloat(form.feed_kg) || 0
    const sampleGram = parseFloat(form.avg_weight_gram) || null

    const currentCount = cycle?.current_count ?? cycle?.doc_count ?? 0
    const docCount = cycle?.doc_count ?? 0
    const totalMortSoFar = cycle?.total_mortality ?? 0
    const totalFeedSoFar = parseFloat(cycle?.total_feed_kg) || 0

    const newAlive = Math.max(0, currentCount - mortality)
    const newTotalMort = totalMortSoFar + mortality
    const mortPct = docCount > 0 ? ((newTotalMort / docCount) * 100).toFixed(1) : '0.0'

    const newTotalFeed = totalFeedSoFar + feedKg

    // FCR estimasi: total_feed_kg ÷ (avg_weight_kg × current_count_alive)
    let fcrEst = null
    if (sampleGram && newAlive > 0 && newTotalFeed > 0) {
      const avgWeightKg = sampleGram / 1000
      const estimatedBiomass = avgWeightKg * newAlive
      if (estimatedBiomass > 0) {
        fcrEst = newTotalFeed / estimatedBiomass
      }
    }

    return { newAlive, newTotalMort, mortPct, newTotalFeed, fcrEst }
  }, [form, cycle])

  const farmName = cycle?.peternak_farms?.farm_name ?? 'Kandang'
  const startDate = cycle?.start_date ?? cycle?.created_at
  const ageToday = daysSince(startDate)
  const ageOnRecord = form.record_date
    ? daysSince(startDate) - daysSince(form.record_date)
    : ageToday
  const ageDays = Math.max(0, ageToday - Math.max(0, daysSince(form.record_date)))

  // More accurate: compute age_days as diff between start_date and record_date
  const recordAge = useMemo(() => {
    if (!startDate || !form.record_date) return ageToday
    const start = new Date(startDate)
    const rec = new Date(form.record_date)
    return Math.max(0, Math.floor((rec - start) / 86400000))
  }, [startDate, form.record_date, ageToday])

  const canSubmit = form.record_date && (form.mortality_count !== '' || form.feed_kg !== '')

  const handleSubmit = async () => {
    if (!canSubmit || loading || !cycle) return
    setLoading(true)
    try {
      const mortality = parseInt(form.mortality_count) || 0
      const feedKg = parseFloat(form.feed_kg) || 0
      const avgWeightKg = form.avg_weight_gram ? parseFloat(form.avg_weight_gram) / 1000 : null

      // INSERT daily_records
      const { error: recErr } = await supabase.from('daily_records').insert([{
        tenant_id: tenant.id,
        cycle_id: cycle.id,
        record_date: form.record_date,
        age_days: recordAge,
        mortality_count: mortality,
        feed_kg: feedKg,
        avg_weight_kg: avgWeightKg,
      }])
      if (recErr) throw recErr

      // UPDATE breeding_cycles
      const currentCount = cycle?.current_count ?? cycle?.doc_count ?? 0
      const { error: cycleErr } = await supabase
        .from('breeding_cycles')
        .update({
          current_count: Math.max(0, currentCount - mortality),
          total_mortality: (cycle.total_mortality ?? 0) + mortality,
          total_feed_kg: (parseFloat(cycle.total_feed_kg) || 0) + feedKg,
        })
        .eq('id', cycle.id)
      if (cycleErr) throw cycleErr

      toast.success(`Input hari ke-${recordAge} tersimpan!`)
      queryClient.invalidateQueries({ queryKey: ['active-cycles', tenant.id] })
      queryClient.invalidateQueries({ queryKey: ['all-cycles', tenant.id] })
      queryClient.invalidateQueries({ queryKey: ['daily-records', cycle.id] })

      setForm({ record_date: today, mortality_count: '', feed_kg: '', avg_weight_gram: '', condition: 'normal', notes: '' })
      onClose()
    } catch (err) {
      console.error('InputHarian submit error:', err)
      toast.error('Gagal menyimpan input harian.')
    } finally {
      setLoading(false)
    }
  }

  if (!cycle) return null

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="bg-[#0C1319] border-white/8 rounded-t-[24px] max-h-[94vh] overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/5">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <SheetTitle className="text-white font-display font-black text-base">
                Input Harian — Hari ke-{recordAge}
              </SheetTitle>
              <p className="text-[#4B6478] text-xs mt-0.5">🏠 {farmName} · Siklus #{cycle.cycle_number}</p>
            </div>
            <span style={ageBadgeStyle}>Hari ke-{ageToday}</span>
          </div>
        </SheetHeader>

        <div style={{ padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tanggal */}
          <div>
            <label style={labelStyle}>Tanggal *</label>
            <DatePicker
              value={form.record_date}
              onChange={v => setField('record_date', v)}
              placeholder="Pilih tanggal"
            />
          </div>

          {/* Mortalitas */}
          <FormField
            id="mortality_count" label="Mortalitas (Ekor Mati Hari Ini)"
            type="number" placeholder="0"
            value={form.mortality_count} onChange={v => setField('mortality_count', v)}
          />

          {/* Pakan */}
          <FormField
            id="feed_kg" label="Pakan Habis (kg)"
            type="number" placeholder="350"
            value={form.feed_kg} onChange={v => setField('feed_kg', v)}
          />

          {/* Sample berat */}
          <div>
            <label htmlFor="avg_weight_gram" style={labelStyle}>
              Sample Berat Rata-rata (gram)
              <span style={{ color: '#4B6478', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}> — opsional, 2-3x seminggu</span>
            </label>
            <input
              id="avg_weight_gram" name="avg_weight_gram"
              type="number" placeholder="850"
              value={form.avg_weight_gram}
              onChange={e => setField('avg_weight_gram', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Kondisi ayam */}
          <div>
            <label style={labelStyle}>Kondisi Ayam</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {CONDITION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField('condition', opt.value)}
                  style={{
                    flex: 1, padding: '10px 8px',
                    background: form.condition === opt.value ? `rgba(${opt.value === 'normal' ? '52,211,153' : opt.value === 'waspada' ? '245,158,11' : '248,113,113'},0.12)` : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${form.condition === opt.value ? opt.color : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, color: form.condition === opt.value ? opt.color : '#4B6478',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="input_notes" style={labelStyle}>Catatan Kondisi</label>
            <textarea
              id="input_notes" name="input_notes"
              placeholder="cth. Ayam terlihat kurang nafsu makan di pagi hari..."
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          {/* ── Real-time calculation preview ── */}
          <div style={calcBoxStyle}>
            <p style={calcTitleStyle}>Kalkulasi Real-time</p>
            <div style={calcGridStyle}>
              <CalcItem label="Ekor Hidup Baru" value={(calc.newAlive).toLocaleString('id-ID')} unit="ekor" />
              <CalcItem label="Total Mortalitas" value={(calc.newTotalMort).toLocaleString('id-ID')} unit={`ekor (${calc.mortPct}%)`}
                alert={parseFloat(calc.mortPct) > 5}
              />
              <CalcItem label="Total Pakan" value={calc.newTotalFeed.toFixed(1)} unit="kg" />
              <CalcItem
                label="FCR Estimasi"
                value={calc.fcrEst !== null ? calc.fcrEst.toFixed(2) : '—'}
                unit={calc.fcrEst !== null ? (calc.fcrEst < 1.7 ? '✅ bagus' : '⚠️ tinggi') : 'isi sample berat'}
                alert={calc.fcrEst !== null && calc.fcrEst >= 1.8}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            style={{
              ...submitBtnStyle,
              ...(!canSubmit || loading ? { opacity: 0.4, cursor: 'not-allowed', boxShadow: 'none' } : {}),
            }}
          >
            {loading ? 'Menyimpan...' : `📝 Simpan Input Hari ke-${recordAge}`}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FormField({ id, label, type = 'text', placeholder, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input
        id={id} name={id} type={type}
        placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  )
}

function CalcItem({ label, value, unit, alert }) {
  return (
    <div style={calcItemStyle}>
      <p style={calcItemLabelStyle}>{label}</p>
      <p style={{ ...calcItemValueStyle, color: alert ? '#F87171' : '#F1F5F9' }}>{value}</p>
      <p style={calcItemUnitStyle}>{unit}</p>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ageBadgeStyle = {
  fontSize: 11, fontWeight: 800, color: '#A78BFA',
  background: 'rgba(124,58,237,0.1)',
  border: '1px solid rgba(124,58,237,0.2)',
  padding: '4px 10px', borderRadius: 99, flexShrink: 0,
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

const calcBoxStyle = {
  padding: '16px',
  background: 'rgba(124,58,237,0.05)',
  border: '1px solid rgba(124,58,237,0.15)',
  borderRadius: 14,
}

const calcTitleStyle = {
  fontSize: 10, fontWeight: 900, color: '#7C3AED',
  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
}

const calcGridStyle = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
}

const calcItemStyle = { textAlign: 'left' }
const calcItemLabelStyle = { fontSize: 10, color: '#4B6478', fontWeight: 600, marginBottom: 2 }
const calcItemValueStyle = { fontFamily: 'Sora', fontWeight: 800, fontSize: 16 }
const calcItemUnitStyle = { fontSize: 10, color: '#4B6478', marginTop: 1 }

const submitBtnStyle = {
  width: '100%', padding: '14px',
  background: '#7C3AED', border: 'none', borderRadius: 12,
  color: 'white', fontSize: 15, fontWeight: 800,
  cursor: 'pointer', fontFamily: 'Sora',
  boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
  marginTop: 4,
}
