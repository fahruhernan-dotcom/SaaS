import { PenggemukanKesehatan } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useSapiActiveBatches,
  useSapiHealthLogs,
  useSapiAnimals,
  useAddSapiHealthLog,
  useDeleteSapiHealthLog,
} from '@/lib/hooks/useSapiPenggemukanData'

const SAPI_CONFIG = {
  BASE: '/peternak/peternak_sapi_penggemukan',
  pageTitle: 'Layanan Kesehatan Sapi',
  animalLabel: 'Sapi',
  hasMultiBatch: false,
  hasReferensi: false,
  vaccSchedule: null,
  logSchema: 'simple',
  animalInputType: 'select',
  logTypes: ['sakit', 'vaksinasi', 'pemeriksaan', 'insiden_pakan', 'insiden_kandang', 'insiden'],
  accentActiveClass: 'bg-amber-500 border-amber-400 text-[#06090F]',
}

const SAPI_HOOKS = {
  useActiveBatches: useSapiActiveBatches,
  useHealthLogs: useSapiHealthLogs,
  useHealthLogsByBatches: null,
  useAnimals: useSapiAnimals,
  useAnimalsByBatches: null,
  useAddHealthLog: useAddSapiHealthLog,
  useDeleteHealthLog: useDeleteSapiHealthLog,
}

export default function SapiKesehatan() {
  return <PenggemukanKesehatan config={SAPI_CONFIG} hooks={SAPI_HOOKS} />
}
