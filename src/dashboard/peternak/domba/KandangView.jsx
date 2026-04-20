import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, LayoutGrid, Box, HelpCircle, ArrowRightLeft, Ruler, Info,
  X, TrendingUp, Scale, Calendar, Activity, ChevronRight, Clock,
  Map, Grid3X3, MousePointer, PenLine, ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useDombaActiveBatches,
  useDombaAnimals,
  useDombaKandangs,
  useCreateDombaKandang,
  useUpdateDombaKandang,
  useMoveDombaToKandang,
  useEnsureDombaHoldingPen,
  useUpdateDombaKandangPosition,
  useDeleteDombaKandang,
  calcADGFromRecords,
  calcHariDiFarm,
} from '@/lib/hooks/useDombaPenggemukanData'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrokerPageHeader } from '../../_shared/components/transactions/BrokerPageHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TARGET_HARI = 120 // Target penggemukan domba lebih singkat

// ── Floor plan constants ───────────────────────────────────────────────────────
const CELL_PX   = 32    // pixels per meter
const GRID_W    = 100   // canvas width  in meters
const GRID_H    = 80    // canvas height in meters
const MAJOR     = 5     // major grid line every N meters
const MIN_SCALE = 0.15
const MAX_SCALE = 4

const PALETTE = [
  { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.55)',  text: '#6EE7B7' }, // Emerald
  { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.55)',  text: '#93C5FD' }, // Blue
  { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.55)',  text: '#FCD34D' }, // Amber
  { bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.55)',  text: '#C4B5FD' }, // Violet
  { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.55)',   text: '#FCA5A5' }, // Red
  { bg: 'rgba(236,72,153,0.15)',  border: 'rgba(236,72,153,0.55)',  text: '#F9A8D4' }, // Pink
  { bg: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.55)',   text: '#67E8F9' }, // Cyan
  { bg: 'rgba(132,204,22,0.15)',  border: 'rgba(132,204,22,0.55)',  text: '#BEF264' }, // Lime
]

// ── Roaming Sheep Component ─────────────────────────────────────────────────
const RoamingSheep = ({ animal, bounds, dotColor, onClick }) => {
  const weight = animal.latest_weight_kg || animal.entry_weight_kg || 20
  // Biological scaling for sheep based on ID research: 
  // 20kg ~ 0.54m | 40kg ~ 1.05m | 60kg ~ 1.30m
  const lengthMeters = 0.06 * Math.pow(weight, 0.77)
  const iconSize     = lengthMeters * CELL_PX

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
      animate={{ x: target.x * CELL_PX, y: target.y * CELL_PX }}
      transition={{ duration: isIdle ? 0 : 6 + Math.random() * 12, ease: "linear" }}
      onAnimationComplete={() => setIsIdle(true)}
      onClick={(e) => { e.stopPropagation(); onClick(animal) }}
      style={{
        position: 'absolute',
        width: iconSize, height: iconSize,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        fontSize: iconSize,
        zIndex: 20,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
      }}
    >
      <div style={{ transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)', transition: 'transform 0.4s ease-out' }}>
        🐑
      </div>
      <div style={{
        position: 'absolute', top: -iconSize/6, right: -iconSize/6,
        width: iconSize/2.5, height: iconSize/2.5, borderRadius: '50%',
        background: dotColor, border: '1.2px solid rgba(0,0,0,0.5)',
        boxShadow: `0 0 4px ${dotColor}`,
      }} />
    </motion.div>
  )
}

function getADGTier(adgKg) {
  if (!adgKg) return { color: 'text-[#4B6478]', dot: 'bg-[#4B6478]/40', border: 'border-white/5', bg: 'bg-white/[0.03]', label: '—', dotColor: '#4B6478' }
  if (adgKg >= 0.25) return { color: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/[0.06]', label: `${adgKg.toFixed(2)} kg`, dotColor: '#34D399' }
  if (adgKg >= 0.15) return { color: 'text-amber-400', dot: 'bg-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/[0.06]', label: `${adgKg.toFixed(2)} kg`, dotColor: '#FBBF24' }
  return { color: 'text-red-400', dot: 'bg-red-400', border: 'border-red-500/30', bg: 'bg-red-500/[0.06]', label: `${adgKg.toFixed(2)} kg`, dotColor: '#F87171' }
}

// ── AnimalToken ───────────────────────────────────────────────────────────────
function AnimalToken({ animal, onClick, onDragStart }) {
  const adg = calcADGFromRecords(animal.domba_penggemukan_weight_records, animal.entry_date, animal.entry_weight_kg)
  const adgKg = adg ? adg / 1000 : null
  const tier  = getADGTier(adgKg)
  const latestWeight = animal.latest_weight_kg || animal.entry_weight_kg
  return (
    <motion.div
      layout layoutId={`animal-${animal.id}`} draggable
      onDragStart={(e) => onDragStart(e, animal)} onClick={onClick}
      className={cn('relative border rounded-xl p-2.5 cursor-pointer select-none transition-all duration-200', tier.bg, tier.border, 'hover:brightness-125 active:scale-[0.97]')}
      whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
    >
      <div className={cn('absolute top-2 right-2 w-1.5 h-1.5 rounded-full', tier.dot)} />
      <div className="flex items-center gap-1.5 mb-1.5 pr-3">
        <span className="text-[11px] leading-none">🐑</span>
        <span className="text-[11px] font-['Sora'] font-black text-white truncate max-w-[72px]" title={animal.ear_tag}>{animal.ear_tag}</span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold text-[#4B6478]">{latestWeight} kg</span>
        <span className={cn('text-[10px] font-black', tier.color)}>{adgKg ? `${adgKg.toFixed(2)}↑` : '—'}</span>
      </div>
    </motion.div>
  )
}

// ── AnimalDetailSheet ─────────────────────────────────────────────────────────
function AnimalDetailSheet({ animal, kandangs, batchId, onClose, onMove }) {
  const adg = calcADGFromRecords(animal.domba_penggemukan_weight_records, animal.entry_date, animal.entry_weight_kg)
  const adgKg     = adg ? adg / 1000 : null
  const tier      = getADGTier(adgKg)
  const hari      = calcHariDiFarm(animal.entry_date, animal.exit_date)
  const latestW   = animal.latest_weight_kg || animal.entry_weight_kg
  const pbbh      = (latestW - animal.entry_weight_kg).toFixed(1)
  const daysRatio = Math.min(100, (hari / TARGET_HARI) * 100)
  const sisiHari  = Math.max(0, TARGET_HARI - hari)

  const recentRecords = useMemo(() => {
    if (!animal.domba_penggemukan_weight_records?.length) return []
    return [...animal.domba_penggemukan_weight_records]
      .sort((a, b) => new Date(b.weigh_date) - new Date(a.weigh_date)).slice(0, 4)
  }, [animal.domba_penggemukan_weight_records])

  const moveTargets = kandangs.filter(k => !k.is_holding && k.id !== animal.kandang_id)
  const SEX_LABEL = { jantan: 'Jantan', betina: 'Betina', jantan_kastrasi: 'Jantan (Kastrasi)' }

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-y-0 right-0 w-[380px] max-w-full z-50 bg-[#0A1015]/97 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_50px_rgba(0,0,0,0.7)] flex flex-col"
    >
      <div className="absolute -top-10 right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="px-6 pt-8 pb-4 border-b border-white/[0.05] shrink-0 relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🐑</span>
              <h2 className="font-['Sora'] font-black text-xl text-white tracking-tight">{animal.ear_tag}</h2>
              <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border', tier.bg, tier.color, tier.border)}>
                {tier.label === '—' ? 'Belum timbang' : `ADG ${tier.label}`}
              </span>
            </div>
            <p className="text-[11px] text-[#4B6478]">
              {animal.breed || 'Breed —'} · {SEX_LABEL[animal.sex] || animal.sex}
              {animal.age_estimate ? ` · ±${animal.age_estimate} bln saat masuk` : ''}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Hari di Farm', value: `${hari} hr`,        icon: Calendar,  color: 'text-white' },
            { label: 'ADG',          value: adgKg ? `${adgKg.toFixed(2)} kg` : '—', icon: TrendingUp, color: tier.color },
            { label: 'PBBH',         value: `+${pbbh} kg`,       icon: Scale,     color: parseFloat(pbbh) > 0 ? 'text-emerald-400' : 'text-[#4B6478]' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-3 text-center">
              <kpi.icon size={12} className={cn('mx-auto mb-1.5 opacity-60', kpi.color)} />
              <p className={cn('text-sm font-black', kpi.color)}>{kpi.value}</p>
              <p className="text-[9px] text-[#4B6478] mt-0.5 uppercase tracking-wider">{kpi.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest flex items-center gap-1.5"><Clock size={10} /> Progress Penggemukan</span>
            <span className={cn('text-[10px] font-black', hari >= TARGET_HARI ? 'text-red-400' : 'text-[#4B6478]')}>
              {hari >= TARGET_HARI ? '🔴 OVERDUE' : `${sisiHari} hari lagi`}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-1.5">
            <motion.div initial={{ width: 0 }} animate={{ width: `${daysRatio}%` }} transition={{ duration: 0.8, delay: 0.1 }}
              className={cn('h-full rounded-full', hari >= TARGET_HARI ? 'bg-red-500' : daysRatio > 80 ? 'bg-emerald-500' : 'bg-emerald-400')} />
          </div>
          <div className="flex justify-between text-[10px] text-[#4B6478]">
            <span>Masuk: {animal.entry_date ? new Date(animal.entry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—'}</span>
            <span>Target {TARGET_HARI} hari</span>
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-3 flex items-center gap-1.5"><Scale size={10} /> Bobot</p>
          <div className="flex items-stretch gap-3">
            <div className="flex-1 text-center bg-white/[0.03] rounded-xl p-3">
              <p className="text-[10px] text-[#4B6478] mb-0.5">Masuk</p>
              <p className="text-lg font-black text-white">{animal.entry_weight_kg}<span className="text-[10px] text-[#4B6478] ml-0.5">kg</span></p>
            </div>
            <div className="flex items-center"><ChevronRight size={14} className="text-[#4B6478]" /></div>
            <div className="flex-1 text-center bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-3">
              <p className="text-[10px] text-[#4B6478] mb-0.5">Terkini</p>
              <p className="text-lg font-black text-emerald-300">{latestW}<span className="text-[10px] text-[#4B6478] ml-0.5">kg</span></p>
            </div>
          </div>
        </div>
        {recentRecords.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-2.5 flex items-center gap-1.5"><Activity size={10} /> Riwayat Timbang</p>
            <div className="space-y-0">
              {recentRecords.map((r, i) => {
                const rADGKg = r.adg_since_last ? r.adg_since_last / 1000 : null
                const rTier  = getADGTier(rADGKg)
                return (
                  <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', i === 0 ? 'bg-emerald-400' : 'bg-white/10')} />
                      <span className="text-[11px] text-[#4B6478]">{new Date(r.weigh_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-bold text-white">{r.weight_kg} kg</span>
                      {rADGKg !== null && <span className={cn('text-[10px] font-bold', rTier.color)}>{rADGKg >= 0 ? '+' : ''}{rADGKg.toFixed(2)} kg/hr</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {moveTargets.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-2.5 flex items-center gap-1.5"><ArrowRightLeft size={10} /> Pindah ke Kandang</p>
            <div className="flex flex-wrap gap-2">
              {moveTargets.map(k => (
                <button key={k.id} onClick={() => onMove(k)} className="px-3 py-1.5 bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] rounded-xl text-[11px] font-bold text-white transition-all">
                  {k.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── BatchSummaryBar ───────────────────────────────────────────────────────────
function BatchSummaryBar({ animals, holdingCount }) {
  const stats = useMemo(() => {
    const active    = animals.filter(a => a.status === 'active')
    const allocated = active.length - holdingCount
    const adgList   = active.map(a => { const adg = calcADGFromRecords(a.domba_penggemukan_weight_records, a.entry_date, a.entry_weight_kg); return adg ? adg / 1000 : null }).filter(v => v !== null)
    const avgADG    = adgList.length ? adgList.reduce((s, v) => s + v, 0) / adgList.length : null
    const avgDays   = active.length ? Math.round(active.reduce((s, a) => s + calcHariDiFarm(a.entry_date), 0) / active.length) : 0
    return { total: active.length, allocated, holding: holdingCount, avgADG, avgDays }
  }, [animals, holdingCount])
  const adgTier = getADGTier(stats.avgADG)
  const pills = [
    { label: 'Total Aktif', value: `${stats.total} ekor`,    color: 'text-white',    bg: 'bg-white/[0.03] border-white/[0.06]' },
    { label: 'Teralokasi',  value: `${stats.allocated} ekor`, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.06] border-emerald-500/20' },
    { label: 'Holding',     value: `${stats.holding} ekor`,  color: stats.holding > 0 ? 'text-amber-300' : 'text-[#4B6478]', bg: 'bg-white/[0.03] border-white/[0.06]' },
    { label: 'Avg ADG',     value: stats.avgADG ? `${stats.avgADG.toFixed(2)} kg/hr` : '—', color: adgTier.color, bg: 'bg-white/[0.03] border-white/[0.06]' },
    { label: 'Avg Hari',    value: `${stats.avgDays} hr`,    color: stats.avgDays >= TARGET_HARI ? 'text-red-400' : 'text-white', bg: 'bg-white/[0.03] border-white/[0.06]' },
  ]
  return (
    <div className="flex items-center gap-2 flex-wrap mb-6">
      {pills.map(p => (
        <div key={p.label} className={cn('flex items-center gap-2 px-3.5 py-2 rounded-2xl border', p.bg)}>
          <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider">{p.label}</span>
          <span className={cn('text-[11px] font-black', p.color)}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── KandangBox ────────────────────────────────────────────────────────────────
function KandangBox({ kandang, animalsInKandang, dragOver, onDragOver, onDragLeave, onDrop, onAnimalClick, onKandangDoubleClick }) {
  const isOver    = dragOver === kandang.id
  const isFull    = kandang.capacity > 0 && animalsInKandang.length >= kandang.capacity
  const isHolding = kandang.is_holding

  let borderColor = 'border-white/[0.04]'
  let bgGradient  = 'bg-white/[0.01]'
  if (isOver) {
    borderColor = isFull && !isHolding ? 'border-red-500 ring-4 ring-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
    bgGradient  = isFull && !isHolding ? 'bg-red-500/[0.08]' : 'bg-emerald-500/[0.08]'
  } else if (isHolding) {
    borderColor = 'border-dashed border-emerald-500/20 hover:border-emerald-500/40'
    bgGradient  = 'bg-emerald-500/[0.02]'
  }

  const capacityRatio = !isHolding && kandang.capacity > 0 ? (animalsInKandang.length / kandang.capacity) : 0
  let capColor = 'text-[#4B6478]'; let capBg = 'bg-white/[0.03]'; let progressColor = 'bg-[#4B6478]'
  if (capacityRatio >= 1)        { capColor = 'text-red-400';   capBg = 'bg-red-500/10';   progressColor = 'bg-red-500' }
  else if (capacityRatio >= 0.8) { capColor = 'text-amber-400'; capBg = 'bg-amber-500/10'; progressColor = 'bg-amber-500' }
  else if (capacityRatio > 0)    { capColor = 'text-emerald-400'; capBg = 'bg-emerald-500/10'; progressColor = 'bg-emerald-500' }

  const kandangStats = useMemo(() => {
    if (!animalsInKandang.length) return null
    const adgList   = animalsInKandang.map(a => { const adg = calcADGFromRecords(a.domba_penggemukan_weight_records, a.entry_date, a.entry_weight_kg); return adg ? adg / 1000 : null }).filter(v => v !== null)
    const avgWeight = animalsInKandang.reduce((s, a) => s + (a.latest_weight_kg || a.entry_weight_kg || 0), 0) / animalsInKandang.length
    const totalPBBH = animalsInKandang.reduce((s, a) => s + ((a.latest_weight_kg || a.entry_weight_kg || 0) - (a.entry_weight_kg || 0)), 0)
    const avgADG    = adgList.length ? adgList.reduce((s, v) => s + v, 0) / adgList.length : null
    return { avgWeight: avgWeight.toFixed(0), totalPBBH: totalPBBH.toFixed(1), avgADG }
  }, [animalsInKandang])
  const statsADGTier = getADGTier(kandangStats?.avgADG)

  return (
    <motion.div
      variants={{ shake: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } }, idle: { x: 0 } }}
      animate={isOver && isFull && !isHolding ? 'shake' : 'idle'}
      onDragOver={(e) => onDragOver(e, kandang)} onDragLeave={onDragLeave} onDrop={(e) => onDrop(e, kandang)}
      onDoubleClick={() => onKandangDoubleClick(kandang)}
      className={cn('group h-full flex flex-col rounded-[2.5rem] border-2 transition-all duration-300 relative overflow-hidden shadow-2xl cursor-pointer', borderColor, bgGradient)}
    >
      <div className="absolute -bottom-6 -right-6 text-[90px] font-black text-white/[0.02] pointer-events-none select-none italic">{kandang.name.split('-').pop()}</div>
      <div className={cn('px-5 pt-5 pb-4 flex flex-col gap-2.5 relative z-10 shrink-0', isHolding ? 'bg-emerald-500/[0.02]' : 'bg-white/[0.01]')}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              {isHolding ? <Box size={16} className="text-emerald-400" /> : <LayoutGrid size={16} className="text-emerald-400" />}
            </div>
            <div>
              <h3 className="font-['Sora'] font-black text-white text-sm tracking-tight uppercase leading-tight">{kandang.name}</h3>
              {!isHolding && kandang.panjang_m
                ? <p className="text-[10px] font-black text-[#4B6478] opacity-50 flex items-center gap-1 mt-0.5"><Ruler size={9} /> {kandang.panjang_m}×{kandang.lebar_m}m ({ (kandang.panjang_m * kandang.lebar_m).toFixed(1) }m²)</p>
                : <p className="text-[10px] font-black text-[#4B6478] opacity-50 mt-0.5">{isHolding ? 'Area Holding' : 'Kandang Produksi'}</p>
              }
            </div>
          </div>
          <div className={cn('px-2.5 py-1 rounded-xl border font-black text-[12px] tabular-nums shadow-inner shrink-0', capBg, capColor, 'border-white/5')}>
            {animalsInKandang.length}{!isHolding ? `/${kandang.capacity}` : ' ekor'}
          </div>
        </div>
        {!isHolding && (
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, capacityRatio * 100)}%` }} className={cn('h-full rounded-full', progressColor)} />
          </div>
        )}
        {kandangStats && !isHolding && (
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <div className="text-center bg-white/[0.03] rounded-xl py-2">
              <p className="text-[11px] font-black text-white">{kandangStats.avgWeight} kg</p>
              <p className="text-[8px] text-[#4B6478] font-bold uppercase tracking-wider mt-0.5">Avg Berat</p>
            </div>
            <div className="text-center bg-white/[0.03] rounded-xl py-2">
              <p className={cn('text-[11px] font-black', statsADGTier.color)}>{kandangStats.avgADG ? kandangStats.avgADG.toFixed(2) : '—'}</p>
              <p className="text-[8px] text-[#4B6478] font-bold uppercase tracking-wider mt-0.5">Avg ADG kg</p>
            </div>
            <div className="text-center bg-white/[0.03] rounded-xl py-2">
              <p className={cn('text-[11px] font-black', parseFloat(kandangStats.totalPBBH) > 0 ? 'text-emerald-400' : 'text-[#4B6478]')}>+{kandangStats.totalPBBH}</p>
              <p className="text-[8px] text-[#4B6478] font-bold uppercase tracking-wider mt-0.5">PBBH Total</p>
            </div>
          </div>
        )}
      </div>
      <div className={cn('p-4 flex-1 overflow-y-auto no-scrollbar relative z-10', animalsInKandang.length === 0 ? 'flex items-center justify-center' : 'grid grid-cols-2 gap-2 content-start')}>
        <AnimatePresence mode="popLayout">
          {animalsInKandang.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center opacity-20 -translate-y-2">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center mb-2"><Plus size={16} /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center">Empty</p>
            </motion.div>
          ) : (
            animalsInKandang.map(a => <AnimalToken key={a.id} animal={a} onClick={() => onAnimalClick(a)} onDragStart={onDragStart} />)
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function onDragStart(e, animal) {
  e.dataTransfer.setData('animalId', animal.id)
  e.dataTransfer.effectAllowed = 'move'
  const ghost = e.currentTarget.cloneNode(true)
  ghost.style.position = 'absolute'; ghost.style.top = '-1000px'
  document.body.appendChild(ghost)
  e.dataTransfer.setDragImage(ghost, 0, 0)
  setTimeout(() => ghost.remove(), 0)
}

// ── DenahLantai ───────────────────────────────────────────────────────────────
function PlacedKandang({ 
  kandang, pal, animals, dragging, onKandangMouseDown, 
  onKandangClick, onKandangDoubleClick, onAnimalClick,
  activeDetailKandang 
}) {
  const isDraggingThis = dragging?.kandang.id === kandang.id
  const kw = kandang.panjang_m || 5
  const kh = kandang.lebar_m   || 4
  const gx = isDraggingThis ? dragging.currentX : (kandang.grid_x ?? 0)
  const gy = isDraggingThis ? dragging.currentY : (kandang.grid_y ?? 0)

  const hoverTimerRef = useRef(null)

  const handleMouseEnter = () => {
    if (activeDetailKandang?.id === kandang.id) return
    hoverTimerRef.current = setTimeout(() => { onKandangClick(kandang) }, 3000)
  }

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null }
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: gx * CELL_PX, top: gy * CELL_PX,
        width: kw * CELL_PX, height: kh * CELL_PX,
        border: `1.5px solid ${pal.border}`,
        background: pal.bg, borderRadius: 6, overflow: 'hidden',
        cursor: isDraggingThis ? 'grabbing' : 'grab',
        zIndex: isDraggingThis ? 30 : 10,
        transition: isDraggingThis ? 'none' : 'left 0.1s ease, top 0.1s ease',
        boxShadow: isDraggingThis ? '0 8px 30px rgba(0,0,0,0.5)' : undefined,
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
          const adg   = calcADGFromRecords(a.domba_penggemukan_weight_records, a.entry_date, a.entry_weight_kg)
          const adgKg = adg ? adg / 1000 : null
          const tier  = getADGTier(adgKg)
          return (
            <RoamingSheep
              key={a.id}
              animal={a}
              bounds={{ w: kw, h: kh - 1 }}
              dotColor={tier.dotColor}
              onClick={onAnimalClick}
            />
          )
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 8, color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }}>{kw}×{kh}m</div>
    </div>
  )
}

function DenahLantai({ 
  kandangs, groupedAnimals, selectedBatch, 
  onAnimalClick, onKandangClick, onKandangDoubleClick,
  activeDetailKandang,
  floorMode, setFloorMode,
  placingKandang, setPlacingKandang,
  drawStart, setDrawStart,
  drawCurrent, setDrawCurrent,
  pendingRect, setPendingRect,
  pendingName, setPendingName,
  dragging, setDragging
}) {
  const containerRef   = useRef(null)
  const createKandang  = useCreateDombaKandang()
  const updatePosition = useUpdateDombaKandangPosition()

  const [viewport,  setViewport]  = useState({ x: 24, y: 24, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart,  setPanStart]  = useState({ mx: 0, my: 0, vx: 0, vy: 0 })
  const [spaceHeld, setSpaceHeld] = useState(false)

  const handleWheel = React.useCallback((e) => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return
    const rect   = el.getBoundingClientRect()
    const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top
    const factor = Math.exp(-e.deltaY * 0.0012)
    setViewport(prev => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor))
      const ratio    = newScale / prev.scale
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
    const up   = (e) => { if (e.code === 'Space') setSpaceHeld(false) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup',   up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  const placedKandangs   = kandangs.filter(k => !k.is_holding && k.grid_x != null && k.grid_y != null)
  const unplacedKandangs = kandangs.filter(k => !k.is_holding && (k.grid_x == null || k.grid_y == null))

  const getCell = (e) => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(Math.floor((e.clientX - rect.left  - viewport.x) / (CELL_PX * viewport.scale)), GRID_W - 1)),
      y: Math.max(0, Math.min(Math.floor((e.clientY - rect.top   - viewport.y) / (CELL_PX * viewport.scale)), GRID_H - 1)),
    }
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handleMouseDown = (e) => {
    if (e.button === 1 || spaceHeld) {
      e.preventDefault(); setIsPanning(true)
      setPanStart({ mx: e.clientX, my: e.clientY, vx: viewport.x, vy: viewport.y })
      return
    }
    if (e.button !== 0) return
    if (floorMode === 'draw') {
      const cell = getCell(e); setDrawStart(cell); setDrawCurrent(cell)
      return
    }
    // view mode + empty space -> pan
    setIsPanning(true)
    setPanStart({ mx: e.clientX, my: e.clientY, vx: viewport.x, vy: viewport.y })
  }

  const handleMouseMove = (e) => {
    if (isPanning) {
      setViewport(prev => ({ ...prev, x: panStart.vx + e.clientX - panStart.mx, y: panStart.vy + e.clientY - panStart.my }))
      return
    }
    if (dragging) {
      const cell = getCell(e)
      const kw   = dragging.kandang.panjang_m || 5; const kh = dragging.kandang.lebar_m || 4
      setDragging(prev => ({ ...prev, currentX: Math.max(0, Math.min(cell.x - prev.offsetX, GRID_W - kw)), currentY: Math.max(0, Math.min(cell.y - prev.offsetY, GRID_H - kh)) }))
      return
    }
    if (floorMode === 'draw' && drawStart) setDrawCurrent(getCell(e))
  }

  const handleMouseUp = () => {
    if (isPanning) { setIsPanning(false); return }
    if (dragging) {
      const k = dragging.kandang
      if (dragging.currentX !== (k.grid_x ?? 0) || dragging.currentY !== (k.grid_y ?? 0)) {
        updatePosition.mutate({ kandangId: k.id, batchId: selectedBatch, grid_x: dragging.currentX, grid_y: dragging.currentY })
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
    updatePosition.mutate({ kandangId: placingKandang.id, batchId: selectedBatch, grid_x: cell.x, grid_y: cell.y }, {
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
            {[{ color: '#34D399', label: '≥0.25' }, { color: '#FBBF24', label: '0.15–0.25' }, { color: '#F87171', label: '<0.15' }, { color: '#4B6478', label: 'N/A' }].map(l => (
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

      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#06090F] select-none" style={{ cursor: activeCursor }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { setIsPanning(false); if (dragging) setDragging(null) }} onClick={handleClick}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${viewport.x}px,${viewport.y}px) scale(${viewport.scale})`, width: GRID_W * CELL_PX, height: GRID_H * CELL_PX, boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 0 80px rgba(0,0,0,0.7)', ...gridBg }}>
          {Array.from({ length: Math.floor(GRID_W / MAJOR) + 1 }, (_, i) => (
            <div key={`rx-${i}`} style={{ position: 'absolute', left: i * MAJOR * CELL_PX + 2, top: 3, pointerEvents: 'none', fontSize: 9, fontWeight: 700, color: 'rgba(75,100,120,0.45)' }}>{i * MAJOR}m</div>
          ))}
          {Array.from({ length: Math.floor(GRID_H / MAJOR) + 1 }, (_, i) => i > 0 && (
            <div key={`ry-${i}`} style={{ position: 'absolute', left: 3, top: i * MAJOR * CELL_PX + 2, pointerEvents: 'none', fontSize: 9, fontWeight: 700, color: 'rgba(75,100,120,0.45)' }}>{i * MAJOR}m</div>
          ))}
          {placedKandangs.map((k, idx) => (
            <PlacedKandang key={k.id} kandang={k} pal={PALETTE[idx % PALETTE.length]} animals={groupedAnimals[k.id] || []} dragging={dragging} onKandangMouseDown={handleKandangMouseDown} onKandangClick={onKandangClick} onKandangDoubleClick={onKandangDoubleClick} onAnimalClick={onAnimalClick} activeDetailKandang={activeDetailKandang} />
          ))}
          {drawPreview && <div style={{ position: 'absolute', left: drawPreview.x * CELL_PX, top: drawPreview.y * CELL_PX, width: drawPreview.w * CELL_PX, height: drawPreview.h * CELL_PX, border: '1.5px dashed rgba(16,185,129,0.8)', background: 'rgba(16,185,129,0.07)', borderRadius: 4, pointerEvents: 'none', zIndex: 40 }}><div style={{ position: 'absolute', bottom: 3, right: 5, fontSize: 9, fontWeight: 700, color: '#34D399' }}>{drawPreview.w}×{drawPreview.h}m</div></div>}
          {placedKandangs.length === 0 && unplacedKandangs.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.25, pointerEvents: 'none' }}>
              <Grid3X3 size={48} color="#4B6478" /><p style={{ marginTop: 14, fontSize: 12, fontWeight: 900, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Aktifkan Draw Mode → gambar kandang</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── main DombaKandangView ───────────────────────────────────────────────────
export default function DombaKandangView() {
  const { data: batches = [], isLoading: loadingBatches } = useDombaActiveBatches()
  const [selectedBatch, setSelectedBatch] = useState('')
  const [viewMode, setViewMode] = useState('helicopter')

  useEffect(() => { if (batches.length > 0 && !selectedBatch) setSelectedBatch(batches[0].id) }, [batches, selectedBatch])

  const { data: kandangs = [], isLoading: loadKdg } = useDombaKandangs(selectedBatch)
  const { data: animals  = [], isLoading: loadAni } = useDombaAnimals(selectedBatch)
  const ensureHoldingPen = useEnsureDombaHoldingPen()

  useEffect(() => { if (selectedBatch) ensureHoldingPen.mutate(selectedBatch) }, [selectedBatch])

  const createKandang = useCreateDombaKandang()
  const updateKdg     = useUpdateDombaKandang()
  const moveAnimal    = useMoveDombaToKandang()
  const deleteKandang = useDeleteDombaKandang()

  const [dragOverKandang, setDragOverKandang] = useState(null)
  const [addSheet, setAddSheet] = useState(false)
  const [editingKandang, setEditingKandang] = useState(null)
  const [activeDetailKandang, setActiveDetailKandang] = useState(null)
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [calcMode, setCalcMode] = useState('dimensi')
  const [form, setForm] = useState({ name: '', capacity: '', panjang: '', lebar: '', standard: '1.5' })

  // Lifted states for DenahLantai context
  const [floorMode, setFloorMode] = useState('view')
  const [placingKandang, setPlacingKandang] = useState(null)
  const [drawStart, setDrawStart] = useState(null)
  const [drawCurrent, setDrawCurrent] = useState(null)
  const [pendingRect, setPendingRect] = useState(null)
  const [pendingName, setPendingName] = useState('')
  const [dragging, setDragging] = useState(null)

  const groupedAnimals = useMemo(() => {
    const map = {}; kandangs.forEach(k => { map[k.id] = [] })
    const active = animals.filter(a => a.status === 'active')
    active.forEach(a => {
      if (a.kandang_id && map[a.kandang_id]) map[a.kandang_id].push(a)
      else { const hp = kandangs.find(k => k.is_holding); if (hp) map[hp.id].push(a) }
    })
    return map
  }, [animals, kandangs])

  const holdingPen = kandangs.find(k => k.is_holding)
  const holdingCount = holdingPen ? (groupedAnimals[holdingPen.id]?.length || 0) : 0

  const handleDragOver = (e, k) => { e.preventDefault(); if (dragOverKandang !== k.id) setDragOverKandang(k.id) }
  const handleDrop = (e, targetK) => {
    e.preventDefault(); setDragOverKandang(null); const animalId = e.dataTransfer.getData('animalId')
    if (!animalId) return; const animal = animals.find(a => a.id === animalId)
    if (!animal || animal.kandang_id === targetK.id) return
    if (!targetK.is_holding && targetK.capacity > 0 && (groupedAnimals[targetK.id]?.length || 0) >= targetK.capacity) return toast.error(`Kandang ${targetK.name} penuh!`)
    moveAnimal.mutate({ animalId, kandangId: targetK.id, kandangSlot: targetK.name, batchId: selectedBatch }, { onSuccess: () => toast.success(`${animal.ear_tag} dipindah ke ${targetK.name}`) })
  }

  const handleMoveFromSheet = (targetK) => {
    if (!selectedAnimal) return; const current = groupedAnimals[targetK.id]?.length || 0
    if (!targetK.is_holding && targetK.capacity > 0 && current >= targetK.capacity) return toast.error(`Kandang ${targetK.name} penuh!`)
    moveAnimal.mutate({ animalId: selectedAnimal.id, kandangId: targetK.id, kandangSlot: targetK.name, batchId: selectedBatch }, { onSuccess: () => { toast.success(`${selectedAnimal.ear_tag} dipindah ke ${targetK.name}`); setSelectedAnimal(null) } })
  }

  const handleSavePendingRect = () => {
    if (!pendingName.trim() || !pendingRect) return
    createKandang.mutate({
      batch_id: selectedBatch, name: pendingName.trim().toUpperCase(),
      capacity: Math.max(1, Math.floor((pendingRect.w * pendingRect.h) / 1.5)), // 1.5 m2 per sheep
      panjang_m: pendingRect.w, lebar_m: pendingRect.h,
      grid_x: pendingRect.x, grid_y: pendingRect.y, is_holding: false,
    }, { onSuccess: () => { setPendingRect(null); setPendingName('') } })
  }

  const previewCapacity = useMemo(() => { const p = parseFloat(form.panjang), l = parseFloat(form.lebar); return (p && l) ? Math.floor((p * l) / parseFloat(form.standard)) : 0 }, [form.panjang, form.lebar, form.standard, calcMode])

  const handleSaveKandang = () => {
    if (!form.name) return toast.error('Nama wajib diisi')
    let cap = 0, p = null, l = null
    if (calcMode === 'dimensi') { p = parseFloat(form.panjang); l = parseFloat(form.lebar); if (!p || !l) return toast.error('Dimensi wajib diisi'); cap = Math.floor((p * l) / parseFloat(form.standard)) }
    else { cap = parseInt(form.capacity); if (!cap || cap <= 0) return toast.error('Kapasitas tidak valid') }
    createKandang.mutate({ batch_id: selectedBatch, name: form.name, capacity: cap, panjang_m: p, lebar_m: l, is_holding: false }, { onSuccess: () => { setAddSheet(false); setForm({ name: '', capacity: '', panjang: '', lebar: '', standard: '1.5' }) } })
  }

  const handleDeleteKandang = (id) => {
    if (groupedAnimals[id]?.length > 0) return toast.error('Pindahkan domba terlebih dahulu!')
    if (!confirm('Hapus kandang ini?')) return
    deleteKandang.mutate({ kandangId: id, batchId: selectedBatch }, { onSuccess: () => setEditingKandang(null) })
  }

  if (loadingBatches) return <LoadingSpinner fullPage />
  const normalKandangs = kandangs.filter(k => !k.is_holding)

  return (
    <div className="flex flex-col bg-[#06090F]" style={{ height: 'calc(100svh - 60px)', margin: '-24px -32px', overflow: 'hidden' }}>
      <BrokerPageHeader title={viewMode === 'helicopter' ? 'Helicopter View' : 'Denah Lantai'} subtitle={viewMode === 'helicopter' ? 'Manajemen visual alokasi kandang domba.' : 'Skala riil 1:1 (1 kotak = 1 meter).'} icon={<LayoutGrid size={20} className="text-emerald-400" />}
        actionButton={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl">
              <button onClick={() => { setViewMode('helicopter'); setFloorMode('view') }} className={cn('flex items-center gap-1.5 px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all', viewMode === 'helicopter' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-[#4B6478] hover:text-white')}><LayoutGrid size={11} /> Grid</button>
              <button onClick={() => setViewMode('denah')} className={cn('flex items-center gap-1.5 px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all', viewMode === 'denah' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-[#4B6478] hover:text-white')}><Map size={11} /> Denah</button>
            </div>
            <div className="flex items-center gap-2 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl pr-3">
              <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className="bg-transparent h-8 pl-3 text-[11px] font-black uppercase tracking-widest text-emerald-400 focus:outline-none cursor-pointer">
                {batches.map(b => <option key={b.id} value={b.id} className="bg-[#121A21]">{b.batch_code}</option>)}
              </select>
              <div className="w-px h-4 bg-white/10" /><span className="text-[10px] font-black text-[#4B6478] uppercase min-w-[80px]">{animals.filter(a => a.status === 'active').length} EKOR</span>
            </div>
            {selectedBatch && <Button onClick={() => setAddSheet(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest h-10 px-5 rounded-xl shadow-lg shadow-emerald-500/30 gap-2"><Plus size={16} /> Kandang</Button>}
          </div>
        }
      />

      <AnimatePresence>
        {selectedAnimal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedAnimal(null)} />
            <AnimalDetailSheet animal={selectedAnimal} kandangs={kandangs} batchId={selectedBatch} onClose={() => setSelectedAnimal(null)} onMove={handleMoveFromSheet} />
          </>
        )}
        {activeDetailKandang && (
          <div className="fixed bottom-10 right-10 z-[60] w-72 pointer-events-none">
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="bg-[#0C1319]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl pointer-events-auto">
              <div className="flex justify-between items-start mb-6">
                <div><h3 className="font-['Sora'] font-black text-white uppercase tracking-tight text-lg leading-tight">{activeDetailKandang.name}</h3><p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Detail Inventaris</p></div>
                <button onClick={() => setActiveDetailKandang(null)} className="p-2 hover:bg-white/10 rounded-full transition text-[#4B6478] hover:text-white"><X size={16} /></button>
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar pr-2 mb-6">
                {(groupedAnimals[activeDetailKandang.id] || []).map(a => (
                  <div key={a.id} onClick={() => setSelectedAnimal(a)} className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl hover:bg-white/[0.06] transition cursor-pointer group">
                    <div className="flex items-center gap-3"><span className="text-sm">🐑</span><span className="text-xs font-black text-white uppercase group-hover:text-emerald-400 transition">{a.ear_tag}</span></div>
                    <span className="text-[10px] font-bold text-[#4B6478]">{a.latest_weight_kg || a.entry_weight_kg} kg</span>
                  </div>
                ))}
                {(groupedAnimals[activeDetailKandang.id] || []).length === 0 && <p className="text-center py-8 text-[10px] font-black text-[#4B6478] uppercase tracking-widest opacity-40">Kosong</p>}
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
                <span>Populasi</span><span className="text-white">{(groupedAnimals[activeDetailKandang.id] || []).length} / {activeDetailKandang.capacity} Ekor</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!selectedBatch ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40"><LayoutGrid size={48} className="text-[#4B6478] mb-4" /><p className="font-['Sora'] font-black text-white uppercase tracking-[0.2em]">Pilih Batch Terlebih Dahulu</p></div>
      ) : loadKdg || loadAni ? (
        <div className="flex-1 flex justify-center items-center"><LoadingSpinner /></div>
      ) : viewMode === 'denah' ? (
        <div className="flex-1 min-h-0">
          <DenahLantai 
            kandangs={kandangs} 
            groupedAnimals={groupedAnimals} 
            selectedBatch={selectedBatch} 
            onAnimalClick={setSelectedAnimal} 
            onKandangClick={setActiveDetailKandang} 
            onKandangDoubleClick={setEditingKandang} 
            activeDetailKandang={activeDetailKandang}
            floorMode={floorMode}
            setFloorMode={setFloorMode}
            placingKandang={placingKandang}
            setPlacingKandang={setPlacingKandang}
            drawStart={drawStart}
            setDrawStart={setDrawStart}
            drawCurrent={drawCurrent}
            setDrawCurrent={setDrawCurrent}
            pendingRect={pendingRect}
            setPendingRect={setPendingRect}
            pendingName={pendingName}
            setPendingName={setPendingName}
            dragging={dragging}
            setDragging={setDragging}
          />
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="max-w-[1800px] mx-auto space-y-10">
            {animals.length > 0 && <BatchSummaryBar animals={animals} holdingCount={holdingCount} />}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Area Produksi</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest">{normalKandangs.length} KOTAK</span>
              </div>
              {normalKandangs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-white/[0.04] rounded-[3rem] bg-white/[0.01]">
                  <Box size={40} className="text-white/10 mb-4" />
                  <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest mb-4">Belum ada kandang produksi</p>
                  <Button variant="outline" onClick={() => setAddSheet(true)} className="border-white/10 text-[#4B6478] hover:text-white rounded-xl uppercase text-[10px] font-black h-10">Buat Kandang Baru</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                  <AnimatePresence mode="popLayout">{normalKandangs.map((k, i) => <motion.div key={k.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="h-[460px]"><KandangBox kandang={k} animalsInKandang={groupedAnimals[k.id] || []} dragOver={dragOverKandang} onDragOver={handleDragOver} onDragLeave={() => setDragOverKandang(null)} onDrop={handleDrop} onAnimalClick={setSelectedAnimal} onKandangDoubleClick={setEditingKandang} /></motion.div>)}</AnimatePresence>
                </div>
              )}
            </div>
            {holdingPen && (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-[11px] font-black text-emerald-500/70 uppercase tracking-[0.3em]">Holding Area</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/10 to-transparent" />
                  <div className="flex items-center gap-2"><HelpCircle size={13} className="text-[#4B6478]" /><span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Penampungan Sementara</span></div>
                </div>
                <div className="h-[320px]"><KandangBox kandang={holdingPen} animalsInKandang={groupedAnimals[holdingPen.id] || []} dragOver={dragOverKandang} onDragOver={handleDragOver} onDragLeave={() => setDragOverKandang(null)} onDrop={handleDrop} onAnimalClick={setSelectedAnimal} onKandangDoubleClick={setEditingKandang} /></div>
                <div className="mt-6 p-6 rounded-[2.5rem] bg-emerald-500/[0.03] border border-emerald-500/10 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0"><ArrowRightLeft size={20} className="text-emerald-500" /></div>
                  <div><p className="text-sm font-['Sora'] font-black text-white uppercase tracking-tight">Manual Alokasi</p><p className="text-[11px] text-[#4B6478] font-bold mt-1">Drag ear-tag domba ke kandang tujuan untuk memindahkan alokasi kandang secara visual.</p></div>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Edit Kandang Sheet */}
      <Sheet open={!!editingKandang} onOpenChange={() => setEditingKandang(null)}>
        <SheetContent side="bottom" className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 p-0 flex flex-col rounded-t-[40px] max-h-[92vh]">
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <SheetHeader className="text-left text-white"><SheetTitle className="font-['Sora'] font-black text-2xl">Edit Kandang: {editingKandang?.name}</SheetTitle><p className="text-xs text-[#4B6478] font-bold uppercase tracking-widest">Konfigurasi ulang dimensi dan kapasitas kandang.</p></SheetHeader>
            {editingKandang && (
              <div className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Identitas Kandang *</label><input value={editingKandang.name} onChange={e => setEditingKandang(k => ({ ...k, name: e.target.value }))} className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all uppercase" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Panjang (m)</label><input type="number" value={editingKandang.panjang_m || ''} onChange={e => setEditingKandang(k => ({ ...k, panjang_m: parseFloat(e.target.value) }))} className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Lebar (m)</label><input type="number" value={editingKandang.lebar_m || ''} onChange={e => setEditingKandang(k => ({ ...k, lebar_m: parseFloat(e.target.value) }))} className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" /></div>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Limit Kapasitas (Ekor)</label><input type="number" value={editingKandang.capacity || ''} onChange={e => setEditingKandang(k => ({ ...k, capacity: parseInt(e.target.value) }))} className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" /></div>
                <button onClick={() => handleDeleteKandang(editingKandang.id)} className="text-[11px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-[0.2em] transition-colors py-2">Hapus Kandang</button>
              </div>
            )}
          </div>
          <div className="p-8 border-t border-white/[0.04] bg-[#06090F]"><Button onClick={() => updateKdg.mutate({ kandangId: editingKandang.id, batchId: selectedBatch, updates: { name: editingKandang.name, panjang_m: editingKandang.panjang_m, lebar_m: editingKandang.lebar_m, capacity: editingKandang.capacity } }, { onSuccess: () => setEditingKandang(null) })} disabled={updateKdg.isPending} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest rounded-[2rem] shadow-xl shadow-emerald-500/30">{updateKdg.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</Button></div>
        </SheetContent>
      </Sheet>

      {/* Add Kandang Sheet */}
      <Sheet open={addSheet} onOpenChange={setAddSheet}>
        <SheetContent side="bottom" className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 p-0 flex flex-col rounded-t-[40px] max-h-[92vh]">
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <SheetHeader className="text-left text-white"><SheetTitle className="font-['Sora'] font-black text-2xl">Tambah Kandang Domba</SheetTitle><p className="text-xs text-[#4B6478] font-bold uppercase tracking-widest">Konfigurasi kapasitas dan dimensi untuk unit kandang baru.</p></SheetHeader>
            <Tabs value={calcMode} onValueChange={setCalcMode} className="w-full">
              <TabsList className="bg-white/[0.03] border border-white/[0.08] p-1.5 mb-8 rounded-2xl w-full">
                <TabsTrigger value="dimensi" className="flex-1 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-xl h-10 transition-all">Smart Capacity</TabsTrigger>
                <TabsTrigger value="manual" className="flex-1 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 rounded-xl h-10 transition-all">Manual Input</TabsTrigger>
              </TabsList>
              <div className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Nama Kandang *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="KANDANG-B1" className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 uppercase" /></div>
                <TabsContent value="dimensi" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Panjang (m)</label><input type="number" value={form.panjang} onChange={e => setForm(f => ({ ...f, panjang: e.target.value }))} className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Lebar (m)</label><input type="number" value={form.lebar} onChange={e => setForm(f => ({ ...f, lebar: e.target.value }))} className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" /></div>
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Standar Kepadatan</label><select value={form.standard} onChange={e => setForm(f => ({ ...f, standard: e.target.value }))} className="w-full h-14 bg-[#111C24] border border-white/10 rounded-2xl px-5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50">
                    <option value="1.0">1.0 m² / ekor — Kepadatan Tinggi</option>
                    <option value="1.5">1.5 m² / ekor — Standar Ideal</option>
                    <option value="2.0">2.0 m² / ekor — Kepadatan Rendah (Nyaman)</option>
                  </select></div>
                  <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-center gap-5"><Info size={28} className="text-emerald-400 shrink-0" /><div><p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Estimasi Smart Capacity</p><p className="text-lg font-black text-white">{previewCapacity} Ekor Domba</p></div></div>
                </TabsContent>
                <TabsContent value="manual" className="space-y-6 mt-0"><div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Limit Kapasitas (Ekor) *</label><input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="e.g. 50" className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" /></div></TabsContent>
              </div>
            </Tabs>
          </div>
          <div className="p-8 border-t border-white/[0.04] bg-[#06090F]"><Button onClick={handleSaveKandang} disabled={createKandang.isPending} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest rounded-[2rem] shadow-xl shadow-emerald-500/30">{createKandang.isPending ? 'Menyimpan...' : 'Gunakan Kandang Ini'}</Button></div>
        </SheetContent>
      </Sheet>

      <AnimatePresence>
        {pendingRect && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setPendingRect(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="bg-[#0C1319] border border-white/10 rounded-[2.5rem] p-8 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-['Sora'] font-black text-white text-xl mb-1 uppercase tracking-tight">Kandang Baru</h3>
              <p className="text-[10px] font-black text-[#4B6478] mb-6 uppercase tracking-widest">{pendingRect.w}m × {pendingRect.h}m · { (pendingRect.w * pendingRect.h).toFixed(1) }m² · Est. {Math.max(1, Math.floor((pendingRect.w * pendingRect.h) / 1.5))} ekor</p>
              <input autoFocus value={pendingName} onChange={e => setPendingName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSavePendingRect()} placeholder="KANDANG-A1" className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 mb-6 uppercase" />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setPendingRect(null)} className="flex-1 border-white/10 text-[#4B6478] hover:text-white rounded-xl h-12 uppercase text-[10px] font-black">Batal</Button>
                <Button onClick={handleSavePendingRect} disabled={!pendingName.trim() || createKandang.isPending} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl h-12 uppercase text-[10px] tracking-widest">{createKandang.isPending ? 'Saving…' : 'Simpan'}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}