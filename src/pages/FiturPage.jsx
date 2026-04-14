import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftRight, Home, Truck, Users, BarChart2, Package,
  ShoppingCart, UserCheck, FileText, RefreshCw, ClipboardList,
  TrendingUp, ShoppingBag, CreditCard, Building,
  Check, ArrowRight, Globe, TrendingUp as TrendingUpIcon,
  Shield, Lock, Bot, Zap, Network,
  ChevronDown, X, MessageCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import Particles from '../components/reactbits/Particles'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'


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

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
}

function FeatureItem({ text }) {
  return (
    <motion.li variants={itemVariants} className="flex items-start gap-2">
      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
      <span className="text-sm text-[#94A3B8] leading-snug">{text}</span>
    </motion.li>
  )
}

// ─── Feature Group Card ───────────────────────────────────────────────────────

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 }
  }
}

function GroupCard({ Icon, title, desc, features, delay = 0 }) {
  return (
    <FadeUp delay={delay} className="h-full">
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        className="group relative bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] rounded-2xl p-7 border border-white/8 hover:border-emerald-500/40 hover:shadow-[0_20px_45px_rgba(16,185,129,0.12)] transition-all duration-300 h-full flex flex-col overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all duration-500" />

        <div className="relative z-10 w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 shrink-0 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300">
          <Icon size={24} className="text-emerald-400" />
        </div>
        <h3 className="relative z-10 font-['Sora'] font-bold text-white text-lg mb-2 leading-snug tracking-tight">{title}</h3>
        {desc && <p className="relative z-10 text-xs text-[#4B6478] mb-6 leading-relaxed font-medium">{desc}</p>}

        <motion.ul
          className="relative z-10 space-y-3 mt-auto"
          variants={listVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-20px' }}
        >
          {features.map((f, i) => (
            <motion.li key={i} variants={itemVariants} className="flex items-start gap-3">
              <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-[13px] text-[#94A3B8] leading-snug font-medium">{f}</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </FadeUp>
  )
}

// ─── Tab data ─────────────────────────────────────────────────────────────────

const ROLES = [
  { id: 'broker', label: 'Broker', emoji: '🐔' },
  { id: 'peternak', label: 'Peternak', emoji: '🏠' },
  { id: 'rpa', label: 'RPA', emoji: '🏭' },
]

const SUBS = {
  broker: [
    { id: 'ayam', label: 'Broker Ayam', disabled: false },
    { id: 'telur', label: 'Broker Telur', disabled: false },
    { id: 'sembako', label: 'Distributor Sembako', disabled: false },
  ],
  peternak: [
    { id: 'broiler', label: 'Ayam Broiler', disabled: false },
    { id: 'petelur', label: 'Ayam Petelur', disabled: true },
    { id: 'sapi', label: 'Sapi', disabled: true },
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

  broker_sembako: [
    {
      Icon: ShoppingCart,
      title: 'POS Grosir & Eceran Dinamis',
      desc: null,
      features: [
        'Support multi-satuan (Sak, Ball, Karton, Pcs)',
        'Invoice instan ke kasir & print struck',
        'Dual-Pricing otomatis (Harga Retail vs Partai)',
        'Sistem Payment Cash / Tempo (Piutang)',
        'Diskon dinamis (Tiered Pricing)'
      ],
    },
    {
      Icon: Package,
      title: 'Manajamen Multi-Gudang & Inventori',
      desc: null,
      features: [
        'Tracking stok real-time antar cabang',
        'Mutasi/transfer stok antar gudang tanpa error',
        'Modul Stok Opname / SO harian terintegrasi',
        'Alert "Minimum Stock" ke HP pengelola',
        'Kalkulasi Harga Pokok Penjualan (HPP FIFO/Average)'
      ],
    },
    {
      Icon: Users,
      title: 'Kas & Hutang Piutang Lintas Toko',
      desc: null,
      features: [
        'Monitor batas limit kredit toko mitra',
        'Rekap pencairan Nota Piutang / Bon',
        'Split-payment system untuk Sales Canvaser',
        'Monitoring komisi per divisi Sales',
        'Bukti pelunasan digital tanpa kertas'
      ],
    },
    {
      Icon: Network,
      title: 'Sentralisasi Jaringan Distribusi',
      desc: null,
      features: [
        'Konsolidasi laporan performa seluruh agen cabang',
        'Sinkronisasi master data barang di semua P.O.S',
        'Analitik Pareto — Produk mana yang paling laris?',
        'Export Laporan Pemasukan Harian'
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
    emoji: '🤖',
    title: 'TernakBot AI Assistant',
    desc: 'Asisten AI cerdas untuk analisis data. Tanya "Siapa pembeli nunggak?" atau "Gimana sales bulan ini?" dan sistem merangkum otomatis.',
  },
  {
    emoji: '📈',
    title: 'Dashboard Analisis Real-time',
    desc: 'Lacak matrik penting bisnis melalui grafik dan rangkuman cash flow komprehensif, disajikan instan.',
  },
  {
    emoji: '🔐',
    title: 'Role-Based Access (Multi-Role Tim)',
    desc: 'Undang karyawan (Supir/Staff/Admin) via kode 6-digit dengan fungsi & batasan menu spesifik.',
  },
  {
    emoji: '🛡️',
    title: 'Keamanan Data Bank-Grade',
    desc: 'Hosting berbasis Cloud PostgreSQL 100% aman disinkronkan real-time, zero data-loss!',
  },
]

// ── [SECTION BARU] Hero Data per contentKey ──
const HERO_CONTENT = {
  broker_ayam: {
    eyebrow: 'Solusi Broker Ayam',
    headline: 'Kelola Ratusan Ton Ayam Tanpa Pusing Selisih Timbangan.',
    sub: 'Dari catat pembelian kandang sampai kirim nota ke WhatsApp pembeli — semua dalam 3 langkah.',
    cta: 'Mulai Kelola Transaksi Broker',
  },
  broker_telur: {
    eyebrow: 'Solusi Broker Telur',
    headline: 'Pantau Harga Telur Harian dan Margin Per Transaksi Secara Real-time.',
    sub: 'Tidak ada lagi selisih hitungan. Semua tercatat otomatis dari kandang sampai pembeli.',
    cta: 'Coba Manajemen Broker Telur',
  },
  broker_sembako: {
    eyebrow: 'Solusi Agen Sembako',
    headline: 'Stok Bocor? Pantau Keluar Masuk Barang Secara Akurat dengan Sistem FIFO.',
    sub: 'Kelola ribuan item sembako — beras, minyak, telur — dalam satu invoice tanpa salah hitung.',
    cta: 'Coba Manajemen Stok Sembako',
  },
  peternak: {
    eyebrow: 'Solusi Peternak Mandiri',
    headline: 'Cetak Indeks Performa (IP) Tertinggi dengan Manajemen Kandang Berbasis Data.',
    sub: 'Catat FCR, mortality, dan pemakaian obat harian. Bandingkan performa antar siklus kandang.',
    cta: 'Mulai Kelola Kandang Saya',
  },
  rpa: {
    eyebrow: 'Solusi Rumah Potong Ayam',
    headline: 'Kelola Pembelian Ayam Hidup dan Pengiriman ke Pembeli Tanpa Dokumen Manual.',
    sub: 'Timbang, potong, kirim — semua tercatat digital dengan laporan harian otomatis.',
    cta: 'Kelola Operasional RPA',
  },
}

// ── [SECTION BARU] Before/After Data ──
const BEFORE_AFTER = {
  broker_ayam: [
    { before: 'Catat timbangan di buku, sering hilang atau salah', after: 'Input digital, tersimpan otomatis di cloud' },
    { before: 'Hitung margin manual pakai kalkulator', after: 'Margin terhitung otomatis per transaksi' },
    { before: 'Kirim nota lewat foto buku ke WhatsApp', after: 'Nota digital dikirim otomatis ke WhatsApp pembeli' },
    { before: 'Tidak tahu siapa yang belum bayar tempo', after: 'Dashboard piutang real-time dengan alert jatuh tempo' },
  ],
  broker_telur: [
    { before: 'Harga telur dicatat manual tiap hari', after: 'Pantau harga pasar real-time dari dashboard' },
    { before: 'Margin per transaksi dihitung kalkulator', after: 'Margin otomatis terhitung saat input transaksi' },
    { before: 'Piutang diingat-ingat sendiri', after: 'Tracking piutang otomatis dengan reminder' },
    { before: 'Nota dikirim foto buku ke WhatsApp', after: 'Nota digital profesional langsung ke pembeli' },
  ],
  broker_sembako: [
    { before: 'Stok dicatat manual, sering selisih', after: 'FIFO otomatis, stok selalu akurat' },
    { before: 'Tidak tahu barang mana yang mau expired', after: 'Sistem batch tracking mencegah stok mengendap' },
    { before: 'Hitung untung rugi di akhir bulan saja', after: 'Laporan profit bersih tersedia kapan saja' },
    { before: 'Input faktur satu per satu tiap item', after: 'Multi-item entry dalam satu invoice' },
  ],
  peternak: [
    { before: 'Catat kematian ayam di kertas, mudah hilang', after: 'Recording harian digital, tersimpan per siklus' },
    { before: 'Hitung FCR manual, sering tidak akurat', after: 'Kalkulator FCR otomatis dari data pakan & bobot' },
    { before: 'Tidak bisa bandingkan performa antar siklus', after: 'Analisis siklus otomatis dengan grafik tren' },
    { before: 'Tidak tahu profit sebelum panen selesai', after: 'Estimasi keuntungan tersedia real-time' },
  ],
  rpa: [
    { before: 'Dokumen timbang manual, rawan dispute', after: 'Timbangan digital tercatat otomatis' },
    { before: 'Susut bobot tidak terpantau', after: 'Loss report otomatis setiap pengiriman' },
    { before: 'Laporan harian dibuat manual', after: 'Dashboard operasional harian otomatis' },
    { before: 'Koordinasi sopir lewat telepon', after: 'Manajemen armada & jadwal dari dashboard' },
  ],
}

// ── [SECTION BARU] FAQ Data ──
const FAQ_COMMON = [
  {
    q: 'Apakah TernakOS gratis?',
    a: 'TernakOS menyediakan trial gratis 14 hari tanpa kartu kredit. Setelah trial, tersedia paket Starter, Pro, dan Business dengan harga yang terjangkau sesuai skala bisnis kamu.',
  },
  {
    q: 'Berapa lama setup awal TernakOS?',
    a: 'Rata-rata kurang dari 15 menit. Daftar, pilih tipe bisnis, undang anggota tim — langsung bisa pakai. Tidak perlu instalasi software apapun.',
  },
  {
    q: 'Apakah bisa dipakai di HP Android biasa?',
    a: 'Ya. TernakOS adalah aplikasi berbasis web yang dioptimasi untuk mobile. Berjalan lancar di HP Android dengan browser Chrome, tanpa perlu download apapun dari Play Store.',
  },
  {
    q: 'Apakah bisa dipakai saat sinyal susah di kandang?',
    a: 'TernakOS menggunakan sistem prefetching dan caching lokal. Data yang sudah dimuat tetap bisa diakses meski koneksi terputus sementara. Sinkronisasi otomatis saat koneksi kembali.',
  },
  {
    q: 'Apakah data saya aman dari kompetitor?',
    a: 'Setiap akun memiliki isolasi data penuh menggunakan Row Level Security (RLS) di PostgreSQL. Data bisnis kamu tidak bisa diakses oleh pengguna lain meskipun menggunakan platform yang sama.',
  },
  {
    q: 'Bisakah satu orang punya lebih dari satu bisnis di TernakOS?',
    a: 'Bisa. Satu akun login bisa terhubung ke beberapa bisnis sekaligus — misalnya kamu punya kandang broiler sekaligus usaha broker ayam. Tinggal switch bisnis dari dashboard.',
  },
  {
    q: 'Apakah ada fitur undang karyawan atau tim?',
    a: 'Ada. Owner bisa undang anggota tim via kode 6 digit. Setiap anggota dapat role berbeda: Staff, View Only, Sopir — dengan batasan akses yang sesuai jabatannya.',
  },
  {
    q: 'Apakah TernakOS bisa dipakai di laptop atau komputer?',
    a: 'Bisa. TernakOS berjalan di semua browser modern — Chrome, Firefox, Safari, Edge — di HP maupun laptop tanpa instalasi apapun.',
  },
  {
    q: 'Bagaimana cara backup data di TernakOS?',
    a: 'Data tersimpan otomatis di cloud (Supabase PostgreSQL) dengan replikasi real-time. Tidak perlu backup manual — data kamu aman meski HP hilang atau rusak.',
  },
  {
    q: 'Apakah ada notifikasi otomatis?',
    a: 'Ya. TernakOS mengirim notifikasi in-app untuk: piutang jatuh tempo, stok pakan menipis, pengiriman tiba, dan trial hampir habis. Tidak perlu cek manual setiap hari.',
  },
]

const FAQ_ROLE = {
  broker_ayam: [
    {
      q: 'Apa itu aplikasi broker ayam dan apa bedanya dengan catatan biasa?',
      a: 'Aplikasi broker ayam adalah sistem digital untuk mencatat pembelian dari kandang, penjualan ke RPA/pasar, pengiriman, dan piutang dalam satu platform. Berbeda dengan buku atau Excel, data otomatis terhitung — margin, susut timbangan, dan saldo piutang selalu akurat tanpa hitung manual.',
    },
    {
      q: 'Bagaimana cara menghitung margin keuntungan broker ayam secara otomatis?',
      a: 'TernakOS menghitung margin otomatis: Margin = Harga Jual per kg × Bobot Tiba − (Modal Beli + Biaya Kirim + Biaya Lain). Bobot yang dipakai adalah bobot tiba aktual, bukan estimasi, sehingga susut timbangan sudah diperhitungkan.',
    },
    {
      q: 'Bisakah satu akun untuk beberapa kandang mitra?',
      a: 'Bisa. Kamu bisa mengelola database kandang mitra tanpa batas dalam satu akun broker. Setiap kandang punya riwayat transaksi, rating kualitas, dan estimasi stok sendiri.',
    },
    {
      q: 'Bagaimana cara kirim nota ke WhatsApp pembeli?',
      a: 'Setelah transaksi selesai, klik tombol "Kirim Nota" — sistem otomatis membuka WhatsApp dengan nota yang sudah diformat rapi. Pembeli langsung terima detail transaksi tanpa kamu perlu ketik ulang.',
    },
    {
      q: 'Bagaimana cara melacak piutang broker ayam yang belum dibayar?',
      a: 'Dashboard RPA menampilkan total piutang per pembeli secara real-time. Kamu bisa lihat detail per transaksi, catat pembayaran partial, dan sistem akan menghitung sisa hutang otomatis.',
    },
    {
      q: 'Apakah loss report mortalitas ayam bisa dibuat otomatis?',
      a: 'Ya. Ketika mencatat kedatangan pengiriman, input ekor tiba vs ekor kirim. Sistem otomatis membuat loss report mortalitas dan menghitung estimasi kerugian finansialnya.',
    },
  ],
  broker_telur: [
    {
      q: 'Bagaimana cara kirim nota ke WhatsApp pembeli?',
      a: 'Setelah transaksi selesai, klik tombol "Kirim Nota" — sistem otomatis membuka WhatsApp dengan nota yang sudah diformat rapi.',
    },
    {
      q: 'Bisakah pantau harga telur harian di dashboard?',
      a: 'Ya. Dashboard menampilkan harga pasar telur terkini yang diperbarui setiap hari, bisa dipakai sebagai referensi saat negosiasi harga dengan peternak atau pembeli.',
    },
    {
      q: 'Apa itu HPP telur dan bagaimana TernakOS menghitungnya?',
      a: 'HPP (Harga Pokok Penjualan) adalah total biaya untuk menghasilkan atau mendapatkan satu butir telur, termasuk biaya beli dari peternak dan biaya packaging. TernakOS menghitung HPP per butir otomatis saat kamu input stok masuk.',
    },
    {
      q: 'Bisakah kelola beberapa grade telur sekaligus?',
      a: 'Bisa. TernakOS mendukung multi-grade: Hero, Standard, dan Salted. Stok, HPP, dan harga jual masing-masing grade dikelola terpisah.',
    },
    {
      q: 'Bagaimana cara tracking piutang pelanggan telur?',
      a: 'Setiap transaksi dengan status "Piutang" otomatis masuk ke dashboard piutang per customer. Kamu bisa catat pembayaran kapan saja dan saldo sisa piutang terupdate real-time.',
    },
  ],
  broker_sembako: [
    {
      q: 'Apa itu sistem FIFO dan kenapa penting untuk toko sembako?',
      a: 'FIFO (First In First Out) artinya barang yang masuk lebih dulu harus keluar lebih dulu. Ini mencegah barang mengendap dan expired. TernakOS mengelola FIFO per batch otomatis — kamu tidak perlu urutkan manual.',
    },
    {
      q: 'Apakah sistem FIFO bisa untuk ratusan item berbeda?',
      a: 'Ya. Sistem batch tracking kami dirancang untuk mengelola ribuan SKU dengan metode FIFO otomatis per item. Cocok untuk distributor besar dengan ratusan jenis barang sekaligus.',
    },
    {
      q: 'Bisakah input faktur dari supplier sekaligus banyak item?',
      a: 'Bisa. Fitur multi-item entry memungkinkan kamu input puluhan item sembako dalam satu faktur pembelian tanpa perlu buat invoice terpisah per item.',
    },
    {
      q: 'Bagaimana cara menghitung HPP sembako secara akurat?',
      a: 'TernakOS menghitung HPP menggunakan metode FIFO atau rata-rata tertimbang per batch. Saat terjadi penjualan, sistem otomatis mendebet stok dari batch tertua dan menghitung HPP yang tepat.',
    },
    {
      q: 'Apakah bisa kelola piutang toko/agen yang belum bayar?',
      a: 'Ya. Setiap penjualan dengan sistem tempo otomatis masuk ke dashboard piutang. Kamu bisa monitor batas kredit per toko, rekap pencairan bon, dan catat pelunasan digital.',
    },
    {
      q: 'Bisakah TernakOS dipakai untuk distributor sembako berskala besar?',
      a: 'Bisa. Paket Business mendukung unlimited pengguna, multi-gudang, dan konsolidasi laporan seluruh cabang. Cocok untuk distributor sembako yang punya jaringan agen dan toko mitra.',
    },
  ],
  peternak: [
    {
      q: 'Apa itu FCR dan kenapa penting untuk peternak ayam broiler?',
      a: 'FCR (Feed Conversion Ratio) adalah rasio kg pakan yang dibutuhkan untuk menghasilkan 1 kg bobot ayam. FCR 1,6 artinya butuh 1,6 kg pakan untuk 1 kg ayam. Semakin rendah FCR, semakin efisien dan menguntungkan. TernakOS menghitung FCR otomatis setiap hari.',
    },
    {
      q: 'Apa itu Indeks Performa (IP) kandang ayam?',
      a: 'IP (Indeks Performa) adalah angka gabungan yang mencerminkan efisiensi produksi satu siklus kandang: IP = (Survival Rate × Bobot Rata-rata × 100) ÷ (FCR × Umur Panen). IP > 300 dianggap sangat baik. TernakOS menghitung IP otomatis setiap siklus selesai.',
    },
    {
      q: 'Bisakah pantau lebih dari satu kandang?',
      a: 'Bisa. Tambahkan kandang sebanyak yang kamu miliki (sesuai limit paket). Setiap kandang punya recording harian dan analisis siklus sendiri yang bisa dibandingkan satu sama lain.',
    },
    {
      q: 'Apakah TernakOS mendukung sistem kemitraan (CP, Japfa, dll)?',
      a: 'Ya. TernakOS mendukung model bisnis mandiri murni, mandiri semi, maupun mitra penuh. Untuk pola mitra, kamu bisa input nama INTI, harga kontrak, dan sistem deducting sapronak otomatis.',
    },
    {
      q: 'Bagaimana cara menghitung keuntungan peternak broiler per siklus?',
      a: 'TernakOS menghitung profit bersih per siklus: Pendapatan Panen − Biaya DOC − Biaya Pakan − Biaya Obat/Vaksin − Biaya Tenaga Kerja − Biaya Lainnya. Semua tersedia real-time tanpa harus tunggu siklus selesai.',
    },
    {
      q: 'Apakah bisa catat vaksinasi dan penggunaan obat per siklus?',
      a: 'Ya. Modul vaksinasi memungkinkan kamu catat jenis vaksin, dosis, tanggal, dan tenaga pelaksana. Data ini terintegrasi ke laporan biaya siklus dan bisa jadi referensi untuk siklus berikutnya.',
    },
    {
      q: 'Apakah ada fitur recording harian untuk peternak?',
      a: 'Ada. Input harian bisa diselesaikan kurang dari 2 menit: mortalitas, pakan terpakai, sampel bobot rata-rata. Sistem otomatis menghitung FCR harian dan menampilkan grafik tren bobot vs pakan.',
    },
  ],
  rpa: [
    {
      q: 'Apa yang dimaksud dengan software manajemen RPA?',
      a: 'Software manajemen RPA (Rumah Potong Ayam) adalah sistem digital untuk mencatat order pembelian ayam hidup dari broker, tracking hutang ke pemasok, distribusi ke customer, dan laporan profitabilitas. Menggantikan proses manual yang rawan dispute dan salah hitung.',
    },
    {
      q: 'Bagaimana TernakOS membantu mengurangi dispute dengan broker?',
      a: 'Data transaksi di TernakOS tercatat transparan untuk semua pihak. Harga, bobot, tanggal, dan status pembayaran tersimpan digital — tidak ada ruang untuk dispute karena datanya sama-sama bisa dilihat.',
    },
    {
      q: 'Apakah bisa integrasi dengan timbangan digital?',
      a: 'Saat ini input bobot dilakukan manual di aplikasi. Integrasi timbangan digital ada di roadmap pengembangan kami dan akan tersedia untuk paket Business.',
    },
    {
      q: 'Bisakah buyer melihat status pengiriman?',
      a: 'Fitur buyer portal sedang dalam pengembangan. Saat ini notifikasi pengiriman bisa dikirim manual via WhatsApp dari dashboard dengan satu klik.',
    },
    {
      q: 'Bagaimana cara tracking hutang RPA ke broker pemasok?',
      a: 'Dashboard hutang menampilkan total outstanding ke semua broker secara real-time, breakdown per broker dan per transaksi, serta riwayat pembayaran lengkap. Tidak ada hutang yang kelewat.',
    },
    {
      q: 'Apakah ada laporan margin keuntungan per produk di RPA?',
      a: 'Ada. Laporan profitabilitas menampilkan margin per produk, top customer by revenue, dan grafik Revenue vs HPP vs Profit per periode. Filter tanggal fleksibel untuk analisis bulanan atau mingguan.',
    },
  ],
}

// ── [SECTION BARU] FAQ Item Component ──
function FAQItem({ q, a, isSembako }) {
  const [open, setOpen] = useState(false)
  const accent = isSembako ? 'text-amber-400' : 'text-emerald-400'
  const borderActive = isSembako ? 'border-amber-500/30' : 'border-emerald-500/30'

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${open ? `bg-white/[0.03] ${borderActive}` : 'bg-[#111C24] border-white/8 hover:border-white/15'}`}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer"
          >
            <span className="text-sm font-semibold text-white leading-snug">{q}</span>
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className={`shrink-0 ${open ? accent : 'text-[#4B6478]'}`}
            >
              <ChevronDown size={16} />
            </motion.span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-5">
            <p className="text-sm text-[#94A3B8] leading-relaxed">{a}</p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FiturPage() {
  const [selectedRole, setSelectedRole] = useState('broker')
  const [selectedSub, setSelectedSub] = useState('ayam')
  const tabBarRef = useRef(null)
  const [isSticky, setIsSticky] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

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

  const hero = HERO_CONTENT[contentKey] ?? HERO_CONTENT.broker_ayam
  const beforeAfter = BEFORE_AFTER[contentKey] ?? []
  const faqItems = [...FAQ_COMMON, ...(FAQ_ROLE[contentKey] ?? [])].slice(0, 4)
  const isSembako = contentKey === 'broker_sembako'

  // Update document title dynamically (no react-helmet-async needed)
  useEffect(() => {
    document.title = `${hero.eyebrow} — TernakOS | Solusi Digital Peternakan Indonesia`
    return () => { document.title = 'TernakOS | Solusi Digital Peternakan Indonesia' }
  }, [hero.eyebrow])

  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] overflow-x-hidden">
      <Navbar />

      <main>

        {/* ── [SECTION BARU] Dynamic Hero per Role ── */}
        <section className="relative pt-32 pb-20 px-5 overflow-hidden">
          {/* Background glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-72 bg-emerald-500/8 blur-3xl pointer-events-none" />
          {isSembako && (
            <div className="absolute top-8 right-0 w-[400px] h-48 bg-amber-500/6 blur-3xl pointer-events-none" />
          )}

          {/* Background Particles */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Particles
              particleColors={isSembako ? ['#F59E0B', '#FBBF24', '#D97706'] : ['#10B981', '#34D399', '#059669']}
              particleCount={typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 40}
              speed={0.3}
              particleBaseSize={1.2}
            />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">

            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey + '_hero'}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-5 ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {hero.eyebrow}
                </p>
                <h1 className={`font-['Sora'] ${isDesktop ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-3xl'} font-black text-white ${isDesktop ? 'leading-[1.1]' : 'leading-[1.2]'} tracking-tight mb-6 max-w-3xl mx-auto`}>
                  {hero.headline}
                </h1>
                <p className={`${isDesktop ? 'text-lg' : 'text-base'} text-[#94A3B8] max-w-2xl mx-auto leading-relaxed`}>
                  {hero.sub}
                </p>

                {/* Quick stats row */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#4B6478] font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                    Trial 14 hari gratis
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                    Setup &lt; 15 menit
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                    Tanpa instalasi software
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                    Berjalan di HP Android
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ── SENTINEL for sticky detection ── */}
        <div ref={tabBarRef} />

        {/* ── TAB BAR (sticky) — UNCHANGED ── */}
        <div className={`sticky top-0 z-30 transition-all duration-200 ${isSticky ? 'bg-[#06090F]/95 backdrop-blur-md border-b border-white/8 shadow-lg' : 'bg-[#06090F]'}`}>
          <div className="max-w-5xl mx-auto px-4 pt-3 pb-2 flex flex-col items-center gap-2">

            {/* Level 1 — Role */}
            <div className="inline-flex bg-[#111C24] border border-white/8 rounded-full p-1 gap-1 relative">
              {ROLES.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleChange(role.id)}
                  className={`relative z-10 px-5 md:px-7 py-2 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer border-none ${selectedRole === role.id
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
                    className={`flex items-center gap-1 px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-colors duration-150 ${sub.disabled
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

        {/* ── FEATURE GROUPS — UNCHANGED ── */}
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

        {/* ── [SECTION BARU] Before vs After Table ── */}
        <section className="py-20 px-5 bg-[#080D13]">
          <div className="max-w-4xl mx-auto">
            <FadeUp className="text-center mb-12">
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`}>
                PERBANDINGAN
              </p>
              <h2 className="font-['Sora'] text-3xl font-bold text-white">
                Sebelum & Sesudah TernakOS
              </h2>
              <p className="text-[#4B6478] text-sm mt-3 max-w-lg mx-auto">
                Ini bukan janji — ini yang kamu rasakan di hari pertama pakai.
              </p>
            </FadeUp>

            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey + '_ba'}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {/* Table header */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/8 border border-red-500/15">
                    <X size={14} className="text-red-400 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-widest text-red-400">Cara Lama</span>
                  </div>
                  <div className={`flex items-center gap-2 px-5 py-3 rounded-xl border ${isSembako ? 'bg-amber-500/8 border-amber-500/15' : 'bg-emerald-500/8 border-emerald-500/15'}`}>
                    <Check size={14} className={`shrink-0 ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`} />
                    <span className={`text-xs font-black uppercase tracking-widest ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`}>Dengan TernakOS</span>
                  </div>
                </div>

                {/* Rows */}
                <div className="space-y-2">
                  {beforeAfter.map((row, i) => (
                    <FadeUp key={i} delay={i * 0.06}>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-[#111C24] border border-white/5">
                          <span className="text-red-400/60 text-xs font-bold mt-0.5 shrink-0">✗</span>
                          <p className="text-sm text-[#94A3B8] leading-snug">{row.before}</p>
                        </div>
                        <div className={`flex items-start gap-3 px-5 py-4 rounded-xl border ${isSembako ? 'bg-amber-500/5 border-amber-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                          <span className={`text-xs font-bold mt-0.5 shrink-0 ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`}>✓</span>
                          <p className="text-sm text-white leading-snug font-medium">{row.after}</p>
                        </div>
                      </div>
                    </FadeUp>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ── SHARED FEATURES — UNCHANGED ── */}
        <section className="py-20 px-5 bg-[#06090F]">
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

        {/* ── [SECTION BARU] FAQ Accordion ── */}
        <section className="py-20 px-5 bg-[#080D13]">
          <div className="max-w-2xl mx-auto">
            <FadeUp className="text-center mb-12">
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`}>
                FAQ
              </p>
              <h2 className="font-['Sora'] text-3xl font-bold text-white">
                Pertanyaan yang Sering Ditanya
              </h2>
            </FadeUp>

            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey + '_faq'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {faqItems.map((item, i) => (
                  <FadeUp key={i} delay={i * 0.04}>
                    <FAQItem q={item.q} a={item.a} isSembako={isSembako} />
                  </FadeUp>
                ))}
              </motion.div>
            </AnimatePresence>

            <FadeUp className="text-center mt-8">
              <Link
                to="/faq"
                className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${isSembako ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'}`}
              >
                Lihat semua 200+ FAQ
                <ArrowRight size={15} />
              </Link>
            </FadeUp>
          </div>
        </section>

        {/* ── [SECTION BARU] CTA Footer per Role ── */}
        <section className="py-24 px-5">
          <div className="max-w-3xl mx-auto">
            <FadeUp>
              <div className="relative rounded-3xl p-12 md:p-16 text-center border border-emerald-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none rounded-3xl" />
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />
                {isSembako && (
                  <div className="absolute bottom-0 right-0 w-48 h-24 bg-amber-500/8 blur-2xl pointer-events-none" />
                )}

                <div className="relative z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={contentKey + '_cta'}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {hero.eyebrow}
                      </p>
                      <h2 className="font-['Sora'] text-3xl md:text-4xl font-bold text-white mb-4">
                        Siap coba semua fitur ini?
                      </h2>
                      <p className="text-[#94A3B8] text-base mb-10">
                        14 hari gratis, tanpa kartu kredit, tanpa instalasi.
                      </p>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                          to="/register"
                          className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.45)] whitespace-nowrap"
                        >
                          {hero.cta}
                          <ArrowRight size={18} />
                        </Link>

                        <a
                          href="https://wa.me/6281234567890"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all whitespace-nowrap"
                        >
                          <MessageCircle size={16} />
                          Hubungi via WhatsApp
                        </a>
                      </div>
                    </motion.div>
                  </AnimatePresence>
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
