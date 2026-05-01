import { PenggemukanTaskAssign } from '@/dashboard/peternak/_shared/components/penggemukan'

const CONFIG = {
  livestockType: 'sapi_penggemukan',
  accentTheme: 'purple',
  pageTitle: 'Board Penugasan',
}

export default function SapiTaskAssign() {
  return <PenggemukanTaskAssign config={CONFIG} />
}
