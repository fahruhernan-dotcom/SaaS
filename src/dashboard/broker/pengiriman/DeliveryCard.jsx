import React, { useRef, useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'

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

    const trackRef = useRef(null)
    const [truckLeft, setTruckLeft] = useState(-6)
    const [isMoving, setIsMoving] = useState(false)

    useEffect(() => {
        const updatePosition = () => {
            const trackWidth = trackRef.current?.offsetWidth ?? 0
            const truckWidth = 54
            
            const positions = {
                preparing: -6,
                loading: -6,
                on_route: trackWidth / 3 - truckWidth / 2 + 12,
                arrived: trackWidth * 2 / 3 - truckWidth / 2 + 12,
                completed: trackWidth - truckWidth / 2 + 6
            }
            
            setTruckLeft(positions[delivery.status] ?? -6)
            
            setIsMoving(true)
            const bounceTimer = setTimeout(() => setIsMoving(false), 500)
            return bounceTimer
        }

        const timer = setTimeout(updatePosition, 100)
        window.addEventListener('resize', updatePosition)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', updatePosition)
        }
    }, [delivery.status])

    return (
        <div className="relative pt-6">
            <style>{`
                .moving-bounce {
                    animation: truckBounce 0.5s ease;
                }
                @keyframes truckBounce {
                    0%, 100% { transform: translateY(0); }
                    35%  { transform: translateY(-1px); }
                    70%  { transform: translateY(0.5px); }
                }
                .puff {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: rgba(200,230,210,0.5);
                    opacity: 0;
                    animation: floatUp infinite;
                }
                @keyframes floatUp {
                    0%   { opacity: 0; transform: translate(0, 0) scale(0.4); }
                    15%  { opacity: 0.7; }
                    60%  { opacity: 0.3; }
                    100% { opacity: 0; transform: translate(6px, -30px) scale(2); }
                }
            `}</style>
            
            <div className="absolute top-[34px] left-[10%] right-[10%] z-20">
                <div 
                    className="truck-wrap"
                    style={{ 
                        position: 'absolute', 
                        top: '-34px', 
                        left: `${truckLeft}px`,
                        width: '54px',
                        height: '54px',
                        transition: 'left 0.9s cubic-bezier(0.34, 1.3, 0.64, 1)',
                        pointerEvents: 'none'
                    }}
                >
                    <div className={isMoving ? 'moving-bounce' : ''}>
                        <svg width="54" height="54" viewBox="0 0 128 128" style={{ transform: 'scaleX(-1)', display: 'block' }}>
                            <path d="M57.99 53.73s-.53-1.53-1.68-2.06c-1.14-.53-3.05-.61-3.05-.61l-3.2 37.85l2.6 18.68s.76 2.21 2.75 2.29c1.98.08 18.47 0 19.92 0c1.45 0 1.91-1.91 1.98-2.75c.08-.84.05-2.25.05-2.25l7.04-.03s.41 3-.27 4.89c-.59 1.64-1.12 2.95-1.11 3.51c.01.8 1.07 1.6 2.29 1.53c1.22-.08 3.05-1.68 4.27-2.67c1.22-.99 20.78-.76 20.78-.76s.94 1.74 1.99 2.79c.63.63 1.65.94 2.57.94c.92 0 2.06-1.22 1.83-2.06c-.23-.84-1.27-2.77-1.45-4.65c-.08-.85.02-3.22.44-3.61c.1-.09 1.62-.04 3.04-.19c2.42-.25 4.84-3.38 5.14-5.82c.31-2.44.08-10.15.08-10.15L57.99 53.73z" fill="#047857"/>
                            <path d="M52.02 96.11h72.03s.17 2.02-.18 3.32a5.612 5.612 0 0 1-.93 1.91l-70.51-.01l-.41-5.22z" fill="#065f46"/>
                            <path d="M26.75 92.84L11.5 97.56l-7.62-2.63s.27-14.34.36-15.79c.09-1.45.45-2.72 1.82-3.63c1.36-.91 5.17-3.18 5.17-3.18s11.71-18.79 12.71-20.15c1-1.36 2.23-3.02 5.14-3.29s20.87-.05 22.5.04c1.63.09 2.85.83 2.85 4.37s-.09 30.56-.18 31.92c-.09 1.36-6.9 6.35-6.9 6.35l-20.6 1.27z" fill="#10B981"/>
                            <path d="M48.95 110.03s1.46.04 2.47-.1s2.53-1.15 2.6-3.54c.04-1.42.23-21.17.23-21.17l-27.2.06l-8.8 9.63l-14.37.02s-.06 5.65-.02 7.16c.04 1.52 7.86 4.83 7.86 4.83l37.23 3.11z" fill="#059669"/>
                            <path d="M3.86 102.09h16.38s3.51-7 13.6-6.88c14.82.18 15.12 14.81 15.12 14.81h-38.6c-2.17 0-5.27-.72-6.06-3.46c-.67-2.3-.44-4.47-.44-4.47z" fill="#047857"/>
                            <path d="M13.89 76.26s0-1.63-1.07-1.69s-2.25.61-3.32 1.52c-1.13.96-1.69 1.83-1.91 2.59c-.34 1.13-.06 2.14 1.69 2.19c2.14.07 36.12-.15 37.69-.28c1.97-.17 3.15-1.01 3.09-2.48c-.05-1.41-1.07-1.86-5.29-1.91s-30.88.06-30.88.06z" fill="#d1fae5"/>
                            <path d="M4.2 81.03s10.21-.32 10.43-.07c.31.37.37 5.19.26 5.92c-.11.73-1.07 1.24-2.25 1.29s-8.61.17-8.61.17l.17-7.31z" fill="#a7f3d0"/>
                            <path d="M46.24 74.51c1.58 0 2.14-1.8 2.14-3.04V55.78c0-1.24-.79-1.91-3.26-2.03c-2.48-.11-13.78.02-15.02.06c-1.91.06-3.21.9-4.95 3.32c-1.13 1.57-8.1 13.11-8.66 14.06c-.56.96-1.24 3.49 1.69 3.54c3.03.06 28.06-.22 28.06-.22z" fill="#065f46"/>
                            <path d="M19.63 71.87h25.2c.51 0 .96-.56.96-1.24s.04-11.3.06-11.93c.06-1.74-1.24-2.14-2.36-2.08c-1.13.06-12.51.02-13.18.05c-1.29.06-2.57 1.79-3.69 3.5c-1.35 2.07-6.99 11.7-6.99 11.7z" fill="#67e8f9"/>
                            <path d="M20.02 73.73c.11 2.53 4.16 4.61 5.18 4.67c1.01.06 1.63-1.91 1.74-4.56S25.99 69 25.14 69c-.84 0-5.21 2.59-5.12 4.73z" fill="#047857"/>
                            <path d="M20.9 111.62c.08 5 4.06 12.19 12.72 12.24c8.66.05 13.16-6.59 12.88-13.4c-.28-6.92-5.65-11.81-13.38-11.59c-7.23.22-12.33 5.84-12.22 12.75z" fill="#134e2a"/>
                            <path d="M27.09 111.33c.04 2.63 2.13 6.43 6.69 6.46s6.76-3.27 6.62-6.86c-.15-3.65-3.06-6.37-6.88-6.31c-3.8.05-6.48 3.06-6.43 6.71z" fill="#34D399"/>
                            <path d="M86.9 111.62c.08 5 4.06 12.19 12.72 12.24c8.66.05 13.16-6.59 12.88-13.4c-.28-6.92-5.65-11.81-13.38-11.59c-7.23.22-12.33 5.84-12.22 12.75z" fill="#134e2a"/>
                            <path d="M93.09 111.33c.04 2.63 2.13 6.43 6.69 6.46c4.55.03 6.76-3.27 6.62-6.86c-.15-3.65-3.06-6.37-6.88-6.31c-3.8.05-6.48 3.06-6.43 6.71z" fill="#34D399"/>
                            <path d="M56.87 28.62c0-2.62 1.15-3.67 3.25-3.56c2.1.1 59.65-.21 61.53-.21s2.62 1.99 2.62 3.14c0 1.15-.36 59.49-.28 60.62c.07 1.13-.24 2.7-2.23 2.91s-61.01.1-62.27 0s-2.83-1.15-2.83-2.62c0-1.48.21-58.92.21-60.28z" fill="#065f46"/>
                            <path d="M62.11 30.92c0 1.36-.42 52.31-.42 53.57c0 1.26.63 2.73 2.31 2.73c1.68 0 53.25.1 54.3 0c1.05-.1 1.68-.73 1.78-2.41c.1-1.68.1-52.83.1-54.51c0-1.68-1.68-1.78-3.46-1.78s-52.2.1-52.94.21c-.73.09-1.67.83-1.67 2.19z" fill="#10B981"/>
                            <path d="M74.45 89c-.06-18.45-.19-61.48.02-62.65l1.48.27l1.49.18c-.14 1.65-.07 38.09.01 62.19l-3 .01z" fill="#047857"/>
                            <path fill="#047857" d="M89.75 26.52h3V89.1h-3z"/>
                            <path fill="#047857" d="M104.89 26.57h3v62.27h-3z"/>
                            <circle cx="8" cy="78" r="3.5" fill="#FEF08A" opacity="0.8"/>
                            <circle cx="8" cy="78" r="7" fill="#FEF08A" opacity="0.12"/>
                        </svg>
                    </div>

                    {/* ASAP KNALPOT */}
                    <div className="puff" style={{ animationDelay: '0s', animationDuration: '1.8s' }} />
                    <div className="puff" style={{ animationDelay: '0.6s', animationDuration: '2.2s' }} />
                    <div className="puff" style={{ animationDelay: '1.2s', animationDuration: '1.6s' }} />
                    <div className="puff" style={{ animationDelay: '0.3s', animationDuration: '2s' }} />
                    <div className="puff" style={{ animationDelay: '0.9s', animationDuration: '1.4s' }} />
                </div>
            </div>

            <div 
                ref={trackRef}
                className="absolute top-[34px] left-[10%] right-[10%] h-[2px] bg-white/10 rounded-full overflow-hidden"
            >
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
                         <DetailItem 
                             icon={Truck} 
                             label="Kendaraan" 
                             value={
                                 <div className="flex flex-col gap-1 items-start">
                                     <span className="truncate w-full">{delivery.vehicles ? `${delivery.vehicles.brand || ''} ${delivery.vehicles.vehicle_plate || ''}`.trim() : `${delivery.vehicle_type || '-'} ${delivery.vehicle_plate || ''}`.trim()}</span>
                                     {!delivery.vehicle_id && (
                                         <Badge className="border-none bg-red-500/10 text-red-400 text-[8px] font-black uppercase px-1.5 py-0 h-4 rounded-md">
                                             Belum Terdaftar
                                         </Badge>
                                     )}
                                 </div>
                             } 
                         />
                         <DetailItem 
                             icon={User} 
                             label="Sopir" 
                             value={
                                 <div className="flex flex-col gap-1 items-start">
                                     <span className="truncate w-full">{delivery.drivers?.full_name || delivery.driver_name || '-'}</span>
                                     {!delivery.driver_id && (
                                         <Badge className="border-none bg-red-500/10 text-red-400 text-[8px] font-black uppercase px-1.5 py-0 h-4 rounded-md">
                                             Belum Terdaftar
                                         </Badge>
                                     )}
                                 </div>
                             } 
                         />
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
