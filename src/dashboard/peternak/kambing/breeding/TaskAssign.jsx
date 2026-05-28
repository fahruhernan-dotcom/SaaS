import React, { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  Users2, Wand2, GripVertical, Clock, AlertCircle, CheckCircle2,
  User as UserIcon, Calendar, ClipboardList, Utensils, Scale,
  Syringe, Trash2, Activity, Heart, RefreshCw, Lock
} from 'lucide-react'
import { 
  usePeternakTaskInstances,
  useAssignableMembers,
  useUpdateTaskAssignment,
  useAutoAssignBatch,
} from '@/lib/hooks/usePeternakTaskData'
import { BrokerPageHeader } from '@/dashboard/_shared/components/transactions/BrokerPageHeader'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
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
import { cn } from '@/lib/utils'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

// ─── Config ───────────────────────────────────────────────────────────────────

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

  const typeCfg = TASK_TYPE_CFG[task.task_type || task.template?.task_type] ?? TASK_TYPE_CFG.lainnya
  const TypeIcon = typeCfg.icon
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
            : 'border-white/5 hover:border-white/10 active:border-white/20'
      )}
    >
      <div className={cn('p-1.5 rounded-lg shrink-0', typeCfg.bg)}>
        <TypeIcon size={14} className={typeCfg.color} />
      </div>
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white truncate">
            {task.title}
          </span>
          {isComplete && (
            <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock size={10} /> {task.due_date}
          </span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
             • {task.kandang_name || 'Tanpa Kandang'}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
           <UserIcon size={10} className={assignedName ? 'text-blue-400' : 'text-slate-500'} />
           <span className={cn('text-[10px] font-medium max-w-[60px] truncate', assignedName ? 'text-blue-200' : 'text-slate-500')}>
             {assignedName || 'Unassigned'}
           </span>
        </div>
        {isComplete && (
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setIsUnlocked(!isUnlocked); }}
            className={cn(
              "flex items-center gap-1 px-1 py-0.5 rounded transition-all",
              isUnlocked ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-500 hover:bg-white/10"
            )}
          >
            <Lock size={8} />
            <span className="text-[8px] font-bold uppercase">{isUnlocked ? 'Unlocked' : 'Locked'}</span>
          </button>
        )}
      </div>

      {!isEffectivelyLocked && (
        <div className="px-1 py-4 cursor-grab active:cursor-grabbing text-slate-600">
          <GripVertical size={14} />
        </div>
      )}
    </div>
  )
}

// ─── WorkerSlot ──────────────────────────────────────────────────────────────

function WorkerSlot({ worker, tasks, isOver = false }) {
  const { setNodeRef } = useDroppable({ id: worker.id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group flex flex-col rounded-2xl border transition-all duration-300',
        isOver
          ? 'bg-[#12202E] border-blue-500/40 ring-1 ring-blue-500/20'
          : 'bg-[#0A1118]/50 border-white/5'
      )}
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <UserIcon className="text-blue-400" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
              {worker.full_name}
            </h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              {tasks.length} TUGAS AKTIF
            </span>
          </div>
        </div>
      </div>

      <div className="p-2 min-h-[120px] flex flex-col gap-2 relative">
        {tasks.map(task => (
          <DraggableTaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
            <Users2 size={24} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">SIAP MENERIMA</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function KambingBreedingTaskAssign() {
  const livestockType = 'kambing_breeding'
  const [range, setRange] = useState('week')
  const [activeId, setActiveId] = useState(null)
  const [localAssignments, setLocalAssignments] = useState({})

  const filters = useMemo(() => {
    const today = new Date()
    if (range === 'week') {
      return { 
        due_date_from: format(startOfWeek(today), 'yyyy-MM-dd'),
        due_date_to:   format(endOfWeek(today), 'yyyy-MM-dd'),
        livestockType
      }
    }
    return {
      due_date_from: format(startOfMonth(today), 'yyyy-MM-dd'),
      due_date_to:   format(endOfMonth(today), 'yyyy-MM-dd'),
      livestockType
    }
  }, [range, livestockType])

  const { data: rawTasks = [], isLoading: loadingTasks, refetch } = usePeternakTaskInstances(filters)
  const { data: members = [], isLoading: loadingMembers } = useAssignableMembers()
  const updateAssignment = useUpdateTaskAssignment()
  const autoAssign = useAutoAssignBatch()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const unassignedTasks = useMemo(() => 
    rawTasks.filter(t => !t.worker_id && !localAssignments[t.id]),
    [rawTasks, localAssignments]
  )

  const tasksByWorker = useMemo(() => {
    const map = {}
    members.forEach(m => map[m.id] = [])
    
    rawTasks.forEach(task => {
      const currentWorkerId = localAssignments[task.id]?.workerId ?? task.worker_id
      if (currentWorkerId && map[currentWorkerId]) {
        map[currentWorkerId].push(task)
      }
    })
    return map
  }, [rawTasks, members, localAssignments])

  const handleDragStart = ({ active }) => setActiveId(active.id)

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null)
    if (!over) return

    const taskId = active.id
    const targetWorkerId = over.id === 'unassigned' ? null : over.id
    const targetWorker = members.find(m => m.id === targetWorkerId)

    setLocalAssignments(prev => ({
      ...prev,
      [taskId]: { workerId: targetWorkerId, workerName: targetWorker?.full_name }
    }))

    try {
      await updateAssignment.mutateAsync({ taskId, workerId: targetWorkerId })
      toast.success(targetWorkerId ? `Tugas diberikan ke ${targetWorker.full_name}` : 'Tugas dilepas')
      refetch()
    } catch (_err) {
      setLocalAssignments(prev => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
      toast.error('Gagal memperbarui penugasan')
    }
  }

  const handleAutoAssign = async () => {
    const promise = autoAssign.mutateAsync({ livestockType })
    toast.promise(promise, {
      loading: 'Menghitung distribusi optimal...',
      success: (data) => {
        refetch()
        return `Berhasil mendistribusikan ${data?.count || 0} tugas`
      },
      error: 'Gagal melakukan auto-assign'
    })
  }

  const activeTask = useMemo(() => 
    rawTasks.find(t => t.id === activeId),
    [rawTasks, activeId]
  )

  if (loadingTasks || loadingMembers) return <LoadingSpinner fullPage />

  return (
    <div className="min-h-screen bg-[#060B10] text-slate-200 pb-24">
      <BrokerPageHeader 
        title="Penugasan (Kambing Breeding)" 
        subtitle="Kelola distribusi tugas tim kandang"
      >
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white rounded-xl">
              <Calendar size={14} className="mr-2 text-blue-400" />
              <SelectValue placeholder="Pilih Rentang" />
            </SelectTrigger>
            <SelectContent className="bg-[#121D27] border-white/10 text-slate-200">
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleAutoAssign}
            disabled={autoAssign.isPending || unassignedTasks.length === 0}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
            <Wand2 size={16} className="mr-2" />
            Auto Assign
          </Button>
        </div>
      </BrokerPageHeader>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="px-6 lg:px-8 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 mt-8">
          
          {/* Unassigned Tasks Pool */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ClipboardList size={16} className="text-slate-400" />
                POOL TUGAS 
                <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px]">
                  {unassignedTasks.length}
                </span>
              </h2>
            </div>
            
            <DroppablePool id="unassigned" tasks={unassignedTasks} />
          </div>

          {/* Worker Slots Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users2 size={16} className="text-blue-400" />
                TIM KANDANG AKTIF
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {members.map(worker => (
                <WorkerSlot 
                  key={worker.id} 
                  worker={worker} 
                  tasks={tasksByWorker[worker.id] || []} 
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <DraggableTaskCard 
              task={activeTask} 
              assignmentOverride={localAssignments[activeTask.id]}
              isDragOverlay 
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function DroppablePool({ id, tasks }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-2xl border p-4 min-h-[500px] transition-all duration-300',
        isOver ? 'bg-white/5 border-blue-500/20' : 'bg-black/20 border-white/5'
      )}
    >
      <div className="flex flex-col gap-3">
        {tasks.map(task => (
          <DraggableTaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20 text-slate-600">
            <CheckCircle2 size={40} className="mb-3 opacity-20" />
            <p className="text-xs font-medium uppercase tracking-widest opacity-40 text-center">
              SEMUA TUGAS<br/>TERALOKASI
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
