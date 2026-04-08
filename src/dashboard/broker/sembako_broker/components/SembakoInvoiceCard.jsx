import React from 'react'
import { ChevronRight, Clock3, Package, Store, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatIDR } from '@/lib/format'
import { cn } from '@/lib/utils'

function fmtDate(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

export function SembakoInvoiceCard({ sale, onOpenDetail, onManageDelivery }) {
  const customerName = sale.sembako_customers?.customer_name || sale.customer_name || 'Umum'
  const items = Array.isArray(sale.sembako_sale_items) ? sale.sembako_sale_items : []
  const deliveries = Array.isArray(sale.sembako_deliveries) ? sale.sembako_deliveries : []

  const itemSummary = items.length > 0
    ? items.length > 1
      ? `${items[0].product_name} +${items.length - 1} item`
      : items[0].product_name
    : 'Belum ada item'

  const hasDelivered = deliveries.some((delivery) => delivery.status === 'delivered')
  const hasPartial = deliveries.length > 0 && !hasDelivered

  const paymentTone = sale.payment_status === 'lunas'
    ? 'bg-emerald-500/10 text-emerald-400'
    : sale.payment_status === 'sebagian'
      ? 'bg-amber-500/10 text-amber-400'
      : 'bg-red-500/10 text-red-400'

  const deliveryMeta = hasDelivered
    ? { label: 'Sudah Dikirim', tone: 'text-emerald-400 bg-emerald-500/10' }
    : hasPartial
      ? { label: 'Pengiriman Aktif', tone: 'text-sky-400 bg-sky-500/10' }
      : { label: 'Belum Dikirim', tone: 'text-amber-400 bg-amber-500/10' }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={(e) => e.key === 'Enter' && onOpenDetail?.()}
      className={cn(
        'group w-full cursor-pointer overflow-hidden rounded-[28px] border bg-[#111C24] text-left shadow-lg transition-all',
        sale.remaining_amount > 0 ? 'border-red-500/20 hover:border-red-500/30' : 'border-white/5 hover:border-[#EA580C]/20'
      )}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#EA580C]/10 bg-[#EA580C]/10">
            <Store size={22} className="text-[#EA580C]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-lg font-black uppercase tracking-tight text-white">
                  {customerName}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#4B6478]">
                  <span>{sale.invoice_number || '-'}</span>
                  <span className="text-white/10">•</span>
                  <span>{fmtDate(sale.transaction_date)}</span>
                  {sale.due_date && (
                    <>
                      <span className="text-white/10">•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={10} />
                        Jatuh Tempo {fmtDate(sale.due_date)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <Badge className={cn('h-6 border-none px-3 text-[9px] font-black uppercase tracking-wider', paymentTone)}>
                {sale.payment_status || 'belum_lunas'}
              </Badge>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#4B6478]">Ringkasan Item</p>
                <div className="mt-2 flex items-center gap-2">
                  <Package size={14} className="text-[#F59E0B]" />
                  <p className="truncate text-sm font-bold text-white">{itemSummary}</p>
                </div>
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
                  {items.length} item tercatat
                </p>
              </div>

              <div className="rounded-2xl border border-[#EA580C]/10 bg-[#1C1208] p-4 text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#92400E]">Total Tagihan</p>
                <p className="mt-2 font-display text-2xl font-black tracking-tight text-[#FEF3C7]">
                  {formatIDR(sale.total_amount || 0)}
                </p>
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#92400E]">
                  Dibayar {formatIDR(sale.paid_amount || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ChevronRight size={18} className="mt-1 shrink-0 text-[#4B6478] transition-all group-hover:translate-x-1 group-hover:text-[#EA580C]" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 bg-black/10 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider', deliveryMeta.tone)}>
            <span className="inline-flex items-center gap-1.5">
              <Truck size={11} />
              {deliveryMeta.label}
            </span>
          </span>
          {hasPartial && (
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
              {deliveries.length} trip
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {sale.remaining_amount > 0 && (
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-red-400/70">Sisa Piutang</p>
              <p className="font-display text-base font-black text-red-400">
                {formatIDR(sale.remaining_amount)}
              </p>
            </div>
          )}

          {!hasDelivered && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onManageDelivery?.()
              }}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#94A3B8] transition-colors hover:border-[#EA580C]/20 hover:text-[#FEF3C7]"
            >
              Atur Pengiriman
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
