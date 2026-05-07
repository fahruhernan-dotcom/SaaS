import ManajemenPage from '@/dashboard/_shared/pages/tim/ManajemenPage'
import { RPA_TIM_CONFIG } from '@/dashboard/_shared/pages/tim/timConfigs'

/**
 * RPA TimManajemenPage
 * Placeholder — belum ada tab "Pegawai" untuk RPA.
 * Ketika modul HR RPA dibuat, inject workerTab di sini.
 */
export default function RPATimManajemenPage() {
  return <ManajemenPage roleConfig={RPA_TIM_CONFIG} />
}
