import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Trash2 } from 'lucide-react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { useAuth } from '@/lib/hooks/useAuth'
import { BreedCombobox } from './BreedCombobox'

// Props:
//   batchId          — string
//   animalsCount     — number (for ear tag auto-seq)
//   onBulkAdd        — mutate fn: (payload, { onSuccess }) => void
//   isPending        — boolean
//   animalLabel      — e.g. "Domba", "Kambing", "Sapi"
//   breedSuggestions — string[]
//   onClose          — fn
export function BulkAddSheet({ batchId, animalsCount, onBulkAdd, isPending, animalLabel = 'Ternak', breedSuggestions = [], onClose }) {
  const { tenant } = useAuth()

  const getEarTag = (idx) => {
    const pfx = (tenant?.business_name || animalLabel).split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
    const seq  = String(animalsCount + idx + 1).padStart(4, '0')
    return `${pfx}-${new Date().getFullYear()}-${seq}`
  }

  const [globalPrice, setGlobalPrice] = useState(0)

  const { control, register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      rows: [0, 1, 2].map(i => ({
        ear_tag: getEarTag(i), sex: 'jantan',
        entry_date: new Date().toISOString().split('T')[0],
        entry_weight_kg: '', breed: '', price_per_kg: 0, purchase_price_idr: 0,
      }))
    }
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'rows' })

  const applyGlobalPrice = (val) => {
    setGlobalPrice(val)
    fields.forEach((_, i) => {
      setValue(`rows.${i}.price_per_kg`, val)
      const w = parseFloat(watch(`rows.${i}.entry_weight_kg`))
      if (!isNaN(w) && w > 0) setValue(`rows.${i}.purchase_price_idr`, Math.round(w * val))
    })
  }

  const onSubmit = (data) => {
    const valid = data.rows.filter(r => r.ear_tag && (r.entry_weight_kg || r.purchase_price_idr))
    if (!valid.length) return
    onBulkAdd({ batch_id: batchId, animals: valid }, { onSuccess: onClose })
  }

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      className="fixed inset-0 z-[60] bg-[#0A1015] flex flex-col"
    >
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0C1319]">
        <div className="flex flex-col gap-1">
          <h3 className="text-[18px] font-black tracking-tight text-white font-['Sora']">Input Massal (Bulk)</h3>
          <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-[0.1em]">Masukkan banyak {animalLabel.toLowerCase()} sekaligus</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-2 px-4 rounded-2xl shadow-xl">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-green-500/80">Set Harga per Kg All</span>
              <InputRupiah value={globalPrice} onChange={applyGlobalPrice} className="h-8 w-36 bg-[#0D151C] border-white/5 rounded-xl text-xs font-bold shadow-inner" placeholder="Rp 0" />
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-500/10 hover:text-red-400 transition-all hover:border-red-500/20">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#0A1015] p-6 lg:p-8 scrollbar-thin">
        <div className="min-w-[1200px] max-w-[1600px] mx-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] border-b border-white/5">
                <th className="pb-4 px-3 text-left">Ear Tag *</th>
                <th className="pb-4 px-3 text-left">Breed *</th>
                <th className="pb-4 px-3 text-left w-24">Kelamin *</th>
                <th className="pb-4 px-3 text-left w-24">Berat *</th>
                <th className="pb-4 px-3 text-left w-28">Harga Per Kg</th>
                <th className="pb-4 px-3 text-left w-36">Harga Beli</th>
                <th className="pb-4 px-3 text-left w-24">Usia (bln)</th>
                <th className="pb-4 px-3 text-left w-36">Tgl Masuk *</th>
                <th className="pb-4 px-3 text-center w-16">Hapus</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => (
                <tr key={f.id} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                  <td className="py-2.5 px-3">
                    <input {...register(`rows.${i}.ear_tag`)} placeholder={`ID ${animalLabel}`} className="bg-transparent text-white text-[13px] font-black outline-none border-b border-white/5 focus:border-green-500/50 w-full font-['Sora']" />
                  </td>
                  <td className="py-2.5 px-3">
                    <Controller control={control} name={`rows.${i}.breed`} render={({ field }) => (
                      <BreedCombobox value={field.value} onChange={field.onChange} suggestions={breedSuggestions} compact />
                    )} />
                  </td>
                  <td className="py-2.5 px-3">
                    <Controller control={control} name={`rows.${i}.sex`} render={({ field }) => (
                      <select value={field.value} onChange={e => field.onChange(e.target.value)} className="bg-[#111C24] border border-white/10 rounded-lg text-[11px] font-bold text-white px-2 py-1.5 outline-none w-full appearance-none">
                        <option value="jantan">JANTAN</option>
                        <option value="betina">BETINA</option>
                      </select>
                    )} />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="relative">
                      <Controller control={control} name={`rows.${i}.entry_weight_kg`} render={({ field }) => (
                        <input
                          {...field} type="number" step="0.1"
                          onChange={e => {
                            field.onChange(e.target.value)
                            const pkg = parseFloat(watch(`rows.${i}.price_per_kg`))
                            const w   = parseFloat(e.target.value)
                            if (!isNaN(w) && !isNaN(pkg) && w > 0 && pkg > 0)
                              setValue(`rows.${i}.purchase_price_idr`, Math.round(w * pkg))
                          }}
                          className="bg-transparent text-white text-[13px] font-black outline-none border-b border-white/5 focus:border-green-500/50 w-full text-right pr-4 font-['Sora']"
                          placeholder="0"
                        />
                      )} />
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#4B6478]">kg</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <Controller control={control} name={`rows.${i}.price_per_kg`} render={({ field }) => (
                      <InputRupiah value={field.value} onChange={v => {
                        field.onChange(v)
                        const w = parseFloat(watch(`rows.${i}.entry_weight_kg`))
                        if (!isNaN(w) && w > 0) setValue(`rows.${i}.purchase_price_idr`, Math.round(w * v))
                      }} className="h-8 text-[11px] font-bold bg-transparent border-0 border-b border-white/5 rounded-none px-0" />
                    )} />
                  </td>
                  <td className="py-2.5 px-3">
                    <Controller control={control} name={`rows.${i}.purchase_price_idr`} render={({ field }) => (
                      <InputRupiah value={field.value} onChange={v => {
                        field.onChange(v)
                        const w = parseFloat(watch(`rows.${i}.entry_weight_kg`))
                        if (!isNaN(w) && w > 0) setValue(`rows.${i}.price_per_kg`, Math.round(v / w))
                      }} className="h-8 text-[11px] font-bold bg-transparent border-0 border-b border-white/5 rounded-none px-0" />
                    )} />
                  </td>
                  <td className="py-2.5 px-3">
                    <input {...register(`rows.${i}.entry_age_months`)} type="number" placeholder="0" className="bg-transparent text-white text-[13px] font-bold outline-none border-b border-white/5 focus:border-green-500/50 w-full text-center" />
                  </td>
                  <td className="py-2.5 px-3">
                    <Controller control={control} name={`rows.${i}.entry_date`} render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} className="h-8 px-2 text-[10px] font-bold border-0 border-b border-white/5 bg-transparent rounded-none" />
                    )} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button onClick={() => remove(i)} className="w-8 h-8 flex items-center justify-center text-[#4B6478] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all mx-auto">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => append({
              ear_tag: getEarTag(fields.length), sex: 'jantan',
              entry_date: new Date().toISOString().split('T')[0],
              entry_weight_kg: '', breed: '', entry_age_months: '',
              price_per_kg: globalPrice, purchase_price_idr: 0,
            })}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-2xl text-[12px] font-black text-green-500 uppercase tracking-widest transition-all group shadow-lg"
          >
            <Plus size={14} strokeWidth={3} /> Tambah Baris Baru
          </button>
        </div>
      </div>

      <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#0C1319]">
        <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">Batal</button>
        <button onClick={handleSubmit(onSubmit)} disabled={isPending} className="px-8 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-widest shadow-[0_4px_20px_rgba(22,163,74,0.3)] disabled:opacity-50">
          {isPending ? 'Menyimpan Semua...' : 'Simpan Semua Data'}
        </button>
      </div>
    </motion.div>
  )
}
