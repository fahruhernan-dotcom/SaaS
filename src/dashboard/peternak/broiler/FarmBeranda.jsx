import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, ClipboardList, BarChart2,
  Package, AlertTriangle, AlertCircle, Info, Activity,
  PlayCircle, MapPin, Layers, Syringe,
} from 'lucide-react'
import {
  useSingleFarm,
  useFarmActiveCycle,
  useCompletedCycles,
  useVaccinationRecords,
  calcCurrentAge,
} from '@/lib/hooks/usePeternakData'
import { useAuth } from '@/lib/hooks/useAuth'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'

// ─── Constants ────────────────────────────────────────────────────────────────

const PURPLE      = '#7C3AED'
const PURPLE_LIGHT = '#A78BFA'
const TODAY       = new Date().toISOString().split('T')[0]
const TARGET_DAYS = 32

const LIVESTOCK_LABELS = {
  ayam_broiler: '🐔 Ayam Broiler',
  ayam_petelur: '🥚 Ayam Petelur',
  domba: '🐑 Domba',
  kambing: '🐐 Kambing',
  sapi: '🐄 Sapi',
}

const BMODEL_LABELS = {
  mandiri_murni:  'Murni Mandiri',
  mandiri_semi:   'Semi Mandiri',
  mitra_penuh:    'INTI-PLASMA',
  mitra_pakan:    'Kemitraan Pakan',
  mitra_sapronak: 'Kemitraan Sapronak',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTotalMortality(cycle) {
  return cycle?.total_mortality ?? (cycle?.daily_records ?? []).reduce((s, r) => s + (r.mortality_count || 0), 0)
}

function getTotalFeedKg(cycle) {
  return (cycle?.daily_records ?? []).reduce((s, r) => s + (r.feed_kg || 0), 0)
}

function getLatestAvgWeight(cycle) {
  const sorted = [...(cycle?.daily_records ?? [])]
    .filter(r => r.avg_weight_kg)
    .sort((a, b) => new Date(b.record_date) - new Date(a.record_date))
  return sorted[0]?.avg_weight_kg ?? null
}

// Cobb 500 weight targets (gram) by age day
const COBB500_G = {
  1: 42, 3: 68, 5: 105, 7: 160, 10: 275, 14: 480,
  17: 680, 21: 1000, 24: 1280, 28: 1680, 30: 1880, 32: 2060,
}
function getCobb500(ageDays) {
  const keys = Object.keys(COBB500_G).map(Number).sort((a, b) => a - b)
  if (ageDays <= keys[0]) return COBB500_G[keys[0]]
  if (ageDays >= keys[keys.length - 1]) return COBB500_G[keys[keys.length - 1]]
  for (let i = 0; i < keys.length - 1; i++) {
    if (ageDays >= keys[i] && ageDays <= keys[i + 1]) {
      const t = (ageDays - keys[i]) / (keys[i + 1] - keys[i])
      return Math.round(COBB500_G[keys[i]] + t * (COBB500_G[keys[i + 1]] - COBB500_G[keys[i]]))
    }
  }
  return null
}

function getEstimatedFCR(cycle) {
  const feed  = getTotalFeedKg(cycle)
  const alive = (cycle?.doc_count ?? 0) - getTotalMortality(cycle)
  const avgW  = getLatestAvgWeight(cycle)
  if (!feed || !alive || !avgW) return null
  const biomass = alive * avgW
  return biomass > 0 ? feed / biomass : null
}

// IP Score
function getIPScore(cycle) {
  const docCount = cycle?.doc_count ?? 0
  if (!docCount) return null
  const alive = docCount - getTotalMortality(cycle)
  const survivalPct = alive / docCount
  const avgW = getLatestAvgWeight(cycle)
  const age  = calcCurrentAge(cycle.start_date)
  const fcr  = getEstimatedFCR(cycle)
  if (!avgW || !age || !fcr || fcr === 0) return null
  return (survivalPct * avgW * 100) / (age * fcr)
}

// Standard vaccination windows
const VACC_WINDOWS = [
  { name: 'ND + IB',             windowStart: 1,  windowEnd: 4,  diseaseKey: 'Newcastle' },
  { name: 'Gumboro IBD',         windowStart: 7,  windowEnd: 10, diseaseKey: 'Gumboro'   },
  { name: 'ND + IB Booster',     windowStart: 14, windowEnd: 17, diseaseKey: 'Bronchitis' },
  { name: 'Gumboro IBD Booster', windowStart: 18, windowEnd: 22, diseaseKey: 'Bursal'    },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function AlertCard({ type, msg }) {
  const cfg = {
    danger:  { bg: 'bg-red-400/[0.08]',   border: 'border-red-400/25',   text: 'text-red-400',   Icon: AlertCircle },
    warning: { bg: 'bg-amber-400/[0.08]',  border: 'border-amber-400/25', text: 'text-amber-400', Icon: AlertTriangle },
    info:    { bg: 'bg-blue-400/[0.08]',   border: 'border-blue-400/25',  text: 'text-blue-400',  Icon: Info },
  }[type] ?? {}
  const { bg, border, text, Icon } = cfg
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border ${bg} ${border}`}>
      <Icon size={14} className={`${text} flex-shrink-0 mt-0.5`} />
      <span className={`text-xs font-semibold leading-relaxed ${text}`}>{msg}</span>
    </div>
  )
}

function KpiChip({ label, value, good, bad }) {
  const color = good ? 'text-emerald-400' : bad ? 'text-red-400' : 'text-slate-400'
  return (
    <div className="text-center">
      <p className="text-[10px] text-[#4B6478] font-semibold mb-0.5">{label}</p>
      <p className={`font-['Sora'] text-sm font-extrabold ${color}`}>{value}</p>
    </div>
  )
}

// ─── Active Cycle Card ────────────────────────────────────────────────────────

function ActiveCycleSection({ cycle, farmId, navigate, peternakBase, vaccRecords = [], p }) {
  const age      = calcCurrentAge(cycle.start_date)
  const totalMort = getTotalMortality(cycle)
  const alive    = (cycle.doc_count ?? 0) - totalMort
  const mortPct  = cycle.doc_count > 0 ? (totalMort / cycle.doc_count * 100) : 0
  const fcr      = getEstimatedFCR(cycle)
  const ip       = getIPScore(cycle)
  const avgW     = getLatestAvgWeight(cycle)
  const progress = Math.min(100, Math.round((age / TARGET_DAYS) * 100))
  const daysLeft = Math.max(0, TARGET_DAYS - age)
  const hasInputToday = (cycle.daily_records ?? []).some(r => r.record_date === TODAY)

  // Cobb 500 comparison
  const cobbTarget = avgW && age > 7 ? getCobb500(age) : null
  const bbVsCobb   = cobbTarget ? Math.round(avgW * 1000 - cobbTarget) : null

  // Vaccination next due
  const nextVacc = VACC_WINDOWS.find(sched => {
    if (age < sched.windowStart) return true  // upcoming
    const done = vaccRecords.some(r =>
      r.vaccine_name?.toLowerCase().includes(sched.name.split(' ')[0].toLowerCase()) ||
      r.disease_target?.toLowerCase().includes(sched.diseaseKey.toLowerCase())
    )
    return !done && age <= sched.windowEnd + 3
  })
  const vaccDoneCount = VACC_WINDOWS.filter(sched =>
    vaccRecords.some(r =>
      r.vaccine_name?.toLowerCase().includes(sched.name.split(' ')[0].toLowerCase()) ||
      r.disease_target?.toLowerCase().includes(sched.diseaseKey.toLowerCase())
    )
  ).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0C1319] border border-white/[0.07] rounded-[20px] p-4"
    >
      {/* Header row */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">🔄</span>
          <span className="font-['Sora'] font-extrabold text-[15px] text-slate-100">
            Siklus #{cycle.cycle_number}
          </span>
        </div>
        <span className="text-[11px] font-extrabold text-[#A78BFA] bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] px-2.5 py-1 rounded-full">
          Hari ke-{age}
        </span>
      </div>

      {/* Input status */}
      <div className="flex justify-between items-center mb-2.5">
        <p className="text-[11px] text-[#4B6478]">
          {cycle.chicken_type ?? 'Ayam'} · {(cycle.doc_count ?? 0).toLocaleString('id-ID')} DOC
        </p>
        {hasInputToday
          ? <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">Sudah input ✓</span>
          : <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">Belum input hari ini</span>
        }
      </div>

      {/* Progress bar */}
      <div className="mt-1 mb-3">
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] text-[#4B6478] font-semibold">Estimasi Panen</span>
          <span className="text-[10px] text-[#4B6478] font-semibold">
            {progress >= 100 ? 'Siap panen! 🎉' : `${progress}% — ${daysLeft} hari lagi`}
          </span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: progress >= 100 ? '#34D399' : 'linear-gradient(90deg, #7C3AED 0%, #10B981 100%)',
            }}
          />
        </div>
      </div>

      {/* KPI row */}
      <div className="flex justify-around mt-2 pt-3 border-t border-white/[0.05]">
        <KpiChip label="FCR Est."   value={fcr !== null ? fcr.toFixed(2) : '—'}   good={fcr !== null && fcr < 1.7}  bad={fcr !== null && fcr >= 1.85} />
        <KpiChip label="Mortalitas" value={`${mortPct.toFixed(1)}%`}               good={mortPct < 3}                 bad={mortPct > 5} />
        <KpiChip label="IP Score"   value={ip !== null ? Math.round(ip) : '—'}     good={ip !== null && ip >= 350}    bad={ip !== null && ip < 300} />
        <KpiChip label="Hidup"      value={`${alive.toLocaleString('id-ID')}`} />
      </div>

      {/* BB vs Cobb 500 + Vaccination status row */}
      {(cobbTarget || vaccDoneCount > 0 || nextVacc) && (
        <div className="flex gap-2 mt-2.5 flex-wrap">
          {cobbTarget && bbVsCobb !== null && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              bbVsCobb >= 0
                ? 'text-emerald-400 bg-emerald-400/[0.08] border-emerald-400/20'
                : bbVsCobb >= -50
                  ? 'text-amber-400 bg-amber-400/[0.08] border-amber-400/20'
                  : 'text-red-400 bg-red-400/[0.08] border-red-400/20'
            }`}>
              BB {bbVsCobb >= 0 ? `+${bbVsCobb}g` : `${bbVsCobb}g`} vs Cobb 500
            </span>
          )}
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer"
            style={{
              color: vaccDoneCount >= 4 ? '#34D399' : nextVacc && age > (nextVacc.windowEnd ?? 0) ? '#F87171' : '#F59E0B',
              background: vaccDoneCount >= 4 ? 'rgba(52,211,153,0.08)' : 'rgba(245,158,11,0.08)',
              borderColor: vaccDoneCount >= 4 ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.2)',
            }}
            onClick={() => navigate(`${peternakBase}/vaksinasi?cycle=${cycle.id}`)}
          >
            💉 {vaccDoneCount}/{VACC_WINDOWS.length} vaksin
            {nextVacc && vaccDoneCount < VACC_WINDOWS.length ? ` · berikutnya: ${nextVacc.name}` : vaccDoneCount >= 4 ? ' ✓ lengkap' : ''}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-3.5">
        {p?.canInputHarian && (
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#7C3AED] border-none rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-[0_3px_10px_rgba(124,58,237,0.3)] cursor-pointer"
            onClick={() => navigate(`${peternakBase}/kandang/${farmId}/input?cycle=${cycle.id}`)}
          >
            <ClipboardList size={13} />
            Input Harian
          </button>
        )}
        {p?.canViewLaporan && (
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] rounded-xl text-[#A78BFA] text-xs font-bold cursor-pointer"
            onClick={() => navigate(`${peternakBase}/kandang/${farmId}/siklus`)}
          >
            <BarChart2 size={13} />
            Laporan
          </button>
        )}
        {p?.canViewVaksinasi && (
          <button
            className="flex items-center justify-center px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-400 cursor-pointer"
            onClick={() => navigate(`${peternakBase}/vaksinasi?cycle=${cycle.id}`)}
            title="Program Vaksinasi"
          >
            <Syringe size={13} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FarmBeranda() {
  const { farmId } = useParams()
  const navigate   = useNavigate()
  const { profile } = useAuth()
  const p          = usePeternakPermissions()
  const peternakBase = `/peternak/${profile?.sub_type || 'peternak_broiler'}`

  const { data: farm,  isLoading: farmLoading  } = useSingleFarm(farmId)
  const { data: cycle, isLoading: cycleLoading } = useFarmActiveCycle(farmId)
  const { data: completedCycles = [] }           = useCompletedCycles()
  const { data: vaccRecords = [] }               = useVaccinationRecords(cycle?.id)

  const farmCycles = useMemo(
    () => completedCycles.filter(c => c.peternak_farm_id === farmId),
    [completedCycles, farmId]
  )

  const alerts = useMemo(() => {
    if (!cycle) return []
    const list = []
    const age       = calcCurrentAge(cycle.start_date)
    const totalMort = getTotalMortality(cycle)
    const mortPct   = cycle.doc_count > 0 ? (totalMort / cycle.doc_count * 100) : 0
    const fcr       = getEstimatedFCR(cycle)
    const avgW      = getLatestAvgWeight(cycle)

    // Panen overdue
    if (age > 35) list.push({ type: 'danger', msg: `Hari ke-${age} — melewati target panen 32 hari` })

    // Mortalitas harian
    const todayRec = (cycle.daily_records ?? []).find(r => r.record_date === TODAY)
    if (todayRec && cycle.doc_count) {
      const dailyPct = (todayRec.mortality_count / cycle.doc_count) * 100
      if (dailyPct > 0.5) list.push({ type: 'danger',  msg: `Mortalitas hari ini ${dailyPct.toFixed(2)}% — KRITIS (>0.5%/hari)` })
      else if (dailyPct > 0.3) list.push({ type: 'warning', msg: `Mortalitas hari ini ${dailyPct.toFixed(2)}% — waspada (>0.3%)` })
    }

    // Mortalitas kumulatif
    if (mortPct > 5)      list.push({ type: 'danger',  msg: `Mortalitas kumulatif ${mortPct.toFixed(1)}% — sangat tinggi` })
    else if (mortPct > 3) list.push({ type: 'warning', msg: `Mortalitas kumulatif ${mortPct.toFixed(1)}% — perlu perhatian` })

    // FCR tinggi
    if (fcr !== null && fcr >= 1.85) list.push({ type: 'warning', msg: `FCR ${fcr.toFixed(2)} — efisiensi pakan rendah` })

    // BB vs Cobb 500
    if (avgW && age > 7) {
      const cobbTarget = getCobb500(age)
      if (cobbTarget && (avgW * 1000) < cobbTarget - 100) {
        list.push({ type: 'warning', msg: `BB ${(avgW * 1000).toFixed(0)}g di bawah Cobb 500 (target ${cobbTarget}g hari ke-${age})` })
      }
    }

    // Vaksinasi overdue / due now
    VACC_WINDOWS.forEach(sched => {
      if (age < sched.windowStart) return
      const done = vaccRecords.some(r =>
        r.vaccine_name?.toLowerCase().includes(sched.name.split(' ')[0].toLowerCase()) ||
        r.disease_target?.toLowerCase().includes(sched.diseaseKey.toLowerCase())
      )
      if (done) return
      if (age > sched.windowEnd) {
        list.push({ type: 'danger',  msg: `Vaksin ${sched.name} TERLAMBAT (seharusnya hari ke-${sched.windowStart}–${sched.windowEnd})` })
      } else {
        list.push({ type: 'warning', msg: `Saatnya vaksin ${sched.name} (hari ke-${sched.windowStart}–${sched.windowEnd})` })
      }
    })

    // Belum input hari ini
    const hasInputToday = (cycle.daily_records ?? []).some(r => r.record_date === TODAY)
    if (!hasInputToday && age > 0) list.push({ type: 'info', msg: 'Belum ada input harian untuk hari ini' })

    return list
  }, [cycle, vaccRecords])

  if (farmLoading || cycleLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-14 bg-white/[0.04] rounded-2xl animate-pulse" />
        <div className="h-48 bg-[#0C1319] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-[#111C24] rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!farm) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <p className="text-slate-400 text-sm">Kandang tidak ditemukan.</p>
      <button
        onClick={() => navigate(`${peternakBase}/beranda`)}
        className="mt-4 px-5 py-2.5 bg-[#7C3AED] text-white text-sm font-bold rounded-xl border-none cursor-pointer"
      >
        Kembali ke Overview
      </button>
    </div>
  )

  const livestockLabel = LIVESTOCK_LABELS[farm.livestock_type] ?? farm.livestock_type ?? '—'
  const modelLabel     = BMODEL_LABELS[farm.business_model] ?? farm.business_model ?? '—'
  const isMandiri      = farm.business_model === 'mandiri_murni' || farm.business_model === 'mandiri_semi'

  return (
    <div className="text-slate-100 pb-10">

      {/* ── Back bar ── */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(`${peternakBase}/beranda`)}
          className="flex items-center gap-1.5 text-[#4B6478] text-xs font-semibold bg-transparent border-none cursor-pointer p-0"
        >
          <ChevronLeft size={14} />
          Semua Kandang
        </button>
      </div>

      {/* ── Farm header ── */}
      <header className="px-4 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h1 className="font-['Sora'] text-xl font-extrabold text-slate-100 truncate">{farm.farm_name}</h1>
            {farm.location && (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={11} className="text-[#4B6478]" />
                <span className="text-[11px] text-[#4B6478]">{farm.location}</span>
              </div>
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-300 bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
            {livestockLabel}
          </span>
        </div>

        {/* Model + stats row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${
              isMandiri
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}
          >
            {modelLabel}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-[#4B6478]">
            <Layers size={11} />
            {farm.kandang_count || 1} kandang
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#4B6478]">
            <Activity size={11} />
            Kapasitas {(farm.capacity || 0).toLocaleString('id-ID')} ekor
          </div>
        </div>

        {farm.mitra_company && (
          <p className="text-[11px] text-[#4B6478] mt-2">Mitra: {farm.mitra_company}</p>
        )}
      </header>

      <div className="px-4 mt-4 flex flex-col gap-4">

        {/* ── Alerts ── */}
        {alerts.length > 0 && (
          <section className="flex flex-col gap-2">
            {alerts.map((a, i) => <AlertCard key={i} type={a.type} msg={a.msg} />)}
          </section>
        )}

        {/* ── Active cycle or empty state ── */}
        {cycle ? (
          <ActiveCycleSection cycle={cycle} farmId={farmId} navigate={navigate} peternakBase={peternakBase} vaccRecords={vaccRecords} p={p} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-10 px-5 text-center bg-[#0C1319] rounded-2xl border border-dashed border-white/[0.07]"
          >
            <span className="text-4xl">🏚️</span>
            <p className="text-[#4B6478] text-sm mt-3 mb-4">Belum ada siklus aktif di kandang ini</p>
            {p.canBuatSiklus && (
              <button
                className="px-5 py-2.5 bg-[#7C3AED] text-white text-sm font-bold font-['Sora'] rounded-xl border-none cursor-pointer shadow-[0_4px_14px_rgba(124,58,237,0.3)]"
                onClick={() => navigate(`${peternakBase}/siklus?action=new&farm=${farmId}`)}
              >
                <PlayCircle size={14} className="inline mr-1.5" />
                Mulai Siklus Baru
              </button>
            )}
          </motion.div>
        )}

        {/* ── Quick nav tiles ── */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">Menu Kandang Ini</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: BarChart2,     label: 'Laporan', path: `${peternakBase}/kandang/${farmId}/siklus`,         color: PURPLE_LIGHT, show: p?.canViewLaporan   ?? true },
              { icon: ClipboardList, label: 'Input',   path: `${peternakBase}/kandang/${farmId}/input`,          color: '#34D399',    show: p?.canInputHarian   ?? true },
              { icon: Package,       label: 'Pakan',   path: `${peternakBase}/kandang/${farmId}/pakan`,          color: '#60A5FA',    show: p?.canViewPakan     ?? true },
              { icon: Syringe,       label: 'Vaksin',  path: `${peternakBase}/vaksinasi?cycle=${cycle?.id ?? ''}`, color: '#F59E0B', show: p?.canViewVaksinasi ?? true },
            ].filter(item => item.show !== false).map(({ icon: Icon, label, path, color }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="flex flex-col items-center justify-center gap-2 py-4 bg-[#111C24] border border-white/[0.06] rounded-2xl cursor-pointer hover:border-white/10 transition-all"
              >
                <Icon size={18} style={{ color }} />
                <span className="text-[11px] font-bold text-slate-300 font-['DM_Sans']">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Riwayat siklus kandang ini ── */}
        {farmCycles.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B6478]">Riwayat Siklus</p>
              <button
                className="text-xs text-[#7C3AED] font-semibold bg-transparent border-none cursor-pointer flex items-center gap-0.5"
                onClick={() => navigate(`${peternakBase}/kandang/${farmId}/siklus`)}
              >
                Lihat semua <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {farmCycles.slice(0, 3).map(c => {
                const harvest    = c.harvest_records?.[0]
                const netRevenue = harvest?.net_revenue ?? null
                return (
                  <div key={c.id} className="flex items-center gap-3 px-3.5 py-3 bg-[#111C24] border border-white/[0.06] rounded-[14px]">
                    <div className="flex-1 min-w-0">
                      <p className="font-['Sora'] font-bold text-[13px] text-slate-100 mb-0.5">
                        Siklus #{c.cycle_number}
                      </p>
                      <p className="text-[11px] text-[#4B6478]">
                        {harvest?.harvest_date ?? 'Tidak dipanen'}
                        {c.final_fcr ? ` · FCR ${Number(c.final_fcr).toFixed(2)}` : ''}
                      </p>
                    </div>
                    {netRevenue !== null && (
                      <span className={`text-[13px] font-bold flex-shrink-0 ${netRevenue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {netRevenue >= 0 ? '+' : ''}{(netRevenue / 1_000_000).toFixed(1)}jt
                      </span>
                    )}
                    <ChevronRight size={14} className="text-[#4B6478] flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
