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
import { TaskHeader } from '../../_shared/components/TaskHeader'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'

// Shared Task Components
import { Scene, GlassCard, SummaryTiles, WeekOrbit, CustomCalendar, EmptyState, CriticalOverdueAlert } from '../../_shared/components/TaskBaseUI'
import { TaskCard, InteractiveCheckCard } from '../../_shared/components/TaskCards'
import { CompleteTaskSheet, AdHocTaskSheet, IncidentReportSheet } from '../../_shared/components/TaskSheets'
import { getUrgencyLabel, sortTasksByPriority } from '../../_shared/utils/taskUtils'

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
import { 
  useSapiAnimals, 
  useAddSapiWeightRecord, 
  useSapiBatches, 
  useSapiActiveBatches, 
  useAddSapiHealthLog, 
  useAddSapiFeedLog 
} from '@/lib/hooks/useSapiPenggemukanData'

import { getLivestockConfig } from '@/lib/constants/taskTemplates'

// ── SAPI SPECIFIC CONFIG ──────────────────────────────────────────────────────

const SAPI_HOOKS = {
  useAnimals: useSapiAnimals,
  useAddWeight: useAddSapiWeightRecord,
  useBatches: useSapiBatches,
  useActiveBatches: useSapiActiveBatches,
  useAddHealth: useAddSapiHealthLog,
  useAddFeed: useAddSapiFeedLog,
  weightTable: 'sapi_weight_records'
}

const STATUS_CFG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-slate-400', border: 'border-white/10', bg: 'bg-white/5' },
  in_progress: { label: 'Berjalan', icon: Activity, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
  selesai: { label: 'Selesai', icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  terlambat: { label: 'Terlambat', icon: AlertCircle, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10' },
  dilewati: { label: 'Dilewati', icon: MoreHorizontal, color: 'text-slate-500', border: 'border-white/10', bg: 'bg-white/5' },
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function SapiDailyTask() {
  const livestockType = 'sapi_penggemukan'
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
  
  const listRef = React.useRef(null)

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

    if (auditRange === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
      return monthTasks.filter(t => {
        const d = parseISO(t.due_date)
        return d >= start && d <= end
      })
    }

    if (auditRange === 'month') {
      const start = startOfMonth(selectedDate)
      const end = endOfMonth(selectedDate)
      return monthTasks.filter(t => {
        const d = parseISO(t.due_date)
        return d >= start && d <= end
      })
    }

    return []
  }, [monthTasks, carryoverTasks, selectedDateStr, auditRange, selectedDate])

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
      .map(date => ({
        date,
        tasks: groups[date]
      }))
  }, [filteredTasks])

  const stats = useMemo(() => {
    const total = tasks.length
    const selesai = tasks.filter(t => t.status === 'selesai').length
    const terlambat = tasks.filter(t => t.status === 'terlambat').length
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length
    
    const getCompliance = (start, end) => {
      const intervalTasks = monthTasks.filter(t => { const d = parseISO(t.due_date); return d >= start && d <= end })
      return intervalTasks.length === 0 ? 0 : (intervalTasks.filter(t => t.status === 'selesai').length / intervalTasks.length) * 100
    }
    
    const today = new Date()
    const w0Compliance = getCompliance(subDays(today, 6), today)
    const w1Compliance = getCompliance(subDays(today, 13), subDays(today, 7))
    const complianceTrend = w1Compliance !== 0 ? ((w0Compliance - w1Compliance) / w1Compliance) * 100 : 0
    
    return { total, selesai, terlambat, pending, complianceTrend }
  }, [tasks, monthTasks])

  const updateStatus = useUpdateTaskStatus()
  const createTask = useCreateTaskInstance()
  const assignableMembers = useAssignableMembers

  const handleQuickComplete = useCallback(async (task) => {
    if (task.status === 'selesai' || task.status === 'dilewati') return
    
    const hasReportConfig = !!TASK_REPORT_CONFIG[task.task_type]
    const needsWeightEntry = task.task_type === 'timbang' && config.usesIndividualAnimals
    
    if (hasReportConfig || needsWeightEntry) {
      setSelectedTask(task)
      setCompleteSheetOpen(true)
      toast.info('Tugas ini memerlukan laporan detail', { icon: <Wand2 size={16} /> })
      return
    }

    try {
      await updateStatus.mutateAsync({ id: task.id, status: 'selesai', notes: 'Selesai tepat waktu (Quick Complete)' })
      toast.success('Tugas diselesaikan!', { icon: <CheckCircle2 size={16} /> })
    } catch (err) {
      toast.error('Gagal memperbarui status')
    }
  }, [updateStatus, TASK_REPORT_CONFIG, config.usesIndividualAnimals])

  // Animation variants for the task list
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: 30, scale: 0.98 },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        damping: 22,
        stiffness: 120
      }
    }
  }

  const { setRightAction } = useOutletContext()
  useEffect(() => {
    if (isStaffView) {
      setRightAction(
        <Button 
          onClick={() => setIncidentSheetOpen(true)} 
          className="bg-rose-500 hover:bg-rose-600 text-white rounded-full h-12 px-6 flex items-center gap-2 shadow-xl shadow-rose-900/20 active:scale-95 transition-all text-xs font-black uppercase tracking-widest"
        >
          <AlertTriangle size={18} /> Lapor Masalah
        </Button>
      )
    } else if (!isDesktop && p.canEditSettings) {
      setRightAction(<Button size="icon" onClick={() => setAdHocSheetOpen(true)} className="w-12 h-12 rounded-[22px] bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white shadow-2xl shadow-purple-900/40"><Plus size={24} /></Button>)
    } else setRightAction(null)
  }, [setRightAction, p.canEditSettings, isDesktop, isStaffView])

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <Scene>
      <TaskHeader 
        title="Tugas Harian"
        subtitle={format(selectedDate, 'EEEE, d MMMM yyyy', { locale: idLocale })}
        isDesktop={isDesktop}
        searchQuery={!isStaffView ? searchQuery : undefined}
        onSearchChange={!isStaffView ? setSearchQuery : undefined}
        filters={!isStaffView ? [{ id: 'pending', label: 'Belum Selesai' }, { id: 'selesai', label: 'Selesai' }, { id: 'terlambat', label: 'Terlambat' }, { id: 'semua', label: 'Semua' }] : undefined}
        activeFilter={tab}
        onFilterChange={setTab}
        actionButton={isDesktop && p.canEditSettings && (
          <Button onClick={() => setAdHocSheetOpen(true)} className="bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:scale-105 active:scale-95 text-white font-black uppercase tracking-[0.3em] text-[9px] rounded-full h-12 px-10 shadow-[0_10px_30px_rgba(124,58,237,0.4)] transition-all">
            <Sparkles size={16} className="mr-3" /> Tugas Ad-hoc
          </Button>
        )}
      />

      <div className="max-w-[1700px] mx-auto mb-4 lg:mb-8 lg:px-5">
        <div className="flex gap-2 px-4 lg:hidden overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => { setAuditRange('day'); setTab('selesai'); setSelectedDate(new Date()); }}
            className={cn(
              "h-9 px-4 rounded-2xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest shrink-0",
              auditRange === 'day' && tab === 'selesai'
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : "bg-white/[0.03] border border-white/[0.06] text-[#64748B]"
            )}
          >
            <Activity size={12} /> Hari Ini
          </button>
          <button
            onClick={() => { setAuditRange('week'); setTab('selesai'); }}
            className={cn(
              "h-9 px-4 rounded-2xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest shrink-0",
              auditRange === 'week' && tab === 'selesai'
                ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                : "bg-white/[0.03] border border-white/[0.06] text-[#64748B]"
            )}
          >
            <CalendarIcon size={12} /> Minggu
          </button>
          <button
            onClick={() => { setAuditRange('month'); setTab('selesai'); }}
            className={cn(
              "h-9 px-4 rounded-2xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest shrink-0",
              auditRange === 'month' && tab === 'selesai'
                ? "bg-purple-500/20 border border-purple-500/30 text-purple-400"
                : "bg-white/[0.03] border border-white/[0.06] text-[#64748B]"
            )}
          >
            <ClipboardList size={12} /> Bulan
          </button>
        </div>

        <div className="hidden lg:flex flex-wrap items-center gap-3">
          <Button
            onClick={() => { setAuditRange('day'); setTab('selesai'); setSelectedDate(new Date()); }}
            className={cn(
              "h-11 px-6 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
              auditRange === 'day' && tab === 'selesai'
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                : "bg-white/[0.02] border border-white/5 text-[#64748B] hover:bg-white/[0.05] hover:text-white"
            )}
          >
            <Activity size={14} /> Audit Hari Ini
          </Button>
          <Button
            onClick={() => { setAuditRange('week'); setTab('selesai'); }}
            className={cn(
              "h-11 px-6 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
              auditRange === 'week' && tab === 'selesai'
                ? "bg-blue-500/20 border border-blue-500/30 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                : "bg-white/[0.02] border border-white/5 text-[#64748B] hover:bg-white/[0.05] hover:text-white"
            )}
          >
            <CalendarIcon size={14} /> Audit Minggu Ini
          </Button>
          <Button
            onClick={() => { setAuditRange('month'); setTab('selesai'); }}
            className={cn(
              "h-11 px-6 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
              auditRange === 'month' && tab === 'selesai'
                ? "bg-purple-500/20 border border-purple-500/30 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                : "bg-white/[0.02] border border-white/5 text-[#64748B] hover:bg-white/[0.05] hover:text-white"
            )}
          >
            <ClipboardList size={14} /> Audit Bulan Ini
          </Button>
        </div>
      </div>

      <SummaryTiles stats={stats} />

      <main className={cn("px-4 pb-5 lg:px-5 max-w-[1700px] mx-auto", isDesktop ? "grid grid-cols-[380px_1fr] gap-12 items-start" : "flex flex-col")}>
        <aside className="space-y-4 lg:space-y-8 lg:sticky lg:top-36 mb-4 lg:mb-0">
           <WeekOrbit selectedDate={selectedDate} onSelect={setSelectedDate} monthTasks={monthTasks} />

           {isDesktop && (
             <GlassCard className="rounded-[40px] bg-white/[0.01]">
                <div className="p-7 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#64748B]">Kalender Kerja</span>
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10"><CalendarIcon size={16} className="text-[#A78BFA]" /></div>
                </div>
                <div className="p-8">
                  <CustomCalendar
                    currentMonth={currentMonth}
                    selectedDate={selectedDate}
                    onMonthChange={setCurrentMonth}
                    onDateSelect={setSelectedDate}
                    monthTasks={monthTasks}
                  />
                </div>
             </GlassCard>
           )}
        </aside>

        <section className="space-y-8 min-w-0">
          <CriticalOverdueAlert tasks={tasks} />
          <motion.div 
            ref={listRef} 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {groupedTasks.length === 0 ? (
                <EmptyState isStaff={isStaffView} />
              ) : (
                groupedTasks.map((group) => (
                  <div key={group.date} className="space-y-4 pt-4 first:pt-0">
                    {auditRange !== 'day' && (
                      <div className="flex items-center gap-3 px-4 py-2 mt-4 first:mt-0">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <span className="text-[11px] lg:text-[10px] font-black text-slate-400 lg:text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap">
                          {isSameDay(parseISO(group.date), new Date()) ? 'Hari Ini' : format(parseISO(group.date), 'EEEE, d MMM', { locale: idLocale })}
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                    )}
                    <div className="space-y-4">
                      {group.tasks.map((t) => (
                        <motion.div key={t.id} variants={itemVariants} layout>
                          {isStaffView ? (
                            <InteractiveCheckCard 
                              task={t} 
                              isExpanded={expandedTaskId === t.id} 
                              onToggle={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)} 
                              onCheck={() => handleQuickComplete(t)} 
                              config={config}
                              TASK_TYPE_CFG={TASK_TYPE_CFG}
                              TASK_REPORT_CONFIG={TASK_REPORT_CONFIG}
                              hooks={SAPI_HOOKS}
                              updateStatus={updateStatus}
                              profile={profile}
                              livestockType={livestockType}
                              members={members}
                            />
                          ) : (
                            <TaskCard 
                              task={t} 
                              onClick={() => { setSelectedTask(t); setCompleteSheetOpen(true); }} 
                              TASK_TYPE_CFG={TASK_TYPE_CFG}
                              STATUS_CFG={STATUS_CFG}
                              members={members}
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </section>
      </main>

      <CompleteTaskSheet
        open={completeSheetOpen}
        onOpenChange={setCompleteSheetOpen}
        task={selectedTask}
        config={config}
        TASK_TYPE_CFG={TASK_TYPE_CFG}
        TASK_REPORT_CONFIG={TASK_REPORT_CONFIG}
        hooks={SAPI_HOOKS}
        updateStatus={updateStatus}
        profile={profile}
        livestockType={livestockType}
      />

      <AdHocTaskSheet
        open={adHocSheetOpen}
        onOpenChange={setAdHocSheetOpen}
        livestockType={livestockType}
        hooks={SAPI_HOOKS}
        TASK_TYPE_CFG={TASK_TYPE_CFG}
        useAssignableMembers={assignableMembers}
        createTask={createTask}
      />

      <IncidentReportSheet
        open={incidentSheetOpen}
        onOpenChange={setIncidentSheetOpen}
        config={config}
        hooks={SAPI_HOOKS}
        livestockType={livestockType}
      />
    </Scene>
  )
}