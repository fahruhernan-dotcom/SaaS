import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

// ─── Pure KPI Calculations ────────────────────────────────────────────────────

/**
 * ADG (Average Daily Gain) dalam gram/hari
 * Sapi target: 800–1200 g/hari tergantung breed
 *   Limousin/Simmental: 900–1200 g/hari
 *   PO/Bali lokal:      500–800  g/hari
 */
export const calcSapiADG = (beratAwalKg, beratAkhirKg, hariDiFarm) => {
  if (!hariDiFarm || hariDiFarm <= 0) return 0
  const gain = (beratAkhirKg - beratAwalKg) * 1000 // kg → gram
  return Number((gain / hariDiFarm).toFixed(1))
}

/**
 * FCR sapi = total pakan fresh weight (kg) / total PBBH (kg)
 * Sapi target: < 8–10 (jauh lebih tinggi dari broiler karena ruminansia)
 */
export const calcSapiFCR = (totalPakanKg, totalPBBH) => {
  if (!totalPBBH || totalPBBH <= 0) return 0
  return Number((totalPakanKg / totalPBBH).toFixed(2))
}

/**
 * Mortalitas batch dalam persen
 * Sapi target: < 2%
 */
export const calcSapiMortalitas = (mati, totalMasuk) => {
  if (!totalMasuk || totalMasuk <= 0) return 0
  return Number(((mati / totalMasuk) * 100).toFixed(1))
}

/**
 * R/C Ratio
 */
export const calcSapiRCRatio = (totalPenerimaan, totalBiaya) => {
  if (!totalBiaya || totalBiaya <= 0) return 0
  return Number((totalPenerimaan / totalBiaya).toFixed(2))
}

/**
 * BEP harga jual per kg hidup
 */
export const calcSapiBEP = (totalBiaya, beratJualKg) => {
  if (!beratJualKg || beratJualKg <= 0) return 0
  return Math.ceil(totalBiaya / beratJualKg)
}

/**
 * Hari di farm dari entry_date sampai hari ini (atau exit_date)
 */
export const calcSapiHariDiFarm = (entryDate, exitDate = null) => {
  if (!entryDate) return 0
  const end = exitDate ? new Date(exitDate) : new Date()
  const diff = end.getTime() - new Date(entryDate).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

/**
 * ADG running dari riwayat weight_records
 */
export const calcSapiADGFromRecords = (weightRecords, entryDate, entryWeightKg) => {
  if (!weightRecords?.length) return null
  const sorted = [...weightRecords].sort((a, b) =>
    new Date(a.weigh_date) - new Date(b.weigh_date)
  )
  const latest = sorted[sorted.length - 1]
  const hari = calcSapiHariDiFarm(entryDate, latest.weigh_date)
  if (!hari) return null
  return calcSapiADG(entryWeightKg, latest.weight_kg, hari)
}

/**
 * Estimasi bobot dari lingkar dada (pita ukur)
 * Rumus Schaeffer yang umum dipakai di Indonesia
 * Akurasi ±10–15% tergantung breed
 */
export const estimateSapiWeightFromGirth = (chestGirthCm) => {
  if (!chestGirthCm || chestGirthCm <= 0) return null
  // Rumus: berat (kg) ≈ (lingkar dada dalam cm / 100)^2 × 90
  return Number(Math.round(Math.pow(chestGirthCm / 100, 2) * 90))
}


// ─── QUERIES ──────────────────────────────────────────────────────────────────

// ── useSapiBatches ────────────────────────────────────────────────────────────
export function useSapiBatches() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sapi-batches', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_penggemukan_batches')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('start_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ── useSapiActiveBatches ──────────────────────────────────────────────────────
export function useSapiActiveBatches() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sapi-active-batches', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_penggemukan_batches')
        .select(`
          *,
          animals:sapi_penggemukan_animals(
            id, breed
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .eq('is_deleted', false)
        .order('start_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ── useSapiAnimals ────────────────────────────────────────────────────────────
export function useSapiAnimals(batchId) {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sapi-animals', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_penggemukan_animals')
        .select(`
          *,
          sapi_penggemukan_weight_records(*)
        `)
        .eq('tenant_id', tenant.id)
        .eq('batch_id', batchId)
        .eq('is_deleted', false)
        .order('entry_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!batchId && !!tenant?.id,
  })
}

// ── useSapiWeightHistory ──────────────────────────────────────────────────────
export function useSapiWeightHistory(batchId) {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sapi-weight-history', tenant?.id, batchId],
    queryFn: async () => {
      if (!batchId) return []
      const { data, error } = await supabase
        .from('sapi_penggemukan_weight_records')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('batch_id', batchId)
        .eq('is_deleted', false)
        .order('weigh_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!batchId && !!tenant?.id,
  })
}

// ── useSapiAnimalDetail ───────────────────────────────────────────────────────
export function useSapiAnimalDetail(animalId) {
  return useQuery({
    queryKey: ['sapi-animal-detail', animalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_penggemukan_animals')
        .select(`
          *,
          sapi_penggemukan_weight_records(*),
          sapi_penggemukan_health_logs(*)
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

// ── useSapiWeightRecords ──────────────────────────────────────────────────────
export function useSapiWeightRecords(animalId) {
  return useQuery({
    queryKey: ['sapi-weight-records', animalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_penggemukan_weight_records')
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

// ── useSapiFeedLogs ───────────────────────────────────────────────────────────
export function useSapiFeedLogs(batchId) {
  return useQuery({
    queryKey: ['sapi-feed-logs', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_penggemukan_feed_logs')
        .select('*')
        .eq('batch_id', batchId)
        .eq('is_deleted', false)
        .order('log_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!batchId,
  })
}

// ── useSapiHealthLogs ─────────────────────────────────────────────────────────
export function useSapiHealthLogs(batchId) {
  return useQuery({
    queryKey: ['sapi-health-logs', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_penggemukan_health_logs')
        .select(`
          *,
          sapi_penggemukan_animals(ear_tag, species, breed)
        `)
        .eq('batch_id', batchId)
        .eq('is_deleted', false)
        .order('log_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!batchId,
  })
}

// ── useSapiSales ──────────────────────────────────────────────────────────────
export function useSapiSales(batchId) {
  return useQuery({
    queryKey: ['sapi-sales', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_penggemukan_sales')
        .select('*')
        .eq('batch_id', batchId)
        .eq('is_deleted', false)
        .order('sale_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!batchId,
  })
}

// ── useSapiKandangs ───────────────────────────────────────────────────────────
export function useSapiKandangs() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sapi-kandangs', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sapi_kandangs')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('is_holding', { ascending: false })
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ── useSapiAnimalsByBatches ───────────────────────────────────────────────────
export function useSapiAnimalsByBatches(batchIds) {
  const { tenant } = useAuth()
  const ids = Array.isArray(batchIds) ? batchIds : [batchIds]
  return useQuery({
    queryKey: ['sapi-animals-multi', ids],
    queryFn: async () => {
      if (ids.length === 0) return []
      const { data, error } = await supabase
        .from('sapi_penggemukan_animals')
        .select('*, sapi_penggemukan_weight_records(*)')
        .eq('tenant_id', tenant.id)
        .in('batch_id', ids)
        .eq('is_deleted', false)
        .order('entry_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: ids.length > 0 && !!tenant?.id,
  })
}


// ─── MUTATIONS ────────────────────────────────────────────────────────────────

// ── useCreateSapiBatch ────────────────────────────────────────────────────────
export function useCreateSapiBatch() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ batch_code, kandang_name, start_date, target_end_date, notes }) => {
      const { error } = await supabase
        .from('sapi_penggemukan_batches')
        .insert({
          tenant_id: tenant.id,
          batch_code, kandang_name, start_date, target_end_date, notes,
          status: 'active',
          batch_purpose: 'potong',
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sapi-batches', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-active-batches', tenant?.id] })
      toast.success('Batch sapi berhasil dibuat')
    },
    onError: (err) => toast.error('Gagal buat batch: ' + err.message),
  })
}

// ── useCloseSapiBatch ─────────────────────────────────────────────────────────
export function useCloseSapiBatch() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ batchId, kpiFinal }) => {
      // kpiFinal: { end_date, avg_adg_gram, avg_fcr, avg_entry_weight_kg,
      //   avg_exit_weight_kg, total_feed_cost_idr, total_revenue_idr,
      //   total_cogs_idr, net_profit_idr, rc_ratio, alive_count, sold_count }
      const { error } = await supabase
        .from('sapi_penggemukan_batches')
        .update({ status: 'closed', ...kpiFinal })
        .eq('id', batchId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sapi-batches', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['sapi-active-batches', tenant?.id] })
      toast.success('Batch ditutup')
    },
    onError: (err) => toast.error('Gagal tutup batch: ' + err.message),
  })
}

// ── useAddSapiAnimal ──────────────────────────────────────────────────────────
export function useAddSapiAnimal() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      batch_id, ear_tag,
      species = 'sapi', breed, sex,
      birth_date, entry_age_months, age_confidence = 'estimasi',
      acquisition_type = 'beli',
      entry_date, entry_weight_kg, entry_bcs, entry_condition,
      purchase_price_idr, source, kandang_slot, kandang_id,
      quarantine_start, quarantine_end, quarantine_notes, notes,
    }) => {
      const { error: animalErr } = await supabase
        .from('sapi_penggemukan_animals')
        .insert({
          tenant_id: tenant.id,
          batch_id, ear_tag,
          species, breed, sex,
          birth_date, entry_age_months, age_confidence,
          acquisition_type,
          entry_date, entry_weight_kg, entry_bcs, entry_condition,
          purchase_price_idr, source, kandang_slot, kandang_id,
          quarantine_start, quarantine_end, quarantine_notes, notes,
          status: 'active',
          latest_weight_kg: entry_weight_kg,
          latest_weight_date: entry_date,
        })
      if (animalErr) throw animalErr

      const { error: batchErr } = await supabase.rpc(
        'increment_sapi_batch_animal_count',
        { p_batch_id: batch_id }
      )
      if (batchErr) throw batchErr
    },
    onSuccess: (_, { batch_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-animals', batch_id] })
      qc.invalidateQueries({ queryKey: ['sapi-batches', tenant?.id] })
      toast.success('Ternak berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal tambah ternak: ' + err.message),
  })
}
// ── useBulkAddSapiAnimals ─────────────────────────────────────────────────────
export function useBulkAddSapiAnimals() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ batch_id, animals }) => {
      const rows = animals.map(a => ({
        tenant_id: tenant.id,
        batch_id,
        ear_tag: a.ear_tag,
        species: a.species || 'sapi',
        breed: a.breed || null,
        sex: a.sex,
        entry_date: a.entry_date,
        entry_weight_kg: parseFloat(a.entry_weight_kg),
        entry_age_months: a.entry_age_months ? parseInt(a.entry_age_months) : null,
        age_confidence: a.age_confidence || 'estimasi',
        acquisition_type: a.acquisition_type || 'beli',
        purchase_price_idr: a.purchase_price_idr ? parseInt(a.purchase_price_idr) : 0,
        source: a.source || null,
        notes: a.notes || null,
        status: 'active',
        latest_weight_kg: parseFloat(a.entry_weight_kg),
        latest_weight_date: a.entry_date,
      }))

      const { error } = await supabase
        .from('sapi_penggemukan_animals')
        .insert(rows)
      if (error) throw error

      // Increment counter for each animal added
      for (let i = 0; i < animals.length; i++) {
        await supabase.rpc('increment_sapi_batch_animal_count', { p_batch_id: batch_id })
      }
    },
    onSuccess: (_, { batch_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-animals', batch_id] })
      qc.invalidateQueries({ queryKey: ['sapi-batches', tenant?.id] })
      toast.success('Semua ternak berhasil ditambahkan!')
    },
    onError: (err) => toast.error('Gagal tambah bulk: ' + err.message),
  })
}


// ── useUpdateSapiAnimal ───────────────────────────────────────────────────────
export function useUpdateSapiAnimal() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ animalId, batchId, updates }) => {
      const { error } = await supabase
        .from('sapi_penggemukan_animals')
        .update(updates)
        .eq('id', animalId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { batchId }) => {
      qc.invalidateQueries({ queryKey: ['sapi-animals', batchId] })
      qc.invalidateQueries({ queryKey: ['sapi-animal-detail'] })
      toast.success('Data ternak diperbarui')
    },
    onError: (err) => toast.error('Gagal update: ' + err.message),
  })
}

export function useUpdateSapiAnimalStatus() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ animalId, batchId, status, exit_date }) => {
      const { error } = await supabase
        .from('sapi_penggemukan_animals')
        .update({ status, exit_date })
        .eq('id', animalId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { batchId }) => {
      qc.invalidateQueries({ queryKey: ['sapi-animals', batchId] })
      qc.invalidateQueries({ queryKey: ['sapi-animal-detail'] })
      qc.invalidateQueries({ queryKey: ['sapi-batches', tenant?.id] })
    },
    onError: (err) => toast.error('Gagal update status: ' + err.message),
  })
}

// ── useAddSapiWeightRecord ────────────────────────────────────────────────────
export function useAddSapiWeightRecord() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      animal_id, batch_id,
      entry_date, entry_weight_kg,
      weigh_date, weight_kg, bcs,
      weigh_method = 'timbang_langsung', chest_girth_cm,
      notes,
    }) => {
      const days_in_farm = calcSapiHariDiFarm(entry_date, weigh_date)

      // Cari record sebelumnya untuk ADG incremental
      const { data: prev } = await supabase
        .from('sapi_penggemukan_weight_records')
        .select('weigh_date, weight_kg')
        .eq('animal_id', animal_id)
        .eq('is_deleted', false)
        .order('weigh_date', { ascending: false })
        .limit(1)

      let adg_since_last = null
      if (prev?.length) {
        const daysDiff = calcSapiHariDiFarm(prev[0].weigh_date, weigh_date)
        adg_since_last = daysDiff > 0
          ? calcSapiADG(prev[0].weight_kg, weight_kg, daysDiff)
          : null
      } else {
        adg_since_last = days_in_farm > 0
          ? calcSapiADG(entry_weight_kg, weight_kg, days_in_farm)
          : null
      }

      const { error } = await supabase
        .from('sapi_penggemukan_weight_records')
        .insert({
          tenant_id: tenant.id,
          animal_id, batch_id,
          weigh_date, weight_kg, bcs,
          days_in_farm, adg_since_last,
          weigh_method, chest_girth_cm,
          notes,
        })
      if (error) throw error
      // DB trigger trg_sapi_sync_animal_latest_weight otomatis update latest_weight_*
    },
    onSuccess: (_, { animal_id, batch_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-weight-records', animal_id] })
      qc.invalidateQueries({ queryKey: ['sapi-animals', batch_id] })
      qc.invalidateQueries({ queryKey: ['sapi-animal-detail', animal_id] })
      toast.success('Data timbang disimpan')
    },
    onError: (err) => toast.error('Gagal simpan timbang: ' + err.message),
  })
}

// ── useAddSapiFeedLog ─────────────────────────────────────────────────────────
export function useAddSapiFeedLog() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      batch_id, log_date, kandang_name, animal_count,
      hijauan_kg, konsentrat_kg, dedak_kg, other_feed_kg,
      sisa_pakan_kg, feed_cost_idr, notes,
    }) => {
      const { error } = await supabase
        .from('sapi_penggemukan_feed_logs')
        .upsert({
          tenant_id: tenant.id,
          batch_id, log_date, kandang_name, animal_count,
          hijauan_kg: hijauan_kg ?? 0,
          konsentrat_kg: konsentrat_kg ?? 0,
          dedak_kg: dedak_kg ?? 0,
          other_feed_kg: other_feed_kg ?? 0,
          sisa_pakan_kg: sisa_pakan_kg ?? 0,
          feed_cost_idr, notes,
        }, {
          onConflict: 'batch_id,kandang_name,log_date',
          ignoreDuplicates: false,
        })
      if (error) throw error
    },
    onSuccess: (_, { batch_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-feed-logs', batch_id] })
      toast.success('Log pakan disimpan')
    },
    onError: (err) => toast.error('Gagal simpan pakan: ' + err.message),
  })
}

// ── useDeleteSapiFeedLog ──────────────────────────────────────────────────────
export function useDeleteSapiFeedLog() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ logId, batch_id }) => {
      const { error } = await supabase
        .from('sapi_penggemukan_feed_logs')
        .update({ is_deleted: true })
        .eq('id', logId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { batch_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-feed-logs', batch_id] })
      toast.success('Log pakan dihapus')
    },
    onError: (err) => toast.error('Gagal hapus: ' + err.message),
  })
}

// ── useAddSapiHealthLog ───────────────────────────────────────────────────────
export function useAddSapiHealthLog() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      animal_id, batch_id, log_date, log_type,
      symptoms, action_taken, medicine_name, medicine_dose,
      handled_by, outcome,
      vaccine_name, vaccine_next_due,
      death_cause, death_weight_kg, loss_value_idr,
      notes,
    }) => {
      const { error } = await supabase
        .from('sapi_penggemukan_health_logs')
        .insert({
          tenant_id: tenant.id,
          animal_id, batch_id, log_date, log_type,
          symptoms, action_taken, medicine_name, medicine_dose,
          handled_by, outcome,
          vaccine_name, vaccine_next_due,
          death_cause, death_weight_kg, loss_value_idr,
          notes,
        })
      if (error) throw error

      // Jika kematian → update status ekor ke 'dead'
      if (log_type === 'kematian') {
        await supabase
          .from('sapi_penggemukan_animals')
          .update({ status: 'dead', exit_date: log_date })
          .eq('id', animal_id)
          .eq('tenant_id', tenant.id)
        // DB trigger trg_sapi_sync_batch_mortality update mortality_count otomatis
      }
    },
    onSuccess: (_, { batch_id, animal_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-health-logs', batch_id] })
      qc.invalidateQueries({ queryKey: ['sapi-animals', batch_id] })
      qc.invalidateQueries({ queryKey: ['sapi-animal-detail', animal_id] })
      qc.invalidateQueries({ queryKey: ['sapi-batches'] })
      toast.success('Log kesehatan disimpan')
    },
    onError: (err) => toast.error('Gagal simpan log kesehatan: ' + err.message),
  })
}

// ── useDeleteSapiHealthLog ────────────────────────────────────────────────────
export function useDeleteSapiHealthLog() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ logId, batch_id }) => {
      const { error } = await supabase
        .from('sapi_penggemukan_health_logs')
        .update({ is_deleted: true })
        .eq('id', logId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { batch_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-health-logs', batch_id] })
      toast.success('Log kesehatan dihapus')
    },
    onError: (err) => toast.error('Gagal hapus: ' + err.message),
  })
}

// ── useAddSapiSale ────────────────────────────────────────────────────────────
export function useAddSapiSale() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      batch_id, sale_date,
      buyer_name, buyer_type, buyer_contact,
      animal_ids, animal_count, total_weight_kg, avg_weight_kg,
      price_type, price_amount, total_revenue_idr,
      payment_method, is_paid, paid_date,
      has_skkh, has_surat_jalan, invoice_number, notes,
    }) => {
      const { error: saleErr } = await supabase
        .from('sapi_penggemukan_sales')
        .insert({
          tenant_id: tenant.id,
          batch_id, sale_date,
          buyer_name, buyer_type, buyer_contact,
          animal_ids, animal_count, total_weight_kg, avg_weight_kg,
          price_type, price_amount, total_revenue_idr,
          payment_method, is_paid: is_paid ?? false, paid_date,
          has_skkh: has_skkh ?? false,
          has_surat_jalan: has_surat_jalan ?? false,
          invoice_number, notes,
        })
      if (saleErr) throw saleErr

      const { error: animalErr } = await supabase
        .from('sapi_penggemukan_animals')
        .update({ status: 'sold', exit_date: sale_date })
        .in('id', animal_ids)
        .eq('tenant_id', tenant.id)
      if (animalErr) throw animalErr
    },
    onSuccess: (_, { batch_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-sales', batch_id] })
      qc.invalidateQueries({ queryKey: ['sapi-animals', batch_id] })
      qc.invalidateQueries({ queryKey: ['sapi-batches'] })
      toast.success('Penjualan berhasil dicatat')
    },
    onError: (err) => toast.error('Gagal catat penjualan: ' + err.message),
  })
}

// ── useDeleteSapiWeightRecord ─────────────────────────────────────────────────
export function useDeleteSapiWeightRecord() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ recordId, animal_id, batch_id }) => {
      const { error } = await supabase
        .from('sapi_penggemukan_weight_records')
        .update({ is_deleted: true })
        .eq('id', recordId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { animal_id, batch_id }) => {
      qc.invalidateQueries({ queryKey: ['sapi-weight-records', animal_id] })
      qc.invalidateQueries({ queryKey: ['sapi-animals', batch_id] })
      toast.success('Data timbang dihapus')
    },
    onError: (err) => toast.error('Gagal hapus: ' + err.message),
  })
}

// ── useCreateSapiKandang ──────────────────────────────────────────────────────
export function useCreateSapiKandang() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async (payload) => {
      const { batch_id: _ignored, ...rest } = payload
      const { error } = await supabase
        .from('sapi_kandangs')
        .insert({ tenant_id: tenant.id, ...rest })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sapi-kandangs', tenant?.id] })
      toast.success('Kandang berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal buat kandang: ' + err.message),
  })
}

// ── useMoveApiAnimalToKandang ─────────────────────────────────────────────────
export function useMoveSapiAnimalToKandang() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ animalId, kandangId, kandangSlot, batchId }) => {
      const { error } = await supabase
        .from('sapi_penggemukan_animals')
        .update({ kandang_id: kandangId, kandang_slot: kandangSlot })
        .eq('id', animalId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { batchId }) => {
      qc.invalidateQueries({ queryKey: ['sapi-animals', batchId] })
    },
    onError: (err) => toast.error('Gagal memindahkan ternak: ' + err.message),
  })
}

// ── useUpdateSapiKandangPosition ─────────────────────────────────────────────
export function useUpdateSapiKandangPosition() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ kandangId, grid_x, grid_y }) => {
      const { error } = await supabase
        .from('sapi_kandangs')
        .update({ grid_x, grid_y })
        .eq('id', kandangId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sapi-kandangs', tenant?.id] })
    },
    onError: (err) => toast.error('Gagal simpan posisi: ' + err.message),
  })
}

// ── useUpdateSapiKandang ──────────────────────────────────────────────────────
export function useUpdateSapiKandang() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ kandangId, updates }) => {
      const { error } = await supabase
        .from('sapi_kandangs')
        .update(updates)
        .eq('id', kandangId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sapi-kandangs', tenant?.id] })
      toast.success('Data kandang diperbarui')
    },
    onError: (err) => toast.error('Gagal update kandang: ' + err.message),
  })
}

// ── useEnsureSapiHoldingPen ───────────────────────────────────────────────────
export function useEnsureSapiHoldingPen() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async () => {
      const { data, error: checkErr } = await supabase
        .from('sapi_kandangs')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('is_holding', true)
        .limit(1)

      if (checkErr) throw checkErr

      if (!data || data.length === 0) {
        const { error: insertErr } = await supabase
          .from('sapi_kandangs')
          .insert({
            tenant_id: tenant.id,
            name: 'Kandang Holding',
            capacity: 9999,
            is_holding: true,
            notes: 'Area penampungan sapi belum dialokasikan',
          })
        if (insertErr) throw insertErr
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sapi-kandangs', tenant?.id] })
    },
  })
}
