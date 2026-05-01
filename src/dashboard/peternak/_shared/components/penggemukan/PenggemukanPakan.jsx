import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Wheat, Calendar, Info, Trash2, ArrowLeft, Share2,
  Receipt, Wallet, TrendingUp, Package,
} from 'lucide-react'
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

  const { data: allCosts = [], isLoading: loadingAllCosts } = useOperationalCostsByBatches(isAllBatches ? allBatchIds : [])
  const { data: singleCosts = [], isLoading: loadingSingleCosts } = useOperationalCosts(isAllBatches ? null : selectedBatchId)
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
    const total = costs.reduce((s, c) => s + Number(c.amount_idr || 0), 0)
    const pakan = costs.filter(c => c.category === 'pakan').reduce((s, c) => s + Number(c.amount_idr || 0), 0)
    const groups = {}
    costs.forEach(c => {
      const d = new Date(c.log_date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      if (!groups[key]) groups[key] = { label, total: 0, items: [] }
      groups[key].total += Number(c.amount_idr || 0)
      groups[key].items.push(c)
    })
    return {
      total, pakan,
      monthlySummary: Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([, d]) => d),
    }
  }, [costs])

  const targetBatch = formBatchId ? batches.find(b => b.id === formBatchId) : activeBatch

  const handleSubmit = async (e) => {
    e.preventDefault()
    const batchForSubmit = targetBatch || batches[0]
    if (!batchForSubmit) return
    if (config.logSchema === 'kandang' && (!form.kandang_name || !form.animal_count)) {
      toast.error('Isi nama kandang dan jumlah ternak')
      return
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
    setIsSubmitting(true)
    const finalAmount = isPakanCost && pakanTotalAuto > 0 ? pakanTotalAuto : (parseInt(costForm.amount_idr) || 0)
    const autoItemName = isPakanCost
      ? `Beli Pakan ${costForm.feed_type.charAt(0).toUpperCase() + costForm.feed_type.slice(1)}`
      : costForm.item_name
    const basePayload = {
      log_date: costForm.log_date,
      item_name: autoItemName || costForm.item_name,
      category: costForm.category,
      quantity: parseFloat(costForm.quantity) || 0,
      unit: isPakanCost ? 'kg' : costForm.unit,
      notes: isPakanCost && costForm.harga_per_kg
        ? `Rp ${Number(costForm.harga_per_kg).toLocaleString('id-ID')}/kg${costForm.notes ? ' · ' + costForm.notes : ''}`
        : costForm.notes,
    }
    try {
      if (costForm.is_shared && batches.length > 1) {
        const totalAnimals = batches.reduce((s, b) => s + (b.total_animals || 0), 0)
        if (totalAnimals === 0) {
          await addCost.mutateAsync({ batch_id: batchForCost.id, ...basePayload, amount_idr: finalAmount })
        } else {
          let remaining = finalAmount
          for (let i = 0; i < batches.length; i++) {
            const b = batches[i]
            const proportion = (b.total_animals || 0) / totalAnimals
            const allocated = i === batches.length - 1 ? remaining : Math.round(finalAmount * proportion)
            remaining -= allocated
            if (allocated > 0) await addCost.mutateAsync({ batch_id: b.id, ...basePayload, amount_idr: allocated })
          }
        }
      } else {
        await addCost.mutateAsync({ batch_id: batchForCost.id, ...basePayload, amount_idr: finalAmount })
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

  const accent = config.accentColorClass || 'bg-green-600 border-green-500 text-white'
  const focusCls = config.accentFocusClass || 'focus:border-green-500/50'
  const btnCls = config.buttonClass || 'bg-green-600 hover:bg-green-500'

  return (
    <div className="text-slate-100 pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#4B6478] hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-['Sora'] font-black text-xl text-white">{config.pageTitle}</h1>
        </div>

        {batches.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
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
        )}

        {/* Tabs — only if operational costs are enabled */}
        {canViewBiayaTab && (
          <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl mt-4 border border-white/[0.06]">
            {[['konsumsi','Log Konsumsi'],['biaya','Belanja & Biaya']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn('flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all',
                  activeTab === id ? 'bg-white/10 text-white' : 'text-[#4B6478] hover:text-white/60')}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {batches.length === 0 ? (
        <div className="px-4 py-20 text-center">
          <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
            <Wheat size={24} className="text-[#4B6478]" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Belum Ada Batch Aktif</p>
          <p className="text-xs text-[#4B6478]">Kamu perlu memiliki batch aktif untuk mencatat pakan</p>
        </div>
      ) : (
        <div className="px-4 mt-6">

          {/* ── KONSUMSI TAB ── */}
          {activeTab === 'konsumsi' && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-green-600/[0.05] border border-green-600/10 rounded-2xl p-4">
                  <p className="text-[10px] text-green-500/60 font-bold uppercase tracking-wider mb-1">Total Konsumsi</p>
                  <p className="text-xl font-black text-white font-['Sora']">{stats.total} <span className="text-xs font-normal text-[#4B6478]">kg</span></p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                  <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-wider mb-1">Rata-rata/Hari</p>
                  <p className="text-xl font-black text-white font-['Sora']">{stats.avg} <span className="text-xs font-normal text-[#4B6478]">kg</span></p>
                </div>
                <div className="bg-emerald-600/[0.04] border border-emerald-600/10 rounded-2xl p-4">
                  <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-wider mb-1">Total Hijauan</p>
                  <p className="text-xl font-black text-white font-['Sora']">{stats.hijauan} <span className="text-xs font-normal text-[#4B6478]">kg</span></p>
                </div>
                <div className="bg-blue-600/[0.04] border border-blue-600/10 rounded-2xl p-4">
                  <p className="text-[10px] text-blue-500/60 font-bold uppercase tracking-wider mb-1">Total Konsentrat</p>
                  <p className="text-xl font-black text-white font-['Sora']">{stats.konsentrat} <span className="text-xs font-normal text-[#4B6478]">kg</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Sora'] font-bold text-sm text-white">Riwayat Pemberian Pakan</h2>
                {canInputPakan && (
                  <button
                    onClick={() => setShowAdd(true)}
                    className={cn('px-3 py-1.5 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5', btnCls)}
                  >
                    <Plus size={14} /> Catat Pakan
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {logs.length === 0 ? (
                  <p className="text-center py-8 text-xs text-[#4B6478]">Belum ada catatan pakan untuk batch ini</p>
                ) : logs.map(log => (
                  <div key={log.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 transition-all hover:bg-white/[0.05]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                          <Calendar size={14} className="text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            {new Date(log.log_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-[#4B6478]">
                            {isAllBatches && log.batch_id && batchCodeMap[log.batch_id] && (
                              <span className="text-emerald-400/80 mr-1">{batchCodeMap[log.batch_id]} ·</span>
                            )}
                            {log.kandang_name ? `${log.kandang_name} · ` : ''}{log.created_by_name || 'Tim'}
                          </p>
                        </div>
                      </div>
                      {canHapusPakan && hooks.useDeleteFeedLog && (
                        <button onClick={() => handleDelete(log.id)} className="p-1.5 text-red-500/40 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 py-2 border-t border-white/[0.04]">
                      <div>
                        <p className="text-[9px] text-[#4B6478] mb-0.5 font-bold uppercase tracking-widest">Hijauan</p>
                        <p className="text-xs font-bold text-emerald-300">{(log.hijauan_kg || 0).toFixed(1)} kg</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#4B6478] mb-0.5 font-bold uppercase tracking-widest">Konsentrat</p>
                        <p className="text-xs font-bold text-blue-300">{(log.konsentrat_kg || 0).toFixed(1)} kg</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-[#4B6478] mb-0.5 font-bold uppercase tracking-widest">Sisa</p>
                        {log.feed_orts_category === 'habis' ? <p className="text-xs font-bold text-emerald-400">👍 Habis</p>
                        : log.feed_orts_category === 'sedikit' ? <p className="text-xs font-bold text-amber-400">🟡 Sedikit</p>
                        : log.feed_orts_category === 'banyak' ? <p className="text-xs font-bold text-rose-400">🔴 Banyak</p>
                        : <p className="text-xs font-bold text-amber-400">{(log.sisa_pakan_kg || 0).toFixed(1)} kg</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-[#4B6478] mb-0.5 font-bold uppercase tracking-widest">Konsumsi</p>
                        <p className="text-xs font-bold text-green-400">{getConsumed(log).toFixed(1)} kg</p>
                      </div>
                    </div>

                    {log.notes && (
                      <div className="mt-2 flex items-start gap-2 p-2 bg-white/[0.02] rounded-lg">
                        <Info size={12} className="text-[#4B6478] shrink-0 mt-0.5" />
                        <p className="text-[10px] text-[#4B6478] italic leading-relaxed">{log.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── BIAYA TAB ── */}
          {activeTab === 'biaya' && config.hasOperationalCosts && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-violet-600/[0.05] border border-violet-600/10 rounded-2xl p-4">
                  <p className="text-[10px] text-violet-500/60 font-bold uppercase tracking-wider mb-1">Total Biaya</p>
                  <p className="text-xl font-black text-white font-['Sora']">Rp {costStats.total.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-amber-600/[0.05] border border-amber-600/10 rounded-2xl p-4">
                  <p className="text-[10px] text-amber-500/60 font-bold uppercase tracking-wider mb-1">Khusus Pakan</p>
                  <p className="text-xl font-black text-white font-['Sora']">Rp {costStats.pakan.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="font-['Sora'] font-bold text-sm text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-violet-400" /> Alokasi Biaya Bulanan
                </h2>
                <div className="space-y-2">
                  {costStats.monthlySummary.length === 0 ? (
                    <p className="text-xs text-[#4B6478] italic">Belum ada data biaya bulanan</p>
                  ) : costStats.monthlySummary.map(group => (
                    <div key={group.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-[#4B6478] font-bold uppercase">{group.label}</p>
                        <p className="text-xs text-white font-bold">{group.items.length} Transaksi</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">Rp {group.total.toLocaleString('id-ID')}</p>
                        <p className="text-[9px] text-[#4B6478] font-bold uppercase tracking-tighter">TOTAL BULAN INI</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Sora'] font-bold text-sm text-white flex items-center gap-2">
                  <Receipt size={16} className="text-[#4B6478]" /> Riwayat Belanja & Operasional
                </h2>
                {canInputBiaya && (
                  <button
                    onClick={() => setShowAddCost(true)}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Tambah Biaya
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {costs.length === 0 ? (
                  <div className="text-center py-12 bg-white/[0.01] border border-dashed border-white/[0.06] rounded-3xl">
                    <Wallet size={32} className="mx-auto text-white/5 mb-3" />
                    <p className="text-xs text-[#4B6478]">Belum ada catatan belanja barang atau pakan</p>
                  </div>
                ) : costs.map(cost => (
                  <div key={cost.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center border',
                          cost.category === 'pakan' ? 'bg-green-500/10 border-green-500/20' : 'bg-violet-500/10 border-violet-500/20')}>
                          {cost.category === 'pakan'
                            ? <Package size={14} className="text-green-400" />
                            : <Receipt size={14} className="text-violet-400" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{cost.item_name}</p>
                          <p className="text-[10px] text-[#4B6478] uppercase font-bold tracking-widest">
                            {isAllBatches && cost.batch_id && batchCodeMap[cost.batch_id] && (
                              <span className="text-emerald-400/80 mr-1">{batchCodeMap[cost.batch_id]} · </span>
                            )}
                            {cost.category} · {new Date(cost.log_date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      {canHapusBiaya && hooks.useDeleteOperationalCost && (
                        <button onClick={() => handleDeleteCost(cost.id, cost.batch_id)} className="p-1 text-red-500/30 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-end justify-between pt-2 border-t border-white/[0.04]">
                      <div className="text-[10px] text-[#4B6478]">{cost.quantity ? `${cost.quantity} ${cost.unit || ''}` : '-'}</div>
                      <p className="text-sm font-black text-white">Rp {Number(cost.amount_idr).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ADD FEED LOG MODAL ── */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[4000] flex items-end justify-center sm:items-center sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-[#06090F]/80 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-[#0C1319] border-t sm:border border-white/[0.06] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-['Sora'] font-black text-lg text-white">Input Log Pakan</h3>
                <button onClick={() => setShowAdd(false)} className="p-2 -mr-2 text-[#4B6478]"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      <input type="number" required placeholder="12" value={form.animal_count}
                        onChange={e => setForm({ ...form, animal_count: e.target.value })}
                        className={cn('w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none transition-colors', focusCls)} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {[['hijauan_kg','Hijauan (kg)'],['konsentrat_kg','Konsentrat (kg)']].map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">{label}</label>
                      <input type="number" step="0.1" placeholder="0.0" value={form[key]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        className={cn('w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none transition-colors', focusCls)} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Dedak (kg)</label>
                    <input type="number" step="0.1" placeholder="0.0" value={form.dedak_kg}
                      onChange={e => setForm({ ...form, dedak_kg: e.target.value })}
                      className={cn('w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none transition-colors', focusCls)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-400 uppercase mb-1.5 ml-1 tracking-widest">Sisa Pakan (kg)</label>
                    <input type="number" step="0.1" placeholder="0.0" value={form.sisa_pakan_kg}
                      onChange={e => setForm({ ...form, sisa_pakan_kg: e.target.value })}
                      className={cn('w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-amber-400 placeholder:text-[#4B6478] font-black focus:outline-none transition-colors', focusCls)} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Lainnya (kg)</label>
                  <input type="number" step="0.1" placeholder="0.0" value={form.other_feed_kg}
                    onChange={e => setForm({ ...form, other_feed_kg: e.target.value })}
                    className={cn('w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none transition-colors', focusCls)} />
                </div>

                {config.logSchema === 'kandang' && (
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Biaya Pakan Hari Ini (Rp)</label>
                    <input type="number" placeholder="Opsional" value={form.feed_cost_idr}
                      onChange={e => setForm({ ...form, feed_cost_idr: e.target.value })}
                      className={cn('w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none transition-colors', focusCls)} />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Catatan</label>
                  <textarea placeholder="Catatan pakan..." rows={2} value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className={cn('w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none resize-none transition-colors', focusCls)} />
                </div>

                <button type="submit" disabled={isSubmitting}
                  className={cn('w-full disabled:bg-white/[0.03] disabled:text-[#4B6478] text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 mt-4', btnCls)}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Log Pakan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADD COST MODAL ── */}
      {config.hasOperationalCosts && (
        <AnimatePresence>
          {showAddCost && (
            <div className="fixed inset-0 z-[4000] flex items-end justify-center sm:items-center sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={resetCostForm}
                className="absolute inset-0 bg-[#06090F]/80 backdrop-blur-sm" />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="relative w-full max-w-md bg-[#0C1319] border-t sm:border border-white/[0.06] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-['Sora'] font-black text-lg text-white">Catat Biaya / Belanja</h3>
                  <button onClick={resetCostForm} className="p-2 -mr-2 text-[#4B6478]"><X size={20} /></button>
                </div>

                <form onSubmit={handleAddCost} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Tanggal</label>
                    <input type="date" value={costForm.log_date}
                      onChange={e => setCostForm({ ...costForm, log_date: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Kategori</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ id: 'pakan', emoji: '🌿', label: 'Pakan' }, { id: 'lainnya', emoji: '📦', label: 'Lainnya' }].map(c => (
                        <button key={c.id} type="button"
                          onClick={() => setCostForm(f => ({ ...f, category: c.id, is_shared: false, unit: c.id === 'pakan' ? 'kg' : f.unit }))}
                          className={cn('flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-left transition-all',
                            costForm.category === c.id ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478]')}>
                          <span className="text-sm">{c.emoji}</span>
                          <span className="text-[10px] font-black uppercase tracking-wide">{c.label}</span>
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
                          <input type="number" step="0.1" placeholder="0" value={costForm.quantity}
                            onChange={e => {
                              const kg = e.target.value
                              const total = Math.round((parseFloat(kg) || 0) * (parseFloat(costForm.harga_per_kg) || 0))
                              setCostForm(f => ({ ...f, quantity: kg, unit: 'kg', amount_idr: total > 0 ? String(total) : f.amount_idr }))
                            }}
                            className="w-full bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-emerald-500/50 font-bold transition-colors" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Harga / kg (Rp)</label>
                          <input type="number" placeholder="0" value={costForm.harga_per_kg}
                            onChange={e => {
                              const harga = e.target.value
                              const total = Math.round((parseFloat(costForm.quantity) || 0) * (parseFloat(harga) || 0))
                              setCostForm(f => ({ ...f, harga_per_kg: harga, amount_idr: total > 0 ? String(total) : f.amount_idr }))
                            }}
                            className="w-full bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-emerald-500/50 font-bold transition-colors" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">
                          Total Biaya (Rp) {pakanTotalAuto > 0 && <span className="text-emerald-400 normal-case font-bold">— auto-hitung</span>}
                        </label>
                        <input type="number" required placeholder="0"
                          value={pakanTotalAuto > 0 ? pakanTotalAuto : costForm.amount_idr}
                          onChange={e => setCostForm(f => ({ ...f, amount_idr: e.target.value }))}
                          className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-emerald-500/50 font-black transition-colors" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Nama / Keterangan</label>
                        <input type="text" required placeholder="Keterangan biaya..." value={costForm.item_name}
                          onChange={e => setCostForm({ ...costForm, item_name: e.target.value })}
                          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Total Biaya (Rp)</label>
                        <input type="number" required placeholder="Contoh: 500000" value={costForm.amount_idr}
                          onChange={e => setCostForm({ ...costForm, amount_idr: e.target.value })}
                          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-violet-500/50 font-bold transition-colors" />
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
                        <input type="number" step="0.1" placeholder="0.0" value={costForm.quantity}
                          onChange={e => setCostForm({ ...costForm, quantity: e.target.value })}
                          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest">Satuan</label>
                        <input type="text" placeholder="sak / kg / ml" value={costForm.unit}
                          onChange={e => setCostForm({ ...costForm, unit: e.target.value })}
                          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors" />
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting}
                    className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-white/[0.03] disabled:text-[#4B6478] text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 mt-4">
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan Biaya'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
