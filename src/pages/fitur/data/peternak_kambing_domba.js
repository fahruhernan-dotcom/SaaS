import { RefreshCw, Package, Home, ClipboardList, Zap, BarChart2 } from 'lucide-react'

export const groups = [
  {
    Icon: RefreshCw,
    title: 'Penggemukan & Breeding dalam Satu Akun',
    desc: '4 sub-tipe tersedia: Kambing Penggemukan, Kambing Breeding, Domba Penggemukan, Domba Breeding.',
    features: [
      'Penggemukan: sistem batch koloni massal',
      'Breeding: tracking individu & reproduksi',
      'Switch antar tipe tanpa keluar aplikasi',
      'Data & laporan terpisah per tipe',
      'Semua diakses dari satu dashboard',
    ],
  },
  {
    Icon: Package,
    title: 'Batch Management Penggemukan',
    desc: 'Catat masuk, pantau mortalitas, tutup batch saat panen — tanpa kertas.',
    features: [
      'Buat batch: tanggal masuk, jumlah ekor, bobot rata-rata',
      'Tracking mortalitas & pergantian populasi realtime',
      'Target hari dan target bobot panen per batch',
      'Status batch: Aktif, Siap Jual',
      'Catat penjualan massal saat batch tutup',
    ],
  },
  {
    Icon: Home,
    title: 'Denah Kandang Visual',
    desc: 'Lihat posisi ternak di kandang — performa batch terbaca sekilas.',
    features: [
      'Visualisasi layout kandang interaktif',
      'Warna per batch berdasarkan performa',
      'Mode tampilan 3D isometrik',
      'Filter tampilan per batch aktif',
      'Klik ternak → kartu detail langsung terbuka',
    ],
  },
  {
    Icon: ClipboardList,
    title: 'Tugas Harian & Penugasan Tim',
    desc: 'Assign tugas ke anak kandang, pantau kepatuhan dari HP.',
    features: [
      'Template tugas: pakan, minum, vaksin, timbang',
      'Assign ke anak kandang individual',
      'Tracking penyelesaian tugas real-time',
      'Konfigurasi jadwal & template tugas',
      'Riwayat kepatuhan harian tim',
    ],
  },
  {
    Icon: Zap,
    title: 'Stok Pakan & Kesehatan',
    desc: 'Pantau stok sebelum habis, catat riwayat kesehatan per batch.',
    features: [
      'Stok hijauan & konsentrat terpantau realtime',
      'Log pemberian pakan per batch',
      'Log vaksinasi & pengobatan per batch/individu',
      'Alert stok pakan menipis otomatis',
      'Rekam medik per batch atau individu',
    ],
  },
  {
    Icon: BarChart2,
    title: 'Reproduksi & Laporan Keuangan',
    desc: 'BEP per batch terhitung otomatis — siklus breeding terdokumentasi lengkap.',
    features: [
      'Tracking reproduksi: birahi, IB, kehamilan, kelahiran (Breeding)',
      'Laporan laba-rugi per batch (Penggemukan)',
      'HPP per ekor otomatis dari semua komponen biaya',
      'Catat penjualan massal atau per individu',
      'Ringkasan keuangan per batch siap lapor',
    ],
  },
]

export const hero = {
  eyebrow: 'Solusi Peternak Kambing & Domba',
  headline: 'Kelola Batch Penggemukan & Siklus Breeding Kambing Domba Lebih Akurat.',
  sub: 'Dari koloni penggemukan massal hingga tracking reproduksi breeding — kambing dan domba sama-sama didukung dalam satu platform digital tanpa kertas.',
  cta: 'Mulai Kelola Kandang Kambing Domba',
}

export const beforeAfter = [
  { before: 'Catat populasi & mortalitas di whiteboard kandang', after: 'Batch digital dengan mortalitas terpantau real-time' },
  { before: 'Tugas harian anak kandang tidak terdokumentasi', after: 'Template tugas + tracking penyelesaian per pekerja' },
  { before: 'Stok konsentrat baru ketahuan habis saat kosong', after: 'Alert stok pakan otomatis sebelum kehabisan' },
  { before: 'BEP & untung rugi batch dihitung asal kira-kira', after: 'Laporan HPP & laba-rugi per batch otomatis' },
]

export const faq = [
  {
    q: 'Apa perbedaan modul Penggemukan dan Breeding di TernakOS?',
    a: 'Penggemukan (Fattening) menggunakan sistem batch koloni — kamu input populasi massal per kandang, tracking mortalitas, dan tutup batch saat panen. Breeding menggunakan tracking individu — setiap ternak punya kartu dengan silsilah, siklus reproduksi, dan rekam medik sendiri.',
  },
  {
    q: 'Apakah kambing dan domba bisa dikelola dalam satu akun?',
    a: 'Bisa. TernakOS mendukung 4 sub-tipe: Kambing Penggemukan, Kambing Breeding, Domba Penggemukan, dan Domba Breeding. Masing-masing punya data dan laporan terpisah, tapi semua bisa diakses dari satu login.',
  },
  {
    q: 'Apakah mendukung pencatatan batch populasi massal?',
    a: 'Ya. Untuk mode penggemukan, kamu bisa buat batch dengan total ekor masuk, bobot rata-rata, dan target hari panen. Mortalitas, pengeluaran, dan penjualan dicatat per batch. Di akhir periode, laporan laba-rugi dan HPP per ekor terhitung otomatis tanpa hitung manual.',
  },
  {
    q: 'Bagaimana sistem tugas harian untuk anak kandang bekerja?',
    a: 'Owner atau manajer buat template tugas (pakan pagi, pakan sore, cek kesehatan) dan assign ke anak kandang. Setiap pekerja bisa centang tugas selesai dari HP. Riwayat penyelesaian terekam untuk evaluasi performa tim harian.',
  },
  {
    q: 'Bagaimana TernakOS membantu menghitung keuntungan per batch?',
    a: 'TernakOS merangkum semua biaya per batch: harga beli ternak masuk, biaya pakan, biaya operasional (listrik, air), biaya kesehatan — lalu dikurangi pendapatan penjualan. HPP per ekor dan laba bersih per batch langsung tersedia, tidak perlu buka Excel.',
  },
]
