import { ShoppingCart, Package, UserCheck, FileText } from 'lucide-react'

export const groups = [
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
]

export const hero = {
  eyebrow: 'Solusi Broker Telur',
  headline: 'Pantau Harga Telur Harian dan Margin Per Transaksi Secara Real-time.',
  sub: 'Tidak ada lagi selisih hitungan. Semua tercatat otomatis dari kandang sampai pembeli.',
  cta: 'Coba Manajemen Broker Telur',
}

export const beforeAfter = [
  { before: 'Harga telur dicatat manual tiap hari', after: 'Pantau harga pasar real-time dari dashboard' },
  { before: 'Margin per transaksi dihitung kalkulator', after: 'Margin otomatis terhitung saat input transaksi' },
  { before: 'Piutang diingat-ingat sendiri', after: 'Tracking piutang otomatis dengan reminder' },
  { before: 'Nota dikirim foto buku ke WhatsApp', after: 'Nota digital profesional langsung ke pembeli' },
]

export const faq = [
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
]
