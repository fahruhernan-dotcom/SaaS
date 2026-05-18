import { useState, useCallback } from 'react'
import {
  AlertCircle, AlertTriangle, Info, CheckCircle2,
  Search, Clock, Shield, Zap, Globe, Route,
  Copy, Check, X,
} from 'lucide-react'
import { formatDistanceToNow, format, subHours } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50

const LEVEL_STYLES = {
  error:   { cls: 'bg-red-500/10 text-red-400 border-red-500/20',   icon: <AlertCircle size={11} /> },
  warning: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <AlertTriangle size={11} /> },
  info:    { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: <Info size={11} /> },
}

const SOURCE_STYLES = {
  frontend:              { cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: <Globe size={10} /> },
  supabase:              { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   icon: <Shield size={10} /> },
  react_error_boundary:  { cls: 'bg-red-500/10 text-red-400 border-red-500/20',      icon: <Zap size={10} /> },
  unhandled_rejection:   { cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: <AlertCircle size={10} /> },
  route:                 { cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: <Route size={10} /> },
  action:                { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <Zap size={10} /> },
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchLogs({ level, source, resolved, search, page }) {
  let q = supabase
    .from('system_error_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (level && level !== 'all') q = q.eq('level', level)
  if (source && source !== 'all') q = q.eq('source', source)
  if (resolved === 'unresolved') q = q.eq('resolved', false)
  if (resolved === 'resolved') q = q.eq('resolved', true)
  if (search) q = q.ilike('error_message', `%${search}%`)

  const { data, error, count } = await q
  if (error) throw error
  return { data: data || [], count: count || 0 }
}

async function fetchSummary() {
  const since = subHours(new Date(), 24).toISOString()
  const { data, error } = await supabase
    .from('system_error_logs')
    .select('level, source, resolved, created_at')
    .gte('created_at', since)

  if (error) throw error
  const rows = data || []
  return {
    total24h: rows.length,
    unresolved: rows.filter(r => !r.resolved).length,
    policyErrors: rows.filter(r => r.source === 'supabase').length,
    frontendCrashes: rows.filter(r => ['react_error_boundary', 'frontend', 'unhandled_rejection'].includes(r.source)).length,
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, colorCls, icon }) {
  return (
    <Card className="bg-white/[0.02] border-white/[0.06] p-4 flex flex-col gap-1">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-1', colorCls + '/10')}>
        <span className={colorCls}>{icon}</span>
      </div>
      <div className="text-2xl font-black text-white">{value ?? '—'}</div>
      <div className="text-[11px] font-bold text-[#4B6478] uppercase tracking-wider">{label}</div>
    </Card>
  )
}

function LevelBadge({ level }) {
  const s = LEVEL_STYLES[level] || LEVEL_STYLES.info
  return (
    <Badge variant="outline" className={cn('text-[9px] font-black py-0.5 uppercase tracking-wider gap-1 shrink-0', s.cls)}>
      {s.icon} {level}
    </Badge>
  )
}

function SourceBadge({ source }) {
  const s = SOURCE_STYLES[source] || { cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: <Globe size={10} /> }
  return (
    <Badge variant="outline" className={cn('text-[9px] font-black py-0.5 uppercase tracking-wider gap-1 shrink-0', s.cls)}>
      {s.icon} {source?.replace('_', ' ')}
    </Badge>
  )
}

function LogRow({ log, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 hover:border-white/10 hover:bg-white/[0.04] transition-all active:scale-[0.99]"
    >
      <div className="flex items-start gap-2 mb-1.5">
        <LevelBadge level={log.level} />
        <SourceBadge source={log.source} />
        {log.resolved && (
          <Badge variant="outline" className="text-[9px] font-black py-0.5 uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <CheckCircle2 size={9} /> resolved
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-1 text-[#4B6478] shrink-0">
          <Clock size={9} />
          <span className="text-[9px] font-bold">
            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: idLocale })}
          </span>
        </div>
      </div>
      <p className="text-[12px] text-[#94A3B8] font-medium leading-snug line-clamp-2 text-left">
        {log.error_message || '(no message)'}
      </p>
      <div className="flex items-center gap-2 mt-1.5">
        {log.page_path && <span className="text-[10px] font-mono text-[#4B6478] truncate">{log.page_path}</span>}
        {log.component && <span className="text-[10px] text-[#4B6478]">· {log.component}</span>}
        {log.vertical && <span className="text-[10px] text-[#4B6478]">· {log.vertical}</span>}
      </div>
    </button>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#4B6478] hover:text-white transition-colors"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  )
}

function DetailSheet({ log, onClose, onResolved }) {
  const [note, setNote] = useState(log?.note || '')
  const [saving, setSaving] = useState(false)
  if (!log) return null

  const handleResolve = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('system_error_logs')
      .update({ resolved: !log.resolved, resolved_at: !log.resolved ? new Date().toISOString() : null, note: note || null })
      .eq('id', log.id)
    setSaving(false)
    if (error) { 
      logSupabaseError(error, { table: 'system_error_logs', operation: 'update', component: 'AdminInfo', actionName: 'admin.error_log.resolve' })
      toast.error('Gagal update: ' + error.message)
      return 
    }
    toast.success(!log.resolved ? 'Ditandai resolved.' : 'Dibuka kembali.')
    onResolved()
  }

  const stack = log.stack || log.error_details || null
  const meta = log.metadata && Object.keys(log.metadata).length > 0
    ? JSON.stringify(log.metadata, null, 2)
    : null

  return (
    <Sheet open onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-xl bg-[#0D1117] border-white/[0.08] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-white flex items-center gap-2">
            <LevelBadge level={log.level} />
            Detail Log
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 text-sm">
          {/* Meta row */}
          <div className="flex flex-wrap gap-2">
            <SourceBadge source={log.source} />
            {log.vertical && <Badge variant="outline" className="text-[9px] font-black uppercase bg-white/5 text-[#94A3B8] border-white/10">{log.vertical}</Badge>}
            {log.resolved && <Badge variant="outline" className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle2 size={9}/> resolved</Badge>}
          </div>

          {/* Time */}
          <div className="text-[#4B6478] text-xs">
            {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss', { locale: idLocale })}
          </div>

          {/* Error message */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider">Error Message</span>
              {log.error_message && <CopyButton text={log.error_message} />}
            </div>
            <p className="text-[#F1F5F9] text-[13px] leading-relaxed">{log.error_message || '—'}</p>
          </div>

          {/* Context */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {[
              ['Page', log.page_path],
              ['Component', log.component],
              ['Action', log.action_name],
              ['Error Code', log.error_code],
              ['Role', log.role],
              ['Tenant ID', log.tenant_id],
              ['User ID', log.user_id],
              ['App Version', log.app_version],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label} className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-2">
                <div className="text-[#4B6478] font-bold uppercase tracking-wider text-[9px] mb-1">{label}</div>
                <div className="text-[#94A3B8] font-mono break-all">{val}</div>
              </div>
            ))}
          </div>

          {/* Stack trace */}
          {stack && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider">Stack / Details</span>
                <CopyButton text={stack} />
              </div>
              <pre className="text-[11px] text-[#4B6478] font-mono whitespace-pre-wrap break-all overflow-auto max-h-48">{stack}</pre>
            </div>
          )}

          {/* Metadata */}
          {meta && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider">Metadata</span>
                <CopyButton text={meta} />
              </div>
              <pre className="text-[11px] text-[#4B6478] font-mono whitespace-pre-wrap break-all overflow-auto max-h-40">{meta}</pre>
            </div>
          )}

          {/* User agent */}
          {log.user_agent && (
            <div className="text-[10px] text-[#4B6478] font-mono break-all">{log.user_agent}</div>
          )}

          {/* Note */}
          <div>
            <label className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider block mb-1.5">Catatan</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Tambah catatan internal..."
              rows={2}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-[13px] text-[#F1F5F9] placeholder:text-[#4B6478] resize-none outline-none focus:border-white/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pb-4">
            <button
              onClick={handleResolve}
              disabled={saving}
              className={cn(
                'flex-1 py-3 rounded-xl font-bold text-[13px] transition-all',
                log.resolved
                  ? 'bg-white/[0.06] text-[#4B6478] hover:bg-white/[0.10]'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
              )}
            >
              {saving ? 'Menyimpan…' : log.resolved ? 'Buka Kembali' : 'Tandai Resolved'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#4B6478] hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminInfo() {
  const qc = useQueryClient()
  const [level, setLevel] = useState('all')
  const [source, setSource] = useState('all')
  const [resolved, setResolved] = useState('unresolved')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selectedLog, setSelectedLog] = useState(null)

  // Debounce search
  const handleSearch = useCallback((val) => {
    setSearch(val)
    clearTimeout(window._logSearchTimer)
    window._logSearchTimer = setTimeout(() => { setDebouncedSearch(val); setPage(0) }, 400)
  }, [])

  const { data: summary, isError: summaryError } = useQuery({
    queryKey: ['admin-log-summary'],
    queryFn: fetchSummary,
    staleTime: 60_000,
    retry: 1,
  })

  const { data: logsData, isLoading, isError: logsError } = useQuery({
    queryKey: ['admin-logs', level, source, resolved, debouncedSearch, page],
    queryFn: () => fetchLogs({ level, source, resolved, search: debouncedSearch, page }),
    staleTime: 30_000,
    retry: 1,
  })

  const logs = logsData?.data || []
  const totalCount = logsData?.count || 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handleResolved = () => {
    qc.invalidateQueries({ queryKey: ['admin-logs'] })
    qc.invalidateQueries({ queryKey: ['admin-log-summary'] })
    setSelectedLog(null)
  }

  return (
    <div className="min-h-screen bg-[#080D0F] px-4 py-6 pb-20 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">System Info</h1>
          <p className="text-[12px] text-[#4B6478] mt-0.5">Error log & debugging center</p>
        </div>
        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border-purple-500/20">
          <Shield size={9} /> Superadmin
        </Badge>
      </div>

      {/* Summary cards */}
      {!summaryError && (
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard label="Error 24 jam" value={summary?.total24h} colorCls="text-red-400" icon={<AlertCircle size={14} />} />
          <SummaryCard label="Unresolved" value={summary?.unresolved} colorCls="text-amber-400" icon={<AlertTriangle size={14} />} />
          <SummaryCard label="Supabase errors" value={summary?.policyErrors} colorCls="text-blue-400" icon={<Shield size={14} />} />
          <SummaryCard label="Frontend crashes" value={summary?.frontendCrashes} colorCls="text-purple-400" icon={<Zap size={14} />} />
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Cari pesan error..."
            className="pl-8 bg-white/[0.03] border-white/[0.08] text-[#F1F5F9] placeholder:text-[#4B6478] focus:border-white/20 text-[13px]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {/* Level */}
          {['all', 'error', 'warning', 'info'].map(l => (
            <button key={l} onClick={() => { setLevel(l); setPage(0) }}
              className={cn('shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors uppercase tracking-wide',
                level === l ? 'bg-white/10 text-white border-white/20' : 'bg-white/[0.02] text-[#4B6478] border-white/[0.06] hover:bg-white/[0.05]'
              )}>
              {l}
            </button>
          ))}
          <div className="w-px bg-white/10 shrink-0" />
          {/* Source */}
          {['all', 'frontend', 'supabase', 'react_error_boundary', 'unhandled_rejection', 'action'].map(s => (
            <button key={s} onClick={() => { setSource(s); setPage(0) }}
              className={cn('shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors',
                source === s ? 'bg-white/10 text-white border-white/20' : 'bg-white/[0.02] text-[#4B6478] border-white/[0.06] hover:bg-white/[0.05]'
              )}>
              {s.replace('_', ' ')}
            </button>
          ))}
          <div className="w-px bg-white/10 shrink-0" />
          {/* Resolved */}
          {[['unresolved', 'Unresolved'], ['resolved', 'Resolved'], ['all', 'Semua']].map(([v, label]) => (
            <button key={v} onClick={() => { setResolved(v); setPage(0) }}
              className={cn('shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors',
                resolved === v ? 'bg-white/10 text-white border-white/20' : 'bg-white/[0.02] text-[#4B6478] border-white/[0.06] hover:bg-white/[0.05]'
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {logsError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <AlertCircle size={20} className="text-red-400 mx-auto mb-2" />
          <p className="text-[13px] text-red-400 font-bold">Gagal memuat log.</p>
          <p className="text-[11px] text-[#4B6478] mt-1">Pastikan tabel system_error_logs sudah dibuat dan RLS dikonfigurasi.</p>
        </div>
      )}

      {/* Log list */}
      {!logsError && (
        <>
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-white/[0.02] border border-white/[0.05] rounded-xl animate-pulse" />
              ))
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-[14px] font-bold text-white">Belum ada error tercatat.</p>
                <p className="text-[12px] text-[#4B6478] mt-1">Error akan muncul di sini setelah logger aktif.</p>
              </div>
            ) : (
              logs.map(log => (
                <LogRow key={log.id} log={log} onClick={() => setSelectedLog(log)} />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#4B6478]">{totalCount} total · halaman {page + 1}/{totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] border border-white/[0.06] text-[#4B6478] disabled:opacity-30 hover:bg-white/[0.08]">
                  ← Prev
                </button>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] border border-white/[0.06] text-[#4B6478] disabled:opacity-30 hover:bg-white/[0.08]">
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail drawer */}
      {selectedLog && (
        <DetailSheet
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onResolved={handleResolved}
        />
      )}
    </div>
  )
}
