import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Eye, EyeOff, AlertCircle, Loader2,
  TrendingUp, Truck, BarChart2, Clock, Shield, Users, Zap, Mail, Lock
} from 'lucide-react'
import { toast } from 'sonner'
import { getBrokerBasePath, getPeternakBasePath, useAuth } from '../lib/hooks/useAuth'
import { logError } from '@/lib/logger/errorLogger'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { setRememberMe as saveRememberMe } from '@/lib/supabaseStorage'
import { useLanguage } from '@/lib/i18n/useLanguage'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

// Reactbits Components
import BlurText from '@/components/reactbits/BlurText'
import AnimatedContent from '@/components/reactbits/AnimatedContent'
import Particles from '@/components/reactbits/Particles'
import ShaderBackground from '@/components/ui/shader-background'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const { user, profile, loading: authLoading, isSuperadmin } = useAuth()

  useEffect(() => {
    if (authLoading || !user || !profile) return
    if (isSuperadmin) { navigate('/admin', { replace: true }); return }
    if (!profile.onboarded) { navigate('/onboarding', { replace: true }); return }
    if (profile.user_type === 'peternak') {
      navigate(getPeternakBasePath(profile.tenants, profile) + '/beranda', { replace: true })
      return
    }
    if (profile.user_type === 'rumah_potong') {
      navigate(getPeternakBasePath(profile.tenants, profile) + '/beranda', { replace: true })
      return
    }
    navigate(getBrokerBasePath(profile.tenants, profile) + '/beranda', { replace: true })
  }, [authLoading, user, profile, isSuperadmin]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleSignIn = async () => {
    saveRememberMe(rememberMe)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      })
      if (error) throw error
    } catch (err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'Login',
        actionName: 'login.oauth_google',
        error: err,
        metadata: { method: 'google' },
      })
      toast.error('Gagal masuk dengan Google. Coba lagi.')
    }
  }

  const handleLogin = async () => {
    if (!email || !password) return
    setIsLoading(true)
    setError('')
    saveRememberMe(rememberMe)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().includes('@') ? email.trim() : `${email.trim()}@ternakos.id`,
        password
      })
      
      if (error) {
        const msg = error.message.toLowerCase()
        logError({
          level: 'error',
          source: 'auth',
          component: 'Login',
          actionName: 'login.submit',
          error,
          metadata: { method: 'email' },
        })
        if (msg.includes('invalid login credentials')) {
          setError('Email atau password salah')
        } else if (msg.includes('user not found')) {
          setError('Akun tidak ditemukan')
        } else if (msg.includes('network') || msg.includes('fetch')) {
          setError('Gagal terhubung, coba lagi')
        } else if (msg.includes('email not confirmed')) {
          setError('Email belum dikonfirmasi. Cek inbox kamu.')
        } else {
          setError(error.message)
        }
        return
      }

      // Superadmin: cek langsung dari JWT app_metadata (paling reliable)
      if (data.user?.app_metadata?.is_superadmin === true) {
        navigate('/admin')
        toast.success('Selamat datang kembali, Admin!')
        return
      }

      // Cek profile ada sebelum redirect — cegah login loop
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('*, tenants(sub_type, business_vertical)')
        .eq('auth_user_id', data.user.id)
      if (profilesErr) {
        logSupabaseError(profilesErr, {
          table: 'profiles',
          operation: 'select',
          component: 'Login',
          actionName: 'login.fetch_profiles',
        })
      }

      if (!profiles || profiles.length === 0) {
        navigate('/onboarding')
        toast.info('Yuk lengkapi profil bisnismu dulu!')
        return
      }

      // Pilih profile terbaik: prefer yang sudah onboarded, lalu yang punya tenant
      const profile = profiles.find(p => p.onboarded) || profiles[0]

      // Persist active tenant so useAuth picks the right profile on next init
      if (profile?.tenant_id) {
        try { localStorage.setItem('ternakos_active_tenant_id', profile.tenant_id) } catch { /* ok */ }
      }

      if (!profile.onboarded) {
        navigate('/onboarding')
        return
      }

      // Peternak
      if (profile.user_type === 'peternak') {
        navigate(getPeternakBasePath(profile.tenants, profile) + '/beranda')
        toast.success('Selamat datang kembali!')
        return
      }

      // Rumah Potong
      if (profile.user_type === 'rumah_potong') {
        navigate(getPeternakBasePath(profile.tenants, profile) + '/beranda')
        toast.success('Selamat datang kembali!')
        return
      }

      // Broker (default)
      navigate(getBrokerBasePath(profile.tenants, profile) + '/beranda')
      toast.success('Selamat datang kembali!')
      
    } catch (err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'Login',
        actionName: 'login.unexpected',
        error: err,
        metadata: { method: 'email' },
      })
      if (err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network')) {
        setError('Gagal terhubung, coba lagi')
      } else {
        setError('Terjadi kesalahan. Coba lagi.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const propsBag = {
    email, setEmail, password, setPassword, showPassword, setShowPassword,
    isLoading, error, handleLogin, handleGoogleSignIn, navigate,
    rememberMe, setRememberMe,
  }

  if (!isDesktop) {
    return <MobileLoginView {...propsBag} />
  }

  return <DesktopLoginView {...propsBag} />
}

function DesktopLoginView({ email, setEmail, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin, handleGoogleSignIn, navigate, rememberMe, setRememberMe }) {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-screen bg-[#06090F] overflow-x-hidden">
      {/* LOGO (Absolute Positioned) */}
      <Link to="/" className="absolute top-8 left-12 flex items-center gap-2 z-50 group cursor-pointer">
        <img
          src="/logo.png"
          alt="TernakOS"
          style={{ width: 36, height: 36, borderRadius: '10px', objectFit: 'cover' }}
          className="group-hover:scale-105 transition-transform"
        />
        <span style={{
          fontFamily: 'Sora',
          fontSize: '20px',
          fontWeight: 800,
          color: '#F1F5F9',
          letterSpacing: '-0.3px'
        }}>
          TernakOS
        </span>
      </Link>

      {/* LEFT PANEL - BRANDING (Desktop only) */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="dark-preserve hidden md:flex md:w-1/2 relative overflow-hidden flex-col justify-center px-12 py-16 bg-[#06090F]"
      >
        {/* Decorations */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0,
          width: '100%', height: '100%',
          background: 'radial-gradient(ellipse at 0% 100%, rgba(16, 185, 129, 0.12) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: 0, right: 0,
          width: '100%', height: '100%',
          background: 'radial-gradient(ellipse at 100% 0%, rgba(16, 185, 129, 0.04) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        
        <Particles
          quantity={40}
          color="#10B981"
          opacity={0.08}
          className="absolute inset-0 pointer-events-none"
        />

        {/* CONTENT CENTER */}
        <div className="flex flex-col relative z-10 w-full max-w-lg mx-auto">

          <AnimatedContent stagger delay={0.4} staggerDelay={0.15} distance={15}>
            {/* STATS ROW */}
            <div className="flex gap-3 mt-8">
              {[
                { icon: <Clock className="w-4 h-4 text-[#10B981] mb-2" />, val: "< 2 Min", label: "Catat Transaksi" },
                { icon: <Zap className="w-4 h-4 text-[#10B981] mb-2" />, val: "Real-time", label: "Update Harga" },
                { icon: <Shield className="w-4 h-4 text-[#10B981] mb-2" />, val: "100%", label: "Data Aman" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#0C1319]/80 border border-white/8 rounded-xl p-3 flex-1 flex flex-col items-start transition-colors hover:bg-[#0C1319]">
                  {stat.icon}
                  <div className="font-display text-base font-bold text-[#10B981]">{stat.val}</div>
                  <div className="text-[#94A3B8] text-[10px] mt-0.5 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </AnimatedContent>

          <AnimatedContent stagger delay={0.6} staggerDelay={0.08} distance={10}>
            {/* FEATURE LIST */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { 
                  icon: <TrendingUp />, 
                  title: "Profit Real-time", 
                  desc: "Margin bersih otomatis terhitung setelah susut dan biaya kirim." 
                },
                { 
                  icon: <Truck />, 
                  title: "Tracking Pengiriman", 
                  desc: "Pantau mortalitas dan susut berat dari mana saja." 
                },
                { 
                  icon: <BarChart2 />, 
                  title: "Harga Pasar Akurat", 
                  desc: "Data harga dari transaksi nyata ribuan pengguna TernakOS." 
                },
                { 
                  icon: <Users />, 
                  title: "Multi-Role & Tim", 
                  desc: "Broker, peternak, dan RPA dalam satu ekosistem terintegrasi." 
                },
              ].map((item, i) => (
                <div key={i} className="bg-[#0C1319]/80 border border-white/8 rounded-xl p-3.5 flex flex-col gap-2 transition-all hover:border-white/12">
                  <div className="w-7 h-7 bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    {React.cloneElement(item.icon, { size: 14, className: "text-[#10B981]" })}
                  </div>
                  <div>
                    <h4 className="text-[#F1F5F9] text-[13px] font-semibold mt-1">{item.title}</h4>
                    <p className="text-[#4B6478] text-[11px] leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedContent>
        </div>

        {/* TESTIMONIAL */}
        <AnimatedContent delay={0.8} distance={20}>
          <div className="mt-8 relative z-10">
            <div className="bg-[#0C1319]/80 border-l-2 border-[#10B981] rounded-xl p-4">
              <p className="text-[#94A3B8] text-xs italic leading-relaxed">
                "Dulu catat transaksi pakai buku, sekarang semua langsung keliatan profit hari ini. TernakOS sangat membantu bisnis saya."
              </p>
              <div className="flex gap-2 items-center mt-3">
                <div className="w-7 h-7 rounded-full bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center text-[10px] font-bold text-[#10B981] font-display">
                  PH
                </div>
                <div>
                  <p className="text-[#F1F5F9] text-xs font-semibold">Pak Harto</p>
                  <p className="text-[#4B6478] text-[10px]">Broker Ayam, Boyolali</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedContent>
      </motion.div>

      {/* RIGHT PANEL - FORM */}
      <div className="flex-1 md:w-1/2 w-full flex items-center justify-center px-6 md:px-12 py-16 bg-[#080D13] md:border-l border-white/5 min-h-screen">
        <AnimatedContent direction="right" delay={0.2} distance={40} className="w-full max-w-md">
          <div className="w-full bg-[#0C1319] border border-white/8 rounded-2xl p-8">
            {/* HEADER (Mobile Logo) */}
            <Link to="/" className="md:hidden flex items-center justify-center gap-2 mb-8 group">
              <img src="/logo.png" alt="TernakOS" style={{ width: 28, height: 28, borderRadius: '8px', objectFit: 'cover' }} className="group-hover:scale-110 transition-transform" />
              <span style={{
                fontFamily:'Sora', fontWeight:800,
                fontSize:'18px', color:'#F1F5F9'
              }}>TernakOS</span>
            </Link>
            
            <h1 className="text-xl font-bold font-display text-[#F1F5F9] mb-1 tracking-tight">
              {t('auth_welcome_back', 'Selamat datang kembali')}
            </h1>
            <p className="text-[13px] text-[#4B6478] mb-6 leading-relaxed font-medium">
              {t('auth_welcome_desc', 'Masukkan email dan password kamu untuk masuk')}
            </p>

            <div className="relative mb-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%',
                  height: '44px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  color: '#4B6478',
                  fontFamily: 'Sora',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                className="hover:bg-white/5 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.617z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71a5.41 5.41 0 0 1 0-3.42V4.958H.957a8.993 8.993 0 0 0 0 8.084l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                {t('auth_login_google', 'Masuk dengan Google')}
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <Separator className="flex-1 bg-white/5" />
              <span className="text-[12px] text-[#4B6478] whitespace-nowrap uppercase tracking-widest font-bold">{t('auth_or', 'atau')}</span>
              <Separator className="flex-1 bg-white/5" />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              {/* Email field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#94A3B8',
                  marginLeft: '4px',
                  display: 'block'
                }}>
                  {t('auth_email_label', 'Email')}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder={t('auth_email_placeholder', 'Email')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    background: '#111C24',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '15px',
                    color: '#F1F5F9',
                    height: '42px',
                    width: '100%',
                    outline: 'none'
                  }}
                  className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>
              
              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1 pr-1">
                  <Label htmlFor="password" style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#94A3B8'
                  }}>
                    {t('auth_password_label', 'Password')}
                  </Label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    style={{
                      fontSize: '12px',
                      color: '#10B981',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    className="hover:underline"
                  >
                    {t('auth_forgot_password', 'Lupa password?')}
                  </button>
                </div>
                
                <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth_password_placeholder', '••••••••')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                    style={{
                      background: '#111C24',
                      border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: '10px',
                      padding: '10px 44px 10px 14px',
                      fontSize: '15px',
                      color: '#F1F5F9',
                      height: '42px',
                      width: '100%',
                      outline: 'none'
                    }}
                    className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#4B6478',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showPassword
                      ? <EyeOff size={16} />
                      : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              {/* Remember Me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: '#10B981', cursor: 'pointer', flexShrink: 0 }}
                />
                <label htmlFor="rememberMe" style={{ fontSize: '13px', color: '#94A3B8', cursor: 'pointer', userSelect: 'none' }}>
                  {t('auth_remember_me', 'Ingat saya')}
                </label>
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.20)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#F87171',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleLogin}
                disabled={isLoading || !email || !password}
                style={{
                  width: '100%',
                  height: '44px',
                  background: '#10B981',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  fontFamily: 'Sora',
                  fontSize: '14px',
                  fontWeight: 700,
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.25)',
                  cursor: isLoading || !email || !password
                    ? 'not-allowed' : 'pointer',
                  opacity: !email || !password ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '10px'
                }}
                className="hover:bg-emerald-600 transition-colors"
              >
                {isLoading ? (
                  <><Loader2 size={16} className="animate-spin" />
                    {t('auth_logging_in', 'Masuk...')}</>
                ) : t('auth_login_button', 'Masuk')}
              </Button>
            </form>
            
            <div className="flex items-center gap-3 my-8">
              <Separator className="flex-1 bg-white/5" />
              <span className="text-[12px] text-[#4B6478] whitespace-nowrap">{t('auth_no_account', 'Belum punya akun?')}</span>
              <Separator className="flex-1 bg-white/5" />
            </div>
            
            <Button
              variant="outline"
              onClick={() => navigate('/register')}
              style={{
                width: '100%',
                height: '44px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                color: '#F1F5F9',
                fontFamily: 'Sora',
                fontSize: '14px',
                fontWeight: 600
              }}
              className="hover:bg-white/5 transition-colors"
            >
              {t('auth_register_now', 'Daftar Sekarang — Gratis')}
            </Button>
            
            <p className="text-[12px] text-[#4B6478] text-center mt-8 leading-relaxed">
              {t('auth_terms_prefix', 'Dengan masuk, kamu menyetujui ')}
              <Link 
                to="/terms" 
                target="_blank" 
                rel="noopener"
                className="text-emerald-400 cursor-pointer hover:underline"
              >
                {t('auth_terms', 'Syarat & Ketentuan')}
              </Link>{' '}
              {t('auth_and', ' dan ')}
              <Link 
                to="/privacy" 
                target="_blank" 
                rel="noopener"
                className="text-emerald-400 cursor-pointer hover:underline"
              >
                {t('auth_privacy', 'Kebijakan Privasi')}
              </Link>{' '}
              {t('auth_terms_suffix', ' kami.')}
            </p>
          </div>
        </AnimatedContent>
      </div>
    </div>
  )
}

function MobileLoginView({ email, setEmail, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin, handleGoogleSignIn, navigate, rememberMe, setRememberMe }) {
  const containerRef = useRef(null)
  const { t } = useLanguage()

  useEffect(() => {
    import('animejs').then(({ animate, createTimeline, stagger }) => {
      if (!containerRef.current) return

      const mlStagger = containerRef.current.querySelectorAll('.ml-stagger')
      const mlLogoWrap = containerRef.current.querySelector('.ml-logo-wrap')
      const mlCircle = containerRef.current.querySelectorAll('.ml-circle')

      if (mlStagger.length > 0) {
        createTimeline({ defaults: { ease: 'outElastic(1, 0.6)', duration: 750 } })
          .add(mlStagger, {
            opacity: [0, 1],
            translateY: [32, 0],
          }, stagger(90))
      }

      if (mlLogoWrap) {
        animate(mlLogoWrap, {
          scale: [0.5, 1],
          opacity: [0, 1],
          ease: 'outElastic(1, 0.5)',
          duration: 900,
        })
      }

      if (mlCircle.length > 0) {
        animate(mlCircle, {
          opacity: [0.05, 0.2],
          ease: 'inOutSine',
          duration: 3200,
          loop: true,
          alternate: true,
          delay: stagger(650),
        })
      }
    })
  }, [])

  return (
    <div ref={containerRef} style={{ minHeight: '100vh', background: 'transparent', display: 'flex', justifyContent: 'center', position: 'relative' }}>
      {/* Background Shader Effect */}
      <ShaderBackground />

      <div style={{ 
        width: '100%', 
        maxWidth: 420, 
        minHeight: '100vh', 
        background: 'var(--mobile-card-bg)', 
        backdropFilter: 'blur(32px)',
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
        border: '1px solid var(--mobile-card-border)'
      }}>
        <div style={{ position: 'relative' }}>
          {/* Refined Mesh Gradient Header */}
          <div style={{ 
            background: 'var(--mobile-header-bg)', 
            padding: '32px 32px 40px', 
            position: 'relative', 
            overflow: 'hidden',
          }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
              <circle className="ml-circle opacity-20" cx="360" cy="10"  r="160" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle className="ml-circle opacity-10" cx="-40" cy="220" r="180" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </svg>

            <Link to="/" className="ml-logo-wrap ml-stagger inline-flex items-center gap-[14px] opacity-0 no-underline cursor-pointer">
              <div className="relative w-[38px] h-[38px] shrink-0">
                <div className="absolute -inset-[6px] rounded-full bg-black/8 dark:bg-white/8 blur-[10px]" />
                <img
                  src="/logo.png"
                  alt="TernakOS"
                  className="w-[38px] h-[38px] rounded-[10px] object-cover relative z-[1] block border border-[var(--mobile-card-border)]"
                />
              </div>
              <span className="font-display text-[#F1F5F9]" style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.04em', lineHeight: 1 }}>TernakOS</span>
            </Link>

            <div className="ml-stagger opacity-0 mt-[20px]">
              <h1 className="font-display text-[#F1F5F9] m-[0_0_8px] text-[24px] font-extrabold leading-[1.1] tracking-[-0.04em]">
                {t('auth_welcome_back', 'Selamat datang kembali')} 👋
              </h1>
              <p className="font-body text-[#94A3B8] m-0 text-[14px] font-medium leading-[1.4]">
                {t('auth_welcome_desc', 'Masukkan email dan password kamu untuk masuk')}
              </p>
            </div>

            <svg viewBox="0 0 420 40" preserveAspectRatio="none" className="absolute bottom-[-1px] left-0 w-full h-[32px] pointer-events-none z-[10]">
              <path d="M0,20 C150,45 270,-5 420,15 L420,40 L0,40 Z" fill="var(--bg-base-val)" className="opacity-40" />
              <path d="M0,25 C120,45 300,5 420,20 L420,40 L0,40 Z" fill="var(--bg-base-val)" />
            </svg>
          </div>
        </div>
        <div className="flex-1 p-[12px_32px_48px]">
          <form onSubmit={e => { e.preventDefault(); handleLogin() }} className="mt-[12px]">
            <div className="ml-stagger mb-[32px] opacity-0">
              <label className="block text-[12px] font-semibold mb-[12px] tracking-[0.05em] font-body text-[var(--text-muted)]">{t('auth_email_label_upper', 'EMAIL')}</label>
              <AnimatedMobileInput
                type="email"
                placeholder={t('auth_email_placeholder_full', 'nama@email.com')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail size={18} strokeWidth={1.5} />}
              />
            </div>
            <div className="ml-stagger mb-[12px] opacity-0">
              <label className="block text-[12px] font-semibold mb-[12px] tracking-[0.05em] font-body text-[var(--text-muted)]">{t('auth_password_label_upper', 'PASSWORD')}</label>
              <AnimatedMobileInput
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth_password_placeholder_mobile', 'Masukkan password')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock size={17} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="bg-transparent border-none cursor-pointer flex items-center p-0 transition-colors text-[var(--text-muted)] hover:text-emerald-500"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />
            </div>
            {error && (
              <div className="p-[10px_14px] bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.20)] rounded-[10px] text-[13px] text-[#F87171] flex gap-[8px] items-center mb-[12px] mt-[12px]">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}
            <div className="ml-stagger flex items-center justify-between m-[20px_0_26px] opacity-0">
              <label className="flex items-center gap-[8px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-[16px] h-[16px] accent-emerald-500 cursor-pointer"
                />
                <span className="text-[var(--text-muted)] text-[13px] font-body">{t('auth_remember_me', 'Ingat saya')}</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[13px] font-medium bg-transparent border-none cursor-pointer p-0 font-body text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                {t('auth_forgot_password', 'Lupa password?')}
              </button>
            </div>
            <div className="ml-stagger mb-[12px] opacity-0">
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full p-[14px] bg-emerald-500 disabled:bg-emerald-900 border-none rounded-[14px] text-white text-[16px] font-bold font-sans cursor-pointer flex items-center justify-center gap-[8px] tracking-[0.01em] shadow-[0_4px_24px_rgba(34,197,94,0.3)] transition-all disabled:opacity-55 disabled:shadow-none"
              >
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> {t('auth_logging_in', 'Masuk...')}</> : t('auth_login_button_mobile', 'Masuk →')}
              </button>
            </div>
          </form>

          <div className="ml-stagger flex items-center gap-[16px] m-[24px_0] opacity-0">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[var(--mobile-card-border)]" />
            <span className="text-[var(--text-muted)] text-[11px] font-bold tracking-[0.2em] font-body uppercase">{t('auth_or', 'atau')}</span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[var(--mobile-card-border)]" />
          </div>

          <div className="ml-stagger opacity-0">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-[12px] p-[14px] rounded-[16px] text-[15px] font-semibold cursor-pointer transition-all backdrop-blur-[8px] bg-[var(--mobile-card-bg)] border border-[var(--mobile-card-border)] text-[var(--text-primary-val)] hover:bg-[var(--bg-app)] hover:border-emerald-500/30 font-body"
            >
              <GoogleIcon />
              Masuk dengan Google
            </button>
          </div>
          <div className="ml-stagger text-[var(--text-muted)] text-center mt-[18px] mb-[10px] text-[13px] opacity-0">
            Belum punya akun?
          </div>
          <div className="ml-stagger opacity-0">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full p-[13px] rounded-[14px] text-[15px] font-semibold cursor-pointer transition-all font-body bg-transparent border border-[var(--mobile-card-border)] text-[var(--text-muted)] hover:border-emerald-500 hover:text-emerald-500"
            >
              Daftar Sekarang — Gratis
            </button>
          </div>
          <p className="ml-stagger text-[var(--text-muted)] text-center text-[12px] mt-[22px] leading-[1.6] opacity-0">
            <Link to="/terms" className="text-emerald-500 no-underline">Syarat & Ketentuan</Link>
            {' '}dan{' '}
            <Link to="/privacy" className="text-emerald-500 no-underline">Kebijakan Privasi</Link> kami.
          </p>
        </div>
      </div>
    </div>
  )
}

function AnimatedMobileInput({ type, placeholder, value, onChange, icon, rightIcon }) {
  const [focused, setFocused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative mb-[24px]"
    >
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: var(--text-primary-val) !important;
          -webkit-box-shadow: 0 0 0px 1000px var(--mobile-input-bg) inset !important;
          transition: background-color 500000s ease-in-out 0s;
          caret-color: #22c55e !important;
        }
        input::placeholder {
          color: #475569 !important;
          opacity: 0.6;
        }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        background: 'var(--mobile-input-bg)',
        borderRadius: 14,
        border: focused ? '1.5px solid rgba(34, 197, 94, 0.45)' : (isHovered ? '1.5px solid var(--mobile-input-border-hover)' : '1.5px solid var(--mobile-input-border)'),
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: focused ? '0 12px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(34, 197, 94, 0.05)' : 'none'
      }}>
        <div style={{ color: focused ? '#22c55e' : '#475569', transition: 'color 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, marginRight: 16, flexShrink: 0 }}>
          {icon}
        </div>

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent border-none text-[var(--text-primary-val)] text-[16px] outline-none font-inherit caret-[#22c55e] p-0 w-full"
        />

        {rightIcon && (
          <div className="ml-[10px] flex items-center text-[#475569]">
            {rightIcon}
          </div>
        )}
      </div>
      
      {/* Precision Accent Beam */}
      <div style={{
        position: 'absolute', bottom: 0, left: '15%',
        transform: `scaleX(${focused ? 1 : 0})`,
        width: '70%', height: 1.5,
        background: 'linear-gradient(90deg, transparent 0%, #22c55e 50%, transparent 100%)',
        transition: 'transform 0.6s cubic-bezier(0.19, 1, 0.22, 1)',
        transformOrigin: 'center',
        opacity: focused ? 0.8 : 0,
        zIndex: 2
      }} />
    </div>
  )
}
