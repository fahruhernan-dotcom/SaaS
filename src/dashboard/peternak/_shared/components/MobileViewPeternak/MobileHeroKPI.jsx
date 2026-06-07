/**
 * MobileHeroKPI.jsx — Hero population card for mobile beranda
 * Shows total populasi (big number), batch count, harvest projection,
 * and 3-cell metric row (ADG, Mortalitas, Bobot) with inline sparklines.
 */
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Sparkline } from './Sparkline'

// ─── Metric Cell (inside hero card bottom row) ──────────────────────────────
function MetricCell({ label, value, unit, tone, divider, sparkData, sparkColor }) {
  const toneColor = {
    ok: 'text-emerald-600 dark:text-emerald-400',
    warn: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
  }[tone] || 'text-slate-900 dark:text-white'

  return (
    <div className={`py-3 px-3.5 flex flex-col gap-1 ${divider ? 'border-l border-slate-200 dark:border-white/[0.03]' : ''}`}>
      <span className="text-[9px] font-bold text-slate-500 dark:text-[#8DA2B5] uppercase tracking-[0.12em]">{label}</span>
      <div className="flex items-baseline justify-between gap-1">
        <div className="flex items-baseline gap-0.5">
          <span className={`text-lg font-black leading-none tracking-tight tabular-nums ${toneColor}`}>
            {value}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#8DA2B5] font-semibold">{unit}</span>
        </div>
        {sparkData && <Sparkline data={sparkData} color={sparkColor || '#22C55E'} width={42} height={18} />}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function MobileHeroKPI({
  totalEkor,
  activeBatchCount,
  harvestSoonCount,
  avgADG,
  mortalitasPct,
  avgWeight,
  adgSparkData,
  weightSparkData,
  showADG = true,
}) {
  const mortNum = parseFloat(mortalitasPct) || 0
  const mortTone = mortNum > 3 ? 'danger' : mortNum > 1.5 ? 'warn' : 'ok'
  const adgTone = avgADG >= 150 ? 'ok' : avgADG >= 100 ? 'warn' : avgADG ? 'danger' : 'ok'

  const cells = []
  if (showADG) {
    cells.push(
      <MetricCell
        key="adg"
        label="Tumbuh/Hari (ADG)"
        value={avgADG ?? '—'}
        unit="g"
        tone={adgTone}
        sparkData={adgSparkData}
        sparkColor="#22C55E"
      />
    )
  }
  cells.push(
    <MetricCell
      key="monitoring"
      label="Kematian (Mortalitas)"
      value={mortalitasPct}
      unit="%"
      tone={mortTone}
      divider={cells.length > 0}
    />
  )
  cells.push(
    <MetricCell
      key="weight"
      label="Bobot rata²"
      value={avgWeight ?? '—'}
      unit="kg"
      divider={cells.length > 0}
      sparkData={weightSparkData}
      sparkColor="#22C55E"
    />
  )

  const gridColsClass = cells.length === 3 ? "grid-cols-3" : cells.length === 2 ? "grid-cols-2" : "grid-cols-1"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.03] rounded-[1.5rem] overflow-hidden shadow-sm dark:shadow-xl"
    >
      {/* Top section — big number */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(2,26,2,0.6)]" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-[#8DA2B5] uppercase tracking-[0.15em]">
              Total populasi aktif
            </span>
          </div>
          {harvestSoonCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={10} strokeWidth={2.5} />
              {harvestSoonCount} siap panen
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2.5 mb-1">
          <span className="text-[56px] font-black leading-none tracking-[-3px] text-slate-900 dark:text-white tabular-nums">
            {totalEkor}
          </span>
          <span className="text-base text-slate-500 dark:text-[#8DA2B5] font-semibold">ekor</span>
        </div>

        <p className="text-[13px] text-slate-500 dark:text-[#8DA2B5] font-medium">
          {activeBatchCount} batch berjalan
          {harvestSoonCount > 0 && <> · <span className="text-emerald-600 dark:text-emerald-400/80">{harvestSoonCount} ekor siap panen ≤30 hari</span></>}
        </p>
      </div>

      {/* Bottom metric row */}
      <div className={`grid ${gridColsClass} border-t border-slate-200 dark:border-white/[0.03]`}>
        {cells}
      </div>
    </motion.div>
  )
}
