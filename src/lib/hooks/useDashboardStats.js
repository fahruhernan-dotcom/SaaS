import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      const [salesRes, purchasesRes, rpaRes, farmsRes] = await Promise.all([
        supabase.from('sales')
          .select('total_revenue, net_revenue, remaining_amount, payment_status, transaction_date, rpa_id, rpa_clients(rpa_name)')
          .eq('is_deleted', false),
        supabase.from('purchases')
          .select('total_modal, transaction_date')
          .eq('is_deleted', false),
        supabase.from('rpa_clients')
          .select('id, rpa_name, total_outstanding')
          .eq('is_deleted', false),
        supabase.from('farms')
          .select('id, farm_name, status, harvest_date, available_stock')
          .eq('is_deleted', false),
      ])

      const sales = salesRes.data || []
      const purchases = purchasesRes.data || []
      const rpas = rpaRes.data || []
      const farms = farmsRes.data || []

      const todaySales = sales.filter(s => s.transaction_date === today)
      const todayPurchases = purchases.filter(p => p.transaction_date === today)

      const todayRevenue = todaySales.reduce((s, t) => s + (t.net_revenue || 0), 0)
      const todayModal = todayPurchases.reduce((s, t) => s + (t.total_modal || 0), 0)
      const todayProfit = todayRevenue - todayModal

      const totalPiutang = rpas.reduce((s, r) => s + (r.total_outstanding || 0), 0)
      const rpaWithDebt = rpas.filter(r => r.total_outstanding > 0)
      const topRPADebt = [...rpaWithDebt]
        .sort((a, b) => b.total_outstanding - a.total_outstanding)
        .slice(0, 3)

      const readyFarms = farms.filter(f => f.status === 'ready')

      const recentTransactions = [
        ...todaySales.map(s => ({
          type: 'jual',
          name: s.rpa_clients?.rpa_name,
          amount: s.net_revenue,
          profit: null,
          date: s.transaction_date,
        })),
        ...todayPurchases.map(p => ({
          type: 'beli',
          name: null,
          amount: p.total_modal,
          date: p.transaction_date,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date))

      return {
        todayProfit,
        todayTransactionCount: todaySales.length + todayPurchases.length,
        todaySalesCount: todaySales.length,
        todayPurchasesCount: todayPurchases.length,
        totalPiutang,
        rpaWithDebtCount: rpaWithDebt.length,
        topRPADebt,
        readyFarmsCount: readyFarms.length,
        readyFarms,
        recentTransactions,
      }
    },
  })
}
