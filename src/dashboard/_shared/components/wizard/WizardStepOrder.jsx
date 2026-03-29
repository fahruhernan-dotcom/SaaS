import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft } from 'lucide-react'
import { InputNumber } from '@/components/ui/InputNumber'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { DatePicker } from '@/components/ui/DatePicker'
import { safeNum } from '@/lib/format'

const S = {
  label: { fontSize: 11, fontWeight: 700, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6, fontFamily: 'Sora' },
  input: 'bg-[#111C24] border-white/10 h-12 rounded-xl text-[#F1F5F9]',
}

const PAYMENT_OPTIONS = [
  { value: 'lunas', label: 'Lunas', color: '#10B981' },
  { value: 'belum_lunas', label: 'Belum Lunas', color: '#F87171' },
  { value: 'sebagian', label: 'Sebagian', color: '#F59E0B' },
]

export default function WizardStepOrder({ onNext, onBack }) {
  const { tenant } = useAuth()
  const [rpaId, setRpaId] = useState('')
  const [inputMode, setInputMode] = useState('ekor')
  const [quantity, setQuantity] = useState('')
  const [avgWeight, setAvgWeight] = useState('1.85')
  const [totalWeightInput, setTotalWeightInput] = useState('')
  const [weightUnit, setWeightUnit] = useState('kg')
  const [pricePerKg, setPricePerKg] = useState('')
  const [deliveryCost, setDeliveryCost] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState('lunas')
  const [paidAmount, setPaidAmount] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const { data: rpaClients } = useQuery({
    queryKey: ['rpa-clients-active', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase.from('rpa_clients').select('*').eq('tenant_id', tenant.id).eq('is_deleted', false).order('rpa_name')
      return data || []
    },
    enabled: !!tenant?.id
  })

  const weightMult = safeNum(weightUnit === 'ton' ? 1000 : weightUnit === 'rit' ? 5000 : 1)
  const totalWeightKg = inputMode === 'berat'
    ? safeNum(totalWeightInput) * weightMult
    : safeNum(quantity) * safeNum(avgWeight)
 
  const totalRevenue = safeNum(totalWeightKg) * safeNum(pricePerKg)
  const isValid = rpaId && pricePerKg > 0 && (quantity > 0 || totalWeightInput > 0) && transactionDate

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return

    const finalQty = inputMode === 'berat' ? Math.round(totalWeightKg / (parseFloat(avgWeight) || 1.85)) : parseInt(quantity)
    
    onNext({
      rpa_id: rpaId,
      rpa_name: rpaClients?.find(r => r.id === rpaId)?.rpa_name,
      quantity: finalQty,
      avg_weight_kg: parseFloat(avgWeight),
      total_weight_kg: totalWeightKg,
      price_per_kg: Number(pricePerKg),
      total_revenue: totalRevenue,
      delivery_cost: Number(deliveryCost) || 0,
      payment_status: paymentStatus,
      paid_amount: paymentStatus === 'lunas' ? totalRevenue : (Number(paidAmount) || 0),
      transaction_date: transactionDate,
      due_date: paymentStatus !== 'lunas' ? dueDate : null,
      notes: notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-5 pb-8">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478]">Step 1 — Order dari Siapa?</p>

      {/* RPA */}
      <div className="space-y-1.5">
        <label style={S.label}>Pilih RPA Buyer *</label>
        <Select onValueChange={setRpaId}>
          <SelectTrigger className={S.input}><SelectValue placeholder="Pilih RPA yang order" /></SelectTrigger>
          <SelectContent className="bg-[#111C24] border-white/10 text-white">
            {rpaClients?.map(r => (
              <SelectItem key={r.id} value={r.id} className="focus:bg-white/5">
                {r.rpa_name} · {r.payment_terms || 'cash'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mode Toggle */}
      <div className="space-y-3">
        <div className="flex gap-1.5">
          {['ekor', 'berat'].map(m => (
            <button key={m} type="button" onClick={() => setInputMode(m)}
              className={`flex-1 p-2 rounded-lg border text-[13px] font-semibold transition-colors ${inputMode === m ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-border bg-transparent text-muted-foreground'}`}
            >{m === 'ekor' ? 'Per Ekor' : 'Per Berat'}</button>
          ))}
        </div>

        {inputMode === 'ekor' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="order_quantity" style={S.label}>Jumlah Ekor *</label>
              <InputNumber id="order_quantity" name="order_quantity" placeholder="500" value={quantity} onChange={setQuantity} step={1} min={1} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="order_avg_weight" style={S.label}>Bobot/ekor (kg)</label>
              <InputNumber id="order_avg_weight" name="order_avg_weight" step={0.01} min={0.1} placeholder="1.85" value={avgWeight} onChange={setAvgWeight} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="order_total_weight" style={S.label}>Total Berat *</label>
              <div className="flex gap-2">
                <InputNumber
                  id="order_total_weight"
                  name="order_total_weight"
                  step={weightUnit === 'kg' ? 100 : 0.1}
                  min={0}
                  placeholder="3000"
                  value={totalWeightInput}
                  onChange={setTotalWeightInput}
                />
                <select id="order_weight_unit" name="order_weight_unit" value={weightUnit} onChange={e => setWeightUnit(e.target.value)} className="bg-[#111C24] border border-white/10 h-12 rounded-xl px-4 text-sm text-foreground font-bold outline-none">
                  <option value="kg">kg</option><option value="ton">ton</option><option value="rit">rit</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="order_avg_weight_berat" style={S.label}>Bobot Rata-rata (kg/ekor)</label>
              <InputNumber id="order_avg_weight_berat" name="order_avg_weight_berat" step={0.01} min={0.1} placeholder="1.85" value={avgWeight} onChange={setAvgWeight} />
            </div>
          </div>
        )}
      </div>

      {/* Harga Jual Target */}
      <div className="space-y-1.5">
        <label htmlFor="target_price" style={S.label}>Harga Jual Target (Rp/kg) *</label>
        <InputRupiah id="target_price" name="target_price" value={pricePerKg} onChange={setPricePerKg} placeholder="20.500" className={S.input + ' text-lg font-bold'} />
      </div>

      {/* Biaya Pengiriman */}
      <div className="space-y-1.5">
        <label htmlFor="order_delivery_cost" style={S.label}>Biaya Pengiriman</label>
        <InputRupiah id="order_delivery_cost" name="order_delivery_cost" value={deliveryCost} onChange={setDeliveryCost} placeholder="0" className={S.input} />
      </div>

      {/* Status Pembayaran */}
      <div className="space-y-1.5">
        <label style={S.label}>Status Pembayaran *</label>
        <div className="flex gap-2">
          {PAYMENT_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => setPaymentStatus(opt.value)}
              style={{ flex: 1, padding: '10px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', background: paymentStatus === opt.value ? `${opt.color}18` : 'transparent', border: paymentStatus === opt.value ? `2px solid ${opt.color}60` : '1px solid rgba(255,255,255,0.1)', color: paymentStatus === opt.value ? opt.color : '#4B6478' }}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {paymentStatus === 'sebagian' && (
        <div className="space-y-1.5">
          <label htmlFor="order_paid_amount" style={S.label}>Sudah Dibayar</label>
          <InputRupiah id="order_paid_amount" name="order_paid_amount" value={paidAmount} onChange={setPaidAmount} placeholder="0" className={S.input} />
        </div>
      )}
      {paymentStatus !== 'lunas' && (
        <div className="space-y-1.5">
          <label style={S.label}>Jatuh Tempo</label>
          <DatePicker value={dueDate} onChange={setDueDate} placeholder="Pilih jatuh tempo" />
        </div>
      )}

      <div className="space-y-1.5">
        <label style={S.label}>Tanggal Order</label>
        <DatePicker value={transactionDate} onChange={setTransactionDate} placeholder="Pilih tanggal" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="order_notes" style={S.label}>Catatan (Opsional)</label>
        <textarea id="order_notes" name="order_notes" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#111C24] border border-white/10 rounded-xl p-3 text-[#F1F5F9] text-sm min-h-[72px] outline-none resize-none placeholder:text-muted-foreground" placeholder="Catatan..." />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onBack} className="gap-1.5 text-muted-foreground">
          <ChevronLeft size={16} /> Kembali
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1 h-12 rounded-2xl font-black" style={{ background: '#10B981', color: 'white' }}>
          Lanjut → Cari Kandang
        </Button>
      </div>
    </form>
  )
}
