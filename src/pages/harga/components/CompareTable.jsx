import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Minus, ChevronDown } from 'lucide-react'
import { COMPARE_ROWS } from '../data/pricingData'

function Cell({ value }) {
  if (value === null || value === undefined) {
    return (
      <td className="px-4 py-3 text-center">
        <Minus size={14} className="mx-auto text-white/15" />
      </td>
    )
  }
  if (value === true) {
    return (
      <td className="px-4 py-3 text-center">
        <Check size={14} className="mx-auto text-emerald-400" />
      </td>
    )
  }
  return (
    <td className="px-4 py-3 text-center text-xs font-semibold text-white/70">{value}</td>
  )
}

export default function CompareTable({ role }) {
  const [open, setOpen] = useState(false)
  const rows = COMPARE_ROWS[role] || COMPARE_ROWS.broker

  return (
    <div className="max-w-3xl mx-auto px-4 pb-8">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-[#64748B] hover:text-white/70 transition-colors cursor-pointer bg-transparent border-none"
      >
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} />
        </motion.span>
        {open ? 'Sembunyikan' : 'Lihat'} Perbandingan Lengkap
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="overflow-x-auto rounded-2xl border border-white/8 mt-2">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.02]">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#4B6478] w-1/3">Fitur</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#4B6478]">Starter</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#4B6478]">Pro</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/5">Business ⚡</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]'}`}
                    >
                      <td className="px-4 py-3 text-xs font-medium text-[#94A3B8]">{row.label}</td>
                      <Cell value={row.starter} />
                      <Cell value={row.pro} />
                      <td className="px-4 py-3 text-center bg-emerald-500/[0.03]">
                        {row.biz === null || row.biz === undefined
                          ? <Minus size={14} className="mx-auto text-white/15" />
                          : row.biz === true
                            ? <Check size={14} className="mx-auto text-emerald-400" />
                            : <span className="text-xs font-semibold text-emerald-300">{row.biz}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
