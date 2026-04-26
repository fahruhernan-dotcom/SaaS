import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CELL_PX } from './constants'

/**
 * Generic roaming animal for the floor plan view.
 *
 * @param {object} props
 * @param {object} props.animal
 * @param {{ w: number, h: number }} props.bounds  - kandang dimensions in meters
 * @param {string}  props.dotColor                 - ADG or batch tier color
 * @param {string}  props.emoji                    - species emoji
 * @param {function} props.weightScaling           - (weightKg) => lengthMeters
 * @param {function} props.onClick
 */
export default function RoamingAnimal({ animal, bounds, dotColor, emoji, weightScaling, onClick }) {
  const weight = animal.latest_weight_kg || animal.entry_weight_kg || 20
  const lengthMeters = weightScaling(weight)
  const iconSize = lengthMeters * CELL_PX

  const [target, setTarget] = useState({
    x: Math.random() * (bounds.w - lengthMeters),
    y: Math.random() * (bounds.h - lengthMeters),
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
      transition={{ duration: isIdle ? 0 : 6 + Math.random() * 12, ease: 'linear' }}
      onAnimationComplete={() => setIsIdle(true)}
      onClick={(e) => { e.stopPropagation(); onClick(animal) }}
      style={{
        position: 'absolute',
        width: iconSize,
        height: iconSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: iconSize,
        zIndex: 20,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
      }}
    >
      <div style={{ transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)', transition: 'transform 0.4s ease-out' }}>
        {emoji}
      </div>
      <div style={{
        position: 'absolute',
        top: -iconSize / 6,
        right: -iconSize / 6,
        width: iconSize / 2.5,
        height: iconSize / 2.5,
        borderRadius: '50%',
        background: dotColor,
        border: '1.2px solid rgba(0,0,0,0.5)',
        boxShadow: `0 0 4px ${dotColor}`,
      }} />
    </motion.div>
  )
}
