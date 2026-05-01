import { PenggemukanTernak } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useKambingBatches,
  useKambingAnimals,
  useKambingAnimalsByBatches,
  useAddKambingAnimal,
  useUpdateKambingAnimal,
  useBulkAddKambingAnimals,
  useAddKambingSale,
  useAddKambingWeightRecord,
} from '@/lib/hooks/useKambingPenggemukanData'

const BREED_SUGGESTIONS = [
  'Kacang', 'Peranakan Etawah (PE)', 'Jawarandu', 'Senduro', 'Boer',
  'Saanen', 'Anglo Nubian', 'Gembrong', 'Muara', 'Lainnya',
]

const KAMBING_CONFIG = {
  BASE: '/peternak/peternak_kambing_penggemukan',
  animalLabel: 'Kambing',
  breedSuggestions: BREED_SUGGESTIONS,
  limitType: 'domba_kambing',
  searchPlaceholder: 'Cari ear tag / ras kambing...',
}

const KAMBING_HOOKS = {
  useBatches: useKambingBatches,
  useAnimals: useKambingAnimals,
  useAnimalsByBatches: useKambingAnimalsByBatches,
  useAddAnimal: useAddKambingAnimal,
  useUpdateAnimal: useUpdateKambingAnimal,
  useBulkAddAnimals: useBulkAddKambingAnimals,
  useAddSale: useAddKambingSale,
  useAddWeightRecord: useAddKambingWeightRecord,
}

export default function KambingTernak() {
  return <PenggemukanTernak config={KAMBING_CONFIG} hooks={KAMBING_HOOKS} />
}
