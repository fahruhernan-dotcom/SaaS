import React, { useState, useMemo } from 'react'
import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAllCycles, useDailyRecords, calcCurrentAge, calcFCR, calcIPScore, calcMortalityPct } from '@/lib/hooks/usePeternakData'
import { formatIDRShort } from '@/lib/format'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

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

    return {
      docCount, totalMort, totalFeedKg, mortPct,
      fcrFinal, ipScore, ageDays,
      totalHarvestKg, totalHarvestRev, totalRevenue, totalCost, netProfit,
      totalExpenses, alive: docCount - totalMort,
    }
  }, [cycle, harvests, expenses, records, startDate])

  // ── Chart data ──
  const chartData = useMemo(
    () => records.map(r => ({
      label:  `H${r.age_days ?? '?'}`,
      berat:  r.avg_weight_kg ? Number(r.avg_weight_kg.toFixed(3)) : null,
      pakan:  r.feed_kg ? Number(parseFloat(r.feed_kg).toFixed(1)) : null,
      mati:   r.mortality_count || 0,
    })),
    [records]
  )

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
                />
                <Legend
                  wrapperStyle={{ fontSize: 10, color: '#4B6478', paddingTop: 8 }}
                  formatter={v => ({ berat: 'Berat Avg (kg)', pakan: 'Pakan (kg)', mati: 'Kematian' }[v] ?? v)}
                />
                <Bar    yAxisId="right" dataKey="mati"  fill="#F87171" opacity={0.7} radius={[2, 2, 0, 0]} maxBarSize={18} name="mati" />
                <Line  yAxisId="left"  dataKey="berat" stroke="#A78BFA" strokeWidth={2} dot={{ r: 2, fill: '#7C3AED' }} connectNulls name="berat" />
                <Line  yAxisId="left"  dataKey="pakan" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 2" dot={false} connectNulls name="pakan" />
              </ComposedChart>
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

      {/* ── SECTION D — Analisis Performa ── */}
      <section>
        <h2 className="font-['Sora'] font-extrabold text-[13px] text-slate-100 mb-3">Analisis Performa</h2>
        <div className="flex flex-col gap-2.5">
          {/* FCR Analysis */}
          <AnalysisCard
            icon="📊"
            title={`FCR ${kpi.fcrFinal ? kpi.fcrFinal.toFixed(2) : '—'}`}
            badge={fcrBench}
            desc={fcrBench?.desc ?? 'Data FCR belum tersedia. Lengkapi catatan harian.'}
          />
          {/* IP Analysis */}
          <AnalysisCard
            icon="🏆"
            title={`IP Score ${kpi.ipScore ? Math.round(kpi.ipScore) : '—'}`}
            badge={ipBench}
            desc={ipBench?.desc ?? 'IP Score dihitung setelah FCR dan data panen tersedia.'}
          />
          {/* Profitability */}
          <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-4">
            <p className="font-bold text-[13px] text-slate-100 mb-3">💰 Profitabilitas</p>
            <div className="flex flex-col gap-1.5">
              {expenses.map(e => (
                <CostRow key={e.description} label={e.description ?? e.expense_type} value={formatIDR(e.total_amount)} />
              ))}
              {expenses.length > 0 && <div className="h-px bg-white/[0.06] my-1" />}
              <CostRow label="Total Biaya" value={formatIDR(kpi.totalCost)} bold />
              {kpi.totalRevenue > 0 && (
                <CostRow label="Total Revenue" value={formatIDR(kpi.totalRevenue)} bold valueColor="text-emerald-400" />
              )}
              <div className="h-px bg-white/[0.06] my-1" />
              <CostRow
                label="Net Profit / Loss"
                value={kpi.totalRevenue > 0 || kpi.totalCost > 0 ? formatIDR(kpi.netProfit) : '—'}
                bold large
                valueColor={kpi.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
              />
            </div>
          </div>
        </div>
      </section>

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
