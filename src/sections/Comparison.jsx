import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import AnimatedContent from '../components/reactbits/AnimatedContent'

// ─── Excel mockup (left side) ─────────────────────────────────────────────────

function ExcelMockup() {
  const rows = [
    { date: '12/03',  farm: 'Kandang A',   ekor: '3200', pakan: '980',  mati: '12',   bobot: '2.14' },
    { date: '12/03',  farm: 'Kndng B',     ekor: '',     pakan: '1100', mati: '',     bobot: '#REF!' },
    { date: '13/03',  farm: 'Kandang A',   ekor: '3188', pakan: '1020', mati: '3',    bobot: '2.18' },
    { date: '13/03',  farm: 'Kandang C',   ekor: '5000', pakan: '',     mati: '8',    bobot: '1.97' },
    { date: '14/03',  farm: 'Kndng B',     ekor: '4200', pakan: '1340', mati: '5',    bobot: '#REF!' },
    { date: '14/03',  farm: 'Kandang A',   ekor: '3185', pakan: '1080', mati: '—',    bobot: '2.21' },
    { date: '15/03',  farm: 'Kandang C',   ekor: '',     pakan: '',     mati: '',     bobot: '' },
    { date: '15/03',  farm: 'Kandang A',   ekor: '3182', pakan: '1100', mati: '2',    bobot: '2.25' },
  ]

  const isError = (v) => v === '#REF!' || v === ''

  return (
    <div className="p-3 h-full flex flex-col">
      {/* Toolbar bar */}
      <div className="flex items-center gap-1.5 mb-2 opacity-60">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-2 text-[10px] text-gray-400 font-mono">Laporan_Kandang_2026.xlsx</span>
      </div>

      {/* Formula bar */}
      <div className="flex items-center gap-2 mb-2 bg-[#2d2d2d] rounded px-2 py-1">
        <span className="text-[10px] font-mono text-gray-500 w-6">fx</span>
        <span className="text-[10px] font-mono text-red-400">=SUM(E2:E999)/D2*100</span>
      </div>

      {/* Spreadsheet */}
      <div className="overflow-hidden flex-1 rounded border border-[#3a3a3a]">
        {/* Header */}
        <div className="grid grid-cols-6 bg-[#2d2d2d] border-b border-[#3a3a3a]">
          {['Tanggal', 'Kandang', 'Ekor', 'Pakan', 'Mati', 'Bobot'].map((h) => (
            <div key={h} className="px-1.5 py-1 text-[9px] font-mono text-gray-400 text-center border-r border-[#3a3a3a] last:border-r-0 truncate">
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-6 border-b border-[#2d2d2d] ${i % 2 === 0 ? 'bg-[#1e1e1e]' : 'bg-[#1a1a1a]'}`}
          >
            <div className="px-1.5 py-1 text-[9px] font-mono text-gray-500 border-r border-[#2d2d2d] text-center truncate">{row.date}</div>
            <div className="px-1.5 py-1 text-[9px] font-mono text-gray-300 border-r border-[#2d2d2d] truncate">{row.farm}</div>
            <div className={`px-1.5 py-1 text-[9px] font-mono text-center border-r border-[#2d2d2d] ${isError(row.ekor) ? 'text-gray-600 italic' : 'text-gray-300'}`}>{row.ekor || '—'}</div>
            <div className={`px-1.5 py-1 text-[9px] font-mono text-center border-r border-[#2d2d2d] ${isError(row.pakan) ? 'text-gray-600 italic' : 'text-gray-300'}`}>{row.pakan || '—'}</div>
            <div className={`px-1.5 py-1 text-[9px] font-mono text-center border-r border-[#2d2d2d] ${isError(row.mati) ? 'text-gray-600 italic' : 'text-gray-300'}`}>{row.mati || '—'}</div>
            <div className={`px-1.5 py-1 text-[9px] font-mono text-center ${row.bobot === '#REF!' ? 'bg-yellow-500/25 text-yellow-400 font-bold' : isError(row.bobot) ? 'text-gray-600' : 'text-gray-300'}`}>
              {row.bobot || '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="mt-1.5 flex items-center justify-between opacity-50">
        <span className="text-[9px] font-mono text-gray-500">Sheet1 / Sheet2 / Sheet3</span>
        <span className="text-[9px] font-mono text-red-400">2 error ditemukan</span>
      </div>
    </div>
  )
}

// ─── TernakOS dashboard mockup (right side) ───────────────────────────────────

function TernakOSMockup() {
  const miniChart = [
    { h: 30 }, { h: 42 }, { h: 38 }, { h: 55 }, { h: 48 },
    { h: 62 }, { h: 58 }, { h: 70 }, { h: 65 }, { h: 78 },
  ]
  const maxH = Math.max(...miniChart.map(d => d.h))

  return (
    <div className="p-4 h-full flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <span className="text-[10px]">🐔</span>
        </div>
        <span className="text-[11px] font-bold text-[#F1F5F9]">TernakOS</span>
        <span className="ml-auto text-[9px] text-[#10B981] bg-emerald-500/10 px-1.5 py-0.5 rounded-full">● Live</span>
      </div>

      {/* KPI cards row */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'FCR Saat Ini', value: '1.62', sub: '↓ dari 1.82', color: '#10B981', good: true },
          { label: 'IP Score', value: '342', sub: '↑ 18 poin', color: '#10B981', good: true },
          { label: 'Deplesi', value: '1.2%', sub: 'dalam batas', color: '#34D399', good: true },
          { label: 'Hari ke-', value: '18', sub: 'Kandang A', color: '#94A3B8', good: null },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-[#111C24] rounded-xl p-2.5 border border-white/8"
          >
            <p className="text-[9px] text-[#4B6478] mb-0.5 truncate">{kpi.label}</p>
            <p className="font-display font-black text-[15px] leading-tight" style={{ color: kpi.color }}>
              {kpi.value}
            </p>
            <p className={`text-[9px] mt-0.5 ${kpi.good ? 'text-emerald-400' : 'text-[#4B6478]'}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Mini chart */}
      <div className="bg-[#111C24] rounded-xl p-3 border border-white/8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-[#4B6478] font-semibold">Bobot Rata-rata (kg)</span>
          <span className="text-[9px] text-emerald-400 font-bold">+0.11/hari</span>
        </div>
        <div className="flex items-end gap-1 h-10">
          {miniChart.map((d, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${(d.h / maxH) * 100}%`,
                background: i === miniChart.length - 1
                  ? '#10B981'
                  : `rgba(16,185,129,${0.15 + (i / miniChart.length) * 0.35})`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Active cycles */}
      <div className="flex-1">
        <p className="text-[9px] text-[#4B6478] font-semibold mb-1.5 uppercase tracking-wider">Siklus Aktif</p>
        <div className="space-y-1.5">
          {[
            { name: 'Kandang A', day: 18, fcr: '1.62', status: 'green' },
            { name: 'Kandang B', day: 11, fcr: '1.74', status: 'yellow' },
            { name: 'Kandang C', day:  5, fcr: '—',    status: 'blue'   },
          ].map((cycle) => (
            <div key={cycle.name} className="flex items-center gap-2 bg-[#111C24] rounded-lg px-2.5 py-1.5 border border-white/5">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                cycle.status === 'green'  ? 'bg-emerald-400' :
                cycle.status === 'yellow' ? 'bg-amber-400'   : 'bg-blue-400'
              }`} />
              <span className="text-[10px] text-[#F1F5F9] font-medium flex-1 truncate">{cycle.name}</span>
              <span className="text-[9px] text-[#4B6478]">Hari {cycle.day}</span>
              {cycle.fcr !== '—' && (
                <span className="text-[9px] text-emerald-400 font-bold">FCR {cycle.fcr}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Comparison section ───────────────────────────────────────────────────────

export default function Comparison() {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)

  const handleDrag = useCallback((clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pos  = ((clientX - rect.left) / rect.width) * 100
    setSliderPosition(Math.min(Math.max(pos, 2), 98))
  }, [])

  const onMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onTouchStart = () => setIsDragging(true)

  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (e) => handleDrag(e.clientX)
    const onTouchMove = (e) => handleDrag(e.touches[0].clientX)
    const onUp        = () => setIsDragging(false)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [isDragging, handleDrag])

  return (
    <section className="py-24 px-4 bg-[#06090F] w-full">
      {/* Header */}
      <AnimatedContent distance={24}>
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <p className="text-[#10B981] text-xs font-bold uppercase tracking-widest mb-3">
            PERBANDINGAN NYATA
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-black text-white leading-tight mb-3">
            Dari Excel berantakan ke dashboard real-time.
          </h2>
          <p className="text-[#94A3B8]">Geser untuk melihat perbedaannya.</p>
        </div>
      </AnimatedContent>

      {/* Comparison container */}
      <AnimatedContent distance={30}>
        <div className="max-w-5xl mx-auto">
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-2xl border border-white/10 select-none"
            style={{ height: '360px', cursor: isDragging ? 'ew-resize' : 'col-resize' }}
            onMouseDown={(e) => {
              // Allow drag from anywhere in the container
              handleDrag(e.clientX)
              setIsDragging(true)
            }}
            onTouchStart={(e) => {
              handleDrag(e.touches[0].clientX)
              setIsDragging(true)
            }}
          >
            {/* RIGHT side — TernakOS (full width, underneath) */}
            <div className="absolute inset-0 bg-[#06090F]">
              {/* SESUDAH badge */}
              <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">SESUDAH</span>
              </div>
              <TernakOSMockup />
            </div>

            {/* LEFT side — Excel (clipped to sliderPosition) */}
            <div
              className="absolute inset-0 bg-[#1a1a1a] overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              {/* SEBELUM badge */}
              <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">SEBELUM</span>
              </div>
              {/* Watermark */}
              <div className="absolute bottom-3 right-3 opacity-30">
                <span className="text-[10px] font-mono text-gray-500">Google Sheets — Manual</span>
              </div>
              {/* Fixed-width inner so content doesn't compress */}
              <div style={{ width: containerRef.current?.getBoundingClientRect().width || 800, height: '100%' }}>
                <ExcelMockup />
              </div>
            </div>

            {/* Divider line */}
            <div
              className="absolute top-0 bottom-0 w-px bg-white/30 pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            />

            {/* Slider handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-auto"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e) }}
              onTouchStart={(e) => { e.stopPropagation(); onTouchStart() }}
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-center cursor-ew-resize">
                <ChevronsLeftRight size={16} className="text-gray-500" />
              </div>
            </div>
          </div>

          {/* Hint */}
          <div className="flex items-center justify-center gap-2 mt-4 text-[#4B6478] text-sm">
            <span className="animate-bounce inline-block">←</span>
            <span>Geser untuk membandingkan</span>
            <span className="animate-bounce inline-block">→</span>
          </div>
        </div>
      </AnimatedContent>
    </section>
  )
}
