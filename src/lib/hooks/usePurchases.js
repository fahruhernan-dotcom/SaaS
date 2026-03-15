import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function usePurchases() {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, farms(farm_name)')
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
      
      if (error) throw error
      return data
    },
  })
}
