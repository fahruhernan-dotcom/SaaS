import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export function useRPA() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['rpa-clients', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rpa_clients')
        .select('id, rpa_name, buyer_type, phone, location, province, total_outstanding, payment_terms, reliability_score, notes')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('rpa_name', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id
  })
}
