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
export const useKambingKandangs                        = hooks.useKandangs
export const useKambingAnimalsByBatches                = hooks.useAnimalsByBatches
export const useKambingBatchWeightHistory              = hooks.useBatchWeightHistory
export const useKambingOperationalCosts                = hooks.useOperationalCosts
export const useKambingBatchWeightHistoryByBatches     = hooks.useBatchWeightHistoryByBatches
export const useKambingSalesByBatches                  = hooks.useSalesByBatches
export const useKambingFeedLogsByBatches               = hooks.useFeedLogsByBatches
export const useKambingOperationalCostsByBatches       = hooks.useOperationalCostsByBatches
export const useKambingHealthLogsByBatches             = hooks.useHealthLogsByBatches

// Mutations
export const useCreateKambingBatch         = hooks.useCreateBatch
export const useCloseKambingBatch          = hooks.useCloseBatch
export const useAddKambingAnimal           = hooks.useAddAnimal
export const useBulkAddKambingAnimals      = hooks.useBulkAddAnimals
export const useUpdateKambingAnimal        = hooks.useUpdateAnimal
export const useUpdateKambingAnimalStatus  = hooks.useUpdateAnimalStatus
export const useAddKambingWeightRecord     = hooks.useAddWeightRecord
export const useAddKambingFeedLog          = hooks.useAddFeedLog
export const useAddKambingHealthLog        = hooks.useAddHealthLog
export const useAddKambingSale             = hooks.useAddSale
export const useUpdateKambingSale          = hooks.useUpdateSale
export const useDeleteKambingSale          = hooks.useDeleteSale
export const useKambingHppBatch            = hooks.useHppBatch
export const useKambingBatchRecord         = hooks.useBatchRecord
export const useDeleteKambingFeedLog       = hooks.useDeleteFeedLog
export const useDeleteKambingWeightRecord  = hooks.useDeleteWeightRecord
export const useDeleteKambingHealthLog     = hooks.useDeleteHealthLog
export const useAddKambingOperationalCost  = hooks.useAddOperationalCost
export const useDeleteKambingOperationalCost = hooks.useDeleteOperationalCost
export const useCreateKambingKandang         = hooks.useCreateKandang
export const useUpdateKambingKandang         = hooks.useUpdateKandang
export const useUpdateKambingKandangPosition = hooks.useUpdateKandangPosition
export const useDeleteKambingKandang         = hooks.useDeleteKandang
export const useMoveKambingToKandang         = hooks.useMoveAnimalToKandang
export const useEnsureKambingHoldingPen      = hooks.useEnsureHoldingPen
