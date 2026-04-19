import { createBreedingHooks } from './createBreedingHooks'

/**
 * TernakOS — Kambing Breeding Data Hooks
 * 
 * Generated via hook factory: createBreedingHooks('kambing')
 * Tables: kambing_breeding_animals, kambing_breeding_mating_records, etc.
 */

// Re-export KPI calculators
export {
  calcBreedingADG,
  calcConceptionRate,
  calcLambingRate,
  calcLambingRate as calcKiddingRate,
  calcWeaningRate,
  calcLitterSize,
  calcLambingIntervalBulan,
  calcLambingIntervalBulan as calcKiddingIntervalBulan,
  calcMortalitasAnakPreSapih,
  calcBreedingRCRatio,
  calcAgeInDays,
} from './useKdBreedingData'

const hooks = createBreedingHooks('kambing')

// Queries
export const useKambingBreedingAnimals       = hooks.useAnimals
export const useKambingBreedingAnimalWeights = hooks.useAnimalWeights
export const useKambingBreedingMatings       = hooks.useMatings
export const useKambingBreedingBirths        = hooks.useBirths
export const useKambingBreedingHealthLogs    = hooks.useHealthLogs
export const useKambingBreedingFeedLogs      = hooks.useFeedLogs
export const useKambingBreedingSales         = hooks.useSales

// Mutations
export const useAddKambingBreedingAnimal     = hooks.useAddAnimal
export const useUpdateKambingBreedingAnimal  = hooks.useUpdateAnimal
export const useAddKambingBreedingWeight     = hooks.useAddWeight
export const useAddKambingBreedingMating     = hooks.useAddMating
export const useUpdateKambingBreedingMating  = hooks.useUpdateMating
export const useAddKambingBreedingBirth      = hooks.useAddBirth
export const useAddKambingBreedingHealthLog  = hooks.useAddHealthLog
export const useAddKambingBreedingFeedLog    = hooks.useAddFeedLog
export const useAddKambingBreedingSale       = hooks.useAddSale
