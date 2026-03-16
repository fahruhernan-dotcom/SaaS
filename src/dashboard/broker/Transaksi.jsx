import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, Package, AlertTriangle, CheckCircle2,
  Plus, Search, Filter, ChevronRight,
  Clock, MapPin, User, Smartphone, History,
  TrendingDown, TrendingUp, AlertCircle, Info, Calendar,
  ArrowRightLeft, MoreHorizontal, Check, Edit2, Pencil, Trash2, Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatIDR, safeNumber, safePercent, safeNum, formatWeight, formatEkor } from '@/lib/format'
import { useUpdateDelivery } from '@/lib/hooks/useUpdateDelivery'
import { useSales } from '@/lib/hooks/useSales'
import { usePurchases } from '@/lib/hooks/usePurchases'
import { formatDate, formatRelative, formatIDRShort, formatPaymentStatus } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet'
import { InputNumber } from '@/components/ui/InputNumber'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { DatePicker } from '@/components/ui/DatePicker'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import SlideModal from '@/dashboard/components/SlideModal'
import FormBeliModal from '@/dashboard/components/FormBeliModal'
import FormJualModal from '@/dashboard/components/FormJualModal'
import EmptyState from '@/components/EmptyState'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'


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

const getDeliveryBadge = (delivery) => {
  if (!delivery) return {
    label: 'Belum Ada Pengiriman',
    color: '#4B6478',
    bg: 'transparent',
    border: 'transparent',
    icon: null
  }

  const map = {
    preparing: {
      label: 'Persiapan',
      color: '#94A3B8',
      bg: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.08)',
      icon: '📦'
    },
    loading: {
      label: 'Sedang Dimuat',
      color: '#FBBF24',
      bg: 'rgba(251,191,36,0.08)',
      border: 'rgba(251,191,36,0.15)',
      icon: '📦'
    },
    on_route: {
      label: 'Di Jalan',
      color: '#FBBF24',
      bg: 'rgba(251,191,36,0.08)',
      border: 'rgba(251,191,36,0.15)',
      icon: '🚚'
    },
    arrived: {
      label: 'Tiba di Tujuan',
      color: '#93C5FD',
      bg: 'rgba(96,165,250,0.08)',
      border: 'rgba(96,165,250,0.15)',
      icon: '📍'
    },
    completed: {
      label: 'Terkirim',
      color: '#34D399',
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.20)',
      icon: '✓'
    }
  }

  return map[delivery.status] || map.preparing
}

export default function Transaksi() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('jual')
  const { data: sales, isLoading: loadingSales } = useSales()
  const { data: purchases, isLoading: loadingPurchases } = usePurchases()

  const [openModal, setOpenModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [editTarget, setEditTarget] = useState(null)
  const [showEditPurchase, setShowEditPurchase] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  const [updateDeliveryTarget, setUpdateDeliveryTarget] = useState(null)
  const [showUpdateDelivery, setShowUpdateDelivery] = useState(false)
  const [arrivedCount, setArrivedCount] = useState('')
  const [arrivedWeight, setArrivedWeight] = useState('')
  const [arrivalNotes, setArrivalNotes] = useState('')
  const { updateTiba } = useUpdateDelivery()
  const [isUpdateArrivalSubmitting, setIsUpdateArrivalSubmitting] = useState(false)


  React.useEffect(() => {
    if (editTarget) {
      setEditForm({
        quantity:         editTarget.quantity || 0,
        avg_weight_kg:    editTarget.avg_weight_kg || 0,
        price_per_kg:     editTarget.price_per_kg || 0,
        transport_cost:   editTarget.transport_cost || 0,
        other_cost:       editTarget.other_cost || 0,
        transaction_date: editTarget.transaction_date,
        notes:            editTarget.notes || ''
      })
    }
  }, [editTarget])

  React.useEffect(() => {
    if (updateDeliveryTarget) {
        setArrivedCount(updateDeliveryTarget.initial_count || '')
        setArrivedWeight(updateDeliveryTarget.initial_weight_kg || '')
        setArrivalNotes('')
    }
  }, [updateDeliveryTarget])

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

  const handleEditPurchase = async () => {
    if (!editTarget) return
    setIsEditSubmitting(true)

    try {
      const totalWeight = Number(editForm.quantity || 0) * Number(editForm.avg_weight_kg || 0)
      const totalCost = totalWeight * Number(editForm.price_per_kg || 0)

      const { error } = await supabase
        .from('purchases')
        .update({
          quantity:         editForm.quantity,
          avg_weight_kg:    editForm.avg_weight_kg,
          total_weight_kg:  totalWeight,
          price_per_kg:     editForm.price_per_kg,
          total_cost:       totalCost,
          transport_cost:   safeNumber(editForm.transport_cost),
          other_cost:       safeNumber(editForm.other_cost),
          transaction_date: editForm.transaction_date,
          notes:            editForm.notes || null
        })
        .eq('id', editTarget.id)
        .eq('tenant_id', tenant.id)

      if (error) throw error

      queryClient.invalidateQueries({
        queryKey: ['purchases', tenant.id]
      })
      queryClient.invalidateQueries({
        queryKey: ['broker-stats', tenant.id]
      })

      const { toast } = await import('sonner')
      toast.success('Pembelian berhasil diperbarui')
      setShowEditPurchase(false)
      setEditTarget(null)

    } catch (err) {
      const { toast } = await import('sonner')
      toast.error('Gagal memperbarui: ' + err.message)
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const handleCompleteDelivery = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!updateDeliveryTarget) return

    setIsUpdateArrivalSubmitting(true)
    try {
        await updateTiba({
            deliveryId: updateDeliveryTarget.id,
            arrivedCount: arrivedCount,
            arrivedWeight: arrivedWeight,
            notes: arrivalNotes
        })

        toast.success('Kedatangan berhasil dicatat')
        setShowUpdateDelivery(false)
        setUpdateDeliveryTarget(null)
    } catch (err) {
        console.error('Error update arrival:', err)
        toast.error('Gagal mencatat kedatangan')
    } finally {
        setIsUpdateArrivalSubmitting(false)
    }
  }

  // Summary Logic
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0,0,0,0)

  const monthSales = sales?.filter(s => new Date(s.transaction_date) >= monthStart) || []
  const monthPurchases = purchases?.filter(p => new Date(p.transaction_date) >= monthStart) || []

  const totalSalesVal = monthSales.reduce((acc, s) => acc + (Number(s.net_revenue) || 0), 0)
  const totalModalVal = monthSales.reduce((acc, s) => acc + (Number(s.purchases?.total_cost) || 0), 0)
  const netProfit = totalSalesVal - totalModalVal

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
          <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.15em] leading-none mb-1">Modal Produk</p>
          <p className="font-display text-[13px] font-black text-[#F1F5F9] tabular-nums">{formatIDR(totalModalVal)}</p>
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
                      <SaleCard
                        sale={sale}
                        setUpdateDeliveryTarget={setUpdateDeliveryTarget}
                        setShowUpdateDelivery={setShowUpdateDelivery}
                        handleCompleteDelivery={handleCompleteDelivery}
                      />
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
                      <PurchaseCard
                        purchase={purchase}
                        onDelete={handleClickDelete}
                        setEditTarget={setEditTarget}
                        setShowEditPurchase={setShowEditPurchase}
                      />
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

      {/* Sheet Edit Pembelian */}
      <Sheet
        open={showEditPurchase}
        onOpenChange={setShowEditPurchase}
      >
        <SheetContent
          side="right"
          style={{
            background: 'hsl(var(--card))',
            borderLeft: '1px solid hsl(var(--border))',
            width: '100%',
            maxWidth: '440px',
            padding: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <SheetHeader style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid hsl(var(--border))',
            flexShrink: 0
          }}>
            <SheetTitle style={{
              fontFamily: 'Sora',
              fontSize: '18px',
              fontWeight: 700
            }}>
              Edit Pembelian
            </SheetTitle>
            <SheetDescription className="sr-only">
              Edit data transaksi pembelian
            </SheetDescription>
          </SheetHeader>

          {editTarget && (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>

              {/* Info kandang (readonly) */}
              <div style={{
                padding: '12px 14px',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.12)',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#34D399'
              }}>
                📦 {editTarget.farms?.farm_name}
              </div>

              {/* Jumlah Ekor */}
              <div>
                <label style={{fontSize:'11px',color:'#4B6478',
                  textTransform:'uppercase',letterSpacing:'0.8px',
                  display:'block',marginBottom:6}}>
                  Jumlah Ekor *
                </label>
                <InputNumber
                  value={editForm.quantity}
                  onChange={v => setEditForm(p=>({
                    ...p, quantity: v
                  }))}
                  step={1} min={1}
                  placeholder="500"
                />
              </div>

              {/* Bobot rata-rata */}
              <div>
                <label style={{fontSize:'11px',color:'#4B6478',
                  textTransform:'uppercase',letterSpacing:'0.8px',
                  display:'block',marginBottom:6}}>
                  Bobot Rata-rata (kg/ekor) *
                </label>
                <InputNumber
                  value={editForm.avg_weight_kg}
                  onChange={v => setEditForm(p=>({
                    ...p, avg_weight_kg: v
                  }))}
                  step={0.01} min={0.1}
                  placeholder="1.85"
                />
              </div>

              {/* Harga Beli */}
              <div>
                <label style={{fontSize:'11px',color:'#4B6478',
                  textTransform:'uppercase',letterSpacing:'0.8px',
                  display:'block',marginBottom:6}}>
                  Harga Beli (Rp/kg) *
                </label>
                <InputRupiah
                  value={editForm.price_per_kg}
                  onChange={v => setEditForm(p=>({
                    ...p, price_per_kg: v
                  }))}
                  placeholder="22.000"
                />
              </div>

              {/* Biaya Perjalanan */}
              <div>
                <label style={{fontSize:'11px',color:'#4B6478',
                  textTransform:'uppercase',letterSpacing:'0.8px',
                  display:'block',marginBottom:6}}>
                  Biaya Perjalanan (Transport)
                </label>
                <InputRupiah
                  value={editForm.transport_cost}
                  onChange={v => setEditForm(p=>({
                    ...p, transport_cost: v
                  }))}
                  placeholder="0"
                />
              </div>

              {/* Biaya Lain */}
              <div>
                <label style={{fontSize:'11px',color:'#4B6478',
                  textTransform:'uppercase',letterSpacing:'0.8px',
                  display:'block',marginBottom:6}}>
                  Biaya Lain
                </label>
                <InputRupiah
                  value={editForm.other_cost}
                  onChange={v => setEditForm(p=>({
                    ...p, other_cost: v
                  }))}
                  placeholder="0"
                />
              </div>

              {/* Tanggal */}
              <div>
                <label style={{fontSize:'11px',color:'#4B6478',
                  textTransform:'uppercase',letterSpacing:'0.8px',
                  display:'block',marginBottom:6}}>
                  Tanggal Transaksi
                </label>
                <DatePicker
                  value={editForm.transaction_date ? new Date(editForm.transaction_date) : null}
                  onChange={v => setEditForm(p=>({
                    ...p, transaction_date: v ? v.toISOString().split('T')[0] : null
                  }))}
                />
              </div>

              {/* Catatan */}
              <div>
                <label style={{fontSize:'11px',color:'#4B6478',
                  textTransform:'uppercase',letterSpacing:'0.8px',
                  display:'block',marginBottom:6}}>
                  Catatan
                </label>
                <Textarea
                  value={editForm.notes || ''}
                  onChange={e => setEditForm(p=>({
                    ...p, notes: e.target.value
                  }))}
                  placeholder="Catatan tambahan..."
                  style={{fontSize:'16px', minHeight:'80px'}}
                />
              </div>

              {/* Live preview */}
              <div style={{
                padding: '14px',
                background: 'hsl(var(--secondary))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px'
              }}>
                <p style={{
                  fontSize:'11px',fontWeight:700,
                  color:'#4B6478',textTransform:'uppercase',
                  letterSpacing:'0.8px',margin:'0 0 8px'
                }}>
                  RINGKASAN
                </p>
                {(() => {
                  const tw = Number(editForm.quantity || 0) * Number(editForm.avg_weight_kg || 0)
                  const tc = tw * Number(editForm.price_per_kg || 0)
                  const tm = tc + Number(editForm.transport_cost || 0) + Number(editForm.other_cost || 0)

                  return (
                    <>
                      {[
                        ['Total Berat', `${tw.toFixed(1)} kg`],
                        ['Total Beli', formatIDR(tc)],
                        ['Biaya Perjalanan', formatIDR(Number(editForm.transport_cost || 0))],
                        ['Biaya Lain', formatIDR(Number(editForm.other_cost || 0))],
                      ].map(([label, val]) => (
                        <div key={label} style={{
                          display:'flex',justifyContent:'space-between',
                          padding:'4px 0',fontSize:'13px',
                          borderBottom:'1px solid rgba(255,255,255,0.05)'
                        }}>
                          <span style={{color:'#94A3B8'}}>{label}</span>
                          <span style={{color:'#F1F5F9', fontVariantNumeric:'tabular-nums'}}>
                            {val}
                          </span>
                        </div>
                      ))}

                      <div style={{
                        display:'flex', justifyContent:'space-between',
                        alignItems:'baseline', marginTop:8,
                        paddingTop:8,
                        borderTop:'1px solid rgba(255,255,255,0.08)'
                      }}>
                        <span style={{
                          fontFamily:'Sora', fontSize:'12px',
                          fontWeight:700, color:'hsl(var(--muted-foreground))'
                        }}>
                          TOTAL MODAL
                        </span>
                        <span style={{
                          fontFamily:'Sora', fontSize:'18px',
                          fontWeight:800, color:'#34D399',
                          fontVariantNumeric:'tabular-nums'
                        }}>
                          {formatIDR(tm)}
                        </span>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Tombol simpan */}
              <Button
                onClick={handleEditPurchase}
                disabled={isEditSubmitting}
                style={{
                  width:'100%', height:'46px',
                  background:'#10B981', border:'none',
                  borderRadius:'10px', color:'white',
                  fontFamily:'DM Sans', fontSize:'15px',
                  fontWeight:700
                }}
              >
                {isEditSubmitting
                  ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                  : 'Simpan Perubahan'}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Catat Kedatangan Sheet */}
      <Sheet open={showUpdateDelivery} onOpenChange={setShowUpdateDelivery}>
          <SheetContent side="bottom" className="h-[80vh] bg-[#0C1319] border-white/10 rounded-t-[40px] px-6 text-left overflow-y-auto">
              <SheetHeader className="mb-6">
                  <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">Catat Kedatangan</SheetTitle>
                  <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">Konfirmasi jumlah dan berat tiba di buyer</SheetDescription>
              </SheetHeader>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-6">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] mb-1 px-1">
                       <span>Target Pengiriman</span>
                   </div>
                   <div className="bg-[#111C24] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                       <div>
                           <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">Kiriman Dari</p>
                           <p className="text-xs font-black text-white">{updateDeliveryTarget?.sales?.purchases?.farms?.farm_name || '-'}</p>
                       </div>
                       <div className="text-right">
                           <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">Target Tiba</p>
                           <p className="text-xs font-black text-white uppercase">
                               {formatEkor(updateDeliveryTarget?.initial_count)} / {formatWeight(updateDeliveryTarget?.initial_weight_kg)}
                           </p>
                       </div>
                   </div>
              </div>

              <form onSubmit={handleCompleteDelivery} className="space-y-6 pb-20">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Ekor Tiba *</Label>
                          <Input 
                              type="number" 
                              value={arrivedCount} 
                              onChange={(e) => setArrivedCount(e.target.value)}
                              placeholder={updateDeliveryTarget?.initial_count}
                              className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" 
                          />
                      </div>
                      <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Berat Tiba (kg) *</Label>
                          <Input 
                              type="number" 
                              step="0.1" 
                              value={arrivedWeight}
                              onChange={(e) => setArrivedWeight(e.target.value)}
                              placeholder={updateDeliveryTarget?.initial_weight_kg}
                              className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" 
                          />
                      </div>
                  </div>

                  {/* Summary Live Calculation */}
                  {(() => {
                      const mortality = safeNum(updateDeliveryTarget?.initial_count) - safeNum(arrivedCount)
                      const shrinkage = safeNum(updateDeliveryTarget?.initial_weight_kg) - safeNum(arrivedWeight)
                      
                      return (
                          <>
                              <div style={{
                                padding: '14px 16px',
                                background: 'hsl(var(--secondary))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8
                              }}>
                                {[
                                  {
                                    label: 'Berat dikirim',
                                    value: formatWeight(updateDeliveryTarget?.initial_weight_kg),
                                    color: 'hsl(var(--foreground))'
                                  },
                                  {
                                    label: 'Berat tiba',
                                    value: formatWeight(arrivedWeight),
                                    color: '#34D399'
                                  },
                                  {
                                    label: 'Susut berat',
                                    value: formatWeight(shrinkage),
                                    color: shrinkage > 0 ? '#F87171' : '#34D399'
                                  },
                                  {
                                    label: 'Mati di perjalanan',
                                    value: formatEkor(mortality),
                                    color: mortality > 0 ? '#F87171' : '#34D399'
                                  },
                                ].map(({ label, value, color }) => (
                                  <div key={label} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '13px'
                                  }}>
                                    <span style={{color:'#4B6478'}}>{label}</span>
                                    <span style={{
                                      color, fontWeight: 600,
                                      fontVariantNumeric: 'tabular-nums'
                                    }}>
                                      {value}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {mortality > 0 && (
                                <div style={{
                                  padding: '10px 14px',
                                  background: 'rgba(248,113,113,0.08)',
                                  border: '1px solid rgba(248,113,113,0.20)',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  color: '#F87171',
                                  display: 'flex',
                                  gap: 8,
                                  alignItems: 'center'
                                }}>
                                  <AlertCircle size={14} style={{flexShrink:0}} />
                                  Loss report akan dibuat otomatis untuk {mortality} ekor yang mati.
                                </div>
                              )}
                          </>
                      )
                  })()}

                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Catatan</Label>
                      <Textarea 
                          value={arrivalNotes}
                          onChange={(e) => setArrivalNotes(e.target.value)}
                          placeholder="CATATAN KEDATANGAN..." 
                          className="rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase p-4 min-h-[100px]" 
                      />
                  </div>

                  <Button 
                      disabled={isUpdateArrivalSubmitting}
                      className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all mt-4"
                  >
                      {isUpdateArrivalSubmitting ? 'MENYIMPAN...' : 'SIMPAN & SELESAIKAN'}
                  </Button>
              </form>
          </SheetContent>
      </Sheet>
    </motion.div>
  )
}

function SaleCard({ sale, setUpdateDeliveryTarget, setShowUpdateDelivery, handleCompleteDelivery }) {
  const profit = safeNumber(sale.net_revenue) - safeNumber(sale.purchases?.total_cost)
  const remaining = (sale.net_revenue || 0) - (sale.paid_amount || 0)
  const delivery = sale.deliveries?.[0] || null

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
        <div className="flex items-center gap-2">
           {(() => {
             const badge = getDeliveryBadge(sale.deliveries?.[0])
             return (
               <span style={{
                 display: 'inline-flex',
                 alignItems: 'center',
                 gap: '5px',
                 fontSize: '11px',
                 fontWeight: 600,
                 padding: '3px 10px',
                 borderRadius: '99px',
                 background: badge.bg,
                 border: `1px solid ${badge.border}`,
                 color: badge.color
               }}>
                 {badge.icon && (
                   <span style={{fontSize:'12px'}}>{badge.icon}</span>
                 )}
                 {badge.label}
               </span>
             )
           })()}

           {/* QUICK ACTION BUTTONS */}
           {sale.deliveries?.[0]?.status === 'on_route' && (
             <button
               onClick={(e) => {
                 e.stopPropagation()
                 setUpdateDeliveryTarget(sale.deliveries[0])
                 setShowUpdateDelivery(true)
               }}
               style={{
                 fontSize: '11px',
                 fontWeight: 600,
                 padding: '4px 12px',
                 borderRadius: '99px',
                 background: 'rgba(16,185,129,0.10)',
                 border: '1px solid rgba(16,185,129,0.20)',
                 color: '#34D399',
                 cursor: 'pointer'
               }}
             >
               Catat Tiba →
             </button>
           )}

           {sale.deliveries?.[0]?.status === 'arrived' && (
             <button
               onClick={(e) => {
                 e.stopPropagation()
                 handleCompleteDelivery(sale.deliveries[0].id)
               }}
               style={{
                 fontSize: '11px',
                 fontWeight: 600,
                 padding: '4px 12px',
                 borderRadius: '99px',
                 background: 'rgba(16,185,129,0.10)',
                 border: '1px solid rgba(16,185,129,0.20)',
                 color: '#34D399',
                 cursor: 'pointer'
               }}
             >
               Konfirmasi Terkirim ✓
             </button>
           )}

           {sale.due_date && sale.payment_status !== 'lunas' && (
             <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Tempo: {formatDate(sale.due_date)}</p>
           )}
        </div>
      </div>
    </Card>
  )
}

function PurchaseCard({ purchase, onDelete, setEditTarget, setShowEditPurchase }) {
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
        
        {/* ACTION BUTTONS */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {/* TOMBOL EDIT */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditTarget(purchase)
              setShowEditPurchase(true)
            }}
            style={{
              width: 28, height: 28,
              borderRadius: '6px',
              background: 'transparent',
              border: '1px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'hsl(var(--muted-foreground))',
              transition: 'all 0.15s',
              flexShrink: 0
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(16,185,129,0.08)'
              e.currentTarget.style.borderColor = 'rgba(16,185,129,0.20)'
              e.currentTarget.style.color = '#34D399'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.color = 'hsl(var(--muted-foreground))'
            }}
          >
            <Pencil size={13} />
          </button>

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
           {(() => {
             const biayaOps = safeNumber(purchase.transport_cost) + safeNumber(purchase.other_cost)
             return (
               <div style={{
                 display: 'flex', flexDirection: 'column',
                 alignItems: 'flex-end', gap: 2
               }}>
                 <span style={{
                   fontSize: '10px', fontWeight: 600,
                   color: '#4B6478', textTransform: 'uppercase',
                   letterSpacing: '0.8px'
                 }}>
                   Biaya Perjalanan
                 </span>
                 {biayaOps > 0 ? (
                   <span style={{
                     fontSize: '13px', fontWeight: 700,
                     color: '#FBBF24',
                     fontVariantNumeric: 'tabular-nums'
                   }}>
                     {formatIDR(biayaOps)}
                   </span>
                 ) : (
                   <span style={{ fontSize: '13px', color: '#4B6478' }}>
                     —
                   </span>
                 )}
               </div>
             )
           })()}
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

