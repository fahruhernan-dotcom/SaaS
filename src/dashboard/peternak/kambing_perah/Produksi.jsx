import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Milk, Activity, 
  History, Calendar, ChevronRight, Droplets 
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  useKambingPerahAnimals,
  useKambingPerahLactatingAnimals,
  useKambingPerahMilkLogs,
  useLogKambingPerahProduction
} from '@/lib/hooks/useKambingPerahData'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'

export default function KambingPerahProduksi() {
  const { tenant } = useAuth()
  
  // Queries
  const { data: allAnimals = [], isLoading: loadingAnimals } = useKambingPerahAnimals()
  const { data: lactating = [], isLoading: loadingLaktasi } = useKambingPerahLactatingAnimals()
  const { data: recentLogs = [], isLoading: loadingLogs } = useKambingPerahMilkLogs(3) // 3 days

  // Mutations
  const logProduction = useLogKambingPerahProduction()

  // State
  const [search, setSearch] = useState('')
  const [logSheet, setLogSheet] = useState(null) // animal object
  const [form, setForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    session: 'pagi',
    yield_liters: '',
    fat_pct: '',
    notes: ''
  })

  const filtered = useMemo(() => {
    return lactating.filter(a => 
      a.ear_tag.toLowerCase().includes(search.toLowerCase()) ||
      (a.name ?? '').toLowerCase().includes(search.toLowerCase())
    )
  }, [lactating, search])

  const handleLog = () => {
    if (!logSheet || !form.yield_liters) return
    
    logProduction.mutate({
      animal_id: logSheet.id,
      log_date: form.log_date,
      session: form.session,
      yield_liters: parseFloat(form.yield_liters),
      fat_pct: form.fat_pct ? parseFloat(form.fat_pct) : null,
      notes: form.notes
    }, {
      onSuccess: () => {
        setLogSheet(null)
        setForm({
          log_date: new Date().toISOString().split('T')[0],
          session: 'pagi',
          yield_liters: '',
          fat_pct: '',
          notes: ''
        })
      }
    })
  }

  if (loadingAnimals || loadingLaktasi) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24 min-h-screen bg-[#06090F]">
      
      {/* Header */}
      <header className="px-6 pt-10 pb-6 bg-[#0C1319] border-b border-white/[0.04]">
        <h1 className="text-2xl font-black font-['Sora'] text-white mb-1">Produksi Susu</h1>
        <p className="text-xs text-[#4B6478]">
          {lactating.length} ekor sedang laktasi · {recentLogs.length} perahan tercatat
        </p>
      </header>

      {/* Search & Filter */}
      <div className="px-4 mt-6">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari Kambing Laktasi..."
            className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40 transition-all"
          />
        </div>
      </div>

      {/* List Ekor Laktasi */}
      <section className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} className="text-green-500" />
            Siap Perah
          </h2>
          <span className="text-[10px] text-[#4B6478] font-bold">
            {filtered.length} Tersedia
          </span>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-white/10 rounded-3xl">
              <Droplets size={32} className="mx-auto text-[#4B6478] mb-3 opacity-30" />
              <p className="text-sm font-bold text-[#4B6478]">Tidak ada kambing laktasi</p>
              <p className="text-[10px] text-[#2D3E4B] mt-1">Gunakan tab Ternak untuk aktivasi siklus</p>
            </div>
          ) : (
            filtered.map(animal => (
              <motion.div
                key={animal.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLogSheet(animal)}
                className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-between group cursor-pointer active:bg-white/[0.06] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <span className="text-xl">🐐</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-white font-['Sora']">{animal.ear_tag}</p>
                    <p className="text-[10px] text-[#4B6478] uppercase font-bold tracking-tight">
                      Laktasi Ke-{animal.parity ?? 1} · DIM {animal.dim ?? 0}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="px-2 py-1 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[10px] font-bold text-green-400">
                    Catat Susu
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Recent Activity Table */}
      <section className="px-4 mt-10">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <History size={14} className="text-blue-500" />
            Catatan Terakhir
          </h2>
        </div>

        <div className="bg-[#0F171F]/50 border border-white/[0.04] rounded-3xl overflow-hidden backdrop-blur-sm">
          {loadingLogs ? (
            <div className="p-8 flex justify-center"><LoadingSpinner /></div>
          ) : recentLogs.length === 0 ? (
            <p className="p-8 text-center text-[11px] text-[#4B6478] font-semibold italic">Belum ada log perahan</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentLogs.map(log => (
                <div key={log.id} className="p-4 flex items-center justify-between bg-white/[0.01]">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-black text-white">{log.animal?.ear_tag}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase ${
                        log.session === 'pagi' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {log.session}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#4B6478] font-bold">{log.log_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white font-['Sora']">{log.yield_liters} L</p>
                    {log.fat_pct && <p className="text-[9px] text-green-500 font-bold">FAT {log.fat_pct}%</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Input Sheet */}
      <Sheet open={!!logSheet} onOpenChange={o => !o && setLogSheet(null)}>
        <SheetContent side="bottom" className="bg-[#0C1319] border-t border-white/10 rounded-t-[2.5rem] px-6 pt-8 pb-10">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-2xl font-black font-['Sora'] text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                <Milk size={20} />
              </div>
              Recording Susu
            </SheetTitle>
            <p className="text-xs text-[#4B6478] mt-1 font-bold">
              KAMBING: <span className="text-white">{logSheet?.ear_tag}</span>
            </p>
          </SheetHeader>

          <div className="space-y-6">
            
            {/* Session & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block tracking-widest px-1">Sesi Perah</label>
                <select 
                  value={form.session}
                  onChange={e => setForm(prev => ({ ...prev, session: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none"
                >
                  <option value="pagi">🌅 Sesi Pagi</option>
                  <option value="sore">🌇 Sesi Sore</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block tracking-widest px-1">Tanggal</label>
                <DatePicker 
                  value={form.log_date} 
                  onChange={v => setForm(prev => ({ ...prev, log_date: v }))} 
                />
              </div>
            </div>

            {/* Yield Input */}
            <div className="relative">
              <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block tracking-widest px-1">Jumlah Perahan (Liter)</label>
              <div className="relative">
                <Milk size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#405463]" />
                <input 
                  type="number" step="0.1"
                  value={form.yield_liters}
                  onChange={e => setForm(prev => ({ ...prev, yield_liters: e.target.value }))}
                  placeholder="0.0"
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.05] border border-white/[0.1] rounded-2xl text-xl font-black text-white focus:outline-none focus:border-green-500/50"
                />
              </div>
            </div>

            {/* Quality Optional */}
            <div>
              <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block tracking-widest px-1 text-center">Data Kualitas (Opsional)</label>
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <Droplets size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#405463]" />
                  <input 
                    type="number" step="0.01"
                    value={form.fat_pct}
                    onChange={e => setForm(prev => ({ ...prev, fat_pct: e.target.value }))}
                    placeholder="Lemak (Fat) %"
                    className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={!form.yield_liters || logProduction.isPending}
              onClick={handleLog}
              className="w-full py-5 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded-2xl text-white font-black font-['Sora'] shadow-xl shadow-green-900/20 transition-all flex items-center justify-center gap-2"
            >
              {logProduction.isPending ? 'Mencatat...' : (
                <>
                  <Plus size={18} />
                  Simpan Recording
                </>
              )}
            </motion.button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}
