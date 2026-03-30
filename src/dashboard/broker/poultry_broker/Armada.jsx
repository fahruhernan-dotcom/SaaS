import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Truck, User, Plus, Filter, 
    MoreHorizontal, Edit2, Trash2, 
    Phone, MapPin, CreditCard, 
    Calendar, AlertCircle, CheckCircle2,
    Wrench, Building, ChevronRight,
    Search, X, Clock, DollarSign
} from 'lucide-react'
import { 
    format, differenceInDays, isAfter, 
    parseISO, startOfMonth, endOfMonth 
} from 'date-fns'
import { id } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DatePicker } from '@/components/ui/DatePicker'
import * as z from 'zod'
import { formatIDR, formatIDRShort, safeNumber, safePercent, formatEkor, formatWeight } from '@/lib/format'
import { InputNumber } from '@/components/ui/InputNumber'
import { InputRupiah } from '@/components/ui/InputRupiah'

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
    AlertDialog, AlertDialogAction, AlertDialogCancel, 
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
    AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'

// --- SCHEMAS ---
const vehicleSchema = z.object({
    vehicle_type: z.enum(['truk', 'pickup', 'l300', 'motor', 'lainnya'], { required_error: 'Pilih jenis kendaraan' }),
    vehicle_plate: z.string().min(3, 'Plat nomor tidak valid').toUpperCase(),
    brand: z.string().optional(),
    year: z.string().optional(),
    capacity_ekor: z.union([z.string(), z.number()]).optional(),
    capacity_kg: z.union([z.string(), z.number()]).optional(),
    ownership: z.enum(['milik_sendiri', 'sewa', 'pinjaman', 'cicilan', 'lainnya'], { required_error: 'Pilih status kepemilikan' }),
    rental_cost: z.union([z.string(), z.number()]).optional(),
    rental_owner: z.string().optional(),
    status: z.enum(['aktif', 'nonaktif', 'servis']),
    last_service_date: z.string().optional(),
    notes: z.string().optional()
})

const driverSchema = z.object({
    full_name: z.string().min(2, 'Nama minimal 2 karakter'),
    phone: z.string().min(8, 'Nomor HP minimal 8 karakter'),
    sim_number: z.string().optional(),
    sim_type: z.enum(['A', 'B1', 'B2', 'C']).default('B1'),
    sim_expires_at: z.string().optional(),
    status: z.enum(['aktif', 'nonaktif', 'cuti']),
    wage_per_trip: z.union([z.string(), z.number()]).default('0'),
    address: z.string().optional(),
    notes: z.string().optional()
})

const expenseSchema = z.object({
    expense_type: z.enum(['bbm', 'servis', 'pajak', 'sewa', 'lainnya']),
    amount: z.union([z.string(), z.number()]).refine(val => {
        if (typeof val === 'string') return val.length > 0;
        return val > 0;
    }, { message: "Nominal pengeluaran harus lebih besar dari Rp 0" }),
    description: z.string().optional(),
    expense_date: z.string().default(format(new Date(), 'yyyy-MM-dd'))
})

// --- HELPERS ---
// (Local formatIDR removed, using @/lib/format)

export default function Armada() {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const { tenant } = useAuth()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('kendaraan')
    
    // --- QUERIES ---
    const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
        queryKey: ['vehicles', tenant?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*, deliveries(id, created_at, is_deleted)')
                .eq('tenant_id', tenant?.id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        },
        enabled: !!tenant?.id
    })

    const { data: drivers = [], isLoading: isLoadingDrivers } = useQuery({
        queryKey: ['drivers', tenant?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('drivers')
                .select('*, deliveries(id, created_at, is_deleted)')
                .eq('tenant_id', tenant?.id)
                .eq('is_deleted', false)
                .order('full_name', { ascending: true })
            if (error) throw error
            return data
        },
        enabled: !!tenant?.id
    })

    const { data: activeDeliveries = [] } = useQuery({
        queryKey: ['active-deliveries', tenant?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('deliveries')
                .select('vehicle_id, driver_id')
                .eq('tenant_id', tenant?.id)
                .eq('status', 'on_route')
                .eq('is_deleted', false)
            if (error) throw error
            return data
        },
        enabled: !!tenant?.id
    })

    const { data: unregisteredCount = 0 } = useQuery({
        queryKey: ['unregistered-drivers-count', tenant?.id],
        queryFn: async () => {
            const { count } = await supabase
                .from('deliveries')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenant?.id)
                .is('driver_id', null)
                .eq('is_deleted', false)
            return count || 0
        },
        enabled: !!tenant?.id
    })

    const { data: unregisteredVehicleCount = 0 } = useQuery({
        queryKey: ['unregistered-vehicles-count', tenant?.id],
        queryFn: async () => {
            const { count } = await supabase
                .from('deliveries')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenant?.id)
                .is('vehicle_id', null)
                .eq('is_deleted', false)
            return count || 0
        },
        enabled: !!tenant?.id
    })

    const onRouteVehicleIds = useMemo(() => new Set(activeDeliveries.map(d => d.vehicle_id).filter(Boolean)), [activeDeliveries])
    const onRouteDriverIds = useMemo(() => new Set(activeDeliveries.map(d => d.driver_id).filter(Boolean)), [activeDeliveries])

    // --- STATE ---
    const [isVehicleSheetOpen, setIsVehicleSheetOpen] = useState(false)
    const [editingVehicle, setEditingVehicle] = useState(null)
    const [isDriverSheetOpen, setIsDriverSheetOpen] = useState(false)
    const [editingDriver, setEditingDriver] = useState(null)
    const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false)
    const [selectedVehicleForExpense, setSelectedVehicleForExpense] = useState(null)
    const [detailVehicle, setDetailVehicle] = useState(null)
    const [detailDriver, setDetailDriver] = useState(null)
    const [vehicleFilter, setVehicleFilter] = useState('Semua')
    const [driverFilter, setDriverFilter] = useState('Semua')

    // --- RENDER ---
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("bg-[#06090F] min-h-screen text-[#F1F5F9] pb-24", isDesktop && "pb-10")}
        >
            {/* Header Mobile Only */}
            {!isDesktop && (
                <header className="px-5 pt-10 pb-4 flex justify-between items-center sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-40 border-b border-white/5">
                    <h1 className="font-display text-xl font-black tracking-tight uppercase">Armada & Sopir</h1>
                    <div className="flex gap-2">
                         <div className="relative group">
                            <Button 
                                size="sm"
                                className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                                onClick={() => {
                                    setEditingVehicle(null)
                                    setIsVehicleSheetOpen(true)
                                }}
                            >
                                <Plus size={18} strokeWidth={3} className="mr-1.5" /> Tambah
                            </Button>
                         </div>
                    </div>
                </header>
            )}

            <div className="px-5 pt-8 max-w-5xl mx-auto space-y-8">
                {/* Desktop Header */}
                {isDesktop && (
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h1 className="font-display text-3xl font-black tracking-tight uppercase">Armada & Sopir</h1>
                            <p className="text-[#4B6478] font-bold text-sm uppercase tracking-wider">Kelola kendaraan dan sopir pengiriman</p>
                        </div>
                        <div className="flex gap-4">
                            <Button 
                                onClick={() => {
                                    setEditingVehicle(null)
                                    setIsVehicleSheetOpen(true)
                                }}
                                className="h-12 px-6 rounded-2xl bg-[#111C24] border border-white/5 hover:bg-white/5 text-white font-black text-[11px] uppercase tracking-widest gap-2 shadow-lg"
                            >
                                <Plus size={18} strokeWidth={3} className="text-emerald-400" /> Tambah Kendaraan
                            </Button>
                            <Button 
                                onClick={() => {
                                    setEditingDriver(null)
                                    setIsDriverSheetOpen(true)
                                }}
                                className="h-12 px-6 rounded-2xl bg-[#111C24] border border-white/5 hover:bg-white/5 text-white font-black text-[11px] uppercase tracking-widest gap-2 shadow-lg"
                            >
                                <Plus size={18} strokeWidth={3} className="text-blue-400" /> Tambah Sopir
                            </Button>
                        </div>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-secondary/20 p-1 rounded-2xl w-full lg:w-fit mb-4">
                        <TabsTrigger value="kendaraan" className="flex-1 lg:flex-none rounded-xl data-[state=active]:bg-white/10 text-[11px] font-black uppercase tracking-widest px-8 py-3">
                            <Truck size={14} className="mr-2" /> Kendaraan
                        </TabsTrigger>
                        <TabsTrigger value="sopir" className="flex-1 lg:flex-none rounded-xl data-[state=active]:bg-white/10 text-[11px] font-black uppercase tracking-widest px-8 py-3">
                            <User size={14} className="mr-2" /> Sopir
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="kendaraan" className="space-y-8 m-0 outline-none">
                        <div className="flex overflow-x-auto pb-2 scrollbar-none gap-3">
                            <SummaryPill label="Total" count={vehicles.length} />
                            <SummaryPill label="Mengirim" count={onRouteVehicleIds.size} color="amber" />
                            <SummaryPill label="Aktif" count={vehicles.filter(v => v.status === 'aktif').length} color="emerald" />
                            <SummaryPill label="Servis" count={vehicles.filter(v => v.status === 'servis').length} color="amber" />
                            <SummaryPill label="Nonaktif" count={vehicles.filter(v => v.status === 'nonaktif').length} color="gray" />
                        </div>

                        {/* Filter Chips */}
                        <div className="flex gap-2">
                            {['Semua', 'Mengirim', 'Aktif', 'Servis', 'Nonaktif'].map(f => (
                                <FilterChip 
                                    key={f} 
                                    label={f} 
                                    active={vehicleFilter === f} 
                                    onClick={() => setVehicleFilter(f)} 
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unregisteredVehicleCount > 0 && (vehicleFilter === 'Semua' || vehicleFilter === 'Nonaktif') && (
                                <div 
                                    onClick={() => setDetailVehicle({ id: 'unregistered', vehicle_plate: 'TANPA PLAT', brand: 'BELUM TERDAFTAR', vehicle_type: 'Tidak diketahui', status: 'nonaktif', isUnregistered: true })}
                                    className="p-5 rounded-3xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 cursor-pointer transition-all flex flex-col justify-between min-h-[160px] relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                                        <AlertCircle size={64} />
                                    </div>
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-display font-black text-lg border border-red-500/20">
                                            ?
                                        </div>
                                        <Badge className="bg-red-500/10 text-red-500 border-none hover:bg-red-500/20 font-black uppercase tracking-widest text-[10px]">Perlu Audit</Badge>
                                    </div>
                                    <div className="relative z-10 mt-4">
                                        <h3 className="font-display text-lg font-black uppercase text-red-400 mb-1 leading-snug">KENDARAAN BELUM TERDAFTAR</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500/80">
                                            <AlertCircle size={12} /> ADA {unregisteredVehicleCount} PENGIRIMAN
                                        </div>
                                    </div>
                                </div>
                            )}
                            {vehicles.filter(v => {
                                if (vehicleFilter === 'Semua') return true
                                if (vehicleFilter === 'Mengirim') return onRouteVehicleIds.has(v.id)
                                return v.status === vehicleFilter.toLowerCase()
                            }).map(v => (
                                <VehicleCard 
                                    key={v.id} 
                                    vehicle={v} 
                                    isOnRoute={onRouteVehicleIds.has(v.id)}
                                    onClickCard={() => setDetailVehicle(v)}
                                    onEdit={() => {
                                        setEditingVehicle(v)
                                        setIsVehicleSheetOpen(true)
                                    }}
                                    onAddExpense={() => {
                                        setSelectedVehicleForExpense(v)
                                        setIsExpenseSheetOpen(true)
                                    }}
                                />
                            ))}
                            {vehicles.length === 0 && !isLoadingVehicles && (
                                <EmptyState 
                                    icon={Truck} 
                                    title="Belum ada kendaraan" 
                                    description="Tambahkan kendaraan untuk melacak armada pengiriman."
                                    buttonText="+ Tambah Kendaraan Pertama"
                                    onClick={() => {
                                        setEditingVehicle(null)
                                        setIsVehicleSheetOpen(true)
                                    }}
                                />
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="sopir" className="space-y-8 m-0 outline-none">
                         <div className="flex overflow-x-auto pb-2 scrollbar-none gap-3">
                            <SummaryPill label="Total" count={drivers.length} />
                            <SummaryPill label="Mengirim" count={onRouteDriverIds.size} color="amber" />
                            <SummaryPill label="Aktif" count={drivers.filter(d => d.status === 'aktif').length} color="emerald" />
                            <SummaryPill label="Cuti" count={drivers.filter(d => d.status === 'cuti').length} color="amber" />
                            <SummaryPill label="Nonaktif" count={drivers.filter(d => d.status === 'nonaktif').length} color="gray" />
                        </div>

                        {/* Filter Chips */}
                        <div className="flex gap-2">
                            {['Semua', 'Mengirim', 'Aktif', 'Nonaktif', 'Cuti'].map(f => (
                                <FilterChip 
                                    key={f} 
                                    label={f} 
                                    active={driverFilter === f} 
                                    onClick={() => setDriverFilter(f)} 
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unregisteredCount > 0 && (driverFilter === 'Semua' || driverFilter === 'Nonaktif') && (
                                <div 
                                    onClick={() => setDetailDriver({ id: 'unregistered', full_name: 'PENGIRIMAN TANPA SOPIR', phone: 'Perlu dicek di menu Pengiriman', status: 'nonaktif', isUnregistered: true })}
                                    className="p-5 rounded-3xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 cursor-pointer transition-all flex flex-col justify-between min-h-[160px] relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                                        <AlertCircle size={64} />
                                    </div>
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-display font-black text-lg border border-red-500/20">
                                            ?
                                        </div>
                                        <Badge className="bg-red-500/10 text-red-500 border-none hover:bg-red-500/20 font-black uppercase tracking-widest text-[10px]">Perlu Audit</Badge>
                                    </div>
                                    <div className="relative z-10 mt-4">
                                        <h3 className="font-display text-lg font-black uppercase text-red-400 mb-1 leading-snug">PENGIRIMAN TANPA SOPIR</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500/80">
                                            <AlertCircle size={12} /> ADA {unregisteredCount} TRANSAKSI
                                        </div>
                                    </div>
                                </div>
                            )}
                            {drivers.filter(d => {
                                if (driverFilter === 'Semua') return true
                                if (driverFilter === 'Mengirim') return onRouteDriverIds.has(d.id)
                                return d.status === driverFilter.toLowerCase()
                            }).map(d => (
                                <DriverCard 
                                    key={d.id} 
                                    driver={d} 
                                    isOnRoute={onRouteDriverIds.has(d.id)}
                                    onClickCard={() => setDetailDriver(d)}
                                    onEdit={() => {
                                        setEditingDriver(d)
                                        setIsDriverSheetOpen(true)
                                    }}
                                />
                            ))}
                            {drivers.length === 0 && !isLoadingDrivers && (
                                <EmptyState 
                                    icon={User} 
                                    title="Belum ada sopir" 
                                    description="Tambahkan sopir untuk melacak riwayat pengiriman."
                                    buttonText="+ Tambah Sopir Pertama"
                                    onClick={() => {
                                        setEditingDriver(null)
                                        setIsDriverSheetOpen(true)
                                    }}
                                />
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* --- SHEETS --- */}
            <VehicleSheet 
                isOpen={isVehicleSheetOpen} 
                onClose={() => setIsVehicleSheetOpen(false)} 
                editingData={editingVehicle}
                tenantId={tenant?.id}
            />
            <DriverSheet 
                isOpen={isDriverSheetOpen} 
                onClose={() => setIsDriverSheetOpen(false)} 
                editingData={editingDriver}
                tenantId={tenant?.id}
            />
            <ExpenseSheet 
                isOpen={isExpenseSheetOpen} 
                onClose={() => setIsExpenseSheetOpen(false)} 
                vehicle={selectedVehicleForExpense}
                tenantId={tenant?.id}
            />
            {detailVehicle && <VehicleDetailSheet vehicle={detailVehicle} onClose={() => setDetailVehicle(null)} />}
            {detailDriver && <DriverDetailSheet driver={detailDriver} onClose={() => setDetailDriver(null)} />}
        </motion.div>
    )
}

// --- COMPONENTS ---

function SummaryPill({ label, count, color }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const colors = {
        emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        gray: "bg-white/5 border-white/10 text-[#4B6478]",
        default: "bg-[#111C24] border-white/5 text-[#94A3B8]"
    }
    return (
        <div className={cn(
            "rounded-2xl border font-black uppercase tracking-widest flex items-center gap-3 whitespace-nowrap",
            isDesktop ? "px-5 py-2.5 text-[10px]" : "px-4 py-3 text-[11px]",
            colors[color] || colors.default
        )}>
            <span>{label}</span>
            <span className={cn("bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 text-white", isDesktop ? "text-xs" : "text-sm")}>{(count || 0).toLocaleString('id-ID')}</span>
        </div>
    )
}

function FilterChip({ label, active, onClick }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    return (
        <button 
            onClick={onClick}
            className={cn(
                "rounded-xl font-black uppercase tracking-widest transition-all",
                isDesktop ? "px-5 py-2 text-[9px]" : "px-6 py-2.5 text-[11px]",
                active ? "bg-white text-black" : "bg-white/5 text-[#4B6478] hover:bg-white/10"
            )}
        >
            {label}
        </button>
    )
}

function VehicleCard({ vehicle, isOnRoute, onEdit, onAddExpense, onClickCard }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const statusMeta = {
        aktif:    { label: 'Aktif',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        servis:   { label: 'Servis',   color: 'text-amber-400',   bg: 'bg-amber-500/10' },
        nonaktif: { label: 'Nonaktif', color: 'text-[#4B6478]',   bg: 'bg-white/5' }
    }
    const meta = statusMeta[vehicle.status] || statusMeta.nonaktif

    return (
        <div 
            role="button"
            tabIndex={0}
            onClick={onClickCard}
            className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-[32px]"
        >
        <Card className="h-full bg-[#111C24] border-white/5 rounded-[32px] overflow-hidden group hover:border-emerald-500/30 transition-all cursor-pointer active:scale-[0.98]">
            <CardContent className={isDesktop ? "p-6 space-y-5" : "p-5 space-y-6"}>
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <h3 className={cn("font-display font-black tracking-tight text-[#F1F5F9] uppercase leading-none", isDesktop ? "text-xl" : "text-[22px]")}>{vehicle.vehicle_plate}</h3>
                        {isOnRoute && (
                            <Badge className={cn("rounded-lg border-none px-2 py-1 font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 w-fit", isDesktop ? "text-[9px]" : "text-[10px]")}>
                                Sedang Mengirim
                            </Badge>
                        )}
                    </div>
                    <Badge className={cn("rounded-lg border-none px-2 py-0.5 font-black uppercase tracking-widest", isDesktop ? "text-[10px]" : "text-[11px]", meta.bg, meta.color)}>
                        {meta.label}
                    </Badge>
                </div>

                {/* Row 2: Type, Brand, Year */}
                <p className={cn("font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5", isDesktop ? "text-xs" : "text-sm")}>
                    <span className="capitalize">{vehicle.vehicle_type}</span>
                    {vehicle.brand && <><span>·</span> {vehicle.brand}</>}
                    {vehicle.year && <><span>·</span> {vehicle.year}</>}
                </p>

                {/* Row 3: Ownership & Capacity */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        {vehicle.ownership === 'milik_sendiri' && <Badge variant="outline" className={cn("font-black uppercase border-white/10 text-[#4B6478]", isDesktop ? "text-[8px]" : "text-[10px]")}>Milik Sendiri</Badge>}
                        {vehicle.ownership === 'sewa' && <Badge variant="outline" className={cn("font-black uppercase border-amber-500/20 text-amber-500 bg-amber-500/5", isDesktop ? "text-[8px]" : "text-[10px]")}>Sewa · {formatIDRShort(vehicle.rental_cost)}/trip</Badge>}
                        {vehicle.ownership === 'pinjaman' && <Badge variant="outline" className={cn("font-black uppercase border-blue-500/20 text-blue-500 bg-blue-500/5", isDesktop ? "text-[8px]" : "text-[10px]")}>Pinjaman: {vehicle.rental_owner}</Badge>}
                    </div>
                    <p className={cn("font-bold text-[#4B6478] flex items-center gap-1.5", isDesktop ? "text-[11px]" : "text-xs")}>
                        {vehicle.capacity_ekor && <span>{safeNumber(vehicle.capacity_ekor).toLocaleString('id-ID')} Ekor</span>}
                        {vehicle.capacity_ekor && vehicle.capacity_kg && <span>·</span>}
                        {vehicle.capacity_kg && <span>{safeNumber(vehicle.capacity_kg).toLocaleString('id-ID')} Kg</span>}
                    </p>
                </div>

                {/* Row 4: Stats */}
                <div className={cn("pt-2 border-t border-white/5 flex items-center gap-2 font-black text-[#4B6478] uppercase tracking-widest", isDesktop ? "text-[10px]" : "text-[11px]")}>
                    <Clock size={isDesktop ? 12 : 14} />
                    <span>Total {safeNumber(vehicle.deliveries?.filter(d => !d.is_deleted)?.length).toLocaleString('id-ID')} Pengiriman</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); onAddExpense(); }}
                        className={cn("flex-1 rounded-xl border-white/5 bg-white/[0.02] font-black uppercase tracking-widest hover:bg-white/5 hover:text-white", isDesktop ? "h-9 text-[9px]" : "h-11 text-[11px]")}
                    >
                         <DollarSign size={14} className="mr-1.5 text-red-400" /> Biaya
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className={cn("rounded-xl border-white/5 bg-white/[0.02] text-[#4B6478] hover:text-white hover:bg-white/5", isDesktop ? "w-12 h-9" : "w-14 h-11")}
                    >
                        <Edit2 size={16} />
                    </Button>
                </div>
            </CardContent>
        </Card>
        </div>
    )
}

function DriverCard({ driver, isOnRoute, onEdit, onClickCard }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const statusMeta = {
        aktif:    { label: 'Aktif',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        cuti:     { label: 'Cuti',     color: 'text-amber-400',   bg: 'bg-amber-500/10' },
        nonaktif: { label: 'Nonaktif', color: 'text-[#4B6478]',   bg: 'bg-white/5' }
    }
    const meta = statusMeta[driver.status] || statusMeta.nonaktif

    const expiryDays = driver.sim_expires_at ? differenceInDays(new Date(driver.sim_expires_at), new Date()) : null
    const isExpired = expiryDays !== null && expiryDays < 0
    const isSoonExpiry = expiryDays !== null && expiryDays >= 0 && expiryDays <= 30

    return (
        <div 
            role="button"
            tabIndex={0}
            onClick={onClickCard}
            className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-[32px]"
        >
        <Card className="h-full bg-[#111C24] border-white/5 rounded-[32px] overflow-hidden group hover:border-emerald-500/30 transition-all cursor-pointer active:scale-[0.98]">
            <CardContent className={isDesktop ? "p-6 space-y-5" : "p-5 space-y-6"}>
                {/* Row 1: Identity */}
                <div className="flex items-center gap-4">
                    <Avatar className={cn("rounded-[18px] border border-white/5 bg-emerald-500/10", isDesktop ? "h-12 w-12" : "h-14 w-14")}>
                        <AvatarFallback className="bg-transparent text-emerald-400 font-display font-black text-sm uppercase">
                            {driver.full_name.substring(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1.5 min-w-0">
                                <h3 className={cn("font-display font-black text-white uppercase truncate leading-none", isDesktop ? "text-sm" : "text-[15px]")}>{driver.full_name}</h3>
                                {isOnRoute && (
                                    <Badge className={cn("rounded-lg border-none px-2 py-1 font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 w-fit", isDesktop ? "text-[8px]" : "text-[9px]")}>
                                        Sedang Mengirim
                                    </Badge>
                                )}
                            </div>
                            <div className="flex shrink-0">
                                <Badge className={cn("rounded-lg border-none px-2 py-0.5 font-black uppercase tracking-widest", isDesktop ? "text-[9px]" : "text-[10px]", meta.bg, meta.color)}>
                                    {meta.label}
                                </Badge>
                            </div>
                        </div>
                        <a href={`tel:${driver.phone}`} className="flex items-center gap-1.5 mt-1.5 text-[#4B6478] hover:text-white transition-colors">
                            <Phone size={isDesktop ? 11 : 13} />
                            <span className={cn("font-bold", isDesktop ? "text-[11px]" : "text-xs")}>{driver.phone}</span>
                        </a>
                    </div>
                </div>

                {/* Row 2: SIM Info */}
                <div className="space-y-3">
                    <p className={cn("font-black text-[#4B6478] uppercase tracking-widest flex items-center gap-2", isDesktop ? "text-[10px]" : "text-[11px]")}>
                        <CreditCard size={isDesktop ? 12 : 14} className="text-blue-400/50" />
                        SIM {driver.sim_type} · {driver.sim_number || '—'}
                    </p>
                    
                    {expiryDays !== null && (
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl border",
                            isExpired ? "bg-red-500/10 border-red-500/20 text-red-400" :
                            isSoonExpiry ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                            "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/50"
                        )}>
                            {isExpired ? <X size={12} strokeWidth={3} /> : isSoonExpiry ? <AlertCircle size={12} strokeWidth={3} /> : <CheckCircle2 size={12} />}
                            <span className={cn("font-black uppercase tracking-tight", isDesktop ? "text-[9px]" : "text-[10px]")}>
                                {isExpired ? 'SIM Kadaluarsa!' : isSoonExpiry ? `Masa berlaku sisa ${expiryDays} hari` : `Berlaku s/d ${format(new Date(driver.sim_expires_at), 'dd MMM yyyy')}`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Row 3: Stats */}
                <div className={cn("pt-2 border-t border-white/5 flex flex-wrap items-center gap-x-4 gap-y-1 font-black text-[#4B6478] uppercase tracking-widest", isDesktop ? "text-[10px]" : "text-[11px]")}>
                    <div className="flex items-center gap-1.5">
                        <DollarSign size={isDesktop ? 12 : 14} />
                        <span>{formatIDRShort(driver.wage_per_trip)}/Trip</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Truck size={isDesktop ? 12 : 14} />
                        <span>{safeNumber(driver.deliveries?.filter(d => !d.is_deleted)?.length).toLocaleString('id-ID')} Trip</span>
                    </div>
                </div>

                {/* Actions */}
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className={cn("w-full rounded-xl border-white/5 bg-white/[0.02] font-black uppercase tracking-widest hover:bg-white/5 gap-2 hover:text-white", isDesktop ? "h-10 text-[9px]" : "h-12 text-[11px]")}
                >
                    <Edit2 size={12} /> Edit Profil Sopir
                </Button>
            </CardContent>
        </Card>
        </div>
    )
}

function EmptyState({ icon: Icon, title, description, buttonText, onClick }) {
    return (
        <div className="col-span-full py-20 flex flex-col items-center text-center space-y-6">
            <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 text-emerald-500/20">
                <Icon size={48} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
                <h3 className="font-display text-lg font-black uppercase text-white tracking-tight">{title}</h3>
                <p className="text-[#4B6478] text-[10px] uppercase font-bold max-w-[280px] leading-relaxed">{description}</p>
            </div>
            <Button 
                onClick={onClick}
                className="h-11 px-8 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest shadow-xl"
            >
                {buttonText}
            </Button>
        </div>
    )
}

// --- SHEET: VEHICLE ---

function VehicleSheet({ isOpen, onClose, editingData, tenantId }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    
    const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm({
        resolver: zodResolver(vehicleSchema)
    })

    const ownership = watch('ownership')

    React.useEffect(() => {
        if (editingData) {
            reset({
                ...editingData,
                rental_cost: editingData.rental_cost?.toString(),
                capacity_ekor: editingData.capacity_ekor?.toString(),
                capacity_kg: editingData.capacity_kg?.toString()
            })
        } else {
            reset({
                vehicle_type: 'truk',
                status: 'aktif',
                ownership: 'milik_sendiri'
            })
        }
    }, [editingData, isOpen])

    const onSubmit = async (vals) => {
        setIsSubmitting(true)
        const payload = {
            ...vals,
            tenant_id: tenantId,
            rental_cost: vals.rental_cost ? parseInt(vals.rental_cost) : null,
            capacity_ekor: vals.capacity_ekor ? parseInt(vals.capacity_ekor) : null,
            capacity_kg: vals.capacity_kg ? parseFloat(vals.capacity_kg) : null,
        }

        const { error } = editingData 
            ? await supabase.from('vehicles').update(payload).eq('id', editingData.id)
            : await supabase.from('vehicles').insert(payload)

        if (error) {
            toast.error('Gagal menyimpan data kendaraan')
        } else {
            toast.success('Kendaraan tersimpan!')
            queryClient.invalidateQueries(['vehicles'])
            onClose()
        }
        setIsSubmitting(false)
    }

    const handleDelete = async () => {
        const { error } = await supabase.from('vehicles').update({ is_deleted: true }).eq('id', editingData.id)
        if (error) {
            toast.error('Gagal menghapus kendaraan')
        } else {
            toast.success('Kendaraan dihapus')
            queryClient.invalidateQueries(['vehicles'])
            onClose()
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side={isDesktop ? "right" : "bottom"} className={cn("bg-[#0C1319] border-white/8 p-0 overflow-y-auto", isDesktop ? "w-full sm:max-w-[520px] border-l" : "h-[90vh] rounded-t-[40px] border-t")}>
                <div className={isDesktop ? "p-8 space-y-8" : "p-6 pt-10 space-y-6"}>
                    <SheetHeader className="text-left">
                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">
                        {editingData ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
                    </SheetTitle>
                    <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">
                        Lengkapi detail armada pengiriman
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Jenis Kendaraan *</Label>
                            <Select onValueChange={(v) => setValue('vehicle_type', v)} value={watch('vehicle_type')}>
                                <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white shadow-inner">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111C24] border-white/10 text-white">
                                    <SelectItem value="truk" className="text-xs font-black uppercase">🚚 Truk</SelectItem>
                                    <SelectItem value="pickup" className="text-xs font-black uppercase">🛻 Pickup</SelectItem>
                                    <SelectItem value="l300" className="text-xs font-black uppercase">📦 L300</SelectItem>
                                    <SelectItem value="motor" className="text-xs font-black uppercase">🏍️ Motor</SelectItem>
                                    <SelectItem value="lainnya" className="text-xs font-black uppercase">🚜 Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                             <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Plat Nomor *</Label>
                             <Input 
                                {...register('vehicle_plate')} 
                                placeholder="B 1234 ABC" 
                                className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-bold text-base text-white uppercase placeholder:text-white/10" 
                            />
                            {errors.vehicle_plate && <p className="text-[9px] text-red-400 font-black uppercase mt-1 ml-1">{errors.vehicle_plate.message}</p>}
                        </div>

                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Merk / Brand</Label>
                             <Input {...register('brand')} placeholder="MITSUBISHI CANTER" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
                        </div>

                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Tahun</Label>
                             <Input {...register('year')} type="number" placeholder="2022" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Kepemilikan *</Label>
                            <Select onValueChange={(v) => setValue('ownership', v)} value={watch('ownership')}>
                                <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111C24] border-white/10">
                                    <SelectItem value="milik_sendiri" className="text-xs font-black uppercase">🏠 Milik Sendiri</SelectItem>
                                    <SelectItem value="sewa" className="text-xs font-black uppercase">💳 Sewa</SelectItem>
                                    <SelectItem value="pinjaman" className="text-xs font-black uppercase">🤝 Pinjaman</SelectItem>
                                    <SelectItem value="cicilan" className="text-xs font-black uppercase">📋 Cicilan</SelectItem>
                                    <SelectItem value="lainnya" className="text-xs font-black uppercase">📦 Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {ownership === 'sewa' && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Biaya Sewa / Trip Rp</Label>
                                <InputRupiah 
                                    value={watch('rental_cost')} 
                                    onChange={(v) => setValue('rental_cost', v, { shouldValidate: true })} 
                                    placeholder="150000" 
                                    className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" 
                                />
                                {errors.rental_cost && <p className="text-[9px] text-red-500 font-black uppercase mt-1">{errors.rental_cost.message}</p>}
                            </div>
                        )}

                        {ownership === 'pinjaman' && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Pemilik</Label>
                                <Input {...register('rental_owner')} placeholder="NAMA PEMILIK" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Cap. Ekor</Label>
                             <InputNumber 
                                value={watch('capacity_ekor')} 
                                onChange={(v) => setValue('capacity_ekor', v, { shouldValidate: true })} 
                                placeholder="500" 
                                className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" 
                             />
                             {errors.capacity_ekor && <p className="text-[9px] text-red-500 font-black uppercase mt-1">{errors.capacity_ekor.message}</p>}
                        </div>
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Cap. Kg</Label>
                             <InputNumber 
                                value={watch('capacity_kg')} 
                                onChange={(v) => setValue('capacity_kg', v, { shouldValidate: true })} 
                                step={0.1} 
                                placeholder="800" 
                                className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" 
                             />
                             {errors.capacity_kg && <p className="text-[9px] text-red-500 font-black uppercase mt-1">{errors.capacity_kg.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Status Kendaraan</Label>
                             <Select onValueChange={(v) => setValue('status', v)} value={watch('status')}>
                                <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111C24] border-white/10">
                                    <SelectItem value="aktif" className="text-xs font-black uppercase">✅ Aktif</SelectItem>
                                    <SelectItem value="servis" className="text-xs font-black uppercase">🔧 Servis</SelectItem>
                                    <SelectItem value="nonaktif" className="text-xs font-black uppercase">❌ Nonaktif</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                         <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Servis Terakhir</Label>
                              <Controller
                                 control={control}
                                 name="last_service_date"
                                 render={({ field }) => (
                                     <DatePicker 
                                         value={field.value}
                                         onChange={field.onChange}
                                         className="h-14"
                                     />
                                 )}
                              />
                         </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Catatan Tambahan</Label>
                        <Textarea {...register('notes')} placeholder="DOKUMENTASIKAN INFRASTRUKTUR / KONDISI TERKINI..." className="rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase p-4 min-h-[100px]" />
                    </div>

                    <SheetFooter className="flex flex-col gap-3">
                        <Button 
                            disabled={isSubmitting}
                            className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                            {isSubmitting ? 'MENYIMPAN...' : editingData ? 'SIMPAN PERUBAHAN' : 'TAMBAH KENDARAAN'}
                        </Button>
                        {editingData && (
                            <Button 
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="w-full h-14 text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                            >
                                <Trash2 size={16} /> Hapus Kendaraan
                            </Button>
                        )}
                    </SheetFooter>
                    </form>
                </div>

                <DeleteConfirm 
                    isOpen={isDeleteDialogOpen} 
                    onClose={() => setIsDeleteDialogOpen(false)} 
                    onConfirm={handleDelete} 
                    title="Hapus Kendaraan?"
                    desc={`Anda akan menghapus ${editingData?.vehicle_plate} dari sistem.`}
                />
            </SheetContent>
        </Sheet>
    )
}

// --- SHEET: DRIVER ---

function DriverSheet({ isOpen, onClose, editingData, tenantId }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    
    const { register, handleSubmit, watch, setValue, reset, control, formState: { errors } } = useForm({
        resolver: zodResolver(driverSchema)
    })

    React.useEffect(() => {
        if (editingData) {
            reset({
                ...editingData,
                wage_per_trip: editingData.wage_per_trip?.toString()
            })
        } else {
            reset({
                status: 'aktif',
                sim_type: 'B1',
                wage_per_trip: '0'
            })
        }
    }, [editingData, isOpen])

    const onSubmit = async (vals) => {
        setIsSubmitting(true)
        try {
            const payload = {
                tenant_id: tenantId,
                full_name: vals.full_name,
                phone_number: vals.phone, // Map phone -> phone_number
                sim_expires_at: vals.sim_expires_at || null,
                wage_per_trip: parseInt(vals.wage_per_trip) || 0,
                status: vals.status
            }

            const { error } = editingData 
                ? await supabase.from('drivers').update(payload).eq('id', editingData.id)
                : await supabase.from('drivers').insert(payload)

            if (error) throw error

            toast.success('Sopir tersimpan!')
            queryClient.invalidateQueries(['drivers'])
            onClose()
        } catch (err) {
            console.error('Error saving driver:', err)
            toast.error('Gagal menyimpan data sopir: ' + (err.message || 'Error tidak diketahui'))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        const { error } = await supabase.from('drivers').update({ is_deleted: true }).eq('id', editingData.id)
        if (error) {
            toast.error('Gagal menghapus sopir')
        } else {
            toast.success('Sopir dihapus')
            queryClient.invalidateQueries(['drivers'])
            onClose()
        }
    }

    const simExpiry = watch('sim_expires_at')
    const simIndicator = useMemo(() => {
        if (!simExpiry) return null
        const days = differenceInDays(new Date(simExpiry), new Date())
        if (days < 0) return { label: '❌ SIM SUDAH KADALUARSA', color: 'text-red-500' }
        if (days <= 30) return { label: `⚠️ SIM HAMPIR KADALUARSA (${days} HARI LAGI)`, color: 'text-amber-500' }
        return { label: `✅ SIM MASIH BERLAKU (${days} HARI LAGI)`, color: 'text-emerald-500' }
    }, [simExpiry])

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side={isDesktop ? "right" : "bottom"} className={cn("bg-[#0C1319] border-white/8 p-0 overflow-y-auto", isDesktop ? "w-full sm:max-w-[520px] border-l" : "h-[90vh] rounded-t-[40px] border-t")}>
                <div className={isDesktop ? "p-8 space-y-8" : "p-6 pt-10 space-y-6"}>
                    <SheetHeader className="text-left">
                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">
                        {editingData ? 'Edit Sopir' : 'Tambah Sopir'}
                    </SheetTitle>
                    <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">
                        Profil pengemudi profesional
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Nama Lengkap *</Label>
                             <Input {...register('full_name')} placeholder="PAK AHMAD FAUZI" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-bold text-base text-white uppercase placeholder:text-white/10" />
                             {errors.full_name && <p className="text-[9px] text-red-500 font-black uppercase">{errors.full_name.message}</p>}
                        </div>
                        <div className="space-y-2">
                             <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>No. WhatsApp / HP *</Label>
                             <Input {...register('phone')} type="tel" placeholder="08123456789" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-bold text-base text-white placeholder:text-white/10" />
                             {errors.phone && <p className="text-[9px] text-red-500 font-black uppercase">{errors.phone.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-8 space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Nomor SIM</Label>
                             <Input {...register('sim_number')} placeholder="NOMOR DOKUMEN SIM" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Tipe SIM</Label>
                             <Select onValueChange={(v) => setValue('sim_type', v)} value={watch('sim_type')}>
                                <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111C24] border-white/10">
                                    {['A', 'B1', 'B2', 'C'].map(t => <SelectItem key={t} value={t} className="text-xs font-black uppercase">{t}</SelectItem>)}
                                </SelectContent>
                             </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Masa Berlaku SIM</Label>
                             <Controller
                                control={control}
                                name="sim_expires_at"
                                render={({ field }) => (
                                    <DatePicker 
                                        value={field.value}
                                        onChange={field.onChange}
                                        className="h-14"
                                    />
                                )}
                             />
                             {simIndicator && <p className={cn("text-[9px] font-black uppercase mt-1 ml-1", simIndicator.color)}>{simIndicator.label}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Upah Per Trip Rp</Label>
                             <InputRupiah 
                                value={watch('wage_per_trip')} 
                                onChange={(v) => setValue('wage_per_trip', v, { shouldValidate: true })} 
                                placeholder="150000" 
                                className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" 
                             />
                             {errors.wage_per_trip && <p className="text-[9px] text-red-500 font-black uppercase mt-1">{errors.wage_per_trip.message}</p>}
                        </div>
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Status Sopir</Label>
                             <Select onValueChange={(v) => setValue('status', v)} value={watch('status')}>
                                <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111C24] border-white/10">
                                    <SelectItem value="aktif" className="text-xs font-black uppercase">✅ AKTIF</SelectItem>
                                    <SelectItem value="cuti" className="text-xs font-black uppercase">😴 CUTI</SelectItem>
                                    <SelectItem value="nonaktif" className="text-xs font-black uppercase">❌ NONAKTIF</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Alamat Domisili</Label>
                        <Textarea {...register('address')} placeholder="ALAMAT LENGKAP TEMPAT TINGGAL..." className="rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase p-4 min-h-[100px]" />
                    </div>

                    <SheetFooter className="flex flex-col gap-3">
                        <Button 
                            disabled={isSubmitting}
                            className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                            {isSubmitting ? 'MENYIMPAN...' : editingData ? 'SIMPAN PERUBAHAN' : 'TAMBAH SOPIR'}
                        </Button>
                        {editingData && (
                            <Button 
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="w-full h-14 text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                            >
                                <Trash2 size={16} /> Pecat / Hapus Sopir
                            </Button>
                        )}
                    </SheetFooter>
                    </form>
                </div>

                <DeleteConfirm 
                    isOpen={isDeleteDialogOpen} 
                    onClose={() => setIsDeleteDialogOpen(false)} 
                    onConfirm={handleDelete} 
                    title="Hapus Sopir?"
                    desc={`Anda akan menghapus ${editingData?.full_name} dari sistem.`}
                />
            </SheetContent>
        </Sheet>
    )
}

// --- SHEET: EXPENSE ---

function ExpenseSheet({ isOpen, onClose, vehicle, tenantId }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const { register, handleSubmit, setValue, reset, watch, control, formState: { errors } } = useForm({
        resolver: zodResolver(expenseSchema)
    })

    React.useEffect(() => {
        reset({ expense_date: format(new Date(), 'yyyy-MM-dd'), expense_type: 'bbm' })
    }, [isOpen])

    const onSubmit = async (vals) => {
        setIsSubmitting(true)
        const payload = {
            ...vals,
            tenant_id: tenantId,
            vehicle_id: vehicle.id,
            amount: parseInt(vals.amount) || 0
        }

        const { error } = await supabase.from('vehicle_expenses').insert(payload)

        if (error) {
            toast.error('Gagal mencatat biaya')
        } else {
            toast.success('Biaya dicatat!')
            queryClient.invalidateQueries(['vehicles'])
            onClose()
        }
        setIsSubmitting(false)
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side={isDesktop ? "right" : "bottom"} className={cn("bg-[#0C1319] border-white/8 p-0 overflow-y-auto", isDesktop ? "w-full sm:max-w-[520px] border-l" : "h-[80vh] rounded-t-[40px] border-t")}>
                <div className={isDesktop ? "p-8 space-y-8" : "p-6 pt-10 space-y-6"}>
                    <SheetHeader className="text-left">
                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">
                        Catat Biaya — {vehicle?.vehicle_plate}
                    </SheetTitle>
                    <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">
                        Dokumentasikan operasional {vehicle?.brand || 'armada'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit(onSubmit, (errs) => toast.error('Harap lengkapi form dengan benar!'))} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Jenis Biaya *</Label>
                             <Select onValueChange={(v) => setValue('expense_type', v)} value={watch('expense_type')}>
                                <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white shadow-inner">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111C24] border-white/10">
                                    <SelectItem value="bbm" className="text-xs font-black uppercase">⛽ BBM</SelectItem>
                                    <SelectItem value="servis" className="text-xs font-black uppercase">🔧 SERVIS</SelectItem>
                                    <SelectItem value="pajak" className="text-xs font-black uppercase">📋 PAJAK</SelectItem>
                                    <SelectItem value="sewa" className="text-xs font-black uppercase">💳 SEWA</SelectItem>
                                    <SelectItem value="lainnya" className="text-xs font-black uppercase">📦 LAINNYA</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Nominal Rp *</Label>
                             <InputRupiah 
                                value={watch('amount')} 
                                onChange={(v) => setValue('amount', v, { shouldValidate: true })} 
                                placeholder="500000" 
                                className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" 
                             />
                             {errors.amount && <p className="text-[9px] text-red-500 font-black uppercase mt-1">{errors.amount.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Keterangan</Label>
                         <Input {...register('description')} placeholder="Contoh: GANTI OLI + FILTER UDARA" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
                    </div>

                    <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Tanggal</Label>
                         <Controller
                            control={control}
                            name="expense_date"
                            render={({ field }) => (
                                <DatePicker 
                                    value={field.value}
                                    onChange={field.onChange}
                                    className="h-14"
                                />
                            )}
                         />
                    </div>

                    <Button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl active:scale-95 transition-all mt-4"
                    >
                        {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN BIAYA'}
                    </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    )
}

function DeleteConfirm({ isOpen, onClose, onConfirm, title, desc }) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="bg-[#111C24] border-white/10 rounded-[32px]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-display font-black text-xl uppercase tracking-tight text-white">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-[#4B6478] font-bold text-xs uppercase tracking-widest">{desc}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl border-white/5 bg-white/5 text-white hover:bg-white/10 font-bold text-[10px] uppercase">Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] uppercase">Ya, Hapus</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// --- SHEET: VEHICLE DETAIL ---
function VehicleDetailSheet({ vehicle, onClose }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const [tab, setTab] = useState('pengiriman')

    const { data: deliveries = [], isLoading: loadDel } = useQuery({
        queryKey: ['vehicle-deliveries', vehicle?.id],
        queryFn: async () => {
            let query = supabase.from('deliveries').select('*, drivers(full_name)')
            if (vehicle?.isUnregistered) {
                query = query.is('vehicle_id', null).eq('is_deleted', false)
            } else {
                query = query.eq('vehicle_id', vehicle?.id).eq('is_deleted', false)
            }
            const { data } = await query.order('created_at', { ascending: false })
            return data || []
        },
        enabled: !!vehicle?.id
    })

    const { data: expenses = [], isLoading: loadExp } = useQuery({
        queryKey: ['vehicle-expenses', vehicle?.id],
        queryFn: async () => {
            const { data } = await supabase.from('vehicle_expenses')
                .select('*')
                .eq('vehicle_id', vehicle?.id)
                .order('expense_date', { ascending: false })
            return data || []
        },
        enabled: !!vehicle?.id
    })

    const totalExpense = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

    return (
        <Sheet open={!!vehicle} onOpenChange={onClose}>
            <SheetContent side={isDesktop ? "right" : "bottom"} className={cn("bg-[#0C1319] border-white/8 p-0 flex flex-col", isDesktop ? "w-full sm:max-w-[520px] border-l" : "h-[90vh] rounded-t-[40px] border-t")}>
                <div className="p-6 border-b border-white/5">
                    <SheetHeader className="text-left">
                        <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight leading-none mb-1" style={{ color: vehicle?.isUnregistered ? '#EF4444' : 'white' }}>
                            {vehicle?.isUnregistered ? 'PENGIRIMAN TANPA KENDARAAN' : vehicle?.vehicle_plate}
                        </SheetTitle>
                        <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest leading-none">
                            {vehicle?.isUnregistered ? 'PERLU AUDIT • KENDARAAN BELUM DIDAFTARKAN' : `${vehicle?.brand || 'TIDAK ADA MERK'} • ${vehicle?.vehicle_type}`}
                        </SheetDescription>
                    </SheetHeader>
                </div>
                
                <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col mt-4">
                    <div className="px-6 mb-4 shrink-0">
                        <TabsList className="w-full bg-[#111C24] border border-white/5 h-12 p-1 rounded-2xl">
                            <TabsTrigger value="pengiriman" className="flex-1 rounded-xl font-black text-[10px] h-full uppercase tracking-widest data-[state=active]:bg-secondary/10 data-[state=active]:text-emerald-400 text-[#4B6478]">
                                Pengiriman ({deliveries.length})
                            </TabsTrigger>
                            <TabsTrigger value="pengeluaran" className="flex-1 rounded-xl font-black text-[10px] h-full uppercase tracking-widest data-[state=active]:bg-secondary/10 data-[state=active]:text-red-400 text-[#4B6478]">
                                Biaya ({expenses.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="pengiriman" className="flex-1 overflow-y-auto px-6 pb-6 m-0 outline-none space-y-3">
                        {loadDel ? <div className="p-4 text-center text-[#4B6478] text-xs font-bold uppercase">Memuat data...</div> : 
                         deliveries.length === 0 ? <div className="p-8 text-center text-[#4B6478] text-xs font-bold uppercase border border-dashed border-white/10 rounded-2xl">Belum ada riwayat pengiriman</div> :
                         deliveries.map(d => (
                            <div key={d.id} className="p-4 rounded-2xl bg-[#111C24] border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-white uppercase">{d.drivers?.full_name || d.driver_name || 'Tanpa Sopir'}</p>
                                        <p className="text-[10px] font-bold text-[#4B6478]">{format(new Date(d.created_at), 'dd MMM yyyy, HH:mm')}</p>
                                        {vehicle?.isUnregistered && d.vehicle_plate && (
                                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-1">PLAT DICATAT: {d.vehicle_plate}</p>
                                        )}
                                    </div>
                                    <Badge className="text-[10px] font-black uppercase tracking-widest border-none bg-emerald-500/10 text-emerald-400">{d.status}</Badge>
                                </div>
                                <div className="flex gap-4 mt-3 pt-3 border-t border-white/5">
                                    <div className="flex-1">
                                        <p className="text-[9px] text-[#4B6478] uppercase font-black tracking-widest">Berat Muatan</p>
                                        <p className="text-xs text-white font-bold">{d.initial_weight_kg ? safeNumber(d.initial_weight_kg).toLocaleString('id-ID') : 0} Kg</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] text-[#4B6478] uppercase font-black tracking-widest">Susut / Mati</p>
                                        <p className="text-xs text-amber-400 font-bold">{d.shrinkage_kg ? safeNumber(d.shrinkage_kg).toLocaleString('id-ID') : 0} Kg</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </TabsContent>

                    <TabsContent value="pengeluaran" className="flex-1 overflow-y-auto px-6 pb-6 m-0 outline-none space-y-4">
                        <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl flex justify-between items-center shrink-0">
                            <span className="text-[10px] uppercase font-black tracking-widest text-red-500/80">Total Biaya Operasional</span>
                            <span className="font-display font-black text-red-400 text-lg">{formatIDR(totalExpense)}</span>
                        </div>
                        {loadExp ? <div className="p-4 text-center text-[#4B6478] text-xs font-bold uppercase">Memuat data...</div> : 
                         expenses.length === 0 ? <div className="p-8 text-center text-[#4B6478] text-xs font-bold uppercase border border-dashed border-white/10 rounded-2xl">Belum ada pengeluaran</div> :
                         expenses.map(exp => (
                            <div key={exp.id} className="p-4 rounded-2xl bg-[#111C24] border border-white/5 flex gap-4 items-start">
                                <div className="w-10 h-10 shrink-0 bg-white/5 rounded-xl flex items-center justify-center text-lg">
                                    {exp.expense_type === 'bbm' ? '⛽' : exp.expense_type === 'servis' ? '🔧' : exp.expense_type === 'pajak' ? '📋' : exp.expense_type === 'sewa' ? '💳' : '📦'}
                                </div>
                                <div className="flex-1 space-y-1 mt-0.5">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-black text-white uppercase">{exp.expense_type}</p>
                                        <span className="font-display text-sm font-black text-red-400">{formatIDR(exp.amount)}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-[#4B6478]">{format(new Date(exp.expense_date), 'dd MMM yyyy')}</p>
                                    {exp.description && <p className="text-xs font-bold text-[#94A3B8] uppercase mt-2">{exp.description}</p>}
                                </div>
                            </div>
                         ))}
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}

// --- SHEET: DRIVER DETAIL ---
function DriverDetailSheet({ driver, onClose }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const { data: deliveries = [], isLoading: loadDel } = useQuery({
        queryKey: ['driver-deliveries', driver?.id],
        queryFn: async () => {
            let query = supabase.from('deliveries').select('*, vehicles(vehicle_plate, brand), sales!inner(id, is_deleted)')
            if (driver?.isUnregistered) {
                query = query.is('driver_id', null).eq('is_deleted', false)
            } else {
                query = query.eq('driver_id', driver?.id).eq('is_deleted', false)
            }
            query = query.eq('sales.is_deleted', false)
            const { data } = await query.order('created_at', { ascending: false })
            return data || []
        },
        enabled: !!driver?.id
    })

    return (
        <Sheet open={!!driver} onOpenChange={onClose}>
            <SheetContent side={isDesktop ? "right" : "bottom"} className={cn("bg-[#0C1319] border-white/8 p-0 flex flex-col", isDesktop ? "w-full sm:max-w-[520px] border-l" : "h-[90vh] rounded-t-[40px] border-t")}>
                <div className="p-6 border-b border-white/5 flex gap-4 items-center">
                    <Avatar className="h-14 w-14 rounded-[20px] border border-white/5 shrink-0" style={{ backgroundColor: driver?.isUnregistered ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }}>
                        <AvatarFallback className="bg-transparent font-display font-black text-lg uppercase" style={{ color: driver?.isUnregistered ? '#EF4444' : '#34D399' }}>
                            {driver?.isUnregistered ? '?' : driver?.full_name?.substring(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight leading-none mb-1 truncate">
                            {driver?.full_name}
                        </SheetTitle>
                        <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest leading-none">
                            SOPIR • {driver?.phone}
                        </SheetDescription>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] mb-2">Riwayat Pengiriman ({deliveries.length})</h4>
                    
                    {loadDel ? <div className="p-4 text-center text-[#4B6478] text-xs font-bold uppercase">Memuat data...</div> : 
                     deliveries.length === 0 ? <div className="p-8 text-center text-[#4B6478] text-xs font-bold uppercase border border-dashed border-white/10 rounded-2xl">Belum ada riwayat pengiriman</div> :
                     deliveries.map(d => (
                        <div key={d.id} className="p-4 rounded-2xl bg-[#111C24] border border-white/5">
                            <div className="flex justify-between items-start mb-2">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-white uppercase">{d.vehicles?.vehicle_plate || d.vehicle_plate || 'Tanpa Kendaraan'}</p>
                                    <p className="text-[10px] font-bold text-[#4B6478]">{format(new Date(d.created_at), 'dd MMM yyyy, HH:mm')}</p>
                                    {driver?.isUnregistered && d.driver_name && (
                                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-1">NAMA DICATAT: {d.driver_name}</p>
                                    )}
                                </div>
                                <Badge className="text-[10px] font-black uppercase tracking-widest border-none bg-emerald-500/10 text-emerald-400">{d.status}</Badge>
                            </div>
                            <div className="flex gap-4 mt-3 pt-3 border-t border-white/5">
                                <div className="flex-1">
                                    <p className="text-[9px] text-[#4B6478] uppercase font-black tracking-widest">Berat Muatan</p>
                                    <p className="text-xs text-white font-bold">{d.initial_weight_kg ? safeNumber(d.initial_weight_kg).toLocaleString('id-ID') : 0} Kg</p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] text-[#4B6478] uppercase font-black tracking-widest">Upah (Estimasi)</p>
                                    <p className="text-xs text-blue-400 font-bold">{driver?.isUnregistered ? '-' : formatIDR(driver?.wage_per_trip || 0)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    )
}
