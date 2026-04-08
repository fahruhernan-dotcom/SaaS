import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ClipboardList, BarChart2, Wheat, Search, X,
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, FileText,
} from 'lucide-react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import FarmContextBar from '../_shared/components/FarmContextBar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import {
  useAllCycles,
  useUpdateCycleStatus,
  calcCurrentAge, calcFCR, calcIPScore, calcMortalityPct,
} from '@/lib/hooks/usePeternakData'
import { formatIDRShort } from '@/lib/format'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import SiklusSheet from '../_shared/components/SiklusSheet'
import InputHarianSheet from '../_shared/components/InputHarianSheet'
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal'
import { useAuth } from '@/lib/hooks/useAuth'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'

// ─── Constants ────────────────────────────────────────────────────────────────

const HARVEST_TARGET_DAYS = 32

const TABS = [
  { key: 'all',       label: 'Semua' },
  { key: 'active',    label: 'Aktif' },
  { key: 'harvested', label: 'Selesai' },
  { key: 'failed',    label: 'Gagal/Batal' },
]

const STATUS_CFG = {
  active:    { label: 'Aktif',      cls: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  harvested: { label: 'Selesai',    cls: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  failed:    { label: 'Gagal',      cls: 'text-red-400 bg-red-500/20 border-red-500/30' },
  cancelled: { label: 'Dibatalkan', cls: 'text-slate-400 bg-white/10 border-white/15' },
}

const CHICKEN_TYPE_LABELS = {
  ayam_broiler: 'Broiler 🐔',
  ayam_kampung: 'Kampung',
  ayam_pejantan: 'Pejantan',
  ayam_layer: 'Layer 🥚',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTotalFeedKg(cycle) {
  if (cycle.total_feed_kg) return parseFloat(cycle.total_feed_kg)
  return (cycle.daily_records ?? []).reduce((s, r) => s + (r.feed_kg || 0), 0)
}

function getTotalMortality(cycle) {
  return cycle.total_mortality ?? 0
}

function getLatestAvgWeightKg(cycle) {
  const records = [...(cycle.daily_records ?? [])]
    .filter(r => r.avg_weight_kg)
    .sort((a, b) => new Date(b.record_date) - new Date(a.record_date))
  return records[0]?.avg_weight_kg ?? null
}

function getEstimatedFCR(cycle) {
  const feed = getTotalFeedKg(cycle)
  const alive = (cycle.current_count ?? cycle.doc_count ?? 0) - getTotalMortality(cycle)
  const avgW = getLatestAvgWeightKg(cycle)
  if (!feed || !alive || !avgW) return null
  const biomass = alive * avgW
  return biomass > 0 ? feed / biomass : null
}

const TODAY = new Date().toISOString().split('T')[0]

function hasInputToday(cycle) {
  return (cycle.daily_records ?? []).some(r => r.record_date === TODAY)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SiklusPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { farmId } = useParams()           // present when at /peternak/kandang/:farmId/siklus
  const { tenant, profile } = useAuth()
  const p = usePeternakPermissions()
  const { data: allCycles = [], isLoading } = useAllCycles()

  const peternakBase = `/peternak/${profile?.sub_type || 'peternak_broiler'}`

  // If farmId is in URL, filter to that farm only
  const cycles = farmId
    ? allCycles.filter(c => c.peternak_farm_id === farmId)
    : allCycles

  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [inputCycle, setInputCycle] = useState(null)
  const [closeCycle, setCloseCycle] = useState(null)
  const [invoiceCycle, setInvoiceCycle] = useState(null)

  // Open create sheet when ?action=new in URL (only if allowed)
  useEffect(() => {
    if (searchParams.get('action') === 'new' && p.canBuatSiklus) {
      setCreateSheetOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, p.canBuatSiklus])

  // ── Stats ──
  const stats = useMemo(() => {
    const active    = cycles.filter(c => c.status === 'active').length
    const harvested = cycles.filter(c => c.status === 'harvested').length
    const fcrList   = cycles.filter(c => c.final_fcr).map(c => parseFloat(c.final_fcr))
    const avgFcr    = fcrList.length
      ? (fcrList.reduce((s, v) => s + v, 0) / fcrList.length).toFixed(2)
      : '—'
    return { total: cycles.length, active, harvested, avgFcr }
  }, [cycles])

  // ── Filtered list ──
  const filtered = useMemo(() => {
    let list = cycles
    if (tab === 'active')    list = list.filter(c => c.status === 'active')
    if (tab === 'harvested') list = list.filter(c => c.status === 'harvested')
    if (tab === 'failed')    list = list.filter(c => ['failed', 'cancelled'].includes(c.status))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        (c.peternak_farms?.farm_name ?? '').toLowerCase().includes(q) ||
        String(c.cycle_number).includes(q)
      )
    }
    return list
  }, [cycles, tab, search])

  if (isLoading) return <LoadingSpinner fullPage />

  const tabCount = (key) => {
    if (key === 'all')       return cycles.length
    if (key === 'active')    return cycles.filter(c => c.status === 'active').length
    if (key === 'harvested') return cycles.filter(c => c.status === 'harvested').length
    if (key === 'failed')    return cycles.filter(c => ['failed', 'cancelled'].includes(c.status)).length
    return 0
  }

  return (
    <div className="text-slate-100 pb-10">

      {/* Farm context bar — only shown when accessed from per-farm route */}
      {farmId && <FarmContextBar subPath="siklus" />}

      {/* ── Header ── */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04] flex justify-between items-start">
        <div>
          <h1 className="font-['Sora'] font-extrabold text-xl text-slate-100 mb-1">Siklus Pemeliharaan</h1>
          <p className="text-xs text-[#4B6478]">{stats.active} aktif · {stats.total} total</p>
        </div>
        {p.canBuatSiklus && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCreateSheetOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#7C3AED] border-none rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-[0_3px_12px_rgba(124,58,237,0.35)] cursor-pointer flex-shrink-0"
          >
            <Plus size={13} strokeWidth={2.5} />
            Siklus Baru
          </motion.button>
        )}
      </header>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 px-4 mt-4">
        <StatCard label="Total Siklus"  value={stats.total}     />
        <StatCard label="Aktif"         value={stats.active}    valueColor="text-emerald-400" />
        <StatCard label="Selesai"       value={stats.harvested} valueColor="text-blue-400" />
        <StatCard label="Avg FCR"       value={stats.avgFcr}    valueColor="text-[#A78BFA]" />
      </div>

      {/* ── Search ── */}
      <div className="px-4 mt-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
          <input
            id="siklus_search"
            name="siklus_search"
            type="text"
            placeholder="Cari nama kandang..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2.5 bg-[#111C24] border border-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-[#4B6478] outline-none"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B6478] cursor-pointer border-none bg-transparent p-0"
              onClick={() => setSearch('')}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 px-4 mt-3 border-b border-white/[0.05]">
        {TABS.map(t => {
          const count = tabCount(t.key)
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-semibold border-b-2 transition-all cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 -mb-px ${
                active
                  ? 'text-[#A78BFA] border-[#7C3AED]'
                  : 'text-[#4B6478] border-transparent'
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  active
                    ? 'bg-[rgba(124,58,237,0.15)] text-[#A78BFA]'
                    : 'bg-white/[0.06] text-[#4B6478]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Cycle List ── */}
      <div className="px-4 mt-3">
        {filtered.length === 0 ? (
          <div className="mt-6 py-12 px-5 text-center bg-[#0C1319] rounded-2xl border border-dashed border-white/[0.05]">
            <span className="text-4xl">🏚️</span>
            <p className="text-[#4B6478] text-sm mt-3">
              {search ? 'Tidak ada siklus yang cocok' : tab === 'active' ? 'Belum ada siklus aktif' : 'Belum ada riwayat siklus'}
            </p>
            {tab === 'active' && !search && (
              <button
                className="mt-4 px-5 py-2.5 bg-[#7C3AED] text-white text-sm font-bold font-['Sora'] rounded-xl border-none cursor-pointer"
                onClick={() => setCreateSheetOpen(true)}
              >
                + Mulai Siklus Baru
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {filtered.map(cycle => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                p={p}
                onInputHarian={() => setInputCycle(cycle)}
                onDetail={() => navigate(`${peternakBase}/laporan/${cycle.id}`)}
                onClose={() => setCloseCycle(cycle)}
                onLaporan={() => navigate(`${peternakBase}/laporan/${cycle.id}`)}
                onInvoice={() => setInvoiceCycle(cycle)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Sheets ── */}
      <SiklusSheet open={createSheetOpen} onClose={() => setCreateSheetOpen(false)} />

      <InputHarianSheet
        open={!!inputCycle}
        onClose={() => setInputCycle(null)}
        cycle={inputCycle}
      />

      <CloseCycleSheet
        cycle={closeCycle}
        open={!!closeCycle}
        onClose={() => setCloseCycle(null)}
      />

      {/* Invoice Modal */}
      {invoiceCycle && (() => {
        const farm       = invoiceCycle.peternak_farms ?? {}
        const totalMort  = invoiceCycle.total_mortality ?? 0
        const ekor       = Math.max(0, (invoiceCycle.current_count ?? invoiceCycle.doc_count ?? 0) - totalMort)
        const priceKg    = Number(invoiceCycle.sell_price_per_kg || 0)
        const totalRev   = Number(invoiceCycle.total_revenue || 0)
        const totalBerat = priceKg > 0 ? Math.round((totalRev / priceKg) * 100) / 100 : 0
        return (
          <InvoicePreviewModal
            type="peternak_invoice"
            isOpen={!!invoiceCycle}
            onClose={() => setInvoiceCycle(null)}
            data={{
              tenant,
              cycle:       invoiceCycle,
              farm,
              broker_name: invoiceCycle.notes || '',
              total_ekor:  ekor,
              total_berat: totalBerat,
              price_per_kg: priceKg,
              generatedBy: profile?.full_name,
            }}
          />
        )
      })()}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, valueColor = 'text-slate-100' }) {
  return (
    <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-4">
      <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-['Sora'] text-xl font-extrabold ${valueColor}`}>{value}</p>
    </div>
  )
}

// ─── Cycle Card ───────────────────────────────────────────────────────────────

function CycleCard({ cycle, onInputHarian, onDetail, onClose, onLaporan, onInvoice, p }) {
  const farm = cycle.peternak_farms ?? {}
  const age = calcCurrentAge(cycle.start_date)
  const alive = Math.max(0, (cycle.current_count ?? cycle.doc_count ?? 0) - getTotalMortality(cycle))
  const fcr = cycle.status === 'active' ? getEstimatedFCR(cycle) : cycle.final_fcr
  const mort = calcMortalityPct(getTotalMortality(cycle), cycle.doc_count)
  const status = STATUS_CFG[cycle.status] ?? STATUS_CFG.cancelled
  const noInput = cycle.status === 'active' && !hasInputToday(cycle) && age > 0
  const progress = cycle.status === 'active' ? Math.min(100, Math.round((age / HARVEST_TARGET_DAYS) * 100)) : 100
  const daysLeft = Math.max(0, HARVEST_TARGET_DAYS - age)
  const chickLabel = CHICKEN_TYPE_LABELS[cycle.chicken_type ?? farm.livestock_type] ?? cycle.chicken_type ?? '—'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0C1319] border border-white/[0.07] rounded-[20px] p-5"
    >
      {/* Row 1: farm name + status badge */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">🏠</span>
          <span className="font-['Sora'] font-extrabold text-[15px] text-slate-100 truncate">{farm.farm_name ?? '—'}</span>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${status.cls}`}>
            {status.label}
          </span>
          {cycle.status === 'active' && (
            <span className="text-[10px] font-bold text-[#A78BFA] bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] px-2 py-0.5 rounded-full">
              Hari ke-{age}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: meta */}
      <p className="text-[11px] text-[#4B6478] mb-3">
        Siklus #{cycle.cycle_number} · {chickLabel}
        {farm.mitra_company ? ` · ${farm.mitra_company}` : ''}
      </p>

      {/* Date range */}
      <span className="inline-block text-[11px] text-[#4B6478] bg-white/[0.03] border border-white/[0.05] rounded-lg px-2.5 py-1 mb-3">
        {cycle.start_date ?? '—'} → {cycle.actual_harvest_date ?? cycle.estimated_harvest_date ?? '—'}
      </span>

      {/* Stats row */}
      <div className="flex justify-around py-3 border-t border-b border-white/[0.05]">
        <StatItem label="DOC"        value={(cycle.doc_count ?? 0).toLocaleString('id-ID')} unit="ekor" />
        <StatItem label="Hidup"      value={alive.toLocaleString('id-ID')}                  unit="ekor" />
        <StatItem label="Mortalitas" value={`${mort.toFixed(1)}%`} alert={mort > 5} />
        <StatItem
          label={cycle.status === 'active' ? 'FCR Est.' : 'FCR Final'}
          value={fcr !== null && fcr !== undefined ? Number(fcr).toFixed(2) : '—'}
          good={fcr !== null && fcr !== undefined && fcr < 1.7}
          alert={fcr !== null && fcr !== undefined && fcr >= 1.8}
        />
        {cycle.final_ip_score != null && (
          <StatItem label="IP Score" value={Math.round(cycle.final_ip_score)} good={cycle.final_ip_score >= 300} />
        )}
      </div>

      {/* No-input warning */}
      {noInput && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-amber-400/[0.08] border border-amber-400/20 rounded-xl text-[11px] text-amber-400 font-bold">
          <AlertTriangle size={12} />
          Belum ada input harian hari ini
        </div>
      )}

      {/* Progress bar (active only) */}
      {cycle.status === 'active' && (
        <div className="mt-3">
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px] text-[#4B6478] font-semibold">Estimasi Panen</span>
            <span className="text-[10px] text-[#4B6478] font-semibold">
              {progress >= 100 ? 'Siap panen! 🎉' : `${progress}% — ${daysLeft} hari lagi`}
            </span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: progress >= 100
                  ? '#34D399'
                  : 'linear-gradient(90deg, #7C3AED 0%, #10B981 100%)',
              }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        {cycle.status === 'active' && (
          <>
            {p?.canInputHarian && (
              <button
                className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 bg-[#7C3AED] border-none rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-[0_2px_8px_rgba(124,58,237,0.3)] cursor-pointer"
                onClick={onInputHarian}
              >
                <ClipboardList size={13} />
                Input Harian
              </button>
            )}
            {p?.canViewLaporan && (
              <button
                className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] rounded-xl text-[#A78BFA] text-xs font-bold cursor-pointer"
                onClick={onDetail}
              >
                <BarChart2 size={13} />
                Detail
              </button>
            )}
            {p?.canTutupSiklus && (
              <button
                className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs font-bold cursor-pointer"
                onClick={onClose}
              >
                <Wheat size={12} />
                Tutup
              </button>
            )}
          </>
        )}
        {cycle.status !== 'active' && (
          <>
            {cycle.status === 'harvested' && (
              <button
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[rgba(124,58,237,0.15)] border border-[rgba(124,58,237,0.35)] rounded-xl text-[#A78BFA] text-xs font-bold cursor-pointer"
                onClick={onInvoice}
              >
                <FileText size={13} />
                Buat Tagihan
              </button>
            )}
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[rgba(124,58,237,0.1)] border border-[rgba(124,58,237,0.2)] rounded-xl text-[#A78BFA] text-xs font-bold cursor-pointer"
              onClick={onLaporan}
            >
              <BarChart2 size={13} />
              Lihat Laporan
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ─── Close Cycle Sheet ────────────────────────────────────────────────────────

function CloseCycleSheet({ cycle, open, onClose }) {
  const updateStatus = useUpdateCycleStatus()

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    actual_harvest_date: today,
    final_avg_weight_kg: '',
    sell_price_per_kg:   '',
    total_revenue:       0,
    total_cost:          0,
    status:              'harvested',
    notes:               '',
  })

  // Reset form when cycle changes
  useEffect(() => {
    if (cycle) {
      setForm({
        actual_harvest_date: today,
        final_avg_weight_kg: '',
        sell_price_per_kg:   '',
        total_revenue:       0,
        total_cost:          0,
        status:              'harvested',
        notes:               '',
      })
    }
  }, [cycle?.id])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Preview calculations ──
  const preview = useMemo(() => {
    if (!cycle) return null
    const totalFeed   = getTotalFeedKg(cycle)
    const totalMort   = getTotalMortality(cycle)
    const docCount    = cycle.doc_count ?? 0
    const alive       = Math.max(0, docCount - totalMort)
    const mortPct     = calcMortalityPct(totalMort, docCount)
    const age         = calcCurrentAge(cycle.start_date)
    const avgW        = parseFloat(form.final_avg_weight_kg) || 0
    const weightGain  = alive * avgW
    const fcr         = calcFCR(totalFeed, weightGain)
    const ip          = calcIPScore(avgW, mortPct, age, fcr)
    const profit      = (form.total_revenue || 0) - (form.total_cost || 0)
    return { fcr, ip, profit, alive, mortPct, age, totalFeed }
  }, [cycle, form.final_avg_weight_kg, form.total_revenue, form.total_cost])

  const canSubmit = form.actual_harvest_date && form.status && !updateStatus.isPending

  const handleSubmit = async () => {
    if (!canSubmit || !cycle) return
    await updateStatus.mutateAsync({
      cycleId:              cycle.id,
      status:               form.status,
      actual_harvest_date:  form.actual_harvest_date,
      final_fcr:            preview?.fcr || null,
      final_ip_score:       preview?.ip || null,
      sell_price_per_kg:    form.sell_price_per_kg || null,
      total_revenue:        form.total_revenue || null,
      total_cost:           form.total_cost || null,
      notes:                form.notes || null,
    })
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-[#0C1319] border-white/8 rounded-t-[24px] max-h-[95vh] overflow-y-auto p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 22 }}>🌾</span>
            <div>
              <SheetTitle className="text-white font-['Sora'] font-black text-base">Tutup Siklus</SheetTitle>
              <p className="text-[#4B6478] text-xs mt-0.5">
                {cycle?.peternak_farms?.farm_name} · Siklus #{cycle?.cycle_number}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="px-5 py-5 flex flex-col gap-4">

          {/* Tanggal Panen */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Tanggal Panen Aktual *
            </label>
            <DatePicker
              value={form.actual_harvest_date}
              onChange={v => setField('actual_harvest_date', v)}
              placeholder="Pilih tanggal panen"
            />
          </div>

          {/* Berat rata-rata akhir */}
          <div>
            <label htmlFor="close_avg_weight" className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Berat Rata-rata Akhir (kg)
            </label>
            <input
              id="close_avg_weight"
              name="close_avg_weight"
              type="number"
              step="0.01"
              placeholder="1.8"
              value={form.final_avg_weight_kg}
              onChange={e => setField('final_avg_weight_kg', e.target.value)}
              className="w-full px-3.5 py-3 bg-[#111C24] border border-white/[0.08] rounded-xl text-[15px] text-slate-100 placeholder-[#4B6478] outline-none"
            />
            <p className="text-[10px] text-[#4B6478] mt-1">Digunakan untuk kalkulasi FCR dan IP Score</p>
          </div>

          {/* Harga jual per kg */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Harga Jual Aktual per Kg
            </label>
            <InputRupiah
              value={form.sell_price_per_kg}
              onChange={v => setField('sell_price_per_kg', v)}
              placeholder="22000"
            />
          </div>

          {/* Total Revenue */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Total Revenue (Rp)
            </label>
            <InputRupiah
              value={form.total_revenue}
              onChange={v => setField('total_revenue', v)}
              placeholder="0"
            />
          </div>

          {/* Total Biaya */}
          <div>
            <label className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Total Biaya — DOC + Pakan + Obat (Rp)
            </label>
            <InputRupiah
              value={form.total_cost}
              onChange={v => setField('total_cost', v)}
              placeholder="0"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="close_status" className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Status Akhir *
            </label>
            <select
              id="close_status"
              name="close_status"
              value={form.status}
              onChange={e => setField('status', e.target.value)}
              className="w-full px-3.5 py-3 bg-[#111C24] border border-white/[0.08] rounded-xl text-[15px] text-slate-100 outline-none"
            >
              <option value="harvested">Selesai (Panen)</option>
              <option value="failed">Gagal</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>

          {/* Catatan */}
          <div>
            <label htmlFor="close_notes" className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-1.5">
              Catatan Akhir
            </label>
            <textarea
              id="close_notes"
              name="close_notes"
              placeholder="Catatan opsional..."
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              rows={3}
              className="w-full px-3.5 py-3 bg-[#111C24] border border-white/[0.08] rounded-xl text-[15px] text-slate-100 placeholder-[#4B6478] outline-none resize-none leading-relaxed"
            />
          </div>

          {/* ── Preview Kalkulasi ── */}
          {preview && (
            <div className="bg-[#111C24] border border-white/[0.08] rounded-2xl p-4">
              <p className="text-[10px] font-extrabold text-[#4B6478] uppercase tracking-widest mb-3">
                Preview Kalkulasi
              </p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <PreviewStat
                  label="FCR"
                  value={preview.fcr > 0 ? preview.fcr.toFixed(2) : '—'}
                  good={preview.fcr > 0 && preview.fcr < 1.7}
                  bad={preview.fcr >= 1.8}
                />
                <PreviewStat
                  label="IP Score"
                  value={preview.ip > 0 ? Math.round(preview.ip) : '—'}
                  good={preview.ip >= 300}
                  bad={preview.ip > 0 && preview.ip < 200}
                />
                <PreviewStat
                  label="Mortalitas"
                  value={`${preview.mortPct.toFixed(1)}%`}
                  good={preview.mortPct < 3}
                  bad={preview.mortPct > 5}
                />
              </div>
              {/* Profit/Loss */}
              {(form.total_revenue > 0 || form.total_cost > 0) && (
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
                  preview.profit >= 0
                    ? 'bg-emerald-400/10 border-emerald-400/20'
                    : 'bg-red-400/10 border-red-400/20'
                }`}>
                  <span className={`text-xs font-bold ${preview.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {preview.profit >= 0 ? '✓ Profit' : '✗ Rugi'}
                  </span>
                  <span className={`font-['Sora'] font-extrabold text-sm ${preview.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {preview.profit >= 0 ? '+' : ''}{formatIDRShort(preview.profit)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-3.5 rounded-xl text-white text-[15px] font-extrabold font-['Sora'] border-none cursor-pointer transition-opacity ${
              canSubmit
                ? 'bg-[#7C3AED] shadow-[0_4px_16px_rgba(124,58,237,0.3)]'
                : 'opacity-40 cursor-not-allowed bg-[#7C3AED]'
            }`}
          >
            {updateStatus.isPending ? 'Menyimpan...' : '🌾 Tutup Siklus'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function StatItem({ label, value, unit, good, alert }) {
  const color = alert ? 'text-red-400' : good ? 'text-emerald-400' : 'text-slate-400'
  return (
    <div className="text-center">
      <p className="text-[10px] text-[#4B6478] font-semibold mb-0.5">{label}</p>
      <p className={`font-['Sora'] text-sm font-extrabold ${color}`}>{value}</p>
      {unit && <p className="text-[10px] text-[#4B6478]">{unit}</p>}
    </div>
  )
}

function PreviewStat({ label, value, good, bad }) {
  const color = bad ? 'text-red-400' : good ? 'text-emerald-400' : 'text-slate-400'
  return (
    <div className="text-center">
      <p className="text-[10px] text-[#4B6478] font-semibold mb-1">{label}</p>
      <p className={`font-['Sora'] text-base font-extrabold ${color}`}>{value}</p>
    </div>
  )
}
