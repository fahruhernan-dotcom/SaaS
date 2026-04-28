/**
 * UniversalDailyTask — Shared component for ALL peternak livestock types.
 *
 * Accepts `livestockType` prop (e.g. 'sapi_penggemukan', 'broiler', 'kambing_penggemukan')
 * and dynamically loads config from LIVESTOCK_TASK_REGISTRY.
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Outlet, useOutletContext, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, CheckCircle2, Clock, AlertCircle, Calendar as CalendarIcon, 
  ChevronRight, Scale, Trash2, 
  Activity, ClipboardList, MoreHorizontal,
  User as UserIcon, MapPin, ChevronLeft, Search,
  AlertTriangle, LayoutGrid,
  Heart, Sparkles, Wand2, Info, Lock, Save
} from 'lucide-react'
import { 
  usePeternakTaskInstances,
  useTodayTaskInstances,
  useInProgressTimbangCarryover,
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
  useAddSapiHealthLog,
  useAddSapiFeedLog
} from '@/lib/hooks/useSapiPenggemukanData'
import {
  useDombaAnimals,
  useAddDombaWeightRecord,
  useDombaBatches,
  useDombaActiveBatches,
  useAddDombaHealthLog,
  useAddDombaFeedLog
} from '@/lib/hooks/useDombaPenggemukanData'
import {
  useKambingAnimals,
  useAddKambingWeightRecord,
  useKambingBatches,
  useKambingActiveBatches,
  useAddKambingHealthLog,
  useAddKambingFeedLog
} from '@/lib/hooks/useKambingPenggemukanData'
import {
  useDombaBreedingAnimals,
  useAddDombaBreedingWeight,
  useAddDombaBreedingHealthLog
} from '@/lib/hooks/useDombaBreedingData'
import {
  useKambingBreedingAnimals,
  useAddKambingBreedingWeight,
  useAddKambingBreedingHealthLog
} from '@/lib/hooks/useKambingBreedingData'
import usePeternakPermissions from '@/lib/hooks/usePeternakPermissions'
import { useAuth, getPeternakBasePath } from '@/lib/hooks/useAuth'
import { TRIGGERED_MEDICAL_INTERVENTION } from '@/lib/constants/taskTemplates/dombaTaskTemplates'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/DatePicker'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { InputNumber } from '@/components/ui/InputNumber'
import AnimatedCheckmark from '@/components/ui/AnimatedCheckmark'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { TaskHeader } from './TaskHeader'
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
import { getLivestockConfig, CONTAINER_PRESETS } from '@/lib/constants/taskTemplates'

/**
 * Returns a deterministic sample of animals based on a seed.
 * Used for 14-day sampling in intensive programs.
 */
function getRandomizedSample(animals, seed, percentage = 0.1) {
  if (!animals.length) return [];
  const count = Math.max(1, Math.ceil(animals.length * percentage));
  
  // Deterministic shuffle using task seed
  const seededRandom = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return () => {
      hash = (hash * 16807) % 2147483647;
      return (hash - 1) / 2147483646;
    };
  };

  const rng = seededRandom(seed);
  const shuffled = [...animals].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

// ── CONTAINER CALC FIELD ──────────────────────────────────────────────────────
// Renders [Wadah ▼] × [Qty] → auto-fills targetKgField in reportData

function ContainerCalcField({ field, reportData, setReportData, disabled }) {
  const stateKey   = field.id                  // e.g. '_wadah_hijauan'
  const qtyKey     = `${field.id}_qty`         // e.g. '_wadah_hijauan_qty'
  const feedType   = field.feedType            // 'hijauan' | 'konsentrat'
  const targetField = field.targetKgField      // 'hijauan_kg' | 'konsentrat_kg'

  const selectedPreset = reportData[stateKey] || ''
  const qty = parseFloat(reportData[qtyKey]) || 1

  function handlePresetChange(label) {
    const preset = CONTAINER_PRESETS.find(p => p.label === label)
    const newData = { ...reportData, [stateKey]: label }
    if (preset) {
      newData[targetField] = String((preset[feedType] * qty).toFixed(1))
    }
    setReportData(newData)
  }

  function handleQtyChange(val) {
    const newData = { ...reportData, [qtyKey]: val }
    const n = parseFloat(val)
    const preset = CONTAINER_PRESETS.find(p => p.label === selectedPreset)
    
    if (preset) {
      if (!isNaN(n)) {
        newData[targetField] = String((preset[feedType] * n).toFixed(1))
      } else {
        newData[targetField] = "0"
      }
    }
    setReportData(newData)
  }

  const preset = CONTAINER_PRESETS.find(p => p.label === selectedPreset)
  const kgPerUnit = preset ? preset[feedType] : null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select disabled={disabled} value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-14 rounded-2xl bg-black/40 border-white/5 text-sm text-white focus:ring-0">
              <SelectValue placeholder="Pilih jenis wadah..." />
            </SelectTrigger>
            <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-2xl">
              {CONTAINER_PRESETS.map(p => (
                <SelectItem key={p.label} value={p.label} className="rounded-xl focus:bg-purple-500/10 focus:text-purple-300 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-sm">{p.label}</span>
                    <span className="text-[10px] text-[#4B6478] uppercase tracking-wider">{feedType === 'hijauan' ? `±${p.hijauan} kg / unit` : `±${p.konsentrat} kg / unit`}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPreset && (
          <div className="w-24 shrink-0">
            <div className="relative group">
              <input
                type="number"
                min="1"
                disabled={disabled}
                value={reportData[qtyKey] === undefined ? '1' : reportData[qtyKey]}
                onChange={e => handleQtyChange(e.target.value)}
                className="w-full h-14 rounded-2xl bg-black/40 border border-white/5 text-center text-lg font-display font-black text-white focus:bg-black/60 focus:border-purple-500/40 outline-none transition-all disabled:opacity-40"
              />
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#0C1319] px-2 text-[8px] font-black text-[#4B6478] uppercase tracking-widest whitespace-nowrap">Jumlah</span>
            </div>
          </div>
        )}
      </div>

      {selectedPreset && (
        <div className="flex items-center justify-between px-6 py-4 rounded-[24px] bg-emerald-500/5 border border-emerald-500/10 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest leading-none mb-1">Estimasi Input</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white opacity-40 font-medium">{qty} × {kgPerUnit} kg</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <Scale size={14} className="opacity-60" />
            <span className="text-xl font-display font-black tracking-tight">
              {kgPerUnit ? `${(kgPerUnit * qty).toFixed(1)} kg` : '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── UNIVERSAL STATUS CONFIG (shared across all livestock) ─────────────────────

const LIVESTOCK_HOOKS_MAP = {
  sapi_penggemukan: {
    useAnimals: useSapiAnimals,
    useAddWeight: useAddSapiWeightRecord,
    useBatches: useSapiBatches,
    useActiveBatches: useSapiActiveBatches,
    useAddHealth: useAddSapiHealthLog,
    useAddFeed: useAddSapiFeedLog,
    weightTable: 'sapi_weight_records'
  },
  domba_penggemukan: {
    useAnimals: useDombaAnimals,
    useAddWeight: useAddDombaWeightRecord,
    useBatches: useDombaBatches,
    useActiveBatches: useDombaActiveBatches,
    useAddHealth: useAddDombaHealthLog,
    useAddFeed: useAddDombaFeedLog,
    weightTable: 'domba_weight_records'
  },
  kambing_penggemukan: {
    useAnimals: useKambingAnimals,
    useAddWeight: useAddKambingWeightRecord,
    useBatches: useKambingBatches,
    useActiveBatches: useKambingActiveBatches,
    useAddHealth: useAddKambingHealthLog,
    useAddFeed: useAddKambingFeedLog,
    weightTable: 'kambing_weight_records'
  },
  domba_breeding: {
    useAnimals: useDombaBreedingAnimals,
    useAddWeight: useAddDombaBreedingWeight,
    useBatches: () => ({ data: [] }),
    useActiveBatches: () => ({ data: [] }),
    useAddHealth: useAddDombaBreedingHealthLog,
    weightTable: 'domba_breeding_weights'
  },
  kambing_breeding: {
    useAnimals: useKambingBreedingAnimals,
    useAddWeight: useAddKambingBreedingWeight,
    useBatches: () => ({ data: [] }),
    useActiveBatches: () => ({ data: [] }),
    useAddHealth: useAddKambingBreedingHealthLog,
    weightTable: 'kambing_breeding_weights'
  }
}

const STATUS_CFG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-slate-400', border: 'border-white/10', bg: 'bg-white/5' },
  in_progress: { label: 'Berjalan', icon: Activity, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
  selesai: { label: 'Selesai', icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  terlambat: { label: 'Terlambat', icon: AlertCircle, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10' },
  dilewati: { label: 'Dilewati', icon: MoreHorizontal, color: 'text-slate-500', border: 'border-white/10', bg: 'bg-white/5' },
}

// ── HELPERS ─────────────────────────────────────────────────────────────────

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

const getTaskSummarySnippet = (task, reportData, weighingEntries = [], healthEntries = []) => {
  if (task.status !== 'selesai' && task.status !== 'terlambat') return 'Belum dikerjakan'
  
  if (task.task_type === 'pakan') {
    const feedback = reportData.feed_orts_category;
    if (feedback === 'habis') return '👍 Selesai (Habis)';
    if (feedback === 'sedikit') return '🟡 Selesai (Sisa)';
    if (feedback === 'banyak') return '🔴 Selesai (Sisa)';
    return 'Selesai';
  }

  if (task.task_type === 'timbang' && weighingEntries.length > 0) {
    return `${weighingEntries.length} ekor ditimbang`
  }
  
  try {
    const rawNotes = task.notes || ''
    if (!rawNotes.trim().startsWith('{')) {
      return rawNotes.substring(0, 40)
    }

    const parsed = JSON.parse(rawNotes)
    if (parsed._version !== '2.0') return (parsed.notes || '').substring(0, 40)

    const { report = {}, weighing_entries = [], health_entries = [], notes: userNote } = parsed

    // 1. Priority: Multi-animal entries
    if (task.task_type === 'timbang' && weighing_entries.length > 0) {
      return `${weighing_entries.length} ekor ditimbang`
    }
    if ((task.task_type === 'vaksinasi' || task.task_type === 'obat_cacing') && health_entries.length > 0) {
      const first = health_entries[0]
      const medName = first.medicine_name || first.vaccine_name || 'Obat'
      return `${health_entries.length} ekor — ${medName}`
    }

    // 2. Report Fields (Pakan, etc)
    const entries = Object.entries(report)
    if (entries.length > 0) {
      // Pick fields with units/values
      const prioritized = entries.filter(([k]) => k.includes('_kg') || k.includes('_liter') || k.includes('jumlah') || k.includes('suhu'))
      if (prioritized.length > 0) {
        return prioritized.map(([k, v]) => {
          const unit = k.includes('_kg') ? 'kg' : k.includes('_liter') ? 'L' : k.includes('suhu') ? '°C' : ''
          const label = k.replace('_kg', '').replace('_liter', '').replace('_', ' ')
          return `${v}${unit}`
        }).join(', ')
      }
      return entries[0][1] // Fallback to first field value
    }

    // 3. User Notes
    if (userNote) return userNote.substring(0, 40)
    
    return null
  } catch (e) {
    return task.notes?.substring(0, 40)
  }
}

// ── PARSE TASK REPORT (structured extract from task.notes JSON) ───────────────
const parseTaskReport = (task) => {
  const result = {
    completedBy: task.completed_by?.full_name || task.worker?.full_name || null,
    completedAt: task.completed_at ? format(new Date(task.completed_at), 'HH:mm') : null,
    feedOrts: null,      // 'habis' | 'sedikit' | 'banyak'
    weighingCount: 0,
    weighingAvg: null,
    healthCount: 0,
    healthMed: null,
    reportFields: [],    // [{ label, value, unit }]
    userNote: null,
    snippet: null,       // single-line summary string
  }
  if (task.status !== 'selesai' && task.status !== 'terlambat') {
    result.snippet = 'Menunggu laporan'
    return result
  }
  try {
    const raw = task.notes || ''
    if (!raw.trim().startsWith('{')) {
      result.snippet = raw.substring(0, 50) || 'Selesai'
      return result
    }
    const parsed = JSON.parse(raw)
    if (parsed._version !== '2.0') {
      result.snippet = (parsed.notes || 'Selesai').substring(0, 50)
      return result
    }
    const { report = {}, weighing_entries = [], health_entries = [], notes: uNote } = parsed
    result.userNote = uNote || null

    // Feed orts
    if (report.feed_orts_category) result.feedOrts = report.feed_orts_category

    // Weighing
    if (weighing_entries.length > 0) {
      result.weighingCount = weighing_entries.length
      const totalW = weighing_entries.reduce((s, e) => s + (parseFloat(e.weight_kg) || 0), 0)
      result.weighingAvg = totalW > 0 ? (totalW / weighing_entries.length).toFixed(1) : null
    }

    // Health
    if (health_entries.length > 0) {
      result.healthCount = health_entries.length
      result.healthMed = health_entries[0]?.medicine_name || health_entries[0]?.vaccine_name || 'Obat'
    }

    // Report fields
    Object.entries(report).forEach(([k, v]) => {
      if (k === 'feed_orts_category' || k === '_version') return
      const unit = k.includes('_kg') ? 'kg' : k.includes('_liter') ? 'L' : k.includes('suhu') ? '°C' : ''
      const label = k.replace(/_kg|_liter|_cm/g, '').replace(/_/g, ' ')
      result.reportFields.push({ label, value: v, unit })
    })

    // Build snippet
    if (task.task_type === 'pakan' && result.feedOrts) {
      const ortsMap = { habis: '👍 Habis', sedikit: '🟡 Sisa Sedikit', banyak: '🔴 Sisa Banyak' }
      result.snippet = ortsMap[result.feedOrts] || 'Selesai'
    } else if (result.weighingCount > 0) {
      result.snippet = `${result.weighingCount} ekor ditimbang${result.weighingAvg ? ` · avg ${result.weighingAvg}kg` : ''}`
    } else if (result.healthCount > 0) {
      result.snippet = `${result.healthCount} ekor · ${result.healthMed}`
    } else if (result.reportFields.length > 0) {
      result.snippet = result.reportFields.slice(0, 2).map(f => `${f.value}${f.unit}`).join(', ')
    } else if (result.userNote) {
      result.snippet = result.userNote.substring(0, 50)
    } else {
      result.snippet = 'Selesai'
    }
  } catch (e) {
    result.snippet = task.notes?.substring(0, 50) || 'Selesai'
  }
  return result
}

// ── ATMOSPHERIC SCENE ──────────────────────────────────────────────────────────

const Scene = ({ children }) => (
  <div className="relative min-h-screen bg-[#06090F] overflow-hidden selection:bg-purple-500/30">
    <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-[#7C3AED]/[0.05] blur-[180px] -mr-96 -mt-96 animate-pulse pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-emerald-500/[0.04] blur-[140px] -ml-48 -mb-48 pointer-events-none" />
    <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-indigo-500/[0.03] blur-[120px] -translate-y-1/2 pointer-events-none" />
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

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────

const SummaryTiles = ({ stats }) => (
  <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
    {[
      { label: 'Total Task',  value: stats.total,     color: 'text-white',      bg: 'bg-white/[0.03]',       border: 'border-white/[0.07]' },
      { label: 'Selesai',     value: stats.selesai,   color: 'text-emerald-400', bg: 'bg-emerald-500/[0.06]', border: 'border-emerald-500/[0.15]', trend: stats.complianceTrend },
      { label: 'Pending',     value: stats.pending,   color: 'text-amber-400',   bg: 'bg-amber-500/[0.06]',   border: 'border-amber-500/[0.15]' },
      { label: 'Terlambat',   value: stats.terlambat, color: 'text-rose-400',    bg: 'bg-rose-500/[0.06]',    border: 'border-rose-500/[0.15]' },
    ].map((tile, idx) => (
      <motion.div
        key={tile.label}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.08, type: 'spring', damping: 20 }}
      >
        <div className={cn("rounded-2xl p-4 relative overflow-hidden border", tile.bg, tile.border)}>
          {tile.trend !== undefined && (
            <span className={cn(
              "absolute top-2 right-2.5 text-[8px] font-black",
              tile.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'
            )}>
              {tile.trend >= 0 ? '↑' : '↓'}{Math.abs(tile.trend).toFixed(0)}%
            </span>
          )}
          <div className={cn("text-3xl font-display font-black tracking-tighter tabular-nums leading-none mb-1.5", tile.color)}>{tile.value}</div>
          <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#4B6478]">{tile.label}</div>
        </div>
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
    <GlassCard className="p-3 mb-4 rounded-[24px] bg-white/[0.02] border-white/5">
      <div className="flex items-center gap-1.5">
        <button onClick={() => navigateWeek(-1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-500 hover:text-white shrink-0"><ChevronLeft size={14} /></button>
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
                  "flex-1 max-h-[56px] flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-300 relative group",
                  active ? "bg-[#7C3AED] text-white shadow-lg" : "text-slate-500 hover:bg-white/5",
                  !active && isToday ? "border border-[#7C3AED]/40" : ""
                )}
              >
                <span className={cn("text-[9px] font-bold uppercase tracking-tighter mb-0.5", active ? "text-white/80" : "text-[#4B6478]")}>{format(day, 'EEEEEE', { locale: idLocale })}</span>
                <span className="text-base font-bold leading-none">{format(day, 'd')}</span>
                {dayHasTask && !active && <div className="absolute bottom-1 w-1 h-1 bg-purple-500 rounded-full" />}
              </button>
            )
          })}
        </div>
        <button onClick={() => navigateWeek(1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-500 hover:text-white shrink-0"><ChevronRight size={14} /></button>
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

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function UniversalDailyTask({ livestockType = 'sapi_penggemukan' }) {
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
  const [auditRange, setAuditRange] = useState('day') // 'day' | 'week' | 'month'
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
    workerProfileId: isStaffView ? (profile?.profile_id ?? profile?.id) : undefined,
    livestockType,
  })
  const { data: carryoverTasks = [] } = useInProgressTimbangCarryover()

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

    // Grouping & Sorting priority: 
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
    if (p.canEditSettings || isStaffView) {
      setRightAction(
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIncidentSheetOpen(true)}
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-full h-10 px-4 flex items-center gap-1.5 shadow-xl shadow-rose-900/20 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <AlertTriangle size={15} /> Lapor
          </Button>
          {!isDesktop && p.canEditSettings && (
            <Button size="icon" onClick={() => setAdHocSheetOpen(true)} className="w-10 h-10 rounded-[18px] bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white shadow-2xl shadow-purple-900/40"><Plus size={20} /></Button>
          )}
        </div>
      )
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

      {/* Audit Controls — horizontal scroll chips on mobile, full buttons on desktop */}
      <div className="max-w-[1700px] mx-auto mb-4 lg:mb-8 lg:px-5">
        {/* Mobile: compact horizontal scrollable chips */}
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
          {(auditRange !== 'day' || tab !== 'semua') && (
            <button
              onClick={() => { setAuditRange('day'); setTab('semua'); }}
              className="h-9 px-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-[#4B6478] border border-white/[0.06] bg-white/[0.02] shrink-0"
            >
              Reset
            </button>
          )}
        </div>

        {/* Desktop: full-size buttons */}
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
          {(auditRange !== 'day' || tab !== 'semua') && (
            <button
              onClick={() => { setAuditRange('day'); setTab('semua'); }}
              className="ml-auto text-[9px] font-black uppercase tracking-[0.3em] text-[#4B6478] hover:text-white transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      <SummaryTiles stats={stats} />

      <main className={cn("px-4 pb-5 lg:px-5 max-w-[1700px] mx-auto", isDesktop ? "grid grid-cols-[380px_1fr] gap-12 items-start" : "flex flex-col")}>
        <aside className="space-y-4 lg:space-y-8 lg:sticky lg:top-36 mb-4 lg:mb-0">
           {/* Week strip — always visible on all devices */}
           <WeekOrbit selectedDate={selectedDate} onSelect={setSelectedDate} monthTasks={monthTasks} />

           {/* Full calendar + insight — desktop only to save vertical space on mobile */}
           {isDesktop && (
             <>
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
             </>
           )}
        </aside>

        <section className="space-y-8 min-w-0">
          <CriticalOverdueAlert tasks={tasks} TASK_TYPE_CFG={TASK_TYPE_CFG} />
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
                                 <InteractiveCheckCard 
                                  task={t} 
                                  isExpanded={expandedTaskId === t.id} 
                                  onToggle={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)} 
                                  onCheck={() => handleQuickComplete(t)} 
                                  config={config} 
                                  TASK_TYPE_CFG={TASK_TYPE_CFG} 
                                  TASK_REPORT_CONFIG={TASK_REPORT_CONFIG} 
                                  livestockType={livestockType}
                                  updateStatus={updateStatus}
                                  profile={profile}
                                  hooks={hooks}
                                />
                              ) : (
                                <TaskCard 
                                  task={t} 
                                  onClick={() => { setSelectedTask(t); setCompleteSheetOpen(true); }} 
                                  TASK_TYPE_CFG={TASK_TYPE_CFG} 
                                  STATUS_CFG={STATUS_CFG}
                                />
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
                             <InteractiveCheckCard 
                              task={t} 
                              isExpanded={expandedTaskId === t.id} 
                              onToggle={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)} 
                              onCheck={() => handleQuickComplete(t)} 
                              config={config} 
                              TASK_TYPE_CFG={TASK_TYPE_CFG} 
                              TASK_REPORT_CONFIG={TASK_REPORT_CONFIG} 
                              livestockType={livestockType}
                              updateStatus={updateStatus}
                              profile={profile}
                              hooks={hooks}
                            />
                          ) : (
                            <TaskCard 
                              task={t} 
                              onClick={() => { setSelectedTask(t); setCompleteSheetOpen(true); }} 
                              TASK_TYPE_CFG={TASK_TYPE_CFG} 
                              STATUS_CFG={STATUS_CFG}
                            />
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
                                  <InteractiveCheckCard 
                                    task={t} 
                                    isExpanded={expandedTaskId === t.id} 
                                    onToggle={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)} 
                                    onCheck={() => handleQuickComplete(t)} 
                                    config={config} 
                                    TASK_TYPE_CFG={TASK_TYPE_CFG} 
                                    TASK_REPORT_CONFIG={TASK_REPORT_CONFIG} 
                                    livestockType={livestockType}
                                    updateStatus={updateStatus}
                                    profile={profile}
                                    hooks={hooks}
                                  />
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
                                <InteractiveCheckCard 
                                  task={t} 
                                  isExpanded={expandedTaskId === t.id} 
                                  onToggle={() => setExpandedTaskId(expandedTaskId === t.id ? null : t.id)} 
                                  onCheck={() => handleQuickComplete(t)} 
                                  config={config} 
                                  TASK_TYPE_CFG={TASK_TYPE_CFG} 
                                  TASK_REPORT_CONFIG={TASK_REPORT_CONFIG} 
                                  livestockType={livestockType}
                                  updateStatus={updateStatus}
                                  profile={profile}
                                  hooks={hooks}
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                   </div>
                ) : (
                  <GlassCard className="rounded-2xl overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left">
                      <thead>
                         <tr className="bg-white/5 border-b border-white/10">
                           <th className="px-5 py-3.5 text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em]">Aktivitas</th>
                           <th className="px-5 py-3.5 text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em]">Pelapor</th>
                           <th className="px-5 py-3.5 text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em]">Ringkasan</th>
                           <th className="px-5 py-3.5 text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em]">Status</th>
                           <th className="px-5 py-3.5 text-center text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em]">Aksi</th>
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
                             const rpt = parseTaskReport(t)
                             return (
                               <tr key={t.id} className="group hover:bg-white/[0.02] transition-all duration-200 cursor-pointer" onClick={() => { setSelectedTask(t); setCompleteSheetOpen(true); }}>
                                 <td className="px-5 py-4">
                                   <div className="flex items-center gap-3">
                                     <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 transition-all group-hover:scale-105", cfg.bg, cfg.border, cfg.shadow)}><cfg.icon size={18} className={cfg.color} /></div>
                                     <div className="flex flex-col gap-1 min-w-0">
                                       <span className="font-bold text-white text-sm leading-tight truncate max-w-[280px]">{t.title}</span>
                                       <div className="flex items-center gap-1.5">
                                         <span className={cn("inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest", cfg.color, cfg.bg, cfg.border)}>{cfg.label}</span>
                                         <span className="text-[10px] font-bold text-[#64748B] flex items-center gap-1"><MapPin size={9} className="text-[#A78BFA]" />{t.kandang_name || 'Global'}</span>
                                         {urgency && <span className={cn("inline-block px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest", urgency.color)}>{urgency.label}</span>}
                                       </div>
                                     </div>
                                   </div>
                                 </td>
                                 <td className="px-5 py-4">
                                    {rpt.completedBy ? (
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={11} /> {rpt.completedBy}</span>
                                        <span className="text-[10px] text-[#64748B] tabular-nums">{rpt.completedAt || t.due_time?.substring(0, 5) || '--:--'} WIB</span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] text-[#4B6478]">Belum dikerjakan</span>
                                        <span className="text-[10px] text-[#64748B] tabular-nums">{t.due_time?.substring(0, 5) || '--:--'} WIB</span>
                                      </div>
                                    )}
                                 </td>
                                 <td className="px-5 py-4 max-w-[200px]">
                                    {(() => {
                                      if (rpt.feedOrts) {
                                        const ortsStyle = { habis: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', sedikit: 'bg-amber-500/15 text-amber-400 border-amber-500/20', banyak: 'bg-rose-500/15 text-rose-400 border-rose-500/20' }
                                        const ortsLabel = { habis: 'Habis', sedikit: 'Sisa Sedikit', banyak: 'Sisa Banyak' }
                                        return <span className={cn('inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black border', ortsStyle[rpt.feedOrts] || 'bg-white/5 text-slate-400 border-white/10')}>{ortsLabel[rpt.feedOrts] || rpt.feedOrts}</span>
                                      }
                                      if (rpt.weighingCount > 0) return <span className="text-[11px] font-bold text-blue-400">{rpt.snippet}</span>
                                      if (rpt.healthCount > 0) return <span className="text-[11px] font-bold text-emerald-400">{rpt.snippet}</span>
                                      if (rpt.snippet && rpt.snippet !== 'Menunggu laporan') return <span className="text-[11px] font-medium text-slate-400 line-clamp-1">{rpt.snippet}</span>
                                      return <span className="text-[10px] text-[#4B6478] italic">Menunggu laporan</span>
                                    })()}
                                 </td>
                                 <td className="px-5 py-4">
                                   <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border", st.color, st.bg, st.border)}>
                                     <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", st.color.replace('text-', 'bg-'))} /> {st.label}
                                   </div>
                                 </td>
                                 <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                                   {t.status === 'selesai' ? (
                                     <Button onClick={() => { setSelectedTask(t); setCompleteSheetOpen(true); }} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-xl h-8 px-4 active:scale-95 transition-all hover:bg-emerald-500/20">Audit</Button>
                                   ) : t.status !== 'dilewati' ? (
                                     <Button onClick={() => { setSelectedTask(t); setCompleteSheetOpen(true); }} className="bg-white/5 border border-white/10 hover:bg-gradient-to-r hover:from-[#7C3AED] hover:to-[#5B21B6] hover:border-transparent hover:shadow-[0_0_16px_rgba(124,58,237,0.25)] text-slate-300 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl h-8 px-4 active:scale-95 transition-all">Lapor</Button>
                                   ) : null}
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

      <CompleteTaskSheet
        open={completeSheetOpen} onOpenChange={setCompleteSheetOpen} task={selectedTask} isDesktop={isDesktop}
        showSuccessAnimation={showSuccess}
        isOwnerView={!isStaffView}
        onSuccess={() => { setShowSuccess(true); setTimeout(() => { setShowSuccess(false); setCompleteSheetOpen(false); }, 1800); }}
        config={config} TASK_TYPE_CFG={TASK_TYPE_CFG} TASK_REPORT_CONFIG={TASK_REPORT_CONFIG}
        livestockType={livestockType}
      />
      <AdHocTaskSheet open={adHocSheetOpen} onOpenChange={setAdHocSheetOpen} isDesktop={isDesktop} TASK_TYPE_CFG={TASK_TYPE_CFG} livestockType={livestockType} />
      <IncidentReportSheet open={incidentSheetOpen} onOpenChange={setIncidentSheetOpen} isDesktop={isDesktop} config={config} livestockType={livestockType} />
    </Scene>
  )
}

// ── TASK CARD ──────────────────────────────────────────────────────────────────

const TaskCard = ({ task, onClick, TASK_TYPE_CFG }) => {
  const cfg = TASK_TYPE_CFG[task.task_type] || TASK_TYPE_CFG.lainnya
  const st = STATUS_CFG[task.status] || STATUS_CFG.pending
  const urgency = getUrgencyLabel(task)
  const rpt = parseTaskReport(task)

  const ortsStyle = { habis: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', sedikit: 'bg-amber-500/15 text-amber-400 border-amber-500/20', banyak: 'bg-rose-500/15 text-rose-400 border-rose-500/20' }
  const ortsLabel = { habis: '👍 Habis', sedikit: '🟡 Sisa', banyak: '🔴 Banyak' }

  const isDone = task.status === 'selesai' || task.status === 'terlambat'
  const isPending = task.status === 'pending' || task.status === 'in_progress'

  // Safe time display — guard against "undefined" stored as string
  const safeTime = task.due_time && !task.due_time.startsWith('undef') && !task.due_time.startsWith('null')
    ? task.due_time.substring(0, 5)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group"
    >
      <div className={cn(
        "relative rounded-2xl lg:rounded-3xl border overflow-hidden transition-all duration-200",
        task.status === 'selesai'    ? "bg-[#0B1310] border-emerald-500/[0.12]" :
        task.status === 'terlambat'  ? "bg-[#150C0E] border-rose-500/[0.20]"   :
        task.status === 'in_progress'? "bg-[#0B0F18] border-blue-500/[0.20]"   :
        "bg-[#0C1319] border-white/[0.06] hover:border-white/[0.12]"
      )}>
        {/* Main content row */}
        <div className="p-3.5 lg:p-5 flex items-start gap-3 lg:gap-4">
          {/* Icon — 44px touch target */}
          <div className={cn(
            "w-11 h-11 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105",
            cfg.bg, cfg.border, cfg.shadow
          )}>
            <cfg.icon size={20} className={cn(cfg.color, "lg:hidden")} />
            <cfg.icon size={22} className={cn(cfg.color, "hidden lg:block")} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row with status badge */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className={cn(
                "font-bold text-[13px] lg:text-sm leading-snug line-clamp-2 flex-1 min-w-0",
                isDone ? "text-white/50 line-through" : "text-white group-hover:text-purple-200 transition-colors"
              )}>
                {task.title}
              </h3>
              <div className={cn(
                "shrink-0 px-2 py-0.5 rounded-full text-[8px] lg:text-[8.5px] font-black uppercase border tracking-widest whitespace-nowrap",
                st.color, st.bg, st.border
              )}>
                {st.label}
              </div>
            </div>

            {/* Metadata chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-[9px] text-[#4B6478] font-semibold uppercase tracking-wider">
                <MapPin size={9} className="text-[#A78BFA]" />
                {task.kandang_name || 'Global'}
              </span>
              {safeTime && (
                <span className="flex items-center gap-1 text-[9px] text-[#4B6478] font-semibold uppercase tracking-wider">
                  <Clock size={9} />
                  {safeTime}
                </span>
              )}
              {rpt.completedBy && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400">
                  <CheckCircle2 size={8} /> {rpt.completedBy}
                  {rpt.completedAt && <span className="text-emerald-600 ml-0.5">{rpt.completedAt}</span>}
                </span>
              )}
              {urgency && (
                <span className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-black border uppercase tracking-wider", urgency.color)}>
                  <Sparkles size={8} /> {urgency.label}
                </span>
              )}
            </div>

            {/* Completion summary */}
            {isDone && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {rpt.feedOrts && (
                  <span className={cn('inline-flex px-2 py-0.5 rounded-md text-[8px] lg:text-[9px] font-black border', ortsStyle[rpt.feedOrts] || 'bg-white/5 text-slate-400 border-white/10')}>
                    {ortsLabel[rpt.feedOrts] || rpt.feedOrts}
                  </span>
                )}
                {rpt.weighingCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[8px] font-black text-blue-400">
                    <Scale size={8} /> {rpt.weighingCount} ekor{rpt.weighingAvg && <span className="text-blue-300 ml-0.5">· avg {rpt.weighingAvg}kg</span>}
                  </span>
                )}
                {rpt.healthCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400">
                    <Activity size={8} /> {rpt.healthCount} ekor · {rpt.healthMed}
                  </span>
                )}
                {!rpt.feedOrts && rpt.weighingCount === 0 && rpt.healthCount === 0 && rpt.snippet && rpt.snippet !== 'Selesai' && rpt.snippet !== 'Menunggu laporan' && (
                  <span className="text-[9px] text-[#64748B] italic line-clamp-1">{rpt.snippet}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CTA bar — only for pending/in-progress tasks on mobile */}
        {isPending && (
          <div className="px-3.5 pb-3.5 lg:hidden">
            <div className="flex items-center justify-between h-9 px-4 rounded-xl bg-[#7C3AED]/[0.08] border border-[#7C3AED]/20 text-[#A78BFA] text-[10px] font-black uppercase tracking-widest">
              <span>Lapor Selesai</span>
              <ChevronRight size={14} className="opacity-60" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── INTERACTIVE CHECK CARD ────────────────────────────────────────────────────

function InteractiveCheckCard({ task, onCheck, isExpanded, onToggle, config, TASK_TYPE_CFG, TASK_REPORT_CONFIG, livestockType }) {
  const cfg = TASK_TYPE_CFG[task.task_type] || TASK_TYPE_CFG.lainnya
  const isSelesai = task.status === 'selesai'
  const urgency = getUrgencyLabel(task)

  const [reportData, setReportData] = useState({})
  const [weighingData, setWeighingData] = useState({ animal_id: '', weight_kg: '', girth_cm: '' })
  const [weighingEntries, setWeighingEntries] = useState([])
  const [healthData, setHealthData] = useState({ animal_id: '', medicine_name: '', dosage: '', notes: '' })
  const [healthEntries, setHealthEntries] = useState([])

  const NoBatchWarning = () => (
    <div className="p-6 rounded-[32px] bg-amber-500/[0.03] border border-amber-500/10 space-y-4 animate-in fade-in zoom-in-95 duration-500">
       <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/20 shadow-xl shadow-amber-900/10">
          <AlertTriangle size={20} className="text-amber-400" />
       </div>
       <div>
          <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1 items-center flex gap-2">Belum Ada Batch Aktif</h4>
          <p className="text-[11px] text-[#64748B] leading-relaxed font-medium">Tugas ini memerlukan data populasi ternak untuk mencatat aktivitas secara individu. Pastikan Batch telah dimulai di kandang <span className="text-amber-400/80 font-bold underline decoration-amber-500/20">{task.kandang_name || 'ini'}</span>.</p>
       </div>
       <Button 
         onClick={() => navigate(`${getPeternakBasePath(livestockType)}/ternak/batch`)}
         className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl h-10 px-5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
       >
          Kelola Data Batch
       </Button>
    </div>
  )

  const hooks = LIVESTOCK_HOOKS_MAP[livestockType] || LIVESTOCK_HOOKS_MAP.sapi_penggemukan

  const updateStatus = useUpdateTaskStatus()
  const addWeight = hooks.useAddWeight()
  const addHealth = hooks.useAddHealth()
  const linkRecord = useLinkTaskRecord()

  // FALLBACK: If task.batch_id is missing, find active batch matching kandang_name
  const { data: activeBatches = [] } = hooks.useActiveBatches()
  const effectiveBatchId = useMemo(() => {
    if (task.batch_id) return task.batch_id
    if (!activeBatches.length) return null
    // Try match by kandang_name
    if (task.kandang_name) {
      const match = activeBatches.find(b => b.kandang_name === task.kandang_name)
      if (match) return match.id
    }
    // Fallback to first active batch
    return activeBatches[0].id
  }, [task.batch_id, task.kandang_name, activeBatches])

  const { data: animals = [] } = hooks.useAnimals(effectiveBatchId)

  const isMultiAnimalTask = (task.task_type === 'timbang' || task.task_type === 'vaksinasi' || task.task_type === 'obat_cacing') && config.usesIndividualAnimals
  const isHealthTask = task.task_type === 'vaksinasi' || task.task_type === 'obat_cacing'
  
  // When isMultiAnimalTask, we don't show the generic reportConfig fields (data is captured per-animal in sub-form)
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
          
          // Pre-fill health metadata from first entry if available (Global Medicine UX)
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

    // Multi-animal: toggle unless all animals done → then complete
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
      })
      const newEntry = {
        animal_id: weighingData.animal_id,
        eartag: selectedAnimal?.name || selectedAnimal?.ear_tag || selectedAnimal?.id?.substring(0, 8),
        weight_kg: parseFloat(weighingData.weight_kg),
        girth_cm: weighingData.girth_cm ? parseFloat(weighingData.girth_cm) : null,
        weighed_at: new Date().toISOString(),
        record_id: record?.id,
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
      if (record?.id) await linkRecord.mutateAsync({ id: task.id, linked_record_id: record.id, linked_record_table: hooks.weightTable || 'sapi_weight_records' })
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
      // Keep medicine_name/dosage for next animal (Global UX)
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "group relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden",
        isSelesai 
          ? "bg-[#06090F] border-emerald-500/20" 
          : isExpanded ? "bg-[#0C1319] border-[#7C3AED]/40 ring-1 ring-[#7C3AED]/20 shadow-xl" : "bg-[#0C1319] border-white/5 hover:border-purple-500/30 hover:bg-[#06090F]"
      )}
    >
      <div className="flex items-stretch min-h-[64px] lg:min-h-[80px]">
        <button 
          onClick={isSelesai ? handleUnlock : handleAction}
          disabled={(!isSelesai && (updateStatus.isPending || addWeight.isPending))}
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

        <div 
          onClick={handleAction}
          className="flex-1 p-3 lg:p-4 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex-1 min-w-0 pr-2 lg:pr-4">
            <div className="flex items-center gap-2 mb-1.5">
               <span className={cn("text-[9px] font-black uppercase py-0.5 px-1.5 rounded bg-white/5", cfg.color)}>{cfg.label}</span>
               {isCarryover && (
                 <span className="text-[8.5px] font-black uppercase py-0.5 px-1.5 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/20">
                   Dilanjutkan
                 </span>
               )}
               {!isCarryover && urgency && (
                 <span className={cn("text-[8.5px] font-black uppercase py-0.5 px-1.5 rounded-sm flex items-center gap-1 bg-white/5", urgency.color)}>
                   <Sparkles size={8} /> {urgency.label}
                 </span>
               )}
            </div>
            <h3 className={cn(
              "text-[12px] lg:text-[13px] font-bold leading-snug mb-1.5 lg:mb-2.5 line-clamp-2 transition-colors",
              isSelesai ? "text-emerald-500 line-through opacity-70" : "text-white"
            )}>
              {task.title}
            </h3>
            <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-4 text-[#64748B]">
               <span className="text-[9px] lg:text-[10px] font-semibold flex items-center gap-1 lg:gap-1.5 uppercase tracking-wider">
                  <MapPin size={10} className={isSelesai ? "text-emerald-600" : "text-[#A78BFA]"} /> {task.kandang_name || 'Farm'}
               </span>
               <span className="text-[9px] lg:text-[10px] font-semibold flex items-center gap-1 lg:gap-1.5 uppercase tracking-wider">
                  <Clock size={10} className={isSelesai ? "text-emerald-600/50" : "text-white/40"} /> 
                  {isSelesai && task.completed_at
                    ? `Selesai: ${format(new Date(task.completed_at), "d MMM HH:mm", { locale: idLocale })}`
                    : task.due_time && !task.due_time.startsWith('undef') && !task.due_time.startsWith('null')
                      ? `${task.due_time.substring(0, 5)} WIB`
                      : '--:-- WIB'
                  }
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
            <div className={cn("p-3 lg:p-5 pl-14 lg:pl-[80px] space-y-4 lg:space-y-6", isSelesai && "opacity-90")} onClick={(e) => e.stopPropagation()}>
               {isSelesai && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
                     <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-emerald-400 uppercase tracking-tight">Laporan Terkirim & Terkunci</span>
                           {task.completed_at && (
                              <span className="text-[10px] text-emerald-500/60 font-medium -mt-0.5 lowercase">
                                selesai pada {format(new Date(task.completed_at), "eeee, d MMMM yyyy 'pukul' HH:mm", { locale: idLocale })}
                              </span>
                           )}
                        </div>
                     </div>
                     <button onClick={handleUnlock} className="text-[9px] font-black uppercase text-emerald-500 hover:underline bg-emerald-500/10 px-2 py-1 rounded">Buka Kunci Untuk Edit</button>
                  </div>
               )}
                {/* No Active Batch Warning */}
                {isMultiAnimalTask && animals.length === 0 && <NoBatchWarning />}

               {/* Multi-Animal Reporting: Health (Vaksin/Obat Cacing) */}
               {isMultiAnimalTask && isHealthTask && animals.length > 0 && (
                 <div className="space-y-6">
                   <div className="p-4 lg:p-6 rounded-2xl lg:rounded-3xl bg-white/5 border border-white/5 space-y-4 lg:space-y-5">
                     <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                        <Activity size={18} className="text-purple-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-white">Record Health Action</span>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider block ml-1">Nama {task.task_type === 'vaksinasi' ? 'Vaksin' : 'Obat'}</label>
                         <input 
                           value={healthData.medicine_name} 
                           onChange={e => setHealthData(h => ({ ...h, medicine_name: e.target.value }))}
                           placeholder={task.task_type === 'vaksinasi' ? "Contoh: Anthrax B-12" : "Contoh: Albendazole"}
                           className="w-full h-11 lg:h-12 rounded-xl bg-black/40 border border-white/5 px-4 text-sm text-white focus:border-purple-500/50 outline-none transition-all"
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider block ml-1">Dosis (ml/unit)</label>
                         <input 
                           value={healthData.dosage} 
                           onChange={e => setHealthData(h => ({ ...h, dosage: e.target.value }))}
                           placeholder="0.0"
                           className="w-full h-11 lg:h-12 rounded-xl bg-black/40 border border-white/5 px-4 text-sm text-white focus:border-purple-500/50 outline-none transition-all"
                         />
                       </div>
                     </div>

                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider block ml-1">Pilih {config.animalLabel}</label>
                       <div className="flex gap-2">
                         <Select value={healthData.animal_id} onValueChange={v => setHealthData(h => ({ ...h, animal_id: v }))}>
                           <SelectTrigger className="flex-1 h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-black/40 border-white/5 text-sm text-white focus:ring-0">
                             <SelectValue placeholder={`Pilih Eartag ${config.animalLabel}...`} />
                           </SelectTrigger>
                           <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-2xl max-h-[250px]">
                             {untreatedAnimals.map(a => (
                               <SelectItem key={a.id} value={a.id} className="rounded-xl">
                                 {a.name || a.ear_tag || `ID: ${a.id.substring(0,8)}`}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                         <Button 
                           onClick={handleAddHealth}
                           className="h-14 aspect-square rounded-2xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg active:scale-95 transition-all"
                           disabled={addHealth.isPending}
                         >
                           {addHealth.isPending ? <LoadingSpinner className="w-5 h-5" /> : <Plus size={24} />}
                         </Button>
                       </div>
                     </div>
                   </div>

                   {healthEntries.length > 0 && (
                     <div className="space-y-3">
                       <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Record Success ({healthEntries.length})</p>
                       <div className="flex flex-wrap gap-2">
                          {healthEntries.map((e, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                              <CheckCircle2 size={10} className="text-emerald-400" />
                              <span className="text-[10px] font-bold text-white tracking-widest">{e.eartag}</span>
                              <span className="text-[9px] text-emerald-400/60 font-black">{e.dosage || '-'}ml</span>
                            </div>
                          ))}
                       </div>
                     </div>
                   )}
                 </div>
               )}

               {isMultiAnimalTask && task.task_type === 'timbang' && animals.length > 0 && (
                  <div className="space-y-4">
                     {/* Progress header */}
                     <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2">
                           <Scale size={13} className="text-blue-400" />
                           <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider">Progres Timbang</span>
                        </div>
                        <span className="text-sm font-black text-white">{weighingEntries.length}<span className="text-[#4B6478] font-normal text-xs">/{animals.length} {config.animalLabelPlural}</span></span>
                     </div>

                     {/* Already-weighed list */}
                     {weighingEntries.length > 0 && (
                        <div className="space-y-1.5">
                           {weighingEntries.map((entry, i) => (
                              <div key={i} className="flex items-center gap-2 text-[11px] px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                 <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                                 <span className="text-emerald-300 font-bold flex-1">{entry.eartag || `#${i + 1}`}</span>
                                 <span className="text-[#4B6478]">{entry.weight_kg} kg</span>
                                 {entry.girth_cm && <span className="text-[#4B6478]">{entry.girth_cm} cm</span>}
                              </div>
                           ))}
                        </div>
                     )}

                     {/* Form for next animal */}
                     {!isSelesai && !animalsDone && (
                        <>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] ml-2">
                                 {config.animalLabel} Berikutnya *
                              </label>
                              <Select
                                 value={weighingData.animal_id}
                                 onValueChange={v => {
                                    const animal = animals.find(a => a.id === v)
                                    setWeighingData(w => ({ ...w, animal_id: v, weight_kg: animal?.entry_weight_kg ? animal.entry_weight_kg.toString() : w.weight_kg }))
                                 }}>
                                 <SelectTrigger className="h-11 rounded-xl bg-white/5 border border-white/5 px-4 text-[13px] text-white focus:ring-1 focus:ring-blue-500/50">
                                    <SelectValue placeholder={`Pilih Eartag ${config.animalLabel}...`} />
                                 </SelectTrigger>
                                 <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl max-h-[200px]">
                                    {unweighedAnimals.map(a => (
                                       <SelectItem key={a.id} value={a.id} className="rounded-lg text-[13px] focus:bg-blue-500/10 focus:text-blue-300">
                                          {a.name || a.ear_tag || `ID: ${a.id.substring(0, 8)}`}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] ml-2">Berat (KG) *</label>
                                 <InputNumber value={weighingData.weight_kg} onChange={v => setWeighingData(w => ({ ...w, weight_kg: v }))} suffix=" kg" placeholder="0.0" className="h-11 rounded-xl bg-white/5 border-white/5 font-display text-[15px] px-4" />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] ml-2">Lingkar (CM)</label>
                                 <InputNumber value={weighingData.girth_cm} onChange={v => setWeighingData(w => ({ ...w, girth_cm: v }))} suffix=" cm" placeholder="0.0" className="h-11 rounded-xl bg-white/5 border-white/5 font-display text-[15px] px-4" />
                              </div>
                           </div>
                           <button
                              onClick={handleAddWeighing}
                              disabled={addWeight.isPending || updateStatus.isPending}
                              className="w-full py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-black uppercase tracking-wider hover:bg-blue-500/30 active:scale-98 transition-all disabled:opacity-50"
                           >
                              {addWeight.isPending ? 'Menyimpan...' : `+ Catat Timbangan`}
                           </button>
                        </>
                     )}

                     {/* All done state */}
                     {animalsDone && !isSelesai && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                           <p className="text-[11px] font-black text-emerald-400">Semua {config.animalLabelPlural} sudah ditimbang!</p>
                           <p className="text-[9px] text-emerald-600 mt-0.5">Tekan angka di kiri untuk menyelesaikan tugas</p>
                        </div>
                     )}
                  </div>
               )}

               {reportConfig?.fields.map(f => (
                  <div key={f.id} className="space-y-2">
                     <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] ml-2">{f.label} {f.required && '*'}</label>
                     {f.type === 'number' && <InputNumber disabled={isSelesai} value={reportData[f.id] || ''} onChange={v => setReportData(rd => ({ ...rd, [f.id]: v }))} suffix={f.suffix} placeholder={f.placeholder} className="h-11 rounded-xl bg-white/5 border border-white/5 font-display text-[15px] px-4 w-full" />}
                     {f.type === 'text' && <input disabled={isSelesai} type="text" value={reportData[f.id] || ''} onChange={e => setReportData(rd => ({ ...rd, [f.id]: e.target.value }))} placeholder={f.placeholder} className="w-full h-11 rounded-xl bg-white/5 border border-white/5 px-4 text-[13px] text-white focus:bg-white/10 outline-none" />}
                     {f.type === 'select' && (
                        <Select disabled={isSelesai} value={reportData[f.id]} onValueChange={v => setReportData(rd => ({ ...rd, [f.id]: v }))}>
                           <SelectTrigger className="h-11 rounded-xl bg-white/5 border border-white/5 px-4 text-[13px] text-white"><SelectValue placeholder={f.placeholder} /></SelectTrigger>
                           <SelectContent className="bg-[#0C1319]/95 border-white/10 rounded-xl">{f.options.map(opt => (<SelectItem key={opt} value={opt} className="rounded-xl text-[13px]">{opt}</SelectItem>))}</SelectContent>
                        </Select>
                     )}
                     {f.type === 'multi-checkbox' && (
                        <div className="flex flex-wrap gap-2">
                           {f.options.map(opt => {
                              const isSelected = reportData[f.id]?.includes(opt)
                              return (
                                 <button disabled={isSelesai} key={opt} onClick={(e) => { e.stopPropagation(); const current = reportData[f.id] || []; const next = isSelected ? current.filter(x => x !== opt) : [...current, opt]; setReportData(rd => ({ ...rd, [f.id]: next })) }}
                                    className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all active:scale-95", isSelected ? "bg-[#7C3AED]/20 border-[#7C3AED]/40 text-purple-300 shadow-[0_0_10px_rgba(124,58,237,0.2)]" : "bg-white/5 border-white/5 text-[#64748B] hover:bg-white/10")}
                                 >
                                    {opt}
                                 </button>
                              )
                           })}
                        </div>
                     )}
                     {f.type === 'container_calc' && (
                        <ContainerCalcField field={f} reportData={reportData} setReportData={setReportData} disabled={isSelesai} />
                     )}
                  </div>
               ))}
               
               <div className="pt-4 mt-2 border-t border-white/[0.03]">
                 {isMultiAnimalTask
                   ? (
                     <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-blue-400">
                       <Scale size={13} className="opacity-70" />
                       <p className="text-[10px] font-black uppercase tracking-wider">Catat satu per satu — Selesai otomatis sesuai batch</p>
                     </div>
                   )
                   : (
                     <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-purple-400">
                       <Wand2 size={13} className="opacity-70" />
                       <p className="text-[10px] font-black uppercase tracking-wider">Tekan tombol hijau (Kiri) untuk Simpan & Selesaikan</p>
                     </div>
                   )
                 }
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── COMPLETE TASK SHEET ───────────────────────────────────────────────────────

function CompleteTaskSheet({ open, onOpenChange, task, isDesktop, onSuccess, showSuccessAnimation, isOwnerView, config, TASK_TYPE_CFG, TASK_REPORT_CONFIG, livestockType }) {
  const [notes, setNotes] = useState('')
  const [reportData, setReportData] = useState({})
  const [weighingData, setWeighingData] = useState({ animal_id: '', weight_kg: '', girth_cm: '', famacha_score: '' })
  const [weighingEntries, setWeighingEntries] = useState([])
  const [healthEntries, setHealthEntries] = useState([])
  const [showFamachaGuide, setShowFamachaGuide] = useState(false)
  const [ortsCategory, setOrtsCategory] = useState(null)
  const [capturedPhoto, setCapturedPhoto] = useState(null)

  const hooks = LIVESTOCK_HOOKS_MAP[livestockType] || LIVESTOCK_HOOKS_MAP.sapi_penggemukan

  const updateStatus = useUpdateTaskStatus()
  const addWeight = hooks.useAddWeight()
  const addFeed = hooks.useAddFeed()
  const linkRecord = useLinkTaskRecord()

  const { data: activeBatches = [] } = hooks.useActiveBatches()
  const effectiveBatchId = useMemo(() => {
    if (task?.batch_id) return task.batch_id
    if (!activeBatches.length) return null
    if (task?.kandang_name) {
      const match = activeBatches.find(b => b.kandang_name === task.kandang_name)
      if (match) return match.id
    }
    return activeBatches[0].id
  }, [task?.batch_id, task?.kandang_name, activeBatches])

  const animalsQuery = hooks.useAnimals(effectiveBatchId)
  const animals = useMemo(() => {
    const rawAnimals = animalsQuery.data || []
    if (!task) return rawAnimals
    const isSampling = task.title?.includes('Sampling')
    if (isSampling && rawAnimals.length > 0) {
      // Use batch_id + due_date as seed to ensure consistency for that specific day
      const seed = `${task.batch_id || effectiveBatchId}-${task.due_date}`
      return getRandomizedSample(rawAnimals, seed, 0.1)
    }
    return rawAnimals
  }, [animalsQuery.data, task?.title, task?.batch_id, task?.due_date, effectiveBatchId])

  useEffect(() => {
    if (open && task) {
      try {
        const parsed = JSON.parse(task.notes || '{}')
        if (parsed._version === '2.0') {
          setReportData(parsed.report || {})
          setNotes(parsed.notes || '')
          setWeighingEntries(parsed.weighing_entries || [])
          setHealthEntries(parsed.health_entries || [])
        } else {
          setNotes(task.notes || '')
          setReportData({})
          setWeighingEntries([])
          setHealthEntries([])
        }
      } catch (e) {
        setNotes(task.notes || '')
        setReportData({})
        setWeighingEntries([])
        setHealthEntries([])
      }
      setWeighingData({ animal_id: '', weight_kg: '', girth_cm: '', famacha_score: '' })
    } else if (!open) {
      setNotes('')
      setReportData({})
      setWeighingData({ animal_id: '', weight_kg: '', girth_cm: '', famacha_score: '' })
      setWeighingEntries([])
      setHealthEntries([])
      setOrtsCategory(null)
      setCapturedPhoto(null)
    }
  }, [open, task])

  const createTask = useCreateTaskInstance()

  if (!task) return null
  const isAuditMode = isOwnerView && task.status === 'selesai'
  const isMultiAnimalTask = (task.task_type === 'timbang' || task.task_type === 'vaksinasi' || task.task_type === 'obat_cacing') && config.usesIndividualAnimals && !isAuditMode
  const reportConfig = isMultiAnimalTask ? null : TASK_REPORT_CONFIG[task.task_type]

  async function handleComplete() {
    // 1. Photo check
    const isPakan = task.task_type === 'pakan' || task.task_type === 'pemberian_pakan'
    if (config?.photoRequired && !capturedPhoto && !isAuditMode) {
      // Feed task: No photo needed per user decision
      if (!isPakan) {
        return toast.error('Foto bukti lapangan wajib dilampirkan')
      }
    }

    // 2. Jempol check (Quick Feed)
    if (isPakan && !ortsCategory && !isAuditMode) {
      return toast.error('Mohon berikan feedback sisa pakan (Habis/Sedikit/Banyak)')
    }

    try {
      let linkedId = null
      if (isMultiAnimalTask) {
        if (!weighingData.animal_id || !weighingData.weight_kg) return toast.error('Data timbangan wajib diisi')
        const animal = animals.find(a => a.id === weighingData.animal_id)
        if (!animal) return toast.error(`${config.animalLabel} tidak ditemukan`)
        
        const record = await addWeight.mutateAsync({ 
          animal_id: weighingData.animal_id, 
          batch_id: effectiveBatchId, 
          entry_date: animal.entry_date, 
          entry_weight_kg: animal.entry_weight_kg, 
          weigh_date: format(new Date(), 'yyyy-MM-dd'), 
          weight_kg: parseFloat(weighingData.weight_kg), 
          girth_cm: weighingData.girth_cm ? parseFloat(weighingData.girth_cm) : null,
          famacha_score: weighingData.famacha_score ? parseInt(weighingData.famacha_score) : null,
          weigh_method: 'timbang_langsung', 
          notes: `Auto: ${task.title}` 
        })
        
        if (record?.id) linkedId = record.id

        // ── AUTO-TASKING LOGIC (FAMACHA 4/5) ──
        if (livestockType === 'domba_penggemukan' && weighingData.famacha_score >= 4) {
          await createTask.mutateAsync({
            ...TRIGGERED_MEDICAL_INTERVENTION,
            batch_id: effectiveBatchId,
            due_date: format(new Date(), 'yyyy-MM-dd'),
            description: `${TRIGGERED_MEDICAL_INTERVENTION.description} (Deteksi: ${animal.ear_tag})`,
            livestock_type: 'domba_penggemukan'
          })
          toast.warning(`Peringatan: Skor FAMACHA Tinggi (${weighingData.famacha_score}). Tugas Intervensi Medis telah ditambahkan secara otomatis.`, {
            duration: 6000,
            icon: <AlertTriangle className="text-amber-500" />
          })
        }
      }

      if (isPakan) {
        if (!ortsCategory) return toast.error('Pilih kategori sisa pakan (jempol) terlebih dahulu')
        
        await addFeed.mutateAsync({
          batch_id: effectiveBatchId,
          log_date: format(new Date(), 'yyyy-MM-dd'),
          feed_orts_category: ortsCategory,
          hijauan_kg: parseFloat(reportData.hijauan_kg || 0),
          konsentrat_kg: parseFloat(reportData.konsentrat_kg || 0),
          notes: notes.trim() || `Auto: ${task.title}`
        })
      }

      const finalNotes = JSON.stringify({ 
        _version: '2.0', 
        report: { 
          ...reportData,
          ...(isPakan ? { feed_orts_category: ortsCategory } : {})
        }, 
        notes: notes.trim(),
        batch_id: effectiveBatchId,
        weighing_entries: weighingEntries,
        health_entries: healthEntries
      })
      await updateStatus.mutateAsync({ id: task.id, status: 'selesai', notes: finalNotes })
      if (linkedId) await linkRecord.mutateAsync({ id: task.id, linked_record_id: linkedId, linked_record_table: hooks.weightTable })
      onSuccess()
    } catch (err) { console.error(err) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isDesktop ? 'right' : 'bottom'} className={cn("bg-[#0C1319]/98 border-white/5 outline-none p-0 flex flex-col z-[5000]", isDesktop ? "w-[600px] border-l backdrop-blur-2xl" : "rounded-t-[40px] border-t max-h-[95vh] backdrop-blur-xl")}>
        <div className="flex-1 overflow-y-auto p-5 lg:p-12 space-y-6 lg:space-y-10 custom-scrollbar">
          {showSuccessAnimation ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
               <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                 <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center"><CheckCircle2 size={48} className="text-emerald-400" /></div>
                 <h2 className="text-2xl font-bold text-white tracking-tight">Tugas Selesai!</h2>
               </div>
            </div>
          ) : (
            <>
              <SheetHeader className="text-left space-y-2">
                {!isDesktop && <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4" />}
                <SheetTitle className="font-display font-bold text-2xl lg:text-4xl text-white tracking-tight">
                  {isAuditMode ? 'Audit Tugas' : 'Detail Laporan'}
                </SheetTitle>
                <p className="text-sm font-medium text-slate-400">
                  {isAuditMode ? 'Laporan yang dikirim oleh anggota tim.' : 'Lengkapi data verifikasi operasional.'}
                </p>
                <SheetDescription className="sr-only">
                  {isAuditMode ? 'Panel audit tugas operasional' : 'Panel detail laporan tugas harian'}
                </SheetDescription>
              </SheetHeader>

              {isAuditMode && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                      Diselesaikan oleh {task.completed_by?.full_name || task.worker?.full_name || 'Anggota Tim'}
                    </p>
                    {task.completed_at && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">
                        {format(new Date(task.completed_at), 'EEEE, d MMMM yyyy — HH:mm', { locale: idLocale })} WIB
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-8">
                <div className="p-4 lg:p-6 border border-white/5 bg-white/[0.02] rounded-2xl lg:rounded-3xl flex items-center gap-3 lg:gap-5">
                  <div className={cn("w-11 h-11 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0", TASK_TYPE_CFG[task.task_type]?.bg)}>
                    {React.createElement(TASK_TYPE_CFG[task.task_type]?.icon || ClipboardList, { size: 24, className: TASK_TYPE_CFG[task.task_type]?.color })}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-base lg:text-xl text-white line-clamp-2 leading-tight">{task.title}</h4>
                    <p className="text-xs font-semibold text-slate-400 mt-1.5 flex items-center gap-2">
                      <MapPin size={12} className="text-slate-500" /> {task.kandang_name || 'Global Farm'} 
                      <span className="text-white/10">•</span>
                      {task.status === 'selesai' && task.completed_at 
                          ? `Selesai: ${format(new Date(task.completed_at), "HH:mm", { locale: idLocale })}`
                          : `${task.due_time?.substring(0, 5)} WIB`
                        }
                    </p>
                  </div>
                </div>

                {(reportConfig || isMultiAnimalTask || (isAuditMode && (Object.keys(reportData).length > 0 || weighingEntries.length > 0 || healthEntries.length > 0))) && (
                   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center gap-4 px-4 text-[#64748B]">
                         <div className="h-[1px] flex-1 bg-white/5" /><span className="text-[9px] font-black uppercase tracking-[0.4em]">{isAuditMode ? 'Data Laporan Lapangan' : 'Reporting Schema'}</span><div className="h-[1px] flex-1 bg-white/5" />
                      </div>

                      {isAuditMode && (weighingEntries.length > 0 || healthEntries.length > 0) && (
                         <div className="space-y-6">
                            {weighingEntries.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 ml-2">
                                  <Scale size={14} className="text-blue-400" />
                                  <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Detail Timbangan</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {weighingEntries.map((e, idx) => (
                                    <div key={idx} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                                      <span className="text-[10px] font-black text-white">{e.eartag}</span>
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-display font-black text-blue-400">{e.weight_kg}kg</span>
                                        {e.girth_cm && <span className="text-[10px] text-[#4B6478]">{e.girth_cm}cm</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {healthEntries.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 ml-2">
                                  <Activity size={14} className="text-emerald-400" />
                                  <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Detail Penanganan</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {healthEntries.map((e, idx) => (
                                    <div key={idx} className="p-3 px-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-black text-white uppercase tracking-wider">{e.eartag}</span>
                                        <span className="text-[11px] font-medium text-emerald-400/80">{e.medicine_name || 'Obat/Vaksin'}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-xs font-bold text-white">{e.dosage || '1'}ml</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                         </div>
                      )}

                      <div className="grid grid-cols-1 gap-8">
                         {isMultiAnimalTask && !isAuditMode && animals.length === 0 && <NoBatchWarning />}
                         {isMultiAnimalTask && !isAuditMode && animals.length > 0 && (
                            <div className="space-y-6 pt-2 pb-6 border-b border-white/5">
                               <div className="space-y-4">
                                  <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Pilih {config.animalLabel} (Identitas) *</label>
                                  <Select value={weighingData.animal_id} onValueChange={v => {
                                      const animal = animals.find(a => a.id === v);
                                      setWeighingData(w => ({ ...w, animal_id: v, weight_kg: animal?.entry_weight_kg ? animal.entry_weight_kg.toString() : w.weight_kg }));
                                  }}>
                                     <SelectTrigger className="h-12 lg:h-16 rounded-xl lg:rounded-[28px] bg-black/40 border border-white/5 px-4 lg:px-8 text-white focus:ring-0"><SelectValue placeholder={`Pilih Tag/Eartag ${config.animalLabel}...`} /></SelectTrigger>
                                     <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-3xl max-h-[300px]">
                                        {animals.map(a => (
                                          <SelectItem key={a.id} value={a.id} className="rounded-xl focus:bg-purple-500/10 focus:text-purple-300">
                                            {a.name || a.ear_tag || `ID: ${a.id.substring(0,8)}`} {a.entry_weight_kg ? `(${a.entry_weight_kg} kg awal)` : ''}
                                          </SelectItem>
                                        ))}
                                     </SelectContent>
                                  </Select>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-3 lg:space-y-4"><label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-2 lg:ml-4">Berat Aktual *</label><InputNumber value={weighingData.weight_kg} onChange={v => setWeighingData(w => ({ ...w, weight_kg: v }))} suffix=" kg" placeholder="0.0" className="h-12 lg:h-16 rounded-xl lg:rounded-[28px] bg-black/40 border-white/5 font-display text-lg lg:text-xl px-4 lg:px-8 focus:bg-black/60 transition-all border-none shadow-inner w-full" /></div>
                                  <div className="space-y-3 lg:space-y-4"><label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-2 lg:ml-4">Lingkar Dada</label><InputNumber value={weighingData.girth_cm} onChange={v => setWeighingData(w => ({ ...w, girth_cm: v }))} suffix=" cm" placeholder="0.0" className="h-12 lg:h-16 rounded-xl lg:rounded-[28px] bg-black/40 border-white/5 font-display text-lg lg:text-xl px-4 lg:px-8 focus:bg-black/60 transition-all border-none shadow-inner w-full" /></div>
                               </div>

                               {livestockType === 'domba_penggemukan' && (
                                 <div className="space-y-5 animate-in slide-in-from-top-2 duration-500">
                                   <div className="flex items-center justify-between ml-4">
                                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Skor FAMACHA (Wana Kelopak Mata)</label>
                                      <button onClick={() => setShowFamachaGuide(true)} className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-[9px] font-bold text-slate-400 transition-all">
                                        <Info size={10} /> Panduan Visual
                                      </button>
                                   </div>
                                   <div className="grid grid-cols-5 gap-2">
                                     {[1, 2, 3, 4, 5].map((score) => {
                                       const colors = [
                                         '', // Unused
                                         'bg-rose-500 border-rose-400 text-white', // 1: Merah (Normal)
                                         'bg-pink-400 border-pink-300 text-white', // 2: Merah Jambu (Aman)
                                         'bg-rose-200 border-rose-100 text-rose-800', // 3: Pucat Sedikit (Waspada)
                                         'bg-slate-200 border-white text-slate-700', // 4: Pucat (Bahaya/Anemia)
                                         'bg-white border-slate-200 text-slate-900', // 5: Putih (Kritis/Parasit)
                                       ]
                                       const isSelected = weighingData.famacha_score === score.toString()
                                       return (
                                         <button
                                           key={score}
                                           onClick={() => setWeighingData(w => ({ ...w, famacha_score: score.toString() }))}
                                           className={cn(
                                             "h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-all border-2",
                                             isSelected ? colors[score] : "bg-black/20 border-white/5 text-[#4B6478] hover:bg-black/40"
                                           )}
                                         >
                                           {score}
                                         </button>
                                       )
                                     })}
                                   </div>
                                   <p className="text-[10px] text-center text-[#4B6478] uppercase font-bold tracking-widest px-4">
                                      {weighingData.famacha_score === '1' && '1: Optimal (Merah)'}
                                      {weighingData.famacha_score === '2' && '2: Aman (Pink)'}
                                      {weighingData.famacha_score === '3' && '3: Waspada (Pink Pucat)'}
                                      {weighingData.famacha_score === '4' && '4: Bahaya (Pucat/Anemia)'}
                                      {weighingData.famacha_score === '5' && '5: Kritis (Putih/Cacingan)'}
                                      {!weighingData.famacha_score && 'Pilih skor 1-5 berdasarkan cek fisik'}
                                   </p>
                                 </div>
                               )}
                            </div>
                         )}

                         {isAuditMode && (task.task_type === 'pakan' || task.task_type === 'pemberian_pakan') && (reportData.feed_orts_category || ortsCategory) && (
                             <div className="flex flex-col gap-1 p-6 rounded-3xl bg-orange-500/5 border border-orange-500/10">
                               <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest leading-none mb-2">Kondisi Sisa Pakan Sebelumnya</span>
                               <div className="flex items-center gap-3">
                                 <span className="text-2xl animate-pulse">
                                   {(reportData.feed_orts_category || ortsCategory) === 'habis' ? '👍' : (reportData.feed_orts_category || ortsCategory) === 'sedikit' ? '🟡' : '🔴'}
                                 </span>
                                 <span className="text-xl font-display font-black text-white uppercase tracking-tight">
                                   {(reportData.feed_orts_category || ortsCategory) === 'habis' ? 'Habis / Puas' : (reportData.feed_orts_category || ortsCategory) === 'sedikit' ? 'Sisa Sedikit' : 'Sisa Banyak'}
                                 </span>
                               </div>
                             </div>
                          )}

                          {isAuditMode && Object.keys(reportData).length > 0 && !reportConfig && (

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {Object.entries(reportData).map(([k, v]) => (
                                <div key={k} className="flex flex-col gap-1 p-5 rounded-3xl bg-white/[0.03] border border-white/5">
                                  <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest">{k.replace('_', ' ')}</span>
                                  <span className="text-lg font-bold text-white leading-tight">{Array.isArray(v) ? v.join(', ') : v}</span>
                                </div>
                              ))}
                            </div>
                         )}

                         {reportConfig?.fields.map(f => (
                            <div key={f.id} className="space-y-4">
                               <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">{f.label} {f.required && !isAuditMode && '*'}</label>
                               {isAuditMode ? (
                                 <div className="h-14 rounded-[28px] bg-black/20 border border-white/5 px-8 flex items-center text-white font-bold">
                                   {Array.isArray(reportData[f.id]) ? reportData[f.id].join(', ') : (reportData[f.id] || <span className="text-[#4B6478]">—</span>)}
                                   {f.suffix && reportData[f.id] && <span className="ml-1 text-[#64748B]">{f.suffix}</span>}
                                 </div>
                               ) : (
                                 <>
                                   {f.type === 'number' && <InputNumber value={reportData[f.id] || ''} onChange={v => setReportData(rd => ({ ...rd, [f.id]: v }))} suffix={f.suffix} placeholder={f.placeholder} className="h-16 rounded-[28px] bg-black/40 border-white/5 font-display text-xl px-8 focus:bg-black/60 transition-all border-none shadow-inner" />}
                                   {f.type === 'text' && <input type="text" value={reportData[f.id] || ''} onChange={e => setReportData(rd => ({ ...rd, [f.id]: e.target.value }))} placeholder={f.placeholder} className="w-full h-16 rounded-[28px] bg-black/40 border border-white/5 px-8 text-white focus:bg-black/60 outline-none transition-all shadow-inner" />}
                                   {f.type === 'select' && (<Select value={reportData[f.id]} onValueChange={v => setReportData(rd => ({ ...rd, [f.id]: v }))}><SelectTrigger className="h-16 rounded-[28px] bg-black/40 border border-white/5 px-8 text-white focus:ring-0"><SelectValue placeholder={f.placeholder} /></SelectTrigger><SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-3xl">{f.options.map(opt => (<SelectItem key={opt} value={opt} className="rounded-xl focus:bg-purple-500/10 focus:text-purple-300">{opt}</SelectItem>))}</SelectContent></Select>)}
                                   {f.type === 'multi-checkbox' && (<div className="flex flex-wrap gap-2.5 px-2">{f.options.map(opt => { const isSelected = reportData[f.id]?.includes(opt); return (<button key={opt} onClick={() => { const current = reportData[f.id] || []; const next = isSelected ? current.filter(x => x !== opt) : [...current, opt]; setReportData(rd => ({ ...rd, [f.id]: next })) }} className={cn("px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95", isSelected ? "bg-[#7C3AED]/20 border-[#7C3AED]/40 text-purple-300 shadow-[0_0_20px_rgba(124,58,237,0.2)] scale-105" : "bg-white/5 border-white/5 text-[#64748B] hover:bg-white/10")}>{opt}</button>) })}</div>)}
                                   {f.type === 'container_calc' && <ContainerCalcField field={f} reportData={reportData} setReportData={setReportData} />}
                                 </>
                               )}
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                                 {(task.task_type === 'pakan' || task.task_type === 'pemberian_pakan') && !isAuditMode && (
                    <div className="space-y-6 pt-2 animate-in slide-in-from-top-4 duration-700">
                       <div className="flex flex-col gap-2 ml-4">
                          <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.4em]">Feedback Sisa Pakan Sebelumnya *</label>
                          <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest">Wajib diisi untuk akurasi monitoring pakan</p>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'habis', label: 'Habis/Puas', icon: '👍', active: 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]' },
                          { id: 'sedikit', label: 'Sisa Sedikit', icon: '🟡', active: 'bg-amber-500 border-amber-400 text-slate-900 shadow-[0_0_30px_rgba(245,158,11,0.3)]' },
                          { id: 'banyak', label: 'Sisa Banyak', icon: '🔴', active: 'bg-rose-500 border-rose-400 text-white shadow-[0_0_30px_rgba(244,63,94,0.3)]' },
                        ].map((opt) => {
                          const isSelected = ortsCategory === opt.id
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setOrtsCategory(opt.id)}
                              className={cn(
                                "flex flex-col items-center justify-center py-4 lg:py-6 rounded-2xl lg:rounded-[32px] border-2 transition-all duration-300 active:scale-95 group",
                                isSelected ? opt.active : "bg-black/20 border-white/5 text-slate-500 hover:bg-black/40 hover:border-white/10"
                              )}
                            >
                              <span className={cn("text-2xl lg:text-3xl mb-1.5 lg:mb-2 transition-transform duration-500", isSelected ? "scale-125 rotate-[12deg]" : "group-hover:scale-110")}>
                                {opt.icon}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-[0.1em]">{opt.label}</span>
                            </button>
                          )
                        })}
                       </div>
                    </div>
                 )}

                 {(notes || !isAuditMode) && (

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">
                      {isAuditMode ? 'Catatan dari Lapangan' : 'Observation Notes'}
                    </label>
                    {isAuditMode ? (
                      notes ? (
                        <div className="w-full bg-black/20 border border-white/5 rounded-[40px] p-8 text-sm text-white min-h-[80px] leading-relaxed">{notes}</div>
                      ) : (
                        <div className="w-full bg-black/20 border border-white/5 rounded-[40px] p-8 text-sm text-[#4B6478] min-h-[80px]">Tidak ada catatan.</div>
                      )
                    ) : (
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tuliskan detail temuan atau kendala lapangan di sini..." className="w-full bg-black/30 border border-white/5 rounded-2xl lg:rounded-[40px] p-5 lg:p-8 text-sm text-white focus:border-[#7C3AED]/50 outline-none min-h-[120px] lg:min-h-[180px] resize-none shadow-2xl transition-all hover:bg-black/40" />
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {!showSuccessAnimation && (
          <div className="p-5 lg:p-8 border-t border-white/5 bg-[#0C1319] shrink-0 flex items-center gap-3 lg:gap-4">
            {isAuditMode ? (
              <Button onClick={() => onOpenChange(false)} className="flex-1 h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all">Tutup</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all border border-transparent px-5 lg:px-8">Batal</Button>
                <Button onClick={handleComplete} disabled={updateStatus.isPending} className="flex-1 h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-emerald-500 hover:bg-emerald-600 border-none shadow-[0_0_20px_rgba(16,185,129,0.3)] text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
                  {updateStatus.isPending ? 'Menyimpan...' : 'Selesaikan Tugas'}
                </Button>
              </>
            )}
          </div>
        )}
      </SheetContent>

      <Sheet open={showFamachaGuide} onOpenChange={setShowFamachaGuide}>
        <SheetContent side="bottom" className="bg-[#0C1319]/98 border-white/5 outline-none p-0 flex flex-col z-[10000] rounded-t-[32px] h-fit max-h-[90vh]">
          <div className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar">
            <SheetHeader className="space-y-1">
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-3" />
              <SheetTitle className="font-display font-black text-2xl text-white tracking-tight">Panduan FAMACHA</SheetTitle>
              <SheetDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gunakan standar visual cek anemia.</SheetDescription>
            </SheetHeader>
            
            <div className="p-3 bg-white/5 rounded-[24px] border border-white/10 overflow-hidden shadow-2xl">
              <img 
                src="/famacha_guide.png" 
                alt="FAMACHA Guide" 
                className="w-full h-auto rounded-xl opacity-90 hover:opacity-100 transition-opacity"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=800";
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block mb-1">Skor 1 & 2</span>
                  <p className="text-[10px] font-medium text-white/70 leading-tight">Optimal. Mata merah/pink segar. Tidak perlu obat.</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-1">Skor 3</span>
                  <p className="text-[10px] font-medium text-white/70 leading-tight">Waspada. Mulai pucat. Monitor pakan & parasit.</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30">
                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block mb-1">Skor 4 & 5 (Kritis)</span>
                <p className="text-[10px] font-medium text-white/70 leading-tight">Indikasi anemia berat. Sistem otomatis memicu **Intervensi Medis**.</p>
              </div>
            </div>

            <Button onClick={() => setShowFamachaGuide(false)} className="w-full h-14 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-slate-200 transition-all">
              Tutup Panduan
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </Sheet>
  )
}

// ── AD-HOC TASK SHEET ─────────────────────────────────────────────────────────

function AdHocTaskSheet({ open, onOpenChange, isDesktop, TASK_TYPE_CFG, livestockType }) {
  const hooks = LIVESTOCK_HOOKS_MAP[livestockType] || LIVESTOCK_HOOKS_MAP.sapi_penggemukan
  const { data: batches = [] } = hooks.useBatches()
  const { data: team = [] } = useAssignableMembers()
  const createTask = useCreateTaskInstance()
  const [form, setForm] = useState({ title: '', task_type: 'lainnya', kandang_name: '', assigned_profile_id: '', due_date: format(new Date(), 'yyyy-MM-dd'), due_time: format(new Date(), 'HH:mm:ss'), description: '', repetition: 'sekali' })
  
  const kandangs = useMemo(() => [...new Set(batches.map(b => b.kandang_name).filter(Boolean))], [batches])
  const handleSave = () => {
    if (!form.title) return toast.error('Judul tugas wajib diisi')
    
    let payloads = []
    const basePayload = { 
      title: form.title, task_type: form.task_type, 
      kandang_name: form.kandang_name === 'none' ? null : form.kandang_name, 
      assigned_profile_id: form.assigned_profile_id === 'none' ? null : form.assigned_profile_id,
      due_time: form.due_time, description: form.description,
      livestock_type: livestockType,
    }

    const startDate = parseISO(form.due_date)
    let endDate = startDate
    if (form.repetition === 'mingguan') endDate = endOfWeek(startDate, { weekStartsOn: 1 })
    else if (form.repetition === 'bulanan') endDate = endOfMonth(startDate)

    const intervalDays = eachDayOfInterval({ start: startDate, end: endDate })
    for (const day of intervalDays) { payloads.push({ ...basePayload, due_date: format(day, 'yyyy-MM-dd') }) }

    createTask.mutate(payloads.length === 1 ? payloads[0] : payloads, { onSuccess: () => { 
      onOpenChange(false); 
      setForm({ title: '', task_type: 'lainnya', kandang_name: '', assigned_profile_id: '', due_date: format(new Date(), 'yyyy-MM-dd'), due_time: format(new Date(), 'HH:mm:ss'), description: '', repetition: 'sekali' }); 
    }})
  }

  // Filter task types to remove duplicates (e.g. pakan + pemberian_pakan)
  const uniqueTaskTypes = useMemo(() => {
    const seen = new Set()
    return Object.entries(TASK_TYPE_CFG).filter(([k, v]) => {
      if (seen.has(v.label)) return false
      seen.add(v.label)
      return true
    })
  }, [TASK_TYPE_CFG])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isDesktop ? 'right' : 'bottom'} className={cn("bg-[#06090F]/95 border-white/5 outline-none p-0 flex flex-col", isDesktop ? "w-[480px] border-l backdrop-blur-xl" : "rounded-t-3xl border-t max-h-[90vh] backdrop-blur-xl")}>
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-6 lg:space-y-8 custom-scrollbar">
          <SheetHeader className="text-left space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30 mb-2"><Plus size={20} className="text-[#A78BFA]" /></div>
            <SheetTitle className="font-display font-black text-2xl text-white tracking-tight">Buka Tugas Baru</SheetTitle>
            <SheetDescription className="text-sm text-[#4B6478]">Buat penugasan operasional kandang baru.</SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8]">Judul Tugas <span className="text-red-400">*</span></label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Contoh: Pembersihan Palung Unit A" className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm font-medium text-white focus:bg-white/10 focus:border-[#7C3AED]/50 outline-none transition-all placeholder:text-white/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#94A3B8]">Tipe Tugas</label>
                  <Select value={form.task_type} onValueChange={v => setForm(f => ({ ...f, task_type: v }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 px-4 text-sm text-white"><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
                    <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl">
                      {uniqueTaskTypes.map(([k, v]) => (<SelectItem key={k} value={k} className="rounded-lg">{v.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-[#94A3B8]">Area Kandang</label>
                  <Select value={form.kandang_name} onValueChange={v => setForm(f => ({ ...f, kandang_name: v }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 px-4 text-sm text-white"><SelectValue placeholder="Semua Unit" /></SelectTrigger>
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
                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 px-4 text-sm text-white"><SelectValue placeholder="Biarkan kosong untuk Auto-Assign nanti" /></SelectTrigger>
                <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl max-h-[300px]">
                  <SelectItem value="none" className="rounded-lg text-white/50 italic">Jangan assign sekarang</SelectItem>
                  {team.map(m => <SelectItem key={m.id} value={m.id} className="rounded-lg">{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2"><label className="text-xs font-bold text-[#94A3B8]">Tanggal Mulai</label><DatePicker value={form.due_date} onChange={d => setForm(f => ({ ...f, due_date: d }))} className="h-12 rounded-xl bg-white/5 border-white/10 flex items-center px-4 w-full text-sm" /></div>
               <div className="space-y-2"><label className="text-xs font-bold text-[#94A3B8]">Waktu Eksekusi</label><input type="time" step="1" value={form.due_time} onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))} className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white focus:bg-white/10 focus:border-[#7C3AED]/50 outline-none transition-all" /></div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8]">Pengulangan Tugas</label>
              <Select value={form.repetition} onValueChange={v => setForm(f => ({ ...f, repetition: v }))}>
                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 px-4 text-sm text-white"><SelectValue placeholder="Sekali Saja" /></SelectTrigger>
                <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-xl"><SelectItem value="sekali" className="rounded-lg">Sekali Saja</SelectItem><SelectItem value="mingguan" className="rounded-lg">Hasilkan untuk 1 Minggu (7 Tugas)</SelectItem><SelectItem value="bulanan" className="rounded-lg">Hasilkan untuk 1 Bulan (30 Tugas)</SelectItem></SelectContent>
              </Select>
              <p className="text-[10px] text-[#4B6478] px-1 mt-1">Sistem akan secara otomatis membuat tugas-tugas terpisah untuk hari-hari selanjutnya.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8]">Catatan / Instruksi</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Instruksi spesifik atau keterangan tambahan..." className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:bg-white/10 focus:border-[#7C3AED]/50 outline-none min-h-[100px] resize-none placeholder:text-white/20" />
            </div>
          </div>
        </div>
        <div className="p-5 lg:p-8 pt-4 border-t border-white/10 bg-[#06090F]">
          <Button onClick={handleSave} disabled={createTask.isPending} className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
            {createTask.isPending ? 'Menyimpan...' : 'Buat Tugas'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function CriticalOverdueAlert({ tasks, TASK_TYPE_CFG }) {
  const criticals = tasks.filter(t => t.status === 'terlambat' && (t.task_type === 'vaksinasi' || t.task_type === 'timbang'))
  if (criticals.length === 0) return null
  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="mb-4 lg:mb-10 p-5 lg:p-10 rounded-2xl lg:rounded-[56px] border border-rose-500/20 bg-rose-500/[0.03] backdrop-blur-3xl flex items-start gap-4 lg:gap-8 relative overflow-hidden group shadow-2xl shadow-rose-900/20">
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/[0.04] blur-[100px] -mr-40 -mt-40 pointer-events-none" />
      <div className="w-10 h-10 lg:w-16 lg:h-16 rounded-xl lg:rounded-[28px] bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(244,63,94,0.3)]"><AlertTriangle size={20} className="text-rose-400 lg:hidden" /><AlertTriangle size={32} className="text-rose-400 hidden lg:block" /></div>
      <div className="flex-1">
        <p className="text-[10px] lg:text-[11px] font-black text-rose-400 uppercase tracking-[0.3em] lg:tracking-[0.6em] mb-1.5 lg:mb-3 font-display">Overdue Alert</p>
        <p className="text-base lg:text-2xl font-black text-white leading-tight tracking-tight">{criticals.length} Tugas Medis Terhambat</p>
        <div className="flex flex-wrap gap-1.5 lg:gap-2 mt-2 lg:mt-4">{criticals.map(t => <span key={t.id} className="text-[10px] lg:text-[11px] font-black text-rose-400/80 bg-rose-500/10 border border-rose-500/20 px-2 lg:px-3 py-0.5 lg:py-1 rounded-lg lg:rounded-xl uppercase tracking-widest">{t.title}</span>)}</div>
      </div>
    </motion.div>
  )
}

function EmptyState({ isStaff }) {
  return (
    <div className="py-16 lg:py-32 px-6 lg:px-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
       <div className="relative mb-6 lg:mb-12 group">
          <div className="absolute inset-0 bg-purple-500/10 blur-[100px] group-hover:bg-purple-500/20 transition-colors" />
          <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl lg:rounded-[36px] bg-white/[0.03] border border-white/5 flex items-center justify-center relative z-10 shadow-2xl">
             <Wand2 size={28} className="text-white/10 group-hover:text-purple-400/40 transition-all duration-700 group-hover:rotate-12 lg:hidden" />
             <Wand2 size={40} className="text-white/10 group-hover:text-purple-400/40 transition-all duration-700 group-hover:rotate-12 hidden lg:block" />
          </div>
       </div>
       <h3 className="text-lg lg:text-2xl font-black text-white tracking-tight mb-2 lg:mb-4">{isStaff ? 'Sistem Teroptimal' : 'Status: Clear'}</h3>
       <p className="text-xs lg:text-sm text-[#64748B] max-w-[280px] mx-auto font-black uppercase tracking-widest opacity-60 leading-relaxed">
          {isStaff ? 'Seluruh tugas telah diversifikasi.' : 'Belum ada tugas terjadwal.'}
       </p>
       <div className="mt-6 lg:mt-12 flex items-center gap-3"><div className="w-10 h-[1px] bg-white/5" /><span className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.5em]">TernakOS Elite</span><div className="w-10 h-[1px] bg-white/5" /></div>
    </div>
  )
}

function IncidentReportSheet({ open, onOpenChange, isDesktop, config, livestockType }) {
  const hooks = LIVESTOCK_HOOKS_MAP[livestockType] || LIVESTOCK_HOOKS_MAP.sapi_penggemukan
  const { data: batches = [] } = hooks.useActiveBatches()
  const addLog = hooks.useAddHealth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ batch_id: '', animal_tag: '', symptoms: '', notes: '', log_date: new Date().toISOString().split('T')[0] })

  useEffect(() => {
    if (batches.length > 0 && !form.batch_id) { setForm(f => ({ ...f, batch_id: batches[0].id })) }
  }, [batches, form.batch_id])

  async function handleSubmit() {
    if (!form.batch_id || !form.symptoms) return toast.error('Batch dan Gejala wajib diisi')
    setIsSubmitting(true)
    const notesWithTag = [
      form.animal_tag ? `Identitas ternak: ${form.animal_tag}` : '',
      form.notes,
    ].filter(Boolean).join('\n')
    try {
      await addLog.mutateAsync({
        batch_id:     form.batch_id,
        animal_id:    null,
        log_date:     form.log_date,
        log_type:     'medis',
        symptoms:     form.symptoms,
        notes:        notesWithTag,
        diagnosis:    'Ambigu (Menunggu Observasi)',
        action_taken: 'Observasi Terpadu',
      })
      toast.success('Laporan darurat berhasil dikirim!', { icon: <Activity size={16} /> })
      onOpenChange(false)
      setForm(f => ({ ...f, symptoms: '', notes: '', animal_tag: '' }))
    } catch (err) { toast.error('Gagal mengirim laporan: ' + err.message) } finally { setIsSubmitting(false) }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isDesktop ? 'right' : 'bottom'} className={cn("bg-[#0C1319]/98 border-white/10 outline-none p-0 flex flex-col z-[6000]", isDesktop ? "w-[540px] border-l backdrop-blur-xl" : "rounded-t-[64px] border-t max-h-[95vh] backdrop-blur-3xl")}>
        <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8 lg:space-y-12 no-scrollbar">
          <SheetHeader className="text-left space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[22px] bg-rose-500/20 flex items-center justify-center border border-rose-500/30"><AlertTriangle size={24} className="text-rose-400" /></div>
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-rose-500/60">Emergent Signal</span>
            </div>
            <SheetTitle className="text-2xl lg:text-5xl font-black text-white tracking-tighter">Lapor Masalah</SheetTitle>
            <SheetDescription className="sr-only">Panel laporan insiden darurat ternak</SheetDescription>
          </SheetHeader>

          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Select Target Unit *</label>
              <Select value={form.batch_id} onValueChange={v => setForm(f => ({ ...f, batch_id: v }))}>
                <SelectTrigger className="w-full h-12 lg:h-18 bg-black/40 border border-white/5 rounded-xl lg:rounded-[32px] px-5 lg:px-10 text-sm lg:text-lg text-white focus:bg-black/60 outline-none transition-all shadow-inner ring-0">
                  <SelectValue placeholder="Pilih unit batch/kandang..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 rounded-[32px] p-2">
                  {batches.map(b => (
                    <SelectItem key={b.id} value={b.id} className="rounded-2xl py-4 focus:bg-rose-500/10 focus:text-rose-300">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-base">{b.batch_code}</span>
                        <span className="text-[10px] uppercase tracking-widest text-[#4B6478]">{b.kandang_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Identitas {config.animalLabel} (Opsional)</label>
              <input value={form.animal_tag} onChange={e => setForm(f => ({ ...f, animal_tag: e.target.value }))} placeholder={`Contoh: ${config.animalLabel.toUpperCase()}-01 / Tag Biru`} className="w-full h-12 lg:h-18 bg-black/40 border border-white/5 rounded-xl lg:rounded-[32px] px-5 lg:px-10 text-sm lg:text-lg text-white focus:bg-black/60 outline-none" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.4em] block ml-4">Symptom Details *</label>
              <textarea value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} placeholder={`Jelaskan kondisi ${config.animalLabel.toLowerCase()} (pincang, lemas, nafsu makan turun, dll)...`} className="w-full bg-black/40 border border-white/5 rounded-2xl lg:rounded-[40px] p-5 lg:p-8 text-sm lg:text-lg text-white focus:border-rose-500/50 outline-none min-h-[120px] lg:min-h-[160px] resize-none" />
            </div>
          </div>
        </div>
        <div className="p-5 lg:p-8 border-t border-rose-500/10 bg-[#0C1319]">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-12 lg:h-14 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl lg:rounded-2xl shadow-[0_10px_30px_rgba(225,29,72,0.3)] transition-all outline-none border-none">
            {isSubmitting ? 'Mengirim...' : 'Laporkan Kondisi'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
