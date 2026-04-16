import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

// ─── PURCHASE SIDE (beli dari broker) ────────────────────────────────────────

export const useRPAPurchaseOrders = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['rpa-purchase-orders', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rpa_purchase_orders')
        .select('*, tenants!broker_tenant_id(business_name)')
        .eq('rpa_tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({
      chicken_type, requested_count, requested_weight_kg,
      target_price_per_kg, requested_date, notes,
    }) => {
      const { error } = await supabase.from('rpa_purchase_orders').insert({
        rpa_tenant_id: tenant.id,
        chicken_type, requested_count, requested_weight_kg,
        target_price_per_kg, requested_date, notes,
        status: 'open',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpa-purchase-orders', tenant?.id] })
      queryClient.invalidateQueries({ queryKey: ['rpa-dashboard-stats', tenant?.id] })
      toast.success('Order berhasil dikirim ke broker')
    },
    onError: (err) => toast.error('Gagal kirim order: ' + err.message),
  })
}

// ─── SALES SIDE (jual ke toko) ───────────────────────────────────────────────

export const useRPACustomers = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['rpa-customers', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rpa_customers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('customer_name')
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

export const useRPAProducts = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['rpa-products', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rpa_products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .eq('is_active', true)
        .order('product_name')
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

export const useRPAInvoices = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['rpa-invoices', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rpa_invoices')
        .select('*, rpa_customers(customer_name, customer_type, phone), rpa_invoice_items(*)')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

// ─── SALES SIDE MUTATIONS ────────────────────────────────────────────────────

export const useCreateCustomer = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase.from('rpa_customers')
        .insert({ ...payload, tenant_id: tenant.id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpa-customers', tenant?.id] })
      toast.success('Toko berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal tambah toko: ' + err.message),
  })
}

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase.from('rpa_customers').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpa-customers', tenant?.id] })
      toast.success('Data toko diperbarui')
    },
    onError: (err) => toast.error('Gagal update toko: ' + err.message),
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase.from('rpa_products')
        .insert({ ...payload, tenant_id: tenant.id, is_active: true })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpa-products', tenant?.id] })
      toast.success('Produk berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal tambah produk: ' + err.message),
  })
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ customer_id, customer_name, transaction_date, due_date, items, notes }) => {
      // Generate invoice number (crypto.getRandomValues — NOT Math.random)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 4)
      const invoice_number = `RPA-${dateStr}-${rand}`

      // Calculate totals from items
      const total_amount = items.reduce((s, item) =>
        s + Math.round((item.quantity_kg || 0) * (item.price_per_kg || 0)), 0)
      const total_cost = items.reduce((s, item) =>
        s + Math.round((item.quantity_kg || 0) * (item.cost_per_kg || 0)), 0)

      // Insert invoice header — NO net_profit, NO remaining_amount (generated columns)
      const { data: invoice, error: invErr } = await supabase
        .from('rpa_invoices').insert({
          tenant_id: tenant.id, customer_id, customer_name,
          invoice_number, transaction_date, due_date: due_date || null,
          total_amount, total_cost,
          payment_status: 'belum_lunas', paid_amount: 0,
          notes: notes || null,
        }).select().single()
      if (invErr) throw invErr

      // Insert items — NO subtotal (generated column)
      const itemRows = items.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity_kg: item.quantity_kg,
        price_per_kg: item.price_per_kg,
        cost_per_kg: item.cost_per_kg || 0,
      }))
      const { error: itemErr } = await supabase.from('rpa_invoice_items').insert(itemRows)
      if (itemErr) throw itemErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpa-invoices', tenant?.id] })
      queryClient.invalidateQueries({ queryKey: ['rpa-dashboard-stats', tenant?.id] })
      toast.success('Invoice berhasil dibuat')
    },
    onError: (err) => {
      // Trigger QUOTA_EXCEEDED has structured message: "QUOTA_EXCEEDED|rpa_invoices|starter|limit|used"
      if (err.message?.startsWith('QUOTA_EXCEEDED')) {
        const [, , , limit, used] = err.message.split('|')
        toast.error('Kuota invoice habis', {
          description: `Plan Starter dibatasi ${limit} invoice/bulan (${used} terpakai). Upgrade ke Pro untuk unlimited.`,
        })
      } else {
        toast.error('Gagal buat invoice: ' + err.message)
      }
    },
  })
}

export const useRecordCustomerPayment = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ invoice_id, customer_id, amount, payment_date, payment_method, reference_no, notes }) => {
      // Insert payment record
      const { error: payErr } = await supabase.from('rpa_customer_payments').insert({
        tenant_id: tenant.id, invoice_id, customer_id,
        amount, payment_date, payment_method,
        reference_no: reference_no || null,
        notes: notes || null,
      })
      if (payErr) throw payErr

      // Update invoice paid_amount + payment_status
      const { data: invoice, error: fetchErr } = await supabase
        .from('rpa_invoices').select('total_amount, paid_amount').eq('id', invoice_id).single()
      if (fetchErr) throw fetchErr

      const newPaid = (invoice.paid_amount || 0) + amount
      const newStatus = newPaid >= invoice.total_amount ? 'lunas'
        : newPaid > 0 ? 'sebagian' : 'belum_lunas'

      const { error: invErr } = await supabase.from('rpa_invoices')
        .update({ paid_amount: newPaid, payment_status: newStatus }).eq('id', invoice_id)
      if (invErr) throw invErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpa-invoices', tenant?.id] })
      queryClient.invalidateQueries({ queryKey: ['rpa-customers', tenant?.id] })
      queryClient.invalidateQueries({ queryKey: ['rpa-dashboard-stats', tenant?.id] })
      toast.success('Pembayaran berhasil dicatat')
    },
    onError: (err) => toast.error('Gagal catat pembayaran: ' + err.message),
  })
}

// ─── PURCHASE ORDER MUTATIONS ────────────────────────────────────────────────

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ orderId, updates }) => {
      const { error } = await supabase
        .from('rpa_purchase_orders').update(updates).eq('id', orderId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpa-purchase-orders', tenant?.id] })
      toast.success('Order diperbarui')
    },
    onError: (err) => toast.error('Gagal update order: ' + err.message),
  })
}

// ─── PAYMENT TO BROKER ───────────────────────────────────────────────────────

export const useRPAPaymentsToSend = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['rpa-payments-to-broker', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rpa_payments')
        .select('*, tenants!broker_tenant_id(business_name)')
        .eq('rpa_tenant_id', tenant.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

export const useCreateRPAPayment = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ broker_tenant_id, amount, payment_method, reference_no, notes }) => {
      const { error } = await supabase.from('rpa_payments').insert({
        rpa_tenant_id: tenant.id,
        broker_tenant_id, amount, payment_method, reference_no, notes,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpa-payments-to-broker', tenant?.id] })
      queryClient.invalidateQueries({ queryKey: ['rpa-dashboard-stats', tenant?.id] })
      toast.success('Pembayaran berhasil dicatat')
    },
    onError: (err) => toast.error('Gagal catat pembayaran: ' + err.message),
  })
}

// ─── RPA PROFILE ─────────────────────────────────────────────────────────────

export const useRPAProfile = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['rpa-profile', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rpa_profiles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id,
  })
}

export const useUpsertRPAProfile = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ business_name, ...profileFields }) => {
      // Update tenants.business_name if provided
      if (business_name !== undefined) {
        const { error } = await supabase.from('tenants')
          .update({ business_name }).eq('id', tenant.id)
        if (error) throw error
      }
      // Upsert rpa_profiles
      const { error } = await supabase.from('rpa_profiles').upsert({
        tenant_id: tenant.id, ...profileFields,
      }, { onConflict: 'tenant_id' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpa-profile', tenant?.id] })
      toast.success('Profil berhasil disimpan')
    },
    onError: (err) => toast.error('Gagal simpan profil: ' + err.message),
  })
}

// ─── MARGIN REPORT ───────────────────────────────────────────────────────────

export const useRPAMarginReport = (startDate, endDate) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['rpa-margin-report', tenant?.id, startDate, endDate],
    enabled: !!tenant?.id && !!startDate && !!endDate,
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from('rpa_invoices')
        .select('*, rpa_invoice_items(*), rpa_customers(customer_name, customer_type)')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
      if (error) throw error

      const { data: purchaseOrders } = await supabase
        .from('rpa_purchase_orders')
        .select('id, status, created_at, requested_weight_kg, target_price_per_kg')
        .eq('rpa_tenant_id', tenant.id)
        .gte('created_at', startDate + 'T00:00:00')
        .lte('created_at', endDate + 'T23:59:59')

      const inv = invoices ?? []
      const totalRevenue = inv.reduce((s, i) => s + (i.total_amount || 0), 0)
      const totalCost = inv.reduce((s, i) => s + (i.total_cost || 0), 0)
      const totalProfit = inv.reduce((s, i) => s + (i.net_profit || 0), 0)
      const marginPct = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : 0

      // Group by product name
      const byProduct = {}
      inv.forEach(invoice => {
        ;(invoice.rpa_invoice_items || []).forEach(item => {
          if (!byProduct[item.product_name]) {
            byProduct[item.product_name] = { revenue: 0, cost: 0, qty: 0 }
          }
          byProduct[item.product_name].revenue += item.subtotal || 0
          byProduct[item.product_name].cost += Math.round((item.quantity_kg || 0) * (item.cost_per_kg || 0))
          byProduct[item.product_name].qty += item.quantity_kg || 0
        })
      })

      // Group by customer
      const byCustomer = {}
      inv.forEach(invoice => {
        const key = invoice.customer_name
        if (!byCustomer[key]) byCustomer[key] = { revenue: 0, profit: 0, invoiceCount: 0 }
        byCustomer[key].revenue += invoice.total_amount || 0
        byCustomer[key].profit += invoice.net_profit || 0
        byCustomer[key].invoiceCount++
      })

      return {
        invoices: inv,
        totalRevenue, totalCost, totalProfit, marginPct,
        byProduct, byCustomer,
        purchaseOrders: purchaseOrders ?? [],
      }
    },
  })
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

export const useRPADashboardStats = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['rpa-dashboard-stats', tenant?.id],
    queryFn: async () => {
      const [ordersRes, invoicesRes, paymentsRes] = await Promise.all([
        supabase
          .from('rpa_purchase_orders')
          .select('id, status, created_at')
          .eq('rpa_tenant_id', tenant.id)
          .eq('is_deleted', false),
        supabase
          .from('rpa_invoices')
          .select('id, total_amount, paid_amount, remaining_amount, payment_status, transaction_date, due_date, net_profit')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false),
        supabase
          .from('rpa_customer_payments')
          .select('amount, payment_date')
          .eq('tenant_id', tenant.id)
          .order('payment_date', { ascending: false }),
      ])

      if (ordersRes.error) throw ordersRes.error
      if (invoicesRes.error) throw invoicesRes.error

      const orders = ordersRes.data ?? []
      const invoices = invoicesRes.data ?? []
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      return {
        orders: {
          total: orders.length,
          open: orders.filter(o => o.status === 'open').length,
          confirmed: orders.filter(o => o.status === 'confirmed').length,
          thisMonth: orders.filter(o => new Date(o.created_at) > thirtyDaysAgo).length,
        },
        sales: {
          totalRevenue: invoices.reduce((s, i) => s + (i.total_amount || 0), 0),
          totalProfit: invoices.reduce((s, i) => s + (i.net_profit || 0), 0),
          revenueThisMonth: invoices
            .filter(i => new Date(i.transaction_date) > thirtyDaysAgo)
            .reduce((s, i) => s + (i.total_amount || 0), 0),
          invoicesThisMonth: invoices.filter(i => new Date(i.transaction_date) > thirtyDaysAgo).length,
          totalOutstanding: invoices
            .filter(i => i.payment_status !== 'lunas')
            .reduce((s, i) => s + (i.remaining_amount || 0), 0),
          overdueCount: invoices.filter(i =>
            i.payment_status !== 'lunas' && i.due_date && new Date(i.due_date) < now
          ).length,
        },
      }
    },
    enabled: !!tenant?.id,
  })
}
