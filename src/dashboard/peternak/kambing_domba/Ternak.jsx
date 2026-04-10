import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, Scale, ShoppingCart, ChevronDown } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useKdBatches, useKdAnimals,
  useAddKdAnimal, useAddKdWeightRecord,
  calcHariDiFarm, calcADGFromRecords,
} from '@/lib/hooks/useKdPenggemukanData'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'

const STATUS_CFG = {
  active: { label: 'Aktif',    cls: 'text-green-400 bg-green-500/20 border-green-500/30' },
  sold:   { label: 'Terjual',  cls: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  dead:   { label: 'Mati',     cls: 'text-red-400 bg-red-500/20 border-red-500/30' },
  culled: { label: 'Afkir',    cls: 'text-slate-400 bg-white/10 border-white/15' },
}

const SPECIES_LABEL = { kambing: '🐐 Kambing', domba: '🐑 Domba' }

function AnimalCard({ animal, onTimbang }) {
  const hari = calcHariDiFarm(animal.entry_date, animal.exit_date)
  const adg = calcADGFromRecords(
    animal.kd_penggemukan_weight_records ?? [],
    animal.entry_date,
    animal.entry_weight_kg
  )
  const latestW = animal.latest_weight_kg ?? animal.entry_weight_kg
  const gain = latestW - animal.entry_weight_kg
  const cfg = STATUS_CFG[animal.status] ?? STATUS_CFG.active

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-['Sora'] font-bold text-sm text-white">{animal.ear_tag}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${cfg.cls}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-[11px] text-[#4B6478]">
            {SPECIES_LABEL[animal.species]} · {animal.breed ?? 'Ras tidak diisi'} · {animal.sex ?? '—'}
          </p>
        </div>
        {animal.status === 'active' && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => onTimbang(animal)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-[10px] font-bold"
          >
            <Scale size={11} />
            Timbang
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/[0.04]">
        <div>
          <p className="text-[11px] font-bold text-white">{animal.entry_weight_kg} kg</p>
          <p className="text-[10px] text-[#4B6478]">Masuk</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-white">{latestW} kg</p>
          <p className="text-[10px] text-[#4B6478]">Terakhir</p>
        </div>
        <div>
          <p className={`text-[11px] font-bold ${gain > 0 ? 'text-green-400' : 'text-[#4B6478]'}`}>
            +{gain.toFixed(1)} kg
          </p>
          <p className="text-[10px] text-[#4B6478]">PBBH</p>
        </div>
        <div>
          <p className={`text-[11px] font-bold ${adg >= 150 ? 'text-green-400' : adg ? 'text-amber-400' : 'text-[#4B6478]'}`}>
            {adg ? `${adg}g` : '—'}
          </p>
          <p className="text-[10px] text-[#4B6478]">ADG</p>
        </div>
      </div>

      {animal.status === 'active' && (
        <p className="text-[10px] text-[#4B6478] mt-2">
          Hari ke-{hari} · Kandang: {animal.kandang_slot ?? '—'}
          {animal.latest_weight_date && ` · Timbang terakhir: ${animal.latest_weight_date}`}
        </p>
      )}
    </div>
  )
}

export default function KdPenggemukanTernak() {
  const [searchParams] = useSearchParams()
  const defaultBatch = searchParams.get('batch') ?? ''
  const { tenant } = useAuth()

  const { data: batches = [], isLoading: loadingBatches } = useKdBatches()
  const [selectedBatch, setSelectedBatch] = useState(defaultBatch)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')

  const { data: animals = [], isLoading: loadingAnimals } = useKdAnimals(selectedBatch)
  const addAnimal = useAddKdAnimal()
  const addWeight = useAddKdWeightRecord()

  // Sheet states
  const [addSheetOpen, setAddSheetOpen]     = useState(false)
  const [timbangSheet, setTimbangSheet]     = useState(null) // animal object

  // Add animal form
  const [form, setForm] = useState({
    ear_tag: '', species: 'kambing', breed: '', sex: 'jantan',
    age_estimate: '', entry_date: new Date().toISOString().split('T')[0],
    entry_weight_kg: '', entry_bcs: '', entry_condition: 'sehat',
    purchase_price_idr: '', source: '', kandang_slot: '',
    quarantine_start: '', quarantine_end: '',
  })

  // Timbang form
  const [tForm, setTForm] = useState({
    weigh_date: new Date().toISOString().split('T')[0],
    weight_kg: '', bcs: '', notes: '',
  })

  const filtered = useMemo(() => {
    let list = animals
    if (filterStatus !== 'all') list = list.filter(a => a.status === filterStatus)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.ear_tag.toLowerCase().includes(q) ||
        (a.breed ?? '').toLowerCase().includes(q) ||
        a.species.toLowerCase().includes(q)
      )
    }
    return list
  }, [animals, filterStatus, search])

  const activeBatch = batches.find(b => b.id === selectedBatch)

  function handleAddAnimal() {
    if (!form.ear_tag || !form.entry_weight_kg || !selectedBatch) return
    addAnimal.mutate({
      ...form,
      batch_id: selectedBatch,
      entry_weight_kg: parseFloat(form.entry_weight_kg),
      entry_bcs: form.entry_bcs ? parseFloat(form.entry_bcs) : null,
      purchase_price_idr: form.purchase_price_idr ? parseInt(form.purchase_price_idr) : null,
    }, {
      onSuccess: () => {
        setAddSheetOpen(false)
        setForm({ ear_tag: '', species: 'kambing', breed: '', sex: 'jantan', age_estimate: '', entry_date: new Date().toISOString().split('T')[0], entry_weight_kg: '', entry_bcs: '', entry_condition: 'sehat', purchase_price_idr: '', source: '', kandang_slot: '', quarantine_start: '', quarantine_end: '' })
      }
    })
  }

  function handleTimbang() {
    if (!timbangSheet || !tForm.weight_kg) return
    addWeight.mutate({
      animal_id: timbangSheet.id,
      batch_id: timbangSheet.batch_id,
      entry_date: timbangSheet.entry_date,
      entry_weight_kg: timbangSheet.entry_weight_kg,
      weigh_date: tForm.weigh_date,
      weight_kg: parseFloat(tForm.weight_kg),
      bcs: tForm.bcs ? parseFloat(tForm.bcs) : null,
      notes: tForm.notes,
    }, {
      onSuccess: () => {
        setTimbangSheet(null)
        setTForm({ weigh_date: new Date().toISOString().split('T')[0], weight_kg: '', bcs: '', notes: '' })
      }
    })
  }

  if (loadingBatches) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">

      {/* Header */}
      <header className="px-4 pt-6 pb-4 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <h1 className="font-['Sora'] font-black text-xl text-white mb-0.5">Data Ternak</h1>
          <p className="text-xs text-[#4B6478]">{animals.length} ekor total · {animals.filter(a => a.status === 'active').length} aktif</p>
        </div>
        {selectedBatch && activeBatch?.status === 'active' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setAddSheetOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-green-600 rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-[0_3px_12px_rgba(22,163,74,0.35)]"
          >
            <Plus size={13} />
            Tambah Ekor
          </motion.button>
        )}
      </header>

      {/* Pilih Batch */}
      <div className="px-4 mt-4">
        <label className="text-[11px] font-semibold text-[#4B6478] mb-1.5 block">Pilih Batch</label>
        <div className="relative">
          <select
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
            className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none"
          >
            <option value="">-- Pilih batch --</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.batch_code} — {b.kandang_name} ({b.status === 'active' ? 'Aktif' : 'Selesai'})
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
        </div>
      </div>

      {selectedBatch && (
        <>
          {/* Filter & Search */}
          <div className="px-4 mt-3 flex gap-2">
            {['active','sold','dead','all'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  filterStatus === s
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'text-[#4B6478]'
                }`}
              >
                {s === 'active' ? 'Aktif' : s === 'sold' ? 'Terjual' : s === 'dead' ? 'Mati' : 'Semua'}
              </button>
            ))}
          </div>

          <div className="px-4 mt-2 relative">
            <Search size={13} className="absolute left-7 top-1/2 -translate-y-1/2 text-[#4B6478]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari ear tag / ras..."
              className="w-full pl-8 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40"
            />
          </div>

          {/* Animal List */}
          <div className="px-4 mt-4 space-y-3">
            {loadingAnimals ? (
              <LoadingSpinner />
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                <p className="text-3xl mb-3">🐐</p>
                <p className="text-sm font-semibold text-white mb-1">Belum ada ternak</p>
                <p className="text-xs text-[#4B6478]">Tambahkan ekor pertama ke batch ini</p>
              </div>
            ) : (
              filtered.map(animal => (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                  onTimbang={a => { setTimbangSheet(a); setTForm({ weigh_date: new Date().toISOString().split('T')[0], weight_kg: '', bcs: '', notes: '' }) }}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Sheet Tambah Ekor */}
      <Sheet open={addSheetOpen} onOpenChange={setAddSheetOpen}>
        <SheetContent side="bottom" className="bg-[#0C1319] border-t border-white/10 rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="font-['Sora'] font-black text-white text-lg">Tambah Ekor Baru</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-8">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Ear Tag *</label>
                <input value={form.ear_tag} onChange={e => setForm(f => ({ ...f, ear_tag: e.target.value }))}
                  placeholder="GEM-2024-0301"
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Spesies *</label>
                <select value={form.species} onChange={e => setForm(f => ({ ...f, species: e.target.value }))}
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-green-500/40">
                  <option value="kambing">🐐 Kambing</option>
                  <option value="domba">🐑 Domba</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Ras / Tipe</label>
                <input value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
                  placeholder="Boer Cross, Garut..."
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Jenis Kelamin</label>
                <select value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-green-500/40">
                  <option value="jantan">Jantan</option>
                  <option value="betina">Betina</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Bobot Masuk (kg) *</label>
                <input type="number" step="0.1" value={form.entry_weight_kg} onChange={e => setForm(f => ({ ...f, entry_weight_kg: e.target.value }))}
                  placeholder="18.5"
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Harga Beli (Rp)</label>
                <input type="number" value={form.purchase_price_idr} onChange={e => setForm(f => ({ ...f, purchase_price_idr: e.target.value }))}
                  placeholder="1450000"
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Tanggal Masuk *</label>
                <DatePicker value={form.entry_date} onChange={v => setForm(f => ({ ...f, entry_date: v }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Kondisi Masuk</label>
                <select value={form.entry_condition} onChange={e => setForm(f => ({ ...f, entry_condition: e.target.value }))}
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-green-500/40">
                  <option value="sehat">Sehat</option>
                  <option value="kurus">Kurus</option>
                  <option value="cacat">Cacat</option>
                  <option value="sakit">Sakit</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Asal Ternak</label>
                <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  placeholder="Pasar Hewan Sleman"
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Slot Kandang</label>
                <input value={form.kandang_slot} onChange={e => setForm(f => ({ ...f, kandang_slot: e.target.value }))}
                  placeholder="KDG-F2"
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Estimasi Umur</label>
              <input value={form.age_estimate} onChange={e => setForm(f => ({ ...f, age_estimate: e.target.value }))}
                placeholder="6-8 bulan"
                className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!form.ear_tag || !form.entry_weight_kg || addAnimal.isPending}
              onClick={handleAddAnimal}
              className="w-full py-3.5 bg-green-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm"
            >
              {addAnimal.isPending ? 'Menyimpan...' : 'Tambah Ekor'}
            </motion.button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet Timbang */}
      <Sheet open={!!timbangSheet} onOpenChange={v => !v && setTimbangSheet(null)}>
        <SheetContent side="bottom" className="bg-[#0C1319] border-t border-white/10 rounded-t-3xl">
          <SheetHeader className="mb-5">
            <SheetTitle className="font-['Sora'] font-black text-white text-lg">
              Timbang — {timbangSheet?.ear_tag}
            </SheetTitle>
          </SheetHeader>
          {timbangSheet && (
            <div className="space-y-4 pb-8">
              <div className="flex gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-300">
                Bobot terakhir: <span className="font-bold ml-1">{timbangSheet.latest_weight_kg ?? timbangSheet.entry_weight_kg} kg</span>
                <span className="text-[#4B6478] ml-1">({calcHariDiFarm(timbangSheet.entry_date)} hari di farm)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Bobot Sekarang (kg) *</label>
                  <input type="number" step="0.1" value={tForm.weight_kg} onChange={e => setTForm(f => ({ ...f, weight_kg: e.target.value }))}
                    placeholder="22.5"
                    className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">BCS (1–5)</label>
                  <input type="number" step="0.5" min="1" max="5" value={tForm.bcs} onChange={e => setTForm(f => ({ ...f, bcs: e.target.value }))}
                    placeholder="3.0"
                    className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Tanggal Timbang *</label>
                <DatePicker value={tForm.weigh_date} onChange={v => setTForm(f => ({ ...f, weigh_date: v }))} />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Catatan</label>
                <input value={tForm.notes} onChange={e => setTForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Menjelang jual..."
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!tForm.weight_kg || addWeight.isPending}
                onClick={handleTimbang}
                className="w-full py-3.5 bg-green-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm"
              >
                {addWeight.isPending ? 'Menyimpan...' : 'Simpan Timbangan'}
              </motion.button>
            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  )
}
