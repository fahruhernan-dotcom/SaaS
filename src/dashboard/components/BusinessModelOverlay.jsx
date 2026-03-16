import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { BUSINESS_MODELS } from '../../lib/businessModel'

export default function BusinessModelOverlay({ profile, onComplete }) {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  // Don't render if profile hasn't loaded yet or if already selected
  if (!profile) return null
  if (profile.business_model_selected) return null

  const handleConfirm = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: selected,
          business_model_selected: true
        })
        .eq('auth_user_id', profile.auth_user_id)

      if (error) throw error
      if (onComplete) onComplete(selected)
    } catch (err) {
      console.error('Error saving business model:', err)
      alert('Gagal menyimpan pilihan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: '#0C1319',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '24px',
          padding: '32px 24px',
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            marginBottom: '16px'
          }}>
            <div style={{ width: '32px', height: '32px', background: '#10B981', borderRadius: '8px' }} />
            <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '18px', color: '#F1F5F9' }}>
              TernakOS
            </span>
          </div>
          <h2 style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px' }}>
            Kamu berbisnis sebagai?
          </h2>
          <p style={{ fontSize: '13px', fontFamily: 'DM Sans', color: '#4B6478', lineHeight: 1.5 }}>
            Pilih satu untuk kami siapkan dashboard dan menu yang sesuai bisnis kamu.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(BUSINESS_MODELS).map(([key, model]) => (
            <ModelCard 
              key={key}
              model={model}
              selected={selected === key}
              onClick={() => setSelected(key)}
            />
          ))}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              onClick={handleConfirm}
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%',
                padding: '15px',
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontFamily: 'DM Sans',
                fontSize: '15px',
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
                marginTop: '24px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Menyiapkan...' : 'Mulai Sekarang →'}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function ModelCard({ model, selected, onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        background: selected ? 'rgba(16,185,129,0.07)' : '#111C24',
        border: selected ? '1px solid rgba(16,185,129,0.45)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '18px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        transition: 'all 0.2s ease',
        boxShadow: selected ? '0 0 0 1px rgba(16,185,129,0.12)' : 'none'
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        background: 'rgba(16,185,129,0.10)',
        borderRadius: '12px',
        fontSize: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {model.icon}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontFamily: 'Sora', fontSize: '15px', fontWeight: 700, color: '#F1F5F9', marginBottom: '3px' }}>
          {model.label}
        </h4>
        <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: '#4B6478', lineHeight: 1.5 }}>
          {model.description}
        </p>
      </div>
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: selected ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
        background: selected ? '#10B981' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginLeft: 'auto'
      }}>
        {selected && <Check size={12} color="white" strokeWidth={3} />}
      </div>
    </motion.div>
  )
}
