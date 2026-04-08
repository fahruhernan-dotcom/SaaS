import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Phone, MapPin, ChevronRight, CheckCircle2, Building2, User, Star, Trash2, Lock, Unlock } from 'lucide-react'
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
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import EmptyState from '@/components/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { RPASkeleton } from '@/components/ui/BrokerPageSkeleton'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { InputRupiah } from '@/components/ui/InputRupiah'

export const rpaSchema = z.object({
    rpa_name: z.string().min(2, 'Nama RPA minimal 2 karakter'),
    buyer_type: z.string().default('rpa'),
    phone: z.string().min(8, 'Nomor HP minimal 8 digit'),
    location: z.string().optional(),
    payment_terms: z.string().default('cash'),
    credit_limit: z.union([z.string(), z.number()]).optional(),
    reliability_score: z.number().min(1).max(5).default(5),
    notes: z.string().optional()
})

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

export default function RPA() {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const { tenant } = useAuth()
    const { data: rpas, isLoading } = useRPA()
    const { data: allSales, isLoading: loadingSales } = useSales()
    const [search, setSearch] = useState('')
    const [openModal, setOpenModal] = useState(false)
    const [editingRPA, setEditingRPA] = useState(null)

    const { brokerType } = useParams()
    const brokerBase = `/broker/${brokerType || 'broker_ayam'}`
    const _navigate = useNavigate()
    const navigate = (path, options) => {
        if (path.startsWith('/broker')) {
            return _navigate(path.replace('/broker', brokerBase), options)
        }
        return _navigate(path, options)
    }
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

    if (isLoading) return <RPASkeleton />

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-[#06090F] min-h-screen pb-24"
        >
            {/* TopBar */}
            <header className={cn("px-5 pb-4 border-b border-white/5 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 flex flex-col gap-1", isDesktop ? "pt-8" : "pt-10")}>
                <div className="flex justify-between items-center text-left">
                    <div>
                        <h1 className={cn("font-display font-black text-white tracking-tight leading-none uppercase", isDesktop ? "text-2xl" : "text-xl")}>RPA & Piutang</h1>
                        <p className={cn("font-bold text-[#4B6478] uppercase mt-1", isDesktop ? "text-[11px]" : "text-[10px]")}>{rpas?.length || 0} pembeli terdaftar</p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => { setEditingRPA(null); setOpenModal(true); }}
                        className={cn("bg-[#10B981] hover:bg-[#0D9668] text-white font-black uppercase tracking-widest rounded-xl px-4 gap-2 border-none shadow-[0_4px_12px_rgba(16,185,129,0.2)] h-10 transition-all active:scale-95", isDesktop ? "text-[10px]" : "text-xs")}
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
                        <p className={cn("font-black text-red-400 uppercase tracking-widest leading-none mb-1 text-left", isDesktop ? "text-[10px]" : "text-[11px]")}>Total Piutang Aktif</p>
                        <p className={cn("font-display font-black text-red-500 tracking-tighter text-left", isDesktop ? "text-3xl" : "text-2xl")}>{formatIDR(totalPiutang)}</p>
                        <p className={cn("font-black text-red-400/50 uppercase tracking-wider text-left", isDesktop ? "text-[11px]" : "text-xs")}>dari {activeCount} RPA</p>
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
                    className={cn("bg-[#111C24] border-white/10 h-13 pl-12 rounded-2xl focus:border-emerald-500/50 transition-all font-bold text-white", isDesktop ? "text-[15px]" : "text-base")}
                />
            </div>

            {/* RPA List */}
            <div className="mt-6 px-5 space-y-3">
                {isLoading || loadingSales ? (
                    <LoadingList isDesktop={isDesktop} />
                ) : filteredRpas.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        title="Belum ada RPA"
                        description="Tambahkan pembeli pertamamu untuk mulai mencatat penjualan dan melacak piutang."
                        action={
                            <Button
                                className={cn("bg-[#10B981] hover:bg-emerald-600 h-11 px-6 font-black uppercase tracking-widest rounded-xl border-none transition-all active:scale-95", isDesktop ? "text-[10px]" : "text-xs")}
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
                        className={isDesktop ? "space-y-3" : "space-y-2"}
                    >
                        {filteredRpas.map((rpa) => (
                            <motion.div key={rpa.id} variants={fadeUp}>
                                <RPACard
                                    rpa={rpa}
                                    isDesktop={isDesktop}
                                    onClick={() => navigate(`/broker/rpa/${rpa.id}`)}
                                    onEdit={handleEdit}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Form Sheet */}
            <Sheet open={openModal} onOpenChange={setOpenModal}>
                <SheetContent
                    side="right"
                    className="bg-[#0C1319] border-l border-white/8 w-full sm:max-w-[480px] p-6 overflow-y-auto"
                >
                    <SheetHeader className="mb-8">
                        <SheetTitle className="font-display text-2xl font-black text-white uppercase tracking-tight text-left">
                            {editingRPA ? "EDIT RPA" : "TAMBAH RPA"}
                        </SheetTitle>
                        <SheetDescription className="sr-only">Form RPA</SheetDescription>
                    </SheetHeader>

                    <RPAForm
                        rpa={editingRPA}
                        isDesktop={isDesktop}
                        onClose={() => setOpenModal(false)}
                        tenantId={tenant?.id}
                        onSubmit={async (data) => {
                            const action = editingRPA ? 'update' : 'insert'
                            const { error } = await (editingRPA ?
                                supabase.from('rpa_clients').update(data).eq('id', editingRPA.id) :
                                supabase.from('rpa_clients').insert({ ...data, tenant_id: tenant?.id })
                            )
                            if (error) throw error
                            toast.success(editingRPA ? 'RPA diperbarui' : 'RPA ditambahkan')
                            queryClient.invalidateQueries({ queryKey: ['rpa-clients', tenant?.id] })
                            setOpenModal(false)
                        }}
                        onDelete={async (id) => {
                            const { error } = await supabase.from('rpa_clients').delete().eq('id', id)
                            if (error) throw error
                            toast.success('RPA dihapus')
                            queryClient.invalidateQueries({ queryKey: ['rpa-clients', tenant?.id] })
                            setOpenModal(false)
                        }}
                    />
                </SheetContent>
            </Sheet>
        </motion.div>
    )
}

const SHORT_BUYER_LABELS = {
    rpa: 'RPA',
    pedagang_pasar: 'Pasar',
    restoran: 'Resto',
    pengepul: 'Pengepul',
    supermarket: 'Supermarket',
    lainnya: 'Lainnya',
}

const PaymentStatusBadge = ({ outstanding }) => {
    if (outstanding <= 0) {
        return (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-emerald-400 bg-emerald-500/10 whitespace-nowrap">
                Lunas
            </span>
        )
    }
    return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-red-400 bg-red-500/10 whitespace-nowrap">
            Belum Lunas
        </span>
    )
}

function RPACard({ rpa, isDesktop, onClick, onEdit }) {
    const initials = rpa.rpa_name.slice(0, 2).toUpperCase()

    // ── Desktop layout (unchanged) ──────────────────────────────────────────────
    if (isDesktop) {
        return (
            <div
                onClick={onClick}
                className="bg-[#111C24] border border-white/5 rounded-3xl p-4 flex justify-between items-center cursor-pointer hover:border-white/10 transition-all shadow-sm group active:scale-[0.98]"
            >
                <div className="flex gap-4 items-center flex-1">
                    <Avatar className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <AvatarFallback className="bg-transparent text-[#34D399] font-display font-black text-lg">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 text-left flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-display font-black text-[#F1F5F9] group-hover:text-emerald-400 transition-colors uppercase tracking-tight text-base">
                                {rpa.rpa_name}
                            </h3>
                            <span style={{
                                fontSize: '9px', fontWeight: 800, padding: '2px 8px',
                                borderRadius: '99px', background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.10)', color: '#94A3B8',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                                {formatBuyerType(rpa.buyer_type)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href={`tel:${rpa.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 font-bold text-[#4B6478] hover:text-[#34D399] transition-colors min-h-[24px] text-[11px]"
                            >
                                <Phone size={12} className="text-emerald-500/40" /> {rpa.phone}
                            </a>
                            <span className="text-white/10">•</span>
                            <div className="flex items-center gap-1.5 font-bold text-[#4B6478] text-[11px]">
                                <MapPin size={12} className="text-emerald-500/40" /> {rpa.location || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-right flex items-center gap-1.5">
                    <div className="space-y-0.5">
                        {rpa.calculated_outstanding > 0 ? (
                            <>
                                <p className="font-black text-red-400 uppercase tracking-widest leading-none text-right text-[10px]">Piutang</p>
                                <p className="font-display font-black text-red-500 tabular-nums leading-none mt-1 text-right text-base">
                                    {formatIDRShort(rpa.calculated_outstanding)}
                                </p>
                            </>
                        ) : (
                            <div className="flex items-center gap-1 text-[#34D399] font-black uppercase tracking-wider text-[11px]">
                                <CheckCircle2 size={13} strokeWidth={3} /> Lunas
                            </div>
                        )}
                    </div>
                    <ChevronRight size={16} className="text-[#4B6478] group-hover:translate-x-1 transition-transform ml-1" />
                </div>
            </div>
        )
    }

    // ── Mobile layout ───────────────────────────────────────────────────────────
    return (
        <div
            onClick={onClick}
            className="bg-[#111C24] rounded-2xl border border-white/8 active:bg-white/5 transition-colors cursor-pointer"
        >
            <div className="flex items-center gap-3 p-4 min-h-[80px] min-w-0">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex-shrink-0 flex items-center justify-center">
                    <span className="text-emerald-400 font-bold text-sm font-display">{initials}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Row 1: Name + type badge */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white truncate">
                            {rpa.rpa_name}
                        </span>
                        <span className="flex-shrink-0 text-[10px] font-medium bg-white/10 text-[#94A3B8] rounded-md px-1.5 py-0.5 whitespace-nowrap">
                            {SHORT_BUYER_LABELS[rpa.buyer_type] || formatBuyerType(rpa.buyer_type)}
                        </span>
                    </div>

                    {/* Row 2: Phone + location */}
                    <div className="flex items-center gap-2 text-xs text-[#4B6478]">
                        {rpa.phone && (
                            <a
                                href={`tel:${rpa.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 truncate hover:text-emerald-400 transition-colors"
                            >
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{rpa.phone}</span>
                            </a>
                        )}
                        {rpa.location && (
                            <>
                                <span className="flex-shrink-0">•</span>
                                <span className="flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{rpa.location}</span>
                                </span>
                            </>
                        )}
                    </div>

                    {/* Row 3: Piutang (only if > 0) */}
                    {rpa.calculated_outstanding > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[11px] text-[#4B6478]">Piutang</span>
                            <span className="text-[11px] font-semibold text-red-400">
                                {formatIDRShort(rpa.calculated_outstanding)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Status + Arrow */}
                <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <PaymentStatusBadge outstanding={rpa.calculated_outstanding} />
                    <ChevronRight className="w-4 h-4 text-white/20" />
                </div>
            </div>
        </div>
    )
}

export function RPAForm({ rpa, isDesktop, onClose, onSubmit, onDelete }) {
    const { profile } = useAuth()
    const isOwner = profile?.role === 'owner'
    const [isLoading, setIsLoading] = useState(false)
    
    const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm({
        resolver: zodResolver(rpaSchema),
        defaultValues: rpa || {
            rpa_name: '',
            buyer_type: 'rpa',
            phone: '',
            location: '',
            payment_terms: 'cash',
            credit_limit: 0,
            reliability_score: 5,
            notes: ''
        }
    })

    const onFormSubmit = async (data) => {
        setIsLoading(true)
        try {
            await onSubmit(data)
        } catch (err) {
            // Error handling is done in onSubmit
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 pb-12">
            <div className="space-y-2">
                <Label className={cn("uppercase font-black tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Nama RPA / Pembeli *</Label>
                <Input
                    {...register('rpa_name')}
                    placeholder="Contoh: RPA Prima Jaya"
                    className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold text-white text-base focus:border-emerald-500/50"
                />
                {errors.rpa_name && <p className="text-[9px] text-red-500 font-black uppercase ml-1 mt-1">{errors.rpa_name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Tipe Pembeli</Label>
                    <Select value={watch('buyer_type')} onValueChange={val => setValue('buyer_type', val)}>
                        <SelectTrigger className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold text-white uppercase text-xs focus:ring-emerald-500/20">
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
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>No HP *</Label>
                    <Input
                        type="tel"
                        {...register('phone')}
                        placeholder="0812..."
                        className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold text-white text-base focus:border-emerald-500/50"
                    />
                    {errors.phone && <p className="text-[9px] text-red-500 font-black uppercase ml-1 mt-1">{errors.phone.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label className={cn("uppercase font-black tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Lokasi / Alamat</Label>
                <Input
                    {...register('location')}
                    placeholder="Contoh: Boyolali, Jawa Tengah"
                    className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold text-white text-base focus:border-emerald-500/50"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Syarat Bayar</Label>
                    <Select value={watch('payment_terms')} onValueChange={val => setValue('payment_terms', val)}>
                        <SelectTrigger className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold text-white uppercase text-xs focus:ring-emerald-500/20">
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
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Limit Kredit Rp</Label>
                    <InputRupiah 
                        value={watch('credit_limit')}
                        onChange={val => setValue('credit_limit', val)}
                        placeholder="Contoh: 50000000"
                        className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold text-white text-base focus:border-emerald-500/50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Reliabilitas</Label>
                    <div className="flex gap-2 h-12 items-center">
                        {[1, 2, 3, 4, 5].map(s => (
                            <Star
                                key={s}
                                size={22}
                                className={cn("cursor-pointer transition-all", s <= watch('reliability_score') ? 'fill-amber-400 text-amber-400 scale-110' : 'text-[#4B6478]')}
                                onClick={() => setValue('reliability_score', s)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label className={cn("uppercase font-black tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Catatan</Label>
                <Textarea
                    {...register('notes')}
                    placeholder="Tulis catatan jika diperlukan..."
                    className="bg-[#111C24] border-white/10 rounded-xl min-h-[80px] font-bold text-white text-base p-4 focus:border-emerald-500/50"
                />
            </div>

            <div className="flex gap-3 pt-4">
                {rpa && isOwner && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (confirm('Hapus RPA ini? Semua data piutang akan tetap ada di riwayat transaksi.')) {
                                onDelete(rpa.id)
                            }
                        }}
                        className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 text-[#F87171] hover:bg-red-500/10 transition-all active:scale-95"
                    >
                        <Trash2 size={22} />
                    </Button>
                )}
                <Button
                    type="submit"
                    className={cn("flex-1 h-14 rounded-2xl bg-[#10B981] hover:bg-[#0D9668] font-black border-none shadow-lg shadow-emerald-500/10 uppercase tracking-widest transition-all active:scale-95", isDesktop ? "text-xs" : "text-sm")}
                    disabled={isLoading}
                >
                    {isLoading ? 'Menyimpan...' : (rpa ? 'Simpan Perubahan' : 'Tambah RPA Baru')}
                </Button>
            </div>
        </form>
    )
}

function LoadingList({ isDesktop }) {
    return (
        <div className="space-y-3">
            <Skeleton className="h-[48px] w-full rounded-2xl bg-secondary/10 mb-6" />
            <Skeleton className="h-[80px] w-full rounded-3xl bg-white/10" />
            <Skeleton className="h-[80px] w-full rounded-3xl bg-secondary/10" />
            <Skeleton className="h-[80px] w-full rounded-3xl bg-secondary/10" />
        </div>
    )
}

