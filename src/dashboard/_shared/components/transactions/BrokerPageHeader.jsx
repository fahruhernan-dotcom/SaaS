import React from 'react'
import { Search, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * BrokerPageHeader - Universal header for any broker transaction page.
 */
export function BrokerPageHeader({ 
  title = "Transaksi",
  subtitle,
  isDesktop,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  filters = [],
  activeFilter,
  onFilterChange,
  actionButton,
  isViewOnly 
}) {
  return (
    <header className="px-5 pt-8 pb-4 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-white tracking-tight uppercase leading-none">{title}</h1>
          {subtitle && (
            <p className={cn("font-bold text-[#4B6478] uppercase mt-1 tracking-widest", isDesktop ? "text-[10px]" : "text-xs")}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-1 justify-end">
          {onSearchChange && (
            <div className="relative max-w-xs w-full hidden md:block">
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

      {/* Mobile Search */}
      {onSearchChange && (
        <div className="md:hidden mt-4 relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-10 w-full bg-[#111C24] border-white/5 rounded-xl font-bold text-xs text-white placeholder:text-[#4B6478]"
          />
        </div>
      )}

      {/* Filter Chips */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => onFilterChange?.(f.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeFilter === f.id
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-[#111C24] text-[#4B6478] hover:text-emerald-400 border border-white/5"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isViewOnly && (
        <div className="bg-[#0C1319] border border-white/8 rounded-xl px-4 py-2 flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#4B6478]" />
          <span className="text-[#4B6478] text-xs">
            Kamu dalam mode <strong className="text-[#94A3B8]">View Only</strong> — hanya bisa melihat data
          </span>
        </div>
      )}
    </header>
  )
}
