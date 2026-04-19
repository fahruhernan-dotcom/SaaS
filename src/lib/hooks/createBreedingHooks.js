/**
 * TernakOS — Breeding Hook Factory
 * 
 * Creates a complete set of React Query hooks for any breeding business model.
 * Usage:
 *   const dombaHooks = createBreedingHooks('domba')
 *   const kambingHooks = createBreedingHooks('kambing')
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'
import { calcBreedingADG } from './useKdBreedingData'

export function createBreedingHooks(prefix) {
  // Table names
  const T = {
    animals:  `${prefix}_breeding_animals`,
    weights:  `${prefix}_breeding_weight_records`,
    matings:  `${prefix}_breeding_mating_records`,
    births:   `${prefix}_breeding_births`,
    health:   `${prefix}_breeding_health_logs`,
    feed:     `${prefix}_breeding_feed_logs`,
    sales:    `${prefix}_breeding_sales`,
  }

  // Query key prefix for cache isolation
  const K = `${prefix}_breeding`

  // ─── QUERY KEYS ────────────────────────────────────────────────────────────

  const KEYS = {
    animals:       (tenantId) => [K + '_animals', tenantId],
    weights:       (tenantId) => [K + '_weight_records', tenantId],
    matings:       (tenantId) => [K + '_mating_records', tenantId],
    births:        (tenantId) => [K + '_births', tenantId],
    health:        (tenantId) => [K + '_health_logs', tenantId],
    feed:          (tenantId) => [K + '_feed_logs', tenantId],
    sales:         (tenantId) => [K + '_sales', tenantId],
    animalWeights: (animalId) => [K + '_weight_records', 'animal', animalId],
  }

  // ─── QUERY HOOKS ──────────────────────────────────────────────────────────

  const useAnimals = () => {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: KEYS.animals(tenant?.id),
      enabled: !!tenant?.id,
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.animals)
          .select(`
            *,
            dam:dam_id(id, ear_tag, name),
            sire:sire_id(id, ear_tag, name)
          `)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('ear_tag')
        if (error) throw error
        return data
      },
    })
  }

  const useAnimalWeights = (animalId) => {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: KEYS.animalWeights(animalId),
      enabled: !!tenant?.id && !!animalId,
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.weights)
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('animal_id', animalId)
          .eq('is_deleted', false)
          .order('weigh_date')
        if (error) throw error
        return data
      },
    })
  }

  const useMatings = () => {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: KEYS.matings(tenant?.id),
      enabled: !!tenant?.id,
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.matings)
          .select(`
            *,
            dam:dam_id(id, ear_tag, name),
            sire:sire_id(id, ear_tag, name)
          `)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('mating_date', { ascending: false })
        if (error) throw error
        return data
      },
    })
  }

  const useBirths = () => {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: KEYS.births(tenant?.id),
      enabled: !!tenant?.id,
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.births)
          .select(`
            *,
            dam:dam_id(id, ear_tag, name)
          `)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('partus_date', { ascending: false })
        if (error) throw error
        return data
      },
    })
  }

  const useHealthLogs = (animalId = null) => {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [...KEYS.health(tenant?.id), animalId],
      enabled: !!tenant?.id,
      queryFn: async () => {
        let q = supabase
          .from(T.health)
          .select(`*, animal:animal_id(id, ear_tag, name)`)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('log_date', { ascending: false })
        if (animalId) q = q.eq('animal_id', animalId)
        const { data, error } = await q
        if (error) throw error
        return data
      },
    })
  }

  const useFeedLogs = () => {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: KEYS.feed(tenant?.id),
      enabled: !!tenant?.id,
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.feed)
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('log_date', { ascending: false })
        if (error) throw error
        return data
      },
    })
  }

  const useSales = () => {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: KEYS.sales(tenant?.id),
      enabled: !!tenant?.id,
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.sales)
          .select(`*, animal:animal_id(id, ear_tag, name)`)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('sale_date', { ascending: false })
        if (error) throw error
        return data
      },
    })
  }

  // ─── MUTATION HOOKS ────────────────────────────────────────────────────────

  const useAddAnimal = () => {
    const { tenant } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (payload) => {
        const { error } = await supabase
          .from(T.animals)
          .insert({ ...payload, tenant_id: tenant.id })
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries(KEYS.animals(tenant.id))
        toast.success('Ternak berhasil ditambahkan')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const useUpdateAnimal = () => {
    const { tenant } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async ({ id, ...payload }) => {
        const { error } = await supabase
          .from(T.animals)
          .update(payload)
          .eq('id', id)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries(KEYS.animals(tenant.id))
        toast.success('Data ternak diperbarui')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const useAddWeight = () => {
    const { tenant } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (payload) => {
        const { data: prev } = await supabase
          .from(T.weights)
          .select('weight_kg, weigh_date')
          .eq('tenant_id', tenant.id)
          .eq('animal_id', payload.animal_id)
          .eq('is_deleted', false)
          .order('weigh_date', { ascending: false })
          .limit(1)
          .maybeSingle()

        let adg_since_last = null
        if (prev) {
          const days = Math.floor(
            (new Date(payload.weigh_date) - new Date(prev.weigh_date)) / 86400000
          )
          if (days > 0) {
            adg_since_last = calcBreedingADG(prev.weight_kg, payload.weight_kg, days)
          }
        }

        let age_days = payload.age_days ?? null
        if (!age_days) {
          const { data: animal } = await supabase
            .from(T.animals)
            .select('birth_date')
            .eq('id', payload.animal_id)
            .maybeSingle()
          if (animal?.birth_date) {
            age_days = Math.floor(
              (new Date(payload.weigh_date) - new Date(animal.birth_date)) / 86400000
            )
          }
        }

        const { error } = await supabase
          .from(T.weights)
          .insert({ ...payload, tenant_id: tenant.id, adg_since_last, age_days })
        if (error) throw error
      },
      onSuccess: (_d, vars) => {
        qc.invalidateQueries(KEYS.animals(tenant.id))
        qc.invalidateQueries(KEYS.animalWeights(vars.animal_id))
        toast.success('Timbangan dicatat')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const useAddMating = () => {
    const { tenant } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (payload) => {
        const { error } = await supabase
          .from(T.matings)
          .insert({ ...payload, tenant_id: tenant.id })
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries(KEYS.matings(tenant.id))
        toast.success('Perkawinan dicatat')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const useUpdateMating = () => {
    const { tenant } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async ({ id, ...payload }) => {
        const { error } = await supabase
          .from(T.matings)
          .update(payload)
          .eq('id', id)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries(KEYS.matings(tenant.id))
        toast.success('Data perkawinan diperbarui')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const useAddBirth = () => {
    const { tenant } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (payload) => {
        const { error } = await supabase
          .from(T.births)
          .insert({ ...payload, tenant_id: tenant.id })
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries(KEYS.births(tenant.id))
        qc.invalidateQueries(KEYS.matings(tenant.id))
        toast.success('Kelahiran dicatat')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const useAddHealthLog = () => {
    const { tenant } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (payload) => {
        const { error } = await supabase
          .from(T.health)
          .insert({ ...payload, tenant_id: tenant.id })
        if (error) throw error
      },
      onSuccess: (_d, vars) => {
        qc.invalidateQueries(KEYS.health(tenant.id))
        if (vars.log_type === 'kematian') qc.invalidateQueries(KEYS.animals(tenant.id))
        toast.success('Log kesehatan dicatat')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const useAddFeedLog = () => {
    const { tenant } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (payload) => {
        const { error } = await supabase
          .from(T.feed)
          .insert({ ...payload, tenant_id: tenant.id })
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries(KEYS.feed(tenant.id))
        toast.success('Log pakan dicatat')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const useAddSale = () => {
    const { tenant } = useAuth()
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (payload) => {
        const { error: saleErr } = await supabase
          .from(T.sales)
          .insert({ ...payload, tenant_id: tenant.id })
        if (saleErr) throw saleErr

        const { error: statusErr } = await supabase
          .from(T.animals)
          .update({ status: 'terjual' })
          .eq('id', payload.animal_id)
          .eq('tenant_id', tenant.id)
        if (statusErr) throw statusErr
      },
      onSuccess: () => {
        qc.invalidateQueries(KEYS.sales(tenant.id))
        qc.invalidateQueries(KEYS.animals(tenant.id))
        toast.success('Penjualan dicatat')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  // ─── RETURN ALL HOOKS ──────────────────────────────────────────────────────

  return {
    // Queries
    useAnimals,
    useAnimalWeights,
    useMatings,
    useBirths,
    useHealthLogs,
    useFeedLogs,
    useSales,
    // Mutations
    useAddAnimal,
    useUpdateAnimal,
    useAddWeight,
    useAddMating,
    useUpdateMating,
    useAddBirth,
    useAddHealthLog,
    useAddFeedLog,
    useAddSale,
  }
}
