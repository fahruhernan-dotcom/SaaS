import React from 'react'
import { ChevronRight } from 'lucide-react'

export function MobileKandangMap({ className = '' }) {
  const pens = [
    { id: 'A1', name: 'Utara A', batch: 'B-2604', count: 47, capacity: 50, status: 'ok',    x: 0,    y: 0, w: 48, h: 38 },
    { id: 'A2', name: 'Utara B', batch: 'B-2702', count: 38, capacity: 40, status: 'ok',    x: 52,   y: 0, w: 48, h: 38 },
    { id: 'B1', name: 'Selatan A', batch: 'B-2604', count: 22, capacity: 30, status: 'warn', x: 0,  y: 42, w: 48, h: 28 },
    { id: 'B2', name: 'Karantina', batch: '—',    count: 3,  capacity: 12, status: 'alert', x: 52, y: 42, w: 48, h: 28 },
  ]
  
  const totalAnimals = pens.reduce((s, p) => s + p.count, 0)
  const totalCap = pens.reduce((s, p) => s + p.capacity, 0)
  const utilization = Math.round((totalAnimals / totalCap) * 100)

  return (
    <div className={`bg-[#0A0E0C] border border-white/10 rounded-[20px] overflow-hidden shadow-sm ${className}`}>
      {/* Header strip */}
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          <div>
            <div className="text-[13px] font-semibold text-white tracking-tight">4 kandang aktif</div>
            <div className="text-[11px] text-[#94A3B8]">Live · diperbarui 2 menit lalu</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-[16px] font-semibold text-white tracking-tight">{utilization}%</div>
          <div className="text-[10px] text-[#94A3B8] font-semibold tracking-widest uppercase">okupansi</div>
        </div>
      </div>

      {/* Map area */}
      <div className="relative p-4 bg-gradient-to-br from-[#07100D] to-[#0B1814]">
        {/* Subtle grid */}
        <div 
          className="absolute inset-4 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        <div className="relative aspect-[1.6] w-full">
          {pens.map(pen => {
            const fillPct = pen.count / pen.capacity
            const toneColor = pen.status === 'ok' ? 'emerald' : pen.status === 'warn' ? 'amber' : 'red'
            const statusColor = toneColor === 'emerald' ? '#10B981' : toneColor === 'amber' ? '#F59E0B' : '#EF4444'
            
            return (
              <div 
                key={pen.id} 
                className="absolute bg-white/[0.04] rounded-lg p-2 flex flex-col justify-between overflow-hidden cursor-pointer transition-transform active:scale-[1.02]"
                style={{
                  left: `${pen.x}%`, 
                  top: `${pen.y}%`,
                  width: `${pen.w}%`, 
                  height: `${pen.h}%`,
                  border: `1px solid ${statusColor}66`
                }}
              >
                {/* Fill background indicating utilization */}
                <div 
                  className="absolute left-0 bottom-0 right-0 pointer-events-none"
                  style={{
                    height: `${fillPct * 100}%`,
                    background: `linear-gradient(to top, ${statusColor}22, transparent)`
                  }}
                />

                {/* Sheep dots */}
                <div className="absolute inset-1.5 flex flex-wrap gap-0.5 content-end justify-center opacity-80">
                  {Array.from({ length: Math.min(pen.count, 24) }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 h-1 rounded-full"
                      style={{ 
                        backgroundColor: statusColor,
                        opacity: 0.6 + (i % 3) * 0.15 
                      }} 
                    />
                  ))}
                </div>

                {/* Header label */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="font-display text-[10px] font-bold text-white tracking-wide bg-black/40 px-1.5 py-0.5 rounded">
                    {pen.id}
                  </span>
                  {pen.status !== 'ok' && (
                    <span 
                      className="w-1.5 h-1.5 rounded-full shadow-[0_0_6px]"
                      style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
                    />
                  )}
                </div>

                {/* Footer count */}
                <div className="relative z-10 flex items-baseline justify-between">
                  <span className="font-display text-[13px] font-semibold text-white tracking-tight">
                    {pen.count}
                    <span className="text-[9px] text-[#94A3B8] font-medium ml-0.5">/{pen.capacity}</span>
                  </span>
                  <span className="text-[8px] font-bold text-[#94A3B8] tracking-widest uppercase">
                    {pen.batch}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-white/10 bg-white/[0.02]">
        <div className="flex gap-3.5">
          <LegendDot color="bg-emerald-500" label="Normal" />
          <LegendDot color="bg-amber-500" label="Pantau" />
          <LegendDot color="bg-red-500" label="Karantina" />
        </div>
        <button className="text-[11px] font-bold text-emerald-500 active:opacity-70 flex items-center">
          Detail <ChevronRight size={12} className="ml-0.5" />
        </button>
      </div>
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[10px] text-[#94A3B8] font-medium">{label}</span>
    </div>
  )
}
