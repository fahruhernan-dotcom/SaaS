import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, CheckCircle2, BarChart2, Users, ShieldCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: BarChart2,
    title: 'Laporan Real-Time',
    desc: 'ADG, FCR, dan profit dihitung otomatis setiap saat.',
    color: '#D97706',
  },
  {
    icon: Users,
    title: 'Manajemen Tim',
    desc: 'Undang anggota dengan role yang bisa diatur.',
    color: '#7C3AED',
  },
  {
    icon: ShieldCheck,
    title: 'Data Aman & Privat',
    desc: 'Data bisnis kamu terisolasi dan terenkripsi.',
    color: '#10B981',
  },
]

export default function WelcomeOnboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const userName = location.state?.fullName || location.state?.name || ''
  const [countdown, setCountdown] = useState(5)
  const [visible, setVisible] = useState(true)

  // Auto-redirect after 5 seconds
  useEffect(() => {
    if (countdown <= 0) {
      handleContinue()
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleContinue = () => {
    setVisible(false)
    setTimeout(() => navigate('/onboarding', { replace: true }), 300)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen bg-[#06090F] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
        >
          {/* Background glow */}
          <div
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              background: [
                'radial-gradient(ellipse 50% 35% at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)',
                'radial-gradient(ellipse 40% 30% at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 70%)',
              ].join(', '),
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.06, 1], rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-24 h-24 rounded-3xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(16,185,129,0.15) 100%)',
                    border: '1.5px solid rgba(124,58,237,0.35)',
                    boxShadow: '0 0 40px rgba(124,58,237,0.15)',
                  }}
                >
                  <Sparkles className="w-11 h-11 text-violet-400" />
                </motion.div>
                {/* Pulse ring */}
                <motion.div
                  animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-3xl"
                  style={{ border: '1.5px solid rgba(124,58,237,0.3)' }}
                />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
              {userName ? (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm font-semibold text-violet-400 mb-2 tracking-wide"
                >
                  Halo, {userName}! 👋
                </motion.p>
              ) : null}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-black text-white mb-3 leading-tight"
              >
                Selamat datang di<br />
                <span
                  className="inline-block"
                  style={{
                    background: 'linear-gradient(90deg, #A78BFA, #34D399)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  TernakOS
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-white/40 font-medium"
              >
                Platform manajemen peternakan modern untuk Indonesia.
              </motion.p>
            </div>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl overflow-hidden mb-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {FEATURES.map((feat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${feat.color}18`, border: `1px solid ${feat.color}30` }}
                  >
                    <feat.icon size={16} style={{ color: feat.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{feat.title}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{feat.desc}</p>
                  </div>
                  <CheckCircle2 size={14} className="ml-auto shrink-0 text-emerald-500/60" />
                </div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              onClick={handleContinue}
              className="w-full h-13 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                color: '#fff',
                height: '52px',
              }}
            >
              Mulai Setup Bisnis
              <ArrowRight size={16} />
            </motion.button>

            {/* Auto-redirect hint */}
            <p className="text-center text-[11px] text-white/25 mt-4">
              Lanjut otomatis dalam {countdown} detik...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
