import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Tag, Scale, AlertCircle, Warehouse, AlignLeft, Hash, Activity, Calendar, Clock, Target, ChevronRight } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import { BreedCombobox } from './BreedCombobox'

// Props:
//   batchId          — string
//   animals          — animal[] (for ear tag sequence)
//   onAdd            — mutate fn: (payload, { onSuccess }) => void
//   isPending        — boolean
//   animalLabel      — e.g. "Domba", "Kambing", "Sapi"
//   breedSuggestions — string[]
//   onClose          — fn
export function AddAnimalSheet({ batchId, animals = [], onAdd, isPending, animalLabel = 'Ternak', breedSuggestions = [], onClose }) {
  const { tenant } = useAuth()

  const generateEarTag = () => {
    const name     = tenant?.business_name || animalLabel
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
    const seq      = String(animals.length + 1).padStart(4, '0')
    return `${initials}-${new Date().getFullYear()}-${seq}`
  }

  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm({
    defaultValues: {
      ear_tag:            generateEarTag(),
      sex:                'jantan',
      entry_date:         new Date().toISOString().split('T')[0],
      acquisition_type:   'beli',
      age_confidence:     'estimasi',
      price_per_kg:       0,
      purchase_price_idr: 0,
    }
  })

  const acquisitionType = watch('acquisition_type')
  const entryWeight     = watch('entry_weight_kg')
  const purchasePrice   = watch('purchase_price_idr')
  const pricePerKg      = watch('price_per_kg')

  useEffect(() => {
    const w = parseFloat(entryWeight), p = parseFloat(pricePerKg)
    if (!isNaN(w) && !isNaN(p) && w > 0 && p > 0) {
      const total = Math.round(w * p)
      if (Math.abs(total - purchasePrice) > 1) setValue('purchase_price_idr', total)
    }
  }, [entryWeight, pricePerKg, setValue, purchasePrice])

  useEffect(() => {
    const w = parseFloat(entryWeight), t = parseFloat(purchasePrice)
    if (!isNaN(w) && !isNaN(t) && w > 0 && t > 0) {
      const perKg = Math.round(t / w)
      if (Math.abs(perKg - pricePerKg) > 1) setValue('price_per_kg', perKg)
    }
  }, [purchasePrice, entryWeight, setValue, pricePerKg])

  const onSubmit = (data) => {
    onAdd({
      batch_id:           batchId,
      ear_tag:            data.ear_tag.trim(),
      breed:              data.breed?.trim() || null,
      sex:                data.sex,
      entry_age_months:   data.entry_age_months ? parseInt(data.entry_age_months) : null,
      age_confidence:     data.age_confidence,
      entry_date:         data.entry_date,
      entry_weight_kg:    parseFloat(data.entry_weight_kg),
      entry_bcs:          data.entry_bcs ? parseFloat(data.entry_bcs) : null,
      entry_condition:    data.entry_condition || null,
      purchase_price_idr: acquisitionType === 'beli' && data.purchase_price_idr ? parseInt(data.purchase_price_idr) : 0,
      source:             data.source?.trim() || null,
      kandang_slot:       data.kandang_slot?.trim() || null,
      notes:              data.notes?.trim() || null,
    }, { onSuccess: onClose })
  }

  const lCls = 'flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-green-500/80 mb-2 ml-1'
  const iCls = 'w-full h-11 bg-[#111C24] border border-white/5 focus:border-green-500/40 rounded-xl text-[14px] font-bold text-white placeholder:text-[#4B6478] focus:bg-[#15232d] focus:outline-none transition-all shadow-inner'
  const grp  = 'relative transition-all duration-300 group/input'

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-y-0 right-0 w-[420px] max-w-full z-[4000] bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-white/5 relative">
        <div className="absolute -top-10 right-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="font-['Sora'] font-extrabold text-[22px] text-white tracking-tight leading-none mb-1">Tambah {animalLabel}</h2>
          <p className="text-[11px] text-[#4B6478] font-medium">Tambah record ternak baru</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors relative z-10">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 pb-28 custom-scrollbar relative">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className={grp}>
            <label className={lCls}><Tag size={12} className="text-green-500" /> Ear Tag / ID <span className="text-green-500/50">*</span></label>
            <div className="relative">
              <input {...register('ear_tag', { required: true })} placeholder="e.g. DM-2026-0001" className={`pl-11 pr-4 ${iCls}`} />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-green-500/40 group-focus-within/input:text-green-500 transition-colors text-lg">#</div>
            </div>
            {errors.ear_tag && <p className="text-red-400 text-[10px] mt-1.5 ml-1 font-medium">ID wajib diisi</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={grp}>
              <label className={lCls}><Warehouse size={12} className="text-green-500" /> Breed</label>
              <Controller control={control} name="breed" render={({ field }) => (
                <BreedCombobox value={field.value} onChange={field.onChange} suggestions={breedSuggestions} />
              )} />
            </div>
            <div className={grp}>
              <label className={lCls}><Activity size={12} className="text-green-500" /> Kelamin <span className="text-green-500/50">*</span></label>
              <Controller control={control} name="sex" rules={{ required: true }} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full px-4 h-11 bg-[#111C24] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-green-500/50 outline-none transition-all shadow-inner">
                    <SelectValue placeholder="Pilih Kelamin" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111C24] border border-white/10 rounded-xl shadow-xl z-[9999]">
                    <SelectItem value="jantan">Jantan</SelectItem>
                    <SelectItem value="betina">Betina</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={grp}>
              <label className={lCls}><Warehouse size={12} className="text-green-500" /> Asal Ternak</label>
              <Controller control={control} name="acquisition_type" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full h-11 bg-[#111C24] border-white/5 rounded-xl text-[12px] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111C24] border border-white/10 rounded-xl z-[9999]">
                    <SelectItem value="beli">Beli / Pasar</SelectItem>
                    <SelectItem value="lahir_sendiri">Lahir Sendiri</SelectItem>
                    <SelectItem value="hibah">Hibah</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className={grp}>
              <label className={lCls}><AlertCircle size={12} className="text-green-500" /> Kondisi Masuk</label>
              <Controller control={control} name="entry_condition" render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full h-11 bg-[#111C24] border-white/5 rounded-xl text-[12px] text-white">
                    <SelectValue placeholder="Pilih Kondisi" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111C24] border border-white/10 rounded-xl z-[9999]">
                    <SelectItem value="sehat">Sehat</SelectItem>
                    <SelectItem value="kurus">Kurus</SelectItem>
                    <SelectItem value="cacat">Cacat Minor</SelectItem>
                    <SelectItem value="sakit">Sakit</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={grp}>
              <label className={lCls}><Clock size={12} className="text-green-500" /> Usia Masuk (bln)</label>
              <input {...register('entry_age_months')} type="number" placeholder="e.g. 6" className={`px-4 text-center ${iCls}`} />
            </div>
            <div className={grp}>
              <label className={lCls}><Target size={12} className="text-green-500" /> Akurasi Usia</label>
              <Controller control={control} name="age_confidence" render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full h-11 bg-[#111C24] border-white/5 rounded-xl text-[12px] text-white">
                    <SelectValue placeholder="Pilih Akurasi" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111C24] border border-white/10 rounded-xl z-[9999]">
                    <SelectItem value="pasti">Pasti (Tgl Lahir)</SelectItem>
                    <SelectItem value="estimasi_gigi">Estimasi Gigi (Poel)</SelectItem>
                    <SelectItem value="estimasi_fisik">Estimasi Fisik</SelectItem>
                    <SelectItem value="klaim_penjual">Klaim Penjual</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={grp}>
              <label className={lCls}><Calendar size={12} className="text-green-500" /> Tanggal Masuk <span className="text-green-500/50">*</span></label>
              <Controller control={control} name="entry_date" rules={{ required: true }} render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} className="h-11 bg-[#111C24] border-white/5 shadow-inner" />
              )} />
            </div>
            <div className={grp}>
              <label className={lCls}><Scale size={12} className="text-green-500" /> Berat Masuk (kg) <span className="text-green-500/50">*</span></label>
              <input {...register('entry_weight_kg', { required: true })} type="number" step="0.1" placeholder="e.g. 25" className={`px-4 text-center ${iCls}`} />
            </div>
          </div>

          {acquisitionType === 'beli' && (
            <div className="grid grid-cols-2 gap-3">
              <div className={grp}>
                <label className={lCls}><Scale size={12} className="text-green-500" /> Harga Per Kg (Rp)</label>
                <InputRupiah
                  value={watch('price_per_kg')}
                  onChange={val => {
                    setValue('price_per_kg', val)
                    const w = parseFloat(watch('entry_weight_kg'))
                    if (!isNaN(w) && w > 0) setValue('purchase_price_idr', Math.round(w * val))
                  }}
                  placeholder="0"
                  className="h-11 bg-[#111C24] border-white/5 shadow-inner rounded-xl"
                />
              </div>
              <div className={grp}>
                <label className={lCls}><Tag size={12} className="text-green-500" /> Total Harga Beli (Rp)</label>
                <InputRupiah
                  value={watch('purchase_price_idr')}
                  onChange={val => {
                    setValue('purchase_price_idr', val)
                    const w = parseFloat(watch('entry_weight_kg'))
                    if (!isNaN(w) && w > 0) setValue('price_per_kg', Math.round(val / w))
                  }}
                  placeholder="0"
                  className="h-11 bg-[#111C24] border-white/5 shadow-inner rounded-xl"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className={grp}>
              <label className={lCls}><Activity size={12} className="text-green-500" /> BCS (1-5)</label>
              <input {...register('entry_bcs')} type="number" step="0.5" placeholder="e.g. 2.5" className={`px-4 text-center ${iCls}`} />
            </div>
            <div className={grp}>
              <label className={lCls}><Warehouse size={12} className="text-green-500" /> Sumber / Pasar</label>
              <input {...register('source')} placeholder="e.g. Pasar Wonosari" className={`px-4 ${iCls}`} />
            </div>
          </div>

          <div className={grp}>
            <label className={lCls}><AlignLeft size={12} className="text-green-500" /> Catatan</label>
            <textarea {...register('notes')} rows={2} placeholder="Catatan tambahan..." className="w-full px-4 py-3 bg-[#111C24] border border-white/5 rounded-xl text-sm font-medium text-white placeholder:text-[#4B6478] focus:bg-[#15232d] shadow-inner focus:outline-none transition-all resize-none" />
          </div>

          <button
            type="submit" disabled={isPending}
            className="w-full h-[52px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white font-['Sora'] font-extrabold text-[15px] rounded-xl transition-all shadow-[0_4px_20px_rgba(22,163,74,0.25)] flex items-center justify-center gap-2 mt-2"
          >
            {isPending ? 'Menyimpan...' : `Tambah ${animalLabel} Ke Batch`}
            {!isPending && <ChevronRight size={18} strokeWidth={3} className="opacity-80" />}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
