import { PenggemukanDailyTask } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useSapiAnimals,
  useAddSapiWeightRecord,
  useSapiBatches,
  useSapiActiveBatches,
  useAddSapiHealthLog,
  useAddSapiFeedLog,
} from '@/lib/hooks/useSapiPenggemukanData'

const SAPI_HOOKS = {
  useAnimals: useSapiAnimals,
  useAddWeight: useAddSapiWeightRecord,
  useBatches: useSapiBatches,
  useActiveBatches: useSapiActiveBatches,
  useAddHealth: useAddSapiHealthLog,
  useAddFeed: useAddSapiFeedLog,
  weightTable: 'sapi_weight_records',
}

export default function SapiDailyTask() {
  return <PenggemukanDailyTask livestockType="sapi_penggemukan" hooks={SAPI_HOOKS} />
}
