import React from 'react'
import { motion } from 'framer-motion'
import { 
    Truck, Package, CheckCircle2, 
    Clock, MapPin, User, 
    Pencil, Check
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// --- ANIMATIONS ---
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
    }
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

export default function DeliveryCard({ delivery, onUpdateTiba, onShowLogistics, onEditArrival }) {
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

export { Timeline }
