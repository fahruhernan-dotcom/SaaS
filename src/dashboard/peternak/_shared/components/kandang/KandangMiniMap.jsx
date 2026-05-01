import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LayoutGrid, Box, Scale, Maximize2, Minimize2, Cuboid } from 'lucide-react'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

// ─── Constants ────────────────────────────────────────────────────────────────

const CELL_PX = 32

// ─── Mini Animal (unified: domba 3D + sapi clickable) ────────────────────────

function MiniAnimal({ animal, bounds, dotColor, emoji, weightScaling, is3D, onAnimalClick }) {
  const weight = animal.latest_weight_kg || 25
  const lengthMeters = weightScaling(weight)
  const iconSize = Math.max(18, lengthMeters * CELL_PX)
  const iconSizeMeters = iconSize / CELL_PX

  const [target, setTarget] = useState({
    x: Math.random() * Math.max(0, bounds.w - iconSizeMeters),
    y: Math.random() * Math.max(0, bounds.h - iconSizeMeters),
  })
  const [isIdle, setIsIdle] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    if (!isIdle) return
    const timeout = setTimeout(() => {
      const nextX = Math.random() * Math.max(0, bounds.w - iconSizeMeters)
      const nextY = Math.random() * Math.max(0, bounds.h - iconSizeMeters)
      setIsFlipped(nextX < target.x)
      setTarget({ x: nextX, y: nextY })
      setIsIdle(false)
    }, 2000 + Math.random() * 8000)
    return () => clearTimeout(timeout)
  }, [isIdle, bounds.w, bounds.h, iconSizeMeters, target.x])

  return (
    <motion.div
      animate={{ x: target.x * CELL_PX, y: target.y * CELL_PX }}
      transition={{ duration: isIdle ? 0 : 8 + Math.random() * 12, ease: 'linear' }}
      onAnimationComplete={() => setIsIdle(true)}
      onClick={onAnimalClick ? (e) => { e.stopPropagation(); onAnimalClick(animal) } : undefined}
      onPointerDown={onAnimalClick ? (e) => e.stopPropagation() : undefined}
      style={{
        position: 'absolute',
        width: iconSize, height: iconSize,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: iconSize,
        zIndex: onAnimalClick ? 30 : 20,
        pointerEvents: onAnimalClick ? 'auto' : 'none',
        cursor: onAnimalClick ? 'pointer' : 'default',
        transformStyle: 'preserve-3d',
      }}
    >
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: `${iconSize * 0.8}px`,
        transform: is3D
          ? `rotateZ(45deg) rotateX(-60deg) translateY(-20px) translateZ(6px) ${isFlipped ? 'scaleX(-1)' : 'scaleX(1)'}`
          : isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
        transition: 'transform 0.4s ease-out',
        filter: is3D ? 'drop-shadow(0px 6px 3px rgba(0,0,0,0.5))' : 'none',
        transformStyle: 'preserve-3d',
      }}>
        <span style={{ display: 'inline-block' }}>{emoji}</span>
      </div>

      {/* Batch / ADG indicator dot */}
      <div style={{
        position: 'absolute',
        top: -iconSize / 6,
        right: -iconSize / 6,
        width: iconSize / 3,
        height: iconSize / 3,
        borderRadius: '50%',
        background: dotColor,
        border: '0.8px solid rgba(0,0,0,0.3)',
        transform: is3D
          ? 'rotateZ(45deg) rotateX(-60deg) translateY(-25px) translateZ(12px)'
          : 'none',
        transition: 'transform 0.4s ease-out',
        zIndex: 30,
      }} />
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
//
// config: {
//   emoji:           string          — '🐄' | '🐑' | '🐐'
//   palette:         Array<{ bg, border, dotColor }>
//   defaultFitMode:  boolean
//   has3D:           boolean         — show 3D toggle button
//   filterSold:      boolean         — exclude sold/exited animals
//   getDotColor:     (animal, batchColorMap) => string
//   weightScaling:   (weightKg) => number   — returns animal length in meters
//   accentGlow:      string          — rgba color for radial bg glow
//   fitModeBorder:   string          — Tailwind border class when fitMode active
//   fitModeBtn: {
//     active:  string   — Tailwind classes when fitMode=true
//     inactive: string  — Tailwind classes when fitMode=false
//   }
//   threeDBtn: {
//     active:  string   — Tailwind classes when is3D=true
//     inactive: string
//   }                               — required only when has3D=true
// }
//
// hooks: { useKandangs, useAnimalsByBatches }
//
// Props: batchIds, className, onAnimalClick?, onKandangClick?

export default function KandangMiniMap({ batchIds, className, onAnimalClick, onKandangClick, config, hooks }) {
  const ids = useMemo(() =>
    Array.isArray(batchIds) ? batchIds : batchIds ? [batchIds] : [],
    [batchIds]
  )

  const { data: kandangs = [], isLoading: loadKdg } = hooks.useKandangs()
  const { data: rawAnimals = [], isLoading: loadAni } = hooks.useAnimalsByBatches(ids)
  const containerRef = useRef(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })

  const isMobile = useMediaQuery('(max-width: 767px)')
  const [activeKandangId, setActiveKandangId] = useState(null)
  const [fitMode, setFitMode] = useState(() => isMobile || config.defaultFitMode)
  const [is3D, setIs3D] = useState(false)
  const hoverTimerRef = useRef(null)

  // batch → palette dot color map (used by 'batch' color mode)
  const batchColorMap = useMemo(() => {
    const map = {}
    ids.forEach((id, idx) => {
      map[id] = config.palette[idx % config.palette.length].dotColor
    })
    return map
  }, [ids, config.palette])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const animals = useMemo(() => {
    if (!config.filterSold) return rawAnimals
    return rawAnimals.filter(a => a.status !== 'sold' && !a.is_sold && !a.is_sale)
  }, [rawAnimals, config.filterSold])

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
    return { minX, minY, maxX, maxY, wM: maxX - minX, hM: maxY - minY }
  }, [placedKandangs])

  const scale = useMemo(() => {
    if (!viewport || !containerSize.w) return 1
    const sX = containerSize.w / (viewport.wM * CELL_PX)
    const sY = containerSize.h / (viewport.hM * CELL_PX)
    const fitScale = Math.min(sX, sY) * 0.98
    const base = fitMode ? fitScale : Math.min(1, fitScale * 0.85)
    // 3D isometric extends ~40% beyond 2D bounds — scale down to keep it inside the container
    return is3D ? base * 0.55 : base
  }, [viewport, containerSize, fitMode, is3D])

  const activeKandang = useMemo(() =>
    placedKandangs.find(k => k.id === activeKandangId),
    [placedKandangs, activeKandangId]
  )

  if (loadKdg || loadAni) return (
    <div className={cn('w-full h-32 flex items-center justify-center bg-white/[0.02] border border-white/[0.04] rounded-2xl', className)}>
      <LoadingSpinner />
    </div>
  )

  if (placedKandangs.length === 0) return null

  const handleStartHover = (id) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => setActiveKandangId(id), 3000)
  }

  const handleEndHover = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
  }

  const handleKandangClick = (e, kandang) => {
    e.stopPropagation()
    handleEndHover()
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
        'w-full relative overflow-hidden rounded-2xl bg-white/[0.015] cursor-default transition-all duration-500',
        fitMode
          ? `${config.fitModeBorder} min-h-[320px] lg:min-h-[400px] max-h-[700px]`
          : 'border border-white/[0.04] min-h-[200px] lg:min-h-[280px] max-h-[600px]',
        className
      )}
      style={{
        aspectRatio: fitMode ? undefined : aspectRatio,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: `${CELL_PX * scale}px ${CELL_PX * scale}px`,
        backgroundPosition: 'center center',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${config.accentGlow}, transparent 70%)` }}
      />

      {/* Controls */}
      <div className="absolute top-2 right-2 z-40 flex flex-col gap-2">
        {config.has3D && (
          <button
            onClick={(e) => { e.stopPropagation(); setIs3D(prev => !prev) }}
            title={is3D ? 'Kembali ke 2D' : 'Tampilan 3D Isometrik'}
            className={cn(
              'w-auto h-7 px-2.5 rounded-lg backdrop-blur-sm border flex items-center gap-1.5 transition-all active:scale-90',
              is3D ? config.threeDBtn?.active : config.threeDBtn?.inactive
            )}
          >
            <Cuboid size={13} />
            <span className="text-[10px] font-black uppercase tracking-wider">3D <span className="opacity-50 text-[8px]">[PRO]</span></span>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setFitMode(f => !f) }}
          title={fitMode ? 'Reset zoom (normal)' : 'Fit ke layar'}
          className={cn(
            'w-full h-7 px-2.5 rounded-lg backdrop-blur-sm border flex items-center gap-1.5 justify-center transition-all active:scale-90',
            fitMode ? config.fitModeBtn.active : config.fitModeBtn.inactive
          )}
        >
          {fitMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          <span className="text-[9px] font-bold uppercase tracking-wide">{fitMode ? 'Normal' : 'Fit'}</span>
        </button>
      </div>

      {/* Canvas */}
      <div className="absolute inset-0" ref={containerRef} style={{ perspective: '1000px' }}>
        {viewport && (
          <div
            style={{
              position: 'absolute',
              transform: `scale(${scale}) ${is3D ? 'rotateX(60deg) rotateZ(-45deg)' : ''}`,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              transformOrigin: 'center center',
              left: '50%', top: '50%',
              width: viewport.wM * CELL_PX,
              height: viewport.hM * CELL_PX,
              marginLeft: -(viewport.wM * CELL_PX) / 2,
              marginTop: -(viewport.hM * CELL_PX) / 2,
            }}
          >
            {placedKandangs.map((k, idx) => {
              const pal = config.palette[idx % config.palette.length]
              const kw = k.panjang_m || 5
              const kh = k.lebar_m || 4
              const kAnimals = groupedAnimals[k.id] || []

              return (
                <div
                  key={k.id}
                  onMouseEnter={() => handleStartHover(k.id)}
                  onMouseLeave={handleEndHover}
                  onClick={(e) => handleKandangClick(e, k)}
                  className={cn('transition-all duration-300 cursor-pointer', !is3D && 'hover:brightness-125')}
                  style={{
                    position: 'absolute',
                    left: (k.grid_x - viewport.minX) * CELL_PX,
                    top: (k.grid_y - viewport.minY) * CELL_PX,
                    width: kw * CELL_PX,
                    height: kh * CELL_PX,
                    border: is3D ? '1px solid rgba(255,255,255,0.1)' : `1.5px solid ${pal.border}`,
                    background: is3D
                      ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%231b4028'/%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E")`
                      : pal.bg,
                    borderRadius: 4,
                    overflow: is3D ? 'visible' : 'hidden',
                    transformStyle: 'preserve-3d',
                    boxShadow: is3D
                      ? `-1px 1px 0 #181c14, -2px 2px 0 #181c14, -3px 3px 0 #181c14, -4px 4px 0 #28241c, -5px 5px 0 #28241c, -6px 6px 0 #28241c, -7px 7px 0 #3a3224, -8px 8px 0 #3a3224, -9px 9px 0 #3a3224, -10px 10px 0 rgba(0,0,0,0.8), -15px 15px 20px rgba(0,0,0,0.6)`
                      : 'none',
                    transition: 'box-shadow 0.6s ease, background 0.6s ease',
                  }}
                >
                  <div
                    className="absolute top-1 left-1.5 z-10"
                    style={{ transform: is3D ? 'translateZ(1px)' : 'none' }}
                  >
                    <span className="text-[7px] font-black uppercase tracking-widest text-white leading-none opacity-60 drop-shadow-md">{k.name}</span>
                  </div>

                  <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
                    {kAnimals.map(a => (
                      <MiniAnimal
                        key={a.id}
                        animal={a}
                        bounds={{ w: kw, h: kh }}
                        dotColor={config.getDotColor(a, batchColorMap)}
                        emoji={config.emoji}
                        weightScaling={config.weightScaling}
                        is3D={is3D}
                        onAnimalClick={onAnimalClick}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail overlay */}
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
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Box size={14} className="text-white/60" />
                </div>
                <div>
                  <h3 className="font-['Sora'] font-black text-[11px] text-white uppercase tracking-tight leading-none mb-0.5">{activeKandang.name}</h3>
                  <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest leading-none">Inventaris</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveKandangId(null) }}
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
                    'flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/[0.04] rounded-xl transition-colors',
                    onAnimalClick && 'cursor-pointer hover:bg-white/[0.05]'
                  )}
                  onClick={onAnimalClick ? (e) => { e.stopPropagation(); onAnimalClick(a) } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]">{config.emoji}</span>
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
