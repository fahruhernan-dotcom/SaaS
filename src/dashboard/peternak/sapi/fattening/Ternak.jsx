import { PenggemukanTernak } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useSapiBatches,
  useSapiAnimals,
  useSapiAnimalsByBatches,
  useAddSapiAnimal,
  useUpdateSapiAnimal,
  useBulkAddSapiAnimals,
  useAddSapiSale,
  useAddSapiWeightRecord,
} from '@/lib/hooks/useSapiPenggemukanData'

const BREED_SUGGESTIONS = [
  'Limousin', 'Simmental', 'Brahman', 'Ongole (PO)', 'Madura',
  'Bali', 'Angus', 'Hereford', 'Belgian Blue', 'Lainnya',
]

const SAPI_CONFIG = {
  BASE: '/peternak/peternak_sapi_penggemukan',
  animalLabel: 'Sapi',
  breedSuggestions: BREED_SUGGESTIONS,
  limitType: 'sapi',
  searchPlaceholder: 'Cari ear tag / ras sapi...',
  // useSapiAnimals / useSapiAnimalsByBatches return raw DB data without factory normalization
  weightRecordsKey: 'sapi_penggemukan_weight_records',
}

const SAPI_HOOKS = {
  useBatches: useSapiBatches,
  useAnimals: useSapiAnimals,
  useAnimalsByBatches: useSapiAnimalsByBatches,
  useAddAnimal: useAddSapiAnimal,
  useUpdateAnimal: useUpdateSapiAnimal,
  useBulkAddAnimals: useBulkAddSapiAnimals,
  useAddSale: useAddSapiSale,
  useAddWeightRecord: useAddSapiWeightRecord,
}

export default function SapiTernak() {
  return <PenggemukanTernak config={SAPI_CONFIG} hooks={SAPI_HOOKS} />
}
