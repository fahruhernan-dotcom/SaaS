import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Tag, ChevronDown, Heart } from 'lucide-react'
import { useForm } from 'react-hook-form'
import {
  useSapiBreedingAnimals,
  useAddSapiBreedingAnimal,
} from '@/lib/hooks/useSapiBreedingData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'

const BASE = '/peternak/peternak_sapi_breeding'

const PURPOSE_CFG = {
  indukan:     { label: 'Indukan',     color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  pejantan:    { label: 'Pejantan',    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  calon_bibit: { label: 'Calon Bibit', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  afkir:       { label: 'Afkir',       color: 'text-slate-400 bg-white/5 border-white/10' },
}

const STATUS_COLOR = {
  aktif:    'text-green-400',
  bunting:  'text-amber-400',
  afkir:    'text-slate-400',
  mati:     'text-red-400',
  terjual:  'text-slate-400',
}

const BREED_SUGGESTIONS = [
  'Limousin', 'Simmental', 'Brahman', 'Brangus', 'Angus', 'Wagyu',
  'Hereford', 'Droughtmaster', 'Belgian Blue',
  'PO (Peranakan Ongole)', 'Bali', 'Madura', 'Aceh', 'Pesisir',
  'Limpo (Limousin×PO)', 'Simpo (Simmental×PO)', 'Brahman×PO', 'Lainnya',
]

function AnimalCard({ animal }) {
  const purpose = PURPOSE_CFG[animal.purpose]
  const statusCls = STATUS_COLOR[animal.status] ?? 'text-white'
  const adgKg = animal.latest_weight_kg && animal.entry_weight_kg && animal.entry_date
    ? (() => {
        const days = Math.floor((new Date(animal.latest_weight_date ?? new Date()) - new Date(animal.entry_date)) / 86400000)
        if (days <= 0) return null
        const gain = (animal.latest_weight_kg - animal.entry_weight_kg) * 1000
        return (gain / days / 1000).toFixed(2)
      })()
    : null

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-['Sora'] font-bold text-sm text-white">{animal.ear_tag}</span>
            {animal.name && <span className="text-[11px] text-[#4B6478]">"{animal.name}"</span>}
            {purpose && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${purpose.color}`}>
                {purpose.label}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#4B6478]">
            {animal.breed ?? '—'} · {animal.sex === 'betina' ? '♀' : '♂'} · Parity {animal.parity}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-white font-['Sora']">
            {animal.latest_weight_kg ? `${animal.latest_weight_kg} kg` : '—'}
          </p>
          <p className={`text-[10px] font-semibold ${statusCls}`}>
            {animal.status === 'bunting' ? 'Bunting' : animal.status}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-center pt-2 border-t border-white/[0.04]">
        <div>
          <p className="text-[11px] font-bold text-white">{animal.latest_bcs ?? '—'}</p>
          <p className="text-[10px] text-[#4B6478]">BCS</p>
        </div>
        <div>
          <p className={`text-[11px] font-bold ${adgKg ? 'text-amber-400' : 'text-[#4B6478]'}`}>
            {adgKg ? `${adgKg}` : '—'}
          </p>
          <p className="text-[10px] text-[#4B6478]">ADG kg</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-white">{animal.parity}</p>
          <p className="text-[10px] text-[#4B6478]">Parity</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-white">{animal.generation ?? '—'}</p>
          <p className="text-[10px] text-[#4B6478]">Generasi</p>
        </div>
      </div>

      {animal.birth_date && (
        <p className="text-[10px] text-[#4B6478] mt-2">
          Lahir: {animal.birth_date}
          {animal.birth_weight_kg && ` · ${animal.birth_weight_kg} kg`}
          {animal.dam_id && ' · Lahir di Farm'}
        </p>
      )}
    </div>
  )
}

function AddAnimalSheet({ animals, onClose }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      species: 'sapi', acquisition_type: 'beli', parity: 0,
      entry_date: new Date().toISOString().split('T')[0],
    }
  })
  const { mutate: addAnimal, isPending } = useAddSapiBreedingAnimal()
  const acquisitionType = watch('acquisition_type')
  const sex             = watch('sex')

  const onSubmit = (data) => {
    addAnimal({
      ear_tag:           data.ear_tag.trim(),
      name:              data.name?.trim() || null,
      species:           data.species,
      sex:               data.sex,
      breed:             data.breed?.trim() || null,
      breed_composition: data.breed_composition?.trim() || null,
      generation:        data.generation || null,
      birth_date:        data.birth_date || null,
      birth_weight_kg:   data.birth_weight_kg ? parseFloat(data.birth_weight_kg) : null,
      birth_type:        data.birth_type || null,
      dam_id:            data.dam_id || null,
      sire_id:           data.sire_id || null,
      acquisition_type:  data.acquisition_type,
      source:            data.source?.trim() || null,
      purpose:           data.purpose || null,
      parity:            parseInt(data.parity) || 0,
      selection_class:   data.selection_class || null,
      origin:            data.origin || null,
      entry_date:        data.entry_date,
      entry_weight_kg:   parseFloat(data.entry_weight_kg),
      entry_bcs:         data.entry_bcs ? parseFloat(data.entry_bcs) : null,
      purchase_price_idr: data.purchase_price_idr ? parseInt(data.purchase_price_idr) : null,
      kandang_name:      data.kandang_name?.trim() || null,
      notes:             data.notes?.trim() || null,
    }, { onSuccess: onClose })
  }

  const fieldCls = "w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-amber-500/40"
  const labelCls = "block text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mb-1.5"
  const inducans = animals.filter(a => a.sex === 'betina' && a.status !== 'mati')
  const pejantan = animals.filter(a => a.sex === 'jantan' && a.status !== 'mati')

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-[#0C1319] rounded-t-[24px] border-t border-white/[0.08] p-5 pb-10 max-h-[92vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-['Sora'] font-bold text-base text-white">Tambah Ekor</h2>
        <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 text-[#94A3B8]">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Identitas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Ear Tag *</label>
            <input {...register('ear_tag', { required: true })} placeholder="e.g. IND-2026-001"
              className={fieldCls} />
            {errors.ear_tag && <p className="text-red-400 text-[11px] mt-1">Wajib diisi</p>}
          </div>
          <div>
            <label className={labelCls}>Nama (Opsional)</label>
            <input {...register('name')} placeholder="e.g. Melati"
              className={fieldCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Spesies</label>
            <select {...register('species')} className={fieldCls + ' appearance-none'}>
              <option value="sapi">Sapi</option>
              <option value="kerbau">Kerbau</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Jenis Kelamin *</label>
            <select {...register('sex', { required: true })} className={fieldCls + ' appearance-none'}>
              <option value="">-- Pilih --</option>
              <option value="betina">Betina</option>
              <option value="jantan">Jantan</option>
            </select>
            {errors.sex && <p className="text-red-400 text-[11px] mt-1">Wajib</p>}
          </div>
        </div>

        {/* Breed */}
        <div>
          <label className={labelCls}>Breed / Ras</label>
          <input {...register('breed')} list="breed-list" placeholder="Ketik atau pilih..."
            className={fieldCls} />
          <datalist id="breed-list">
            {BREED_SUGGESTIONS.map(b => <option key={b} value={b} />)}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>Komposisi Breed</label>
          <input {...register('breed_composition')} placeholder="e.g. 50% Limousin, 50% PO"
            className={fieldCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Generasi</label>
            <select {...register('generation')} className={fieldCls + ' appearance-none'}>
              <option value="">-- Pilih --</option>
              <option value="murni">Murni</option>
              <option value="F1">F1</option>
              <option value="F2">F2</option>
              <option value="F3">F3</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Asal</label>
            <select {...register('origin')} className={fieldCls + ' appearance-none'}>
              <option value="">-- Pilih --</option>
              <option value="lokal">Lokal</option>
              <option value="impor">Impor</option>
              <option value="hasil_ib">Hasil IB</option>
            </select>
          </div>
        </div>

        {/* Pedigree */}
        {animals.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Induk (Ibu)</label>
              <select {...register('dam_id')} className={fieldCls + ' appearance-none'}>
                <option value="">-- Pilih --</option>
                {inducans.map(a => <option key={a.id} value={a.id}>{a.ear_tag}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Pejantan (Bapak)</label>
              <select {...register('sire_id')} className={fieldCls + ' appearance-none'}>
                <option value="">-- Pilih --</option>
                {pejantan.map(a => <option key={a.id} value={a.id}>{a.ear_tag}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Kelahiran */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tgl Lahir</label>
            <input {...register('birth_date')} type="date" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Bobot Lahir (kg)</label>
            <input {...register('birth_weight_kg')} type="number" step="0.1"
              placeholder="32.0" className={fieldCls} />
          </div>
        </div>

        {/* Tujuan & status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tujuan Pemeliharaan</label>
            <select {...register('purpose')} className={fieldCls + ' appearance-none'}>
              <option value="">-- Pilih --</option>
              <option value="indukan">Indukan</option>
              <option value="pejantan">Pejantan</option>
              <option value="calon_bibit">Calon Bibit</option>
              <option value="afkir">Afkir</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Kelas Seleksi</label>
            <select {...register('selection_class')} className={fieldCls + ' appearance-none'}>
              <option value="">-- Pilih --</option>
              <option value="elite">Elite</option>
              <option value="grade_a">Grade A</option>
              <option value="grade_b">Grade B</option>
              <option value="afkir">Afkir</option>
            </select>
          </div>
        </div>

        {sex === 'betina' && (
          <div>
            <label className={labelCls}>Parity (Jumlah Kebuntingan Sebelumnya)</label>
            <input {...register('parity')} type="number" min="0" placeholder="0 (dara)"
              className={fieldCls} />
          </div>
        )}

        {/* Asal ternak */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Cara Perolehan</label>
            <select {...register('acquisition_type')} className={fieldCls + ' appearance-none'}>
              <option value="beli">Beli</option>
              <option value="lahir_sendiri">Lahir Sendiri</option>
              <option value="hibah">Hibah / Bantuan</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Asal / Sumber</label>
            <input {...register('source')} placeholder="Pasar, peternak, dinas..."
              className={fieldCls} />
          </div>
        </div>

        {acquisitionType === 'beli' && (
          <div>
            <label className={labelCls}>Harga Beli (Rp)</label>
            <input {...register('purchase_price_idr')} type="number" placeholder="15000000"
              className={fieldCls} />
          </div>
        )}

        {/* Masuk farm */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tgl Masuk *</label>
            <input {...register('entry_date', { required: true })} type="date" className={fieldCls} />
            {errors.entry_date && <p className="text-red-400 text-[11px] mt-1">Wajib</p>}
          </div>
          <div>
            <label className={labelCls}>Bobot Masuk (kg) *</label>
            <input {...register('entry_weight_kg', { required: true })} type="number" step="0.1"
              placeholder="350.0" className={fieldCls} />
            {errors.entry_weight_kg && <p className="text-red-400 text-[11px] mt-1">Wajib</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>BCS Masuk (1–5)</label>
            <input {...register('entry_bcs')} type="number" step="0.5" min="1" max="5"
              placeholder="3.0" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Kandang / Kelompok</label>
            <input {...register('kandang_name')} placeholder="Kandang Indukan A"
              className={fieldCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Catatan</label>
          <textarea {...register('notes')} rows={2} className={fieldCls + ' resize-none'}
            placeholder="Kondisi saat masuk, catatan khusus..." />
        </div>

        <button type="submit" disabled={isPending}
          className="w-full h-12 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors">
          {isPending ? 'Menyimpan...' : 'Tambah Ekor'}
        </button>
      </form>
    </motion.div>
  )
}

export default function SapiBreedingTernak() {
  const [filterPurpose, setFilterPurpose] = useState('all')
  const [search, setSearch]               = useState('')
  const [showAdd, setShowAdd]             = useState(false)

  const { data: animals = [], isLoading } = useSapiBreedingAnimals()

  const filtered = useMemo(() => {
    let list = animals
    if (filterPurpose !== 'all') list = list.filter(a => a.purpose === filterPurpose)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.ear_tag?.toLowerCase().includes(q) ||
        a.name?.toLowerCase().includes(q) ||
        a.breed?.toLowerCase().includes(q)
      )
    }
    return list
  }, [animals, filterPurpose, search])

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">
      <header className="px-4 pt-6 pb-4 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <h1 className="font-['Sora'] font-black text-xl text-white mb-0.5">Data Ternak</h1>
          <p className="text-xs text-[#4B6478]">{animals.length} ekor terdaftar</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-600 rounded-xl text-white text-xs font-extrabold font-['Sora']"
        >
          <Plus size={13} /> Tambah
        </motion.button>
      </header>

      {/* Search */}
      <div className="px-4 mt-4">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B6478]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari ear tag, nama, breed..."
            className="w-full pl-9 pr-4 h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-amber-500/40" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 mt-3 overflow-x-auto scrollbar-none">
        {[['all','Semua'],['indukan','Indukan'],['pejantan','Pejantan'],['calon_bibit','Calon Bibit'],['afkir','Afkir']].map(([k,l]) => (
          <button key={k} onClick={() => setFilterPurpose(k)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterPurpose === k ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-[#4B6478]'
            }`}>
            {l}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
            <p className="text-3xl mb-3">🐄</p>
            <p className="text-sm font-semibold text-white mb-1">
              {animals.length === 0 ? 'Belum ada ternak' : 'Tidak ada hasil'}
            </p>
            <p className="text-xs text-[#4B6478]">
              {animals.length === 0 ? 'Tap tombol Tambah untuk mendaftarkan ekor pertama' : 'Coba ubah filter atau pencarian'}
            </p>
          </div>
        ) : (
          filtered.map(a => <AnimalCard key={a.id} animal={a} />)
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowAdd(false)} />
            <AddAnimalSheet animals={animals} onClose={() => setShowAdd(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
