// =============================================================
// TernakOS — AI Chat Bubble (Phase 2)
// Queue UI, Undo Toast, Retry, New Chat, Partial Success
// =============================================================

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { Bot, X, Send, Loader2, RotateCcw, AlertCircle, HelpCircle, RefreshCw, Undo2, CheckCircle2, Search } from 'lucide-react'
import { useAIAssistant, AGENT_STATE } from '@/lib/useAIAssistant.jsx'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import AIConfirmCard from './AIConfirmCard'
import AISuccessCard from './AISuccessCard'
import { useAuth } from '@/lib/hooks/useAuth'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { Link } from 'react-router-dom'

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Halo! Ceritakan transaksimu — beli, jual, bayar, atau kirim ayam.\nAku yang catat ke sistem.',
  timestamp: new Date().toISOString(),
}

export default function AIChatBubble() {
  const { tenant } = useAuth()
  const sub = getSubscriptionStatus(tenant)
  // AI is only included in Trial and Business plans
  const isAILocked = !(sub.status === 'trial' || (sub.status === 'active' && sub.plan === 'business'))

  const location = useLocation()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [hasOpened, setHasOpened] = useState(false)

  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  // ── Draggable FAB (mobile only) ───────────────────────────
  const isMobile = !useMediaQuery('(min-width: 1024px)')
  const FAB_SIZE = 44
  const FAB_MARGIN = 16
  const BOTTOM_CLEAR = 80  // above bottom-nav
  const TOP_CLEAR = 72     // below topbar

  const fabX = useMotionValue(0)
  const fabY = useMotionValue(0)
  const [fabReady, setFabReady] = useState(false)

  useEffect(() => {
    if (!isMobile) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    fabX.set(vw - FAB_SIZE - FAB_MARGIN)
    fabY.set(vh - FAB_SIZE - BOTTOM_CLEAR)
    setFabReady(true)
  }, [isMobile]) // eslint-disable-line

  const dragConstraints = useMemo(() => {
    if (typeof window === 'undefined') return {}
    const vw = window.innerWidth
    const vh = window.innerHeight
    return { left: FAB_MARGIN, top: TOP_CLEAR, right: vw - FAB_SIZE - FAB_MARGIN, bottom: vh - FAB_SIZE - BOTTOM_CLEAR }
  }, [])

  const snapToCorner = useCallback(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const cx = fabX.get()
    const cy = fabY.get()
    const tx = cx > vw / 2 ? vw - FAB_SIZE - FAB_MARGIN : FAB_MARGIN
    const ty = cy > vh / 2 ? vh - FAB_SIZE - BOTTOM_CLEAR : TOP_CLEAR
    animate(fabX, tx, { type: 'spring', stiffness: 400, damping: 30 })
    animate(fabY, ty, { type: 'spring', stiffness: 400, damping: 30 })
  }, [fabX, fabY])  

  const {
    messages,
    agentState,
    isLoading,
    sendMessage,
    pendingEntries,
    pendingEntry,
    pendingCount,
    confirmEntry,
    rejectEntry,
    confirmAll,
    editEntryField,
    unresolvedEntities,
    resolveEntity,
    undoEntry,
    undoLastConfirm,
    undoTimeoutMs,
    lastFailedMessage,
    retryLastMessage,
    isEntryLocked,
    getEntryParent,
    entryResults,
    resetConversation,
    cancelAI, // Add this
    error,
  } = useAIAssistant({
    userType: 'broker',
    contextPage: location.pathname,
  })

  const displayMessages = messages.length === 0 && hasOpened ? [WELCOME_MESSAGE] : messages

  // ── Undo countdown ────────────────────────────────────────
  const [undoCountdown, setUndoCountdown] = useState(0)
  useEffect(() => {
    if (!undoEntry) { setUndoCountdown(0); return }
    setUndoCountdown(Math.ceil(undoTimeoutMs / 1000))
    const interval = setInterval(() => {
      setUndoCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [undoEntry, undoTimeoutMs])

  // ── Panel controls ────────────────────────────────────────
  const handleOpen = useCallback(() => {
    setIsOpen(true)
    if (!hasOpened) setHasOpened(true)
  }, [hasOpened])

  const handleClose = useCallback(() => setIsOpen(false), [])

  // ── Auto-scroll ───────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [displayMessages, isLoading, pendingEntry, undoEntry])

  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  // ── Auto-expand textarea ──────────────────────────────────
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = '40px'
      const scrollHeight = inputRef.current.scrollHeight
      inputRef.current.style.height = Math.min(scrollHeight, 200) + 'px'
    }
  }, [input])

  // ── Click outside ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) handleClose() }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 100)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler) }
  }, [isOpen, handleClose])

  // ── Send ──────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    setInput('')
    sendMessage(trimmed)
  }, [input, isLoading, sendMessage])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }, [handleSend])

  // ── Status text ───────────────────────────────────────────
  const getStatusText = () => {
    switch (agentState) {
      case AGENT_STATE.PRE_CHECKING: return 'Memeriksa...'
      case AGENT_STATE.THINKING: return 'Berpikir...'
      case AGENT_STATE.AWAITING_CLARIFICATION: return 'Perlu detail...'
      case AGENT_STATE.AWAITING_CONFIRMATION: return pendingCount > 1 ? `${pendingCount} transaksi menunggu` : 'Menunggu konfirmasi'
      case AGENT_STATE.ERROR: return 'Gangguan'
      default: return 'Online'
    }
  }

  // ── Confirm / Reject handlers ─────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (!pendingEntry) return
    const data = await confirmEntry(pendingEntry.id)
    if (data) {
      toast.success('Data disimpan! (Undo tersedia 8 detik)')
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['cashflow'] })
      queryClient.invalidateQueries({ queryKey: ['broker-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-redesign'] })
    }
  }, [pendingEntry, confirmEntry, queryClient])

  const handleReject = useCallback(async () => {
    if (!pendingEntry) return
    await rejectEntry(pendingEntry.id)
  }, [pendingEntry, rejectEntry])

  const handleConfirmAll = useCallback(async () => {
    const results = await confirmAll()
    if (results.success > 0) {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['cashflow'] })
      queryClient.invalidateQueries({ queryKey: ['broker-stats'] })
    }
  }, [confirmAll, queryClient])

  const formatTime = (ts) => {
    try { return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
  }

  return (
    <>
      {/* ─── FAB ─── */}
      <AnimatePresence>
        {!isOpen && (!isMobile || fabReady) && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={handleOpen}
            aria-label="Buka AI Assistant"
            // ── Mobile: draggable, corner-snap, smaller ──
            {...(isMobile ? {
              drag: true,
              dragMomentum: false,
              dragElastic: 0,
              dragConstraints,
              onDragEnd: snapToCorner,
              style: { position: 'fixed', left: 0, top: 0, x: fabX, y: fabY, zIndex: 60, touchAction: 'none' },
              className: "w-11 h-11 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center cursor-grab active:cursor-grabbing",
            } : {
              className: "fixed bottom-8 right-8 z-[60] w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-colors active:scale-95",
            })}
          >
            <Bot size={isMobile ? 18 : 20} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 border-2 border-[#06090F] flex items-center justify-center text-[9px] font-black text-white">
                {pendingCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── PANEL ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            ref={panelRef}
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-4 right-4 lg:bottom-8 lg:right-8 z-[70] w-[calc(100vw-32px)] sm:w-[460px] flex flex-col rounded-[24px] overflow-hidden border border-white/8"
            style={{ height: 'min(560px, 82vh)', background: '#06090F', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0C1319]/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <Bot size={17} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-display text-[14px] font-black text-white tracking-tight leading-none">TernakBot</h3>
                  <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mt-0.5 flex items-center gap-1.5 transition-all">
                    {isLoading && <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />}
                    {getStatusText()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* New Chat button */}
                <button type="button" onClick={resetConversation}
                  className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                  aria-label="Mulai chat baru" title="Chat Baru"
                >
                  <RotateCcw size={13} className="text-[#4B6478]" />
                </button>
                <button type="button" onClick={handleClose}
                  className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                  aria-label="Tutup chat"
                >
                  <X size={15} className="text-[#4B6478]" />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
              {displayMessages.map((msg, i) => (
                <div key={i}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-emerald-500/20 text-emerald-50 rounded-br-md'
                        : 'bg-[#0C1319] border border-white/5 text-[#F1F5F9] rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                  <p className={`text-[9px] font-bold text-[#4B6478]/60 mt-1 ${msg.role === 'user' ? 'text-right pr-1' : 'pl-1 flex items-center justify-between'}`}>
                    <span>{formatTime(msg.timestamp)}</span>
                    {msg.role === 'assistant' && msg.usage && (
                      <span className="flex items-center gap-2 text-[8px] opacity-70">
                        <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5">
                          {msg.provider || 'AI'}
                        </span>
                        <span>
                          {msg.usage.prompt_tokens}p + {msg.usage.completion_tokens}c = <b className="text-[#F1F5F9]">{msg.usage.total_tokens}</b>
                        </span>
                      </span>
                    )}
                  </p>
                </div>
              ))}

              {/* Loading dots */}
              {(agentState === AGENT_STATE.THINKING || agentState === AGENT_STATE.PRE_CHECKING) && !error && (
                <div className="flex justify-start">
                  <div className="bg-[#1e293b]/50 border border-[#4B6478]/20 rounded-2xl px-3 py-2 flex items-center gap-3 backdrop-blur-sm shadow-xl">
                    <div className="flex gap-1.5 h-full items-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500/30 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[11px] font-bold text-[#4B6478] uppercase tracking-wider ml-1">
                      {agentState === AGENT_STATE.PRE_CHECKING ? 'Routing data...' : 'Lagi mikir...'}
                    </span>
                    <button
                      type="button"
                      onClick={cancelAI}
                      className="ml-2 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-500/20 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Clarification (Show only if NO pending entry, otherwise it's in the card) */}
              {agentState === AGENT_STATE.AWAITING_CLARIFICATION && !pendingEntry && (
                <div className="mx-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3">
                  <HelpCircle size={18} className="text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-bold text-orange-100">Bisa jelaskan lebih detail?</p>
                    <p className="text-[11px] text-orange-200/60 mt-0.5">Data kurang lengkap atau meragukan.</p>
                  </div>
                </div>
              )}

              {/* Error + Retry */}
              {agentState === AGENT_STATE.ERROR && (
                <div className="mx-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[12px] text-red-200/80">Gagal memproses. Coba lagi?</p>
                    {lastFailedMessage && (
                      <button type="button" onClick={retryLastMessage}
                        className="mt-2 flex items-center gap-1.5 text-[11px] font-black text-red-300 hover:text-red-200 uppercase tracking-widest transition-colors"
                      >
                        <RefreshCw size={12} /> Coba Ulang
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Success Card / Undo Toast */}
              {undoEntry && undoCountdown > 0 && (
                <div className="mb-4">
                  <AISuccessCard 
                    entry={undoEntry.entry} 
                    onUndo={undoLastConfirm} 
                    onClose={() => setUndoCountdown(0)} 
                    undoCountdown={undoCountdown} 
                  />
                </div>
              )}

              {/* Confirm All button (if > 1 pending) */}
              {pendingCount > 1 && (
                <div className="mx-2">
                  <button type="button" onClick={handleConfirmAll} disabled={isLoading}
                    className="w-full h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-[11px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/25 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={12} /> Konfirmasi Semua ({pendingCount})
                  </button>
                </div>
              )}

              {/* Navigation Stepper (if > 1 pending) */}
              {pendingCount > 1 && (
                <div className="mx-4 mb-2 flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/5 overflow-x-auto no-scrollbar">
                  {pendingEntries.map((entry, idx) => (
                    <button
                      key={`step-${entry.id}`}
                      onClick={() => {
                        document.getElementById(`confirm-card-${entry.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }}
                      className="flex-1 min-w-[32px] h-7 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-1 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                    >
                      <span className="opacity-50">{idx + 1}</span>
                      <span className="truncate max-w-[40px] lowercase font-bold">{entry.intent.split('_')[1]}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Confirm Cards (Horizontal Carousel) */}
              <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6 gap-4 px-4 scroll-smooth">
                {pendingEntries.map((entry, idx) => (
                  <div 
                    key={entry.id || idx} 
                    id={`confirm-card-${entry.id}`}
                    className="snap-center shrink-0 w-[calc(100%-20px)] sm:w-[360px]"
                  >
                    <AIConfirmCard
                      pendingEntry={entry}
                      queuePosition={idx + 1}
                      queueTotal={pendingCount}
                      onConfirm={() => confirmEntry(entry.id)}
                      onReject={() => rejectEntry(entry.id)}
                      onEdit={editEntryField}
                      isLoading={isLoading}
                      unresolvedEntities={unresolvedEntities}
                      onResolveEntity={resolveEntity}
                      isLocked={isEntryLocked(entry)}
                      parentIntent={getEntryParent(entry)?.intent}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Input ── */}
            <div className="shrink-0 border-t border-white/5 bg-[#0C1319]/60 backdrop-blur-sm px-4 py-3">
              {isAILocked ? (
                <div className="flex flex-col items-center justify-center p-3 mb-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[11px] font-medium text-amber-200/90 text-center leading-relaxed">
                    TernakBot AI Assistant eksklusif untuk <strong className="text-amber-400">Plan Business</strong> dan <strong className="text-amber-400">Trial</strong>. Mulai upgrade untuk otomatisasi AI tanpa ribet.
                  </p>
                  <Link to="/upgrade" className="mt-2.5 h-8 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-[#06090F] font-black text-[11px] uppercase tracking-widest flex items-center justify-center transition-colors shadow-lg shadow-amber-500/20 active:scale-95">
                    Upgrade Sekarang
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ketik atau ceritakan transaksimu..."
                      rows={1}
                      spellCheck={false}
                      className="flex-1 resize-none bg-[#111C24] border border-white/8 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-white placeholder:text-[#4B6478] focus:outline-none focus:border-emerald-500/40 transition-colors leading-relaxed"
                      style={{ maxHeight: '200px', minHeight: '40px' }}
                      disabled={isLoading}
                    />
                    <button type="button" onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0 shadow-lg shadow-emerald-500/15 active:scale-95"
                      aria-label="Kirim pesan"
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                  <p className="text-[9px] font-bold text-[#4B6478]/50 text-center mt-2 uppercase tracking-widest">
                    AI bisa salah · Selalu cek data · Undo tersedia 8 detik
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
