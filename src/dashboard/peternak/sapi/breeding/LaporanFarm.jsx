import React, { useMemo } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import {
  useSapiBreedingAnimals,
  useSapiBreedingMatingRecords,
  useSapiBreedingBirths,
  useSapiBreedingHealthLogs,
  useSapiBreedingSales,
  calcConceptionRate,
  calcCalvingInterval,
} from '@/lib/hooks/useSapiBreedingData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'

// ─── KPI Targets — Sapi Breeding ─────────────────────────────────────────────
const TARGETS = {
  conceptionRate:  70,   // % (bunting / total IB)
  scRatio:        1.7,   // S/C — lower is better
  calvingRate:    80,    // % (kelahiran / bunting confirmed)
  calvingInterval: 365,  // hari — lower is better
  mortalitasPerdet: 5,   // % — lower is better
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <p className="text-[11px] text-[#4B6478] font-semibold uppercase tracking-wider mb-2">{children}</p>
  )
}

function KPIRow({ label, value, target, unit = '', lowerBetter = false, note }) {
  const num = parseFloat(value)
  const valid = value !== null && value !== undefined && !isNaN(num)
  const ok = valid ? (lowerBetter ? num <= target : num >= target) : null
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="flex-1 pr-3">
        <p className="text-sm text-[#F1F5F9]">{label}</p>
        {note && <p className="text-[10px] text-[#4B6478]">{note}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className={`text-sm font-bold ${
            !valid ? 'text-[#4B6478]'
            : ok    ? 'text-green-400'
            :          'text-red-400'
          }`}>
            {valid ? `${value}${unit}` : '—'}
          </p>
          <p className="text-[10px] text-[#4B6478]">
            target: {lowerBetter ? '≤' : '≥'}{target}{unit}
          </p>
        </div>
        {valid
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SapiBreedingLaporanFarm() {
  const { data: animals  = [], isLoading: lA } = useSapiBreedingAnimals()
  const { data: matings  = [], isLoading: lM } = useSapiBreedingMatingRecords()
  const { data: births   = [], isLoading: lB } = useSapiBreedingBirths()
  const { data: health   = [] }                = useSapiBreedingHealthLogs()
  const { data: sales    = [] }                = useSapiBreedingSales()

  const isLoading = lA || lM || lB

  const kpi = useMemo(() => {
    if (!animals.length && !matings.length) return null

    const aktif    = animals.filter(a => a.status !== 'mati' && a.status !== 'terjual')
    const indukan  = aktif.filter(a => a.purpose === 'indukan' && a.sex === 'betina')
    const pejantan = aktif.filter(a => a.sex === 'jantan')
    const bunting  = animals.filter(a => a.status === 'bunting')

    // IB metrics
    const totalIB       = matings.filter(m => m.method === 'ib').length
    const totalKawin    = matings.length
    const buntingCount  = matings.filter(m => ['bunting','melahirkan'].includes(m.status)).length

    // S/C ratio: total IB attempts (sum of repeat_ib_count) / confirmed pregnancies
    const totalIBAttempts = matings
      .filter(m => m.method === 'ib')
      .reduce((s, m) => s + (m.repeat_ib_count ?? 1), 0)
    const scRatio = buntingCount > 0
      ? (totalIBAttempts / buntingCount).toFixed(2)
      : null

    // Calving rate: births / bunting confirmed × 100
    const totalKelahiran = births.length
    const calvingRate = buntingCount > 0
      ? ((totalKelahiran / buntingCount) * 100).toFixed(1)
      : null

    // Conception rate: bunting confirmed / total mated
    const conceptionRate = calcConceptionRate(buntingCount, totalKawin)

    // Calving interval (days between consecutive births per dam)
    const damBirths = {}
    births.forEach(b => {
      if (!damBirths[b.dam_id]) damBirths[b.dam_id] = []
      damBirths[b.dam_id].push(b.partus_date)
    })
    const intervals = []
    Object.values(damBirths).forEach(dates => {
      const sorted = dates.slice().sort()
      for (let i = 1; i < sorted.length; i++) {
        const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000
        intervals.push(diff)
      }
    })
    const avgCalvingInterval = intervals.length
      ? Math.round(intervals.reduce((s, d) => s + d, 0) / intervals.length)
      : null

    // Pedet mortality: total born dead / total born × 100
    const totalLahirHidup = births.reduce((s, b) => s + (b.total_born_alive ?? 0), 0)
    const totalLahirMati  = births.reduce((s, b) => s + ((b.total_born ?? 0) - (b.total_born_alive ?? 0)), 0)
    const totalLahir      = totalLahirHidup + totalLahirMati
    const mortalitasPerdet = totalLahir > 0
      ? ((totalLahirMati / totalLahir) * 100).toFixed(1)
      : null

    // Freemartin risk count
    const freemartinRisk = births.filter(b => b.is_freemartin_risk).length

    // Financial
    const totalPenerimaan = sales.reduce((s, sv) => s + (sv.price_per_head ?? 0), 0)

    return {
      totalAktif: aktif.length,
      indukan: indukan.length,
      pejantan: pejantan.length,
      bunting: bunting.length,
      totalKawin,
      totalIB,
      buntingCount,
      totalKelahiran,
      totalLahirHidup,
      totalLahirMati,
      conceptionRate,
      scRatio,
      calvingRate,
      avgCalvingInterval,
      mortalitasPerdet,
      freemartinRisk,
      totalPenerimaan,
      salesCount: sales.length,
    }
  }, [animals, matings, births, sales])

  // Weight progression by parity
  const weightChartData = useMemo(() => {
    const byParity = {}
    animals.forEach(a => {
      if (!a.latest_weight_kg) return
      const p = a.parity ?? 0
      if (!byParity[p]) byParity[p] = []
      byParity[p].push(a.latest_weight_kg)
    })
    return Object.entries(byParity)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([parity, weights]) => ({
        parity: `P${parity}`,
        'Rata-rata BB': Number((weights.reduce((s, w) => s + w, 0) / weights.length).toFixed(1)),
      }))
  }, [animals])

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>

  if (!kpi || (animals.length === 0 && matings.length === 0)) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 px-8 text-center">
        <span className="text-5xl">📊</span>
        <p className="text-sm font-bold text-[#F1F5F9]">Belum ada data untuk dilaporkan</p>
        <p className="text-xs text-[#4B6478]">Tambahkan indukan dan catat IB untuk melihat laporan KPI reproduksi.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-4 pb-28">
      <div>
        <h1 className="font-['Sora'] font-bold text-xl text-white">Laporan Farm</h1>
        <p className="text-[11px] text-[#4B6478]">Breeding Sapi — Cow-Calf</p>
      </div>

      {/* Ringkasan Kawanan */}
      <div>
        <SectionTitle>Ringkasan Kawanan</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard
            label="Total Aktif"
            value={kpi.totalAktif}
            sub={`${kpi.indukan} indukan · ${kpi.pejantan} pejantan`}
          />
          <SummaryCard
            label="Sedang Bunting"
            value={kpi.bunting}
            sub={`dari ${kpi.buntingCount} IB dikonfirmasi`}
            color={kpi.bunting > 0 ? 'text-amber-400' : 'text-white'}
          />
          <SummaryCard
            label="Total Kelahiran"
            value={kpi.totalKelahiran}
            sub={`${kpi.totalLahirHidup} pedet lahir hidup`}
            color="text-amber-400"
          />
          <SummaryCard
            label="Total Penjualan"
            value={kpi.salesCount}
            sub={`Rp ${kpi.totalPenerimaan.toLocaleString('id-ID')}`}
            color="text-green-400"
          />
        </div>
      </div>

      {/* Weight by Parity Chart */}
      {weightChartData.length >= 2 && (
        <div>
          <SectionTitle>Rata-rata Bobot per Parity</SectionTitle>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weightChartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <XAxis dataKey="parity" tick={{ fill: '#4B6478', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4B6478', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={400} stroke="#F59E0B" strokeDasharray="4 2"
                  label={{ value: '400 kg', fill: '#F59E0B', fontSize: 9 }} />
                <Line type="monotone" dataKey="Rata-rata BB" stroke="#D97706"
                  strokeWidth={2} dot={{ fill: '#D97706', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* KPI vs Target */}
      <div>
        <SectionTitle>KPI Reproduksi vs Target</SectionTitle>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-2">
          <KPIRow
            label="Conception Rate"
            value={kpi.conceptionRate}
            target={TARGETS.conceptionRate}
            unit="%"
            note="Bunting dikonfirmasi / total dikawinkan"
          />
          {kpi.scRatio && (
            <KPIRow
              label="S/C Ratio (Service per Conception)"
              value={kpi.scRatio}
              target={TARGETS.scRatio}
              lowerBetter
              note={`${kpi.totalIBAttempts ?? kpi.totalIB} IB / ${kpi.buntingCount} bunting dikonfirmasi`}
            />
          )}
          {kpi.calvingRate && (
            <KPIRow
              label="Calving Rate"
              value={kpi.calvingRate}
              target={TARGETS.calvingRate}
              unit="%"
              note="Kelahiran / bunting dikonfirmasi × 100"
            />
          )}
          {kpi.avgCalvingInterval && (
            <KPIRow
              label="Calving Interval"
              value={kpi.avgCalvingInterval}
              target={TARGETS.calvingInterval}
              unit=" hari"
              lowerBetter
              note="Rata-rata jarak antar kelahiran per indukan"
            />
          )}
          {kpi.mortalitasPerdet && (
            <KPIRow
              label="Mortalitas Pedet (lahir mati)"
              value={kpi.mortalitasPerdet}
              target={TARGETS.mortalitasPerdet}
              unit="%"
              lowerBetter
              note={`${kpi.totalLahirMati} lahir mati dari ${kpi.totalLahirHidup + kpi.totalLahirMati} total`}
            />
          )}
        </div>
      </div>

      {/* Freemartin alert */}
      {kpi.freemartinRisk > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">
          <p className="text-sm font-bold text-amber-300">⚠ {kpi.freemartinRisk} Pedet Berisiko Freemartin</p>
          <p className="text-[11px] text-[#4B6478] mt-1">
            Kelahiran kembar jantan+betina — periksa kesuburan pedet betina sebelum dijadikan calon bibit.
          </p>
        </div>
      )}

      {/* Distribusi Status */}
      <div>
        <SectionTitle>Distribusi Status Ternak</SectionTitle>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-2">
          {[
            { label: 'Aktif',    value: animals.filter(a => a.status === 'aktif').length,    color: 'text-green-400' },
            { label: 'Bunting',  value: animals.filter(a => a.status === 'bunting').length,  color: 'text-amber-400' },
            { label: 'Terjual',  value: animals.filter(a => a.status === 'terjual').length,  color: 'text-teal-300'  },
            { label: 'Afkir',    value: animals.filter(a => a.status === 'afkir').length,    color: 'text-amber-300' },
            { label: 'Mati',     value: animals.filter(a => a.status === 'mati').length,     color: 'text-red-400'   },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <p className="text-sm text-[#F1F5F9]">{row.label}</p>
              <p className={`text-sm font-bold ${row.color}`}>{row.value} ekor</p>
            </div>
          ))}
        </div>
      </div>

      {/* Distribusi Tujuan */}
      <div>
        <SectionTitle>Tujuan Ternak (Aktif)</SectionTitle>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-2">
          {[
            { key: 'indukan',         label: 'Indukan'          },
            { key: 'pejantan_unggul', label: 'Pejantan Unggul'  },
            { key: 'calon_bibit',     label: 'Calon Bibit'      },
            { key: 'afkir',           label: 'Afkir'            },
          ].map(row => {
            const count = animals.filter(a => a.status !== 'mati' && a.status !== 'terjual' && a.purpose === row.key).length
            if (!count) return null
            return (
              <div key={row.key} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                <p className="text-sm text-[#F1F5F9]">{row.label}</p>
                <p className="text-sm font-bold text-white">{count} ekor</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Penjualan */}
      {sales.length > 0 && (
        <div>
          <SectionTitle>Penjualan per Tipe Produk</SectionTitle>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-2">
            {[
              { key: 'bibit_jantan', label: 'Bibit Jantan Unggul'    },
              { key: 'bibit_betina', label: 'Bibit Betina / Dara'    },
              { key: 'pedet_sapih',  label: 'Pedet Sapih'            },
              { key: 'indukan_afkir',label: 'Indukan Afkir'          },
              { key: 'lainnya',      label: 'Lainnya'                },
            ].map(row => {
              const items = sales.filter(s => s.product_type === row.key)
              if (!items.length) return null
              const total = items.reduce((s, sv) => s + (sv.price_per_head ?? 0), 0)
              return (
                <div key={row.key} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm text-[#F1F5F9]">{row.label}</p>
                    <p className="text-[10px] text-[#4B6478]">{items.length} ekor</p>
                  </div>
                  <p className="text-sm font-bold text-green-400">Rp {total.toLocaleString('id-ID')}</p>
                </div>
              )
            })}
            <div className="flex items-center justify-between py-2.5 mt-1 border-t border-white/[0.1]">
              <p className="text-sm font-bold text-white">Total Penerimaan</p>
              <p className="text-sm font-bold text-green-400">Rp {kpi.totalPenerimaan.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
