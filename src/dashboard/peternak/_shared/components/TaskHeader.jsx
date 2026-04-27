import React from 'react'
import { Search, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * TaskHeader - Specialized header for Daily Task pages.
 * Mobile: compact — no duplicate title (TopBar already shows it), date + search in one row.
 * Desktop: full header with title, search, action button.
 */
export function TaskHeader({
  title = "Tugas Harian",
  subtitle,
  isDesktop,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Cari tugas...",
  filters = [],
  activeFilter,
  onFilterChange,
  actionButton,
  isViewOnly
}) {
  return (
    <header className={cn(
      "border-b border-white/[0.04]",
      isDesktop ? "px-5 pt-6 pb-4 space-y-4" : "px-4 pt-2 pb-2.5 space-y-2"
    )}>

      {/* ── DESKTOP: full title + search + action ── */}
      {isDesktop && (
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="font-display text-2xl font-black text-white tracking-tight uppercase leading-none">{title}</h1>
            {subtitle && (
              <p className="text-[10px] font-bold text-[#4B6478] uppercase mt-1 tracking-widest">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-1 justify-end">
            {onSearchChange && (
              <div className="relative max-w-xs w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-9 h-10 w-full bg-[#111C24] border-white/5 rounded-xl font-bold text-xs text-white placeholder:text-[#4B6478]"
                />
              </div>
            )}
            {actionButton}
          </div>
        </div>
      )}

      {/* ── MOBILE: date subtitle + compact search (no duplicate title) ── */}
      {!isDesktop && (
        <div className="flex items-center justify-between gap-3 min-h-[32px]">
          {subtitle && (
            <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest leading-none">{subtitle}</p>
          )}
          {onSearchChange && (
            <div className="relative shrink-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4B6478]" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari..."
                className="pl-7 h-8 w-28 bg-white/[0.04] border-white/[0.06] rounded-xl text-[11px] text-white placeholder:text-[#4B6478] focus:w-36 transition-all"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Filter Chips — horizontal scroll, no clipping ── */}
      {filters && filters.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => onFilterChange?.(f.id)}
              className={cn(
                "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 border",
                activeFilter === f.id
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-white/[0.03] border-white/[0.06] text-[#64748B] hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isViewOnly && (
        <div className="bg-[#0C1319] border border-white/[0.08] rounded-xl px-4 py-2 flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#4B6478] shrink-0" />
          <span className="text-[#4B6478] text-xs">
            Mode <strong className="text-[#94A3B8]">View Only</strong> — hanya bisa melihat data
          </span>
        </div>
      )}
    </header>
  )
}
