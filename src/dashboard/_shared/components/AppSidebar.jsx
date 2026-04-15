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
  CreditCard,
  ShoppingCart,
  Package,
  Store,
  Syringe,
  RefreshCw,
  ClipboardList,
  FileText,
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
  SidebarProvider,
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
} from "@/components/ui/sheet"
import { resolveBusinessVertical, BUSINESS_MODELS } from '@/lib/businessModel'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { peternakPermissions } from '@/lib/hooks/usePeternakPermissions'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePeternakFarms } from '@/lib/hooks/usePeternakData'
import { usePlanConfigs } from '@/lib/hooks/useAdminData'
import { useTheme } from '@/lib/hooks/useTheme'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

export default function AppSidebar({ open, onClose }) {
  const { user, profile, profiles, tenant, isSuperadmin, switchTenant, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isAddingBusiness, setIsAddingBusiness] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileSwitcherOpen, setMobileSwitcherOpen] = useState(false)
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false)
  const [expandedFarms, setExpandedFarms] = useState({})
  // Start UTAMA collapsed when already on a per-farm route so kandang sections get focus
  const [utamaCollapsed, setUtamaCollapsed] = useState(
    () => /^\/peternak\/[^/]+\/kandang\//.test(location.pathname)
  )
  const userDropdownRef = useRef(null)
  const [showTrialChoices, setShowTrialChoices] = useState(false)

  // Get dynamic trial configuration from admin settings
  const { data: planConfigs } = usePlanConfigs()
  const trialConfig = planConfigs?.trial_config || { duration: 14 }
  const trialDurationDays = Number(trialConfig.duration) || 14
  
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Farms for peternak multi-kandang sidebar
  const { data: peternakFarms = [] } = usePeternakFarms()

  const toggleFarm = (farmId) =>
    setExpandedFarms(prev => ({ ...prev, [farmId]: !prev[farmId] }))

  // Auto-expand the farm section matching the current URL
  // URL structure: /peternak/:peternakType/kandang/:farmId/...
  useEffect(() => {
    const match = location.pathname.match(/^\/peternak\/[^/]+\/kandang\/([^/]+)/)
    if (match) {
      const activeFarmId = match[1]
      setExpandedFarms(prev => prev[activeFarmId] ? prev : { ...prev, [activeFarmId]: true })
      // Collapse UTAMA when entering a farm route
      setUtamaCollapsed(true)
    } else if (/^\/peternak\//.test(location.pathname)) {
      // Expand UTAMA when navigating to a global peternak page (not farm-level)
      setUtamaCollapsed(false)
    }
  }, [location.pathname])

  // ── Multi-Tenant Quota Check ──
  const [quota, setQuota] = useState({ usage: 0, limit: 0, canAdd: false })
  useEffect(() => {
    async function loadQuota() {
      if (!tenant || !profile) return
      const res = await checkQuotaUsage(tenant, profile, 'business')
      setQuota(res)
    }
    loadQuota()
  }, [tenant, profile, profiles])

  const canAddBusiness = isSuperadmin || quota.canAdd
  const hasPaidPlan = profiles?.some(p => ['pro', 'business'].includes(p.tenants?.plan))

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

  const vertical = resolveBusinessVertical(profile, tenant)
  const isPoultry  = vertical === 'poultry_broker'
  const isEgg      = vertical === 'egg_broker'
  const isPeternak = vertical === 'peternak'
  const isRPA      = vertical === 'rumah_potong'
  const isSembako  = ['distributor_sembako', 'sembako_broker'].includes(vertical)

  // Peternak permission matrix (null for non-peternak users)
  const pp = isPeternak ? peternakPermissions(profile?.role) : null

  const brokerBase = getBrokerBasePath(tenant)
  const peternakBase = `/peternak/${profile?.sub_type || 'peternak_broiler'}`
  
  const color = accentColor || (isSembako ? '#EA580C' : isEgg ? '#7C3AED' : isRPA ? '#F59E0B' : '#10B981')

  const getBerandaPath = (v, t = tenant) => {
    const bBase = getBrokerBasePath(t)
    const pBase = `/peternak/${t?.sub_type || 'peternak_broiler'}`
    
    switch (v) {
      case 'poultry_broker': return `${bBase}/beranda`
      case 'egg_broker':     return `${bBase}/beranda`
      case 'peternak':       return `${pBase}/beranda`
      case 'rumah_potong': {
        const rpType = t?.sub_type?.startsWith('rpa') ? 'rpa' : 'rph'
        return `/rumah_potong/${rpType}/beranda`
      }
      case 'distributor_sembako':
      case 'sembako_broker': return `${bBase}/beranda`
      default:               return `${bBase}/beranda`
    }
  }

  const getAkunPath = (v, t = tenant) => {
    const bBase = getBrokerBasePath(t)
    const pBase = `/peternak/${t?.sub_type || 'peternak_broiler'}`

    switch (v) {
      case 'peternak':       return `${pBase}/akun`
      case 'rumah_potong': {
        const rpType = t?.sub_type?.startsWith('rpa') ? 'rpa' : 'rph'
        return `/rumah_potong/${rpType}/akun`
      }
      case 'distributor_sembako':
      case 'sembako_broker': return `${bBase}/akun`
      default:               return `${bBase}/akun`
    }
  }

  const berandaPath = getBerandaPath(vertical)
  const akunPath    = getAkunPath(vertical)

  const getVerticalInfo = (v) => {
    switch (v) {
      case 'poultry_broker': return { icon: '🐔', label: 'Broker Ayam' }
      case 'egg_broker':     return { icon: '🥚', label: 'Broker Telur' }
      case 'peternak':       return { icon: '🏠', label: 'Peternak' }
      case 'rpa':            return { icon: '🏭', label: 'RPA' }
      case 'distributor_sembako':
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
          { title: 'Transaksi',     url: `${brokerBase}/transaksi`, icon: ArrowLeftRight },
          { title: 'RPA & Piutang', url: `${brokerBase}/rpa`,       icon: Building2, roles: ['owner', 'staff'] },
          { title: 'Kandang',       url: `${brokerBase}/kandang`,   icon: Warehouse,  roles: ['owner', 'staff'] },
          { title: 'Tim & Akses',   url: `${brokerBase}/tim`,       icon: Users,      roles: ['owner'] },
        ] : []),

        // Broker Telur
        ...(isEgg ? [
          { title: 'POS / Jual',        url: `${brokerBase}/pos`,        icon: ArrowLeftRight },
          { title: 'Inventori & HPP',   url: `${brokerBase}/inventori`,  icon: Warehouse,  roles: ['owner', 'staff'] },
          { title: 'Supplier Telur',    url: `${brokerBase}/suppliers`,  icon: Building2,  roles: ['owner', 'staff'] },
          { title: 'Pelanggan Telur',   url: `${brokerBase}/customers`,  icon: User,       roles: ['owner', 'staff'] },
          { title: 'Riwayat Transaksi', url: `${brokerBase}/transaksi`,  icon: BarChart2,  roles: ['owner', 'staff'] },
        ] : []),

        // Peternak — global links (farm-specific sections rendered separately below)
        ...(isPeternak ? [
          { title: 'Semua Siklus',   url: `${peternakBase}/siklus`,        icon: RefreshCw,  show: pp?.canViewSiklus    ?? true },
          { title: 'Program Vaksin', url: `${peternakBase}/vaksinasi`,      icon: Syringe,    show: pp?.canViewVaksinasi ?? true },
          { title: 'Laporan Siklus', url: `${peternakBase}/laporan`,        icon: FileText,   show: pp?.canViewLaporan   ?? true },
          { title: 'Stok Pakan',     url: `${peternakBase}/pakan`,          icon: Warehouse,  show: pp?.canViewPakan     ?? true },
          { title: 'Anak Kandang',   url: `${peternakBase}/anak-kandang`,   icon: Users,      show: pp?.canViewAnakKandang ?? true },
          { title: 'Tim & Akses',    url: `${peternakBase}/tim`,            icon: Users,      show: pp?.canViewTim       ?? false },
        ].filter(item => item.show !== false) : []),

        // RPA
        // Rumah Potong
        ...(isRPA ? [
          ...(profile?.sub_type?.startsWith('rpa') ? [
            { title: 'Order',      url: '/rumah_potong/rpa/order',      icon: ArrowLeftRight },
            { title: 'Hutang',     url: '/rumah_potong/rpa/hutang',     icon: Wallet },
            { title: 'Distribusi', url: '/rumah_potong/rpa/distribusi', icon: Truck },
            { title: 'Laporan',    url: '/rumah_potong/rpa/laporan',    icon: BarChart2, roles: ['owner'] },
          ] : [
            /* RPH placeholder items if any */
            { title: 'Dashboard',   url: '/rumah_potong/rph/beranda',   icon: Home },
          ])
        ] : []),

        // Sembako Broker
        ...(isSembako ? [
          { title: 'Penjualan',       url: `${brokerBase}/penjualan`,     icon: ArrowLeftRight },
          { title: 'Toko & Supplier', url: `${brokerBase}/toko-supplier`, icon: Store },
          { title: 'Pengiriman',      url: `${brokerBase}/pengiriman`,    icon: Truck },
          { title: 'Gudang',          url: `${brokerBase}/gudang`,        icon: Warehouse },
          { title: 'Inventori & HPP', url: `${brokerBase}/produk`,        icon: Package,        roles: ['owner', 'staff'] },
          { title: 'Karyawan',        url: `${brokerBase}/karyawan`,      icon: Users,          roles: ['owner'], planRequired: 'pro' },
        ] : []),
      ]
    },

    // ── OPERASIONAL — Sembako ───────────────────────────────
    ...(isSembako ? [{
      label: 'LAPORAN & AKUN',
      items: [
        { title: 'Laporan',       url: `${brokerBase}/laporan`, icon: BarChart2, roles: ['owner'], planRequired: 'pro' },
        { title: 'Tim & Akses',   url: `${brokerBase}/tim`,     icon: Shield,    roles: ['owner'] },
        { title: 'Akun & Profil', url: `${brokerBase}/akun`,    icon: User },
      ]
    }] : []),

    // ── OPERASIONAL (broker only) ───────────────────────────
    ...(isPoultry ? [{
      label: 'OPERASIONAL',
      items: [
        { title: 'Pengiriman', url: `${brokerBase}/pengiriman`, icon: Truck,      roles: ['owner', 'staff'] },
        { title: 'Cash Flow',  url: `${brokerBase}/cashflow`,   icon: Wallet,     roles: ['owner'],          planRequired: 'pro' },
        { title: 'Armada',     url: `${brokerBase}/armada`,     icon: Car,        roles: ['owner'] },
        { title: 'Simulator',  url: `${brokerBase}/simulator`,  icon: Calculator, roles: ['owner'],          planRequired: 'pro' },
      ]
    }] : []),

    ...(isEgg ? [{
      label: 'OPERASIONAL',
      items: [
        { title: 'Cash Flow', url: `${brokerBase}/cashflow`, icon: Wallet, roles: ['owner'] },
      ]
    }] : []),

    // ── SHARED (semua vertical) ─────────────────────────────
    {
      label: 'LAINNYA',
      items: [
        ...((tenant?.sub_type === 'broker_ayam' || tenant?.business_vertical === 'poultry_broker') ? [
          { title: 'Harga Pasar', url: '/dashboard/harga-pasar', icon: BarChart2 },
        ] : []),
        { title: 'TernakOS Market', url: '/market', icon: Building2 },
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

  // Subscription status — single source of truth
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':   return { color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' }
      case 'trial':    return { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' }
      case 'expired':  return { color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' }
      default:         return { color: '#64748B', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.20)' }
    }
  }

  const sub = getSubscriptionStatus(tenant)
  const isAccountActive = isSuperadmin || sub.status === 'active' || sub.status === 'trial'
  const daysLeft = isSuperadmin ? 0 : sub.daysLeft

  // Plan-tier gating
  const planTier = isSuperadmin ? 'business' : (sub.plan || 'starter')
  const isPro     = ['pro', 'business'].includes(planTier) || sub.status === 'trial'
  const isBusiness = planTier === 'business' || (sub.status === 'trial' && sub.plan === 'business')

  const sidebarContent = (
    <>
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
            <DropdownMenu open={tenantMenuOpen} onOpenChange={setTenantMenuOpen}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="bg-secondary border border-border rounded-xl group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent hover:bg-white/[0.03] transition-colors"
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 border"
                    style={{ 
                      background: `${color}18`, 
                      borderColor: `${color}25` 
                    }}
                  >
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
                          const targetPath = getBerandaPath(targetVertical, p.tenants)
                          
                          // 1. Switch tenant state
                          switchTenant(p.tenant_id)
                          
                          // 2. Clear ONLY tenant-specific cache (preserve global data like market-prices)
                          queryClient.invalidateQueries({
                            predicate: (query) => {
                              const key = query.queryKey
                              const globalKeys = [
                                'market-prices',
                                'harga-pasar',
                                'market-listings',
                                'pricing-plans',
                                'discount-codes',
                              ]
                              return !globalKeys.some(gk => 
                                Array.isArray(key) && key[0] === gk
                              )
                            }
                          })
                          
                          // 3. Navigate to the correct vertical dashboard
                          navigate(targetPath)
                        }}
                        className={`gap-3 rounded-lg p-2 cursor-pointer transition-colors focus:bg-accent focus:text-foreground mb-1 ${
                          isActive ? 'bg-opacity-10' : 'hover:bg-accent text-foreground'
                        }`}
                        style={isActive ? { color: color, background: `${color}18` } : {}}
                      >
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 transition-colors"
                          style={isActive ? { background: `${color}33`, boxShadow: `0 0 10px ${color}1A` } : { background: 'rgba(255,255,255,0.05)' }}
                        >
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
                         {isActive && <Check size={14} style={{ color: color }} className="flex-shrink-0" />}
                      </DropdownMenuItem>
                    )
                  })}
                </ScrollArea>

                <DropdownMenuSeparator className="my-1.5 bg-border" />

                <DropdownMenuItem
                  onSelect={() => {
                    setTenantMenuOpen(false)
                    if (!canAddBusiness) {
                      navigate('/dashboard/addons')
                      return
                    }
                    window.setTimeout(() => setIsAddingBusiness(true), 0)
                  }}
                  className={`gap-3 rounded-lg p-2 text-muted-foreground transition-colors cursor-pointer hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground`}
                  title={!canAddBusiness ? 'Kuota bisnis penuh. Beli slot tambahan.' : undefined}
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-white/5 flex-shrink-0">
                    {canAddBusiness ? <Plus size={14} /> : <Lock size={14} className="text-amber-400" />}
                  </div>
                  <span className={`text-[13px] font-medium flex-1 ${!canAddBusiness ? 'text-amber-400/80' : ''}`}>
                    {canAddBusiness ? 'Tambah Bisnis Baru' : 'Beli Slot Bisnis Baru'}
                  </span>
                  {!canAddBusiness && (
                    <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">ADD-ON</span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={isAddingBusiness} onOpenChange={setIsAddingBusiness}>
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
                      onClick={() => { setIsAddingBusiness(false); navigate('/dashboard/addons') }}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Plus size={16} /> Beli Slot Bisnis Baru
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {filteredNavMain.map((group) => {
          const isUtama = group.label === 'UTAMA'
          // Only make UTAMA collapsible for peternak (they have per-farm sections to focus on)
          const collapsible = isUtama && isPeternak && peternakFarms.length > 0
          const collapsed   = collapsible && utamaCollapsed
          return (
          <SidebarGroup key={group.label}>
            {collapsible ? (
              <button
                onClick={() => setUtamaCollapsed(v => !v)}
                className="w-full flex items-center justify-between px-2 mb-1 bg-transparent border-none cursor-pointer group"
              >
                <span className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground group-hover:text-slate-400 transition-colors">
                  {group.label}
                </span>
                <ChevronDown
                  size={12}
                  className="text-muted-foreground group-hover:text-slate-400 transition-all duration-200"
                  style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                />
              </button>
            ) : (
              <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground px-2 mb-1">
                {group.label}
              </SidebarGroupLabel>
            )}
            {!collapsed && (
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url
                  const isPlanLocked = !isSuperadmin && (
                    (item.planRequired === 'pro'      && !isPro) ||
                    (item.planRequired === 'business' && !isBusiness)
                  )
                  const isLocked = !isSuperadmin && (item.locked || !isAccountActive || isPlanLocked)
                  const lockTooltip = isPlanLocked
                    ? `${item.title} — Upgrade ke ${item.planRequired === 'business' ? 'Business' : 'Pro'}`
                    : `${item.title} (Segera Hadir)`
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild={!isLocked}
                        isActive={isActive}
                        tooltip={isLocked ? lockTooltip : item.title}
                        className={`rounded-xl mb-0.5 transition-all duration-200 ${
                          isLocked
                            ? 'opacity-40 cursor-not-allowed'
                            : isActive
                              ? 'bg-opacity-10'
                              : 'hover:bg-white/[0.03] text-foreground'
                        }`}
                        style={isActive && !isLocked ? { background: `${color}18`, border: `1px solid ${color}33`, color: color } : {}}
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
                            {isPlanLocked ? (
                              <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500/60 border border-emerald-500/15">
                                PRO
                              </span>
                            ) : (
                              <Lock size={12} className="text-muted-foreground" />
                            )}
                          </div>
                        ) : (
                          <NavLink to={item.url} className="flex items-center gap-3 w-full">
                            <item.icon
                              size={18}
                              style={isActive ? { color: color } : {}}
                              className={!isActive ? 'text-muted-foreground' : ''}
                              strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={`font-body text-[14px] flex-1  ${isActive ? 'font-semibold' : 'font-medium'}`} style={isActive ? { color: color } : {}}>
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
            )}
          </SidebarGroup>
          )
        })}

        {/* ── Peternak: per-farm collapsible sections ── */}
        {isPeternak && peternakFarms.length > 0 && (
          <>
            <SidebarSeparator className="my-1" />
            {peternakFarms.map((farm) => {
              const isOpen    = expandedFarms[farm.id] ?? false
              const farmBase  = `${peternakBase}/kandang/${farm.id}`
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
                          { title: 'Dashboard',    url: `${farmBase}/beranda`,       icon: Home,          show: true                       },
                          { title: 'Siklus',       url: `${farmBase}/siklus`,        icon: RefreshCw,     show: pp?.canViewSiklus   ?? true },
                          { title: 'Input Harian', url: `${farmBase}/input`,         icon: ClipboardList, show: pp?.canInputHarian  ?? true },
                          { title: 'Laporan',      url: `${peternakBase}/laporan`,   icon: FileText,      show: pp?.canViewLaporan  ?? true },
                          { title: 'Pakan',        url: `${farmBase}/pakan`,         icon: Warehouse,     show: pp?.canViewPakan    ?? true },
                          { title: 'Vaksinasi',    url: `${peternakBase}/vaksinasi`, icon: Syringe,       show: pp?.canViewVaksinasi ?? true },
                        ].filter(item => item.show !== false).map((item) => {
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

            {/* ── Kandang limit + Add button ── */}
            {(() => {
              const kandangLimit  = tenant?.kandang_limit ?? 1
              const currentCount  = peternakFarms.reduce((s, f) => s + (f.kandang_count || 1), 0)
              const canAddKandang = currentCount < kandangLimit
              const limitLabel    = kandangLimit >= 99 ? '∞' : String(kandangLimit)
              return (
                <div className="px-3 pt-1 pb-2">
                  <button
                    onClick={() => canAddKandang && navigate(`${peternakBase}/beranda`)}
                    disabled={!canAddKandang}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold border transition-colors ${
                      canAddKandang
                        ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer bg-transparent'
                        : 'border-white/10 text-muted-foreground cursor-not-allowed bg-transparent opacity-60'
                    }`}
                    title={!canAddKandang ? `Batas kandang plan kamu ${limitLabel} — upgrade untuk tambah lebih` : 'Tambah kandang baru'}
                  >
                    <span className="flex items-center gap-1.5">
                      {canAddKandang ? <Plus size={13} /> : <Lock size={13} />}
                      Tambah Kandang
                    </span>
                    <span className="text-[11px] font-bold opacity-70">{currentCount}/{limitLabel}</span>
                  </button>
                </div>
              )
            })()}
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
            onClick={() => setMobileSwitcherOpen(true)}
            className="md:hidden w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#64748B] hover:bg-white/[0.04] hover:text-[#94A3B8] transition-colors border-none cursor-pointer bg-transparent text-left"
          >
            <Building2 size={14} className="shrink-0" />
            <span className="text-[13px]">Ganti Model Bisnis</span>
          </button>
        </div>

      </SidebarContent>

      <SidebarFooter className="p-2 pb-6">
        <SidebarSeparator className="mb-2" />
        <div style={{
          margin: '0 4px 8px',
          padding: '10px 12px',
          background: sub.status === 'expired' ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${getStatusColor(sub.status).border}`,
          borderRadius: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{
                fontSize: '10px', fontWeight: 700,
                color: '#4B6478',
                textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0
              }}>
                {isSuperadmin ? 'Status Akun' : 'Plan Aktif'}
              </p>
              <p style={{
                fontFamily: 'Sora', fontSize: '13px', fontWeight: 800,
                color: isSuperadmin ? '#F59E0B' : getStatusColor(sub.status).color,
                margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                {isSuperadmin ? (
                  <><Shield size={14} className="text-amber-500" /> PLATFORM ADMIN</>
                ) : (
                  sub.label.toUpperCase()
                )}
              </p>
            </div>

            {/* Status badge (non-superadmin) */}
            {!isSuperadmin && sub.status !== 'unknown' && (
              <span style={{
                fontSize: '10px', fontWeight: 800, borderRadius: '6px', padding: '2px 8px',
                background: getStatusColor(sub.status).bg,
                color: getStatusColor(sub.status).color,
                border: `1px solid ${getStatusColor(sub.status).border}`,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {sub.status === 'trial' ? `${sub.daysLeft} Hari` : sub.status === 'active' && sub.plan === 'starter' ? 'Gratis' : sub.status === 'expired' ? 'Expired' : `${sub.daysLeft} Hari`}
              </span>
            )}
          </div>

          {/* Progress bar — shown for trial and expiring paid plans */}
          {!isSuperadmin && (sub.status === 'trial' || (sub.status === 'active' && sub.isExpiringSoon && sub.plan !== 'starter')) && (
            <div style={{
              marginTop: '10px', height: '4px',
              background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.max(8, (sub.daysLeft / (sub.status === 'trial' ? 14 : 30)) * 100)}%`,
                background: sub.daysLeft <= 3 ? '#F87171' : sub.daysLeft <= 7 ? '#F59E0B' : '#10B981',
                borderRadius: '99px', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
          )}

          {/* Renewal / Upgrade shortcut for expiring or expired paid plans */}
          {!isSuperadmin && sub.status !== 'unknown' && ((sub.status === 'expired' && sub.plan !== 'starter') || (sub.isExpiringSoon && sub.status === 'active' && sub.plan !== 'starter')) && (
            <button
              onClick={() => navigate('/upgrade')}
              style={{
                width: '100%', marginTop: '10px', padding: '8px 12px',
                background: sub.status === 'expired' ? 'rgba(248,113,113,0.1)' : 'rgba(16,185,129,0.1)',
                color: sub.status === 'expired' ? '#F87171' : '#10B981',
                border: `1px solid ${sub.status === 'expired' ? 'rgba(248,113,113,0.2)' : 'rgba(16,185,129,0.2)'}`,
                borderRadius: '10px', fontSize: '11px', fontWeight: 800, fontFamily: 'Sora',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = sub.status === 'expired' ? 'rgba(248,113,113,0.15)' : 'rgba(16,185,129,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = sub.status === 'expired' ? 'rgba(248,113,113,0.1)' : 'rgba(16,185,129,0.1)'}
            >
              <CreditCard size={13} />
              {sub.status === 'expired' ? 'Perbarui Sekarang' : 'Perpanjang Plan'}
            </button>
          )}

          {/* Mulai Trial button — hanya untuk starter yang belum/sudah expired trial */}
          {!isAccountActive && !isSuperadmin && sub.plan === 'starter' && (
            <div style={{ marginTop: '10px' }}>
              {!showTrialChoices ? (
                <button
                  onClick={() => setShowTrialChoices(true)}
                  style={{
                    width: '100%', padding: '8px 12px',
                    background: '#10B981', color: 'white', border: 'none', borderRadius: '8px',
                    fontSize: '12px', fontWeight: 700, fontFamily: 'Sora', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    boxShadow: '0 2px 12px rgba(16,185,129,0.25)', transition: 'all 0.2s'
                  }}
                >
                  <Sparkles size={14} />
                  Pilih Plan Trial ({trialDurationDays} Hari)
                </button>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {['starter', 'pro', 'business'].map(p => (
                    <button
                      key={p}
                      onClick={async () => {
                        try {
                          const trialEnd = new Date(Date.now() + trialDurationDays * 24 * 60 * 60 * 1000).toISOString()
                          const { error } = await supabase
                            .from('tenants')
                            .update({ 
                               plan: p, 
                               trial_ends_at: trialEnd, 
                               kandang_limit: p === 'business' ? 99 : p === 'pro' ? 2 : 1
                            })
                            .eq('id', tenant?.id)
                          
                          if (error) throw error
                          toast.success(`🎉 Trial ${p.toUpperCase()} ${trialDurationDays} Hari dimulai!`)
                          setTimeout(() => window.location.reload(), 500)
                        } catch (err) {
                          toast.error('Gagal: ' + err.message)
                        }
                      }}
                      style={{
                        padding: '6px 2px', borderRadius: '6px', border: '1px solid #10B981',
                        background: 'transparent', color: '#34D399', fontSize: '9px',
                        fontWeight: 800, cursor: 'pointer', textAlign: 'center'
                      }}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                  <button 
                    onClick={() => setShowTrialChoices(false)}
                    style={{ gridColumn: 'span 3', background: 'transparent', border: 'none', color: '#4B6478', fontSize: '9px', marginTop: '4px', cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
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
    </>
  )

  const renderMobileSwitcher = () => {
    return (
      <Sheet open={mobileSwitcherOpen} onOpenChange={setMobileSwitcherOpen}>
        <SheetContent side="bottom" className="bg-[#0C1319] border-t border-border rounded-t-2xl p-4 z-[9999]">
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="text-foreground text-lg font-bold">Ganti Model Bisnis</SheetTitle>
            <SheetDescription className="text-muted-foreground text-xs">
              Pilih bisnis Anda untuk beralih ruang kerja.
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="max-h-[50vh] mb-4">
            <div className="flex flex-col gap-2">
              {profiles.map((p) => {
                const isActive = p.tenant_id === tenant?.id
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      const targetVertical = p.tenants?.business_vertical
                      const targetPath = getBerandaPath(targetVertical)
                      switchTenant(p.tenant_id)
                      // Clear ONLY tenant-specific cache
                      queryClient.invalidateQueries({
                        predicate: (query) => {
                          const key = query.queryKey
                          const globalKeys = ['market-prices', 'harga-pasar', 'market-listings', 'pricing-plans', 'discount-codes']
                          return !globalKeys.some(gk => Array.isArray(key) && key[0] === gk)
                        }
                      })
                      setMobileSwitcherOpen(false)
                      if (!isDesktop) onClose?.()
                      navigate(targetPath)
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors text-left ${
                      isActive ? 'border' : 'bg-white/5 border border-white/5 hover:bg-white/10'
                    }`}
                    style={isActive ? { background: `${color}18`, borderColor: `${color}33` } : {}}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-colors"
                      style={isActive ? { background: `${color}33`, boxShadow: `0 0 10px ${color}1A` } : { background: '#090E14' }}
                    >
                      {getVerticalInfo(p.tenants?.business_vertical).icon}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className={`text-[14px] truncate leading-tight ${isActive ? 'font-bold' : 'font-semibold text-foreground'}`} style={isActive ? { color: color } : {}}>
                        {p.tenants?.business_name || 'My Business'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {getVerticalInfo(p.tenants?.business_vertical).label}
                      </p>
                    </div>
                    {isActive && <Check size={18} style={{ color: color }} className="flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
          
          <button
            onClick={() => {
              setMobileSwitcherOpen(false)
              if (canAddBusiness) {
                navigate('/onboarding?mode=new_business')
                if (!isDesktop) onClose?.()
              } else {
                toast.error('Upgrade ke prabayar untuk tambah bisnis baru')
              }
            }}
            disabled={!canAddBusiness}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all ${
              canAddBusiness ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            {canAddBusiness ? <Plus size={16} /> : <Lock size={16} />}
            <span>Tambah Bisnis Baru</span>
          </button>
        </SheetContent>
      </Sheet>
    )
  }

  if (!isDesktop) {
    return (
      <>
        <Sheet open={open} onOpenChange={(val) => !val && onClose?.()}>
          <SheetContent side="left" className="p-0 border-r border-[#1e293b] w-[280px] flex flex-col overflow-hidden" style={{ background: '#090E14' }}>
            <SheetHeader className="sr-only">
              <SheetTitle>Navigasi Sidebar</SheetTitle>
              <SheetDescription>Menu navigasi utama aplikasi TernakOS.</SheetDescription>
            </SheetHeader>
            <SidebarProvider defaultOpen={true}>
              <Sidebar collapsible="none" className="border-none bg-transparent" style={{ width: '100%', height: '100%' }}>
                <div style={{ paddingBottom: '32px', height: '100%', overflowY: 'auto', overscrollBehavior: 'contain' }}>
                  {sidebarContent}
                </div>
              </Sidebar>
            </SidebarProvider>
          </SheetContent>
        </Sheet>
        {renderMobileSwitcher()}
      </>
    )
  }

  return (
    <>
      <Sidebar collapsible="offcanvas" style={{ background: '#090E14' }}>
        {sidebarContent}
      </Sidebar>
      {renderMobileSwitcher()}
    </>
  )
}
