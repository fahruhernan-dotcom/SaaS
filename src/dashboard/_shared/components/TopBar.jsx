import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search, User } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical, BUSINESS_MODELS } from '@/lib/businessModel'
import NotificationBell from './NotificationBell'

export default function TopBar({ title, subtitle, showBack = false, rightAction, showBell = true }) {
  const navigate = useNavigate()
  const { profile, tenant } = useAuth()
  const vertical = resolveBusinessVertical(profile, tenant)
  const model = BUSINESS_MODELS[vertical]
  const color = model?.color || '#10B981'

  return (
    <motion.header 
      // ... (keeping previous animation props)
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="px-5 lg:px-6 pt-10 lg:pt-4 pb-4 lg:pb-5 flex items-center justify-between sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-50 border-b border-white/5 min-h-[60px] lg:min-h-[64px]"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {showBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            style={{ borderColor: `${color}33`, color: color }}
            className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl lg:rounded-lg bg-white/5 border active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} className="lg:w-4 lg:h-4" />
          </Button>
        )}
        <div className="text-left flex-1 min-w-0">
          <h1 className="font-display text-lg lg:text-xl font-black text-white tracking-tight uppercase leading-none truncate">{title}</h1>
          {subtitle && (
            <p className="text-[10px] lg:text-xs font-bold text-[#4B6478] uppercase mt-1 lg:mt-1.5 tracking-widest truncate">{subtitle}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {rightAction}
        {showBell && <NotificationBell />}
        {!rightAction && !showBell && (
            <div className="flex items-center gap-2 lg:gap-3">
                <Button variant="ghost" size="icon" className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl lg:rounded-lg bg-white/5 border border-white/10 text-[#4B6478]">
                    <Search size={18} className="lg:w-4 lg:h-4" />
                </Button>
                <div 
                  style={{ background: `${color}11`, borderColor: `${color}22` }}
                  className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl lg:rounded-lg border flex items-center justify-center"
                >
                    <User size={18} style={{ color: color }} className="lg:w-4 lg:h-4" />
                </div>
            </div>
        )}
      </div>
    </motion.header>
  )
}


