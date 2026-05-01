import { PenggemukanBatch } from '@/dashboard/peternak/_shared/components/penggemukan'
import KandangMiniMap from './KandangMiniMap'
import {
  useKambingBatches,
  useCreateKambingBatch,
  useCloseKambingBatch,
  useKambingAnimals,
  useKambingSales,
  useKambingFeedLogs,
  useKambingOperationalCosts,
  calcHariDiFarm,
  calcMortalitasKambing,
} from '@/lib/hooks/useKambingPenggemukanData'

const KAMBING_CONFIG = {
  BASE: '/peternak/peternak_kambing_penggemukan',
  animalLabel: 'Kambing',
  batchCodePrefix: 'KAMBING',
  targetDays: 90,
  mortalityThreshold: 3,
  calcHariDiFarm,
  calcMortalitas: calcMortalitasKambing,
}

const KAMBING_HOOKS = {
  useBatches: useKambingBatches,
  useCreateBatch: useCreateKambingBatch,
  useCloseBatch: useCloseKambingBatch,
  useAnimals: useKambingAnimals,
  useSales: useKambingSales,
  useFeedLogs: useKambingFeedLogs,
  useOperationalCosts: useKambingOperationalCosts,
}

export default function KambingBatch() {
  return <PenggemukanBatch config={KAMBING_CONFIG} hooks={KAMBING_HOOKS} KandangMiniMap={KandangMiniMap} />
}
