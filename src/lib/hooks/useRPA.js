import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useRPA() {
  return useQuery({
    queryKey: ['rpa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rpa_clients')
        .select('*')
        .eq('is_deleted', false)
        .order('rpa_name', { ascending: true })
      
      if (error) throw error
      return data
    },
  })
}
