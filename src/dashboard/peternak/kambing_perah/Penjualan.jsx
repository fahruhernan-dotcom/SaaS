import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, ShoppingBag, Users, 
  TrendingUp, Calendar, CreditCard, Droplets 
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  useKambingPerahMilkSales,
  useKambingPerahCustomers,
  useLogKambingPerahSale
} from '@/lib/hooks/useKambingPerahData'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'

export default function KambingPerahPenjualan() {
  const { tenant } = useAuth()
  
  // Queries
  const { data: sales = [], isLoading: loadingSales } = useKambingPerahMilkSales()
  const { data: customers = [], isLoading: loadingCustomers } = useKambingPerahCustomers()
  const logSale = useLogKambingPerahSale()

  // State
  const [search, setSearch] = useState('')
  const [addSheet, setAddSheet] = useState(false)
  const [form, setForm] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    customer_id: '',
    buyer_name_legacy: '',
    volume_liter: '',
    price_per_liter: '',
    payment_method: 'tunai',
    is_paid: true
  })

  // Calculations
  const totalRevenue = useMemo(() => sales.reduce((sum, s) => sum + parseFloat(s.total_revenue_idr), 0), [sales])
  const totalLiters = useMemo(() => sales.reduce((sum, s) => sum + parseFloat(s.volume_liter), 0), [sales])

  const handleAdd = () => {
    if (!form.volume_liter || !form.price_per_liter) return
    
    logSale.mutate({
      ...form,
      tenant_id: tenant.id,
      volume_liter: parseFloat(form.volume_liter),
      price_per_liter: parseFloat(form.price_per_liter),
      total_revenue_idr: parseFloat(form.volume_liter) * parseFloat(form.price_per_liter)
    }, {
      onSuccess: () => {
        setAddSheet(false)
        setForm({
          sale_date: new Date().toISOString().split('T')[0],
          customer_id: '',
          buyer_name_legacy: '',
          volume_liter: '',
          price_per_liter: '',
          payment_method: 'tunai',
          is_paid: true
        })
      }
    })
  }

  if (loadingSales) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24 min-h-screen bg-[#06090F]">
      
      {/* Header */}
      <header className="px-6 pt-10 pb-20 bg-[#0C1319] border-b border-white/[0.04] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black font-['Sora'] text-white">Penjualan Susu</h1>
            <p className="text-xs text-[#4B6478]">Monitoring arus kas & pelanggan</p>
          </div>
          <button className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-[#4B6478]">
            <Users size={20} />
          </button>
        </div>

        {/* Floating Stats */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="p-5 bg-white/[0.04] border border-white/[0.08] rounded-3xl backdrop-blur-xl">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-3">
              <TrendingUp size={16} />
            </div>
            <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1">Total Omset</p>
            <p className="text-lg font-black font-['Sora'] text-white">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-5 bg-white/[0.04] border border-white/[0.08] rounded-3xl backdrop-blur-xl">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
              <Droplets size={16} />
            </div>
            <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mb-1">Terjual</p>
            <p className="text-lg font-black font-['Sora'] text-white">
              {totalLiters.toFixed(1)} <span className="text-[10px] text-[#4B6478]">Liter</span>
            </p>
          </div>
        </div>
      </header>

      {/* Action Area */}
      <div className="px-4 -mt-8 relative z-20">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setAddSheet(true)}
          className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-3xl text-white font-black font-['Sora'] shadow-2xl shadow-green-900/40 flex items-center justify-center gap-3 transition-all"
        >
          < ShoppingBag size={20} />
          BUAT TRANSAKSI BARU
        </motion.button>
      </div>

      {/* Sale History */}
      <section className="px-4 mt-10">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar size={14} className="text-slate-500" />
            Riwayat Penjualan
          </h2>
          <button className="text-[10px] font-black text-green-500 uppercase">Lihat Semua</button>
        </div>

        <div className="space-y-4">
          {sales.length === 0 ? (
            <div className="py-20 text-center">
              <ShoppingBag size={40} className="mx-auto text-[#4B6478] mb-4 opacity-10" />
              <p className="text-sm font-bold text-[#4B6478]">Belum ada transaksi</p>
            </div>
          ) : (
            sales.map(sale => (
              <div key={sale.id} className="bg-[#0F171F]/50 border border-white/[0.04] rounded-3xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-xl">
                    {sale.payment_method === 'tunai' ? '💵' : '📱'}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white font-['Sora']">
                      {sale.customer?.name ?? sale.buyer_name_legacy ?? 'Pelanggan Umum'}
                    </p>
                    <p className="text-[10px] text-[#4B6478] font-bold uppercase">
                      {sale.sale_date} · {sale.is_paid ? 'Lunas' : 'Piutang'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white font-['Sora']">
                    Rp {parseFloat(sale.total_revenue_idr).toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] font-bold text-green-500">
                    {sale.volume_liter} L @ {sale.price_per_liter}/L
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Add Sheet */}
      <Sheet open={addSheet} onOpenChange={setAddSheet}>
        <SheetContent side="bottom" className="bg-[#0C1319] border-t border-white/10 rounded-t-[2.5rem] px-6 pt-8 pb-10">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-2xl font-black font-['Sora'] text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                <ShoppingBag size={20} />
              </div>
              Transaksi Baru
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block tracking-widest px-1">Pelanggan</label>
                <input 
                  value={form.buyer_name_legacy}
                  onChange={e => setForm(p => ({ ...p, buyer_name_legacy: e.target.value }))}
                  placeholder="Nama Pembeli..."
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-green-500/40"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block tracking-widest px-1">Cara Bayar</label>
                <select 
                  value={form.payment_method}
                  onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-3.5 px-4 text-sm text-white focus:outline-none"
                >
                  <option value="tunai">Cash / Tunai</option>
                  <option value="transfer">Transfer Bank</option>
                  <option value="e-wallet">E-Wallet (QRIS)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block tracking-widest px-1">Volume (Liter)</label>
                <div className="relative">
                  <Droplets size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" />
                  <input 
                    type="number" step="0.5"
                    value={form.volume_liter}
                    onChange={e => setForm(p => ({ ...p, volume_liter: e.target.value }))}
                    placeholder="0.0"
                    className="w-full pl-10 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-2xl text-lg font-black text-white focus:outline-none focus:border-green-500/40"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block tracking-widest px-1">Harga / Liter</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478] text-xs font-bold">Rp</span>
                  <input 
                    type="number"
                    value={form.price_per_liter}
                    onChange={e => setForm(p => ({ ...p, price_per_liter: e.target.value }))}
                    placeholder="15.000"
                    className="w-full pl-10 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-2xl text-lg font-black text-white focus:outline-none focus:border-green-500/40"
                  />
                </div>
              </div>
            </div>

            {/* Total Preview */}
            {form.volume_liter && form.price_per_liter && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-between">
                <p className="text-xs font-bold text-green-400 uppercase">ESTIMASI TOTAL</p>
                <p className="text-xl font-black text-white font-['Sora']">
                  Rp {(parseFloat(form.volume_liter) * parseFloat(form.price_per_liter)).toLocaleString('id-ID')}
                </p>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={!form.volume_liter || !form.price_per_liter || logSale.isPending}
              onClick={handleAdd}
              className="w-full py-5 bg-green-600 rounded-2xl text-white font-black font-['Sora'] shadow-xl shadow-green-900/20 mt-4"
            >
              {logSale.isPending ? 'Memproses...' : 'SIMPAN PENJUALAN'}
            </motion.button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}
