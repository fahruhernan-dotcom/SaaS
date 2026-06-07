/**
 * MobileSectionHeader.jsx — Section label with optional action button
 * Matches TernakOS reference: "LABEL · DATE" on left, "Action" link on right.
 */
import React from 'react'

export function MobileSectionHeader({ label, action, onAction }) {
  return (
    <div className="flex items-center justify-between px-5 mb-3">
      <span className="text-[11px] font-bold text-slate-500 dark:text-[#8DA2B5] uppercase tracking-[0.12em]">
        {label}
      </span>
      {action && onAction && (
        <button
          onClick={onAction}
          className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
        >
          {action}
        </button>
      )}
      {action && !onAction && (
        <span className="text-[11px] font-bold text-slate-500 dark:text-[#8DA2B5] bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
          {action}
        </span>
      )}
    </div>
  )
}
