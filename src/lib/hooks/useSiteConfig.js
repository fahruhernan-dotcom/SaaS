import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useSiteConfig() {
  return useQuery({
    queryKey: ['site_config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_config').select('key, value')
      if (error) throw error
      return Object.fromEntries(data.map(r => [r.key, r.value]))
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useUpdateSiteConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }) => {
      const { error } = await supabase
        .from('site_config')
        .upsert({ key, value, updated_at: new Date() }, { onConflict: 'key' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site_config'] }),
  })
}
