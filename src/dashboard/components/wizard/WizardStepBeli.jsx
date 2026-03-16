import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, ChevronLeft, ChevronsUpDown, Check, Plus, ChevronDown } from 'lucide-react'
import { InputNumber } from '@/components/ui/InputNumber'
import { useNavigate } from 'react-router-dom'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { DatePicker } from '@/components/ui/DatePicker'
import { formatIDR, safeNum } from '@/lib/format'
import { toast } from 'sonner'
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandSeparator
} from '@/components/ui/command'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'

const schema = z.object({
  farm_id: z.string().min(1, 'Pilih kandang'),
  quantity: z.number().min(1, 'Min 1 ekor'),
  avg_weight_kg: z.number().min(0.1, 'Min 0.1 kg'),
  price_per_kg: z.number().min(1000),
  transaction_date: z.string().min(1),
  notes: z.string().optional()
})

const S = {
  label: { fontSize: 11, fontWeight: 700, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6, fontFamily: 'Sora' },
  input: 'bg-[#111C24] border-white/10 h-12 rounded-xl text-[#F1F5F9]',
}

export default function WizardStepBeli({ onNext, onBack, title = 'Step 1 — Dari Kandang Mana?', orderData }) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const [inputMode, setInputMode] = useState('ekor')
  const [totalWeightInput, setTotalWeightInput] = useState('')
  const [weightUnit, setWeightUnit] = useState('kg')
  const [unitOpen, setUnitOpen] = useState(false)
  const [openKandang, setOpenKandang] = useState(false)
  const [showQuickAddKandang, setShowQuickAddKandang] = useState(false)
  const [newFarm, setNewFarm] = useState({ farm_name: '', owner_name: '', phone: '', location: '' })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      avg_weight_kg: 1.85,
    }
  })

  const { data: farms } = useQuery({
    queryKey: ['farms-active-simple', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase.from('farms')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('farm_name')
      return data || []
    },
    enabled: !!tenant?.id
  })

  const qty = watch('quantity')
  const avgW = watch('avg_weight_kg')
  const price = watch('price_per_kg')
  const farmId = watch('farm_id')

  const selectedKandang = farms?.find(f => f.id === farmId)

  const weightMultiplier = weightUnit === 'ton' ? 1000 : weightUnit === 'rit' ? 5000 : 1
  const totalWeight = inputMode === 'berat'
    ? (parseFloat(totalWeightInput) || 0) * weightMultiplier
    : safeNum(qty) * safeNum(avgW)
  const totalCost = safeNum(totalWeight) * safeNum(price)

  const handleQuickAddFarm = async () => {
    if (!newFarm.farm_name || !newFarm.owner_name) return
    
    const { data, error } = await supabase
      .from('farms')
      .insert({
        tenant_id: tenant?.id,
        farm_name: newFarm.farm_name,
        owner_name: newFarm.owner_name,
        phone: newFarm.phone || null,
        location: newFarm.location || null,
        status: 'growing',
        available_stock: 0,
        chicken_type: 'broiler'
      })
      .select()
      .single()
    
    if (error) {
      toast.error('Gagal tambah kandang: ' + error.message)
      return
    }
    
    queryClient.invalidateQueries({ queryKey: ['farms-active-simple'] })
    setValue('farm_id', data.id)
    setShowQuickAddKandang(false)
    setNewFarm({ farm_name: '', owner_name: '', phone: '', location: '' })
    toast.success(`✅ Kandang ${data.farm_name} ditambahkan!`)
  }

  const farmLabel = (farm) => {
    const parts = [farm.owner_name]
    if (farm.location) parts.push(farm.location)
    if (farm.available_stock > 0) {
      parts.push(`${safeNum(farm.available_stock).toLocaleString('id-ID')} ekor`)
    }
    return parts.join(' · ')
  }

  const onSubmit = (values) => {
    const finalKg = inputMode === 'berat'
      ? (parseFloat(totalWeightInput) || 0) * weightMultiplier
      : safeNum(values.quantity) * safeNum(values.avg_weight_kg)
    const total_cost = safeNum(finalKg) * safeNum(values.price_per_kg)

    onNext({
      farm_id: values.farm_id,
      farm_name: selectedKandang?.farm_name,
      quantity: inputMode === 'berat' ? Math.round(finalKg / (values.avg_weight_kg || 1.85)) : values.quantity,
      avg_weight_kg: values.avg_weight_kg,
      total_weight_kg: finalKg,
      price_per_kg: values.price_per_kg,
      total_cost,
      transport_cost: 0,
      other_cost: 0,
      total_modal: total_cost,
      transaction_date: values.transaction_date,
      notes: values.notes || null
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-5 pb-8">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478]">{title}</p>

      {orderData && (
        <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.20)', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ color: '#93C5FD', fontSize: 12, margin: 0 }}>
            📋 Order dari <strong>{orderData.rpa_name}</strong> · Target jual Rp {safeNum(orderData.price_per_kg).toLocaleString('id-ID')}/kg
          </p>
        </div>
      )}

      {/* Kandang Combobox */}
      <div className="space-y-1.5">
        <label style={S.label}>Pilih Kandang *</label>
        <Popover open={openKandang} onOpenChange={setOpenKandang}>
          <PopoverTrigger asChild>
            <button type="button" style={{
              width: '100%',
              padding: '13px 14px',
              background: 'hsl(var(--input))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              color: farmId ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              textAlign: 'left'
            }}>
              <span className="truncate">
                {selectedKandang ? selectedKandang.farm_name : 'Pilih kandang sumber'}
              </span>
              <ChevronsUpDown size={14} className="ml-2 flex-shrink-0 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="p-0 border-white/5 bg-[#111C24]" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
            <Command className="bg-transparent">
              <CommandInput placeholder="Cari kandang..." className="h-10 border-none" />
              <CommandEmpty>
                <div className="py-2 text-center text-xs text-muted-foreground">Kandang tidak ditemukan</div>
              </CommandEmpty>
              <CommandGroup className="max-h-64 overflow-y-auto">
                {farms?.map(farm => (
                  <CommandItem
                    key={farm.id}
                    value={farm.farm_name}
                    onSelect={() => {
                      setValue('farm_id', farm.id)
                      setOpenKandang(false)
                    }}
                    className="cursor-pointer py-3 px-4 border-b border-white/5 last:border-none focus:bg-white/5"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{farm.farm_name}</p>
                      <p className="text-[11px] text-[#4B6478] font-medium mt-0.5">{farmLabel(farm)}</p>
                    </div>
                    {farmId === farm.id && <Check size={14} className="text-emerald-400 ml-2" />}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator className="bg-white/5" />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpenKandang(false)
                    setShowQuickAddKandang(true)
                  }}
                  className="cursor-pointer py-3 px-4 text-emerald-400 focus:bg-emerald-400/5"
                >
                  <Plus size={14} className="mr-2" />
                  <span className="text-xs font-black uppercase tracking-widest">Tambah Kandang Baru</span>
                </CommandItem>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        {errors.farm_id && <p className="text-[10px] text-red-500 font-bold">{errors.farm_id.message}</p>}

        {/* Quick Add Kandang */}
        {showQuickAddKandang && (
          <div style={{
            marginTop: 8,
            padding: '14px',
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.20)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <p style={{ fontSize: '11px', fontWeight: 900, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
              Kandang Baru
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label style={{ fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase' }}>Nama Kandang *</label>
                <Input placeholder="Farm A" value={newFarm.farm_name} onChange={e => setNewFarm(p => ({ ...p, farm_name: e.target.value }))} className="h-9 bg-black/20" />
              </div>
              <div className="space-y-1">
                <label style={{ fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase' }}>Nama Pemilik *</label>
                <Input placeholder="Pak Budi" value={newFarm.owner_name} onChange={e => setNewFarm(p => ({ ...p, owner_name: e.target.value }))} className="h-9 bg-black/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label style={{ fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase' }}>No HP</label>
                <Input type="tel" placeholder="081..." value={newFarm.phone} onChange={e => setNewFarm(p => ({ ...p, phone: e.target.value }))} className="h-9 bg-black/20" />
              </div>
              <div className="space-y-1">
                <label style={{ fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase' }}>Lokasi</label>
                <Input placeholder="Boyolali" value={newFarm.location} onChange={e => setNewFarm(p => ({ ...p, location: e.target.value }))} className="h-9 bg-black/20" />
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <Button type="button" onClick={handleQuickAddFarm} disabled={!newFarm.farm_name || !newFarm.owner_name} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] h-9 rounded-lg">SIMPAN & PILIH</Button>
              <Button type="button" variant="ghost" onClick={() => setShowQuickAddKandang(false)} className="px-3 text-muted-foreground font-bold text-[11px] h-9">BATAL</Button>
            </div>
          </div>
        )}
      </div>

      {/* Mode Toggle + Quantity */}
      <div className="space-y-3">
        <div className="flex gap-1.5">
          {['ekor', 'berat'].map(m => (
            <button key={m} type="button" onClick={() => setInputMode(m)}
              className={`flex-1 p-2 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all ${inputMode === m ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/[0.02] text-[#4B6478]'}`}
            >
              {m === 'ekor' ? 'Per Ekor' : 'Per Berat'}
            </button>
          ))}
        </div>

        {inputMode === 'ekor' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label style={S.label}>Jumlah Ekor *</label>
              <InputNumber placeholder="500" step={1} min={1} value={watch('quantity')} onChange={(val) => setValue('quantity', val, { shouldValidate: true })} />
              {errors.quantity && <p className="text-[10px] text-red-500 font-bold">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label style={S.label}>Bobot/ekor (kg) *</label>
              <InputNumber step={0.01} min={0.1} placeholder="1.85" value={watch('avg_weight_kg')} onChange={(val) => setValue('avg_weight_kg', val, { shouldValidate: true })} />
              {errors.avg_weight_kg && <p className="text-[10px] text-red-500 font-bold">{errors.avg_weight_kg.message}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label style={S.label}>Total Berat *</label>
              <div className="grid grid-cols-[1fr,100px] gap-2">
                <InputNumber
                  step={weightUnit === 'kg' ? 100 : 0.1}
                  min={0}
                  placeholder="0"
                  value={totalWeightInput}
                  onChange={(val) => {
                    setTotalWeightInput(val.toString())
                    const kg = (parseFloat(val) || 0) * weightMultiplier
                    setValue('quantity', Math.round(kg / (safeNum(watch('avg_weight_kg')) || 1.85)))
                  }}
                />
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setUnitOpen(!unitOpen)}
                    style={{
                      padding: '13px 12px',
                      background: 'hsl(var(--secondary))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'hsl(var(--foreground))',
                      cursor: 'pointer',
                      height: '50px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                      userSelect: 'none'
                    }}
                  >
                    <span className="uppercase">{weightUnit}</span>
                    <ChevronDown
                      size={14}
                      color="hsl(var(--muted-foreground))"
                      style={{
                        transform: unitOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.15s'
                      }}
                    />
                  </button>

                  {unitOpen && (
                    <>
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                        onClick={() => setUnitOpen(false)}
                      />
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        zIndex: 50,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                      }}>
                        {['kg', 'ton', 'rit'].map(unit => (
                          <button
                            key={unit}
                            type="button"
                            onClick={() => {
                              setWeightUnit(unit)
                              setUnitOpen(false)
                              const mult = unit === 'ton' ? 1000 : unit === 'rit' ? 5000 : 1
                              const kg = (parseFloat(totalWeightInput) || 0) * mult
                              setValue('quantity', Math.round(kg / (parseFloat(watch('avg_weight_kg')) || 1.85)))
                            }}
                            style={{
                              width: '100%',
                              padding: '11px 14px',
                              background: weightUnit === unit ? 'rgba(16,185,129,0.10)' : 'transparent',
                              border: 'none',
                              borderBottom: unit !== 'rit' ? '1px solid hsl(var(--border))' : 'none',
                              color: weightUnit === unit ? '#34D399' : 'hsl(var(--foreground))',
                              fontSize: '14px',
                              fontWeight: weightUnit === unit ? 700 : 400,
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span className="uppercase">{unit}</span>
                            {weightUnit === unit && <Check size={13} color="#34D399" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label style={S.label}>Bobot Rata-rata (kg/ekor)</label>
              <InputNumber
                step={0.01}
                min={0.1}
                placeholder="1.85"
                value={watch('avg_weight_kg')}
                onChange={(val) => {
                  const numVal = parseFloat(val) || 1.85
                  setValue('avg_weight_kg', numVal, { shouldValidate: true })
                  if (totalWeightInput) {
                    const kg = (parseFloat(totalWeightInput) || 0) * weightMultiplier
                    setValue('quantity', Math.round(kg / numVal))
                  }
                }}
              />
              <p className="text-[10px] font-bold text-[#4B6478] italic uppercase">Estimasi: {safeNum(qty).toLocaleString('id-ID')} ekor</p>
            </div>
          </div>
        )}
      </div>

      {/* Harga Beli */}
      <div className="space-y-1.5">
        <label style={S.label}>Harga Beli (Rp/kg) *</label>
        <InputRupiah value={watch('price_per_kg')} onChange={(val) => setValue('price_per_kg', val)} placeholder="19.800" className={S.input + ' text-lg font-bold text-white'} />
        {errors.price_per_kg && <p className="text-[10px] text-red-500 font-bold">Harga wajib diisi</p>}
      </div>

      {/* Tanggal */}
      <div className="space-y-1.5">
        <label style={S.label}>Tanggal Transaksi</label>
        <DatePicker value={watch('transaction_date')} onChange={(val) => setValue('transaction_date', val)} placeholder="Pilih tanggal" />
      </div>

      {/* Catatan */}
      <div className="space-y-1.5">
        <label style={S.label}>Catatan (Opsional)</label>
        <Textarea className="bg-[#111C24] border-white/10 rounded-xl min-h-[72px] text-sm" placeholder="Tambah keterangan..." {...register('notes')} />
      </div>

      {/* Ringkasan */}
      {totalWeight > 0 && price > 0 && (
        <Card className="bg-emerald-500/5 border-emerald-500/15 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Ringkasan Pembelian</p>
            <span className="text-[10px] font-bold text-[#4B6478]">{safeNum(qty).toLocaleString('id-ID')} ekor</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] font-bold text-[#4B6478] uppercase tracking-wider">Total Berat</span>
              <span className="text-base font-black text-white">{totalWeight > 1000 ? `${(totalWeight / 1000).toFixed(2)} ton` : `${totalWeight.toFixed(1)} kg`}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] font-bold text-[#4B6478] uppercase tracking-wider">Harga Beli</span>
              <span className="text-base font-bold text-white">{formatIDR(price)}/kg</span>
            </div>
            <Separator className="bg-emerald-500/10" />
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">Total Bayar</span>
              <span className="text-2xl font-black text-emerald-400 tabular-nums tracking-tighter">{formatIDR(totalCost)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onBack} className="gap-2 text-[#4B6478] hover:text-white font-bold h-12 rounded-xl">
          <ChevronLeft size={18} /> KEMBALI
        </Button>
        <Button type="submit" disabled={!farmId || !price || !qty} className="flex-1 h-14 rounded-2xl font-black text-sm tracking-widest shadow-lg shadow-emerald-500/20" style={{ background: '#10B981', color: 'white' }}>
          LANJUT {orderData ? 'KE SUBMIT' : 'KE PENJUALAN'} →
        </Button>
      </div>
    </form>
  )
}
