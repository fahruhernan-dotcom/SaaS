import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Package, TrendingUp, TrendingDown, 
  History, Trash2, Loader2, AlertCircle
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSales } from '@/lib/hooks/useSales'
import { usePurchases } from '@/lib/hooks/usePurchases'
import { formatIDR, formatDate, formatRelative, formatWeight, safeNumber, formatIDRShort, formatPaymentStatus } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import SlideModal from '@/dashboard/components/SlideModal'
import FormBeliModal from '@/dashboard/components/FormBeliModal'
import FormJualModal from '@/dashboard/components/FormJualModal'
import EmptyState from '@/components/EmptyState'

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } 
  }
}

export default function Transaksi() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('jual')
  const { data: sales, isLoading: loadingSales } = useSales()
  const { data: purchases, isLoading: loadingPurchases } = usePurchases()
  
  const [openModal, setOpenModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClickDelete = async (e, purchase) => {
    e.stopPropagation()
    const { count } = await supabase
      .from('sales')
      .select('id', { count: 'exact', head: true })
      .eq('purchase_id', purchase.id)
      .eq('is_deleted', false)
    setDeleteTarget({
      ...purchase,
      hasLinkedSales: count > 0,
      linkedSalesCount: count || 0
    })
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ is_deleted: true })
        .eq('id', deleteTarget.id)
        .eq('tenant_id', tenant.id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['purchases', tenant.id] })
      queryClient.invalidateQueries({ queryKey: ['broker-stats', tenant.id] })
      const { toast } = await import('sonner')
      toast.success('🗑️ Catatan pembelian dihapus')
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    } catch (err) {
      const { toast } = await import('sonner')
      toast.error('Gagal menghapus: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Summary Logic
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0,0,0,0)

  const monthSales = sales?.filter(s => new Date(s.transaction_date) >= monthStart) || []
  const monthPurchases = purchases?.filter(p => new Date(p.transaction_date) >= monthStart) || []

  const totalSalesVal = monthSales.reduce((acc, s) => acc + (Number(s.net_revenue) || 0), 0)
  const totalBeliVal = monthPurchases.reduce((acc, p) => acc + (Number(p.total_modal) || 0), 0)
  const netProfit = totalSalesVal - totalBeliVal

  return (
    <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#06090F] min-h-screen pb-24"
    >
      {/* TopBar */}
      <header className="px-5 pt-8 pb-4 flex justify-between items-center border-b border-white/5 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30">
        <div>
          <h1 className="font-display text-2xl font-black text-white tracking-tight uppercase">Transaksi</h1>
        </div>
        <Button 
          size="sm" 
          onClick={() => setOpenModal('options')}
          className="bg-[#10B981] hover:bg-emerald-600 text-white font-black rounded-xl h-10 px-5 gap-2 border-none shadow-[0_4px_20px_rgba(16,185,129,0.15)] active:scale-95 transition-transform uppercase text-xs tracking-widest"
        >
          <Plus size={16} strokeWidth={3} />
          Catat
        </Button>
      </header>

      {/* Summary Strip */}
      <div className="bg-emerald-500/[0.04] border-b border-white/5 px-5 py-3.5 flex justify-between items-center overflow-x-auto no-scrollbar">
        <div className="space-y-0.5 min-w-[100px] text-left">
          <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.15em] leading-none mb-1">Total Jual</p>
          <p className="font-display text-[13px] font-black text-emerald-400 tabular-nums">{formatIDR(totalSalesVal)}</p>
        </div>
        <div className="space-y-0.5 min-w-[100px] text-center px-4 border-x border-white/5">
          <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.15em] leading-none mb-1">Total Beli</p>
          <p className="font-display text-[13px] font-black text-[#F1F5F9] tabular-nums">{formatIDR(totalBeliVal)}</p>
        </div>
        <div className="space-y-0.5 min-w-[100px] text-right">
          <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.15em] leading-none mb-1">Net Margin</p>
          <p className={`font-display text-[13px] font-black tabular-nums ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {netProfit >= 0 ? '+' : ''}{formatIDR(netProfit)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="jual" className="mt-4" onValueChange={setActiveTab}>
        <div className="px-5">
          <TabsList className="w-full bg-[#111C24] border border-white/5 h-12 p-1 rounded-2xl">
            <TabsTrigger 
              value="jual" 
              className="flex-1 rounded-xl font-black text-[10px] h-full uppercase tracking-widest data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400 text-[#4B6478]"
            >
              Penjualan
            </TabsTrigger>
            <TabsTrigger 
              value="beli" 
              className="flex-1 rounded-xl font-black text-[10px] h-full uppercase tracking-widest data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400 text-[#4B6478]"
            >
              Pembelian
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="jual" className="px-5 mt-4 outline-none">
          <AnimatePresence mode="wait">
            {loadingSales ? (
              <LoadingList />
            ) : !sales?.length ? (
              <EmptyState 
                  icon={History} 
                  title="Belum ada penjualan" 
                  description="Catat penjualan pertamamu hari ini untuk melihat riwayat di sini." 
              />
            ) : (
              <motion.div 
                key="sale-list"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {sales.map(sale => (
                   <motion.div key={sale.id} variants={fadeUp}>
                      <SaleCard sale={sale} />
                   </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="beli" className="px-5 mt-4 outline-none">
          <AnimatePresence mode="wait">
              {loadingPurchases ? (
                <LoadingList />
              ) : !purchases?.length ? (
                <EmptyState 
                    icon={Package} 
                    title="Belum ada pembelian" 
                    description="Catat pembelian dari kandang untuk memantau stok dan biaya." 
                />
              ) : (
                <motion.div 
                  key="purchase-list"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {purchases.map(purchase => (
                     <motion.div key={purchase.id} variants={fadeUp}>
                        <PurchaseCard purchase={purchase} onDelete={handleClickDelete} />
                     </motion.div>
                  ))}
                </motion.div>
              )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <SlideModal 
        title="Opsi Transaksi" 
        isOpen={openModal === 'options'} 
        onClose={() => setOpenModal(null)}
      >
        <div className="grid grid-cols-2 gap-4 pb-12">
          <button 
            onClick={() => setOpenModal('beli')}
            className="flex flex-col items-center justify-center p-6 bg-[#111C24] border border-white/5 rounded-[32px] hover:border-emerald-500/30 transition-all group active:scale-95"
          >
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <TrendingDown size={32} />
            </div>
            <span className="font-black text-white text-[11px] uppercase tracking-widest">Catat Beli</span>
          </button>
          <button 
             onClick={() => setOpenModal('jual')}
             className="flex flex-col items-center justify-center p-6 bg-[#111C24] border border-white/5 rounded-[32px] hover:border-emerald-500/30 transition-all group active:scale-95"
          >
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <TrendingUp size={32} />
            </div>
            <span className="font-black text-white text-[11px] uppercase tracking-widest">Catat Jual</span>
          </button>
        </div>
      </SlideModal>

      <SlideModal title="Catat Pembelian" isOpen={openModal === 'beli'} onClose={() => setOpenModal(null)}>
        <FormBeliModal onClose={() => setOpenModal(null)} />
      </SlideModal>

      <SlideModal title="Catat Penjualan" isOpen={openModal === 'jual'} onClose={() => setOpenModal(null)}>
        <FormJualModal onClose={() => setOpenModal(null)} />
      </SlideModal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(o) => { if (!o) { setShowDeleteDialog(false); setDeleteTarget(null) } }}>
        <AlertDialogContent style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 16, maxWidth: 400 }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Sora', fontSize: 17, fontWeight: 700, color: 'hsl(var(--foreground))' }}>
              Hapus Catatan Pembelian?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 10, padding: '12px 14px', margin: '8px 0 12px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', margin: '0 0 4px' }}>
                    {deleteTarget?.farms?.farm_name || 'Kandang'}
                  </p>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                    {deleteTarget?.quantity?.toLocaleString('id-ID')} ekor · {deleteTarget?.total_weight_kg?.toFixed(1)} kg · {formatDate(deleteTarget?.transaction_date)}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#F87171', margin: '6px 0 0', fontVariantNumeric: 'tabular-nums' }}>
                    Modal: {formatIDR(deleteTarget?.total_modal)}
                  </p>
                </div>
                {deleteTarget?.hasLinkedSales && (
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: '#FBBF24', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                      Pembelian ini terhubung dengan {deleteTarget.linkedSalesCount} catatan penjualan.
                      Data penjualan tetap ada, tapi referensi ke pembelian ini akan terputus.
                    </span>
                  </div>
                )}
                <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter style={{ gap: 8 }}>
            <AlertDialogCancel
              style={{ background: 'transparent', border: '1px solid hsl(var(--border))', borderRadius: 10, color: 'hsl(var(--foreground))', fontFamily: 'DM Sans', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => { setShowDeleteDialog(false); setDeleteTarget(null) }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.30)', borderRadius: 10, color: '#F87171', fontFamily: 'DM Sans', fontWeight: 700, cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={(e) => { e.preventDefault(); handleDelete() }}
            >
              {isDeleting
                ? <><Loader2 size={14} className="animate-spin" /> Menghapus...</>
                : <><Trash2 size={14} /> Ya, Hapus</>
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

function SaleCard({ sale }) {
  const profit = sale.profit || 0
  const remaining = (sale.net_revenue || 0) - (sale.paid_amount || 0)

  return (
    <Card className="bg-[#111C24] border-white/5 rounded-[22px] p-4 space-y-4 overflow-hidden relative active:scale-[0.98] transition-transform">
      <div className="flex justify-between items-start text-left">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-[9px] tracking-tighter uppercase px-1">
            JUAL
          </div>
          <div>
            <h3 className="font-display font-black text-[#F1F5F9] leading-tight uppercase tracking-tight">{sale.rpa_clients?.rpa_name || 'RPA Umum'}</h3>
            <p className="text-[11px] font-black text-[#4B6478] uppercase mt-0.5 tracking-wider">{formatDate(sale.transaction_date)}</p>
          </div>
        </div>
        <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.1em]">{formatRelative(sale.transaction_date)}</p>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex justify-between items-center text-left">
         <div className="space-y-1">
           <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest leading-none">Status Transaksi</p>
           <p className="font-display font-black text-[#F1F5F9] text-xl tabular-nums leading-none mt-1">{formatIDR(sale.net_revenue)}</p>
            <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-tight">
             {sale.quantity} ekor · {formatWeight(sale.total_weight_kg)} · {formatIDRShort(safeNumber(sale.price_per_kg))}/kg
           </p>
         </div>
         <div className="text-right">
           <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1.5 leading-none">Profit</p>
           <div className={`px-2 py-1 rounded-lg text-[13px] font-black leading-none tabular-nums ${profit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
             {profit >= 0 ? '+' : ''}{formatIDR(profit)}
           </div>
         </div>
      </div>

      <div className="flex justify-between items-center pt-1">
        <div className="flex gap-2 items-center">
          <Badge className={`rounded-full h-6 px-3 border-none font-black text-[9px] uppercase tracking-wider
            ${sale.payment_status === 'lunas' ? 'bg-emerald-500/10 text-emerald-400' : 
              sale.payment_status === 'sebagian' ? 'bg-amber-500/10 text-amber-500' : 
              'bg-red-500/10 text-red-500'}`}
          >
            {formatPaymentStatus(sale.payment_status).toUpperCase()}
          </Badge>
          {remaining > 0 && (
            <p className="text-[11px] font-black text-red-500 tabular-nums">Sisa {formatIDR(remaining)}</p>
          )}
        </div>
        {sale.due_date && sale.payment_status !== 'lunas' && (
          <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Tempo: {formatDate(sale.due_date)}</p>
        )}
      </div>
    </Card>
  )
}

function PurchaseCard({ purchase, onDelete }) {
  return (
    <Card className="bg-[#111C24] border-white/5 rounded-[22px] p-4 space-y-4 text-left active:scale-[0.98] transition-transform">
      {/* Header row: badge + farm name + date + trash */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-[9px] tracking-tighter uppercase px-1 flex-shrink-0">
          BELI
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-black text-[#F1F5F9] leading-tight uppercase tracking-tight truncate">{purchase.farms?.farm_name || 'Kandang'}</h3>
          <p className="text-[11px] font-black text-[#4B6478] uppercase mt-0.5 tracking-wider">{formatDate(purchase.transaction_date)}</p>
        </div>
        <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.1em] flex-shrink-0">{formatRelative(purchase.transaction_date)}</p>
        {/* Trash button */}
        <button
          onClick={(e) => onDelete(e, purchase)}
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'transparent', border: '1px solid transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'hsl(var(--muted-foreground))',
            transition: 'all 0.15s', flexShrink: 0
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(248,113,113,0.08)'
            e.currentTarget.style.borderColor = 'rgba(248,113,113,0.20)'
            e.currentTarget.style.color = '#F87171'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
            e.currentTarget.style.color = 'hsl(var(--muted-foreground))'
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex justify-between items-end">
         <div className="space-y-1">
           <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest leading-none">Nilai Pembelian</p>
           <p className="font-display font-black text-[#F1F5F9] text-xl tabular-nums leading-none mt-1">{formatIDR(purchase.total_modal)}</p>
            <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-tight">
             {purchase.quantity} ekor · {formatWeight(purchase.total_weight_kg)} · {formatIDRShort(safeNumber(purchase.price_per_kg))}/kg
           </p>
         </div>
         <div className="text-right pb-1">
           <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1 leading-none">Biaya Ops</p>
           <p className="font-black text-slate-400 text-[11px] tabular-nums leading-none">{formatIDR(purchase.transport_cost || 0)}</p>
         </div>
      </div>
    </Card>
  )
}

function LoadingList() {
  return (
    <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-[22px] bg-secondary/10 border border-white/5" />
        ))}
    </div>
  )
}

// (Local formatIDRShort removed, using @/lib/format)

