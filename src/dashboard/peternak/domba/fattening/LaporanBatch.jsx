import React, { useMemo, useState } from 'react'
import { TrendingUp, Activity, Calendar, ChevronRight, Info, ArrowLeft, DollarSign, ClipboardList, CheckCircle2, AlertCircle, Clock, User as UserIcon, ChevronLeft, ChevronDown, MapPin, X, LayoutGrid } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useDombaBatches,
  calcHariDiFarm
} from '@/lib/hooks/useDombaPenggemukanData'
import { usePeternakTaskInstances } from '@/lib/hooks/usePeternakTaskData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'
import { getLivestockConfig } from '@/lib/constants/taskTemplates'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, isSameMonth } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const BASE = '/peternak/peternak_domba_penggemukan'

// ── PERFORMA TAB ──────────────────────────────────────────────────────────────

function PerformanceBadge({ label, value, color, icon: Icon }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${color.bg} ${color.text}`}>
          <Icon size={16} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
          KPI
        </span>
      </div>
      <div>
        <p className="text-[11px] text-[#4B6478] font-semibold mb-0.5 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black text-white font-['Sora']">{value}</p>
      </div>
    </div>
  )
}

function TabPerforma({ batches, navigate }) {
  const stats = useMemo(() => {
    const closed = batches.filter(b => b.status === 'closed')
    const totalSales = closed.reduce((s, b) => s + (parseFloat(b.total_revenue_idr) || 0), 0)
    const totalSold  = closed.reduce((s, b) => s + (b.sold_count || 0), 0)
    const batchesWithADG = closed.filter(b => b.avg_adg_gram && b.avg_adg_gram > 0)
    const avgADG = batchesWithADG.length > 0
      ? batchesWithADG.reduce((s, b) => s + b.avg_adg_gram, 0) / batchesWithADG.length
      : null
    const batchesWithAnimals = batches.filter(b => b.total_animals > 0)
    const avgMortality = batchesWithAnimals.length > 0
      ? batchesWithAnimals.reduce((s, b) => s + ((b.mortality_count || 0) / b.total_animals * 100), 0) / batchesWithAnimals.length
      : null
    return { 
      closedCount: closed.length, 
      totalSales, 
      totalSold, 
      avgADG: avgADG ? Math.round(avgADG) : null, 
      avgMortality: avgMortality ? avgMortality.toFixed(1) : null 
    }
  }, [batches])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 mt-2">
        <PerformanceBadge 
          label="Mortalitas Avg" 
          value={stats.avgMortality ? `${stats.avgMortality}%` : '—'} 
          icon={Activity} 
          color={{ bg: 'bg-green-500/10', text: 'text-green-400' }} 
        />
        <PerformanceBadge 
          label="ADG Rata-rata" 
          value={stats.avgADG ? `${stats.avgADG} g/hr` : '—'} 
          icon={TrendingUp} 
          color={{ bg: 'bg-emerald-500/10', text: 'text-emerald-400' }} 
        />
      </div>

      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-[28px] p-6 shadow-xl shadow-green-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={80} /></div>
        <div className="relative z-10 text-white">
          <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.2em] mb-1.5 ml-0.5">Total Penjualan</p>
          <p className="text-3xl font-black font-['Sora'] mb-6 tracking-tight">Rp {stats.totalSales.toLocaleString('id-ID')}</p>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <p className="text-[9px] text-white/60 font-bold uppercase mb-0.5">Selesai</p>
              <p className="text-xs font-black">{stats.closedCount} Batch</p>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <p className="text-[9px] text-white/60 font-bold uppercase mb-0.5">Ekor Terjual</p>
              <p className="text-xs font-black">{stats.totalSold > 0 ? `${stats.totalSold} Ekor` : 'Belum ada'}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-['Sora'] font-black text-sm text-white mb-4 flex items-center gap-2">
          <ClipboardList size={16} className="text-[#4B6478]" />
          Daftar Laporan Batch
        </h2>
        <div className="space-y-3">
          {batches.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-[32px] bg-white/[0.01]">
              <LayoutGrid size={32} className="mx-auto text-white/5 mb-3" />
              <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Belum ada data batch</p>
            </div>
          ) : batches.map(batch => {
            const hari = calcHariDiFarm(batch.start_date)
            const statusColor = batch.status === 'active' ? 'text-green-400 bg-green-400/10 border-green-500/20' : 'text-slate-400 bg-white/5 border-white/10'
            return (
              <motion.div
                key={batch.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`${BASE}/ternak?batch=${batch.id}`)}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between group active:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${statusColor}`}>
                     <Activity size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-black text-white group-hover:text-green-400 transition-colors uppercase font-['Sora'] tracking-tight">{batch.batch_code}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase border ${statusColor}`}>{batch.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#4B6478] font-medium uppercase tracking-tight">
                      <span className="flex items-center gap-1"><Calendar size={10} />{new Date(batch.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                      <span>•</span>
                      <span className="text-slate-300">{hari} hari</span>
                      <span>•</span>
                      <span className="font-bold text-slate-300">{batch.total_animals} ekor</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#232F39] group-hover:text-green-400 transition-colors" />
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 bg-blue-500/5 border border-blue-500/10 rounded-[28px] p-5 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
           <Info size={18} className="text-blue-400" />
        </div>
        <div>
          <p className="text-xs font-black text-blue-300 mb-1 uppercase tracking-widest">Tips Analisa</p>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Target ADG domba fattening (Feedlot) ideal adalah di atas 150g/hari. Jika realita di bawah target, periksa palatabilitas pakan dan manajemen stres lingkungan.</p>
        </div>
      </div>
    </div>
  )
}

// ── AUDIT TAB ─────────────────────────────────────────────────────────────────

function ComplianceDot({ rate }) {
  if (rate === null) return <div className="w-full h-full rounded-lg bg-white/5" />
  if (rate >= 90) return <div className="w-full h-full rounded-lg bg-emerald-500/70" />
  if (rate >= 60) return <div className="w-full h-full rounded-lg bg-amber-500/60" />
  return <div className="w-full h-full rounded-lg bg-rose-500/60" />
}

function parseTaskNotes(raw) {
  try {
    const p = JSON.parse(raw || '{}')
    if (p._version === '2.0') return { report: p.report || {}, notes: p.notes || '' }
    return { report: {}, notes: raw || '' }
  } catch { return { report: {}, notes: raw || '' } }
}

function TaskAuditRow({ task, config }) {
  const [open, setOpen] = useState(false)
  const cfg = config.taskTypeCfg[task.task_type] || config.taskTypeCfg.lainnya
  const st = {
    selesai:    { label: 'Selesai',   cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    terlambat:  { label: 'Terlambat', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    pending:    { label: 'Pending',   cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    in_progress:{ label: 'Berjalan',  cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    dilewati:   { label: 'Dilewati',  cls: 'text-slate-500 bg-white/5 border-white/10' },
  }[task.status] || { label: task.status, cls: 'text-slate-400 bg-white/5 border-white/10' }

  const { report, notes } = parseTaskNotes(task.notes)
  const reportFields = config.reportConfig[task.task_type]?.fields?.filter(f => !f.type.startsWith('container_')) || []
  const hasDetail = Object.keys(report).length > 0 || notes

  return (
    <div className={cn('border rounded-xl overflow-hidden transition-all', open ? 'border-white/15 bg-white/[0.03]' : 'border-white/[0.06] bg-white/[0.02]')}>
      <button
        onClick={() => hasDetail && setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg, cfg.border)}>
          <cfg.icon size={14} className={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {task.kandang_name && (
              <span className="text-[9px] text-[#4B6478] flex items-center gap-1">
                <MapPin size={8} />{task.kandang_name}
              </span>
            )}
            {task.due_time && (
              <span className="text-[9px] text-[#4B6478] flex items-center gap-1">
                <Clock size={8} />{task.due_time.substring(0, 5)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full border uppercase', st.cls)}>{st.label}</span>
          {hasDetail && <ChevronDown size={12} className={cn('text-[#4B6478] transition-transform', open && 'rotate-180')} />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
              {task.completed_by?.full_name && (
                <div className="flex items-center gap-2 text-[10px]">
                  <CheckCircle2 size={11} className="text-emerald-400" />
                  <span className="text-emerald-400 font-bold">{task.completed_by.full_name}</span>
                  {task.completed_at && (
                    <span className="text-[#4B6478]">
                      — {format(new Date(task.completed_at), 'HH:mm', { locale: idLocale })} WIB
                    </span>
                  )}
                </div>
              )}

              {reportFields.length > 0 && Object.keys(report).length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                  {reportFields.map(f => {
                    const val = report[f.id]
                    if (!val && val !== 0) return null
                    return (
                      <div key={f.id} className="bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
                        <p className="text-[9px] text-[#4B6478] uppercase tracking-wider">{f.label}</p>
                        <p className="text-xs font-bold text-white mt-0.5">
                          {Array.isArray(val) ? val.join(', ') : val}
                          {f.suffix && !Array.isArray(val) ? ` ${f.suffix}` : ''}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              {Object.keys(report).filter(k => !reportFields.find(f => f.id === k)).length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(report)
                    .filter(([k]) => !reportFields.find(f => f.id === k) && !k.startsWith('_'))
                    .map(([k, v]) => (
                      <div key={k} className="bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
                        <p className="text-[9px] text-[#4B6478] uppercase tracking-wider">{k.replace(/_/g, ' ')}</p>
                        <p className="text-xs font-bold text-white mt-0.5">{Array.isArray(v) ? v.join(', ') : String(v)}</p>
                      </div>
                    ))}
                </div>
              )}

              {notes && (
                <div className="bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
                  <p className="text-[9px] text-[#4B6478] uppercase tracking-wider mb-1">Catatan</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DayTasksPanel({ dateStr, tasks, config, onClose }) {
  const dayTasks = tasks.filter(t => t.due_date === dateStr)
  const selesai = dayTasks.filter(t => t.status === 'selesai').length
  const rate = dayTasks.length > 0 ? Math.round((selesai / dayTasks.length) * 100) : 0

  const byWorker = useMemo(() => {
    const map = {}
    for (const t of dayTasks) {
      const name = t.worker?.full_name || t.assigned_profile?.full_name || t.completed_by?.full_name || 'Belum Ditugaskan'
      if (!map[name]) map[name] = []
      map[name].push(t)
    }
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'Belum Ditugaskan') return 1
      if (b === 'Belum Ditugaskan') return -1
      return a.localeCompare(b)
    })
  }, [dayTasks])

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="border border-white/10 rounded-2xl overflow-hidden bg-[#0C1319]"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div>
          <p className="text-xs font-black text-white uppercase tracking-wider">
            {format(new Date(dateStr), 'EEEE, d MMMM', { locale: idLocale })}
          </p>
          <p className="text-[10px] text-[#4B6478] mt-0.5 font-bold">
            {selesai}/{dayTasks.length} TUGAS SELESAI · {rate}%
          </p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#4B6478] hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="p-3 space-y-4 max-h-[400px] overflow-y-auto">
        {dayTasks.length === 0 ? (
          <p className="text-center text-[11px] text-[#4B6478] py-8">Tidak ada tugas di hari ini</p>
        ) : byWorker.map(([workerName, workerTasks]) => {
          const done = workerTasks.filter(t => t.status === 'selesai').length
          return (
            <div key={workerName}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <UserIcon size={11} className="text-[#4B6478]" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest flex-1 truncate">{workerName}</span>
                <span className="text-[9px] text-[#4B6478] font-bold">{done}/{workerTasks.length} SELESAI</span>
              </div>
              <div className="space-y-1.5 pl-3 border-l-2 border-white/[0.06]">
                {workerTasks.map(t => (
                  <TaskAuditRow key={t.id} task={t} config={config} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

function WorkerCard({ w, config, isDimmed }) {
  const [open, setOpen] = useState(false)
  const tasksByDate = useMemo(() => {
    const map = {}
    for (const t of w.tasks) {
      if (!map[t.due_date]) map[t.due_date] = []
      map[t.due_date].push(t)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [w.tasks])

  const STATUS_CFG = {
    selesai:    { label: 'Selesai',   cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    terlambat:  { label: 'Terlambat', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    pending:    { label: 'Pending',   cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    in_progress:{ label: 'Berjalan',  cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    dilewati:   { label: 'Dilewati',  cls: 'text-slate-500 bg-white/5 border-white/10' },
  }

  return (
    <div className={cn('border rounded-2xl overflow-hidden transition-all duration-300', isDimmed ? 'border-white/5 opacity-60' : open ? 'border-white/15 bg-white/[0.03] shadow-lg' : 'border-white/[0.06] bg-white/[0.02]')}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
          <UserIcon size={14} className="text-[#4B6478]" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-black text-white block truncate uppercase tracking-tight">{w.name}</span>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{w.selesai} Selesai</span>
            {w.terlambat > 0 && <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">{w.terlambat} Terlambat</span>}
            <span className="text-[9px] font-bold text-[#4B6478] uppercase tracking-widest">{w.total} Tugas</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('font-black text-lg font-["Sora"]',
            isDimmed ? 'text-[#4B6478]' :
            w.rate >= 90 ? 'text-emerald-400' : w.rate >= 60 ? 'text-amber-400' : 'text-rose-400'
          )}>{w.rate}%</span>
          <ChevronDown size={14} className={cn('text-[#4B6478] transition-transform duration-300', open && 'rotate-180')} />
        </div>
      </button>

      <div className="h-0.5 bg-white/5 mx-4">
        <div className={cn('h-full transition-all duration-500', isDimmed ? 'bg-white/20' : w.rate >= 90 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : w.rate >= 60 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${w.rate}%` }} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-4 pt-2 space-y-4 border-t border-white/[0.06] bg-black/10">
              {tasksByDate.map(([dateStr, dayTasks]) => (
                <div key={dateStr}>
                  <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-2 px-1">
                    {format(new Date(dateStr), 'EEEE, d MMM', { locale: idLocale })}
                  </p>
                  <div className="space-y-1.5 px-2 py-2 border-l-2 border-white/[0.06] ml-1 bg-white/[0.01] rounded-r-lg">
                    {dayTasks.map(t => {
                      const st = STATUS_CFG[t.status] || { label: t.status, cls: 'text-slate-400 bg-white/5 border-white/10' }
                      const cfg = config.taskTypeCfg[t.task_type] || config.taskTypeCfg.lainnya
                      return (
                        <div key={t.id} className="flex items-center gap-2.5">
                          <cfg.icon size={11} className={cfg.color} />
                          <span className="text-[11px] font-bold text-slate-300 flex-1 truncate">{t.title}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {t.completed_by?.full_name && t.completed_by.full_name !== w.name && (
                              <span className="text-[8px] font-bold text-[#4B6478]">BY {t.completed_by.full_name.toUpperCase()}</span>
                            )}
                            <span className={cn('text-[8px] font-black px-1.5 py-0.5 rounded-full border uppercase', st.cls)}>{st.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TabAudit({ livestockType = 'domba_penggemukan' }) {
  const [auditMonth, setAuditMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const config = getLivestockConfig(livestockType)

  const monthStart = format(startOfMonth(auditMonth), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(auditMonth), 'yyyy-MM-dd')

  const { data: tasks = [], isLoading } = usePeternakTaskInstances({
    due_date_from: monthStart,
    due_date_to: monthEnd,
    livestockType,
  })

  const { summary, perWorker, dailyMap } = useMemo(() => {
    const total     = tasks.length
    const selesai   = tasks.filter(t => t.status === 'selesai').length
    const terlambat = tasks.filter(t => t.status === 'terlambat').length
    const pending   = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length
    const dilewati  = tasks.filter(t => t.status === 'dilewati').length
    const compliance = total > 0 ? Math.round((selesai / total) * 100) : 0

    const workerMap = {}
    for (const t of tasks) {
      const name = t.worker?.full_name || t.assigned_profile?.full_name || t.completed_by?.full_name || 'Belum Ditugaskan'
      if (!workerMap[name]) workerMap[name] = { selesai: 0, total: 0, terlambat: 0, tasks: [] }
      workerMap[name].total++
      workerMap[name].tasks.push(t)
      if (t.status === 'selesai') workerMap[name].selesai++
      if (t.status === 'terlambat') workerMap[name].terlambat++
    }
    const perWorker = Object.entries(workerMap)
      .map(([name, d]) => ({
        name,
        selesai: d.selesai,
        total: d.total,
        terlambat: d.terlambat,
        tasks: d.tasks,
        rate: d.total > 0 ? Math.round((d.selesai / d.total) * 100) : 0,
      }))
      .sort((a, b) => {
        if (a.name === 'Belum Ditugaskan') return 1
        if (b.name === 'Belum Ditugaskan') return -1
        return b.rate - a.rate
      })

    const dailyMap = {}
    for (const t of tasks) {
      if (!dailyMap[t.due_date]) dailyMap[t.due_date] = { selesai: 0, total: 0 }
      dailyMap[t.due_date].total++
      if (t.status === 'selesai') dailyMap[t.due_date].selesai++
    }

    return { summary: { total, selesai, terlambat, pending, dilewati, compliance }, perWorker, dailyMap }
  }, [tasks])

  const daysInMonth = useMemo(() => eachDayOfInterval({
    start: startOfMonth(auditMonth),
    end: endOfMonth(auditMonth)
  }), [auditMonth])

  if (isLoading) return <div className="py-20 flex justify-center"><LoadingSpinner /></div>

  return (
    <div className="space-y-7 mt-2 pb-10">
      <div className="flex items-center justify-between px-1">
        <button onClick={() => setAuditMonth(m => subMonths(m, 1))} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="font-['Sora'] font-black text-white text-[13px] uppercase tracking-[0.2em]">
          {format(auditMonth, 'MMMM yyyy', { locale: idLocale })}
        </span>
        <button
          onClick={() => setAuditMonth(m => addMonths(m, 1))}
          disabled={isSameMonth(auditMonth, new Date())}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="bg-gradient-to-br from-[#0C1319] to-[#111C24] border border-white/[0.08] rounded-[32px] p-7 text-center shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-amber-500 opacity-50" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#4B6478] mb-3 ml-1">Kepatuhan Operasional</p>
        <p className={cn("font-['Sora'] font-black text-6xl mb-2 tracking-tighter transition-all group-hover:scale-105",
          summary.compliance >= 90 ? 'text-emerald-400' :
          summary.compliance >= 60 ? 'text-amber-400' : 'text-rose-400'
        )}>
          {summary.compliance}%
        </p>
        <p className="text-[11px] text-[#4B6478] font-bold uppercase tracking-widest">{summary.selesai} DARI {summary.total} TUGAS SELESAI</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Selesai',   value: summary.selesai,   valueCls: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', Icon: CheckCircle2 },
          { label: 'Terlambat', value: summary.terlambat, valueCls: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    Icon: AlertCircle },
          { label: 'Pending',   value: summary.pending,   valueCls: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   Icon: Clock },
          { label: 'Dilewati',  value: summary.dilewati,  valueCls: 'text-slate-400',   bg: 'bg-white/5',        border: 'border-white/10',       Icon: ClipboardList },
        ].map(s => (
          <div key={s.label} className={cn('rounded-[24px] p-4 border flex items-center gap-3 transition-all active:scale-95', s.bg, s.border)}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-inner', s.bg, s.border)}>
              <s.Icon size={18} className={s.valueCls} />
            </div>
            <div>
              <p className={cn('font-black text-2xl leading-none font-["Sora"]', s.valueCls)}>{s.value}</p>
              <p className="text-[10px] text-[#4B6478] mt-1 uppercase tracking-[0.15em] font-black">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4B6478] mb-4 ml-1">Heatmap Kepatuhan</p>
        <div className="grid grid-cols-7 gap-2 bg-white/[0.02] border border-white/[0.06] p-4 rounded-[28px]">
          {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d => (
            <div key={d} className="text-center text-[9px] font-black text-[#4B6478] uppercase py-1">{d}</div>
          ))}
          {Array.from({ length: (daysInMonth[0].getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {daysInMonth.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const d = dailyMap[dateStr]
            const rate = d ? Math.round((d.selesai / d.total) * 100) : null
            const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr
            const isSelected = selectedDay === dateStr
            const hasTasks = !!d
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                disabled={!hasTasks}
                className={cn(
                  "aspect-square rounded-xl relative flex items-center justify-center transition-all",
                  isToday && !isSelected && 'ring-1 ring-white/30',
                  isSelected ? 'ring-2 ring-white/60 scale-90 z-10' : '',
                  hasTasks ? 'cursor-pointer hover:scale-95 hover:ring-1 hover:ring-white/20' : 'cursor-default opacity-40'
                )}
              >
                <ComplianceDot rate={rate} />
                <span className={cn("absolute text-[10px] font-black font-['Sora']", isSelected ? 'text-white' : 'text-white/60')}>
                  {format(day, 'd')}
                </span>
                {hasTasks && d.total > 0 && (
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                     <span className="text-[7px] font-black text-white/70">{d.total}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 justify-center">
          {[['bg-emerald-500/70','≥90%'],['bg-amber-500/60','60–89%'],['bg-rose-500/60','<60%'],['bg-white/5','Tidak ada']].map(([bg, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cn('w-2.5 h-2.5 rounded-sm', bg)} />
              <span className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedDay && (
          <DayTasksPanel
            dateStr={selectedDay}
            tasks={tasks}
            config={config}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </AnimatePresence>

      {perWorker.length > 0 && (
        <div className="pt-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4B6478] mb-4 ml-1">Breakdown per Anggota</p>
          <div className="space-y-3">
            {perWorker.map(w => (
              <WorkerCard
                key={w.name}
                w={w}
                config={config}
                isDimmed={w.name === 'Belum Ditugaskan'}
              />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-[32px] bg-white/[0.01]">
          <ClipboardList size={40} className="mx-auto text-white/5 mb-4" />
          <p className="text-sm font-black text-[#4B6478] uppercase tracking-widest leading-loose">Belum ada data tugas<br/>di bulan ini</p>
        </div>
      )}
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function DombaLaporanBatch() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('performa')
  const { data: batches = [], isLoading } = useDombaBatches()

  if (isLoading) return <LoadingSpinner fullPage />

  const activeBatchesCount = batches.filter(b => b.status === 'active').length

  return (
    <div className="text-slate-100 pb-24">
      <header className="px-5 pt-8 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.05]">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#4B6478] hover:text-white transition-all shadow-inner"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-['Sora'] font-black text-2xl text-white tracking-tight leading-none mb-1">Analisa & Laporan</h1>
            <p className="text-[11px] text-[#4B6478] font-black uppercase tracking-widest">{activeBatchesCount} BATCH AKTIF · DOMBA</p>
          </div>
        </div>

        <div className="flex p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl gap-1 mt-6">
          {[
            { key: 'performa', label: 'Performa Batch' },
            { key: 'audit', label: 'Audit Operasional' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300',
                tab === t.key
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                  : 'text-[#4B6478] hover:text-white hover:bg-white/5'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 mt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {tab === 'performa' && <TabPerforma batches={batches} navigate={navigate} />}
            {tab === 'audit' && <TabAudit livestockType="domba_penggemukan" />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}