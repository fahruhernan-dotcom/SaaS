import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Warehouse, Loader2 } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/hooks/useAuth'
import AuroraBackground from '../../../components/reactbits/AuroraBackground'

import Step0TipePilih from './steps/Step0TipePilih'
import Step1SubTipe from './steps/Step1SubTipe'
import Step2InfoBisnis from './steps/Step2InfoBisnis'
import Step3Setup from './steps/Step3Setup'
import { FourStepProgress, BlockedScreen } from './shared'
import { SUB_TYPE_TO_USER_TYPE, SUB_TYPE_TO_VERTICAL } from '../../../lib/businessModel'

// ── Helper functions ──────────────────────────────────────────────────────────

function mapSubTypeToVertical(sub_type) {
  return SUB_TYPE_TO_VERTICAL[sub_type] || 'poultry_broker'
}

function mapSubTypeToUserType(sub_type) {
  return SUB_TYPE_TO_USER_TYPE[sub_type] || 'broker'
}

function getRouteBySubType(sub_type) {
  const userType = SUB_TYPE_TO_USER_TYPE[sub_type]
  if (userType === 'peternak') return '/peternak/beranda'
  if (userType === 'rpa') return '/rpa-buyer/beranda'
  return '/broker/beranda'
}

async function insertVerticalProfile(tenantId, sub_type, data) {
  try {
    const userType = SUB_TYPE_TO_USER_TYPE[sub_type]
    if (userType === 'broker') {
      await supabase.from('broker_profiles').upsert({ tenant_id: tenantId, ...data })
    } else if (userType === 'peternak') {
      await supabase.from('peternak_profiles').upsert({ tenant_id: tenantId, ...data })
    } else if (userType === 'rpa') {
      await supabase.from('rpa_profiles').upsert({ tenant_id: tenantId, ...data })
    }
  } catch (err) {
    // Non-blocking: vertical profile table may not exist yet
    console.warn('insertVerticalProfile skipped:', err.message)
  }
}

// ── Animation variants ────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (dir) => ({ zIndex: 0, x: dir < 0 ? 40 : -40, opacity: 0 }),
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const { user, profile, profiles, tenant, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isNewBusiness = searchParams.get('mode') === 'new_business'

  // Trial gate
  const hasActiveTrial = profiles?.some(p => {
    const t = p.tenants
    return t?.plan === 'starter' && t?.is_active === true && new Date(t?.trial_ends_at) > new Date()
  })
  const hasPaidPlan = profiles?.some(p => ['pro', 'business'].includes(p.tenants?.plan))
  const hasAnyBusiness = (profiles?.length ?? 0) > 0
  const isBlocked = isNewBusiness && hasAnyBusiness && hasActiveTrial && !hasPaidPlan

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tipe: '',
    sub_type: '',
    full_name: '',
    business_name: '',
    phone: '',
    location: '',
    specific: {},
  })

  // Guard: Redirect non-owners or already onboarded users
  useEffect(() => {
    if (!profile || isNewBusiness) return

    if (profile.role === 'staff') {
      const vertical = profile.tenants?.business_vertical || 'poultry_broker'
      const dashPath = vertical === 'egg_broker' ? '/egg/beranda'
        : vertical === 'peternak' ? '/peternak/beranda'
        : vertical === 'rpa' ? '/rpa-buyer/beranda'
        : `/broker/${vertical}/beranda`
      navigate(dashPath, { replace: true })
      return
    }

    if (profile.onboarded === true && profile.business_model_selected === true) {
      const vertical = profile.tenants?.business_vertical || 'poultry_broker'
      const dashPath = vertical === 'egg_broker' ? '/egg/beranda'
        : vertical === 'peternak' ? '/peternak/beranda'
        : vertical === 'rpa' ? '/rpa-buyer/beranda'
        : `/broker/${vertical}/beranda`
      navigate(dashPath, { replace: true })
      return
    }
  }, [profile, navigate, isNewBusiness])

  // Pre-fill business name from tenant for Flow B
  useEffect(() => {
    if (isNewBusiness && tenant?.business_name && tenant.business_name !== 'Bisnis Saya') {
      setFormData(prev => ({ ...prev, business_name: tenant.business_name }))
    }
  }, [tenant, isNewBusiness])

  if (!profile && !isNewBusiness) {
    return (
      <div className="min-h-screen bg-[#06090F] flex items-center justify-center">
        <div className="text-[#4B6478] text-sm font-medium animate-pulse">Memuat profil...</div>
      </div>
    )
  }

  if (!user || (!profile && isNewBusiness)) {
    return (
      <div className="min-h-screen bg-[#06090F] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500 mr-2" size={20} />
        <div className="text-[#4B6478] text-sm font-medium animate-pulse">Menyiapkan form...</div>
      </div>
    )
  }

  if (isBlocked) return <BlockedScreen profiles={profiles} />

  // Navigation
  const nextStep = (data = {}) => {
    setFormData(prev => ({ ...prev, ...data }))
    setDirection(1)
    setStep(s => s + 1)
  }

  const prevStep = () => {
    setDirection(-1)
    setStep(s => s - 1)
  }

  // Submit handler
  const handleSubmit = async (specificData = {}) => {
    setLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const { data: profiles, error: profileFetchErr } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('auth_user_id', authUser.id)

      if (profileFetchErr || !profiles?.length) {
        throw new Error('Profil tidak ditemukan. Coba logout dan login ulang.')
      }

      const tenantId = profiles[0].tenant_id

      if (isNewBusiness) {
        // Flow B: direct INSERT ke tenants diblokir RLS jika user sudah punya profile.
        // Gunakan SECURITY DEFINER function agar bypass RLS dengan aman.
        const { data: newTenantId, error: rpcErr } = await supabase.rpc('create_new_business', {
          p_business_name:     formData.business_name,
          p_business_vertical: mapSubTypeToVertical(formData.sub_type),
          p_phone:             formData.phone    || null,
          p_location:          formData.location || null,
        })
        if (rpcErr) throw rpcErr

        await insertVerticalProfile(newTenantId, formData.sub_type, specificData)
        localStorage.setItem('ternakos_active_tenant_id', newTenantId)

      } else {
        // Flow A: UPDATE existing placeholder tenant from trigger
        const { error: tenantErr } = await supabase.from('tenants').update({
          business_name: formData.business_name,
          business_vertical: mapSubTypeToVertical(formData.sub_type),
          // sub_type column: add via DB migration if needed
          phone: formData.phone,
          location: formData.location,
          plan: 'starter',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          kandang_limit: 1,
        }).eq('id', tenantId)

        if (tenantErr) {
          if (tenantErr.code === '42P17') {
            console.error('RLS recursion on tenants update:', tenantErr)
            toast.warning('Data bisnis disimpan sebagian. Lengkapi nama bisnis di menu Akun.')
          } else {
            throw tenantErr
          }
        }

        const { error: profileErr } = await supabase.from('profiles').update({
          full_name: formData.full_name || '',
          user_type: mapSubTypeToUserType(formData.sub_type),
          onboarded: true,
          business_model_selected: true,
          onboarding_completed_at: new Date().toISOString(),
        }).eq('auth_user_id', authUser.id)

        if (profileErr) throw profileErr

        await insertVerticalProfile(tenantId, formData.sub_type, specificData)
        localStorage.setItem('ternakos_active_tenant_id', tenantId)
      }

      await refetchProfile()
      toast.success('Setup selesai! Selamat datang di TernakOS 🎉')
      navigate(getRouteBySubType(formData.sub_type))

    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#06090F] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {step === 0 && <AuroraBackground style={{ position: 'absolute', inset: 0, minHeight: '100%', zIndex: 0 }} />}

      <div className={`w-full ${step === 0 || step === 1 ? 'max-w-xl' : 'max-w-md'} flex flex-col items-center gap-6 z-10 relative transition-all duration-300`}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div style={{ width: '32px', height: '32px', background: '#10B981', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Warehouse size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'Sora', fontSize: '18px', fontWeight: 700, color: '#F1F5F9' }}>TernakOS</span>
        </div>

        {/* 4-step progress */}
        <FourStepProgress current={step} />

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {step === 0 && (
              <Step0TipePilih onNext={nextStep} />
            )}
            {step === 1 && (
              <Step1SubTipe
                tipe={formData.tipe}
                onNext={nextStep}
                onBack={prevStep}
              />
            )}
            {step === 2 && (
              <Step2InfoBisnis
                onNext={nextStep}
                onBack={prevStep}
                defaultValues={{
                  full_name: formData.full_name,
                  business_name: formData.business_name,
                  phone: formData.phone,
                  location: formData.location,
                }}
              />
            )}
            {step === 3 && (
              <Step3Setup
                subType={formData.sub_type}
                formData={formData}
                onBack={prevStep}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
