import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

// ─── Pure helper calculations ─────────────────────────────────────────────────

export const calcCurrentAge = (startDate) => {
  if (!startDate) return 0
  const diff = Date.now() - new Date(startDate).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export const calcMortalityPct = (totalMortality, docCount) => {
  if (!docCount || docCount <= 0) return 0
  return Number(((totalMortality / docCount) * 100).toFixed(2))
}

export const calcFCR = (totalFeedKg, totalWeightGainKg) => {
  if (!totalWeightGainKg || totalWeightGainKg <= 0) return 0
  return Number((totalFeedKg / totalWeightGainKg).toFixed(3))
}

export const calcIPScore = (avgWeight, mortalityPct, age, fcr) => {
  // IP = (Survival% × avgWeight × 100) / (age × fcr)
  const survivalPct = 100 - mortalityPct
  if (!age || !fcr || fcr <= 0) return 0
  return Number(((survivalPct * avgWeight * 100) / (age * fcr)).toFixed(1))
}

// ─── usePeternakFarms ─────────────────────────────────────────────────────────
// Fetches all active peternak_farms with their breeding_cycles nested.

export function usePeternakFarms() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['peternak-farms', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('peternak_farms')
        .select('*, breeding_cycles(*)')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ─── useActiveCycles ─────────────────────────────────────────────────────────
// Fetches all active breeding_cycles with farm info and daily_records.

export function useActiveCycles() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['active-cycles', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breeding_cycles')
        .select(`
          *,
          peternak_farms(farm_name, livestock_type, business_model, capacity, mitra_company),
          daily_records(*)
        `)
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ─── useAllCycles ─────────────────────────────────────────────────────────────
// Fetches all cycles (any status) for the Siklus list page.

export function useAllCycles() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['all-cycles', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breeding_cycles')
        .select(`
          *,
          peternak_farms(farm_name, livestock_type, business_model, mitra_company),
          daily_records(*)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ─── useCompletedCycles ───────────────────────────────────────────────────────
// Fetches last 3 completed cycles for history section.

export function useCompletedCycles() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['completed-cycles', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breeding_cycles')
        .select(`
          id, cycle_number, status,
          final_fcr, final_ip_score, total_mortality, doc_count,
          peternak_farms(farm_name),
          harvest_records(harvest_date, total_weight_kg, net_revenue)
        `)
        .eq('tenant_id', tenant.id)
        .in('status', ['harvested', 'failed'])
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(3)
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ─── useDailyRecords ──────────────────────────────────────────────────────────
// Fetches all daily_records for a specific cycle, ordered by date ascending.

export function useDailyRecords(cycleId) {
  return useQuery({
    queryKey: ['daily-records', cycleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_records')
        .select('*')
        .eq('cycle_id', cycleId)
        .order('record_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!cycleId,
  })
}

// ─── useCreatePeternakFarm ────────────────────────────────────────────────────

export const useCreatePeternakFarm = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ farm_name, location, capacity, kandang_count }) => {
      const { error } = await supabase.from('peternak_farms').insert({
        tenant_id: tenant.id,
        farm_name, location,
        capacity, kandang_count,
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peternak-farms', tenant?.id] })
      toast.success('Kandang berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal tambah kandang: ' + err.message),
  })
}

// ─── useCreateCycle ───────────────────────────────────────────────────────────

export const useCreateCycle = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      peternak_farm_id, chicken_type, doc_count,
      start_date, estimated_harvest_date,
      sell_price_per_kg, notes,
    }) => {
      // Auto-increment cycle_number per farm
      const { data: existing } = await supabase
        .from('breeding_cycles')
        .select('cycle_number')
        .eq('peternak_farm_id', peternak_farm_id)
        .eq('is_deleted', false)
        .order('cycle_number', { ascending: false })
        .limit(1)
      const cycle_number = (existing?.[0]?.cycle_number || 0) + 1

      const { error } = await supabase.from('breeding_cycles').insert({
        tenant_id: tenant.id,
        peternak_farm_id, chicken_type,
        doc_count, current_count: doc_count,
        start_date, estimated_harvest_date,
        sell_price_per_kg: sell_price_per_kg || null,
        notes: notes || null,
        cycle_number, status: 'active',
        total_mortality: 0, total_feed_kg: 0,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-cycles', tenant?.id] })
      queryClient.invalidateQueries({ queryKey: ['active-cycles', tenant?.id] })
      toast.success('Siklus baru berhasil dibuat')
    },
    onError: (err) => toast.error('Gagal buat siklus: ' + err.message),
  })
}

// ─── useUpdateCycleStatus ─────────────────────────────────────────────────────

export const useUpdateCycleStatus = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      cycleId, status, actual_harvest_date,
      final_fcr, final_ip_score,
      sell_price_per_kg, total_revenue, total_cost, notes,
    }) => {
      const { error } = await supabase
        .from('breeding_cycles')
        .update({
          status, actual_harvest_date,
          final_fcr, final_ip_score,
          sell_price_per_kg, total_revenue, total_cost,
          ...(notes !== undefined ? { notes } : {}),
        })
        .eq('id', cycleId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-cycles', tenant?.id] })
      queryClient.invalidateQueries({ queryKey: ['active-cycles', tenant?.id] })
      toast.success('Status siklus diperbarui')
    },
    onError: (err) => toast.error('Gagal update siklus: ' + err.message),
  })
}

// ─── useDeleteCycle ───────────────────────────────────────────────────────────

// ─── useCycleById ─────────────────────────────────────────────────────────────

export const useCycleById = (cycleId) => useQuery({
  queryKey: ['cycle', cycleId],
  enabled: !!cycleId,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('breeding_cycles')
      .select('*, peternak_farms(farm_name, location, capacity, business_model, mitra_company)')
      .eq('id', cycleId)
      .single()
    if (error) throw error
    return data
  },
})

// ─── useUpsertDailyRecord ─────────────────────────────────────────────────────

export const useUpsertDailyRecord = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      cycle_id, record_date, age_days,
      mortality_count, feed_kg, avg_weight_kg, notes,
    }) => {
      const { error } = await supabase.from('daily_records').upsert(
        {
          tenant_id: tenant.id,
          cycle_id, record_date,
          age_days: age_days ?? null,
          mortality_count: mortality_count ?? 0,
          feed_kg: feed_kg ?? 0,
          avg_weight_kg: avg_weight_kg || null,
          notes: notes || null,
        },
        { onConflict: 'cycle_id,record_date' }
      )
      if (error) throw error
      // Recompute breeding_cycles aggregate totals
      const { data: allRecs } = await supabase
        .from('daily_records')
        .select('mortality_count, feed_kg')
        .eq('cycle_id', cycle_id)
      const totalMortality = allRecs?.reduce((s, r) => s + (r.mortality_count || 0), 0) ?? 0
      const totalFeed      = allRecs?.reduce((s, r) => s + Number(r.feed_kg || 0), 0) ?? 0
      await supabase
        .from('breeding_cycles')
        .update({ total_mortality: totalMortality, total_feed_kg: totalFeed })
        .eq('id', cycle_id)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['daily-records', vars.cycle_id] })
      queryClient.invalidateQueries({ queryKey: ['cycle', vars.cycle_id] })
      queryClient.invalidateQueries({ queryKey: ['active-cycles'] })
      queryClient.invalidateQueries({ queryKey: ['all-cycles'] })
      toast.success('Catatan harian disimpan')
    },
    onError: () => toast.error('Gagal menyimpan catatan'),
  })
}

// ─── useFeedStocks ────────────────────────────────────────────────────────────
// Fetches all feed_stocks with farm info, grouped by peternak_farm_id.

export function useFeedStocks() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['feed-stocks', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_stocks')
        .select('*, peternak_farms(id, farm_name)')
        .eq('tenant_id', tenant.id)
        .order('feed_type', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ─── useUpsertFeedStock ───────────────────────────────────────────────────────
// Adds qty to existing stock (upsert by farm_id + feed_type).
// Optionally inserts a cycle_expenses row for cost tracking.

export const useUpsertFeedStock = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ peternak_farm_id, feed_type, quantity_kg, cycle_id, unit_price, notes }) => {
      // Check if stock row already exists
      const { data: existing } = await supabase
        .from('feed_stocks')
        .select('id, quantity_kg')
        .eq('tenant_id', tenant.id)
        .eq('peternak_farm_id', peternak_farm_id)
        .eq('feed_type', feed_type)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('feed_stocks')
          .update({ quantity_kg: existing.quantity_kg + quantity_kg })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('feed_stocks')
          .insert({ tenant_id: tenant.id, peternak_farm_id, feed_type, quantity_kg })
        if (error) throw error
      }

      // Optional: record in cycle_expenses if cycle_id + unit_price provided
      if (cycle_id && unit_price) {
        const total_amount = quantity_kg * unit_price
        const { error: expErr } = await supabase
          .from('cycle_expenses')
          .insert({
            tenant_id: tenant.id,
            cycle_id,
            expense_type: 'pakan',
            description: `Pakan ${feed_type} ${quantity_kg} kg`,
            qty: quantity_kg,
            unit: 'kg',
            unit_price,
            total_amount,
            expense_date: new Date().toISOString().split('T')[0],
            notes: notes || null,
          })
        if (expErr) throw expErr
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-stocks', tenant?.id] })
      toast.success('Stok pakan berhasil diupdate')
    },
    onError: (err) => toast.error('Gagal update stok: ' + err.message),
  })
}

// ─── useReduceFeedStock ───────────────────────────────────────────────────────
// Catat pemakaian: kurangi quantity_kg dari stock yang ada.

export const useReduceFeedStock = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ stock_id, quantity_kg: reduceBy, current_qty }) => {
      const newQty = current_qty - reduceBy
      if (newQty < 0) throw new Error('Jumlah pemakaian melebihi stok yang tersedia')
      const { error } = await supabase
        .from('feed_stocks')
        .update({ quantity_kg: newQty })
        .eq('id', stock_id)
      if (error) throw error
      return newQty
    },
    onSuccess: (newQty) => {
      queryClient.invalidateQueries({ queryKey: ['feed-stocks', tenant?.id] })
      if (newQty < 100) {
        toast.warning(`Stok menipis! Sisa ${newQty.toFixed(1)} kg — segera tambah stok`)
      } else {
        toast.success('Pemakaian pakan dicatat')
      }
    },
    onError: (err) => toast.error(err.message),
  })
}

// ─── useSingleFarm ────────────────────────────────────────────────────────────
// Per-farm dashboard hook — loads one farm + its active cycle with daily records.

export function useSingleFarm(farmId) {
  return useQuery({
    queryKey: ['peternak-farm', farmId],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('peternak_farms')
        .select('*')
        .eq('id', farmId)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useFarmActiveCycle(farmId) {
  return useQuery({
    queryKey: ['farm-active-cycle', farmId],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breeding_cycles')
        .select('*, daily_records(*)')
        .eq('peternak_farm_id', farmId)
        .eq('status', 'active')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data ?? null
    },
  })
}

export const useDeleteCycle = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async (cycleId) => {
      const { error } = await supabase
        .from('breeding_cycles')
        .update({ is_deleted: true })
        .eq('id', cycleId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-cycles', tenant?.id] })
      queryClient.invalidateQueries({ queryKey: ['active-cycles', tenant?.id] })
      toast.success('Siklus dihapus')
    },
    onError: (err) => toast.error('Gagal hapus siklus: ' + err.message),
  })
}
