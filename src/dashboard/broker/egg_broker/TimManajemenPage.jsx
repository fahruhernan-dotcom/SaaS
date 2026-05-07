import { Users } from 'lucide-react'
import ManajemenPage from '@/dashboard/_shared/pages/tim/ManajemenPage'
import { BROKER_TELUR_TIM_CONFIG } from '@/dashboard/_shared/pages/tim/timConfigs'
import BrokerKaryawanPage from '@/dashboard/broker/_shared/components/BrokerKaryawanPage'

const TELUR_ROLES = ['admin', 'sales', 'gudang', 'kurir']

function TelurKaryawan(props) {
  return (
    <BrokerKaryawanPage
      {...props}
      accentColor={BROKER_TELUR_TIM_CONFIG.accent}
      roles={TELUR_ROLES}
    />
  )
}

export default function TelurTimManajemenPage() {
  return (
    <ManajemenPage
      roleConfig={BROKER_TELUR_TIM_CONFIG}
      workerTab={{ id: 'karyawan', label: 'Karyawan', icon: Users, component: TelurKaryawan }}
    />
  )
}
