import { PenggemukanTaskSettings } from '@/dashboard/peternak/_shared/components/penggemukan'
import { TEMPLATE_150_HARI, TEMPLATE_180_HARI } from '@/lib/constants/sapiTaskTemplates'
import { useSapiBatches, useSapiActiveBatches } from '@/lib/hooks/useSapiPenggemukanData'
import { useApplySapiTaskTemplate } from '@/lib/hooks/usePeternakTaskData'

const SAPI_CONFIG = {
  livestockType: 'sapi_penggemukan',
  accentTheme: 'purple',
  pageTitle: 'Pengaturan Tugas',
  pageSubtitle: 'Kelola jadwal dan template tugas rutin untuk pekerja kandang.',
  defaultTaskType: 'pemberian_pakan',
  templatePackages: [
    {
      key: '150',
      label: 'Paket 150 Hari — Intensif',
      desc: 'Cocok untuk kandang tertutup dengan pakan konsentrat penuh.',
      stats: `ADG ~1 kg/hari • ${TEMPLATE_150_HARI.length} template`,
    },
    {
      key: '180',
      label: 'Paket 180 Hari — Semi-Intensif',
      desc: 'Cocok untuk sistem campuran hijauan + konsentrat.',
      stats: `ADG ~0.8 kg/hari • ${TEMPLATE_180_HARI.length} template`,
    },
  ],
}

const SAPI_HOOKS = {
  useBatches: useSapiBatches,
  useActiveBatches: useSapiActiveBatches,
  useApplyTemplate: useApplySapiTaskTemplate,
}

export default function SapiTaskSettings() {
  return <PenggemukanTaskSettings config={SAPI_CONFIG} hooks={SAPI_HOOKS} />
}
