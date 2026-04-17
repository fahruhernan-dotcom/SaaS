import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Tag, Scale, Calendar, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  useSapiAnimals,
  useSapiBatches,
  useAddSapiAnimal,
  calcSapiHariDiFarm,
  calcSapiADGFromRecords,
} from '@/lib/hooks/useSapiPenggemukanData'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'

// Breed suggestions untuk autocomplete di UI
const BREED_SUGGESTIONS = [
  'Limousin', 'Simmental', 'Brahman', 'Brangus', 'Angus', 'Wagyu',
  'Hereford', 'Droughtmaster', 'Belgian Blue',
  'PO (Peranakan Ongole)', 'Bali', 'Madura', 'Aceh', 'Pesisir',
  'Limpo (Limousin×PO)', 'Simpo (Simmental×PO)', 'Brahman×PO',
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

function AddAnimalSheet({ batchId, onClose }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { species: 'sapi', acquisition_type: 'beli', age_confidence: 'estimasi' }
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
          ? parseInt(data.purchase_price_idr.replace(/\D/g, ''))
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
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-[#0C1319] rounded-t-[24px] border-t border-white/[0.08] overflow-y-auto max-h-[92vh] pb-10"
    >
      <div className="sticky top-0 bg-[#0C1319] px-5 pt-5 pb-3 border-b border-white/[0.06] flex items-center justify-between">
        <h2 className="font-['Sora'] font-bold text-base text-white">Tambah Sapi</h2>
        <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 text-[#94A3B8]">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-5 pt-4 space-y-4">

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
          <select
            {...register('species')}
            className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="sapi">Sapi</option>
            <option value="kerbau">Kerbau</option>
          </select>
        </div>

        {/* Breed */}
        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Breed / Bangsa Sapi
          </label>
          <input
            {...register('breed')}
            list="breed-suggestions"
            placeholder="e.g. Limousin, PO, Bali..."
            className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
          />
          <datalist id="breed-suggestions">
            {BREED_SUGGESTIONS.map(b => <option key={b} value={b} />)}
          </datalist>
        </div>

        {/* Sex */}
        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Jenis Kelamin
          </label>
          <select
            {...register('sex', { required: true })}
            className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="">-- Pilih --</option>
            <option value="jantan">Jantan</option>
            <option value="betina">Betina</option>
            <option value="jantan_kastrasi">Jantan (Kastrasi)</option>
          </select>
          {errors.sex && <p className="text-red-400 text-[11px] mt-1">Wajib dipilih</p>}
        </div>

        {/* Usia */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Tanggal Lahir
            </label>
            <input
              {...register('birth_date')}
              type="date"
              className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
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
          <select
            {...register('age_confidence')}
            className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="pasti">Pasti (ada surat lahir)</option>
            <option value="estimasi">Estimasi (kondisi gigi)</option>
            <option value="tidak_tahu">Tidak diketahui</option>
          </select>
        </div>

        {/* Asal ternak */}
        <div>
          <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
            Asal Ternak
          </label>
          <select
            {...register('acquisition_type')}
            className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="beli">Beli (bakalan / pasar)</option>
            <option value="lahir_sendiri">Lahir sendiri</option>
            <option value="hibah">Hibah / pemberian</option>
          </select>
        </div>

        {/* Harga beli — hanya tampil jika beli */}
        {acquisitionType === 'beli' && (
          <div>
            <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Harga Beli (Rp)
            </label>
            <input
              {...register('purchase_price_idr')}
              type="number"
              placeholder="e.g. 12000000"
              className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
            />
          </div>
        )}

        {/* Data masuk */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Tanggal Masuk
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
              <input
                {...register('entry_date', { required: true })}
                type="date"
                className="w-full pl-9 pr-3 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
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
            <select
              {...register('entry_condition')}
              className="w-full px-4 h-12 bg-[#111C24] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="">-- Pilih --</option>
              <option value="sehat">Sehat</option>
              <option value="kurus">Kurus</option>
              <option value="cacat">Cacat minor</option>
              <option value="sakit">Sakit / perlu penanganan</option>
            </select>
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
    </motion.div>
  )
}

export default function SapiTernak() {
  const [searchParams] = useSearchParams()
  const batchId = searchParams.get('batch')
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilter] = useState('active')
  const [showAdd, setShowAdd]     = useState(false)

  const { data: batches = [] }                           = useSapiBatches()
  const { data: animals = [], isLoading }                = useSapiAnimals(batchId)

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <AlertCircle size={32} className="text-[#4B6478] mb-3" />
      <p className="text-white font-semibold mb-1">Pilih batch terlebih dulu</p>
      <p className="text-[#4B6478] text-sm">Buka halaman Batch dan tap batch yang ingin dilihat.</p>
    </div>
  )

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-['Sora'] font-black text-xl text-white">Data Ternak</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-colors"
          >
            <Plus size={13} />
            Tambah
          </button>
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
            <p className="text-2xl mb-2">🐄</p>
            <p className="text-sm font-semibold text-white mb-1">Belum ada ternak</p>
            <p className="text-xs text-[#4B6478]">
              {filterStatus === 'active' ? 'Tambah sapi ke batch ini' : 'Tidak ada data untuk filter ini'}
            </p>
          </div>
        ) : (
          filtered.map(a => (
            <AnimalCard key={a.id} animal={a} onClick={() => {}} />
          ))
        )}
      </div>

      {/* Add Animal Sheet */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowAdd(false)}
            />
            <AddAnimalSheet batchId={batchId} onClose={() => setShowAdd(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
