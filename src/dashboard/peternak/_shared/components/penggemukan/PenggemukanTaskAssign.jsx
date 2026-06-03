import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  Users2, Wand2, GripVertical, Clock, CheckCircle2,
  ClipboardList, Utensils, Scale,
  Syringe, Trash2, Activity, Heart, Lock, Plus
} from 'lucide-react'
import { createTimeline, stagger } from 'animejs'
import {
  usePeternakTaskInstances,
  useAssignableMembers,
  useUpdateTaskAssignment,
  useAutoAssignBatch,
} from '@/lib/hooks/usePeternakTaskData'
import { BrokerPageHeader } from '@/dashboard/_shared/components/transactions/BrokerPageHeader'
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
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// ─── Accent Map ──────────────────────────────────────────────────────────────

const ACCENT = {
  purple: {
    btn: 'bg-[#7C3AED] hover:bg-[#6D28D9]',
    btnShadow: 'shadow-[0_4px_15px_rgba(124,58,237,0.3)]',
    todayActive: 'bg-[#7C3AED]/10 border-[#7C3AED]/30 text-[#A78BFA] shadow-inner',
    workerAvatar: 'bg-[#7C3AED]/20 border-[#7C3AED]/30 text-[#A78BFA]',
    workerHeaderOver: 'border-[#7C3AED]/40 bg-[#7C3AED]/10',
    columnOver: 'border-[#7C3AED]/40 bg-[#7C3AED]/5 shadow-[0_0_20px_rgba(124,58,237,0.1)]',
    doneText: 'text-[#A78BFA]',
    assignedBadge: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/25',
    dragBorder: 'border-[#7C3AED]/40',
    iconColor: 'text-[#A78BFA]',
  },
  green: {
    btn: 'bg-green-500 hover:bg-green-600',
    btnShadow: 'shadow-[0_4px_15px_rgba(34,197,94,0.3)]',
    todayActive: 'bg-green-500/10 border-green-500/30 text-green-400 shadow-inner',
    workerAvatar: 'bg-green-500/10 border-green-500/20 text-green-400',
    workerHeaderOver: 'border-green-500/30 bg-green-500/10',
    columnOver: 'border-green-500/40 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]',
    doneText: 'text-green-500',
    assignedBadge: 'bg-green-500/10 text-green-400 border-green-500/20',
    dragBorder: 'border-green-500/40',
    iconColor: 'text-green-400',
  },
}

// ─── Task Type Config ────────────────────────────────────────────────────────

const TASK_TYPE_CFG = {
  pakan:              { label: 'Pakan',      icon: Utensils,      color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  pemberian_pakan:    { label: 'Pakan',      icon: Utensils,      color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  timbang:            { label: 'Timbang',    icon: Scale,         color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  vaksinasi:          { label: 'Vaksin',     icon: Syringe,       color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  kebersihan_kandang: { label: 'Kebersihan', icon: Trash2,        color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/30' },
  kesehatan:          { label: 'Kesehatan',  icon: Activity,      color: 'text-pink-400',   bg: 'bg-pink-500/10',   border: 'border-pink-500/30' },
  reproduksi:         { label: 'Reproduksi', icon: Heart,         color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/30' },
  lainnya:            { label: 'Lainnya',    icon: ClipboardList, color: 'text-slate-400',  bg: 'bg-white/5',       border: 'border-white/10' },
}

const STATUS_CFG = {
  pending:     { label: 'Pending',   color: 'text-slate-400',  bg: 'bg-white/5',        border: 'border-white/10' },
  in_progress: { label: 'Progress',  color: 'text-blue-400',   bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
  selesai:     { label: 'Selesai',   color: 'text-green-400',  bg: 'bg-green-500/10',   border: 'border-green-500/30' },
  terlambat:   { label: 'Terlambat', color: 'text-red-400',    bg: 'bg-red-500/10',     border: 'border-red-500/30' },
}

// ─── DraggableTaskCard ───────────────────────────────────────────────────────

function DraggableTaskCard({ task, assignmentOverride, isDragOverlay = false, dragRotation = 0, accent }) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const isComplete = task.status === 'selesai'
  const isEffectivelyLocked = isComplete && !isUnlocked

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: isEffectivelyLocked
  })

  const style = transform
    ? {
        transform: isDragOverlay
          ? `${CSS.Translate.toString(transform)} rotate(${dragRotation}deg) scale(1.05)`
          : CSS.Translate.toString(transform),
        ...(isDragOverlay && { transition: 'transform 0.1s ease-out' }),
      }
    : undefined

  const typeCfg = TASK_TYPE_CFG[task.task_type || task.template?.task_type] ?? TASK_TYPE_CFG.lainnya
  const TypeIcon = typeCfg.icon
  const statusCfg = STATUS_CFG[task.status] ?? STATUS_CFG.pending
  const assignedName = assignmentOverride?.workerName ?? task.worker?.full_name

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isEffectivelyLocked ? listeners : {})}
      {...(!isEffectivelyLocked ? attributes : {})}
      className={cn(
        'flex items-center gap-2.5 rounded-2xl border p-3 transition-all select-none group',
        isComplete ? 'bg-white/[0.02] border-white/[0.03] opacity-80' : 'bg-white/[0.03] border-white/[0.03]',
        !isDragOverlay && 'anime-task-card',
        isDragOverlay
          ? cn('shadow-2xl shadow-black/60 bg-[#0C1521]', accent.dragBorder)
          : isDragging
            ? 'opacity-30'
            : !isEffectivelyLocked && 'hover:border-white/10 cursor-grab active:cursor-grabbing',
        isUnlocked && 'ring-1 ring-amber-500/30'
      )}
    >
      <div
        className={cn(
          "shrink-0 transition-colors flex items-center justify-center w-5 h-5 -ml-1",
          isEffectivelyLocked
            ? "text-white/20 hover:text-white/60 cursor-pointer pointer-events-auto"
            : "text-white/20 pointer-events-none"
        )}
        onClick={isEffectivelyLocked ? (e) => { e.stopPropagation(); setIsUnlocked(true) } : undefined}
        title={isEffectivelyLocked ? "Klik untuk membuka gembok" : undefined}
      >
        {isEffectivelyLocked
          ? <Lock size={12} />
          : <GripVertical size={14} className={cn("transition-opacity", isUnlocked ? "text-amber-500/50" : "text-[#4B6478] opacity-40 group-hover:opacity-100")} />
        }
      </div>

      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-inner border', typeCfg.bg, typeCfg.border)}>
        <TypeIcon size={13} className={typeCfg.color} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-white truncate leading-tight">{task.title ?? task.template?.title ?? '—'}</p>
          {task.status === 'selesai' && task.report_data?.feed_orts_category && (
            <span className="text-[14px]">
              {task.report_data.feed_orts_category === 'habis' ? '👍' : task.report_data.feed_orts_category === 'sedikit' ? '🟡' : '🔴'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {task.kandang_name && (
            <span className="text-[10px] text-[#4B6478] font-bold uppercase tracking-wider truncate">{task.kandang_name}</span>
          )}
          {task.due_time && (
            <span className="flex items-center gap-1 text-[10px] text-[#4B6478] font-bold">
              <Clock size={10} className={task.status === 'terlambat' ? "text-red-500" : "text-[#4B6478]"} />
              <span className={cn(task.status === 'terlambat' && "text-red-400 font-black")}>{task.due_time.slice(0, 5)}</span>
            </span>
          )}
        </div>
      </div>

      {assignedName ? (
        <span className={cn('text-[9px] font-black uppercase tracking-widest rounded-lg px-2 py-1 shrink-0 truncate max-w-[80px] border', accent.assignedBadge)}>
          {assignedName.split(' ')[0]}
        </span>
      ) : (
        <span className={cn('text-[9px] font-black uppercase tracking-widest rounded-lg px-2 py-1 shrink-0 border', statusCfg.bg, statusCfg.color, statusCfg.border)}>
          {statusCfg.label}
        </span>
      )}
    </div>
  )
}

// ─── WorkerColumn ─────────────────────────────────────────────────────────────

function WorkerColumn({ worker, tasks, assignmentOverrides, accent }) {
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

  const totalCount = tasks.length
  const doneCount = tasks.filter(t => t.status === 'selesai').length
  const progressPercent = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'anime-worker-column flex flex-col min-w-0 rounded-2xl p-3 transition-all min-h-[300px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]',
        isOver
          ? cn('border-2 border-dashed', accent.columnOver)
          : 'border border-white/[0.03] bg-white/[0.01]'
      )}
    >
      <div className={cn(
        'flex flex-col rounded-xl border mb-3 transition-all relative overflow-hidden',
        isOver ? accent.workerHeaderOver : 'border-white/[0.06] bg-white/[0.02]'
      )}>
        <div className="flex items-center gap-3 p-3.5 pb-3">
          <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 uppercase shadow-inner', accent.workerAvatar)}>
            {worker.full_name?.slice(0, 2) ?? 'XX'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate leading-tight">{worker.full_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-[#4B6478] font-bold uppercase tracking-wider">{totalCount} TUGAS</span>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", accent.doneText)}>{doneCount} SELESAI</span>
            </div>
          </div>
        </div>
        {/* Subtle progress bar at the bottom */}
        <div className="w-full h-1 bg-white/[0.04] mt-auto">
          <div
            className={cn("h-full transition-all duration-500 ease-out", accent.doneText.replace('text-', 'bg-'))}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {tasks.length === 0 && (
          <div className="h-24 flex flex-col items-center justify-center opacity-30">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-2">
              <Plus size={14} className="text-[#4B6478]" />
            </div>
            <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-wider">Tarik tugas ke sini</p>
          </div>
        )}
        {groupedTasks.map(group => (
          <div key={group.dateString} className="contents">
            <div className="py-2 flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#4B6478]">
                {group.dateString === 'Unknown' ? 'Tanpa Tanggal' : format(parseISO(group.dateString), 'EEEE, d MMM', { locale: idLocale })}
              </span>
              <div className="h-px bg-white/[0.04] flex-1" />
            </div>
            {group.tasks.map(task => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                assignmentOverride={assignmentOverrides.get(task.id)}
                accent={accent}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── UnassignedDropZone ───────────────────────────────────────────────────────

function UnassignedDropZone({ tasks, assignmentOverrides, accent }) {
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
        'rounded-2xl p-3 space-y-2 min-h-[120px] transition-all',
        isOver
          ? 'border-2 border-dashed border-slate-500/40 bg-slate-500/5'
          : 'border border-white/[0.03] bg-white/[0.01] shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]'
      )}
    >
      {tasks.length === 0 ? (
        <div className="h-24 flex flex-col items-center justify-center opacity-30">
          <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-2">
            <CheckCircle2 size={14} className="text-green-400" />
          </div>
          <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-wider text-center">Tugas Selesai Ter-assign</p>
        </div>
      ) : (
        groupedTasks.map(group => (
          <div key={group.dateString} className="contents">
            <div className="py-2 flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#4B6478]">
                {group.dateString === 'Unknown' ? 'Tanpa Tanggal' : format(parseISO(group.dateString), 'EEEE, d MMM', { locale: idLocale })}
              </span>
              <div className="h-px bg-white/[0.04] flex-1" />
            </div>
            {group.tasks.map(task => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                assignmentOverride={assignmentOverrides.get(task.id)}
                accent={accent}
              />
            ))}
          </div>
        ))
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PenggemukanTaskAssign({ config }) {
  const accent = ACCENT[config.accentTheme] ?? ACCENT.green
  const isPageWide = useMediaQuery('(min-width: 1280px)')
  const isMobile = useMediaQuery('(max-width: 767px)')

  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [viewRange, setViewRange] = useState('hari_ini')
  const [activeId, setActiveId] = useState(null)
  const [dragRotation, setDragRotation] = useState(0)

  const { dateFrom, dateTo } = useMemo(() => {
    const d = new Date(selectedDate)
    if (viewRange === 'minggu_ini') {
      return {
        dateFrom: format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        dateTo: format(endOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      }
    }
    if (viewRange === 'bulan_ini') {
      return {
        dateFrom: format(startOfMonth(d), 'yyyy-MM-dd'),
        dateTo: format(endOfMonth(d), 'yyyy-MM-dd'),
      }
    }
    const str = format(d, 'yyyy-MM-dd')
    return { dateFrom: str, dateTo: str }
  }, [selectedDate, viewRange])

  const [assignmentOverrides, setAssignmentOverrides] = useState(new Map())

  const { data: rawTasks = [], isLoading: tasksLoading } = usePeternakTaskInstances({
    due_date_from: dateFrom,
    due_date_to: dateTo,
    livestockType: config.livestockType,
  })

  const tasks = useMemo(() => {
    return [...rawTasks].sort((a, b) => {
      const aIsEmergency = a.status === 'terlambat' && a.title?.includes('Sampling')
      const bIsEmergency = b.status === 'terlambat' && b.title?.includes('Sampling')
      if (aIsEmergency && !bIsEmergency) return -1
      if (!aIsEmergency && bIsEmergency) return 1
      const statusOrder = { terlambat: 0, pending: 1, in_progress: 2, selesai: 3 }
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status]
      return (a.due_time || '').localeCompare(b.due_time || '')
    })
  }, [rawTasks])

  const { data: workers = [], isLoading: workersLoading } = useAssignableMembers()
  const updateAssignment = useUpdateTaskAssignment()
  const autoAssignBatch = useAutoAssignBatch()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  )

  const effectiveProfileId = useCallback((task) => {
    const override = assignmentOverrides.get(task.id)
    if (override) return override.workerProfileId ?? null
    return task.assigned_profile_id ?? null
  }, [assignmentOverrides])

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

  function handleDragStart({ active }) {
    setActiveId(active.id)
    setDragRotation(0)
  }

  function handleDragMove({ delta }) {
    setDragRotation(Math.max(-8, Math.min(8, delta.x * 0.15)))
  }

  async function handleDragEnd({ active, over }) {
    setActiveId(null)
    setDragRotation(0)
    if (!over) return

    const taskId = active.id
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    let newWorkerId = null
    let newWorkerProfileId = null
    let newWorkerName = null

    if (over.id === 'unassigned') {
      newWorkerId = null
      newWorkerProfileId = null
      newWorkerName = null
    } else if (String(over.id).startsWith('worker-')) {
      const wId = over.id.replace('worker-', '')
      const worker = workers.find(w => String(w.id) === String(wId))
      if (!worker) return
      newWorkerId = null
      newWorkerProfileId = worker.profile_id ?? worker.id
      newWorkerName = worker.full_name
    } else {
      return
    }

    const current = assignmentOverrides.get(taskId)
    const currentPId = current?.workerProfileId ?? task.assigned_profile_id ?? null
    if (String(currentPId) === String(newWorkerProfileId)) return

    setAssignmentOverrides(prev => {
      const next = new Map(prev)
      if (over.id === 'unassigned') {
        next.set(taskId, { workerId: null, workerProfileId: null, workerName: null })
      } else {
        next.set(taskId, { workerId: newWorkerId, workerProfileId: newWorkerProfileId, workerName: newWorkerName })
      }
      return next
    })

    try {
      await updateAssignment.mutateAsync({ id: taskId, assigned_worker_id: newWorkerId, assigned_profile_id: newWorkerProfileId })
    } catch {
      setAssignmentOverrides(prev => {
        const next = new Map(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  function handleAutoAssignAction(action) {
    autoAssignBatch.mutate({
      startDate: dateFrom,
      endDate: dateTo,
      workers,
      action,
      livestockType: config.livestockType,
    })
  }

  useEffect(() => {
    if (!tasksLoading && !workersLoading) {
      const timeout = setTimeout(() => {
        const tl = createTimeline({
          defaults: { easing: 'spring(1, 80, 10, 0)', duration: 800 }
        })
        if (document.querySelector('.anime-worker-column')) {
          tl.add('.anime-worker-column', { translateY: [40, 0], opacity: [0, 1], delay: stagger(100) })
        }
        if (document.querySelector('.anime-unassigned-pool')) {
          tl.add('.anime-unassigned-pool', { translateX: [40, 0], opacity: [0, 1] }, '-=600')
        }
        if (document.querySelector('.anime-task-card')) {
          tl.add('.anime-task-card', { scale: [0.9, 1], opacity: [0, 1], delay: stagger(40) }, '-=500')
        }
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [tasksLoading, workersLoading])

  if (tasksLoading || workersLoading) return <LoadingSpinner fullPage />

  return (
    <div className="flex flex-col h-full bg-[#06090F] w-full overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
        <BrokerPageHeader
          title={config.pageTitle ?? 'Board Penugasan'}
          subtitle={format(new Date(selectedDate), 'd MMMM yyyy', { locale: idLocale })}
        />

        {/* Controls Strip — horizontal scroll on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 pb-3 md:px-5 shrink-0">
          {/* Date navigation */}
          <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl shrink-0 h-10">
            <button
              onClick={() => {
                const d = new Date(selectedDate)
                d.setDate(d.getDate() - 1)
                setSelectedDate(d.toISOString().split('T')[0])
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4B6478] hover:text-white hover:bg-white/10 transition-colors"
            >
              ‹
            </button>
            <button
              onClick={() => setSelectedDate(today)}
              className={cn(
                'px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap',
                selectedDate === today
                  ? accent.todayActive
                  : 'border-transparent text-[#4B6478] hover:text-white'
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
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4B6478] hover:text-white hover:bg-white/10 transition-colors"
            >
              ›
            </button>
          </div>

          {/* View Range */}
          <div className="shrink-0">
            <Select value={viewRange} onValueChange={setViewRange}>
              <SelectTrigger className="h-10 w-[130px] rounded-xl bg-white/[0.03] border-white/[0.08] px-3 text-[11px] font-black uppercase tracking-widest text-[#4B6478] focus:ring-0">
                <SelectValue placeholder="Tampilan" />
              </SelectTrigger>
              <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-2xl p-1.5 shadow-2xl">
                <SelectItem value="hari_ini" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Hari Ini Saja</SelectItem>
                <SelectItem value="minggu_ini" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Minggu Ini</SelectItem>
                <SelectItem value="bulan_ini" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Bulan Ini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto-assign */}
          <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={autoAssignBatch.isPending || (unassignedTasks.length === 0 && workers.length === 0)}
                  className={cn(
                    'flex items-center gap-2 px-4 h-10 rounded-xl text-white text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-40 whitespace-nowrap',
                    accent.btn,
                    accent.btnShadow
                  )}
                >
                  <Wand2 size={13} className={cn(autoAssignBatch.isPending && "animate-spin")} />
                  {autoAssignBatch.isPending ? 'Memproses...' : 'Auto-Assign'}
                </button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-2xl p-2 z-[9999] shadow-2xl">
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Alokasi Dasar</div>
              <DropdownMenuItem onClick={() => handleAutoAssignAction('auto')} className="text-xs font-bold text-white hover:bg-white/10 rounded-xl cursor-pointer p-3">
                Isi Yang Kosong {viewRange === 'hari_ini' ? '(Hari Ini)' : viewRange === 'minggu_ini' ? '(Minggu Ini)' : '(Bulan Ini)'}
              </DropdownMenuItem>
              <div className="h-px bg-white/10 my-2 mx-2" />
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-500/70">Opsi Lanjutan</div>
              <DropdownMenuItem onClick={() => handleAutoAssignAction('rebalance')} className="text-xs font-bold text-amber-400 hover:bg-amber-400/10 rounded-xl cursor-pointer p-3">
                Bagi Rata (Kocok Ulang)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAutoAssignAction('reset')} className="text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl cursor-pointer p-3">
                Reset Board (Kosongkan)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

        {/* Board area */}
        <div className={cn(
          "flex-1 min-h-0 px-4 pb-28 md:px-5 md:pb-5",
          isMobile ? "overflow-y-auto" : "overflow-hidden flex gap-5"
        )}>
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            {/* On desktop: side-by-side; on mobile: stacked */}
            <div className={cn(isMobile ? "flex flex-col gap-4" : "flex gap-5 h-full w-full")}>

              {/* Worker columns area */}
              <div className={cn(
                isMobile ? "w-full" : "flex-1 min-w-0 overflow-y-auto pr-2 custom-scrollbar"
              )}>
                {workers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-3 border border-dashed border-white/10">
                      <Users2 size={28} className="text-[#4B6478] md:hidden" />
                      <Users2 size={40} className="text-[#4B6478] hidden md:block" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1 uppercase tracking-widest">Pekerja Tidak Ditemukan</p>
                    <p className="text-[11px] text-[#4B6478] max-w-xs font-bold">Undang anggota tim atau atur role pekerja di pengaturan pengguna.</p>
                  </div>
                ) : (
                  <div
                    className={cn(isMobile ? "flex flex-col gap-3" : "grid gap-4")}
                    style={isMobile ? undefined : { gridTemplateColumns: `repeat(${Math.max(1, Math.min(workers.length, isPageWide ? 4 : 3))}, 1fr)` }}
                  >
                    {workers.map(worker => (
                      <WorkerColumn
                        key={worker.id}
                        worker={worker}
                        tasks={workerTaskMap.get(worker.profile_id ?? worker.id) ?? []}
                        assignmentOverrides={assignmentOverrides}
                        accent={accent}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column Stack: Antrean Tugas & Tips Pintar */}
              {!isMobile ? (
                <div className="w-72 shrink-0 flex flex-col gap-4 h-full">
                  {/* Antrean Tugas (Unassigned pool) */}
                  <div className="anime-unassigned-pool flex-1 min-h-0 flex flex-col bg-white/[0.01] border border-white/[0.03] rounded-3xl p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <ClipboardList size={14} className="text-[#4B6478]" />
                        <p className="text-xs font-black uppercase tracking-widest text-white">Antrean Tugas</p>
                      </div>
                      {unassignedTasks.length > 0 && (
                        <span className="text-[10px] font-black bg-amber-500 text-black rounded-lg px-2 py-0.5">
                          {unassignedTasks.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                      <UnassignedDropZone
                        tasks={unassignedTasks}
                        assignmentOverrides={assignmentOverrides}
                        accent={accent}
                      />
                    </div>
                  </div>

                  {/* Tips Pintar */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col gap-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                    <div className="flex items-center gap-2">
                      <Wand2 size={12} className="text-amber-400 shrink-0" />
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest whitespace-nowrap">Tips Pintar</p>
                    </div>
                    <p className="text-[10px] text-[#4B6478] font-bold leading-relaxed">
                      Gunakan <span className="text-white">Auto-Assign</span> untuk mendistribusikan tugas ke pekerja yang tersedia secara cepat.
                    </p>
                  </div>
                </div>
              ) : (
                /* Mobile layout: stacked */
                <div className="w-full flex flex-col gap-4">
                  {/* Antrean Tugas (Unassigned pool) */}
                  <div className="anime-unassigned-pool flex flex-col bg-white/[0.01] border border-white/[0.03] rounded-3xl p-4">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <ClipboardList size={14} className="text-[#4B6478]" />
                        <p className="text-xs font-black uppercase tracking-widest text-white">Antrean Tugas</p>
                      </div>
                      {unassignedTasks.length > 0 && (
                        <span className="text-[10px] font-black bg-amber-500 text-black rounded-lg px-2 py-0.5">
                          {unassignedTasks.length}
                        </span>
                      )}
                    </div>

                    <div>
                      <UnassignedDropZone
                        tasks={unassignedTasks}
                        assignmentOverrides={assignmentOverrides}
                        accent={accent}
                      />
                    </div>
                  </div>

                  {/* Tips Pintar */}
                  <div className="p-2.5 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Wand2 size={12} className="text-amber-400 shrink-0" />
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest whitespace-nowrap">Tips Pintar</p>
                    </div>
                    <p className="text-[10px] text-[#4B6478] font-bold">
                      Gunakan <span className="text-white">Auto-Assign</span> di atas untuk distribusi cepat.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DragOverlay>
              {activeTask ? (
                <DraggableTaskCard
                  task={activeTask}
                  assignmentOverride={assignmentOverrides.get(activeTask.id)}
                  isDragOverlay
                  dragRotation={dragRotation}
                  accent={accent}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
