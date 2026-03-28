import { motion, AnimatePresence } from 'framer-motion'
import { XCircle, CheckCircle2 } from 'lucide-react'

// ─── Content data ─────────────────────────────────────────────────────────────

const CONTENT = {
  broker: {
    before: [
      'Catat piutang di buku, sering lupa atau salah',
      'Tidak tahu margin per kandang secara real-time',
      'Rekap bulanan butuh 3–4 jam manual',
      'Susut & mortalitas tidak terpantau otomatis',
    ],
    after: [
      'Piutang RPA tercatat otomatis + alert jatuh tempo',
      'Margin per transaksi langsung kelihatan',
      'Laporan cashflow otomatis dalam hitungan detik',
      'Loss report & susut berat terhitung otomatis',
    ],
    stats: [
      { value: '3 jam/minggu', label: 'dihemat' },
      { value: '98%+',         label: 'akurasi piutang' },
      { value: '0',            label: 'transaksi terlewat' },
    ],
  },
  peternak: {
    before: [
      'FCR dihitung manual pakai kalkulator',
      'Tidak tahu kapan waktu panen optimal',
      'Mortalitas harian dicatat di kertas',
      'Biaya pakan tidak terpantau per siklus',
    ],
    after: [
      'FCR & IP Score terhitung otomatis tiap input harian',
      'Estimasi panen berdasarkan data pertumbuhan nyata',
      'Dashboard mortalitas realtime per kandang',
      'Breakdown biaya lengkap per siklus',
    ],
    stats: [
      { value: 'Akurat',   label: 'FCR per siklus' },
      { value: '< 2 mnt',  label: 'input harian' },
      { value: 'Otomatis', label: 'laporan panen' },
    ],
  },
  rpa: {
    before: [
      'Hutang ke broker dicatat manual, sering dispute',
      'Tidak ada laporan margin per produk',
      'Order ke broker via WA, sering miskomunikasi',
      'Tidak tahu produk mana yang paling profitable',
    ],
    after: [
      'Hutang & pembayaran tercatat transparan kedua pihak',
      'Laporan margin per produk & per customer otomatis',
      'Order terdokumentasi + history lengkap',
      'Dashboard profitabilitas per SKU realtime',
    ],
    stats: [
      { value: '0',            label: 'dispute hutang' },
      { value: 'Per transaksi', label: 'margin terlihat' },
      { value: 'Teridentifikasi', label: 'top produk' },
    ],
  },
}

// ─── Column component ──────────────────────────────────────────────────────────

function Column({ items, variant }) {
  const isBefore = variant === 'before'
  return (
    <div
      className="flex-1 rounded-2xl border p-5 flex flex-col gap-3"
      style={{
        background: isBefore ? 'rgba(239,68,68,0.04)' : 'rgba(16,185,129,0.05)',
        borderColor: isBefore ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.2)',
      }}
    >
      {/* Column heading */}
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-1"
        style={{ color: isBefore ? '#F87171' : '#34D399' }}
      >
        {isBefore ? '✗  Sebelum TernakOS' : '✓  Dengan TernakOS'}
      </p>

      {/* Items */}
      {items.map((text, i) => (
        <div key={i} className="flex items-start gap-2.5">
          {isBefore
            ? <XCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
            : <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-400" />
          }
          <span className="text-sm leading-snug" style={{ color: isBefore ? '#94A3B8' : '#CBD5E1' }}>
            {text}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Stats bar ─────────────────────────────────────────────────────────────────

function StatsRow({ stats }) {
  return (
    <div className="mt-5 grid grid-cols-3 gap-3">
      {stats.map((s, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.07] bg-[#111C24] px-4 py-3 text-center"
        >
          <p className="font-['Sora'] text-lg font-extrabold text-white leading-none mb-1">{s.value}</p>
          <p className="text-[11px] text-[#4B6478]">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function BeforeAfter({ activeRole = 'broker' }) {
  const data = CONTENT[activeRole] ?? CONTENT.broker

  return (
    <section className="bg-[#06090F] py-24 px-4">

      {/* Section header */}
      <div className="text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#10B981] mb-4">
          TRANSFORMASI NYATA
        </p>
        <h2 className="font-['Sora'] text-4xl md:text-5xl font-bold text-white leading-tight">
          Dari Excel berantakan<br />menjadi insight yang actionable.
        </h2>
      </div>

      {/* Animated content */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            {/* 2-column cards */}
            <div className="flex flex-col md:flex-row gap-4">
              <Column items={data.before} variant="before" />
              <Column items={data.after}  variant="after"  />
            </div>

            {/* Stats bar */}
            <StatsRow stats={data.stats} />
          </motion.div>
        </AnimatePresence>
      </div>

    </section>
  )
}
