import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, Activity, CheckCircle2, AlertCircle, 
  MoreHorizontal, AlertTriangle, Plus, Sparkles,
  Calendar as CalendarIcon, ClipboardList, Info,
  LayoutGrid, MapPin, Scale, Wand2, ChevronLeft, 
  ChevronRight, AlertCircle as AlertCircleIcon
} from 'lucide-react'
import { 
  format, addDays, subDays, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, isSameDay, isSameMonth, 
  eachDayOfInterval, parseISO, addWeeks 
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/components/ui/button'
import { TaskHeader } from '@/dashboard/peternak/_shared/components/TaskHeader'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'

// Shared Task Components
import { Scene, GlassCard, SummaryTiles, WeekOrbit, CustomCalendar, EmptyState, CriticalOverdueAlert } from '@/dashboard/peternak/_shared/components/TaskBaseUI'
import { TaskCard, InteractiveCheckCard } from '@/dashboard/peternak/_shared/components/TaskCards'
import { CompleteTaskSheet, AdHocTaskSheet, IncidentReportSheet } from '@/dashboard/peternak/_shared/components/TaskSheets'
import { getUrgencyLabel, sortTasksByPriority } from '@/dashboard/peternak/_shared/utils/taskUtils'

// Hooks
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'
import { 
  usePeternakTaskInstances, 
  useInProgressTimbangCarryover, 
  useUpdateTaskStatus,
  useCreateTaskInstance,
  useAssignableMembers
} from '@/lib/hooks/usePeternakTaskData'

import { getLivestockConfig } from '@/lib/constants/taskTemplates'

// ── BROILER SPECIFIC CONFIG (Minimal Fallback) ────────────────────────────────

const BROILER_HOOKS = {
  useAnimals: () => ({ data: [], isLoading: false }),
  useAddWeight: () => ({ mutateAsync: () => Promise.resolve() }),
  useBatches: () => ({ data: [], isLoading: false }), 
  useActiveBatches: () => ({ data: [], isLoading: false }),
  useAddHealth: () => ({ mutateAsync: () => Promise.resolve() }),
  useAddFeed: () => ({ mutateAsync: () => Promise.resolve() }),
}

const STATUS_CFG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-slate-400', border: 'border-white/10', bg: 'bg-white/5' },
  in_progress: { label: 'Berjalan', icon: Activity, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
  selesai: { label: 'Selesai', icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  terlambat: { label: 'Terlambat', icon: AlertCircle, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10' },
  dilewati: { label: 'Dilewati', icon: MoreHorizontal, color: 'text-slate-500', border: 'border-white/10', bg: 'bg-white/5' },
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function BroilerDailyTask() {
  const livestockType = 'broiler'
  const config = getLivestockConfig(livestockType)
  const TASK_TYPE_CFG = config.taskTypeCfg
  const TASK_REPORT_CONFIG = config.reportConfig

  const { profile } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const p = usePeternakPermissions()
  const isStaffView = p.isStaff && !p.isOwner && !p.isManajer
  
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tab, setTab] = useState('semua')
  const [auditRange, setAuditRange] = useState('day') 
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [completeSheetOpen, setCompleteSheetOpen] = useState(false)
  const [adHocSheetOpen, setAdHocSheetOpen] = useState(false)
  const [incidentSheetOpen, setIncidentSheetOpen] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  
  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
  
  const { data: monthTasks = [], isLoading } = usePeternakTaskInstances({
    due_date_from: monthStart,
    due_date_to: monthEnd,
    workerProfileId: isStaffView ? (profile?.profile_id ?? profile?.id) : undefined,
    livestockType,
  })
  
  const { data: carryoverTasks = [] } = useInProgressTimbangCarryover()
  const { data: members = [] } = useAssignableMembers()

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const tasks = useMemo(() => {
    if (auditRange === 'day') {
      const todayTasks = monthTasks.filter(t => t.due_date === selectedDateStr)
      const todayIds = new Set(todayTasks.map(t => t.id))
      const carryover = carryoverTasks.filter(t => !todayIds.has(t.id))
      return [...carryover, ...todayTasks]
    }
    return monthTasks.filter(t => t.due_date === selectedDateStr)
  }, [monthTasks, carryoverTasks, selectedDateStr, auditRange])

  const filteredTasks = useMemo(() => {
    let list = tasks
    if (tab === 'pending') list = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress' || t.status === 'terlambat')
    else if (tab === 'selesai') list = tasks.filter(t => t.status === 'selesai')
    else if (tab !== 'semua') list = tasks.filter(t => t.status === tab)
    
    if (searchQuery) {
      list = list.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.kandang_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return sortTasksByPriority(list)
  }, [tasks, tab, searchQuery])

  const groupedTasks = useMemo(() => {
    const groups = {}
    filteredTasks.forEach(task => {
      const date = task.due_date
      if (!groups[date]) groups[date] = []
      groups[date].push(task)
    })
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({ date, tasks: groups[date] }))
  }, [filteredTasks])

  const stats = useMemo(() => {
    const total = tasks.length
    const selesai = tasks.filter(t => t.status === 'selesai').length
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length
    return { total, selesai, pending }
  }, [tasks])

  const updateStatus = useUpdateTaskStatus()
  const createTask = useCreateTaskInstance()

  const handleQuickComplete = useCallback(async (task) => {
    if (task.status === 'selesai' || task.status === 'dilewati') return
    const hasReportConfig = !!TASK_REPORT_CONFIG[task.task_type]
    if (hasReportConfig) {
      setSelectedTask(task)
      setCompleteSheetOpen(true)
      return
    }
    try {
      await updateStatus.mutateAsync({ id: task.id, status: 'selesai' })
      toast.success('Tugas selesai')
    } catch (err) {
      toast.error('Gagal memperbarui status')
    }
  }, [updateStatus, TASK_REPORT_CONFIG])

  const { setRightAction } = useOutletContext()
  useEffect(() => {
    if (isStaffView) {
      setRightAction(<Button onClick={() => setIncidentSheetOpen(true)} className="bg-rose-500 text-white rounded-full h-12 px-6 flex items-center gap-2 shadow-xl"><AlertTriangle size={18} /> Lapor</Button>)
    } else if (!isDesktop && p.canEditSettings) {
      setRightAction(<Button size="icon" onClick={() => setAdHocSheetOpen(true)} className="w-12 h-12 rounded-full bg-purple-600 text-white"><Plus size={24} /></Button>)
    } else setRightAction(null)
  }, [setRightAction, p.canEditSettings, isDesktop, isStaffView])

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <Scene>
      <TaskHeader 
        title="Tugas Harian (Broiler)"
        subtitle={format(selectedDate, 'EEEE, d MMMM yyyy', { locale: idLocale })}
        isDesktop={isDesktop}
        searchQuery={!isStaffView ? searchQuery : undefined}
        onSearchChange={!isStaffView ? setSearchQuery : undefined}
        filters={!isStaffView ? [{ id: 'pending', label: 'Pending' }, { id: 'selesai', label: 'Selesai' }, { id: 'semua', label: 'Semua' }] : undefined}
        activeFilter={tab}
        onFilterChange={setTab}
        actionButton={isDesktop && p.canEditSettings && (
          <Button onClick={() => setAdHocSheetOpen(true)} className="bg-purple-600 text-white rounded-full px-6">
            <Plus size={16} className="mr-2" /> Tugas Ad-hoc
          </Button>
        )}
      />

      <SummaryTiles stats={stats} />

      <main className={cn("px-4 pb-5 lg:px-5 max-w-[1700px] mx-auto", isDesktop ? "grid grid-cols-[380px_1fr] gap-12" : "flex flex-col")}>
        <aside className="space-y-4">
           <WeekOrbit selectedDate={selectedDate} onSelect={setSelectedDate} monthTasks={monthTasks} />
           {isDesktop && (
             <GlassCard className="p-8">
               <CustomCalendar currentMonth={currentMonth} selectedDate={selectedDate} onMonthChange={setCurrentMonth} onDateSelect={setSelectedDate} monthTasks={monthTasks} />
             </GlassCard>
           )}
        </aside>

        <section className="space-y-8">
          <CriticalOverdueAlert tasks={tasks} />
          <AnimatePresence mode="popLayout">
            {groupedTasks.length === 0 ? (
              <EmptyState isStaff={isStaffView} />
            ) : (
              groupedTasks.map((group) => (
                <div key={group.date} className="space-y-4">
                  {group.tasks.map((t) => (
                    <motion.div key={t.id} layout>
                      {isStaffView ? (
                        <InteractiveCheckCard task={t} isExpanded={expandedTaskId === t.id} onToggle={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)} onCheck={() => handleQuickComplete(t)} config={config} hooks={BROILER_HOOKS} updateStatus={updateStatus} profile={profile} livestockType={livestockType} members={members} />
                      ) : (
                        <TaskCard task={t} onClick={() => { setSelectedTask(t); setCompleteSheetOpen(true); }} TASK_TYPE_CFG={TASK_TYPE_CFG} STATUS_CFG={STATUS_CFG} members={members} />
                      )}
                    </motion.div>
                  ))}
                </div>
              ))
            )}
          </AnimatePresence>
        </section>
      </main>

      <CompleteTaskSheet open={completeSheetOpen} onOpenChange={setCompleteSheetOpen} task={selectedTask} config={config} hooks={BROILER_HOOKS} updateStatus={updateStatus} profile={profile} livestockType={livestockType} />
      <AdHocTaskSheet open={adHocSheetOpen} onOpenChange={setAdHocSheetOpen} livestockType={livestockType} hooks={BROILER_HOOKS} createTask={createTask} />
      <IncidentReportSheet open={incidentSheetOpen} onOpenChange={setIncidentSheetOpen} config={config} hooks={BROILER_HOOKS} livestockType={livestockType} />
    </Scene>
  )
}
