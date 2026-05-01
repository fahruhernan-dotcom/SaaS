import { PenggemukanBeranda } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useSapiActiveBatches, useSapiBatches, useSapiAnimalsByBatches,
  useSapiBatchWeightHistoryByBatches, useSapiWeightHistory,
  useSapiFeedLogsByBatches, useSapiFeedLogs,
  useSapiOperationalCostsByBatches, useSapiOperationalCosts,
  useSapiSalesByBatches, useSapiSales,
  calcSapiHariDiFarm, calcSapiMortalitas, calcSapiADGFromRecords, calcSapiADG,
} from '@/lib/hooks/useSapiPenggemukanData'
import KandangMiniMap from './KandangMiniMap'

const SAPI_CONFIG = {
  animalLabel: 'Sapi',
  businessLabel: 'Fattening Sapi',
  livestockType: 'sapi_penggemukan',
  targetDays: 150,
  adgGood: 800,
  adgOk: 600,
  mortalityThreshold: 2,
  mortalityWarn: 1,
  animalEmoji: '🐄',
  chartColors: ['#F59E0B', '#D97706', '#FCD34D', '#FBBF24', '#B45309', '#10B981', '#34D399', '#60A5FA', '#A78BFA', '#F472B6'],
  BASE: '/peternak/peternak_sapi_penggemukan',
  calcHariDiFarm: calcSapiHariDiFarm,
  calcMortalitas: calcSapiMortalitas,
  calcADGFromRecords: calcSapiADGFromRecords,
  calcADG: calcSapiADG,
}

const SAPI_HOOKS = {
  useActiveBatches: useSapiActiveBatches,
  useBatches: useSapiBatches,
  useAnimalsByBatches: useSapiAnimalsByBatches,
  useBatchWeightHistoryByBatches: useSapiBatchWeightHistoryByBatches,
  useBatchWeightHistory: useSapiWeightHistory,
  useFeedLogsByBatches: useSapiFeedLogsByBatches,
  useFeedLogs: useSapiFeedLogs,
  useOperationalCostsByBatches: useSapiOperationalCostsByBatches,
  useOperationalCosts: useSapiOperationalCosts,
  useSalesByBatches: useSapiSalesByBatches,
  useSales: useSapiSales,
}

export default function SapiBeranda() {
  return <PenggemukanBeranda config={SAPI_CONFIG} hooks={SAPI_HOOKS} KandangMiniMap={KandangMiniMap} />
}
