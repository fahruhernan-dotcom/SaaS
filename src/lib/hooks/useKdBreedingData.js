import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

// ─── Pure KPI Calculations ────────────────────────────────────────────────────

export const calcBreedingADG = (beratAwal, beratAkhir, hariSelisih) => {
  if (!hariSelisih || hariSelisih <= 0) return 0
  return Number((((beratAkhir - beratAwal) * 1000) / hariSelisih).toFixed(1))
}

export const calcConceptionRate = (totalBunting, totalKawin) => {
  if (!totalKawin || totalKawin <= 0) return 0
  return Number(((totalBunting / totalKawin) * 100).toFixed(1))
}

export const calcLambingRate = (totalAnakLahir, totalIndukKawin) => {
  if (!totalIndukKawin || totalIndukKawin <= 0) return 0
  return Number(((totalAnakLahir / totalIndukKawin) * 100).toFixed(1))
}

export const calcWeaningRate = (anakSapih, anakLahirHidup) => {
  if (!anakLahirHidup || anakLahirHidup <= 0) return 0
  return Number(((anakSapih / anakLahirHidup) * 100).toFixed(1))
}

export const calcLitterSize = (totalAnakLahirHidup, totalKelahiran) => {
  if (!totalKelahiran || totalKelahiran <= 0) return 0
  return Number((totalAnakLahirHidup / totalKelahiran).toFixed(2))
}

export const calcLambingIntervalBulan = (hariSelisih) => {
  if (!hariSelisih || hariSelisih <= 0) return null
  return Number((hariSelisih / 30.4).toFixed(1))
}

export const calcMortalitasAnakPreSapih = (matiPreSapih, lahirHidup) => {
  if (!lahirHidup || lahirHidup <= 0) return 0
  return Number(((matiPreSapih / lahirHidup) * 100).toFixed(1))
}

export const calcBreedingRCRatio = (totalPenerimaan, totalBiaya) => {
  if (!totalBiaya || totalBiaya <= 0) return 0
  return Number((totalPenerimaan / totalBiaya).toFixed(2))
}

export const calcAgeInDays = (birthDate) => {
  if (!birthDate) return null
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / 86400000)
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

const KEYS = {
  animals:       (tenantId) => ['kd_breeding_animals', tenantId],
  weights:       (tenantId) => ['kd_breeding_weight_records', tenantId],
  matings:       (tenantId) => ['kd_breeding_mating_records', tenantId],
  births:        (tenantId) => ['kd_breeding_births', tenantId],
  health:        (tenantId) => ['kd_breeding_health_logs', tenantId],
  feed:          (tenantId) => ['kd_breeding_feed_logs', tenantId],
  sales:         (tenantId) => ['kd_breeding_sales', tenantId],
  animalWeights: (animalId) => ['kd_breeding_weight_records', 'animal', animalId],
}

// ─── Query Hooks ─────────────────────────────────────────────────────────────

export const useKdBreedingAnimals = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: KEYS.animals(tenant?.id),
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_breeding_animals')
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

export const useKdBreedingAnimalWeights = (animalId) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: KEYS.animalWeights(animalId),
    enabled: !!tenant?.id && !!animalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_breeding_weight_records')
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

export const useKdBreedingMatings = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: KEYS.matings(tenant?.id),
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_breeding_mating_records')
        .select(`
          *,
          dam:dam_id(id, ear_tag, name, species),
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

export const useKdBreedingBirths = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: KEYS.births(tenant?.id),
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_breeding_births')
        .select(`
          *,
          dam:dam_id(id, ear_tag, name, species)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('partus_date', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export const useKdBreedingHealthLogs = (animalId = null) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: [...KEYS.health(tenant?.id), animalId],
    enabled: !!tenant?.id,
    queryFn: async () => {
      let q = supabase
        .from('kd_breeding_health_logs')
        .select(`*, animal:animal_id(id, ear_tag, name, species)`)
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

export const useKdBreedingFeedLogs = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: KEYS.feed(tenant?.id),
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_breeding_feed_logs')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('log_date', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export const useKdBreedingSales = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: KEYS.sales(tenant?.id),
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_breeding_sales')
        .select(`*, animal:animal_id(id, ear_tag, name, species)`)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('sale_date', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

export const useAddKdBreedingAnimal = () => {
  const { tenant } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('kd_breeding_animals')
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

export const useUpdateKdBreedingAnimal = () => {
  const { tenant } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { error } = await supabase
        .from('kd_breeding_animals')
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

export const useAddKdBreedingWeight = () => {
  const { tenant } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      // Fetch previous weight
      const { data: prev } = await supabase
        .from('kd_breeding_weight_records')
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

      // Compute age_days from birth_date if not provided
      let age_days = payload.age_days ?? null
      if (!age_days) {
        const { data: animal } = await supabase
          .from('kd_breeding_animals')
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
        .from('kd_breeding_weight_records')
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

export const useAddKdBreedingMating = () => {
  const { tenant } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('kd_breeding_mating_records')
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

export const useUpdateKdBreedingMating = () => {
  const { tenant } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { error } = await supabase
        .from('kd_breeding_mating_records')
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

export const useAddKdBreedingBirth = () => {
  const { tenant } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('kd_breeding_births')
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

export const useAddKdBreedingHealthLog = () => {
  const { tenant } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('kd_breeding_health_logs')
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

export const useAddKdBreedingFeedLog = () => {
  const { tenant } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('kd_breeding_feed_logs')
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

export const useAddKdBreedingSale = () => {
  const { tenant } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { error: saleErr } = await supabase
        .from('kd_breeding_sales')
        .insert({ ...payload, tenant_id: tenant.id })
      if (saleErr) throw saleErr

      const { error: statusErr } = await supabase
        .from('kd_breeding_animals')
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
