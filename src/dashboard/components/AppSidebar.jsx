import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  ArrowLeftRight,
  Building2,
  Warehouse,
  Truck,
  Wallet,
  Car,
  BarChart2,
  Calculator,
  ChevronsUpDown,
  ChevronDown,
  User,
  Users,
  LogOut,
  Bell,
  Check,
  Plus,
  Lock,
  Sparkles,
  Shield,
  ShoppingCart,
  Package,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from '../../lib/hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePeternakFarms } from '../../lib/hooks/usePeternakData'
import { useTheme } from '../../lib/hooks/useTheme'

export default function AppSidebar() {
  const { user, profile, profiles, tenant, switchTenant } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isAddingBusiness, setIsAddingBusiness] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [expandedFarms, setExpandedFarms] = useState({})
  const userDropdownRef = useRef(null)

  // Farms for peternak multi-kandang sidebar
  const { data: peternakFarms = [] } = usePeternakFarms()

  const toggleFarm = (farmId) =>
    setExpandedFarms(prev => ({ ...prev, [farmId]: !prev[farmId] }))

  // Auto-expand the farm section matching the current URL
  useEffect(() => {
    const match = location.pathname.match(/^\/peternak\/kandang\/([^/]+)/)
    if (match) {
      const activeFarmId = match[1]
      setExpandedFarms(prev => prev[activeFarmId] ? prev : { ...prev, [activeFarmId]: true })
    }
  }, [location.pathname])

  const hasActiveTrial = profiles?.some(p => {
    const t = p.tenants
    return t?.plan === 'starter' && t?.is_active && new Date(t?.trial_ends_at) > new Date()
  })
  const hasPaidPlan = profiles?.some(p => ['pro', 'business'].includes(p.tenants?.plan))
  const canAddBusiness = !hasActiveTrial || hasPaidPlan

  const [activeProfileId, setActiveProfileId] = useState(null)

  useEffect(() => {
    if (profile && !activeProfileId) {
      setActiveProfileId(profile.id)
    }
  }, [profile])

  useEffect(() => {
    async function fetchProfiles() {
      if (!user?.id) return
      const { data, error } = await supabase
        .from('profiles')
        .select('*, tenants(*)')
        .eq('auth_user_id', user.id)
      
      if (!error && data) {
        // setProfiles(data) // This line is no longer needed as profiles come from useAuth
      }
    }
    fetchProfiles()
  }, [user?.id])

  // const profile = profiles.find(p => p.id === activeProfileId) || authProfile
  // const tenant = profile?.tenants || authTenant

  const tenantInitials = tenant?.business_name?.slice(0, 2).toUpperCase() || 'TO'
  const userInitials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const isOwner = profile?.role === 'owner' || profile?.role === 'superadmin'
  const isStaff = profile?.role === 'staff'
  const isViewOnly = profile?.role === 'view_only'

  const { accentColor } = useTheme()

  const vertical = tenant?.business_vertical || 'poultry_broker'
  const isPoultry  = vertical === 'poultry_broker'
  const isEgg      = vertical === 'egg_broker'
  const isPeternak = vertical === 'peternak'
  const isRPA      = vertical === 'rpa'
  const isSembako  = vertical === 'sembako_broker'

  const getBerandaPath = (v) => {
    switch (v) {
      case 'poultry_broker': return '/broker/poultry_broker/beranda'
      case 'egg_broker':     return '/egg/beranda'
      case 'peternak':       return '/peternak/beranda'
      case 'rpa':            return '/rpa-buyer/beranda'
      case 'sembako_broker': return '/broker/sembako/beranda'
      default:               return '/broker/poultry_broker/beranda'
    }
  }

  const getAkunPath = (v) => {
    switch (v) {
      case 'peternak':       return '/peternak/akun'
      case 'rpa':            return '/rpa-buyer/akun'
      case 'sembako_broker': return '/broker/sembako/akun'
      default:               return '/broker/akun'
    }
  }

  const berandaPath = getBerandaPath(vertical)
  const akunPath    = getAkunPath(vertical)

  const isSuperadmin = (profile?.role === 'superadmin' || profile?.user_type === 'superadmin') && 
                      user?.email === 'fahruhernansakti@gmail.com'

  const getVerticalInfo = (v) => {
    switch (v) {
      case 'poultry_broker': return { icon: '🐔', label: 'Broker Ayam' }
      case 'egg_broker':     return { icon: '🥚', label: 'Broker Telur' }
      case 'peternak':       return { icon: '🏠', label: 'Peternak' }
      case 'rpa':            return { icon: '🏭', label: 'RPA' }
      case 'sembako_broker': return { icon: '🛒', label: 'Distributor Sembako' }
      default:               return { icon: '🏢', label: 'Bisnis' }
    }
  }

  const activeVerticalInfo = getVerticalInfo(vertical)

  const handleGoToAdmin = () => {
    const adminProfile = profiles?.find(p => p.role === 'superadmin' || p.user_type === 'superadmin')
    if (adminProfile) {
      switchTenant(adminProfile.tenant_id)
      navigate('/admin')
    }
  }

  const navMain = [
    // ── UTAMA ──────────────────────────────────────────────
    {
      label: 'UTAMA',
      items: [
        { title: 'Beranda', url: berandaPath, icon: Home },

        // Broker Ayam
        ...(isPoultry ? [
          { title: 'Transaksi',     url: '/broker/transaksi', icon: ArrowLeftRight },
          { title: 'RPA & Piutang', url: '/broker/rpa',       icon: Building2, roles: ['owner', 'staff'] },
          { title: 'Kandang',       url: '/broker/kandang',   icon: Warehouse,  roles: ['owner', 'staff'] },
          { title: 'Tim & Akses',   url: '/broker/tim',       icon: Users,      roles: ['owner'] },
        ] : []),

        // Broker Telur
        ...(isEgg ? [
          { title: 'POS / Jual',        url: '/egg/pos',        icon: ArrowLeftRight },
          { title: 'Inventori & HPP',   url: '/egg/inventori',  icon: Warehouse,  roles: ['owner', 'staff'] },
          { title: 'Supplier Telur',    url: '/egg/suppliers',  icon: Building2,  roles: ['owner', 'staff'] },
          { title: 'Pelanggan Telur',   url: '/egg/customers',  icon: User,       roles: ['owner', 'staff'] },
          { title: 'Riwayat Transaksi', url: '/egg/transaksi',  icon: BarChart2,  roles: ['owner', 'staff'] },
        ] : []),

        // Peternak — global links (farm-specific sections rendered separately below)
        ...(isPeternak ? [
          { title: 'Riwayat Siklus', url: '/peternak/siklus',   icon: BarChart2  },
          { title: 'Stok Pakan',     url: '/peternak/pakan',    icon: Warehouse  },
          { title: 'Laporan',        url: '/peternak/laporan',  icon: BarChart2  },
        ] : []),

        // RPA
        ...(isRPA ? [
          { title: 'Order',      url: '/rpa-buyer/order',      icon: ArrowLeftRight },
          { title: 'Hutang',     url: '/rpa-buyer/hutang',     icon: Wallet },
          { title: 'Distribusi', url: '/rpa-buyer/distribusi', icon: Truck },
          { title: 'Laporan',    url: '/rpa-buyer/laporan',    icon: BarChart2, roles: ['owner'] },
        ] : []),

        // Sembako Broker
        ...(isSembako ? [
          { title: 'Penjualan', url: '/broker/sembako/penjualan', icon: ShoppingCart },
          { title: 'Gudang',    url: '/broker/sembako/gudang',    icon: Warehouse },
          { title: 'Produk',    url: '/broker/sembako/produk',    icon: Package,   roles: ['owner', 'staff'] },
          { title: 'Pegawai',   url: '/broker/sembako/pegawai',   icon: Users,     roles: ['owner'] },
        ] : []),
      ]
    },

    // ── OPERASIONAL — Sembako ───────────────────────────────
    ...(isSembako ? [{
      label: 'LAPORAN & AKUN',
      items: [
        { title: 'Laporan',      url: '/broker/sembako/laporan', icon: BarChart2, roles: ['owner'] },
        { title: 'Akun & Profil', url: '/broker/sembako/akun',   icon: User },
      ]
    }] : []),

    // ── OPERASIONAL (broker only) ───────────────────────────
    ...(isPoultry ? [{
      label: 'OPERASIONAL',
      items: [
        { title: 'Pengiriman', url: '/broker/pengiriman', icon: Truck,       roles: ['owner', 'staff'] },
        { title: 'Cash Flow',  url: '/broker/cashflow',  icon: Wallet,      roles: ['owner'] },
        { title: 'Armada',     url: '/broker/armada',    icon: Car,         roles: ['owner'] },
        { title: 'Simulator',  url: '/broker/simulator', icon: Calculator,  roles: ['owner'] },
      ]
    }] : []),

    ...(isEgg ? [{
      label: 'OPERASIONAL',
      items: [
        { title: 'Cash Flow', url: '/broker/cashflow', icon: Wallet, roles: ['owner'] },
      ]
    }] : []),

    // ── SHARED (semua vertical) ─────────────────────────────
    {
      label: 'LAINNYA',
      items: [
        { title: 'Harga Pasar',     url: '/harga-pasar', icon: BarChart2 },
        { title: 'TernakOS Market', url: '/market',      icon: Building2 },
      ]
    },
  ]

  const filteredNavMain = navMain.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.roles) return true // default accessible to all roles
      return item.roles.includes(profile?.role) || profile?.role === 'superadmin'
    })
  })).filter(group => group.items.length > 0)

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(e) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) toast.error(error.message)
    else {
      toast.success('Logged out successfully')
      navigate('/login')
    }
  }

  // Calculate Trial Status (Ignore for Superadmin)
  const trialEndsAt = tenant?.trial_ends_at
  const isTrialActive = !isSuperadmin && (trialEndsAt 
    ? new Date(trialEndsAt) > new Date() 
    : false)
  const daysLeft = !isSuperadmin && trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))) 
    : 0

  return (
    <Sidebar collapsible="offcanvas" style={{ background: '#090E14' }}>
      <SidebarHeader style={{padding: '16px 16px 8px'}}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-1 py-2 cursor-pointer" onClick={() => navigate(berandaPath)}>
          <img src="/logo.png" alt="TernakOS Icon" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
          <div className="">
            <p className="font-display font-extrabold text-[15px] text-foreground leading-none">
              TernakOS
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {activeVerticalInfo.label}
            </p>
          </div>
        </div>
        
        {/* Tenant selector */}
        <SidebarMenu className="mt-2">
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="bg-secondary border border-border rounded-xl group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent hover:bg-white/[0.03] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-base flex-shrink-0 border border-emerald-500/20">
                    {activeVerticalInfo.icon}
                  </div>
                  <div className="flex-1 overflow-hidden text-left ml-2.5">
                    <p className="text-[13px] font-bold truncate leading-tight text-foreground">
                      {tenant?.business_name || 'My Business'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium tracking-wide">
                      {activeVerticalInfo.label}
                    </p>
                  </div>
                  <ChevronsUpDown size={14} className="text-muted-foreground ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                align="start"
                className="w-64 bg-[#0C1319] border border-border rounded-xl p-1.5 shadow-2xl"
              >
                <div className="px-2 py-1.5 mb-1">
                  <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Bisnis Anda
                  </p>
                </div>
                <ScrollArea className={`${profiles.length > 3 ? 'h-64' : 'h-auto'} pr-2`}>
                  {profiles.map((p) => {
                    const isActive = p.tenant_id === tenant?.id
                    return (
                      <DropdownMenuItem
                        key={p.id}
                        onClick={() => {
                          const targetVertical = p.tenants?.business_vertical
                          const targetPath = getBerandaPath(targetVertical)
                          
                          // 1. Switch tenant state
                          switchTenant(p.tenant_id)
                          
                          // 2. Clear all cache to prevent stale queries with new tenant ID
                          queryClient.clear()
                          
                          // 3. Navigate to the correct vertical dashboard
                          navigate(targetPath)
                        }}
                        className={`gap-3 rounded-lg p-2 cursor-pointer transition-colors focus:bg-accent focus:text-foreground mb-1 ${
                          isActive ? 'text-emerald-400 bg-emerald-500/10' : 'hover:bg-accent text-foreground'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 transition-colors ${
                          isActive ? 'bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-white/5'
                        }`}>
                          {getVerticalInfo(p.tenants?.business_vertical).icon}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-[13px] truncate leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                            {p.tenants?.business_name || 'My Business'}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {getVerticalInfo(p.tenants?.business_vertical).label}
                          </p>
                        </div>
                        {isActive && <Check size={14} className="text-emerald-400 flex-shrink-0" />}
                      </DropdownMenuItem>
                    )
                  })}
                </ScrollArea>

                <DropdownMenuSeparator className="my-1.5 bg-border" />
                
                <Sheet open={isAddingBusiness} onOpenChange={setIsAddingBusiness}>
                  <SheetTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        if (canAddBusiness) setIsAddingBusiness(true)
                      }}
                      className={`gap-3 rounded-lg p-2 text-muted-foreground transition-colors ${canAddBusiness ? 'cursor-pointer hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground' : 'opacity-50 cursor-not-allowed'}`}
                      title={!canAddBusiness ? 'Upgrade ke PRO untuk tambah bisnis' : undefined}
                    >
                      <div className="w-6 h-6 rounded flex items-center justify-center bg-white/5 flex-shrink-0">
                        {canAddBusiness ? <Plus size={14} /> : <Lock size={14} />}
                      </div>
                      <span className="text-[13px] font-medium flex-1">Tambah Bisnis Baru</span>
                      {!canAddBusiness && (
                        <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">PRO</span>
                      )}
                    </DropdownMenuItem>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-[#090E14] border-border text-foreground w-[400px]">
                    <SheetHeader>
                      <SheetTitle className="font-display font-bold text-xl text-foreground">Multi-Tenant</SheetTitle>
                      <SheetDescription className="text-muted-foreground">
                        Kelola banyak bisnis dalam satu akun TernakOS.
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="py-8">
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-400">
                          <Building2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Setup Bisnis Baru</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Anda akan memulai proses onboarding untuk binis baru. Setiap bisnis memiliki data, tim, dan penagihan yang terpisah sepenuhnya.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <Check size={18} className="text-emerald-400 mt-1" />
                          <div>
                            <p className="text-sm font-semibold">Data Terisolasi</p>
                            <p className="text-xs text-muted-foreground">Data stok, transaksi, dan pelanggan tidak akan bercampur.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <Check size={18} className="text-emerald-400 mt-1" />
                          <div>
                            <p className="text-sm font-semibold">Akses Terpisah</p>
                            <p className="text-xs text-muted-foreground">Anda bisa mengundang tim yang berbeda untuk tiap bisnis.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3">
                      {canAddBusiness ? (
                        <button
                          onClick={() => {
                            setIsAddingBusiness(false)
                            navigate('/onboarding?mode=new_business')
                          }}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                        >
                          Mulai Setup Bisnis Baru
                        </button>
                      ) : (
                        <button
                          onClick={() => { setIsAddingBusiness(false); navigate(akunPath) }}
                          className="w-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 text-amber-400 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                          <Lock size={16} /> Upgrade ke PRO
                        </button>
                      )}
                      <button 
                        onClick={() => setIsAddingBusiness(false)}
                        className="w-full bg-white/5 hover:bg-white/10 text-muted-foreground font-semibold py-4 rounded-2xl transition-all"
                      >
                        Batal
                      </button>
                    </div>
                  </SheetContent>
                </Sheet>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {filteredNavMain.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground px-2 mb-1 ">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url
                  const isLocked = (item.locked || !isTrialActive) && !isSuperadmin
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild={!isLocked}
                        isActive={isActive}
                        tooltip={isLocked ? `${item.title} (Segera Hadir)` : item.title}
                        className={`rounded-xl mb-0.5 transition-all duration-200 ${
                          isLocked
                            ? 'opacity-40 cursor-not-allowed'
                            : isActive 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'hover:bg-white/[0.03] text-foreground'
                        }`}
                        style={isActive && !isLocked ? { border: '1px solid rgba(16,185,129,0.20)' } : {}}
                      >
                        {isLocked ? (
                          <div className="flex items-center gap-3 w-full px-2 py-1.5">
                            <item.icon
                              size={18}
                              className="text-muted-foreground"
                              strokeWidth={2}
                            />
                            <span className="font-body text-[14px] flex-1 font-medium text-muted-foreground">
                              {item.title}
                            </span>
                            <Lock size={12} className="text-muted-foreground" />
                          </div>
                        ) : (
                          <NavLink to={item.url} className="flex items-center gap-3 w-full">
                            <item.icon
                              size={18}
                              className={isActive ? 'text-emerald-400' : 'text-muted-foreground'}
                              strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={`font-body text-[14px] flex-1  ${isActive ? 'font-semibold text-emerald-400' : 'font-medium'}`}>
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className="text-[9px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/25 rounded-[4px] px-1.5 py-0.5  animate-pulse">
                                {item.badge}
                              </span>
                            )}
                          </NavLink>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* ── Peternak: per-farm collapsible sections ── */}
        {isPeternak && peternakFarms.length > 0 && (
          <>
            <SidebarSeparator className="my-1" />
            {peternakFarms.map((farm) => {
              const isOpen    = expandedFarms[farm.id] ?? false
              const farmBase  = `/peternak/kandang/${farm.id}`
              const isOnFarm  = location.pathname.startsWith(farmBase)
              const LIVESTOCK = { ayam_broiler: '🐔', ayam_petelur: '🥚', domba: '🐑', kambing: '🐐', sapi: '🐄' }
              const emoji     = LIVESTOCK[farm.livestock_type] ?? '🏚'

              const farmColor = accentColor || '#7C3AED'
              return (
                <SidebarGroup key={farm.id} className="py-0.5">
                  {/* Farm header — click to expand */}
                  <button
                    onClick={() => toggleFarm(farm.id)}
                    style={isOnFarm ? {
                      background: `${farmColor}18`,
                      border: `1px solid ${farmColor}33`,
                    } : {}}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5 transition-colors text-left cursor-pointer border-none ${
                      isOnFarm ? '' : 'bg-transparent hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{emoji}</span>
                    <span
                      className="font-['Sora'] text-[13px] font-bold flex-1 truncate"
                      style={{ color: isOnFarm ? farmColor : undefined }}
                    >
                      {farm.farm_name}
                    </span>
                    <ChevronDown
                      size={13}
                      className={`text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Collapsible farm sub-items */}
                  {isOpen && (
                    <SidebarGroupContent>
                      <SidebarMenu className="pl-2">
                        {[
                          { title: 'Dashboard',    url: `${farmBase}/beranda`, icon: Home         },
                          { title: 'Siklus',       url: `${farmBase}/siklus`,  icon: BarChart2    },
                          { title: 'Input Harian', url: `${farmBase}/input`,   icon: ArrowLeftRight },
                          { title: 'Pakan',        url: `${farmBase}/pakan`,   icon: Warehouse    },
                        ].map((item) => {
                          const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '?')
                          return (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className={`rounded-xl mb-0.5 transition-all ${
                                  isActive ? '' : 'hover:bg-white/[0.03] text-foreground'
                                }`}
                                style={isActive ? {
                                  background: `${farmColor}18`,
                                  border: `1px solid ${farmColor}33`,
                                } : {}}
                              >
                                <NavLink to={item.url} className="flex items-center gap-3 w-full">
                                  <item.icon
                                    size={16}
                                    style={{ color: isActive ? farmColor : undefined }}
                                    className={isActive ? '' : 'text-muted-foreground'}
                                    strokeWidth={isActive ? 2.5 : 2}
                                  />
                                  <span
                                    className={`font-body text-[13px] flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}
                                    style={{ color: isActive ? farmColor : undefined }}
                                  >
                                    {item.title}
                                  </span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          )
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  )}
                </SidebarGroup>
              )
            })}
          </>
        )}

        {/* ── Quick Actions (fills bottom space) ── */}
        <div className="mt-auto px-1 pb-2 space-y-0.5">
          <SidebarSeparator className="mb-2 mt-3" />
          {isSuperadmin && (
            <button
              onClick={handleGoToAdmin}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-400 hover:bg-amber-500/10 transition-colors border-none cursor-pointer bg-transparent text-left"
            >
              <Shield size={14} className="shrink-0" />
              <span className="text-[13px] font-bold">Admin Panel</span>
            </button>
          )}
          <button
            onClick={() => navigate('/onboarding?mode=new_business')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#64748B] hover:bg-white/[0.04] hover:text-[#94A3B8] transition-colors border-none cursor-pointer bg-transparent text-left"
          >
            <Building2 size={14} className="shrink-0" />
            <span className="text-[13px]">Ganti Model Bisnis</span>
          </button>
        </div>

      </SidebarContent>

      <SidebarFooter className="p-2 pb-6">
        <SidebarSeparator className="mb-2" />
        {/* Plan info */}
        <div style={{
          margin: '0 4px 8px',
          padding: '10px 12px',
          background: isSuperadmin ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
          border: isSuperadmin ? '1px solid rgba(245,158,11,0.15)' : '1px solid rgba(16,185,129,0.15)',
          borderRadius: '10px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{
                fontSize: '10px',
                fontWeight: 600,
                color: isSuperadmin ? 'rgba(245,158,11,0.6)' : '#4B6478',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                margin: 0
              }}>
                {isSuperadmin ? 'Status Akun' : 'Plan Aktif'}
              </p>
              <p style={{
                fontFamily: 'Sora',
                fontSize: '13px',
                fontWeight: 800,
                color: isSuperadmin ? '#F59E0B' : '#34D399',
                margin: '2px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {isSuperadmin ? (
                  <>
                    <Shield size={14} className="text-amber-500" />
                    PLATFORM ADMIN
                  </>
                ) : (
                  tenant?.plan?.toUpperCase() || 'STARTER'
                )}
              </p>
            </div>
            
            {/* Trial badge kalau masih trial (Hanya non-superadmin) */}
            {isTrialActive && !isSuperadmin && (
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                background: 'rgba(245,158,11,0.12)',
                color: '#F59E0B',
                border: '1px solid rgba(245,158,11,0.20)',
                borderRadius: '6px',
                padding: '2px 7px'
              }}>
                Trial {daysLeft}h
              </span>
            )}

            {/* Premium Badge for Superadmin */}
            {isSuperadmin && (
              <span style={{
                fontSize: '9px',
                fontWeight: 900,
                background: 'rgba(245,158,11,0.2)',
                color: '#F59E0B',
                borderRadius: '4px',
                padding: '1px 5px',
                letterSpacing: '1px'
              }}>
                PRO
              </span>
            )}
          </div>
          
          {/* Progress bar trial (Hanya non-superadmin) */}
          {isTrialActive && !isSuperadmin && (
            <div style={{
              marginTop: '8px',
              height: '3px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '99px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${(daysLeft / 14) * 100}%`,
                background: daysLeft <= 3 
                  ? '#F87171' 
                  : daysLeft <= 7 
                  ? '#F59E0B' 
                  : '#10B981',
                borderRadius: '99px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}

          {/* Mulai Trial button (Hanya non-superadmin) */}
          {!isTrialActive && !isSuperadmin && (
            <button
              onClick={async () => {
                try {
                  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                  const { error, count } = await supabase
                    .from('tenants')
                    .update({ trial_ends_at: trialEnd })
                    .eq('id', tenant?.id)
                  
                  if (error) throw error
                  
                  // Supabase RLS may silently block — detect via refetch
                  toast.success('🎉 Trial 14 hari dimulai! Memuat ulang...')
                  
                  // Refetch auth data then reload
                  setTimeout(() => window.location.reload(), 500)
                } catch (err) {
                  console.error('Trial start error:', err)
                  toast.error('Gagal memulai trial: ' + (err.message || 'RLS policy mungkin memblokir update'))
                }
              }}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '8px 12px',
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'Sora',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 12px rgba(16,185,129,0.25)',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={14} />
              Mulai Trial 14 Hari
            </button>
          )}
        </div>

        {/* ── Custom user dropdown ── */}
        <div className="relative" ref={userDropdownRef}>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-[#162230] border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/40 z-50"
              >
                {/* User info header */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 border-2 border-emerald-500/25 flex items-center justify-center font-display font-extrabold text-[12px] text-emerald-400 flex-shrink-0 uppercase">
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#F1F5F9] truncate leading-tight">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-[11px] text-[#4B6478] truncate">{user?.email}</p>
                  </div>
                  {profile?.role && (
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${
                      profile.role === 'superadmin' ? 'bg-amber-500/10 text-amber-500' :
                      profile.role === 'owner'      ? 'bg-[#10B981]/10 text-[#10B981]' :
                      profile.role === 'staff'      ? 'bg-blue-500/10 text-blue-400' :
                      'bg-white/5 text-[#4B6478]'
                    }`}>
                      {profile.role.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  {[
                    { icon: User,      label: 'Profil Akun',   onClick: () => { navigate(akunPath); setDropdownOpen(false) } },
                    { icon: Building2, label: 'Kelola Bisnis', onClick: () => { navigate('/onboarding?mode=new_business'); setDropdownOpen(false) } },
                    { icon: Bell,      label: 'Notifikasi',    onClick: () => { navigate(akunPath + '#notif'); setDropdownOpen(false) } },
                  ].map(({ icon: Icon, label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#94A3B8] hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <Icon size={16} className="shrink-0" />
                      <span>{label}</span>
                    </button>
                  ))}

                  {isSuperadmin && (
                    <>
                      <div className="h-px bg-white/8 mx-2 my-1" />
                      <button
                        onClick={() => { handleGoToAdmin(); setDropdownOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-colors"
                      >
                        <Shield size={16} className="shrink-0" />
                        <span className="font-bold">Admin Panel</span>
                      </button>
                    </>
                  )}

                  <div className="h-px bg-white/8 mx-2 my-1" />

                  <button
                    onClick={() => { handleLogout(); setDropdownOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                  >
                    <LogOut size={16} className="shrink-0" />
                    <span className="font-bold">Keluar</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trigger button */}
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border-2 border-emerald-500/25 flex items-center justify-center font-display font-extrabold text-[12px] text-emerald-400 flex-shrink-0 uppercase">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold truncate leading-tight text-foreground">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <ChevronsUpDown size={14} className="text-muted-foreground shrink-0" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
