import React from 'react'
import { Card, Pill, ProgressBar } from '@/dashboard/peternak/_shared/components/MobilePrimitives'

export function MobileBatchRow({ batch, targetDays = 60, onClick, className = '' }) {
  const days = batch.ageInDays || 0
  const remaining = Math.max(0, targetDays - days)
  const isOverdue = days > targetDays
  const isNearHarvest = !isOverdue && remaining <= 14
  
  const adgTone = batch.adg >= 150 ? 'ok' : batch.adg >= 100 ? 'warn' : 'danger'
  const adgColorClass = adgTone === 'ok' ? 'text-emerald-500' : adgTone === 'warn' ? 'text-amber-500' : 'text-red-500'

  return (
    <Card onClick={onClick} className={className}>
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-[17px] font-bold text-white tracking-tight">
              {batch.code || batch.name}
            </span>
            {isNearHarvest && <Pill tone="warn">Siap panen</Pill>}
            {isOverdue && <Pill tone="danger">Overdue</Pill>}
          </div>
          <div className="text-[13px] text-[#94A3B8] font-medium">{batch.location || 'Kandang Utama'}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-[22px] font-bold text-white leading-none tracking-tight tabular-nums">
            {batch.population || batch.active_population || 0}
          </div>
          <div className="text-[10px] text-[#94A3B8] font-bold tracking-widest uppercase mt-1">ekor</div>
        </div>
      </div>

      <div className="flex justify-between text-[12px] text-[#94A3B8] mb-2 font-medium">
        <span>Hari ke-<span className="text-white font-bold">{days}</span> dari {targetDays}</span>
        <span className={isNearHarvest ? 'text-amber-500 font-bold' : isOverdue ? 'text-red-500 font-bold' : 'text-[#94A3B8]'}>
          {isOverdue ? `+${days - targetDays} hari overdue` : `Sisa ${remaining} hari`}
        </span>
      </div>
      
      <ProgressBar 
        value={days} 
        max={targetDays} 
        tone={isOverdue ? 'danger' : isNearHarvest ? 'warn' : 'accent'} 
      />

      <div className="grid grid-cols-3 gap-1 mt-3.5 pt-3.5 border-t border-white/10">
        <BatchMini label="ADG" value={`${batch.adg || 0}g`} colorClass={adgColorClass} />
        <BatchMini label="Bobot" value={`${batch.avgWeight || 0} kg`} />
        <BatchMini 
          label="Mortalitas" 
          value={`${batch.mortality || 0}/${batch.total_initial || batch.initial_population || 0}`} 
          colorClass={(batch.mortality > 0) ? 'text-amber-500' : 'text-white'} 
        />
      </div>
    </Card>
  )
}

function BatchMini({ label, value, colorClass = 'text-white' }) {
  return (
    <div>
      <div className="text-[10px] text-[#94A3B8] font-bold tracking-widest uppercase mb-0.5">
        {label}
      </div>
      <div className={`font-display text-[15px] font-bold tracking-tight tabular-nums ${colorClass}`}>
        {value}
      </div>
    </div>
  )
}
