import { useState } from 'react'
import { useOutletContext, useLocation } from 'react-router-dom'
import { Plus, Users, Menu, Search, UserPlus, CheckCircle2, XCircle } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
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

// Guidance panel — standalone component to avoid creating components during render
function GuidancePanel() {
  return (
    <div className="space-y-3">
      {/* Tips Kelola Tim */}
      <div className="p-4 bg-slate-50 dark:bg-[#0C1319] border border-slate-200 dark:border-white/[0.04] rounded-2xl space-y-2.5">
        <h3 className="font-['Sora'] font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <span>💡</span> Tips Kelola Tim
        </h3>
        <p className="text-[11px] text-[#94A3B8] leading-relaxed">
          Tips: Tambahkan pekerja kandang agar tugas harian, gaji, dan bonus lebih mudah dipantau.
        </p>
        <div className="h-px bg-white/[0.04]" />
        <p className="text-[11px] text-[#4B6478] leading-relaxed">
          Pekerja yang dihubungkan ke akun tim dapat mengakses TernakOS dari HP mereka sendiri untuk mencatat tugas harian yang didelegasikan.
        </p>
      </div>

      {/* Hak Akses Pekerja */}
      <div className="p-4 bg-slate-50 dark:bg-[#0C1319] border border-slate-200 dark:border-white/[0.04] rounded-2xl space-y-2.5">
        <h3 className="font-['Sora'] font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Hak Akses Pekerja
        </h3>
        <div className="space-y-2 text-[11px] text-[#94A3B8]">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
            <p><strong className="text-slate-300">Staff Kandang:</strong> Mengisi data input harian, melihat dan menyelesaikan tugas harian.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0" />
            <p><strong className="text-slate-300">Data Gaji:</strong> Informasi gaji pokok dan bonus dikunci rapat, hanya dapat dilihat oleh Owner &amp; Manajer.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [statusFilter, setStatusFilter] = useState('semua') // 'semua', 'aktif', 'nonaktif'

  if (isLoading) return <LoadingSpinner fullPage />

  const filtered = workers.filter(w =>
    !search || w.full_name?.toLowerCase().includes(search.toLowerCase())
  )
  const activeWorkers = filtered.filter(w => w.status === 'aktif')
  const inactiveWorkers = filtered.filter(w => w.status === 'nonaktif')

  const hasWorkers = workers.length > 0
  const hasFiltered = filtered.length > 0

  const handleSubmit = (payload) => {
    if (payload.id) {
      updateWorker.mutate(payload, { onSuccess: () => setWorkerSheet({ open: false, worker: null }) })
    } else {
      createWorker.mutate(payload, { onSuccess: () => setWorkerSheet({ open: false, worker: null }) })
    }
  }

  const showActive = statusFilter === 'semua' || statusFilter === 'aktif'
  const showInactive = statusFilter === 'semua' || statusFilter === 'nonaktif'

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-32 space-y-6">
      {/* Mobile Header fallback if hideMobileHeader is false */}
      {!hideMobileHeader && !isDesktop && (
        <header className="h-14 -mx-4 -mt-4 px-4 flex items-center gap-3 justify-between bg-white/90 dark:bg-[#06090F]/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 dark:border-white/5 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen?.(true)}
              className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 active:scale-90 transition-transform"
            >
              <Menu size={16} className="text-[#94A3B8]" />
            </button>
            <h1 className="font-['Sora'] text-[15px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Anak Kandang</h1>
          </div>
          <button
            onClick={() => setWorkerSheet({ open: true, worker: null })}
            className="h-9 px-3 text-[11px] font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 uppercase tracking-widest transition-all active:scale-95"
          >
            <Plus size={13} /> Tambah
          </button>
        </header>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-['Sora'] text-2xl md:text-[26px] font-black text-slate-100 leading-tight">
            Anak Kandang
          </h1>
          <p className="text-[#94A3B8] mt-1 text-xs md:text-sm font-medium leading-relaxed">
            Kelola pekerja kandang, gaji pokok, bonus, dan status kerja.
          </p>
        </div>
        <button
          onClick={() => setWorkerSheet({ open: true, worker: null })}
          className="w-full sm:w-auto h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-['Sora'] font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.97] shrink-0"
        >
          <UserPlus size={14} strokeWidth={2.5} /> Tambah Pekerja
        </button>
      </div>

      {/* Two-column layout: Management panel + Guidance panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">

        {/* Left: Management Panel */}
        <div className="bg-white dark:bg-[#0C1319] border border-slate-200 dark:border-white/[0.05] rounded-2xl overflow-hidden shadow-sm dark:shadow-none">

          {/* Panel header with title + compact summary chips */}
          <div className="px-4 py-3 border-b border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-['Sora'] font-extrabold text-sm text-slate-100">Daftar Pekerja</h2>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-[10px] font-bold text-[#94A3B8]">
                  <Users size={10} /> {workers.length} Total
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 size={10} /> {workers.filter(w => w.status === 'aktif').length} Aktif
                </span>
                {workers.filter(w => w.status === 'nonaktif').length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 border border-rose-500/15 rounded-full text-[10px] font-bold text-rose-400">
                    <XCircle size={10} /> {workers.filter(w => w.status === 'nonaktif').length} Nonaktif
                  </span>
                )}
              </div>
            </div>

            {/* Search + Filter inline */}
            <div className="flex gap-2 items-center flex-1 sm:flex-none sm:max-w-xs">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
                <input
                  type="text"
                  placeholder="Cari pekerja..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white/[0.02] border border-white/[0.04] rounded-lg text-slate-100 text-xs placeholder:text-[#4B6478] outline-none focus:border-emerald-500/40 transition-colors"
                />
              </div>
              <div className="flex bg-white/[0.02] border border-white/[0.04] p-0.5 rounded-lg shrink-0">
                {[
                  { id: 'semua', label: 'Semua' },
                  { id: 'aktif', label: 'Aktif' },
                  { id: 'nonaktif', label: 'Nonaktif' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={cn(
                      'px-2.5 py-1 text-[10px] font-bold rounded-md transition-all',
                      statusFilter === f.id
                        ? 'bg-emerald-600/15 text-emerald-400 font-extrabold'
                        : 'text-[#4B6478] hover:text-slate-300'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payday Reminder */}
          <div className="px-4 py-2">
            <PaydayReminder workers={workers} />
          </div>

          {/* Desktop Table Header */}
          {hasWorkers && hasFiltered && (
            <div className="hidden md:grid grid-cols-[minmax(180px,1fr)_140px_120px_110px_auto] gap-4 px-4 py-2 border-b border-white/[0.03]">
              {['PEKERJA', 'GAJI POKOK', 'BONUS', 'MASUK', 'AKSI'].map(col => (
                <span key={col} className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">{col}</span>
              ))}
            </div>
          )}

          {/* Workers list */}
          <div className="divide-y divide-white/[0.03]">
            {!hasWorkers ? (
              <div className="py-14 text-center px-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <Users size={24} className="text-emerald-400" />
                </div>
                <h3 className="font-['Sora'] font-bold text-white text-sm mb-1">Belum Ada Data Pekerja</h3>
                <p className="text-[#4B6478] text-xs max-w-xs mx-auto leading-relaxed">
                  Tambahkan pekerja kandang agar tugas harian, gaji, dan bonus lebih mudah dipantau.
                </p>
                <button
                  onClick={() => setWorkerSheet({ open: true, worker: null })}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                >
                  <Plus size={13} /> Tambah Pekerja Pertama
                </button>
              </div>
            ) : !hasFiltered ? (
              <div className="py-10 text-center px-4">
                <span className="text-2xl">🔍</span>
                <p className="text-[#4B6478] text-xs mt-2">
                  Tidak ditemukan pekerja dengan pencarian &quot;{search}&quot;
                </p>
              </div>
            ) : (
              <>
                {/* Active list */}
                {showActive && activeWorkers.length > 0 && (
                  <div>
                    <div className="px-4 py-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="font-['Sora'] font-extrabold text-[10px] text-[#4B6478] uppercase tracking-widest">
                        Aktif · {activeWorkers.length}
                      </span>
                    </div>
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
                )}
                {showActive && statusFilter === 'aktif' && activeWorkers.length === 0 && (
                  <div className="py-8 text-center"><p className="text-[#4B6478] text-xs">Tidak ada pekerja aktif.</p></div>
                )}

                {/* Inactive list */}
                {showInactive && inactiveWorkers.length > 0 && (
                  <div>
                    <div className="px-4 py-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span className="font-['Sora'] font-extrabold text-[10px] text-[#4B6478] uppercase tracking-widest">
                        Nonaktif · {inactiveWorkers.length}
                      </span>
                    </div>
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
                )}
                {showInactive && statusFilter === 'nonaktif' && inactiveWorkers.length === 0 && (
                  <div className="py-8 text-center"><p className="text-[#4B6478] text-xs">Tidak ada pekerja nonaktif.</p></div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Guidance Panel (desktop) */}
        <div className="hidden xl:block">
          <GuidancePanel />
        </div>

      </div>

      {/* Guidance Panel on mobile/tablet — stacked below */}
      <div className="xl:hidden">
        <GuidancePanel />
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
        isDesktop={isDesktop}
      />
    </div>
  )
}
