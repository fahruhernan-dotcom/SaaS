import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, Package, AlertTriangle, CheckCircle2,
  Plus, Search, Filter, ChevronRight,
  Clock, MapPin, User, Smartphone, History,
  TrendingDown, TrendingUp, AlertCircle, Info, Calendar,
  Loader2, Eye, Trash2, Pencil, ArrowRightLeft
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
  formatIDR, safeNumber, safePercent, safeNum, formatWeight, formatEkor, formatKg,
  formatDate, formatRelative, formatIDRShort, formatPaymentStatus,
  calcTotalJual, calcKerugianSusut, calcNetProfit, calcRemainingAmount
} from '@/lib/format'
import { useUpdateDelivery } from '@/lib/hooks/useUpdateDelivery'
import { useRPA } from '@/lib/hooks/useRPA'
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
import TransaksiWizard from '../components/TransaksiWizard'
import EmptyState from '@/components/EmptyState'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


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
  const { tenant, profile } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  const isOwner = profile?.role === 'owner'
  const isViewOnly = profile?.role === 'view_only'
  const canWrite = profile?.role === 'owner' || profile?.role === 'staff'

  // --- STATES ---
  const [activeTab, setActiveTab] = useState('semua')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [selectedSaleId, setSelectedSaleId] = useState(null)
  const [showAuditSheet, setShowAuditSheet] = useState(false)
  const [deleteTargetSale, setDeleteTargetSale] = useState(null)
  const [showDeleteSaleDialog, setShowDeleteSaleDialog] = useState(false)
  const [isDeletingSale, setIsDeletingSale] = useState(false)

  const [editTarget, setEditTarget] = useState(null)
  const [showEditPurchase, setShowEditPurchase] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  const [updateDeliveryTarget, setUpdateDeliveryTarget] = useState(null)
  const [showUpdateDelivery, setShowUpdateDelivery] = useState(false)
  const [arrivedCount, setArrivedCount] = useState('')
  const [arrivedWeight, setArrivedWeight] = useState('')
  const [arrivalNotes, setArrivalNotes] = useState('')
  const [isUpdateArrivalSubmitting, setIsUpdateArrivalSubmitting] = useState(false)

  // --- DATA FETCHING ---
  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ['sales', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          rpa_clients(rpa_name),
          purchases(
            total_cost, transport_cost, other_cost, 
            total_weight_kg, quantity, price_per_kg,
            farms(farm_name)
          ),
          deliveries(
            status,
            shrinkage_kg,
            arrived_weight_kg,
            initial_weight_kg,
            delivery_cost,
            vehicle_id,
            vehicle_plate,
            vehicle_type,
            driver_name,
            vehicles(brand)
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id
  })

  const { data: saleDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['sales', selectedSaleId],
    queryFn: async () => {
      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .select(`
          *,
          rpa_clients(rpa_name),
          purchases(
            total_cost, transport_cost, other_cost,
            quantity, avg_weight_kg, total_weight_kg,
            price_per_kg, transaction_date,
            farms(farm_name)
          ),
          deliveries(
            status, shrinkage_kg, arrived_weight_kg,
            initial_weight_kg, delivery_cost,
            vehicle_plate, vehicle_type, driver_name,
            arrival_time, departure_time, load_time,
            vehicles(brand)
          ),
          payments(amount, payment_date, payment_method)
        `)
        .eq('id', selectedSaleId)
        .eq('is_deleted', false)
        .single();
      
      if (saleErr) throw saleErr;
      return sale;
    },
    enabled: !!selectedSaleId
  });

  // --- OTHER HOOKS ---
  const { updateTiba } = useUpdateDelivery()




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
    if (isViewOnly) {
      toast.info('Kamu dalam mode View Only. Tidak bisa menghapus data.')
      return
    }
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
      queryClient.invalidateQueries({ queryKey: ['cashflow'] })
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

  const handleDeleteSale = async () => {
    if (!deleteTargetSale) return
    setIsDeletingSale(true)
    try {
      // 1. Soft delete Sale record
      const { error: saleError } = await supabase
        .from('sales')
        .update({ is_deleted: true })
        .eq('id', deleteTargetSale.id)
        .eq('tenant_id', tenant.id)
      if (saleError) throw saleError

      // 2. Soft delete associated Purchase record
      if (deleteTargetSale.purchase_id) {
        const { error: purchaseError } = await supabase
          .from('purchases')
          .update({ is_deleted: true })
          .eq('id', deleteTargetSale.purchase_id)
          .eq('tenant_id', tenant.id)
        if (purchaseError) throw purchaseError
      }

      // 3. Soft delete associated Deliveries
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .update({ is_deleted: true })
        .eq('sale_id', deleteTargetSale.id)
      if (deliveryError) throw deliveryError
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['sales', tenant.id] })
      queryClient.invalidateQueries({ queryKey: ['purchases', tenant.id] })
      queryClient.invalidateQueries({ queryKey: ['cashflow'] })
      queryClient.invalidateQueries({ queryKey: ['broker-stats', tenant.id] })

      const { toast } = await import('sonner')
      toast.success('🗑️ Transaksi penjualan & data terkait dihapus')
      
      setShowDeleteSaleDialog(false)
      setDeleteTargetSale(null)
      setShowAuditSheet(false)
      setSelectedSaleId(null)
    } catch (err) {
      console.error('Delete error:', err)
      const { toast } = await import('sonner')
      toast.error('Gagal menghapus secara menyeluruh: ' + err.message)
    } finally {
      setIsDeletingSale(false)
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
  const totalSalesVal = sales?.reduce((acc, s) => acc + (Number(s.total_revenue) || 0), 0) || 0
  const totalModalVal = sales?.reduce((acc, s) => acc + (Number(s.purchases?.total_cost) || 0), 0) || 0
  
  const netProfitVal = sales?.reduce((acc, s) => acc + calcNetProfit(s), 0) || 0

  return (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#06090F] min-h-screen pb-24"
    >
      {/* TopBar */}
      <header className="px-5 pt-8 pb-4 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 space-y-4">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="font-display text-2xl font-black text-white tracking-tight uppercase leading-none">Transaksi</h1>
                <p className="text-[10px] font-bold text-[#4B6478] uppercase mt-1 tracking-widest">{tenant?.business_name || 'BROKER OPS'}</p>
            </div>
            {canWrite && (
              <div className="flex items-center gap-2">
                  <Button 
                      onClick={() => setWizardOpen(true)}
                      className="h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                      <Plus size={14} className="mr-1" /> JUAL
                  </Button>
              </div>
            )}
        </div>

        {isViewOnly && (
          <div className="bg-[#0C1319] border border-white/8 rounded-xl px-4 py-2 flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#4B6478]" />
            <span className="text-[#4B6478] text-xs">
              Kamu dalam mode <strong className="text-[#94A3B8]">View Only</strong> — hanya bisa melihat data
            </span>
          </div>
        )}
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
          <p className={`font-display text-[13px] font-black tabular-nums ${netProfitVal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {netProfitVal >= 0 ? '+' : '−'}{formatIDR(Math.abs(netProfitVal))}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="semua" className="mt-4" onValueChange={setActiveTab}>
        <div className="px-5">
          <TabsList className="w-full bg-[#111C24] border border-white/5 h-12 p-1 rounded-2xl">
            <TabsTrigger
              value="semua"
              className="flex-1 rounded-xl font-black text-[10px] h-full uppercase tracking-widest data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400 text-[#4B6478]"
            >
              Semua
            </TabsTrigger>
            <TabsTrigger
              value="lunas"
              className="flex-1 rounded-xl font-black text-[10px] h-full uppercase tracking-widest data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400 text-[#4B6478]"
            >
              Lunas
            </TabsTrigger>
            <TabsTrigger
              value="belum_lunas"
              className="flex-1 rounded-xl font-black text-[10px] h-full uppercase tracking-widest data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400 text-[#4B6478]"
            >
              Belum Lunas
            </TabsTrigger>
            <TabsTrigger
              value="sebagian"
              className="flex-1 rounded-xl font-black text-[10px] h-full uppercase tracking-widest data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400 text-[#4B6478]"
            >
              Sebagian
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="px-5 mt-4 outline-none">
          <AnimatePresence mode="wait">
            {loadingSales ? (
              <LoadingList />
            ) : !sales?.filter(s => activeTab === 'semua' ? true : s.payment_status === activeTab).length ? (
              <EmptyState
                  icon={History}
                  title="Tidak ada transaksi"
                  description={activeTab === 'semua' ? "Catat transaksi pertamamu hari ini." : `Belum ada transaksi dengan status ${activeTab.replace('_', ' ')}.`}
              />
            ) : (
              <motion.div
                key={activeTab}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {sales
                  .filter(s => activeTab === 'semua' ? true : s.payment_status === activeTab)
                  .map(sale => (
                   <motion.div key={sale.id} variants={fadeUp}>
                      <UnifiedTransactionCard
                        sale={sale}
                        onOpenAuditSheet={(id) => {
                          setSelectedSaleId(id)
                          setShowAuditSheet(true)
                        }}
                      />
                   </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TransaksiWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />

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
              {/* ... (existing content logic in Transaksi.jsx) */}
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

      {/* Detail Audit Sheet */}
      <SaleAuditSheet
        isOpen={showAuditSheet}
        onOpenChange={(open) => {
          setShowAuditSheet(open)
          if (!open) setSelectedSaleId(null)
        }}
        saleId={selectedSaleId}
        data={saleDetail}
        isLoading={loadingDetail}
        onDelete={isOwner ? () => {
          setDeleteTargetSale(saleDetail)
          setShowDeleteSaleDialog(true)
        } : null}
      />

      {/* Delete Sale Confirmation */}
      <AlertDialog open={showDeleteSaleDialog} onOpenChange={(o) => { if (!o) { setShowDeleteSaleDialog(false); setDeleteTargetSale(null) } }}>
        <AlertDialogContent style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 16, maxWidth: 400 }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: 'Sora', fontSize: 17, fontWeight: 700, color: 'hsl(var(--foreground))' }}>
              Hapus Transaksi Penjualan?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', margin: '0 0 4px' }}>
                    {deleteTargetSale?.rpa_clients?.rpa_name || 'RPA'}
                  </p>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                    {deleteTargetSale?.quantity} ekor · {formatWeight(deleteTargetSale?.total_weight_kg)} · {formatDate(deleteTargetSale?.transaction_date)}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#F87171', margin: '6px 0 0', fontVariantNumeric: 'tabular-nums' }}>
                    Nilai: {formatIDR(deleteTargetSale?.total_revenue)}
                  </p>
                </div>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Tindakan ini akan menghapus data penjualan dan riwayat pembayarannya. Ini tidak dapat dibatalkan.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter style={{ gap: 8 }}>
            <AlertDialogCancel
              style={{ background: 'transparent', border: '1px solid hsl(var(--border))', borderRadius: 10, color: 'hsl(var(--foreground))', fontFamily: 'DM Sans', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => { setShowDeleteSaleDialog(false); setDeleteTargetSale(null) }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingSale}
              style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.30)', borderRadius: 10, color: '#F87171', fontFamily: 'DM Sans', fontWeight: 700, cursor: isDeletingSale ? 'not-allowed' : 'pointer', opacity: isDeletingSale ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={(e) => { e.preventDefault(); handleDeleteSale() }}
            >
              {isDeletingSale
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

function UnifiedTransactionCard({ sale, onOpenAuditSheet }) {
  const { profile } = useAuth()
  const isOwner = profile?.role === 'owner'
  // Calculations
  const totalRevenue = Number(sale.total_revenue || 0)
  const totalModal = Number(sale.purchases?.total_cost || 0)
  const deliveryCost = Number(sale.delivery_cost || 0)
  const remainingDebt = calcRemainingAmount(sale)
  
  // Bug Fix: Pass full sale object (including purchases & deliveries) to calcNetProfit
  const netProfit = calcNetProfit(sale)
  
  const delivery = sale.deliveries?.[0] || null
  const totalWeightJual = delivery?.status === 'arrived' || delivery?.status === 'completed' 
    ? safeNum(delivery?.arrived_weight_kg) 
    : safeNum(sale.total_weight_kg)

  const susutWeight = safeNum(delivery?.shrinkage_kg)
  const susutLoss = susutWeight * safeNum(sale.price_per_kg)
  
  const isLoss = netProfit < 0
  const isOnRoute = delivery?.status === 'on_route'
  
  const rpaName = sale.rpa_clients?.rpa_name || 'RPA Umum'
  const farmName = sale.purchases?.farms?.farm_name || 'Kandang'
  const initialRpa = rpaName.charAt(0).toUpperCase()

  return (
    <Card 
      onClick={() => onOpenAuditSheet(sale.id)}
      className={cn(
        "bg-[#111C24] rounded-[22px] overflow-hidden relative cursor-pointer hover:bg-white/[0.04] active:scale-[0.98] transition-all group",
        isLoss ? "border-[#F87171]" : "border-white/5"
      )}
    >
      <div className="p-5 space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center text-left">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-[34px] h-[34px] rounded-xl flex items-center justify-center font-black text-lg border-2",
              isLoss ? "bg-red-500/10 border-red-500/40 text-red-500" : "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
            )}>
              {initialRpa}
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#F1F5F9] leading-none uppercase tracking-tight flex items-center gap-2">
                <span>{farmName}</span>
                <ChevronRight size={14} className="text-[#4B6478]" />
                <span>{rpaName}</span>
              </h3>
              <p className="text-xs font-medium text-[#4B6478] mt-1.5 tabular-nums">
                {formatDate(sale.transaction_date)} {sale.due_date ? ` · Tempo: ${formatDate(sale.due_date)}` : ' · COD'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={cn(
              "rounded-full h-6 px-3 border-none font-black text-[10px] uppercase tracking-wider",
              sale.payment_status === 'lunas' ? 'bg-emerald-500/10 text-emerald-400' : 
              sale.payment_status === 'sebagian' ? 'bg-amber-500/10 text-amber-500' : 
              'bg-red-500/10 text-red-500'
            )}>
              {formatPaymentStatus(sale.payment_status)?.toUpperCase() ?? '-'}
            </Badge>
            {(() => {
              const badge = getDeliveryBadge(delivery)
              return (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '10px',
                  fontWeight: 900,
                  padding: '3px 12px',
                  borderRadius: '99px',
                  background: badge.bg,
                  border: `1px solid ${badge.border}`,
                  color: badge.color,
                  textTransform: 'uppercase'
                }}>
                   {badge.icon && <span className="opacity-70">{badge.icon}</span>}
                  {badge.label}
                </span>
              )
            })()}
          </div>
        </div>

        {/* MIDDLE - 3 COLUMNS */}
        <div className="grid grid-cols-[1fr_1fr_1.6fr] gap-4">
          {/* Kolom 1: PEMBELIAN */}
          <div className="space-y-2 text-left border-r border-white/8 pr-4">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Pembelian</p>
            <p className="font-display text-[22px] font-bold text-[#F1F5F9] tabular-nums leading-none">
              {(safeNum(sale.purchases?.total_weight_kg) / 1000).toFixed(2)} <span className="text-xs font-normal text-[#94A3B8] ml-0.5">ton</span>
            </p>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[#94A3B8]">
                {formatEkor(sale.purchases?.quantity)} · {formatIDRShort(sale.purchases?.price_per_kg)}/kg
              </p>
              {isOwner && <p className="text-[11px] font-medium text-[#4B6478]">Modal: {formatIDR(totalModal)}</p>}
            </div>
          </div>

          {/* Kolom 2: PENJUALAN */}
          <div className="space-y-2 text-left border-r border-white/8 pr-4">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Penjualan</p>
            <p className="font-display text-[22px] font-bold text-[#F1F5F9] tabular-nums leading-none">
              {(totalWeightJual / 1000).toFixed(2)} <span className="text-xs font-normal text-[#94A3B8] ml-0.5">ton</span>
            </p>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-[#94A3B8]">
                {formatEkor(sale.quantity)} · {formatIDRShort(sale.price_per_kg)}/kg
              </p>
              <p className="text-[11px] font-medium text-[#4B6478]">Pendapatan: {formatIDR(totalRevenue)}</p>
            </div>
          </div>

          {/* Kolom 3: PENGIRIMAN */}
          <div className="space-y-3 text-left">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Pengiriman</p>
            
            <div className="grid grid-cols-1 gap-y-3">
              {/* Row 1: Shrinkage Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] font-bold text-[#4B6478] leading-none uppercase tracking-wider">Susut berat</p>
                  {!isOnRoute && <span className="text-[10px] text-[#4B6478] font-medium leading-none">(sudah tercermin dalam pendapatan)</span>}
                </div>
                <p className={cn("text-[13px] font-black tabular-nums leading-none", isOnRoute ? "text-[#4B6478]" : "text-[#F59E0B]")}>
                  {isOnRoute ? "—" : `${formatWeight(susutWeight)}`}
                </p>
              </div>
              
              {/* Row 2 costs */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#4B6478] leading-none">Biaya kirim</p>
                <p className="text-[13px] font-semibold text-[#F1F5F9] tabular-nums leading-none">
                  {formatIDR(deliveryCost)}
                </p>
              </div>
              <div />

              {/* Separator */}
              <div className="col-span-2 border-t border-white/5 my-1" />

              {/* Row 3 Armada labels */}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[#4B6478] uppercase leading-none">Kendaraan</p>
                <div className="space-y-0.5">
                  <p className="text-[13px] font-semibold text-[#F1F5F9] leading-none uppercase truncate">
                    {delivery?.vehicle_plate || '—'}
                  </p>
                  <p className="text-[11px] font-medium text-[#94A3B8] leading-none uppercase truncate">
                    {delivery?.vehicles?.brand ?? (delivery?.vehicle_type ? (delivery.vehicle_type.charAt(0).toUpperCase() + delivery.vehicle_type.slice(1)) : '—')}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[#4B6478] uppercase leading-none">Sopir</p>
                <p className="text-[13px] font-semibold text-[#F1F5F9] leading-none truncate">
                  {delivery?.driver_name || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className={cn(
        "px-6 py-3 flex justify-between items-center",
        isLoss ? "bg-[#3d0f0f] border-t border-[#F87171]" : "bg-[#0C1319] border-t border-white/5"
      )}>
        <div className="text-left">
          {isLoss ? (
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold text-[#F87171] uppercase tracking-widest leading-none">RUGI</p>
              <p className="text-[18px] font-display font-bold text-[#F87171] tabular-nums leading-none mt-1">
                −{formatIDR(Math.abs(netProfit))}
              </p>
              <p className="text-xs text-[#f5a0a0] mt-1 italic leading-none font-medium">Harga jual lebih rendah dari modal</p>
            </div>
          ) : sale.payment_status === 'lunas' ? (
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-[#10B981] tracking-widest leading-none">TOTAL DIBAYAR</p>
              <p className="text-[18px] font-display font-bold text-[#10B981] leading-none mt-1 tabular-nums">
                {formatIDR(totalRevenue)}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-[#F87171] tracking-widest leading-none">SISA HUTANG</p>
              <p className="text-[18px] font-display font-bold text-[#F87171] tabular-nums leading-none mt-1">
                {formatIDR(remainingDebt)}
              </p>
            </div>
          )}
        </div>

        <div className="text-right">
          {isOwner && (
            <>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest leading-none",
                isLoss ? "text-[#F59E0B]" : "text-[#4B6478]"
              )}>
                {isOnRoute ? "EST. PROFIT" : isLoss ? "NET PROFIT" : "NET PROFIT"}
              </p>
              <p className={cn(
                "font-display font-bold tabular-nums leading-none mt-1.5 transition-colors text-[18px]",
                isOnRoute ? "text-[#94A3B8]" : isLoss ? "text-[#F87171]" : "text-[#10B981]"
              )}>
                {isOnRoute ? "~" : isLoss ? "−" : "+"}{formatIDR(Math.abs(netProfit))}
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

function SaleAuditSheet({ isOpen, onOpenChange, saleId, data, isLoading, onDelete }) {
  const queryClient = useQueryClient()
  const { tenant, profile } = useAuth()
  const isOwner = profile?.role === 'owner'
  const isViewOnly = profile?.role === 'view_only'
  const canWrite = profile?.role === 'owner' || profile?.role === 'staff'
  const { data: rpaClients } = useRPA()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    rpa_id: '',
    price_per_kg: '',
    payment_status: 'belum_lunas',
    due_date: '',
    transaction_date: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  // Sync editData when data changes or entering edit mode
  React.useEffect(() => {
    if (data && isEditing) {
      setEditData({
        rpa_id: data.rpa_id,
        price_per_kg: data.price_per_kg || 0,
        payment_status: data.payment_status || 'belum_lunas',
        due_date: data.due_date,
        transaction_date: data.transaction_date
      })
    }
  }, [data, isEditing])

  if (!saleId) return null

  const handleUpdateSale = async () => {
    setIsUpdating(true)
    try {
      const payload = {
        rpa_id: editData.rpa_id,
        price_per_kg: Number(editData.price_per_kg),
        payment_status: editData.payment_status,
        due_date: editData.due_date,
        transaction_date: editData.transaction_date
      }

      const { error } = await supabase
        .from('sales')
        .update(payload)
        .eq('id', saleId)
        .eq('tenant_id', tenant.id)

      if (error) throw error

      toast.success('Transaksi berhasil diperbarui')
      setIsEditing(false)
      
      queryClient.invalidateQueries({ queryKey: ['sales', tenant.id] })
      queryClient.invalidateQueries({ queryKey: ['sales', saleId] })
      queryClient.invalidateQueries({ queryKey: ['broker-stats', tenant.id] })
      queryClient.invalidateQueries({ queryKey: ['cashflow'] })
      
    } catch (err) {
      console.error('Update sale error:', err)
      toast.error('Gagal memperbarui transaksi')
    } finally {
      setIsUpdating(false)
    }
  }

  const delivery = data?.deliveries?.[0]
  const purchase = data?.purchases
  
  const totalRevenue = Number(data?.total_revenue || 0)
  const totalModal = Number(purchase?.total_cost || 0)
  const deliveryCost = Number(data?.delivery_cost || 0)
  
  const susutWeight = safeNum(delivery?.shrinkage_kg)
  const paramPricePerKg = isEditing ? Number(editData.price_per_kg || 0) : safeNum(data?.price_per_kg)
  const susutLoss = susutWeight * paramPricePerKg
  
  // Use calcNetProfit for consistency
  const profit = isEditing 
    ? (totalRevenue - totalModal - deliveryCost) // Simplified for edit preview if needed
    : calcNetProfit(data)

  const remainingAmount = isEditing
    ? (totalRevenue - Number(data?.paid_amount || 0))
    : calcRemainingAmount(data)

  const isOverdue = data?.due_date && new Date(data.due_date) < new Date() && data?.payment_status !== 'lunas'

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) setIsEditing(false)
      }}>
        <SheetContent side="right" className="bg-[#0C1319] border-white/10 w-full sm:max-w-[480px] p-0 flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-white/5 shrink-0 text-left">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">
                {isLoading ? <Skeleton className="h-8 w-40" /> : (
                  isEditing ? 'Edit Transaksi' : (data?.rpa_clients?.rpa_name || 'RPA Umum')
                )}
              </SheetTitle>
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest leading-none">
                  {isLoading ? <Skeleton className="h-4 w-24" /> : formatDate(isEditing ? editData.transaction_date : data?.transaction_date)}
                </div>
                {!isLoading && !isEditing && (
                  <Badge className={`rounded-full h-5 px-2 border-none font-black text-[8px] uppercase tracking-wider
                    ${data?.payment_status === 'lunas' ? 'bg-emerald-500/10 text-emerald-400' : 
                      data?.payment_status === 'sebagian' ? 'bg-amber-500/10 text-amber-500' : 
                      'bg-red-500/10 text-red-500'}`}
                  >
                    {formatPaymentStatus(data?.payment_status)?.toUpperCase() ?? '-'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <SheetDescription className="sr-only">Detail transaksi penjualan</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              {/* SECTION 1: RINGKASAN PROFIT */}
              <div className="space-y-3">
                <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-4 grid grid-cols-4 gap-2">
                  <div className="text-center space-y-1">
                    <p className="text-[8px] font-black text-[#4B6478] uppercase tracking-[0.15em]">Pendapatan</p>
                    <p className="font-display text-sm font-black text-white tabular-nums">{formatIDR(totalRevenue)}</p>
                  </div>
                  <div className="text-center space-y-1 border-l border-white/5">
                    <p className="text-[8px] font-black text-[#4B6478] uppercase tracking-[0.15em]">Modal (HPP)</p>
                    <p className="font-display text-sm font-black text-white tabular-nums">{formatIDR(purchase?.total_cost)}</p>
                  </div>
                  <div className="text-center space-y-1 border-l border-white/5">
                    <p className="text-[8px] font-black text-[#4B6478] uppercase tracking-[0.15em]">Biaya Kirim</p>
                    <p className="font-display text-sm font-black text-white tabular-nums">{formatIDR(data?.delivery_cost)}</p>
                  </div>
                  <div className="text-center space-y-1 border-l border-white/5">
                    <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.15em]">Susut Berat</p>
                    <p className="font-display text-sm font-black text-amber-500 tabular-nums">-{formatKg(susutWeight)}</p>
                    <p className="text-[7px] font-medium text-[#4B6478] leading-tight">Reflected in revenue</p>
                  </div>
                </div>

                {isOwner && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center h-16">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Net Profit</p>
                    <p className={`font-display text-2xl font-black ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'} tabular-nums`}>
                      {profit >= 0 ? '+' : ''}{formatIDR(profit)}
                    </p>
                  </div>
                )}

                {!isEditing && canWrite && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Edit Transaksi
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Data Penjualan</Label>
                    
                    <div className="space-y-2">
                       <Label className="text-[11px] font-bold text-[#4B6478] uppercase ml-1">RPA / Pembeli</Label>
                       <Select 
                         value={editData.rpa_id || ''} 
                         onValueChange={(val) => setEditData(p => ({ ...p, rpa_id: val }))}
                       >
                         <SelectTrigger className="h-12 bg-[#111C24] border-white/5 rounded-xl font-bold">
                           <SelectValue placeholder="Pilih RPA/Pembeli" />
                         </SelectTrigger>
                         <SelectContent className="bg-[#0C1319] border-white/10">
                           {rpaClients?.map(client => (
                             <SelectItem key={client.id} value={client.id} className="font-bold">
                               {client.rpa_name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold text-[#4B6478] uppercase ml-1">Harga Jual (Rp/kg)</Label>
                      <InputRupiah 
                        value={editData.price_per_kg}
                        onChange={(val) => setEditData(p => ({ ...p, price_per_kg: val }))}
                      />
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[11px] font-bold text-[#4B6478] uppercase ml-1">Status Bayar</Label>
                       <Select 
                         value={editData.payment_status || 'belum_lunas'} 
                         onValueChange={(val) => setEditData(p => ({ ...p, payment_status: val }))}
                       >
                         <SelectTrigger className="h-12 bg-[#111C24] border-white/5 rounded-xl font-bold uppercase">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="bg-[#0C1319] border-white/10 uppercase">
                           <SelectItem value="belum_lunas" className="font-bold">BELUM LUNAS</SelectItem>
                           <SelectItem value="sebagian" className="font-bold">SEBAGIAN</SelectItem>
                           <SelectItem value="lunas" className="font-bold text-emerald-400">LUNAS</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-[#4B6478] uppercase ml-1">Tanggal Jual</Label>
                        <DatePicker
                          value={editData.transaction_date ? new Date(editData.transaction_date) : null}
                          onChange={(date) => setEditData(p => ({ 
                            ...p, 
                            transaction_date: date ? date.toISOString().split('T')[0] : null 
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-[#4B6478] uppercase ml-1">Jatuh Tempo</Label>
                        <DatePicker
                          value={editData.due_date ? new Date(editData.due_date) : null}
                          onChange={(date) => setEditData(p => ({ 
                            ...p, 
                            due_date: date ? date.toISOString().split('T')[0] : null 
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3 italic text-[11px] text-amber-500/80 leading-relaxed">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>Data pembelian dan pengiriman sudah terkunci untuk menjaga integritas.</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* SECTION 2: DETAIL PEMBELIAN */}
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Pembelian</Label>
                    <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <DetailRow label="Kandang" value={data?.purchases?.farms?.farm_name} icon={<MapPin size={14} />} />
                      <DetailRow label="Jumlah" value={`${formatEkor(data?.purchases?.quantity)} · ${formatWeight(data?.purchases?.total_weight_kg)}`} icon={<Package size={14} />} />
                      <DetailRow label="Harga Beli" value={`${formatIDR(data?.purchases?.price_per_kg)}/kg`} icon={<TrendingDown size={14} />} />
                      <DetailRow label="Total Modal" value={formatIDR(data?.purchases?.total_cost)} highlight />
                      <DetailRow label="Tanggal Beli" value={formatDate(data?.purchases?.transaction_date)} icon={<Calendar size={14} />} />
                      {data?.purchases?.notes && (
                        <p className="text-[12px] text-[#4B6478] italic mt-2 leading-relaxed">"{data.purchases.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* SECTION 3: DETAIL PENJUALAN */}
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Penjualan</Label>
                    <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <DetailRow label="Pembeli" value={data?.rpa_clients?.rpa_name} icon={<User size={14} />} />
                      <DetailRow label="Harga Jual" value={`${formatIDR(data?.price_per_kg)}/kg`} icon={<TrendingUp size={14} />} />
                      <DetailRow label="Total Jual" value={formatIDR(totalRevenue)} highlight />
                      <DetailRow label="Tanggal Jual" value={formatDate(data?.transaction_date)} icon={<Calendar size={14} />} />
                    </div>
                  </div>

                  {/* SECTION 4: STATUS PEMBAYARAN */}
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Pembayaran</Label>
                    <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#4B6478]">Status</span>
                        <Badge className={`rounded-full h-5 px-2 border-none font-black text-[9px] uppercase tracking-wider
                          ${data?.payment_status === 'lunas' ? 'bg-emerald-500/10 text-emerald-400' : 
                            data?.payment_status === 'sebagian' ? 'bg-amber-500/10 text-amber-500' : 
                            'bg-red-500/10 text-red-500'}`}
                        >
                          {formatPaymentStatus(data?.payment_status)?.toUpperCase() ?? '-'}
                        </Badge>
                      </div>
                      <DetailRow label="Sudah Dibayar" value={formatIDR(data?.paid_amount)} icon={<CheckCircle2 size={14} className="text-emerald-500" />} />
                      <DetailRow 
                        label="Sisa Tagihan" 
                        value={remainingAmount > 0 ? formatIDR(remainingAmount) : "Lunas"} 
                        color={remainingAmount > 0 ? 'text-red-400' : 'text-emerald-400'} 
                      />
                      <DetailRow label="Jatuh Tempo" value={data?.due_date ? formatDate(data.due_date) : '-'} color={isOverdue ? 'text-amber-500' : 'text-[#4B6478]'} />
                      
                      {data?.payments?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                          <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Riwayat Bayar</p>
                          {data.payments.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px]">
                              <span className="text-[#4B6478]">{formatDate(p.payment_date)}</span>
                              <span className="font-bold text-white">{formatIDR(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 5: PENGIRIMAN */}
                  <div className="space-y-4 pb-12">
                    <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Pengiriman</Label>
                    {!data?.deliveries?.length ? (
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center">
                        <Truck size={24} className="mx-auto text-[#4B6478] mb-2 opacity-20" />
                        <p className="text-[12px] font-bold text-[#4B6478]">Belum Ada Pengiriman</p>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-[#4B6478]">Status</span>
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                            {data.deliveries[0].status.replace('_', ' ')}
                          </span>
                        </div>
                        <DetailRow 
                          label="Kendaraan" 
                          value={data.deliveries[0].vehicles?.vehicle_plate 
                            ? `${data.deliveries[0].vehicles.vehicle_plate}${data.deliveries[0].vehicles.brand ? ` · ${data.deliveries[0].vehicles.brand}` : ''}` 
                            : (data.deliveries[0].vehicle_plate || data.deliveries[0].vehicle_notes || '-')} 
                          icon={<Truck size={14} />} 
                        />
                        <DetailRow 
                          label="Sopir" 
                          value={data.deliveries[0].drivers?.full_name || data.deliveries[0].driver_name || data.deliveries[0].driver_notes || '-'} 
                          icon={<User size={14} />} 
                        />
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-[#4B6478] uppercase">Berat Awal</p>
                            <p className="text-xs font-bold text-[#F1F5F9]">{formatWeight(data.deliveries[0].initial_weight_kg)}</p>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-[9px] font-black text-[#4B6478] uppercase">Berat Tiba</p>
                            <p className="text-xs font-bold text-[#F1F5F9]">{formatWeight(data.deliveries[0].arrived_weight_kg)}</p>
                          </div>
                        </div>
                        <DetailRow 
                          label="Susut" 
                          value={data.deliveries[0].shrinkage_kg > 0 ? formatWeight(data.deliveries[0].shrinkage_kg) : "—"} 
                          color={data.deliveries[0].shrinkage_kg > 0 ? 'text-red-400' : 'text-[#4B6478]'} 
                        />
                        <DetailRow 
                          label="Susut Berat" 
                          value={data.deliveries[0].shrinkage_kg > 0 ? formatKg(data.deliveries[0].shrinkage_kg) : "—"} 
                          color={safeNum(data.deliveries[0].shrinkage_kg) > 0 ? 'text-amber-500' : 'text-[#4B6478]'} 
                        />
                        <DetailRow label="Biaya Kirim" value={formatIDR(data.delivery_cost)} icon={<ArrowRightLeft size={14} />} />
                        <DetailRow label="Tanggal Tiba" value={data.deliveries[0].arrived_at ? formatDate(data.deliveries[0].arrived_at) : (data.deliveries[0].arrival_time ? formatDate(data.deliveries[0].arrival_time) : '-')} icon={<Clock size={14} />} />
                        {data.deliveries[0].notes && (
                          <p className="text-[12px] text-[#4B6478] italic mt-2 leading-relaxed">"{data.deliveries[0].notes}"</p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-6 border-t border-white/5 bg-[#0C1319]/80 backdrop-blur-md space-y-3">
          {isEditing ? (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                className="h-12 border-white/10 bg-white/5 text-white font-black text-xs uppercase tracking-widest rounded-xl"
              >
                Batal
              </Button>
              <Button 
                onClick={handleUpdateSale}
                disabled={isUpdating}
                className="h-12 bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin mr-2" /> : 'Simpan'}
              </Button>
            </div>
          ) : (
            <>
              {data?.payment_status !== 'lunas' && !isLoading && (
                <Button 
                  onClick={() => setIsPaymentOpen(true)}
                  className="w-full h-12 bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/10"
                >
                  Catat Bayar
                </Button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => setIsEditing(true)}
                  variant="outline" className="h-12 border-white/10 bg-white/5 text-white font-black text-xs uppercase tracking-widest rounded-xl"
                >
                  <Pencil size={14} className="mr-2" /> Edit
                </Button>
                <Button 
                  onClick={onDelete}
                  className="h-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-black text-xs uppercase tracking-widest rounded-xl"
                >
                  <Trash2 size={14} className="mr-2" /> Hapus
                </Button>
              </div>
            </>
          )}
        </div>
        </SheetContent>
      </Sheet>

      {data && (
        <FormPaymentSheet 
          isOpen={isPaymentOpen} 
          onClose={() => setIsPaymentOpen(false)} 
          sale={data} 
        />
      )}
    </>
  )
}

function DetailRow({ label, value, icon, highlight, color = 'text-[#4B6478]' }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <div className="flex items-center gap-2 text-[#4B6478]">
        {icon && <span className="opacity-50">{icon}</span>}
        <span className="font-bold">{label}</span>
      </div>
      <span className={cn(
        "font-black text-white tabular-nums",
        highlight && "text-emerald-400 text-sm",
        color
      )}>
        {value || '—'}
      </span>
    </div>
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

function FormPaymentSheet({ isOpen, onClose, sale }) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('transfer')
  const [isLoading, setIsLoading] = useState(false)

  const totalRevenue = Number(sale?.total_revenue || 0)
  const remaining = totalRevenue - safeNum(sale?.paid_amount)
  
  React.useEffect(() => {
    if (isOpen) setAmount(remaining)
  }, [isOpen, remaining])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      return toast.error('Jumlah bayar tidak valid')
    }
    
    setIsLoading(true)
    try {
      const payAmount = Number(amount)
      const newPaid = safeNum(sale.paid_amount) + payAmount
      const total = totalRevenue
      
      let status = 'belum_lunas'
      if (newPaid >= total) status = 'lunas'
      else if (newPaid > 0) status = 'sebagian'

      const { error: err1 } = await supabase.from('payments').insert({
        tenant_id: tenant.id,
        sale_id: sale.id,
        amount: payAmount,
        payment_method: method,
        payment_date: new Date().toISOString().split('T')[0]
      })
      if (err1) throw err1

      const { error: err2 } = await supabase.from('sales').update({
        paid_amount: newPaid,
        payment_status: status
      }).eq('id', sale.id)
      if (err2) throw err2

      toast.success('Pembayaran berhasil dicatat')
      queryClient.invalidateQueries({ queryKey: ['sales', tenant.id] })
      queryClient.invalidateQueries({ queryKey: ['broker-stats'] })
      queryClient.invalidateQueries({ queryKey: ['cashflow'] })
      onClose()
    } catch (err) {
      toast.error('Gagal mencatat pembayaran')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="bg-[#0C1319] border-l border-white/8 w-full sm:max-w-[480px] p-8 overflow-y-auto z-[100]">
        <SheetHeader className="mb-8">
          <SheetTitle className="font-display text-2xl font-black text-white uppercase tracking-tight text-left">
            CATAT PEMBAYARAN
          </SheetTitle>
          <SheetDescription className="sr-only">Form Catat Pembayaran</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full">
          <div className="flex-1">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl mb-6 text-left">
              <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1">Total Tagihan</p>
              <p className="font-display text-2xl font-black text-white tabular-nums">{formatIDR(totalRevenue)}</p>
              <div className="flex justify-between mt-3 text-xs">
                <span className="text-[#4B6478] font-bold">Sisa Tagihan</span>
                <span className="font-black text-red-400 tabular-nums">{formatIDR(remaining)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <Label className="text-[11px] font-bold text-[#4B6478] uppercase ml-1">Jumlah Bayar *</Label>
                <InputRupiah 
                  value={amount}
                  onChange={setAmount}
                />
              </div>

              <div className="space-y-2 text-left">
                <Label className="text-[11px] font-bold text-[#4B6478] uppercase ml-1">Metode Bayar *</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="h-12 bg-[#111C24] border-white/5 rounded-xl font-bold uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0C1319] border-white/10 uppercase z-[110]">
                    <SelectItem value="transfer" className="font-bold cursor-pointer">Transfer Bank</SelectItem>
                    <SelectItem value="cash" className="font-bold cursor-pointer">Tunai (Cash)</SelectItem>
                    <SelectItem value="giro" className="font-bold cursor-pointer">Giro / Cek</SelectItem>
                    <SelectItem value="qris" className="font-bold cursor-pointer">QRIS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-auto">
            <Button 
              disabled={isLoading}
              className="w-full h-14 bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'KONFIRMASI PEMBAYARAN'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
