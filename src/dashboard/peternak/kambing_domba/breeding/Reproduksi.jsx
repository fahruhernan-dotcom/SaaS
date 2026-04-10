import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, Heart, Baby, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import {
  useKdBreedingMatings,
  useKdBreedingBirths,
  useKdBreedingAnimals,
  useAddKdBreedingMating,
  useUpdateKdBreedingMating,
  useAddKdBreedingBirth,
} from '@/lib/hooks/useKdBreedingData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'

const STATUS_CONFIG = {
  menunggu:    { label: 'Menunggu',    color: 'bg-slate-500/20 text-slate-300',  icon: Clock },
  bunting:     { label: 'Bunting',     color: 'bg-teal-500/20 text-teal-300',    icon: Heart },
  gagal:       { label: 'Gagal',       color: 'bg-red-500/20 text-red-300',      icon: AlertCircle },
  melahirkan:  { label: 'Melahirkan',  color: 'bg-green-500/20 text-green-300',  icon: CheckCircle2 },
}

function MatingCard({ mating, onConfirmPreg, onRecordBirth }) {
  const cfg = STATUS_CONFIG[mating.status] ?? STATUS_CONFIG.menunggu
  const Icon = cfg.icon
  const estDate = mating.est_partus_date
    ? new Date(mating.est_partus_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  const daysToPartus = mating.est_partus_date
    ? Math.ceil((new Date(mating.est_partus_date) - new Date()) / 86400000)
    : null

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-bold text-white">
            {mating.dam?.ear_tag}
            {mating.dam?.name ? ` (${mating.dam.name})` : ''}
          </p>
          <p className="text-[11px] text-[#4B6478]">
            × {mating.sire ? mating.sire.ear_tag : (mating.semen_code ? `IB: ${mating.semen_code}` : 'IB')}
          </p>
        </div>
        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${cfg.color}`}>
          <Icon size={10} /> {cfg.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/[0.04]">
        <div>
          <p className="text-[10px] text-[#4B6478]">Tgl Kawin</p>
          <p className="text-xs font-bold text-white">
            {new Date(mating.mating_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[#4B6478]">Metode</p>
          <p className="text-xs font-bold text-white uppercase">{mating.method}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#4B6478]">Est. Partus</p>
          <p className={`text-xs font-bold ${daysToPartus != null && daysToPartus < 0 ? 'text-red-400' : 'text-white'}`}>
            {estDate ?? '—'}
          </p>
        </div>
      </div>

      {mating.fetus_count && (
        <p className="text-[11px] text-teal-300 mt-2">USG: {mating.fetus_count} fetus</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        {mating.status === 'menunggu' && (
          <button
            onClick={() => onConfirmPreg(mating)}
            className="flex-1 text-xs text-teal-300 border border-teal-500/30 rounded-xl py-2 active:bg-teal-500/10"
          >
            Konfirmasi Bunting
          </button>
        )}
        {mating.status === 'bunting' && (
          <button
            onClick={() => onRecordBirth(mating)}
            className="flex-1 text-xs text-green-300 border border-green-500/30 rounded-xl py-2 active:bg-green-500/10"
          >
            <Baby size={12} className="inline mr-1" /> Catat Kelahiran
          </button>
        )}
      </div>
    </div>
  )
}

function BirthCard({ birth }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-bold text-white">{birth.dam?.ear_tag}</p>
          <p className="text-[11px] text-[#4B6478]">
            {new Date(birth.partus_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full font-bold">
          {birth.birth_type === 'kembar2' ? 'Kembar 2' : birth.birth_type === 'kembar3plus' ? 'Kembar 3+' : 'Tunggal'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.04]">
        <div>
          <p className="text-[10px] text-[#4B6478]">Total Lahir</p>
          <p className="text-sm font-bold text-white">{birth.total_born}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#4B6478]">Lahir Hidup</p>
          <p className="text-sm font-bold text-green-400">{birth.total_born_alive}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#4B6478]">Lahir Mati</p>
          <p className="text-sm font-bold text-red-400">{birth.total_born_dead ?? birth.total_born - birth.total_born_alive}</p>
        </div>
      </div>
    </div>
  )
}

function AddMatingSheet({ open, onClose, animals }) {
  const addMating = useAddKdBreedingMating()
  const [form, setForm] = useState({
    dam_id: '', sire_id: '', method: 'alami', semen_code: '',
    estrus_date: '', mating_date: new Date().toISOString().slice(0, 10),
    notes: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const females = animals.filter(a => a.sex === 'betina' && a.status === 'aktif')
  const males   = animals.filter(a => a.sex === 'jantan' && a.status === 'aktif')

  const handleSubmit = () => {
    if (!form.dam_id || !form.mating_date) return
    const payload = { ...form }
    if (!payload.sire_id) delete payload.sire_id
    if (!payload.semen_code) delete payload.semen_code
    if (!payload.estrus_date) delete payload.estrus_date
    if (!payload.notes) delete payload.notes
    addMating.mutate(payload, { onSuccess: onClose })
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto bg-[#0F1923] rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-['Sora'] font-bold text-base text-white">Catat Perkawinan</h3>
          <button onClick={onClose}><X size={20} className="text-[#4B6478]" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Indukan (Dam) *</label>
            <select value={form.dam_id} onChange={e => set('dam_id', e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
              <option value="">— Pilih Indukan —</option>
              {females.map(a => <option key={a.id} value={a.id}>{a.ear_tag}{a.name ? ` (${a.name})` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Metode Kawin *</label>
            <div className="flex gap-2">
              {['alami','ib'].map(m => (
                <button key={m} onClick={() => set('method', m)}
                  className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-colors ${
                    form.method === m
                      ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                      : 'border-white/[0.08] text-[#4B6478]'
                  }`}>
                  {m === 'alami' ? 'Alami' : 'IB'}
                </button>
              ))}
            </div>
          </div>

          {form.method === 'alami' ? (
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Pejantan (Sire)</label>
              <select value={form.sire_id} onChange={e => set('sire_id', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                <option value="">— Pilih Pejantan —</option>
                {males.map(a => <option key={a.id} value={a.id}>{a.ear_tag}{a.name ? ` (${a.name})` : ''}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Kode Semen (IB)</label>
              <input value={form.semen_code} onChange={e => set('semen_code', e.target.value)}
                placeholder="Kode batch semen beku"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Tgl Birahi</label>
              <input type="date" value={form.estrus_date} onChange={e => set('estrus_date', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Tgl Kawin *</label>
              <input type="date" value={form.mating_date} onChange={e => set('mating_date', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Catatan</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Opsional"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
          </div>

          <button onClick={handleSubmit} disabled={!form.dam_id || !form.mating_date || addMating.isPending}
            className="mt-2 w-full bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm">
            {addMating.isPending ? 'Menyimpan…' : 'Simpan Perkawinan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmPregSheet({ mating, onClose }) {
  const updateMating = useUpdateKdBreedingMating()
  const [form, setForm] = useState({
    pregnancy_confirm_date: new Date().toISOString().slice(0, 10),
    pregnancy_method: 'usg',
    fetus_count: '',
    notes: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    updateMating.mutate({
      id: mating.id,
      status: 'bunting',
      pregnancy_confirmed: true,
      pregnancy_confirm_date: form.pregnancy_confirm_date,
      pregnancy_method: form.pregnancy_method,
      fetus_count: form.fetus_count ? parseInt(form.fetus_count) : null,
      notes: form.notes || null,
    }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto bg-[#0F1923] rounded-t-3xl p-5 pb-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-['Sora'] font-bold text-base text-white">Konfirmasi Bunting</h3>
            <p className="text-[11px] text-[#4B6478]">{mating.dam?.ear_tag}</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-[#4B6478]" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Tgl Konfirmasi</label>
              <input type="date" value={form.pregnancy_confirm_date} onChange={e => set('pregnancy_confirm_date', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Metode</label>
              <select value={form.pregnancy_method} onChange={e => set('pregnancy_method', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                <option value="usg">USG</option>
                <option value="palpasi">Palpasi</option>
                <option value="visual">Visual</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Jumlah Fetus (USG)</label>
            <input type="number" value={form.fetus_count} onChange={e => set('fetus_count', e.target.value)}
              placeholder="1, 2, dst."
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
          </div>
          <button onClick={handleSubmit} disabled={updateMating.isPending}
            className="w-full bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm">
            {updateMating.isPending ? 'Menyimpan…' : 'Konfirmasi Bunting'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RecordBirthSheet({ mating, onClose }) {
  const addBirth = useAddKdBreedingBirth()
  const [form, setForm] = useState({
    partus_date: new Date().toISOString().slice(0, 10),
    birth_type: 'tunggal',
    total_born: '1',
    total_born_alive: '1',
    assisted: false,
    colostrum_given: true,
    placenta_expelled: true,
    dam_condition: 'normal',
    notes: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    addBirth.mutate({
      mating_record_id: mating.id,
      dam_id: mating.dam_id,
      partus_date: form.partus_date,
      birth_type: form.birth_type,
      total_born: parseInt(form.total_born),
      total_born_alive: parseInt(form.total_born_alive),
      assisted: form.assisted,
      colostrum_given: form.colostrum_given,
      placenta_expelled: form.placenta_expelled,
      dam_condition: form.dam_condition || null,
      notes: form.notes || null,
    }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto bg-[#0F1923] rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-['Sora'] font-bold text-base text-white">Catat Kelahiran</h3>
            <p className="text-[11px] text-[#4B6478]">Indukan: {mating.dam?.ear_tag}</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-[#4B6478]" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Tanggal Partus</label>
              <input type="date" value={form.partus_date} onChange={e => set('partus_date', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white" />
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
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Total Lahir</label>
              <input type="number" min="1" value={form.total_born} onChange={e => set('total_born', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Lahir Hidup</label>
              <input type="number" min="0" value={form.total_born_alive} onChange={e => set('total_born_alive', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
          </div>

          {/* Checklist */}
          <div className="flex flex-col gap-2">
            {[
              { key: 'assisted',          label: 'Dibantu saat partus' },
              { key: 'colostrum_given',   label: 'Kolostrum sudah diberikan' },
              { key: 'placenta_expelled', label: 'Plasenta sudah keluar (≤6 jam)' },
            ].map(f => (
              <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[f.key]} onChange={e => set(f.key, e.target.checked)}
                  className="accent-teal-500 w-4 h-4" />
                <span className="text-sm text-[#F1F5F9]">{f.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Kondisi Induk Post-Partus</label>
            <select value={form.dam_condition} onChange={e => set('dam_condition', e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
              <option value="normal">Normal</option>
              <option value="mastitis">Mastitis</option>
              <option value="agalaktia">Agalaktia</option>
              <option value="lemah">Lemah</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Catatan</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Opsional"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
          </div>

          <button onClick={handleSubmit} disabled={addBirth.isPending}
            className="mt-2 w-full bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm">
            {addBirth.isPending ? 'Menyimpan…' : 'Simpan Kelahiran'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BreedingReproduksi() {
  const { data: matings = [], isLoading: loadM } = useKdBreedingMatings()
  const { data: births  = [], isLoading: loadB } = useKdBreedingBirths()
  const { data: animals = [] } = useKdBreedingAnimals()
  const [tab, setTab]             = useState('perkawinan')
  const [showAdd, setShowAdd]     = useState(false)
  const [confirmMating, setConfirmMating] = useState(null)
  const [birthMating, setBirthMating]     = useState(null)

  const isLoading = loadM || loadB

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Sora'] font-bold text-xl text-white">Reproduksi</h1>
          <p className="text-[11px] text-[#4B6478]">{matings.length} perkawinan · {births.length} kelahiran</p>
        </div>
        {tab === 'perkawinan' && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-teal-500 text-white text-xs font-bold px-3 py-2 rounded-xl">
            <Plus size={14} /> Kawin
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['perkawinan','kelahiran'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-colors capitalize ${
              tab === t
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                : 'border-white/[0.08] text-[#4B6478]'
            }`}>
            {t === 'perkawinan' ? 'Perkawinan' : 'Kelahiran'}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'perkawinan' ? (
        matings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Heart size={32} className="text-[#4B6478]" />
            <p className="text-sm font-bold text-[#F1F5F9]">Belum ada perkawinan</p>
            <p className="text-xs text-[#4B6478]">Tap tombol + untuk mencatat perkawinan pertama</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {matings.map(m => (
              <MatingCard key={m.id} mating={m}
                onConfirmPreg={setConfirmMating}
                onRecordBirth={setBirthMating} />
            ))}
          </div>
        )
      ) : (
        births.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Baby size={32} className="text-[#4B6478]" />
            <p className="text-sm font-bold text-[#F1F5F9]">Belum ada kelahiran dicatat</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {births.map(b => <BirthCard key={b.id} birth={b} />)}
          </div>
        )
      )}

      <AddMatingSheet open={showAdd} onClose={() => setShowAdd(false)} animals={animals} />
      {confirmMating && <ConfirmPregSheet mating={confirmMating} onClose={() => setConfirmMating(null)} />}
      {birthMating   && <RecordBirthSheet mating={birthMating}   onClose={() => setBirthMating(null)} />}
    </div>
  )
}
