import React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * BrokerBaseCard - Universal card container for any broker transaction list.
 * Handles premium hover effects, borders, and consistent spacing.
 */
export function BrokerBaseCard({ 
  onClick, 
  isLoss, 
  children, 
  footer, 
  header, 
  className 
}) {
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "bg-[#111C24] rounded-[22px] overflow-hidden relative cursor-pointer hover:bg-white/[0.04] active:scale-[0.98] transition-all group",
        isLoss ? "border-[#F87171]" : "border-white/5",
        className
      )}
    >
      <div className="p-5 space-y-6">
        {header && (
          <div className="flex justify-between items-start gap-2">
            {header}
          </div>
        )}
        
        {children}
      </div>

      {footer && (
        <div className={cn(
          "px-6 py-3 flex justify-between items-center",
          isLoss ? "bg-[#3d0f0f] border-t border-[#F87171]" : "bg-[#0C1319] border-t border-white/5"
        )}>
          {footer}
        </div>
      )}
    </Card>
  )
}
