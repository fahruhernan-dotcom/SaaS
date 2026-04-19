import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Milk, Activity, Tags, AlertTriangle, 
  ChevronRight, ArrowUpRight, TrendingUp, Package 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  useKambingPerahYieldStats, 
  useKambingPerahActiveLactations,
  useKambingPerahAnimals,
  useKambingPerahInventory
} from '@/lib/hooks/useKambingPerahData'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'

const BASE = '/peternak/peternak_kambing_perah'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return 'pagi'
  if (h < 15) return 'siang'
  if (h < 19) return 'sore'
  return 'malam'
}

function StatCard({ label, value, unit, color = 'text-white', icon: Icon, sub }) {
  return (
    <div className="bg-[#0F171F]/80 backdrop-blur-md border border-white/[0.08] rounded-2xl p-4 relative overflow-hidden group">
      <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
        {Icon && <Icon size={80} />}
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/[0.06] ${color}`}>
            {Icon && <Icon size={16} />}
          </div>
          <span className="text-[11px] font-bold text-[#4B6478] uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-black font-['Sora'] ${color}`}>{value}</span>
          {unit && <span className="text-xs font-semibold text-[#405463]">{unit}</span>}
        </div>
        {sub && <p className="text-[10px] text-[#4B6478] mt-1 font-medium">{sub}</p>}
      </div>
    </div>
  )
}

export default function KambingPerahBeranda() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const { data: yieldStats = [], isLoading: loadingYield } = useKambingPerahYieldStats()
  const { data: lactations = [], isLoading: loadingLaktasi } = useKambingPerahActiveLactations()
  const { data: animals = [], isLoading: loadingAnimals } = useKambingPerahAnimals()
  const { data: inventory = [], isLoading: loadingInv } = useKambingPerahInventory()

  const isLoading = loadingYield || loadingLaktasi || loadingAnimals || loadingInv

  const stats = useMemo(() => {
    const todayYield = yieldStats[0]?.total_yield || 0
    const yesterdayYield = yieldStats[1]?.total_yield || 0
    const diff = todayYield - yesterdayYield
    const pct = yesterdayYield > 0 ? (diff / yesterdayYield) * 100 : 0

    return {
      todayYield,
      yieldChange: pct.toFixed(1),
      activeLaktasi: lactations.length,
      totalAnimals: animals.length,
      lowStock: inventory.filter(i => i.stock_level <= i.min_threshold).length
    }
  }, [yieldStats, lactations, animals, inventory])

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24 min-h-screen bg-[#06090F]">
      
      {/* Premium Header */}
      <header className="px-6 pt-10 pb-12 bg-gradient-to-b from-[#0C1319] to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[120px] rounded-full -mr-20 -mt-20" />
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <p className="text-xs font-bold text-green-400 mb-1.5 uppercase tracking-[0.2em]">
            Dairy Enterprise
          </p>
          <h1 className="text-3xl font-black font-['Sora'] text-white leading-tight">
            Selamat {getGreeting()},<br />
            {profile?.full_name?.split(' ')[0] ?? 'Partner'}
          </h1>
        </motion.div>
      </header>

      {/* Main Stats Grid */}
      <div className="px-4 -mt-8 grid grid-cols-2 gap-3">
        <StatCard 
          label="Yield Harian" 
          value={stats.todayYield} 
          unit="Liter"
          icon={Milk}
          color="text-green-400"
          sub={`${stats.yieldChange >= 0 ? '+' : ''}${stats.yieldChange}% vs kemarin`}
        />
        <StatCard 
          label="Laktasi Aktif" 
          value={stats.activeLaktasi} 
          unit="Ekor"
          icon={Activity}
          color="text-white"
          sub={`DIM rata-rata: 42 hari`}
        />
        <StatCard 
          label="Populasi" 
          value={stats.totalAnimals} 
          unit="Ekor"
          icon={Tags}
          color="text-blue-400"
        />
        <StatCard 
          label="Peringatan Stok" 
          value={stats.lowStock} 
          icon={Package}
          color={stats.lowStock > 0 ? 'text-amber-400' : 'text-slate-500'}
          sub="Barang perlu restock"
        />
      </div>

      {/* Action Sections */}
      <div className="px-4 mt-8 space-y-3">
        
        {/* Quick Action: Log Production */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`${BASE}/produksi`)}
          className="w-full p-5 rounded-2xl bg-green-600 hover:bg-green-500 transition-all shadow-xl shadow-green-900/10 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Milk size={24} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-white font-['Sora']">Catat Produksi Susu</p>
              <p className="text-[11px] text-green-100 font-medium">Input hasil perahan sesi sore</p>
            </div>
          </div>
          <ArrowUpRight size={20} className="text-white/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </motion.button>

        {/* Inventory Shortcut */}
        <button 
          onClick={() => navigate(`${BASE}/inventory`)}
          className="w-full flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl group"
        >
          <div className="flex items-center gap-3">
            <Package size={18} className="text-amber-400" />
            <div className="text-left">
              <p className="text-[13px] font-bold text-white">Manajemen Gudang</p>
              <p className="text-[10px] text-[#4B6478]">Cek stok pakan & konsentrat</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#405463]" />
        </button>

      </div>

      {/* Insights / Trends */}
      <section className="px-4 mt-8">
        <h2 className="text-sm font-bold text-white font-['Sora'] mb-4 px-1 flex items-center gap-2">
          <TrendingUp size={16} className="text-green-500" />
          Produksi 7 Hari Terakhir
        </h2>
        
        <div className="h-48 bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex items-center justify-center">
          <p className="text-[11px] text-[#4B6478] font-semibold text-center uppercase tracking-widest">
            Visualisai grafik perahan akan muncul di sini
          </p>
        </div>
      </section>

    </div>
  )
}
