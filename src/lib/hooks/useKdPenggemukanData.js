import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

// ─── Pure KPI Calculations ────────────────────────────────────────────────────

/**
 * ADG (Average Daily Gain) dalam gram/hari
 * @param {number} beratAwal  - kg saat masuk
 * @param {number} beratAkhir - kg saat ini / saat jual
 * @param {number} hariDiFarm - jumlah hari dari entry_date
 */
export const calcADG = (beratAwal, beratAkhir, hariDiFarm) => {
  if (!hariDiFarm || hariDiFarm <= 0) return 0
  const gain = (beratAkhir - beratAwal) * 1000 // kg → gram
  return Number((gain / hariDiFarm).toFixed(1))
}

/**
 * FCR kambing/domba = total pakan BK (kg) / total PBBH (kg)
 * PBBH = Pertambahan Bobot Badan Hidup (total gain semua ekor)
 * @param {number} totalPakanBK - total pakan dikonsumsi dalam kg bahan kering
 * @param {number} totalPBBH    - total pertambahan bobot semua ekor (kg)
 */
export const calcFCRKambing = (totalPakanBK, totalPBBH) => {
  if (!totalPBBH || totalPBBH <= 0) return 0
  return Number((totalPakanBK / totalPBBH).toFixed(2))
}

/**
 * Mortalitas batch dalam persen
 */
export const calcMortalitasKambing = (mati, totalMasuk) => {
  if (!totalMasuk || totalMasuk <= 0) return 0
  return Number(((mati / totalMasuk) * 100).toFixed(1))
}

/**
 * BEP harga jual per kg hidup
 * @param {number} totalBiaya  - total biaya per ekor (beli + pakan + kesehatan + TK + dll)
 * @param {number} beratJualKg - bobot saat dijual
 */
export const calcBEP = (totalBiaya, beratJualKg) => {
  if (!beratJualKg || beratJualKg <= 0) return 0
  return Math.ceil(totalBiaya / beratJualKg)
}

/**
 * R/C Ratio
 */
export const calcRCRatio = (totalPenerimaan, totalBiaya) => {
  if (!totalBiaya || totalBiaya <= 0) return 0
  return Number((totalPenerimaan / totalBiaya).toFixed(2))
}

/**
 * Hitung hari di farm dari entry_date sampai hari ini (atau exit_date)
 */
export const calcHariDiFarm = (entryDate, exitDate = null) => {
  if (!entryDate) return 0
  const end = exitDate ? new Date(exitDate) : new Date()
  const diff = end.getTime() - new Date(entryDate).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

/**
 * ADG running untuk satu ekor dari riwayat weight_records
 * Ambil record paling awal dan paling akhir
 * @param {Array} weightRecords - array { weigh_date, weight_kg }
 * @param {string} entryDate
 * @param {number} entryWeightKg
 */
export const calcADGFromRecords = (weightRecords, entryDate, entryWeightKg) => {
  if (!weightRecords?.length) return null
  const sorted = [...weightRecords].sort((a, b) =>
    new Date(a.weigh_date) - new Date(b.weigh_date)
  )
  const latest = sorted[sorted.length - 1]
  const hari = calcHariDiFarm(entryDate, latest.weigh_date)
  if (!hari) return null
  return calcADG(entryWeightKg, latest.weight_kg, hari)
}


// ─── useKdBatches ─────────────────────────────────────────────────────────────
// Semua batch penggemukan milik tenant ini

export function useKdBatches() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['kd-batches', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_penggemukan_batches')
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

// ─── useKdActiveBatches ───────────────────────────────────────────────────────
// Hanya batch berstatus active — untuk Beranda

export function useKdActiveBatches() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['kd-active-batches', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_penggemukan_batches')
        .select('*')
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

// ─── useKdAnimals ─────────────────────────────────────────────────────────────
// Semua ekor dalam satu batch, dengan weight_records nested

export function useKdAnimals(batchId) {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['kd-animals', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_penggemukan_animals')
        .select(`
          *,
          kd_penggemukan_weight_records(*)
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

// ─── useKdAnimalDetail ────────────────────────────────────────────────────────
// Satu ekor dengan weight_records + health_logs

export function useKdAnimalDetail(animalId) {
  return useQuery({
    queryKey: ['kd-animal-detail', animalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_penggemukan_animals')
        .select(`
          *,
          kd_penggemukan_weight_records(*),
          kd_penggemukan_health_logs(*)
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

// ─── useKdWeightRecords ───────────────────────────────────────────────────────
// Riwayat timbang satu ekor, urut tanggal asc (untuk chart ADG)

export function useKdWeightRecords(animalId) {
  return useQuery({
    queryKey: ['kd-weight-records', animalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_penggemukan_weight_records')
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

// ─── useKdFeedLogs ────────────────────────────────────────────────────────────
// Log pakan harian satu batch

export function useKdFeedLogs(batchId) {
  return useQuery({
    queryKey: ['kd-feed-logs', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_penggemukan_feed_logs')
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

// ─── useKdHealthLogs ──────────────────────────────────────────────────────────
// Log kesehatan satu batch (semua ekor)

export function useKdHealthLogs(batchId) {
  return useQuery({
    queryKey: ['kd-health-logs', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_penggemukan_health_logs')
        .select(`
          *,
          kd_penggemukan_animals(ear_tag, species, breed)
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

// ─── useKdSales ───────────────────────────────────────────────────────────────
// Penjualan satu batch

export function useKdSales(batchId) {
  return useQuery({
    queryKey: ['kd-sales', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_penggemukan_sales')
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


// ─── MUTATIONS ────────────────────────────────────────────────────────────────

// ── useCreateKdBatch ──────────────────────────────────────────────────────────
export function useCreateKdBatch() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ batch_code, kandang_name, start_date, target_end_date, notes }) => {
      const { error } = await supabase.from('kd_penggemukan_batches').insert({
        tenant_id: tenant.id,
        batch_code, kandang_name, start_date, target_end_date, notes,
        status: 'active',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kd-batches', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['kd-active-batches', tenant?.id] })
      toast.success('Batch berhasil dibuat')
    },
    onError: (err) => toast.error('Gagal buat batch: ' + err.message),
  })
}

// ── useCloseBatch ─────────────────────────────────────────────────────────────
// Tutup batch → isi KPI final, set status closed
export function useCloseKdBatch() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ batchId, kpiFinal }) => {
      // kpiFinal: { end_date, avg_adg_gram, avg_fcr, avg_entry_weight_kg,
      //   avg_exit_weight_kg, total_feed_cost_idr, total_revenue_idr,
      //   total_cogs_idr, net_profit_idr, rc_ratio, alive_count, sold_count }
      const { error } = await supabase
        .from('kd_penggemukan_batches')
        .update({ status: 'closed', ...kpiFinal })
        .eq('id', batchId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { batchId }) => {
      qc.invalidateQueries({ queryKey: ['kd-batches', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['kd-active-batches', tenant?.id] })
      toast.success('Batch ditutup')
    },
    onError: (err) => toast.error('Gagal tutup batch: ' + err.message),
  })
}

// ── useAddKdAnimal ────────────────────────────────────────────────────────────
export function useAddKdAnimal() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      batch_id, ear_tag, species, breed, sex, age_estimate,
      entry_date, entry_weight_kg, entry_bcs, entry_condition,
      purchase_price_idr, source, kandang_slot,
      quarantine_start, quarantine_end, quarantine_notes, notes,
    }) => {
      const { error: animalErr } = await supabase
        .from('kd_penggemukan_animals')
        .insert({
          tenant_id: tenant.id,
          batch_id, ear_tag, species, breed, sex, age_estimate,
          entry_date, entry_weight_kg, entry_bcs, entry_condition,
          purchase_price_idr, source, kandang_slot,
          quarantine_start, quarantine_end, quarantine_notes, notes,
          status: 'active',
          // latest_weight = entry_weight saat pertama masuk
          latest_weight_kg: entry_weight_kg,
          latest_weight_date: entry_date,
        })
      if (animalErr) throw animalErr

      // Recount total_animals di batch via RPC
      const { error: batchErr } = await supabase.rpc('increment_kd_batch_animal_count', {
        p_batch_id: batch_id,
      })
      if (batchErr) throw batchErr
    },
    onSuccess: (_, { batch_id }) => {
      qc.invalidateQueries({ queryKey: ['kd-animals', batch_id] })
      qc.invalidateQueries({ queryKey: ['kd-batches', tenant?.id] })
      toast.success('Ternak berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal tambah ternak: ' + err.message),
  })
}

// ── useUpdateKdAnimalStatus ───────────────────────────────────────────────────
// Ubah status ekor: sold / dead / culled
export function useUpdateKdAnimalStatus() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ animalId, batchId, status, exit_date }) => {
      const { error } = await supabase
        .from('kd_penggemukan_animals')
        .update({ status, exit_date })
        .eq('id', animalId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { batchId }) => {
      qc.invalidateQueries({ queryKey: ['kd-animals', batchId] })
      qc.invalidateQueries({ queryKey: ['kd-animal-detail'] })
      qc.invalidateQueries({ queryKey: ['kd-batches', tenant?.id] })
    },
    onError: (err) => toast.error('Gagal update status: ' + err.message),
  })
}

// ── useAddKdWeightRecord ──────────────────────────────────────────────────────
export function useAddKdWeightRecord() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      animal_id, batch_id, entry_date, entry_weight_kg,
      weigh_date, weight_kg, bcs, notes,
    }) => {
      // Hitung days_in_farm dan adg_since_last
      const days_in_farm = calcHariDiFarm(entry_date, weigh_date)

      // Cari record sebelumnya untuk hitung ADG incremental
      const { data: prev } = await supabase
        .from('kd_penggemukan_weight_records')
        .select('weigh_date, weight_kg')
        .eq('animal_id', animal_id)
        .eq('is_deleted', false)
        .order('weigh_date', { ascending: false })
        .limit(1)

      let adg_since_last = null
      if (prev?.length) {
        const prevDate = prev[0].weigh_date
        const prevWeight = prev[0].weight_kg
        const daysDiff = calcHariDiFarm(prevDate, weigh_date)
        adg_since_last = daysDiff > 0
          ? calcADG(prevWeight, weight_kg, daysDiff)
          : null
      } else {
        // Pertama kali timbang — ADG dari entry
        adg_since_last = days_in_farm > 0
          ? calcADG(entry_weight_kg, weight_kg, days_in_farm)
          : null
      }

      const { error } = await supabase
        .from('kd_penggemukan_weight_records')
        .insert({
          tenant_id: tenant.id,
          animal_id, batch_id,
          weigh_date, weight_kg, bcs,
          days_in_farm, adg_since_last, notes,
        })
      if (error) throw error
      // Trigger DB otomatis update latest_weight_* di kd_penggemukan_animals
    },
    onSuccess: (_, { animal_id, batch_id }) => {
      qc.invalidateQueries({ queryKey: ['kd-weight-records', animal_id] })
      qc.invalidateQueries({ queryKey: ['kd-animals', batch_id] })
      qc.invalidateQueries({ queryKey: ['kd-animal-detail', animal_id] })
      toast.success('Data timbang disimpan')
    },
    onError: (err) => toast.error('Gagal simpan timbang: ' + err.message),
  })
}

// ── useAddKdFeedLog ───────────────────────────────────────────────────────────
export function useAddKdFeedLog() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      batch_id, log_date, kandang_name, animal_count,
      hijauan_kg, konsentrat_kg, dedak_kg, other_feed_kg,
      sisa_pakan_kg, feed_cost_idr, notes,
    }) => {
      const { error } = await supabase
        .from('kd_penggemukan_feed_logs')
        .upsert({
          tenant_id: tenant.id,
          batch_id, log_date, kandang_name, animal_count,
          hijauan_kg:    hijauan_kg    ?? 0,
          konsentrat_kg: konsentrat_kg ?? 0,
          dedak_kg:      dedak_kg      ?? 0,
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
      qc.invalidateQueries({ queryKey: ['kd-feed-logs', batch_id] })
      toast.success('Log pakan disimpan')
    },
    onError: (err) => toast.error('Gagal simpan pakan: ' + err.message),
  })
}

// ── useAddKdHealthLog ─────────────────────────────────────────────────────────
export function useAddKdHealthLog() {
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
        .from('kd_penggemukan_health_logs')
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
          .from('kd_penggemukan_animals')
          .update({ status: 'dead', exit_date: log_date })
          .eq('id', animal_id)
          .eq('tenant_id', tenant.id)
        // DB trigger kd_sync_batch_mortality akan update mortality_count otomatis
      }
    },
    onSuccess: (_, { batch_id, animal_id }) => {
      qc.invalidateQueries({ queryKey: ['kd-health-logs', batch_id] })
      qc.invalidateQueries({ queryKey: ['kd-animals', batch_id] })
      qc.invalidateQueries({ queryKey: ['kd-animal-detail', animal_id] })
      qc.invalidateQueries({ queryKey: ['kd-batches'] })
      toast.success('Log kesehatan disimpan')
    },
    onError: (err) => toast.error('Gagal simpan log kesehatan: ' + err.message),
  })
}

// ── useAddKdSale ──────────────────────────────────────────────────────────────
export function useAddKdSale() {
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
      // 1. Insert sale record
      const { error: saleErr } = await supabase
        .from('kd_penggemukan_sales')
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

      // 2. Update setiap ekor yang terjual → status 'sold'
      const { error: animalErr } = await supabase
        .from('kd_penggemukan_animals')
        .update({ status: 'sold', exit_date: sale_date })
        .in('id', animal_ids)
        .eq('tenant_id', tenant.id)
      if (animalErr) throw animalErr
    },
    onSuccess: (_, { batch_id }) => {
      qc.invalidateQueries({ queryKey: ['kd-sales', batch_id] })
      qc.invalidateQueries({ queryKey: ['kd-animals', batch_id] })
      qc.invalidateQueries({ queryKey: ['kd-batches'] })
      toast.success('Penjualan berhasil dicatat')
    },
    onError: (err) => toast.error('Gagal catat penjualan: ' + err.message),
  })
}

// ── useDeleteKdFeedLog ────────────────────────────────────────────────────────
export function useDeleteKdFeedLog() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ logId, batch_id }) => {
      const { error } = await supabase
        .from('kd_penggemukan_feed_logs')
        .update({ is_deleted: true })
        .eq('id', logId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { batch_id }) => {
      qc.invalidateQueries({ queryKey: ['kd-feed-logs', batch_id] })
      toast.success('Log pakan dihapus')
    },
    onError: (err) => toast.error('Gagal hapus: ' + err.message),
  })
}

// ── useDeleteKdWeightRecord ───────────────────────────────────────────────────
export function useDeleteKdWeightRecord() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ recordId, animal_id, batch_id }) => {
      const { error } = await supabase
        .from('kd_penggemukan_weight_records')
        .update({ is_deleted: true })
        .eq('id', recordId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { animal_id, batch_id }) => {
      qc.invalidateQueries({ queryKey: ['kd-weight-records', animal_id] })
      qc.invalidateQueries({ queryKey: ['kd-animals', batch_id] })
      toast.success('Data timbang dihapus')
    },
    onError: (err) => toast.error('Gagal hapus: ' + err.message),
  })
}

// ─── KANDANG MANAGEMENT HOOKS ───────────────────────────────────────────────

export function useKdKandangs(batchId) {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['kd-kandangs', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kd_kandangs')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('batch_id', batchId)
        .eq('is_active', true)
        .order('is_holding', { ascending: false }) // Holding selalu di atas (atau di bawah, tergantung query. false dulu baru true? false ascending = false, true. descending = true, false. Jadi holding di depan)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!batchId && !!tenant?.id,
  })
}

export function useCreateKdKandang() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async (payload) => {
      // payload: { batch_id, name, capacity, panjang_m, lebar_m, is_holding, notes }
      const { error } = await supabase
        .from('kd_kandangs')
        .insert({
          tenant_id: tenant.id,
          ...payload
        })
      if (error) throw error
    },
    onSuccess: (_, { batch_id }) => {
      qc.invalidateQueries({ queryKey: ['kd-kandangs', batch_id] })
      toast.success('Kandang berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal buat kandang: ' + err.message)
  })
}

export function useMoveAnimalToKandang() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ animalId, kandangId, kandangSlot, batchId }) => {
      const { error } = await supabase
        .from('kd_penggemukan_animals')
        .update({ 
          kandang_id: kandangId,
          kandang_slot: kandangSlot // backward compatibility
        })
        .eq('id', animalId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { batchId }) => {
      qc.invalidateQueries({ queryKey: ['kd-animals', batchId] })
      // Don't toast here to avoid spam during drag and drop, maybe handled later
    },
    onError: (err) => toast.error('Gagal memindahkan ternak: ' + err.message)
  })
}

export function useEnsureHoldingPen() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async (batchId) => {
      // Check if holding pen exists
      const { data, error: checkErr } = await supabase
        .from('kd_kandangs')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('batch_id', batchId)
        .eq('is_holding', true)
        .limit(1)
      
      if (checkErr) throw checkErr

      if (!data || data.length === 0) {
        // Create holding pen
        const { error: insertErr } = await supabase
          .from('kd_kandangs')
          .insert({
            tenant_id: tenant.id,
            batch_id: batchId,
            name: 'Kandang Holding',
            capacity: 9999, // unlimited
            is_holding: true,
            notes: 'Area penampungan domba belum dialokasikan'
          })
        if (insertErr) throw insertErr
      }
    },
    onSuccess: (_, batchId) => {
      qc.invalidateQueries({ queryKey: ['kd-kandangs', batchId] })
    }
  })
}
