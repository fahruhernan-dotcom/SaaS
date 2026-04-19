/**
 * TernakOS — Domba Penggemukan Data Hooks
 * 
 * Generated via hook factory: createPenggemukanHooks('domba')
 * Tables: domba_penggemukan_batches, domba_penggemukan_animals, etc.
 */

import { createPenggemukanHooks } from './createPenggemukanHooks'

// Re-export KPI calculators (pure functions — no DB dependency)
export {
  calcADG,
  calcFCRKambing as calcFCRDomba,
  calcMortalitasKambing as calcMortalitasDomba,
  calcBEP,
  calcRCRatio,
  calcHariDiFarm,
  calcADGFromRecords,
} from './useKdPenggemukanData'

// ── Generate hooks from factory ──────────────────────────────────────────────

const hooks = createPenggemukanHooks('domba')

// Queries
export const useDombaBatches         = hooks.useBatches
export const useDombaActiveBatches   = hooks.useActiveBatches
export const useDombaAnimals         = hooks.useAnimals
export const useDombaAnimalDetail    = hooks.useAnimalDetail
export const useDombaWeightRecords   = hooks.useWeightRecords
export const useDombaFeedLogs        = hooks.useFeedLogs
export const useDombaHealthLogs      = hooks.useHealthLogs
export const useDombaSales           = hooks.useSales
export const useDombaKandangs        = hooks.useKandangs

// Mutations
export const useCreateDombaBatch         = hooks.useCreateBatch
export const useCloseDombaBatch          = hooks.useCloseBatch
export const useAddDombaAnimal           = hooks.useAddAnimal
export const useUpdateDombaAnimalStatus  = hooks.useUpdateAnimalStatus
export const useAddDombaWeightRecord     = hooks.useAddWeightRecord
export const useAddDombaFeedLog          = hooks.useAddFeedLog
export const useAddDombaHealthLog        = hooks.useAddHealthLog
export const useAddDombaSale             = hooks.useAddSale
export const useDeleteDombaFeedLog       = hooks.useDeleteFeedLog
export const useDeleteDombaWeightRecord  = hooks.useDeleteWeightRecord
export const useCreateDombaKandang       = hooks.useCreateKandang
export const useMoveDombaToKandang       = hooks.useMoveAnimalToKandang
export const useEnsureDombaHoldingPen    = hooks.useEnsureHoldingPen
