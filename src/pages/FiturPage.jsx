import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftRight, Home, Truck, Users, BarChart2, Package,
  ShoppingCart, UserCheck, FileText, RefreshCw, ClipboardList,
  TrendingUp, ShoppingBag, CreditCard, Building,
  Check, ArrowRight, Globe, TrendingUp as TrendingUpIcon,
  Shield, Lock,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// ─── Animation helper ─────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Feature list item ────────────────────────────────────────────────────────

function FeatureItem({ text }) {
  return (
    <li className="flex items-start gap-2">
      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
      <span className="text-sm text-[#94A3B8] leading-snug">{text}</span>
    </li>
  )
}

// ─── Feature Group Card ───────────────────────────────────────────────────────

function GroupCard({ Icon, title, desc, features, delay = 0 }) {
  return (
    <FadeUp delay={delay}>
      <div className="bg-[#111C24] rounded-2xl p-6 border border-white/8 hover:border-emerald-500/30 transition-all duration-300 h-full flex flex-col">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 shrink-0">
          <Icon size={20} className="text-emerald-400" />
        </div>
        <h3 className="font-['Sora'] font-bold text-white text-base mb-2 leading-snug">{title}</h3>
        {desc && <p className="text-xs text-[#4B6478] mb-4 leading-relaxed">{desc}</p>}
        <ul className="space-y-2 mt-auto">
          {features.map((f, i) => <FeatureItem key={i} text={f} />)}
        </ul>
      </div>
    </FadeUp>
  )
}

// ─── Tab data ─────────────────────────────────────────────────────────────────

const ROLES = [
  { id: 'broker',   label: 'Broker',   emoji: '🐔' },
  { id: 'peternak', label: 'Peternak', emoji: '🏠' },
  { id: 'rpa',      label: 'RPA',      emoji: '🏭' },
]

const SUBS = {
  broker: [
    { id: 'ayam',  label: 'Broker Ayam',  disabled: false },
    { id: 'telur', label: 'Broker Telur', disabled: false },
  ],
  peternak: [
    { id: 'broiler', label: 'Ayam Broiler', disabled: false },
    { id: 'petelur', label: 'Ayam Petelur', disabled: true  },
    { id: 'sapi',    label: 'Sapi',         disabled: true  },
  ],
  rpa: [],
}

const GROUPS = {
  broker_ayam: [
    {
      Icon: ArrowLeftRight,
      title: 'Catat Beli & Jual dalam Hitungan Detik',
      desc: 'Wizard transaksi 3 langkah — dari beli kandang sampai kirim ke RPA.',
      features: [
        'Catat pembelian dari kandang (harga, bobot, ekor)',
        'Catat penjualan ke RPA/pasar/langsung',
        'Kalkulasi margin otomatis per transaksi',
        'Multi-mode: Beli dulu atau Order dulu',
        'Riwayat transaksi lengkap dengan filter',
      ],
    },
    {
      Icon: Home,
      title: 'Pantau Semua Kandang dari Satu Tempat',
      desc: null,
      features: [
        'Database kandang lengkap (stok, bobot, status)',
        'Rating kualitas kandang 1–5 bintang',
        'Filter kandang siap panen vs growing',
        'Riwayat transaksi per kandang',
        'Estimasi panen & jadwal harvest',
      ],
    },
    {
      Icon: Truck,
      title: 'Tracking Pengiriman Real-time',
      desc: null,
      features: [
        'Catat detail pengiriman (kendaraan, sopir, muatan)',
        'Timbangan digital (Business plan)',
        'Catat bobot tiba vs bobot kirim (susut)',
        'Loss report otomatis: mortalitas & susut berat',
        'Revenue diupdate otomatis dari bobot tiba',
      ],
    },
    {
      Icon: Users,
      title: 'Kelola Piutang Tanpa Dispute',
      desc: null,
      features: [
        'Database RPA/buyer lengkap',
        'Tracking piutang per RPA realtime',
        'Payment terms: Cash, NET 3/7/14/30',
        'Catat pembayaran partial',
        'Alert piutang jatuh tempo',
        'Reliability score per buyer',
      ],
    },
    {
      Icon: BarChart2,
      title: 'Laporan Keuangan Otomatis',
      desc: null,
      features: [
        'Dashboard cash flow bulanan',
        'Breakdown: modal, transport, kerugian, extra',
        'Net profit per periode',
        'Grafik trend 6 bulan',
        'Catat biaya operasional tambahan',
      ],
    },
    {
      Icon: Truck,
      title: 'Kelola Armada & Anggota Tim',
      desc: null,
      features: [
        'Database kendaraan + SIM expiry alert',
        'Database sopir + upah per trip',
        'Multi-role: Owner, Staff, View Only, Sopir',
        'Undang anggota via kode 6 digit',
        'RBAC: akses berbeda per role',
      ],
    },
  ],

  broker_telur: [
    {
      Icon: ShoppingCart,
      title: 'POS Telur yang Cepat & Akurat',
      desc: null,
      features: [
        'Input penjualan per produk/grade',
        'Kalkulasi otomatis total + HPP',
        'Invoice number otomatis',
        'Status: Lunas / Piutang / Pending',
        'Customer name untuk quick search',
      ],
    },
    {
      Icon: Package,
      title: 'Stok Realtime per Grade Telur',
      desc: null,
      features: [
        '3 grade: Hero, Standard, Salted',
        'Stok butir realtime',
        'HPP per butir + biaya packaging',
        'Harga jual per pack',
        'Alert stok menipis',
        'Log mutasi stok (masuk/keluar/adj)',
      ],
    },
    {
      Icon: UserCheck,
      title: 'CRM Supplier & Pelanggan',
      desc: null,
      features: [
        'Database supplier lengkap',
        'Database customer dengan total spend',
        'Tracking order per customer',
        'Piutang customer terpantau',
      ],
    },
    {
      Icon: FileText,
      title: 'Histori & Laporan Penjualan',
      desc: null,
      features: [
        'Riwayat semua transaksi',
        'Filter status fulfillment',
        'Net profit per invoice',
        'Top customer by revenue',
      ],
    },
  ],

  peternak: [
    {
      Icon: Home,
      title: 'Multi-Kandang, Multi-Model Bisnis',
      desc: null,
      features: [
        'Dukung Mandiri & Kemitraan (CP, Japfa, dll)',
        'Setup detail INTI perusahaan + harga kontrak',
        'Limit kandang per plan (Starter:1, Pro:2, Business:∞)',
        'Multiple livestock type (Broiler, Petelur — roadmap)',
      ],
    },
    {
      Icon: RefreshCw,
      title: 'Tracking Siklus dari Chick In sampai Panen',
      desc: null,
      features: [
        'Mulai siklus: input DOC, tanggal, target panen',
        'Catat biaya DOC otomatis (mandiri)',
        'Estimasi harvest date otomatis',
        'Status siklus: Growing, Ready, Panen, Selesai',
        'Multi-siklus paralel per kandang',
      ],
    },
    {
      Icon: ClipboardList,
      title: 'Input Harian < 2 Menit',
      desc: null,
      features: [
        'Catat mortalitas harian',
        'Catat pakan terpakai (kg)',
        'Sample berat rata-rata (gram)',
        'FCR estimasi realtime',
        'Alert jika belum input hari ini',
        'Timeline histori per siklus',
      ],
    },
    {
      Icon: TrendingUp,
      title: 'Analitik Performa Kandang',
      desc: null,
      features: [
        'FCR Final = total pakan ÷ total bobot panen',
        'IP Score otomatis per siklus',
        'Benchmark: Sangat Baik / Baik / Perlu Evaluasi',
        'Grafik bobot & pakan per hari',
        'Breakdown biaya lengkap per siklus',
        'HPP per kg terhitung otomatis',
      ],
    },
    {
      Icon: Users,
      title: 'Kelola Anak Kandang & Penggajian',
      desc: null,
      features: [
        'Database anak kandang per farm',
        'Sistem gaji: Flat + Bonus panen',
        'Bonus otomatis jika FCR < target',
        'Catat pembayaran gaji & bonus',
        'Riwayat pembayaran per worker',
      ],
    },
    {
      Icon: Package,
      title: 'Manajemen Stok Pakan',
      desc: null,
      features: [
        'Stok per jenis pakan (Starter/Grower/Finisher)',
        'Status: Aman / Cukup / Menipis',
        'Catat pembelian pakan (tambah stok)',
        'Catat pemakaian manual',
        'Alert stok < 100 kg',
        'Integrasi ke cycle_expenses',
      ],
    },
  ],

  rpa: [
    {
      Icon: ShoppingBag,
      title: 'Kelola Order dari Broker',
      desc: null,
      features: [
        'Buat order ke broker dengan spesifikasi lengkap',
        'Tracking status order',
        'Histori semua order',
        'Filter per status & periode',
      ],
    },
    {
      Icon: CreditCard,
      title: 'Tracking Hutang Transparan',
      desc: null,
      features: [
        'Total hutang ke semua broker realtime',
        'Breakdown per broker + per transaksi',
        'Catat pembayaran (cash/transfer/giro)',
        '0 dispute dengan broker karena data sama',
        'History pembayaran lengkap',
      ],
    },
    {
      Icon: BarChart2,
      title: 'Analitik Profitabilitas',
      desc: null,
      features: [
        'Margin per produk & per customer',
        'Top 10 customer by revenue',
        'Composed chart: Revenue + HPP + Profit',
        'Filter date range fleksibel',
        'Identifikasi produk paling profitable',
      ],
    },
    {
      Icon: Building,
      title: 'Profil & Preferensi Bisnis',
      desc: null,
      features: [
        'Setup tipe RPA (potong ayam, pasar, restoran, dll)',
        'Kapasitas harian',
        'Payment terms default',
        'Preferred chicken type',
      ],
    },
  ],
}

const SHARED = [
  {
    emoji: '🌐',
    title: 'TernakOS Market',
    desc: 'Marketplace B2B untuk jual stok, cari ayam, dan posting permintaan. Kontak langsung via WhatsApp.',
  },
  {
    emoji: '📈',
    title: 'Harga Pasar Realtime',
    desc: 'Data harga ayam broiler dari seluruh Indonesia, diupdate 2x sehari dari sumber terpercaya.',
  },
  {
    emoji: '🔐',
    title: 'Multi-Role & Tim',
    desc: 'Undang anggota tim dengan kode 6 digit. Role: Owner, Staff, View Only, Sopir.',
  },
  {
    emoji: '🛡️',
    title: 'Data Aman',
    desc: 'Dihosting di Supabase (PostgreSQL) dengan enkripsi end-to-end dan backup otomatis.',
  },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FiturPage() {
  const [selectedRole, setSelectedRole] = useState('broker')
  const [selectedSub, setSelectedSub]   = useState('ayam')
  const tabBarRef = useRef(null)
  const [isSticky, setIsSticky] = useState(false)

  const handleRoleChange = (role) => {
    setSelectedRole(role)
    const defaults = { broker: 'ayam', peternak: 'broiler', rpa: null }
    setSelectedSub(defaults[role])
  }

  useEffect(() => {
    const el = tabBarRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const contentKey = selectedRole === 'rpa' ? 'rpa'
    : selectedRole === 'peternak' ? 'peternak'
    : `broker_${selectedSub}`
  const groups = GROUPS[contentKey] ?? []
  const cols = groups.length <= 4 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'

  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] overflow-x-hidden">
      <Navbar />

      <main>

        {/* ── HEADER ── */}
        <section className="relative pt-32 pb-20 px-5 text-center overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-emerald-500/8 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[11px] font-bold uppercase tracking-widest text-[#10B981] mb-6"
            >
              FITUR LENGKAP
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="font-['Sora'] text-4xl md:text-6xl font-black text-white leading-tight mb-5"
            >
              Semua yang kamu butuhkan<br />untuk kelola bisnis ternak.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="text-lg text-[#94A3B8] max-w-xl mx-auto"
            >
              Dirancang khusus untuk broker, peternak, dan RPA Indonesia.
            </motion.p>
          </div>
        </section>

        {/* ── SENTINEL for sticky detection ── */}
        <div ref={tabBarRef} />

        {/* ── TAB BAR (sticky) ── */}
        <div className={`sticky top-0 z-30 transition-all duration-200 ${isSticky ? 'bg-[#06090F]/95 backdrop-blur-md border-b border-white/8 shadow-lg' : 'bg-[#06090F]'}`}>
          <div className="max-w-5xl mx-auto px-4 pt-3 pb-2 flex flex-col items-center gap-2">

            {/* Level 1 — Role */}
            <div className="inline-flex bg-[#111C24] border border-white/8 rounded-full p-1 gap-1 relative">
              {ROLES.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleChange(role.id)}
                  className={`relative z-10 px-5 md:px-7 py-2 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer border-none ${
                    selectedRole === role.id
                      ? 'text-emerald-400'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {selectedRole === role.id && (
                    <motion.span
                      layoutId="tab-bg"
                      className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/40"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <span className="relative">{role.emoji} {role.label}</span>
                </button>
              ))}
            </div>

            {/* Level 2 — Sub-tabs */}
            {(SUBS[selectedRole]?.length ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                {SUBS[selectedRole].map(sub => (
                  <button
                    key={sub.id}
                    type="button"
                    disabled={sub.disabled}
                    onClick={() => !sub.disabled && setSelectedSub(sub.id)}
                    className={`flex items-center gap-1 px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-colors duration-150 ${
                      sub.disabled
                        ? 'opacity-40 cursor-not-allowed border-white/8 text-white/40'
                        : selectedSub === sub.id
                          ? 'border-white/20 bg-white/[0.08] text-white cursor-pointer'
                          : 'border-transparent text-white/50 hover:text-white/70 cursor-pointer'
                    }`}
                  >
                    {sub.label}
                    {sub.disabled && (
                      <span className="text-[9px] font-bold text-amber-400/80 uppercase ml-0.5">Segera</span>
                    )}
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ── FEATURE GROUPS ── */}
        <section className="py-16 px-5">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className={`grid grid-cols-1 ${cols} gap-5`}
              >
                {groups.map((g, i) => (
                  <GroupCard
                    key={`${contentKey}-${i}`}
                    Icon={g.Icon}
                    title={g.title}
                    desc={g.desc}
                    features={g.features}
                    delay={i * 0.05}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ── SHARED FEATURES ── */}
        <section className="py-20 px-5 bg-[#080D13]">
          <div className="max-w-5xl mx-auto">

            <FadeUp className="text-center mb-12">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#10B981] mb-4">
                SEMUA ROLE
              </p>
              <h2 className="font-['Sora'] text-3xl font-bold text-white">
                Tersedia untuk Semua Role
              </h2>
            </FadeUp>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SHARED.map((s, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div className="bg-[#111C24] rounded-2xl p-6 border border-white/8 hover:border-emerald-500/20 transition-all duration-300 h-full">
                    <span className="text-2xl mb-4 block">{s.emoji}</span>
                    <h3 className="font-['Sora'] font-bold text-white text-sm mb-2">{s.title}</h3>
                    <p className="text-xs text-[#4B6478] leading-relaxed">{s.desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 px-5">
          <div className="max-w-3xl mx-auto">
            <FadeUp>
              <div className="relative rounded-3xl p-12 md:p-16 text-center border border-emerald-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none rounded-3xl" />
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <h2 className="font-['Sora'] text-3xl md:text-4xl font-bold text-white mb-4">
                    Siap coba semua fitur ini?
                  </h2>
                  <p className="text-[#94A3B8] text-lg mb-10">
                    14 hari gratis, tanpa kartu kredit.
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.45)]"
                  >
                    Mulai Trial Gratis
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
