import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useFarms() {
  return useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('is_deleted', false)
        .order('farm_name', { ascending: true })
      
      if (error) throw error
      return data
    },
  })
}
