/**
 * MobileTaskProgress.jsx — Today's task progress card for mobile beranda
 * Donut ring SVG + summary text + mini status strip per task.
 * Tappable — navigates to daily task page.
 */
import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

// ─── SVG Donut Ring ─────────────────────────────────────────────────────────
function DonutRing({ value, max, size = 64, stroke = 6, color = '#22C55E', children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(1, max > 0 ? value / max : 0)
  const dash = c * pct
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="var(--border-sub-val)" strokeWidth={stroke} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function MobileTaskProgress({
  tasks = [],
  onNavigate,
}) {
  const done = tasks.filter(t => t.status === 'selesai').length
  const total = tasks.length
  const doing = tasks.filter(t => t.status === 'in_progress' || t.status === 'doing').length

  // Find next pending/in-progress task
  const nextTask = tasks.find(t => t.status !== 'selesai' && t.status !== 'dilewati')
  const nextLabel = nextTask?.title || nextTask?.template?.title || 'Tidak ada'
  const nextTime = nextTask?.due_time ? String(nextTask.due_time).substring(0, 5) : ''

  // Status for mini strip colors
  const getStripColor = (status) => {
    if (status === 'selesai') return 'bg-emerald-500 dark:bg-emerald-400'
    if (status === 'in_progress' || status === 'doing') return 'bg-amber-500 dark:bg-amber-400'
    if (status === 'terlambat') return 'bg-red-500 dark:bg-red-400'
    return 'bg-slate-200 dark:bg-white/10'
  }

  if (total === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      onClick={onNavigate}
      className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.03] rounded-[1.25rem] p-4 shadow-sm dark:shadow-lg cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center gap-4">
        {/* Donut ring */}
        <DonutRing value={done} max={total} size={64} stroke={6} color="#22C55E">
          <div className="text-center leading-none">
            <div className="text-[15px] font-black text-slate-900 dark:text-white tabular-nums">{done}/{total}</div>
            <div className="text-[8px] text-slate-500 dark:text-[#8DA2B5] font-bold mt-0.5">selesai</div>
          </div>
        </DonutRing>

        {/* Text area */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight mb-1">
            {doing > 0 ? `${doing} sedang berjalan` : done === total ? 'Semua selesai ✓' : 'Tepat jadwal'}
          </p>
          <p className="text-[12px] text-slate-500 dark:text-[#8DA2B5] truncate">
            Berikutnya: <span className="text-slate-700 dark:text-white/80 font-semibold">{nextLabel}</span>
            {nextTime && <> · {nextTime}</>}
          </p>
        </div>

        <ChevronRight size={16} className="text-slate-400 dark:text-[#8DA2B5] shrink-0" />
      </div>

      {/* Mini task strip */}
      <div className="flex gap-1 mt-3.5">
        {tasks.map((t, i) => (
          <div
            key={t.id || i}
            className={`flex-1 h-[5px] rounded-full ${getStripColor(t.status)} ${
              t.status === 'pending' || t.status === 'todo' ? 'opacity-50' : 'opacity-100'
            }`}
            title={`${t.title || ''} — ${t.status}`}
          />
        ))}
      </div>
    </motion.div>
  )
}
