import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, addDays } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  Tag, Sparkles, Building2,
  Home, Factory, Trash2, Copy, Check,
  RefreshCcw, AlertCircle, Loader2,
  Settings2, Clock, Infinity,
} from 'lucide-react'
import {
  usePricingConfig,
  useUpdatePricing,
  useDiscountCodes,
  useCreateDiscountCode,
  useToggleDiscountCode,
  useDeleteDiscountCode,
  usePlanConfigs,
  useUpdatePlanConfig,
} from '@/lib/hooks/useAdminData'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatIDR, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { z } from 'zod'
import { InputRupiah } from '@/components/ui/InputRupiah'

const pricingSchema = z.object({
  price: z.number().min(0, 'Harga aktif tidak boleh negatif'),
  originalPrice: z.number().min(0, 'Harga asli tidak boleh negatif')
})

export default function AdminPricing() {
  const { data: pricing, isLoading: isLoadingPricing } = usePricingConfig()
  const { data: vouchers, isLoading: isLoadingVouchers } = useDiscountCodes()
  const { data: configs = {} } = usePlanConfigs()
  const updatePricing = useUpdatePricing()
  const updateConfig = useUpdatePlanConfig()
  const createVoucher = useCreateDiscountCode()
  const toggleVoucher = useToggleDiscountCode()
  const deleteVoucher = useDeleteDiscountCode()

  const [activeTab, setActiveTab] = useState('plans')
  const [editingPricing, setEditingPricing] = useState(null)
  const [savingRole, setSavingRole] = useState(null)
  const [formKey, setFormKey] = useState(0)

  // ── New: Add-on & Limit state ─────────────────────────────────────────────
  const [kandangLimits, setKandangLimits] = useState({
    starter: 1, pro: 2, business: 99, enterprise: 99
  })
  const [teamLimits, setTeamLimits] = useState({
    starter: 1, pro: 3, business: 10, enterprise: 99
  })
  const [addonPricing, setAddonPricing] = useState({
    price_per_type: 99000,
    max_addons_before_upgrade: 2,
  })
  const [savingLimits, setSavingLimits] = useState(false)
  const [savingAddon, setSavingAddon] = useState(false)

  // ── New: Trial & Diskon state ─────────────────────────────────────────────
  const [trialConfig, setTrialConfig] = useState({
    starter: 14, pro: 14, business: 14
  })
  const [annualDiscount, setAnnualDiscount] = useState({
    discount_percent: 20,
    badge_text: 'Hemat 2 bln!',
  })
  const [savingTrial, setSavingTrial] = useState(false)
  const [savingDiscount, setSavingDiscount] = useState(false)
  const [configsInited, setConfigsInited] = useState(false)

  // Initialise local edit state once DB data arrives
  useMemo(() => {
    if (pricing && !editingPricing) {
      setEditingPricing(pricing)
    }
  }, [pricing])

  // Initialise config state once plan_configs data arrives
  useMemo(() => {
    if (configs && Object.keys(configs).length > 0 && !configsInited) {
      if (configs.kandang_limit) setKandangLimits(v => ({ ...v, ...configs.kandang_limit }))
      if (configs.team_limit) setTeamLimits(v => ({ ...v, ...configs.team_limit }))
      if (configs.addon_pricing) setAddonPricing(v => ({ ...v, ...configs.addon_pricing }))
      if (configs.trial_config) setTrialConfig(v => ({ ...v, ...configs.trial_config }))
      if (configs.annual_discount) setAnnualDiscount(v => ({ ...v, ...configs.annual_discount }))
      setConfigsInited(true)
    }
  }, [configs])

  const handleSaveAllPricing = async () => {
    setSavingRole('all')
    try {
      const roles = ['broker', 'peternak', 'rpa']
      const promises = roles.flatMap(role => [
        updatePricing.mutateAsync({
          role,
          plan: 'pro',
          price: editingPricing[role].pro.price,
          originalPrice: editingPricing[role].pro.originalPrice
        }),
        updatePricing.mutateAsync({
          role,
          plan: 'business',
          price: editingPricing[role].business.price,
          originalPrice: editingPricing[role].business.originalPrice
        })
      ])
      await Promise.all(promises)
      toast.success('Semua perubahan harga berhasil disimpan!')
    } catch (err) {
      toast.error('Gagal menyimpan sebagian harga: ' + (err.message || 'Error Unknown'))
    } finally {
      setSavingRole(null)
    }
  }

  const handlePriceChange = (role, plan, field, value) => {
    const numericValue = typeof value === 'number' ? value : (parseInt(String(value).replace(/\D/g, '')) || 0)
    setEditingPricing(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [plan]: {
          ...prev[role][plan],
          [field]: numericValue
        }
      }
    }))
  }

  const handleSavePricing = async (role) => {
    setSavingRole(role)
    try {
      // Validation check
      pricingSchema.parse(editingPricing[role].pro)
      pricingSchema.parse(editingPricing[role].business)

      await Promise.all([
        updatePricing.mutateAsync({
          role,
          plan: 'pro',
          price: editingPricing[role].pro.price,
          originalPrice: editingPricing[role].pro.originalPrice
        }),
        updatePricing.mutateAsync({
          role,
          plan: 'business',
          price: editingPricing[role].business.price,
          originalPrice: editingPricing[role].business.originalPrice
        })
      ])
      toast.success(`Pricing ${role.toUpperCase()} diperbarui`)
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message)
      }
    } finally {
      setSavingRole(null)
    }
  }

  const handleCreateVoucher = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const payload = {
      code: formData.get('code').toUpperCase(),
      discount_type: formData.get('discount_type'),
      discount_value: parseInt(formData.get('discount_value')) || 0,
      applies_to_plan: formData.get('applies_to_plan'),
      applies_to_role: formData.get('applies_to_role'),
      expires_at: formData.get('expires_at') || null,
      max_usage: formData.get('max_usage') ? parseInt(formData.get('max_usage')) : null
    }

    if (payload.discount_type === 'percentage' && payload.discount_value > 100) {
      toast.error('Persentase tidak boleh lebih dari 100%')
      return
    }

    createVoucher.mutate(payload, {
      onSuccess: () => setFormKey(k => k + 1)
    })
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Kode diskon disalin!')
  }

  const handleSaveLimits = async () => {
    setSavingLimits(true)
    try {
      await updateConfig.mutateAsync({ config_key: 'kandang_limit', config_value: kandangLimits })
      await updateConfig.mutateAsync({ config_key: 'team_limit', config_value: teamLimits })
    } catch { /* toast shown in hook */ } finally {
      setSavingLimits(false)
    }
  }

  const handleSaveAddon = async () => {
    setSavingAddon(true)
    try {
      await updateConfig.mutateAsync({ config_key: 'addon_pricing', config_value: addonPricing })
    } catch { /* toast shown in hook */ } finally {
      setSavingAddon(false)
    }
  }

  const handleSaveTrial = async () => {
    setSavingTrial(true)
    try {
      await updateConfig.mutateAsync({ config_key: 'trial_config', config_value: trialConfig })
    } catch { /* toast shown in hook */ } finally {
      setSavingTrial(false)
    }
  }

  const handleSaveDiscount = async () => {
    setSavingDiscount(true)
    try {
      await updateConfig.mutateAsync({ config_key: 'annual_discount', config_value: annualDiscount })
    } catch { /* toast shown in hook */ } finally {
      setSavingDiscount(false)
    }
  }

  const previewTrialDate = (days) =>
    format(addDays(new Date(), Number(days) || 0), 'd MMMM yyyy', { locale: idLocale })

  if (isLoadingPricing || !editingPricing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 p-4 lg:p-0 lg:space-y-6 pb-32 lg:pb-12"
    >
      {/* Header — Optimized for Mobile: Large text hidden to save space */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-14 lg:top-0 z-20 bg-[#080C10]/80 backdrop-blur-md py-2 -mx-2 px-2 rounded-xl">
        <div className="hidden md:block">
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            Pricing & Discounts
          </h1>
          <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">
            Atur skema harga paket dan kelola kode voucher promo
          </p>
        </div>
        
        {activeTab === 'plans' && (
          <Button
            onClick={handleSaveAllPricing}
            disabled={savingRole === 'all'}
            className="hidden md:flex bg-emerald-500 hover:bg-emerald-600 rounded-xl h-11 px-6 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            {savingRole === 'all' ? (
              <><Loader2 size={14} className="animate-spin mr-2" /> Menyiimpan...</>
            ) : (
              'Simpan Semua Perubahan'
            )}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#111C24] border border-white/5 p-1 h-12 rounded-2xl mb-8 -mx-2 lg:mx-0 grid grid-cols-4 sticky top-16 md:relative z-10">
          <TabsTrigger
            value="plans"
            className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-bold uppercase text-[11px] tracking-widest transition-all"
          >
            Harga Plan
          </TabsTrigger>
          <TabsTrigger
            value="addons"
            className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-bold uppercase text-[11px] tracking-widest transition-all"
          >
            Add-on & Limit
          </TabsTrigger>
          <TabsTrigger
            value="trial"
            className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-bold uppercase text-[11px] tracking-widest transition-all"
          >
            Trial & Diskon
          </TabsTrigger>
          <TabsTrigger
            value="vouchers"
            className="rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-bold uppercase text-[11px] tracking-widest transition-all"
          >
            Kode Diskon
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-12 animate-in fade-in duration-300">
          {/* Pricing Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RolePricingCard
              roleName="Broker"
              roleId="broker"
              icon={Building2}
              color="emerald"
              data={editingPricing.broker}
              onChange={handlePriceChange}
              onSave={() => handleSavePricing('broker')}
              isSaving={savingRole === 'broker'}
            />
            <RolePricingCard
              roleName="Peternak"
              roleId="peternak"
              icon={Home}
              color="purple"
              data={editingPricing.peternak}
              onChange={handlePriceChange}
              onSave={() => handleSavePricing('peternak')}
              isSaving={savingRole === 'peternak'}
            />
            <RolePricingCard
              roleName="RPA"
              roleId="rpa"
              icon={Factory}
              color="amber"
              data={editingPricing.rpa}
              onChange={handlePriceChange}
              onSave={() => handleSavePricing('rpa')}
              isSaving={savingRole === 'rpa'}
            />
          </div>

          {/* Preview Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-white/10" />
              <h2 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] whitespace-nowrap">PREVIEW TAMPILAN PRICING</h2>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            <div className="bg-[#0C1319] rounded-[32px] border border-white/8 overflow-hidden shadow-2xl max-w-5xl mx-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-8 py-6 text-[12px] font-black uppercase text-[#4B6478]">Fitur & Benefit</th>
                    <th className="px-8 py-6 text-center">
                      <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 mb-2 font-black uppercase tracking-widest">STARTER</Badge>
                      <p className="text-2xl font-display font-black text-white">GRATIS</p>
                      <p className="text-[10px] font-bold text-[#4B6478] uppercase mt-1">Selamanya</p>
                    </th>
                    <th className="px-8 py-6 text-center bg-emerald-500/5 relative">
                      <div className="absolute top-0 right-0 p-2">
                        <Sparkles size={16} className="text-emerald-400 opacity-30" />
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 mb-2 font-black uppercase tracking-widest">PRO</Badge>
                      {editingPricing.broker.pro.originalPrice > 0 && (
                        <p className="line-through text-[#4B6478] text-sm mb-1">{formatIDR(editingPricing.broker.pro.originalPrice)}</p>
                      )}
                      <p className="text-2xl font-display font-black text-white">{formatIDR(editingPricing.broker.pro.price)}</p>
                      <p className="text-[10px] font-bold text-emerald-500/60 uppercase mt-1">Per Bulan</p>
                    </th>
                    <th className="px-8 py-6 text-center bg-amber-500/5">
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 mb-2 font-black uppercase tracking-widest">BUSINESS</Badge>
                      {editingPricing.broker.business.originalPrice > 0 && (
                        <p className="line-through text-[#4B6478] text-sm mb-1">{formatIDR(editingPricing.broker.business.originalPrice)}</p>
                      )}
                      <p className="text-2xl font-display font-black text-white">{formatIDR(editingPricing.broker.business.price)}</p>
                      <p className="text-[10px] font-bold text-amber-500/60 uppercase mt-1">Per Bulan</p>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {PRICING_FEATURES.map((feature, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-4 text-white/80 font-medium">{feature.label}</td>
                      <td className="px-8 py-4 text-center">{feature.starter ? <Check size={18} className="mx-auto text-emerald-500" /> : <div className="w-4 h-0.5 bg-white/10 mx-auto" />}</td>
                      <td className="px-8 py-4 text-center bg-emerald-500/[0.02]">{feature.pro ? <Check size={18} className="mx-auto text-emerald-500" /> : <div className="w-4 h-0.5 bg-white/10 mx-auto" />}</td>
                      <td className="px-8 py-4 text-center bg-amber-500/[0.02]">{feature.business ? <Check size={18} className="mx-auto text-amber-500" /> : <div className="w-4 h-0.5 bg-white/10 mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: ADD-ON & LIMIT                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="addons" className="space-y-10 animate-in fade-in duration-300">

          {/* Section A — Kandang & Tim Limit */}
          <section className="space-y-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478] font-display flex items-center gap-2">
                <Settings2 size={13} /> KANDANG LIMIT PER PLAN
              </p>
              <p className="text-xs text-[#4B6478] mt-1">Jumlah kandang aktif maksimal yang bisa dimiliki per plan</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Starter */}
              <PlanLimitCard
                planName="STARTER"
                badgeClass="bg-white/10 text-white/50"
                kandangValue={kandangLimits.starter}
                teamValue={teamLimits.starter}
                onKandangChange={v => setKandangLimits(p => ({ ...p, starter: v }))}
                onTeamChange={v => setTeamLimits(p => ({ ...p, starter: v }))}
              />
              {/* PRO */}
              <PlanLimitCard
                planName="PRO"
                badgeClass="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                kandangValue={kandangLimits.pro}
                teamValue={teamLimits.pro}
                onKandangChange={v => setKandangLimits(p => ({ ...p, pro: v }))}
                onTeamChange={v => setTeamLimits(p => ({ ...p, pro: v }))}
              />
              {/* Business */}
              <PlanLimitCard
                planName="BUSINESS"
                badgeExtra="MOST POPULAR"
                badgeClass="bg-amber-500/10 text-amber-400 border border-amber-500/20"
                kandangValue={kandangLimits.business}
                teamValue={teamLimits.business}
                onKandangChange={v => setKandangLimits(p => ({ ...p, business: v }))}
                onTeamChange={v => setTeamLimits(p => ({ ...p, business: v }))}
              />
              {/* Enterprise */}
              <PlanLimitCard
                planName="ENTERPRISE"
                badgeClass="bg-purple-500/10 text-purple-400 border border-purple-500/20"
                readOnly
                kandangValue={99}
                teamValue={99}
              />
            </div>

            <button
              onClick={handleSaveLimits}
              disabled={savingLimits}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-10 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingLimits
                ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</>
                : 'Simpan Limit'
              }
            </button>
          </section>

          <div className="h-px bg-white/8" />

          {/* Section B — Add-on Pricing */}
          <section className="space-y-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478] font-display flex items-center gap-2">
                <Tag size={13} /> ADD-ON JENIS TERNAK — PETERNAK PRO
              </p>
              <p className="text-xs text-[#4B6478] mt-1">
                Berlaku untuk plan PRO yang punya lebih dari 1 jenis ternak aktif
              </p>
            </div>

            <div className="bg-[#111C24] rounded-2xl p-6 border border-white/8 space-y-5">
              {/* Price per type */}
              <div className="space-y-1.5">
                <label htmlFor="addon_price" className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
                  HARGA ADD-ON PER JENIS TERNAK / BULAN
                </label>
                <InputRupiah
                  id="addon_price"
                  name="addon_price"
                  value={addonPricing.price_per_type}
                  onChange={v => setAddonPricing(p => ({ ...p, price_per_type: v || 0 }))}
                  className="bg-[#162230] border-white/10 h-10 rounded-xl font-bold focus:border-emerald-500/40"
                />
              </div>

              {/* Max add-ons before upgrade */}
              <div className="space-y-1.5">
                <label htmlFor="max_addons" className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
                  MAKSIMAL ADD-ON SEBELUM SUGGEST UPGRADE
                </label>
                <Input
                  id="max_addons"
                  name="max_addons"
                  type="number"
                  min={1}
                  max={10}
                  value={addonPricing.max_addons_before_upgrade}
                  onChange={e => setAddonPricing(p => ({ ...p, max_addons_before_upgrade: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-[#162230] border border-white/10 h-10 rounded-xl px-3 text-sm text-white font-bold focus:outline-none focus:border-emerald-500/40"
                />
                <p className="text-[11px] text-[#4B6478]">
                  Jika user punya lebih dari {addonPricing.max_addons_before_upgrade} jenis ternak aktif, tampilkan banner "Lebih hemat upgrade ke Business"
                </p>
              </div>

              {/* Plans that get add-on (informational) */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">PLAN YANG KENA ADD-ON</p>
                <div className="flex items-center gap-4">
                  {[
                    { id: 'cb_pro', label: 'PRO', checked: true, disabled: false },
                    { id: 'cb_business', label: 'Business', checked: false, disabled: true },
                    { id: 'cb_enterprise', label: 'Enterprise', checked: false, disabled: true },
                  ].map(item => (
                    <label key={item.id} htmlFor={item.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        id={item.id}
                        name={item.id}
                        type="checkbox"
                        defaultChecked={item.checked}
                        disabled={item.disabled}
                        className="accent-emerald-500"
                      />
                      <span className={`text-sm font-semibold ${item.disabled ? 'text-[#4B6478]' : 'text-white'}`}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Realtime preview */}
              <AddonPreview
                peternakProBase={editingPricing?.peternak?.pro?.price || 499000}
                peternakBizBase={editingPricing?.peternak?.business?.price || 999000}
                addonPricing={addonPricing}
              />

              <button
                onClick={handleSaveAddon}
                disabled={savingAddon}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-10 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingAddon
                  ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</>
                  : 'Simpan Add-on Config'
                }
              </button>
            </div>
          </section>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: TRIAL & DISKON                                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="trial" className="space-y-10 animate-in fade-in duration-300">

          {/* Section A — Trial Duration */}
          <section className="space-y-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478] font-display flex items-center gap-2">
                <Clock size={13} /> DURASI TRIAL GRATIS
              </p>
              <p className="text-xs text-[#4B6478] mt-1">Berapa hari user bisa coba gratis sebelum perlu berlangganan</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: 'starter', label: 'STARTER', badgeClass: 'bg-white/10 text-white/50' },
                { key: 'pro', label: 'PRO', badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
                { key: 'business', label: 'BUSINESS', badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
              ].map(plan => (
                <div key={plan.key} className="bg-[#111C24] rounded-2xl p-5 border border-white/8 space-y-4">
                  <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${plan.badgeClass}`}>
                    {plan.label}
                  </span>
                  <div className="space-y-1.5">
                    <label htmlFor={`trial_${plan.key}`} className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
                      DURASI TRIAL (HARI)
                    </label>
                    <Input
                      id={`trial_${plan.key}`}
                      name={`trial_${plan.key}`}
                      type="number"
                      min={1}
                      max={365}
                      value={trialConfig[plan.key]}
                      onChange={e => setTrialConfig(p => ({ ...p, [plan.key]: parseInt(e.target.value) || 1 }))}
                      className="w-full bg-[#162230] border border-white/10 h-10 rounded-xl px-3 text-sm text-white font-bold focus:outline-none focus:border-emerald-500/40"
                    />
                  </div>
                  <div className="bg-white/[0.03] rounded-xl px-3 py-2 border border-white/5">
                    <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mb-1">PREVIEW</p>
                    <p className="text-xs text-white/70">
                      Daftar hari ini → trial sampai{' '}
                      <span className="text-emerald-400 font-semibold">
                        {previewTrialDate(trialConfig[plan.key])}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveTrial}
              disabled={savingTrial}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-10 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingTrial
                ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</>
                : 'Simpan Trial Config'
              }
            </button>
          </section>

          <div className="h-px bg-white/8" />

          {/* Section B — Diskon Tahunan */}
          <section className="space-y-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478] font-display flex items-center gap-2">
                <Infinity size={13} /> DISKON BILLING TAHUNAN
              </p>
              <p className="text-xs text-[#4B6478] mt-1">Potongan harga jika user pilih billing tahunan</p>
            </div>

            <div className="bg-[#111C24] rounded-2xl p-6 border border-white/8 space-y-5">
              {/* Discount percent */}
              <div className="space-y-1.5">
                <label htmlFor="discount_percent" className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
                  PERSENTASE DISKON (%)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="discount_percent"
                    name="discount_percent"
                    type="number"
                    min={0}
                    max={50}
                    value={annualDiscount.discount_percent}
                    onChange={e => setAnnualDiscount(p => ({ ...p, discount_percent: parseInt(e.target.value) || 0 }))}
                    className="w-32 bg-[#162230] border border-white/10 h-10 rounded-xl px-3 text-sm text-white font-bold focus:outline-none focus:border-emerald-500/40"
                  />
                  <span className="text-sm font-bold text-[#4B6478]">%</span>
                </div>
              </div>

              {/* Badge text */}
              <div className="space-y-1.5">
                <label htmlFor="badge_text" className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
                  TEKS BADGE DI UI
                </label>
                <Input
                  id="badge_text"
                  name="badge_text"
                  type="text"
                  value={annualDiscount.badge_text}
                  onChange={e => setAnnualDiscount(p => ({ ...p, badge_text: e.target.value }))}
                  placeholder="Hemat 2 bln!"
                  className="w-full bg-[#162230] border border-white/10 h-10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-emerald-500/40"
                />
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#4B6478]">Preview:</span>
                  <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
                    {annualDiscount.badge_text || 'Hemat 2 bln!'}
                  </span>
                </div>
              </div>

              {/* Discount preview table */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">PREVIEW TABEL DISKON</p>
                <div className="rounded-xl border border-white/8 overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/[0.03] border-b border-white/8">
                        <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Role / Plan</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Bulanan</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Tahunan/bln</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Hemat/tahun</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { roleId: 'broker', roleLabel: 'Broker' },
                        { roleId: 'peternak', roleLabel: 'Peternak' },
                        { roleId: 'rpa', roleLabel: 'RPA' },
                      ].flatMap(({ roleId, roleLabel }) =>
                        ['pro', 'business'].map(plan => {
                          const base = editingPricing?.[roleId]?.[plan]?.price || 0
                          const yearly = Math.round(base * (1 - annualDiscount.discount_percent / 100))
                          const saving = (base - yearly) * 12
                          return (
                            <tr key={`${roleId}-${plan}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                              <td className="px-4 py-2.5 text-white/70 font-medium">
                                {roleLabel} <span className="text-[#4B6478]">{plan.toUpperCase()}</span>
                              </td>
                              <td className="px-4 py-2.5 text-right text-white font-bold tabular-nums">
                                {formatIDR(base)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-emerald-400 font-bold tabular-nums">
                                {formatIDR(yearly)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-amber-400 font-bold tabular-nums">
                                {formatIDR(saving)}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                onClick={handleSaveDiscount}
                disabled={savingDiscount}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-10 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingDiscount
                  ? <><Loader2 size={14} className="animate-spin" />Menyimpan...</>
                  : 'Simpan Diskon'
                }
              </button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="vouchers" className="space-y-8 animate-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Form Create Voucher */}
            <Card className="lg:col-span-1 bg-[#111C24] border-white/8 rounded-[32px] p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-[0.05] -rotate-12">
                <Tag size={120} className="text-emerald-400" />
              </div>

              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Buat Voucher</h2>
                <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">Berikan potongan khusus untuk tenant</p>
              </div>

              <form key={formKey} onSubmit={handleCreateVoucher} className="space-y-4 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">KODE VOUCHER</label>
                  <div className="relative">
                    <Input
                      name="code"
                      placeholder="MIS: PROMO50"
                      className="bg-black/40 border-white/10 h-12 rounded-xl text-sm font-bold tracking-widest uppercase focus:border-emerald-500/50"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-lg hover:bg-emerald-500/20 text-emerald-400"
                      onClick={() => {
                        const random = Math.random().toString(36).substring(2, 8).toUpperCase()
                        document.getElementsByName('code')[0].value = random
                      }}
                    >
                      <RefreshCcw size={14} />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">TIPE</label>
                    <Select name="discount_type" defaultValue="percentage">
                      <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111C24] border-white/10 text-white">
                        <SelectItem value="percentage">Persentase (%)</SelectItem>
                        <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">NILAI</label>
                    <Input name="discount_value" type="number" placeholder="0" className="bg-black/40 border-white/10 h-12 rounded-xl text-sm font-bold" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">BERLAKU UNTUK PLAN</label>
                  <Select name="applies_to_plan" defaultValue="all">
                    <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111C24] border-white/10 text-white">
                      <SelectItem value="all">Semua Plan</SelectItem>
                      <SelectItem value="pro">Hanya PRO</SelectItem>
                      <SelectItem value="business">Hanya BUSINESS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">BERLAKU UNTUK ROLE</label>
                  <Select name="applies_to_role" defaultValue="all">
                    <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111C24] border-white/10 text-white">
                      <SelectItem value="all">Semua Role</SelectItem>
                      <SelectItem value="broker">Khusus Broker</SelectItem>
                      <SelectItem value="peternak">Khusus Peternak</SelectItem>
                      <SelectItem value="rpa">Khusus RPA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">EXPIRES</label>
                    <Input name="expires_at" type="date" className="bg-black/40 border-white/10 h-12 rounded-xl text-sm font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">LIMIT</label>
                    <Input name="max_usage" type="number" placeholder="∞" className="bg-black/40 border-white/10 h-12 rounded-xl text-sm font-bold" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={createVoucher.isPending}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl font-black uppercase text-[12px] tracking-widest mt-4 shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createVoucher.isPending ? (
                    <><Loader2 size={14} className="animate-spin mr-2" />Menyimpan...</>
                  ) : (
                    '✓ Buat Kode Diskon'
                  )}
                </Button>
              </form>
            </Card>

            {/* Table List Vouchers */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                <Tag size={14} /> DAFTAR VOUCHER AKTIF
              </h2>

              <div className="bg-[#0C1319] rounded-[32px] border border-white/8 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black">Kode</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black">Diskon</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black">Berlaku</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black">Penggunaan</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black text-center">Status</th>
                        <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingVouchers ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <Loader2 size={24} className="animate-spin mx-auto text-emerald-500 opacity-50" />
                          </td>
                        </tr>
                      ) : vouchers?.map((v, i) => (
                        <tr key={v.id} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono font-bold tracking-widest h-8 px-3">
                                {v.code}
                              </Badge>
                              <button onClick={() => handleCopy(v.code)} className="p-1.5 rounded-lg hover:bg-white/10 text-[#4B6478] hover:text-white transition-all">
                                <Copy size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[14px] font-black text-white">
                              {v.discount_type === 'percentage' ? `${v.discount_value}%` : formatIDR(v.discount_value)}
                            </p>
                          </td>
                          <td className="px-6 py-4 space-y-1">
                            <div className="flex gap-1 flex-wrap">
                              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter px-1 border-white/10 text-white/40">{v.applies_to_role}</Badge>
                              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter px-1 border-white/10 text-white/40">{v.applies_to_plan}</Badge>
                            </div>
                            <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-tighter">
                              Exp: {v.expires_at ? formatDate(v.expires_at) : 'Selamanya'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden min-w-[60px]">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: v.max_usage ? `${Math.min((v.usage_count / v.max_usage) * 100, 100)}%` : '5%' }}
                                />
                              </div>
                              <span className="text-[11px] font-black text-white">{v.usage_count} / {v.max_usage ?? '∞'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={v.is_active}
                                onCheckedChange={(checked) => toggleVoucher.mutate({ id: v.id, is_active: checked })}
                                className="data-[state=checked]:bg-emerald-500"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { if (confirm('Hapus voucher ini?')) deleteVoucher.mutate(v.id) }}
                              className="h-8 w-8 p-0 rounded-lg text-[#4B6478] hover:bg-red-500/10 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!isLoadingVouchers && vouchers?.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-[#4B6478]">
                            <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-[11px] font-bold uppercase tracking-widest opacity-30">Belum ada kode diskon dibuat</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Sticky Save Button for Mobile (High-Density UX) */}
      {activeTab === 'plans' && (
        <div className="md:hidden fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-500 pb-[env(safe-area-inset-bottom)]">
          <Button
            onClick={handleSaveAllPricing}
            disabled={savingRole === 'all'}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-14 rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] shadow-[0_20px_50px_rgba(16,185,129,0.3)] border border-emerald-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
             {savingRole === 'all' ? (
              <><Loader2 size={18} className="animate-spin" /> MENYIMPAN DATA...</>
            ) : (
              <>SIMPAN SEMUA PERUBAHAN</>
            )}
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// --- Internal UI Components ---

function RolePricingCard({ roleName, roleId, icon: Icon, color, data, onChange, onSave, isSaving }) {
  const themes = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-purple-500/5",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-500/5"
  }

  return (
    <Card className={`bg-[#111C24] border-white/8 rounded-[32px] p-8 space-y-6 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all`}>
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity ${themes[color]}`}>
        <Icon size={120} strokeWidth={2.5} />
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${themes[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-0.5">Role Vertical</p>
          <h3 className="text-xl font-display font-black text-white uppercase tracking-tight leading-none">{roleName}</h3>
        </div>
      </div>

      <div className="space-y-4 pt-2 relative z-10">
        <div className="space-y-6">
          {/* PRO Row */}
          <div className="space-y-4">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black tracking-widest text-[9px]">PRO PLAN</Badge>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-[#4B6478] font-black tracking-widest ml-1">HARGA ASLI (opsional)</label>
                <InputRupiah
                  value={data.pro.originalPrice}
                  onChange={(v) => onChange(roleId, 'pro', 'originalPrice', v)}
                  className="bg-black/40 border-white/10 h-11 rounded-xl text-right font-black text-white/50 text-base focus:border-emerald-500/30"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-emerald-500/60 font-black tracking-widest ml-1">HARGA AKTIF</label>
                <InputRupiah
                  value={data.pro.price}
                  onChange={(v) => onChange(roleId, 'pro', 'price', v)}
                  className="bg-black/30 border-emerald-500/20 h-11 rounded-xl text-right font-black text-white text-base focus:border-emerald-500/50 focus:bg-emerald-500/5 shadow-inner"
                />
              </div>
            </div>
            {data.pro.originalPrice > 0 && (
              <div className="flex items-center gap-2 px-2 py-1 bg-white/[0.03] rounded-lg border border-white/5 mt-1">
                <span className="line-through text-[#4B6478] text-[11px] font-bold">{formatIDR(data.pro.originalPrice)}</span>
                <span className="text-white/40 text-[10px]">→</span>
                <span className="text-white font-black text-[11px]">{formatIDR(data.pro.price)}</span>
              </div>
            )}
          </div>

          {/* BUSINESS Row */}
          <div className="space-y-4">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-black tracking-widest text-[9px]">BUSINESS PLAN</Badge>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-[#4B6478] font-black tracking-widest ml-1">HARGA ASLI (opsional)</label>
                <InputRupiah
                  value={data.business.originalPrice}
                  onChange={(v) => onChange(roleId, 'business', 'originalPrice', v)}
                  className="bg-black/40 border-white/10 h-11 rounded-xl text-right font-black text-white/50 text-base focus:border-amber-500/30"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-amber-500/60 font-black tracking-widest ml-1">HARGA AKTIF</label>
                <InputRupiah
                  value={data.business.price}
                  onChange={(v) => onChange(roleId, 'business', 'price', v)}
                  className="bg-black/30 border-amber-500/20 h-11 rounded-xl text-right font-black text-white text-base focus:border-amber-500/50 focus:bg-amber-500/5 shadow-inner"
                />
              </div>
            </div>
            {data.business.originalPrice > 0 && (
              <div className="flex items-center gap-2 px-2 py-1 bg-white/[0.03] rounded-lg border border-white/5 mt-1">
                <span className="line-through text-[#4B6478] text-[11px] font-bold">{formatIDR(data.business.originalPrice)}</span>
                <span className="text-white/40 text-[10px]">→</span>
                <span className="text-white font-black text-[11px]">{formatIDR(data.business.price)}</span>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={onSave}
          disabled={isSaving}
          className="w-full bg-white/5 hover:bg-white/10 text-white h-11 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <><Loader2 size={14} className="animate-spin mr-2" />Menyimpan...</>
          ) : (
            'Simpan Perubahan'
          )}
        </Button>
      </div>
    </Card>
  )
}

// ─── Helper: PlanLimitCard ────────────────────────────────────────────────────

function PlanLimitCard({ planName, badgeClass, badgeExtra, kandangValue, teamValue, onKandangChange, onTeamChange, readOnly }) {
  const isUnlimited = (v) => Number(v) >= 99
  const inputCls = "w-full bg-[#162230] border border-white/10 h-10 rounded-xl px-3 text-sm text-white font-bold focus:outline-none focus:border-emerald-500/40 disabled:opacity-50"

  return (
    <div className="bg-[#111C24] rounded-2xl p-5 border border-white/8 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${badgeClass}`}>
          {planName}
        </span>
        {badgeExtra && (
          <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
            {badgeExtra}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`kl_${planName}`} className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
          Kandang Limit
        </label>
        {readOnly ? (
          <div className="h-10 rounded-xl bg-white/[0.03] border border-white/8 flex items-center px-3 gap-1.5 text-sm font-bold text-white/40">
            <Infinity size={14} /> Unlimited
          </div>
        ) : isUnlimited(kandangValue) ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 rounded-xl bg-white/[0.03] border border-white/8 flex items-center px-3 gap-1.5 text-sm font-bold text-amber-400">
              <Infinity size={14} /> Unlimited
            </div>
            <input
              id={`kl_${planName}`}
              name={`kl_${planName}`}
              type="number"
              min={1}
              max={99}
              value={kandangValue}
              onChange={e => onKandangChange(parseInt(e.target.value) || 1)}
              className="w-16 bg-[#162230] border border-white/10 h-10 rounded-xl px-2 text-sm text-white/50 font-bold focus:outline-none focus:border-emerald-500/40"
            />
          </div>
        ) : (
          <input
            id={`kl_${planName}`}
            name={`kl_${planName}`}
            type="number"
            min={1}
            max={99}
            value={kandangValue}
            onChange={e => onKandangChange(parseInt(e.target.value) || 1)}
            className={inputCls}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`tl_${planName}`} className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
          Max Tim
        </label>
        {readOnly ? (
          <div className="h-10 rounded-xl bg-white/[0.03] border border-white/8 flex items-center px-3 gap-1.5 text-sm font-bold text-white/40">
            <Infinity size={14} /> Unlimited
          </div>
        ) : (
          <input
            id={`tl_${planName}`}
            name={`tl_${planName}`}
            type="number"
            min={1}
            max={99}
            value={teamValue}
            onChange={e => onTeamChange(parseInt(e.target.value) || 1)}
            className={inputCls}
          />
        )}
      </div>
    </div>
  )
}

// ─── Helper: AddonPreview ─────────────────────────────────────────────────────

function AddonPreview({ peternakProBase, peternakBizBase, addonPricing }) {
  const exampleJenis = 3
  const extraAddons = exampleJenis - 1
  const total = peternakProBase + extraAddons * (addonPricing.price_per_type || 0)
  const fmtIDRLocal = (n) => 'Rp\u00a0' + (n || 0).toLocaleString('id-ID')
  const willUpgrade = extraAddons > (addonPricing.max_addons_before_upgrade || 2)

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">PREVIEW KALKULASI</p>
      <p className="text-xs text-amber-200/80">Contoh: Peternak PRO dengan {exampleJenis} jenis ternak aktif</p>
      <p className="text-xs text-white font-bold">
        = {fmtIDRLocal(peternakProBase)} + ({extraAddons} × {fmtIDRLocal(addonPricing.price_per_type)})
        {' '}= <span className="text-amber-400">{fmtIDRLocal(total)}/bln</span>
      </p>
      {willUpgrade && (
        <p className="text-xs text-amber-400">
          ⚠ Melebihi cap {addonPricing.max_addons_before_upgrade} → suggest upgrade Business {fmtIDRLocal(peternakBizBase)}/bln
        </p>
      )}
      {!willUpgrade && (
        <p className="text-xs text-[#4B6478]">
          Melebihi cap {addonPricing.max_addons_before_upgrade} add-on → suggest upgrade Business {fmtIDRLocal(peternakBizBase)}/bln
        </p>
      )}
    </div>
  )
}

const PRICING_FEATURES = [
  { label: 'Multi-Tenant (1 Bisnis)', starter: true, pro: true, business: true },
  { label: 'Manajemen Tim & Gaji', starter: true, pro: true, business: true },
  { label: 'Laporan Dashboard Harian', starter: true, pro: true, business: true },
  { label: 'Backup Cloud Gratis', starter: true, pro: true, business: true },
  { label: 'Fitur Khusus RPA & RPA Buyer', starter: false, pro: true, business: true },
  { label: 'Laporan Laba/Rugi Detail', starter: false, pro: true, business: true },
  { label: 'Input Transaksi Tanpa Limit', starter: false, pro: true, business: true },
  { label: 'Prioritas Customer Support', starter: false, pro: false, business: true },
  { label: 'Audit Log Perubahan Data', starter: false, pro: false, business: true },
  { label: 'Whitelist IP & Keamanan Extra', starter: false, pro: false, business: true },
]
