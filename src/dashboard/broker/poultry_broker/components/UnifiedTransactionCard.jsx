import React from 'react'
import { isAfter, parseISO } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { 
  formatIDR, formatIDRShort, formatDate, formatEkor, formatWeight, formatPaymentStatus, 
  safeNum, calcNetProfit, calcRemainingAmount 
} from '@/lib/format'
import { BrokerBaseCard } from '@/dashboard/_shared/components/transactions/BrokerBaseCard'

/**
 * getDeliveryBadge - Specific to Poultry Broker delivery statuses.
 */
function getDeliveryBadge(delivery) {
  if (!delivery) return { label: 'Siap Kirim', color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', icon: '📦' }
  
  // Logic Fix: If status is on_route but load_time is in the future, downgrade label to Persiapan
  let currentStatus = delivery.status
  if (currentStatus === 'on_route' && delivery.load_time) {
    const now = new Date()
    const loadTime = parseISO(delivery.load_time)
    if (isAfter(loadTime, now)) {
      currentStatus = 'preparing'
    }
  }

  const map = {
    preparing: {
      label: 'Persiapan',
      color: '#94A3B8',
      bg: 'rgba(148,163,184,0.08)',
      border: 'rgba(148,163,184,0.15)',
      icon: '📦'
    },
    loading: {
      label: 'Sedang Dimuat',
      color: '#FBBF24',
      bg: 'rgba(251,191,36,0.08)',
      border: 'rgba(251,191,36,0.15)',
      icon: '📦'
    },
    on_route: {
      label: 'Di Jalan',
      color: '#FBBF24',
      bg: 'rgba(251,191,36,0.08)',
      border: 'rgba(251,191,36,0.15)',
      icon: '🚚'
    },
    arrived: {
      label: 'Tiba di Tujuan',
      color: '#93C5FD',
      bg: 'rgba(96,165,250,0.08)',
      border: 'rgba(96,165,250,0.15)',
      icon: '📍'
    },
    completed: {
      label: 'Terkirim',
      color: '#34D399',
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.20)',
      icon: '✓'
    }
  }

  return map[currentStatus] || map.preparing
}

export function UnifiedTransactionCard({ sale, onOpenAuditSheet, isOwner, isDesktop }) {
  // Calculations
  const totalRevenue = Number(sale.total_revenue || 0)
  const totalModal = Number(sale.purchases?.total_cost || 0)
  const deliveryCost = Number(sale.delivery_cost || 0)
  const remainingDebt = calcRemainingAmount(sale)
  const netProfit = calcNetProfit(sale)
  
  const delivery = sale.deliveries?.[0] || null
  const totalWeightJual = delivery?.status === 'arrived' || delivery?.status === 'completed' 
    ? safeNum(delivery?.arrived_weight_kg) 
    : safeNum(sale.total_weight_kg)

  const susutWeight = safeNum(delivery?.shrinkage_kg)
  const isLoss = netProfit < 0
  const isInProgress = delivery?.status === 'preparing' || delivery?.status === 'loading' || delivery?.status === 'on_route'
  const isOnRoute = delivery?.status === 'on_route'
  
  const rpaName = sale.rpa_clients?.rpa_name || 'RPA Umum'
  const farmName = sale.purchases?.farms?.farm_name || 'Kandang'
  const initialRpa = rpaName.charAt(0).toUpperCase()

  const header = (
    <>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "w-[34px] h-[34px] rounded-xl flex items-center justify-center font-black text-lg border-2",
          isLoss ? "bg-red-500/10 border-red-500/40 text-red-500" : "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
        )}>
          {initialRpa}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-sm text-[#F1F5F9] leading-none uppercase tracking-tight flex items-center gap-2">
            <span className="truncate block">{farmName}</span>
            <ChevronRight size={14} className="text-[#4B6478] flex-shrink-0" />
            <span className="truncate block">{rpaName}</span>
          </h3>
          <p className="text-xs font-medium text-[#4B6478] mt-1.5 tabular-nums truncate">
            {formatDate(sale.transaction_date)} {sale.due_date ? ` · Tempo: ${formatDate(sale.due_date)}` : ' · COD'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Badge className={cn(
            "rounded-full h-5 px-2 border-none font-black text-[8px] uppercase tracking-wider",
            sale.payment_status === 'lunas' ? 'bg-emerald-500/10 text-emerald-400' : 
            sale.payment_status === 'sebagian' ? 'bg-amber-500/10 text-amber-500' : 
            'bg-red-500/10 text-red-500'
          )}>
            {formatPaymentStatus(sale.payment_status)?.toUpperCase() || 'BELUM LUNAS'}
          </Badge>
          {delivery?.status === 'arrived' && (
            <Badge className="bg-purple-500 text-white border-none font-black text-[8px] px-2 h-5 rounded-full animate-pulse text-center">
              TIBA/AUDIT
            </Badge>
          )}
        </div>
        {(() => {
          const badge = getDeliveryBadge(delivery)
          return (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: isDesktop ? '10px' : '12px',
              fontWeight: 900,
              padding: isDesktop ? '3px 12px' : '4px 14px',
              borderRadius: '99px',
              background: badge.bg,
              border: `1px solid ${badge.border}`,
              color: badge.color,
              textTransform: 'uppercase'
            }}>
               {badge.icon && <span className="opacity-70">{badge.icon}</span>}
              {badge.label}
            </span>
          )
        })()}
      </div>
    </>
  )

  const footer = (
    <>
      <div className="text-left">
        {isLoss ? (
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-[#F87171] uppercase tracking-widest leading-none">RUGI</p>
            <p className="text-[18px] font-display font-bold text-[#F87171] tabular-nums leading-none mt-1">
              −{formatIDR(Math.abs(netProfit))}
            </p>
            <p className="text-xs text-[#f5a0a0] mt-1 italic leading-none font-medium">Harga jual lebih rendah dari modal</p>
          </div>
        ) : sale.payment_status === 'lunas' ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#10B981] tracking-widest leading-none">TOTAL DIBAYAR</p>
            <p className="text-[18px] font-display font-bold text-[#10B981] leading-none mt-1 tabular-nums">
              {formatIDR(totalRevenue)}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#F87171] tracking-widest leading-none">SISA HUTANG</p>
            <p className="text-[18px] font-display font-bold text-[#F87171] tabular-nums leading-none mt-1">
              {formatIDR(remainingDebt)}
            </p>
          </div>
        )}
      </div>

      <div className="text-right">
        <p className={cn(
          "text-[10px] font-black uppercase tracking-widest leading-none",
          isLoss ? "text-[#F59E0B]" : "text-[#4B6478]"
        )}>
          {isInProgress ? "EST. PROFIT" : isLoss ? "NET PROFIT" : "NET PROFIT"}
        </p>
        <p className={cn(
          "font-display font-bold tabular-nums leading-none mt-1.5 transition-colors text-[18px]",
          isInProgress ? "text-[#94A3B8]" : isLoss ? "text-[#F87171]" : "text-[#10B981]"
        )}>
          {isInProgress ? "~" : isLoss ? "−" : "+"}{formatIDR(Math.abs(netProfit))}
        </p>
      </div>
    </>
  )

  return (
    <BrokerBaseCard 
      onClick={() => onOpenAuditSheet(sale.id)}
      isLoss={isLoss}
      header={header}
      footer={footer}
    >
      <div className="grid grid-cols-[1fr_1fr_1.6fr] gap-4">
        {/* Kolom 1: PEMBELIAN */}
        <div className="space-y-2 text-left border-r border-white/8 pr-4 min-w-0">
          <p className={cn("font-black text-[#4B6478] uppercase tracking-widest", isDesktop ? "text-[10px]" : "text-xs")}>Pembelian</p>
          <p className="font-display text-[22px] font-bold text-[#F1F5F9] tabular-nums leading-none">
            {formatWeight(sale.purchases?.total_weight_kg).replace(' kg', '')} <span className="text-xs font-normal text-[#94A3B8] ml-0.5">kg</span>
          </p>
          <div className="space-y-1">
            <p className={cn("font-medium text-[#94A3B8]", isDesktop ? "text-[11px]" : "text-xs")}>
              {formatEkor(sale.purchases?.quantity)} · {formatIDR(sale.purchases?.price_per_kg)}/kg
            </p>
            <p className={cn("font-medium text-[#4B6478]", isDesktop ? "text-[11px]" : "text-xs")}>Modal: {formatIDR(totalModal)}</p>
          </div>
        </div>

        {/* Kolom 2: PENJUALAN */}
        <div className="space-y-2 text-left border-r border-white/8 pr-4 min-w-0">
          <p className={cn("font-black text-[#4B6478] uppercase tracking-widest", isDesktop ? "text-[10px]" : "text-xs")}>Penjualan</p>
          <p className="font-display text-[22px] font-bold text-[#F1F5F9] tabular-nums leading-none">
            {formatWeight(totalWeightJual).replace(' kg', '')} <span className="text-xs font-normal text-[#94A3B8] ml-0.5">kg</span>
          </p>
          <div className="space-y-1">
            <p className={cn("font-medium text-[#94A3B8]", isDesktop ? "text-[11px]" : "text-xs")}>
              {formatEkor(sale.quantity)} · {formatIDR(sale.price_per_kg)}/kg
            </p>
            <p className={cn("font-medium text-[#4B6478]", isDesktop ? "text-[11px]" : "text-xs")}>Pendapatan: {formatIDR(totalRevenue)}</p>
          </div>
        </div>

        {/* Kolom 3: PENGIRIMAN */}
        <div className="space-y-3 text-left min-w-0">
          <p className={cn("font-black text-[#4B6478] uppercase tracking-widest", isDesktop ? "text-[10px]" : "text-xs")}>Pengiriman</p>
          
          <div className="grid grid-cols-1 gap-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-bold text-[#4B6478] leading-none uppercase tracking-wider">Susut berat</p>
                {!isInProgress && <span className="text-[10px] text-[#4B6478] font-medium leading-none">(tercermin di pendapatan)</span>}
              </div>
              <p className={cn("text-[13px] font-black tabular-nums leading-none", isInProgress ? "text-[#4B6478]" : "text-[#F59E0B]")}>
                {isInProgress ? "—" : `${formatWeight(susutWeight)}`}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#4B6478] leading-none">Biaya kirim</p>
              <p className="text-[13px] font-semibold text-[#F1F5F9] tabular-nums leading-none">
                {formatIDR(deliveryCost)}
              </p>
            </div>

            <div className="col-span-1 border-t border-white/5 my-1" />

            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#4B6478] uppercase leading-none">Kendaraan</p>
              <div className="space-y-0.5">
                <p className="text-[13px] font-semibold text-[#F1F5F9] leading-none uppercase truncate">
                  {delivery?.vehicle_plate || '—'}
                </p>
                <p className="text-[11px] font-medium text-[#94A3B8] leading-none uppercase truncate">
                  {delivery?.vehicles?.brand ?? (delivery?.vehicle_type ? (delivery.vehicle_type.charAt(0).toUpperCase() + delivery.vehicle_type.slice(1)) : '—')}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#4B6478] uppercase leading-none">Sopir</p>
              <p className={cn("font-semibold text-[#F1F5F9] leading-none truncate", isDesktop ? "text-[11px]" : "text-[13px]")}>
                {delivery?.driver_name || '—'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#4B6478] uppercase leading-none">Jam Muat</p>
                <p className="text-[11px] font-black text-amber-400 leading-none tabular-nums">
                  {delivery?.load_time ? new Date(delivery.load_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#4B6478] uppercase leading-none">Berangkat</p>
                <p className="text-[11px] font-black text-blue-400 leading-none tabular-nums">
                  {delivery?.departure_time ? new Date(delivery.departure_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrokerBaseCard>
  )
}
