import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, MapPin, ChevronRight, Warehouse, 
  Trash2, Edit, Star, Calendar, Info, AlertTriangle,
  Clock, CheckCircle2, History, Phone
} from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { useFarms } from '@/lib/hooks/useFarms'
import { formatIDR, formatDate, formatWeight, formatRelative, safeNumber, formatEkor } from '@/lib/format'
import { DatePicker } from '@/components/ui/DatePicker'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputNumber } from '@/components/ui/InputNumber'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, 
  SheetDescription, SheetFooter 
} from '@/components/ui/sheet'
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ConfirmDialog from '@/dashboard/_shared/components/ConfirmDialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import EmptyState from '@/components/EmptyState'

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

export default function Kandang() {
  const { tenant } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { data: farms, isLoading } = useFarms()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Semua') // 'Semua' | 'READY' | 'GROWING' | 'EMPTY'
  const [openModal, setOpenModal] = useState(false)
  const [editingFarm, setEditingFarm] = useState(null)
  
  const queryClient = useQueryClient()

  // Stats
  const totalEkor = farms?.reduce((acc, f) => acc + (f.available_stock || 0), 0) || 0
  const countReady = farms?.filter(f => f.status === 'ready').length || 0
  const countGrowing = farms?.filter(f => f.status === 'growing').length || 0
  const countEmpty = farms?.filter(f => f.status === 'empty').length || 0

  const filteredFarms = useMemo(() => {
    if (!farms) return []
    return farms.filter(f => {
      const matchSearch = f.farm_name.toLowerCase().includes(search.toLowerCase()) || 
                          f.owner_name.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'Semua' || f.status === filter.toLowerCase()
      return matchSearch && matchFilter
    })
  }, [farms, search, filter])

  const handleEdit = (farm, e) => {
    e.stopPropagation()
    setEditingFarm(farm)
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
        <div className="flex justify-between items-center">
            <div className="text-left">
                <h1 className="font-display text-2xl font-black text-white tracking-tight uppercase">Kandang</h1>
                <p className={cn("font-black text-[#4B6478] uppercase tracking-widest mt-1", isDesktop ? "text-[10px]" : "text-xs")}>{safeNumber(totalEkor).toLocaleString('id-ID')} ekor tersedia</p>
            </div>
            <Button 
                size="sm" 
                onClick={() => { setEditingFarm(null); setOpenModal(true); }}
                className="bg-[#10B981] hover:bg-emerald-600 text-white font-black rounded-xl h-10 px-5 gap-2 border-none shadow-[0_4px_20px_rgba(16,185,129,0.15)] active:scale-95 transition-transform uppercase text-xs tracking-widest"
            >
                <Plus size={16} strokeWidth={3} />
                Tambah
            </Button>
        </div>
      </header>

      {/* Summary Pills */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 px-5 py-4">
            <SummaryPill label="Total" value={`${farms?.length || 0} kandang`} color="bg-[#111C24] text-[#F1F5F9]" />
            <SummaryPill label="Siap Panen" value={countReady} color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" />
            <SummaryPill label="Tumbuh" value={countGrowing} color="bg-amber-500/10 text-amber-500 border-amber-500/20" />
            <SummaryPill label="Kosong" value={countEmpty} color="bg-white/[0.03] text-[#4B6478]" />
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>

      {/* Filter Chips */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {['Semua', 'Ready', 'Growing', 'Empty'].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                    "flex-shrink-0 px-5 py-2 rounded-full font-black uppercase tracking-widest transition-all border",
                    isDesktop ? "text-[10px]" : "text-xs",
                    (filter === t || (filter === 'Semua' && t === 'Semua')) 
                    ? 'bg-secondary/10 border-emerald-500/30 text-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.1)]' 
                    : 'bg-white/[0.03] border-white/5 text-[#4B6478] hover:border-white/10'
                )}
              >
                {t === 'Ready' ? 'Siap Panen' : t === 'Growing' ? 'Tumbuh' : t === 'Empty' ? 'Kosong' : t}
              </button>
          ))}
      </div>

      {/* List Kandang */}
      <div className="px-5 mt-2">
        <AnimatePresence mode="wait">
            {isLoading ? (
            <LoadingList />
            ) : filteredFarms.length === 0 ? (
            <EmptyState 
                icon={Warehouse} 
                title="Kandang Kosong" 
                description="Tambahkan kandang rekananmu untuk mulai memantau stok dan transaksi." 
                action={<Button className="bg-[#10B981] font-black h-12 px-6 rounded-2xl uppercase tracking-widest text-xs" onClick={() => setOpenModal(true)}>Tambah Kandang</Button>}
            />
            ) : (
                <motion.div 
                    key="farm-list"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                >
                    {filteredFarms.map((farm) => (
                        <motion.div key={farm.id} variants={fadeUp}>
                            <FarmCard 
                                farm={farm} 
                                onEdit={() => { setEditingFarm(farm); setOpenModal(true); }} 
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Farm Detail/Edit Sheet */}
      <FarmSheet 
        isOpen={openModal} 
        onClose={() => setOpenModal(false)}
        farm={editingFarm}
        tenantId={tenant?.id}
      />
    </motion.div>
  )
}

function SummaryPill({ label, value, color }) {
    return (
        <div className={`px-5 py-3 rounded-[22px] ${color} flex flex-col items-start gap-1 border border-white/5 min-w-[124px] text-left`}>
            <span className="text-xs font-black uppercase tracking-[0.15em] opacity-60 leading-none">{label}</span>
            <span className="text-base font-black tracking-tight leading-none tabular-nums">{value}</span>
        </div>
    )
}

function FarmCard({ farm, onEdit }) {
  const daysToHarvest = farm.harvest_date ? differenceInDays(new Date(farm.harvest_date), new Date()) : null
  
  return (
    <Card 
        onClick={onEdit}
        className="bg-[#111C24] border-white/5 rounded-[24px] p-5 space-y-4 hover:border-emerald-500/30 hover:ring-1 hover:ring-emerald-500/30 transition-all cursor-pointer relative group active:scale-[0.98] text-left"
    >
        <div className="flex justify-between items-start">
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h3 className="font-display font-black text-[#F1F5F9] text-[18px] lg:text-[18px] tracking-tight group-hover:text-emerald-400 transition-colors uppercase leading-none line-clamp-1">{farm.farm_name}</h3>
                </div>
                {farm.quality_rating > 0 && (
                    <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                            <Star key={s} size={11} className={`${s <= farm.quality_rating ? 'fill-amber-400 text-amber-400' : 'text-white/5'}`} />
                        ))}
                    </div>
                )}
            </div>
            <StatusBadge status={farm.status} />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-black text-[#4B6478] uppercase tracking-wider min-w-0">
            <span className="text-[#F1F5F9] whitespace-nowrap flex-shrink-0">{farm.owner_name}</span>
            <span className="text-white/10 flex-shrink-0">•</span>
            <div className="flex items-center gap-1 flex-1 min-w-0 text-xs">
                <MapPin size={11} strokeWidth={2.5} className="flex-shrink-0" /> 
                <span className="truncate">{farm.location || 'N/A'}</span>
            </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest leading-none">Stok Tersedia</p>
                <p className="font-display font-black text-[#F1F5F9] text-base leading-none tabular-nums mt-1">{safeNumber(farm.available_stock).toLocaleString('id-ID')} ekor</p>
            </div>
            <div className="space-y-1 text-right">
                <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest leading-none">Rata-rata Bobot</p>
                <p className="font-display font-black text-[#F1F5F9] text-base leading-none tabular-nums mt-1">{farm.avg_weight_kg ? formatWeight(farm.avg_weight_kg) : '-'}</p>
            </div>
        </div>

        <div className="flex justify-between items-center pt-1">
            {farm.harvest_date && (farm.status === 'growing' || farm.status === 'ready') ? (
                <HarvestPill days={daysToHarvest} date={farm.harvest_date} />
            ) : <div />}
        </div>
    </Card>
  )
}

function StatusBadge({ status, className }) {
    switch(status) {
        case 'ready': 
            return <Badge className={cn("bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-xs px-3 h-6 uppercase tracking-wider", className)}>SIAP PANEN</Badge>
        case 'growing':
            return <Badge className={cn("bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-xs px-3 h-6 uppercase tracking-wider", className)}>TUMBUH</Badge>
        default:
            return <Badge className={cn("bg-secondary/10 text-[#4B6478] border border-white/5 font-black text-xs px-3 h-6 uppercase tracking-wider", className)}>KOSONG</Badge>
    }
}

function HarvestPill({ days, date }) {
    if (days <= 0) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-black text-red-500 uppercase tracking-wide">
                <AlertTriangle size={12} strokeWidth={3} />
                TERLEWAT {Math.abs(days)} HARI
            </div>
        )
    }
    if (days <= 3) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-black text-emerald-400 animate-pulse uppercase tracking-wide">
                <Clock size={12} strokeWidth={3} />
                PANEN DALAM {days} HARI!
            </div>
        )
    }
    if (days <= 7) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-wide">
                <Clock size={12} strokeWidth={3} />
                {days} HARI LAGI
            </div>
        )
    }
    return (
        <div className="flex items-center gap-2 text-xs font-black text-[#4B6478] uppercase tracking-widest">
            <Calendar size={12} />
            {formatDate(date)}
        </div>
    )
}

// --- SHEET: FARM DETAIL & EDIT ---

function FarmSheet({ isOpen, onClose, farm, tenantId }) {
    const { profile } = useAuth()
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const isOwner = profile?.role === 'owner'
    const [mode, setMode] = useState('view')
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const queryClient = useQueryClient()

    const handleDelete = async () => {
        if (!farm) return
        try {
            const { error } = await supabase.from('farms').update({ is_deleted: true }).eq('id', farm.id)
            if (error) throw error
            toast.success('Kandang dihapus')
            queryClient.invalidateQueries(['farms'])
            onClose()
        } catch (err) {
            toast.error('❌ ' + err.message)
        } finally {
            setIsDeleteDialogOpen(false)
        }
    }

    // Reset mode to 'view' when opening for an existing farm, 'edit' for new
    React.useEffect(() => {
        if (isOpen) {
            setMode(farm ? 'view' : 'edit')
        }
    }, [isOpen, farm])

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="sm:max-w-md bg-[#0C1319] border-white/10 p-0 overflow-y-auto">
                {mode === 'view' ? (
                    <div className="flex flex-col h-full">
                        <div className="p-6 space-y-8 flex-1">
                            <SheetHeader className="text-left space-y-3">
                                <div className="space-y-1">
                                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight leading-none">
                                        {farm?.farm_name}
                                    </SheetTitle>
                                    <SheetDescription className="sr-only">Detail informasi kandang</SheetDescription>
                                </div>
                                <StatusBadge status={farm?.status} className="w-fit" />
                            </SheetHeader>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <DetailRow label="Nama Pemilik" value={farm?.owner_name} />
                                    <DetailRow 
                                        label="No. WhatsApp / HP" 
                                        value={
                                            <a href={`tel:${farm?.phone}`} className="text-emerald-400 hover:underline flex items-center gap-2">
                                                <Phone size={14} /> {farm?.phone}
                                            </a>
                                        } 
                                    />
                                    <DetailRow label="Lokasi" value={farm?.location} />
                                    <DetailRow label="Jenis Ayam" value={farm?.chicken_type} className="capitalize" />
                                    <DetailRow label="Status" value={farm?.status} className="uppercase" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Stok Ayam</p>
                                        <p className="text-white font-black text-lg">{formatEkor(farm?.available_stock)}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Rata-rata Bobot</p>
                                        <p className="text-white font-black text-lg">{farm?.avg_weight_kg ? `${farm.avg_weight_kg} kg` : '-'}</p>
                                    </div>
                                </div>

                                {farm?.notes && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Catatan</p>
                                        <p className="text-[#94A3B8] text-xs leading-relaxed">{farm.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <SheetFooter className="p-6 border-t border-white/5 flex-col gap-3">
                            <Button 
                                onClick={() => setMode('edit')}
                                variant="outline"
                                className="w-full h-14 border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 font-black text-xs uppercase tracking-widest rounded-2xl"
                            >
                                <Edit size={16} className="mr-2" /> Edit Kandang
                            </Button>
                            {/* Delete Button */}
            {isOwner && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="w-full h-12 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl font-bold uppercase tracking-widest text-[10px]"
              >
                <Trash2 size={16} className="mr-2" />
                Hapus Kandang
              </Button>
            )}
                        </SheetFooter>
                    </div>
                ) : (
                    <div className="p-6 space-y-8">
                        <SheetHeader className="text-left">
                            <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">
                                {farm ? 'Edit Kandang' : 'Tambah Kandang'}
                            </SheetTitle>
                            <SheetDescription className={cn("text-[#4B6478] font-bold uppercase tracking-widest mt-1", isDesktop ? "text-[10px]" : "text-[11px]")}>
                                {farm ? 'Sesuaikan data stok dan status' : 'Daftarkan kandang baru ke sistem'}
                            </SheetDescription>
                        </SheetHeader>

                        <FarmForm
                            farm={farm}
                            tenantId={tenantId}
                            onSuccess={() => {
                                queryClient.invalidateQueries(['farms'])
                                if (!farm) onClose()
                                else setMode('view')
                            }}
                            onCancel={() => farm ? setMode('view') : onClose()}
                            isSheet
                        />
                    </div>
                )}
            </SheetContent>

            <ConfirmDialog 
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                title="Hapus Kandang?"
                message={`Semua data terkait ${farm?.farm_name} akan dihapus secara permanen.`}
            />
        </Sheet>
    )
}

function DetailRow({ label, value, className }) {
    return (
        <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
            <span className="text-xs font-black text-[#4B6478] uppercase tracking-widest">{label}</span>
            <span className={cn("text-white text-sm font-bold", className)}>{value || '-'}</span>
        </div>
    )
}

function FarmForm({ farm, tenantId, onSuccess, onCancel, isSheet }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        farm_name: farm?.farm_name ?? '',
        owner_name: farm?.owner_name ?? '',
        phone: farm?.phone ?? '',
        location: farm?.location ?? '',
        chicken_type: farm?.chicken_type ?? 'broiler',
        status: farm?.status ?? 'empty',
        available_stock: farm?.available_stock ?? 0,
        avg_weight_kg: farm?.avg_weight_kg ?? '',
        harvest_date: farm?.harvest_date ?? '',
        capacity: farm?.capacity ?? '',
        quality_rating: farm?.quality_rating ?? 0,
        quality_notes: farm?.quality_notes ?? '',
        notes: farm?.notes ?? ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const payload = {
                ...formData,
                available_stock: formData.status === 'empty' ? 0 : Number(formData.available_stock || 0),
                avg_weight_kg: formData.avg_weight_kg ? Number(formData.avg_weight_kg) : null,
                capacity: formData.capacity ? Number(formData.capacity) : null,
                harvest_date: (formData.status === 'empty' || !formData.harvest_date) ? null : formData.harvest_date
            }

            if (farm) {
                const { error } = await supabase.from('farms').update(payload).eq('id', farm.id)
                if (error) throw error
                toast.success('Kandang diperbarui!')
            } else {
                const { error } = await supabase.from('farms').insert({ ...payload, tenant_id: tenantId })
                if (error) throw error
                toast.success('Kandang ditambahkan!')
            }
            onSuccess()
        } catch (err) {
            toast.error('❌ ' + err.message)
        } finally {
            setIsLoading(false)
        }
    }



    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-12 text-left">
            <div className="space-y-2">
                <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Nama Kandang *</Label>
                <Input 
                    required placeholder="Kandang Pak Harto"
                    value={formData.farm_name} 
                    onChange={e => setFormData({...formData, farm_name: e.target.value})}
                    className={cn("bg-[#111C24] border-white/10 h-14 font-black rounded-2xl pl-5 placeholder:text-[#4B6478] placeholder:font-bold", !isDesktop && "text-base")}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Nama Pemilik *</Label>
                    <Input 
                        required
                        value={formData.owner_name} 
                        onChange={e => setFormData({...formData, owner_name: e.target.value})}
                        className={cn("bg-[#111C24] border-white/10 h-14 font-black rounded-2xl", !isDesktop && "text-base")}
                    />
                </div>
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>No HP</Label>
                    <Input 
                        type="tel"
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className={cn("bg-[#111C24] border-white/10 h-14 font-black rounded-2xl", !isDesktop && "text-base")}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Lokasi</Label>
                <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" size={18} />
                    <Input 
                        placeholder="Boyolali, Jawa Tengah"
                        value={formData.location} 
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        className={cn("bg-[#111C24] border-white/10 h-14 font-black rounded-2xl pl-12", !isDesktop && "text-base")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Jenis Ayam</Label>
                    <Select value={formData.chicken_type} onValueChange={val => setFormData({...formData, chicken_type: val})}>
                        <SelectTrigger className={cn("bg-[#111C24] border-white/10 h-14 font-black rounded-2xl uppercase tracking-widest px-5", isDesktop ? "text-[10px]" : "text-xs")}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111C24] border-white/10 text-white">
                            {['broiler', 'kampung', 'pejantan', 'layer', 'petelur'].map(t => (
                                <SelectItem key={t} value={t} className="uppercase text-[10px] font-black tracking-widest">{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Status</Label>
                    <Select value={formData.status} onValueChange={val => setFormData({...formData, status: val})}>
                        <SelectTrigger className={cn("bg-[#111C24] border-white/10 h-14 font-black rounded-2xl uppercase tracking-widest px-5", isDesktop ? "text-[10px]" : "text-xs")}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111C24] border-white/10 text-white">
                            <SelectItem value="ready" className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">Siap Panen</SelectItem>
                            <SelectItem value="growing" className="text-amber-500 font-black uppercase text-[10px] tracking-widest">Tumbuh</SelectItem>
                            <SelectItem value="empty" className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Kosong</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {formData.status !== 'empty' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Stok Ayam (Ekor)</Label>
                        <InputNumber 
                            value={formData.available_stock} 
                            onChange={v => setFormData({...formData, available_stock: v})}
                            className={cn("bg-[#111C24] border-white/10 h-14 font-black rounded-2xl tabular-nums", !isDesktop && "text-base")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Bobot Rata-rata (kg)</Label>
                        <InputNumber 
                            step={0.01}
                            value={formData.avg_weight_kg} 
                            onChange={v => setFormData({...formData, avg_weight_kg: v})}
                            className={cn("bg-[#111C24] border-white/10 h-14 font-black rounded-2xl tabular-nums", !isDesktop && "text-base")}
                        />
                    </div>
                </div>
            )}

            {(formData.status === 'ready' || formData.status === 'growing') && (
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Estimasi Panen</Label>
                    <DatePicker 
                        value={formData.harvest_date} 
                        onChange={date => setFormData({...formData, harvest_date: date})}
                        className="h-14"
                    />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Kapasitas (Ekor)</Label>
                    <InputNumber 
                        value={formData.capacity} 
                        onChange={v => setFormData({...formData, capacity: v})}
                        className={cn("bg-[#111C24] border-white/10 h-14 rounded-2xl tabular-nums", !isDesktop && "text-base font-black")}
                    />
                </div>
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Rating Kualitas</Label>
                    <div className="flex gap-3 h-14 items-center pl-1">
                        {[1,2,3,4,5].map(s => (
                            <Star 
                                key={s} 
                                size={22} 
                                className={`cursor-pointer transition-all ${s <= formData.quality_rating ? 'fill-amber-400 text-amber-400' : 'text-[#4B6478]'}`}
                                onClick={() => setFormData({...formData, quality_rating: s})}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-6">
                <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl"
                >
                    {isLoading ? 'Menyimpan...' : farm ? 'Simpan Kandang' : 'Tambah Kandang'}
                </Button>
                
                {onCancel && (
                    <Button 
                        type="button" 
                        variant="outline"
                        onClick={onCancel}
                        className="h-14 border-white/10 text-[#4B6478] hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl px-8"
                    >
                        Batal
                    </Button>
                )}
            </div>
        </form>
    )
}

function LoadingList() {
    return (
        <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-[24px] bg-white/5 border border-white/5" />
            ))}
        </div>
    )
}

