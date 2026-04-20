// =============================================================
// TernakOS — Prediksi Hasil Page (Peternak · Business Plan)
// Plan-gated (Business only). AI-powered sell-time prediction.
// Direct API call — does NOT use useAIAssistant staging flow.
// =============================================================

import React, { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Brain, Sparkles, Lock, TrendingUp, Calendar,
  AlertTriangle, RefreshCw, Loader2, CheckCircle,
  ChevronDown, Save, Clock, Target,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAIQuota } from '@/lib/hooks/useAIQuota'
import { UPGRADE_MESSAGES } from '@/lib/constants/planGating'
import { formatIDR } from '@/lib/format'

// ── Vertical config ────────────────────────────────────────────
const VERTICAL_CONFIG = {
  peternak_broiler:          { label: 'Ayam Broiler',          table: 'breeding_cycles',             mode: 'broiler' },
  peternak_layer:            { label: 'Ayam Layer',            table: 'breeding_cycles',             mode: 'broiler' },
  peternak_sapi_penggemukan: { label: 'Sapi Penggemukan',      table: 'sapi_penggemukan_batches',    mode: 'sapi' },
  peternak_domba_penggemukan:{ label: 'Domba Penggemukan',     table: 'domba_penggemukan_batches',   mode: 'sapi' },
  peternak_kambing_penggemukan:{ label: 'Kambing Penggemukan', table: 'kambing_penggemukan_batches', mode: 'sapi' },
}

// ── SelectWrap (Rule #67/#68) ──────────────────────────────────
function SelectWrap({ children, style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      {children}
      <ChevronDown
        size={14}
        style={{
          position: 'absolute', right: 12, top: '50%',
          transform: 'translateY(-50%)', color: '#4B6478', pointerEvents: 'none',
        }}
      />
    </div>
  )
}

// ── Direct AI call (MAIA → GLM fallback) ──────────────────────
async function callPredictionAI(messages) {
  const maiaKey = import.meta.env.VITE_MAIA_API_KEY
  const glmKey  = import.meta.env.VITE_GLM_API_KEY
  const model   = import.meta.env.VITE_AI_MODEL || 'xai/grok-4-1-fast-reasoning-latest'

  const fetchAI = async (url, key, modelName) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: modelName, temperature: 0.2, messages }),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(`${modelName} ${res.status}: ${txt.slice(0, 150)}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  try {
    return await fetchAI('https://api.maiarouter.ai/v1/chat/completions', maiaKey, model)
  } catch (maiaErr) {
    if (!glmKey) throw maiaErr
    return await fetchAI('https://open.bigmodel.cn/api/paas/v4/chat/completions', glmKey, 'glm-4.7-flash')
  }
}

// ── Parse JSON from AI text response ──────────────────────────
function parsePredictionJSON(text) {
  if (!text) return null
  const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
  const start   = cleaned.indexOf('{')
  const end     = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1))
    const required = ['estimasi_hari', 'estimasi_tanggal', 'estimasi_bobot_final', 'estimasi_pendapatan', 'estimasi_profit', 'confidence']
    if (!required.every(k => obj[k] !== undefined)) return null
    return obj
  } catch {
    return null
  }
}

// ── Active batches query (vertical-aware) ─────────────────────
function useActiveBatches(tenant, subType) {
  const cfg = VERTICAL_CONFIG[subType]
  return useQuery({
    queryKey: ['active-batches-pred', tenant?.id, subType],
    queryFn: async () => {
      if (!cfg) return []
      const selectCols = cfg.mode === 'broiler'
        ? 'id, cycle_number, doc_count, total_mortality, start_date, status'
        : 'id, batch_code, kandang_name, total_animals, mortality_count, avg_adg_gram, start_date, status'
      const { data, error } = await supabase
        .from(cfg.table)
        .select(selectCols)
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .eq('is_deleted', false)
        .order('start_date', { ascending: false })
        .limit(20)
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id && !!cfg,
    staleTime: 60_000,
  })
}

// ── Prediction history query ───────────────────────────────────
function usePrediksiHistory(tenant) {
  return useQuery({
    queryKey: ['prediksi-history', tenant?.id],
    queryFn: async () => {
      // Get recent tenant conversations
      const { data: convs, error: convErr } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(200)
      if (convErr) throw convErr
      if (!convs?.length) return []

      const convIds = convs.map(c => c.id)
      const { data, error } = await supabase
        .from('ai_pending_entries')
        .select('id, raw_input, parsed_data, ai_conversations(created_at, title)')
        .in('conversation_id', convIds)
        .eq('status', 'committed')
        .order('id', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []).filter(e => e.parsed_data?.intent === 'PREDIKSI_HASIL')
    },
    enabled: !!tenant?.id,
    staleTime: 60_000,
  })
}

// ── Helper: days in farm ───────────────────────────────────────
function daysInFarm(startDate) {
  if (!startDate) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(startDate)) / 86400000))
}

// ── Helper: batch display label ────────────────────────────────
function batchLabel(batch, mode) {
  if (mode === 'broiler') return `Siklus ${batch.cycle_number || '—'}`
  return batch.batch_code || batch.kandang_name || `Batch ${batch.id.slice(0, 6)}`
}

// ── Helper: batch summary for selected batch ───────────────────
function getBatchSummary(batch, mode) {
  if (!batch) return null
  const days = daysInFarm(batch.start_date)
  if (mode === 'broiler') {
    const alive = (batch.doc_count || 0) - (batch.total_mortality || 0)
    return { jumlahEkor: alive, days, adgGram: null, info: `${alive} ekor · ${days} hari` }
  }
  const alive = (batch.total_animals || 0) - (batch.mortality_count || 0)
  return { jumlahEkor: alive, days, adgGram: batch.avg_adg_gram || null, info: `${alive} ekor · ${days} hari · ADG ${batch.avg_adg_gram ? Math.round(batch.avg_adg_gram) + ' g/hr' : '—'}` }
}

// ── Confidence badge ───────────────────────────────────────────
function ConfidenceBadge({ confidence }) {
  const pct = Math.round(confidence)
  const color = pct >= 80 ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
              : pct >= 60 ? 'bg-amber-500/15 border-amber-500/25 text-amber-400'
              :             'bg-red-500/15 border-red-500/25 text-red-400'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${color}`}>
      <CheckCircle size={10} /> Akurasi estimasi: {pct}%
    </span>
  )
}

// ── Metric card ────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <div className="bg-[#111C24] border border-white/5 rounded-[16px] p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className={accent ? 'text-emerald-400' : 'text-[#4B6478]'} />
        <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">{label}</p>
      </div>
      <p className={`text-[18px] font-black leading-none ${accent ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#4B6478] mt-1">{sub}</p>}
    </div>
  )
}

// ── Upgrade wall ───────────────────────────────────────────────
function UpgradeWall({ plan }) {
  const isPro = plan === 'pro'
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-[#0C1319]">
      {/* blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-30 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111C24] rounded-[16px] h-28" />
          <div className="bg-[#111C24] rounded-[16px] h-28" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-[#111C24] rounded-[16px] h-20" />)}
        </div>
        <div className="bg-[#111C24] rounded-[16px] h-40" />
      </div>
      {/* overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-[#06090F]/85 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Lock size={20} className="text-emerald-400" />
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-black text-emerald-400 uppercase tracking-widest">BIZ</span>
        </div>
        <div className="text-center">
          <p className="font-black text-white text-[15px] mb-1">Prediksi Hasil — Business</p>
          <p className="text-[12px] text-[#4B6478] max-w-xs mx-auto leading-relaxed">
            {UPGRADE_MESSAGES.prediksi_hasil}
          </p>
          {isPro && (
            <p className="mt-2 text-[11px] text-amber-400/80 font-bold">
              Kamu sudah di plan Pro. Satu langkah lagi ke Business.
            </p>
          )}
        </div>
        <Link
          to="/upgrade"
          className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#06090F] font-black text-[12px] uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          <TrendingUp size={14} />
          Upgrade ke Business
        </Link>
      </div>
    </div>
  )
}

// ── Label for number input ─────────────────────────────────────
function FieldLabel({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

// ─────────────────────────────────────────────────────────────
export default function PrediksiHasilPage() {
  const { tenant, profile } = useAuth()
  const queryClient = useQueryClient()

  const { canUseFeature, plan } = useAIQuota(tenant)
  const isAllowed = canUseFeature('prediksi_hasil')

  const subType = profile?.sub_type || 'peternak_broiler'
  const cfg     = VERTICAL_CONFIG[subType] || VERTICAL_CONFIG.peternak_broiler
  const mode    = cfg.mode

  const peternakBase = `/peternak/${subType}`

  // ── Form state ────────────────────────────────────────────
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [targetWeight, setTargetWeight]       = useState('')
  const [marketPrice, setMarketPrice]         = useState('')
  const [dailyFeedCost, setDailyFeedCost]     = useState('')

  // ── Prediction output state ───────────────────────────────
  const [prediction, setPrediction]   = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [predError, setPredError]     = useState(false)
  const [savedThisSession, setSavedThisSession] = useState(false)

  // ── Data queries ─────────────────────────────────────────
  const { data: batches = [], isLoading: batchesLoading } = useActiveBatches(tenant, subType)
  const { data: history = [] }                             = usePrediksiHistory(tenant)

  const selectedBatch = useMemo(() => batches.find(b => b.id === selectedBatchId) || null, [batches, selectedBatchId])
  const batchSummary  = useMemo(() => getBatchSummary(selectedBatch, mode), [selectedBatch, mode])

  // ── Validation ────────────────────────────────────────────
  const validationErrors = useMemo(() => {
    const errors = {}
    if (!selectedBatchId)              errors.batch     = 'Pilih batch/siklus terlebih dahulu'
    if (!targetWeight || Number(targetWeight) <= 0)
                                        errors.weight    = 'Target berat harus lebih dari 0'
    if (!marketPrice  || Number(marketPrice) <= 0)
                                        errors.price     = 'Harga pasar harus lebih dari 0'
    if (!dailyFeedCost || Number(dailyFeedCost) <= 0)
                                        errors.feedCost  = 'Biaya pakan harian harus lebih dari 0'
    return errors
  }, [selectedBatchId, targetWeight, marketPrice, dailyFeedCost])

  const isFormValid = Object.keys(validationErrors).length === 0

  // ── Save mutation ─────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!prediction || !tenant?.id || !profile?.id) throw new Error('Data tidak lengkap')
      // 1. Create conversation record
      const { data: conv, error: convErr } = await supabase
        .from('ai_conversations')
        .insert({
          tenant_id:  tenant.id,
          profile_id: profile.id,
          title: `Prediksi: ${batchLabel(selectedBatch, mode)}`,
        })
        .select('id')
        .single()
      if (convErr) throw convErr

      // 2. Store prediction as pending entry (PREDIKSI_HASIL intent)
      const { error: entryErr } = await supabase
        .from('ai_pending_entries')
        .insert({
          conversation_id: conv.id,
          raw_input: JSON.stringify({ batch_id: selectedBatchId, targetWeight, marketPrice, dailyFeedCost }),
          parsed_data: {
            intent: 'PREDIKSI_HASIL',
            batch_label: batchLabel(selectedBatch, mode),
            form: { targetWeight, marketPrice, dailyFeedCost },
            result: prediction,
          },
          status: 'committed',
        })
      if (entryErr) throw entryErr
    },
    onSuccess: () => {
      toast.success('Prediksi disimpan ke riwayat!')
      setSavedThisSession(true)
      queryClient.invalidateQueries({ queryKey: ['prediksi-history', tenant?.id] })
    },
    onError: (err) => {
      toast.error('Gagal menyimpan: ' + err.message)
    },
  })

  // ── Handle calculate ──────────────────────────────────────
  const handleHitungPrediksi = useCallback(async () => {
    if (!isFormValid || isGenerating) return
    setIsGenerating(true)
    setPrediction(null)
    setPredError(false)
    setSavedThisSession(false)

    const days  = batchSummary?.days ?? 0
    const count = batchSummary?.jumlahEkor ?? 0
    const adg   = batchSummary?.adgGram ?? null

    const systemMsg = [
      `Kamu adalah analis peternakan TernakOS. Hitung prediksi waktu jual optimal.`,
      `Data ternak:`,
      `- Jenis: ${cfg.label}`,
      `- Jumlah ekor: ${count} ekor`,
      `- Hari dalam farm saat ini: ${days} hari`,
      adg ? `- ADG rata-rata: ${adg} g/hari` : `- ADG: tidak tersedia`,
      `- Target berat jual: ${targetWeight} kg/ekor`,
      `- Estimasi harga pasar: Rp ${Number(marketPrice).toLocaleString('id-ID')}/kg`,
      `- Biaya pakan harian (keseluruhan kandang): Rp ${Number(dailyFeedCost).toLocaleString('id-ID')}`,
      ``,
      `Hitung:`,
      `1. Hari tersisa (estimasi_hari) sampai mencapai target berat`,
      `2. Tanggal estimasi jual (estimasi_tanggal) format YYYY-MM-DD`,
      `3. Bobot final yang akan dicapai (estimasi_bobot_final) dalam kg/ekor`,
      `4. Total pendapatan (estimasi_pendapatan) = jumlah ekor × bobot final × harga pasar`,
      `5. Total estimasi profit (estimasi_profit) = pendapatan - (biaya pakan/hari × estimasi_hari)`,
      `6. Confidence (0-100): seberapa akurat prediksi ini berdasarkan kelengkapan data`,
      `7. Catatan singkat (catatan)`,
      `8. Array saran actionable (saran) maksimal 3 item`,
      ``,
      `Jawab HANYA dalam JSON (tanpa markdown, tanpa penjelasan):`,
      `{"estimasi_hari":number,"estimasi_tanggal":"YYYY-MM-DD","estimasi_bobot_final":number,"estimasi_pendapatan":number,"estimasi_profit":number,"confidence":number,"catatan":"string","saran":["string"]}`,
    ].join('\n')

    try {
      const rawText = await callPredictionAI([
        { role: 'system', content: systemMsg },
        { role: 'user',   content: `Hitung prediksi untuk ${batchLabel(selectedBatch, mode)}.` },
      ])
      const parsed = parsePredictionJSON(rawText)
      if (!parsed) {
        setPredError(true)
      } else {
        setPrediction(parsed)
      }
    } catch {
      setPredError(true)
    } finally {
      setIsGenerating(false)
    }
  }, [isFormValid, isGenerating, batchSummary, cfg, targetWeight, marketPrice, dailyFeedCost, selectedBatch, mode])

  // ── Handle reset ──────────────────────────────────────────
  const handleReset = useCallback(() => {
    setSelectedBatchId('')
    setTargetWeight('')
    setMarketPrice('')
    setDailyFeedCost('')
    setPrediction(null)
    setPredError(false)
    setSavedThisSession(false)
  }, [])

  // ── Render: plan gate ─────────────────────────────────────
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-[#06090F] px-4 py-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1">{cfg.label}</p>
          <h1 className="text-[22px] font-black text-white">Prediksi Hasil</h1>
        </div>
        <UpgradeWall plan={plan} />
      </div>
    )
  }

  // ── Render: main ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#06090F] pb-28">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ─── Header ─── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">{cfg.label}</p>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[8px] font-black text-emerald-400 uppercase tracking-widest">BIZ</span>
          </div>
          <h1 className="text-[22px] font-black text-white leading-tight">Prediksi Hasil</h1>
        </div>

        {/* ─── SECTION 1: Input Form ─── */}
        <div className="bg-[#0C1319] border border-white/5 rounded-[24px] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <Target size={13} className="text-emerald-400" />
            </div>
            <p className="text-[13px] font-black text-white">Parameter Prediksi</p>
          </div>

          {/* Batch selector */}
          <div>
            <FieldLabel htmlFor="pred-batch" required>
              Pilih {mode === 'broiler' ? 'Siklus' : 'Batch'} Aktif
            </FieldLabel>
            <SelectWrap>
              <select
                id="pred-batch"
                name="pred-batch"
                value={selectedBatchId}
                onChange={e => { setSelectedBatchId(e.target.value); setPrediction(null); setPredError(false) }}
                disabled={batchesLoading}
                style={{
                  width: '100%', height: 48, borderRadius: 12, background: '#111C24',
                  border: '1px solid rgba(255,255,255,0.08)', color: selectedBatchId ? '#F1F5F9' : '#4B6478',
                  fontSize: 13, fontWeight: 600, paddingLeft: 14, paddingRight: 36,
                  outline: 'none', appearance: 'none', WebkitAppearance: 'none',
                }}
              >
                <option value="" disabled>
                  {batchesLoading ? 'Memuat...' : batches.length === 0 ? 'Tidak ada batch aktif' : '— Pilih batch —'}
                </option>
                {batches.map(b => (
                  <option key={b.id} value={b.id} style={{ background: '#0C1319' }}>
                    {batchLabel(b, mode)}
                  </option>
                ))}
              </select>
            </SelectWrap>
            {/* Batch info line */}
            {batchSummary && (
              <p className="mt-1.5 text-[11px] text-[#4B6478] font-medium">
                <Clock size={10} className="inline mr-1" />
                {batchSummary.info}
              </p>
            )}
          </div>

          {/* Target weight */}
          <div>
            <FieldLabel htmlFor="pred-weight" required>Target Berat Jual (kg/ekor)</FieldLabel>
            <input
              id="pred-weight"
              name="pred-weight"
              type="number"
              min="0"
              step="0.1"
              value={targetWeight}
              onChange={e => setTargetWeight(e.target.value)}
              placeholder={mode === 'broiler' ? 'Contoh: 2.2' : 'Contoh: 350'}
              className="w-full h-12 rounded-xl bg-[#111C24] border border-white/8 px-3.5 text-[13px] font-semibold text-white placeholder:text-[#4B6478] focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
          </div>

          {/* Market price */}
          <div>
            <FieldLabel htmlFor="pred-price" required>Harga Pasar Estimasi (Rp/kg)</FieldLabel>
            <input
              id="pred-price"
              name="pred-price"
              type="number"
              min="0"
              step="100"
              value={marketPrice}
              onChange={e => setMarketPrice(e.target.value)}
              placeholder={mode === 'broiler' ? 'Contoh: 20000' : 'Contoh: 65000'}
              className="w-full h-12 rounded-xl bg-[#111C24] border border-white/8 px-3.5 text-[13px] font-semibold text-white placeholder:text-[#4B6478] focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
          </div>

          {/* Daily feed cost */}
          <div>
            <FieldLabel htmlFor="pred-feed" required>Biaya Pakan Harian Kandang (Rp)</FieldLabel>
            <input
              id="pred-feed"
              name="pred-feed"
              type="number"
              min="0"
              step="1000"
              value={dailyFeedCost}
              onChange={e => setDailyFeedCost(e.target.value)}
              placeholder="Contoh: 500000"
              className="w-full h-12 rounded-xl bg-[#111C24] border border-white/8 px-3.5 text-[13px] font-semibold text-white placeholder:text-[#4B6478] focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleHitungPrediksi}
            disabled={!isFormValid || isGenerating}
            className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/30 disabled:cursor-not-allowed text-[#06090F] font-black text-[13px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
          >
            {isGenerating
              ? <><Loader2 size={16} className="animate-spin text-[#06090F]" /> AI Sedang Menghitung...</>
              : <><Sparkles size={15} /> Hitung Prediksi</>
            }
          </button>
        </div>

        {/* ─── SECTION 2: Prediction Output ─── */}
        {isGenerating && !predError && !prediction && (
          <div className="bg-[#0C1319] border border-white/5 rounded-[24px] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <Brain size={13} className="text-emerald-400" />
              </div>
              <p className="text-[13px] font-black text-white">Memproses Prediksi...</p>
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-[14px] bg-white/[0.02] border border-white/4 animate-pulse" />
            ))}
          </div>
        )}

        {predError && (
          <div className="bg-[#0C1319] border border-white/5 rounded-[24px] p-5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[12px] font-black text-red-200">Prediksi gagal diproses</p>
                <p className="text-[11px] text-[#4B6478] mt-0.5">Pastikan data ternak cukup lengkap, lalu coba lagi.</p>
                <button
                  type="button"
                  onClick={handleHitungPrediksi}
                  className="mt-2 flex items-center gap-1.5 text-[11px] font-black text-red-300 hover:text-red-200 uppercase tracking-widest transition-colors"
                >
                  <RefreshCw size={11} /> Coba Ulang
                </button>
              </div>
            </div>
          </div>
        )}

        {prediction && !predError && (
          <div className="bg-[#0C1319] border border-white/5 rounded-[24px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <Brain size={13} className="text-emerald-400" />
                </div>
                <p className="text-[13px] font-black text-white">Hasil Prediksi</p>
              </div>
              <ConfidenceBadge confidence={prediction.confidence} />
            </div>

            {/* Main highlight card */}
            <div className="p-4 rounded-[18px] bg-emerald-500/10 border border-emerald-500/25 text-center">
              <p className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest mb-1">Waktu Jual Optimal</p>
              <p className="text-[26px] font-black text-emerald-400 leading-none">
                {(() => {
                  try { return new Date(prediction.estimasi_tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }
                  catch { return prediction.estimasi_tanggal }
                })()}
              </p>
              <p className="text-[12px] text-emerald-400/70 mt-1">{prediction.estimasi_hari} hari lagi</p>
            </div>

            {/* 4 metric cards */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={Clock}      label="Hari Tersisa"   value={`${prediction.estimasi_hari} hari`} />
              <MetricCard icon={Target}     label="Bobot Final"    value={`${prediction.estimasi_bobot_final} kg`} sub="per ekor" />
              <MetricCard icon={TrendingUp} label="Est. Pendapatan" value={formatIDR(prediction.estimasi_pendapatan)} accent />
              <MetricCard icon={TrendingUp} label="Est. Profit"    value={formatIDR(prediction.estimasi_profit)} accent={prediction.estimasi_profit > 0} />
            </div>

            {/* Saran */}
            {prediction.saran?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Saran AI</p>
                {prediction.saran.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-[12px] bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-emerald-400 text-[11px] font-black mt-0.5 shrink-0">{i + 1}.</span>
                    <p className="text-[12px] text-[#F1F5F9] leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Catatan */}
            {prediction.catatan && (
              <p className="text-[11px] text-[#4B6478] italic leading-relaxed px-1">
                Catatan: {prediction.catatan}
              </p>
            )}

            {/* Action row */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || savedThisSession}
                className="flex-1 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saveMutation.isPending
                  ? <Loader2 size={12} className="animate-spin" />
                  : savedThisSession ? <><CheckCircle size={12} /> Tersimpan</> : <><Save size={12} /> Simpan</>
                }
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="h-10 px-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/8 text-[#4B6478] font-black text-[11px] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={12} /> Hitung Ulang
              </button>
            </div>
          </div>
        )}

        {/* ─── SECTION 3: Riwayat Prediksi ─── */}
        {history.length > 0 && (
          <div className="bg-[#0C1319] border border-white/5 rounded-[24px] p-5">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-4">Riwayat Prediksi</p>

            <div className="divide-y divide-white/[0.04]">
              {history.map(entry => {
                const r     = entry.parsed_data?.result
                const label = entry.parsed_data?.batch_label || '—'
                const createdAt = entry.ai_conversations?.created_at
                const dateStr = createdAt
                  ? new Date(createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
                  : '—'
                return (
                  <div key={entry.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-black text-white truncate">{label}</p>
                      <p className="text-[10px] text-[#4B6478]">{dateStr}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      {r?.estimasi_tanggal && (
                        <p className="text-[11px] font-black text-emerald-400">
                          Jual: {(() => { try { return new Date(r.estimasi_tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) } catch { return r.estimasi_tanggal } })()}
                        </p>
                      )}
                      {r?.confidence !== undefined && (
                        <p className={`text-[9px] font-bold uppercase ${r.confidence >= 80 ? 'text-emerald-400' : r.confidence >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                          {Math.round(r.confidence)}% confidence
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── Footer CTA ─── */}
        <div className="flex items-center justify-center">
          <Link
            to={`${peternakBase}/ai-analysis`}
            className="h-10 px-5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/8 text-[#4B6478] font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            Lihat Analisis Performa
          </Link>
        </div>

      </div>
    </div>
  )
}
