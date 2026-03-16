import React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { 
  SidebarTrigger 
} from '@/components/ui/sidebar'
import { 
  ChevronRight, 
  Bell, 
  BarChart2,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatIDRShort } from '@/lib/format'
import { useAuth } from '@/lib/hooks/useAuth'

function usePageTitle() {
  const location = useLocation()
  const { id } = useParams()
  
  // Fetch nama RPA kalau di halaman detail RPA
  const { data: rpa } = useQuery({
    queryKey: ['rpa-name', id],
    queryFn: async () => {
      if (!id) return null
      const { data } = await supabase
        .from('rpa_clients')
        .select('rpa_name')
        .eq('id', id)
        .single()
      return data
    },
    enabled: !!id && location.pathname.includes('/rpa/')
  })
  
  const titles = {
    '/broker/beranda':    'Beranda',
    '/broker/transaksi':  'Transaksi',
    '/broker/rpa':        'RPA & Piutang',
    '/broker/kandang':    'Kandang',
    '/broker/pengiriman': 'Pengiriman',
    '/broker/cashflow':   'Cash Flow',
    '/broker/armada':     'Armada & Sopir',
    '/broker/simulator':  'Simulator Margin',
    '/broker/akun':       'Akun',
    '/harga-pasar':       'Harga Pasar',
  }
  
  // Kalau di halaman detail RPA
  if (location.pathname.startsWith('/broker/rpa/') && id) {
    return rpa?.rpa_name || 'Detail RPA'
  }
  
  return titles[location.pathname] || 'Dashboard'
}

export default function DesktopTopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const pageTitle = usePageTitle()

  const { data: marketPrice } = useQuery({
    queryKey: ['market-price-topbar'],
    queryFn: async () => {
      const { data } = await supabase
        .from('market_prices')
        .select('*')
        .order('price_date', { ascending: false })
        .limit(1)
        .single()
      return data
    }
  })

  return (
    <header className="flex items-center gap-4 px-8 h-[60px] border-b border-border bg-background sticky top-0 z-50">
      <SidebarTrigger className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:bg-secondary/10 transition-colors" />
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <nav className="flex items-center gap-2 text-[13px] font-medium font-body">
        <span className="text-muted-foreground">Broker</span>
        <ChevronRight size={14} className="text-muted-foreground/50" />
        <span className="text-foreground font-bold tracking-tight">{pageTitle}</span>
      </nav>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full group hover:border-emerald-500/30 transition-all cursor-default">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
        </div>
        
        {/* Harga pasar quick info */}
        <button
          onClick={() => navigate('/harga-pasar')}
          className="flex items-center gap-3 px-3.5 py-1.5 bg-secondary border border-border rounded-xl hover:border-white/20 transition-all group"
        >
          <BarChart2 size={13} className="text-emerald-400 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-1.5 text-[11px] font-body">
            <span className="text-muted-foreground">Beli</span>
            <span className="font-bold text-emerald-400 tabular-nums">
              Rp {marketPrice?.farm_gate_price?.toLocaleString('id-ID') || '--'}
            </span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1.5 text-[11px] font-body">
            <span className="text-muted-foreground">Jual</span>
            <span className="font-bold text-foreground tabular-nums">
              Rp {marketPrice?.buyer_price?.toLocaleString('id-ID') || '--'}
            </span>
          </div>
        </button>
        
        {/* Notification bell */}
        <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-transparent hover:bg-secondary/10 transition-all text-muted-foreground relative group">
          <Bell size={15} />
          <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-background" />
        </button>
      </div>
    </header>
  )
}
