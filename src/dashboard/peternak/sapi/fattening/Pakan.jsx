import { PenggemukanPakan } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useSapiActiveBatches,
  useSapiFeedLogs,
  useSapiFeedLogsByBatches,
  useAddSapiFeedLog,
  useDeleteSapiFeedLog,
} from '@/lib/hooks/useSapiPenggemukanData'

const SAPI_CONFIG = {
  BASE: '/peternak/peternak_sapi_penggemukan',
  pageTitle: 'Pakan Sapi',
  animalLabel: 'Sapi',
  hasOperationalCosts: false,
  logSchema: 'standard',
  accentColorClass: 'bg-amber-500 border-amber-400 text-[#06090F]',
  accentFocusClass: 'focus:border-amber-500/50',
  buttonClass: 'bg-amber-500 hover:bg-amber-400',
}

const SAPI_HOOKS = {
  useActiveBatches: useSapiActiveBatches,
  useFeedLogs: useSapiFeedLogs,
  useFeedLogsByBatches: useSapiFeedLogsByBatches,
  useAddFeedLog: useAddSapiFeedLog,
  useDeleteFeedLog: useDeleteSapiFeedLog,
}

export default function SapiPakan() {
  return <PenggemukanPakan config={SAPI_CONFIG} hooks={SAPI_HOOKS} />
}
