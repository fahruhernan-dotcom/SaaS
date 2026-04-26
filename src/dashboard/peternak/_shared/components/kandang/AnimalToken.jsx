import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getADGTier } from './constants'

/**
 * Draggable animal card for the helicopter grid view.
 *
 * @param {object}  props.animal
 * @param {object}  props.speciesConfig   - { emoji, weightRecordsKey, calcADG, adgThresholds }
 * @param {function} props.onClick
 * @param {function} props.onDragStart
 * @param {object|null} props.batchColor  - palette entry when in all-batch mode
 */
export default function AnimalToken({ animal, speciesConfig, onClick, onDragStart, batchColor }) {
  const { emoji, weightRecordsKey, calcADG, adgThresholds } = speciesConfig
  const records  = animal[weightRecordsKey] ?? []
  const adg      = calcADG(records, animal.entry_date, animal.entry_weight_kg)
  const adgKg    = adg ? adg / 1000 : null
  const tier     = getADGTier(adgKg, adgThresholds)
  const latestWeight = animal.latest_weight_kg || animal.entry_weight_kg

  return (
    <motion.div
      layout
      layoutId={`animal-${animal.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, animal)}
      onClick={onClick}
      className={cn(
        'relative border rounded-xl p-2.5 cursor-pointer select-none transition-all duration-200 hover:brightness-125 active:scale-[0.97]',
        !batchColor && cn(tier.bg, tier.border),
      )}
      style={batchColor ? { background: batchColor.bg, borderColor: batchColor.border } : {}}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      <div
        className={cn('absolute top-2 right-2 w-1.5 h-1.5 rounded-full', !batchColor && tier.dot)}
        style={batchColor ? { background: batchColor.dotColor } : {}}
      />
      <div className="flex items-center gap-1.5 mb-1.5 pr-3">
        <span className="text-[11px] leading-none">{emoji}</span>
        <span className="text-[11px] font-['Sora'] font-black text-white truncate max-w-[72px]" title={animal.ear_tag}>
          {animal.ear_tag}
        </span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold text-[#4B6478]">{latestWeight} kg</span>
        {batchColor
          ? <span className="text-[9px] font-black uppercase tracking-wider truncate max-w-[48px]" style={{ color: batchColor.text }}>{batchColor.batch_code?.slice(-6)}</span>
          : <span className={cn('text-[10px] font-black', tier.color)}>{adgKg ? `${adgKg.toFixed(2)}↑` : '—'}</span>
        }
      </div>
    </motion.div>
  )
}
