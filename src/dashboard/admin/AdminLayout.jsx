import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Users, CreditCard, Tag, LogOut, Shield, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
    { label: 'Overview', icon: Home, path: '/admin' },
    { label: 'Users & Tenant', icon: Users, path: '/admin/users' },
    { label: 'Subscriptions', icon: CreditCard, path: '/admin/subscriptions' },
    { label: 'Pricing', icon: Tag, path: '/admin/pricing' },
]

// --- Desktop Sidebar ---
function AdminSidebar() {
    const { user, profile, profiles, switchTenant } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleBackToDashboard = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('tenant_id, tenants(id, business_name, business_vertical)')
                .eq('auth_user_id', user.id)

            if (error || !data?.length) {
                navigate('/broker/poultry_broker/beranda')
                return
            }

            // Ambil tenant pertama yang punya data tenants
            const target = data.find(p => p.tenants)?.tenants

            if (!target) {
                navigate('/broker/poultry_broker/beranda')
                return
            }

            // Set localStorage dulu
            localStorage.setItem('ternakos_active_tenant_id', target.id)

            // Switch tenant context
            switchTenant(target.id)

            // Tunggu sebentar agar state update
            await new Promise(resolve => setTimeout(resolve, 100))

            // Navigate sesuai vertikal
            const v = target.business_vertical
            if (v === 'egg_broker') {
                navigate('/egg/beranda')
            } else if (v === 'peternak') {
                navigate('/peternak/beranda')
            } else if (v === 'rpa') {
                navigate('/rumah_potong/rpa/beranda')
            } else {
                navigate('/broker/poultry_broker/beranda')
            }
        } catch (err) {
            console.error('Back to dashboard error:', err)
            navigate('/broker/poultry_broker/beranda')
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    return (
        <aside className="fixed top-0 left-0 bottom-0 w-[240px] bg-[#0C1319] border-r border-white/8 flex flex-col z-50">
            {/* Logo */}
            <div className="p-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="TernakOS" className="w-8 h-8 rounded-lg" />
                    <div>
                        <h1 className="font-display font-black text-sm text-white tracking-tight uppercase leading-none">TernakOS</h1>
                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.2em] mt-0.5">Admin Panel</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
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
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all group relative",
                                isActive
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "text-[#4B6478] hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="admin-nav-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-500 rounded-r-full"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                            <item.icon size={16} strokeWidth={2.5} className={cn(isActive ? 'text-emerald-400' : 'text-[#4B6478] group-hover:text-white')} />
                            <span>{item.label}</span>
                        </NavLink>
                    )
                })}
            </nav>

            {/* Footer */}
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

// --- Mobile Bottom Nav ---
function AdminBottomNav() {
    const location = useLocation()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0C1319]/95 backdrop-blur-xl border-t border-white/8 max-w-[480px] mx-auto">
            <div className="grid grid-cols-4 h-16">
                {NAV_ITEMS.map(item => {
                    const isActive = item.path === '/admin'
                        ? location.pathname === '/admin'
                        : location.pathname.startsWith(item.path)

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="flex flex-col items-center justify-center gap-0.5 relative"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="admin-bottom-active"
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-emerald-500 rounded-b-full"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                            <item.icon
                                size={18}
                                strokeWidth={2.5}
                                className={cn(
                                    "transition-colors",
                                    isActive ? "text-emerald-400" : "text-[#4B6478]"
                                )}
                            />
                            <span className={cn(
                                "text-[8px] font-black uppercase tracking-widest",
                                isActive ? "text-emerald-400" : "text-[#4B6478]"
                            )}>
                                {item.label.split(' ')[0]}
                            </span>
                        </NavLink>
                    )
                })}
            </div>
        </nav>
    )
}

// --- Main Layout ---
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
        <div className="bg-[#06090F] min-h-screen max-w-[480px] mx-auto relative pb-20 shadow-2xl overflow-x-hidden">
            {children}
            <AdminBottomNav />
        </div>
    )
}
