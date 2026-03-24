import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, Tag, Sparkles, Shield, Building2, 
  Home, Factory, Plus, Trash2, Copy, Check, 
  RefreshCcw, Info, AlertCircle, Calendar, Users
} from 'lucide-react'
import { 
  usePricingConfig, 
  useUpdatePricing, 
  useDiscountCodes, 
  useCreateDiscountCode, 
  useToggleDiscountCode,
  useDeleteDiscountCode
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

export default function AdminPricing() {
  const { data: pricing, isLoading: isLoadingPricing } = usePricingConfig()
  const { data: vouchers, isLoading: isLoadingVouchers } = useDiscountCodes()
  const updatePricing = useUpdatePricing()
  const createVoucher = useCreateDiscountCode()
  const toggleVoucher = useToggleDiscountCode()
  const deleteVoucher = useDeleteDiscountCode()

  const [activeTab, setActiveTab] = useState('plans')
  const [editingPricing, setEditingPricing] = useState(null)

  // Sync editingPricing when data loads
  useMemo(() => {
    if (pricing && !editingPricing) {
      // Migrate old data (plain numbers) to new structure (objects)
      const migrated = {}
      Object.keys(pricing).forEach(role => {
        migrated[role] = {
          pro: (pricing[role].pro && typeof pricing[role].pro === 'object')
            ? pricing[role].pro 
            : { price: pricing[role].pro || 0, originalPrice: 0 },
          business: (pricing[role].business && typeof pricing[role].business === 'object')
            ? pricing[role].business 
            : { price: pricing[role].business || 0, originalPrice: 0 }
        }
      })
      setEditingPricing(migrated)
    }
  }, [pricing])

  const handlePriceChange = (role, plan, field, value) => {
    const numericValue = parseInt(value.replace(/\D/g, '')) || 0
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

  const handleSavePricing = (role) => {
    updatePricing.mutate({
      ...editingPricing,
      [role]: editingPricing[role]
    })
  }

  const handleCreateVoucher = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const payload = {
      code: formData.get('code').toUpperCase(),
      type: formData.get('type'),
      value: parseInt(formData.get('value')) || 0,
      apply_to_plan: formData.get('apply_to_plan'),
      apply_to_role: formData.get('apply_to_role'),
      expires_at: formData.get('expires_at') || null,
      max_usage: formData.get('max_usage') ? parseInt(formData.get('max_usage')) : null
    }

    if (payload.type === 'percentage' && payload.value > 100) {
      toast.error('Persentase tidak boleh lebih dari 100%')
      return
    }

    createVoucher.mutate(payload)
    e.target.reset()
  }

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Kode diskon disalin!')
  }

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
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            Pricing & Discounts
          </h1>
          <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">
            Atur skema harga paket dan kelola kode voucher promo
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#111C24] border border-white/5 p-1 h-12 rounded-2xl mb-8">
          <TabsTrigger 
            value="plans" 
            className="flex-1 rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-bold uppercase text-[12px] tracking-widest transition-all"
          >
            Harga Plan
          </TabsTrigger>
          <TabsTrigger 
            value="vouchers" 
            className="flex-1 rounded-xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-bold uppercase text-[12px] tracking-widest transition-all"
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
            />
            <RolePricingCard 
                roleName="Peternak" 
                roleId="peternak" 
                icon={Home} 
                color="purple" 
                data={editingPricing.peternak} 
                onChange={handlePriceChange}
                onSave={() => handleSavePricing('peternak')}
            />
            <RolePricingCard 
                roleName="RPA" 
                roleId="rpa" 
                icon={Factory} 
                color="amber" 
                data={editingPricing.rpa} 
                onChange={handlePriceChange}
                onSave={() => handleSavePricing('rpa')}
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

                 <form onSubmit={handleCreateVoucher} className="space-y-4 relative z-10">
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
                          <Select name="type" defaultValue="percentage">
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
                          <Input name="value" type="number" placeholder="0" className="bg-black/40 border-white/10 h-12 rounded-xl text-sm font-bold" required />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">BERLAKU UNTUK PLAN</label>
                       <Select name="apply_to_plan" defaultValue="all">
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
                       <Select name="apply_to_role" defaultValue="all">
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

                    <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl font-black uppercase text-[12px] tracking-widest mt-4 shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98]">
                        ✓ Buat Kode Diskon
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
                                <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black">Usage</th>
                                <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-black text-right">Aksi</th>
                             </tr>
                          </thead>
                          <tbody>
                             {vouchers?.map((v, i) => (
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
                                         {v.type === 'percentage' ? `${v.value}%` : formatIDR(v.value)}
                                      </p>
                                   </td>
                                   <td className="px-6 py-4 space-y-1">
                                      <div className="flex gap-1 flex-wrap">
                                         <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter px-1 border-white/10 text-white/40">{v.apply_to_role}</Badge>
                                         <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter px-1 border-white/10 text-white/40">{v.apply_to_plan}</Badge>
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
                                              style={{ width: v.max_usage ? `${(v.usage_count / v.max_usage) * 100}%` : '5%' }}
                                            />
                                         </div>
                                         <span className="text-[11px] font-black text-white">{v.usage_count}/{v.max_usage || '∞'}</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                      <div className="flex justify-center">
                                         <Switch 
                                            checked={v.is_active} 
                                            onCheckedChange={() => toggleVoucher.mutate(v.id)}
                                            className="data-[state=checked]:bg-emerald-500"
                                         />
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => { if(confirm('Hapus voucher ini?')) deleteVoucher.mutate(v.id) }}
                                        className="h-8 w-8 p-0 rounded-lg text-[#4B6478] hover:bg-red-500/10 hover:text-red-500"
                                      >
                                         <Trash2 size={14} />
                                      </Button>
                                   </td>
                                </tr>
                             ))}
                             {vouchers?.length === 0 && (
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
    </motion.div>
  )
}

// --- Internal UI Components ---

function RolePricingCard({ roleName, roleId, icon: Icon, color, data, onChange, onSave }) {
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
              <div className="space-y-2">
                 <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black tracking-widest text-[9px]">PRO</Badge>
                 <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-1">
                       <label className="text-[10px] uppercase text-[#4B6478] font-bold ml-1">HARGA ASLI (opsional)</label>
                       <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white/40">Rp</span>
                          <Input 
                              value={formatIDR(data.pro.originalPrice).replace('Rp ', '')}
                              onChange={(e) => onChange(roleId, 'pro', 'originalPrice', e.target.value)}
                              className="bg-black/40 border-white/10 h-10 rounded-xl text-right font-black text-white/60 pl-8 text-sm"
                              placeholder="0"
                          />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] uppercase text-emerald-500/60 font-bold ml-1">HARGA AKTIF</label>
                       <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white/40">Rp</span>
                          <Input 
                              value={formatIDR(data.pro.price).replace('Rp ', '')}
                              onChange={(e) => onChange(roleId, 'pro', 'price', e.target.value)}
                              className="bg-black/40 border-white/10 h-10 rounded-xl text-right font-black text-white pl-8 text-sm focus:border-emerald-500/50"
                          />
                       </div>
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
              <div className="space-y-2">
                 <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-black tracking-widest text-[9px]">BUSINESS</Badge>
                 <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-1">
                       <label className="text-[10px] uppercase text-[#4B6478] font-bold ml-1">HARGA ASLI (opsional)</label>
                       <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white/40">Rp</span>
                          <Input 
                              value={formatIDR(data.business.originalPrice).replace('Rp ', '')}
                              onChange={(e) => onChange(roleId, 'business', 'originalPrice', e.target.value)}
                              className="bg-black/40 border-white/10 h-10 rounded-xl text-right font-black text-white/60 pl-8 text-sm"
                              placeholder="0"
                          />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] uppercase text-amber-500/60 font-bold ml-1">HARGA AKTIF</label>
                       <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-white/40">Rp</span>
                          <Input 
                              value={formatIDR(data.business.price).replace('Rp ', '')}
                              onChange={(e) => onChange(roleId, 'business', 'price', e.target.value)}
                              className="bg-black/40 border-white/10 h-10 rounded-xl text-right font-black text-white pl-8 text-sm focus:border-amber-500/50"
                          />
                       </div>
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
            className="w-full bg-white/5 hover:bg-white/10 text-white h-11 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 active:scale-[0.98] transition-all"
           >
              Simpan Perubahan
           </Button>
        </div>
      </Card>
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
