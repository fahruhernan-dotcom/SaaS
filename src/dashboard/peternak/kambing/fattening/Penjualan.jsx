import { PenggemukanPenjualan } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useKambingBatches,
  useKambingAnimals,
  useKambingSales,
  useAddKambingSale,
  useUpdateKambingSale,
  useDeleteKambingSale,
  useKambingHppBatch,
  useKambingAnimalsByBatches,
  useKambingSalesByBatches,
} from '@/lib/hooks/useKambingPenggemukanData'

const KAMBING_CONFIG = {
  BASE: '/peternak/peternak_kambing_penggemukan',
  animalLabel: 'Kambing',
  hasHpp: true,
  accentTheme: 'green',
}

const KAMBING_HOOKS = {
  useBatches: useKambingBatches,
  useSales: useKambingSales,
  useSalesByBatches: useKambingSalesByBatches,
  useAnimals: useKambingAnimals,
  useAnimalsByBatches: useKambingAnimalsByBatches,
  useAddSale: useAddKambingSale,
  useUpdateSale: useUpdateKambingSale,
  useDeleteSale: useDeleteKambingSale,
  useHppBatch: useKambingHppBatch,
}

export default function KambingPenjualan() {
  return <PenggemukanPenjualan config={KAMBING_CONFIG} hooks={KAMBING_HOOKS} />
}
