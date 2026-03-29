import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Eye, EyeOff, AlertCircle, Loader2,
  TrendingUp, Truck, BarChart2, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { getBrokerBasePath } from '../lib/hooks/useAuth'

// Reactbits Components
import BlurText from '@/components/reactbits/BlurText'
import CountUp from '@/components/reactbits/CountUp'
import AnimatedContent from '@/components/reactbits/AnimatedContent'
import Particles from '@/components/reactbits/Particles'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string(),
  agreedToTerms: z.literal(true, {
    message: 'Kamu harus menyetujui syarat & ketentuan untuk melanjutkan.',
  }),
  inviteCode: z.string().optional(),
  mode: z.enum(['mandiri', 'invite']).default('mandiri'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
}).superRefine((data, ctx) => {
  if (data.mode === 'invite') {
    if (!data.inviteCode || data.inviteCode.length !== 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kode harus 6 karakter',
        path: ['inviteCode'],
      });
    }
  }
})

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" className="mr-2">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.617z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71a5.41 5.41 0 0 1 0-3.42V4.958H.957a8.993 8.993 0 0 0 0 8.084l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
)

// Helper function for registration reliability
const waitForProfile = async (authUserId, maxRetries = 8, interval = 600) => {
  for (let i = 0; i < maxRetries; i++) {
    const { data } = await supabase
      .from('profiles')
      .select('*, tenants(*)')
      .eq('auth_user_id', authUserId)
      .maybeSingle()
    
    if (data) return data
    
    // Wait before retry (progressive backoff)
    await new Promise(resolve => 
      setTimeout(resolve, interval * (i + 1))
    )
  }
  return null // max retries exceeded
}

export default function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [mode, setMode] = useState('mandiri')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      inviteCode: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreedToTerms: false,
      mode: 'mandiri'
    },
  })

  // Sync state to form field
  React.useEffect(() => {
    setValue('mode', mode)
  }, [mode, setValue])

  // Improve 1 & 4: Google Loading & Error Handling
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      })
      if (error) throw error
    } catch (err) {
      // Improve 4: Cancelled handling
      if (err.message?.toLowerCase().includes('cancelled')) {
        toast('Login dibatalkan')
      } else {
        toast.error('Gagal masuk dengan Google. Coba lagi.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleInviteRegister = async (data) => {
    setIsLoading(true)
    setAuthError('')
    try {
      // 1. Validasi kode dulu tanpa join tenants (RLS issue for anon)
      const { data: invite, error: inviteError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('token', data.inviteCode.toUpperCase().trim())
        .eq('status', 'pending')
        .single()

      if (inviteError || !invite) {
        toast.error('Kode undangan tidak valid atau sudah kadaluarsa')
        return
      }

      // Cek expired manual setelah dapat data
      if (invite.expires_at) {
        const isExpired = new Date(invite.expires_at) < new Date()
        if (isExpired) {
          toast.error('Kode undangan sudah kadaluarsa')
          return
        }
      }

      // 2. Ambil tenant terpisah untuk toast success saja
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('business_name, sub_type')
        .eq('id', invite.tenant_id)
        .single()

      const businessName = tenantData?.business_name ?? 'Tim'

      // 3. Buat akun Supabase dengan invite_token di metadata
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            invite_token: data.inviteCode.toUpperCase().trim()
          }
        }
      })

      if (signUpError) {
        toast.error(signUpError.message)
        return
      }

      // 4. Toast sukses + redirect (Trigger DB sudah handle profile & invitation status)
      toast.success('Berhasil bergabung ke ' + businessName)

      // Polling for profile creation (progressive backoff)
      const profile = await waitForProfile(authData?.user?.id || (await supabase.auth.getUser()).data.user?.id)

      if (!profile) {
        toast.error('Gagal membuat profil tim. Coba login secara manual.')
        await supabase.auth.signOut()
        return
      }

      // Force refresh session to pick up new tenant claims
      await supabase.auth.refreshSession()

      // Navigate ke dashboard
      navigate(getBrokerBasePath({ sub_type: profile.tenants?.sub_type }) + '/beranda')
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (formData) => {
    if (mode === 'invite') {
      return handleInviteRegister(formData)
    }

    setIsLoading(true)
    setAuthError('')

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: { full_name: formData.fullName }
        }
      })

      if (error) throw error;

      // Polling for profile creation (progressive backoff)
      const profileCheck = await waitForProfile(authData.user.id)

      if (!profileCheck) {
        toast.error(
          'Akun dibuat tapi profil tidak ditemukan. ' +
          'Coba login — jika masih error, hubungi support.',
          { duration: 6000 }
        )
        await supabase.auth.signOut()
        return
      }

      // Trigger berhasil — navigate sesuai status onboarding
      if (profileCheck.onboarded) {
        navigate(getBrokerBasePath({ sub_type: profileCheck.tenants?.sub_type }) + '/beranda')
      } else {
        navigate('/onboarding')
      }
      toast.success('Akun berhasil dibuat! Yuk lengkapi profil bisnis kamu.')

    } catch (err) {
      setAuthError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#06090F] overflow-x-hidden font-body">
      {/* LEFT PANEL - BRANDING (Desktop only) */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hidden md:flex md:w-[45%] relative border-r border-white/5 flex-col justify-center gap-12 p-10 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0C1319 0%, #060D12 50%, #0A1A12 100%)'
        }}
      >
        <div style={{
          position: 'absolute',
          bottom: -100, right: -100,
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none'
        }} />

        <Particles
          quantity={30}
          color="#10B981"
          opacity={0.15}
          className="absolute inset-0 pointer-events-none"
        />

        <Link to="/" className="absolute top-8 left-12 flex items-center gap-[10px] z-50 hover:opacity-80 transition-opacity">
          <div style={{
            width: 36, height: 36,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            🐔
          </div>
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

        <div className="flex flex-col gap-8 relative z-10">
          <div className="space-y-4">
            <BlurText
              text="Digitalisasi bisnis ternak lebih cepat, lebih rapi."
              delay={100}
              animateBy="words"
              direction="top"
              className="font-display text-3xl md:text-4xl font-black text-[#F1F5F9] leading-tight tracking-tight"
            />
            
            <AnimatedContent distance={20} duration={0.6}>
              <p className="text-[#4B6478] text-sm md:text-base leading-relaxed max-w-[340px]">
                Bergabung dengan ratusan broker dan peternak yang sudah meninggalkan catatan manual.
              </p>
            </AnimatedContent>
          </div>

          <AnimatedContent stagger delay={0.4} staggerDelay={0.15} distance={15}>
            {/* STATS ROW */}
            <div className="flex gap-3 mt-8">
              {[
                { val: "500+", label: "Pengguna Aktif", sub: "broker & peternak" },
                { val: "10.000+", label: "Transaksi Tercatat", sub: "& terus bertambah" },
                { val: "Rp 50M+", label: "Nilai Dikelola", sub: "per bulan" }
              ].map((stat, i) => (
                <div key={i} className="bg-[#0C1319]/80 border border-white/8 rounded-xl p-4 flex-1">
                  <div className="font-display text-xl font-bold text-[#10B981]">{stat.val}</div>
                  <div className="text-[#F1F5F9] text-xs font-semibold mt-1">{stat.label}</div>
                  <div className="text-[#4B6478] text-[10px]">{stat.sub}</div>
                </div>
              ))}
            </div>
          </AnimatedContent>

          <AnimatedContent stagger delay={0.6} staggerDelay={0.1} distance={10}>
            {/* FEATURE LIST */}
            <div className="mt-8 space-y-0">
              {[
                { 
                  icon: <TrendingUp />, 
                  title: "Profit & Cash Flow Real-time", 
                  desc: "Margin bersih otomatis terhitung setelah susut dan biaya kirim." 
                },
                { 
                  icon: <Truck />, 
                  title: "Tracking Pengiriman & Loss", 
                  desc: "Pantau mortalitas dan susut berat dari satu dashboard." 
                },
                { 
                  icon: <BarChart2 />, 
                  title: "Harga Pasar Transparan", 
                  desc: "Data harga dari transaksi nyata — bukan rumor atau estimasi." 
                },
                { 
                  icon: <Clock />, 
                  title: "Piutang & Jatuh Tempo", 
                  desc: "Pantau semua piutang RPA dan status pembayaran otomatis." 
                },
              ].map((item, i, arr) => (
                <div key={i} className={`flex gap-3 items-start py-3 ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <div className="w-8 h-8 bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    {React.cloneElement(item.icon, { size: 16, className: "text-[#10B981]" })}
                  </div>
                  <div>
                    <h4 className="text-[#F1F5F9] text-sm font-semibold">{item.title}</h4>
                    <p className="text-[#4B6478] text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedContent>

          {/* TESTIMONIAL */}
          <AnimatedContent delay={0.8} distance={20}>
            <div className="mt-8">
              <div className="bg-[#0C1319]/80 border-l-2 border-[#10B981] rounded-xl p-4">
                <p className="text-[#94A3B8] text-xs italic leading-relaxed">
                  "Proses pendaftaran sangat mudah. Dalam hitungan menit, saya sudah bisa input transaksi pertama saya."
                </p>
                <div className="flex gap-2 items-center mt-3">
                  <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center text-[10px] font-bold text-[#06090F]">
                    AS
                  </div>
                  <div>
                    <p className="text-[#F1F5F9] text-xs font-semibold">Andi Saputra</p>
                    <p className="text-[#4B6478] text-[10px]">Peternak Ayam, Magelang</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </motion.div>

      {/* RIGHT PANEL - FORM */}
      <div className="flex-1 flex items-center justify-center p-8 min-h-screen overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[400px] py-10"
        >
          <div className="md:hidden flex items-center justify-center gap-2 mb-8">
            <span className="text-2xl">🐔</span>
            <span style={{ fontFamily:'Sora', fontWeight:800, fontSize:'18px', color:'#F1F5F9' }}>TernakOS</span>
          </div>
          
          <h1 style={{ fontFamily: 'Sora', fontSize: '26px', fontWeight: 800, color: '#F1F5F9', margin: '0 0 8px', letterSpacing: '-0.3px' }}>Buat akun baru</h1>
          <p style={{ fontSize: '14px', color: '#4B6478', margin: '0 0 32px', lineHeight: 1.6 }}>14 hari gratis, tanpa kartu kredit.</p>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || isLoading}
            className={`w-full h-12 border-white/15 bg-transparent text-[#F1F5F9] font-semibold rounded-xl hover:border-white/30 hover:bg-white/5 transition-all flex items-center justify-center p-0 ${
              (googleLoading || isLoading) ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin text-[#F1F5F9]" />
            ) : (
              <>
                <GoogleIcon /> Daftar dengan Google
              </>
            )}
          </Button>

          <div className="flex items-center gap-3 my-6">
            <Separator className="flex-1 bg-white/5" />
            <span className="text-[11px] text-[#4B6478] font-bold uppercase tracking-widest">atau</span>
            <Separator className="flex-1 bg-white/5" />
          </div>

          <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => setMode('mandiri')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                mode === 'mandiri' 
                  ? 'bg-[#10B981] text-white rounded-lg shadow-lg' 
                  : 'bg-transparent text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              Daftar Mandiri
            </button>
            <button
              type="button"
              onClick={() => setMode('invite')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                mode === 'invite' 
                  ? 'bg-[#10B981] text-white rounded-lg shadow-lg' 
                  : 'bg-transparent text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              Punya Kode Undangan
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginLeft: '4px' }}>Nama Lengkap</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Budi Santoso"
                {...register('fullName')}
                style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '13px 14px', color: '#F1F5F9' }}
                className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 h-12"
              />
              {errors.fullName && <p className="text-xs text-red-400 mt-1 ml-1">{errors.fullName.message}</p>}
            </div>

            {/* Kode Undangan (Invite only) */}
            {mode === 'invite' && (
              <div className="space-y-1.5">
                <Label htmlFor="inviteCode" style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginLeft: '4px' }}>Kode Undangan</Label>
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  placeholder="Contoh: A3K9FZ"
                  maxLength={6}
                  {...register('inviteCode')}
                  onChange={(e) => {
                    setValue('inviteCode', e.target.value.toUpperCase())
                  }}
                  style={{ 
                    background: '#111C24', 
                    border: '1px solid rgba(255,255,255,0.09)', 
                    borderRadius: '12px', 
                    padding: '13px 14px', 
                    color: '#F1F5F9',
                    textAlign: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    letterSpacing: '0.4em'
                  }}
                  className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 h-12"
                />
                {errors.inviteCode && <p className="text-xs text-red-400 mt-1 ml-1">{errors.inviteCode.message}</p>}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginLeft: '4px' }}>Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                {...register('email')}
                style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '13px 14px', color: '#F1F5F9' }}
                className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 h-12"
              />
              {errors.email && <p className="text-xs text-red-400 mt-1 ml-1">{errors.email.message}</p>}
            </div>
            
            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginLeft: '4px' }}>Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    {...register('password')}
                    style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '13px 14px', color: '#F1F5F9' }}
                    className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 h-12"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-400 mt-1 ml-1">{errors.password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginLeft: '4px' }}>Konfirmasi</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Konfirmasi Password"
                    {...register('confirmPassword')}
                    style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '13px 40px 13px 14px', color: '#F1F5F9' }}
                    className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4B6478', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-400 mt-1 ml-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="agreedToTerms"
                {...register('agreedToTerms')}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-[#111C24] text-emerald-500 accent-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
              />
              <label htmlFor="agreedToTerms" className="text-[13px] text-[#4B6478] leading-relaxed cursor-pointer select-none">
                Saya menyetujui <Link to="/terms" className="text-emerald-400 hover:underline">Syarat & Ketentuan</Link> dan <Link to="/privacy" className="text-emerald-400 hover:underline">Kebijakan Privasi</Link> TernakOS
              </label>
            </div>
            {errors.agreedToTerms && <p className="text-xs text-red-400 ml-7">{errors.agreedToTerms.message}</p>}
            
            {authError && (
              <div className="p-3 bg-red-400/10 border border-red-400/20 rounded-xl flex items-center gap-2 text-[13px] text-red-400">
                <AlertCircle size={14} className="shrink-0" />
                {authError}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={isLoading || googleLoading}
              style={{
                width: '100%',
                height: '50px',
                background: '#10B981',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontFamily: 'Sora',
                fontSize: '15px',
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
                marginTop: '12px'
              }}
              className={`hover:bg-emerald-600 transition-colors ${(isLoading || googleLoading) ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin mr-2" />
                  Memproses...</>
              ) : (mode === 'mandiri' ? 'Daftar Gratis →' : 'Bergabung ke Tim')}
            </Button>
          </form>
          
          <div className="flex items-center gap-3 my-8">
            <Separator className="flex-1 bg-white/5" />
            <span className="text-[12px] text-[#4B6478] whitespace-nowrap">Sudah punya akun?</span>
            <Separator className="flex-1 bg-white/5" />
          </div>
          
          <Button
            variant="outline"
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              height: '50px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              color: '#F1F5F9',
              fontFamily: 'Sora',
              fontSize: '15px',
              fontWeight: 600
            }}
            className="hover:bg-white/5 transition-colors"
          >
            Masuk Sekarang
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
