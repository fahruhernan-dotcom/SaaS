// =============================================================
// TernakOS — Tanya AI Page (Peternak)
// Full-page dedicated chat. Desktop: split view. Mobile: tabs.
// =============================================================

import React, { useRef, useEffect, useState } from 'react'
import { Send, Loader2, RotateCcw, AlertCircle, RefreshCw, Bot, Sparkles, MessageSquare, Clock, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { AGENT_STATE } from '@/lib/useAIAssistant.jsx'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { UPGRADE_MESSAGES } from '@/lib/constants/planGating'
import AIConfirmCard from '@/dashboard/_shared/components/AIConfirmCard'
import AISuccessCard from '@/dashboard/broker/ai/AISuccessCard'
import { usePeternakChat } from './usePeternakChat'

// ── Vertical display labels ───────────────────────────────────
const VERTICAL_LABELS = {
  sapi_penggemukan:  'Sapi Penggemukan',
  domba_penggemukan: 'Domba Penggemukan',
  broiler:           'Ayam Broiler',
  layer:             'Ayam Layer',
  kambing:           'Kambing',
  generic:           'Peternak',
}

// ── Quick prompt suggestions ──────────────────────────────────
const QUICK_PROMPTS = [
  'Catat pakan hari ini',
  'Berapa stok pakan tersisa?',
  'Rekap harian kandang',
]

// ── Empty state SVG ───────────────────────────────────────────
function EmptyStateIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="8" y="16" width="52" height="38" rx="10" fill="#10B981" fillOpacity="0.12" stroke="#10B981" strokeOpacity="0.3" strokeWidth="1.5"/>
      <rect x="16" y="26" width="28" height="3" rx="1.5" fill="#10B981" fillOpacity="0.4"/>
      <rect x="16" y="33" width="20" height="3" rx="1.5" fill="#10B981" fillOpacity="0.25"/>
      <rect x="16" y="40" width="24" height="3" rx="1.5" fill="#10B981" fillOpacity="0.25"/>
      <path d="M14 54 L8 62" stroke="#10B981" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="58" cy="52" r="14" fill="#0C1319" stroke="#10B981" strokeOpacity="0.3" strokeWidth="1.5"/>
      <path d="M53 52 L57 56 L63 48" stroke="#10B981" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Loading dots ──────────────────────────────────────────────
function TypingIndicator({ onCancel }) {
  return (
    <div className="flex justify-start">
      <div className="bg-[#1e293b]/50 border border-[#4B6478]/20 rounded-2xl px-3 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5 items-center">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-emerald-500/30 rounded-full animate-bounce" />
        </div>
        <span className="text-[11px] font-bold text-[#4B6478] uppercase tracking-wider">Lagi mikir...</span>
        <button type="button" onClick={onCancel}
          className="ml-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-500/20 transition-all"
        >
          Batal
        </button>
      </div>
    </div>
  )
}

// ── Chat thread (shared between desktop and mobile) ───────────
function ChatThread({
  displayMessages, agentState, isLoading, error,
  pendingEntries, pendingCount,
  undoEntry, undoCountdown, undoLastConfirm,
  lastFailedMessage, retryLastMessage,
  unresolvedEntities, resolveEntity,
  isEntryLocked, getEntryParent,
  editEntryField, cancelAI,
  handleCommit, handleReject,
  handleSend, vertical, userRole,
  formatTime,
  showCardsInline = true,
}) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [displayMessages, isLoading, pendingEntries, undoEntry])

  const isEmpty = displayMessages.length === 0 ||
    (displayMessages.length === 1 && displayMessages[0].role === 'assistant' && !displayMessages[0].timestamp_real)

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
      {/* Empty state */}
      {displayMessages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-4 py-10">
          <EmptyStateIllustration />
          <div className="text-center space-y-1">
            <p className="text-[14px] font-bold text-white">Mulai percakapan dengan AI</p>
            <p className="text-[12px] text-[#4B6478]">Tanya atau catat apa saja tentang ternakmu</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[12px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {displayMessages.map((msg, i) => (
        <div key={i}>
          <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Bot size={13} className="text-emerald-400" />
              </div>
            )}
            <div className={`max-w-[80%] lg:max-w-[75%] px-3.5 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-emerald-500/20 text-emerald-50 rounded-br-md'
                : 'bg-[#0C1319] border border-white/5 text-[#F1F5F9] rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
          <p className={`text-[9px] font-bold text-[#4B6478]/60 mt-1 ${msg.role === 'user' ? 'text-right pr-1' : 'pl-9'}`}>
            {formatTime(msg.timestamp)}
          </p>
        </div>
      ))}

      {/* Typing indicator */}
      {(agentState === AGENT_STATE.THINKING || agentState === AGENT_STATE.PRE_CHECKING) && !error && (
        <div className="pl-9">
          <TypingIndicator onCancel={cancelAI} />
        </div>
      )}

      {/* Error */}
      {agentState === AGENT_STATE.ERROR && (
        <div className="mx-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[12px] text-red-200/80">Gagal memproses. Coba lagi?</p>
            {lastFailedMessage && (
              <button type="button" onClick={retryLastMessage}
                className="mt-2 flex items-center gap-1.5 text-[11px] font-black text-red-300 hover:text-red-200 uppercase tracking-widest transition-colors"
              >
                <RefreshCw size={11} /> Coba Ulang
              </button>
            )}
          </div>
        </div>
      )}

      {/* Undo card */}
      {undoEntry && undoCountdown > 0 && (
        <AISuccessCard
          entry={undoEntry.entry}
          onUndo={undoLastConfirm}
          onClose={() => {}}
          undoCountdown={undoCountdown}
        />
      )}

      {/* Confirm cards inline (desktop) */}
      {showCardsInline && pendingEntries.map((entry, idx) => (
        <div key={entry.id || idx} className="pl-9">
          <AIConfirmCard
            pendingEntry={entry}
            queuePosition={idx + 1}
            queueTotal={pendingCount}
            onConfirm={() => handleCommit(entry.id)}
            onCommit={handleCommit}
            onReject={() => handleReject(entry.id)}
            onEdit={editEntryField}
            isLoading={isLoading}
            unresolvedEntities={unresolvedEntities}
            onResolveEntity={resolveEntity}
            isLocked={isEntryLocked(entry)}
            parentIntent={getEntryParent(entry)?.intent}
            vertical={vertical}
            userRole={userRole}
          />
        </div>
      ))}
    </div>
  )
}

// ── Input area (shared) ───────────────────────────────────────
function ChatInput({ quotaStatus, remaining, isLoading, input, setInput, handleSend, handleKeyDown }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = '40px'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 140) + 'px'
    }
  }, [input])

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  if (quotaStatus === 'exceeded') {
    return (
      <div className="flex flex-col items-center p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center gap-2.5">
        <p className="text-[12px] font-bold text-red-200/90 leading-relaxed">
          {UPGRADE_MESSAGES.chat_exceeded}
        </p>
        <Link
          to="/upgrade"
          className="h-9 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#06090F] font-black text-[12px] uppercase tracking-widest flex items-center justify-center transition-colors"
        >
          Lihat Plan
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {quotaStatus === 'warning' && (
        <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold text-amber-300">Sisa {remaining} sesi AI bulan ini.</p>
          <Link to="/upgrade" className="text-[10px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest shrink-0 transition-colors">
            Upgrade →
          </Link>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik catatan atau pertanyaanmu..."
          rows={1}
          spellCheck={false}
          className="flex-1 resize-none bg-[#111C24] border border-white/8 rounded-xl px-4 py-3 text-[14px] font-medium text-white placeholder:text-[#4B6478] focus:outline-none focus:border-emerald-500/40 transition-colors leading-relaxed"
          style={{ maxHeight: '140px', minHeight: '44px' }}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="w-11 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0 shadow-lg shadow-emerald-500/15 active:scale-95"
          aria-label="Kirim pesan"
        >
          {isLoading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
        </button>
      </div>
      <p className="text-[9px] font-bold text-[#4B6478]/40 text-center uppercase tracking-widest">
        AI bisa salah · Selalu cek data · Undo tersedia 8 detik
      </p>
    </div>
  )
}

// ── Info panel (left column / info tab) ──────────────────────
function InfoPanel({ tenant, vertical, messages, pendingCount, resetConversation }) {
  const todayMessages = messages.filter(m => {
    if (!m.timestamp) return false
    const d = new Date(m.timestamp)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  })

  const verticalLabel = VERTICAL_LABELS[vertical] || vertical

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Business header */}
      <div className="bg-[#111C24] rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Bisnis Aktif</p>
            <h2 className="text-[15px] font-black text-white tracking-tight mt-0.5 leading-tight">
              {tenant?.business_name || 'Peternakan Anda'}
            </h2>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-wider">
            {verticalLabel}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="bg-white/[0.03] rounded-xl p-2.5 text-center border border-white/5">
            <p className="text-[18px] font-black text-white tabular-nums">{todayMessages.length}</p>
            <p className="text-[10px] font-bold text-[#4B6478] mt-0.5">Pesan hari ini</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-2.5 text-center border border-white/5">
            <p className="text-[18px] font-black text-white tabular-nums">{pendingCount}</p>
            <p className="text-[10px] font-bold text-[#4B6478] mt-0.5">Menunggu konfirmasi</p>
          </div>
        </div>
      </div>

      {/* Today's conversation history */}
      <div className="flex-1 bg-[#111C24] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-[#4B6478]" />
            <span className="text-[11px] font-black text-[#4B6478] uppercase tracking-widest">Riwayat Hari Ini</span>
          </div>
          {messages.length > 0 && (
            <button type="button" onClick={resetConversation}
              className="flex items-center gap-1.5 text-[10px] font-black text-[#4B6478] hover:text-red-400 uppercase tracking-widest transition-colors"
            >
              <RotateCcw size={11} /> Bersihkan
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          {todayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-6">
              <MessageSquare size={24} className="text-[#4B6478]/40" />
              <p className="text-[11px] text-[#4B6478]/60 text-center">Belum ada percakapan hari ini</p>
            </div>
          ) : (
            todayMessages.map((msg, i) => (
              <div key={i} className={`flex gap-2 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-1 h-1 rounded-full mt-2 shrink-0 ${msg.role === 'user' ? 'bg-emerald-400' : 'bg-[#4B6478]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#94A3B8] truncate leading-relaxed">{msg.content}</p>
                  <p className="text-[9px] text-[#4B6478]/60 mt-0.5">
                    {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Mobile bottom sheet for pending entries ───────────────────
function BottomSheet({ isOpen, pendingEntries, pendingCount, onClose, ...cardProps }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[40] bg-black/60"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[50] bg-[#0C1319] rounded-t-3xl border-t border-white/8 p-4 space-y-3 max-h-[75vh] overflow-y-auto scrollbar-thin"
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] font-black text-white uppercase tracking-widest">
            {pendingCount > 1 ? `${pendingCount} Catatan Menunggu` : 'Konfirmasi Catatan'}
          </p>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center"
          >
            <X size={14} className="text-[#4B6478]" />
          </button>
        </div>
        {pendingEntries.map((entry, idx) => (
          <AIConfirmCard
            key={entry.id || idx}
            pendingEntry={entry}
            queuePosition={idx + 1}
            queueTotal={pendingCount}
            {...cardProps}
            onConfirm={() => cardProps.handleCommit(entry.id)}
            onCommit={cardProps.handleCommit}
            onReject={() => cardProps.handleReject(entry.id)}
          />
        ))}
      </div>
    </>
  )
}

// =============================================================
// Main Page
// =============================================================
export default function TanyaAIPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const location  = useLocation()
  const [mobileTab, setMobileTab] = useState('chat') // 'chat' | 'info'

  const {
    tenant, vertical, userRole,
    messages, displayMessages, agentState, isLoading, error,
    pendingEntries, pendingCount,
    unresolvedEntities, resolveEntity,
    undoEntry, undoLastConfirm, undoCountdown,
    lastFailedMessage, retryLastMessage,
    isEntryLocked, getEntryParent,
    editEntryField, resetConversation, cancelAI,
    quotaStatus, remaining, canUseFeature,
    input, setInput, setHasOpened,
    handleCommit, handleReject, handleSend, handleKeyDown,
    formatTime,
  } = usePeternakChat({ contextPage: 'tanya-ai', initialOpened: true })

  // Mark as opened on mount
  useEffect(() => { setHasOpened(true) }, [setHasOpened])

  // Auto-send initialPrompt from route state (e.g. from AnalisisPerformaPage)
  useEffect(() => {
    const prompt = location.state?.initialPrompt
    if (!prompt) return
    const timer = setTimeout(() => handleSend(prompt), 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chatProps = {
    displayMessages, agentState, isLoading, error,
    pendingEntries, pendingCount,
    undoEntry, undoCountdown, undoLastConfirm,
    lastFailedMessage, retryLastMessage,
    unresolvedEntities, resolveEntity,
    isEntryLocked, getEntryParent,
    editEntryField, cancelAI,
    handleCommit, handleReject,
    handleSend, vertical, userRole,
    formatTime,
  }

  const cardProps = {
    isLoading, unresolvedEntities, resolveEntity,
    editEntryField, vertical, userRole,
    isEntryLocked, getEntryParent,
    handleCommit, handleReject,
  }

  // ── Upgrade wall ──────────────────────────────────────────
  const ChatUnavailable = () => (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <Sparkles size={28} className="text-amber-400" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-[15px] font-black text-white">Fitur AI Tersedia di Plan Pro</h3>
        <p className="text-[13px] text-[#4B6478] max-w-xs leading-relaxed">
          {UPGRADE_MESSAGES.analisis_performa}
        </p>
      </div>
      <Link
        to="/upgrade"
        className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#06090F] font-black text-[13px] uppercase tracking-widest flex items-center justify-center transition-colors"
      >
        Upgrade Sekarang
      </Link>
    </div>
  )

  const showChatUnavailable = !canUseFeature('chat_assistant')

  // ==========================================================
  // DESKTOP LAYOUT
  // ==========================================================
  if (isDesktop) {
    return (
      <div className="flex h-full min-h-0 gap-4 p-4 lg:p-6">
        {/* Left column — Info */}
        <div className="w-[40%] min-w-0 flex flex-col">
          <InfoPanel
            tenant={tenant}
            vertical={vertical}
            messages={messages}
            pendingCount={pendingCount}
            resetConversation={resetConversation}
          />
        </div>

        {/* Right column — Chat */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#06090F] rounded-2xl border border-white/8 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0C1319]/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <Bot size={15} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-[13px] font-black text-white tracking-tight leading-none">TernakBot</h3>
                <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                  {isLoading && <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />}
                  {agentState === AGENT_STATE.THINKING || agentState === AGENT_STATE.PRE_CHECKING
                    ? 'Sedang memproses...' : 'Siap menerima catatan'}
                </p>
              </div>
            </div>
            <button type="button" onClick={resetConversation}
              className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
              title="Chat baru"
            >
              <RotateCcw size={13} className="text-[#4B6478]" />
            </button>
          </div>

          {showChatUnavailable ? (
            <ChatUnavailable />
          ) : (
            <>
              <ChatThread {...chatProps} showCardsInline={true} />
              <div className="shrink-0 px-4 py-4 border-t border-white/5 bg-[#0C1319]/40">
                <ChatInput
                  quotaStatus={quotaStatus}
                  remaining={remaining}
                  isLoading={isLoading}
                  input={input}
                  setInput={setInput}
                  handleSend={handleSend}
                  handleKeyDown={handleKeyDown}
                />
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ==========================================================
  // MOBILE LAYOUT — tab switch
  // ==========================================================
  return (
    <div className="flex flex-col h-full min-h-0 bg-[#06090F]">
      {/* Tab nav */}
      <div className="shrink-0 flex border-b border-white/5 bg-[#0C1319]/80 px-4 pt-3">
        {[
          { key: 'chat', label: 'Chat', Icon: MessageSquare },
          { key: 'info', label: 'Riwayat & Info', Icon: Clock },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMobileTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[12px] font-black uppercase tracking-widest border-b-2 transition-colors ${
              mobileTab === key
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#4B6478] hover:text-white'
            }`}
          >
            <Icon size={13} /> {label}
            {key === 'chat' && pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-[8px] font-black text-white flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Chat tab */}
      {mobileTab === 'chat' && (
        <div className="flex-1 min-h-0 flex flex-col">
          {showChatUnavailable ? (
            <ChatUnavailable />
          ) : (
            <>
              {/* Cards shown as bottom sheet on mobile */}
              <ChatThread {...chatProps} showCardsInline={false} />
              <div className="shrink-0 px-4 py-3 border-t border-white/5 bg-[#0C1319]/80 safe-area-pb">
                <ChatInput
                  quotaStatus={quotaStatus}
                  remaining={remaining}
                  isLoading={isLoading}
                  input={input}
                  setInput={setInput}
                  handleSend={handleSend}
                  handleKeyDown={handleKeyDown}
                />
              </div>
              <BottomSheet
                isOpen={pendingCount > 0}
                pendingEntries={pendingEntries}
                pendingCount={pendingCount}
                onClose={() => handleReject(pendingEntries[0]?.id)}
                {...cardProps}
              />
            </>
          )}
        </div>
      )}

      {/* Info tab */}
      {mobileTab === 'info' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <InfoPanel
            tenant={tenant}
            vertical={vertical}
            messages={messages}
            pendingCount={pendingCount}
            resetConversation={resetConversation}
          />
        </div>
      )}
    </div>
  )
}
