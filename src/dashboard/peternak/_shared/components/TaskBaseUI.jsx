import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Info, LayoutGrid, AlertTriangle 
} from 'lucide-react'
import { 
  format, startOfMonth, endOfMonth, isSameDay, 
  addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, addWeeks
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export const Scene = ({ children }) => (
  <div className="relative min-h-screen bg-[#06090F] overflow-hidden selection:bg-purple-500/30">
    <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-[#7C3AED]/[0.05] blur-[180px] -mr-96 -mt-96 animate-pulse pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-emerald-500/[0.04] blur-[140px] -ml-48 -mb-48 pointer-events-none" />
    <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-indigo-500/[0.03] blur-[120px] -translate-y-1/2 pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.03),transparent)] pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
)

export const GlassCard = ({ children, className, glowColor }) => (
  <div className={cn(
    "relative bg-white/[0.02] backdrop-blur-[32px] border border-white/10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500",
    className
  )}>
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-20" />
    {glowColor && <div className={cn("absolute -top-24 -right-24 w-48 h-48 blur-3xl opacity-10 pointer-events-none", glowColor)} />}
    <div className="relative z-10">{children}</div>
  </div>
)

export const SummaryTiles = ({ stats }) => (
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
                {tile.trend >= 0 ? '↑' : '↓'} {Math.abs(tile.trend).toFixed(0)}%
              </span>
            )}
          </div>
          <div className={cn("text-3xl font-display font-black tracking-tighter tabular-nums", tile.color)}>{tile.value}</div>
        </GlassCard>
      </motion.div>
    ))}
  </div>
)

export const WeekOrbit = ({ selectedDate, onSelect, monthTasks }) => {
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

export const CustomCalendar = ({ currentMonth, selectedDate, onMonthChange, onDateSelect, monthTasks }) => {
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
      <div className="flex items-center justify-center gap-8 mb-8">
        <button onClick={() => onMonthChange(subDays(startOfMonth(currentMonth), 1))} className="text-slate-500 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
        <span className="font-display text-sm font-black uppercase tracking-[0.4em] text-white text-center min-w-[140px]">{format(currentMonth, 'MMMM yyyy', { locale: idLocale })}</span>
        <button onClick={() => onMonthChange(addDays(endOfMonth(currentMonth), 1))} className="text-slate-500 hover:text-white transition-colors"><ChevronRight size={20} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
          <div key={d} className="w-10 h-8 flex items-center justify-center text-[10px] font-black text-[#4B6478] uppercase tracking-widest">{d}</div>
        ))}
      </div>
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

export const EmptyState = ({ isStaff }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in-95 duration-700">
    <div className="w-24 h-24 rounded-[40px] bg-white/[0.02] border border-white/10 flex items-center justify-center mb-8 relative group">
      <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <LayoutGrid size={40} className="text-[#4B6478] relative z-10" />
    </div>
    <h3 className="text-xl font-display font-black text-white uppercase tracking-[0.3em] mb-4">Semua Terkendali</h3>
    <p className="text-xs text-[#64748B] font-medium max-w-[300px] leading-relaxed uppercase tracking-widest">
      {isStaff ? 'Anda tidak memiliki tugas untuk tanggal ini. Nikmati waktu istirahat sejenak.' : 'Belum ada agenda tugas yang tercatat untuk hari ini.'}
    </p>
  </div>
)

export const CriticalOverdueAlert = ({ tasks }) => {
  const overdues = tasks.filter(t => t.status === 'terlambat')
  if (overdues.length === 0) return null
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-[32px] bg-rose-500/10 border border-rose-500/20 flex items-center gap-6 mb-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl -mr-16 -mt-16 animate-pulse" />
      <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/20 shrink-0"><AlertTriangle size={24} className="text-rose-400 animate-bounce" /></div>
      <div className="flex-1">
        <h4 className="text-sm font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Perhatian Diperlukan</h4>
        <p className="text-[11px] text-rose-200/60 font-medium leading-relaxed">Terdapat <span className="text-rose-400 font-bold underline decoration-rose-500/30">{overdues.length} tugas</span> yang telah melewati batas waktu (overdue). Segera lakukan tindakan.</p>
      </div>
    </motion.div>
  )
}

export const OperationalInsight = () => (
  <div className="mt-10 p-8 bg-purple-500/[0.03] rounded-[48px] border border-purple-500/10 backdrop-blur-2xl transition-all hover:bg-purple-500/[0.06]">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
        <Info size={20} className="text-[#A78BFA]" />
      </div>
      <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Operational Insight</span>
    </div>
    <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">Pastikan selalu menyelesaikan tugas harian tepat waktu untuk menjaga performa skor KPI Anda tetap optimal.</p>
  </div>
)
