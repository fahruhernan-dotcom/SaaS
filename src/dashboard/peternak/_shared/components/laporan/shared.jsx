import { cn } from '@/lib/utils'

// ─── Formatters ───────────────────────────────────────────────────────────────

export const fmtRp  = (n) => `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`
export const fmtNum = (n, dec = 1) => (n ?? 0).toFixed(dec)

// ─── StatCard ─────────────────────────────────────────────────────────────────

export function StatCard({
  label, value, sub,
  icon: Icon,
  color  = 'text-white',
  bg     = 'bg-white/[0.03]',
  border = 'border-white/[0.06]',
}) {
  return (
    <div className={cn('rounded-2xl p-4 border flex flex-col gap-2', bg, border)}>
      {Icon && <Icon size={15} className={cn('opacity-60', color)} />}
      <div>
        <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest mb-0.5">{label}</p>
        <p className={cn('text-xl font-black font-["Sora"] leading-none', color)}>{value}</p>
        {sub && <p className="text-[10px] text-[#4B6478] mt-1 font-medium">{sub}</p>}
      </div>
    </div>
  )
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export function SectionTitle({ children }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4B6478] mb-3 ml-1">
      {children}
    </p>
  )
}

// ─── BatchSelector ────────────────────────────────────────────────────────────

export function BatchSelector({ batches, activeBatchId, onChange }) {
  if (batches.length <= 1) return null
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-1">
      <button
        onClick={() => onChange('all')}
        className={cn(
          'flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
          activeBatchId === 'all'
            ? 'bg-white/10 border-white/20 text-white'
            : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478]',
        )}
      >
        Semua Batch
      </button>
      {batches.map(b => (
        <button
          key={b.id}
          onClick={() => onChange(b.id)}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
            activeBatchId === b.id
              ? 'bg-green-600 border-green-500 text-white'
              : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478]',
          )}
        >
          {b.batch_code}
        </button>
      ))}
    </div>
  )
}

// ─── PLRow ────────────────────────────────────────────────────────────────────

export function PLRow({ label, value, isPositive, isTotal, indent }) {
  return (
    <div className={cn(
      'flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0',
      isTotal && 'pt-3 border-t border-white/10 mt-1',
    )}>
      <span className={cn(
        'text-[11px] font-medium',
        indent && 'ml-4 text-[#4B6478]',
        isTotal && 'font-black text-white text-xs uppercase tracking-wider',
        !indent && !isTotal && 'text-slate-300',
      )}>
        {label}
      </span>
      <span className={cn(
        'text-[11px] font-black tabular-nums',
        isTotal
          ? (isPositive ? 'text-emerald-400 text-sm' : 'text-rose-400 text-sm')
          : isPositive ? 'text-white' : 'text-rose-300',
      )}>
        {value}
      </span>
    </div>
  )
}
