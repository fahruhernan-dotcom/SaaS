import { PenggemukanTaskAssign } from '@/dashboard/peternak/_shared/components/penggemukan'

const CONFIG = {
  livestockType: 'kambing_penggemukan',
  accentTheme: 'green',
  pageTitle: 'Board Penugasan',
}

export default function KambingTaskAssign() {
  return <PenggemukanTaskAssign config={CONFIG} />
}
