import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Package, ShoppingCart, History, TrendingUp, Users, Building2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEggInventory } from '@/lib/hooks/useEggInventory'
import { useEggSales } from '@/lib/hooks/useEggSales'
import { useEggCustomers } from '@/lib/hooks/useEggCustomers'
import { formatIDR } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

export default function EggBeranda() {
  const navigate = useNavigate()
  const { data: inventory, isLoading: loadingInv } = useEggInventory()
  const { data: sales, isLoading: loadingSales } = useEggSales()
  const { data: customers, isLoading: loadingCust } = useEggCustomers()

  const stats = useMemo(() => {
    const totalStok = inventory?.reduce((acc, i) => acc + (i.current_stock_butir || 0), 0) || 0
    const totalSales = sales?.length || 0
    const activeCustomers = customers?.length || 0
    const omzet = sales?.reduce((acc, s) => acc + (s.total_amount || 0), 0) || 0
    
    return { totalStok, totalSales, activeCustomers, omzet }
  }, [inventory, sales, customers])

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <div className={cn("bg-[#06090F] min-h-screen pb-24 text-left", isDesktop ? "p-10 space-y-10" : "p-5 pt-10 space-y-8")}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div>
          <h2 className={cn("font-black text-white uppercase tracking-tighter leading-none", isDesktop ? "text-4xl" : "text-2xl")}>Dashboard Broker Telur</h2>
          <p className={cn("font-bold text-[#4B6478] uppercase mt-2 tracking-[0.2em]", isDesktop ? "text-xs" : "text-[10px]")}>Ringkasan operasional Hero Farm</p>
        </div>
        <div className="flex gap-3">
            <Button 
                onClick={() => navigate('/egg/pos')}
                className="bg-[#10B981] hover:bg-emerald-600 h-14 px-8 font-black uppercase tracking-widest text-[11px] rounded-[20px] border-none shadow-[0_8px_24px_rgba(16,185,129,0.2)] gap-3"
            >
                <Plus size={18} strokeWidth={3} />
                Catat Penjualan
            </Button>
        </div>
      </motion.div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIItem title="Stok Tersedia" value={`${stats.totalStok} butir`} icon={Package} color="text-emerald-400" />
        <KPIItem title="Total Transaksi" value={stats.totalSales} icon={ShoppingCart} color="text-blue-400" />
        <KPIItem title="Jumlah Pelanggan" value={stats.activeCustomers} icon={Users} color="text-purple-400" />
        <KPIItem title="Total Omzet" value={formatIDR(stats.omzet)} icon={TrendingUp} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Stock Summary */}
        <Card className={cn("bg-[#111C24] border-white/5 rounded-[32px] relative overflow-hidden", isDesktop ? "lg:col-span-2 p-8" : "p-6")}>
            <h3 className={cn("font-black text-[#4B6478] uppercase tracking-[0.2em] mb-6 flex items-center gap-2", isDesktop ? "text-[10px]" : "text-[11px]")}>
                <Package size={isDesktop ? 14 : 16} /> Status Inventori Per Grade
            </h3>
            <div className="space-y-4">
                {loadingInv ? [1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl bg-white/5" />) :
                 inventory?.length === 0 ? <p className="text-xs font-bold text-[#4B6478] italic">Belum ada data inventori</p> :
                  inventory?.slice(0, 5).map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-white/[0.03] rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all cursor-pointer" onClick={() => navigate('/egg/inventori')}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center font-display font-black text-emerald-400 text-sm">{item.product_name?.[0] || '?'}</div>
                            <p className="font-black text-white uppercase text-sm">{item.product_name}</p>
                        </div>
                        <div className="text-right">
                            <p className={cn("font-black text-white tabular-nums", isDesktop ? "text-lg" : "text-base")}>{item.current_stock_butir} <span className={cn("text-[#4B6478]", isDesktop ? "text-[10px]" : "text-[11px]")}>butir</span></p>
                        </div>
                    </div>
                 ))
                }
            </div>
            {inventory?.length > 5 && (
                <Button variant="ghost" className="w-full mt-4 text-[#4B6478] font-black uppercase text-[10px] tracking-widest gap-2" onClick={() => navigate('/egg/inventori')}>
                    Lihat Semua <ArrowRight size={14} />
                </Button>
            )}
            <div className="absolute -right-6 -bottom-6 text-white/[0.02] -rotate-12"><Package size={120} /></div>
        </Card>

        {/* Sidebar: Navigation Links */}
        <Card className={cn("bg-[#111C24] border-white/5 rounded-[32px] space-y-6", isDesktop ? "p-8" : "p-6")}>
            <h3 className={cn("font-black text-[#4B6478] uppercase tracking-[0.2em] mb-2", isDesktop ? "text-[10px]" : "text-[11px]")}>Navigasi Cepat</h3>
            <NavCard 
                title="Supplier" 
                desc="Atur pakan & stok masuk" 
                icon={Building2} 
                onClick={() => navigate('/broker/egg_broker/suppliers')}
                color="text-emerald-400"
            />
            <NavCard 
                title="Pelanggan" 
                desc="Database pembeli telur" 
                icon={Users} 
                onClick={() => navigate('/broker/egg_broker/customers')}
                color="text-blue-400"
            />
            <NavCard 
                title="Transaksi" 
                desc="Riwayat penjualan & PDF" 
                icon={History} 
                onClick={() => navigate('/broker/egg_broker/transaksi')}
                color="text-amber-400"
            />
        </Card>
      </div>
    </div>
  )
}

function KPIItem({ title, value, icon: Icon, color }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    return (
        <Card className={cn("bg-[#111C24] border-white/5 rounded-[28px] space-y-3 relative overflow-hidden group", isDesktop ? "p-6" : "p-5")}>
            <div className={cn("rounded-xl bg-white/5 flex items-center justify-center", color, isDesktop ? "w-10 h-10" : "w-11 h-11")}>
                <Icon size={isDesktop ? 20 : 22} />
            </div>
            <div>
                <p className={cn("font-black text-[#4B6478] uppercase tracking-widest leading-none mb-1 text-left", isDesktop ? "text-[10px]" : "text-[11px]")}>{title}</p>
                <p className={cn("font-display font-black text-white tracking-tight leading-none text-left", isDesktop ? "text-xl" : "text-[17px]")}>{value}</p>
            </div>
            <div className="absolute -right-2 -bottom-2 text-white/[0.02] group-hover:text-white/[0.04] transition-colors"><Icon size={isDesktop ? 48 : 56} /></div>
        </Card>
    )
}

function NavCard({ title, desc, icon: Icon, onClick, color }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    return (
        <div 
            onClick={onClick}
            className={cn(
                "rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer group flex items-center text-left active:scale-[0.98]",
                isDesktop ? "p-4 gap-4" : "p-5 gap-5"
            )}
        >
            <div className={cn("rounded-xl bg-white/5 flex items-center justify-center shrink-0", color, isDesktop ? "w-12 h-12" : "w-14 h-14")}>
                <Icon size={isDesktop ? 22 : 26} />
            </div>
            <div className="flex-1">
                <p className={cn("font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors", isDesktop ? "text-xs" : "text-sm")}>{title}</p>
                <p className={cn("font-bold text-[#4B6478] leading-none mt-1.5", isDesktop ? "text-[10px]" : "text-xs")}>{desc}</p>
            </div>
            <ChevronRight size={isDesktop ? 14 : 18} className="text-[#4B6478] group-hover:translate-x-1 transition-all" />
        </div>
    )
}

function ChevronRight({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m9 18 6-6-6-6"/>
        </svg>
    )
}
