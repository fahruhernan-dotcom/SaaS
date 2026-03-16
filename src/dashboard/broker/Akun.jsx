import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, ChevronRight, Bell, Calculator, BarChart3, 
  HelpCircle, LogOut, CreditCard, Building, 
  ArrowLeftRight, ShieldCheck, Settings, Store,
  Check, Smartphone, Mail, Info, Trash2,
  Trophy, Star, Crown
} from 'lucide-react'
import { differenceInDays, isAfter } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import SlideModal from '@/dashboard/components/SlideModal'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } 
  }
}

export default function Akun() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { profile, user, tenant, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [openEditProfile, setOpenEditProfile] = useState(false)
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('❌ Gagal keluar')
    } else {
      queryClient.clear()
      navigate('/login')
      toast.success('👋 Berhasil keluar')
    }
  }

  // Trial Calculation
  const trialEnds = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : null
  const daysLeft = trialEnds ? differenceInDays(trialEnds, new Date()) : 0
  const isTrialActive = trialEnds ? isAfter(trialEnds, new Date()) : false
  const trialProgress = Math.max(0, Math.min(100, (daysLeft / 14) * 100))

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'BR'

  return (
    <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn("bg-[#06090F] min-h-screen pb-24 text-left", isDesktop && "pb-10")}
    >
      {/* TopBar */}
      {!isDesktop && (
        <header className="px-5 pt-8 pb-4 border-b border-white/5 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 flex flex-col gap-1">
            <h1 className="font-display text-xl font-black text-white tracking-tight leading-none uppercase">Akun</h1>
        </header>
      )}

      {/* Profil Section */}
      <div className="px-5 mt-6">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Card className="bg-gradient-to-b from-[#111C24] to-[#0C1319] border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Crown size={120} strokeWidth={1} />
              </div>
              <CardContent className="p-7">
                <div className="flex items-center gap-5">
                   <div className="w-20 h-20 rounded-[22px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-display text-3xl font-black text-emerald-400 shadow-inner relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {initials}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h2 className="font-display text-xl font-black text-[#F1F5F9] truncate leading-tight uppercase tracking-tight">{profile?.full_name}</h2>
                      <p className="text-[12px] font-bold text-[#4B6478] truncate mt-1 mb-2.5 lowercase">{user?.email}</p>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[9px] px-3 h-6 uppercase tracking-widest">
                        {profile?.user_type || 'BROKER'}
                      </Badge>
                   </div>
                </div>
                <Button 
                    variant="outline" 
                    onClick={() => setOpenEditProfile(true)}
                    className="w-full h-12 rounded-[18px] border-white/5 bg-secondary/15 text-[10px] font-black uppercase tracking-[0.2em] gap-2 mt-7 text-[#F1F5F9] hover:bg-secondary/20 hover:border-white/10 transition-all active:scale-95"
                >
                   <User size={14} strokeWidth={2.5} /> Edit Profil
                </Button>
              </CardContent>
            </Card>
        </motion.div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-8 mt-8 pb-10"
      >
        {/* Subscription Section */}
        <motion.div variants={fadeUp} className="px-5 space-y-3">
          <Label className="uppercase text-[10px] font-black tracking-[0.25em] text-[#4B6478] px-1 ml-1">Plan & Layanan</Label>
          <Card className="bg-[#111C24] border-white/5 rounded-[28px] p-6 space-y-5">
              <div className="flex justify-between items-center">
                  <div className="space-y-1">
                      <h3 className="font-display font-black text-white text-lg tracking-tight uppercase leading-none">{tenant?.plan || 'Starter Free'}</h3>
                      <p className="text-[11px] font-black text-[#4B6478] uppercase tracking-widest">Status Berlangganan</p>
                  </div>
                  {isTrialActive ? (
                     <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[9px] px-3 h-6 uppercase tracking-widest">TRIAL</Badge>
                  ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[9px] px-3 h-6 uppercase tracking-widest">AKTIF</Badge>
                  )}
              </div>

              {isTrialActive && (
                  <div className="space-y-3">
                      <div className="flex justify-between items-end">
                          <p className={cn(
                              "text-[11px] font-black uppercase tracking-wider",
                              daysLeft <= 3 ? "text-red-400" : "text-amber-500"
                          )}>
                              Berakhir dalam {daysLeft} hari
                          </p>
                          <p className="text-[11px] text-[#4B6478] font-black tabular-nums">{Math.round(trialProgress)}%</p>
                      </div>
                      <Progress value={trialProgress} className="h-2 bg-secondary/10 rounded-full overflow-hidden" 
                          indicatorClassName={cn(
                              "transition-all duration-500",
                              daysLeft <= 3 ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]" : "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                          )} 
                      />
                  </div>
              )}

              <Button className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.2em] gap-3 rounded-[20px] border-none shadow-[0_8px_30px_rgba(16,185,129,0.15)] active:scale-95 transition-all mt-2">
                  <CreditCard size={18} strokeWidth={2.5} /> Upgrade Plan
              </Button>
          </Card>
        </motion.div>

        {/* Bisnis Model Section */}
        <motion.div variants={fadeUp} className="px-5 space-y-3">
          <Label className="uppercase text-[10px] font-black tracking-[0.25em] text-[#4B6478] px-1 ml-1">Bisnis Model</Label>
          <Card className="bg-[#111C24] border-white/5 rounded-[22px] p-4 flex items-center gap-4 group hover:border-white/10 transition-all active:scale-[0.98]">
              <div className="w-12 h-12 rounded-[14px] bg-secondary/15 flex items-center justify-center text-2xl shadow-inner border border-white/5 group-hover:bg-emerald-500/10 transition-colors">
                🤝
              </div>
              <div className="flex-1">
                 <p className="text-xs font-black text-white uppercase tracking-wider leading-none mb-1.5">Broker / Pedagang</p>
                 <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-tight">Dashboard & Fitur Disesuaikan</p>
              </div>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-4 rounded-xl bg-secondary/10 border border-white/5 text-[9px] font-black uppercase tracking-[0.15em] text-[#F1F5F9] hover:bg-secondary/20"
                      >
                          Ganti
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#0C1319] border-white/10 rounded-[32px] p-8">
                      <AlertDialogHeader>
                          <AlertDialogTitle className="text-white font-display font-black tracking-tight uppercase text-2xl">Ganti Peran?</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-400 font-bold mt-2 text-[14px] leading-relaxed">
                              Dashboard dan menu Anda akan disesuaikan dengan role baru. Data lama tetap tersimpan namun tampilan akan berubah total.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-3 mt-8">
                          <AlertDialogCancel className="bg-secondary/10 border-none text-[#F1F5F9] rounded-2xl h-14 font-black uppercase tracking-widest text-[11px]">Batal</AlertDialogCancel>
                          <AlertDialogAction 
                              onClick={async () => {
                                  await supabase.from('profiles').update({ business_model_selected: false }).eq('auth_user_id', user.id)
                                  window.location.reload()
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] border-none"
                          >
                              Lanjutkan
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          </Card>
        </motion.div>

        {/* Aplikasi Menu */}
        <motion.div variants={fadeUp} className="px-5 space-y-3">
          <Label className="uppercase text-[10px] font-black tracking-[0.25em] text-[#4B6478] px-1 ml-1">Aplikasi</Label>
          <div className="bg-[#111C24] border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
              <MenuItem 
                  icon={Bell} label="Notifikasi" sub="Peringatan piutang & info harga" 
                  badge="Soon"
                  onClick={() => toast.info('Fitur notifikasi segera hadir!')}
              />
              <Separator className="bg-secondary/10 mx-5" />
              <MenuItem 
                  icon={Calculator} label="Simulator Margin" sub="Hitung profit simulasi rpa" 
                  onClick={() => navigate('/broker/simulator')}
              />
              <Separator className="bg-secondary/10 mx-5" />
              <MenuItem 
                  icon={BarChart3} label="Harga Pasar" sub="Pantau update live regional" 
                  onClick={() => navigate('/harga-pasar')}
              />
              <Separator className="bg-secondary/10 mx-5" />
              <MenuItem 
                  icon={Smartphone} label="Mobile App" sub="Tersedia di PlayStore & AppStore" 
                  onClick={() => toast.info('Aplikasi mobile sedang pengembangan')}
              />
              <Separator className="bg-secondary/10 mx-5" />
              <MenuItem 
                  icon={HelpCircle} label="Pusat Bantuan" sub="WhatsApp Center 24/7" 
                  onClick={() => window.open('https://wa.me/628123456789', '_blank')}
              />
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div variants={fadeUp} className="px-5 pt-4">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button 
                        variant="destructive" 
                        className="w-full h-15 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500 font-black text-[11px] uppercase tracking-[0.25em] gap-3 transition-all h-14 active:scale-95"
                    >
                        <LogOut size={20} strokeWidth={2.5} /> Keluar Aplikasi
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#0C1319] border-white/10 rounded-[32px] p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white font-display font-black tracking-tight uppercase text-2xl">Keluar sekarang?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400 font-bold mt-2">
                            Anda perlu login kembali untuk mengakses data dashboard Anda.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 mt-8">
                        <AlertDialogCancel className="bg-secondary/10 border-none text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[11px]">Batal</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] border-none"
                        >
                            Keluar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>

        <motion.footer variants={fadeUp} className="text-center pt-6 opacity-40">
            <p className="text-[9px] text-[#4B6478] font-black uppercase tracking-[0.4em]">
                TernakOS v2.0.0 • PRO EDITION
            </p>
        </motion.footer>
      </motion.div>

      {/* Edit Profile Modal */}
      <SlideModal title="Edit Profil" isOpen={openEditProfile} onClose={() => setOpenEditProfile(false)}>
         <ProfileForm profile={profile} onSuccess={() => { setOpenEditProfile(false); refetchProfile(); }} />
      </SlideModal>
    </motion.div>
  )
}

function MenuItem({ icon: Icon, label, sub, onClick, badge }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-5 p-5 cursor-pointer hover:bg-secondary/15 transition-all group active:bg-white/[0.05]"
    >
      <div className="w-11 h-11 rounded-[14px] bg-secondary/10 flex items-center justify-center text-[#94A3B8] group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all border border-transparent group-hover:border-emerald-500/20">
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2.5">
            <p className="text-[13px] font-black text-white leading-none uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{label}</p>
            {badge && <Badge className="h-4.5 px-2 text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black flex items-center justify-center uppercase tracking-widest leading-none">{badge}</Badge>}
        </div>
        <p className="text-[10px] text-[#4B6478] font-black uppercase tracking-wider mt-2 group-hover:text-[#F1F5F9]/40 transition-colors">{sub}</p>
      </div>
      <ChevronRight size={16} className="text-[#4B6478] group-hover:text-[#F1F5F9] group-hover:translate-x-1 transition-all" />
    </div>
  )
}

function ProfileForm({ profile, onSuccess }) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        business_name: profile?.tenants?.business_name || ''
    })

    const handleSave = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            // Update Profile
            await supabase.from('profiles').update({
                full_name: formData.full_name,
                phone: formData.phone
            }).eq('id', profile.id)

            // Update Tenant
            await supabase.from('tenants').update({
                business_name: formData.business_name
            }).eq('id', profile.tenant_id)

            toast.success('✅ Profil diperbarui')
            onSuccess()
        } catch (err) {
            toast.error('❌ Gagal memperbarui profil')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSave} className="space-y-6 pb-12 text-left">
            <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478]">Nama Lengkap</Label>
                <Input 
                    required
                    value={formData.full_name} 
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl pl-5 focus:border-emerald-500/50 transition-all uppercase text-[12px]"
                />
            </div>
            <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478]">Nama Bisnis</Label>
                <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" size={18} />
                    <Input 
                        required
                        value={formData.business_name} 
                        onChange={e => setFormData({...formData, business_name: e.target.value})}
                        className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl pl-12 focus:border-emerald-500/50 transition-all uppercase text-[12px]"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478]">Nomor HP</Label>
                <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" size={18} />
                    <Input 
                        required type="tel"
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="bg-[#111C24] border-white/10 h-14 font-black rounded-2xl pl-12 focus:border-emerald-500/50 transition-all"
                    />
                </div>
            </div>
            <Button 
                type="submit" 
                className="w-full h-16 bg-[#10B981] hover:bg-emerald-600 text-white font-black text-[12px] uppercase tracking-[0.25em] rounded-[22px] border-none shadow-[0_10px_30px_rgba(16,185,129,0.2)] mt-6 active:scale-95 transition-all"
                disabled={isLoading}
            >
                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
        </form>
    )
}

