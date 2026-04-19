import React, { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  useKambingBatches, useKambingAnimals, useKambingFeedLogs, useKambingSales,
  calcHariDiFarm, calcADG, calcFCRKambing, calcMortalitasKambing,
  calcBEP, calcRCRatio,
} from '@/lib/hooks/useKambingPenggemukanData'
import { formatIDRShort } from '@/lib/format'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function KPIBadge({ value, target, mode = 'gte', label }) {
  // mode 'gte': value >= target = hijau; 'lte': value <= target = hijau
  const good = mode === 'gte' ? value >= target : value <= target
  const cls = !value
    ? 'text-[#4B6478] bg-white/5 border-white/10'
    : good
      ? 'text-green-400 bg-green-500/10 border-green-500/20'
      : 'text-red-400 bg-red-500/10 border-red-500/20'
  const Icon = !value ? Minus : good ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  )
}

function SummaryCard({ label, value, sub, badge }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <p className="text-[10px] font-semibold text-[#4B6478] uppercase tracking-widest mb-1">{label}</p>
      <p className="font-['Sora'] font-black text-xl text-white leading-none mb-1">{value ?? '—'}</p>
      {sub && <p className="text-[10px] text-[#4B6478] mb-1">{sub}</p>}
      {badge}
    </div>
  )
}

// Custom Recharts tooltip
function WeightTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0C1319] border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-[#4B6478] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value} {p.name === 'ADG' ? 'g/hr' : 'kg'}
        </p>
      ))}
    </div>
  )
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function KdPenggemukanLaporan() {
  const { data: batches = [], isLoading: loadingBatches } = useKambingBatches()
  const [selectedBatch, setSelectedBatch] = useState('')

  const batch = batches.find(b => b.id === selectedBatch)

  const { data: animals = [],  isLoading: loadingAnimals  } = useKambingAnimals(selectedBatch)
  const { data: feedLogs = [], isLoading: loadingFeed     } = useKambingFeedLogs(selectedBatch)
  const { data: sales = [],    isLoading: loadingSales    } = useKambingSales(selectedBatch)

  const isLoading = loadingAnimals || loadingFeed || loadingSales

  // â”€â”€ Computed KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const kpi = useMemo(() => {
    if (!batch || !animals.length) return null

    const hari = calcHariDiFarm(batch.start_date, batch.end_date)

    // Bobot rata-rata masuk & keluar
    const avgEntryW = animals.reduce((s, a) => s + parseFloat(a.entry_weight_kg || 0), 0) / animals.length
    const soldAnimals = animals.filter(a => a.status === 'sold' && a.latest_weight_kg)
    const avgExitW = soldAnimals.length
      ? soldAnimals.reduce((s, a) => s + parseFloat(a.latest_weight_kg), 0) / soldAnimals.length
      : null

    // ADG rata-rata
    const adgList = animals
      .filter(a => a.latest_weight_kg && a.latest_weight_date)
      .map(a => {
        const h = calcHariDiFarm(a.entry_date, a.exit_date ?? a.latest_weight_date)
        return h > 0 ? calcADG(a.entry_weight_kg, a.latest_weight_kg, h) : null
      })
      .filter(Boolean)
    const avgADG = adgList.length
      ? Math.round(adgList.reduce((s, v) => s + v, 0) / adgList.length)
      : null

    // Total PBBH (kg) untuk FCR
    const totalPBBH = animals.reduce((s, a) => {
      if (!a.latest_weight_kg) return s
      return s + Math.max(0, parseFloat(a.latest_weight_kg) - parseFloat(a.entry_weight_kg))
    }, 0)

    // Total pakan dikonsumsi (kg BK)
    const totalPakan = feedLogs.reduce((s, l) => s + (parseFloat(l.consumed_kg) || 0), 0)
    const fcr = calcFCRKambing(totalPakan, totalPBBH)

    // Mortalitas
    const mortalitasPct = calcMortalitasKambing(batch.mortality_count, batch.total_animals)

    // Keuangan
    const totalRevenue  = sales.reduce((s, t) => s + (t.total_revenue_idr || 0), 0)
    const totalCOGS     = animals.reduce((s, a) => s + (a.purchase_price_idr || 0), 0)
    const totalFeedCost = feedLogs.reduce((s, l) => s + (l.feed_cost_idr || 0), 0)
    const totalBiaya    = totalCOGS + totalFeedCost
    const netProfit     = totalRevenue - totalBiaya
    const rcRatio       = calcRCRatio(totalRevenue, totalBiaya)

    // BEP harga jual per kg (pakai bobot rata-rata jual)
    const bep = avgExitW && totalBiaya
      ? calcBEP(totalBiaya / Math.max(1, animals.length), avgExitW)
      : null

    return {
      hari, avgEntryW: avgEntryW.toFixed(1), avgExitW: avgExitW?.toFixed(1) ?? null,
      avgADG, totalPBBH: totalPBBH.toFixed(1), totalPakan: totalPakan.toFixed(0),
      fcr: fcr || null,
      mortalitasPct,
      totalRevenue, totalCOGS, totalFeedCost, totalBiaya, netProfit, rcRatio,
      bep,
      totalAnimals: animals.length,
      soldCount: animals.filter(a => a.status === 'sold').length,
      deadCount: batch.mortality_count,
    }
  }, [batch, animals, feedLogs, sales])

  // â”€â”€ Grafik bobot — rata-rata per tanggal timbang â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const chartData = useMemo(() => {
    if (!animals.length) return []

    // Kumpulkan semua weight records dari semua ekor
    const byDate = {}
    animals.forEach(a => {
      const records = a.kd_penggemukan_weight_records ?? []
      records.forEach(r => {
        if (!r.weigh_date || r.is_deleted) return
        if (!byDate[r.weigh_date]) byDate[r.weigh_date] = []
        byDate[r.weigh_date].push(parseFloat(r.weight_kg))
      })
      // tambah entry_date sebagai titik awal
      if (!byDate[a.entry_date]) byDate[a.entry_date] = []
      byDate[a.entry_date].push(parseFloat(a.entry_weight_kg))
    })

    return Object.entries(byDate)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, weights]) => {
        const avgW = weights.reduce((s, w) => s + w, 0) / weights.length
        const hariKe = calcHariDiFarm(batch?.start_date, date)
        // ADG rata-rata batch sampai titik ini
        const adg = kpi?.avgEntryW && hariKe > 0
          ? calcADG(parseFloat(kpi.avgEntryW), avgW, hariKe)
          : null
        return {
          label: `H-${hariKe}`,
          'Bobot Rata-rata': parseFloat(avgW.toFixed(2)),
          ...(adg ? { ADG: adg } : {}),
        }
      })
  }, [animals, batch, kpi])

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (loadingBatches) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">

      {/* Header */}
      <header className="px-4 pt-6 pb-4 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <h1 className="font-['Sora'] font-black text-xl text-white mb-0.5">Laporan Batch</h1>
        <p className="text-xs text-[#4B6478]">Analisis performa & keuangan per batch penggemukan</p>
      </header>

      {/* Pilih Batch */}
      <div className="px-4 mt-4">
        <div className="relative">
          <select
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
            className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none"
          >
            <option value="">-- Pilih batch untuk melihat laporan --</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.batch_code} — {b.kandang_name} ({b.status === 'active' ? 'Aktif' : 'Selesai'})
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
        </div>
      </div>

      {!selectedBatch && (
        <div className="text-center py-16 px-8">
          <p className="text-4xl mb-4">ðŸ“Š</p>
          <p className="text-sm font-semibold text-white mb-2">Pilih Batch</p>
          <p className="text-xs text-[#4B6478]">Pilih batch di atas untuk melihat laporan performa dan keuangan</p>
        </div>
      )}

      {selectedBatch && isLoading && <LoadingSpinner fullPage />}

      {selectedBatch && !isLoading && kpi && (
        <>
          {/* Batch Info */}
          <div className="px-4 mt-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl mx-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-['Sora'] font-bold text-sm text-white">{batch.batch_code}</p>
                <p className="text-[11px] text-[#4B6478]">{batch.kandang_name} · {fmt(batch.start_date)} — {fmt(batch.end_date ?? new Date().toISOString().split('T')[0])}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-white font-['Sora']">{kpi.hari} hari</p>
                <p className="text-[10px] text-[#4B6478]">{kpi.totalAnimals} ekor masuk</p>
              </div>
            </div>
          </div>

          {/* â”€â”€ KPI Pertumbuhan â”€â”€ */}
          <section className="px-4 mt-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">Performa Pertumbuhan</p>
            <div className="grid grid-cols-2 gap-2.5">
              <SummaryCard
                label="ADG Rata-rata"
                value={kpi.avgADG ? `${kpi.avgADG} g/hr` : '—'}
                sub="Target ≥ 150 g/hari"
                badge={kpi.avgADG && <KPIBadge value={kpi.avgADG} target={150} mode="gte" label={kpi.avgADG >= 150 ? 'On Target' : 'Di bawah target'} />}
              />
              <SummaryCard
                label="FCR"
                value={kpi.fcr?.toFixed(2) ?? '—'}
                sub="Target ≤ 8"
                badge={kpi.fcr && <KPIBadge value={kpi.fcr} target={8} mode="lte" label={kpi.fcr <= 8 ? 'On Target' : 'Di atas target'} />}
              />
              <SummaryCard
                label="Bobot Masuk Rata-rata"
                value={`${kpi.avgEntryW} kg`}
              />
              <SummaryCard
                label="Bobot Jual Rata-rata"
                value={kpi.avgExitW ? `${kpi.avgExitW} kg` : '—'}
                sub="Target ≥ 30 kg"
                badge={kpi.avgExitW && <KPIBadge value={parseFloat(kpi.avgExitW)} target={30} mode="gte" label={parseFloat(kpi.avgExitW) >= 30 ? 'On Target' : 'Belum target'} />}
              />
              <SummaryCard
                label="Total PBBH"
                value={`${kpi.totalPBBH} kg`}
                sub="Total pertambahan bobot"
              />
              <SummaryCard
                label="Total Pakan Dikonsumsi"
                value={`${kpi.totalPakan} kg`}
                sub={`${kpi.hari} hari`}
              />
            </div>
          </section>

          {/* â”€â”€ KPI Mortalitas â”€â”€ */}
          <section className="px-4 mt-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">Mortalitas</p>
            <div className="grid grid-cols-3 gap-2.5">
              <SummaryCard label="Ekor Masuk"  value={kpi.totalAnimals} />
              <SummaryCard label="Terjual"     value={kpi.soldCount} />
              <SummaryCard
                label="Mati"
                value={kpi.deadCount}
                badge={<KPIBadge value={kpi.mortalitasPct} target={3} mode="lte" label={`${kpi.mortalitasPct}%`} />}
              />
            </div>
          </section>

          {/* â”€â”€ Grafik Bobot â”€â”€ */}
          {chartData.length > 1 && (
            <section className="px-4 mt-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">Grafik Bobot Rata-rata Batch</p>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={{ fill: '#4B6478', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#4B6478', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<WeightTooltip />} />
                    <ReferenceLine y={30} stroke="rgba(22,163,74,0.3)" strokeDasharray="4 4" label={{ value: 'Target 30kg', fill: '#16A34A', fontSize: 9 }} />
                    <Line
                      type="monotone"
                      dataKey="Bobot Rata-rata"
                      stroke="#22C55E"
                      strokeWidth={2}
                      dot={{ fill: '#22C55E', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* â”€â”€ Keuangan â”€â”€ */}
          <section className="px-4 mt-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">Keuangan Batch</p>
            <div className="space-y-2">

              {/* Revenue vs Biaya */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-semibold text-[#4B6478]">Total Pendapatan</p>
                  <p className="font-['Sora'] font-black text-base text-green-400">
                    {kpi.totalRevenue ? formatIDRShort(kpi.totalRevenue) : '—'}
                  </p>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-semibold text-[#4B6478]">Harga Beli Ternak</p>
                  <p className="text-sm font-bold text-white">
                    {kpi.totalCOGS ? formatIDRShort(kpi.totalCOGS) : '—'}
                  </p>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-semibold text-[#4B6478]">Biaya Pakan</p>
                  <p className="text-sm font-bold text-white">
                    {kpi.totalFeedCost ? formatIDRShort(kpi.totalFeedCost) : '—'}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-white/[0.06]">
                  <p className="text-xs font-semibold text-[#4B6478]">Total Biaya</p>
                  <p className="text-sm font-bold text-red-400">
                    {kpi.totalBiaya ? formatIDRShort(kpi.totalBiaya) : '—'}
                  </p>
                </div>
              </div>

              {/* Laba + R/C */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className={`border rounded-2xl p-4 ${kpi.netProfit >= 0 ? 'bg-green-500/5 border-green-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                  <p className="text-[10px] font-semibold text-[#4B6478] uppercase tracking-widest mb-1">Laba Bersih</p>
                  <p className={`font-['Sora'] font-black text-lg leading-none ${kpi.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {kpi.netProfit ? (kpi.netProfit >= 0 ? '+' : '') + formatIDRShort(kpi.netProfit) : '—'}
                  </p>
                </div>
                <div className={`border rounded-2xl p-4 ${kpi.rcRatio >= 1.2 ? 'bg-green-500/5 border-green-500/15' : kpi.rcRatio >= 1 ? 'bg-amber-500/5 border-amber-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
                  <p className="text-[10px] font-semibold text-[#4B6478] uppercase tracking-widest mb-1">R/C Ratio</p>
                  <p className={`font-['Sora'] font-black text-lg leading-none ${kpi.rcRatio >= 1.2 ? 'text-green-400' : kpi.rcRatio >= 1 ? 'text-amber-400' : 'text-red-400'}`}>
                    {kpi.rcRatio ? kpi.rcRatio.toFixed(2) : '—'}
                  </p>
                  <p className="text-[9px] text-[#4B6478] mt-0.5">Target ≥ 1.2</p>
                </div>
              </div>

              {/* BEP */}
              {kpi.bep && (
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-[#4B6478]">BEP Harga Jual Minimum</p>
                    <p className="text-[10px] text-[#4B6478] mt-0.5">Per kg hidup untuk balik modal</p>
                  </div>
                  <p className="font-['Sora'] font-black text-base text-amber-400">
                    Rp {kpi.bep.toLocaleString('id-ID')}/kg
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* â”€â”€ Ringkasan KPI vs Target â”€â”€ */}
          <section className="px-4 mt-5 mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">KPI vs Target</p>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden">
              {[
                { label: 'ADG',            value: kpi.avgADG ? `${kpi.avgADG} g/hr` : '—', target: '≥ 150 g/hr', ok: kpi.avgADG >= 150 },
                { label: 'Bobot Jual',     value: kpi.avgExitW ? `${kpi.avgExitW} kg` : '—', target: '≥ 30 kg',    ok: parseFloat(kpi.avgExitW) >= 30 },
                { label: 'FCR',            value: kpi.fcr?.toFixed(2) ?? '—',   target: '≤ 8',        ok: kpi.fcr && kpi.fcr <= 8 },
                { label: 'Mortalitas',     value: `${kpi.mortalitasPct}%`,       target: '≤ 3%',       ok: kpi.mortalitasPct <= 3 },
                { label: 'R/C Ratio',      value: kpi.rcRatio?.toFixed(2) ?? '—', target: '≥ 1.2',    ok: kpi.rcRatio >= 1.2 },
                { label: 'Lama Gemuk',     value: `${kpi.hari} hari`,            target: '60–90 hari', ok: kpi.hari >= 60 && kpi.hari <= 90 },
              ].map((row, i) => (
                <div key={i} className={`flex items-center justify-between px-4 py-3 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <p className="text-xs font-semibold text-[#94A3B8]">{row.label}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] text-[#4B6478]">{row.target}</p>
                    <p className={`text-xs font-bold min-w-[60px] text-right ${row.ok === true ? 'text-green-400' : row.ok === false ? 'text-red-400' : 'text-[#4B6478]'}`}>
                      {row.value}
                    </p>
                    <span className="text-base">{row.ok === true ? 'âœ…' : row.ok === false ? 'âŒ' : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {selectedBatch && !isLoading && !kpi && (
        <div className="text-center py-16 px-8">
          <p className="text-4xl mb-4">ðŸ</p>
          <p className="text-sm font-semibold text-white mb-2">Data belum cukup</p>
          <p className="text-xs text-[#4B6478]">Tambahkan ternak, log pakan, dan data timbang untuk melihat laporan</p>
        </div>
      )}

    </div>
  )
}