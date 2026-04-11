import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Phone, MapPin, Star, Building2, 
  ChevronRight, Calculator, CheckCircle2, 
  Calendar, Info, AlertCircle, Trash2, Edit,
  Wallet,
  Receipt,
  Smartphone,
  ChevronDown,
  Check
} from 'lucide-react'
import { formatEkor, formatKg } from '@/lib/format'
import { useRPA } from '@/lib/hooks/useRPA'
import { useSales } from '@/lib/hooks/useSales'
import { 
  formatIDR, formatDate, formatRelative, formatWeight, 
  formatBuyerType, formatPaymentTerms, formatPaymentStatus, safeNumber, safePercent, 
  formatIDRShort, safeNum, calcTotalJual, calcRemainingAmount
} from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { RPADetailSkeleton } from '@/components/ui/BrokerPageSkeleton'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { supabase } from '@/lib/supabase'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import EmptyState from '@/components/EmptyState'
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from 'lucide-react'
import { InputNumber } from '@/components/ui/InputNumber'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RPAForm } from './RPA'

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


export default function RPADetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { tenant, profile } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isOwner = profile?.role === 'owner' || profile?.role === 'superadmin'
  
  const _navigate = useNavigate()
  const brokerBase = getBrokerBasePath(tenant)
  const navigate = (path, options) => {
    if (typeof path === 'string' && path.startsWith('/broker')) {
      return _navigate(path.replace('/broker', brokerBase), options)
    }
    return _navigate(path, options)
  }

  // Queries
  const { data: rpa, isLoading: loadingRpa } = useQuery({
    queryKey: ['rpa-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rpa_clients')
        .select(`
          id,
          tenant_id,
          rpa_name,
          buyer_type,
          contact_person,
          phone,
          location,
          address,
          payment_terms,
          credit_limit,
          total_outstanding,
          avg_volume_per_order,
          preferred_chicken_size,
          preferred_chicken_type,
          last_deal_price,
          reliability_score,
          notes,
          is_deleted,
          created_at,
          updated_at
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('rpa-detail error:', error)
        throw error
      }
      return data
    },
    enabled: !!id
  })

  const { data: allSales, isLoading: loadingSales } = useSales()
  const rpaSales = useMemo(() => allSales?.filter(s => s.rpa_id === id) || [], [allSales, id])

  const [openModal, setOpenModal] = useState(null) // 'bayar' | 'edit'
  const [selectedSale, setSelectedSale] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteRPA, setShowDeleteRPA] = useState(false)
  const [showConfirmAllPaid, setShowConfirmAllPaid] = useState(false)

  if (!rpa && !loadingSales && !loadingRpa) return <EmptyState icon={AlertCircle} title="RPA Tidak Ditemukan" description="Data RPA yang Anda cari mungkin telah dihapus." action={<Button onClick={() => navigate('/broker/rpa')}>Kembali ke List</Button>} />

  const unpaidSales = useMemo(() => rpaSales.filter(s => calcRemainingAmount(s) > 0), [rpaSales])
  
  const totalOutstanding = useMemo(() => unpaidSales.reduce((acc, s) => acc + calcRemainingAmount(s), 0), [unpaidSales])

  const activeSalesCount = unpaidSales.length

  const canPay = (sale) => {
    if (!sale.deliveries || sale.deliveries.length === 0) return true
    const delivery = sale.deliveries[0]
    return delivery.status === 'completed'
  }

  const allDelivered = useMemo(() => unpaidSales.every(sale => canPay(sale)), [unpaidSales])

  const handleMarkAllPaid = async () => {
    if (!allDelivered) {
      toast.error('Ada transaksi yang pengirimannya belum selesai')
      return
    }
    setShowConfirmAllPaid(true)
  }

  const proceedMarkAllPaid = async () => {
    setShowConfirmAllPaid(false)
    try {
        for (const s of unpaidSales) {
            await supabase.from('payments').insert({
                tenant_id: tenant.id,
                sale_id: s.id,
                amount: calcRemainingAmount(s),
                payment_method: 'cash',
                notes: 'Pelunasan massal'
            })
        }

        queryClient.invalidateQueries({ queryKey: ['rpa-clients', tenant?.id] })
        queryClient.invalidateQueries({ queryKey: ['sales', tenant?.id] })
        toast.success('Semua transaksi berhasil dilunasi!')
    } catch (err) {
        toast.error('Gagal melunasi: ' + err.message)
    }
  }

  if ((loadingSales || loadingRpa) && !rpa) return <RPADetailSkeleton />

  return (
    <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#06090F] min-h-screen pb-24"
    >
      {/* TopBar */}
      <header className={cn("px-4 flex items-center justify-between sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 border-b border-white/5", isDesktop ? "pt-8 pb-4" : "h-14")}>
        <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-white active:scale-90 transition-transform">
                <ArrowLeft size={18} />
            </button>
            <div className="text-left">
                <h1 className={cn("font-display font-black text-white tracking-tight leading-none uppercase truncate max-w-[180px]", isDesktop ? "text-lg" : "text-[15px]")}>{rpa?.rpa_name}</h1>
                <p className="text-[10px] font-black text-[#4B6478] uppercase mt-0.5 tracking-widest">Detail Pembeli</p>
            </div>
        </div>
        {isOwner && (
          <button
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors active:scale-95"
              onClick={() => setShowEdit(true)}
          >
              <Edit size={16} />
          </button>
        )}
      </header>

      {/* Profile Card */}
      <div className="px-5 mt-4">
        <Card className="bg-[#111C24] border-white/5 rounded-[22px] p-5 space-y-5">
            <div className="flex gap-4 items-center">
                <Avatar className="w-16 h-16 rounded-[20px] bg-emerald-500/10 border border-emerald-500/20">
                    <AvatarFallback className="text-emerald-400 font-display font-black text-2xl bg-transparent">
                        {rpa?.rpa_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                        <h2 className="font-display font-black text-white text-xl tracking-tight leading-none uppercase">{rpa?.rpa_name}</h2>
                        <span style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '99px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.10)',
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            {formatBuyerType(rpa?.buyer_type)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-[#4B6478] uppercase tracking-wider">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span>{rpa?.reliability_score || 5}.0 Reliabilitas</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Syarat Bayar" value={formatPaymentTerms(rpa?.payment_terms) || 'Cash'} />
                <InfoItem label="Limit Kredit" value={formatIDRShort(safeNumber(rpa?.credit_limit))} />
                <InfoItem label="Lokasi" value={rpa?.location || 'N/A'} />
                <InfoItem label="Terdaftar Sejak" value={formatDate(rpa?.created_at)} />
            </div>

            <Button 
                asChild
                variant="outline"
                className="w-full h-12 rounded-xl border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 font-black text-xs uppercase tracking-widest gap-2"
            >
                <a href={`tel:${rpa?.phone}`}>
                    <Phone size={16} /> Hubungi {rpa?.rpa_name.split(' ')[0]}
                </a>
            </Button>
        </Card>
      </div>

      {/* Outstanding Card */}
      {totalOutstanding > 0 && (
          <div className="px-5 mt-4">
            <Card className="bg-red-400/[0.04] border-red-400/10 rounded-[22px] p-5 space-y-4">
                <div className="text-left">
                   <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Total Belum Dibayar</p>
                   <p className="font-display text-3xl font-black text-red-500 tracking-tight">{formatIDR(totalOutstanding)}</p>
                   <p className="text-[11px] font-black text-red-400/50 uppercase tracking-wider mt-1">{activeSalesCount} transaksi aktif</p>
                </div>
                <Button 
                    disabled={!allDelivered}
                    onClick={handleMarkAllPaid}
                    className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest border-none shadow-lg"
                    style={{ opacity: allDelivered ? 1 : 0.5 }}
                >
                    Tandai Semua Lunas
                </Button>
                {!allDelivered && (
                    <p style={{
                        fontSize:'12px', color:'#FBBF24',
                        textAlign:'center', marginTop:8,
                        display:'flex', alignItems:'center',
                        justifyContent:'center', gap:4
                    }}>
                        <AlertCircle size={12} />
                        Ada transaksi yang pengirimannya belum selesai
                    </p>
                )}
            </Card>
          </div>
      )}

      {/* Transactions List */}
      <div className="mt-8 px-5">
        <Tabs defaultValue="semua">
            <div className="flex justify-between items-end mb-4">
                <h3 className="font-display font-black text-white text-lg tracking-tight px-1 uppercase leading-none">Riwayat Jual</h3>
                <TabsList className="bg-[#111C24] border border-white/5 h-9 p-1 rounded-xl">
                    <TabsTrigger value="semua" className="text-[9px] font-black uppercase px-3 data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400">Semua</TabsTrigger>
                    <TabsTrigger value="unpaid" className="text-[9px] font-black uppercase px-3 data-[state=active]:bg-secondary/10 data-[state=active]:text-red-400">Piutang</TabsTrigger>
                    <TabsTrigger value="paid" className="text-[9px] font-black uppercase px-3 data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400">Lunas</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="semua" className="space-y-3 mt-0">
                <SaleList sales={rpaSales} rpa={rpa} canPayFunc={canPay} onPay={(s) => { setSelectedSale(s); setOpenModal('bayar'); }} />
            </TabsContent>
            <TabsContent value="unpaid" className="space-y-3 mt-0">
                <SaleList sales={rpaSales.filter(s => calcRemainingAmount(s) > 0)} rpa={rpa} canPayFunc={canPay} onPay={(s) => { setSelectedSale(s); setOpenModal('bayar'); }} />
            </TabsContent>
            <TabsContent value="paid" className="space-y-3 mt-0">
                <SaleList sales={rpaSales.filter(s => calcRemainingAmount(s) <= 0)} rpa={rpa} canPayFunc={canPay} />
            </TabsContent>
        </Tabs>
      </div>

      {/* Modal Catat Pembayaran */}
      <Sheet open={openModal === 'bayar'} onOpenChange={(open) => !open && setOpenModal(null)}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className={cn("bg-[#0C1319] border-white/8 overflow-y-auto", isDesktop ? "border-l w-full sm:max-w-[480px] p-8" : "border-t p-5 max-h-[88vh] rounded-t-[24px]")}
        >
          <SheetHeader className={cn("text-left", isDesktop ? "mb-8" : "mb-5")}>
            <SheetTitle className={cn("font-display font-black text-white uppercase tracking-tight text-left", isDesktop ? "text-2xl" : "text-xl")}>
              Catat Pembayaran
            </SheetTitle>
            <SheetDescription className="sr-only">Form Catat Pembayaran RPA</SheetDescription>
          </SheetHeader>

          {selectedSale && <FormPaymentModal sale={selectedSale} onClose={() => setOpenModal(null)} />}
        </SheetContent>
      </Sheet>

      {/* Edit RPA Sheet */}
      <Sheet open={showEdit} onOpenChange={setShowEdit}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className={cn("bg-[#0C1319] border-white/8 p-0 overflow-hidden flex flex-col", isDesktop ? "border-l w-full max-w-[480px]" : "border-t max-h-[92vh] rounded-t-[24px]")}
        >
          <SheetHeader className={cn("border-b border-white/5 flex-shrink-0", isDesktop ? "p-6 pb-4" : "p-4 pb-3")}>
            <SheetTitle className={cn("font-display font-black text-white uppercase tracking-tight", isDesktop ? "text-xl" : "text-[17px]")}>
              Edit RPA
            </SheetTitle>
            <SheetDescription className="sr-only">
              Edit data RPA pembeli
            </SheetDescription>
          </SheetHeader>

          {/* Form scroll area */}
          <div className={cn("flex-1 overflow-y-auto", isDesktop ? "p-6" : "p-4")}>
            <RPAForm
              rpa={rpa}
              isDesktop={isDesktop}
              onClose={() => setShowEdit(false)}
              onSubmit={async (data) => {
                const { error } = await supabase.from('rpa_clients').update(data).eq('id', id)
                if (error) throw error
                queryClient.invalidateQueries({ queryKey: ['rpa-detail', id] })
                queryClient.invalidateQueries({ queryKey: ['rpa-clients'] })
                toast.success('Data RPA diperbarui!')
                setShowEdit(false)
              }}
              onDelete={() => setShowDeleteRPA(true)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog
        open={showDeleteRPA}
        onOpenChange={setShowDeleteRPA}
      >
        <AlertDialogContent style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '16px',
          maxWidth: '380px'
        }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{fontFamily:'Sora'}}>
              Hapus RPA ini?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Data <strong>{rpa?.rpa_name}</strong> akan dihapus. Riwayat transaksi tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const { error } = await supabase.from('rpa_clients')
                  .update({ is_deleted: true })
                  .eq('id', id)
                
                if (error) return toast.error('Gagal menghapus: ' + error.message)
                
                toast.success('RPA dihapus')
                navigate('/broker/rpa')
              }}
              style={{
                background: 'rgba(248,113,113,0.15)',
                border: '1px solid rgba(248,113,113,0.30)',
                color: '#F87171'
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Mark All Paid */}
      <AlertDialog open={showConfirmAllPaid} onOpenChange={setShowConfirmAllPaid}>
        <AlertDialogContent className="bg-[#111C24] border-white/10 rounded-3xl max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-black text-white uppercase tracking-tight">Tandai Masal Lunas?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#4B6478] font-medium leading-relaxed">
              Kamu akan menandai <strong>{activeSalesCount} transaksi</strong> sebagai lunas sekaligus. Pastikan uang sudah diterima.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="bg-transparent border-white/5 text-[#4B6478] hover:bg-white/5 h-10 rounded-xl px-6">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={proceedMarkAllPaid} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] h-10 px-6 rounded-xl border-none">KONFIRMASI LUNAS</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

function InfoItem({ label, value }) {
    return (
        <div className="space-y-1 text-left">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest leading-none">{label}</p>
            <p className="text-[13px] font-black text-[#F1F5F9] leading-tight uppercase tracking-tight">{value}</p>
        </div>
    )
}

function SaleList({ sales, rpa, onPay, canPayFunc }) {
    const { tenant, profile } = useAuth()
    const queryClient = useQueryClient()
    const [invoiceModal, setInvoiceModal] = useState({ open: false, data: null, type: 'sale' })
    const [confirmFullPaid, setConfirmFullPaid] = useState({ open: false, sale: null })

    const handleConfirmFullPaid = async () => {
        const sale = confirmFullPaid.sale
        if (!sale) return
        
        try {
            const totalJual = calcTotalJual(sale, sale.deliveries?.[0])
            const { error } = await supabase.from('payments').insert({
                tenant_id: sale.tenant_id,
                sale_id: sale.id,
                amount: totalJual - safeNum(sale.paid_amount),
                payment_method: 'cash',
                notes: 'Pelunasan langsung'
            })
            if (error) throw error
            toast.success('Transaksi dilunasi!')
            queryClient.invalidateQueries({ queryKey: ['sales', tenant?.id] })
            queryClient.invalidateQueries({ queryKey: ['rpa-clients', tenant?.id] })
        } catch (err) {
            toast.error('Gagal melunasi')
        } finally {
            setConfirmFullPaid({ open: false, sale: null })
        }
    }

    if (sales.length === 0) return (
        <EmptyState 
            icon={Receipt}
            title="Tidak ada transaksi"
            description="Riwayat penjualan akan muncul di sini setelah Anda mencatat transaksi."
        />
    )

    const generateWAMessage = (sale, tenantInfo) => {
        if (!sale) return ''
        
        const rpaName = sale.rpa_clients?.rpa_name || rpa?.rpa_name || 'RPA'
        const farmName = sale.purchases?.farms?.farm_name || 'Kandang'
        const dateStr = formatDate(sale.transaction_date)
        const qty = formatEkor(sale.quantity)
        const weight = formatWeight(sale.total_weight_kg)
        const price = formatIDR(sale.price_per_kg)
        const total = formatIDR(calcTotalJual(sale, sale.deliveries?.[0]))
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
        const phone = sale.rpa_clients?.phone || rpa?.phone || ''
        const cleanPhone = phone.replace(/[^0-9]/g, '')
        const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone
        const message = generateWAMessage(sale, tenant)
        window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank')
    }

    return (
        <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
        >
            {sales.map(sale => (
                <motion.div key={sale.id} variants={fadeUp}>
                    <Card className="bg-[#111C24] border-white/5 rounded-[22px] p-4 space-y-4">
                        <div className="flex justify-between items-start text-left">
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-[#4B6478] uppercase tracking-wider">{formatDate(sale.transaction_date)}</p>
                                <p className="text-[13px] font-black text-[#F1F5F9] uppercase tracking-tight leading-tight">
                                    {sale.quantity} ekor · {formatWeight(sale.total_weight_kg)}  
                                    <span className="block text-[11px] text-[#4B6478] mt-0.5">dari {sale.purchases?.farms?.farm_name}</span>
                                </p>
                            </div>
                            <p className="font-display font-black text-[#F1F5F9] text-lg leading-none tabular-nums">{formatIDR(calcTotalJual(sale, sale.deliveries?.[0]))}</p>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                            <div className="flex items-center gap-2">
                                <Badge 
                                    className={cn(
                                        "rounded-full h-6 px-3 font-black text-[9px] uppercase tracking-wider border-none",
                                        sale.payment_status === 'lunas' ? 'bg-emerald-500/10 text-emerald-400' : 
                                        sale.payment_status === 'sebagian' ? 'bg-amber-500/10 text-amber-500' : 
                                        'animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                                    )}
                                    style={sale.payment_status === 'belum_lunas' || !sale.payment_status ? {
                                        backgroundColor: '#EF4444',
                                        color: '#FFFFFF',
                                        border: 'none'
                                    } : {}}
                                >
                                    {formatPaymentStatus(sale.payment_status)?.toUpperCase() || 'BELUM LUNAS'}
                                </Badge>
                                {(() => {
                                    const totalJual = calcTotalJual(sale, sale.deliveries?.[0])
                                    const remaining = totalJual - safeNum(sale.paid_amount)
                                    if (remaining > 0) {
                                        return (
                                            <div className="text-[11px] font-bold tabular-nums">
                                                <span className="text-[#4B6478]">Sisa: </span>
                                                <span className="text-red-500">{formatIDR(remaining)}</span>
                                            </div>
                                        )
                                    }
                                    return null
                                })()}
                            </div>

                            <div className="flex gap-2 items-center">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setInvoiceModal({ open: true, data: sale, type: 'sale' })}
                                    className="h-8 border-white/10 bg-white/[0.03] text-[#94A3B8] font-black text-[9px] uppercase tracking-widest rounded-lg px-3 hover:bg-white/[0.06]"
                                >
                                    <Receipt size={12} className="mr-1.5" /> Cetak
                                </Button>

                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleSendWA(sale)}
                                    className="h-8 border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-black text-[9px] uppercase tracking-widest rounded-lg px-3 hover:bg-emerald-500/10"
                                >
                                    <Smartphone size={12} className="mr-1.5" /> WA
                                </Button>

                                {sale.payment_status !== 'lunas' && (
                                    <div className="flex flex-col gap-2 items-end">
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                disabled={!canPayFunc(sale)}
                                                onClick={() => {
                                                    if (!canPayFunc(sale)) return
                                                    onPay(sale)
                                                }}
                                                className="h-8 bg-secondary/10 text-[10px] font-black rounded-lg hover:bg-secondary/20 uppercase tracking-widest px-3"
                                                style={{
                                                    opacity: canPayFunc(sale) ? 1 : 0.4,
                                                    cursor: canPayFunc(sale) ? 'pointer' : 'not-allowed'
                                                }}
                                            >
                                                Bayar
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                disabled={!canPayFunc(sale)}
                                                className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest px-3 border-none"
                                                style={{
                                                    opacity: canPayFunc(sale) ? 1 : 0.4,
                                                    cursor: canPayFunc(sale) ? 'pointer' : 'not-allowed'
                                                }}
                                                onClick={() => {
                                                    if (!canPayFunc(sale)) return
                                                    setConfirmFullPaid({ open: true, sale })
                                                }}
                                            >
                                                Lunas
                                            </Button>
                                        </div>
                                        {!canPayFunc(sale) && (
                                            <p style={{
                                                fontSize: '10px',
                                                color: '#FBBF24',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                fontWeight: 700,
                                                textTransform: 'uppercase'
                                            }}>
                                                <AlertCircle size={11} />
                                                Konfirmasi pengiriman dulu
                                            </p>
                                        )}
                                    </div>
                                )}

                            {invoiceModal.open && invoiceModal.data && (
                                <InvoicePreviewModal
                                    type={invoiceModal.type}
                                    isOpen={invoiceModal.open}
                                    onClose={() => setInvoiceModal({ open: false, data: null, type: 'sale' })}
                                    data={{
                                        tenant:      { business_name: tenant?.business_name, phone: tenant?.phone, location: tenant?.location },
                                        sale:        invoiceModal.data,
                                        rpa:         rpa,
                                        farm:        invoiceModal.data.purchases?.farms,
                                        delivery:    invoiceModal.data.deliveries?.[0],
                                        purchase:    invoiceModal.data.purchases,
                                        generatedBy: profile?.full_name || '',
                                        payments:    invoiceModal.data.payments || [],
                                    }}
                                />
                            )}
                        </div>
                    </div>
                        
                    <PaymentHistory saleId={sale.id} sale={sale} rpa={rpa} />
                    </Card>
                </motion.div>
            ))}

            {/* Custom Alert for Single Full Payment */}
            <AlertDialog open={confirmFullPaid.open} onOpenChange={(o) => !o && setConfirmFullPaid({open: false, sale: null})}>
                <AlertDialogContent className="bg-[#111C24] border-white/10 rounded-3xl max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display font-black text-white uppercase tracking-tight">Tandai Lunas Sepenuhnya?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#4B6478] font-medium leading-relaxed">
                            Akan mencatat pembayaran senilai <strong>{formatIDR(calcTotalJual(confirmFullPaid.sale, confirmFullPaid.sale?.deliveries?.[0]) - safeNum(confirmFullPaid.sale?.paid_amount))}</strong> via Cash.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-2">
                        <AlertDialogCancel className="bg-transparent border-white/5 text-[#4B6478] hover:bg-white/5 h-10 rounded-xl px-6">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmFullPaid} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] h-10 px-6 rounded-xl border-none">KONFIRMASI LUNAS</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    )
}

function PaymentHistory({ saleId, sale, rpa }) {
    const { tenant, profile } = useAuth()
    const [invoiceModal, setInvoiceModal] = useState({ open: false, payment: null })

    const { data: payments } = useQuery({
        queryKey: ['payments', saleId],
        queryFn: async () => {
            const { data } = await supabase.from('payments').select('id, amount, payment_method, payment_date, notes').eq('sale_id', saleId).order('payment_date', { ascending: false })
            return data || []
        }
    })

    if (!payments?.length) return null

    return (
        <div className="pt-3 border-t border-white/5 space-y-2">
            <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.1em] pl-1 text-left">Riwayat Cicilan</p>
            {payments.map(p => (
                <div key={p.id} className="flex justify-between items-center text-[11px] bg-secondary/5 px-2 py-1.5 rounded-xl gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[#4B6478] font-bold shrink-0">{formatDate(p.payment_date)}</span>
                        <Badge variant="outline" className="h-4 text-[8px] font-black border-white/5 text-[#4B6478] uppercase px-1.5 shrink-0">{p.payment_method}</Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[#F1F5F9] font-black tabular-nums">{formatIDR(p.amount)}</span>
                        <button
                            onClick={() => setInvoiceModal({ open: true, payment: p })}
                            className="text-[#4B6478] hover:text-emerald-400 transition-colors"
                            title="Cetak Kwitansi"
                        >
                            <Receipt size={13} />
                        </button>
                    </div>
                </div>
            ))}

            <InvoicePreviewModal
                type="payment_receipt"
                isOpen={invoiceModal.open}
                onClose={() => setInvoiceModal({ open: false, payment: null })}
                data={invoiceModal.payment ? {
                    tenant,
                    payment:     invoiceModal.payment,
                    sale,
                    rpa,
                    generatedBy: profile?.full_name,
                } : null}
            />
        </div>
    )
}

function FormPaymentModal({ sale, onClose }) {
    const [isLoading, setIsLoading] = useState(false)
    const currentRemaining = useMemo(() => {
        const totalJual = calcTotalJual(sale, sale.deliveries?.[0])
        return totalJual - safeNum(sale.paid_amount)
    }, [sale])
    
    const queryClient = useQueryClient()
    const { tenant } = useAuth()

    const paymentSchema = z.object({
        amount: z.coerce.number({ invalid_type_error: 'Nominal tidak valid' })
                 .min(1, 'Jumlah bayar minimal Rp 1')
                 .max(currentRemaining, `Maksimal pelunasan Rp ${currentRemaining.toLocaleString('id-ID')}`),
        method: z.string().default('transfer')
    })

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(paymentSchema),
        defaultValues: { amount: currentRemaining, method: 'transfer' }
    })

    const amount = watch('amount')
    const method = watch('method')
    const remaining = currentRemaining - safeNumber(amount)
    const isFull = safeNumber(amount) >= currentRemaining

    const onFormSubmit = async (data) => {
        setIsLoading(true)
        try {
            const { error } = await supabase.from('payments').insert({
                tenant_id: tenant.id,
                sale_id: sale.id,
                amount: safeNumber(data.amount),
                payment_method: data.method,
                payment_date: new Date().toISOString().split('T')[0]
            })
            if (error) throw error
            toast.success('Pembayaran dicatat!')
            queryClient.invalidateQueries({ queryKey: ['rpa-clients', tenant?.id] })
            queryClient.invalidateQueries({ queryKey: ['sales', tenant?.id] })
            queryClient.invalidateQueries({ queryKey: ['payments', sale.id] })
            onClose()
        } catch (err) {
            toast.error('❌ ' + err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 pb-12">
            <div className="text-center space-y-1">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Sisa Hutang</p>
                <p className="font-display text-3xl font-black text-red-500 tracking-tight tabular-nums">{formatIDR(currentRemaining)}</p>
            </div>

            <Separator className="bg-secondary/10" />

            <div className="space-y-2 text-left">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Jumlah Bayar (Rp)</Label>
                <div className="relative">
                    <InputRupiah
                        value={amount}
                        onChange={(val) => setValue('amount', val, { shouldValidate: true })}
                        placeholder="50.000.000"
                        className="bg-[#111C24] border-white/10 h-12 text-base font-black text-white rounded-xl"
                    />
                </div>
                {errors.amount && <p className="text-[10px] text-red-500 font-black uppercase mt-1 leading-tight">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2 text-left">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Metode Bayar</Label>
                <Select value={method} onValueChange={(val) => setValue('method', val)}>
                    <SelectTrigger className="bg-[#111C24] border-white/10 h-11 font-black rounded-xl uppercase tracking-widest text-xs px-4 focus:ring-emerald-500/20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111C24] border-white/10 text-white">
                        {['transfer', 'cash', 'giro', 'qris'].map(m => (
                            <SelectItem key={m} value={m} className="font-bold uppercase tracking-widest text-[10px] hover:bg-white/5">{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex justify-between items-center text-left">
                <div>
                   <p className="text-[9px] font-black text-[#4B6478] uppercase mb-0.5">Sisa Setelah Bayar</p>
                   <p className="font-black text-[#F1F5F9] tabular-nums">{formatIDR(currentRemaining - safeNumber(amount))}</p>
                </div>
                {isFull && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 font-black text-[9px] h-6 uppercase tracking-wider border-emerald-500/30 font-display">AKAN LUNAS ✓</Badge>
                )}
            </div>

            <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#10B981] hover:bg-[#0D9668] text-sm font-black border-none shadow-lg shadow-emerald-500/20 uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
                disabled={isLoading}
            >
                {isLoading ? 'Menyimpan...' : 'Konfirmasi Pembayaran'}
            </Button>
        </form>
    )
}

function LoadingState() {
    return (
        <div className="p-0 bg-[#06090F] min-h-screen">
            <div className="px-5 pt-10 flex items-center gap-4 mb-8">
                <Skeleton className="h-10 w-10 rounded-xl bg-secondary/10" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40 bg-secondary/10" />
                    <Skeleton className="h-3 w-24 bg-secondary/10" />
                </div>
            </div>
            <div className="px-5 mb-6">
                <Skeleton className="h-64 w-full rounded-[22px] bg-secondary/10" />
            </div>
            <div className="px-5 space-y-4">
                <div className="flex justify-between items-end mb-4">
                    <Skeleton className="h-6 w-32 bg-secondary/10" />
                    <Skeleton className="h-9 w-40 bg-secondary/10 rounded-xl" />
                </div>
                <Skeleton className="h-40 w-full rounded-[22px] bg-secondary/10" />
                <Skeleton className="h-40 w-full rounded-[22px] bg-secondary/10" />
            </div>
        </div>
    )
}

