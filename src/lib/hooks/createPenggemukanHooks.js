/**
 * TernakOS — Penggemukan Hook Factory
 * 
 * Creates a complete set of React Query hooks for any penggemukan (fattening) business model.
 * Usage:
 *   const dombaHooks = createPenggemukanHooks('domba')
 *   const kambingHooks = createPenggemukanHooks('kambing')
 * 
 * Each call generates hooks that target the correct table prefix.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'
import {
  calcADG, calcHariDiFarm,
} from './useKdPenggemukanData'

export function createPenggemukanHooks(prefix) {
  // Table names
  const T = {
    batches: `${prefix}_penggemukan_batches`,
    animals: `${prefix}_penggemukan_animals`,
    weights: `${prefix}_penggemukan_weight_records`,
    feed: `${prefix}_penggemukan_feed_logs`,
    health: `${prefix}_penggemukan_health_logs`,
    sales: `${prefix}_penggemukan_sales`,
    kandangs: `${prefix}_kandangs`,
    costs: `${prefix}_penggemukan_operational_costs`,
  }

  // Query key prefix for cache isolation
  const K = prefix

  // ─── QUERY HOOKS ──────────────────────────────────────────────────────────

  function useBatches() {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-batches`, tenant?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.batches)
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('start_date', { ascending: false })
        if (error) throw error

        // Auto-heal logic
        if (data) {
          await Promise.all(data.map(async (b) => {
            const { count } = await supabase.from(T.animals).select('*', { count: 'exact', head: true }).eq('batch_id', b.id).eq('is_deleted', false)
            if (count !== null && count !== b.total_animals) {
              supabase.from(T.batches).update({ total_animals: count }).eq('id', b.id)
              b.total_animals = count
            }
          }))
        }

        return data ?? []
      },
      enabled: !!tenant?.id,
    })
  }

  function useActiveBatches() {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-active-batches`, tenant?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.batches)
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('status', 'active')
          .eq('is_deleted', false)
          .order('start_date', { ascending: false })
        if (error) throw error

        // Auto-heal logic
        if (data) {
          await Promise.all(data.map(async (b) => {
            const { count } = await supabase.from(T.animals).select('*', { count: 'exact', head: true }).eq('batch_id', b.id).eq('is_deleted', false)
            if (count !== null && count !== b.total_animals) {
              supabase.from(T.batches).update({ total_animals: count }).eq('id', b.id)
              b.total_animals = count
            }
          }))
        }

        return data ?? []
      },
      enabled: !!tenant?.id,
    })
  }

  function useAnimals(batchId) {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-animals`, batchId],
      queryFn: async () => {
        const parseW = (v) => v ? Number(String(v).replace(',', '.')) || 0 : 0
        const { data, error } = await supabase
          .from(T.animals)
          .select(`*, ${T.weights}(*)`)
          .eq('tenant_id', tenant.id)
          .eq('batch_id', batchId)
          .eq('is_deleted', false)
          .order('entry_date', { ascending: true })
        if (error) throw error
        return (data ?? []).map(a => ({ 
          ...a, 
          entry_weight_kg: parseW(a.entry_weight_kg),
          latest_weight_kg: parseW(a.latest_weight_kg) || parseW(a.entry_weight_kg),
          entry_age_months: a.age_estimate || '',
          weight_records: a[`${prefix}_penggemukan_weight_records`] || a.weight_records || []
        }))
      },
      enabled: !!batchId && !!tenant?.id,
    })
  }

  function useAnimalDetail(animalId) {
    return useQuery({
      queryKey: [`${K}-animal-detail`, animalId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.animals)
          .select(`*, ${T.weights}(*), ${T.health}(*)`)
          .eq('id', animalId)
          .eq('is_deleted', false)
          .single()
        if (error) throw error
        if (!data) return null
        return { 
          ...data, 
          entry_age_months: data.age_estimate,
          weight_records: data[`${prefix}_penggemukan_weight_records`] || data.weight_records || []
        }
      },
      enabled: !!animalId,
    })
  }

  function useWeightRecords(animalId) {
    return useQuery({
      queryKey: [`${K}-weight-records`, animalId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.weights)
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

  function useFeedLogs(batchId) {
    return useQuery({
      queryKey: [`${K}-feed-logs`, batchId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.feed)
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

  function useHealthLogs(batchId) {
    return useQuery({
      queryKey: [`${K}-health-logs`, batchId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.health)
          .select(`*, ${T.animals}(ear_tag, breed)`)
          .eq('batch_id', batchId)
          .eq('is_deleted', false)
          .order('log_date', { ascending: false })
        if (error) throw error
        return data ?? []
      },
      enabled: !!batchId,
    })
  }

  function useBatchWeightHistory(batchId) {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-batch-weight-history`, tenant?.id, batchId],
      queryFn: async () => {
        if (!batchId) return []
        const { data, error } = await supabase
          .from(T.weights)
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

  function useSales(batchId) {
    return useQuery({
      queryKey: [`${K}-sales`, batchId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.sales)
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

  function useOperationalCosts(batchId) {
    return useQuery({
      queryKey: [`${K}-operational-costs`, batchId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.costs)
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

  function useKandangs() {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-kandangs`, tenant?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.kandangs)
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

  function useAnimalsByBatches(batchIds) {
    const { tenant } = useAuth()
    const ids = Array.isArray(batchIds) ? batchIds : [batchIds]
    return useQuery({
      queryKey: [`${K}-animals-multi`, ids],
      queryFn: async () => {
        if (ids.length === 0) return []
        const parseW = (v) => v ? Number(String(v).replace(',', '.')) || 0 : 0
        const { data, error } = await supabase
          .from(T.animals)
          .select(`*, ${T.weights}(*)`)
          .eq('tenant_id', tenant.id)
          .in('batch_id', ids)
          .eq('is_deleted', false)
          .order('entry_date', { ascending: true })
        if (error) throw error
        return (data ?? []).map(a => ({ 
          ...a, 
          entry_weight_kg: parseW(a.entry_weight_kg),
          latest_weight_kg: parseW(a.latest_weight_kg) || parseW(a.entry_weight_kg),
          entry_age_months: a.age_estimate || '',
          weight_records: a[`${prefix}_penggemukan_weight_records`] || a.weight_records || []
        }))
      },
      enabled: ids.length > 0 && !!tenant?.id,
    })
  }

  function useBatchWeightHistoryByBatches(batchIds) {
    const { tenant } = useAuth()
    const ids = Array.isArray(batchIds) ? batchIds : [batchIds]
    return useQuery({
      queryKey: [`${K}-batch-weight-history-multi`, tenant?.id, ids],
      queryFn: async () => {
        if (ids.length === 0) return []
        const { data, error } = await supabase
          .from(T.weights)
          .select('*')
          .eq('tenant_id', tenant.id)
          .in('batch_id', ids)
          .eq('is_deleted', false)
          .order('weigh_date', { ascending: true })
        if (error) throw error
        return data ?? []
      },
      enabled: ids.length > 0 && !!tenant?.id,
    })
  }

  function useSalesByBatches(batchIds) {
    const { tenant } = useAuth()
    const ids = Array.isArray(batchIds) ? batchIds : [batchIds]
    return useQuery({
      queryKey: [`${K}-sales-multi`, ids],
      queryFn: async () => {
        if (ids.length === 0) return []
        const { data, error } = await supabase
          .from(T.sales)
          .select('*')
          .eq('tenant_id', tenant.id)
          .in('batch_id', ids)
          .eq('is_deleted', false)
          .order('sale_date', { ascending: false })
        if (error) throw error
        return data ?? []
      },
      enabled: ids.length > 0 && !!tenant?.id,
    })
  }

  function useFeedLogsByBatches(batchIds) {
    const { tenant } = useAuth()
    const ids = Array.isArray(batchIds) ? batchIds : [batchIds]
    return useQuery({
      queryKey: [`${K}-feed-logs-multi`, ids],
      queryFn: async () => {
        if (ids.length === 0) return []
        const { data, error } = await supabase
          .from(T.feed)
          .select('*')
          .eq('tenant_id', tenant.id)
          .in('batch_id', ids)
          .eq('is_deleted', false)
          .order('log_date', { ascending: false })
        if (error) throw error
        return data ?? []
      },
      enabled: ids.length > 0 && !!tenant?.id,
    })
  }

  function useOperationalCostsByBatches(batchIds) {
    const { tenant } = useAuth()
    const ids = Array.isArray(batchIds) ? batchIds : [batchIds]
    return useQuery({
      queryKey: [`${K}-operational-costs-multi`, ids],
      queryFn: async () => {
        if (ids.length === 0) return []
        const { data, error } = await supabase
          .from(T.costs)
          .select('*')
          .eq('tenant_id', tenant.id)
          .in('batch_id', ids)
          .eq('is_deleted', false)
          .order('log_date', { ascending: false })
        if (error) throw error
        return data ?? []
      },
      enabled: ids.length > 0 && !!tenant?.id,
    })
  }

  function useHealthLogsByBatches(batchIds) {
    const { tenant } = useAuth()
    const ids = Array.isArray(batchIds) ? batchIds : [batchIds]
    return useQuery({
      queryKey: [`${K}-health-logs-multi`, ids],
      queryFn: async () => {
        if (ids.length === 0) return []
        const { data, error } = await supabase
          .from(T.health)
          .select(`*, ${T.animals}(ear_tag, breed)`)
          .eq('tenant_id', tenant.id)
          .in('batch_id', ids)
          .eq('is_deleted', false)
          .order('log_date', { ascending: false })
        if (error) throw error
        return data ?? []
      },
      enabled: ids.length > 0 && !!tenant?.id,
    })
  }

  // ─── MUTATION HOOKS ────────────────────────────────────────────────────────

  function useCreateBatch() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ batch_code, kandang_name, start_date, target_end_date, notes }) => {
        const { error } = await supabase.from(T.batches).insert({
          tenant_id: tenant.id,
          batch_code, kandang_name, start_date, target_end_date, notes,
          status: 'active',
        })
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: [`${K}-active-batches`, tenant?.id] })
        toast.success('Batch berhasil dibuat')
      },
      onError: (err) => toast.error('Gagal buat batch: ' + err.message),
    })
  }

  function useCloseBatch() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ batchId, kpiFinal }) => {
        const { error } = await supabase
          .from(T.batches)
          .update({ status: 'closed', ...kpiFinal })
          .eq('id', batchId)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: [`${K}-active-batches`, tenant?.id] })
        toast.success('Batch ditutup')
      },
      onError: (err) => toast.error('Gagal tutup batch: ' + err.message),
    })
  }

  function useAddAnimal() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({
        batch_id, ear_tag, breed, sex, age_estimate,
        entry_age_months, age_confidence, acquisition_type,
        entry_date, entry_weight_kg, entry_bcs, entry_condition,
        purchase_price_idr, source, kandang_slot, notes,
        quarantine_start, quarantine_end, quarantine_notes,
      }) => {
        const { error: animalErr } = await supabase
          .from(T.animals)
          .insert({
            tenant_id: tenant.id,
            batch_id, ear_tag, breed, sex,
            age_estimate: age_estimate || entry_age_months ? String(age_estimate || entry_age_months) : null,
            entry_date, entry_weight_kg, entry_bcs, entry_condition,
            purchase_price_idr: purchase_price_idr || 0,
            source, kandang_slot, notes,
            quarantine_start, quarantine_end, quarantine_notes,
            status: 'active',
            latest_weight_kg: entry_weight_kg,
            latest_weight_date: entry_date,
          })
        if (animalErr) throw animalErr

        // Sync total_animals in the batch after insert
        const { count, error: countErr } = await supabase
          .from(T.animals)
          .select('*', { count: 'exact', head: true })
          .eq('batch_id', batch_id)
          .eq('is_deleted', false)

        if (!countErr && count !== null) {
          await supabase
            .from(T.batches)
            .update({ total_animals: count })
            .eq('id', batch_id)
        }
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-animals`] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        toast.success('Ternak berhasil ditambahkan')
      },
      onError: (err) => toast.error('Gagal tambah ternak: ' + err.message),
    })
  }

  function useBulkAddAnimals() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ batch_id, animals }) => {
        const parseW = (v) => v ? Number(String(v).replace(',', '.')) || 0 : 0
        const rows = animals.map(a => {
          const { entry_age_months, age_confidence, acquisition_type, ...rest } = a
          return {
            ...rest,
            tenant_id: tenant.id,
            batch_id,
            entry_weight_kg: parseW(a.entry_weight_kg),
            entry_bcs: a.entry_bcs ? String(a.entry_bcs).replace(',', '.') : null,
            age_estimate: entry_age_months ? String(entry_age_months) : null,
            latest_weight_kg: parseW(a.entry_weight_kg),
            latest_weight_date: a.entry_date,
            status: 'active'
          }
        })

        const { error: insertErr } = await supabase
          .from(T.animals)
          .insert(rows)
        if (insertErr) throw insertErr

        // Sync total_animals in the batch after bulk insert
        const { count, error: countErr } = await supabase
          .from(T.animals)
          .select('*', { count: 'exact', head: true })
          .eq('batch_id', batch_id)
          .eq('is_deleted', false)

        if (!countErr && count !== null) {
          await supabase
            .from(T.batches)
            .update({ total_animals: count })
            .eq('id', batch_id)
        }
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-animals`] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        toast.success('Semua ternak berhasil ditambahkan!')
      },
      onError: (err) => toast.error('Gagal tambah bulk: ' + err.message),
    })
  }

  function useUpdateAnimal() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ animalId, batchId, updates }) => {
        const { entry_age_months, age_confidence, acquisition_type, ...rest } = updates
        const finalUpdates = { ...rest }
        if (entry_age_months !== undefined) {
          finalUpdates.age_estimate = entry_age_months ? String(entry_age_months) : null
        }
        
        const { error } = await supabase
          .from(T.animals)
          .update(finalUpdates)
          .eq('id', animalId)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: (_, { animalId, batchId }) => {
        qc.invalidateQueries({ queryKey: [`${K}-animals`] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-animal-detail`, animalId] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        toast.success('Data ternak diperbarui')
      },
      onError: (err) => toast.error('Gagal update ternak: ' + err.message),
    })
  }

  function useUpdateAnimalStatus() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ animalId, batchId, status, exit_date }) => {
        const { error } = await supabase
          .from(T.animals)
          .update({ status, exit_date })
          .eq('id', animalId)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: (_, { batchId }) => {
        qc.invalidateQueries({ queryKey: [`${K}-animals`, batchId] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-animal-detail`] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
      },
      onError: (err) => toast.error('Gagal update status: ' + err.message),
    })
  }

  function useAddWeightRecord() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({
        animal_id, batch_id, entry_date, entry_weight_kg,
        weigh_date, weight_kg, bcs, famacha_score, notes,
      }) => {
        const days_in_farm = calcHariDiFarm(entry_date, weigh_date)

        const { data: prev } = await supabase
          .from(T.weights)
          .select('weigh_date, weight_kg')
          .eq('animal_id', animal_id)
          .eq('is_deleted', false)
          .order('weigh_date', { ascending: false })
          .limit(1)

        let adg_since_last = null
        if (prev?.length) {
          const daysDiff = calcHariDiFarm(prev[0].weigh_date, weigh_date)
          adg_since_last = daysDiff > 0 ? calcADG(prev[0].weight_kg, weight_kg, daysDiff) : null
        } else {
          adg_since_last = days_in_farm > 0 ? calcADG(entry_weight_kg, weight_kg, days_in_farm) : null
        }

        const { error } = await supabase
          .from(T.weights)
          .insert({
            tenant_id: tenant.id,
            animal_id, batch_id,
            weigh_date, weight_kg, bcs, famacha_score,
            days_in_farm, adg_since_last, notes,
          })
        if (error) throw error
      },
      onSuccess: (_, { animal_id, batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-weight-records`, animal_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animal-detail`, animal_id] })
        toast.success('Data timbang disimpan')
      },
      onError: (err) => toast.error('Gagal simpan timbang: ' + err.message),
    })
  }

  function useAddFeedLog() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({
        batch_id, log_date, kandang_name, animal_count,
        hijauan_kg, konsentrat_kg, dedak_kg, other_feed_kg,
        sisa_pakan_kg, feed_orts_category, feed_cost_idr, notes,
      }) => {
        const h = hijauan_kg ?? 0
        const k = konsentrat_kg ?? 0
        const d = dedak_kg ?? 0
        const o = other_feed_kg ?? 0
        const s = sisa_pakan_kg ?? 0
        const consumed_kg = Math.max(0, h + k + d + o - s)

        const { error } = await supabase
          .from(T.feed)
          .upsert({
            tenant_id: tenant.id,
            batch_id, log_date, kandang_name, animal_count,
            hijauan_kg: h,
            konsentrat_kg: k,
            dedak_kg: d,
            other_feed_kg: o,
            sisa_pakan_kg: s,
            consumed_kg,
            feed_orts_category,
            feed_cost_idr, notes,
          }, {
            onConflict: 'batch_id,kandang_name,log_date',
            ignoreDuplicates: false,
          })
        if (error) throw error
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-feed-logs`, batch_id] })
        toast.success('Log pakan disimpan')
      },
      onError: (err) => toast.error('Gagal simpan pakan: ' + err.message),
    })
  }

  function useAddHealthLog() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({
        animal_id, batch_id, log_date, log_type,
        diagnosis, symptoms, action_taken, medicine_name, medicine_dose,
        handled_by, outcome,
        vaccine_name, vaccine_next_due,
        death_cause, death_weight_kg, loss_value_idr,
        notes,
      }) => {
        const { error } = await supabase
          .from(T.health)
          .insert({
            tenant_id: tenant.id,
            animal_id, batch_id, log_date, log_type,
            diagnosis, symptoms, action_taken, medicine_name, medicine_dose,
            handled_by, outcome,
            vaccine_name, vaccine_next_due,
            death_cause, death_weight_kg, loss_value_idr,
            notes,
          })
        if (error) throw error

        if (log_type === 'kematian') {
          await supabase
            .from(T.animals)
            .update({ status: 'dead', exit_date: log_date })
            .eq('id', animal_id)
            .eq('tenant_id', tenant.id)
        }
      },
      onSuccess: async (_, vars) => {
        const NOTIF_CFG = {
          kematian:        { type: 'laporan_kematian',  title: 'Laporan Kematian Ternak' },
          medis:           { type: 'laporan_kesehatan', title: 'Laporan Kesehatan Masuk' },
          sakit:           { type: 'laporan_kesehatan', title: 'Laporan Kesehatan Masuk' },
          insiden:         { type: 'laporan_insiden',   title: 'Laporan Insiden Masuk' },
          insiden_pakan:   { type: 'laporan_insiden',   title: 'Laporan Insiden Pakan' },
          insiden_kandang: { type: 'laporan_insiden',   title: 'Laporan Insiden Kandang' },
        }
        const cfg = NOTIF_CFG[vars.log_type]
        if (cfg) {
          const subject = vars.diagnosis || vars.symptoms || 'Tidak ada keterangan'
          const body = `${subject}. Tindakan: ${vars.action_taken || 'Belum ditangani'}.`
          await supabase.from('notifications').insert({
            tenant_id: tenant.id,
            type: cfg.type,
            title: cfg.title,
            body,
            action_url: `/peternak/peternak_${prefix}_penggemukan/kesehatan`,
            metadata: { batch_id: vars.batch_id, animal_id: vars.animal_id, log_type: vars.log_type },
          })
        }

        qc.invalidateQueries({ queryKey: [`${K}-health-logs`, vars.batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals`, vars.batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-animal-detail`, vars.animal_id] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`] })
        toast.success('Log kesehatan disimpan')
      },
      onError: (err) => toast.error('Gagal simpan log kesehatan: ' + err.message),
    })
  }

  function useAddSale() {
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
          .from(T.sales)
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
          .from(T.animals)
          .update({ status: 'sold', exit_date: sale_date })
          .in('id', animal_ids)
          .eq('tenant_id', tenant.id)
        if (animalErr) throw animalErr
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-sales`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`] })
        toast.success('Penjualan berhasil dicatat')
      },
      onError: (err) => toast.error('Gagal catat penjualan: ' + err.message),
    })
  }

  function useDeleteFeedLog() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ logId, batch_id }) => {
        const { error } = await supabase
          .from(T.feed)
          .update({ is_deleted: true })
          .eq('id', logId)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-feed-logs`, batch_id] })
        toast.success('Log pakan dihapus')
      },
      onError: (err) => toast.error('Gagal hapus: ' + err.message),
    })
  }

  function useDeleteWeightRecord() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ recordId, animal_id, batch_id }) => {
        const { error } = await supabase
          .from(T.weights)
          .update({ is_deleted: true })
          .eq('id', recordId)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: (_, { animal_id, batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-weight-records`, animal_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals`, batch_id] })
        toast.success('Data timbang dihapus')
      },
      onError: (err) => toast.error('Gagal hapus: ' + err.message),
    })
  }

  function useDeleteSale() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ saleId, animalIds, batchId }) => {
        // 1. Delete the sale record (or set is_deleted)
        const { error: saleErr } = await supabase
          .from(T.sales)
          .update({ is_deleted: true })
          .eq('id', saleId)
          .eq('tenant_id', tenant.id)
        if (saleErr) throw saleErr

        // 2. Revert animal status to 'active'
        const { error: animalErr } = await supabase
          .from(T.animals)
          .update({ status: 'active', exit_date: null })
          .in('id', animalIds)
          .eq('tenant_id', tenant.id)
        if (animalErr) throw animalErr
      },
      onSuccess: (_, { batchId }) => {
        qc.invalidateQueries({ queryKey: [`${K}-sales`, batchId] })
        qc.invalidateQueries({ queryKey: [`${K}-animals`, batchId] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`] })
        toast.success('Penjualan dihapus & ternak kembali aktif')
      },
      onError: (err) => toast.error('Gagal hapus penjualan: ' + err.message),
    })
  }

  function useUpdateSale() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ saleId, batch_id, ...updates }) => {
        const { error } = await supabase
          .from(T.sales)
          .update(updates)
          .eq('id', saleId)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-sales`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`] })
        toast.success('Data penjualan diperbarui')
      },
      onError: (err) => toast.error('Gagal perbarui data: ' + err.message),
    })
  }

  function useCreateKandang() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async (payload) => {
        // strip batch_id if accidentally passed — kandangs are now tenant-level
        const { batch_id: _ignored, ...rest } = payload
        const { error } = await supabase
          .from(T.kandangs)
          .insert({ tenant_id: tenant.id, ...rest })
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-kandangs`, tenant?.id] })
        toast.success('Kandang berhasil ditambahkan')
      },
      onError: (err) => toast.error('Gagal buat kandang: ' + err.message),
    })
  }

  function useUpdateKandangPosition() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ kandangId, grid_x, grid_y }) => {
        const { error } = await supabase
          .from(T.kandangs)
          .update({ grid_x, grid_y })
          .eq('id', kandangId)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-kandangs`, tenant?.id] })
      }
    })
  }

  function useUpdateKandang() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ kandangId, updates }) => {
        const { error } = await supabase
          .from(T.kandangs)
          .update(updates)
          .eq('id', kandangId)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-kandangs`, tenant?.id] })
        toast.success('Kandang diperbarui')
      },
      onError: (err) => toast.error('Gagal update: ' + err.message),
    })
  }

  function useDeleteKandang() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ kandangId }) => {
        const { error } = await supabase
          .from(T.kandangs)
          .delete()
          .eq('id', kandangId)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-kandangs`, tenant?.id] })
        toast.success('Kandang dihapus')
      },
      onError: (err) => toast.error('Gagal hapus: ' + err.message),
    })
  }

  function useMoveAnimalToKandang() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ animalId, kandangId, kandangSlot }) => {
        const { error } = await supabase
          .from(T.animals)
          .update({ kandang_id: kandangId, kandang_slot: kandangSlot })
          .eq('id', animalId)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onMutate: async ({ animalId, kandangId, kandangSlot }) => {
        // Cancel in-flight refetches so they don't overwrite our optimistic update
        await qc.cancelQueries({ queryKey: [`${K}-animals-multi`] })

        // Snapshot every matching cache entry for rollback
        const snapshots = qc.getQueriesData({ queryKey: [`${K}-animals-multi`] })

        // Optimistically move the animal in every animals-multi cache entry
        qc.setQueriesData({ queryKey: [`${K}-animals-multi`] }, (old) => {
          if (!Array.isArray(old)) return old
          return old.map(a =>
            a.id === animalId ? { ...a, kandang_id: kandangId, kandang_slot: kandangSlot } : a
          )
        })

        return { snapshots }
      },
      onError: (err, _vars, context) => {
        // Roll back to the snapshotted values
        context?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data))
        toast.error('Gagal memindahkan ternak: ' + err.message)
      },
      onSettled: (_, _err, { batchId }) => {
        // Always re-sync with the server after the mutation resolves
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-animals`, batchId] })
      },
    })
  }

  function useDeleteHealthLog() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ logId, batch_id }) => {
        const { error } = await supabase
          .from(T.health)
          .update({ is_deleted: true })
          .eq('id', logId)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-health-logs`, batch_id] })
        toast.success('Log kesehatan dihapus')
      },
      onError: (err) => toast.error('Gagal hapus: ' + err.message),
    })
  }

  function useAddOperationalCost() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async (payload) => {
        const { error } = await supabase
          .from(T.costs)
          .insert({ tenant_id: tenant.id, ...payload })
        if (error) throw error
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-operational-costs`, batch_id] })
        toast.success('Biaya operasional dicatat')
      },
      onError: (err) => toast.error('Gagal catat biaya: ' + err.message),
    })
  }

  function useDeleteOperationalCost() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ costId }) => {
        const { error } = await supabase
          .from(T.costs)
          .update({ is_deleted: true })
          .eq('id', costId)
          .eq('tenant_id', tenant.id)
        if (error) throw error
      },
      onSuccess: (_, { batchId }) => {
        qc.invalidateQueries({ queryKey: [`${K}-operational-costs`, batchId] })
        toast.success('Biaya operasional dihapus')
      },
      onError: (err) => toast.error('Gagal hapus: ' + err.message),
    })
  }

  function useEnsureHoldingPen() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async () => {
        const { data, error: checkErr } = await supabase
          .from(T.kandangs)
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('is_holding', true)
          .limit(1)

        if (checkErr) throw checkErr

        if (!data || data.length === 0) {
          const { error: insertErr } = await supabase
            .from(T.kandangs)
            .insert({
              tenant_id: tenant.id,
              name: 'Kandang Holding',
              capacity: 9999,
              is_holding: true,
              notes: 'Area penampungan ternak belum dialokasikan',
            })
          if (insertErr) throw insertErr
        }
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-kandangs`, tenant?.id] })
      },
    })
  }

  // ─── RETURN ALL HOOKS ──────────────────────────────────────────────────────

  return {
    // Queries
    useBatches,
    useActiveBatches,
    useAnimals,
    useAnimalDetail,
    useWeightRecords,
    useFeedLogs,
    useHealthLogs,
    useBatchWeightHistory,
    useSales,
    useKandangs,
    // Mutations
    useCreateBatch,
    useCloseBatch,
    useAddAnimal,
    useBulkAddAnimals,
    useUpdateAnimal,
    useUpdateAnimalStatus,
    useAddWeightRecord,
    useAddFeedLog,
    useAddHealthLog,
    useAddSale,
    useDeleteFeedLog,
    useDeleteWeightRecord,
    useDeleteHealthLog,
    useUpdateSale,
    useDeleteSale,
    useCreateKandang,
    useUpdateKandang,
    useUpdateKandangPosition,
    useDeleteKandang,
    useMoveAnimalToKandang,
    useEnsureHoldingPen,
    useAnimalsByBatches,
    useBatchWeightHistoryByBatches,
    useSalesByBatches,
    useFeedLogsByBatches,
    useOperationalCostsByBatches,
    useHealthLogsByBatches,
    useOperationalCosts,
    useAddOperationalCost,
    useDeleteOperationalCost,
  }
}

