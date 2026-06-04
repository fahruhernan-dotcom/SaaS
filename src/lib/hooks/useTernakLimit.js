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
      let currentCount = 0

      if (speciesGroup === 'domba_kambing') {
        const [dombaF, dombaB, kambingF, kambingB] = await Promise.all([
          supabase.from('domba_penggemukan_animals').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('status', ['active', 'aktif']).eq('is_deleted', false),
          supabase.from('domba_breeding_animals').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('status', ['active', 'aktif']).eq('is_deleted', false),
          supabase.from('kambing_penggemukan_animals').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('status', ['active', 'aktif']).eq('is_deleted', false),
          supabase.from('kambing_breeding_animals').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('status', ['active', 'aktif']).eq('is_deleted', false),
        ])

        if (dombaF.error) throw dombaF.error
        if (dombaB.error) throw dombaB.error
        if (kambingF.error) throw kambingF.error
        if (kambingB.error) throw kambingB.error

        currentCount = (dombaF.count || 0) + (dombaB.count || 0) + (kambingF.count || 0) + (kambingB.count || 0)
      } else if (speciesGroup === 'sapi') {
        const [sapiF, sapiB] = await Promise.all([
          supabase.from('sapi_penggemukan_animals').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('status', ['active', 'aktif']).eq('is_deleted', false),
          supabase.from('sapi_breeding_animals').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('status', ['active', 'aktif', 'bunting']).eq('is_deleted', false),
        ])

        if (sapiF.error) throw sapiF.error
        if (sapiB.error) throw sapiB.error

        currentCount = (sapiF.count || 0) + (sapiB.count || 0)
      }

      const limitRes = await supabase.rpc('get_ternak_limit', {
        p_tenant_id: tenantId,
        p_species_group: speciesGroup,
      })
      if (limitRes.error) throw limitRes.error

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
