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
import { ContainerCalcField } from '@/dashboard/peternak/_shared/components/TaskSheets'
import { usePeternakFarms } from '@/lib/hooks/usePeternakData'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'
import { calculateDistance, getCurrentPosition } from '@/dashboard/peternak/_shared/utils/geofenceUtils'
import { BCS_OPTIONS, FAMACHA_OPTIONS, FAMACHA_COLOR, BCS_LABEL, WEIGH_METHOD_LABEL } from './ternak/constants'
import { supabase } from '@/lib/supabase'

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

export const TaskCard = ({ task, onClick, TASK_TYPE_CFG, STATUS_CFG, members = [], activeFilter, auditRange }) => {
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
        "relative rounded-xl lg:rounded-[32px] overflow-hidden border transition-all duration-200",
        task.status === 'selesai'     ? "bg-[#0B1310] border-emerald-500/[0.15]" :
        task.status === 'terlambat'   ? "bg-[#150C0E] border-rose-500/[0.25]"    :
        task.status === 'in_progress' ? "bg-[#0B0F18] border-blue-500/[0.20]"   :
        "bg-[#0C1319] border-white/[0.07] hover:border-purple-500/20"
      )}>
        {/* Left status stripe (mobile only) */}
        <div className={cn(
          "lg:hidden absolute left-0 top-0 bottom-0 w-[2.5px]",
          task.status === 'selesai'     ? "bg-emerald-500" :
          task.status === 'terlambat'   ? "bg-rose-500"    :
          task.status === 'in_progress' ? "bg-blue-500"    :
          "bg-white/10"
        )} />
        {/* Main body */}
        <div className="p-3 lg:p-5 pl-4 lg:pl-5 flex items-start gap-3 lg:gap-4">
          {/* Task-type icon */}
          <div className={cn(
            "w-9.5 h-9.5 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-lg",
            cfg.bg, cfg.border, cfg.shadow
          )}>
            <cfg.icon className={cn(cfg.color, "w-5 h-5 lg:w-5.5 lg:h-5.5")} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Title + status badge */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={cn(
                "font-bold text-xs lg:text-sm leading-tight line-clamp-2 flex-1 min-w-0",
                isDone ? "text-white/50 line-through" : "text-white group-hover:text-purple-200 transition-colors"
              )}>
                {task.title}
              </h3>
              {(!activeFilter || activeFilter === 'semua' || activeFilter !== task.status) && (
                <div className={cn(
                  "shrink-0 px-2 py-0.5 rounded-lg text-[8px] lg:px-2.5 lg:py-1 lg:rounded-full lg:text-[9px] font-black uppercase border tracking-widest whitespace-nowrap",
                  st.color, st.bg, st.border
                )}>
                  {st.label}
                </div>
              )}
            </div>

            {/* Metadata chips */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 lg:gap-x-3 lg:gap-y-1">
              <div className="flex items-center gap-1">
                <MapPin size={9} className="text-[#64748B]" />
                <span className="text-[9.5px] font-bold text-[#64748B] uppercase tracking-wider">{task.kandang_name || 'Global'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={9} className="text-[#64748B]" />
                <span className="text-[9.5px] font-bold text-[#64748B] uppercase tracking-wider">{displayTime}</span>
              </div>
              {task.status === 'selesai' && (
                <div className="flex items-center gap-1 px-1.5 py-0.25 rounded bg-emerald-500/5 border border-emerald-500/10">
                  <UserCheck size={9} className="text-emerald-400" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                    {getExactName(task, members)}
                  </span>
                </div>
              )}
            </div>

            {/* Urgency badge — visible on all screen sizes */}
            {urgency && !(auditRange === 'day' && urgency.label === 'HARI INI') && (
              <div className={cn(
                "inline-flex items-center gap-1 mt-1.5 lg:mt-2.5 px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-lg lg:rounded-xl text-[8px] lg:text-[9px] font-black border uppercase tracking-[0.12em]",
                urgency.color
              )}>
                <Sparkles size={9} /> {urgency.label}
              </div>
            )}
          </div>
        </div>

        {/* CTA bar — only pending tasks on mobile, gives clear tap affordance */}
        {isPending && (
          <div className="px-3 pb-3 lg:hidden">
            <div className="flex items-center justify-between h-11 px-3.5 rounded-xl bg-[#7C3AED]/[0.08] border border-[#7C3AED]/20 text-[#A78BFA] active:bg-[#7C3AED]/15 transition-all">
              <span className="text-[9.5px] font-black uppercase tracking-widest">Lapor Selesai</span>
              <ChevronRight size={14} className="opacity-60" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const NoBatchWarning = ({ label, animalLabel: _animalLabel }) => (
  <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
    <AlertTriangle className="text-orange-500 shrink-0" size={18} />
    <p className="text-[10px] font-bold text-orange-200/80 uppercase tracking-wider leading-relaxed">Belum ada batch aktif yang terdeteksi untuk lapor data {label?.toLowerCase()}</p>
  </div>
)

export function InteractiveCheckCard({ 
  task, onCheck, isExpanded, onToggle, 
  config, TASK_TYPE_CFG, TASK_REPORT_CONFIG, 
  hooks, updateStatus, linkRecord,
  profile, livestockType: _livestockType,
  renderExtraReportFields, // Function to render livestock specific fields (like FAMACHA)
  members = [],
  activeFilter,
  auditRange
}) {
  const cfg = TASK_TYPE_CFG[task.task_type] || TASK_TYPE_CFG.lainnya
  const isSelesai = task.status === 'selesai'
  const urgency = getUrgencyLabel(task)

  const [reportData, setReportData] = useState({})
  const [weighingData, setWeighingData] = useState({ animal_id: '', weight_kg: '', girth_cm: '', bcs: '', famacha_score: '', notes: '' })
  const [weighingEntries, setWeighingEntries] = useState([])
  const [healthData, setHealthData] = useState({ animal_id: '', medicine_name: '', dosage: '', notes: '' })
  const [healthEntries, setHealthEntries] = useState([])

  const { data: farms = [] } = usePeternakFarms()
  const permissions = usePeternakPermissions()
  const isStaff = permissions.isStaff && !permissions.isOwner && !permissions.isManajer

  const targetFarm = useMemo(() => {
    if (!task || !task.kandang_name) return null
    const kName = task.kandang_name.trim().toLowerCase()
    return farms.find(f => f.farm_name.trim().toLowerCase() === kName)
  }, [farms, task])

  const hasGeofence = useMemo(() => {
    return !!(targetFarm && targetFarm.latitude != null && targetFarm.longitude != null)
  }, [targetFarm])

  const activeFarm = useMemo(() => {
    if (targetFarm && targetFarm.latitude != null && targetFarm.longitude != null) {
      return targetFarm
    }
    // Fallback to first valid farm ONLY for owner/admin
    if (!isStaff) {
      return farms.find(f => f.latitude != null && f.longitude != null)
    }
    return null
  }, [targetFarm, farms, isStaff])

  const verifyGeofence = async () => {
    if (!hasGeofence) return true

    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })

      const { latitude, longitude, accuracy } = position.coords

      if (accuracy > 100 && isStaff) {
        toast.error('Akurasi lokasi rendah, silakan coba lagi di area terbuka.')
        return false
      }

      if (accuracy > 100) {
        toast.warning('Akurasi lokasi rendah, coba pindah ke area terbuka.')
      }

      if (!activeFarm || activeFarm.latitude == null || activeFarm.longitude == null) {
        if (isStaff) {
          toast.error('Lokasi kandang untuk tugas ini belum diatur. Hubungi owner/admin.')
          return false
        } else {
          toast.warning('Lokasi kandang belum cocok/di luar radius. Bypass sebagai owner/manajer.')
          return true
        }
      }

      const dist = calculateDistance(latitude, longitude, activeFarm.latitude, activeFarm.longitude)
      if (dist <= 150) {
        return true
      } else {
        if (isStaff) {
          toast.error(`Di luar area: Anda berada ${Math.round(dist)}m dari kandang. Pekerjaan harus diselesaikan di dekat area kandang.`)
          return false
        } else {
          toast.warning('Lokasi kandang belum cocok/di luar radius. Bypass sebagai owner/manajer.')
          return true
        }
      }
    } catch (err) {
      console.error('Geolocation error:', err)
      if (err.code === 1) {
        toast.error('Akses lokasi ditolak. Mohon izinkan akses GPS pada browser Anda.')
      } else {
        toast.error('Gagal mendeteksi lokasi GPS.')
      }
      return false
    }
  }

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
      } catch (_e) {} // eslint-disable-line no-empty -- intentional: silently ignore malformed notes JSON
    } else {
      setWeighingEntries([])
      setHealthEntries([])
    }
  }, [task.notes]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (e) => {
    e.stopPropagation()
    if (hasForm && !isExpanded) { onToggle(); return }
    if (isSelesai) { if (isExpanded) onToggle(); return }

    // Multi-animal: always just toggle — manual finalization via "Selesaikan Tugas" button
    if (isMultiAnimalTask) {
      onToggle()
      return
    }

    // Geofence check before saving/finalizing
    const isLocValid = await verifyGeofence()
    if (!isLocValid) return

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
    const isLocValid = await verifyGeofence()
    if (!isLocValid) return
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
        bcs: weighingData.bcs ? parseInt(weighingData.bcs) : null,
        famacha_score: weighingData.famacha_score ? parseInt(weighingData.famacha_score) : null,
        weigh_method: 'timbang_langsung',
        notes: weighingData.notes ? `Auto: ${task.title}. ${weighingData.notes}` : `Auto: ${task.title}`,
      })
      const newEntry = {
        animal_id: weighingData.animal_id,
        eartag: selectedAnimal?.name || selectedAnimal?.ear_tag || selectedAnimal?.id?.substring(0, 8),
        weight_kg: parseFloat(weighingData.weight_kg),
        girth_cm: weighingData.girth_cm ? parseFloat(weighingData.girth_cm) : null,
        bcs: weighingData.bcs ? parseInt(weighingData.bcs) : null,
        famacha_score: weighingData.famacha_score ? parseInt(weighingData.famacha_score) : null,
        notes: weighingData.notes || null,
        weighed_at: new Date().toISOString(),
        record_id: record?.id,
      }
      const newEntries = [...weighingEntries, newEntry]
      const newNotes = JSON.stringify({ 
        _version: '2.0', 
        report: {}, 
        weighing_entries: newEntries,
        batch_id: effectiveBatchId
      })
      // Always keep in_progress — user must explicitly finalize via "Selesaikan Tugas"
      await updateStatus.mutateAsync({ id: task.id, status: 'in_progress', notes: newNotes })
      if (record?.id) await linkRecord.mutateAsync({ id: task.id, linked_record_id: record.id, linked_record_table: hooks.weightTable })
      setWeighingEntries(newEntries)
      setWeighingData({ animal_id: '', weight_kg: '', girth_cm: '', bcs: '', famacha_score: '', notes: '' })
      toast.success(`${newEntry.eartag} ditimbang (${newEntries.length}/${animals.length})`)
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
    const isLocValid = await verifyGeofence()
    if (!isLocValid) return
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
      const newNotes = JSON.stringify({
        _version: '2.0',
        report: {},
        weighing_entries: weighingEntries,
        health_entries: newEntries,
        batch_id: effectiveBatchId
      })
      // Always keep in_progress — user must explicitly finalize via "Selesaikan Tugas"
      await updateStatus.mutateAsync({ id: task.id, status: 'in_progress', notes: newNotes })
      setHealthEntries(newEntries)
      setHealthData(h => ({ ...h, animal_id: '' }))
      toast.success(`${newEntry.eartag} tercatat (${newEntries.length}/${animals.length})`)
    } catch (err) { console.error(err); toast.error('Gagal menyimpan record kesehatan') }
  }

  const handleUnlock = async (e) => {
    e.stopPropagation()
    try {
      await updateStatus.mutateAsync({ id: task.id, status: 'pending' })
      toast.success('Gembok dibuka! Silakan edit data.')
    } catch (_err) { toast.error('Gagal membuka gembok') }
  }

  return (
    <motion.div
      layout
      style={{ position: 'relative', zIndex: isExpanded ? 20 : 1 }}
      className={cn(
        "group flex flex-col rounded-xl lg:rounded-2xl border transition-all duration-200 overflow-hidden",
        isSelesai
          ? "bg-[#06090F] border-emerald-500/20"
          : isExpanded ? "bg-[#0C1319] border-[#7C3AED]/40 ring-1 ring-[#7C3AED]/20 shadow-xl" : "bg-[#0C1319] border-white/5 hover:border-purple-500/30 hover:bg-[#06090F]"
      )}
    >
      <div className="flex items-stretch min-h-[58px] lg:min-h-[80px]">
        <button 
          onClick={isSelesai ? handleUnlock : handleAction}
          disabled={(!isSelesai && (updateStatus.isPending || addWeight.isPending || addHealth.isPending))}
          className={cn(
            "w-11 lg:w-16 shrink-0 flex flex-col items-center justify-center transition-all relative z-10",
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
             <div className="flex flex-col items-center gap-0.5 group-hover:scale-110 transition-transform">
                <Lock size={15} className="text-emerald-500/50" />
                <span className="text-[6.5px] font-bold uppercase text-emerald-500/40">Locked</span>
             </div>
          ) : (
            <div className={cn(
              "w-7 h-7 lg:w-8 lg:h-8 rounded-lg border-2 flex items-center justify-center transition-all",
              (hasForm && isExpanded) || (isMultiAnimalTask && entriesCount > 0)
                ? "border-purple-500 bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                : "border-current bg-transparent"
            )}>
              {isMultiAnimalTask && (entriesCount > 0 || isExpanded) && animals.length > 0
                ? <span className="text-[10px] font-black leading-none">{entriesCount}<span className="text-[7.5px] font-bold opacity-60">/{animals.length}</span></span>
                : (hasForm && isExpanded) ? <Save size={15} strokeWidth={3} /> : <CheckCircle2 size={16} strokeWidth={3} />}
            </div>
          )}
        </button>

        <div onClick={handleAction} className="flex-1 p-2.5 lg:p-4 flex items-center justify-between transition-colors cursor-pointer">
          <div className="flex-1 min-w-0 pr-1.5 lg:pr-4">
            <div className="flex items-center gap-1.5 mb-1">
               <span className={cn("text-[8.5px] font-black uppercase py-0.25 px-1 rounded bg-white/5", cfg.color)}>{cfg.label}</span>
               {isCarryover && (!activeFilter || activeFilter === 'semua' || activeFilter !== 'terlambat') && (
                 <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 animate-pulse">Terlewat</span>
               )}
               {isSelesai && (!activeFilter || activeFilter === 'semua' || activeFilter !== 'selesai') && (
                 <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Selesai</span>
               )}
            </div>
            <h4 className={cn("text-xs lg:text-sm font-bold line-clamp-2 transition-colors", isSelesai ? "text-slate-500 line-through" : "text-white group-hover:text-purple-300")}>{task.title}</h4>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 opacity-60">
               <div className="flex items-center gap-1"><MapPin size={9} /><span className="text-[9.5px] font-bold uppercase tracking-wider">{task.kandang_name || 'Global'}</span></div>
               <div className="flex items-center gap-1">
                 <Clock size={9} />
                 <span className="text-[9.5px] font-bold uppercase tracking-wider">
                   {isSelesai && task.completed_at
                     ? `${format(new Date(task.completed_at), 'HH:mm')} WIB`
                     : task.due_time ? `${task.due_time.substring(0, 5)} WIB` : '--:--'}
                 </span>
               </div>
               {isSelesai && (
                 <div className="flex items-center gap-1 text-emerald-400/80">
                   <User size={9} />
                    <span className="text-[9.5px] font-bold uppercase tracking-wider">
                      {getExactName(task, members)}
                    </span>
                 </div>
               )}
            </div>
          </div>
          {urgency && !isSelesai && !(auditRange === 'day' && urgency.label === 'HARI INI') && (
             <div className={cn("flex px-2 py-0.5 lg:px-3 lg:py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shrink-0", urgency.color)}>{urgency.label}</div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 lg:p-6 bg-black/20 border-t border-white/5 space-y-6">
           {isMultiAnimalTask && (
              <div className="space-y-6 text-left">
                 {animals.length === 0 && <NoBatchWarning label={cfg.label} animalLabel={config.animalLabel} />}
                 {animals.length > 0 && (
                    <div className="space-y-6">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Pilih {config.animalLabel} *</label>
                          <Select 
                            value={task.task_type === 'timbang' ? weighingData.animal_id : healthData.animal_id} 
                            onValueChange={v => task.task_type === 'timbang' ? setWeighingData(w => ({...w, animal_id: v, weight_kg: '', girth_cm: '', bcs: '', famacha_score: '', notes: ''})) : setHealthData(h => ({...h, animal_id: v}))}
                          >
                             <SelectTrigger className="h-12 rounded-xl bg-black/40 border border-white/5 px-4 text-white focus:ring-0">
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
                          <>
                             {weighingData.animal_id ? (() => {
                                const selectedAnimal = animals.find(a => a.id === weighingData.animal_id)
                                const weightRecords = selectedAnimal?.weight_records ?? []
                                const records = [...weightRecords]
                                  .sort((a, b) => new Date(b.weigh_date) - new Date(a.weigh_date))
                                  .slice(0, 4)
                                const latestW = selectedAnimal ? (selectedAnimal.latest_weight_kg ?? selectedAnimal.entry_weight_kg) : 0
                                return (
                                   <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                      {selectedAnimal && (
                                         <div className="flex justify-between items-center bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-2xl">
                                            <div>
                                               <h4 className="font-['Sora'] font-extrabold text-base text-white">{selectedAnimal.name || selectedAnimal.ear_tag}</h4>
                                               <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-wider mt-0.5">{selectedAnimal.breed || '—'} · {selectedAnimal.sex === 'betina' ? 'Betina' : 'Jantan'}</p>
                                            </div>
                                            <div className="text-right">
                                               <p className="text-[10px] text-[#4B6478] font-bold">Berat Terakhir</p>
                                               <p className="font-['Sora'] font-black text-base text-white">{latestW} <span className="text-xs text-[#4B6478]">kg</span></p>
                                            </div>
                                         </div>
                                      )}

                                      {records.length > 0 && selectedAnimal && (
                                         <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] mb-2">Riwayat Timbang</p>
                                            <div className="space-y-1.5">
                                               {records.map((r, i) => {
                                                  const diff = i < records.length - 1
                                                    ? (r.weight_kg - records[i + 1].weight_kg).toFixed(1)
                                                    : (r.weight_kg - selectedAnimal.entry_weight_kg).toFixed(1)
                                                  const methodCfg = WEIGH_METHOD_LABEL[r.weigh_method]
                                                  return (
                                                     <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-white/[0.03] rounded-xl text-xs">
                                                        <div className="flex items-center gap-2">
                                                           <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-green-400' : 'bg-white/20'}`} />
                                                           <span className="text-[11px] text-[#4B6478] font-bold">
                                                              {new Date(r.weigh_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                           </span>
                                                           {methodCfg && <span className={`text-[9px] font-black uppercase ${methodCfg.color}`}>{methodCfg.label}</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                           <span className={`text-[10px] font-bold ${parseFloat(diff) > 0 ? 'text-green-400' : parseFloat(diff) < 0 ? 'text-rose-400' : 'text-[#4B6478]'}`}>
                                                              {parseFloat(diff) > 0 ? `+${diff}` : diff} kg
                                                           </span>
                                                           <span className="font-['Sora'] font-black text-white">{r.weight_kg} kg</span>
                                                        </div>
                                                     </div>
                                                  )
                                               })}
                                               <div className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-xl border border-white/[0.04] text-xs">
                                                  <div className="flex items-center gap-2">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                                     <span className="text-[11px] text-[#4B6478] font-bold">
                                                        {new Date(selectedAnimal.entry_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                     </span>
                                                     <span className="text-[9px] font-black uppercase text-[#4B6478]/60">Masuk</span>
                                                  </div>
                                                  <span className="font-['Sora'] font-black text-[#4B6478]">{selectedAnimal.entry_weight_kg} kg</span>
                                               </div>
                                            </div>
                                         </div>
                                      )}

                                      <div className="grid grid-cols-2 gap-4">
                                         <div className="space-y-2 col-span-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] block">Berat Sekarang (kg) *</label>
                                            <div className="relative">
                                               <InputNumber
                                                 value={weighingData.weight_kg}
                                                 onChange={v => setWeighingData(w => ({ ...w, weight_kg: v }))}
                                                 placeholder={`Terakhir: ${latestW} kg`}
                                                 className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-white font-['Sora'] font-black text-lg focus:outline-none"
                                               />
                                               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B6478] font-bold text-sm">kg</span>
                                            </div>
                                         </div>
                                         <div className="space-y-2 col-span-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] block">Lkr Dada (CM) (opsional)</label>
                                            <InputNumber
                                              value={weighingData.girth_cm}
                                              onChange={v => setWeighingData(w => ({ ...w, girth_cm: v }))}
                                              placeholder="Contoh: 65"
                                              className="h-12 bg-black/40 border-white/5 rounded-xl"
                                            />
                                         </div>

                                         <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] block">BCS <span className="text-[#4B6478]/50">(opsional)</span></label>
                                            <div className="flex gap-2">
                                               {BCS_OPTIONS.map(n => (
                                                  <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => setWeighingData(w => ({ ...w, bcs: w.bcs === String(n) ? '' : String(n) }))}
                                                    className={cn(
                                                      'flex-1 h-11 rounded-xl text-sm font-black border transition-all',
                                                      weighingData.bcs === String(n)
                                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                        : 'bg-white/[0.03] border-white/[0.06] text-[#4B6478]'
                                                    )}
                                                  >
                                                    {n}
                                                  </button>
                                               ))}
                                            </div>
                                            {weighingData.bcs && (
                                               <p className="text-[10px] text-[#4B6478] mt-1 ml-1">{BCS_LABEL[parseInt(weighingData.bcs)]}</p>
                                            )}
                                         </div>

                                         <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] block">Famacha <span className="text-[#4B6478]/50">(opsional)</span></label>
                                            <div className="mb-2 rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
                                               <img src="/famacha_guide_v2.png" alt="Famacha guide" className="w-full object-cover" />
                                            </div>
                                            <div className="flex gap-2">
                                               {FAMACHA_OPTIONS.map(n => (
                                                  <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => setWeighingData(w => ({ ...w, famacha_score: w.famacha_score === String(n) ? '' : String(n) }))}
                                                    className={cn(
                                                      'flex-1 h-11 rounded-xl text-sm font-black border transition-all',
                                                      weighingData.famacha_score === String(n)
                                                        ? `bg-white/10 border-white/20 ${FAMACHA_COLOR[n]}`
                                                        : 'bg-white/[0.03] border-white/[0.06] text-[#4B6478]'
                                                    )}
                                                  >
                                                    {n}
                                                  </button>
                                               ))}
                                            </div>
                                            {weighingData.famacha_score && (
                                               <p className={cn('text-[10px] mt-1 ml-1 font-bold', FAMACHA_COLOR[parseInt(weighingData.famacha_score)])}>
                                                  Skor {weighingData.famacha_score} — {parseInt(weighingData.famacha_score) <= 2 ? 'Normal' : parseInt(weighingData.famacha_score) === 3 ? 'Perhatian' : 'Perlu Tindakan'}
                                               </p>
                                            )}
                                         </div>

                                         <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] block">Catatan</label>
                                            <textarea
                                              value={weighingData.notes || ''}
                                              onChange={e => setWeighingData(w => ({ ...w, notes: e.target.value }))}
                                              rows={2}
                                              placeholder="Kondisi ternak, observasi, dll..."
                                              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#4B6478]/50 focus:outline-none focus:border-green-500/50 resize-none transition-all"
                                            />
                                         </div>

                                         <Button onClick={handleAddWeighing} disabled={addWeight.isPending} className="col-span-2 h-12 rounded-xl bg-purple-500 text-white font-black uppercase tracking-widest shadow-xl shadow-purple-900/40">
                                            {addWeight.isPending ? <LoadingSpinner /> : 'Simpan Timbangan'}
                                         </Button>
                                      </div>
                                   </div>
                                )
                             })() : (
                                <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                   <p className="text-[11px] font-bold text-slate-400">Silakan pilih {config.animalLabel} terlebih dahulu untuk memasukkan data timbangan.</p>
                                </div>
                             )}
                          </>
                       )}

                       {isHealthTask && (
                          <>
                             {healthData.animal_id ? (
                                <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                   <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2 col-span-1">
                                         <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] block">Nama {task.task_type === 'vaksinasi' ? 'Vaksin' : 'Obat'} *</label>
                                         <input className="w-full h-12 bg-[#0D141B] border border-white/[0.08] rounded-xl px-4 text-sm text-white focus:outline-none focus:border-purple-500/50" value={healthData.medicine_name || ''} onChange={e => setHealthData(h => ({...h, medicine_name: e.target.value}))} placeholder="Contoh: Anthrax B-12" />
                                      </div>
                                      <div className="space-y-2 col-span-1">
                                         <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] block">Dosis (ML/Gram) (opsional)</label>
                                         <input className="w-full h-12 bg-[#0D141B] border border-white/[0.08] rounded-xl px-4 text-sm text-white focus:outline-none focus:border-purple-500/50" value={healthData.dosage || ''} onChange={e => setHealthData(h => ({...h, dosage: e.target.value}))} placeholder="Contoh: 2ml" />
                                      </div>
                                      <Button onClick={handleAddHealth} disabled={addHealth.isPending} className="col-span-2 h-12 rounded-xl bg-purple-500 text-white font-black uppercase tracking-widest shadow-xl shadow-purple-900/40">
                                         {addHealth.isPending ? <LoadingSpinner /> : 'Catat Kesehatan'}
                                      </Button>
                                   </div>
                                </div>
                             ) : (
                                <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                   <p className="text-[11px] font-bold text-slate-400">Silakan pilih {config.animalLabel} terlebih dahulu untuk mencatat data kesehatan.</p>
                                </div>
                             )}
                          </>
                       )}

                       {/* List of completed weight entries in this task session */}
                       {weighingEntries.length > 0 && task.task_type === 'timbang' && (
                          <div className="border-t border-white/5 pt-4 space-y-2">
                             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sudah Ditimbang ({weighingEntries.length})</p>
                             <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                {weighingEntries.map((entry) => (
                                   <div key={entry.animal_id} className="flex items-center justify-between py-2 px-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs">
                                      <div className="flex items-center gap-2">
                                         <span className="font-bold text-white">{entry.eartag}</span>
                                         {entry.bcs && <span className="text-[9px] font-bold bg-white/5 border border-white/10 px-1.5 py-0.25 rounded text-emerald-400">BCS {entry.bcs}</span>}
                                         {entry.famacha_score && <span className={cn("text-[9px] font-bold bg-white/5 border border-white/10 px-1.5 py-0.25 rounded", FAMACHA_COLOR[entry.famacha_score])}>FAMACHA {entry.famacha_score}</span>}
                                      </div>
                                      <div className="flex items-center gap-3">
                                         <span className="font-['Sora'] font-black text-white">{entry.weight_kg} kg</span>
                                         {!isSelesai && (
                                            <button
                                               onClick={async (ev) => {
                                                  ev.stopPropagation()
                                                  try {
                                                     if (entry.record_id) {
                                                        await supabase.from(hooks.weightTable).update({ is_deleted: true }).eq('id', entry.record_id)
                                                     }
                                                     const updatedEntries = weighingEntries.filter(e => e.animal_id !== entry.animal_id)
                                                     const newNotes = JSON.stringify({ 
                                                        _version: '2.0', 
                                                        report: {}, 
                                                        weighing_entries: updatedEntries,
                                                        batch_id: effectiveBatchId
                                                     })
                                                     await updateStatus.mutateAsync({ id: task.id, status: 'in_progress', notes: newNotes })
                                                     setWeighingEntries(updatedEntries)
                                                     toast.success('Timbangan dihapus')
                                                  } catch (_err) {
                                                     toast.error('Gagal menghapus data')
                                                  }
                                               }}
                                               className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                                            >
                                               <Trash2 size={12} />
                                            </button>
                                         )}
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>
                       )}

                       {/* List of completed health entries in this task session */}
                       {healthEntries.length > 0 && isHealthTask && (
                          <div className="border-t border-white/5 pt-4 space-y-2">
                             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Sudah Dicatat ({healthEntries.length})</p>
                             <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                {healthEntries.map((entry) => (
                                   <div key={entry.animal_id} className="flex items-center justify-between py-2 px-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs">
                                      <div className="flex items-center gap-2">
                                         <span className="font-bold text-white">{entry.eartag}</span>
                                         <span className="text-[10px] text-slate-400">{entry.medicine_name} {entry.dosage && `(${entry.dosage})`}</span>
                                      </div>
                                      {!isSelesai && (
                                         <button
                                            onClick={async (ev) => {
                                               ev.stopPropagation()
                                               try {
                                                  if (entry.record_id) {
                                                     const healthTable = hooks.healthTable || hooks.weightTable.replace('_weight_records', '_health_logs')
                                                     await supabase.from(healthTable).update({ is_deleted: true }).eq('id', entry.record_id)
                                                  }
                                                  const updatedEntries = healthEntries.filter(e => e.animal_id !== entry.animal_id)
                                                  const newNotes = JSON.stringify({ 
                                                     _version: '2.0', 
                                                     report: {}, 
                                                     weighing_entries: weighingEntries,
                                                     health_entries: updatedEntries,
                                                     batch_id: effectiveBatchId
                                                  })
                                                  await updateStatus.mutateAsync({ id: task.id, status: 'in_progress', notes: newNotes })
                                                  setHealthEntries(updatedEntries)
                                                  toast.success('Log kesehatan dihapus')
                                               } catch (_err) {
                                                  toast.error('Gagal menghapus data')
                                               }
                                            }}
                                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                                         >
                                            <Trash2 size={12} />
                                         </button>
                                      )}
                                   </div>
                                ))}
                             </div>
                          </div>
                       )}
                    </div>
                  )}

                  {/* Explicit finalize button — appears only when all animals recorded */}
                  {animalsDone && !isSelesai && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[9px] font-black text-emerald-400/70 uppercase tracking-widest text-center">
                        Semua {config.animalLabelPlural} tercatat — siap diselesaikan
                      </p>
                      <Button
                        onClick={async (ev) => {
                          ev.stopPropagation()
                          const isLocValid = await verifyGeofence()
                          if (!isLocValid) return
                          try {
                            const finalNotes = JSON.stringify({ _version: '2.0', report: {}, weighing_entries: weighingEntries, health_entries: healthEntries, batch_id: effectiveBatchId })
                            await updateStatus.mutateAsync({ id: task.id, status: 'selesai', notes: finalNotes })
                            toast.success(`Tugas selesai! 🎉`)
                          } catch (_err) { toast.error('Gagal menyelesaikan tugas') }
                        }}
                        disabled={updateStatus.isPending}
                        className="w-full h-12 lg:h-14 rounded-xl lg:rounded-[28px] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-900/40 transition-all"
                      >
                        {updateStatus.isPending ? <LoadingSpinner /> : '✓ Selesaikan Tugas'}
                      </Button>
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
                    {field.type === 'container_calc' && (
                      <ContainerCalcField field={field} reportData={reportData} setReportData={setReportData} />
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
