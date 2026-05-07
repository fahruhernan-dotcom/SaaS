import { Users } from 'lucide-react'
import ManajemenPage from '@/dashboard/_shared/pages/tim/ManajemenPage'
import { PETERNAK_TIM_CONFIG } from '@/dashboard/_shared/pages/tim/timConfigs'
import AnakKandangPage from '../../components/anak-kandang/AnakKandangPage'
import { useLocation } from 'react-router-dom'

const SUPPORTS_ANAK_KANDANG = ['domba', 'kambing', 'sapi']

export default function TimManajemenPage() {
  const location = useLocation()
  const hasAnakKandang = SUPPORTS_ANAK_KANDANG.some(t => location.pathname.includes(t))

  const workerTab = hasAnakKandang
    ? { id: 'anak-kandang', label: 'Anak Kandang', icon: Users, component: AnakKandangPage }
    : null

  return <ManajemenPage roleConfig={PETERNAK_TIM_CONFIG} workerTab={workerTab} />
}
