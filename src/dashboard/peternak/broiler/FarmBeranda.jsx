import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, ClipboardList, BarChart2,
  Package, AlertTriangle, AlertCircle, Info, Activity,
  PlayCircle, MapPin, Layers,
} from 'lucide-react'
import {
  useSingleFarm,
  useFarmActiveCycle,
  useCompletedCycles,
  calcCurrentAge,
} from '@/lib/hooks/usePeternakData'
import { useAuth } from '@/lib/hooks/useAuth'

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

function getEstimatedFCR(cycle) {
  const feed  = getTotalFeedKg(cycle)
  const alive = (cycle?.doc_count ?? 0) - getTotalMortality(cycle)
  const avgW  = getLatestAvgWeight(cycle)
  if (!feed || !alive || !avgW) return null
  const biomass = alive * avgW
  return biomass > 0 ? feed / biomass : null
}

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

function ActiveCycleSection({ cycle, farmId, navigate, peternakBase }) {
  const age      = calcCurrentAge(cycle.start_date)
  const totalMort = getTotalMortality(cycle)
  const alive    = (cycle.doc_count ?? 0) - totalMort
  const mortPct  = cycle.doc_count > 0 ? (totalMort / cycle.doc_count * 100) : 0
  const fcr      = getEstimatedFCR(cycle)
  const progress = Math.min(100, Math.round((age / TARGET_DAYS) * 100))
  const daysLeft = Math.max(0, TARGET_DAYS - age)
  const hasInputToday = (cycle.daily_records ?? []).some(r => r.record_date === TODAY)
  const feedKg   = getTotalFeedKg(cycle)

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
        <KpiChip label="FCR Est." value={fcr !== null ? fcr.toFixed(2) : '—'} good={fcr !== null && fcr < 1.7} bad={fcr !== null && fcr >= 1.8} />
        <KpiChip label="Mortalitas" value={`${mortPct.toFixed(1)}%`} good={mortPct < 3} bad={mortPct > 5} />
        <KpiChip label="Hidup" value={`${alive.toLocaleString('id-ID')} ekor`} />
        <KpiChip label="Pakan" value={`${(feedKg / 1000).toFixed(1)} ton`} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3.5">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#7C3AED] border-none rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-[0_3px_10px_rgba(124,58,237,0.3)] cursor-pointer"
          onClick={() => navigate(`${peternakBase}/kandang/${farmId}/input?cycle=${cycle.id}`)}
        >
          <ClipboardList size={13} />
          Input Harian
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] rounded-xl text-[#A78BFA] text-xs font-bold cursor-pointer"
          onClick={() => navigate(`${peternakBase}/kandang/${farmId}/siklus`)}
        >
          <BarChart2 size={13} />
          Detail Siklus
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FarmBeranda() {
  const { farmId } = useParams()
  const navigate   = useNavigate()
  const { profile } = useAuth()
  const peternakBase = `/peternak/${profile?.sub_type || 'peternak_broiler'}`

  const { data: farm,  isLoading: farmLoading  } = useSingleFarm(farmId)
  const { data: cycle, isLoading: cycleLoading } = useFarmActiveCycle(farmId)
  const { data: completedCycles = [] }           = useCompletedCycles()

  const farmCycles = useMemo(
    () => completedCycles.filter(c => c.peternak_farm_id === farmId),
    [completedCycles, farmId]
  )

  const alerts = useMemo(() => {
    if (!cycle) return []
    const list = []
    const age  = calcCurrentAge(cycle.start_date)
    const totalMort = getTotalMortality(cycle)
    const mortPct   = cycle.doc_count > 0 ? (totalMort / cycle.doc_count * 100) : 0
    if (age > 35) list.push({ type: 'danger',  msg: `Hari ke-${age} — sudah melewati target panen 32 hari` })
    if (mortPct > 5) list.push({ type: 'warning', msg: `Mortalitas ${mortPct.toFixed(1)}% — di atas batas normal 5%` })
    const hasInputToday = (cycle.daily_records ?? []).some(r => r.record_date === TODAY)
    if (!hasInputToday && age > 0) list.push({ type: 'info', msg: 'Belum ada input harian untuk hari ini' })
    return list
  }, [cycle])

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
          <ActiveCycleSection cycle={cycle} farmId={farmId} navigate={navigate} peternakBase={peternakBase} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-10 px-5 text-center bg-[#0C1319] rounded-2xl border border-dashed border-white/[0.07]"
          >
            <span className="text-4xl">🏚️</span>
            <p className="text-[#4B6478] text-sm mt-3 mb-4">Belum ada siklus aktif di kandang ini</p>
            <button
              className="px-5 py-2.5 bg-[#7C3AED] text-white text-sm font-bold font-['Sora'] rounded-xl border-none cursor-pointer shadow-[0_4px_14px_rgba(124,58,237,0.3)]"
              onClick={() => navigate(`${peternakBase}/siklus?action=new&farm=${farmId}`)}
            >
              <PlayCircle size={14} className="inline mr-1.5" />
              Mulai Siklus Baru
            </button>
          </motion.div>
        )}

        {/* ── Quick nav tiles ── */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">Menu Kandang Ini</p>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: BarChart2,    label: 'Siklus',    path: `${peternakBase}/kandang/${farmId}/siklus`,  color: PURPLE_LIGHT },
              { icon: ClipboardList,label: 'Input',     path: `${peternakBase}/kandang/${farmId}/input`,   color: '#34D399' },
              { icon: Package,      label: 'Pakan',     path: `${peternakBase}/kandang/${farmId}/pakan`,   color: '#60A5FA' },
            ].map(({ icon: Icon, label, path, color }) => (
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
