import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'

// ─── useNotifications ─────────────────────────────────────────────────────────

export const useNotifications = () => {
  const { tenant, profile } = useAuth()
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id,
  })

  // Realtime subscription — re-fetch on INSERT
  useEffect(() => {
    if (!tenant?.id) return

    const channel = supabase
      .channel('notifications-' + tenant.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'tenant_id=eq.' + tenant.id,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications', tenant.id] })
          toast(payload.new.title, {
            description: payload.new.body,
            duration: 5000,
          })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [tenant?.id, queryClient])

  const markAsRead = async (notifId) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId)
    queryClient.invalidateQueries({ queryKey: ['notifications', tenant?.id] })
  }

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('tenant_id', tenant?.id)
      .eq('is_read', false)
    queryClient.invalidateQueries({ queryKey: ['notifications', tenant?.id] })
  }

  const deleteNotif = async (notifId) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notifId)
    queryClient.invalidateQueries({ queryKey: ['notifications', tenant?.id] })
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotif,
  }
}

// ─── useNotificationGenerator ─────────────────────────────────────────────────

export const useNotificationGenerator = () => {
  const { tenant, profile } = useAuth()
  const { notifications } = useNotifications()

  const checkAndGenerate = async () => {
    if (!tenant?.id) return

    const today = new Date()
    // Build a set of "type+ref_id" keys so we don't re-insert duplicates
    const existingKeys = new Set(
      notifications.map((n) => n.type + (n.metadata?.ref_id ?? ''))
    )

    // 1. Piutang jatuh tempo
    const { data: overdueSales } = await supabase
      .from('sales')
      .select('id, rpa_clients(rpa_name), remaining_amount, due_date')
      .eq('tenant_id', tenant.id)
      .eq('is_deleted', false)
      .neq('payment_status', 'lunas')
      .lt('due_date', today.toISOString())

    for (const sale of overdueSales || []) {
      if (existingKeys.has('piutang_jatuh_tempo' + sale.id)) continue
      await supabase.from('notifications').insert({
        tenant_id: tenant.id,
        type: 'piutang_jatuh_tempo',
        title: 'Piutang Jatuh Tempo',
        body:
          (sale.rpa_clients?.rpa_name ?? 'RPA') +
          ' belum bayar dan sudah melewati due date.',
        action_url: '/broker/rpa',
        metadata: { ref_id: sale.id },
      })
    }

    // 2. Trial akan habis (≤ 7 hari)
    if (tenant.trial_ends_at) {
      const trialEnd = new Date(tenant.trial_ends_at)
      const daysLeft = Math.ceil((trialEnd - today) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 7 && daysLeft > 0) {
        if (!existingKeys.has('subscription_expires' + tenant.id)) {
          await supabase.from('notifications').insert({
            tenant_id: tenant.id,
            type: 'subscription_expires',
            title: 'Trial Akan Berakhir',
            body:
              'Trial kamu berakhir dalam ' +
              daysLeft +
              ' hari. Upgrade sekarang untuk tidak kehilangan akses.',
            action_url: profile?.user_type === 'peternak' ? '/peternak/akun' : profile?.user_type === 'rpa' ? '/rpa-buyer/akun' : '/broker/akun',
            metadata: { ref_id: tenant.id, days_left: daysLeft },
          })
        }
      }
    }

    // 3. Stok pakan menipis (peternak only)
    if (profile?.user_type === 'peternak' && tenant?.business_vertical === 'peternak') {
      const { data: allStocks } = await supabase
        .from('feed_stocks')
        .select('*, peternak_farms(id, farm_name)')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('feed_type', { ascending: true })

      const lowStocks = allStocks?.filter(s => s.quantity_kg < 100) || []

      for (const stock of lowStocks || []) {
        if (existingKeys.has('stok_pakan_menipis' + stock.id)) continue
        await supabase.from('notifications').insert({
          tenant_id: tenant.id,
          type: 'stok_pakan_menipis',
          title: 'Stok Pakan Menipis',
          body:
            stock.feed_type +
            ' di ' +
            (stock.peternak_farms?.farm_name ?? 'kandang') +
            ' tinggal ' +
            stock.quantity_kg +
            ' kg.',
          action_url: '/peternak/pakan',
          metadata: { ref_id: stock.id },
        })
      }
    }
  }

  useEffect(() => {
    checkAndGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id])

  return { checkAndGenerate }
}
