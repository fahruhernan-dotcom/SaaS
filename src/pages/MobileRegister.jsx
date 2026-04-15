import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  User, Mail, Lock, Hash, Eye, EyeOff, 
  Loader2, AlertCircle 
} from 'lucide-react'
import ShaderBackground from '@/components/ui/shader-background'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" style={{ marginRight: 10 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function MobileRegister({
  mode, setMode, showPassword, setShowPassword, isLoading, googleLoading, 
  authError, cooldown, isLocked, lockoutRemaining, isBlocked, register, handleSubmit, 
  setValue, errors, onSubmit, handleGoogleSignIn, navigate, HoneypotField 
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    import('animejs').then(({ animate, createTimeline, stagger }) => {
      createTimeline({ defaults: { ease: 'outElastic(1, 0.6)', duration: 750 } })
        .add('.mr-stagger', {
          opacity: [0, 1],
          translateY: [32, 0],
        }, stagger(80))

      animate('.mr-logo-wrap', {
        scale: [0.5, 1],
        opacity: [0, 1],
        ease: 'outElastic(1, 0.5)',
        duration: 900,
      })
    })
  }, [])

  return (
    <div ref={containerRef} style={{ minHeight: '100vh', background: 'transparent', display: 'flex', justifyContent: 'center', position: 'relative' }}>
      <ShaderBackground />
      <div style={{ 
        width: '100%', maxWidth: 420, minHeight: '100vh', 
        background: 'rgba(6, 9, 15, 0.4)', backdropFilter: 'blur(32px)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 1, border: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{ 
            background: 'radial-gradient(circle at 15% 15%, #065f46 0%, #0d1117 80%)', 
            padding: '32px 32px 40px', position: 'relative', overflow: 'hidden' 
          }}>
            <Link to="/" className="mr-logo-wrap" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 20, textDecoration: 'none', cursor: 'pointer', opacity: 0 }}>
              <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(10px)' }} />
                <img src="/logo.png" alt="TernakOS" style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover', position: 'relative', zIndex: 1, display: 'block', border: '1px solid rgba(255,255,255,0.05)' }} />
              </div>
              <span className="font-display" style={{ color: 'white', fontWeight: 800, fontSize: 20, letterSpacing: '-0.04em', lineHeight: 1 }}>TernakOS</span>
            </Link>

            <div className="mr-stagger" style={{ opacity: 0 }}>
              <h1 className="font-display" style={{ color: 'white', margin: '0 0 8px', fontSize: 24, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em' }}>
                Buat akun baru 🚀
              </h1>
              <p className="font-body" style={{ color: '#94a3b8', margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>
                Gratis selamanya, tanpa kartu kredit.
              </p>
            </div>
            <svg viewBox="0 0 420 40" preserveAspectRatio="none" style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: 32, pointerEvents: 'none', zIndex: 10 }}>
              <path d="M0,20 C150,45 270,-5 420,15 L420,40 L0,40 Z" fill="#06090f" style={{ opacity: 0.4 }} />
              <path d="M0,25 C120,45 300,5 420,20 L420,40 L0,40 Z" fill="#06090f" />
            </svg>
          </div>
        </div>

        <div style={{ flex: 1, padding: '12px 32px 48px' }}>
          {/* Mode Switcher */}
          <div className="mr-stagger" style={{ display: 'flex', padding: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, marginBottom: 32, opacity: 0 }}>
            {['mandiri', 'invite'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 600, transition: 'all 0.3s ease',
                  background: mode === m ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                  color: mode === m ? '#22c55e' : '#64748b',
                  border: mode === m ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid transparent',
                  cursor: 'pointer'
                }}
              >
                {m === 'mandiri' ? 'Daftar Mandiri' : 'Pakai Undangan'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <HoneypotField />
            
            <div className="mr-stagger" style={{ marginBottom: 20, opacity: 0 }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 12, letterSpacing: '0.05em' }}>NAMA LENGKAP</label>
              <AnimatedMobileInput
                placeholder="Budi Santoso"
                {...register('fullName')}
                icon={<User size={18} strokeWidth={1.5} />}
              />
              {errors.fullName && <p style={{ color: '#f87171', fontSize: 11, marginTop: -18, marginLeft: 4 }}>{errors.fullName.message}</p>}
            </div>

            {mode === 'invite' && (
              <div className="mr-stagger" style={{ marginBottom: 20, opacity: 0 }}>
                <label style={{ display: 'block', color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 12, letterSpacing: '0.05em' }}>KODE UNDANGAN</label>
                <AnimatedMobileInput
                  placeholder="CODE12"
                  {...register('inviteCode')}
                  onChange={(e) => setValue('inviteCode', e.target.value.toUpperCase())}
                  icon={<Hash size={18} strokeWidth={1.5} />}
                />
                {errors.inviteCode && <p style={{ color: '#f87171', fontSize: 11, marginTop: -18, marginLeft: 4 }}>{errors.inviteCode.message}</p>}
              </div>
            )}

            <div className="mr-stagger" style={{ marginBottom: 20, opacity: 0 }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 12, letterSpacing: '0.05em' }}>EMAIL</label>
              <AnimatedMobileInput
                type="email"
                placeholder="nama@email.com"
                {...register('email')}
                icon={<Mail size={18} strokeWidth={1.5} />}
              />
              {errors.email && <p style={{ color: '#f87171', fontSize: 11, marginTop: -18, marginLeft: 4 }}>{errors.email.message}</p>}
            </div>

            <div className="mr-stagger" style={{ marginBottom: 20, opacity: 0 }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 12, letterSpacing: '0.05em' }}>PASSWORD</label>
              <AnimatedMobileInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Password Baru"
                {...register('password')}
                icon={<Lock size={17} />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', padding: 0 }}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />
              {errors.password && <p style={{ color: '#f87171', fontSize: 11, marginTop: -18, marginLeft: 4 }}>{errors.password.message}</p>}
            </div>

            <div className="mr-stagger" style={{ marginBottom: 24, opacity: 0 }}>
              <label style={{ display: 'flex', alignItems: 'start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" {...register('agreedToTerms')} style={{ marginTop: 3, width: 16, height: 16, accentColor: '#22c55e' }} />
                <span style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.5 }}>
                  Setuju dengan <Link to="/terms" style={{ color: '#22c55e' }}>Syarat</Link> dan <Link to="/privacy" style={{ color: '#22c55e' }}>Kebijakan</Link> kami.
                </span>
              </label>
              {errors.agreedToTerms && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.agreedToTerms.message}</p>}
            </div>

            {authError && (
              <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)', borderRadius: 10, fontSize: 13, color: '#F87171', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
                <AlertCircle size={14} />
                {authError}
              </div>
            )}

            <div className="mr-stagger" style={{ marginBottom: 12, opacity: 0 }}>
              <button
                type="submit"
                disabled={isLoading || googleLoading || isBlocked}
                style={{
                  width: '100%', padding: '14px', background: '#22c55e', border: 'none', borderRadius: 14, color: 'white',
                  fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 24px rgba(34,197,94,0.3)', opacity: (isLoading || googleLoading || isBlocked) ? 0.6 : 1
                }}
              >
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> ...</> : cooldown > 0 ? `Tunggu ${cooldown}s` : (mode === 'mandiri' ? 'Daftar Gratis →' : 'Bergabung Tim')}
              </button>
            </div>
          </form>

          {/* New Positioned Google Login Layout BELOW Masuk */}
          <div className="mr-stagger" style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0', opacity: 0 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.05))' }} />
            <span style={{ color: '#475569', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em' }}>ATAU</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.05))' }} />
          </div>

          <div className="mr-stagger" style={{ opacity: 0 }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: '#e2e8f0', fontSize: 15, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              <GoogleIcon /> Daftar dengan Google
            </button>
          </div>

          <div className="mr-stagger" style={{ textAlign: 'center', marginTop: 28, opacity: 0 }}>
            <p style={{ color: '#64748b', fontSize: 13 }}>Sudah punya akun?</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '13px', background: 'transparent', border: '1.5px solid #2d3748', borderRadius: 14, color: '#a3a3a3', fontSize: 15, fontWeight: 600, marginTop: 12, cursor: 'pointer' }}
            >
              Masuk Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnimatedMobileInput({ type, placeholder, value, onChange, icon, rightIcon, ...rest }) {
  const [focused, setFocused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative', marginBottom: 24 }}
    >
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #f1f5f9 !important;
          -webkit-box-shadow: 0 0 0px 1000px #0a1118 inset !important;
          transition: background-color 500000s ease-in-out 0s;
          caret-color: #22c55e !important;
        }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'center', padding: '14px 16px', background: 'rgba(13, 17, 23, 0.7)', borderRadius: 14,
        border: focused ? '1.5px solid rgba(34, 197, 94, 0.45)' : (isHovered ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid rgba(255, 255, 255, 0.03)'),
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: focused ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(34, 197, 94, 0.05)' : 'none'
      }}>
        <div style={{ color: focused ? '#22c55e' : '#475569', transition: 'color 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, marginRight: 16, flexShrink: 0 }}>
          {icon}
        </div>
        <input
          type={type} placeholder={placeholder} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          {...rest}
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#f1f5f9', fontSize: 16, outline: 'none', caretColor: '#22c55e', padding: 0, width: '100%' }}
        />
        {rightIcon && <div style={{ marginLeft: 10, display: 'flex', alignItems: 'center', color: '#475569' }}>{rightIcon}</div>}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: '15%', transform: `scaleX(${focused ? 1 : 0})`, width: '70%', height: 1.5, background: 'linear-gradient(90deg, transparent 0%, #22c55e 50%, transparent 100%)', transition: 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)', transformOrigin: 'center', opacity: focused ? 0.8 : 0, zIndex: 2 }} />
    </div>
  )
}
