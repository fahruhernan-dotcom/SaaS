import { Home, RefreshCw, ClipboardList, TrendingUp, Users, Package } from 'lucide-react'

export const groups = [
  {
    Icon: Home,
    title: 'Multi-Kandang, Multi-Model Bisnis',
    desc: null,
    features: [
      'Dukung Mandiri & Kemitraan (CP, Japfa, dll)',
      'Setup detail INTI perusahaan + harga kontrak',
      'Limit kandang per plan (Starter:1, Pro:2, Business:∞)',
      'Dukung Broiler & Petelur (Layer) dalam satu akun',
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
]

export const hero = {
  eyebrow: 'Solusi Peternak Ayam',
  headline: 'Cetak Indeks Performa (IP) Tertinggi dengan Manajemen Kandang Berbasis Data.',
  sub: 'Catat FCR, mortality, dan pemakaian obat harian. Bandingkan performa antar siklus kandang.',
  cta: 'Mulai Kelola Kandang Ayam',
}

export const beforeAfter = [
  { before: 'Catat kematian ayam di kertas, mudah hilang', after: 'Recording harian digital, tersimpan per siklus' },
  { before: 'Hitung FCR manual, sering tidak akurat', after: 'Kalkulator FCR otomatis dari data pakan & bobot' },
  { before: 'Tidak bisa bandingkan performa antar siklus', after: 'Analisis siklus otomatis dengan grafik tren' },
  { before: 'Tidak tahu profit sebelum panen selesai', after: 'Estimasi keuntungan tersedia real-time' },
]

export const faq = [
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
]
