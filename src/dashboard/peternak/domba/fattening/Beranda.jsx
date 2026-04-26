import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, TrendingUp, AlertTriangle,
  Calendar, MapPin, Search, PlusCircle, LayoutGrid,
  ChevronRight, ChevronLeft, ArrowUpRight, BarChart3, Activity, Tag,
  BarChart2, CheckCircle2, RefreshCw, MousePointer2,
  Wheat, AlertCircle, Zap, Plus, Scale,
  Wallet, Utensils, Trash2, Heart, Clock, CircleDashed, MoreHorizontal
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useDombaActiveBatches, useDombaBatches, useDombaAnimals,
  useDombaBatchWeightHistory, useDombaFeedLogs, useDombaOperationalCosts, useDombaSales,
  calcHariDiFarm, calcMortalitasDomba,
} from '@/lib/hooks/useDombaPenggemukanData'
import { usePeternakTaskInstances } from '@/lib/hooks/usePeternakTaskData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine
} from 'recharts'
import { format, addDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'
import KandangMiniMap from './KandangMiniMap'

const BASE = '/peternak/peternak_domba_penggemukan'

const CHART_COLORS = [
  '#22C55E', '#10B981', '#34D399', '#4ADE80', '#059669',
  '#16A34A', '#84CC16', '#A3E635', '#2DD4BF', '#009688'
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return 'pagi'
  if (h < 15) return 'siang'
  if (h < 19) return 'sore'
  return 'malam'
}

// Task type → display metadata matching the mockup
const TASK_CATEGORY_MAP = {
  pakan: { label: 'Morning Feeding', time: '08:00', avatar: 'https://i.pravatar.cc/150?u=12', color: 'bg-emerald-400', textColor: 'text-emerald-400' },
  kesehatan: { label: 'Health Check', time: '09:00', avatar: 'https://i.pravatar.cc/150?u=32', color: 'bg-amber-400', textColor: 'text-amber-400' },
  kebersihan_kandang: { label: 'Pen Cleaning', time: '12:00', avatar: 'https://i.pravatar.cc/150?u=44', color: 'bg-blue-400', textColor: 'text-blue-400' },
  pemberian_pakan: { label: 'Afternoon Feeding', time: '15:00', avatar: 'https://i.pravatar.cc/150?u=68', color: 'bg-orange-400', textColor: 'text-orange-400' },
  kebersihan: { label: 'Pen Cleaning', time: '12:00', avatar: 'https://i.pravatar.cc/150?u=44', color: 'bg-blue-400', textColor: 'text-blue-400' },
  ceklis_kesehatan: { label: 'Health Check', time: '09:00', avatar: 'https://i.pravatar.cc/150?u=32', color: 'bg-amber-400', textColor: 'text-amber-400' },
  timbang: { label: 'Timbang', time: '07:00', avatar: 'https://i.pravatar.cc/150?u=11', color: 'bg-purple-400', textColor: 'text-purple-400' },
  reproduksi: { label: 'Reproduksi', time: '11:00', avatar: 'https://i.pravatar.cc/150?u=22', color: 'bg-pink-400', textColor: 'text-pink-400' },
  lainnya: { label: 'Lainnya', time: '16:00', avatar: 'https://i.pravatar.cc/150?u=99', color: 'bg-slate-400', textColor: 'text-slate-400' },
}

function TaskCategoryAudit({ tasks, onNavigate }) {
  const groups = useMemo(() => {
    const order = ['pakan', 'kesehatan', 'kebersihan_kandang', 'pemberian_pakan', 'lainnya']
    const map = {}
    tasks.forEach(t => {
      let type = t.template?.task_type || 'lainnya'
      // normalize types mapping to same output
      if (type === 'kebersihan') type = 'kebersihan_kandang'
      if (type === 'ceklis_kesehatan') type = 'kesehatan'

      // Logic: If pakan type but scheduled for afternoon/evening, treat as 'pemberian_pakan' (Afternoon Feeding)
      if (type === 'pakan') {
        const title = (t.title || t.template?.title || '').toLowerCase()
        const hour = parseInt((t.due_time || '08:00').split(':')[0])
        if (hour >= 13 || title.includes('sore') || title.includes('afternoon')) {
          type = 'pemberian_pakan'
        }
      }

      if (!map[type]) map[type] = { type, tasks: [] }
      map[type].tasks.push(t)
    })

    // Sort to match the timeline sequence in mockup
    return Object.values(map).sort((a, b) => {
      const idxA = order.indexOf(a.type)
      const idxB = order.indexOf(b.type)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return 0
    })
  }, [tasks])

  if (tasks.length === 0) return null

  return (
    <section className="px-4 mt-2">
      <div className="bg-gradient-to-br from-[#1A3331] to-[#121E23] border border-white/[0.03] rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="font-['Sora'] font-bold text-base sm:text-lg text-white">Daily Task Audit</h2>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition-colors border border-white/5 text-xs text-[#94A3B8] font-semibold cursor-pointer">
            <Clock size={12} className="text-white/40" />
            Hari ini
            <ChevronRight size={12} className="rotate-90 ml-1 text-white/40" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="relative group z-10">
          {/* Scroll Navigation Overlay */}
          <button className="absolute -left-2 top-[30px] -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 z-20 opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <ChevronLeft size={16} />
          </button>

          <button className="absolute -right-2 top-[30px] -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 z-20 opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <ChevronRight size={16} />
          </button>

          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 custom-scrollbar sm:px-6 -mx-4 sm:mx-0 px-4 sm:px-0 scroll-smooth">
            {groups.map(({ type, tasks: groupTasks }) => {
              const meta = TASK_CATEGORY_MAP[type] || TASK_CATEGORY_MAP.lainnya
              const done = groupTasks.filter(t => t.status === 'selesai').length
              const total = groupTasks.length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0

              let statusText = 'Pending'
              let statusColor = 'text-[#4B6478]'
              let barColor = 'bg-white/10'
              let StatusIcon = CircleDashed
              let iconBg = 'bg-[#1A3331]'
              let iconColor = 'text-white/40'

              if (pct === 100) {
                statusText = '100% Completed'
                statusColor = meta.textColor
                barColor = meta.color
                StatusIcon = CheckCircle2
                iconBg = 'bg-emerald-500'
                iconColor = 'text-white'
              } else if (pct > 0) {
                statusText = `${pct}% in Progress`
                statusColor = meta.textColor
                barColor = meta.color
                StatusIcon = Clock
                iconBg = 'bg-amber-500'
                iconColor = 'text-[#1A3331]' // dark icon on light bg
              }

              // Determine worker & exact time from latest task
              const latestTask = [...groupTasks].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))[0]

              const getExactName = (task) => {
                if (!task) return 'Peternak'
                if (task.completed_by?.full_name) return task.completed_by.full_name
                if (task.completed_by?.kandang_workers?.[0]?.full_name) return task.completed_by.kandang_workers[0].full_name
                if (task.completed_by?.tenant_memberships?.[0]?.full_name) return task.completed_by.tenant_memberships[0].full_name
                return task.worker?.full_name || task.assigned_profile?.full_name || 'Peternak'
              }
              const workerName = getExactName(latestTask)

              // Exact Time
              let displayTime = meta.time
              if (latestTask) {
                if (latestTask.status === 'selesai' && latestTask.completed_at) {
                  const d = new Date(latestTask.completed_at)
                  if (!isNaN(d.getTime())) {
                    displayTime = `${format(d, 'HH:mm')} WIB`
                  }
                } else if (latestTask.due_time) {
                  displayTime = `${String(latestTask.due_time).substring(0, 5)} WIB`
                }
              }

              const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(workerName)}&background=random&color=fff&size=150`

              return (
                <div key={type} onClick={onNavigate} className="flex flex-col shrink-0 w-[140px] sm:w-[160px] cursor-pointer group/item">

                  {/* Avatar & Badge */}
                  <div className="relative w-11 h-11 mb-5" title={workerName}>
                    <img src={avatarUrl} alt={workerName} className="w-full h-full rounded-full object-cover shadow-lg border-2 border-[#182B2A]" />
                    <div className={`absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center border-[2.5px] border-[#182B2A] ${iconBg}`}>
                      <StatusIcon size={9} className={iconColor} strokeWidth={3} />
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>

                  {/* Text Information */}
                  <p className="text-[10px] text-[#4B6478] font-bold mb-0.5 opacity-80">{displayTime}</p>
                  <p className="text-xs font-bold text-white leading-tight mb-1">{meta.label}</p>
                  <p className={`text-[10px] font-bold ${statusColor}`}>{statusText}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function PLProjectionChart({ batches, feedLogs, operationalCosts, sales }) {
  const data = useMemo(() => {
    // Aggregate across all active batches
    const totalAnimals = batches.reduce((s, b) => s + (b.total_animals || 0), 0)
    const avgEntryWeight = batches.reduce((s, b) => s + (b.avg_entry_weight_kg || 15), 0) / (batches.length || 1)
    const avgLatestWeight = batches.reduce((s, b) => s + (b.avg_latest_weight_kg || avgEntryWeight), 0) / (batches.length || 1)

    // Costs
    const feedCost = feedLogs.reduce((s, l) => s + (l.feed_cost_idr || 0), 0)
    const opCost = operationalCosts.reduce((s, c) => s + (c.amount_idr || 0), 0)
    const purchaseCost = batches.reduce((s, b) => s + (b.total_purchase_cost_idr || 0), 0)
    const totalCost = feedCost + opCost + purchaseCost

    // Revenue projection from last sale price
    const lastSale = [...sales].sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))[0]
    const pricePerKg = lastSale?.price_type === 'per_kg' ? lastSale.price_amount : null
    const projectedRevenue = pricePerKg
      ? totalAnimals * avgLatestWeight * pricePerKg
      : (lastSale?.price_amount ? totalAnimals * lastSale.price_amount : 0)
    const projectedProfit = projectedRevenue - totalCost

    if (totalCost === 0 && projectedRevenue === 0) return []

    return [
      { name: 'Biaya Keluar', value: Math.round(totalCost / 1_000_000), color: '#EF4444' },
      { name: 'Proj. Revenue', value: Math.round(projectedRevenue / 1_000_000), color: '#22C55E' },
      { name: 'Est. Profit', value: Math.round(projectedProfit / 1_000_000), color: projectedProfit >= 0 ? '#10B981' : '#F59E0B' },
    ]
  }, [batches, feedLogs, operationalCosts, sales])

  if (data.length === 0) return (
    <div className="h-[180px] flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-2xl">
      <Wallet size={24} className="text-white/10 mb-2" />
      <p className="text-xs font-bold text-white/30">Belum ada data keuangan</p>
      <p className="text-[10px] text-[#4B6478] mt-1">Catat pakan & penjualan untuk proyeksi</p>
    </div>
  )

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#4B6478', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#4B6478', fontWeight: 'bold' }} axisLine={false} tickLine={false} unit="Jt" />
          <Tooltip
            contentStyle={{ backgroundColor: '#0C1319', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
            formatter={(v) => [`Rp ${(v * 1_000_000).toLocaleString('id-ID')}`, '']}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


function KPICard({ label, value, sub, color = 'text-white', icon: Icon, glow }) {
  const glowMap = {
    green: 'hover:shadow-green-500/10 hover:border-green-500/20',
    amber: 'hover:shadow-amber-500/10 hover:border-amber-500/20',
    red: 'hover:shadow-red-500/10 hover:border-red-500/20',
    emerald: 'hover:shadow-emerald-500/10 hover:border-emerald-500/20',
  }
  const glowClass = glow ? glowMap[glow] ?? '' : ''
  return (
    <div className={`bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 transition-all duration-300 shadow-lg ${glowClass}`}>
      {Icon && (
        <div className={`inline-flex items-center justify-center w-6 h-6 rounded-lg mb-2.5 ${glow === 'green' ? 'bg-green-500/10' :
            glow === 'amber' ? 'bg-amber-500/10' :
              glow === 'red' ? 'bg-red-500/10' :
                glow === 'emerald' ? 'bg-emerald-500/10' : 'bg-white/5'
          }`}>
          <Icon size={12} className={color} />
        </div>
      )}
      <p className={`font-['Sora'] font-black text-2xl leading-none mb-1 ${color}`}>{value}</p>
      <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest">{label}</p>
      {sub && <p className={`text-[9px] mt-1 font-bold tracking-tight ${glow ? color + '/70' : 'text-[#4B6478]'}`}>{sub}</p>}
    </div>
  )
}

function BatchCard({ batch, onClick }) {
  const hari = calcHariDiFarm(batch.start_date)
  const TARGET_HARI = 90
  const sisaHari = Math.max(0, TARGET_HARI - hari)
  const estimasiPanen = addDays(new Date(batch.start_date), TARGET_HARI)

  const progress = Math.min(100, Math.round((hari / TARGET_HARI) * 100))
  const mortalitasPct = calcMortalitasDomba(batch.mortality_count, batch.total_animals)
  const isOverdue = hari > TARGET_HARI
  const isCritical = mortalitasPct > 3
  const isNearHarvest = sisaHari <= 14 && !isOverdue

  const adgVal = batch.avg_adg_gram ? Math.round(batch.avg_adg_gram) : null
  const adgColor = adgVal >= 150 ? 'text-green-400' : adgVal >= 100 ? 'text-amber-400' : adgVal ? 'text-red-400' : 'text-[#4B6478]'
  const progressColor = isOverdue ? 'bg-red-500' : progress > 80 ? 'bg-amber-500' : 'bg-green-500'
  const sisaColor = isOverdue ? 'text-red-400' : isNearHarvest ? 'text-amber-400' : 'text-white'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group bg-white/[0.03] hover:bg-white/[0.05] border rounded-3xl p-5 transition-all duration-300 ${isCritical ? 'border-red-500/20 hover:border-red-500/30' :
          isNearHarvest ? 'border-amber-500/20 hover:border-amber-500/30' :
            'border-white/[0.06] hover:border-white/[0.12]'
        }`}
    >
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    onClick={onClick}
                    className="font-['Sora'] font-bold text-base text-white hover:text-green-400 cursor-pointer transition-colors uppercase tracking-tight"
                  >
                    {batch.batch_code}
                  </span>
                  {isOverdue && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-black tracking-tighter uppercase">OVERDUE</span>
                  )}
                  {isNearHarvest && !isOverdue && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black tracking-tighter uppercase animate-pulse">Siap Panen</span>
                  )}
                  {isCritical && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-black tracking-tighter uppercase">🚨 Kritis</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[#4B6478]">
                  <MapPin size={11} />
                  <p className="text-[11px] font-bold uppercase tracking-wider">{batch.kandang_name}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-2xl font-black text-white font-['Sora'] leading-none mb-0.5">{batch.total_animals}</p>
                <p className="text-[9px] text-[#4B6478] font-black uppercase tracking-[0.15em]">Ekor</p>
              </div>
            </div>

            {/* Time Progress */}
            <div className="mb-5 bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-2xl">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide mb-2">
                <span className="text-[#4B6478]">Hari ke-<span className="text-white">{hari}</span></span>
                <span className={sisaColor}>{isOverdue ? `${hari - TARGET_HARI} Hari Overdue` : `Sisa ${sisaHari} Hari`}</span>
              </div>
              <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progress)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className={`h-full rounded-full ${progressColor}`}
                />
              </div>
              <div className="flex justify-between text-[9px] text-[#4B6478] font-medium mt-1.5">
                <span>Mulai: {format(new Date(batch.start_date), 'dd MMM', { locale: id })}</span>
                <span className={isNearHarvest ? 'text-amber-400 font-bold' : ''}>
                  Panen: {format(estimasiPanen, 'dd MMM yyyy', { locale: id })}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-2.5 text-center">
              <p className={`text-[13px] font-black leading-none mb-1 ${mortalitasPct > 3 ? 'text-red-400' : mortalitasPct > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                {mortalitasPct}%
              </p>
              <p className="text-[8px] text-[#4B6478] font-black uppercase tracking-widest">Mortalitas</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-2.5 text-center relative">
              <p className={`text-[13px] font-black leading-none mb-1 ${adgColor}`}>
                {adgVal ? `${adgVal}g` : '—'}
              </p>
              <p className="text-[8px] text-[#4B6478] font-black uppercase tracking-widest">ADG/Hari</p>
              {adgVal >= 150 && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              )}
            </div>
            <button
              onClick={onClick}
              className="bg-green-500/[0.06] border border-green-500/20 hover:bg-green-500/[0.12] rounded-2xl p-2.5 text-center flex flex-col items-center justify-center transition-all active:scale-95 group/btn"
            >
              <ArrowUpRight size={14} className="text-green-400 group-hover/btn:scale-110 transition-transform mb-0.5" />
              <p className="text-[8px] text-green-400/70 font-black uppercase tracking-widest">Detail</p>
            </button>
          </div>
        </div>

        {/* Redundant mini-map removed from BatchCard as per user request for unified view */}
      </div>
    </motion.div>
  )
}

export default function DombaPenggemukanBeranda() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const { data: activeBatches = [], isLoading: loadingActive } = useDombaActiveBatches()
  const { data: allBatches = [], isLoading: loadingAll } = useDombaBatches()

  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [activeAnimalIds, setActiveAnimalIds] = useState(new Set())

  useEffect(() => {
    if (!selectedBatchId && activeBatches.length > 0) {
      setSelectedBatchId(activeBatches[0].id)
    }
  }, [activeBatches, selectedBatchId])

  const { data: animals = [], isLoading: isLoadingAnimals } = useDombaAnimals(selectedBatchId)
  const { data: weightHistory = [], isLoading: loadingHistory } = useDombaBatchWeightHistory(selectedBatchId)
  const { data: feedLogs = [] } = useDombaFeedLogs(selectedBatchId)
  const { data: operationalCosts = [] } = useDombaOperationalCosts(selectedBatchId)
  const { data: sales = [] } = useDombaSales(selectedBatchId)

  const todayStr = new Date().toISOString().split('T')[0]
  const { data: todayTasks = [], isLoading: loadTasks } = usePeternakTaskInstances({
    due_date_from: todayStr,
    due_date_to: todayStr,
    livestockType: 'domba_penggemukan'
  })

  const isLoading = loadingActive || loadingAll || isLoadingAnimals || loadingHistory || loadTasks

  const chartData = useMemo(() => {
    const dateGroups = {}

    // 1. Tambahkan titik awal (entry_date & entry_weight_kg) dari setiap ternak
    animals.forEach(a => {
      if (a.entry_date && a.entry_weight_kg) {
        const dStr = a.entry_date.split('T')[0]
        if (!dateGroups[dStr]) dateGroups[dStr] = { date: dStr }
        dateGroups[dStr][a.id] = parseFloat(a.entry_weight_kg)
      }
    })

    // 2. Tambahkan data dari record timbang
    weightHistory.forEach(reg => {
      const dStr = reg.weigh_date
      if (!dateGroups[dStr]) dateGroups[dStr] = { date: dStr }
      dateGroups[dStr][reg.animal_id] = parseFloat(reg.weight_kg)
    })

    // 3. Convert to sorted array
    return Object.values(dateGroups).sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [weightHistory, animals])

  // Mapping animalId to color
  const animalColors = useMemo(() => {
    const mapping = {}
    animals.forEach((a, i) => {
      mapping[a.id] = CHART_COLORS[i % CHART_COLORS.length]
    })
    return mapping
  }, [animals])

  const toggleAnimal = (id) => {
    const next = new Set(activeAnimalIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      if (next.size >= 10) {
        toast.warning("Maksimal 10 ekor dapat ditampilkan sekaligus")
        return
      }
      next.add(id)
    }
    setActiveAnimalIds(next)
  }

  const kpi = useMemo(() => {
    const totalEkor = activeBatches.reduce((s, b) => s + (b.total_animals || 0), 0)
    const totalMati = activeBatches.reduce((s, b) => s + (b.mortality_count || 0), 0)
    const mortalitasPct = totalEkor > 0 ? ((totalMati / totalEkor) * 100).toFixed(1) : '0.0'

    // Rata-rata ADG tertimbang (berdasarkan jumlah hewan per batch)
    let weightedADGSum = 0
    let animalsWithADG = 0
    activeBatches.forEach(b => {
      if (b.avg_adg_gram) {
        weightedADGSum += parseFloat(b.avg_adg_gram) * (b.total_animals || 0)
        animalsWithADG += (b.total_animals || 0)
      }
    })
    const avgADG = animalsWithADG > 0 ? Math.round(weightedADGSum / animalsWithADG) : null

    // Proyeksi Panen (30 hari ke depan)
    const harvestSoonCount = activeBatches.filter(b => {
      const hari = calcHariDiFarm(b.start_date)
      return hari >= 60 && hari <= 90 // Sudah jalan 2 bulan, panen bulan depan
    }).reduce((s, b) => s + (b.total_animals || 0), 0)

    return {
      totalEkor,
      mortalitasPct,
      avgADG,
      activeBatchCount: activeBatches.length,
      closedCount: allBatches.filter(b => b.status === 'closed').length,
      harvestSoonCount
    }
  }, [activeBatches, allBatches])

  const alerts = useMemo(() => {
    const list = []

    // 1. Logic Standar (Hari & Mortalitas)
    activeBatches.forEach(b => {
      const hari = calcHariDiFarm(b.start_date)
      const mort = calcMortalitasDomba(b.mortality_count, b.total_animals)
      if (hari > 90) list.push({ type: 'danger', isCritical: true, msg: `${b.batch_code}: Hari ke-${hari} — melewati target 90 hari`, action: () => navigate(`${BASE}/ternak?batch=${b.id}`) })
      if (mort > 3) list.push({ type: 'danger', isCritical: true, msg: `${b.batch_code}: Mortalitas ${mort}% — di atas batas 3%`, action: () => navigate(`${BASE}/kesehatan`) })
      else if (mort > 1.5) list.push({ type: 'warning', msg: `${b.batch_code}: Mortalitas ${mort}% — perlu dipantau`, action: () => navigate(`${BASE}/kesehatan`) })
    })

    // 2. Logic Intensive v2.0 (2-Day Consecutive Waste)
    // Hanya cek feed logs dari selected batch untuk performa UI
    if (feedLogs.length >= 2) {
      // Ambil 2 log terakhir (sudah order descending di hook)
      const last = feedLogs[0]
      const prev = feedLogs[1]

      if (last.feed_orts_category === 'banyak' && prev.feed_orts_category === 'banyak') {
        const batch = activeBatches.find(b => b.id === selectedBatchId)
        list.push({
          type: 'danger',
          icon: Zap,
          msg: `KRITIS: 2 Hari berturut-turut pakan Sisa Banyak di ${batch?.batch_code || 'Batch ini'}. Potensi masalah palatabilitas atau kesehatan kelompok.`,
          action: () => navigate(`${BASE}/input-harian`)
        })
      }
    }

    // 3. Today Tasks Status
    const tasksDone = todayTasks.filter(t => t.status === 'selesai').length
    const tasksTotal = todayTasks.length
    if (tasksTotal > 0 && tasksDone < tasksTotal && new Date().getHours() >= 15) {
      list.push({
        type: 'warning',
        msg: `${tasksTotal - tasksDone} Tugas Harian belum selesai menjelang sore.`,
        action: () => navigate(`${BASE}/daily_task`)
      })
    }

    return list
  }, [activeBatches, feedLogs, selectedBatchId, todayTasks, navigate])

  const taskStats = useMemo(() => {
    const total = todayTasks.length
    const done = todayTasks.filter(t => t.status === 'selesai').length
    const pct = total === 0 ? 100 : Math.round((done / total) * 100)
    return { total, done, pct }
  }, [todayTasks])

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">

      {/* Header */}
      <header className="px-4 pt-10 pb-12 relative overflow-hidden group/header">
        {/* Premium background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 group-hover/header:scale-110 transition-transform duration-[10s] ease-linear"
          style={{ backgroundImage: 'url("/ui-pasture.png")' }}
        />
        {/* Dark Overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06090F] via-[#06090F]/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06090F] via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          <p className="text-[10px] text-green-400/60 font-black uppercase tracking-[0.2em] mb-1">
            Fattening Domba
          </p>
          <div className="flex items-center justify-between">
            <h1 className="font-['Sora'] font-black text-2xl text-white" suppressHydrationWarning>
              Selamat {getGreeting()}, <span className="text-green-400/90">{profile?.full_name?.split(' ')[0] ?? 'Peternak'}</span> 👋
            </h1>
            <button
              onClick={() => navigate(`${BASE}/batch`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-[11px] font-bold text-green-400 transition-all active:scale-95"
            >
              <Plus size={12} />
              Batch Baru
            </button>
          </div>
        </div>
      </header>

      {/* 1. Daily Task Audit */}
      <TaskCategoryAudit tasks={todayTasks} onNavigate={() => navigate(`${BASE}/daily_task`)} />

      {/* KPI Grid — Owner Centric Hierarchy */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 mt-4">
        {/* Row 1: Scale & Growth (Priority 1) */}
        <div className="col-span-2 sm:col-span-1">
          <KPICard
            label="Total Populasi"
            value={kpi.totalEkor}
            sub={`${kpi.activeBatchCount} Batch Aktif`}
            icon={Users}
            color="text-white"
            glow="emerald"
          />
        </div>

        <div className="col-span-1">
          <KPICard
            label="Performa ADG"
            value={kpi.avgADG ? `${kpi.avgADG}` : '—'}
            sub={kpi.avgADG >= 150 ? '🔥 Excellent' : kpi.avgADG >= 100 ? '⚡ On Track' : kpi.avgADG ? '⚠ Perlu Evaluasi' : 'Gram / Hari'}
            icon={TrendingUp}
            color={kpi.avgADG >= 150 ? 'text-green-400' : kpi.avgADG >= 100 ? 'text-amber-400' : 'text-red-400'}
            glow={kpi.avgADG >= 150 ? 'green' : kpi.avgADG >= 100 ? 'amber' : kpi.avgADG ? 'red' : undefined}
          />
        </div>

        {/* Row 2: Business & Risk (Priority 2) */}
        <div className="col-span-1">
          <KPICard
            label="Proyeksi Panen"
            value={kpi.harvestSoonCount > 0 ? kpi.harvestSoonCount : '—'}
            sub={kpi.harvestSoonCount > 0 ? 'Ekor Siap 30 Hari' : 'Belum Ada'}
            icon={Calendar}
            color={kpi.harvestSoonCount > 0 ? 'text-emerald-400' : 'text-[#4B6478]'}
            glow={kpi.harvestSoonCount > 0 ? 'emerald' : undefined}
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <KPICard
            label="Tingkat Mortalitas"
            value={`${kpi.mortalitasPct}%`}
            sub={parseFloat(kpi.mortalitasPct) > 3 ? '🚨 Di atas batas 3%' : parseFloat(kpi.mortalitasPct) > 0 ? '⚠ Dipantau' : '✓ Aman'}
            icon={Activity}
            color={parseFloat(kpi.mortalitasPct) > 3 ? 'text-red-400' : parseFloat(kpi.mortalitasPct) > 0 ? 'text-amber-400' : 'text-green-400'}
            glow={parseFloat(kpi.mortalitasPct) > 3 ? 'red' : parseFloat(kpi.mortalitasPct) > 0 ? 'amber' : 'green'}
          />
        </div>
      </div>

      {/* Denah Kandang Terpadu (Master Map) */}
      {activeBatches.length > 0 && (
        <section className="px-4 mt-6">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-5 sm:p-6 relative overflow-hidden shadow-2xl backdrop-blur-sm">
            {/* Subtle Gradient Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(34,197,94,0.05),transparent_70%)] pointer-events-none" />

            <div className="flex items-center justify-between mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                  <LayoutGrid size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-['Sora'] font-black text-base text-white tracking-tight">Denah Kandang Terpadu</h2>
                  <p className="text-[10px] text-[#4B6478] font-black uppercase tracking-[0.2em] mt-0.5">Monitoring Lokasi Ternak Real-time</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 rounded-3xl overflow-hidden border border-white/[0.04] bg-black/20">
              <KandangMiniMap batchIds={activeBatches.map(b => b.id)} className="min-h-[350px] lg:min-h-[450px] border-none bg-transparent" />
            </div>
          </div>
        </section>
      )}

      {/* 2-Column Desktop Layout Wrapper */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mt-6 px-4">

        {/* === LEFT COLUMN: Operational === */}
        <div className="space-y-6">
          {/* Batch Aktif */}
          <section className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-5 sm:p-6 relative overflow-hidden shadow-2xl">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <h2 className="font-['Sora'] font-black text-base text-white tracking-tight">Batch Aktif</h2>
                </div>
                {activeBatches.length > 0 && (
                  <p className="text-[10px] text-[#4B6478] font-black uppercase tracking-[0.2em]">{activeBatches.length} Batch Berjalan</p>
                )}
              </div>
              <button
                onClick={() => navigate(`${BASE}/batch`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-[#94A3B8] hover:text-white transition-all active:scale-95 uppercase tracking-widest"
              >
                Lihat semua <ChevronRight size={13} />
              </button>
            </div>

            {activeBatches.length === 0 ? (
              <div className="relative group overflow-hidden rounded-[2rem] border border-white/10">
                {/* Background Hero for Empty State */}
                <div
                  className="absolute inset-0 bg-cover bg-center grayscale opacity-10 group-hover:scale-110 group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-700"
                  style={{ backgroundImage: 'url("/ui-hero-sheep.png")' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1319] via-[#0C1319]/80 to-transparent" />

                <div className="relative z-10 text-center py-16 px-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <LayoutGrid size={40} className="text-green-500" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 font-['Sora'] tracking-tight">Belum Ada Batch Aktif</h3>
                  <p className="text-xs text-[#4B6478] mb-8 max-w-[240px] mx-auto leading-relaxed">Mulai monitoring penggemukan domba Bapak dengan membuat batch pertama sekarang.</p>
                  <button
                    onClick={() => navigate(`${BASE}/batch`)}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white text-xs font-black rounded-2xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] active:scale-95 uppercase tracking-widest"
                  >
                    <Plus size={16} />
                    Buat Batch Baru
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                {activeBatches.map(batch => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    onClick={() => navigate(`${BASE}/ternak?batch=${batch.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Alerts List */}
          <section>
            {alerts.length > 0 ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-2" suppressHydrationWarning>
                <h2 className="font-['Sora'] font-bold text-xs text-[#4B6478] mb-2 uppercase tracking-widest pl-1">Perhatian Khusus</h2>
                {alerts.map((a, i) => (
                  <button
                    key={i}
                    onClick={a.action}
                    className={`w-full text-left flex items-start justify-between gap-3 px-4 py-3 rounded-2xl transition hover:brightness-110 border cursor-pointer ${a.type === 'danger'
                        ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                        : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                      }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={15} className={`shrink-0 mt-0.5 ${a.type === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
                      <span className={`text-xs font-bold font-['Sora'] leading-tight ${a.type === 'danger' ? 'text-red-200' : 'text-amber-200'}`}>{a.msg}</span>
                    </div>
                    <ChevronRight size={14} className="opacity-40 shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-[120px] bg-emerald-500/[0.02] border border-emerald-500/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
                <p className="text-xs font-bold text-emerald-400">Seluruh Kondisi Aman</p>
                <p className="text-[10px] text-[#4B6478] mt-1">Tidak ada peringatan kritis saat ini</p>
              </div>
            )}
          </section>
        </div>

        {/* === RIGHT COLUMN: Analytics === */}
        <div className="space-y-6">

          {/* P&L Projections */}
          <section>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Wallet size={14} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="font-['Sora'] font-bold text-sm text-white">P&L Projections</h2>
                  <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5">Estimasi Pendapatan & Profit</p>
                </div>
              </div>

              <PLProjectionChart
                batches={activeBatches}
                feedLogs={feedLogs}
                operationalCosts={operationalCosts}
                sales={sales}
              />
            </div>
          </section>

          {/* ADG Chart */}
          <section>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-['Sora'] font-bold text-sm text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-green-500/10">
                      <BarChart2 size={14} className="text-green-400" />
                    </div>
                    Grafik Pertumbuhan
                  </h2>
                  <p className="text-[10px] text-[#4B6478] mt-1.5 uppercase tracking-wider font-bold pl-8">Bobot Badan Individual (kg)</p>
                </div>

                {activeBatches.length > 1 && (
                  <select
                    value={selectedBatchId}
                    onChange={(e) => {
                      setSelectedBatchId(e.target.value)
                      setActiveAnimalIds(new Set())
                    }}
                    className="bg-[#0C1319] border border-white/10 rounded-xl px-3 py-1.5 text-[11px] font-bold text-white outline-none focus:border-green-500/50 cursor-pointer"
                  >
                    {activeBatches.map(b => (
                      <option key={b.id} value={b.id}>{b.batch_code} ({b.kandang_name})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Animal Selector Pills */}
              <div className="flex flex-wrap gap-1.5 mb-4 max-h-[120px] overflow-y-auto custom-scrollbar">
                {animals.length > 0 ? (
                  <>
                    {animals.map((a) => {
                      const isActive = activeAnimalIds.has(a.id)
                      const color = animalColors[a.id]
                      return (
                        <button
                          key={a.id}
                          onClick={() => toggleAnimal(a.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border flex items-center gap-1.5 shrink-0 ${isActive
                              ? 'text-white border-transparent'
                              : 'bg-white/5 border-white/10 text-[#4B6478] hover:bg-white/10'
                            }`}
                          style={isActive ? { backgroundColor: color } : {}}
                        >
                          {isActive ? <CheckCircle2 size={10} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />}
                          {a.ear_tag}
                        </button>
                      )
                    })}
                    {activeAnimalIds.size > 0 && (
                      <button
                        onClick={() => setActiveAnimalIds(new Set())}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1 shrink-0"
                      >
                        <RefreshCw size={10} />
                        Reset
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-[#4B6478]">Tidak ada ternak di batch ini</p>
                )}
              </div>

              {/* Chart Area */}
              <div className="h-[260px] sm:h-[300px] w-full relative">
                {activeAnimalIds.size === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/5 rounded-2xl">
                    <MousePointer2 size={32} className="text-white/10 mb-3" />
                    <p className="text-xs font-bold text-white">Pilih ekor di atas</p>
                    <p className="text-[10px] text-[#4B6478] mt-1">Bandingkan pertumbuhan antar domba dalam satu grafik</p>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/[0.01] rounded-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                      <Scale size={24} className="text-[#4B6478]" />
                    </div>
                    <p className="text-xs font-bold text-white">Belum ada data timbang</p>
                    <p className="text-[10px] text-[#4B6478] mt-1">Segera catat timbangan untuk melihat grafik</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        hide
                      />
                      <YAxis
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tick={{ fontSize: 10, fill: '#4B6478', fontWeight: 'bold' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0C1319', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                        labelFormatter={(val) => format(new Date(val), 'd MMMM yyyy', { locale: id })}
                        labelStyle={{ marginBottom: '4px', color: '#94A3B8' }}
                      />
                      <ReferenceLine y={15} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                      {[...activeAnimalIds].map(id => {
                        const animal = animals.find(a => a.id === id)
                        return (
                          <Line
                            key={id}
                            type="monotone"
                            dataKey={id}
                            name={animal?.ear_tag || 'Domba'}
                            stroke={animalColors[id]}
                            strokeWidth={3}
                            dot={chartData.length === 1 ? { r: 4, strokeWidth: 0 } : false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                            animationDuration={1000}
                          />
                        )
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 4. Riwayat Batch Selesai */}
      {kpi.closedCount > 0 && (
        <section className="px-4 mt-4 mb-2">
          <button
            onClick={() => navigate(`${BASE}/laporan`)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/10 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Wheat size={14} className="text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">{kpi.closedCount} Batch Selesai</p>
                <p className="text-[10px] text-[#4B6478] font-bold">Lihat laporan &amp; KPI historis →</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-[#4B6478] group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
          </button>
        </section>
      )}

    </div>
  )
}