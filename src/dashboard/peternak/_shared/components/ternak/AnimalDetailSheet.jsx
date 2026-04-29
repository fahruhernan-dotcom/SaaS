import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Edit2, Activity } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { calcHariDiFarm, calcADGFromRecords } from '@/lib/hooks/useKdPenggemukanData'
import { STATUS_CONFIG } from './constants'
import { BreedCombobox } from './BreedCombobox'

// Props:
//   animal           — animal object (with _weightRecords pre-normalized)
//   onUpdate         — mutate fn: (payload, { onSuccess }) => void
//   isPending        — boolean
//   breedSuggestions — string[]
//   onClose          — fn
export function AnimalDetailSheet({ animal, onUpdate, isPending, breedSuggestions = [], onClose }) {
  const [isEditing, setIsEditing] = useState(false)

  const weightRecords = animal._weightRecords ?? []
  const hari    = calcHariDiFarm(animal.entry_date, animal.exit_date)
  const adg     = calcADGFromRecords(weightRecords, animal.entry_date, animal.entry_weight_kg)
  const latestW = animal.latest_weight_kg ?? animal.entry_weight_kg
  const gain    = (latestW - animal.entry_weight_kg).toFixed(1)
  const ST      = STATUS_CONFIG[animal.status] ?? STATUS_CONFIG.active

  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      ear_tag:            animal.ear_tag,
      breed:              animal.breed || '',
      sex:                animal.sex,
      entry_weight_kg:    animal.entry_weight_kg,
      entry_age_months:   animal.entry_age_months || '',
      age_confidence:     animal.age_confidence || 'estimasi',
      acquisition_type:   animal.acquisition_type || 'beli',
      entry_bcs:          animal.entry_bcs || '',
      entry_condition:    animal.entry_condition || 'sehat',
      source:             animal.source || '',
      notes:              animal.notes || '',
      purchase_price_idr: animal.purchase_price_idr || '',
    }
  })

  const onSave = (data) => {
    onUpdate({
      animalId: animal.id,
      batchId:  animal.batch_id,
      updates: {
        ear_tag:            data.ear_tag.trim(),
        breed:              data.breed?.trim() || null,
        sex:                data.sex,
        entry_weight_kg:    Number(data.entry_weight_kg) || 0,
        entry_age_months:   data.entry_age_months || null,
        entry_bcs:          data.entry_bcs || null,
        entry_condition:    data.entry_condition,
        source:             data.source?.trim() || null,
        notes:              data.notes?.trim() || null,
        purchase_price_idr: Number(data.purchase_price_idr) || 0,
      }
    }, { onSuccess: () => setIsEditing(false) })
  }

  const inputCls = 'w-full h-10 px-3 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50'

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-y-0 right-0 w-[420px] max-w-full z-[4000] bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <div className="px-6 pt-8 pb-4 border-b border-white/5 relative shrink-0">
        <div className="absolute -top-10 right-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-['Sora'] font-extrabold text-[22px] text-white tracking-tight leading-none">{animal.ear_tag}</h2>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ST.color}`}>{ST.label}</span>
            </div>
            <p className="text-[11px] text-[#4B6478] font-bold uppercase">{animal.breed || 'Breed tidak diketahui'} · {animal.sex === 'betina' ? 'Betina' : 'Jantan'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(e => !e)}
              className={cn('w-8 h-8 rounded-full border flex items-center justify-center transition-colors', isEditing ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/10')}
            >
              <Edit2 size={14} />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 pb-28 space-y-5 custom-scrollbar">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Hari di Farm',  value: `${hari} hari` },
            { label: 'ADG/hr',        value: adg ? `${adg}g` : '—' },
            { label: 'Pertambahan',   value: `${gain} kg` },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 text-center">
              <p className="font-['Sora'] font-black text-sm text-white">{kpi.value}</p>
              <p className="text-[9px] font-bold text-[#4B6478] uppercase mt-0.5 tracking-tight">{kpi.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-3 flex items-center gap-1.5 font-['Sora']"><Activity size={12} /> Progress Berat</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold text-[#4B6478] mb-0.5">Masuk</p>
              <p className="text-lg font-black text-white font-['Sora']">{animal.entry_weight_kg} <span className="text-[10px] text-[#4B6478]">kg</span></p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#4B6478] mb-0.5">Terakhir</p>
              <p className={cn('text-lg font-black font-["Sora"]', parseFloat(gain) > 0 ? 'text-green-400' : 'text-white')}>
                {latestW} <span className="text-[10px] text-[#4B6478]">kg</span>
              </p>
            </div>
          </div>
        </div>

        {!isEditing ? (
          <div className="space-y-1">
            {[
              { label: 'Tanggal Masuk',  value: animal.entry_date ? new Date(animal.entry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              { label: 'Usia Masuk',     value: animal.entry_age_months ? `${animal.entry_age_months} bulan` : '—' },
              { label: 'Akurasi Usia',   value: animal.age_confidence || '—' },
              { label: 'Cara Perolehan', value: animal.acquisition_type === 'beli' ? 'Beli / Pasar' : animal.acquisition_type === 'lahir_sendiri' ? 'Lahir sendiri' : 'Hibah' },
              { label: 'Asal / Sumber',  value: animal.source || '—' },
              { label: 'Harga Beli',     value: animal.purchase_price_idr ? `Rp ${Number(animal.purchase_price_idr).toLocaleString('id-ID')}` : '—' },
              { label: 'BCS Masuk',      value: animal.entry_bcs ? `${animal.entry_bcs} / 5` : '—' },
              { label: 'Kondisi Awal',   value: animal.entry_condition || '—' },
              { label: 'Catatan',        value: animal.notes || '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-white/[0.03]">
                <span className="text-[11px] font-bold text-[#4B6478] uppercase tracking-tight">{row.label}</span>
                <span className="text-[11px] font-black text-white text-right max-w-[55%] truncate">{row.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <form id="edit-animal-form" onSubmit={handleSubmit(onSave)} className="space-y-4">
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded inline-block">Mode Edit</p>
            {[
              { label: 'Ear Tag',           name: 'ear_tag',          placeholder: 'e.g. DM-2026-0001' },
              { label: 'Usia Masuk (bln)',   name: 'entry_age_months', placeholder: 'e.g. 12', type: 'number' },
              { label: 'Berat Masuk (kg)',   name: 'entry_weight_kg',  placeholder: 'e.g. 25', type: 'number', step: '0.1' },
              { label: 'BCS Masuk',          name: 'entry_bcs',        placeholder: 'e.g. 3.0', type: 'number', step: '0.1' },
              { label: 'Sumber',             name: 'source',           placeholder: 'e.g. Pasar Wonosari' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5 ml-1">{f.label}</label>
                <input {...register(f.name)} type={f.type || 'text'} step={f.step} placeholder={f.placeholder} className={inputCls} />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5 ml-1">Akurasi Usia</label>
                <Controller control={control} name="age_confidence" render={({ field }) => (
                  <select {...field} className={inputCls}>
                    <option value="pasti">Pasti (Gigian)</option>
                    <option value="estimasi">Estimasi</option>
                    <option value="tidak_tahu">Tidak Tahu</option>
                  </select>
                )} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5 ml-1">Perolehan</label>
                <Controller control={control} name="acquisition_type" render={({ field }) => (
                  <select {...field} className={inputCls}>
                    <option value="beli">Beli / Pasar</option>
                    <option value="lahir_sendiri">Lahir Sendiri</option>
                    <option value="hibah">Hibah</option>
                  </select>
                )} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5 ml-1">Kelamin</label>
                <Controller control={control} name="sex" render={({ field }) => (
                  <select {...field} className={inputCls}>
                    <option value="jantan">Jantan</option>
                    <option value="betina">Betina</option>
                  </select>
                )} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5 ml-1">Kondisi</label>
                <Controller control={control} name="entry_condition" render={({ field }) => (
                  <select {...field} className={inputCls}>
                    <option value="sehat">Sehat</option>
                    <option value="kurus">Kurus</option>
                    <option value="cacat">Cacat</option>
                    <option value="sakit">Sakit</option>
                  </select>
                )} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5 ml-1">Breed</label>
              <Controller control={control} name="breed" render={({ field }) => (
                <BreedCombobox value={field.value} onChange={field.onChange} suggestions={breedSuggestions} />
              )} />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5 ml-1">Catatan</label>
              <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-green-500/50 resize-none font-medium" />
            </div>
          </form>
        )}
      </div>

      {isEditing && (
        <div className="px-6 py-4 border-t border-white/5 flex gap-2 shrink-0 bg-[#0C1319]">
          <button type="button" onClick={() => setIsEditing(false)} className="flex-1 h-11 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors">
            Batal
          </button>
          <button form="edit-animal-form" type="submit" disabled={isPending} className="flex-1 h-11 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors">
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      )}
    </motion.div>
  )
}
