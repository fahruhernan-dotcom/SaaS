import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Users, Shield, Menu } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import Tim from './Tim'

/**
 * ManajemenPage — shared tabbed wrapper untuk semua role.
 *
 * Props:
 *   roleConfig   — config dari timConfigs.js (accent, roleBadgeMap, dll)
 *   workerTab    — { id, label, icon, component: WorkerComponent }
 *                  Jika tidak diisi → langsung render Tim tanpa tab.
 */
export default function ManajemenPage({ roleConfig, workerTab }) {
  const { setSidebarOpen } = useOutletContext() || {}
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const TABS = [
    ...(workerTab
      ? [{ id: workerTab.id, label: workerTab.label, icon: workerTab.icon || Users, desc: 'Pekerja & gaji' }]
      : []),
    { id: 'tim', label: 'Tim & Akses', icon: Shield, desc: 'Anggota & undangan' },
  ]

  const [activeTab, setActiveTab] = useState(workerTab ? workerTab.id : 'tim')

  const accent = roleConfig?.accent || '#021a02'
  const _accentStyle = { color: accent, borderColor: accent }

  // If no workerTab → render Tim directly without any tab chrome
  if (!workerTab) {
    return <Tim roleConfig={roleConfig} />
  }

  const WorkerComponent = workerTab.component

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#06090F' }}>
      {/* Mobile sticky header */}
      {!isDesktop && (
        <header className="sticky top-0 z-30 backdrop-blur-md border-b border-white/5 pt-[env(safe-area-inset-top,0px)]"
          style={{ background: 'rgba(6,9,15,0.90)' }}>
          <div className="h-14 px-4 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen?.(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              style={{ background: `${accent}14`, border: `1px solid ${accent}2e` }}
            >
              <Menu size={18} style={{ color: accent }} />
            </button>
            <div className="flex gap-1.5 bg-white/[0.04] rounded-xl p-1 flex-1">
              {TABS.map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all',
                      active ? 'text-white shadow-sm' : 'text-[#4B6478] hover:text-white/60'
                    )}
                    style={active ? { background: accent } : {}}
                  >
                    <Icon size={12} />
                    <span className="hidden xs:inline">{tab.label.split(' ')[0]}</span>
                    <span>{tab.label.split(' ').slice(-1)[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </header>
      )}

      {/* Desktop tab bar */}
      {isDesktop && (
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-end gap-6 border-b border-white/[0.06]">
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'pb-3 flex items-center gap-2 text-sm font-bold border-b-2 transition-all -mb-px',
                    active ? 'text-white' : 'border-transparent text-[#4B6478] hover:text-white/60'
                  )}
                  style={active ? { borderBottomColor: accent } : {}}
                >
                  <Icon size={15} style={active ? { color: accent } : {}} />
                  {tab.label}
                  {active && tab.desc && (
                    <span className="text-[10px] font-normal text-[#4B6478] ml-1 hidden md:inline">
                      · {tab.desc}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === workerTab?.id && <WorkerComponent hideMobileHeader />}
        {activeTab === 'tim' && <Tim roleConfig={roleConfig} hideMobileHeader />}
      </div>
    </div>
  )
}
