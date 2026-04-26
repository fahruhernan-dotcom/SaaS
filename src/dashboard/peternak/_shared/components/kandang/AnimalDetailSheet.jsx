import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, TrendingUp, Scale, Calendar, Activity, ChevronRight, Clock, ArrowRightLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getADGTier } from './constants'

const SEX_LABEL = { jantan: 'Jantan', betina: 'Betina', jantan_kastrasi: 'Jantan (Kastrasi)' }

/**
 * Slide-in panel showing individual animal detail + move controls.
 *
 * @param {object}  props.animal
 * @param {array}   props.kandangs
 * @param {object}  props.speciesConfig  - { emoji, targetHari, weightRecordsKey, calcADG, calcHari, adgThresholds }
 * @param {function} props.onClose
 * @param {function} props.onMove        - (targetKandang) => void
 */
export default function AnimalDetailSheet({ animal, kandangs, speciesConfig, onClose, onMove }) {
  const { emoji, targetHari, weightRecordsKey, calcADG, calcHari, adgThresholds } = speciesConfig

  const records    = animal[weightRecordsKey] ?? []
  const adg        = calcADG(records, animal.entry_date, animal.entry_weight_kg)
  const adgKg      = adg ? adg / 1000 : null
  const tier       = getADGTier(adgKg, adgThresholds)
  const hari       = calcHari(animal.entry_date, animal.exit_date)
  const latestW    = animal.latest_weight_kg || animal.entry_weight_kg
  const pbbh       = (latestW - animal.entry_weight_kg).toFixed(1)
  const daysRatio  = Math.min(100, (hari / targetHari) * 100)
  const sisiHari   = Math.max(0, targetHari - hari)

  const recentRecords = useMemo(() => {
    if (!records.length) return []
    return [...records].sort((a, b) => new Date(b.weigh_date) - new Date(a.weigh_date)).slice(0, 4)
  }, [records])

  const moveTargets = kandangs.filter(k => !k.is_holding && k.id !== animal.kandang_id)

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-y-0 right-0 w-[380px] max-w-full z-50 bg-[#0A1015]/97 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_50px_rgba(0,0,0,0.7)] flex flex-col"
    >
      <div className="absolute -top-10 right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="px-6 pt-8 pb-4 border-b border-white/[0.05] shrink-0 relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{emoji}</span>
              <h2 className="font-['Sora'] font-black text-xl text-white tracking-tight">{animal.ear_tag}</h2>
              <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border', tier.bg, tier.color, tier.border)}>
                {tier.label === '—' ? 'Belum timbang' : `ADG ${tier.label}`}
              </span>
            </div>
            <p className="text-[11px] text-[#4B6478]">
              {animal.breed || 'Breed —'} · {SEX_LABEL[animal.sex] || animal.sex}
              {animal.age_estimate ? ` · ±${animal.age_estimate} bln saat masuk` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Hari di Farm', value: `${hari} hr`,        icon: Calendar,  color: 'text-white' },
            { label: 'ADG',          value: adgKg ? `${adgKg.toFixed(2)} kg` : '—', icon: TrendingUp, color: tier.color },
            { label: 'PBBH',         value: `+${pbbh} kg`,       icon: Scale,     color: parseFloat(pbbh) > 0 ? 'text-emerald-400' : 'text-[#4B6478]' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-3 text-center">
              <kpi.icon size={12} className={cn('mx-auto mb-1.5 opacity-60', kpi.color)} />
              <p className={cn('text-sm font-black', kpi.color)}>{kpi.value}</p>
              <p className="text-[9px] text-[#4B6478] mt-0.5 uppercase tracking-wider">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={10} /> Progress Penggemukan
            </span>
            <span className={cn('text-[10px] font-black', hari >= targetHari ? 'text-red-400' : 'text-[#4B6478]')}>
              {hari >= targetHari ? '🔴 OVERDUE' : `${sisiHari} hari lagi`}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-1.5">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${daysRatio}%` }} transition={{ duration: 0.8, delay: 0.1 }}
              className={cn('h-full rounded-full', hari >= targetHari ? 'bg-red-500' : daysRatio > 80 ? 'bg-emerald-500' : 'bg-emerald-400')}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#4B6478]">
            <span>Masuk: {animal.entry_date ? new Date(animal.entry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—'}</span>
            <span>Target {targetHari} hari</span>
          </div>
        </div>

        {/* Weight comparison */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Scale size={10} /> Bobot
          </p>
          <div className="flex items-stretch gap-3">
            <div className="flex-1 text-center bg-white/[0.03] rounded-xl p-3">
              <p className="text-[10px] text-[#4B6478] mb-0.5">Masuk</p>
              <p className="text-lg font-black text-white">{animal.entry_weight_kg}<span className="text-[10px] text-[#4B6478] ml-0.5">kg</span></p>
            </div>
            <div className="flex items-center"><ChevronRight size={14} className="text-[#4B6478]" /></div>
            <div className="flex-1 text-center bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-3">
              <p className="text-[10px] text-[#4B6478] mb-0.5">Terkini</p>
              <p className="text-lg font-black text-emerald-300">{latestW}<span className="text-[10px] text-[#4B6478] ml-0.5">kg</span></p>
            </div>
          </div>
        </div>

        {/* Weight history */}
        {recentRecords.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Activity size={10} /> Riwayat Timbang
            </p>
            <div className="space-y-0">
              {recentRecords.map((r, i) => {
                const rADGKg = r.adg_since_last ? r.adg_since_last / 1000 : null
                const rTier  = getADGTier(rADGKg, adgThresholds)
                return (
                  <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', i === 0 ? 'bg-emerald-400' : 'bg-white/10')} />
                      <span className="text-[11px] text-[#4B6478]">
                        {new Date(r.weigh_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-bold text-white">{r.weight_kg} kg</span>
                      {rADGKg !== null && (
                        <span className={cn('text-[10px] font-bold', rTier.color)}>
                          {rADGKg >= 0 ? '+' : ''}{rADGKg.toFixed(2)} kg/hr
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Move to kandang */}
        {moveTargets.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <ArrowRightLeft size={10} /> Pindah ke Kandang
            </p>
            <div className="flex flex-wrap gap-2">
              {moveTargets.map(k => (
                <button
                  key={k.id}
                  onClick={() => onMove(k)}
                  className="px-3 py-1.5 bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] rounded-xl text-[11px] font-bold text-white transition-all"
                >
                  {k.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
