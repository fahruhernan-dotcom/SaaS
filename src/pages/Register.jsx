import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Eye, EyeOff, AlertCircle, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    if (!email || !password || !fullName || !businessName) {
      setError('Mohon isi semua field.')
      return
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
            user_type: 'broker'
          }
        }
      })
      
      if (error) throw error
      
      // Auto-confirm business model as 'broker' to skip popup
      // We use a retry loop because the profile is created via a trigger which might have a slight delay
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        let retries = 5
        let profileUpdated = false
        
        while (retries > 0 && !profileUpdated) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              user_type: 'broker',
              business_model_selected: true
            })
            .eq('auth_user_id', user.id)
          
          if (!updateError) {
            profileUpdated = true
          } else {
            // Wait 500ms before next retry
            await new Promise(resolve => setTimeout(resolve, 500))
            retries--
          }
        }
      }
      
      navigate('/broker/beranda')
      toast.success('Akun berhasil dibuat! Selamat datang di TernakOS.')
      
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#06090F] overflow-x-hidden">
      {/* LEFT PANEL - BRANDING (Desktop only) */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hidden md:flex md:w-[45%] relative border-right border-white/5 flex-col justify-between p-10 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0C1319 0%, #060D12 50%, #0A1A12 100%)'
        }}
      >
        {/* Decorations */}
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

        {/* LOGO */}
        <div className="flex items-center gap-[10px] relative z-10">
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
        </div>

        {/* MIDDLE STATS */}
        <div className="flex flex-col gap-6 relative z-10">
          <h2 style={{
            fontFamily: 'Sora',
            fontSize: '32px',
            fontWeight: 800,
            color: '#F1F5F9',
            lineHeight: 1.2,
            letterSpacing: '-0.5px',
            margin: 0
          }}>
            Siap untuk mendigitalkan<br/>
            <span style={{
              background: 'linear-gradient(135deg, #10B981, #34D399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              bisnis kamu?
            </span>
          </h2>
          
          <p style={{
            fontSize: '15px',
            color: '#4B6478',
            lineHeight: 1.7,
            margin: 0,
            maxWidth: '340px'
          }}>
            Bergabunglah dengan ratusan broker dan peternak yang telah
            meningkatkan efisiensi dan transparansi bisnis mereka bersama TernakOS.
          </p>
          
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { value: 'FREE', label: 'Trial 14 Hari' },
              { value: '3-Min', label: 'Setup Akun' },
              { value: 'Secure', label: 'Enkripsi Data' },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: '14px',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.12)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{
                  fontFamily: 'Sora',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#34D399',
                  margin: '0 0 2px'
                }}>
                  {stat.value}
                </p>
                <p style={{
                  fontSize: '11px',
                  color: '#4B6478',
                  margin: 0
                }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* TESTIMONIAL */}
        <blockquote style={{
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderLeft: '3px solid #10B981',
          borderRadius: '0 12px 12px 0',
          margin: 0,
          position: 'relative',
          zRef: 10
        }}>
          <p style={{
            fontSize: '14px',
            color: '#94A3B8',
            lineHeight: 1.7,
            margin: '0 0 10px',
            fontStyle: 'italic'
          }}>
            "Proses pendaftaran sangat mudah. Dalam hitungan menit, saya sudah
             bisa input transaksi pertama saya. Benar-benar user-friendly."
          </p>
          <div className="flex items-center gap-[10px]">
            <div style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'rgba(16,185,129,0.15)',
              border: '1.5px solid rgba(16,185,129,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Sora',
              fontWeight: 800,
              fontSize: '12px',
              color: '#34D399'
            }}>
              AS
            </div>
            <div>
              <p style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#F1F5F9',
                margin: 0
              }}>
                Andi Saputra
              </p>
              <p style={{
                fontSize: '11px',
                color: '#4B6478',
                margin: 0
              }}>
                Peternak Ayam, Magelang
              </p>
            </div>
          </div>
        </blockquote>
      </motion.div>

      {/* RIGHT PANEL - FORM */}
      <div className="flex-1 flex items-center justify-center p-8 min-h-screen overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[400px] py-10"
        >
          {/* HEADER (Mobile Logo) */}
          <div className="md:hidden flex items-center justify-center gap-2 mb-8">
            <span className="text-2xl">🐔</span>
            <span style={{
              fontFamily:'Sora', fontWeight:800,
              fontSize:'18px', color:'#F1F5F9'
            }}>TernakOS</span>
          </div>
          
          <h1 style={{
            fontFamily: 'Sora',
            fontSize: '26px',
            fontWeight: 800,
            color: '#F1F5F9',
            margin: '0 0 8px',
            letterSpacing: '-0.3px'
          }}>
            Buat akun baru
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#4B6478',
            margin: '0 0 32px',
            lineHeight: 1.6
          }}>
            Lengkapi data di bawah untuk memulai trial gratis 14 hari
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="space-y-4">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <Label style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginLeft: '4px' }}>
                Nama Lengkap
              </Label>
              <Input
                placeholder="Budi Santoso"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '13px 14px', color: '#F1F5F9' }}
                className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            {/* Nama Bisnis */}
            <div className="space-y-1.5">
              <Label style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginLeft: '4px' }}>
                Nama Bisnis
              </Label>
              <Input
                placeholder="Ex: Broker Jaya Makmur"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '13px 14px', color: '#F1F5F9' }}
                className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <Label style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginLeft: '4px' }}>
                Email
              </Label>
              <Input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '13px 14px', color: '#F1F5F9' }}
                className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
            
            {/* Password field */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginLeft: '4px' }}>
                  Password
                </Label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '13px 14px', color: '#F1F5F9' }}
                  className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>
              <div className="space-y-1.5 relative">
                <Label style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginLeft: '4px' }}>
                  Konfirmasi
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '13px 40px 13px 14px', color: '#F1F5F9' }}
                    className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4B6478', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
              onClick={handleRegister}
              disabled={isLoading || !email || !password || !fullName || !businessName}
              style={{
                width: '100%',
                height: '50px',
                background: '#10B981',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontFamily: 'DM Sans',
                fontSize: '15px',
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
                marginTop: '12px'
              }}
              className="hover:bg-emerald-600 transition-colors"
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" />
                  Memproses...</>
              ) : 'Daftar Gratis'}
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
              fontFamily: 'DM Sans',
              fontSize: '15px',
              fontWeight: 600
            }}
            className="hover:bg-white/5 transition-colors"
          >
            Masuk Sekarang
          </Button>
          
          <p className="text-[12px] text-[#4B6478] text-center mt-8 leading-relaxed">
            Dengan mendaftar, kamu menyetujui{' '}
            <span className="text-emerald-400 cursor-pointer hover:underline">
              Syarat & Ketentuan
            </span>{' '}
            dan{' '}
            <span className="text-emerald-400 cursor-pointer hover:underline">
              Kebijakan Privasi
            </span>{' '}
            kami.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
