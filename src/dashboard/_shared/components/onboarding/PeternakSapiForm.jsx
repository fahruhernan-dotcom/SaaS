import React from 'react'
import { PawPrint, Scale, Hash, Calendar, Info, Calculator, BadgePercent } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/DatePicker'
import { cn } from '@/lib/utils'

export default function PeternakSapiForm({ data, onChange }) {
  const set = (key, val) => onChange({ ...data, [key]: val })

  const fieldLabelStyle = "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-amber-500/80 mb-1.5 ml-1"
  const inputContainerStyle = "relative transition-all duration-300"

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Nama Batch */}
      <div className={inputContainerStyle}>
        <Label className={fieldLabelStyle}>
          <Hash size={12} className="text-amber-500" />
          Nama Batch <span className="text-amber-500/50 ml-0.5">*</span>
        </Label>
        <Input
          type="text"
          value={data.batch_name || ''}
          onChange={e => set('batch_name', e.target.value)}
          placeholder="Contoh: Batch April 2024"
          className="h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d] transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Tanggal Mulai */}
        <div className={inputContainerStyle}>
          <Label className={fieldLabelStyle}>
            <Calendar size={12} className="text-amber-500" />
            Tanggal Mulai <span className="text-amber-500/50 ml-0.5">*</span>
          </Label>
          <DatePicker
            value={data.start_date || new Date().toISOString().split('T')[0]}
            onChange={val => set('start_date', val)}
            allowClear={false}
            className="h-11 rounded-xl bg-[#111C24] border-white/5"
          />
        </div>

        {/* Jumlah Ekor */}
        <div className={inputContainerStyle}>
          <Label className={fieldLabelStyle}>
            <PawPrint size={12} className="text-amber-500" />
            Populasi (Ekor) <span className="text-amber-500/50 ml-0.5">*</span>
          </Label>
          <Input
            type="number"
            min="1"
            value={data.initial_count || ''}
            onChange={e => set('initial_count', e.target.value)}
            placeholder="0"
            className="h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Berat Rata-rata */}
        <div className={inputContainerStyle}>
          <Label className={fieldLabelStyle}>
            <Scale size={12} className="text-amber-500" />
            Berat Avg (kg)
          </Label>
          <div className="relative">
            <Input
              type="number"
              min="50"
              step="0.1"
              value={data.initial_avg_weight || ''}
              onChange={e => set('initial_avg_weight', e.target.value)}
              placeholder="350"
              className="h-11 rounded-xl bg-[#111C24] border-white/5 pl-4 pr-10 font-bold text-sm focus:bg-[#15232d]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/20 uppercase tracking-widest pointer-events-none">kg</span>
          </div>
        </div>

        {/* Harga Beli */}
        <div className={inputContainerStyle}>
          <Label className={fieldLabelStyle}>
            <BadgePercent size={12} className="text-amber-500" />
            Harga Beli (Rp/kg)
          </Label>
          <Input
            type="number"
            min="0"
            step="500"
            value={data.purchase_price_per_kg || ''}
            onChange={e => set('purchase_price_per_kg', e.target.value)}
            placeholder="52000"
            className="h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d]"
          />
        </div>
      </div>

      {/* Notice Box */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 rounded-xl blur-sm opacity-50 transition duration-1000"></div>
        <div className="relative flex items-center gap-3 bg-[#0F171F] border border-white/5 rounded-xl p-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-500 shadow-inner">
            <Calculator size={16} />
          </div>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
            "Untuk menghitung <span className="text-amber-400 font-bold not-italic">ADG</span> & <span className="text-emerald-400 font-bold not-italic">profit</span> secara otomatis."
          </p>
        </div>
      </div>

    </div>
  )
}
