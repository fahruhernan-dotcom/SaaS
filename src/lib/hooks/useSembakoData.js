import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { toast } from 'sonner'

// ── READ HOOKS ────────────────────────────────────────────────────────────────

export const useSembakoProducts = () => useQuery({
  queryKey: ['sembako-products'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('sembako_products')
      .select('*')
      .eq('is_deleted', false)
      .order('product_name')
    if (error) throw error
    return data
  }
})

export const useSembakoStockBatches = (productId) => useQuery({
  queryKey: ['sembako-batches', productId],
  enabled: !!productId,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('sembako_stock_batches')
      .select('*, sembako_suppliers(supplier_name)')
      .eq('product_id', productId)
      .eq('is_deleted', false)
      .gt('qty_sisa', 0)
      .order('created_at', { ascending: true }) // FIFO
    if (error) throw error
    return data
  }
})

export const useSembakoCustomers = () => useQuery({
  queryKey: ['sembako-customers'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('sembako_customers')
      .select('*')
      .eq('is_deleted', false)
      .order('customer_name')
    if (error) throw error
    return data
  }
})

export const useSembakoSuppliers = () => useQuery({
  queryKey: ['sembako-suppliers'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('sembako_suppliers')
      .select('*')
      .eq('is_deleted', false)
      .order('supplier_name')
    if (error) throw error
    return data
  }
})

export const useSembakoSales = () => useQuery({
  queryKey: ['sembako-sales'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('sembako_sales')
      .select('*, sembako_customers(customer_name, customer_type, phone), sembako_sale_items(*)')
      .eq('is_deleted', false)
      .order('transaction_date', { ascending: false })
    if (error) throw error
    return data
  }
})

export const useSembakoEmployees = () => useQuery({
  queryKey: ['sembako-employees'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('sembako_employees')
      .select('*')
      .eq('is_deleted', false)
      .order('full_name')
    if (error) throw error
    return data
  }
})

export const useSembakoDashboardStats = () => useQuery({
  queryKey: ['sembako-dashboard-stats'],
  queryFn: async () => {
    const [productsRes, salesRes, customersRes, expensesRes, payrollRes] =
      await Promise.all([
        supabase.from('sembako_products')
          .select('id, product_name, current_stock, avg_buy_price, sell_price, min_stock_alert')
          .eq('is_deleted', false).eq('is_active', true),
        supabase.from('sembako_sales')
          .select('id, total_amount, total_cogs, net_profit, payment_status, remaining_amount, transaction_date, due_date')
          .eq('is_deleted', false),
        supabase.from('sembako_customers')
          .select('id, total_outstanding')
          .eq('is_deleted', false),
        supabase.from('sembako_expenses')
          .select('amount, expense_date, category')
          .eq('is_deleted', false),
        supabase.from('sembako_payroll')
          .select('total_pay, period_date, payment_status'),
      ])

    const products  = productsRes.data  || []
    const sales     = salesRes.data     || []
    const customers = customersRes.data || []
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
        totalOutstanding: customers
          .reduce((s, c) => s + (c.total_outstanding || 0), 0),
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
  }
})

// useSembakoAllBatches — semua batch (termasuk habis), untuk riwayat masuk
// Opsional: filter by productId
export const useSembakoAllBatches = (productId) => useQuery({
  queryKey: ['sembako-all-batches', productId ?? 'all'],
  queryFn: async () => {
    let q = supabase
      .from('sembako_stock_batches')
      .select('*, sembako_suppliers(supplier_name), sembako_products(product_name, unit)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    if (productId) q = q.eq('product_id', productId)
    const { data, error } = await q
    if (error) throw error
    return data
  }
})

// useSembakoStockOut — riwayat pengurangan stok (FIFO)
export const useSembakoStockOut = (productId) => useQuery({
  queryKey: ['sembako-stock-out', productId ?? 'all'],
  queryFn: async () => {
    let q = supabase
      .from('sembako_stock_out')
      .select('*, sembako_products(product_name, unit), sembako_stock_batches(batch_code), sembako_sales(invoice_number, customer_name)')
      .order('created_at', { ascending: false })
    if (productId) q = q.eq('product_id', productId)
    const { data, error } = await q
    if (error) {
      // Tabel mungkin belum ada di fase awal
      console.warn('sembako_stock_out:', error.message)
      return []
    }
    return data
  }
})

// ── MUTATION HOOKS ────────────────────────────────────────────────────────────

async function getTenantId() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .single()
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

      // FIFO: kurangi qty_sisa di batches
      for (const item of items) {
        if (!item.product_id) continue
        let qtyToDeduct = item.quantity
        const { data: batches } = await supabase
          .from('sembako_stock_batches')
          .select('id, qty_sisa')
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
          qtyToDeduct -= deduct
        }
      }
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
      payment_date, payment_method, reference_no, notes }) => {
      const tenant_id = await getTenantId()

      const { error: payErr } = await supabase
        .from('sembako_payments').insert({
          tenant_id, sale_id, customer_id, amount,
          payment_date, payment_method, reference_no, notes,
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
      const { error } = await supabase.from('sembako_products')
        .update({ is_deleted: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
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

export const useSembakoDeliveries = () => useQuery({
  queryKey: ['sembako-deliveries'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('sembako_deliveries')
      .select('*, sembako_employees(full_name), sembako_sales(invoice_number, customer_name)')
      .order('delivery_date', { ascending: false })
    if (error) { console.warn('sembako_deliveries:', error.message); return [] }
    return data
  }
})

export const useSembakoPayrolls = () => useQuery({
  queryKey: ['sembako-payroll'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('sembako_payroll')
      .select('*, sembako_employees(full_name, role, salary_type)')
      .order('period_date', { ascending: false })
    if (error) { console.warn('sembako_payroll:', error.message); return [] }
    return data
  }
})

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
      toast.success('Pengiriman berhasil dicatat')
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

// ── LAPORAN (Phase 4) ────────────────────────────────────────────────────────

export const useSembakoLaporan = (startDate, endDate) => useQuery({
  queryKey: ['sembako-laporan', startDate, endDate],
  enabled: !!startDate && !!endDate,
  queryFn: async () => {
    const [salesRes, expensesRes, payrollRes, batchesRes] = await Promise.all([
      supabase.from('sembako_sales')
        .select('*, sembako_sale_items(*), sembako_customers(customer_name, customer_type)')
        .eq('is_deleted', false)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate),
      supabase.from('sembako_expenses')
        .select('*').eq('is_deleted', false)
        .gte('expense_date', startDate).lte('expense_date', endDate),
      supabase.from('sembako_payroll')
        .select('*, sembako_employees(full_name, role)')
        .gte('period_date', startDate).lte('period_date', endDate),
      supabase.from('sembako_stock_batches')
        .select('*, sembako_products(product_name, category)')
        .eq('is_deleted', false)
        .gte('purchase_date', startDate).lte('purchase_date', endDate),
    ])

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
  }
})
