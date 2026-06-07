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

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  differenceInCalendarDays, parseISO, min as dateMin, max as dateMax,
  eachDayOfInterval, startOfDay,
} from 'date-fns'
import { supabase } from '../supabase'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { logError } from '@/lib/logger/errorLogger'
import { useAuth } from './useAuth'
import { toast } from 'sonner'
import { calculateSimpleHpp } from '../hpp/penggemukanHppCalcs'
import {
  calcADG, calcHariDiFarm,
} from './useKdPenggemukanData'
import { useTenantWorkerPayments } from './usePeternakTaskData'
import { normalizeSupabaseError } from '@/lib/supabaseErrorHandler'

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
        return (data ?? []).map(a => {
          const wRecords = a[`${prefix}_penggemukan_weight_records`] || a.weight_records || []
          const sorted = [...wRecords].sort((x, y) => new Date(y.weigh_date) - new Date(x.weigh_date))
          const latestRecord = sorted[0]
          return {
            ...a,
            entry_weight_kg: parseW(a.entry_weight_kg),
            latest_weight_kg: latestRecord ? parseW(latestRecord.weight_kg) : (parseW(a.latest_weight_kg) || parseW(a.entry_weight_kg)),
            latest_weight_date: latestRecord?.weigh_date ?? a.latest_weight_date,
            entry_age_months: a.age_estimate || '',
            weight_records: wRecords,
          }
        })
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
          .select(`*, batch:${T.batches}(batch_code)`)
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
    const ids = React.useMemo(() => Array.isArray(batchIds) ? batchIds : [batchIds], [batchIds])
    const idsKey = React.useMemo(() => [...new Set(ids.filter(Boolean))].sort().join(','), [ids])
    return useQuery({
      queryKey: [`${K}-animals-multi`, tenant?.id, idsKey],
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
        return (data ?? []).map(a => {
          const wRecords = a[`${prefix}_penggemukan_weight_records`] || a.weight_records || []
          const sorted = [...wRecords].sort((x, y) => new Date(y.weigh_date) - new Date(x.weigh_date))
          const latestRecord = sorted[0]
          return {
            ...a,
            entry_weight_kg: parseW(a.entry_weight_kg),
            latest_weight_kg: latestRecord ? parseW(latestRecord.weight_kg) : (parseW(a.latest_weight_kg) || parseW(a.entry_weight_kg)),
            latest_weight_date: latestRecord?.weigh_date ?? a.latest_weight_date,
            entry_age_months: a.age_estimate || '',
            weight_records: wRecords,
          }
        })
      },
      enabled: ids.length > 0 && !!tenant?.id,
    })
  }

  function useBatchWeightHistoryByBatches(batchIds) {
    const { tenant } = useAuth()
    const ids = React.useMemo(() => Array.isArray(batchIds) ? batchIds : [batchIds], [batchIds])
    const idsKey = React.useMemo(() => [...new Set(ids.filter(Boolean))].sort().join(','), [ids])
    return useQuery({
      queryKey: [`${K}-batch-weight-history-multi`, tenant?.id, idsKey],
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
    const ids = React.useMemo(() => Array.isArray(batchIds) ? batchIds : [batchIds], [batchIds])
    const idsKey = React.useMemo(() => [...new Set(ids.filter(Boolean))].sort().join(','), [ids])
    return useQuery({
      queryKey: [`${K}-sales-multi`, tenant?.id, idsKey],
      queryFn: async () => {
        if (ids.length === 0) return []
        const { data, error } = await supabase
          .from(T.sales)
          .select(`*, batch:${T.batches}(batch_code)`)
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
    const ids = React.useMemo(() => Array.isArray(batchIds) ? batchIds : [batchIds], [batchIds])
    const idsKey = React.useMemo(() => [...new Set(ids.filter(Boolean))].sort().join(','), [ids])
    return useQuery({
      queryKey: [`${K}-feed-logs-multi`, tenant?.id, idsKey],
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
    const ids = React.useMemo(() => Array.isArray(batchIds) ? batchIds : [batchIds], [batchIds])
    const idsKey = React.useMemo(() => [...new Set(ids.filter(Boolean))].sort().join(','), [ids])
    return useQuery({
      queryKey: [`${K}-operational-costs-multi`, tenant?.id, idsKey],
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
    const ids = React.useMemo(() => Array.isArray(batchIds) ? batchIds : [batchIds], [batchIds])
    const idsKey = React.useMemo(() => [...new Set(ids.filter(Boolean))].sort().join(','), [ids])
    return useQuery({
      queryKey: [`${K}-health-logs-multi`, tenant?.id, idsKey],
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

  function useBatchRecord(batchId) {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-batch-record`, batchId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.batches)
          .select('*')
          .eq('id', batchId)
          .single()
        if (error) throw error
        return data
      },
      enabled: !!batchId && !!tenant?.id,
    })
  }

  // ─── MUTATION HOOKS ────────────────────────────────────────────────────────

  function useCreateBatch() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ batch_code, kandang_name, start_date, target_end_date, notes, hpp_mode }) => {
        const { error } = await supabase.from(T.batches).insert({
          tenant_id: tenant.id,
          batch_code, kandang_name, start_date, target_end_date, notes,
          hpp_mode: hpp_mode || 'simple',
          status: 'active',
        })
        if (error) {
          logSupabaseError(error, {
            table: T.batches,
            operation: 'insert',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.batch.create',
          })
          throw error
        }
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: [`${K}-active-batches`, tenant?.id] })
        toast.success('Batch berhasil dibuat')
      },
      onError: (err) => toast.error('Gagal buat batch: ' + normalizeSupabaseError(err).message),
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
        if (error) {
          logSupabaseError(error, { table: T.batches, operation: 'update', component: 'createPenggemukanHooks', actionName: 'peternak.batch.close' })
          throw error
        }
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: [`${K}-active-batches`, tenant?.id] })
        toast.success('Batch ditutup')
      },
      onError: (err) => toast.error('Gagal tutup batch: ' + normalizeSupabaseError(err).message),
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
            age_confidence: age_confidence || 'estimasi',
            acquisition_type: acquisition_type || 'beli',
            entry_date, entry_weight_kg, entry_bcs, entry_condition,
            purchase_price_idr: purchase_price_idr || 0,
            source, kandang_slot, notes,
            quarantine_start, quarantine_end, quarantine_notes,
            status: 'active',
            latest_weight_kg: entry_weight_kg,
            latest_weight_date: entry_date,
          })
        if (animalErr) {
          logSupabaseError(animalErr, {
            table: T.animals,
            operation: 'insert',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.animal.add',
          })
          throw animalErr
        }

        // Sync total_animals in the batch after insert
        const { count, error: countErr } = await supabase
          .from(T.animals)
          .select('*', { count: 'exact', head: true })
          .eq('batch_id', batch_id)
          .eq('is_deleted', false)

        if (countErr) {
          // Non-fatal: animal already inserted, count failed → log partial state
          logError({
            level: 'error',
            source: 'supabase',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.animal.add.count_sync',
            error: countErr,
            metadata: { table: T.animals, operation: 'count', partial: true, batch_id },
          })
        } else if (count !== null) {
          const { error: batchUpdErr } = await supabase
            .from(T.batches)
            .update({ total_animals: count })
            .eq('id', batch_id)
          if (batchUpdErr) {
            logError({
              level: 'error',
              source: 'supabase',
              component: 'createPenggemukanHooks',
              actionName: 'peternak.animal.add.batch_sync',
              error: batchUpdErr,
              metadata: { table: T.batches, operation: 'update', partial: true, batch_id, expected_count: count },
            })
          }
        }
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-animals`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: [`${K}-active-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: ['ternak-limit', tenant?.id, 'domba_kambing'] })
        toast.success('Ternak berhasil ditambahkan')
      },
      onError: (err) => toast.error('Gagal tambah ternak: ' + normalizeSupabaseError(err).message),
    })
  }

  function useBulkAddAnimals() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ batch_id, animals }) => {
        const parseW = (v) => v ? Number(String(v).replace(',', '.')) || 0 : 0
        const rows = animals.map(a => {
          const { entry_age_months, age_confidence, acquisition_type, price_per_kg, ...rest } = a
          const entryWeight = parseW(a.entry_weight_kg)
          const priceKg = a.price_per_kg ? Number(a.price_per_kg) : 0
          const purchasePrice = a.purchase_price_idr 
            ? Number(a.purchase_price_idr)
            : (entryWeight > 0 && priceKg > 0 ? Math.round(entryWeight * priceKg) : 0)

          return {
            ...rest,
            tenant_id: tenant.id,
            batch_id,
            entry_weight_kg: entryWeight,
            entry_bcs: a.entry_bcs ? String(a.entry_bcs).replace(',', '.') : null,
            age_estimate: entry_age_months ? String(entry_age_months) : null,
            age_confidence: age_confidence || 'estimasi',
            acquisition_type: acquisition_type || 'beli',
            purchase_price_idr: purchasePrice,
            latest_weight_kg: entryWeight,
            latest_weight_date: a.entry_date,
            status: 'active'
          }
        })

        const { error: insertErr } = await supabase
          .from(T.animals)
          .insert(rows)
        if (insertErr) {
          logSupabaseError(insertErr, {
            table: T.animals,
            operation: 'insert',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.animal.bulk_add',
          })
          throw insertErr
        }

        // Sync total_animals in the batch after bulk insert
        const { count, error: countErr } = await supabase
          .from(T.animals)
          .select('*', { count: 'exact', head: true })
          .eq('batch_id', batch_id)
          .eq('is_deleted', false)

        if (countErr) {
          logError({
            level: 'error',
            source: 'supabase',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.animal.bulk_add.count_sync',
            error: countErr,
            metadata: { table: T.animals, operation: 'count', partial: true, batch_id, expected_rows: rows.length },
          })
        } else if (count !== null) {
          const { error: batchUpdErr } = await supabase
            .from(T.batches)
            .update({ total_animals: count })
            .eq('id', batch_id)
          if (batchUpdErr) {
            logError({
              level: 'error',
              source: 'supabase',
              component: 'createPenggemukanHooks',
              actionName: 'peternak.animal.bulk_add.batch_sync',
              error: batchUpdErr,
              metadata: { table: T.batches, operation: 'update', partial: true, batch_id, expected_count: count },
            })
          }
        }
      },
      onSuccess: (_, variables) => {
        qc.invalidateQueries({ queryKey: [`${K}-animals`, variables.batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: [`${K}-active-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: ['ternak-limit', tenant?.id, 'domba_kambing'] })
        const count = variables?.animals?.length || 0
        toast.success(`Berhasil menyimpan ${count} data ternak`)
      },
      onError: () => toast.error('Gagal menyimpan data ternak. Coba lagi atau hubungi admin.'),
    })
  }

  function useUpdateAnimal() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ animalId, _batchId, updates }) => {
        const { entry_age_months, ...rest } = updates
        const finalUpdates = { ...rest }
        if (entry_age_months !== undefined) {
          finalUpdates.age_estimate = entry_age_months ? String(entry_age_months) : null
        }
        
        const { error } = await supabase
          .from(T.animals)
          .update(finalUpdates)
          .eq('id', animalId)
          .eq('tenant_id', tenant.id)
        if (error) {
          logSupabaseError(error, { table: T.animals, operation: 'update', component: 'createPenggemukanHooks', actionName: 'peternak.animal.update' })
          throw error
        }
      },
      onSuccess: (_, { animalId, _batchId }) => {
        qc.invalidateQueries({ queryKey: [`${K}-animals`, _batchId] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-animal-detail`, animalId] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        toast.success('Data ternak diperbarui')
      },
      onError: (err) => toast.error('Gagal update ternak: ' + normalizeSupabaseError(err).message),
    })
  }

  function useUpdateAnimalStatus() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ animalId, _batchId, status, exit_date }) => {
        const { error } = await supabase
          .from(T.animals)
          .update({ status, exit_date })
          .eq('id', animalId)
          .eq('tenant_id', tenant.id)
        if (error) {
          logSupabaseError(error, { table: T.animals, operation: 'update', component: 'createPenggemukanHooks', actionName: 'peternak.animal.update_status' })
          throw error
        }
      },
      onSuccess: (_, { animalId, _batchId }) => {
        qc.invalidateQueries({ queryKey: [`${K}-animals`, _batchId] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-animal-detail`, animalId] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: [`${K}-active-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: ['ternak-limit', tenant?.id, 'domba_kambing'] })
      },
      onError: (err) => toast.error('Gagal update status: ' + normalizeSupabaseError(err).message),
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

        const insertPayload = {
          tenant_id: tenant.id,
          animal_id, batch_id,
          weigh_date, weight_kg, bcs,
          days_in_farm, adg_since_last, notes,
        }

        if (prefix === 'domba') {
          insertPayload.famacha_score = famacha_score
        }

        const { error } = await supabase
          .from(T.weights)
          .insert(insertPayload)
        if (error) {
          logSupabaseError(error, { table: T.weights, operation: 'insert', component: 'createPenggemukanHooks', actionName: 'peternak.weight_record.create' })
          throw error
        }

        // ── Sync latest_weight_kg on the animal record ──
        // This ensures the DB column stays up-to-date for any query
        // that reads it directly (e.g. multi-batch hooks, reports).
        const { data: allW } = await supabase
          .from(T.weights)
          .select('weigh_date, weight_kg')
          .eq('animal_id', animal_id)
          .eq('is_deleted', false)
          .order('weigh_date', { ascending: false })
          .limit(1)
        const latestW = allW?.[0]
        if (latestW) {
          const { error: animalSyncErr } = await supabase
            .from(T.animals)
            .update({
              latest_weight_kg: latestW.weight_kg,
              latest_weight_date: latestW.weigh_date,
            })
            .eq('id', animal_id)
          if (animalSyncErr) {
            // Non-fatal: weight saved, animal latest_weight_kg sync failed.
            logError({
              level: 'error', source: 'supabase', component: 'createPenggemukanHooks',
              actionName: 'peternak.weight_record.create.animal_sync',
              error: animalSyncErr,
              metadata: { table: T.animals, operation: 'update', partial: true, step: 'animal_latest_weight_sync', animal_id, batch_id },
            })
          }
        }
      },
      onSuccess: (_, { animal_id, batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-weight-records`, animal_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-animal-detail`, animal_id] })
        // Invalidate chart data sources so Beranda growth chart refreshes
        qc.invalidateQueries({ queryKey: [`${K}-batch-weight-history`, tenant?.id, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-batch-weight-history-multi`] })
        toast.success('Data timbang disimpan')
      },
      onError: (err) => toast.error('Gagal simpan timbang: ' + normalizeSupabaseError(err).message),
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

        const upsertPayload = {
          tenant_id: tenant.id,
          batch_id, log_date, kandang_name, animal_count,
          hijauan_kg: h,
          konsentrat_kg: k,
          dedak_kg: d,
          other_feed_kg: o,
          sisa_pakan_kg: s,
          feed_cost_idr, notes,
        }

        if (prefix === 'domba') {
          upsertPayload.feed_orts_category = feed_orts_category
        }

        const { error } = await supabase
          .from(T.feed)
          .upsert(upsertPayload, {
            onConflict: 'batch_id,kandang_name,log_date',
            ignoreDuplicates: false,
          })
        if (error) {
          logSupabaseError(error, { table: T.feed, operation: 'upsert', component: 'createPenggemukanHooks', actionName: 'peternak.feed_log.create' })
          throw error
        }
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-feed-logs`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-feed-logs-multi`] })
        toast.success('Log pakan disimpan')
      },
      onError: (err) => toast.error('Gagal simpan pakan: ' + normalizeSupabaseError(err).message),
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
        treatment_cost_idr,
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
            treatment_cost_idr: treatment_cost_idr || 0,
            notes,
          })
        if (error) {
          logSupabaseError(error, {
            table: T.health,
            operation: 'insert',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.health_log.create',
          })
          throw error
        }

        if (log_type === 'kematian') {
          const { error: animalErr } = await supabase
            .from(T.animals)
            .update({ status: 'dead', exit_date: log_date })
            .eq('id', animal_id)
            .eq('tenant_id', tenant.id)
          if (animalErr) {
            // Partial commit: health record saved but animal status not flipped to 'dead'.
            logError({
              level: 'error',
              source: 'supabase',
              component: 'createPenggemukanHooks',
              actionName: 'peternak.health_log.create.animal_sync',
              error: animalErr,
              metadata: {
                table: T.animals,
                operation: 'update',
                partial: true,
                step: 'animal_dead_status_sync',
                animal_id,
                batch_id,
              },
            })
          }
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
        qc.invalidateQueries({ queryKey: [`${K}-health-logs-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-animals`, vars.batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-animal-detail`, vars.animal_id] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: [`${K}-active-batches`, tenant?.id] })
        toast.success('Log kesehatan disimpan')
      },
      onError: (err) => toast.error('Gagal simpan log kesehatan: ' + normalizeSupabaseError(err).message),
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
        if (saleErr) {
          logSupabaseError(saleErr, {
            table: T.sales,
            operation: 'insert',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.sale.create',
          })
          throw saleErr
        }

        const { error: animalErr } = await supabase
          .from(T.animals)
          .update({ status: 'sold', exit_date: sale_date })
          .in('id', animal_ids)
          .eq('tenant_id', tenant.id)
        if (animalErr) {
          // Partial commit: sale row inserted but animals not marked 'sold'.
          // Flag for superadmin reconciliation.
          logError({
            level: 'error',
            source: 'supabase',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.sale.create.animal_sync',
            error: animalErr,
            metadata: {
              table: T.animals,
              operation: 'update',
              partial: true,
              batch_id,
              animal_count: Array.isArray(animal_ids) ? animal_ids.length : 0,
            },
          })
          throw animalErr
        }
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-sales`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-sales-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-animals`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: [`${K}-active-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: ['ternak-limit', tenant?.id, 'domba_kambing'] })
        toast.success('Penjualan berhasil dicatat')
      },
      onError: (err) => toast.error('Gagal catat penjualan: ' + normalizeSupabaseError(err).message),
    })
  }

  function useDeleteFeedLog() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ logId, _batch_id }) => {
        const { error } = await supabase
          .from(T.feed)
          .update({ is_deleted: true })
          .eq('id', logId)
          .eq('tenant_id', tenant.id)
        if (error) {
          logSupabaseError(error, {
            table: T.feed,
            operation: 'update',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.feed_log.delete',
          })
          throw error
        }
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-feed-logs`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-feed-logs-multi`] })
        toast.success('Log pakan dihapus')
      },
      onError: (err) => toast.error('Gagal hapus: ' + normalizeSupabaseError(err).message),
    })
  }

  function useDeleteWeightRecord() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ recordId, _animal_id, _batch_id }) => {
        const { error } = await supabase
          .from(T.weights)
          .update({ is_deleted: true })
          .eq('id', recordId)
          .eq('tenant_id', tenant.id)
        if (error) {
          logSupabaseError(error, {
            table: T.weights,
            operation: 'update',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.weight_record.delete',
          })
          throw error
        }
      },
      onSuccess: (_, { animal_id, batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-weight-records`, animal_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-animal-detail`, animal_id] })
        qc.invalidateQueries({ queryKey: [`${K}-batch-weight-history`, tenant?.id, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-batch-weight-history-multi`] })
        toast.success('Data timbang dihapus')
      },
      onError: (err) => toast.error('Gagal hapus: ' + normalizeSupabaseError(err).message),
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
        if (saleErr) {
          logSupabaseError(saleErr, {
            table: T.sales,
            operation: 'update',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.sale.delete',
          })
          throw saleErr
        }

        // 2. Revert animal status to 'active'
        const { error: animalErr } = await supabase
          .from(T.animals)
          .update({ status: 'active', exit_date: null })
          .in('id', animalIds)
          .eq('tenant_id', tenant.id)
        if (animalErr) {
          // Partial commit: sale soft-deleted but animals still flagged 'sold'.
          logError({
            level: 'error',
            source: 'supabase',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.sale.delete.animal_sync',
            error: animalErr,
            metadata: {
              table: T.animals,
              operation: 'update',
              partial: true,
              step: 'animal_revert_active',
              sale_id: saleId,
              batch_id: batchId,
              animal_count: Array.isArray(animalIds) ? animalIds.length : 0,
            },
          })
          throw animalErr
        }
      },
      onSuccess: (_, { batchId }) => {
        qc.invalidateQueries({ queryKey: [`${K}-sales`, batchId] })
        qc.invalidateQueries({ queryKey: [`${K}-sales-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-animals`, batchId] })
        qc.invalidateQueries({ queryKey: [`${K}-animals-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: [`${K}-active-batches`, tenant?.id] })
        qc.invalidateQueries({ queryKey: ['ternak-limit', tenant?.id, 'domba_kambing'] })
        toast.success('Penjualan dihapus & ternak kembali aktif')
      },
      onError: (err) => toast.error('Gagal hapus penjualan: ' + normalizeSupabaseError(err).message),
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
        if (error) {
          logSupabaseError(error, {
            table: T.sales,
            operation: 'update',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.sale.update',
          })
          throw error
        }
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-sales`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-sales-multi`] })
        qc.invalidateQueries({ queryKey: [`${K}-batches`, tenant?.id] })
        toast.success('Data penjualan diperbarui')
      },
      onError: (err) => toast.error('Gagal perbarui data: ' + normalizeSupabaseError(err).message),
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
        if (error) {
          logSupabaseError(error, {
            table: T.kandangs,
            operation: 'insert',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.kandang.create',
          })
          throw error
        }
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-kandangs`, tenant?.id] })
        toast.success('Kandang berhasil ditambahkan')
      },
      onError: (err) => toast.error('Gagal buat kandang: ' + normalizeSupabaseError(err).message),
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
        if (error) {
          logSupabaseError(error, {
            table: T.kandangs,
            operation: 'update',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.kandang.update_position',
          })
          throw error
        }
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
        if (error) {
          logSupabaseError(error, {
            table: T.kandangs,
            operation: 'update',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.kandang.update',
          })
          throw error
        }
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-kandangs`, tenant?.id] })
        toast.success('Kandang diperbarui')
      },
      onError: (err) => toast.error('Gagal update: ' + normalizeSupabaseError(err).message),
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
        if (error) {
          logSupabaseError(error, {
            table: T.kandangs,
            operation: 'delete',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.kandang.delete',
          })
          throw error
        }
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-kandangs`, tenant?.id] })
        toast.success('Kandang dihapus')
      },
      onError: (err) => toast.error('Gagal hapus: ' + normalizeSupabaseError(err).message),
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
        if (error) {
          logSupabaseError(error, {
            table: T.animals,
            operation: 'update',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.animal.move_kandang',
          })
          throw error
        }
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
        toast.error('Gagal memindahkan ternak: ' + normalizeSupabaseError(err).message)
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
      mutationFn: async ({ logId, _batch_id }) => {
        const { error } = await supabase
          .from(T.health)
          .update({ is_deleted: true })
          .eq('id', logId)
          .eq('tenant_id', tenant.id)
        if (error) {
          logSupabaseError(error, {
            table: T.health,
            operation: 'update',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.health_log.delete',
          })
          throw error
        }
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-health-logs`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-health-logs-multi`] })
        toast.success('Log kesehatan dihapus')
      },
      onError: (err) => toast.error('Gagal hapus: ' + normalizeSupabaseError(err).message),
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
        if (error) {
          logSupabaseError(error, {
            table: T.costs,
            operation: 'insert',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.operational_cost.create',
          })
          throw error
        }
      },
      onSuccess: (_, { batch_id }) => {
        qc.invalidateQueries({ queryKey: [`${K}-operational-costs`, batch_id] })
        qc.invalidateQueries({ queryKey: [`${K}-operational-costs-multi`] })
        // Cross-invalidate farm-wide view
        qc.invalidateQueries({ queryKey: ['farm-ops-costs', K] })
        toast.success('Biaya operasional dicatat')
      },
      onError: (err) => toast.error('Gagal catat biaya: ' + normalizeSupabaseError(err).message),
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
        if (error) {
          logSupabaseError(error, {
            table: T.costs,
            operation: 'update',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.operational_cost.delete',
          })
          throw error
        }
      },
      onSuccess: (_, { batchId }) => {
        qc.invalidateQueries({ queryKey: [`${K}-operational-costs`, batchId] })
        qc.invalidateQueries({ queryKey: [`${K}-operational-costs-multi`] })
        // Cross-invalidate farm-wide view
        qc.invalidateQueries({ queryKey: ['farm-ops-costs', K] })
        toast.success('Biaya operasional dihapus')
      },
      onError: (err) => toast.error('Gagal hapus: ' + normalizeSupabaseError(err).message),
    })
  }

  /**
   * Fetch ALL animals for this prefix (cross-batch, all statuses).
   * Includes sold/dead animals so we can reconstruct their active window:
   *   active window = [purchase_date, sold_date || death_date || today]
   * Used by useHppBatch for per-day overhead allocation.
   *
   * NOTE: Isolated to this animal type (prefix). Sapi/domba/kambing are separate.
   */
  function useAllAnimalsForType() {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${prefix}-all-animals-for-overhead`, tenant?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.animals)
          .select('id, batch_id, status, entry_date, exit_date, updated_at')
          .eq('tenant_id', tenant.id)
        if (error) throw error
        return data ?? []
      },
      enabled: !!tenant?.id,
      staleTime: 1000 * 60 * 5, // 5 min — used for historical allocation
    })
  }

  function useHppBatch(batchId) {
    const { data: batchRecord, isLoading: lBatch } = useBatchRecord(batchId)
    const { data: animalList = [], isLoading: l1 } = useAnimals(batchId)
    const { data: salesList,        isLoading: l2 } = useSales(batchId)

    // SCOPE: useOperationalCostsByBatches filters by batch_id IN [batchId]
    const batchIds = React.useMemo(() => batchId ? [batchId] : [], [batchId])
    const { data: thisBatchFeedLogs = [], isLoading: l3 } = useFeedLogsByBatches(batchIds)
    const { data: thisBatchOpsCosts = [], isLoading: l4 } = useOperationalCostsByBatches(batchIds)

    // Fetch health logs for treatment cost (if column exists)
    const { data: healthLogs = [], isLoading: l5 } = useHealthLogs(batchId)

    // ── Payroll overhead: read directly from kandang_worker_payments ────────
    const { data: allWorkerPayments = [], isLoading: l6 } = useTenantWorkerPayments()

    // ── Cross-batch animals for per-day overhead allocation ──────────────────
    // Fetches ALL animals (all statuses) for this prefix so we can reconstruct
    // each animal's active window [purchase_date, sold_date] and count how many
    // were present on each specific calendar day.
    const { data: allAnimalsForType = [], isLoading: l7 } = useAllAnimalsForType()

    const isLoading = lBatch || l1 || l2 || l3 || l4 || l5 || l6 || l7

    const hpp = React.useMemo(() => {
      if (batchRecord?.hpp_mode === 'simple') {
        return calculateSimpleHpp({
          animalList,
          salesList,
          thisBatchOpsCosts,
          healthLogs,
          leftoverAdjustmentIdr: batchRecord.leftover_adjustment_idr || 0
        })
      }

      // ── Modal Beli ─────────────────────────────────────────────────────────
      const totalModalBeli = animalList.reduce((s, a) => s + (Number(a.purchase_price_idr) || 0), 0)

      // ── Warning: ada ternak tanpa harga beli ──────────────────────────────
      const ternakTanpaHarga = animalList.filter(a => !a.purchase_price_idr || Number(a.purchase_price_idr) === 0).length

      // ── Biaya Pakan ────────────────────────────────────────────────────────
      // Source 1: feed_cost_idr per log harian (schema kandang — sapi).
      // Untuk domba/kambing, field ini umumnya NULL → totalBiayaPakanDirect = 0.
      const totalBiayaPakanDirect = thisBatchFeedLogs.reduce(
        (s, f) => s + (Number(f.feed_cost_idr) || 0), 0
      )

      // Track consumption volume (actual consumed, not purchased)
      const kgConsumedThisBatch = thisBatchFeedLogs.reduce((s, f) => {
        if (f.consumed_kg != null && f.consumed_kg > 0) return s + f.consumed_kg
        const input = (f.hijauan_kg || 0) + (f.konsentrat_kg || 0) + (f.dedak_kg || 0) + (f.other_feed_kg || 0)
        return s + Math.max(0, input - (f.sisa_pakan_kg || 0))
      }, 0)

      // ── Source 2: Pembelian Pakan (operational_costs category='pakan') ──────
      // SCOPE: Data sudah terisolasi per batch_id dari query. Harga pakan adalah
      // PER-BATCH, bukan stok global. Setiap batch menyimpan harga belinya sendiri.
      //
      // WARNING: amount_idr = total kas keluar untuk beli STOK pakan (asset),
      // bukan biaya konsumsi (expense). Kita harus convert ke cost via:
      //   HPP Pakan = kgConsumed × (totalCashOut / totalQtyKgPurchased)
      //
      // DEDUP: Deduplicate by row ID untuk mencegah join ganda yang menggandakan row.
      const rawPakanRows = thisBatchOpsCosts.filter(c => c.category === 'pakan')
      // ↓ Dedup by ID — protects against join duplication (e.g. cross-batch queries)
      const seenCostIds = new Set()
      const pakanPurchaseRows = rawPakanRows.filter(c => {
        if (seenCostIds.has(c.id)) return false
        seenCostIds.add(c.id)
        return true
      })
      const dedupRemovedCount = rawPakanRows.length - pakanPurchaseRows.length

      const feedPurchaseTotalQtyKg = pakanPurchaseRows.reduce((s, c) => s + (Number(c.quantity) || 0), 0)
      const feedPurchaseTotalCost  = pakanPurchaseRows.reduce((s, c) => s + (Number(c.amount_idr) || 0), 0)

      // Weighted average unit price from all deduplicated purchase rows for this batch
      const avgPurchasePricePerKg = feedPurchaseTotalQtyKg > 0
        ? feedPurchaseTotalCost / feedPurchaseTotalQtyKg
        : 0

      // ── Multi-type feed consumption breakdown ────────────────────────────────
      // TODO: Untuk akurasi biaya multi-jenis pakan (hijauan vs konsentrat vs dedak),
      // purchase rows idealnya diberi tag feed_type dan dihitung per-jenis:
      //   hargaHijauanPerKg = totalBeli(hijauan) / totalQty(hijauan)
      //   biayaHijauan = kgHijauanConsumed × hargaHijauanPerKg
      //   (idem untuk konsentrat, dedak, other)
      // Saat ini schema operational_costs.notes berisi "Rp X/kg" sebagai string.
      // Solusi proper memerlukan kolom feed_type di operational_costs (schema change).
      // Untuk saat ini: pakai weighted avg seluruh jenis → undercharge untuk konsentrat
      // (mahal) dan overcharge untuk hijauan (murah). Aman vs alternatif lama yang
      // membebankan TOTAL pembelian 100% ke HPP.

      // HPP pakan = hanya kg yang sudah dikonsumsi × harga beli rata-rata
      let totalBiayaPakanOps = 0
      if (totalBiayaPakanDirect > 0) {
        // Schema kandang (sapi): biaya sudah tercatat per log harian — tidak perlu source 2
        totalBiayaPakanOps = 0
      } else if (feedPurchaseTotalQtyKg > 0 && kgConsumedThisBatch > 0) {
        // Consumption-based costing: consumed kg × weighted avg purchase price
        totalBiayaPakanOps = Math.round(kgConsumedThisBatch * avgPurchasePricePerKg)
      } else if (feedPurchaseTotalQtyKg === 0 && feedPurchaseTotalCost > 0) {
        // Tidak ada quantity di purchase rows → fallback ke total pembelian (cash basis)
        // Ini conservative: membebankan seluruh pembelian ke HPP jika qty tidak dicatat
        totalBiayaPakanOps = feedPurchaseTotalCost
      }
      // else: tidak ada purchase rows → totalBiayaPakanOps = 0

      const totalBiayaPakan = totalBiayaPakanDirect + totalBiayaPakanOps

      // Warning: ada log konsumsi tapi biaya = 0 di kedua sumber
      const warnPakanTanpaBiaya = kgConsumedThisBatch > 0 && totalBiayaPakan === 0

      // Avg HPP price per kg for UI display
      const avgPricePerKg = kgConsumedThisBatch > 0 ? totalBiayaPakan / kgConsumedThisBatch : 0

      if (import.meta.env.DEV) {
        const avgHppFeedPricePerKg = kgConsumedThisBatch > 0 ? totalBiayaPakan / kgConsumedThisBatch : 0
        const possibleMismatch = totalBiayaPakan > 0 && kgConsumedThisBatch > 0 && avgPurchasePricePerKg > 0
          && avgHppFeedPricePerKg > avgPurchasePricePerKg * 3

        // ── Duplicate detection: will show identical IDs as red flags ──────────
        if (dedupRemovedCount > 0) {
          console.warn(
            `[HPP] ⚠️ ${dedupRemovedCount} duplicate purchase row(s) removed for batch ${batchId}. ` +
            'This indicates a join duplication bug — check useOperationalCostsByBatches query.'
          )
        }
        // Full purchase row table for visual audit (open DevTools → Console → expand table)
        if (rawPakanRows.length > 0) {
          console.table(rawPakanRows.map(r => ({
            id: r.id,
            batch_id: r.batch_id,
            item_name: r.item_name,
            quantity_kg: r.quantity,
            amount_idr: r.amount_idr,
            created_at: r.created_at,
            isDuplicate: rawPakanRows.filter(x => x.id === r.id).length > 1,
          })))
        }

        console.debug('[HPP] Feed cost source audit', {
          batchId,
          rawRowCount: rawPakanRows.length,
          dedupRowCount: pakanPurchaseRows.length,
          dedupRemovedCount,
          feedPurchaseTotalQtyKg,
          feedPurchaseTotalCost,
          kgConsumedThisBatch,
          feedLogsDirectCost: totalBiayaPakanDirect,
          feedCostUsedInHpp: totalBiayaPakan,
          avgPurchasePricePerKg: Math.round(avgPurchasePricePerKg),
          avgHppFeedPricePerKg: Math.round(avgHppFeedPricePerKg),
          possibleMismatch,
        })

        // ── Legacy data integrity check ──────────────────────────────────────
        // Deteksi baris pakan lama dimana quantity tidak dialokasikan bersama amount_idr.
        // Tanda: qty * (totalCost/totalQty) >> amount_idr per baris (jauh lebih besar).
        if (pakanPurchaseRows.length > 0 && avgPurchasePricePerKg > 0) {
          pakanPurchaseRows.forEach(r => {
            const qtyRow = Number(r.quantity) || 0
            if (qtyRow <= 0) return
            const expectedAmount = qtyRow * avgPurchasePricePerKg
            const actualAmount   = Number(r.amount_idr) || 0
            const ratio = actualAmount > 0 ? expectedAmount / actualAmount : 0
            // Flag jika expected >2x actual — indikasi qty masih total, amount sudah dialokasi
            if (ratio > 2) {
              console.warn(
                `[HPP] ⚠️ Kemungkinan quantity_kg belum dialokasi bersama amount_idr.\n` +
                `  Row: ${r.item_name} (id: ${r.id})\n` +
                `  qty=${qtyRow} kg · amount=Rp${actualAmount.toLocaleString('id-ID')} · ` +
                `  expected≈Rp${Math.round(expectedAmount).toLocaleString('id-ID')} (ratio ${ratio.toFixed(1)}x)\n` +
                `  → Jalankan DATA REPAIR query untuk memperbaiki row ini.`
              )
            }
          })
        }
      }

      // ── Biaya Ops (semua non-pakan, non-gaji: listrik_air, tenaga_kerja, lainnya, dll) ──
      // Kategori 'gaji' dikeluarkan — sudah dihitung via payroll overhead di bawah.
      const aktifCount = animalList.filter(a => a.status === 'active').length
      const allOpsCosts = thisBatchOpsCosts.filter(c => c.category !== 'pakan' && c.category !== 'gaji')
      const totalBiayaOps = allOpsCosts.reduce((s, c) => s + (Number(c.amount_idr) || 0), 0)
      const totalBiayaGaji = 0    // legacy — selalu 0, kept for return shape
      const totalBiayaOpsLain = totalBiayaOps

      // ── Overhead Periodik Harian (per-day active_head_count allocation) ─────
      //
      // Algorithm (per payment):
      //   1. Tentukan period [periodStart, periodEnd] dari payment_type.
      //   2. dailyCost = amount / daysInPeriod  (kalender aktual, inklusif).
      //   3. Pre-compute active window tiap hewan: [purchase_date, sold_date || today].
      //   4. Untuk setiap hari D dalam overlap(period, batchWindow):
      //        headThisBatch(D) = hewan batch ini aktif pada D
      //        headAllBatches(D) = hewan semua batch aktif pada D
      //        dayAlloc(D) = dailyCost × headThisBatch(D) / headAllBatches(D)
      //   5. totalAllocated = SUM(dayAlloc) per payment
      //
      // Properti:
      //   - Batch baru hanya bayar sejak tanggal masuknya (purchase_date per ekor)
      //   - Batch lama tidak bayar setelah semua terjual/mati
      //   - SUM alokasi semua batch <= totalPayroll (tidak bisa melebihi)
      //   - Februari 28/29 (kabisat) otomatis benar via date-fns

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Batch window: kapan batch ini pertama dan terakhir aktif
      const purchaseDates = animalList
        .map(a => a.entry_date)   // entry_date = kolom aktual (bukan purchase_date)
        .filter(Boolean)
        .sort()
      const batchStart = purchaseDates.length > 0 ? startOfDay(parseISO(purchaseDates[0])) : null
      const allBatchAnimalsSold = animalList.length > 0 && animalList.every(a => a.status === 'sold')
      const batchEnd = allBatchAnimalsSold
        ? (() => {
            const exitDates = animalList
              .map(a => a.exit_date || a.updated_at)  // exit_date = kolom aktual
              .filter(Boolean).sort().reverse()
            return exitDates[0] ? startOfDay(parseISO(exitDates[0])) : today
          })()
        : today

      // Pre-compute active window per animal (cross-batch, semua status)
      // Window = [purchase/entry date, sold_date OR updated_at (proxy death) OR today]
      const animalWindows = allAnimalsForType
        .map(a => {
          // Gunakan entry_date sebagai window start (kolom aktual di tabel)
          const entryRaw = a.entry_date
          if (!entryRaw) return null
          const windowStart = startOfDay(parseISO(entryRaw))
          let windowEnd = today
          if (a.exit_date) {
            // exit_date diisi saat hewan terjual, mati, atau afkir
            windowEnd = startOfDay(parseISO(a.exit_date))
          } else if (a.status === 'dead' || a.status === 'culled') {
            // Fallback: gunakan updated_at sebagai proxy tanggal keluar
            windowEnd = a.updated_at ? startOfDay(parseISO(a.updated_at)) : today
          }
          return { batchId: a.batch_id, start: windowStart, end: windowEnd }
        })
        .filter(Boolean)

      let totalBiayaGajiOverhead = 0
      const batchPayrollDebug = []

      if (batchStart && allWorkerPayments.length > 0 && animalWindows.length > 0) {
        totalBiayaGajiOverhead = allWorkerPayments.reduce((sum, payment) => {
          const amount = Number(payment.amount) || 0
          if (amount <= 0) return sum

          const payDate = parseISO(payment.payment_date)

          // ── Periode berdasarkan payment_type ────────────────────────────────
          let periodStart, periodEnd
          if (payment.payment_type === 'mingguan') {
            periodStart = startOfWeek(payDate, { weekStartsOn: 1 })
            periodEnd   = endOfWeek(payDate, { weekStartsOn: 1 })
          } else if (payment.payment_type === 'harian') {
            periodStart = startOfDay(payDate)
            periodEnd   = startOfDay(payDate)
          } else {
            // default: bulanan (gaji, monthly, dll)
            periodStart = startOfMonth(payDate)
            periodEnd   = endOfMonth(payDate)
          }

          // ── Hari kalender aktual, inklusif ──────────────────────────────────
          const daysInPeriod = differenceInCalendarDays(periodEnd, periodStart) + 1
          const dailyCost    = amount / daysInPeriod

          // ── Overlap: periode gaji ∩ periode aktif batch ─────────────────────
          const overlapStart = dateMax([periodStart, batchStart])
          const overlapEnd   = dateMin([periodEnd,   batchEnd])
          if (overlapStart > overlapEnd) return sum // tidak ada irisan hari

          // ── Per-day iteration ───────────────────────────────────────────────
          const days = eachDayOfInterval({ start: overlapStart, end: overlapEnd })
          let totalAllocatedToThisBatch = 0
          const dailyAllocationsPreview = []

          for (const day of days) {
            // Hitung ternak aktif di BATCH INI pada hari ini
            const headThisBatch = animalWindows.filter(
              w => w.batchId === batchId && day >= w.start && day <= w.end
            ).length

            if (headThisBatch === 0) continue // batch tidak punya hewan aktif hari ini

            // Hitung total ternak aktif SEMUA BATCH pada hari ini
            const headAllBatches = animalWindows.filter(
              w => day >= w.start && day <= w.end
            ).length

            if (headAllBatches <= 0) continue // tidak ada hewan sama sekali (unlikely)

            const dayProportion = headThisBatch / headAllBatches
            const dayAlloc      = dailyCost * dayProportion
            totalAllocatedToThisBatch += dayAlloc

            if (import.meta.env.DEV && dailyAllocationsPreview.length < 5) {
              dailyAllocationsPreview.push({
                date:          day.toISOString().slice(0, 10),
                headThisBatch,
                headAllBatches,
                proportion:    Math.round(dayProportion * 1000) / 1000,
                dayAlloc:      Math.round(dayAlloc),
              })
            }
          }

          const allocatedPayrollCost = Math.round(totalAllocatedToThisBatch)

          if (import.meta.env.DEV) {
            batchPayrollDebug.push({
              paymentId:               payment.id,
              periodStart:             periodStart.toISOString().slice(0, 10),
              periodEnd:               periodEnd.toISOString().slice(0, 10),
              daysInPeriod,
              dailyCost:               Math.round(dailyCost),
              allocationBasis:         'per_day_active_head_count',
              dailyAllocationsPreview,
              totalAllocatedToThisBatch: allocatedPayrollCost,
            })
          }

          return sum + allocatedPayrollCost
        }, 0)
      }

      if (import.meta.env.DEV && batchPayrollDebug.length > 0) {
        batchPayrollDebug.forEach(d => console.debug('Daily overhead allocation audit', d))
      }

      // ── Metrik transparansi overhead ─────────────────────────────────────────
      //
      // 1. animalDaysBatch
      //    Total ekor-hari aktif HANYA untuk batch ini.
      //    Setiap hewan di animalList disumbangkan 1 unit per hari dalam window
      //    [entry_date, exit_date || today].
      //    Hewan terjual/mati/afkir TIDAK dihitung setelah exit_date mereka.
      //    Ini adalah denominator yang tepat untuk "biaya berjalan / ekor / hari".
      let animalDaysBatch = 0
      let animalDaysFormulaText = ''        // "8 ekor × 3 hari + 7 ekor × 19 hari = 157"
      const animalDaysBreakdown = []        // per-hari untuk console.table

      if (batchStart) {
        // Bangun window per hewan dari animalList (bukan dari allAnimalsForType).
        // Setiap entri menyimpan: { earTag, status, start, end }
        const thisAnimalWindows = animalList.map(a => {
          const entryRaw = a.entry_date
          if (!entryRaw) return null
          const wStart = startOfDay(parseISO(entryRaw))
          let wEnd = today
          if (a.exit_date) {
            wEnd = startOfDay(parseISO(a.exit_date))
          } else if ((a.status === 'dead' || a.status === 'culled') && a.updated_at) {
            wEnd = startOfDay(parseISO(a.updated_at))
          }
          return { earTag: a.ear_tag || a.id?.slice(0, 6), status: a.status, start: wStart, end: wEnd }
        }).filter(Boolean)

        const batchWindowDays = eachDayOfInterval({ start: batchStart, end: batchEnd })
        for (const day of batchWindowDays) {
          const activeOnDay = thisAnimalWindows.filter(
            w => day >= w.start && day <= w.end
          ).length
          animalDaysBatch += activeOnDay
          animalDaysBreakdown.push({
            date:                    day.toISOString().slice(0, 10),
            activeHeadsThisBatch:    activeOnDay,
            animalDaysContribution:  activeOnDay,   // cumulative per row shown separately
          })
        }

        // ── Buat formula text dengan run-length encoding ────────────────────
        // Compress consecutive days dengan head-count yang sama menjadi segment
        // "N ekor × D hari" untuk kemudahan baca manusia.
        if (animalDaysBreakdown.length > 0) {
          const segments = []
          let segHead = animalDaysBreakdown[0].activeHeadsThisBatch
          let segDays = 1
          for (let i = 1; i < animalDaysBreakdown.length; i++) {
            const h = animalDaysBreakdown[i].activeHeadsThisBatch
            if (h === segHead) {
              segDays++
            } else {
              if (segHead > 0) segments.push({ head: segHead, days: segDays })
              segHead = h
              segDays = 1
            }
          }
          if (segHead > 0) segments.push({ head: segHead, days: segDays })

          const parts = segments.map(s => `${s.head} ekor × ${s.days} hari`)
          animalDaysFormulaText = parts.length > 0
            ? `${parts.join(' + ')} = ${animalDaysBatch} ekor-hari`
            : `${animalDaysBatch} ekor-hari`
        }

        if (import.meta.env.DEV && animalDaysBreakdown.length > 0) {
          // Tambah kolom kumulatif agar mudah cross-check di console
          let cum = 0
          const tableData = animalDaysBreakdown.map(r => {
            cum += r.animalDaysContribution
            return { ...r, cumulativeAnimalDays: cum }
          })
          console.debug(`[animalDaysBatch] formula: ${animalDaysFormulaText}`)
          console.table(tableData)
        }
      }

      // 2. overheadActiveHeadSample
      //    Denominator rata-rata yang BENAR-BENAR dipakai dalam alokasi overhead.
      //    Dihitung hanya dari hari-hari overlap antara payroll period dan batch window,
      //    di-weight oleh allocated cost tiap payment sehingga pembayaran besar
      //    (gaji bulan April Rp2,55 juta) mendominasi angka, bukan pembayaran kecil.
      //
      //    Untuk setiap payment yang sudah menghasilkan alokasi > 0:
      //      overlapDays = hari-hari irisan (periodPayment ∩ batchWindow)
      //      avgAllBatchesOnDay = rata-rata headAllBatches selama overlapDays
      //    weighted average: SUM(allocated × avgDenom) / SUM(allocated)
      let overheadActiveHeadSample = aktifCount // fallback jika tidak ada payroll
      const overheadPeriods = []               // untuk debug

      if (batchStart && allWorkerPayments.length > 0 && animalWindows.length > 0) {
        let weightedDenomSum  = 0
        let weightedCostTotal = 0

        for (const payment of allWorkerPayments) {
          const amount = Number(payment.amount) || 0
          if (amount <= 0) continue

          const payDate = parseISO(payment.payment_date)
          let periodStart, periodEnd
          if (payment.payment_type === 'mingguan') {
            periodStart = startOfWeek(payDate, { weekStartsOn: 1 })
            periodEnd   = endOfWeek(payDate, { weekStartsOn: 1 })
          } else if (payment.payment_type === 'harian') {
            periodStart = startOfDay(payDate)
            periodEnd   = startOfDay(payDate)
          } else {
            periodStart = startOfMonth(payDate)
            periodEnd   = endOfMonth(payDate)
          }

          const overlapStart = dateMax([periodStart, batchStart])
          const overlapEnd   = dateMin([periodEnd,   batchEnd])
          if (overlapStart > overlapEnd) continue // tidak ada irisan

          const overlapDays = eachDayOfInterval({ start: overlapStart, end: overlapEnd })

          // headAllBatches per hari di overlap ini
          let totalDenomOnOverlap = 0
          let daysCounted = 0
          for (const day of overlapDays) {
            const headThisBatch = animalWindows.filter(
              w => w.batchId === batchId && day >= w.start && day <= w.end
            ).length
            if (headThisBatch === 0) continue // hari di mana batch ini tidak aktif
            const headAll = animalWindows.filter(
              w => day >= w.start && day <= w.end
            ).length
            totalDenomOnOverlap += headAll
            daysCounted++
          }

          if (daysCounted === 0) continue
          const avgDenomThisPayment = totalDenomOnOverlap / daysCounted

          // Estimasi allocated cost untuk weighting
          const daysInPeriod  = differenceInCalendarDays(periodEnd, periodStart) + 1
          const dailyCost     = amount / daysInPeriod
          const allocEstimate = dailyCost * daysCounted * (avgDenomThisPayment > 0
            ? (animalWindows.filter(w => w.batchId === batchId && overlapStart >= w.start && overlapStart <= w.end).length / avgDenomThisPayment)
            : 1)

          weightedDenomSum  += avgDenomThisPayment * Math.max(allocEstimate, 1)
          weightedCostTotal += Math.max(allocEstimate, 1)

          overheadPeriods.push({
            paymentId:            payment.id,
            paymentType:          payment.payment_type,
            amount,
            overlapStart:         overlapStart.toISOString().slice(0, 10),
            overlapEnd:           overlapEnd.toISOString().slice(0, 10),
            daysCounted,
            avgDenomThisPayment:  Math.round(avgDenomThisPayment * 10) / 10,
            allocEstimate:        Math.round(allocEstimate),
          })
        }

        if (weightedCostTotal > 0) {
          overheadActiveHeadSample = Math.round(weightedDenomSum / weightedCostTotal)
        }
      }

      // ── Biaya Kesehatan (treatment_cost_idr from health_logs if available) ─
      const totalBiayaKesehatan = healthLogs.reduce(
        (s, h) => s + (Number(h.treatment_cost_idr) || 0), 0
      )

      // ── Total HPP & Counts ─────────────────────────────────────────────────
      const totalHpp = totalModalBeli + totalBiayaPakan + totalBiayaOps + totalBiayaKesehatan + totalBiayaGajiOverhead
      const terjualCount = animalList.filter(a => a.status === 'sold').length
      const matiCount = animalList.filter(a => a.status === 'dead' || a.status === 'culled').length
      const produksiCount = aktifCount + terjualCount

      // ── Edge case: semua mati ──────────────────────────────────────────────
      const allDead = animalList.length > 0 && aktifCount === 0 && terjualCount === 0

      // ── Pendapatan ─────────────────────────────────────────────────────────
      const salesData = salesList ?? []
      const totalPendapatan = salesData.reduce((s, t) => s + (Number(t.total_revenue_idr) || 0), 0)
      const totalPendapatanLunas = salesData.filter(t => t.is_paid).reduce((s, t) => s + (Number(t.total_revenue_idr) || 0), 0)
      const totalHutang = totalPendapatan - totalPendapatanLunas

      // ── BEP (+20% target margin) ───────────────────────────────────────────
      const hppPerEkor = produksiCount > 0 ? totalHpp / produksiCount : 0
      const bepPerEkor = hppPerEkor * 1.20

      // BEP Sisa Akrual: termasuk hutang (standard accounting)
      const targetRevenue = totalHpp * 1.20
      const bepSisa = aktifCount > 0 ? Math.max(0, targetRevenue - totalPendapatan) / aktifCount : 0

      // BEP Sisa Kas: hanya yg sudah lunas (cashflow reality)
      const bepSisaKas = aktifCount > 0 ? Math.max(0, targetRevenue - totalPendapatanLunas) / aktifCount : 0

      // BEP per kg — pakai bobot aktif (latest_weight_kg > entry_weight_kg > 0)
      const activeAnimals = animalList.filter(a => a.status === 'active')
      const totalActiveWeightKg = activeAnimals.reduce(
        (s, a) => s + (parseFloat(a.latest_weight_kg ?? a.entry_weight_kg) || 0), 0
      )
      const avgActiveWeightKg = activeAnimals.length > 0 ? totalActiveWeightKg / activeAnimals.length : 0
      const bepSisaPerKg = avgActiveWeightKg > 0 ? Math.round(bepSisa / avgActiveWeightKg) : 0

      const sisaHpp = totalHpp - totalPendapatan
      const profitLoss = totalPendapatan - totalHpp

      // Expose feed consumption stats for UI
      const kgPakanTotal = kgConsumedThisBatch
      const hargaRataPerKg = Math.round(avgPricePerKg)

      if (import.meta.env.DEV) {
        console.debug('Domba HPP/BEP audit', {
          activeCount: aktifCount,
          avgWeightKg: avgActiveWeightKg,
          totalLiveWeightKg: totalActiveWeightKg,
          purchaseCost: totalModalBeli,
          feedKgTotal: kgConsumedThisBatch,
          feedCostTotal: totalBiayaPakan,
          operationalCost: totalBiayaOps,
          payrollOverhead: totalBiayaGajiOverhead,
          totalHpp,
          hppPerHead: hppPerEkor,
          targetMargin: 0.2,
          targetPricePerHead: bepPerEkor,
          targetPricePerKg: bepSisaPerKg
        })

        // ── Running cost per head day audit ─────────────────────────────────
        const _totalRunningCost = totalBiayaPakan + totalBiayaGajiOverhead + totalBiayaOpsLain
        const _runningCostPerHeadPerDay = animalDaysBatch > 0
          ? Math.round(_totalRunningCost / animalDaysBatch)
          : 0
        console.debug('Running cost per head day audit', {
          totalRunningCost:        _totalRunningCost,
          animalDaysBatch,
          animalDaysFormulaText,
          runningCostPerHeadPerDay: _runningCostPerHeadPerDay,
          overheadActiveHeadSample,
          overheadPeriods,
        })
      }

      return {
        totalModalBeli, totalBiayaPakan, totalBiayaOps, totalBiayaGaji,
        totalBiayaOpsLain, totalBiayaKesehatan,
        totalBiayaGajiOverhead, // ← overhead periodik dari kandang_worker_payments
        totalHpp,
        aktifCount, terjualCount, matiCount, produksiCount,
        totalPendapatan, totalPendapatanLunas, totalHutang,
        hppPerEkor, bepPerEkor, bepSisa, bepSisaKas,
        bepSisaPerKg, avgActiveWeightKg, totalActiveWeightKg,
        sisaHpp, profitLoss,
        kgPakanTotal, hargaRataPerKg,
        warnPakanTanpaBiaya, ternakTanpaHarga, allDead,
        // Metrik transparansi overhead
        animalDaysBatch,           // total ekor-hari aktif batch ini (per-animal window)
        animalDaysFormulaText,     // "8 ekor × 3 hari + 7 ekor × 19 hari = 157 ekor-hari"
        overheadActiveHeadSample,  // rata-rata ekor aktif lintas-batch (weighted by allocation cost)
        overheadPeriods,           // detail per-payment untuk audit
      }
    }, [animalList, salesList, thisBatchFeedLogs, thisBatchOpsCosts, healthLogs, batchId, allWorkerPayments, allAnimalsForType, batchRecord])

    return { isLoading, ...hpp }
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

        if (checkErr) {
          logSupabaseError(checkErr, {
            table: T.kandangs,
            operation: 'select',
            component: 'createPenggemukanHooks',
            actionName: 'peternak.holding_pen.ensure.check',
          })
          throw checkErr
        }

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
          if (insertErr) {
            logSupabaseError(insertErr, {
              table: T.kandangs,
              operation: 'insert',
              component: 'createPenggemukanHooks',
              actionName: 'peternak.holding_pen.ensure.create',
            })
            throw insertErr
          }
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
    useHppBatch,
    useBatchRecord,
  }
}

