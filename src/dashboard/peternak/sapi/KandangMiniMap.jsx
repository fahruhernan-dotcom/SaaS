import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  useSapiAnimals,
  useSapiKandangs,
  calcSapiADGFromRecords,
} from '@/lib/hooks/useSapiPenggemukanData'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
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
  if (!adgKg) return '#4B6478'
  if (adgKg >= 0.8) return '#4ADE80'
  if (adgKg >= 0.5) return '#FBBF24'
  return '#F87171'
}

const MiniCow = ({ animal, bounds, dotColor }) => {
  const weight = animal.latest_weight_kg || 250
  const lengthMeters = Math.pow(weight, 1 / 3) * 0.195
  // Increase basic icon size for mini-map visibility - even bigger now
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
      style={{
        position: 'absolute',
        width: iconSize, height: iconSize,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: iconSize,
        zIndex: 20,
        pointerEvents: 'none'
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

export default function KandangMiniMap({ batchId, className }) {
  const { data: kandangs = [], isLoading: loadKdg } = useSapiKandangs(batchId)
  const { data: animals = [], isLoading: loadAni } = useSapiAnimals(batchId)
  const containerRef = useRef(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })

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

    // Safe padding (0.5m) to prevent touching edges
    minX -= 0.5; maxX += 0.5; minY -= 0.5; maxY += 0.5
    const wM = maxX - minX, hM = maxY - minY

    return { minX, minY, maxX, maxY, wM, hM }
  }, [placedKandangs])

  const scale = useMemo(() => {
    if (!viewport || !containerSize.w) return 1
    const sX = containerSize.w / (viewport.wM * CELL_PX)
    const sY = containerSize.h / (viewport.hM * CELL_PX)
    // No boost (1.0x) to ensure NO cropping occurs
    return Math.min(sX, sY)
  }, [viewport, containerSize])

  if (loadKdg || loadAni) return (
    <div className={cn("w-full h-32 flex items-center justify-center bg-white/[0.02] border border-white/[0.04] rounded-2xl", className)}>
      <LoadingSpinner />
    </div>
  )

  if (placedKandangs.length === 0) return null

  // Calculate dynamic aspect ratio string
  const aspectRatio = viewport ? `${viewport.wM} / ${viewport.hM}` : '1 / 1'

  return (
    <div 
      className={cn("w-full relative overflow-hidden rounded-2xl bg-white/[0.015] border border-white/[0.04] p-4 min-h-[280px] max-h-[600px]", className)}
      style={{ aspectRatio }}
    >
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03),transparent_70%)] pointer-events-none" />
      
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
    </div>
  )
}
