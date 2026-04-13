import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { formatIDR, formatIDRShort } from '@/lib/format'
import { BrokerBaseCard } from '@/dashboard/_shared/components/transactions/BrokerBaseCard'

function getDeliveryBadge(deliveries) {
  if (!deliveries || deliveries.length === 0) {
    return { label: 'Belum Dikirim', color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', icon: '📦' }
  }
  const allDelivered = deliveries.every(d => d.status === 'delivered')
  const anyInTransit = deliveries.some(d => d.status === 'in_transit')
  const anyDelivered = deliveries.some(d => d.status === 'delivered')

  if (allDelivered) {
    return { label: 'Terkirim', color: '#34D399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.20)', icon: '✓' }
  }
  if (anyInTransit || anyDelivered) {
    return { label: 'Di Jalan', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.15)', icon: '🚚' }
  }
  return { label: 'Siap Kirim', color: '#93C5FD', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.15)', icon: '📦' }
}

function fmtDate(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '-'
  }
}

export function SembakoInvoiceCard({ sale, onOpenDetail, onManageDelivery, isDesktop }) {
  const customerName = sale.sembako_customers?.customer_name || sale.customer_name || 'Umum'
  const items = Array.isArray(sale.sembako_sale_items) ? sale.sembako_sale_items : []
  const deliveries = Array.isArray(sale.sembako_deliveries) ? sale.sembako_deliveries : []

  const initialCustomer = customerName.charAt(0).toUpperCase()
  const hasDebt = (sale.remaining_amount || 0) > 0
  const isLunas = sale.payment_status === 'lunas'
  const isSebagian = sale.payment_status === 'sebagian'

  const topItem = items[0]
  const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)

  const deliveryBadge = getDeliveryBadge(deliveries)
  const allDelivered = deliveries.length > 0 && deliveries.every(d => d.status === 'delivered')

  const fmt = isDesktop ? formatIDR : formatIDRShort
  const valSize = isDesktop ? 'text-[18px]' : 'text-[15px]'

  // ── Avatar color by payment state ──
  const avatarCn = isLunas
    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
    : hasDebt
      ? 'bg-red-500/10 border-red-500/40 text-red-500'
      : 'bg-amber-500/10 border-amber-500/40 text-amber-400'

  const paymentBadgeCn = isLunas
    ? 'bg-emerald-500/10 text-emerald-400'
    : isSebagian
      ? 'bg-amber-500/10 text-amber-500'
      : 'bg-red-500/10 text-red-500'

  const paymentLabel = isLunas ? 'LUNAS' : isSebagian ? 'SEBAGIAN' : 'BELUM LUNAS'

  // ── DESKTOP header ──
  const desktopHeader = (
    <>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn('w-[34px] h-[34px] rounded-xl flex items-center justify-center font-black text-lg border-2', avatarCn)}>
          {initialCustomer}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-sm text-[#F1F5F9] leading-none uppercase tracking-tight truncate">
            {customerName}
          </h3>
          <p className="text-xs font-medium text-[#4B6478] mt-1.5 tabular-nums truncate">
            {sale.invoice_number || '-'} · {fmtDate(sale.transaction_date)}
            {sale.due_date ? ` · Tempo: ${fmtDate(sale.due_date)}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge className={cn('rounded-full h-5 px-2 border-none font-black text-[8px] uppercase tracking-wider', paymentBadgeCn)}>
          {paymentLabel}
        </Badge>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 900, padding: '3px 12px', borderRadius: '99px', background: deliveryBadge.bg, border: `1px solid ${deliveryBadge.border}`, color: deliveryBadge.color, textTransform: 'uppercase' }}>
          {deliveryBadge.icon && <span style={{ opacity: 0.7 }}>{deliveryBadge.icon}</span>}
          {deliveryBadge.label}
        </span>
      </div>
    </>
  )

  // ── MOBILE header — 2-row layout ──
  const mobileHeader = (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Row 1: avatar + name + payment badge */}
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center font-black text-base border-2 shrink-0', avatarCn)}>
          {initialCustomer}
        </div>
        <h3 className="font-display font-bold text-[13px] text-[#F1F5F9] leading-none uppercase tracking-tight flex-1 min-w-0 truncate">
          {customerName}
        </h3>
        <Badge className={cn('rounded-full h-[18px] px-2 border-none font-black text-[8px] uppercase tracking-wider shrink-0', paymentBadgeCn)}>
          {isLunas ? 'LUNAS' : isSebagian ? 'SEBAGIAN' : 'BELUM'}
        </Badge>
      </div>
      {/* Row 2: invoice info + delivery badge */}
      <div className="flex items-center justify-between pl-10">
        <p className="text-[10px] font-medium text-[#4B6478] tabular-nums truncate">
          {sale.invoice_number || '-'} · {fmtDate(sale.transaction_date)}
        </p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '9px', fontWeight: 900, padding: '2px 7px', borderRadius: '99px', background: deliveryBadge.bg, border: `1px solid ${deliveryBadge.border}`, color: deliveryBadge.color, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {deliveryBadge.icon && <span style={{ opacity: 0.7 }}>{deliveryBadge.icon}</span>}
          {deliveryBadge.label}
        </span>
      </div>
    </div>
  )

  // ── Footer ──
  const footer = (
    <>
      <div className="text-left">
        {isLunas ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#10B981] tracking-widest leading-none">TOTAL DIBAYAR</p>
            <p className={cn('font-display font-bold text-[#10B981] leading-none mt-1 tabular-nums', valSize)}>
              {fmt(sale.total_amount || 0)}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase font-bold text-[#F87171] tracking-widest leading-none">SISA PIUTANG</p>
              {!allDelivered && (
                <button
                  onClick={(e) => { e.stopPropagation(); onManageDelivery?.() }}
                  className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter active:scale-90 transition-all"
                >
                  Kirim
                </button>
              )}
            </div>
            <p className={cn('font-display font-bold text-[#F87171] tabular-nums leading-none mt-1', valSize)}>
              {fmt(sale.remaining_amount || 0)}
            </p>
          </div>
        )}
      </div>

      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-widest leading-none text-[#4B6478]">TOTAL TAGIHAN</p>
        <p className={cn('font-display font-bold tabular-nums leading-none mt-1.5 text-[#F1F5F9]', valSize)}>
          {fmt(sale.total_amount || 0)}
        </p>
      </div>
    </>
  )

  // ── DESKTOP body — 3 columns ──
  const desktopBody = (
    <div className="grid grid-cols-[1fr_1fr_1.6fr] gap-4">
      {/* Kolom 1: ITEM */}
      <div className="space-y-2 text-left border-r border-white/[0.08] pr-4 min-w-0">
        <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Item</p>
        <p className="font-display text-[22px] font-bold text-[#F1F5F9] tabular-nums leading-none">
          {items.length} <span className="text-xs font-normal text-[#94A3B8] ml-0.5">jenis</span>
        </p>
        <div className="space-y-1">
          {topItem && (
            <p className="text-[11px] font-medium text-[#94A3B8] truncate">{topItem.product_name}</p>
          )}
          <p className="text-[11px] font-medium text-[#4B6478]">Total {totalQty} unit</p>
        </div>
      </div>

      {/* Kolom 2: TAGIHAN */}
      <div className="space-y-2 text-left border-r border-white/[0.08] pr-4 min-w-0">
        <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Tagihan</p>
        <p className="font-display text-[22px] font-bold text-[#F1F5F9] tabular-nums leading-none">
          {formatIDR(sale.total_amount || 0)}
        </p>
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-[#94A3B8]">Dibayar: {formatIDR(sale.paid_amount || 0)}</p>
          {hasDebt && (
            <p className="text-[11px] font-medium text-[#F87171]">Sisa: {formatIDR(sale.remaining_amount || 0)}</p>
          )}
        </div>
      </div>

      {/* Kolom 3: PENGIRIMAN */}
      <div className="space-y-3 text-left min-w-0">
        <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Pengiriman</p>
        <div className="grid grid-cols-1 gap-y-3">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#4B6478] uppercase leading-none">Status Kirim</p>
            <p className="text-[13px] font-black leading-none" style={{ color: deliveryBadge.color }}>
              {deliveryBadge.label}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#4B6478] leading-none">Total Trip</p>
            <p className="text-[13px] font-semibold text-[#F1F5F9] tabular-nums leading-none">
              {deliveries.length > 0 ? deliveries.length : '—'}
            </p>
          </div>
          {!allDelivered && (
            <>
              <div className="border-t border-white/5 my-1" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onManageDelivery?.() }}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#94A3B8] transition-colors hover:border-[#EA580C]/20 hover:text-[#FEF3C7] w-full text-left"
              >
                Atur Pengiriman →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  // ── MOBILE body — compact 3-col ──
  const mobileBody = (
    <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2.5">
      {/* Kolom 1: ITEM */}
      <div className="space-y-1.5 text-left border-r border-white/[0.06] pr-2.5 min-w-0">
        <p className="text-[8px] font-black text-[#4B6478] uppercase tracking-widest">Item</p>
        <p className="font-display text-[17px] font-bold text-[#F1F5F9] tabular-nums leading-none">
          {items.length}<span className="text-[9px] font-normal text-[#94A3B8] ml-0.5">jenis</span>
        </p>
        {topItem && (
          <p className="text-[10px] font-medium text-[#94A3B8] leading-snug truncate">{topItem.product_name}</p>
        )}
        <p className="text-[10px] font-medium text-[#4B6478]">{totalQty} unit</p>
      </div>

      {/* Kolom 2: TAGIHAN */}
      <div className="space-y-1.5 text-left border-r border-white/[0.06] pr-2.5 min-w-0">
        <p className="text-[8px] font-black text-[#4B6478] uppercase tracking-widest">Tagihan</p>
        <p className="font-display text-[17px] font-bold text-[#F1F5F9] tabular-nums leading-none">
          {formatIDRShort(sale.total_amount || 0)}
        </p>
        <p className="text-[10px] font-medium text-[#94A3B8]">Bayar: {formatIDRShort(sale.paid_amount || 0)}</p>
        {hasDebt && (
          <p className="text-[10px] font-medium text-[#F87171]">Sisa: {formatIDRShort(sale.remaining_amount || 0)}</p>
        )}
      </div>

      {/* Kolom 3: KIRIM */}
      <div className="space-y-1.5 text-left min-w-0">
        <p className="text-[8px] font-black text-[#4B6478] uppercase tracking-widest">Kirim</p>
        <p className="text-[11px] font-black leading-none" style={{ color: deliveryBadge.color }}>
          {deliveryBadge.label}
        </p>
        <p className="text-[10px] font-medium text-[#94A3B8]">{deliveries.length} trip</p>
        {!allDelivered && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onManageDelivery?.() }}
            className="mt-0.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[#94A3B8] transition-colors hover:border-[#EA580C]/20 hover:text-[#FEF3C7] w-full text-left"
          >
            Atur →
          </button>
        )}
      </div>
    </div>
  )

  return (
    <BrokerBaseCard
      onClick={onOpenDetail}
      isLoss={false}
      header={isDesktop ? desktopHeader : mobileHeader}
      footer={footer}
      isDesktop={isDesktop}
    >
      {isDesktop ? desktopBody : mobileBody}
    </BrokerBaseCard>
  )
}
