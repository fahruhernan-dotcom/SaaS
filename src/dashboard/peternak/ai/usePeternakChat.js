// =============================================================
// TernakOS — usePeternakChat
// Shared logic hook for peternak AI chat components.
// Used by: AIChatBubble.jsx, TanyaAIPage.jsx
// =============================================================

import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAIAssistant, AGENT_STATE } from '@/lib/useAIAssistant.jsx'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAIQuota } from '@/lib/hooks/useAIQuota'

export const PETERNAK_WELCOME = {
  role: 'assistant',
  content: 'Halo! Ceritakan catatan harianmu — pakan, timbang, mati, atau pengeluaran. Aku yang catat.',
  timestamp: new Date().toISOString(),
}

export function toCardUserRole(profileRole) {
  if (profileRole === 'view_only') return 'view_only'
  if (profileRole === 'staff' || profileRole === 'abk') return 'abk'
  return 'owner'
}

/**
 * @param {{ contextPage: string, initialOpened?: boolean }} opts
 */
export function usePeternakChat({ contextPage, initialOpened = false }) {
  const { tenant, profile } = useAuth()
  const queryClient = useQueryClient()

  const vertical = tenant?.business_vertical || 'generic'
  const userRole = toCardUserRole(profile?.role)
  const { quotaStatus, remaining, canUseFeature } = useAIQuota(tenant)

  const [input, setInput] = useState('')
  const [hasOpened, setHasOpened] = useState(initialOpened)
  const [undoCountdown, setUndoCountdown] = useState(0)

  const {
    messages, agentState, isLoading,
    sendMessage, pendingEntry, pendingEntries, pendingCount,
    confirmEntry, rejectEntry, editEntryField,
    unresolvedEntities, resolveEntity,
    undoEntry, undoLastConfirm, undoTimeoutMs,
    lastFailedMessage, retryLastMessage,
    isEntryLocked, getEntryParent,
    resetConversation, cancelAI,
    error,
  } = useAIAssistant({ userType: 'peternak', contextPage })

  const displayMessages = messages.length === 0 && hasOpened ? [PETERNAK_WELCOME] : messages

  // ── Undo countdown ────────────────────────────────────────
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

  // ── Handlers ──────────────────────────────────────────────
  const handleCommit = useCallback(async (entryId) => {
    const data = await confirmEntry(entryId)
    if (data) {
      toast.success('Catatan disimpan!')
      queryClient.invalidateQueries({ queryKey: ['daily_records'] })
      queryClient.invalidateQueries({ queryKey: ['feed_stocks'] })
      queryClient.invalidateQueries({ queryKey: ['cycle_expenses'] })
      queryClient.invalidateQueries({ queryKey: ['harvest_records'] })
      queryClient.invalidateQueries({ queryKey: ['peternak-dashboard'] })
    }
  }, [confirmEntry, queryClient])

  const handleReject = useCallback(async (entryId) => {
    await rejectEntry(entryId)
  }, [rejectEntry])

  // textOverride: for quick chip sends (bypasses input state)
  const handleSend = useCallback((textOverride) => {
    const trimmed = (textOverride != null ? textOverride : input).trim()
    if (!trimmed || isLoading || quotaStatus === 'exceeded') return
    if (textOverride == null) setInput('')
    sendMessage(trimmed)
  }, [input, isLoading, quotaStatus, sendMessage])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }, [handleSend])

  // ── Utils ─────────────────────────────────────────────────
  const formatTime = (ts) => {
    try { return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
  }

  const getStatusText = () => {
    switch (agentState) {
      case AGENT_STATE.PRE_CHECKING: return 'Memeriksa...'
      case AGENT_STATE.THINKING: return 'Berpikir...'
      case AGENT_STATE.AWAITING_CLARIFICATION: return 'Perlu detail...'
      case AGENT_STATE.AWAITING_CONFIRMATION:
        return pendingCount > 1 ? `${pendingCount} catatan menunggu` : 'Menunggu konfirmasi'
      case AGENT_STATE.ERROR: return 'Gangguan'
      default: return 'Online'
    }
  }

  return {
    // Auth
    tenant, profile, vertical, userRole,
    // AI state
    messages, displayMessages, agentState, isLoading, error,
    pendingEntry, pendingEntries, pendingCount,
    unresolvedEntities, resolveEntity,
    undoEntry, undoLastConfirm, undoCountdown,
    lastFailedMessage, retryLastMessage,
    isEntryLocked, getEntryParent,
    editEntryField, resetConversation, cancelAI,
    // Quota
    quotaStatus, remaining, canUseFeature,
    // Local state
    input, setInput, hasOpened, setHasOpened,
    // Handlers
    handleCommit, handleReject, handleSend, handleKeyDown,
    // Utils
    formatTime, getStatusText,
  }
}
