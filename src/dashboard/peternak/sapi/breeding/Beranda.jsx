import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Heart, TrendingUp, Activity, Baby, ChevronRight, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useSapiBreedingAnimals,
  useSapiBreedingActiveMatingRecords,
  useSapiBreedingBirths,
  calcConceptionRate,
  calcCalvingInterval,
  calcHariMenujuPartus,
} from '@/lib/hooks/useSapiBreedingData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'

const BASE = '/peternak/peternak_sapi_breeding'

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

function MatingCard({ mating, onClick }) {
  const hariMenuju = calcHariMenujuPartus(mating.est_partus_date)
  const dam = mating.sapi_breeding_animals
  const isOverdue = hariMenuju !== null && hariMenuju < 0
  const isImpending = hariMenuju !== null && hariMenuju >= 0 && hariMenuju <= 14

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 cursor-pointer active:bg-white/[0.05] transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-['Sora'] font-bold text-sm text-white">
              {dam?.ear_tag ?? '—'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${
              mating.status === 'bunting'
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-[#4B6478] bg-white/5 border-white/10'
            }`}>
              {mating.status === 'bunting' ? 'Bunting' : 'Menunggu PKB'}
            </span>
            {isOverdue && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                LEWAT
              </span>
            )}
            {isImpending && !isOverdue && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                SEGERA
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#4B6478]">
            {dam?.breed ?? 'Unknown'} · Parity {dam?.parity ?? 0}
          </p>
        </div>
        <ChevronRight size={15} className="text-[#4B6478] mt-0.5" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/[0.04]">
        <div>
          <p className="text-[11px] font-bold text-white">
            {mating.method === 'ib' ? 'IB' : 'Alami'}
          </p>
          <p className="text-[10px] text-[#4B6478]">Metode</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-white">{mating.mating_date}</p>
          <p className="text-[10px] text-[#4B6478]">Tgl IB</p>
        </div>
        <div>
          <p className={`text-[11px] font-bold ${
            isOverdue ? 'text-red-400' : isImpending ? 'text-amber-400' : 'text-white'
          }`}>
            {hariMenuju === null ? '—'
              : isOverdue ? `+${Math.abs(hariMenuju)}h`
              : `${hariMenuju}h`}
          </p>
          <p className="text-[10px] text-[#4B6478]">
            {isOverdue ? 'Terlambat' : 'Menuju Partus'}
          </p>
        </div>
      </div>

      {mating.method === 'ib' && mating.bull_name && (
        <p className="text-[10px] text-[#4B6478] mt-2">
          Pejantan: <span className="text-white">{mating.bull_name}</span>
          {mating.inseminator_name && ` · Ins: ${mating.inseminator_name}`}
        </p>
      )}
    </motion.div>
  )
}

export default function SapiBreedingBeranda() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const { data: allAnimals = [],    isLoading: loadingAnimals  } = useSapiBreedingAnimals()
  const { data: activeMatings = [], isLoading: loadingMatings  } = useSapiBreedingActiveMatingRecords()
  const { data: births = [],        isLoading: loadingBirths   } = useSapiBreedingBirths()

  const isLoading = loadingAnimals || loadingMatings || loadingBirths

  const kpi = useMemo(() => {
    const indukan     = allAnimals.filter(a => a.purpose === 'indukan' && a.status !== 'mati' && a.status !== 'terjual')
    const bunting     = allAnimals.filter(a => a.status === 'bunting')
    const totalBorn   = births.reduce((s, b) => s + (b.total_born_alive || 0), 0)

    // Conception rate dari 12 bulan terakhir
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 1)
    const recentBirths  = births.filter(b => new Date(b.partus_date) >= cutoff)
    const conceptionPct = calcConceptionRate(recentBirths.length, activeMatings.length + recentBirths.length)

    // Calving interval
    const birthDatesByDam = {}
    births.forEach(b => {
      if (!birthDatesByDam[b.dam_id]) birthDatesByDam[b.dam_id] = []
      birthDatesByDam[b.dam_id].push(b.partus_date)
    })
    const allIntervals = Object.values(birthDatesByDam)
      .map(dates => {
        const sorted = dates.sort()
        const gaps = []
        for (let i = 1; i < sorted.length; i++) {
          gaps.push((new Date(sorted[i]) - new Date(sorted[i - 1])) / (1000 * 60 * 60 * 24))
        }
        return gaps
      })
      .flat()
    const avgInterval = allIntervals.length
      ? Math.round(allIntervals.reduce((s, v) => s + v, 0) / allIntervals.length)
      : null

    // Freemartin risk alerts
    const freemartinAlerts = births.filter(b => b.is_freemartin_risk && b.pedet_id === null)

    return {
      totalIndukan: indukan.length,
      totalBunting: bunting.length,
      totalBorn,
      conceptionPct,
      avgInterval,
      freemartinAlerts,
    }
  }, [allAnimals, activeMatings, births])

  const alerts = useMemo(() => {
    const list = []
    activeMatings.forEach(m => {
      const hari = calcHariMenujuPartus(m.est_partus_date)
      const tag  = m.sapi_breeding_animals?.ear_tag ?? '?'
      if (hari !== null && hari < 0)
        list.push({ type: 'danger',  msg: `${tag}: Estimasi partus ${Math.abs(hari)} hari yang lalu — cek kondisi indukan` })
      else if (hari !== null && hari <= 14 && m.status === 'bunting')
        list.push({ type: 'warning', msg: `${tag}: Estimasi partus ${hari} hari lagi — siapkan kandang beranak` })
    })
    kpi.freemartinAlerts.forEach(b => {
      list.push({ type: 'warning', msg: `Kelahiran ${b.partus_date}: kembar jantan+betina — pedet betina berisiko freemartin, periksa kesuburannya` })
    })
    return list
  }, [activeMatings, kpi.freemartinAlerts])

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">

      {/* Header */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <p className="text-[11px] text-[#4B6478] font-semibold mb-0.5">
          Selamat {getGreeting()}, {profile?.full_name?.split(' ')[0] ?? 'Peternak'} 👋
        </p>
        <h1 className="font-['Sora'] font-black text-xl text-white">Breeding Sapi</h1>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-2.5 px-4 mt-4">
        <KPICard
          label="Indukan Aktif"
          value={kpi.totalIndukan}
          icon={Activity}
          color="text-amber-400"
        />
        <KPICard
          label="Sedang Bunting"
          value={kpi.totalBunting}
          icon={Heart}
          color={kpi.totalBunting > 0 ? 'text-amber-400' : 'text-white'}
        />
        <KPICard
          label="Conception Rate"
          value={kpi.conceptionPct ? `${kpi.conceptionPct}%` : '—'}
          sub="Target ≥ 70%"
          icon={TrendingUp}
          color={
            kpi.conceptionPct >= 70 ? 'text-green-400'
            : kpi.conceptionPct     ? 'text-amber-400'
            : 'text-[#4B6478]'
          }
        />
        <KPICard
          label="Calving Interval"
          value={kpi.avgInterval ? `${kpi.avgInterval}h` : '—'}
          sub="Target ≤ 365 hari"
          icon={Baby}
          color={
            kpi.avgInterval && kpi.avgInterval <= 365 ? 'text-green-400'
            : kpi.avgInterval                         ? 'text-red-400'
            : 'text-[#4B6478]'
          }
        />
      </div>

      {/* Alerts */}
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

      {/* IB / Kebuntingan Aktif */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-['Sora'] font-bold text-sm text-white">IB & Kebuntingan Aktif</h2>
          <button
            onClick={() => navigate(`${BASE}/reproduksi`)}
            className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold"
          >
            Lihat semua <ChevronRight size={13} />
          </button>
        </div>

        {activeMatings.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
            <p className="text-3xl mb-3">🐂</p>
            <p className="text-sm font-semibold text-white mb-1">Belum ada IB/kawin aktif</p>
            <p className="text-xs text-[#4B6478] mb-4">Catat IB pertama dari halaman Reproduksi</p>
            <button
              onClick={() => navigate(`${BASE}/reproduksi`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <Plus size={13} />
              Catat IB
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeMatings.slice(0, 5).map(m => (
              <MatingCard
                key={m.id}
                mating={m}
                onClick={() => navigate(`${BASE}/reproduksi`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Ringkasan total pedet */}
      {kpi.totalBorn > 0 && (
        <section className="px-4 mt-6">
          <button
            onClick={() => navigate(`${BASE}/laporan`)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <Baby size={16} className="text-amber-400" />
              <div className="text-left">
                <p className="text-sm font-bold text-white">{kpi.totalBorn} Pedet Lahir Hidup</p>
                <p className="text-[11px] text-[#4B6478]">Lihat laporan reproduksi lengkap</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-[#4B6478]" />
          </button>
        </section>
      )}

    </div>
  )
}
