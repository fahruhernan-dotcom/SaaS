import LaporanBatchPage from '@/dashboard/peternak/_shared/components/laporan/LaporanBatchPage'
import {
  useSapiBatches,
  useSapiAnimalsByBatches,
  useSapiSalesByBatches,
  useSapiFeedLogsByBatches,
  useSapiOperationalCostsByBatches,
  useSapiBatchWeightHistoryByBatches,
  calcSapiHariDiFarm,
} from '@/lib/hooks/useSapiPenggemukanData'

// Sapi doesn't have a health-logs-by-batches hook yet
const emptyHealthLogs = () => ({ data: [], isLoading: false })

const HOOKS = {
  useBatches:                     useSapiBatches,
  useAnimalsByBatches:            useSapiAnimalsByBatches,
  useSalesByBatches:              useSapiSalesByBatches,
  useFeedLogsByBatches:           useSapiFeedLogsByBatches,
  useHealthLogsByBatches:         emptyHealthLogs,
  useOperationalCostsByBatches:   useSapiOperationalCostsByBatches,
  useBatchWeightHistoryByBatches: useSapiBatchWeightHistoryByBatches,
  calcHariDiFarm:                 calcSapiHariDiFarm,
}

export default function SapiLaporanBatch() {
  return (
    <LaporanBatchPage
      livestockLabel="SAPI"
      livestockType="sapi_penggemukan"
      BASE="/peternak/peternak_sapi_penggemukan"
      adgBenchmark="≥0.8 kg/hari"
      mortalitasBenchmark="≤2%"
      hooks={HOOKS}
    />
  )
}
