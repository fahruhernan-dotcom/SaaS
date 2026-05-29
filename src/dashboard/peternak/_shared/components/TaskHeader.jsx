import React, { useState } from 'react'
import { Search, Eye, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * TaskHeader - Specialized header for Daily Task pages.
 * Mobile: compact layout showing title, date, search icon toggle, filter icon toggle, and active filter context.
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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)

  return (
    <header className={cn(
      "border-b border-white/[0.04]",
      isDesktop ? "px-5 pt-6 pb-4 space-y-4" : "px-4 pt-3.5 pb-3 space-y-2"
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

      {/* ── MOBILE: title + subtitle + search & filter toggles ── */}
      {!isDesktop && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 min-h-[36px]">
            {isSearchExpanded ? (
              <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-right-3 duration-200">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder={searchPlaceholder}
                    autoFocus
                    className="pl-9 h-9 w-full bg-white/[0.04] border-white/[0.06] rounded-xl text-xs text-white placeholder:text-[#4B6478] focus:ring-0 focus:border-purple-500/40"
                  />
                </div>
                <button
                  onClick={() => {
                    setIsSearchExpanded(false)
                    onSearchChange?.('')
                  }}
                  className="text-xs font-bold text-slate-400 px-2 h-9 flex items-center justify-center hover:text-white"
                >
                  Batal
                </button>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="font-display text-sm font-black text-white tracking-tight uppercase leading-none">{title}</h2>
                  {subtitle && (
                    <p className="text-[9px] font-bold text-[#4B6478] uppercase mt-1 tracking-widest leading-none">{subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onSearchChange && (
                    <button
                      onClick={() => setIsSearchExpanded(true)}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all border active:scale-95",
                        searchQuery
                          ? "bg-purple-500/10 border-purple-500/20 text-[#A78BFA]"
                          : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white"
                      )}
                    >
                      <Search size={16} />
                    </button>
                  )}
                  {filters && filters.length > 0 && (
                    <button
                      onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all border active:scale-95",
                        isFiltersVisible || activeFilter !== 'semua'
                          ? "bg-purple-500/10 border-purple-500/20 text-[#A78BFA]"
                          : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white"
                      )}
                    >
                      <SlidersHorizontal size={15} />
                    </button>
                  )}
                  {filters && filters.length > 0 && !isFiltersVisible && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                      {filters.find(f => f.id === activeFilter)?.label || activeFilter}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Collapsible filters on mobile */}
          {filters && filters.length > 0 && isFiltersVisible && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
              {filters.map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    onFilterChange?.(f.id)
                    // Optionally close collapse after selecting on small devices
                  }}
                  className={cn(
                    "h-8.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 border",
                    activeFilter === f.id
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 animate-pulse"
                      : "bg-white/[0.03] border-white/[0.06] text-[#64748B] hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DESKTOP: Filter Chips ── */}
      {isDesktop && filters && filters.length > 0 && (
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

