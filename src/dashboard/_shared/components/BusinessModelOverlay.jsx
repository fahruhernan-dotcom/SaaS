import React, { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Lock, ArrowLeft, Building2, MapPin, ChevronDown, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { BUSINESS_MODELS, BUSINESS_CATEGORIES, ANIMAL_GROUPS, resolveBusinessVertical } from '@/lib/businessModel'
import { toTitleCase } from '@/lib/format'
import { PROVINCES } from '@/lib/constants/regions'
import { checkQuotaUsage } from '@/lib/quotaUtils'
import { toast } from 'sonner'
import StepSetup from './onboarding/StepSetup'

// Verticals that need a dedicated setup step after business name
const SETUP_REQUIRED_VERTICALS = new Set(['peternak_sapi_penggemukan'])

export default function BusinessModelOverlay({ user, profile, isNewBusiness, onComplete }) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState(null)
  const [animalGroup, setAnimalGroup] = useState(null)
  const [selected, setSelected] = useState(null)
  const [businessName, setBusinessName] = useState('')
  const [nameChecking, setNameChecking] = useState(false)
  const [nameTaken, setNameTaken] = useState(false)
  const [province, setProvince] = useState('')
  const [provinceSearch, setProvinceSearch] = useState('')
  const [provinceOpen, setProvinceOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [setupData, setSetupData] = useState({
    batch_name: '',
    start_date: new Date().toISOString().split('T')[0],
    initial_count: '',
    initial_avg_weight: '',
    purchase_price_per_kg: '',
  })
  const debounceRef = useRef(null)

  // Verticals that need extra setup step
  const needsSetupStep = SETUP_REQUIRED_VERTICALS.has(selected)

  // Dynamic step count:
  // Peternak: Category(1) → Animal Group(2) → Sub-role(3) → Name(4) [→ Setup(5) if sapi]
  // Others: Category(1) → Sub-role(2) → Name(3)
  const peternak_base_steps = 4
  const totalSteps = category === 'peternak'
    ? (needsSetupStep ? 5 : 4)
    : 3
  const isPeternak = category === 'peternak'
  const isAnimalStep = isPeternak && step === 2
  const isSubRoleStep = isPeternak ? step === 3 : step === 2
  const isNameStep = isPeternak ? step === 4 : step === 3
  const isSetupStep = needsSetupStep && step === 5

  // Memoize sub-roles based on category + animal group
  const subRoles = useMemo(() => {
    if (!category) return []
    if (isPeternak && animalGroup) {
      const group = ANIMAL_GROUPS.find(g => g.key === animalGroup)
      if (group) return Object.values(BUSINESS_MODELS).filter(m => m.category === 'peternak' && group.filter(m))
    }
    return Object.values(BUSINESS_MODELS).filter(m => m.category === category)
  }, [category, animalGroup, isPeternak])

  // New: Role Locking Logic
  const isRoleLocked = useMemo(() => {
    // Platform-wide admins (superadmin) should not be locked into a specific business category
    // They should be able to create any type of business
    if (profile?.role === 'superadmin' || profile?.user_type === 'superadmin') return false
    return isNewBusiness || profile?.onboarded
  }, [isNewBusiness, profile])

  const primaryRoleInfo = useMemo(() => {
    if (!isRoleLocked || !profile) return null
    
    // Use the explicit user_type if it's a valid business category
    const userType = profile.user_type
    const validCategory = BUSINESS_CATEGORIES.find(c => c.key === userType)
    
    if (validCategory) {
      return {
        category: userType,
        label: validCategory.label || 'Bisnis'
      }
    }

    const verticalKey = resolveBusinessVertical(profile, profile.tenants)
    const model = BUSINESS_MODELS[verticalKey]
    return {
       category: model?.category || 'broker',
       label: model?.categoryLabel || 'Bisnis'
    }
  }, [profile, isRoleLocked])

  // Auto-skip step 1 ONLY if role is locked
  useEffect(() => {
    if (isRoleLocked && primaryRoleInfo && step === 1) {
      setCategory(primaryRoleInfo.category)
      setStep(2)
    }
  }, [isRoleLocked, primaryRoleInfo, step])

  // Allow rendering even without profile (for brand new users)
  // But if session is already onboarded and NOT in new business mode, hide it (Safety)
  if (profile?.onboarded && !isNewBusiness) return null

  // Reset name check state when name changes
  const handleNameChange = (val) => {
    setBusinessName(val)
    setNameTaken(false)
    setNameChecking(val.trim().length >= 3)

    // Debounce uniqueness check: 600ms after user stops typing
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 3) { setNameChecking(false); return }

    debounceRef.current = setTimeout(async () => {
      const formatted = toTitleCase(val.trim())
      let query = supabase
        .from('tenants')
        .select('id')
        .ilike('business_name', formatted)
      
      if (profile?.tenant_id) {
        query = query.neq('id', profile.tenant_id)
      }

      const { data } = await query.limit(1)
      setNameChecking(false)
      setNameTaken(data && data.length > 0)
    }, 600)
  }

  // Called when user clicks "Mulai Sekarang" on name step
  const handleNameConfirm = async () => {
    if (!selected || !businessName.trim() || businessName.trim().length < 3) return
    if (nameTaken || nameChecking) return
    if (!province) return
    const model = BUSINESS_MODELS[selected]
    if (!model) return

    const formattedName = toTitleCase(businessName.trim())

    // Final server-side uniqueness check before saving
    let uniqueQuery = supabase
      .from('tenants')
      .select('id')
      .ilike('business_name', formattedName)
    
    if (profile?.tenant_id) {
      uniqueQuery = uniqueQuery.neq('id', profile.tenant_id)
    }

    const { data: existing } = await uniqueQuery.limit(1)
    
    if (existing && existing.length > 0) {
      setNameTaken(true)
      return
    }

    // If this vertical needs a setup step, go there instead of finishing
    if (needsSetupStep) {
      setStep(5)
      return
    }

    await saveAndComplete()
  }

  const saveAndComplete = async () => {
    const model = BUSINESS_MODELS[selected]
    if (!model) return
    const formattedName = toTitleCase(businessName.trim())

    setLoading(true)
    try {
      const targetAuthId = profile?.auth_user_id || user?.id
      if (!targetAuthId) throw new Error('User session missing')

      let resolvedTenantId = profile?.tenant_id

      if (isNewBusiness || !profile) {
        // --- SCALABILITY: Final Quota Check before RPC ---
        const quota = await checkQuotaUsage(null, profile, 'business')
        if (isNewBusiness && !quota.canAdd) {
          toast.error(`Jatah bisnis bapak sudah penuh (${quota.usage}/${quota.limit}). Silakan beli slot tambahan di Portal Add-on.`)
          setLoading(false)
          return
        }

        // --- MULTI-TENANT & NEW USER: Use RPC for Atomic Creation ---
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('create_new_business', {
            p_business_name: formattedName,
            p_business_vertical: model.key,
            p_location: province || null,
            p_phone: profile?.phone || user?.user_metadata?.phone || ''
          })

        if (rpcError) throw rpcError
        // Resolve the new tenant_id for setup step saving
        if (rpcData) resolvedTenantId = rpcData
        toast.success(isNewBusiness ? 'Bisnis baru berhasil dibuat!' : 'Profil bisnis berhasil dibuat!')

      } else {
        // --- INITIAL ONBOARDING: Update Existing Profile ---
        const { error: profError } = await supabase
          .from('profiles')
          .update({
            user_type: model.user_type,
            business_model_selected: true,
            onboarded: true,
          })
          .eq('auth_user_id', targetAuthId)

        if (profError) throw profError

        if (profile.tenant_id && model.sub_type) {
          const { error: tenError } = await supabase
            .from('tenants')
            .update({ 
              sub_type: model.sub_type,
              business_vertical: model.key,
              business_name: formattedName,
              province: province || null,
            })
            .eq('id', profile.tenant_id)
          
          if (tenError) throw tenError
        }
      }

      // --- SETUP STEP: Save initial batch for Sapi Penggemukan ---
      if (selected === 'peternak_sapi_penggemukan' && setupData.initial_count && resolvedTenantId) {
        const batchCode = `BATCH-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-001`
        await supabase.from('sapi_penggemukan_batches').insert({
          tenant_id: resolvedTenantId,
          batch_code: setupData.batch_name?.trim() || batchCode,
          start_date: setupData.start_date,
          total_animals: parseInt(setupData.initial_count) || 0,
          avg_entry_weight_kg: parseFloat(setupData.initial_avg_weight) || null,
          status: 'active',
          batch_purpose: 'potong',
          notes: setupData.purchase_price_per_kg
            ? `Harga beli: Rp ${parseInt(setupData.purchase_price_per_kg).toLocaleString('id-ID')}/kg`
            : null,
        })
      }

      if (onComplete) onComplete(selected)
    } catch (err) {
      console.error('Error saving business model:', err)
      toast.error('Gagal menyimpan pilihan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // Legacy alias used by the name step's confirm button
  const handleConfirm = handleNameConfirm

  const handleCategorySelect = (key) => {
    setCategory(key)
    setAnimalGroup(null)
    setSelected(null)
    setStep(2)
  }

  const handleAnimalGroupSelect = (key) => {
    setAnimalGroup(key)
    setSelected(null)
    setStep(3)
  }

  const handleSubRoleSelect = (key) => {
    setSelected(key)
    setStep(isPeternak ? 4 : 3)
    // Reset setup data when changing sub-role
    setSetupData({
      batch_name: '',
      start_date: new Date().toISOString().split('T')[0],
      initial_count: '',
      initial_avg_weight: '',
      purchase_price_per_kg: '',
    })
  }

  const handleBack = () => {
    if (isSetupStep) {
      setStep(4)
    } else if (isNameStep) {
      setStep(step - 1)
      setProvinceSearch('')
    } else if (isSubRoleStep) {
      if (isPeternak) {
        setStep(2) // back to animal group
        setSelected(null)
      } else {
        // If role is locked, they can't go back to Category selection (Step 1)
        if (isRoleLocked) return
        setStep(1)
        setCategory(null)
        setSelected(null)
      }
    } else if (isAnimalStep) {
      // If role is locked, they can't go back to Category selection (Step 1)
      if (isRoleLocked) return
      setStep(1)
      setCategory(null)
      setAnimalGroup(null)
      setSelected(null)
    } else {
      if (isRoleLocked) return
      setStep(1)
      setCategory(null)
      setSelected(null)
    }
  }

  const filteredProvinces = useMemo(() => {
    if (!provinceSearch) return PROVINCES
    return PROVINCES.filter(p => 
      p.toLowerCase().includes(provinceSearch.toLowerCase())
    )
  }, [provinceSearch])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto',
    }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: '#0C1319',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '24px',
          padding: '28px 20px',
          width: '100%',
          maxWidth: '440px',
          position: 'relative',
          margin: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => onComplete?.()}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-[#4B6478] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer z-20"
        >
          <X size={16} />
        </button>

        {/* Top accent */}
        <div style={{
          position: 'absolute',
          top: 0, left: '15%', right: '15%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
            <img src="/logo.png" alt="TernakOS" style={{ width: 30, height: 30, borderRadius: '8px', objectFit: 'cover' }} />
            <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '17px', color: '#F1F5F9' }}>TernakOS</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '14px' }}>
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} style={{
                height: '4px',
                width: step >= s ? '28px' : '16px',
                borderRadius: '99px',
                background: step >= s ? '#10B981' : 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h2 style={{ fontFamily: 'Sora', fontSize: '19px', fontWeight: 800, color: '#F1F5F9', marginBottom: '6px' }}>
                  Kamu berbisnis sebagai?
                </h2>
                <p style={{ fontSize: '13px', color: '#4B6478', lineHeight: 1.5 }}>
                  Pilih kategori bisnis kamu.
                </p>
              </motion.div>
            ) : isAnimalStep ? (
              <motion.div key="s-animal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h2 style={{ fontFamily: 'Sora', fontSize: '19px', fontWeight: 800, color: '#F1F5F9', marginBottom: '6px' }}>
                  Jenis hewan apa yang bapak ternak?
                </h2>
                <p style={{ fontSize: '13px', color: '#4B6478', lineHeight: 1.5 }}>
                  Pilih jenis ternak utama bapak.
                </p>
              </motion.div>
            ) : isSubRoleStep ? (
              <motion.div key="s-sub" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h2 style={{ fontFamily: 'Sora', fontSize: '19px', fontWeight: 800, color: '#F1F5F9', marginBottom: '6px' }}>
                  {isNewBusiness ? `Tambah Unit ${primaryRoleInfo?.label || 'Bisnis'} Baru` : 'Pilih spesialisasi'}
                </h2>
                <p style={{ fontSize: '13px', color: '#4B6478', lineHeight: 1.5 }}>
                  {isNewBusiness 
                    ? `Pilih spesialisasi unit ${primaryRoleInfo?.label?.toLowerCase() || 'bisnis'} tambahan.`
                    : 'Lebih spesifik agar dashboard sesuai kebutuhanmu.'}
                </p>
              </motion.div>
            ) : isNameStep ? (
              <motion.div key="s-name" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h2 style={{ fontFamily: 'Sora', fontSize: '19px', fontWeight: 800, color: '#F1F5F9', marginBottom: '6px' }}>
                  Nama {category === 'peternak' ? 'farm' : 'bisnis'} kamu apa?
                </h2>
                <p style={{ fontSize: '13px', color: '#4B6478', lineHeight: 1.5 }}>
                  {category === 'peternak' 
                    ? 'Nama cabang farm atau lokasi peternakan bapak yang baru.'
                    : 'Nama ini akan tampil di seluruh laporan dan invoice.'}
                </p>
              </motion.div>
            ) : isSetupStep ? (
              <motion.div key="s-setup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <h2 style={{ fontFamily: 'Sora', fontSize: '19px', fontWeight: 800, color: '#F1F5F9', marginBottom: '6px' }}>
                  Setup Batch Pertama 🐄
                </h2>
                <p style={{ fontSize: '13px', color: '#4B6478', lineHeight: 1.5 }}>
                  Data ini bisa diubah kapan saja dari menu Batch.
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {BUSINESS_CATEGORIES.map((cat) => (
                <CategoryCard key={cat.key} cat={cat} onClick={() => handleCategorySelect(cat.key)} />
              ))}
            </motion.div>
          ) : isAnimalStep ? (
            <motion.div
              key="step-animal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '2px' }}>
                {ANIMAL_GROUPS.map((group) => (
                  <ModelCard
                    key={group.key}
                    model={{
                      key: group.key,
                      label: group.label,
                      icon: group.icon,
                      description: group.description,
                      comingSoon: group.comingSoon,
                    }}
                    selected={animalGroup === group.key}
                    onClick={() => !group.comingSoon && handleAnimalGroupSelect(group.key)}
                  />
                ))}
              </div>

              {isRoleLocked ? null : (
                <button
                  onClick={handleBack}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', marginTop: '12px', padding: '10px', background: 'transparent', border: 'none', color: '#4B6478', fontSize: '13px', cursor: 'pointer', fontFamily: 'DM Sans' }}
                >
                  <ArrowLeft size={14} />
                  Kembali
                </button>
              )}
            </motion.div>
          ) : isSubRoleStep ? (
            <motion.div
              key="step-sub"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '2px' }}>
                {subRoles.map((model) => (
                  <ModelCard
                    key={model.key}
                    model={{
                      key: model.key,
                      label: model.name,
                      icon: model.icon,
                      description: model.description,
                      comingSoon: model.comingSoon
                    }}
                    selected={selected === model.key}
                    onClick={() => !model.comingSoon && handleSubRoleSelect(model.key)}
                  />
                ))}
              </div>

              {isRoleLocked && !isPeternak ? null : (
                <button
                  onClick={handleBack}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    marginTop: '12px',
                    padding: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: '#4B6478',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans',
                  }}
                >
                  <ArrowLeft size={14} />
                  Kembali
                </button>
              )}
            </motion.div>
          ) : isNameStep ? (
            <motion.div
              key="step-name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Business Name Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px', marginLeft: '2px' }}>
                  <Building2 size={11} color="#4B6478" />
                  Nama Bisnis *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={(e) => handleNameChange(toTitleCase(e.target.value))}
                  placeholder="Contoh: Poultry Farm Jaya"
                  maxLength={80}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: '#111C24',
                    border: nameTaken
                      ? '1px solid rgba(248,113,113,0.5)'
                      : businessName.trim().length >= 3 && !nameChecking
                        ? '1px solid rgba(16,185,129,0.4)'
                        : '1px solid rgba(255,255,255,0.09)',
                    borderRadius: '12px',
                    color: '#F1F5F9',
                    fontFamily: 'Sora',
                    fontSize: '16px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                />

                {/* Status messages */}
                {businessName.trim().length > 0 && businessName.trim().length < 3 && (
                  <p style={{ fontSize: '12px', color: '#F87171', marginTop: '6px', marginLeft: '4px' }}>
                    Nama bisnis minimal 3 karakter
                  </p>
                )}
                {businessName.trim().length >= 3 && nameChecking && (
                  <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #94A3B8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Mengecek ketersediaan nama...
                  </p>
                )}
                {businessName.trim().length >= 3 && !nameChecking && nameTaken && (
                  <p style={{ fontSize: '12px', color: '#F87171', marginTop: '6px', marginLeft: '4px' }}>
                    ❌ Nama "<strong>{toTitleCase(businessName)}</strong>" sudah dipakai bisnis lain.
                  </p>
                )}
                {businessName.trim().length >= 3 && !nameChecking && !nameTaken && (
                  <p style={{ fontSize: '12px', color: '#10B981', marginTop: '6px', marginLeft: '4px' }}>
                    ✅ <strong>{toTitleCase(businessName)}</strong>
                  </p>
                )}
              </div>

              {/* Province Searchable Combobox */}
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px', marginLeft: '2px' }}>
                  <MapPin size={11} color="#4B6478" />
                  Provinsi *
                </label>
                
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={provinceOpen ? provinceSearch : province}
                    onChange={(e) => {
                      setProvinceSearch(e.target.value)
                      if (!provinceOpen) setProvinceOpen(true)
                    }}
                    onFocus={() => {
                      setProvinceSearch('')
                      setProvinceOpen(true)
                    }}
                    placeholder={province || 'Ketik nama provinsi...'}
                    style={{
                      width: '100%',
                      padding: '13px 16px',
                      paddingRight: '40px',
                      background: '#111C24',
                      border: province
                        ? '1px solid rgba(16,185,129,0.4)'
                        : '1px solid rgba(255,255,255,0.09)',
                      borderRadius: '12px',
                      color: '#F1F5F9',
                      fontFamily: 'DM Sans',
                      fontSize: '14px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease',
                    }}
                  />
                  <div 
                    onClick={() => setProvinceOpen(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', padding: '4px' }}
                  >
                    <ChevronDown size={15} color="#4B6478" style={{ transform: provinceOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                  </div>
                </div>

                <AnimatePresence>
                  {provinceOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -4 }}
                      transition={{ duration: 0.1 }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0, right: 0,
                        background: '#0C1319',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: 100,
                        padding: '8px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                      }}
                    >
                      {filteredProvinces.length > 0 ? (
                        filteredProvinces.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => { 
                              setProvince(p)
                              setProvinceSearch('')
                              setProvinceOpen(false) 
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: province === p ? 'rgba(16,185,129,0.1)' : 'transparent',
                              border: 'none',
                              borderRadius: '10px',
                              color: province === p ? '#10B981' : '#F1F5F9',
                              fontFamily: 'DM Sans',
                              fontSize: '13px',
                              fontWeight: province === p ? 700 : 500,
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '2px',
                            }}
                          >
                            <span>{p}</span>
                            {province === p && <Check size={12} color="#10B981" strokeWidth={3} />}
                          </button>
                        ))
                      ) : (
                        <div style={{ padding: '20px 10px', textAlign: 'center' }}>
                          <p style={{ fontSize: '12px', color: '#4B6478', margin: 0 }}>Provinsi tidak ditemukan.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                onClick={handleConfirm}
                disabled={loading || businessName.trim().length < 3 || nameTaken || nameChecking || !province}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: (businessName.trim().length >= 3 && !nameTaken && !nameChecking && province)
                    ? '#10B981'
                    : 'rgba(16,185,129,0.3)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontFamily: 'Sora',
                  fontSize: '15px',
                  fontWeight: 700,
                  boxShadow: businessName.trim().length >= 3 ? '0 4px 20px rgba(16,185,129,0.25)' : 'none',
                  cursor: loading || businessName.trim().length < 3 || !province ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? 'Menyiapkan dashboard...' : 'Mulai Sekarang →'}
              </motion.button>

              <button
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  marginTop: '12px',
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: '#4B6478',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans',
                }}
              >
                <ArrowLeft size={14} />
                Kembali
              </button>
            </motion.div>
          ) : isSetupStep ? (
            <motion.div
              key="step-setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'Sora', fontSize: '19px', fontWeight: 800, color: '#F1F5F9', marginBottom: '6px' }}>
                  Setup Awal Batch 🐄
                </h2>
                <p style={{ fontSize: '13px', color: '#4B6478', lineHeight: 1.5 }}>
                  Isi data batch pertama untuk personalisasi dashboard bapak.
                </p>
              </div>

              <StepSetup
                selectedModel={selected}
                setupData={setupData}
                setSetupData={setSetupData}
              />

              <motion.button
                onClick={saveAndComplete}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '15px',
                  background: loading ? 'rgba(217,119,6,0.4)' : '#D97706',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontFamily: 'Sora',
                  fontSize: '15px',
                  fontWeight: 700,
                  boxShadow: '0 4px 20px rgba(217,119,6,0.25)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? 'Menyiapkan dashboard...' : 'Mulai Sekarang →'}
              </motion.button>

              <button
                onClick={() => saveAndComplete()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: '#4B6478',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans',
                }}
              >
                Lewati untuk sekarang
              </button>

              <button
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  marginTop: '4px',
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#4B6478',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans',
                }}
              >
                <ArrowLeft size={14} />
                Kembali
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function CategoryCard({ cat, onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        background: '#111C24',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        padding: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        transition: 'all 0.15s ease',
      }}
      whileHover={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.04)' }}
    >
      <div style={{
        width: '48px', height: '48px',
        background: 'rgba(16,185,129,0.10)',
        borderRadius: '12px',
        fontSize: '22px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {cat.icon}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontFamily: 'Sora', fontSize: '15px', fontWeight: 700, color: '#F1F5F9', margin: '0 0 3px' }}>
          {cat.label}
        </h4>
        <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: '#4B6478', lineHeight: 1.5, margin: 0 }}>
          {cat.description}
        </p>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '18px', flexShrink: 0 }}>›</div>
    </motion.div>
  )
}

function ModelCard({ model, selected, onClick }) {
  return (
    <motion.div
      whileTap={!model.comingSoon ? { scale: 0.985 } : {}}
      onClick={onClick}
      style={{
        background: model.comingSoon ? 'rgba(255,255,255,0.02)' : selected ? 'rgba(16,185,129,0.07)' : '#111C24',
        border: model.comingSoon ? '1px solid rgba(255,255,255,0.05)' : selected ? '1px solid rgba(16,185,129,0.45)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        padding: '14px',
        cursor: model.comingSoon ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        opacity: model.comingSoon ? 0.45 : 1,
        transition: 'all 0.15s ease',
        boxShadow: selected ? '0 0 0 1px rgba(16,185,129,0.12)' : 'none',
      }}
    >
      <div style={{
        width: '44px', height: '44px',
        background: model.comingSoon ? 'rgba(255,255,255,0.04)' : 'rgba(16,185,129,0.10)',
        borderRadius: '10px',
        fontSize: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {model.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <h4 style={{ fontFamily: 'Sora', fontSize: '14px', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
            {model.label}
          </h4>
          {model.comingSoon && (
            <span style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em',
              color: '#FBBF24', background: 'rgba(251,191,36,0.12)',
              border: '1px solid rgba(251,191,36,0.2)',
              padding: '1px 5px', borderRadius: '4px', flexShrink: 0,
            }}>SEGERA</span>
          )}
        </div>
        <p style={{ fontFamily: 'DM Sans', fontSize: '11px', color: '#4B6478', lineHeight: 1.5, margin: 0 }}>
          {model.description}
        </p>
      </div>
      <div style={{
        width: '20px', height: '20px',
        borderRadius: '50%',
        border: selected ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
        background: selected ? '#10B981' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {model.comingSoon ? <Lock size={10} color="rgba(255,255,255,0.2)" /> : selected && <Check size={12} color="white" strokeWidth={3} />}
      </div>
    </motion.div>
  )
}
