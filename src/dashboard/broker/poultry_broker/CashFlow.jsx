import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    TrendingUp, TrendingDown, Wallet, 
    Calendar, ArrowUpRight, ArrowDownRight, 
    Plus, Filter, PieChart as PieChartIcon, 
    ArrowRightLeft, FileText, Info, AlertCircle,
    ShoppingCart, Truck, Receipt, ChevronRight, Clock,
    Download, ArrowRight, MapPin, Building, Package
} from 'lucide-react'
import { 
    format, startOfWeek, endOfWeek, startOfMonth, 
    endOfMonth, subMonths, eachDayOfInterval, 
    isWithinInterval, parseISO, addDays, differenceInDays,
    isSameDay, startOfDay 
} from 'date-fns'
import { id } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { 
  formatIDR, formatIDRShort, formatDate, formatWeight, safeNum,
  calcTotalJual, calcNetProfit, formatPaymentStatus 
} from '@/lib/format'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
    ComposedChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Legend, Area, ReferenceLine,
    PieChart, Pie, Cell, Scatter
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
    useCashFlow, useCashFlowByRPA, useCashFlowByFarm, getPeriodRange 
} from '@/lib/hooks/useCashFlow'

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
import { InputRupiah } from '@/components/ui/InputRupiah'

const formatCompact = (value) => {
    const n = Number(value) || 0
    if (Math.abs(n) >= 1_000_000_000) 
        return `Rp ${(n / 1_000_000_000).toFixed(2)}M`
    if (Math.abs(n) >= 1_000_000) 
        return `Rp ${(n / 1_000_000).toFixed(1)}jt`
    return formatRupiah(n)
}

const isOnDay = (dateString, targetDate) => {
    if (!dateString) return false
    try {
        return isSameDay(parseISO(dateString), targetDate)
    } catch {
        return false
    }
}

// --- HELPER FORMATTERS ---
const formatRupiah = (val) => formatIDR(val)
const getStatusLabel = (status) => {
    const labels = {
        'lunas': 'Lunas',
        'belum_lunas': 'Belum Lunas',
        'sebagian': 'Sebagian',
        'pending': 'Pending',
    }
    return labels[status?.toLowerCase()] || status
}

const getStatusColor = (status) => {
    const colors = {
        'lunas': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'belum_lunas': 'bg-red-500/10 text-red-400 border-red-500/20',
        'sebagian': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'pending': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    }
    return colors[status?.toLowerCase()] || colors['pending']
}

const generateEmptyChartDays = (period, days) => {
    return days.map(day => ({
        label: period === 'week' ? format(day, 'EEE', { locale: id }) : format(day, 'd'),
        fullDate: format(day, 'd MMMM yyyy', { locale: id }),
        saldo: 0,
        cashIn: 0,
        cashOut: 0
    }))
}

const expenseSchema = z.object({
    category: z.string().min(1, 'Pilih kategori'),
    description: z.string().min(1, 'Keterangan wajib diisi').trim(),
    amount: z.coerce.number({ invalid_type_error: 'Nominal tidak valid' }).positive('Nominal pengeluaran harus lebih besar dari Rp 0'),
    expense_date: z.string().min(1, 'Tanggal wajib diisi'),
    notes: z.string().optional()
})

export default function CashFlow() {
    const navigate = useNavigate()
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const { tenant } = useAuth()
    const queryClient = useQueryClient()
    
    // --- PERIOD STATE ---
    const [selectedPeriod, setSelectedPeriod] = useState('week')
    const [activeTxFilter, setActiveTxFilter] = useState('all')
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
            case 'all':
                return { start: new Date(2023, 0, 1), end: endOfMonth(today) }
            case 'custom':
                return { start: customRange.from, end: customRange.to }
            default:
                return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) }
        }
    }, [selectedPeriod, customRange])

    const startStr = format(dateRange.start, 'yyyy-MM-dd')
    const endStr = format(dateRange.end, 'yyyy-MM-dd')

    // --- DATA QUERY ---
    const { data, isLoading } = useCashFlow(selectedPeriod === 'all' ? 'all' : selectedPeriod === 'custom' ? 'custom' : selectedPeriod)
    
    // Previous period for comparison
    const prevPeriodKey = selectedPeriod === 'week' ? 'lastWeek' : selectedPeriod === 'month' ? 'lastMonth' : null
    const { data: previousData } = useCashFlow(prevPeriodKey)

    // Entity-specific hooks for Phase 4
    const { data: rpaPerformance = [] } = useCashFlowByRPA(selectedPeriod)
    const { data: farmPerformance = [] } = useCashFlowByFarm(selectedPeriod)
    // Note: useCashFlow hook signature was refactored to useCashFlow(period)
    const { 
        summary = {}, 
        sales = [], 
        purchases = [], 
        deliveries = [], 
        losses = [], 
        extras = [], 
        payments = [],
        unpaidSales = [],
        totalLossKg = 0,
        totalLoss = 0
    } = data || {}

    // --- KPI CALCULATIONS ---
    const { totalNetProfit, totalArrivedWeightKg } = useMemo(() => {
        let profit = 0
        let weight = 0
        sales.forEach(s => {
            profit += calcNetProfit(s)
            // arrived_weight_kg is now available in deliveries thanks to Phase 1 hook update
            weight += Number(s.deliveries?.[0]?.arrived_weight_kg || 0)
        })
        return { totalNetProfit: profit, totalArrivedWeightKg: weight }
    }, [sales])

    const marginPerKg = totalArrivedWeightKg > 0 ? (totalNetProfit / totalArrivedWeightKg).toFixed(0) : 0

    // --- PHASE 4 CALCULATIONS ---
    const groupedExtras = useMemo(() => {
        const categories = {
            'Tenaga Kerja': 0,
            'Sewa': 0,
            'Administrasi': 0,
            'Komunikasi': 0,
            'Lainnya': 0
        }
        extras.forEach(e => {
            const cat = e.category?.toLowerCase() || ''
            if (cat.includes('tenaga') || cat === 'tenaga_kerja') categories['Tenaga Kerja'] += Number(e.amount || 0)
            else if (cat.includes('sewa')) categories['Sewa'] += Number(e.amount || 0)
            else if (cat.includes('admin')) categories['Administrasi'] += Number(e.amount || 0)
            else if (cat.includes('komunikasi') || cat.includes('telp')) categories['Komunikasi'] += Number(e.amount || 0)
            else categories['Lainnya'] += Number(e.amount || 0)
        })
        return categories
    }, [extras])

    const maxMarginKg = useMemo(() => {
        const margins = rpaPerformance.map(r => r.total_kg > 0 ? r.net_profit / r.total_kg : 0)
        return margins.length > 0 ? Math.max(...margins) : 0
    }, [rpaPerformance])

    const totalArrivedKgForLoss = totalArrivedWeightKg // From previous calc

    const lossRate = totalArrivedKgForLoss > 0 ? (totalLossKg / totalArrivedKgForLoss * 100) : 0
    const lossColor = lossRate < 1 ? 'text-emerald-400' : lossRate <= 2 ? 'text-amber-400' : 'text-[#F87171]'

    // --- ALERT ZONE LOGIC ---
    const alerts = useMemo(() => {
        const today = new Date()
        return unpaidSales.map(sale => {
            const txDate = parseISO(sale.transaction_date)
            const termDays = { 'cash': 0, 'net3': 3, 'net7': 7, 'net14': 14, 'net30': 30 }[sale.payment_terms] || 0
            const dueDate = addDays(txDate, termDays)
            const daysUntilDue = differenceInDays(dueDate, today)
            const daysSinceTx = differenceInDays(today, txDate)

            let urgency = null
            if (daysUntilDue <= 7) urgency = 'red'
            else if (daysSinceTx > 3) urgency = 'amber'

            return { ...sale, urgency, daysUntilDue, daysSinceTx }
        })
        .filter(a => a.urgency)
        .sort((a, b) => (a.urgency === 'red' ? -1 : 1))
        .slice(0, 3)
    }, [unpaidSales])

    // --- ENHANCED CHART DATA PROCESSING ---
    const { chartData, breakdownData, totalTransport, totalSusutValue } = useMemo(() => {
        if (!data) return { chartData: [], breakdownData: [], totalTransport: 0, totalSusutValue: 0 }

        const { start: from, end: to } = (() => {
            const today = new Date()
            if (selectedPeriod === 'week') return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) }
            if (selectedPeriod === 'month') return { start: startOfMonth(today), end: endOfMonth(today) }
            return { start: dateRange.start, end: dateRange.end }
        })()

        const today = new Date()
        const startDate = startOfDay(from)
        const endDate = startOfDay(to)

        const days = eachDayOfInterval({ start: startDate, end: endDate })
        const todayStr = format(today, 'yyyy-MM-dd')
        
        // Processing Previous Data
        const prevDays = previousData ? eachDayOfInterval({ 
            start: startOfDay(parseISO(getPeriodRange(prevPeriodKey).from)), 
            end: startOfDay(parseISO(getPeriodRange(prevPeriodKey).to)) 
        }) : []

        let runningSaldo = 0
        let prevRunningSaldo = 0

        let cData = days.map((day, idx) => {
            const isToday = isSameDay(day, today)
            const isFuture = day > today
            
            // Current Day Grouping (Bug 1 - isSameDay matching)
            const dayPayIn = (data.payments || []).filter(p => isOnDay(p.payment_date, day))
                .reduce((s, p) => s + Number(p.amount || 0), 0)
            
            const dayPurchOut = (purchases || []).filter(p => isOnDay(p.transaction_date, day))
                .reduce((s, p) => s + Number(p.total_cost || 0) + Number(p.transport_cost || 0) + Number(p.other_cost || 0), 0)
            
            const dayDelivOut = (sales || []).filter(sa => isOnDay(sa.transaction_date, day))
                .reduce((s, sa) => s + Number(sa.delivery_cost || 0), 0)
            
            const dayExtraOut = (extras || []).filter(e => isOnDay(e.expense_date, day))
                .reduce((s, ex) => s + Number(ex.amount || 0), 0)
            
            const dayIn = dayPayIn
            const dayOut = dayPurchOut + dayDelivOut + dayExtraOut
            
            if (!isFuture) {
                runningSaldo += (dayIn - dayOut)
            }

            // Previous Period Comparison (Bug 1 - isSameDay matching)
            const prevDay = prevDays[idx]
            if (prevDay) {
                const pdPayIn = (previousData?.payments || []).filter(p => isOnDay(p.payment_date, prevDay))
                    .reduce((s, p) => s + Number(p.amount || 0), 0)
                
                const pdPurchOut = (previousData?.purchases || []).filter(p => isOnDay(p.transaction_date, prevDay))
                    .reduce((s, p) => s + Number(p.total_cost || 0) + Number(p.transport_cost || 0) + Number(p.other_cost || 0), 0)
                
                const pdDelivOut = (previousData?.sales || []).filter(sa => isOnDay(sa.transaction_date, prevDay))
                    .reduce((s, sa) => s + Number(sa.delivery_cost || 0), 0)
                
                const pdExtraOut = (previousData?.extras || []).filter(e => isOnDay(e.expense_date, prevDay))
                    .reduce((s, ex) => s + Number(ex.amount || 0), 0)
                
                prevRunningSaldo += (pdPayIn - (pdPurchOut + pdDelivOut + pdExtraOut))
            }

            return {
                label: selectedPeriod === 'week' ? format(day, 'EEE', { locale: id }) : format(day, 'd'),
                fullDate: format(day, 'd MMMM yyyy', { locale: id }),
                saldo: !isFuture ? runningSaldo : null,
                saldoLalu: previousData ? prevRunningSaldo : null,
                proyeksi: isFuture || isToday ? runningSaldo + (data.totalPiutang || 0) : null,
                cashIn: dayIn,
                cashOut: dayOut,
            }
        })

        if (cData.length === 0 || cData.every(d => d.cashIn === 0 && d.cashOut === 0)) {
            cData = generateEmptyChartDays(selectedPeriod, days)
        }

        const bData = [
            { name: 'Modal Beli (Produk)',  value: summary.totalModal || 0,     fill: '#3B82F6' },
            { name: 'Biaya Pengiriman',     value: summary.totalDeliveryCost || 0, fill: '#FBBF24' },
            { name: 'Biaya Extra',          value: summary.totalExtra || 0,     fill: '#8B5CF6' },
        ].filter(d => d.value > 0)

        const totalTransportCost = data.totalDeliveryCost || 0
        const totalSusutValueValue = sales.reduce((sum, s) => {
            const shrinkage = s.deliveries?.[0]?.shrinkage_kg || 0
            const price = s.price_per_kg || 0
            return sum + (Number(shrinkage) * Number(price))
        }, 0)

        return { chartData: cData, breakdownData: bData, totalTransport: totalTransportCost, totalSusutValue: totalSusutValueValue }
    }, [data, previousData, selectedPeriod, dateRange, sales, purchases, extras, summary])

    // --- TRANSACTION LIST MERGING ---
    const allTransactions = useMemo(() => {
        const list = [
            ...sales.map(s => ({ 
                ...s, 
                _type: 'sale', 
                _date: s.transaction_date, 
                _farm: s.purchases?.farms?.farm_name || 'Kandang',
                _kg: s.deliveries?.[0]?.arrived_weight_kg || s.total_weight_kg || 0,
                _profit: calcNetProfit(s)
            })),
            ...purchases.map(p => ({ 
                ...p, 
                _type: 'purchase', 
                _date: p.transaction_date,
                _farm: p.farms?.farm_name || 'Kandang'
            })),
            ...payments.map(py => ({
                ...py,
                _type: 'payment',
                _date: py.payment_date,
                _rpa: py.sales?.rpa_clients?.rpa_name || 'Buyer',
                _saleDate: py.sales?.transaction_date
            })),
            ...extras.map(e => ({ 
                ...e, 
                _type: 'extra', 
                _date: e.expense_date
            }))
        ].sort((a, b) => new Date(b._date) - new Date(a._date))
        return list
    }, [sales, purchases, payments, extras])

    const filteredTransactions = useMemo(() => {
        if (activeTxFilter === 'all') return allTransactions
        return allTransactions.filter(tx => tx._type === activeTxFilter)
    }, [allTransactions, activeTxFilter])

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("bg-[#06090F] min-h-screen text-[#F1F5F9] pb-24 selection:bg-emerald-500/30", isDesktop && "pb-10")}
        >

            <div className="px-5 pt-8 max-w-5xl mx-auto space-y-8">
                {/* --- SECTION 1: HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Wallet className="text-white" size={20} strokeWidth={2.5} />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white uppercase italic">Control Center</h1>
                        </div>
                        <p className="text-[#4B6478] font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.3em] flex items-center gap-2">
                            <Building size={12} className="text-emerald-500/50" />
                            {tenant?.business_name || 'TernakOS Business'} · {selectedPeriod === 'week' ? 'Minggu Ini' : selectedPeriod === 'month' ? 'Bulan Ini' : selectedPeriod === 'lastMonth' ? 'Bulan Lalu' : 'Keseluruhan'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button 
                            variant="outline" 
                            className="flex-1 md:flex-none h-12 rounded-2xl bg-[#0C1319] border-white/5 text-[#4B6478] font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                            onClick={() => toast("Fitur ekspor segera hadir")}
                        >
                            <Download size={16} className="mr-2" />
                            Export
                        </Button>
                        <Button 
                            className="flex-1 md:flex-none h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 transition-all font-display"
                            onClick={() => setIsCreateExpenseOpen(true)}
                        >
                            <Plus size={18} className="mr-2" />
                            Catat Pengeluaran
                        </Button>
                    </div>
                </div>

                {/* --- SECTION 1: PERIOD SELECTOR --- */}
                <div className="flex flex-col gap-4">
                    <div className="flex overflow-x-auto pb-1 scrollbar-none gap-2">
                        <PeriodPill label="Minggu Ini" active={selectedPeriod === 'week'} onClick={() => setSelectedPeriod('week')} />
                        <PeriodPill label="Bulan Ini" active={selectedPeriod === 'month'} onClick={() => setSelectedPeriod('month')} />
                        <PeriodPill label="Bulan Lalu" active={selectedPeriod === 'lastMonth'} onClick={() => setSelectedPeriod('lastMonth')} />
                        <PeriodPill label="Keseluruhan" active={selectedPeriod === 'all'} onClick={() => setSelectedPeriod('all')} />
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

                {/* --- SECTION 1B: ALERT ZONE --- */}
                {alerts.length > 0 && (
                    <div className="space-y-3">
                        {alerts.map((alert, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn(
                                    "p-4 rounded-xl flex items-center justify-between gap-4 border-l-2",
                                    alert.urgency === 'red' 
                                        ? "bg-red-500/5 border-red-400" 
                                        : "bg-amber-500/5 border-amber-400"
                                )}
                            >
                                <div className="space-y-0.5">
                                    <p className="font-display font-black text-white text-sm">
                                        {alert.rpa_clients?.rpa_name} — {alert.urgency === 'red' ? `jatuh tempo ${alert.daysUntilDue} hari lagi` : `belum bayar ${alert.daysSinceTx} hari`}
                                    </p>
                                    <p className="text-[#4B6478] font-bold text-[10px] uppercase tracking-wider">
                                        Sisa tagihan {formatIDR(Number(alert.total_revenue || 0) - Number(alert.paid_amount || 0))} · {formatPaymentStatus(alert.payment_status)}
                                    </p>
                                </div>
                                <Button 
                                    size="sm"
                                    onClick={() => navigate(`/broker/poultry_broker/rpa`)}
                                    className={cn(
                                        "h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest",
                                        alert.urgency === 'red' 
                                            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" 
                                            : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                    )}
                                >
                                    Tagih Sekarang
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* --- SECTION 2: SUMMARY CARDS --- */}
                <div className={cn(
                    "grid gap-4",
                    isDesktop ? "grid-cols-5" : "grid-cols-2"
                )}>
                    {isLoading ? (
                        Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    ) : (
                        <>
                            <SummaryCard 
                                label="CASH MASUK" 
                                value={data?.cashIn} 
                                isDesktop={isDesktop}
                                icon={TrendingUp} 
                                color="emerald" 
                                sub={`${data?.payments?.length || 0} pembayaran diterima`}
                            />
                            <SummaryCard 
                                label="PIUTANG AKTIF" 
                                value={data?.totalPiutang} 
                                isDesktop={isDesktop}
                                icon={Receipt} 
                                color="amber" 
                                sub={`${unpaidSales.length} belum lunas`}
                                onClick={() => document.getElementById('transaction-detail')?.scrollIntoView({ behavior: 'smooth' })}
                                clickable
                            />
                            <SummaryCard 
                                label="MODAL KELUAR" 
                                value={data?.cashOut} 
                                isDesktop={isDesktop}
                                icon={TrendingDown} 
                                color="red" 
                                sub="beli ayam + ongkir + extra"
                            />
                            <SummaryCard 
                                label="MARGIN REAL / KG" 
                                value={marginPerKg} 
                                isDesktop={isDesktop}
                                icon={TrendingUp} 
                                color="white" 
                                sub="trend: stabiL"
                                isRupiahOnly
                            />
                            <SummaryCard 
                                label="LOSS & SUSUT" 
                                value={totalLossKg} 
                                isDesktop={isDesktop}
                                icon={AlertCircle} 
                                color={totalLoss > 0 ? "red" : "slate"} 
                                sub={`-${formatIDRShort(totalLoss)}`}
                                isKg
                                className={cn(!isDesktop && "col-span-2")}
                            />
                        </>
                    )}
                </div>

                {/* --- SECTION 3: ENHANCED SALDO CHART --- */}
                <Card className="bg-[#0C1319] border-white/5 rounded-[32px] overflow-hidden shadow-2xl p-6">
                    <div className="flex justify-between items-start mb-6 px-2">
                        <div className="space-y-1">
                            <CardTitle className="font-display font-black uppercase tracking-tight text-lg">Saldo Kumulatif</CardTitle>
                            <div className="flex items-center gap-2">
                                {chartData.slice(-1)[0]?.saldo < 0 ? (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Defisit — piutang belum cair</span>
                                ) : (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Surplus</span>
                                )}
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Periode Aktif</p>
                            <p className="text-xs font-bold text-[#F1F5F9]">{format(dateRange.start, 'dd MMM')} - {format(dateRange.end, 'dd MMM')}</p>
                        </div>
                    </div>

                    <div className={cn(
                        "transition-all duration-700",
                        isDesktop ? "h-[280px]" : "h-[160px]"
                    )}>
                        {isLoading ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-[#4B6478]">
                                <Clock className="animate-spin" size={32} strokeWidth={1.5} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Membangun chart...</span>
                            </div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F87171" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3A" vertical={false} />
                                    <XAxis 
                                        dataKey="label" 
                                        tick={{ fill: '#4B6478', fontSize: 10, fontWeight: 700 }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        interval={selectedPeriod === 'month' ? 4 : 0}
                                    />
                                    <YAxis 
                                        tick={{ fill: '#4B6478', fontSize: 10, fontWeight: 700 }} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tickFormatter={v => `${(v/1000000).toFixed(0)}jt`}
                                    />
                                    <Tooltip content={<EnhancedTooltip />} />
                                    
                                    <Area dataKey="saldoPositif" fill="url(#gradGreen)" stroke="none" />
                                    <Area dataKey="saldoNegatif" fill="url(#gradRed)" stroke="none" />
                                    
                                    <Line 
                                        type="monotone" 
                                        dataKey="saldo" 
                                        stroke="#10B981" 
                                        strokeWidth={3} 
                                        dot={false}
                                        activeDot={{ r: 6, fill: '#10B981', stroke: '#0C1319', strokeWidth: 3 }}
                                    />
                                    
                                    <Line 
                                        type="monotone" 
                                        dataKey="saldoLalu" 
                                        stroke="#4B6478" 
                                        strokeWidth={1.5} 
                                        strokeDasharray="4 4" 
                                        dot={false} 
                                    />

                                    <Line 
                                        type="monotone" 
                                        dataKey="proyeksi" 
                                        stroke="#10B981" 
                                        strokeWidth={1.5} 
                                        strokeDasharray="6 3" 
                                        dot={false}
                                        opacity={0.4}
                                    />

                                    <Scatter 
                                        dataKey="paymentEvent" 
                                        shape={<PaymentDot />} 
                                    />

                                    <ReferenceLine y={0} stroke="#4B6478" strokeDasharray="2 2" />
                                    
                                    <Legend 
                                        verticalAlign="bottom" 
                                        align="center"
                                        wrapperStyle={{ paddingTop: 20 }}
                                        content={({ payload }) => (
                                            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                                                <LegendItem color="#10B981" label="Saldo Minggu Ini" />
                                                <LegendItem color="#4B6478" label="Minggu Lalu" dashed />
                                                <LegendItem color="#10B981" label="Proyeksi" dashed opacity={0.5} />
                                                <LegendItem color="#10B981" label="Pembayaran Masuk" dot />
                                            </div>
                                        )}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#4B6478] text-[10px] font-black uppercase">Belum ada data visual</div>
                        )}
                    </div>
                </Card>

                {/* --- SECTION 4: 3-COLUMN ANALYSIS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* COL 1: CASH FLOW REAL */}
                    <div className="lg:col-span-4 bg-[#0C1319] rounded-[32px] border border-white/5 p-6 space-y-6">
                        <div className="space-y-1">
                            <h4 className="font-display font-black text-white text-lg uppercase tracking-tight">Cash Flow Real</h4>
                            <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest leading-none">Berdasarkan pembayaran diterima</p>
                        </div>
                        
                        <div className="space-y-4">
                            <AnalysisRow label="Pembayaran Diterima" value={data?.cashIn} prefix="+" color="emerald" formatFn={formatCompact} />
                            <AnalysisRow label="Beli Ayam (Modal)" value={data?.totalModal} prefix="-" color="red" formatFn={formatCompact} />
                            <AnalysisRow label="Ongkos Kirim" value={data?.totalDeliveryCost} prefix="-" color="red" formatFn={formatCompact} />
                            <AnalysisRow label="Extra Expenses" value={data?.totalExtra} prefix="-" color="red" formatFn={formatCompact} />
                            
                            <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                                <span className="text-[11px] font-black text-white uppercase tracking-widest">Net Cash {selectedPeriod === 'week' ? 'Minggu' : 'Bulan'} Ini</span>
                                <span className={cn("text-xl font-display font-black tabular-nums leading-none", (data?.netCash || 0) >= 0 ? "text-emerald-400" : "text-[#F87171]")}>
                                    {formatCompact(data?.netCash || 0)}
                                </span>
                            </div>
                        </div>

                        <div className={cn(
                            "p-4 rounded-2xl border transition-all",
                            (data?.netCash || 0) < 0 
                                ? "bg-amber-500/5 border-amber-500/20 text-amber-500" 
                                : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                        )}>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                {(data?.netCash || 0) < 0 
                                    ? `Defisit ${formatCompact(Math.abs(data?.netCash || 0))}. Likuiditas aman jika piutang ${formatCompact(data?.totalPiutang || 0)} cair.`
                                    : `Surplus ${formatCompact(data?.netCash || 0)}. Arus kas sehat ${selectedPeriod === 'week' ? 'minggu' : 'bulan'} ini.`
                                }
                            </p>
                        </div>
                    </div>

                    {/* COL 2: TOP RPA & FARM */}
                    <div className="lg:col-span-4 bg-[#0C1319] rounded-[32px] border border-white/5 p-6 space-y-8">
                        {/* TOP RPA */}
                        <div className="space-y-5">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Top Profit RPA</h4>
                                <ArrowRight size={14} className="text-[#4B6478]" />
                            </div>
                            <div className="space-y-4">
                                {rpaPerformance.slice(0, 3).map((rpa, i) => {
                                    const marginKg = rpa.total_kg > 0 ? (rpa.net_profit / rpa.total_kg) : 0
                                    const progress = maxMarginKg > 0 ? (marginKg / maxMarginKg * 100) : 0
                                    
                                    return (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-0.5">
                                                    <p className="text-[11px] font-black text-white uppercase truncate max-w-[140px]">{rpa.name}</p>
                                                    <p className="text-[9px] font-bold text-[#4B6478] uppercase">{rpa.transaction_count} Tx · {formatWeight(rpa.total_kg || 0)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[11px] font-black text-emerald-400 tabular-nums">+{formatIDRShort(rpa.net_profit)}</p>
                                                    <p className="text-[8px] font-bold text-[#4B6478] uppercase">Margin Rp {marginKg.toFixed(0)}/kg</p>
                                                </div>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    className="h-full bg-emerald-500/40"
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* TOP KANDANG */}
                        <div className="space-y-5 pt-6 border-t border-white/5">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Top Modal Kandang</h4>
                            <div className="space-y-4">
                                {farmPerformance.slice(0, 2).map((farm, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="space-y-0.5">
                                            <p className="text-[11px] font-black text-white uppercase">{farm.name}</p>
                                            <p className="text-[9px] font-bold text-[#4B6478] uppercase">Modal {formatIDRShort(farm.total_cost)}</p>
                                        </div>
                                        <Badge variant="outline" className="h-6 text-[9px] font-black border-white/10 bg-white/5 text-[#4B6478]">
                                            {farm.transaction_count} TX
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* COL 3: MINI CARDS */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* LOSS DETAIL */}
                        <div className="bg-[#0C1319] rounded-[32px] border border-white/5 p-5 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Detail Kerugian</span>
                                <span className={cn("text-xs font-black uppercase", lossColor)}>{lossRate.toFixed(1)}% LOSS</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-bold text-[#4B6478] uppercase">Susut Berat</p>
                                    <p className="text-sm font-black text-white tabular-nums">-{totalLossKg} kg</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-bold text-[#4B6478] uppercase">Nilai Hilang</p>
                                    <p className="text-sm font-black text-[#F87171] tabular-nums">-{formatIDRShort(totalLoss)}</p>
                                </div>
                            </div>
                            <p className="text-[8px] font-bold text-[#4B6478] uppercase leading-relaxed italic">*Loss sudah tercermin otomatis di pendapatan</p>
                        </div>

                        {/* PROYEKSI KAS */}
                        <div className="bg-[#0C1319] rounded-[32px] border border-white/5 p-5 space-y-4">
                            <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Proyeksi Kas Bersih</span>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px]">
                                    <span className="font-bold text-[#94A3B8]">CASH SAAT INI</span>
                                    <span className={cn("font-black tabular-nums", (data?.netCash || 0) >= 0 ? "text-emerald-400" : "text-[#F87171]")}>
                                        {formatIDRShort(data?.netCash || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span className="font-bold text-[#94A3B8] uppercase">+ PIUTANG AKTIF</span>
                                    <span className="font-black text-amber-400">+{formatIDRShort(data?.totalPiutang || 0)}</span>
                                </div>
                                <div className="pt-2 border-t border-white/5 flex justify-between items-baseline">
                                    <span className="text-[9px] font-black text-white uppercase">Proyeksi Bersih</span>
                                    <span className={cn("text-base font-black tabular-nums", (data?.proyeksiNet || 0) >= 0 ? "text-emerald-400" : "text-[#F87171]")}>
                                        {formatCompact(data?.proyeksiNet || 0)}
                                    </span>
                                </div>
                            </div>
                            <div className={cn(
                                "py-2 px-3 rounded-lg text-center",
                                (data?.proyeksiNet || 0) >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-[#F87171]"
                            )}>
                                <p className="text-[9px] font-black uppercase tracking-widest">
                                    {(data?.proyeksiNet || 0) >= 0 ? "Bisnis Sehat — Tagih piutang sebelum beli lagi" : "Perhatikan Likuiditas — Proyeksi Masih Defisit"}
                                </p>
                            </div>
                        </div>

                        {/* EXTRA EXPENSES DRILL-DOWN */}
                        <div className="bg-[#0C1319] rounded-[32px] border border-white/5 p-6 space-y-5">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Breakdown Extra</span>
                                <Plus 
                                    size={16} 
                                    className="text-emerald-400 cursor-pointer hover:bg-emerald-400/10 rounded-full transition-all" 
                                    onClick={() => setIsCreateExpenseOpen(true)}
                                />
                            </div>
                            <div className="space-y-3">
                                {Object.entries(groupedExtras).map(([cat, val], i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-[#94A3B8] uppercase">{cat}</span>
                                        <span className="text-[10px] font-black text-[#F87171] tabular-nums">-{formatIDRShort(val)}</span>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-white uppercase">Total Extra</span>
                                    <span className="text-[11px] font-black text-[#F87171]">{formatIDRShort(data?.totalExtra || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- SECTION 5: TRANSACTION LIST --- */}
                <Card className="bg-[#0C1319] border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                    <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTxFilter}>
                        <CardHeader className="p-8 pb-4">
                            <div id="transaction-detail" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-1">
                                    <CardTitle className="font-display text-lg font-black uppercase tracking-tight">Riwayat Transaksi</CardTitle>
                                    <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest">{allTransactions.length} Aktivitas terekam</p>
                                </div>
                                <TabsList className="bg-white/5 p-1 rounded-2xl flex-wrap h-auto justify-start border border-white/5">
                                    <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 text-[#4B6478]">Semua</TabsTrigger>
                                    <TabsTrigger value="sale" className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 text-[#4B6478]">Jual</TabsTrigger>
                                    <TabsTrigger value="purchase" className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 text-[#4B6478]">Beli</TabsTrigger>
                                    <TabsTrigger value="payment" className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 text-[#4B6478]">Pembayaran</TabsTrigger>
                                    <TabsTrigger value="extra" className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 text-[#4B6478]">Extra</TabsTrigger>
                                </TabsList>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="p-4 sm:p-8 pt-0">
                            {isLoading ? (
                                <div className="space-y-4 py-10">
                                    {Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 animate-pulse">
                                            <div className="w-10 h-10 rounded-full bg-white/5" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-white/5 rounded w-1/4" />
                                                <div className="h-3 bg-white/5 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredTransactions.length > 0 ? (
                                <div className="space-y-1 divide-y divide-white/5">
                                    {filteredTransactions.slice(0, 15).map((tx, idx) => (
                                        <EnhancedTransactionRow key={`${tx._type}-${tx.id}-${idx}`} tx={tx} navigate={navigate} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState period={selectedPeriod} onClick={() => setIsCreateExpenseOpen(true)} />
                            )}
                        </CardContent>
                    </Tabs>
                </Card>
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

function SummaryCard({ label, value, icon: Icon, color, sub, className, highlight, isDesktop, onClick, clickable, isKg, isRupiahOnly }) {
    const isEmerald = color === 'emerald'
    const isAmber = color === 'amber'
    const isRed = color === 'red'
    const isSlate = color === 'slate'
    const isWhite = color === 'white'

    return (
        <Card 
            onClick={onClick}
            className={cn(
                "bg-[#0C1319] rounded-[24px] shadow-xl relative overflow-hidden group transition-all active:scale-95",
                clickable && "cursor-pointer hover:border-white/20",
                isDesktop ? "p-5" : "p-4",
                isEmerald && "border-emerald-500/10 hover:border-emerald-500/30",
                isAmber && "border-amber-500/10 hover:border-amber-500/30",
                isRed && "border-red-500/10 hover:border-red-500/30",
                isSlate && "border-white/5",
                isWhite && "border-white/10",
                className
            )}
        >
            <div className={cn(
                "absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform",
                isEmerald && "text-emerald-500",
                isAmber && "text-amber-500",
                isRed && "text-red-500",
                isWhite && "text-white"
            )}>
                <Icon size={80} strokeWidth={1.5} />
            </div>
            <div className="space-y-3 relative z-10 text-left">
                <div className="flex items-center gap-2.5">
                    <div className={cn(
                        "rounded-lg border",
                        isDesktop ? "p-2" : "p-1.5",
                        isEmerald && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                        isAmber && "bg-amber-500/10 border-amber-500/20 text-amber-400",
                        isRed && "bg-red-500/10 border-red-500/20 text-red-400",
                        isSlate && "bg-white/5 border-white/10 text-[#4B6478]",
                        isWhite && "bg-white/5 border-white/10 text-white"
                    )}>
                        <Icon size={isDesktop ? 14 : 16} strokeWidth={2.5} />
                    </div>
                    <span className={cn("font-display font-black uppercase tracking-widest text-[#4B6478]", isDesktop ? "text-[9px]" : "text-[10px]")}>
                        {label}
                    </span>
                </div>
                <div>
                    <h3 className={cn(
                        "font-display font-black tracking-tight flex items-baseline gap-1 leading-none tabular-nums",
                        isDesktop ? "text-lg" : "text-xl",
                        isEmerald && "text-emerald-400",
                        isAmber && "text-amber-400",
                        isRed && "text-red-400",
                        isWhite && "text-white",
                        isSlate && "text-[#4B6478]"
                    )}>
                        {isKg ? `${value} kg` : isRupiahOnly ? `Rp ${value}` : formatIDR(value || 0)}
                    </h3>
                    <p className={cn("font-bold text-[#4B6478] uppercase mt-1.5 tracking-widest", isDesktop ? "text-[8px]" : "text-[9px]")}>
                        {sub}
                    </p>
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

function EnhancedTransactionRow({ tx, navigate }) {
    const isJual = tx._type === 'sale'
    const isBeli = tx._type === 'purchase'
    const isPembayaran = tx._type === 'payment'
    const isExtra = tx._type === 'extra'

    const handleClick = () => {
        if (isJual || isBeli) navigate('/broker/poultry_broker/transaksi')
        else if (isPembayaran) navigate('/broker/poultry_broker/rpa')
    }

    return (
        <div 
            onClick={handleClick}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5 cursor-pointer"
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-2.5 h-2.5 rounded-full ring-4",
                    isJual && "bg-emerald-500 ring-emerald-500/10",
                    isBeli && "bg-red-500 ring-red-500/10",
                    isPembayaran && "bg-emerald-400 ring-emerald-400/10",
                    isExtra && "bg-slate-500 ring-slate-500/10"
                )} />
                <div className="space-y-1">
                    <p className="font-display font-black text-white text-sm group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                        {isJual ? `Jual ke ${tx.rpa_clients?.rpa_name}` : 
                         isBeli ? `Beli dari ${tx._farm}` : 
                         isPembayaran ? `Pembayaran dari ${tx._rpa}` : tx.description || 'Extra Expense'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest whitespace-nowrap">
                            {formatDate(tx._date)}
                        </span>
                        <span className="text-[10px] font-bold text-[#4B6478]/30">·</span>
                        <span className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest leading-none">
                            {isJual && `${tx._farm} · ${tx.quantity || 0} ekor · ${formatWeight(tx._kg)}`}
                            {isBeli && `${tx.quantity || 0} ekor · Rp ${formatIDRShort(tx.price_per_kg || 0)}/kg`}
                            {isPembayaran && `Untuk Tx ${tx._saleDate ? format(new Date(tx._saleDate), 'dd MMM') : 'unknown'}`}
                            {isExtra && `${tx.category || 'Operasional'}`}
                        </span>
                    </div>
                    {isJual && (
                        <p className="text-[9px] font-black text-emerald-500/80 uppercase">Margin: +Rp {tx._profit > 0 ? (tx._profit / tx._kg).toFixed(0) : 0}/kg</p>
                    )}
                </div>
            </div>
            <div className="text-left sm:text-right mt-3 sm:mt-0 pl-6 sm:pl-0">
                <p className={cn(
                    "font-display font-black tabular-nums tracking-tight",
                    isJual || isPembayaran ? "text-emerald-400" : "text-[#F87171]"
                )}>
                    {isJual ? `+${formatIDR(tx.total_revenue)}` : 
                     isPembayaran ? `+${formatIDR(tx.amount)}` :
                     `-${formatIDR(tx.total_cost || tx.amount || 0)}`}
                </p>
                {isJual ? (
                    <Badge variant="outline" className={cn(
                        "h-5 text-[8px] font-black uppercase tracking-widest mt-1",
                        getStatusColor(tx.payment_status)
                    )}>
                        {getStatusLabel(tx.payment_status)}
                    </Badge>
                ) : (
                    <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest block mt-1">
                        {isBeli ? "Modal" : isPembayaran ? "Cash Masuk" : "Extra"}
                    </span>
                )}
            </div>
        </div>
    )
}

function AnalysisRow({ label, value, prefix, color }) {
    const isEmerald = color === 'emerald'
    const isRed = color === 'red'
    const isAmber = color === 'amber'

    return (
        <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-tight">{label}</span>
            <span className={cn(
                "text-[12px] font-black tabular-nums",
                isEmerald && "text-emerald-400",
                isRed && "text-[#F87171]",
                isAmber && "text-amber-400"
            )}>
                {prefix}{formatIDRShort(value || 0)}
            </span>
        </div>
    )
}

function EmptyState({ period, onClick }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500/20">
                <TrendingUp size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-display font-black text-white uppercase italic text-center">Belum ada transaksi {period === 'week' ? 'minggu' : 'bulan'} ini</h3>
                <p className="text-[#4B6478] text-[11px] font-bold uppercase tracking-widest max-w-[280px]">Catat transaksi pertama untuk mulai tracking arus kas Anda</p>
            </div>
            <Button 
                onClick={onClick}
                className="h-12 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest text-[11px] transition-all"
            >
                <Plus size={18} className="mr-2" />
                Catat Transaksi
            </Button>
        </div>
    )
}

function SkeletonCard() {
    return (
        <div className="bg-[#0C1319] p-5 rounded-[24px] border border-white/5 space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
            <div className="h-6 bg-white/5 rounded w-3/4" />
        </div>
    )
}

function EnhancedTooltip({ active, payload }) {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="bg-[#0C1319] border border-white/10 rounded-2xl p-4 shadow-2xl space-y-4 min-w-[240px]">
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest border-b border-white/5 pb-2">
                    {data.fullDate}
                </p>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Saldo Sekarang</span>
                        <span className={cn("text-[13px] font-black tabular-nums", data.saldo >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {data.saldo !== null ? formatIDR(data.saldo) : '—'}
                        </span>
                    </div>
                    {data.saldoLalu !== null && (
                        <div className="flex justify-between items-center opacity-60">
                            <span className="text-[10px] font-bold text-[#4B6478] uppercase">Periode Lalu</span>
                            <span className="text-[11px] font-black text-white tabular-nums">{formatIDR(data.saldoLalu)}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-[#4B6478] uppercase">Cash In</p>
                        <p className="text-[11px] font-black text-emerald-400">+{formatIDRShort(data.cashIn)}</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-[#4B6478] uppercase">Cash Out</p>
                        <p className="text-[11px] font-black text-red-400">-{formatIDRShort(data.cashOut)}</p>
                    </div>
                </div>

                {data.payments?.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Pembayaran Masuk:</p>
                        {data.payments.map((p, i) => (
                            <div key={i} className="flex justify-between items-center gap-2">
                                <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{p.rpa_name}</span>
                                <span className="text-[10px] font-black text-emerald-400 flex-shrink-0">+{formatIDRShort(p.amount)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }
    return null
}

function PaymentDot(props) {
    const { cx, cy, payload } = props
    if (payload.paymentEvent === null) return null
    return (
        <g>
            <circle cx={cx} cy={cy} r={8} fill="#10B981" fillOpacity={0.2} />
            <circle cx={cx} cy={cy} r={4} fill="#10B981" stroke="#0C1319" strokeWidth={2} />
        </g>
    )
}

function LegendItem({ color, label, dashed, opacity, dot }) {
    return (
        <div className="flex items-center gap-2" style={{ opacity: opacity || 1 }}>
            {dot ? (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#0C1319]" />
            ) : (
                <div 
                    className={cn("h-0.5 w-6 rounded-full", dashed && "border-t-2 border-dashed bg-transparent")} 
                    style={{ backgroundColor: dashed ? 'transparent' : color, borderColor: color }} 
                />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">{label}</span>
        </div>
    )
}

// --- SHEET: CATAT PENGELUARAN EXTRA ---

function CreateExtraExpenseSheet({ isOpen, onClose }) {
    const { tenant } = useAuth()
    const queryClient = useQueryClient()
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            category: 'tenaga_kerja',
            description: '',
            amount: 0,
            expense_date: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
        }
    })

    const expenseDate = watch('expense_date')

    // Sync state for date picker if needed
    const handleDateChange = (date) => {
        setValue('expense_date', date)
    }

    const onSubmit = async (data) => {
        setIsLoading(true)
        try {
            const payload = {
                ...data,
                tenant_id: tenant.id,
                is_deleted: false
            }

            const { error } = await supabase.from('extra_expenses').insert(payload)
            
            if (error) throw error
            
            toast.success('Pengeluaran berhasil dicatat!')
            queryClient.invalidateQueries(['cashflow-v2'])
            reset()
            onClose()
        } catch (error) {
            toast.error('Gagal mencatat pengeluaran: ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="bg-[#0C1319] border-l border-white/10 p-6 h-full text-left overflow-y-auto w-full sm:max-w-md shadow-2xl">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight">Catat Pengeluaran</SheetTitle>
                    <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">Dokumentasikan biaya operasional non-logistik</SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Kategori *</Label>
                            <Select 
                                onValueChange={(val) => setValue('category', val)} 
                                defaultValue="tenaga_kerja"
                            >
                                <SelectTrigger className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-black text-xs uppercase text-white shadow-inner focus:ring-emerald-500/20">
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
                            {errors.category && <p className="text-xs text-red-400 ml-1">{errors.category.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Keterangan *</Label>
                            <Input 
                                {...register('description')}
                                placeholder="Cth: Upah kuli muat 3 orang" 
                                className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-bold text-base text-white uppercase placeholder:text-white/10 focus:ring-emerald-500/20" 
                            />
                            {errors.description && <p className="text-xs text-red-400 ml-1">{errors.description.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Nominal Rp *</Label>
                                <InputRupiah 
                                    value={watch('amount')}
                                    onChange={(val) => setValue('amount', val, { shouldValidate: true })}
                                    placeholder="150000" 
                                    className="h-14 rounded-2xl bg-[#111C24] border-white/5 font-bold text-base text-white focus:ring-emerald-500/20" 
                                />
                                {errors.amount && <p className="text-xs text-red-400 ml-1">{errors.amount.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Tanggal *</Label>
                                <DatePicker 
                                    value={expenseDate}
                                    onChange={handleDateChange}
                                    className="h-14"
                                />
                                {errors.expense_date && <p className="text-xs text-red-400 ml-1">{errors.expense_date.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className={cn("font-black uppercase tracking-widest text-[#4B6478] ml-1", isDesktop ? "text-[10px]" : "text-xs")}>Catatan Tambahan</Label>
                            <Textarea 
                                {...register('notes')}
                                placeholder="Tulis catatan jika diperlukan..." 
                                className="rounded-2xl bg-[#111C24] border-white/5 font-bold text-base p-4 min-h-[100px] text-white focus:ring-emerald-500/20" 
                            />
                        </div>
                    </div>

                    <SheetFooter>
                        <Button 
                            disabled={isLoading}
                            className="w-full h-16 bg-red-500 hover:bg-red-400 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-red-500/20 active:scale-95 transition-all mt-4"
                        >
                            {isLoading ? 'MENYIMPAN...' : 'SIMPAN PENGELUARAN'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
