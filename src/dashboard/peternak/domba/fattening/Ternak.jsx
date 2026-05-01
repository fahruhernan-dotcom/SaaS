import { PenggemukanTernak } from '@/dashboard/peternak/_shared/components/penggemukan'
import {
  useDombaBatches,
  useDombaAnimals,
  useDombaAnimalsByBatches,
  useAddDombaAnimal,
  useUpdateDombaAnimal,
  useBulkAddDombaAnimals,
  useAddDombaSale,
  useAddDombaWeightRecord,
} from '@/lib/hooks/useDombaPenggemukanData'

const BREED_SUGGESTIONS = [
  'Garut', 'Priangan', 'Gembong', 'Texel', 'Dorper', 'Merino',
  'Ekor Gemuk (DEG)', 'Ekor Tipis (DET)', 'Sumbawa', 'Donggala',
  'Barros', 'Compass Agribisnis', 'Lainnya',
]

const DOMBA_CONFIG = {
  BASE: '/peternak/peternak_domba_penggemukan',
  animalLabel: 'Domba',
  breedSuggestions: BREED_SUGGESTIONS,
  limitType: 'domba_kambing',
  searchPlaceholder: 'Cari ear tag / ras domba...',
}

const DOMBA_HOOKS = {
  useBatches: useDombaBatches,
  useAnimals: useDombaAnimals,
  useAnimalsByBatches: useDombaAnimalsByBatches,
  useAddAnimal: useAddDombaAnimal,
  useUpdateAnimal: useUpdateDombaAnimal,
  useBulkAddAnimals: useBulkAddDombaAnimals,
  useAddSale: useAddDombaSale,
  useAddWeightRecord: useAddDombaWeightRecord,
}

export default function DombaTernak() {
  return <PenggemukanTernak config={DOMBA_CONFIG} hooks={DOMBA_HOOKS} />
}
