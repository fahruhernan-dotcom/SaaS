import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

export function SummaryCard({ label, value, icon: Icon, color, subLabel }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const colorClasses = {
        emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/10",
        blue: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/10",
        red: "from-red-500/20 to-red-500/5 text-red-400 border-red-500/10"
    }

    return (
        <Card className={cn(
            "relative overflow-hidden bg-gradient-to-br border shadow-2xl group transition-all hover:scale-[1.02] shrink-0",
            isDesktop ? "rounded-[32px] p-6" : "rounded-2xl p-3.5 min-w-[130px]",
            colorClasses[color]
        )}>
            <div className={cn("absolute top-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity", isDesktop ? "p-4" : "p-2")}>
                <Icon size={isDesktop ? 48 : 32} strokeWidth={1.5} />
            </div>
            <div className="relative z-10 flex flex-col items-start text-left">
                <p className={cn("font-black uppercase tracking-[0.2em] opacity-60 mb-1", isDesktop ? "text-[10px]" : "text-[9px]")}>{label}</p>
                <h3 className={cn("font-black tabular-nums tracking-tight", isDesktop ? "text-2xl" : "text-lg")}>{value}</h3>
                {subLabel && <p className={cn("font-bold mt-0.5 opacity-40 uppercase tracking-widest italic", isDesktop ? "text-[9px]" : "text-[8px]")}>{subLabel}</p>}
            </div>
        </Card>
    )
}

export function FilterPill({ label, active, onClick }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    return (
        <button
            onClick={onClick}
            className={cn(
                "rounded-2xl font-black uppercase tracking-widest transition-all shrink-0",
                isDesktop ? "h-10 px-6 text-[10px]" : "h-9 px-5 text-[11px]",
                active
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-white/5 text-[#4B6478] hover:bg-white/10"
            )}
        >
            {label}
        </button>
    )
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, color = "emerald" }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
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
            {actionLabel && (
                <Button 
                    variant="outline"
                    onClick={onAction}
                    className={cn("mt-8 h-12 px-6 rounded-2xl border-white/10 bg-secondary/10 text-white font-black uppercase tracking-widest hover:bg-secondary/20", isDesktop ? "text-[11px]" : "text-xs")}
                >
                    {actionLabel}
                </Button>
            )}
        </motion.div>
    )
}
