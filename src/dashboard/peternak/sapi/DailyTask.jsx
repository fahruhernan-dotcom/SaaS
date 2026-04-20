import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Outlet, useOutletContext, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, CheckCircle2, Clock, AlertCircle, Calendar as CalendarIcon, 
  ChevronRight, Utensils, Scale, Syringe, Trash2, 
  Activity, ClipboardList, Filter, MoreHorizontal,
  User as UserIcon, MapPin, ExternalLink, ChevronLeft, Search,
  TrendingUp, TrendingDown, AlertTriangle, Beef, Activity as HealthIcon, 
  LayoutGrid, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
  Heart, Sparkles, Wand2, Info, Lock, Save
} from 'lucide-react'
import { 
  usePeternakTaskInstances,
  useTodayTaskInstances, 
  useUpdateTaskStatus, 
  useLinkTaskRecord,
  useCreateTaskInstance,
  useKandangWorkers,
  useAssignableMembers
} from '@/lib/hooks/usePeternakTaskData'
import { 
  useSapiAnimals, 
  useAddSapiWeightRecord, 
  useSapiBatches,
  useSapiActiveBatches,
  useAddSapiHealthLog
} from '@/lib/hooks/useSapiPenggemukanData'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'
import { useAuth, getPeternakBasePath } from '@/lib/hooks/useAuth'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/DatePicker'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { InputNumber } from '@/components/ui/InputNumber'
import AnimatedCheckmark from '@/components/ui/AnimatedCheckmark'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { BrokerPageHeader } from '../../_shared/components/transactions/BrokerPageHeader'
import { toast } from 'sonner'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { 
  format, startOfMonth, endOfMonth, isSameDay, 
  addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval,
  isBefore, parseISO, differenceInHours, subWeeks, addWeeks,
  isSameMonth, startOfDay
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { createTimeline, stagger } from 'animejs'
import { cn } from '@/lib/utils'

const TASK_TYPE_CFG = {
  pakan: { label: 'Pakan', icon: Utensils, color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5', shadow: 'shadow-orange-500/10' },
  pemberian_pakan: { label: 'Pakan', icon: Utensils, color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5', shadow: 'shadow-orange-500/10' },
  timbang: { label: 'Timbang', icon: Scale, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5', shadow: 'shadow-blue-500/10' },
  vaksinasi: { label: 'Vaksin', icon: Syringe, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5', shadow: 'shadow-purple-500/10' },
  kebersihan: { label: 'Kebersihan', icon: Trash2, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', shadow: 'shadow-emerald-500/10' },
  kebersihan_kandang: { label: 'Kebersihan', icon: Trash2, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', shadow: 'shadow-emerald-500/10' },
  ceklis_kesehatan: { label: 'Kesehatan', icon: Activity, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5', shadow: 'shadow-rose-500/10' },
  kesehatan: { label: 'Kesehatan', icon: Activity, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5', shadow: 'shadow-rose-500/10' },
  reproduksi: { label: 'Reproduksi', icon: Heart, color: 'text-pink-400', border: 'border-pink-500/20', bg: 'bg-pink-500/5', shadow: 'shadow-pink-400/10' },
  lainnya: { label: 'Lainnya', icon: ClipboardList, color: 'text-slate-400', border: 'border-white/10', bg: 'bg-white/5', shadow: 'shadow-white/5' },
}

const TASK_REPORT_CONFIG = {
  pakan: {
    fields: [
      { id: 'amount_kg', label: 'Jumlah Pakan (KG)', type: 'number', placeholder: '0.0', suffix: 'KG', required: true },
      { id: 'feed_type', label: 'Jenis Pakan', type: 'select', options: ['Konsentrat', 'Hijauan', 'Silase', 'Lainnya'], placeholder: 'Pilih jenis...' }
    ]
  },
  pemberian_pakan: {
     fields: [
      { id: 'amount_kg', label: 'Jumlah Pakan (KG)', type: 'number', placeholder: '0.0', suffix: 'KG', required: true },
      { id: 'feed_type', label: 'Jenis Pakan', type: 'select', options: ['Konsentrat', 'Hijauan', 'Silase', 'Lainnya'], placeholder: 'Pilih jenis...' }
    ]
  },
  vaksinasi: {
    fields: [
      { id: 'vaccine_name', label: 'Nama Vaksin (Batch)', type: 'text', placeholder: 'Contoh: Anthrax B-12', required: true },
      { id: 'dosage_ml', label: 'Dosis (ml)', type: 'number', placeholder: '0.0', suffix: 'ML' }
    ]
  },
  kebersihan: {
    fields: [
      { id: 'areas', label: 'Area Terverifikasi', type: 'multi-checkbox', options: ['Lantai Kandang', 'Tempat Makan', 'Tempat Minum', 'Drainase'], required: true },
      { id: 'condition', label: 'Kondisi Akhir', type: 'select', options: ['Sangat Bersih', 'Bersih', 'Cukup'], required: true }
    ]
  },
  kebersihan_kandang: {
    fields: [
      { id: 'areas', label: 'Area Terverifikasi', type: 'multi-checkbox', options: ['Lantai Kandang', 'Tempat Makan', 'Tempat Minum', 'Drainase'], required: true },
      { id: 'condition', label: 'Kondisi Akhir', type: 'select', options: ['Sangat Bersih', 'Bersih', 'Cukup'], required: true }
    ]
  },
  kesehatan: {
    fields: [
      { id: 'temp', label: 'Suhu Tubuh (°C)', type: 'number', placeholder: '38.5', suffix: '°C' },
      { id: 'symptoms', label: 'Gejala Terpantau', type: 'multi-checkbox', options: ['Nafsu Makan Turun', 'Lemas', 'Batuk', 'Diare', 'Normal'], required: true }
    ]
  },
  ceklis_kesehatan: {
    fields: [
      { id: 'temp', label: 'Suhu Tubuh (°C)', type: 'number', placeholder: '38.5', suffix: '°C' },
      { id: 'symptoms', label: 'Gejala Terpantau', type: 'multi-checkbox', options: ['Nafsu Makan Turun', 'Lemas', 'Batuk', 'Diare', 'Normal'], required: true }
    ]
  }
}

const STATUS_CFG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-slate-400', border: 'border-white/10', bg: 'bg-white/5' },
  in_progress: { label: 'Berjalan', icon: Activity, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
  selesai: { label: 'Selesai', icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  terlambat: { label: 'Terlambat', icon: AlertCircle, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10' },
  dilewati: { label: 'Dilewati', icon: MoreHorizontal, color: 'text-slate-500', border: 'border-white/10', bg: 'bg-white/5' },
}

// â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getUrgencyLabel(task) {
  if (task.status === 'selesai' || task.status === 'dilewati') return null
  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  if (task.due_date !== todayStr) return null
  if (!task.due_time) return { label: 'HARI INI', color: 'bg-[#7C3AED]/20 text-[#A78BFA] border-[#7C3AED]/30 shadow-lg shadow-purple-900/20' }
  const [h, m, s] = task.due_time.split(':')
  const dueDateTime = new Date(now)
  dueDateTime.setHours(parseInt(h), parseInt(m), parseInt(s))
  const diffHours = differenceInHours(dueDateTime, now)
  if (isBefore(dueDateTime, now)) return { label: 'MENDESAK', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-lg shadow-rose-900/20' }
  if (diffHours <= 2) return { label: 'SEGERA', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-900/20' }
  return { label: 'HARI INI', color: 'bg-[#7C3AED]/20 text-[#A78BFA] border-[#7C3AED]/30 shadow-lg shadow-purple-900/20' }
}

// â”€â”€ ATMOSPHERIC SCENE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Scene = ({ children }) => (
  <div className="relative min-h-screen bg-[#06090F] overflow-hidden selection:bg-purple-500/30">
    <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-[#7C3AED]/[0.05] blur-[180px] -mr-96 -mt-96 animate-pulse pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-emerald-500/[0.04] blur-[140px] -ml-48 -mb-48 pointer-events-none" />
    <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-indigo-500/[0.03] blur-[120px] -translate-y-1/2 pointer-events-none" />
    {/* Refraction Surface */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.03),transparent)] pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
)

const GlassCard = ({ children, className, glowColor }) => (
  <div className={cn(
    "relative bg-white/[0.02] backdrop-blur-[32px] border border-white/10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500",
    className
  )}>
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20" />
    {glowColor && <div className={cn("absolute -top-24 -right-24 w-48 h-48 blur-3xl opacity-10 pointer-events-none", glowColor)} />}
    <div className="relative z-10">{children}</div>
  </div>
)

// â”€â”€ SHARED COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SummaryTiles = ({ stats }) => (
  <div className="px-5 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
    {[
      { label: 'Total Task', value: stats.total, color: 'text-white' },
      { label: 'Selesai', value: stats.selesai, color: 'text-emerald-400', trend: stats.complianceTrend },
      { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
      { label: 'Terlambat', value: stats.terlambat, color: 'text-rose-400' },
    ].map((tile, idx) => (
      <motion.div
        key={tile.label}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.1, type: 'spring', damping: 20 }}
      >
        <GlassCard className="p-6 border-white/5 bg-white/[0.01] group hover:bg-white/[0.03]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B] group-hover:text-[#A78BFA] transition-colors">{tile.label}</span>
            {tile.trend !== undefined && (
              <span className={cn("text-[10px] font-black tracking-widest", tile.trend >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {tile.trend >= 0 ? 'â†‘' : 'â†“'} {Math.abs(tile.trend).toFixed(0)}%
              </span>
            )}
          </div>
          <div className={cn("text-3xl font-display font-black tracking-tighter tabular-nums", tile.color)}>{tile.value}</div>
        </GlassCard>
      </motion.div>
    ))}
  </div>
)

const WeekOrbit = ({ selectedDate, onSelect, monthTasks }) => {
  const navigateWeek = (offset) => onSelect(addWeeks(selectedDate, offset))
  const days = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end: addDays(start, 6) })
  }, [selectedDate])

  return (
    <GlassCard className="p-4 mb-6 rounded-[32px] bg-white/[0.02] border-white/5">
      <div className="flex items-center gap-2">
        <button onClick={() => navigateWeek(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-500 hover:text-white shrink-0"><ChevronLeft size={16} /></button>
        <div className="flex-1 flex gap-1 items-stretch">
          {days.map((day) => {
            const active = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayHasTask = monthTasks?.some(t => t.due_date === dateStr)
            
            return (
              <button 
                key={day.toISOString()} 
                onClick={() => onSelect(day)}
                className={cn(
                  "flex-1 max-h-[64px] flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-300 relative group",
                  active ? "bg-[#7C3AED] text-white shadow-lg" : "text-slate-500 hover:bg-white/5",
                  !active && isToday ? "border border-[#7C3AED]/40" : ""
                )}
              >
                <span className={cn("text-[10px] font-bold uppercase tracking-tighter mb-0.5", active ? "text-white/80" : "text-[#4B6478]")}>{format(day, 'EEEEEE', { locale: idLocale })}</span>
                <span className="text-lg font-bold leading-none">{format(day, 'd')}</span>
                {dayHasTask && !active && <div className="absolute bottom-1.5 w-1 h-1 bg-purple-500 rounded-full" />}
              </button>
            )
          })}
        </div>
        <button onClick={() => navigateWeek(1)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-500 hover:text-white shrink-0"><ChevronRight size={16} /></button>
      </div>
    </GlassCard>
  )
}

const CustomCalendar = ({ currentMonth, selectedDate, onMonthChange, onDateSelect, monthTasks }) => {
  const grid = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const getDots = (date) => {
    const dStr = format(date, 'yyyy-MM-dd')
    const tks = monthTasks?.filter(t => t.due_date === dStr) || []
    return {
      hasDone: tks.some(t => t.status === 'selesai'),
      hasPending: tks.some(t => t.status === 'pending' || t.status === 'in_progress'),
      hasOverdue: tks.some(t => t.status === 'terlambat')
    }
  }

  return (
    <div className="w-full mx-auto max-w-fit">
      {/* Header */}
      <div className="flex items-center justify-center gap-8 mb-8">
        <button onClick={() => onMonthChange(subDays(startOfMonth(currentMonth), 1))} className="text-slate-500 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
        <span className="font-display text-sm font-black uppercase tracking-[0.4em] text-white text-center min-w-[140px]">{format(currentMonth, 'MMMM yyyy', { locale: idLocale })}</span>
        <button onClick={() => onMonthChange(addDays(endOfMonth(currentMonth), 1))} className="text-slate-500 hover:text-white transition-colors"><ChevronRight size={20} /></button>
      </div>

      {/* Grid Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
          <div key={d} className="w-10 h-8 flex items-center justify-center text-[10px] font-black text-[#4B6478] uppercase tracking-widest">{d}</div>
        ))}
      </div>

      {/* Grid Dates */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = isSameDay(day, selectedDate)
          const isToday = isSameDay(day, new Date())
          const dots = getDots(day)

          return (
            <button
              key={day.toISOString()}
              disabled={!isCurrentMonth}
              onClick={() => onDateSelect(day)}
              className={cn(
                "w-10 h-10 rounded-xl flex flex-col items-center justify-center relative transition-all group",
                !isCurrentMonth ? "opacity-10 cursor-default" : "hover:bg-white/5",
                isSelected ? "bg-[#7C3AED] text-white shadow-lg" : "text-white",
                !isSelected && isToday ? "ring-1 ring-[#7C3AED]/40" : ""
              )}
            >
              <span className={cn("text-xs font-bold", !isCurrentMonth && "text-transparent")}>{format(day, 'd')}</span>
              {isCurrentMonth && (
                <div className="flex gap-0.5 mt-1 h-1 items-center justify-center">
                   {dots.hasDone && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
                   {dots.hasPending && <div className="w-1 h-1 rounded-full bg-orange-400" />}
                   {dots.hasOverdue && <div className="w-1 h-1 rounded-full bg-rose-500" />}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// â”€â”€ MAIN COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function SapiDailyTask() {
  const { profile } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const p = usePeternakPermissions()
  const isStaffView = p.isStaff && !p.isOwner && !p.isManajer // Explicit staff only view
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tab, setTab] = useState(isStaffView ? 'semua' : 'pending') // Staff shows all sorted by pending, Owner shows pending by default
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [completeSheetOpen, setCompleteSheetOpen] = useState(false)
  const [adHocSheetOpen, setAdHocSheetOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [incidentSheetOpen, setIncidentSheetOpen] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const listRef = React.useRef(null)

  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
  const { data: monthTasks = [], isLoading } = usePeternakTaskInstances({ 
    due_date_from: monthStart, 
    due_date_to: monthEnd,
    workerProfileId: isStaffView ? (profile?.profile_id ?? profile?.id) : undefined
  })

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const tasks = useMemo(() => monthTasks.filter(t => t.due_date === selectedDateStr), [monthTasks, selectedDateStr])

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

    // Sorting priority: 
    // 1. In Progress (Active effort)
    // 2. Pending / Overdue (Waiting)
    // 3. Selesai (Completed)
    return [...list].sort((a, b) => {
      const getPriority = (s) => {
        if (s === 'in_progress') return 0
        if (s === 'terlambat') return 1
        if (s === 'pending') return 2
        return 3
      }
      return getPriority(a.status) - getPriority(b.status)
    })
  }, [tasks, tab, searchQuery])

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

  const handleQuickComplete = useCallback(async (task) => {
    if (task.status === 'selesai' || task.status === 'dilewati') return
    
    // Check if task needs specific report data
    const hasReportConfig = !!TASK_REPORT_CONFIG[task.task_type]
    const needsWeightEntry = task.task_type === 'timbang'
    
    if (hasReportConfig || needsWeightEntry) {
      // Force the full sheet for tasks that need data
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
  }, [updateStatus])

  // Animation logic
  React.useLayoutEffect(() => {
    if (listRef.current) {
      const cards = listRef.current.querySelectorAll('.task-card-anim')
      if (cards.length > 0) {
        createTimeline()
          .add({
            targets: cards,
            translateY: [20, 0],
            opacity: [0, 1],
            scale: [0.95, 1],
            duration: 800,
            delay: stagger(60),
            easing: 'spring(1, 80, 10, 0)'
          })
      }
    }
  }, [filteredTasks])

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
      <BrokerPageHeader 
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

      {/* Daily Performance Summary - Shown for All Users */}
      <SummaryTiles stats={stats} />

      <main className={cn("p-5 max-w-[1700px] mx-auto", isDesktop ? "grid grid-cols-[380px_1fr] gap-12 items-start" : "flex flex-col")}>
        {/* Left Column - FIXED (No scroll with page) */}
        <aside className="space-y-8 lg:sticky lg:top-36 mb-8 lg:mb-0">
           <WeekOrbit selectedDate={selectedDate} onSelect={setSelectedDate} monthTasks={monthTasks} />
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
           
           <div className="mt-10 p-8 bg-purple-500/[0.03] rounded-[48px] border border-purple-500/10 backdrop-blur-2xl transition-all hover:bg-purple-500/[0.06]">
              <div className="flex items-center gap-4 mb-4"><div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center"><Info size={20} className="text-[#A78BFA]" /></div><span className="text-xs font-black text-white uppercase tracking-[0.2em]">Operational Insight</span></div>
              <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">Pastikan selalu menyelesaikan tugas harian tepat waktu untuk menjaga performa skor KPI Anda tetap optimal.</p>
           </div>
        </aside>

        {/* Right Column */}
        <section className="space-y-8 min-w-0">
          <CriticalOverdueAlert tasks={tasks} />
          <AnimatePresence mode="wait">
            {!isDesktop ? (
              <motion.div key="mobile" ref={listRef} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                {filteredTasks.length === 0 ? <EmptyState isStaff={isStaffView} /> : (
                  <>
                    {filteredTasks.some(t => t.status === 'in_progress') && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                           <Activity size={14} className="text-blue-400" />
                           <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Sedang Berjalan / Belum Selesai</h2>
                           <div className="h-[1px] flex-1 bg-blue-500/10" />
                        </div>
                        <div className="grid gap-4">
                          {filteredTasks.filter(t => t.status === 'in_progress').map(t => (
                            <div key={t.id} className="task-card-anim">
                              {isStaffView ? (
                                <InteractiveCheckCard task={t} isExpanded={expandedTaskId === t.id} onToggle={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)} onCheck={() => handleQuickComplete(t)} />
                              ) : (
                                <TaskCard task={t} onClick={() => { setSelectedTask(t); setCompleteSheetOpen(true); }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {filteredTasks.some(t => t.status === 'in_progress') && (
                        <div className="flex items-center gap-3 px-2">
                           <ClipboardList size={14} className="text-[#4B6478]" />
                           <h2 className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Daftar Tugas</h2>
                           <div className="h-[1px] flex-1 bg-white/5" />
                        </div>
                      )}
                      <div className="grid gap-4">
                        {filteredTasks.filter(t => t.status !== 'in_progress').map(t => (
                          <div key={t.id} className="task-card-anim">
                            {isStaffView ? (
                              <InteractiveCheckCard task={t} isExpanded={expandedTaskId === t.id} onToggle={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)} onCheck={() => handleQuickComplete(t)} />
                            ) : (
                              <TaskCard task={t} onClick={() => { setSelectedTask(t); setCompleteSheetOpen(true); }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="desktop" ref={listRef} initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', damping: 25 }}>
                {isStaffView ? (
                   <div className="flex flex-col gap-8 max-w-4xl">
                      {filteredTasks.length === 0 ? <EmptyState isStaff={isStaffView} /> : (
                        <>
                          {filteredTasks.some(t => t.status === 'in_progress') && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3 px-2">
                                 <Activity size={14} className="text-blue-400" />
                                 <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Sedang Berjalan / Belum Selesai</h2>
                                 <div className="h-[1px] flex-1 bg-blue-500/10" />
                              </div>
                              {filteredTasks.filter(t => t.status === 'in_progress').map(t => (
                                <div key={t.id} className="task-card-anim">
                                  <InteractiveCheckCard task={t} isExpanded={expandedTaskId === t.id} onToggle={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)} onCheck={() => handleQuickComplete(t)} />
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-4">
                            {filteredTasks.some(t => t.status === 'in_progress') && (
                              <div className="flex items-center gap-3 px-2 pt-4">
                                 <ClipboardList size={14} className="text-[#4B6478]" />
                                 <h2 className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Daftar Tugas</h2>
                                 <div className="h-[1px] flex-1 bg-white/5" />
                              </div>
                            )}
                            {filteredTasks.filter(t => t.status !== 'in_progress').map(t => (
                              <div key={t.id} className="task-card-anim">
                                <InteractiveCheckCard task={t} isExpanded={expandedTaskId === t.id} onToggle={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)} onCheck={() => handleQuickComplete(t)} />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                   </div>
                ) : (
                  <GlassCard className="rounded-2xl overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left">
                      <thead>
                         <tr className="bg-white/5 border-b border-white/10">
                           <th className="px-6 py-3.5 text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em]">Aktivitas</th>
                           <th className="px-6 py-3.5 text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em]">Detail</th>
                           <th className="px-6 py-3.5 text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em]">Waktu</th>
                           <th className="px-6 py-3.5 text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em]">Status</th>
                           <th className="px-6 py-3.5 text-center text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em]">Aksi</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                         {filteredTasks.length === 0 ? (
                           <tr><td colSpan={5} className="py-24 text-center"><div className="flex flex-col items-center gap-4 opacity-30"><LayoutGrid size={36} className="text-white/20" /><span className="text-sm font-black text-[#4B6478] uppercase tracking-[0.5em]">No task records found.</span></div></td></tr>
                         ) : (
                           filteredTasks.map(t => {
                             const cfg = TASK_TYPE_CFG[t.task_type] || TASK_TYPE_CFG.lainnya
                             const st = STATUS_CFG[t.status] || STATUS_CFG.pending
                             const urgency = getUrgencyLabel(t)
                             return (
                               <tr key={t.id} className="group hover:bg-white/[0.02] transition-all duration-200">
                                 <td className="px-6 py-4">
                                   <div className="flex items-center gap-3">
                                     <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 transition-all group-hover:scale-105", cfg.bg, cfg.border, cfg.shadow)}><cfg.icon size={18} className={cfg.color} /></div>
                                     <div className="flex flex-col gap-1 min-w-0">
                                       <span className="font-bold text-white text-sm leading-tight truncate max-w-[280px]">{t.title}</span>
                                       <div className="flex items-center gap-2">
                                         <span className={cn("inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest", cfg.color, cfg.bg, cfg.border)}>{cfg.label}</span>
                                         {urgency && <span className={cn("inline-block px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest", urgency.color)}>{urgency.label}</span>}
                                       </div>
                                     </div>
                                   </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                       <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider"><MapPin size={11} className="text-[#A78BFA]" /> {t.kandang_name || 'Global Farm'}</span>
                                       <span className="text-[11px] font-bold text-[#64748B] flex items-center gap-1.5 uppercase tracking-wider"><UserIcon size={11} /> {t.worker?.full_name || 'Public Task'}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                       <span className="text-base font-display font-black text-white tracking-tighter tabular-nums">{t.due_time?.substring(0, 5) || '--:--'}</span>
                                       <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mt-0.5">WIB</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                   <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border", st.color, st.bg, st.border)}>
                                     <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", st.color.replace('text-', 'bg-'))} /> {st.label}
                                   </div>
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                   {t.status !== 'selesai' && t.status !== 'dilewati' && (
                                     <Button onClick={() => { setSelectedTask(t); setCompleteSheetOpen(true); }} className="bg-white/5 border border-white/10 hover:bg-gradient-to-r hover:from-[#7C3AED] hover:to-[#5B21B6] hover:border-transparent hover:shadow-[0_0_16px_rgba(124,58,237,0.25)] text-slate-300 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl h-8 px-4 active:scale-95 transition-all">Lapor</Button>
                                   )}
                                 </td>
                               </tr>
                             )
                           })
                         )}
                      </tbody>
                    </table>
                  </GlassCard>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* FIXED SHEETS LOGIC (FULL FEATURE RESTORATION) */}
      <CompleteTaskSheet open={completeSheetOpen} onOpenChange={setCompleteSheetOpen} task={selectedTask} isDesktop={isDesktop} showSuccessAnimation={showSuccess} onSuccess={() => { setShowSuccess(true); setTimeout(() => { setShowSuccess(false); setCompleteSheetOpen(false); }, 1800); }} />
      <AdHocTaskSheet open={adHocSheetOpen} onOpenChange={setAdHocSheetOpen} isDesktop={isDesktop} />
      <IncidentReportSheet open={incidentSheetOpen} onOpenChange={setIncidentSheetOpen} isDesktop={isDesktop} />
    </Scene>
  )
}

const TaskCard = ({ task, onClick }) => {
  const cfg = TASK_TYPE_CFG[task.task_type] || TASK_TYPE_CFG.lainnya
  const st = STATUS_CFG[task.status] || STATUS_CFG.pending
  const urgency = getUrgencyLabel(task)
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }} 
      onClick={onClick}
      className="group"
    >
      <div className="relative p-[1px] rounded-[32px] overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]">
        {/* Animated Gradient Border */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <GlassCard className="p-5 border-white/5 bg-[#0C1319]/40 backdrop-blur-3xl rounded-[31px] relative z-10">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className={cn(
                "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:rotate-3 shadow-2xl", 
                cfg.bg, cfg.border, cfg.shadow
              )}>
                <cfg.icon size={22} className={cfg.color} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white tracking-tight leading-tight truncate group-hover:text-purple-300 transition-colors">{task.title}</h3>
                <div className="hidden sm:flex flex-wrap gap-2 mt-1.5 items-center">
                   <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                      <MapPin size={10} className="text-[#64748B]" />
                      <span className="text-[9.5px] font-black text-[#64748B] uppercase tracking-wider">{task.kandang_name || 'Global'}</span>
                   </div>
                   <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                      <Clock size={10} className="text-[#64748B]" />
                      <span className="text-[9.5px] font-black text-[#64748B] uppercase tracking-wider">{task.due_time?.substring(0, 5)} WIB</span>
                   </div>
                </div>
                {urgency && (
                  <div className={cn(
                    "inline-flex items-center gap-1.5 mt-3 px-2 py-0.5 rounded-lg text-[8.5px] font-black border uppercase tracking-[0.15em] shadow-lg", 
                    urgency.color
                  )}>
                    <Sparkles size={10} /> {urgency.label}
                  </div>
                )}
              </div>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-[8.5px] font-black uppercase border tracking-widest whitespace-nowrap shadow-sm", 
              st.color, st.bg, st.border
            )}>
              {st.label}
            </div>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  )
}

function InteractiveCheckCard({ task, onCheck, isExpanded, onToggle }) {
  const cfg = TASK_TYPE_CFG[task.task_type] || TASK_TYPE_CFG.lainnya
  const isSelesai = task.status === 'selesai'
  const urgency = getUrgencyLabel(task)

  const [reportData, setReportData] = useState({})
  const [weighingData, setWeighingData] = useState({ animal_id: '', weight_kg: '', girth_cm: '' })
  
  const updateStatus = useUpdateTaskStatus()
  const addWeight = useAddSapiWeightRecord()
  const linkRecord = useLinkTaskRecord()
  const { data: animals = [] } = useSapiAnimals()
  
  const needsLinkedEntry = task.task_type === 'timbang'
  const reportConfig = TASK_REPORT_CONFIG[task.task_type]
  const hasForm = !!reportConfig || needsLinkedEntry

  useEffect(() => {
    if (task.notes) {
      try {
        const parsed = JSON.parse(task.notes)
        if (parsed._version === '2.0') {
           setReportData(parsed.report || {})
        }
      } catch (e) {}
    }
  }, [task.notes])

  const handleAction = async (e) => {
    e.stopPropagation()

    // Expansion toggle is allowed even for finished tasks so they can see the report
    if (hasForm && !isExpanded) {
      onToggle()
      return
    }

    if (isSelesai) {
      if (isExpanded) onToggle()
      return
    }
    
    // Logic below only for pending tasks
    if (hasForm) {
       if (needsLinkedEntry && (!weighingData.animal_id || !weighingData.weight_kg)) {
         return toast.error('Ops! Sapi dan Berat wajib dipilih ya')
       }
       if (reportConfig) {
         for (const f of reportConfig.fields) {
           if (f.required && (!reportData[f.id] || reportData[f.id].length === 0)) {
             return toast.error(`${f.label} wajib diisi`)
           }
         }
       }
       
       try {
          let linkedId = null
          if (needsLinkedEntry) {
            const animal = animals.find(a => a.id === weighingData.animal_id)
            const record = await addWeight.mutateAsync({ 
              animal_id: weighingData.animal_id, 
              batch_id: animal?.batch_id, 
              entry_date: animal?.entry_date, 
              entry_weight_kg: animal?.entry_weight_kg, 
              weigh_date: format(new Date(), 'yyyy-MM-dd'), 
              weight_kg: parseFloat(weighingData.weight_kg), 
              girth_cm: weighingData.girth_cm ? parseFloat(weighingData.girth_cm) : null, 
              weigh_method: 'timbang_langsung', 
              notes: `Auto: ${task.title}` 
            })
            if (record?.id) linkedId = record.id
          }

          const finalNotes = JSON.stringify({ _version: '2.0', report: reportData, notes: '' })

          await updateStatus.mutateAsync({ id: task.id, status: 'selesai', notes: finalNotes })
          if (linkedId) await linkRecord.mutateAsync({ id: task.id, linked_record_id: linkedId, linked_record_table: 'sapi_weight_records' })
          
          onToggle()
          toast.success('Pekerjaan selesai! Hebat!')
       } catch (err) { console.error(err); toast.error('Gagal menyimpan laporan') }
       return
    }
    
    onCheck()
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "group relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden",
        isSelesai 
          ? "bg-[#06090F] border-emerald-500/20" 
          : isExpanded ? "bg-[#0C1319] border-[#7C3AED]/40 ring-1 ring-[#7C3AED]/20 shadow-xl" : "bg-[#0C1319] border-white/5 hover:border-purple-500/30 hover:bg-[#06090F]"
      )}
    >
      <div className="flex items-stretch min-h-[80px]">
        {/* Action Area (Quick Check / Submit / Unlock) */}
        <button 
          onClick={isSelesai ? handleUnlock : handleAction}
          disabled={(!isSelesai && (updateStatus.isPending || addWeight.isPending))}
          className={cn(
            "w-16 shrink-0 flex flex-col items-center justify-center transition-all relative z-10",
            isSelesai 
              ? "bg-slate-900 text-slate-500 hover:text-emerald-400 border-r border-white/5" 
              : hasForm && isExpanded 
                ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                : "border-r border-white/5 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10"
          )}
        >
          {updateStatus.isPending || addWeight.isPending ? (
             <LoadingSpinner className="w-5 h-5" />
          ) : isSelesai ? (
             <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                <Lock size={18} className="text-emerald-500/50" />
                <span className="text-[7px] font-bold uppercase text-emerald-500/40">Locked</span>
             </div>
          ) : (
            <div className={cn(
              "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all",
              hasForm && isExpanded
                ? "border-purple-500 bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                : "border-current bg-transparent"
            )}>
              {hasForm && isExpanded ? <Save size={18} strokeWidth={3} /> : <CheckCircle2 size={20} strokeWidth={3} />}
            </div>
          )}
        </button>

        {/* Header Content Area */}
        <div 
          onClick={handleAction}
          className="flex-1 p-4 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1.5">
               <span className={cn("text-[9px] font-black uppercase py-0.5 px-1.5 rounded bg-white/5", cfg.color)}>{cfg.label}</span>
               {urgency && (
                 <span className={cn("text-[8.5px] font-black uppercase py-0.5 px-1.5 rounded-sm flex items-center gap-1 bg-white/5", urgency.color)}>
                   <Sparkles size={8} /> {urgency.label}
                 </span>
               )}
            </div>
            <h3 className={cn(
              "text-[13px] font-bold leading-relaxed mb-2.5 line-clamp-2 transition-colors",
              isSelesai ? "text-emerald-500 line-through opacity-70" : "text-white"
            )}>
              {task.title}
            </h3>
            <div className="flex items-center gap-4 text-[#64748B]">
               <span className="text-[10px] font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                  <MapPin size={11} className={isSelesai ? "text-emerald-600" : "text-[#A78BFA]"} /> {task.kandang_name || 'Farm'}
               </span>
               <span className="text-[10px] font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock size={11} className={isSelesai ? "text-emerald-600/50" : "text-white/40"} /> {task.due_time?.substring(0, 5)} WIB
               </span>
            </div>
          </div>

          <div className={cn("pl-4 transition-transform duration-300 text-slate-500", isExpanded && "rotate-90 text-purple-400")}>
             <ChevronRight size={20} />
          </div>
        </div>
      </div>

      {/* Expanded Inline Form Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn("overflow-hidden border-t border-white/5", isSelesai ? "bg-emerald-500/[0.03]" : "bg-black/20")}
          >
            <div className={cn("p-5 pl-[80px] space-y-6", isSelesai && "opacity-90")} onClick={(e) => e.stopPropagation()}>
               {isSelesai && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
                     <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-tight">Laporan Terkirim & Terkunci</span>
                     </div>
                     <button onClick={handleUnlock} className="text-[9px] font-black uppercase text-emerald-500 hover:underline bg-emerald-500/10 px-2 py-1 rounded">Buka Kunci Untuk Edit</button>
                  </div>
               )}
               {needsLinkedEntry && (
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] ml-2">Pilih Sapi *</label>
                        <Select 
                          disabled={isSelesai}
                          value={weighingData.animal_id} 
                          onValueChange={v => {
                            const animal = animals.find(a => a.id === v);
                            setWeighingData(w => ({ 
                                ...w, 
                                animal_id: v,
                                weight_kg: animal?.entry_weight_kg ? animal.entry_weight_kg.toString() : w.weight_kg 
                            }));
                        }}>
                           <SelectTrigger className="h-11 rounded-xl bg-white/5 border border-white/5 px-4 text-[13px] text-white focus:ring-1 focus:ring-purple-500/50">
                              <SelectValue placeholder="Pilih Eartag Sapi..." />
                           </SelectTrigger>
                           <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl max-h-[200px]">
                              {animals.map(a => (
                                 <SelectItem key={a.id} value={a.id} className="rounded-lg text-[13px] focus:bg-purple-500/10 focus:text-purple-300">
                                    {a.eartag_number ? `Eartag: ${a.eartag_number}` : `ID: ${a.id.substring(0,8)}`}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] ml-2">Berat Aktual *</label>
                           <InputNumber 
                              disabled={isSelesai}
                              value={weighingData.weight_kg} 
                              onChange={v => setWeighingData(w => ({ ...w, weight_kg: v }))} 
                              suffix=" kg" placeholder="0.0"
                              className="h-11 rounded-xl bg-white/5 border-white/5 font-display text-[15px] px-4"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] ml-2">Lingkar (Opsional)</label>
                           <InputNumber 
                              disabled={isSelesai}
                              value={weighingData.girth_cm} 
                              onChange={v => setWeighingData(w => ({ ...w, girth_cm: v }))} 
                              suffix=" cm" placeholder="0.0"
                              className="h-11 rounded-xl bg-white/5 border-white/5 font-display text-[15px] px-4"
                           />
                        </div>
                     </div>
                  </div>
               )}

               {reportConfig?.fields.map(f => (
                  <div key={f.id} className="space-y-2">
                     <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] ml-2">{f.label} {f.required && '*'}</label>
                     
                     {f.type === 'number' && (
                        <InputNumber 
                          disabled={isSelesai}
                          value={reportData[f.id] || ''} 
                          onChange={v => setReportData(rd => ({ ...rd, [f.id]: v }))} 
                          suffix={f.suffix} placeholder={f.placeholder}
                          className="h-11 rounded-xl bg-white/5 border border-white/5 font-display text-[15px] px-4 w-full"
                        />
                     )}
                     
                     {f.type === 'text' && (
                        <input 
                          disabled={isSelesai}
                          type="text" value={reportData[f.id] || ''}
                          onChange={e => setReportData(rd => ({ ...rd, [f.id]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="w-full h-11 rounded-xl bg-white/5 border border-white/5 px-4 text-[13px] text-white focus:bg-white/10 outline-none"
                        />
                     )}
                     
                     {f.type === 'select' && (
                        <Select 
                          disabled={isSelesai}
                          value={reportData[f.id]} onValueChange={v => setReportData(rd => ({ ...rd, [f.id]: v }))}>
                           <SelectTrigger className="h-11 rounded-xl bg-white/5 border border-white/5 px-4 text-[13px] text-white">
                              <SelectValue placeholder={f.placeholder} />
                           </SelectTrigger>
                           <SelectContent className="bg-[#0C1319]/95 border-white/10 rounded-xl">
                              {f.options.map(opt => (
                                 <SelectItem key={opt} value={opt} className="rounded-lg text-[13px]">{opt}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     )}

                     {f.type === 'multi-checkbox' && (
                        <div className="flex flex-wrap gap-2">
                           {f.options.map(opt => {
                              const isSelected = reportData[f.id]?.includes(opt)
                              return (
                                 <button 
                                    disabled={isSelesai}
                                    key={opt}
                                    onClick={(e) => {
                                       e.stopPropagation()
                                       const current = reportData[f.id] || []
                                       const next = isSelected ? current.filter(x => x !== opt) : [...current, opt]
                                       setReportData(rd => ({ ...rd, [f.id]: next }))
                                    }}
                                    className={cn(
                                       "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all active:scale-95",
                                       isSelected 
                                          ? "bg-[#7C3AED]/20 border-[#7C3AED]/40 text-purple-300 shadow-[0_0_10px_rgba(124,58,237,0.2)]"
                                          : "bg-white/5 border-white/5 text-[#64748B] hover:bg-white/10"
                                    )}
                                 >
                                    {opt}
                                 </button>
                              )
                           })}
                        </div>
                     )}
                  </div>
               ))}
               
               <div className="pt-2 animate-in fade-in slide-in-from-bottom-2">
                 <p className="text-[10px] font-semibold text-purple-400 flex items-center gap-1.5"><Wand2 size={10} /> Tekan tombol hijau (Kiri) untuk Simpan & Selesaikan</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}



// â”€â”€ FULL LOGIC RESTORATION SHEET: COMPLETE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CompleteTaskSheet({ open, onOpenChange, task, isDesktop, onSuccess, showSuccessAnimation }) {
  const [notes, setNotes] = useState('')
  const [reportData, setReportData] = useState({})
  const [weighingData, setWeighingData] = useState({ animal_id: '', weight_kg: '', girth_cm: '' })
  const updateStatus = useUpdateTaskStatus()
  const addWeight = useAddSapiWeightRecord()
  const linkRecord = useLinkTaskRecord()
  const { data: animals = [] } = useSapiAnimals()

  useEffect(() => { 
    if (open && task) {
      try {
        const parsed = JSON.parse(task.notes || '{}')
        if (parsed._version === '2.0') {
           setReportData(parsed.report || {})
           setNotes(parsed.notes || '')
        } else {
           setNotes(task.notes || '')
           setReportData({})
        }
      } catch (e) {
        setNotes(task.notes || '')
        setReportData({})
      }
      setWeighingData({ animal_id: '', weight_kg: '', girth_cm: '' })
    } else if (!open) {
      setNotes('')
      setReportData({})
      setWeighingData({ animal_id: '', weight_kg: '', girth_cm: '' })
    } 
  }, [open, task])

  if (!task) return null
  const needsLinkedEntry = task.task_type === 'timbang'
  const reportConfig = TASK_REPORT_CONFIG[task.task_type]

  async function handleComplete() {
    try {
      let linkedId = null
      if (needsLinkedEntry) {
        if (!weighingData.animal_id || !weighingData.weight_kg) return toast.error('Data timbangan wajib diisi')
        const animal = animals.find(a => a.id === weighingData.animal_id)
        if (!animal) return toast.error('Sapi tidak ditemukan')
        const record = await addWeight.mutateAsync({ 
          animal_id: weighingData.animal_id, 
          batch_id: animal.batch_id, 
          entry_date: animal.entry_date, 
          entry_weight_kg: animal.entry_weight_kg, 
          weigh_date: format(new Date(), 'yyyy-MM-dd'), 
          weight_kg: parseFloat(weighingData.weight_kg), 
          girth_cm: weighingData.girth_cm ? parseFloat(weighingData.girth_cm) : null, 
          weigh_method: 'timbang_langsung', 
          notes: `Auto: ${task.title}` 
        })
        if (record?.id) linkedId = record.id
      }

      const finalNotes = JSON.stringify({ _version: '2.0', report: reportData, notes: notes.trim() })

      await updateStatus.mutateAsync({ id: task.id, status: 'selesai', notes: finalNotes })
      if (linkedId) await linkRecord.mutateAsync({ id: task.id, linked_record_id: linkedId, linked_record_table: 'sapi_weight_records' })
      onSuccess()
    } catch (err) { console.error(err) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isDesktop ? 'right' : 'bottom'} className={cn("bg-[#0C1319]/98 border-white/5 outline-none p-0 flex flex-col z-[5000]", isDesktop ? "w-[600px] border-l backdrop-blur-2xl" : "rounded-t-[40px] border-t max-h-[95vh] backdrop-blur-xl")}>
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar">
          {showSuccessAnimation ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
               <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                 <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                   <CheckCircle2 size={48} className="text-emerald-400" />
                 </div>
                 <h2 className="text-2xl font-bold text-white tracking-tight">Tugas Selesai!</h2>
               </div>
            </div>
          ) : (
            <>
              <SheetHeader className="text-left space-y-2">
                {!isDesktop && <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4" />}
                <SheetTitle className="font-display font-bold text-4xl text-white tracking-tight">Detail Laporan</SheetTitle>
                <p className="text-sm font-medium text-slate-400">Lengkapi data verifikasi operasional.</p>
              </SheetHeader>

              <div className="space-y-8">
                <div className="p-6 border border-white/5 bg-white/[0.02] rounded-3xl flex items-center gap-5">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", TASK_TYPE_CFG[task.task_type]?.bg)}>
                        {React.createElement(TASK_TYPE_CFG[task.task_type]?.icon || ClipboardList, { size: 24, className: TASK_TYPE_CFG[task.task_type]?.color })}
                      </div>
                      <div>
                        <h4 className="font-bold text-xl text-white line-clamp-2">{task.title}</h4>
                        <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-2">
                           <MapPin size={12} /> {task.kandang_name || 'Global Farm'} • {task.due_time?.substring(0, 5)} WIB
                        </p>
                      </div>
                </div>

                {/* DYNAMIC REPORT FIELDS (PRO MAX) */}
                {(reportConfig || needsLinkedEntry) && (
                   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center gap-4 px-4 text-[#64748B]">
                         <div className="h-[1px] flex-1 bg-white/5" />
                         <span className="text-[9px] font-black uppercase tracking-[0.4em]">Reporting Schema</span>
                         <div className="h-[1px] flex-1 bg-white/5" />
                      </div>
                      <div className="grid grid-cols-1 gap-8">
                         
                         {needsLinkedEntry && (
                            <div className="space-y-6 pt-2 pb-6 border-b border-white/5">
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Pilih Sapi (Identitas) *</label>
                                  <Select value={weighingData.animal_id} onValueChange={v => {
                                      const animal = animals.find(a => a.id === v);
                                      setWeighingData(w => ({ 
                                          ...w, 
                                          animal_id: v,
                                          weight_kg: animal?.entry_weight_kg ? animal.entry_weight_kg.toString() : w.weight_kg 
                                      }));
                                  }}>
                                     <SelectTrigger className="h-16 rounded-[28px] bg-black/40 border border-white/5 px-8 text-white focus:ring-0">
                                        <SelectValue placeholder="Pilih Tag/Eartag Sapi..." />
                                     </SelectTrigger>
                                     <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-3xl max-h-[300px]">
                                        {animals.map(a => (
                                           <SelectItem key={a.id} value={a.id} className="rounded-xl focus:bg-purple-500/10 focus:text-purple-300">
                                              {a.eartag_number ? `Eartag: ${a.eartag_number}` : `ID: ${a.id.substring(0,8)}`} {a.entry_weight_kg ? `(${a.entry_weight_kg} kg awal)` : ''}
                                           </SelectItem>
                                        ))}
                                     </SelectContent>
                                  </Select>
                               </div>
                               
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-4">
                                     <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Berat Aktual *</label>
                                     <InputNumber 
                                        value={weighingData.weight_kg} 
                                        onChange={v => setWeighingData(w => ({ ...w, weight_kg: v }))} 
                                        suffix=" kg"
                                        placeholder="0.0"
                                        className="h-16 rounded-[28px] bg-black/40 border-white/5 font-display text-xl px-8 focus:bg-black/60 transition-all border-none shadow-inner w-full"
                                     />
                                  </div>
                                  <div className="space-y-4">
                                     <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Lingkar Dada</label>
                                     <InputNumber 
                                        value={weighingData.girth_cm} 
                                        onChange={v => setWeighingData(w => ({ ...w, girth_cm: v }))} 
                                        suffix=" cm"
                                        placeholder="0.0"
                                        className="h-16 rounded-[28px] bg-black/40 border-white/5 font-display text-xl px-8 focus:bg-black/60 transition-all border-none shadow-inner w-full"
                                     />
                                  </div>
                               </div>
                            </div>
                         )}

                         {reportConfig?.fields.map(f => (
                            <div key={f.id} className="space-y-4">
                               <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">{f.label} {f.required && '*'}</label>
                               
                               {f.type === 'number' && (
                                  <InputNumber 
                                    value={reportData[f.id] || ''} 
                                    onChange={v => setReportData(rd => ({ ...rd, [f.id]: v }))} 
                                    suffix={f.suffix}
                                    placeholder={f.placeholder}
                                    className="h-16 rounded-[28px] bg-black/40 border-white/5 font-display text-xl px-8 focus:bg-black/60 transition-all border-none shadow-inner"
                                  />
                               )}
                               
                               {f.type === 'text' && (
                                  <input 
                                    type="text"
                                    value={reportData[f.id] || ''}
                                    onChange={e => setReportData(rd => ({ ...rd, [f.id]: e.target.value }))}
                                    placeholder={f.placeholder}
                                    className="w-full h-16 rounded-[28px] bg-black/40 border border-white/5 px-8 text-white focus:bg-black/60 outline-none transition-all shadow-inner"
                                  />
                               )}
                               
                               {f.type === 'select' && (
                                  <Select value={reportData[f.id]} onValueChange={v => setReportData(rd => ({ ...rd, [f.id]: v }))}>
                                     <SelectTrigger className="h-16 rounded-[28px] bg-black/40 border border-white/5 px-8 text-white focus:ring-0">
                                        <SelectValue placeholder={f.placeholder} />
                                     </SelectTrigger>
                                     <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-3xl">
                                        {f.options.map(opt => (
                                           <SelectItem key={opt} value={opt} className="rounded-xl focus:bg-purple-500/10 focus:text-purple-300">
                                              {opt}
                                           </SelectItem>
                                        ))}
                                     </SelectContent>
                                  </Select>
                               )}

                               {f.type === 'multi-checkbox' && (
                                  <div className="flex flex-wrap gap-2.5 px-2">
                                     {f.options.map(opt => {
                                        const isSelected = reportData[f.id]?.includes(opt)
                                        return (
                                           <button 
                                              key={opt}
                                              onClick={() => {
                                                 const current = reportData[f.id] || []
                                                 const next = isSelected 
                                                    ? current.filter(x => x !== opt)
                                                    : [...current, opt]
                                                 setReportData(rd => ({ ...rd, [f.id]: next }))
                                              }}
                                              className={cn(
                                                 "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95",
                                                 isSelected 
                                                    ? "bg-[#7C3AED]/20 border-[#7C3AED]/40 text-purple-300 shadow-[0_0_20px_rgba(124,58,237,0.2)] scale-105"
                                                    : "bg-white/5 border-white/5 text-[#64748B] hover:bg-white/10"
                                              )}
                                           >
                                              {opt}
                                           </button>
                                        )
                                     })}
                                  </div>
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {needsLinkedEntry && (
                  <div className="space-y-8 p-10 border border-[#7C3AED]/20 bg-[#7C3AED]/5 rounded-[48px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#7C3AED]/10 blur-3xl pointer-events-none group-hover:bg-[#7C3AED]/20 transition-colors" />
                    <div className="flex items-center gap-4 mb-2"><div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/20 flex items-center justify-center"><Scale size={20} className="text-[#A78BFA]" /></div><h4 className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Precision Records</h4></div>
                    <div className="space-y-6">
                      <div className="space-y-4"><label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-3">Animal Ear Tag *</label><select value={weighingData.animal_id} onChange={e => setWeighingData(w => ({ ...w, animal_id: e.target.value }))} className="w-full h-16 bg-black/60 border border-white/5 rounded-3xl px-8 text-sm text-white focus:border-[#7C3AED]/50 outline-none shadow-2xl transition-all"><option value="">-- Identifikasi Sapi --</option>{animals.filter(a => a.status === 'active').map(a => (<option key={a.id} value={a.id}>{a.ear_tag} — {a.breed}</option>))}</select></div>
                      <div className="grid grid-cols-2 gap-8"><div className="space-y-4"><label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-3">Weight (KG) *</label><InputNumber value={weighingData.weight_kg} onChange={v => setWeighingData(w => ({ ...w, weight_kg: v }))} suffix="KG" placeholder="0.0" className="h-16 rounded-3xl bg-black/60 border-white/5 font-display text-xl" /></div><div className="space-y-4"><label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-3">Girth (CM)</label><InputNumber value={weighingData.girth_cm} onChange={v => setWeighingData(w => ({ ...w, girth_cm: v }))} suffix="CM" placeholder="OPT" className="h-16 rounded-3xl bg-black/60 border-white/5 font-display text-xl" /></div></div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                   <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Observation Notes</label>
                   <textarea 
                     value={notes} 
                     onChange={e => setNotes(e.target.value)} 
                     placeholder="Tuliskan detail temuan atau kendala lapangan di sini..." 
                     className="w-full bg-black/30 border border-white/5 rounded-[40px] p-8 text-sm text-white focus:border-[#7C3AED]/50 outline-none min-h-[180px] resize-none shadow-2xl transition-all hover:bg-black/40" 
                   />
                </div>
              </div>
            </>
          )}
        </div>
        {!showSuccessAnimation && (
          <div className="p-8 border-t border-white/5 bg-[#0C1319] shrink-0 flex items-center gap-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all border border-transparent px-8">
              Batal
            </Button>
            <Button onClick={handleComplete} disabled={updateStatus.isPending} className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 border-none shadow-[0_0_20px_rgba(16,185,129,0.3)] text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
              {updateStatus.isPending ? 'Menyimpan...' : 'Selesaikan Tugas'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function AdHocTaskSheet({ open, onOpenChange, isDesktop }) {
  const { data: batches = [] } = useSapiBatches()
  const { data: team = [] } = useAssignableMembers()
  const createTask = useCreateTaskInstance()
  const [form, setForm] = useState({ title: '', task_type: 'lainnya', kandang_name: '', assigned_profile_id: '', due_date: format(new Date(), 'yyyy-MM-dd'), due_time: format(new Date(), 'HH:mm:ss'), description: '', repetition: 'sekali' })
  
  const kandangs = useMemo(() => [...new Set(batches.map(b => b.kandang_name).filter(Boolean))], [batches])
  const handleSave = () => {
    if (!form.title) return toast.error('Judul tugas wajib diisi')
    
    let payloads = []
    const basePayload = { 
      title: form.title, 
      task_type: form.task_type, 
      kandang_name: form.kandang_name === 'none' ? null : form.kandang_name, 
      assigned_profile_id: form.assigned_profile_id === 'none' ? null : form.assigned_profile_id,
      due_time: form.due_time,
      description: form.description 
    }

    const startDate = parseISO(form.due_date)
    let endDate = startDate

    if (form.repetition === 'mingguan') {
      endDate = endOfWeek(startDate, { weekStartsOn: 1 })
    } else if (form.repetition === 'bulanan') {
      endDate = endOfMonth(startDate)
    }

    const intervalDays = eachDayOfInterval({ start: startDate, end: endDate })
    
    for (const day of intervalDays) {
        payloads.push({
            ...basePayload,
            due_date: format(day, 'yyyy-MM-dd')
        })
    }

    createTask.mutate(payloads.length === 1 ? payloads[0] : payloads, { onSuccess: () => { 
      onOpenChange(false); 
      setForm({ title: '', task_type: 'lainnya', kandang_name: '', assigned_profile_id: '', due_date: format(new Date(), 'yyyy-MM-dd'), due_time: format(new Date(), 'HH:mm:ss'), description: '', repetition: 'sekali' }); 
    }})
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isDesktop ? 'right' : 'bottom'} className={cn("bg-[#06090F]/95 border-white/5 outline-none p-0 flex flex-col", isDesktop ? "w-[480px] border-l backdrop-blur-xl" : "rounded-t-3xl border-t max-h-[90vh] backdrop-blur-xl")}>
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
          <SheetHeader className="text-left space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30 mb-2">
              <Plus size={20} className="text-[#A78BFA]" />
            </div>
            <SheetTitle className="font-display font-black text-2xl text-white tracking-tight">Buka Tugas Baru</SheetTitle>
            <SheetDescription className="text-sm text-[#4B6478]">
              Buat penugasan operasional kandang baru.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8]">Judul Tugas <span className="text-red-400">*</span></label>
              <input 
                value={form.title} 
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                placeholder="Contoh: Pembersihan Palung Unit A" 
                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm font-medium text-white focus:bg-white/10 focus:border-[#7C3AED]/50 outline-none transition-all placeholder:text-white/20" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#94A3B8]">Tipe Tugas</label>
                  <Select value={form.task_type} onValueChange={v => setForm(f => ({ ...f, task_type: v }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 px-4 text-sm text-white">
                      <SelectValue placeholder="Pilih Jenis" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl">
                      {Object.entries(TASK_TYPE_CFG).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="rounded-lg">{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#94A3B8]">Area Kandang</label>
                  <Select value={form.kandang_name} onValueChange={v => setForm(f => ({ ...f, kandang_name: v }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 px-4 text-sm text-white">
                      <SelectValue placeholder="Semua Unit" />
                    </SelectTrigger>
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
                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 px-4 text-sm text-white">
                  <SelectValue placeholder="Biarkan kosong untuk Auto-Assign nanti" />
                </SelectTrigger>
                <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl max-h-[300px]">
                  <SelectItem value="none" className="rounded-lg text-white/50 italic">Jangan assign sekarang</SelectItem>
                  {team.map(m => <SelectItem key={m.id} value={m.id} className="rounded-lg">{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#94A3B8]">Tanggal Mulai</label>
                  <DatePicker 
                    value={form.due_date} 
                    onChange={d => setForm(f => ({ ...f, due_date: d }))} 
                    className="h-12 rounded-xl bg-white/5 border-white/10 flex items-center px-4 w-full text-sm" 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#94A3B8]">Waktu Eksekusi</label>
                  <input 
                    type="time" 
                    step="1"
                    value={form.due_time} 
                    onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))} 
                    className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white focus:bg-white/10 focus:border-[#7C3AED]/50 outline-none transition-all" 
                  />
               </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8]">Pengulangan Tugas</label>
              <Select value={form.repetition} onValueChange={v => setForm(f => ({ ...f, repetition: v }))}>
                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 px-4 text-sm text-white">
                  <SelectValue placeholder="Sekali Saja" />
                </SelectTrigger>
                <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl">
                  <SelectItem value="sekali" className="rounded-lg">Sekali Saja</SelectItem>
                  <SelectItem value="mingguan" className="rounded-lg">Hasilkan untuk 1 Minggu (7 Tugas)</SelectItem>
                  <SelectItem value="bulanan" className="rounded-lg">Hasilkan untuk 1 Bulan (30 Tugas)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-[#4B6478] px-1 mt-1">Sistem akan secara otomatis membuat tugas-tugas terpisah untuk hari-hari selanjutnya.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8]">Catatan / Instruksi</label>
              <textarea 
                value={form.description} 
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                placeholder="Instruksi spesifik atau keterangan tambahan..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:bg-white/10 focus:border-[#7C3AED]/50 outline-none min-h-[100px] resize-none placeholder:text-white/20" 
              />
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 pt-4 border-t border-white/10 bg-[#06090F]">
          <Button 
            onClick={handleSave} 
            disabled={createTask.isPending} 
            className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
          >
            {createTask.isPending ? 'Menyimpan...' : 'Buat Tugas'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function CriticalOverdueAlert({ tasks }) {
  const criticals = tasks.filter(t => t.status === 'terlambat' && (t.task_type === 'vaksinasi' || t.task_type === 'timbang'))
  if (criticals.length === 0) return null
  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="mb-10 p-10 rounded-[56px] border border-rose-500/20 bg-rose-500/[0.03] backdrop-blur-3xl flex items-start gap-8 relative overflow-hidden group shadow-2xl shadow-rose-900/20">
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/[0.04] blur-[100px] -mr-40 -mt-40 pointer-events-none" />
      <div className="w-16 h-16 rounded-[28px] bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(244,63,94,0.3)]"><AlertTriangle size={32} className="text-rose-400" /></div>
      <div className="flex-1">
        <p className="text-[11px] font-black text-rose-400 uppercase tracking-[0.6em] mb-3 font-display">System Overdue Alert</p>
        <p className="text-2xl font-black text-white leading-tight tracking-tight">Menunggu Tindakan: {criticals.length} Tugas Medis Terhambat.</p>
        <div className="flex flex-wrap gap-2 mt-4">{criticals.map(t => <span key={t.id} className="text-[11px] font-black text-rose-400/80 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-xl uppercase tracking-widest">{t.title}</span>)}</div>
      </div>
    </motion.div>
  )
}

function SuccessAnimation() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 px-10 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] animate-pulse" />
        <motion.div 
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.3)] relative z-10"
        >
          <CheckCircle2 size={64} className="text-white" />
        </motion.div>
        
        {/* Elite Particles */}
        <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-emerald-400/30 blur-xl animate-bounce" />
        <div className="absolute -bottom-6 -left-6 w-12 h-12 rounded-full bg-[#7C3AED]/20 blur-2xl" />
      </div>
      
      <h3 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">Status Terverifikasi</h3>
      <p className="text-[#64748B] font-black text-[10px] uppercase tracking-[0.4em] leading-relaxed max-w-xs">
        Data operasional telah dienkripsi dan sinkronisasi ke cloud server berhasil.
      </p>
      
      <div className="mt-12 flex items-center gap-3">
         <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
         <div className="h-[1px] w-24 bg-gradient-to-r from-emerald-400/50 to-transparent" />
         <span className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.3em]">SECURE LINK ACTIVE</span>
      </div>
    </div>
  )
}


function EmptyState({ isStaff }) {
  return (
    <div className="py-32 px-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
       <div className="relative mb-12 group">
          <div className="absolute inset-0 bg-purple-500/10 blur-[100px] group-hover:bg-purple-500/20 transition-colors" />
          <div className="w-24 h-24 rounded-[36px] bg-white/[0.03] border border-white/5 flex items-center justify-center relative z-10 shadow-2xl">
             <Wand2 size={40} className="text-white/10 group-hover:text-purple-400/40 transition-all duration-700 group-hover:rotate-12" />
          </div>
       </div>
       
       <h3 className="text-2xl font-black text-white tracking-tight mb-4">
          {isStaff ? 'Sistem Teroptimal' : 'Operational Status: Clear'}
       </h3>
       
       <p className="text-sm text-[#64748B] max-w-[280px] mx-auto font-black uppercase tracking-widest opacity-60 leading-relaxed">
          {isStaff 
            ? 'Seluruh tugas operasional telah diversifikasi ke cloud server.' 
            : 'Belum ada tugas terjadwal untuk unit operasional ini.'}
       </p>
       
       <div className="mt-12 flex items-center gap-3">
          <div className="w-10 h-[1px] bg-white/5" />
          <span className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.5em]">TernakOS Elite</span>
          <div className="w-10 h-[1px] bg-white/5" />
       </div>
    </div>
  )
}

function IncidentReportSheet({ open, onOpenChange, isDesktop }) {
  const { data: batches = [] } = useSapiActiveBatches()
  const addLog = useAddSapiHealthLog()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ batch_id: '', animal_id: '', symptoms: '', notes: '', log_date: new Date().toISOString().split('T')[0] })

  useEffect(() => {
    if (batches.length > 0 && !form.batch_id) { setForm(f => ({ ...f, batch_id: batches[0].id })) }
  }, [batches, form.batch_id])

  async function handleSubmit() {
    if (!form.batch_id || !form.symptoms) return toast.error('Batch dan Gejala wajib diisi')
    setIsSubmitting(true)
    try {
      await addLog.mutateAsync({ ...form, log_type: 'medis', diagnosis: 'Ambigu (Menunggu Observasi)', treatment: 'Observasi Terpadu' })
      toast.success('Emergent report submitted successfully!', { icon: <Activity size={16} /> })
      onOpenChange(false)
      setForm(f => ({ ...f, symptoms: '', notes: '', animal_id: '' }))
    } catch (err) { toast.error('Transmission failed') } finally { setIsSubmitting(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isDesktop ? 'right' : 'bottom'} className={cn("bg-[#0C1319]/98 border-white/10 outline-none p-0 flex flex-col z-[6000]", isDesktop ? "w-[540px] border-l backdrop-blur-xl" : "rounded-t-[64px] border-t max-h-[95vh] backdrop-blur-3xl")}>
        <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
          <SheetHeader className="text-left space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[22px] bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                <AlertTriangle size={24} className="text-rose-400" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-rose-500/60">Emergent Signal</span>
            </div>
            <SheetTitle className="text-5xl font-black text-white tracking-tighter">Lapor Masalah</SheetTitle>
          </SheetHeader>

          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Select Target Unit *</label>
              <select 
                value={form.batch_id} 
                onChange={e => setForm(f => ({ ...f, batch_id: e.target.value }))}
                className="w-full h-18 bg-black/40 border border-white/5 rounded-[32px] px-10 text-lg text-white focus:bg-black/60 outline-none transition-all shadow-inner tabular-nums"
              >
                {batches.map(b => <option key={b.id} value={b.id} className="bg-[#0C1319]">{b.batch_code} — {b.kandang_name}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Identitas Sapi (Opsional)</label>
              <input 
                value={form.animal_id} 
                onChange={e => setForm(f => ({ ...f, animal_id: e.target.value }))}
                placeholder="Contoh: SAPI-01 / Tag Biru"
                className="w-full h-18 bg-black/40 border border-white/5 rounded-[32px] px-10 text-lg text-white focus:bg-black/60 outline-none"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Symptom Details *</label>
              <textarea 
                value={form.symptoms} 
                onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
                placeholder="Jelaskan kondisi sapi (pincang, lemas, nafsu makan turun, dll)..."
                className="w-full bg-black/40 border border-white/5 rounded-[40px] p-8 text-lg text-white focus:border-rose-500/50 outline-none min-h-[160px] resize-none"
              />
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-rose-500/10 bg-[#0C1319]">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full h-14 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-2xl shadow-[0_10px_30px_rgba(225,29,72,0.3)] transition-all outline-none border-none"
          >
            {isSubmitting ? 'Mengirim...' : 'Laporkan Kondisi'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}