import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, History, AlertCircle, Trash2, Loader2, Eye
} from 'lucide-react'
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal'
import { format, isSameDay, isSameWeek, isSameMonth, parseISO } from 'date-fns'
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
import { Skeleton } from '@/components/ui/skeleton'
import { TransaksiSkeleton } from '@/components/ui/BrokerPageSkeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import TransaksiWizard from '@/dashboard/_shared/components/TransaksiWizard'
import TransaksiSuccessCard from '@/components/ui/TransaksiSuccessCard'
import { FormBayarModal } from '@/dashboard/_shared/components/forms/FormBayarModal'
import { SaleAuditSheet } from './components/SaleAuditSheet'
import { EditPurchaseSheet } from './components/EditPurchaseSheet'
import { UpdateDeliverySheet } from './components/UpdateDeliverySheet'
import { UnifiedTransactionCard } from './components/UnifiedTransactionCard'
import { BrokerPageHeader } from '@/dashboard/_shared/components/transactions/BrokerPageHeader'
import { BrokerSummaryStrip } from '@/dashboard/_shared/components/transactions/BrokerSummaryStrip'
import { BrokerAuditNotice } from '@/dashboard/_shared/components/transactions/BrokerAuditNotice'
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
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}



export default function Transaksi() {
  const { tenant, profile } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  React.useEffect(() => {
    // Initial check (in case of direct deep link)
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'new') {
      setWizardOpen(true)
    }
  }, [])

  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'new') {
      setWizardOpen(true)
    }
  }, [location.search])
  
  const isOwner = profile?.role === 'owner'
  const isViewOnly = profile?.role === 'view_only'
  const canWrite = profile?.role === 'owner' || profile?.role === 'staff'

  // --- STATES ---
  const [activeTab, setActiveTab] = useState('semua')
  const [searchQuery, setSearchQuery] = useState('')

  // --- FINAL SUCCESS STATE ---
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [finalSuccessData, setFinalSuccessData] = useState(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isUpdating, setIsUpdating] = useState(false)
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

  const [timeFilter, setTimeFilter] = useState('keseluruhan') // 'hari_ini', 'minggu_ini', 'bulan_ini', 'keseluruhan'

  // --- DATA FETCHING ---
  const { data: sales = [], isLoading: isLoadingSales, refetch: refetchSales } = useQuery({
    queryKey: ['sales', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          rpa_clients ( rpa_name, phone ),
          purchases ( 
            *,
            farms ( farm_name, location ) 
          ),
          deliveries ( 
            *,
            vehicles ( brand, vehicle_plate ),
            drivers ( full_name )
          ),
          payments ( * )
        `)
        .eq('tenant_id', tenant?.id)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id
  })

  const pendingAuditCount = React.useMemo(() => {
    return sales.filter(s => s.deliveries?.[0]?.status === 'arrived').length
  }, [sales])

  const { data: saleDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['sales', selectedSaleId],
    queryFn: async () => {
      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .select(`
          *,
          rpa_clients(rpa_name, phone),
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
      toast.success('🗑️ Catatan pembelian dihapus')
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    } catch (err) {
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

      toast.success('🗑️ Transaksi penjualan & data terkait dihapus')
      
      setShowDeleteSaleDialog(false)
      setDeleteTargetSale(null)
      setShowAuditSheet(false)
      setSelectedSaleId(null)
    } catch (err) {
      console.error('Delete error:', err)
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

      toast.success('Pembelian berhasil diperbarui')
      setShowEditPurchase(false)
      setEditTarget(null)

    } catch (err) {
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

  const handleFinalizeSale = async (targetSale) => {
    if (!targetSale?.deliveries?.[0]?.id) return
    
    const delivery = targetSale.deliveries[0]
    setIsUpdating(true)
    
    try {
      // 1. Update delivery status to completed
      const { error } = await supabase
        .from('deliveries')
        .update({ status: 'completed' })
        .eq('id', delivery.id)
      
      if (error) throw error

      // 2. Prepare data for Success Card
      const sellData = targetSale
      const buyData = targetSale.purchases
      const profit = calcNetProfit(sellData)

      setFinalSuccessData({
        type: 'lengkap',
        farmName:        buyData?.farms?.farm_name || null,
        rpaName:         sellData?.rpa_clients?.rpa_name || null,
        rpaPhone:        sellData?.rpa_clients?.phone || null,
        quantity:        delivery.arrived_count || sellData.quantity || 0,
        totalWeight:     delivery.arrived_weight_kg || sellData.total_weight_kg || 0,
        buyPrice:        buyData?.total_cost || 0,
        sellPrice:       sellData?.total_revenue || 0,
        netProfit:       profit,
        transactionDate: sellData.transaction_date || null,
        tenant:          tenant,
      })

      setIsSuccessOpen(true)
      setShowAuditSheet(false)
      
      queryClient.invalidateQueries({ queryKey: ['sales', tenant.id] })
      queryClient.invalidateQueries({ queryKey: ['broker-stats', tenant.id] })
      toast.success('Transaksi berhasil diselesaikan & di-audit')
      
    } catch (err) {
      console.error('Finalize error:', err)
      toast.error('Gagal menyelesaikan transaksi: ' + err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  // Correct consolidated filtering logic
  const filteredSales = React.useMemo(() => {
    if (!sales) return []
    return sales.filter(s => {
      // 1. Status Filter (Tabs)
      const matchesStatus = activeTab === 'semua' ? true : s.payment_status === activeTab
      
      // 2. Search Filter
      let matchesSearch = true
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const rpaName = s.rpa_clients?.rpa_name?.toLowerCase() || ''
        const farmName = s.purchases?.farms?.farm_name?.toLowerCase() || ''
        const driver = s.deliveries?.[0]?.driver_name?.toLowerCase() || ''
        const plat = s.deliveries?.[0]?.vehicle_plate?.toLowerCase() || ''
        matchesSearch = rpaName.includes(q) || farmName.includes(q) || driver.includes(q) || plat.includes(q)
      }

      // 3. Time Filter
      let matchesTime = true
      if (timeFilter !== 'keseluruhan' && s.transaction_date) {
        const date = parseISO(s.transaction_date)
        const now = new Date()
        
        if (timeFilter === 'hari_ini') {
          matchesTime = isSameDay(date, now)
        } else if (timeFilter === 'minggu_ini') {
          matchesTime = isSameWeek(date, now, { weekStartsOn: 1 })
        } else if (timeFilter === 'bulan_ini') {
          matchesTime = isSameMonth(date, now)
        }
      }

      return matchesStatus && matchesSearch && matchesTime
    })
  }, [sales, activeTab, searchQuery, timeFilter])

  // Summary Logic based on Filtered Data
  const totalSalesVal = filteredSales?.reduce((acc, s) => acc + (Number(s.total_revenue) || 0), 0) || 0
  const totalModalVal = filteredSales?.reduce((acc, s) => acc + (Number(s.purchases?.total_cost) || 0), 0) || 0
  const netProfitVal = filteredSales?.reduce((acc, s) => acc + calcNetProfit(s), 0) || 0

  // --- WA MESSAGE GENERATOR ---
  const generateWAMessage = (sale, tenantInfo) => {
    if (!sale) return ''
    
    const rpaName = sale.rpa_clients?.rpa_name || 'RPA'
    const farmName = sale.purchases?.farms?.farm_name || 'Kandang'
    const dateStr = formatDate(sale.transaction_date)
    const qty = formatEkor(sale.quantity)
    const weight = formatKg(sale.total_weight_kg)
    const price = formatIDR(sale.price_per_kg)
    const total = formatIDR(sale.total_revenue)
    const status = formatPaymentStatus(sale.payment_status)?.toUpperCase() || 'PENDING'
    const remaining = calcRemainingAmount(sale)
    
    let msg = `*STRUK PENJUALAN - ${tenantInfo?.business_name || 'BROKER'}*\n`
    msg += `--------------------------------\n`
    msg += `*Kepada:* ${rpaName}\n`
    msg += `*Sumber:* ${farmName}\n`
    msg += `*Tanggal:* ${dateStr}\n`
    msg += `--------------------------------\n`
    msg += `*Rincian Barang:*\n`
    msg += `Qty: ${qty}\n`
    msg += `Berat: ${weight}\n`
    msg += `Harga: ${price}/kg\n`
    msg += `--------------------------------\n`
    msg += `*TOTAL TAGIHAN: ${total}*\n`
    msg += `*STATUS:* ${status}\n`
    
    if (remaining > 0) {
      msg += `*SISA PIUTANG: ${formatIDR(remaining)}*\n`
    }
    
    msg += `--------------------------------\n`
    msg += `_Terima kasih atas kerja samanya._\n`
    msg += `_Dikirim via TernakOS_`
    
    return encodeURIComponent(msg)
  }

  const handleSendWA = (sale) => {
    const phone = sale.rpa_clients?.phone || ''
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone
    const message = generateWAMessage(sale, tenant)
    window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank')
  }

  const handleWizardClose = React.useCallback(() => setWizardOpen(false), [])
  const handleWizardOpen = React.useCallback(() => setWizardOpen(true), [])

  const handleDeliveryClose = React.useCallback(() => setShowUpdateDelivery(false), [])

  const handleDeleteDialogChange = React.useCallback((o) => {
    if (!o) {
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    }
  }, [])

  const handleDeleteSaleDialogChange = React.useCallback((o) => {
    if (!o) {
      setShowDeleteSaleDialog(false)
      setDeleteTargetSale(null)
    }
  }, [])

  if (isLoadingSales) return <TransaksiSkeleton />

  return (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#06090F] min-h-screen pb-24"
    >
      {/* Header with Search & Filter */}
      <BrokerPageHeader
        title="Transaksi"
        subtitle={tenant?.business_name || 'BROKER OPS'}
        isDesktop={isDesktop}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari RPA, Kandang, Plat..."
        filters={[
          { id: 'hari_ini', label: 'Hari Ini' },
          { id: 'minggu_ini', label: 'Minggu Ini' },
          { id: 'bulan_ini', label: 'Bulan Ini' },
          { id: 'keseluruhan', label: 'Keseluruhan' }
        ]}
        activeFilter={timeFilter}
        onFilterChange={setTimeFilter}
        isViewOnly={isViewOnly}
        actionButton={canWrite && (
          <Button 
            onClick={handleWizardOpen}
            className="h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
          >
            <Plus size={14} className="mr-1" /> JUAL
          </Button>
        )}
      />

      {/* Summary Highlights */}
      <BrokerSummaryStrip
        isDesktop={isDesktop}
        items={[
          { label: 'Total Jual', value: totalSalesVal, isCurrency: true, color: 'emerald', alignment: 'left' },
          { label: 'Modal Produk', value: totalModalVal, isCurrency: true, alignment: 'center' },
          { label: 'Net Margin', value: netProfitVal, isCurrency: true, color: netProfitVal >= 0 ? 'emerald' : 'red', prefix: netProfitVal >= 0 ? '+' : '−', alignment: 'right' }
        ]}
      />

      {/* Pending Audits Banner */}
      <BrokerAuditNotice
        count={pendingAuditCount}
        message="transaksi timbangan tiba (audit)"
        isDesktop={isDesktop}
      />

      {/* Tabs */}
      <Tabs defaultValue="semua" className="mt-4" onValueChange={setActiveTab}>
        <div className="px-5">
          <TabsList className="w-full bg-[#111C24] border border-white/5 h-12 p-1 rounded-2xl">
            <TabsTrigger
              value="semua"
              className={cn("flex-1 rounded-xl font-black h-full uppercase tracking-widest data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400 text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}
            >
              Semua
            </TabsTrigger>
            <TabsTrigger
              value="lunas"
              className={cn("flex-1 rounded-xl font-black h-full uppercase tracking-widest data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400 text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}
            >
              Lunas
            </TabsTrigger>
            <TabsTrigger
              value="belum_lunas"
              className={cn("flex-1 rounded-xl font-black h-full uppercase tracking-widest data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400 text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}
            >
              Belum Lunas
            </TabsTrigger>
            <TabsTrigger
              value="sebagian"
              className={cn("flex-1 rounded-xl font-black h-full uppercase tracking-widest data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400 text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}
            >
              Sebagian
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="px-5 mt-4 outline-none">
          <AnimatePresence mode="wait">
            {isLoadingSales ? (
              <LoadingList />
            ) : !filteredSales.length ? (
              <EmptyState
                  icon={History}
                  title="Tidak ada transaksi"
                  description={activeTab === 'semua' ? "Catat transaksi pertamamu hari ini." : `Belum ada transaksi dengan filter ini.`}
              />
            ) : (
              <motion.div
                key={activeTab + timeFilter + searchQuery}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {filteredSales.map(sale => (
                   <motion.div key={sale.id} variants={fadeUp}>
                      <UnifiedTransactionCard
                        sale={sale}
                        onOpenAuditSheet={(id) => {
                          setSelectedSaleId(id)
                          setShowAuditSheet(true)
                        }}
                        isOwner={isOwner}
                        isDesktop={isDesktop}
                      />
                   </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TransaksiWizard isOpen={wizardOpen} onClose={handleWizardClose} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogChange}>
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

      <EditPurchaseSheet
        isOpen={showEditPurchase}
        onOpenChange={setShowEditPurchase}
        editTarget={editTarget}
        editForm={editForm}
        setEditForm={setEditForm}
        onSubmit={handleEditPurchase}
        isSubmitting={isEditSubmitting}
      />

      <UpdateDeliverySheet
        isOpen={showUpdateDelivery}
        onOpenChange={setShowUpdateDelivery}
        deliveryTarget={updateDeliveryTarget}
        arrivedCount={arrivedCount}
        setArrivedCount={setArrivedCount}
        arrivedWeight={arrivedWeight}
        setArrivedWeight={setArrivedWeight}
        arrivalNotes={arrivalNotes}
        setArrivalNotes={setArrivalNotes}
        onSubmit={handleCompleteDelivery}
        isSubmitting={isUpdateArrivalSubmitting}
      />

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
        onFinalize={handleFinalizeSale}
        onDelete={isOwner ? () => {
          setDeleteTargetSale(saleDetail)
          setShowDeleteSaleDialog(true)
        } : null}
      />

      {/* Delete Sale Confirmation */}
      <AlertDialog open={showDeleteSaleDialog} onOpenChange={handleDeleteSaleDialogChange}>
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
      <TransaksiSuccessCard
        isOpen={isSuccessOpen}
        onClose={() => {
          setIsSuccessOpen(false)
          setFinalSuccessData(null)
        }}
        data={finalSuccessData}
      />
    </motion.div>
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

