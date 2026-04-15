import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Check, Lock,
  LayoutGrid, Bird, Egg, PawPrint,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePeternakFarms } from '@/lib/hooks/usePeternakData'
import { InputNumber } from '@/components/ui/InputNumber'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { DatePicker } from '@/components/ui/DatePicker'

// ─── Data ─────────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

const LIVESTOCK_OPTIONS = [
  { id: 'ayam_broiler', Icon: Bird,     label: 'Ayam Broiler', iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10', available: true  },
  { id: 'domba',        Icon: PawPrint, label: 'Kambing & Domba', iconColor: 'text-orange-400',  iconBg: 'bg-orange-500/10',  available: true },
  { id: 'ayam_petelur', Icon: Egg,      label: 'Ayam Petelur', iconColor: 'text-[#4B6478]',   iconBg: 'bg-white/5',       available: false },
  { id: 'sapi',         Icon: PawPrint, label: 'Sapi',         iconColor: 'text-[#4B6478]',   iconBg: 'bg-white/5',       available: false },
  { id: 'babi',         Icon: PawPrint, label: 'Babi',         iconColor: 'text-[#4B6478]',   iconBg: 'bg-white/5',       available: false },
]

// ─── Shared styles ─────────────────────────────────────────────────────────────

const labelCls = 'block text-[10px] font-bold uppercase tracking-widest text-[#4B6478] mb-2'

const inputCls =
  'w-full h-12 px-4 rounded-xl bg-[#111C24] border border-white/10 text-sm text-white ' +
  'placeholder:text-[#4B6478] focus:border-purple-500/50 outline-none transition-colors'

const stepMotion = {
  initial:    { opacity: 0, x: 20 },
  animate:    { opacity: 1, x: 0 },
  exit:       { opacity: 0, x: -20 },
  transition: { duration: 0.2 },
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FormField({ id, label, placeholder, value, onChange, type = 'text' }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SetupFarm({ onSuccess, onCancel }) {
  const { tenant, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: existingFarms = [] } = usePeternakFarms()
  const kandangLimit       = tenant?.kandang_limit ?? 1
  const currentCount       = existingFarms.reduce((sum, f) => sum + (f.kandang_count || 1), 0)
  const canAdd             = currentCount < kandangLimit
  const isMultiKandangEnabled = kandangLimit >= 99

  const [step,             setStep]             = useState(1)
  const [livestock,        setLivestock]        = useState(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [form,             setForm]             = useState({
    farm_name: '', location: '', capacity: '', kandang_count: 1,
  })
  const [cycleForm, setCycleForm] = useState({
    doc_count: '', start_date: TODAY, target_weight_kg: '', sell_price_per_kg: '',
  })
  const [loading, setLoading] = useState(false)

  const setField      = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const setCycleField = (key, val) => setCycleForm(f => ({ ...f, [key]: val }))

  const canNext1 = !!livestock
  const canNext2 = form.farm_name.trim() && Number(form.capacity) > 0

  const handleSubmit = async (skipCycle = false) => {
    if (!form.farm_name.trim() || !Number(form.capacity) || loading) return
    if (!tenant?.id) {
      toast.error('Sesi tidak valid. Silakan muat ulang halaman.')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // 1. Save farm
      const { data: farmData, error: farmErr } = await supabase
        .from('peternak_farms')
        .insert([{
          tenant_id:     tenant.id,
          farm_name:     form.farm_name.trim(),
          location:      form.location.trim() || null,
          capacity:      parseInt(form.capacity) || 0,
          kandang_count: isMultiKandangEnabled ? (parseInt(form.kandang_count) || 1) : 1,
          livestock_type: livestock,
          business_model: 'mandiri_murni',
          is_active:     true,
        }])
        .select()
        .single()
      if (farmErr) throw farmErr

      // 2. Optionally save first cycle
      if (!skipCycle && cycleForm.doc_count) {
        await supabase.from('breeding_cycles').insert([{
          tenant_id:          tenant.id,
          peternak_farm_id:   farmData.id,
          doc_count:          parseInt(cycleForm.doc_count),
          start_date:         cycleForm.start_date,
          target_weight_kg:   cycleForm.target_weight_kg ? parseFloat(cycleForm.target_weight_kg) : null,
          sell_price_per_kg:  cycleForm.sell_price_per_kg ? parseInt(cycleForm.sell_price_per_kg) : null,
          status:             'active',
          cycle_number:       1,
        }])
      }

      toast.success('Kandang berhasil didaftarkan!')
      await refetchProfile()
      queryClient.invalidateQueries({ queryKey: ['peternak-farms', tenant.id] })
      queryClient.invalidateQueries({ queryKey: ['active-cycles'] })
      onSuccess?.()
    } catch (err) {
      console.error('SetupFarm error:', err)
      toast.error('Gagal menyimpan data kandang.')
    } finally {
      setLoading(false)
    }
  }

  // ── Upgrade gate ──
  if (!canAdd) {
    return (
      <UpgradeGate
        plan={tenant?.plan}
        currentCount={currentCount}
        kandangLimit={kandangLimit}
        onBack={onSuccess ?? (() => navigate(-1))}
        onUpgrade={() => navigate('/peternak/akun')}
      />
    )
  }

  // ── Wizard modal ──
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">

      {/* Cancel confirm dialog */}
      {showCancelDialog && (
        <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111C24] rounded-2xl border border-white/8 p-6 w-full max-w-sm shadow-2xl"
          >
            <h3 className="font-display font-bold text-white text-lg mb-2">Batalkan setup?</h3>
            <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">
              Yakin ingin membatalkan setup? Kamu bisa setup kandang nanti dari menu Siklus.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 py-2.5 border border-white/10 rounded-xl text-sm text-[#94A3B8] hover:border-white/25 hover:text-white transition-colors bg-transparent cursor-pointer"
              >
                Lanjutkan setup
              </button>
              <button
                onClick={() => { setShowCancelDialog(false); onCancel?.() }}
                className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 font-semibold hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                Ya, batalkan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Wizard card */}
      <div className="bg-[#0C1319] rounded-3xl border border-white/8 w-full max-w-2xl shadow-2xl shadow-black/50 max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="px-8 pt-8 pb-6 border-b border-white/5 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <LayoutGrid size={20} className="text-purple-400" />
              </div>
              <div>
                <h1 className="font-display font-bold text-white text-lg leading-none mb-1">
                  {livestock === 'domba' ? 'Setup Farm Kambing/Domba' : 'Setup Kandang Ayam Pertama'}
                </h1>
                <p className="text-[#4B6478] text-sm">Langkah {step} dari 3</p>
              </div>
            </div>
            <button
              onClick={() => setShowCancelDialog(true)}
              className="px-4 py-2 border border-white/10 rounded-xl text-sm text-[#4B6478] hover:text-white hover:border-white/20 transition-colors bg-transparent cursor-pointer"
            >
              Batal
            </button>
          </div>

          {/* Progress pills */}
          <div className="flex gap-2 mt-5">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                  n < step  ? 'bg-purple-500' :
                  n === step ? 'bg-purple-400 shadow-sm shadow-purple-500/50' :
                  'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <AnimatePresence mode="wait">

            {/* Step 1 — Pilih Jenis Ternak */}
            {step === 1 && (
              <motion.div key="step1" {...stepMotion}>
                <h2 className="font-display text-2xl font-bold text-white">Pilih Jenis Ternak</h2>
                <p className="text-[#94A3B8] text-sm mt-1 mb-6">
                  Apa yang akan kamu pelihara di kandang ini?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {LIVESTOCK_OPTIONS.map(({ id, Icon, label, iconColor, iconBg, available }) => {
                    const selected = livestock === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => available && setLivestock(id)}
                        disabled={!available}
                        className={`relative p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all text-center w-full ${
                          !available
                            ? 'bg-[#0C1319] border-white/5 opacity-40 cursor-not-allowed'
                            : selected
                            ? 'bg-purple-500/10 border-purple-500 cursor-pointer'
                            : 'bg-[#111C24] border-white/8 cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5'
                        }`}
                      >
                        {/* Selected checkmark */}
                        {selected && (
                          <span className="absolute top-3 left-3 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check size={14} className="text-white" strokeWidth={3} />
                          </span>
                        )}
                        {/* Segera Hadir badge */}
                        {!available && (
                          <span className="absolute top-3 right-3 bg-amber-500/10 text-amber-400 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
                            Segera
                          </span>
                        )}
                        <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center`}>
                          <Icon size={24} className={iconColor} />
                        </div>
                        <span className="font-display font-semibold text-white text-base">{label}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2 — Detail Kandang */}
            {step === 2 && (
              <motion.div key="step2" {...stepMotion}>
                <h2 className="font-display text-2xl font-bold text-white">Detail Kandang</h2>
                <p className="text-[#94A3B8] text-sm mt-1 mb-6">Isi informasi dasar kandang pertamamu</p>
                <div className="flex flex-col gap-4">
                  <FormField
                    id="farm_name"
                    label="Nama Kandang *"
                    placeholder="Kandang A / Kandang Utama"
                    value={form.farm_name}
                    onChange={v => setField('farm_name', v)}
                  />
                  <FormField
                    id="location"
                    label="Lokasi"
                    placeholder="Desa, Kecamatan, Kota"
                    value={form.location}
                    onChange={v => setField('location', v)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    {/* Kapasitas */}
                    <div>
                      <label htmlFor="capacity" className={labelCls}>Kapasitas (Ekor) *</label>
                      <InputNumber
                        id="capacity"
                        name="capacity"
                        value={form.capacity}
                        onChange={v => setField('capacity', v)}
                        min={1}
                        className="h-12 rounded-xl bg-[#111C24] border-white/10 text-sm"
                      />
                    </div>
                    {/* Jumlah Kandang */}
                    <div>
                      <label htmlFor={isMultiKandangEnabled ? "kandang_count" : undefined} className={labelCls}>
                        {livestock === 'domba' ? 'Jumlah Kandang / Kelompok' : 'Jumlah Kandang / Pen'}
                      </label>
                      {isMultiKandangEnabled ? (
                        <InputNumber
                          id="kandang_count"
                          name="kandang_count"
                          value={form.kandang_count}
                          onChange={v => setField('kandang_count', v)}
                          min={1}
                          className="h-12 rounded-xl bg-[#111C24] border-white/10 text-sm"
                        />
                      ) : (
                        <>
                          <div className="h-12 px-4 rounded-xl bg-[#111C24] border border-white/10 flex items-center opacity-50">
                            <span className="text-sm text-white">1</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toast.info('Upgrade ke Business untuk kelola lebih dari 1 kandang')}
                            className="flex items-center gap-1.5 mt-1.5 bg-transparent border-none p-0 cursor-pointer"
                          >
                            <Lock size={11} className="text-amber-400" />
                            <span className="text-[11px] text-amber-400 font-medium">Multi-kandang di plan Business</span>
                          </button>
                        </>
                      )}
                      <p className="text-[#4B6478] text-[11px] mt-1.5 leading-snug">
                        Jumlah sub-kandang / divisi dalam satu lokasi
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Mulai Siklus */}
            {step === 3 && (
              <motion.div key="step3" {...stepMotion}>
                <h2 className="font-display text-2xl font-bold text-white">
                  {livestock === 'domba' ? 'Mulai Penggemukan Pertama' : 'Mulai Siklus Pertama'}
                </h2>
                <p className="text-[#94A3B8] text-sm mt-1 mb-6">
                  {livestock === 'domba' ? 'Isi populasi awal ternak bapak' : 'Opsional — kamu bisa skip dan tambahkan siklus nanti'}
                </p>
                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="doc_count" className={labelCls}>
                      {livestock === 'domba' ? 'Jumlah Ekor' : 'Jumlah DOC (Ekor)'}
                    </label>
                    <InputNumber
                      id="doc_count"
                      name="doc_count"
                      value={cycleForm.doc_count}
                      onChange={v => setCycleField('doc_count', v)}
                      min={1}
                      className="h-12 rounded-xl bg-[#111C24] border-white/10 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="start_date" className={labelCls}>
                      {livestock === 'domba' ? 'Tanggal Mulai Penggemukan' : 'Tanggal Masuk DOC'}
                    </label>
                    <DatePicker
                      id="start_date"
                      value={cycleForm.start_date}
                      onChange={v => setCycleField('start_date', v)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="target_weight_kg" className={labelCls}>
                        {livestock === 'domba' ? 'Target Berat Jual (kg)' : 'Target Berat Panen (kg)'}
                      </label>
                      <InputNumber
                        id="target_weight_kg"
                        name="target_weight_kg"
                        value={cycleForm.target_weight_kg}
                        onChange={v => setCycleField('target_weight_kg', v)}
                        min={0.1}
                        step={0.1}
                        placeholder={livestock === 'domba' ? '35.0' : '2.0'}
                        className="h-12 rounded-xl bg-[#111C24] border-white/10 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="sell_price_per_kg" className={labelCls}>
                        Harga Jual/kg (Rp){' '}
                        <span className="text-[#4B6478] font-normal normal-case tracking-normal">— opsional</span>
                      </label>
                      <InputRupiah
                        id="sell_price_per_kg"
                        name="sell_price_per_kg"
                        value={cycleForm.sell_price_per_kg}
                        onChange={v => setCycleField('sell_price_per_kg', v)}
                        placeholder="22000"
                        className="h-12 rounded-xl bg-[#111C24] border-white/10 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="mt-6 text-[#4B6478] text-sm underline cursor-pointer bg-transparent border-none p-0 hover:text-[#94A3B8] transition-colors text-left"
                >
                  Lewati untuk sekarang — setup siklus bisa dilakukan dari menu Siklus
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="px-8 pb-8 pt-4 border-t border-white/5 flex justify-between items-center shrink-0">
          {/* Back button — hidden on step 1 */}
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-2.5 border border-white/10 rounded-xl text-sm text-[#94A3B8] hover:text-white hover:border-white/20 transition-colors bg-transparent cursor-pointer"
            >
              <ChevronLeft size={16} />
              Kembali
            </button>
          ) : (
            <div />
          )}

          {/* Next / Finish button */}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !canNext1 : !canNext2}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all ${
                (step === 1 ? !canNext1 : !canNext2)
                  ? 'bg-purple-600 opacity-40 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 cursor-pointer'
              }`}
            >
              Lanjut
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all ${
                loading
                  ? 'bg-purple-600 opacity-60 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 cursor-pointer'
              }`}
            >
              {loading ? 'Menyimpan...' : 'Selesai Setup'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── UpgradeGate ──────────────────────────────────────────────────────────────

function UpgradeGate({ plan, currentCount, kandangLimit, onBack, onUpgrade }) {
  const isStarter = plan === 'starter'
  const fillPct   = Math.round((currentCount / Math.max(kandangLimit, 1)) * 100)
  const barColor  = fillPct >= 100 ? '#F87171' : fillPct >= 80 ? '#F59E0B' : '#34D399'

  const PLAN_META = {
    starter:  { label: 'Starter',  color: '#94A3B8' },
    pro:      { label: 'Pro',      color: '#34D399' },
    business: { label: 'Business', color: '#F59E0B' },
  }
  const meta = PLAN_META[plan] ?? PLAN_META.starter

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#06090F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#0C1319', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', borderRadius: 16, padding: 16, display: 'inline-flex' }}>
            <Lock size={28} color="#F59E0B" />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 18, color: '#F1F5F9', marginBottom: 8 }}>
            Limit Kandang Tercapai
          </h2>
          <p style={{ fontSize: 13, color: '#4B6478', lineHeight: 1.6 }}>
            {isStarter
              ? `Kamu sudah punya ${currentCount} kandang. Upgrade ke Pro untuk tambah 1 kandang lagi (total 2).`
              : `Kamu sudah punya ${currentCount} kandang. Upgrade ke Business untuk kandang unlimited.`}
          </p>
        </div>
        <div style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#4B6478', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plan aktif</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: meta.color, background: `${meta.color}18`, padding: '2px 10px', borderRadius: 99, border: `1px solid ${meta.color}30` }}>
              {meta.label}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>Penggunaan kandang</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F1F5F9' }}>
              {currentCount}/{kandangLimit >= 99 ? '∞' : kandangLimit}
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, fillPct)}%`, background: barColor, borderRadius: 99, transition: 'width 0.4s ease' }} />
          </div>
        </div>
        <button onClick={onUpgrade} style={{ width: '100%', background: '#10B981', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Sora' }}>
          Upgrade Sekarang
        </button>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#4B6478', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans', padding: '4px', textAlign: 'center' }}>
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  )
}
