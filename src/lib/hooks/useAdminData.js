import { useState, useEffect } from 'react'
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
          is_active, trial_ends_at, created_at,
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
          billing_months, status, transfer_proof_url,
          confirmed_by, confirmed_at, created_at,
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
    mutationFn: async ({ invoiceId, tenantId, plan, billingMonths }) => {
      // 1. Update invoice status → paid, confirmed_at
      const { error: invoiceErr } = await supabase
        .from('subscription_invoices')
        .update({
          status: 'paid',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
      if (invoiceErr) throw invoiceErr

      // 2. Update tenant plan
      // Calculate new trial_ends_at
      const trialEndsAt = new Date()
      trialEndsAt.setMonth(trialEndsAt.getMonth() + billingMonths)
      const { error: tenantErr } = await supabase
        .from('tenants')
        .update({ plan, trial_ends_at: trialEndsAt.toISOString() })
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
        .eq('is_active', true)
      if (error) throw error
      return data
    }
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

// --- Admin Phase 5: Pricing & Discounts (LocalStorage Implementation) ---

// Custom event-based bus for reactivity
const pricingBus = new Set()
const invalidatePricing = () => pricingBus.forEach(fn => fn())

const discountBus = new Set()
const invalidateDiscounts = () => discountBus.forEach(fn => fn())

export const usePricingConfig = () => {
  const [data, setData] = useState(null)
  
  const load = () => {
    const DEFAULT_PRICING = {
      broker:   { pro: 999000,  business: 1499000 },
      peternak: { pro: 499000,  business: 999000  },
      rpa:      { pro: 699000,  business: 1499000 }
    }
    const saved = localStorage.getItem('ternakos_pricing_config')
    setData(saved ? JSON.parse(saved) : DEFAULT_PRICING)
  }

  useEffect(() => {
    load()
    pricingBus.add(load)
    return () => pricingBus.delete(load)
  }, [])

  return { data, isLoading: data === null }
}

export const useUpdatePricing = () => {
  return {
    mutate: (payload) => {
      localStorage.setItem('ternakos_pricing_config', JSON.stringify(payload))
      invalidatePricing()
      toast.success('Harga berhasil diupdate')
    }
  }
}

export const useDiscountCodes = () => {
  const [data, setData] = useState(null)
  
  const load = () => {
    const saved = localStorage.getItem('ternakos_discount_codes')
    setData(saved ? JSON.parse(saved) : [])
  }

  useEffect(() => {
    load()
    discountBus.add(load)
    return () => discountBus.delete(load)
  }, [])

  return { data, isLoading: data === null }
}

export const useCreateDiscountCode = () => {
  return {
    mutate: (payload) => {
      const saved = localStorage.getItem('ternakos_discount_codes')
      const current = saved ? JSON.parse(saved) : []
      const newList = [{
        ...payload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        usage_count: 0,
        is_active: true
      }, ...current]
      localStorage.setItem('ternakos_discount_codes', JSON.stringify(newList))
      invalidateDiscounts()
      toast.success('Kode diskon berhasil dibuat')
    }
  }
}

export const useToggleDiscountCode = () => {
  return {
    mutate: (codeId) => {
      const saved = localStorage.getItem('ternakos_discount_codes')
      const current = saved ? JSON.parse(saved) : []
      const newList = current.map(c => 
        c.id === codeId ? { ...c, is_active: !c.is_active } : c
      )
      localStorage.setItem('ternakos_discount_codes', JSON.stringify(newList))
      invalidateDiscounts()
      toast.success('Status voucher diupdate')
    }
  }
}

export const useDeleteDiscountCode = () => {
  return {
    mutate: (codeId) => {
      const saved = localStorage.getItem('ternakos_discount_codes')
      const current = saved ? JSON.parse(saved) : []
      const newList = current.filter(c => c.id !== codeId)
      localStorage.setItem('ternakos_discount_codes', JSON.stringify(newList))
      invalidateDiscounts()
      toast.success('Voucher berhasil dihapus')
    }
  }
}

export const useGlobalStats = () => {
  return useQuery({
    queryKey: ['admin-global-stats'],
    queryFn: async () => {
      // Fetch parallel semua data yang dibutuhkan
      const [tenantsRes, invoicesRes] = await Promise.all([
        supabase.from('tenants').select(`
          id, business_name, plan, is_active, trial_ends_at, created_at, business_vertical,
          profiles(id, is_active, last_seen_at)
        `),
        supabase.from('subscription_invoices').select(`
          id, invoice_number, amount, status, confirmed_at, created_at,
          tenants(business_name)
        `)
      ])
      if (tenantsRes.error) throw tenantsRes.error
      if (invoicesRes.error) throw invoicesRes.error

      const tenants = tenantsRes.data
      const invoices = invoicesRes.data
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      return {
        tenants: {
          total: tenants.length,
          active: tenants.filter(t => t.is_active).length,
          pro: tenants.filter(t => t.plan === 'pro' && t.is_active).length,
          business: tenants.filter(t => t.plan === 'business' && t.is_active).length,
          starter: tenants.filter(t => t.plan === 'starter' && t.is_active).length,
          trialExpiringSoon: tenants.filter(t => {
            if (!t.trial_ends_at) return false
            const diff = new Date(t.trial_ends_at) - now
            return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
          }).length,
          newThisMonth: tenants.filter(t =>
            new Date(t.created_at) > thirtyDaysAgo
          ).length,
          byVertical: {
            poultry_broker: tenants.filter(t => t.business_vertical === 'poultry_broker').length,
            egg_broker: tenants.filter(t => t.business_vertical === 'egg_broker').length,
            peternak: tenants.filter(t => t.business_vertical === 'peternak').length,
            rpa: tenants.filter(t => t.business_vertical === 'rpa').length,
          },
          listExpiring: tenants.filter(t => {
             if (!t.trial_ends_at) return false
             const diff = new Date(t.trial_ends_at) - now
             return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
          }).sort((a, b) => new Date(a.trial_ends_at) - new Date(b.trial_ends_at))
        },
        users: {
          total: tenants.reduce((sum, t) => sum + (t.profiles?.length || 0), 0),
          activeThisWeek: tenants.reduce((sum, t) => {
            return sum + (t.profiles || []).filter(p =>
              p.last_seen_at && new Date(p.last_seen_at) > sevenDaysAgo
            ).length
          }, 0)
        },
        revenue: {
          total: invoices.filter(i => i.status === 'paid')
            .reduce((sum, i) => sum + i.amount, 0),
          thisMonth: invoices.filter(i =>
            i.status === 'paid' && new Date(i.confirmed_at) > thirtyDaysAgo
          ).reduce((sum, i) => sum + i.amount, 0),
          pending: invoices.filter(i => i.status === 'pending')
            .reduce((sum, i) => sum + i.amount, 0),
          pendingCount: invoices.filter(i => i.status === 'pending').length,
          recentPending: invoices.filter(i => i.status === 'pending')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
        },
        raw: { tenants, invoices }
      }
    },
    refetchInterval: 60_000
  })
}
