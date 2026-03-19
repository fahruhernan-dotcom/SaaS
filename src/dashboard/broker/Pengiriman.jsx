import React, { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Truck, Package, AlertTriangle, CheckCircle2, 
    Plus, Search, Filter, ChevronRight, 
    Clock, MapPin, User, Smartphone, 
    TrendingDown, AlertCircle, Info, Calendar,
    ArrowRightLeft, MoreHorizontal, Check, Lock, Unlock,
    ChevronDown, ChevronsUpDown, Trash2,
    Pencil, PencilLine, Printer, X
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatIDR, safeNumber, safePercent, safeNum, formatWeight, formatEkor } from '@/lib/format'
import { useUpdateDelivery } from '@/lib/hooks/useUpdateDelivery'
import { InputNumber } from '@/components/ui/InputNumber'

// Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandSeparator
} from '@/components/ui/command'

// --- ANIMATIONS ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
    }
}

export default function Pengiriman() {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const { tenant } = useAuth()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('pengiriman')
    const [deliveryFilter, setDeliveryFilter] = useState('semua')
    
    // --- MODALS STATE ---
    const [isCreateDeliveryOpen, setIsCreateDeliveryOpen] = useState(false)
    const [isUpdateArrivalOpen, setIsUpdateArrivalOpen] = useState(false)
    const [isCreateLossOpen, setIsCreateLossOpen] = useState(false)
    const [selectedDelivery, setSelectedDelivery] = useState(null)
    const [initialLossData, setInitialLossData] = useState(null)
    
    // --- LOGISTICS DETAIL ---
    const [isLogisticsDetailOpen, setIsLogisticsDetailOpen] = useState(false)
    const [selectedLogisticsDetail, setSelectedLogisticsDetail] = useState(null)

    // --- EDIT ARRIVAL DATA STATE ---
    const [confirmEditArrivalDelivery, setConfirmEditArrivalDelivery] = useState(null)

    const location = useLocation()

    useEffect(() => {
        if (location.state?.openLoss) {
            setActiveTab('loss')
            setInitialLossData(location.state.initialLoss)
            setIsCreateLossOpen(true)
            // Clear state so it doesn't reopen on refresh
            window.history.replaceState({}, document.title)
        }
    }, [location])

    // --- QUERIES ---
    const { data: deliveries = [], isLoading: isLoadingDeliveries } = useQuery({
        queryKey: ['deliveries', tenant?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('deliveries')
                .select(`
                    *,
                    sales!inner (
                        id,
                        is_deleted,
                        total_revenue,
                        quantity,
                        total_weight_kg,
                        price_per_kg,
                        rpa_clients ( rpa_name ),
                        purchases ( farms ( farm_name ) )
                    )
                `)
                .eq('tenant_id', tenant?.id)
                .eq('is_deleted', false)
                .eq('sales.is_deleted', false)
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        },
        enabled: !!tenant?.id
    })

    const { data: lossReports = [], isLoading: isLoadingLoss } = useQuery({
        queryKey: ['loss-reports', tenant?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('loss_reports')
                .select(`
                    *,
                    delivery:deliveries(*, sales(price_per_kg, rpa_clients(rpa_name)))
                `)
                .eq('tenant_id', tenant?.id)
                .eq('is_deleted', false)
                .order('report_date', { ascending: false })
            if (error) throw error
            return data
        },
        enabled: !!tenant?.id
    })

    // --- SUMMARY STATS ---
    const stats = useMemo(() => {
        const activeCount = deliveries.filter(d => d.status === 'on_route').length
        const completedToday = deliveries.filter(d => 
            d.status === 'completed' && 
            format(new Date(d.updated_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
        ).length
        
        const lossMonth = lossReports
            .filter(l => format(new Date(l.report_date), 'yyyy-MM') === format(new Date(), 'yyyy-MM'))
            .reduce((acc, curr) => acc + (Number(curr.financial_loss) || 0), 0)

        return { activeCount, completedToday, lossMonth }
    }, [deliveries, lossReports])

    // --- GROUPED LOSS REPORTS ---
    const groupedLossReports = useMemo(() => {
        const grouped = lossReports.reduce((acc, report) => {
            const key = report.delivery_id || `manual-${report.id}`
            if (!acc[key]) {
                acc[key] = {
                    id: key,
                    delivery_id: report.delivery_id,
                    report_date: report.report_date,
                    delivery: report.delivery,
                    mortality: null,
                    shrinkage: null,
                    other: []
                }
            }
            if (report.loss_type === 'mortality') acc[key].mortality = report
            else if (report.loss_type === 'shrinkage') acc[key].shrinkage = report
            else acc[key].other.push(report)
            return acc
        }, {})
        return Object.values(grouped)
    }, [lossReports])

    // --- MUTATIONS ---
    const resolveLossMutation = useMutation({
        mutationFn: async ({ deliveryId, reportId }) => {
            let query = supabase
                .from('loss_reports')
                .update({ resolved: true })
                .eq('tenant_id', tenant.id)
            
            if (deliveryId) {
                query = query.eq('delivery_id', deliveryId)
            } else {
                query = query.eq('id', reportId)
            }
            
            const { error } = await query
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['loss-reports'])
            toast.success('Kerugian ditandai selesai')
        },
        onError: (err) => {
            console.error('Error resolving loss:', err)
            toast.error('Gagal memperbarui status')
        }
    })

    // --- FILTERED DELIVERIES ---
    const filteredDeliveries = useMemo(() => {
        if (deliveryFilter === 'semua') return deliveries
        if (deliveryFilter === 'aktif') return deliveries.filter(d => ['preparing', 'loading', 'on_route', 'arrived'].includes(d.status))
        if (deliveryFilter === 'selesai') return deliveries.filter(d => d.status === 'completed')
        return deliveries
    }, [deliveries, deliveryFilter])


    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("bg-[#06090F] min-h-screen text-[#F1F5F9] pb-24", isDesktop && "pb-10")}
        >
            {/* Header Mobile Only */}
            {!isDesktop && (
                <header className="px-5 pt-10 pb-4 flex justify-between items-center sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-40 border-b border-white/5">
                    <h1 className="font-display text-xl font-black tracking-tight uppercase">Pengiriman & Loss</h1>
                    <Button 
                        size="sm"
                        onClick={() => setIsCreateDeliveryOpen(true)}
                        className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest"
                    >
                        <Plus size={14} strokeWidth={3} className="mr-1.5" /> Catat
                    </Button>
                </header>
            )}

            <div className="px-5 pt-8 max-w-5xl mx-auto space-y-8">
                {/* Desktop Header */}
                {isDesktop && (
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="font-display text-3xl font-black tracking-tight uppercase">Pengiriman & Loss</h1>
                            <p className="text-[#4B6478] font-bold text-sm mt-1 uppercase tracking-wider">Pantau logistik dan kerugian lapangan</p>
                        </div>
                        <Button 
                            onClick={() => setIsCreateDeliveryOpen(true)}
                            className="h-12 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            <Plus size={18} strokeWidth={3} /> Catat Pengiriman
                        </Button>
                    </div>
                )}

                {/* SUMMARY STRIP */}
                <div className={cn(
                    "flex gap-4 overflow-x-auto pb-2 scrollbar-none",
                    isDesktop ? "grid grid-cols-3" : ""
                )}>
                    <SummaryCard 
                        label="Aktif" 
                        value={stats.activeCount} 
                        icon={Truck} 
                        color="emerald"
                        subLabel="Dalam perjalanan"
                    />
                    <SummaryCard 
                        label="Selesai Hari Ini" 
                        value={stats.completedToday} 
                        icon={CheckCircle2} 
                        color="blue"
                        subLabel="Pengiriman tiba"
                    />
                    <SummaryCard 
                        label="Loss Bulan Ini" 
                        value={formatIDR(stats.lossMonth)} 
                        icon={TrendingDown} 
                        color="red"
                        subLabel="Estimasi kerugian"
                    />
                </div>

                {/* MAIN TABS */}
                <Tabs defaultValue="pengiriman" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="bg-secondary/10 p-1.5 rounded-[20px] w-full max-w-[400px]">
                        <TabsTrigger 
                            value="pengiriman" 
                            className="rounded-2xl transition-all data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest flex-1 py-3"
                        >
                            Pengiriman
                        </TabsTrigger>
                        <TabsTrigger 
                            value="loss" 
                            className="rounded-2xl transition-all data-[state=active]:bg-red-500 data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest flex-1 py-3"
                        >
                            Loss Report
                        </TabsTrigger>
                    </TabsList>

                    {/* --- TAB PENGIRIMAN --- */}
                    <TabsContent value="pengiriman" className="mt-8">
                        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                            <FilterPill label="Semua" active={deliveryFilter === 'semua'} onClick={() => setDeliveryFilter('semua')} />
                            <FilterPill label="Aktif" active={deliveryFilter === 'aktif'} onClick={() => setDeliveryFilter('aktif')} />
                            <FilterPill label="Selesai" active={deliveryFilter === 'selesai'} onClick={() => setDeliveryFilter('selesai')} />
                        </div>

                        <AnimatePresence mode="popLayout">
                            {filteredDeliveries.length > 0 ? (
                                <motion.div 
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-4"
                                >
                                    {filteredDeliveries.map((delivery) => (
                                        <DeliveryCard 
                                            key={delivery.id} 
                                            delivery={delivery} 
                                            onUpdateTiba={(d) => {
                                                setSelectedDelivery(d)
                                                setIsUpdateArrivalOpen(true)
                                            }}
                                            onShowLogistics={(d) => {
                                                setSelectedLogisticsDetail(d)
                                                setIsLogisticsDetailOpen(true)
                                            }}
                                            onEditArrival={(d) => setConfirmEditArrivalDelivery(d)}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <EmptyState 
                                    icon={Truck} 
                                    title="Belum ada pengiriman" 
                                    description="Catat pengiriman pertama setelah transaksi jual."
                                    actionLabel="+ Catat Pengiriman"
                                    onAction={() => setIsCreateDeliveryOpen(true)}
                                />
                            )}
                        </AnimatePresence>
                    </TabsContent>

                    {/* --- TAB LOSS REPORT --- */}
                    <TabsContent value="loss" className="mt-8">
                       <LossSummary lossReports={lossReports} />
                       
                       <div className="flex justify-between items-center mb-6">
                           <h2 className="font-display font-black text-sm uppercase tracking-widest text-[#4B6478]">Riwayat Kerugian</h2>
                           <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCreateLossOpen(true)}
                                className="h-8 rounded-xl border-white/5 bg-secondary/10 text-[9px] font-black uppercase tracking-widest text-[#F1F5F9]"
                           >
                               <Plus size={12} className="mr-1" /> Catat Kerugian
                           </Button>
                       </div>

                       <AnimatePresence mode="popLayout">
                            {groupedLossReports.length > 0 ? (
                                <motion.div 
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-4"
                                >
                                    {groupedLossReports.map((entry) => {
                                        const reportId = entry.mortality?.id || entry.shrinkage?.id || entry.other[0]?.id
                                        return (
                                            <LossCard 
                                                key={entry.id} 
                                                entry={entry} 
                                                onResolve={() => resolveLossMutation.mutate({ 
                                                    deliveryId: entry.delivery_id,
                                                    reportId: entry.delivery_id ? null : reportId
                                                })}
                                                isResolving={resolveLossMutation.isPending && (
                                                    entry.delivery_id 
                                                        ? resolveLossMutation.variables?.deliveryId === entry.delivery_id
                                                        : resolveLossMutation.variables?.reportId === reportId
                                                )}
                                            />
                                        )
                                    })}
                                </motion.div>
                            ) : (
                                <EmptyState 
                                    icon={AlertTriangle} 
                                    title="Tebas Kerugian" 
                                    description="Belum ada catatan kerugian lapangan."
                                    actionLabel="+ Catat Kerugian"
                                    onAction={() => setIsCreateLossOpen(true)}
                                    color="red"
                                />
                            )}
                       </AnimatePresence>
                    </TabsContent>
                </Tabs>
            </div>

            {/* --- SHEETS --- */}
            <CreateDeliverySheet 
                isOpen={isCreateDeliveryOpen} 
                onClose={() => setIsCreateDeliveryOpen(false)} 
            />
            <UpdateArrivalSheet 
                isOpen={isUpdateArrivalOpen} 
                onClose={() => {
                    setIsUpdateArrivalOpen(false)
                    setSelectedDelivery(null)
                }} 
                delivery={selectedDelivery}
            />
            <CreateLossSheet
                isOpen={isCreateLossOpen}
                onClose={() => {
                    setIsCreateLossOpen(false)
                    setInitialLossData(null)
                }}
                initialData={initialLossData}
            />
            <LogisticsDetailSheet
                isOpen={isLogisticsDetailOpen}
                onClose={() => {
                    setIsLogisticsDetailOpen(false)
                    setSelectedLogisticsDetail(null)
                }}
                delivery={selectedLogisticsDetail}
            />

            <AlertDialog open={!!confirmEditArrivalDelivery} onOpenChange={() => setConfirmEditArrivalDelivery(null)}>
                <AlertDialogContent className="bg-[#0C1319] border-white/10 rounded-[32px] max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white font-display text-xl font-black uppercase tracking-tight">Edit Data Kedatangan?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#4B6478] font-bold text-xs uppercase leading-relaxed">
                            Data kedatangan yang sudah tersimpan akan diubah. 
                            Pastikan data baru sudah benar sebelum menyimpan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 mt-4">
                        <AlertDialogCancel className="rounded-2xl border-white/5 bg-secondary/10 text-[#4B6478] font-black text-[10px] uppercase hover:bg-secondary/20">Batal</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                setSelectedDelivery(confirmEditArrivalDelivery)
                                setIsUpdateArrivalOpen(true)
                                setConfirmEditArrivalDelivery(null)
                            }}
                            className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase"
                        >
                            Ya, Edit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    )
}

// --- SUB-COMPONENTS ---

function SummaryCard({ label, value, icon: Icon, color, subLabel }) {
    const colorClasses = {
        emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/10",
        blue: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/10",
        red: "from-red-500/20 to-red-500/5 text-red-400 border-red-500/10"
    }

    return (
        <Card className={cn(
            "bg-gradient-to-br border shadow-xl rounded-[28px] p-6 flex-shrink-0 min-w-[200px] overflow-hidden relative group",
            colorClasses[color]
        )}>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                <Icon size={100} strokeWidth={1.5} />
            </div>
            <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl bg-current/10 border border-current/20")}>
                        <Icon size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
                </div>
                <div>
                   <h3 className="text-2xl font-black font-display tracking-tight text-white uppercase">{value}</h3>
                   <p className="text-[10px] font-bold text-[#4B6478] uppercase mt-1 tracking-widest">{subLabel}</p>
                </div>
            </div>
        </Card>
    )
}

function FilterPill({ label, active, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "h-10 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                active 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                    : "bg-secondary/10 text-[#4B6478] border border-white/5 hover:bg-secondary/20"
            )}
        >
            {label}
        </button>
    )
}

function DeliveryCard({ delivery, onUpdateTiba, onShowLogistics, onEditArrival }) {
    const statusMeta = {
        preparing: { label: 'Persiapan', bg: 'rgba(255,255,255,0.06)', color: '#94A3B8' },
        loading:   { label: 'Muat',      bg: 'rgba(251,191,36,0.12)',  color: '#FBBF24' },
        on_route:  { label: 'Di Jalan',  bg: 'rgba(16,185,129,0.12)',  color: '#34D399', pulse: true },
        arrived:   { label: 'Tiba',      bg: 'rgba(96,165,250,0.12)',  color: '#93C5FD' },
        completed: { label: 'Selesai',   bg: 'rgba(255,255,255,0.06)', color: '#4B6478' }
    }

    const meta = statusMeta[delivery.status] || statusMeta.preparing
    const farmName = delivery.sales?.purchases?.farms?.farm_name || 'Farm Unknown'
    const rpaName = delivery.sales?.rpa_clients?.rpa_name || 'Buyer Unknown'

    return (
        <motion.div variants={itemVariants}>
            <Card className="bg-[#111C24] border-white/5 rounded-[28px] overflow-hidden shadow-xl hover:border-white/10 transition-all group">
                <CardContent className="p-0">
                    {/* Header: Status + Date */}
                    <div className="p-6 pb-4 flex justify-between items-start">
                        <div className="flex items-center gap-2">
                             <div 
                                className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                                style={{ backgroundColor: meta.bg, color: meta.color }}
                             >
                                 {meta.pulse && (
                                     <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: meta.color }}></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: meta.color }}></span>
                                     </span>
                                 )}
                                 {meta.label}
                             </div>
                             <h4 className="font-display font-black text-white text-sm uppercase tracking-tight truncate max-w-[150px]">{rpaName}</h4>
                        </div>
                        <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">
                            {format(new Date(delivery.created_at), 'dd MMM yyyy')}
                        </span>
                    </div>

                    {/* Route Info */}
                    <div className="px-6 py-4 bg-white/[0.02] flex items-center gap-4">
                         <div className="flex-1 min-w-0">
                             <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1">Dari Kandang</p>
                             <p className="text-xs font-black text-[#94A3B8] truncate">{farmName}</p>
                         </div>
                         <div className="w-10 h-10 rounded-full border border-white/5 bg-secondary/10 flex items-center justify-center text-emerald-500/40">
                             <Truck size={18} strokeWidth={2.5} />
                         </div>
                         <div className="flex-1 min-w-0 text-right">
                             <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1">Ke Buyer</p>
                             <p className="text-xs font-black text-[#F1F5F9] truncate">{rpaName}</p>
                         </div>
                    </div>

                    {/* Details Grid */}
                    <div className="p-6 grid grid-cols-3 gap-6">
                         <DetailItem icon={Truck} label="Kendaraan" value={`${delivery.vehicle_type || '-'} ${delivery.vehicle_plate || ''}`} />
                         <DetailItem icon={User} label="Sopir" value={delivery.driver_name || '-'} />
                         <DetailItem icon={Package} label="Muatan" value={`${delivery.initial_count} ekor`} />
                    </div>

                    {/* Timeline (Conditional) */}
                    {(delivery.load_time || delivery.departure_time || delivery.arrival_time) && (
                        <div className="px-6 pb-6 mt-2">
                             <Timeline delivery={delivery} />
                        </div>
                    )}

                    {/* Completion results */}
                    {delivery.status === 'completed' && (
                        <div className="mx-6 mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1">Hasil Tiba</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-white">{delivery.arrived_count} Ekor</span>
                                    <span className="text-[10px] font-bold text-[#4B6478]">/ {delivery.arrived_weight_kg} kg</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1">Discrepancy</p>
                                <div className="flex items-center justify-end gap-3">
                                    {delivery.mortality_count > 0 && (
                                        <span className="text-[10px] font-black text-red-400">-{delivery.mortality_count} Mati</span>
                                    )}
                                    {delivery.shrinkage_kg > 0 && (
                                        <span className="text-[10px] font-black text-amber-500">-{delivery.shrinkage_kg} kg</span>
                                    )}
                                    {delivery.mortality_count === 0 && (delivery.shrinkage_kg || 0) <= 0 && (
                                        <span className="text-[10px] font-black text-emerald-400">AMAN</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-3 bg-white/[0.03] border-t border-white/5">
                        {delivery.status === 'on_route' ? (
                            <Button 
                                onClick={() => onUpdateTiba(delivery)}
                                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/10 gap-2"
                            >
                                <CheckCircle2 size={16} /> Catat Tiba
                            </Button>
                        ) : delivery.status === 'arrived' ? (
                            <Button 
                                variant="outline"
                                className="w-full h-12 border-white/10 bg-secondary/20 hover:bg-secondary/30 text-white font-black text-[11px] uppercase tracking-widest rounded-xl"
                            >
                                Selesaikan Pengiriman
                            </Button>
                        ) : delivery.status === 'completed' ? (
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    variant="outline"
                                    onClick={() => onEditArrival(delivery)}
                                    className="h-10 text-emerald-400 border-emerald-500/10 hover:bg-emerald-500/5 font-black text-[10px] uppercase tracking-widest gap-2"
                                >
                                    <Pencil size={12} /> Edit Kedatangan
                                </Button>
                                <Button 
                                    variant="ghost"
                                    onClick={() => onShowLogistics(delivery)}
                                    className="h-10 text-[#4B6478] hover:text-white font-black text-[10px] uppercase tracking-widest"
                                >
                                    Lihat Detail Logistik
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                variant="outline"
                                className="w-full h-12 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 font-black text-[11px] uppercase tracking-widest rounded-xl gap-2"
                            >
                                <Clock size={16} /> Update Status
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

function DetailItem({ icon: Icon, label, value }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[#4B6478]">
                <Icon size={12} strokeWidth={2.5} />
                <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">{value}</p>
        </div>
    )
}

function Timeline({ delivery }) {
    const steps = [
        { key: 'load_time', label: 'Muat', icon: Clock },
        { key: 'departure_time', label: 'Berangkat', icon: Truck },
        { key: 'arrival_time', label: 'Tiba', icon: MapPin },
        { key: 'completed_at', label: 'Selesai', icon: CheckCircle2 }
    ]

    // Mock completed_at if status is completed
    const data = { 
        ...delivery, 
        completed_at: delivery.status === 'completed' ? delivery.updated_at : null 
    }

    const currentIdx = steps.findIndex(s => !data[s.key])
    const activeIdx = currentIdx === -1 ? 4 : currentIdx

    return (
        <div className="relative pt-6">
            <div className="absolute top-[34px] left-[10%] right-[10%] h-[2px] bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(Math.max(0, activeIdx - 1) / 3) * 100}%` }}
                    className="h-full bg-emerald-500"
                />
            </div>
            <div className="relative flex justify-between">
                {steps.map((step, idx) => {
                    const isDone = data[step.key]
                    const isActive = idx === activeIdx - (isDone ? 0 : 0) // Logical check
                    const isNext = idx === activeIdx
                    
                    return (
                        <div key={step.key} className="flex flex-col items-center gap-3 relative z-10 w-1/4">
                            <div className={cn(
                                "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center bg-[#111C24]",
                                isDone ? "border-emerald-500 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                                isNext ? "border-emerald-500/50" : "border-white/10"
                            )}>
                                {isDone && <Check size={8} strokeWidth={4} className="text-[#111C24]" />}
                                {isNext && (
                                     <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                     </span>
                                )}
                            </div>
                            <div className="text-center space-y-1">
                                <p className={cn(
                                    "text-[8px] font-black uppercase tracking-widest",
                                    isDone ? "text-white" : isNext ? "text-emerald-400" : "text-[#4B6478]"
                                )}>{step.label}</p>
                                
                                <div className="flex items-center justify-center gap-1.5">
                                    <p className="text-[9px] font-bold text-[#4B6478] tabular-nums">
                                        {data[step.key] ? format(parseISO(data[step.key]), 'HH:mm') : '--:--'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction, color = "emerald" }) {
    const colors = {
        emerald: "text-emerald-500/30 bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20",
        red: "text-red-500/30 bg-red-500/5 border-red-500/10 hover:border-red-500/20"
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center"
        >
            <div className={cn("w-20 h-20 rounded-[32px] border flex items-center justify-center mb-6 transition-all", colors[color])}>
                <Icon size={32} strokeWidth={2} />
            </div>
            <h3 className="font-display text-lg font-black text-white uppercase tracking-tight">{title}</h3>
            <p className="text-[#4B6478] text-sm font-bold mt-2 max-w-[240px] leading-relaxed uppercase tracking-wide italic">{description}</p>
            <Button 
                variant="outline"
                onClick={onAction}
                className="mt-8 h-12 px-6 rounded-2xl border-white/10 bg-secondary/10 text-white font-black text-[11px] uppercase tracking-widest hover:bg-secondary/20"
            >
                {actionLabel}
            </Button>
        </motion.div>
    )
}

function LossSummary({ lossReports }) {
    const monthStats = useMemo(() => {
        const thisMonth = lossReports.filter(l => format(new Date(l.report_date), 'yyyy-MM') === format(new Date(), 'yyyy-MM'))
        // Only sum losses that are NOT mortality
        const total = thisMonth
            .filter(l => l.loss_type !== 'mortality')
            .reduce((acc, curr) => acc + (Number(curr.financial_loss) || 0), 0)
        
        const mortality = thisMonth.filter(l => l.loss_type === 'mortality').reduce((acc, curr) => acc + curr.chicken_count, 0)
        const weight = thisMonth.filter(l => l.loss_type === 'underweight' || l.loss_type === 'shrinkage').reduce((acc, curr) => acc + Number(curr.weight_loss_kg), 0)
        const complaint = thisMonth.filter(l => l.loss_type === 'buyer_complaint').length
        
        return { total, mortality, weight, complaint }
    }, [lossReports])

    return (
        <Card className="bg-red-500/[0.03] border-red-500/15 rounded-[28px] p-6 mb-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-red-500/5">
                <TrendingDown size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10 space-y-6">
                <div>
                   <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.25em] mb-2">Kerugian Bulan Ini</p>
                   <h3 className="font-display text-2xl font-black text-red-400 uppercase tracking-tight">
                       {formatIDR(monthStats.total)}
                   </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                    <SummaryPill label={`${monthStats.mortality} Ekor`} sub="Mortalitas" color="red" />
                    <SummaryPill label={`${monthStats.weight.toFixed(1)} kg`} sub="Susut Berat" color="amber" />
                    <SummaryPill label={`${monthStats.complaint} Kasus`} sub="Komplain" color="blue" />
                </div>
                
                {/* Warning if loss > 2% (mock check) */}
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mt-2">
                    <AlertTriangle className="text-red-400 mt-0.5" size={16} />
                    <p className="text-[10px] font-bold text-red-300 uppercase leading-relaxed tracking-wider">
                        Loss rate berada di angka cukup tinggi. Periksa kembali efisiensi armada dan penanganan di farm.
                    </p>
                </div>
            </div>
        </Card>
    )
}

function SummaryPill({ label, sub, color }) {
    const colors = {
        red: "bg-red-500/10 text-red-400 border-red-500/10",
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/10",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/10"
    }

    return (
        <div className={cn("px-4 py-2 rounded-xl border flex flex-col transition-all hover:scale-105", colors[color])}>
            <span className="text-xs font-black uppercase tracking-tight">{label}</span>
            <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest leading-none mt-1">{sub}</span>
        </div>
    )
}

function LossCard({ entry, onResolve, isResolving }) {
    if (!entry?.mortality && !entry?.shrinkage) return null

    // Robust property access with multiple fallbacks to prevent TypeError
    const rpaName = entry?.delivery?.sales?.rpa_clients?.rpa_name 
        || entry?.mortality?.delivery?.sales?.rpa_clients?.rpa_name 
        || entry?.shrinkage?.delivery?.sales?.rpa_clients?.rpa_name 
        || entry?.other?.[0]?.delivery?.sales?.rpa_clients?.rpa_name
        || '-'

    const driverName = entry?.delivery?.driver_name 
        || entry?.mortality?.delivery?.driver_name 
        || entry?.shrinkage?.delivery?.driver_name 
        || entry?.other?.[0]?.delivery?.driver_name
        || '-'

    const vehiclePlate = entry?.delivery?.vehicle_plate 
        || entry?.mortality?.delivery?.vehicle_plate 
        || entry?.shrinkage?.delivery?.vehicle_plate 
        || entry?.other?.[0]?.delivery?.vehicle_plate
        || '-'
    
    // Check resolve status: all must be resolved to be "Selesai"
    const isAllResolved = [entry.mortality, entry.shrinkage, ...entry.other]
        .filter(Boolean)
        .every(r => r.resolved)

    const totalFinancialLoss = (entry.shrinkage?.financial_loss || 0) +
                                entry.other.reduce((acc, r) => acc + (r.financial_loss || 0), 0)

    return (
        <motion.div variants={itemVariants}>
            <Card className="bg-[#111C24] border-white/5 rounded-[28px] overflow-hidden shadow-xl hover:border-white/10 transition-all group">
                {/* Header: RPA + Date + Status */}
                <div className="p-6 pb-4 flex justify-between items-start">
                    <div className="space-y-1">
                        <h4 className="font-display font-black text-white text-base uppercase tracking-tight truncate max-w-[250px]">{rpaName}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#4B6478] uppercase tracking-widest">
                            <Calendar size={10} />
                            {format(new Date(entry.report_date || new Date()), 'dd MMMM yyyy', { locale: id })}
                        </div>
                    </div>
                    {isAllResolved ? (
                         <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[9px] px-3 py-1 rounded-xl uppercase tracking-widest flex gap-1.5 whitespace-nowrap">
                             <Check size={10} strokeWidth={4} /> Selesai
                         </Badge>
                    ) : (
                        <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[9px] px-3 py-1 rounded-xl uppercase tracking-widest whitespace-nowrap">
                            Belum Selesai
                        </Badge>
                    )}
                </div>

                {/* Logistics Info Strip */}
                <div className="px-6 py-3 bg-white/[0.02] border-y border-white/5 flex items-center gap-4">
                     <div className="flex items-center gap-2">
                         <User size={12} className="text-[#4B6478]" />
                         <span className="text-[10px] font-black text-[#94A3B8] uppercase">{driverName}</span>
                     </div>
                     <div className="w-1 h-1 rounded-full bg-white/10" />
                     <div className="flex items-center gap-2">
                         <Truck size={12} className="text-[#4B6478]" />
                         <span className="text-[10px] font-black text-[#94A3B8] uppercase">{vehiclePlate}</span>
                     </div>
                </div>

                {/* Loss Details Grid: 2 Columns */}
                <div className="grid grid-cols-2 divide-x divide-white/5">
                    {/* Mortality Column */}
                    <div className="p-6 space-y-3">
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Mortalitas</span>
                        </div>
                        {entry.mortality ? (
                            <div className="space-y-1">
                                <p className="text-lg font-black text-red-400">{entry.mortality.chicken_count} <span className="text-[10px] uppercase ml-1">Ekor</span></p>
                                <p className="text-[9px] font-bold text-red-400/40 uppercase leading-tight">Rp 0 — TIDAK MEMPENGARUHI REVENUE</p>
                            </div>
                        ) : (
                            <p className="text-[10px] font-bold text-white/5 uppercase italic">Tidak ada</p>
                        )}
                    </div>

                    {/* Shrinkage Column */}
                    <div className="p-6 space-y-3">
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Susut Berat</span>
                        </div>
                        {entry.shrinkage ? (
                            <div className="space-y-1">
                                <p className="text-lg font-black text-amber-500">{entry.shrinkage.weight_loss_kg.toFixed(1)} <span className="text-[10px] uppercase ml-1">Kg</span></p>
                                <p className="text-[11px] font-bold text-amber-500/60 uppercase">Loss: {formatIDR(entry.shrinkage.financial_loss)}</p>
                            </div>
                        ) : (
                            <p className="text-[10px] font-bold text-white/5 uppercase italic">Tidak ada</p>
                        )}
                    </div>
                </div>

                {/* Footer: Total Loss + Resolve Action */}
                <div className="p-4 px-6 bg-white/[0.03] border-t border-white/5 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Total Kerugian</span>
                        <span className="text-base font-black text-red-400 leading-tight">{formatIDR(totalFinancialLoss)}</span>
                    </div>
                    {!isAllResolved && (
                        <Button 
                            size="sm"
                            disabled={isResolving}
                            onClick={onResolve}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl px-4 h-10 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all"
                        >
                            {isResolving ? 'PROSES...' : 'Tandai Selesai'}
                        </Button>
                    )}
                </div>
            </Card>
        </motion.div>
    )
}

// --- SHEET FORMS (STUBS) ---

function CreateDeliverySheet({ isOpen, onClose }) {
    const { tenant } = useAuth()
    const queryClient = useQueryClient()
    const [selectedSale, setSelectedSale] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    
    // UI State for toggles
    const [isManualVehicle, setIsManualVehicle] = useState(false)
    const [isManualDriver, setIsManualDriver] = useState(false)
    const [selectedVehicleId, setSelectedVehicleId] = useState('')
    const [selectedDriverId, setSelectedDriverId] = useState('')

    // --- DATA QUERIES ---
    const { data: sales = [] } = useQuery({
        queryKey: ['sales-without-deliveries', tenant?.id],
        queryFn: async () => {
             const { data, error } = await supabase
                .from('sales')
                .select(`
                    *,
                    rpa_clients ( rpa_name ),
                    purchases ( farms ( farm_name ) )
                `)
                .eq('tenant_id', tenant?.id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .limit(20)
            if (error) throw error
            return data
        },
        enabled: !!tenant?.id && isOpen
    })

    const { data: masterVehicles = [] } = useQuery({
        queryKey: ['vehicles-active', tenant?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('tenant_id', tenant?.id)
                .eq('status', 'aktif')
                .eq('is_deleted', false)
            return data || []
        },
        enabled: !!tenant?.id && isOpen
    })

    const { data: masterDrivers = [] } = useQuery({
        queryKey: ['drivers-active', tenant?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .eq('tenant_id', tenant?.id)
                .eq('status', 'aktif')
                .eq('is_deleted', false)
            return data || []
        },
        enabled: !!tenant?.id && isOpen
    })

    const selectedVehicle = useMemo(() => masterVehicles.find(v => v.id === selectedVehicleId), [masterVehicles, selectedVehicleId])
    const selectedDriver = useMemo(() => masterDrivers.find(d => d.id === selectedDriverId), [masterDrivers, selectedDriverId])

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!selectedSale) return
        
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        
        const payload = {
            tenant_id: tenant.id,
            sale_id: selectedSale.id,
            // Vehicle
            vehicle_id: isManualVehicle ? null : (selectedVehicleId || null),
            vehicle_type: isManualVehicle ? formData.get('vehicle_type') : (selectedVehicle?.vehicle_type || formData.get('vehicle_type')),
            vehicle_plate: isManualVehicle ? formData.get('vehicle_plate') : (selectedVehicle?.vehicle_plate || formData.get('vehicle_plate')),
            // Driver
            driver_id: isManualDriver ? null : (selectedDriverId || null),
            driver_name: isManualDriver ? formData.get('driver_name') : (selectedDriver?.full_name || formData.get('driver_name')),
            driver_phone: isManualDriver ? formData.get('driver_phone') : (selectedDriver?.phone || formData.get('driver_phone')),
            // Load
            initial_count: parseInt(formData.get('initial_count')),
            initial_weight_kg: parseFloat(formData.get('initial_weight_kg')),
            load_time: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx"),
            status: 'on_route',
            notes: formData.get('notes')
        }

        const { error } = await supabase.from('deliveries').insert(payload)
        
        if (error) {
            toast.error('Gagal mencatat pengiriman')
        } else {
            toast.success('Pengiriman berhasil dicatat!')
            queryClient.invalidateQueries(['deliveries'])
            onClose()
        }
        setIsLoading(false)
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[90vh] bg-[#0C1319] border-white/10 rounded-t-[40px] px-6 text-left overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">Catat Pengiriman Baru</SheetTitle>
                    <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">Daftarkan logistik untuk penjualan aktif</SheetDescription>
                </SheetHeader>

                <form onSubmit={handleCreate} className="space-y-6 pb-20">
                    <div className="space-y-5">
                        {/* 1. SALE SELECTOR */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Pilih Penjualan *</Label>
                            <Select onValueChange={(val) => setSelectedSale(sales.find(s => s.id === val))}>
                                <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white">
                                    <SelectValue placeholder="CARI TRANSAKSI JUAL" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111C24] border-white/10">
                                    {sales.map(sale => (
                                        <SelectItem key={sale.id} value={sale.id} className="text-xs font-black uppercase py-4 border-b border-white/5 last:border-0 hover:bg-white/5">
                                            <div className="flex flex-col gap-1">
                                                <span>{sale.rpa_clients?.rpa_name} · {format(new Date(sale.transaction_date), 'dd MMM')}</span>
                                                <span className="text-[9px] text-[#4B6478]">{sale.quantity} Ekor · {sale.total_weight_kg} kg</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedSale && (
                            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Asal Farm</p>
                                    <p className="text-[11px] font-black text-white uppercase">{selectedSale.purchases?.farms?.farm_name || '-'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Target Qty</p>
                                    <p className="text-[11px] font-black text-white uppercase">{selectedSale.quantity} EKOR / {selectedSale.total_weight_kg} KG</p>
                                </div>
                            </div>
                        )}

                        {/* 2. VEHICLE SECTION */}
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center px-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Kendaraan Armada</Label>
                                <div className="flex bg-secondary/20 p-1 rounded-lg">
                                    <button 
                                        type="button"
                                        onClick={() => setIsManualVehicle(false)}
                                        className={cn("px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all", !isManualVehicle ? "bg-white/10 text-white" : "text-[#4B6478]")}
                                    >
                                        Daftar
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setIsManualVehicle(true)}
                                        className={cn("px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all", isManualVehicle ? "bg-white/10 text-white" : "text-[#4B6478]")}
                                    >
                                        Manual
                                    </button>
                                </div>
                            </div>

                            {!isManualVehicle ? (
                                <Select onValueChange={setSelectedVehicleId} value={selectedVehicleId}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white shadow-inner">
                                        <SelectValue placeholder="PILIH KENDARAAN" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#111C24] border-white/10">
                                        {masterVehicles.length > 0 ? masterVehicles.map(v => (
                                            <SelectItem key={v.id} value={v.id} className="text-xs font-black uppercase py-3 group">
                                                <div className="flex justify-between items-center w-full">
                                                    <span>{v.vehicle_plate} · <span className="text-[#4B6478]">{v.vehicle_type}</span></span>
                                                    {v.capacity_ekor && <span className="text-[9px] opacity-40 ml-4">{v.capacity_ekor} EKOR</span>}
                                                </div>
                                            </SelectItem>
                                        )) : (
                                            <div className="p-4 text-center text-[9px] font-black text-[#4B6478] uppercase">Tidak ada kendaraan aktif</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                     <Select name="vehicle_type" defaultValue="truk">
                                        <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white shadow-inner">
                                            <SelectValue placeholder="JENIS" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#111C24] border-white/10">
                                            <SelectItem value="Truk" className="text-xs font-black uppercase">TRUK</SelectItem>
                                            <SelectItem value="Pickup" className="text-xs font-black uppercase">PICKUP</SelectItem>
                                            <SelectItem value="L300" className="text-xs font-black uppercase">L300</SelectItem>
                                            <SelectItem value="Motor" className="text-xs font-black uppercase">MOTOR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input name="vehicle_plate" placeholder="PLAT NOMOR" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
                                </div>
                            )}
                        </div>

                        {/* 3. DRIVER SECTION */}
                        <div className="space-y-3 pt-2">
                             <div className="flex justify-between items-center px-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Sopir Pengiriman</Label>
                                <div className="flex bg-secondary/20 p-1 rounded-lg">
                                    <button 
                                        type="button"
                                        onClick={() => setIsManualDriver(false)}
                                        className={cn("px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all", !isManualDriver ? "bg-white/10 text-white" : "text-[#4B6478]")}
                                    >
                                        Daftar
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setIsManualDriver(true)}
                                        className={cn("px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all", isManualDriver ? "bg-white/10 text-white" : "text-[#4B6478]")}
                                    >
                                        Manual
                                    </button>
                                </div>
                            </div>

                            {!isManualDriver ? (
                                <div className="space-y-3">
                                    <Select onValueChange={setSelectedDriverId} value={selectedDriverId}>
                                        <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white shadow-inner">
                                            <SelectValue placeholder="PILIH SOPIR" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#111C24] border-white/10">
                                            {masterDrivers.length > 0 ? masterDrivers.map(d => (
                                                <SelectItem key={d.id} value={d.id} className="text-xs font-black uppercase py-3">
                                                    <div className="flex justify-between items-center w-full">
                                                        <span>{d.full_name}</span>
                                                        <span className="text-[9px] opacity-40 ml-4">RP {d.wage_per_trip?.toLocaleString()}</span>
                                                    </div>
                                                </SelectItem>
                                            )) : (
                                                <div className="p-4 text-center text-[9px] font-black text-[#4B6478] uppercase">Tidak ada sopir aktif</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {selectedDriver && (
                                        <div className="px-3 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">INFO: Upah sopir ini Rp {selectedDriver.wage_per_trip?.toLocaleString()}/trip</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <Input name="driver_name" placeholder="NAMA SOPIR" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
                                    <Input name="driver_phone" placeholder="NO HP" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" />
                                </div>
                            )}
                        </div>

                        {/* 4. MEASUREMENTS */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Jumlah Ekor *</Label>
                                <Input required name="initial_count" type="number" defaultValue={selectedSale?.quantity || 0} className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Berat Total (kg) *</Label>
                                <Input required name="initial_weight_kg" type="number" step="0.1" defaultValue={selectedSale?.total_weight_kg || 0} className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" />
                            </div>
                        </div>

                        {/* 5. NOTES */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Catatan Tambahan</Label>
                            <Textarea name="notes" placeholder="INFO DETAIL PENGIRIMAN..." className="rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase p-4 min-h-[100px]" />
                        </div>
                    </div>

                    <SheetFooter>
                        <Button 
                            disabled={isLoading || !selectedSale}
                            className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all mt-4"
                        >
                            {isLoading ? 'MENCATAT...' : 'SIMPAN & MULAI PENGIRIMAN'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

function UpdateArrivalSheet({ isOpen, onClose, delivery }) {
    const { tenant } = useAuth()
    const queryClient = useQueryClient()
    const [isLoading, setIsLoading] = useState(false)
    const [arrivedQty, setArrivedQty] = useState('')
    const [mortalityQty, setMortalityQty] = useState(0)
    const [notes, setNotes] = useState('')
    const { updateTiba } = useUpdateDelivery()

    // Unit Selector State
    const [beratTiba, setBeratTiba] = useState(0)
    const [unitTiba, setUnitTiba] = useState('kg')
    const [unitOpen, setUnitOpen] = useState(false)

    // Driver Selector State
    const [selectedDriver, setSelectedDriver] = useState(null)
    const [driverManual, setDriverManual] = useState(false)
    const [driverOpen, setDriverOpen] = useState(false)
    const [driverName, setDriverName] = useState('')
    const [driverPhone, setDriverPhone] = useState('')
    const [driverLocked, setDriverLocked] = useState(true)
    const [showDriverConfirm, setShowDriverConfirm] = useState(false)

    // Digital Scale State
    const [inputMode, setInputMode] = useState('manual') // 'manual' | 'scale'
    const [scaleEntries, setScaleEntries] = useState([])
    const [newScaleEntry, setNewScaleEntry] = useState({ weightKita: '' })
    const [editingScaleId, setEditingScaleId] = useState(null)
    const [editScaleForm, setEditScaleForm] = useState({ weightKita: '' })
    
    // Vehicle Selection State
    const [selectedVehicle, setSelectedVehicle] = useState(null)
    const [vehicleManual, setVehicleManual] = useState(false)
    const [vehicleOpen, setVehicleOpen] = useState(false)
    const [vehiclePlate, setVehiclePlate] = useState('')
    const [vehicleType, setVehicleType] = useState('')
    const [vehicleLocked, setVehicleLocked] = useState(true)
    const [showVehicleConfirm, setShowVehicleConfirm] = useState(false)

    // Fetch Vehicles
    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles', tenant?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('vehicles')
                .select('id, vehicle_plate, vehicle_type')
                .eq('tenant_id', tenant?.id)
                .eq('status', 'aktif')
                .eq('is_deleted', false)
            return data || []
        },
        enabled: !!tenant?.id && isOpen
    })

    // Fetch Drivers
    const { data: drivers = [] } = useQuery({
        queryKey: ['drivers', tenant?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('drivers')
                .select('id, full_name, phone')
                .eq('tenant_id', tenant?.id)
                .eq('status', 'aktif')
                .eq('is_deleted', false)
            return data || []
        },
        enabled: !!tenant?.id && isOpen
    })

    // Conversion Logic
    const toKg = (val, unit) => {
        const n = parseFloat(val) || 0
        if (unit === 'ton') return n * 1000
        if (unit === 'rit') return n * 5000
        return n
    }

    const beratTibaKg = toKg(beratTiba, unitTiba)

    useEffect(() => {
        if (delivery && isOpen) {
            const isEdit = delivery.status === 'completed'
            
            // Now using both arrived and mortality counts
            const currentArrived = delivery.arrived_count || 0
            const currentMortality = delivery.mortality_count || 0
            
            setArrivedQty(isEdit ? currentArrived : delivery.initial_count)
            setMortalityQty(isEdit ? currentMortality : 0)
            setNotes(isEdit ? (delivery.notes || '') : '')
            
            // Initial Weight & Unit
            const kg = safeNum(isEdit ? delivery.arrived_weight_kg : delivery.initial_weight_kg)
            if (kg >= 1000) {
                setUnitTiba('ton')
                setBeratTiba(kg / 1000)
            } else {
                setUnitTiba('kg')
                setBeratTiba(kg)
            }

            // Initial Driver Info
            setDriverName(delivery.driver_name || '')
            setDriverPhone(delivery.driver_phone || '')
            if (delivery.driver_id) {
                setDriverManual(false)
            } else {
                setDriverManual(true)
            }

            // Initial Vehicle Info
            setVehiclePlate(delivery.vehicle_plate || '')
            setVehicleType(delivery.vehicle_type || '')
            if (delivery.vehicle_id) {
                setVehicleManual(false)
            } else {
                setVehicleManual(true)
            }

            // Lock Logic: Lock only if data already exists
            setVehicleLocked(!!delivery.vehicle_plate)
            setDriverLocked(!!delivery.driver_name)
        }
    }, [delivery, isOpen])

    // Sync Logistics Data
    useEffect(() => {
        if (delivery?.driver_id && drivers.length > 0) {
            const matched = drivers.find(d => d.id === delivery.driver_id)
            if (matched) {
                setSelectedDriver(matched)
                setDriverManual(false)
            }
        }
    }, [drivers, delivery])

    useEffect(() => {
        if (delivery?.vehicle_id && vehicles.length > 0) {
            const matched = vehicles.find(v => v.id === delivery.vehicle_id)
            if (matched) {
                setSelectedVehicle(matched)
                setVehicleManual(false)
            }
        }
    }, [vehicles, delivery])
    
    const initialKg = safeNum(delivery?.initial_weight_kg)
    const initialCount = safeNum(delivery?.initial_count)

    // Sync Handlers
    const handleArrivedChange = (val) => {
        setArrivedQty(val)
        const num = safeNum(val)
        setMortalityQty(Math.max(0, initialCount - num))
    }

    const handleMortalityChange = (val) => {
        setMortalityQty(val)
        const num = safeNum(val)
        setArrivedQty(Math.max(0, initialCount - num))
    }

    const tibaKg = beratTibaKg
    const tibaCount = safeNum(arrivedQty)
    const matiEkor = safeNum(mortalityQty)
    const susutKg = initialKg - tibaKg
    const susutPct = initialKg > 0
      ? (susutKg / initialKg * 100).toFixed(1)
      : 0

    // Scale Logic
    const totalScaleKita = scaleEntries.reduce((acc, e) => acc + (parseFloat(e.weightKita) || 0), 0)
    const selisihKg = initialKg - totalScaleKita

    const handleAddScale = () => {
        if (!newScaleEntry.weightKita) {
            toast.error("Berat kita wajib diisi")
            return
        }
        const entry = {
            id: Date.now(),
            weightKita: parseFloat(newScaleEntry.weightKita) || 0
        }
        setScaleEntries([...scaleEntries, entry])
        setNewScaleEntry({ weightKita: '' })
    }

    const removeItem = (id) => {
        setScaleEntries(scaleEntries.filter(e => e.id !== id))
    }

    const handleStartEdit = (e) => {
        setEditingScaleId(e.id)
        setEditScaleForm({
            weightKita: e.weightKita.toString()
        })
    }

    const handleSaveEdit = () => {
        setScaleEntries(scaleEntries.map(e => 
            e.id === editingScaleId 
                ? { 
                    ...e, 
                    weightKita: parseFloat(editScaleForm.weightKita) || 0
                }
                : e
        ))
        setEditingScaleId(null)
    }

    const handlePrintScale = () => {
        const printWindow = window.open('', '_blank')
        const farmName = delivery.sales?.purchases?.farms?.farm_name || '-'
        const rpaName = delivery.sales?.rpa_clients?.rpa_name || '-'
        const initialKg = safeNum(delivery?.initial_weight_kg)
        const totalScaleKita = scaleEntries.reduce((acc, e) => acc + (parseFloat(e.weightKita) || 0), 0)
        const selisihKg = initialKg - totalScaleKita
        const tanggal = format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Report Timbangan - ${delivery.vehicle_plate}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #10B981; }
              .brand { display: flex; align-items: center; gap: 12px; }
              .brand-dot { width: 36px; height: 36px; background: #10B981; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 16px; }
              .brand-name { font-size: 20px; font-weight: 700; color: #0f172a; }
              .brand-sub { font-size: 12px; color: #64748b; }
              .badge { background: #f0fdf4; color: #10B981; border: 1px solid #10B981; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; }
              h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
              .subtitle { font-size: 13px; color: #64748b; margin-bottom: 24px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
              .info-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
              .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-weight: 600; margin-bottom: 4px; }
              .info-value { font-size: 14px; font-weight: 600; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 20px; }
              thead { background: #0f172a; }
              th { padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-weight: 600; }
              td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
              tr:last-child td { border-bottom: none; }
              tr:nth-child(even) td { background: #f8fafc; }
              .no-col { color: #94a3b8; font-size: 12px; width: 48px; }
              .berat-col { font-weight: 600; color: #0f172a; }
              .total-card { background: #0f172a; border-radius: 10px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
              .total-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 4px; }
              .total-value { font-size: 28px; font-weight: 800; color: #10B981; }
              .selisih-card { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
              .selisih-label { font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.08em; }
              .selisih-value { font-size: 18px; font-weight: 700; color: #d97706; }
              .footer { text-align: center; font-size: 11px; color: #94a3b8; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="brand">
                <div class="brand-dot">T</div>
                <div>
                  <div class="brand-name">TernakOS</div>
                  <div class="brand-sub">Broker Dashboard</div>
                </div>
              </div>
              <span class="badge">Data Timbangan Digital</span>
            </div>

            <h1>Report Timbangan</h1>
            <p class="subtitle">Dokumen resmi penimbangan ayam potong</p>

            <div class="info-grid">
              <div class="info-card">
                <div class="info-label">Kandang</div>
                <div class="info-value">${farmName}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Buyer (RPA)</div>
                <div class="info-value">${rpaName}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Kendaraan</div>
                <div class="info-value">${delivery.vehicle_plate} / ${delivery.vehicle_type || '-'}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Tanggal & Waktu</div>
                <div class="info-value">${tanggal}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="no-col">No</th>
                  <th>Berat Timbangan (kg)</th>
                </tr>
              </thead>
              <tbody>
                ${scaleEntries.map((e, index) => `
                  <tr>
                    <td class="no-col">${index + 1}</td>
                    <td class="berat-col">${e.weightKita.toFixed(2)} kg</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-card">
              <div>
                <div class="total-label">Total Timbangan Kita</div>
                <div class="total-value">${totalScaleKita.toFixed(2)} kg</div>
              </div>
              <div style="text-align:right">
                <div class="total-label">Jumlah Timbangan</div>
                <div style="font-size:20px;font-weight:700;color:#64748b">${scaleEntries.length}x</div>
              </div>
            </div>

            <div class="selisih-card">
              <div class="selisih-label">Selisih dari Berat Kirim (${initialKg.toFixed(2)} kg)</div>
              <div class="selisih-value" style="color: ${selisihKg > 0 ? '#d97706' : selisihKg === 0 ? '#10b981' : '#ef4444'}">
                ${selisihKg === 0 ? 'Pas ✓' : (selisihKg > 0 ? `- ${selisihKg.toFixed(2)}` : `+ ${Math.abs(selisihKg).toFixed(2)}`)} kg
              </div>
            </div>

            <div class="footer">
              Dicetak via TernakOS &mdash; ${new Date().toLocaleString('id-ID')} &mdash; Dokumen ini sah tanpa tanda tangan
            </div>
            
            <script>
              window.onload = function() {
                window.focus();
                window.print();
              };
            </script>
          </body>
          </html>
        `)
        
        printWindow.document.close()
    }

    const handleUpdate = async (e) => {
        if (e && e.preventDefault) e.preventDefault()
        console.log('SUBMIT DIPANGGIL')
        
        // Validation: Berat wajib > 0. Ekor Mati (tibaCount) allowed to be initialCount (0 mortality)
        if (!tibaKg || tibaKg <= 0) {
            toast.error("Berat tiba wajib diisi")
            return
        }

        setIsLoading(true)
        
        try {
            console.log('Step 1: update deliveries')
            if (delivery.status === 'completed') {
                // Direct UPDATE for existing delivery
                const updatePayload = {
                    arrived_count: tibaCount,
                    arrived_weight_kg: tibaKg,
                    mortality_count: matiEkor > 0 ? matiEkor : 0,
                    notes: notes,
                }

                // Only update logistics if they were UNLOCKED and modified
                if (!vehicleLocked) {
                    updatePayload.vehicle_id = selectedVehicle?.id || null
                    updatePayload.vehicle_plate = selectedVehicle?.vehicle_plate || vehiclePlate
                    updatePayload.vehicle_type = selectedVehicle?.vehicle_type || vehicleType
                }

                if (!driverLocked) {
                    updatePayload.driver_id = selectedDriver?.id || null
                    updatePayload.driver_name = selectedDriver?.full_name || driverName
                    updatePayload.driver_phone = selectedDriver?.phone || driverPhone
                }

                const { error } = await supabase
                    .from('deliveries')
                    .update(updatePayload)
                    .eq('id', delivery.id)

                if (error) throw error
                toast.success('Data kedatangan berhasil diperbarui')
            } else {
                // Standard arrival via hook
                const arrivalPayload = {
                    deliveryId: delivery.id,
                    arrivedCount: arrivedQty,
                    arrivedWeight: tibaKg,
                    notes: notes,
                }

                if (!vehicleLocked) {
                    arrivalPayload.vehicleId = selectedVehicle?.id || null
                    arrivalPayload.vehiclePlate = selectedVehicle?.vehicle_plate || vehiclePlate
                    arrivalPayload.vehicleType = selectedVehicle?.vehicle_type || vehicleType
                }

                if (!driverLocked) {
                    arrivalPayload.driverId = selectedDriver?.id || null
                    arrivalPayload.driverName = selectedDriver?.full_name || driverName
                    arrivalPayload.driverPhone = selectedDriver?.phone || driverPhone
                }

                await updateTiba(arrivalPayload)
                toast.success('Kedatangan berhasil dicatat!')
            }

            // Explicit sync variables
            const arrivedCount = tibaCount
            const arrivedWeightKg = tibaKg

            console.log('Step 2: delete old loss_reports')
            // 1. Hapus loss_reports lama untuk delivery ini (hindari duplikasi)
            await supabase
              .from('loss_reports')
              .delete()
              .eq('delivery_id', delivery.id)
              .eq('tenant_id', tenant.id)

            // 2. Hitung nilai
            const mortalityCount = (delivery?.initial_count ?? 0) - arrivedCount
            const shrinkageKg = (delivery?.initial_weight_kg ?? 0) - arrivedWeightKg
            const pricePerKg = delivery?.sales?.price_per_kg ?? 0
            const avgWeightKg = (delivery?.initial_count || 0) > 0
              ? ((delivery?.initial_weight_kg || 0) / (delivery?.initial_count || 1))
              : 1.85

            console.log('Step 3: insert mortality/shrinkage')
            // 3. Insert mortality jika ada
            if (mortalityCount > 0) {
              const { error: mortError } = await supabase
                .from('loss_reports')
                .insert({
                  tenant_id: tenant.id,
                  delivery_id: delivery.id,
                  sale_id: delivery.sale_id,
                  loss_type: 'mortality',
                  chicken_count: mortalityCount,
                  weight_loss_kg: mortalityCount * avgWeightKg,
                  price_per_kg: pricePerKg,
                  financial_loss: 0,
                  report_date: new Date().toISOString().split('T')[0],
                  description: 'Laporan mortalitas — tidak mempengaruhi revenue',
                  resolved: false
                })
              if (mortError) console.error('Error insert mortality:', mortError)
              else console.log('✅ Mortality loss_report inserted:', mortalityCount, 'ekor')
            }

            // 4. Insert shrinkage jika ada
            if (shrinkageKg > 0) {
              const { error: shrinkError } = await supabase
                .from('loss_reports')
                .insert({
                  tenant_id: tenant.id,
                  delivery_id: delivery.id,
                  sale_id: delivery.sale_id,
                  loss_type: 'shrinkage',
                  chicken_count: 0,
                  weight_loss_kg: shrinkageKg,
                  price_per_kg: pricePerKg,
                  financial_loss: Math.round(shrinkageKg * pricePerKg),
                  report_date: new Date().toISOString().split('T')[0],
                  description: 'Auto-generated dari Catat Kedatangan',
                  resolved: false
                })
              if (shrinkError) console.error('Error insert shrinkage:', shrinkError)
              else console.log('✅ Shrinkage loss_report inserted:', shrinkageKg, 'kg')
            }

            // 5. Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['loss-reports'] })
            queryClient.invalidateQueries({ queryKey: ['broker-stats'] })
            queryClient.invalidateQueries(['deliveries'])
            onClose()
        } catch (err) {
            console.error('Error update arrival:', err)
            toast.error('Gagal memperbarui data: ' + err.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (!delivery) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full md:w-[520px] bg-[#0C1319] border-l border-white/8 p-8 overflow-y-auto">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">CATAT KEDATANGAN</SheetTitle>
                    <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">Konfirmasi jumlah dan berat tiba di lokasi buyer</SheetDescription>
                </SheetHeader>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-6">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] mb-1 px-1">
                         <span>Target Pengiriman</span>
                     </div>
                     <div className="bg-[#111C24] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                         <div>
                             <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">Kiriman Dari</p>
                             <p className="text-xs font-black text-white">{delivery.sales?.purchases?.farms?.farm_name || '-'}</p>
                         </div>
                         <ArrowRightLeft className="text-[#4B6478]" size={16} />
                         <div className="text-right">
                             <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">Target Tiba</p>
                             <p className="text-xs font-black text-white uppercase">
                                 {formatEkor(delivery.initial_count)} / {formatWeight(delivery.initial_weight_kg)}
                             </p>
                         </div>
                     </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6 pb-20">
                    {/* ROW 2: Ekor Tiba & Ekor Mati */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Ekor Tiba *</Label>
                            <InputNumber 
                                value={arrivedQty} 
                                onChange={handleArrivedChange}
                                placeholder={delivery.initial_count}
                                className="text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Ekor Mati</Label>
                            <InputNumber 
                                value={mortalityQty} 
                                onChange={handleMortalityChange}
                                placeholder="0"
                                className="text-white"
                            />
                        </div>
                    </div>

                    {/* ROW 3: Berat Tiba Full Width */}
                    <div className="space-y-2">
                         <div className="flex justify-between items-center mb-1">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Berat Tiba *</Label>
                             <div className="flex bg-[#111C24] p-0.5 rounded-lg border border-white/5">
                                 <button
                                     type="button"
                                     onClick={() => setInputMode('manual')}
                                     className={cn(
                                         "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                                         inputMode === 'manual' ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-white"
                                     )}
                                 >
                                     Langsung
                                 </button>
                                 <button
                                     type="button"
                                     onClick={() => setInputMode('scale')}
                                     className={cn(
                                         "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                                         inputMode === 'scale' ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-white"
                                     )}
                                 >
                                     Timbangan
                                 </button>
                             </div>
                         </div>

                         <div className="h-full">
                             {inputMode === 'manual' ? (
                                 <div style={{
                                     display: 'grid',
                                     gridTemplateColumns: '1fr 90px',
                                     gap: 8
                                 }}>
                                     <InputNumber
                                         value={beratTiba}
                                         onChange={setBeratTiba}
                                         step={unitTiba === 'kg' ? 10 : 0.01}
                                         min={0}
                                         placeholder="0"
                                         className="text-[#F1F5F9]"
                                     />
                                     <div style={{position: 'relative'}}>
                                         <button
                                             type="button"
                                             onClick={() => setUnitOpen(!unitOpen)}
                                             style={{
                                                 width: '100%', height: '50px',
                                                 padding: '0 12px',
                                                 background: 'hsl(var(--secondary))',
                                                 border: '1px solid hsl(var(--border))',
                                                 borderRadius: '10px',
                                                 fontSize: '14px', fontWeight: 700,
                                                 color: 'hsl(var(--foreground))',
                                                 cursor: 'pointer',
                                                 display: 'flex',
                                                 justifyContent: 'space-between',
                                                 alignItems: 'center'
                                             }}
                                         >
                                           <span style={{textTransform: 'lowercase'}} className="text-[#F1F5F9]">{unitTiba}</span>
                                             <ChevronDown size={13} color="hsl(var(--muted-foreground))" />
                                         </button>
                                         {unitOpen && (
                                            <>
                                                <div style={{position:'fixed',inset:0,zIndex:40}} onClick={() => setUnitOpen(false)} />
                                                <div style={{
                                                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                                                    background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '10px',
                                                    overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                                                }}>
                                                    {['kg','ton','rit'].map((unit) => (
                                                        <button
                                                            key={unit} type="button"
                                                            onClick={() => {
                                                                const currentKg = toKg(beratTiba, unitTiba)
                                                                if (unit === 'ton') setBeratTiba(currentKg / 1000)
                                                                else if (unit === 'rit') setBeratTiba(currentKg / 5000)
                                                                else setBeratTiba(currentKg)
                                                                setUnitTiba(unit); setUnitOpen(false)
                                                            }}
                                                            className={cn(
                                                                "w-full px-4 py-3 text-left text-sm font-bold transition-colors border-b border-white/5 last:border-0",
                                                                unitTiba === unit ? "bg-emerald-500/10 text-emerald-500" : "text-[#4B6478] hover:bg-white/5"
                                                            )}
                                                        >
                                                            {unit}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                         )}
                                     </div>
                                 </div>
                             ) : (
                                 <div className="h-[50px] flex items-center px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                     Mode Timbangan Aktif
                                 </div>
                             )}
                         </div>
                    </div>

                    {/* Scale Mode UI - Moved outside the small grid for better layout */}
                    {inputMode === 'scale' && (
                        <div className="space-y-4 pt-2">
                            {/* List Timbangan */}
                            <div className="rounded-xl border border-white/5 bg-[#111C24] overflow-hidden">
                                <div className="p-3 bg-white/[0.02] border-b border-white/5 grid grid-cols-[30px_1fr_60px] gap-2 items-center text-[9px] font-black uppercase tracking-widest text-[#4B6478]">
                                    <span>No</span>
                                    <span>Kita (kg)</span>
                                    <span className="text-right">Action</span>
                                </div>
                                
                                <div className="max-h-[300px] overflow-y-auto">
                                    {scaleEntries.length === 0 ? (
                                        <div className="p-8 text-center text-[#4B6478] text-[10px] uppercase font-bold italic">
                                            Belum ada data timbangan
                                        </div>
                                    ) : (
                                        scaleEntries.map((e, index) => (
                                            <div key={e.id} className="p-3 border-b border-white/5 grid grid-cols-[30px_1fr_60px] gap-2 items-center transition-all group relative">
                                                <span className="text-[10px] font-black text-[#4B6478]">{index + 1}</span>
                                                
                                                {editingScaleId === e.id ? (
                                                    <>
                                                        <InputNumber 
                                                            value={editScaleForm.weightKita}
                                                            onChange={(v) => setEditScaleForm({ ...editScaleForm, weightKita: v })}
                                                            className="text-white h-7 bg-[#0C1319] border-emerald-500/50 text-[10px] text-emerald-400 font-black p-1"
                                                            onKeyDown={(evt) => evt.key === 'Enter' && (evt.preventDefault(), handleSaveEdit())}
                                                        />
                                                        <div className="flex justify-end gap-1">
                                                            <button type="button" onClick={handleSaveEdit} className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600">
                                                                <Check size={10} />
                                                            </button>
                                                            <button type="button" onClick={() => setEditingScaleId(null)} className="p-1 rounded bg-red-500 text-white hover:bg-red-600">
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-xs font-black text-emerald-400">{e.weightKita}</span>
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button type="button" onClick={() => handleStartEdit(e)} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10">
                                                                <PencilLine size={12} />
                                                            </button>
                                                            <button type="button" onClick={() => removeItem(e.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* New Row Input */}
                                <div className="p-3 bg-emerald-500/5 grid grid-cols-[1fr_40px] gap-2 items-center border-t border-white/10">
                                    <InputNumber 
                                        value={newScaleEntry.weightKita}
                                        onChange={(v) => setNewScaleEntry({ ...newScaleEntry, weightKita: v })}
                                        placeholder="Kita"
                                        className="text-white h-8 bg-[#0C1319] border-white/5 text-xs text-emerald-400 font-black focus:border-emerald-500/50"
                                        onKeyDown={(evt) => evt.key === 'Enter' && (evt.preventDefault(), handleAddScale())}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddScale}
                                        className="h-8 w-8 flex items-center justify-center bg-emerald-500 rounded-lg text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        <Plus size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            {/* Summary Card */}
                            {scaleEntries.length > 0 && (
                                <div className="p-5 rounded-2xl bg-[#111C24] border border-white/5 space-y-4 relative overflow-hidden group/card shadow-2xl">
                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                        <div>
                                            <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">Total Timbangan Kita</p>
                                            <p className="text-xl font-black text-emerald-400 tabular-nums">
                                                {totalScaleKita.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                                                <span className="text-[10px] ml-1 opacity-60">kg</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">Kurang Dari Kirim</p>
                                            {selisihKg === 0 ? (
                                                <p className="text-xl font-black text-emerald-400">Pas ✓</p>
                                            ) : (
                                                <p className={cn(
                                                    "text-xl font-black tabular-nums",
                                                    selisihKg > 0 ? "text-amber-500" : "text-red-400"
                                                )}>
                                                    {selisihKg > 0 ? `- ${selisihKg.toFixed(2)}` : `+ ${Math.abs(selisihKg).toFixed(2)}`}
                                                    <span className="text-[10px] ml-1 opacity-60">kg</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2 relative z-10">
                                        <Button 
                                            type="button"
                                            onClick={() => {
                                               setBeratTiba(totalScaleKita)
                                               setUnitTiba('kg')
                                               toast.success('Total timbangan berhasil dipakai sebagai berat tiba')
                                            }}
                                            className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 group/btn"
                                        >
                                            <Check size={14} className="mr-2 group-hover/btn:scale-125 transition-transform" />
                                            PAKAI TOTAL INI
                                        </Button>
                                        <Button 
                                            type="button"
                                            variant="outline"
                                            onClick={handlePrintScale}
                                            className="w-12 h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl active:scale-90 transition-all"
                                        >
                                            <Printer size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ROW 4: Ringkasan 2x2 */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#4B6478] px-1">
                            <span>Ringkasan Kedatangan</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#111C24] p-3 rounded-xl border border-white/5">
                                <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">Susut Berat</p>
                                <p className={cn("text-sm font-black tabular-nums", susutKg > 0 ? "text-amber-400" : "text-emerald-400")}>
                                    {formatWeight(susutKg)} <span className="text-[10px] opacity-60">({susutPct}%)</span>
                                </p>
                            </div>
                            <div className="bg-[#111C24] p-3 rounded-xl border border-white/5">
                                <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">Mati di Jalan</p>
                                <p className={cn("text-sm font-black tabular-nums", matiEkor > 0 ? "text-red-400" : "text-emerald-400")}>
                                    {matiEkor} <span className="text-[10px] opacity-60">ekor</span>
                                </p>
                            </div>
                            <div className="bg-[#111C24] p-3 rounded-xl border border-white/5">
                                <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">Ekor Dikirim</p>
                                <p className="text-sm font-black text-white tabular-nums">
                                    {delivery.initial_count} <span className="text-[10px] opacity-60">ekor</span>
                                </p>
                            </div>
                            <div className="bg-[#111C24] p-3 rounded-xl border border-white/5">
                                <p className="text-[9px] font-black text-[#4B6478] uppercase mb-1">Berat Dikirim</p>
                                <p className="text-sm font-black text-white tabular-nums">
                                    {formatWeight(initialKg)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {matiEkor > 0 && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-[10px] font-black text-red-400 uppercase tracking-widest">
                         <AlertCircle size={14} className="shrink-0" />
                         <span>Loss report akan dibuat otomatis untuk {matiEkor} ekor</span>
                      </div>
                    )}

                    {/* ROW 5: Detail Pengiriman */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Detail Pengiriman</Label>
                        
                        <div className="space-y-4">
                            {/* KENDARAAN */}
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-[#4B6478] tracking-widest ml-1 text-emerald-500">Kendaraan *</Label>
                                {delivery?.vehicle_plate && vehicleLocked ? (
                                    <div 
                                        className="w-full h-14 px-4 rounded-xl bg-[#111C24] border border-white/5 flex justify-between items-center opacity-75 group transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Lock size={12} className="text-[#4B6478]" />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase text-white">{delivery.vehicle_plate}</span>
                                                <span className="text-[10px] font-bold uppercase text-[#4B6478]">{delivery.vehicle_type || 'ARMADA'}</span>
                                            </div>
                                        </div>
                                        <Button 
                                            type="button"
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8 rounded-lg hover:bg-white/5 text-[#4B6478] hover:text-amber-500"
                                            onClick={() => setShowVehicleConfirm(true)}
                                            title="Ganti kendaraan"
                                        >
                                            <Unlock size={14} />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-1.5 mb-1 bg-[#111C24] p-0.5 rounded-xl border border-white/5">
                                            <button 
                                                type="button" 
                                                onClick={() => { setVehicleManual(false); setSelectedVehicle(null) }}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                    !vehicleManual ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-white"
                                                )}
                                            >Armada</button>
                                            <button 
                                                type="button" 
                                                onClick={() => { setVehicleManual(true); setSelectedVehicle(null) }}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                    vehicleManual ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-white"
                                                )}
                                            >Manual</button>
                                        </div>

                                        {!vehicleManual ? (
                                            <Popover open={vehicleOpen} onOpenChange={setVehicleOpen}>
                                                <PopoverTrigger asChild>
                                                    <button type="button" className="w-full h-12 px-4 rounded-xl bg-[#111C24] border border-white/5 flex justify-between items-center text-xs font-black text-white hover:border-white/20 transition-all uppercase">
                                                        <span>{selectedVehicle ? `${selectedVehicle.vehicle_plate} · ${selectedVehicle.vehicle_type}` : 'PILIH KENDARAAN'}</span>
                                                        <ChevronsUpDown size={14} className="opacity-50" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#0C1319] border-white/10" align="start">
                                                    <Command className="bg-transparent">
                                                        <CommandInput placeholder="Cari plat..." className="h-10 border-none font-bold text-xs" />
                                                        <CommandEmpty className="py-6 text-center text-[10px] uppercase font-black text-[#4B6478]">Kendaraan tidak ditemukan</CommandEmpty>
                                                        <CommandGroup className="max-h-64 overflow-y-auto">
                                                            {vehicles.map(v => (
                                                                <CommandItem 
                                                                    key={v.id} 
                                                                    onSelect={() => { setSelectedVehicle(v); setVehicleOpen(false) }}
                                                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 rounded-lg border-b border-white/5"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black uppercase text-white">{v.vehicle_plate}</span>
                                                                        <span className="text-[10px] font-bold uppercase text-[#4B6478]">{v.vehicle_type}</span>
                                                                    </div>
                                                                    {selectedVehicle?.id === v.id && <Check size={14} className="text-emerald-500" />}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input 
                                                    placeholder="PLAT NOMOR" 
                                                    value={vehiclePlate}
                                                    onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                                                    className="h-12 bg-[#111C24] border-white/10 text-xs font-black text-white uppercase"
                                                />
                                                <Input 
                                                    placeholder="JENIS" 
                                                    value={vehicleType}
                                                    onChange={e => setVehicleType(e.target.value)}
                                                    className="h-12 bg-[#111C24] border-white/10 text-xs font-black text-white"
                                                />
                                            </div>
                                        )}
                                        
                                        {delivery?.vehicle_plate && !vehicleLocked && (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setVehicleLocked(true)
                                                    if (delivery.vehicle_id) {
                                                        const matched = vehicles.find(v => v.id === delivery.vehicle_id)
                                                        setSelectedVehicle(matched || null)
                                                        setVehicleManual(false)
                                                    } else {
                                                        setVehiclePlate(delivery.vehicle_plate)
                                                        setVehicleType(delivery.vehicle_type)
                                                        setVehicleManual(true)
                                                    }
                                                }}
                                                className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-400 mt-1 flex items-center gap-1.5 transition-colors"
                                            >
                                                <Lock size={10} />
                                                Batal Ganti
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* SOPIR */}
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-[#4B6478] tracking-widest ml-1 text-emerald-500">Sopir *</Label>
                                {delivery?.driver_name && driverLocked ? (
                                    <div 
                                        className="w-full h-14 px-4 rounded-xl bg-[#111C24] border border-white/5 flex justify-between items-center opacity-75 group transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Lock size={12} className="text-[#4B6478]" />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase text-white">{delivery.driver_name}</span>
                                                <span className="text-[10px] font-bold uppercase text-[#4B6478]">{delivery.driver_phone || 'TANPA HP'}</span>
                                            </div>
                                        </div>
                                        <Button 
                                            type="button"
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8 rounded-lg hover:bg-white/5 text-[#4B6478] hover:text-amber-500"
                                            onClick={() => setShowDriverConfirm(true)}
                                            title="Ganti sopir"
                                        >
                                            <Unlock size={14} />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-1.5 mb-1 bg-[#111C24] p-0.5 rounded-xl border border-white/5">
                                            <button 
                                                type="button" 
                                                onClick={() => { setDriverManual(false); setSelectedDriver(null) }}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                    !driverManual ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-white"
                                                )}
                                            >Terdaftar</button>
                                            <button 
                                                type="button" 
                                                onClick={() => { setDriverManual(true); setSelectedDriver(null) }}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                    driverManual ? "bg-emerald-500 text-white shadow-lg" : "text-[#4B6478] hover:text-white"
                                                )}
                                            >Manual</button>
                                        </div>

                                        {!driverManual ? (
                                            <Popover open={driverOpen} onOpenChange={setDriverOpen}>
                                                <PopoverTrigger asChild>
                                                    <button type="button" className="w-full h-12 px-4 rounded-xl bg-[#111C24] border border-white/5 flex justify-between items-center text-xs font-black text-white hover:border-white/20 transition-all uppercase">
                                                        <span>{selectedDriver ? `${selectedDriver.full_name} · ${selectedDriver.phone || '-'}` : 'PILIH SOPIR'}</span>
                                                        <ChevronsUpDown size={14} className="opacity-50" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#0C1319] border-white/10" align="start">
                                                    <Command className="bg-transparent">
                                                        <CommandInput placeholder="Cari nama..." className="h-10 border-none font-bold text-xs" />
                                                        <CommandEmpty className="py-6 text-center text-[10px] uppercase font-black text-[#4B6478]">Sopir tidak ditemukan</CommandEmpty>
                                                        <CommandGroup className="max-h-64 overflow-y-auto">
                                                            {drivers.map(d => (
                                                                <CommandItem 
                                                                    key={d.id} 
                                                                    onSelect={() => { setSelectedDriver(d); setDriverOpen(false) }}
                                                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 rounded-lg border-b border-white/5"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-black uppercase text-white">{d.full_name}</span>
                                                                        <span className="text-[10px] font-bold uppercase text-[#4B6478]">{d.phone || 'TANPA HP'}</span>
                                                                    </div>
                                                                    {selectedDriver?.id === d.id && <Check size={14} className="text-emerald-500" />}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input 
                                                    placeholder="NAMA SOPIR" 
                                                    value={driverName}
                                                    onChange={e => setDriverName(e.target.value)}
                                                    className="h-12 bg-[#111C24] border-white/10 text-xs font-black text-white"
                                                />
                                                <Input 
                                                    placeholder="NO HP" 
                                                    value={driverPhone}
                                                    onChange={e => setDriverPhone(e.target.value)}
                                                    className="h-12 bg-[#111C24] border-white/10 text-xs font-black text-white"
                                                />
                                            </div>
                                        )}

                                        {delivery?.driver_name && !driverLocked && (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setDriverLocked(true)
                                                    if (delivery.driver_id) {
                                                        const matched = drivers.find(d => d.id === delivery.driver_id)
                                                        setSelectedDriver(matched || null)
                                                        setDriverManual(false)
                                                    } else {
                                                        setDriverName(delivery.driver_name)
                                                        setDriverPhone(delivery.driver_phone)
                                                        setDriverManual(true)
                                                    }
                                                }}
                                                className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-400 mt-1 flex items-center gap-1.5 transition-colors"
                                            >
                                                <Lock size={10} />
                                                Batal Ganti
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* AlertDialogs */}
                            <AlertDialog open={showVehicleConfirm} onOpenChange={setShowVehicleConfirm}>
                                <AlertDialogContent className="bg-[#0C1319] border-white/10 max-w-[400px]">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white font-display text-xl font-black uppercase">Ganti Kendaraan?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-[#4B6478] font-bold text-xs leading-relaxed mt-2">
                                            Kendaraan ini sudah diisi saat transaksi dibuat. <span className="text-amber-500">Ganti hanya jika ada perubahan di lapangan (rusak, dll).</span>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-6 gap-3">
                                        <AlertDialogCancel className="h-12 rounded-xl bg-[#111C24] border-white/5 text-[#4B6478] font-black uppercase text-[10px] hover:bg-white/5 hover:text-white transition-all">Batal</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={() => { setVehicleLocked(false); setShowVehicleConfirm(false) }}
                                            className="h-12 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-black uppercase text-[10px] shadow-lg shadow-amber-500/20 transition-all"
                                        >Ya, Ganti</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog open={showDriverConfirm} onOpenChange={setShowDriverConfirm}>
                                <AlertDialogContent className="bg-[#0C1319] border-white/10 max-w-[400px]">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white font-display text-xl font-black uppercase">Ganti Sopir?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-[#4B6478] font-bold text-xs leading-relaxed mt-2">
                                            Sopir ini sudah diisi saat transaksi dibuat. <span className="text-amber-500">Ganti hanya jika ada perubahan di lapangan.</span>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-6 gap-3">
                                        <AlertDialogCancel className="h-12 rounded-xl bg-[#111C24] border-white/5 text-[#4B6478] font-black uppercase text-[10px] hover:bg-white/5 hover:text-white transition-all">Batal</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={() => { setDriverLocked(false); setShowDriverConfirm(false) }}
                                            className="h-12 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-black uppercase text-[10px] shadow-lg shadow-amber-500/20 transition-all"
                                        >Ya, Ganti</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    {/* ROW 6: Catatan */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Catatan</Label>
                        <Textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="CATATAN KEDATANGAN..." 
                            className="rounded-2xl bg-[#111C24] border-white/10 font-black text-xs p-4 min-h-[100px] text-white" 
                        />
                    </div>

                    {/* ROW 7: Submit */}
                    <Button 
                        disabled={isLoading}
                        className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all mt-4"
                    >
                        {isLoading ? 'MENYIMPAN...' : 'SIMPAN KEDATANGAN'}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    )
}

function CreateLossSheet({ isOpen, onClose, initialData }) {
    const { tenant } = useAuth()
    const queryClient = useQueryClient()
    const [isLoading, setIsLoading] = useState(false)
    const [weightLoss, setWeightLoss] = useState(0)
    const [pricePerKg, setPricePerKg] = useState(0)

    useEffect(() => {
        if (initialData && isOpen) {
            // Pre-fill mortality count if provided
            const countInput = document.querySelector('input[name="chicken_count"]')
            if (countInput) countInput.value = initialData.count || 0
            
            const typeInput = document.querySelector('select[name="loss_type"]')
            // Note: Select might be a Shadcn component, so defaultValue is better
            // but for reactive updates, we might need more state.
        }
    }, [initialData, isOpen])

    const financialLoss = Math.round(weightLoss * pricePerKg)

    const handleCreate = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        
        const payload = {
            tenant_id: tenant.id,
            sale_id: initialData?.saleId || null,
            delivery_id: initialData?.deliveryId || null,
            loss_type: formData.get('loss_type'),
            chicken_count: parseInt(formData.get('chicken_count')) || 0,
            weight_loss_kg: weightLoss,
            price_per_kg: pricePerKg,
            financial_loss: financialLoss,
            description: formData.get('description'),
            report_date: new Date().toISOString().split('T')[0]
        }

        const { error } = await supabase.from('loss_reports').insert(payload)
        
        if (error) {
            toast.error('Gagal mencatat kerugian')
        } else {
            toast.success('Kerugian dicatat')
            queryClient.invalidateQueries(['loss-reports'])
            onClose()
        }
        setIsLoading(false)
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[85vh] bg-[#0C1319] border-white/10 rounded-t-[40px] px-6 text-left overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">Catat Kerugian</SheetTitle>
                    <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">Dokumentasikan kerugian operasional lapangan</SheetDescription>
                </SheetHeader>

                <form onSubmit={handleCreate} className="space-y-6 pb-20">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Tipe Kerugian *</Label>
                            <Select name="loss_type" defaultValue="mortality">
                                <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase">
                                    <SelectValue placeholder="PILIH TIPE" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111C24] border-white/10">
                                    <SelectItem value="mortality" className="text-xs font-black uppercase">MORTALITAS (MATI)</SelectItem>
                                    <SelectItem value="underweight" className="text-xs font-black uppercase">BERAT KURANG</SelectItem>
                                    <SelectItem value="buyer_complaint" className="text-xs font-black uppercase">KOMPLAIN BUYER</SelectItem>
                                    <SelectItem value="shrinkage" className="text-xs font-black uppercase">SUSUT BERAT</SelectItem>
                                    <SelectItem value="other" className="text-xs font-black uppercase">LAINNYA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Jumlah Ekor</Label>
                                <Input name="chicken_count" type="number" defaultValue={0} className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Berat Loss (kg)</Label>
                                <Input 
                                    type="number" step="0.1" 
                                    value={weightLoss}
                                    onChange={(e) => setWeightLoss(parseFloat(e.target.value) || 0)}
                                    className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Harga Kompensasi (Rp/kg)</Label>
                             <Input 
                                type="number" 
                                value={pricePerKg}
                                onChange={(e) => setPricePerKg(parseInt(e.target.value) || 0)}
                                placeholder="Cth: 20000" 
                                className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" 
                             />
                        </div>

                        <div className="p-4 rounded-2xl bg-red-400/5 border border-red-400/10">
                            <p className="text-[9px] font-black text-red-400/60 uppercase tracking-widest mb-1">Estimasi Kerugian</p>
                            <p className="text-lg font-black text-red-400">
                                {formatIDR(financialLoss)}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Deskripsi Kejadian *</Label>
                            <Textarea required name="description" placeholder="JELASKAN PENYEBAB KERUGIAN..." className="rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase p-4 min-h-[100px]" />
                        </div>
                    </div>

                    <SheetFooter>
                        <Button 
                            disabled={isLoading}
                            className="w-full h-16 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-red-500/20 active:scale-95 transition-all mt-4"
                        >
                            {isLoading ? 'MENYIMPAN...' : 'SIMPAN CATATAN LOSS'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

function LogisticsDetailSheet({ isOpen, onClose, delivery }) {
    if (!delivery) return null

    const isAbnormal = (delivery.mortality_count || 0) > 0 || (delivery.shrinkage_kg || 0) > 0
    const farmName = delivery.sales?.purchases?.farms?.farm_name || 'Farm Unknown'
    const rpaName = delivery.sales?.rpa_clients?.rpa_name || 'Buyer Unknown'

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full md:w-[520px] bg-[#0C1319] border-l border-white/8 p-0 flex flex-col overflow-hidden">
                <SheetHeader className="p-8 pb-4 flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">Logistik Pengiriman</SheetTitle>
                            <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">Audit detail logistik dan hasil tiba</SheetDescription>
                        </div>
                        <Badge className={cn(
                            "px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border",
                            isAbnormal 
                                ? "bg-red-500/10 text-red-400 border-red-500/20" 
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}>
                            {isAbnormal ? 'ABNORMAL' : 'AMAN'}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-8 pb-10 space-y-8 text-left">
                    {/* INFO RUTE */}
                    <div className="p-6 rounded-[24px] bg-white/[0.03] border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Truck size={60} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 grid grid-cols-2 gap-4 text-left">
                            <div>
                                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1">Dari Kandang</p>
                                <p className="text-sm font-black text-white">{farmName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1 text-right">Ke Buyer</p>
                                <p className="text-sm font-black text-white">{rpaName}</p>
                            </div>
                        </div>
                    </div>

                    {/* KENDARAAN & SOPIR */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Unit & Personel
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 rounded-2xl bg-[#111C24] border border-white/5 space-y-1">
                                 <div className="flex items-center gap-2 text-[#4B6478] mb-1">
                                     <Truck size={12} />
                                     <span className="text-[9px] font-black uppercase tracking-widest">Kendaraan</span>
                                 </div>
                                 <p className="text-sm font-black text-white">{delivery.vehicle_plate || '-'}</p>
                                 <p className="text-[10px] font-bold text-[#4B6478] uppercase">{delivery.vehicle_type || '-'}</p>
                             </div>
                             <div className="p-4 rounded-2xl bg-[#111C24] border border-white/5 space-y-1">
                                 <div className="flex items-center gap-2 text-[#4B6478] mb-1">
                                     <User size={12} />
                                     <span className="text-[9px] font-black uppercase tracking-widest">Sopir</span>
                                 </div>
                                 <p className="text-sm font-black text-white uppercase">{delivery.driver_name || '-'}</p>
                                 <div className="flex items-center gap-1.5 mt-1 text-emerald-400 font-black">
                                     <Smartphone size={10} />
                                     <span className="text-[10px] font-bold tabular-nums tracking-widest">{delivery.driver_phone || '-'}</span>
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* TIMELINE */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                             Timeline Logistik
                        </h4>
                        <div className="p-6 rounded-[24px] bg-[#111C24] border border-white/5">
                            <Timeline delivery={delivery} />
                        </div>
                    </div>

                    {/* AUDIT HASIL */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                             Audit Hasil Tiba
                        </h4>
                        <div className="rounded-[24px] border border-white/5 bg-white/[0.02] overflow-hidden">
                            {/* POPULASI */}
                            <div className="p-5 border-b border-white/5 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1">Populasi</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-black text-white">{delivery.arrived_count || 0}</span>
                                        <span className="text-xs font-bold text-[#4B6478]">/ {delivery.initial_count || 0} Ekor</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1 text-right">Mortalitas</p>
                                    <span className={cn(
                                        "text-lg font-black",
                                        (delivery.mortality_count || 0) > 0 ? "text-red-400" : "text-emerald-400"
                                    )}>
                                        {delivery.mortality_count || 0} <span className="text-[10px] uppercase ml-0.5">Ekor</span>
                                    </span>
                                </div>
                            </div>

                            {/* TONASE */}
                            <div className="p-5 flex justify-between items-center bg-white/[0.02]">
                                <div>
                                    <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1">Tonase Tiba</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-black text-white">{delivery.arrived_weight_kg || 0}</span>
                                        <span className="text-xs font-bold text-[#4B6478]">/ {delivery.initial_weight_kg || 0} kg</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1 text-right">Susut (Shrinkage)</p>
                                    <span className={cn(
                                        "text-lg font-black",
                                        (delivery.shrinkage_kg || 0) > 0 ? "text-amber-500" : "text-emerald-400"
                                    )}>
                                        {delivery.shrinkage_kg || 0} <span className="text-[10px] uppercase ml-0.5">kg</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NOTES */}
                    {delivery.notes && (
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Catatan Lapangan</h4>
                            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px] font-bold text-[#94A3B8] leading-relaxed uppercase tracking-wider italic">
                                "{delivery.notes}"
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
