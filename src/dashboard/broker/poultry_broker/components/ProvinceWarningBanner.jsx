import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ProvinceWarningBanner
 * Muncul di halaman RPA/Kandang kalau ada record yang belum punya provinsi.
 * 
 * Props:
 *  - missingCount: number — jumlah record yang province === null/''
 *  - entityLabel: string — 'RPA' | 'Kandang'
 *  - onDismiss: fn — callback ketika di-close
 *  - onActionClick: fn — callback ketika klik tombol aksi (buka edit modal, dll)
 *  - actionLabel: string — label tombol aksi, default 'Lihat & Lengkapi'
 */
export function ProvinceWarningBanner({
  missingCount = 0,
  entityLabel = 'data',
  onDismiss,
  onActionClick,
  actionLabel = 'Lihat & Lengkapi',
  className
}) {
  if (missingCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        key="province-warning-banner"
        initial={{ opacity: 0, y: -12, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -12, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn('overflow-hidden', className)}
      >
        <div className="mx-4 md:mx-5 mb-3 relative flex items-start gap-3 p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 backdrop-blur-sm">
          {/* Glow */}
          <div className="absolute inset-0 rounded-2xl bg-amber-500/[0.03] pointer-events-none" />

          {/* Icon */}
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={15} className="text-amber-400" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 relative z-10">
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-0.5">
              Data Tidak Lengkap
            </p>
            <p className="text-sm font-bold text-[#F1F5F9] leading-snug">
              <span className="text-amber-400">{missingCount} {entityLabel}</span> belum memiliki provinsi.
              Data ini tidak akan masuk filter regional dashboard.
            </p>

            {(onActionClick || onDismiss) && (
              <div className="flex items-center gap-2 mt-2.5">
                {onActionClick && (
                  <button
                    onClick={onActionClick}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-[#0C1319] text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/20"
                  >
                    <MapPin size={10} className="inline mr-1 -mt-0.5" />
                    {actionLabel}
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#4B6478] hover:text-white hover:border-white/20 active:scale-95 transition-all"
                  >
                    Abaikan
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Close button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="shrink-0 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#4B6478] hover:text-white transition-all relative z-10"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
