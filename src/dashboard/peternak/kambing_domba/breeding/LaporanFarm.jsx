import React, { useMemo } from 'react'
import { CheckCircle2, XCircle, BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import {
  useKdBreedingAnimals,
  useKdBreedingMatings,
  useKdBreedingBirths,
  useKdBreedingHealthLogs,
  useKdBreedingFeedLogs,
  useKdBreedingSales,
  calcConceptionRate,
  calcLambingRate,
  calcWeaningRate,
  calcLitterSize,
  calcBreedingRCRatio,
  calcBreedingADG,
  calcAgeInDays,
} from '@/lib/hooks/useKdBreedingData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'

// â”€â”€â”€ KPI Targets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TARGETS = {
  conceptionRate: 80,   // %
  lambingRate:    130,  // %
  litterSize:     1.5,
  weaningRate:    90,   // %
  mortalitasAnak: 10,   // % (lower is better)
  rcRatio:        1.5,
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SectionTitle({ children }) {
  return (
    <p className="text-[11px] text-[#4B6478] font-semibold uppercase tracking-wider mb-2">{children}</p>
  )
}

function KPIRow({ label, value, target, unit = '', lowerBetter = false, note }) {
  const num = parseFloat(value)
  const ok = lowerBetter ? num <= target : num >= target
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="flex-1">
        <p className="text-sm text-[#F1F5F9]">{label}</p>
        {note && <p className="text-[10px] text-[#4B6478]">{note}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className={`text-sm font-bold ${ok ? 'text-green-400' : 'text-red-400'}`}>
            {value === null || value === undefined || isNaN(num) ? '—' : `${value}${unit}`}
          </p>
          <p className="text-[10px] text-[#4B6478]">
            target: {lowerBetter ? '≤' : '≥'}{target}{unit}
          </p>
        </div>
        {!isNaN(num)
          ? ok
            ? <CheckCircle2 size={16} className="text-green-400 shrink-0" />
            : <XCircle size={16} className="text-red-400 shrink-0" />
          : <span className="w-4" />
        }
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <p className={`font-['Sora'] font-black text-2xl leading-none mb-1 ${color}`}>{value}</p>
      <p className="text-[11px] text-[#4B6478] font-semibold">{label}</p>
      {sub && <p className="text-[10px] text-[#4B6478] mt-0.5">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1C2B3A] border border-white/[0.08] rounded-xl px-3 py-2 text-xs">
      <p className="text-[#4B6478] mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value} kg</p>
      ))}
    </div>
  )
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function BreedingLaporanFarm() {
  const { data: animals = [], isLoading: lA } = useKdBreedingAnimals()
  const { data: matings = [], isLoading: lM } = useKdBreedingMatings()
  const { data: births  = [], isLoading: lB } = useKdBreedingBirths()
  const { data: health  = [] }                = useKdBreedingHealthLogs()
  const { data: feeds   = [] }                = useKdBreedingFeedLogs()
  const { data: sales   = [] }                = useKdBreedingSales()

  const isLoading = lA || lM || lB

  const kpi = useMemo(() => {
    if (!animals.length && !matings.length) return null

    const aktif    = animals.filter(a => a.status === 'aktif')
    const indukan  = aktif.filter(a => a.sex === 'betina')
    const pejantan = aktif.filter(a => a.sex === 'jantan')
    const mati     = animals.filter(a => a.status === 'mati')

    // Reproduksi
    const totalKawin    = matings.length
    const totalBunting  = matings.filter(m => ['bunting','melahirkan'].includes(m.status)).length
    const totalLahir    = births.reduce((s, b) => s + b.total_born, 0)
    const totalHidup    = births.reduce((s, b) => s + b.total_born_alive, 0)
    const totalMati     = births.reduce((s, b) => s + (b.total_born - b.total_born_alive), 0)
    const totalKelahiran = births.length

    // Weaning: cempe yang sudah ≥90 hari (proxy) — count as sold or as "sapih"
    // Simple approximation: animals lahir dari births vs those still aktif + sapih
    const sapihAnimals  = animals.filter(a => {
      if (!a.birth_date) return false
      const age = calcAgeInDays(a.birth_date)
      return age >= 90 && age <= 365
    })

    // Growth — ADG from weight records (via latest vs birth)
    const withWeight = animals.filter(a => a.latest_weight_kg && a.birth_date && a.birth_weight_kg)
    const avgADG = withWeight.length
      ? (withWeight.reduce((s, a) => {
          const days = calcAgeInDays(a.birth_date)
          if (!days) return s
          return s + calcBreedingADG(a.birth_weight_kg, a.latest_weight_kg, days)
        }, 0) / withWeight.length).toFixed(1)
      : null

    // Mortality adults
    const mortalitasDewaasaPct = animals.filter(a => a.birth_date && calcAgeInDays(a.birth_date) > 90).length
      ? ((mati.filter(a => a.birth_date && calcAgeInDays(a.birth_date) > 90).length /
          animals.filter(a => a.birth_date && calcAgeInDays(a.birth_date) > 90).length) * 100).toFixed(1)
      : null

    // Financial
    const totalPenerimaan = sales.reduce((s, sv) => s + sv.price_per_head, 0)
    const totalPakanBiaya = 0  // No cost tracking in feed logs — placeholder

    // Lambing interval: avg days between births per dam
    const damBirths = {}
    births.forEach(b => {
      if (!damBirths[b.dam_id]) damBirths[b.dam_id] = []
      damBirths[b.dam_id].push(b.partus_date)
    })
    const intervals = []
    Object.values(damBirths).forEach(dates => {
      const sorted = dates.slice().sort()
      for (let i = 1; i < sorted.length; i++) {
        const diff = (new Date(sorted[i]) - new Date(sorted[i-1])) / 86400000
        intervals.push(diff)
      }
    })
    const avgIntervalBulan = intervals.length
      ? (intervals.reduce((s, d) => s + d, 0) / intervals.length / 30.4).toFixed(1)
      : null

    return {
      totalAktif: aktif.length,
      indukan: indukan.length,
      pejantan: pejantan.length,
      conceptionRate: calcConceptionRate(totalBunting, totalKawin),
      lambingRate:    calcLambingRate(totalHidup, totalKawin),
      litterSize:     calcLitterSize(totalHidup, totalKelahiran),
      weaningRate:    sapihAnimals.length && totalHidup
        ? calcWeaningRate(sapihAnimals.length, totalHidup)
        : null,
      mortalitasAnak: totalHidup
        ? ((totalMati / (totalHidup + totalMati)) * 100).toFixed(1)
        : null,
      avgIntervalBulan,
      avgADG,
      totalPenerimaan,
      totalKawin,
      totalLahir,
      totalHidup,
      kelahiran: totalKelahiran,
      sales: sales.length,
    }
  }, [animals, matings, births, sales])

  // Weight progression chart: average weight of animals by age bucket
  const weightChartData = useMemo(() => {
    const buckets = {}
    animals.forEach(a => {
      if (!a.birth_date || !a.latest_weight_kg) return
      const ageDays = calcAgeInDays(a.birth_date)
      const bucket  = Math.floor(ageDays / 30) * 30
      if (!buckets[bucket]) buckets[bucket] = []
      buckets[bucket].push(a.latest_weight_kg)
    })
    return Object.entries(buckets)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([days, weights]) => ({
        hari: `${days} hr`,
        'Rata-rata Bobot': Number((weights.reduce((s, w) => s + w, 0) / weights.length).toFixed(1)),
      }))
  }, [animals])

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>

  if (!kpi || (animals.length === 0 && matings.length === 0)) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 px-8 text-center">
        <div className="w-16 h-16 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <BarChart3 size={32} className="text-green-500" />
        </div>
        <p className="text-sm font-bold text-[#F1F5F9]">Belum ada data untuk dilaporkan</p>
        <p className="text-xs text-[#4B6478]">Tambahkan ternak dan catat perkawinan untuk melihat laporan KPI.</p>
      </div>
    )
  }

  const rcRatio = kpi.totalPenerimaan > 0
    ? calcBreedingRCRatio(kpi.totalPenerimaan, 1)  // placeholder — no cost tracking
    : null

  return (
    <div className="flex flex-col gap-5 p-4 pb-28">
      <div>
        <h1 className="font-['Sora'] font-bold text-xl text-white">Laporan Farm</h1>
        <p className="text-[11px] text-[#4B6478]">Breeding Kambing & Domba</p>
      </div>

      {/* Ringkasan Kawanan */}
      <div>
        <SectionTitle>Ringkasan Kawanan</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard label="Total Aktif" value={kpi.totalAktif}
            sub={`${kpi.indukan} betina · ${kpi.pejantan} jantan`} />
          <SummaryCard label="Total Kelahiran" value={kpi.kelahiran}
            sub={`${kpi.totalHidup} lahir hidup`} color="text-teal-300" />
          <SummaryCard label="Total Penjualan" value={kpi.sales}
            sub={`Rp ${kpi.totalPenerimaan.toLocaleString('id-ID')}`} color="text-green-400" />
          <SummaryCard label="Perkawinan" value={kpi.totalKawin}
            sub={`${matings.filter(m => m.status === 'bunting').length} sedang bunting`} />
        </div>
      </div>

      {/* Weight Progression Chart */}
      {weightChartData.length > 1 && (
        <div>
          <SectionTitle>Rata-rata Bobot per Kelompok Umur</SectionTitle>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weightChartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <XAxis dataKey="hari" tick={{ fill: '#4B6478', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4B6478', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={12} stroke="#F59E0B" strokeDasharray="4 2"
                  label={{ value: 'Sapih 12kg', fill: '#F59E0B', fontSize: 9 }} />
                <Line type="monotone" dataKey="Rata-rata Bobot" stroke="#0D9488"
                  strokeWidth={2} dot={{ fill: '#0D9488', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* KPI vs Target */}
      <div>
        <SectionTitle>KPI vs Target</SectionTitle>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-2">
          <KPIRow label="Conception Rate"
            value={kpi.conceptionRate} target={TARGETS.conceptionRate} unit="%"
            note="Bunting / total dikawinkan" />
          <KPIRow label="Lambing Rate"
            value={kpi.lambingRate} target={TARGETS.lambingRate} unit="%"
            note="Anak lahir / induk kawin Ã— 100" />
          <KPIRow label="Litter Size"
            value={kpi.litterSize} target={TARGETS.litterSize}
            note="Rata-rata anak lahir hidup per kelahiran" />
          {kpi.weaningRate != null && (
            <KPIRow label="Weaning Rate"
              value={kpi.weaningRate} target={TARGETS.weaningRate} unit="%"
              note="Anak sapih / anak lahir hidup" />
          )}
          {kpi.mortalitasAnak != null && (
            <KPIRow label="Mortalitas Anak Pre-sapih"
              value={kpi.mortalitasAnak} target={TARGETS.mortalitasAnak} unit="%"
              lowerBetter note="Target ≤ 10%" />
          )}
          {kpi.avgIntervalBulan != null && (
            <KPIRow label="Lambing Interval"
              value={kpi.avgIntervalBulan} target={8} unit=" bln"
              lowerBetter note="Jarak antar kelahiran satu induk" />
          )}
          {kpi.avgADG != null && (
            <KPIRow label="ADG Rata-rata"
              value={kpi.avgADG} target={120} unit=" g/hr"
              note="Pertambahan bobot harian rata-rata kawanan" />
          )}
        </div>
      </div>

      {/* Distribusi Status */}
      <div>
        <SectionTitle>Distribusi Status Ternak</SectionTitle>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-2">
          {[
            { label: 'Aktif',    value: animals.filter(a => a.status === 'aktif').length,   color: 'text-green-400'  },
            { label: 'Terjual',  value: animals.filter(a => a.status === 'terjual').length, color: 'text-teal-300'   },
            { label: 'Afkir',    value: animals.filter(a => a.status === 'afkir').length,   color: 'text-amber-300'  },
            { label: 'Mati',     value: animals.filter(a => a.status === 'mati').length,    color: 'text-red-400'    },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <p className="text-sm text-[#F1F5F9]">{row.label}</p>
              <p className={`text-sm font-bold ${row.color}`}>{row.value} ekor</p>
            </div>
          ))}
        </div>
      </div>

      {/* Distribusi Tujuan Ternak */}
      <div>
        <SectionTitle>Tujuan Ternak (Aktif)</SectionTitle>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-2">
          {[
            { key: 'indukan',        label: 'Indukan'          },
            { key: 'pejantan_unggul',label: 'Pejantan Unggul'  },
            { key: 'calon_bibit',    label: 'Calon Bibit'      },
            { key: 'afkir',          label: 'Afkir'            },
          ].map(row => {
            const count = animals.filter(a => a.status === 'aktif' && a.purpose === row.key).length
            return count > 0 ? (
              <div key={row.key} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                <p className="text-sm text-[#F1F5F9]">{row.label}</p>
                <p className="text-sm font-bold text-white">{count} ekor</p>
              </div>
            ) : null
          })}
        </div>
      </div>

      {/* Penjualan per Tipe Produk */}
      {sales.length > 0 && (
        <div>
          <SectionTitle>Penjualan per Tipe Produk</SectionTitle>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-2">
            {[
              { key: 'bibit_jantan', label: 'Bibit Jantan Unggul' },
              { key: 'bibit_betina', label: 'Bibit Betina Dara'   },
              { key: 'cempe_sapih',  label: 'Cempe Sapih'         },
              { key: 'afkir',        label: 'Indukan Afkir'       },
              { key: 'lainnya',      label: 'Lainnya'             },
            ].map(row => {
              const items = sales.filter(s => s.product_type === row.key)
              if (!items.length) return null
              const total = items.reduce((s, sv) => s + sv.price_per_head, 0)
              return (
                <div key={row.key} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm text-[#F1F5F9]">{row.label}</p>
                    <p className="text-[10px] text-[#4B6478]">{items.length} ekor</p>
                  </div>
                  <p className="text-sm font-bold text-green-400">
                    Rp {total.toLocaleString('id-ID')}
                  </p>
                </div>
              )
            })}
            <div className="flex items-center justify-between py-2.5 mt-1 border-t border-white/[0.1]">
              <p className="text-sm font-bold text-white">Total Penerimaan</p>
              <p className="text-sm font-bold text-green-400">
                Rp {kpi.totalPenerimaan.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}