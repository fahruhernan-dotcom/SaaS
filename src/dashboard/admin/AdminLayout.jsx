import React, { useState } from 'react'
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, Users, CreditCard, Tag, LogOut, Shield, 
  ArrowLeft, Activity, Bird, LayoutGrid, Menu as MenuIcon,
  ChevronRight, Settings, Info, HelpCircle
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { getXBasePath } from '@/lib/businessModel'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const PRIMARY_NAV = [
    { label: 'Overview',       shortLabel: 'Overview',  icon: Home,       path: '/admin' },
    { label: 'Users & Tenant', shortLabel: 'Users',     icon: Users,      path: '/admin/users' },
    { label: 'Subscriptions',  shortLabel: 'Billing',   icon: CreditCard, path: '/admin/subscriptions' },
    { label: 'Pricing',        shortLabel: 'Pricing',   icon: Tag,        path: '/admin/pricing' },
]

const SECONDARY_NAV = [
    { label: 'Activity Log',   shortLabel: 'Activity',  icon: Activity,   path: '/admin/activity' },
    { label: 'Settings',       shortLabel: 'Settings',  icon: Settings,   path: '/admin/settings' },
    { label: 'System Info',    shortLabel: 'Info',      icon: Info,       path: '/admin/info' },
    { label: 'Support',        shortLabel: 'Help',      icon: HelpCircle, path: '/admin/help' },
]

const ALL_NAV_ITEMS = [...PRIMARY_NAV, ...SECONDARY_NAV]

// ── Shared navigation logic ──────────────────────────────────────────────────
function useAdminNav() {
    const { user, switchTenant } = useAuth()
    const navigate = useNavigate()

    const handleBackToDashboard = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('tenant_id, tenants(id, sub_type, business_name, business_vertical)')
                .eq('auth_user_id', user.id)
            const target = data?.find(p => p.tenants)?.tenants
            if (!target) { navigate('/broker/broker_ayam/beranda'); return }
            localStorage.setItem('ternakos_active_tenant_id', target.id)
            switchTenant(target.id)
            await new Promise(r => setTimeout(r, 100))
            navigate(getXBasePath(target, null) + '/beranda')
        } catch {
            navigate('/broker/broker_ayam/beranda')
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return { handleBackToDashboard, handleLogout }
}

// ── Desktop Sidebar ──────────────────────────────────────────────────────────
function AdminSidebar() {
    const { profile } = useAuth()
    const location = useLocation()
    const { handleBackToDashboard, handleLogout } = useAdminNav()

    return (
        <aside className="fixed top-0 left-0 bottom-0 w-[240px] bg-[#0C1319] border-r border-white/8 flex flex-col z-50">
            <div className="p-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="TernakOS" className="w-8 h-8 rounded-lg" />
                    <div>
                        <h1 className="font-display font-black text-sm text-white tracking-tight uppercase leading-none">TernakOS</h1>
                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.2em] mt-0.5">Admin Panel</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-3 pt-3 pb-2">Menu</p>
                {ALL_NAV_ITEMS.map(item => {
                    const isActive = item.path === '/admin'
                        ? location.pathname === '/admin'
                        : location.pathname.startsWith(item.path)
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-black uppercase tracking-[0.15em] transition-all group relative overflow-hidden",
                                isActive
                                    ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent text-emerald-400"
                                    : "text-[#4B6478] hover:text-white hover:bg-white/[0.03]"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="admin-nav-active"
                                    className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[4px] h-10 bg-emerald-500 rounded-r-full shadow-[4px_0_20px_rgba(16,185,129,0.6)] z-20"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                            <item.icon
                                size={18}
                                strokeWidth={isActive ? 3 : 2}
                                className={cn(
                                    "transition-all duration-300",
                                    isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'opacity-50 group-hover:opacity-100'
                                )}
                            />
                            <span className="relative z-10">{item.label}</span>
                        </NavLink>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-2 px-2">
                    <Shield size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Superadmin</span>
                </div>
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <span className="font-display font-black text-emerald-400 text-[11px] uppercase">
                            {profile?.full_name?.substring(0, 2) || 'SA'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">{profile?.full_name || 'Superadmin'}</p>
                    </div>
                </div>
                <button
                    onClick={handleBackToDashboard}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold bg-white/5 text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider"
                >
                    <ArrowLeft size={14} />
                    <span>Kembali ke Dashboard</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-[#4B6478] hover:text-red-400 hover:bg-red-500/5 transition-all uppercase tracking-wider"
                >
                    <LogOut size={14} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    )
}

// ── Mobile Top Bar ───────────────────────────────────────────────────────────
function AdminTopBar({ onOpenMenu }) {
    const { profile } = useAuth()
    const location = useLocation()

    const currentPage = ALL_NAV_ITEMS.find(item =>
        item.path === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.path)
    )

    return (
        <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] z-50 transition-all duration-500 pt-[env(safe-area-inset-top)]">
            <div className="mx-2 lg:mx-6 mt-2">
                <div className="h-14 lg:h-16 bg-[#0B1218]/80 backdrop-blur-xl border border-white/8 rounded-2xl lg:rounded-3xl flex items-center justify-between px-3 lg:px-6 shadow-2xl shadow-black/50">
                    <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl lg:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                            <Bird className="text-white w-5 h-5 lg:w-6 lg:h-6" />
                        </div>
                        <div className="hidden lg:block">
                            <p className="font-display font-black text-[10px] text-emerald-400 uppercase tracking-[0.2em] leading-none mb-1">TernakOS</p>
                            <p className="font-display font-bold text-lg text-white leading-none tracking-tight">Admin<span className="text-emerald-500">Suite</span></p>
                        </div>
                        <div className="lg:hidden pr-4 border-r border-white/5">
                            <p className="font-display font-black text-[8px] text-emerald-500/60 uppercase tracking-[0.18em] leading-none">Admin Panel</p>
                            <p className="font-display font-bold text-[13px] text-white leading-tight mt-0.5 tracking-tight">
                                {currentPage?.label || 'Dashboard'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                         <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">LIVE</span>
                        </div>
                        <button
                            onClick={onOpenMenu}
                            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform relative overflow-hidden group shadow-lg"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="font-display font-black text-emerald-400 text-[10px] uppercase relative z-10">
                                {profile?.full_name?.substring(0, 2) || 'SA'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}

// ── Mobile Bottom Nav ────────────────────────────────────────────────────────
function AdminBottomNav({ onOpenMenu }) {
    const location = useLocation()

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] z-40 p-2 lg:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-6 pointer-events-none">
            <div className="max-w-md mx-auto h-16 bg-[#0B1218]/90 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-between px-2 shadow-2xl pointer-events-auto">
                {PRIMARY_NAV.map((item) => {
                    const isActive = location.pathname === item.path
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-300 gap-1.5 ${
                                isActive ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            <Icon size={isActive ? 20 : 18} className={isActive ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''} />
                            <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.shortLabel}</span>
                        </Link>
                    )
                })}
                
                <button
                    onClick={onOpenMenu}
                    className="flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-300 gap-1.5 text-slate-500 hover:text-emerald-400"
                >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center active:scale-90 transition-transform">
                        <LayoutGrid size={18} />
                    </div>
                </button>
            </div>
        </nav>
    )
}

// ── Mobile Menu Hub ────────────────────────────────────────────────────────
function AdminMenuHub({ isOpen, onClose }) {
    const { profile } = useAuth()
    const { handleBackToDashboard, handleLogout } = useAdminNav()

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose()
                        }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100.5%' }}
                        transition={{ type: 'spring', stiffness: 420, damping: 36, mass: 0.8 }}
                        className="relative mt-auto bg-[#080C10] rounded-t-[2.5rem] border-t border-white/[0.08] p-4 lg:p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] max-w-[480px] w-full mx-auto shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
                    >
                        <div className="w-12 h-1.5 rounded-full bg-white/10 mx-auto mb-6 active:bg-white/20 transition-colors" />

                        <div className="px-2 mb-6">
                            <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.25em] mb-3">Pusat Navigasi</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner">
                                        <span className="font-display font-black text-emerald-400 text-lg uppercase">
                                            {profile?.full_name?.substring(0, 2) || 'SA'}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="font-display font-black text-xl text-white leading-tight">Halo, {profile?.full_name?.split(' ')[0] || 'Admin'}!</h2>
                                        <div className="flex items-center gap-1.5 mt-1 opacity-60">
                                            <Shield size={10} className="text-emerald-400" />
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.1em]">Superadmin Access</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                                    <ChevronRight size={20} className="rotate-90" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {SECONDARY_NAV.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-300">
                                        <item.icon size={22} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={() => { handleBackToDashboard(); onClose() }}
                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                        <ArrowLeft size={16} className="text-slate-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-black text-white leading-none">Ke Dashboard</p>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase tracking-wider">Beranda Peternak</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-700" />
                            </button>
                            
                            <button
                                onClick={() => { handleLogout(); onClose() }}
                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10 active:scale-[0.98] transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-colors">
                                        <LogOut size={16} className="text-red-400" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-black text-red-400 leading-none">Logout Keluar</p>
                                        <p className="text-[10px] text-red-500/40 font-bold mt-1.5 uppercase tracking-wider">Akhiri Sesi Admin</p>
                                    </div>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                                     <ChevronRight size={14} className="text-red-500/30" />
                                </div>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

// ── Main Layout ──────────────────────────────────────────────────────────────
export default function AdminLayout({ children }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-[#06090F] selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden relative">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-purple-500/5 blur-[100px] rounded-full" />
                <div className="absolute top-[40%] left-[10%] w-[20%] h-[20%] bg-blue-500/3 blur-[80px] rounded-full" />
            </div>

            {isDesktop ? (
                <>
                    <AdminSidebar />
                    <main className="lg:pl-[240px] pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))] relative z-10 transition-all duration-500">
                        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={window.location.pathname}
                                    initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    {children || <Outlet />}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </main>
                </>
            ) : (
                <div className="max-w-[480px] mx-auto shadow-2xl relative z-10">
                    <AdminTopBar onOpenMenu={() => setMenuOpen(true)} />
                    <main className="pt-20 pb-28">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={window.location.pathname}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="px-4"
                            >
                                {children || <Outlet />}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                    <AdminBottomNav onOpenMenu={() => setMenuOpen(true)} />
                    <AdminMenuHub isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
                </div>
            )}
        </div>
    )
}

