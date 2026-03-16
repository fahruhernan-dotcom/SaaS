import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
        if (error.message.includes('Invalid login credentials')) {
          setError('Email atau password salah. Coba lagi.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Email belum dikonfirmasi. Cek inbox kamu.')
        } else {
          setError(error.message)
        }
        return
      }
      
      navigate('/broker/beranda')
      toast.success('Selamat datang kembali!')
      
    } catch (err) {
      setError('Terjadi kesalahan. Coba lagi.')
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
            Kelola bisnis ayam<br/>
            <span style={{
              background: 'linear-gradient(135deg, #10B981, #34D399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              lebih cerdas.
            </span>
          </h2>
          
          <p style={{
            fontSize: '15px',
            color: '#4B6478',
            lineHeight: 1.7,
            margin: 0,
            maxWidth: '340px'
          }}>
            Platform SaaS untuk broker, peternak, dan RPA.
            Catat transaksi, pantau piutang, dan analisis
            profit bisnis ayam kamu dalam satu dashboard.
          </p>
          
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { value: '< 2 min', label: 'Catat transaksi' },
              { value: 'Real-time', label: 'Update harga' },
              { value: '100%', label: 'Data aman' },
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
            "Dulu catat transaksi pakai buku, sekarang
             semua langsung keliatan profit hari ini.
             TernakOS sangat membantu bisnis saya."
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
              PH
            </div>
            <div>
              <p style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#F1F5F9',
                margin: 0
              }}>
                Pak Harto
              </p>
              <p style={{
                fontSize: '11px',
                color: '#4B6478',
                margin: 0
              }}>
                Broker Ayam, Boyolali
              </p>
            </div>
          </div>
        </blockquote>
      </motion.div>

      {/* RIGHT PANEL - FORM */}
      <div className="flex-1 flex items-center justify-center p-8 min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[400px]"
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
            Selamat datang kembali
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#4B6478',
            margin: '0 0 32px',
            lineHeight: 1.6
          }}>
            Masukkan email dan password kamu untuk masuk
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            {/* Email field */}
            <div className="space-y-1.5">
              <Label style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#94A3B8',
                marginLeft: '4px',
                display: 'block'
              }}>
                Email
              </Label>
              <Input
                type="text"
                placeholder="nama@email.com atau nama"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  background: '#111C24',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '10px',
                  padding: '13px 14px',
                  fontSize: '16px',
                  color: '#F1F5F9',
                  height: 'auto',
                  width: '100%'
                }}
                className="focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
            
            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1 pr-1">
                <Label style={{
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    background: '#111C24',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: '10px',
                    padding: '13px 44px 13px 14px',
                    fontSize: '16px',
                    color: '#F1F5F9',
                    height: 'auto',
                    width: '100%'
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
                height: '50px',
                background: '#10B981',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontFamily: 'DM Sans',
                fontSize: '15px',
                fontWeight: 700,
                boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
                cursor: isLoading || !email || !password
                  ? 'not-allowed' : 'pointer',
                opacity: !email || !password ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '12px'
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
            Daftar Sekarang — Gratis 14 Hari
          </Button>
          
          <p className="text-[12px] text-[#4B6478] text-center mt-8 leading-relaxed">
            Dengan masuk, kamu menyetujui{' '}
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
