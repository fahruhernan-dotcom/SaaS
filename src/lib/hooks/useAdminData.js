import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { toast } from 'sonner'

export const useAllTenants = () => {
  return useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id, business_name, business_vertical, plan,
          is_active, trial_ends_at, plan_expires_at, created_at,
          profiles(id, full_name, role, user_type, is_active, last_seen_at)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })
}

export const useAdminUpdateTenant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ tenantId, updates }) => {
      const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tenants'])
      toast.success('Tenant berhasil diupdate')
    },
    onError: (error) => {
      toast.error('Gagal mengupdate tenant: ' + error.message)
    }
  })
}

export const useAllInvoices = () => {
  return useQuery({
    queryKey: ['admin-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_invoices')
        .select(`
          id, invoice_number, amount, plan, billing_period,
          billing_months, status, payment_proof_url, payment_method,
          xendit_invoice_id, xendit_payment_url,
          confirmed_by, confirmed_at, paid_at, notes, created_at,
          tenants(id, business_name, business_vertical)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })
}

export const useConfirmInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ invoiceId, tenantId, plan, billingMonths, notes }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const now = new Date().toISOString()

      // Superadmin mungkin tidak punya row di profiles — cek dulu, fallback null
      // supaya FK constraint "subscription_invoices_confirmed_by_fkey" tidak error
      let confirmedBy = null
      if (user?.id) {
        const { data: prof } = await supabase
          .from('profiles').select('id').eq('id', user.id).maybeSingle()
        confirmedBy = prof?.id ?? null
      }

      // 1. Update invoice status → paid
      const { error: invoiceErr } = await supabase
        .from('subscription_invoices')
        .update({
          status: 'paid',
          confirmed_at: now,
          paid_at: now,
          confirmed_by: confirmedBy,
          ...(notes ? { notes } : {})
        })
        .eq('id', invoiceId)
      if (invoiceErr) throw invoiceErr

      // 2. Update tenant plan + plan_expires_at (support stacking renewal)
      const { data: currentTenant } = await supabase
        .from('tenants')
        .select('plan_expires_at')
        .eq('id', tenantId)
        .single()

      // Stacking: kalau plan masih aktif, perpanjang dari tanggal expiry — bukan dari sekarang
      const baseDate = currentTenant?.plan_expires_at && new Date(currentTenant.plan_expires_at) > new Date()
        ? new Date(currentTenant.plan_expires_at)
        : new Date()

      const newExpiry = new Date(baseDate)
      newExpiry.setMonth(newExpiry.getMonth() + billingMonths)

      // Fetch dynamic kandang_limit from plan_configs (falls back to hardcoded defaults)
      const { data: planConfigRow } = await supabase
        .from('plan_configs')
        .select('config_value')
        .eq('config_key', 'kandang_limit')
        .maybeSingle()
      const kandangLimitConfig = planConfigRow?.config_value ?? {}
      const KANDANG_DEFAULTS = { starter: 1, pro: 2, business: 99 }
      const kandangLimit = kandangLimitConfig[plan] ?? KANDANG_DEFAULTS[plan] ?? 1

      const { error: tenantErr } = await supabase
        .from('tenants')
        .update({
          plan,
          plan_expires_at: newExpiry.toISOString(),
          kandang_limit: kandangLimit
        })
        .eq('id', tenantId)
      if (tenantErr) throw tenantErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-invoices'])
      queryClient.invalidateQueries(['admin-tenants'])
      toast.success('Invoice dikonfirmasi, plan tenant diupdate')
    },
    onError: (error) => {
      toast.error('Gagal konfirmasi invoice: ' + error.message)
    }
  })
}

export const usePaymentSettings = () => {
  return useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })
}

export const useDeletePaymentSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('payment_settings')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-settings'])
      toast.success('Rekening dihapus')
    },
    onError: (error) => {
      toast.error('Gagal hapus rekening: ' + error.message)
    }
  })
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ tenantId, plan, billingMonths, amount, notes }) => {
      const timestamp = Date.now().toString(36).toUpperCase()
      const random = crypto.getRandomValues(new Uint8Array(4))
        .reduce((str, b) => str + b.toString(16).padStart(2, '0'), '')
        .toUpperCase().substring(0, 4)
      const invoiceNumber = `INV-${timestamp}-${random}`

      const { error } = await supabase
        .from('subscription_invoices')
        .insert({
          tenant_id: tenantId,
          invoice_number: invoiceNumber,
          plan,
          billing_months: billingMonths,
          amount,
          notes: notes || null,
          status: 'pending',
          payment_method: 'manual'
        })
      if (error) throw error
      return invoiceNumber
    },
    onSuccess: (invoiceNumber) => {
      queryClient.invalidateQueries(['admin-invoices'])
      toast.success(`Invoice ${invoiceNumber} berhasil dibuat`)
    },
    onError: (error) => {
      toast.error('Gagal buat invoice: ' + error.message)
    }
  })
}

export const useXenditConfig = () => useQuery({
  queryKey: ['xendit-config'],
  queryFn: async () => {
    const { data } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('bank_name', 'xendit_config')
      .maybeSingle()
    return data || null
  }
})

export const useSaveXenditConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ api_key, webhook_token, callback_url, is_production }) => {
      const payload = {
        bank_name: 'xendit_config',
        account_number: api_key,
        account_name: JSON.stringify({ webhook_token, callback_url, is_production }),
        is_active: true
      }
      const existing = await supabase
        .from('payment_settings')
        .select('id')
        .eq('bank_name', 'xendit_config')
        .single()
      if (existing.data?.id) {
        const { error } = await supabase
          .from('payment_settings')
          .update(payload)
          .eq('id', existing.data.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('payment_settings')
          .insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['xendit-config'])
      queryClient.invalidateQueries(['payment-settings'])
      toast.success('Xendit config berhasil disimpan')
    },
    onError: () => toast.error('Gagal menyimpan Xendit config')
  })
}

export const useUpsertPaymentSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('payment_settings')
        .upsert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-settings'])
      toast.success('Rekening berhasil disimpan')
    },
    onError: (error) => {
      toast.error('Gagal simpan rekening: ' + error.message)
    }
  })
}

// --- Admin Phase 5: Pricing & Discounts (Supabase DB) ---

export const usePricingConfig = () => useQuery({
  queryKey: ['pricing-plans'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .order('role')
      .order('plan')
    if (error) throw error
    // Transform to { broker: { pro: { price, originalPrice, id }, business: {...} }, ... }
    return data.reduce((acc, row) => {
      if (!acc[row.role]) acc[row.role] = {}
      acc[row.role][row.plan] = {
        price: row.price,
        originalPrice: row.original_price,
        id: row.id
      }
      return acc
    }, {})
  }
})

export const useUpdatePricing = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ role, plan, price, originalPrice }) => {
      const { error } = await supabase
        .from('pricing_plans')
        .update({ price, original_price: originalPrice, updated_at: new Date().toISOString() })
        .eq('role', role)
        .eq('plan', plan)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pricing-plans'])
      toast.success('Harga berhasil diupdate')
    },
    onError: () => toast.error('Gagal update harga')
  })
}

export const useDiscountCodes = () => useQuery({
  queryKey: ['discount-codes'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
})

export const useCreateDiscountCode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('discount_codes')
        .insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['discount-codes'])
      toast.success('Kode diskon berhasil dibuat')
    },
    onError: (err) => toast.error('Gagal membuat kode: ' + err.message)
  })
}

export const useToggleDiscountCode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['discount-codes'])
  })
}

export const useDeleteDiscountCode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['discount-codes'])
      toast.success('Kode diskon dihapus')
    }
  })
}

// --- Plan Configs (plan_configs table) ---

export const usePlanConfigs = () => useQuery({
  queryKey: ['plan-configs'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('plan_configs')
      .select('*')
    if (error) throw error
    // Transform array → object keyed by config_key
    return data.reduce((acc, row) => {
      acc[row.config_key] = row.config_value
      return acc
    }, {})
  }
})

export const useUpdatePlanConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ config_key, config_value }) => {
      const { error } = await supabase
        .from('plan_configs')
        .upsert(
          { config_key, config_value, updated_at: new Date().toISOString() },
          { onConflict: 'config_key' }
        )
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-configs'] })
      toast.success('Konfigurasi berhasil disimpan')
    },
    onError: () => toast.error('Gagal menyimpan konfigurasi')
  })
}

export const useGlobalStats = () => useQuery({
  queryKey: ['admin-global-stats'],
  refetchInterval: 60_000,
  queryFn: async () => {
    const [tenantsRes, invoicesRes] = await Promise.all([
      supabase.from('tenants').select(`
        id, business_name, plan, is_active, trial_ends_at, plan_expires_at, created_at, business_vertical,
        profiles(id, is_active, last_seen_at, role)
      `),
      supabase.from('subscription_invoices').select(
        'id, invoice_number, amount, status, confirmed_at, created_at, tenant_id, plan, billing_months, tenants(business_name)'
      )
    ])
    if (tenantsRes.error) throw tenantsRes.error
    if (invoicesRes.error) throw invoicesRes.error

    const tenants  = tenantsRes.data  || []
    const invoices = invoicesRes.data || []
    const now           = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000)

    // Growth chart — last 6 calendar months (monthly new registrations)
    const monthLabels = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now)
      d.setMonth(d.getMonth() - (5 - i))
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('id-ID', { month: 'short' })
      }
    })
    const growthData = monthLabels.map(({ key, label }) => ({
      month: label,
      count: tenants.filter(t => {
        const d = new Date(t.created_at)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === key
      }).length
    }))

    return {
      tenants: {
        total:        tenants.length,
        active:       tenants.filter(t => t.is_active).length,
        pro:          tenants.filter(t => t.plan === 'pro'      && t.is_active).length,
        business:     tenants.filter(t => t.plan === 'business' && t.is_active).length,
        starter:      tenants.filter(t => t.plan === 'starter'  && t.is_active).length,
        newThisMonth: tenants.filter(t => new Date(t.created_at) > thirtyDaysAgo).length,
        trialExpiringSoon: tenants
          .filter(t => {
            if (t.plan !== 'starter' || !t.trial_ends_at) return false
            const diff = new Date(t.trial_ends_at) - now
            return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
          })
          .sort((a, b) => new Date(a.trial_ends_at) - new Date(b.trial_ends_at)),
        planExpiringSoon: tenants
          .filter(t => {
            if (!['pro', 'business'].includes(t.plan) || !t.plan_expires_at) return false
            const diff = new Date(t.plan_expires_at) - now
            return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
          })
          .sort((a, b) => new Date(a.plan_expires_at) - new Date(b.plan_expires_at)),
        planAlreadyExpired: tenants
          .filter(t =>
            ['pro', 'business'].includes(t.plan) &&
            t.plan_expires_at &&
            new Date(t.plan_expires_at) < now
          ),
        byVertical: {
          poultry_broker: tenants.filter(t => t.business_vertical === 'poultry_broker').length,
          egg_broker:     tenants.filter(t => t.business_vertical === 'egg_broker').length,
          peternak:       tenants.filter(t => t.business_vertical === 'peternak').length,
          rpa:            tenants.filter(t => t.business_vertical === 'rpa').length,
        },
        growthData
      },
      users: {
        total: new Set(tenants.flatMap(t => (t.profiles || []).map(p => p.id))).size,
        activeThisWeek: new Set(
          tenants.flatMap(t => t.profiles || [])
            .filter(p => p.last_seen_at && new Date(p.last_seen_at) > sevenDaysAgo)
            .map(p => p.id)
        ).size
      },
      revenue: {
        total:         invoices.filter(i => i.status === 'paid')
                         .reduce((sum, i) => sum + (i.amount || 0), 0),
        thisMonth:     invoices
                         .filter(i => i.status === 'paid' && i.paid_at && new Date(i.paid_at) > thirtyDaysAgo)
                         .reduce((sum, i) => sum + (i.amount || 0), 0),
        pendingAmount: invoices.filter(i => i.status === 'pending')
                         .reduce((sum, i) => sum + (i.amount || 0), 0),
        pendingList:   invoices
                         .filter(i => i.status === 'pending')
                         .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                         .slice(0, 5)
      }
    }
  }
})
export const useAuditLogs = (filters = {}) => {
  return useQuery({
    queryKey: ['admin-audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('global_audit_logs')
        .select(`
          *,
          actor:profiles(full_name, role),
          tenant:tenants(business_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filters.tenantId) query = query.eq('tenant_id', filters.tenantId)
      if (filters.action) query = query.eq('action', filters.action)
      if (filters.entityType) query = query.eq('entity_type', filters.entityType)

      const { data, error } = await query
      if (error) throw error
      return data
    }
  })
}

export const useAllUsers = () => {
  return useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, tenants(id, business_name, business_vertical)')
        .order('created_at', { ascending: false })
        .limit(200)
      
      if (error) throw error
      return data
    }
  })
}
