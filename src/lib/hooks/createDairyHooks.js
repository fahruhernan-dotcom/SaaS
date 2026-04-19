/**
 * TernakOS — Dairy Hook Factory
 * 
 * Creates a complete set of hooks for Dairy business models (e.g., Kambing Perah).
 * Handles production tracking, lactation cycles, quality control, and inventory.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export function createDairyHooks(prefix) {
  const T = {
    kandangs:      `${prefix}_kandangs`,
    groups:        `${prefix}_animal_groups`,
    animals:       `${prefix}_breeding_animals`,
    lactation:     `${prefix}_lactation_cycles`,
    milk_logs:     `${prefix}_milk_logs`,
    milk_quality:  `${prefix}_milk_quality_logs`,
    inventory:     `${prefix}_inventory_items`,
    transactions:  `${prefix}_inventory_transactions`,
    customers:     `${prefix}_customer_registry`,
    sales:         `${prefix}_milk_sales`,
    mating:        `${prefix}_breeding_mating_records`,
    births:        `${prefix}_breeding_births`,
    health:        `${prefix}_breeding_health_logs`,
    weight:        `${prefix}_breeding_weight_records`,
    formulations:  `${prefix}_feed_formulations`,
    feed_logs:     `${prefix}_breeding_feed_logs`,
  }

  const K = prefix

  // ─── QUERY HOOKS ──────────────────────────────────────────────────────────

  function useAnimals() {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-animals`, tenant?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.animals)
          .select('*, group:group_id(*), kandang:kandang_id(*)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('ear_tag', { ascending: true })
        if (error) throw error
        return data ?? []
      },
      enabled: !!tenant?.id,
    })
  }

  function useLactatingAnimals() {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-lactating-animals`, tenant?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.animals)
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('status', 'laktasi')
          .eq('is_deleted', false)
        if (error) throw error
        return data ?? []
      },
      enabled: !!tenant?.id,
    })
  }

  function useActiveLactations() {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-active-lactations`, tenant?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.lactation)
          .select('*, animal:animal_id(ear_tag, name)')
          .eq('tenant_id', tenant.id)
          .eq('status', 'active')
        if (error) throw error
        return data ?? []
      },
      enabled: !!tenant?.id,
    })
  }

  function useMilkLogs(days = 7) {
    const { tenant } = useAuth()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return useQuery({
      queryKey: [`${K}-milk-logs`, tenant?.id, days],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.milk_logs)
          .select('*, animal:animal_id(ear_tag)')
          .eq('tenant_id', tenant.id)
          .gte('log_date', startDate.toISOString().split('T')[0])
          .order('log_date', { ascending: false })
        if (error) throw error
        return data ?? []
      },
      enabled: !!tenant?.id,
    })
  }

  function useInventory() {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-inventory`, tenant?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.inventory)
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
        if (error) throw error
        return data ?? []
      },
      enabled: !!tenant?.id,
    })
  }

  function useYieldStats() {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-yield-stats`, tenant?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.milk_logs)
          .select('volume_liter, log_date')
          .eq('tenant_id', tenant.id)
          .order('log_date', { ascending: false })
          .limit(100)
        if (error) throw error
        return data ?? []
      },
      enabled: !!tenant?.id,
    })
  }

  function useCustomers() {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-customers`, tenant?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.customers)
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
        if (error) throw error
        return data ?? []
      },
      enabled: !!tenant?.id,
    })
  }

  function useMilkSales() {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-milk-sales`, tenant?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(T.sales)
          .select('*, customer:customer_id(*)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('sale_date', { ascending: false })
        if (error) throw error
        return data ?? []
      },
      enabled: !!tenant?.id,
    })
  }

  function useKpis() {
    const { tenant } = useAuth()
    return useQuery({
      queryKey: [`${K}-kpis`, tenant?.id],
      queryFn: async () => {
        // Aggregate KPIs for dashboard
        const { data: animals } = await supabase.from(T.animals).select('id, status').eq('tenant_id', tenant.id).eq('is_deleted', false)
        const { data: logs } = await supabase.from(T.milk_logs).select('volume_liter').eq('tenant_id', tenant.id).gte('log_date', new Date().toISOString().split('T')[0])
        const { data: items } = await supabase.from(T.inventory).select('id, stock_quantity, reorder_level').eq('tenant_id', tenant.id)

        const totalLactating = animals?.filter(a => a.status === 'laktasi').length ?? 0
        const todayYield = logs?.reduce((sum, l) => sum + parseFloat(l.volume_liter), 0) ?? 0
        const lowStockCount = items?.filter(i => (i.stock_quantity || 0) <= (i.reorder_level || 0)).length ?? 0

        return {
          totalLactating,
          todayYield,
          lowStockCount,
          activeAnimals: animals?.length ?? 0
        }
      },
      enabled: !!tenant?.id,
    })
  }

  // ─── MUTATION HOOKS ────────────────────────────────────────────────────────

  function useLogProduction() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async (payload) => {
        const { error } = await supabase.from(T.milk_logs).insert({
          ...payload,
          tenant_id: tenant.id
        })
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-milk-logs`] })
        qc.invalidateQueries({ queryKey: [`${K}-yield-stats`] })
        qc.invalidateQueries({ queryKey: [`${K}-kpis`] })
        toast.success('Produksi berhasil dicatat')
      },
      onError: (err) => toast.error('Gagal simpan: ' + err.message)
    })
  }

  function useUpdateInventory() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async ({ item_id, type, quantity, notes }) => {
        const { error: txErr } = await supabase.from(T.transactions).insert({
          tenant_id: tenant.id,
          item_id, type, quantity, notes
        })
        if (txErr) throw txErr

        // Manual stock update for robust fallback
        const multiplier = type === 'in' ? 1 : -1
        const { data: item } = await supabase.from(T.inventory).select('stock_quantity').eq('id', item_id).single()
        const newQty = (item?.stock_quantity || 0) + (quantity * multiplier)
        
        const { error: updErr } = await supabase.from(T.inventory).update({ stock_quantity: newQty }).eq('id', item_id)
        if (updErr) throw updErr
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-inventory`] })
        qc.invalidateQueries({ queryKey: [`${K}-kpis`] })
      }
    })
  }

  function useLogSale() {
    const qc = useQueryClient()
    const { tenant } = useAuth()
    return useMutation({
      mutationFn: async (payload) => {
        const { error } = await supabase.from(T.sales).insert({
          ...payload,
          tenant_id: tenant.id
        })
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-milk-sales`] })
        qc.invalidateQueries({ queryKey: [`${K}-kpis`] })
        toast.success('Transaksi berhasil dicatat')
      }
    })
  }

  function useAddAnimal() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (payload) => {
        const { error } = await supabase.from(T.animals).insert(payload)
        if (error) throw error
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`${K}-animals`] })
        qc.invalidateQueries({ queryKey: [`${K}-kpis`] })
        toast.success('Ternak berhasil didaftarkan')
      }
    })
  }

  return {
    useAnimals,
    useLactatingAnimals,
    useActiveLactations,
    useMilkLogs,
    useInventory,
    useYieldStats,
    useCustomers,
    useMilkSales,
    useKpis,
    useLogProduction,
    useUpdateInventory,
    useLogSale,
    useAddAnimal,
  }
}
