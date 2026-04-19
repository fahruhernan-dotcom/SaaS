import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  Users2, Wand2, GripVertical, Clock, AlertCircle, CheckCircle2,
  User as UserIcon, Calendar, ClipboardList, Utensils, Scale,
  Syringe, Trash2, Activity, Heart, RefreshCw, Lock
} from 'lucide-react'
import { createTimeline, stagger } from 'animejs'
import {
  usePeternakTaskInstances,
  useAssignableMembers,
  useUpdateTaskAssignment,
  useAutoAssignBatch,
} from '@/lib/hooks/usePeternakTaskData'
import { BrokerPageHeader } from '../../_shared/components/transactions/BrokerPageHeader'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { cn } from '@/lib/utils'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// â”€â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TASK_TYPE_CFG = {
  pakan:             { label: 'Pakan',      icon: Utensils,     color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  pemberian_pakan:   { label: 'Pakan',      icon: Utensils,     color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  timbang:           { label: 'Timbang',    icon: Scale,        color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  vaksinasi:         { label: 'Vaksin',     icon: Syringe,      color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  kebersihan_kandang:{ label: 'Kebersihan', icon: Trash2,       color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/30' },
  kesehatan:         { label: 'Kesehatan',  icon: Activity,     color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/30' },
  reproduksi:        { label: 'Reproduksi', icon: Heart,        color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/30' },
  lainnya:           { label: 'Lainnya',    icon: ClipboardList,color: 'text-slate-400',  bg: 'bg-white/5',       border: 'border-white/10' },
}

const STATUS_CFG = {
  pending:     { label: 'Pending',   color: 'text-slate-400',  bg: 'bg-white/5',        border: 'border-white/10' },
  in_progress: { label: 'Progress',  color: 'text-blue-400',   bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
  selesai:     { label: 'Selesai',   color: 'text-emerald-400',bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  terlambat:   { label: 'Terlambat', color: 'text-red-400',    bg: 'bg-red-500/10',     border: 'border-red-500/30' },
}

// â”€â”€â”€ DraggableTaskCard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DraggableTaskCard({ task, assignmentOverride, isDragOverlay = false }) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const isComplete = task.status === 'selesai'
  const isEffectivelyLocked = isComplete && !isUnlocked

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: task.id, 
    disabled: isEffectivelyLocked 
  })
  
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const typeCfg = TASK_TYPE_CFG[task.template?.task_type] ?? TASK_TYPE_CFG.lainnya
  const TypeIcon = typeCfg.icon
  const statusCfg = STATUS_CFG[task.status] ?? STATUS_CFG.pending
  const assignedName = assignmentOverride?.workerName
    ?? task.worker?.full_name

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isEffectivelyLocked ? listeners : {})}
      {...(!isEffectivelyLocked ? attributes : {})}
      className={cn(
        'flex items-center gap-2.5 rounded-xl border p-2.5 transition-all select-none',
        isComplete ? 'bg-[#0A1118]/70 border-white/5 opacity-80' : 'bg-[#0F1A23]',
        !isDragOverlay && 'anime-task-card',
        isDragOverlay
          ? 'shadow-2xl shadow-black/60 rotate-1 scale-105 border-[#7C3AED]/40 bg-[#12202E]'
          : isDragging
            ? 'opacity-30'
            : !isEffectivelyLocked && 'border-white/5 hover:border-white/10 cursor-grab active:cursor-grabbing',
        isUnlocked && 'ring-1 ring-amber-500/30'
      )}
    >
      {/* Drag handle / Lock button */}
      <div 
        className={cn(
          "shrink-0 transition-colors flex items-center justify-center w-5 h-5 -ml-1", 
          isEffectivelyLocked ? "text-white/20 hover:text-white/60 cursor-pointer pointer-events-auto" : "text-white/20 group-hover:text-white/40 pointer-events-none"
        )}
        onClick={isEffectivelyLocked ? (e) => { e.stopPropagation(); setIsUnlocked(true); } : undefined}
        title={isEffectivelyLocked ? "Klik untuk membuka gembok" : undefined}
      >
        {isEffectivelyLocked ? <Lock size={12} /> : <GripVertical size={14} className={isUnlocked ? "text-amber-500/50" : ""} />}
      </div>

      {/* Type icon */}
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', typeCfg.bg, typeCfg.border, 'border')}>
        <TypeIcon size={13} className={typeCfg.color} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate leading-tight">{task.template?.title ?? task.title ?? '—'}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.kandang_name && (
            <span className="text-[10px] text-[#4B6478] font-medium truncate">{task.kandang_name}</span>
          )}
          {task.due_time && (
            <span className="flex items-center gap-0.5 text-[10px] text-[#4B6478]">
              <Clock size={9} />
              {task.due_time.slice(0, 5)}
            </span>
          )}
        </div>
      </div>

      {/* Assigned badge */}
      {assignedName ? (
        <span className="text-[9px] font-bold bg-[#7C3AED]/15 text-[#A78BFA] border border-[#7C3AED]/25 rounded-full px-2 py-0.5 shrink-0 truncate max-w-[72px]">
          {assignedName.split(' ')[0]}
        </span>
      ) : (
        <span className={cn('text-[9px] font-bold rounded-full px-2 py-0.5 shrink-0 border', statusCfg.bg, statusCfg.color, statusCfg.border)}>
          {statusCfg.label}
        </span>
      )}
    </div>
  )
}

// â”€â”€â”€ WorkerColumn â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function WorkerColumn({ worker, tasks, assignmentOverrides }) {
  const { setNodeRef, isOver } = useDroppable({ id: `worker-${worker.id}` })

  const groupedTasks = useMemo(() => {
    const groups = {}
    tasks.forEach(t => {
      const dateKey = t.due_date || 'Unknown'
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(t)
    })
    return Object.keys(groups).sort().map(k => ({ dateString: k, tasks: groups[k] }))
  }, [tasks])

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'anime-worker-column flex flex-col min-w-0 rounded-xl border-2 border-dashed p-2 transition-all min-h-[200px]',
        isOver ? 'border-[#7C3AED]/50 bg-[#7C3AED]/5' : 'border-white/5 bg-transparent'
      )}
    >
      {/* Worker header */}
      <div className={cn(
        'flex items-center gap-2.5 rounded-lg border p-3 mb-2 transition-all',
        isOver ? 'border-[#7C3AED]/40 bg-[#7C3AED]/10' : 'border-white/8 bg-[#0C1521]'
      )}>
        <div className="w-8 h-8 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center font-bold text-[11px] text-[#A78BFA] shrink-0 uppercase">
          {worker.full_name?.slice(0, 2) ?? 'XX'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate leading-tight">{worker.full_name}</p>
          <p className="text-[10px] text-[#4B6478] font-medium">{tasks.length} tugas</p>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {tasks.length === 0 && (
          <div className="h-16 flex items-center justify-center">
            <p className="text-[10px] text-[#4B6478] text-center">Seret tugas ke sini</p>
          </div>
        )}
        {groupedTasks.map(group => (
          <div key={group.dateString} className="contents">
            <div className="py-1 flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#4B6478]">
                {group.dateString === 'Unknown' ? 'Tanpa Tanggal' : format(parseISO(group.dateString), 'EEEE, d MMM', { locale: idLocale })}
              </span>
              <div className="h-px bg-white/5 flex-1" />
            </div>
            {group.tasks.map(task => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                assignmentOverride={assignmentOverrides.get(task.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// â”€â”€â”€ UnassignedDropZone â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function UnassignedDropZone({ tasks, assignmentOverrides }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unassigned' })

  const groupedTasks = useMemo(() => {
    const groups = {}
    tasks.forEach(t => {
      const dateKey = t.due_date || 'Unknown'
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(t)
    })
    return Object.keys(groups).sort().map(k => ({ dateString: k, tasks: groups[k] }))
  }, [tasks])

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border-2 border-dashed p-2 space-y-1.5 min-h-[80px] transition-all',
        isOver
          ? 'border-slate-500/50 bg-slate-500/5'
          : 'border-white/5'
      )}
    >
      {tasks.length === 0 ? (
        <div className="h-16 flex items-center justify-center">
          <p className="text-[10px] text-[#4B6478]">Semua tugas sudah di-assign</p>
        </div>
      ) : (
        groupedTasks.map(group => (
          <div key={group.dateString} className="contents">
            <div className="py-1 flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#4B6478]">
                {group.dateString === 'Unknown' ? 'Tanpa Tanggal' : format(parseISO(group.dateString), 'EEEE, d MMM', { locale: idLocale })}
              </span>
              <div className="h-px bg-white/5 flex-1" />
            </div>
            {group.tasks.map(task => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                assignmentOverride={assignmentOverrides.get(task.id)}
              />
            ))}
          </div>
        ))
      )}
    </div>
  )
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function TaskAssign() {
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [viewRange, setViewRange] = useState('hari_ini')
  const [activeId, setActiveId] = useState(null)
  
  const { dateFrom, dateTo } = useMemo(() => {
    let d = new Date(selectedDate)
    if (viewRange === 'minggu_ini') {
      return { 
        dateFrom: format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        dateTo: format(endOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      }
    }
    if (viewRange === 'bulan_ini') {
      return {
        dateFrom: format(startOfMonth(d), 'yyyy-MM-dd'),
        dateTo: format(endOfMonth(d), 'yyyy-MM-dd')
      }
    }
    const str = format(d, 'yyyy-MM-dd')
    return { dateFrom: str, dateTo: str }
  }, [selectedDate, viewRange])

  // Map<taskId, { workerId, workerProfileId, workerName }>
  const [assignmentOverrides, setAssignmentOverrides] = useState(new Map())

  const { data: tasks = [], isLoading: tasksLoading } = usePeternakTaskInstances({
    due_date_from: dateFrom,
    due_date_to: dateTo,
  })
  const { data: workers = [], isLoading: workersLoading } = useAssignableMembers()
  const updateAssignment = useUpdateTaskAssignment()
  const autoAssignBatch = useAutoAssignBatch()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  // Effective assignment: override takes precedence over DB value
  // Uses profile_id as the canonical worker key (profiles are the source of truth)
  const effectiveProfileId = useCallback((task) => {
    const override = assignmentOverrides.get(task.id)
    if (override) return override.workerProfileId ?? null
    return task.assigned_profile_id ?? null
  }, [assignmentOverrides])

  // Group tasks by profile_id
  const { workerTaskMap, unassignedTasks } = useMemo(() => {
    const map = new Map(workers.map(w => [w.profile_id ?? w.id, []]))
    const unassigned = []
    for (const task of tasks) {
      const pId = effectiveProfileId(task)
      if (pId && map.has(pId)) {
        map.get(pId).push(task)
      } else {
        unassigned.push(task)
      }
    }
    return { workerTaskMap: map, unassignedTasks: unassigned }
  }, [tasks, workers, effectiveProfileId])

  const activeTask = useMemo(() => tasks.find(t => t.id === activeId), [tasks, activeId])

  // â”€â”€ Drag handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function handleDragStart({ active }) {
    setActiveId(active.id)
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over) return

    const taskId = active.id
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    let newWorkerId = null
    let newWorkerProfileId = null
    let newWorkerName = null

    if (over.id === 'unassigned') {
      // Unassign
      newWorkerId = null
      newWorkerProfileId = null
      newWorkerName = null
    } else if (String(over.id).startsWith('worker-')) {
      const wId = over.id.replace('worker-', '')
      const worker = workers.find(w => String(w.id) === String(wId))
      if (!worker) return
      newWorkerId = null                    // profiles don't have kandang_workers row
      newWorkerProfileId = worker.profile_id ?? worker.id
      newWorkerName = worker.full_name
    } else {
      return
    }

    // Skip no-op (compare by profile_id)
    const current = assignmentOverrides.get(taskId)
    const currentPId = current?.workerProfileId ?? task.assigned_profile_id ?? null
    if (String(currentPId) === String(newWorkerProfileId)) return

    // Optimistic update
    setAssignmentOverrides(prev => {
      const next = new Map(prev)
      if (over.id === 'unassigned') {
        next.set(taskId, { workerId: null, workerProfileId: null, workerName: null })
      } else {
        next.set(taskId, { workerId: newWorkerId, workerProfileId: newWorkerProfileId, workerName: newWorkerName })
      }
      return next
    })

    // Persist
    try {
      await updateAssignment.mutateAsync({ id: taskId, assigned_worker_id: newWorkerId, assigned_profile_id: newWorkerProfileId })
    } catch {
      // Revert on failure
      setAssignmentOverrides(prev => {
        const next = new Map(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  // â”€â”€ Auto-assign â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function handleAutoAssign() {
    if (!workers.length) return

    // Count current load per worker (from DB + existing overrides)
    const loadMap = new Map(workers.map(w => [w.profile_id ?? w.id, 0]))
    for (const task of tasks) {
      const pId = effectiveProfileId(task)
      if (pId && loadMap.has(pId)) {
        loadMap.set(pId, loadMap.get(pId) + 1)
      }
    }

    // Sort workers alphabetically as tiebreak
    const sortedWorkers = [...workers].sort((a, b) => a.full_name.localeCompare(b.full_name))

    // Sort unassigned tasks by due_time
    const toAssign = [...unassignedTasks].sort((a, b) =>
      (a.due_time ?? '99:99').localeCompare(b.due_time ?? '99:99')
    )

    const newOverrides = new Map(assignmentOverrides)
    const mutations = []

    for (const task of toAssign) {
      // Pick worker with least load (tiebreak: alphabetical)
      const worker = sortedWorkers.reduce((best, w) => {
        const wLoad = loadMap.get(w.profile_id ?? w.id) ?? 0
        const bestLoad = loadMap.get(best.profile_id ?? best.id) ?? 0
        return wLoad < bestLoad ? w : best
      })

      const profileId = worker.profile_id ?? worker.id
      newOverrides.set(task.id, {
        workerId: null,
        workerProfileId: profileId,
        workerName: worker.full_name,
      })
      loadMap.set(profileId, (loadMap.get(profileId) ?? 0) + 1)
      mutations.push({ id: task.id, assigned_worker_id: null, assigned_profile_id: profileId })
    }

    setAssignmentOverrides(newOverrides)

    // Fire-and-forget all mutations
    Promise.all(mutations.map(m => updateAssignment.mutateAsync(m))).catch(() => {
      // On any failure, clear overrides so DB state is shown
      setAssignmentOverrides(new Map())
    })
  }

  const isLoading = tasksLoading || workersLoading

  // â”€â”€ Entrance Animation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    if (!isLoading) {
      const tl = createTimeline({
        defaults: {
          easing: 'spring(1, 80, 10, 0)',
          duration: 800
        }
      })

      tl.add('.anime-worker-column', {
        translateY: [40, 0],
        opacity: [0, 1],
        delay: stagger(100)
      })
      .add('.anime-unassigned-pool', {
        translateX: [40, 0],
        opacity: [0, 1]
      }, '-=600')
      .add('.anime-task-card', {
        scale: [0.9, 1],
        opacity: [0, 1],
        delay: stagger(40)
      }, '-=500')
    }
  }, [isLoading])

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="flex flex-col h-full">
      <BrokerPageHeader
        title="Penugasan"
        subtitle={format(new Date(selectedDate), 'd MMMM yyyy', { locale: idLocale })}
        icon={<Users2 size={20} className="text-[#A78BFA]" />}
        actionButton={
          <div className="flex items-center gap-2">
            {/* Date navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const d = new Date(selectedDate)
                  d.setDate(d.getDate() - 1)
                  setSelectedDate(d.toISOString().split('T')[0])
                }}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                ‹
              </button>
              <button
                onClick={() => setSelectedDate(today)}
                className={cn(
                  'px-3 h-8 rounded-lg text-[11px] font-bold border transition-all',
                  selectedDate === today
                    ? 'bg-[#7C3AED]/20 border-[#7C3AED]/40 text-[#A78BFA]'
                    : 'bg-white/5 border-white/8 text-slate-400 hover:text-white'
                )}
              >
                Hari Ini
              </button>
              <button
                onClick={() => {
                  const d = new Date(selectedDate)
                  d.setDate(d.getDate() + 1)
                  setSelectedDate(d.toISOString().split('T')[0])
                }}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                ›
              </button>
            </div>

            {/* View Range Toggle */}
            <Select value={viewRange} onValueChange={setViewRange}>
              <SelectTrigger className="h-8 w-[130px] rounded-lg bg-white/5 border-white/8 px-3 text-[11px] font-bold text-slate-300 focus:ring-0">
                <SelectValue placeholder="Tampilan" />
              </SelectTrigger>
              <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl">
                <SelectItem value="hari_ini" className="text-xs font-bold rounded-lg cursor-pointer">Hari Ini Saja</SelectItem>
                <SelectItem value="minggu_ini" className="text-xs font-bold rounded-lg cursor-pointer">Minggu Ini</SelectItem>
                <SelectItem value="bulan_ini" className="text-xs font-bold rounded-lg cursor-pointer">Bulan Ini</SelectItem>
              </SelectContent>
            </Select>

            {/* Auto-assign */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={autoAssignBatch.isPending || (unassignedTasks.length === 0 && workers.length === 0)}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#A78BFA] text-[11px] font-bold hover:bg-[#7C3AED]/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  <Wand2 size={13} className={cn(autoAssignBatch.isPending && "animate-spin")} />
                  {autoAssignBatch.isPending ? 'Memproses...' : 'Auto-Assign'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-2xl p-2 z-[9999]">
                <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
                  Isi Yang Kosong Saja
                </div>
                <DropdownMenuItem 
                  onClick={() => autoAssignBatch.mutate({ startDate: dateFrom, endDate: dateTo, workers, action: 'auto' })}
                  className="text-xs font-bold text-white hover:bg-white/10 focus:bg-white/10 rounded-xl cursor-pointer"
                >
                  Sesuai Tampilan {viewRange === 'hari_ini' ? '(Hari Ini)' : viewRange === 'minggu_ini' ? '(Minggu Ini)' : '(Bulan Ini)'}
                </DropdownMenuItem>

                <div className="h-px bg-white/10 my-1 mx-2" />
                
                <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500/70">
                  Opsi Lanjutan
                </div>
                <DropdownMenuItem 
                  onClick={() => autoAssignBatch.mutate({ startDate: dateFrom, endDate: dateTo, workers, action: 'rebalance' })}
                  className="text-xs font-bold text-amber-500 hover:bg-amber-500/10 focus:bg-amber-500/10 rounded-xl cursor-pointer mb-1"
                >
                  Kocok Ulang & Bagi Rata Semua
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => autoAssignBatch.mutate({ startDate: dateFrom, endDate: dateTo, workers, action: 'reset' })}
                  className="text-xs font-bold text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 rounded-xl cursor-pointer"
                >
                  Reset (Kosongkan Semua)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="flex-1 overflow-hidden flex gap-4 p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Left: worker columns */}
          <div className="flex-1 min-w-0 overflow-y-auto pr-1">
            {workers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center mb-3">
                  <Users2 size={20} className="text-[#7C3AED]/60" />
                </div>
                <p className="text-sm font-bold text-white/60 mb-1">Belum Ada Pekerja</p>
                <p className="text-[11px] text-[#4B6478]">Undang anggota tim di menu Tim & Akses terlebih dahulu.</p>
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(workers.length, 3)}, 1fr)` }}>
                {workers.map(worker => (
                  <WorkerColumn
                    key={worker.id}
                    worker={worker}
                    tasks={workerTaskMap.get(worker.profile_id ?? worker.id) ?? []}
                    assignmentOverrides={assignmentOverrides}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: unassigned pool */}
          <div className="anime-unassigned-pool w-64 shrink-0 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <ClipboardList size={12} className="text-slate-400" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-[#4B6478]">
                Belum Di-assign
              </p>
              {unassignedTasks.length > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5">
                    {unassignedTasks.length}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        disabled={autoAssignBatch.isPending}
                        title="Auto Assign (Bagi Rata)"
                        className="w-6 h-6 rounded-full bg-[#7C3AED]/20 text-[#A78BFA] hover:bg-[#7C3AED]/40 hover:text-white border border-[#7C3AED]/30 flex items-center justify-center transition-all overflow-hidden relative group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-[#7C3AED]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <Wand2 size={12} className={cn("relative z-10 group-active:scale-90 transition-transform", autoAssignBatch.isPending && "animate-spin")} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-2xl p-2 z-[9999]">
                      <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
                        Isi Yang Kosong Saja
                      </div>
                      <DropdownMenuItem 
                        onClick={() => autoAssignBatch.mutate({ startDate: dateFrom, endDate: dateTo, workers, action: 'auto' })}
                        className="text-xs font-bold text-white hover:bg-white/10 focus:bg-white/10 rounded-xl cursor-pointer"
                      >
                        Sesuai Tampilan {viewRange === 'hari_ini' ? '(Hari Ini)' : viewRange === 'minggu_ini' ? '(Minggu Ini)' : '(Bulan Ini)'}
                      </DropdownMenuItem>

                      <div className="h-px bg-white/10 my-1 mx-2" />
                      
                      <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500/70">
                        Opsi Lanjutan
                      </div>
                      <DropdownMenuItem 
                        onClick={() => autoAssignBatch.mutate({ startDate: dateFrom, endDate: dateTo, workers, action: 'rebalance' })}
                        className="text-xs font-bold text-amber-500 hover:bg-amber-500/10 focus:bg-amber-500/10 rounded-xl cursor-pointer mb-1"
                      >
                        Kocok Ulang & Bagi Rata Semua
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => autoAssignBatch.mutate({ startDate: dateFrom, endDate: dateTo, workers, action: 'reset' })}
                        className="text-xs font-bold text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 rounded-xl cursor-pointer"
                      >
                        Reset (Kosongkan Semua)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center rounded-xl border border-dashed border-white/5">
                  <CheckCircle2 size={18} className="text-emerald-400/40 mb-2" />
                  <p className="text-[11px] text-[#4B6478]">Tidak ada tugas hari ini</p>
                </div>
              ) : (
                <UnassignedDropZone
                  tasks={unassignedTasks}
                  assignmentOverrides={assignmentOverrides}
                />
              )}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeTask ? (
              <DraggableTaskCard
                task={activeTask}
                assignmentOverride={assignmentOverrides.get(activeTask.id)}
                isDragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}