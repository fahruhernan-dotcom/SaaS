import * as React from 'react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DatePicker({ value, onChange, placeholder, className }) {
  const dateValue = value ? (value instanceof Date ? value : new Date(value)) : null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-14 w-full rounded-2xl bg-[#111C24] border-white/5 px-4 flex items-center justify-start gap-3 hover:bg-white/5 hover:border-white/10 transition-all",
            !value && "text-[#4B6478]",
            value && "text-white font-black text-xs uppercase tracking-widest",
            className
          )}
        >
          <CalendarIcon size={18} className={cn("transition-colors", value ? "text-[#10B981]" : "text-[#4B6478]")} />
          <span>
            {dateValue && !isNaN(dateValue.getTime())
              ? format(dateValue, 'dd MMM yyyy', { locale: id })
              : (placeholder || 'PILIH TANGGAL')}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0 border-none bg-transparent shadow-none">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, 'yyyy-MM-dd'))
            }
          }}
          locale={id}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
