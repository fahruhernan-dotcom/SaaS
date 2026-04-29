import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { BCS_OPTIONS, FAMACHA_OPTIONS, FAMACHA_COLOR, BCS_LABEL, WEIGH_METHOD_LABEL } from './constants'

// Props:
//   animal           — animal object (with _weightRecords pre-normalized)
//   onAddWeight      — mutate fn from parent (e.g. useAddDombaWeightRecord().mutate)
//   isPending        — boolean
//   onClose          — fn
export function QuickWeighSheet({ animal, onAddWeight, isPending, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: { weight_kg: '', bcs: '', famacha_score: '', notes: '' }
  })
  const bcs     = watch('bcs')
  const famacha = watch('famacha_score')

  const weightRecords = animal._weightRecords ?? []
  const records = [...weightRecords]
    .sort((a, b) => new Date(b.weigh_date) - new Date(a.weigh_date))
    .slice(0, 4)

  const latestW = animal.latest_weight_kg ?? animal.entry_weight_kg

  const onSubmit = (data) => {
    if (!data.weight_kg) return
    onAddWeight({
      animal_id:        animal.id,
      batch_id:         animal.batch_id,
      entry_date:       animal.entry_date,
      entry_weight_kg:  animal.entry_weight_kg,
      weigh_date:       today,
      weight_kg:        parseFloat(data.weight_kg),
      bcs:              data.bcs          ? parseInt(data.bcs)          : null,
      famacha_score:    data.famacha_score ? parseInt(data.famacha_score) : null,
      notes:            data.notes || null,
    }, { onSuccess: onClose })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[3900]"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed inset-y-0 right-0 w-[420px] max-w-full z-[4000] bg-[#0A1015] border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
      >
        <div className="px-6 pt-8 pb-4 border-b border-white/[0.06] shrink-0 relative">
          <div className="absolute -top-10 right-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mb-0.5">Timbang Cepat</p>
              <h2 className="font-['Sora'] font-extrabold text-[22px] text-white leading-none">{animal.ear_tag}</h2>
              <p className="text-[11px] text-[#4B6478] font-bold uppercase mt-0.5">{animal.breed || '—'} · {animal.sex === 'betina' ? 'Betina' : 'Jantan'}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-[#4B6478] font-bold">Berat Terakhir</p>
                <p className="font-['Sora'] font-black text-xl text-white">{latestW} <span className="text-sm text-[#4B6478]">kg</span></p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar pb-10">
          {records.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] mb-2">Riwayat Timbang</p>
              <div className="space-y-1.5">
                {records.map((r, i) => {
                  const diff      = i < records.length - 1
                    ? (r.weight_kg - records[i + 1].weight_kg).toFixed(1)
                    : (r.weight_kg - animal.entry_weight_kg).toFixed(1)
                  const methodCfg = WEIGH_METHOD_LABEL[r.weigh_method]
                  return (
                    <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-white/[0.03] rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-green-400' : 'bg-white/20'}`} />
                        <span className="text-[11px] text-[#4B6478] font-bold">
                          {new Date(r.weigh_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                        {methodCfg && <span className={`text-[9px] font-black uppercase ${methodCfg.color}`}>{methodCfg.label}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${parseFloat(diff) > 0 ? 'text-green-400' : parseFloat(diff) < 0 ? 'text-rose-400' : 'text-[#4B6478]'}`}>
                          {parseFloat(diff) > 0 ? `+${diff}` : diff} kg
                        </span>
                        <span className="font-['Sora'] font-black text-sm text-white">{r.weight_kg} kg</span>
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    <span className="text-[11px] text-[#4B6478] font-bold">
                      {new Date(animal.entry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                    <span className="text-[9px] font-black uppercase text-[#4B6478]/60">Masuk</span>
                  </div>
                  <span className="font-['Sora'] font-black text-sm text-[#4B6478]">{animal.entry_weight_kg} kg</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] mb-1.5 block">
                Berat Sekarang (kg) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  {...register('weight_kg', { required: true })}
                  type="number" step="0.1" inputMode="decimal"
                  placeholder={`Terakhir: ${latestW} kg`}
                  className="w-full h-14 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 text-white font-['Sora'] font-black text-xl placeholder:text-[#4B6478]/50 placeholder:font-normal placeholder:text-sm focus:outline-none focus:border-green-500/50 focus:bg-white/[0.06] transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B6478] font-bold text-sm">kg</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] mb-1.5 block">
                BCS <span className="text-[#4B6478]/50">(opsional)</span>
              </label>
              <div className="flex gap-2">
                {BCS_OPTIONS.map(n => (
                  <button key={n} type="button"
                    onClick={() => setValue('bcs', bcs === String(n) ? '' : String(n))}
                    className={cn('flex-1 h-11 rounded-xl text-sm font-black border transition-all',
                      bcs === String(n) ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/[0.03] border-white/[0.06] text-[#4B6478]'
                    )}
                  >{n}</button>
                ))}
              </div>
              {bcs && <p className="text-[10px] text-[#4B6478] mt-1 ml-1">{BCS_LABEL[parseInt(bcs)]}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
                  Famacha <span className="text-[#4B6478]/50">(opsional)</span>
                </label>
              </div>
              <div className="mb-2 rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
                <img src="/famacha_guide_v2.png" alt="Famacha guide" className="w-full object-cover" />
              </div>
              <div className="flex gap-2">
                {FAMACHA_OPTIONS.map(n => (
                  <button key={n} type="button"
                    onClick={() => setValue('famacha_score', famacha === String(n) ? '' : String(n))}
                    className={cn('flex-1 h-11 rounded-xl text-sm font-black border transition-all',
                      famacha === String(n) ? `bg-white/10 border-white/20 ${FAMACHA_COLOR[n]}` : 'bg-white/[0.03] border-white/[0.06] text-[#4B6478]'
                    )}
                  >{n}</button>
                ))}
              </div>
              {famacha && (
                <p className={`text-[10px] mt-1 ml-1 font-bold ${FAMACHA_COLOR[parseInt(famacha)]}`}>
                  Skor {famacha} — {parseInt(famacha) <= 2 ? 'Normal' : parseInt(famacha) === 3 ? 'Perhatian' : 'Perlu Tindakan'}
                </p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] mb-1.5 block">Catatan</label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Kondisi ternak, observasi, dll..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 text-white text-sm placeholder:text-[#4B6478]/50 focus:outline-none focus:border-green-500/50 resize-none transition-all"
              />
            </div>

            <button
              type="submit" disabled={isPending}
              className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl font-black text-white text-sm uppercase tracking-widest shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Timbangan'}
            </button>
          </form>
        </div>
      </motion.div>
    </>
  )
}
