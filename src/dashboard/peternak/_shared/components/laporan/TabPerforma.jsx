import React, { useMemo } from 'react'
import { TrendingUp, Activity, Calendar, ChevronRight, Info, DollarSign, LayoutGrid, Beef, ShoppingCart } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { StatCard, SectionTitle, fmtRp, fmtNum } from './shared'

/**
 * Props:
 *   batches        — array dari useBatches()
 *   animals        — array dari useAnimalsByBatches()
 *   sales          — array dari useSalesByBatches()
 *   weightHistory  — array dari useBatchWeightHistoryByBatches()
 *   healthLogs     — array dari useHealthLogsByBatches()
 *   navigate       — useNavigate()
 *   BASE           — string route prefix, e.g. "/peternak/peternak_domba_penggemukan"
 *   adgBenchmark   — string, e.g. "≥150 g/hari"
 *   calcHariDiFarm — (startDate, endDate?) => number
 */
export default function TabPerforma({ batches, animals, sales, weightHistory, healthLogs, navigate, BASE, adgBenchmark, calcHariDiFarm }) {
  // Active count per batch (excludes sold/dead/culled)
  const activeCountByBatch = useMemo(() => {
    const map = {}
    animals.forEach(a => {
      if (a.status === 'active') map[a.batch_id] = (map[a.batch_id] || 0) + 1
    })
    return map
  }, [animals])

  const stats = useMemo(() => {
    const totalRevenue    = sales.reduce((s, x) => s + (parseFloat(x.total_revenue_idr) || 0), 0)
    const totalSold       = sales.reduce((s, x) => s + (parseInt(x.animal_count) || 0), 0)
    const totalBeliTernak = animals.reduce((s, a) => s + (parseFloat(a.purchase_price_idr) || 0), 0)

    const adgPerAnimal = animals.map(a => {
      const recs = weightHistory
        .filter(w => w.animal_id === a.id)
        .sort((x, y) => x.weigh_date.localeCompare(y.weigh_date))
      if (recs.length < 2) return null
      const first = recs[0], last = recs[recs.length - 1]
      const days = calcHariDiFarm(first.weigh_date, last.weigh_date)
      if (days <= 0) return null
      return ((last.weight_kg - first.weight_kg) / days) * 1000
    }).filter(Boolean)

    const avgADG = adgPerAnimal.length > 0
      ? adgPerAnimal.reduce((s, x) => s + x, 0) / adgPerAnimal.length
      : null

    const kematianCount  = healthLogs.filter(l => l.log_type === 'kematian').length
    const totalAnimals   = batches.reduce((s, b) => s + (b.total_animals || 0), 0)
    const mortalitasRate = totalAnimals > 0 ? (kematianCount / totalAnimals) * 100 : 0

    return { totalRevenue, totalSold, totalBeliTernak, avgADG, kematianCount, mortalitasRate, totalAnimals }
  }, [batches, animals, sales, weightHistory, healthLogs, calcHariDiFarm])

  return (
    <div className="space-y-6">
      {/* Revenue hero */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-[28px] p-6 shadow-xl shadow-green-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={80} /></div>
        <div className="relative z-10 text-white">
          <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.2em] mb-1.5">Total Revenue Penjualan</p>
          <p className="text-3xl font-black font-['Sora'] mb-4 tracking-tight">{fmtRp(stats.totalRevenue)}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <p className="text-[9px] text-white/60 font-bold uppercase mb-0.5">Ekor Terjual</p>
              <p className="text-xs font-black">{stats.totalSold > 0 ? `${stats.totalSold} Ekor` : '—'}</p>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <p className="text-[9px] text-white/60 font-bold uppercase mb-0.5">Harga Beli Ternak</p>
              <p className="text-xs font-black">{fmtRp(stats.totalBeliTernak)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="ADG Rata-rata"
          value={stats.avgADG ? `${Math.round(stats.avgADG)} g/hr` : '—'}
          sub="Average Daily Gain"
          icon={TrendingUp}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          border="border-emerald-500/20"
        />
        <StatCard
          label="Mortalitas"
          value={`${fmtNum(stats.mortalitasRate)}%`}
          sub={`${stats.kematianCount} dari ${stats.totalAnimals} ekor`}
          icon={Activity}
          color={stats.mortalitasRate > 5 ? 'text-rose-400' : 'text-green-400'}
          bg={stats.mortalitasRate > 5 ? 'bg-rose-500/10' : 'bg-green-500/10'}
          border={stats.mortalitasRate > 5 ? 'border-rose-500/20' : 'border-green-500/20'}
        />
        <StatCard
          label="Total Ternak"
          value={`${stats.totalAnimals} Ekor`}
          sub={`${batches.length} batch`}
          icon={Beef}
          color="text-amber-400"
        />
        <StatCard
          label="Harga Rata-rata/Ekor"
          value={stats.totalSold > 0 ? fmtRp(stats.totalRevenue / stats.totalSold) : '—'}
          sub="Saat penjualan"
          icon={ShoppingCart}
          color="text-blue-400"
        />
      </div>

      {/* ADG benchmark */}
      <div className="bg-blue-500/5 border border-blue-500/10 rounded-[24px] p-4 flex gap-3">
        <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Target ADG ideal adalah{' '}
          <span className="text-blue-300 font-bold">{adgBenchmark}</span>.
          ADG aktual dihitung dari selisih timbangan pertama dan terakhir per ekor.
        </p>
      </div>

      {/* Batch list */}
      <div>
        <SectionTitle>Daftar Batch</SectionTitle>
        <div className="space-y-3">
          {batches.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-[32px]">
              <LayoutGrid size={32} className="mx-auto text-white/5 mb-3" />
              <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Belum ada data batch</p>
            </div>
          ) : batches.map(batch => {
            const hari        = calcHariDiFarm(batch.start_date)
            const statusColor = batch.status === 'active'
              ? 'text-green-400 bg-green-400/10 border-green-500/20'
              : 'text-slate-400 bg-white/5 border-white/10'
            const batchRevenue = sales
              .filter(s => s.batch_id === batch.id)
              .reduce((s, x) => s + (parseFloat(x.total_revenue_idr) || 0), 0)

            return (
              <motion.div
                key={batch.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`${BASE}/ternak?batch=${batch.id}`)}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between group active:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border shrink-0', statusColor)}>
                    <Activity size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-black text-white group-hover:text-green-400 transition-colors uppercase font-['Sora'] tracking-tight">
                        {batch.batch_code}
                      </p>
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase border', statusColor)}>
                        {batch.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#4B6478] font-medium flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(batch.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                      <span>·</span>
                      <span>{hari} hari</span>
                      <span>·</span>
                      <span className="font-bold text-slate-300">
                        {activeCountByBatch[batch.id] ?? batch.total_animals} aktif
                        {batch.total_animals > (activeCountByBatch[batch.id] ?? batch.total_animals) && (
                          <span className="text-[#4B6478] font-normal"> · {batch.total_animals} terdaftar</span>
                        )}
                      </span>
                    </div>
                    {batchRevenue > 0 && (
                      <p className="text-[10px] text-green-400 font-bold mt-0.5">{fmtRp(batchRevenue)}</p>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#232F39] group-hover:text-green-400 transition-colors shrink-0" />
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
