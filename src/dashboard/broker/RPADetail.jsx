import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Phone, MapPin, Star, Building2, 
  ChevronRight, Calculator, CheckCircle2, 
  Calendar, Info, AlertCircle, Trash2, Edit,
  Wallet,
  Receipt,
  ChevronDown,
  Check
} from 'lucide-react'
import { useRPA } from '@/lib/hooks/useRPA'
import { useSales } from '@/lib/hooks/useSales'
import { formatIDR, formatDate, formatRelative, formatWeight, formatBuyerType, formatPaymentTerms, safeNumber, safePercent, formatIDRShort } from '@/lib/format'
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
import { InputRupiah } from '@/components/ui/InputRupiah'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import SlideModal from '@/dashboard/components/SlideModal'
import EmptyState from '@/components/EmptyState'
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

function EditRPAForm({ rpa, onSuccess, onDelete }) {
  const { tenant } = useAuth()
  const tenantId = tenant?.id
  const queryClient = useQueryClient()
  
  const PAYMENT_OPTIONS = [
    { value: 'cash',  label: 'Cash' },
    { value: 'net3',  label: 'NET 3 Hari' },
    { value: 'net7',  label: 'NET 7 Hari' },
    { value: 'net14', label: 'NET 14 Hari' },
    { value: 'net30', label: 'NET 30 Hari' },
  ]

  const BUYER_TYPE_OPTIONS = [
    { value: 'rpa',            label: 'RPA (Rumah Potong Ayam)' },
    { value: 'pedagang_pasar', label: 'Pedagang Pasar' },
    { value: 'restoran',       label: 'Restoran' },
    { value: 'pengepul',       label: 'Pengepul' },
    { value: 'supermarket',    label: 'Supermarket' },
    { value: 'lainnya',        label: 'Lainnya' },
  ]

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rating, setRating] = useState(
    rpa?.reliability_score || 0
  )
  const [paymentTerm, setPaymentTerm] = useState(
    rpa?.payment_terms || 'cash'
  )
  const [buyerType, setBuyerType] = useState(
    rpa?.buyer_type || 'rpa'
  )
  const [openPayment, setOpenPayment] = useState(false)
  const [openBuyerType, setOpenBuyerType] = useState(false)
  
  const [formData, setFormData] = useState({
    rpa_name:              rpa?.rpa_name || '',
    contact_person:        rpa?.contact_person || '',
    phone:                 rpa?.phone || '',
    location:              rpa?.location || '',
    credit_limit:          rpa?.credit_limit || 0,
    preferred_chicken_size: rpa?.preferred_chicken_size || '',
    avg_volume_per_order:  rpa?.avg_volume_per_order || 0,
    notes:                 rpa?.notes || '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.rpa_name || !formData.phone) {
      toast.error('Nama RPA dan No HP wajib diisi')
      return
    }
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('rpa_clients')
        .update({
          rpa_name:              formData.rpa_name,
          buyer_type:            buyerType,
          contact_person:        formData.contact_person || null,
          phone:                 formData.phone,
          location:              formData.location || null,
          payment_terms:         paymentTerm,
          credit_limit:          Number(formData.credit_limit) || 0,
          preferred_chicken_size: formData.preferred_chicken_size || null,
          avg_volume_per_order:  Number(formData.avg_volume_per_order) || null,
          reliability_score:     rating || null,
          notes:                 formData.notes || null
        })
        .eq('id', rpa.id)
        .eq('tenant_id', tenantId)
      
      if (error) throw error
      onSuccess()
    } catch (err) {
      toast.error('Gagal: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper render custom dropdown
  const CustomDropdown = ({
    open, setOpen, value, options, onChange
  }) => {
    const current = options.find(o => o.value === value)
    return (
      <div style={{position:'relative'}}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{
            width:'100%', padding:'13px 14px',
            background:'hsl(var(--input))',
            border:'1px solid hsl(var(--border))',
            borderRadius:'10px',
            fontSize:'14px', fontWeight:500,
            color:'hsl(var(--foreground))',
            cursor:'pointer', height:'50px',
            display:'flex', justifyContent:'space-between',
            alignItems:'center'
          }}
        >
          <span>{current?.label}</span>
          <ChevronDown size={14}
            color="hsl(var(--muted-foreground))"
            style={{
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s'
            }}
          />
        </button>
        {open && (
          <>
            <div
              style={{position:'fixed',inset:0,zIndex:40}}
              onClick={() => setOpen(false)}
            />
            <div style={{
              position:'absolute', top:'calc(100% + 4px)',
              left:0, right:0, zIndex:50,
              background:'hsl(var(--popover))',
              border:'1px solid hsl(var(--border))',
              borderRadius:'10px', overflow:'hidden',
              boxShadow:'0 8px 24px rgba(0,0,0,0.4)'
            }}>
              {options.map((opt, i) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  style={{
                    width:'100%', padding:'11px 14px',
                    background: value === opt.value
                      ? 'rgba(16,185,129,0.10)' : 'transparent',
                    border:'none',
                    borderBottom: i < options.length - 1
                      ? '1px solid hsl(var(--border))' : 'none',
                    color: value === opt.value
                      ? '#34D399' : 'hsl(var(--foreground))',
                    fontSize:'14px',
                    fontWeight: value === opt.value ? 700 : 400,
                    cursor:'pointer', textAlign:'left',
                    display:'flex', justifyContent:'space-between',
                    alignItems:'center'
                  }}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && (
                    <Check size={13} color="#34D399" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <form id="edit-rpa-form" onSubmit={handleSubmit}
          style={{display:'flex', flexDirection:'column', gap:16}}>
      
      {/* Nama RPA */}
      <div>
        <label style={{fontSize:'11px',color:'#4B6478',
          textTransform:'uppercase',letterSpacing:'0.8px',
          display:'block',marginBottom:6}}>
          Nama RPA *
        </label>
        <Input value={formData.rpa_name}
          onChange={e => setFormData(p=>({
            ...p, rpa_name: e.target.value
          }))}
          style={{fontSize:'16px'}}
          placeholder="RPA Prima Jaya"
        />
      </div>
      
      {/* Tipe Buyer */}
      <div>
        <label style={{fontSize:'11px',color:'#4B6478',
          textTransform:'uppercase',letterSpacing:'0.8px',
          display:'block',marginBottom:6}}>
          Tipe Buyer
        </label>
        <CustomDropdown
          open={openBuyerType}
          setOpen={setOpenBuyerType}
          value={buyerType}
          options={BUYER_TYPE_OPTIONS}
          onChange={setBuyerType}
        />
      </div>
      
      {/* Contact Person + HP */}
      <div style={{display:'grid',
                   gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div>
          <label style={{fontSize:'11px',color:'#4B6478',
            textTransform:'uppercase',letterSpacing:'0.8px',
            display:'block',marginBottom:6}}>
            Contact Person
          </label>
          <Input value={formData.contact_person}
            onChange={e => setFormData(p=>({
              ...p, contact_person: e.target.value
            }))}
            style={{fontSize:'16px'}}
            placeholder="Pak Budi"
          />
        </div>
        <div>
          <label style={{fontSize:'11px',color:'#4B6478',
            textTransform:'uppercase',letterSpacing:'0.8px',
            display:'block',marginBottom:6}}>
            No HP *
          </label>
          <Input type="tel" value={formData.phone}
            onChange={e => setFormData(p=>({
              ...p, phone: e.target.value
            }))}
            style={{fontSize:'16px'}}
            placeholder="0812..."
          />
        </div>
      </div>
      
      {/* Lokasi */}
      <div>
        <label style={{fontSize:'11px',color:'#4B6478',
          textTransform:'uppercase',letterSpacing:'0.8px',
          display:'block',marginBottom:6}}>
          Lokasi
        </label>
        <Input value={formData.location}
          onChange={e => setFormData(p=>({
            ...p, location: e.target.value
          }))}
          style={{fontSize:'16px'}}
          placeholder="Boyolali, Jawa Tengah"
        />
      </div>
      
      {/* Syarat Bayar + Limit Kredit */}
      <div style={{display:'grid',
                   gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div>
          <label style={{fontSize:'11px',color:'#4B6478',
            textTransform:'uppercase',letterSpacing:'0.8px',
            display:'block',marginBottom:6}}>
            Syarat Bayar
          </label>
          <CustomDropdown
            open={openPayment}
            setOpen={setOpenPayment}
            value={paymentTerm}
            options={PAYMENT_OPTIONS}
            onChange={setPaymentTerm}
          />
        </div>
        <div>
          <label style={{fontSize:'11px',color:'#4B6478',
            textTransform:'uppercase',letterSpacing:'0.8px',
            display:'block',marginBottom:6}}>
            Limit Kredit
          </label>
          <InputRupiah
            value={formData.credit_limit}
            onChange={v => setFormData(p=>({
              ...p, credit_limit: v
            }))}
            placeholder="0"
          />
        </div>
      </div>
      
      {/* Rating Bintang */}
      <div>
        <label style={{fontSize:'11px',color:'#4B6478',
          textTransform:'uppercase',letterSpacing:'0.8px',
          display:'block',marginBottom:8}}>
          Rating Reliabilitas
        </label>
        <div style={{display:'flex',gap:6}}>
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(
                rating === star ? 0 : star
              )}
              style={{
                background:'none', border:'none',
                cursor:'pointer', padding:'2px',
                fontSize:'26px',
                color: star <= rating
                  ? '#F59E0B'
                  : 'rgba(255,255,255,0.15)',
                transition:'color 0.1s, transform 0.1s',
                transform: star <= rating
                  ? 'scale(1.1)' : 'scale(1)'
              }}
            >★</button>
          ))}
        </div>
        {rating > 0 && (
          <p style={{fontSize:'12px',color:'#F59E0B',
                     marginTop:4}}>
            {['','Sangat Buruk','Buruk','Cukup',
              'Baik','Sangat Baik'][rating]}
          </p>
        )}
      </div>
      
      {/* Catatan */}
      <div>
        <label style={{fontSize:'11px',color:'#4B6478',
          textTransform:'uppercase',letterSpacing:'0.8px',
          display:'block',marginBottom:6}}>
          Catatan
        </label>
        <Textarea
          value={formData.notes}
          onChange={e => setFormData(p=>({
            ...p, notes: e.target.value
          }))}
          placeholder="Catatan tambahan..."
          style={{fontSize:'16px', minHeight:'80px'}}
        />
      </div>
      
      {/* Submit */}
      <div style={{display:'flex', gap:10, marginTop:10}}>
        <Button
          type="submit"
          disabled={isSubmitting}
          style={{
            flex:1, height:'46px',
            background:'#10B981', border:'none',
            borderRadius:'10px', color:'white',
            fontFamily:'DM Sans', fontSize:'15px',
            fontWeight:700,
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting
            ? 'Menyimpan...'
            : 'Simpan Perubahan'}
        </Button>
        <Button
          type="button"
          onClick={onDelete}
          style={{
            width: '46px',
            height: '46px',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.20)',
            borderRadius: '10px',
            color: '#F87171',
            flexShrink: 0
          }}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </form>
  )
}

export default function RPADetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { tenant } = useAuth()

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

  if (!rpa && !loadingSales && !loadingRpa) return <EmptyState icon={AlertCircle} title="RPA Tidak Ditemukan" description="Data RPA yang Anda cari mungkin telah dihapus." action={<Button onClick={() => navigate('/broker/rpa')}>Kembali ke List</Button>} />

  const totalOutstanding = safeNumber(rpa?.total_outstanding)
  const activeSalesCount = rpaSales.filter(s => s.payment_status !== 'lunas').length

  const handleMarkAllPaid = async () => {
    if (!confirm(`Tandai semua (${activeSalesCount}) transaksi sebagai lunas?`)) return
    try {
        const unpaidSales = rpaSales.filter(s => s.payment_status !== 'lunas')
        for (const s of unpaidSales) {
            await supabase.from('payments').insert({
                tenant_id: tenant.id,
                sale_id: s.id,
                amount: s.remaining_amount,
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

  if ((loadingSales || loadingRpa) && !rpa) return <LoadingState />

  return (
    <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#06090F] min-h-screen pb-24"
    >
      {/* TopBar */}
      <header className="px-5 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 border-b border-white/5">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-white active:scale-90 transition-transform">
                <ArrowLeft size={20} />
            </button>
            <div className="text-left">
                <h1 className="font-display text-lg font-black text-white tracking-tight leading-none uppercase truncate max-w-[180px]">{rpa?.rpa_name}</h1>
                <p className="text-[10px] font-black text-[#4B6478] uppercase mt-1 tracking-widest">Detail Pembeli</p>
            </div>
        </div>
        <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-400 hover:text-white"
            onClick={() => setShowEdit(true)}
        >
            <Edit size={18} />
        </Button>
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
                    onClick={handleMarkAllPaid}
                    className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest border-none shadow-lg"
                >
                    Tandai Semua Lunas
                </Button>
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
                <SaleList sales={rpaSales} onPay={(s) => { setSelectedSale(s); setOpenModal('bayar'); }} />
            </TabsContent>
            <TabsContent value="unpaid" className="space-y-3 mt-0">
                <SaleList sales={rpaSales.filter(s => s.payment_status !== 'lunas')} onPay={(s) => { setSelectedSale(s); setOpenModal('bayar'); }} />
            </TabsContent>
            <TabsContent value="paid" className="space-y-3 mt-0">
                <SaleList sales={rpaSales.filter(s => s.payment_status === 'lunas')} />
            </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <SlideModal title="Catat Pembayaran" isOpen={openModal === 'bayar'} onClose={() => setOpenModal(null)}>
        {selectedSale && <FormPaymentModal sale={selectedSale} onClose={() => setOpenModal(null)} />}
      </SlideModal>

      {/* Edit RPA Sheet */}
      <Sheet open={showEdit} onOpenChange={setShowEdit}>
        <SheetContent
          side="right"
          style={{
            background: 'hsl(var(--card))',
            border: 'none',
            borderLeft: '1px solid hsl(var(--border))',
            width: '100%',
            maxWidth: '480px',
            padding: 0,
            overflow: 'hidden',
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
              Edit RPA
            </SheetTitle>
            <SheetDescription className="sr-only">
              Edit data RPA pembeli
            </SheetDescription>
          </SheetHeader>

          {/* Form scroll area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px'
          }}>
            <EditRPAForm
              rpa={rpa}
              onSuccess={() => {
                setShowEdit(false)
                queryClient.invalidateQueries({
                  queryKey: ['rpa-detail', id]
                })
                queryClient.invalidateQueries({
                  queryKey: ['rpa-clients']
                })
                toast.success('Data RPA diperbarui!')
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

function SaleList({ sales, onPay }) {
    const { tenant } = useAuth()
    const queryClient = useQueryClient()

    if (sales.length === 0) return (
        <EmptyState 
            icon={Receipt}
            title="Tidak ada transaksi"
            description="Riwayat penjualan akan muncul di sini setelah Anda mencatat transaksi."
        />
    )

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
                            <p className="font-display font-black text-[#F1F5F9] text-lg leading-none tabular-nums">{formatIDR(safeNumber(sale.net_revenue))}</p>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                            <div className="flex items-center gap-2">
                                <Badge className={`rounded-full h-6 px-3 border-none font-black text-[9px] uppercase tracking-wider
                                    ${sale.payment_status === 'lunas' ? 'bg-emerald-500/10 text-emerald-400' : 
                                    sale.payment_status === 'sebagian' ? 'bg-amber-500/10 text-amber-500' : 
                                    'bg-red-500/10 text-red-500'}`}
                                >
                                    {sale.payment_status?.toUpperCase() || 'BELUM LUNAS'}
                                </Badge>
                                {sale.remaining_amount > 0 && (
                                    <div className="text-[11px] font-bold tabular-nums">
                                        <span className="text-[#4B6478]">Sisa: </span>
                                        <span className="text-red-500">{formatIDR(sale.remaining_amount)}</span>
                                    </div>
                                )}
                            </div>

                            {sale.payment_status !== 'lunas' && (
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => onPay(sale)}
                                        className="h-8 bg-secondary/10 text-[10px] font-black rounded-lg hover:bg-secondary/20 uppercase tracking-widest px-3"
                                    >
                                        Bayar
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest px-3 border-none"
                                        onClick={async () => {
                                            if (!confirm('Tandai lunas sepenuhnya?')) return
                                            const { error } = await supabase.from('payments').insert({
                                                tenant_id: sale.tenant_id,
                                                sale_id: sale.id,
                                                amount: sale.remaining_amount,
                                                payment_method: 'cash',
                                                notes: 'Pelunasan langsung'
                                            })
                                            if (error) return toast.error('Gagal melunasi')
                                            toast.success('Transaksi dilunasi!')
                                            queryClient.invalidateQueries({ queryKey: ['sales', tenant?.id] })
                                            queryClient.invalidateQueries({ queryKey: ['rpa-clients', tenant?.id] })
                                        }}
                                    >
                                        Lunas
                                    </Button>
                                </div>
                            )}
                        </div>
                        
                        <PaymentHistory saleId={sale.id} />
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    )
}

function PaymentHistory({ saleId }) {
    const { data: payments } = useQuery({
        queryKey: ['payments', saleId],
        queryFn: async () => {
            const { data } = await supabase.from('payments').select('id, amount, payment_method, payment_date').eq('sale_id', saleId).order('payment_date', { ascending: false })
            return data || []
        }
    })

    if (!payments?.length) return null

    return (
        <div className="pt-3 border-t border-white/5 space-y-2">
            <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.1em] pl-1 text-left">Riwayat Cicilan</p>
            {payments.map(p => (
                <div key={p.id} className="flex justify-between items-center text-[11px] bg-secondary/5 p-2 rounded-xl">
                    <div className="flex items-center gap-2">
                        <span className="text-[#4B6478] font-bold">{formatDate(p.payment_date)}</span>
                        <Badge variant="outline" className="h-4 text-[8px] font-black border-white/5 text-[#4B6478] uppercase px-1.5">{p.payment_method}</Badge>
                    </div>
                    <span className="text-[#F1F5F9] font-black tabular-nums">{formatIDR(p.amount)}</span>
                </div>
            ))}
        </div>
    )
}

function FormPaymentModal({ sale, onClose }) {
    const [isLoading, setIsLoading] = useState(false)
    const [amount, setAmount] = useState(safeNumber(sale.remaining_amount))
    const [method, setMethod] = useState('transfer')
    const queryClient = useQueryClient()
    const { tenant } = useAuth()

    const remaining = safeNumber(sale.remaining_amount) - safeNumber(amount)
    const isFull = safeNumber(amount) >= safeNumber(sale.remaining_amount)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (safeNumber(amount) <= 0) return toast.error('Jumlah tidak valid')
        setIsLoading(true)
        try {
            const { error } = await supabase.from('payments').insert({
                tenant_id: tenant.id,
                sale_id: sale.id,
                amount: safeNumber(amount),
                payment_method: method,
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
        <form onSubmit={handleSubmit} className="space-y-6 pb-12">
            <div className="text-center space-y-1">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Sisa Hutang</p>
                <p className="font-display text-4xl font-black text-red-500 tracking-tight tabular-nums">{formatIDR(sale.remaining_amount)}</p>
            </div>

            <Separator className="bg-secondary/10" />

            <div className="space-y-2 text-left">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Jumlah Bayar (Rp)</Label>
                <div className="relative">
                    <InputRupiah 
                        value={amount}
                        onChange={setAmount}
                        placeholder="50.000.000"
                        className="bg-[#111C24] border-white/10 h-16 text-2xl font-black text-white rounded-2xl"
                    />
                </div>
            </div>

            <div className="space-y-2 text-left">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Metode Bayar</Label>
                <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl uppercase tracking-widest text-xs px-4">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111C24] border-white/10 text-white">
                        {['transfer', 'cash', 'giro', 'qris'].map(m => (
                            <SelectItem key={m} value={m} className="font-bold uppercase tracking-widest text-[10px]">{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex justify-between items-center text-left">
                <div>
                   <p className="text-[9px] font-black text-[#4B6478] uppercase mb-0.5">Sisa Setelah Bayar</p>
                   <p className="font-black text-[#F1F5F9] tabular-nums">{formatIDR(safeNumber(sale.remaining_amount) - safeNumber(amount))}</p>
                </div>
                {isFull && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 font-black text-[9px] h-6 uppercase tracking-wider border-emerald-500/30">AKAN LUNAS ✓</Badge>
                )}
            </div>

            <Button 
                type="submit" 
                className="w-full h-16 rounded-2xl bg-[#10B981] hover:bg-emerald-600 text-sm font-black border-none shadow-lg uppercase tracking-[0.2em]"
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

