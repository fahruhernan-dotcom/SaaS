import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Heart, Tag, TrendingUp, AlertCircle, ChevronRight, Baby } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useDombaBreedingAnimals,
  useDombaBreedingMatings,
  useDombaBreedingBirths,
  calcConceptionRate,
  calcLambingRate,
  calcLitterSize,
  calcAgeInDays,
} from '@/lib/hooks/useDombaBreedingData'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'

const BASE = '/peternak/peternak_domba_breeding'

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

function AlertCard({ message, type = 'warning' }) {
  const colors = type === 'warning'
    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
    : 'bg-red-500/10 border-red-500/20 text-red-300'
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 ${colors}`}>
      <AlertCircle size={14} className="shrink-0 mt-0.5" />
      <p className="text-xs">{message}</p>
    </div>
  )
}

export default function BreedingBeranda() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const { data: animals = [], isLoading: loadingAnimals } = useDombaBreedingAnimals()
  const { data: matings = [], isLoading: loadingMatings } = useDombaBreedingMatings()
  const { data: births = [] } = useDombaBreedingBirths()

  const stats = useMemo(() => {
    const aktif    = animals.filter(a => a.status === 'aktif')
    const indukan  = aktif.filter(a => a.sex === 'betina')
    const pejantan = aktif.filter(a => a.sex === 'jantan')
    const cempe    = aktif.filter(a => a.birth_date && calcAgeInDays(a.birth_date) <= 90)

    const totalKawin   = matings.length
    const totalBunting = matings.filter(m => m.status === 'bunting' || m.status === 'melahirkan').length
    const totalLahir   = births.reduce((s, b) => s + (b.total_born || 0), 0)
    const totalHidup   = births.reduce((s, b) => s + (b.total_born_alive || 0), 0)

    // Upcoming partus within 30 days
    const today = new Date()
    const upcoming = matings.filter(m => {
      if (m.status !== 'bunting' || !m.est_partus_date) return false
      const diff = (new Date(m.est_partus_date) - today) / 86400000
      return diff >= 0 && diff <= 30
    })

    // Overdue: est_partus_date passed but no melahirkan
    const overdue = matings.filter(m => {
      if (m.status !== 'bunting' || !m.est_partus_date) return false
      return new Date(m.est_partus_date) < today
    })

    return {
      totalAktif: aktif.length,
      indukan: indukan.length,
      pejantan: pejantan.length,
      cempe: cempe.length,
      conceptionRate: calcConceptionRate(totalBunting, totalKawin),
      lambingRate: calcLambingRate(totalHidup, totalKawin),
      litterSize: calcLitterSize(totalHidup, births.length),
      upcoming,
      overdue,
    }
  }, [animals, matings, births])

  const isLoading = loadingAnimals || loadingMatings

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-4 pb-28">
      {/* Header */}
      <div>
        <p className="text-xs text-[#4B6478] font-medium" suppressHydrationWarning>
          Selamat {getGreeting()}, {profile?.name?.split(' ')[0] ?? 'Peternak'} 👋
        </p>
        <h1 className="font-['Sora'] font-bold text-xl text-white mt-0.5">Breeding Farm</h1>
        <p className="text-[11px] text-[#4B6478]">Kambing & Domba — Pembibitan</p>
      </div>

      {/* Alerts */}
      {stats.overdue.length > 0 && (
        <AlertCard
          type="error"
          message={`${stats.overdue.length} indukan melewati estimasi partus — periksa kondisi segera`}
        />
      )}
      {stats.upcoming.length > 0 && (
        <AlertCard
          message={`${stats.upcoming.length} indukan diprediksi melahirkan dalam 30 hari ke depan`}
        />
      )}

      {/* KPI Grid */}
      <div>
        <p className="text-[11px] text-[#4B6478] font-semibold uppercase tracking-wider mb-2">Ringkasan Kawanan</p>
        <div className="grid grid-cols-2 gap-2">
          <KPICard icon={Tag} label="Total Aktif" value={stats.totalAktif} sub={`${stats.indukan} betina · ${stats.pejantan} jantan`} />
          <KPICard icon={Baby} label="Cempe (≤90 hr)" value={stats.cempe} color="text-teal-300" />
          <KPICard icon={Heart} label="Conception Rate" value={`${stats.conceptionRate}%`}
            color={stats.conceptionRate >= 80 ? 'text-green-400' : 'text-red-400'}
            sub="Target ≥ 80%" />
          <KPICard icon={TrendingUp} label="Litter Size" value={stats.litterSize || '—'}
            color={stats.litterSize >= 1.5 ? 'text-green-400' : 'text-amber-400'}
            sub="Target ≥ 1.5" />
        </div>
      </div>

      {/* Upcoming Partus */}
      {stats.upcoming.length > 0 && (
        <div>
          <p className="text-[11px] text-[#4B6478] font-semibold uppercase tracking-wider mb-2">Mendekati Partus (30 hari)</p>
          <div className="flex flex-col gap-2">
            {stats.upcoming.map(m => {
              const daysLeft = Math.ceil((new Date(m.est_partus_date) - new Date()) / 86400000)
              return (
                <motion.div
                  key={m.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`${BASE}/reproduksi`)}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{m.dam?.ear_tag}</p>
                    <p className="text-[11px] text-[#4B6478]">{m.dam?.name ?? 'Indukan'} · {m.dam?.species}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-teal-300 font-['Sora'] font-black text-lg">{daysLeft}</p>
                    <p className="text-[10px] text-[#4B6478]">hari lagi</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Nav */}
      <div>
        <p className="text-[11px] text-[#4B6478] font-semibold uppercase tracking-wider mb-2">Menu Cepat</p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Data Ternak & Pedigree', sub: `${stats.totalAktif} ekor aktif`, path: `${BASE}/ternak`, icon: Tag },
            { label: 'Reproduksi', sub: `${matings.length} perkawinan dicatat`, path: `${BASE}/reproduksi`, icon: Heart },
          ].map(item => (
            <motion.div
              key={item.path}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <item.icon size={16} className="text-teal-400" />
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-[11px] text-[#4B6478]">{item.sub}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#4B6478]" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {animals.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-5xl">ðŸ‘</span>
          <p className="text-sm font-bold text-[#F1F5F9]">Belum ada ternak</p>
          <p className="text-xs text-[#4B6478] max-w-xs">Tambahkan ternak di menu Ternak untuk mulai memantau kawanan breeding Anda.</p>
        </div>
      )}
    </div>
  )
}