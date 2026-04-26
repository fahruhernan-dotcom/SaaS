// Floor plan constants
export const CELL_PX   = 32
export const GRID_W    = 100
export const GRID_H    = 80
export const MAJOR     = 5
export const MIN_SCALE = 0.15
export const MAX_SCALE = 4

export const PALETTE = [
  { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.55)',  text: '#6EE7B7', dotColor: '#10B981' },
  { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.55)',  text: '#93C5FD', dotColor: '#3B82F6' },
  { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.55)',  text: '#FCD34D', dotColor: '#F59E0B' },
  { bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.55)',  text: '#C4B5FD', dotColor: '#8B5CF6' },
  { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.55)',   text: '#FCA5A5', dotColor: '#EF4444' },
  { bg: 'rgba(236,72,153,0.15)',  border: 'rgba(236,72,153,0.55)',  text: '#F9A8D4', dotColor: '#EC4899' },
  { bg: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.55)',   text: '#67E8F9', dotColor: '#06B6D4' },
  { bg: 'rgba(132,204,22,0.15)',  border: 'rgba(132,204,22,0.55)',  text: '#BEF264', dotColor: '#84CC16' },
]

/**
 * Returns tier object for coloring based on ADG.
 * @param {number|null} adgKg - ADG in kg/day
 * @param {{ good: number, ok: number }} thresholds - species-specific thresholds
 */
export function getADGTier(adgKg, thresholds = { good: 0.25, ok: 0.15 }) {
  if (!adgKg) return {
    color: 'text-[#4B6478]', dot: 'bg-[#4B6478]/40',
    border: 'border-white/5', bg: 'bg-white/[0.03]',
    label: '—', dotColor: '#4B6478'
  }
  if (adgKg >= thresholds.good) return {
    color: 'text-emerald-400', dot: 'bg-emerald-400',
    border: 'border-emerald-500/30', bg: 'bg-emerald-500/[0.06]',
    label: `${adgKg.toFixed(2)} kg`, dotColor: '#34D399'
  }
  if (adgKg >= thresholds.ok) return {
    color: 'text-amber-400', dot: 'bg-amber-400',
    border: 'border-amber-500/30', bg: 'bg-amber-500/[0.06]',
    label: `${adgKg.toFixed(2)} kg`, dotColor: '#FBBF24'
  }
  return {
    color: 'text-red-400', dot: 'bg-red-400',
    border: 'border-red-500/30', bg: 'bg-red-500/[0.06]',
    label: `${adgKg.toFixed(2)} kg`, dotColor: '#F87171'
  }
}
