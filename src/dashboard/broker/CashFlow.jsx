import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    TrendingUp, TrendingDown, Wallet, 
    Calendar, ArrowUpRight, ArrowDownRight, 
    Plus, Filter, PieChart as PieChartIcon, 
    ArrowRightLeft, FileText, Info, AlertCircle,
    ShoppingCart, Truck, Receipt, ChevronRight, Clock,
    Download
} from 'lucide-react'
import { 
    format, startOfWeek, endOfWeek, startOfMonth, 
    endOfMonth, subMonths, eachDayOfInterval, 
    isWithinInterval, parseISO 
} from 'date-fns'
import { id } from 'date-fns/locale'
import { 
  formatIDR, formatIDRShort, formatDate, formatWeight, safeNum,
  calcTotalJual, calcNetProfit, formatPaymentStatus 
} from '@/lib/format'
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Legend, Area, ReferenceLine,
    PieChart, Pie, Cell
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useCashFlow } from '@/lib/hooks/useCashFlow'

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
import { DatePicker } from '@/components/ui/DatePicker'
import { DateRangePicker } from '@/components/ui/DateRangePicker'

// --- HELPER FORMATTERS ---
// Imported from @/lib/format

export default function CashFlow() {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const { tenant } = useAuth()
    const queryClient = useQueryClient()
    
    // --- PERIOD STATE ---
    const [selectedPeriod, setSelectedPeriod] = useState('week')
    const [customRange, setCustomRange] = useState({ from: new Date(), to: new Date() })
    const [isCreateExpenseOpen, setIsCreateExpenseOpen] = useState(false)

    const dateRange = useMemo(() => {
        const today = new Date()
        switch (selectedPeriod) {
            case 'week':
                return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) }
            case 'month':
                return { start: startOfMonth(today), end: endOfMonth(today) }
            case 'lastMonth':
                const lastMonth = subMonths(today, 1)
                return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
            case 'custom':
                return { start: customRange.from, end: customRange.to }
            default:
                return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) }
        }
    }, [selectedPeriod, customRange])

    const startStr = format(dateRange.start, 'yyyy-MM-dd')
    const endStr = format(dateRange.end, 'yyyy-MM-dd')

    // --- DATA QUERY ---
    const { data, isLoading } = useCashFlow(startStr, endStr, tenant?.id)
    const { summary = {}, sales = [], purchases = [], deliveries = [], losses = [], expenses = [] } = data || {}

    // --- CHART DATA PROCESSING ---
    const { chartData, breakdownData, totalTransport, totalSusutValue } = useMemo(() => {
        if (!data) return { chartData: [], breakdownData: [], totalTransport: 0, totalSusutValue: 0 }

        const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
        let runningBalance = 0

        const cData = days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayLabel = format(day, 'EEE', { locale: id })

            const daySales = sales.filter(s => s.transaction_date === dateStr)
            const dayExpenses = expenses.filter(e => e.expense_date === dateStr)

            const dayRevenue = daySales.reduce((s, t) => s + safeNum(t.total_revenue), 0)
            const dayModal   = daySales.reduce((s, t) => s + safeNum(t.purchases?.total_cost), 0)
            const dayTransport = daySales.reduce((s, t) => s + safeNum(t.delivery_cost), 0)
            
            const dayExtra = dayExpenses
                .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

            const dayOut = dayModal + dayExtra + dayTransport
            const dayNet = dayRevenue - dayOut
            runningBalance += dayNet

            return {
                date: dayLabel,
                fullDate: dateStr,
                pemasukan: dayRevenue,
                pengeluaran: dayOut,
                saldo: runningBalance
            }
        })

        const bData = [
            { name: 'Modal Beli (Produk)',  value: summary.totalModal || 0,     fill: '#3B82F6' },
            { name: 'Biaya Pengiriman',     value: summary.totalTransport || 0, fill: '#FBBF24' },
            { name: 'Biaya Extra',          value: summary.totalExtra || 0,     fill: '#8B5CF6' },
        ].filter(d => d.value > 0)

        const totalTransportCost = sales.reduce((s, t) => s + (Number(t.delivery_cost) || 0), 0)
        
        const totalSusutValue = sales.reduce((sum, s) => {
            const shrinkage = s.deliveries?.[0]?.shrinkage_kg || 0
            const price = s.price_per_kg || 0
            return sum + (Number(shrinkage) * Number(price))
        }, 0)

        return { chartData: cData, breakdownData: bData, totalTransport: totalTransportCost, totalSusutValue }
    }, [data, dateRange, sales, purchases, deliveries, losses, expenses, summary])

    // --- TRANSACTION LIST MERGING ---
    const allTransactions = useMemo(() => {
        const list = [
            ...sales.map(s => ({ ...s, type: 'in', category: 'jual', label: `Jual ke ${s.rpa_clients?.rpa_name}`, amount: s.total_revenue, date: s.transaction_date })),
            ...purchases.map(p => ({ ...p, type: 'out', category: 'beli', label: `Beli dari ${p.farms?.farm_name}`, date: p.transaction_date, amount: p.total_cost })),
            ...expenses.map(e => ({ ...e, type: 'out', category: 'extra', label: `${e.category}: ${e.description}`, date: e.expense_date, amount: e.amount }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date))
        return list
    }, [sales, purchases, losses, expenses])

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("bg-[#06090F] min-h-screen text-[#F1F5F9] pb-24", isDesktop && "pb-10")}
        >
            {/* Header Mobile Only */}
            {!isDesktop && (
                <header className="px-5 pt-10 pb-4 flex justify-between items-center sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-40 border-b border-white/5">
                    <h1 className="font-display text-xl font-black tracking-tight uppercase">Cash Flow</h1>
                    <Button 
                        size="sm"
                        onClick={() => setIsCreateExpenseOpen(true)}
                        className="h-10 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                        <Plus size={16} strokeWidth={3} className="mr-1.5" /> Catat
                    </Button>
                </header>
            )}

            <div className="px-5 pt-8 max-w-5xl mx-auto space-y-8">
                {/* Desktop Header */}
                {isDesktop && (
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h1 className="font-display text-3xl font-black tracking-tight uppercase">Cash Flow</h1>
                            <p className="text-[#4B6478] font-bold text-sm uppercase tracking-wider">Arus kas bisnis broker</p>
                        </div>
                        <div className="flex gap-4">
                             <Button 
                                onClick={() => setIsCreateExpenseOpen(true)}
                                className="h-12 px-6 rounded-2xl bg-[#111C24] border border-white/5 hover:bg-white/5 text-white font-black text-[11px] uppercase tracking-widest gap-2 shadow-lg"
                            >
                                <Plus size={18} strokeWidth={3} className="text-red-400" /> Catat Pengeluaran
                            </Button>
                        </div>
                    </div>
                )}

                {/* --- SECTION 1: PERIOD SELECTOR --- */}
                <div className="flex flex-col gap-4">
                    <div className="flex overflow-x-auto pb-1 scrollbar-none gap-2">
                        <PeriodPill label="Minggu Ini" active={selectedPeriod === 'week'} onClick={() => setSelectedPeriod('week')} />
                        <PeriodPill label="Bulan Ini" active={selectedPeriod === 'month'} onClick={() => setSelectedPeriod('month')} />
                        <PeriodPill label="Bulan Lalu" active={selectedPeriod === 'lastMonth'} onClick={() => setSelectedPeriod('lastMonth')} />
                        <PeriodPill label="Custom" active={selectedPeriod === 'custom'} onClick={() => setSelectedPeriod('custom')} />
                    </div>

                    {selectedPeriod === 'custom' && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full sm:w-auto"
                        >
                            <DateRangePicker 
                                value={customRange}
                                onChange={(range) => range && setCustomRange(range)}
                            />
                        </motion.div>
                    )}
                </div>

                {/* --- SECTION 2: SUMMARY CARDS --- */}
                <div className={cn(
                    "grid gap-4",
                    isDesktop ? "grid-cols-3" : "grid-cols-2"
                )}>
                    <SummaryCard 
                        label="TOTAL PEMASUKAN" 
                        value={summary.totalPemasukan} 
                        isDesktop={isDesktop}
                        icon={TrendingUp} 
                        color="emerald" 
                        sub={`${sales.length} transaksi jual`}
                    />
                    <SummaryCard 
                        label="TOTAL PENGELUARAN" 
                        value={summary.totalKeluar} 
                        isDesktop={isDesktop}
                        icon={TrendingDown} 
                        color="red" 
                        sub="modal + pengiriman + extra"
                    />
                    <SummaryCard 
                        label="NET CASH FLOW" 
                        value={summary.netCashFlow} 
                        isDesktop={isDesktop}
                        icon={Wallet} 
                        color={summary.netCashFlow >= 0 ? "emerald" : "red"} 
                        sub={`Margin: ${summary.marginPct}%`}
                        className={cn("col-span-2", isDesktop && "col-span-1")}
                        highlight
                    />
                </div>

                {/* --- SECTION 3: LINE CHART SALDO --- */}
                <Card className="bg-[#111C24] border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                    <CardHeader className={isDesktop ? "p-8 pb-0" : "p-6 pb-0"}>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className={cn("font-display font-black uppercase tracking-tight", isDesktop ? "text-lg" : "text-base")}>Saldo Kumulatif</CardTitle>
                                <CardDescription className={cn("text-[#4B6478] font-bold uppercase tracking-widest mt-1", isDesktop ? "text-[10px]" : "text-[11px]")}>Estimasi kas berjalan periode ini</CardDescription>
                            </div>
                            <Badge variant="outline" className={cn("rounded-xl border-white/10 bg-white/5 font-black uppercase tracking-widest px-3", isDesktop ? "h-8 text-[9px]" : "h-9 text-[10px]")}>
                                {format(dateRange.start, 'dd MMM')} - {format(dateRange.end, 'dd MMM')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-6 h-[350px]">
                        {isLoading ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-[#4B6478]">
                                <Clock className="animate-spin" size={32} strokeWidth={1.5} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Memproses data...</span>
                            </div>
                        ) : chartData.some(d => d.saldo !== 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{ fill: '#4B6478', fontSize: 11, fontWeight: 700, fontFamily: 'DM Sans' }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <YAxis 
                                        tick={{ fill: '#4B6478', fontSize: 11, fontWeight: 700, fontFamily: 'DM Sans' }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tickFormatter={v => formatIDRShort(v)}
                                        width={70}
                                    />
                                    <Tooltip 
                                        content={<CustomTooltip />}
                                        cursor={{ stroke: '#F1F5F9', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => {
                                            const labels = { saldo: 'Saldo Kumulatif', pemasukan: 'Pemasukan (Net)', pengeluaran: 'Pengeluaran' }
                                            return <span className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] ml-2">{labels[value]}</span>
                                        }}
                                    />
                                    <Area type="monotone" dataKey="saldo" stroke="none" fill="url(#saldoGrad)" />
                                    <Line type="monotone" dataKey="saldo" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#34D399', stroke: '#111C24', strokeWidth: 3 }} />
                                    <Line type="monotone" dataKey="pemasukan" stroke="rgba(16,185,129,0.3)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                                    <Line type="monotone" dataKey="pengeluaran" stroke="rgba(248,113,113,0.3)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-4">
                                <div className="p-6 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 text-emerald-500/30">
                                    <Wallet size={40} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-white font-black uppercase text-sm">Belum ada data transaksi</h4>
                                    <p className="text-[#4B6478] text-[10px] uppercase font-bold max-w-[200px]">Catat pembelian atau penjualan untuk melihat arus kas</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* --- SECTION 4: BREAKDOWN & TRANSACTION LIST --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Breakdown */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="bg-[#111C24] border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                            <CardTitle className="font-display text-lg font-black uppercase tracking-tight mb-8">Breakdown Biaya</CardTitle>
                            <div className={cn(
                                "flex items-center gap-8",
                                !isDesktop && "flex-col"
                            )}>
                                <div className="relative w-[180px] h-[180px] flex-shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={breakdownData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="value"
                                                animationDuration={1500}
                                            >
                                                {breakdownData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={v => formatIDR(v)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest uppercase">PROFIT BERSIH</span>
                                        <span className="text-lg font-display font-black text-emerald-400">{formatIDRShort(summary.netCashFlow)}</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    {breakdownData.length > 0 ? breakdownData.map((item, i) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.fill }} />
                                                    <span className="text-white uppercase tracking-wider">{item.name}</span>
                                                </div>
                                                <span className="text-white tabular-nums">{formatIDRShort(item.value)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(item.value / summary.totalKeluar) * 100}%` }}
                                                        className="h-full"
                                                        style={{ background: item.fill }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-[#4B6478] w-8 text-right">
                                                    {((item.value / summary.totalKeluar) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="h-[180px] flex items-center justify-center text-[#4B6478] text-[10px] font-black uppercase tracking-widest italic border border-dashed border-white/5 rounded-[24px]">
                                            Data belanja kosong
                                        </div>
                                    )}

                                    {/* Informative Shrinkage Row */}
                                    {data && (chartData.length > 0) && (
                                        <div className="flex flex-col gap-1 pt-4 border-t border-white/5 mt-2">
                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                                                    <span className="text-[#F59E0B] uppercase tracking-wider">Susut Berat</span>
                                                </div>
                                                <span className="text-[#F59E0B] tabular-nums">{formatIDRShort(totalSusutValue || 0)}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-[#F59E0B]/60 uppercase tracking-widest">
                                                (sudah tercermin dalam pendapatan)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {totalTransport > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-5 rounded-[28px] bg-white/[0.03] border border-white/5 flex items-center justify-between group overflow-hidden relative"
                            >
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform text-white">
                                    <Truck size={60} strokeWidth={1.5} />
                                </div>
                                <div className="relative z-10 flex flex-col gap-0.5">
                                    <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Biaya Pengiriman</p>
                                    <p className="text-xs font-bold text-[#94A3B8]">Sudah dipotong dari pendapatan bersih</p>
                                </div>
                                <div className="relative z-10 text-right">
                                    <p className="text-sm font-black text-[#F1F5F9] tabular-nums">-{formatIDRShort(totalTransport)}</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Transaction Detail */}
                    <div className="lg:col-span-7">
                        <Card className="bg-[#111C24] border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                             <Tabs defaultValue="all" className="w-full">
                                <CardHeader className="p-8 pb-4">
                                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <CardTitle className="font-display text-lg font-black uppercase tracking-tight">Detail Transaksi</CardTitle>
                                        <TabsList className="bg-secondary/20 p-1 rounded-xl">
                                            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white/10 text-[10px] font-black uppercase tracking-widest px-4 py-2">Semua</TabsTrigger>
                                            <TabsTrigger value="in" className="rounded-lg data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400 text-[10px] font-black uppercase tracking-widest px-4 py-2">Jual</TabsTrigger>
                                            <TabsTrigger value="out" className="rounded-lg data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400 text-[10px] font-black uppercase tracking-widest px-4 py-2">Keluar</TabsTrigger>
                                        </TabsList>
                                     </div>
                                </CardHeader>
                                
                                <CardContent className="p-0">
                                     <TabsContent value="all" className="m-0">
                                         <TransactionList transactions={allTransactions} />
                                     </TabsContent>
                                     <TabsContent value="in" className="m-0">
                                         <TransactionList transactions={allTransactions.filter(t => t.type === 'in')} />
                                     </TabsContent>
                                     <TabsContent value="out" className="m-0">
                                         <TransactionList transactions={allTransactions.filter(t => t.type === 'out')} />
                                     </TabsContent>
                                </CardContent>
                             </Tabs>
                        </Card>
                    </div>
                </div>
            </div>

            {/* --- SHEET CATAT PENGELUARAN --- */}
            <CreateExtraExpenseSheet 
                isOpen={isCreateExpenseOpen} 
                onClose={() => setIsCreateExpenseOpen(false)} 
            />
        </motion.div>
    )
}

// --- SUB-COMPONENTS ---

function SummaryCard({ label, value, icon: Icon, color, sub, className, highlight, isDesktop }) {
    const isEmerald = color === 'emerald'
    return (
        <Card className={cn(
            "bg-[#111C24] rounded-[28px] shadow-xl relative overflow-hidden group transition-all hover:translate-y-[-2px]",
            isDesktop ? "p-6" : "p-5",
            highlight && (isEmerald ? "border-emerald-500/20" : "border-red-500/20"),
            !highlight && "border-white/5",
            className
        )}>
            <div className={cn(
                "absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform",
                isEmerald ? "text-emerald-500" : "text-red-500"
            )}>
                <Icon size={100} strokeWidth={1.5} />
            </div>
            <div className="space-y-4 relative z-10 text-left">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "rounded-xl border",
                        isDesktop ? "p-2.5" : "p-2",
                        isEmerald ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                    )}>
                        <Icon size={isDesktop ? 18 : 20} strokeWidth={2.5} />
                    </div>
                    <span className={cn("font-black uppercase tracking-[0.2em] text-[#4B6478]", isDesktop ? "text-[10px]" : "text-[11px]")}>{label}</span>
                </div>
                <div>
                    <h3 className={cn(
                        "font-display font-black tracking-tight flex items-baseline gap-1.5 leading-none",
                        isDesktop ? "text-xl" : "text-[22px]",
                        isEmerald ? "text-[#34D399]" : "text-[#F87171]"
                    )}>
                        {formatIDR(value || 0)}
                    </h3>
                    <p className={cn("font-bold text-[#4B6478] uppercase mt-1 tracking-widest", isDesktop ? "text-[9px]" : "text-[10px]")}>{sub}</p>
                </div>
            </div>
        </Card>
    )
}

function PeriodPill({ label, active, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "h-10 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0",
                active 
                    ? "bg-white text-[#06090F] shadow-lg" 
                    : "bg-secondary/10 text-[#4B6478] border border-white/5 hover:bg-secondary/20"
            )}
        >
            {label}
        </button>
    )
}

function TransactionList({ transactions }) {
    const [displayCount, setDisplayCount] = useState(10)
    const visibleTransactions = transactions.slice(0, displayCount)

    return (
        <div className="divide-y divide-white/5">
            {visibleTransactions.length > 0 ? visibleTransactions.map((tx, idx) => (
                <TransactionRow key={`${tx.type}-${tx.id}-${idx}`} tx={tx} />
            )) : (
                <div className="p-20 text-center space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] italic">Tidak ada transaksi ditemukan</p>
                </div>
            )}
            
            {displayCount < transactions.length && (
                 <div className="p-4 flex justify-center">
                    <Button 
                        variant="ghost" 
                        onClick={() => setDisplayCount(p => p + 10)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] hover:text-white"
                    >
                        Lihat Lebih Banyak <ChevronRight size={14} className="ml-1" />
                    </Button>
                </div>
            )}
        </div>
    )
}

function TransactionRow({ tx }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const meta = {
        jual:      { icon: TrendingUp,   color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
        beli:      { icon: ShoppingCart, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
        transport: { icon: Truck,        color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
        kerugian:  { icon: AlertCircle,  color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
        extra:     { icon: Receipt,      color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' }
    }

    const { icon: Icon, color, bg } = meta[tx.category] || meta.extra

    return (
        <div className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group active:bg-white/[0.04]">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5"
                    style={{ background: bg, color }}
                >
                    <Icon size={isDesktop ? 18 : 20} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0 space-y-1 text-left">
                    <p className={cn("font-bold text-white truncate group-hover:text-emerald-400 transition-colors uppercase tracking-tight", isDesktop ? "text-[13px]" : "text-sm")}>
                        {tx.label}
                    </p>
                    <div className="flex items-center gap-3">
                        <span className={cn("font-black text-[#4B6478] uppercase tracking-widest tabular-nums", isDesktop ? "text-[10px]" : "text-[11px]")}>
                            {format(new Date(tx.date), 'dd MMM yyyy', { locale: id })}
                        </span>
                         {tx.payment_status && (
                             <span className={cn(
                                 "font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border",
                                 isDesktop ? "text-[8px]" : "text-[9px]",
                                 tx.payment_status === 'lunas' ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" : "text-amber-500 border-amber-500/20 bg-amber-500/5"
                             )}>
                                 {formatPaymentStatus(tx.payment_status)}
                             </span>
                        )}
                         {tx.category === 'jual' && safeNum(tx.delivery_cost) > 0 && (
                             <span className={cn("font-bold text-amber-500/60 uppercase tracking-widest", isDesktop ? "text-[9px]" : "text-[10px]")}>
                                 +{formatIDRShort(tx.delivery_cost)} Kirim
                             </span>
                         )}
                    </div>
                </div>
            </div>
            <div className="text-right pl-4">
                <p className={cn(
                    "font-black tabular-nums tracking-tight",
                    isDesktop ? "text-sm" : "text-base",
                    tx.type === 'in' ? "text-emerald-400" : "text-red-400"
                )}>
                    {tx.type === 'in' ? '+' : '-'}{formatIDR(safeNum(tx.amount)).replace('Rp', '')}
                </p>
                <p className={cn("font-black text-[#4B6478] uppercase tracking-widest mt-0.5", isDesktop ? "text-[9px]" : "text-[10px]")}>IDR</p>
            </div>
        </div>
    )
}

function CustomTooltip({ active, payload }) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#111C24] border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3 min-w-[200px]">
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest border-b border-white/5 pb-2">
                    {payload[0].payload.fullDate}
                </p>
                {payload.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: entry.color }} />
                            <span className="text-[11px] font-black text-[#94A3B8] uppercase tracking-tight">{entry.name}</span>
                        </div>
                        <span className="text-[11px] font-black text-white tabular-nums">{formatIDR(entry.value)}</span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

// --- SHEET: CATAT PENGELUARAN EXTRA ---

function CreateExtraExpenseSheet({ isOpen, onClose }) {
    const { tenant } = useAuth()
    const queryClient = useQueryClient()
    const [isLoading, setIsLoading] = useState(false)
    const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'))

    const handleCreate = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        
        const payload = {
            tenant_id: tenant.id,
            category: formData.get('category'),
            description: formData.get('description'),
            amount: parseInt(formData.get('amount')) || 0,
            expense_date: formData.get('expense_date'),
            notes: formData.get('notes'),
            is_deleted: false
        }

        const { error } = await supabase.from('extra_expenses').insert(payload)
        
        if (error) {
            toast.error('Gagal mencatat pengeluaran')
        } else {
            toast.success('Pengeluaran berhasil dicatat!')
            queryClient.invalidateQueries(['cashflow'])
            onClose()
        }
        setIsLoading(false)
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[85vh] bg-[#0C1319] border-white/10 rounded-t-[40px] px-6 text-left overflow-y-auto">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">Catat Pengeluaran</SheetTitle>
                    <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">Dokumentasikan biaya operasional non-logistik</SheetDescription>
                </SheetHeader>

                <form onSubmit={handleCreate} className="space-y-6 pb-20">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Kategori *</Label>
                            <Select name="category" required defaultValue="Tenaga Kerja">
                                <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white shadow-inner">
                                    <SelectValue placeholder="PILIH KATEGORI" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111C24] border-white/10 text-white">
                                    <SelectItem value="tenaga_kerja" className="text-xs font-black uppercase hover:bg-white/5">👷 Tenaga Kerja</SelectItem>
                                    <SelectItem value="sewa" className="text-xs font-black uppercase hover:bg-white/5">🏠 Sewa</SelectItem>
                                    <SelectItem value="administrasi" className="text-xs font-black uppercase hover:bg-white/5">📋 Administrasi</SelectItem>
                                    <SelectItem value="komunikasi" className="text-xs font-black uppercase hover:bg-white/5">📱 Komunikasi</SelectItem>
                                    <SelectItem value="lainnya" className="text-xs font-black uppercase hover:bg-white/5">📦 Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Keterangan *</Label>
                            <Input required name="description" placeholder="Cth: Upah kuli muat 3 orang" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-bold text-base text-white uppercase placeholder:text-white/10" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Nominal Rp *</Label>
                                <Input required name="amount" type="number" placeholder="150000" className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-bold text-base text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Tanggal *</Label>
                                <DatePicker 
                                    value={expenseDate}
                                    onChange={setExpenseDate}
                                    className="h-14"
                                />
                                <input type="hidden" name="expense_date" value={expenseDate} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Catatan Tambahan</Label>
                            <Textarea name="notes" placeholder="Tulis catatan jika diperlukan..." className="rounded-2xl bg-[#111C24] border-white/5 font-bold text-base p-4 min-h-[100px] text-white" />
                        </div>
                    </div>

                    <SheetFooter>
                        <Button 
                            disabled={isLoading}
                            className="w-full h-16 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-red-500/20 active:scale-95 transition-all mt-4"
                        >
                            {isLoading ? 'MENYIMPAN...' : 'SIMPAN PENGELUARAN'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
