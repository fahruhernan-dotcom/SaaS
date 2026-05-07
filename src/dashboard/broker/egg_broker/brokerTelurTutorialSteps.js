import { Sparkles, ArrowLeftRight, Warehouse, Building2, BarChart2 } from 'lucide-react'

export const BROKER_TELUR_STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Selamat datang di TernakOS!',
    desc: 'Platform manajemen broker telur — kelola stok, jual via POS, dan pantau supplier Anda dari satu tempat.',
    bullets: [
      'POS cepat untuk penjualan harian',
      'Inventori & HPP terhitung otomatis',
      'Manajemen supplier & riwayat transaksi',
    ],
  },
  {
    id: 'pos',
    icon: ArrowLeftRight,
    title: 'Jual via POS',
    desc: 'Gunakan layar POS untuk mencatat penjualan telur dengan cepat. Pilih produk, masukkan jumlah, dan transaksi langsung tersimpan.',
    navHint: 'POS / Jual',
    selector: '[data-tutorial="egg-pos"]',
  },
  {
    id: 'inventori',
    icon: Warehouse,
    title: 'Kelola Inventori & HPP',
    desc: 'Pantau stok telur per jenis dan ukuran. HPP dihitung otomatis dari harga beli, sehingga margin setiap penjualan langsung terlihat.',
    navHint: 'Inventori',
    selector: '[data-tutorial="egg-inventori"]',
  },
  {
    id: 'supplier',
    icon: Building2,
    title: 'Daftarkan Supplier Telur',
    desc: 'Masukkan data peternak atau supplier telur Anda. Setiap pembelian akan terhubung ke supplier untuk analisa harga dan histori.',
    navHint: 'Supplier Telur',
    selector: '[data-tutorial="egg-supplier"]',
  },
  {
    id: 'laporan',
    icon: BarChart2,
    title: 'Pantau Laporan & Performa',
    desc: 'Lihat ringkasan penjualan, stok bergerak, dan tren harga telur. Ekspor laporan untuk kebutuhan pembukuan atau mitra.',
    navHint: 'Laporan',
    selector: '[data-tutorial="egg-laporan"]',
  },
]
