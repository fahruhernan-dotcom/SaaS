import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronRight, X, Calendar, Hash, Warehouse, AlignLeft, LayoutGrid, Search, Target, TrendingUp, Activity, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  useDombaBatches,
  useCreateDombaBatch,
  calcHariDiFarm,
  calcMortalitasDomba,
} from '@/lib/hooks/useDombaPenggemukanData'
import { useAuth } from '@/lib/hooks/useAuth'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { BrokerPageHeader } from '../../_shared/components/transactions/BrokerPageHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BASE = '/peternak/peternak_domba_penggemukan'

const STATUS_LABEL = {
  active:    { label: 'AKTIF',     color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  closed:    { label: 'SELESAI',   color: 'text-slate-400 bg-white/5 border-white/10' },
  cancelled: { label: 'BATAL',     color: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

function BatchCard({ batch, onClick }) {
  const hari   = calcHariDiFarm(batch.start_date, batch.end_date)
  const mort   = calcMortalitasDomba(batch.mortality_count, batch.total_animals)
  const st     = STATUS_LABEL[batch.status] ?? STATUS_LABEL.active
  
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-green-500/30 rounded-[2rem] p-6 cursor-pointer transition-all duration-300 overflow-hidden"
    >
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-['Sora'] font-black text-lg text-white tracking-tight uppercase">{batch.batch_code}</span>
            <span className={cn("text-[8px] px-2.5 py-1 rounded-lg border font-black tracking-[0.2em]", st.color)}>
              {st.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
             <Warehouse size={12} className="text-[#4B6478]" />
             <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.1em]">{batch.kandang_name || 'Tanpa Kandang'}</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-green-500/20 group-hover:text-green-400 transition-all shadow-inner">
           <ChevronRight size={18} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 relative z-10">
        <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/5">
          <p className="text-[14px] font-black text-white font-['Sora']">{batch.total_animals}</p>
          <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider mt-0.5">Ekor</p>
        </div>
        <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/5">
          <p className="text-[14px] font-black text-white font-['Sora']">{hari}</p>
          <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider mt-0.5">Hari</p>
        </div>
        <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/5">
          <p className={cn("text-[14px] font-black font-['Sora']", mort > 3 ? 'text-red-400' : 'text-white')}>
            {mort}%
          </p>
          <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider mt-0.5">Mort.</p>
        </div>
        <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/5">
          <p className={cn("text-[14px] font-black font-['Sora']", batch.avg_adg_gram >= 150 ? 'text-green-400' : batch.avg_adg_gram ? 'text-amber-400' : 'text-[#4B6478]')}>
            {batch.avg_adg_gram ? `${batch.avg_adg_gram}g` : '—'}
          </p>
          <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider mt-0.5">ADG</p>
        </div>
      </div>

      {batch.status === 'closed' && batch.net_profit_idr != null && (
        <div className="mt-5 pt-5 border-t border-white/[0.06] flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
             <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">NET PROFIT</span>
          </div>
          <span className={cn("text-base font-black font-['Sora'] tabular-nums", batch.net_profit_idr >= 0 ? 'text-green-400' : 'text-red-400')}>
            {batch.net_profit_idr >= 0 ? '+' : ''}
            Rp {(Math.abs(batch.net_profit_idr) / 1_000_000).toFixed(1)} jt
          </span>
        </div>
      )}
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
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      batch_code: generateBatchCode(),
      kandang_name: tenant?.name || '',
      start_date: new Date().toISOString().split('T')[0]
    }
  })
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
              <p className="text-[11px] text-[#4B6478] font-black uppercase tracking-widest">Inisialisasi sistem penggemukan domba</p>
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
            <input
              {...register('kandang_name', { required: true })}
              placeholder="Contoh: Kandang Area Timur"
              className={inputClass}
            />
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
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const { data: batches = [], isLoading } = useDombaBatches()

  const filtered = batches.filter(b => 
    b.batch_code.toLowerCase().includes(search.toLowerCase()) ||
    (b.kandang_name && b.kandang_name.toLowerCase().includes(search.toLowerCase()))
  )

  const active = filtered.filter(b => b.status === 'active')
  const closed = filtered.filter(b => b.status !== 'active')

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="flex flex-col h-full bg-[#06090F]">
      <BrokerPageHeader 
        title="Batch Cycle"
        subtitle="Manajemen siklus penggemukan dan tracking performa per kelompok."
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
             <Button onClick={() => setShowCreate(true)} className="h-10 px-5 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-[0_4px_15px_rgba(34,197,94,0.3)] gap-2 transition-all active:scale-95">
               <Plus size={16} /> Batch
             </Button>
          </div>
        }
      />

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
               <Button variant="outline" onClick={() => setShowCreate(true)} className="border-white/10 text-white/40 hover:text-white rounded-xl uppercase text-[10px] font-black h-9">Start New Batch</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {active.map(b => (
                <BatchCard
                  key={b.id}
                  batch={b}
                  onClick={() => navigate(`${BASE}/ternak?batch=${b.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* History Grid */}
        {closed.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-6 px-1">
               <h2 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Riwayat Selesai</h2>
               <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
               <span className="text-[10px] font-black text-[#4B6478] border border-white/10 px-2.5 py-1 rounded-lg bg-white/5">{closed.length} DATA</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-80">
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
      </AnimatePresence>
    </div>
  )
}