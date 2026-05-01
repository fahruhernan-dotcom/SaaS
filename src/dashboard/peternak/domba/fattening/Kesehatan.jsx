import { PenggemukanKesehatan } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useDombaActiveBatches,
  useDombaHealthLogs,
  useDombaHealthLogsByBatches,
  useDombaAnimals,
  useDombaAnimalsByBatches,
  useAddDombaHealthLog,
  useDeleteDombaHealthLog,
} from '@/lib/hooks/useDombaPenggemukanData'

const DOMBA_CONFIG = {
  BASE: '/peternak/peternak_domba_penggemukan',
  pageTitle: 'Layanan Kesehatan Domba',
  animalLabel: 'Domba',
  hasMultiBatch: true,
  hasReferensi: true,
  vaccSchedule: null,
  logSchema: 'simple',
  animalInputType: 'select',
  logTypes: ['sakit', 'vaksinasi', 'pemeriksaan', 'insiden_pakan', 'insiden_kandang', 'insiden'],
  accentActiveClass: 'bg-green-600 border-green-500 text-white',
}

const DOMBA_HOOKS = {
  useActiveBatches: useDombaActiveBatches,
  useHealthLogs: useDombaHealthLogs,
  useHealthLogsByBatches: useDombaHealthLogsByBatches,
  useAnimals: useDombaAnimals,
  useAnimalsByBatches: useDombaAnimalsByBatches,
  useAddHealthLog: useAddDombaHealthLog,
  useDeleteHealthLog: useDeleteDombaHealthLog,
}

export default function DombaKesehatan() {
  return <PenggemukanKesehatan config={DOMBA_CONFIG} hooks={DOMBA_HOOKS} />
}
