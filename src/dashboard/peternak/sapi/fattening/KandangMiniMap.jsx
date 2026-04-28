import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LayoutGrid, Box, Scale, Maximize2, Minimize2 } from 'lucide-react'
import {
  useSapiKandangs,
  useSapiAnimalsByBatches,
  calcSapiADGFromRecords,
} from '@/lib/hooks/useSapiPenggemukanData'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { cn } from '@/lib/utils'

const CELL_PX = 32
const PALETTE = [
  { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',  text: '#FCD34D', dotColor: '#FBBF24' },
  { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.3)',  text: '#93C5FD', dotColor: '#60A5FA' },
  { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.3)',  text: '#6EE7B7', dotColor: '#4ADE80' },
  { bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.3)',  text: '#C4B5FD', dotColor: '#A78BFA' },
  { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',   text: '#FCA5A5', dotColor: '#F87171' },
]

function getADGTierColor(adgKg) {
  if (adgKg === null || adgKg === undefined) return '#4B6478' // Neutral Grey
  if (adgKg >= 0.8) return '#4ADE80' // Green
  if (adgKg >= 0.5) return '#FBBF24' // Amber
  if (adgKg === 0) return '#4B6478'  // Still new/zero
  return '#F87171' // Red (Only for actual low performance)
}

const MiniCow = ({ animal, bounds, dotColor, onAnimalClick }) => {
  const weight = animal.latest_weight_kg || 250
  const lengthMeters = Math.pow(weight, 1 / 3) * 0.195
  const iconSize = Math.max(20, lengthMeters * CELL_PX)

  const [target, setTarget] = useState({
    x: Math.random() * (bounds.w - lengthMeters),
    y: Math.random() * (bounds.h - lengthMeters)
  })
  const [isIdle, setIsIdle] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    if (!isIdle) return
    const timeout = setTimeout(() => {
      const nextX = Math.random() * (bounds.w - lengthMeters)
      const nextY = Math.random() * (bounds.h - lengthMeters)
      setIsFlipped(nextX < target.x)
      setTarget({ x: nextX, y: nextY })
      setIsIdle(false)
    }, 2000 + Math.random() * 8000)
    return () => clearTimeout(timeout)
  }, [isIdle, bounds.w, bounds.h, lengthMeters, target.x])

  return (
    <motion.div
      animate={{
        x: target.x * CELL_PX,
        y: target.y * CELL_PX,
      }}
      transition={{
        duration: isIdle ? 0 : 8 + Math.random() * 12,
        ease: "linear"
      }}
      onAnimationComplete={() => setIsIdle(true)}
      onClick={(e) => {
        if (onAnimalClick) {
          e.stopPropagation()
          onAnimalClick(animal)
        }
      }}
      onPointerDown={(e) => { if (onAnimalClick) e.stopPropagation() }}
      style={{
        position: 'absolute',
        width: iconSize, height: iconSize,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: iconSize,
        zIndex: onAnimalClick ? 30 : 20,
        pointerEvents: onAnimalClick ? 'auto' : 'none',
        cursor: onAnimalClick ? 'pointer' : 'default',
      }}
    >
      <div style={{
        transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
        transition: 'transform 0.4s ease-out'
      }}>
        🐄
      </div>
      <div style={{
        position: 'absolute',
        top: -iconSize / 6,
        right: -iconSize / 6,
        width: iconSize / 3,
        height: iconSize / 3,
        borderRadius: '50%',
        background: dotColor,
        border: '0.8px solid rgba(0,0,0,0.3)',
      }} />
    </motion.div>
  )
}

export default function KandangMiniMap({ batchIds, className, onAnimalClick, onKandangClick }) {
  const ids = useMemo(() =>
    Array.isArray(batchIds) ? batchIds : batchIds ? [batchIds] : [],
  [batchIds])

  const { data: kandangs = [], isLoading: loadKdg } = useSapiKandangs()
  const { data: animals = [], isLoading: loadAni } = useSapiAnimalsByBatches(ids)
  const containerRef = useRef(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  
  // Interactive States
  const [activeKandangId, setActiveKandangId] = useState(null)
  const [fitMode, setFitMode] = useState(false)
  const hoverTimerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const placedKandangs = useMemo(() =>
    kandangs.filter(k => !k.is_holding && k.grid_x != null && k.grid_y != null),
    [kandangs]
  )

  const groupedAnimals = useMemo(() => {
    const map = {}
    animals.forEach(a => {
      if (a.kandang_id) {
        if (!map[a.kandang_id]) map[a.kandang_id] = []
        map[a.kandang_id].push(a)
      }
    })
    return map
  }, [animals])

  const viewport = useMemo(() => {
    if (placedKandangs.length === 0) return null

    let minX = 100, maxX = 0, minY = 80, maxY = 0
    placedKandangs.forEach(k => {
      const kw = Math.max(1, k.panjang_m || 1)
      const kh = Math.max(1, k.lebar_m || 1)
      minX = Math.min(minX, k.grid_x)
      maxX = Math.max(maxX, k.grid_x + kw)
      minY = Math.min(minY, k.grid_y)
      maxY = Math.max(maxY, k.grid_y + kh)
    })

    minX -= 0.5; maxX += 0.5; minY -= 0.5; maxY += 0.5
    const wM = maxX - minX, hM = maxY - minY

    return { minX, minY, maxX, maxY, wM, hM }
  }, [placedKandangs])

  const scale = useMemo(() => {
    if (!viewport || !containerSize.w) return 1
    const sX = containerSize.w / (viewport.wM * CELL_PX)
    const sY = containerSize.h / (viewport.hM * CELL_PX)
    return fitMode ? Math.min(sX, sY) * 0.92 : Math.min(1.2, Math.min(sX, sY))
  }, [viewport, containerSize, fitMode])

  const activeKandang = useMemo(() => 
    placedKandangs.find(k => k.id === activeKandangId),
    [placedKandangs, activeKandangId]
  )

  if (loadKdg || loadAni) return (
    <div className={cn("w-full h-32 flex items-center justify-center bg-white/[0.02] border border-white/[0.04] rounded-2xl", className)}>
      <LoadingSpinner />
    </div>
  )

  if (placedKandangs.length === 0) return null

  const handleStartHover = (id) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => {
      setActiveKandangId(id)
    }, 3000)
  }

  const handleEndHover = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
  }

  const handleManualClick = (e, kandang) => {
    e.stopPropagation()
    handleEndHover()
    // If external handler provided, use it. Otherwise use internal overlay.
    if (onKandangClick) {
      onKandangClick(kandang)
    } else {
      setActiveKandangId(kandang.id)
    }
  }

  const aspectRatio = viewport ? `${viewport.wM} / ${viewport.hM}` : '1 / 1'

  return (
    <div 
      className={cn(
        "w-full relative overflow-hidden rounded-2xl bg-white/[0.015] p-4 cursor-default transition-all duration-500",
        fitMode
          ? "border border-amber-500/20 min-h-[320px] max-h-[700px]"
          : "border border-white/[0.04] min-h-[280px] max-h-[600px]",
        className
      )}
      style={{ 
        aspectRatio: fitMode ? undefined : aspectRatio,
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: `${CELL_PX * scale}px ${CELL_PX * scale}px`,
        backgroundPosition: 'center center'
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03),transparent_70%)] pointer-events-none" />

      {/* Fit / Reset Zoom Button */}
      <button
        onClick={(e) => { e.stopPropagation(); setFitMode(f => !f); }}
        title={fitMode ? 'Reset zoom (normal)' : 'Fit ke layar'}
        className={cn(
          "absolute top-2 right-2 z-40 h-7 px-2.5 rounded-lg backdrop-blur-sm border flex items-center gap-1.5 transition-all active:scale-90",
          fitMode
            ? "bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30"
            : "bg-black/40 border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/10"
        )}
      >
        {fitMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        <span className="text-[9px] font-bold uppercase tracking-wide">
          {fitMode ? 'Normal' : 'Fit'}
        </span>
      </button>
      
      <div className="w-full h-full relative" ref={containerRef}>
        {viewport && (
          <div
            style={{
              position: 'absolute',
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              left: '50%', top: '50%',
              width: viewport.wM * CELL_PX,
              height: viewport.hM * CELL_PX,
              marginLeft: -(viewport.wM * CELL_PX) / 2,
              marginTop: -(viewport.hM * CELL_PX) / 2,
            }}
          >
            {placedKandangs.map((k, idx) => {
              const pal = PALETTE[idx % PALETTE.length]
              const kw = k.panjang_m || 5
              const kh = k.lebar_m || 4
              const kAnimals = groupedAnimals[k.id] || []

              return (
                <div
                  key={k.id}
                  onMouseEnter={() => handleStartHover(k.id)}
                  onMouseLeave={handleEndHover}
                  onClick={(e) => handleManualClick(e, k)}
                  className="transition-all duration-300 hover:brightness-125 cursor-pointer"
                  style={{
                    position: 'absolute',
                    left: (k.grid_x - viewport.minX) * CELL_PX,
                    top: (k.grid_y - viewport.minY) * CELL_PX,
                    width: kw * CELL_PX,
                    height: kh * CELL_PX,
                    border: `1.5px solid ${pal.border}`,
                    background: pal.bg,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div className="absolute top-1 left-1.5 z-10 flex flex-col gap-0.5">
                    <span className="text-[7px] font-black uppercase tracking-widest text-[#4B6478] leading-none opacity-40">{k.name}</span>
                  </div>

                  <div className="relative w-full h-full">
                    {kAnimals.map(a => {
                      const adg = calcSapiADGFromRecords(a.sapi_penggemukan_weight_records, a.entry_date, a.entry_weight_kg)
                      const adgKg = adg ? adg / 1000 : null
                      const dotColor = getADGTierColor(adgKg)
                      return (
                        <MiniCow
                          key={a.id}
                          animal={a}
                          bounds={{ w: kw, h: kh }}
                          dotColor={dotColor}
                          onAnimalClick={onAnimalClick}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Overlay - Floating Style */}
      <AnimatePresence>
        {activeKandang && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-[280px] z-[50] flex flex-col bg-[#0C1319]/90 backdrop-blur-xl p-4 border border-white/10 rounded-2xl shadow-2xl max-h-[80%] pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
                   <Box className="text-amber-400" size={14} />
                </div>
                <div>
                   <h3 className="font-['Sora'] font-black text-[11px] text-white uppercase tracking-tight leading-none mb-0.5">{activeKandang.name}</h3>
                   <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest leading-none">Inventaris</p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveKandangId(null); }}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#4B6478] hover:text-white transition-all"
              >
                <X size={12} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {(groupedAnimals[activeKandang.id] || []).map(a => (
                <div 
                  key={a.id} 
                  className={cn(
                    "flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/[0.04] rounded-xl transition-colors",
                    onAnimalClick ? "cursor-pointer hover:bg-white/[0.05]" : ""
                  )}
                  onClick={(e) => {
                    if (onAnimalClick) {
                      e.stopPropagation();
                      onAnimalClick(a);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]">🐄</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-tight">{a.ear_tag}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-60">
                    <Scale size={9} className="text-[#4B6478]" />
                    <span className="text-[9px] font-bold text-[#4B6478]">{a.latest_weight_kg || a.entry_weight_kg} kg</span>
                  </div>
                </div>
              ))}
              {(groupedAnimals[activeKandang.id] || []).length === 0 && (
                <div className="py-8 flex flex-col items-center justify-center opacity-20">
                  <LayoutGrid size={24} className="mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Kosong</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
               <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest leading-none">Populasi</p>
               <p className="text-[10px] font-black text-white leading-none">{(groupedAnimals[activeKandang.id] || []).length} / {activeKandang.capacity} Ekor</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
