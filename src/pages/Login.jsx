import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Eye, EyeOff, AlertCircle, Loader2,
  TrendingUp, Truck, BarChart2, Clock, Shield, Users, Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { getBrokerBasePath } from '../lib/hooks/useAuth'

// Reactbits Components
import BlurText from '@/components/reactbits/BlurText'
import AnimatedContent from '@/components/reactbits/AnimatedContent'
import Particles from '@/components/reactbits/Particles'

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
                disabled
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
                  gap: '8px',
                  cursor: 'not-allowed',
                  opacity: 0.5
                }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" style={{ opacity: 0.4 }}>
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.617z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71a5.41 5.41 0 0 1 0-3.42V4.958H.957a8.993 8.993 0 0 0 0 8.084l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Masuk dengan Google
              </Button>
              <span style={{
                position: 'absolute',
                top: '50%',
                right: '14px',
                transform: 'translateY(-50%)',
                background: 'rgba(251,191,36,0.12)',
                border: '1px solid rgba(251,191,36,0.25)',
                color: '#FBBF24',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                padding: '2px 8px',
                borderRadius: '6px',
              }}>
                SEGERA
              </span>
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
              Daftar Sekarang — Gratis 14 Hari
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
