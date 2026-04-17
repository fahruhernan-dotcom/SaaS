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
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-[480px] m-auto bg-[#0C1319]/80 border border-white/5 rounded-[32px] p-8 sm:p-10 shadow-2xl backdrop-blur-md overflow-hidden"
      >
        {/* Animated Background Orbs */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => onComplete?.()}
          className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer z-30 active:scale-90"
        >
          <X size={18} />
        </button>

        {/* Top accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)]" />

        <div className="text-center mb-8 relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
              <img src="/logo.png" alt="TernakOS" className="w-8 h-8 rounded-lg object-cover" />
            </div>
            <span className="font-display font-black text-xl tracking-tight text-white">TernakOS</span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8 relative z-10">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                step >= s 
                  ? "w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                  : "w-2 bg-white/10"
              )} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative z-10"
            >
              {step === 1 ? (
                <>
                  <h2 className="font-display text-2xl font-black text-white mb-2 leading-tight">
                    Kamu berbisnis sebagai?
                  </h2>
                  <p className="text-[14px] text-slate-400 font-medium">
                    Pilih kategori bisnis utama kamu.
                  </p>
                </>
              ) : isAnimalStep ? (
                <>
                  <h2 className="font-display text-2xl font-black text-white mb-2 leading-tight">
                    Jenis hewan apa? 🐄
                  </h2>
                  <p className="text-[14px] text-slate-400 font-medium">
                    Pilih jenis ternak utama bapak.
                  </p>
                </>
              ) : isSubRoleStep ? (
                <>
                  <h2 className="font-display text-2xl font-black text-white mb-2 leading-tight">
                    {isNewBusiness ? `Bisnis ${primaryRoleInfo?.label || 'Baru'}` : 'Spesialisasi Bisnis'}
                  </h2>
                  <p className="text-[14px] text-slate-400 font-medium leading-relaxed max-w-[320px] mx-auto">
                    {isNewBusiness 
                      ? `Pilih spesialisasi unit ${primaryRoleInfo?.label?.toLowerCase() || 'bisnis'} tambahan.`
                      : 'Lengkapi profil agar dashboard sesuai kebutuhanmu.'}
                  </p>
                </>
              ) : isNameStep ? (
                <>
                  <h2 className="font-display text-2xl font-black text-white mb-2 leading-tight">
                    Nama {category === 'peternak' ? 'farm' : 'bisnis'} bapak?
                  </h2>
                  <p className="text-[14px] text-slate-400 font-medium leading-relaxed">
                    {category === 'peternak' 
                      ? 'Berikan nama yang unik untuk lokasi farm ini.'
                      : 'Nama ini akan tampil di seluruh laporan dan invoice.'}
                  </p>
                </>
              ) : isSetupStep ? (
                <>
                  <h2 className="font-display text-2xl font-black text-white mb-3 flex items-center justify-center gap-3 leading-tight">
                    Setup Batch Pertama <span className="animate-bounce-slow">🐄</span>
                  </h2>
                  <p className="text-[14px] text-slate-400 font-medium leading-relaxed">
                    Data awal untuk personalisasi performa ternak.
                  </p>
                </>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-3 relative z-10"
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
              className="relative z-10"
            >
              <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
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
                  className="flex items-center justify-center gap-2 w-full mt-6 py-2 text-slate-500 hover:text-white transition-colors text-sm font-bold"
                >
                  <ArrowLeft size={16} />
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
              className="relative z-10"
            >
              <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
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
                  className="flex items-center justify-center gap-2 w-full mt-6 py-2 text-slate-500 hover:text-white transition-colors text-sm font-bold"
                >
                  <ArrowLeft size={16} />
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
              className="relative z-10"
            >
              {/* Business Name Input */}
              <div className="mb-6">
                <label className="flex items-center gap-2.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                  <Building2 size={12} className="text-slate-500" />
                  Nama Bisnis <span className="text-emerald-500/50">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={(e) => handleNameChange(toTitleCase(e.target.value))}
                    placeholder="Contoh: Poultry Farm Jaya"
                    maxLength={80}
                    autoFocus
                    className={cn(
                      "relative w-full h-14 px-5 bg-[#111C24] border rounded-2xl text-white font-display font-bold text-lg outline-none transition-all duration-300",
                      nameTaken 
                        ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                        : businessName.trim().length >= 3 && !nameChecking
                          ? "border-emerald-500/30 focus:border-emerald-500/60"
                          : "border-white/5 focus:border-white/10"
                    )}
                  />
                </div>

                {/* Status messages */}
                <div className="min-h-[24px] mt-2.5 px-1">
                  {businessName.trim().length > 0 && businessName.trim().length < 3 && (
                    <p className="text-[12px] text-red-400 font-medium">Nama bisnis minimal 3 karakter</p>
                  )}
                  {businessName.trim().length >= 3 && nameChecking && (
                    <div className="flex items-center gap-2.5 text-[12px] text-slate-500 font-medium font-display">
                      <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                      Mengecek ketersediaan...
                    </div>
                  )}
                  {businessName.trim().length >= 3 && !nameChecking && nameTaken && (
                    <p className="text-[12px] text-red-500 font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                      ❌ Nama "<strong>{toTitleCase(businessName)}</strong>" sudah terpakai.
                    </p>
                  )}
                  {businessName.trim().length >= 3 && !nameChecking && !nameTaken && (
                    <p className="text-[12px] text-emerald-500 font-bold animate-in fade-in slide-in-from-left-2 duration-300">
                      ✅ <strong>{toTitleCase(businessName)}</strong> tersedia
                    </p>
                  )}
                </div>
              </div>

              {/* Province Searchable Combobox */}
              <div className="mb-8 relative">
                <label className="flex items-center gap-2.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                  <MapPin size={12} className="text-slate-500" />
                  Provinsi <span className="text-emerald-500/50">*</span>
                </label>
                
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
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
                    className={cn(
                      "relative w-full h-14 pl-5 pr-12 bg-[#111C24] border rounded-2xl text-white font-medium text-[15px] outline-none transition-all duration-300",
                      province ? "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]" : "border-white/5 focus:border-white/10"
                    )}
                  />
                  <div 
                    onClick={() => setProvinceOpen(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full cursor-pointer transition-all z-10"
                  >
                    <ChevronDown size={16} className={cn("text-slate-500 transition-transform duration-300", provinceOpen && "rotate-180")} />
                  </div>
                </div>

                <AnimatePresence>
                  {provinceOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -4 }}
                      className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#111C24]/95 border border-white/10 rounded-2xl max-h-[220px] overflow-y-auto z-[100] p-2 shadow-2xl backdrop-blur-xl custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200"
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
                            className={cn(
                              "w-full px-4 py-3.5 text-left rounded-xl text-[14px] font-medium transition-all mb-1 flex items-center justify-between",
                              province === p 
                                ? "bg-emerald-500/10 text-emerald-400 font-bold" 
                                : "text-slate-300 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <span>{p}</span>
                            {province === p && <Check size={14} className="text-emerald-400 font-black" />}
                          </button>
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-sm text-slate-500 italic">Provinsi tidak ditemukan</p>
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
                className={cn(
                  "w-full h-16 rounded-2xl font-display font-black text-lg shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2",
                  (businessName.trim().length >= 3 && !nameTaken && !nameChecking && province)
                    ? "bg-emerald-500 hover:bg-emerald-400 text-[#052c1e] shadow-emerald-500/20"
                    : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                )}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
                    Menyiapkan...
                  </div>
                ) : (
                  <>Mulai Sekarang <ArrowLeft size={18} className="rotate-180" /></>
                )}
              </motion.button>

              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-2 w-full mt-6 py-2 text-slate-500 hover:text-white transition-colors text-sm font-bold"
              >
                <ArrowLeft size={16} />
                Kembali
              </button>
            </motion.div>
          ) : isSetupStep ? (
            <motion.div
              key="step-setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="relative z-10"
            >
              <div className="mb-2">
                <StepSetup
                  selectedModel={selected}
                  setupData={setupData}
                  setSetupData={setSetupData}
                />
              </div>

              <motion.button
                onClick={saveAndComplete}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "w-full h-16 rounded-2xl font-display font-black text-lg shadow-xl shadow-amber-500/20 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2",
                  loading ? "bg-amber-500/50 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-400 text-[#2c1a05]"
                )}
              >
                {loading ? (
                   <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" />
                    Menyimpan...
                  </div>
                ) : (
                  <>Selesaikan Setup <ArrowLeft size={18} className="rotate-180" /></>
                )}
              </motion.button>

              <div className="flex flex-col gap-1 mt-6">
                <button
                  onClick={() => saveAndComplete()}
                  className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-[13px] font-bold transition-colors"
                >
                  Lewati untuk sekarang
                </button>

                <button
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 w-full py-2 text-slate-600 hover:text-slate-400 transition-colors text-xs font-bold"
                >
                  <ArrowLeft size={14} />
                  Kembali ke Nama Bisnis
                </button>
              </div>
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
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01, borderColor: 'rgba(16,185,129,0.2)' }}
      onClick={onClick}
      className="group relative bg-[#111C24] border border-white/5 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:bg-[#15232d] shadow-lg hover:shadow-emerald-500/5"
    >
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-500 border border-emerald-500/10 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/20">
          {cat.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-display font-bold text-[16px] text-white group-hover:text-emerald-400 transition-colors duration-300">
            {cat.label}
          </h4>
          <p className="font-body text-[12px] text-slate-500 mt-1 leading-relaxed">
            {cat.description}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-300">
          ›
        </div>
      </div>
    </motion.div>
  )
}

function ModelCard({ model, selected, onClick }) {
  return (
    <motion.div
      whileTap={!model.comingSoon ? { scale: 0.98 } : {}}
      whileHover={!model.comingSoon ? { scale: 1.01 } : {}}
      onClick={onClick}
      className={cn(
        "group relative border rounded-2xl p-4 transition-all duration-300 flex items-center gap-4",
        model.comingSoon ? "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed" : 
        selected 
          ? "bg-emerald-500/5 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] cursor-pointer" 
          : "bg-[#111C24] border-white/5 hover:border-white/10 hover:bg-[#15232d] cursor-pointer"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-500 border",
        selected 
          ? "bg-emerald-500/20 border-emerald-500/30 shadow-inner" 
          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
      )}>
        {model.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <h4 className={cn(
            "font-display font-bold text-[15px] truncate transition-colors",
            selected ? "text-emerald-400" : "text-white"
          )}>
            {model.label}
          </h4>
          {model.comingSoon && (
            <span className="text-[9px] font-black tracking-widest text-[#FBBF24] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
              Soon
            </span>
          )}
        </div>
        <p className="font-body text-[11px] text-slate-500 leading-relaxed truncate">
          {model.description}
        </p>
      </div>
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 border-1.5",
        selected 
          ? "bg-emerald-500 border-transparent shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
          : "border-white/10"
      )}>
        {model.comingSoon ? <Lock size={10} className="text-white/20" /> : selected && <Check size={12} className="text-[#052c1e] font-black" strokeWidth={4} />}
      </div>
    </motion.div>
  )
}
