import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, Clock, MapPin, Sparkles, 
  Lock, Save, AlertTriangle, Scale, Syringe, Trash2,
  User, UserCheck, ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InputNumber } from '@/components/ui/InputNumber'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { toast } from 'sonner'
import { getUrgencyLabel } from '@/dashboard/peternak/_shared/utils/taskUtils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getExactName = (task, members = []) => {
  // 1. Check direct completed_by profile
  if (task.completed_by?.full_name) return task.completed_by.full_name
  
  // 2. If we have a members list (lookup), try finding by profile_id
  const completerId = task.completed_by_profile_id || task.completed_by?.id
  if (completerId && members.length > 0) {
    const found = members.find(m => (m.profile_id || m.id) === completerId)
    if (found?.full_name) return found.full_name
  }

  // 3. Check nested kandang_workers or tenant_memberships (if they were joined)
  if (task.completed_by) {
    const workerName = task.completed_by.kandang_workers?.[0]?.full_name
    if (workerName) return workerName
    const memberName = task.completed_by.tenant_memberships?.[0]?.full_name
    if (memberName) return memberName
  }

  // 4. Fallback to assigned worker/profile
  return task.worker?.full_name || task.assigned_profile?.full_name || 'Peternak'
}

// ─── TaskCard ───────────────────────────────────────────────────────────────

// Safe time display — guard against null/undefined producing "undefined WIB"
const safeTime = (task) => {
  if (!task.due_time) return null
  const t = task.due_time.substring(0, 5)
  if (t.startsWith('undef') || t.startsWith('null')) return null
  return t
}

export const TaskCard = ({ task, onClick, TASK_TYPE_CFG, STATUS_CFG, members = [] }) => {
  const cfg = TASK_TYPE_CFG[task.task_type] || TASK_TYPE_CFG.lainnya
  const st = STATUS_CFG[task.status] || STATUS_CFG.pending
  const urgency = getUrgencyLabel(task)
  const isPending = task.status === 'pending' || task.status === 'in_progress'
  const isDone = task.status === 'selesai' || task.status === 'terlambat'
  const displayTime = task.status === 'selesai' && task.completed_at
    ? `${format(new Date(task.completed_at), 'HH:mm')} WIB`
    : safeTime(task) ? `${safeTime(task)} WIB` : '--:--'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group"
    >
      <div className={cn(
        "relative rounded-2xl lg:rounded-[32px] overflow-hidden border transition-all duration-200",
        task.status === 'selesai'     ? "bg-[#0B1310] border-emerald-500/[0.15]" :
        task.status === 'terlambat'   ? "bg-[#150C0E] border-rose-500/[0.25]"    :
        task.status === 'in_progress' ? "bg-[#0B0F18] border-blue-500/[0.20]"   :
        "bg-[#0C1319] border-white/[0.07] hover:border-purple-500/20"
      )}>
        {/* Left status stripe (mobile only) */}
        <div className={cn(
          "lg:hidden absolute left-0 top-0 bottom-0 w-[3px]",
          task.status === 'selesai'     ? "bg-emerald-500" :
          task.status === 'terlambat'   ? "bg-rose-500"    :
          task.status === 'in_progress' ? "bg-blue-500"    :
          "bg-white/10"
        )} />
        {/* Main body */}
        <div className="p-4 lg:p-5 pl-5 lg:pl-5 flex items-start gap-4">
          {/* Task-type icon */}
          <div className={cn(
            "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-lg",
            cfg.bg, cfg.border, cfg.shadow
          )}>
            <cfg.icon size={22} className={cfg.color} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Title + status badge */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className={cn(
                "font-bold text-[13px] lg:text-sm leading-tight line-clamp-2 flex-1 min-w-0",
                isDone ? "text-white/50 line-through" : "text-white group-hover:text-purple-200 transition-colors"
              )}>
                {task.title}
              </h3>
              <div className={cn(
                "shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest whitespace-nowrap",
                st.color, st.bg, st.border
              )}>
                {st.label}
              </div>
            </div>

            {/* Metadata chips */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="flex items-center gap-1.5">
                <MapPin size={10} className="text-[#64748B]" />
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{task.kandang_name || 'Global'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={10} className="text-[#64748B]" />
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{displayTime}</span>
              </div>
              {task.status === 'selesai' && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                  <UserCheck size={10} className="text-emerald-400" />
                  <span className="text-[9.5px] font-black text-emerald-400 uppercase tracking-wider">
                    {getExactName(task, members)}
                  </span>
                </div>
              )}
            </div>

            {/* Urgency badge — visible on all screen sizes */}
            {urgency && (
              <div className={cn(
                "inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-xl text-[9px] font-black border uppercase tracking-[0.12em]",
                urgency.color
              )}>
                <Sparkles size={10} /> {urgency.label}
              </div>
            )}
          </div>
        </div>

        {/* CTA bar — only pending tasks on mobile, gives clear tap affordance */}
        {isPending && (
          <div className="px-4 pb-4 lg:hidden">
            <div className="flex items-center justify-between h-10 px-4 rounded-xl bg-[#7C3AED]/[0.08] border border-[#7C3AED]/20 text-[#A78BFA]">
              <span className="text-[10px] font-black uppercase tracking-widest">Lapor Selesai</span>
              <ChevronRight size={14} className="opacity-60" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const NoBatchWarning = ({ label, animalLabel }) => (
  <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
    <AlertTriangle className="text-orange-500 shrink-0" size={18} />
    <p className="text-[10px] font-bold text-orange-200/80 uppercase tracking-wider leading-relaxed">Belum ada batch aktif yang terdeteksi untuk lapor data {label?.toLowerCase()}</p>
  </div>
)

export function InteractiveCheckCard({ 
  task, onCheck, isExpanded, onToggle, 
  config, TASK_TYPE_CFG, TASK_REPORT_CONFIG, 
  hooks, updateStatus, linkRecord,
  profile, livestockType,
  renderExtraReportFields, // Function to render livestock specific fields (like FAMACHA)
  members = []
}) {
  const cfg = TASK_TYPE_CFG[task.task_type] || TASK_TYPE_CFG.lainnya
  const isSelesai = task.status === 'selesai'
  const urgency = getUrgencyLabel(task)

  const [reportData, setReportData] = useState({})
  const [weighingData, setWeighingData] = useState({ animal_id: '', weight_kg: '', girth_cm: '' })
  const [weighingEntries, setWeighingEntries] = useState([])
  const [healthData, setHealthData] = useState({ animal_id: '', medicine_name: '', dosage: '', notes: '' })
  const [healthEntries, setHealthEntries] = useState([])

  const addWeight = hooks.useAddWeight()
  const addHealth = hooks.useAddHealth()

  const { data: activeBatches = [] } = hooks.useActiveBatches()
  const effectiveBatchId = useMemo(() => {
    if (task.batch_id) return task.batch_id
    if (!activeBatches.length) return null
    if (task.kandang_name) {
      const match = activeBatches.find(b => b.kandang_name === task.kandang_name)
      if (match) return match.id
    }
    return activeBatches[0].id
  }, [task.batch_id, task.kandang_name, activeBatches])

  const { data: animals = [] } = hooks.useAnimals(effectiveBatchId)

  const isMultiAnimalTask = (task.task_type === 'timbang' || task.task_type === 'vaksinasi' || task.task_type === 'obat_cacing') && config.usesIndividualAnimals
  const isHealthTask = task.task_type === 'vaksinasi' || task.task_type === 'obat_cacing'
  
  const reportConfig = isMultiAnimalTask ? null : TASK_REPORT_CONFIG[task.task_type]
  const hasForm = !!reportConfig || isMultiAnimalTask
  const isCarryover = task.status === 'in_progress' && task.due_date < format(new Date(), 'yyyy-MM-dd')
  
  const entriesCount = task.task_type === 'timbang' ? weighingEntries.length : healthEntries.length
  const animalsDone = animals.length > 0 && entriesCount >= animals.length
  
  const unweighedAnimals = animals.filter(a => !weighingEntries.find(e => e.animal_id === a.id))
  const untreatedAnimals = animals.filter(a => !healthEntries.find(e => e.animal_id === a.id))

  useEffect(() => {
    if (task.notes) {
      try {
        const parsed = JSON.parse(task.notes)
        if (parsed._version === '2.0') {
          setReportData(parsed.report || {})
          setWeighingEntries(parsed.weighing_entries || [])
          setHealthEntries(parsed.health_entries || [])
          if (parsed.health_entries?.length > 0 && !healthData.medicine_name) {
            const last = parsed.health_entries[parsed.health_entries.length - 1]
            setHealthData(h => ({ ...h, medicine_name: last.medicine_name, dosage: last.dosage }))
          }
        }
      } catch (e) {}
    } else {
      setWeighingEntries([])
      setHealthEntries([])
    }
  }, [task.notes])

  const handleAction = async (e) => {
    e.stopPropagation()
    if (hasForm && !isExpanded) { onToggle(); return }
    if (isSelesai) { if (isExpanded) onToggle(); return }

    if (isMultiAnimalTask) {
      if (animalsDone) {
        try {
          await updateStatus.mutateAsync({ id: task.id, status: 'selesai' })
          toast.success(`Semua ${config.animalLabelPlural} selesai! Tugas berhasil 🎉`)
          onToggle()
        } catch (err) { toast.error('Gagal menyelesaikan tugas') }
      } else {
        onToggle()
      }
      return
    }

    if (hasForm) {
      if (reportConfig) {
        for (const f of reportConfig.fields) {
          if (f.required && (!reportData[f.id] || reportData[f.id].length === 0)) {
            return toast.error(`${f.label} wajib diisi`)
          }
        }
      }
      try {
        const finalNotes = JSON.stringify({ _version: '2.0', report: reportData, notes: '' })
        await updateStatus.mutateAsync({ id: task.id, status: 'selesai', notes: finalNotes })
        onToggle()
        toast.success('Pekerjaan selesai! Hebat!')
      } catch (err) { console.error(err); toast.error('Gagal menyimpan laporan') }
      return
    }

    onCheck()
  }

  const handleAddWeighing = async (e) => {
    e.stopPropagation()
    if (!weighingData.animal_id || !weighingData.weight_kg) {
      return toast.error(`Pilih ${config.animalLabel} dan masukkan berat`)
    }
    try {
      const selectedAnimal = animals.find(a => a.id === weighingData.animal_id)
      const record = await addWeight.mutateAsync({
        animal_id: weighingData.animal_id,
        batch_id: effectiveBatchId,
        entry_date: selectedAnimal?.entry_date,
        entry_weight_kg: selectedAnimal?.entry_weight_kg,
        weigh_date: format(new Date(), 'yyyy-MM-dd'),
        weight_kg: parseFloat(weighingData.weight_kg),
        girth_cm: weighingData.girth_cm ? parseFloat(weighingData.girth_cm) : null,
        weigh_method: 'timbang_langsung',
        notes: `Auto: ${task.title}`,
        // Spread any extra data (like famacha)
        ...weighingData
      })
      const newEntry = {
        animal_id: weighingData.animal_id,
        eartag: selectedAnimal?.name || selectedAnimal?.ear_tag || selectedAnimal?.id?.substring(0, 8),
        weight_kg: parseFloat(weighingData.weight_kg),
        girth_cm: weighingData.girth_cm ? parseFloat(weighingData.girth_cm) : null,
        weighed_at: new Date().toISOString(),
        record_id: record?.id,
        ...weighingData // Also store in notes metadata
      }
      const newEntries = [...weighingEntries, newEntry]
      const isDone = newEntries.length >= animals.length
      const newNotes = JSON.stringify({ 
        _version: '2.0', 
        report: {}, 
        weighing_entries: newEntries,
        batch_id: effectiveBatchId
      })
      await updateStatus.mutateAsync({ id: task.id, status: isDone ? 'selesai' : 'in_progress', notes: newNotes })
      if (record?.id) await linkRecord.mutateAsync({ id: task.id, linked_record_id: record.id, linked_record_table: hooks.weightTable })
      setWeighingEntries(newEntries)
      setWeighingData({ animal_id: '', weight_kg: '', girth_cm: '' })
      if (isDone) { toast.success(`Semua ${config.animalLabelPlural} selesai ditimbang! 🎉`); onToggle() }
      else toast.success(`${newEntry.eartag} ditimbang (${newEntries.length}/${animals.length})`)
    } catch (err) { console.error(err); toast.error('Gagal menyimpan timbangan') }
  }

  const handleAddHealth = async (e) => {
    e.stopPropagation()
    const isVax = task.task_type === 'vaksinasi'
    const name = healthData.medicine_name || healthData.vaccine_name
    const dose = healthData.dosage
    if (!healthData.animal_id || !name) {
      return toast.error(`Pilih ${config.animalLabel} dan isi nama ${isVax ? 'vaksin' : 'obat'}`)
    }
    try {
      const selectedAnimal = animals.find(a => a.id === healthData.animal_id)
      const record = await addHealth.mutateAsync({
        animal_id: healthData.animal_id,
        batch_id: effectiveBatchId,
        log_date: format(new Date(), 'yyyy-MM-dd'),
        log_type: isVax ? 'vaksin' : 'medis',
        medicine_name: !isVax ? name : undefined,
        vaccine_name: isVax ? name : undefined,
        medicine_dose: dose,
        action_taken: isVax ? 'Vaksinasi Terjadwal' : 'Pemberian Obat Cacing',
        notes: `Auto: ${task.title}`,
        handled_by: profile?.full_name || 'Staff'
      })
      const newEntry = {
        animal_id: healthData.animal_id,
        eartag: selectedAnimal?.name || selectedAnimal?.ear_tag || selectedAnimal?.id?.substring(0, 8),
        medicine_name: name,
        dosage: dose,
        recorded_at: new Date().toISOString(),
        record_id: record?.id
      }
      const newEntries = [...healthEntries, newEntry]
      const isDone = newEntries.length >= animals.length
      const newNotes = JSON.stringify({
        _version: '2.0',
        report: {},
        weighing_entries: weighingEntries,
        health_entries: newEntries,
        batch_id: effectiveBatchId
      })
      await updateStatus.mutateAsync({ id: task.id, status: isDone ? 'selesai' : 'in_progress', notes: newNotes })
      setHealthEntries(newEntries)
      setHealthData(h => ({ ...h, animal_id: '' }))
      if (isDone) { toast.success(`Semua ${config.animalLabelPlural} selesai divaksin/diobati! 🎉`); onToggle() }
      else toast.success(`${newEntry.eartag} tercatat (${newEntries.length}/${animals.length})`)
    } catch (err) { console.error(err); toast.error('Gagal menyimpan record kesehatan') }
  }

  const handleUnlock = async (e) => {
    e.stopPropagation()
    try {
      await updateStatus.mutateAsync({ id: task.id, status: 'pending' })
      toast.success('Gembok dibuka! Silakan edit data.')
    } catch (err) { toast.error('Gagal membuka gembok') }
  }

  return (
    <motion.div
      layout
      style={{ position: 'relative', zIndex: isExpanded ? 20 : 1 }}
      className={cn(
        "group flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden",
        isSelesai
          ? "bg-[#06090F] border-emerald-500/20"
          : isExpanded ? "bg-[#0C1319] border-[#7C3AED]/40 ring-1 ring-[#7C3AED]/20 shadow-xl" : "bg-[#0C1319] border-white/5 hover:border-purple-500/30 hover:bg-[#06090F]"
      )}
    >
      <div className="flex items-stretch min-h-[64px] lg:min-h-[80px]">
        <button 
          onClick={isSelesai ? handleUnlock : handleAction}
          disabled={(!isSelesai && (updateStatus.isPending || addWeight.isPending || addHealth.isPending))}
          className={cn(
            "w-12 lg:w-16 shrink-0 flex flex-col items-center justify-center transition-all relative z-10",
            isSelesai 
              ? "bg-slate-900 text-slate-500 hover:text-emerald-400 border-r border-white/5" 
              : hasForm && isExpanded 
                ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                : "border-r border-white/5 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10"
          )}
        >
          {updateStatus.isPending || addWeight.isPending || addHealth.isPending ? (
             <LoadingSpinner className="w-5 h-5" />
          ) : isSelesai ? (
             <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                <Lock size={18} className="text-emerald-500/50" />
                <span className="text-[7px] font-bold uppercase text-emerald-500/40">Locked</span>
             </div>
          ) : (
            <div className={cn(
              "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all",
              (hasForm && isExpanded) || (isMultiAnimalTask && entriesCount > 0)
                ? "border-purple-500 bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                : "border-current bg-transparent"
            )}>
              {isMultiAnimalTask && (entriesCount > 0 || isExpanded) && animals.length > 0
                ? <span className="text-[11px] font-black leading-none">{entriesCount}<span className="text-[8px] font-bold opacity-60">/{animals.length}</span></span>
                : (hasForm && isExpanded) ? <Save size={18} strokeWidth={3} /> : <CheckCircle2 size={20} strokeWidth={3} />}
            </div>
          )}
        </button>

        <div onClick={handleAction} className="flex-1 p-3 lg:p-4 flex items-center justify-between transition-colors cursor-pointer">
          <div className="flex-1 min-w-0 pr-2 lg:pr-4">
            <div className="flex items-center gap-2 mb-1.5">
               <span className={cn("text-[9px] font-black uppercase py-0.5 px-1.5 rounded bg-white/5", cfg.color)}>{cfg.label}</span>
               {isCarryover && <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 animate-pulse">Terlewat</span>}
               {isSelesai && <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Selesai</span>}
            </div>
            <h4 className={cn("text-[13px] lg:text-sm font-bold line-clamp-2 transition-colors", isSelesai ? "text-slate-500 line-through" : "text-white group-hover:text-purple-300")}>{task.title}</h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 opacity-60">
               <div className="flex items-center gap-1"><MapPin size={10} /><span className="text-[10px] lg:text-[9px] font-bold uppercase tracking-wider">{task.kandang_name || 'Global'}</span></div>
               <div className="flex items-center gap-1">
                 <Clock size={10} />
                 <span className="text-[10px] lg:text-[9px] font-bold uppercase tracking-wider">
                   {isSelesai && task.completed_at
                     ? `${format(new Date(task.completed_at), 'HH:mm')} WIB`
                     : task.due_time ? `${task.due_time.substring(0, 5)} WIB` : '--:--'}
                 </span>
               </div>
               {isSelesai && (
                 <div className="flex items-center gap-1 text-emerald-400/80">
                   <User size={10} />
                    <span className="text-[10px] lg:text-[9px] font-bold uppercase tracking-wider">
                      {getExactName(task, members)}
                    </span>
                 </div>
               )}
            </div>
          </div>
          {urgency && !isSelesai && (
             <div className={cn("flex px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shrink-0", urgency.color)}>{urgency.label}</div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 lg:p-6 bg-black/20 border-t border-white/5 space-y-6">
           {isMultiAnimalTask && (
              <div className="space-y-6">
                 {animals.length === 0 && <NoBatchWarning label={cfg.label} animalLabel={config.animalLabel} />}
                 {animals.length > 0 && (
                    <div className="space-y-6">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Pilih {config.animalLabel} *</label>
                          <Select 
                            value={task.task_type === 'timbang' ? weighingData.animal_id : healthData.animal_id} 
                            onValueChange={v => task.task_type === 'timbang' ? setWeighingData(w => ({...w, animal_id: v})) : setHealthData(h => ({...h, animal_id: v}))}
                          >
                             <SelectTrigger className="h-12 lg:h-16 rounded-xl lg:rounded-[28px] bg-black/40 border border-white/5 px-4 lg:px-8 text-white focus:ring-0">
                               <SelectValue placeholder={`Pilih ${config.animalLabel}...`} />
                             </SelectTrigger>
                             <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-3xl max-h-[300px]">
                                {(task.task_type === 'timbang' ? unweighedAnimals : untreatedAnimals).map(a => (
                                  <SelectItem key={a.id} value={a.id} className="rounded-xl focus:bg-purple-500/10 focus:text-purple-300">
                                    {a.name || a.ear_tag || `ID: ${a.id.substring(0,8)}`}
                                  </SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>

                       {task.task_type === 'timbang' && (
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Berat (KG) *</label>
                                <InputNumber value={weighingData.weight_kg} onChange={v => setWeighingData(w => ({...w, weight_kg: v}))} placeholder="0.0" className="h-12 lg:h-16 bg-black/40 border-white/5 rounded-xl lg:rounded-[28px]" />
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Lkr Dada (CM)</label>
                                <InputNumber value={weighingData.girth_cm} onChange={v => setWeighingData(w => ({...w, girth_cm: v}))} placeholder="Opsional" className="h-12 lg:h-16 bg-black/40 border-white/5 rounded-xl lg:rounded-[28px]" />
                             </div>
                             {renderExtraReportFields && renderExtraReportFields('timbang', weighingData, setWeighingData)}
                             <Button onClick={handleAddWeighing} disabled={addWeight.isPending} className="col-span-2 h-12 lg:h-16 rounded-xl lg:rounded-[28px] bg-purple-500 text-white font-black uppercase tracking-widest shadow-xl shadow-purple-900/40">
                                {addWeight.isPending ? <LoadingSpinner /> : 'Simpan Timbangan'}
                             </Button>
                          </div>
                       )}

                       {isHealthTask && (
                          <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                   <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Nama {isHealthTask ? (task.task_type === 'vaksinasi' ? 'Vaksin' : 'Obat') : 'Input'} *</label>
                                   <input className="w-full h-12 lg:h-16 bg-black/40 border border-white/5 rounded-xl lg:rounded-[28px] px-6 text-sm text-white focus:outline-none focus:border-purple-500/50" value={healthData.medicine_name || ''} onChange={e => setHealthData(h => ({...h, medicine_name: e.target.value}))} placeholder="Contoh: Anthrax B-12" />
                                </div>
                                <div className="space-y-4">
                                   <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Dosis (ML/Gram)</label>
                                   <input className="w-full h-12 lg:h-16 bg-black/40 border border-white/5 rounded-xl lg:rounded-[28px] px-6 text-sm text-white focus:outline-none focus:border-purple-500/50" value={healthData.dosage || ''} onChange={e => setHealthData(h => ({...h, dosage: e.target.value}))} placeholder="Contoh: 2ml" />
                                </div>
                             </div>
                             <Button onClick={handleAddHealth} disabled={addHealth.isPending} className="w-full h-12 lg:h-16 rounded-xl lg:rounded-[28px] bg-purple-500 text-white font-black uppercase tracking-widest shadow-xl shadow-purple-900/40">
                                {addHealth.isPending ? <LoadingSpinner /> : 'Catat Kesehatan'}
                             </Button>
                          </div>
                       )}
                    </div>
                 )}
              </div>
           )}

           {reportConfig && (
              <div className="space-y-6">
                {reportConfig.fields.map(field => (
                  <div key={field.id} className="space-y-3">
                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">{field.label} {field.required && '*'}</label>
                    {field.type === 'number' && <InputNumber value={reportData[field.id]} onChange={v => setReportData(d => ({...d, [field.id]: v}))} placeholder={field.placeholder} className="h-12 lg:h-16 bg-black/40 border-white/5 rounded-xl lg:rounded-[28px]" />}
                    {field.type === 'select' && (
                      <Select value={reportData[field.id]} onValueChange={v => setReportData(d => ({...d, [field.id]: v}))}>
                        <SelectTrigger className="h-12 lg:h-16 rounded-xl lg:rounded-[28px] bg-black/40 border border-white/5 px-6 lg:px-8 text-white focus:ring-0"><SelectValue placeholder={field.placeholder} /></SelectTrigger>
                        <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-3xl">{field.options.map(o => <SelectItem key={o} value={o} className="rounded-xl">{o}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
           )}
           
           {renderExtraReportFields && renderExtraReportFields('footer', reportData, setReportData)}
        </div>
      )}
    </motion.div>
  )
}
