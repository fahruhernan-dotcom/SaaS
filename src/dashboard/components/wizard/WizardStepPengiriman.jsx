import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, Loader2, Truck, Clock, ChevronsUpDown, Check, Plus, ChevronUp, ChevronDown } from 'lucide-react'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { formatIDR, safeNum } from '@/lib/format'
import { Card } from '@/components/ui/card'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandSeparator
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { differenceInDays, parseISO } from 'date-fns'

const S = {
  label: { fontSize: 11, fontWeight: 700, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6, fontFamily: 'Sora' },
  input: 'w-full bg-[#111C24] border border-white/10 h-12 rounded-xl px-3 text-[#F1F5F9] font-bold outline-none placeholder:text-muted-foreground',
}

// Premium TimePicker Component
const TimePicker = ({ value, onChange, label }) => {
  // value format could be ISO "2024-03-16T14:30:00" or just "14:30"
  const getTimeString = () => {
    if (!value) return '08:00'
    if (value.includes('T')) return value.split('T')[1].substring(0, 5)
    return value
  }

  const timeStr = getTimeString()
  const [hour, minute] = timeStr.split(':')
  
  const handleHour = (h) => {
    const hh = String(Math.min(23, Math.max(0, h))).padStart(2, '0')
    const today = new Date().toISOString().split('T')[0]
    onChange(`${today}T${hh}:${minute || '00'}:00`)
  }
  
  const handleMinute = (m) => {
    const mm = String(Math.min(59, Math.max(0, m))).padStart(2, '0')
    const today = new Date().toISOString().split('T')[0]
    onChange(`${today}T${hour || '08'}:${mm}:00`)
  }
  
  return (
    <div className="flex-1">
      {label && <label style={S.label}>{label}</label>}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'hsl(var(--input))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '10px',
        padding: '10px 14px',
        height: '50px'
      }}>
        <Clock size={15} color="hsl(var(--muted-foreground))" style={{flexShrink: 0}} />
        
        <input
          type="number"
          min={0} max={23}
          value={hour}
          onChange={e => handleHour(parseInt(e.target.value) || 0)}
          className="w-9 bg-transparent border-none outline-none text-base font-bold text-white text-center p-0"
        />
        
        <span className="text-lg font-bold text-muted-foreground mb-0.5">:</span>
        
        <input
          type="number"
          min={0} max={59}
          value={minute}
          onChange={e => handleMinute(parseInt(e.target.value) || 0)}
          className="w-9 bg-transparent border-none outline-none text-base font-bold text-white text-center p-0"
        />
        
        <div className="ml-auto flex flex-col gap-1">
          <button
            type="button"
            onClick={() => handleHour(parseInt(hour) + 1)}
            onMouseEnter={e => { e.currentTarget.style.color = '#34D399'; e.currentTarget.style.background = 'rgba(16,185,129,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'inherit'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            style={{ width: 18, height: 18, borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid hsl(var(--border))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' }}
          >
            <ChevronUp size={10} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => handleHour(parseInt(hour) - 1)}
            onMouseEnter={e => { e.currentTarget.style.color = '#34D399'; e.currentTarget.style.background = 'rgba(16,185,129,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'inherit'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            style={{ width: 18, height: 18, borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid hsl(var(--border))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' }}
          >
            <ChevronDown size={10} strokeWidth={3} />
          </button>
        </div>
      </div>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  )
}

export default function WizardStepPengiriman({ step1Data, step2Data, mode, step3Data, setStep3Data, onSubmit, onBack, submitting }) {
  const { tenant } = useAuth()
  const [vehicleMode, setVehicleMode] = useState('armada')
  const [driverMode, setDriverMode] = useState('driver')
  const [openVehicle, setOpenVehicle] = useState(false)
  const [openDriver, setOpenDriver] = useState(false)

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-active', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase.from('vehicles').select('*').eq('tenant_id', tenant.id).eq('status', 'aktif').eq('is_deleted', false).order('plate_number')
      return data || []
    },
    enabled: !!tenant?.id && !!step3Data.enabled
  })

  const { data: drivers } = useQuery({
    queryKey: ['drivers-active', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase.from('drivers').select('*').eq('tenant_id', tenant.id).eq('status', 'aktif').eq('is_deleted', false).order('full_name')
      return data || []
    },
    enabled: !!tenant?.id && !!step3Data.enabled
  })

  const buyData = mode === 'buy_first' ? step1Data : step2Data
  const sellData = mode === 'buy_first' ? step2Data : step1Data

  const farmName = buyData?.farm_name || '—'
  const rpaName = sellData?.rpa_name || '—'
  const totalWeightKg = safeNum(buyData?.total_weight_kg)
  const qty = safeNum(buyData?.quantity)
  const totalRevenue = safeNum(sellData?.total_revenue)
  const totalModal = safeNum(buyData?.total_modal)
  
  const deliveryCost = safeNum(step3Data.delivery_cost)
  const profitBersih = totalRevenue - totalModal - deliveryCost

  const update = (key, val) => setStep3Data(prev => ({ ...prev, [key]: val }))

  const vehicleLabel = (v) => {
    const parts = []
    if (v.brand) parts.push(v.brand)
    if (v.capacity_ekor) parts.push(`cap ${safeNum(v.capacity_ekor).toLocaleString('id-ID')} ekor`)
    return parts.join(' · ')
  }

  const driverSubLabel = (d) => {
    const hp = d.phone_number || 'Tidak ada HP'
    const expiry = d.sim_expires_at ? parseISO(d.sim_expires_at) : null
    let statusBadge = null
    
    if (expiry) {
      const daysLeft = differenceInDays(expiry, new Date())
      if (daysLeft < 30) {
        statusBadge = (
          <Badge variant="outline" className={`ml-1.5 py-0 px-1 text-[9px] font-black uppercase ${daysLeft < 0 ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-amber-500/50 bg-amber-500/10 text-amber-400'}`}>
            {daysLeft < 0 ? 'SIM Mati' : `SIM -${daysLeft} Hari`}
          </Badge>
        )
      }
    }
    
    return { hp, statusBadge }
  }

  const selectedVehicle = vehicles?.find(v => v.id === step3Data.vehicle_id)
  const selectedDriver = drivers?.find(d => d.id === step3Data.driver_id)

  return (
    <div className="space-y-5 px-5 pb-8">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478]">Step 3 — Detail Pengiriman</p>
      
      {/* Summary Card Update */}
      <Card className="bg-[#111C24] border-white/5 rounded-2xl p-5 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Truck size={80} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1">Rute Transaksi</p>
              <h4 className="text-base font-black text-white">{farmName} <span className="text-[#4B6478] mx-1">→</span> {rpaName}</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1">Volume</p>
              <p className="text-sm font-bold text-white">{safeNum(qty).toLocaleString('id-ID')} ekor · {safeNum(totalWeightKg).toFixed(1)} kg</p>
            </div>
          </div>
          
          <Separator className="bg-white/5" />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.1em] mb-1">Pendapatan</p>
              <p className="text-sm font-bold text-emerald-400">{formatIDR(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.1em] mb-1">Total Biaya (Modal + Kirim)</p>
              <p className="text-sm font-bold text-red-400">{formatIDR(safeNum(totalModal) + safeNum(deliveryCost))}</p>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-white/5 mt-2">
            <span className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Estimasi Profit Bersih</span>
            <span className={`text-xl font-black tabular-nums ${profitBersih >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {profitBersih >= 0 ? '+' : ''}{formatIDR(profitBersih)}
            </span>
          </div>
        </div>
      </Card>

      {/* Toggle Catat Pengiriman */}
      <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
        <div>
          <p className="text-[13px] font-black text-emerald-400 uppercase tracking-wider">Lengkapi Detail Pengiriman?</p>
          <p className="text-[11px] text-[#4B6478] font-medium mt-0.5">Wajib jika ingin cetak Surat Jalan</p>
        </div>
        <button
          type="button"
          onClick={() => update('enabled', !step3Data.enabled)}
          style={{
            width: 44, height: 24, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
            background: step3Data.enabled ? '#10B981' : 'rgba(255,255,255,0.1)',
            position: 'relative', flexShrink: 0
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: step3Data.enabled ? 23 : 3,
            width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }} />
        </button>
      </div>

      {step3Data.enabled && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Kendaraan */}
          <div className="space-y-2.5">
            <label style={S.label}>Pilih Kendaraan</label>
            <div className="flex gap-1.5 mb-2">
              {['armada', 'manual'].map(m => (
                <button key={m} type="button" onClick={() => setVehicleMode(m)}
                  className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${vehicleMode === m ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/[0.02] text-[#4B6478]'}`}
                >{m === 'armada' ? 'Armada Sendiri' : 'Input Manual'}</button>
              ))}
            </div>

            {vehicleMode === 'armada' ? (
              <Popover open={openVehicle} onOpenChange={setOpenVehicle}>
                <PopoverTrigger asChild>
                  <button type="button" style={{
                    width: '100%', padding: '13px 14px', background: 'hsl(var(--input))', border: '1px solid hsl(var(--border))', borderRadius: '10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '16px',
                    color: step3Data.vehicle_id ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', textAlign: 'left'
                  }}>
                    <span className="truncate">
                      {selectedVehicle ? `${selectedVehicle.plate_number} · ${selectedVehicle.vehicle_type}` : 'Pilih kendaraan armada'}
                    </span>
                    <ChevronsUpDown size={14} className="ml-2 flex-shrink-0 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-white/5 bg-[#111C24]" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Cari plat/jenis..." className="h-10 border-none" />
                    <CommandEmpty>Kendaraan tidak ditemukan</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {vehicles?.map(v => (
                        <CommandItem
                          key={v.id}
                          value={v.plate_number + ' ' + v.vehicle_type}
                          onSelect={() => {
                            update('vehicle_id', v.id)
                            update('vehicle_type', v.vehicle_type)
                            update('vehicle_plate', v.plate_number)
                            setOpenVehicle(false)
                          }}
                          className="cursor-pointer py-3 px-4 border-b border-white/5 last:border-none focus:bg-white/5"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">{v.plate_number} · {v.vehicle_type}</p>
                            <p className="text-[11px] text-[#4B6478] font-medium mt-0.5">{vehicleLabel(v)}</p>
                          </div>
                          {step3Data.vehicle_id === v.id && <Check size={14} className="text-emerald-400 ml-2" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Jenis Mobil" value={step3Data.vehicle_type || ''} onChange={e => update('vehicle_type', e.target.value)} className={S.input} />
                <input type="text" placeholder="Plat Nomor" value={step3Data.vehicle_plate || ''} onChange={e => update('vehicle_plate', e.target.value)} className={S.input} />
              </div>
            )}
          </div>

          {/* Sopir */}
          <div className="space-y-2.5">
            <label style={S.label}>Pilih Sopir</label>
            <div className="flex gap-1.5 mb-2">
              {['driver', 'manual'].map(m => (
                <button key={m} type="button" onClick={() => setDriverMode(m)}
                  className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${driverMode === m ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/[0.02] text-[#4B6478]'}`}
                >{m === 'driver' ? 'Sopir Terdaftar' : 'Input Manual'}</button>
              ))}
            </div>

            {driverMode === 'driver' ? (
              <div>
                <Popover open={openDriver} onOpenChange={setOpenDriver}>
                  <PopoverTrigger asChild>
                    <button type="button" style={{
                      width: '100%', padding: '13px 14px', background: 'hsl(var(--input))', border: '1px solid hsl(var(--border))', borderRadius: '10px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '16px',
                      color: step3Data.driver_id ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', textAlign: 'left'
                    }}>
                      <span className="truncate">
                        {selectedDriver ? selectedDriver.full_name : 'Pilih sopir terdaftar'}
                      </span>
                      <ChevronsUpDown size={14} className="ml-2 flex-shrink-0 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-white/5 bg-[#111C24]" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Cari nama sopir..." className="h-10 border-none" />
                      <CommandEmpty>Sopir tidak ditemukan</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {drivers?.map(d => (
                          <CommandItem
                            key={d.id}
                            value={d.full_name}
                            onSelect={() => {
                              update('driver_id', d.id)
                              update('driver_name', d.full_name)
                              update('driver_phone', d.phone_number)
                              setOpenDriver(false)
                            }}
                            className="cursor-pointer py-3 px-4 border-b border-white/5 last:border-none focus:bg-white/5"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-bold text-white">{d.full_name}</p>
                              <div className="flex items-center mt-0.5">
                                <p className="text-[11px] text-[#4B6478] font-medium">{driverSubLabel(d).hp}</p>
                                {driverSubLabel(d).statusBadge}
                              </div>
                            </div>
                            {step3Data.driver_id === d.id && <Check size={14} className="text-emerald-400 ml-2" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {step3Data.driver_id && selectedDriver?.wage_per_trip && (
                  <p className="text-[10px] text-emerald-400 mt-1.5 font-black uppercase italic tracking-wider">
                    Estimasi Upah: {formatIDR(selectedDriver.wage_per_trip)}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Nama sopir" value={step3Data.driver_name || ''} onChange={e => update('driver_name', e.target.value)} className={S.input} />
                <input type="text" placeholder="No HP" value={step3Data.driver_phone || ''} onChange={e => update('driver_phone', e.target.value)} className={S.input} />
              </div>
            )}
          </div>

          {/* Times with Custom TimePicker */}
          <div className="grid grid-cols-2 gap-3">
            <TimePicker label="Jam Muat" value={step3Data.load_time} onChange={val => update('load_time', val)} />
            <TimePicker label="Jam Berangkat" value={step3Data.departure_time} onChange={val => update('departure_time', val)} />
          </div>

          {/* TOTAL BIAYA PENGIRIMAN */}
          <div className="space-y-1.5">
            <label style={S.label}>Total Biaya Pengiriman *</label>
            <InputRupiah value={step3Data.delivery_cost || 0} onChange={v => update('delivery_cost', v)} placeholder="0" className="bg-[#111C24] border-emerald-500/20 h-14 rounded-2xl text-xl font-bold text-white shadow-inner" />
            <p className="text-[10px] text-[#4B6478] font-bold uppercase mt-1 italic">
              Termasuk solar, uang makan, portal, dll.
            </p>
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <label style={S.label}>Catatan Pengiriman</label>
            <textarea value={step3Data.notes || ''} onChange={e => update('notes', e.target.value)}
              className="w-full bg-[#111C24] border border-white/10 rounded-xl p-4 text-[#F1F5F9] text-sm min-h-[80px] outline-none resize-none placeholder:text-[#4B6478]"
              placeholder="Tambahkan keterangan rute, kondisi ayam, dll..." />
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="space-y-4 pt-4">
        <button type="button" onClick={onSubmit} disabled={submitting}
          className="w-full h-14 rounded-2xl font-black text-sm tracking-[0.15em] text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          style={{ background: '#10B981', boxShadow: '0 12px 24px -8px rgba(16,185,129,0.4)', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? <><Loader2 size={20} className="animate-spin" /> MENYIMPAN...</> : <><Truck size={20} /> SIMPAN TRANSAKSI</>}
        </button>
        
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" onClick={onBack} className="gap-2 text-[#4B6478] hover:text-white font-bold h-12 rounded-xl flex-1 border border-white/5">
            <ChevronLeft size={18} /> KEMBALI
          </Button>
          {!step3Data.enabled && (
             <button type="button" onClick={onSubmit} disabled={submitting}
              className="flex-1 text-[11px] text-[#4B6478] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors"
            >
              Lewati & Simpan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
