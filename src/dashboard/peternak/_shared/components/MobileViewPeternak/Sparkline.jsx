/**
 * Sparkline.jsx — Reusable SVG sparkline primitive
 * Tiny inline chart for KPI cards and metrics.
 */
import React from 'react'

export function Sparkline({ data, color = '#22C55E', width = 48, height = 22 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.05
    return [x, y]
  })
  const d = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ')
  const area = `${d} L${width},${height} L0,${height} Z`
  return (
    <svg width={width} height={height} className="block shrink-0">
      <path d={area} fill={color} fillOpacity="0.12" />
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="2" fill={color} />
    </svg>
  )
}
