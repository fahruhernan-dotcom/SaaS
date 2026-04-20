import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, ChevronDown, ClipboardList, Lock, LockOpen } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useKambingBatches, useCreateKambingBatch, useCloseKambingBatch,
  calcHariDiFarm, calcMortalitasKambing,
} from '@/lib/hooks/useKambingPenggemukanData'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { cn } from '@/lib/utils'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

const BASE = '/peternak/peternak_kambing_penggemukan'

const STATUS_CFG = {
  active:    { label: 'Aktif',     cls: 'text-green-400 bg-green-500/20 border-green-500/30' },
  closed:    { label: 'Selesai',   cls: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  cancelled: { label: 'Dibatalkan',cls: 'text-slate-400 bg-white/10 border-white/15' },
}

const TABS = [
  { key: 'active',   label: 'Aktif' },
  { key: 'closed',   label: 'Selesai' },
  { key: 'all',      label: 'Semua' },
]

function StatCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
      <p className={`font-['Sora'] font-black text-lg leading-none mb-0.5 ${color}`}>{value}</p>
      <p className="text-[10px] text-[#4B6478]">{label}</p>
    </div>
  )
}

function BatchRow({ batch, onClick }) {
  const hari = calcHariDiFarm(batch.start_date)
  const mort = calcMortalitasKambing(batch.mortality_count, batch.total_animals)
  const cfg = STATUS_CFG[batch.status] ?? STATUS_CFG.active

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 cursor-pointer active:bg-white/[0.05] transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-['Sora'] font-bold text-sm text-white">{batch.batch_code}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cfg.cls}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-[#4B6478]">{batch.kandang_name}</p>
        </div>
        <div className="text-right">
          <p className="font-['Sora'] font-black text-base text-white">{batch.total_animals} ekor</p>
          <p className="text-[10px] text-[#4B6478]">
            {batch.status === 'active' ? `Hari ke-${hari}` : `${hari} hari total`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/[0.04]">
        <div>
          <p className="text-[11px] font-bold text-white">{batch.mortality_count}</p>
          <p className="text-[10px] text-[#4B6478]">Mati</p>
        </div>
        <div>
          <p className={`text-[11px] font-bold ${mort > 3 ? 'text-red-400' : 'text-white'}`}>{mort}%</p>
          <p className="text-[10px] text-[#4B6478]">Mortalitas</p>
        </div>
        <div>
          <p className={`text-[11px] font-bold ${batch.avg_adg_gram >= 150 ? 'text-green-400' : batch.avg_adg_gram ? 'text-amber-400' : 'text-[#4B6478]'}`}>
            {batch.avg_adg_gram ? `${batch.avg_adg_gram}g` : '—'}
          </p>
          <p className="text-[10px] text-[#4B6478]">ADG</p>
        </div>
        <div>
          <p className={`text-[11px] font-bold ${batch.avg_fcr <= 8 ? 'text-green-400' : batch.avg_fcr ? 'text-red-400' : 'text-[#4B6478]'}`}>
            {batch.avg_fcr ?? '—'}
          </p>
          <p className="text-[10px] text-[#4B6478]">FCR</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function KambingPenggemukanBatch() {
  const navigate = useNavigate()
  const { tenant } = useAuth()
  const { data: allBatches = [], isLoading } = useKambingBatches()
  const createBatch = useCreateKambingBatch()

  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  // Form state
  const [isKandangLocked, setIsKandangLocked] = useState(true)
  const [form, setForm] = useState({
    batch_code: '', 
    kandang_name: tenant?.business_name || '',
    start_date: new Date().toISOString().split('T')[0],
    target_end_date: '', 
    notes: '',
  })

  useEffect(() => {
    if (tenant?.business_name && isKandangLocked) {
      setForm(prev => ({ ...prev, kandang_name: tenant.business_name }))
    }
  }, [tenant?.business_name, isKandangLocked])


  const stats = useMemo(() => ({
    total:   allBatches.length,
    active:  allBatches.filter(b => b.status === 'active').length,
    closed:  allBatches.filter(b => b.status === 'closed').length,
  }), [allBatches])

  const filtered = useMemo(() => {
    let list = allBatches
    if (tab === 'active')  list = list.filter(b => b.status === 'active')
    if (tab === 'closed')  list = list.filter(b => b.status === 'closed')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(b =>
        b.batch_code.toLowerCase().includes(q) ||
        b.kandang_name.toLowerCase().includes(q)
      )
    }
    return list
  }, [allBatches, tab, search])

  function handleCreate() {
    if (!form.batch_code || !form.kandang_name || !form.start_date) return
    createBatch.mutate(form, {
      onSuccess: () => { setSheetOpen(false); setForm({ batch_code: '', kandang_name: tenant?.business_name || '', start_date: new Date().toISOString().split('T')[0], target_end_date: '', notes: '' }) }
    })
  }

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">

      {/* Header */}
      <header className="px-4 pt-6 pb-4 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04] flex items-start justify-between">
        <div>
          <h1 className="font-['Sora'] font-black text-xl text-white mb-0.5">Batch Penggemukan</h1>
          <p className="text-xs text-[#4B6478]">{stats.active} aktif · {stats.total} total</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-green-600 border-none rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-[0_3px_12px_rgba(22,163,74,0.35)] cursor-pointer"
        >
          <Plus size={13} strokeWidth={2.5} />
          Batch Baru
        </motion.button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-4 mt-4">
        <StatCard label="Total"   value={stats.total} />
        <StatCard label="Aktif"   value={stats.active}  color="text-green-400" />
        <StatCard label="Selesai" value={stats.closed}  color="text-blue-400" />
      </div>

      {/* Search */}
      <div className="px-4 mt-4 relative">
        <Search size={14} className="absolute left-7 top-1/2 -translate-y-1/2 text-[#4B6478]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari kode batch atau kandang..."
          className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40"
        />
        {search && <button onClick={() => setSearch('')} className="absolute right-7 top-1/2 -translate-y-1/2"><X size={13} className="text-[#4B6478]" /></button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mt-3">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.key
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'text-[#4B6478] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
            <div className="w-16 h-16 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <ClipboardList size={32} className="text-green-500" />
        </div>
            <p className="text-sm text-[#4B6478]">Belum ada batch di kategori ini</p>
          </div>
        ) : filtered.map(batch => (
          <BatchRow
            key={batch.id}
            batch={batch}
            onClick={() => navigate(`${BASE}/ternak?batch=${batch.id}`)}
          />
        ))}
      </div>

      {/* Sheet Tambah Batch */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] w-full sm:w-[440px] p-0 flex flex-col h-full">
          <SheetHeader className="px-6 pt-8 pb-5 border-b border-white/5">
            <SheetTitle className="font-['Sora'] font-black text-white text-xl">Batch Baru</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Kode Batch *</label>
              <input
                value={form.batch_code}
                onChange={e => setForm(f => ({ ...f, batch_code: e.target.value }))}
                placeholder="contoh: BATCH-2024-07"
                className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Nama Kandang *</label>
              <div className="relative">
                <input
                  value={form.kandang_name}
                  onChange={e => setForm(f => ({ ...f, kandang_name: e.target.value }))}
                  readOnly={isKandangLocked}
                  placeholder={isKandangLocked ? "Otomatis" : "Nama Kandang..."}
                  className={cn(
                    "w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none transition-all pr-12",
                    isKandangLocked ? "opacity-70 cursor-not-allowed" : "border-green-500/30 bg-green-500/5"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setIsKandangLocked(!isKandangLocked)}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    isKandangLocked ? "bg-white/5 text-[#4B6478] hover:text-white" : "bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                  )}
                >
                  {isKandangLocked ? <Lock size={13} /> : <LockOpen size={13} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Tanggal Mulai *</label>
              <DatePicker
                value={form.start_date}
                onChange={v => setForm(f => ({ ...f, start_date: v }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Target Tanggal Jual</label>
              <DatePicker
                value={form.target_end_date}
                onChange={v => setForm(f => ({ ...f, target_end_date: v }))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Catatan</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Catatan tambahan..."
                className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40 resize-none"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!form.batch_code || !form.kandang_name || !form.start_date || createBatch.isPending}
              onClick={handleCreate}
              className="w-full py-3.5 bg-green-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm"
            >
              {createBatch.isPending ? 'Menyimpan...' : 'Buat Batch'}
            </motion.button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}