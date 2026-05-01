import { useState } from 'react'
import { useOutletContext, useLocation } from 'react-router-dom'
import { Users, Shield, Menu } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import Tim from './Tim'
import AnakKandangPage from "../../components/anak-kandang/AnakKandangPage"

// Species yang mendukung AnakKandangPage (ruminansia penggemukan)
const SUPPORTS_ANAK_KANDANG = ['domba', 'kambing', 'sapi']

function getAnimalType(pathname) {
  for (const t of SUPPORTS_ANAK_KANDANG) {
    if (pathname.includes(t)) return t
  }
  return null
}

export default function TimManajemenPage() {
  const { setSidebarOpen } = useOutletContext() || {}
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const location = useLocation()

  const animalType = getAnimalType(location.pathname)
  const hasAnakKandang = !!animalType

  const TABS = [
    ...(hasAnakKandang ? [{ id: 'anak-kandang', label: 'Anak Kandang', icon: Users, desc: 'Pekerja & gaji' }] : []),
    { id: 'tim', label: 'Tim & Akses', icon: Shield, desc: 'Anggota & undangan' },
  ]

  const [activeTab, setActiveTab] = useState(hasAnakKandang ? 'anak-kandang' : 'tim')

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Mobile sticky header with tab switcher ─────────────────────────── */}
      {!isDesktop && (
        <header className="sticky top-0 z-30 bg-[#06090F]/80 backdrop-blur-md border-b border-white/5">
          <div className="h-14 px-4 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen?.(true)}
              className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 active:scale-90 transition-transform"
            >
              <Menu size={16} className="text-[#94A3B8]" />
            </button>
            {/* Tab pills */}
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
                      active
                        ? 'bg-white/[0.08] text-white shadow-sm'
                        : 'text-[#4B6478] hover:text-white/60'
                    )}
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

      {/* ── Desktop tab bar ─────────────────────────────────────────────────── */}
      {isDesktop && (
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-end gap-6 border-b border-white/[0.06] mb-0">
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'pb-3 flex items-center gap-2 text-sm font-bold border-b-2 transition-all -mb-px',
                    active
                      ? 'border-emerald-400 text-white'
                      : 'border-transparent text-[#4B6478] hover:text-white/60'
                  )}
                >
                  <Icon size={15} className={active ? 'text-emerald-400' : ''} />
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

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {/* Hide headers inside children since we have our own tab header */}
        {activeTab === 'anak-kandang' && (
          <AnakKandangPage hideMobileHeader />
        )}
        {activeTab === 'tim' && (
          <Tim hideMobileHeader />
        )}
      </div>
    </div>
  )
}
