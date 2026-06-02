import { PenggemukanKesehatan } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useKambingActiveBatches,
  useKambingHealthLogs,
  useKambingHealthLogsByBatches,
  useKambingAnimals,
  useKambingAnimalsByBatches,
  useAddKambingHealthLog,
  useDeleteKambingHealthLog,
} from '@/lib/hooks/useKambingPenggemukanData'

const VACC_SCHEDULE = [
  { name: 'Obat Cacing (Masuk)',       interval: 'Saat masuk' },
  { name: 'Vaksin PMK',               interval: 'Saat masuk & H-90' },
  { name: 'Vaksin Clostridial (CDT)', interval: 'Saat masuk & H-90' },
  { name: 'Obat Cacing Rutin',        interval: 'H-30, H-60 (jika siklus panjang)' },
  { name: 'Vaksin Anthrax',           interval: 'Daerah endemik — awal kemarau' },
]

const KAMBING_CONFIG = {
  BASE: '/peternak/peternak_kambing_penggemukan',
  pageTitle: 'Kesehatan & Vaksinasi Kambing',
  animalLabel: 'Kambing',
  hasMultiBatch: true,
  hasReferensi: false,
  vaccSchedule: VACC_SCHEDULE,
  logSchema: 'extended',
  animalInputType: 'select',
  logTypes: ['sakit', 'vaksinasi', 'obat_cacing', 'kematian', 'lainnya'],
  defaultLogType: 'sakit',
  accentActiveClass: 'bg-green-600 border-green-500 text-white',
}

const KAMBING_HOOKS = {
  useActiveBatches: useKambingActiveBatches,
  useHealthLogs: useKambingHealthLogs,
  useHealthLogsByBatches: useKambingHealthLogsByBatches,
  useAnimals: useKambingAnimals,
  useAnimalsByBatches: useKambingAnimalsByBatches,
  useAddHealthLog: useAddKambingHealthLog,
  useDeleteHealthLog: useDeleteKambingHealthLog,
}

export default function KambingKesehatan() {
  return <PenggemukanKesehatan config={KAMBING_CONFIG} hooks={KAMBING_HOOKS} />
}
