import { PenggemukanBeranda } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useDombaActiveBatches, useDombaBatches, useDombaAnimalsByBatches,
  useDombaBatchWeightHistoryByBatches, useDombaBatchWeightHistory,
  useDombaFeedLogsByBatches, useDombaFeedLogs,
  useDombaOperationalCostsByBatches, useDombaOperationalCosts,
  useDombaSalesByBatches, useDombaSales,
  calcHariDiFarm, calcMortalitasDomba, calcADGFromRecords, calcADG,
} from '@/lib/hooks/useDombaPenggemukanData'
import KandangMiniMap from './KandangMiniMap'

const DOMBA_CONFIG = {
  animalLabel: 'Domba',
  businessLabel: 'Fattening Domba',
  livestockType: 'domba_penggemukan',
  targetDays: 90,
  adgGood: 150,
  adgOk: 100,
  mortalityThreshold: 3,
  mortalityWarn: 1.5,
  animalEmoji: '🐏',
  chartColors: ['#22C55E', '#10B981', '#14B8A6', '#4ADE80', '#06B6D4', '#16A34A', '#84CC16', '#A3E635', '#2DD4BF', '#22D3EE'],
  BASE: '/peternak/peternak_domba_penggemukan',
  calcHariDiFarm,
  calcMortalitas: calcMortalitasDomba,
  calcADGFromRecords,
  calcADG,
}

const DOMBA_HOOKS = {
  useActiveBatches: useDombaActiveBatches,
  useBatches: useDombaBatches,
  useAnimalsByBatches: useDombaAnimalsByBatches,
  useBatchWeightHistoryByBatches: useDombaBatchWeightHistoryByBatches,
  useBatchWeightHistory: useDombaBatchWeightHistory,
  useFeedLogsByBatches: useDombaFeedLogsByBatches,
  useFeedLogs: useDombaFeedLogs,
  useOperationalCostsByBatches: useDombaOperationalCostsByBatches,
  useOperationalCosts: useDombaOperationalCosts,
  useSalesByBatches: useDombaSalesByBatches,
  useSales: useDombaSales,
}

export default function DombaPenggemukanBeranda() {
  return <PenggemukanBeranda config={DOMBA_CONFIG} hooks={DOMBA_HOOKS} KandangMiniMap={KandangMiniMap} />
}
