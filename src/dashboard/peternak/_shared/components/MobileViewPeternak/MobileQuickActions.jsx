/**
 * MobileQuickActions.jsx — 2x2 grid quick action buttons for mobile beranda
 * Provides fast navigation to key daily workflows.
 */
import React from 'react'
import { motion } from 'framer-motion'
import { Scale, Utensils, Heart, BookOpen } from 'lucide-react'

const ACTIONS = [
  { key: 'timbang', label: 'Timbang', Icon: Scale,    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' },
  { key: 'pakan',   label: 'Pakan',   Icon: Utensils, color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/15' },
  { key: 'sehat',   label: 'Kesehatan', Icon: Heart,  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/15' },
  { key: 'catatan', label: 'Catatan', Icon: BookOpen,  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/15' },
]

export function MobileQuickActions({ onAction }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-[0.15em] mb-3">Aksi cepat</p>
      <div className="grid grid-cols-4 gap-2.5">
        {ACTIONS.map(({ key, label, Icon, color, bg, border }, i) => (
          <motion.button
            key={key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            onClick={() => onAction?.(key)}
            className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl border ${bg} ${border} active:scale-95 transition-transform`}
          >
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={16} className={color} />
            </div>
            <span className={`text-[10px] font-bold ${color}`}>{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
