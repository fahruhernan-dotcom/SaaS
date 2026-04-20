// =============================================================
// TernakOS — Analisis Performa Page (Peternak · Pro+)
// Plan-gated. KPI cards, ADG/FCR trend chart, AI insights.
// =============================================================

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
} from 'recharts'
import {
  Brain, Sparkles, Lock, TrendingUp, TrendingDown,
  Minus, AlertTriangle, CheckCircle, MessageSquareText,
  RefreshCw, Loader2, ChevronRight, BarChart2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAIQuota } from '@/lib/hooks/useAIQuota'
import { useAIAssistant, AGENT_STATE } from '@/lib/useAIAssistant.jsx'
import { UPGRADE_MESSAGES } from '@/lib/constants/planGating'

// ── Vertical config ────────────────────────────────────────────
const VERTICAL_CONFIG = {
  peternak_broiler:          { label: 'Ayam Broiler',        table: 'breeding_cycles',             mode: 'broiler' },
  peternak_layer:            { label: 'Ayam Layer',          table: 'breeding_cycles',             mode: 'broiler' },
  peternak_sapi_penggemukan: { label: 'Sapi Penggemukan',    table: 'sapi_penggemukan_batches',    mode: 'sapi' },
  peternak_domba_penggemukan:{ label: 'Domba Penggemukan',   table: 'domba_penggemukan_batches',   mode: 'sapi' },
  peternak_kambing_penggemukan:{ label: 'Kambing Penggemukan', table: 'kambing_penggemukan_batches', mode: 'sapi' },
}

// ── Data hook ──────────────────────────────────────────────────
function usePerformaData(tenant, subType) {
  const cfg = VERTICAL_CONFIG[subType]
  return useQuery({
    queryKey: ['performa-data', tenant?.id, subType],
    queryFn: async () => {
      if (!cfg) return []
      const { data, error } = await supabase
        .from(cfg.table)
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(12)
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id && !!cfg,
    staleTime: 60_000,
  })
}

// ── KPI computation ────────────────────────────────────────────
function computeKPIs(rows, mode) {
  if (!rows?.length) return null

  if (mode === 'broiler') {
    const withFcr    = rows.filter(r => r.final_fcr > 0)
    const withIp     = rows.filter(r => r.final_ip_score > 0)
    const totalDoc   = rows.reduce((s, r) => s + (r.doc_count || 0), 0)
    const totalMati  = rows.reduce((s, r) => s + (r.total_mortality || 0), 0)
    const avgFcr     = withFcr.length ? withFcr.reduce((s, r) => s + r.final_fcr, 0) / withFcr.length : null
    const avgIp      = withIp.length  ? withIp.reduce((s, r)  => s + r.final_ip_score, 0) / withIp.length : null
    const mortalitas = totalDoc > 0 ? (totalMati / totalDoc) * 100 : null

    return {
      primary:   { label: 'FCR Rata-rata', value: avgFcr ? avgFcr.toFixed(2) : '—', unit: '', target: '≤ 1.7', good: avgFcr !== null && avgFcr <= 1.7 },
      secondary: { label: 'IP Score',      value: avgIp  ? Math.round(avgIp).toString() : '—', unit: '', target: '≥ 300', good: avgIp !== null && avgIp >= 300 },
      mortalitas:{ label: 'Mortalitas',    value: mortalitas !== null ? mortalitas.toFixed(1) : '—', unit: '%', target: '< 5%', good: mortalitas !== null && mortalitas < 5 },
      count:     { label: 'Total Siklus',  value: rows.length.toString(), unit: '' },
    }
  }

  // sapi / domba / kambing penggemukan
  const withAdg    = rows.filter(r => r.avg_adg_gram > 0)
  const totalIn    = rows.reduce((s, r) => s + (r.total_animals || 0), 0)
  const totalMati  = rows.reduce((s, r) => s + (r.mortality_count || 0), 0)
  const avgAdg     = withAdg.length ? withAdg.reduce((s, r) => s + parseFloat(r.avg_adg_gram), 0) / withAdg.length : null
  const mortalitas = totalIn > 0 ? (totalMati / totalIn) * 100 : null
  const active     = rows.filter(r => r.status === 'active').length

  return {
    primary:   { label: 'ADG Rata-rata', value: avgAdg ? Math.round(avgAdg).toString() : '—', unit: 'g/hr', target: '≥ 800 g/hr', good: avgAdg !== null && avgAdg >= 800 },
    secondary: { label: 'Batch Aktif',   value: active.toString(), unit: '', target: null, good: null },
    mortalitas:{ label: 'Mortalitas',    value: mortalitas !== null ? mortalitas.toFixed(1) : '—', unit: '%', target: '< 2%', good: mortalitas !== null && mortalitas < 2 },
    count:     { label: 'Total Batch',   value: rows.length.toString(), unit: '' },
  }
}

// ── Chart data builder ─────────────────────────────────────────
function buildChartData(rows, mode) {
  if (!rows?.length) return []
  const sliced = [...rows].reverse().slice(-8)

  if (mode === 'broiler') {
    return sliced.map((r, i) => ({
      name:  `S${r.cycle_number || (i + 1)}`,
      value: r.final_fcr ? parseFloat(r.final_fcr.toFixed(2)) : null,
      ip:    r.final_ip_score ? Math.round(r.final_ip_score) : null,
    })).filter(d => d.value !== null)
  }

  return sliced.map((r, i) => ({
    name:  r.batch_code || r.kandang_name || `B${i + 1}`,
    value: r.avg_adg_gram ? Math.round(parseFloat(r.avg_adg_gram)) : null,
  })).filter(d => d.value !== null)
}

// ── Build performance table rows ───────────────────────────────
function buildTableRows(rows, mode) {
  if (!rows?.length) return []
  if (mode === 'broiler') {
    return rows.slice(0, 8).map(r => ({
      id:    r.id,
      name:  `Siklus ${r.cycle_number || '—'}`,
      sub:   r.start_date ? new Date(r.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }) : '—',
      kpi1:  { label: 'FCR', value: r.final_fcr ? r.final_fcr.toFixed(2) : '—', good: r.final_fcr && r.final_fcr <= 1.7 },
      kpi2:  { label: 'Mortalitas', value: r.doc_count > 0 ? ((r.total_mortality / r.doc_count) * 100).toFixed(1) + '%' : '—', good: r.doc_count > 0 && (r.total_mortality / r.doc_count) < 0.05 },
      status: r.status,
    }))
  }

  return rows.slice(0, 8).map(r => ({
    id:    r.id,
    name:  r.batch_code || 'Batch',
    sub:   r.kandang_name || '—',
    kpi1:  { label: 'ADG', value: r.avg_adg_gram ? Math.round(r.avg_adg_gram) + ' g' : '—', good: r.avg_adg_gram && r.avg_adg_gram >= 800 },
    kpi2:  { label: 'Mortalitas', value: r.total_animals > 0 ? ((r.mortality_count / r.total_animals) * 100).toFixed(1) + '%' : '—', good: r.total_animals > 0 && (r.mortality_count / r.total_animals) < 0.02 },
    status: r.status,
  }))
}

// ── Insight parser ─────────────────────────────────────────────
function parseInsights(text) {
  if (!text) return []
  const lines = text.split('\n').filter(l => /^\d+\./.test(l.trim()))
  if (lines.length === 0) {
    // fallback: show raw text as single card
    return [{ priority: 'INFO', title: 'Insight AI', desc: text.trim() }]
  }
  return lines.slice(0, 3).map(line => {
    const priorityMatch = line.match(/\[(TINGGI|SEDANG|RENDAH|INFO)\]/i)
    const priority = priorityMatch?.[1]?.toUpperCase() || 'SEDANG'
    const cleaned  = line.replace(/^\d+\.\s*(\[.*?\]\s*)?/, '').trim()
    const dashIdx  = cleaned.indexOf(' — ')
    if (dashIdx > 0) {
      return { priority, title: cleaned.slice(0, dashIdx).trim(), desc: cleaned.slice(dashIdx + 3).trim() }
    }
    return { priority, title: cleaned, desc: '' }
  })
}

const PRIORITY_STYLE = {
  TINGGI: { bg: 'bg-red-500/10',    border: 'border-red-500/25',    text: 'text-red-400',    label: 'Prioritas Tinggi' },
  SEDANG: { bg: 'bg-amber-500/10',  border: 'border-amber-500/25',  text: 'text-amber-400',  label: 'Prioritas Sedang' },
  RENDAH: { bg: 'bg-emerald-500/10',border: 'border-emerald-500/25',text: 'text-emerald-400',label: 'Prioritas Rendah' },
  INFO:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/25',   text: 'text-blue-400',   label: 'Info' },
}

// ── Status badge ───────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:    { label: 'Aktif',    cls: 'bg-emerald-500/15 text-emerald-400' },
    closed:    { label: 'Selesai',  cls: 'bg-[#4B6478]/20 text-[#4B6478]' },
    harvested: { label: 'Panen',    cls: 'bg-blue-500/15 text-blue-400' },
    failed:    { label: 'Gagal',    cls: 'bg-red-500/15 text-red-400' },
    cancelled: { label: 'Batal',    cls: 'bg-red-500/10 text-red-300/60' },
  }
  const s = map[status] || map.closed
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${s.cls}`}>
      {s.label}
    </span>
  )
}

// ── KPI card ───────────────────────────────────────────────────
function KpiCard({ label, value, unit, target, good }) {
  const Icon = good === true ? TrendingUp : good === false ? TrendingDown : Minus
  const iconColor = good === true ? 'text-emerald-400' : good === false ? 'text-red-400' : 'text-[#4B6478]'

  return (
    <div className="bg-[#0C1319] border border-white/5 rounded-[20px] p-4 flex flex-col gap-2">
      <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-[26px] font-black text-white leading-none">{value}</span>
        {unit && <span className="text-[11px] font-bold text-[#4B6478] mb-0.5">{unit}</span>}
      </div>
      {target && (
        <div className="flex items-center gap-1">
          <Icon size={11} className={iconColor} />
          <span className={`text-[9px] font-bold ${iconColor}`}>Target {target}</span>
        </div>
      )}
    </div>
  )
}

// ── Plan upgrade wall ──────────────────────────────────────────
function UpgradeWall() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-[#0C1319]">
      {/* blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40 p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['ADG', 'FCR', 'Mortalitas', 'Siklus'].map(l => (
            <div key={l} className="bg-[#111C24] rounded-[16px] p-4 h-24" />
          ))}
        </div>
        <div className="bg-[#111C24] rounded-[16px] h-48" />
      </div>
      {/* overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 bg-[#06090F]/80 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
          <Lock size={20} className="text-amber-400" />
        </div>
        <div className="text-center">
          <p className="font-black text-white text-[15px] mb-1">Analisis Performa — Pro</p>
          <p className="text-[12px] text-[#4B6478] max-w-xs mx-auto leading-relaxed">
            {UPGRADE_MESSAGES.analisis_performa}
          </p>
        </div>
        <Link
          to="/upgrade"
          className="h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#06090F] font-black text-[12px] uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          <TrendingUp size={14} />
          Upgrade ke Pro
        </Link>
      </div>
    </div>
  )
}

// ── Custom tooltip ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0C1319] border border-white/10 rounded-xl px-3 py-2">
      <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[13px] font-black text-white">{payload[0].value}{unit}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
export default function AnalisisPerformaPage() {
  const { tenant, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const { canUseFeature } = useAIQuota(tenant)
  const isPro = canUseFeature('analisis_performa')

  const subType = profile?.sub_type || 'peternak_broiler'
  const cfg     = VERTICAL_CONFIG[subType] || VERTICAL_CONFIG.peternak_broiler
  const mode    = cfg.mode

  const { data: rows = [], isLoading: dataLoading, error: dataError, refetch } = usePerformaData(tenant, subType)
  const kpis      = useMemo(() => computeKPIs(rows, mode), [rows, mode])
  const chartData = useMemo(() => buildChartData(rows, mode), [rows, mode])
  const tableRows = useMemo(() => buildTableRows(rows, mode), [rows, mode])

  const peternakBase = `/peternak/${subType}`
  const chartUnit    = mode === 'broiler' ? '' : ' g/hr'
  const chartLabel   = mode === 'broiler' ? 'FCR' : 'ADG (g/hr)'

  // ── AI Insight ──────────────────────────────────────────────
  const {
    messages: insightMessages,
    agentState: insightState,
    isLoading: insightLoading,
    sendMessage: sendInsight,
    resetConversation: resetInsight,
  } = useAIAssistant({ userType: 'peternak', contextPage: location.pathname })

  const [insights, setInsights] = useState([])
  const [insightGenerated, setInsightGenerated] = useState(false)

  const lastAssistantMsg = useMemo(() => {
    const assistantMsgs = insightMessages.filter(m => m.role === 'assistant')
    return assistantMsgs[assistantMsgs.length - 1]?.content || null
  }, [insightMessages])

  useEffect(() => {
    if (!insightLoading && lastAssistantMsg && insightGenerated) {
      setInsights(parseInsights(lastAssistantMsg))
    }
  }, [insightLoading, lastAssistantMsg, insightGenerated])

  const handleGenerateInsight = useCallback(() => {
    if (!kpis || insightLoading) return
    setInsightGenerated(true)
    setInsights([])

    const summaryLines = [
      `Data performa ${cfg.label} (${rows.length} batch/siklus terakhir):`,
      mode === 'broiler'
        ? `- FCR rata-rata: ${kpis.primary.value} (target ${kpis.primary.target})`
        : `- ADG rata-rata: ${kpis.primary.value} ${kpis.primary.unit} (target ${kpis.primary.target})`,
      `- Mortalitas: ${kpis.mortalitas.value}${kpis.mortalitas.unit} (target ${kpis.mortalitas.target})`,
      `- ${kpis.count.label}: ${kpis.count.value}`,
    ]

    const prompt = [
      summaryLines.join('\n'),
      '',
      'Berikan TEPAT 3 insight singkat dan actionable. Format WAJIB:',
      '1. [TINGGI] Judul singkat — Penjelasan 1 kalimat.',
      '2. [SEDANG] Judul singkat — Penjelasan 1 kalimat.',
      '3. [RENDAH] Judul singkat — Penjelasan 1 kalimat.',
    ].join('\n')

    if (insightGenerated) {
      resetInsight()
      setTimeout(() => sendInsight(prompt), 100)
    } else {
      sendInsight(prompt)
    }
  }, [kpis, cfg, mode, rows.length, insightLoading, insightGenerated, sendInsight, resetInsight])

  const handleTanyaLebihLanjut = useCallback(() => {
    const msg = lastAssistantMsg
      ? `Tindak lanjut insight: ${lastAssistantMsg.slice(0, 120)}...`
      : `Bantu analisis performa ${cfg.label} saya lebih detail.`
    navigate(`${peternakBase}/ai-chat`, { state: { initialPrompt: msg } })
  }, [lastAssistantMsg, cfg, peternakBase, navigate])

  // ── Render: plan gate ──────────────────────────────────────
  if (!isPro) {
    return (
      <div className="min-h-screen bg-[#06090F] px-4 py-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1">
            {cfg.label}
          </p>
          <h1 className="text-[22px] font-black text-white">Analisis Performa</h1>
        </div>
        <UpgradeWall />
      </div>
    )
  }

  // ── Render: loading ────────────────────────────────────────
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[#06090F] flex items-center justify-center">
        <Loader2 size={24} className="text-emerald-400 animate-spin" />
      </div>
    )
  }

  // ── Render: error ──────────────────────────────────────────
  if (dataError) {
    return (
      <div className="min-h-screen bg-[#06090F] flex flex-col items-center justify-center gap-3 p-8">
        <AlertTriangle size={24} className="text-red-400" />
        <p className="text-[13px] text-[#4B6478]">Gagal memuat data. Coba lagi.</p>
        <button onClick={() => refetch()}
          className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"
        >
          <RefreshCw size={12} /> Muat Ulang
        </button>
      </div>
    )
  }

  // ── Render: no data ────────────────────────────────────────
  const hasData = rows.length > 0

  return (
    <div className="min-h-screen bg-[#06090F] pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ─── Header ─── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1">
              {cfg.label}
            </p>
            <h1 className="text-[22px] font-black text-white leading-tight">Analisis Performa</h1>
          </div>
          <button onClick={() => refetch()}
            className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/8 flex items-center justify-center transition-colors"
            aria-label="Refresh data"
          >
            <RefreshCw size={13} className="text-[#4B6478]" />
          </button>
        </div>

        {/* ─── Empty state ─── */}
        {!hasData && (
          <div className="bg-[#0C1319] border border-white/5 rounded-[24px] p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <BarChart2 size={22} className="text-emerald-400/60" />
            </div>
            <div>
              <p className="font-black text-white text-[15px] mb-1">Belum ada data</p>
              <p className="text-[12px] text-[#4B6478] max-w-xs mx-auto leading-relaxed">
                Catat beberapa siklus atau batch terlebih dahulu agar analisis bisa ditampilkan.
              </p>
            </div>
            <Link to={`${peternakBase}/beranda`}
              className="h-9 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-black text-[11px] uppercase tracking-widest flex items-center gap-1.5 hover:bg-emerald-500/25 transition-colors"
            >
              <ChevronRight size={13} /> Ke Beranda
            </Link>
          </div>
        )}

        {hasData && (
          <>
            {/* ─── KPI Cards ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard {...kpis.primary} />
              <KpiCard {...kpis.secondary} />
              <KpiCard {...kpis.mortalitas} />
              <KpiCard {...kpis.count} />
            </div>

            {/* ─── Trend Chart ─── */}
            <div className="bg-[#0C1319] border border-white/5 rounded-[24px] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">
                  Tren {chartLabel}
                </p>
                <span className="text-[9px] font-bold text-[#4B6478]/60 uppercase tracking-widest">
                  {Math.min(rows.length, 8)} terakhir
                </span>
              </div>

              {chartData.length < 2 ? (
                <div className="h-40 flex items-center justify-center">
                  <p className="text-[12px] text-[#4B6478]">Data belum cukup untuk menampilkan tren.</p>
                </div>
              ) : (
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis
                        dataKey="name"
                        axisLine={false} tickLine={false}
                        tick={{ fill: '#4B6478', fontSize: 9, fontWeight: 800 }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false} tickLine={false}
                        tick={{ fill: '#4B6478', fontSize: 9, fontWeight: 800 }}
                        width={40}
                      />
                      <RechartsTooltip content={<CustomTooltip unit={chartUnit} />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        strokeWidth={2}
                        fill="url(#perfGradient)"
                        dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#10B981', strokeWidth: 0 }}
                        connectNulls={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* ─── AI Insight Section ─── */}
            <div className="bg-[#0C1319] border border-white/5 rounded-[24px] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <Brain size={14} className="text-emerald-400" />
                  </div>
                  <p className="text-[13px] font-black text-white">Insight AI</p>
                </div>
                <button
                  onClick={handleGenerateInsight}
                  disabled={insightLoading || !kpis}
                  className="h-8 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {insightLoading
                    ? <><Loader2 size={11} className="animate-spin" /> Menganalisa...</>
                    : <><Sparkles size={11} /> {insightGenerated ? 'Perbarui' : 'Generate'}</>
                  }
                </button>
              </div>

              {!insightGenerated && !insightLoading && (
                <div className="py-4 text-center">
                  <p className="text-[12px] text-[#4B6478] leading-relaxed">
                    Klik Generate untuk mendapatkan insight AI berdasarkan data performamu.
                  </p>
                </div>
              )}

              {insightLoading && insightState !== AGENT_STATE.ERROR && (
                <div className="flex flex-col gap-2.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-16 rounded-[16px] bg-white/[0.02] border border-white/5 animate-pulse" />
                  ))}
                </div>
              )}

              {insightState === AGENT_STATE.ERROR && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-200/80 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  Gagal memuat insight. Coba generate ulang.
                </div>
              )}

              {insights.length > 0 && !insightLoading && (
                <div className="flex flex-col gap-2.5">
                  {insights.map((ins, i) => {
                    const style = PRIORITY_STYLE[ins.priority] || PRIORITY_STYLE.SEDANG
                    return (
                      <div key={i} className={`p-3.5 rounded-[16px] border ${style.bg} ${style.border}`}>
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-0.5 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${style.bg} ${style.border} ${style.text} shrink-0`}>
                            {style.label}
                          </span>
                          <div>
                            <p className="text-[12px] font-black text-white leading-snug">{ins.title}</p>
                            {ins.desc && <p className="text-[11px] text-[#4B6478] mt-0.5 leading-relaxed">{ins.desc}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {insights.length > 0 && (
                <button
                  onClick={handleTanyaLebihLanjut}
                  className="w-full h-9 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/8 text-[11px] font-black text-[#4B6478] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquareText size={12} /> Tanya lebih lanjut
                </button>
              )}
            </div>

            {/* ─── Performance Table ─── */}
            <div className="bg-[#0C1319] border border-white/5 rounded-[24px] p-5">
              <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-4">
                Riwayat {mode === 'broiler' ? 'Siklus' : 'Batch'}
              </p>

              <div className="divide-y divide-white/[0.04]">
                {tableRows.map(row => (
                  <div key={row.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-black text-white truncate">{row.name}</p>
                      <p className="text-[10px] font-bold text-[#4B6478]">{row.sub}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className={`text-[12px] font-black ${row.kpi1.good ? 'text-emerald-400' : row.kpi1.good === false ? 'text-red-400' : 'text-[#4B6478]'}`}>
                          {row.kpi1.value}
                        </p>
                        <p className="text-[9px] font-bold text-[#4B6478] uppercase">{row.kpi1.label}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[12px] font-black ${row.kpi2.good ? 'text-emerald-400' : row.kpi2.good === false ? 'text-red-400' : 'text-[#4B6478]'}`}>
                          {row.kpi2.value}
                        </p>
                        <p className="text-[9px] font-bold text-[#4B6478] uppercase">{row.kpi2.label}</p>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── Footer CTA ─── */}
        <div className="flex items-center justify-center">
          <Link
            to={`${peternakBase}/ai-chat`}
            className="h-10 px-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500/20 transition-colors"
          >
            <MessageSquareText size={14} /> Tanya AI Assistant
          </Link>
        </div>

      </div>
    </div>
  )
}
