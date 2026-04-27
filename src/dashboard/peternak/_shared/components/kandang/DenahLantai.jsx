import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MousePointer, PenLine, ZoomIn, ZoomOut, Maximize2, Map, Grid3X3, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CELL_PX, GRID_W, GRID_H, MAJOR, MIN_SCALE, MAX_SCALE, PALETTE, getADGTier } from './constants'
import RoamingAnimal from './RoamingAnimal'

// ── PlacedKandang ─────────────────────────────────────────────────────────────
function PlacedKandang({
  kandang, pal, animals, dragging,
  onKandangMouseDown, onKandangClick, onKandangDoubleClick, onAnimalClick,
  activeDetailKandang, speciesConfig, batchColorMap,
}) {
  const { weightRecordsKey, calcADG, adgThresholds, emoji, weightScaling } = speciesConfig
  const isDraggingThis = dragging?.kandang.id === kandang.id
  const kw = kandang.panjang_m || 5
  const kh = kandang.lebar_m || 4
  const gx = isDraggingThis ? dragging.currentX : (kandang.grid_x ?? 0)
  const gy = isDraggingThis ? dragging.currentY : (kandang.grid_y ?? 0)

  const hoverTimerRef = useRef(null)
  const handleMouseEnter = () => {
    if (activeDetailKandang?.id === kandang.id) return
    hoverTimerRef.current = setTimeout(() => onKandangClick(kandang), 3000)
  }
  const handleMouseLeave = () => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null }
  }

  return (
    <motion.div
      layoutId={`kandang-${kandang.id}`}
      initial={false}
      animate={{
        left: gx * CELL_PX,
        top: gy * CELL_PX,
        scale: isDraggingThis ? 1.02 : 1,
        boxShadow: isDraggingThis
          ? '0 20px 50px rgba(0,0,0,0.5)'
          : '0 4px 12px rgba(0,0,0,0.1)'
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.8,
        // Make the drag follow closely but with a tiny bit of "smoothness"
        left: { duration: isDraggingThis ? 0.05 : 0.4 },
        top: { duration: isDraggingThis ? 0.05 : 0.4 }
      }}
      style={{
        position: 'absolute',
        width: kw * CELL_PX, height: kh * CELL_PX,
        border: `1.5px solid ${pal.border}`,
        background: pal.bg, borderRadius: 6, overflow: 'hidden',
        cursor: isDraggingThis ? 'grabbing' : 'grab',
        zIndex: isDraggingThis ? 30 : 10,
        transformStyle: 'preserve-3d',
      }}
      onMouseDown={(e) => onKandangMouseDown(e, kandang)}
      onClick={(e) => { if (e.detail === 1) onKandangClick(kandang) }}
      onDoubleClick={() => onKandangDoubleClick(kandang)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ padding: '2px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 900, color: pal.text, letterSpacing: '0.06em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kandang.name}</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{animals.length}/{kandang.capacity}</span>
      </div>
      <div style={{ position: 'relative', width: '100%', height: kh * CELL_PX - 20, marginTop: 0 }}>
        {animals.map(a => {
          const records = a[weightRecordsKey] ?? []
          const adg = calcADG(records, a.entry_date, a.entry_weight_kg)
          const adgKg = adg ? adg / 1000 : null
          const tier = getADGTier(adgKg, adgThresholds)
          const dotColor = batchColorMap?.[a.batch_id]?.dotColor ?? tier.dotColor
          return (
            <RoamingAnimal
              key={a.id}
              animal={a}
              bounds={{ w: kw, h: kh - 1 }}
              dotColor={dotColor}
              emoji={emoji}
              weightScaling={weightScaling}
              onClick={onAnimalClick}
            />
          )
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 8, color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }}>{kw}×{kh}m</div>
    </motion.div>
  )
}

// ── DenahLantai ───────────────────────────────────────────────────────────────
/**
 * Full 1:1 scale floor plan with pan/zoom, draw, and drag-to-place.
 *
 * @param {array}    props.kandangs
 * @param {object}   props.groupedAnimals     - { [kandangId]: animal[] }
 * @param {string|null} props.activeBatchId   - batch id for mutations (fallback in all-batch mode)
 * @param {function} props.onAnimalClick
 * @param {function} props.onKandangClick
 * @param {function} props.onKandangDoubleClick
 * @param {object|null} props.activeDetailKandang
 * @param {string}   props.floorMode          - 'view' | 'draw'
 * @param {function} props.setFloorMode
 * @param {object|null} props.placingKandang
 * @param {function} props.setPlacingKandang
 * @param {object|null} props.drawStart
 * @param {function} props.setDrawStart
 * @param {object|null} props.drawCurrent
 * @param {function} props.setDrawCurrent
 * @param {object|null} props.pendingRect
 * @param {function} props.setPendingRect
 * @param {string}   props.pendingName
 * @param {function} props.setPendingName
 * @param {object|null} props.dragging
 * @param {function} props.setDragging
 * @param {object}   props.hooks              - { useCreateKandang, useUpdateKandangPosition }
 * @param {object}   props.speciesConfig
 * @param {object}   props.batchColorMap
 */
export default function DenahLantai({
  kandangs, groupedAnimals, activeBatchId,
  onAnimalClick, onKandangClick, onKandangDoubleClick, activeDetailKandang,
  floorMode, setFloorMode,
  placingKandang, setPlacingKandang,
  drawStart, setDrawStart,
  drawCurrent, setDrawCurrent,
  pendingRect, setPendingRect,
  pendingName, setPendingName,
  dragging, setDragging,
  hooks, speciesConfig, batchColorMap,
}) {
  const containerRef = useRef(null)
  const createKandang = hooks.useCreateKandang()
  const updatePosition = hooks.useUpdateKandangPosition()

  const [viewport, setViewport] = useState({ x: 24, y: 24, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ mx: 0, my: 0, vx: 0, vy: 0 })
  const [spaceHeld, setSpaceHeld] = useState(false)

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const factor = Math.exp(-e.deltaY * 0.0012)
    setViewport(prev => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor))
      const ratio = newScale / prev.scale
      return { scale: newScale, x: mouseX - (mouseX - prev.x) * ratio, y: mouseY - (mouseY - prev.y) * ratio }
    })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const cw = GRID_W * CELL_PX; const ch = GRID_H * CELL_PX
    const scale = Math.min(1, Math.min(width / cw, height / ch) * 0.88)
    setViewport({ x: (width - cw * scale) / 2, y: (height - ch * scale) / 2, scale })
  }, [])

  useEffect(() => {
    const down = (e) => { if (e.code === 'Space' && !e.target.closest('input,textarea')) { e.preventDefault(); setSpaceHeld(true) } }
    const up = (e) => { if (e.code === 'Space') setSpaceHeld(false) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const placedKandangs = kandangs.filter(k => !k.is_holding && k.grid_x != null && k.grid_y != null)
  const unplacedKandangs = kandangs.filter(k => !k.is_holding && (k.grid_x == null || k.grid_y == null))

  const getCell = (e) => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(Math.floor((e.clientX - rect.left - viewport.x) / (CELL_PX * viewport.scale)), GRID_W - 1)),
      y: Math.max(0, Math.min(Math.floor((e.clientY - rect.top - viewport.y) / (CELL_PX * viewport.scale)), GRID_H - 1)),
    }
  }

  const handleMouseDown = (e) => {
    if (e.button === 1 || spaceHeld) {
      e.preventDefault(); setIsPanning(true)
      setPanStart({ mx: e.clientX, my: e.clientY, vx: viewport.x, vy: viewport.y }); return
    }
    if (e.button !== 0) return
    if (floorMode === 'draw') { const cell = getCell(e); setDrawStart(cell); setDrawCurrent(cell); return }
    setIsPanning(true)
    setPanStart({ mx: e.clientX, my: e.clientY, vx: viewport.x, vy: viewport.y })
  }

  const handleMouseMove = (e) => {
    if (isPanning) { setViewport(prev => ({ ...prev, x: panStart.vx + e.clientX - panStart.mx, y: panStart.vy + e.clientY - panStart.my })); return }
    if (dragging) {
      const cell = getCell(e)
      const kw = dragging.kandang.panjang_m || 5; const kh = dragging.kandang.lebar_m || 4
      setDragging(prev => ({ ...prev, currentX: Math.max(0, Math.min(cell.x - prev.offsetX, GRID_W - kw)), currentY: Math.max(0, Math.min(cell.y - prev.offsetY, GRID_H - kh)) })); return
    }
    if (floorMode === 'draw' && drawStart) setDrawCurrent(getCell(e))
  }

  const handleMouseUp = () => {
    if (isPanning) { setIsPanning(false); return }
    if (dragging) {
      const k = dragging.kandang
      if (dragging.currentX !== (k.grid_x ?? 0) || dragging.currentY !== (k.grid_y ?? 0)) {
        updatePosition.mutate({ kandangId: k.id, batchId: activeBatchId, grid_x: dragging.currentX, grid_y: dragging.currentY })
      }
      setDragging(null); return
    }
    if (floorMode === 'draw' && drawStart) {
      const end = drawCurrent || drawStart
      const x = Math.min(drawStart.x, end.x), y = Math.min(drawStart.y, end.y)
      const w = Math.abs(end.x - drawStart.x) + 1, h = Math.abs(end.y - drawStart.y) + 1
      setDrawStart(null); setDrawCurrent(null)
      if (w >= 1 && h >= 1) { setPendingRect({ x, y, w, h }); setPendingName('') }
    }
  }

  const handleClick = (e) => {
    if (!placingKandang) return
    const cell = getCell(e)
    updatePosition.mutate({ kandangId: placingKandang.id, batchId: activeBatchId, grid_x: cell.x, grid_y: cell.y }, {
      onSuccess: () => { toast.success(`${placingKandang.name} ditempatkan`); setPlacingKandang(null) },
    })
  }

  const handleKandangMouseDown = (e, kandang) => {
    if (floorMode !== 'view' || spaceHeld || e.button !== 0) return
    e.stopPropagation()
    const cell = getCell(e)
    setDragging({ kandang, offsetX: cell.x - (kandang.grid_x ?? 0), offsetY: cell.y - (kandang.grid_y ?? 0), currentX: kandang.grid_x ?? 0, currentY: kandang.grid_y ?? 0 })
  }

  const zoomTo = (factor) => {
    const el = containerRef.current; if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const cx = width / 2; const cy = height / 2
    setViewport(prev => {
      const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor))
      return { scale: s, x: cx - (cx - prev.x) * (s / prev.scale), y: cy - (cy - prev.y) * (s / prev.scale) }
    })
  }

  const fitToScreen = () => {
    const el = containerRef.current; if (!el) return
    const { width, height } = el.getBoundingClientRect()
    if (placedKandangs.length === 0) {
      const scale = Math.min(1, Math.min(width / (GRID_W * CELL_PX), height / (GRID_H * CELL_PX)) * 0.9)
      setViewport({ x: (width - GRID_W * CELL_PX * scale) / 2, y: (height - GRID_H * CELL_PX * scale) / 2, scale }); return
    }
    let minX = GRID_W, maxX = 0, minY = GRID_H, maxY = 0
    placedKandangs.forEach(k => {
      const kw = k.panjang_m || 1; const kh = k.lebar_m || 1
      minX = Math.min(minX, k.grid_x); maxX = Math.max(maxX, k.grid_x + kw)
      minY = Math.min(minY, k.grid_y); maxY = Math.max(maxY, k.grid_y + kh)
    })
    minX = Math.max(0, minX - 1); maxX = Math.min(GRID_W, maxX + 1)
    minY = Math.max(0, minY - 1); maxY = Math.min(GRID_H, maxY + 1)
    const contentW = (maxX - minX) * CELL_PX; const contentH = (maxY - minY) * CELL_PX
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(width / contentW, height / contentH) * 0.85))
    setViewport({ scale, x: (width - contentW * scale) / 2 - (minX * CELL_PX * scale), y: (height - contentH * scale) / 2 - (minY * CELL_PX * scale) })
  }

  const drawPreview = drawStart && drawCurrent ? {
    x: Math.min(drawStart.x, drawCurrent.x), y: Math.min(drawStart.y, drawCurrent.y),
    w: Math.abs(drawCurrent.x - drawStart.x) + 1, h: Math.abs(drawCurrent.y - drawStart.y) + 1,
  } : null

  const activeCursor = spaceHeld || isPanning ? 'grabbing' : floorMode === 'draw' || placingKandang ? 'crosshair' : dragging ? 'grabbing' : 'grab'

  const gridBg = {
    backgroundImage: `
      linear-gradient(to right, rgba(255,255,255,0.11) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.11) 1px, transparent 1px),
      linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)
    `,
    backgroundSize: `${CELL_PX * MAJOR}px ${CELL_PX * MAJOR}px, ${CELL_PX * MAJOR}px ${CELL_PX * MAJOR}px, ${CELL_PX}px ${CELL_PX}px, ${CELL_PX}px ${CELL_PX}px`,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.05] shrink-0 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <button onClick={() => { setFloorMode('view'); setDrawStart(null); setDrawCurrent(null) }} className={cn('flex items-center gap-1.5 px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all', floorMode === 'view' ? 'bg-emerald-500 text-white' : 'text-[#4B6478] hover:text-white')}>
            <MousePointer size={11} /> View
          </button>
          <button onClick={() => { setFloorMode('draw'); setPlacingKandang(null) }} className={cn('flex items-center gap-1.5 px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all', floorMode === 'draw' ? 'bg-emerald-500 text-white' : 'text-[#4B6478] hover:text-white')}>
            <PenLine size={11} /> Draw
          </button>
        </div>
        {floorMode === 'draw' && <p className="text-[10px] text-[#4B6478] uppercase font-black">{drawStart ? (drawPreview ? `${drawPreview.w}m × ${drawPreview.h}m` : 'Dragging…') : 'Klik + drag untuk gambar kandang'}</p>}
        {floorMode === 'view' && !spaceHeld && !placingKandang && <p className="text-[10px] text-[#4B6478] uppercase font-black opacity-60">Klik: Detail · Edit (Double) · Drag: Pan · Scroll: Zoom</p>}
        {spaceHeld && <p className="text-[10px] text-emerald-400 font-bold uppercase animate-pulse">PAN MODE</p>}
        {placingKandang && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-400">Klik grid → tempatkan {placingKandang.name}</span>
            <button onClick={() => setPlacingKandang(null)} className="text-[#4B6478] hover:text-white ml-1"><X size={12} /></button>
          </div>
        )}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {[{ color: '#34D399', label: 'Bagus' }, { color: '#FBBF24', label: 'Cukup' }, { color: '#F87171', label: 'Rendah' }, { color: '#4B6478', label: 'N/A' }].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                <span className="text-[8px] font-black text-[#4B6478] uppercase">{l.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[#4B6478]">
            <button onClick={() => zoomTo(1.2)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-white hover:bg-white/10 transition-all"><ZoomIn size={13} /></button>
            <span className="text-[10px] font-black min-w-[38px] text-center tabular-nums">{Math.round(viewport.scale * 100)}%</span>
            <button onClick={() => zoomTo(1 / 1.2)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-white hover:bg-white/10 transition-all"><ZoomOut size={13} /></button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button onClick={fitToScreen} className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-white hover:bg-white/10 transition-all"><Maximize2 size={12} /></button>
          </div>
        </div>
      </div>

      {/* Unplaced badge bar */}
      {unplacedKandangs.length > 0 && (
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/[0.05] bg-emerald-500/[0.02] flex-wrap">
          <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest flex items-center gap-1.5"><Map size={10} /> Belum ditempatkan:</span>
          {unplacedKandangs.map(k => (
            <button key={k.id} onClick={() => { setPlacingKandang(placingKandang?.id === k.id ? null : k); setFloorMode('view') }}
              className={cn('px-2.5 py-1 rounded-lg border text-[10px] font-black transition-all uppercase tracking-wider',
                placingKandang?.id === k.id ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/[0.03] border-emerald-500/20 text-emerald-400/70 hover:border-emerald-500/50 hover:text-emerald-300')}>
              {k.name}
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-[#06090F] select-none"
        style={{ cursor: activeCursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsPanning(false); if (dragging) setDragging(null) }}
        onClick={handleClick}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${viewport.x}px,${viewport.y}px) scale(${viewport.scale})`, width: GRID_W * CELL_PX, height: GRID_H * CELL_PX, boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 0 80px rgba(0,0,0,0.7)', ...gridBg }}>
          {Array.from({ length: Math.floor(GRID_W / MAJOR) + 1 }, (_, i) => (
            <div key={`rx-${i}`} style={{ position: 'absolute', left: i * MAJOR * CELL_PX + 2, top: 3, pointerEvents: 'none', fontSize: 9, fontWeight: 700, color: 'rgba(75,100,120,0.45)' }}>{i * MAJOR}m</div>
          ))}
          {Array.from({ length: Math.floor(GRID_H / MAJOR) + 1 }, (_, i) => i > 0 && (
            <div key={`ry-${i}`} style={{ position: 'absolute', left: 3, top: i * MAJOR * CELL_PX + 2, pointerEvents: 'none', fontSize: 9, fontWeight: 700, color: 'rgba(75,100,120,0.45)' }}>{i * MAJOR}m</div>
          ))}
          {placedKandangs.map((k, idx) => (
            <PlacedKandang
              key={k.id}
              kandang={k}
              pal={PALETTE[idx % PALETTE.length]}
              animals={groupedAnimals[k.id] || []}
              dragging={dragging}
              onKandangMouseDown={handleKandangMouseDown}
              onKandangClick={onKandangClick}
              onKandangDoubleClick={onKandangDoubleClick}
              onAnimalClick={onAnimalClick}
              activeDetailKandang={activeDetailKandang}
              speciesConfig={speciesConfig}
              batchColorMap={batchColorMap}
            />
          ))}
          {drawPreview && (
            <div style={{ position: 'absolute', left: drawPreview.x * CELL_PX, top: drawPreview.y * CELL_PX, width: drawPreview.w * CELL_PX, height: drawPreview.h * CELL_PX, border: '1.5px dashed rgba(16,185,129,0.8)', background: 'rgba(16,185,129,0.07)', borderRadius: 4, pointerEvents: 'none', zIndex: 40 }}>
              <div style={{ position: 'absolute', bottom: 3, right: 5, fontSize: 9, fontWeight: 700, color: '#34D399' }}>{drawPreview.w}×{drawPreview.h}m</div>
            </div>
          )}
          {placedKandangs.length === 0 && unplacedKandangs.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.25, pointerEvents: 'none' }}>
              <Grid3X3 size={48} color="#4B6478" />
              <p style={{ marginTop: 14, fontSize: 12, fontWeight: 900, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Aktifkan Draw Mode → gambar kandang</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
