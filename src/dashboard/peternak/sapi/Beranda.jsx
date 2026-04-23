import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertTriangle, TrendingUp, Activity, Tag, Wheat, ChevronRight, BarChart2, MousePointer2, RefreshCw, CheckCircle2, Scale, LayoutGrid } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useSapiActiveBatches, useSapiBatches, useSapiAnimals,
  useSapiWeightHistory,
  calcSapiHariDiFarm, calcSapiMortalitas,
} from '@/lib/hooks/useSapiPenggemukanData'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import { format, addDays } from 'date-fns'
import { id } from 'date-fns/locale'
import { toast } from 'sonner'
import KandangMiniMap from './KandangMiniMap'

const BASE = '/peternak/peternak_sapi_penggemukan'

const CHART_COLORS = [
  '#10B981', '#7C3AED', '#F59E0B', '#F87171', '#60A5FA',
  '#34D399', '#A78BFA', '#FBBF24', '#F472B6', '#4ADE80'
]


function KPICard({ label, value, sub, color = 'text-white', icon: Icon }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
      {Icon && <Icon size={12} className="text-[#4B6478] mb-2" />}
      <p className={`font-['Sora'] font-black text-lg leading-none mb-1 ${color}`}>{value}</p>
      <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-tight">{label}</p>
      {sub && <p className="text-[9px] text-[#4B6478] mt-0.5 font-medium tracking-tighter">{sub}</p>}
    </div>
  )
}

function BatchCard({ batch, onClick, onAnimalClick }) {
  // Sapi: target penggemukan 4–6 bulan (120–180 hari)
  const hari = calcSapiHariDiFarm(batch.start_date)
  const TARGET_HARI = 150
  const sisaHari = Math.max(0, TARGET_HARI - hari)
  const estimasiPanen = addDays(new Date(batch.start_date), TARGET_HARI)
  
  const progress = Math.min(100, Math.round((hari / TARGET_HARI) * 100))
  const mortalitasPct = calcSapiMortalitas(batch.mortality_count, batch.total_animals)
  const isOverdue = hari > TARGET_HARI
  const isCritical = mortalitasPct > 2   // sapi: threshold mortalitas 2%

  // Extract unique breeds for family summary
  const breeds = useMemo(() => {
    if (!batch.animals) return []
    const set = new Set(batch.animals.map(a => a.breed).filter(Boolean))
    return Array.from(set)
  }, [batch.animals])

  // ADG dalam kg/hari untuk display
  const adgKg = batch.avg_adg_gram ? (batch.avg_adg_gram / 1000).toFixed(2) : null

  return (
    <motion.div
      className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-6 transition-all duration-300"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Stats & Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span 
                    onClick={onClick}
                    className="font-['Sora'] font-black text-lg text-white hover:text-amber-400 cursor-pointer transition-colors uppercase tracking-tight truncate max-w-full"
                  >
                    {batch.batch_code}
                  </span>
                  {isOverdue && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-black tracking-tighter uppercase whitespace-nowrap">OVERDUE</span>
                  )}
                  {isCritical && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-black tracking-tighter uppercase whitespace-nowrap">CRITICAL</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[#4B6478]">
                   <LayoutGrid size={12} />
                   <p className="text-[11px] font-bold uppercase tracking-wider">{batch.kandang_name}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-white font-['Sora'] leading-none mb-1">{batch.total_animals}</p>
                <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest">Ekor</p>
              </div>
            </div>

            {/* Summary Info Row */}
            <div className="grid grid-cols-2 gap-4 mb-3">
               <div>
                  <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-widest mb-1">Sisa Waktu</p>
                  <p className="text-xs font-black text-white uppercase">{sisaHari} Hari Lagi</p>
               </div>
               <div>
                  <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-widest mb-1">Estimasi Panen</p>
                  <p className="text-xs font-black text-amber-400 uppercase">{format(estimasiPanen, 'dd MMM yyyy', { locale: id })}</p>
               </div>
            </div>

            {/* Keluarga Ternak (Breeds) */}
            {breeds.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {breeds.map((b, i) => (
                  <span key={i} className="text-[9px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#4B6478] font-black uppercase tracking-widest">
                    {b}
                  </span>
                ))}
              </div>
            )}

            {/* Progress bar */}
            <div className="mb-6 bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-[#4B6478] mb-1.5">
                <span>Hari ke-{hari}</span>
                <span>Target {TARGET_HARI} hari</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isOverdue ? 'bg-red-500' : progress > 80 ? 'bg-amber-500' : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-2.5 text-center">
              <p className="text-[11px] font-black text-white leading-none mb-1">{batch.mortality_count}</p>
              <p className="text-[9px] text-[#4B6478] font-bold uppercase tracking-widest">Mati</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-2.5 text-center">
              <p className={`text-[11px] font-black leading-none mb-1 ${mortalitasPct > 2 ? 'text-red-400' : 'text-green-400'}`}>
                {mortalitasPct}%
              </p>
              <p className="text-[9px] text-[#4B6478] font-bold uppercase tracking-widest">Mortalitas</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-2.5 text-center">
              <p className={`text-[11px] font-black leading-none mb-1 ${adgKg ? 'text-amber-400' : 'text-[#4B6478]'}`}>
                {adgKg ? `${adgKg}kg` : '—'}
              </p>
              <p className="text-[9px] text-[#4B6478] font-bold uppercase tracking-widest">ADG/Hr</p>
            </div>
          </div>
        </div>

        {/* Right Side: Map Visualization */}
        <div className="w-full lg:w-[50%] xl:w-[60%] shrink-0">
          <KandangMiniMap 
            batchId={batch.id} 
            className="mt-0" 
            onAnimalClick={onAnimalClick}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default function SapiBeranda() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  // Utility to get current greeting
  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 11) return 'pagi'
    if (h < 15) return 'siang'
    if (h < 19) return 'sore'
    return 'malam'
  }

  const { data: activeBatches = [], isLoading: loadingActive } = useSapiActiveBatches()
  const { data: allBatches = [],    isLoading: loadingAll    } = useSapiBatches()

  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [activeAnimalIds, setActiveAnimalIds] = useState(new Set())

  // Set default batch
  useEffect(() => {
    if (!selectedBatchId && activeBatches.length > 0) {
      setSelectedBatchId(activeBatches[0].id)
    }
  }, [activeBatches, selectedBatchId])

  const { data: animals = [], isLoading: loadingAnimals } = useSapiAnimals(selectedBatchId)
  const { data: weightHistory = [], isLoading: loadingHistory } = useSapiWeightHistory(selectedBatchId)

  const isLoading = loadingActive || loadingAll || loadingAnimals || loadingHistory

  // Data transformation for Recharts
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
    const totalEkor    = activeBatches.reduce((s, b) => s + (b.total_animals    || 0), 0)
    const totalMati    = activeBatches.reduce((s, b) => s + (b.mortality_count  || 0), 0)
    const mortalitasPct = totalEkor > 0
      ? ((totalMati / totalEkor) * 100).toFixed(1)
      : '0.0'
    // ADG dalam kg/hari untuk sapi
    const adgList = activeBatches
      .filter(b => b.avg_adg_gram)
      .map(b => parseFloat(b.avg_adg_gram) / 1000)
    const avgADGKg = adgList.length
      ? (adgList.reduce((s, v) => s + v, 0) / adgList.length).toFixed(2)
      : null
    const closedCount = allBatches.filter(b => b.status === 'closed').length
    return {
      totalEkor,
      mortalitasPct,
      avgADGKg,
      activeBatchCount: activeBatches.length,
      closedCount,
    }
  }, [activeBatches, allBatches])

  const alerts = useMemo(() => {
    const list = []
    activeBatches.forEach(b => {
      const hari  = calcSapiHariDiFarm(b.start_date)
      const mort  = calcSapiMortalitas(b.mortality_count, b.total_animals)
      if (hari > 150) list.push({ type: 'danger',  msg: `${b.batch_code}: Hari ke-${hari} — melewati target 150 hari` })
      if (mort > 2)   list.push({ type: 'danger',  msg: `${b.batch_code}: Mortalitas ${mort}% — di atas batas 2%` })
      else if (mort > 1) list.push({ type: 'warning', msg: `${b.batch_code}: Mortalitas ${mort}% — perlu dipantau` })
    })
    return list
  }, [activeBatches])

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">

      {/* Header */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <p className="text-[11px] text-[#4B6478] font-semibold mb-0.5">
          Selamat {getGreeting()}, {profile?.full_name?.split(' ')[0] ?? 'Peternak'} 👋
        </p>
        <h1 className="font-['Sora'] font-black text-xl text-white">Fattening Sapi</h1>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-2 px-4 mt-4">
        <KPICard
          label="Batch"
          value={kpi.activeBatchCount}
          icon={Activity}
          color="text-amber-400"
        />
        <KPICard
          label="Sapi"
          value={kpi.totalEkor}
          icon={Tag}
          color="text-white"
        />
        <KPICard
          label="ADG"
          value={kpi.avgADGKg ? `${kpi.avgADGKg}` : '—'}
          sub="kg/hr"
          icon={TrendingUp}
          color={
            kpi.avgADGKg >= 0.8 ? 'text-green-400'
            : kpi.avgADGKg     ? 'text-amber-400'
            : 'text-[#4B6478]'
          }
        />
        <KPICard
          label="Mati"
          value={`${kpi.mortalitasPct}%`}
          icon={Activity}
          color={parseFloat(kpi.mortalitasPct) > 2 ? 'text-red-400' : 'text-green-400'}
        />
      </div>

      {/* 1. Batch Aktif (Moved UP) */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-['Sora'] font-bold text-sm text-white">Batch Aktif</h2>
          <button
            onClick={() => navigate(`${BASE}/batch`)}
            className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold"
          >
            Lihat semua <ChevronRight size={13} />
          </button>
        </div>

        {activeBatches.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
               <LayoutGrid size={32} className="text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">Belum ada batch aktif</p>
            <p className="text-xs text-[#4B6478] mb-4">Mulai batch fattening sapi pertama kamu</p>
            <button
              onClick={() => navigate(`${BASE}/batch`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <Plus size={13} />
              Buat Batch Baru
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeBatches.map(batch => (
              <BatchCard
                key={batch.id}
                batch={batch}
                onClick={() => navigate(`${BASE}/ternak?batch=${batch.id}`)}
                onAnimalClick={(animal) => {
                  setSelectedBatchId(batch.id);
                  toggleAnimal(animal.id);
                  // scroll to chart
                  window.scrollBy({ top: 300, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Alerts (Placed below Batch Aktif) */}
      {alerts.length > 0 && (
        <div className="px-4 mt-4 space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border ${
                a.type === 'danger'
                  ? 'bg-red-500/10 border-red-500/20 text-red-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}
            >
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* 2. Grafik Pertumbuhan (Moved DOWN) */}
      <section className="px-4 mt-6">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="font-['Sora'] font-bold text-sm text-white flex items-center gap-2">
                <BarChart2 size={16} className="text-amber-400" />
                Grafik Pertumbuhan PBBH
              </h2>
              <p className="text-[10px] text-[#4B6478] mt-1 uppercase tracking-wider font-bold">Bobot Badan Harian (kg)</p>
            </div>
            
            {activeBatches.length > 1 && (
              <select
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value)
                  setActiveAnimalIds(new Set())
                }}
                className="bg-[#0C1319] border border-white/10 rounded-xl px-3 py-1.5 text-[11px] font-bold text-white outline-none focus:border-amber-500/50"
              >
                {activeBatches.map(b => (
                  <option key={b.id} value={b.id}>{b.batch_code} ({b.kandang_name})</option>
                ))}
              </select>
            )}
          </div>

          {/* Animal Selector Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {animals.length > 0 ? (
              <>
                {animals.map((a) => {
                  const isActive = activeAnimalIds.has(a.id)
                  const color = animalColors[a.id]
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAnimal(a.id)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border flex items-center gap-1.5 ${
                        isActive 
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
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
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
          <div className="h-[300px] w-full relative">
            {activeAnimalIds.size === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/5 rounded-2xl">
                <MousePointer2 size={32} className="text-white/10 mb-3" />
                <p className="text-xs font-bold text-white">Pilih ekor di atas</p>
                <p className="text-[10px] text-[#4B6478] mt-1">Gunakan tombol pill untuk membandingkan pertumbuhan antar sapi</p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/[0.01] rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                   <Scale size={24} className="text-[#4B6478]" />
                </div>
                <p className="text-xs font-bold text-white">Belum ada data timbang</p>
                <p className="text-[10px] text-[#4B6478] mt-1">Segera catat timbangan pertama Anda untuk melihat grafik ini</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    hide 
                  />
                  <YAxis 
                    domain={['dataMin - 10', 'dataMax + 10']}
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
                  {[...activeAnimalIds].map(id => {
                    const animal = animals.find(a => a.id === id)
                    return (
                      <Line
                        key={id}
                        type="monotone"
                        dataKey={id}
                        name={animal?.ear_tag || 'Sapi'}
                        stroke={animalColors[id]}
                        strokeWidth={3}
                        dot={chartData.length === 1 ? { r: 5, strokeWidth: 0 } : false}
                        activeDot={{ r: 5, strokeWidth: 0 }}
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

      {/* 3. Riwayat ringkas */}
      {kpi.closedCount > 0 && (
        <section className="px-4 mt-6">
          <button
            onClick={() => navigate(`${BASE}/laporan`)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <Wheat size={16} className="text-amber-400" />
              <div className="text-left">
                <p className="text-sm font-bold text-white">{kpi.closedCount} Batch Selesai</p>
                <p className="text-[11px] text-[#4B6478]">Lihat laporan & KPI historis</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-[#4B6478]" />
          </button>
        </section>
      )}

    </div>
  )
}