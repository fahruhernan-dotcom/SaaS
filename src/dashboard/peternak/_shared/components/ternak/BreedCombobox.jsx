import { useState } from 'react'
import { ChevronDown, Check, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// compact=true → table row style, compact=false → full sheet style
export function BreedCombobox({ value, onChange, suggestions = [], compact = false }) {
  const [open, setOpen] = useState(false)

  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn('w-full h-8 px-2 bg-[#111C24] border-white/5 rounded-lg text-[11px] justify-between text-left', !value ? 'text-[#4B6478]' : 'text-white')}>
            <span className="truncate">{value || '-- Breed --'}</span>
            <ChevronDown size={11} className="opacity-40" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 bg-[#111C24] border-white/10 shadow-2xl z-[9999]">
          <Command className="bg-transparent">
            <CommandInput placeholder="Cari..." className="h-8 text-[11px]" />
            <CommandList>
              <CommandEmpty className="py-2 text-[10px] text-center opacity-50 uppercase font-black">Kosong</CommandEmpty>
              <CommandGroup>
                {suggestions.map(b => (
                  <CommandItem key={b} value={b} onSelect={() => { onChange(b); setOpen(false) }} className="py-2 px-3 text-[11px] font-bold uppercase tracking-widest">
                    {b}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn('w-full px-4 h-11 bg-[#111C24] border border-white/5 rounded-xl text-sm justify-between hover:bg-white/5 transition-all text-left font-normal', !value ? 'text-[#4B6478]' : 'text-white')}
        >
          <span className="truncate">{value || 'Garut, Texel...'}</span>
          <ChevronsUpDown size={14} className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-[#111C24] border-white/10 shadow-2xl z-[9999]">
        <Command className="bg-transparent">
          <CommandInput placeholder="Cari breed..." className="h-11 border-none focus:ring-0 text-white" />
          <CommandList className="max-h-[300px] scrollbar-thin">
            <CommandEmpty className="py-4 text-center text-xs opacity-50 font-bold uppercase">Tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {suggestions.map(b => (
                <CommandItem
                  key={b}
                  value={b}
                  onSelect={() => { onChange(b); setOpen(false) }}
                  className="flex items-center justify-between py-2.5 px-3 cursor-pointer hover:bg-green-500/10 rounded-lg text-xs font-bold uppercase tracking-widest"
                >
                  <span className={cn(value === b ? 'text-green-400' : 'text-white')}>{b}</span>
                  {value === b && <Check size={14} className="text-green-400" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
