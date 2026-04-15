import React, { useState } from 'react'
import {
  Settings, Globe, Bot, Shield, Box, HelpCircle, AlertTriangle, 
  Save, RefreshCw, PowerOff, Building2
} from 'lucide-react'
import { Card } from '@/components/ui/card'
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
import { toast } from 'sonner'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

export default function AdminSettings() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [activeTab, setActiveTab] = useState('general')

  // Mock States
  const [bannerText, setBannerText] = useState('')
  const [bannerActive, setBannerActive] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  
  const [aiProvider, setAiProvider] = useState('anthropic')
  const [isPinging, setIsPinging] = useState(false)
  const [pingResult, setPingResult] = useState(null)
  
  const [trialDays, setTrialDays] = useState('14')
  const [defaultKandang, setDefaultKandang] = useState('1')
  
  const [auditRetention, setAuditRetention] = useState('90')
  const [killSwitchConfirm, setKillSwitchConfirm] = useState('')

  const handleSave = () => {
    toast.success('Pengaturan berhasil disimpan')
  }

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

  const executeKillSwitch = () => {
    if (killSwitchConfirm !== 'CONFIRM') {
      toast.error('Ketik CONFIRM dengan benar')
      return
    }
    toast.success('Force Logout dieksekusi ke seluruh sesi aktif')
    setKillSwitchConfirm('')
  }

  return (
    <div>
      <div className="hidden lg:flex items-center justify-between py-4">
        <div>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">System Settings</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurasi global platform</p>
        </div>
        <Button 
          onClick={handleSave}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest px-6 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
        >
          <Save size={16} className="mr-2" />
          Simpan Perubahan
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-[#111C24] border border-white/5 p-1.5 h-auto rounded-xl lg:rounded-2xl flex flex-wrap gap-1 shadow-lg w-full justify-start overflow-x-auto no-scrollbar">
          <TabsTrigger value="general" className="rounded-lg lg:rounded-xl px-4 py-2.5 text-[10px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-emerald-400">
            <Globe className="w-4 h-4 mr-2" /> General
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-lg lg:rounded-xl px-4 py-2.5 text-[10px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-blue-400">
            <Bot className="w-4 h-4 mr-2" /> AI Config
          </TabsTrigger>
          <TabsTrigger value="tenant" className="rounded-lg lg:rounded-xl px-4 py-2.5 text-[10px] lg:text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-purple-400">
            <Building2 className="w-4 h-4 mr-2" /> Tenant Defaults
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
                    <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} className="data-[state=checked]:bg-amber-500" />
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

          {/* TENANT DEFAULTS TAB */}
          <TabsContent value="tenant" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Building2 className="text-purple-400" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">Tenant Defaults</h2>
                  <p className="text-[11px] text-[#4B6478] font-bold uppercase tracking-widest mt-0.5">Konfigurasi bawaan untuk pendaftar baru</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
                    <h3 className="text-[13px] font-bold text-white mb-1">Masa Trial Default</h3>
                    <p className="text-[10px] text-slate-400 mb-2">Berapa hari mode Starter gratis sebelum kadaluarsa.</p>
                    <Select value={trialDays} onValueChange={setTrialDays}>
                      <SelectTrigger className="bg-black/40 border-white/10">
                        <SelectValue placeholder="Pilih durasi trial" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111C24] border-white/10 text-white">
                        <SelectItem value="7">7 Hari</SelectItem>
                        <SelectItem value="14">14 Hari (Standar)</SelectItem>
                        <SelectItem value="30">30 Hari</SelectItem>
                        <SelectItem value="0">Tanpa Trial (Langsung Expired)</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>

                 <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-4">
                    <h3 className="text-[13px] font-bold text-white mb-1">Limit Kandang (Starter)</h3>
                    <p className="text-[10px] text-slate-400 mb-2">Batas jumlah kandang untuk tenant di paket Starter.</p>
                    <Select value={defaultKandang} onValueChange={setDefaultKandang}>
                      <SelectTrigger className="bg-black/40 border-white/10">
                        <SelectValue placeholder="Pilih limit" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111C24] border-white/10 text-white">
                        <SelectItem value="1">1 Kandang</SelectItem>
                        <SelectItem value="2">2 Kandang</SelectItem>
                        <SelectItem value="5">5 Kandang</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              </div>
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

      {!isDesktop && (
        <div className="fixed bottom-24 left-4 right-4 z-40">
           <Button 
            onClick={handleSave}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(16,185,129,0.3)] rounded-2xl"
          >
            Simpan Perubahan
          </Button>
        </div>
      )}
    </div>
  )
}
