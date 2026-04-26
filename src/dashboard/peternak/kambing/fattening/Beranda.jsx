import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertTriangle, TrendingUp, Activity, Tag, Wheat, ChevronRight, LayoutGrid } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useKambingActiveBatches, useKambingBatches,
  calcHariDiFarm, calcADG, calcMortalitasKambing,
} from '@/lib/hooks/useKambingPenggemukanData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'

const BASE = '/peternak/peternak_kambing_penggemukan'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return 'pagi'
  if (h < 15) return 'siang'
  if (h < 19) return 'sore'
  return 'malam'
}

function KPICard({ label, value, sub, color = 'text-white', icon: Icon }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      {Icon && <Icon size={14} className="text-[#4B6478] mb-2" />}
      <p className={`font-['Sora'] font-black text-xl leading-none mb-1 ${color}`}>{value}</p>
      <p className="text-[11px] text-[#4B6478] font-semibold">{label}</p>
      {sub && <p className="text-[10px] text-[#4B6478] mt-0.5">{sub}</p>}
    </div>
  )
}

function BatchCard({ batch, onClick }) {
  const hari = calcHariDiFarm(batch.start_date)
  const progress = Math.min(100, Math.round((hari / 90) * 100))
  const mortalitasPct = calcMortalitasKambing(batch.mortality_count, batch.total_animals)
  const isOverdue = hari > 90
  const isCritical = mortalitasPct > 3

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 cursor-pointer active:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-['Sora'] font-bold text-sm text-white">{batch.batch_code}</span>
            {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">OVERDUE</span>}
            {isCritical && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">MORTALITAS</span>}
          </div>
          <p className="text-[11px] text-[#4B6478]">{batch.kandang_name}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-white font-['Sora']">{batch.total_animals}</p>
          <p className="text-[10px] text-[#4B6478]">ekor</p>
        </div>
      </div>

      {/* Progress bar hari penggemukan */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-[#4B6478] mb-1">
          <span>Hari ke-{hari}</span>
          <span>Target 90 hari</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isOverdue ? 'bg-red-500' : progress > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[11px] font-bold text-white">{batch.mortality_count}</p>
          <p className="text-[10px] text-[#4B6478]">Mati</p>
        </div>
        <div className="text-center border-x border-white/[0.06]">
          <p className="text-[11px] font-bold text-white">{mortalitasPct}%</p>
          <p className="text-[10px] text-[#4B6478]">Mortalitas</p>
        </div>
        <div className="text-center">
          <p className={`text-[11px] font-bold ${batch.avg_adg_gram ? 'text-green-400' : 'text-[#4B6478]'}`}>
            {batch.avg_adg_gram ? `${batch.avg_adg_gram}g` : '—'}
          </p>
          <p className="text-[10px] text-[#4B6478]">ADG/hari</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function KambingPenggemukanBeranda() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const { data: activeBatches = [], isLoading: loadingActive } = useKambingActiveBatches()
  const { data: allBatches = [], isLoading: loadingAll } = useKambingBatches()

  const isLoading = loadingActive || loadingAll

  const kpi = useMemo(() => {
    const totalEkor = activeBatches.reduce((s, b) => s + (b.total_animals || 0), 0)
    const totalMati = activeBatches.reduce((s, b) => s + (b.mortality_count || 0), 0)
    const mortalitasPct = totalEkor > 0 ? ((totalMati / totalEkor) * 100).toFixed(1) : '0.0'
    const adgList = activeBatches.filter(b => b.avg_adg_gram).map(b => parseFloat(b.avg_adg_gram))
    const avgADG = adgList.length ? Math.round(adgList.reduce((s, v) => s + v, 0) / adgList.length) : null
    const closedCount = allBatches.filter(b => b.status === 'closed').length
    return { totalEkor, mortalitasPct, avgADG, activeBatchCount: activeBatches.length, closedCount }
  }, [activeBatches, allBatches])

  const alerts = useMemo(() => {
    const list = []
    activeBatches.forEach(b => {
      const hari = calcHariDiFarm(b.start_date)
      const mort = calcMortalitasKambing(b.mortality_count, b.total_animals)
      if (hari > 90) list.push({ type: 'danger', msg: `${b.batch_code}: Hari ke-${hari} — melewati target 90 hari` })
      if (mort > 3) list.push({ type: 'danger', msg: `${b.batch_code}: Mortalitas ${mort}% — di atas batas 3%` })
      else if (mort > 1.5) list.push({ type: 'warning', msg: `${b.batch_code}: Mortalitas ${mort}% — perlu dipantau` })
    })
    return list
  }, [activeBatches])

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">

      {/* Header */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <p className="text-[11px] text-[#4B6478] font-semibold mb-0.5" suppressHydrationWarning>
          Selamat {getGreeting()}, {profile?.full_name?.split(' ')[0] ?? 'Peternak'} 👋
        </p>
        <h1 className="font-['Sora'] font-black text-xl text-white">Penggemukan Kambing</h1>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-2.5 px-4 mt-4">
        <KPICard label="Batch Aktif"  value={kpi.activeBatchCount} icon={Activity}  color="text-green-400" />
        <KPICard label="Total Ekor"   value={kpi.totalEkor}        icon={Tag}        color="text-white" />
        <KPICard
          label="ADG Rata-rata"
          value={kpi.avgADG ? `${kpi.avgADG} g/hr` : '—'}
          sub="Target ≥150 g/hari"
          icon={TrendingUp}
          color={kpi.avgADG >= 150 ? 'text-green-400' : kpi.avgADG ? 'text-amber-400' : 'text-[#4B6478]'}
        />
        <KPICard
          label="Mortalitas"
          value={`${kpi.mortalitasPct}%`}
          sub="Target ≤3%"
          icon={Activity}
          color={parseFloat(kpi.mortalitasPct) > 3 ? 'text-red-400' : 'text-green-400'}
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="px-4 mt-4 space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border ${
              a.type === 'danger'
                ? 'bg-red-500/10 border-red-500/20 text-red-300'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            }`}>
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Batch Aktif */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-['Sora'] font-bold text-sm text-white">Batch Aktif</h2>
          <button
            onClick={() => navigate(`${BASE}/batch`)}
            className="flex items-center gap-1 text-[11px] text-green-400 font-semibold"
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
            <p className="text-xs text-[#4B6478] mb-4">Mulai batch penggemukan pertama kamu</p>
            <button
              onClick={() => navigate(`${BASE}/batch`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <Plus size={13} />
              Buat Batch Baru
            </button>
          </div>
        ) : (
          <div className="space-y-3">
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

      {/* Riwayat ringkas */}
      {kpi.closedCount > 0 && (
        <section className="px-4 mt-6">
          <button
            onClick={() => navigate(`${BASE}/laporan`)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <Wheat size={16} className="text-green-400" />
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