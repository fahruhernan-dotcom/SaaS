import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getBrokerBasePath } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import LoadingScreen from '@/components/LoadingScreen'
import { motion } from 'framer-motion'
import { AlertTriangle, RotateCcw, LogIn } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // Parse error from hash fragment (e.g. #error=access_denied&error_code=otp_expired&...)
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const errorCode = params.get('error_code')
      const errorDesc = params.get('error_description')

      if (errorCode || params.get('error')) {
        const friendlyMessages = {
          'otp_expired': 'Link konfirmasi email sudah kadaluarsa. Silakan minta link baru.',
          'access_denied': 'Akses ditolak. Silakan coba login ulang.',
          'invalid_request': 'Permintaan tidak valid. Silakan coba lagi.',
        }

        setAuthError({
          code: errorCode || params.get('error'),
          message: friendlyMessages[errorCode] || errorDesc?.replace(/\+/g, ' ') || 'Terjadi kesalahan saat verifikasi email.',
        })
        return
      }
    }

    // Normal flow: get session and redirect
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        navigate('/login', { replace: true })
        return
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*, tenants(sub_type, business_vertical)')
        .eq('auth_user_id', session.user.id)

      if (!profiles || profiles.length === 0) {
        navigate('/onboarding', { replace: true })
        toast.info('Yuk lengkapi profil bisnismu dulu!')
        return
      }

      const profile = profiles.find(p => p.onboarded) || profiles[0]

      if (!profile.onboarded) {
        navigate('/onboarding', { replace: true })
        return
      }

      if (profile.role === 'superadmin' || profile.user_type === 'superadmin') {
        navigate('/admin', { replace: true })
        toast.success('Selamat datang kembali, Admin!')
        return
      }

      if (profile.user_type === 'peternak') {
        navigate(`/peternak/${profile.tenants?.sub_type || 'peternak_broiler'}/beranda`, { replace: true })
        toast.success('Selamat datang kembali!')
        return
      }

      if (profile.user_type === 'rumah_potong') {
        const rpType = profile.tenants?.sub_type?.startsWith('rpa') ? 'rpa' : 'rph'
        navigate(`/rumah_potong/${rpType}/beranda`, { replace: true })
        toast.success('Selamat datang kembali!')
        return
      }

      navigate(getBrokerBasePath(profile.tenants) + '/beranda', { replace: true })
      toast.success('Selamat datang kembali!')
    })
  }, [navigate])

  // Show error UI for expired/invalid links
  if (authError) {
    return (
      <div className="min-h-screen bg-[#06090F] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          {/* Error Icon */}
          <div className="mx-auto w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8">
            <AlertTriangle size={36} className="text-red-500" />
          </div>

          {/* Error Title */}
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight mb-3">
            Link Tidak Valid
          </h1>

          {/* Error Message */}
          <p className="text-[#94A3B8] font-medium text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            {authError.message}
          </p>

          {/* Error Code Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/5 border border-red-500/10 mb-10">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
              Error: {authError.code}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {authError.code === 'otp_expired' && (
              <Link 
                to="/forgot-password" 
                className="flex items-center justify-center gap-3 w-full h-14 bg-[#22C55E] hover:bg-[#16A34A] text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
              >
                <RotateCcw size={16} strokeWidth={2.5} />
                Minta Link Baru
              </Link>
            )}

            <Link 
              to="/login" 
              className="flex items-center justify-center gap-3 w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
            >
              <LogIn size={16} strokeWidth={2.5} />
              Kembali ke Login
            </Link>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mt-12">
            TernakOS • Verifikasi Email
          </p>
        </motion.div>
      </div>
    )
  }

  return <LoadingScreen />
}
