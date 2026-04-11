import React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ChevronRight, BarChart2 } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical, BUSINESS_MODELS } from '@/lib/businessModel'

function usePageTitle() {
  const location = useLocation()
  const { id } = useParams()
  
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
    'beranda':    'Beranda',
    'transaksi':  'Transaksi',
    'rpa':        'RPA & Piutang',
    'kandang':    'Kandang',
    'pengiriman': 'Pengiriman',
    'cashflow':   'Cash Flow',
    'armada':     'Armada & Sopir',
    'simulator':  'Simulator Margin',
    'akun':       'Akun',
    'harga-pasar': 'Harga Pasar',
    'siklus':      'Riwayat Siklus',
    'input-harian': 'Input Harian',
    'pakan':       'Stok Pakan',
    'laporan':     'Laporan',
    'farm-beranda': 'Dashboard Kandang',
    'penjualan':   'Penjualan',
    'toko-supplier': 'Toko & Supplier',
    'gudang':      'Gudang Sembako',
    'produk':      'Daftar Produk',
  }
  
  if (location.pathname.includes('/rpa/') && id) {
    return rpa?.rpa_name || 'Detail RPA'
  }

  const segments = location.pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  
  return titles[lastSegment] || titles[location.pathname] || 'Dashboard'
}

export default function DesktopTopBar() {
  const navigate = useNavigate()
  const pageTitle = usePageTitle()
  const { profile, tenant } = useAuth()
  
  const vertical = resolveBusinessVertical(profile, tenant)
  const model = BUSINESS_MODELS[vertical]

  const { data: marketPrice } = useQuery({
    queryKey: ['market-price-topbar', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null
      const today = new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]
      
      const [salesRes, purchasesRes, globalRes] = await Promise.all([
        supabase.from('sales').select('price_per_kg').eq('tenant_id', tenant.id).eq('transaction_date', today).eq('is_deleted', false).gt('price_per_kg', 0),
        supabase.from('purchases').select('price_per_kg').eq('tenant_id', tenant.id).eq('transaction_date', today).eq('is_deleted', false).gt('price_per_kg', 0),
        supabase.from('market_prices')
          .select('*')
          .eq('is_deleted', false)
          .order('price_date', { ascending: false })
          .limit(10)
      ])

      const MIN_REALISTIC_PRICE = 15000
      const s = (salesRes.data || []).filter(x => Number(x.price_per_kg) >= MIN_REALISTIC_PRICE)
      const p = (purchasesRes.data || []).filter(x => Number(x.price_per_kg) >= MIN_REALISTIC_PRICE)
      const prices = (globalRes.data || []).filter(x => x.buyer_price >= x.farm_gate_price && x.buyer_price >= MIN_REALISTIC_PRICE)
      const g = prices.find(x => x.region === 'Jawa Tengah') || prices[0]

      const liveSell = s.length > 0 ? s.reduce((acc, x) => acc + (Number(x.price_per_kg) || 0), 0) / s.length : 0
      const liveBuy = p.length > 0 ? p.reduce((acc, x) => acc + (Number(x.price_per_kg) || 0), 0) / p.length : 0

      return {
        farm_gate_price: liveBuy > 0 ? liveBuy : (g?.farm_gate_price || 0),
        buyer_price: liveSell > 0 ? liveSell : (g?.buyer_price || 0),
      }
    },
    enabled: !!tenant?.id && vertical === 'poultry_broker'
  })

  return (
    <header className="flex items-center gap-4 px-8 h-[60px] border-b border-border bg-background sticky top-0 z-50">
      <SidebarTrigger className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:bg-secondary/10 transition-colors" />
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <nav className="flex items-center gap-2 text-[13px] font-medium font-body">
        <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
          {model?.categoryLabel || 'Dashboard'}
        </span>
        <ChevronRight size={14} className="text-muted-foreground/50" />
        <span className="text-foreground font-bold tracking-tight">{pageTitle}</span>
      </nav>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-3">
        {vertical === 'poultry_broker' && (
          <button
            onClick={() => navigate('/dashboard/harga-pasar')}
            className="flex items-center gap-3 px-3.5 py-1.5 bg-secondary border border-border rounded-xl hover:border-white/20 transition-all group"
          >
            <BarChart2 size={13} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <div className="flex items-center gap-1.5 text-[11px] font-body">
              <span className="text-muted-foreground">Beli</span>
              <span className="font-bold text-emerald-400 tabular-nums">
                Rp {marketPrice?.farm_gate_price?.toLocaleString('id-ID') || '--'}
              </span>
            </div>
            <div className="w-px h-3 bg-border mx-1" />
            <div className="flex items-center gap-1.5 text-[11px] font-body">
              <span className="text-muted-foreground">Jual</span>
              <span className="font-bold text-foreground tabular-nums">
                Rp {marketPrice?.buyer_price?.toLocaleString('id-ID') || '--'}
              </span>
            </div>
          </button>
        )}
        
        <NotificationBell />
      </div>
    </header>
  )
}
