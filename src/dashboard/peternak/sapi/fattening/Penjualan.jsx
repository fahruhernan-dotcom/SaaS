import { PenggemukanPenjualan } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useSapiBatches,
  useSapiAnimals,
  useSapiSales,
  useAddSapiSale,
  useUpdateSapiSale,
  useDeleteSapiSale,
  useSapiHppBatch,
  useSapiAnimalsByBatches,
  useSapiSalesByBatches,
} from '@/lib/hooks/useSapiPenggemukanData'

const SAPI_CONFIG = {
  BASE: '/peternak/peternak_sapi_penggemukan',
  animalLabel: 'Sapi',
  hasHpp: true,
  accentTheme: 'amber',
}

const SAPI_HOOKS = {
  useBatches: useSapiBatches,
  useSales: useSapiSales,
  useSalesByBatches: useSapiSalesByBatches,
  useAnimals: useSapiAnimals,
  useAnimalsByBatches: useSapiAnimalsByBatches,
  useAddSale: useAddSapiSale,
  useUpdateSale: useUpdateSapiSale,
  useDeleteSale: useDeleteSapiSale,
  useHppBatch: useSapiHppBatch,
}

export default function SapiPenjualan() {
  return <PenggemukanPenjualan config={SAPI_CONFIG} hooks={SAPI_HOOKS} />
}
