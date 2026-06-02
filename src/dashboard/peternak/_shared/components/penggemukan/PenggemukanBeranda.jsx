import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePeternakTaskInstances } from '@/lib/hooks/usePeternakTaskData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import {
  MobileFinancePeek,
  MobileHeroKPI,
  MobileTaskProgress,
  MobileQuickActions,
  MobileSectionHeader,
} from '@/dashboard/peternak/_shared/components/MobileViewPeternak'
import { MobileHeader } from '@/dashboard/peternak/_shared/components/MobileViewPeternak/MobileHeader'
import { MobileBatchRow } from '@/dashboard/peternak/_shared/components/MobileViewPeternak/MobileBatchRow'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, TrendingUp, Activity, Calendar, AlertTriangle,
  ChevronRight, ChevronDown, ArrowUpRight, BarChart2,
  CheckCircle2, RefreshCw, MousePointer2, Wheat, Zap, Plus,
  Scale, Wallet, LayoutGrid, Settings2, Sparkles, Check, ClipboardList, Tag,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { KPICard } from './KPICard'
import { PLProjectionChart } from './PLProjectionChart'
import { TaskCategoryAudit } from './TaskCategoryAudit'
import { BatchCard } from './BatchCard'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return 'pagi'
  if (h < 15) return 'siang'
  if (h < 19) return 'sore'
  return 'malam'
}

export function PenggemukanBeranda({ config, hooks, KandangMiniMap }) {
  const { profile, tenant } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 767px)')

  const {
    useActiveBatches, useBatches, useAnimalsByBatches,
    useBatchWeightHistoryByBatches, useBatchWeightHistory,
    useFeedLogsByBatches, useFeedLogs,
    useOperationalCostsByBatches, useOperationalCosts,
    useSalesByBatches, useSales,
  } = hooks

  const {
    BASE, animalLabel, businessLabel, livestockType,
    targetDays, adgGood, adgOk, mortalityThreshold, mortalityWarn,
    animalEmoji, chartColors,
    calcHariDiFarm, calcMortalitas, calcADGFromRecords, calcADG,
  } = config

  const { data: activeBatches = [], isLoading: loadingActive } = useActiveBatches()
  const { data: allBatches = [], isLoading: loadingAll } = useBatches()
  const [selectedBatchId, setSelectedBatchId] = useState('all')
  const [activeAnimalIds, setActiveAnimalIds] = useState(new Set())
  const [batchOpen, setBatchOpen] = useState(false)

  const isAllBatches = selectedBatchId === 'all'
  const activeBatchIds = useMemo(() => activeBatches.map(b => b.id), [activeBatches])

  // Data fetching — ALWAYS call all hooks unconditionally (Rules of Hooks).
  const { data: allActiveAnimals = [], isLoading: isLoadingAnimals } = useAnimalsByBatches(activeBatchIds)
  const animals = isAllBatches ? allActiveAnimals : allActiveAnimals.filter(a => a.batch_id === selectedBatchId)

  // Weight history — call BOTH hooks every render, use the right one
  const { data: weightHistoryMulti = [], isLoading: loadingHistoryMulti } = useBatchWeightHistoryByBatches(activeBatchIds)
  const { data: weightHistorySingle = [], isLoading: loadingHistorySingle } = useBatchWeightHistory(isAllBatches ? null : selectedBatchId)
  const weightHistory = isAllBatches ? weightHistoryMulti : weightHistorySingle
  const loadingHistory = isAllBatches ? loadingHistoryMulti : loadingHistorySingle

  // Feed logs
  const { data: feedLogsMulti = [] } = useFeedLogsByBatches(activeBatchIds)
  const { data: feedLogsSingle = [] } = useFeedLogs(isAllBatches ? null : selectedBatchId)
  const feedLogs = isAllBatches ? feedLogsMulti : feedLogsSingle

  // Operational costs
  const { data: opCostsMulti = [] } = useOperationalCostsByBatches(activeBatchIds)
  const { data: opCostsSingle = [] } = useOperationalCosts(isAllBatches ? null : selectedBatchId)
  const operationalCosts = isAllBatches ? opCostsMulti : opCostsSingle

  // Sales
  const { data: salesMulti = [] } = useSalesByBatches(activeBatchIds)
  const { data: salesSingle = [] } = useSales(isAllBatches ? null : selectedBatchId)
  const sales = isAllBatches ? salesMulti : salesSingle

  const todayStr = new Date().toISOString().split('T')[0]
  const { data: todayTasks = [], isLoading: loadTasks } = usePeternakTaskInstances({
    due_date_from: todayStr,
    due_date_to: todayStr,
    livestockType,
  })

  const isLoading = loadingActive || loadingAll || isLoadingAnimals || loadingHistory || loadTasks

  const hasActiveBatches = activeBatches.length > 0
  const hasAnimals = allActiveAnimals.length > 0
  const hasFeedLogs = feedLogsMulti.length > 0
  const hasWeightData = weightHistoryMulti.length >= 2
  const hasFinancialData = feedLogsMulti.length > 0 || opCostsMulti.length > 0 || salesMulti.length > 0
  const isTrueEmptyState = !hasActiveBatches && !hasAnimals && !hasFinancialData && !hasWeightData
  
  const hasKandangData = activeBatches.some(b => b.kandang_id || b.kandang_name)
  const hasDailyTasks = todayTasks.length > 0

  const isChecklistCompleted = hasActiveBatches && hasAnimals && hasFeedLogs && weightHistoryMulti.length > 0

  const renderEmptyTasksCard = () => {
    const plan = tenant?.plan || 'starter'
    const isStarter = plan === 'starter' && !tenant?.trial_ends_at
    const canManageTasks = !isStarter && ['owner', 'manajer'].includes(profile?.role)

    return (
      <div className="bg-white/[0.03] border border-white/[0.03] rounded-3xl p-5 text-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3">
            <ClipboardList size={20} className="text-amber-400" />
          </div>
          <h4 className="text-xs font-bold text-white mb-1 font-['Sora']">Belum Ada Tugas Hari Ini</h4>
          <p className="text-[10px] text-slate-400 mb-4 max-w-[280px]">
            Semua rutinitas harian aman atau belum diatur.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`${BASE}/daily_task`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black rounded-xl transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-md shadow-green-500/5 uppercase tracking-wider"
            >
              <ClipboardList size={11} />
              Buka Tugas Harian
            </button>
            {canManageTasks && (
              <button
                onClick={() => navigate(`${BASE}/task_settings`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 hover:bg-green-500/15 border border-green-500/10 text-green-400 text-[10px] font-black rounded-xl transition-all active:scale-95 whitespace-nowrap cursor-pointer uppercase tracking-wider"
              >
                <Settings2 size={11} />
                Pengaturan Tugas
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const _renderEmptyGrowthChart = () => {
    if (!hasActiveBatches) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-[#06090F]/20 border border-white/[0.02] rounded-2xl h-[260px] sm:h-[300px]">
          <div className="w-12 h-12 rounded-2xl bg-green-500/5 flex items-center justify-center mb-3 shadow-lg">
            <Scale size={24} className="text-green-400 opacity-40" />
          </div>
          <h4 className="text-xs font-bold text-white mb-1 font-['Sora']">Belum Ada Kelompok (Batch)</h4>
          <p className="text-[10px] text-slate-400 mb-5 max-w-[260px]">
            Buat kelompok penggemukan terlebih dahulu untuk mulai merekam data berat badan.
          </p>
          <button
            onClick={() => navigate(`${BASE}/batch`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black rounded-xl transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-md shadow-green-500/5 uppercase tracking-wider"
          >
            <Plus size={11} />
            Buat Batch Baru
          </button>
        </div>
      )
    }

    if (allActiveAnimals.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-[#06090F]/20 border border-white/[0.02] rounded-2xl h-[260px] sm:h-[300px]">
          <div className="w-12 h-12 rounded-2xl bg-green-500/5 flex items-center justify-center mb-3 shadow-lg">
            <Scale size={24} className="text-green-400 opacity-60" />
          </div>
          <h4 className="text-xs font-bold text-white mb-1 font-['Sora']">Belum Ada Data {animalLabel}</h4>
          <p className="text-[10px] text-slate-400 mb-5 max-w-[260px]">
            Tambahkan data {animalLabel.toLowerCase()} ke dalam kelompok Anda agar grafik berat dapat ditampilkan.
          </p>
          <button
            onClick={() => navigate(`${BASE}/ternak`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black rounded-xl transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-md shadow-green-500/5 uppercase tracking-wider"
          >
            <Plus size={11} />
            Tambah {animalLabel}
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center text-center p-6 bg-[#06090F]/20 border border-white/[0.02] rounded-2xl h-[260px] sm:h-[300px]">
        <div className="w-12 h-12 rounded-2xl bg-green-500/5 flex items-center justify-center mb-3 shadow-lg">
          <Scale size={24} className="text-green-400" />
        </div>
        <h4 className="text-xs font-bold text-white mb-1 font-['Sora']">Belum Ada Data Timbangan</h4>
        <p className="text-[10px] text-slate-400 mb-5 max-w-[260px]">
          Data bobot badan belum terekam. Lakukan penimbangan berkala untuk memantau kenaikan berat harian (ADG).
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`${BASE}/ternak`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black rounded-xl transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-md shadow-green-500/5 uppercase tracking-wider"
          >
            <Scale size={11} />
            Catat Timbangan
          </button>
        </div>
      </div>
    )
  }

  const renderCompletedChecklistProgress = () => (
    <div className="bg-[#0C1319]/40 border border-white/[0.03] rounded-2xl p-4 flex items-center justify-between gap-4 max-w-xl mx-auto shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
          <CheckCircle2 size={16} />
        </div>
        <div>
          <p className="text-xs font-bold text-white font-['Sora']">Langkah Awal Selesai</p>
          <p className="text-[10px] text-slate-400">Selamat! Seluruh sistem pencatatan awal Anda sudah siap digunakan.</p>
        </div>
      </div>
      <span className="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
        100% Selesai
      </span>
    </div>
  )

  const renderSetupChecklist = () => {
    const steps = [
      {
        id: 'batch',
        label: 'Buat Batch / Periode',
        description: 'Contoh: Batch Juni 2026 atau Kandang A.',
        completed: hasActiveBatches,
        cta: 'Buat Batch Baru',
        icon: Plus,
        action: () => navigate(`${BASE}/batch`),
      },
      {
        id: 'ternak',
        label: `Tambah Data ${animalLabel}`,
        description: `Masukkan data ${animalLabel.toLowerCase()} ke dalam batch aktif.`,
        completed: allActiveAnimals.length > 0,
        cta: `Tambah ${animalLabel}`,
        icon: Plus,
        action: () => navigate(`${BASE}/ternak`),
      },
      {
        id: 'pakan',
        label: 'Catat Pakan Pertama',
        description: 'Masukkan catatan pemberian pakan harian kelompok.',
        completed: feedLogsMulti.length > 0,
        cta: 'Catat Pakan Pertama',
        icon: Wheat,
        action: () => navigate(`${BASE}/pakan`),
      },
      {
        id: 'bobot',
        label: 'Catat Bobot',
        description: 'Catat timbangan berkala untuk memantau pertumbuhan.',
        completed: weightHistoryMulti.length > 0,
        cta: 'Catat Bobot',
        icon: Scale,
        action: () => navigate(`${BASE}/ternak`),
      }
    ]

    const activeStepIndex = steps.findIndex(s => !s.completed)
    const completedCount = steps.filter(s => s.completed).length
    const progressPercent = Math.round((completedCount / steps.length) * 100)

    // Dynamically soften helper descriptions of locked steps
    steps.forEach((step, idx) => {
      if (idx > activeStepIndex) {
        if (step.id === 'ternak') {
          step.description = 'Harus membuat batch aktif terlebih dahulu.'
        } else if (step.id === 'pakan') {
          step.description = `Harus membuat batch dan menambah data ${animalLabel.toLowerCase()} terlebih dahulu.`
        } else if (step.id === 'bobot') {
          step.description = `Harus membuat batch dan menambah data ${animalLabel.toLowerCase()} terlebih dahulu.`
        }
      }
    })

    const title = isTrueEmptyState 
      ? 'Mulai dari sini, Pak/Bu 👋' 
      : `Panduan Memulai Penggemukan ${animalLabel}`

    const subtitle = isTrueEmptyState
      ? 'Buat batch pertama dulu. Setelah itu, Anda bisa menambahkan data ternak, pakan, dan bobot.'
      : 'Selesaikan langkah-langkah di bawah untuk memulai pemantauan penuh.'

    return (
      <div className="bg-[#0C1319]/80 backdrop-blur-xl border border-green-500/10 rounded-3xl p-8 md:p-10 lg:p-12 shadow-2xl relative overflow-hidden max-w-5xl mx-auto">
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles size={22} className="text-green-400 animate-pulse" />
                <h3 className="font-['Sora'] font-black text-lg sm:text-xl md:text-2xl lg:text-3xl text-white tracking-tight">{title}</h3>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-slate-400">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-green-400 bg-green-500/10 border border-green-500/20 px-5 py-2 rounded-full uppercase tracking-wider">
                {completedCount} / 4 Selesai ({progressPercent}%)
              </span>
            </div>
          </div>

          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-6">
            <div 
              className="h-full bg-green-500 transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Mode Pemula Banner */}
          <div className="flex items-start gap-4 bg-green-500/5 rounded-2xl p-5 mb-6">
            <Sparkles size={20} className="text-green-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-sm text-green-300/90 leading-normal">
              <p className="font-bold text-base">Mode Pemula Aktif</p>
              {isTrueEmptyState ? (
                <p className="mt-1.5 text-slate-400 text-sm leading-relaxed">Tidak perlu isi semua sekaligus. Mulai dari buat batch dulu.</p>
              ) : (
                <p className="mt-1.5 text-slate-400 text-sm leading-relaxed">Lakukan pengisian data langkah demi langkah untuk mengaktifkan grafik dan analisis performa ternak Anda.</p>
              )}
            </div>
          </div>

          {/* Stepper Steps (Horizontal on Desktop, Vertical on Mobile) */}
          <div className="hidden md:grid grid-cols-4 gap-6 mb-8">
            {steps.map((step, idx) => {
              const isCompleted = step.completed
              const isActive = idx === activeStepIndex

              return (
                <div 
                  key={step.id} 
                  className={cn(
                    "relative p-6 rounded-2xl border transition-all flex flex-col justify-between min-h-[180px]",
                    isCompleted 
                      ? "bg-white/[0.02] border-white/[0.03] opacity-60"
                      : isActive
                        ? "bg-white/[0.04] border-white/[0.08] shadow-lg"
                        : "bg-white/[0.01] border-white/[0.03] opacity-35 select-none"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-3.5">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border shrink-0",
                        isCompleted 
                          ? "bg-green-500/10 border-green-500/20 text-green-400"
                          : isActive
                            ? "bg-green-500/15 border-green-500/25 text-green-400"
                            : "bg-white/5 border-white/[0.05] text-slate-500"
                      )}>
                        {isCompleted ? <Check size={16} className="stroke-[3px]" /> : idx + 1}
                      </div>
                      <span className={cn(
                        "text-sm md:text-base lg:text-lg font-bold font-['Sora'] leading-tight",
                        isCompleted ? "text-slate-400 line-through" : "text-white"
                      )}>
                        {step.label}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed mt-2">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="md:hidden space-y-4 mb-6">
            {steps.map((step, idx) => {
              const isCompleted = step.completed
              const isActive = idx === activeStepIndex

              return (
                <div 
                  key={step.id} 
                  className={cn(
                    "flex items-start gap-5 p-5 rounded-2xl border transition-all",
                    isCompleted 
                      ? "bg-white/[0.02] border-white/[0.03] opacity-60"
                      : isActive
                        ? "bg-white/[0.03] border-white/[0.05] shadow-lg"
                        : "bg-white/[0.01] border-white/[0.03] opacity-30 select-none"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border shrink-0 mt-0.5",
                    isCompleted 
                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                      : isActive
                        ? "bg-green-500/15 border-green-500/25 text-green-400"
                        : "bg-white/5 border-white/[0.05] text-slate-600"
                  )}>
                    {isCompleted ? <Check size={14} className="stroke-[3px]" /> : idx + 1}
                  </div>
                  <div className="flex-1">
                    <span className={cn(
                      "text-base font-bold font-['Sora'] block leading-none",
                      isCompleted ? "text-slate-400 line-through" : "text-white"
                    )}>
                      {step.label}
                    </span>
                    <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Single Primary CTA Button for the Active Step */}
          {activeStepIndex !== -1 && (
            <div className="flex justify-center mt-6 pt-6">
              <button
                onClick={steps[activeStepIndex].action}
                className="w-full sm:w-auto flex items-center justify-center gap-3.5 px-10 py-4.5 bg-green-600 hover:bg-green-500 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-green-500/10 hover:shadow-green-500/20 active:scale-95 transition-all cursor-pointer uppercase tracking-widest"
              >
                <Plus size={20} className="stroke-[2.5px]" />
                {steps[activeStepIndex].cta}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

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
      mapping[a.id] = chartColors[i % chartColors.length]
    })
    return mapping
  }, [animals, chartColors])

  const toggleAnimal = (id) => {
    const next = new Set(activeAnimalIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      if (next.size >= 10) {
        toast.warning('Maksimal 10 ekor dapat ditampilkan sekaligus')
        return
      }
      next.add(id)
    }
    setActiveAnimalIds(next)
  }

  // Compute avg ADG per batch from live animal weight records
  const batchAdgMap = useMemo(() => {
    const map = {}
    activeBatches.forEach(b => {
      const batchAnimals = allActiveAnimals.filter(a => a.batch_id === b.id)
      const vals = batchAnimals.map(a => {
        const wRec = a.weight_records ?? []
        const hari = calcHariDiFarm(a.entry_date, a.exit_date)
        return calcADGFromRecords(wRec, a.entry_date, a.entry_weight_kg)
          || (a.latest_weight_kg > a.entry_weight_kg && hari > 0
              ? calcADG(a.entry_weight_kg, a.latest_weight_kg, hari)
              : 0)
      }).filter(v => v > 0)
      map[b.id] = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0
    })
    return map
  }, [activeBatches, allActiveAnimals, calcHariDiFarm, calcADGFromRecords, calcADG])

  const kpi = useMemo(() => {
    const totalEkor = allActiveAnimals.filter(a => a.status !== 'sold' && !a.is_sold && !a.is_sale).length
    const totalMati = activeBatches.reduce((s, b) => s + (b.mortality_count || 0), 0)
    const mortalitasPct = totalEkor > 0 ? ((totalMati / totalEkor) * 100).toFixed(1) : '0.0'

    // ADG: weighted average from batchAdgMap
    let weightedADGSum = 0
    let animalsWithADG = 0
    activeBatches.forEach(b => {
      const adg = batchAdgMap[b.id] || 0
      if (adg > 0) {
        weightedADGSum += adg * (b.total_animals || 0)
        animalsWithADG += (b.total_animals || 0)
      }
    })
    const avgADG = animalsWithADG > 0 ? Math.round(weightedADGSum / animalsWithADG) : null

    // Proyeksi Panen (batch approaching targetDays)
    const harvestSoonCount = activeBatches.filter(b => {
      const hari = calcHariDiFarm(b.start_date)
      return hari >= targetDays * 0.67 && hari <= targetDays
    }).reduce((s, b) => s + (b.total_animals || 0), 0)

    // Bobot rata-rata dari animals langsung
    const activeAnimals = allActiveAnimals.filter(a => a.status !== 'sold' && !a.is_sold && !a.is_sale)
    const avgWeight = activeAnimals.length
      ? (activeAnimals.reduce((s, a) => s + (parseFloat(a.latest_weight_kg ?? a.entry_weight_kg) || 0), 0) / activeAnimals.length).toFixed(1)
      : null

    return {
      totalEkor,
      mortalitasPct,
      avgADG,
      avgWeight,
      activeBatchCount: activeBatches.length,
      closedCount: allBatches.filter(b => b.status === 'closed').length,
      harvestSoonCount,
    }
  }, [activeBatches, allBatches, allActiveAnimals, batchAdgMap, calcHariDiFarm, targetDays])

  const alerts = useMemo(() => {
    const list = []

    // 1. Logic Standar (Hari & Mortalitas)
    activeBatches.forEach(b => {
      const hari = calcHariDiFarm(b.start_date)
      const mort = calcMortalitas(b.mortality_count, b.total_animals)
      if (hari > targetDays) list.push({ type: 'danger', isCritical: true, msg: `${b.batch_code}: Hari ke-${hari} — melewati target ${targetDays} hari`, action: () => navigate(`${BASE}/ternak?batch=${b.id}`) })
      if (mort > mortalityThreshold) list.push({ type: 'danger', isCritical: true, msg: `${b.batch_code}: Mortalitas ${mort}% — di atas batas ${mortalityThreshold}%`, action: () => navigate(`${BASE}/kesehatan`) })
      else if (mort > mortalityWarn) list.push({ type: 'warning', msg: `${b.batch_code}: Mortalitas ${mort}% — perlu dipantau`, action: () => navigate(`${BASE}/kesehatan`) })
    })

    // 2. Logic Intensive v2.0 (2-Day Consecutive Waste)
    if (feedLogs.length >= 2) {
      const last = feedLogs[0]
      const prev = feedLogs[1]

      if (last.feed_orts_category === 'banyak' && prev.feed_orts_category === 'banyak') {
        const batch = activeBatches.find(b => b.id === selectedBatchId)
        list.push({
          type: 'danger',
          icon: Zap,
          msg: `KRITIS: 2 Hari berturut-turut pakan Sisa Banyak di ${batch?.batch_code || 'Batch ini'}. Potensi masalah palatabilitas atau kesehatan kelompok.`,
          action: () => navigate(`${BASE}/stok-pakan`),
        })
      }
    }

    // 3. Today Tasks Status
    const pendingTasks = todayTasks.filter(t => t.status !== 'selesai')
    const tasksTotal = todayTasks.length
    if (tasksTotal > 0 && pendingTasks.length > 0 && new Date().getHours() >= 15) {
      list.push({
        type: 'warning',
        msg: `${pendingTasks.length} Tugas Harian belum selesai menjelang sore.`,
        pendingTasks,
        action: () => navigate(`${BASE}/daily_task`),
      })
    }

    return list
  }, [activeBatches, feedLogs, selectedBatchId, todayTasks, navigate, BASE, calcHariDiFarm, calcMortalitas, targetDays, mortalityThreshold, mortalityWarn])

  // taskStats removed — not used in render

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-28">

      {/* ── HEADER & MOBILE LAYOUT ─────────────────────────────────────────────── */}
      {isMobile ? (
        <div className="pb-24">
          <MobileHeader showGreeting businessLabel={businessLabel} />

          <div className="space-y-4 relative z-20 pt-4">
            {/* Setup progress checklist if incomplete */}
            {!isChecklistCompleted && (
              <div className="px-5">
                {renderSetupChecklist()}
              </div>
            )}

            {/* HERO KPI CARD */}
            {hasAnimals && (
              <div className="px-5">
                <MobileHeroKPI
                  totalEkor={kpi.totalEkor}
                  activeBatchCount={kpi.activeBatchCount}
                  harvestSoonCount={kpi.harvestSoonCount}
                  avgADG={kpi.avgADG}
                  mortalitasPct={kpi.mortalitasPct}
                  avgWeight={kpi.avgWeight}
                  showADG={hasWeightData}
                />
              </div>
            )}

            {/* TUGAS HARI INI */}
            {hasAnimals && (hasDailyTasks || isChecklistCompleted) && (
              <div>
                <MobileSectionHeader
                  label={`Tugas hari ini · ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}`}
                  action="Semua"
                  onAction={() => navigate(`${BASE}/daily_task`)}
                />
                <div className="px-5">
                  {!hasDailyTasks ? (
                    renderEmptyTasksCard()
                  ) : (
                    <MobileTaskProgress
                      tasks={todayTasks}
                      onNavigate={() => navigate(`${BASE}/daily_task`)}
                    />
                  )}
                </div>
              </div>
            )}

            {/* BATCH AKTIF */}
            {activeBatches.length > 0 && (
              <div>
                <MobileSectionHeader
                  label="Batch aktif"
                  action="Semua"
                  onAction={() => navigate(`${BASE}/batch`)}
                />
                <div className="px-5 space-y-3">
                  {activeBatches.map((batch, i) => {
                    const activeCount = allActiveAnimals.filter(a => a.batch_id === batch.id && a.status !== 'sold' && !a.is_sold && !a.is_sale).length
                    const batchAnimals = allActiveAnimals.filter(a => a.batch_id === batch.id)
                    const avgWeight = batchAnimals.length
                      ? Math.round(batchAnimals.reduce((s, a) => s + (parseFloat(a.latest_weight_kg ?? a.entry_weight_kg) || 0), 0) / batchAnimals.length)
                      : 0
                    const normalizedBatch = {
                      ...batch,
                      population: activeCount || batch.total_animals || 0,
                      mortality: batch.mortality_count || 0,
                      total_initial: (batch.total_animals || 0) + (batch.mortality_count || 0),
                      ageInDays: calcHariDiFarm(batch.start_date),
                      adg: batchAdgMap[batch.id] || 0,
                      avgWeight,
                      code: batch.batch_code || `Batch ${i + 1}`,
                      location: batch.kandang_name || 'Kandang Utama',
                    }

                    return (
                      <MobileBatchRow
                        key={batch.id}
                        batch={normalizedBatch}
                        targetDays={targetDays}
                        onClick={() => navigate(`${BASE}/ternak?batch=${batch.id}`)}
                        index={i}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* AKSI CEPAT */}
            {hasAnimals && (
              <div>
                <MobileSectionHeader label="Aksi cepat" />
                <div className="px-5">
                  <MobileQuickActions
                    onAction={(key) => {
                      if (key === 'timbang') navigate(`${BASE}/ternak`)
                      else if (key === 'pakan') navigate(`${BASE}/stok-pakan`)
                      else if (key === 'sehat') navigate(`${BASE}/kesehatan`)
                      else if (key === 'catatan') navigate(`${BASE}/daily_task`)
                    }}
                  />
                </div>
              </div>
            )}

            {/* PERLU PERHATIAN — only if alerts exist */}
            {hasAnimals && alerts.length > 0 && (
              <div>
                <MobileSectionHeader
                  label="Perlu perhatian"
                  action={`${alerts.length} item`}
                />
                <div className="px-5 space-y-2">
                  {alerts.map((a, i) => (
                    <button
                      key={i}
                      onClick={a.action}
                      className={`w-full flex items-center gap-3 p-3.5 bg-white/[0.03] border border-white/[0.03] border-l-[3px] ${
                        a.type === 'danger' ? 'border-l-red-500' : 'border-l-amber-400'
                      } rounded-xl text-left active:scale-[0.98] transition-transform`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        a.type === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'
                      }`}>
                        <AlertTriangle size={15} className={a.type === 'danger' ? 'text-red-400' : 'text-amber-400'} />
                      </div>
                      <p className="flex-1 text-[12px] text-white/90 font-medium leading-snug line-clamp-2">{a.msg}</p>
                      <ChevronRight size={14} className="text-[#8DA2B5] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* DENAH KANDANG */}
            {KandangMiniMap && hasAnimals && activeBatches.length > 0 && (
              <div>
                <MobileSectionHeader 
                  label="Denah kandang" 
                  action={!hasKandangData ? undefined : "Buka penuh"} 
                  onAction={() => navigate(`${BASE}/ternak`)} 
                />
                <div className="px-5">
                  {!hasKandangData ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 bg-white/[0.03] border border-white/[0.03] rounded-3xl min-h-[200px]">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-2">
                        <LayoutGrid size={18} className="text-green-400" />
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1 font-['Sora']">Kandang Belum Diatur</h4>
                      <p className="text-[10px] text-slate-400 mb-4 max-w-[240px]">
                        Atur denah kandang Anda terlebih dahulu untuk memonitor lokasi ternak secara real-time.
                      </p>
                      <button
                        onClick={() => navigate(`${BASE}/kandang-view`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black rounded-xl transition-all active:scale-95 cursor-pointer shadow-md shadow-green-500/5 uppercase tracking-wider"
                      >
                        <LayoutGrid size={11} />
                        Atur Kandang
                      </button>
                    </div>
                  ) : (
                    <KandangMiniMap batchIds={activeBatches.map(b => b.id)} className="min-h-[220px] sm:min-h-[320px] md:min-h-[400px]" />
                  )}
                </div>
              </div>
            )}

            {/* PROYEKSI KEUANGAN */}
            {hasFinancialData && (
              <div>
                <MobileSectionHeader label="Proyeksi keuangan" action="Detail" onAction={() => navigate(`${BASE}/laporan`)} />
                <div className="px-5">
                  <MobileFinancePeek
                    batches={activeBatches}
                    feedLogs={feedLogs}
                    operationalCosts={operationalCosts}
                    sales={sales}
                    onNavigate={() => navigate(`${BASE}/laporan`)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Desktop header */
        <header className="px-4 pt-10 pb-12 relative overflow-hidden group/header">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 group-hover/header:scale-110 transition-transform duration-[10s] ease-linear"
            style={{ backgroundImage: 'url("/ui-pasture.png")' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06090F] via-[#06090F]/60 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06090F] via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] text-green-400/60 font-black uppercase tracking-[0.2em] mb-1">{businessLabel}</p>
            <div className="flex items-center justify-between">
              <h1 className="font-['Sora'] font-black text-2xl text-white" suppressHydrationWarning>
                Selamat {getGreeting()}, <span className="text-green-400/90">{profile?.full_name?.split(' ')[0] ?? 'Peternak'}</span> 👋
              </h1>
              {hasActiveBatches && (
                <button
                  onClick={() => navigate(`${BASE}/batch`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-[11px] font-bold text-green-400 transition-all active:scale-95"
                >
                  <Plus size={12} />
                  Batch Baru
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Desktop: Task Audit bar */}
      {!isMobile && !isTrueEmptyState && hasAnimals && (hasDailyTasks || isChecklistCompleted) && (
        !hasDailyTasks ? (
          <div className="px-4 mt-4">
            {renderEmptyTasksCard()}
          </div>
        ) : (
          <TaskCategoryAudit tasks={todayTasks} onNavigate={() => navigate(`${BASE}/daily_task`)} />
        )
      )}

      {/* Desktop: KPI Grid */}
      {!isMobile && !isTrueEmptyState && hasAnimals && (
        <div className={cn(
          "grid grid-cols-2 gap-3 px-4 mt-4",
          hasWeightData ? "sm:grid-cols-4" : "sm:grid-cols-3"
        )}>
          <div className="col-span-2 sm:col-span-1">
            <KPICard
              label="Total Ternak"
              value={kpi.totalEkor}
              sub={`${kpi.activeBatchCount} Kelompok (Batch) Aktif`}
              icon={Users}
              color="text-white"
              glow="green"
            />
          </div>
          {hasWeightData && (
            <div className="col-span-1">
              <KPICard
                label="Pertumbuhan Bobot (ADG)"
                value={kpi.avgADG ? `${kpi.avgADG} g` : '—'}
                sub={kpi.avgADG ? (kpi.avgADG >= adgGood ? '🔥 Sangat Baik' : kpi.avgADG >= adgOk ? '⚡ Stabil' : '⚠ Perlu Evaluasi') : 'Rata-rata kenaikan berat per hari'}
                icon={TrendingUp}
                color={kpi.avgADG >= adgGood ? 'text-green-400' : kpi.avgADG >= adgOk ? 'text-amber-400' : kpi.avgADG ? 'text-red-400' : 'text-slate-500'}
                glow={kpi.avgADG >= adgGood ? 'green' : kpi.avgADG >= adgOk ? 'amber' : kpi.avgADG ? 'red' : undefined}
              />
            </div>
          )}
          <div className="col-span-1">
            <KPICard
              label="Perkiraan Panen"
              value={kpi.harvestSoonCount > 0 ? `${kpi.harvestSoonCount} ekor` : '—'}
              sub={kpi.harvestSoonCount > 0 ? 'Siap panen dalam 30 hari' : 'Belum ada yang mendekati panen'}
              icon={Calendar}
              color={kpi.harvestSoonCount > 0 ? 'text-green-400' : 'text-slate-500'}
              glow={kpi.harvestSoonCount > 0 ? 'green' : undefined}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <KPICard
              label="Kematian Ternak"
              value={kpi.totalEkor === 0 ? '—' : `${kpi.mortalitasPct}%`}
              sub={kpi.totalEkor === 0 ? 'Belum ada data ternak' : (parseFloat(kpi.mortalitasPct) > mortalityThreshold ? `🚨 Sangat Tinggi (Batas ${mortalityThreshold}%)` : parseFloat(kpi.mortalitasPct) > 0 ? '⚠ Perlu Dipantau' : '✓ Aman')}
              icon={Activity}
              color={kpi.totalEkor === 0 ? 'text-slate-500' : (parseFloat(kpi.mortalitasPct) > mortalityThreshold ? 'text-red-400' : parseFloat(kpi.mortalitasPct) > 0 ? 'text-amber-400' : 'text-green-400')}
              glow={kpi.totalEkor === 0 ? undefined : (parseFloat(kpi.mortalitasPct) > mortalityThreshold ? 'red' : parseFloat(kpi.mortalitasPct) > 0 ? 'amber' : 'green')}
            />
          </div>
        </div>
      )}

      {/* Setup progress checklist if incomplete */}
      {!isChecklistCompleted && (
        <div className="px-4 mt-6">
          {renderSetupChecklist()}
        </div>
      )}

      {/* 2-Column Desktop Layout Wrapper */}
      {!isTrueEmptyState && (hasActiveBatches || hasAnimals) && (
        <div className={cn(
          "grid gap-6 mt-6 px-4",
          (hasFinancialData || hasWeightData) ? "lg:grid-cols-[1fr_1fr]" : "grid-cols-1",
          isMobile ? "hidden" : ""
        )}>

            {/* === LEFT COLUMN: Operational === */}
            <div className="space-y-6">
              {/* Batch Aktif */}
              {hasActiveBatches && (
                <section className="bg-white/[0.02] border border-white/[0.03] rounded-[2.5rem] p-5 sm:p-6 relative overflow-hidden shadow-2xl">
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
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#0C1319] hover:bg-[#111C24] border border-white/5 text-[#94A3B8] hover:text-white rounded-2xl text-[10px] font-black transition-all active:scale-95 uppercase tracking-widest cursor-pointer"
                    >
                      Lihat semua <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="space-y-4 relative z-10">
                    {activeBatches.length === 0 ? (
                      <div className="py-8 text-center border border-white/[0.03] rounded-2xl bg-white/[0.01]">
                        <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-3">Belum ada batch aktif</p>
                        <button
                          onClick={() => navigate(`${BASE}/batch`)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black rounded-xl transition-all active:scale-95 cursor-pointer uppercase tracking-wider shadow-sm shadow-green-500/10"
                        >
                          <Plus size={11} strokeWidth={3} /> Buat Batch Baru
                        </button>
                      </div>
                    ) : (
                      activeBatches.map(batch => {
                        const activeCount = allActiveAnimals.filter(a => a.batch_id === batch.id && a.status !== 'sold' && !a.is_sold && !a.is_sale).length
                        return (
                          <BatchCard
                            key={batch.id}
                            batch={batch}
                            activeCount={activeCount}
                            computedAdg={batchAdgMap[batch.id]}
                            config={config}
                            onClick={() => navigate(`${BASE}/ternak?batch=${batch.id}`)}
                          />
                        )
                      })
                    )}
                  </div>
                </section>
              )}

              {/* Alerts List */}
              {hasAnimals && (alerts.length > 0 || isChecklistCompleted) && (
                <section>
                  {alerts.length > 0 ? (
                    <div className="space-y-2" suppressHydrationWarning>
                      <h2 className="font-['Sora'] font-bold text-xs text-[#4B6478] mb-2 uppercase tracking-widest pl-1">Perhatian Khusus</h2>
                      {alerts.map((a, i) => a.pendingTasks ? (
                        <div
                          key={i}
                          className="w-full rounded-2xl border bg-amber-500/5 border-amber-500/20 overflow-hidden"
                        >
                          {/* Header row */}
                          <button
                            onClick={a.action}
                            className="w-full text-left flex items-start justify-between gap-3 px-4 py-3 hover:bg-amber-500/10 transition"
                          >
                            <div className="flex items-start gap-2.5">
                              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                              <span className="text-xs font-bold font-['Sora'] leading-tight text-amber-200">{a.msg}</span>
                            </div>
                            <ChevronRight size={14} className="opacity-40 shrink-0 mt-0.5" />
                          </button>

                          {/* Pending task list */}
                          <div className="border-t border-amber-500/10 px-4 pb-3 pt-2 space-y-1.5">
                            {a.pendingTasks.map((t, ti) => {
                              const title = t.title || t.template?.title || 'Tugas'
                              const assignee = t.worker?.full_name || t.assigned_profile?.full_name
                              return (
                                <div key={ti} className="flex items-center gap-2.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-semibold text-white/80 leading-tight truncate block">{title}</span>
                                  </div>
                                  {assignee && (
                                    <span className="text-[10px] text-[#4B6478] font-medium shrink-0">{assignee}</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <button
                          key={i}
                          onClick={a.action}
                          className={`w-full text-left flex items-start justify-between gap-3 px-4 py-3 rounded-2xl transition hover:brightness-110 border cursor-pointer ${
                            a.type === 'danger'
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
                    <div className="h-[120px] bg-green-500/[0.02] border border-green-500/10 rounded-3xl p-5 flex flex-col items-center justify-center text-center">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                        <CheckCircle2 size={20} className="text-green-500" />
                      </div>
                      <p className="text-xs font-bold text-green-400 font-['Sora']">Seluruh Kondisi Aman</p>
                      <p className="text-[10px] text-[#4B6478] mt-1">Tidak ada peringatan kritis saat ini</p>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* === RIGHT COLUMN: Analytics === */}
            {(hasFinancialData || hasWeightData) && (
              <div className="space-y-6">

                {/* P&L Projections */}
                {hasFinancialData && (
                  <section>
                    <div className="bg-white/[0.03] border border-white/[0.03] rounded-3xl p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-green-500/10">
                          <Wallet size={14} className="text-green-400" />
                        </div>
                        <div>
                          <h2 className="font-['Sora'] font-bold text-sm text-white">Estimasi Laba-Rugi (P&L)</h2>
                          <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5">Pendapatan & Profit</p>
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
                )}

                {/* ADG Chart */}
                {hasWeightData && (
                  <section>
                    <div className="bg-white/[0.03] border border-white/[0.03] rounded-3xl p-4 sm:p-5">
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

                        {activeBatches.length > 0 && (
                          <div className="relative">
                            <button
                              onClick={() => setBatchOpen(!batchOpen)}
                              className="flex items-center gap-3 bg-[#0C1319] border border-white/[0.05] rounded-2xl px-4 py-2.5 min-w-[180px] transition-all hover:border-green-500/30 group cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Wheat size={16} className="text-green-400" />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-[11px] font-black text-white uppercase tracking-wider leading-none mb-1">
                                  {selectedBatchId === 'all' ? '🌾 SEMUA BATCH' : activeBatches.find(b => b.id === selectedBatchId)?.batch_code ?? 'Pilih Batch'}
                                </p>
                                <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-widest leading-none">
                                  {selectedBatchId === 'all' ? `${animals.length} EKOR` : `${activeBatches.find(b => b.id === selectedBatchId)?.total_animals ?? 0} EKOR`}
                                </p>
                              </div>
                              <ChevronDown size={14} className={cn('text-[#4B6478] transition-transform duration-300', batchOpen && 'rotate-180')} />
                            </button>

                            <AnimatePresence>
                              {batchOpen && (
                                <>
                                  <div className="fixed inset-0 z-[100]" onClick={() => setBatchOpen(false)} />
                                  <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 w-full min-w-[220px] bg-[#0C1319]/90 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-1.5 shadow-2xl z-[101] overflow-hidden"
                                  >
                                    <button
                                      onClick={() => {
                                        setSelectedBatchId('all')
                                        setActiveAnimalIds(new Set())
                                        setBatchOpen(false)
                                      }}
                                      className={cn(
                                        'w-full flex items-center justify-between p-3 rounded-xl transition-all group/opt cursor-pointer',
                                        selectedBatchId === 'all' ? 'bg-green-500/10 border border-green-500/10' : 'hover:bg-white/5 border border-transparent'
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm">🌾</span>
                                        <div className="text-left">
                                          <p className={cn('text-[11px] font-black uppercase tracking-wider leading-none mb-1', selectedBatchId === 'all' ? 'text-green-400' : 'text-white')}>SEMUA BATCH</p>
                                          <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-widest leading-none">Agregat Data</p>
                                        </div>
                                      </div>
                                      {selectedBatchId === 'all' && <CheckCircle2 size={12} className="text-green-400" />}
                                    </button>

                                    <div className="h-px bg-white/[0.03] my-1" />

                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                      {activeBatches.map(b => {
                                        const isSel = selectedBatchId === b.id
                                        return (
                                          <button
                                            key={b.id}
                                            onClick={() => {
                                              setSelectedBatchId(b.id)
                                              setActiveAnimalIds(new Set())
                                              setBatchOpen(false)
                                            }}
                                            className={cn(
                                              'w-full flex items-center justify-between p-3 rounded-xl transition-all group/opt mt-1 cursor-pointer',
                                              isSel ? 'bg-green-500/10 border border-green-500/10' : 'hover:bg-white/5 border border-transparent'
                                            )}
                                          >
                                            <div className="flex items-center gap-3">
                                              <span className="text-sm">{animalEmoji}</span>
                                              <div className="text-left">
                                                <p className={cn('text-[11px] font-black uppercase tracking-wider leading-none mb-1', isSel ? 'text-green-400' : 'text-white')}>{b.batch_code}</p>
                                                <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-widest leading-none">{b.kandang_name}</p>
                                              </div>
                                            </div>
                                            {isSel && <CheckCircle2 size={12} className="text-green-400" />}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
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
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                  isActive
                                    ? 'text-white border-transparent'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
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
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <RefreshCw size={10} />
                              Reset
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="text-[11px] text-slate-400">Tidak ada ternak di batch ini</p>
                      )}
                    </div>

                    {/* Chart Area */}
                    <div className="h-[260px] sm:h-[300px] w-full relative">
                      {activeAnimalIds.size === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/[0.01] border border-white/[0.02] rounded-2xl">
                          <MousePointer2 size={32} className="text-white/10 mb-3" />
                          <p className="text-xs font-bold text-white">Pilih ekor di atas</p>
                          <p className="text-[10px] text-slate-400 mt-1">Bandingkan pertumbuhan antar {animalLabel.toLowerCase()} dalam satu grafik</p>
                        </div>
                      ) : chartData.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/[0.01] rounded-2xl">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                            <Scale size={24} className="text-slate-400" />
                          </div>
                          <p className="text-xs font-bold text-white font-['Sora']">Belum ada data timbang</p>
                          <p className="text-[10px] text-slate-400 mt-1">Segera catat timbangan untuk melihat grafik</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" hide />
                            <YAxis
                              domain={['dataMin - 2', 'dataMax + 2']}
                              tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 'bold' }}
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
                            {[...activeAnimalIds].map(animalId => {
                              const animal = animals.find(a => a.id === animalId)
                              return (
                                <Line
                                  key={animalId}
                                  type="monotone"
                                  dataKey={animalId}
                                  name={animal?.ear_tag || animalLabel}
                                  stroke={animalColors[animalId]}
                                  strokeWidth={3}
                                  dot={chartData.length === 1 ? { r: 4, strokeWidth: 0 } : false}
                                  activeDot={{ r: 4, strokeWidth: 0 }}
                                  animationDuration={1000}
                                  connectNulls
                                />
                              )
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {/* Desktop: Denah Kandang Terpadu */}
      {!isMobile && KandangMiniMap && hasAnimals && activeBatches.length > 0 && (
        <section className="px-4 mt-6">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-5 sm:p-6 relative overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(34,197,94,0.05),transparent_70%)] pointer-events-none" />
            <div className="flex items-center justify-between mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-lg shadow-green-500/5">
                  <LayoutGrid size={18} className="text-green-400" />
                </div>
                <div>
                  <h2 className="font-['Sora'] font-black text-base text-white tracking-tight">Denah Kandang Terpadu</h2>
                  <p className="text-[10px] text-[#4B6478] font-black uppercase tracking-[0.2em] mt-0.5">Monitoring Lokasi Ternak Real-time</p>
                </div>
              </div>
            </div>

            {!hasKandangData ? (
              <div className="relative z-10 flex flex-col items-center justify-center text-center p-8 bg-black/20 rounded-3xl border border-white/[0.04] min-h-[250px]">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-3">
                  <LayoutGrid size={24} className="text-green-400" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1 font-['Sora']">Kandang Belum Diatur</h4>
                <p className="text-[10px] text-slate-400 mb-5 max-w-sm">
                  Atur denah kandang Anda terlebih dahulu untuk memonitor lokasi ternak secara real-time.
                </p>
                <button
                  onClick={() => navigate(`${BASE}/kandang-view`)}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-xs font-black rounded-xl transition-all active:scale-95 cursor-pointer shadow-md shadow-green-500/5 uppercase tracking-wider"
                >
                  <LayoutGrid size={13} />
                  Atur Kandang
                </button>
              </div>
            ) : (
              <div className="relative z-10 rounded-3xl overflow-hidden border border-white/[0.04] bg-black/20">
                <KandangMiniMap batchIds={activeBatches.map(b => b.id)} className="min-h-[350px] lg:min-h-[450px] border-none bg-transparent" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Riwayat Batch Selesai */}
      {kpi.closedCount > 0 && (
        <section className="px-4 mt-4 mb-2">
          <button
            onClick={() => navigate(`${BASE}/laporan`)}
            className="w-full flex items-center justify-between px-5 py-4 bg-[#0C1319] hover:bg-[#111C24] border border-white/5 hover:border-white/10 rounded-2xl transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Wheat size={14} className="text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white font-['Sora']">{kpi.closedCount} Batch Selesai</p>
                <p className="text-[10px] text-[#4B6478] font-bold">Lihat laporan &amp; KPI historis →</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-[#4B6478] group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
          </button>
        </section>
      )}

      {/* Completed checklist progress block */}
      {isChecklistCompleted && (
        <div className="px-4 mt-4 mb-2">
          {renderCompletedChecklistProgress()}
        </div>
      )}
    </div>
  )
}
