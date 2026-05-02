import { ArrowLeftRight, Home, Truck, Users, BarChart2 } from 'lucide-react'

export const groups = [
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
]

export const hero = {
  eyebrow: 'Solusi Broker Ayam',
  headline: 'Kelola Ratusan Ton Ayam Tanpa Pusing Selisih Timbangan.',
  sub: 'Dari catat pembelian kandang sampai kirim nota ke WhatsApp pembeli — semua dalam 3 langkah.',
  cta: 'Mulai Kelola Transaksi Broker',
}

export const beforeAfter = [
  { before: 'Catat timbangan di buku, sering hilang atau salah', after: 'Input digital, tersimpan otomatis di cloud' },
  { before: 'Hitung margin manual pakai kalkulator', after: 'Margin terhitung otomatis per transaksi' },
  { before: 'Kirim nota lewat foto buku ke WhatsApp', after: 'Nota digital dikirim otomatis ke WhatsApp pembeli' },
  { before: 'Tidak tahu siapa yang belum bayar tempo', after: 'Dashboard piutang real-time dengan alert jatuh tempo' },
]

export const faq = [
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
]
