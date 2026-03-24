import React, { useState, useEffect } from 'react'
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
  User,
  Users,
  LogOut,
  Bell,
  Check,
  Plus
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
import { useAuth } from '../../lib/hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export default function AppSidebar() {
  const { user, profile: authProfile, tenant: authTenant } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [profiles, setProfiles] = useState([])
  const [activeProfileId, setActiveProfileId] = useState(null)

  useEffect(() => {
    if (authProfile && !activeProfileId) {
      setActiveProfileId(authProfile.id)
    }
  }, [authProfile])

  useEffect(() => {
    async function fetchProfiles() {
      if (!user?.id) return
      const { data, error } = await supabase
        .from('profiles')
        .select('*, tenants(*)')
        .eq('auth_user_id', user.id)
      
      if (!error && data) {
        setProfiles(data)
      }
    }
    fetchProfiles()
  }, [user?.id])

  const profile = profiles.find(p => p.id === activeProfileId) || authProfile
  const tenant = profile?.tenants || authTenant

  const tenantInitials = tenant?.business_name?.slice(0, 2).toUpperCase() || 'TO'
  const userInitials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const isOwner = profile?.role === 'owner'
  const isStaff = profile?.role === 'staff'
  const isViewOnly = profile?.role === 'view_only'

  const vertical = tenant?.business_vertical || 'poultry_broker'
  const isPoultry = vertical === 'poultry_broker'
  const isEgg = vertical === 'egg_broker'

  const navMain = [
    {
      label: 'UTAMA',
      items: [
        { title: 'Beranda',    url: `/broker/${vertical}/beranda`,   icon: Home },
        // Poultry specific
        ...(isPoultry ? [
          { title: 'Transaksi',  url: '/broker/transaksi', icon: ArrowLeftRight },
          { title: 'RPA & Piutang', url: '/broker/rpa',   icon: Building2, roles: ['owner', 'staff'] },
          { title: 'Kandang',    url: '/broker/kandang',   icon: Warehouse, roles: ['owner', 'staff'] },
        ] : []),
        // Egg specific
        ...(isEgg ? [
          { title: 'POS / Jual', url: '/broker/egg_broker/pos', icon: ArrowLeftRight },
          { title: 'Inventori & HPP', url: '/broker/egg_broker/inventori', icon: Warehouse, roles: ['owner', 'staff'] },
          { title: 'Supplier Telur', url: '/broker/egg_broker/suppliers', icon: Building2, roles: ['owner', 'staff'] },
          { title: 'Pelanggan Telur', url: '/broker/egg_broker/customers', icon: User, roles: ['owner', 'staff'] },
          { title: 'Riwayat Transaksi', url: '/broker/egg_broker/transaksi', icon: BarChart2, roles: ['owner', 'staff'] },
        ] : []),
        { title: 'Tim & Akses', url: '/broker/tim',      icon: Users, roles: ['owner'] },
      ]
    },
    {
      label: 'OPERASIONAL',
      items: [
        { title: 'Pengiriman', url: '/broker/pengiriman', icon: Truck, roles: ['owner', 'staff'] },
        { title: 'Cash Flow',  url: '/broker/cashflow',  icon: Wallet, roles: ['owner'] },
        { title: 'Armada',     url: '/broker/armada',    icon: Car, roles: ['owner'] },
      ]
    },
    ...(isPoultry ? [
      {
        label: 'ANALISIS',
        items: [
          { title: 'Harga Pasar', url: '/harga-pasar',    icon: BarChart2 },
          { title: 'Simulator',   url: '/broker/simulator', icon: Calculator, roles: ['owner'] },
        ]
      }
    ] : [])
  ]

  const filteredNavMain = navMain.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.roles) return true // default accessible to all roles
      return item.roles.includes(profile?.role)
    })
  })).filter(group => group.items.length > 0)

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) toast.error(error.message)
    else {
      toast.success('Logged out successfully')
      navigate('/login')
    }
  }

  // Calculate Trial Status
  const trialEndsAt = tenant?.trial_ends_at
  const isTrialActive = trialEndsAt 
    ? new Date(trialEndsAt) > new Date() 
    : false
  const daysLeft = trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))) 
    : 0

  return (
    <Sidebar collapsible="offcanvas" style={{ background: '#090E14' }}>
      <SidebarHeader style={{padding: '16px 16px 8px'}}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-1 py-2 cursor-pointer" onClick={() => navigate(`/broker/${vertical}/beranda`)}>
          <img src="/logo.png" alt="TernakOS Icon" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
          <div className="">
            <p className="font-display font-extrabold text-[15px] text-foreground leading-none">
              TernakOS
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isEgg ? 'Broker Telur' : 'Broker Dashboard'}
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
                  <div className="w-7 h-7 rounded-md bg-emerald-500/15 flex items-center justify-center text-[11px] font-display font-extrabold text-emerald-400 flex-shrink-0">
                    {tenantInitials}
                  </div>
                  <div className="flex-1 overflow-hidden text-left ml-2">
                    <p className="text-[13px] font-semibold truncate leading-tight">
                      {tenant?.business_name || 'My Business'}
                    </p>
                    <p style={{
                      fontSize: '11px',
                      color: 'hsl(var(--muted-foreground))',
                      margin: 0,
                      letterSpacing: '0.3px'
                    }}>
                      {isEgg ? 'Broker Telur' : 'Broker Dashboard'}
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
                {profiles.map((p) => {
                  const isActive = p.id === activeProfileId
                  return (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => {
                        setActiveProfileId(p.id)
                        queryClient.invalidateQueries()
                      }}
                      className={`gap-3 rounded-lg p-2 cursor-pointer transition-colors focus:bg-accent focus:text-foreground ${
                        isActive ? 'text-emerald-400 bg-emerald-500/10' : 'hover:bg-accent text-foreground'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {p.tenants?.business_name?.slice(0, 2).toUpperCase() || 'TO'}
                      </div>
                      <span className="text-[13px] font-medium flex-1 truncate">
                        {p.tenants?.business_name || 'My Business'}
                      </span>
                      {isActive && <Check size={14} className="text-emerald-400 flex-shrink-0" />}
                    </DropdownMenuItem>
                  )
                })}
                <DropdownMenuSeparator className="my-1.5 bg-border" />
                <DropdownMenuItem
                  onClick={() => toast.info('Fitur segera hadir')}
                  className="gap-3 rounded-lg p-2 cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus:bg-accent focus:text-foreground"
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-white/5 flex-shrink-0">
                    <Plus size={14} />
                  </div>
                  <span className="text-[13px] font-medium">Tambah Bisnis Baru</span>
                </DropdownMenuItem>
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
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={`rounded-xl mb-0.5 transition-all duration-200 ${
                          isActive 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'hover:bg-white/[0.03] text-foreground'
                        }`}
                        style={isActive ? { border: '1px solid rgba(16,185,129,0.20)' } : {}}
                      >
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
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2 pb-6">
        <SidebarSeparator className="mb-2" />

        {/* Plan info */}
        <div style={{
          margin: '0 4px 8px',
          padding: '10px 12px',
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.15)',
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
                color: '#4B6478',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                margin: 0
              }}>
                Plan Aktif
              </p>
              <p style={{
                fontFamily: 'Sora',
                fontSize: '13px',
                fontWeight: 800,
                color: '#34D399',
                margin: '2px 0 0'
              }}>
                {tenant?.plan?.toUpperCase() || 'STARTER'}
              </p>
            </div>
            
            {/* Trial badge kalau masih trial */}
            {isTrialActive && (
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
          </div>
          
          {/* Progress bar trial */}
          {isTrialActive && (
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
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-xl hover:bg-white/[0.03]  "
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 border-2 border-emerald-500/25 flex items-center justify-center font-display font-extrabold text-[12px] text-emerald-400 flex-shrink-0 uppercase">
                    {userInitials}
                  </div>
                  <div className="flex-1 overflow-hidden  text-left ml-2">
                    <p className="text-[13px] font-semibold truncate leading-tight">
                      {profile?.full_name || 'User'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[11px] text-muted-foreground truncate font-medium">
                        {user?.email}
                      </p>
                      {profile?.role && (
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          profile.role === 'owner' ? 'bg-[#10B981]/10 text-[#10B981]' :
                          profile.role === 'staff' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-white/5 text-[#4B6478]'
                        }`}>
                          {profile.role.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronsUpDown size={14} className="text-muted-foreground  ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56 bg-popover border border-border rounded-2xl p-1.5 shadow-2xl"
              >
                <DropdownMenuItem
                  onClick={() => navigate('/broker/akun')}
                  className="gap-3 rounded-xl p-3 cursor-pointer hover:bg-white/5 transition-colors focus:bg-white/5 focus:text-foreground"
                >
                  <User size={16} className="text-muted-foreground" />
                  <span className="text-[13px] font-semibold">Akun & Profil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1.5 bg-border" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-3 rounded-xl p-3 cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors"
                >
                  <LogOut size={16} />
                  <span className="text-[13px] font-bold">Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
