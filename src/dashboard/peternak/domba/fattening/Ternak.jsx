import React, { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, X, Tag, Scale, AlertCircle, ChevronsUpDown, 
  Check, Trash2, ListPlus, Edit2, Activity, ArrowLeft, 
  LayoutGrid, ChevronDown, RefreshCw, Filter, Warehouse, AlignLeft, Hash,
  Calendar, ChevronRight, ShoppingBag, Users, Phone, CreditCard,
  FileText, Package, ArrowRight, Clock, Target
} from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useDombaAnimals,
  useDombaBatches,
  useAddDombaAnimal,
  useUpdateDombaAnimal,
  useBulkAddDombaAnimals,
  useAddDombaSale,
} from '@/lib/hooks/useDombaPenggemukanData'
import {
  calcHariDiFarm,
  calcADGFromRecords,
  calcADG,
} from '@/lib/hooks/useKdPenggemukanData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'

const BASE = '/peternak/peternak_domba_penggemukan'

const BUYER_TYPES = ['Pedagang', 'RPH', 'Konsumer Langsung', 'Eksportir', 'Lainnya']
const PRICE_TYPES = [
  { value: 'per_ekor', label: 'Per Ekor' },
  { value: 'per_kg', label: 'Per Kg LW' },
]

// ─── SALE SHEET (Inline in Ternak page) ───────────────────────────────────────
function SaleSheetInline({ batchId, animals, onClose }) {
  const [step, setStep] = useState(1)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const { mutate: addSale, isPending } = useAddDombaSale()
  const activeAnimals = useMemo(() => animals.filter(a => a.status === 'active'), [animals])
  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: {
      sale_date: new Date().toISOString().split('T')[0],
      buyer_type: 'Pedagang',
      price_type: 'per_ekor',
      payment_method: 'Cash',
      is_paid: true,
      has_skkh: false,
      has_surat_jalan: false,
    }
  })
  const priceType = watch('price_type')
  const priceAmount = watch('price_amount') || 0
  const selectedAnimalsData = useMemo(() => activeAnimals.filter(a => selectedIds.has(a.id)), [activeAnimals, selectedIds])
  const totalWeightKg = useMemo(() => selectedAnimalsData.reduce((s, a) => s + (parseFloat(a.latest_weight_kg ?? a.entry_weight_kg) || 0), 0), [selectedAnimalsData])
  const totalRevenue = useMemo(() => {
    const p = parseFloat(priceAmount) || 0
    if (priceType === 'per_ekor') return p * selectedIds.size
    if (priceType === 'per_kg') return p * totalWeightKg
    return 0
  }, [priceType, priceAmount, selectedIds.size, totalWeightKg])

  const toggleAnimal = (id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const onSubmit = (data) => {
    if (!selectedIds.size) return
    const ids = Array.from(selectedIds)
    addSale({
      batch_id: batchId,
      sale_date: data.sale_date,
      buyer_name: data.buyer_name,
      buyer_type: data.buyer_type,
      buyer_contact: data.buyer_contact,
      animal_ids: ids,
      animal_count: ids.length,
      total_weight_kg: totalWeightKg,
      avg_weight_kg: totalWeightKg / ids.length,
      price_type: data.price_type,
      price_amount: parseFloat(data.price_amount) || 0,
      total_revenue_idr: totalRevenue,
      payment_method: data.payment_method,
      is_paid: data.is_paid,
      has_skkh: data.has_skkh,
      has_surat_jalan: data.has_surat_jalan,
      notes: data.notes,
    }, { onSuccess: onClose })
  }

  const iCls = "w-full h-11 px-4 bg-[#111C24] border border-white/5 focus:border-emerald-500/40 rounded-xl text-[13px] font-bold text-white placeholder:text-[#4B6478] focus:outline-none transition-all"
  const lCls = "block text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/80 mb-2 ml-1"

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-y-0 right-0 w-[440px] max-w-full z-50 bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {step === 2 && <button onClick={() => setStep(1)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[#4B6478] hover:text-white transition"><ArrowLeft size={14} /></button>}
            <h2 className="font-['Sora'] font-extrabold text-xl text-white tracking-tight">{step === 1 ? 'Pilih Domba' : 'Data Transaksi'}</h2>
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

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="s1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="p-4 space-y-2">
              {activeAnimals.length === 0 ? (
                <div className="py-20 text-center"><Package size={40} className="mx-auto text-white/5 mb-4" /><p className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Tidak ada domba aktif</p></div>
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
              <form id="sale-inline-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <button form="sale-inline-form" type="submit" disabled={isPending} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.25)]">
              {isPending ? 'Menyimpan...' : 'Konfirmasi Jual'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const BREED_SUGGESTIONS = [
  'Garut', 'Priangan', 'Gembong', 'Texel', 'Dorper', 'Merino',
  'Ekor Gemuk (DEG)', 'Ekor Tipis (DET)', 'Sumbawa', 'Donggala',
  'Barros', 'Compass Agribisnis', 'Lainnya',
]


const STATUS_CONFIG = {
  active:  { label: 'Aktif',    color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  sold:    { label: 'Terjual',  color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'  },
  dead:    { label: 'Mati',     color: 'text-red-400 bg-red-500/10 border-red-500/20'   },
  culled:  { label: 'Afkir',    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
}

const WEIGH_METHOD_LABEL = {
  timbang_langsung:   { label: 'Timbang',  color: 'text-green-400' },
  estimasi_pita_ukur: { label: 'Pita Ukur',color: 'text-amber-400' },
  estimasi_visual:    { label: 'Estimasi', color: 'text-slate-400'  },
}

function AnimalCard({ animal, onClick }) {
  const hari   = calcHariDiFarm(animal.entry_date, animal.exit_date)
  const weightRecords = animal.weight_records || animal.domba_penggemukan_weight_records || []
  const adg = calcADGFromRecords(
    weightRecords,
    animal.entry_date,
    animal.entry_weight_kg
  ) || (animal.latest_weight_kg > animal.entry_weight_kg && hari > 0 ? calcADG(animal.entry_weight_kg, animal.latest_weight_kg, hari) : 0)

  const latestW = animal.latest_weight_kg ?? animal.entry_weight_kg
  const gain    = (latestW - animal.entry_weight_kg).toFixed(1)
  const st      = STATUS_CONFIG[animal.status] ?? STATUS_CONFIG.active

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 cursor-pointer active:bg-white/[0.05] transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-['Sora'] font-bold text-sm text-white">{animal.ear_tag}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${st.color}`}>
              {st.label}
            </span>
          </div>
          <p className="text-[11px] text-[#4B6478] font-bold uppercase tracking-tight">
            {animal.breed || 'Breed tidak diketahui'} · {animal.sex === 'betina' ? 'BETINA' : 'JANTAN'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-white font-['Sora'] leading-tight">
            {latestW} <span className="text-[10px] text-[#4B6478]">kg</span>
          </p>
          <p className={`text-[10px] font-bold ${parseFloat(gain) > 0 ? 'text-green-400' : 'text-[#4B6478]'}`}>
            {parseFloat(gain) > 0 ? `+${gain} kg` : gain === '0.0' ? 'Netral' : `${gain} kg`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-white/[0.04]">
        <div>
          <p className="text-[11px] font-black text-white">{hari}</p>
          <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-wider">Hari</p>
        </div>
        <div className="border-x border-white/[0.06]">
          <p className={`text-[11px] font-black ${adg >= 150 ? 'text-green-400' : adg > 0 ? 'text-amber-400' : 'text-[#4B6478]'}`}>
            {adg !== null && adg !== undefined && adg !== 0 ? (adg >= 1000 ? `${(adg/1000).toFixed(2)}kg` : `${adg.toFixed(0)}g`) : '—'}
          </p>
          <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-wider">ADG/hr</p>
        </div>
        <div>
          <p className="text-[11px] font-black text-white">
            {animal.entry_age_months || animal.age_estimate || '—'} { (animal.entry_age_months || animal.age_estimate) ? 'bln' : ''}
          </p>
          <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-wider">Usia</p>
        </div>
      </div>

      {animal.latest_weight_date && animal.domba_penggemukan_weight_records?.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-white/[0.04] flex justify-between items-center">
          <span className="text-[10px] text-[#4B6478] font-medium">
            Timbang: {new Date(animal.latest_weight_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </span>
          {(() => {
            const lastRecord = animal.domba_penggemukan_weight_records?.sort(
              (a, b) => new Date(b.weigh_date) - new Date(a.weigh_date)
            )[0]
            const methodCfg = lastRecord ? WEIGH_METHOD_LABEL[lastRecord.weigh_method] : null
            return methodCfg ? (
              <span className={`text-[9px] font-black uppercase tracking-widest ${methodCfg.color}`}>
                {methodCfg.label}
              </span>
            ) : null
          })()}
        </div>
      )}
    </motion.div>
  )
}

function AddAnimalSheet({ batchId, animals = [], onClose }) {
  const { tenant } = useAuth()
  const [openBreed, setOpenBreed] = useState(false)
  
  const generateEarTag = () => {
    const name = tenant?.business_name || 'Domba'
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
    const seq = String(animals.length + 1).padStart(4, '0')
    return `${initials}-${new Date().getFullYear()}-${seq}`
  }

  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm({
    defaultValues: { 
      ear_tag: generateEarTag(),
      sex: 'jantan', 
      entry_date: new Date().toISOString().split('T')[0],
      acquisition_type: 'beli',
      age_confidence: 'estimasi',
      price_per_kg: 0,
      purchase_price_idr: 0
    }
  })
  const { mutate: addAnimal, isPending } = useAddDombaAnimal()
  const acquisitionType = watch('acquisition_type')

  const onSubmit = (data) => {
    addAnimal(
      {
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
        purchase_price_idr: acquisitionType === 'beli' && data.purchase_price_idr
          ? parseInt(data.purchase_price_idr)
          : 0,
        source:             data.source?.trim() || null,
        kandang_slot:       data.kandang_slot?.trim() || null,
        notes:              data.notes?.trim() || null,
      },
      { onSuccess: onClose }
    )
  }

  const entryWeight    = watch('entry_weight_kg')
  const purchasePrice  = watch('purchase_price_idr')
  const pricePerKg    = watch('price_per_kg')

  // Reflexive Logic: Weight * Price/Kg = Total
  useEffect(() => {
    const w = parseFloat(entryWeight)
    const p = parseFloat(pricePerKg)
    if (!isNaN(w) && !isNaN(p) && w > 0 && p > 0) {
      const total = Math.round(w * p)
      if (Math.abs(total - purchasePrice) > 1) {
        setValue('purchase_price_idr', total)
      }
    }
  }, [entryWeight, pricePerKg, setValue, purchasePrice])

  // Reflexive Logic: Total / Weight = Price/Kg
  useEffect(() => {
    const w = parseFloat(entryWeight)
    const t = parseFloat(purchasePrice)
    if (!isNaN(w) && !isNaN(t) && w > 0 && t > 0) {
      const perKg = Math.round(t / w)
      if (Math.abs(perKg - pricePerKg) > 1) {
        setValue('price_per_kg', perKg)
      }
    }
  }, [purchasePrice, entryWeight, setValue, pricePerKg])

  const labelStyle = "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-green-500/80 mb-2 ml-1"
  const inputContainerStyle = "relative transition-all duration-300 group/input"
  const inputClass = "w-full h-11 bg-[#111C24] border border-white/5 focus:border-green-500/40 rounded-xl text-[14px] font-bold text-white placeholder:text-[#4B6478] focus:bg-[#15232d] focus:outline-none transition-all shadow-inner"

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-y-0 right-0 w-[420px] max-w-full z-50 bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-white/5 relative">
        <div className="absolute -top-10 right-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="font-['Sora'] font-extrabold text-[22px] text-white tracking-tight leading-none mb-1">Tambah Domba</h2>
          <p className="text-[11px] text-[#4B6478] font-medium">Tambah record ternak baru</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors relative z-10">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar relative">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className={inputContainerStyle}>
            <label className={labelStyle}>
              <Tag size={12} className="text-green-500" />
              Ear Tag / ID <span className="text-green-500/50">*</span>
            </label>
            <div className="relative">
              <input
                {...register('ear_tag', { required: true })}
                placeholder="e.g. DM-2026-0001"
                className={`pl-11 pr-4 ${inputClass}`}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-green-500/40 group-focus-within/input:text-green-500 transition-colors text-lg">#</div>
            </div>
            {errors.ear_tag && <p className="text-red-400 text-[10px] mt-1.5 ml-1 font-medium">ID wajib diisi</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Warehouse size={12} className="text-green-500" />
                Breed
              </label>
              <Controller
                control={control}
                name="breed"
                render={({ field }) => (
                  <Popover open={openBreed} onOpenChange={setOpenBreed}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full px-4 h-11 bg-[#111C24] border border-white/5 rounded-xl text-sm justify-between hover:bg-white/5 transition-all text-left font-normal",
                          !field.value ? "text-[#4B6478]" : "text-white"
                        )}
                      >
                        <span className="truncate">{field.value ? field.value : "Garut, Texel..."}</span>
                        <ChevronsUpDown size={14} className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 bg-[#111C24] border-white/10 shadow-2xl z-[9999]">
                      <Command className="bg-transparent">
                        <CommandInput placeholder="Cari breed..." className="h-11 border-none focus:ring-0 text-white" />
                        <CommandList className="max-h-[300px] scrollbar-thin">
                          <CommandEmpty className="py-4 text-center text-xs opacity-50 font-bold uppercase">Tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {BREED_SUGGESTIONS.map(b => (
                              <CommandItem
                                key={b}
                                value={b}
                                onSelect={() => {
                                  field.onChange(b)
                                  setOpenBreed(false)
                                }}
                                className="flex items-center justify-between py-2.5 px-3 cursor-pointer hover:bg-green-500/10 rounded-lg text-xs font-bold uppercase tracking-widest"
                              >
                                <span className={cn(field.value === b ? "text-green-400" : "text-white")}>{b}</span>
                                {field.value === b && <Check size={14} className="text-green-400" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>

            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Activity size={12} className="text-green-500" />
                Kelamin <span className="text-green-500/50">*</span>
              </label>
              <Controller
                control={control}
                name="sex"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full px-4 h-11 bg-[#111C24] border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-green-500/50 outline-none transition-all shadow-inner">
                      <SelectValue placeholder="Pilih Kelamin" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111C24] border border-white/10 rounded-xl shadow-xl z-[9999]">
                      <SelectItem value="jantan" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Jantan</SelectItem>
                      <SelectItem value="betina" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Betina</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Hash size={12} className="text-green-500" />
                Usia Masuk (bln)
              </label>
              <input
                {...register('entry_age_months')}
                type="number"
                placeholder="e.g. 12"
                className={`px-4 text-center ${inputClass}`}
              />
            </div>
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Scale size={12} className="text-green-500" />
                Akurasi Usia
              </label>
              <Controller
                control={control}
                name="age_confidence"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full h-11 bg-[#111C24] border-white/5 rounded-xl text-[12px] text-white outline-none appearance-none focus:border-green-500/40 transition-all shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111C24] border border-white/10 rounded-xl z-[9999]">
                      <SelectItem value="pasti">Pasti (Gigian)</SelectItem>
                      <SelectItem value="estimasi">Estimasi</SelectItem>
                      <SelectItem value="tidak_tahu">Tidak Tahu</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Warehouse size={12} className="text-green-500" />
                Asal Ternak
              </label>
              <Controller
                control={control}
                name="acquisition_type"
                render={({ field }) => (
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
                )}
              />
            </div>
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <AlertCircle size={12} className="text-green-500" />
                Kondisi Masuk
              </label>
              <Controller
                control={control}
                name="entry_condition"
                render={({ field }) => (
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
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Clock size={12} className="text-green-500" />
                Usia Masuk (bln)
              </label>
              <input
                {...register('entry_age_months')}
                type="number"
                placeholder="e.g. 6"
                className={`px-4 text-center ${inputClass}`}
              />
            </div>
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Target size={12} className="text-green-500" />
                Akurasi Usia
              </label>
              <Controller
                control={control}
                name="age_confidence"
                render={({ field }) => (
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
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Calendar size={12} className="text-green-500" />
                Tanggal Masuk <span className="text-green-500/50">*</span>
              </label>
              <Controller
                control={control}
                name="entry_date"
                rules={{ required: true }}
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} className="h-11 bg-[#111C24] border-white/5 shadow-inner" />
                )}
              />
            </div>
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Scale size={12} className="text-green-500" />
                Berat Masuk (kg) <span className="text-green-500/50">*</span>
              </label>
              <input
                {...register('entry_weight_kg', { required: true })}
                type="number"
                step="0.1"
                placeholder="e.g. 25"
                className={`px-4 text-center ${inputClass}`}
              />
            </div>
          </div>

          {acquisitionType === 'beli' && (
            <div className="grid grid-cols-2 gap-3">
              <div className={inputContainerStyle}>
                <label className={labelStyle}>
                  <Scale size={12} className="text-green-500" />
                  Harga Per Kg (Rp)
                </label>
                <InputRupiah
                  value={watch('price_per_kg')}
                  onChange={(val) => {
                    setValue('price_per_kg', val)
                    const w = parseFloat(watch('entry_weight_kg'))
                    if (!isNaN(w) && w > 0) setValue('purchase_price_idr', Math.round(w * val))
                  }}
                  placeholder="0"
                  className="h-11 bg-[#111C24] border-white/5 shadow-inner rounded-xl"
                />
              </div>
              <div className={inputContainerStyle}>
                <label className={labelStyle}>
                  <Tag size={12} className="text-green-500" />
                  Total Harga Beli (Rp)
                </label>
                <InputRupiah
                  value={watch('purchase_price_idr')}
                  onChange={(val) => {
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
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Activity size={12} className="text-green-500" />
                BCS (1-5)
              </label>
              <input
                {...register('entry_bcs')}
                type="number"
                step="0.5"
                placeholder="e.g. 2.5"
                className={`px-4 text-center ${inputClass}`}
              />
            </div>
            <div className={inputContainerStyle}>
              <label className={labelStyle}>
                <Warehouse size={12} className="text-green-500" />
                Sumber / Pasar
              </label>
              <input
                {...register('source')}
                placeholder="e.g. Pasar Wonosari"
                className={`px-4 ${inputClass}`}
              />
            </div>
          </div>

          <div className={inputContainerStyle}>
            <label className={labelStyle}>
              <AlignLeft size={12} className="text-green-500" />
              Catatan
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Catatan tambahan..."
              className="w-full px-4 py-3 bg-[#111C24] border border-white/5 rounded-xl text-sm font-medium text-white placeholder:text-[#4B6478] focus:bg-[#15232d] shadow-inner focus:outline-none transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-[52px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white font-['Sora'] font-extrabold text-[15px] rounded-xl transition-all shadow-[0_4px_20px_rgba(22,163,74,0.25)] flex items-center justify-center gap-2 mt-2"
          >
            {isPending ? 'Menyimpan...' : 'Tambah Domba Ke Batch'}
            {!isPending && <ChevronRight size={18} strokeWidth={3} className="opacity-80" />}
          </button>
        </form>
      </div>
    </motion.div>
  )
}

function AnimalDetailSheet({ animal, onClose }) {
  const [isEditing, setIsEditing] = useState(false)
  const [openBreedDetail, setOpenBreedDetail] = useState(false)
  const { mutate: updateAnimal, isPending } = useUpdateDombaAnimal()

  const hari   = calcHariDiFarm(animal.entry_date, animal.exit_date)
  const adg    = calcADGFromRecords(animal.domba_penggemukan_weight_records ?? [], animal.entry_date, animal.entry_weight_kg)
  const latestW = animal.latest_weight_kg ?? animal.entry_weight_kg
  const gain    = (latestW - animal.entry_weight_kg).toFixed(1)
  
  const ST = STATUS_CONFIG[animal.status] ?? STATUS_CONFIG.active

  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      ear_tag: animal.ear_tag,
      breed: animal.breed || '',
      sex: animal.sex,
      entry_weight_kg: animal.entry_weight_kg,
      entry_age_months: animal.entry_age_months || '',
      age_confidence: animal.age_confidence || 'estimasi',
      acquisition_type: animal.acquisition_type || 'beli',
      entry_bcs: animal.entry_bcs || '',
      entry_condition: animal.entry_condition || 'sehat',
      source: animal.source || '',
      notes: animal.notes || '',
      purchase_price_idr: animal.purchase_price_idr || '',
    }
  })

  const onSave = (data) => {
    updateAnimal({
      animalId: animal.id,
      batchId: animal.batch_id,
      updates: {
        ear_tag: data.ear_tag.trim(),
        breed: data.breed?.trim() || null,
        sex: data.sex,
        entry_weight_kg: Number(data.entry_weight_kg) || 0,
        entry_age_months: data.entry_age_months || null,
        entry_bcs: data.entry_bcs || null,
        entry_condition: data.entry_condition,
        source: data.source?.trim() || null,
        notes: data.notes?.trim() || null,
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
      className="fixed inset-y-0 right-0 w-[420px] max-w-full z-50 bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <div className="px-6 pt-8 pb-4 border-b border-white/5 relative shrink-0">
        <div className="absolute -top-10 right-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-['Sora'] font-extrabold text-[22px] text-white tracking-tight leading-none">{animal.ear_tag}</h2>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ST.color}`}>
                {ST.label}
              </span>
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

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Hari di Farm', value: `${hari} hari` },
            { label: 'ADG/hr', value: adg ? `${adg}g` : '—' },
            { label: 'Pertambahan', value: `${gain} kg` },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 text-center">
              <p className="font-['Sora'] font-black text-sm text-white">{kpi.value}</p>
              <p className="text-[9px] font-bold text-[#4B6478] uppercase mt-0.5 tracking-tight">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Berat */}
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
              { label: 'Tanggal Masuk', value: animal.entry_date ? new Date(animal.entry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              { label: 'Usia Masuk', value: animal.entry_age_months ? `${animal.entry_age_months} bulan` : '—' },
              { label: 'Akurasi Usia', value: animal.age_confidence || '—' },
              { label: 'Cara Perolehan', value: animal.acquisition_type === 'beli' ? 'Beli / Pasar' : animal.acquisition_type === 'lahir_sendiri' ? 'Lahir sendiri' : 'Hibah' },
              { label: 'Asal / Sumber', value: animal.source || '—' },
              { label: 'Harga Beli', value: animal.purchase_price_idr ? `Rp ${Number(animal.purchase_price_idr).toLocaleString('id-ID')}` : '—' },
              { label: 'BCS Masuk', value: animal.entry_bcs ? `${animal.entry_bcs} / 5` : '—' },
              { label: 'Kondisi Awal', value: animal.entry_condition || '—' },
              { label: 'Catatan', value: animal.notes || '—' },
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
              { label: 'Ear Tag', name: 'ear_tag', placeholder: 'e.g. DM-2026-0001' },
              { label: 'Usia Masuk (bln)', name: 'entry_age_months', placeholder: 'e.g. 12', type: 'number' },
              { label: 'Berat Masuk (kg)', name: 'entry_weight_kg', placeholder: 'e.g. 25', type: 'number', step: '0.1' },
              { label: 'BCS Masuk', name: 'entry_bcs', placeholder: 'e.g. 3.0', type: 'number', step: '0.1' },
              { label: 'Sumber', name: 'source', placeholder: 'e.g. Pasar Wonosari' },
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
              <Controller control={control} name="breed"
                render={({ field: fld }) => (
                  <Popover open={openBreedDetail} onOpenChange={setOpenBreedDetail}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox"
                        className={cn('w-full h-10 px-3 bg-[#111C24] border border-white/10 rounded-xl text-sm justify-between hover:bg-white/5 font-normal', !fld.value ? 'text-[#4B6478]' : 'text-white')}
                      >
                        <span className="truncate">{fld.value || 'Pilih breed...'}</span>
                        <ChevronsUpDown size={13} className="opacity-40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-[#111C24] border-white/10 shadow-2xl z-[5000]">
                      <Command className="bg-transparent">
                        <CommandInput placeholder="Cari breed..." className="h-10 text-white border-none focus:ring-0" />
                        <CommandList className="max-h-[240px]">
                          <CommandEmpty className="py-4 text-center text-xs opacity-50 font-bold">Breed tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {BREED_SUGGESTIONS.map(b => (
                              <CommandItem key={b} value={b} onSelect={() => { fld.onChange(b); setOpenBreedDetail(false) }}
                                className="flex items-center justify-between py-2.5 px-3 cursor-pointer hover:bg-green-500/10 rounded-lg text-xs font-bold uppercase tracking-widest"
                              >
                                <span className={cn(fld.value === b ? 'text-green-400' : 'text-white')}>{b}</span>
                                {fld.value === b && <Check size={13} className="text-green-400" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
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

function BreedComboboxInTable({ value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full h-8 px-2 bg-[#111C24] border-white/5 rounded-lg text-[11px] justify-between text-left", !value ? "text-[#4B6478]" : "text-white")}>
          <span className="truncate">{value || '-- Breed --'}</span>
          <ChevronDown size={11} className="opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-[#111C24] border-white/10 shadow-2xl z-[9999]">
        <Command className="bg-transparent">
          <CommandInput placeholder="Cari..." className="h-8 text-[11px]" />
          <CommandList>
            <CommandEmpty className="py-2 text-[10px] text-center opacity-50 uppercase font-black">Kosong</CommandEmpty>
            <CommandGroup>
              {BREED_SUGGESTIONS.map(b => (
                <CommandItem key={b} value={b} onSelect={() => { onChange(b); setOpen(false) }} className="py-2 px-3 text-[11px] font-bold uppercase tracking-widest">
                  {b}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function BulkAddSheet({ batchId, animalsCount, onClose }) {
  const { tenant } = useAuth()
  const getEarTag = (idx) => {
    const pfx = (tenant?.business_name || 'DOM').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
    const seq = String(animalsCount + idx + 1).padStart(4, '0')
    return `${pfx}-${new Date().getFullYear()}-${seq}`
  }

  const [globalPrice, setGlobalPrice] = useState(0)

  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      rows: [
        { ear_tag: getEarTag(0), sex: 'jantan', entry_date: new Date().toISOString().split('T')[0], entry_weight_kg: '', breed: '', price_per_kg: globalPrice, purchase_price_idr: 0 },
        { ear_tag: getEarTag(1), sex: 'jantan', entry_date: new Date().toISOString().split('T')[0], entry_weight_kg: '', breed: '', price_per_kg: globalPrice, purchase_price_idr: 0 },
        { ear_tag: getEarTag(2), sex: 'jantan', entry_date: new Date().toISOString().split('T')[0], entry_weight_kg: '', breed: '', price_per_kg: globalPrice, purchase_price_idr: 0 },
      ]
    }
  })
  const { fields, append, remove } = useFieldArray({ control, name: "rows" })
  const { mutate: bulkAdd, isPending } = useBulkAddDombaAnimals()

  // Apply Global Price to all rows
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
    bulkAdd({ batch_id: batchId, animals: valid }, { onSuccess: onClose })
  }

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      className="fixed inset-0 z-[60] bg-[#0A1015] flex flex-col"
    >
      {/* Header section */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0C1319]">
        <div className="flex flex-col gap-1">
          <h3 className="text-[18px] font-black tracking-tight text-white font-['Sora']">Input Massal (Bulk)</h3>
          <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-[0.1em]">Masukkan banyak domba sekaligus untuk mempercepat proses</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-2 px-4 rounded-2xl shadow-xl">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-green-500/80">Set Harga per Kg All</span>
              <InputRupiah 
                value={globalPrice} 
                onChange={applyGlobalPrice}
                className="h-8 w-36 bg-[#0D151C] border-white/5 rounded-xl text-xs font-bold shadow-inner"
                placeholder="Rp 0"
              />
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-500/10 hover:text-red-400 transition-all hover:border-red-500/20"
          >
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
                    <input {...register(`rows.${i}.ear_tag`)} placeholder="ID Domba" className="bg-transparent text-white text-[13px] font-black outline-none border-b border-white/5 focus:border-green-500/50 w-full font-['Sora']" />
                  </td>
                  <td className="py-2.5 px-3">
                    <Controller control={control} name={`rows.${i}.breed`} render={({ field }) => (
                      <BreedComboboxInTable value={field.value} onChange={field.onChange} />
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
                      <Controller
                        control={control}
                        name={`rows.${i}.entry_weight_kg`}
                        render={({ field }) => (
                          <input 
                            {...field}
                            type="number" 
                            step="0.1" 
                            onChange={(e) => {
                              const val = e.target.value
                              field.onChange(val)
                              const pkg = parseFloat(watch(`rows.${i}.price_per_kg`))
                              const w = parseFloat(val)
                              if (!isNaN(w) && !isNaN(pkg) && w > 0 && pkg > 0) {
                                setValue(`rows.${i}.purchase_price_idr`, Math.round(w * pkg))
                              }
                            }}
                            className="bg-transparent text-white text-[13px] font-black outline-none border-b border-white/5 focus:border-green-500/50 w-full text-right pr-4 font-['Sora']" 
                            placeholder="0" 
                          />
                        )}
                      />
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#4B6478]">kg</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <Controller control={control} name={`rows.${i}.price_per_kg`} render={({ field }) => (
                      <InputRupiah 
                        value={field.value} 
                        onChange={v => {
                          field.onChange(v)
                          const w = parseFloat(watch(`rows.${i}.entry_weight_kg`))
                          if (!isNaN(w) && w > 0) setValue(`rows.${i}.purchase_price_idr`, Math.round(w * v))
                        }} 
                        className="h-8 text-[11px] font-bold bg-transparent border-0 border-b border-white/5 rounded-none px-0" 
                      />
                    )} />
                  </td>
                  <td className="py-2.5 px-3">
                    <Controller control={control} name={`rows.${i}.purchase_price_idr`} render={({ field }) => (
                      <InputRupiah 
                        value={field.value} 
                        onChange={v => {
                          field.onChange(v)
                          const w = parseFloat(watch(`rows.${i}.entry_weight_kg`))
                          if (!isNaN(w) && w > 0) setValue(`rows.${i}.price_per_kg`, Math.round(v / w))
                        }} 
                        className="h-8 text-[11px] font-bold bg-transparent border-0 border-b border-white/5 rounded-none px-0" 
                      />
                    )} />
                  </td>
                  <td className="py-2.5 px-3">
                    <input {...register(`rows.${i}.entry_age_months`)} type="number" placeholder="0" className="bg-transparent text-white text-[13px] font-bold outline-none border-b border-white/5 focus:border-green-500/50 w-full text-center" />
                  </td>
                  <td className="py-2.5 px-3">
                    <Controller control={control} name={`rows.${i}.entry_date`} render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} className="h-8 px-2 text-[10px] font-bold border-0 border-b border-white/5 bg-transparent rounded-none" />} />
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
              ear_tag: getEarTag(fields.length), 
              sex: 'jantan', 
              entry_date: new Date().toISOString().split('T')[0], 
              entry_weight_kg: '', 
              breed: '',
              entry_age_months: '',
              price_per_kg: globalPrice,
              purchase_price_idr: 0
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

export default function DombaTernak() {
  const [params] = useSearchParams()
  const defaultBatchId = params.get('batch') || ''
  const navigate = useNavigate()

  const { data: batches = [], isLoading: loadingBatches } = useDombaBatches()
  const [selectedBatchId, setSelectedBatchId] = useState(defaultBatchId)
  
  useEffect(() => {
    if (defaultBatchId) setSelectedBatchId(defaultBatchId)
  }, [defaultBatchId])

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('active')
  const [batchOpen, setBatchOpen]       = useState(false)
  const [batchRect, setBatchRect]       = useState(null)
  const batchTriggerRef = useRef(null)
  const batchWrapperRef = useRef(null)

  // Click-outside to close batch dropdown
  useEffect(() => {
    if (!batchOpen) return
    const handler = (e) => {
      if (!batchWrapperRef.current?.contains(e.target) && !batchTriggerRef.current?.contains(e.target))
        setBatchOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [batchOpen])

  const { data: animals = [], isLoading: loadingAnimals } = useDombaAnimals(selectedBatchId)
  const [sheet, setSheet] = useState(null) 

  const isSamplingMode = params.get('sampling') === 'true'
  const selectedBatch = useMemo(() => batches.find(b => b.id === selectedBatchId), [batches, selectedBatchId])

  const filtered = useMemo(() => {
    let list = animals
    
    // 1. Status & Search filter
    if (filter !== 'all') list = list.filter(a => a.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a => a.ear_tag.toLowerCase().includes(q) || (a.breed || '').toLowerCase().includes(q))
    }

    // 2. Intensive v2.0 Sampling Logic (Deterministic 10%)
    if (isSamplingMode && selectedBatch) {
      const hari = calcHariDiFarm(selectedBatch.start_date)
      const periodIndex = Math.floor(hari / 14)
      const sampleSize = Math.max(1, Math.ceil(animals.length * 0.1))
      
      const seed = selectedBatch.id + periodIndex
      const samplingList = [...animals].sort((a, b) => {
        const hashA = (a.id + seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const hashB = (b.id + seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return hashA - hashB
      }).slice(0, sampleSize)

      const sampleIds = new Set(samplingList.map(s => s.id))
      list = list.filter(a => sampleIds.has(a.id))
    }

    return list
  }, [animals, filter, search, isSamplingMode, selectedBatch])

  if (loadingBatches) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-['Sora'] font-black text-xl text-white tracking-tight">Data Ternak</h1>
            <p className="text-[11px] text-[#4B6478] font-black uppercase tracking-widest mt-0.5">
              {filter === 'all'
                ? `${animals.length} TOTAL UNIT`
                : `${filtered.length} ${filter === 'active' ? 'AKTIF' : filter === 'sold' ? 'TERJUAL' : filter === 'dead' ? 'MATI' : 'AFKIR'} · ${animals.length} TERDAFTAR`}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSheet('bulk')} 
              className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-[#4B6478] hover:text-white hover:bg-white/10 transition-all shadow-inner"
            >
              <ListPlus size={18} />
            </button>
            <button
              disabled={!selectedBatchId}
              onClick={() => setSheet('sale')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl text-white text-xs font-black font-['Sora'] shadow-[0_4px_12px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all"
            >
              <ShoppingBag size={14} strokeWidth={3} />
              Jual
            </button>
            <button
              disabled={!selectedBatchId}
              onClick={() => setSheet('add')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded-xl text-white text-xs font-black font-['Sora'] shadow-[0_4px_12px_rgba(22,163,74,0.3)] active:scale-[0.98] transition-all"
            >
              <Plus size={14} strokeWidth={3} />
              Tambah
            </button>
          </div>
        </div>

        {/* ── Custom Batch Dropdown ── */}
        <div ref={batchWrapperRef}>
          <button
            ref={batchTriggerRef}
            onClick={() => {
              const rect = batchTriggerRef.current?.getBoundingClientRect()
              setBatchRect(rect ?? null)
              setBatchOpen(o => !o)
            }}
            className={cn(
              'w-full h-12 px-4 flex items-center gap-3 bg-white/[0.03] border rounded-2xl text-sm font-bold text-white transition-all shadow-inner',
              batchOpen ? 'border-green-500/40 bg-white/[0.06]' : 'border-white/[0.08] hover:border-white/[0.14] hover:bg-white/[0.05]'
            )}
          >
            {selectedBatchId ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="flex-1 text-left">
                  {batches.find(b => b.id === selectedBatchId)?.batch_code ?? '—'}
                  <span className="text-[#4B6478] font-medium ml-2 text-xs">
                    {batches.find(b => b.id === selectedBatchId)?.kandang_name}
                  </span>
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-white/10 shrink-0" />
                <span className="flex-1 text-left text-[#4B6478]">-- Pilih Batch Penggemukan --</span>
              </>
            )}
            <motion.div animate={{ rotate: batchOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} className="text-[#4B6478] shrink-0" />
            </motion.div>
          </button>
        </div>
      </header>

      {!selectedBatchId ? (
        <div className="px-6 py-28 text-center">
           <div className="w-20 h-20 rounded-[32px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mx-auto mb-6 relative">
              <RefreshCw size={32} className="text-white/10 animate-spin-slow" />
              <Warehouse size={20} className="absolute inset-0 m-auto text-white/5" />
           </div>
           <p className="font-['Sora'] font-black text-white text-base">Pilih Batch Penggemukan</p>
           <p className="text-[12px] text-[#4B6478] mt-2 font-medium max-w-[240px] mx-auto leading-relaxed">Tentukan batch terlebih dahulu untuk mengelola data ternak di dalamnya.</p>
        </div>
      ) : (
        <div className="px-4 pt-5">
          {/* Controls */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 group/search">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B6478] group-focus-within/search:text-green-500 transition-colors" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Cari ear tag / ras domba..." 
                className="w-full h-11 pl-10 pr-4 bg-white/[0.03] border border-white/[0.06] focus:border-green-500/40 rounded-xl text-xs font-bold text-white placeholder-[#4B6478] outline-none transition-all shadow-inner" 
              />
            </div>
            <div className="w-11 h-11 flex items-center justify-center bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#4B6478]">
               <Filter size={16} />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-5 custom-scrollbar no-scrollbar">
             {['active','sold','dead','culled','all'].map(s => (
               <button 
                 key={s} 
                 onClick={() => setFilter(s)} 
                 className={cn(
                   'px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all whitespace-nowrap shadow-sm', 
                   filter === s ? 'bg-green-600/10 border-green-600/30 text-green-400' : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478] hover:border-white/10'
                 )}
               >
                  {s === 'active' ? 'Aktif' : s === 'sold' ? 'Terjual' : s === 'dead' ? 'Mati' : s === 'culled' ? 'Afkir' : 'Seluruhnya'}
               </button>
             ))}
          </div>

          {loadingAnimals ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 mt-1">
               {filtered.map(a => (
                 <AnimalCard key={a.id} animal={a} onClick={() => setSheet(a)} />
               ))}
               {filtered.length === 0 && (
                 <div className="text-center py-20 border-2 border-dashed border-white/[0.03] rounded-[32px] bg-white/[0.01]">
                    <Search size={32} className="mx-auto text-white/5 mb-3" />
                    <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Data Tidak Ditemukan</p>
                 </div>
               )}
            </div>
          )}
        </div>
      )}

      {/* ── Batch Dropdown Panel (fixed, escapes overflow) ── */}
      <AnimatePresence>
        {batchOpen && batchRect && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: batchRect.bottom + 6,
              left: batchRect.left,
              width: batchRect.width,
              zIndex: 9999,
            }}
            className="bg-[#0C1319]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Empty option */}
            <button
              onClick={() => { setSelectedBatchId(''); navigate('/peternak/peternak_domba_penggemukan/ternak'); setBatchOpen(false) }}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors',
                !selectedBatchId ? 'bg-white/[0.04] text-white' : 'text-[#8CA0B3] hover:bg-white/[0.04] hover:text-white'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-white/10 shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-widest flex-1 italic">-- Pilih Batch --</span>
            </button>

            {batches.length > 0 && <div className="mx-4 h-px bg-white/[0.06]" />}

            {batches.map(b => {
              const isActive = selectedBatchId === b.id
              const isRunning = b.status === 'active'
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBatchId(b.id)
                    navigate(`/peternak/peternak_domba_penggemukan/ternak?batch=${b.id}`)
                    setBatchOpen(false)
                  }}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors',
                    isActive ? 'bg-green-500/10 text-white' : 'text-[#8CA0B3] hover:bg-white/[0.04] hover:text-white'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', isRunning ? 'bg-green-400' : 'bg-[#4B6478]')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-widest leading-none">{b.batch_code}</p>
                    <p className="text-[10px] text-[#4B6478] mt-0.5 truncate">{b.kandang_name} · {isRunning ? 'Aktif' : 'Selesai'}</p>
                  </div>
                  {isActive && <Check size={12} className="text-green-400 shrink-0" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sheets */}
      <AnimatePresence>
        {sheet === 'add' && <AddAnimalSheet batchId={selectedBatchId} animals={animals} onClose={() => setSheet(null)} />}
        {sheet === 'bulk' && <BulkAddSheet batchId={selectedBatchId} animalsCount={animals.length} onClose={() => setSheet(null)} />}
        {sheet === 'sale' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={() => setSheet(null)} />
            <SaleSheetInline batchId={selectedBatchId} animals={animals} onClose={() => setSheet(null)} />
          </>
        )}
        {typeof sheet === 'object' && sheet !== null && <AnimalDetailSheet animal={sheet} onClose={() => setSheet(null)} />}
      </AnimatePresence>
    </div>
  )
}