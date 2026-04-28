import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Pressable } from '@/dashboard/peternak/_shared/components/MobilePrimitives'

export function MobileAlertRow({ alert, onClick, className = '' }) {
  const isDanger = alert.level === 'danger' || alert.type === 'critical'
  
  return (
    <Pressable onPress={onClick} className={className}>
      <div className={`flex gap-3 px-4 py-3.5 bg-[#0A0E0C] border border-white/10 rounded-2xl ${isDanger ? 'border-l-[3px] border-l-red-500' : 'border-l-[3px] border-l-amber-500'}`}>
        <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
          <AlertCircle size={15} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-2 mb-0.5">
            <div className="text-[14px] font-bold text-white tracking-tight truncate">
              {alert.batch ? `${alert.batch} · ` : ''}{alert.title}
            </div>
            <div className="text-[11px] text-[#94A3B8] font-bold shrink-0">{alert.time || alert.at}</div>
          </div>
          <div className="text-[13px] text-[#94A3B8] leading-relaxed font-medium">
            {alert.body || alert.message}
          </div>
        </div>
      </div>
    </Pressable>
  )
}
