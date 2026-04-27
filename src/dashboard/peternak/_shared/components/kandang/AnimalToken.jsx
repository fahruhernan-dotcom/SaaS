import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getADGTier } from './constants'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'

gsap.registerPlugin(Draggable)

/**
 * Draggable animal card for the helicopter grid view.
 * 
 * Uses GSAP Draggable for high-fidelity "sticker-like" physics.
 *
 * @param {object}  props.animal
 * @param {object}  props.speciesConfig   - { emoji, weightRecordsKey, calcADG, adgThresholds }
 * @param {function} props.onClick
 * @param {function} props.onDragStart      - compatibility for native drop zones
 * @param {object|null} props.batchColor  - palette entry when in all-batch mode
 */
export default function AnimalToken({ animal, speciesConfig, onClick, onDragStart, batchColor }) {
  const { emoji, weightRecordsKey, calcADG, adgThresholds } = speciesConfig
  const records = animal[weightRecordsKey] ?? []
  const adg = calcADG(records, animal.entry_date, animal.entry_weight_kg)
  const adgKg = adg ? adg / 1000 : null
  const tier = getADGTier(adgKg, adgThresholds)
  const latestWeight = animal.latest_weight_kg || animal.entry_weight_kg

  const cardRef = useRef(null)

  useEffect(() => {
    const target = cardRef.current
    if (!target) return

    // Pre-calculate setters for performance
    const setRot = gsap.quickSetter(target, 'rotation', 'deg')
    const setSkew = gsap.quickSetter(target, 'skewX', 'deg')
    
    let lastHit = null
    let lastCheck = 0

    const draggable = Draggable.create(target, {
      type: 'x,y',
      edgeResistance: 0.65,
      zIndexBoost: true,
      onDragStart: function () {
        const parent = target.closest('[data-kandang-id]')
        if (parent) parent.classList.add('is-parent-of-dragged')

        gsap.to(target, {
          scale: 1.15,
          y: -15,
          boxShadow: '0 40px 80px rgba(0,0,0,0.65)',
          duration: 0.2,
          ease: 'power3.out'
        })
      },
      onDrag: function () {
        const rot = gsap.utils.clamp(-20, 20, this.deltaX * 1.5)
        const skew = gsap.utils.clamp(-12, 12, this.deltaX * 0.6)
        setRot(rot)
        setSkew(skew)

        // Throttle hit testing to every 100ms
        const now = Date.now()
        if (now - lastCheck < 100) return
        lastCheck = now

        const hitTarget = document.elementsFromPoint(this.pointerX, this.pointerY)
          .find(el => el.closest('[data-kandang-id]'))
        
        const currentHit = hitTarget?.closest('[data-kandang-id]')
        
        if (currentHit !== lastHit) {
          if (lastHit) lastHit.classList.remove('is-dragging-over')
          if (currentHit) currentHit.classList.add('is-dragging-over')
          lastHit = currentHit
        }
      },
      onRelease: function () {
        const parent = target.closest('[data-kandang-id]')
        if (parent) parent.classList.remove('is-parent-of-dragged')

        const snapBack = () => gsap.to(target, {
          scale: 1, rotation: 0, skewX: 0, y: 0, x: 0,
          boxShadow: '0 0 0 rgba(0,0,0,0)',
          duration: 0.5, ease: 'back.out(1.5)'
        })

        if (lastHit) {
          lastHit.classList.remove('is-dragging-over')
          const kandangId = lastHit.getAttribute('data-kandang-id')
          lastHit = null

          // Dropped back on the same kandang — just snap back, no mutation
          if (kandangId === animal.kandang_id) {
            snapBack()
            return
          }

          window.dispatchEvent(new CustomEvent('animalDrop', {
            detail: { animalId: animal.id, kandangId }
          }))

          gsap.to(target, { scale: 0.4, opacity: 0, duration: 0.2, ease: 'power3.in' })
        } else {
          snapBack()
        }
      }
    })

    return () => {
      if (draggable[0]) draggable[0].kill()
    }
  }, [animal.id])

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={cn(
        'relative border rounded-xl p-2.5 cursor-pointer select-none transition-all duration-200 hover:brightness-125 active:scale-[0.97]',
        !batchColor && cn(tier.bg, tier.border),
      )}
      style={{
        ...(batchColor ? { background: batchColor.bg, borderColor: batchColor.border } : {}),
        touchAction: 'none'
      }}
    >
      <div
        className={cn('absolute top-2 right-2 w-1.5 h-1.5 rounded-full', !batchColor && tier.dot)}
        style={batchColor ? { background: batchColor.dotColor } : {}}
      />
      <div className="flex items-center gap-1.5 mb-1.5 pr-3">
        <span className="text-[11px] leading-none shrink-0">{emoji}</span>
        <span className="text-[11px] font-['Sora'] font-black text-white truncate flex-1 min-w-0" title={animal.ear_tag}>
          {animal.ear_tag}
        </span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold text-[#4B6478] shrink-0">{latestWeight} kg</span>
        {batchColor
          ? <span className="text-[9px] font-black uppercase tracking-wider truncate flex-1 min-w-0 text-right" style={{ color: batchColor.text }}>{batchColor.batch_code?.slice(-6)}</span>
          : <span className={cn('text-[10px] font-black shrink-0', tier.color)}>{adgKg ? `${adgKg.toFixed(2)}↑` : '—'}</span>
        }
      </div>
    </div>
  )
}
