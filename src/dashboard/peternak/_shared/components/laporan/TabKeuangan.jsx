import React, { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatCard, SectionTitle, BatchSelector, PLRow, fmtRp, fmtNum } from './shared'

/**
 * Props:
 *   batches    — array dari useBatches()
 *   animals    — array dari useAnimalsByBatches()
 *   sales      — array dari useSalesByBatches()
 *   feedLogs   — array dari useFeedLogsByBatches()
 *   opCosts    — array dari useOperationalCostsByBatches()
 *   healthLogs — array dari useHealthLogsByBatches()
 */
export default function TabKeuangan({ batches, animals, sales, feedLogs, opCosts, healthLogs = [] }) {
  const [selectedBatch, setSelectedBatch] = useState('all')

  const activeBatches = selectedBatch === 'all' ? batches : batches.filter(b => b.id === selectedBatch)
  const batchIds      = activeBatches.map(b => b.id)

  const pl = useMemo(() => {
    const filteredSales   = sales.filter(s => batchIds.includes(s.batch_id))
    const filteredFeed    = feedLogs.filter(f => batchIds.includes(f.batch_id))
    const filteredOp      = opCosts.filter(o => batchIds.includes(o.batch_id))
    const filteredHealth  = healthLogs.filter(h => batchIds.includes(h.batch_id))
    const filteredAnimals = animals.filter(a => batchIds.includes(a.batch_id))

    // Revenue tracking (cash flow vs accrual)
    const revenue    = filteredSales.reduce((s, x) => s + (parseFloat(x.total_revenue_idr) || 0), 0)
    const revenueLunas = filteredSales.filter(x => x.is_paid).reduce((s, x) => s + (parseFloat(x.total_revenue_idr) || 0), 0)
    const hutang = revenue - revenueLunas

    // Cost tracking
    const biayaPakan = filteredFeed.reduce((s, x) => s + (parseFloat(x.feed_cost_idr) || 0), 0)
    
    const gajiCosts = filteredOp.filter(c => c.category === 'gaji')
    const nonGajiCosts = filteredOp.filter(c => c.category !== 'gaji')
    const biayaGaji = gajiCosts.reduce((s, x) => s + (parseFloat(x.amount_idr) || parseFloat(x.cost_idr) || 0), 0)
    const biayaOpLain = nonGajiCosts.reduce((s, x) => s + (parseFloat(x.amount_idr) || parseFloat(x.cost_idr) || 0), 0)
    
    const biayaKesehatan = filteredHealth.reduce((s, x) => s + (parseFloat(x.treatment_cost_idr) || 0), 0)
    const biayaBeli  = filteredAnimals.reduce((s, a) => s + (parseFloat(a.purchase_price_idr) || 0), 0)
    
    const totalBiaya = biayaBeli + biayaPakan + biayaOpLain + biayaGaji + biayaKesehatan
    const netProfit  = revenue - totalBiaya
    const netProfitKas = revenueLunas - totalBiaya // Cash flow reality
    
    const margin     = revenue > 0 ? (netProfit / revenue) * 100 : 0

    // Feed volume tracking for warnings
    const kgConsumed = filteredFeed.reduce((s, f) => {
      if (f.consumed_kg != null && f.consumed_kg > 0) return s + f.consumed_kg
      const input = (f.hijauan_kg || 0) + (f.konsentrat_kg || 0) + (f.dedak_kg || 0) + (f.other_feed_kg || 0)
      return s + Math.max(0, input - (f.sisa_pakan_kg || 0))
    }, 0)

    const warnPakanTanpaBiaya = kgConsumed > 0 && biayaPakan === 0
    const ternakTanpaHarga = filteredAnimals.filter(a => !a.purchase_price_idr || Number(a.purchase_price_idr) === 0).length

    const ekorTerjual   = filteredSales.reduce((s, x) => s + (parseInt(x.animal_count) || 0), 0)
    const profitPerEkor = ekorTerjual > 0 ? netProfit / ekorTerjual : null

    const perBatch = batches.map(b => {
      const bSales   = sales.filter(s => s.batch_id === b.id)
      const bFeed    = feedLogs.filter(f => f.batch_id === b.id)
      const bOp      = opCosts.filter(o => o.batch_id === b.id)
      const bHealth  = healthLogs.filter(h => h.batch_id === b.id)
      const bAnimals = animals.filter(a => a.batch_id === b.id)
      
      const rev   = bSales.reduce((s, x) => s + (parseFloat(x.total_revenue_idr) || 0), 0)
      const beli  = bAnimals.reduce((s, a) => s + (parseFloat(a.purchase_price_idr) || 0), 0)
      const pakan = bFeed.reduce((s, x) => s + (parseFloat(x.feed_cost_idr) || 0), 0)
      const op    = bOp.reduce((s, x) => s + (parseFloat(x.amount_idr) || parseFloat(x.cost_idr) || 0), 0)
      const kes   = bHealth.reduce((s, x) => s + (parseFloat(x.treatment_cost_idr) || 0), 0)
      
      const net   = rev - beli - pakan - op - kes
      const ekor  = bSales.reduce((s, x) => s + (parseInt(x.animal_count) || 0), 0)
      return { ...b, rev, beli, pakan, op, kes, net, ekor }
    })

    return { 
      revenue, revenueLunas, hutang,
      biayaBeli, biayaPakan, biayaOpLain, biayaGaji, biayaKesehatan, totalBiaya, 
      netProfit, netProfitKas, margin, profitPerEkor, ekorTerjual, perBatch,
      warnPakanTanpaBiaya, ternakTanpaHarga, kgConsumed
    }
  }, [batches, batchIds, sales, feedLogs, opCosts, animals, healthLogs])

  return (
    <div className="space-y-6">
      <BatchSelector batches={batches} activeBatchId={selectedBatch} onChange={setSelectedBatch} />

      {/* Net profit hero */}
      <div className={cn(
        'rounded-[28px] p-6 relative overflow-hidden shadow-xl',
        pl.netProfit >= 0
          ? 'bg-gradient-to-br from-emerald-700 to-green-800 shadow-green-900/30'
          : 'bg-gradient-to-br from-rose-700 to-rose-900 shadow-rose-900/30',
      )}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          {pl.netProfit >= 0 ? <TrendingUp size={80} /> : <TrendingDown size={80} />}
        </div>
        <div className="relative z-10 text-white">
          <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.2em] mb-1">Net Profit / Rugi</p>
          <p className="text-3xl font-black font-['Sora'] mb-3 tracking-tight">{fmtRp(Math.abs(pl.netProfit))}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <p className="text-[9px] text-white/60 font-bold uppercase mb-0.5">Margin</p>
              <p className="text-xs font-black">{fmtNum(pl.margin)}%</p>
            </div>
            {pl.profitPerEkor != null && (
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <p className="text-[9px] text-white/60 font-bold uppercase mb-0.5">Per Ekor</p>
                <p className="text-xs font-black">{fmtRp(pl.profitPerEkor)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {pl.warnPakanTanpaBiaya && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-[20px] p-4 flex gap-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <span className="font-bold text-amber-300">Biaya pakan belum tercatat!</span> Ada {pl.kgConsumed.toFixed(1)} kg pakan yang dimakan tanpa harga. HPP dan Profit sangat berpotensi tidak akurat.
          </p>
        </div>
      )}

      {pl.ternakTanpaHarga > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-[20px] p-4 flex gap-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <span className="font-bold text-amber-300">{pl.ternakTanpaHarga} ekor ternak belum punya harga beli!</span> Profit terlihat tinggi namun palsu (understated HPP).
          </p>
        </div>
      )}

      {pl.hutang > 0 && (
        <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-[20px] p-4">
          <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-2">Realita Kas (Cash Flow)</p>
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-[9px] text-[#4B6478] uppercase font-bold">Piutang (Belum Lunas)</p>
              <p className="text-sm font-black text-white">{fmtRp(pl.hutang)}</p>
            </div>
            <div className="flex-1 border-l border-white/10 pl-4">
              <p className="text-[9px] text-[#4B6478] uppercase font-bold">Laba Kas Aktual</p>
              <p className={cn('text-sm font-black', pl.netProfitKas >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {pl.netProfitKas < 0 ? '−' : ''}{fmtRp(Math.abs(pl.netProfitKas))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* P&L breakdown */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-5">
        <SectionTitle>Rincian Pendapatan & Biaya</SectionTitle>

        <PLRow label="Pendapatan Penjualan Ternak" value={fmtRp(pl.revenue)} isPositive />
        <PLRow
          label={`  ${pl.ekorTerjual} ekor terjual`}
          value={pl.ekorTerjual > 0 ? `${fmtRp(pl.revenue / pl.ekorTerjual)}/ekor` : '—'}
          indent
          isPositive
        />

        <div className="mt-2">
          <PLRow label="Biaya Pembelian Ternak" value={`− ${fmtRp(pl.biayaBeli)}`} />
          <PLRow label="Biaya Pakan"            value={`− ${fmtRp(pl.biayaPakan)}`} />
          <PLRow label="Biaya Operasional Lain" value={`− ${fmtRp(pl.biayaOpLain)}`} />
          {pl.biayaGaji > 0 && <PLRow label="Biaya Gaji (Pekerja Kandang)" value={`− ${fmtRp(pl.biayaGaji)}`} />}
          {pl.biayaKesehatan > 0 && <PLRow label="Biaya Kesehatan & Vitamin" value={`− ${fmtRp(pl.biayaKesehatan)}`} />}
          <PLRow label="Total Biaya"            value={`− ${fmtRp(pl.totalBiaya)}`} isTotal />
        </div>

        <div className="border-t-2 border-white/10 mt-1 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-white uppercase tracking-wider">Net Profit</span>
            <span className={cn('text-lg font-black font-["Sora"]', pl.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {pl.netProfit < 0 ? '−' : ''}{fmtRp(Math.abs(pl.netProfit))}
            </span>
          </div>
        </div>
      </div>

      {/* Per-batch breakdown */}
      {pl.perBatch.length > 1 && (
        <div>
          <SectionTitle>Breakdown per Batch</SectionTitle>
          <div className="space-y-2">
            {pl.perBatch.map(b => (
              <div key={b.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{b.batch_code}</p>
                    <p className="text-[10px] text-[#4B6478] font-bold">{b.total_animals} ekor · {b.status}</p>
                  </div>
                  <span className={cn('text-sm font-black font-["Sora"]', b.net >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {b.net < 0 ? '−' : ''}{fmtRp(Math.abs(b.net))}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Revenue', val: fmtRp(b.rev),   color: 'text-green-400' },
                    { label: 'Beli',    val: fmtRp(b.beli),  color: 'text-slate-400' },
                    { label: 'Pakan',   val: fmtRp(b.pakan), color: 'text-amber-400' },
                    { label: 'Ops/Kes', val: fmtRp(b.op + b.kes), color: 'text-violet-400' },
                  ].map(x => (
                    <div key={x.label} className="bg-white/[0.03] rounded-xl p-2 text-center border border-white/[0.04]">
                      <p className="text-[9px] text-[#4B6478] uppercase tracking-widest truncate">{x.label}</p>
                      <p className={cn('text-[10px] font-black mt-0.5 truncate', x.color)}>{x.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
