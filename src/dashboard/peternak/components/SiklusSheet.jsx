import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/hooks/useAuth'
import { usePeternakFarms } from '../../../lib/hooks/usePeternakData'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const BUSINESS_MODEL_LABELS = {
  mandiri_murni:  'Murni Mandiri',
  mandiri_semi:   'Semi Mandiri',
  mitra_penuh:    'INTI-PLASMA',
  mitra_pakan:    'Kemitraan Pakan',
  mitra_sapronak: 'Kemitraan Sapronak',
}

const isMandiri = m => m === 'mandiri_murni' || m === 'mandiri_semi'

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export default function SiklusSheet({ open, onClose }) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const { data: farms = [] } = usePeternakFarms()

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    peternak_farm_id: '',
    chick_in_date: today,
    doc_count: '',
    doc_price_per_ekor: 0,
    supplier_doc: '',
    strain: '',
    avg_doc_weight_gram: '',
    target_harvest_days: '30',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectedFarm = farms.find(f => f.id === form.peternak_farm_id)
  const showDocPrice = selectedFarm && isMandiri(selectedFarm.business_model)
  const estimatedHarvest = form.chick_in_date && form.target_harvest_days
    ? addDays(form.chick_in_date, parseInt(form.target_harvest_days) || 30)
    : null

  const canSubmit = form.peternak_farm_id && form.chick_in_date && form.doc_count

  const handleSubmit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    try {
      // Get next cycle number for this farm
      const { count } = await supabase
        .from('breeding_cycles')
        .select('id', { count: 'exact', head: true })
        .eq('peternak_farm_id', form.peternak_farm_id)
        .eq('is_deleted', false)
      const cycleNumber = (count ?? 0) + 1

      const docCount = parseInt(form.doc_count) || 0

      const { data: cycleData, error: cycleErr } = await supabase
        .from('breeding_cycles')
        .insert([{
          tenant_id: tenant.id,
          peternak_farm_id: form.peternak_farm_id,
          cycle_number: cycleNumber,
          chicken_type: selectedFarm?.livestock_type ?? 'ayam_broiler',
          doc_count: docCount,
          current_count: docCount,
          status: 'active',
          start_date: form.chick_in_date,
          estimated_harvest_date: estimatedHarvest,
          total_feed_kg: 0,
          total_mortality: 0,
        }])
        .select('id')
        .single()
      if (cycleErr) throw cycleErr

      // Insert doc purchase expense if mandiri
      if (showDocPrice && form.doc_price_per_ekor > 0) {
        const totalDocCost = docCount * form.doc_price_per_ekor
        await supabase.from('cycle_expenses').insert([{
          tenant_id: tenant.id,
          cycle_id: cycleData.id,
          expense_type: 'doc',
          description: `DOC Chick In — ${form.supplier_doc || 'tidak diisi'} ${form.strain ? `(${form.strain})` : ''}`.trim(),
          qty: docCount,
          unit: 'ekor',
          unit_price: form.doc_price_per_ekor,
          total_amount: totalDocCost,
          expense_date: form.chick_in_date,
          supplier: form.supplier_doc || null,
        }])
      }

      toast.success(`Siklus #${cycleNumber} berhasil dimulai!`)
      queryClient.invalidateQueries({ queryKey: ['active-cycles', tenant.id] })
      queryClient.invalidateQueries({ queryKey: ['all-cycles', tenant.id] })
      queryClient.invalidateQueries({ queryKey: ['peternak-farms', tenant.id] })

      // Reset form
      setForm({
        peternak_farm_id: '', chick_in_date: today, doc_count: '',
        doc_price_per_ekor: 0, supplier_doc: '', strain: '',
        avg_doc_weight_gram: '', target_harvest_days: '30', notes: '',
      })
      onClose()
    } catch (err) {
      console.error('SiklusSheet submit error:', err)
      toast.error('Gagal menyimpan siklus.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="bg-[#0C1319] border-white/8 rounded-t-[24px] max-h-[92vh] overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 24 }}>🐣</span>
            <div>
              <SheetTitle className="text-white font-display font-black text-base">Mulai Siklus Baru</SheetTitle>
              <p className="text-[#4B6478] text-xs mt-0.5">Catat data chick in kandang</p>
            </div>
          </div>
        </SheetHeader>

        <div style={{ padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Farm picker */}
          <div>
            <label htmlFor="farm_select" style={labelStyle}>Kandang *</label>
            <select
              id="farm_select"
              name="farm_select"
              value={form.peternak_farm_id}
              onChange={e => setField('peternak_farm_id', e.target.value)}
              style={inputStyle}
            >
              <option value="">— Pilih Kandang —</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.farm_name} ({BUSINESS_MODEL_LABELS[f.business_model] ?? f.business_model})
                </option>
              ))}
            </select>
          </div>

          {/* Chick In Date */}
          <div>
            <label style={labelStyle}>Tanggal Chick In *</label>
            <DatePicker
              value={form.chick_in_date}
              onChange={v => setField('chick_in_date', v)}
              placeholder="Pilih tanggal masuk DOC"
            />
          </div>

          {/* DOC Count */}
          <FormField id="doc_count" label="Jumlah DOC (Ekor) *" type="number" placeholder="10000"
            value={form.doc_count} onChange={v => setField('doc_count', v)} />

          {/* Target harvest days */}
          <FormField id="target_harvest_days" label="Target Usia Panen (Hari)" type="number" placeholder="30"
            value={form.target_harvest_days} onChange={v => setField('target_harvest_days', v)} />

          {/* Estimated harvest date display */}
          {estimatedHarvest && (
            <div style={infoBoxStyle}>
              <span style={{ fontSize: 12, color: '#34D399' }}>
                📅 Estimasi panen: <strong>{estimatedHarvest}</strong>
              </span>
            </div>
          )}

          {/* DOC price — only for mandiri */}
          {showDocPrice && (
            <>
              <div>
                <label style={labelStyle}>Harga DOC per Ekor</label>
                <InputRupiah
                  value={form.doc_price_per_ekor}
                  onChange={v => setField('doc_price_per_ekor', v)}
                  placeholder="6500"
                />
              </div>
              <FormField id="supplier_doc" label="Supplier DOC" placeholder="cth. PT Sierad Produce"
                value={form.supplier_doc} onChange={v => setField('supplier_doc', v)} />
            </>
          )}

          {/* Strain */}
          <FormField id="strain" label="Strain / Breed" placeholder="cth. Cobb 500, Lohmann"
            value={form.strain} onChange={v => setField('strain', v)} />

          {/* Avg DOC weight */}
          <FormField id="avg_doc_weight_gram" label="Bobot DOC Rata-rata (gram)" type="number" placeholder="42"
            value={form.avg_doc_weight_gram} onChange={v => setField('avg_doc_weight_gram', v)} />

          {/* Notes */}
          <div>
            <label htmlFor="cycle_notes" style={labelStyle}>Catatan</label>
            <textarea
              id="cycle_notes"
              name="cycle_notes"
              placeholder="Catatan tambahan (opsional)"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            style={{
              ...submitBtnStyle,
              ...(!canSubmit || loading ? { opacity: 0.4, cursor: 'not-allowed', boxShadow: 'none' } : {}),
            }}
          >
            {loading ? 'Menyimpan...' : '🐣 Mulai Siklus'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Reusable field ────────────────────────────────────────────────────────────

function FormField({ id, label, type = 'text', placeholder, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input
        id={id} name={id} type={type}
        placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block', fontSize: 10, fontWeight: 800,
  color: '#4B6478', textTransform: 'uppercase',
  letterSpacing: '0.1em', marginBottom: 6,
}

const inputStyle = {
  width: '100%', padding: '12px 14px',
  background: '#111C24',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, color: '#F1F5F9',
  fontSize: 15, fontFamily: 'DM Sans', outline: 'none',
  boxSizing: 'border-box',
}

const infoBoxStyle = {
  padding: '10px 14px',
  background: 'rgba(52,211,153,0.06)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: 10,
}

const submitBtnStyle = {
  width: '100%', padding: '14px',
  background: '#7C3AED', border: 'none', borderRadius: 12,
  color: 'white', fontSize: 15, fontWeight: 800,
  cursor: 'pointer', fontFamily: 'Sora',
  boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
  marginTop: 4,
}
