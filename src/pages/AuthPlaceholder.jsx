import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuroraBackground from '../components/reactbits/AuroraBackground';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../lib/hooks/useAuth';

export default function AuthPlaceholder({ type = 'login' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLogin = type === 'login';
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail ] = useState(''); // We use email or formatted phone
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isLogin) {
        // For simplicity, we assume the user enters email or we treat phone as identifier
        // In real app, might need more complex phone auth or email auth
        const { error } = await supabase.auth.signInWithPassword({
          email: email.includes('@') ? email : `${email}@ternakos.id`, 
          password
        });
        if (error) throw error;
        toast.success('Login berhasil! 👋');
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.includes('@') ? email : `${email}@ternakos.id`,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        toast.success('Registrasi berhasil! Silakan cek email/langsung masuk.');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuroraBackground>
      {/* Navbar prop authPage=true */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <Navbar authPage={true} />
      </div>
      
      <main className="min-h-screen flex items-center justify-center p-4 pt-24 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            maxWidth: '440px',
            width: '90%',
            margin: '0 auto',
            padding: '20px',
          }}
        >
          {/* Card dengan glass effect */}
          <div style={{
            background: 'rgba(10, 15, 22, 0.75)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            padding: '40px 36px',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.04),
              0 24px 56px rgba(0,0,0,0.5),
              0 0 80px rgba(16,185,129,0.04)
            `,
            position: 'relative',
            overflow: 'hidden',
          }}>

            {/* Top accent line */}
            <div style={{
              position: 'absolute',
              top: 0, left: '15%', right: '15%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)',
            }} />

            <Link to="/" 
              className="group"
              style={{
                color: '#34D399',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '28px',
                cursor: 'pointer',
                transition: 'gap 0.15s',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.gap = '10px'; }}
              onMouseLeave={(e) => { e.currentTarget.style.gap = '6px'; }}
            >
              <ArrowLeft size={16} /> Kembali ke Beranda
            </Link>
            
            <h1 style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '-1px',
              color: '#F1F5F9',
              lineHeight: 1.15,
              marginBottom: '8px'
            }}>
              {isLogin ? 'Selamat Datang Kembali' : 'Mulai Bisnis Digital'}
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '15px',
              color: '#4B6478',
              lineHeight: 1.6,
              marginBottom: '32px'
            }}>
              {isLogin 
                ? 'Masuk ke akun TernakOS untuk pantau bisnis kamu.' 
                : 'Gabung dengan 500+ peternak sukses di Indonesia.'}
            </p>

            <form onSubmit={handleSubmit}>
              <motion.div 
                initial="hidden" 
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } }
                }}
                className="space-y-6"
              >
                {!isLogin && (
                  <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
                    <label style={labelStyle}>Nama Lengkap</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Budi Santoso"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={inputStyle}
                      className="focus:outline-none focus:border-[rgba(16,185,129,0.50)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08)] focus:bg-[#162230]"
                    />
                  </motion.div>
                )}

                <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
                  <label style={labelStyle}>
                    {isLogin ? 'Email atau WhatsApp' : 'Email Aktif'}
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#111C24',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.09)',
                    overflow: 'hidden',
                    transition: 'all 0.15s'
                  }} className="focus-within:border-[rgba(16,185,129,0.50)] focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.08)] focus-within:bg-[#162230]">
                    <input 
                      type="text" 
                      placeholder={isLogin ? "email@domain.com" : "Masukan email anda"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        padding: '14px 16px',
                        color: '#F1F5F9',
                        fontSize: '16px'
                      }}
                      className="placeholder-[#4B6478]"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
                  <label style={{
                    display: 'block',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#4B6478',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: '8px'
                  }}>
                    Kata Sandi
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        background: '#111C24',
                        border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        paddingRight: '46px',
                        fontSize: '16px',
                        color: '#F1F5F9',
                        width: '100%',
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'all 0.15s'
                      }}
                      className="placeholder-[#4B6478] focus:outline-none focus:border-[rgba(16,185,129,0.50)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.08)] focus:bg-[#162230]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#4B6478',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      className="hover:text-[#94A3B8] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>

                {isLogin && (
                  <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} className="flex justify-end mt-[-8px]">
                    <a href="#" style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: '#34D399', fontWeight: 600, textAlign: 'right', textDecoration: 'none' }} className="hover:opacity-70 transition-opacity">
                      Lupa kata sandi?
                    </a>
                  </motion.div>
                )}

                <motion.button 
                  type="submit"
                  disabled={isLoading}
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                  style={{
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '15px',
                    width: '100%',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '15px',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 0 0 1px rgba(16,185,129,0.20), 0 6px 20px rgba(16,185,129,0.18)',
                    marginTop: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => {
                    if (isLoading) return;
                    e.currentTarget.style.background = '#059669';
                    e.currentTarget.style.boxShadow = '0 0 0 1px rgba(16,185,129,0.30), 0 8px 28px rgba(16,185,129,0.25)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    if (isLoading) return;
                    e.currentTarget.style.background = '#10B981';
                    e.currentTarget.style.boxShadow = '0 0 0 1px rgba(16,185,129,0.20), 0 6px 20px rgba(16,185,129,0.18)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Masuk Sekarang' : 'Daftar Gratis')}
                </motion.button>

                <motion.p variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} style={{ textAlign: 'center', fontSize: '14px', color: '#4B6478', fontFamily: "'DM Sans', sans-serif", marginTop: '24px' }}>
                  {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'} {' '}
                  <Link to={isLogin ? '/register' : '/login'} style={{ color: '#34D399', fontWeight: 700, textDecoration: 'none' }}>
                    {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
                  </Link>
                </motion.p>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </main>
    </AuroraBackground>
  );
}

const labelStyle = {
  display: 'block',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '11px',
  fontWeight: 600,
  color: '#4B6478',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  marginBottom: '8px'
};

const inputStyle = {
  background: '#111C24',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '12px',
  padding: '14px 16px',
  fontSize: '16px',
  color: '#F1F5F9',
  width: '100%',
  fontFamily: "'DM Sans', sans-serif",
  transition: 'all 0.15s'
};
