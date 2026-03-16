import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, MapPin, ChevronRight, Warehouse, 
  Trash2, Edit, Star, Calendar, Info, AlertTriangle,
  Clock, CheckCircle2, History
} from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { useFarms } from '@/lib/hooks/useFarms'
import { formatIDR, formatDate, formatWeight, formatRelative, safeNumber } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog'
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import SlideModal from '@/dashboard/components/SlideModal'
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

export default function Kandang() {
  const { tenant } = useAuth()
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
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mt-1">{safeNumber(totalEkor).toLocaleString('id-ID')} ekor tersedia</p>
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
                className={`flex-shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                    (filter === t || (filter === 'Semua' && t === 'Semua')) 
                    ? 'bg-secondary/10 border-emerald-500/30 text-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.1)]' 
                    : 'bg-white/[0.03] border-white/5 text-[#4B6478] hover:border-white/10'
                }`}
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

      {/* Form Sheet */}
      <SlideModal 
        title={editingFarm ? "Edit Kandang" : "Tambah Kandang"} 
        isOpen={openModal} 
        onClose={() => setOpenModal(false)}
      >
        <FarmForm 
            farm={editingFarm} 
            tenantId={tenant?.id} 
            onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['farms', tenant?.id] })
                setOpenModal(false)
            }}
        />
      </SlideModal>
    </motion.div>
  )
}

function SummaryPill({ label, value, color }) {
    return (
        <div className={`px-5 py-3 rounded-[22px] ${color} flex flex-col items-start gap-1 border border-white/5 min-w-[124px] text-left`}>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-60 leading-none">{label}</span>
            <span className="text-[14px] font-black tracking-tight leading-none tabular-nums">{value}</span>
        </div>
    )
}

function FarmCard({ farm, onEdit }) {
  const daysToHarvest = farm.harvest_date ? differenceInDays(new Date(farm.harvest_date), new Date()) : null
  
  return (
    <Card className="bg-[#111C24] border-white/5 rounded-[24px] p-5 space-y-4 hover:border-white/10 transition-all relative group active:scale-[0.98] text-left">
        <div className="flex justify-between items-start">
            <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <h3 className="font-display font-black text-[#F1F5F9] text-[18px] tracking-tight group-hover:text-emerald-400 transition-colors uppercase leading-none">{farm.farm_name}</h3>
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

        <div className="flex items-center gap-1.5 text-[11px] font-black text-[#4B6478] uppercase tracking-wider">
            <span className="text-[#F1F5F9]">{farm.owner_name}</span>
            <span className="text-white/10">•</span>
            <div className="flex items-center gap-1">
                <MapPin size={11} strokeWidth={2.5} /> {farm.location || 'N/A'}
            </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest leading-none">Stok Tersedia</p>
                <p className="font-display font-black text-[#F1F5F9] text-base leading-none tabular-nums mt-1">{farm.available_stock || 0} ekor</p>
            </div>
            <div className="space-y-1 text-right">
                <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest leading-none">Rata-rata Bobot</p>
                <p className="font-display font-black text-[#F1F5F9] text-base leading-none tabular-nums mt-1">{farm.avg_weight_kg ? `${farm.avg_weight_kg} kg` : '-'}</p>
            </div>
        </div>

        <div className="flex justify-between items-center pt-1">
            {farm.harvest_date && (farm.status === 'growing' || farm.status === 'ready') ? (
                <HarvestPill days={daysToHarvest} date={farm.harvest_date} />
            ) : <div />}
            
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="h-8 px-4 rounded-xl bg-secondary/10 border border-white/5 text-[10px] font-black text-[#F1F5F9] hover:bg-white/10 uppercase tracking-widest"
            >
                Detail
            </Button>
        </div>
    </Card>
  )
}

function StatusBadge({ status }) {
    switch(status) {
        case 'ready': 
            return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[9px] px-3 h-6 uppercase tracking-wider">SIAP PANEN</Badge>
        case 'growing':
            return <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[9px] px-3 h-6 uppercase tracking-wider">TUMBUH</Badge>
        default:
            return <Badge className="bg-secondary/10 text-[#4B6478] border border-white/5 font-black text-[9px] px-3 h-6 uppercase tracking-wider">KOSONG</Badge>
    }
}

function HarvestPill({ days, date }) {
    if (days <= 0) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black text-red-500 uppercase tracking-wide">
                <AlertTriangle size={12} strokeWidth={3} />
                TERLEWAT {Math.abs(days)} HARI
            </div>
        )
    }
    if (days <= 3) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 animate-pulse uppercase tracking-wide">
                <Clock size={12} strokeWidth={3} />
                PANEN DALAM {days} HARI!
            </div>
        )
    }
    if (days <= 7) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-wide">
                <Clock size={12} strokeWidth={3} />
                {days} HARI LAGI
            </div>
        )
    }
    return (
        <div className="flex items-center gap-2 text-[10px] font-black text-[#4B6478] uppercase tracking-widest">
            <Calendar size={12} />
            {formatDate(date)}
        </div>
    )
}

function FarmForm({ farm, tenantId, onSuccess }) {
    const [isLoading, setIsLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [formData, setFormData] = useState(farm || {
        farm_name: '',
        owner_name: '',
        phone: '',
        location: '',
        chicken_type: 'broiler',
        status: 'empty',
        available_stock: 0,
        avg_weight_kg: '',
        harvest_date: '',
        capacity: '',
        quality_rating: 0,
        quality_notes: '',
        notes: ''
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

    const handleDelete = async () => {
        setDeleteLoading(true)
        try {
            const { error } = await supabase.from('farms').update({ is_deleted: true }).eq('id', farm.id)
            if (error) throw error
            toast.success('Kandang dihapus')
            onSuccess()
        } catch (err) {
            toast.error('❌ ' + err.message)
        } finally {
            setDeleteLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-12 text-left">
            <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Nama Kandang *</Label>
                <Input 
                    required placeholder="Kandang Pak Harto"
                    value={formData.farm_name} 
                    onChange={e => setFormData({...formData, farm_name: e.target.value})}
                    className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl pl-5 placeholder:text-[#4B6478] placeholder:font-bold"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Nama Pemilik *</Label>
                    <Input 
                        required
                        value={formData.owner_name} 
                        onChange={e => setFormData({...formData, owner_name: e.target.value})}
                        className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">No HP</Label>
                    <Input 
                        type="tel"
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Lokasi</Label>
                <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" size={18} />
                    <Input 
                        placeholder="Boyolali, Jawa Tengah"
                        value={formData.location} 
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl pl-12"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Jenis Ayam</Label>
                    <Select value={formData.chicken_type} onValueChange={val => setFormData({...formData, chicken_type: val})}>
                        <SelectTrigger className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl uppercase tracking-widest text-[10px] px-5">
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
                    <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Status</Label>
                    <Select value={formData.status} onValueChange={val => setFormData({...formData, status: val})}>
                        <SelectTrigger className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl uppercase tracking-widest text-[10px] px-5">
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
                        <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Stok Ayam (Ekor)</Label>
                        <Input 
                            type="number"
                            value={formData.available_stock} 
                            onChange={e => setFormData({...formData, available_stock: e.target.value})}
                            className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl tabular-nums"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Bobot Rata-rata (kg)</Label>
                        <Input 
                            type="number" step="0.01"
                            value={formData.avg_weight_kg} 
                            onChange={e => setFormData({...formData, avg_weight_kg: e.target.value})}
                            className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl tabular-nums"
                        />
                    </div>
                </div>
            )}

            {(formData.status === 'ready' || formData.status === 'growing') && (
                <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Estimasi Panen</Label>
                    <Input 
                        type="date"
                        value={formData.harvest_date} 
                        onChange={e => setFormData({...formData, harvest_date: e.target.value})}
                        className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl text-white uppercase text-[10px] tracking-widest"
                    />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Kapasitas (Ekor)</Label>
                    <Input 
                        type="number"
                        value={formData.capacity} 
                        onChange={e => setFormData({...formData, capacity: e.target.value})}
                        className="bg-[#111C24] border-white/10 h-14 rounded-2xl tabular-nums"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Rating Kualitas</Label>
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
                {farm && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                                type="button"
                                variant="ghost"
                                className="w-16 h-16 rounded-[22px] border border-red-500/20 text-red-500 hover:bg-red-500/10 active:scale-90 transition-transform"
                            >
                                <Trash2 size={24} />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#0C1319] border-white/10 rounded-[32px] p-8">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-white font-display font-black tracking-tight text-2xl uppercase">Hapus Kandang?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400 font-bold mt-2">
                                    Data kandang akan dihapus secara permanen. Riwayat transaksi pembelian yang berkaitan dengan kandang ini tetap akan tersimpan.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3 mt-8">
                                <AlertDialogCancel className="bg-white/5 border-none text-[#F1F5F9] rounded-2xl h-14 font-black uppercase tracking-widest text-xs">Batal</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={handleDelete}
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-xs border-none"
                                >
                                    Ya, Hapus
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                <Button 
                    type="submit" 
                    className="flex-1 h-16 rounded-[22px] bg-[#10B981] hover:bg-emerald-600 text-sm font-black border-none shadow-[0_4px_20px_rgba(16,185,129,0.15)] uppercase tracking-[0.2em]"
                    disabled={isLoading}
                >
                    {isLoading ? 'Menyimpan...' : (farm ? 'Simpan Perubahan' : 'Tambah Kandang')}
                </Button>
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

