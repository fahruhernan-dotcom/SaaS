// =============================================================
// TernakOS — AI Chat Bubble (Peternak)
// FAB + floating panel. Logic lives in usePeternakChat.
// =============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Loader2, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react'
import { AGENT_STATE } from '@/lib/useAIAssistant.jsx'
import AIConfirmCard from '@/dashboard/_shared/components/AIConfirmCard'
import AISuccessCard from '@/dashboard/broker/ai/AISuccessCard'
import { Link } from 'react-router-dom'
import { usePeternakChat } from './usePeternakChat'

export default function AIChatBubble() {
  const location = useLocation()
  const {
    vertical, userRole,
    displayMessages, agentState, isLoading, error,
    pendingEntries, pendingCount,
    unresolvedEntities, resolveEntity,
    undoEntry, undoLastConfirm, undoCountdown,
    lastFailedMessage, retryLastMessage,
    isEntryLocked, getEntryParent,
    editEntryField, resetConversation, cancelAI,
    quotaStatus, remaining,
    input, setInput, setHasOpened,
    handleCommit, handleReject, handleSend, handleKeyDown,
    formatTime, getStatusText,
  } = usePeternakChat({ contextPage: location.pathname, initialOpened: false })

  const [isOpen, setIsOpen] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setHasOpened(true)
  }, [setHasOpened])

  const handleClose = useCallback(() => setIsOpen(false), [])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [displayMessages, isLoading, pendingEntries, undoEntry])

  // Auto-focus
  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  // Auto-expand textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = '40px'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px'
    }
  }, [input])

  // Click outside
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) handleClose() }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 100)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler) }
  }, [isOpen, handleClose])

  return (
    <>
      {/* ─── FAB ─── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={handleOpen}
            aria-label="Buka AI Assistant"
            className="fixed bottom-8 right-8 z-[60] w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-colors active:scale-95"
          >
            <Bot size={20} />
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
            style={{ height: 'min(540px, 80vh)', background: '#06090F', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0C1319]/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                  <Bot size={17} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-display text-[14px] font-black text-white tracking-tight leading-none">TernakBot</h3>
                  <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                    {isLoading && <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />}
                    {getStatusText()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={resetConversation}
                  className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                  aria-label="Mulai chat baru"
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

            {/* Messages */}
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
                  <p className={`text-[9px] font-bold text-[#4B6478]/60 mt-1 ${msg.role === 'user' ? 'text-right pr-1' : 'pl-1'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              ))}

              {(agentState === AGENT_STATE.THINKING || agentState === AGENT_STATE.PRE_CHECKING) && !error && (
                <div className="flex justify-start">
                  <div className="bg-[#1e293b]/50 border border-[#4B6478]/20 rounded-2xl px-3 py-2 flex items-center gap-3 backdrop-blur-sm">
                    <div className="flex gap-1.5 items-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500/30 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[11px] font-bold text-[#4B6478] uppercase tracking-wider ml-1">
                      {agentState === AGENT_STATE.PRE_CHECKING ? 'Routing data...' : 'Lagi mikir...'}
                    </span>
                    <button type="button" onClick={cancelAI}
                      className="ml-2 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-500/20 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

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

              {undoEntry && undoCountdown > 0 && (
                <div className="mb-4">
                  <AISuccessCard
                    entry={undoEntry.entry}
                    onUndo={undoLastConfirm}
                    onClose={() => {}}
                    undoCountdown={undoCountdown}
                  />
                </div>
              )}

              <div className="space-y-3 px-1 pb-2">
                {pendingEntries.map((entry, idx) => (
                  <AIConfirmCard
                    key={entry.id || idx}
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
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-white/5 bg-[#0C1319]/60 backdrop-blur-sm px-4 py-3 space-y-2">
              {quotaStatus === 'warning' && (
                <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[11px] font-bold text-amber-300">Sisa {remaining} sesi AI bulan ini.</p>
                </div>
              )}
              {quotaStatus === 'exceeded' ? (
                <div className="flex flex-col items-center p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center gap-2">
                  <p className="text-[11px] font-bold text-red-200/90">Kuota AI bulan ini habis. Upgrade ke Pro untuk akses tanpa batas.</p>
                  <Link to="/upgrade" className="h-8 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[#06090F] font-black text-[11px] uppercase tracking-widest flex items-center justify-center transition-colors">
                    Lihat Plan
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
                      placeholder="Ketik catatan harianmu..."
                      rows={1}
                      spellCheck={false}
                      className="flex-1 resize-none bg-[#111C24] border border-white/8 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-white placeholder:text-[#4B6478] focus:outline-none focus:border-emerald-500/40 transition-colors leading-relaxed"
                      style={{ maxHeight: '160px', minHeight: '40px' }}
                      disabled={isLoading}
                    />
                    <button type="button" onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0 active:scale-95"
                      aria-label="Kirim pesan"
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                  <p className="text-[9px] font-bold text-[#4B6478]/50 text-center uppercase tracking-widest">
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
