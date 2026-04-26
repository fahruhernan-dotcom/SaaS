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
  User as UserIcon, ClipboardList, Utensils, Scale,
  Syringe, Trash2, Activity, Heart, Lock, Plus
} from 'lucide-react'
import { createTimeline, stagger } from 'animejs'
import {
  usePeternakTaskInstances,
  useAssignableMembers,
  useUpdateTaskAssignment,
  useAutoAssignBatch,
} from '@/lib/hooks/usePeternakTaskData'
import { BrokerPageHeader } from '../../../_shared/components/transactions/BrokerPageHeader'
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
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'
import { cn } from '@/lib/utils'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// ─── Config ─────────────────────────────────────────────────────────────────

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
  selesai:     { label: 'Selesai',   color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  terlambat:   { label: 'Terlambat', color: 'text-red-400',    bg: 'bg-red-500/10',     border: 'border-red-500/30' },
}

// ─── DraggableTaskCard ───────────────────────────────────────────────────────

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
        'flex items-center gap-2.5 rounded-2xl border p-3 transition-all select-none',
        isComplete ? 'bg-white/[0.02] border-white/5 opacity-80' : 'bg-white/[0.03]',
        !isDragOverlay && 'anime-task-card',
        isDragOverlay
          ? 'shadow-2xl shadow-black/60 rotate-1 scale-105 border-green-500/40 bg-[#0C1521]'
          : isDragging
            ? 'opacity-30'
            : !isEffectivelyLocked && 'border-white/5 hover:border-white/10 cursor-grab active:cursor-grabbing',
        isUnlocked && 'ring-1 ring-amber-500/30'
      )}
    >
      <div 
        className={cn(
          "shrink-0 transition-colors flex items-center justify-center w-5 h-5 -ml-1", 
          isEffectivelyLocked ? "text-white/20 hover:text-white/60 cursor-pointer pointer-events-auto" : "text-white/20 group-hover:text-white/40 pointer-events-none"
        )}
        onClick={isEffectivelyLocked ? (e) => { e.stopPropagation(); setIsUnlocked(true); } : undefined}
        title={isEffectivelyLocked ? "Klik untuk membuka gembok" : undefined}
      >
        {isEffectivelyLocked ? <Lock size={12} /> : <GripVertical size={14} className={isUnlocked ? "text-amber-500/50" : "text-[#4B6478]"} />}
      </div>

      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner', typeCfg.bg, typeCfg.border, 'border')}>
        <TypeIcon size={14} className={typeCfg.color} />
      </div>
  
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-['Sora'] font-bold text-white truncate leading-tight">{task.template?.title ?? task.title ?? '—'}</p>
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
              <Clock size={10} className={cn(task.status === 'terlambat' ? "text-red-500" : "text-[#4B6478]")} />
              <span className={cn(task.status === 'terlambat' && "text-red-400 font-black")}>{task.due_time.slice(0, 5)}</span>
            </span>
          )}
        </div>
      </div>

      {assignedName ? (
        <span className="text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg px-2 py-1 shrink-0 truncate max-w-[80px]">
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

// ─── WorkerColumn ───────────────────────────────────────────────────────────

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
        'anime-worker-column flex flex-col min-w-0 rounded-2xl border-2 border-dashed p-3 transition-all min-h-[300px]',
        isOver ? 'border-green-500/40 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border-white/[0.04] bg-transparent'
      )}
    >
      <div className={cn(
        'flex items-center gap-3 rounded-xl border p-3.5 mb-3 transition-all',
        isOver ? 'border-green-500/30 bg-green-500/10' : 'border-white/[0.06] bg-white/[0.02]'
      )}>
        <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center font-black text-xs text-green-400 shrink-0 uppercase shadow-inner">
          {worker.full_name?.slice(0, 2) ?? 'XX'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-['Sora'] font-black text-white truncate leading-tight">{worker.full_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-[#4B6478] font-bold uppercase tracking-wider">{tasks.length} TUGAS</span>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">{tasks.filter(t => t.status === 'selesai').length} SELESAI</span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {tasks.length === 0 && (
          <div className="h-24 flex flex-col items-center justify-center opacity-40">
             <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-2">
                <Plus size={16} className="text-white/40" />
             </div>
             <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider">Tarik tugas ke sini</p>
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
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── UnassignedDropZone ──────────────────────────────────────────────────────

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
        'rounded-2xl border-2 border-dashed p-3 space-y-2 min-h-[120px] transition-all',
        isOver
          ? 'border-slate-500/40 bg-slate-500/5'
          : 'border-white/[0.04] bg-white/[0.01]'
      )}
    >
      {tasks.length === 0 ? (
        <div className="h-24 flex flex-col items-center justify-center opacity-40">
          <CheckCircle2 size={24} className="text-green-500/40 mb-2" />
          <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest text-center">Tugas Selesai Ter-assign</p>
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
              />
            ))}
          </div>
        ))
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DombaTaskAssign() {
  const livestockType = 'domba_penggemukan'
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

  const [assignmentOverrides, setAssignmentOverrides] = useState(new Map())

  const { data: rawTasks = [], isLoading: tasksLoading } = usePeternakTaskInstances({
    due_date_from: dateFrom,
    due_date_to: dateTo,
    livestockType // Ensure we filter for domba
  })

  const tasks = useMemo(() => {
    return [...rawTasks].sort((a, b) => {
      // Priority 1: Overdue > 24h & Sampling (Emergency)
      const aIsEmergency = a.status === 'terlambat' && a.title?.includes('Sampling')
      const bIsEmergency = b.status === 'terlambat' && b.title?.includes('Sampling')
      
      if (aIsEmergency && !bIsEmergency) return -1
      if (!aIsEmergency && bIsEmergency) return 1

      // Priority 2: Status
      const statusOrder = { terlambat: 0, pending: 1, in_progress: 2, selesai: 3 }
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status]
      }

      // Priority 3: Time
      return (a.due_time || '').localeCompare(b.due_time || '')
    })
  }, [rawTasks])
  const { data: workers = [], isLoading: workersLoading } = useAssignableMembers()
  const updateAssignment = useUpdateTaskAssignment()
  const autoAssignBatch = useAutoAssignBatch()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
      livestockType 
    })
  }

  useEffect(() => {
    if (!tasksLoading && !workersLoading) {
      // Small timeout to ensure DOM is fully painted
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
    <div className="flex flex-col h-full bg-[#06090F]">
      <BrokerPageHeader
        title="Board Penugasan"
        subtitle={`Domba Penguinakan • ${format(new Date(selectedDate), 'd MMMM yyyy', { locale: idLocale })}`}
        icon={<Users2 size={20} className="text-green-400" />}
        actionButton={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl">
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
                  'px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all',
                  selectedDate === today
                    ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-inner'
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

            <Select value={viewRange} onValueChange={setViewRange}>
              <SelectTrigger className="h-10 w-[140px] rounded-xl bg-white/[0.03] border-white/[0.08] px-4 text-[11px] font-black uppercase tracking-widest text-[#4B6478] focus:ring-0 focus:border-green-500/50">
                <SelectValue placeholder="Tampilan" />
              </SelectTrigger>
              <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-2xl p-1.5 shadow-2xl">
                <SelectItem value="hari_ini" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Hari Ini Saja</SelectItem>
                <SelectItem value="minggu_ini" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Minggu Ini</SelectItem>
                <SelectItem value="bulan_ini" className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Bulan Ini</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={autoAssignBatch.isPending || (unassignedTasks.length === 0 && workers.length === 0)}
                  className="flex items-center gap-2 px-5 h-10 rounded-xl bg-green-500 hover:bg-green-600 text-white text-[11px] font-black uppercase tracking-widest shadow-[0_4px_15px_rgba(34,197,94,0.3)] transition-all disabled:opacity-40"
                >
                  <Wand2 size={14} className={cn(autoAssignBatch.isPending && "animate-spin")} />
                  {autoAssignBatch.isPending ? 'Memproses...' : 'Auto-Assign'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-2xl p-2 z-[9999] shadow-2xl">
                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Alokasi Dasar</div>
                <DropdownMenuItem onClick={() => handleAutoAssignAction('auto')} className="text-xs font-bold text-white hover:bg-white/10 rounded-xl cursor-pointer p-3">Isi Yang Kosong</DropdownMenuItem>
                <div className="h-px bg-white/10 my-2 mx-2" />
                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-500/70">Opsi Lanjutan</div>
                <DropdownMenuItem onClick={() => handleAutoAssignAction('rebalance')} className="text-xs font-bold text-amber-400 hover:bg-amber-400/10 rounded-xl cursor-pointer p-3">Bagi Rata (Kocok Ulang)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAutoAssignAction('reset')} className="text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl cursor-pointer p-3">Reset Board (Kosongkan)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="flex-1 overflow-hidden flex gap-5 p-5">
        <DndContext collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 min-w-0 overflow-y-auto pr-2 custom-scrollbar">
            {workers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-4 border border-dashed border-white/10">
                   <Users2 size={40} className="text-[#4B6478]" />
                </div>
                <p className="text-sm font-['Sora'] font-black text-white mb-2 uppercase tracking-widest">Pekerja Tidak Ditemukan</p>
                <p className="text-[11px] text-[#4B6478] max-w-xs font-bold">Undang anggota tim atau atur role pekerja di pengaturan pengguna.</p>
              </div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(workers.length, isPageWide ? 4 : 3))}, 1fr)` }}>
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

          <div className="anime-unassigned-pool w-72 shrink-0 flex flex-col bg-white/[0.01] border border-white/[0.04] rounded-3xl p-4">
            <div className="flex items-center justify-between mb-4 px-1">
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
              <UnassignedDropZone tasks={unassignedTasks} assignmentOverrides={assignmentOverrides} />
            </div>
            
            <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
               <div className="flex items-center gap-2 mb-1">
                  <Wand2 size={12} className="text-amber-400" />
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Tips Pintar</p>
               </div>
               <p className="text-[10px] text-[#4B6478] font-bold leading-relaxed">
                  Gunakan <span className="text-white">Auto-Assign</span> untuk mendistribusikan tugas ke pekerja yang tersedia secara cepat.
               </p>
            </div>
          </div>

          <DragOverlay>
            {activeTask ? <DraggableTaskCard task={activeTask} assignmentOverride={assignmentOverrides.get(activeTask.id)} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}

const isPageWide = true // Placeholder for simple responsive logic or useMediaQuery
