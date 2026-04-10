import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Users, CreditCard, Tag, LogOut, Shield, ArrowLeft, Activity } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { getXBasePath } from '@/lib/businessModel'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
    { label: 'Overview',       shortLabel: 'Overview',  icon: Home,       path: '/admin' },
    { label: 'Users & Tenant', shortLabel: 'Users',     icon: Users,      path: '/admin/users' },
    { label: 'Subscriptions',  shortLabel: 'Billing',   icon: CreditCard, path: '/admin/subscriptions' },
    { label: 'Pricing',        shortLabel: 'Pricing',   icon: Tag,        path: '/admin/pricing' },
    { label: 'Activity Log',   shortLabel: 'Activity',  icon: Activity,   path: '/admin/activity' },
]

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
                {NAV_ITEMS.map(item => {
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
function AdminTopBar() {
    const { profile } = useAuth()
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)
    const { handleBackToDashboard, handleLogout } = useAdminNav()

    const currentPage = NAV_ITEMS.find(item =>
        item.path === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.path)
    )

    return (
        <>
            <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 h-14 flex items-center justify-between px-4 bg-[#0C1319]/96 backdrop-blur-xl border-b border-white/[0.06]">
                {/* Left: shield + page title */}
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Shield size={13} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="font-display font-black text-[9px] text-emerald-400 uppercase tracking-[0.18em] leading-none">Admin Panel</p>
                        <p className="font-display font-bold text-[13px] text-white leading-tight mt-0.5 tracking-tight">
                            {currentPage?.label || 'Admin'}
                        </p>
                    </div>
                </div>

                {/* Right: live pill + user avatar */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.07]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">LIVE</span>
                    </div>
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center active:scale-95 transition-transform"
                        aria-label="User menu"
                    >
                        <span className="font-display font-black text-emerald-400 text-[10px] uppercase">
                            {profile?.full_name?.substring(0, 2) || 'SA'}
                        </span>
                    </button>
                </div>
            </header>

            {/* Slide-up menu sheet */}
            <AnimatePresence>
                {menuOpen && (
                    <div className="fixed inset-0 z-[60] flex flex-col">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                            className="relative mt-auto bg-[#0C1319] rounded-t-3xl border-t border-white/[0.08] p-5 pb-10 max-w-[480px] w-full mx-auto"
                        >
                            {/* Handle */}
                            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

                            {/* User info */}
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
                                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                    <span className="font-display font-black text-emerald-400 text-sm uppercase">
                                        {profile?.full_name?.substring(0, 2) || 'SA'}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm leading-tight">{profile?.full_name || 'Superadmin'}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Shield size={10} className="text-emerald-400" />
                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Superadmin</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => { handleBackToDashboard(); setMenuOpen(false) }}
                                    className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-sm font-bold text-[#94A3B8] active:scale-[0.98] transition-all text-left"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                        <ArrowLeft size={15} className="text-[#4B6478]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-tight">Kembali ke Dashboard</p>
                                        <p className="text-[10px] text-[#4B6478] mt-0.5">Keluar dari Admin Panel</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { handleLogout(); setMenuOpen(false) }}
                                    className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-red-500/5 border border-red-500/10 active:scale-[0.98] transition-all text-left"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                        <LogOut size={15} className="text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-red-400 leading-tight">Logout</p>
                                        <p className="text-[10px] text-red-400/50 mt-0.5">Keluar dari akun</p>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}

// ── Mobile Bottom Nav ────────────────────────────────────────────────────────
function AdminBottomNav() {
    const location = useLocation()

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-[#0C1319]/96 backdrop-blur-xl border-t border-white/[0.07]">
            <div className="grid grid-cols-5 h-16">
                {NAV_ITEMS.map(item => {
                    const isActive = item.path === '/admin'
                        ? location.pathname === '/admin'
                        : location.pathname.startsWith(item.path)

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="flex flex-col items-center justify-center gap-0.5 relative active:scale-90 transition-transform"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="admin-bottom-active"
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-emerald-500 rounded-b-full shadow-[0_2px_10px_rgba(16,185,129,0.5)]"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                            <item.icon
                                size={18}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={cn(
                                    "transition-all duration-200",
                                    isActive
                                        ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                                        : "text-[#4B6478]"
                                )}
                            />
                            <span className={cn(
                                "text-[8px] font-black uppercase tracking-widest leading-none",
                                isActive ? "text-emerald-400" : "text-[#4B6478]"
                            )}>
                                {item.shortLabel}
                            </span>
                        </NavLink>
                    )
                })}
            </div>
        </nav>
    )
}

// ── Main Layout ──────────────────────────────────────────────────────────────
export default function AdminLayout({ children }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')

    if (isDesktop) {
        return (
            <div className="min-h-screen bg-[#06090F]">
                <AdminSidebar />
                <main className="ml-[240px] min-h-screen">
                    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="bg-[#06090F] min-h-screen max-w-[480px] mx-auto shadow-2xl">
            <AdminTopBar />
            <main className="pt-14 pb-20 overflow-x-hidden">
                {children}
            </main>
            <AdminBottomNav />
        </div>
    )
}
