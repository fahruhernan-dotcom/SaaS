import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, ChevronRight, X, Calendar, Hash, Warehouse, AlignLeft, 
  LayoutGrid, Search, Target, TrendingUp, Activity, ArrowRight, Lock, LockOpen,
  ShoppingCart, Archive, AlertTriangle, DollarSign, CheckCircle2, ChevronDown
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/ui/DatePicker'
import { cn } from '@/lib/utils'
import {
  useDombaBatches,
  useCreateDombaBatch,
  useCloseDombaBatch,
  useDombaAnimals,
  useDombaSales,
  useDombaFeedLogs,
  useDombaOperationalCosts,
  calcHariDiFarm,
  calcMortalitasDomba,
} from '@/lib/hooks/useDombaPenggemukanData'
import { useAuth } from '@/lib/hooks/useAuth'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { BrokerPageHeader } from '@/dashboard/_shared/components/transactions/BrokerPageHeader'
import { MobileHeader } from '@/dashboard/peternak/_shared/components/MobileViewPeternak/MobileHeader'
import { Button } from '@/components/ui/button'
import { format, addDays } from 'date-fns'
import { id } from 'date-fns/locale'
import KandangMiniMap from './KandangMiniMap'

const BASE = '/peternak/peternak_domba_penggemukan'

const STATUS_LABEL = {
  active:    { label: 'AKTIF',     color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  closed:    { label: 'SELESAI',   color: 'text-slate-400 bg-white/5 border-white/10' },
  cancelled: { label: 'BATAL',     color: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

function BatchCard({ batch, onClick, onCloseBatch }) {
  const perm = usePeternakPermissions()
  // Domba: target penggemukan ~90 hari
  const hari   = calcHariDiFarm(batch.start_date, batch.end_date)
  const TARGET_HARI = 90
  const sisaHari = Math.max(0, TARGET_HARI - hari)
  const estimasiPanen = addDays(new Date(batch.start_date), TARGET_HARI)
  
  const mort   = calcMortalitasDomba(batch.mortality_count, batch.total_animals)
  const st     = STATUS_LABEL[batch.status] ?? STATUS_LABEL.active
  
  const progress = Math.min(100, Math.round((hari / TARGET_HARI) * 100))
  const isOverdue = hari > TARGET_HARI
  const isCritical = mort > 3
  
  // ADG dalam gram/hari
  const adgVal = batch.avg_adg_gram ? Math.round(batch.avg_adg_gram) : null
  
  return (
    <motion.div
      className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-6 transition-all duration-300"
    >
      <div className={cn("flex flex-col gap-6", batch.status === 'active' && "lg:flex-row")}>
        {/* Left Side: Stats & Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span 
                    onClick={onClick}
                    className="font-['Sora'] font-black text-lg text-white hover:text-green-400 cursor-pointer transition-colors uppercase tracking-tight truncate max-w-full"
                  >
                    {batch.batch_code}
                  </span>
                  <span className={cn("text-[9px] px-2 py-0.5 rounded-lg border font-black tracking-widest uppercase", st.color)}>
                    {st.label}
                  </span>
                  {isOverdue && batch.status === 'active' && (
                    <span className="text-[9px] px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 font-black tracking-widest uppercase">OVERDUE</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[#4B6478]">
                   <Warehouse size={12} />
                   <p className="text-[11px] font-bold uppercase tracking-wider">{batch.kandang_name || 'Tanpa Kandang'}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-white font-['Sora'] leading-none mb-1">{batch.total_animals}</p>
                <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest">Ekor</p>
              </div>
            </div>

            {/* Summary Info Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
               <div>
                  <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-widest mb-1">Durasi</p>
                  <p className="text-xs font-black text-white uppercase">{hari} Hari</p>
               </div>
               {batch.status === 'active' && (
                 <div>
                    <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-widest mb-1">Estimasi Panen</p>
                    <p className="text-xs font-black text-green-400 uppercase">{format(estimasiPanen, 'dd MMM yyyy', { locale: id })}</p>
                 </div>
               )}
               {batch.status !== 'active' && batch.end_date && (
                 <div>
                    <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-widest mb-1">Tanggal Selesai</p>
                    <p className="text-xs font-black text-slate-400 uppercase">{format(new Date(batch.end_date), 'dd MMM yyyy', { locale: id })}</p>
                 </div>
               )}
            </div>

            {/* Progress bar */}
            {batch.status === 'active' && (
              <div className="mb-6 bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-[#4B6478] mb-1.5">
                  <span>Sisa {sisaHari} Hari</span>
                  <span>Target {TARGET_HARI} hari</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      isOverdue ? 'bg-red-500' : progress > 80 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-2.5 text-center">
              <p className="text-[11px] font-black text-white leading-none mb-1">{batch.mortality_count}</p>
              <p className="text-[9px] text-[#4B6478] font-bold uppercase tracking-widest">Mati</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-2.5 text-center">
              <p className={`text-[11px] font-black leading-none mb-1 ${mort > 3 ? 'text-red-400' : 'text-green-400'}`}>
                {mort}%
              </p>
              <p className="text-[9px] text-[#4B6478] font-bold uppercase tracking-widest">Mortalitas</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-2.5 text-center">
              <p className={`text-[11px] font-black leading-none mb-1 ${adgVal ? 'text-green-400' : 'text-[#4B6478]'}`}>
                {adgVal ? `${adgVal}g` : '—'}
              </p>
              <p className="text-[9px] text-[#4B6478] font-bold uppercase tracking-widest">ADG/Hr</p>
            </div>
          </div>
        </div>

        {/* Right Side: Map Visualization (Only for Active) */}
        {batch.status === 'active' && (
          <div className="w-full lg:w-[50%] xl:w-[60%] shrink-0">
            <KandangMiniMap batchIds={[batch.id]} className="mt-0" />
          </div>
        )}
      </div>

      {/* Action Footer — Only for Active Batch */}
      {batch.status === 'active' && (
        <div className="mt-5 pt-4 border-t border-white/[0.05] flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className="flex-1 flex items-center justify-center gap-2 h-9 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.07] rounded-xl text-[11px] font-black text-white uppercase tracking-widest transition-all"
          >
            <ChevronRight size={14} />
            Kelola Ternak
          </button>
          {perm.canTutupSiklus && (
            <button
              onClick={(e) => { e.stopPropagation(); onCloseBatch && onCloseBatch(batch) }}
              className="flex items-center justify-center gap-1.5 px-4 h-9 bg-white/[0.03] border border-amber-500/30 hover:bg-amber-500/10 rounded-xl text-[11px] font-black text-amber-400 uppercase tracking-widest transition-all"
            >
              <Archive size={13} />
              Tutup
            </button>
          )}
        </div>
      )}

      {batch.status === 'closed' && batch.net_profit_idr != null && (
        <div className="mt-6 pt-6 border-t border-white/[0.06] flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
             <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">NET PROFIT</span>
          </div>
          <span className={cn("text-lg font-black font-['Sora'] tabular-nums", batch.net_profit_idr >= 0 ? 'text-green-400' : 'text-red-400')}>
            {batch.net_profit_idr >= 0 ? '+' : ''}
            Rp {(Math.abs(batch.net_profit_idr) / 1_000_000).toFixed(1)} jt
          </span>
        </div>
      )}
    </motion.div>
  )
}

// ── CLOSE BATCH WIZARD ────────────────────────────────────────────────────────

function CloseBatchWizard({ batch, onClose }) {
  const { data: animals = [] } = useDombaAnimals(batch.id)
  const { data: sales = [] } = useDombaSales(batch.id)
  const { data: feedLogs = [] } = useDombaFeedLogs(batch.id)
  const { data: operationalCosts = [] } = useDombaOperationalCosts(batch.id)
  const { mutate: closeBatch, isPending } = useCloseDombaBatch()

  // Additional Operational Costs
  const [laborCost, setLaborCost] = React.useState(0)
  const [otherCost, setOtherCost] = React.useState(0)
  const [manualFeedCost, setManualFeedCost] = React.useState(0)

  // Auto-calculate costs from operational_costs table on mount
  React.useEffect(() => {
    // 1. Feed Cost (from category 'pakan')
    const costFeed = operationalCosts
      .filter(c => c.category === 'pakan')
      .reduce((s, c) => s + (parseFloat(c.amount_idr) || 0), 0)
    
    // 2. Labor Cost
    const costLabor = operationalCosts
      .filter(c => c.category === 'tenaga_kerja')
      .reduce((s, c) => s + (parseFloat(c.amount_idr) || 0), 0)

    // 3. Other Costs (medicine, etc)
    const costOther = operationalCosts
      .filter(c => c.category !== 'pakan' && c.category !== 'tenaga_kerja')
      .reduce((s, c) => s + (parseFloat(c.amount_idr) || 0), 0)

    if (costFeed > 0) setManualFeedCost(costFeed)
    if (costLabor > 0) setLaborCost(costLabor)
    if (costOther > 0) setOtherCost(costOther)
  }, [operationalCosts])

  const kpi = React.useMemo(() => {
    const soldAnimals  = animals.filter(a => a.status === 'sold')
    const activeAnimals = animals.filter(a => a.status === 'active')
    const deadAnimals  = animals.filter(a => a.status === 'dead')

    const sold_count   = soldAnimals.length
    const alive_count  = activeAnimals.length
    const total_revenue_idr = sales.reduce((s, t) => s + (parseFloat(t.total_revenue_idr) || 0), 0)
    const total_cogs_idr    = animals.reduce((s, a) => s + (parseFloat(a.purchase_price_idr) || 0), 0)
    
    // Total Expenses = HPP Beli + Pakan + Tenaga Kerja + Lainnya
    const total_expenses = total_cogs_idr + parseFloat(manualFeedCost || 0) + parseFloat(laborCost || 0) + parseFloat(otherCost || 0)
    
    const net_profit_idr    = total_revenue_idr - total_expenses
    const rc_ratio          = total_expenses > 0 ? (total_revenue_idr / total_expenses) : null

    const avgExitW = soldAnimals.length > 0
      ? soldAnimals.reduce((s, a) => s + (parseFloat(a.latest_weight_kg ?? a.entry_weight_kg) || 0), 0) / soldAnimals.length
      : null
    const avgEntryW = animals.length > 0
      ? animals.reduce((s, a) => s + (parseFloat(a.entry_weight_kg) || 0), 0) / animals.length
      : null

    return {
      sold_count, alive_count, deadCount: deadAnimals.length,
      total_revenue_idr, total_cogs_idr, net_profit_idr, rc_ratio,
      total_expenses, manualFeedCost, laborCost, otherCost,
      avg_exit_weight_kg: avgExitW, avg_entry_weight_kg: avgEntryW,
      end_date: new Date().toISOString().split('T')[0],
    }
  }, [animals, sales, manualFeedCost, laborCost, otherCost])

  const handleClose = () => {
    closeBatch({
      batchId: batch.id,
      kpiFinal: {
        end_date: kpi.end_date,
        sold_count: kpi.sold_count,
        alive_count: kpi.alive_count,
        total_revenue_idr: kpi.total_revenue_idr,
        total_cogs_idr: kpi.total_cogs_idr,
        total_feed_cost_idr: parseFloat(manualFeedCost) || 0,
        net_profit_idr: kpi.net_profit_idr,
        rc_ratio: kpi.rc_ratio,
        avg_exit_weight_kg: kpi.avg_exit_weight_kg,
        avg_entry_weight_kg: kpi.avg_entry_weight_kg,
      }
    }, { onSuccess: onClose })
  }

  const isProfit = kpi.net_profit_idr >= 0

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-y-0 right-0 w-[420px] max-w-full z-50 bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
        <div>
          <h2 className="font-['Sora'] font-extrabold text-xl text-white tracking-tight mb-1">Tutup Batch</h2>
          <p className="text-[11px] text-amber-400 font-black uppercase tracking-widest">{batch.batch_code}</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">

        {/* Warning if masih ada aktif */}
        {kpi.alive_count > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-300">Masih ada {kpi.alive_count} ekor aktif!</p>
              <p className="text-[11px] text-[#4B6478] mt-0.5 leading-relaxed">Domba yang belum terjual statusnya akan tetap 'aktif' setelah batch ditutup. Pastikan sudah dicatat dengan benar.</p>
            </div>
          </div>
        )}

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-3">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest border-b border-white/[0.06] pb-2 mb-3">Ringkasan KPI Final</p>
          {[
            { label: 'Tgl Selesai', value: format(new Date(), 'dd MMMM yyyy', { locale: id }) },
            { label: 'Total Ekor', value: `${animals.length} Ekor` },
            { label: 'Terjual', value: `${kpi.sold_count} Ekor`, color: 'text-blue-400' },
            { label: 'Mati / Afkir', value: `${kpi.deadCount} Ekor`, color: kpi.deadCount > 0 ? 'text-red-400' : 'text-white' },
          ].map(r => (
            <div key={r.label} className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-[#4B6478]">{r.label}</span>
              <span className={cn('font-black', r.color || 'text-white')}>{r.value}</span>
            </div>
          ))}
        </div>

        {/* Operational Costs Inputs */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-4">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest border-b border-white/[0.06] pb-2 mb-1">Audit Biaya Operasional</p>
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1.5 block">Biaya Pakan (Otomatis dari Log)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#4B6478]">RP</span>
                <input 
                  type="number"
                  value={manualFeedCost}
                  onChange={e => setManualFeedCost(e.target.value)}
                  className="w-full h-10 bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 text-xs font-black text-white focus:border-amber-500/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1.5 block text-xs">Tenaga Kerja</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#4B6478]">RP</span>
                  <input 
                    type="number"
                    value={laborCost}
                    onChange={e => setLaborCost(e.target.value)}
                    className="w-full h-10 bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 text-xs font-black text-white focus:border-amber-500/50 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1.5 block text-xs">Biaya Lainnya</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#4B6478]">RP</span>
                  <input 
                    type="number"
                    value={otherCost}
                    onChange={e => setOtherCost(e.target.value)}
                    className="w-full h-10 bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 text-xs font-black text-white focus:border-amber-500/50 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* P&L Summary */}
        <div className={cn('border rounded-[28px] p-5 relative overflow-hidden', isProfit ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-red-900/20 border-red-500/20')}>
          <div className="text-center">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] mb-2">Net Profit / Loss</p>
            <p className={cn('text-4xl font-black font-[\'Sora\'] tracking-tight', isProfit ? 'text-emerald-400' : 'text-red-400')}>
              {isProfit ? '+' : ''}Rp {(Math.abs(kpi.net_profit_idr) / 1_000_000).toFixed(2)} jt
            </p>
            {kpi.rc_ratio && (
              <p className="text-[11px] text-[#4B6478] mt-2">
                R/C Ratio: <span className={cn('font-black', kpi.rc_ratio >= 1.2 ? 'text-emerald-400' : 'text-amber-400')}>{kpi.rc_ratio.toFixed(2)}</span>
              </p>
            )}
          </div>
          <div className="flex justify-between mt-4 pt-3 border-t border-white/[0.08]">
            <div className="text-center">
              <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">Revenue</p>
              <p className="text-xs font-black text-emerald-400 text-[10px]">Rp {(kpi.total_revenue_idr / 1_000_000).toFixed(1)} jt</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">Expenses</p>
              <p className="text-xs font-black text-red-400 text-[10px]">Rp {(kpi.total_expenses / 1_000_000).toFixed(1)} jt</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-white/5 bg-[#0C1319] space-y-2">
        <button
          onClick={handleClose}
          disabled={isPending}
          className="w-full h-12 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
        >
          {isPending ? 'Menutup Batch...' : 'Konfirmasi & Tutup Batch'}
        </button>
        <button onClick={onClose} className="w-full h-10 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-[#4B6478] text-xs font-black uppercase tracking-widest rounded-xl transition-colors">
          Batal
        </button>
      </div>
    </motion.div>
  )
}

function CreateBatchSheet({ onClose }) {
  const generateBatchCode = () => {
    const d = new Date()
    const dStr = `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear().toString().slice(2)}`
    const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `DOMBA-${dStr}-${rnd}`
  }

  const { tenant } = useAuth()
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({
    defaultValues: {
      batch_code: generateBatchCode(),
      kandang_name: tenant?.business_name || '',
      start_date: new Date().toISOString().split('T')[0]
    }
  })
  const [isKandangLocked, setIsKandangLocked] = useState(true)
  
  useEffect(() => {
    if (tenant?.business_name && isKandangLocked) {
      setValue('kandang_name', tenant.business_name)
    }
  }, [tenant?.business_name, isKandangLocked, setValue])

  const { mutate: createBatch, isPending } = useCreateDombaBatch()

  const onSubmit = (data) => {
    createBatch(
      {
        batch_code:      data.batch_code.trim(),
        kandang_name:    data.kandang_name.trim(),
        start_date:      data.start_date,
        target_end_date: data.target_end_date || null,
        notes:           data.notes?.trim() || null,
      },
      { onSuccess: onClose }
    )
  }

  const labelStyle = "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] mb-3 ml-1"
  const inputContainerStyle = "relative transition-all duration-300 group/input"
  const inputClass = "w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white placeholder:text-[#4B6478]/50 focus:border-green-500/50 focus:bg-white/[0.05] transition-all outline-none"
  
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-[500px] max-w-full z-50 bg-[#0A1015]/95 backdrop-blur-3xl border-l border-white/[0.08] shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <div className="px-8 pt-10 pb-6 border-b border-white/[0.05] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><LayoutGrid size={120} /></div>
        <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="font-['Sora'] font-black text-2xl text-white tracking-tight leading-none mb-1.5">New Batch Cycle</h2>
              <p className="text-[11px] text-[#4B6478] font-black uppercase tracking-widest">Inisialisasi sistem fattening domba</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#4B6478] hover:text-white transition-all">
              <X size={18} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative">
        <form id="createBatchForm" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          <div className={inputContainerStyle}>
            <label className={labelStyle}>
              <Hash size={14} className="text-green-500" />
              Kode Batch Identitas <span className="text-red-500/50">*</span>
            </label>
            <div className="relative">
              <input
                {...register('batch_code', { required: true })}
                placeholder="AUTO-GENERATED"
                className={inputClass}
              />
            </div>
            {errors.batch_code && <p className="text-red-400 text-[10px] mt-2 ml-1 font-black uppercase">Wajib Diisi</p>}
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>
              <Warehouse size={14} className="text-green-500" />
              Gudang / Kandang Produksi <span className="text-red-500/50">*</span>
            </label>
            <div className="relative">
              <input
                {...register('kandang_name', { required: true })}
                readOnly={isKandangLocked}
                placeholder={isKandangLocked ? "Otomatis (Nama Bisnis)" : "Ketik Nama Kandang..."}
                className={cn(
                  inputClass, 
                  "pr-14",
                  isKandangLocked ? "opacity-70 cursor-not-allowed" : "border-green-500/30 bg-green-500/5"
                )}
              />
              <button
                type="button"
                onClick={() => {
                  const nextState = !isKandangLocked
                  setIsKandangLocked(nextState)
                  if (!nextState) {
                    // When unlocking, we might want to let user type. 
                    // When locking back, default it back to tenant name? 
                  } else {
                    setValue('kandang_name', tenant?.business_name || '')
                  }
                }}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                  isKandangLocked ? "bg-white/5 text-[#4B6478] hover:text-white" : "bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                )}
              >
                {isKandangLocked ? <Lock size={14} /> : <LockOpen size={14} />}
              </button>
            </div>
            {errors.kandang_name && <p className="text-red-400 text-[10px] mt-2 ml-1 font-black uppercase">Wajib Diisi</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                 <Calendar size={14} className="text-green-500" />
                 Tanggal Mulai
              </label>
              <Controller
                name="start_date"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker 
                    value={field.value} 
                    onChange={field.onChange} 
                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl text-[13px] w-full"
                  />
                )}
              />
            </div>

            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                 <Target size={14} className="text-green-500" />
                 Target Akhir
              </label>
              <Controller
                name="target_end_date"
                control={control}
                render={({ field }) => (
                  <DatePicker 
                    value={field.value} 
                    onChange={field.onChange} 
                    placeholder="Opsional"
                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl text-[13px] w-full"
                  />
                )}
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>
              <AlignLeft size={14} className="text-green-500" />
              Catatan Strategis
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              placeholder="Tambahkan detail atau tujuan khusus untuk batch ini..."
              className="w-full px-6 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold text-white placeholder:text-[#4B6478]/50 focus:border-green-500/50 focus:bg-white/[0.05] transition-all outline-none resize-none"
            />
          </div>
        </form>
      </div>

      <div className="p-8 border-t border-white/[0.05] bg-[#06090F]">
        <Button
          form="createBatchForm"
          type="submit"
          disabled={isPending}
          className="w-full h-16 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-['Sora'] font-black text-sm rounded-[2rem] transition-all shadow-xl shadow-green-600/20 group"
        >
          {isPending ? 'MENGIRIM DATA...' : 'AKTIVASI BATCH SEKARANG'}
          {!isPending && <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>
      </div>
    </motion.div>
  )
}

export default function DombaBatch() {
  const navigate = useNavigate()
  const perm = usePeternakPermissions()
  const [showCreate, setShowCreate] = useState(false)
  const [closingBatch, setClosingBatch] = useState(null)
  const [search, setSearch] = useState('')
  const { data: batches = [], isLoading } = useDombaBatches()

  const filtered = batches.filter(b => 
    b.batch_code.toLowerCase().includes(search.toLowerCase()) ||
    (b.kandang_name && b.kandang_name.toLowerCase().includes(search.toLowerCase()))
  )

  const active = filtered.filter(b => b.status === 'active')
  const closed = filtered.filter(b => b.status !== 'active')

  const isMobile = useMediaQuery('(max-width: 1024px)')

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="flex flex-col h-full bg-[#06090F]">
      {isMobile ? (
        <MobileHeader 
          title="Batch Cycle" 
          rightElement={
            <div className="flex items-center gap-2">
              {perm.canBuatSiklus && (
                <button 
                  onClick={() => setShowCreate(true)}
                  className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <Plus size={20} />
                </button>
              )}
            </div>
          }
        />
      ) : (
        <BrokerPageHeader 
          title="Batch Cycle"
          subtitle="Manajemen siklus fattening dan tracking performa per kelompok."
          icon={<TrendingUp size={20} className="text-green-400" />}
          actionButton={
            <div className="flex items-center gap-3">
               <div className="relative h-10 border border-white/[0.08] rounded-xl bg-white/[0.03] overflow-hidden hidden md:block w-64 group/search">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478] group-focus-within/search:text-green-400 transition-colors" />
                   <input 
                      value={search} 
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search Batch ID..." 
                      className="w-full h-full pl-9 pr-4 bg-transparent text-[11px] font-black uppercase tracking-widest text-white focus:outline-none" 
                   />
               </div>
               {perm.canBuatSiklus && (
                 <Button onClick={() => setShowCreate(true)} className="h-10 px-5 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-[0_4px_15px_rgba(34,197,94,0.3)] gap-2 transition-all active:scale-95">
                   <Plus size={16} /> Batch
                 </Button>
               )}
            </div>
          }
        />
      )}

      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-12 custom-scrollbar space-y-10">
        
        {/* Active Grid */}
        <section>
          <div className="flex items-center gap-4 mb-6 px-1">
             <h2 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Siklus Aktif</h2>
             <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
             <span className="text-[10px] font-black text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20">{active.length} BATCH</span>
          </div>

          {!active.length ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/[0.04] rounded-[3rem] bg-white/[0.01]">
               <Activity size={40} className="text-white/5 mb-4" />
               <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest mb-4">No Active Cycle Found</p>
               {perm.canBuatSiklus && (
                 <Button variant="outline" onClick={() => setShowCreate(true)} className="border-white/10 text-white/40 hover:text-white rounded-xl uppercase text-[10px] font-black h-9">Start New Batch</Button>
               )}
            </div>
          ) : (
            <div className="space-y-6">
              {active.map(b => (
                <BatchCard
                  key={b.id}
                  batch={b}
                  onClick={() => navigate(`${BASE}/ternak?batch=${b.id}`)}
                  onCloseBatch={(batch) => setClosingBatch(batch)}
                />
              ))}
            </div>
          )}
        </section>

        {closed.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-6 px-1">
               <h2 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Riwayat Selesai</h2>
               <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
               <span className="text-[10px] font-black text-[#4B6478] border border-white/10 px-2.5 py-1 rounded-lg bg-white/5">{closed.length} DATA</span>
            </div>
            <div className="space-y-6">
              {closed.map(b => (
                <BatchCard
                  key={b.id}
                  batch={b}
                  onClick={() => navigate(`${BASE}/laporan?batch=${b.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40 backdrop-blur-md"
              onClick={() => setShowCreate(false)}
            />
            <CreateBatchSheet onClose={() => setShowCreate(false)} />
          </>
        )}
        {closingBatch && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40 backdrop-blur-md"
              onClick={() => setClosingBatch(null)}
            />
            <CloseBatchWizard batch={closingBatch} onClose={() => setClosingBatch(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}