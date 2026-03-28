import AnimatedContent from '../components/reactbits/AnimatedContent'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Pak Budi Santoso',
    role: 'Broker Ayam, Boyolali',
    avatar: 'BS',
    text: 'Sebelumnya saya catat piutang di buku, sering lupa. Sekarang semua tercatat otomatis dan saya bisa tahu siapa yang belum bayar.',
    rating: 5,
  },
  {
    name: 'Bu Sari Dewi',
    role: 'Peternak Broiler, Blitar',
    avatar: 'SD',
    text: 'FCR saya turun dari 1.82 ke 1.67 setelah rutin pantau lewat TernakOS. Dashboard inputnya mudah dipakai setiap hari.',
    rating: 5,
  },
  {
    name: 'Mas Hendra',
    role: 'Broker Telur, Kendal',
    avatar: 'H',
    text: 'POS telurnya bagus banget. Stok langsung update otomatis tiap ada transaksi. Tidak perlu hitung manual lagi sama sekali.',
    rating: 5,
  },
  {
    name: 'Pak Joko Widodo',
    role: 'Peternak Broiler, Demak',
    avatar: 'JW',
    text: 'Laporan panen bisa langsung dibuat. Dulu butuh 2 jam ngitung manual, sekarang 5 menit sudah selesai dan akurat.',
    rating: 5,
  },
  {
    name: 'Bu Rani Kusuma',
    role: 'Broker Ayam, Semarang',
    avatar: 'RK',
    text: 'Fitur pengiriman dan loss report sangat membantu. Saya bisa tahu berapa susut per pengiriman dan langsung evaluasi.',
    rating: 5,
  },
  {
    name: 'Mas Doni',
    role: 'RPA, Solo',
    avatar: 'D',
    text: 'Tracking hutang ke broker jadi lebih mudah. Tidak ada lagi salah hitung atau tagihan yang kelewat di akhir bulan.',
    rating: 5,
  },
  {
    name: 'Pak Agus Prasetyo',
    role: 'Peternak Layer, Klaten',
    avatar: 'AP',
    text: 'Produksi telur saya jadi lebih terdata dengan baik. Bisa tahu berapa HDP per minggu tanpa harus ngitung sendiri.',
    rating: 5,
  },
  {
    name: 'Bu Indah',
    role: 'Broker Ayam, Magelang',
    avatar: 'I',
    text: 'Simulator margin-nya sangat berguna sebelum negosiasi harga. Saya bisa hitung untung-rugi di tempat.',
    rating: 5,
  },
  {
    name: 'Mas Rizal',
    role: 'Broker Telur, Pati',
    avatar: 'R',
    text: 'Fitur armada dan sopir membantu banget. Tim saya bisa langsung update status pengiriman dari HP masing-masing.',
    rating: 5,
  },
]

// ─── Star rating ──────────────────────────────────────────────────────────────

function Stars({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-amber-400 text-sm">★</span>
      ))}
    </div>
  )
}

// ─── Single testimonial card ──────────────────────────────────────────────────

function TestimonialCard({ t }) {
  return (
    <div className="bg-[#111C24] rounded-2xl p-5 mb-4 border border-white/8 hover:border-emerald-500/30 transition-colors duration-300 break-inside-avoid">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center font-display font-black text-[12px] text-emerald-400 shrink-0 uppercase">
          {t.avatar}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-[#F1F5F9] truncate leading-tight">{t.name}</p>
          <p className="text-[11px] text-[#4B6478] truncate">{t.role}</p>
        </div>
      </div>
      <Stars count={t.rating} />
      <p className="mt-2.5 text-sm text-[#94A3B8] leading-relaxed italic">"{t.text}"</p>
    </div>
  )
}

// ─── Scrolling column ─────────────────────────────────────────────────────────

function ScrollColumn({ items, duration }) {
  // Double items for seamless loop
  const doubled = [...items, ...items]

  return (
    <div className="overflow-hidden flex-1">
      <div
        className="flex flex-col"
        style={{
          animation: `scrollUp ${duration}s linear infinite`,
        }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={i} t={t} />
        ))}
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

// Split testimonials into 3 groups
const COL1 = TESTIMONIALS.slice(0, 3)
const COL2 = TESTIMONIALS.slice(3, 6)
const COL3 = TESTIMONIALS.slice(6, 9)

export default function TestimonialsNew() {
  return (
    <section className="py-24 bg-[#06090F] w-full overflow-hidden">
      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes scrollUp {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>

      {/* Header */}
      <AnimatedContent distance={20}>
        <div className="text-center mb-12 px-4">
          <p className="text-[#10B981] text-xs font-bold uppercase tracking-widest mb-3">
            DARI PELAKU INDUSTRI
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-black text-white leading-tight">
            Mereka sudah merasakan perbedaannya.
          </h2>
        </div>
      </AnimatedContent>

      {/* Scrolling columns with fade mask */}
      <div
        className="relative max-w-6xl mx-auto px-4"
        style={{ maxHeight: '600px', overflow: 'hidden' }}
      >
        {/* Top fade */}
        <div
          className="absolute top-0 left-0 right-0 h-20 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, #06090F, transparent)' }}
        />
        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, #06090F, transparent)' }}
        />

        {/* 3 columns */}
        <div className="flex gap-4">
          {/* Column 1 — normal speed */}
          <ScrollColumn items={COL1} duration={20} />

          {/* Column 2 — faster (hidden on mobile) */}
          <div className="hidden md:flex flex-1 overflow-hidden">
            <ScrollColumn items={COL2} duration={14} />
          </div>

          {/* Column 3 — slower (hidden on mobile) */}
          <div className="hidden lg:flex flex-1 overflow-hidden">
            <ScrollColumn items={COL3} duration={26} />
          </div>
        </div>
      </div>
    </section>
  )
}
