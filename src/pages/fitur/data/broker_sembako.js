import { ShoppingCart, Package, Users, Network } from 'lucide-react'

export const groups = [
  {
    Icon: ShoppingCart,
    title: 'POS Grosir & Eceran Dinamis',
    desc: null,
    features: [
      'Support multi-satuan (Sak, Ball, Karton, Pcs)',
      'Invoice instan ke kasir & print struck',
      'Dual-Pricing otomatis (Harga Retail vs Partai)',
      'Sistem Payment Cash / Tempo (Piutang)',
      'Diskon dinamis (Tiered Pricing)',
    ],
  },
  {
    Icon: Package,
    title: 'Manajemen Multi-Gudang & Inventori',
    desc: null,
    features: [
      'Tracking stok real-time antar cabang',
      'Mutasi/transfer stok antar gudang tanpa error',
      'Modul Stok Opname / SO harian terintegrasi',
      'Alert "Minimum Stock" ke HP pengelola',
      'Kalkulasi Harga Pokok Penjualan (HPP FIFO/Average)',
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
      'Bukti pelunasan digital tanpa kertas',
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
      'Export Laporan Pemasukan Harian',
    ],
  },
]

export const hero = {
  eyebrow: 'Solusi Agen Sembako',
  headline: 'Stok Bocor? Pantau Keluar Masuk Barang Secara Akurat dengan Sistem FIFO.',
  sub: 'Kelola ribuan item sembako — beras, minyak, telur — dalam satu invoice tanpa salah hitung.',
  cta: 'Coba Manajemen Stok Sembako',
}

export const beforeAfter = [
  { before: 'Stok dicatat manual, sering selisih', after: 'FIFO otomatis, stok selalu akurat' },
  { before: 'Tidak tahu barang mana yang mau expired', after: 'Sistem batch tracking mencegah stok mengendap' },
  { before: 'Hitung untung rugi di akhir bulan saja', after: 'Laporan profit bersih tersedia kapan saja' },
  { before: 'Input faktur satu per satu tiap item', after: 'Multi-item entry dalam satu invoice' },
]

export const faq = [
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
]
