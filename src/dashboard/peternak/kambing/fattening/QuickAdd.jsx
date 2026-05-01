import { PenggemukanQuickAdd } from '@/dashboard/peternak/_shared/components/penggemukan'

const KAMBING_CONFIG = {
  basePath: '/peternak/peternak_kambing_penggemukan',
  iconBg:   'bg-green-500/10',
  iconText: 'text-green-500',
}

export default function KambingQuickAdd() {
  return <PenggemukanQuickAdd config={KAMBING_CONFIG} />
}
