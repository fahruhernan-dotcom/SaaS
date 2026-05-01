import { PenggemukanBatch } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useSapiBatches,
  useCreateSapiBatch,
  useCloseSapiBatch,
  useSapiAnimals,
  useSapiSales,
  useSapiFeedLogs,
  useSapiOperationalCosts,
  calcSapiHariDiFarm,
  calcSapiMortalitas,
} from '@/lib/hooks/useSapiPenggemukanData'
import KandangMiniMap from './KandangMiniMap'

const SAPI_CONFIG = {
  BASE: '/peternak/peternak_sapi_penggemukan',
  animalLabel: 'Sapi',
  batchCodePrefix: 'SAPI',
  targetDays: 150,
  mortalityThreshold: 2,
  calcHariDiFarm: calcSapiHariDiFarm,
  calcMortalitas: calcSapiMortalitas,
}

const SAPI_HOOKS = {
  useBatches: useSapiBatches,
  useCreateBatch: useCreateSapiBatch,
  useCloseBatch: useCloseSapiBatch,
  useAnimals: useSapiAnimals,
  useSales: useSapiSales,
  useFeedLogs: useSapiFeedLogs,
  useOperationalCosts: useSapiOperationalCosts,
}

export default function SapiBatch() {
  return <PenggemukanBatch config={SAPI_CONFIG} hooks={SAPI_HOOKS} KandangMiniMap={KandangMiniMap} />
}
