import { Sparkles, ArrowLeftRight, Warehouse, Truck, BarChart2 } from 'lucide-react'

export const BROKER_AYAM_STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Selamat datang di TernakOS!',
    desc: 'Platform manajemen broker ayam — catat transaksi beli/jual, kelola armada pengiriman, dan pantau performa bisnis Anda secara real-time.',
    bullets: [
      'Transaksi beli & jual ayam tercatat rapi',
      'Pengiriman & armada terpantau live',
      'Laporan margin & cash flow otomatis',
    ],
  },
  {
    id: 'transaksi',
    icon: ArrowLeftRight,
    title: 'Catat Transaksi Beli & Jual',
    desc: 'Rekam setiap transaksi pembelian dari peternak dan penjualan ke RPA atau pelanggan. Harga, bobot, dan margin terhitung otomatis.',
    navHint: 'Transaksi',
    selector: '[data-tutorial="broker-transaksi"]',
  },
  {
    id: 'kandang',
    icon: Warehouse,
    title: 'Kelola Kandang & RPA',
    desc: 'Daftarkan kandang sumber ternak dan RPA tujuan pengiriman. Data ini menghubungkan rantai pasok dan mempermudah rekap per lokasi.',
    navHint: 'Kandang',
    selector: '[data-tutorial="broker-kandang"]',
  },
  {
    id: 'pengiriman',
    icon: Truck,
    title: 'Atur Pengiriman & Armada',
    desc: 'Buat jadwal pengiriman, assign ke sopir, dan pantau status perjalanan. Kehilangan dan selisih bobot dicatat secara otomatis.',
    navHint: 'Pengiriman',
    selector: '[data-tutorial="broker-pengiriman"]',
  },
  {
    id: 'laporan',
    icon: BarChart2,
    title: 'Pantau Laporan & Margin',
    desc: 'Lihat ringkasan margin per transaksi, tren penjualan, dan cash flow bulanan. Laporan siap diekspor untuk rapat atau mitra bisnis.',
    navHint: 'Laporan',
    selector: '[data-tutorial="broker-laporan"]',
  },
]
