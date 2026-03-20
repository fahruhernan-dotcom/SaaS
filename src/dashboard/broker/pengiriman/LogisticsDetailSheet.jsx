import React from 'react'
import { Truck, User, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Timeline } from '@/dashboard/broker/pengiriman/DeliveryCard'

export default function LogisticsDetailSheet({ isOpen, onClose, delivery }) {
    if (!delivery) return null

    const isAbnormal = (delivery.mortality_count || 0) > 0 || (delivery.shrinkage_kg || 0) > 0
    const farmName = delivery.sales?.purchases?.farms?.farm_name || 'Farm Unknown'
    const rpaName = delivery.sales?.rpa_clients?.rpa_name || 'Buyer Unknown'

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full md:w-[520px] bg-[#0C1319] border-l border-white/8 p-0 flex flex-col overflow-hidden text-left">
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
                                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1 text-left">Dari Kandang</p>
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
                            <div className="p-5 border-b border-white/5 flex justify-between items-center text-left">
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1 text-left">Populasi</p>
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
                            <div className="p-5 flex justify-between items-center bg-white/[0.02] text-left">
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1 text-left">Tonase Tiba</p>
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
                        <div className="space-y-3 text-left">
                            <h4 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] text-left">Catatan Lapangan</h4>
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
