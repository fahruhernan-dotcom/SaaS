import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronRight, X, Calendar, Hash } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  useSapiBatches,
  useCreateSapiBatch,
  calcSapiHariDiFarm,
  calcSapiMortalitas,
} from '@/lib/hooks/useSapiPenggemukanData'
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
  const { register, handleSubmit, formState: { errors } } = useForm()
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

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-[#0C1319] rounded-t-[24px] border-t border-white/[0.08] p-5 pb-10"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-['Sora'] font-bold text-base text-white">Buat Batch Baru</h2>
        <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 text-[#94A3B8]">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Kode Batch
          </label>
          <div className="relative">
            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
            <input
              {...register('batch_code', { required: true })}
              placeholder="e.g. SAPI-2026-01"
              className="w-full pl-9 pr-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
            />
          </div>
          {errors.batch_code && <p className="text-red-400 text-[11px] mt-1">Wajib diisi</p>}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Nama Kandang
          </label>
          <input
            {...register('kandang_name', { required: true })}
            placeholder="e.g. Kandang A"
            className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
          />
          {errors.kandang_name && <p className="text-red-400 text-[11px] mt-1">Wajib diisi</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Tanggal Mulai
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
              <input
                {...register('start_date', { required: true })}
                type="date"
                className="w-full pl-9 pr-3 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            {errors.start_date && <p className="text-red-400 text-[11px] mt-1">Wajib diisi</p>}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Target Selesai
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
              <input
                {...register('target_end_date')}
                type="date"
                className="w-full pl-9 pr-3 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Catatan (opsional)
          </label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="Breed dominan, asal ternak, dll."
            className="w-full px-4 py-3 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Buat Batch'}
        </button>
      </form>
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
            <p className="text-2xl mb-2">🐄</p>
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
