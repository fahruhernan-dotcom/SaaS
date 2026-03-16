import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export function DatePicker({ value, onChange, placeholder }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            gap: '10px',
            background: 'hsl(var(--input))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '10px',
            padding: '13px 14px',
            height: 'auto',
            fontSize: '16px',
            color: value
              ? 'hsl(var(--foreground))'
              : 'hsl(var(--muted-foreground))',
            fontWeight: 400
          }}
        >
          <CalendarIcon size={16} color="hsl(var(--muted-foreground))" />
          {value
            ? format(new Date(value), 'd MMMM yyyy', { locale: id })
            : (placeholder || 'Pilih tanggal')}
        </Button>
      </PopoverTrigger>
      <PopoverContent style={{
        width: 'auto', padding: 0,
        background: 'hsl(var(--popover))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '14px'
      }}>
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
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
