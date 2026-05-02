import { RefreshCw, TrendingUp, Home, ClipboardList, Users, BarChart2 } from 'lucide-react'

export const groups = [
  {
    Icon: RefreshCw,
    title: 'Multi-Batch Fattening & Breeding',
    desc: 'Kelola beberapa batch sekaligus — tutup batch lama, buka batch baru tanpa gangguan.',
    features: [
      'Buat & tutup batch dengan tanggal masuk dan target panen',
      'Dukung dua model: Penggemukan (Fattening) & Breeding',
      'Status batch: Aktif, Siap Jual',
      'Ringkasan populasi & nilai per batch realtime',
      'Multi-batch paralel dalam satu akun',
    ],
  },
  {
    Icon: TrendingUp,
    title: 'Kartu Ternak & ADG per Ekor',
    desc: 'Setiap sapi punya kartu digital — dari beli masuk sampai jual keluar.',
    features: [
      'Profil per ekor: ear tag, ras, bobot masuk, target bobot',
      'Log penimbangan rutin dengan ADG otomatis',
      'ADG = (Bobot Terkini − Bobot Masuk) ÷ Hari di Farm',
      'Prediksi tanggal siap jual dari tren ADG',
      'Warna tier performa: Hijau ≥ 0.8 kg, Kuning 0.5–0.8 kg, Merah < 0.5 kg',
    ],
  },
  {
    Icon: Home,
    title: 'Denah Kandang 3D Interaktif',
    desc: 'Visualisasi posisi setiap sapi — lihat performa sekilas tanpa buka kartu satu-satu.',
    features: [
      'Layout kandang interaktif per batch',
      'Dot warna berdasarkan tier ADG per ekor',
      'Mode tampilan 3D isometrik',
      'Filter tampilan per batch aktif',
      'Klik sapi → buka kartu detail langsung',
    ],
  },
  {
    Icon: ClipboardList,
    title: 'Sistem Penugasan Tim Kandang',
    desc: 'Assign tugas ke anak kandang dan pantau kepatuhan tanpa harus telepon.',
    features: [
      'Template tugas harian: pakan, timbang, cek kesehatan',
      'Assign tugas ke anak kandang individual',
      'Tracking status penyelesaian per hari',
      'Konfigurasi jadwal & template tugas',
      'Riwayat kepatuhan tim per periode',
    ],
  },
  {
    Icon: Users,
    title: 'Kesehatan & Reproduksi (Breeding)',
    desc: 'Rekam medik per ekor dan siklus reproduksi untuk mode Breeding.',
    features: [
      'Log vaksinasi & pengobatan per ekor',
      'Rekam medik individual terintegrasi',
      'Tracking siklus birahi, IB, dan kelahiran',
      'Catatan induk, pejantan, & silsilah pedet',
      'Alert pemeriksaan rutin berkala',
    ],
  },
  {
    Icon: BarChart2,
    title: 'Laporan Batch & Penjualan',
    desc: 'Laba-rugi per batch terhitung otomatis — tidak perlu Excel lagi.',
    features: [
      'Laporan laba-rugi per batch otomatis',
      'HPP per kg/ekor terhitung dari semua biaya',
      'Catat penjualan per ekor atau per batch',
      'Biaya operasional: listrik, air, pakan, obat',
      'Ringkasan keuangan batch siap lapor',
    ],
  },
]

export const hero = {
  eyebrow: 'Solusi Peternak Sapi',
  headline: 'Pantau ADG, Batch, dan Denah Kandang Sapi dari Satu Dashboard.',
  sub: 'Sistem lengkap untuk sapi penggemukan & breeding — tracking bobot per ekor, penugasan tim anak kandang, hingga laporan keuangan batch otomatis.',
  cta: 'Mulai Kelola Kandang Sapi',
}

export const beforeAfter = [
  { before: 'Catat bobot sapi di buku, susah cari histori per ekor', after: 'Kartu ternak digital dengan ADG otomatis per ekor' },
  { before: 'Delegasi tugas anak kandang lewat pesan WhatsApp', after: 'Penugasan digital dengan tracking penyelesaian harian' },
  { before: 'Jadwal kesehatan & IB tidak terdokumentasi', after: 'Log kesehatan & reproduksi terintegrasi per ekor' },
  { before: 'Laporan batch dihitung manual di akhir periode', after: 'Laporan laba-rugi batch tersedia real-time otomatis' },
]

export const faq = [
  {
    q: 'Apa itu ADG dan bagaimana TernakOS menghitungnya?',
    a: 'ADG (Average Daily Gain) adalah rata-rata pertambahan bobot harian sapi — kunci efisiensi di usaha fattening. TernakOS menghitung ADG otomatis: (Bobot Terkini − Bobot Masuk) ÷ Jumlah Hari di Farm. Setiap kali kamu input penimbangan baru, ADG dan prediksi tanggal panen langsung diperbarui.',
  },
  {
    q: 'Bagaimana TernakOS mengelola batch sapi penggemukan?',
    a: 'Buat batch baru dengan mengisi tanggal masuk, jumlah ekor, dan bobot rata-rata. Setelah batch aktif, kamu bisa tambah sapi individual dengan ear tag, catat penimbangan rutin, dan tutup batch ketika penjualan selesai. Laporan laba-rugi per batch langsung tersedia otomatis.',
  },
  {
    q: 'Apakah bisa kelola sapi penggemukan dan breeding sekaligus?',
    a: 'Bisa. Satu akun TernakOS mendukung dua tipe peternakan sapi: Penggemukan (fattening) dan Breeding. Penggemukan fokus pada tracking bobot dan ADG menuju target panen, sementara Breeding memiliki modul reproduksi untuk tracking birahi, IB, dan kelahiran.',
  },
  {
    q: 'Apa itu fitur Denah Kandang 3D?',
    a: 'Denah Kandang adalah visualisasi interaktif posisi setiap sapi dalam kandang. Setiap titik berwarna berdasarkan performa ADG: hijau (ADG ≥ 0.8 kg/hari), kuning (0.5–0.8 kg), merah (< 0.5 kg). Tersedia mode tampilan 3D isometrik. Klik salah satu titik untuk langsung membuka kartu detail sapi tersebut.',
  },
  {
    q: 'Bagaimana sistem penugasan tim anak kandang bekerja?',
    a: 'Owner atau manajer bisa membuat template tugas harian (pakan pagi, timbang, cek kesehatan) dan mengassign ke anak kandang. Setiap anak kandang melihat daftar tugasnya dan menandai selesai dari HP. Riwayat penyelesaian terekam otomatis — kamu bisa pantau kepatuhan tim tanpa harus telepon satu-satu.',
  },
]
