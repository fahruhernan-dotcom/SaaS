import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Truck, Package, AlertTriangle, CheckCircle2, 
    Plus, Search, Filter, ChevronRight, 
    Clock, MapPin, User, Smartphone, 
    TrendingDown, AlertCircle, Info, Calendar,
    ArrowRightLeft, MoreHorizontal, Check
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatIDR, safeNumber, safePercent } from '@/lib/format'

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

    // --- QUERIES ---
    const { data: deliveries = [], isLoading: isLoadingDeliveries } = useQuery({
        queryKey: ['deliveries', tenant?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('deliveries')
                .select(`
                    *,
                    sales (
                        id,
                        total_revenue,
                        quantity,
                        total_weight_kg,
                        rpa_clients ( rpa_name ),
                        purchases ( farms ( farm_name ) )
                    )
                `)
                .eq('tenant_id', tenant?.id)
                .eq('is_deleted', false)
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
                    sales ( rpa_clients ( rpa_name ) ),
                    deliveries ( driver_name, vehicle_plate )
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
                            {lossReports.length > 0 ? (
                                <motion.div 
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-4"
                                >
                                    {lossReports.map((report) => (
                                        <LossCard key={report.id} report={report} />
                                    ))}
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
                onClose={() => setIsCreateLossOpen(false)}
                initialData={null}
            />
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

function DeliveryCard({ delivery, onUpdateTiba }) {
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
                            <Button 
                                variant="ghost"
                                className="w-full h-10 text-[#4B6478] hover:text-white font-black text-[10px] uppercase tracking-widest"
                            >
                                Lihat Detail Logistik
                            </Button>
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
                                <p className="text-[9px] font-bold text-[#4B6478] tabular-nums">
                                    {data[step.key] ? format(new Date(data[step.key]), 'HH:mm') : '--:--'}
                                </p>
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
        const total = thisMonth.reduce((acc, curr) => acc + (Number(curr.financial_loss) || 0), 0)
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

function LossCard({ report }) {
    const typeMeta = {
        mortality:        { label: 'Mortalitas', color: '#F87171' },
        underweight:      { label: 'Berat Kurang', color: '#FBBF24' },
        sick:             { label: 'Sakit', color: '#F87171' },
        buyer_complaint:  { label: 'Komplain Buyer', color: '#F59E0B' },
        shrinkage:        { label: 'Susut Berat', color: '#FBBF24' },
        other:            { label: 'Lainnya', color: '#94A3B8' }
    }

    const meta = typeMeta[report.loss_type] || typeMeta.other
    const rpaName = report.sales?.rpa_clients?.rpa_name || 'Buyer Unknown'
    const driverLabel = report.deliveries ? `${report.deliveries.driver_name} (${report.deliveries.vehicle_plate})` : null

    return (
        <motion.div variants={itemVariants}>
            <Card className="bg-[#111C24] border-white/5 rounded-[24px] p-5 space-y-4 hover:border-white/10 transition-all">
                <div className="flex justify-between items-start">
                    <div className="space-y-1.5 text-left">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }}></div>
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
                        </div>
                        <h4 className="font-display font-black text-white text-sm uppercase truncate">{rpaName}</h4>
                    </div>
                    {report.resolved ? (
                         <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[8px] px-2 h-5 rounded-lg uppercase tracking-widest flex gap-1">
                             <Check size={8} strokeWidth={4} /> Selesai
                         </Badge>
                    ) : (
                        <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[8px] px-2 h-5 rounded-lg uppercase tracking-widest">
                            Belum Selesai
                        </Badge>
                    )}
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1">Dampak</p>
                        <p className="text-xs font-black text-[#94A3B8]">
                            {report.chicken_count > 0 && `${report.chicken_count} ekor `}
                            {report.weight_loss_kg > 0 && `${report.weight_loss_kg} kg `}
                        </p>
                    </div>
                    <div className="flex-1 text-right">
                        <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1">Total Loss</p>
                        <p className="text-sm font-black text-red-400">
                             {formatIDR(report.financial_loss)}
                        </p>
                    </div>
                </div>

                {driverLabel && (
                     <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                         <User size={10} className="text-[#4B6478]" />
                         <span className="text-[9px] font-bold text-[#4B6478] uppercase tracking-wider truncate">{driverLabel}</span>
                     </div>
                )}

                <div className="flex justify-between items-center pt-2">
                    <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">
                        {format(new Date(report.report_date), 'dd MMM yyyy', { locale: id })}
                    </span>
                    {!report.resolved && (
                        <Button 
                            variant="link"
                            className="h-auto p-0 text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300"
                        >
                            Tandai Selesai
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
                .is('is_deleted', false)
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
            load_time: new Date().toISOString(),
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
    const queryClient = useQueryClient()
    const [isLoading, setIsLoading] = useState(false)
    const [arrivedQty, setArrivedQty] = useState(0)
    const [arrivedWeight, setArrivedWeight] = useState(0)

    useMemo(() => {
        if (delivery) {
            setArrivedQty(delivery.initial_count)
            setArrivedWeight(delivery.initial_weight_kg)
        }
    }, [delivery])

    const mortality = (delivery?.initial_count || 0) - arrivedQty
    const shrinkage = (delivery?.initial_weight_kg || 0) - arrivedWeight

    const handleUpdate = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        
        const payload = {
            arrival_time: new Date().toISOString(),
            arrived_count: arrivedQty,
            arrived_weight_kg: arrivedWeight,
            mortality_count: mortality,
            status: 'completed'
        }

        const { error } = await supabase
            .from('deliveries')
            .update(payload)
            .eq('id', delivery.id)
        
        if (error) {
            toast.error('Gagal update kedatangan')
        } else {
            toast.success('Kedatangan tercatat!')
            queryClient.invalidateQueries(['deliveries'])
            
            // Suggest loss report if mortality > 0
            if (mortality > 0) {
                 if (confirm(`Ada ${mortality} ekor mati dalam perjalanan. Buat loss report sekarang?`)) {
                     // In a real app, we might open another sheet. 
                     // For now, let's just toast and the user can click "Catat Kerugian"
                     toast.info('Silakan catat kerugian di tab Loss Report')
                 }
            }
            onClose()
        }
        setIsLoading(false)
    }

    if (!delivery) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[75vh] bg-[#0C1319] border-white/10 rounded-t-[40px] px-6 text-left">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">Catat Kedatangan</SheetTitle>
                    <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">Konfirmasi jumlah dan berat tiba di buyer</SheetDescription>
                </SheetHeader>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-6">
                     <div className="flex justify-between items-center">
                         <div>
                             <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1">Dari Kandang</p>
                             <p className="text-xs font-black text-white">{delivery.sales?.purchases?.farms?.farm_name || '-'}</p>
                         </div>
                         <ArrowRightLeft className="text-[#4B6478]" size={16} />
                         <div className="text-right">
                             <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1">Target Tiba</p>
                             <p className="text-xs font-black text-white uppercase">{delivery.initial_count} EKOR / {delivery.initial_weight_kg} KG</p>
                         </div>
                     </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Jumlah Tiba (Ekor) *</Label>
                            <Input 
                                type="number" 
                                value={arrivedQty} 
                                onChange={(e) => setArrivedQty(parseInt(e.target.value) || 0)}
                                className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Berat Tiba (kg) *</Label>
                            <Input 
                                type="number" 
                                step="0.1" 
                                value={arrivedWeight}
                                onChange={(e) => setArrivedWeight(parseFloat(e.target.value) || 0)}
                                className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" 
                            />
                        </div>
                    </div>

                    {(mortality > 0 || shrinkage > 0) && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2"
                        >
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-red-400">Mati di Perjalanan:</span>
                                <span className="text-white">{mortality} Ekor</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-red-400">Susut Berat:</span>
                                <span className="text-white">{shrinkage.toFixed(1)} kg</span>
                            </div>
                        </motion.div>
                    )}

                    <Button 
                        disabled={isLoading}
                        className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-emerald-500/20 mt-4 h-16 active:scale-95 transition-all"
                    >
                        {isLoading ? 'MENYIMPAN...' : 'SIMPAN & TANDAI TIBA'}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    )
}

function CreateLossSheet({ isOpen, onClose }) {
    const { tenant } = useAuth()
    const queryClient = useQueryClient()
    const [isLoading, setIsLoading] = useState(false)
    const [weightLoss, setWeightLoss] = useState(0)
    const [pricePerKg, setPricePerKg] = useState(0)

    const financialLoss = Math.round(weightLoss * pricePerKg)

    const handleCreate = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        
        const payload = {
            tenant_id: tenant.id,
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
