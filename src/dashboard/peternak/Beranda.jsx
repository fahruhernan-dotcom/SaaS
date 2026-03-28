import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, AlertTriangle, Info, AlertCircle,
  ClipboardList, BarChart2, ChevronRight, Lock,
  Activity, Bird, Clock,
} from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import { useAuth } from '../../lib/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { formatIDRShort } from '../../lib/format'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import SetupFarm from './SetupFarm'
import FarmCard from './components/FarmCard'
import {
  usePeternakFarms, useActiveCycles, useCompletedCycles,
  calcCurrentAge,
} from '../../lib/hooks/usePeternakData'

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]
const HARVEST_TARGET_DAYS = 32

const BUSINESS_MODEL_LABELS = {
  mandiri_murni:  'Murni Mandiri',
  mandiri_semi:   'Semi Mandiri',
  mitra_penuh:    'INTI-PLASMA',
  mitra_pakan:    'Kemitraan Pakan',
  mitra_sapronak: 'Kemitraan Sapronak',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayRecords(cycle) {
  return (cycle.daily_records ?? []).filter(r => r.record_date === TODAY)
}

function getTotalMortality(cycle) {
  return cycle.total_mortality ?? (cycle.daily_records ?? []).reduce((s, r) => s + (r.mortality_count || 0), 0)
}

function getTotalFeedKg(cycle) {
  return (cycle.daily_records ?? []).reduce((s, r) => s + (r.feed_kg || 0), 0)
}

function getLatestAvgWeight(cycle) {
  const sorted = [...(cycle.daily_records ?? [])]
    .filter(r => r.avg_weight_kg)
    .sort((a, b) => new Date(b.record_date) - new Date(a.record_date))
  return sorted[0]?.avg_weight_kg ?? null
}

function getEstimatedFCR(cycle) {
  const feed = getTotalFeedKg(cycle)
  const alive = (cycle.doc_count ?? 0) - getTotalMortality(cycle)
  const avgW = getLatestAvgWeight(cycle)
  if (!feed || !alive || !avgW) return null
  const biomass = alive * avgW
  return biomass > 0 ? feed / biomass : null
}

function getMortalityPct(cycle) {
  if (!cycle.doc_count) return 0
  return (getTotalMortality(cycle) / cycle.doc_count) * 100
}

function getCycleAge(cycle) {
  return calcCurrentAge(cycle.start_date)
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return 'pagi'
  if (h < 15) return 'siang'
  if (h < 19) return 'sore'
  return 'malam'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PeternakBeranda() {
  const { profile, tenant } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  // Handle FAB action from BottomNav (?action=tambah-kandang)
  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'tambah-kandang') {
      setShowSetupWizard(true)
    }
  }, [location.search])
  const [showSetupWizard, setShowSetupWizard] = useState(false)

  const { data: farms, isLoading: farmsLoading } = usePeternakFarms()
  const { data: activeCycles = [], isLoading: cyclesLoading } = useActiveCycles()
  const { data: completedCycles = [] } = useCompletedCycles()

  const farmList = farms ?? []
  const kandangLimit = tenant?.kandang_limit ?? 1
  const currentCount = farmList.reduce((sum, f) => sum + (f.kandang_count || 1), 0)
  const canAdd = currentCount < kandangLimit
  const limitDisplay = kandangLimit >= 99 ? '∞' : String(kandangLimit)

  // ── All hooks before conditional returns ──
  const kpi = useMemo(() => {
    const totalDoc = activeCycles.reduce((s, c) => s + (c.doc_count || 0), 0)
    const ages = activeCycles.map(c => getCycleAge(c)).filter(Boolean)
    const avgAge = ages.length ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : 0
    const avgDaysLeft = ages.length
      ? Math.round(ages.map(a => Math.max(0, HARVEST_TARGET_DAYS - a)).reduce((s, a) => s + a, 0) / ages.length)
      : 0
    const todayMort = activeCycles.reduce((s, c) => {
      return s + getTodayRecords(c).reduce((ss, r) => ss + (r.mortality_count || 0), 0)
    }, 0)
    const totalMort = activeCycles.reduce((s, c) => s + getTotalMortality(c), 0)
    const mortPct = totalDoc > 0 ? ((totalMort / totalDoc) * 100).toFixed(1) : '0.0'
    return { totalDoc, avgAge, avgDaysLeft, todayMort, totalMort, mortPct }
  }, [activeCycles])

  const alerts = useMemo(() => {
    const list = []
    activeCycles.forEach(c => {
      const age = getCycleAge(c)
      const mort = getMortalityPct(c)
      const farmName = c.peternak_farms?.farm_name ?? 'Kandang'
      if (age > 35) list.push({ type: 'danger', msg: `${farmName}: Hari ke-${age} — sudah melewati target panen` })
      if (mort > 5) list.push({ type: 'warning', msg: `${farmName}: Mortalitas ${mort.toFixed(1)}% — di atas batas normal 5%` })
      if (!(c.daily_records ?? []).some(r => r.record_date === TODAY) && age > 0) {
        list.push({ type: 'info', msg: `${farmName}: Belum ada input harian hari ini` })
      }
    })
    return list
  }, [activeCycles])

  const chartData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().split('T')[0]
      const mort = activeCycles.reduce((sum, c) => {
        const rec = (c.daily_records ?? []).find(r => r.record_date === dateStr)
        return sum + (rec?.mortality_count || 0)
      }, 0)
      return { date: `${d.getDate()}/${d.getMonth() + 1}`, mort }
    })
  }, [activeCycles])

  // ── Loading skeleton ──
  if (farmsLoading || cyclesLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start p-4 bg-[#0C1319] rounded-2xl animate-pulse">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-white/10 rounded" />
            <div className="h-6 w-36 bg-white/10 rounded" />
            <div className="h-2 w-20 bg-white/10 rounded" />
          </div>
          <div className="h-9 w-28 bg-white/10 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#111C24] rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-[#0C1319] rounded-2xl animate-pulse" />
      </div>
    )
  }

  // ── Setup wizard (hanya buka saat user klik sendiri) ──
  if (showSetupWizard) {
    return (
      <SetupFarm
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['peternak-farms', tenant?.id] })
          setShowSetupWizard(false)
        }}
        onCancel={() => setShowSetupWizard(false)}
      />
    )
  }

  return (
    <div className="text-slate-100 pb-10">

      {/* ── SECTION A — Header ── */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04] flex justify-between items-start">
        <div>
          <p className="text-xs text-[#4B6478] mb-1">Selamat {getGreeting()},</p>
          <h1 className="font-['Sora'] text-xl font-extrabold text-slate-100 mb-1">
            {profile?.full_name?.split(' ')[0] ?? 'Peternak'} 👋
          </h1>
          <p className="text-[11px] text-[#4B6478]">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#7C3AED] rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-[0_3px_12px_rgba(124,58,237,0.35)] cursor-pointer border-none"
            onClick={() => navigate('/peternak/siklus?action=new')}
          >
            <Plus size={13} strokeWidth={2.5} />
            Mulai Siklus
          </motion.button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#4B6478]">{currentCount}/{limitDisplay} kandang</span>
            <button
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold font-['Sora'] border transition-opacity ${
                canAdd
                  ? 'bg-[rgba(124,58,237,0.1)] border-[rgba(124,58,237,0.2)] text-[#A78BFA] cursor-pointer'
                  : 'bg-white/[0.04] border-white/[0.08] text-[#4B6478] opacity-60 cursor-not-allowed'
              }`}
              onClick={() => {
                if (!canAdd) {
                  toast.info(
                    tenant?.plan === 'starter'
                      ? 'Upgrade ke Pro untuk tambah kandang'
                      : 'Upgrade ke Business untuk kandang unlimited'
                  )
                  return
                }
                setShowSetupWizard(true)
              }}
            >
              {canAdd ? <Plus size={11} strokeWidth={2.5} /> : <Lock size={11} />}
              Tambah Kandang
            </button>
          </div>
        </div>
      </header>

      <div className="px-4">

        {/* ── SECTION E — Alerts ── */}
        {alerts.length > 0 && (
          <section className="mt-4 flex flex-col gap-2">
            {alerts.map((a, i) => <AlertCard key={i} type={a.type} msg={a.msg} />)}
          </section>
        )}

        {/* ── SECTION B — KPI Cards ── */}
        <section className="grid grid-cols-2 gap-2.5 mt-4">
          <KPICard
            icon={<Activity size={16} color="#A78BFA" />}
            label="Siklus Aktif"
            value={activeCycles.length}
            sub={`${kpi.totalDoc.toLocaleString('id-ID')} ekor total`}
            valueColor="text-[#A78BFA]"
          />
          <KPICard
            icon={<Bird size={16} color="#34D399" />}
            label="Populasi Aktif"
            value={kpi.totalDoc.toLocaleString('id-ID')}
            sub={`${activeCycles.length} siklus berjalan`}
            valueColor="text-[#34D399]"
          />
          <KPICard
            icon={<Clock size={16} color="#60A5FA" />}
            label="Umur Rata-rata"
            value={`Hari ke-${kpi.avgAge}`}
            sub={kpi.avgDaysLeft > 0 ? `Est. panen ${kpi.avgDaysLeft} hari lagi` : 'Siap panen'}
            valueColor="text-[#60A5FA]"
          />
          <KPICard
            icon={<AlertTriangle size={16} color={parseFloat(kpi.mortPct) > 5 ? '#F87171' : '#94A3B8'} />}
            label="Mortalitas Hari Ini"
            value={kpi.todayMort}
            sub={`Kumulatif: ${kpi.totalMort} ekor (${kpi.mortPct}%)`}
            valueColor={parseFloat(kpi.mortPct) > 5 ? 'text-red-400' : 'text-slate-400'}
          />
        </section>

        {/* ── SECTION C — Kandang Saya ── */}
        <section className="mt-7">
          <SectionHeader
            title="Kandang Saya"
            count={farmList.length}
            action="Tambah"
            onAction={() => {
              if (!canAdd) {
                toast.info(
                  tenant?.plan === 'starter'
                    ? 'Upgrade ke Pro untuk tambah kandang'
                    : 'Upgrade ke Business untuk kandang unlimited'
                )
                return
              }
              setShowSetupWizard(true)
            }}
          />
          <div className="flex flex-col gap-4 mt-3.5">
            {farmList.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-white/10 text-center gap-3 cursor-pointer"
                onClick={() => canAdd && setShowSetupWizard(true)}
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <Bird size={22} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-300">Belum ada kandang</p>
                  <p className="text-xs text-[#4B6478] mt-1">Tambahkan kandang pertama untuk mulai tracking</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSetupWizard(true) }}
                  className="px-5 py-2 bg-purple-600 rounded-xl text-xs font-bold text-white font-['Sora'] border-none cursor-pointer"
                >
                  + Setup Kandang
                </button>
              </div>
            ) : (
              farmList.map(farm => {
                const cycle = activeCycles.find(c => c.peternak_farm_id === farm.id)
                const cycleWithAge = cycle
                  ? { ...cycle, age_days: calcCurrentAge(cycle.start_date) }
                  : null
                return (
                  <FarmCard
                    key={farm.id}
                    farm={farm}
                    activeCycle={cycleWithAge}
                    onStart={() => navigate(`/peternak/siklus?action=new&farm=${farm.id}`)}
                    onView={() => navigate(`/peternak/kandang/${farm.id}/beranda`)}
                  />
                )
              })
            )}
          </div>
        </section>

        {/* ── SECTION D — Siklus Aktif ── */}
        {activeCycles.length > 0 ? (
          <section className="mt-7">
            <SectionHeader title="Siklus Aktif" count={activeCycles.length} />
            <div className="flex flex-col gap-3.5 mt-3.5">
              {activeCycles.map(cycle => (
                <CycleCard
                  key={cycle.id}
                  cycle={cycle}
                  onInputHarian={() => navigate(`/peternak/input?cycle=${cycle.id}`)}
                  onDetail={() => navigate(`/peternak/siklus/${cycle.id}`)}
                />
              ))}
            </div>
          </section>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 py-10 px-5 text-center bg-[#0C1319] rounded-2xl border border-dashed border-white/[0.05]"
          >
            <span className="text-4xl">🏚️</span>
            <p className="text-[#4B6478] text-sm mt-3">Belum ada siklus aktif</p>
            <button
              className="mt-4 px-5 py-2.5 bg-[#7C3AED] text-white text-sm font-bold font-['Sora'] rounded-xl border-none cursor-pointer"
              onClick={() => navigate('/peternak/siklus?action=new')}
            >
              Mulai Siklus Baru
            </button>
          </motion.div>
        )}

        {/* ── SECTION E — Mini Chart (desktop only) ── */}
        {activeCycles.length > 0 && (
          <section className="hidden md:block mt-5">
            <div className="bg-[#0C1319] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider mb-3">
                Tren Mortalitas 7 Hari
              </p>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <YAxis tick={{ fontSize: 9, fill: '#4B6478' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#111C24',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    labelStyle={{ color: '#94A3B8' }}
                    itemStyle={{ color: '#F87171' }}
                    formatter={(v) => [`${v} ekor`, 'Mati']}
                  />
                  <Line
                    type="monotone"
                    dataKey="mort"
                    stroke="#F87171"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#F87171' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ── Riwayat Siklus ── */}
        {completedCycles.length > 0 && (
          <section className="mt-7">
            <SectionHeader
              title="Riwayat Siklus"
              action="Lihat semua"
              onAction={() => navigate('/peternak/siklus')}
            />
            <div className="flex flex-col gap-2 mt-3">
              {completedCycles.map(c => <CompletedCycleRow key={c.id} cycle={c} />)}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ icon, label, value, sub, valueColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111C24] border border-white/[0.06] rounded-2xl p-3.5"
    >
      <div className="mb-2">{icon}</div>
      <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider">{label}</p>
      <p className={`font-['Sora'] text-lg font-extrabold mt-1 mb-0.5 ${valueColor}`}>{value}</p>
      <p className="text-[10px] text-[#4B6478]">{sub}</p>
    </motion.div>
  )
}

// ─── Cycle Card ───────────────────────────────────────────────────────────────

function CycleCard({ cycle, onInputHarian, onDetail }) {
  const farm = cycle.peternak_farms ?? {}
  const age = getCycleAge(cycle)
  const alive = (cycle.doc_count ?? 0) - getTotalMortality(cycle)
  const fcr = getEstimatedFCR(cycle)
  const mort = getMortalityPct(cycle)
  const progress = Math.min(100, Math.round((age / HARVEST_TARGET_DAYS) * 100))
  const daysLeft = Math.max(0, HARVEST_TARGET_DAYS - age)
  const modelLabel = BUSINESS_MODEL_LABELS[farm.business_model] ?? farm.business_model ?? '—'
  const mitraInfo = farm.mitra_company ? ` — ${farm.mitra_company}` : ''
  const hasInputToday = (cycle.daily_records ?? []).some(r => r.record_date === TODAY)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0C1319] border border-white/[0.07] rounded-[20px] p-4"
    >
      {/* Row 1: farm name + day badge */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">🏠</span>
          <span className="font-['Sora'] font-extrabold text-[15px] text-slate-100">{farm.farm_name ?? '—'}</span>
        </div>
        <span className="text-[11px] font-extrabold text-[#A78BFA] bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] px-2.5 py-1 rounded-full">
          Hari ke-{age}
        </span>
      </div>

      {/* Row 2: model + input badge */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[11px] text-[#4B6478]">{modelLabel}{mitraInfo}</p>
        {hasInputToday
          ? <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">Sudah input ✓</span>
          : <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">Belum input</span>
        }
      </div>

      {/* Row 3: DOC + Hidup chips */}
      <div className="flex gap-2">
        <span className="text-[11px] font-bold text-slate-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">
          DOC: {(cycle.doc_count ?? 0).toLocaleString('id-ID')} ekor
        </span>
        <span className="text-[11px] font-bold text-slate-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">
          Hidup: {alive.toLocaleString('id-ID')} ekor
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
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
              background: progress >= 100
                ? '#34D399'
                : 'linear-gradient(90deg, #7C3AED 0%, #10B981 100%)',
            }}
          />
        </div>
      </div>

      {/* KPI row */}
      <div className="flex justify-around mt-3.5 pt-3 border-t border-white/[0.05]">
        <KpiChip
          label="FCR Est."
          value={fcr !== null ? fcr.toFixed(2) : '—'}
          good={fcr !== null && fcr < 1.7}
          bad={fcr !== null && fcr >= 1.8}
        />
        <KpiChip
          label="Mortalitas"
          value={`${mort.toFixed(1)}%`}
          good={mort < 3}
          bad={mort > 5}
        />
        <KpiChip
          label="Total Pakan"
          value={`${(getTotalFeedKg(cycle) / 1000).toFixed(1)} ton`}
          neutral
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3.5">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#7C3AED] border-none rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-[0_3px_10px_rgba(124,58,237,0.3)] cursor-pointer"
          onClick={onInputHarian}
        >
          <ClipboardList size={13} />
          Input Harian
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] rounded-xl text-[#A78BFA] text-xs font-bold cursor-pointer"
          onClick={onDetail}
        >
          <BarChart2 size={13} />
          Detail
        </button>
      </div>
    </motion.div>
  )
}

// ─── Completed Cycle Row ──────────────────────────────────────────────────────

function CompletedCycleRow({ cycle }) {
  const harvest = cycle.harvest_records?.[0]
  const farmName = cycle.peternak_farms?.farm_name ?? '—'
  const harvestDate = harvest?.harvest_date ?? '—'
  const netRevenue = harvest?.net_revenue ?? null

  return (
    <div className="flex items-center gap-3 px-3.5 py-3 bg-[#111C24] border border-white/[0.06] rounded-[14px]">
      <div className="flex-1 min-w-0">
        <p className="font-['Sora'] font-bold text-[13px] text-slate-100 mb-0.5">
          {farmName} · Siklus #{cycle.cycle_number}
        </p>
        <p className="text-[11px] text-[#4B6478]">
          {harvestDate !== '—' ? `Panen: ${harvestDate}` : 'Gagal / Dibatalkan'}
          {cycle.final_fcr ? ` · FCR ${Number(cycle.final_fcr).toFixed(2)}` : ''}
          {cycle.final_ip_score ? ` · IP ${Math.round(cycle.final_ip_score)}` : ''}
        </p>
      </div>
      {netRevenue !== null && (
        <span className={`text-[13px] font-bold flex-shrink-0 ${netRevenue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {netRevenue >= 0 ? '+' : ''}{formatIDRShort(netRevenue)}
        </span>
      )}
      <ChevronRight size={14} className="text-[#4B6478] flex-shrink-0" />
    </div>
  )
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

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

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, count, action, onAction }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <h2 className="font-['Sora'] font-extrabold text-[15px] text-slate-100">{title}</h2>
        {count != null && (
          <span className="text-[11px] font-extrabold text-[#A78BFA] bg-[rgba(124,58,237,0.12)] px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {action && (
        <button
          className="flex items-center gap-1 text-xs font-semibold text-[#7C3AED] bg-transparent border-none cursor-pointer"
          onClick={onAction}
        >
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}

// ─── Kpi Chip ─────────────────────────────────────────────────────────────────

function KpiChip({ label, value, good, bad, neutral }) {
  const color = neutral ? 'text-slate-400' : good ? 'text-emerald-400' : bad ? 'text-red-400' : 'text-slate-400'
  return (
    <div className="text-center">
      <p className="text-[10px] text-[#4B6478] font-semibold mb-0.5">{label}</p>
      <p className={`font-['Sora'] text-sm font-extrabold ${color}`}>{value}</p>
    </div>
  )
}
