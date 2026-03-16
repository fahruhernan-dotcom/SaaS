import React from 'react'
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
  LogOut,
  Bell
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

export default function AppSidebar() {
  const { user, profile, tenant } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const tenantInitials = tenant?.business_name?.slice(0, 2).toUpperCase() || 'TO'
  const userInitials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const navMain = [
    {
      label: 'UTAMA',
      items: [
        { title: 'Beranda',    url: '/broker/beranda',   icon: Home },
        { title: 'Transaksi',  url: '/broker/transaksi', icon: ArrowLeftRight },
        { title: 'RPA & Piutang', url: '/broker/rpa',   icon: Building2 },
        { title: 'Kandang',    url: '/broker/kandang',   icon: Warehouse },
      ]
    },
    {
      label: 'OPERASIONAL',
      items: [
        { title: 'Pengiriman', url: '/broker/pengiriman', icon: Truck },
        { title: 'Cash Flow',  url: '/broker/cashflow',  icon: Wallet },
        { title: 'Armada',     url: '/broker/armada',    icon: Car },
      ]
    },
    {
      label: 'ANALISIS',
      items: [
        { title: 'Harga Pasar', url: '/harga-pasar',    icon: BarChart2 },
        { title: 'Simulator',   url: '/broker/simulator', icon: Calculator },
      ]
    }
  ]

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
        <div className="flex items-center gap-2.5 px-1 py-2 cursor-pointer" onClick={() => navigate('/broker/beranda')}>
          <img src="/logo.png" alt="TernakOS Icon" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
          <div className="">
            <p className="font-display font-extrabold text-[15px] text-foreground leading-none">
              TernakOS
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Broker Dashboard
            </p>
          </div>
        </div>
        
        {/* Tenant selector */}
        <SidebarMenu className="mt-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="bg-secondary border border-border rounded-xl   group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent"
            >
              <div className="w-7 h-7 rounded-md bg-emerald-500/15 flex items-center justify-center text-[11px] font-display font-extrabold text-emerald-400 flex-shrink-0">
                {tenantInitials}
              </div>
              <div className="flex-1 overflow-hidden  text-left ml-2">
                <p className="text-[13px] font-semibold truncate leading-tight">
                  {tenant?.business_name || 'My Business'}
                </p>
                <p style={{
                  fontSize: '11px',
                  color: 'hsl(var(--muted-foreground))',
                  margin: 0,
                  letterSpacing: '0.3px'
                }}>
                  Broker Dashboard
                </p>
              </div>
              <ChevronsUpDown size={14} className="text-muted-foreground  ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {navMain.map((group) => (
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
                    <p className="text-[11px] text-muted-foreground truncate font-medium">
                      {user?.email}
                    </p>
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
