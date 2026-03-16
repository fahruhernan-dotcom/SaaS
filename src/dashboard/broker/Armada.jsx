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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { formatIDR, safeNumber, safePercent } from '@/lib/format'

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
    vehicle_type: z.enum(['truk', 'pickup', 'l300', 'motor', 'lainnya']),
    vehicle_plate: z.string().min(3).toUpperCase(),
    brand: z.string().optional(),
    year: z.string().optional(),
    capacity_ekor: z.string().optional(),
    capacity_kg: z.string().optional(),
    ownership: z.enum(['milik_sendiri', 'sewa', 'pinjaman']),
    rental_cost: z.string().optional(),
    rental_owner: z.string().optional(),
    status: z.enum(['aktif', 'nonaktif', 'servis']),
    last_service_date: z.string().optional(),
    notes: z.string().optional()
})

const driverSchema = z.object({
    full_name: z.string().min(2),
    phone: z.string().min(8),
    sim_number: z.string().optional(),
    sim_type: z.enum(['A', 'B1', 'B2', 'C']).default('B1'),
    sim_expires_at: z.string().optional(),
    status: z.enum(['aktif', 'nonaktif', 'cuti']),
    wage_per_trip: z.string().default('0'),
    address: z.string().optional(),
    notes: z.string().optional()
})

const expenseSchema = z.object({
    expense_type: z.enum(['bbm', 'servis', 'pajak', 'sewa', 'lainnya']),
    amount: z.string().min(1),
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
                .select('*, deliveries(id, created_at)')
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
                .select('*, deliveries(id, created_at)')
                .eq('tenant_id', tenant?.id)
                .eq('is_deleted', false)
                .order('full_name', { ascending: true })
            if (error) throw error
            return data
        },
        enabled: !!tenant?.id
    })

    // --- STATE ---
    const [isVehicleSheetOpen, setIsVehicleSheetOpen] = useState(false)
    const [editingVehicle, setEditingVehicle] = useState(null)
    const [isDriverSheetOpen, setIsDriverSheetOpen] = useState(false)
    const [editingDriver, setEditingDriver] = useState(null)
    const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false)
    const [selectedVehicleForExpense, setSelectedVehicleForExpense] = useState(null)
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
                                className="h-9 w-9 p-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                                onClick={() => {
                                    setEditingVehicle(null)
                                    setIsVehicleSheetOpen(true)
                                }}
                            >
                                <Plus size={18} strokeWidth={3} />
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
                        {/* Vehicle Summary */}
                        <div className="flex overflow-x-auto pb-2 scrollbar-none gap-3">
                            <SummaryPill label="Total" count={vehicles.length} />
                            <SummaryPill label="Aktif" count={vehicles.filter(v => v.status === 'aktif').length} color="emerald" />
                            <SummaryPill label="Servis" count={vehicles.filter(v => v.status === 'servis').length} color="amber" />
                            <SummaryPill label="Nonaktif" count={vehicles.filter(v => v.status === 'nonaktif').length} color="gray" />
                        </div>

                        {/* Filter Chips */}
                        <div className="flex gap-2">
                            {['Semua', 'Aktif', 'Servis', 'Nonaktif'].map(f => (
                                <FilterChip 
                                    key={f} 
                                    label={f} 
                                    active={vehicleFilter === f} 
                                    onClick={() => setVehicleFilter(f)} 
                                />
                            ))}
                        </div>

                        {/* Vehicle Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {vehicles.filter(v => vehicleFilter === 'Semua' || v.status === vehicleFilter.toLowerCase()).map(v => (
                                <VehicleCard 
                                    key={v.id} 
                                    vehicle={v} 
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
                         {/* Driver Summary */}
                         <div className="flex overflow-x-auto pb-2 scrollbar-none gap-3">
                            <SummaryPill label="Total" count={drivers.length} />
                            <SummaryPill label="Aktif" count={drivers.filter(d => d.status === 'aktif').length} color="emerald" />
                            <SummaryPill label="Cuti" count={drivers.filter(d => d.status === 'cuti').length} color="amber" />
                            <SummaryPill label="Nonaktif" count={drivers.filter(d => d.status === 'nonaktif').length} color="gray" />
                        </div>

                        {/* Filter Chips */}
                        <div className="flex gap-2">
                            {['Semua', 'Aktif', 'Nonaktif', 'Cuti'].map(f => (
                                <FilterChip 
                                    key={f} 
                                    label={f} 
                                    active={driverFilter === f} 
                                    onClick={() => setDriverFilter(f)} 
                                />
                            ))}
                        </div>

                        {/* Driver Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {drivers.filter(d => driverFilter === 'Semua' || d.status === driverFilter.toLowerCase()).map(d => (
                                <DriverCard 
                                    key={d.id} 
                                    driver={d} 
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
        </motion.div>
    )
}

// --- COMPONENTS ---

function SummaryPill({ label, count, color }) {
    const colors = {
        emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        gray: "bg-white/5 border-white/10 text-[#4B6478]",
        default: "bg-[#111C24] border-white/5 text-[#94A3B8]"
    }
    return (
        <div className={cn(
            "px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 whitespace-nowrap",
            colors[color] || colors.default
        )}>
            <span>{label}</span>
            <span className="text-xs bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 text-white">{count}</span>
        </div>
    )
}

function FilterChip({ label, active, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                active ? "bg-white text-black" : "bg-white/5 text-[#4B6478] hover:bg-white/10"
            )}
        >
            {label}
        </button>
    )
}

function VehicleCard({ vehicle, onEdit, onAddExpense }) {
    const statusMeta = {
        aktif:    { label: 'Aktif',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        servis:   { label: 'Servis',   color: 'text-amber-400',   bg: 'bg-amber-500/10' },
        nonaktif: { label: 'Nonaktif', color: 'text-[#4B6478]',   bg: 'bg-white/5' }
    }
    const meta = statusMeta[vehicle.status] || statusMeta.nonaktif

    return (
        <Card className="bg-[#111C24] border-white/5 rounded-[32px] overflow-hidden group hover:border-white/10 transition-all">
            <CardContent className="p-6 space-y-5">
                {/* Row 1: Plate & Status */}
                <div className="flex justify-between items-start">
                    <h3 className="font-display text-lg font-black tracking-tight text-[#F1F5F9] uppercase">{vehicle.vehicle_plate}</h3>
                    <Badge className={cn("rounded-lg border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", meta.bg, meta.color)}>
                        {meta.label}
                    </Badge>
                </div>

                {/* Row 2: Type, Brand, Year */}
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="capitalize">{vehicle.vehicle_type}</span>
                    {vehicle.brand && <><span>·</span> {vehicle.brand}</>}
                    {vehicle.year && <><span>·</span> {vehicle.year}</>}
                </p>

                {/* Row 3: Ownership & Capacity */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        {vehicle.ownership === 'milik_sendiri' && <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-[#4B6478]">Milik Sendiri</Badge>}
                        {vehicle.ownership === 'sewa' && <Badge variant="outline" className="text-[8px] font-black uppercase border-amber-500/20 text-amber-500 bg-amber-500/5">Sewa · {formatIDR(vehicle.rental_cost)}/trip</Badge>}
                        {vehicle.ownership === 'pinjaman' && <Badge variant="outline" className="text-[8px] font-black uppercase border-blue-500/20 text-blue-500 bg-blue-500/5">Pinjaman: {vehicle.rental_owner}</Badge>}
                    </div>
                    <p className="text-[11px] font-bold text-[#4B6478] flex items-center gap-1.5">
                        {vehicle.capacity_ekor && <span>{vehicle.capacity_ekor} Ekor</span>}
                        {vehicle.capacity_ekor && vehicle.capacity_kg && <span>·</span>}
                        {vehicle.capacity_kg && <span>{vehicle.capacity_kg} Kg</span>}
                    </p>
                </div>

                {/* Row 4: Stats */}
                <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] font-black text-[#4B6478] uppercase tracking-widest">
                    <Clock size={12} />
                    <span>Total {vehicle.deliveries?.length || 0} Pengiriman</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={onAddExpense}
                        className="flex-1 h-9 rounded-xl border-white/5 bg-white/[0.02] text-[9px] font-black uppercase tracking-widest hover:bg-white/5"
                    >
                         <DollarSign size={12} className="mr-1.5 text-red-400" /> Catat Biaya
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={onEdit}
                        className="w-12 h-9 rounded-xl border-white/5 bg-white/[0.02] text-[#4B6478] hover:text-white"
                    >
                        <Edit2 size={14} />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function DriverCard({ driver, onEdit }) {
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
        <Card className="bg-[#111C24] border-white/5 rounded-[32px] overflow-hidden group hover:border-white/10 transition-all">
            <CardContent className="p-6 space-y-5">
                {/* Row 1: Identity */}
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-[18px] border border-white/5 bg-emerald-500/10">
                        <AvatarFallback className="bg-transparent text-emerald-400 font-display font-black text-sm uppercase">
                            {driver.full_name.substring(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h3 className="font-display font-black text-sm text-white uppercase truncate">{driver.full_name}</h3>
                            <Badge className={cn("rounded-lg border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-widest", meta.bg, meta.color)}>
                                {meta.label}
                            </Badge>
                        </div>
                        <a href={`tel:${driver.phone}`} className="flex items-center gap-1.5 mt-1 text-[#4B6478] hover:text-white transition-colors">
                            <Phone size={11} />
                            <span className="text-[11px] font-bold">{driver.phone}</span>
                        </a>
                    </div>
                </div>

                {/* Row 2: SIM Info */}
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest flex items-center gap-2">
                        <CreditCard size={12} className="text-blue-400/50" />
                        SIM {driver.sim_type} · NO. {driver.sim_number || '—'}
                    </p>
                    
                    {expiryDays !== null && (
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl border",
                            isExpired ? "bg-red-500/10 border-red-500/20 text-red-400" :
                            isSoonExpiry ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                            "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/50"
                        )}>
                            {isExpired ? <X size={12} strokeWidth={3} /> : isSoonExpiry ? <AlertCircle size={12} strokeWidth={3} /> : <CheckCircle2 size={12} />}
                            <span className="text-[9px] font-black uppercase tracking-tight">
                                {isExpired ? 'SIM Kadaluarsa!' : isSoonExpiry ? `Masa berlaku sisa ${expiryDays} hari` : `Berlaku s/d ${format(new Date(driver.sim_expires_at), 'dd MMM yyyy')}`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Row 3: Stats */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-black text-[#4B6478] uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                        <DollarSign size={12} />
                        <span>Rp {driver.wage_per_trip?.toLocaleString()}/Trip</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Truck size={12} />
                        <span>{driver.deliveries?.length || 0} Pengiriman</span>
                    </div>
                </div>

                {/* Actions */}
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onEdit}
                    className="w-full h-10 rounded-xl border-white/5 bg-white/[0.02] text-[9px] font-black uppercase tracking-widest hover:bg-white/5 gap-2"
                >
                    <Edit2 size={12} /> Edit Profil Sopir
                </Button>
            </CardContent>
        </Card>
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
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
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
            <SheetContent side="bottom" className="h-[90vh] bg-[#0C1319] border-white/10 rounded-t-[40px] px-6 text-left overflow-y-auto">
                <SheetHeader className="mb-8">
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
                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Jenis Kendaraan *</Label>
                            <Select onValueChange={(v) => setValue('vehicle_type', v)} value={watch('vehicle_type')}>
                                <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white shadow-inner">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111C24] border-white/10">
                                    <SelectItem value="truk" className="text-xs font-black uppercase">🚚 Truk</SelectItem>
                                    <SelectItem value="pickup" className="text-xs font-black uppercase">🛻 Pickup</SelectItem>
                                    <SelectItem value="l300" className="text-xs font-black uppercase">📦 L300</SelectItem>
                                    <SelectItem value="motor" className="text-xs font-black uppercase">🏍️ Motor</SelectItem>
                                    <SelectItem value="lainnya" className="text-xs font-black uppercase">🚜 Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Plat Nomor *</Label>
                             <Input 
                                {...register('vehicle_plate')} 
                                placeholder="B 1234 ABC" 
                                className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase placeholder:text-white/10" 
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
                                </SelectContent>
                            </Select>
                        </div>

                        {ownership === 'sewa' && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Biaya Sewa / Trip Rp</Label>
                                <Input {...register('rental_cost')} type="number" placeholder="150000" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
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
                             <Input {...register('capacity_ekor')} type="number" placeholder="500" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
                        </div>
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Cap. Kg</Label>
                             <Input {...register('capacity_kg')} type="number" step="0.1" placeholder="800" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
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
                             <Input {...register('last_service_date')} type="date" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white" />
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
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
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
        const payload = {
            ...vals,
            tenant_id: tenantId,
            wage_per_trip: parseInt(vals.wage_per_trip) || 0
        }

        const { error } = editingData 
            ? await supabase.from('drivers').update(payload).eq('id', editingData.id)
            : await supabase.from('drivers').insert(payload)

        if (error) {
            toast.error('Gagal menyimpan data sopir')
        } else {
            toast.success('Sopir tersimpan!')
            queryClient.invalidateQueries(['drivers'])
            onClose()
        }
        setIsSubmitting(false)
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
            <SheetContent side="bottom" className="h-[90vh] bg-[#0C1319] border-white/10 rounded-t-[40px] px-6 text-left overflow-y-auto">
                <SheetHeader className="mb-8">
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
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Nama Lengkap *</Label>
                             <Input {...register('full_name')} placeholder="PAK AHMAD FAUZI" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
                             {errors.full_name && <p className="text-[9px] text-red-500 font-black uppercase">{errors.full_name.message}</p>}
                        </div>
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">No. WhatsApp / HP *</Label>
                             <Input {...register('phone')} type="tel" placeholder="08123456789" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" />
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
                             <Input {...register('sim_expires_at')} type="date" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white" />
                             {simIndicator && <p className={cn("text-[9px] font-black uppercase mt-1 ml-1", simIndicator.color)}>{simIndicator.label}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Upah Per Trip Rp</Label>
                             <Input {...register('wage_per_trip')} type="number" placeholder="150000" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
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
                            className="w-full h-16 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
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
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const { register, handleSubmit, setValue, reset, watch } = useForm({
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
            <SheetContent side="bottom" className="h-[80vh] bg-[#0C1319] border-white/10 rounded-t-[40px] px-6 text-left">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">
                        Catat Biaya — {vehicle?.vehicle_plate}
                    </SheetTitle>
                    <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">
                        Dokumentasikan operasional {vehicle?.brand || 'armada'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                             <Input {...register('amount')} type="number" placeholder="500000" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs" />
                        </div>
                    </div>

                    <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Keterangan</Label>
                         <Input {...register('description')} placeholder="Contoh: GANTI OLI + FILTER UDARA" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase" />
                    </div>

                    <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">Tanggal</Label>
                         <Input {...register('expense_date')} type="date" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white" />
                    </div>

                    <Button 
                        disabled={isSubmitting}
                        className="w-full h-16 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl active:scale-95 transition-all mt-4"
                    >
                        {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN BIAYA'}
                    </Button>
                </form>
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
