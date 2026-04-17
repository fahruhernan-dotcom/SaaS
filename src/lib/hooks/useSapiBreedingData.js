import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

// ─── Pure KPI Calculations ────────────────────────────────────────────────────

/**
 * Conception Rate = (jumlah IB/kawin yang berhasil bunting / total IB) × 100
 * Target sapi: ≥ 60–70% (program UPSUS SIWAB target 70%)
 */
export const calcConceptionRate = (berhasil, totalIB) => {
  if (!totalIB || totalIB <= 0) return 0
  return Number(((berhasil / totalIB) * 100).toFixed(1))
}

/**
 * S/C (Service per Conception) = total IB dilakukan / total kebuntingan
 * Target: ≤ 1.7 (ideal 1.0–1.5)
 * Semakin rendah semakin efisien
 */
export const calcSCRatio = (totalIBDilakukan, totalKebuntingan) => {
  if (!totalKebuntingan || totalKebuntingan <= 0) return null
  return Number((totalIBDilakukan / totalKebuntingan).toFixed(2))
}

/**
 * Calving Rate = (jumlah indukan melahirkan / total indukan aktif) × 100
 * Target: ≥ 80%
 */
export const calcCalvingRate = (totalMelahirkan, totalIndukan) => {
  if (!totalIndukan || totalIndukan <= 0) return 0
  return Number(((totalMelahirkan / totalIndukan) * 100).toFixed(1))
}

/**
 * Calving Interval rata-rata dalam hari
 * Dihitung dari riwayat births per indukan: partus_date[n+1] - partus_date[n]
 * Target sapi: ≤ 365 hari (12 bulan sekali beranak)
 */
export const calcCalvingInterval = (birthDatesArr) => {
  if (!birthDatesArr || birthDatesArr.length < 2) return null
  const sorted = [...birthDatesArr].sort((a, b) => new Date(a) - new Date(b))
  const intervals = []
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / (1000 * 60 * 60 * 24)
    if (diff > 0) intervals.push(diff)
  }
  if (!intervals.length) return null
  return Math.round(intervals.reduce((s, v) => s + v, 0) / intervals.length)
}

/**
 * Weaning Rate = (pedet disapih / pedet lahir hidup) × 100
 * Target: ≥ 80%
 */
export const calcWeaningRate = (totalSapih, totalLahirHidup) => {
  if (!totalLahirHidup || totalLahirHidup <= 0) return 0
  return Number(((totalSapih / totalLahirHidup) * 100).toFixed(1))
}

/**
 * Hari kebuntingan sejak mating_date — untuk alert progress menuju partus
 */
export const calcHariKebuntingan = (matingDate) => {
  if (!matingDate) return 0
  const diff = new Date() - new Date(matingDate)
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

/**
 * Estimasi hari menuju partus dari est_partus_date
 * Negatif = sudah lewat, positif = masih menunggu
 */
export const calcHariMenujuPartus = (estPartusDate) => {
  if (!estPartusDate) return null
  const diff = new Date(estPartusDate) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * ADG pedet dari lahir sampai sapih (g/hari)
 * Target pedet pre-sapih: ≥ 500 g/hari
 */
export const calcPedetADG = (birthWeightKg, currentWeightKg, ageDays) => {
  if (!ageDays || ageDays <= 0) return 0
  const gain = (currentWeightKg - birthWeightKg) * 1000
  return Number((gain / ageDays).toFixed(1))
}


// ─── QUERIES ──────────────────────────────────────────────────────────────────

// ── useSapiBreedingAnimals ────────────────────────────────────────────────────
export function useSapiBreedingAnimals(filters = {}) {
  const { tenant } = useAuth()
  const { status, purpose } = filters
  return useQuery({
    queryKey: ['sapi-breeding-animals', tenant?.id, status, purpose],
    queryFn: async () => {
      let q = supabase
        .from('sapi_breeding_animals')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('entry_date', { ascending: false })
      if (status) q = q.eq('status', status)
      if (purpose) q = q.eq('purpose', purpose)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ── useSapiBreedingAnimalDetail ───────────────────────────────────────────────
export function useSapiBreedingAnimalDetail(animalId) {
  return useQuery({
    queryKey: ['sapi-breeding-animal-detail', animalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_breeding_animals')
        .select(`
          *,
          sapi_breeding_weight_records(*),
          sapi_breeding_health_logs(*),
          sapi_breeding_mating_records!dam_id(*)
        `)
        .eq('id', animalId)
        .eq('is_deleted', false)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!animalId,
  })
}

// ── useSapiBreedingMatingRecords ──────────────────────────────────────────────
export function useSapiBreedingMatingRecords(filters = {}) {
  const { tenant } = useAuth()
  const { damId, status } = filters
  return useQuery({
    queryKey: ['sapi-breeding-matings', tenant?.id, damId, status],
    queryFn: async () => {
      let q = supabase
        .from('sapi_breeding_mating_records')
        .select(`
          *,
          sapi_breeding_animals!dam_id(ear_tag, name, breed, parity),
          sapi_breeding_births(*)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('mating_date', { ascending: false })
      if (damId) q = q.eq('dam_id', damId)
      if (status) q = q.eq('status', status)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ── useSapiBreedingActiveMatingRecords ────────────────────────────────────────
// Rekap IB/kawin yang sedang berjalan (status: menunggu | bunting)
export function useSapiBreedingActiveMatingRecords() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sapi-breeding-active-matings', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_breeding_mating_records')
        .select(`
          *,
          sapi_breeding_animals!dam_id(ear_tag, name, breed, parity, kandang_name)
        `)
        .eq('tenant_id', tenant.id)
        .in('status', ['menunggu', 'bunting'])
        .eq('is_deleted', false)
        .order('mating_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ── useSapiBreedingBirths ─────────────────────────────────────────────────────
export function useSapiBreedingBirths(filters = {}) {
  const { tenant } = useAuth()
  const { damId } = filters
  return useQuery({
    queryKey: ['sapi-breeding-births', tenant?.id, damId],
    queryFn: async () => {
      let q = supabase
        .from('sapi_breeding_births')
        .select(`
          *,
          sapi_breeding_animals!dam_id(ear_tag, name, breed)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('partus_date', { ascending: false })
      if (damId) q = q.eq('dam_id', damId)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ── useSapiBreedingWeightRecords ──────────────────────────────────────────────
export function useSapiBreedingWeightRecords(animalId) {
  return useQuery({
    queryKey: ['sapi-breeding-weight-records', animalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_breeding_weight_records')
        .select('*')
        .eq('animal_id', animalId)
        .eq('is_deleted', false)
        .order('weigh_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!animalId,
  })
}

// ── useSapiBreedingHealthLogs ─────────────────────────────────────────────────
export function useSapiBreedingHealthLogs(filters = {}) {
  const { tenant } = useAuth()
  const { animalId } = filters
  return useQuery({
    queryKey: ['sapi-breeding-health-logs', tenant?.id, animalId],
    queryFn: async () => {
      let q = supabase
        .from('sapi_breeding_health_logs')
        .select(`
          *,
          sapi_breeding_animals(ear_tag, breed, sex)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('log_date', { ascending: false })
      if (animalId) q = q.eq('animal_id', animalId)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ── useSapiBreedingFeedLogs ───────────────────────────────────────────────────
export function useSapiBreedingFeedLogs() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sapi-breeding-feed-logs', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_breeding_feed_logs')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('log_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ── useSapiBreedingSales ──────────────────────────────────────────────────────
export function useSapiBreedingSales() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sapi-breeding-sales', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_breeding_sales')
        .select(`
          *,
          sapi_breeding_animals(ear_tag, breed, sex, birth_date)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('sale_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}


// ─── MUTATIONS ────────────────────────────────────────────────────────────────

// ── useAddSapiBreedingAnimal ──────────────────────────────────────────────────
export function useAddSapiBreedingAnimal() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      ear_tag, name, species = 'sapi', sex, breed, breed_composition,
      generation, birth_date, birth_weight_kg, birth_type,
      dam_id, sire_id,
      acquisition_type = 'beli', source,
      purpose, parity = 0, selection_class, phenotype_score,
      genetic_notes, origin,
      entry_date, entry_weight_kg, entry_bcs,
      purchase_price_idr, kandang_name, notes,
    }) => {
      const { error } = await supabase
        .from('sapi_breeding_animals')
        .insert({
          tenant_id: tenant.id,
          ear_tag, name, species, sex, breed, breed_composition,
          generation, birth_date, birth_weight_kg, birth_type,
          dam_id, sire_id,
          acquisition_type, source,
          purpose, parity, selection_class, phenotype_score,
          genetic_notes, origin,
          entry_date, entry_weight_kg, entry_bcs,
          purchase_price_idr, kandang_name, notes,
          status: 'aktif',
          latest_weight_kg: entry_weight_kg,
          latest_weight_date: entry_date,
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sapi-breeding-animals', tenant?.id] })
      toast.success('Ternak berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal tambah ternak: ' + err.message),
  })
}

// ── useUpdateSapiBreedingAnimal ───────────────────────────────────────────────
export function useUpdateSapiBreedingAnimal() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ animalId, updates }) => {
      const { error } = await supabase
        .from('sapi_breeding_animals')
        .update(updates)
        .eq('id', animalId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { animalId }) => {
      qc.invalidateQueries({ queryKey: ['sapi-breeding-animals', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-animal-detail', animalId] })
      toast.success('Data ternak diperbarui')
    },
    onError: (err) => toast.error('Gagal update: ' + err.message),
  })
}

// ── useAddSapiBreedingMatingRecord ────────────────────────────────────────────
export function useAddSapiBreedingMatingRecord() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      dam_id, sire_id,
      method, bull_name, semen_code, inseminator_name,
      repeat_ib_count = 1, sync_protocol,
      estrus_date, mating_date,
      est_partus_date,              // opsional — trigger set otomatis jika null
      notes,
    }) => {
      const { error } = await supabase
        .from('sapi_breeding_mating_records')
        .insert({
          tenant_id: tenant.id,
          dam_id, sire_id,
          method, bull_name, semen_code, inseminator_name,
          repeat_ib_count, sync_protocol,
          estrus_date, mating_date,
          est_partus_date: est_partus_date ?? null,
          status: 'menunggu',
          notes,
        })
      if (error) throw error

      // Update status indukan menjadi 'bunting' setelah IB dicatat
      // (akan dikonfirmasi saat PKB — ini hanya flag awal)
      // NOTE: dibiarkan 'aktif' sampai pregnancy_confirmed = true
    },
    onSuccess: (_, { dam_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-breeding-matings', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-active-matings', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-animal-detail', dam_id] })
      toast.success('IB/kawin berhasil dicatat')
    },
    onError: (err) => toast.error('Gagal catat IB: ' + err.message),
  })
}

// ── useUpdateSapiBreedingMatingStatus ─────────────────────────────────────────
export function useUpdateSapiBreedingMatingStatus() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      matingId, damId,
      status,
      pregnancy_confirmed, pregnancy_confirm_date, pregnancy_method,
      fetus_count,
    }) => {
      const { error } = await supabase
        .from('sapi_breeding_mating_records')
        .update({
          status,
          pregnancy_confirmed,
          pregnancy_confirm_date,
          pregnancy_method,
          fetus_count,
        })
        .eq('id', matingId)
        .eq('tenant_id', tenant.id)
      if (error) throw error

      // Sync status indukan sesuai konfirmasi kebuntingan
      if (status === 'bunting') {
        await supabase
          .from('sapi_breeding_animals')
          .update({ status: 'bunting' })
          .eq('id', damId)
          .eq('tenant_id', tenant.id)
      } else if (status === 'gagal') {
        await supabase
          .from('sapi_breeding_animals')
          .update({ status: 'aktif' })
          .eq('id', damId)
          .eq('tenant_id', tenant.id)
      }
    },
    onSuccess: (_, { damId }) => {
      qc.invalidateQueries({ queryKey: ['sapi-breeding-matings', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-active-matings', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-animal-detail', damId] })
      toast.success('Status kebuntingan diperbarui')
    },
    onError: (err) => toast.error('Gagal update status: ' + err.message),
  })
}

// ── useAddSapiBreedingBirth ───────────────────────────────────────────────────
export function useAddSapiBreedingBirth() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      dam_id, mating_record_id,
      partus_date, partus_time,
      birth_type, total_born, total_born_alive,
      pedet_sex, pedet_birth_weight_kg, pedet_condition,
      pedet_id,
      is_freemartin_risk = false,
      birth_assistance = 'normal',
      colostrum_given, placenta_expelled,
      retentio_placenta = false,
      dam_condition, notes,
    }) => {
      const { error } = await supabase
        .from('sapi_breeding_births')
        .insert({
          tenant_id: tenant.id,
          dam_id, mating_record_id,
          partus_date, partus_time,
          birth_type, total_born: total_born ?? 1,
          total_born_alive: total_born_alive ?? 1,
          pedet_sex, pedet_birth_weight_kg, pedet_condition,
          pedet_id,
          is_freemartin_risk,
          birth_assistance,
          colostrum_given: colostrum_given ?? true,
          placenta_expelled: placenta_expelled ?? true,
          retentio_placenta,
          dam_condition, notes,
        })
      if (error) throw error
      // DB trigger: mating.status → 'melahirkan' + dam.parity += 1 otomatis
      // Status indukan kembali ke 'aktif' setelah melahirkan
      await supabase
        .from('sapi_breeding_animals')
        .update({ status: 'aktif' })
        .eq('id', dam_id)
        .eq('tenant_id', tenant.id)
    },
    onSuccess: (_, { dam_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-breeding-births', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-matings', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-active-matings', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-animals', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-animal-detail', dam_id] })
      toast.success('Kelahiran berhasil dicatat')
    },
    onError: (err) => toast.error('Gagal catat kelahiran: ' + err.message),
  })
}

// ── useAddSapiBreedingWeightRecord ────────────────────────────────────────────
export function useAddSapiBreedingWeightRecord() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      animal_id, entry_date, entry_weight_kg,
      weigh_date, weight_kg, bcs,
      weigh_method = 'timbang_langsung', chest_girth_cm,
      notes, recorded_by,
    }) => {
      // Cari record sebelumnya untuk ADG incremental
      const { data: prev } = await supabase
        .from('sapi_breeding_weight_records')
        .select('weigh_date, weight_kg')
        .eq('animal_id', animal_id)
        .eq('is_deleted', false)
        .order('weigh_date', { ascending: false })
        .limit(1)

      const msPerDay = 1000 * 60 * 60 * 24
      let adg_since_last = null
      let age_days = null

      if (entry_date) {
        age_days = Math.floor((new Date(weigh_date) - new Date(entry_date)) / msPerDay)
      }

      if (prev?.length) {
        const daysDiff = Math.floor(
          (new Date(weigh_date) - new Date(prev[0].weigh_date)) / msPerDay
        )
        if (daysDiff > 0) {
          adg_since_last = Number(
            (((weight_kg - prev[0].weight_kg) * 1000) / daysDiff).toFixed(1)
          )
        }
      } else if (entry_date && entry_weight_kg) {
        const daysDiff = Math.floor(
          (new Date(weigh_date) - new Date(entry_date)) / msPerDay
        )
        if (daysDiff > 0) {
          adg_since_last = Number(
            (((weight_kg - entry_weight_kg) * 1000) / daysDiff).toFixed(1)
          )
        }
      }

      const { error } = await supabase
        .from('sapi_breeding_weight_records')
        .insert({
          tenant_id: tenant.id,
          animal_id, weigh_date, weight_kg, bcs,
          age_days, adg_since_last,
          weigh_method, chest_girth_cm,
          notes, recorded_by,
        })
      if (error) throw error
      // DB trigger sync latest_weight_* ke animals otomatis
    },
    onSuccess: (_, { animal_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-breeding-weight-records', animal_id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-animals', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-animal-detail', animal_id] })
      toast.success('Data timbang disimpan')
    },
    onError: (err) => toast.error('Gagal simpan timbang: ' + err.message),
  })
}

// ── useAddSapiBreedingHealthLog ───────────────────────────────────────────────
export function useAddSapiBreedingHealthLog() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      animal_id, log_date, log_type,
      vaccine_name, drug_name, dose, route,
      symptoms, diagnosis, treatment, outcome,
      death_cause, death_weight_kg, loss_value_idr,
      handled_by, notes, recorded_by,
    }) => {
      const { error } = await supabase
        .from('sapi_breeding_health_logs')
        .insert({
          tenant_id: tenant.id,
          animal_id, log_date, log_type,
          vaccine_name, drug_name, dose, route,
          symptoms, diagnosis, treatment, outcome,
          death_cause, death_weight_kg, loss_value_idr,
          handled_by, notes, recorded_by,
        })
      if (error) throw error
      // DB trigger trg_sapi_breeding_health_mark_dead menangani status 'mati' otomatis
    },
    onSuccess: (_, { animal_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-breeding-health-logs', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-animals', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-animal-detail', animal_id] })
      toast.success('Log kesehatan disimpan')
    },
    onError: (err) => toast.error('Gagal simpan log kesehatan: ' + err.message),
  })
}

// ── useDeleteSapiBreedingHealthLog ────────────────────────────────────────────
export function useDeleteSapiBreedingHealthLog() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ logId }) => {
      const { error } = await supabase
        .from('sapi_breeding_health_logs')
        .update({ is_deleted: true })
        .eq('id', logId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sapi-breeding-health-logs', tenant?.id] })
      toast.success('Log dihapus')
    },
    onError: (err) => toast.error('Gagal hapus: ' + err.message),
  })
}

// ── useAddSapiBreedingFeedLog ─────────────────────────────────────────────────
export function useAddSapiBreedingFeedLog() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      log_date, kandang_name, animal_count,
      hijauan_kg, konsentrat_kg, dedak_kg, other_feed_kg,
      sisa_pakan_kg, feed_cost_idr, notes,
    }) => {
      const { error } = await supabase
        .from('sapi_breeding_feed_logs')
        .upsert({
          tenant_id: tenant.id,
          log_date, kandang_name, animal_count,
          hijauan_kg:    hijauan_kg    ?? 0,
          konsentrat_kg: konsentrat_kg ?? 0,
          dedak_kg:      dedak_kg      ?? 0,
          other_feed_kg: other_feed_kg ?? 0,
          sisa_pakan_kg: sisa_pakan_kg ?? 0,
          feed_cost_idr, notes,
        }, {
          onConflict: 'tenant_id,kandang_name,log_date',
          ignoreDuplicates: false,
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sapi-breeding-feed-logs', tenant?.id] })
      toast.success('Log pakan disimpan')
    },
    onError: (err) => toast.error('Gagal simpan pakan: ' + err.message),
  })
}

// ── useDeleteSapiBreedingFeedLog ──────────────────────────────────────────────
export function useDeleteSapiBreedingFeedLog() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ logId }) => {
      const { error } = await supabase
        .from('sapi_breeding_feed_logs')
        .update({ is_deleted: true })
        .eq('id', logId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sapi-breeding-feed-logs', tenant?.id] })
      toast.success('Log pakan dihapus')
    },
    onError: (err) => toast.error('Gagal hapus: ' + err.message),
  })
}

// ── useAddSapiBreedingSale ────────────────────────────────────────────────────
export function useAddSapiBreedingSale() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      animal_id, sale_date, product_type,
      buyer_name, buyer_contact, buyer_type,
      sale_weight_kg, price_type, price_amount, total_revenue_idr,
      payment_method, is_paid, paid_date,
      invoice_number, notes,
    }) => {
      const { error: saleErr } = await supabase
        .from('sapi_breeding_sales')
        .insert({
          tenant_id: tenant.id,
          animal_id, sale_date, product_type,
          buyer_name, buyer_contact, buyer_type,
          sale_weight_kg, price_type, price_amount, total_revenue_idr,
          payment_method, is_paid: is_paid ?? false, paid_date,
          invoice_number, notes,
        })
      if (saleErr) throw saleErr
      // DB trigger trg_sapi_breeding_sale_mark_sold menangani animal.status = 'terjual'
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sapi-breeding-sales', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-breeding-animals', tenant?.id] })
      toast.success('Penjualan berhasil dicatat')
    },
    onError: (err) => toast.error('Gagal catat penjualan: ' + err.message),
  })
}
