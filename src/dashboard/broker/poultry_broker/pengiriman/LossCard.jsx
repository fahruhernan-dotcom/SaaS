import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
    Truck, AlertTriangle, 
    User, TrendingDown, Calendar,
    Check
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { formatIDR } from '@/lib/format'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

import { Card } from '@/components/ui/card'
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

function SummaryPill({ label, sub, color }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const colors = {
        red: "bg-red-500/15 text-red-400 border-red-500/20",
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/10",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/10"
    }

    return (
        <div className={cn("px-4 py-2 rounded-xl border flex flex-col transition-all hover:scale-105", colors[color])}>
            <span className={cn("font-black uppercase tracking-tight", isDesktop ? "text-xs" : "text-sm")}>{label}</span>
            <span className={cn("font-bold opacity-60 uppercase tracking-widest leading-none mt-1", isDesktop ? "text-[8px]" : "text-[11px]")}>{sub}</span>
        </div>
    )
}

export function LossSummary({ lossReports }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
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
        <Card className={cn("bg-red-500/[0.03] border-red-500/15 shadow-2xl relative overflow-hidden", isDesktop ? "rounded-[28px] p-6 mb-8" : "rounded-2xl p-4 mb-4")}>
            <div className="absolute top-0 right-0 p-8 text-red-500/5">
                <TrendingDown size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10 space-y-6">
                <div>
                   <p className={cn("font-black text-[#4B6478] uppercase tracking-[0.25em] mb-2", isDesktop ? "text-[10px]" : "text-xs")}>Kerugian Bulan Ini</p>
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
                    <p className={cn("font-bold text-red-300 uppercase leading-relaxed tracking-wider", isDesktop ? "text-[10px]" : "text-xs")}>
                        Loss rate berada di angka cukup tinggi. Periksa kembali efisiensi armada dan penanganan di farm.
                    </p>
                </div>
            </div>
        </Card>
    )
}

export default function LossCard({ entry, onResolve, isResolving }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
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
            <Card className={cn("bg-[#111C24] border-white/5 overflow-hidden shadow-xl hover:border-white/10 transition-all group", isDesktop ? "rounded-[28px]" : "rounded-[22px]")}>
                {/* Header: RPA + Date + Status */}
                <div className={cn("flex justify-between items-start", isDesktop ? "p-6 pb-4" : "p-4 pb-3")}>
                    <div className="space-y-0.5 flex-1 min-w-0 mr-2">
                        <h4 className={cn("font-display font-black text-white uppercase tracking-tight truncate", isDesktop ? "text-base max-w-[250px]" : "text-[13px]")}>{rpaName}</h4>
                        <div className={cn("flex items-center gap-1.5 font-black text-[#4B6478] uppercase tracking-widest", isDesktop ? "text-[10px]" : "text-[9px]")}>
                            <Calendar size={10} />
                            {format(new Date(entry.report_date || new Date()), isDesktop ? 'dd MMMM yyyy' : 'dd MMM yyyy', { locale: id })}
                        </div>
                    </div>
                    {isAllResolved ? (
                         <Badge className={cn("bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black px-2.5 py-1 rounded-xl uppercase tracking-widest flex gap-1.5 whitespace-nowrap shrink-0", isDesktop ? "text-[9px]" : "text-[9px]")}>
                             <Check size={10} strokeWidth={4} /> Selesai
                         </Badge>
                    ) : (
                        <Badge className={cn("bg-red-500/20 text-red-500 border border-red-500/30 font-black px-2.5 py-1 rounded-xl uppercase tracking-widest whitespace-nowrap shrink-0", isDesktop ? "text-[9px]" : "text-[9px]")}>
                            Pending
                        </Badge>
                    )}
                </div>

                {/* Logistics Info Strip */}
                <div className={cn("bg-white/[0.02] border-y border-white/5 flex items-center gap-3", isDesktop ? "px-6 py-3" : "px-4 py-2")}>
                     <div className="flex items-center gap-1.5">
                         <User size={11} className="text-[#4B6478]" />
                         <span className={cn("font-black text-[#94A3B8] uppercase", isDesktop ? "text-[10px]" : "text-[10px]")}>{driverName}</span>
                     </div>
                     <div className="w-1 h-1 rounded-full bg-white/10" />
                     <div className="flex items-center gap-1.5">
                         <Truck size={11} className="text-[#4B6478]" />
                         <span className={cn("font-black text-[#94A3B8] uppercase", isDesktop ? "text-[10px]" : "text-[10px]")}>{vehiclePlate}</span>
                     </div>
                </div>

                {/* Loss Details Grid: 2 Columns */}
                <div className="grid grid-cols-2 divide-x divide-white/5">
                    {/* Mortality Column */}
                    <div className={cn("space-y-2", isDesktop ? "p-6 space-y-3" : "p-4")}>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                             <span className={cn("font-black uppercase tracking-widest text-[#4B6478]", "text-[10px]")}>Mortalitas</span>
                        </div>
                        {entry.mortality ? (
                            <div className="space-y-0.5">
                                <p className={cn("font-black text-red-400", isDesktop ? "text-lg" : "text-base")}>{entry.mortality.chicken_count} <span className="text-[10px] uppercase ml-1">Ekor</span></p>
                                <p className={cn("font-bold text-red-400/40 uppercase leading-tight", "text-[9px]")}>Rp 0 — tdk pengaruhi revenue</p>
                            </div>
                        ) : (
                            <p className={cn("font-bold text-white/5 uppercase italic", "text-[10px]")}>Tidak ada</p>
                        )}
                    </div>

                    {/* Shrinkage Column */}
                    <div className={cn("space-y-2", isDesktop ? "p-6 space-y-3" : "p-4")}>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                             <span className={cn("font-black uppercase tracking-widest text-[#4B6478]", "text-[10px]")}>Susut Berat</span>
                        </div>
                        {entry.shrinkage ? (
                            <div className="space-y-0.5">
                                <p className={cn("font-black text-amber-500", isDesktop ? "text-lg" : "text-base")}>{entry.shrinkage.weight_loss_kg.toFixed(1)} <span className="text-[10px] uppercase ml-1">Kg</span></p>
                                <p className={cn("font-bold text-amber-500/60 uppercase", "text-[10px]")}>Loss: {formatIDR(entry.shrinkage.financial_loss)}</p>
                            </div>
                        ) : (
                            <p className={cn("font-bold text-white/5 uppercase italic", "text-[10px]")}>Tidak ada</p>
                        )}
                    </div>
                </div>

                {/* Footer: Total Loss + Resolve Action */}
                <div className={cn("bg-white/[0.03] border-t border-white/5 flex justify-between items-center", isDesktop ? "p-4 px-6" : "px-4 py-3")}>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Total Kerugian</span>
                        <span className={cn("font-black text-red-400 leading-tight", isDesktop ? "text-base" : "text-sm")}>{formatIDR(totalFinancialLoss)}</span>
                    </div>
                    {!isAllResolved && (
                        <Button
                            size="sm"
                            disabled={isResolving}
                            onClick={onResolve}
                            className={cn("bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl px-4 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all text-[10px]", isDesktop ? "h-10" : "h-9")}
                        >
                            {isResolving ? 'Proses...' : 'Tandai Selesai'}
                        </Button>
                    )}
                </div>
            </Card>
        </motion.div>
    )
}
