import LaporanBatchPage from '../../_shared/components/laporan/LaporanBatchPage'
import {
  useDombaBatches,
  useDombaAnimalsByBatches,
  useDombaSalesByBatches,
  useDombaFeedLogsByBatches,
  useDombaHealthLogsByBatches,
  useDombaOperationalCostsByBatches,
  useDombaBatchWeightHistoryByBatches,
  calcHariDiFarm,
} from '@/lib/hooks/useDombaPenggemukanData'

const HOOKS = {
  useBatches:                    useDombaBatches,
  useAnimalsByBatches:           useDombaAnimalsByBatches,
  useSalesByBatches:             useDombaSalesByBatches,
  useFeedLogsByBatches:          useDombaFeedLogsByBatches,
  useHealthLogsByBatches:        useDombaHealthLogsByBatches,
  useOperationalCostsByBatches:  useDombaOperationalCostsByBatches,
  useBatchWeightHistoryByBatches: useDombaBatchWeightHistoryByBatches,
  calcHariDiFarm,
}

export default function DombaLaporanBatch() {
  return (
    <LaporanBatchPage
      livestockLabel="DOMBA"
      livestockType="domba_penggemukan"
      BASE="/peternak/peternak_domba_penggemukan"
      adgBenchmark="≥150 g/hari"
      mortalitasBenchmark="≤3%"
      hooks={HOOKS}
    />
  )
}
