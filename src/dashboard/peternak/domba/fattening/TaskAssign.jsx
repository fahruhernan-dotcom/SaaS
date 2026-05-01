import { PenggemukanTaskAssign } from '@/dashboard/peternak/_shared/components/penggemukan'

const CONFIG = {
  livestockType: 'domba_penggemukan',
  accentTheme: 'green',
  pageTitle: 'Board Penugasan',
}

export default function DombaTaskAssign() {
  return <PenggemukanTaskAssign config={CONFIG} />
}
