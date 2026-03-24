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

export default function EggBeranda() {
  const navigate = useNavigate()
  const { data: inventory, isLoading: loadingInv } = useEggInventory()
  const { data: sales, isLoading: loadingSales } = useEggSales()
  const { data: customers, isLoading: loadingCust } = useEggCustomers()

  const stats = useMemo(() => {
    const totalStok = inventory?.reduce((acc, i) => acc + (i.current_stock || 0), 0) || 0
    const totalSales = sales?.length || 0
    const activeCustomers = customers?.length || 0
    const omzet = sales?.reduce((acc, s) => acc + (s.total_amount || 0), 0) || 0
    
    return { totalStok, totalSales, activeCustomers, omzet }
  }, [inventory, sales, customers])

  return (
    <div className="p-6 lg:p-10 space-y-10 bg-[#06090F] min-h-screen pb-24 text-left">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Dashboard Broker Telur</h2>
          <p className="text-xs font-bold text-[#4B6478] uppercase mt-2 tracking-[0.2em]">Ringkasan operasional Hero Farm</p>
        </div>
        <div className="flex gap-3">
            <Button 
                onClick={() => navigate('/broker/egg_broker/pos')}
                className="bg-[#10B981] hover:bg-emerald-600 h-14 px-8 font-black uppercase tracking-widest text-[11px] rounded-[20px] border-none shadow-[0_8px_24px_rgba(16,185,129,0.2)] gap-3"
            >
                <Plus size={18} strokeWidth={3} />
                Catat Penjualan
            </Button>
        </div>
      </motion.div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIItem title="Stok Tersedia" value={`${stats.totalStok} kg`} icon={Package} color="text-emerald-400" />
        <KPIItem title="Total Transaksi" value={stats.totalSales} icon={ShoppingCart} color="text-blue-400" />
        <KPIItem title="Jumlah Pelanggan" value={stats.activeCustomers} icon={Users} color="text-purple-400" />
        <KPIItem title="Total Omzet" value={formatIDR(stats.omzet)} icon={TrendingUp} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Stock Summary */}
        <Card className="lg:col-span-2 p-8 bg-[#111C24] border-white/5 rounded-[32px] relative overflow-hidden">
            <h3 className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Package size={14} /> Status Inventori Per Grade
            </h3>
            <div className="space-y-4">
                {loadingInv ? [1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl bg-white/5" />) :
                 inventory?.length === 0 ? <p className="text-xs font-bold text-[#4B6478] italic">Belum ada data inventori</p> :
                 inventory?.slice(0, 5).map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-white/[0.03] rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all cursor-pointer" onClick={() => navigate('/broker/egg_broker/inventori')}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center font-display font-black text-emerald-400 text-sm">{item.name[0]}</div>
                            <p className="font-black text-white uppercase text-sm">{item.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-white tabular-nums">{item.current_stock} <span className="text-[10px] text-[#4B6478]">{item.unit || 'kg'}</span></p>
                        </div>
                    </div>
                 ))
                }
            </div>
            {inventory?.length > 5 && (
                <Button variant="ghost" className="w-full mt-4 text-[#4B6478] font-black uppercase text-[10px] tracking-widest gap-2" onClick={() => navigate('/broker/egg_broker/inventori')}>
                    Lihat Semua <ArrowRight size={14} />
                </Button>
            )}
            <div className="absolute -right-6 -bottom-6 text-white/[0.02] -rotate-12"><Package size={120} /></div>
        </Card>

        {/* Sidebar: Navigation Links */}
        <Card className="p-8 bg-[#111C24] border-white/5 rounded-[32px] space-y-6">
            <h3 className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-2">Navigasi Cepat</h3>
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
    return (
        <Card className="p-6 bg-[#111C24] border-white/5 rounded-[28px] space-y-3 relative overflow-hidden group">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest leading-none mb-1 text-left">{title}</p>
                <p className="font-display font-black text-xl text-white tracking-tight leading-none text-left">{value}</p>
            </div>
            <div className="absolute -right-2 -bottom-2 text-white/[0.02] group-hover:text-white/[0.04] transition-colors"><Icon size={48} /></div>
        </Card>
    )
}

function NavCard({ title, desc, icon: Icon, onClick, color }) {
    return (
        <div 
            onClick={onClick}
            className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer group flex items-center gap-4 text-left"
        >
            <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
                <Icon size={22} />
            </div>
            <div className="flex-1">
                <p className="font-black text-white uppercase text-xs tracking-tight group-hover:text-emerald-400 transition-colors">{title}</p>
                <p className="text-[10px] font-bold text-[#4B6478] leading-none mt-1">{desc}</p>
            </div>
            <ChevronRight size={14} className="text-[#4B6478] group-hover:translate-x-1 transition-all" />
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
