import { createDairyHooks } from './createDairyHooks'

/**
 * TernakOS — Kambing Perah (Dairy) Data Hooks
 * 
 * Enterprise-scale implementation using the Dairy Hook Factory.
 * Tables: kambing_perah_milk_logs, kambing_perah_lactation_cycles, etc.
 */

const hooks = createDairyHooks('kambing_perah')

// Queries
export const useKambingPerahAnimals           = hooks.useAnimals
export const useKambingPerahLactatingAnimals  = hooks.useLactatingAnimals
export const useKambingPerahActiveLactations  = hooks.useActiveLactations
export const useKambingPerahMilkLogs          = hooks.useMilkLogs
export const useKambingPerahInventory         = hooks.useInventory
export const useKambingPerahYieldStats        = hooks.useYieldStats
export const useKambingPerahCustomers         = hooks.useCustomers
export const useKambingPerahMilkSales         = hooks.useMilkSales
export const useKambingPerahKpis              = hooks.useKpis

// Mutations
export const useLogKambingPerahProduction    = hooks.useLogProduction
export const useUpdateKambingPerahInventory  = hooks.useUpdateInventory
export const useLogKambingPerahSale          = hooks.useLogSale
export const useAddKambingBreedingAnimal     = hooks.useAddAnimal
