import { useMemo } from 'react'
import { Wallet } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function PLProjectionChart({ batches, feedLogs, operationalCosts, sales }) {
  const data = useMemo(() => {
    // Aggregate across all active batches
    const totalAnimals = batches.reduce((s, b) => s + (b.total_animals || 0), 0)
    const avgEntryWeight = batches.reduce((s, b) => s + (b.avg_entry_weight_kg || 15), 0) / (batches.length || 1)
    const avgLatestWeight = batches.reduce((s, b) => s + (b.avg_latest_weight_kg || avgEntryWeight), 0) / (batches.length || 1)

    // Costs
    const feedCost = feedLogs.reduce((s, l) => s + (l.feed_cost_idr || 0), 0)
    const opCost = operationalCosts.reduce((s, c) => s + (c.amount_idr || 0), 0)
    const purchaseCost = batches.reduce((s, b) => s + (b.total_purchase_cost_idr || 0), 0)
    const totalCost = feedCost + opCost + purchaseCost

    // Revenue projection from last sale price
    const lastSale = [...sales].sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))[0]
    const pricePerKg = lastSale?.price_type === 'per_kg' ? lastSale.price_amount : null
    const projectedRevenue = pricePerKg
      ? totalAnimals * avgLatestWeight * pricePerKg
      : (lastSale?.price_amount ? totalAnimals * lastSale.price_amount : 0)
    const projectedProfit = projectedRevenue - totalCost

    if (totalCost === 0 && projectedRevenue === 0) return []

    return [
      { name: 'Biaya Keluar', value: Math.round(totalCost / 1_000_000), color: '#EF4444' },
      { name: 'Proj. Revenue', value: Math.round(projectedRevenue / 1_000_000), color: '#22C55E' },
      { name: 'Est. Profit', value: Math.round(projectedProfit / 1_000_000), color: projectedProfit >= 0 ? '#10B981' : '#F59E0B' },
    ]
  }, [batches, feedLogs, operationalCosts, sales])

  if (data.length === 0) return (
    <div className="h-[180px] flex flex-col items-center justify-center text-center bg-white/[0.01] border border-white/[0.02] rounded-2xl">
      <Wallet size={24} className="text-white/10 mb-2" />
      <p className="text-xs font-bold text-white/30">Belum ada data laba-rugi</p>
      <p className="text-[10px] text-[#4B6478] mt-1">Catat pakan, biaya, dan penjualan agar estimasi profit muncul.</p>
    </div>
  )

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#4B6478', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#4B6478', fontWeight: 'bold' }} axisLine={false} tickLine={false} unit="Jt" />
          <Tooltip
            contentStyle={{ backgroundColor: '#0C1319', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            formatter={(v) => [`Rp ${(v * 1_000_000).toLocaleString('id-ID')}`, '']}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
