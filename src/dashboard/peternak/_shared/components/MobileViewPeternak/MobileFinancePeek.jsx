import React from 'react'
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'
import { Card, Pill } from '@/dashboard/peternak/_shared/components/MobilePrimitives'

// ─── Finance Calculations ──────────────────────────────────────────────────
function calcFinance({ batches = [], feedLogs = [], operationalCosts = [], sales = [] }) {
  // Total revenue from sales
  const revenue = sales.reduce((sum, s) => {
    const qty = s.quantity_kg || s.total_weight_kg || s.qty_ekor || 0
    const price = s.price_per_kg || s.price || 0
    return sum + (qty * price)
  }, 0)

  // Total feed cost
  const feedCost = feedLogs.reduce((sum, f) => {
    return sum + (f.total_cost || (f.qty_kg || 0) * (f.price_per_kg || 0))
  }, 0)

  // Total operational cost
  const opsCost = operationalCosts.reduce((sum, o) => sum + (o.amount || 0), 0)

  // Total purchase cost from batches
  const purchaseCost = batches.reduce((sum, b) => sum + (b.purchase_cost || b.total_buy_cost || 0), 0)

  const totalCost = feedCost + opsCost + purchaseCost
  const profit = revenue - totalCost

  return { revenue, cost: totalCost, profit }
}

export function MobileFinancePeek({ 
  // Rich props from Beranda
  batches, feedLogs, operationalCosts, sales, onNavigate,
  // Simple props (direct values)
  profit: profitProp, revenue: revenueProp, cost: costProp,
  className = '' 
}) {
  // Derive values from rich props if direct values not provided
  const { revenue, cost, profit } = (profitProp !== undefined)
    ? { revenue: revenueProp, cost: costProp, profit: profitProp }
    : calcFinance({ batches, feedLogs, operationalCosts, sales })

  const profitOk = profit >= 0
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0
  
  const fmtRp = (val) => {
    const abs = Math.abs(val || 0)
    if (abs >= 1_000_000) return `Rp ${(abs / 1_000_000).toFixed(1)}jt`
    if (abs >= 1_000) return `Rp ${(abs / 1_000).toFixed(0)}rb`
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(abs).replace('IDR', 'Rp')
  }

  return (
    <Card className={className} onClick={onNavigate}>
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <div className="text-[11px] text-[#4B6478] font-bold tracking-[0.12em] uppercase mb-1.5">
            Estimasi laba bersih
          </div>
          <div className={`text-[28px] font-black leading-none tracking-tight tabular-nums ${profitOk ? 'text-emerald-400' : 'text-red-400'}`}>
            {profitOk ? '' : '-'}{fmtRp(profit)}
          </div>
        </div>
        <Pill tone={profitOk ? 'ok' : 'danger'}>
          {profitOk ? <ArrowUpRight size={11} strokeWidth={3} /> : <ArrowDownRight size={11} strokeWidth={3} />}
          {margin}%
        </Pill>
      </div>

      <FinanceBar cost={cost} revenue={revenue} />

      <div className="flex justify-between mt-3.5 text-[12px]">
        <div>
          <div className="text-[#4B6478] mb-0.5 font-medium">Total biaya</div>
          <div className="text-white font-bold tabular-nums">{fmtRp(cost)}</div>
        </div>
        {onNavigate && (
          <div className="flex items-center gap-1 text-emerald-400 font-bold text-[12px]">
            Detail <TrendingUp size={12} />
          </div>
        )}
        <div className="text-right">
          <div className="text-[#4B6478] mb-0.5 font-medium">Proyeksi omzet</div>
          <div className="text-white font-bold tabular-nums">{fmtRp(revenue)}</div>
        </div>
      </div>
    </Card>
  )
}

function FinanceBar({ cost, revenue }) {
  const total = (cost || 0) + (revenue || 0)
  const costPct = total > 0 ? ((cost || 0) / total) * 100 : 0
  
  return (
    <div className="flex h-2.5 rounded-full overflow-hidden bg-white/10 w-full">
      <div 
        className="bg-red-500/70 transition-all duration-700" 
        style={{ width: `${costPct}%` }} 
      />
      <div className="flex-1 bg-emerald-500" />
    </div>
  )
}
