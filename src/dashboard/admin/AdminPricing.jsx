import React, { useState, useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  Tag, Sparkles, Building2,
  Home, Factory, Trash2, Copy, Check,
  RefreshCcw, AlertCircle, Loader2,
  Settings2, Clock, Infinity as InfinityIcon, Egg, ShoppingBasket,
  ShieldAlert, CheckCircle2, XCircle, MapPin, CalendarClock
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
  useMarketPriceReviewQueue,
  useApproveMarketPrice,
  useDeleteMarketPrice,
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

  const { data: reviewQueue = [], isLoading: isLoadingQueue } = useMarketPriceReviewQueue()
  const approvePrice = useApproveMarketPrice()
  const deletePrice = useDeleteMarketPrice()

  const [activeTab, setActiveTab] = useState('plans')
  const [editingPricing, setEditingPricing] = useState(null)
  const [savingRole, setSavingRole] = useState(null)
  const [formKey, setFormKey] = useState(0)

  // ── New: Add-on & Limit state ─────────────────────────────────────────────
  const [addonPricing, setAddonPricing] = useState({
    price_per_type: 99000,
    max_addons_before_upgrade: 2,
    business_slot_price: 150000, // New: Default price for additional business slots
  })
  const [savingAddon, setSavingAddon] = useState(false)

  // ── New: Trial & Diskon state ─────────────────────────────────────────────
  const [annualDiscount, setAnnualDiscount] = useState({
    discount_percent: 20,
    badge_text: 'Hemat 2 bln!',
  })
  const [savingDiscount, setSavingDiscount] = useState(false)
  const [configsInited, setConfigsInited] = useState(false)

  // Initialise local edit state once DB data arrives
  useMemo(() => {
    if (pricing && !editingPricing) {
      setEditingPricing(pricing)
    }
  }, [pricing, editingPricing])

  // Initialise config state once plan_configs data arrives
  useMemo(() => {
    if (configs && Object.keys(configs).length > 0 && !configsInited) {
      if (configs.addon_pricing) setAddonPricing(v => ({ ...v, ...configs.addon_pricing }))
      if (configs.annual_discount) setAnnualDiscount(v => ({ ...v, ...configs.annual_discount }))
      setConfigsInited(true)
    }
  }, [configs, configsInited])

  const handleSaveAllPricing = async () => {
    setSavingRole('all')
    try {
      const roles = ['broker', 'peternak', 'rpa', 'egg_broker', 'sembako_broker']
      const promises = roles.flatMap(role => {
        if (!editingPricing[role]) return []
        return [
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
        ]
      })
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

  const handleSaveAddon = async () => {
    setSavingAddon(true)
    try {
      await updateConfig.mutateAsync({ config_key: 'addon_pricing', config_value: addonPricing })
      toast.success('Harga Add-on berhasil disimpan')
    } catch { /* toast shown in hook */ } finally {
      setSavingAddon(false)
    }
  }

  const handleSaveDiscount = async () => {
    setSavingDiscount(true)
    try {
      await updateConfig.mutateAsync({ config_key: 'annual_discount', config_value: annualDiscount })
      toast.success('Skema diskon tahunan berhasil disimpan')
    } catch { /* toast shown in hook */ } finally {
      setSavingDiscount(false)
    }
  }

  if (isLoadingPricing || !editingPricing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Background Orbs for AdminPricing specific depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full opacity-50" />
      </div>

      {/* Header — Optimized for Mobile: Large text hidden to save space */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-20 md:top-20 lg:top-0 z-20 bg-[#080C10]/60 backdrop-blur-xl border border-white/5 py-4 -mx-2 px-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            Pricing & Discounts
          </h1>
          <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1 ml-4">
            Kelola skema pendapatan & promosi platform
          </p>
        </div>
        
        {activeTab === 'plans' && (
          <Button
            onClick={handleSaveAllPricing}
            disabled={savingRole === 'all'}
            className="hidden md:flex bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-11 px-8 text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 border border-emerald-400/20"
          >
            {savingRole === 'all' ? (
              <><Loader2 size={14} className="animate-spin mr-2" /> Menyiimpan...</>
            ) : (
              'Simpan Semua Perubahan'
            )}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
        <TabsList className="bg-white/[0.03] backdrop-blur-md border border-white/5 p-1 h-14 rounded-2xl mb-10 w-full flex overflow-x-auto overflow-y-hidden scrollbar-hide flex-nowrap sticky top-[10rem] md:top-[10rem] lg:relative lg:top-0 z-10 shadow-2xl items-center justify-start">
          {[
            { id: 'plans', label: 'Harga Plan' },
            { id: 'addons', label: 'Add-on Pricing' },
            { id: 'discounts', label: 'Diskon Tahunan' },
            { id: 'vouchers', label: 'Kode Diskon' },
            { id: 'review', label: 'Review Harga', badge: reviewQueue.length || null }
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 shrink-0 min-w-[120px] relative rounded-xl font-bold uppercase text-[10px] md:text-[11px] tracking-widest transition-colors data-[state=active]:text-white text-[#4B6478] hover:text-white/60 h-full z-10 bg-transparent"
            >
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-white/5 rounded-xl border border-white/10 shadow-lg" />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.label}
                {tab.badge ? (
                  <span className="bg-amber-500 text-black text-[8px] font-black rounded-full px-1.5 py-0.5 leading-none">{tab.badge}</span>
                ) : null}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="plans" className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Pricing Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <RolePricingCard
              roleName="Broker Ayam"
              roleId="broker"
              icon={Building2}
              color="emerald"
              data={editingPricing.broker}
              onChange={handlePriceChange}
              onSave={() => handleSavePricing('broker')}
              isSaving={savingRole === 'broker'}
              vertical="poultry_broker"
            />
            <RolePricingCard
              roleName="Peternak Ayam"
              roleId="peternak"
              icon={Home}
              color="purple"
              data={editingPricing.peternak}
              onChange={handlePriceChange}
              onSave={() => handleSavePricing('peternak')}
              isSaving={savingRole === 'peternak'}
              vertical="peternak"
            />
            <RolePricingCard
              roleName="Sapi Potong"
              roleId="peternak_sapi_potong"
              icon={Home}
              color="emerald"
              data={editingPricing.peternak_sapi_potong ?? { pro: { price: 499000, originalPrice: 699000 }, business: { price: 999000, originalPrice: 1999000 } }}
              onChange={handlePriceChange}
              onSave={() => handleSavePricing('peternak_sapi_potong')}
              isSaving={savingRole === 'peternak_sapi_potong'}
              vertical="peternak_sapi_potong"
            />
            <RolePricingCard
              roleName="Kambing & Domba"
              roleId="peternak_kambing_domba"
              icon={Home}
              color="amber"
              data={editingPricing.peternak_kambing_domba ?? { pro: { price: 499000, originalPrice: 699000 }, business: { price: 999000, originalPrice: 1999000 } }}
              onChange={handlePriceChange}
              onSave={() => handleSavePricing('peternak_kambing_domba')}
              isSaving={savingRole === 'peternak_kambing_domba'}
              vertical="peternak_kambing_domba"
            />
            <RolePricingCard
              roleName="Sapi Perah"
              roleId="peternak_sapi_perah"
              icon={Home}
              color="sky"
              data={editingPricing.peternak_sapi_perah ?? { pro: { price: 499000, originalPrice: 699000 }, business: { price: 999000, originalPrice: 1999000 } }}
              onChange={handlePriceChange}
              onSave={() => handleSavePricing('peternak_sapi_perah')}
              isSaving={savingRole === 'peternak_sapi_perah'}
              vertical="peternak_sapi_perah"
            />
            <RolePricingCard
              roleName="Rumah Potong (RPA)"
              roleId="rpa"
              icon={Factory}
              color="amber"
              data={editingPricing.rpa}
              onChange={handlePriceChange}
              onSave={() => handleSavePricing('rpa')}
              isSaving={savingRole === 'rpa'}
              vertical="rumah_potong"
            />
            <RolePricingCard
              roleName="Broker Telur"
              roleId="egg_broker"
              icon={Egg}
              color="sky"
              data={editingPricing.egg_broker ?? { pro: { price: 199000, originalPrice: 249000 }, business: { price: 399000, originalPrice: 499000 } }}
              onChange={handlePriceChange}
              onSave={() => handleSavePricing('egg_broker')}
              isSaving={savingRole === 'egg_broker'}
              vertical="egg_broker"
            />
            <RolePricingCard
              roleName="Sembako / Distributor"
              roleId="sembako_broker"
              icon={ShoppingBasket}
              color="rose"
              data={editingPricing.sembako_broker ?? { pro: { price: 249000, originalPrice: 299000 }, business: { price: 499000, originalPrice: 599000 } }}
              onChange={handlePriceChange}
              onSave={() => handleSavePricing('sembako_broker')}
              isSaving={savingRole === 'sembako_broker'}
              vertical="sembako_broker"
            />
          </div>

          {/* Preview Section */}
          <section className="space-y-10">
            <div className="flex items-center gap-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h2 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.4em] whitespace-nowrap bg-[#080C10] px-4 py-1 rounded-full border border-white/5">PREVIEW TAMPILAN PRICING</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <div className="bg-white/[0.02] backdrop-blur-2xl rounded-[40px] border border-white/5 overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.6)] max-w-5xl mx-auto group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <table className="w-full text-left border-collapse relative z-10">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5">
                    <th className="px-10 py-10 text-[11px] font-black uppercase text-[#4B6478] tracking-widest">Fitur & Benefit</th>
                    <th className="px-8 py-10 text-center">
                      <div className="bg-white/5 inline-flex p-1 rounded-lg mb-4">
                        <Badge className="bg-transparent text-white/40 border-none font-black uppercase tracking-widest text-[9px]">STARTER</Badge>
                      </div>
                      <p className="text-3xl font-display font-black text-white tracking-tight">GRATIS</p>
                      <p className="text-[10px] font-bold text-[#4B6478] uppercase mt-2">Selamanya</p>
                    </th>
                    <th className="px-8 py-10 text-center bg-emerald-500/[0.03] relative min-w-[200px]">
                      <div className="absolute top-0 right-0 p-4">
                        <Sparkles size={16} className="text-emerald-400 opacity-20" />
                      </div>
                      <div className="bg-emerald-500/10 inline-flex p-1 rounded-lg mb-4 border border-emerald-500/20">
                        <Badge className="bg-transparent text-emerald-400 border-none font-black uppercase tracking-widest text-[9px]">PRO</Badge>
                      </div>
                      {editingPricing.broker.pro.originalPrice > 0 && (
                        <p className="line-through text-[#4B6478] text-xs mb-1 font-bold">{formatIDR(editingPricing.broker.pro.originalPrice)}</p>
                      )}
                      <p className="text-3xl font-display font-black text-emerald-400 tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">{formatIDR(editingPricing.broker.pro.price)}</p>
                      <p className="text-[10px] font-bold text-emerald-500/60 uppercase mt-2">Per Bulan</p>
                    </th>
                    <th className="px-8 py-10 text-center bg-amber-500/[0.03] min-w-[200px]">
                      <div className="bg-amber-500/10 inline-flex p-1 rounded-lg mb-4 border border-amber-500/20">
                        <Badge className="bg-transparent text-amber-400 border-none font-black uppercase tracking-widest text-[9px]">BUSINESS</Badge>
                      </div>
                      {editingPricing.broker.business.originalPrice > 0 && (
                        <p className="line-through text-[#4B6478] text-xs mb-1 font-bold">{formatIDR(editingPricing.broker.business.originalPrice)}</p>
                      )}
                      <p className="text-3xl font-display font-black text-amber-400 tracking-tight drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">{formatIDR(editingPricing.broker.business.price)}</p>
                      <p className="text-[10px] font-bold text-amber-500/60 uppercase mt-2">Per Bulan</p>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[14px]">
                  {PRICING_FEATURES.map((feature, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors group/row">
                      <td className="px-10 py-5 text-white/70 font-medium group-hover/row:text-white transition-colors">{feature.label}</td>
                      <td className="px-8 py-5 text-center">{feature.starter ? <Check size={20} className="mx-auto text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" /> : <div className="w-5 h-0.5 bg-white/5 mx-auto" />}</td>
                      <td className="px-8 py-5 text-center bg-emerald-500/[0.01]">{feature.pro ? <Check size={20} className="mx-auto text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" /> : <div className="w-5 h-0.5 bg-white/5 mx-auto" />}</td>
                      <td className="px-8 py-5 text-center bg-amber-500/[0.01]">{feature.business ? <Check size={20} className="mx-auto text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" /> : <div className="w-5 h-0.5 bg-white/5 mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-10 bg-white/[0.01] border-t border-white/5 flex justify-center">
                <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-[0.2em]">Semua paket termasuk update fitur berkelanjutan & backup harian otomatis</p>
              </div>
            </div>
          </section>
        </TabsContent>


        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: ADD-ON PRICING                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="addons" className="space-y-10 animate-in fade-in duration-300">

          {/* Section A — Add-on Pricing */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Tag size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4B6478]">
                  ADD-ON JENIS TERNAK — PETERNAK PRO
                </p>
                <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5">
                  Upselling skema multi-vertical
                </p>
              </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-xl rounded-[32px] p-8 border border-white/5 space-y-8 shadow-xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {/* Price per type */}
                <div className="space-y-2.5">
                  <label htmlFor="addon_price" className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">
                    HARGA ADD-ON PER JENIS TERNAK / BULAN
                  </label>
                  <InputRupiah
                    id="addon_price"
                    name="addon_price"
                    value={addonPricing.price_per_type}
                    onChange={v => setAddonPricing(p => ({ ...p, price_per_type: v || 0 }))}
                    className="bg-black/40 border-white/5 h-14 rounded-2xl font-black text-white text-xl focus:border-purple-500/40 focus:bg-purple-500/5 transition-all shadow-inner"
                  />
                </div>

                {/* Max add-ons before upgrade */}
                <div className="space-y-2.5">
                  <label htmlFor="max_addons" className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">
                    MAKSIMAL ADD-ON SEBELUM UPGRADE
                  </label>
                  <div className="relative">
                    <Input
                      id="max_addons"
                      name="max_addons"
                      type="number"
                      min={1}
                      max={10}
                      value={addonPricing.max_addons_before_upgrade}
                      onChange={e => setAddonPricing(p => ({ ...p, max_addons_before_upgrade: parseInt(e.target.value) || 1 }))}
                      className="w-full bg-black/40 border-white/5 h-14 rounded-2xl px-4 text-lg text-white font-black focus:border-purple-500/40 focus:bg-purple-500/5 transition-all shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#4B6478] uppercase tracking-widest">JENIS</div>
                  </div>
                </div>

                {/* New: Price per Business Slot */}
                <div className="space-y-2.5">
                  <label htmlFor="business_slot_price" className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">
                    HARGA PER SLOT BISNIS TAMBAHAN (ONE-TIME)
                  </label>
                  <InputRupiah
                    id="business_slot_price"
                    name="business_slot_price"
                    value={addonPricing.business_slot_price}
                    onChange={v => setAddonPricing(p => ({ ...p, business_slot_price: v || 0 }))}
                    className="bg-black/40 border-white/5 h-14 rounded-2xl font-black text-white text-xl focus:border-purple-500/40 focus:bg-purple-500/5 transition-all shadow-inner"
                  />
                  <p className="text-[10px] text-[#4B6478] mt-1 ml-1 font-medium">Bapak bisa jual slot bisnis tambahan sebagai add-on mandiri.</p>
                </div>
              </div>

              {/* Plans that get add-on (informational) */}
              <div className="space-y-4 relative z-10 pb-4 border-b border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">TIER PENERIMA ADD-ON</p>
                <div className="flex items-center gap-6">
                  {[
                    { id: 'cb_pro', label: 'PRO', checked: true, color: 'text-emerald-400' },
                    { id: 'cb_business', label: 'BUSINESS', checked: false, color: 'text-[#4B6478]' },
                    { id: 'cb_enterprise', label: 'ENTERPRISE', checked: false, color: 'text-[#4B6478]' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.checked ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
                      <span className={`text-[11px] font-black tracking-widest ${item.color}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Realtime preview */}
              <div className="relative z-10">
                <AddonPreview
                  peternakProBase={editingPricing?.peternak?.pro?.price || 499000}
                  peternakBizBase={editingPricing?.peternak?.business?.price || 999000}
                  addonPricing={addonPricing}
                />
              </div>

              <button
                onClick={handleSaveAddon}
                disabled={savingAddon}
                className="relative z-10 w-full bg-white/[0.03] hover:bg-white/[0.08] text-white h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.25em] transition-all border border-white/5 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {savingAddon
                  ? <><Loader2 size={16} className="animate-spin" /> MENYIMPAN...</>
                  : 'UPDATE KONFIGURASI ADD-ON'
                }
              </button>
            </div>
          </section>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: DISKON TAHUNAN                                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="discounts" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Section A — Diskon Tahunan */}
          <section className="space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/5">
                <InfinityIcon size={22} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Diskon Billing Tahunan</h2>
                <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">Incentive untuk komitmen jangka panjang</p>
              </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-xl rounded-[40px] p-8 border border-white/5 space-y-10 shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-50" />
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                  {/* Discount percent */}
                  <div className="space-y-3">
                    <label htmlFor="discount_percent" className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">
                      PERSENTASE POTONGAN (%)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Input
                          id="discount_percent"
                          name="discount_percent"
                          type="number"
                          min={0}
                          max={50}
                          value={annualDiscount.discount_percent}
                          onChange={e => setAnnualDiscount(p => ({ ...p, discount_percent: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-black/40 border-white/5 h-16 rounded-3xl px-8 text-3xl font-black text-white text-center focus:border-purple-500/40 focus:bg-purple-500/5 transition-all shadow-inner tabular-nums"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-[#4B6478]">%</div>
                      </div>
                    </div>
                  </div>

                  {/* Badge text */}
                  <div className="space-y-3">
                    <label htmlFor="badge_text" className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1">
                      TEKS LABEL PROMO DI UI
                    </label>
                    <Input
                      id="badge_text"
                      name="badge_text"
                      type="text"
                      value={annualDiscount.badge_text}
                      onChange={e => setAnnualDiscount(p => ({ ...p, badge_text: e.target.value }))}
                      placeholder="Contoh: Hemat 2 bln!"
                      className="w-full bg-black/40 border-white/5 h-16 rounded-3xl px-6 text-xl text-white font-bold focus:border-purple-500/40 focus:bg-purple-500/5 transition-all shadow-inner"
                    />
                    <div className="flex items-center gap-3 mt-2 ml-2">
                      <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Live Preview:</span>
                      <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
                        {annualDiscount.badge_text || 'HEMET 2 BLN!'}
                      </span>
                    </div>
                  </div>
              </div>

              {/* Discount preview table */}
              <div className="space-y-4 relative z-10 border-t border-white/5 pt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4B6478] ml-1">PROYEKSI HARGA SETELAH DISKON</p>
                <div className="rounded-[24px] border border-white/5 overflow-hidden shadow-inner bg-black/20">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/[0.04] border-b border-white/5">
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Paket Layanan</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Monthly</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-emerald-400">Tahunan (Eff. per bln)</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-amber-500">Hemat per Tahun</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px]">
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
                            <tr key={`${roleId}-${plan}`} className="border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors group/row">
                              <td className="px-6 py-3.5 text-white/50 font-black tracking-tight group-hover/row:text-white transition-colors">
                                {roleLabel} <span className="text-[#4B6478] ml-1">{plan.toUpperCase()}</span>
                              </td>
                              <td className="px-6 py-3.5 text-right text-white/40 font-bold tabular-nums">
                                {formatIDR(base)}
                              </td>
                              <td className="px-6 py-3.5 text-right text-emerald-400 font-black tabular-nums bg-emerald-500/[0.02]">
                                {formatIDR(yearly)}
                              </td>
                              <td className="px-6 py-3.5 text-right text-amber-400 font-black tabular-nums">
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
                className="relative z-10 w-full bg-emerald-500 hover:bg-emerald-600 text-white h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.25em] transition-all border border-emerald-400/20 flex items-center justify-center gap-3 active:scale-[0.98] shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
              >
                {savingDiscount
                  ? <><Loader2 size={16} className="animate-spin" /> MENYIMPAN DISKON...</>
                  : 'UPDATE SKEMA DISKON TAHUNAN'
                }
              </button>
            </div>
          </section>
        </TabsContent>


        <TabsContent value="vouchers" className="space-y-8 animate-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Form Create Voucher */}
            <Card className="lg:col-span-1 bg-white/[0.02] backdrop-blur-xl border-white/5 rounded-[40px] p-8 space-y-8 shadow-[0_32px_120px_rgba(0,0,0,0.5)] relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-[0.05] -rotate-12 transition-all duration-1000 scale-150">
                <Tag size={120} className="text-emerald-400" />
              </div>

              <div className="relative z-10">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Buat Voucher</h2>
                <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-2 flex items-center gap-2">
                   <span className="w-1 h-1 rounded-full bg-emerald-500 block" />
                   Loyalty & Promo Engine
                </p>
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
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.4em] flex items-center gap-3">
                  <Tag size={14} className="text-emerald-500" />
                  DAFTAR VOUCHER AKTIF
                </h2>
                <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{vouchers?.length || 0} TOTAL</span>
                </div>
              </div>

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
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: REVIEW HARGA PASAR                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="review" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5">
              <ShieldAlert size={22} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Review Queue Harga Pasar</h2>
              <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">
                Harga yang terdeteksi outlier (&gt;40% deviasi) — perlu persetujuan manual
              </p>
            </div>
            {reviewQueue.length > 0 && (
              <div className="ml-auto bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{reviewQueue.length} PENDING</span>
              </div>
            )}
          </div>

          {isLoadingQueue ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 size={24} className="animate-spin text-amber-400" />
            </div>
          ) : reviewQueue.length === 0 ? (
            <div className="bg-white/[0.02] rounded-[32px] border border-white/5 flex flex-col items-center justify-center py-20 gap-4">
              <CheckCircle2 size={40} className="text-emerald-500 opacity-40" />
              <p className="text-[12px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Tidak ada harga yang perlu direview</p>
            </div>
          ) : (
            <div className="bg-[#0C1319] rounded-[32px] border border-white/5 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Jenis</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
                        <span className="flex items-center gap-1"><MapPin size={10} />Wilayah</span>
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478] text-right">Kandang</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478] text-right">Jual Rata-rata</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Sumber</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
                        <span className="flex items-center gap-1"><CalendarClock size={10} />Tanggal</span>
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#4B6478] text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewQueue.map((row, i) => (
                      <tr key={row.id} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
                        <td className="px-6 py-4">
                          <span className="text-[12px] font-black text-white capitalize">{row.chicken_type ?? row.commodity_type ?? '—'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[12px] text-white/70 font-medium">{row.region ?? '—'}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[13px] font-black text-amber-400 tabular-nums">
                            {row.farm_gate_price != null ? formatIDR(row.farm_gate_price) : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[13px] font-bold text-white/60 tabular-nums">
                            {row.avg_sell_price != null ? formatIDR(row.avg_sell_price) : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-white/10 text-white/40">
                            {row.source}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] text-[#4B6478] font-bold">
                            {row.price_date ? format(new Date(row.price_date), 'd MMM yyyy', { locale: idLocale }) : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => approvePrice.mutate(row.id)}
                              disabled={approvePrice.isPending}
                              className="h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider gap-1"
                            >
                              <CheckCircle2 size={12} />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deletePrice.mutate(row.id)}
                              disabled={deletePrice.isPending}
                              className="h-8 w-8 p-0 rounded-lg text-[#4B6478] hover:bg-red-500/10 hover:text-red-500"
                            >
                              <XCircle size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
    </div>
  )
}

// --- Internal UI Components ---

function RolePricingCard({ roleName, roleId, icon: Icon, color, data, onChange, onSave, isSaving, vertical }) {
  if (!data?.pro || !data?.business) return null

  const themes = {
    emerald: {
      card: "shadow-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40",
      icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
      mesh: "from-emerald-500/10 via-transparent to-transparent",
      inputFocus: "focus:border-emerald-500/40 focus:bg-emerald-500/5 focus:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
    },
    purple: {
      card: "shadow-purple-500/5 border-purple-500/20 hover:border-purple-500/40",
      icon: "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]",
      mesh: "from-purple-500/10 via-transparent to-transparent",
      inputFocus: "focus:border-purple-500/40 focus:bg-purple-500/5 focus:shadow-[0_0_20px_rgba(168,85,247,0.1)]"
    },
    amber: {
      card: "shadow-amber-500/5 border-amber-500/20 hover:border-amber-500/40",
      icon: "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
      mesh: "from-amber-500/10 via-transparent to-transparent",
      inputFocus: "focus:border-amber-500/40 focus:bg-amber-500/5 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)]"
    },
    sky: {
      card: "shadow-sky-500/5 border-sky-500/20 hover:border-sky-500/40",
      icon: "bg-sky-500/10 border-sky-500/20 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.2)]",
      mesh: "from-sky-500/10 via-transparent to-transparent",
      inputFocus: "focus:border-sky-500/40 focus:bg-sky-500/5 focus:shadow-[0_0_20px_rgba(14,165,233,0.1)]"
    },
    rose: {
      card: "shadow-rose-500/5 border-rose-500/20 hover:border-rose-500/40",
      icon: "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]",
      mesh: "from-rose-500/10 via-transparent to-transparent",
      inputFocus: "focus:border-rose-500/40 focus:bg-rose-500/5 focus:shadow-[0_0_20px_rgba(244,63,94,0.1)]"
    },
  }[color]

  return (
    <Card className={`group relative bg-[#111C24]/40 backdrop-blur-xl rounded-[40px] p-8 border ${themes.card} transition-all duration-500 overflow-hidden hover:-translate-y-2`}>
      {/* Mesh Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${themes.mesh} opacity-50 group-hover:opacity-100 transition-opacity duration-700`} />
      
      {/* Decorative Icon in background */}
      <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 scale-150 group-hover:rotate-12">
        <Icon size={180} strokeWidth={1} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-5 mb-10">
          <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${themes.icon}`}>
            <Icon size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em] mb-1 opacity-70">ADMIN CONTROL</p>
            <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight leading-none group-hover:tracking-wider transition-all duration-500">{roleName}</h3>
            {vertical && (
              <p className="text-[9px] text-[#2A3F52] font-mono mt-1">business_vertical: {vertical}</p>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-10">
          {/* PRO PLAN SECTION */}
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black tracking-widest text-[9px] px-3 py-1">PRO PLAN</Badge>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2 group/input">
                <label className="text-[9px] uppercase text-[#4B6478] font-black tracking-widest ml-1 transition-colors group-hover/input:text-emerald-500/60">Target Harga Aktif</label>
                <InputRupiah
                  value={data.pro.price}
                  onChange={(v) => onChange(roleId, 'pro', 'price', v)}
                  className={`bg-black/40 border-white/5 h-14 rounded-2xl text-right font-black text-white text-lg transition-all duration-300 shadow-inner ${themes.inputFocus}`}
                />
              </div>
              <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                <label className="text-[9px] uppercase text-[#4B6478] font-black tracking-widest ml-1">Harga Semula (Coret)</label>
                <InputRupiah
                  value={data.pro.originalPrice}
                  onChange={(v) => onChange(roleId, 'pro', 'originalPrice', v)}
                  className="bg-black/20 border-white/5 h-12 rounded-xl text-right font-black text-white/40 text-sm focus:border-white/10 transition-all"
                  placeholder="Opsional"
                />
              </div>
            </div>
          </div>

          {/* BUSINESS PLAN SECTION */}
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
            <div className="flex items-center gap-3">
              <Badge className="bg-amber-500/10 text-amber-400 border-none font-black tracking-widest text-[9px] px-3 py-1">BUSINESS PLAN</Badge>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2 group/input">
                <label className="text-[9px] uppercase text-[#4B6478] font-black tracking-widest ml-1 transition-colors group-hover/input:text-amber-500/60">Target Harga Aktif</label>
                <InputRupiah
                  value={data.business.price}
                  onChange={(v) => onChange(roleId, 'business', 'price', v)}
                  className={`bg-black/40 border-white/5 h-14 rounded-2xl text-right font-black text-white text-lg transition-all duration-300 shadow-inner ${themes.inputFocus}`}
                />
              </div>
              <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                <label className="text-[9px] uppercase text-[#4B6478] font-black tracking-widest ml-1">Harga Semula (Coret)</label>
                <InputRupiah
                  value={data.business.originalPrice}
                  onChange={(v) => onChange(roleId, 'business', 'originalPrice', v)}
                  className="bg-black/20 border-white/5 h-12 rounded-xl text-right font-black text-white/40 text-sm focus:border-white/10 transition-all"
                  placeholder="Opsional"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 relative z-10">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full bg-white/[0.03] hover:bg-white/[0.08] text-white h-14 rounded-[20px] text-[11px] font-black uppercase tracking-[0.25em] border border-white/5 active:scale-[0.97] transition-all duration-300 disabled:opacity-50 overflow-hidden relative group/btn shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
            {isSaving ? (
              <><Loader2 size={16} className="animate-spin mr-3" /> Menyimpan...</>
            ) : (
              'Update Skema →'
            )}
          </Button>
        </div>
      </div>
    </Card>
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
