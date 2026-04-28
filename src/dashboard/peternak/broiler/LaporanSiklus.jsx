import React, { useState, useMemo } from 'react'
import {
  ComposedChart, LineChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Thermometer, Droplets, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'
import { useAllCycles, useDailyRecords, calcCurrentAge, calcFCR, calcIPScore, calcMortalityPct } from '@/lib/hooks/usePeternakData'
import { formatIDRShort } from '@/lib/format'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { toast } from 'sonner'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'

const sheetLabelStyle = {
  display: 'block', fontSize: 10, fontWeight: 800,
  color: '#4B6478', textTransform: 'uppercase',
  letterSpacing: '0.1em', marginBottom: 6,
}
const sheetInputStyle = {
  width: '100%', padding: '12px 14px',
  background: '#111C24', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, color: '#F1F5F9',
  fontSize: 15, fontFamily: 'DM Sans', outline: 'none',
  boxSizing: 'border-box',
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, valueColor, badge }) {
  return (
    <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-4">
      <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-2">{label}</p>
      <p className={`font-['Sora'] font-extrabold text-xl leading-tight ${valueColor}`}>{value}</p>
      {badge && (
        <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border mt-1.5 ${badge.cls}`}>
          {badge.label}
        </span>
      )}
      {sub && <p className="text-[10px] text-[#4B6478] mt-1 leading-tight">{sub}</p>}
    </div>
  )
}

// ─── Analysis Card ────────────────────────────────────────────────────────────

function AnalysisCard({ icon, title, badge, desc }) {
  return (
    <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <p className="font-bold text-sm text-slate-100">{title}</p>
        {badge && (
          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>
      <p className="text-[12px] text-[#4B6478] leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── Cost Row ─────────────────────────────────────────────────────────────────

function CostRow({ label, value, valueColor, bold, large }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className={`text-[12px] ${bold ? 'font-bold text-slate-100' : 'text-[#4B6478]'} ${large ? 'text-[13px]' : ''}`}>
        {label}
      </span>
      <span className={`font-bold font-['Sora'] ${large ? 'text-[14px]' : 'text-[12px]'} ${valueColor ?? (bold ? 'text-slate-100' : 'text-[#4B6478]')}`}>
        {value}
      </span>
    </div>
  )
}



// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

// Cobb 500 standard bodyweight (gram) by age day
const COBB500_G = {
  1: 42, 3: 68, 5: 105, 7: 160, 10: 275, 14: 480,
  17: 680, 21: 1000, 24: 1280, 28: 1680,
  30: 1880, 32: 2060, 35: 2360, 38: 2620, 42: 2990,
}

function getCobb500Kg(ageDays) {
  const keys = Object.keys(COBB500_G).map(Number).sort((a, b) => a - b)
  if (ageDays <= keys[0]) return COBB500_G[keys[0]] / 1000
  if (ageDays >= keys[keys.length - 1]) return COBB500_G[keys[keys.length - 1]] / 1000
  for (let i = 0; i < keys.length - 1; i++) {
    if (ageDays >= keys[i] && ageDays <= keys[i + 1]) {
      const t = (ageDays - keys[i]) / (keys[i + 1] - keys[i])
      return Number(((COBB500_G[keys[i]] + t * (COBB500_G[keys[i + 1]] - COBB500_G[keys[i]])) / 1000).toFixed(3))
    }
  }
  return null
}

const LITTER_LABELS = { kering: 'Kering ✅', lembab: 'Lembab ⚠️', basah: 'Basah 🔴' }
const AMMONIA_LABELS = { tidak_ada: 'Tidak Ada ✅', ringan: 'Ringan 🟡', sedang: 'Sedang ⚠️', kuat: 'Kuat 🔴' }
const FEED_TYPE_LABELS = { 'BR-1': 'Starter BR-1', 'BR-2': 'Grower BR-2', 'BR-3': 'Finisher BR-3', 'BR-4': 'Finisher BR-4' }

const EXPENSE_TYPES = [
  { value: 'doc',          label: '🐣 DOC',              color: '#A78BFA' },
  { value: 'pakan',        label: '🌾 Pakan',            color: '#F59E0B' },
  { value: 'obat_vaksin',  label: '💊 Obat & Vaksin',   color: '#34D399' },
  { value: 'listrik_air',  label: '💡 Listrik & Air',    color: '#60A5FA' },
  { value: 'sewa_kandang', label: '🏠 Sewa Kandang',     color: '#F87171' },
  { value: 'tenaga_kerja', label: '👷 Tenaga Kerja',     color: '#FB923C' },
  { value: 'lainnya',      label: '📌 Lainnya',          color: '#94A3B8' },
]

function expenseLabel(type) {
  return EXPENSE_TYPES.find(e => e.value === type)?.label ?? type
}
function expenseColor(type) {
  return EXPENSE_TYPES.find(e => e.value === type)?.color ?? '#94A3B8'
}

// R/C Ratio benchmark
function rcBenchmark(rc) {
  if (!rc || rc <= 0) return null
  if (rc >= 1.5) return { label: 'Excellent', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', desc: 'Setiap Rp1 biaya menghasilkan Rp'+rc.toFixed(2)+' pendapatan. Sangat menguntungkan.' }
  if (rc >= 1.2) return { label: 'Baik',      cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20',   desc: 'R/C Ratio baik, usaha menguntungkan di atas standar industri.' }
  if (rc >= 1.0) return { label: 'Tipis',     cls: 'text-orange-400 bg-orange-400/10 border-orange-400/20', desc: 'Margin keuntungan sangat tipis. Perlu efisiensi biaya atau naikkan harga jual.' }
  return              { label: 'Rugi',      cls: 'text-red-400 bg-red-400/10 border-red-400/20',     desc: 'Biaya produksi melebihi pendapatan. Lakukan evaluasi menyeluruh.' }
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatIDR(n) {
  if (n == null) return '—'
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

function daysBetween(from, to) {
  if (!from || !to) return null
  return Math.max(0, Math.floor((new Date(to) - new Date(from)) / 86400000))
}

// Benchmark helpers
function fcrBenchmark(fcr) {
  if (!fcr) return null
  if (fcr < 1.6)  return { label: 'Sangat Baik', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', desc: 'Efisiensi pakan sangat baik, di atas rata-rata industri.' }
  if (fcr <= 1.8) return { label: 'Baik',        cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20',   desc: 'Efisiensi pakan dalam batas wajar standar industri.' }
  return              { label: 'Perlu Evaluasi', cls: 'text-red-400 bg-red-400/10 border-red-400/20',     desc: 'Efisiensi pakan di bawah standar, perlu evaluasi pakan dan manajemen.' }
}

function ipBenchmark(ip) {
  if (!ip) return null
  if (ip > 400)  return { label: 'Grade A — Excellent', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', desc: 'Performa sangat tinggi. Indeks produksi terbaik.' }
  if (ip >= 300) return { label: 'Grade B — Baik',      cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20',   desc: 'Performa baik, sesuai standar produksi komersial.' }
  if (ip >= 200) return { label: 'Grade C — Cukup',     cls: 'text-orange-400 bg-orange-400/10 border-orange-400/20', desc: 'Performa di bawah rata-rata, perlu perbaikan manajemen.' }
  return              { label: 'Grade D — Rendah',   cls: 'text-red-400 bg-red-400/10 border-red-400/20',     desc: 'Performa rendah, lakukan evaluasi menyeluruh.' }
}

function mortBenchmark(pct) {
  if (pct == null) return null
  if (pct <= 3)  return { label: 'Normal',   cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' }
  if (pct <= 5)  return { label: 'Waspada',  cls: 'text-amber-400 bg-amber-400/10 border-amber-400/20' }
  return              { label: 'Tinggi',   cls: 'text-red-400 bg-red-400/10 border-red-400/20' }
}

const STATUS_CFG = {
  active:    { label: 'Aktif',      cls: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  harvested: { label: 'Selesai',    cls: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  failed:    { label: 'Gagal',      cls: 'text-red-400 bg-red-500/20 border-red-500/30' },
  cancelled: { label: 'Dibatalkan', cls: 'text-slate-400 bg-white/10 border-white/15' },
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LaporanSiklus() {
  const { cycleId: paramCycleId } = useParams()
  const navigate = useNavigate()
  const { tenant } = useAuth()
  const p = usePeternakPermissions()
  const { data: allCycles = [], isLoading: cyclesLoading } = useAllCycles()
  const [selectedId, setSelectedId] = useState(null)

  // Sorted list: completed first, then active
  const sortedCycles = useMemo(
    () => [...allCycles].sort((a, b) => {
      const order = { harvested: 0, failed: 1, active: 2, cancelled: 3 }
      return (order[a.status] ?? 4) - (order[b.status] ?? 4)
    }),
    [allCycles]
  )

  const effectiveId = paramCycleId || selectedId || sortedCycles[0]?.id
  const cycle = sortedCycles.find(c => c.id === effectiveId) ?? sortedCycles[0] ?? null

  if (cyclesLoading) return <LoadingSpinner fullPage />

  if (sortedCycles.length === 0) {
    return (
      <div className="text-slate-100 pb-10">
        <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
          <h1 className="font-['Sora'] font-extrabold text-xl">Laporan Siklus</h1>
        </header>
        <div className="mx-4 mt-8 py-12 text-center bg-[#0C1319] rounded-2xl border border-dashed border-white/[0.05]">
          <span className="text-4xl">📊</span>
          <p className="text-[#4B6478] text-sm mt-3">Belum ada siklus untuk dilaporkan</p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-slate-100 pb-10">

      {/* ── Header ── */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04] flex justify-between items-start">
        <div className="flex items-start gap-2">
          {paramCycleId && (
            <button
              className="mt-0.5 text-[#4B6478] hover:text-slate-100 transition-colors cursor-pointer bg-transparent border-none p-0 md:hidden"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="font-['Sora'] font-extrabold text-xl text-slate-100">Laporan Siklus</h1>
            <p className="text-xs text-[#4B6478] mt-0.5">FCR · IP Score · Analisa Biaya</p>
          </div>
        </div>
        {cycle && (
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex-shrink-0 ${STATUS_CFG[cycle.status]?.cls ?? STATUS_CFG.cancelled.cls}`}>
            {STATUS_CFG[cycle.status]?.label ?? cycle.status}
          </span>
        )}
      </header>

      {/* ── Cycle Selector (if not direct URL) ── */}
      {!paramCycleId && (
        <div className="px-4 mt-4 overflow-x-auto pb-1">
          <div className="flex gap-2 min-w-max">
            {sortedCycles.map(c => {
              const isSelected = cycle?.id === c.id
              const statusDot = c.status === 'harvested' ? '#34D399' : c.status === 'active' ? '#A78BFA' : '#F87171'
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold border cursor-pointer transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-[rgba(124,58,237,0.12)] border-[rgba(124,58,237,0.4)] text-[#A78BFA]'
                      : 'bg-white/[0.04] border-white/[0.08] text-[#4B6478]'
                  }`}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusDot, flexShrink: 0, display: 'inline-block' }} />
                  {c.peternak_farms?.farm_name ?? '—'} · #{c.cycle_number}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {cycle && <CycleReport key={cycle.id} cycle={cycle} tenantId={tenant?.id} navigate={navigate} />}
    </div>
  )
}

// ─── Cycle Report ─────────────────────────────────────────────────────────────

function CycleReport({ cycle, tenantId, navigate }) {
  const farmName  = cycle.peternak_farms?.farm_name ?? '—'
  const startDate = cycle.start_date ?? cycle.created_at
  const farmId    = cycle.peternak_farm_id
  const queryClient = useQueryClient()
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)

  // Daily records (ordered asc for table + chart)
  const { data: records = [] } = useDailyRecords(cycle.id)

  // Harvest records
  const { data: harvests = [] } = useQuery({
    queryKey: ['harvest-records', cycle.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('harvest_records')
        .select('harvest_date, total_weight_kg, total_count, price_per_kg, net_revenue')
        .eq('cycle_id', cycle.id)
        .eq('is_deleted', false)
      if (error) throw error
      return data ?? []
    },
    enabled: !!cycle.id,
  })

  // Cycle expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['cycle-expenses', cycle.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycle_expenses')
        .select('expense_type, total_amount, description')
        .eq('cycle_id', cycle.id)
        .eq('is_deleted', false)
      if (error) throw error
      return data ?? []
    },
    enabled: !!cycle.id,
  })

  // ── Derived KPIs ──
  const kpi = useMemo(() => {
    const docCount    = cycle.doc_count ?? 0
    const totalFeedKg = parseFloat(cycle.total_feed_kg) || 0
    const totalMort   = cycle.total_mortality ?? 0
    const mortPct     = calcMortalityPct(totalMort, docCount)

    const totalHarvestKg  = harvests.reduce((s, h) => s + (parseFloat(h.total_weight_kg) || 0), 0)
    const totalHarvestRev = harvests.reduce((s, h) => s + (h.net_revenue || 0), 0)

    // FCR: use final if available, else from harvest weight, else from daily records estimate
    let fcrFinal = cycle.final_fcr
    if (!fcrFinal && totalHarvestKg > 0 && totalFeedKg > 0) {
      fcrFinal = calcFCR(totalFeedKg, totalHarvestKg)
    }
    if (!fcrFinal && records.length > 0) {
      const latestRec = [...records].filter(r => r.avg_weight_kg).sort((a, b) => new Date(b.record_date) - new Date(a.record_date))[0]
      if (latestRec) {
        const alive = docCount - totalMort
        fcrFinal = calcFCR(totalFeedKg, alive * latestRec.avg_weight_kg)
      }
    }

    // IP Score
    let ipScore = cycle.final_ip_score
    if (!ipScore && fcrFinal) {
      const latestRec = [...records].filter(r => r.avg_weight_kg).sort((a, b) => new Date(b.record_date) - new Date(a.record_date))[0]
      const avgW = latestRec?.avg_weight_kg ?? (totalHarvestKg > 0 && docCount > 0 ? totalHarvestKg / docCount : null)
      if (avgW) {
        const endStr = cycle.actual_harvest_date ?? TODAY
        const ageDays = daysBetween(startDate, endStr) ?? 1
        ipScore = calcIPScore(avgW, mortPct, ageDays, fcrFinal)
      }
    }

    const endDateStr = cycle.actual_harvest_date ?? (cycle.status !== 'active' ? TODAY : null)
    const ageDays    = daysBetween(startDate, endDateStr ?? TODAY)

    const totalExpenses = expenses.reduce((s, e) => s + (e.total_amount || 0), 0)
    const totalRevenue  = cycle.total_revenue ?? totalHarvestRev
    const totalCost     = cycle.total_cost ?? totalExpenses
    const netProfit     = totalRevenue - totalCost

    // Financial analytics
    const hpp       = totalHarvestKg > 0 && totalCost > 0 ? totalCost / totalHarvestKg : null
    const rcRatio   = totalCost > 0 && totalRevenue > 0 ? totalRevenue / totalCost : null
    const bepHarga  = totalHarvestKg > 0 && totalCost > 0 ? totalCost / totalHarvestKg : null
    // BEP ekor: minimum ekor to cover cost given sell price and avg weight
    const sellPrice = cycle.sell_price_per_kg ?? null
    const latestW   = [...records].filter(r => r.avg_weight_kg).sort((a, b) => new Date(b.record_date) - new Date(a.record_date))[0]?.avg_weight_kg ?? null
    const bepEkor   = sellPrice && latestW && totalCost > 0
      ? Math.ceil(totalCost / (latestW * sellPrice))
      : null

    return {
      docCount, totalMort, totalFeedKg, mortPct,
      fcrFinal, ipScore, ageDays,
      totalHarvestKg, totalHarvestRev, totalRevenue, totalCost, netProfit,
      totalExpenses, alive: docCount - totalMort,
      hpp, rcRatio, bepHarga, bepEkor, sellPrice,
    }
  }, [cycle, harvests, expenses, records, startDate])

  // ── Chart data ──
  const chartData = useMemo(
    () => records.map(r => ({
      label:  `H${r.age_days ?? '?'}`,
      berat:  r.avg_weight_kg ? Number(r.avg_weight_kg.toFixed(3)) : null,
      cobb:   r.age_days != null ? getCobb500Kg(r.age_days) : null,
      pakan:  r.feed_kg ? Number(parseFloat(r.feed_kg).toFixed(1)) : null,
      mati:   r.mortality_count || 0,
    })),
    [records]
  )

  const hasWeightData = records.some(r => r.avg_weight_kg)

  // Temperature chart (only when data exists)
  const tempChartData = useMemo(
    () => records
      .filter(r => r.temperature_morning || r.temperature_evening)
      .map(r => ({
        label: `H${r.age_days ?? '?'}`,
        pagi:  r.temperature_morning ? Number(r.temperature_morning) : null,
        sore:  r.temperature_evening ? Number(r.temperature_evening) : null,
      })),
    [records]
  )

  // Environmental summary stats across cycle
  const envStats = useMemo(() => {
    const withEnv = records.filter(r => r.litter_condition || r.ammonia_level || r.water_liter)
    if (!withEnv.length) return null
    const litCount = { kering: 0, lembab: 0, basah: 0 }
    const ammCount = { tidak_ada: 0, ringan: 0, sedang: 0, kuat: 0 }
    let totalWater = 0, waterDays = 0
    withEnv.forEach(r => {
      if (r.litter_condition) litCount[r.litter_condition] = (litCount[r.litter_condition] || 0) + 1
      if (r.ammonia_level) ammCount[r.ammonia_level] = (ammCount[r.ammonia_level] || 0) + 1
      if (r.water_liter) { totalWater += parseFloat(r.water_liter); waterDays++ }
    })
    const dominantLitter = Object.entries(litCount).sort((a, b) => b[1] - a[1])[0]?.[0]
    const dominantAmmonia = Object.entries(ammCount).sort((a, b) => b[1] - a[1])[0]?.[0]
    const avgWater = waterDays > 0 ? (totalWater / waterDays).toFixed(0) : null
    return { litCount, ammCount, dominantLitter, dominantAmmonia, avgWater, totalDays: withEnv.length }
  }, [records])

  // ── Table data with cumulative columns ──
  const tableData = useMemo(() => {
    let cumMort = 0
    let cumFeed = 0
    return [...records].map(r => {
      cumMort += (r.mortality_count || 0)
      cumFeed += parseFloat(r.feed_kg) || 0
      const alive  = Math.max(0, (cycle.doc_count ?? 0) - cumMort)
      const avgW   = r.avg_weight_kg || 0
      const fcrEst = avgW > 0 && alive > 0 ? (cumFeed / (alive * avgW)).toFixed(2) : '—'
      return { ...r, cumMort, cumFeed: cumFeed.toFixed(1), fcrEst }
    }).reverse()
  }, [records, cycle.doc_count])

  // ── Harvest prediction (active only) ──
  const prediction = useMemo(() => {
    if (cycle.status !== 'active') return null
    const last3w = [...records].filter(r => r.avg_weight_kg).slice(-3)
    const latestW = last3w[last3w.length - 1]?.avg_weight_kg ?? 0
    const growthPerDay = last3w.length >= 2
      ? (last3w[last3w.length - 1].avg_weight_kg - last3w[0].avg_weight_kg) / Math.max(1, last3w.length - 1)
      : 0
    const daysLeft = daysBetween(TODAY, cycle.estimated_harvest_date) ?? 0
    const predictedW   = latestW + growthPerDay * daysLeft
    const predictedRev = predictedW > 0 && kpi.alive > 0 && cycle.sell_price_per_kg
      ? predictedW * kpi.alive * cycle.sell_price_per_kg
      : null
    return { daysLeft, predictedW: predictedW.toFixed(2), predictedRev, latestW }
  }, [cycle, records, kpi.alive])

  const fcrBench  = fcrBenchmark(kpi.fcrFinal)
  const ipBench   = ipBenchmark(kpi.ipScore)
  const mortBench = mortBenchmark(kpi.mortPct)
  const status    = STATUS_CFG[cycle.status] ?? STATUS_CFG.cancelled

  return (
    <div className="px-4 mt-4 flex flex-col gap-6">

      {/* ── Cycle meta header ── */}
      <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-['Sora'] font-bold text-[14px] text-slate-100">
              🏠 {farmName} · Siklus #{cycle.cycle_number}
            </p>
            <p className="text-[11px] text-[#4B6478] mt-1">
              {fmt(startDate)}
              {cycle.actual_harvest_date ? ` — ${fmt(cycle.actual_harvest_date)}` : ' — sekarang'}
              {kpi.ageDays != null ? ` · ${kpi.ageDays} hari` : ''}
            </p>
          </div>
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex-shrink-0 ${status.cls}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* ── SECTION A — 6 KPI Cards ── */}
      <section className="grid grid-cols-2 gap-2.5">
        <KPICard
          label="Durasi"
          value={kpi.ageDays != null ? `${kpi.ageDays} hari` : '—'}
          sub={`${fmt(startDate)} → ${fmt(cycle.actual_harvest_date ?? TODAY)}`}
          valueColor="text-[#A78BFA]"
        />
        <KPICard
          label="Populasi Akhir"
          value={`${kpi.alive.toLocaleString('id-ID')} ekor`}
          sub={`DOC masuk: ${(kpi.docCount).toLocaleString('id-ID')} ekor`}
          valueColor="text-emerald-400"
        />
        <KPICard
          label="Mortalitas"
          value={`${kpi.mortPct.toFixed(1)}%`}
          sub={`${kpi.totalMort} dari ${kpi.docCount} ekor`}
          valueColor={kpi.mortPct > 5 ? 'text-red-400' : kpi.mortPct > 3 ? 'text-amber-400' : 'text-emerald-400'}
          badge={mortBench}
        />
        <KPICard
          label="FCR Akhir"
          value={kpi.fcrFinal ? kpi.fcrFinal.toFixed(2) : '—'}
          sub={fcrBench?.label ?? ''}
          valueColor={!kpi.fcrFinal ? 'text-slate-400' : kpi.fcrFinal < 1.6 ? 'text-emerald-400' : kpi.fcrFinal <= 1.8 ? 'text-amber-400' : 'text-red-400'}
          badge={fcrBench}
        />
        <KPICard
          label="IP Score"
          value={kpi.ipScore ? Math.round(kpi.ipScore) : '—'}
          sub={ipBench?.label ?? ''}
          valueColor={!kpi.ipScore ? 'text-slate-400' : kpi.ipScore > 400 ? 'text-emerald-400' : kpi.ipScore >= 300 ? 'text-amber-400' : 'text-red-400'}
          badge={ipBench}
        />
        <KPICard
          label="Profit / Loss"
          value={kpi.totalRevenue > 0 || kpi.totalCost > 0 ? formatIDR(kpi.netProfit) : '—'}
          sub={`Rev: ${formatIDR(kpi.totalRevenue)} · Cost: ${formatIDR(kpi.totalCost)}`}
          valueColor={kpi.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
      </section>

      {/* ── SECTION B — ComposedChart ── */}
      {chartData.length > 0 && (
        <section>
          <h2 className="font-['Sora'] font-extrabold text-[13px] text-slate-100 mb-3">Grafik Pertumbuhan Harian</h2>
          <div className="bg-[#0C1319] border border-white/[0.06] rounded-2xl p-4 pt-5">
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#4B6478', fontSize: 9 }} />
                <YAxis yAxisId="left"  tick={{ fill: '#4B6478', fontSize: 9 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#4B6478', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#94A3B8' }}
                  itemStyle={{ padding: '1px 0' }}
                  formatter={(v, name) => {
                    const labels = { berat: ['kg', 'Berat Aktual'], cobb: ['kg', 'Cobb 500 Target'], pakan: ['kg', 'Pakan'], mati: ['ekor', 'Kematian'] }
                    const [unit, label] = labels[name] ?? ['', name]
                    return [`${v} ${unit}`, label]
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10, color: '#4B6478', paddingTop: 8 }}
                  formatter={v => ({ berat: 'Berat Aktual (kg)', cobb: 'Cobb 500 Target', pakan: 'Pakan (kg)', mati: 'Kematian' }[v] ?? v)}
                />
                <Bar   yAxisId="right" dataKey="mati"  fill="#F87171" opacity={0.6} radius={[2, 2, 0, 0]} maxBarSize={18} name="mati" />
                <Line  yAxisId="left"  dataKey="cobb"  stroke="#34D399" strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls name="cobb" opacity={0.6} />
                <Line  yAxisId="left"  dataKey="berat" stroke="#A78BFA" strokeWidth={2} dot={{ r: 2, fill: '#7C3AED' }} connectNulls name="berat" />
                <Line  yAxisId="left"  dataKey="pakan" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 2" dot={false} connectNulls name="pakan" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {hasWeightData && (
            <p className="text-[10px] text-[#4B6478] mt-2 ml-1">
              Garis hijau putus-putus = standar Cobb 500 per hari
            </p>
          )}
        </section>
      )}

      {/* ── SECTION B2 — Temperature Chart ── */}
      {tempChartData.length > 1 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Thermometer size={14} className="text-[#F59E0B]" />
            <h2 className="font-['Sora'] font-extrabold text-[13px] text-slate-100">Tren Suhu Kandang</h2>
          </div>
          <div className="bg-[#0C1319] border border-white/[0.06] rounded-2xl p-4 pt-5">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={tempChartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fill: '#4B6478', fontSize: 9 }} />
                <YAxis tick={{ fill: '#4B6478', fontSize: 9 }} domain={['auto', 'auto']} unit="°C" />
                <Tooltip
                  contentStyle={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#94A3B8' }}
                  formatter={(v, name) => [`${v}°C`, name === 'pagi' ? 'Suhu Pagi' : 'Suhu Sore']}
                />
                <ReferenceLine y={32} stroke="rgba(248,113,113,0.3)" strokeDasharray="3 3" label={{ value: '32°C max', fill: '#F87171', fontSize: 9, position: 'right' }} />
                <ReferenceLine y={28} stroke="rgba(52,211,153,0.3)" strokeDasharray="3 3" label={{ value: '28°C min', fill: '#34D399', fontSize: 9, position: 'right' }} />
                <Line dataKey="pagi" stroke="#60A5FA" strokeWidth={2} dot={{ r: 2 }} connectNulls name="pagi" />
                <Line dataKey="sore" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} connectNulls name="sore" />
                <Legend wrapperStyle={{ fontSize: 10, color: '#4B6478', paddingTop: 6 }}
                  formatter={v => v === 'pagi' ? 'Suhu Pagi' : 'Suhu Sore'} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── SECTION C — Daily Records Table ── */}
      {tableData.length > 0 && (
        <section>
          <h2 className="font-['Sora'] font-extrabold text-[13px] text-slate-100 mb-3">
            Catatan Harian Lengkap
          </h2>
          <div className="bg-[#0C1319] border border-white/[0.08] rounded-2xl overflow-hidden">
            {/* Sticky header */}
            <div className="grid grid-cols-[64px_36px_36px_52px_52px_52px_52px] gap-0 px-3 py-2.5 bg-[#111C24] border-b border-white/[0.06] sticky top-0">
              {['Tanggal', 'Umr', 'Mati', 'Kum.Mati', 'Pakan', 'Kum.Pkn', 'FCR'].map(h => (
                <span key={h} className="text-[9px] font-extrabold text-[#4B6478] uppercase tracking-wider">{h}</span>
              ))}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {tableData.map((r, idx) => (
                <div
                  key={r.id ?? r.record_date}
                  className={`grid grid-cols-[64px_36px_36px_52px_52px_52px_52px] gap-0 px-3 py-2 items-center ${
                    idx < tableData.length - 1 ? 'border-b border-white/[0.04]' : ''
                  }`}
                >
                  <span className="text-[10px] text-slate-300">
                    {new Date(r.record_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                  </span>
                  <span className="text-[10px] text-[#4B6478]">{r.age_days ?? '—'}</span>
                  <span className={`text-[10px] font-bold ${(r.mortality_count ?? 0) > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {r.mortality_count ?? 0}
                  </span>
                  <span className="text-[10px] text-[#4B6478]">{r.cumMort}</span>
                  <span className="text-[10px] text-slate-400">{parseFloat(r.feed_kg || 0).toFixed(1)}</span>
                  <span className="text-[10px] text-[#4B6478]">{r.cumFeed}</span>
                  <span className={`text-[10px] font-bold ${
                    r.fcrEst !== '—'
                      ? parseFloat(r.fcrEst) < 1.7 ? 'text-emerald-400' : parseFloat(r.fcrEst) > 1.8 ? 'text-red-400' : 'text-amber-400'
                      : 'text-[#4B6478]'
                  }`}>{r.fcrEst}</span>
                </div>
              ))}
            </div>
            {/* Footer totals */}
            <div className="grid grid-cols-[64px_36px_36px_52px_52px_52px_52px] gap-0 px-3 py-2.5 bg-[#111C24] border-t border-white/[0.06]">
              <span className="text-[9px] font-extrabold text-[#4B6478] uppercase">TOTAL</span>
              <span className="text-[9px] text-[#4B6478]">—</span>
              <span className="text-[10px] font-bold text-red-400">{kpi.totalMort}</span>
              <span className="text-[10px] font-bold text-red-400">—</span>
              <span className="text-[10px] font-bold text-amber-400">{kpi.totalFeedKg.toFixed(1)}</span>
              <span className="text-[10px] font-bold text-amber-400">—</span>
              <span className={`text-[10px] font-bold ${kpi.fcrFinal ? (kpi.fcrFinal < 1.7 ? 'text-emerald-400' : 'text-amber-400') : 'text-[#4B6478]'}`}>
                {kpi.fcrFinal ? kpi.fcrFinal.toFixed(2) : '—'}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION C2 — Catatan Lingkungan ── */}
      {envStats && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Droplets size={14} className="text-[#60A5FA]" />
            <h2 className="font-['Sora'] font-extrabold text-[13px] text-slate-100">Ringkasan Lingkungan</h2>
            <span className="text-[10px] text-[#4B6478]">dari {envStats.totalDays} hari input</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Litter */}
            <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-3.5">
              <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-2">Kondisi Litter</p>
              {Object.entries(envStats.litCount).map(([k, v]) => v > 0 && (
                <div key={k} className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-slate-300">{LITTER_LABELS[k] ?? k}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 rounded-full" style={{
                      width: `${Math.round((v / envStats.totalDays) * 48)}px`,
                      background: k === 'kering' ? '#34D399' : k === 'lembab' ? '#F59E0B' : '#F87171',
                      minWidth: 4,
                    }} />
                    <span className="text-[10px] text-[#4B6478] w-7 text-right">{v}x</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Ammonia */}
            <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-3.5">
              <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-2">Kadar Amonia</p>
              {Object.entries(envStats.ammCount).map(([k, v]) => v > 0 && (
                <div key={k} className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-slate-300">{AMMONIA_LABELS[k]?.split(' ')[0] ?? k}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 rounded-full" style={{
                      width: `${Math.round((v / envStats.totalDays) * 48)}px`,
                      background: k === 'tidak_ada' ? '#34D399' : k === 'ringan' ? '#A3E635' : k === 'sedang' ? '#F59E0B' : '#F87171',
                      minWidth: 4,
                    }} />
                    <span className="text-[10px] text-[#4B6478] w-7 text-right">{v}x</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Avg water */}
            {envStats.avgWater && (
              <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-3.5 col-span-2">
                <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1">Rata-rata Konsumsi Air</p>
                <p className="font-['Sora'] text-xl font-extrabold text-[#60A5FA]">{envStats.avgWater} <span className="text-sm font-bold text-[#4B6478]">liter/hari</span></p>
              </div>
            )}
          </div>

          {/* Environmental detail table (scrollable) */}
          {records.some(r => r.temperature_morning || r.litter_condition || r.ammonia_level || r.feed_type) && (
            <div className="mt-3 bg-[#0C1319] border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 480 }}>
                  <thead>
                    <tr className="bg-[#111C24] border-b border-white/[0.06]">
                      {['Tgl', 'Umr', 'Suhu Pagi', 'Suhu Sore', 'Air (L)', 'Litter', 'Amonia', 'Pakan'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-[9px] font-extrabold text-[#4B6478] uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...records].reverse().filter(r =>
                      r.temperature_morning || r.temperature_evening || r.litter_condition ||
                      r.ammonia_level || r.water_liter || r.feed_type
                    ).map((r, idx, arr) => (
                      <tr key={r.id ?? r.record_date} className={idx < arr.length - 1 ? 'border-b border-white/[0.04]' : ''}>
                        <td className="px-3 py-2 text-[10px] text-slate-300 whitespace-nowrap">
                          {new Date(r.record_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-[#4B6478]">{r.age_days ?? '—'}</td>
                        <td className="px-3 py-2 text-[10px] text-[#60A5FA] font-bold">
                          {r.temperature_morning ? `${r.temperature_morning}°C` : '—'}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-[#F59E0B] font-bold">
                          {r.temperature_evening ? `${r.temperature_evening}°C` : '—'}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-slate-400">
                          {r.water_liter ? `${r.water_liter}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-[10px]">
                          {r.litter_condition
                            ? <span style={{ color: r.litter_condition === 'kering' ? '#34D399' : r.litter_condition === 'lembab' ? '#F59E0B' : '#F87171' }}>
                                {LITTER_LABELS[r.litter_condition]}
                              </span>
                            : <span className="text-[#4B6478]">—</span>}
                        </td>
                        <td className="px-3 py-2 text-[10px]">
                          {r.ammonia_level
                            ? <span style={{ color: r.ammonia_level === 'tidak_ada' ? '#34D399' : r.ammonia_level === 'ringan' ? '#A3E635' : r.ammonia_level === 'sedang' ? '#F59E0B' : '#F87171' }}>
                                {AMMONIA_LABELS[r.ammonia_level]}
                              </span>
                            : <span className="text-[#4B6478]">—</span>}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-[#A78BFA] font-bold">
                          {r.feed_type ? FEED_TYPE_LABELS[r.feed_type] ?? r.feed_type : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── SECTION D — Analisis Performa ── */}
      <section>
        <h2 className="font-['Sora'] font-extrabold text-[13px] text-slate-100 mb-3">Analisis Performa</h2>
        <div className="flex flex-col gap-2.5">
          <AnalysisCard
            icon="📊"
            title={`FCR ${kpi.fcrFinal ? kpi.fcrFinal.toFixed(2) : '—'}`}
            badge={fcrBench}
            desc={fcrBench?.desc ?? 'Data FCR belum tersedia. Lengkapi catatan harian.'}
          />
          <AnalysisCard
            icon="🏆"
            title={`IP Score ${kpi.ipScore ? Math.round(kpi.ipScore) : '—'}`}
            badge={ipBench}
            desc={ipBench?.desc ?? 'IP Score dihitung setelah FCR dan data panen tersedia.'}
          />
        </div>
      </section>

      {/* ── SECTION D2 — Analisis Finansial (owner & manajer only) ── */}
      {p.canViewKeuangan && <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-['Sora'] font-extrabold text-[13px] text-slate-100">Analisis Finansial</h2>
          {cycle.status === 'active' && p.canInputBiaya && (
            <button
              onClick={() => setExpenseSheetOpen(true)}
              className="flex items-center gap-1 text-[11px] font-bold text-[#A78BFA] bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] px-2.5 py-1.5 rounded-lg cursor-pointer"
            >
              <Plus size={11} />
              Tambah Biaya
            </button>
          )}
        </div>

        {/* Expense breakdown */}
        <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-4 mb-2.5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-[13px] text-slate-100">💰 Rincian Biaya Produksi</p>
            {kpi.totalCost > 0 && kpi.totalHarvestKg > 0 && (
              <span className="text-[10px] font-bold text-[#4B6478]">
                HPP: <span className="text-amber-400">{formatIDR(kpi.hpp)}/kg</span>
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {expenses.length === 0 ? (
              <p className="text-[11px] text-[#4B6478] py-2 text-center">
                Belum ada catatan biaya. Tap "Tambah Biaya" untuk mulai.
              </p>
            ) : (
              <>
                {expenses.map((e, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: expenseColor(e.expense_type) }} />
                      <span className="text-[12px] text-slate-300">{expenseLabel(e.expense_type)}</span>
                      {e.description && <span className="text-[10px] text-[#4B6478]">· {e.description}</span>}
                    </div>
                    <span className="text-[12px] font-bold text-slate-100 font-['Sora']">{formatIDR(e.total_amount)}</span>
                  </div>
                ))}
                <div className="h-px bg-white/[0.06] my-1" />
                <CostRow label="Total Biaya" value={formatIDR(kpi.totalCost)} bold />
              </>
            )}
            {kpi.totalRevenue > 0 && (
              <CostRow label="Total Revenue" value={formatIDR(kpi.totalRevenue)} bold valueColor="text-emerald-400" />
            )}
            {(kpi.totalRevenue > 0 || kpi.totalCost > 0) && (
              <>
                <div className="h-px bg-white/[0.06] my-1" />
                <CostRow
                  label="Net Profit / Loss"
                  value={formatIDR(kpi.netProfit)}
                  bold large
                  valueColor={kpi.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
              </>
            )}
          </div>
        </div>

        {/* Financial metrics grid */}
        {kpi.totalCost > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {/* HPP */}
            {kpi.hpp && kpi.totalHarvestKg > 0 && (
              <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-3.5">
                <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">HPP / kg</p>
                <p className="font-['Sora'] text-base font-extrabold text-amber-400">{formatIDR(kpi.hpp)}</p>
                <p className="text-[10px] text-[#4B6478] mt-1">Harga Pokok Produksi per kg</p>
                {kpi.sellPrice && (
                  <p className="text-[10px] mt-1 font-bold" style={{ color: kpi.sellPrice > kpi.hpp ? '#34D399' : '#F87171' }}>
                    {kpi.sellPrice > kpi.hpp
                      ? `✅ Margin +${formatIDR(kpi.sellPrice - kpi.hpp)}/kg`
                      : `🔴 Jual di bawah HPP`}
                  </p>
                )}
              </div>
            )}
            {/* R/C Ratio */}
            {kpi.rcRatio && (
              <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-3.5">
                <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">R/C Ratio</p>
                <p className={`font-['Sora'] text-base font-extrabold ${rcBenchmark(kpi.rcRatio)?.cls?.split(' ')[0] ?? 'text-slate-100'}`}>
                  {kpi.rcRatio.toFixed(2)}
                </p>
                {rcBenchmark(kpi.rcRatio) && (
                  <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border mt-1 ${rcBenchmark(kpi.rcRatio).cls}`}>
                    {rcBenchmark(kpi.rcRatio).label}
                  </span>
                )}
                <p className="text-[10px] text-[#4B6478] mt-1">Revenue ÷ Total Biaya</p>
              </div>
            )}
            {/* BEP Harga Jual */}
            {kpi.bepHarga && kpi.totalHarvestKg > 0 && (
              <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-3.5">
                <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">BEP Harga Jual</p>
                <p className="font-['Sora'] text-base font-extrabold text-[#A78BFA]">{formatIDR(kpi.bepHarga)}/kg</p>
                <p className="text-[10px] text-[#4B6478] mt-1">Harga minimum impas</p>
              </div>
            )}
            {/* BEP Ekor */}
            {kpi.bepEkor && (
              <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-3.5">
                <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">BEP Ekor</p>
                <p className="font-['Sora'] text-base font-extrabold text-[#60A5FA]">
                  {kpi.bepEkor.toLocaleString('id-ID')} ekor
                </p>
                <p className="text-[10px] text-[#4B6478] mt-1">Minimum panen impas</p>
                {kpi.alive > 0 && (
                  <p className="text-[10px] mt-1 font-bold" style={{ color: kpi.alive >= kpi.bepEkor ? '#34D399' : '#F87171' }}>
                    {kpi.alive >= kpi.bepEkor ? `✅ Populasi cukup` : `⚠️ Kurang ${(kpi.bepEkor - kpi.alive).toLocaleString('id-ID')} ekor`}
                  </p>
                )}
              </div>
            )}
            {/* R/C description if available */}
            {kpi.rcRatio && rcBenchmark(kpi.rcRatio) && (
              <div className="col-span-2 bg-[#0C1319] border border-white/[0.06] rounded-xl px-3 py-2.5">
                <p className="text-[11px] text-[#4B6478] leading-relaxed">{rcBenchmark(kpi.rcRatio).desc}</p>
              </div>
            )}
          </div>
        )}
        {kpi.totalCost === 0 && cycle.status === 'active' && (
          <div className="bg-[#0C1319] border border-dashed border-white/[0.08] rounded-2xl py-6 text-center">
            <p className="text-[#4B6478] text-xs">Belum ada data biaya. Tambahkan biaya produksi untuk menghitung HPP, R/C Ratio, dan BEP.</p>
          </div>
        )}
      </section>}

      {/* ── Add Expense Sheet (owner & manajer only) ── */}
      {p.canInputBiaya && (
        <AddExpenseSheet
          open={expenseSheetOpen}
          onClose={() => setExpenseSheetOpen(false)}
          cycleId={cycle.id}
          tenantId={tenantId}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['cycle-expenses', cycle.id] })}
        />
      )}

      {/* ── SECTION E — Prediksi Panen (active only) ── */}
      {prediction && (
        <section>
          <h2 className="font-['Sora'] font-extrabold text-[13px] text-slate-100 mb-3">Prediksi Panen</h2>
          <div className="bg-amber-400/[0.06] border border-amber-400/25 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🌾</span>
              <div>
                <p className="font-bold text-sm text-amber-400">Estimasi tanggal panen: {fmt(cycle.estimated_harvest_date)}</p>
                <p className="text-[11px] text-[#4B6478] mt-0.5">
                  {prediction.daysLeft > 0 ? `${prediction.daysLeft} hari lagi` : 'Sudah melewati target panen'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#0C1319] border border-white/[0.06] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#4B6478] font-semibold uppercase tracking-wider mb-1">Prediksi Berat</p>
                <p className="font-['Sora'] font-extrabold text-base text-amber-400">{prediction.predictedW} kg</p>
                <p className="text-[10px] text-[#4B6478]">per ekor saat panen</p>
              </div>
              <div className="bg-[#0C1319] border border-white/[0.06] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#4B6478] font-semibold uppercase tracking-wider mb-1">Prediksi Revenue</p>
                <p className="font-['Sora'] font-extrabold text-base text-emerald-400">
                  {prediction.predictedRev ? formatIDRShort(prediction.predictedRev) : '—'}
                </p>
                <p className="text-[10px] text-[#4B6478]">
                  {cycle.sell_price_per_kg ? `@ Rp ${Number(cycle.sell_price_per_kg).toLocaleString('id-ID')}/kg` : 'Isi target harga jual'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer Action Buttons ── */}
      <div className="flex gap-2 pt-2">
        {cycle.status === 'active' && (
          <>
            <button
              className="flex-1 py-3 bg-[#7C3AED] border-none rounded-xl text-white text-sm font-extrabold font-['Sora'] shadow-[0_3px_12px_rgba(124,58,237,0.3)] cursor-pointer"
              onClick={() => navigate(`/peternak/input?cycle=${cycle.id}`)}
            >
              Input Hari Ini
            </button>
            <button
              className="flex-1 py-3 bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] rounded-xl text-[#A78BFA] text-sm font-bold cursor-pointer"
              onClick={() => navigate('/peternak/siklus')}
            >
              Tutup Siklus
            </button>
          </>
        )}
        {cycle.status !== 'active' && (
          <button
            className="flex-1 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-400 text-sm font-bold cursor-pointer"
            onClick={() => navigate('/peternak/siklus')}
          >
            ← Kembali ke Siklus
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Add Expense Sheet ────────────────────────────────────────────────────────

function AddExpenseSheet({ open, onClose, cycleId, tenantId, onSuccess }) {
  const [expenseType, setExpenseType] = useState('pakan')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Jumlah biaya tidak valid')
    setLoading(true)
    try {
      const { error } = await supabase.from('cycle_expenses').insert({
        tenant_id: tenantId,
        cycle_id: cycleId,
        expense_type: expenseType,
        total_amount: Number(amount),
        description: desc || null,
      })
      if (error) throw error
      toast.success('Biaya berhasil dicatat')
      if (onSuccess) onSuccess()
      setAmount('')
      setDesc('')
      onClose()
    } catch (err) {
      toast.error('Gagal mencatat biaya')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="bg-[#0C1319] border-white/8 rounded-t-[24px] max-h-[85vh] overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/5">
          <SheetTitle className="text-white font-display font-black text-base text-left">Tambah Biaya Produksi</SheetTitle>
          <SheetDescription className="sr-only">Form tambah biaya siklus</SheetDescription>
        </SheetHeader>
        <div style={{ padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Expense type grid */}
          <div>
            <label style={sheetLabelStyle}>Kategori Biaya *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {EXPENSE_TYPES.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpenseType(opt.value)}
                  style={{
                    padding: '10px 12px', textAlign: 'left',
                    background: expenseType === opt.value ? `${opt.color}18` : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${expenseType === opt.value ? opt.color : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10,
                    color: expenseType === opt.value ? opt.color : '#4B6478',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label style={sheetLabelStyle}>Jumlah Biaya *</label>
            <InputRupiah value={amount} onChange={setAmount} />
          </div>

          {/* Description */}
          <div>
            <label style={sheetLabelStyle}>Keterangan (opsional)</label>
            <input
              type="text"
              placeholder="cth. Pakan periode 1-15 hari"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              style={sheetInputStyle}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!amount || loading}
            style={{
              width: '100%', padding: 14,
              background: loading || !amount ? 'rgba(124,58,237,0.4)' : '#7C3AED',
              border: 'none', borderRadius: 12, color: 'white',
              fontSize: 15, fontWeight: 800, cursor: loading || !amount ? 'not-allowed' : 'pointer',
              fontFamily: 'Sora', boxShadow: '0 4px 16px rgba(124,58,237,0.3)', marginTop: 4,
            }}
          >
            {loading ? 'Menyimpan...' : '💾 Simpan Biaya'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

