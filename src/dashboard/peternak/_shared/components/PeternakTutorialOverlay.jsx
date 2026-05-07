import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useParams } from 'react-router-dom'
import { getTutorialSteps } from './tutorialSteps'

const ACCENT = '#22C55E'
const ACCENT_DIM = 'rgba(34,197,94,0.12)'
const CARD_BG = '#0C1319'
const MUTED = '#64748B'
const TEXT = '#F1F5F9'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

function ProgressDots({ total, current, horizontal = false }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 18 : 8,
            height: 8,
            borderRadius: 4,
            background: i === current ? ACCENT : 'rgba(255,255,255,0.12)',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

function StepContent({ step, isWelcome }) {
  const Icon = step.icon
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        width: 72, height: 72,
        borderRadius: 20,
        background: ACCENT_DIM,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={34} color={ACCENT} />
      </div>

      <div>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 800,
          fontSize: 20,
          color: TEXT,
          margin: 0,
          lineHeight: 1.3,
        }}>
          {step.title}
        </h2>
        <p style={{
          fontSize: 14,
          color: '#94A3B8',
          margin: '10px 0 0',
          lineHeight: 1.7,
        }}>
          {step.desc}
        </p>
      </div>

      {isWelcome && step.bullets && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {step.bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: ACCENT_DIM,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Check size={12} color={ACCENT} strokeWidth={3} />
              </div>
              <span style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 600 }}>{b}</span>
            </div>
          ))}
        </div>
      )}

      {!isWelcome && step.navHint && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '6px 12px',
          width: 'fit-content',
        }}>
          <span style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.06em' }}>MENU</span>
          <ChevronRight size={12} color={MUTED} />
          <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 700 }}>{step.navHint}</span>
        </div>
      )}
    </div>
  )
}

export default function PeternakTutorialOverlay() {
  const { profile, tenant } = useAuth()
  const { peternakType } = useParams()
  const isDesktop = useIsDesktop()

  const storageKey = `peternak_tutorial_${tenant?.id}`

  const [visible, setVisible] = useState(() => {
    if (!tenant?.id) return false
    try { return !localStorage.getItem(`peternak_tutorial_${tenant.id}`) } catch { return false }
  })
  const [stepIdx, setStepIdx] = useState(0)
  const [direction, setDirection] = useState(1)

  // Re-check when tenant resolves
  useEffect(() => {
    if (!tenant?.id) return
    try {
      setVisible(!localStorage.getItem(`peternak_tutorial_${tenant.id}`))
    } catch { /* ok */ }
  }, [tenant?.id])

  if (!visible) return null
  if (profile?.role !== 'owner') return null

  const steps = getTutorialSteps(peternakType)
  const step = steps[stepIdx]
  const isFirst = stepIdx === 0
  const isLast = stepIdx === steps.length - 1
  const isWelcome = step.id === 'welcome'

  const dismiss = (reason) => {
    try { localStorage.setItem(storageKey, reason) } catch { /* ok */ }
    setVisible(false)
  }

  const goNext = () => {
    if (isLast) { dismiss('complete'); return }
    setDirection(1)
    setStepIdx(i => i + 1)
  }

  const goPrev = () => {
    if (isFirst) return
    setDirection(-1)
    setStepIdx(i => i - 1)
  }

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
  }

  if (isDesktop) {
    return <DesktopModal
      steps={steps} stepIdx={stepIdx} step={step}
      direction={direction} variants={variants}
      isFirst={isFirst} isLast={isLast} isWelcome={isWelcome}
      onNext={goNext} onPrev={goPrev} onSkip={() => dismiss('skip')}
    />
  }

  return <MobileOverlay
    steps={steps} stepIdx={stepIdx} step={step}
    direction={direction} variants={variants}
    isFirst={isFirst} isLast={isLast} isWelcome={isWelcome}
    onNext={goNext} onPrev={goPrev} onSkip={() => dismiss('skip')}
  />
}

function DesktopModal({ steps, stepIdx, step, direction, variants, isFirst, isLast, isWelcome, onNext, onPrev, onSkip }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(6px)',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{
          width: '100%', maxWidth: 640,
          background: CARD_BG,
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          display: 'flex',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Left panel */}
        <div style={{
          width: '40%',
          background: `linear-gradient(160deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.03) 100%)`,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px', gap: 28,
        }}>
          <div style={{
            width: 96, height: 96, borderRadius: 28,
            background: ACCENT_DIM,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {React.createElement(step.icon, { size: 48, color: ACCENT })}
          </div>
          <ProgressDots total={steps.length} current={stepIdx} />
          <span style={{ fontSize: 12, color: MUTED, fontWeight: 700, letterSpacing: '0.06em' }}>
            {stepIdx + 1} / {steps.length}
          </span>
        </div>

        {/* Right panel */}
        <div style={{
          flex: 1, padding: '36px 32px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={stepIdx}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <DesktopStepContent step={step} isWelcome={isWelcome} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div style={{ paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {!isFirst && (
                <button onClick={onPrev} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: '10px 16px',
                  color: '#94A3B8', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                }}>
                  <ChevronLeft size={14} /> Kembali
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {!isLast && (
                <button onClick={onSkip} style={{
                  background: 'none', border: 'none',
                  color: MUTED, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', padding: '8px 4px',
                }}>
                  Lewati
                </button>
              )}
              <button onClick={onNext} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: isLast ? '#16A34A' : ACCENT,
                border: 'none', borderRadius: 12,
                padding: '11px 22px',
                color: '#fff', fontSize: 14, fontWeight: 800,
                cursor: 'pointer',
                boxShadow: `0 4px 16px ${ACCENT}40`,
              }}>
                {isLast ? (
                  <><Check size={15} strokeWidth={3} /> Selesai</>
                ) : isFirst ? (
                  <>Mulai <ChevronRight size={15} /></>
                ) : (
                  <>Lanjut <ChevronRight size={15} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function DesktopStepContent({ step, isWelcome }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 800, fontSize: 22,
          color: TEXT, margin: 0, lineHeight: 1.3,
        }}>
          {step.title}
        </h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: '12px 0 0', lineHeight: 1.75 }}>
          {step.desc}
        </p>
      </div>

      {isWelcome && step.bullets && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          {step.bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 7,
                background: ACCENT_DIM,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Check size={13} color={ACCENT} strokeWidth={3} />
              </div>
              <span style={{ fontSize: 14, color: '#CBD5E1', fontWeight: 600 }}>{b}</span>
            </div>
          ))}
        </div>
      )}

      {!isWelcome && step.navHint && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '7px 14px',
          width: 'fit-content', marginTop: 4,
        }}>
          <span style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: '0.06em' }}>MENU</span>
          <ChevronRight size={12} color={MUTED} />
          <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 700 }}>{step.navHint}</span>
        </div>
      )}
    </div>
  )
}

function MobileOverlay({ steps, stepIdx, step, direction, variants, isFirst, isLast, isWelcome, onNext, onPrev, onSkip }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-end',
      background: 'rgba(0,0,0,0.82)',
      backdropFilter: 'blur(4px)',
    }}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        style={{
          width: '100%',
          maxHeight: '82vh',
          background: CARD_BG,
          borderRadius: '24px 24px 0 0',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          display: 'flex', flexDirection: 'column',
          padding: '20px 20px 0',
          boxShadow: '0 -16px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 16px',
          flexShrink: 0,
        }} />

        {/* Header row: dots + skip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, flexShrink: 0,
        }}>
          <ProgressDots total={steps.length} current={stepIdx} />
          <button
            onClick={onSkip}
            style={{
              background: 'none', border: 'none',
              color: MUTED, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', padding: '10px 4px 10px 16px',
              minHeight: 44,
            }}
          >
            Lewati
          </button>
        </div>

        {/* Step content — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stepIdx}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <StepContent step={step} isWelcome={isWelcome} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer buttons — sticky */}
        <div style={{
          paddingTop: 20, paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {isFirst ? (
            <button onClick={onNext} style={{
              width: '100%',
              background: ACCENT, border: 'none', borderRadius: 14,
              padding: '15px 0', color: '#fff',
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: `0 4px 20px ${ACCENT}44`,
            }}>
              Mulai <ChevronRight size={16} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onPrev} style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14, padding: '14px 0',
                color: '#94A3B8', fontSize: 14, fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <ChevronLeft size={15} /> Kembali
              </button>
              <button onClick={onNext} style={{
                flex: 2,
                background: isLast ? '#16A34A' : ACCENT,
                border: 'none', borderRadius: 14, padding: '14px 0',
                color: '#fff', fontSize: 14, fontWeight: 800,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: `0 4px 20px ${ACCENT}44`,
              }}>
                {isLast ? (
                  <><Check size={15} strokeWidth={3} /> Selesai</>
                ) : (
                  <>Lanjut <ChevronRight size={15} /></>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
