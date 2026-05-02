import { ShoppingBag, CreditCard, BarChart2, Building } from 'lucide-react'

export const groups = [
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
]

export const hero = {
  eyebrow: 'Solusi Rumah Potong Ayam',
  headline: 'Kelola Pembelian Ayam Hidup dan Pengiriman ke Pembeli Tanpa Dokumen Manual.',
  sub: 'Timbang, potong, kirim — semua tercatat digital dengan laporan harian otomatis.',
  cta: 'Kelola Operasional RPA',
}

export const beforeAfter = [
  { before: 'Dokumen timbang manual, rawan dispute', after: 'Timbangan digital tercatat otomatis' },
  { before: 'Susut bobot tidak terpantau', after: 'Loss report otomatis setiap pengiriman' },
  { before: 'Laporan harian dibuat manual', after: 'Dashboard operasional harian otomatis' },
  { before: 'Koordinasi sopir lewat telepon', after: 'Manajemen armada & jadwal dari dashboard' },
]

export const faq = [
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
]
