import { Sparkles, Home, RefreshCw, ClipboardList, BarChart2 } from 'lucide-react'

const STEP3 = {
  poultry: {
    id: 'siklus',
    icon: RefreshCw,
    title: 'Mulai Siklus Pertama',
    desc: 'Siklus dimulai saat DOC / bibit masuk kandang. Catat jumlah, berat awal, dan target panen. Semua kalkulasi FCR & IP akan berjalan otomatis.',
    navHint: 'Siklus',
    selector: '[data-tutorial="peternak-siklus"]',
  },
  fattening: {
    id: 'batch',
    icon: RefreshCw,
    title: 'Buka Batch Pertama',
    desc: 'Batch dimulai saat ternak masuk. Catat jumlah ekor, berat awal, dan estimasi target penjualan. Data ini menjadi dasar laporan performa.',
    navHint: 'Batch',
    selector: '[data-tutorial="peternak-siklus"]',
  },
  breeding: {
    id: 'induk',
    icon: RefreshCw,
    title: 'Daftarkan Induk Ternak',
    desc: 'Mulai dengan mendaftarkan induk betina dan jantan. Catatan reproduksi, birahi, dan kelahiran akan terhubung ke masing-masing induk.',
    navHint: 'Ternak',
    selector: '[data-tutorial="peternak-siklus"]',
  },
  dairy: {
    id: 'induk',
    icon: RefreshCw,
    title: 'Daftarkan Induk & Produksi',
    desc: 'Daftarkan induk perah terlebih dahulu. Setiap hari catat hasil produksi susu per induk untuk analisa tren dan target penjualan.',
    navHint: 'Ternak',
    selector: '[data-tutorial="peternak-siklus"]',
  },
}

const STEP_KANDANG = {
  id: 'kandang',
  icon: Home,
  title: 'Buat Kandang Pertama',
  desc: 'Kandang adalah unit dasar operasional. Beri nama kandang, masukkan kapasitas, dan lokasi. Satu akun bisa punya banyak kandang.',
  navHint: 'Kandang',
  selector: '[data-tutorial="peternak-kandang"]',
}

const STEP_INPUT = {
  id: 'input',
  icon: ClipboardList,
  title: 'Input Harian — Kunci Akurasi',
  desc: 'Catat pakan harian, mortalitas, dan berat sampel setiap hari. Data ini otomatis menghitung FCR, IP Score, dan proyeksi panen.',
  navHint: 'Input Harian',
  selector: '[data-tutorial="peternak-input"]',
}

const STEP_LAPORAN = {
  id: 'laporan',
  icon: BarChart2,
  title: 'Pantau Laporan & Performa',
  desc: 'Lihat tren mortalitas, biaya per kg, dan komparasi antar kandang. Laporan bisa diekspor untuk rapat atau kemitraan.',
  navHint: 'Laporan',
  selector: '[data-tutorial="peternak-laporan"]',
}

const STEP_WELCOME = {
  id: 'welcome',
  icon: Sparkles,
  title: 'Selamat datang di TernakOS!',
  desc: 'Platform manajemen ternak lengkap — dari kandang, siklus produksi, hingga laporan keuangan, semua dalam satu tempat.',
  bullets: [
    'Pantau performa ternak real-time',
    'Input harian cepat & mudah',
    'Laporan otomatis siap cetak',
  ],
}

function buildSteps(group) {
  return [STEP_WELCOME, STEP_KANDANG, STEP3[group], STEP_INPUT, STEP_LAPORAN]
}

const POULTRY_TYPES = [
  'peternak_broiler', 'peternak_layer',
  'peternak_bebek_pedaging', 'peternak_bebek_layer',
]
const FATTENING_TYPES = [
  'peternak_domba_penggemukan', 'peternak_kambing_penggemukan',
  'peternak_sapi_penggemukan', 'peternak_babi_penggemukan',
]
const BREEDING_TYPES = [
  'peternak_domba_breeding', 'peternak_kambing_breeding',
  'peternak_sapi_breeding', 'peternak_babi_breeding',
]
const DAIRY_TYPES = ['peternak_kambing_perah', 'peternak_sapi_perah']

export function getTutorialSteps(subType) {
  if (POULTRY_TYPES.includes(subType)) return buildSteps('poultry')
  if (FATTENING_TYPES.includes(subType)) return buildSteps('fattening')
  if (BREEDING_TYPES.includes(subType)) return buildSteps('breeding')
  if (DAIRY_TYPES.includes(subType)) return buildSteps('dairy')
  return buildSteps('poultry')
}
