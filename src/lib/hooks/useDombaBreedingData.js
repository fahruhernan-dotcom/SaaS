/**
 * TernakOS — Domba Breeding Data Hooks
 * 
 * Generated via hook factory: createBreedingHooks('domba')
 * Tables: domba_breeding_animals, domba_breeding_mating_records, etc.
 */

import { createBreedingHooks } from './createBreedingHooks'

// Re-export KPI calculators (pure functions)
export {
  calcBreedingADG,
  calcConceptionRate,
  calcLambingRate,
  calcWeaningRate,
  calcLitterSize,
  calcLambingIntervalBulan,
  calcMortalitasAnakPreSapih,
  calcBreedingRCRatio,
  calcAgeInDays,
} from './useKdBreedingData'

// ── Generate hooks from factory ──────────────────────────────────────────────

const hooks = createBreedingHooks('domba')

// Queries
export const useDombaBreedingAnimals       = hooks.useAnimals
export const useDombaBreedingAnimalWeights = hooks.useAnimalWeights
export const useDombaBreedingMatings       = hooks.useMatings
export const useDombaBreedingBirths        = hooks.useBirths
export const useDombaBreedingHealthLogs    = hooks.useHealthLogs
export const useDombaBreedingFeedLogs      = hooks.useFeedLogs
export const useDombaBreedingSales         = hooks.useSales

// Mutations
export const useAddDombaBreedingAnimal     = hooks.useAddAnimal
export const useUpdateDombaBreedingAnimal  = hooks.useUpdateAnimal
export const useAddDombaBreedingWeight     = hooks.useAddWeight
export const useAddDombaBreedingMating     = hooks.useAddMating
export const useUpdateDombaBreedingMating  = hooks.useUpdateMating
export const useAddDombaBreedingBirth      = hooks.useAddBirth
export const useAddDombaBreedingHealthLog  = hooks.useAddHealthLog
export const useAddDombaBreedingFeedLog    = hooks.useAddFeedLog
export const useAddDombaBreedingSale       = hooks.useAddSale
