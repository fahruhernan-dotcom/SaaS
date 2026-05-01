import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Info, Trash2, ArrowLeft, HeartPulse, Activity,
  Wheat, Home, FileText, AlertTriangle, BookOpen, ChevronDown,
  Search, ShieldAlert, Biohazard, Clock, Pill, FlaskConical,
  ShieldCheck, Bug, Syringe, Shield,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DISEASE_DB, SEVERITY_CFG } from '../../data/diseaseDatabase'

// ─── Log type config (covers all species) ─────────────────────────────────────

const LOG_TYPE_CFG = {
  medis:           { label: 'Kesehatan', icon: HeartPulse, iconCls: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20'   },
  sakit:           { label: 'Kesehatan', icon: HeartPulse, iconCls: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20'   },
  vaksinasi:       { label: 'Vaksinasi', icon: Syringe,    iconCls: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
  pemeriksaan:     { label: 'Periksa',   icon: Activity,   iconCls: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  obat_cacing:     { label: 'Cacing',    icon: Bug,        iconCls: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  },
  kematian:        { label: 'Kematian',  icon: AlertTriangle, iconCls: 'text-slate-400', bg: 'bg-white/5',     border: 'border-white/10'      },
  insiden_pakan:   { label: 'Pakan',     icon: Wheat,      iconCls: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
  insiden_kandang: { label: 'Kandang',   icon: Home,       iconCls: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  },
  insiden:         { label: 'Lainnya',   icon: FileText,   iconCls: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/20'  },
  lainnya:         { label: 'Lainnya',   icon: FileText,   iconCls: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/20'  },
}

const DEFAULT_CFG = { label: 'Laporan', icon: FileText, iconCls: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }

const CONTAGIOUS_SET = new Set(DISEASE_DB.filter(d => d.isContagious).map(d => d.name))

const LOG_FILTER_TABS = [
  { id: 'semua',   label: 'Semua' },
  { id: 'health',  label: 'Kesehatan', types: ['medis', 'sakit', 'vaksinasi', 'pemeriksaan', 'obat_cacing', 'kematian'] },
  { id: 'pakan',   label: 'Pakan',     types: ['insiden_pakan'] },
  { id: 'kandang', label: 'Kandang',   types: ['insiden_kandang'] },
  { id: 'lainnya', label: 'Lainnya',   types: ['insiden', 'lainnya'] },
]

const REF_FILTERS = [
  { id: 'semua',         label: 'Semua' },
  { id: 'menular',       label: 'Menular' },
  { id: 'tidak_menular', label: 'Tidak Menular' },
  { id: 'kritis',        label: 'Kritis' },
  { id: 'zoonosis',      label: 'Zoonosis' },
]

// ─── DiseaseCard ───────────────────────────────────────────────────────────────

function DiseaseCard({ disease }) {
  const [expanded, setExpanded] = useState(false)
  const sev = SEVERITY_CFG[disease.severity]

  return (
    <motion.div
      layout
      className={cn(
        'border rounded-[20px] overflow-hidden transition-colors',
        disease.severity === 'kritis' ? 'border-rose-500/20 bg-rose-500/[0.03]' :
        disease.severity === 'parah'  ? 'border-orange-500/20 bg-orange-500/[0.03]' :
        'border-white/[0.06] bg-white/[0.02]'
      )}
    >
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-snug truncate">{disease.name}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border', sev.bg, sev.border, sev.text)}>
              {sev.label}
            </span>
            {disease.isContagious && (
              <span className="flex items-center gap-0.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/25 text-rose-400">
                <ShieldAlert size={8} /> Menular
              </span>
            )}
            {disease.zoonosis && (
              <span className="flex items-center gap-0.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/25 text-purple-400">
                <Biohazard size={8} /> Zoonosis
              </span>
            )}
            {!disease.isContagious && (
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500/70">
                Tidak Menular
              </span>
            )}
          </div>
        </div>
        <ChevronDown size={16} className={cn('text-[#4B6478] shrink-0 transition-transform duration-300', expanded && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
              <div className="flex items-start gap-2">
                <Bug size={12} className="text-[#4B6478] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">Patogen / Penyebab</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{disease.pathogen}</p>
                </div>
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/[0.04]">
                <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1.5">Gejala Klinis</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">{disease.gejala}</p>
              </div>
              <div className="bg-blue-500/[0.04] rounded-2xl p-3 border border-blue-500/10">
                <p className="text-[9px] font-black text-blue-400/70 uppercase tracking-widest mb-1.5">Cara Penanganan</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">{disease.tindakan}</p>
              </div>
              <div>
                <div className="flex items-start gap-2 mb-1.5">
                  <Pill size={12} className="text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">Obat Disarankan</p>
                    <p className="text-[11px] text-green-300 font-semibold leading-relaxed">{disease.obat}</p>
                  </div>
                </div>
                {disease.obat_alternatif && (
                  <div className="flex items-start gap-2">
                    <FlaskConical size={12} className="text-amber-400/70 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">Obat Alternatif</p>
                      <p className="text-[11px] text-amber-300/80 leading-relaxed">{disease.obat_alternatif}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={10} className="text-[#4B6478]" />
                    <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Estimasi Sembuh</p>
                  </div>
                  <p className="text-[11px] text-white font-bold">{disease.estimasi_sembuh}</p>
                </div>
                <div className={cn('rounded-xl p-2.5 border', disease.isolasi ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/[0.02] border-white/[0.04]')}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck size={10} className={disease.isolasi ? 'text-rose-400' : 'text-[#4B6478]'} />
                    <p className={cn('text-[9px] font-black uppercase tracking-widest', disease.isolasi ? 'text-rose-400/70' : 'text-[#4B6478]')}>Isolasi</p>
                  </div>
                  <p className={cn('text-[11px] font-bold', disease.isolasi ? 'text-rose-400' : 'text-slate-500')}>
                    {disease.isolasi ? 'WAJIB' : 'Tidak Perlu'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-amber-500/[0.04] rounded-xl p-3 border border-amber-500/10">
                <Info size={12} className="text-amber-400/70 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[9px] font-black text-amber-400/70 uppercase tracking-widest mb-0.5">Biosecurity & Pencegahan</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{disease.biosecurity}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Empty state stubs for optional hooks ─────────────────────────────────────

const emptyHook = () => ({ data: [], isLoading: false })
const emptyMutate = () => ({ mutateAsync: async () => {} })

// ─── Main Component ────────────────────────────────────────────────────────────

export function PenggemukanKesehatan({ config, hooks }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialBatchId = searchParams.get('batch')

  const [selectedBatchId, setSelectedBatchId] = useState(
    config.hasMultiBatch ? (initialBatchId || 'all') : (initialBatchId || '')
  )

  // Resolve optional hooks to stable stubs
  const useHealthLogsByBatches = hooks.useHealthLogsByBatches || emptyHook
  const useAnimals = hooks.useAnimals || emptyHook
  const useAnimalsByBatches = hooks.useAnimalsByBatches || emptyHook
  const useDeleteHealthLog = hooks.useDeleteHealthLog || emptyMutate

  const { data: batches = [], isLoading: loadingBatches } = hooks.useActiveBatches()

  const isAllBatches = config.hasMultiBatch && selectedBatchId === 'all'
  const activeBatch = useMemo(() => {
    if (isAllBatches) return batches[0]
    return batches.find(b => b.id === selectedBatchId) || batches[0]
  }, [isAllBatches, selectedBatchId, batches])

  const batchIds = isAllBatches ? batches.map(b => b.id) : activeBatch ? [activeBatch.id] : []

  const { data: singleLogs = [], isLoading: loadingSingleLogs } = hooks.useHealthLogs(isAllBatches ? null : activeBatch?.id)
  const { data: multiLogs = [], isLoading: loadingMultiLogs } = useHealthLogsByBatches(batchIds, { enabled: isAllBatches })
  const logs = isAllBatches ? multiLogs : singleLogs
  const loadingLogs = isAllBatches ? loadingMultiLogs : loadingSingleLogs

  const { data: singleAnimals = [] } = useAnimals(isAllBatches ? null : activeBatch?.id)
  const { data: multiAnimals = [] } = useAnimalsByBatches(batchIds, { enabled: isAllBatches })
  const animals = isAllBatches ? multiAnimals : singleAnimals

  const addLog = hooks.useAddHealthLog()
  const deleteLog = useDeleteHealthLog()

  // Determine available view tabs
  const views = useMemo(() => {
    const v = [{ id: 'riwayat', label: 'Riwayat', icon: Activity }]
    if (config.hasReferensi) v.push({ id: 'referensi', label: 'Referensi Penyakit', icon: BookOpen })
    if (config.vaccSchedule) v.push({ id: 'jadwal', label: 'Jadwal Vaksin', icon: Shield })
    return v
  }, [config.hasReferensi, config.vaccSchedule])

  const [activeView, setActiveView] = useState('riwayat')
  const [activeLogFilter, setActiveLogFilter] = useState('semua')
  const [activeRefFilter, setActiveRefFilter] = useState('semua')
  const [refSearch, setRefSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emptyForm = {
    batch_id: '', log_date: new Date().toISOString().split('T')[0],
    animal_id: '', log_type: config.defaultLogType || 'sakit',
    symptoms: '', diagnosis: '', treatment: '', medication_used: '',
    medicine_name: '', medicine_dose: '', vaccine_name: '', vaccine_next_due: '',
    action_taken: '', outcome: '', handled_by: '',
    death_cause: '', death_weight_kg: '', loss_value_idr: '',
    notes: '',
  }
  const [form, setForm] = useState(emptyForm)

  const animalMap = useMemo(() => {
    const m = {}
    animals.forEach(a => { m[a.id] = a })
    return m
  }, [animals])

  const batchCodeMap = useMemo(() => {
    const m = {}
    batches.forEach(b => { m[b.id] = b.batch_code })
    return m
  }, [batches])

  const filteredLogs = useMemo(() => {
    const tab = LOG_FILTER_TABS.find(t => t.id === activeLogFilter)
    if (!tab || activeLogFilter === 'semua') return logs
    return logs.filter(l => tab.types?.includes(l.log_type))
  }, [logs, activeLogFilter])

  const filteredDiseases = useMemo(() => {
    let list = DISEASE_DB
    if (activeRefFilter === 'menular')       list = list.filter(d => d.isContagious)
    if (activeRefFilter === 'tidak_menular') list = list.filter(d => !d.isContagious)
    if (activeRefFilter === 'kritis')        list = list.filter(d => d.severity === 'kritis')
    if (activeRefFilter === 'zoonosis')      list = list.filter(d => d.zoonosis)
    if (refSearch.trim()) {
      const q = refSearch.toLowerCase()
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.gejala.toLowerCase().includes(q) ||
        d.pathogen.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeRefFilter, refSearch])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const targetBatchId = isAllBatches ? form.batch_id : activeBatch?.id
    if (!targetBatchId) { toast.error('Pilih batch terlebih dahulu'); return }
    if (config.logSchema === 'extended' && !form.animal_id) { toast.error('Pilih ekor terlebih dahulu'); return }
    setIsSubmitting(true)
    try {
      const payload = { ...form, batch_id: targetBatchId }
      payload.animal_id = form.animal_id === 'null' || !form.animal_id ? null : form.animal_id
      if (form.death_weight_kg) payload.death_weight_kg = parseFloat(form.death_weight_kg)
      if (form.loss_value_idr)  payload.loss_value_idr  = parseInt(form.loss_value_idr)
      await addLog.mutateAsync(payload)
      toast.success('Log kesehatan berhasil disimpan')
      setShowAdd(false)
      setForm(emptyForm)
    } catch {
      toast.error('Gagal menyimpan log kesehatan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id, logBatchId) => {
    if (!hooks.useDeleteHealthLog) return
    if (!confirm('Hapus log ini?')) return
    try {
      await deleteLog.mutateAsync({ logId: id, batch_id: logBatchId || activeBatch?.id })
      toast.success('Log dihapus')
    } catch {
      toast.error('Gagal menghapus log')
    }
  }

  if (loadingBatches || loadingLogs) return <LoadingSpinner fullPage />

  const accentActive = config.accentActiveClass || 'bg-green-600 border-green-500 text-white'

  return (
    <div className="text-slate-100 pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(`${config.BASE}/beranda`)}
            className="p-2 -ml-2 text-[#4B6478] hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-['Sora'] font-black text-xl text-white">{config.pageTitle}</h1>
        </div>

        {/* Batch selector */}
        {batches.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 mb-4">
            {config.hasMultiBatch && (
              <button
                onClick={() => setSelectedBatchId('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isAllBatches
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/[0.03] border-white/[0.06] text-[#4B6478] hover:text-white'
                }`}
              >
                Semua
              </button>
            )}
            {batches.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBatchId(b.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeBatch?.id === b.id && !isAllBatches
                    ? accentActive + ' shadow-lg'
                    : 'bg-white/[0.03] border-white/[0.06] text-[#4B6478] hover:text-white'
                }`}
              >
                {b.batch_code}
              </button>
            ))}
          </div>
        )}

        {/* View toggle — only if more than 1 view */}
        {views.length > 1 && (
          <div className="flex gap-2 p-1 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
            {views.map(v => {
              const Icon = v.icon
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all',
                    activeView === v.id ? 'bg-white/10 text-white shadow-sm' : 'text-[#4B6478] hover:text-white'
                  )}
                >
                  <Icon size={13} /> {v.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Log filter tabs */}
        {activeView === 'riwayat' && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-3">
            {LOG_FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveLogFilter(tab.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                  activeLogFilter === tab.id
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478]'
                )}
              >
                {tab.label}
                {tab.id !== 'semua' && (
                  <span className="ml-1 opacity-50">
                    {logs.filter(l => tab.types?.includes(l.log_type)).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── RIWAYAT ── */}
      {activeView === 'riwayat' && (
        <>
          {!activeBatch ? (
            <div className="px-4 py-20 text-center">
              <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
                <HeartPulse size={24} className="text-[#4B6478]" />
              </div>
              <p className="text-sm font-bold text-white mb-1">Pilih Batch Terlebih Dahulu</p>
              <p className="text-xs text-[#4B6478]">Kamu perlu memiliki batch aktif untuk mencatat kesehatan</p>
            </div>
          ) : (
            <div className="px-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Sora'] font-bold text-sm text-white">
                  Riwayat Laporan
                  <span className="ml-2 text-[#4B6478] font-normal">({filteredLogs.length})</span>
                </h2>
                <button
                  onClick={() => setShowAdd(true)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-green-600/10"
                >
                  <Plus size={14} /> Catat Penanganan
                </button>
              </div>

              <div className="space-y-3">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-[32px]">
                    <Activity size={24} className="text-[#4B6478] mx-auto mb-2 opacity-20" />
                    <p className="text-xs text-[#4B6478]">Belum ada laporan untuk kategori ini</p>
                  </div>
                ) : (
                  filteredLogs.map(log => {
                    const cfg = LOG_TYPE_CFG[log.log_type] || DEFAULT_CFG
                    const IconComp = cfg.icon
                    const isContagious = CONTAGIOUS_SET.has(log.diagnosis)
                    const animalTag = log.animal_id
                      ? (animalMap[log.animal_id]?.ear_tag || log.kd_penggemukan_animals?.ear_tag || log.animal_ear_tag || 'Unknown')
                      : null
                    const medication = log.medication_used || log.medicine_name || null

                    return (
                      <div key={log.id} className={cn('border rounded-[24px] p-4 transition-all hover:bg-white/[0.05]', cfg.bg, cfg.border)}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border shrink-0', cfg.bg, cfg.border)}>
                              <IconComp size={16} className={cfg.iconCls} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn('text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border', cfg.bg, cfg.border, cfg.iconCls)}>
                                  {cfg.label}
                                </span>
                                {isContagious && (
                                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-400">
                                    <AlertTriangle size={9} /> Menular
                                  </span>
                                )}
                                {isAllBatches && log.batch_id && batchCodeMap[log.batch_id] && (
                                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border bg-slate-500/10 border-slate-500/20 text-slate-400">
                                    {batchCodeMap[log.batch_id]}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#4B6478] font-bold mt-0.5">
                                {new Date(log.log_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {animalTag && <span className="ml-2 text-white/60">· {animalTag}</span>}
                                {!animalTag && <span className="ml-2">· Seluruh Batch</span>}
                              </p>
                            </div>
                          </div>
                          {hooks.useDeleteHealthLog && (
                            <button
                              onClick={() => handleDelete(log.id, log.batch_id)}
                              className="p-1.5 text-red-500/30 hover:text-red-500 transition-colors shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="border-t border-white/[0.04] pt-3 space-y-2">
                          {log.diagnosis && log.diagnosis !== cfg.label && (
                            <div>
                              <p className="text-[9px] text-[#4B6478] font-black uppercase tracking-widest mb-0.5">Diagnosa</p>
                              <p className="text-xs font-bold text-white">{log.diagnosis}</p>
                            </div>
                          )}
                          {log.symptoms && (
                            <div>
                              <p className="text-[9px] text-[#4B6478] font-black uppercase tracking-widest mb-0.5">
                                {['insiden_pakan','insiden_kandang','insiden','lainnya'].includes(log.log_type) ? 'Deskripsi' : 'Gejala'}
                              </p>
                              <p className="text-xs text-slate-300 leading-relaxed">{log.symptoms}</p>
                            </div>
                          )}
                          {(log.action_taken || log.treatment) && (
                            <div>
                              <p className="text-[9px] text-[#4B6478] font-black uppercase tracking-widest mb-0.5">Tindakan</p>
                              <p className="text-xs text-slate-300 leading-relaxed">{log.action_taken || log.treatment}</p>
                            </div>
                          )}
                          {medication && (
                            <div>
                              <p className="text-[9px] text-[#4B6478] font-black uppercase tracking-widest mb-0.5">Obat</p>
                              <p className="text-xs font-bold text-green-400">{medication}</p>
                            </div>
                          )}
                          {log.outcome && (
                            <span className={cn(
                              'inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border',
                              log.outcome === 'sembuh' ? 'text-green-400 bg-green-500/15 border-green-500/25' :
                              log.outcome === 'mati'   ? 'text-red-400 bg-red-500/15 border-red-500/25' :
                              'text-[#4B6478] bg-white/5 border-white/10'
                            )}>{log.outcome}</span>
                          )}
                          {log.notes && (
                            <div className="flex items-start gap-1.5 pt-1 border-t border-white/[0.04]">
                              <Info size={11} className="text-[#4B6478] shrink-0 mt-0.5" />
                              <p className="text-[10px] text-[#4B6478] italic leading-relaxed">{log.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── REFERENSI PENYAKIT ── */}
      {activeView === 'referensi' && (
        <div className="px-4 mt-5">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" />
            <input
              type="text"
              placeholder="Cari nama penyakit, gejala, patogen..."
              value={refSearch}
              onChange={e => setRefSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4">
            {REF_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveRefFilter(f.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                  activeRefFilter === f.id ? 'bg-white/10 border-white/20 text-white' : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478]'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 mb-4 text-[10px] text-[#4B6478] font-bold">
            <span>{filteredDiseases.length} penyakit</span>
            <span>·</span>
            <span className="text-rose-400">{filteredDiseases.filter(d => d.isContagious).length} menular</span>
            <span>·</span>
            <span className="text-rose-500">{filteredDiseases.filter(d => d.severity === 'kritis').length} kritis</span>
            <span>·</span>
            <span className="text-purple-400">{filteredDiseases.filter(d => d.zoonosis).length} zoonosis</span>
          </div>
          <div className="space-y-2">
            {filteredDiseases.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-[32px]">
                <Search size={24} className="text-[#4B6478] mx-auto mb-2 opacity-20" />
                <p className="text-xs text-[#4B6478]">Tidak ada penyakit yang cocok</p>
              </div>
            ) : filteredDiseases.map(d => <DiseaseCard key={d.name} disease={d} />)}
          </div>
          <div className="mt-6 p-4 bg-white/[0.02] rounded-[20px] border border-white/[0.05] flex items-start gap-3">
            <Info size={14} className="text-[#4B6478] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#4B6478] leading-relaxed">
              Referensi ini bersifat informatif untuk konteks peternakan {config.animalLabel?.toLowerCase() || 'ternak'}.
              Untuk kasus serius, selalu konsultasikan dengan dokter hewan atau mantri ternak setempat.
            </p>
          </div>
        </div>
      )}

      {/* ── JADWAL VAKSIN ── */}
      {activeView === 'jadwal' && config.vaccSchedule && (
        <div className="px-4 mt-4 space-y-2">
          <p className="text-xs text-[#4B6478] mb-3">Protokol standar penggemukan {config.animalLabel?.toLowerCase() || 'ternak'}:</p>
          {config.vaccSchedule.map((v, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <div className="flex items-center gap-2.5">
                <Shield size={13} className="text-blue-400 shrink-0" />
                <span className="text-sm font-semibold text-white">{v.name}</span>
              </div>
              <span className="text-[10px] text-[#4B6478] text-right max-w-[120px]">{v.interval}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add Log Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-[#06090F]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-[#0C1319] border-t sm:border border-white/[0.06] rounded-t-[32px] sm:rounded-[40px] p-8 pb-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-['Sora'] font-black text-xl text-white mb-1">Catat Penanganan</h3>
                  <p className="text-[11px] text-[#4B6478] font-bold uppercase tracking-widest">Input Data Medis & Vaksin</p>
                </div>
                <button
                  onClick={() => setShowAdd(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#4B6478] hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Tanggal</label>
                  <input
                    type="date" required
                    value={form.log_date}
                    onChange={e => setForm({ ...form, log_date: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors shadow-inner"
                  />
                </div>

                {isAllBatches && (
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Pilih Batch</label>
                    <Select required value={form.batch_id} onValueChange={v => setForm({ ...form, batch_id: v })}>
                      <SelectTrigger className="w-full h-14 bg-white/[0.03] border-white/10 rounded-2xl text-white px-5">
                        <SelectValue placeholder="Pilih batch..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0C1319] border-white/10 rounded-2xl">
                        {batches.map(b => (
                          <SelectItem key={b.id} value={b.id} className="py-3 px-4 font-bold">{b.batch_code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Animal selector */}
                {config.animalInputType === 'select' && animals.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">
                      Pilih Ternak {config.logSchema !== 'extended' && '(Opsional)'}
                    </label>
                    <Select
                      value={form.animal_id}
                      onValueChange={v => setForm({ ...form, animal_id: v })}
                    >
                      <SelectTrigger className="w-full h-14 bg-white/[0.03] border-white/10 rounded-2xl text-white px-5">
                        <SelectValue placeholder="Pilih ekor..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0C1319] border-white/10 rounded-2xl">
                        {config.logSchema !== 'extended' && <SelectItem value="null">-- Seluruh Batch --</SelectItem>}
                        {animals.map(a => (
                          <SelectItem key={a.id} value={a.id} className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-black text-sm">{a.ear_tag}</span>
                              <span className="text-[10px] text-[#4B6478] font-bold uppercase">{a.breed || a.species || ''}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {config.animalInputType === 'text' && (
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">ID Ekor (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: SAP-001"
                      value={form.animal_id}
                      onChange={e => setForm({ ...form, animal_id: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50"
                    />
                  </div>
                )}

                {/* Log type */}
                {config.logTypes && (
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Jenis Log</label>
                    <Select value={form.log_type} onValueChange={v => setForm({ ...form, log_type: v })}>
                      <SelectTrigger className="w-full h-14 bg-white/[0.03] border-white/10 rounded-2xl text-white px-5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0C1319] border-white/10 rounded-2xl">
                        {config.logTypes.map(t => (
                          <SelectItem key={t} value={t} className="py-3 px-4 font-bold">
                            {LOG_TYPE_CFG[t]?.label || t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Simple fields (all schemas) */}
                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Gejala Teramati</label>
                  <input
                    type="text" required
                    placeholder="Diare, lemas, nafsu makan turun..."
                    value={form.symptoms}
                    onChange={e => setForm({ ...form, symptoms: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50"
                  />
                </div>

                {/* Simple schema: diagnosis + treatment + medication_used */}
                {config.logSchema !== 'extended' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Diagnosa Sementara</label>
                      <input
                        type="text"
                        placeholder="Cacingan, Kembung, dll..."
                        value={form.diagnosis}
                        onChange={e => setForm({ ...form, diagnosis: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-green-200 placeholder:text-[#4B6478]/50 focus:outline-none focus:border-green-500/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Obat Digunakan</label>
                        <input
                          type="text"
                          placeholder="Albendazole, B-Complex..."
                          value={form.medication_used}
                          onChange={e => setForm({ ...form, medication_used: e.target.value })}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-green-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Penanganan</label>
                        <input
                          type="text"
                          placeholder="Suntik IM, Karantina..."
                          value={form.treatment}
                          onChange={e => setForm({ ...form, treatment: e.target.value })}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-green-500/50"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Extended schema: conditional sections by log_type */}
                {config.logSchema === 'extended' && (
                  <>
                    {(form.log_type === 'sakit' || form.log_type === 'lainnya') && (
                      <>
                        <div>
                          <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Tindakan</label>
                          <input
                            type="text" placeholder="Isolasi, injeksi, dll"
                            value={form.action_taken}
                            onChange={e => setForm({ ...form, action_taken: e.target.value })}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Nama Obat</label>
                            <input
                              type="text" placeholder="Sulfa, Penisilin..."
                              value={form.medicine_name}
                              onChange={e => setForm({ ...form, medicine_name: e.target.value })}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Dosis</label>
                            <input
                              type="text" placeholder="5 ml IM"
                              value={form.medicine_dose}
                              onChange={e => setForm({ ...form, medicine_dose: e.target.value })}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Hasil Akhir</label>
                          <Select value={form.outcome} onValueChange={v => setForm({ ...form, outcome: v })}>
                            <SelectTrigger className="w-full h-14 bg-white/[0.03] border-white/10 rounded-2xl text-white px-5">
                              <SelectValue placeholder="-- Pilih --" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0C1319] border-white/10 rounded-2xl">
                              <SelectItem value="sembuh">Sembuh</SelectItem>
                              <SelectItem value="masih_diobati">Masih Diobati</SelectItem>
                              <SelectItem value="mati">Mati</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {(form.log_type === 'vaksinasi' || form.log_type === 'obat_cacing') && (
                      <>
                        <div>
                          <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">
                            {form.log_type === 'vaksinasi' ? 'Nama Vaksin' : 'Nama Obat Cacing'}
                          </label>
                          <input
                            type="text"
                            value={form.log_type === 'vaksinasi' ? form.vaccine_name : form.medicine_name}
                            onChange={e => setForm(f => form.log_type === 'vaksinasi'
                              ? { ...f, vaccine_name: e.target.value }
                              : { ...f, medicine_name: e.target.value }
                            )}
                            placeholder={form.log_type === 'vaksinasi' ? 'PMK, CDT, Anthrax...' : 'Albendazole 10%...'}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Dosis</label>
                          <input
                            type="text" placeholder="2 ml IM"
                            value={form.medicine_dose}
                            onChange={e => setForm({ ...form, medicine_dose: e.target.value })}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50"
                          />
                        </div>
                        {form.log_type === 'vaksinasi' && (
                          <div>
                            <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Jadwal Booster Berikutnya</label>
                            <input
                              type="date"
                              value={form.vaccine_next_due}
                              onChange={e => setForm({ ...form, vaccine_next_due: e.target.value })}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-green-500/50"
                            />
                          </div>
                        )}
                      </>
                    )}

                    {form.log_type === 'kematian' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Dugaan Penyebab Kematian</label>
                          <input
                            type="text" placeholder="Pneumonia, kecelakaan..."
                            value={form.death_cause}
                            onChange={e => setForm({ ...form, death_cause: e.target.value })}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Bobot Saat Mati (kg)</label>
                            <input
                              type="number" step="0.1" placeholder="28.0"
                              value={form.death_weight_kg}
                              onChange={e => setForm({ ...form, death_weight_kg: e.target.value })}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Nilai Kerugian (Rp)</label>
                            <input
                              type="number" placeholder="1800000"
                              value={form.loss_value_idr}
                              onChange={e => setForm({ ...form, loss_value_idr: e.target.value })}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Petugas</label>
                      <input
                        type="text" placeholder="Nama petugas / drh."
                        value={form.handled_by}
                        onChange={e => setForm({ ...form, handled_by: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest">Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    placeholder="Tambahkan detail lainnya..."
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:bg-white/[0.03] disabled:text-[#4B6478] text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 mt-4 active:scale-[0.98]"
                >
                  <HeartPulse size={18} className={isSubmitting ? 'animate-pulse' : ''} />
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Log Kesehatan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
