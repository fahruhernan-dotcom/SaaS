import { Users } from 'lucide-react'
import ManajemenPage from '@/dashboard/_shared/pages/tim/ManajemenPage'
import { BROKER_POULTRY_TIM_CONFIG } from '@/dashboard/_shared/pages/tim/timConfigs'
import BrokerKaryawanPage from '@/dashboard/broker/_shared/components/BrokerKaryawanPage'

const POULTRY_ROLES = ['manajer', 'sales', 'supir', 'staff', 'gudang']

function PoultryKaryawan(props) {
  return (
    <BrokerKaryawanPage
      {...props}
      accentColor={BROKER_POULTRY_TIM_CONFIG.accent}
      roles={POULTRY_ROLES}
    />
  )
}

export default function PoultryTimManajemenPage() {
  return (
    <ManajemenPage
      roleConfig={BROKER_POULTRY_TIM_CONFIG}
      workerTab={{ id: 'karyawan', label: 'Karyawan', icon: Users, component: PoultryKaryawan }}
    />
  )
}
