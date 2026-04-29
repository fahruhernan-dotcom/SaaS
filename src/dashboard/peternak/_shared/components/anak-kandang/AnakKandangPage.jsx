import { useState } from 'react'
import { useOutletContext, useLocation } from 'react-router-dom'
import { Plus, Users, Menu, Search, UserPlus, Zap, X, ChevronDown, ChevronUp } from 'lucide-react'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import {
  useKandangWorkersAll,
  useCreateKandangWorker,
  useUpdateKandangWorker,
  useDeleteKandangWorker,
  useFarmOpsCosts,
  useAddFarmOpsCost,
} from '@/lib/hooks/usePeternakTaskData'
import { useDombaActiveBatches } from '@/lib/hooks/useDombaPenggemukanData'
import { useKambingActiveBatches } from '@/lib/hooks/useKambingPenggemukanData'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import WorkerCard from './WorkerCard'
import WorkerSheet from './WorkerSheet'
import PaymentSheet from './PaymentSheet'
import PaydayReminder from './PaydayReminder'

const EMPTY_COST_FORM = { log_date: new Date().toISOString().split('T')[0], item_name: '', amount_idr: '', notes: '' }

export default function AnakKandangPage() {
  const { data: workers = [], isLoading } = useKandangWorkersAll()
  const createWorker = useCreateKandangWorker()
  const updateWorker = useUpdateKandangWorker()
  const deleteWorker = useDeleteKandangWorker()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen } = useOutletContext() || {}
  const location = useLocation()

  // Detect animal type from URL
  const animalType = location.pathname.includes('domba') ? 'domba'
    : location.pathname.includes('kambing') ? 'kambing'
    : location.pathname.includes('sapi') ? 'sapi'
    : null

  const { data: dombaBatches = [] } = useDombaActiveBatches()
  const { data: kambingBatches = [] } = useKambingActiveBatches()
  const activeBatches = animalType === 'domba' ? dombaBatches : animalType === 'kambing' ? kambingBatches : []

  const { data: opsCosts = [] } = useFarmOpsCosts(animalType)
  const addOpsCost = useAddFarmOpsCost(animalType)

  const [workerSheet, setWorkerSheet] = useState({ open: false, worker: null })
  const [paymentSheet, setPaymentSheet] = useState({ open: false, worker: null })
  const [search, setSearch] = useState('')
  const [showCostSheet, setShowCostSheet] = useState(false)
  const [costForm, setCostForm] = useState(EMPTY_COST_FORM)
  const [costExpanded, setCostExpanded] = useState(true)

  if (isLoading) return <LoadingSpinner fullPage />

  const filtered = workers.filter(w =>
    !search || w.full_name?.toLowerCase().includes(search.toLowerCase())
  )
  const activeWorkers = filtered.filter(w => w.status === 'aktif')
  const inactiveWorkers = filtered.filter(w => w.status === 'nonaktif')

  const handleSubmit = (payload) => {
    if (payload.id) {
      updateWorker.mutate(payload, { onSuccess: () => setWorkerSheet({ open: false, worker: null }) })
    } else {
      createWorker.mutate(payload, { onSuccess: () => setWorkerSheet({ open: false, worker: null }) })
    }
  }

  const handleAddCost = () => {
    const amount = Number(costForm.amount_idr) || 0
    if (amount <= 0) return
    addOpsCost.mutate(
      { batches: activeBatches, ...costForm, amount_idr: amount },
      { onSuccess: () => { setShowCostSheet(false); setCostForm(EMPTY_COST_FORM) } }
    )
  }

  const totalOpsCost = opsCosts.reduce((s, c) => s + (Number(c.amount_idr) || 0), 0)

  // ─── Listrik & Air section — rendered in both desktop & mobile ─────────────
  const ListrikSection = animalType ? (
    <div className="bg-[#0C1319] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-4 py-3.5 flex items-center justify-between">
        <div
          className="flex items-center gap-2.5 flex-1 cursor-pointer"
          onClick={() => setCostExpanded(v => !v)}
        >
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Zap size={14} className="text-yellow-400" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest leading-none">Listrik & Air</p>
            <p className="text-sm font-black text-white font-['Sora']">Rp {totalOpsCost.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCostSheet(true)}
            className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[11px] font-black rounded-lg hover:bg-yellow-500/20 transition"
          >
            + Catat
          </button>
          <div className="cursor-pointer p-1" onClick={() => setCostExpanded(v => !v)}>
            {costExpanded ? <ChevronUp size={14} className="text-[#4B6478]" /> : <ChevronDown size={14} className="text-[#4B6478]" />}
          </div>
        </div>
      </div>

      {costExpanded && (
        <div className="border-t border-white/[0.05]">
          {opsCosts.length === 0 ? (
            <p className="text-center py-6 text-xs text-[#4B6478]">Belum ada catatan listrik & air</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {opsCosts.slice(0, 10).map(c => (
                <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{c.item_name}</p>
                    <p className="text-[10px] text-[#4B6478]">{new Date(c.log_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <p className="text-sm font-black text-yellow-300">Rp {Number(c.amount_idr).toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  ) : null

  // ─── Cost Sheet ────────────────────────────────────────────────────────────
  const CostSheet = showCostSheet ? (
    <div className="fixed inset-0 z-[4000] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCostSheet(false)} />
      <div className="relative w-full max-w-md bg-[#0C1319] border-t sm:border border-white/[0.06] rounded-t-[28px] sm:rounded-[28px] p-6 pb-10 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            <h3 className="font-['Sora'] font-black text-base text-white">Catat Listrik & Air</h3>
          </div>
          <button onClick={() => setShowCostSheet(false)} className="p-1.5 text-[#4B6478]"><X size={18} /></button>
        </div>

        {activeBatches.length > 0 && (
          <div className="mb-4 px-3 py-2 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
            <p className="text-[10px] text-yellow-400/80 font-bold">
              ⚡ Dibagi proporsional ke {activeBatches.length} batch aktif ({activeBatches.reduce((s, b) => s + (b.total_animals || 0), 0)} ekor total)
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 tracking-widest">Tanggal</label>
              <DatePicker value={costForm.log_date} onChange={v => setCostForm(f => ({ ...f, log_date: v }))} placeholder="Pilih tanggal" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 tracking-widest">Total (Rp)</label>
              <InputRupiah value={costForm.amount_idr} onChange={v => setCostForm(f => ({ ...f, amount_idr: v }))} placeholder="150.000" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 tracking-widest">Keterangan</label>
            <input type="text" placeholder="cth. Tagihan Listrik Mei 2026" value={costForm.item_name}
              onChange={e => setCostForm(f => ({ ...f, item_name: e.target.value }))}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-yellow-500/50 transition-colors"
            />
          </div>
          <button
            onClick={handleAddCost}
            disabled={!(Number(costForm.amount_idr) > 0) || addOpsCost.isPending}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-white/[0.05] disabled:text-[#4B6478] text-black font-black py-3.5 rounded-2xl transition-all text-sm"
          >
            {addOpsCost.isPending ? 'Menyimpan...' : 'Simpan & Bagi ke Semua Batch'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  // ─── DESKTOP VIEW ────────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div className="max-w-6xl mx-auto p-8 pb-32 space-y-6">
        {/* Desktop Header */}
        <div className="flex justify-between items-end gap-6">
          <div>
            <h1 className="font-['Sora'] text-[28px] font-black text-slate-100 leading-tight">
              Anak Kandang
            </h1>
            <p className="text-[#94A3B8] mt-1.5 text-sm font-medium">
              Kelola data pekerja, gaji, dan bonus — {workers.length} pekerja terdaftar
            </p>
          </div>
          <button
            onClick={() => setWorkerSheet({ open: true, worker: null })}
            className="h-11 px-5 bg-violet-600 hover:bg-violet-500 text-white font-['Sora'] font-extrabold text-sm rounded-xl flex items-center gap-2.5 transition-all shadow-lg shadow-violet-500/20 active:scale-[0.97] shrink-0"
          >
            <UserPlus size={17} strokeWidth={2.5} /> Tambah Pekerja
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Pekerja', value: workers.length, icon: '👥', accent: '#94A3B8' },
            { label: 'Aktif', value: workers.filter(w => w.status === 'aktif').length, icon: '✅', accent: '#34D399' },
            { label: 'Nonaktif', value: workers.filter(w => w.status === 'nonaktif').length, icon: '⛔', accent: '#F87171' },
          ].map(s => (
            <div
              key={s.label}
              className="p-4 bg-[#0C1319] border border-white/[0.06] rounded-2xl flex items-center gap-4"
            >
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="font-['Sora'] font-black text-xl text-slate-100" style={{ color: s.accent }}>
                  {s.value}
                </p>
                <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" />
          <input
            type="text"
            placeholder="Cari pekerja..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#0C1319] border border-white/[0.06] rounded-xl text-slate-100 text-sm placeholder:text-[#4B6478] outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>

        {/* Payday Reminder */}
        <PaydayReminder workers={workers} />

        {/* Workers Grid — Empty State */}
        {filtered.length === 0 && (
          <div className="py-16 text-center bg-[#0C1319] rounded-2xl border border-dashed border-white/[0.06]">
            <span className="text-5xl">👤</span>
            <p className="text-[#4B6478] text-sm mt-4 font-medium">
              {search ? `Tidak ditemukan pekerja "${search}"` : 'Belum ada data anak kandang'}
            </p>
            {!search && (
              <button
                onClick={() => setWorkerSheet({ open: true, worker: null })}
                className="mt-5 px-5 py-3 bg-violet-600 text-white text-sm font-extrabold rounded-xl inline-flex items-center gap-2 shadow-lg shadow-violet-500/20 hover:bg-violet-500 transition-all"
              >
                <UserPlus size={16} /> Tambah Pekerja Pertama
              </button>
            )}
          </div>
        )}

        {/* Active workers grid */}
        {activeWorkers.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-['Sora'] font-extrabold text-sm text-slate-100 flex items-center gap-2 px-1">
              <Users size={15} className="text-emerald-400" />
              Aktif · {activeWorkers.length}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {activeWorkers.map(w => (
                <WorkerCard
                  key={w.id}
                  worker={w}
                  onEdit={() => setWorkerSheet({ open: true, worker: w })}
                  onPayment={() => setPaymentSheet({ open: true, worker: w })}
                  onDelete={() => { if (confirm(`Hapus ${w.full_name}?`)) deleteWorker.mutate(w.id) }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Inactive workers grid */}
        {inactiveWorkers.length > 0 && (
          <section className="space-y-3 mt-4">
            <h2 className="font-['Sora'] font-extrabold text-sm text-[#4B6478] px-1">
              Nonaktif · {inactiveWorkers.length}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {inactiveWorkers.map(w => (
                <WorkerCard
                  key={w.id}
                  worker={w}
                  onEdit={() => setWorkerSheet({ open: true, worker: w })}
                  onPayment={() => setPaymentSheet({ open: true, worker: w })}
                  onDelete={() => { if (confirm(`Hapus ${w.full_name}?`)) deleteWorker.mutate(w.id) }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Listrik & Air */}
        {ListrikSection}

        <WorkerSheet
          open={workerSheet.open}
          onClose={() => setWorkerSheet({ open: false, worker: null })}
          worker={workerSheet.worker}
          onSubmit={handleSubmit}
          isPending={createWorker.isPending || updateWorker.isPending}
        />
        <PaymentSheet
          open={paymentSheet.open}
          onClose={() => setPaymentSheet({ open: false, worker: null })}
          worker={paymentSheet.worker}
          isDesktop
        />
        {CostSheet}
      </div>
    )
  }

  // ─── MOBILE VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-24">
      {/* Mobile Header */}
      <header className="h-14 px-4 flex items-center gap-3 justify-between sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen?.(true)}
            className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          >
            <Menu size={16} className="text-[#94A3B8]" />
          </button>
          <h1 className="font-['Sora'] text-[15px] font-black text-white uppercase tracking-tight">Anak Kandang</h1>
        </div>
        <button
          onClick={() => setWorkerSheet({ open: true, worker: null })}
          className="h-9 px-3 text-[11px] font-black bg-violet-600 hover:bg-violet-700 text-white rounded-xl flex items-center gap-1.5 uppercase tracking-widest transition-all active:scale-95"
        >
          <Plus size={13} /> Tambah
        </button>
      </header>

      {/* Subtitle */}
      <p className="text-[#94A3B8] text-xs px-4">
        {workers.length} pekerja · {activeWorkers.length} aktif
      </p>

      {/* Payday Reminder */}
      <div className="px-4">
        <PaydayReminder workers={workers} />
      </div>

      <div className="px-4">
        {/* Empty state */}
        {workers.length === 0 && (
          <div className="mt-6 py-12 text-center bg-[#0C1319] rounded-2xl border border-dashed border-white/5">
            <span className="text-4xl">👤</span>
            <p className="text-[#4B6478] text-sm mt-3">Belum ada data anak kandang</p>
            <button
              onClick={() => setWorkerSheet({ open: true, worker: null })}
              className="mt-4 px-4 py-2.5 bg-violet-600 text-white text-sm font-extrabold rounded-xl inline-flex items-center gap-2 shadow-lg shadow-violet-500/20"
            >
              <Plus size={14} /> Tambah Pekerja
            </button>
          </div>
        )}

        {/* Active workers */}
        {activeWorkers.length > 0 && (
          <section className="space-y-2.5">
            <h2 className="font-['Sora'] font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <Users size={14} className="text-emerald-400" />
              Aktif · {activeWorkers.length}
            </h2>
            {activeWorkers.map(w => (
              <WorkerCard
                key={w.id}
                worker={w}
                onEdit={() => setWorkerSheet({ open: true, worker: w })}
                onPayment={() => setPaymentSheet({ open: true, worker: w })}
                onDelete={() => { if (confirm(`Hapus ${w.full_name}?`)) deleteWorker.mutate(w.id) }}
              />
            ))}
          </section>
        )}

        {/* Inactive workers */}
        {inactiveWorkers.length > 0 && (
          <section className="space-y-2.5 mt-6">
            <h2 className="font-['Sora'] font-extrabold text-sm text-[#4B6478]">
              Nonaktif · {inactiveWorkers.length}
            </h2>
            {inactiveWorkers.map(w => (
              <WorkerCard
                key={w.id}
                worker={w}
                onEdit={() => setWorkerSheet({ open: true, worker: w })}
                onPayment={() => setPaymentSheet({ open: true, worker: w })}
                onDelete={() => { if (confirm(`Hapus ${w.full_name}?`)) deleteWorker.mutate(w.id) }}
              />
            ))}
          </section>
        )}

        {/* Listrik & Air */}
        {ListrikSection && <div className="mt-4">{ListrikSection}</div>}
      </div>

      <WorkerSheet
        open={workerSheet.open}
        onClose={() => setWorkerSheet({ open: false, worker: null })}
        worker={workerSheet.worker}
        onSubmit={handleSubmit}
        isPending={createWorker.isPending || updateWorker.isPending}
      />
      <PaymentSheet
        open={paymentSheet.open}
        onClose={() => setPaymentSheet({ open: false, worker: null })}
        worker={paymentSheet.worker}
      />
      {CostSheet}
    </div>
  )
}
