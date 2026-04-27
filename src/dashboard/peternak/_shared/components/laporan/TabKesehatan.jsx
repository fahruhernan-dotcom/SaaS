import React, { useMemo, useState } from 'react'
import { HeartPulse, AlertCircle, ClipboardList, Scale, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatCard, SectionTitle, BatchSelector, fmtNum } from './shared'

/**
 * Props:
 *   batches            — array dari useBatches()
 *   healthLogs         — array dari useHealthLogsByBatches()
 *   mortalitasBenchmark — string, default "≤3%" — tampil di info card bawah
 */
export default function TabKesehatan({ batches, healthLogs, mortalitasBenchmark = '≤3%' }) {
  const [selectedBatch, setSelectedBatch] = useState('all')
  const batchIds = selectedBatch === 'all' ? batches.map(b => b.id) : [selectedBatch]

  const stats = useMemo(() => {
    const filtered = healthLogs.filter(l => batchIds.includes(l.batch_id))

    const kematian  = filtered.filter(l => l.log_type === 'kematian')
    const sakit     = filtered.filter(l => ['medis', 'sakit'].includes(l.log_type))
    const vaksinasi = filtered.filter(l => l.log_type === 'vaksinasi')
    const insiden   = filtered.filter(l => ['insiden', 'insiden_pakan', 'insiden_kandang'].includes(l.log_type))

    const totalAnimals   = batches.filter(b => batchIds.includes(b.id)).reduce((s, b) => s + (b.total_animals || 0), 0)
    const mortalitasRate = totalAnimals > 0 ? (kematian.length / totalAnimals) * 100 : 0

    // Diagnosa terbanyak
    const diagMap = {}
    sakit.forEach(l => {
      const d = l.diagnosis || 'Tidak tercatat'
      diagMap[d] = (diagMap[d] || 0) + 1
    })
    const topDiagnosis = Object.entries(diagMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

    const perBatch = batches
      .filter(b => batchIds.includes(b.id))
      .map(b => {
        const bl        = healthLogs.filter(l => l.batch_id === b.id)
        const mati      = bl.filter(l => l.log_type === 'kematian').length
        const sakitCount= bl.filter(l => ['medis', 'sakit'].includes(l.log_type)).length
        const mortalitas= b.total_animals > 0 ? (mati / b.total_animals) * 100 : 0
        return { ...b, mati, sakitCount, mortalitas }
      })

    return { kematian, sakit, vaksinasi, insiden, mortalitasRate, totalAnimals, topDiagnosis, perBatch, total: filtered.length }
  }, [batchIds, batches, healthLogs])

  return (
    <div className="space-y-6">
      <BatchSelector batches={batches} activeBatchId={selectedBatch} onChange={setSelectedBatch} />

      {/* Mortalitas hero */}
      <div className={cn(
        'rounded-[28px] p-6 relative overflow-hidden',
        stats.mortalitasRate === 0 ? 'bg-gradient-to-br from-emerald-800 to-green-900' :
        stats.mortalitasRate <= 3  ? 'bg-gradient-to-br from-amber-800 to-amber-900' :
                                     'bg-gradient-to-br from-rose-800 to-rose-900',
      )}>
        <div className="absolute top-0 right-0 p-4 opacity-10"><HeartPulse size={80} /></div>
        <div className="relative z-10 text-white">
          <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.2em] mb-1">Tingkat Mortalitas</p>
          <p className="text-4xl font-black font-['Sora'] mb-3 tracking-tight">{fmtNum(stats.mortalitasRate)}%</p>
          <div className="flex gap-3 flex-wrap">
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <p className="text-[9px] text-white/60 font-bold uppercase mb-0.5">Kematian</p>
              <p className="text-xs font-black">{stats.kematian.length} Ekor</p>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <p className="text-[9px] text-white/60 font-bold uppercase mb-0.5">Total Ternak</p>
              <p className="text-xs font-black">{stats.totalAnimals} Ekor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Incident grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Kasus Sakit" value={stats.sakit.length}     icon={HeartPulse}   color="text-rose-400"   bg="bg-rose-500/10"   border="border-rose-500/20" />
        <StatCard label="Vaksinasi"   value={stats.vaksinasi.length} icon={Scale}        color="text-blue-400"   bg="bg-blue-500/10"   border="border-blue-500/20" />
        <StatCard label="Insiden"     value={stats.insiden.length}   icon={AlertCircle}  color="text-amber-400"  bg="bg-amber-500/10"  border="border-amber-500/20" />
        <StatCard label="Total Log"   value={stats.total}            icon={ClipboardList} color="text-slate-400" />
      </div>

      {/* Diagnosa terbanyak */}
      {stats.topDiagnosis.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-5">
          <SectionTitle>Diagnosa Terbanyak</SectionTitle>
          <div className="space-y-3">
            {stats.topDiagnosis.map(([diag, count], i) => {
              const maxCount = stats.topDiagnosis[0][1]
              const pct      = (count / maxCount) * 100
              return (
                <div key={diag}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-300 truncate flex-1 mr-2">{diag}</span>
                    <span className="text-[11px] font-black text-white shrink-0">{count}x</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-orange-500' : 'bg-amber-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-batch mortalitas */}
      {stats.perBatch.length > 1 && (
        <div>
          <SectionTitle>Mortalitas per Batch</SectionTitle>
          <div className="space-y-2">
            {stats.perBatch.map(b => (
              <div key={b.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-white uppercase">{b.batch_code}</p>
                  <p className="text-[10px] text-[#4B6478]">{b.mati} mati · {b.sakitCount} kasus sakit</p>
                </div>
                <span className={cn(
                  'text-sm font-black font-["Sora"]',
                  b.mortalitas === 0 ? 'text-emerald-400' :
                  b.mortalitas <= 3  ? 'text-amber-400' : 'text-rose-400',
                )}>
                  {fmtNum(b.mortalitas)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benchmark info */}
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-[20px] p-4 flex gap-3">
        <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Target mortalitas yang baik adalah{' '}
          <span className="text-blue-300 font-bold">{mortalitasBenchmark}</span>.
          Di atas itu perlu evaluasi manajemen kesehatan dan sanitasi kandang.
        </p>
      </div>

      {stats.total === 0 && (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-[32px]">
          <HeartPulse size={32} className="mx-auto text-white/5 mb-3" />
          <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Belum ada data kesehatan</p>
        </div>
      )}
    </div>
  )
}
