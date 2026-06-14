import React, { useState, useEffect, useCallback } from 'react'
import {
  Globe, Play, Clock, CheckCircle2, XCircle,
  RefreshCw, Plus, Trash2, AlertTriangle,
  TrendingUp, Database, Zap, Eye, ChevronDown, ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtRp = v => v ? 'Rp ' + Number(v).toLocaleString('id-ID') : '-'
const fmtDate = iso => iso
  ? new Date(iso).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
  : '-'

const STATUS_META = {
  pending:  { label: 'Menunggu',  color: 'text-amber-400',   bg: 'bg-amber-500/10',  icon: Clock },
  running:  { label: 'Berjalan',  color: 'text-blue-400',    bg: 'bg-blue-500/10',   icon: RefreshCw },
  success:  { label: 'Berhasil',  color: 'text-emerald-400', bg: 'bg-emerald-500/10',icon: CheckCircle2 },
  error:    { label: 'Error',     color: 'text-red-400',     bg: 'bg-red-500/10',    icon: XCircle },
  dry_run:  { label: 'Dry Run',   color: 'text-purple-400',  bg: 'bg-purple-500/10', icon: Eye },
}

const KOMODITAS_OPTS = [
  { value: 'domba',   label: '🐑 Domba' },
  { value: 'kambing', label: '🐐 Kambing' },
  { value: 'sapi',    label: '🐄 Sapi' },
  { value: 'broiler', label: '🐔 Ayam Broiler' },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending
  const Icon = m.icon
  return (
    <span className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider', m.bg, m.color)}>
      <Icon size={10} className={status === 'running' ? 'animate-spin' : ''} />
      {m.label}
    </span>
  )
}

function RunRow({ run, onExpand, expanded }) {
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        onClick={onExpand}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
      >
        <ChevronRight
          size={14}
          className={cn('text-slate-500 transition-transform shrink-0', expanded && 'rotate-90')}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={run.status} />
            <span className="text-[10px] text-slate-400 font-mono">{run.id.substring(0,8)}…</span>
            <span className="text-[10px] text-slate-500">{fmtDate(run.started_at)}</span>
          </div>
        </div>
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-[11px] font-black text-white">
            {run.high_confidence_count} <span className="text-emerald-400">valid</span> / {run.prices_extracted} extracted
          </p>
          {run.avg_price_published && (
            <p className="text-[10px] text-emerald-400">{fmtRp(run.avg_price_published)}</p>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-3 border-t border-white/5 space-y-2 bg-black/20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Post Diambil',   val: run.posts_fetched },
              { label: 'Harga Extracted',val: run.prices_extracted },
              { label: 'Confidence ≥55%',val: run.high_confidence_count },
              { label: 'Dipublikasi',    val: run.avg_price_published ? fmtRp(run.avg_price_published) : (run.is_dry_run ? 'Dry Run' : '-') },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white/[0.03] rounded-lg p-2.5">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-black">{label}</p>
                <p className="text-[13px] font-black text-white mt-0.5">{val ?? 0}</p>
              </div>
            ))}
          </div>
          {run.error_message && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-[11px] text-red-400 font-mono">{run.error_message}</p>
            </div>
          )}
          {run.apify_run_id && (
            <p className="text-[10px] text-slate-600">
              Apify Run ID: <span className="font-mono text-slate-400">{run.apify_run_id}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function CandidatesPanel({ runId }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!runId) return
    supabase
      .from('fb_price_candidates')
      .select('*')
      .eq('run_id', runId)
      .order('confidence_score', { ascending: false })
      .limit(50)
      .then(({ data }) => { setCandidates(data || []); setLoading(false) })
  }, [runId])

  if (loading) return <p className="text-slate-500 text-xs">Memuat kandidat harga…</p>
  if (!candidates.length) return <p className="text-slate-500 text-xs">Tidak ada kandidat untuk run ini.</p>

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {candidates.map(c => (
        <div
          key={c.id}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm',
            c.is_accepted
              ? 'border-emerald-500/20 bg-emerald-500/5'
              : 'border-white/5 bg-white/[0.02]'
          )}
        >
          <div className={cn('w-2 h-2 rounded-full shrink-0', c.is_accepted ? 'bg-emerald-400' : 'bg-slate-600')} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-mono text-slate-300 truncate">{c.raw_text_snippet}</p>
            <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider">{c.price_type} · {c.region}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[12px] font-black text-white">{fmtRp(c.price_idr)}</p>
            <p className={cn('text-[9px] font-black', c.confidence_score >= 0.55 ? 'text-emerald-400' : 'text-slate-500')}>
              {(c.confidence_score * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ScraperHargaFB() {
  // State
  const [sources, setSources] = useState([])
  const [runs, setRuns] = useState([])
  const [loadingSources, setLoadingSources] = useState(true)
  const [loadingRuns, setLoadingRuns] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [selectedKomoditas, setSelectedKomoditas] = useState('domba')
  const [isDryRun, setIsDryRun] = useState(false)
  const [selectedSourceIds, setSelectedSourceIds] = useState([]) // empty = all active
  const [expandedRunId, setExpandedRunId] = useState(null)
  const [previewRunId, setPreviewRunId] = useState(null)
  const [feedback, setFeedback] = useState(null) // { type: 'success'|'error', msg }

  // New source form
  const [newSourceUrl, setNewSourceUrl] = useState('')
  const [newSourceName, setNewSourceName] = useState('')
  const [newSourceRegion, setNewSourceRegion] = useState('nasional')
  const [addingSource, setAddingSource] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // ── Load data ──────────────────────────────────────────────────────────────
  const fetchSources = useCallback(async () => {
    setLoadingSources(true)
    const { data } = await supabase
      .from('fb_scraper_sources')
      .select('*')
      .eq('komoditas', selectedKomoditas)
      .order('created_at', { ascending: false })
    setSources(data || [])
    setLoadingSources(false)
  }, [selectedKomoditas])

  const fetchRuns = useCallback(async () => {
    setLoadingRuns(true)
    const { data } = await supabase
      .from('fb_scraper_runs')
      .select('*')
      .eq('komoditas', selectedKomoditas)
      .order('started_at', { ascending: false })
      .limit(20)
    setRuns(data || [])
    setLoadingRuns(false)
  }, [selectedKomoditas])

  useEffect(() => { fetchSources(); fetchRuns() }, [fetchSources, fetchRuns])

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleScrape = async () => {
    setScraping(true)
    setFeedback(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-fb-harga`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceIds: selectedSourceIds,
            komoditas: selectedKomoditas,
            dryRun: isDryRun,
          }),
        }
      )
      const result = await resp.json()
      if (!resp.ok) throw new Error(result.error || 'Scraping gagal')
      setFeedback({
        type: 'success',
        msg: `Berhasil! ${result.summary.postsFetched} post diambil, ${result.summary.highConfidenceCount} harga valid${result.summary.avgPricePublished ? `, rata-rata ${fmtRp(result.summary.avgPricePublished)}` : ''}.`
      })
      if (result.runId) setPreviewRunId(result.runId)
      await fetchRuns()
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message })
    } finally {
      setScraping(false)
    }
  }

  const handleAddSource = async () => {
    if (!newSourceUrl.trim()) return
    setAddingSource(true)
    const { error } = await supabase.from('fb_scraper_sources').insert({
      page_url: newSourceUrl.trim(),
      page_name: newSourceName.trim() || null,
      komoditas: selectedKomoditas,
      region: newSourceRegion.trim() || 'nasional',
    })
    if (!error) {
      setNewSourceUrl(''); setNewSourceName(''); setNewSourceRegion('nasional')
      setShowAddForm(false)
      await fetchSources()
    }
    setAddingSource(false)
  }

  const handleToggleSource = async (id, is_active) => {
    await supabase.from('fb_scraper_sources').update({ is_active: !is_active }).eq('id', id)
    await fetchSources()
  }

  const handleDeleteSource = async (id) => {
    await supabase.from('fb_scraper_sources').delete().eq('id', id)
    await fetchSources()
  }

  const toggleSourceSelection = (id) => {
    setSelectedSourceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="py-6 space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Globe size={16} className="text-blue-400" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">Scraper Harga Facebook</h1>
          </div>
          <p className="text-[12px] text-slate-400">
            Ekstrak harga ternak dari postingan Facebook · Powered by Apify
          </p>
        </div>

        {/* Komoditas selector */}
        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
          {KOMODITAS_OPTS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSelectedKomoditas(opt.value); setSelectedSourceIds([]) }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border',
                selectedKomoditas === opt.value
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/[0.03] border-white/5 text-slate-500 hover:text-white'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={cn(
          'flex items-start gap-3 px-4 py-3 rounded-xl border text-[12px]',
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        )}>
          {feedback.type === 'success' ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <XCircle size={14} className="shrink-0 mt-0.5" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Left: Sources + Controls */}
        <div className="lg:col-span-2 space-y-4">

          {/* Source list */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Database size={12} />
                Sumber ({sources.length})
              </p>
              <button
                onClick={() => setShowAddForm(v => !v)}
                className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
              >
                <Plus size={12} className="text-emerald-400" />
              </button>
            </div>

            {showAddForm && (
              <div className="px-4 py-3 border-b border-white/5 space-y-2 bg-emerald-500/5">
                <input
                  value={newSourceUrl}
                  onChange={e => setNewSourceUrl(e.target.value)}
                  placeholder="https://www.facebook.com/groups/..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40"
                />
                <div className="flex gap-2">
                  <input
                    value={newSourceName}
                    onChange={e => setNewSourceName(e.target.value)}
                    placeholder="Nama halaman (opsional)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40"
                  />
                  <input
                    value={newSourceRegion}
                    onChange={e => setNewSourceRegion(e.target.value)}
                    placeholder="Region"
                    className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40"
                  />
                </div>
                <button
                  onClick={handleAddSource}
                  disabled={addingSource || !newSourceUrl.trim()}
                  className="w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-black text-emerald-400 uppercase tracking-wider hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  {addingSource ? 'Menyimpan…' : 'Simpan Sumber'}
                </button>
              </div>
            )}

            <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
              {loadingSources ? (
                <p className="px-4 py-4 text-[11px] text-slate-500">Memuat…</p>
              ) : sources.length === 0 ? (
                <p className="px-4 py-4 text-[11px] text-slate-500">Belum ada sumber. Tambahkan di atas.</p>
              ) : sources.map(src => (
                <div
                  key={src.id}
                  onClick={() => toggleSourceSelection(src.id)}
                  className={cn(
                    'flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors group',
                    selectedSourceIds.includes(src.id)
                      ? 'bg-emerald-500/10'
                      : 'hover:bg-white/[0.02]',
                    !src.is_active && 'opacity-40'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded border shrink-0 flex items-center justify-center',
                    selectedSourceIds.includes(src.id)
                      ? 'bg-emerald-500 border-emerald-400'
                      : 'border-white/20 bg-white/5'
                  )}>
                    {selectedSourceIds.includes(src.id) && (
                      <CheckCircle2 size={10} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">
                      {src.page_name || src.page_url.replace('https://www.facebook.com/', '')}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">{src.region}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); handleToggleSource(src.id, src.is_active) }}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 text-slate-500 hover:text-amber-400"
                      title={src.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      <Zap size={10} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteSource(src.id) }}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/10 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {selectedSourceIds.length > 0 && (
              <div className="px-4 py-2 border-t border-white/5 bg-emerald-500/5">
                <p className="text-[10px] text-emerald-400">
                  {selectedSourceIds.length} sumber dipilih · kosongkan untuk pakai semua aktif
                </p>
              </div>
            )}
          </div>

          {/* Run controls */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Play size={12} />
              Jalankan Scraper
            </p>

            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setIsDryRun(v => !v)}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-colors',
                  isDryRun ? 'bg-purple-500' : 'bg-white/10'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  isDryRun ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </div>
              <span className="text-[12px] text-slate-400">
                {isDryRun ? '🧪 Dry Run (tidak simpan ke market_prices)' : '📤 Live (simpan harga valid)'}
              </span>
            </label>

            {!isDryRun && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-300">
                  Mode Live akan menulis ke tabel <code className="font-mono">market_prices</code> jika ditemukan harga confidence ≥55%.
                </p>
              </div>
            )}

            <button
              onClick={handleScrape}
              disabled={scraping}
              className={cn(
                'w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all active:scale-[0.98]',
                scraping
                  ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 hover:from-emerald-500/30 hover:to-teal-500/20'
              )}
            >
              {scraping
                ? <><RefreshCw size={14} className="animate-spin" /> Scraping…</>
                : <><Play size={14} /> Scrape Sekarang</>
              }
            </button>
          </div>
        </div>

        {/* Right: Run history + Candidates */}
        <div className="lg:col-span-3 space-y-4">

          {/* Latest run stats */}
          {runs[0] && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Run Terakhir',    val: fmtDate(runs[0].started_at), icon: Clock },
                { label: 'Harga Valid',     val: runs[0].high_confidence_count, icon: TrendingUp },
                { label: 'Rata-rata Harga', val: fmtRp(runs[0].avg_price_published) || '-', icon: Database },
              ].map(({ label, val, icon: Icon }) => (
                <div key={label} className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon size={10} className="text-slate-500" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{label}</p>
                  </div>
                  <p className="text-[13px] font-black text-white leading-tight">{val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Run history */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
                Riwayat Run
              </p>
              <button
                onClick={fetchRuns}
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
              >
                <RefreshCw size={12} />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {loadingRuns ? (
                <p className="text-center text-[11px] text-slate-500 py-6">Memuat riwayat…</p>
              ) : runs.length === 0 ? (
                <p className="text-center text-[11px] text-slate-500 py-8">
                  Belum ada run. Klik "Scrape Sekarang" untuk memulai.
                </p>
              ) : runs.map(run => (
                <RunRow
                  key={run.id}
                  run={run}
                  expanded={expandedRunId === run.id}
                  onExpand={() => {
                    setExpandedRunId(prev => prev === run.id ? null : run.id)
                    setPreviewRunId(run.id)
                  }}
                />
              ))}
            </div>
          </div>

          {/* Candidate price preview */}
          {previewRunId && (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Eye size={12} />
                  Kandidat Harga
                  <span className="text-[9px] text-slate-500 font-mono normal-case">
                    run #{previewRunId.substring(0,8)}
                  </span>
                </p>
                <div className="flex items-center gap-2 text-[9px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    Accepted (≥55%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
                    Rejected
                  </span>
                </div>
              </div>
              <div className="p-3">
                <CandidatesPanel runId={previewRunId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
