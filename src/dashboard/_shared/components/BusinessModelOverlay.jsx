import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Lock, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BUSINESS_MODELS, BUSINESS_CATEGORIES } from '@/lib/businessModel'

export default function BusinessModelOverlay({ profile, onComplete }) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  // Memoize sub-roles based on category for performance
  const subRoles = useMemo(() => {
    if (!category) return []
    return Object.values(BUSINESS_MODELS).filter(m => m.category === category)
  }, [category])

  if (!profile) return null
  if (profile.business_model_selected) return null

  const handleConfirm = async () => {
    if (!selected) return
    const model = BUSINESS_MODELS[selected]
    if (!model) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: model.user_type,
          business_model_selected: true,
          onboarded: true,
        })
        .eq('auth_user_id', profile.auth_user_id)

      if (error) throw error

      if (profile.tenant_id && model.sub_type) {
        await supabase
          .from('tenants')
          .update({ 
            sub_type: model.sub_type,
            business_vertical: model.key
          })
          .eq('id', profile.tenant_id)
      }

      if (onComplete) onComplete(selected)
    } catch (err) {
      console.error('Error saving business model:', err)
      alert('Gagal menyimpan pilihan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySelect = (key) => {
    setCategory(key)
    setSelected(null)
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
    setCategory(null)
    setSelected(null)
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
      padding: '16px',
      overflowY: 'auto',
    }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: '#0C1319',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '24px',
          padding: '28px 20px',
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          margin: 'auto',
        }}
      >
        {/* Top accent */}
        <div style={{
          position: 'absolute',
          top: 0, left: '15%', right: '15%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)'
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
            <img src="/logo.png" alt="TernakOS" style={{ width: 30, height: 30, borderRadius: '8px', objectFit: 'cover' }} />
            <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '17px', color: '#F1F5F9' }}>TernakOS</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '14px' }}>
            {[1, 2].map((s) => (
              <div key={s} style={{
                height: '4px',
                width: step >= s ? '28px' : '16px',
                borderRadius: '99px',
                background: step >= s ? '#10B981' : 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h2 style={{ fontFamily: 'Sora', fontSize: '19px', fontWeight: 800, color: '#F1F5F9', marginBottom: '6px' }}>
                  Kamu berbisnis sebagai?
                </h2>
                <p style={{ fontSize: '13px', color: '#4B6478', lineHeight: 1.5 }}>
                  Pilih kategori bisnis kamu.
                </p>
              </motion.div>
            ) : (
              <motion.div key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h2 style={{ fontFamily: 'Sora', fontSize: '19px', fontWeight: 800, color: '#F1F5F9', marginBottom: '6px' }}>
                  Pilih jenis bisnismu
                </h2>
                <p style={{ fontSize: '13px', color: '#4B6478', lineHeight: 1.5 }}>
                  Lebih spesifik agar dashboard sesuai kebutuhanmu.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {BUSINESS_CATEGORIES.map((cat) => (
                <CategoryCard key={cat.key} cat={cat} onClick={() => handleCategorySelect(cat.key)} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '2px' }}>
                {subRoles.map((model) => (
                  <ModelCard
                    key={model.key}
                    model={{
                      key: model.key,
                      label: model.name,
                      icon: model.icon,
                      description: model.description,
                      comingSoon: model.comingSoon
                    }}
                    selected={selected === model.key}
                    onClick={() => !model.comingSoon && setSelected(model.key)}
                  />
                ))}
              </div>

              <AnimatePresence>
                {selected && (
                  <motion.button
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
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
                      fontFamily: 'Sora',
                      fontSize: '15px',
                      fontWeight: 700,
                      boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
                      marginTop: '16px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? 'Menyiapkan dashboard...' : 'Mulai Sekarang →'}
                  </motion.button>
                )}
              </AnimatePresence>

              <button
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  marginTop: '12px',
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: '#4B6478',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans',
                }}
              >
                <ArrowLeft size={14} />
                Kembali
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function CategoryCard({ cat, onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        background: '#111C24',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        padding: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        transition: 'all 0.15s ease',
      }}
      whileHover={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.04)' }}
    >
      <div style={{
        width: '48px', height: '48px',
        background: 'rgba(16,185,129,0.10)',
        borderRadius: '12px',
        fontSize: '22px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {cat.icon}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontFamily: 'Sora', fontSize: '15px', fontWeight: 700, color: '#F1F5F9', margin: '0 0 3px' }}>
          {cat.label}
        </h4>
        <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: '#4B6478', lineHeight: 1.5, margin: 0 }}>
          {cat.description}
        </p>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '18px', flexShrink: 0 }}>›</div>
    </motion.div>
  )
}

function ModelCard({ model, selected, onClick }) {
  return (
    <motion.div
      whileTap={!model.comingSoon ? { scale: 0.985 } : {}}
      onClick={onClick}
      style={{
        background: model.comingSoon ? 'rgba(255,255,255,0.02)' : selected ? 'rgba(16,185,129,0.07)' : '#111C24',
        border: model.comingSoon ? '1px solid rgba(255,255,255,0.05)' : selected ? '1px solid rgba(16,185,129,0.45)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        padding: '14px',
        cursor: model.comingSoon ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: model.comingSoon ? 0.45 : 1,
        transition: 'all 0.15s ease',
        boxShadow: selected ? '0 0 0 1px rgba(16,185,129,0.12)' : 'none',
      }}
    >
      <div style={{
        width: '44px', height: '44px',
        background: model.comingSoon ? 'rgba(255,255,255,0.04)' : 'rgba(16,185,129,0.10)',
        borderRadius: '10px',
        fontSize: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {model.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <h4 style={{ fontFamily: 'Sora', fontSize: '14px', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
            {model.label}
          </h4>
          {model.comingSoon && (
            <span style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em',
              color: '#FBBF24', background: 'rgba(251,191,36,0.12)',
              border: '1px solid rgba(251,191,36,0.2)',
              padding: '1px 5px', borderRadius: '4px', flexShrink: 0,
            }}>SEGERA</span>
          )}
        </div>
        <p style={{ fontFamily: 'DM Sans', fontSize: '11px', color: '#4B6478', lineHeight: 1.5, margin: 0 }}>
          {model.description}
        </p>
      </div>
      <div style={{
        width: '20px', height: '20px',
        borderRadius: '50%',
        border: selected ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
        background: selected ? '#10B981' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {model.comingSoon ? <Lock size={10} color="rgba(255,255,255,0.2)" /> : selected && <Check size={12} color="white" strokeWidth={3} />}
      </div>
    </motion.div>
  )
}
