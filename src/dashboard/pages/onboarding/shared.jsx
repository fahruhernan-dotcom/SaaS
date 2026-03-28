import React from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Lock } from 'lucide-react'

// ── Shared Styles ─────────────────────────────────────────────────────────────

export const primaryBtnStyle = {
  width: '100%',
  background: '#10B981',
  color: 'white',
  borderRadius: '14px',
  padding: '16px',
  fontFamily: 'Sora',
  fontSize: '15px',
  fontWeight: 700,
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
  margin: '24px auto 0',
}

export const secondaryBtnStyle = {
  width: '100%',
  background: 'transparent',
  color: '#4B6478',
  borderRadius: '14px',
  padding: '12px',
  fontFamily: 'DM Sans',
  fontSize: '14px',
  fontWeight: 600,
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  cursor: 'pointer',
  marginTop: '12px',
}

export const backBtnStyle = {
  width: '100%',
  background: 'transparent',
  color: '#4B6478',
  borderRadius: '14px',
  padding: '10px',
  fontFamily: 'DM Sans',
  fontSize: '13px',
  fontWeight: 600,
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  cursor: 'pointer',
  marginTop: '8px',
}

export const inputStyle = {
  width: '100%',
  background: '#111C24',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '10px',
  padding: '13px 14px 13px 42px',
  fontSize: '15px',
  color: '#F1F5F9',
  fontFamily: 'DM Sans',
  outline: 'none',
}

export const inputWrapperStyle = { position: 'relative' }

export const inputIconStyle = {
  position: 'absolute',
  left: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#4B6478',
  pointerEvents: 'none',
}

export const labelStyle = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#94A3B8',
  display: 'block',
  marginBottom: '6px',
  marginLeft: '2px',
}

export const formGroupStyle = { marginBottom: '16px' }

export const stepTitleStyle = {
  fontFamily: 'Sora',
  fontSize: '20px',
  fontWeight: 800,
  color: '#F1F5F9',
  marginBottom: '6px',
}

export const stepDescStyle = {
  fontSize: '13px',
  fontFamily: 'DM Sans',
  color: '#4B6478',
  marginBottom: '24px',
  lineHeight: '1.6',
}

// ── Components ─────────────────────────────────────────────────────────────────

export function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '10px',
      fontWeight: 800,
      color: '#4B6478',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      marginBottom: '10px',
      marginLeft: '4px',
    }}>
      {children}
    </div>
  )
}

export function RoleCard({ icon, title, desc, pricing, loading, selected, disabled, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02, borderColor: disabled ? 'rgba(255,255,255,0.09)' : 'rgba(16,185,129,0.45)' }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={!disabled ? onClick : undefined}
      style={{
        background: selected ? 'rgba(16,185,129,0.08)' : '#111C24',
        border: `1px solid ${selected ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: '18px',
        padding: '18px 14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.2s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: '140px',
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          width: '22px', height: '22px', borderRadius: '50%',
          background: '#10B981',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={12} color="white" strokeWidth={3} />
        </div>
      )}
      {disabled && (
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          fontSize: '9px', fontWeight: 700, color: '#4B6478',
          background: 'rgba(75,100,120,0.15)',
          padding: '2px 8px', borderRadius: '99px',
          border: '1px solid rgba(75,100,120,0.2)',
        }}>
          Segera
        </div>
      )}
      <div style={{ fontSize: '26px', lineHeight: 1 }}>
        {loading ? <Loader2 size={24} className="animate-spin text-[#10B981]" /> : icon}
      </div>
      <div>
        <h3 style={{
          fontFamily: 'Sora', fontSize: '13px', fontWeight: 700,
          color: disabled ? '#4B6478' : '#F1F5F9',
          marginBottom: '4px',
        }}>
          {title}
        </h3>
        <p style={{ fontSize: '11px', fontFamily: 'DM Sans', color: '#4B6478', lineHeight: '1.5' }}>
          {desc}
        </p>
      </div>
      {pricing && !disabled && (
        <p style={{
          fontSize: '11px', fontFamily: 'DM Sans',
          color: selected ? '#10B981' : '#4B6478',
          fontWeight: 600, marginTop: 'auto',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <Sparkles size={10} /> {pricing}
        </p>
      )}
    </motion.div>
  )
}

// 4-step progress indicator
export function FourStepProgress({ current }) {
  const steps = [
    { label: 'Tipe' },
    { label: 'Sub-tipe' },
    { label: 'Info Bisnis' },
    { label: 'Setup' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 700,
              background: current >= i ? '#10B981' : '#111C24',
              color: current >= i ? 'white' : '#4B6478',
              border: current >= i ? 'none' : '1px solid rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }}>
              {current > i ? <Check size={11} /> : i + 1}
            </div>
            <span style={{
              fontSize: '10px', fontFamily: 'DM Sans', fontWeight: 600,
              color: current >= i ? '#F1F5F9' : '#4B6478',
              whiteSpace: 'nowrap',
            }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: '20px', height: '1px', flexShrink: 0,
              background: current > i ? '#10B981' : 'rgba(255,255,255,0.1)',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Blocked screen (trial gate)
export function BlockedScreen({ profiles }) {
  const navigate = useNavigate()
  const trialProfile = profiles?.find(p => {
    const t = p.tenants
    return t?.plan === 'starter' && t?.is_active === true && new Date(t?.trial_ends_at) > new Date()
  })
  const trialDaysLeft = trialProfile?.tenants?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(trialProfile.tenants.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="min-h-screen bg-[#06090F] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#0C1319] border border-white/8 rounded-2xl p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Lock size={28} className="text-amber-400" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px' }}>
              Upgrade untuk Tambah Bisnis
            </h2>
            <p style={{ fontSize: '14px', fontFamily: 'DM Sans', color: '#4B6478', lineHeight: '1.6' }}>
              Kamu masih dalam masa trial. Upgrade ke PRO untuk mengelola lebih dari 1 bisnis sekaligus.
            </p>
          </div>
        </div>
        {trialProfile && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bisnis Aktif</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>{trialProfile.tenants?.business_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FBBF24' }}>Trial — sisa {trialDaysLeft} hari</span>
            </div>
          </div>
        )}
        <button onClick={() => navigate('/broker/akun')} style={primaryBtnStyle}>
          Upgrade ke PRO <ArrowRight size={18} />
        </button>
        <button onClick={() => navigate(-1)} style={secondaryBtnStyle}>
          Kembali
        </button>
      </div>
    </div>
  )
}
