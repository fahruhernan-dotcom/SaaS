import { PenggemukanQuickAdd } from '@/dashboard/peternak/_shared/components/penggemukan'

const SAPI_CONFIG = {
  basePath: '/peternak/peternak_sapi_penggemukan',
  iconBg:   'bg-amber-500/10',
  iconText: 'text-amber-500',
}

export default function SapiQuickAdd() {
  return <PenggemukanQuickAdd config={SAPI_CONFIG} />
}
