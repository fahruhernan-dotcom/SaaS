import LaporanBatchPage from '@/dashboard/peternak/_shared/components/laporan/LaporanBatchPage'
import {
  useKambingBatches,
  useKambingAnimalsByBatches,
  useKambingSalesByBatches,
  useKambingFeedLogsByBatches,
  useKambingHealthLogsByBatches,
  useKambingOperationalCostsByBatches,
  useKambingBatchWeightHistoryByBatches,
  calcHariDiFarm,
} from '@/lib/hooks/useKambingPenggemukanData'

const HOOKS = {
  useBatches:                     useKambingBatches,
  useAnimalsByBatches:            useKambingAnimalsByBatches,
  useSalesByBatches:              useKambingSalesByBatches,
  useFeedLogsByBatches:           useKambingFeedLogsByBatches,
  useHealthLogsByBatches:         useKambingHealthLogsByBatches,
  useOperationalCostsByBatches:   useKambingOperationalCostsByBatches,
  useBatchWeightHistoryByBatches: useKambingBatchWeightHistoryByBatches,
  calcHariDiFarm,
}

export default function KambingLaporanBatch() {
  return (
    <LaporanBatchPage
      livestockLabel="KAMBING"
      livestockType="kambing_penggemukan"
      BASE="/peternak/peternak_kambing_penggemukan"
      adgBenchmark="≥100 g/hari"
      mortalitasBenchmark="≤3%"
      hooks={HOOKS}
    />
  )
}
