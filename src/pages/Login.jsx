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
import { getBrokerBasePath } from '../lib/hooks/useAuth'

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

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      })
      if (error) throw error
    } catch (err) {
      toast.error('Gagal masuk dengan Google. Coba lagi.')
    }
  }

  const handleLogin = async () => {
    if (!email || !password) return
    setIsLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().includes('@') ? email.trim() : `${email.trim()}@ternakos.id`,
        password
      })
      
      if (error) {
        const msg = error.message.toLowerCase()
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

      // Cek profile ada sebelum redirect — cegah login loop
      // Gunakan select() biasa karena user bisa punya banyak profile (multi-tenant)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*, tenants(sub_type, business_vertical)')
        .eq('auth_user_id', data.user.id)

      if (!profiles || profiles.length === 0) {
        // Profile belum ada (trigger delay atau belum setup) — arahkan ke onboarding
        navigate('/onboarding')
        toast.info('Yuk lengkapi profil bisnismu dulu!')
        return
      }

      // Pilih profile terbaik: prefer yang sudah onboarded, lalu yang punya tenant
      const profile = profiles.find(p => p.onboarded) || profiles[0]

      if (!profile.onboarded) {
        navigate('/onboarding')
        return
      }

      // Superadmin → admin panel
      if (profile.role === 'superadmin' || profile.user_type === 'superadmin') {
        navigate('/admin')
        toast.success('Selamat datang kembali, Admin!')
        return
      }

      // Peternak
      if (profile.user_type === 'peternak') {
        navigate(`/peternak/${profile.tenants?.sub_type || 'peternak_broiler'}/beranda`)
        toast.success('Selamat datang kembali!')
        return
      }

      // Rumah Potong
      if (profile.user_type === 'rumah_potong') {
        const subType = profile.tenants?.sub_type || 'rpa_ayam'
        navigate(`/rumah_potong/${subType}/beranda`)
        toast.success('Selamat datang kembali!')
        return
      }

      // Broker (default)
      navigate(getBrokerBasePath(profile.tenants) + '/beranda')
      toast.success('Selamat datang kembali!')
      
    } catch (err) {
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
    isLoading, error, handleLogin, handleGoogleSignIn, navigate
  }

  if (!isDesktop) {
    return <MobileLoginView {...propsBag} />
  }

  return <DesktopLoginView {...propsBag} />
}

function DesktopLoginView({ email, setEmail, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin, handleGoogleSignIn, navigate }) {
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
        className="hidden md:flex md:w-1/2 relative overflow-hidden flex-col justify-center px-12 py-16 bg-[#06090F]"
      >
        {/* Decorations */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0,
          width: '100%', height: '100%',
          background: 'radial-gradient(ellipse at 0% 100%, rgba(16,185,129,0.12) 0%, transparent 60%)',
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
              Selamat datang kembali
            </h1>
            <p className="text-[13px] text-[#4B6478] mb-6 leading-relaxed font-medium">
              Masukkan email dan password kamu untuk masuk
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
                Masuk dengan Google
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <Separator className="flex-1 bg-white/5" />
              <span className="text-[12px] text-[#4B6478] whitespace-nowrap uppercase tracking-widest font-bold">atau</span>
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
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="Email"
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
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    style={{
                      fontSize: '12px',
                      color: '#34D399',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    className="hover:underline"
                  >
                    Lupa password?
                  </button>
                </div>
                
                <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
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
                  boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
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
                    Masuk...</>
                ) : 'Masuk'}
              </Button>
            </form>
            
            <div className="flex items-center gap-3 my-8">
              <Separator className="flex-1 bg-white/5" />
              <span className="text-[12px] text-[#4B6478] whitespace-nowrap">Belum punya akun?</span>
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
              Daftar Sekarang — Gratis
            </Button>
            
            <p className="text-[12px] text-[#4B6478] text-center mt-8 leading-relaxed">
              Dengan masuk, kamu menyetujui{' '}
              <Link 
                to="/terms" 
                target="_blank" 
                rel="noopener"
                className="text-emerald-400 cursor-pointer hover:underline"
              >
                Syarat & Ketentuan
              </Link>{' '}
              dan{' '}
              <Link 
                to="/privacy" 
                target="_blank" 
                rel="noopener"
                className="text-emerald-400 cursor-pointer hover:underline"
              >
                Kebijakan Privasi
              </Link>{' '}
              kami.
            </p>
          </div>
        </AnimatedContent>
      </div>
    </div>
  )
}

function MobileLoginView({ email, setEmail, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin, handleGoogleSignIn, navigate }) {
  const [remember, setRemember] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    import('animejs').then(({ animate, createTimeline, stagger }) => {
      createTimeline({ defaults: { ease: 'outElastic(1, 0.6)', duration: 750 } })
        .add('.ml-stagger', {
          opacity: [0, 1],
          translateY: [32, 0],
        }, stagger(90))

      animate('.ml-logo-wrap', {
        scale: [0.5, 1],
        opacity: [0, 1],
        ease: 'outElastic(1, 0.5)',
        duration: 900,
      })

      animate('.ml-circle', {
        opacity: [0.05, 0.2],
        ease: 'inOutSine',
        duration: 3200,
        loop: true,
        alternate: true,
        delay: stagger(650),
      })
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
        background: 'rgba(6, 9, 15, 0.4)', 
        backdropFilter: 'blur(32px)',
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{ position: 'relative' }}>
          {/* Refined Mesh Gradient Header */}
          <div style={{ 
            background: 'radial-gradient(circle at 15% 15%, #065f46 0%, #0d1117 80%)', 
            padding: '32px 32px 40px', 
            position: 'relative', 
            overflow: 'hidden',
          }}>
            {/* Ambient circles with ultra-low opacity */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
              <circle className="ml-circle" cx="360" cy="10"  r="160" fill="none" stroke="white" strokeWidth="0.5" style={{ opacity: 0.02 }} />
              <circle className="ml-circle" cx="-40" cy="220" r="180" fill="none" stroke="white" strokeWidth="0.5" style={{ opacity: 0.01 }} />
            </svg>

            {/* Branding – Premium Presence */}
            <Link to="/" className="ml-logo-wrap ml-stagger" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 20, opacity: 0, textDecoration: 'none', cursor: 'pointer' }}>
              <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(10px)' }} />
                <img
                  src="/logo.png"
                  alt="TernakOS"
                  style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover', position: 'relative', zIndex: 1, display: 'block', border: '1px solid rgba(255,255,255,0.05)' }}
                />
              </div>
              <span className="font-display" style={{ color: 'white', fontWeight: 800, fontSize: 20, letterSpacing: '-0.04em', lineHeight: 1 }}>TernakOS</span>
            </Link>

            {/* Heading – Balanced Presence */}
            <div className="ml-stagger" style={{ opacity: 0 }}>
              <h1 className="font-display" style={{ color: 'white', margin: '0 0 8px', fontSize: 24, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em' }}>
                Selamat datang kembali 👋
              </h1>
              <p className="font-body" style={{ color: '#94a3b8', margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>
                Masuk untuk kelola ternak kamu
              </p>
            </div>

            {/* Elegance Wave separator */}
            <svg viewBox="0 0 420 40" preserveAspectRatio="none" style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: 32, pointerEvents: 'none', zIndex: 10 }}>
              <path d="M0,20 C150,45 270,-5 420,15 L420,40 L0,40 Z" fill="#06090f" style={{ opacity: 0.4 }} />
              <path d="M0,25 C120,45 300,5 420,20 L420,40 L0,40 Z" fill="#06090f" />
            </svg>
          </div>
        </div>
        <div style={{ flex: 1, padding: '12px 32px 48px' }}>
          {/* Primary Form */}
          <form onSubmit={e => { e.preventDefault(); handleLogin() }} style={{ marginTop: 12 }}>
            <div className="ml-stagger" style={{ marginBottom: 32, opacity: 0 }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 12, letterSpacing: '0.05em' }} className="font-body">EMAIL</label>
              <AnimatedMobileInput
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail size={18} strokeWidth={1.5} />}
              />
            </div>
            <div className="ml-stagger" style={{ marginBottom: 12, opacity: 0 }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 12, letterSpacing: '0.05em' }} className="font-body">PASSWORD</label>
              <AnimatedMobileInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock size={17} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', display: 'flex', alignItems: 'center', padding: 0, transition: 'color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#22c55e' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#4a5568' }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />
            </div>
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.20)', borderRadius: 10, fontSize: 13, color: '#F87171', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, marginTop: 12 }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}
            <div className="ml-stagger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 26px', opacity: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#22c55e', cursor: 'pointer' }}
                />
                <span style={{ color: '#9ca3af', fontSize: 13, fontFamily: 'inherit' }}>Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{ color: '#22c55e', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
              >
                Lupa password?
              </button>
            </div>
            <div className="ml-stagger" style={{ marginBottom: 12, opacity: 0 }}>
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                style={{
                  width: '100%', padding: '14px',
                  background: (!email || !password) ? '#14532d' : '#22c55e',
                  border: 'none', borderRadius: 14, color: 'white',
                  fontSize: 16, fontWeight: 700, fontFamily: 'Sora, sans-serif',
                  cursor: isLoading || !email || !password ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  letterSpacing: '0.01em',
                  boxShadow: (!email || !password) ? 'none' : '0 4px 24px rgba(34,197,94,0.3)',
                  transition: 'all 0.2s',
                  opacity: (!email || !password) ? 0.55 : 1,
                }}
                onMouseEnter={e => { if (email && password && !isLoading) e.currentTarget.style.background = '#16a34a' }}
                onMouseLeave={e => { if (email && password && !isLoading) e.currentTarget.style.background = '#22c55e' }}
                onPointerDown={e => { if (email && password && !isLoading) e.currentTarget.style.transform = 'scale(0.97)' }}
                onPointerUp={e => { if (email && password && !isLoading) e.currentTarget.style.transform = 'scale(1)' }}
              >
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Masuk...</> : 'Masuk →'}
              </button>
            </div>
          </form>

          {/* Divider – ultra subtle */}
          <div className="ml-stagger" style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0', opacity: 0 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.05))' }} />
            <span style={{ color: '#475569', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em' }} className="font-body">ATAU</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.05))' }} />
          </div>

          {/* Google button – Classy Glass Style */}
          <div className="ml-stagger" style={{ opacity: 0 }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: '#e2e8f0', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
              onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              className="font-body"
            >
              <GoogleIcon />
              Masuk dengan Google
            </button>
          </div>
          <div className="ml-stagger" style={{ textAlign: 'center', marginTop: 18, marginBottom: 10, color: '#4a5568', fontSize: 13, opacity: 0 }}>
            Belum punya akun?
          </div>
          <div className="ml-stagger" style={{ opacity: 0 }}>
            <button
              type="button"
              onClick={() => navigate('/register')}
              style={{ width: '100%', padding: '13px', background: 'transparent', border: '1.5px solid #2d3748', borderRadius: 14, color: '#a3a3a3', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.color = '#22c55e' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d3748'; e.currentTarget.style.color = '#a3a3a3' }}
              onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              Daftar Sekarang — Gratis
            </button>
          </div>
          <p className="ml-stagger" style={{ textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 22, lineHeight: 1.6, opacity: 0 }}>
            <Link to="/terms" style={{ color: '#22c55e', textDecoration: 'none' }}>Syarat & Ketentuan</Link>
            {' '}dan{' '}
            <Link to="/privacy" style={{ color: '#22c55e', textDecoration: 'none' }}>Kebijakan Privasi</Link> kami.
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
        input::placeholder {
          color: #475569 !important;
          opacity: 0.6;
        }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        background: 'rgba(13, 17, 23, 0.7)',
        borderRadius: 14,
        border: focused ? '1.5px solid rgba(34, 197, 94, 0.45)' : (isHovered ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid rgba(255, 255, 255, 0.03)'),
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: focused ? '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(34, 197, 94, 0.05)' : 'none'
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
          style={{ 
            flex: 1,
            background: 'transparent', 
            border: 'none',
            color: '#f1f5f9', 
            fontSize: 16, 
            outline: 'none', 
            fontFamily: 'inherit', 
            caretColor: '#22c55e',
            padding: 0,
            width: '100%'
          }}
        />

        {rightIcon && (
          <div style={{ marginLeft: 10, display: 'flex', alignItems: 'center', color: '#475569' }}>
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
