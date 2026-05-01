import { PenggemukanDailyTask } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useKambingAnimals,
  useAddKambingWeightRecord,
  useKambingBatches,
  useKambingActiveBatches,
  useAddKambingHealthLog,
  useAddKambingFeedLog,
} from '@/lib/hooks/useKambingPenggemukanData'

const KAMBING_HOOKS = {
  useAnimals: useKambingAnimals,
  useAddWeight: useAddKambingWeightRecord,
  useBatches: useKambingBatches,
  useActiveBatches: useKambingActiveBatches,
  useAddHealth: useAddKambingHealthLog,
  useAddFeed: useAddKambingFeedLog,
  weightTable: 'kambing_weight_records',
}

export default function KambingDailyTask() {
  return <PenggemukanDailyTask livestockType="kambing_penggemukan" hooks={KAMBING_HOOKS} />
}
