import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronRight, X, Calendar, Hash, Warehouse, AlignLeft, LayoutGrid } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  useSapiBatches,
  useCreateSapiBatch,
  calcSapiHariDiFarm,
  calcSapiMortalitas,
} from '@/lib/hooks/useSapiPenggemukanData'
import { useAuth } from '@/lib/hooks/useAuth'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'

const BASE = '/peternak/peternak_sapi_penggemukan'

const STATUS_LABEL = {
  active:    { label: 'Aktif',     color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  closed:    { label: 'Selesai',   color: 'text-slate-400 bg-white/5 border-white/10' },
  cancelled: { label: 'Dibatalkan',color: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

function BatchCard({ batch, onClick }) {
  const hari   = calcSapiHariDiFarm(batch.start_date, batch.end_date)
  const mort   = calcSapiMortalitas(batch.mortality_count, batch.total_animals)
  const st     = STATUS_LABEL[batch.status] ?? STATUS_LABEL.active
  const adgKg  = batch.avg_adg_gram ? (batch.avg_adg_gram / 1000).toFixed(2) : null

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 cursor-pointer active:bg-white/[0.05] transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-['Sora'] font-bold text-sm text-white">{batch.batch_code}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${st.color}`}>
              {st.label}
            </span>
          </div>
          <p className="text-[11px] text-[#4B6478]">{batch.kandang_name}</p>
        </div>
        <ChevronRight size={15} className="text-[#4B6478] mt-0.5" />
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div>
          <p className="text-[12px] font-bold text-white">{batch.total_animals}</p>
          <p className="text-[10px] text-[#4B6478]">Ekor</p>
        </div>
        <div>
          <p className="text-[12px] font-bold text-white">{hari}</p>
          <p className="text-[10px] text-[#4B6478]">Hari</p>
        </div>
        <div>
          <p className={`text-[12px] font-bold ${mort > 2 ? 'text-red-400' : 'text-white'}`}>
            {mort}%
          </p>
          <p className="text-[10px] text-[#4B6478]">Mort.</p>
        </div>
        <div>
          <p className={`text-[12px] font-bold ${adgKg ? 'text-amber-400' : 'text-[#4B6478]'}`}>
            {adgKg ? `${adgKg}` : '—'}
          </p>
          <p className="text-[10px] text-[#4B6478]">ADG kg</p>
        </div>
      </div>

      {batch.status === 'closed' && batch.net_profit_idr != null && (
        <div className={`mt-3 pt-3 border-t border-white/[0.06] flex justify-between items-center`}>
          <span className="text-[11px] text-[#4B6478]">Net Profit</span>
          <span className={`text-[12px] font-bold ${batch.net_profit_idr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {batch.net_profit_idr >= 0 ? '+' : ''}
            {(batch.net_profit_idr / 1_000_000).toFixed(1)} jt
          </span>
        </div>
      )}
    </motion.div>
  )
}

function CreateBatchSheet({ onClose }) {
  const { tenant } = useAuth()
  const generateBatchCode = () => {
    const d = new Date()
    const dStr = `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear().toString().slice(2)}`
    const rnd = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `SAPI-${dStr}-${rnd}`
  }

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      batch_code: generateBatchCode(),
      kandang_name: tenant?.name || '',
      start_date: new Date().toISOString().split('T')[0]
    }
  })
  const { mutate: createBatch, isPending } = useCreateSapiBatch()

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

  // Styles
  const labelStyle = "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-amber-500/80 mb-2 ml-1"
  const inputContainerStyle = "relative transition-all duration-300 group/input"
  const inputClass = "w-full h-12 bg-[#111C24] border border-white/5 focus:border-amber-500/40 rounded-xl text-[14px] font-bold text-white placeholder:text-[#4B6478] focus:bg-[#15232d] focus:outline-none transition-all shadow-inner"
  
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-y-0 right-0 w-[420px] max-w-full z-50 bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-white/5 relative">
        <div className="absolute -top-10 right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="font-['Sora'] font-extrabold text-[22px] text-white tracking-tight leading-none mb-1">Buat Batch Baru</h2>
          <p className="text-[11px] text-[#4B6478] font-medium">Mulai siklus penggemukan baru Anda.</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors relative z-10">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar relative">
        <form id="createBatchForm" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          <div className={inputContainerStyle}>
            <label className={labelStyle}>
              <Hash size={12} className="text-amber-500" />
              Kode Batch <span className="text-amber-500/50">*</span>
            </label>
            <div className="relative">
              <input
                {...register('batch_code', { required: true })}
                placeholder="e.g. SAPI-2026-01"
                className={`pl-11 pr-4 ${inputClass}`}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-amber-500/40 group-focus-within/input:text-amber-500 transition-colors text-lg">#</div>
            </div>
            {errors.batch_code && <p className="text-red-400 text-[10px] mt-1.5 ml-1 font-medium">Kode wajib diisi</p>}
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>
              <Warehouse size={12} className="text-amber-500" />
              Nama Kandang <span className="text-amber-500/50">*</span>
            </label>
            <div className="relative">
              <Warehouse size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/40 group-focus-within/input:text-amber-500 transition-colors" />
              <input
                {...register('kandang_name', { required: true })}
                placeholder="e.g. Kandang A"
                className={`pl-11 pr-4 ${inputClass}`}
              />
            </div>
            {errors.kandang_name && <p className="text-red-400 text-[10px] mt-1.5 ml-1 font-medium">Kandang wajib diisi</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Calendar size={12} className="text-amber-500" />
                Tanggal Mulai <span className="text-amber-500/50">*</span>
              </label>
              <Controller
                name="start_date"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker 
                    value={field.value} 
                    onChange={field.onChange} 
                    placeholder="Pilih Tanggal"
                    className="h-12 bg-[#111C24] border-white/5 shadow-inner text-[14px] w-full"
                  />
                )}
              />
              {errors.start_date && <p className="text-red-400 text-[10px] mt-1.5 ml-1 font-medium">Wajib diisi</p>}
            </div>

            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Calendar size={12} className="text-amber-500" />
                Target Selesai
              </label>
              <Controller
                name="target_end_date"
                control={control}
                render={({ field }) => (
                  <DatePicker 
                    value={field.value} 
                    onChange={field.onChange} 
                    placeholder="Opsional"
                    className="h-12 bg-[#111C24] border-white/5 shadow-inner text-[14px] w-full"
                  />
                )}
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>
              <AlignLeft size={12} className="text-amber-500" />
              Catatan <span className="text-[#4B6478] ml-1 font-semibold normal-case tracking-normal">(opsional)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Breed dominan, asal ternak, dll."
              className="w-full px-4 py-3 bg-[#111C24] border border-white/5 focus:border-amber-500/40 rounded-xl text-sm font-medium text-white placeholder:text-[#4B6478] focus:bg-[#15232d] shadow-inner focus:outline-none transition-all resize-none"
            />
          </div>
        </form>
      </div>

      <div className="px-6 py-5 border-t border-white/5 bg-[#0C1319]">
        <button
          form="createBatchForm"
          type="submit"
          disabled={isPending}
          className="w-full h-[52px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-['Sora'] font-extrabold text-[15px] rounded-xl transition-all shadow-[0_4px_20px_rgba(245,158,11,0.25)] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isPending ? 'Menyimpan...' : 'Mulai Batch Sekarang'}
          {!isPending && <ChevronRight size={18} strokeWidth={3} className="opacity-80" />}
        </button>
      </div>
    </motion.div>
  )
}

export default function SapiBatch() {
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const { data: batches = [], isLoading } = useSapiBatches()

  const active = batches.filter(b => b.status === 'active')
  const closed = batches.filter(b => b.status !== 'active')

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <h1 className="font-['Sora'] font-black text-xl text-white">Batch Penggemukan</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-colors"
          >
            <Plus size={13} />
            Buat Batch
          </button>
        </div>
      </header>

      {/* Batch Aktif */}
      <section className="px-4 mt-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478] mb-3">
          Aktif ({active.length})
        </p>
        {active.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
               <LayoutGrid size={32} className="text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Belum ada batch aktif</p>
            <p className="text-xs text-[#4B6478]">Tap tombol Buat Batch di atas</p>
          </div>
        ) : (
          <div className="space-y-3">
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

      {/* Riwayat Batch */}
      {closed.length > 0 && (
        <section className="px-4 mt-6">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478] mb-3">
            Riwayat ({closed.length})
          </p>
          <div className="space-y-3">
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

      {/* Create Sheet */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowCreate(false)}
            />
            <CreateBatchSheet onClose={() => setShowCreate(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}