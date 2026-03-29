import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Minus, ShoppingCart, User, Search, 
  Trash2, ChevronRight, CheckCircle2, Loader2,
  Banknote, CreditCard, Clock
} from 'lucide-react'
import { useEggInventory } from '@/lib/hooks/useEggInventory'
import { useEggCustomers } from '@/lib/hooks/useEggCustomers'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatIDR } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

export default function POS() {
  const { tenant } = useAuth()
  const { data: inventory, isLoading: loadingInv } = useEggInventory()
  const { data: customers, isLoading: loadingCust } = useEggCustomers()
  const [cart, setCart] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('lunas')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastInvoice, setLastInvoice] = useState('')

  const queryClient = useQueryClient()

  // Cart Logic
  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
  }

  const updateQty = (id, delta) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = Math.max(0, c.quantity + delta)
        return { ...c, quantity: newQty }
      }
      return c
    }).filter(c => c.quantity > 0))
  }

  const subtotal = cart.reduce((acc, c) => acc + (c.sell_price_per_pack * c.quantity), 0)

  const handleSubmit = async () => {
    if (cart.length === 0 || !selectedCustomerId) {
      toast.error('Pilih pembeli dan item terlebih dahulu')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Create Sale Record
      const { data: sale, error: saleError } = await supabase
        .from('egg_sales')
        .insert([{
          tenant_id: tenant.id,
          customer_id: selectedCustomerId,
          total_amount: subtotal,
          payment_status: paymentStatus,
          notes: ''
        }])
        .select()
        .single()

      if (saleError) throw saleError

      // 2. Create Sale Items
      const saleItems = cart.map(item => ({
        tenant_id: tenant.id,
        sale_id: sale.id,
        inventory_id: item.id,
        qty_pack: item.quantity,
        price_per_pack: item.sell_price_per_pack,
        cost_per_pack: item.cost_per_pack,
        subtotal: item.quantity * item.sell_price_per_pack
      }))

      const { error: itemsError } = await supabase
        .from('egg_sale_items')
        .insert(saleItems)

      if (itemsError) throw itemsError

      // Triggers in DB will handle stock deduction & customer stats
      setLastInvoice(sale.invoice_number)
      setShowSuccess(true)
      setCart([])
      queryClient.invalidateQueries({ queryKey: ['egg-inventory'] })
      queryClient.invalidateQueries({ queryKey: ['egg-customers'] })
    } catch (err) {
      toast.error('Transaksi gagal: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  if (showSuccess) {
    return <SuccessView invoice={lastInvoice} onReset={() => setShowSuccess(false)} />
  }

  return (
    <div className={cn("flex flex-col lg:flex-row bg-[#06090F] min-h-screen", isDesktop ? "h-screen" : "pb-24")}>
      {/* Left: Product Selection */}
      <div className={cn("flex-1 overflow-y-auto space-y-6", isDesktop ? "p-8" : "p-5 pt-10")}>
        <header className="flex justify-between items-center text-left">
          <div>
            <h2 className={cn("font-black text-white uppercase tracking-tight", isDesktop ? "text-2xl" : "text-xl")}>Catat Penjualan</h2>
            <p className={cn("font-bold text-[#4B6478] uppercase mt-0.5 tracking-wider", isDesktop ? "text-[11px]" : "text-[10px]")}>Pilih grade telur dari stok</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadingInv ? [1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-[24px] bg-white/5" />) :
           inventory?.map(item => (
            <Card 
              key={item.id}
              onClick={() => addToCart(item)}
              className={cn(
                "bg-[#111C24] border-white/5 rounded-[24px] cursor-pointer hover:border-emerald-500/30 transition-all active:scale-[0.98] group relative overflow-hidden",
                isDesktop ? "p-5" : "p-4"
              )}
            >
              <div className="flex justify-between items-start relative z-10 text-left">
                <div>
                  <h3 className={cn("font-display font-black text-white group-hover:text-emerald-400 transition-colors", isDesktop ? "text-lg" : "text-[15px]")}>{item.product_name}</h3>
                  <p className={cn("font-black text-emerald-400 mt-1", isDesktop ? "text-xl" : "text-lg")}>{formatIDR(item.sell_price_per_pack)}</p>
                  <p className={cn("font-bold text-[#4B6478] uppercase mt-1 tracking-widest", isDesktop ? "text-[10px]" : "text-[11px]")}>Tersedia: {item.current_stock_butir} butir</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl">
                  <Plus size={isDesktop ? 20 : 22} className="text-[#34D399]" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right: Checkout Sidebar */}
      <div className={cn("bg-[#0C1319] border-white/5 flex flex-col", isDesktop ? "w-[400px] border-l h-screen" : "w-full border-t")}>
        <div className={cn("flex-1 overflow-y-auto space-y-8", isDesktop ? "p-6" : "p-5")}>
          <div className="space-y-4 text-left">
            <h3 className={cn("font-black text-[#4B6478] uppercase tracking-[0.2em]", isDesktop ? "text-[10px]" : "text-[11px]")}>Data Pembeli</h3>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="bg-[#111C24] border-white/10 h-14 rounded-2xl text-white font-bold text-base">
                <SelectValue placeholder="Pilih Pembeli" />
              </SelectTrigger>
              <SelectContent className="bg-[#111C24] border-white/10 text-white">
                {customers?.map(c => (
                  <SelectItem key={c.id} value={c.id} className="font-bold uppercase text-sm">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 text-left">
            <h3 className={cn("font-black text-[#4B6478] uppercase tracking-[0.2em]", isDesktop ? "text-[10px]" : "text-[11px]")}>Item Pesanan ({cart.length})</h3>
            <div className="space-y-3">
              <AnimatePresence>
                {cart.length === 0 ? (
                  <p className="text-xs font-bold text-[#4B6478] italic py-4">Belum ada item terpilih</p>
                ) : cart.map(item => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex justify-between items-center bg-[#111C24] p-4 rounded-2xl border border-white/5"
                  >
                    <div className="text-left">
                      <p className={cn("font-black text-white uppercase", isDesktop ? "text-sm" : "text-[13px]")}>{item.product_name}</p>
                      <p className={cn("font-bold text-emerald-400 mt-0.5", isDesktop ? "text-[11px]" : "text-[10px]")}>{formatIDR(item.sell_price_per_pack)} / pack</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 text-white"><Minus size={14}/></button>
                      <span className="font-display font-black text-white w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 text-white"><Plus size={14}/></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <h3 className={cn("font-black text-[#4B6478] uppercase tracking-[0.2em]", isDesktop ? "text-[10px]" : "text-[11px]")}>Metode Pembayaran</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setPaymentStatus('lunas')}
                className={`h-22 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98] ${paymentStatus === 'lunas' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-[#111C24] border-white/5 text-[#4B6478] hover:border-white/20'}`}
              >
                <Banknote size={isDesktop ? 20 : 24} />
                <span className={cn("font-black uppercase text-center px-2", isDesktop ? "text-[10px]" : "text-[9px]")}>Lunas (Cash)</span>
              </button>
              <button 
                onClick={() => setPaymentStatus('piutang')}
                className={`h-22 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98] ${paymentStatus === 'piutang' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-[#111C24] border-white/5 text-[#4B6478] hover:border-white/20'}`}
              >
                <Clock size={isDesktop ? 20 : 24} />
                <span className={cn("font-black uppercase text-center px-2", isDesktop ? "text-[10px]" : "text-[9px]")}>Piutang / TOP</span>
              </button>
            </div>
          </div>
        </div>

        <div className={cn("bg-[#06090F] border-t border-white/5 space-y-4", isDesktop ? "p-6" : "p-5 pb-8")}>
          <div className="flex justify-between items-end">
            <p className={cn("font-bold text-[#4B6478] uppercase tracking-widest", isDesktop ? "text-[11px]" : "text-[10px]")}>Total Bayar</p>
            <p className={cn("font-display font-black text-white leading-none tracking-tighter", isDesktop ? "text-3xl" : "text-[28px]")}>{formatIDR(subtotal)}</p>
          </div>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || cart.length === 0 || !selectedCustomerId}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_8px_32px_rgba(16,185,129,0.3)] border-none active:scale-95 transition-all"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Selesaikan Transaksi'}
          </Button>
        </div>
      </div>
    </div>
  )
}

 function SuccessView({ invoice, onReset }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return (
    <div className="min-h-screen bg-[#06090F] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_100%)]">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn("w-full bg-[#0C1319] border border-white/5 rounded-[40px] text-center space-y-6 shadow-2xl overflow-hidden relative", isDesktop ? "max-w-[440px] p-10" : "max-w-full p-8")}
      >
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10" style={{ width: isDesktop ? 80 : 72, height: isDesktop ? 80 : 72 }}>
          <CheckCircle2 size={isDesktop ? 40 : 36} className="text-[#34D399]" />
        </div>
        <div className="space-y-3 relative z-10">
          <h2 className={cn("font-black text-white uppercase tracking-tight", isDesktop ? "text-2xl" : "text-xl")}>Transaksi Berhasil!</h2>
          <p className={cn("font-bold text-[#4B6478] uppercase tracking-widest", isDesktop ? "text-xs" : "text-[10px]")}>Invoice: {invoice}</p>
        </div>
        <div className="pt-4 space-y-3 relative z-10">
          <Button className="w-full h-15 bg-emerald-500 hover:bg-emerald-600 rounded-[20px] font-black uppercase tracking-widest text-[11px] border-none shadow-[0_8px_24px_rgba(16,185,129,0.2)]">Cetak Struk</Button>
          <Button variant="ghost" onClick={onReset} className="w-full h-12 text-[#4B6478] font-bold hover:text-white uppercase text-[11px]">Kembali ke POS</Button>
        </div>
      </motion.div>
    </div>
  )
}


