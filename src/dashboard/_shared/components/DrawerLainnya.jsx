import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  X,
  Truck,
  Wallet,
  BarChart2,
  BarChart3,
  Car,
  Calculator,
  User,
  Users,
  Package,
  RefreshCw,
  ClipboardList,
  ShoppingCart,
  CreditCard,
  History,
  Store,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { getBusinessModel } from '@/lib/businessModel'
import ThemePicker from '@/components/ui/ThemePicker'

const ICON_MAP = {
  Truck, Wallet, BarChart2, BarChart3, Car, Calculator, User, Users,
  Package, RefreshCw, ClipboardList, ShoppingCart, CreditCard, History, Store,
}

export default function DrawerLainnya({ isOpen, onClose, userType }) {
  const { profile, tenant } = useAuth()
  const navigate = useNavigate()
  const model = getBusinessModel(userType, profile?.sub_type)

  const isOwner = profile?.role === 'owner'
  const isStaff = profile?.role === 'staff'
  const isViewOnly = profile?.role === 'view_only'

  const filteredMenu = model.drawerMenu.filter(item => {
    // Global restriction for Harga Pasar
    if (item.label === 'Harga Pasar') {
      return (tenant?.sub_type === 'broker_ayam' || tenant?.business_vertical === 'poultry_broker')
    }

    if (userType !== 'broker') return true // only apply to broker
    
    if (isOwner) return true
    if (isStaff) {
      return ['Pengiriman & Loss', 'Harga Pasar', 'Akun & Profil'].includes(item.label)
    }
    if (isViewOnly) {
      return ['Harga Pasar', 'Akun & Profil'].includes(item.label)
    }
    if (profile?.role === 'sopir') {
      return false
    }
    return true
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-bg-1 border-t border-border/10 rounded-t-[32px] z-[1001] pb-[env(safe-area-inset-bottom,24px)] min-h-[50vh] max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="w-10 h-1.5 bg-muted/20 rounded-full mx-auto my-4" />

            <div className="px-6 pb-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="font-display text-lg font-bold">Layanan Lainnya</h2>
                  <p className="text-xs text-muted-foreground">Eksplorasi fitur {model.label}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-muted/5 rounded-full text-muted-foreground">
                  <X size={20} />
                </button>
              </div>

              {/* Theme Picker */}
              <div className="mb-6 p-4 bg-background/50 border border-border/5 rounded-2xl">
                <ThemePicker />
              </div>

              {/* Menu List */}
              <div className="space-y-2">
                {filteredMenu.map((item, idx) => {
                  const Icon = ICON_MAP[item.icon] || User
                  return (
                    <motion.div
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        navigate(item.path)
                        onClose()
                      }}
                      className="flex items-center gap-4 p-4 bg-background/50 border border-border/5 rounded-2xl cursor-pointer hover:border-primary/20 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-muted/5 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Icon size={20} />
                      </div>
                      <span className="flex-1 font-body text-[15px] font-medium text-foreground/90">
                        {item.label}
                      </span>
                      <ChevronRight size={16} className="text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
