import React from 'react'
import { formatIDR } from '@/lib/format'
import { cn } from '@/lib/utils'

export function SembakoSummaryStrip({ isDesktop, items = [] }) {
  if (!items.length) return null

  return (
    <div className="bg-[#EA580C]/[0.05] border-b border-[#EA580C]/10 px-5 py-3.5 flex justify-between items-center overflow-x-auto no-scrollbar">
      {items.map((item, idx) => (
        <div
          key={item.label}
          className={cn(
            'space-y-0.5 min-w-[100px]',
            item.alignment === 'center' ? 'text-center px-4 border-x border-[#EA580C]/10' :
            item.alignment === 'right' ? 'text-right pl-4' :
            'text-left pr-4',
            idx === 0 && 'border-l-0 pl-0',
            idx === items.length - 1 && 'border-r-0 pr-0'
          )}
        >
          <p className={cn(
            'font-black text-[#92400E] uppercase tracking-[0.15em] leading-none mb-1',
            isDesktop ? 'text-[9px]' : 'text-[10px]'
          )}>
            {item.label}
          </p>
          <p className={cn(
            'font-display text-[13px] font-black tabular-nums',
            item.color === 'green' ? 'text-[#34D399]' :
            item.color === 'red' ? 'text-[#EF4444]' :
            item.color === 'amber' ? 'text-[#F59E0B]' :
            'text-[#FEF3C7]'
          )}>
            {item.prefix || ''}
            {item.isCurrency ? formatIDR(Math.abs(item.value || 0)) : item.value}
            {item.suffix || ''}
          </p>
        </div>
      ))}
    </div>
  )
}
