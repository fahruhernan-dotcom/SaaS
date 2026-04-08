import React, { useState, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITION_OPTIONS = [
  { value: 'normal',   label: '✅ Normal',  color: '#34D399' },
  { value: 'waspada',  label: '⚠️ Waspada', color: '#F59E0B' },
  { value: 'kritis',   label: '🔴 Kritis',  color: '#F87171' },
]

const FEED_TYPE_OPTIONS = [
  { value: 'BR-1', label: 'Starter BR-1 (0–10 hari)' },
  { value: 'BR-2', label: 'Grower BR-2 (11–20 hari)' },
  { value: 'BR-3', label: 'Finisher BR-3 (21–30 hari)' },
  { value: 'BR-4', label: 'Finisher BR-4 (>30 hari)' },
]

const LITTER_OPTIONS = [
  { value: 'kering', label: '✅ Kering',  color: '#34D399' },
  { value: 'lembab', label: '⚠️ Lembab', color: '#F59E0B' },
  { value: 'basah',  label: '🔴 Basah',   color: '#F87171' },
]

const AMMONIA_OPTIONS = [
  { value: 'tidak_ada', label: '✅ Tidak Ada', color: '#34D399' },
  { value: 'ringan',    label: '🟡 Ringan',    color: '#A3E635' },
  { value: 'sedang',    label: '⚠️ Sedang',   color: '#F59E0B' },
  { value: 'kuat',      label: '🔴 Kuat',      color: '#F87171' },
]

// Cobb 500 standard bodyweight (gram) by age day — broiler benchmark
const COBB500_WEIGHT_G = {
  1: 42, 3: 68, 5: 105, 7: 160, 10: 275, 12: 370, 14: 480,
  17: 680, 19: 830, 21: 1000, 24: 1280, 26: 1480, 28: 1680,
  30: 1880, 32: 2060, 35: 2360, 38: 2620, 40: 2810, 42: 2990,
}

// Standard feed intake per bird per day (gram) by age day
const STD_FEED_PER_BIRD_G = {
  1: 13, 3: 18, 5: 25, 7: 36, 10: 56, 12: 70, 14: 85,
  17: 110, 19: 125, 21: 140, 24: 165, 26: 180, 28: 195,
  30: 210, 32: 220, 35: 235, 38: 248, 40: 255, 42: 262,
}

function getCobb500Target(ageDays) {
  const keys = Object.keys(COBB500_WEIGHT_G).map(Number).sort((a, b) => a - b)
  if (ageDays <= keys[0]) return COBB500_WEIGHT_G[keys[0]]
  if (ageDays >= keys[keys.length - 1]) return COBB500_WEIGHT_G[keys[keys.length - 1]]
  for (let i = 0; i < keys.length - 1; i++) {
    if (ageDays >= keys[i] && ageDays <= keys[i + 1]) {
      const t = (ageDays - keys[i]) / (keys[i + 1] - keys[i])
      return Math.round(COBB500_WEIGHT_G[keys[i]] + t * (COBB500_WEIGHT_G[keys[i + 1]] - COBB500_WEIGHT_G[keys[i]]))
    }
  }
  return null
}

function getStdFeedPerBird(ageDays) {
  const keys = Object.keys(STD_FEED_PER_BIRD_G).map(Number).sort((a, b) => a - b)
  if (ageDays <= keys[0]) return STD_FEED_PER_BIRD_G[keys[0]]
  if (ageDays >= keys[keys.length - 1]) return STD_FEED_PER_BIRD_G[keys[keys.length - 1]]
  for (let i = 0; i < keys.length - 1; i++) {
    if (ageDays >= keys[i] && ageDays <= keys[i + 1]) {
      const t = (ageDays - keys[i]) / (keys[i + 1] - keys[i])
      return Math.round(STD_FEED_PER_BIRD_G[keys[i]] + t * (STD_FEED_PER_BIRD_G[keys[i + 1]] - STD_FEED_PER_BIRD_G[keys[i]]))
    }
  }
  return null
}

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000))
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InputHarianSheet({ open, onClose, cycle }) {
  const { tenant } = useAuth()
  const p = usePeternakPermissions()
  const queryClient = useQueryClient()

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    record_date: today,
    mortality_count: '',
    feed_kg: '',
    avg_weight_gram: '',
    condition: 'normal',
    notes: '',
    // Environmental + management fields
    temperature_morning: '',
    temperature_evening: '',
    cull_count: '',
    feed_type: '',
    water_liter: '',
    litter_condition: '',
    ammonia_level: '',
  })
  const [loading, setLoading] = useState(false)

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Derived age of record ──
  const startDate = cycle?.start_date ?? cycle?.created_at
  const ageToday = daysSince(startDate)

  const recordAge = useMemo(() => {
    if (!startDate || !form.record_date) return ageToday
    const start = new Date(startDate)
    const rec = new Date(form.record_date)
    return Math.max(0, Math.floor((rec - start) / 86400000))
  }, [startDate, form.record_date, ageToday])

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
    const todayMortPct = docCount > 0 ? ((mortality / docCount) * 100).toFixed(2) : '0.00'

    const newTotalFeed = totalFeedSoFar + feedKg

    // FCR kumulatif
    let fcrEst = null
    if (sampleGram && newAlive > 0 && newTotalFeed > 0) {
      const avgWeightKg = sampleGram / 1000
      const estimatedBiomass = avgWeightKg * newAlive
      if (estimatedBiomass > 0) fcrEst = newTotalFeed / estimatedBiomass
    }

    // Konsumsi pakan/ekor vs standar
    let feedPerBirdGram = null
    let stdFeedGram = null
    let feedVsStd = null
    if (feedKg > 0 && newAlive > 0) {
      feedPerBirdGram = (feedKg * 1000) / newAlive
      stdFeedGram = getStdFeedPerBird(recordAge)
      if (stdFeedGram) feedVsStd = feedPerBirdGram - stdFeedGram
    }

    // BB aktual vs Cobb 500
    let weightVsCobb = null
    let cobbTarget = null
    if (sampleGram && recordAge > 0) {
      cobbTarget = getCobb500Target(recordAge)
      if (cobbTarget) weightVsCobb = sampleGram - cobbTarget
    }

    return {
      newAlive, newTotalMort, mortPct, todayMortPct,
      newTotalFeed, fcrEst,
      feedPerBirdGram, stdFeedGram, feedVsStd,
      weightVsCobb, cobbTarget,
    }
  }, [form, cycle, recordAge])

  const farmName = cycle?.peternak_farms?.farm_name ?? 'Kandang'

  // Role guard: pekerja (staff) can only input/edit today's record
  const isOldRecord = form.record_date && form.record_date !== today
  const dateIsLocked = isOldRecord && !p.canEditHarianOld

  const canSubmit = form.record_date && (form.mortality_count !== '' || form.feed_kg !== '') && !dateIsLocked

  const handleSubmit = async () => {
    if (!canSubmit || loading || !cycle) return
    setLoading(true)
    try {
      const mortality = parseInt(form.mortality_count) || 0
      const feedKg = parseFloat(form.feed_kg) || 0
      const avgWeightKg = form.avg_weight_gram ? parseFloat(form.avg_weight_gram) / 1000 : null

      const { error: recErr } = await supabase.from('daily_records').insert([{
        tenant_id: tenant.id,
        cycle_id: cycle.id,
        record_date: form.record_date,
        age_days: recordAge,
        mortality_count: mortality,
        feed_kg: feedKg,
        avg_weight_kg: avgWeightKg,
        // Existing DB fields
        temperature_morning: form.temperature_morning ? parseFloat(form.temperature_morning) : null,
        temperature_evening: form.temperature_evening ? parseFloat(form.temperature_evening) : null,
        cull_count: form.cull_count ? parseInt(form.cull_count) : null,
        feed_type: form.feed_type || null,
        // New fields (from migration)
        water_liter: form.water_liter ? parseFloat(form.water_liter) : null,
        litter_condition: form.litter_condition || null,
        ammonia_level: form.ammonia_level || null,
        condition: form.condition,
        notes: form.notes || null,
      }])
      if (recErr) throw recErr

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

      setForm({
        record_date: today, mortality_count: '', feed_kg: '', avg_weight_gram: '',
        condition: 'normal', notes: '',
        temperature_morning: '', temperature_evening: '',
        cull_count: '', feed_type: '', water_liter: '',
        litter_condition: '', ammonia_level: '',
      })
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
              <SheetDescription className="sr-only">Formulir untuk memasukkan data mortalitas, pakan, dan bobot harian ternak.</SheetDescription>
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
              onChange={v => {
                // Pekerja (staff) cannot pick past dates
                if (v !== today && !p.canEditHarianOld) {
                  return
                }
                setField('record_date', v)
              }}
              placeholder="Pilih tanggal"
              disabled={!p.canEditHarianOld && isOldRecord}
            />
            {dateIsLocked && (
              <p style={{ fontSize: 11, color: '#F87171', marginTop: 6 }}>
                Pekerja hanya bisa input data hari ini. Hubungi manajer untuk edit data lama.
              </p>
            )}
          </div>

          {/* ── SECTION: Data Utama ── */}
          <SectionDivider label="Data Utama" />

          <FormField
            id="mortality_count" label="Mortalitas (Ekor Mati Hari Ini)"
            type="number" placeholder="0"
            value={form.mortality_count} onChange={v => setField('mortality_count', v)}
          />

          <FormField
            id="cull_count" label="Culling (Ekor Afkir)"
            type="number" placeholder="0"
            hint="Ayam sakit/cacat yang disingkirkan"
            value={form.cull_count} onChange={v => setField('cull_count', v)}
          />

          <FormField
            id="feed_kg" label="Pakan Habis (kg)"
            type="number" placeholder="350"
            value={form.feed_kg} onChange={v => setField('feed_kg', v)}
          />

          {/* Feed type selector */}
          <div>
            <label style={labelStyle}>Jenis Pakan</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {FEED_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField('feed_type', form.feed_type === opt.value ? '' : opt.value)}
                  style={{
                    padding: '8px 10px', textAlign: 'left',
                    background: form.feed_type === opt.value ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${form.feed_type === opt.value ? '#7C3AED' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, color: form.feed_type === opt.value ? '#A78BFA' : '#4B6478',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <FormField
            id="water_liter" label="Konsumsi Air (liter)"
            type="number" placeholder="cth. 450"
            hint="Total konsumsi air minum hari ini"
            value={form.water_liter} onChange={v => setField('water_liter', v)}
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

          {/* ── SECTION: Suhu & Lingkungan ── */}
          <SectionDivider label="Suhu & Lingkungan" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField
              id="temperature_morning" label="Suhu Pagi (°C)"
              type="number" placeholder="28"
              value={form.temperature_morning} onChange={v => setField('temperature_morning', v)}
            />
            <FormField
              id="temperature_evening" label="Suhu Sore (°C)"
              type="number" placeholder="32"
              value={form.temperature_evening} onChange={v => setField('temperature_evening', v)}
            />
          </div>

          {/* Litter condition */}
          <div>
            <label style={labelStyle}>Kondisi Litter</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {LITTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField('litter_condition', form.litter_condition === opt.value ? '' : opt.value)}
                  style={{
                    flex: 1, padding: '9px 8px',
                    background: form.litter_condition === opt.value
                      ? `rgba(${opt.value === 'kering' ? '52,211,153' : opt.value === 'lembab' ? '245,158,11' : '248,113,113'},0.12)`
                      : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${form.litter_condition === opt.value ? opt.color : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, color: form.litter_condition === opt.value ? opt.color : '#4B6478',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ammonia level */}
          <div>
            <label style={labelStyle}>Kadar Amonia</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {AMMONIA_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField('ammonia_level', form.ammonia_level === opt.value ? '' : opt.value)}
                  style={{
                    padding: '9px 8px',
                    background: form.ammonia_level === opt.value ? `rgba(124,58,237,0.12)` : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${form.ammonia_level === opt.value ? opt.color : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, color: form.ammonia_level === opt.value ? opt.color : '#4B6478',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── SECTION: Kondisi & Catatan ── */}
          <SectionDivider label="Kondisi & Catatan" />

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
                    background: form.condition === opt.value
                      ? `rgba(${opt.value === 'normal' ? '52,211,153' : opt.value === 'waspada' ? '245,158,11' : '248,113,113'},0.12)`
                      : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${form.condition === opt.value ? opt.color : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, color: form.condition === opt.value ? opt.color : '#4B6478',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <CalcItem
                label="Ekor Hidup Baru"
                value={calc.newAlive.toLocaleString('id-ID')}
                unit="ekor"
              />
              <CalcItem
                label="Mortalitas Hari Ini"
                value={`${calc.todayMortPct}%`}
                unit={`kumulatif ${calc.mortPct}%`}
                alert={parseFloat(calc.todayMortPct) > 0.5}
                warn={parseFloat(calc.todayMortPct) > 0.3 && parseFloat(calc.todayMortPct) <= 0.5}
              />
              <CalcItem
                label="FCR Kumulatif"
                value={calc.fcrEst !== null ? calc.fcrEst.toFixed(2) : '—'}
                unit={calc.fcrEst !== null ? (calc.fcrEst < 1.7 ? '✅ bagus' : calc.fcrEst < 1.85 ? '⚠️ perhatikan' : '🔴 tinggi') : 'isi sample berat'}
                alert={calc.fcrEst !== null && calc.fcrEst >= 1.85}
                warn={calc.fcrEst !== null && calc.fcrEst >= 1.7 && calc.fcrEst < 1.85}
              />
              <CalcItem
                label="Pakan/Ekor"
                value={calc.feedPerBirdGram !== null ? `${Math.round(calc.feedPerBirdGram)}g` : '—'}
                unit={calc.stdFeedGram
                  ? (calc.feedVsStd > 0
                    ? `+${Math.round(calc.feedVsStd)}g vs std ${calc.stdFeedGram}g`
                    : `${Math.round(calc.feedVsStd)}g vs std ${calc.stdFeedGram}g`)
                  : 'isi pakan'
                }
                alert={calc.feedVsStd !== null && calc.feedVsStd > 15}
              />
              {calc.cobbTarget !== null && (
                <CalcItem
                  label={`BB vs Cobb 500`}
                  value={`${parseFloat(form.avg_weight_gram).toFixed(0)}g`}
                  unit={calc.weightVsCobb >= 0
                    ? `+${Math.round(calc.weightVsCobb)}g ✅ di atas target`
                    : `${Math.round(calc.weightVsCobb)}g ⚠️ target ${calc.cobbTarget}g`
                  }
                  alert={calc.weightVsCobb < -50}
                  warn={calc.weightVsCobb < 0 && calc.weightVsCobb >= -50}
                />
              )}
              <CalcItem
                label="Total Pakan"
                value={calc.newTotalFeed.toFixed(1)}
                unit="kg kumulatif"
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

function SectionDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
      <span style={{ fontSize: 10, fontWeight: 900, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

function FormField({ id, label, type = 'text', placeholder, value, onChange, hint }) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
        {hint && <span style={{ color: '#4B6478', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}> — {hint}</span>}
      </label>
      <input
        id={id} name={id} type={type}
        placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  )
}

function CalcItem({ label, value, unit, alert, warn }) {
  const valueColor = alert ? '#F87171' : warn ? '#F59E0B' : '#F1F5F9'
  return (
    <div style={calcItemStyle}>
      <p style={calcItemLabelStyle}>{label}</p>
      <p style={{ ...calcItemValueStyle, color: valueColor }}>{value}</p>
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
