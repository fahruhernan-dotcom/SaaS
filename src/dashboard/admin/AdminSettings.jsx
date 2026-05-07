import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe, Bot, Shield, AlertTriangle,
  Save, RefreshCw, PowerOff, Building2,
  Loader2, Infinity as InfinityIcon, Settings2, Clock, RefreshCcw,
  ArrowRight, History
} from 'lucide-react'
import { usePlanConfigs, useUpdatePlanConfig, usePlanConfigHistory } from '@/lib/hooks/useAdminData'
import { supabase } from '@/lib/supabase'
import { format, addDays } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export default function AdminSettings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')

  // Mock States
  const [bannerText, setBannerText] = useState('')
  const [bannerActive, setBannerActive] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  
  const [aiProvider, setAiProvider] = useState('anthropic')
  const [isPinging, setIsPinging] = useState(false)
  const [pingResult, setPingResult] = useState(null)
  
  // Real States for Limits & Quotas migrated from AdminPricing
  const { data: configs = {} } = usePlanConfigs()
  const updateConfig = useUpdatePlanConfig()

  const [kandangLimits, setKandangLimits] = useState({ starter: 1, pro: 2, business: 99, enterprise: 99 })
  const [teamLimits, setTeamLimits] = useState({ starter: 1, pro: 3, business: 10, enterprise: 99 })
  const [businessLimits, setBusinessLimits] = useState({ starter: 1, pro: 3, business: 999, enterprise: 999 })
  const [ternakLimits, setTernakLimits] = useState({
    domba_kambing: { starter: 20, pro: 100, business: null },
    sapi:          { starter: 10, pro: 50,  business: null },
  })
  const [trxQuota, setTrxQuota] = useState({ starter: 30 })
  const [trialConfig, setTrialConfig] = useState({ starter: 14, pro: 14, business: 14 })

  const [savingLimits, setSavingLimits] = useState(false)
  const [savingQuota, setSavingQuota] = useState(false)
  const [savingTrial, setSavingTrial] = useState(false)
  const [configsInited, setConfigsInited] = useState(false)

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    configKey: '',
    oldValue: null,
    newValue: null,
    onConfirm: null,
  })

  React.useMemo(() => {
    if (configs && Object.keys(configs).length > 0 && !configsInited) {
      if (configs.kandang_limit) setKandangLimits(v => ({ ...v, ...configs.kandang_limit }))
      if (configs.team_limit) setTeamLimits(v => ({ ...v, ...configs.team_limit }))
      if (configs.business_limit) setBusinessLimits(v => ({ ...v, ...configs.business_limit }))
      if (configs.ternak_limit) setTernakLimits(v => ({ ...v, ...configs.ternak_limit }))
      if (configs.transaction_quota) setTrxQuota(v => ({ ...v, ...configs.transaction_quota }))
      if (configs.trial_config) setTrialConfig(v => ({ ...v, ...configs.trial_config }))
      if (configs.maintenance_mode !== undefined) setMaintenanceMode(!!configs.maintenance_mode)
      setConfigsInited(true)
    }
  }, [configs, configsInited])

  // Audit trail: log every config change to global_audit_logs
  // Schema: actor_profile_id(uuid FK→profiles), tenant_id, action, entity_type, entity_id(uuid), old_data(jsonb), new_data(jsonb)
  const logAuditTrail = useCallback(async (configKey, oldVal, newVal) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      // Get profile ID from auth user (superadmin may not have one, that's ok)
      let profileId = null
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle()
        profileId = profile?.id ?? null
      }
      await supabase.from('global_audit_logs').insert({
        actor_profile_id: profileId,
        tenant_id: null, // global config = no tenant scope
        action: 'CONFIG_UPDATE',
        entity_type: `plan_configs.${configKey}`,
        entity_id: null,
        old_data: oldVal ?? null,
        new_data: newVal ?? null,
      })
    } catch {
      // Non-blocking: audit failure should not block config save
    }
  }, [])

  // Wrapper: open confirmation dialog before executing save
  const requestConfirmSave = useCallback(({ title, configKey, oldValue, newValue, onConfirm }) => {
    setConfirmDialog({ open: true, title, configKey, oldValue, newValue, onConfirm })
  }, [])
  
  const [auditRetention, setAuditRetention] = useState('90')
  const [killSwitchConfirm, setKillSwitchConfirm] = useState('')

  const handleToggleMaintenance = async (val) => {
    setMaintenanceMode(val)
    try {
      await updateConfig.mutateAsync({ config_key: 'maintenance_mode', config_value: val })
      await logAuditTrail('maintenance_mode', maintenanceMode, val)
      toast.success(val ? 'Maintenance Mode aktif' : 'Maintenance Mode dinonaktifkan')
    } catch {
      setMaintenanceMode(!val) // revert on error
    }
  }

  const handleRollback = useCallback(async (configKey, oldValue) => {
    await updateConfig.mutateAsync({ config_key: configKey, config_value: oldValue })
    setConfigsInited(false)
  }, [updateConfig])

  // --- Actual save executors (called after confirmation) ---
  const executeSaveLimits = async () => {
    setSavingLimits(true)
    try {
      const oldKandang = configs?.kandang_limit, oldTeam = configs?.team_limit, oldBusiness = configs?.business_limit
      await updateConfig.mutateAsync({ config_key: 'kandang_limit', config_value: kandangLimits })
      await updateConfig.mutateAsync({ config_key: 'team_limit', config_value: teamLimits })
      await updateConfig.mutateAsync({ config_key: 'business_limit', config_value: businessLimits })
      await logAuditTrail('kandang_limit', oldKandang, kandangLimits)
      await logAuditTrail('team_limit', oldTeam, teamLimits)
      await logAuditTrail('business_limit', oldBusiness, businessLimits)
      toast.success('Konfigurasi limit berhasil disimpan')
    } catch { /* toast shown in hook */ } finally {
      setSavingLimits(false)
    }
  }

  const executeSaveTernakLimits = async () => {
    setSavingLimits(true)
    try {
      const oldVal = configs?.ternak_limit
      await updateConfig.mutateAsync({ config_key: 'ternak_limit', config_value: ternakLimits })
      await logAuditTrail('ternak_limit', oldVal, ternakLimits)
      toast.success('Limit ternak berhasil disimpan!')
    } catch { /* toast shown in hook */ } finally {
      setSavingLimits(false)
    }
  }

  const executeSaveQuota = async () => {
    const val = Number(trxQuota.starter)
    setSavingQuota(true)
    try {
      const oldVal = configs?.transaction_quota
      await updateConfig.mutateAsync({ config_key: 'transaction_quota', config_value: { starter: val } })
      await logAuditTrail('transaction_quota', oldVal, { starter: val })
      toast.success('Kuota transaksi berhasil disimpan')
    } catch { /* toast shown in hook */ } finally {
      setSavingQuota(false)
    }
  }

  const executeSaveTrial = async () => {
    setSavingTrial(true)
    try {
      const oldVal = configs?.trial_config
      await updateConfig.mutateAsync({ config_key: 'trial_config', config_value: trialConfig })
      await logAuditTrail('trial_config', oldVal, trialConfig)
      toast.success('Konfigurasi trial berhasil disimpan')
    } catch { /* toast shown in hook */ } finally {
      setSavingTrial(false)
    }
  }

  // --- Handlers: validate → open confirmation dialog ---
  const handleSaveLimits = () => {
    const allValues = [
      ...Object.values(kandangLimits),
      ...Object.values(teamLimits),
      ...Object.values(businessLimits),
    ]
    if (allValues.some(v => v !== null && (isNaN(Number(v)) || Number(v) < 1))) {
      toast.error('Semua nilai limit harus minimal 1')
      return
    }
    requestConfirmSave({
      title: 'Simpan Konfigurasi Limit',
      configKey: 'kandang_limit + team_limit + business_limit',
      oldValue: { kandang: configs?.kandang_limit, team: configs?.team_limit, business: configs?.business_limit },
      newValue: { kandang: kandangLimits, team: teamLimits, business: businessLimits },
      onConfirm: executeSaveLimits,
    })
  }

  const handleSaveTernakLimits = () => {
    requestConfirmSave({
      title: 'Simpan Limit Ternak',
      configKey: 'ternak_limit',
      oldValue: configs?.ternak_limit,
      newValue: ternakLimits,
      onConfirm: executeSaveTernakLimits,
    })
  }

  const handleSaveQuota = () => {
    const val = Number(trxQuota.starter)
    if (!val || val < 1 || val > 9999) {
      toast.error('Kuota harus antara 1–9999')
      return
    }
    requestConfirmSave({
      title: 'Simpan Kuota Transaksi',
      configKey: 'transaction_quota',
      oldValue: configs?.transaction_quota,
      newValue: { starter: val },
      onConfirm: executeSaveQuota,
    })
  }

  const handleSaveTrial = () => {
    requestConfirmSave({
      title: 'Simpan Konfigurasi Trial',
      configKey: 'trial_config',
      oldValue: configs?.trial_config,
      newValue: trialConfig,
      onConfirm: executeSaveTrial,
    })
  }

  const previewTrialDate = (days) =>
    format(addDays(new Date(), Number(days) || 0), 'd MMMM yyyy', { locale: idLocale })

  const handlePingSimulated = () => {
    setIsPinging(true)
    setPingResult(null)
    setTimeout(() => {
      setIsPinging(false)
      setPingResult({
        status: 'Operational',
        latency: Math.floor(Math.random() * 200) + 50 + 'ms',
        time: new Date().toLocaleTimeString()
      })
      toast.success('Koneksi ke LLM Provider stabil')
    }, 1500)
  }

  const executeKillSwitch = async () => {
    if (killSwitchConfirm !== 'CONFIRM') {
      toast.error('Ketik CONFIRM dengan benar')
      return
    }
    await logAuditTrail('kill_switch', null, { executed_at: new Date().toISOString() })
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div>
      {/* ─── Confirmation Dialog ─── */}
      <ConfirmSaveDialog
        open={confirmDialog.open}
        onOpenChange={(v) => setConfirmDialog(p => ({ ...p, open: v }))}
        title={confirmDialog.title}
        configKey={confirmDialog.configKey}
        oldValue={confirmDialog.oldValue}
        newValue={confirmDialog.newValue}
        onConfirm={() => {
          setConfirmDialog(p => ({ ...p, open: false }))
          confirmDialog.onConfirm?.()
        }}
      />
      <div className="hidden lg:flex items-center justify-between py-4">
        <div>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">System Settings</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurasi global platform</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-[#111C24] border border-white/5 p-1.5 h-auto rounded-xl lg:rounded-2xl flex flex-wrap gap-1 shadow-lg w-full justify-start overflow-x-auto no-scrollbar">
          <TabsTrigger value="general" className="rounded-lg lg:rounded-xl px-4 py-2.5 text-[10px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-emerald-400">
            <Globe className="w-4 h-4 mr-2" /> General
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-lg lg:rounded-xl px-4 py-2.5 text-[10px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-blue-400">
            <Bot className="w-4 h-4 mr-2" /> AI Config
          </TabsTrigger>
          <TabsTrigger value="limits" className="rounded-lg lg:rounded-xl px-4 py-2.5 text-[10px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-purple-400">
            <Building2 className="w-4 h-4 mr-2" /> Limits & Quotas
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg lg:rounded-xl px-4 py-2.5 text-[10px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-red-400">
            <Shield className="w-4 h-4 mr-2" /> Security
          </TabsTrigger>
        </TabsList>

        <div className="bg-[#0C1319] rounded-2xl border border-white/5 p-5 lg:p-8 shadow-xl min-h-[500px]">
          
          {/* GENERAL TAB */}
          <TabsContent value="general" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Globe className="text-emerald-400" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Platform Controls</h2>
                  <p className="text-[11px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5">Pengaturan tampilan & aksesibilitas platform</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[13px] font-bold text-white">Global Banner</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Tampilkan pengumuman di atas layar semua user.</p>
                    </div>
                    <Switch checked={bannerActive} onCheckedChange={setBannerActive} className="data-[state=checked]:bg-emerald-500" />
                  </div>
                  <Input 
                    placeholder="Contoh: Maintenance besok pukul 23:00 WIB" 
                    value={bannerText}
                    onChange={e => setBannerText(e.target.value)}
                    disabled={!bannerActive}
                    className="bg-black/40 border-white/10"
                  />
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                     <div>
                      <h3 className="text-[13px] font-black text-white flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-500" />
                        Maintenance Mode
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">Hanya Superadmin yang dapat mengakses sistem.</p>
                    </div>
                    <Switch checked={maintenanceMode} onCheckedChange={handleToggleMaintenance} className="data-[state=checked]:bg-amber-500" />
                  </div>
                  {maintenanceMode && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-[11px] font-bold text-amber-500">⚠ Sistem saat ini dalam Maintenance Mode.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </TabsContent>

          {/* AI CONFIG TAB */}
          <TabsContent value="ai" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Bot className="text-blue-400" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">AI & Integration</h2>
                  <p className="text-[11px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5">Manajemen TernakBot LLM Engine</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
                  <div>
                    <h3 className="text-[13px] font-bold text-white mb-1">Primary LLM Provider</h3>
                    <p className="text-[10px] text-slate-400 mb-3">Pilih AI engine mana yang menangani traffic utama.</p>
                    <Select value={aiProvider} onValueChange={setAiProvider}>
                      <SelectTrigger className="bg-black/40 border-white/10">
                        <SelectValue placeholder="Pilih Provider" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111C24] border-white/10 text-white">
                        <SelectItem value="anthropic">Anthropic Claude (Recommended)</SelectItem>
                        <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
                        <SelectItem value="deepseek">DeepSeek Coder V2 (Low Cost)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[11px] text-blue-300">
                    Sistem fail-over aktif. Jika {aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} down, TernakBot otomatis menggunakan provider cadangan.
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col">
                  <h3 className="text-[13px] font-bold text-white mb-1">API Health Status</h3>
                  <p className="text-[10px] text-slate-400 mb-4">Simulated health check ping ke gateway API.</p>
                  
                  <div className="flex-1 flex flex-col items-center justify-center bg-black/40 rounded-xl mb-4 p-4 border border-white/5 relative overflow-hidden">
                    {isPinging && (
                       <RefreshCw className="animate-spin text-blue-500 opacity-50 mb-2" size={24} />
                    )}
                    {!isPinging && pingResult && (
                      <div className="text-center font-mono">
                        <p className="text-emerald-400 text-sm font-bold">{pingResult.status}</p>
                        <p className="text-xs text-slate-400 mt-1">Latency: {pingResult.latency}</p>
                        <p className="text-[9px] text-[#4B6478] mt-2">Checked at {pingResult.time}</p>
                      </div>
                    )}
                    {!isPinging && !pingResult && (
                       <p className="text-xs text-[#4B6478] font-mono">Ready to ping</p>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={handlePingSimulated}
                    disabled={isPinging}
                    className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10 uppercase tracking-widest text-[10px] font-black h-10"
                  >
                    Mulai Diagnostic Ping
                  </Button>
                </div>
              </div>
            </section>
          </TabsContent>

          {/* LIMITS & QUOTAS TAB */}
          <TabsContent value="limits" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Section A — Kandang & Tim Limit */}
            <section className="space-y-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478] font-display flex items-center gap-2">
                  <Settings2 size={13} /> KANDANG LIMIT PER PLAN
                </p>
                <p className="text-xs text-[#4B6478] mt-1">Jumlah kandang aktif maksimal yang bisa dimiliki per plan</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <PlanLimitCard
                  planName="STARTER"
                  badgeClass="bg-white/10 text-white/50"
                  kandangValue={kandangLimits.starter}
                  teamValue={teamLimits.starter}
                  businessValue={businessLimits.starter}
                  onKandangChange={v => setKandangLimits(p => ({ ...p, starter: v }))}
                  onTeamChange={v => setTeamLimits(p => ({ ...p, starter: v }))}
                  onBusinessChange={v => setBusinessLimits(p => ({ ...p, starter: v }))}
                />
                <PlanLimitCard
                  planName="PRO"
                  badgeClass="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  kandangValue={kandangLimits.pro}
                  teamValue={teamLimits.pro}
                  businessValue={businessLimits.pro}
                  onKandangChange={v => setKandangLimits(p => ({ ...p, pro: v }))}
                  onTeamChange={v => setTeamLimits(p => ({ ...p, pro: v }))}
                  onBusinessChange={v => setBusinessLimits(p => ({ ...p, pro: v }))}
                />
                <PlanLimitCard
                  planName="BUSINESS"
                  badgeExtra="MOST POPULAR"
                  badgeClass="bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  kandangValue={kandangLimits.business}
                  teamValue={teamLimits.business}
                  businessValue={businessLimits.business}
                  onKandangChange={v => setKandangLimits(p => ({ ...p, business: v }))}
                  onTeamChange={v => setTeamLimits(p => ({ ...p, business: v }))}
                  onBusinessChange={v => setBusinessLimits(p => ({ ...p, business: v }))}
                />
                <PlanLimitCard
                  planName="ENTERPRISE"
                  badgeClass="bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  readOnly
                  kandangValue={99}
                  teamValue={99}
                  businessValue={999}
                />
              </div>

              <button
                onClick={handleSaveLimits}
                disabled={savingLimits}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.3)] border border-emerald-400/20 active:scale-[0.98]"
              >
                {savingLimits
                  ? <><Loader2 size={16} className="animate-spin" /> MENYIMPAN LIMIT...</>
                  : 'SIMPAN KONFIGURASI LIMIT'
                }
              </button>
              <ConfigHistoryWidget configKey="kandang_limit" onRollback={handleRollback} />
            </section>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent my-4" />

            {/* Section B — Ternak Limit */}
            <section className="space-y-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478] font-display flex items-center gap-2">
                  <Settings2 size={13} /> LIMIT TERNAK AKTIF PER PLAN
                </p>
                <p className="text-xs text-[#4B6478] mt-1">Jumlah ekor ternak aktif maksimal per tenant. Business = tidak terbatas.</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'domba_kambing', label: 'Domba & Kambing', emoji: '🐑' },
                  { key: 'sapi', label: 'Sapi', emoji: '🐃' },
                ].map(({ key, label, emoji }) => (
                  <div key={key} className="bg-white/[0.03] rounded-[24px] p-6 border border-white/5 space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-white/60">{emoji} {label}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Starter</label>
                        <input
                          type="number"
                          min={1}
                          value={ternakLimits[key]?.starter ?? ''}
                          onChange={e => setTernakLimits(p => ({
                            ...p,
                            [key]: { ...p[key], starter: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-full bg-black/40 border border-white/5 h-11 rounded-2xl px-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Pro</label>
                        <input
                          type="number"
                          min={1}
                          value={ternakLimits[key]?.pro ?? ''}
                          onChange={e => setTernakLimits(p => ({
                            ...p,
                            [key]: { ...p[key], pro: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-full bg-black/40 border border-emerald-500/20 h-11 rounded-2xl px-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-amber-500/60">Business</label>
                        <div className="h-11 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center px-4 gap-2 text-sm font-black text-amber-400">
                          <InfinityIcon size={15} /> Unlimited
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveTernakLimits}
                disabled={savingLimits}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.3)] border border-emerald-400/20 active:scale-[0.98]"
              >
                {savingLimits
                  ? <><Loader2 size={16} className="animate-spin" /> MENYIMPAN...</>
                  : 'SIMPAN LIMIT TERNAK'
                }
              </button>
              <ConfigHistoryWidget configKey="ternak_limit" onRollback={handleRollback} />
            </section>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent my-4" />

            {/* Section C — Transaction Quota */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <RefreshCcw size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4B6478]">
                    KUOTA TRANSAKSI BULANAN
                  </p>
                  <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5">
                    Berlaku untuk semua vertikal — global per plan
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/[0.03] backdrop-blur-lg rounded-[32px] p-7 border border-white/5 space-y-5 hover:border-white/10 transition-all duration-500 group">
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 text-[#94A3B8]">
                    STARTER
                  </span>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 group-hover:text-emerald-500/60 transition-colors">
                      Kuota Transaksi / Bulan
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={9999}
                        value={trxQuota.starter}
                        onChange={e => setTrxQuota(v => ({ ...v, starter: Number(e.target.value) }))}
                        className="w-full bg-black/40 border border-white/5 h-12 rounded-2xl px-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all shadow-inner"
                      />
                      <span className="text-[11px] text-[#4B6478] font-bold whitespace-nowrap shrink-0">trx / bln</span>
                    </div>
                    <p className="text-[10px] text-[#4B6478] ml-1">
                      Tersimpan: <span className="text-white font-bold">{configs?.transaction_quota?.starter ?? 30}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-lg rounded-[32px] p-7 border border-white/5 space-y-5 hover:border-emerald-500/20 transition-all duration-500 group">
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    PRO
                  </span>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 group-hover:text-emerald-500/60 transition-colors">
                      Kuota Transaksi / Bulan
                    </label>
                    <div className="h-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center px-4 gap-2 text-sm font-black text-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                      <InfinityIcon size={16} /> Unlimited
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-lg rounded-[32px] p-7 border border-white/5 space-y-5 hover:border-amber-500/20 transition-all duration-500 group">
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                    BUSINESS
                  </span>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 group-hover:text-amber-500/60 transition-colors">
                      Kuota Transaksi / Bulan
                    </label>
                    <div className="h-12 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center px-4 gap-2 text-sm font-black text-amber-400 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                      <InfinityIcon size={16} /> Unlimited
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveQuota}
                disabled={savingQuota}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.3)] border border-emerald-400/20 active:scale-[0.98]"
              >
                {savingQuota
                  ? <><Loader2 size={16} className="animate-spin" /> MENYIMPAN...</>
                  : 'SIMPAN KUOTA TRANSAKSI'
                }
              </button>
              <ConfigHistoryWidget configKey="transaction_quota" onRollback={handleRollback} />
            </section>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent my-4" />

            {/* Section D — Trial Duration */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Clock size={18} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4B6478]">Durasi Trial Gratis</p>
                  <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5">Konfigurasi first-user experience</p>
                </div>
              </div>

              <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border bg-white/5 text-[#94A3B8] border-white/5 shrink-0">
                  STARTER
                </span>
                <div className="flex-1">
                  <p className="text-[12px] font-bold text-[#94A3B8]">Gratis Selamanya — tidak ada trial</p>
                  <p className="text-[11px] text-[#4B6478] mt-0.5">Plan Starter tidak menggunakan mekanisme trial. Akses langsung tanpa batas waktu.</p>
                </div>
                <InfinityIcon size={18} className="text-[#2A3F52] shrink-0" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'pro',     label: 'PRO',     badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', hoverBorder: 'hover:border-emerald-500/20', labelHover: 'group-hover:text-emerald-500/60', previewColor: 'text-emerald-400', inputFocus: 'focus:border-emerald-500/40 focus:bg-emerald-500/5' },
                  { key: 'business',label: 'BUSINESS',badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   hoverBorder: 'hover:border-amber-500/20',   labelHover: 'group-hover:text-amber-500/60',   previewColor: 'text-amber-400',   inputFocus: 'focus:border-amber-500/40 focus:bg-amber-500/5'   },
                ].map(plan => (
                  <div key={plan.key} className={`bg-white/[0.03] backdrop-blur-lg rounded-[32px] p-7 border border-white/5 space-y-5 ${plan.hoverBorder} transition-all duration-500 group`}>
                    <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${plan.badgeClass}`}>
                      {plan.label}
                    </span>
                    <div className="space-y-2">
                      <label htmlFor={`trial_${plan.key}`} className={`text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 ${plan.labelHover} transition-colors`}>
                        Durasi Trial (Hari)
                      </label>
                      <Input
                        id={`trial_${plan.key}`}
                        type="number"
                        min={1}
                        max={365}
                        value={trialConfig[plan.key]}
                        onChange={e => setTrialConfig(p => ({ ...p, [plan.key]: parseInt(e.target.value) || 1 }))}
                        className={`w-full bg-black/40 border-white/5 h-12 rounded-2xl px-4 text-sm text-white font-black shadow-inner ${plan.inputFocus} transition-all`}
                      />
                    </div>
                    <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                      <p className="text-[10px] text-[#4B6478] font-black uppercase tracking-[0.15em] mb-1.5">Aktif trial sampai</p>
                      <p className={`text-base font-black tracking-tight ${plan.previewColor}`}>
                        {previewTrialDate(trialConfig[plan.key])}
                      </p>
                      <p className="text-[11px] text-[#4B6478] mt-0.5">jika daftar hari ini</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveTrial}
                disabled={savingTrial}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.3)] border border-emerald-400/20 active:scale-[0.98]"
              >
                {savingTrial
                  ? <><Loader2 size={16} className="animate-spin" /> MENYIMPAN...</>
                  : 'SIMPAN KONFIGURASI TRIAL'
                }
              </button>
              <ConfigHistoryWidget configKey="trial_config" onRollback={handleRollback} />
            </section>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Shield className="text-red-400" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Security & Compliance</h2>
                  <p className="text-[11px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5">Pengamanan ekstrim dan Logging</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                 <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-[13px] font-bold text-white mb-1">Audit Log Retention</h3>
                      <p className="text-[10px] text-slate-400">Berapa lama rekam jejak aksi disave di database, memenuhi SLA Compliance.</p>
                    </div>
                    <Select value={auditRetention} onValueChange={setAuditRetention}>
                      <SelectTrigger className="w-[200px] bg-black/40 border-white/10">
                        <SelectValue placeholder="Pilih durasi" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111C24] border-white/10 text-white">
                        <SelectItem value="30">30 Hari</SelectItem>
                        <SelectItem value="60">60 Hari</SelectItem>
                        <SelectItem value="90">90 Hari</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                        <SelectItem value="forever">Simpan Selamanya</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>

                 <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl space-y-4">
                    <div>
                      <h3 className="text-[13px] font-bold text-red-500 mb-1 flex items-center gap-2">
                        <PowerOff size={14} /> Force Logout All Users Phase
                      </h3>
                      <p className="text-[10px] text-red-400/70">
                        Tombol darurat ini memutus sesi login semua active user termasuk Anda sendiri. Tindakan tidak dapat diurung.
                      </p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-3">
                      <Input 
                        placeholder="Ketik CONFIRM di sini..." 
                        value={killSwitchConfirm}
                        onChange={e => setKillSwitchConfirm(e.target.value)}
                        className="bg-black/40 border-red-500/30 text-white focus:border-red-500 placeholder:text-red-500/30"
                      />
                      <Button 
                        variant="destructive"
                        onClick={executeKillSwitch}
                        disabled={killSwitchConfirm !== 'CONFIRM'}
                        className="bg-red-600 hover:bg-red-700 uppercase font-black tracking-widest px-8 shadow-lg shadow-red-600/20 shrink-0"
                      >
                        Jalankan Kill Switch
                      </Button>
                    </div>
                 </div>
              </div>
             </section>
          </TabsContent>

        </div>
      </Tabs>

    </div>
  )
}

// ─── Helper: ConfirmSaveDialog ────────────────────────────────────────────────

function ConfirmSaveDialog({ open, onOpenChange, title, configKey, oldValue, newValue, onConfirm }) {
  const renderValue = (val) => {
    if (val == null) return <span className="text-slate-500 italic">belum diset</span>
    if (typeof val === 'object') {
      return (
        <pre className="text-[11px] bg-black/60 rounded-xl p-3 border border-white/5 overflow-auto max-h-40 text-slate-300 font-mono">
          {JSON.stringify(val, null, 2)}
        </pre>
      )
    }
    return <span className="font-bold text-white">{String(val)}</span>
  }

  // Detect changed keys for highlighting
  const getChanges = () => {
    if (!oldValue || !newValue || typeof oldValue !== 'object' || typeof newValue !== 'object') return null
    const changes = []
    const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)])
    for (const k of allKeys) {
      const o = typeof oldValue[k] === 'object' ? JSON.stringify(oldValue[k]) : oldValue[k]
      const n = typeof newValue[k] === 'object' ? JSON.stringify(newValue[k]) : newValue[k]
      if (o !== n) changes.push({ key: k, old: oldValue[k], new: newValue[k] })
    }
    return changes.length > 0 ? changes : null
  }
  const changes = getChanges()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#0C1319] border border-white/10 max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white font-black uppercase tracking-tight flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p className="text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                ⚠ Perubahan ini berdampak ke SELURUH tenant aktif secara realtime. Pastikan nilainya benar.
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Config: {configKey}
              </p>
              {changes ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Perubahan Terdeteksi:</p>
                  {changes.map(c => (
                    <div key={c.key} className="flex items-center gap-2 text-[11px] bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">
                      <span className="text-slate-400 font-mono shrink-0">{c.key}</span>
                      <span className="text-red-400 font-bold line-through">{JSON.stringify(c.old)}</span>
                      <ArrowRight size={12} className="text-slate-600 shrink-0" />
                      <span className="text-emerald-400 font-bold">{JSON.stringify(c.new)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400/60 mb-1">Sebelum (DB)</p>
                    {renderValue(oldValue)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 mb-1">Sesudah (Baru)</p>
                    {renderValue(newValue)}
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 uppercase text-[10px] font-black tracking-widest">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-emerald-500 hover:bg-emerald-600 text-white uppercase text-[10px] font-black tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Save size={14} className="mr-2" />
            Konfirmasi & Simpan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Helper: PlanLimitCard ────────────────────────────────────────────────────

function ConfigHistoryWidget({ configKey, onRollback }) {
  const { data: history } = usePlanConfigHistory(configKey)
  const [isOpen, setIsOpen] = useState(false)

  if (!history?.length) return null

  return (
    <div className="mt-1">
      <button
        onClick={() => setIsOpen(v => !v)}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#4B6478] hover:text-white/60 transition-colors py-1"
      >
        <History size={12} />
        {isOpen ? 'Sembunyikan' : 'Lihat'} riwayat ({history.length})
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2">
          {history.map(entry => (
            <div key={entry.id} className="flex items-start justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#4B6478]">
                  {format(new Date(entry.created_at), 'd MMM yyyy HH:mm', { locale: idLocale })}
                </p>
                <p className="text-[10px] text-white/40 truncate mt-0.5 font-mono">
                  {JSON.stringify(entry.old_data)} → {JSON.stringify(entry.new_data)}
                </p>
              </div>
              {entry.old_data != null && (
                <button
                  onClick={() => onRollback(configKey, entry.old_data)}
                  className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
                >
                  Rollback
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PlanLimitCard({ planName, badgeClass, badgeExtra, kandangValue, teamValue, businessValue, onKandangChange, onTeamChange, onBusinessChange, readOnly }) {
  const isUnlimited = (v) => Number(v) >= 99
  const isUnlimitedBusiness = (v) => Number(v) >= 999
  const inputCls = "w-full bg-black/40 border border-white/5 h-12 rounded-2xl px-4 text-sm text-white font-black focus:outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all shadow-inner disabled:opacity-50"

  return (
    <div className="bg-white/[0.03] backdrop-blur-lg rounded-[32px] p-7 border border-white/5 space-y-6 hover:border-white/10 transition-all duration-500 group">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/5 ${badgeClass}`}>
          {planName}
        </span>
        {badgeExtra && (
          <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/10 animate-pulse">
            {badgeExtra}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={`bl_${planName}`} className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 group-hover:text-purple-500/60 transition-colors">
          Business Limit (Jatah Bisnis)
        </label>
        {isUnlimitedBusiness(businessValue) ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-12 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-center px-4 gap-2 text-sm font-black text-purple-400 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]">
              <InfinityIcon size={16} /> Unlimited
            </div>
            <input
              id={`bl_${planName}`}
              type="number"
              value={businessValue}
              onChange={e => onBusinessChange(parseInt(e.target.value) || 1)}
              className="w-16 bg-black/40 border-white/5 h-12 rounded-xl px-2 text-sm text-white/40 font-black text-center"
            />
          </div>
        ) : (
          <input
            id={`bl_${planName}`}
            type="number"
            min={1}
            max={999}
            value={businessValue}
            onChange={e => onBusinessChange(parseInt(e.target.value) || 1)}
            className={inputCls}
          />
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={`kl_${planName}`} className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 group-hover:text-emerald-500/60 transition-colors">
          Kandang Limit
        </label>
        {readOnly ? (
          <div className="h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center px-4 gap-2 text-sm font-black text-white/30">
            <InfinityIcon size={16} /> Unlimited Access
          </div>
        ) : isUnlimited(kandangValue) ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center px-4 gap-2 text-sm font-black text-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
              <InfinityIcon size={16} /> Unlimited
            </div>
            <input
              id={`kl_${planName}`}
              type="number"
              value={kandangValue}
              onChange={e => onKandangChange(parseInt(e.target.value) || 1)}
              className="w-16 bg-black/40 border-white/5 h-12 rounded-xl px-2 text-sm text-white/40 font-black text-center"
            />
          </div>
        ) : (
          <input
            id={`kl_${planName}`}
            type="number"
            min={1}
            max={99}
            value={kandangValue}
            onChange={e => onKandangChange(parseInt(e.target.value) || 1)}
            className={inputCls}
          />
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={`tl_${planName}`} className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] ml-1 group-hover:text-emerald-500/60 transition-colors">
          Max Anggota Tim
        </label>
        {readOnly ? (
          <div className="h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center px-4 gap-2 text-sm font-black text-white/30">
            <InfinityIcon size={16} /> Unlimited Access
          </div>
        ) : (
          <input
            id={`tl_${planName}`}
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
