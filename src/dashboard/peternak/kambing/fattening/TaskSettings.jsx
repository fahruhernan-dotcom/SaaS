import { PenggemukanTaskSettings } from '@/dashboard/peternak/_shared/components/penggemukan'
import { useKambingBatches, useKambingActiveBatches } from '@/lib/hooks/useKambingPenggemukanData'

const KAMBING_CONFIG = {
  livestockType: 'kambing_penggemukan',
  accentTheme: 'green',
  pageTitle: 'Konfigurasi Tugas',
  pageSubtitle: 'Manajemen jadwal kerja rutin pekerja kandang kambing penggemukan.',
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

const KAMBING_HOOKS = {
  useBatches: useKambingBatches,
  useActiveBatches: useKambingActiveBatches,
  useApplyTemplate: null,
}

export default function KambingTaskSettings() {
  return <PenggemukanTaskSettings config={KAMBING_CONFIG} hooks={KAMBING_HOOKS} />
}
