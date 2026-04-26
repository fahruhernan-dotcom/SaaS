import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, Box, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getADGTier } from './constants'
import AnimalToken from './AnimalToken'

function onDragStart(e, animal) {
  e.dataTransfer.setData('animalId', animal.id)
  e.dataTransfer.effectAllowed = 'move'
  const ghost = e.currentTarget.cloneNode(true)
  ghost.style.position = 'absolute'; ghost.style.top = '-1000px'
  document.body.appendChild(ghost)
  e.dataTransfer.setDragImage(ghost, 0, 0)
  setTimeout(() => ghost.remove(), 0)
}

/**
 * Helicopter-view kandang card (drop zone + animal grid).
 *
 * @param {object}  props.kandang
 * @param {array}   props.animalsInKandang
 * @param {string|null} props.dragOver      - id of kandang currently dragged over
 * @param {function} props.onDragOver
 * @param {function} props.onDragLeave
 * @param {function} props.onDrop
 * @param {function} props.onAnimalClick
 * @param {function} props.onKandangDoubleClick
 * @param {object}  props.speciesConfig     - passed to AnimalToken
 * @param {object}  props.batchColorMap
 * @param {boolean} props.isAllBatches
 */
export default function KandangBox({
  kandang, animalsInKandang,
  dragOver, onDragOver, onDragLeave, onDrop,
  onAnimalClick, onKandangDoubleClick,
  speciesConfig, batchColorMap, isAllBatches,
}) {
  const { weightRecordsKey, calcADG, adgThresholds } = speciesConfig
  const isOver    = dragOver === kandang.id
  const isFull    = kandang.capacity > 0 && animalsInKandang.length >= kandang.capacity
  const isHolding = kandang.is_holding

  let borderColor = 'border-white/[0.04]'
  let bgGradient  = 'bg-white/[0.01]'
  if (isOver) {
    borderColor = isFull && !isHolding
      ? 'border-red-500 ring-4 ring-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
      : 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
    bgGradient = isFull && !isHolding ? 'bg-red-500/[0.08]' : 'bg-emerald-500/[0.08]'
  } else if (isHolding) {
    borderColor = 'border-dashed border-emerald-500/20 hover:border-emerald-500/40'
    bgGradient  = 'bg-emerald-500/[0.02]'
  }

  const capacityRatio = !isHolding && kandang.capacity > 0 ? animalsInKandang.length / kandang.capacity : 0
  let capColor = 'text-[#4B6478]'; let capBg = 'bg-white/[0.03]'; let progressColor = 'bg-[#4B6478]'
  if (capacityRatio >= 1)        { capColor = 'text-red-400';     capBg = 'bg-red-500/10';    progressColor = 'bg-red-500' }
  else if (capacityRatio >= 0.8) { capColor = 'text-amber-400';   capBg = 'bg-amber-500/10';  progressColor = 'bg-amber-500' }
  else if (capacityRatio > 0)    { capColor = 'text-emerald-400'; capBg = 'bg-emerald-500/10'; progressColor = 'bg-emerald-500' }

  const kandangStats = useMemo(() => {
    if (!animalsInKandang.length) return null
    const adgList   = animalsInKandang.map(a => {
      const records = a[weightRecordsKey] ?? []
      const adg = calcADG(records, a.entry_date, a.entry_weight_kg)
      return adg ? adg / 1000 : null
    }).filter(v => v !== null)
    const avgWeight = animalsInKandang.reduce((s, a) => s + (a.latest_weight_kg || a.entry_weight_kg || 0), 0) / animalsInKandang.length
    const totalPBBH = animalsInKandang.reduce((s, a) => s + ((a.latest_weight_kg || a.entry_weight_kg || 0) - (a.entry_weight_kg || 0)), 0)
    const avgADG    = adgList.length ? adgList.reduce((s, v) => s + v, 0) / adgList.length : null
    return { avgWeight: avgWeight.toFixed(0), totalPBBH: totalPBBH.toFixed(1), avgADG }
  }, [animalsInKandang, weightRecordsKey, calcADG])

  const statsADGTier = getADGTier(kandangStats?.avgADG, adgThresholds)

  const batchDist = useMemo(() => {
    if (!isAllBatches || !batchColorMap || !animalsInKandang.length) return null
    const map = {}
    animalsInKandang.forEach(a => { if (a.batch_id) map[a.batch_id] = (map[a.batch_id] || 0) + 1 })
    return Object.entries(map)
  }, [isAllBatches, batchColorMap, animalsInKandang])

  return (
    <motion.div
      variants={{ shake: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } }, idle: { x: 0 } }}
      animate={isOver && isFull && !isHolding ? 'shake' : 'idle'}
      onDragOver={(e) => onDragOver(e, kandang)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, kandang)}
      onDoubleClick={() => onKandangDoubleClick(kandang)}
      className={cn('group h-full flex flex-col rounded-[2.5rem] border-2 transition-all duration-300 relative overflow-hidden shadow-2xl cursor-pointer', borderColor, bgGradient)}
    >
      <div className="absolute -bottom-6 -right-6 text-[90px] font-black text-white/[0.02] pointer-events-none select-none italic">
        {kandang.name.split('-').pop()}
      </div>

      {/* Header */}
      <div className={cn('px-5 pt-5 pb-4 flex flex-col gap-2.5 relative z-10 shrink-0', isHolding ? 'bg-emerald-500/[0.02]' : 'bg-white/[0.01]')}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              {isHolding ? <Box size={16} className="text-emerald-400" /> : <LayoutGrid size={16} className="text-emerald-400" />}
            </div>
            <div>
              <h3 className="font-['Sora'] font-black text-white text-sm tracking-tight uppercase leading-tight">{kandang.name}</h3>
              {!isHolding && kandang.panjang_m
                ? <p className="text-[10px] font-black text-[#4B6478] opacity-50 flex items-center gap-1 mt-0.5">
                    {kandang.panjang_m}×{kandang.lebar_m}m ({(kandang.panjang_m * kandang.lebar_m).toFixed(1)}m²)
                  </p>
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
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${Math.min(100, capacityRatio * 100)}%` }}
              className={cn('h-full rounded-full', progressColor)}
            />
          </div>
        )}

        {/* Batch distribution pills */}
        {batchDist?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {batchDist.map(([bId, count]) => {
              const bc = batchColorMap[bId]
              if (!bc) return null
              return (
                <div key={bId} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border" style={{ background: bc.bg, borderColor: bc.border }}>
                  <div className="w-1 h-1 rounded-full shrink-0" style={{ background: bc.dotColor }} />
                  <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: bc.text }}>{bc.batch_code?.slice(-6)}: {count}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Kandang stats */}
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

      {/* Animal tokens grid */}
      <div className={cn('p-4 flex-1 overflow-y-auto no-scrollbar relative z-10', animalsInKandang.length === 0 ? 'flex items-center justify-center' : 'grid grid-cols-2 gap-2 content-start')}>
        <AnimatePresence mode="popLayout">
          {animalsInKandang.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center opacity-20 -translate-y-2">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center mb-2"><Plus size={16} /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center">Empty</p>
            </motion.div>
          ) : (
            animalsInKandang.map(a => (
              <AnimalToken
                key={a.id}
                animal={a}
                speciesConfig={speciesConfig}
                onClick={() => onAnimalClick(a)}
                onDragStart={onDragStart}
                batchColor={isAllBatches ? batchColorMap?.[a.batch_id] : undefined}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
