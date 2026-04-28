import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, User, Bell } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import NotificationBell from '@/dashboard/_shared/components/NotificationBell'

export function MobileHeader({ title, onMenuClick, onProfileClick, rightElement, profilePath }) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const initial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'L'

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick()
    } else {
      const path = profilePath || `/peternak/${profile?.sub_type || 'peternak_domba_penggemukan'}/akun`
      navigate(path)
    }
  }

  return (
    <header className="px-5 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-50 border-b border-white/5 min-h-[64px]">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button 
          onClick={onMenuClick || (() => window.dispatchEvent(new CustomEvent('open-mobile-sidebar')))}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] active:scale-95 transition-transform"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-[17px] font-bold text-white tracking-tight truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {rightElement || (
          <>
            <NotificationBell />
            <button 
              onClick={handleProfileClick}
              className="w-10 h-10 rounded-full bg-emerald-500 text-[#0A0E0C] border border-white/20 flex items-center justify-center cursor-pointer font-display text-[14px] font-bold tracking-tight shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
            >
              {initial}
            </button>
          </>
        )}
      </div>
    </header>
  )
}
