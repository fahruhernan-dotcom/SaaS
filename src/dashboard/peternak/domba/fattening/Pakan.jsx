import { PenggemukanPakan } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useDombaActiveBatches,
  useDombaFeedLogs,
  useDombaFeedLogsByBatches,
  useAddDombaFeedLog,
  useDeleteDombaFeedLog,
  useDombaOperationalCosts,
  useDombaOperationalCostsByBatches,
  useAddDombaOperationalCost,
  useDeleteDombaOperationalCost,
} from '@/lib/hooks/useDombaPenggemukanData'

const DOMBA_CONFIG = {
  BASE: '/peternak/peternak_domba_penggemukan',
  pageTitle: 'Pakan & Biaya Operasional Domba',
  animalLabel: 'Domba',
  hasOperationalCosts: true,
  logSchema: 'standard',
  accentColorClass: 'bg-green-600 border-green-500 text-white',
  accentFocusClass: 'focus:border-green-500/50',
  buttonClass: 'bg-green-600 hover:bg-green-500',
}

const DOMBA_HOOKS = {
  useActiveBatches: useDombaActiveBatches,
  useFeedLogs: useDombaFeedLogs,
  useFeedLogsByBatches: useDombaFeedLogsByBatches,
  useAddFeedLog: useAddDombaFeedLog,
  useDeleteFeedLog: useDeleteDombaFeedLog,
  useOperationalCosts: useDombaOperationalCosts,
  useOperationalCostsByBatches: useDombaOperationalCostsByBatches,
  useAddOperationalCost: useAddDombaOperationalCost,
  useDeleteOperationalCost: useDeleteDombaOperationalCost,
}

export default function DombaPakan() {
  return <PenggemukanPakan config={DOMBA_CONFIG} hooks={DOMBA_HOOKS} />
}
