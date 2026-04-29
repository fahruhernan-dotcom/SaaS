import React from 'react'
import { motion } from 'framer-motion'
import { Scale, Utensils, Heart, BookOpen } from 'lucide-react'

const ACTIONS = [
  { key: 'timbang', label: 'Timbang',   sub: 'Catat bobot',     Icon: Scale,    accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'pakan',   label: 'Pakan',     sub: 'Log pemberian',   Icon: Utensils, accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'sehat',   label: 'Kesehatan', sub: 'Vaksin · obat',   Icon: Heart,    accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'catatan', label: 'Catatan',   sub: 'Insiden harian',  Icon: BookOpen,  accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
]

export function MobileQuickActions({ onAction }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {ACTIONS.map(({ key, label, sub, Icon, accent, bg }, i) => (
        <motion.button
          key={key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          onClick={() => onAction?.(key)}
          className="flex items-center gap-3 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-left active:scale-[0.97] transition-transform"
        >
          <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
            <Icon size={17} className={accent} />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-white leading-tight">{label}</div>
            <div className="text-[11px] text-[#4B6478] font-medium mt-0.5">{sub}</div>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
