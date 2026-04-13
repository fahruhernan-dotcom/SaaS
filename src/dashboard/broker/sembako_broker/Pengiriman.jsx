import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { SembakoMobileBar } from './components/SembakoNavigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Truck, User, MapPin, Package,
  CheckCircle2, Check, Clock, Navigation,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  useSembakoSalesPendingDelivery, useSembakoDeliveries,
  useSembakoEmployees, useSembakoCustomers,
  useCreateSembakoDelivery, useCompleteSembakoDelivery,
  useStartSembakoDelivery,
} from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { Button } from '@/components/ui/button'
import {
  C, sInput, sLabel, sBtn, fmtDate, EmptyBox, CustomSelect,
} from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'



const FILTER_TABS = [
  { id: '',          label: 'Semua' },
  { id: 'pending',   label: 'Menunggu' },
  { id: 'on_route',  label: 'Dalam Perjalanan' },
  { id: 'delivered', label: 'Selesai' },
]

// ── Sale Pending Card ─────────────────────────────────────────────────────────
function SalePendingCard({ sale, onBuatDelivery }) {
  const customer = sale.sembako_customers || {}
  const custName = customer.customer_name || sale.customer_name || 'Umum'
  const items = sale.sembako_sale_items || []
  const itemSummary = items.length > 0
    ? (items.length > 1 ? `${items[0].product_name} +${items.length - 1} lainnya` : items[0].product_name)
    : '-'
  const hasPartial = (sale.sembako_deliveries || []).length > 0

  return (
    <div style={{
      background: C.card, borderRadius: '16px', border: `1px solid ${C.borderAm}`,
      padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: C.text, margin: 0 }}>{custName}</p>
          <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
            {sale.invoice_number} · {fmtDate(sale.transaction_date)}
          </p>
        </div>
        <span style={{
          background: hasPartial ? 'rgba(96,165,250,0.12)' : 'rgba(245,158,11,0.12)',
          color: hasPartial ? C.blue : C.amber,
          fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '5px',
          letterSpacing: '0.05em', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '8px',
        }}>
          {hasPartial ? 'SEBAGIAN' : 'BELUM DIKIRIM'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <p style={{ ...sLabel, marginBottom: '2px' }}>Produk</p>
          <p style={{ fontSize: '12px', color: C.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemSummary}</p>
        </div>
        <div>
          <p style={{ ...sLabel, marginBottom: '2px' }}>Total</p>
          <p style={{ fontSize: '12px', color: C.accent, fontWeight: 800 }}>{formatIDR(sale.total_amount)}</p>
        </div>
      </div>

      {customer.address && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <MapPin size={11} color={C.muted} />
          <p style={{ fontSize: '11px', color: C.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.address}</p>
        </div>
      )}

      <button
        onClick={onBuatDelivery}
        style={{ ...sBtn(true), width: '100%', padding: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <Truck size={13} /> Buat Pengiriman
      </button>
    </div>
  )
}

// ── TIMELINE ─────────────────────────────────────────────────────────────────
function SembakoTimeline({ status }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const steps = [
        { key: 'pending', label: 'Disiapkan', icon: Package },
        { key: 'on_route', label: 'Di Jalan', icon: Truck },
        { key: 'delivered', label: 'Selesai', icon: CheckCircle2 }
    ]

    const statusIdxMap = { pending: 0, on_route: 1, delivered: 2 }
    const activeIdx = statusIdxMap[status] ?? 0

    const trackRef = React.useRef(null)
    const [truckLeft, setTruckLeft] = useState(-6)
    const [isMoving, setIsMoving] = useState(false)

    useEffect(() => {
        const updatePosition = () => {
            const trackWidth = trackRef.current?.offsetWidth ?? 0
            const truckWidth = 54
            const positions = {
                pending: -6,
                on_route: trackWidth / 2 - truckWidth / 2,
                delivered: trackWidth - truckWidth / 2 + 6
            }
            setTruckLeft(positions[status] ?? -6)
            setIsMoving(true)
            const bounceTimer = setTimeout(() => setIsMoving(false), 500)
            return () => clearTimeout(bounceTimer)
        }

        const timer = setTimeout(updatePosition, 100)
        window.addEventListener('resize', updatePosition)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', updatePosition)
        }
    }, [status])

    return (
        <div className="relative pt-6">
            <style>{`
                .moving-bounce { animation: truckBounce 0.5s ease; }
                @keyframes truckBounce {
                    0%, 100% { transform: translateY(0); }
                    35%  { transform: translateY(-1px); }
                    70%  { transform: translateY(0.5px); }
                }
                .puff {
                    position: absolute; top: 8px; right: 8px;
                    width: 8px; height: 8px; border-radius: 50%;
                    background: rgba(200,230,210,0.5); opacity: 0;
                    animation: floatUp infinite;
                }
                @keyframes floatUp {
                    0%   { opacity: 0; transform: translate(0, 0) scale(0.4); }
                    15%  { opacity: 0.7; }
                    60%  { opacity: 0.3; }
                    100% { opacity: 0; transform: translate(6px, -30px) scale(2); }
                }
            `}</style>
            
            <div className="absolute top-[34px] left-[10%] right-[10%] z-20">
                <div 
                    style={{ 
                        position: 'absolute', top: '-34px', left: `${truckLeft}px`,
                        width: '54px', height: '54px',
                        transition: 'left 0.9s cubic-bezier(0.34, 1.3, 0.64, 1)', pointerEvents: 'none'
                    }}
                >
                    <div className={isMoving ? 'moving-bounce' : ''}>
                        <svg width="54" height="54" viewBox="0 0 128 128" style={{ transform: 'scaleX(-1)', display: 'block' }}>
                            <path d="M57.99 53.73s-.53-1.53-1.68-2.06c-1.14-.53-3.05-.61-3.05-.61l-3.2 37.85l2.6 18.68s.76 2.21 2.75 2.29c1.98.08 18.47 0 19.92 0c1.45 0 1.91-1.91 1.98-2.75c.08-.84.05-2.25.05-2.25l7.04-.03s.41 3-.27 4.89c-.59 1.64-1.12 2.95-1.11 3.51c.01.8 1.07 1.6 2.29 1.53c1.22-.08 3.05-1.68 4.27-2.67c1.22-.99 20.78-.76 20.78-.76s.94 1.74 1.99 2.79c.63.63 1.65.94 2.57.94c.92 0 2.06-1.22 1.83-2.06c-.23-.84-1.27-2.77-1.45-4.65c-.08-.85.02-3.22.44-3.61c.1-.09 1.62-.04 3.04-.19c2.42-.25 4.84-3.38 5.14-5.82c.31-2.44.08-10.15.08-10.15L57.99 53.73z" fill="#0ea5e9"/>
                            <path d="M52.02 96.11h72.03s.17 2.02-.18 3.32a5.612 5.612 0 0 1-.93 1.91l-70.51-.01l-.41-5.22z" fill="#0369a1"/>
                            <path d="M26.75 92.84L11.5 97.56l-7.62-2.63s.27-14.34.36-15.79c.09-1.45.45-2.72 1.82-3.63c1.36-.91 5.17-3.18 5.17-3.18s11.71-18.79 12.71-20.15c1-1.36 2.23-3.02 5.14-3.29s20.87-.05 22.5.04c1.63.09 2.85.83 2.85 4.37s-.09 30.56-.18 31.92c-.09 1.36-6.9 6.35-6.9 6.35l-20.6 1.27z" fill="#38bdf8"/>
                            <path d="M48.95 110.03s1.46.04 2.47-.1s2.53-1.15 2.6-3.54c.04-1.42.23-21.17.23-21.17l-27.2.06l-8.8 9.63l-14.37.02s-.06 5.65-.02 7.16c.04 1.52 7.86 4.83 7.86 4.83l37.23 3.11z" fill="#0284c7"/>
                            <path d="M3.86 102.09h16.38s3.51-7 13.6-6.88c14.82.18 15.12 14.81 15.12 14.81h-38.6c-2.17 0-5.27-.72-6.06-3.46c-.67-2.3-.44-4.47-.44-4.47z" fill="#0ea5e9"/>
                            <path d="M13.89 76.26s0-1.63-1.07-1.69s-2.25.61-3.32 1.52c-1.13.96-1.69 1.83-1.91 2.59c-.34 1.13-.06 2.14 1.69 2.19c2.14.07 36.12-.15 37.69-.28c1.97-.17 3.15-1.01 3.09-2.48c-.05-1.41-1.07-1.86-5.29-1.91s-30.88.06-30.88.06z" fill="#e0f2fe"/>
                            <path d="M4.2 81.03s10.21-.32 10.43-.07c.31.37.37 5.19.26 5.92c-.11.73-1.07 1.24-2.25 1.29s-8.61.17-8.61.17l.17-7.31z" fill="#bae6fd"/>
                            <path d="M46.24 74.51c1.58 0 2.14-1.8 2.14-3.04V55.78c0-1.24-.79-1.91-3.26-2.03c-2.48-.11-13.78.02-15.02.06c-1.91.06-3.21.9-4.95 3.32c-1.13 1.57-8.1 13.11-8.66 14.06c-.56.96-1.24 3.49 1.69 3.54c3.03.06 28.06-.22 28.06-.22z" fill="#0369a1"/>
                            <path d="M19.63 71.87h25.2c.51 0 .96-.56.96-1.24s.04-11.3.06-11.93c.06-1.74-1.24-2.14-2.36-2.08c-1.13.06-12.51.02-13.18.05c-1.29.06-2.57 1.79-3.69 3.5c-1.35 2.07-6.99 11.7-6.99 11.7z" fill="#7dd3fc"/>
                            <path d="M20.02 73.73c.11 2.53 4.16 4.61 5.18 4.67c1.01.06 1.63-1.91 1.74-4.56S25.99 69 25.14 69c-.84 0-5.21 2.59-5.12 4.73z" fill="#0ea5e9"/>
                            <path d="M20.9 111.62c.08 5 4.06 12.19 12.72 12.24c8.66.05 13.16-6.59 12.88-13.4c-.28-6.92-5.65-11.81-13.38-11.59c-7.23.22-12.33 5.84-12.22 12.75z" fill="#0c4a6e"/>
                            <path d="M27.09 111.33c.04 2.63 2.13 6.43 6.69 6.46s6.76-3.27 6.62-6.86c-.15-3.65-3.06-6.37-6.88-6.31c-3.8.05-6.48 3.06-6.43 6.71z" fill="#7dd3fc"/>
                            <path d="M86.9 111.62c.08 5 4.06 12.19 12.72 12.24c8.66.05 13.16-6.59 12.88-13.4c-.28-6.92-5.65-11.81-13.38-11.59c-7.23.22-12.33 5.84-12.22 12.75z" fill="#0c4a6e"/>
                            <path d="M93.09 111.33c.04 2.63 2.13 6.43 6.69 6.46c4.55.03 6.76-3.27 6.62-6.86c-.15-3.65-3.06-6.37-6.88-6.31c-3.8.05-6.48 3.06-6.43 6.71z" fill="#7dd3fc"/>
                            <path d="M56.87 28.62c0-2.62 1.15-3.67 3.25-3.56c2.1.1 59.65-.21 61.53-.21s2.62 1.99 2.62 3.14c0 1.15-.36 59.49-.28 60.62c.07 1.13-.24 2.7-2.23 2.91s-61.01.1-62.27 0s-2.83-1.15-2.83-2.62c0-1.48.21-58.92.21-60.28z" fill="#0369a1"/>
                            <path d="M62.11 30.92c0 1.36-.42 52.31-.42 53.57c0 1.26.63 2.73 2.31 2.73c1.68 0 53.25.1 54.3 0c1.05-.1 1.68-.73 1.78-2.41c.1-1.68.1-52.83.1-54.51c0-1.68-1.68-1.78-3.46-1.78s-52.2.1-52.94.21c-.73.09-1.67.83-1.67 2.19z" fill="#38bdf8"/>
                            <path d="M74.45 89c-.06-18.45-.19-61.48.02-62.65l1.48.27l1.49.18c-.14 1.65-.07 38.09.01 62.19l-3 .01z" fill="#0ea5e9"/>
                            <path fill="#0ea5e9" d="M89.75 26.52h3V89.1h-3z"/>
                            <path fill="#0ea5e9" d="M104.89 26.57h3v62.27h-3z"/>
                            <circle cx="8" cy="78" r="3.5" fill="#FEF08A" opacity="0.8"/>
                            <circle cx="8" cy="78" r="7" fill="#FEF08A" opacity="0.12"/>
                        </svg>
                    </div>

                    <div className="puff" style={{ animationDelay: '0s', animationDuration: '1.8s' }} />
                    <div className="puff" style={{ animationDelay: '0.6s', animationDuration: '2.2s' }} />
                    <div className="puff" style={{ animationDelay: '1.2s', animationDuration: '1.6s' }} />
                </div>
            </div>

            <div 
                ref={trackRef}
                className="absolute top-[34px] left-[10%] right-[10%] h-[2px] bg-white/10 rounded-full overflow-hidden"
            >
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(Math.max(0, activeIdx) / 2) * 100}%` }}
                    className="h-full bg-blue-500"
                />
            </div>
            <div className="relative flex justify-between">
                {steps.map((step, idx) => {
                    const isDone = idx <= activeIdx
                    const isNext = idx === activeIdx + 1
                    const isFocus = idx === activeIdx
                    
                    return (
                        <div key={step.key} className="flex flex-col items-center gap-3 relative z-10 w-1/3">
                            <div className={cn(
                                "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center bg-[#111C24]",
                                isDone ? "border-blue-500 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : 
                                isNext ? "border-blue-500/50" : "border-white/10"
                            )}>
                                {isDone && <Check size={isDesktop ? 8 : 10} strokeWidth={4} className="text-[#111C24]" />}
                                {isFocus && status === 'on_route' && (
                                     <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                                     </span>
                                )}
                            </div>
                            <div className="text-center space-y-1">
                                <p className={cn(
                                    "font-black uppercase tracking-widest",
                                    isDesktop ? "text-[8px]" : "text-[10px]",
                                    isFocus && status === 'on_route' ? "text-white" : isDone ? "text-blue-400" : "text-[#4B6478]"
                                )}>{step.label}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── Delivery Card ─────────────────────────────────────────────────────────────
function DeliveryCard({ delivery, onStart, onComplete }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    
    const statusMeta = {
        pending:   { label: 'Disiapkan', bg: 'rgba(255,255,255,0.06)', color: '#94A3B8' },
        on_route:  { label: 'Di Jalan',  bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA', pulse: true },
        delivered: { label: 'Selesai',   bg: 'rgba(52,211,153,0.12)',  color: '#34D399' }
    }

    const meta = statusMeta[delivery.status] || statusMeta.pending
    
    const sale = delivery.sembako_sales
    const emp = delivery.sembako_employees
    const items = sale?.sembako_sale_items || []
    
    const rpaName = sale?.sembako_customers?.customer_name || sale?.customer_name || delivery.delivery_area || 'Tujuan Umum'
    const farmName = 'Gudang Utama'
    
    const itemSummary = items.length > 0 
      ? (items.length > 1 ? `${items[0].product_name} +${items.length - 1} lainnya` : items[0].product_name) 
      : '-'

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className={cn("bg-[#111C24] border-white/5 overflow-hidden shadow-xl hover:border-white/10 transition-all", isDesktop ? "rounded-[28px]" : "rounded-[22px]")}>
                <CardContent className="p-0">
                    <div className={cn("flex justify-between items-start", isDesktop ? "p-6 pb-4" : "p-4 pb-3")}>
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                             <div
                                className={cn("px-2.5 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0", isDesktop ? "text-[9px] px-3 py-1.5" : "text-[10px]")}
                                style={{ backgroundColor: meta.bg, color: meta.color }}
                             >
                                 {meta.pulse && (
                                     <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: meta.color }}></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: meta.color }}></span>
                                     </span>
                                 )}
                                 {meta.label}
                             </div>
                             <h4 className={cn("font-display font-black text-white uppercase tracking-tight truncate", isDesktop ? "text-sm max-w-[150px]" : "text-[13px]")}>{rpaName}</h4>
                        </div>
                        <span className={cn("font-black text-[#4B6478] uppercase tracking-widest shrink-0", isDesktop ? "text-[10px]" : "text-[9px] text-right leading-tight")}>
                            {fmtDate(delivery.delivery_date)}
                        </span>
                    </div>

                    <div className={cn("bg-white/[0.02] flex items-center gap-3", isDesktop ? "px-6 py-4" : "px-4 py-3")}>
                         <div className="flex-1 min-w-0">
                             <p className={cn("font-black text-[#4B6478] uppercase tracking-widest mb-1", isDesktop ? "text-[10px]" : "text-[9px]")}>Dari lokasi</p>
                             <p className={cn("font-black text-[#94A3B8] truncate", isDesktop ? "text-xs" : "text-[11px]")}>{farmName}</p>
                         </div>
                         <div className={cn("rounded-full border border-white/5 bg-secondary/10 flex items-center justify-center text-blue-500/40 shrink-0", isDesktop ? "w-10 h-10" : "w-7 h-7")}>
                             <Truck size={isDesktop ? 18 : 14} strokeWidth={2.5} />
                         </div>
                         <div className="flex-1 min-w-0 text-right">
                             <p className={cn("font-black text-[#4B6478] uppercase tracking-widest mb-1", isDesktop ? "text-[10px]" : "text-[9px]")}>Ke Customer</p>
                             <p className={cn("font-black text-[#F1F5F9] truncate", isDesktop ? "text-xs" : "text-[11px]")}>{rpaName}</p>
                         </div>
                    </div>

                    <div className={cn("grid grid-cols-3", isDesktop ? "p-6 gap-6" : "p-4 gap-3")}>
                         <div className="space-y-1 md:space-y-1.5">
                             <div className="flex items-center gap-1.5 text-[#4B6478]">
                                 <Truck size={12} strokeWidth={2.5} />
                                 <span className={cn("font-black uppercase tracking-widest", isDesktop ? "text-[9px]" : "text-[10px]")}>Kendaraan</span>
                             </div>
                             <div className="flex flex-col items-start w-full min-w-0">
                                 <span className={cn("font-black text-white uppercase tracking-tight truncate w-full block", isDesktop ? "text-[11px]" : "text-[11px]")}>{delivery.vehicle_type ? `${delivery.vehicle_type} ${delivery.vehicle_plate || ''}`.trim() : '—'}</span>
                             </div>
                         </div>
                         <div className="space-y-1 md:space-y-1.5">
                             <div className="flex items-center gap-1.5 text-[#4B6478]">
                                 <User size={12} strokeWidth={2.5} />
                                 <span className={cn("font-black uppercase tracking-widest", isDesktop ? "text-[9px]" : "text-[10px]")}>Sopir</span>
                             </div>
                             <div className="flex flex-col items-start w-full min-w-0">
                                 <span className={cn("font-black text-white uppercase tracking-tight truncate w-full block", isDesktop ? "text-[11px]" : "text-[11px]")}>{emp?.full_name || delivery.driver_name || '—'}</span>
                             </div>
                         </div>
                         <div className="space-y-1 md:space-y-1.5">
                             <div className="flex items-center gap-1.5 text-[#4B6478]">
                                 <Package size={12} strokeWidth={2.5} />
                                 <span className={cn("font-black uppercase tracking-widest", isDesktop ? "text-[9px]" : "text-[10px]")}>Muatan</span>
                             </div>
                             <div className={cn("font-black text-white uppercase tracking-tight truncate", isDesktop ? "text-[11px]" : "text-[11px]")}>{itemSummary}</div>
                         </div>
                    </div>

                    <div className={cn("mt-1", isDesktop ? "px-6 pb-6" : "px-4 pb-4")}>
                         <SembakoTimeline status={delivery.status} />
                    </div>

                    <div className="p-3 bg-white/[0.03] border-t border-white/5 flex gap-2">
                         {delivery.status === 'pending' ? (
                             <Button
                                 onClick={() => onStart(delivery.id)}
                                 className={cn("flex-1 text-blue-400 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 font-black uppercase tracking-widest rounded-xl gap-2", isDesktop ? "h-12 text-[11px]" : "h-10 text-[11px]")}
                             >
                                 <Truck size={15} /> Mulai Perjalanan
                             </Button>
                         ) : delivery.status === 'on_route' ? (
                             <Button
                                 onClick={() => onComplete(delivery.id)}
                                 className={cn("flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl gap-2", isDesktop ? "h-12 text-[11px]" : "h-10 text-[11px]")}
                             >
                                 <CheckCircle2 size={15} /> Selesaikan
                             </Button>
                         ) : (
                             <Button
                                 variant="ghost"
                                 disabled
                                 className={cn("flex-1 h-9 opacity-50 text-[#4B6478] font-black uppercase tracking-widest", isDesktop ? "text-[10px]" : "text-[10px]")}
                             >
                                 Selesai
                             </Button>
                         )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

// ── TambahTripSheet ───────────────────────────────────────────────────────────
const BLANK_FORM = {
  sale_id: null,
  employee_id: null,
  vehicle_type: '',
  vehicle_plate: '',
  delivery_area: '',
  delivery_date: new Date().toISOString().slice(0, 10),
  delivery_cost: 0,
  notes: '',
}

function TambahTripSheet({ open, onClose, prefillSale, salesPending, employees, customers }) {
  const createDelivery = useCreateSembakoDelivery()
  const isLinkedMode = !!prefillSale
  const [destinationMode, setDestinationMode] = useState('customer')
  const [linkSale, setLinkSale] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)

  React.useEffect(() => {
    if (open) {
      if (prefillSale) {
        const customer = prefillSale.sembako_customers || {}
        setForm({
          ...BLANK_FORM,
          sale_id: prefillSale.id,
          delivery_area: customer.address || '',
          delivery_date: new Date().toISOString().slice(0, 10),
        })
      } else {
        setForm(BLANK_FORM)
        setLinkSale(false)
        setDestinationMode('customer')
      }
    }
  }, [open, prefillSale])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const employeeOptions = [
    { value: '', label: '— Tanpa sopir / ambil sendiri —' },
    ...employees.filter(e => e.status === 'aktif' && !e.is_deleted).map(e => ({
      value: e.id, label: `${e.full_name} (${e.role})`,
    })),
  ]
  const saleOptions = salesPending.map(s => ({
    value: s.id,
    label: `${s.invoice_number} — ${s.sembako_customers?.customer_name || s.customer_name || 'Umum'}`,
  }))
  const customerOptions = [
    { value: '', label: '— Pilih customer —' },
    ...customers.map(c => ({ value: c.id, label: `${c.customer_name} (${c.address || '-'})` })),
  ]

  async function handleSubmit() {
    const payload = {
      sale_id: isLinkedMode
        ? prefillSale.id
        : (linkSale && form.sale_id ? form.sale_id : null),
      employee_id: form.employee_id || null,
      vehicle_type: form.vehicle_type || null,
      vehicle_plate: form.vehicle_plate || null,
      delivery_area: form.delivery_area || null,
      delivery_date: form.delivery_date,
      delivery_cost: form.delivery_cost || 0,
      notes: form.notes || null,
      status: 'pending',
    }
    try {
      await createDelivery.mutateAsync(payload)
      onClose()
    } catch { /* error handled by hook */ }
  }

  const linkedCustomer = prefillSale?.sembako_customers || {}
  const linkedItems = prefillSale?.sembako_sale_items || []

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        style={{
          background: C.bg, borderLeft: `1px solid ${C.border}`,
          maxWidth: '420px', width: '100%', padding: '24px', overflowY: 'auto',
        }}
      >
        <SheetHeader>
          <SheetTitle style={{ color: C.text, fontWeight: 900, fontSize: '18px' }}>
            {isLinkedMode ? 'Buat Pengiriman' : 'Tambah Trip'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Form pengiriman sembako
          </SheetDescription>
        </SheetHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px', paddingBottom: '80px' }}>

          {/* MODE A: Linked ke sale */}
          {isLinkedMode && (
            <>
              <div style={{ background: 'rgba(234,88,12,0.06)', borderRadius: '12px', padding: '12px', border: `1px solid ${C.border}` }}>
                <p style={sLabel}>Invoice Terkait</p>
                <p style={{ fontSize: '14px', fontWeight: 800, color: C.accent, margin: 0 }}>
                  {prefillSale.invoice_number}
                </p>
                <p style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
                  {prefillSale.sembako_customers?.customer_name || prefillSale.customer_name}
                </p>
              </div>

              {linkedItems.length > 0 && (
                <div>
                  <p style={sLabel}>Produk yang Dikirim</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {linkedItems.map((item, i) => (
                      <p key={i} style={{ fontSize: '12px', color: C.text, margin: 0 }}>
                        • {item.product_name} — {item.quantity} {item.unit}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p style={sLabel}>Tujuan Pengiriman</p>
                <input
                  style={sInput}
                  value={form.delivery_area}
                  onChange={e => set('delivery_area', e.target.value)}
                  placeholder={linkedCustomer.address || 'Alamat tujuan...'}
                />
              </div>
            </>
          )}

          {/* MODE B: Trip independent */}
          {!isLinkedMode && (
            <>
              <div>
                <p style={sLabel}>Tujuan Pengiriman</p>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {['customer', 'manual'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setDestinationMode(mode); set('delivery_area', '') }}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                        cursor: 'pointer', border: 'none',
                        background: destinationMode === mode ? C.accent : 'rgba(255,255,255,0.05)',
                        color: destinationMode === mode ? '#fff' : C.muted,
                        transition: 'all 0.2s',
                      }}
                    >
                      {mode === 'customer' ? 'Dari Customer' : 'Input Manual'}
                    </button>
                  ))}
                </div>
                {destinationMode === 'customer' ? (
                  <CustomSelect
                    value={customers.find(c => c.address === form.delivery_area)?.id || ''}
                    onChange={id => {
                      const c = customers.find(x => x.id === id)
                      set('delivery_area', c?.address || '')
                    }}
                    options={customerOptions}
                    placeholder="Pilih customer..."
                  />
                ) : (
                  <input
                    style={sInput}
                    value={form.delivery_area}
                    onChange={e => set('delivery_area', e.target.value)}
                    placeholder="Masukkan alamat tujuan..."
                  />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <p style={{ ...sLabel, margin: 0 }}>Linked ke Invoice?</p>
                  <button
                    onClick={() => { setLinkSale(v => !v); set('sale_id', null) }}
                    style={{
                      width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                      background: linkSale ? C.accent : 'rgba(255,255,255,0.1)',
                      position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: '3px',
                      left: linkSale ? '20px' : '3px',
                      width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
                {linkSale && (
                  <CustomSelect
                    value={form.sale_id || ''}
                    onChange={val => set('sale_id', val || null)}
                    options={[{ value: '', label: '— Tanpa invoice —' }, ...saleOptions]}
                    placeholder="Pilih invoice..."
                  />
                )}
              </div>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <p style={sLabel}>Jenis Kendaraan</p>
              <input
                style={sInput}
                value={form.vehicle_type}
                onChange={e => set('vehicle_type', e.target.value)}
                placeholder="mis. L300"
              />
            </div>
            <div>
              <p style={sLabel}>Plat Nomor</p>
              <input
                value={form.vehicle_plate}
                onChange={e => set('vehicle_plate', e.target.value)}
                placeholder="mis. B 1234 CD"
                style={{ ...sInput, textTransform: 'uppercase' }}
              />
            </div>
          </div>

          <div>
            <p style={sLabel}>Sopir / Kurir</p>
            <CustomSelect
              value={form.employee_id || ''}
              onChange={val => set('employee_id', val || null)}
              options={employeeOptions}
              placeholder="— Tanpa sopir —"
            />
          </div>

          <div>
            <p style={sLabel}>Tanggal Berangkat</p>
            <DatePicker
              value={form.delivery_date}
              onChange={val => set('delivery_date', val)}
              placeholder="Pilih tanggal"
            />
          </div>

          <div>
            <p style={sLabel}>Biaya Pengiriman (opsional)</p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: '13px', pointerEvents: 'none' }}>Rp</span>
              <input
                type="number"
                style={{ ...sInput, paddingLeft: '32px' }}
                value={form.delivery_cost || ''}
                onChange={e => set('delivery_cost', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <p style={sLabel}>Catatan (opsional)</p>
            <textarea
              rows={2}
              style={{ ...sInput, resize: 'vertical', minHeight: '72px' }}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Instruksi khusus, dll..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={createDelivery.isPending || !form.delivery_date}
            style={{
              ...sBtn(true), width: '100%', padding: '14px', fontSize: '14px',
              opacity: (createDelivery.isPending || !form.delivery_date) ? 0.6 : 1,
            }}
          >
            {createDelivery.isPending ? 'Menyimpan...' : 'Simpan Trip'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function SembakoPengiriman() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen } = useOutletContext()
  const location = useLocation()
  const navigate = useNavigate()

  const { data: deliveries = [], isLoading: loadingDeliveries } = useSembakoDeliveries()
  const { data: salesPending = [], isLoading: loadingSales } = useSembakoSalesPendingDelivery()
  const { data: employees = [] } = useSembakoEmployees()
  const { data: customers = [] } = useSembakoCustomers()
  const completeDelivery = useCompleteSembakoDelivery()
  const startDelivery = useStartSembakoDelivery()

  const [filterTab, setFilterTab] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [prefillSale, setPrefillSale] = useState(null)

  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    const saleId = params.get('saleId')
    if (saleId && salesPending.length > 0) {
      const sale = salesPending.find(s => s.id === saleId)
      if (sale) {
        setPrefillSale(sale)
        setSheetOpen(true)
        navigate(location.pathname, { replace: true })
      }
    }
  }, [location.search, salesPending, navigate, location.pathname])

  const filteredDeliveries = useMemo(() => {
    if (!filterTab) return deliveries
    return deliveries.filter(d => d.status === filterTab)
  }, [deliveries, filterTab])

  const activeCount = deliveries.filter(d => d.status !== 'delivered').length

  function openForSale(sale) { setPrefillSale(sale); setSheetOpen(true) }
  function openIndependent() { setPrefillSale(null); setSheetOpen(true) }
  function closeSheet() { setSheetOpen(false); setPrefillSale(null) }

  async function handleComplete(deliveryId) {
    try {
      await completeDelivery.mutateAsync(deliveryId)
    } catch { /* error handled by hook */ }
  }

  async function handleStart(deliveryId) {
    try {
      await startDelivery.mutateAsync(deliveryId)
    } catch { /* error handled by hook */ }
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: '96px' }}>
      {!isDesktop && <SembakoMobileBar onHamburger={() => setSidebarOpen(true)} title="Pengiriman" />}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <SembakoPageHeader
          title={isDesktop ? "Pengiriman & Trip" : ""}
          subtitle={isDesktop ? `${activeCount} pengiriman aktif` : ""}
          isDesktop={isDesktop}
          filters={FILTER_TABS}
          activeFilter={filterTab}
          onFilterChange={setFilterTab}
          actionButton={
            <Button
              type="button"
              onClick={openIndependent}
              className="h-10 rounded-xl bg-[#EA580C] px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-950/20"
            >
              <Plus size={15} className="mr-1" /> Tambah Trip
            </Button>
          }
        />

        <div style={{ padding: isDesktop ? '24px 40px' : '20px 16px' }}>
          {/* Sales Perlu Dikirim */}
          {!loadingSales && salesPending.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <p style={{ ...sLabel, fontSize: '11px', marginBottom: '12px', color: C.amber }}>
                Sales Perlu Dikirim ({salesPending.length})
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isDesktop ? 'repeat(2,1fr)' : '1fr',
                gap: '10px',
              }}>
                {salesPending.map(sale => (
                  <SalePendingCard
                    key={sale.id}
                    sale={sale}
                    onBuatDelivery={() => openForSale(sale)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Delivery list */}
          {loadingDeliveries ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '90px', borderRadius: '16px', background: C.card, opacity: 0.5 }} />
              ))}
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <EmptyBox icon={Truck} text="Belum ada pengiriman di kategori ini" />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(2,1fr)' : '1fr',
              gap: '10px',
            }}>
              {filteredDeliveries.map(d => (
                <DeliveryCard key={d.id} delivery={d} onStart={handleStart} onComplete={handleComplete} />
              ))}
            </div>
          )}
        </div>
      </div>

      <TambahTripSheet
        open={sheetOpen}
        onClose={closeSheet}
        prefillSale={prefillSale}
        salesPending={salesPending}
        employees={employees}
        customers={customers}
      />
    </div>
  )
}
