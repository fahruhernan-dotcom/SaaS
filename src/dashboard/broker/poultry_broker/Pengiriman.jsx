import React, { useState, useMemo, useEffect } from 'react'
import { useLocation, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Truck, Package, AlertTriangle, CheckCircle2,
    Plus, Search, Filter, ChevronRight,
    Clock, MapPin, User, Smartphone,
    TrendingDown, AlertCircle, Info, Calendar,
    ArrowRightLeft, MoreHorizontal, Check, Lock, Unlock,
    ChevronDown, ChevronsUpDown, Trash2,
    Pencil, PencilLine, Printer, X, FileText, Menu
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
import DeliveryCard from '@/dashboard/broker/poultry_broker/pengiriman/DeliveryCard'
import TransaksiSuccessCard from '@/components/ui/TransaksiSuccessCard'
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal'
import LossCard, { LossSummary } from '@/dashboard/broker/poultry_broker/pengiriman/LossCard'
import UpdateArrivalSheet from '@/dashboard/broker/poultry_broker/pengiriman/UpdateArrivalSheet'
import CreateLossSheet from '@/dashboard/broker/poultry_broker/pengiriman/CreateLossSheet'
import LogisticsDetailSheet from '@/dashboard/broker/poultry_broker/pengiriman/LogisticsDetailSheet'
import { SummaryCard, FilterPill, EmptyState } from '@/dashboard/broker/poultry_broker/pengiriman/Common'

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

import { PengirimanSkeleton } from '@/components/ui/BrokerPageSkeleton'

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
    const { setSidebarOpen } = useOutletContext() || {}
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

    // --- SUCCESS CARD ---
    const [successData, setSuccessData] = useState(null)

    const handleCompleteDelivery = async (delivery) => {
        try {
            const { error } = await supabase
                .from('deliveries')
                .update({ status: 'completed' })
                .eq('id', delivery.id)
            if (error) throw error
            queryClient.invalidateQueries({ queryKey: ['deliveries'] })
            queryClient.invalidateQueries({ queryKey: ['deliveries', tenant.id] })
            queryClient.invalidateQueries({ queryKey: ['sales'] })
            queryClient.invalidateQueries({ queryKey: ['broker-stats'] })

            const sale = delivery.sales
            const purchase = sale?.purchases
            const totalRevenue  = safeNum(sale?.total_revenue)
            const totalModal    = safeNum(purchase?.total_cost)
            const transportCost = safeNum(purchase?.transport_cost)
            const otherCost     = safeNum(purchase?.other_cost)
            const deliveryCost  = safeNum(delivery.delivery_cost) || safeNum(sale?.delivery_cost)

            setSuccessData({
                type:            'lengkap',
                farmName:        purchase?.farms?.farm_name || null,
                rpaName:         sale?.rpa_clients?.rpa_name || null,
                rpaPhone:        sale?.rpa_clients?.phone || null,
                quantity:        delivery.arrived_count || delivery.initial_count || 0,
                totalWeight:     delivery.arrived_weight_kg || delivery.initial_weight_kg || 0,
                buyPrice:        totalModal,
                sellPrice:       totalRevenue,
                netProfit:       totalRevenue - totalModal - transportCost - otherCost - deliveryCost,
                transactionDate: sale?.transaction_date || null,
                tenant,
            })
        } catch (err) {
            toast.error('Gagal menyelesaikan pengiriman: ' + err.message)
        }
    }

    const location = useLocation()

    useEffect(() => {
        if (!location.state) return

        // 1. Handle Loss Report deep link
        if (location.state.openLoss) {
            setActiveTab('loss')
            setInitialLossData(location.state.initialLoss)
            setIsCreateLossOpen(true)
        }

        // 2. Handle Audit deep link (via openAudit=true or metadata.ref_id)
        const refId = location.state.metadata?.ref_id || location.state.refId
        const openAudit = location.state.openAudit

        if (refId && deliveries.length > 0) {
            const delivery = deliveries.find(d => d.id === refId)
            if (delivery) {
                setSelectedDelivery(delivery)
                setIsUpdateArrivalOpen(true)
                // Clear state to avoid reopening
                window.history.replaceState({}, document.title)
            }
        } else if (openAudit) {
            setDeliveryFilter('aktif')
            // Option: toast or scroll to first 'arrived' delivery if exists
            const firstAudit = deliveries.find(d => d.status === 'arrived')
            if (firstAudit) {
                // We don't auto-open here since there might be many, 
                // but we filter the list to 'aktif'
            }
        }

        // Cleanup state if we handled the basic flags
        if (location.state.openLoss) {
            window.history.replaceState({}, document.title)
        }
    }, [location, deliveries])

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
                        delivery_cost,
                        rpa_clients ( rpa_name, phone ),
                        purchases (
                            total_cost,
                            transport_cost,
                            other_cost,
                            price_per_kg,
                            farms ( farm_name )
                        )
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


    if (isLoadingDeliveries || isLoadingLoss) return <PengirimanSkeleton />

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("bg-[#06090F] min-h-screen text-[#F1F5F9] pb-24", isDesktop && "pb-10")}
        >
            {/* Header Mobile Only */}
            {!isDesktop && (
                <header className="h-14 px-4 flex items-center gap-3 sticky top-0 bg-[#06090F]/90 backdrop-blur-md z-40 border-b border-white/5">
                    <button
                        onClick={() => setSidebarOpen?.(true)}
                        className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                    >
                        <Menu size={16} className="text-[#94A3B8]" />
                    </button>
                    <h1 className="font-display text-[15px] font-black tracking-tight uppercase">Pengiriman & Loss</h1>
                </header>
            )}

            <div className={cn("max-w-5xl mx-auto", isDesktop ? "px-5 pt-8 space-y-8" : "px-4 pt-4 space-y-5")}>
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
                    isDesktop ? "grid grid-cols-3 gap-4" : "flex gap-3 overflow-x-auto pb-2 scrollbar-none pr-4"
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
                    <TabsList className={cn("bg-secondary/10 p-1.5 rounded-[20px] w-full", isDesktop && "max-w-[400px]")}>
                        <TabsTrigger
                            value="pengiriman"
                            className={cn("rounded-2xl transition-all data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-black uppercase tracking-widest flex-1", isDesktop ? "text-[10px] py-3" : "text-[11px] py-2.5")}
                        >
                            Pengiriman
                        </TabsTrigger>
                        <TabsTrigger
                            value="loss"
                            className={cn("rounded-2xl transition-all data-[state=active]:bg-red-500 data-[state=active]:text-white font-black uppercase tracking-widest flex-1", isDesktop ? "text-[10px] py-3" : "text-[11px] py-2.5")}
                        >
                            Loss Report
                        </TabsTrigger>
                    </TabsList>

                    {/* --- TAB PENGIRIMAN --- */}
                    <TabsContent value="pengiriman" className={cn(isDesktop ? "mt-8" : "mt-4")}>
                        <div className={cn("flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pr-4", isDesktop ? "mb-6" : "mb-4")}>
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
                                            onUpdateStatus={(d) => {
                                                setSelectedDelivery(d)
                                                setIsUpdateArrivalOpen(true)
                                            }}
                                            onComplete={handleCompleteDelivery}
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
                    <TabsContent value="loss" className={cn(isDesktop ? "mt-8" : "mt-4")}>
                       <LossSummary lossReports={lossReports} />

                       <div className={cn("flex justify-between items-center", isDesktop ? "mb-6" : "mb-4")}>
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

            <TransaksiSuccessCard
                isOpen={!!successData}
                onClose={() => setSuccessData(null)}
                data={successData}
            />
        </motion.div>
    )
}
