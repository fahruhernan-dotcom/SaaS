import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, Grid, Smartphone, Wallet, Map, 
  ClipboardList, User, List, Activity, 
  TrendingUp, Target, Users, Settings, 
  X, ChevronDown, LogOut 
} from 'lucide-react'

const DRAWER_GROUPS = [
  {
    label: 'Utama',
    items: [
      { id: 'home',    icon: Home,         label: 'Beranda' },
      { id: 'batch',   icon: Grid,         label: 'Batch Aktif' },
      { id: 'ternak',  icon: Smartphone,   label: 'Data Ternak' },
      { id: 'sales',   icon: Wallet,       label: 'Penjualan' },
      { id: 'kandang', icon: Map,          label: 'Denah Kandang' },
    ],
  },
  {
    label: 'Tugas',
    items: [
      { id: 'tasks',   icon: ClipboardList, label: 'Tugas Harian' },
      { id: 'assign',  icon: Users,         label: 'Penugasan' },
      { id: 'taskset', icon: List,          label: 'Pengaturan Tugas' },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { id: 'health',  icon: Activity,      label: 'Kesehatan' },
      { id: 'feed',    icon: Smartphone,    label: 'Pakan' },
      { id: 'finance', icon: TrendingUp,    label: 'Keuangan' },
      { id: 'reports', icon: Target,        label: 'Laporan' },
    ],
  },
  {
    label: 'Akun',
    items: [
      { id: 'profile', icon: User,          label: 'Profil Saya' },
      { id: 'team',    icon: Users,         label: 'Tim & Akses' },
      { id: 'settings', icon: Settings,     label: 'Pengaturan' },
    ],
  },
]

export function MobileSideDrawer({ open, onClose, activeTab, onTabClick, userName = 'Peternak', userRole = 'Owner' }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] pointer-events-auto">
          {/* Scrim / Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          {/* Panel */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 left-0 bottom-0 w-[82%] max-w-[320px] bg-[#0A0F0E] border-r border-white/10 shadow-[8px_0_32px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Header — Branding */}
            <div className="pt-16 pb-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-[#0A0E0C] flex items-center justify-center font-display text-[17px] font-bold tracking-tighter">
                  T
                </div>
                <div>
                  <div className="font-display text-[18px] font-bold text-white tracking-tight leading-tight">
                    TernakOS
                  </div>
                  <div className="text-[12px] text-[#94A3B8] mt-0.5 font-medium">Dashboard Peternak</div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 text-[#94A3B8] flex items-center justify-center active:scale-90 transition-transform"
              >
                <X size={18} />
              </button>
            </div>

            {/* Farm Switcher */}
            <div className="px-4 mb-3">
              <button className="w-full text-left bg-white/[0.03] border border-white/10 rounded-2xl p-3 flex items-center gap-3 active:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Grid size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-white tracking-tight truncate">Unit Penggemukan A</div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5 font-medium">Fattening Domba</div>
                </div>
                <ChevronDown size={14} className="text-[#4B6478]" />
              </button>
            </div>

            {/* Menu Groups */}
            <div className="flex-1 overflow-y-auto px-3.5 pb-6 custom-scrollbar">
              {DRAWER_GROUPS.map(group => (
                <div key={group.label} className="mb-5">
                  <div className="text-[10px] font-bold tracking-[0.12em] text-[#4B6478] uppercase px-3 mb-1.5">
                    {group.label}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map(it => {
                      const active = activeTab === it.id
                      const Icon = it.icon
                      return (
                        <button 
                          key={it.id} 
                          onClick={() => { onTabClick(it.id); onClose(); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-left transition-all ${
                            active 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : 'bg-transparent text-white border border-transparent'
                          }`}
                        >
                          <span className={`${active ? 'text-emerald-500' : 'text-[#94A3B8]'}`}>
                            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                          </span>
                          <span className={`text-[14px] ${active ? 'font-bold' : 'font-medium'}`}>
                            {it.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Profile */}
            <div className="p-4 border-t border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-display text-[13px] font-bold">
                {userName.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-white tracking-tight truncate">{userName}</div>
                <div className="text-[11px] text-[#94A3B8] font-medium">{userRole}</div>
              </div>
              <button className="text-[#94A3B8] p-1 active:scale-90 transition-transform">
                <LogOut size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
