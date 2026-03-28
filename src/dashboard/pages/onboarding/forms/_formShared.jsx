import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Loader2 } from 'lucide-react'

// ── Pill (multi-select + radio) ────────────────────────────────────────────────

export function Pill({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: selected ? 'rgba(16,185,129,0.15)' : '#111C24',
        border: `1px solid ${selected ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        padding: '8px 16px',
        fontSize: '13px',
        fontFamily: 'DM Sans',
        fontWeight: selected ? 600 : 400,
        color: selected ? '#34D399' : '#94A3B8',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

// ── PillRow ────────────────────────────────────────────────────────────────────

export function PillRow({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{children}</div>
}

// ── FormSection ────────────────────────────────────────────────────────────────

export function FormSection({ label, inputId, hint, children, error }) {
  const labelStyle = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#4B6478',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontFamily: 'Sora',
    marginBottom: '12px',
    display: 'block',
  }
  return (
    <div style={{ marginBottom: '24px' }}>
      {inputId
        ? <label htmlFor={inputId} style={labelStyle}>{label}</label>
        : <div style={labelStyle}>{label}</div>
      }
      {children}
      {hint && <p style={{ fontSize: '11px', color: '#4B6478', marginTop: '6px' }}>{hint}</p>}
      {error && <p style={{ fontSize: '12px', color: '#F87171', marginTop: '6px' }}>{error}</p>}
    </div>
  )
}

// ── CollapsibleSection ─────────────────────────────────────────────────────────

export function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      background: '#111C24',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#94A3B8',
          fontFamily: 'DM Sans',
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'left',
        }}
      >
        <span>{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} color="#4B6478" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 20px' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Shared input styles ────────────────────────────────────────────────────────

export const simpleInputStyle = {
  width: '100%',
  background: '#0C1319',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px',
  padding: '12px 14px',
  fontSize: '14px',
  color: '#F1F5F9',
  fontFamily: 'DM Sans',
  outline: 'none',
  boxSizing: 'border-box',
  display: 'block',
}

export const formLabelStyle = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#94A3B8',
  display: 'block',
  marginBottom: '6px',
}

export const fieldGroupStyle = { marginBottom: '14px' }

// ── FormHeading ────────────────────────────────────────────────────────────────

export function FormHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h2 style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 800, color: '#F1F5F9', marginBottom: '6px' }}>
        {title}
      </h2>
      <p style={{ fontSize: '13px', fontFamily: 'DM Sans', color: '#4B6478', lineHeight: '1.6' }}>
        {subtitle}
      </p>
    </div>
  )
}

// ── FormActions (Kembali + Submit) ─────────────────────────────────────────────

export function FormActions({ onBack, loading, submitLabel = 'Selesai Setup' }) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          flexShrink: 0,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '12px',
          padding: '0 20px',
          height: '48px',
          color: '#94A3B8',
          fontFamily: 'DM Sans',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        ← Kembali
      </button>
      <button
        type="submit"
        disabled={loading}
        style={{
          flex: 1,
          background: loading ? 'rgba(16,185,129,0.5)' : '#10B981',
          border: 'none',
          borderRadius: '12px',
          height: '48px',
          color: 'white',
          fontFamily: 'Sora',
          fontSize: '15px',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 20px rgba(16,185,129,0.2)',
        }}
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : submitLabel}
      </button>
    </div>
  )
}
