import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Building2, Shield, Search, Filter,
  MoreVertical, Edit3, Trash2, CheckCircle2,
  XCircle, AlertCircle, Clock, Check, ChevronRight,
  ArrowRight, Sparkles, User as UserIcon, Calendar,
  Bird, Egg, Home, Activity, User
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useAllTenants, useAdminUpdateTenant, useAllUsers } from '@/lib/hooks/useAdminData'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from 'sonner'

export default function AdminUsers() {
  const { data: tenants, isLoading } = useAllTenants()
  const updateTenant = useAdminUpdateTenant()

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('tenants') // 'tenants' | 'users'
  const [activeTab, setActiveTab] = useState('Semua')
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // New States for User View
  const [selectedUser, setSelectedUser] = useState(null)
  const [isUserSheetOpen, setIsUserSheetOpen] = useState(false)

  const { data: allUsers, isLoading: isUsersLoading } = useAllUsers()

  // Stats calculation
  const stats = useMemo(() => {
    if (!tenants) return { totalTenants: 0, totalUsers: 0, activePro: 0, activeBusiness: 0 }

    return tenants.reduce((acc, t) => {
      acc.totalTenants += 1
      acc.totalUsers += t.profiles?.length || 0
      if (t.is_active) {
        if (t.plan === 'pro') acc.activePro += 1
        if (t.plan === 'business') acc.activeBusiness += 1
      }
      return acc
    }, { totalTenants: 0, totalUsers: 0, activePro: 0, activeBusiness: 0 })
  }, [tenants])

  // Filtering logic
  const filteredTenants = useMemo(() => {
    if (!tenants) return []

    const filtered = tenants.filter(t => {
      const ownerName = t.profiles?.find(p => p.role === 'owner')?.full_name || ''
      const matchesSearch = (t.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        ownerName.toLowerCase().includes(searchQuery.toLowerCase())

      const isTrial = t.trial_ends_at && new Date(t.trial_ends_at) > new Date()

      let matchesTab = true
      if (activeTab === 'Starter') matchesTab = t.plan === 'starter'
      else if (activeTab === 'Pro') matchesTab = t.plan === 'pro'
      else if (activeTab === 'Business') matchesTab = t.plan === 'business'
      else if (activeTab === 'Trial') matchesTab = isTrial

      return matchesSearch && matchesTab
    })

    // Sort alphabetically by Business Name
    return filtered.sort((a, b) => {
      const nameA = (a.business_name || '').toLowerCase()
      const nameB = (b.business_name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }, [tenants, searchQuery, activeTab])

  const groupedUsers = useMemo(() => {
    if (!allUsers) return []

    const groups = {}
    allUsers.forEach(u => {
      const key = u.auth_user_id || u.full_name // Fallback to name if ID missing
      if (!groups[key]) {
        groups[key] = {
          name: u.full_name,
          id: key,
          avatar: u.avatar_url,
          profiles: [],
          last_active: u.last_seen_at,
          created_at: u.created_at
        }
      }
      groups[key].profiles.push(u)

      // Keep track of most recent activity
      if (u.last_seen_at && (!groups[key].last_active || new Date(u.last_seen_at) > new Date(groups[key].last_active))) {
        groups[key].last_active = u.last_seen_at
      }
    })

    return Object.values(groups).filter(user => {
      const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.profiles.some(p => (p.tenants?.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesSearch
    })
  }, [allUsers, searchQuery])

  const handleOpenDetail = (tenant) => {
    setSelectedTenant(tenant)
    setIsSheetOpen(true)
  }

  const handleUpdateStatus = (tenantId, isActive) => {
    updateTenant.mutate({ tenantId, updates: { is_active: isActive } })
  }

  const handleExtendTrial = (tenant) => {
    const currentEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : new Date()
    const newEnd = new Date(currentEnd.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
    updateTenant.mutate({ tenantId: tenant.id, updates: { trial_ends_at: newEnd } })
  }

  if (isLoading) {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 bg-[#080C10]/80 backdrop-blur-md py-2 -mx-2 px-2 rounded-xl">
        <div>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            Users & Tenant Management
          </h1>
          <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest mt-1">
            Kelola akses dan paket langganan seluruh bisnis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase px-3 py-1">
            {stats.totalTenants} Tenants
          </Badge>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tenant" value={stats.totalTenants} icon={Building2} color="emerald" />
        <StatCard label="Total User" value={stats.totalUsers} icon={Users} color="blue" />
        <StatCard label="Active Pro" value={stats.activePro} icon={Shield} color="amber" />
        <StatCard label="Active Business" value={stats.activeBusiness} icon={Sparkles} color="purple" />
      </div>

      {/* View Switcher, Filter & Search */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-[#111C24] p-4 rounded-2xl border border-white/8">
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-full md:w-auto">
            <TabsList className="bg-[#0A0F14] border border-white/5 p-1 h-12 rounded-2xl shadow-inner shadow-black/50">
              <TabsTrigger
                value="tenants"
                className="rounded-xl px-6 text-[11px] font-black uppercase tracking-[0.15em] data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/20 transition-all duration-300"
              >
                <Building2 size={13} className="mr-2" />
                Daftar Tenant
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="rounded-xl px-6 text-[11px] font-black uppercase tracking-[0.15em] data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20 transition-all duration-300"
              >
                <Users size={13} className="mr-2" />
                Daftar User
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {viewMode === 'tenants' && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="bg-white/[0.03] border border-white/5 p-1 h-10 rounded-xl space-x-1">
                {['Semua', 'Starter', 'Pro', 'Business', 'Trial'].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="rounded-lg px-3 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-white/10 data-[state=active]:text-emerald-400 transition-all"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B6478]" size={16} />
          <Input
            id="search-user-tenant"
            name="search-user-tenant"
            aria-label="Cari nama bisnis atau user"
            placeholder={viewMode === 'tenants' ? "Cari nama bisnis..." : "Cari user atau bisnis..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-black/20 border-white/10 h-11 rounded-xl pl-11 text-sm focus:border-emerald-500/50 transition-all font-medium text-white"
          />
        </div>
      </div>

      {viewMode === 'tenants' ? (
        <div className="bg-[#0C1319] rounded-2xl border border-white/8 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black">Bisnis</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center">Plan</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center">Sisa Waktu</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center">Users</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black">Daftar</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center">Status</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                          {renderVerticalIcon(t.business_vertical)}
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-white leading-tight mb-1">{t.business_name || '(Tanpa Nama)'}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-bold text-[#4B6478] uppercase tracking-[0.2em] border border-white/5 px-1.5 py-0.5 rounded bg-white/[0.02]">
                              {(t.business_vertical || '').replace('_', ' ') || '-'}
                            </span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/5">
                              <User size={10} className="text-[#4B6478]" />
                              <span className="text-[10px] font-medium text-slate-400">
                                {t.profiles?.find(p => p.role === 'owner')?.full_name || 'Belum ada owner'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <PlanBadge plan={t.plan} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <TrialDisplay date={t.trial_ends_at} plan={t.plan} planExpiresAt={t.plan_expires_at} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[13px] font-bold text-white">{t.profiles?.length || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[12px] text-white font-medium">
                        {t.created_at ? format(new Date(t.created_at), 'dd MMM yyyy') : '-'}
                      </p>
                      <p className="text-[10px] text-[#4B6478] font-medium mt-0.5">
                        {t.created_at ? format(new Date(t.created_at), 'HH:mm') : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          id={`status-toggle-${t.id}`}
                          name={`status-toggle-${t.id}`}
                          aria-label={`Ubah status aktif untuk bisnis ${t.business_name || 'Tanpa Nama'}`}
                          checked={t.is_active}
                          onCheckedChange={(val) => handleUpdateStatus(t.id, val)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetail(t)}
                        className="h-8 rounded-lg border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider px-3"
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <Search size={32} />
                        <p className="text-sm font-bold uppercase tracking-widest">Tidak ada tenant ditemukan</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#0C1319] rounded-2xl border border-white/8 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black">User</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black">Role</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black">Bisnis / Tenant</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-center">Aktif</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black">Bergabung</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-widest text-[#4B6478] font-display font-black text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isUsersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-6 bg-white/[0.01]" />
                    </tr>
                  ))
                ) : groupedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <Users size={32} />
                        <p className="text-sm font-bold uppercase tracking-widest">Tidak ada user ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  groupedUsers.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer ${i % 2 === 1 ? 'bg-white/[0.01]' : ''}`}
                      onClick={() => {
                        setSelectedUser(u)
                        setIsUserSheetOpen(true)
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-11 w-11 border border-white/10 ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all shadow-xl">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback className="bg-[#1C2C38] text-blue-400 text-[12px] font-black uppercase">
                              {u.name?.substring(0, 2) || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-[15px] font-black text-white leading-tight tracking-tight">{u.name || '(Tanpa Nama)'}</p>
                            <p className="text-[9px] font-bold text-[#4B6478] uppercase mt-1.5 tracking-[0.2em] opacity-80">
                              UID: {u.id.substring(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from(new Set(u.profiles.map(p => p.user_type === 'superadmin' ? 'superadmin' : p.role))).map(role => (
                            <RoleBadge key={role} role={role} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 mr-2">
                            {u.profiles.slice(0, 3).map((p, idx) => (
                              <div key={idx} className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-white/20 flex items-center justify-center text-[10px] text-emerald-400">
                                {renderVerticalIcon(p.tenants?.business_vertical, 12)}
                              </div>
                            ))}
                            {u.profiles.length > 3 && (
                              <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[9px] text-[#4B6478] font-bold">
                                +{u.profiles.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-[12px] font-bold text-slate-300">
                            Terdaftar di {u.profiles.length} Bisnis
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full mb-1 ${u.last_active && new Date(u.last_active) > new Date(Date.now() - 5 * 60 * 1000) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`} />
                          <span className="text-[10px] font-medium text-[#4B6478]">
                            {u.last_active ? formatDistanceToNow(new Date(u.last_active), { addSuffix: true, locale: localeId }) : 'Baru'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[12px] text-white font-medium">
                          {u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy') : '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-[#4B6478] hover:text-white hover:bg-white/10"
                        >
                          <ArrowRight size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Associations Sheet */}
      <Sheet open={isUserSheetOpen} onOpenChange={setIsUserSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[480px] bg-[#0C1319] border-l border-white/8 p-0 overflow-hidden flex flex-col">
          <AnimatePresence>
            {selectedUser && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="flex flex-col h-full"
              >
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border border-white/10 ring-4 ring-emerald-500/10">
                      <AvatarImage src={selectedUser.avatar} />
                      <AvatarFallback className="bg-emerald-500/10 text-emerald-400 text-xl font-black">
                        {selectedUser.name?.substring(0, 2) || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle className="text-xl font-black text-white uppercase tracking-tight">
                        {selectedUser.name || 'User Tanpa Nama'}
                      </SheetTitle>
                      <SheetDescription className="text-[11px] font-bold text-[#4B6478] uppercase mt-1 tracking-[0.15em]">
                        User ID: {selectedUser.id}
                      </SheetDescription>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <section className="space-y-4">
                    <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] flex items-center justify-between">
                      BISNIS TERKAIT
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black">{selectedUser.profiles.length}</Badge>
                    </h3>

                    <div className="space-y-3">
                      {selectedUser.profiles.map((p, idx) => (
                        <div
                          key={idx}
                          className="group relative bg-white/[0.03] p-4 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer"
                          onClick={() => {
                            const fullTenant = tenants.find(t => t.id === p.tenant_id)
                            if (fullTenant) {
                              handleOpenDetail(fullTenant)
                              setIsUserSheetOpen(false)
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                                {renderVerticalIcon(p.tenants?.business_vertical)}
                              </div>
                              <div>
                                <p className="text-[13px] font-bold text-white group-hover:text-emerald-400 transition-colors">
                                  {p.tenants?.business_name || 'Tanpa Nama'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <RoleBadge role={p.user_type === 'superadmin' ? 'superadmin' : p.role} />
                                  <span className="text-[10px] font-bold text-[#4B6478] uppercase">
                                    {(p.tenants?.business_vertical || '').replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ArrowRight size={14} className="text-[#4B6478] group-hover:text-white transition-all transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]">INFORMASI AKUN</h3>
                    <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-[#4B6478] font-bold">Terdaftar Sejak</span>
                        <span className="text-white font-bold">{format(new Date(selectedUser.created_at), 'dd MMMM yyyy', { locale: localeId })}</span>
                      </div>
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-[#4B6478] font-bold">Aktivitas Terakhir</span>
                        <span className="text-white font-bold">
                          {selectedUser.last_active ? formatDistanceToNow(new Date(selectedUser.last_active), { addSuffix: true, locale: localeId }) : 'Belum ada'}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                  <Button
                    variant="ghost"
                    className="w-full text-[#4B6478] hover:text-white"
                    onClick={() => setIsUserSheetOpen(false)}
                  >
                    Tutup
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:w-[480px] bg-[#0C1319] border-l border-white/8 p-0 overflow-hidden flex flex-col">
          <AnimatePresence>
            {selectedTenant && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="flex flex-col h-full"
              >
                {/* Sheet Header */}
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/5">
                      {renderVerticalIcon(selectedTenant.business_vertical, 24)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <SheetTitle className="text-xl font-black text-white uppercase tracking-tight">
                          {selectedTenant.business_name || '(Tanpa Nama)'}
                        </SheetTitle>
                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          {(selectedTenant.business_vertical || '').replace('_', ' ') || '-'}
                        </Badge>
                      </div>
                      <SheetDescription className="text-[11px] font-bold text-[#4B6478] uppercase mt-1 tracking-widest">
                        Tenant ID: {selectedTenant.id}
                      </SheetDescription>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Basic Info & Controls */}
                  <section className="space-y-4">
                    <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]">PENGATURAN TENANT</h3>

                    <div className="space-y-4 bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                      {/* Edit Business Name */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest ml-1">Nama Bisnis</label>
                        <div className="flex gap-2">
                          <Input
                            value={selectedTenant.business_name}
                            onChange={(e) => setSelectedTenant({ ...selectedTenant, business_name: e.target.value })}
                            onBlur={() => {
                              if ((selectedTenant.business_name || '').length < 3) {
                                toast.error('Nama bisnis terlalu pendek')
                                return
                              }
                              updateTenant.mutate({ tenantId: selectedTenant.id, updates: { business_name: selectedTenant.business_name } })
                            }}
                            className="bg-black/40 border-white/10 h-11 rounded-xl text-sm font-bold focus:border-emerald-500/50"
                          />
                        </div>
                      </div>

                      {/* Plan Dropdown */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Paket Langganan</label>
                        <Select
                          value={selectedTenant.plan}
                          onValueChange={(val) => {
                            const kandangLimit = val === 'starter' ? 1 : val === 'pro' ? 2 : 99
                            updateTenant.mutate({
                              tenantId: selectedTenant.id,
                              updates: { plan: val, kandang_limit: kandangLimit }
                            })
                            setSelectedTenant({ ...selectedTenant, plan: val })
                          }}
                        >
                          <SelectTrigger className="bg-black/40 border-white/10 h-10 rounded-xl text-sm">
                            <SelectValue placeholder="Pilih paket" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111C24] border-white/10 text-white">
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Toggle */}
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <p className="text-sm font-bold text-white">Status Bisnis</p>
                          <p className="text-[11px] text-[#4B6478] font-bold uppercase mt-0.5">Aktif / Nonaktifkan akses</p>
                        </div>
                        <Switch
                          checked={selectedTenant.is_active}
                          onCheckedChange={(val) => {
                            setSelectedTenant({ ...selectedTenant, is_active: val })
                            handleUpdateStatus(selectedTenant.id, val)
                          }}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Subscription Info */}
                  <section className="space-y-4">
                    <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]">STATUS LANGGANAN</h3>

                    {/* Trial (hanya untuk starter) */}
                    {selectedTenant.plan === 'starter' && (
                      <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Clock size={18} className="text-amber-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider mb-1">Trial Berakhir</p>
                            <p className="text-[13px] font-bold text-white">
                              {selectedTenant.trial_ends_at ? format(new Date(selectedTenant.trial_ends_at), 'dd MMMM yyyy', { locale: localeId }) : 'Belum Dimulai'}
                            </p>
                            <p className="text-[10px] font-bold uppercase mt-0.5 tracking-wider" style={{ color: selectedTenant.trial_ends_at && new Date(selectedTenant.trial_ends_at) > new Date() ? '#F59E0B' : '#F87171' }}>
                              {selectedTenant.trial_ends_at && new Date(selectedTenant.trial_ends_at) > new Date() ? 'Masih Aktif' : 'Expired'}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleExtendTrial(selectedTenant)}
                          className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest px-4 h-9 shadow-lg shadow-amber-500/20"
                        >
                          Extend 14 Hari
                        </Button>
                      </div>
                    )}

                    {/* Plan berbayar */}
                    {(selectedTenant.plan === 'pro' || selectedTenant.plan === 'business') && (
                      <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: selectedTenant.plan === 'pro' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${selectedTenant.plan === 'pro' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                            <Clock size={18} style={{ color: selectedTenant.plan === 'pro' ? '#10B981' : '#F59E0B' }} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider mb-1">
                              {selectedTenant.plan === 'pro' ? 'Pro' : 'Business'} Berakhir
                            </p>
                            <p className="text-[13px] font-bold text-white">
                              {selectedTenant.plan_expires_at ? format(new Date(selectedTenant.plan_expires_at), 'dd MMMM yyyy', { locale: localeId }) : '—'}
                            </p>
                            <p className="text-[10px] font-bold uppercase mt-0.5 tracking-wider" style={{ color: selectedTenant.plan_expires_at && new Date(selectedTenant.plan_expires_at) > new Date() ? '#10B981' : '#F87171' }}>
                              {selectedTenant.plan_expires_at && new Date(selectedTenant.plan_expires_at) > new Date() ? 'Aktif' : 'Expired — Perlu Renewal'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Members List */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]">ANGGOTA TIM ({selectedTenant.profiles?.length || 0})</h3>
                    </div>
                    <div className="space-y-3">
                      {selectedTenant.profiles?.map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                          <Avatar className="h-9 w-9 border border-white/10">
                            <AvatarFallback className="bg-emerald-500/10 text-emerald-400 text-[11px] font-black uppercase">
                              {p.full_name?.substring(0, 2) || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] font-bold text-white truncate">{p.full_name || '-'}</p>
                              <RoleBadge role={p.user_type === 'superadmin' ? 'superadmin' : p.role} />
                            </div>
                            <p className="text-[10px] text-[#4B6478] font-bold uppercase mt-0.5 tracking-tighter">
                              Aktif {p.last_seen_at ? formatDistanceToNow(new Date(p.last_seen_at), { addSuffix: true, locale: localeId }) : 'Baru-baru ini'}
                            </p>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${p.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]' : 'bg-gray-600'}`} />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Footer / Info Zone */}
                <div className="p-6 border-t border-white/5 bg-white/[0.02] flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl border-white/10 text-white hover:bg-white/5 transition-all text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                    onClick={() => {
                      navigate(`/admin/activity?tenantId=${selectedTenant.id}`)
                      setIsSheetOpen(false)
                    }}
                  >
                    <Activity size={16} />
                    Lihat Log Aktivitas
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[12px] font-bold uppercase tracking-widest"
                    onClick={() => {
                      if (confirm(`Apakah Anda yakin ingin menonaktifkan tenant "${selectedTenant.business_name}"?`)) {
                        handleUpdateStatus(selectedTenant.id, false)
                        setIsSheetOpen(false)
                      }
                    }}
                  >
                    Nonaktifkan Tenant
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}

// --- Sub-Components ---

function StatCard({ label, value, icon: Icon, color }) {
  const themes = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-blue-500/5",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-500/5",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-purple-500/5"
  }

  return (
    <Card className={`bg-[#111C24] border-white/8 rounded-2xl p-4 lg:p-5 relative overflow-hidden group hover:border-white/15 transition-all shadow-lg ${themes[color]}`}>
      <div className="absolute -right-2 -bottom-2 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
        <Icon size={70} />
      </div>
      <div className="relative z-10 space-y-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${themes[color]}`}>
          <Icon size={16} />
        </div>
        <div>
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1">{label}</p>
          <p className="font-display text-2xl lg:text-3xl font-black text-white leading-none">{value}</p>
        </div>
      </div>
    </Card>
  )
}

function PlanBadge({ plan }) {
  const styles = {
    starter: "bg-white/[0.03] text-slate-400 border-white/10",
    pro: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    business: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  }

  return (
    <Badge className={`px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${styles[plan] || styles.starter}`}>
      {plan}
    </Badge>
  )
}

function RoleBadge({ role }) {
  const styles = {
    superadmin: "bg-white/10 text-white border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]",
    owner: "bg-emerald-500/5 text-emerald-400/80 border-emerald-500/10",
    staff: "bg-blue-500/5 text-blue-400/80 border-blue-500/10",
    view_only: "bg-white/5 text-slate-400 border-white/10",
    sopir: "bg-amber-500/5 text-amber-400/80 border-amber-500/10"
  }

  return (
    <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md border leading-none ${styles[role] || styles.view_only}`}>
      {(role || '').replace('_', ' ') || '-'}
    </span>
  )
}

function TrialDisplay({ date, plan, planExpiresAt }) {
  const now = new Date()

  // Paid plan — tampilkan sisa waktu dari plan_expires_at
  if (plan === 'pro' || plan === 'business') {
    if (!planExpiresAt) return <span className="text-[#4B6478] text-[13px]">—</span>
    const end = new Date(planExpiresAt)
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    if (days <= 0) return (
      <div className="flex flex-col items-center">
        <span className="text-[13px] font-black text-red-400">Expired</span>
        <span className="text-[8px] text-red-400/60 font-bold uppercase tracking-tighter mt-0.5">Perlu Renewal</span>
      </div>
    )
    return (
      <div className="flex flex-col items-center">
        <span className={`text-[13px] font-black ${days <= 14 ? 'text-amber-400' : 'text-emerald-400'}`}>{days} Hari</span>
        <span className="text-[8px] text-[#4B6478] font-bold uppercase tracking-tighter mt-0.5">
          {plan === 'pro' ? 'Sisa Pro' : 'Sisa Business'}
        </span>
      </div>
    )
  }

  // Starter / trial
  if (!date) return <span className="text-[#4B6478] text-[13px]">—</span>
  const end = new Date(date)
  const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  if (days <= 0) return <span className="text-[#4B6478] text-[13px]">—</span>
  return (
    <div className="flex flex-col items-center">
      <span className={`text-[13px] font-black ${days <= 3 ? 'text-red-400' : 'text-amber-400'}`}>{days} Hari</span>
      <span className="text-[8px] text-[#4B6478] font-bold uppercase tracking-tighter mt-0.5">Sisa Trial</span>
    </div>
  )
}

function renderVerticalIcon(v, size = 18) {
  switch (v) {
    case 'poultry_broker': return <Bird size={size} />
    case 'egg_broker': return <Egg size={size} />
    case 'peternak': return <Home size={size} />
    case 'rpa': return <Factory size={size} />
    default: return <Building2 size={size} />
  }
}
