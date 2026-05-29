import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Wheat, Calendar, Info, Trash2, ArrowLeft, Share2,
  Receipt, Wallet, TrendingUp, Package, Zap, Heart, Users, MoreHorizontal,
  ShoppingCart, Filter, ChevronDown,
} from 'lucide-react'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { InputNumber } from '@/components/ui/InputNumber'
import { useNavigate, useSearchParams } from 'react-router-dom'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Stable stubs for optional hooks ──────────────────────────────────────────

const _emptyHook = () => ({ data: [], isLoading: false })
const _emptyMutate = () => ({ mutateAsync: async () => {}, mutate: () => {}, isPending: false })

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getConsumed(log) {
  if (log.consumed_kg != null && log.consumed_kg > 0) return log.consumed_kg
  const input = (log.hijauan_kg || 0) + (log.konsentrat_kg || 0) + (log.dedak_kg || 0) + (log.other_feed_kg || 0)
  return Math.max(0, input - (log.sisa_pakan_kg || 0))
}

// ─── Category helpers ──────────────────────────────────────────────────────────

const CATEGORY_META = {
  pakan:        { label: 'Pakan',         color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', icon: '🌿' },
  listrik_air:  { label: 'Listrik & Air', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',         dot: 'bg-blue-400',    icon: '💡' },
  LISTRIK_AIR:  { label: 'Listrik & Air', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',         dot: 'bg-blue-400',    icon: '💡' },
  kesehatan:    { label: 'Kesehatan',     color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',         dot: 'bg-rose-400',    icon: '🏥' },
  tenaga_kerja: { label: 'Tenaga Kerja',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',      dot: 'bg-amber-400',   icon: '👷' },
  upah:         { label: 'Tenaga Kerja',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',      dot: 'bg-amber-400',   icon: '👷' },
  pekerja:      { label: 'Tenaga Kerja',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',      dot: 'bg-amber-400',   icon: '👷' },
  gaji:         { label: 'Tenaga Kerja',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',      dot: 'bg-amber-400',   icon: '👷' },
  lainnya:      { label: 'Lainnya',       color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',      dot: 'bg-slate-400',   icon: '📦' },
}

function getCatMeta(category) {
  if (!category) return CATEGORY_META.lainnya
  const norm = category.toLowerCase().replace(/-/g, '_')
  return CATEGORY_META[norm] || CATEGORY_META[category] || {
    label: category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    dot: 'bg-slate-400',
    icon: '📦',
  }
}

const fmt = (n) => Math.round(n).toLocaleString('id-ID')
const fmtDateShort = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })

// ─── BiayaTab ─────────────────────────────────────────────────────────────────

const ALL_CAT = 'semua'

function CategoryBadge({ category, small = false }) {
  const meta = getCatMeta(category)
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border font-black',
      small ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
      meta.color,
    )}>
      {meta.icon} {meta.label}
    </span>
  )
}

function BiayaTab({
  costs, costStats, batches: _batches, batchCodeMap,
  isAllBatches: _isAllBatches, canInputBiaya, canHapusBiaya,
  hasDeleteHook, onAddCost, onDeleteCost,
}) {
  const [catFilter, setCatFilter] = useState(ALL_CAT)

  // Dedup by ID (safety net — main dedup already in costStats)
  const uniqueCosts = useMemo(
    () => Array.from(new Map(costs.map(c => [c.id, c])).values()),
    [costs]
  )

  // Derive unique categories for filter bar
  const categories = useMemo(() => {
    const seen = new Set()
    uniqueCosts.forEach(c => seen.add(c.category))
    return Array.from(seen)
  }, [uniqueCosts])

  const filteredCosts = useMemo(() =>
    catFilter === ALL_CAT
      ? uniqueCosts
      : uniqueCosts.filter(c => c.category === catFilter),
    [uniqueCosts, catFilter]
  )

  const summaryCards = [
    {
      label: 'Total Belanja',
      value: `Rp ${fmt(costStats.total)}`,
      sub: `${costStats.txCount} transaksi`,
      color: 'from-violet-900/30 to-violet-900/10 border-violet-500/20',
      textColor: 'text-violet-300',
      icon: ShoppingCart,
    },
    {
      label: 'Pembelian Pakan',
      value: `Rp ${fmt(costStats.pakanTotal)}`,
      sub: costStats.totalQtyPakan > 0 ? `${fmt(costStats.totalQtyPakan)} kg dibeli` : 'Stok pakan',
      color: 'from-emerald-900/30 to-emerald-900/10 border-emerald-500/20',
      textColor: 'text-emerald-300',
      icon: Wheat,
    },
    {
      label: 'Operasional',
      value: `Rp ${fmt(costStats.nonPakanTotal)}`,
      sub: 'Listrik, air, lainnya',
      color: 'from-blue-900/30 to-blue-900/10 border-blue-500/20',
      textColor: 'text-blue-300',
      icon: Zap,
    },
    {
      label: 'Harga Rata Pakan',
      value: costStats.avgHargaPakan > 0 ? `Rp ${fmt(costStats.avgHargaPakan)}/kg` : '—',
      sub: 'Berdasarkan pembelian',
      color: 'from-amber-900/30 to-amber-900/10 border-amber-500/20',
      textColor: 'text-amber-300',
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── 4-card Summary Grid ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {summaryCards.map(({ label, value, sub, color, textColor, icon: Icon }) => (
          <div key={label} className={cn('rounded-2xl p-3.5 border bg-gradient-to-b', color)}>
            <Icon size={13} className={cn(textColor, 'mb-2 opacity-80')} />
            <p className={cn('text-sm font-black font-[\'Sora\'] leading-tight', textColor)}>{value}</p>
            <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mt-1 leading-tight">{label}</p>
            <p className="text-[9px] text-[#4B6478] mt-0.5 leading-tight">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Section Header + CTAs ── */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-['Sora'] font-black text-[13px] text-white flex items-center gap-1.5">
            <Receipt size={14} className="text-[#4B6478]" /> Riwayat Transaksi
          </h2>
          <p className="text-[10px] text-[#4B6478] mt-0.5">
            {filteredCosts.length} dari {uniqueCosts.length} entri
          </p>
        </div>
        {canInputBiaya && (
          <button
            onClick={onAddCost}
            className="flex-shrink-0 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Plus size={13} /> Tambah Biaya
          </button>
        )}
      </div>

      {/* ── Category filter pills ── */}
      {categories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setCatFilter(ALL_CAT)}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black border transition-all',
              catFilter === ALL_CAT
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478] hover:text-white/60',
            )}
          >
            Semua
          </button>
          {categories.map(cat => {
            const meta = getCatMeta(cat)
            const active = catFilter === cat
            return (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black border transition-all flex items-center gap-1',
                  active ? meta.color : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478] hover:text-white/60',
                )}
              >
                {meta.icon} {meta.label}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Transaction List ── */}
      {filteredCosts.length === 0 ? (
        <div className="text-center py-12 bg-white/[0.01] border border-dashed border-white/[0.05] rounded-3xl">
          <Wallet size={28} className="mx-auto text-white/5 mb-3" />
          <p className="text-xs font-black text-[#4B6478]">
            {uniqueCosts.length === 0 ? 'Belum ada catatan transaksi' : `Tidak ada transaksi kategori "${getCatMeta(catFilter).label}"`}
          </p>
          {uniqueCosts.length === 0 && canInputBiaya && (
            <button onClick={onAddCost} className="mt-3 text-[10px] text-violet-400 hover:text-violet-300 font-black transition-colors">
              + Tambah transaksi pertama
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table — hidden on mobile */}
          <div className="hidden sm:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Tanggal','Jenis','Batch','Deskripsi','Qty · Rp/kg','Nominal',''].map(h => (
                    <th key={h} className={cn(
                      'py-2 text-[9px] font-black text-[#4B6478] uppercase tracking-widest',
                      h === 'Nominal' ? 'text-right pr-3' : 'pr-4',
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCosts.map((cost, idx) => {
                  const batchCode = batchCodeMap[cost.batch_id]
                  const qty = Number(cost.quantity) || 0
                  const amount = Number(cost.amount_idr) || 0
                  // Derived harga/kg from this row's own qty and amount
                  const derivedPricePerKg = qty > 0 ? amount / qty : 0
                  // Legacy mismatch: qty * avg_price >> amount (qty was not split, only amount was)
                  // We detect this by checking if amount is much less than qty * derivedBatchAvg.
                  // Use costStats.avgHargaPakan as the batch-level reference.
                  const batchAvgPrice = costStats.avgHargaPakan
                  const expectedFromQty = qty > 0 && batchAvgPrice > 0 ? qty * batchAvgPrice : 0
                  const isLegacyMismatch = cost.category === 'pakan' && qty > 0 && amount > 0
                    && expectedFromQty > amount * 2  // expected >2x actual = old bug
                  return (
                    <tr key={cost.id}
                      className={cn(
                        'border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] group',
                        idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]',
                      )}
                    >
                      <td className="py-3 pr-4 text-[11px] text-[#4B6478] whitespace-nowrap font-mono">
                        {fmtDateShort(cost.log_date)}
                      </td>
                      <td className="py-3 pr-4">
                        <CategoryBadge category={cost.category} small />
                      </td>
                      <td className="py-3 pr-4">
                        {batchCode && (
                          <span className="text-[9px] font-black text-slate-400 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded-md">
                            {batchCode}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 max-w-[180px]">
                        <p className="text-[12px] font-bold text-white truncate">{cost.item_name}</p>
                        {cost.notes && (
                          <p className="text-[10px] text-[#4B6478] truncate mt-0.5">{cost.notes}</p>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-[11px] whitespace-nowrap">
                        {qty > 0 ? (
                          <div>
                            <span className={cn('font-bold', isLegacyMismatch ? 'text-amber-400' : 'text-[#4B6478]')}>
                              {qty.toLocaleString('id-ID')} {cost.unit || 'kg'}
                            </span>
                            {derivedPricePerKg > 0 && (
                              <p className="text-[9px] text-[#4B6478] mt-0.5">
                                Rp {fmt(derivedPricePerKg)}/kg
                              </p>
                            )}
                            {isLegacyMismatch && (
                              <p className="text-[9px] text-amber-400/80 mt-0.5">⚠ qty belum split</p>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-3 pr-3 text-right text-[12px] font-black text-white whitespace-nowrap">
                        Rp {fmt(amount)}
                      </td>
                      <td className="py-3 w-8">
                        {canHapusBiaya && hasDeleteHook && (
                          <button
                            onClick={() => onDeleteCost(cost.id, cost.batch_id)}
                            className="p-1 text-red-500/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile compact cards — shown on mobile only */}
          <div className="sm:hidden space-y-1.5">
            {filteredCosts.map(cost => {
              const meta = getCatMeta(cost.category)
              const batchCode = batchCodeMap[cost.batch_id]
              const qty = Number(cost.quantity) || 0
              const amount = Number(cost.amount_idr) || 0
              const derivedPricePerKg = qty > 0 ? amount / qty : 0
              const batchAvgPrice = costStats.avgHargaPakan
              const expectedFromQty = qty > 0 && batchAvgPrice > 0 ? qty * batchAvgPrice : 0
              const isLegacyMismatch = cost.category === 'pakan' && qty > 0 && amount > 0
                && expectedFromQty > amount * 2
              return (
                <div key={cost.id}
                  className={cn(
                    'border border-white/[0.05] rounded-2xl px-3.5 py-3 flex items-center gap-3 transition-colors',
                    isLegacyMismatch
                      ? 'bg-amber-500/[0.03] border-amber-500/20 hover:bg-amber-500/[0.06]'
                      : 'bg-white/[0.02] hover:bg-white/[0.04]',
                  )}
                >
                  {/* Category dot */}
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-0.5', meta.dot)} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Row 1: description + amount */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] font-bold text-white truncate leading-snug">{cost.item_name}</p>
                      <p className="text-[12px] font-black text-white whitespace-nowrap flex-shrink-0">
                        Rp {fmt(amount)}
                      </p>
                    </div>
                    {/* Row 2: meta chips */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[9px] text-[#4B6478]">{fmtDateShort(cost.log_date)}</span>
                      {batchCode && (
                        <span className="text-[9px] font-black text-slate-400 bg-white/[0.04] border border-white/[0.05] px-1.5 py-0.5 rounded">
                          {batchCode}
                        </span>
                      )}
                      <CategoryBadge category={cost.category} small />
                      {qty > 0 && (
                        <span className={cn('text-[9px]', isLegacyMismatch ? 'text-amber-400' : 'text-[#4B6478]')}>
                          {qty.toLocaleString('id-ID')} {cost.unit || 'kg'}
                          {isLegacyMismatch && ' ⚠'}
                        </span>
                      )}
                      {derivedPricePerKg > 0 && (
                        <span className="text-[9px] text-[#4B6478]">
                          @ Rp {fmt(derivedPricePerKg)}/kg
                        </span>
                      )}
                    </div>
                    {isLegacyMismatch && (
                      <p className="text-[9px] text-amber-400/70 mt-1">
                        ⚠ Qty mungkin belum dialokasi — periksa di konsol
                      </p>
                    )}
                  </div>

                  {/* Delete */}
                  {canHapusBiaya && hasDeleteHook && (
                    <button
                      onClick={() => onDeleteCost(cost.id, cost.batch_id)}
                      className="p-1.5 text-red-500/20 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function PenggemukanPakan({ config, hooks }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialBatchId = searchParams.get('batch')

  const perm = usePeternakPermissions() || {}
  const canInputPakan   = perm.canInputPakan   !== false
  const canHapusPakan   = perm.canHapusPakan   !== false
  const canViewBiayaTab = config.hasOperationalCosts && perm.canViewBiayaTab !== false
  const canInputBiaya   = perm.canInputBiaya   !== false
  const canHapusBiaya   = perm.canHapusBiaya   !== false

  // Resolve optional hooks to stubs
  const useFeedLogsByBatches       = hooks.useFeedLogsByBatches       || _emptyHook
  const useDeleteFeedLog           = hooks.useDeleteFeedLog           || _emptyMutate
  const useOperationalCosts        = hooks.useOperationalCosts        || _emptyHook
  const useOperationalCostsByBatches = hooks.useOperationalCostsByBatches || _emptyHook
  const useAddOperationalCost      = hooks.useAddOperationalCost      || _emptyMutate
  const useDeleteOperationalCost   = hooks.useDeleteOperationalCost   || _emptyMutate

  const { data: batches = [], isLoading: loadingBatches } = hooks.useActiveBatches()

  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId || 'all')
  const isAllBatches = selectedBatchId === 'all'
  const activeBatch = useMemo(() =>
    isAllBatches ? batches[0] : batches.find(b => b.id === selectedBatchId)
  , [isAllBatches, selectedBatchId, batches])

  const allBatchIds = useMemo(() => batches.map(b => b.id), [batches])

  const { data: allLogs = [], isLoading: loadingAllLogs } = useFeedLogsByBatches(isAllBatches ? allBatchIds : [])
  const { data: singleLogs = [], isLoading: loadingSingleLogs } = hooks.useFeedLogs(isAllBatches ? null : selectedBatchId)
  const logs = isAllBatches ? allLogs : singleLogs
  const loadingLogs = isAllBatches ? loadingAllLogs : loadingSingleLogs

  const addLog = hooks.useAddFeedLog()
  const deleteLog = useDeleteFeedLog()

  const { data: allCosts = [] } = useOperationalCostsByBatches(isAllBatches ? allBatchIds : [])
  const { data: singleCosts = [] } = useOperationalCosts(isAllBatches ? null : selectedBatchId)
  const costs = isAllBatches ? allCosts : singleCosts

  const addCost = useAddOperationalCost()
  const deleteCost = useDeleteOperationalCost()

  const [activeTab, setActiveTab] = useState('konsumsi')
  const [showAdd, setShowAdd] = useState(false)
  const [showAddCost, setShowAddCost] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formBatchId, setFormBatchId] = useState(null)
  const [batchTargetLocked, setBatchTargetLocked] = useState(true)

  const batchCodeMap = useMemo(() => {
    const m = {}
    batches.forEach(b => { m[b.id] = b.batch_code })
    return m
  }, [batches])

  const emptyForm = {
    log_date: new Date().toISOString().split('T')[0],
    hijauan_kg: '', konsentrat_kg: '', dedak_kg: '',
    other_feed_kg: '', sisa_pakan_kg: '', notes: '',
    // kandang schema extras
    kandang_name: '', animal_count: '', feed_cost_idr: '',
  }
  const [form, setForm] = useState(emptyForm)

  const [costForm, setCostForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    item_name: '', category: 'pakan', feed_type: 'hijauan',
    harga_per_kg: '', amount_idr: '', quantity: '', unit: 'kg',
    notes: '', is_shared: false,
  })

  const isPakanCost = costForm.category === 'pakan'
  const pakanTotalAuto = isPakanCost
    ? Math.round((parseFloat(costForm.quantity) || 0) * (parseFloat(costForm.harga_per_kg) || 0))
    : 0

  const stats = useMemo(() => {
    if (!logs.length) return { total: 0, avg: 0, hijauan: 0, konsentrat: 0 }
    const total = logs.reduce((s, l) => s + getConsumed(l), 0)
    return {
      total: total.toFixed(1),
      avg: (total / logs.length).toFixed(1),
      hijauan: logs.reduce((s, l) => s + (l.hijauan_kg || 0), 0).toFixed(1),
      konsentrat: logs.reduce((s, l) => s + (l.konsentrat_kg || 0), 0).toFixed(1),
    }
  }, [logs])

  const costStats = useMemo(() => {
    // Dedup by ID sebelum kalkulasi — proteksi dari join duplication
    const uniqueCosts = Array.from(new Map(costs.map(c => [c.id, c])).values())
    const total     = uniqueCosts.reduce((s, c) => s + Number(c.amount_idr || 0), 0)
    const pakan     = uniqueCosts.filter(c => c.category === 'pakan')
    const nonPakan  = uniqueCosts.filter(c => c.category !== 'pakan')
    const pakanTotal   = pakan.reduce((s, c) => s + Number(c.amount_idr || 0), 0)
    const nonPakanTotal = nonPakan.reduce((s, c) => s + Number(c.amount_idr || 0), 0)
    const totalQtyPakan = pakan.reduce((s, c) => s + (Number(c.quantity) || 0), 0)
    const avgHargaPakan = totalQtyPakan > 0 ? pakanTotal / totalQtyPakan : 0
    const groups = {}
    uniqueCosts.forEach(c => {
      const d = new Date(c.log_date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      if (!groups[key]) groups[key] = { label, total: 0, items: [] }
      groups[key].total += Number(c.amount_idr || 0)
      groups[key].items.push(c)
    })
    return {
      total, pakanTotal, nonPakanTotal, totalQtyPakan, avgHargaPakan,
      txCount: uniqueCosts.length,
      monthlySummary: Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([, d]) => d),
    }
  }, [costs])

  // Phase 4: date-grouping for feed history
  const feedDateGroups = useMemo(() => {
    const groups = {}
    logs.forEach(log => {
      const key = log.log_date || 'unknown'
      if (!groups[key]) groups[key] = []
      groups[key].push(log)
    })
    return groups
  }, [logs])
  const feedSortedDates = useMemo(
    () => Object.keys(feedDateGroups).sort((a, b) => b.localeCompare(a)),
    [feedDateGroups]
  )

  const fmtGroupDate = (d) =>
    new Date(d).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

  const sisakColor = (cat, kg) => {
    if (cat === 'habis')   return { label: 'Habis',   cls: 'text-emerald-400' }
    if (cat === 'sedikit') return { label: 'Sedikit', cls: 'text-amber-400' }
    if (cat === 'banyak')  return { label: 'Banyak',  cls: 'text-rose-400' }
    return { label: `${(kg || 0).toFixed(1)} kg`, cls: 'text-amber-400' }
  }

  const targetBatch = formBatchId ? batches.find(b => b.id === formBatchId) : activeBatch

  const handleSubmit = async (e) => {
    e.preventDefault()
    const batchForSubmit = targetBatch || batches[0]
    if (!batchForSubmit) return
    if (config.logSchema === 'kandang' && (!form.kandang_name || !form.animal_count)) {
      toast.error('Isi nama kandang dan jumlah ternak')
      return
    }
    if (config.logSchema === 'kandang' && !form.feed_cost_idr) {
      toast.warning('Biaya pakan belum diisi — HPP tidak akan akurat. Isi di form ini atau di tab Biaya.', { duration: 4000 })
    }
    setIsSubmitting(true)
    try {
      await addLog.mutateAsync({
        batch_id: batchForSubmit.id,
        log_date: form.log_date,
        hijauan_kg: parseFloat(form.hijauan_kg) || 0,
        konsentrat_kg: parseFloat(form.konsentrat_kg) || 0,
        dedak_kg: parseFloat(form.dedak_kg) || 0,
        other_feed_kg: parseFloat(form.other_feed_kg) || 0,
        sisa_pakan_kg: parseFloat(form.sisa_pakan_kg) || 0,
        notes: form.notes,
        ...(config.logSchema === 'kandang' && {
          kandang_name: form.kandang_name,
          animal_count: parseInt(form.animal_count) || 0,
          feed_cost_idr: form.feed_cost_idr ? parseInt(form.feed_cost_idr) : null,
        }),
      })
      toast.success('Log pakan berhasil disimpan')
      setShowAdd(false)
      setForm(emptyForm)
    } catch {
      toast.error('Gagal menyimpan log pakan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!hooks.useDeleteFeedLog) return
    if (!confirm('Hapus log pakan ini?')) return
    try {
      await deleteLog.mutateAsync(id)
      toast.success('Log pakan dihapus')
    } catch {
      toast.error('Gagal menghapus log')
    }
  }

  const resetCostForm = () => {
    setShowAddCost(false)
    setBatchTargetLocked(true)
    setFormBatchId(null)
    setCostForm({ log_date: new Date().toISOString().split('T')[0], item_name: '', category: 'pakan', feed_type: 'hijauan', harga_per_kg: '', amount_idr: '', quantity: '', unit: 'kg', notes: '', is_shared: false })
  }

  const handleAddCost = async (e) => {
    e.preventDefault()
    const batchForCost = targetBatch || batches[0]
    if (!batchForCost) return
    const finalAmount = isPakanCost && pakanTotalAuto > 0 ? pakanTotalAuto : (parseInt(costForm.amount_idr) || 0)
    if (finalAmount <= 0) {
      toast.error('Jumlah biaya harus lebih dari 0')
      return
    }
    setIsSubmitting(true)

    // Original unit price per kg (stored for HPP accuracy — not affected by allocation)
    const originalPricePerKg = isPakanCost ? (parseFloat(costForm.harga_per_kg) || 0) : 0
    const totalQtyKg = isPakanCost ? (parseFloat(costForm.quantity) || 0) : (parseFloat(costForm.quantity) || 0)

    const autoItemName = isPakanCost
      ? `Beli Pakan ${costForm.feed_type.charAt(0).toUpperCase() + costForm.feed_type.slice(1)}`
      : costForm.item_name

    // Notes: store harga_per_kg as structured hint for HPP calculation
    // Format: "Rp 1.200/kg · optional notes" — parsed by useHppBatch via avgPurchasePricePerKg
    const buildNotes = (extraNotes) => {
      const parts = []
      if (isPakanCost && originalPricePerKg > 0) {
        parts.push(`Rp ${Number(originalPricePerKg).toLocaleString('id-ID')}/kg`)
      }
      const userNotes = extraNotes || costForm.notes
      if (userNotes) parts.push(userNotes)
      return parts.join(' · ')
    }

    const basePayload = {
      log_date: costForm.log_date,
      item_name: autoItemName || costForm.item_name,
      category: costForm.category,
      unit: isPakanCost ? 'kg' : costForm.unit,
    }

    try {
      if (costForm.is_shared && batches.length > 1) {
        const totalAnimals = batches.reduce((s, b) => s + (b.total_animals || 0), 0)
        if (totalAnimals === 0) {
          // Fallback: no animal data → dump all to primary batch
          await addCost.mutateAsync({
            batch_id: batchForCost.id,
            ...basePayload,
            quantity: totalQtyKg,
            amount_idr: finalAmount,
            notes: buildNotes(),
          })
        } else {
          // Proportional split: BOTH amount_idr AND quantity are split by the same ratio.
          // harga_per_kg = finalAmount / totalQtyKg stays constant across all batches.
          // This ensures avgPurchasePricePerKg in useHppBatch returns the correct unit price.
          let remainingAmount = finalAmount
          let remainingQty    = totalQtyKg
          for (let i = 0; i < batches.length; i++) {
            const b = batches[i]
            const proportion = (b.total_animals || 0) / totalAnimals
            // Last batch gets remainder to avoid rounding drift
            const allocatedAmount = i === batches.length - 1
              ? remainingAmount
              : Math.round(finalAmount * proportion)
            // Qty: derive from amount ratio (consistent with harga_per_kg)
            const allocatedQty = i === batches.length - 1
              ? Math.round(remainingQty * 100) / 100
              : Math.round(totalQtyKg * proportion * 100) / 100
            remainingAmount -= allocatedAmount
            remainingQty    -= allocatedQty
            if (allocatedAmount > 0) {
              await addCost.mutateAsync({
                batch_id: b.id,
                ...basePayload,
                quantity: allocatedQty,
                amount_idr: allocatedAmount,
                notes: buildNotes(`Alokasi bersama ${Math.round(proportion * 100)}%`),
              })
            }
          }
        }
      } else {
        await addCost.mutateAsync({
          batch_id: batchForCost.id,
          ...basePayload,
          quantity: totalQtyKg,
          amount_idr: finalAmount,
          notes: buildNotes(),
        })
      }
      resetCostForm()
    } catch {
      toast.error('Gagal mencatat biaya')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCost = async (id, costBatchId) => {
    if (!hooks.useDeleteOperationalCost) return
    if (!confirm('Hapus catatan biaya ini?')) return
    try {
      await deleteCost.mutateAsync({ costId: id, batchId: costBatchId || activeBatch?.id })
    } catch {
      toast.error('Gagal menghapus biaya')
    }
  }

  if (loadingBatches || (activeBatch && loadingLogs)) return <LoadingSpinner fullPage />

  const accent = (config.accentColorClass === 'bg-green-600 border-green-500 text-white')
    ? 'bg-emerald-600 border-emerald-500 text-white'
    : (config.accentColorClass || 'bg-emerald-600 border-emerald-500 text-white')
  const focusCls = (config.accentFocusClass === 'focus:border-green-500/50')
    ? 'focus:border-emerald-500/50'
    : (config.accentFocusClass || 'focus:border-emerald-500/50')
  const btnCls = (config.buttonClass === 'bg-green-600 hover:bg-green-500')
    ? 'bg-emerald-600 hover:bg-emerald-500'
    : (config.buttonClass || 'bg-emerald-600 hover:bg-emerald-500')

  return (
    <div className="text-slate-100 pb-28">
      {/* Header */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#4B6478] hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-['Sora'] font-black text-xl text-white">{config.pageTitle}</h1>
        </div>

        {batches.length > 0 && (
          <>
            {/* Mobile: compact dropdown-style selector */}
            <div className="sm:hidden">
              <div className="relative">
                <select
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                  className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 pr-10 text-xs font-bold text-white focus:outline-none"
                >
                  <option value="all" className="bg-[#0C1319]">Semua Batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id} className="bg-[#0C1319]">{b.batch_code}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
              </div>
            </div>
            {/* Desktop: horizontal chips */}
            <div className="hidden sm:flex gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setSelectedBatchId('all')}
                className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border',
                  isAllBatches ? accent : 'bg-white/[0.03] border-white/[0.06] text-[#4B6478]')}
              >
                Semua
              </button>
              {batches.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBatchId(b.id)}
                  className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border',
                    selectedBatchId === b.id && !isAllBatches ? accent : 'bg-white/[0.03] border-white/[0.06] text-[#4B6478]')}
                >
                  {b.batch_code}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Tabs — only if operational costs are enabled */}
        {canViewBiayaTab && (
          <div className="flex gap-1 bg-white/[0.05] p-1 rounded-2xl mt-4 border border-white/[0.08]">
            {[['konsumsi','🌿 Konsumsi Harian'],['biaya','📋 Pembelian & Operasional']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex-1 py-2.5 text-center rounded-xl text-[11px] font-black tracking-wide transition-all',
                  activeTab === id
                    ? 'bg-[#0C1421] text-white shadow-sm border border-white/[0.08]'
                    : 'text-[#4B6478] hover:text-white/60'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {batches.length === 0 ? (
        <div className="px-4 py-20 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-500/20">
            <Wheat size={24} className="text-emerald-400" />
          </div>
          <h3 className="font-['Sora'] text-base font-black text-white mb-2">Belum Ada Batch Aktif</h3>
          <p className="text-xs text-[#4B6478] leading-relaxed mb-6">
            Anda perlu memiliki minimal satu batch aktif untuk mencatat konsumsi pakan dan alokasi biaya operasional.
          </p>
          <button
            onClick={() => navigate(`${config.BASE}/batch`)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Mulai Siklus Penggemukan Baru
          </button>
        </div>
      ) : (
        <div className="px-4 mt-6">

          {/* ── KONSUMSI TAB ── */}
          {activeTab === 'konsumsi' && (
            <>
              {/* Phase 2 — Chunked summary card */}
              <div className="mb-6 bg-white/[0.025] border border-white/[0.06] rounded-2xl p-4">
                {/* Primary: total konsumsi */}
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mb-0.5">Total Konsumsi</p>
                    <p className="text-2xl font-black text-white font-['Sora'] leading-none">
                      {stats.total} <span className="text-sm font-normal text-[#4B6478]">kg</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mb-0.5">Rata-rata/hari</p>
                    <p className="text-lg font-black text-white font-['Sora'] leading-none">
                      {stats.avg} <span className="text-xs font-normal text-[#4B6478]">kg</span>
                    </p>
                  </div>
                </div>
                {/* Breakdown chips */}
                <div className="flex gap-2 pt-3 border-t border-white/[0.05]">
                  <div className="flex-1 flex items-center gap-2 bg-emerald-500/[0.07] border border-emerald-500/[0.15] rounded-xl px-3 py-2">
                    <span className="text-[9px] font-black text-emerald-400/70 uppercase tracking-widest leading-none">Hijauan</span>
                    <span className="text-sm font-black text-emerald-300 ml-auto">{stats.hijauan} <span className="text-[10px] font-normal">kg</span></span>
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-blue-500/[0.07] border border-blue-500/[0.15] rounded-xl px-3 py-2">
                    <span className="text-[9px] font-black text-blue-400/70 uppercase tracking-widest leading-none">Konsentrat</span>
                    <span className="text-sm font-black text-blue-300 ml-auto">{stats.konsentrat} <span className="text-[10px] font-normal">kg</span></span>
                  </div>
                </div>
              </div>

              {/* Phase 3 — Section header + CTA */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Sora'] font-bold text-sm text-white">Riwayat Pemberian Pakan</h2>
                {canInputPakan && (
                  <button
                    onClick={() => setShowAdd(true)}
                    className={cn('min-h-[44px] px-4 text-white text-[11px] font-bold rounded-xl transition-colors flex items-center gap-1.5', btnCls)}
                  >
                    <Plus size={14} /> Catat Pakan
                  </button>
                )}
              </div>

              {/* Phase 4+5+6 — Date-grouped, compact feed cards */}
              {logs.length === 0 ? (
                <div className="text-center py-10 bg-white/[0.01] border border-dashed border-white/[0.05] rounded-3xl">
                  <Wheat size={28} className="mx-auto text-[#4B6478] mb-3 opacity-60" />
                  <p className="text-sm font-bold text-white mb-1">Belum ada Catatan Konsumsi Pakan</p>
                  <p className="text-xs text-[#4B6478] mb-4">Catat pemberian pakan hari ini untuk melacak rata-rata konsumsi.</p>
                  {canInputPakan && (
                    <button
                      onClick={() => setShowAdd(true)}
                      className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-xs font-black rounded-xl transition-all"
                    >
                      Beri Pakan Hari Ini
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {feedSortedDates.map(dateKey => (
                    <div key={dateKey}>
                      {/* Date group header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest whitespace-nowrap">
                          {dateKey === 'unknown' ? 'Tanpa Tanggal' : fmtGroupDate(dateKey)}
                        </span>
                        <div className="h-px bg-white/[0.05] flex-1" />
                      </div>
                      {/* Cards for this date */}
                      <div className="space-y-2">
                        {feedDateGroups[dateKey].map(log => {
                          const consumed = getConsumed(log)
                          const sisa = sisakColor(log.feed_orts_category, log.sisa_pakan_kg)
                          return (
                            <div key={log.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-3.5 py-3 transition-all hover:bg-white/[0.05]">
                              {/* Row 1: icon + title + consumed + delete */}
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                  <Wheat size={13} className="text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-white leading-tight truncate">
                                    {log.task_title || log.kandang_name || 'Pemberian Pakan'}
                                  </p>
                                  {isAllBatches && log.batch_id && batchCodeMap[log.batch_id] && (
                                    <p className="text-[9px] text-emerald-400/70 font-bold mt-0.5">{batchCodeMap[log.batch_id]}</p>
                                  )}
                                </div>
                                <p className="text-sm font-black text-white shrink-0">{consumed.toFixed(1)} <span className="text-[10px] font-normal text-[#4B6478]">kg</span></p>
                                {canHapusPakan && hooks.useDeleteFeedLog && (
                                  <button onClick={() => handleDelete(log.id)} className="p-1 text-red-500/20 hover:text-red-500 transition-colors shrink-0 ml-1">
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                              {/* Row 2: breakdown + sisa */}
                              <div className="flex items-center gap-2 mt-2 pl-[2.625rem] flex-wrap">
                                {(log.hijauan_kg || 0) > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-300">🌿 {(log.hijauan_kg).toFixed(1)} kg</span>
                                )}
                                {(log.konsentrat_kg || 0) > 0 && (
                                  <span className="text-[10px] font-bold text-blue-300">🌾 {(log.konsentrat_kg).toFixed(1)} kg</span>
                                )}
                                <span className={cn('text-[10px] font-bold ml-auto shrink-0', sisa.cls)}>Sisa: {sisa.label}</span>
                              </div>
                              {/* Footer: notes */}
                              {log.notes && (
                                <div className="mt-1.5 pl-[2.625rem] flex items-start gap-1.5">
                                  <Info size={10} className="text-[#4B6478] shrink-0 mt-0.5" />
                                  <p className="text-[9px] text-[#4B6478] italic leading-relaxed">{log.notes}</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── BIAYA TAB ── */}
          {activeTab === 'biaya' && config.hasOperationalCosts && (
            <BiayaTab
              costs={costs}
              costStats={costStats}
              batches={batches}
              batchCodeMap={batchCodeMap}
              isAllBatches={isAllBatches}
              selectedBatchId={selectedBatchId}
              canInputBiaya={canInputBiaya}
              canHapusBiaya={canHapusBiaya}
              hasDeleteHook={!!hooks.useDeleteOperationalCost}
              onAddCost={() => setShowAddCost(true)}
              onDeleteCost={handleDeleteCost}
            />
          )}
        </div>
      )}

      {/* ── ADD FEED LOG MODAL ── */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[4000] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-[#06090F]/80 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-[#0C1319] border-t sm:border border-white/[0.06] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col h-[100dvh] min-h-[100dvh] max-h-[100dvh] sm:h-auto sm:min-h-0 sm:max-h-[90vh] overflow-hidden no-scrollbar">
              
              <div className="sticky top-0 shrink-0 bg-[#0C1319] z-10 px-6 py-4 flex items-center justify-between border-b border-white/[0.04]">
                <h3 className="font-['Sora'] font-black text-lg text-white">Input Log Pakan</h3>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="w-11 h-11 -mr-2 flex items-center justify-center text-[#4B6478] hover:text-white transition-colors"
                  aria-label="Tutup form"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar px-6 py-4 space-y-4 pb-28">
                  {isAllBatches && (
                    <div>
                      <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Pilih Batch</label>
                      <select required value={formBatchId || batches[0]?.id} onChange={e => setFormBatchId(e.target.value)}
                        className={cn('w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors', focusCls)}>
                        {batches.map(b => <option key={b.id} value={b.id} className="bg-[#0C1319]">{b.batch_code}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Tanggal Pemberian</label>
                    <input type="date" required value={form.log_date}
                      onChange={e => setForm({ ...form, log_date: e.target.value })}
                      className={cn('w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors', focusCls)} />
                  </div>

                  {config.logSchema === 'kandang' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Nama Kandang *</label>
                        <input type="text" required placeholder="KDG-F2" value={form.kandang_name}
                          onChange={e => setForm({ ...form, kandang_name: e.target.value })}
                          className={cn('w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none transition-colors', focusCls)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Jumlah Ternak *</label>
                        <InputNumber placeholder="12" value={form.animal_count}
                          onChange={val => setForm({ ...form, animal_count: val })}
                          className={cn('bg-white/[0.03] border-white/[0.06] text-white placeholder:text-[#4B6478] focus:border-violet-500/50 transition-colors', focusCls)} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {[['hijauan_kg','Hijauan (kg)'],['konsentrat_kg','Konsentrat (kg)']].map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">{label}</label>
                        <InputNumber step={0.1} placeholder="0.0" value={form[key]} suffix="kg"
                          onChange={val => setForm({ ...form, [key]: val })}
                          className={cn('bg-white/[0.03] border-white/[0.06] text-white placeholder:text-[#4B6478] focus:border-violet-500/50 transition-colors', focusCls)} />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Dedak (kg)</label>
                      <InputNumber step={0.1} placeholder="0.0" value={form.dedak_kg} suffix="kg"
                        onChange={val => setForm({ ...form, dedak_kg: val })}
                        className={cn('bg-white/[0.03] border-white/[0.06] text-white placeholder:text-[#4B6478] focus:border-violet-500/50 transition-colors', focusCls)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-amber-400 uppercase mb-1.5 ml-1 tracking-widest">Sisa Pakan (kg)</label>
                      <InputNumber step={0.1} placeholder="0.0" value={form.sisa_pakan_kg} suffix="kg"
                        onChange={val => setForm({ ...form, sisa_pakan_kg: val })}
                        className={cn('bg-white/[0.03] border-white/[0.06] text-amber-400 placeholder:text-[#4B6478] font-black focus:border-violet-500/50 transition-colors', focusCls)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Lainnya (kg)</label>
                    <InputNumber step={0.1} placeholder="0.0" value={form.other_feed_kg} suffix="kg"
                      onChange={val => setForm({ ...form, other_feed_kg: val })}
                      className={cn('bg-white/[0.03] border-white/[0.06] text-white placeholder:text-[#4B6478] focus:border-violet-500/50 transition-colors', focusCls)} />
                  </div>

                  {config.logSchema === 'kandang' && (
                    <div>
                      <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Biaya Pakan Hari Ini (Rp) <span className="normal-case text-amber-400/70 font-medium">— penting untuk HPP</span></label>
                      <InputRupiah placeholder="0" value={form.feed_cost_idr}
                        onChange={val => setForm({ ...form, feed_cost_idr: val })}
                        className={cn('bg-white/[0.03] border-white/[0.06] text-white placeholder:text-[#4B6478] focus:border-violet-500/50 transition-colors', focusCls)} />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Catatan</label>
                    <textarea placeholder="Catatan pakan..." rows={2} value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      className={cn('w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none resize-none transition-colors', focusCls)} />
                  </div>
                </div>

                <div className="sticky bottom-0 shrink-0 bg-[#0C1319] border-t border-white/[0.04] px-6 py-4 sm:py-6 flex gap-3 z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 min-h-[44px] bg-white/[0.04] hover:bg-white/[0.08] text-[#4B6478] hover:text-white font-bold rounded-2xl transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn('flex-1 min-h-[44px] text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2', btnCls)}
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Log Pakan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADD COST MODAL ── */}
      {config.hasOperationalCosts && (
        <AnimatePresence>
          {showAddCost && (
            <div className="fixed inset-0 z-[4000] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={resetCostForm}
                className="absolute inset-0 bg-[#06090F]/80 backdrop-blur-sm" />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="relative w-full max-w-md bg-[#0C1319] border-t sm:border border-white/[0.06] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col h-[100dvh] min-h-[100dvh] max-h-[100dvh] sm:h-auto sm:min-h-0 sm:max-h-[90vh] overflow-hidden no-scrollbar">
                
                <div className="sticky top-0 shrink-0 bg-[#0C1319] z-10 px-6 py-4 flex items-center justify-between border-b border-white/[0.04]">
                  <h3 className="font-['Sora'] font-black text-lg text-white">Catat Biaya / Belanja</h3>
                  <button
                    type="button"
                    onClick={resetCostForm}
                    className="w-11 h-11 -mr-2 flex items-center justify-center text-[#4B6478] hover:text-white transition-colors"
                    aria-label="Tutup form"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddCost} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar px-6 py-4 space-y-4 pb-28">
                    <div>
                      <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Tanggal</label>
                      <input type="date" value={costForm.log_date}
                        onChange={e => setCostForm({ ...costForm, log_date: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Kategori</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'pakan',        emoji: '🌿', label: 'Pakan',         hint: 'Stok hijauan, konsentrat, dll' },
                          { id: 'listrik_air',  emoji: '💡', label: 'Listrik & Air', hint: 'Tagihan rutin kandang' },
                          { id: 'tenaga_kerja', emoji: '👷', label: 'Tenaga Kerja',  hint: 'Upah & gaji pekerja' },
                          { id: 'lainnya',      emoji: '📦', label: 'Lainnya',       hint: 'Obat-obatan, transportasi, dll' },
                        ].map(c => (
                          <button key={c.id} type="button"
                            onClick={() => setCostForm(f => ({
                              ...f,
                              category: c.id,
                              is_shared: false,
                              unit: c.id === 'pakan' ? 'kg' : '-',
                            }))}
                            className={cn(
                              'flex flex-col gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-all',
                              costForm.category === c.id
                                ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
                                : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478]',
                            )}
                          >
                            <span className="text-sm">{c.emoji}</span>
                            <span className="text-[10px] font-black uppercase tracking-wide leading-tight">{c.label}</span>
                            <span className="text-[9px] font-normal normal-case leading-tight opacity-60">{c.hint}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {isAllBatches && (
                      <div>
                        <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Batch Target</label>
                        {batchTargetLocked ? (
                          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🏠</span>
                              <div>
                                <p className="text-sm font-bold text-white">Seluruh Kandang</p>
                                <p className="text-[10px] text-[#4B6478]">Dibagi proporsional ke semua batch aktif</p>
                              </div>
                            </div>
                            <button type="button"
                              onClick={() => { setBatchTargetLocked(false); setFormBatchId(batches[0]?.id || null); setCostForm(f => ({ ...f, is_shared: false })) }}
                              className="text-[10px] font-black text-violet-400 border border-violet-500/30 bg-violet-500/8 px-2.5 py-1 rounded-lg hover:bg-violet-500/15 transition">
                              🔓 Ubah
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <select value={formBatchId || batches[0]?.id} onChange={e => setFormBatchId(e.target.value)}
                              className="flex-1 bg-white/[0.03] border border-violet-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors">
                              {batches.map(b => <option key={b.id} value={b.id} className="bg-[#0C1319]">{b.kandang_name || b.batch_code}</option>)}
                            </select>
                            <button type="button"
                              onClick={() => { setBatchTargetLocked(true); setFormBatchId(null); setCostForm(f => ({ ...f, is_shared: true })) }}
                              className="px-3 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[#4B6478] hover:text-white hover:border-white/20 transition text-xs font-black">
                              🔒
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {isPakanCost ? (
                      <div className="space-y-3 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Detail Pembelian Pakan</p>
                        <div>
                          <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Jenis Pakan</label>
                          <div className="grid grid-cols-4 gap-2">
                            {[{ id: 'hijauan', label: 'Hijauan', emoji: '🌿' }, { id: 'konsentrat', label: 'Konsentrat', emoji: '🌾' }, { id: 'dedak', label: 'Dedak', emoji: '🟤' }, { id: 'lainnya', label: 'Lainnya', emoji: '📦' }].map(ft => (
                              <button key={ft.id} type="button"
                                onClick={() => setCostForm(f => ({ ...f, feed_type: ft.id, item_name: `Beli Pakan ${ft.label}` }))}
                                className={cn('flex flex-col items-center py-2.5 rounded-xl border text-center transition-all',
                                  costForm.feed_type === ft.id ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478]')}>
                                <span className="text-base mb-1">{ft.emoji}</span>
                                <span className="text-[9px] font-black uppercase tracking-wide">{ft.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Jumlah (kg)</label>
                            <InputNumber step={0.1} placeholder="0" value={costForm.quantity} suffix="kg"
                              onChange={val => {
                                const kg = val
                                const total = Math.round((parseFloat(kg) || 0) * (parseFloat(costForm.harga_per_kg) || 0))
                                setCostForm(f => ({ ...f, quantity: kg, unit: 'kg', amount_idr: total > 0 ? String(total) : f.amount_idr }))
                              }}
                              className="bg-black/30 border-white/[0.06] text-white placeholder:text-[#4B6478] font-bold font-['Sora'] text-right" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Harga / kg (Rp)</label>
                            <InputRupiah placeholder="0" value={costForm.harga_per_kg}
                              onChange={val => {
                                const harga = val
                                const total = Math.round((parseFloat(costForm.quantity) || 0) * (parseFloat(harga) || 0))
                                setCostForm(f => ({ ...f, harga_per_kg: harga, amount_idr: total > 0 ? String(total) : f.amount_idr }))
                              }}
                              className="w-full bg-black/30 border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:border-emerald-500/50 font-bold transition-colors" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">
                            Total Biaya (Rp) {pakanTotalAuto > 0 && <span className="text-emerald-400 normal-case font-bold">— auto-hitung</span>}
                          </label>
                          <InputRupiah placeholder="0"
                            value={pakanTotalAuto > 0 ? pakanTotalAuto : costForm.amount_idr}
                            onChange={val => setCostForm(f => ({ ...f, amount_idr: String(val) }))}
                            className="w-full bg-black/30 border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:border-emerald-500/50 font-black transition-colors" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">
                            {costForm.category === 'tenaga_kerja' ? 'Nama / Keterangan Upah' : 'Nama / Keterangan'}
                          </label>
                          <input type="text" required
                            placeholder={
                              costForm.category === 'tenaga_kerja' ? 'Contoh: Upah kandang, gaji mingguan...'
                              : costForm.category === 'listrik_air' ? 'Contoh: Tagihan listrik Mei...'
                              : 'Keterangan biaya...'
                            }
                            value={costForm.item_name}
                            onChange={e => setCostForm({ ...costForm, item_name: e.target.value })}
                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">
                            Total Biaya (Rp)
                          </label>
                          <InputRupiah
                            placeholder={costForm.category === 'tenaga_kerja' ? 'Contoh: 150000' : 'Contoh: 500000'}
                            value={costForm.amount_idr}
                            onChange={val => setCostForm({ ...costForm, amount_idr: val })}
                            className="w-full bg-white/[0.03] border-white/[0.06] text-white placeholder:text-[#4B6478] focus:border-violet-500/50 font-bold transition-colors" />
                        </div>
                      </>
                    )}

                    {batches.length > 1 && (
                      <div>
                        <label className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl cursor-pointer hover:bg-white/[0.05] transition">
                          <div className="flex items-center gap-2">
                            <Share2 size={14} className={costForm.is_shared ? 'text-violet-400' : 'text-[#4B6478]'} />
                            <div>
                              <p className="text-xs font-black text-white">Biaya Bersama</p>
                              <p className="text-[10px] text-[#4B6478]">Bagi proporsional ke semua batch aktif</p>
                            </div>
                          </div>
                          <div
                            onClick={() => setCostForm(f => ({ ...f, is_shared: !f.is_shared }))}
                            className={cn('w-11 h-6 rounded-full border flex items-center relative transition-all duration-300 cursor-pointer',
                              costForm.is_shared ? 'bg-violet-600 border-violet-500' : 'bg-white/10 border-white/20')}>
                            <div className={cn('w-4 h-4 bg-white rounded-full shadow absolute transition-all duration-300', costForm.is_shared ? 'left-[26px]' : 'left-1')} />
                          </div>
                        </label>

                        {costForm.is_shared && costForm.amount_idr && (
                          <div className="mt-2 bg-violet-500/5 border border-violet-500/15 rounded-xl p-3 space-y-1.5">
                            <p className="text-[9px] font-black text-violet-400/70 uppercase tracking-widest mb-2">Preview Alokasi</p>
                            {(() => {
                              const total = parseInt(costForm.amount_idr) || 0
                              const totalAnimals = batches.reduce((s, b) => s + (b.total_animals || 0), 0)
                              return batches.map((b, i) => {
                                const proportion = totalAnimals > 0 ? (b.total_animals || 0) / totalAnimals : 1 / batches.length
                                const allocated = i === batches.length - 1
                                  ? total - batches.slice(0, -1).reduce((s, bb) => {
                                      const p = totalAnimals > 0 ? (bb.total_animals || 0) / totalAnimals : 1 / batches.length
                                      return s + Math.round(total * p)
                                    }, 0)
                                  : Math.round(total * proportion)
                                return (
                                  <div key={b.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={cn('text-[10px] font-black', b.id === activeBatch?.id ? 'text-white' : 'text-[#4B6478]')}>{b.batch_code}</span>
                                      <span className="text-[9px] text-[#4B6478]">{b.total_animals || 0} ekor · {Math.round(proportion * 100)}%</span>
                                    </div>
                                    <span className="text-[11px] font-black text-violet-300">Rp {allocated.toLocaleString('id-ID')}</span>
                                  </div>
                                )
                              })
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {!isPakanCost && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Jumlah (Opsional)</label>
                          <InputNumber step={0.1} placeholder="0.0" value={costForm.quantity}
                            onChange={val => setCostForm({ ...costForm, quantity: val })}
                            className="bg-white/[0.03] border-white/[0.06] text-white placeholder:text-[#4B6478] focus:border-violet-500/50 transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Satuan</label>
                          <input type="text" placeholder="sak / kg / ml" value={costForm.unit}
                            onChange={e => setCostForm({ ...costForm, unit: e.target.value })}
                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="sticky bottom-0 shrink-0 bg-[#0C1319] border-t border-white/[0.04] px-6 py-4 sm:py-6 flex gap-3 z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
                    <button
                      type="button"
                      onClick={resetCostForm}
                      className="flex-1 min-h-[44px] bg-white/[0.04] hover:bg-white/[0.08] text-[#4B6478] hover:text-white font-bold rounded-2xl transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 min-h-[44px] bg-violet-600 hover:bg-violet-500 disabled:bg-white/[0.03] disabled:text-[#4B6478] text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan Biaya'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
