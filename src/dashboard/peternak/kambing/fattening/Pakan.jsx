import { PenggemukanPakan } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useKambingActiveBatches,
  useKambingFeedLogs,
  useKambingFeedLogsByBatches,
  useAddKambingFeedLog,
  useDeleteKambingFeedLog,
  useKambingOperationalCosts,
  useKambingOperationalCostsByBatches,
  useAddKambingOperationalCost,
  useDeleteKambingOperationalCost,
} from '@/lib/hooks/useKambingPenggemukanData'

const KAMBING_CONFIG = {
  BASE: '/peternak/peternak_kambing_penggemukan',
  pageTitle: 'Pakan & Biaya Operasional Kambing',
  animalLabel: 'Kambing',
  hasOperationalCosts: true,
  logSchema: 'standard',
  accentColorClass: 'bg-green-600 border-green-500 text-white',
  accentFocusClass: 'focus:border-green-500/50',
  buttonClass: 'bg-green-600 hover:bg-green-500',
}

const KAMBING_HOOKS = {
  useActiveBatches: useKambingActiveBatches,
  useFeedLogs: useKambingFeedLogs,
  useFeedLogsByBatches: useKambingFeedLogsByBatches,
  useAddFeedLog: useAddKambingFeedLog,
  useDeleteFeedLog: useDeleteKambingFeedLog,
  useOperationalCosts: useKambingOperationalCosts,
  useOperationalCostsByBatches: useKambingOperationalCostsByBatches,
  useAddOperationalCost: useAddKambingOperationalCost,
  useDeleteOperationalCost: useDeleteKambingOperationalCost,
}

export default function KambingPakan() {
  return <PenggemukanPakan config={KAMBING_CONFIG} hooks={KAMBING_HOOKS} />
}
