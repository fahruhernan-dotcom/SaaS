import React, { useState } from 'react'
import { Zap, Plus, Menu, ChevronDown, ChevronUp, ChevronRight, Droplets, X, Trash2, Search, Calendar, CreditCard, FileText, ShoppingBag, ArrowLeft, Filter, Info, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useOutletContext } from 'react-router-dom'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import {
  useFarmOpsCosts,
  useAddFarmOpsCost,
  useDeleteFarmOpsCost,
} from '@/lib/hooks/usePeternakTaskData'
import { useDombaActiveBatches } from '@/lib/hooks/useDombaPenggemukanData'
import { useKambingActiveBatches } from '@/lib/hooks/useKambingPenggemukanData'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import NotificationBell from '@/dashboard/_shared/components/NotificationBell'
import { cn } from '@/lib/utils'

const EMPTY_FORM = {
  log_date: new Date().toISOString().split('T')[0],
  item_name: '',
  amount_idr: '',
  notes: '',
}

const COST_CATEGORIES = [
  { value: 'listrik', label: '⚡ Listrik', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { value: 'air', label: '💧 Air', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { value: 'lainnya', label: '🔧 Lainnya', color: 'text-slate-400', bg: 'bg-white/5 border-white/10' },
]

function formatIDR(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID')
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ListrikAirPage() {
  const { setSidebarOpen } = useOutletContext() || {}
  const location = useLocation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const animalType = location.pathname.includes('domba') ? 'domba'
    : location.pathname.includes('kambing') ? 'kambing'
    : location.pathname.includes('sapi') ? 'sapi'
    : null

  const { data: dombaBatches = [] } = useDombaActiveBatches()
  const { data: kambingBatches = [] } = useKambingActiveBatches()
  const activeBatches = animalType === 'domba' ? dombaBatches : animalType === 'kambing' ? kambingBatches : []

  const { data: opsCosts = [], isLoading } = useFarmOpsCosts(animalType)
  const addOpsCost = useAddFarmOpsCost(animalType)
  const deleteOpsCost = useDeleteFarmOpsCost(animalType)

  const [showSheet, setShowSheet] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [category, setCategory] = useState('listrik')
  const [filter, setFilter] = useState('semua')
  const [searchQuery, setSearchQuery] = useState('')

  if (isLoading) return <LoadingSpinner fullPage />

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = () => {
    const amount = Number(form.amount_idr) || 0
    if (amount <= 0) return
    addOpsCost.mutate(
      {
        batches: activeBatches,
        ...form,
        amount_idr: amount,
        notes: [category, form.notes].filter(Boolean).join(' · '),
      },
      {
        onSuccess: () => {
          setShowSheet(false)
          setForm(EMPTY_FORM)
          setCategory('listrik')
        },
      }
    )
  }

  const filteredCosts = opsCosts
    .filter(c => filter === 'semua' || (c.notes || '').startsWith(filter))
    .filter(c => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (c.item_name || '').toLowerCase().includes(q) || (c.notes || '').toLowerCase().includes(q)
    })

  const totalAll = opsCosts.reduce((s, c) => s + (Number(c.amount_idr) || 0), 0)
  const totalListrik = opsCosts.filter(c => (c.notes || '').startsWith('listrik')).reduce((s, c) => s + (Number(c.amount_idr) || 0), 0)
  const totalAir = opsCosts.filter(c => (c.notes || '').startsWith('air')).reduce((s, c) => s + (Number(c.amount_idr) || 0), 0)

  const AddSheet = (
    <AnimatePresence>
      {showSheet && (
        <div className="fixed inset-0 z-[4000] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowSheet(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#0C1319] border-t sm:border border-white/[0.08] rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <Zap size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-['Sora'] font-black text-lg text-white">Catat Biaya</h3>
                    <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5">Operasional Farm</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSheet(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#4B6478] hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="px-6 pb-10 space-y-6">
              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-2.5 ml-1">Pilih Kategori</label>
                <div className="flex gap-2">
                  {COST_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        'flex-1 py-3.5 rounded-2xl text-[11px] font-black transition-all border flex flex-col items-center gap-1.5',
                        category === cat.value
                          ? cat.bg + ' ' + cat.color
                          : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478] hover:bg-white/[0.04]'
                      )}
                    >
                      <span className="text-xl">{cat.label.split(' ')[0]}</span>
                      <span className="uppercase tracking-wide">{cat.label.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {activeBatches.length > 0 && (
                <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-4 flex gap-3">
                  <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-blue-300 leading-snug">Alokasi Proporsional</p>
                    <p className="text-[11px] text-[#4B6478] mt-1">
                      Biaya akan dibagi otomatis ke <span className="text-white font-bold">{activeBatches.length} batch aktif</span> ({activeBatches.reduce((s, b) => s + (b.total_animals || 0), 0)} ekor).
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Tanggal</label>
                    <DatePicker value={form.log_date} onChange={v => set('log_date', v)} className="h-12 bg-white/[0.02] border-white/10 rounded-2xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Total (Rp)</label>
                    <InputRupiah value={form.amount_idr} onChange={v => set('amount_idr', v)} placeholder="150.000" className="h-12 bg-white/[0.02] border-white/10 rounded-2xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Keterangan / Nama Vendor</label>
                  <input
                    type="text"
                    placeholder={category === 'listrik' ? 'cth. Token Listrik Kandang Utama' : category === 'air' ? 'cth. PDAM Bulan Mei' : 'cth. Perbaikan Atap Kandang'}
                    value={form.item_name}
                    onChange={e => set('item_name', e.target.value)}
                    className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-yellow-500/50 transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!(Number(form.amount_idr) > 0) || addOpsCost.isPending}
                    className="w-full h-14 bg-yellow-500 hover:bg-yellow-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-black font-black rounded-[20px] transition-all text-sm shadow-[0_8px_24px_rgba(234,179,8,0.25)]"
                  >
                    {addOpsCost.isPending ? 'Menyimpan...' : 'Simpan & Alokasikan'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  // ─── DESKTOP ────────────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div className="max-w-5xl mx-auto p-8 pb-32 space-y-8 relative">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/20 flex items-center justify-center shadow-2xl shadow-yellow-500/10">
                <Zap size={26} className="text-yellow-400" />
              </div>
              <div>
                <h1 className="font-['Sora'] text-4xl font-black text-white leading-none tracking-tight">Listrik & Air</h1>
                <p className="text-[#94A3B8] text-sm font-medium mt-1.5 opacity-80">
                  Manajemen pengeluaran operasional farm terpusat
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button
              onClick={() => setShowSheet(true)}
              className="h-14 px-8 bg-yellow-500 hover:bg-yellow-400 text-black font-['Sora'] font-black text-sm rounded-[20px] flex items-center gap-3 transition-all shadow-[0_10px_30px_rgba(234,179,8,0.25)] active:scale-[0.97] group"
            >
              <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" /> 
              Catat Biaya
            </button>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'Total Pengeluaran', value: formatIDR(totalAll), icon: ShoppingBag, color: 'text-white', bg: 'from-white/[0.08] to-transparent', border: 'border-white/[0.08]' },
            { label: 'Biaya Listrik', value: formatIDR(totalListrik), icon: Zap, color: 'text-yellow-400', bg: 'from-yellow-500/15 to-transparent', border: 'border-yellow-500/20' },
            { label: 'Biaya Air', value: formatIDR(totalAir), icon: Droplets, color: 'text-blue-400', bg: 'from-blue-500/15 to-transparent', border: 'border-blue-500/20' },
          ].map(s => (
            <div key={s.label} className={cn('relative p-8 bg-[#0C1319]/80 backdrop-blur-xl border rounded-[32px] overflow-hidden group transition-all hover:translate-y-[-4px]', s.border)}>
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40 group-hover:opacity-60 transition-opacity', s.bg)} />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <s.icon size={22} className={cn(s.color)} />
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={14} className="text-white/40" />
                  </div>
                </div>
                <p className={cn('font-["Sora"] font-black text-3xl tracking-tight leading-none', s.color)}>{s.value}</p>
                <p className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] mt-3">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Category Distribution Bar */}
        {totalAll > 0 && (
          <div className="bg-[#0C1319]/40 border border-white/[0.05] rounded-[24px] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Distribusi Biaya</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{opsCosts.length} TRANSAKSI</span>
            </div>
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${(totalListrik / totalAll) * 100}%` }}
                className="bg-yellow-500 h-full" 
              />
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${(totalAir / totalAll) * 100}%` }}
                className="bg-blue-500 h-full" 
              />
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${((totalAll - totalListrik - totalAir) / totalAll) * 100}%` }}
                className="bg-slate-500 h-full" 
              />
            </div>
            <div className="flex gap-4 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider">Listrik {Math.round((totalListrik / totalAll) * 100)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider">Air {Math.round((totalAir / totalAll) * 100)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider">Lainnya {Math.round(((totalAll - totalListrik - totalAir) / totalAll) * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-6 pt-4">
          <div className="flex gap-2.5">
            {['semua', 'listrik', 'air', 'lainnya'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border flex items-center gap-2',
                  filter === f
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_8px_20px_rgba(234,179,8,0.1)]'
                    : 'bg-white/[0.02] border-white/[0.08] text-[#4B6478] hover:bg-white/[0.05] hover:text-[#94A3B8] hover:border-white/20'
                )}
              >
                {f === 'semua' ? '📋 Semua' : f === 'listrik' ? '⚡ Listrik' : f === 'air' ? '💧 Air' : '🔧 Lainnya'}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-[320px]">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" />
            <input
              type="text"
              placeholder="Cari vendor atau keterangan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-[#0C1319] border border-white/[0.08] rounded-2xl pl-12 pr-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-white/20 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Records Container */}
        <div className="bg-[#0C1319]/50 backdrop-blur-md border border-white/[0.08] rounded-[40px] overflow-hidden shadow-2xl shadow-black/40">
          {filteredCosts.length === 0 ? (
            <div className="py-32 text-center">
              <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-[#4B6478] opacity-40" />
              </div>
              <p className="text-sm font-black text-white tracking-wide uppercase">Catatan tidak ditemukan</p>
              <p className="text-xs text-[#4B6478] mt-2">Gunakan filter atau kata kunci lain untuk mencari data</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              <AnimatePresence mode='popLayout'>
                {filteredCosts.map((c, i) => {
                  const cat = COST_CATEGORIES.find(ct => (c.notes || '').startsWith(ct.value)) || COST_CATEGORIES[2]
                  const keterangan = (c.notes || '').replace(/^(listrik|air|lainnya)\s*·?\s*/, '') || c.item_name
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-8 py-6 flex items-center justify-between hover:bg-white/[0.03] transition-all group"
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn('w-14 h-14 rounded-[22px] border flex items-center justify-center text-2xl shadow-inner relative overflow-hidden', cat.bg)}>
                          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="relative">{cat.label.split(' ')[0]}</span>
                        </div>
                        <div>
                          <p className="text-base font-black text-white tracking-tight leading-tight">{c.item_name || keterangan}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5', cat.color)}>{cat.label.split(' ')[1]}</span>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <div className="flex items-center gap-1.5 text-[#4B6478]">
                              <Calendar size={12} />
                              <span className="text-[11px] font-bold">{fmtDate(c.log_date)}</span>
                            </div>
                            {keterangan && keterangan !== c.item_name && (
                              <>
                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                <div className="flex items-center gap-1.5 text-[#4B6478]">
                                  <FileText size={12} />
                                  <span className="text-[11px] font-medium truncate max-w-[280px] italic">{keterangan}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-xl font-black text-yellow-400 font-['Sora']">{formatIDR(c.amount_idr)}</p>
                          <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.15em] mt-1 flex items-center justify-end gap-1.5">
                            <Check size={10} strokeWidth={4} /> Terdistribusi
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteOpsCost.mutate(c.id)}
                          className="opacity-0 group-hover:opacity-100 w-10 h-10 rounded-xl flex items-center justify-center text-red-400/30 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {AddSheet}
      </div>
    )
  }

  // ─── MOBILE ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#06090F] relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px] -z-10" />
      <div className="absolute top-1/2 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[60px] -z-10" />

      {/* Mobile Header */}
      <header className="h-20 px-5 flex items-center gap-3 justify-between sticky top-0 bg-[#06090F]/80 backdrop-blur-2xl z-40 border-b border-white/[0.08]">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setSidebarOpen?.(true)}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all shadow-inner"
          >
            <Menu size={20} className="text-[#94A3B8]" />
          </button>
          <div>
            <h1 className="font-['Sora'] text-base font-black text-white uppercase tracking-tight">Listrik & Air</h1>
            <p className="text-[10px] text-yellow-400/80 font-black tracking-[0.2em] uppercase mt-0.5">Operasional Farm</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <NotificationBell />
          <button
            onClick={() => setShowSheet(true)}
            className="w-11 h-11 bg-yellow-500 text-black rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-[0_8px_20px_rgba(234,179,8,0.3)]"
          >
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>
      </header>

      <div className="px-5 pt-6 pb-40 space-y-8">
        {/* Mobile Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: formatIDR(totalAll), color: 'text-white', icon: ShoppingBag, bg: 'from-white/10' },
            { label: 'Listrik', value: formatIDR(totalListrik), color: 'text-yellow-400', icon: Zap, bg: 'from-yellow-500/10' },
            { label: 'Air', value: formatIDR(totalAir), color: 'text-blue-400', icon: Droplets, bg: 'from-blue-500/10' },
          ].map(s => (
            <div key={s.label} className="p-4 bg-[#0C1319] border border-white/[0.08] rounded-[24px] shadow-2xl relative overflow-hidden group active:scale-95 transition-all">
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-20', s.bg)} />
              <s.icon size={14} className={cn('absolute -right-1 -bottom-1 opacity-20 rotate-12', s.color)} />
              <p className={cn('font-["Sora"] font-black text-[13px] leading-tight relative', s.color)}>{s.value}</p>
              <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mt-1.5 relative">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mobile Distribution Bar */}
        {totalAll > 0 && (
          <div className="bg-[#0C1319] border border-white/[0.06] rounded-[20px] p-3.5 flex flex-col gap-2.5">
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
              <div className="bg-yellow-500 h-full" style={{ width: `${(totalListrik / totalAll) * 100}%` }} />
              <div className="bg-blue-500 h-full" style={{ width: `${(totalAir / totalAll) * 100}%` }} />
              <div className="bg-slate-500 h-full" style={{ width: `${((totalAll - totalListrik - totalAir) / totalAll) * 100}%` }} />
            </div>
            <div className="flex justify-between items-center px-0.5">
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-yellow-500" />
                  <span className="text-[8px] font-black text-[#4B6478] uppercase">{Math.round((totalListrik / totalAll) * 100)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  <span className="text-[8px] font-black text-[#4B6478] uppercase">{Math.round((totalAir / totalAll) * 100)}%</span>
                </div>
              </div>
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{opsCosts.length} TRANSAKSI</span>
            </div>
          </div>
        )}

        {/* Mobile Search & Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-white/[0.04] border border-white/[0.1] rounded-2xl pl-12 pr-4 text-[13px] text-white placeholder:text-[#4B6478] focus:outline-none focus:border-white/20 transition-all shadow-inner"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
            {['semua', 'listrik', 'air', 'lainnya'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'shrink-0 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border',
                  filter === f
                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400 shadow-lg shadow-yellow-500/10'
                    : 'bg-white/[0.03] border-white/[0.08] text-[#4B6478]'
                )}
              >
                {f === 'semua' ? '📋 Semua' : f === 'listrik' ? '⚡ Listrik' : f === 'air' ? '💧 Air' : '🔧 Lain'}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Records List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-['Sora'] font-black text-[11px] text-[#4B6478] uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={12} className="text-yellow-500/60" />
              Riwayat Transaksi
            </h2>
            <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-black text-[#4B6478]">
              {filteredCosts.length} DATA
            </div>
          </div>

          {filteredCosts.length === 0 ? (
            <div className="py-24 text-center bg-[#0C1319]/50 rounded-[32px] border border-dashed border-white/[0.08] px-8">
              <div className="w-16 h-16 rounded-full bg-white/[0.02] flex items-center justify-center mx-auto mb-5 border border-white/5">
                <Search size={24} className="text-white/10" />
              </div>
              <p className="text-xs font-black text-[#4B6478] uppercase tracking-[0.2em]">Data Kosong</p>
              <p className="text-[10px] text-[#4B6478]/50 mt-2 leading-relaxed">Belum ada catatan pengeluaran yang ditemukan</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              <AnimatePresence initial={false}>
                {filteredCosts.map(c => {
                  const cat = COST_CATEGORIES.find(ct => (c.notes || '').startsWith(ct.value)) || COST_CATEGORIES[2]
                  const keterangan = (c.notes || '').replace(/^(listrik|air|lainnya)\s*·?\s*/, '') || c.item_name
                  return (
                    <motion.div
                      key={c.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="p-5 bg-[#0C1319] border border-white/[0.08] rounded-[28px] shadow-xl active:scale-[0.98] transition-all relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={cn('w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shadow-inner', cat.bg)}>
                            {cat.label.split(' ')[0]}
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-white leading-tight uppercase tracking-tight">{c.item_name || keterangan}</p>
                            <p className={cn('text-[9px] font-black uppercase tracking-[0.15em] mt-1', cat.color)}>{cat.label.split(' ')[1]}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteOpsCost.mutate(c.id)}
                          className="w-9 h-9 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-400/30 active:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1.5 text-[#4B6478]">
                          <Calendar size={12} />
                          <span className="text-[11px] font-bold">{fmtDate(c.log_date)}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-yellow-400 font-['Sora']">{formatIDR(c.amount_idr)}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {AddSheet}
    </div>
  )
}
