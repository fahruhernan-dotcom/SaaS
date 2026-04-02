import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useRPA } from '@/lib/hooks/useRPA'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  AlertTriangle, Smartphone, CheckCircle, Calendar, 
  MapPin, Package, TrendingDown, TrendingUp, User, 
  CheckCircle2, Truck, ArrowRightLeft, Clock, Pencil, 
  Trash2, AlertCircle, Loader2, Printer, Receipt
} from 'lucide-react'
import { 
  formatDate, formatIDR, formatKg, formatEkor, 
  formatWeight, formatPaymentStatus, safeNum, 
  calcNetProfit, calcRemainingAmount 
} from '@/lib/format'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { FormBayarModal } from '@/dashboard/_shared/components/forms/FormBayarModal'
import TransaksiSuccessCard from '@/components/ui/TransaksiSuccessCard'
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal'

export function DetailRow({ label, value, icon, highlight, color = 'text-[#4B6478]' }) {
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

export function SaleAuditSheet({ isOpen, onOpenChange, saleId, data, isLoading, onFinalize, onDelete }) {
  const queryClient = useQueryClient()
  const { tenant, profile } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isOwner = profile?.role === 'owner'
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
  const [invoiceModal, setInvoiceModal] = useState({ open: false, type: null })

  // Sync editData when data changes or entering edit mode
  useEffect(() => {
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

  const handleSheetOpenChange = (open) => {
    onOpenChange(open)
    if (!open) setIsEditing(false)
  }

  if (!saleId) return null

  const handleUpdateSale = async () => {
    setIsUpdating(true)
    try {
      const payload = {
        rpa_id: editData.rpa_id,
        price_per_kg: Number(editData.price_per_kg),
        total_revenue: Number(data.total_weight_kg || 0) * Number(editData.price_per_kg),
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

  const handleSendWA = (sale) => {
    // Basic implementation of WA sender
    const phone = sale?.rpa_clients?.phone || ''
    if (!phone) return toast.error('Nomor WA pembeli tidak tersedia')
    
    let text = `Halo *${sale.rpa_clients.rpa_name}*, berikut update transaksi ayam Anda:\n\n`
    text += `Tanggal: ${formatDate(sale.transaction_date)}\n`
    text += `Berat: ${formatWeight(sale.deliveries?.[0]?.arrived_weight_kg || 0)}\n`
    text += `Total: *${formatIDR(sale.total_revenue)}*\n`
    text += `Status: ${formatPaymentStatus(sale.payment_status).toUpperCase()}\n\n`
    text += `Terima kasih.`
    
    window.open(`https://wa.me/${phone.replace(/^0/, '62')}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleFinalizeSale = async (sale) => {
    if (!confirm('Tandai transaksi ini sebagai Selesai?')) return
    
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('sale_id', sale.id)

      if (error) throw error
      toast.success('Transaksi selesai')
      queryClient.invalidateQueries({ queryKey: ['sales', tenant?.id] })
    } catch (err) {
      toast.error('Gagal menyelesaikan transaksi')
    }
  }

  const delivery = data?.deliveries?.[0]
  const purchase = data?.purchases
  
  const totalRevenue = Number(data?.total_revenue || 0)
  const totalModal = Number(purchase?.total_cost || 0)
  const deliveryCost = Number(data?.delivery_cost || 0)
  
  const susutWeight = safeNum(delivery?.shrinkage_kg)
  const paramPricePerKg = isEditing ? Number(editData.price_per_kg || 0) : safeNum(data?.price_per_kg)
  const shrinkagePercent = delivery?.initial_weight_kg > 0 
    ? (safeNum(delivery.shrinkage_kg) / delivery.initial_weight_kg) * 100 
    : 0
  
  const profit = isEditing 
    ? (totalRevenue - totalModal - deliveryCost)
    : calcNetProfit(data)

  const remainingAmount = isEditing
    ? (totalRevenue - Number(data?.paid_amount || 0))
    : calcRemainingAmount(data)

  const isOverdue = data?.due_date && new Date(data.due_date) < new Date() && data?.payment_status !== 'lunas'

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="bg-[#0C1319] border-white/10 w-full sm:max-w-[480px] p-0 flex flex-col pt-0">
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
                    <Badge className={`rounded-full h-5 px-2 border-none font-black uppercase tracking-wider
                      ${isDesktop ? "text-[8px]" : "text-[10px]"}
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
                {!isEditing && delivery?.status === 'arrived' && shrinkagePercent >= 6 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 animate-pulse mb-6">
                    <AlertTriangle className="text-red-500 shrink-0" size={20} />
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-red-500 uppercase tracking-widest">Peringatan Susut Tinggi!</p>
                      <p className="text-[10px] font-bold text-red-400/80 uppercase leading-relaxed">
                        Susut mencapai {shrinkagePercent.toFixed(1)}%. Mohon cek ulang timbangan buyer atau tanyakan ke sopir sebelum menyelesaikan.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-2">
                    <div className="text-center space-y-1">
                      <p className={cn("font-black text-[#4B6478] uppercase tracking-[0.15em]", isDesktop ? "text-[8px]" : "text-[11px]")}>Pendapatan</p>
                      <p className="font-display text-sm font-black text-white tabular-nums">{formatIDR(totalRevenue)}</p>
                    </div>
                    <div className="text-center space-y-1 border-l border-white/5">
                      <p className={cn("font-black text-[#4B6478] uppercase tracking-[0.15em]", isDesktop ? "text-[8px]" : "text-[11px]")}>Modal (HPP)</p>
                      <p className="font-display text-sm font-black text-white tabular-nums">{formatIDR(purchase?.total_cost)}</p>
                    </div>
                    <div className="text-center space-y-1 border-l border-white/5">
                      <p className={cn("font-black text-[#4B6478] uppercase tracking-[0.15em]", isDesktop ? "text-[8px]" : "text-[11px]")}>Biaya Kirim</p>
                      <p className="font-display text-sm font-black text-white tabular-nums">{formatIDR(data?.delivery_cost)}</p>
                    </div>
                    <div className="text-center space-y-1 border-l border-white/5">
                      <p className={cn("font-black text-amber-500 uppercase tracking-[0.15em]", isDesktop ? "text-[8px]" : "text-[11px]")}>Susut Berat</p>
                      <p className="font-display text-sm font-black text-amber-500 tabular-nums">-{formatKg(susutWeight)}</p>
                      <p className={cn("font-medium text-[#4B6478] leading-tight", isDesktop ? "text-[7px]" : "text-[10px]")}>Reflected in revenue</p>
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center h-16">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Net Profit</p>
                    <p className={`font-display text-2xl font-black ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'} tabular-nums`}>
                      {profit >= 0 ? '+' : ''}{formatIDR(profit)}
                    </p>
                  </div>

                  {!isEditing && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleSendWA(data)}
                        className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        <Smartphone size={16} className="mr-2" /> Kirim WA
                      </Button>
                      {delivery?.status === 'arrived' && isOwner && (
                        <Button
                          onClick={() => handleFinalizeSale(data)}
                          className="flex-[1.5] h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.1em] rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} /> Selesaikan Transaksi
                        </Button>
                      )}
                      {canWrite && delivery?.status !== 'arrived' && (
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                          Edit Transaksi
                        </Button>
                      )}
                    </div>
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

                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3 italic text-[11px] text-amber-500/80 leading-relaxed text-left">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>Data pembelian dan pengiriman sudah terkunci untuk menjaga integritas.</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 text-left">
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

                    <div className="space-y-4 text-left">
                      <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Penjualan</Label>
                        <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-3">
                          <DetailRow label="Pembeli" value={data?.rpa_clients?.rpa_name} icon={<User size={14} />} />
                        </div>

                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-4 relative overflow-hidden group shadow-lg shadow-emerald-500/5">
                          {/* Pulsing Glow Effect */}
                          <motion.div 
                            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.02, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-emerald-500/10 pointer-events-none"
                          />
                          
                          <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-1">
                               <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Basis Perhitungan</p>
                                <motion.div 
                                  animate={{ scale: [1, 1.2, 1] }} 
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                />
                               </div>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                                  <CheckCircle size={18} className="text-emerald-400" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-[#4B6478] uppercase leading-none mb-1">Bobot Tiba</span>
                                  <span className="font-display text-2xl font-black text-white tabular-nums leading-none">
                                    {formatWeight(data?.deliveries?.[0]?.arrived_weight_kg)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <span className="text-[10px] font-bold text-[#4B6478] uppercase leading-none mb-1">Harga Jual</span>
                              <div className="bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                <p className="font-black text-white text-sm tabular-nums">{formatIDR(data?.price_per_kg)}/kg</p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-emerald-500/10 flex justify-between items-end relative z-10">
                             <div className="space-y-1">
                               <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Rumus Audit</p>
                               <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400/80 tabular-nums bg-emerald-400/5 px-2 py-1 rounded-lg border border-emerald-400/10">
                                  {data?.deliveries?.[0]?.arrived_weight_kg?.toLocaleString('id-ID')} kg × {formatIDR(data?.price_per_kg)}
                               </div>
                             </div>
                             <div className="text-right">
                               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Total Penjualan</p>
                               <p className="font-display text-2xl font-black text-emerald-400 tabular-nums leading-none drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">{formatIDR(totalRevenue)}</p>
                             </div>
                          </div>
                        </div>

                        <div className="space-y-3 px-4 pt-4">
                          <DetailRow label="Bobot Jual (Audit)" value={formatWeight(data?.total_weight_kg)} icon={<Package size={14} />} />
                          <DetailRow label="Tanggal Jual" value={formatDate(data?.transaction_date)} icon={<Calendar size={14} />} />
                        </div>
                    </div>

                    <div className="space-y-4 text-left">
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
                                <span className="font-bold text-white tabular-nums">{formatIDR(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 pb-12 text-left">
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
                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest text-right">
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
                          <div className="grid grid-cols-3 gap-3 mt-4 mb-4">
                            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#4B6478] mb-1">Muat</p>
                              <div className="flex items-center gap-1.5 text-white">
                                <Clock size={12} className="text-amber-500" />
                                <span className="text-[11px] font-black tabular-nums">
                                  {data.deliveries[0].load_time ? new Date(data.deliveries[0].load_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </span>
                              </div>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#4B6478] mb-1">Jalan</p>
                              <div className="flex items-center gap-1.5 text-white">
                                <Truck size={12} className="text-blue-500" />
                                <span className="text-[11px] font-black tabular-nums">
                                  {data.deliveries[0].departure_time ? new Date(data.deliveries[0].departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </span>
                              </div>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#4B6478] mb-1">Tiba</p>
                              <div className="flex items-center gap-1.5 text-white">
                                <MapPin size={12} className="text-emerald-500" />
                                <span className="text-[11px] font-black tabular-nums">
                                  {data.deliveries[0].arrival_time ? new Date(data.deliveries[0].arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-[#4B6478] uppercase">Berat Awal</p>
                              <p className="text-xs font-bold text-[#F1F5F9] tabular-nums">{formatWeight(data.deliveries[0].initial_weight_kg)}</p>
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-[9px] font-black text-[#4B6478] uppercase">Berat Tiba</p>
                              <p className="text-xs font-bold text-[#F1F5F9] tabular-nums">{formatWeight(data.deliveries[0].arrived_weight_kg)}</p>
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
                          <DetailRow label="Biaya Kirim" value={formatIDR(data.delivery_cost)} icon={<ArrowRightLeft size={14} />} highlight color="text-white" />
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

          <div className="p-6 border-t border-white/5 bg-[#0C1319]/80 backdrop-blur-md space-y-3 shrink-0">
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
                  className="h-12 bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin mr-2" /> : 'Simpan'}
                </Button>
              </div>
            ) : (
              <>
                {data?.payment_status !== 'lunas' && !isLoading && (
                  <Button 
                    onClick={() => setIsPaymentOpen(true)}
                    className="w-full h-12 bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20"
                  >
                    Catat Bayar
                  </Button>
                )}
                 {data?.deliveries?.[0]?.status === 'arrived' && canWrite && (
                  <Button 
                    onClick={() => onFinalize?.(data)}
                    className="w-full h-12 bg-purple-500 hover:bg-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-purple-500/20 mb-3"
                  >
                    <CheckCircle size={16} className="mr-2" /> Audit Selesai
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

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Button
                    onClick={() => setInvoiceModal({ open: true, type: 'sale' })}
                    variant="outline"
                    className="h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-semibold text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.06]"
                  >
                    <Printer size={14} className="mr-2" /> Invoice Jual
                  </Button>
                  <Button
                    onClick={() => setInvoiceModal({ open: true, type: 'purchase' })}
                    variant="outline"
                    className="h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-semibold text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.06]"
                  >
                    <Receipt size={14} className="mr-2" /> Surat Jalan
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* RENDER MODALS USED BY THIS SHEET */}
      {data && (
        <FormBayarModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          sale={data}
        />
      )}

      {data && (
        <InvoicePreviewModal
          type={invoiceModal.type}
          isOpen={invoiceModal.open}
          onClose={() => setInvoiceModal({ open: false, type: null })}
          data={{
            tenant: { business_name: tenant?.business_name, phone: tenant?.phone, location: tenant?.location },
            sale: data,
            rpa: data.rpa_clients,
            farm: data.purchases?.farms,
            delivery: data.deliveries?.[0],
            purchase: data.purchases,
            generatedBy: profile?.full_name || '',
            payments: data.payments || [],
          }}
        />
      )}


    </>
  )
}
