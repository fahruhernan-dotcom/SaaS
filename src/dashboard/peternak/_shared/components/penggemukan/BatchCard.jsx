import { motion } from 'framer-motion'
import { MapPin, ArrowUpRight } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { id } from 'date-fns/locale'

// config shape: { targetDays, adgGood, adgOk, mortalityThreshold, calcHariDiFarm, calcMortalitas }
export function BatchCard({ batch, activeCount, computedAdg, config, onClick }) {
  const { targetDays = 90, adgGood = 150, adgOk = 100, calcHariDiFarm, calcMortalitas } = config
  const hari = calcHariDiFarm(batch.start_date)
  const sisaHari = Math.max(0, targetDays - hari)
  const estimasiPanen = addDays(new Date(batch.start_date), targetDays)
  const progress = Math.min(100, Math.round((hari / targetDays) * 100))
  const mortalitasPct = calcMortalitas(batch.mortality_count, batch.total_animals)
  const isOverdue = hari > targetDays
  const isCritical = mortalitasPct > config.mortalityThreshold
  const isNearHarvest = sisaHari <= 14 && !isOverdue

  // ADG display — for sapi (adgGood>=500) show kg, for domba/kambing show g
  const adgVal = computedAdg || (batch.avg_adg_gram ? Math.round(batch.avg_adg_gram) : null) || null
  const adgDisplay = adgVal
    ? (adgGood >= 500 ? `${(adgVal / 1000).toFixed(2)}kg` : `${adgVal}g`)
    : '—'
  const adgColor = adgVal >= adgGood ? 'text-green-400' : adgVal >= adgOk ? 'text-amber-400' : adgVal ? 'text-red-400' : 'text-[#4B6478]'
  const progressColor = isOverdue ? 'bg-red-500' : progress > 80 ? 'bg-amber-500' : 'bg-green-500'
  const sisaColor = isOverdue ? 'text-red-400' : isNearHarvest ? 'text-amber-400' : 'text-white'
  const displayCount = activeCount !== undefined ? activeCount : batch.total_animals

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group bg-white/[0.03] hover:bg-white/[0.05] border rounded-3xl p-5 transition-all duration-300 ${
        isCritical ? 'border-red-500/20 hover:border-red-500/30' :
        isNearHarvest ? 'border-amber-500/20 hover:border-amber-500/30' :
        'border-white/[0.06] hover:border-white/[0.12]'
      }`}
    >
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    onClick={onClick}
                    className="font-['Sora'] font-bold text-base text-white hover:text-green-400 cursor-pointer transition-colors uppercase tracking-tight"
                  >
                    {batch.batch_code}
                  </span>
                  {isOverdue && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-black tracking-tighter uppercase">OVERDUE</span>
                  )}
                  {isNearHarvest && !isOverdue && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black tracking-tighter uppercase animate-pulse">Siap Panen</span>
                  )}
                  {isCritical && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-black tracking-tighter uppercase">🚨 Kritis</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[#4B6478]">
                  <MapPin size={11} />
                  <p className="text-[11px] font-bold uppercase tracking-wider">{batch.kandang_name}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-2xl font-black text-white font-['Sora'] leading-none mb-0.5">{displayCount}</p>
                <p className="text-[9px] text-[#4B6478] font-black uppercase tracking-[0.15em]">Ekor</p>
              </div>
            </div>

            {/* Time Progress */}
            <div className="mb-5 bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-2xl">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide mb-2">
                <span className="text-[#4B6478]">Hari ke-<span className="text-white">{hari}</span></span>
                <span className={sisaColor}>{isOverdue ? `${hari - targetDays} Hari Overdue` : `Sisa ${sisaHari} Hari`}</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progress)}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  className={`h-full rounded-full ${progressColor}`}
                />
              </div>
              <div className="flex justify-between text-[9px] text-[#4B6478] font-medium mt-1.5">
                <span>Mulai: {format(new Date(batch.start_date), 'dd MMM', { locale: id })}</span>
                <span className={isNearHarvest ? 'text-amber-400 font-bold' : ''}>
                  Panen: {format(estimasiPanen, 'dd MMM yyyy', { locale: id })}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-2.5 text-center">
              <p className={`text-[13px] font-black leading-none mb-1 ${mortalitasPct > config.mortalityThreshold ? 'text-red-400' : mortalitasPct > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                {mortalitasPct}%
              </p>
              <p className="text-[8px] text-[#4B6478] font-black uppercase tracking-widest">Mortalitas</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-2.5 text-center relative">
              <p className={`text-[13px] font-black leading-none mb-1 ${adgColor}`}>
                {adgDisplay}
              </p>
              <p className="text-[8px] text-[#4B6478] font-black uppercase tracking-widest">ADG/Hari</p>
              {adgVal >= adgGood && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              )}
            </div>
            <button
              onClick={onClick}
              className="bg-green-500/[0.06] border border-green-500/20 hover:bg-green-500/[0.12] rounded-2xl p-2.5 text-center flex flex-col items-center justify-center transition-all active:scale-95 group/btn"
            >
              <ArrowUpRight size={14} className="text-green-400 group-hover/btn:scale-110 transition-transform mb-0.5" />
              <p className="text-[8px] text-green-400/70 font-black uppercase tracking-widest">Detail</p>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
