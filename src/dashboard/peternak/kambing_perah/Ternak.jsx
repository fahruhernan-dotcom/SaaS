import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Tags, Filter, 
  ChevronRight, Calendar, Activity, Milk 
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  useKambingPerahAnimals,
  useAddKambingBreedingAnimal 
} from '@/lib/hooks/useKambingPerahData'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'

const STATUS_MAP = {
  laktasi:  { label: 'Laktasi',  cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  kering:   { label: 'Kering',   cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  bunting:  { label: 'Bunting',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  dara:     { label: 'Dara',     cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  cempe:    { label: 'Cempe',    cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

export default function KambingPerahTernak() {
  const { tenant } = useAuth()
  
  // Queries
  const { data: animals = [], isLoading } = useKambingPerahAnimals()
  const addAnimal = useAddKambingBreedingAnimal()

  // State
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [addSheet, setAddSheet] = useState(false)
  
  const [form, setForm] = useState({
    ear_tag: '',
    name: '',
    breed: 'Saanen',
    sex: 'betina',
    status: 'dara',
    entry_date: new Date().toISOString().split('T')[0],
    entry_weight_kg: ''
  })

  // Filtering
  const filtered = useMemo(() => {
    return animals.filter(a => {
      const matchSearch = a.ear_tag.toLowerCase().includes(search.toLowerCase()) || 
                          (a.name ?? '').toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'all' || a.status === filter
      return matchSearch && matchFilter
    })
  }, [animals, search, filter])

  const handleAdd = () => {
    if (!form.ear_tag || !form.entry_weight_kg) return
    addAnimal.mutate({
      ...form,
      tenant_id: tenant.id,
      entry_weight_kg: parseFloat(form.entry_weight_kg)
    }, {
      onSuccess: () => {
        setAddSheet(false)
        setForm({ ear_tag: '', name: '', breed: 'Saanen', sex: 'betina', status: 'dara', entry_date: new Date().toISOString().split('T')[0], entry_weight_kg: '' })
      }
    })
  }

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24 min-h-screen bg-[#06090F]">
      
      {/* Header */}
      <header className="px-6 pt-10 pb-6 bg-[#0C1319] border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black font-['Sora'] text-white">Data Ternak</h1>
            <p className="text-xs text-[#4B6478]">{animals.length} ekor total</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setAddSheet(true)}
            className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-900/40"
          >
            <Plus size={20} />
          </motion.button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', ...Object.keys(STATUS_MAP)].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                filter === s 
                  ? 'bg-white text-black border-white' 
                  : 'bg-white/[0.03] border-white/[0.06] text-[#4B6478]'
              }`}
            >
              {s === 'all' ? 'Semua' : (STATUS_MAP[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </header>

      {/* Search */}
      <div className="px-4 mt-6">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari Ear Tag / Nama..."
            className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40"
          />
        </div>
      </div>

      {/* Animal List */}
      <div className="px-4 mt-8 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
            <Tags size={40} className="mx-auto text-[#4B6478] mb-4 opacity-20" />
            <p className="text-sm font-bold text-[#4B6478]">Belum ada data ternak</p>
          </div>
        ) : (
          filtered.map(animal => {
            const status = STATUS_MAP[animal.status] ?? { label: animal.status, cls: 'bg-white/5 text-white' }
            return (
              <motion.div
                key={animal.id}
                whileTap={{ scale: 0.98 }}
                className="bg-[#0F171F]/50 border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center relative shadow-inner">
                    <span className="text-xl">🐐</span>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#090E14]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-black text-white font-['Sora']">{animal.ear_tag}</p>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter border ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#4B6478] font-bold">
                      {animal.breed} · {animal.name ?? 'Tanpa Nama'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-white">{animal.latest_weight_kg ?? animal.entry_weight_kg} kg</p>
                  {animal.status === 'laktasi' && (
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <Milk size={10} className="text-green-400" />
                      <span className="text-[9px] font-black text-green-400 uppercase tracking-tighter">DI PERAH</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Add Sheet */}
      <Sheet open={addSheet} onOpenChange={setAddSheet}>
        <SheetContent side="bottom" className="bg-[#0C1319] border-t border-white/10 rounded-t-[2.5rem] px-6 pt-8 pb-10">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-xl font-black font-['Sora'] text-white">Tambah Ternak Baru</SheetTitle>
            <p className="text-xs text-[#4B6478] mt-1">Registrasi kambing perah ke dalam sistem.</p>
          </SheetHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#4B6478] uppercase mb-1.5 block tracking-widest px-1">Ear Tag *</label>
                <input 
                  value={form.ear_tag}
                  onChange={e => setForm(p => ({ ...p, ear_tag: e.target.value }))}
                  placeholder="K-001"
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-green-500/40"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#4B6478] uppercase mb-1.5 block tracking-widest px-1">Nama</label>
                <input 
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Molly"
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-green-500/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#4B6478] uppercase mb-1.5 block tracking-widest px-1">Ras</label>
                <select 
                  value={form.breed}
                  onChange={e => setForm(p => ({ ...p, breed: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none"
                >
                  <option value="Saanen">Saanen</option>
                  <option value="Sapera">Sapera</option>
                  <option value="PE">PE (Etawa)</option>
                  <option value="Anglo Nubian">Anglo Nubian</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#4B6478] uppercase mb-1.5 block tracking-widest px-1">Status</label>
                <select 
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none"
                >
                  {Object.entries(STATUS_MAP).map(([val, { label }]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#4B6478] uppercase mb-1.5 block tracking-widest px-1">Bobot Masuk (kg)</label>
              <input 
                type="number" step="0.1"
                value={form.entry_weight_kg}
                onChange={e => setForm(p => ({ ...p, entry_weight_kg: e.target.value }))}
                placeholder="25.0"
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={!form.ear_tag || !form.entry_weight_kg || addAnimal.isPending}
              onClick={handleAdd}
              className="w-full py-4 bg-green-600 rounded-2xl text-white font-black font-['Sora'] shadow-xl shadow-green-900/20 mt-4"
            >
              {addAnimal.isPending ? 'Mendaftarkan...' : 'Simpan Ternak'}
            </motion.button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}
