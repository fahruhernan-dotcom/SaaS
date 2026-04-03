import AnimatedContent from '../components/reactbits/AnimatedContent'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Pak Budi Santoso',
    role: 'Broker Ayam, Boyolali',
    avatar: 'BS',
    text: 'Piutang macet saya berkurang 40% dalam 2 bulan karena sistem tagging otomatis. Dulu sering lupa tagih, sekarang cashflow jauh lebih sehat.',
    rating: 5,
  },
  {
    name: 'Bu Sari Dewi',
    role: 'Peternak Broiler, Blitar',
    avatar: 'SD',
    text: 'FCR turun dari 1.82 ke 1.67 setelah rutin pantau lewat dashboard harian. Saya bisa deteksi anomali pakan lebih awal.',
    rating: 5,
  },
  {
    name: 'Mas Hendra',
    role: 'Broker Telur, Kendal',
    avatar: 'H',
    text: 'Dulu saya rekap stok telur 2 jam setiap sore. Sekarang cuma butuh 5 menit karena semua transaksi POS langsung potong stok otomatis.',
    rating: 5,
  },
  {
    name: 'Pak Joko Widodo',
    role: 'Peternak Broiler, Demak',
    avatar: 'JW',
    text: 'Laporan panen akurat 100%. Tidak ada lagi selisih timbangan yang menguap di jalan. Sangat membantu transparansi.',
    rating: 5,
  },
  {
    name: 'Bu Rani Kusuma',
    role: 'Broker Ayam, Semarang',
    avatar: 'RK',
    text: 'Simulator margin-nya bantu saya negosiasi harga di kandang. Margin bisnis jadi stabil di angka 15% setiap transaksi.',
    rating: 5,
  },
  {
    name: 'Mas Doni',
    role: 'RPA, Solo',
    avatar: 'D',
    text: 'Tracking hutang ke broker jadi transparan. Record-nya rapi, tidak ada lagi perdebatan soal selisih bayar di akhir bulan.',
    rating: 5,
  },
  {
    name: 'Pak Agus Prasetyo',
    role: 'Peternak Layer, Klaten',
    avatar: 'AP',
    text: 'Monitoring HDP harian jadi sangat mudah. Penurunan produktivitas langsung ketahuan di hari yang sama.',
    rating: 5,
  },
  {
    name: 'Bu Indah',
    role: 'Broker Ayam, Magelang',
    avatar: 'I',
    text: 'Loss report per pengiriman sangat detail. Saya bisa tahu persis armada mana yang susut-nya di luar batas wajar.',
    rating: 5,
  },
  {
    name: 'Mas Rizal',
    role: 'Broker Telur, Pati',
    avatar: 'R',
    text: 'Efisiensi operasional naik drastis. Tim admin saya sekarang bisa handle double transaksi dengan waktu kerja yang sama.',
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
    <div className="bg-[#0C1319] border border-white/5 rounded-2xl p-3 md:p-6 mb-2 md:mb-4 group hover:border-emerald-500/20 transition-all duration-500">
      <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-6">
        <div 
          className="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-emerald-500/20 grayscale group-hover:grayscale-0 transition-all duration-700 flex items-center justify-center font-display font-black text-white/20 text-xs md:text-base bg-emerald-500/10"
        >
          {t.avatar}
        </div>
        <div>
          <h4 className="font-display font-black text-white text-[11px] md:text-base uppercase tracking-tight">{t.name}</h4>
          <p className="text-emerald-500 font-bold text-[9px] md:text-xs uppercase tracking-widest">{t.role}</p>
        </div>
      </div>
      <p className="text-[#94A3B8] text-[11px] md:text-sm font-medium leading-relaxed italic">
        "{t.text}"
      </p>
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

        {/* 2 or 3 columns */}
        <div className="flex gap-2 md:gap-4">
          {/* Column 1 — normal speed */}
          <ScrollColumn items={COL1} duration={20} />

          {/* Column 2 — faster (Visible on mobile now) */}
          <div className="flex flex-1 overflow-hidden">
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
