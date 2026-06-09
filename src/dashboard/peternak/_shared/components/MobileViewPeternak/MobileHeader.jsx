import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import NotificationBell from '@/dashboard/_shared/components/NotificationBell'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return 'pagi'
  if (h < 15) return 'siang'
  if (h < 19) return 'sore'
  return 'malam'
}

export function MobileHeader({ title, onMenuClick, onProfileClick, rightElement, profilePath, showGreeting, businessLabel }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const initial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'L'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Peternak'

  const [theme, setTheme] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('ternakos_theme_mode') || 'light'
      }
    } catch {
      // ignore
    }
    return 'light'
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    const handler = () => {
      try {
        setTheme(localStorage.getItem('ternakos_theme_mode') || 'light')
      } catch {
        // ignore
      }
    }
    window.addEventListener('ternakos-theme-mode-changed', handler)
    return () => window.removeEventListener('ternakos-theme-mode-changed', handler)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    try {
      localStorage.setItem('ternakos_theme_mode', nextTheme)
      window.dispatchEvent(new CustomEvent('ternakos-theme-mode-changed'))
    } catch {
      // ignore
    }
  }

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick()
    } else {
      const path = profilePath || `/peternak/${profile?.sub_type || 'peternak_domba_penggemukan'}/akun`
      navigate(path)
    }
  }

  const rightButtons = rightElement || (
    <>
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-[#94A3B8] active:scale-95 transition-transform"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      <NotificationBell />
      <button
        onClick={handleProfileClick}
        className="w-10 h-10 rounded-full bg-emerald-500 text-[#0A0E0C] border border-white/20 flex items-center justify-center cursor-pointer font-display text-[14px] font-bold tracking-tight shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
      >
        {initial}
      </button>
    </>
  )

  if (showGreeting) {
    return (
      <header className="relative overflow-hidden">
        {/* Pasture hero photo */}
        <img
          src="/ui-pasture.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAFAFA] via-[#FAFAFA]/70 to-transparent dark:from-[#06090F] dark:via-[#06090F]/70 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] via-transparent to-transparent dark:from-[#06090F] dark:via-transparent dark:to-transparent" />

        <div className="relative px-5 pt-12 pb-3.5 flex items-center justify-between">
          <div>
            {businessLabel && (
              <p className="text-[10px] text-emerald-700/80 dark:text-green-400/60 font-black uppercase tracking-[0.2em] mb-1">
                {businessLabel}
              </p>
            )}
            <h1 className="font-['Sora'] font-black text-[22px] text-slate-900 dark:text-white tracking-tight leading-tight" suppressHydrationWarning>
              Selamat {getGreeting()},{' '}
              <span className="text-emerald-600 dark:text-green-400/90">{firstName}</span> 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">{rightButtons}</div>
        </div>
      </header>
    )
  }

  return (
    <header className="px-5 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#06090F]/80 backdrop-blur-md z-50 border-b border-slate-200 dark:border-white/5 min-h-[64px]">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={onMenuClick || (() => window.dispatchEvent(new CustomEvent('open-mobile-sidebar')))}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-[#94A3B8] active:scale-95 transition-transform"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight truncate">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">{rightButtons}</div>
    </header>
  )
}
