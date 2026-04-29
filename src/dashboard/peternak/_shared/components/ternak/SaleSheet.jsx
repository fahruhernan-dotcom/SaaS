import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, Check, Package } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { cn } from '@/lib/utils'
import { BUYER_TYPES, PRICE_TYPES } from './constants'

// Props:
//   batchId      — string
//   animals      — animal[] (all animals in batch)
//   onSale       — mutate fn: (payload, { onSuccess }) => void
//   isPending    — boolean
//   animalLabel  — e.g. "Domba", "Kambing"
//   onClose      — fn
export function SaleSheet({ batchId, animals, onSale, isPending, animalLabel = 'Ternak', onClose }) {
  const [step, setStep]           = useState(1)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const activeAnimals = useMemo(() => animals.filter(a => a.status === 'active'), [animals])

  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: {
      sale_date:       new Date().toISOString().split('T')[0],
      buyer_type:      'Pedagang',
      price_type:      'per_ekor',
      payment_method:  'Cash',
      is_paid:         true,
      has_skkh:        false,
      has_surat_jalan: false,
    }
  })

  const priceType        = watch('price_type')
  const priceAmount      = watch('price_amount') || 0
  const selectedAnimalsData = useMemo(() => activeAnimals.filter(a => selectedIds.has(a.id)), [activeAnimals, selectedIds])
  const totalWeightKg    = useMemo(() => selectedAnimalsData.reduce((s, a) => s + (parseFloat(a.latest_weight_kg ?? a.entry_weight_kg) || 0), 0), [selectedAnimalsData])
  const totalRevenue     = useMemo(() => {
    const p = parseFloat(priceAmount) || 0
    if (priceType === 'per_ekor') return p * selectedIds.size
    if (priceType === 'per_kg')   return p * totalWeightKg
    return 0
  }, [priceType, priceAmount, selectedIds.size, totalWeightKg])

  const toggleAnimal = (id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const onSubmit = (data) => {
    if (!selectedIds.size) return
    const ids = Array.from(selectedIds)
    onSale({
      batch_id:        batchId,
      sale_date:       data.sale_date,
      buyer_name:      data.buyer_name,
      buyer_type:      data.buyer_type,
      buyer_contact:   data.buyer_contact,
      animal_ids:      ids,
      animal_count:    ids.length,
      total_weight_kg: totalWeightKg,
      avg_weight_kg:   totalWeightKg / ids.length,
      price_type:      data.price_type,
      price_amount:    parseFloat(data.price_amount) || 0,
      total_revenue_idr: totalRevenue,
      payment_method:  data.payment_method,
      is_paid:         data.is_paid,
      has_skkh:        data.has_skkh,
      has_surat_jalan: data.has_surat_jalan,
      notes:           data.notes,
    }, { onSuccess: onClose })
  }

  const iCls = 'w-full h-11 px-4 bg-[#111C24] border border-white/5 focus:border-emerald-500/40 rounded-xl text-[13px] font-bold text-white placeholder:text-[#4B6478] focus:outline-none transition-all'
  const lCls = 'block text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/80 mb-2 ml-1'

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-y-0 right-0 w-[440px] max-w-full z-[4000] bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {step === 2 && <button onClick={() => setStep(1)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[#4B6478] hover:text-white transition"><ArrowLeft size={14} /></button>}
            <h2 className="font-['Sora'] font-extrabold text-xl text-white tracking-tight">{step === 1 ? `Pilih ${animalLabel}` : 'Data Transaksi'}</h2>
          </div>
          <p className="text-[11px] text-[#4B6478] font-medium">{step === 1 ? `${activeAnimals.length} aktif · ${selectedIds.size} dipilih` : `${selectedIds.size} ekor · ${totalWeightKg.toFixed(1)} kg`}</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"><X size={16} /></button>
      </div>

      <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5">
        {[1, 2].map(s => (
          <React.Fragment key={s}>
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all', step === s ? 'bg-emerald-600 text-white' : step > s ? 'bg-emerald-600/30 text-emerald-400' : 'bg-white/5 text-[#4B6478]')}>
              {step > s ? <Check size={12} /> : s}
            </div>
            {s < 2 && <div className={cn('flex-1 h-px', step > s ? 'bg-emerald-600/40' : 'bg-white/10')} />}
          </React.Fragment>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-28 custom-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="s1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="p-4 space-y-2">
              {activeAnimals.length === 0 ? (
                <div className="py-20 text-center"><Package size={40} className="mx-auto text-white/5 mb-4" /><p className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Tidak ada {animalLabel.toLowerCase()} aktif</p></div>
              ) : (
                <>
                  <button onClick={() => selectedIds.size === activeAnimals.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(activeAnimals.map(a => a.id)))}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition">
                    <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all', selectedIds.size === activeAnimals.length ? 'bg-emerald-600 border-emerald-600' : 'border-white/20')}>
                      {selectedIds.size === activeAnimals.length && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-[11px] font-black text-[#4B6478] uppercase tracking-widest">Pilih Semua ({activeAnimals.length})</span>
                  </button>
                  {activeAnimals.map(a => {
                    const isSelected = selectedIds.has(a.id)
                    return (
                      <button key={a.id} onClick={() => toggleAnimal(a.id)} className={cn('w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all', isSelected ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]')}>
                        <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all', isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-white/20')}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black text-white font-['Sora']">{a.ear_tag}</span>
                          <span className="text-[10px] text-[#4B6478] ml-2">{a.breed || '—'}</span>
                          <p className="text-[10px] text-[#4B6478]">{a.sex === 'betina' ? 'Betina' : 'Jantan'}</p>
                        </div>
                        <p className="text-sm font-black text-white">{(parseFloat(a.latest_weight_kg ?? a.entry_weight_kg) || 0).toFixed(1)} <span className="text-[10px] text-[#4B6478]">kg</span></p>
                      </button>
                    )
                  })}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="p-5 space-y-4">
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4 flex items-center justify-between">
                <div><p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">Dipilih</p><p className="text-2xl font-black text-white font-['Sora']">{selectedIds.size} <span className="text-sm text-[#4B6478]">Ekor</span></p></div>
                <div className="text-right"><p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">Total Berat</p><p className="text-2xl font-black text-emerald-400 font-['Sora']">{totalWeightKg.toFixed(1)} <span className="text-sm text-[#4B6478]">kg</span></p></div>
              </div>
              <form id="sale-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div><label className={lCls}>Tanggal Jual</label><Controller name="sale_date" control={control} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} className="h-11 bg-[#111C24] border-white/5 rounded-xl" />} /></div>
                <div><label className={lCls}>Nama Pembeli</label><input {...register('buyer_name', { required: true })} placeholder="e.g. Pak Budi" className={iCls} /></div>
                <div>
                  <label className={lCls}>Tipe Pembeli</label>
                  <div className="flex flex-wrap gap-2">
                    {BUYER_TYPES.map(t => (
                      <label key={t}><input type="radio" {...register('buyer_type')} value={t} className="sr-only" />
                        <span className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black border cursor-pointer transition-all uppercase tracking-wide', watch('buyer_type') === t ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' : 'bg-white/[0.03] border-white/10 text-[#4B6478]')}>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={lCls}>Harga</label>
                  <div className="flex gap-2 mb-3">
                    {PRICE_TYPES.map(pt => (
                      <label key={pt.value} className="flex-1"><input type="radio" {...register('price_type')} value={pt.value} className="sr-only" />
                        <span className={cn('flex items-center justify-center h-10 rounded-xl text-[11px] font-black border cursor-pointer transition-all', watch('price_type') === pt.value ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' : 'bg-white/[0.03] border-white/10 text-[#4B6478]')}>{pt.label}</span>
                      </label>
                    ))}
                  </div>
                  <Controller name="price_amount" control={control} render={({ field }) => <InputRupiah value={field.value} onChange={field.onChange} placeholder={priceType === 'per_ekor' ? 'Harga per ekor (Rp)' : 'Harga per kg (Rp)'} className="h-11" />} />
                </div>
                <div className="bg-gradient-to-br from-emerald-900/40 to-green-900/30 border border-emerald-500/20 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest mb-1">Estimasi Total Pendapatan</p>
                  <p className="text-3xl font-black text-emerald-400 font-['Sora']">Rp {Math.round(totalRevenue).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <label className={lCls}>Metode Bayar</label>
                  <div className="flex gap-2">
                    {['Cash', 'Transfer', 'Hutang'].map(m => (
                      <label key={m} className="flex-1"><input type="radio" {...register('payment_method')} value={m} className="sr-only" />
                        <span className={cn('flex items-center justify-center h-10 rounded-xl text-[11px] font-black border cursor-pointer transition-all', watch('payment_method') === m ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'bg-white/[0.03] border-white/10 text-[#4B6478]')}>{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {[{ name: 'is_paid', label: 'Sudah Lunas' }, { name: 'has_skkh', label: 'SKKH Ada' }, { name: 'has_surat_jalan', label: 'Surat Jalan Ada' }].map(({ name, label }) => (
                  <label key={name} className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl cursor-pointer hover:bg-white/[0.04] transition">
                    <span className="text-xs font-black text-white">{label}</span>
                    <Controller name={name} control={control} render={({ field }) => (
                      <div onClick={() => field.onChange(!field.value)} className={cn('w-11 h-6 rounded-full border transition-all duration-300 flex items-center relative cursor-pointer', field.value ? 'bg-emerald-600 border-emerald-500' : 'bg-white/10 border-white/20')}>
                        <div className={cn('w-4 h-4 bg-white rounded-full shadow-lg absolute transition-all duration-300', field.value ? 'left-[26px]' : 'left-1')} />
                      </div>
                    )} />
                  </label>
                ))}
                <div><label className={lCls}>Catatan</label><textarea {...register('notes')} rows={2} className="w-full px-4 py-3 bg-[#111C24] border border-white/5 focus:border-emerald-500/40 rounded-xl text-[13px] font-medium text-white placeholder:text-[#4B6478] focus:outline-none transition-all resize-none" /></div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 py-4 border-t border-white/5 bg-[#0C1319]">
        {step === 1 ? (
          <button disabled={selectedIds.size === 0} onClick={() => setStep(2)} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.25)]">
            Lanjut ({selectedIds.size} Dipilih) →
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors">Kembali</button>
            <button form="sale-form" type="submit" disabled={isPending} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.25)]">
              {isPending ? 'Menyimpan...' : 'Konfirmasi Jual'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
