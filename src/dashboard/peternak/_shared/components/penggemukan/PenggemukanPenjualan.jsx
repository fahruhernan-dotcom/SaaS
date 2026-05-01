import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, TrendingUp, DollarSign, Users, AlertCircle,
  Plus, X, ChevronRight, ChevronDown, ChevronLeft, Check, CheckCircle2, Clock,
  Calendar, FileText, ArrowLeft, Filter, Package,
  Tag, Phone, CreditCard, Scale, Calculator,
  TrendingDown, ArrowUpDown, ChevronUp, ListMinus
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Lock, Unlock, Trash2, Save } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'

// ── ACCENT THEME ──────────────────────────────────────────────────────────────

const ACCENT = {
  green: {
    btn: 'bg-emerald-600 hover:bg-emerald-500',
    btnShadow: 'shadow-[0_4px_20px_rgba(16,185,129,0.25)]',
    text: 'text-emerald-400',
    labelText: 'text-emerald-400/80',
    selectActive: 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400',
    preview: 'bg-emerald-500/5 border-emerald-500/15',
    totalGradient: 'from-emerald-900/40 to-green-900/30 border-emerald-500/20',
    totalText: 'text-emerald-400',
    step: 'bg-emerald-600',
    stepDone: 'bg-emerald-600/30 text-emerald-400',
    stepBar: 'bg-emerald-600/40',
    focus: 'focus:border-emerald-500/40',
    inputCls: 'focus:border-emerald-500/40',
  },
  amber: {
    btn: 'bg-amber-500 hover:bg-amber-400',
    btnShadow: 'shadow-[0_4px_20px_rgba(245,158,11,0.25)]',
    text: 'text-amber-400',
    labelText: 'text-amber-400/80',
    selectActive: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
    preview: 'bg-amber-500/5 border-amber-500/15',
    totalGradient: 'from-amber-900/40 to-orange-900/30 border-amber-500/20',
    totalText: 'text-amber-400',
    step: 'bg-amber-500',
    stepDone: 'bg-amber-500/30 text-amber-400',
    stepBar: 'bg-amber-500/40',
    focus: 'focus:border-amber-500/40',
    inputCls: 'focus:border-amber-500/40',
  },
}

// ── STABLE STUBS ──────────────────────────────────────────────────────────────

const _emptyMutate = () => ({ mutate: () => {}, mutateAsync: async () => {}, isPending: false })
const _emptyHook = () => ({ data: null, isLoading: false })

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const BUYER_TYPES = ['Pedagang', 'RPH', 'Konsumer Langsung', 'Eksportir', 'Lainnya']
const PRICE_TYPES = [
  { value: 'per_ekor', label: 'Per Ekor' },
  { value: 'per_kg', label: 'Per Kg (Live Weight)' },
]
const PAYMENT_METHODS = ['Cash', 'Transfer', 'Hutang']

const fmt = (n) => Math.round(n).toLocaleString('id-ID')

// ── HPP PANEL ─────────────────────────────────────────────────────────────────

function HppPanel({ batchId, useHppBatch }) {
  const [expanded, setExpanded] = useState(false)
  const hpp = useHppBatch(batchId)

  if (hpp.isLoading) return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 animate-pulse h-20" />
  )

  const { totalModalBeli, totalBiayaPakan, totalBiayaOps, totalHpp,
    aktifCount, terjualCount, matiCount, totalPendapatan,
    hppPerEkor, bepPerEkor, bepSisa, profitLoss, produksiCount,
    kgPakanTotal, hargaRataPerKg } = hpp

  const isProfitable = profitLoss >= 0
  const hasRevenue = totalPendapatan > 0
  const costParts = [
    { label: 'Modal Beli', value: totalModalBeli, color: 'bg-blue-500' },
    { label: 'Biaya Pakan', value: totalBiayaPakan, color: 'bg-emerald-500' },
    { label: 'Biaya Ops', value: totalBiayaOps, color: 'bg-violet-500' },
  ]
  const totalForBar = totalHpp || 1

  return (
    <div className="bg-[#0C1421] border border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Calculator size={14} className="text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest leading-none">Kalkulasi HPP</p>
            <p className="text-sm font-black text-white font-['Sora']">Rp {fmt(totalHpp)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasRevenue && (
            <div className={cn(
              'px-2 py-1 rounded-lg text-[10px] font-black border',
              isProfitable
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            )}>
              {isProfitable ? '+' : ''}Rp {fmt(Math.abs(profitLoss))}
            </div>
          )}
          {expanded ? <ChevronUp size={14} className="text-[#4B6478]" /> : <ChevronDown size={14} className="text-[#4B6478]" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/[0.05]">

              {/* Cost breakdown bar */}
              <div className="pt-3">
                <div className="flex h-2 rounded-full overflow-hidden gap-px mb-3">
                  {costParts.map(p => (
                    <div
                      key={p.label}
                      className={p.color}
                      style={{ width: `${(p.value / totalForBar) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {costParts.map(p => (
                    <div key={p.label} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5">
                      <div className={cn('w-2 h-2 rounded-full mb-1.5', p.color)} />
                      <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">{p.label}</p>
                      <p className="text-xs font-black text-white">Rp {fmt(p.value)}</p>
                      <p className="text-[9px] text-[#4B6478]">{totalHpp > 0 ? Math.round((p.value / totalHpp) * 100) : 0}%</p>
                      {p.label === 'Biaya Pakan' && hargaRataPerKg > 0 && (
                        <p className="text-[9px] text-emerald-400/70 mt-1 leading-tight">
                          {kgPakanTotal.toFixed(1)} kg × Rp {fmt(hargaRataPerKg)}/kg
                        </p>
                      )}
                      {p.label === 'Biaya Pakan' && hargaRataPerKg === 0 && (
                        <p className="text-[9px] text-[#4B6478]/60 mt-1 leading-tight italic">Catat beli pakan dulu</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                  <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1">HPP / Ekor</p>
                  <p className="text-sm font-black text-white font-['Sora']">Rp {fmt(hppPerEkor)}</p>
                  <p className="text-[9px] text-[#4B6478] mt-0.5">{produksiCount} ekor</p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                  <p className="text-[9px] font-black text-amber-400/70 uppercase tracking-widest mb-1">BEP / Ekor</p>
                  <p className="text-sm font-black text-amber-300 font-['Sora']">Rp {fmt(bepPerEkor)}</p>
                  <p className="text-[9px] text-[#4B6478] mt-0.5">HPP +20% margin</p>
                </div>
                <div className={cn(
                  'rounded-xl p-3 border',
                  aktifCount > 0
                    ? 'bg-orange-500/5 border-orange-500/15'
                    : 'bg-white/[0.02] border-white/[0.05]'
                )}>
                  <p className="text-[9px] font-black text-orange-400/70 uppercase tracking-widest mb-1">BEP Sisa</p>
                  <p className={cn('text-sm font-black font-["Sora"]', aktifCount > 0 ? 'text-orange-300' : 'text-[#4B6478]')}>
                    {aktifCount > 0 ? `Rp ${fmt(bepSisa)}` : '—'}
                  </p>
                  <p className="text-[9px] text-[#4B6478] mt-0.5">{aktifCount} ekor sisa</p>
                </div>
              </div>

              {/* Status ekor */}
              <div className="flex gap-2">
                {[
                  { label: 'Aktif', count: aktifCount, color: 'text-emerald-400' },
                  { label: 'Terjual', count: terjualCount, color: 'text-blue-400' },
                  { label: 'Mati/Afkir', count: matiCount, color: 'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-xl p-2 text-center">
                    <p className={cn('text-sm font-black', s.color)}>{s.count}</p>
                    <p className="text-[9px] text-[#4B6478] uppercase font-bold tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* BEP sisa explanation */}
              {aktifCount > 0 && bepSisa > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 flex gap-2">
                  <ArrowUpDown size={12} className="text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#4B6478] leading-relaxed">
                    Jual <span className="text-white font-black">{aktifCount} ekor sisa</span> minimal{' '}
                    <span className="text-orange-300 font-black">Rp {fmt(bepSisa)}/ekor</span> untuk menutup semua biaya + target margin 20%.
                  </p>
                </div>
              )}

              {aktifCount === 0 && hasRevenue && (
                <div className={cn(
                  'p-3 rounded-xl flex gap-2 border',
                  isProfitable ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/15'
                )}>
                  {isProfitable ? <TrendingUp size={12} className="text-emerald-400 shrink-0 mt-0.5" /> : <TrendingDown size={12} className="text-red-400 shrink-0 mt-0.5" />}
                  <p className={cn('text-[10px] leading-relaxed', isProfitable ? 'text-emerald-300' : 'text-red-300')}>
                    {isProfitable
                      ? `Batch ini untung Rp ${fmt(profitLoss)} dari seluruh penjualan.`
                      : `Batch ini rugi Rp ${fmt(Math.abs(profitLoss))}. Pendapatan tidak menutup HPP.`}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── MARGIN ANALYZER (inside SaleSheet Step 2) ─────────────────────────────────

function MarginAnalyzer({ bepSisa, pricePerEkor }) {
  if (!bepSisa || bepSisa === 0) return null

  const margin = pricePerEkor > 0 ? ((pricePerEkor - bepSisa) / bepSisa) * 100 : null
  const diff = pricePerEkor - bepSisa

  const status =
    margin === null ? 'idle'
    : margin >= 15 ? 'good'
    : margin >= 0 ? 'warning'
    : 'danger'

  const statusCfg = {
    idle:    { bg: 'bg-white/[0.02]',      border: 'border-white/[0.06]',    label: '—',          icon: ArrowUpDown, iconColor: 'text-[#4B6478]' },
    good:    { bg: 'bg-emerald-500/5',     border: 'border-emerald-500/20',  label: 'Untung',     icon: TrendingUp,  iconColor: 'text-emerald-400' },
    warning: { bg: 'bg-amber-500/5',       border: 'border-amber-500/20',    label: 'Tipis',      icon: ArrowUpDown, iconColor: 'text-amber-400' },
    danger:  { bg: 'bg-red-500/5',         border: 'border-red-500/20',      label: 'Rugi',       icon: TrendingDown, iconColor: 'text-red-400' },
  }[status]

  const Icon = statusCfg.icon

  return (
    <div className={cn('rounded-2xl p-4 border', statusCfg.bg, statusCfg.border)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={statusCfg.iconColor} />
        <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Analisis Margin</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] text-[#4B6478] uppercase font-bold tracking-widest mb-1">BEP Sisa</p>
          <p className="text-sm font-black text-orange-300">Rp {fmt(bepSisa)}</p>
          <p className="text-[9px] text-[#4B6478]">min. harga/ekor</p>
        </div>
        <div>
          <p className="text-[9px] text-[#4B6478] uppercase font-bold tracking-widest mb-1">Harga Jual</p>
          <p className={cn('text-sm font-black', pricePerEkor > 0 ? 'text-white' : 'text-[#4B6478]')}>
            {pricePerEkor > 0 ? `Rp ${fmt(pricePerEkor)}` : '—'}
          </p>
        </div>
      </div>
      {margin !== null && (
        <div className={cn(
          'mt-3 pt-3 border-t flex items-center justify-between',
          status === 'good' ? 'border-emerald-500/15' : status === 'warning' ? 'border-amber-500/15' : 'border-red-500/15'
        )}>
          <span className={cn(
            'text-xs font-black',
            status === 'good' ? 'text-emerald-400' : status === 'warning' ? 'text-amber-400' : 'text-red-400'
          )}>
            {statusCfg.label} {diff > 0 ? '+' : ''}Rp {fmt(Math.abs(diff))}/ekor
          </span>
          <span className={cn(
            'text-[11px] font-black px-2 py-1 rounded-lg border',
            status === 'good' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : status === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
          )}>
            {margin > 0 ? '+' : ''}{margin.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}

// ── SALE SHEET (Form Catat Penjualan) ─────────────────────────────────────────

function SaleSheet({ batchId, animals, hppData, onClose, useAddSale, animalLabel, accent }) {
  const [step, setStep] = useState(1)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const { mutate: addSale, isPending } = useAddSale()

  const activeAnimals = useMemo(() => animals.filter(a => a.status === 'active'), [animals])

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      sale_date: new Date().toISOString().split('T')[0],
      buyer_type: 'Pedagang',
      price_type: 'per_ekor',
      payment_method: 'Cash',
      is_paid: true,
      has_skkh: false,
      has_surat_jalan: false,
    }
  })

  const priceType = watch('price_type')
  const priceAmount = watch('price_amount') || 0
  const selectedAnimalsData = useMemo(
    () => activeAnimals.filter(a => selectedIds.has(a.id)),
    [activeAnimals, selectedIds]
  )

  const totalWeightKg = useMemo(
    () => selectedAnimalsData.reduce((s, a) => s + (parseFloat(a.latest_weight_kg ?? a.entry_weight_kg) || 0), 0),
    [selectedAnimalsData]
  )
  const totalRevenue = useMemo(() => {
    const p = parseFloat(priceAmount) || 0
    if (priceType === 'per_ekor') return p * selectedIds.size
    if (priceType === 'per_kg') return p * totalWeightKg
    return 0
  }, [priceType, priceAmount, selectedIds.size, totalWeightKg])

  const pricePerEkor = useMemo(() => {
    const p = parseFloat(priceAmount) || 0
    if (priceType === 'per_ekor') return p
    if (priceType === 'per_kg' && selectedIds.size > 0) return p * (totalWeightKg / selectedIds.size)
    return 0
  }, [priceType, priceAmount, selectedIds.size, totalWeightKg])

  const toggleAnimal = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onSubmit = (data) => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    addSale({
      batch_id: batchId,
      sale_date: data.sale_date,
      buyer_name: data.buyer_name,
      buyer_type: data.buyer_type,
      buyer_contact: data.buyer_contact,
      animal_ids: ids,
      animal_count: ids.length,
      total_weight_kg: totalWeightKg,
      avg_weight_kg: totalWeightKg / ids.length,
      price_type: data.price_type,
      price_amount: parseFloat(data.price_amount) || 0,
      total_revenue_idr: totalRevenue,
      payment_method: data.payment_method,
      is_paid: data.is_paid,
      has_skkh: data.has_skkh,
      has_surat_jalan: data.has_surat_jalan,
      notes: data.notes,
    }, { onSuccess: onClose })
  }

  const labelCls = `block text-[10px] font-black uppercase tracking-[0.2em] ${accent.labelText} mb-2 ml-1`
  const inputCls = `w-full h-11 px-4 bg-[#111C24] border border-white/5 ${accent.inputCls} rounded-xl text-[13px] font-bold text-white placeholder:text-[#4B6478] focus:outline-none transition-all`

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 250 }}
      className="fixed inset-y-0 right-0 w-[440px] max-w-full z-[4000] bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[#4B6478] hover:text-white transition">
                <ArrowLeft size={14} />
              </button>
            )}
            <h2 className="font-['Sora'] font-extrabold text-xl text-white tracking-tight">
              {step === 1 ? `Pilih ${animalLabel}` : 'Detail Transaksi'}
            </h2>
          </div>
          <p className="text-[11px] text-[#4B6478] font-medium">
            {step === 1
              ? `${activeAnimals.length} ekor aktif tersedia · ${selectedIds.size} dipilih`
              : `${selectedIds.size} ekor · ${totalWeightKg.toFixed(1)} kg total`}
          </p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5">
        {[1, 2].map(s => (
          <React.Fragment key={s}>
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all',
              step === s ? `${accent.step} text-white` : step > s ? `${accent.stepDone}` : 'bg-white/5 text-[#4B6478]'
            )}>
              {step > s ? <Check size={12} /> : s}
            </div>
            {s < 2 && <div className={cn('flex-1 h-px', step > s ? accent.stepBar : 'bg-white/10')} />}
          </React.Fragment>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="p-4 space-y-2">
              {activeAnimals.length === 0 ? (
                <div className="py-20 text-center">
                  <Package size={40} className="mx-auto text-white/5 mb-4" />
                  <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Tidak ada {animalLabel.toLowerCase()} aktif</p>
                  <p className="text-[11px] text-[#4B6478] mt-1">Semua {animalLabel.toLowerCase()} sudah terjual atau tidak aktif</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (selectedIds.size === activeAnimals.length) setSelectedIds(new Set())
                      else setSelectedIds(new Set(activeAnimals.map(a => a.id)))
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition"
                  >
                    <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                      selectedIds.size === activeAnimals.length
                        ? `${accent.step} border-transparent` : 'border-white/20'
                    )}>
                      {selectedIds.size === activeAnimals.length && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-[11px] font-black text-[#4B6478] uppercase tracking-widest">Pilih Semua ({activeAnimals.length} Ekor)</span>
                  </button>

                  {activeAnimals.map(a => {
                    const w = parseFloat(a.latest_weight_kg ?? a.entry_weight_kg) || 0
                    const isSelected = selectedIds.has(a.id)
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAnimal(a.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all',
                          isSelected
                            ? `${accent.preview}`
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                        )}
                      >
                        <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                          isSelected ? `${accent.step} border-transparent` : 'border-white/20'
                        )}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white font-['Sora']">{a.ear_tag}</span>
                            <span className="text-[10px] text-[#4B6478] font-medium">{a.breed || '—'}</span>
                          </div>
                          <p className="text-[10px] text-[#4B6478]">{a.sex === 'betina' ? 'Betina' : 'Jantan'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-white">{w.toFixed(1)} <span className="text-[10px] text-[#4B6478]">kg</span></p>
                          {hppData && hppData.bepPerEkor > 0 && (
                            <p className="text-[9px] text-[#4B6478]">BEP Rp {fmt(hppData.bepPerEkor)}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="p-5 space-y-4">

              {/* Preview selected */}
              <div className={cn('rounded-2xl p-4 flex items-center justify-between border', accent.preview)}>
                <div>
                  <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">{animalLabel} Dipilih</p>
                  <p className="text-2xl font-black text-white font-['Sora']">{selectedIds.size} <span className="text-sm text-[#4B6478]">Ekor</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">Total Berat</p>
                  <p className={cn('text-2xl font-black font-["Sora"]', accent.text)}>{totalWeightKg.toFixed(1)} <span className="text-sm text-[#4B6478]">kg</span></p>
                </div>
              </div>

              <form id="sale-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Tanggal */}
                <div>
                  <label className={labelCls}><Calendar size={11} className="inline mr-1" />Tanggal Jual</label>
                  <Controller name="sale_date" control={control} render={({ field }) =>
                    <DatePicker value={field.value} onChange={field.onChange} className="h-11 bg-[#111C24] border-white/5 rounded-xl" />
                  } />
                </div>

                {/* Nama Pembeli */}
                <div>
                  <label className={labelCls}><Users size={11} className="inline mr-1" />Nama Pembeli</label>
                  <input {...register('buyer_name', { required: true })} placeholder="e.g. Pak Budi Santoso" className={inputCls} />
                  {errors.buyer_name && <p className="text-red-400 text-[10px] mt-1 ml-1">Wajib diisi</p>}
                </div>

                {/* Tipe Pembeli */}
                <div>
                  <label className={labelCls}><Tag size={11} className="inline mr-1" />Tipe Pembeli</label>
                  <div className="flex flex-wrap gap-2">
                    {BUYER_TYPES.map(t => (
                      <label key={t}>
                        <input type="radio" {...register('buyer_type')} value={t} className="sr-only" />
                        <span className={cn(
                          'px-3 py-1.5 rounded-xl text-[10px] font-black border cursor-pointer transition-all uppercase tracking-wide',
                          watch('buyer_type') === t
                            ? accent.selectActive
                            : 'bg-white/[0.03] border-white/10 text-[#4B6478] hover:border-white/20'
                        )}>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Kontak */}
                <div>
                  <label className={labelCls}><Phone size={11} className="inline mr-1" />No. HP Pembeli</label>
                  <input {...register('buyer_contact')} placeholder="e.g. 0812-3456-7890" className={inputCls} />
                </div>

                {/* Harga */}
                <div>
                  <label className={labelCls}><Scale size={11} className="inline mr-1" />Tipe Harga</label>
                  <div className="flex gap-2 mb-3">
                    {PRICE_TYPES.map(pt => (
                      <label key={pt.value} className="flex-1">
                        <input type="radio" {...register('price_type')} value={pt.value} className="sr-only" />
                        <span className={cn(
                          'flex items-center justify-center h-10 rounded-xl text-[11px] font-black border cursor-pointer transition-all',
                          watch('price_type') === pt.value
                            ? accent.selectActive
                            : 'bg-white/[0.03] border-white/10 text-[#4B6478] hover:border-white/20'
                        )}>{pt.label}</span>
                      </label>
                    ))}
                  </div>
                  <Controller name="price_amount" control={control}
                    render={({ field }) => (
                      <InputRupiah
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={priceType === 'per_ekor' ? 'Harga per ekor (Rp)' : 'Harga per kg (Rp)'}
                        className="h-11"
                      />
                    )}
                  />
                </div>

                {/* Total Preview */}
                <div className={cn('bg-gradient-to-br rounded-2xl p-4 border', accent.totalGradient)}>
                  <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1', accent.totalText, 'opacity-60')}>Estimasi Total Pendapatan</p>
                  <p className={cn('text-3xl font-black font-["Sora"]', accent.totalText)}>
                    Rp {fmt(totalRevenue)}
                  </p>
                </div>

                {/* Margin Analyzer */}
                {hppData && (
                  <MarginAnalyzer bepSisa={hppData.bepSisa} pricePerEkor={pricePerEkor} />
                )}

                {/* Pembayaran */}
                <div>
                  <label className={labelCls}><CreditCard size={11} className="inline mr-1" />Metode Bayar</label>
                  <div className="flex gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <label key={m} className="flex-1">
                        <input type="radio" {...register('payment_method')} value={m} className="sr-only" />
                        <span className={cn(
                          'flex items-center justify-center h-10 rounded-xl text-[11px] font-black border cursor-pointer transition-all',
                          watch('payment_method') === m
                            ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                            : 'bg-white/[0.03] border-white/10 text-[#4B6478] hover:border-white/20'
                        )}>{m}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status & Dokumen */}
                <div className="space-y-2">
                  {[
                    { name: 'is_paid', label: 'Sudah Lunas', color: 'emerald' },
                    { name: 'has_skkh', label: 'SKKH Tersedia', color: 'blue' },
                    { name: 'has_surat_jalan', label: 'Surat Jalan Tersedia', color: 'blue' },
                  ].map(({ name, label, color }) => (
                    <label key={name} className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl cursor-pointer hover:bg-white/[0.04] transition">
                      <span className="text-xs font-black text-white">{label}</span>
                      <Controller name={name} control={control} render={({ field }) => (
                        <div onClick={() => field.onChange(!field.value)} className={cn(
                          'w-11 h-6 rounded-full border transition-all duration-300 flex items-center relative cursor-pointer',
                          field.value ? `bg-${color}-600 border-${color}-500` : 'bg-white/10 border-white/20'
                        )}>
                          <div className={cn(
                            'w-4 h-4 bg-white rounded-full shadow-lg absolute transition-all duration-300',
                            field.value ? 'left-[26px]' : 'left-1'
                          )} />
                        </div>
                      )} />
                    </label>
                  ))}
                </div>

                {/* Catatan */}
                <div>
                  <label className={labelCls}><FileText size={11} className="inline mr-1" />Catatan</label>
                  <textarea {...register('notes')} rows={2} placeholder="Catatan tambahan..." className={`w-full px-4 py-3 bg-[#111C24] border border-white/5 ${accent.focus} rounded-xl text-[13px] font-medium text-white placeholder:text-[#4B6478] focus:outline-none transition-all resize-none`} />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5 bg-[#0C1319]">
        {step === 1 ? (
          <button
            disabled={selectedIds.size === 0}
            onClick={() => setStep(2)}
            className={cn('w-full h-12 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all', accent.btn, accent.btnShadow)}
          >
            Lanjut ({selectedIds.size} Ekor Dipilih) →
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors">
              Kembali
            </button>
            <button form="sale-form" type="submit" disabled={isPending} className={cn('flex-1 h-12 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all', accent.btn, accent.btnShadow)}>
              {isPending ? 'Menyimpan...' : 'Konfirmasi Jual'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── SALE DETAIL SHEET (Audit & Edit) ──────────────────────────────────────────

function SaleDetailSheet({ sale, onClose, useUpdateSale, useDeleteSale, accent, canEdit }) {
  const perm = usePeternakPermissions()
  const [isLocked, setIsLocked] = useState(true)
  const { mutate: updateSale, isPending: isUpdating } = useUpdateSale()
  const { mutate: deleteSale, isPending: isDeleting } = useDeleteSale()

  const { register, handleSubmit, control, watch, formState: { isDirty } } = useForm({
    defaultValues: {
      buyer_name: sale.buyer_name,
      buyer_type: sale.buyer_type,
      buyer_contact: sale.buyer_contact,
      payment_method: sale.payment_method,
      is_paid: sale.is_paid,
      notes: sale.notes,
      total_revenue_idr: sale.total_revenue_idr,
    }
  })

  const onUpdate = (data) => {
    updateSale({
      saleId: sale.id,
      batch_id: sale.batch_id,
      ...data
    }, { onSuccess: () => { setIsLocked(true); onClose(); } })
  }

  const handleDelete = () => {
    if (window.confirm("Hapus transaksi ini? Status ternak akan kembali menjadi 'AKTIF'.")) {
      deleteSale({
        saleId: sale.id,
        animalIds: sale.animal_ids,
        batchId: sale.batch_id
      }, { onSuccess: onClose })
    }
  }

  const labelCls = "block text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] mb-2 ml-1"
  const inputCls = `w-full h-11 px-4 bg-[#111C24] border border-white/5 ${accent.inputCls} rounded-xl text-[13px] font-bold text-white placeholder:text-[#4B6478] focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      className="fixed inset-y-0 right-0 w-[440px] max-w-full z-[4000] bg-[#0A1015]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
        <div>
          <h2 className="font-['Sora'] font-extrabold text-xl text-white tracking-tight">Detail Transaksi</h2>
          <p className="text-[10px] text-[#4B6478] font-black uppercase tracking-widest mt-1">ID: {sale.id.slice(0,8)}...{sale.id.slice(-4)}</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

        <div className={cn(
          "p-4 rounded-2xl flex items-center justify-between transition-all duration-500",
          isLocked ? "bg-white/[0.03] border border-white/[0.06]" : "bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", isLocked ? "bg-white/5 text-[#4B6478]" : "bg-amber-500 text-white")}>
              {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
            </div>
            <div>
              <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-1">{isLocked ? 'Mode Audit (Terkunci)' : 'Mode Edit Aktif'}</p>
              <p className="text-[10px] text-[#4B6478] font-medium leading-tight">
                {isLocked ? 'Klik tombol gembok untuk mengubah data.' : 'Hati-hati dalam mengubah data riwayat.'}
              </p>
            </div>
          </div>
          {canEdit && perm.canEditPenjualan && (
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95",
                isLocked ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20"
              )}
            >
              {isLocked ? 'BUKA KUNCI' : 'KUNCI'}
            </button>
          )}
        </div>

        <form className="space-y-4">
           <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                 <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">JUMLAH EKOR</p>
                 <p className="text-sm font-black text-white font-['Sora']">{sale.animal_count} Ekor</p>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                 <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">TOTAL BERAT</p>
                 <p className="text-sm font-black text-white font-['Sora']">{sale.total_weight_kg ? Number(sale.total_weight_kg).toFixed(1) : '—'} kg</p>
              </div>
           </div>

           <div className="space-y-4">
              <div>
                <label className={labelCls}>Nama Pembeli</label>
                <input {...register('buyer_name')} disabled={isLocked} className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tipe Pembeli</label>
                  <select {...register('buyer_type')} disabled={isLocked} className={inputCls + " appearance-none"}>
                    {BUYER_TYPES.map(t => <option key={t} value={t} className="bg-[#0C1319]">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Kontak</label>
                  <input {...register('buyer_contact')} disabled={isLocked} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Total Pendapatan (RP)</label>
                <Controller name="total_revenue_idr" control={control} render={({ field }) => (
                  <InputRupiah value={field.value} onChange={field.onChange} disabled={isLocked} className="h-11" />
                )} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className={labelCls}>Metode Bayar</label>
                    <select {...register('payment_method')} disabled={isLocked} className={inputCls + " appearance-none"}>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m} className="bg-[#0C1319]">{m}</option>)}
                    </select>
                 </div>
                 <div className="flex flex-col justify-end">
                    <label className={cn(
                      "flex items-center justify-between px-3 h-11 bg-white/[0.02] border border-white/[0.06] rounded-xl cursor-pointer transition-all",
                      isLocked && "opacity-50 cursor-not-allowed"
                    )}>
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">LUNAS</span>
                       <Controller name="is_paid" control={control} render={({ field }) => (
                         <div onClick={() => !isLocked && field.onChange(!field.value)} className={cn(
                           'w-8 h-4 rounded-full border flex items-center relative transition-all duration-300',
                           field.value ? 'bg-emerald-600 border-emerald-500' : 'bg-white/10 border-white/20'
                         )}>
                           <div className={cn('w-2.5 h-2.5 bg-white rounded-full shadow absolute transition-all duration-300', field.value ? 'left-[18px]' : 'left-0.5')} />
                         </div>
                       )} />
                    </label>
                 </div>
              </div>

              <div>
                <label className={labelCls}>Catatan Transaksi</label>
                <textarea {...register('notes')} disabled={isLocked} rows={2} className={`w-full px-4 py-3 bg-[#111C24] border border-white/5 ${accent.focus} rounded-xl text-[13px] font-medium text-white placeholder:text-[#4B6478] focus:outline-none transition-all resize-none disabled:opacity-50`} />
              </div>
           </div>
        </form>

        {!isLocked && canEdit && (
          <div className="pt-6 border-t border-white/5 space-y-3">
            {perm.canEditPenjualan && (
              <button
                 onClick={handleSubmit(onUpdate)}
                 disabled={isUpdating || !isDirty}
                 className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {isUpdating ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
              </button>
            )}
            {perm.canHapusPenjualan && (
              <button
                 onClick={handleDelete}
                 disabled={isDeleting}
                 className="w-full h-11 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                {isDeleting ? 'MENGHAPUS...' : 'HAPUS TRANSAKSI'}
              </button>
            )}
          </div>
        )}
      </div>

      {isLocked && (
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5">
           <div className="flex items-center gap-2 text-[#4B6478]">
              <Clock size={12} />
              <p className="text-[9px] font-black uppercase tracking-widest">Dibuat: {format(new Date(sale.created_at), "dd MMM yyyy HH:mm", { locale: id })}</p>
           </div>
        </div>
      )}
    </motion.div>
  )
}

// ── TRANSACTION CARD ──────────────────────────────────────────────────────────

function SaleCard({ sale, onClick }) {
  const date = new Date(sale.sale_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(sale)}
      className="bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] rounded-[24px] p-4 cursor-pointer transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={16} className="text-[#4B6478]" />
      </div>

      <div className="flex items-start justify-between mb-3 pr-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-black text-white font-['Sora'] leading-tight">{sale.buyer_name || 'Pembeli'}</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-lg font-black border border-white/10 bg-white/5 text-[#4B6478] uppercase">{sale.buyer_type || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest">{date}</p>
            {sale.batch?.batch_code && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-lg font-black border border-blue-500/20 bg-blue-500/10 text-blue-400 uppercase tracking-tighter">
                {sale.batch.batch_code}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-emerald-400 font-['Sora'] leading-tight">Rp {Number(sale.total_revenue_idr || 0).toLocaleString('id-ID')}</p>
          <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-lg border inline-block mt-1', sale.is_paid ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]')}>
            {sale.is_paid ? 'LUNAS' : 'PIUTANG'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/[0.04]">
        {[
          { label: 'Ekor', value: sale.animal_count || 0 },
          { label: 'Berat', value: sale.total_weight_kg ? `${Number(sale.total_weight_kg).toFixed(1)} kg` : '—' },
          { label: 'Bayar', value: sale.payment_method || '—' },
          { label: 'SKKH', value: sale.has_skkh ? 'Ada' : 'Tidak' },
        ].map(d => (
          <div key={d.label} className="text-center">
            <p className="text-[11px] font-black text-white">{d.value}</p>
            <p className="text-[9px] text-[#4B6478] font-bold uppercase tracking-wider mt-0.5">{d.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export function PenggemukanPenjualan({ config, hooks }) {
  const { BASE, animalLabel, hasHpp, accentTheme } = config
  const accent = ACCENT[accentTheme] ?? ACCENT.green

  // Resolve optional hooks to stable stubs
  const useUpdateSale = hooks.useUpdateSale || _emptyMutate
  const useDeleteSale = hooks.useDeleteSale || _emptyMutate
  const useHppBatch   = hooks.useHppBatch   || _emptyHook

  const canEdit = !!(hooks.useUpdateSale || hooks.useDeleteSale)

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const perm = usePeternakPermissions()
  const [selectedBatchId, setSelectedBatchId] = useState(searchParams.get('batch') || 'all')
  const [showSaleSheet, setShowSaleSheet] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [selectRect, setSelectRect] = useState(null)
  const selectTriggerRef = useRef(null)
  const selectWrapperRef = useRef(null)

  useEffect(() => {
    setSelectedBatchId(searchParams.get('batch') || 'all')
  }, [searchParams])

  useEffect(() => {
    if (!isSelectOpen) return
    const handler = (e) => {
      if (!selectWrapperRef.current?.contains(e.target) && !selectTriggerRef.current?.contains(e.target))
        setIsSelectOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isSelectOpen])

  const { data: batches = [], isLoading: loadBatches } = hooks.useBatches()

  const allBatchIds = useMemo(() => batches.map(b => b.id), [batches])
  const isAllBatches = !selectedBatchId || selectedBatchId === 'all'

  // Data fetching logic: switch between single and multi-batch
  const salesSingle = hooks.useSales(!isAllBatches ? selectedBatchId : null)
  const salesMulti = hooks.useSalesByBatches(isAllBatches ? allBatchIds : [])
  const animalsSingle = hooks.useAnimals(!isAllBatches ? selectedBatchId : null)
  const animalsMulti = hooks.useAnimalsByBatches(isAllBatches ? allBatchIds : [])

  const sales = isAllBatches ? (salesMulti.data || []) : (salesSingle.data || [])
  const animals = isAllBatches ? (animalsMulti.data || []) : (animalsSingle.data || [])
  const loadSales = isAllBatches ? salesMulti.isLoading : salesSingle.isLoading

  const hppData = useHppBatch(!isAllBatches ? selectedBatchId : null)
  const selectedBatch = useMemo(() => batches.find(b => b.id === selectedBatchId), [batches, selectedBatchId])

  const kpi = useMemo(() => {
    const allSales = selectedBatchId ? sales : []
    const total = allSales.reduce((s, t) => s + (parseFloat(t.total_revenue_idr) || 0), 0)
    const ekor = allSales.reduce((s, t) => s + (t.animal_count || 0), 0)
    const piutang = allSales.filter(t => !t.is_paid).reduce((s, t) => s + (parseFloat(t.total_revenue_idr) || 0), 0)
    const avgPerEkor = ekor > 0 ? total / ekor : 0
    return { total, ekor, piutang, avgPerEkor }
  }, [sales, selectedBatchId])

  if (loadBatches) return <LoadingSpinner fullPage />

  if (!perm.canViewPenjualan) {
    return (
      <div className="min-h-screen bg-[#060B0F] flex flex-col items-center justify-center text-center p-6">
        <AlertCircle size={48} className="text-red-500/50 mb-4" />
        <h2 className="text-white font-['Sora'] font-black text-xl mb-2">Akses Ditolak</h2>
        <p className="text-[#4B6478] text-sm">Anda tidak memiliki izin untuk melihat halaman Penjualan.</p>
        <button onClick={() => navigate(BASE + '/beranda')} className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors">
          Kembali ke Beranda
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060B0F] pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h1 className="font-['Sora'] font-black text-[22px] leading-tight text-white tracking-tight uppercase">
              Penjualan
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-[#4B6478] font-['Plus_Jakarta_Sans'] font-bold tracking-wider uppercase mt-0.5">
              <span className="flex items-center gap-1">
                <span className="text-[#00F5FF]">{animals.filter(a => a.status === 'active').length}</span> AKTIF
              </span>
              <span className="text-white/10">•</span>
              <span className="flex items-center gap-1">
                <span className="text-white">{animals.length}</span> TERDAFTAR
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {perm.canInputPenjualan && (
              <>
                <button
                  disabled={isAllBatches || selectedBatch?.status !== 'active'}
                  title={isAllBatches ? 'Pilih batch spesifik untuk menjual banyak' : selectedBatch?.status !== 'active' ? 'Batch sudah selesai' : 'Jual Banyak'}
                  onClick={() => { setSelectedSale(null); setShowSaleSheet(true) }}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-[#4B6478] hover:text-white hover:bg-white/10 transition-all shadow-inner disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ListMinus size={18} />
                </button>
                <button
                  disabled={isAllBatches || selectedBatch?.status !== 'active'}
                  title={isAllBatches ? 'Pilih batch spesifik untuk menjual' : selectedBatch?.status !== 'active' ? 'Batch sudah selesai' : undefined}
                  onClick={() => { setSelectedSale(null); setShowSaleSheet(true) }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-xs font-black font-['Sora'] shadow-[0_4px_12px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all"
                >
                  <ShoppingBag size={14} strokeWidth={3} />
                  Jual
                </button>
                <button
                  disabled={isAllBatches}
                  title={isAllBatches ? `Pilih batch spesifik untuk menambah ${animalLabel.toLowerCase()}` : undefined}
                  onClick={() => navigate(BASE + '/ternak')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-xs font-black font-['Sora'] shadow-[0_4px_12px_rgba(22,163,74,0.3)] active:scale-[0.98] transition-all"
                >
                  <Plus size={14} strokeWidth={3} />
                  Tambah
                </button>
              </>
            )}
          </div>
        </div>

        {/* BATCH SELECTOR (Standardized) */}
        <div ref={selectWrapperRef}>
          <button
            ref={selectTriggerRef}
            onClick={() => {
              const rect = selectTriggerRef.current?.getBoundingClientRect()
              setSelectRect(rect ?? null)
              setIsSelectOpen(!isSelectOpen)
            }}
            className={cn(
              "w-full h-12 px-4 flex items-center gap-3 bg-white/[0.03] border rounded-2xl text-sm font-bold text-white transition-all shadow-inner",
              isSelectOpen ? "border-green-500/40 bg-white/[0.06]" : "border-white/[0.08] hover:border-white/[0.14] hover:bg-white/[0.05]"
            )}
          >
            {isAllBatches ? (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="flex-1 text-left">
                  Semua Batch
                  <span className="text-[#4B6478] font-medium ml-2 text-xs">{batches.length} batch · {animals.length} ekor</span>
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="flex-1 text-left">
                  {selectedBatch?.batch_code ?? '—'}
                  <span className="text-[#4B6478] font-medium ml-2 text-xs">{selectedBatch?.kandang_name}</span>
                </span>
              </>
            )}
            <motion.div animate={{ rotate: isSelectOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} className="text-[#4B6478] shrink-0" />
            </motion.div>
          </button>
        </div>
      </header>

      {/* Batch Select Portal/Menu */}
      {isSelectOpen && selectRect && (
        <div className="fixed inset-0 z-[5000]" onClick={() => setIsSelectOpen(false)}>
          <motion.div
            ref={selectWrapperRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bg-[#111C24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
            style={{
              top: selectRect.bottom + 8,
              left: selectRect.left,
              width: selectRect.width,
              maxHeight: '300px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="overflow-y-auto custom-scrollbar p-2 space-y-1">
              <button
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams)
                  newParams.delete('batch')
                  setSearchParams(newParams)
                  setIsSelectOpen(false)
                }}
                className={cn(
                  "w-full px-4 py-3 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors group",
                  isAllBatches && "bg-blue-500/10"
                )}
              >
                <div className="text-left">
                  <p className={cn("text-xs font-black uppercase tracking-widest", isAllBatches ? "text-blue-400" : "text-[#4B6478]")}>Semua Batch</p>
                  <p className="text-[10px] text-[#4B6478] font-bold">{batches.length} Batch Aktif & Selesai</p>
                </div>
                {isAllBatches && <Check size={14} className="text-blue-400" />}
              </button>

              <div className="h-px bg-white/5 mx-2 my-1" />

              {batches.map(b => {
                const isActive = b.status === 'active'
                const isSelected = selectedBatchId === b.id
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      newParams.set('batch', b.id)
                      setSearchParams(newParams)
                      setIsSelectOpen(false)
                    }}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors group",
                      isSelected && "bg-green-500/10"
                    )}
                  >
                    <div className="text-left">
                      <p className={cn("text-sm font-black font-['Sora']", isSelected ? "text-green-400" : "text-white")}>{b.batch_code}</p>
                      <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest">{b.kandang_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-[8px] px-1.5 py-0.5 rounded-lg font-black border",
                        isActive ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/5 border-white/10 text-[#4B6478]"
                      )}>
                        {isActive ? 'AKTIF' : 'SELESAI'}
                      </span>
                      {isSelected && <Check size={14} className="text-green-400" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}

      {loadSales && sales.length === 0 ? (
        <div className="px-6 py-28 text-center"><LoadingSpinner /></div>
      ) : isAllBatches && batches.length === 0 ? (
        <div className="px-6 py-28 text-center">
          <ShoppingBag size={48} className="mx-auto text-white/5 mb-4" />
          <p className="font-['Sora'] font-black text-white text-base">Belum Ada Data Batch</p>
          <p className="text-[12px] text-[#4B6478] mt-2 max-w-[240px] mx-auto leading-relaxed">Buat batch baru terlebih dahulu di halaman Data Ternak.</p>
        </div>
      ) : !selectedBatchId ? (
        <div className="px-6 py-28 text-center">
          <ShoppingBag size={48} className="mx-auto text-white/5 mb-4" />
          <p className="font-['Sora'] font-black text-white text-base">Pilih Batch Terlebih Dahulu</p>
          <p className="text-[12px] text-[#4B6478] mt-2 max-w-[240px] mx-auto leading-relaxed">Pilih batch untuk melihat riwayat penjualan dan mencatat transaksi baru.</p>
        </div>
      ) : (
        <div className="px-5 pt-5 space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Pendapatan', value: `Rp ${fmt(kpi.total)}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { label: 'Ekor Terjual', value: `${kpi.ekor} Ekor`, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              { label: 'Rata-rata / Ekor', value: kpi.avgPerEkor > 0 ? `Rp ${fmt(kpi.avgPerEkor)}` : '—', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
              { label: 'Piutang Belum Lunas', value: kpi.piutang > 0 ? `Rp ${fmt(kpi.piutang)}` : 'Nihil', icon: kpi.piutang > 0 ? AlertCircle : CheckCircle2, color: kpi.piutang > 0 ? 'text-amber-400' : 'text-emerald-400', bg: kpi.piutang > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10', border: kpi.piutang > 0 ? 'border-amber-500/20' : 'border-emerald-500/20' },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={cn('rounded-2xl p-4 border', bg, border)}>
                <Icon size={16} className={cn(color, 'mb-2')} />
                <p className={cn('text-base font-black font-["Sora"] leading-tight', color)}>{value}</p>
                <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* HPP Panel — only for species that support it */}
          {hasHpp && perm.canViewBiayaTab && !isAllBatches && (
            <HppPanel batchId={selectedBatchId} useHppBatch={useHppBatch} />
          )}

          {/* Piutang Warning */}
          {kpi.piutang > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 flex gap-3">
              <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-amber-300">Ada transaksi yang belum lunas!</p>
                <p className="text-[11px] text-[#4B6478] mt-0.5">Segera konfirmasi pembayaran dari pembeli.</p>
              </div>
            </div>
          )}

          {/* Daftar Transaksi */}
          <div>
            <h2 className="font-['Sora'] font-black text-sm text-white mb-3 flex items-center gap-2">
              <ShoppingBag size={15} className="text-[#4B6478]" />
              Riwayat Transaksi
            </h2>

            {loadSales ? (
              <div className="py-12 flex justify-center"><LoadingSpinner /></div>
            ) : sales.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-white/[0.04] rounded-[32px] bg-white/[0.01]">
                <ShoppingBag size={40} className="mx-auto text-white/5 mb-4" />
                <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Belum ada penjualan</p>
                <p className="text-[11px] text-[#4B6478] mt-1">Mulai catat transaksi dengan menekan tombol "Jual" di atas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sales.map(s => <SaleCard key={s.id} sale={s} onClick={setSelectedSale} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay + Sale Sheet */}
      <AnimatePresence mode="wait">
        {showSaleSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={() => setShowSaleSheet(false)} />
            <SaleSheet
              batchId={selectedBatchId}
              animals={animals}
              hppData={hppData.isLoading ? null : hppData}
              onClose={() => setShowSaleSheet(false)}
              useAddSale={hooks.useAddSale}
              animalLabel={animalLabel}
              accent={accent}
            />
          </>
        )}
        {selectedSale && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={() => setSelectedSale(null)} />
            <SaleDetailSheet
              sale={selectedSale}
              onClose={() => setSelectedSale(null)}
              useUpdateSale={useUpdateSale}
              useDeleteSale={useDeleteSale}
              accent={accent}
              canEdit={canEdit}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
