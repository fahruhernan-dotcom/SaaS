import { PenggemukanBatch } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useDombaBatches,
  useCreateDombaBatch,
  useCloseDombaBatch,
  useDombaAnimals,
  useDombaSales,
  useDombaFeedLogs,
  useDombaOperationalCosts,
  calcHariDiFarm,
  calcMortalitasDomba,
} from '@/lib/hooks/useDombaPenggemukanData'
import KandangMiniMap from './KandangMiniMap'

const DOMBA_CONFIG = {
  BASE: '/peternak/peternak_domba_penggemukan',
  animalLabel: 'Domba',
  batchCodePrefix: 'DOMBA',
  targetDays: 90,
  mortalityThreshold: 3,
  calcHariDiFarm,
  calcMortalitas: calcMortalitasDomba,
}

const DOMBA_HOOKS = {
  useBatches: useDombaBatches,
  useCreateBatch: useCreateDombaBatch,
  useCloseBatch: useCloseDombaBatch,
  useAnimals: useDombaAnimals,
  useSales: useDombaSales,
  useFeedLogs: useDombaFeedLogs,
  useOperationalCosts: useDombaOperationalCosts,
}

export default function DombaBatch() {
  return <PenggemukanBatch config={DOMBA_CONFIG} hooks={DOMBA_HOOKS} KandangMiniMap={KandangMiniMap} />
}
