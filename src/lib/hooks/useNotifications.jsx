import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { getXBasePath, resolveBusinessVertical } from '../businessModel'
import { getSubscriptionStatus } from '../subscriptionUtils'

const toTitleCase = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : ''

const NotificationsContext = createContext()

/**
 * Hook to manage notification state and visibility
 */
export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { tenant } = useAuth()

  const fetchNotifications = async () => {
    if (!tenant?.id) return
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error) setNotifications((data || []).filter(n => !n.is_deleted))
    setLoading(false)
  }

  useEffect(() => {
    if (tenant?.id) fetchNotifications()
    
    // Realtime subscription
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `tenant_id=eq.${tenant?.id}` 
      }, fetchNotifications)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [tenant?.id])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markAsRead = async (id) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    fetchNotifications()
  }

  const markAllAsRead = async () => {
    if (!tenant?.id) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('tenant_id', tenant.id)
      .eq('is_read', false)
    fetchNotifications()
  }

  const deleteNotif = async (id) => {
    await supabase
      .from('notifications')
      .update({ is_deleted: true })
      .eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <NotificationsContext.Provider value={{ notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotif, refetch: fetchNotifications }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext) ?? {
  notifications: [], loading: false, unreadCount: 0,
  markAsRead: async () => {}, markAllAsRead: async () => {}, deleteNotif: async () => {}, refetch: () => {},
}

/**
 * Generator Hook: Periodically checks for new business-level alerts
 */
export const useNotificationGenerator = () => {
  const { tenant, profile } = useAuth()
  const context = useNotifications()
  const notificationsRef = useRef([])
  notificationsRef.current = context?.notifications || []

  const vertical = resolveBusinessVertical(profile, tenant)
  const basePath = getXBasePath(tenant, profile)

  const checkAndGenerate = async () => {
    if (!tenant?.id) return
    try {
      const today = new Date()
      // Use ref to always read latest notifications without stale closure
      const existingKeys = new Set(
        notificationsRef.current.map((n) => n.type + (n.metadata?.ref_id ?? ''))
      )

      // 1. Piutang jatuh tempo
      if (vertical === 'poultry_broker') {
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
            body: `${sale.rpa_clients?.rpa_name ?? 'RPA'} belum bayar dan sudah melewati due date.`,
            action_url: `${basePath}/rpa`,
            metadata: { ref_id: sale.id },
          })
        }
      }

      if (vertical === 'distributor_sembako') {
        const { data: overdueSales } = await supabase
          .from('sembako_sales')
          .select('id, sembako_customers(customer_name), remaining_amount, due_date')
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
            body: `${sale.sembako_customers?.customer_name ?? 'Customer'} belum bayar dan sudah melewati due date.`,
            action_url: `${basePath}/penjualan`,
            metadata: { ref_id: sale.id },
          })
        }
      }

      // 2. Notifikasi subscription
      const sub = getSubscriptionStatus(tenant)
      
      // Only notify for trial or active paid plans with imminent expiry
      if (sub.status === 'trial' || (sub.status === 'active' && sub.plan !== 'starter' && sub.isExpiringSoon)) {
        if (!existingKeys.has('subscription_expires' + tenant.id)) {
          const title = sub.status === 'trial' ? 'Trial Akan Berakhir' : `Langganan ${toTitleCase(sub.plan)} Akan Berakhir`
          await supabase.from('notifications').insert({
            tenant_id: tenant.id,
            type: 'subscription_expires',
            title,
            body: sub.status === 'trial' 
              ? `Trial kamu berakhir dalam ${sub.daysLeft} hari.`
              : `Langganan ${toTitleCase(sub.plan)} kamu berakhir dalam ${sub.daysLeft} hari.`,
            action_url: `${basePath}/akun`,
            metadata: { ref_id: tenant.id, days_left: sub.daysLeft },
          })
        }
      }

      // 3. Stok pakan menipis (peternak only)
      if (vertical === 'peternak') {
        const { data: allStocks } = await supabase
          .from('feed_stocks')
          .select('*, peternak_farms(id, farm_name)')
          .eq('tenant_id', tenant.id)
          .order('feed_type', { ascending: true })

        for (const stock of (allStocks || []).filter(s => s.quantity_kg < 100)) {
          if (existingKeys.has('stok_pakan_menipis' + stock.id)) continue
          await supabase.from('notifications').insert({
            tenant_id: tenant.id,
            type: 'stok_pakan_menipis',
            title: 'Stok Pakan Menipis',
            body: `${stock.feed_type} tinggal ${stock.quantity_kg} kg.`,
            action_url: `${basePath}/pakan`,
            metadata: { ref_id: stock.id },
          })
        }

        // 4. Tugas terlambat — one summary notif per day
        const todayStr = today.toISOString().split('T')[0]
        if (!existingKeys.has('tugas_terlambat' + todayStr)) {
          const { count: overdueCount } = await supabase
            .from('peternak_task_instances')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)
            .eq('status', 'terlambat')

          if ((overdueCount ?? 0) > 0) {
            await supabase.from('notifications').insert({
              tenant_id: tenant.id,
              type: 'tugas_terlambat',
              title: `${overdueCount} Tugas Terlambat`,
              body: `Ada ${overdueCount} tugas yang melewati tenggat waktu dan belum diselesaikan.`,
              action_url: `${basePath}/daily_task`,
              metadata: { ref_id: todayStr, count: overdueCount },
            })
          }
        }
      }

      // Always refetch after generation — don't rely solely on realtime
      context.refetch()
    } catch (err) {
      // Notification generation is non-critical — silently skip on error
    }
  }

  useEffect(() => {
    checkAndGenerate()
  }, [tenant?.id, vertical])

  return { checkAndGenerate }
}
