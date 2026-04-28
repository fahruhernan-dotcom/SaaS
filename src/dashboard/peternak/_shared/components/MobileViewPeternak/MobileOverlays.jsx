import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Scale, List, TrendingUp, Heart, Calendar, Clock, DollarSign, ArrowUpRight, CheckCircle2, CircleDashed } from 'lucide-react'
import { Card, Pill, ProgressBar, BigNumber } from '@/dashboard/peternak/_shared/components/MobilePrimitives'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function MobileOverlay({ title, subtitle, onBack, children, isOpen }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-[1000] bg-[#0A0E0C] overflow-y-auto"
        >
          <header className="sticky top-0 z-10 bg-[#0A0E0C]/80 backdrop-blur-md border-b border-white/5 px-4 pt-14 pb-4 flex items-center gap-4">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-bold text-white tracking-tight truncate">{title}</h2>
              {subtitle && <p className="text-[12px] text-[#94A3B8] truncate">{subtitle}</p>}
            </div>
          </header>
          <div className="pb-24">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function MobileBatchDetailOverlay({ batch, isOpen, onBack, animals = [], weightHistory = [], feedLogs = [], sales = [] }) {
  if (!batch) return null

  // Calculate stats logic similar to handoff
  const days = Math.floor((new Date() - new Date(batch.start_date)) / (1000 * 60 * 60 * 24))
  const TARGET_DAYS = 90
  const remaining = Math.max(0, TARGET_DAYS - days)
  
  const totalAnimals = batch.total_animals || 0
  const activeCount = animals.length || totalAnimals
  const mortalitasCount = batch.mortality_count || 0
  const mortalitasPct = totalAnimals > 0 ? ((mortalitasCount / totalAnimals) * 100).toFixed(1) : '0.0'
  
  const avgWeight = batch.avg_latest_weight_kg || batch.avg_entry_weight_kg || 15
  const adg = batch.avg_adg_gram || 0

  return (
    <MobileOverlay 
      isOpen={isOpen} 
      onBack={onBack} 
      title={batch.batch_code} 
      subtitle={batch.kandang_name}
    >
      <div className="px-5 pt-6 space-y-4">
        {/* Hero Card */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <BigNumber 
              value={activeCount} 
              unit="ekor aktif" 
              sub={`${mortalitasCount} mati dari batch awal ${totalAnimals}`} 
            />
            <Pill tone={remaining <= 14 ? 'warn' : 'accent'}>
              {remaining <= 14 ? 'Siap panen' : `Hari ${days}/${TARGET_DAYS}`}
            </Pill>
          </div>
          <ProgressBar value={days} max={TARGET_DAYS} tone={remaining <= 14 ? 'warn' : 'accent'} />
          <div className="flex justify-between mt-3 text-[11px] text-[#94A3B8] font-medium">
            <span>Mulai {format(new Date(batch.start_date), 'dd MMM yyyy', { locale: id })}</span>
            <span>Target panen {format(new Date(new Date(batch.start_date).getTime() + TARGET_DAYS * 86400000), 'dd MMM yyyy', { locale: id })}</span>
          </div>
        </Card>

        {/* Growth Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<TrendingUp size={16} />} label="ADG harian" value={`${adg}g`} tone={adg >= 150 ? 'ok' : 'warn'} />
          <StatCard icon={<Heart size={16} />} label="Mortalitas" value={`${mortalitasCount}/${totalAnimals}`} tone={mortalitasCount > 0 ? 'warn' : 'ok'} />
          <StatCard icon={<Scale size={16} />} label="Bobot rata" value={`${avgWeight}`} unit="kg" />
          <StatCard icon={<Calendar size={16} />} label="Sisa hari" value={remaining} unit="hari" />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button className="flex items-center justify-center gap-2 py-4 bg-emerald-500 text-[#0A0E0C] rounded-2xl font-bold text-[14px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
            <Scale size={18} />
            Timbang batch
          </button>
          <button className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-[14px] active:scale-95 transition-transform">
            <List size={18} />
            Lihat ternak
          </button>
        </div>
      </div>
    </MobileOverlay>
  )
}

function StatCard({ icon, label, value, unit, tone }) {
  const toneColors = {
    ok: 'text-emerald-400',
    warn: 'text-amber-400',
    danger: 'text-red-400',
    default: 'text-white'
  }
  const colorClass = toneColors[tone] || toneColors.default

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3 text-[#94A3B8]">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-[24px] font-display font-bold leading-none tracking-tight ${colorClass}`}>{value}</span>
        {unit && <span className="text-[12px] text-[#94A3B8] font-medium">{unit}</span>}
      </div>
    </Card>
  )
}
