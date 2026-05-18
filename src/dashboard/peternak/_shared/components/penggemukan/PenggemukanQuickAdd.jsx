import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scale, Wheat, HeartPulse, Sparkles, FileText, Plus, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'

// config: { basePath, iconBg, iconText }
export function PenggemukanQuickAdd({ config }) {
  const navigate = useNavigate()
  const p = usePeternakPermissions()

  useEffect(() => {
    if (!p.showFab) {
      navigate(`${config.basePath}/beranda`, { replace: true })
    }
  }, [p.showFab, navigate, config.basePath])

  if (!p.showFab) return null

  const items = [
    { icon: <Scale size={20} strokeWidth={2.5} />,      label: 'Timbang ternak',  sub: 'Catat bobot per ekor',    path: `${config.basePath}/ternak` },
    { icon: <Wheat size={20} strokeWidth={2.5} />,       label: 'Log pakan',       sub: 'Pemberian + sisa',        path: `${config.basePath}/stok-pakan` },
    { icon: <HeartPulse size={20} strokeWidth={2.5} />,  label: 'Catat kesehatan', sub: 'Vaksin · obat · gejala',  path: `${config.basePath}/kesehatan` },
    { icon: <Sparkles size={20} strokeWidth={2.5} />,    label: 'Bersih kandang',  sub: 'Tandai selesai',          path: `${config.basePath}/daily_task` },
    { icon: <FileText size={20} strokeWidth={2.5} />,    label: 'Catatan harian',  sub: 'Bebas teks · foto',       path: `${config.basePath}/daily_task` },
    { icon: <Plus size={20} strokeWidth={2.5} />,        label: 'Batch baru',      sub: 'Mulai siklus baru',       path: `${config.basePath}/batch` },
  ]

  return (
    <div
      onClick={() => navigate(-1)}
      className="fixed inset-0 z-[5000] bg-black/70 backdrop-blur-sm flex items-end"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full bg-[#0A0E0C] border-t border-white/10 rounded-t-[28px] pb-8 relative shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
      >
        <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mt-3 mb-5" />

        <div className="px-6 mb-5">
          <h2 className="text-xl font-bold text-white tracking-tight font-display">Catat aktivitas</h2>
          <p className="text-[13px] text-[#94A3B8] mt-1 font-medium">Pilih jenis kegiatan untuk dicatat</p>
        </div>

        <div className="px-3 flex flex-col gap-1">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => navigate(it.path)}
              className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/[0.04] active:scale-[0.98] transition-all text-left group"
            >
              <div className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0 ${config.iconBg} ${config.iconText}`}>
                {it.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold text-white">{it.label}</div>
                <div className="text-[12px] text-[#94A3B8] mt-0.5">{it.sub}</div>
              </div>
              <ChevronRight size={18} className="text-[#4B6478] group-hover:text-white transition-colors" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
