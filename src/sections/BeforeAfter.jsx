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
      { value: '98%+',         label: 'ukurasi piutang' },
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

// ─── Column component ──────────────────────────────────────────────────────────

function Column({ items, variant }) {
  const isBefore = variant === 'before'
  return (
    <div
      className={`flex-1 rounded-2xl border p-6 flex flex-col gap-4 shadow-sm transition-all duration-300 ${
        isBefore 
          ? 'bg-bg-2 border-border-default' 
          : 'bg-bg-1 border-emerald-500/30 shadow-[0_12px_40px_rgba(2, 26, 2,0.03)] dark:shadow-[0_12px_40px_rgba(2, 26, 2,0.06)]'
      }`}
    >
      {/* Column heading tag */}
      <div className="flex">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold tracking-wider uppercase border ${
            isBefore 
              ? 'bg-red-500/5 border-red-500/20 text-red-500' 
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {isBefore ? '✗  Sebelum TernakOS' : '✓  Setelah TernakOS'}
        </span>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3">
        {items.map((text, i) => (
          <div key={i} className="flex items-start gap-2.5">
            {isBefore
              ? <XCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
              : <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-500" />
            }
            <span className={`text-[13px] md:text-sm leading-relaxed ${isBefore ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Stats bar ─────────────────────────────────────────────────────────────────

function StatsRow({ stats }) {
  return (
    <div className="mt-6 grid grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border-default bg-bg-1 px-4 py-4 text-center shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="font-['Sora'] text-base md:text-lg font-black text-text-primary leading-none mb-1.5">{s.value}</p>
          <p className="text-[11px] text-text-secondary font-medium uppercase tracking-wider">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function BeforeAfter({ activeRole = 'broker' }) {
  const data = CONTENT[activeRole] ?? CONTENT.broker

  return (
    <section className="bg-bg-base py-20 px-5 border-t border-border-subtle">

      {/* Section header */}
      <div className="text-center mb-12">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#021a02] dark:text-emerald-400 mb-3">
          TRANSFORMASI OPERASIONAL
        </p>
        <h2 className="font-['Sora'] text-2xl md:text-3xl font-normal text-text-primary leading-tight">
          Dari Excel Berantakan Menjadi Dasbor Otomatis
        </h2>
      </div>

      {/* Animated content */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            {/* 2-column cards */}
            <div className="flex flex-col md:flex-row gap-6">
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
