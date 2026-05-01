import { PenggemukanBeranda } from '@/dashboard/peternak/_shared/components/penggemukan'
import KandangMiniMap from './KandangMiniMap'
import {
  useKambingActiveBatches, useKambingBatches, useKambingAnimalsByBatches,
  useKambingBatchWeightHistoryByBatches, useKambingBatchWeightHistory,
  useKambingFeedLogsByBatches, useKambingFeedLogs,
  useKambingOperationalCostsByBatches, useKambingOperationalCosts,
  useKambingSalesByBatches, useKambingSales,
  calcHariDiFarm, calcADG, calcADGFromRecords, calcMortalitasKambing,
} from '@/lib/hooks/useKambingPenggemukanData'

const KAMBING_CONFIG = {
  animalLabel: 'Kambing',
  businessLabel: 'Fattening Kambing',
  livestockType: 'kambing_penggemukan',
  targetDays: 90,
  adgGood: 100,
  adgOk: 70,
  mortalityThreshold: 3,
  mortalityWarn: 1.5,
  animalEmoji: '🐐',
  chartColors: ['#A78BFA', '#7C3AED', '#8B5CF6', '#C4B5FD', '#6D28D9', '#DDD6FE', '#F59E0B', '#FCD34D', '#34D399', '#10B981'],
  BASE: '/peternak/peternak_kambing_penggemukan',
  calcHariDiFarm,
  calcMortalitas: calcMortalitasKambing,
  calcADGFromRecords,
  calcADG,
}

const KAMBING_HOOKS = {
  useActiveBatches: useKambingActiveBatches,
  useBatches: useKambingBatches,
  useAnimalsByBatches: useKambingAnimalsByBatches,
  useBatchWeightHistoryByBatches: useKambingBatchWeightHistoryByBatches,
  useBatchWeightHistory: useKambingBatchWeightHistory,
  useFeedLogsByBatches: useKambingFeedLogsByBatches,
  useFeedLogs: useKambingFeedLogs,
  useOperationalCostsByBatches: useKambingOperationalCostsByBatches,
  useOperationalCosts: useKambingOperationalCosts,
  useSalesByBatches: useKambingSalesByBatches,
  useSales: useKambingSales,
}

export default function KambingPenggemukanBeranda() {
  return <PenggemukanBeranda config={KAMBING_CONFIG} hooks={KAMBING_HOOKS} KandangMiniMap={KandangMiniMap} />
}
