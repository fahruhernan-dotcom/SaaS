import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

/**
 * Cek limit ternak aktif per tenant berdasarkan plan.
 *
 * @param {'domba_kambing'|'sapi'} speciesGroup
 * @returns {{ currentCount, limit, canAdd, isUnlimited, isLoading }}
 *   limit null  → unlimited (business plan)
 *   canAdd true → boleh tambah ternak baru
 */
export function useTernakLimit(speciesGroup) {
  const { tenant } = useAuth()
  const tenantId = tenant?.id

  const { data, isLoading } = useQuery({
    queryKey: ['ternak-limit', tenantId, speciesGroup],
    queryFn: async () => {
      const [countRes, limitRes] = await Promise.all([
        supabase.rpc('get_active_ternak_count', {
          p_tenant_id: tenantId,
          p_species_group: speciesGroup,
        }),
        supabase.rpc('get_ternak_limit', {
          p_tenant_id: tenantId,
          p_species_group: speciesGroup,
        }),
      ])

      if (countRes.error) throw countRes.error
      if (limitRes.error) throw limitRes.error

      const currentCount = countRes.data ?? 0
      const limit = limitRes.data  // null = unlimited

      return { currentCount, limit }
    },
    enabled: !!tenantId && !!speciesGroup,
    staleTime: 1000 * 60 * 2, // 2 menit — count bisa berubah setelah tambah/hapus ternak
  })

  const currentCount = data?.currentCount ?? 0
  const limit = data?.limit ?? null
  const isUnlimited = limit === null
  const canAdd = isUnlimited || currentCount < limit

  return { currentCount, limit, canAdd, isUnlimited, isLoading }
}
