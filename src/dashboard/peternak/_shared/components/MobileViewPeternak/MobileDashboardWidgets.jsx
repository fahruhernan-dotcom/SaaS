import React from 'react'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { Card, Pressable, Sparkline } from '@/dashboard/peternak/_shared/components/MobilePrimitives'
import { MobileBatchRow } from './MobileBatchRow'

// ─── Metric Cell ─────────────────────────────────────────────────────────────
// Used in the population card for ADG, Mortality, Avg Weight
export function MetricCell({ label, value, unit, tone, divider, sparkData, className = '' }) {
  const toneColors = {
    danger: 'text-red-500',
    warn: 'text-amber-500',
    ok: 'text-emerald-500',
    neutral: 'text-white'
  }
  const toneColorClass = toneColors[tone] || toneColors.neutral

  return (
    <div className={`px-4 py-3.5 flex flex-col gap-1 ${divider === 'left' ? 'border-l border-white/10' : ''} ${className}`}>
      <div className="text-[11px] text-[#94A3B8] font-bold tracking-widest uppercase">
        {label}
      </div>
      <div className="flex items-baseline justify-between gap-1">
        <div className="flex items-baseline gap-1">
          <span className={`font-display text-[22px] font-semibold tracking-tight tabular-nums leading-none ${toneColorClass}`}>
            {value}
          </span>
          {unit && (
            <span className="text-[11px] text-[#94A3B8] font-bold uppercase">{unit}</span>
          )}
        </div>
        {sparkData && (
          <Sparkline 
            data={sparkData} 
            color="#10B981" 
            width={42} 
            height={20} 
            className="shrink-0"
          />
        )}
      </div>
    </div>
  )
}

// ─── Quick Action Card ───────────────────────────────────────────────────────
// Smaller shortcut cards at the bottom of the dashboard
export function QuickActionCard({ icon, label, sub, onClick, className = '' }) {
  return (
    <Pressable onPress={onClick} className={className}>
      <div className="bg-[#0A0E0C] border border-white/10 rounded-2xl p-3.5 flex items-center gap-3 active:bg-white/[0.04]">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-white tracking-tight leading-tight">{label}</div>
          <div className="text-[12px] text-[#94A3B8] font-medium mt-0.5 leading-tight">{sub}</div>
        </div>
      </div>
    </Pressable>
  )
}
// ─── Alert Section ──────────────────────────────────────────────────────────
export function MobileAlertSection({ alerts }) {
  if (!alerts || alerts.length === 0) return null
  
  return (
    <div className="px-5 space-y-2">
      {alerts.map((a, i) => (
        <button
          key={i}
          onClick={a.action}
          className={`w-full flex items-center gap-3 p-3.5 bg-white/[0.03] border border-white/[0.06] border-l-[3px] ${
            a.type === 'danger' ? 'border-l-red-500' : 'border-l-amber-400'
          } rounded-xl text-left active:scale-[0.98] transition-transform`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            a.type === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'
          }`}>
            <AlertTriangle size={15} className={a.type === 'danger' ? 'text-red-400' : 'text-amber-400'} />
          </div>
          <p className="flex-1 text-[12px] text-white/90 font-medium leading-snug line-clamp-2">{a.msg}</p>
          <ChevronRight size={14} className="text-[#4B6478] shrink-0" />
        </button>
      ))}
    </div>
  )
}

// ─── Batch Section ──────────────────────────────────────────────────────────
export function MobileBatchSection({ batches, animals, onBatchClick, BASE }) {
  if (!batches || batches.length === 0) return null

  return (
    <div className="px-5 space-y-3">
      {batches.map((batch, i) => {
        const activeCount = animals.filter(a => a.batch_id === batch.id && a.status !== 'sold' && !a.is_sold && !a.is_sale).length
        return (
          <MobileBatchRow
            key={batch.id}
            batch={batch}
            activeCount={activeCount}
            onClick={() => onBatchClick(batch)}
            index={i}
          />
        )
      })}
    </div>
  )
}
