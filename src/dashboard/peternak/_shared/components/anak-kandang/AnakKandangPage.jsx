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
} from '@/lib/hooks/usePeternakTaskData'
import { useDombaActiveBatches } from '@/lib/hooks/useDombaPenggemukanData'
import { useKambingActiveBatches } from '@/lib/hooks/useKambingPenggemukanData'
import { useSapiActiveBatches } from '@/lib/hooks/useSapiPenggemukanData'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import WorkerCard from './WorkerCard'
import WorkerSheet from './WorkerSheet'
import PaymentSheet from './PaymentSheet'
import PaydayReminder from './PaydayReminder'

export default function AnakKandangPage({ hideMobileHeader = false }) {
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
  const { data: sapiBatches = [] } = useSapiActiveBatches()
  const activeBatches = animalType === 'domba' ? dombaBatches : animalType === 'kambing' ? kambingBatches : animalType === 'sapi' ? sapiBatches : []

  const [workerSheet, setWorkerSheet] = useState({ open: false, worker: null })
  const [paymentSheet, setPaymentSheet] = useState({ open: false, worker: null })
  const [search, setSearch] = useState('')

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

  if (isDesktop) return (
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
            { label: 'Aktif', value: workers.filter(w => w.status === 'aktif').length, icon: '✅', accent: '#021a02' },
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
          animalType={animalType}
          activeBatches={activeBatches}
          isDesktop
        />
      </div>
  )

  // ─── MOBILE VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-24">
      {/* Mobile Header — hidden when embedded inside TimManajemenPage */}
      {!hideMobileHeader && (
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
      )}

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
        animalType={animalType}
        activeBatches={activeBatches}
      />
    </div>
  )
}
