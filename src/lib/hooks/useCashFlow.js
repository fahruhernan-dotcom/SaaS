import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useCashFlow(startDate, endDate, tenantId) {
  return useQuery({
    queryKey: ['cashflow', tenantId, startDate, endDate],
    queryFn: async () => {
      // Ensure date strings are in correct format for filtering
      const startStr = typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0]
      const endStr = typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0]

      const [salesRes, purchasesRes, deliveriesRes, lossRes, expensesRes] = await Promise.all([
        supabase.from('sales')
          .select('id, net_revenue, delivery_cost, total_revenue, total_weight_kg, transaction_date, payment_status, rpa_id, rpa_clients(rpa_name)')
          .eq('tenant_id', tenantId)
          .eq('is_deleted', false)
          .gte('transaction_date', startStr)
          .lte('transaction_date', endStr)
          .order('transaction_date', { ascending: true }),

        supabase.from('purchases')
          .select('id, total_modal, total_cost, transaction_date, farm_id, farms(farm_name)')
          .eq('tenant_id', tenantId)
          .eq('is_deleted', false)
          .gte('transaction_date', startStr)
          .lte('transaction_date', endStr)
          .order('transaction_date', { ascending: true }),

        supabase.from('deliveries')
          .select('id, delivery_cost, created_at, driver_name, sale_id, sales(rpa_clients(rpa_name))')
          .eq('tenant_id', tenantId)
          .eq('is_deleted', false)
          .gte('created_at', startStr + 'T00:00:00')
          .lte('created_at', endStr + 'T23:59:59'),

        supabase.from('loss_reports')
          .select('id, financial_loss, report_date, loss_type, description')
          .eq('tenant_id', tenantId)
          .eq('is_deleted', false)
          .gte('report_date', startStr)
          .lte('report_date', endStr),

        supabase.from('extra_expenses')
          .select('id, amount, expense_date, category, description')
          .eq('tenant_id', tenantId)
          .eq('is_deleted', false)
          .gte('expense_date', startStr)
          .lte('expense_date', endStr)
          .order('expense_date', { ascending: true }),
      ])

      const sales      = salesRes.data      || []
      const purchases  = purchasesRes.data  || []
      const deliveries = deliveriesRes.data || []
      const losses     = lossRes.data       || []
      const expenses   = expensesRes.data   || []

      const totalPemasukan = sales.reduce((s, t) => s + (Number(t.net_revenue) || 0), 0)
      const totalModalBeli = purchases.reduce((s, t) => s + (Number(t.total_cost) || 0), 0)
      const totalTransport = sales.reduce((s, t) => s + (Number(t.delivery_cost) || 0), 0)
      const totalKerugian = losses.reduce((s, t) => s + (Number(t.financial_loss) || 0), 0)
      const totalExtra = expenses.reduce((s, t) => s + (Number(t.amount) || 0), 0)
      
      const totalKeluar = totalModalBeli + totalKerugian + totalExtra
      const netCashFlow = totalPemasukan - totalKeluar

      return {
        sales, purchases, deliveries, losses, expenses,
        summary: {
          totalPemasukan, 
          totalModal: totalModalBeli, 
          totalTransport,
          totalKerugian, 
          totalExtra, 
          totalKeluar,
          netCashFlow,
          marginPct: totalPemasukan > 0
            ? ((netCashFlow / totalPemasukan) * 100).toFixed(1)
            : 0
        }
      }
    },
    enabled: !!tenantId && !!startDate && !!endDate
  })
}
