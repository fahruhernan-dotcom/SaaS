import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useChickenBatches(statusFilter = null) {
  return useQuery({
    queryKey: ['chicken-batches', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('chicken_batches')
        .select('*, farms(farm_name, owner_name, phone, location)')
        .eq('is_deleted', false)
        .order('estimated_harvest_date', { ascending: true })

      if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
