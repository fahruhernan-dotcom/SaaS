import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { toast } from 'sonner'
import { useAuth } from './useAuth'

// ── READ HOOKS ────────────────────────────────────────────────────────────────

const STALE_5M = 5 * 60 * 1000

export const useSembakoProducts = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-products', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_products')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('product_name')
        if (error) throw error
        return data
      } catch (e) {
        console.error('[useSembakoProducts] Error:', e)
        return []
      }
    }
  })
}

export const useSembakoStockBatches = (productId) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-batches', tenant?.id, productId],
    enabled: !!productId && !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_stock_batches')
          .select('*, sembako_suppliers(supplier_name)')
          .eq('tenant_id', tenant.id)
          .eq('product_id', productId)
          .eq('is_deleted', false)
          .gt('qty_sisa', 0)
          .order('created_at', { ascending: true }) // FIFO
        if (error) throw error
        return data
      } catch (e) {
        console.error(`[useSembakoStockBatches] Error for product ${productId}:`, e)
        return []
      }
    }
  })
}

export const useSembakoCustomers = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-customers', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_customers')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('customer_name')
        if (error) throw error
        return data
      } catch (e) {
        console.error('[useSembakoCustomers] Error:', e)
        return []
      }
    }
  })
}

export const useSembakoSuppliers = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-suppliers', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_suppliers')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('supplier_name')
        if (error) throw error
        return data
      } catch (e) {
        console.error('[useSembakoSuppliers] Error:', e)
        return []
      }
    }
  })
}

export const useSembakoSales = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-sales', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_sales')
          .select('*, sembako_customers(customer_name, customer_type, phone), sembako_sale_items(*), sembako_deliveries(id, status)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('transaction_date', { ascending: false })
        if (error) throw error
        return data
      } catch (e) {
        console.error('[useSembakoSales] Error:', e)
        return []
      }
    }
  })
}

export const useSembakoEmployees = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-employees', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_employees')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('full_name')
        if (error) throw error
        return data
      } catch (e) {
        console.error('[useSembakoEmployees] Error:', e)
        return []
      }
    }
  })
}

export const useSembakoDashboardStats = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-dashboard-stats', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const [productsRes, salesRes, expensesRes, payrollRes] =
          await Promise.all([
            supabase.from('sembako_products')
              .select('id, product_name, current_stock, avg_buy_price, sell_price, min_stock_alert')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false).eq('is_active', true),
            supabase.from('sembako_sales')
              .select('id, total_amount, total_cogs, net_profit, payment_status, remaining_amount, transaction_date, due_date')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false),
            supabase.from('sembako_expenses')
              .select('amount, expense_date, category')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false),
            supabase.from('sembako_payroll')
              .select('total_pay, period_date, payment_status')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false),
          ])

        // Log errors if any, but continue if possible
        if (productsRes.error) console.error('Sembako Stats (Products):', productsRes.error)
        if (salesRes.error) console.error('Sembako Stats (Sales):', salesRes.error)
        if (expensesRes.error) console.error('Sembako Stats (Expenses):', expensesRes.error)
        if (payrollRes.error) console.error('Sembako Stats (Payroll):', payrollRes.error)

      const products  = productsRes.data  || []
      const sales     = salesRes.data     || []
      const expenses  = expensesRes.data  || []
      const payroll   = payrollRes.data   || []
      const now = new Date()
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

      return {
        stok: {
          totalProduk: products.length,
          lowStock: products.filter(p =>
            p.min_stock_alert > 0 && p.current_stock <= p.min_stock_alert
          ),
          nilaiStok: products.reduce((s, p) =>
            s + (p.current_stock * p.avg_buy_price), 0
          ),
        },
        penjualan: {
          totalRevenue: sales.reduce((s, i) => s + (i.total_amount || 0), 0),
          revenueThisMonth: sales
            .filter(s => new Date(s.transaction_date) > thirtyDaysAgo)
            .reduce((s, i) => s + (i.total_amount || 0), 0),
          netProfitThisMonth: sales
            .filter(s => new Date(s.transaction_date) > thirtyDaysAgo)
            .reduce((s, i) => s + (i.net_profit || 0), 0),
          totalOutstanding: sales
            .reduce((s, i) => s + (i.remaining_amount || 0), 0),
          overdueCount: sales.filter(s =>
            s.payment_status !== 'lunas' && s.due_date && new Date(s.due_date) < now
          ).length,
        },
        pengeluaran: {
          totalExpenseThisMonth: expenses
            .filter(e => new Date(e.expense_date) > thirtyDaysAgo)
            .reduce((s, e) => s + (e.amount || 0), 0),
          totalPayrollThisMonth: payroll
            .filter(p => new Date(p.period_date) > thirtyDaysAgo)
            .reduce((s, p) => s + (p.total_pay || 0), 0),
        },
      }
    } catch (err) {
      console.error('Critical Error in useSembakoDashboardStats:', err)
      return {
        stok: { totalProduk: 0, lowStock: [], nilaiStok: 0 },
        penjualan: { totalRevenue: 0, revenueThisMonth: 0, netProfitThisMonth: 0, totalOutstanding: 0, overdueCount: 0 },
        pengeluaran: { totalExpenseThisMonth: 0, totalPayrollThisMonth: 0 },
      }
    }
  }
  })
}

// useSembakoAllBatches — semua batch (termasuk habis), untuk riwayat masuk
// Opsional: filter by productId
export const useSembakoAllBatches = (productId) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-all-batches', tenant?.id, productId ?? 'all'],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        let q = supabase
          .from('sembako_stock_batches')
          .select('*, sembako_suppliers(supplier_name), sembako_products(product_name, unit)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
        if (productId) q = q.eq('product_id', productId)
        const { data, error } = await q
        if (error) throw error
        return data
      } catch (e) {
        console.error('[useSembakoAllBatches] Error:', e)
        return []
      }
    }
  })
}

// useSembakoStockOut — riwayat pengurangan stok (FIFO)
export const useSembakoStockOut = (productId) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-stock-out', tenant?.id, productId ?? 'all'],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        let q = supabase
          .from('sembako_stock_out')
          .select('*, sembako_products(product_name, unit), sembako_stock_batches(batch_code), sembako_sales(invoice_number, customer_name)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
        if (productId) q = q.eq('product_id', productId)
        const { data, error } = await q
        if (error) throw error
        return data
      } catch (e) {
        console.error('[useSembakoStockOut] Error:', e)
        return []
      }
    }
  })
}

// ── MUTATION HOOKS ────────────────────────────────────────────────────────────

async function getTenantId() {
  // Selalu prioritaskan tenant yang sedang aktif di UI
  const activeTenantId = localStorage.getItem('ternakos_active_tenant_id')
  if (activeTenantId) return activeTenantId

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('User not authenticated')

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .limit(1)

  if (error) throw error
  if (!profiles || profiles.length === 0) throw new Error('Profil tidak ditemukan. Pastikan Anda sudah terdaftar dengan benar.')
  const profile = profiles[0]
  if (!profile.tenant_id) throw new Error('Tenant ID tidak ditemukan pada profil Anda.')

  return profile.tenant_id
}

export const useCreateSembakoProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const { error } = await supabase.from('sembako_products')
        .insert({ ...payload, tenant_id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Produk berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useAddStockBatch = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ product_id, supplier_id, qty_masuk,
      buy_price, purchase_date, expiry_date, notes }) => {
      const tenant_id = await getTenantId()
      // total_cost adalah GENERATED — jangan insert
      const { error } = await supabase.from('sembako_stock_batches')
        .insert({
          tenant_id, product_id, supplier_id,
          qty_masuk,
          qty_sisa: qty_masuk, // awal = qty penuh
          buy_price, purchase_date, expiry_date, notes,
        })
      if (error) throw error
      // DB trigger auto-update current_stock + avg_buy_price di product
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-batches', vars.product_id] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Stok berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useCreateSembakoSale = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ customer_id, customer_name, transaction_date,
      due_date, items, delivery_cost, other_cost, notes }) => {
      const tenant_id = await getTenantId()

      // Generate invoice number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 4)
      const invoice_number = `SMB-${dateStr}-${rand}`

      // Hitung totals dari items
      const total_amount = items.reduce((s, i) =>
        s + Math.round(i.quantity * i.price_per_unit), 0)
      const total_cogs = items.reduce((s, i) =>
        s + Math.round(i.quantity * (i.cogs_per_unit || 0)), 0)

      // Insert sale header — gross_profit, net_profit, remaining_amount adalah GENERATED
      const { data: sale, error: saleErr } = await supabase
        .from('sembako_sales').insert({
          tenant_id, customer_id, customer_name, invoice_number,
          transaction_date, due_date,
          total_amount, total_cogs,
          delivery_cost: delivery_cost || 0,
          other_cost: other_cost || 0,
          payment_status: 'belum_lunas',
          paid_amount: 0,
          notes,
        }).select().single()
      if (saleErr) throw saleErr

      // Insert items — subtotal, cogs_total adalah GENERATED
      const itemsToInsert = items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        unit: item.unit,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        cogs_per_unit: item.cogs_per_unit || 0,
      }))
      const { error: itemErr } = await supabase
        .from('sembako_sale_items').insert(itemsToInsert)
      if (itemErr) throw itemErr

      // FIFO: kurangi qty_sisa di batches + catat di sembako_stock_out untuk reversal
      for (const item of items) {
        if (!item.product_id) continue
        let qtyToDeduct = item.quantity
        const { data: batches } = await supabase
          .from('sembako_stock_batches')
          .select('id, qty_sisa, buy_price')
          .eq('product_id', item.product_id)
          .eq('is_deleted', false)
          .gt('qty_sisa', 0)
          .order('created_at', { ascending: true }) // FIFO

        for (const batch of (batches || [])) {
          if (qtyToDeduct <= 0) break
          const deduct = Math.min(batch.qty_sisa, qtyToDeduct)
          await supabase.from('sembako_stock_batches')
            .update({ qty_sisa: batch.qty_sisa - deduct })
            .eq('id', batch.id)
          // Catat stock_out agar delete sale bisa restore stok (FIFO reversal)
          await supabase.from('sembako_stock_out').insert({
            tenant_id,
            product_id: item.product_id,
            batch_id: batch.id,
            sale_id: sale.id,
            qty_keluar: deduct,
            buy_price: batch.buy_price || 0,
            reason: 'sale',
          })
          qtyToDeduct -= deduct
        }
      }
      return sale
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Invoice berhasil dibuat')
    },
    onError: () => toast.error('Gagal membuat invoice'),
  })
}

export const useRecordSembakoPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sale_id, customer_id, amount,
      payment_date, payment_method, reference_number, notes }) => {
      const tenant_id = await getTenantId()

      const { error: payErr } = await supabase
        .from('sembako_payments').insert({
          tenant_id, sale_id, customer_id, amount,
          payment_date, payment_method, reference_number, notes,
        })
      if (payErr) throw payErr

      // Update sale paid_amount + status
      const { data: sale } = await supabase
        .from('sembako_sales')
        .select('total_amount, paid_amount')
        .eq('id', sale_id).single()
      const newPaid   = (sale.paid_amount || 0) + amount
      const newStatus = newPaid >= sale.total_amount ? 'lunas'
        : newPaid > 0 ? 'sebagian' : 'belum_lunas'
      await supabase.from('sembako_sales')
        .update({ paid_amount: newPaid, payment_status: newStatus })
        .eq('id', sale_id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Pembayaran berhasil dicatat')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useCreateSembakoEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const { error } = await supabase.from('sembako_employees')
        .insert({ ...payload, tenant_id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-employees'] })
      toast.success('Pegawai berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useRecordPayroll = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ employee_id, period_type, period_date,
      work_days, trip_count, sales_amount, base_amount,
      commission_amount, bonus, deduction, notes }) => {
      const tenant_id = await getTenantId()
      // total_pay adalah GENERATED — jangan insert
      const { error } = await supabase.from('sembako_payroll').insert({
        tenant_id, employee_id, period_type, period_date,
        work_days, trip_count, sales_amount,
        base_amount, commission_amount, bonus, deduction, notes,
        payment_status: 'pending',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-payroll'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Gaji berhasil dicatat')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useUpdateSembakoProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('sembako_products')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Produk berhasil diperbarui')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useSoftDeleteSembakoProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error: errProduct } = await supabase.from('sembako_products')
        .update({ is_deleted: true })
        .eq('id', id)
      if (errProduct) throw errProduct
      // Hapus juga semua batch stok yang terkait
      const { error: errBatch } = await supabase.from('sembako_stock_batches')
        .update({ is_deleted: true })
        .eq('product_id', id)
      if (errBatch) throw errBatch
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Produk dihapus')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useCreateSembakoSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ supplier_name, phone, address, notes }) => {
      const tenant_id = await getTenantId()
      const { data, error } = await supabase.from('sembako_suppliers')
        .insert({ tenant_id, supplier_name, phone, address, notes })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      toast.success('Supplier berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

// ── NEW HOOKS (Phase 3) ──────────────────────────────────────────────────────

export const useSembakoDeliveries = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-deliveries', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_deliveries')
          .select(`
            *,
            sembako_employees(id, full_name, role, phone),
            sembako_sales(
              id, invoice_number, total_amount, payment_status, transaction_date, customer_name,
              sembako_customers(id, customer_name, phone, address),
              sembako_sale_items(id, product_name, quantity, unit)
            )
          `)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
        if (error) throw error
        return data
      } catch (e) {
        console.error('[useSembakoDeliveries] Error:', e)
        return []
      }
    }
  })
}

export const useSembakoSalesPendingDelivery = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-sales-pending-delivery', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_sales')
          .select(`
            id, invoice_number, transaction_date, total_amount, payment_status, customer_name,
            sembako_customers(id, customer_name, address, phone),
            sembako_sale_items(id, product_name, quantity, unit),
            sembako_deliveries(id, status, is_deleted)
          `)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('transaction_date', { ascending: false })
        if (error) throw error
        return (data || []).filter(sale => {
          const activeDeliveries = (sale.sembako_deliveries || []).filter(d => !d.is_deleted)
          return activeDeliveries.length === 0
        })
      } catch (e) {
        console.error('[useSembakoSalesPendingDelivery] Error:', e)
        return []
      }
    }
  })
}

export const useSembakoPayrolls = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-payroll', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_payroll')
          .select('*, sembako_employees(full_name, role, salary_type)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('period_date', { ascending: false })
        if (error) throw error
        return data
      } catch (e) {
        console.error('[useSembakoPayrolls] Error:', e)
        return []
      }
    }
  })
}

export const useCreateSembakoCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const { data, error } = await supabase.from('sembako_customers')
        .insert({ ...payload, tenant_id })
        .select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      toast.success('Toko berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useUpdateSembakoCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('sembako_customers')
        .update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      toast.success('Toko berhasil diperbarui')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useDeleteSembakoCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('sembako_customers')
        .update({ is_deleted: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Toko berhasil dihapus')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useUpdateSembakoSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('sembako_suppliers')
        .update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      toast.success('Supplier berhasil diperbarui')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useDeleteSembakoSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('sembako_suppliers')
        .update({ is_deleted: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      toast.success('Supplier berhasil dihapus')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useUpdateSembakoEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('sembako_employees')
        .update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-employees'] })
      toast.success('Data pegawai diperbarui')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useCreateSembakoDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const { error } = await supabase.from('sembako_deliveries')
        .insert({ ...payload, tenant_id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales-pending-delivery'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      toast.success('Trip berhasil dicatat')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useCompleteSembakoDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (deliveryId) => {
      const { error } = await supabase
        .from('sembako_deliveries')
        .update({ status: 'delivered' })
        .eq('id', deliveryId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales-pending-delivery'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      toast.success('Pengiriman ditandai selesai')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useStartSembakoDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (deliveryId) => {
      const { error } = await supabase
        .from('sembako_deliveries')
        .update({ status: 'on_route' })
        .eq('id', deliveryId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales-pending-delivery'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      toast.success('Pengiriman mulai berjalan')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useMarkPayrollPaid = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('sembako_payroll')
        .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-payroll'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Gaji ditandai lunas')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

// ── DETAIL HOOKS ─────────────────────────────────────────────────────────────

export const useSembakoCustomerInvoices = (customerId) => useQuery({
  queryKey: ['sembako-customer-invoices', customerId],
  enabled: !!customerId,
  staleTime: STALE_5M,
  queryFn: async () => {
    try {
      const { data, error } = await supabase
        .from('sembako_sales')
        .select('*, sembako_sale_items(*)')
        .eq('customer_id', customerId)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
      if (error) throw error
      return data
    } catch (e) {
      console.error(`[useSembakoCustomerInvoices] Error for customer ${customerId}:`, e)
      return []
    }
  }
})

export const useSembakoCustomerPayments = (customerId) => useQuery({
  queryKey: ['sembako-customer-payments', customerId],
  enabled: !!customerId,
  staleTime: STALE_5M,
  queryFn: async () => {
    try {
      const { data, error } = await supabase
        .from('sembako_payments')
        .select('*, sembako_sales!inner(invoice_number, is_deleted)')
        .eq('customer_id', customerId)
        .eq('sembako_sales.is_deleted', false)
        .order('payment_date', { ascending: false })
      if (error) throw error
      return data
    } catch (e) {
      console.error(`[useSembakoCustomerPayments] Error for customer ${customerId}:`, e)
      return []
    }
  }
})

export const useSembakoSupplierInvoices = (supplierId) => useQuery({
  queryKey: ['sembako-supplier-invoices', supplierId],
  enabled: !!supplierId,
  staleTime: STALE_5M,
  queryFn: async () => {
    try {
      const { data, error } = await supabase
        .from('sembako_stock_batches')
        .select('*, sembako_products(product_name, unit)')
        .eq('supplier_id', supplierId)
        .eq('is_deleted', false)
        .order('purchase_date', { ascending: false })
      if (error) throw error
      return data
    } catch (e) {
      console.error(`[useSembakoSupplierInvoices] Error for supplier ${supplierId}:`, e)
      return []
    }
  }
})

// ── LAPORAN (Phase 4) ────────────────────────────────────────────────────────

export const useSembakoLaporan = (startDate, endDate) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-laporan', tenant?.id, startDate, endDate],
    enabled: !!startDate && !!endDate && !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
    try {
      const [salesRes, expensesRes, payrollRes, batchesRes] = await Promise.all([
        supabase.from('sembako_sales')
          .select('*, sembako_sale_items(*), sembako_customers(customer_name, customer_type)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate),
        supabase.from('sembako_expenses')
          .select('*').eq('tenant_id', tenant.id).eq('is_deleted', false)
          .gte('expense_date', startDate).lte('expense_date', endDate),
        supabase.from('sembako_payroll')
          .select('*, sembako_employees(full_name, role)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .gte('period_date', startDate).lte('period_date', endDate),
        supabase.from('sembako_stock_batches')
          .select('*, sembako_products(product_name, category)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .gte('purchase_date', startDate).lte('purchase_date', endDate),
      ])

      if (salesRes.error) console.error('Sembako Report (Sales):', salesRes.error)
      if (expensesRes.error) console.error('Sembako Report (Expenses):', expensesRes.error)
      if (payrollRes.error) console.error('Sembako Report (Payroll):', payrollRes.error)
      if (batchesRes.error) console.error('Sembako Report (Batches):', batchesRes.error)

      const sales    = salesRes.data    || []
      const expenses = expensesRes.data || []
      const payroll  = payrollRes.data  || []
      const batches  = batchesRes.data  || []

      const totalRevenue      = sales.reduce((s, i) => s + (i.total_amount || 0), 0)
      const totalCOGS         = sales.reduce((s, i) => s + (i.total_cogs || 0), 0)
      const totalDeliveryCost = sales.reduce((s, i) => s + (i.delivery_cost || 0), 0)
      const totalOtherCost    = sales.reduce((s, i) => s + (i.other_cost || 0), 0)
      const totalExpenses     = expenses.reduce((s, e) => s + (e.amount || 0), 0)
      const totalPayroll      = payroll.reduce((s, p) => s + (p.total_pay || 0), 0)
      const grossProfit       = totalRevenue - totalCOGS
      const netProfit         = grossProfit - totalDeliveryCost - totalOtherCost - totalExpenses - totalPayroll
      const grossMarginPct    = totalRevenue > 0 ? (grossProfit / totalRevenue * 100).toFixed(1) : 0
      const netMarginPct      = totalRevenue > 0 ? (netProfit / totalRevenue * 100).toFixed(1) : 0

      // Group by product
      const byProduct = {}
      sales.forEach(sale => {
        ;(sale.sembako_sale_items || []).forEach(item => {
          const key = item.product_name || 'Lainnya'
          if (!byProduct[key]) byProduct[key] = { revenue: 0, cogs: 0, qty: 0, unit: item.unit }
          byProduct[key].revenue += item.subtotal || 0
          byProduct[key].cogs   += item.cogs_total || 0
          byProduct[key].qty    += item.quantity || 0
        })
      })

      // Group by customer
      const byCustomer = {}
      sales.forEach(sale => {
        const key = sale.customer_name || 'Umum'
        if (!byCustomer[key]) byCustomer[key] = { revenue: 0, profit: 0, count: 0, type: sale.sembako_customers?.customer_type }
        byCustomer[key].revenue += sale.total_amount || 0
        byCustomer[key].profit  += sale.net_profit || 0
        byCustomer[key].count++
      })

      // Expense breakdown
      const expenseByCategory = {}
      expenses.forEach(e => {
        const cat = e.category || 'lainnya'
        if (!expenseByCategory[cat]) expenseByCategory[cat] = 0
        expenseByCategory[cat] += e.amount || 0
      })

      return {
        summary: {
          totalRevenue, totalCOGS, grossProfit, grossMarginPct,
          totalDeliveryCost, totalOtherCost, totalExpenses, totalPayroll,
          netProfit, netMarginPct,
          totalStockPurchase: batches.reduce((s, b) => s + (b.total_cost || 0), 0),
        },
        byProduct, byCustomer, expenseByCategory,
        sales, expenses, payroll,
      }
    } catch (err) {
      console.error('Critical Error in useSembakoLaporan:', err)
      return {
        summary: { totalRevenue: 0, totalCOGS: 0, grossProfit: 0, grossMarginPct: 0, totalDeliveryCost: 0, totalOtherCost: 0, totalExpenses: 0, totalPayroll: 0, netProfit: 0, netMarginPct: 0, totalStockPurchase: 0 },
        byProduct: {}, byCustomer: {}, expenseByCategory: {},
        sales: [], expenses: [], payroll: []
      }
    }
  }
})}
export const useDeleteSembakoSale = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      // 1. Ambil semua data stok keluar terkait sale ini untuk reversal
      const { data: stockOuts } = await supabase
        .from('sembako_stock_out')
        .select('batch_id, qty_keluar')
        .eq('sale_id', id)

      // 2. Kembalikan qty ke batch asli (FIFO Reversal)
      if (stockOuts && stockOuts.length > 0) {
        for (const record of stockOuts) {
          // Ambil sisa qty saat ini di batch
          const { data: batch } = await supabase
            .from('sembako_stock_batches')
            .select('qty_sisa')
            .eq('id', record.batch_id)
            .single()

          if (batch) {
            await supabase
              .from('sembako_stock_batches')
              .update({ qty_sisa: (batch.qty_sisa || 0) + record.qty_keluar })
              .eq('id', record.batch_id)
          }
        }
        await supabase.from('sembako_stock_out').delete().eq('sale_id', id)
      }

      // 3. Soft delete: set is_deleted = true di header
      const { error } = await supabase.from('sembako_sales')
        .update({ is_deleted: true })
        .eq('id', id)
      if (error) throw error

      // 4. Hard delete related payments (sembako_payments has NO is_deleted column)
      await supabase.from('sembako_payments')
        .delete()
        .eq('sale_id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-payments'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      toast.success('Transaksi dihapus & Stok dikembalikan')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}
export const useUpdateSembakoSale = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase.from('sembako_sales')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Transaksi diperbarui')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useSembakoSupplierPayments = (supplierId) => useQuery({
  queryKey: ['sembako-supplier-payments', supplierId],
  enabled: !!supplierId,
  staleTime: STALE_5M,
  queryFn: async () => {
    try {
      const { data, error } = await supabase
        .from('sembako_supplier_payments')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('is_deleted', false)
        .order('payment_date', { ascending: false })
      if (error) throw error
      return data
    } catch (e) {
      console.error(`[useSembakoSupplierPayments] Error for supplier ${supplierId}:`, e)
      return []
    }
  }
})

export const useRecordSembakoSupplierPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const { error } = await supabase
        .from('sembako_supplier_payments')
        .insert({ ...payload, tenant_id })
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-payments', vars.supplier_id] })
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Pembayaran ke supplier dicatat')
    },
    onError: (err) => toast.error('Gagal: ' + err.message),
  })
}

export const useCreateSembakoReturn = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sale_id, items }) => {
      // Reaksi: reverse stock (tambah kembalike sisa qty batch)
      for (const item of items) {
        if (!item.batch_id) continue
        const { data: batch } = await supabase
          .from('sembako_stock_batches')
          .select('qty_sisa')
          .eq('id', item.batch_id)
          .single()
        
        if (batch) {
          await supabase.from('sembako_stock_batches')
            .update({ qty_sisa: (batch.qty_sisa || 0) + item.quantity })
            .eq('id', item.batch_id)
        }
      }

      // Soft delete: beri catatan retur di sales header
      const { error } = await supabase
        .from('sembako_sales')
        .update({ 
          is_deleted: true, 
          notes: `[RETUR ${new Date().toLocaleDateString('id-ID')}] Barang dikembalikan & stok dipulihkan.` 
        })
        .eq('id', sale_id)
        
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      toast.success('Nota Berhasil di-Retur')
    },
    onError: (err) => toast.error('Gagal proses retur: ' + err.message),
  })
}

export const useAdjustBatchStock = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ batch_id, qty_change, reason, notes }) => {
      const tenant_id = await getTenantId()
      
      const { data: batch } = await supabase
        .from('sembako_stock_batches')
        .select('qty_sisa, product_id')
        .eq('id', batch_id)
        .single()
      
      if (!batch) throw new Error('Batch tidak ditemukan')
      
      const newQty = (batch.qty_sisa || 0) + qty_change
      if (newQty < 0) throw new Error('Penyesuaian menyebabkan stok negatif')

      const { error: updErr } = await supabase
        .from('sembako_stock_batches')
        .update({ qty_sisa: newQty })
        .eq('id', batch_id)
      if (updErr) throw updErr

      // Jika pengurangan stok, catat di sembako_stock_out
      if (qty_change < 0) {
        const { error: outErr } = await supabase
          .from('sembako_stock_out')
          .insert({
            tenant_id,
            product_id: batch.product_id,
            batch_id: batch_id,
            qty_keluar: Math.abs(qty_change),
            reason: reason || 'adjustment',
            notes: notes || 'Penyesuaian Stok'
          })
        if (outErr) throw outErr
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-stock-out'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Penyesuaian stok berhasil disimpan')
    },
    onError: (err) => toast.error('Gagal adjust stok: ' + err.message),
  })
}
