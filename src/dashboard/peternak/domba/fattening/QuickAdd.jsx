import { PenggemukanQuickAdd } from '@/dashboard/peternak/_shared/components/penggemukan'

const DOMBA_CONFIG = {
  basePath: '/peternak/peternak_domba_penggemukan',
  iconBg:   'bg-emerald-500/10',
  iconText: 'text-emerald-500',
}

export default function DombaQuickAdd() {
  return <PenggemukanQuickAdd config={DOMBA_CONFIG} />
}
