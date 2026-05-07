import { Sparkles, ClipboardList, Truck, BarChart2 } from 'lucide-react'

export const RPA_STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Selamat datang di TernakOS!',
    desc: 'Platform manajemen Rumah Potong Ayam — kelola order pemotongan, distribusi, dan pantau margin bisnis Anda.',
    bullets: [
      'Order pemotongan tercatat & terlacak',
      'Distribusi ke pelanggan terpantau',
      'Laporan margin & piutang otomatis',
    ],
  },
  {
    id: 'order',
    icon: ClipboardList,
    title: 'Buat Order Pemotongan',
    desc: 'Catat setiap order masuk dari broker atau pelanggan langsung. Jumlah ekor, harga, dan jadwal potong tersimpan per order.',
    navHint: 'Order',
    selector: '[data-tutorial="rpa-order"]',
  },
  {
    id: 'distribusi',
    icon: Truck,
    title: 'Kelola Distribusi',
    desc: 'Buat jadwal pengiriman hasil potong ke pelanggan. Status pengiriman, berat aktual, dan pembayaran terpantau secara real-time.',
    navHint: 'Distribusi',
    selector: '[data-tutorial="rpa-distribusi"]',
  },
  {
    id: 'laporan',
    icon: BarChart2,
    title: 'Pantau Laporan Margin',
    desc: 'Lihat margin per order, piutang outstanding, dan tren omset. Laporan bisa diekspor untuk pembukuan atau diskusi dengan investor.',
    navHint: 'Laporan',
    selector: '[data-tutorial="rpa-laporan"]',
  },
]
