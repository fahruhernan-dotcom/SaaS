import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Activity, Search, ChevronRight, Clock,
    User, Building2, Database, AlertCircle,
    CheckCircle2, Info
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { useAuditLogs } from '@/lib/hooks/useAdminData'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

const getActionIcon = (action) => {
    if (action.startsWith('INSERT')) return <CheckCircle2 size={14} className="text-emerald-400" />
    if (action.startsWith('UPDATE')) return <Info size={14} className="text-blue-400" />
    if (action.startsWith('DELETE')) return <AlertCircle size={14} className="text-red-400" />
    return <Activity size={14} className="text-slate-400" />
}

const getActionColor = (action) => {
    if (action.startsWith('INSERT')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    if (action.startsWith('UPDATE')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    if (action.startsWith('DELETE')) return 'bg-red-500/10 text-red-400 border-red-500/20'
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

// ── Mobile Card ───────────────────────────────────────────────────────────────
function LogCard({ log, onClick }) {
    return (
        <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className="w-full text-left bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 active:scale-[0.98] transition-all hover:border-white/10"
        >
            <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className={cn("text-[9px] font-black py-0.5 shrink-0 uppercase tracking-wider", getActionColor(log.action))}>
                        <div className="flex items-center gap-1">
                            {getActionIcon(log.action)}
                            <span>{log.action.split('_')[0]}</span>
                        </div>
                    </Badge>
                    <span className="text-[11px] font-mono font-bold text-blue-400/80 truncate">
                        {log.entity_type}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[#4B6478] shrink-0">
                    <Clock size={10} />
                    <span className="text-[9px] font-bold">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: id })}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <User size={11} className="text-[#94A3B8]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#F1F5F9] truncate leading-tight">
                            {log.actor?.full_name || 'System'}
                        </p>
                        {log.tenant && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <Building2 size={9} className="text-emerald-500/50 shrink-0" />
                                <p className="text-[9px] font-bold text-[#4B6478] truncate">{log.tenant.business_name}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-6 h-6 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center shrink-0">
                    <ChevronRight size={12} className="text-emerald-400/50" />
                </div>
            </div>
        </motion.button>
    )
}

export default function AdminActivity() {
    const [selectedLog, setSelectedLog] = useState(null)
    const [search, setSearch] = useState('')
    const { data: logs, isLoading } = useAuditLogs()
    const isDesktop = useMediaQuery('(min-width: 1024px)')

    const filteredLogs = logs?.filter(log =>
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
        log.actor?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.tenant?.business_name?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4 p-4 lg:p-0 lg:space-y-6">
            {/* ── Header ───────────────────────────────────────────── */}
            {isDesktop ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-[#0C1319] to-[#06090F] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
                    <div className="relative z-10">
                        <h2 className="text-2xl font-display font-black text-white tracking-tight uppercase flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <Activity className="text-emerald-400" size={24} />
                            </div>
                            Activity Log
                        </h2>
                        <p className="text-sm text-[#4B6478] mt-1 font-medium">Monitoring platform activities & administrative changes</p>
                    </div>
                    <div className="relative z-10">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" size={16} />
                        <Input
                            placeholder="Cari aktivitas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-black/40 border-white/10 pl-10 pr-4 h-11 w-full md:w-64 rounded-xl text-sm"
                        />
                    </div>
                </div>
            ) : (
                /* Mobile compact header */
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" size={14} />
                        <Input
                            placeholder="Cari aktivitas, actor, tenant…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white/[0.04] border-white/[0.07] pl-9 pr-4 h-10 rounded-xl text-sm placeholder:text-[#4B6478]"
                        />
                    </div>
                    {filteredLogs && (
                        <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-wider shrink-0">
                            {filteredLogs.length} log
                        </span>
                    )}
                </div>
            )}

            {/* ── Desktop Table ─────────────────────────────────────── */}
            {isDesktop && (
                <Card className="bg-[#0C1319] border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-6 py-4 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Timestamp</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Actor</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Action</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Resource</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Tenant</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-6 py-4 bg-white/[0.01]" />
                                        </tr>
                                    ))
                                ) : filteredLogs?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-[#4B6478]">
                                            Tidak ada log ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs?.map((log) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-white leading-tight">
                                                        {format(new Date(log.created_at), 'dd MMM yyyy', { locale: id })}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-[#4B6478] flex items-center gap-1 mt-0.5">
                                                        <Clock size={10} />
                                                        {format(new Date(log.created_at), 'HH:mm:ss')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                        <User size={14} className="text-[#94A3B8]" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[12px] font-bold text-[#F1F5F9] truncate max-w-[120px]">
                                                            {log.actor?.full_name || 'System'}
                                                        </span>
                                                        <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-wider">
                                                            {log.actor?.role || 'SYSTEM'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="outline" className={cn("text-[10px] font-black py-1", getActionColor(log.action))}>
                                                    <div className="flex items-center gap-1.5 uppercase tracking-wider">
                                                        {getActionIcon(log.action)}
                                                        {log.action.split('_')[0]}
                                                    </div>
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Database size={12} className="text-[#4B6478]" />
                                                    <span className="text-[11px] font-mono font-bold text-blue-400/80 tracking-tight">
                                                        {log.entity_type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {log.tenant ? (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 size={12} className="text-emerald-500/50" />
                                                        <span className="text-[11px] font-bold text-white transition-colors group-hover:text-emerald-400">
                                                            {log.tenant.business_name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">GLOBAL</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                        <ChevronRight size={14} className="text-emerald-400" />
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* ── Mobile Card List ──────────────────────────────────── */}
            {!isDesktop && (
                <div className="flex flex-col gap-2.5">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                        ))
                    ) : filteredLogs?.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-16 text-center">
                            <Activity size={32} className="text-[#4B6478]" />
                            <p className="text-sm font-bold text-[#F1F5F9]">Tidak ada log ditemukan</p>
                            <p className="text-xs text-[#4B6478]">Coba kata kunci lain</p>
                        </div>
                    ) : (
                        filteredLogs?.map(log => (
                            <LogCard key={log.id} log={log} onClick={() => setSelectedLog(log)} />
                        ))
                    )}
                </div>
            )}

            {/* ── Detail Sheet (shared mobile + desktop) ────────────── */}
            <Sheet open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <SheetContent side="right" className="w-full sm:max-w-xl bg-[#0C1319] border-white/8 text-white p-0 overflow-hidden flex flex-col">
                    <SheetHeader className="p-6 border-b border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-xl font-display font-black uppercase tracking-tight text-white flex items-center gap-3">
                                {selectedLog && getActionIcon(selectedLog.action)}
                                Activity Detail
                            </SheetTitle>
                            <SheetDescription className="sr-only">Detail log aktivitas audit sistem.</SheetDescription>
                            {selectedLog && (
                                <Badge variant="outline" className={cn("text-[9px] font-black uppercase py-1", getActionColor(selectedLog.action))}>
                                    {selectedLog.action}
                                </Badge>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1">OCCURRED AT</p>
                                <p className="text-[11px] font-bold text-slate-200">
                                    {selectedLog && format(new Date(selectedLog.created_at), 'eeee, dd MMMM yyyy HH:mm:ss', { locale: id })}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-1">RESOURCE</p>
                                <p className="text-[11px] font-mono font-bold text-blue-400">{selectedLog?.entity_type}</p>
                            </div>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        Updated Data Snapshot
                                    </h4>
                                    <div className="rounded-2xl bg-black/40 border border-white/10 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto">
                                        <pre className="text-emerald-400/90 whitespace-pre-wrap">
                                            {selectedLog?.new_data ? JSON.stringify(selectedLog.new_data, null, 2) : 'No new data record'}
                                        </pre>
                                    </div>
                                </div>

                                {selectedLog?.old_data && (
                                    <div className="space-y-2 pt-2">
                                        <h4 className="text-[11px] font-black text-[#4B6478] uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                            Previous State
                                        </h4>
                                        <div className="rounded-2xl bg-black/20 border border-white/5 p-4 font-mono text-[11px] leading-relaxed overflow-x-auto opacity-60">
                                            <pre className="text-slate-400 whitespace-pre-wrap">
                                                {JSON.stringify(selectedLog.old_data, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {(selectedLog?.ip_address || selectedLog?.user_agent) && (
                                <div className="pt-4 border-t border-white/5 space-y-4">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Metadata Context</h4>
                                    <div className="grid gap-3">
                                        {selectedLog.ip_address && (
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                <span className="text-[10px] font-bold text-[#4B6478]">IP ADDRESS</span>
                                                <span className="text-[11px] font-mono text-slate-300 font-bold">{selectedLog.ip_address}</span>
                                            </div>
                                        )}
                                        {selectedLog.user_agent && (
                                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                <span className="text-[10px] font-bold text-[#4B6478] block mb-2">USER AGENT</span>
                                                <span className="text-[10px] font-medium text-slate-400 leading-relaxed block break-all">
                                                    {selectedLog.user_agent}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
    )
}
