import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getADGTier } from './constants'

/**
 * Stats pill bar above the kandang grid.
 * In all-batch mode also shows a per-batch breakdown.
 *
 * @param {object}  props.speciesConfig   - { targetHari, weightRecordsKey, calcADG, calcHari, adgThresholds }
 * @param {array}   props.animals
 * @param {number}  props.holdingCount
 * @param {array}   props.batches
 * @param {object}  props.batchColorMap   - { [batchId]: palette+batch_code }
 * @param {boolean} props.isAllBatches
 */
export default function BatchSummaryBar({ speciesConfig, animals, holdingCount, batches, batchColorMap, isAllBatches }) {
  const { targetHari, weightRecordsKey, calcADG, calcHari, adgThresholds } = speciesConfig

  const stats = useMemo(() => {
    const active    = animals.filter(a => a.status === 'active')
    const allocated = active.length - holdingCount
    const adgList   = active.map(a => {
      const records = a[weightRecordsKey] ?? []
      const adg     = calcADG(records, a.entry_date, a.entry_weight_kg)
      return adg ? adg / 1000 : null
    }).filter(v => v !== null)
    const avgADG  = adgList.length ? adgList.reduce((s, v) => s + v, 0) / adgList.length : null
    const avgDays = active.length ? Math.round(active.reduce((s, a) => s + calcHari(a.entry_date), 0) / active.length) : 0
    return { total: active.length, allocated, holding: holdingCount, avgADG, avgDays }
  }, [animals, holdingCount, weightRecordsKey, calcADG, calcHari])

  const adgTier = getADGTier(stats.avgADG, adgThresholds)

  const pills = [
    { label: 'Total Aktif', value: `${stats.total} ekor`,     color: 'text-white',           bg: 'bg-white/[0.03] border-white/[0.06]' },
    { label: 'Teralokasi',  value: `${stats.allocated} ekor`, color: 'text-emerald-400',     bg: 'bg-emerald-500/[0.06] border-emerald-500/20' },
    { label: 'Holding',     value: `${stats.holding} ekor`,   color: stats.holding > 0 ? 'text-amber-300' : 'text-[#4B6478]', bg: 'bg-white/[0.03] border-white/[0.06]' },
    { label: 'Avg ADG',     value: stats.avgADG ? `${stats.avgADG.toFixed(2)} kg/hr` : '—', color: adgTier.color, bg: 'bg-white/[0.03] border-white/[0.06]' },
    { label: 'Avg Hari',    value: `${stats.avgDays} hr`,     color: stats.avgDays >= targetHari ? 'text-red-400' : 'text-white', bg: 'bg-white/[0.03] border-white/[0.06]' },
  ]

  const batchBreakdown = useMemo(() => {
    if (!isAllBatches || !batches?.length) return null
    return batches.map(b => ({
      batch: b,
      count: animals.filter(a => a.batch_id === b.id && a.status === 'active').length,
    })).filter(x => x.count > 0)
  }, [isAllBatches, batches, animals])

  return (
    <div className="flex items-center gap-2 flex-wrap mb-6">
      {pills.map(p => (
        <div key={p.label} className={cn('flex items-center gap-2 px-3.5 py-2 rounded-2xl border', p.bg)}>
          <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider">{p.label}</span>
          <span className={cn('text-[11px] font-black', p.color)}>{p.value}</span>
        </div>
      ))}
      {batchBreakdown?.length > 0 && (
        <>
          <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />
          {batchBreakdown.map(({ batch, count }) => {
            const bc = batchColorMap?.[batch.id]
            return (
              <div
                key={batch.id}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-white/10"
                style={bc ? { background: bc.bg, borderColor: bc.border } : {}}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={bc ? { background: bc.dotColor } : {}} />
                <span className="text-[9px] font-black uppercase tracking-wider" style={bc ? { color: bc.text } : {}}>{batch.batch_code}</span>
                <span className="text-[11px] font-black text-white">{count} ekor</span>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
