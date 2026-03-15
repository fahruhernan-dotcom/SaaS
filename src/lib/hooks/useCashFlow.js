import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useCashFlow(period = 'month') {
  return useQuery({
    queryKey: ['cashflow', period],
    queryFn: async () => {
      const now = new Date()
      let startDate
      if (period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      }

      const start = startDate.toISOString().split('T')[0]

      const [salesRes, purchasesRes, deliveriesRes, lossRes] =
        await Promise.all([
          supabase.from('sales')
            .select('net_revenue, transaction_date, payment_status')
            .gte('transaction_date', start)
            .eq('is_deleted', false),

          supabase.from('purchases')
            .select('total_modal, transaction_date')
            .eq('is_deleted', false)
            .gte('transaction_date', start),

          supabase.from('deliveries')
            .select('delivery_cost, created_at')
            .eq('is_deleted', false)
            .gte('created_at', start),

          supabase.from('loss_reports')
            .select('financial_loss, report_date')
            .eq('is_deleted', false)
            .gte('report_date', start),
        ])

      const income = (salesRes.data || [])
        .filter(s => s.payment_status === 'lunas')
        .reduce((s, p) => s + (p.net_revenue || 0), 0)

      const modalBeli = (purchasesRes.data || [])
        .reduce((s, p) => s + (p.total_modal || 0), 0)

      const transport = (deliveriesRes.data || [])
        .reduce((s, d) => s + (d.delivery_cost || 0), 0)

      const losses = (lossRes.data || [])
        .reduce((s, l) => s + (l.financial_loss || 0), 0)

      const totalOut = modalBeli + transport + losses
      const netFlow = income - totalOut

      return {
        income,
        totalOut,
        modalBeli,
        transport,
        losses,
        netFlow,
        margin: income > 0 ? ((netFlow / income) * 100).toFixed(1) : 0,
        sales: salesRes.data || [],
        purchases: purchasesRes.data || [],
      }
    },
  })
}
