import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*, rpa_clients(rpa_name), purchases(*, farms(farm_name))')
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
      
      if (error) throw error
      return data
    },
  })
}
