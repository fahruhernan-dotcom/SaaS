import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Phone, MapPin, ChevronRight, CheckCircle2, Building2, User, Star, Trash2 } from 'lucide-react'
import { useRPA } from '@/lib/hooks/useRPA'
import { useSales } from '@/lib/hooks/useSales'
import { 
  formatIDR, formatIDRShort, formatBuyerType, 
  BUYER_TYPE_LABELS, PAYMENT_TERMS_LABELS, formatPaymentTerms, 
  calcTotalJual, safeNum 
} from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import SlideModal from '@/dashboard/components/SlideModal'
import EmptyState from '@/components/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'

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

export default function RPA() {
  const { tenant } = useAuth()
  const { data: rpas, isLoading } = useRPA()
  const { data: allSales, isLoading: loadingSales } = useSales()
  const [search, setSearch] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [editingRPA, setEditingRPA] = useState(null)
  
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const rpaStats = useMemo(() => {
    if (!rpas || !allSales) return []
    return rpas.map(r => {
      const sales = allSales.filter(s => s.rpa_id === r.id)
      const outstanding = sales.reduce((acc, s) => {
        const totalJual = calcTotalJual(s, s.deliveries?.[0])
        return acc + (totalJual - safeNum(s.paid_amount))
      }, 0)
      return { ...r, calculated_outstanding: Math.max(0, outstanding) }
    })
  }, [rpas, allSales])

  const filteredRpas = useMemo(() => {
    return rpaStats
      .filter(r => r.rpa_name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.calculated_outstanding - a.calculated_outstanding)
  }, [rpaStats, search])

  const totalPiutang = rpaStats?.reduce((acc, r) => acc + r.calculated_outstanding, 0) || 0
  const activeCount = rpaStats?.filter(r => r.calculated_outstanding > 0).length || 0

  const handleEdit = (rpa, e) => {
    e.stopPropagation()
    setEditingRPA(rpa)
    setOpenModal(true)
  }

  return (
    <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#06090F] min-h-screen pb-24"
    >
      {/* TopBar */}
      <header className="px-5 pt-8 pb-4 border-b border-white/5 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 flex flex-col gap-1">
        <div className="flex justify-between items-center text-left">
            <div>
                <h1 className="font-display text-2xl font-black text-white tracking-tight leading-none uppercase">RPA & Piutang</h1>
                <p className="text-[11px] font-bold text-[#4B6478] uppercase mt-1">{rpas?.length || 0} pembeli terdaftar</p>
            </div>
            <Button 
                size="sm" 
                onClick={() => { setEditingRPA(null); setOpenModal(true); }}
                className="bg-[#10B981] hover:bg-[#0D9668] text-white font-black uppercase text-[10px] tracking-widest rounded-xl h-10 px-4 gap-2 border-none shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
            >
                <Plus size={16} />
                Tambah
            </Button>
        </div>
      </header>

      {/* Summary Card */}
      {totalPiutang > 0 && (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-5 mt-4 p-5 bg-red-400/[0.04] border border-red-400/10 rounded-3xl space-y-1 relative overflow-hidden"
        >
            <div className="relative z-10">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1 text-left">Total Piutang Aktif</p>
                <p className="font-display text-3xl font-black text-red-500 tracking-tighter text-left">{formatIDR(totalPiutang)}</p>
                <p className="text-[11px] font-black text-red-400/50 uppercase tracking-wider text-left">dari {activeCount} RPA</p>
            </div>
            <div className="absolute -right-4 -bottom-4 text-red-500/5 rotate-12">
                <Building2 size={80} />
            </div>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="mx-5 mt-4 relative group">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478] group-focus-within:text-emerald-400 transition-colors" />
        <Input 
            placeholder="Cari nama RPA..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#111C24] border-white/10 h-13 pl-12 rounded-2xl focus:border-emerald-500/50 transition-all font-bold text-white text-[15px]"
        />
      </div>

      {/* RPA List */}
      <div className="mt-6 px-5 space-y-3">
        {isLoading || loadingSales ? (
          <LoadingList />
        ) : filteredRpas.length === 0 ? (
          <EmptyState 
            icon={Building2} 
            title="Belum ada RPA" 
            description="Tambahkan pembeli pertamamu untuk mulai mencatat penjualan dan melacak piutang." 
            action={
                <Button 
                    className="bg-[#10B981] hover:bg-emerald-600 h-11 px-6 font-black uppercase tracking-widest text-[10px] rounded-xl border-none" 
                    onClick={() => setOpenModal(true)}
                >
                    Tambah RPA Pertama
                </Button>
            }
          />
        ) : (
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredRpas.map((rpa) => (
              <motion.div key={rpa.id} variants={fadeUp}>
                <RPACard 
                    rpa={rpa} 
                    onClick={() => navigate(`/broker/rpa/${rpa.id}`)} 
                    onEdit={handleEdit}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Form Sheet */}
      <SlideModal 
        title={editingRPA ? "Edit RPA" : "Tambah RPA"} 
        isOpen={openModal} 
        onClose={() => setOpenModal(false)}
      >
        <RPAForm 
            rpa={editingRPA} 
            onClose={() => setOpenModal(false)} 
            tenantId={tenant?.id} 
            onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['rpa-clients', tenant?.id] })
                setOpenModal(false)
            }}
        />
      </SlideModal>
    </motion.div>
  )
}

const BuyerTypeBadge = ({ type }) => (
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
    {formatBuyerType(type)}
  </span>
)

function RPACard({ rpa, onClick, onEdit }) {
  return (
    <div
        onClick={onClick}
        className="bg-[#111C24] border border-white/5 rounded-3xl p-4 flex justify-between items-center cursor-pointer hover:border-white/10 transition-all shadow-sm group active:scale-[0.98]"
    >
        <div className="flex gap-4 items-center flex-1">
            <Avatar className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <AvatarFallback className="bg-transparent text-[#34D399] font-display font-black text-lg">
                    {rpa.rpa_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                    <h3 className="font-display font-black text-[#F1F5F9] text-base group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{rpa.rpa_name}</h3>
                    <BuyerTypeBadge type={rpa.buyer_type} />
                </div>
                <div className="flex items-center gap-3">
                    <a 
                        href={`tel:${rpa.phone}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-[#4B6478] hover:text-[#34D399] transition-colors"
                    >
                        <Phone size={10} /> {rpa.phone}
                    </a>
                    <span className="text-white/10">•</span>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4B6478]">
                        <MapPin size={10} /> {rpa.location || 'N/A'}
                    </div>
                </div>
            </div>
        </div>

        <div className="text-right flex items-center gap-1.5">
            <div className="space-y-0.5">
                {rpa.calculated_outstanding > 0 ? (
                    <>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none text-right">Piutang</p>
                        <p className="font-display font-black text-red-500 tabular-nums leading-none mt-1 text-right">{formatIDRShort(rpa.calculated_outstanding)}</p>
                    </>
                ) : (
                    <div className="flex items-center gap-1 text-[#34D399] font-black text-[11px] uppercase tracking-wider">
                        <CheckCircle2 size={13} strokeWidth={3} /> Lunas
                    </div>
                )}
            </div>
            <ChevronRight size={16} className="text-[#4B6478] group-hover:translate-x-1 transition-transform ml-1" />
        </div>
    </div>
  )
}

function RPAForm({ rpa, onClose, tenantId, onSuccess }) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState(rpa || {
        rpa_name: '',
        buyer_type: 'rpa',
        contact_person: '',
        phone: '',
        location: '',
        payment_terms: 'cash',
        credit_limit: 0,
        reliability_score: 5,
        notes: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            if (rpa) {
                const { error } = await supabase.from('rpa_clients').update(formData).eq('id', rpa.id)
                if (error) throw error
                toast.success('RPA diperbarui!')
            } else {
                const { error } = await supabase.from('rpa_clients').insert({ ...formData, tenant_id: tenantId })
                if (error) throw error
                toast.success('RPA ditambahkan!')
            }
            onSuccess()
        } catch (err) {
            toast.error('Error: ' + err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Hapus RPA ini? Semua data piutang akan tetap ada di riwayat transaksi.')) return
        setIsLoading(true)
        try {
            const { error } = await supabase.from('rpa_clients').update({ is_deleted: true }).eq('id', rpa.id)
            if (error) throw error
            toast.success('RPA dihapus')
            onSuccess()
        } catch (err) {
            toast.error('Error: ' + err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-12">
            <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Nama RPA / Pembeli *</Label>
                <Input 
                    required
                    value={formData.rpa_name} 
                    onChange={e => setFormData({...formData, rpa_name: e.target.value})}
                    className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Tipe Pembeli</Label>
                    <Select value={formData.buyer_type} onValueChange={val => setFormData({...formData, buyer_type: val})}>
                        <SelectTrigger className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111C24] border-white/10 text-white">
                            {Object.entries(BUYER_TYPE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value} className="text-xs font-black uppercase hover:bg-white/5">
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">No HP *</Label>
                    <Input 
                        required
                        type="tel"
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Lokasi / Alamat</Label>
                <Input 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Syarat Bayar</Label>
                    <Select value={formData.payment_terms} onValueChange={val => setFormData({...formData, payment_terms: val})}>
                        <SelectTrigger className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111C24] border-white/10 text-white">
                            {Object.entries(PAYMENT_TERMS_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value} className="text-xs font-black uppercase hover:bg-white/5">
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Reliabilitas</Label>
                    <div className="flex gap-2 h-12 items-center">
                        {[1,2,3,4,5].map(s => (
                            <Star 
                                key={s} 
                                size={20} 
                                className={`cursor-pointer transition-all ${s <= formData.reliability_score ? 'fill-amber-400 text-amber-400' : 'text-[#4B6478]'}`}
                                onClick={() => setFormData({...formData, reliability_score: s})}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Catatan</Label>
                <Textarea 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="bg-[#111C24] border-white/10 rounded-xl min-h-[80px]"
                />
            </div>

            <div className="flex gap-3 pt-4">
                {rpa && (
                    <Button 
                        type="button"
                        onClick={handleDelete}
                        variant="ghost"
                        className="w-14 h-14 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500/10"
                    >
                        <Trash2 size={24} />
                    </Button>
                )}
                <Button 
                    type="submit" 
                    className="flex-1 h-14 rounded-2xl bg-[#10B981] hover:bg-[#0D9668] text-base font-black border-none shadow-lg uppercase tracking-widest text-xs"
                    disabled={isLoading}
                >
                    {isLoading ? 'Menyimpan...' : (rpa ? 'Simpan Perubahan' : 'Tambah RPA Baru')}
                </Button>
            </div>
        </form>
    )
}

function LoadingList() {
  return (
    <div className="space-y-3">
        <Skeleton className="h-[48px] w-full rounded-2xl bg-secondary/10 mb-6" />
        <Skeleton className="h-[80px] w-full rounded-3xl bg-white/10" />
        <Skeleton className="h-[80px] w-full rounded-3xl bg-secondary/10" />
        <Skeleton className="h-[80px] w-full rounded-3xl bg-secondary/10" />
    </div>
  )
}

