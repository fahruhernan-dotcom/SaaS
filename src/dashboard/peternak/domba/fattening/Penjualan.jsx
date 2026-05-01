import { PenggemukanPenjualan } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useDombaBatches,
  useDombaAnimals,
  useDombaSales,
  useAddDombaSale,
  useUpdateDombaSale,
  useDeleteDombaSale,
  useDombaHppBatch,
  useDombaAnimalsByBatches,
  useDombaSalesByBatches,
} from '@/lib/hooks/useDombaPenggemukanData'

const DOMBA_CONFIG = {
  BASE: '/peternak/peternak_domba_penggemukan',
  animalLabel: 'Domba',
  hasHpp: true,
  accentTheme: 'green',
}

const DOMBA_HOOKS = {
  useBatches: useDombaBatches,
  useSales: useDombaSales,
  useSalesByBatches: useDombaSalesByBatches,
  useAnimals: useDombaAnimals,
  useAnimalsByBatches: useDombaAnimalsByBatches,
  useAddSale: useAddDombaSale,
  useUpdateSale: useUpdateDombaSale,
  useDeleteSale: useDeleteDombaSale,
  useHppBatch: useDombaHppBatch,
}

export default function DombaPenjualan() {
  return <PenggemukanPenjualan config={DOMBA_CONFIG} hooks={DOMBA_HOOKS} />
}
