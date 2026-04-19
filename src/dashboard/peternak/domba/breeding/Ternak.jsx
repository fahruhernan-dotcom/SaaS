import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Tag, X, ChevronDown, Scale } from 'lucide-react'
import {
  useDombaBreedingAnimals,
  useAddDombaBreedingAnimal,
  useAddDombaBreedingWeight,
  calcAgeInDays,
} from '@/lib/hooks/useDombaBreedingData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'

const STATUS_LABEL = { aktif: 'Aktif', afkir: 'Afkir', mati: 'Mati', terjual: 'Terjual' }
const STATUS_COLOR = {
  aktif:   'bg-green-500/20 text-green-300',
  afkir:   'bg-amber-500/20 text-amber-300',
  mati:    'bg-red-500/20 text-red-300',
  terjual: 'bg-slate-500/20 text-slate-300',
}
const SEX_LABEL  = { jantan: 'Jantan', betina: 'Betina', kastrasi: 'Kastrasi' }
const SPECIES_LABEL = { kambing: 'Kambing', domba: 'Domba' }
const PURPOSE_LABEL = {
  pejantan_unggul: 'Pejantan Unggul',
  indukan:         'Indukan',
  calon_bibit:     'Calon Bibit',
  afkir:           'Afkir',
}

function AnimalCard({ animal, onTimbang }) {
  const ageDays = animal.birth_date ? calcAgeInDays(animal.birth_date) : null
  const ageText = ageDays != null
    ? ageDays < 365
      ? `${ageDays} hari`
      : `${(ageDays / 365).toFixed(1)} th`
    : null

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-['Sora'] font-bold text-sm text-white">{animal.ear_tag}</span>
            {animal.name && <span className="text-[11px] text-[#4B6478]">({animal.name})</span>}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-[#4B6478]">{SPECIES_LABEL[animal.species]}</span>
            <span className="text-[10px] text-[#4B6478]">·</span>
            <span className="text-[10px] text-[#4B6478]">{SEX_LABEL[animal.sex]}</span>
            {animal.breed && <>
              <span className="text-[10px] text-[#4B6478]">·</span>
              <span className="text-[10px] text-[#4B6478]">{animal.breed}</span>
            </>}
            {animal.generation && <>
              <span className="text-[10px] text-[#4B6478]">·</span>
              <span className="text-[10px] text-teal-400">{animal.generation}</span>
            </>}
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLOR[animal.status]}`}>
          {STATUS_LABEL[animal.status]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/[0.04]">
        <div>
          <p className="text-[10px] text-[#4B6478]">Bobot</p>
          <p className="text-xs font-bold text-white">
            {animal.latest_weight_kg ? `${animal.latest_weight_kg} kg` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#4B6478]">BCS</p>
          <p className="text-xs font-bold text-white">{animal.latest_bcs ?? '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#4B6478]">Umur</p>
          <p className="text-xs font-bold text-white">{ageText ?? '—'}</p>
        </div>
      </div>

      {/* Pedigree summary */}
      {(animal.dam || animal.sire) && (
        <div className="mt-2 pt-2 border-t border-white/[0.04] flex gap-4">
          {animal.dam && (
            <div>
              <p className="text-[10px] text-[#4B6478]">Induk (Dam)</p>
              <p className="text-[11px] text-white">{animal.dam.ear_tag}</p>
            </div>
          )}
          {animal.sire && (
            <div>
              <p className="text-[10px] text-[#4B6478]">Pejantan (Sire)</p>
              <p className="text-[11px] text-white">{animal.sire.ear_tag}</p>
            </div>
          )}
        </div>
      )}

      {animal.purpose && (
        <div className="mt-2">
          <span className="text-[10px] bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-full">
            {PURPOSE_LABEL[animal.purpose] ?? animal.purpose}
          </span>
        </div>
      )}

      {animal.status === 'aktif' && (
        <button
          onClick={() => onTimbang(animal)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-teal-300 border border-teal-500/30 rounded-xl py-2 active:bg-teal-500/10"
        >
          <Scale size={12} /> Catat Timbangan
        </button>
      )}
    </div>
  )
}

function AddAnimalSheet({ open, onClose, animals }) {
  const addAnimal = useAddDombaBreedingAnimal()
  const [form, setForm] = useState({
    ear_tag: '', name: '', species: 'kambing', sex: 'betina',
    birth_date: '', birth_weight_kg: '', birth_type: 'tunggal',
    dam_id: '', sire_id: '',
    breed: '', breed_composition: '', generation: '', origin: 'lokal',
    purpose: 'indukan', selection_class: 'grade_a',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    if (!form.ear_tag || !form.sex || !form.species) return
    const payload = { ...form }
    if (!payload.birth_date) delete payload.birth_date
    if (!payload.birth_weight_kg) delete payload.birth_weight_kg
    else payload.birth_weight_kg = parseFloat(payload.birth_weight_kg)
    if (!payload.dam_id) delete payload.dam_id
    if (!payload.sire_id) delete payload.sire_id
    if (!payload.name) delete payload.name
    addAnimal.mutate(payload, { onSuccess: onClose })
  }

  const females = animals.filter(a => a.sex === 'betina' && a.status === 'aktif')
  const males   = animals.filter(a => a.sex === 'jantan' && a.status === 'aktif')

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto bg-[#0F1923] rounded-t-3xl p-5 pb-10 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-['Sora'] font-bold text-base text-white">Tambah Ternak</h3>
          <button onClick={onClose}><X size={20} className="text-[#4B6478]" /></button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Species & Sex */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Spesies *</label>
              <select value={form.species} onChange={e => set('species', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                <option value="kambing">Kambing</option>
                <option value="domba">Domba</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Jenis Kelamin *</label>
              <select value={form.sex} onChange={e => set('sex', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                <option value="betina">Betina</option>
                <option value="jantan">Jantan</option>
                <option value="kastrasi">Kastrasi</option>
              </select>
            </div>
          </div>

          {/* ID & Name */}
          {[
            { label: 'ID Ear Tag *', key: 'ear_tag', placeholder: 'KMB-2026-0001' },
            { label: 'Nama Panggilan', key: 'name', placeholder: 'Opsional' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[11px] text-[#4B6478] mb-1 block">{f.label}</label>
              <input value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
            </div>
          ))}

          {/* Birth */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Tanggal Lahir</label>
              <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Berat Lahir (kg)</label>
              <input type="number" step="0.1" value={form.birth_weight_kg} onChange={e => set('birth_weight_kg', e.target.value)}
                placeholder="3.2"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Tipe Kelahiran</label>
            <select value={form.birth_type} onChange={e => set('birth_type', e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
              <option value="tunggal">Tunggal</option>
              <option value="kembar2">Kembar 2</option>
              <option value="kembar3plus">Kembar 3+</option>
            </select>
          </div>

          {/* Pedigree */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Induk (Dam)</label>
              <select value={form.dam_id} onChange={e => set('dam_id', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                <option value="">— Pilih —</option>
                {females.map(a => <option key={a.id} value={a.id}>{a.ear_tag}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Pejantan (Sire)</label>
              <select value={form.sire_id} onChange={e => set('sire_id', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                <option value="">— Pilih —</option>
                {males.map(a => <option key={a.id} value={a.id}>{a.ear_tag}</option>)}
              </select>
            </div>
          </div>

          {/* Genetics */}
          {[
            { label: 'Ras / Breed', key: 'breed', placeholder: 'Boer, Kacang, PE, dll.' },
            { label: 'Komposisi Silang', key: 'breed_composition', placeholder: '50% Boer / 50% Kacang' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[11px] text-[#4B6478] mb-1 block">{f.label}</label>
              <input value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Generasi</label>
              <select value={form.generation} onChange={e => set('generation', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                <option value="">— Pilih —</option>
                {['F1','F2','F3','Murni'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Asal Ternak</label>
              <select value={form.origin} onChange={e => set('origin', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                <option value="lokal">Lokal</option>
                <option value="impor">Impor</option>
                <option value="hasil_ib">Hasil IB</option>
              </select>
            </div>
          </div>

          {/* Classification */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Tujuan Ternak</label>
              <select value={form.purpose} onChange={e => set('purpose', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                <option value="indukan">Indukan</option>
                <option value="pejantan_unggul">Pejantan Unggul</option>
                <option value="calon_bibit">Calon Bibit</option>
                <option value="afkir">Afkir</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Kelas Seleksi</label>
              <select value={form.selection_class} onChange={e => set('selection_class', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                <option value="elite">Elite</option>
                <option value="grade_a">Grade A</option>
                <option value="grade_b">Grade B</option>
                <option value="afkir">Afkir</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!form.ear_tag || addAnimal.isPending}
            className="mt-2 w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm"
          >
            {addAnimal.isPending ? 'Menyimpan—¦' : 'Simpan Ternak'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TimbangSheet({ animal, onClose }) {
  const addWeight = useAddDombaBreedingWeight()
  const [form, setForm] = useState({
    weigh_date: new Date().toISOString().slice(0, 10),
    weight_kg: '',
    bcs: '',
    notes: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    if (!form.weight_kg) return
    addWeight.mutate({
      animal_id: animal.id,
      weigh_date: form.weigh_date,
      weight_kg: parseFloat(form.weight_kg),
      bcs: form.bcs ? parseFloat(form.bcs) : null,
      notes: form.notes || null,
    }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto bg-[#0F1923] rounded-t-3xl p-5 pb-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-['Sora'] font-bold text-base text-white">Catat Timbangan</h3>
            <p className="text-[11px] text-[#4B6478]">{animal.ear_tag} {animal.name ? `(${animal.name})` : ''}</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-[#4B6478]" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Tanggal *</label>
              <input type="date" value={form.weigh_date} onChange={e => set('weigh_date', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Bobot (kg) *</label>
              <input type="number" step="0.1" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)}
                placeholder="0.0"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">BCS (1–5)</label>
            <select value={form.bcs} onChange={e => set('bcs', e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
              <option value="">— Pilih —</option>
              {['1','1.5','2','2.5','3','3.5','4','4.5','5'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Catatan</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Opsional"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
          </div>
          {animal.latest_weight_kg && (
            <p className="text-[11px] text-[#4B6478]">
              Bobot sebelumnya: <span className="text-white font-bold">{animal.latest_weight_kg} kg</span>
              {animal.latest_weight_date && ` (${animal.latest_weight_date})`}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!form.weight_kg || addWeight.isPending}
            className="mt-2 w-full bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm"
          >
            {addWeight.isPending ? 'Menyimpan—¦' : 'Simpan Timbangan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BreedingTernak() {
  const { data: animals = [], isLoading } = useDombaBreedingAnimals()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('aktif')
  const [showAdd, setShowAdd] = useState(false)
  const [timbangAnimal, setTimbangAnimal] = useState(null)

  const filtered = useMemo(() => {
    let list = animals
    if (filter !== 'semua') list = list.filter(a => a.status === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.ear_tag.toLowerCase().includes(q) ||
        (a.name ?? '').toLowerCase().includes(q) ||
        (a.breed ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [animals, filter, search])

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Sora'] font-bold text-xl text-white">Data Ternak</h1>
          <p className="text-[11px] text-[#4B6478]">{animals.filter(a => a.status === 'aktif').length} ekor aktif</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-teal-500 text-white text-xs font-bold px-3 py-2 rounded-xl">
          <Plus size={14} /> Tambah
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari ear tag atau nama—¦"
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['aktif','afkir','mati','terjual','semua'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
              filter === s
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                : 'border-white/[0.08] text-[#4B6478]'
            }`}>
            {s === 'semua' ? 'Semua' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Tag size={32} className="text-[#4B6478]" />
          <p className="text-sm font-bold text-[#F1F5F9]">Tidak ada ternak</p>
          {filter !== 'semua' && <p className="text-xs text-[#4B6478]">Coba ubah filter</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(a => (
            <AnimalCard key={a.id} animal={a} onTimbang={setTimbangAnimal} />
          ))}
        </div>
      )}

      <AddAnimalSheet open={showAdd} onClose={() => setShowAdd(false)} animals={animals} />
      {timbangAnimal && <TimbangSheet animal={timbangAnimal} onClose={() => setTimbangAnimal(null)} />}
    </div>
  )
}