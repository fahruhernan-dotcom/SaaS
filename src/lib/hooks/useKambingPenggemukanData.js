import { createPenggemukanHooks } from './createPenggemukanHooks'

/**
 * TernakOS — Kambing Penggemukan Data Hooks
 * 
 * Generated via hook factory: createPenggemukanHooks('kambing')
 * Tables: kambing_penggemukan_batches, kambing_penggemukan_animals, etc.
 */

// Re-export KPI calculators
export {
  calcADG,
  calcFCRKambing,
  calcFCRKambing as calcFCR,
  calcMortalitasKambing,
  calcMortalitasKambing as calcMortalitas,
  calcBEP,
  calcRCRatio,
  calcHariDiFarm,
  calcADGFromRecords,
} from './useKdPenggemukanData'

const hooks = createPenggemukanHooks('kambing')

// Queries
export const useKambingBatches         = hooks.useBatches
export const useKambingActiveBatches   = hooks.useActiveBatches
export const useKambingAnimals         = hooks.useAnimals
export const useKambingAnimalDetail    = hooks.useAnimalDetail
export const useKambingWeightRecords   = hooks.useWeightRecords
export const useKambingFeedLogs        = hooks.useFeedLogs
export const useKambingHealthLogs      = hooks.useHealthLogs
export const useKambingSales           = hooks.useSales
export const useKambingKandangs        = hooks.useKandangs

// Mutations
export const useCreateKambingBatch         = hooks.useCreateBatch
export const useCloseKambingBatch          = hooks.useCloseBatch
export const useAddKambingAnimal           = hooks.useAddAnimal
export const useUpdateKambingAnimalStatus  = hooks.useUpdateAnimalStatus
export const useAddKambingWeightRecord     = hooks.useAddWeightRecord
export const useAddKambingFeedLog          = hooks.useAddFeedLog
export const useAddKambingHealthLog        = hooks.useAddHealthLog
export const useAddKambingSale             = hooks.useAddSale
export const useDeleteKambingFeedLog       = hooks.useDeleteFeedLog
export const useDeleteKambingWeightRecord  = hooks.useDeleteWeightRecord
export const useCreateKambingKandang       = hooks.useCreateKandang
export const useMoveKambingToKandang       = hooks.useMoveAnimalToKandang
export const useEnsureKambingHoldingPen    = hooks.useEnsureHoldingPen
