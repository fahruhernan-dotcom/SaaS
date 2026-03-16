import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export function useSales() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sales', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id, 
          transaction_date, 
          quantity, 
          total_weight_kg, 
          net_revenue, 
          payment_status, 
          paid_amount, 
          remaining_amount, 
          tenant_id,
          rpa_id,
          rpa_clients(rpa_name), 
          purchases(farm_id, farms(farm_name))
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id
  })
}
