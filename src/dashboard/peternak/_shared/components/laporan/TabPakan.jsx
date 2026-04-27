import React, { useMemo, useState } from 'react'
import { Wheat, BarChart3, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatCard, SectionTitle, BatchSelector, fmtRp, fmtNum } from './shared'

/**
 * Props:
 *   batches       — array dari useBatches()
 *   animals       — array dari useAnimalsByBatches()
 *   feedLogs      — array dari useFeedLogsByBatches()
 *   weightHistory — array dari useBatchWeightHistoryByBatches()
 */
export default function TabPakan({ batches, animals, feedLogs, weightHistory }) {
  const [selectedBatch, setSelectedBatch] = useState('all')
  const batchIds = selectedBatch === 'all' ? batches.map(b => b.id) : [selectedBatch]

  const stats = useMemo(() => {
    const filtered = feedLogs.filter(f => batchIds.includes(f.batch_id))

    const totalKonsumsi   = filtered.reduce((s, f) => s + (parseFloat(f.consumed_kg) || 0), 0)
    const totalHijauan    = filtered.reduce((s, f) => s + (parseFloat(f.hijauan_kg) || 0), 0)
    const totalKonsentrat = filtered.reduce((s, f) => s + (parseFloat(f.konsentrat_kg) || 0), 0)
    const totalBiayaPakan = filtered.reduce((s, f) => s + (parseFloat(f.feed_cost_idr) || 0), 0)
    const hariAda         = new Set(filtered.map(f => f.log_date)).size
    const avgPerHari      = hariAda > 0 ? totalKonsumsi / hariAda : 0

    // FCR: total pakan dikonsumsi / total kenaikan bobot
    const filteredAnimals = animals.filter(a => batchIds.includes(a.batch_id))
    let totalGainKg = 0
    for (const a of filteredAnimals) {
      const recs = weightHistory
        .filter(w => w.animal_id === a.id)
        .sort((x, y) => x.weigh_date.localeCompare(y.weigh_date))
      if (recs.length >= 2) {
        const gain = recs[recs.length - 1].weight_kg - recs[0].weight_kg
        if (gain > 0) totalGainKg += gain
      } else if (a.latest_weight_kg && a.entry_weight_kg) {
        const gain = a.latest_weight_kg - a.entry_weight_kg
        if (gain > 0) totalGainKg += gain
      }
    }

    const fcr            = totalGainKg > 0 ? totalKonsumsi / totalGainKg : null
    const biayaPerKgGain = totalGainKg > 0 && totalBiayaPakan > 0 ? totalBiayaPakan / totalGainKg : null

    const sisCounts = { habis: 0, sedikit: 0, banyak: 0 }
    filtered.forEach(f => {
      const k = f.feed_orts_category
      if (k && sisCounts[k] !== undefined) sisCounts[k]++
    })

    return {
      totalKonsumsi, totalHijauan, totalKonsentrat, totalBiayaPakan,
      avgPerHari, fcr, totalGainKg, biayaPerKgGain,
      sisCounts, totalLogs: filtered.length,
    }
  }, [batchIds, feedLogs, animals, weightHistory])

  return (
    <div className="space-y-6">
      <BatchSelector batches={batches} activeBatchId={selectedBatch} onChange={setSelectedBatch} />

      {/* FCR hero */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-[28px] p-6">
        <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] mb-1">Feed Conversion Ratio</p>
        <p className={cn(
          'text-5xl font-black font-["Sora"] tracking-tighter mb-2',
          stats.fcr == null  ? 'text-[#4B6478]' :
          stats.fcr <= 6     ? 'text-emerald-400' :
          stats.fcr <= 10    ? 'text-amber-400' : 'text-rose-400',
        )}>
          {stats.fcr != null ? fmtNum(stats.fcr) : '—'}
        </p>
        <p className="text-[11px] text-[#4B6478] font-medium">
          {stats.fcr != null
            ? `${fmtNum(stats.totalKonsumsi)} kg pakan → ${fmtNum(stats.totalGainKg)} kg pertambahan bobot`
            : 'Perlu data timbang untuk hitung FCR'}
        </p>
        <div className="mt-3 flex gap-2 flex-wrap">
          {[
            { range: '≤6',  label: 'Sangat Baik', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
            { range: '7–10', label: 'Normal',     color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
            { range: '>10', label: 'Boros',        color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
          ].map(x => (
            <span key={x.range} className={cn('text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider', x.color)}>
              FCR {x.range} = {x.label}
            </span>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Konsumsi" value={`${fmtNum(stats.totalKonsumsi)} kg`} sub={`${stats.totalLogs} catatan`} icon={Wheat}       color="text-green-400" bg="bg-green-500/10" border="border-green-500/20" />
        <StatCard label="Rata-rata/Hari" value={`${fmtNum(stats.avgPerHari)} kg`}    sub="Hari ada catatan"             icon={BarChart3}    color="text-blue-400" />
        <StatCard label="Total Hijauan"  value={`${fmtNum(stats.totalHijauan)} kg`}                                     icon={Wheat}        color="text-emerald-400" />
        <StatCard label="Total Konsentrat" value={`${fmtNum(stats.totalKonsentrat)} kg`}                                icon={FlaskConical} color="text-amber-400" />
      </div>

      {/* Biaya pakan */}
      {stats.totalBiayaPakan > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-5 space-y-3">
          <SectionTitle>Biaya Pakan</SectionTitle>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Total Biaya Pakan</span>
            <span className="text-sm font-black text-white">{fmtRp(stats.totalBiayaPakan)}</span>
          </div>
          {stats.biayaPerKgGain && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Biaya per kg Pertambahan</span>
              <span className="text-sm font-black text-amber-400">{fmtRp(stats.biayaPerKgGain)}/kg</span>
            </div>
          )}
        </div>
      )}

      {/* Distribusi sisa pakan */}
      {stats.totalLogs > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-5">
          <SectionTitle>Distribusi Sisa Pakan</SectionTitle>
          <div className="space-y-3">
            {[
              { key: 'habis',   label: '👍 Habis',   color: 'bg-emerald-500' },
              { key: 'sedikit', label: '🟡 Sedikit', color: 'bg-amber-500' },
              { key: 'banyak',  label: '🔴 Banyak',  color: 'bg-rose-500' },
            ].map(({ key, label, color }) => {
              const count = stats.sisCounts[key] || 0
              const pct   = stats.totalLogs > 0 ? (count / stats.totalLogs) * 100 : 0
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-300">{label}</span>
                    <span className="text-[11px] font-black text-white">{count}x · {fmtNum(pct, 0)}%</span>
                  </div>
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-[#4B6478] mt-3">
            Target: &gt;70% catatan "Habis" menunjukkan takaran pakan sudah optimal.
          </p>
        </div>
      )}

      {stats.totalLogs === 0 && (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-[32px]">
          <Wheat size={32} className="mx-auto text-white/5 mb-3" />
          <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Belum ada data pakan</p>
        </div>
      )}
    </div>
  )
}
