import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Tag, Scale, AlertCircle, ChevronsUpDown, Check, Trash2, ListPlus, Edit2, Activity, ArrowLeft } from 'lucide-react'
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
import { useTernakLimit } from '@/lib/hooks/useTernakLimit'
import {
  useSapiAnimals,
  useSapiBatches,
  useAddSapiAnimal,
  useUpdateSapiAnimal,
  useBulkAddSapiAnimals,
  calcSapiHariDiFarm,
  calcSapiADGFromRecords,
} from '@/lib/hooks/useSapiPenggemukanData'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'

// Breed suggestions untuk autocomplete di UI
const BREED_SUGGESTIONS = [
  'Limousin', 'Simmental', 'Brahman', 'Brangus', 'Angus', 'Wagyu',
  'Hereford', 'Droughtmaster', 'Belgian Blue',
  'PO (Peranakan Ongole)', 'Bali', 'Madura', 'Aceh', 'Pesisir',
  'Limpo (LimousinÃ—PO)', 'Simpo (SimmentalÃ—PO)', 'BrahmanÃ—PO',
  'Lainnya',
]

const STATUS_CONFIG = {
  active:  { label: 'Aktif',    color: 'text-green-400' },
  sold:    { label: 'Terjual',  color: 'text-blue-400'  },
  dead:    { label: 'Mati',     color: 'text-red-400'   },
  culled:  { label: 'Afkir',    color: 'text-amber-400' },
}

const WEIGH_METHOD_LABEL = {
  timbang_langsung:   { label: 'Timbang',  color: 'text-green-400' },
  estimasi_pita_ukur: { label: 'Pita Ukur',color: 'text-amber-400' },
  estimasi_visual:    { label: 'Estimasi', color: 'text-slate-400'  },
}

function AnimalCard({ animal, onClick }) {
  const hari   = calcSapiHariDiFarm(animal.entry_date, animal.exit_date)
  const adg    = calcSapiADGFromRecords(
    animal.sapi_penggemukan_weight_records,
    animal.entry_date,
    animal.entry_weight_kg
  )
  const adgKg  = adg ? (adg / 1000).toFixed(2) : null
  const latestW = animal.latest_weight_kg
  const gain   = latestW ? (latestW - animal.entry_weight_kg).toFixed(1) : null
  const st     = STATUS_CONFIG[animal.status] ?? STATUS_CONFIG.active

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 cursor-pointer active:bg-white/[0.05] transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-['Sora'] font-bold text-sm text-white">{animal.ear_tag}</span>
            <span className={`text-[10px] font-bold ${st.color}`}>{st.label}</span>
          </div>
          <p className="text-[11px] text-[#4B6478] mt-0.5">
            {animal.breed || 'Breed tidak diketahui'} · {animal.sex === 'jantan_kastrasi' ? 'Jantan (Kastrasi)' : animal.sex}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-white">
            {latestW ? `${latestW} kg` : `${animal.entry_weight_kg} kg`}
          </p>
          <p className="text-[10px] text-[#4B6478]">
            {latestW && latestW !== animal.entry_weight_kg
              ? `+${gain} kg`
              : 'Berat masuk'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[11px] font-bold text-white">{hari}</p>
          <p className="text-[10px] text-[#4B6478]">Hari</p>
        </div>
        <div className="border-x border-white/[0.06]">
          <p className={`text-[11px] font-bold ${adgKg ? 'text-amber-400' : 'text-[#4B6478]'}`}>
            {adgKg ? `${adgKg} kg` : '—'}
          </p>
          <p className="text-[10px] text-[#4B6478]">ADG/hr</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-white">
            {animal.entry_age_months ? `${animal.entry_age_months} bln` : '—'}
          </p>
          <p className="text-[10px] text-[#4B6478]">Usia Masuk</p>
        </div>
      </div>

      {animal.latest_weight_date && animal.sapi_penggemukan_weight_records?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/[0.04] flex justify-between items-center">
          <span className="text-[10px] text-[#4B6478]">
            Terakhir timbang: {new Date(animal.latest_weight_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </span>
          {(() => {
            const lastRecord = animal.sapi_penggemukan_weight_records?.sort(
              (a, b) => new Date(b.weigh_date) - new Date(a.weigh_date)
            )[0]
            const methodCfg = lastRecord ? WEIGH_METHOD_LABEL[lastRecord.weigh_method] : null
            return methodCfg ? (
              <span className={`text-[10px] font-semibold ${methodCfg.color}`}>
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
    // Generate initials from business name. Default to "SPI" if not available.
    const name = tenant?.business_name || 'Sapi'
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
    // Sequence number (current animals + 1)
    const seq = String(animals.length + 1).padStart(4, '0')
    return `${initials}-${new Date().getFullYear()}-${seq}`
  }

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm({
    defaultValues: { 
      ear_tag: generateEarTag(),
      species: 'sapi', 
      acquisition_type: 'beli', 
      age_confidence: 'estimasi',
      entry_date: new Date().toISOString().split('T')[0]
    }
  })
  const { mutate: addAnimal, isPending } = useAddSapiAnimal()
  const acquisitionType = watch('acquisition_type')

  const onSubmit = (data) => {
    addAnimal(
      {
        batch_id:           batchId,
        ear_tag:            data.ear_tag.trim(),
        species:            data.species,
        breed:              data.breed?.trim() || null,
        sex:                data.sex,
        birth_date:         data.birth_date || null,
        entry_age_months:   data.entry_age_months ? parseInt(data.entry_age_months) : null,
        age_confidence:     data.age_confidence,
        acquisition_type:   data.acquisition_type,
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
          <h2 className="font-['Sora'] font-extrabold text-[22px] text-white tracking-tight leading-none mb-1">Tambah Sapi</h2>
          <p className="text-[11px] text-[#4B6478] font-medium">Tambah record ternak baru</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors relative z-10">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar relative">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Ear Tag */}
        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Ear Tag / ID Sapi
          </label>
          <div className="relative">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
            <input
              {...register('ear_tag', { required: true })}
              placeholder="e.g. SPI-2026-0001"
              className="w-full pl-9 pr-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
            />
          </div>
          {errors.ear_tag && <p className="text-red-400 text-[11px] mt-1">Wajib diisi</p>}
        </div>

        {/* Species */}
        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Jenis Hewan
          </label>
          <Controller
            control={control}
            name="species"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50">
                  <SelectValue placeholder="Pilih Jenis Hewan" />
                </SelectTrigger>
                <SelectContent className="bg-[#111C24] border border-white/10 rounded-xl shadow-xl z-[5000]">
                  <SelectItem value="sapi" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Sapi</SelectItem>
                  <SelectItem value="kerbau" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Kerbau</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Breed */}
        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Breed / Bangsa Sapi
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
                      "w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm justify-between hover:bg-white/5 transition-all text-left font-normal",
                      !field.value ? "text-[#4B6478]" : "text-white"
                    )}
                  >
                    {field.value ? field.value : "e.g. Limousin, PO, Bali..."}
                    <ChevronsUpDown size={14} className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-[#111C24] border-white/10 shadow-2xl z-[5000]">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Cari breed..." className="h-11 border-none focus:ring-0 text-white" />
                    <CommandList className="max-h-[300px] scrollbar-thin">
                      <CommandEmpty className="py-4 text-center text-xs opacity-50 font-bold uppercase">Breed tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {BREED_SUGGESTIONS.map(b => (
                          <CommandItem
                            key={b}
                            value={b}
                            onSelect={() => {
                              field.onChange(b)
                              setOpenBreed(false)
                            }}
                            className="flex items-center justify-between py-2.5 px-3 cursor-pointer hover:bg-emerald-500/10 rounded-lg text-xs font-bold uppercase tracking-widest"
                          >
                            <span className={cn(field.value === b ? "text-emerald-400" : "text-white")}>{b}</span>
                            {field.value === b && <Check size={14} className="text-emerald-400" />}
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

        {/* Sex */}
        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Jenis Kelamin
          </label>
          <Controller
            control={control}
            name="sex"
            rules={{ required: true }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50">
                  <SelectValue placeholder="-- Pilih Kelamin --" />
                </SelectTrigger>
                <SelectContent className="bg-[#111C24] border border-white/10 rounded-xl shadow-xl z-[5000]">
                  <SelectItem value="jantan" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Jantan</SelectItem>
                  <SelectItem value="betina" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Betina</SelectItem>
                  <SelectItem value="jantan_kastrasi" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Jantan (Kastrasi)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.sex && <p className="text-red-400 text-[11px] mt-1">Wajib dipilih</p>}
        </div>

        {/* Usia */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Tanggal Lahir
            </label>
            <Controller
              control={control}
              name="birth_date"
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date)}
                  placeholder="Pilih tanggal"
                />
              )}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Usia Masuk (bln)
            </label>
            <input
              {...register('entry_age_months')}
              type="number"
              min="1"
              max="120"
              placeholder="e.g. 18"
              className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Akurasi Usia
          </label>
          <Controller
            control={control}
            name="age_confidence"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50">
                  <SelectValue placeholder="-- Pilih Akurasi --" />
                </SelectTrigger>
                <SelectContent className="bg-[#111C24] border border-white/10 rounded-xl shadow-xl z-[5000]">
                  <SelectItem value="pasti" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Pasti (ada surat lahir)</SelectItem>
                  <SelectItem value="estimasi" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Estimasi (kondisi gigi)</SelectItem>
                  <SelectItem value="tidak_tahu" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Tidak diketahui</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Asal ternak */}
        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Asal Ternak
          </label>
          <Controller
            control={control}
            name="acquisition_type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50">
                  <SelectValue placeholder="-- Pilih Asal --" />
                </SelectTrigger>
                <SelectContent className="bg-[#111C24] border border-white/10 rounded-xl shadow-xl z-[5000]">
                  <SelectItem value="beli" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Beli (bakalan / pasar)</SelectItem>
                  <SelectItem value="lahir_sendiri" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Lahir sendiri</SelectItem>
                  <SelectItem value="hibah" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Hibah / pemberian</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Harga beli — hanya tampil jika beli */}
        {acquisitionType === 'beli' && (
          <div>
            <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Harga Beli (Rp)
            </label>
            <Controller
              control={control}
              name="purchase_price_idr"
              render={({ field }) => (
                <InputRupiah
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g. 12.000.000"
                  className="w-full px-4 h-12 bg-[#111C24] border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                />
              )}
            />
          </div>
        )}

        {/* Data masuk */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Tanggal Masuk
            </label>
            <Controller
              control={control}
              name="entry_date"
              rules={{ required: true }}
              render={({ field }) => (
                <DatePicker
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date)}
                  placeholder="Pilih tanggal masuk"
                />
              )}
            />
            {errors.entry_date && <p className="text-red-400 text-[11px] mt-1">Wajib diisi</p>}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Berat Masuk (kg)
            </label>
            <div className="relative">
              <Scale size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
              <input
                {...register('entry_weight_kg', { required: true, min: 1 })}
                type="number"
                step="0.1"
                placeholder="e.g. 280"
                className="w-full pl-9 pr-3 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
              />
            </div>
            {errors.entry_weight_kg && <p className="text-red-400 text-[11px] mt-1">Wajib diisi</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Kondisi Masuk
            </label>
            <Controller
              control={control}
              name="entry_condition"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50">
                    <SelectValue placeholder="-- Pilih Kondisi --" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111C24] border border-white/10 rounded-xl shadow-xl z-[5000]">
                    <SelectItem value="sehat" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Sehat</SelectItem>
                    <SelectItem value="kurus" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Kurus</SelectItem>
                    <SelectItem value="cacat" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Cacat minor</SelectItem>
                    <SelectItem value="sakit" className="text-white hover:bg-white/5 cursor-pointer py-2.5 px-3 rounded-lg mx-1 my-0.5">Sakit / perlu penanganan</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
              BCS (1–5)
            </label>
            <input
              {...register('entry_bcs')}
              type="number"
              step="0.5"
              min="1"
              max="5"
              placeholder="e.g. 2.5"
              className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Asal (Pasar / Daerah)
          </label>
          <input
            {...register('source')}
            placeholder="e.g. Pasar Hewan Wonosari"
            className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Catatan (opsional)
          </label>
          <textarea
            {...register('notes')}
            rows={2}
            className="w-full px-4 py-3 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors"
        >
          {isPending ? 'Menyimpan...' : 'Tambah Sapi'}
        </button>
        </form>
      </div>
    </motion.div>
  )
}

// â”€â”€ AnimalDetailSheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AnimalDetailSheet({ animal, onClose }) {
  const [isEditing, setIsEditing] = useState(false)
  const [openBreedDetail, setOpenBreedDetail] = useState(false)
  const { mutate: updateAnimal, isPending } = useUpdateSapiAnimal()

  const hari = calcSapiHariDiFarm(animal.entry_date, animal.exit_date)
  const adg = calcSapiADGFromRecords(animal.sapi_penggemukan_weight_records, animal.entry_date, animal.entry_weight_kg)
  const adgKg = adg ? (adg / 1000).toFixed(2) : null
  const gain = animal.latest_weight_kg ? (animal.latest_weight_kg - animal.entry_weight_kg).toFixed(1) : null
  const STATUS_COLOR = { active: 'text-green-400', sold: 'text-blue-400', dead: 'text-red-400', culled: 'text-amber-400' }
  const STATUS_LABEL = { active: 'Aktif', sold: 'Terjual', dead: 'Mati', culled: 'Afkir' }

  const { register, handleSubmit, watch, control } = useForm({
    defaultValues: {
      ear_tag: animal.ear_tag,
      breed: animal.breed || '',
      sex: animal.sex,
      entry_weight_kg: animal.entry_weight_kg,
      entry_age_months: animal.entry_age_months || '',
      acquisition_type: animal.acquisition_type || 'beli',
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
        entry_weight_kg: parseFloat(data.entry_weight_kg),
        entry_age_months: data.entry_age_months ? parseInt(data.entry_age_months) : null,
        acquisition_type: data.acquisition_type,
        source: data.source?.trim() || null,
        notes: data.notes?.trim() || null,
        purchase_price_idr: data.purchase_price_idr ? parseInt(data.purchase_price_idr) : 0,
      }
    }, { onSuccess: () => setIsEditing(false) })
  }

  const inputCls = 'w-full h-10 px-3 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50'

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-y-0 right-0 w-[420px] max-w-full z-50 bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-4 border-b border-white/5 relative shrink-0">
        <div className="absolute -top-10 right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-['Sora'] font-extrabold text-[22px] text-white tracking-tight leading-none">{animal.ear_tag}</h2>
              <span className={`text-xs font-bold ${STATUS_COLOR[animal.status] || 'text-white'}`}>
                {STATUS_LABEL[animal.status] || animal.status}
              </span>
            </div>
            <p className="text-[11px] text-[#4B6478]">{animal.breed || 'Breed tidak diketahui'} · {animal.sex === 'jantan_kastrasi' ? 'Jantan (Kastrasi)' : animal.sex}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(e => !e)}
              className={cn('w-8 h-8 rounded-full border flex items-center justify-center transition-colors', isEditing ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/10')}
            >
              <Edit2 size={14} />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Hari di Farm', value: `${hari} hari` },
            { label: 'ADG', value: adgKg ? `${adgKg} kg/hr` : '—' },
            { label: 'Pertambahan', value: gain ? `+${gain} kg` : '—' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 text-center">
              <p className="font-bold text-sm text-white">{kpi.value}</p>
              <p className="text-[10px] text-[#4B6478] mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Berat */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-3 flex items-center gap-1.5"><Activity size={12} /> Berat</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#4B6478] mb-0.5">Masuk</p>
              <p className="text-lg font-black text-white">{animal.entry_weight_kg} <span className="text-xs text-[#4B6478]">kg</span></p>
            </div>
            <div>
              <p className="text-xs text-[#4B6478] mb-0.5">Terakhir</p>
              <p className={cn('text-lg font-black', animal.latest_weight_kg && animal.latest_weight_kg !== animal.entry_weight_kg ? 'text-emerald-400' : 'text-white')}>
                {animal.latest_weight_kg || animal.entry_weight_kg} <span className="text-xs text-[#4B6478]">kg</span>
              </p>
            </div>
          </div>
        </div>

        {/* Detail Info */}
        {!isEditing ? (
          <div className="space-y-2">
            {[
              { label: 'Tanggal Masuk', value: animal.entry_date ? new Date(animal.entry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              { label: 'Usia Masuk', value: animal.entry_age_months ? `${animal.entry_age_months} bulan` : '—' },
              { label: 'Asal', value: animal.acquisition_type === 'beli' ? 'Beli / Bakalan' : animal.acquisition_type === 'lahir_sendiri' ? 'Lahir sendiri' : 'Hibah' },
              { label: 'Sumber', value: animal.source || '—' },
              { label: 'Harga Beli', value: animal.purchase_price_idr ? `Rp ${Number(animal.purchase_price_idr).toLocaleString('id-ID')}` : '—' },
              { label: 'BCS Masuk', value: animal.entry_bcs ? `${animal.entry_bcs} / 5` : '—' },
              { label: 'Kondisi Masuk', value: animal.entry_condition || '—' },
              { label: 'Catatan', value: animal.notes || '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                <span className="text-[11px] text-[#4B6478]">{row.label}</span>
                <span className="text-[11px] font-medium text-white text-right max-w-[55%]">{row.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <form id="edit-animal-form" onSubmit={handleSubmit(onSave)} className="space-y-3">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Mode Edit</p>
            {[
              { label: 'Ear Tag', name: 'ear_tag', placeholder: 'e.g. MJ-2026-0001' },
              { label: 'Usia Masuk (bln)', name: 'entry_age_months', placeholder: 'e.g. 18', type: 'number' },
              { label: 'Berat Masuk (kg)', name: 'entry_weight_kg', placeholder: 'e.g. 280', type: 'number', step: '0.1' },
              { label: 'Sumber', name: 'source', placeholder: 'e.g. Pasar Wonosari' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1">{f.label}</label>
                <input {...register(f.name)} type={f.type || 'text'} step={f.step} placeholder={f.placeholder} className={inputCls} />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1">Breed</label>
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
                          <CommandEmpty className="py-4 text-center text-xs opacity-50">Tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {BREED_SUGGESTIONS.map(b => (
                              <CommandItem key={b} value={b} onSelect={() => { fld.onChange(b); setOpenBreedDetail(false) }}
                                className="flex items-center justify-between py-2.5 px-3 cursor-pointer hover:bg-emerald-500/10 rounded-lg text-sm"
                              >
                                <span className={cn(fld.value === b ? 'text-emerald-400' : 'text-white')}>{b}</span>
                                {fld.value === b && <Check size={13} className="text-emerald-400" />}
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
              <label className="block text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1">Catatan</label>
              <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50 resize-none" />
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      {isEditing && (
        <div className="px-6 py-4 border-t border-white/5 flex gap-2 shrink-0">
          <button type="button" onClick={() => setIsEditing(false)} className="flex-1 h-11 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors">
            Batal
          </button>
          <button form="edit-animal-form" type="submit" disabled={isPending} className="flex-1 h-11 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors">
            {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      )}
    </motion.div>
  )
}

// â”€â”€ BreedCombobox — per-row searchable combobox for bulk form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BreedCombobox({ value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full h-10 px-3 bg-[#111C24] border border-white/10 rounded-xl text-xs justify-between hover:bg-white/5 transition-all font-normal",
            !value ? "text-[#4B6478]" : "text-white"
          )}
        >
          <span className="truncate">{value || 'Pilih breed...'}</span>
          <ChevronsUpDown size={12} className="opacity-40 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 bg-[#111C24] border-white/10 shadow-2xl z-[5000]">
        <Command className="bg-transparent">
          <CommandInput placeholder="Cari breed..." className="h-9 border-none focus:ring-0 text-white text-xs" />
          <CommandList className="max-h-[260px]">
            <CommandEmpty className="py-3 text-center text-xs opacity-50">Tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {BREED_SUGGESTIONS.map(b => (
                <CommandItem
                  key={b}
                  value={b}
                  onSelect={() => { onChange(b); setOpen(false) }}
                  className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-emerald-500/10 rounded-lg text-xs"
                >
                  <span className={cn(value === b ? 'text-emerald-400' : 'text-white')}>{b}</span>
                  {value === b && <Check size={12} className="text-emerald-400" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function BulkAddAnimalSheet({ batchId, animals = [], onClose }) {
  const { tenant } = useAuth()
  const { mutate: bulkAdd, isPending } = useBulkAddSapiAnimals()

  const today = new Date().toISOString().split('T')[0]
  const getInitials = () => {
    const name = tenant?.business_name || 'Sapi'
    return name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
  }
  const makeEarTag = (index) => {
    const seq = String(animals.length + index + 1).padStart(4, '0')
    return `${getInitials()}-${new Date().getFullYear()}-${seq}`
  }

  const { control, register, handleSubmit, watch } = useForm({
    defaultValues: {
      rows: [
        { ear_tag: makeEarTag(0), sex: 'jantan', entry_date: today, entry_weight_kg: '', breed: '', purchase_price_idr: '' },
        { ear_tag: makeEarTag(1), sex: 'jantan', entry_date: today, entry_weight_kg: '', breed: '', purchase_price_idr: '' },
        { ear_tag: makeEarTag(2), sex: 'jantan', entry_date: today, entry_weight_kg: '', breed: '', purchase_price_idr: '' },
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'rows' })

  const onSubmit = (data) => {
    const valid = data.rows.filter(r => r.ear_tag?.trim() && r.sex && r.entry_date && r.entry_weight_kg)
    if (!valid.length) return
    bulkAdd({ batch_id: batchId, animals: valid }, { onSuccess: onClose })
  }

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-y-0 right-0 w-[680px] max-w-[98vw] z-50 bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-white/5 shrink-0">
        <div>
          <h2 className="font-['Sora'] font-extrabold text-[22px] text-white tracking-tight leading-none mb-1">Tambah Banyak Sapi</h2>
          <p className="text-[11px] text-[#4B6478] font-medium">Isi baris di bawah, setiap baris = 1 ekor sapi</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Column Headers */}
      <div className="px-6 pt-4 pb-2 grid grid-cols-[1.5fr_1.5fr_1.5fr_1.5fr_1.5fr_1.5fr_auto] gap-2 shrink-0">
        {['Ear Tag *', 'Breed', 'Kelamin *', 'Tgl Masuk *', 'Berat (kg) *', 'Harga Beli (Rp)'].map(h => (
          <p key={h} className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">{h}</p>
        ))}
        <p></p>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1.5fr_1.5fr_1.5fr_auto] gap-2 items-center">
            {/* Ear Tag */}
            <input
              {...register(`rows.${index}.ear_tag`)}
              placeholder="e.g. MJ-2026-0001"
              className="h-10 px-3 bg-[#111C24] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
            />
            {/* Breed — Searchable Combobox */}
            <Controller
              control={control}
              name={`rows.${index}.breed`}
              render={({ field: f }) => (
                <BreedCombobox value={f.value} onChange={f.onChange} />
              )}
            />
            {/* Sex — Shadcn Select */}
            <Controller
              control={control}
              name={`rows.${index}.sex`}
              render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger className="h-10 bg-[#111C24] border border-white/10 rounded-xl text-xs text-white focus:ring-amber-500/50">
                    <SelectValue placeholder="Kelamin" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111C24] border-white/10 text-white rounded-xl z-[5000]">
                    <SelectItem value="jantan" className="text-xs">Jantan</SelectItem>
                    <SelectItem value="betina" className="text-xs">Betina</SelectItem>
                    <SelectItem value="jantan_kastrasi" className="text-xs">Kastrasi</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {/* Entry Date — DatePicker */}
            <Controller
              control={control}
              name={`rows.${index}.entry_date`}
              render={({ field: f }) => (
                <DatePicker
                  value={f.value ? new Date(f.value) : null}
                  onChange={(date) => f.onChange(date)}
                  placeholder="Tgl masuk"
                  className="h-10 text-xs rounded-xl"
                />
              )}
            />
            {/* Weight */}
            <input
              {...register(`rows.${index}.entry_weight_kg`)}
              type="number"
              step="0.1"
              min="1"
              placeholder="e.g. 280 kg"
              className="h-10 px-3 bg-[#111C24] border border-white/10 rounded-xl text-xs text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
            />
            {/* Price — InputRupiah */}
            <Controller
              control={control}
              name={`rows.${index}.purchase_price_idr`}
              render={({ field: f }) => (
                <InputRupiah
                  value={f.value}
                  onChange={f.onChange}
                  placeholder="Rp"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', height: '40px', borderRadius: '12px', fontSize: '12px' }}
                />
              )}
            />
            {/* Remove */}
            {fields.length > 1 ? (
              <button type="button" onClick={() => remove(index)} className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                <Trash2 size={14} />
              </button>
            ) : <div className="w-8" />}
          </div>
        ))}
      </div>


      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={() => append({ ear_tag: makeEarTag(fields.length), sex: 'jantan', entry_date: today, entry_weight_kg: '', breed: '', purchase_price_idr: '' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/10 text-xs font-bold transition-colors"
        >
          <Plus size={13} /> Tambah Baris
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#4B6478]">{fields.length} ekor</span>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors"
          >
            {isPending ? 'Menyimpan...' : `Simpan ${fields.length} Sapi`}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function SapiTernak() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const batchId = searchParams.get('batch')
  const { canAdd, currentCount, limit, isUnlimited } = useTernakLimit('sapi')
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilter] = useState('active')
  const [showAdd, setShowAdd]     = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState(null)

  const { data: batches = [] }                           = useSapiBatches()
  const { data: animals = [], isLoading }                = useSapiAnimals(batchId)

  // Auto-select first batch if none selected
  useEffect(() => {
    if (!batchId && batches.length > 0) {
      const firstActive = batches.find(b => b.status === 'active') || batches[0]
      if (firstActive) setSearchParams({ batch: firstActive.id }, { replace: true })
    }
  }, [batches, batchId])

  const activeBatch = batches.find(b => b.id === batchId)

  const filtered = useMemo(() => {
    return animals.filter(a => {
      const matchStatus = filterStatus === 'all' || a.status === filterStatus
      const matchSearch = !search
        || a.ear_tag.toLowerCase().includes(search.toLowerCase())
        || a.breed?.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSearch
    })
  }, [animals, filterStatus, search])

  if (!batchId) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <AlertCircle size={40} className="text-[#4B6478] mb-4 opacity-50" />
      <h2 className="font-['Sora'] font-black text-xl text-white mb-2">Pilih Batch Ternak</h2>
      <p className="text-[#4B6478] text-xs font-medium mb-6 max-w-[280px]">
        Anda sedang tidak membuka batch spesifik. Silakan pilih batch aktif di bawah ini untuk melihat data ternak.
      </p>
      
      {batches.length > 0 ? (
        <div className="w-full max-w-[320px]">
          <Select onValueChange={(val) => setSearchParams({ batch: val })}>
            <SelectTrigger className="w-full h-14 bg-white/5 border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-colors">
              <SelectValue placeholder="-- Pilih Batch Aktif --" />
            </SelectTrigger>
            <SelectContent className="bg-[#111C24] border-white/10 rounded-xl">
              {batches.map(b => (
                <SelectItem key={b.id} value={b.id} className="text-white hover:bg-emerald-500/10 cursor-pointer font-bold py-3">
                  {b.batch_code} ({b.total_animals || 0} ekor)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold max-w-[320px]">
          Anda belum memiliki batch aktif. Buka halaman Batch untuk membuat batch baru terlebih dahulu.
        </div>
      )}
    </div>
  )

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/peternak/peternak_sapi_penggemukan/batch')}
              className="p-1.5 -ml-1 text-[#4B6478] hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-['Sora'] font-black text-xl text-white">Data Ternak</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isUnlimited && (
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${!canAdd ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-[#4B6478] bg-white/5 border-white/5'}`}>
                {currentCount}/{limit}
              </span>
            )}
            <button
              disabled={!canAdd}
              title={!canAdd ? `Limit ${limit} ekor tercapai. Upgrade ke Pro/Business.` : undefined}
              onClick={() => setShowBulkAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ListPlus size={13} />
              Banyak
            </button>
            <button
              disabled={!canAdd}
              title={!canAdd ? `Limit ${limit} ekor tercapai. Upgrade ke Pro/Business.` : undefined}
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={13} />
              Tambah
            </button>
          </div>
        </div>
        {activeBatch && (
          <p className="text-[11px] text-[#4B6478]">
            {activeBatch.batch_code} · {activeBatch.total_animals} ekor
          </p>
        )}
      </header>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 pt-4 overflow-x-auto">
        {[
          { value: 'active', label: 'Aktif' },
          { value: 'sold',   label: 'Terjual' },
          { value: 'dead',   label: 'Mati' },
          { value: 'all',    label: 'Semua' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === f.value
                ? 'bg-amber-600 text-white'
                : 'bg-white/5 text-[#94A3B8]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 mt-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari ear tag atau breed..."
            className="w-full pl-9 pr-4 h-10 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/30"
          />
        </div>
      </div>

      {/* Animal list */}
      <div className="px-4 mt-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
            <p className="text-2xl mb-2">ðŸ„</p>
            <p className="text-sm font-semibold text-white mb-1">Belum ada ternak</p>
            <p className="text-xs text-[#4B6478]">
              {filterStatus === 'active' ? 'Tambah sapi ke batch ini' : 'Tidak ada data untuk filter ini'}
            </p>
          </div>
        ) : (
          filtered.map(a => (
            <AnimalCard key={a.id} animal={a} onClick={() => setSelectedAnimal(a)} />
          ))
        )}
      </div>

      {/* Add Single Animal Sheet */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowAdd(false)}
            />
            <AddAnimalSheet batchId={batchId} animals={animals} onClose={() => setShowAdd(false)} />
          </>
        )}
      </AnimatePresence>

      {/* Bulk Add Animals Sheet */}
      <AnimatePresence>
        {showBulkAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowBulkAdd(false)}
            />
            <BulkAddAnimalSheet batchId={batchId} animals={animals} onClose={() => setShowBulkAdd(false)} />
          </>
        )}
      </AnimatePresence>
      {/* Animal Detail Sheet */}
      <AnimatePresence>
        {selectedAnimal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setSelectedAnimal(null)}
            />
            <AnimalDetailSheet animal={selectedAnimal} onClose={() => setSelectedAnimal(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}