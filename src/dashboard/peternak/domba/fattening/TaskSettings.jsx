import { PenggemukanTaskSettings } from '@/dashboard/peternak/_shared/components/penggemukan'
import { useDombaBatches, useDombaActiveBatches } from '@/lib/hooks/useDombaPenggemukanData'
import { useApplyDombaTaskTemplate } from '@/lib/hooks/usePeternakTaskData'

const DOMBA_CONFIG = {
  livestockType: 'domba_penggemukan',
  accentTheme: 'green',
  pageTitle: 'Konfigurasi Tugas',
  pageSubtitle: 'Manajemen jadwal kerja rutin pekerja kandang domba penggemukan.',
  defaultTaskType: 'pakan',
  templatePackages: [
    {
      key: '90',
      label: 'Penggemukan Intensif (90 Hari)',
      desc: 'Jadwal otomatis pemberian pakan 2x/hari, penimbangan rutin mingguan, dan pemantauan kesehatan berkala.',
      stats: null,
    },
  ],
}

const DOMBA_HOOKS = {
  useBatches: useDombaBatches,
  useActiveBatches: useDombaActiveBatches,
  useApplyTemplate: useApplyDombaTaskTemplate,
}

export default function DombaTaskSettings() {
  return <PenggemukanTaskSettings config={DOMBA_CONFIG} hooks={DOMBA_HOOKS} />
}
