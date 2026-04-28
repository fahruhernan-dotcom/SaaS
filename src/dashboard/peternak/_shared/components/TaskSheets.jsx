import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, Clock, MapPin, Sparkles, 
  Lock, Save, AlertTriangle, Scale, Syringe, Trash2,
  Plus, ClipboardList, Activity, Info, Wand2
} from 'lucide-react'
import { format, parseISO, endOfWeek, endOfMonth, eachDayOfInterval } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InputNumber } from '@/components/ui/InputNumber'
import { DatePicker } from '@/components/ui/DatePicker'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { toast } from 'sonner'
import { getRandomizedSample } from '@/dashboard/peternak/_shared/utils/taskUtils'
import { CONTAINER_PRESETS } from '@/lib/constants/taskTemplates'

export function ContainerCalcField({ field, reportData, setReportData, disabled }) {
  const stateKey   = field.id                  // e.g. '_wadah_hijauan'
  const qtyKey     = `${field.id}_qty`         // e.g. '_wadah_hijauan_qty'
  const feedType   = field.feedType            // 'hijauan' | 'konsentrat'
  const targetField = field.targetKgField      // 'hijauan_kg' | 'konsentrat_kg'

  const selectedPreset = reportData[stateKey] || ''
  const qty = parseFloat(reportData[qtyKey]) || 1

  function handlePresetChange(label) {
    const preset = CONTAINER_PRESETS.find(p => p.label === label)
    const newData = { ...reportData, [stateKey]: label }
    if (preset) {
      newData[targetField] = String((preset[feedType] * qty).toFixed(1))
    }
    setReportData(newData)
  }

  function handleQtyChange(val) {
    const newData = { ...reportData, [qtyKey]: val }
    const n = parseFloat(val)
    const preset = CONTAINER_PRESETS.find(p => p.label === selectedPreset)
    
    if (preset) {
      if (!isNaN(n)) {
        newData[targetField] = String((preset[feedType] * n).toFixed(1))
      } else {
        newData[targetField] = "0"
      }
    }
    setReportData(newData)
  }

  const preset = CONTAINER_PRESETS.find(p => p.label === selectedPreset)
  const kgPerUnit = preset ? preset[feedType] : null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select disabled={disabled} value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-14 rounded-2xl bg-black/40 border-white/5 text-sm text-white focus:ring-0">
              <SelectValue placeholder="Pilih jenis wadah..." />
            </SelectTrigger>
            <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-2xl">
              {CONTAINER_PRESETS.map(p => (
                <SelectItem key={p.label} value={p.label} className="rounded-xl focus:bg-purple-500/10 focus:text-purple-300 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-sm">{p.label}</span>
                    <span className="text-[10px] text-[#4B6478] uppercase tracking-wider">{feedType === 'hijauan' ? `±${p.hijauan} kg / unit` : `±${p.konsentrat} kg / unit`}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPreset && (
          <div className="w-24 shrink-0">
            <div className="relative group">
              <input
                type="number"
                min="1"
                disabled={disabled}
                value={reportData[qtyKey] === undefined ? '1' : reportData[qtyKey]}
                onChange={e => handleQtyChange(e.target.value)}
                className="w-full h-14 rounded-2xl bg-black/40 border border-white/5 text-center text-lg font-display font-black text-white focus:bg-black/60 focus:border-purple-500/40 outline-none transition-all disabled:opacity-40"
              />
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#0C1319] px-2 text-[8px] font-black text-[#4B6478] uppercase tracking-widest whitespace-nowrap">Jumlah</span>
            </div>
          </div>
        )}
      </div>

      {selectedPreset && (
        <div className="flex items-center justify-between px-6 py-4 rounded-[24px] bg-emerald-500/5 border border-emerald-500/10 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest leading-none mb-1">Estimasi Input</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white opacity-40 font-medium">{qty} × {kgPerUnit} kg</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <Scale size={14} className="opacity-60" />
            <span className="text-xl font-display font-black tracking-tight">
              {kgPerUnit ? `${(kgPerUnit * qty).toFixed(1)} kg` : '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export function CompleteTaskSheet({ 
  open, onOpenChange, task, isDesktop, onSuccess, showSuccessAnimation, 
  isOwnerView, config, TASK_TYPE_CFG, TASK_REPORT_CONFIG,
  hooks, livestockType, profile, updateStatus, linkRecord,
  createTask, // For auto-tasking
  renderExtraReportFields, // Function to render livestock specific fields (like FAMACHA)
  triggerMedicalInterventionTemplate // Optional template for auto-tasking
}) {
  const [notes, setNotes] = useState('')
  const [reportData, setReportData] = useState({})
  const [weighingData, setWeighingData] = useState({ animal_id: '', weight_kg: '', girth_cm: '' })
  const [weighingEntries, setWeighingEntries] = useState([])
  const [healthEntries, setHealthEntries] = useState([])
  const [ortsCategory, setOrtsCategory] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const addWeight = hooks.useAddWeight()
  const addFeed = hooks.useAddFeed()

  const { data: activeBatches = [] } = hooks.useActiveBatches()
  const effectiveBatchId = useMemo(() => {
    if (task?.batch_id) return task.batch_id
    if (!activeBatches.length) return null
    if (task?.kandang_name) {
      const match = activeBatches.find(b => b.kandang_name === task.kandang_name)
      if (match) return match.id
    }
    return activeBatches[0].id
  }, [task?.batch_id, task?.kandang_name, activeBatches])

  const animalsQuery = hooks.useAnimals(effectiveBatchId)
  const animals = useMemo(() => {
    const rawAnimals = animalsQuery.data || []
    if (!task) return rawAnimals
    const isSampling = task.title?.includes('Sampling')
    if (isSampling && rawAnimals.length > 0) {
      const seed = `${task.batch_id || effectiveBatchId}-${task.due_date}`
      return getRandomizedSample(rawAnimals, seed, 0.1)
    }
    return rawAnimals
  }, [animalsQuery.data, task?.title, task?.batch_id, task?.due_date, effectiveBatchId])

  useEffect(() => {
    if (open && task) {
      try {
        const parsed = JSON.parse(task.notes || '{}')
        if (parsed._version === '2.0') {
          setReportData(parsed.report || {})
          setNotes(parsed.notes || '')
          setWeighingEntries(parsed.weighing_entries || [])
          setHealthEntries(parsed.health_entries || [])
        } else {
          setNotes(task.notes || '')
          setReportData({})
          setWeighingEntries([])
          setHealthEntries([])
        }
      } catch (e) {
        setNotes(task.notes || '')
        setReportData({})
        setWeighingEntries([])
        setHealthEntries([])
      }
      setWeighingData({ animal_id: '', weight_kg: '', girth_cm: '' })
    } else if (!open) {
      setNotes('')
      setReportData({})
      setWeighingData({ animal_id: '', weight_kg: '', girth_cm: '' })
      setWeighingEntries([])
      setHealthEntries([])
      setOrtsCategory(null)
      setShowSuccess(false)
    }
  }, [open, task])

  if (!task) return null
  const isAuditMode = isOwnerView && task.status === 'selesai'
  const isMultiAnimalTask = (task.task_type === 'timbang' || task.task_type === 'vaksinasi' || task.task_type === 'obat_cacing') && config.usesIndividualAnimals && !isAuditMode
  const reportConfig = isMultiAnimalTask ? null : TASK_REPORT_CONFIG[task.task_type]

  async function handleComplete() {
    const isPakan = task.task_type === 'pakan' || task.task_type === 'pemberian_pakan'
    
    if (isPakan && !ortsCategory && !isAuditMode) {
      return toast.error('Mohon berikan feedback sisa pakan (Habis/Sedikit/Banyak)')
    }

    try {
      let linkedId = null
      if (isMultiAnimalTask) {
        if (!weighingData.animal_id || !weighingData.weight_kg) return toast.error('Data timbangan wajib diisi')
        const animal = animals.find(a => a.id === weighingData.animal_id)
        if (!animal) return toast.error(`${config.animalLabel} tidak ditemukan`)
        
        const record = await addWeight.mutateAsync({ 
          animal_id: weighingData.animal_id, 
          batch_id: effectiveBatchId, 
          entry_date: animal.entry_date, 
          entry_weight_kg: animal.entry_weight_kg, 
          weigh_date: format(new Date(), 'yyyy-MM-dd'), 
          weight_kg: parseFloat(weighingData.weight_kg), 
          girth_cm: weighingData.girth_cm ? parseFloat(weighingData.girth_cm) : null,
          weigh_method: 'timbang_langsung', 
          notes: `Auto: ${task.title}`,
          ...weighingData // Include extra data like FAMACHA
        })
        
        if (record?.id) linkedId = record.id

        // AUTO-TASKING LOGIC (e.g. FAMACHA 4/5 for Domba)
        if (triggerMedicalInterventionTemplate && weighingData.famacha_score >= 4) {
          await createTask.mutateAsync({
            ...triggerMedicalInterventionTemplate,
            batch_id: effectiveBatchId,
            due_date: format(new Date(), 'yyyy-MM-dd'),
            description: `${triggerMedicalInterventionTemplate.description} (Deteksi: ${animal.ear_tag || animal.name})`,
            livestock_type: livestockType
          })
          toast.warning(`Peringatan: Skor FAMACHA Tinggi. Tugas Intervensi Medis telah ditambahkan secara otomatis.`, {
            duration: 6000,
            icon: <AlertTriangle className="text-amber-500" />
          })
        }
      }

      if (isPakan) {
        if (!ortsCategory) return toast.error('Pilih kategori sisa pakan (jempol) terlebih dahulu')
        
        await addFeed.mutateAsync({
          batch_id: effectiveBatchId,
          log_date: format(new Date(), 'yyyy-MM-dd'),
          feed_orts_category: ortsCategory,
          hijauan_kg: parseFloat(reportData.hijauan_kg || 0),
          konsentrat_kg: parseFloat(reportData.konsentrat_kg || 0),
          notes: notes.trim() || `Auto: ${task.title}`
        })
      }

      const finalNotes = JSON.stringify({ 
        _version: '2.0', 
        report: { 
          ...reportData,
          ...(isPakan ? { feed_orts_category: ortsCategory } : {})
        }, 
        notes: notes.trim(),
        batch_id: effectiveBatchId,
        weighing_entries: weighingEntries,
        health_entries: healthEntries
      })
      await updateStatus.mutateAsync({ id: task.id, status: 'selesai', notes: finalNotes })
      if (linkedId) await linkRecord.mutateAsync({ id: task.id, linked_record_id: linkedId, linked_record_table: hooks.weightTable })
      
      setShowSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (err) { 
      console.error(err)
      toast.error('Gagal menyelesaikan tugas. Silakan cek koneksi atau data input.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={cn("bg-[#0C1319]/98 border-white/5 outline-none p-0 flex flex-col z-[5000]", isDesktop ? "w-[600px] border-l backdrop-blur-2xl" : "w-full border-l backdrop-blur-xl")}>
        <div className="flex-1 overflow-y-auto p-5 lg:p-12 space-y-6 lg:space-y-10 custom-scrollbar">
          {showSuccess ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
               <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                 <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center"><CheckCircle2 size={48} className="text-emerald-400" /></div>
                 <h2 className="text-2xl font-bold text-white tracking-tight">Tugas Selesai!</h2>
               </div>
            </div>
          ) : (
            <>
              <SheetHeader className="text-left space-y-2">
                {!isDesktop && <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4" />}
                <SheetTitle className="font-display font-bold text-2xl lg:text-4xl text-white tracking-tight">
                  {isAuditMode ? 'Audit Tugas' : 'Detail Laporan'}
                </SheetTitle>
                <p className="text-sm font-medium text-slate-400">
                  {isAuditMode ? 'Laporan yang dikirim oleh anggota tim.' : 'Lengkapi data verifikasi operasional.'}
                </p>
                <SheetDescription className="sr-only">
                  {isAuditMode ? 'Panel audit tugas operasional' : 'Panel detail laporan tugas harian'}
                </SheetDescription>
              </SheetHeader>

              {isAuditMode && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                      Diselesaikan oleh {task.completed_by?.full_name || task.worker?.full_name || 'Anggota Tim'}
                    </p>
                    {task.completed_at && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">
                        {format(new Date(task.completed_at), 'EEEE, d MMMM yyyy — HH:mm', { locale: idLocale })} WIB
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-8">
                <div className="p-4 lg:p-6 border border-white/5 bg-white/[0.02] rounded-2xl lg:rounded-3xl flex items-center gap-3 lg:gap-5">
                  <div className={cn("w-11 h-11 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0", TASK_TYPE_CFG[task.task_type]?.bg)}>
                    {React.createElement(TASK_TYPE_CFG[task.task_type]?.icon || ClipboardList, { size: 24, className: TASK_TYPE_CFG[task.task_type]?.color })}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-base lg:text-xl text-white line-clamp-2 leading-tight">{task.title}</h4>
                    <p className="text-xs font-semibold text-slate-400 mt-1.5 flex items-center gap-2">
                      <MapPin size={12} className="text-slate-500" /> {task.kandang_name || 'Global Farm'} 
                      <span className="text-white/10">•</span>
                      {task.status === 'selesai' && task.completed_at 
                          ? `Selesai: ${format(new Date(task.completed_at), "HH:mm", { locale: idLocale })}`
                          : `${task.due_time?.substring(0, 5)} WIB`
                        }
                    </p>
                  </div>
                </div>

                {(reportConfig || isMultiAnimalTask || (isAuditMode && (Object.keys(reportData).length > 0 || weighingEntries.length > 0 || healthEntries.length > 0))) && (
                   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center gap-4 px-4 text-[#64748B]">
                         <div className="h-[1px] flex-1 bg-white/5" /><span className="text-[9px] font-black uppercase tracking-[0.4em]">{isAuditMode ? 'Data Laporan Lapangan' : 'Reporting Schema'}</span><div className="h-[1px] flex-1 bg-white/5" />
                      </div>

                      {isAuditMode && (weighingEntries.length > 0 || healthEntries.length > 0) && (
                         <div className="space-y-6">
                            {weighingEntries.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 ml-2">
                                  <Scale size={14} className="text-blue-400" />
                                  <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Detail Timbangan</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {weighingEntries.map((e, idx) => (
                                    <div key={idx} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                                      <span className="text-[10px] font-black text-white">{e.eartag}</span>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-display font-black text-blue-400">{e.weight_kg}kg</span>
                                        {e.girth_cm && <span className="text-[10px] text-[#4B6478]">{e.girth_cm}cm</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {healthEntries.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 ml-2">
                                  <Activity size={14} className="text-emerald-400" />
                                  <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Detail Penanganan</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {healthEntries.map((e, idx) => (
                                    <div key={idx} className="p-3 px-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-black text-white uppercase tracking-wider">{e.eartag}</span>
                                        <span className="text-[11px] font-medium text-emerald-400/80">{e.medicine_name || 'Obat/Vaksin'}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-xs font-bold text-white">{e.dosage || '1'}ml</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                         </div>
                      )}

                      <div className="grid grid-cols-1 gap-8">
                         {isMultiAnimalTask && !isAuditMode && animals.length === 0 && (
                           <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                             <AlertTriangle className="text-orange-500 shrink-0" size={18} />
                             <p className="text-[10px] font-bold text-orange-200/80 uppercase tracking-wider leading-relaxed">Belum ada batch aktif yang terdeteksi untuk lapor data {TASK_TYPE_CFG[task.task_type]?.label?.toLowerCase()}</p>
                           </div>
                         )}
                         {isMultiAnimalTask && !isAuditMode && animals.length > 0 && (
                            <div className="space-y-6 pt-2 pb-6 border-b border-white/5">
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Pilih {config.animalLabel} (Identitas) *</label>
                                  <Select value={weighingData.animal_id} onValueChange={v => {
                                      const animal = animals.find(a => a.id === v);
                                      setWeighingData(w => ({ ...w, animal_id: v, weight_kg: animal?.entry_weight_kg ? animal.entry_weight_kg.toString() : w.weight_kg }));
                                  }}>
                                     <SelectTrigger className="h-12 lg:h-16 rounded-xl lg:rounded-[28px] bg-black/40 border border-white/5 px-4 lg:px-8 text-white focus:ring-0"><SelectValue placeholder={`Pilih Tag/Eartag ${config.animalLabel}...`} /></SelectTrigger>
                                     <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-3xl max-h-[300px]">
                                        {animals.map(a => (
                                          <SelectItem key={a.id} value={a.id} className="rounded-xl focus:bg-purple-500/10 focus:text-purple-300">
                                            {a.name || a.ear_tag || `ID: ${a.id.substring(0,8)}`} {a.entry_weight_kg ? `(${a.entry_weight_kg} kg awal)` : ''}
                                          </SelectItem>
                                        ))}
                                     </SelectContent>
                                  </Select>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-3 lg:space-y-4"><label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-2 lg:ml-4">Berat Aktual *</label><InputNumber value={weighingData.weight_kg} onChange={v => setWeighingData(w => ({ ...w, weight_kg: v }))} suffix=" kg" placeholder="0.0" className="h-12 lg:h-16 rounded-xl lg:rounded-[28px] bg-black/40 border-white/5 font-display text-lg lg:text-xl px-4 lg:px-8 focus:bg-black/60 transition-all border-none shadow-inner w-full" /></div>
                                  <div className="space-y-3 lg:space-y-4"><label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-2 lg:ml-4">Lingkar Dada</label><InputNumber value={weighingData.girth_cm} onChange={v => setWeighingData(w => ({ ...w, girth_cm: v }))} suffix=" cm" placeholder="0.0" className="h-12 lg:h-16 rounded-xl lg:rounded-[28px] bg-black/40 border-white/5 font-display text-lg lg:text-xl px-4 lg:px-8 focus:bg-black/60 transition-all border-none shadow-inner w-full" /></div>
                               </div>

                               {renderExtraReportFields && renderExtraReportFields('timbang', weighingData, setWeighingData)}
                            </div>
                         )}

                         {isAuditMode && (task.task_type === 'pakan' || task.task_type === 'pemberian_pakan') && (reportData.feed_orts_category || ortsCategory) && (
                             <div className="flex flex-col gap-1 p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10">
                               <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest leading-none mb-2">Kondisi Sisa Pakan Sebelumnya</span>
                               <div className="flex items-center gap-3">
                                 <span className="text-2xl animate-pulse">
                                   {(reportData.feed_orts_category || ortsCategory) === 'habis' ? '👍' : (reportData.feed_orts_category || ortsCategory) === 'sedikit' ? '🟡' : '🔴'}
                                 </span>
                                 <span className="text-xl font-display font-black text-white uppercase tracking-tight">
                                   {(reportData.feed_orts_category || ortsCategory) === 'habis' ? 'Habis / Puas' : (reportData.feed_orts_category || ortsCategory) === 'sedikit' ? 'Sisa Sedikit' : 'Sisa Banyak'}
                                 </span>
                               </div>
                             </div>
                          )}

                          {isAuditMode && Object.keys(reportData).length > 0 && !reportConfig && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {Object.entries(reportData).map(([k, v]) => (
                                <div key={k} className="flex flex-col gap-1 p-5 rounded-3xl bg-white/[0.03] border border-white/5">
                                  <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest">{k.replace('_', ' ')}</span>
                                  <span className="text-lg font-bold text-white leading-tight">{Array.isArray(v) ? v.join(', ') : v}</span>
                                </div>
                              ))}
                            </div>
                         )}

                         {reportConfig?.fields.map(f => (
                            <div key={f.id} className="space-y-4">
                               <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">{f.label} {f.required && !isAuditMode && '*'}</label>
                               {isAuditMode ? (
                                 <div className="h-14 rounded-[28px] bg-black/20 border border-white/5 px-8 flex items-center text-white font-bold">
                                   {Array.isArray(reportData[f.id]) ? reportData[f.id].join(', ') : (reportData[f.id] || <span className="text-[#4B6478]">—</span>)}
                                   {f.suffix && reportData[f.id] && <span className="ml-1 text-[#64748B]">{f.suffix}</span>}
                                 </div>
                               ) : (
                                 <>
                                   {f.type === 'number' && <InputNumber value={reportData[f.id] || ''} onChange={v => setReportData(rd => ({ ...rd, [f.id]: v }))} suffix={f.suffix} placeholder={f.placeholder} className="h-16 rounded-[28px] bg-black/40 border-white/5 font-display text-xl px-8 focus:bg-black/60 transition-all border-none shadow-inner" />}
                                   {f.type === 'text' && <input type="text" value={reportData[f.id] || ''} onChange={e => setReportData(rd => ({ ...rd, [f.id]: e.target.value }))} placeholder={f.placeholder} className="w-full h-16 rounded-[28px] bg-black/40 border border-white/5 px-8 text-white focus:bg-black/60 outline-none transition-all shadow-inner" />}
                                   {f.type === 'select' && (<Select value={reportData[f.id] || ""} onValueChange={v => setReportData(rd => ({ ...rd, [f.id]: v }))}><SelectTrigger className="h-16 rounded-[28px] bg-black/40 border border-white/5 px-8 text-white focus:ring-0"><SelectValue placeholder={f.placeholder} /></SelectTrigger><SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-3xl">{f.options.map(opt => (<SelectItem key={opt} value={opt} className="rounded-xl focus:bg-purple-500/10 focus:text-purple-300">{opt}</SelectItem>))}</SelectContent></Select>)}
                                   {f.type === 'multi-checkbox' && (<div className="flex flex-wrap gap-2.5 px-2">{f.options.map(opt => { const isSelected = reportData[f.id]?.includes(opt); return (<button key={opt} onClick={() => { const current = reportData[f.id] || []; const next = isSelected ? current.filter(x => x !== opt) : [...current, opt]; setReportData(rd => ({ ...rd, [f.id]: next })) }} className={cn("px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95", isSelected ? "bg-[#7C3AED]/20 border-[#7C3AED]/40 text-purple-300 shadow-[0_0_20px_rgba(124,58,237,0.2)] scale-105" : "bg-white/5 border-white/5 text-[#64748B] hover:bg-white/10")}>{opt}</button>) })}</div>)}
                                   {f.type === 'container_calc' && <ContainerCalcField field={f} reportData={reportData} setReportData={setReportData} />}
                                 </>
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                 {(task.task_type === 'pakan' || task.task_type === 'pemberian_pakan') && !isAuditMode && (
                    <div className="space-y-6 pt-2 animate-in slide-in-from-top-4 duration-700">
                       <div className="flex flex-col gap-2 ml-4">
                          <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.4em]">Feedback Sisa Pakan Sebelumnya *</label>
                          <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest">Wajib diisi untuk akurasi monitoring pakan</p>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'habis', label: 'Habis/Puas', icon: '👍', active: 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]' },
                          { id: 'sedikit', label: 'Sisa Sedikit', icon: '🟡', active: 'bg-amber-500 border-amber-400 text-slate-900 shadow-[0_0_30px_rgba(245,158,11,0.3)]' },
                          { id: 'banyak', label: 'Sisa Banyak', icon: '🔴', active: 'bg-rose-500 border-rose-400 text-white shadow-[0_0_30px_rgba(244,63,94,0.3)]' },
                        ].map((opt) => {
                          const isSelected = ortsCategory === opt.id
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setOrtsCategory(opt.id)}
                              className={cn(
                                "flex flex-col items-center justify-center py-4 lg:py-6 rounded-2xl lg:rounded-[32px] border-2 transition-all duration-300 active:scale-95 group",
                                isSelected ? opt.active : "bg-black/20 border-white/5 text-slate-500 hover:bg-black/40 hover:border-white/10"
                              )}
                            >
                              <span className={cn("text-2xl lg:text-3xl mb-1.5 lg:mb-2 transition-transform duration-500", isSelected ? "scale-125 rotate-[12deg]" : "group-hover:scale-110")}>
                                {opt.icon}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-[0.1em]">{opt.label}</span>
                            </button>
                          )
                        })}
                       </div>
                    </div>
                 )}

                 {(notes || !isAuditMode) && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">
                      {isAuditMode ? 'Catatan dari Lapangan' : 'Observation Notes'}
                    </label>
                    {isAuditMode ? (
                      notes ? (
                        <div className="w-full bg-black/20 border border-white/5 rounded-[40px] p-8 text-sm text-white min-h-[80px] leading-relaxed">{notes}</div>
                      ) : (
                        <div className="w-full bg-black/20 border border-white/5 rounded-[40px] p-8 text-sm text-[#4B6478] min-h-[80px]">Tidak ada catatan.</div>
                      )
                    ) : (
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tuliskan detail temuan atau kendala lapangan di sini..." className="w-full bg-black/30 border border-white/5 rounded-2xl lg:rounded-[40px] p-5 lg:p-8 text-sm text-white focus:border-[#7C3AED]/50 outline-none min-h-[120px] lg:min-h-[180px] resize-none shadow-2xl transition-all hover:bg-black/40" />
                    )}
                  </div>
                )}

                {renderExtraReportFields && renderExtraReportFields('footer', reportData, setReportData)}
              </div>
            </>
          )}
        </div>
        {!showSuccess && (
          <div className="p-5 lg:p-8 border-t border-white/5 bg-[#0C1319] shrink-0 flex items-center gap-3 lg:gap-4">
            {isAuditMode ? (
              <Button onClick={() => onOpenChange(false)} className="flex-1 h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all">Tutup</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all border border-transparent px-5 lg:px-8">Batal</Button>
                <Button onClick={handleComplete} disabled={updateStatus.isPending} className="flex-1 h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-emerald-500 hover:bg-emerald-600 border-none shadow-[0_0_20px_rgba(16,185,129,0.3)] text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
                  {updateStatus.isPending ? 'Menyimpan...' : 'Selesaikan Tugas'}
                </Button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function AdHocTaskSheet({ 
  open, onOpenChange, isDesktop, 
  hooks, livestockType, 
  TASK_TYPE_CFG, useAssignableMembers, createTask 
}) {
  const { data: batches = [] } = hooks.useBatches()
  const { data: team = [] } = useAssignableMembers()
  const [form, setForm] = useState({ title: '', task_type: 'lainnya', kandang_name: '', assigned_profile_id: '', due_date: format(new Date(), 'yyyy-MM-dd'), due_time: format(new Date(), 'HH:mm:ss'), description: '', repetition: 'sekali' })
  
  const kandangs = useMemo(() => [...new Set(batches.map(b => b.kandang_name).filter(Boolean))], [batches])
  const handleSave = () => {
    if (!form.title) return toast.error('Judul tugas wajib diisi')
    
    let payloads = []
    const basePayload = { 
      title: form.title, task_type: form.task_type, 
      kandang_name: form.kandang_name === 'none' ? null : form.kandang_name, 
      assigned_profile_id: form.assigned_profile_id === 'none' ? null : form.assigned_profile_id,
      due_time: form.due_time, description: form.description,
      livestock_type: livestockType,
    }

    const startDate = parseISO(form.due_date)
    let endDate = startDate
    if (form.repetition === 'mingguan') endDate = endOfWeek(startDate, { weekStartsOn: 1 })
    else if (form.repetition === 'bulanan') endDate = endOfMonth(startDate)

    const intervalDays = eachDayOfInterval({ start: startDate, end: endDate })
    for (const day of intervalDays) { payloads.push({ ...basePayload, due_date: format(day, 'yyyy-MM-dd') }) }

    createTask.mutate(payloads.length === 1 ? payloads[0] : payloads, { onSuccess: () => { 
      onOpenChange(false); 
      setForm({ title: '', task_type: 'lainnya', kandang_name: '', assigned_profile_id: '', due_date: format(new Date(), 'yyyy-MM-dd'), due_time: format(new Date(), 'HH:mm:ss'), description: '', repetition: 'sekali' }); 
    }})
  }

  const uniqueTaskTypes = useMemo(() => {
    const seen = new Set()
    return Object.entries(TASK_TYPE_CFG).filter(([k, v]) => {
      if (seen.has(v.label)) return false
      seen.add(v.label)
      return true
    })
  }, [TASK_TYPE_CFG])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={cn("bg-[#06090F]/95 border-white/5 outline-none p-0 flex flex-col", isDesktop ? "w-[480px] border-l backdrop-blur-xl" : "w-full border-l backdrop-blur-xl")}>
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6 lg:space-y-8 custom-scrollbar">
          <SheetHeader className="text-left space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30 mb-2"><Plus size={20} className="text-[#A78BFA]" /></div>
            <SheetTitle className="font-display font-black text-2xl text-white tracking-tight">Buka Tugas Baru</SheetTitle>
            <SheetDescription className="text-sm text-[#4B6478]">Buat penugasan operasional kandang baru.</SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8]">Judul Tugas <span className="text-red-400">*</span></label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Contoh: Pembersihan Palung Unit A" className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm font-medium text-white focus:bg-white/10 focus:border-[#7C3AED]/50 outline-none transition-all placeholder:text-white/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#94A3B8]">Tipe Tugas</label>
                  <Select value={form.task_type} onValueChange={v => setForm(f => ({ ...f, task_type: v }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 px-4 text-sm text-white"><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
                    <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl">
                      {uniqueTaskTypes.map(([k, v]) => (<SelectItem key={k} value={k} className="rounded-lg">{v.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#94A3B8]">Area Kandang</label>
                  <Select value={form.kandang_name} onValueChange={v => setForm(f => ({ ...f, kandang_name: v }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 px-4 text-sm text-white"><SelectValue placeholder="Semua Unit" /></SelectTrigger>
                    <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl max-h-[300px]">
                      <SelectItem value="none" className="rounded-lg">Semua Unit</SelectItem>
                      {kandangs.map(n => <SelectItem key={n} value={n} className="rounded-lg">{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8]">Assign Pekerja (Opsional)</label>
              <Select value={form.assigned_profile_id} onValueChange={v => setForm(f => ({ ...f, assigned_profile_id: v }))}>
                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 px-4 text-sm text-white"><SelectValue placeholder="Biarkan kosong untuk Auto-Assign nanti" /></SelectTrigger>
                <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl max-h-[300px]">
                  <SelectItem value="none" className="rounded-lg text-white/50 italic">Jangan assign sekarang</SelectItem>
                  {team.map(m => <SelectItem key={m.id} value={m.id} className="rounded-lg">{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2"><label className="text-xs font-bold text-[#94A3B8]">Tanggal Mulai</label><DatePicker value={form.due_date} onChange={d => setForm(f => ({ ...f, due_date: d }))} className="h-12 rounded-xl bg-white/5 border-white/10 flex items-center px-4 w-full text-sm" /></div>
               <div className="space-y-2"><label className="text-xs font-bold text-[#94A3B8]">Waktu Eksekusi</label><input type="time" step="1" value={form.due_time} onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))} className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white focus:bg-white/10 focus:border-[#7C3AED]/50 outline-none transition-all" /></div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8]">Pengulangan Tugas</label>
              <Select value={form.repetition} onValueChange={v => setForm(f => ({ ...f, repetition: v }))}>
                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 px-4 text-sm text-white"><SelectValue placeholder="Sekali Saja" /></SelectTrigger>
                <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl"><SelectItem value="sekali" className="rounded-lg">Sekali Saja</SelectItem><SelectItem value="mingguan" className="rounded-lg">Hasilkan untuk 1 Minggu (7 Tugas)</SelectItem><SelectItem value="bulanan" className="rounded-lg">Hasilkan untuk 1 Bulan (30 Tugas)</SelectItem></SelectContent>
              </Select>
              <p className="text-[10px] text-[#4B6478] px-1 mt-1">Sistem akan secara otomatis membuat tugas-tugas terpisah untuk hari-hari selanjutnya.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8]">Catatan / Instruksi</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Instruksi spesifik atau keterangan tambahan..." className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:bg-white/10 focus:border-[#7C3AED]/50 outline-none min-h-[100px] resize-none placeholder:text-white/20" />
            </div>
          </div>
        </div>
        <div className="p-5 lg:p-8 pt-4 border-t border-white/10 bg-[#06090F]">
          <Button onClick={handleSave} disabled={createTask.isPending} className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
            {createTask.isPending ? 'Menyimpan...' : 'Buat Tugas'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Disease reference — common sheep/goat diseases in Indonesia ──────────────
const SHEEP_DISEASES = [
  { name: 'PMK (Penyakit Mulut & Kuku)',      contagious: true,  severity: 'kritis', symptoms: 'Luka lepuh di mulut, kaki, puting; air liur berlebih',        action: 'KARANTINA SEGERA, lapor Dinas Peternakan' },
  { name: 'Scabies (Kudis)',                   contagious: true,  severity: 'tinggi', symptoms: 'Gatal hebat, keropeng, bulu rontok, kulit menebal',            action: 'Ivermectin/doramectin injeksi, isolasi ternak' },
  { name: 'Orf (Ecthyma Contagiosum)',         contagious: true,  severity: 'sedang', symptoms: 'Luka keropeng di bibir, moncong, dan kaki',                   action: 'Isolasi, bersihkan luka, vaksin tersedia' },
  { name: 'Brucellosis',                       contagious: true,  severity: 'tinggi', symptoms: 'Keguguran, orchitis, sendi bengkak',                          action: 'Karantina ketat, konsultasi drh (zoonosis!)' },
  { name: 'Pasteurellosis (Snot)',             contagious: true,  severity: 'tinggi', symptoms: 'Demam tinggi, sulit napas, leleran hidung kental',            action: 'Antibiotik (oksitetrasiklin), isolasi batch' },
  { name: 'Pink Eye (Keratokonjungtivitis)',   contagious: true,  severity: 'rendah', symptoms: 'Mata merah, berair, bengkak, sensitif cahaya',                action: 'Salep mata antibiotik, isolasi dari sinar' },
  { name: 'Cacingan (Helminthiasis)',          contagious: false, severity: 'sedang', symptoms: 'Kurus, anemia, diare, bulu kusam, rahang bawah bengkak',      action: 'Albendazole/ivermectin, rotasi kandang' },
  { name: 'Kembung (Bloat)',                   contagious: false, severity: 'kritis', symptoms: 'Perut kiri membesar tiba-tiba, gelisah, sulit napas',          action: 'DARURAT: trokar/selang lambung, sirup antibuih' },
  { name: 'Diare / Enteritis',                 contagious: false, severity: 'sedang', symptoms: 'Feses encer atau berdarah, lemas, dehidrasi',                 action: 'Rehidrasi oral, probiotik, evaluasi pakan' },
  { name: 'Pneumonia',                         contagious: false, severity: 'tinggi', symptoms: 'Batuk, sesak napas, demam, hidung berair',                    action: 'Antibiotik, jauhkan dari hujan dan angin' },
  { name: 'Anemia',                            contagious: false, severity: 'sedang', symptoms: 'Selaput lendir pucat, lemas, lesu',                           action: 'Suplemen zat besi, vitamin B12, cek cacing' },
  { name: 'Defisiensi Mineral (White Muscle)', contagious: false, severity: 'sedang', symptoms: 'Lemah, kaku, sulit berdiri, otot gemetar',                    action: 'Injeksi selenium + vitamin E' },
  { name: 'Luka / Cedera Fisik',               contagious: false, severity: 'rendah', symptoms: 'Luka terbuka, pincang, bengkak lokal',                       action: 'Bersihkan, betadine, verban; pisahkan jika perlu' },
  { name: 'Keracunan Pakan',                   contagious: false, severity: 'tinggi', symptoms: 'Kolik, tremor, kejang, air liur berlebih',                    action: 'Arang aktif, ganti pakan, panggil dokter hewan' },
]

const SEVERITY_CFG = {
  kritis: { label: 'Kritis',  cls: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  tinggi: { label: 'Tinggi',  cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  sedang: { label: 'Sedang',  cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  rendah: { label: 'Rendah',  cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}

const REPORT_CATEGORIES = [
  { id: 'kesehatan', label: 'Kesehatan',  icon: '🩺', logType: 'medis',          color: 'rose' },
  { id: 'pakan',     label: 'Pakan',      icon: '🌿', logType: 'insiden_pakan',   color: 'green' },
  { id: 'kandang',   label: 'Kandang',    icon: '🏠', logType: 'insiden_kandang', color: 'amber' },
  { id: 'lainnya',   label: 'Lainnya',    icon: '📝', logType: 'insiden',         color: 'slate' },
]

export function IncidentReportSheet({
  open, onOpenChange, isDesktop,
  config, hooks, livestockType
}) {
  const { data: batches = [] } = hooks.useActiveBatches()
  const addLog = hooks.useAddHealth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [category, setCategory] = useState('kesehatan')
  const [diseaseSearch, setDiseaseSearch] = useState('')
  const [selectedDisease, setSelectedDisease] = useState(null)
  const [form, setForm] = useState({
    batch_id: '', animal_id: '', symptoms: '', action_taken: '', notes: '',
    log_date: new Date().toISOString().split('T')[0],
  })

  const { data: animals = [] } = hooks.useAnimals?.(form.batch_id) ?? { data: [] }

  useEffect(() => {
    if (batches.length > 0 && !form.batch_id) setForm(f => ({ ...f, batch_id: batches[0].id }))
  }, [batches, form.batch_id])

  useEffect(() => {
    if (!open) {
      setCategory('kesehatan')
      setDiseaseSearch('')
      setSelectedDisease(null)
      setForm({ batch_id: '', animal_id: '', symptoms: '', action_taken: '', notes: '', log_date: new Date().toISOString().split('T')[0] })
    }
  }, [open])

  const filteredDiseases = useMemo(() => {
    if (!diseaseSearch.trim()) return SHEEP_DISEASES
    const q = diseaseSearch.toLowerCase()
    return SHEEP_DISEASES.filter(d => d.name.toLowerCase().includes(q) || d.symptoms.toLowerCase().includes(q))
  }, [diseaseSearch])

  function selectDisease(d) {
    setSelectedDisease(d)
    setDiseaseSearch(d.name)
    setForm(f => ({ ...f, symptoms: d.symptoms, action_taken: d.action }))
  }

  async function handleSubmit() {
    if (!form.batch_id) return toast.error('Pilih batch terlebih dahulu')
    if (!form.symptoms) return toast.error('Deskripsi / gejala wajib diisi')
    const cat = REPORT_CATEGORIES.find(c => c.id === category)
    setIsSubmitting(true)
    try {
      await addLog.mutateAsync({
        batch_id: form.batch_id,
        log_date: form.log_date,
        log_type: cat.logType,
        animal_id: form.animal_id || null,
        symptoms: form.symptoms,
        action_taken: form.action_taken,
        diagnosis: category === 'kesehatan' ? (selectedDisease?.name || 'Menunggu Observasi') : cat.label,
        notes: form.notes,
      })
      toast.success('Laporan berhasil dikirim!')
      onOpenChange(false)
    } catch { toast.error('Gagal mengirim laporan') } finally { setIsSubmitting(false) }
  }

  const activeCat = REPORT_CATEGORIES.find(c => c.id === category)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={cn("bg-[#0C1319]/98 border-white/10 outline-none p-0 flex flex-col z-[6000]", isDesktop ? "w-[540px] border-l backdrop-blur-xl" : "w-full border-l backdrop-blur-3xl")}>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="text-xl font-black text-white tracking-tight">Buat Laporan</SheetTitle>
            <SheetDescription className="text-[11px] text-[#4B6478] font-bold uppercase tracking-widest">Dokumentasikan masalah di lapangan</SheetDescription>
          </SheetHeader>

          {/* Category selector */}
          <div className="grid grid-cols-4 gap-2">
            {REPORT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setSelectedDisease(null); setDiseaseSearch('') }}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-center transition-all',
                  category === cat.id
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478] hover:text-white'
                )}
              >
                <span className="text-xl leading-none">{cat.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-wider leading-none">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Batch + date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest block mb-1.5 ml-1">Batch</label>
              <Select value={form.batch_id} onValueChange={v => setForm(f => ({ ...f, batch_id: v, animal_id: '' }))}>
                <SelectTrigger className="h-11 bg-black/40 border border-white/5 rounded-xl text-sm text-white outline-none ring-0">
                  <SelectValue placeholder="Pilih batch..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0C1319] border-white/10 rounded-2xl">
                  {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.batch_code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest block mb-1.5 ml-1">Tanggal</label>
              <input
                type="date"
                value={form.log_date}
                onChange={e => setForm(f => ({ ...f, log_date: e.target.value }))}
                className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-3 text-sm text-white outline-none"
              />
            </div>
          </div>

          {/* Kesehatan: animal + disease picker */}
          {category === 'kesehatan' && (
            <>
              <div>
                <label className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest block mb-1.5 ml-1">Ternak (opsional)</label>
                <Select value={form.animal_id || 'all'} onValueChange={v => setForm(f => ({ ...f, animal_id: v === 'all' ? '' : v }))}>
                  <SelectTrigger className="h-11 bg-black/40 border border-white/5 rounded-xl text-sm text-white outline-none ring-0">
                    <SelectValue placeholder="Seluruh batch / pilih ekor..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0C1319] border-white/10 rounded-2xl max-h-48 overflow-y-auto">
                    <SelectItem value="all">— Seluruh Batch —</SelectItem>
                    {animals.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="font-black">{a.ear_tag}</span>
                        {a.breed && <span className="text-[#4B6478] ml-2 text-[10px]">{a.breed}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <label className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest block mb-1.5 ml-1">Diagnosa / Penyakit</label>
                <input
                  value={diseaseSearch}
                  onChange={e => { setDiseaseSearch(e.target.value); setSelectedDisease(null) }}
                  placeholder="Ketik nama penyakit atau gejala..."
                  className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-3 text-sm text-white placeholder:text-[#4B6478] outline-none"
                />
                {/* Disease dropdown */}
                {diseaseSearch && !selectedDisease && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#111C24] border border-white/10 rounded-2xl shadow-2xl z-50 max-h-52 overflow-y-auto">
                    {filteredDiseases.length === 0
                      ? <p className="text-xs text-[#4B6478] p-3 text-center">Tidak ditemukan</p>
                      : filteredDiseases.map(d => (
                        <button
                          key={d.name}
                          onClick={() => selectDisease(d)}
                          className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/[0.04] last:border-0"
                        >
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-xs font-bold text-white leading-tight">{d.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {d.contagious
                                ? <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">⚠ Menular</span>
                                : <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-500/20 text-slate-400 border border-slate-500/30">Tidak Menular</span>
                              }
                              <span className={cn('text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border', SEVERITY_CFG[d.severity].cls)}>{d.severity}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-[#4B6478] leading-tight">{d.symptoms}</p>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Contagion alert */}
              {selectedDisease?.contagious && (
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="text-xs font-black text-rose-400 mb-0.5">Penyakit Menular!</p>
                    <p className="text-[10px] text-rose-300/70 leading-relaxed">Pertimbangkan isolasi ternak yang terinfeksi. Tindakan: {selectedDisease.action}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Symptoms / description */}
          <div>
            <label className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest block mb-1.5 ml-1">
              {category === 'kesehatan' ? 'Gejala Teramati' : 'Deskripsi Masalah'} *
            </label>
            <textarea
              value={form.symptoms}
              onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
              placeholder={
                category === 'kesehatan' ? 'Jelaskan gejala yang terlihat...'
                : category === 'pakan'   ? 'Jelaskan masalah pakan (kualitas, kuantitas, jenis)...'
                : category === 'kandang' ? 'Jelaskan kondisi kandang (kerusakan, kebersihan, dll)...'
                : 'Jelaskan masalah lainnya...'
              }
              rows={3}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] outline-none resize-none"
            />
          </div>

          {/* Action taken */}
          <div>
            <label className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest block mb-1.5 ml-1">Tindakan yang Dilakukan</label>
            <input
              value={form.action_taken}
              onChange={e => setForm(f => ({ ...f, action_taken: e.target.value }))}
              placeholder="Langkah yang sudah / akan diambil..."
              className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-3 text-sm text-white placeholder:text-[#4B6478] outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest block mb-1.5 ml-1">Catatan Tambahan</label>
            <input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Info lain yang relevan..."
              className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-3 text-sm text-white placeholder:text-[#4B6478] outline-none"
            />
          </div>
        </div>

        <div className="p-5 border-t border-white/[0.06] bg-[#0C1319] shrink-0">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm rounded-2xl transition-all outline-none border-none shadow-lg shadow-rose-900/30"
          >
            {isSubmitting ? 'Mengirim...' : `Kirim Laporan ${activeCat?.icon}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function CriticalOverdueAlert({ tasks, TASK_TYPE_CFG }) {
  const criticals = tasks.filter(t => t.status === 'terlambat' && (t.task_type === 'vaksinasi' || t.task_type === 'timbang'))
  if (criticals.length === 0) return null
  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="mb-4 lg:mb-10 p-5 lg:p-10 rounded-2xl lg:rounded-[56px] border border-rose-500/20 bg-rose-500/[0.03] backdrop-blur-3xl flex items-start gap-4 lg:gap-8 relative overflow-hidden group shadow-2xl shadow-rose-900/20">
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/[0.04] blur-[100px] -mr-40 -mt-40 pointer-events-none" />
      <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-xl lg:rounded-[28px] bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(244,63,94,0.3)]"><AlertTriangle size={20} className="text-rose-400 lg:hidden" /><AlertTriangle size={32} className="text-rose-400 hidden lg:block" /></div>
      <div className="flex-1">
        <p className="text-[10px] lg:text-[11px] font-black text-rose-400 uppercase tracking-[0.3em] lg:tracking-[0.6em] mb-1.5 lg:mb-3 font-display">Overdue Alert</p>
        <p className="text-base lg:text-2xl font-black text-white leading-tight tracking-tight">{criticals.length} Tugas Medis Terhambat</p>
        <div className="flex flex-wrap gap-1.5 lg:gap-2 mt-2 lg:mt-4">{criticals.map(t => <span key={t.id} className="text-[10px] lg:text-[11px] font-black text-rose-400/80 bg-rose-500/10 border border-rose-500/20 px-2 lg:px-3 py-0.5 lg:py-1 rounded-lg lg:rounded-xl uppercase tracking-widest">{t.title}</span>)}</div>
      </div>
    </motion.div>
  )
}

export function EmptyState({ isStaff }) {
  return (
    <div className="py-16 lg:py-32 px-6 lg:px-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
       <div className="relative mb-6 lg:mb-12 group">
          <div className="absolute inset-0 bg-purple-500/10 blur-[100px] group-hover:bg-purple-500/20 transition-colors" />
          <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl lg:rounded-[36px] bg-white/[0.03] border border-white/5 flex items-center justify-center relative z-10 shadow-2xl">
             <Wand2 size={28} className="text-white/10 group-hover:text-purple-400/40 transition-all duration-700 group-hover:rotate-12 lg:hidden" />
             <Wand2 size={40} className="text-white/10 group-hover:text-purple-400/40 transition-all duration-700 group-hover:rotate-12 hidden lg:block" />
          </div>
       </div>
       <h3 className="text-lg lg:text-2xl font-black text-white tracking-tight mb-2 lg:mb-4">{isStaff ? 'Sistem Teroptimal' : 'Status: Clear'}</h3>
       <p className="text-xs lg:text-sm text-[#64748B] max-w-[280px] mx-auto font-black uppercase tracking-widest opacity-60 leading-relaxed">
          {isStaff ? 'Seluruh tugas telah diversifikasi.' : 'Belum ada tugas terjadwal.'}
       </p>
       <div className="mt-6 lg:mt-12 flex items-center gap-3"><div className="w-10 h-[1px] bg-white/5" /><span className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.5em]">TernakOS Elite</span><div className="w-10 h-[1px] bg-white/5" /></div>
    </div>
  )
}
