import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getBrokerBasePath } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import LoadingScreen from '@/components/LoadingScreen'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
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

  return <LoadingScreen />
}
