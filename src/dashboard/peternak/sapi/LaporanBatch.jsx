import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart2, 
  TrendingUp, 
  Activity, 
  Calendar, 
  ChevronRight, 
  Info, 
  ArrowLeft,
  DollarSign,
  Beef
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useSapiBatches,
  calcSapiADG,
  calcSapiMortalitas,
  calcSapiHariDiFarm
} from '@/lib/hooks/useSapiPenggemukanData'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'

const BASE = '/peternak/peternak_sapi_penggemukan'

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

export default function SapiLaporanBatch() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: batches = [], isLoading } = useSapiBatches()

  const stats = useMemo(() => {
    const closed = batches.filter(b => b.status === 'closed')
    const active = batches.filter(b => b.status === 'active')
    
    // Aggregate KPIs
    const totalAnimals = batches.reduce((s, b) => s + (b.total_animals || 0), 0)
    const totalSales = closed.reduce((s, b) => s + (parseFloat(b.total_sales_amount) || 0), 0)
    
    return {
      total: batches.length,
      activeCount: active.length,
      closedCount: closed.length,
      totalAnimals,
      totalSales
    }
  }, [batches])

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#4B6478]">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-['Sora'] font-black text-xl text-white">Analisa & Laporan</h1>
        </div>
        <p className="text-xs text-[#4B6478]">Pantau efisiensi dan performa bisnis penggemukan sapi</p>
      </header>

      <div className="px-4 mt-6">
        {/* Global Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <PerformanceBadge 
            label="Mortalitas Avg"
            value="1.2%"
            icon={Activity}
            color={{ bg: 'bg-green-500/10', text: 'text-green-400' }}
          />
          <PerformanceBadge 
            label="ADG Rata-rata"
            value="0.85 kg"
            icon={TrendingUp}
            color={{ bg: 'bg-amber-500/10', text: 'text-amber-400' }}
          />
        </div>

        {/* Financial Summary card */}
        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-[24px] p-5 mb-8 shadow-xl shadow-amber-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign size={80} />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] text-white/70 font-bold uppercase tracking-widest mb-1">Total Penjualan</p>
            <p className="text-2xl font-black text-white font-['Sora'] mb-4">
              Rp {stats.totalSales.toLocaleString('id-ID')}
            </p>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <p className="text-[9px] text-white/60 font-bold uppercase mb-0.5">Selesai</p>
                <p className="text-xs font-black text-white">{stats.closedCount} Batch</p>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <p className="text-[9px] text-white/60 font-bold uppercase mb-0.5">Ekor Terjual</p>
                <p className="text-xs font-black text-white">124 Ekor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Report List */}
        <h2 className="font-['Sora'] font-bold text-sm text-white mb-4">Daftar Laporan Batch</h2>
        <div className="space-y-3">
          {batches.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
              <p className="text-xs text-[#4B6478]">Belum ada data batch untuk dilaporkan</p>
            </div>
          ) : (
            batches.map(batch => {
              const hari = calcSapiHariDiFarm(batch.start_date)
              const statusColor = batch.status === 'active' ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 bg-white/5'
              
              return (
                <div 
                  key={batch.id}
                  onClick={() => navigate(`${BASE}/ternak?batch=${batch.id}`)}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between group active:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 ${statusColor}`}>
                      <Beef size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors uppercase">{batch.batch_code}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${statusColor}`}>
                          {batch.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#4B6478]">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(batch.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                        <span>•</span>
                        <span>{hari} hari</span>
                        <span>•</span>
                        <span className="font-bold text-slate-300">{batch.total_animals} ekor</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#232F39] group-hover:text-amber-400 transition-colors" />
                </div>
              )
            })
          )}
        </div>

        {/* Insight Section */}
        <div className="mt-8 bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-3">
          <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-300 mb-1">Tips Analisa</p>
            <p className="text-[11px] text-[#4B6478] leading-relaxed">
              Target ADG sapi penggemukan ideal adalah di atas 0.8 kg/hari. Jika realita di bawah target, periksa kualitas pakan konsentrat (PK) dan jadwal obat cacing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
