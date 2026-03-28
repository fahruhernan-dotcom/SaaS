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
    Pencil, PencilLine, Printer, X, FileText
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
import DeliveryCard from '@/dashboard/broker/pengiriman/DeliveryCard'
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal'
import LossCard, { LossSummary } from '@/dashboard/broker/pengiriman/LossCard'
import UpdateArrivalSheet from '@/dashboard/broker/pengiriman/UpdateArrivalSheet'
import CreateLossSheet from '@/dashboard/broker/pengiriman/CreateLossSheet'
import LogisticsDetailSheet from '@/dashboard/broker/pengiriman/LogisticsDetailSheet'
import { SummaryCard, FilterPill, EmptyState } from '@/dashboard/broker/pengiriman/Common'

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
    const { tenant, profile } = useAuth()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('pengiriman')
    const [deliveryFilter, setDeliveryFilter] = useState('semua')
    
    // --- MODALS STATE ---
    const [isUpdateArrivalOpen, setIsUpdateArrivalOpen] = useState(false)
    const [isCreateLossOpen, setIsCreateLossOpen] = useState(false)
    const [selectedDelivery, setSelectedDelivery] = useState(null)
    const [initialLossData, setInitialLossData] = useState(null)
    
    // --- LOGISTICS DETAIL ---
    const [isLogisticsDetailOpen, setIsLogisticsDetailOpen] = useState(false)
    const [selectedLogisticsDetail, setSelectedLogisticsDetail] = useState(null)

    // --- EDIT ARRIVAL DATA STATE ---
    const [confirmEditArrivalDelivery, setConfirmEditArrivalDelivery] = useState(null)

    // --- INVOICE MODAL ---
    const [invoiceModal, setInvoiceModal] = useState({ open: false, delivery: null })

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
                    drivers ( full_name ),
                    vehicles ( brand, vehicle_plate ),
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
                                            onPrintSuratJalan={(d) => setInvoiceModal({ open: true, delivery: d })}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <EmptyState 
                                    icon={Truck} 
                                    title="Belum ada pengiriman" 
                                    description="Catat pengiriman pertama setelah transaksi jual."
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

            <InvoicePreviewModal
                type="delivery"
                isOpen={invoiceModal.open}
                onClose={() => setInvoiceModal({ open: false, delivery: null })}
                data={invoiceModal.delivery ? {
                    tenant,
                    delivery:   invoiceModal.delivery,
                    sale:       invoiceModal.delivery.sales,
                    farm:       invoiceModal.delivery.sales?.purchases?.farms,
                    rpa:        invoiceModal.delivery.sales?.rpa_clients,
                    generatedBy: profile?.full_name,
                } : null}
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
