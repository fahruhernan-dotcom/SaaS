import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, User, Package, MapPin, 
  Clock, CheckCircle2, AlertCircle,
  Phone, ChevronRight, LogOut,
  Navigation, CheckCircle, Save, X
} from 'lucide-react'
import { format, isAfter, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { formatIDR, formatWeight, formatEkor, safeNumber } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { InputNumber } from '@/components/ui/InputNumber'
import { useUpdateDelivery } from '@/lib/hooks/useUpdateDelivery'

export default function SopirDashboard() {
  const { profile, user, tenant } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { updateTiba } = useUpdateDelivery()
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  
  // --- SUB-TASK: FIND DRIVER ID ---
  // If driver_id is not in profile, we find it by phone
  const { data: driverInfo } = useQuery({
    queryKey: ['my-driver-record', profile?.id],
    queryFn: async () => {
      // Priority 1: Search by profile.id (if column exists)
      // Priority 2: Search by phone match
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, phone')
        .or(`phone.eq.${profile?.phone},full_name.eq.${profile?.full_name}`)
        .eq('tenant_id', profile?.tenant_id)
        .eq('is_deleted', false)
        .limit(1)
        .single()
      
      if (error) return null
      return data
    },
    enabled: !!profile?.id
  })

  // --- QUERY DELIVERIES ---
  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ['my-deliveries', driverInfo?.id],
    queryFn: async () => {
      if (!driverInfo?.id) return []
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          sales(
            total_weight_kg, price_per_kg,
            rpa_clients(rpa_name),
            purchases(farms(farm_name, location))
          )
        `)
        .eq('driver_id', driverInfo.id)
        .eq('is_deleted', false)
        .in('status', ['preparing', 'loading', 'on_route', 'arrived'])
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!driverInfo?.id
  })

  // --- MUTATIONS ---
  const updateStatus = async (deliveryId, newStatus) => {
    const { error } = await supabase
      .from('deliveries')
      .update({ status: newStatus })
      .eq('id', deliveryId)
    
    if (error) {
      toast.error('Gagal update status')
    } else {
      toast.success(`Status diperbarui ke ${newStatus}`)
      queryClient.invalidateQueries(['my-deliveries'])
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleCloseUpdateSheet = React.useCallback(() => setIsUpdateSheetOpen(false), [])
  const handleUpdateSuccess = React.useCallback(() => queryClient.invalidateQueries(['my-deliveries']), [queryClient])

  // --- RENDER ---
  return (
    <div className="bg-[#06090F] min-h-screen text-[#F1F5F9] font-body relative">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-start sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-40 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-lg">🐔</div>
            <h1 className="font-display text-xl font-black tracking-tighter uppercase">TernakOS</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#4B6478] uppercase tracking-widest">{profile?.full_name}</span>
            <Badge className="bg-purple-500/10 text-purple-400 border-none text-[8px] font-black uppercase px-2 py-0.5">SOPIR</Badge>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleLogout}
          className="text-[#4B6478] hover:text-red-400 hover:bg-red-400/10 rounded-xl"
        >
          <LogOut size={20} />
        </Button>
      </header>

      <main className="px-6 py-8 space-y-6 pb-24">
        <h2 className="font-display text-lg font-black uppercase tracking-widest flex items-center gap-3">
          <Truck size={20} className="text-emerald-400" />
          Pengiriman Saya
        </h2>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50">
            <Truck size={40} className="animate-pulse text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-widest">Memuat Data...</span>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-[32px] bg-white/5 flex items-center justify-center text-[#4B6478]">
              <Package size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white">Tidak Ada Pengiriman Aktif</h3>
              <p className="text-xs text-[#4B6478] uppercase font-black tracking-widest leading-loose">
                Anda belum memiliki tugas pengiriman<br />yang sedang berjalan.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map(delivery => (
              <DeliveryCard 
                key={delivery.id} 
                delivery={delivery} 
                onUpdateStatus={updateStatus}
                onTiba={() => {
                  setSelectedDelivery(delivery)
                  setIsUpdateSheetOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </main>

      <UpdateTibaSheet 
        isOpen={isUpdateSheetOpen}
        onClose={handleCloseUpdateSheet}
        delivery={selectedDelivery}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  )
}

function DeliveryCard({ delivery, onUpdateStatus, onTiba }) {
  const statusConfig = {
    preparing: { label: 'Persiapan', color: 'bg-blue-500', icon: Clock },
    loading:   { label: 'Loading',   color: 'bg-amber-500', icon: Package },
    on_route:  { label: 'Perjalanan',color: 'bg-emerald-500',icon: Navigation },
    arrived:   { label: 'Tiba',      color: 'bg-purple-500', icon: MapPin },
    completed: { label: 'Selesai',   color: 'bg-gray-500',   icon: CheckCircle2 }
  }

  let effectiveStatus = delivery.status
  if (effectiveStatus === 'on_route' && delivery.load_time) {
    const now = new Date()
    const loadTime = parseISO(delivery.load_time)
    if (isAfter(loadTime, now)) {
      effectiveStatus = 'preparing'
    }
  }

  const { label, color, icon: Icon } = statusConfig[effectiveStatus] || statusConfig.preparing

  return (
    <Card className="bg-[#111C24] border-white/5 rounded-[32px] overflow-hidden shadow-xl">
      <CardContent className="p-0">
        <div className={cn("p-4 flex items-center justify-between", color, "bg-opacity-10")}>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white", color)}>
              <Icon size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Status</p>
              <h4 className="font-display font-black text-sm uppercase text-white">{label}</h4>
            </div>
          </div>
            <Badge className="bg-white/10 hover:bg-white/20 border-none text-[10px] font-black uppercase px-3 py-1">
            {formatEkor(delivery.initial_count)}
          </Badge>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Utama */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Asal (Kandang)</p>
                <h5 className="font-bold text-sm text-white truncate">{delivery.sales?.purchases?.farms?.farm_name || 'Kandang'}</h5>
                <p className="text-[11px] text-[#4B6478] truncate">{delivery.sales?.purchases?.farms?.location || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <Truck size={16} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Tujuan (Buyer)</p>
                <h5 className="font-bold text-sm text-white truncate">{delivery.sales?.rpa_clients?.rpa_name || 'Buyer'}</h5>
              </div>
            </div>

            {/* Jam Jadwal */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/70 mb-1">Jadwal Muat</p>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-500" />
                  <span className="text-sm font-black text-white tabular-nums">
                    {delivery.load_time ? new Date(delivery.load_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-500/70 mb-1">Jadwal Jalan</p>
                <div className="flex items-center gap-2">
                  <Navigation size={14} className="text-blue-500" />
                  <span className="text-sm font-black text-white tabular-nums">
                    {delivery.departure_time ? new Date(delivery.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            {delivery.status === 'preparing' && (
              <Button 
                onClick={() => onUpdateStatus(delivery.id, 'loading')}
                className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20"
              >
                Mulai Loading <Package size={16} className="ml-2" />
              </Button>
            )}
            {delivery.status === 'loading' && (
              <Button 
                onClick={() => onUpdateStatus(delivery.id, 'on_route')}
                className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20"
              >
                Mulai Jalan <Navigation size={16} className="ml-2" />
              </Button>
            )}
            {delivery.status === 'on_route' && (
              <Button 
                onClick={onTiba}
                className="w-full h-14 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-500/20"
              >
                Sudah Tiba <MapPin size={16} className="ml-2" />
              </Button>
            )}
            {delivery.status === 'arrived' && (
              <Button 
                onClick={onTiba} // Arrived means need data update
                className="w-full h-14 rounded-2xl bg-gray-500 hover:bg-gray-600 text-white font-black text-xs uppercase tracking-widest"
              >
                Lengkapi Data Tiba <ChevronRight size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UpdateTibaSheet({ isOpen, onClose, delivery, onSuccess }) {
  const { updateTiba } = useUpdateDelivery()
  const [arrivedCount, setArrivedCount] = useState('')
  const [arrivedWeight, setArrivedWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    if (delivery) {
      setArrivedCount(delivery.initial_count?.toString() || '')
      setArrivedWeight(delivery.sales?.total_weight_kg?.toString() || '')
    }
  }, [delivery, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateTiba({
        deliveryId: delivery.id,
        arrivedCount: parseInt(arrivedCount),
        arrivedWeight: parseFloat(arrivedWeight),
        notes: notes
      })
      toast.success('Laporan kedatangan berhasil dikirim. Menunggu audit Broker.')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error('Gagal menyelesaikan pengiriman')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-[#0C1319] border-t border-white/10 p-0 rounded-t-[32px] overflow-y-auto max-h-[90vh]">
        <div className="p-8 space-y-8 pb-12">
          <SheetHeader className="text-left">
            <SheetTitle className="text-white font-display text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <CheckCircle size={24} className="text-emerald-500" />
              Laporkan Kedatangan
            </SheetTitle>
            <SheetDescription className="text-[#4B6478] font-bold uppercase text-[10px] tracking-widest mt-1">
              Kirim data akhir pengiriman untuk diaudit Broker
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] ml-1">Ekor Tiba *</Label>
                <Input 
                  type="number"
                  value={arrivedCount}
                  onChange={(e) => setArrivedCount(e.target.value)}
                  className="h-16 rounded-2xl bg-[#111C24] border-white/5 font-black text-xl text-emerald-400 placeholder:text-white/5"
                  placeholder="0"
                  required
                />
                <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest ml-1">
                  Ekor Awal: {formatEkor(delivery?.initial_count)} · Selisih akan jadi laporan mati
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] ml-1">Berat Tiba (Kg) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={arrivedWeight}
                  onChange={(e) => setArrivedWeight(e.target.value)}
                  className="h-16 rounded-2xl bg-[#111C24] border-white/5 font-black text-xl text-blue-400 placeholder:text-white/5"
                  placeholder="0.00"
                  required
                />
                <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-widest ml-1">
                  Berat Awal (Estimasi): {formatWeight(delivery?.sales?.total_weight_kg)}
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4B6478] ml-1">Catatan Kejadian</Label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="CONTOH: AYAM MATI 2 EKOR DI PERJALANAN, HUJAN DERAS..." 
                  className="rounded-2xl bg-[#111C24] border-white/5 font-bold text-xs uppercase p-4 min-h-[100px] text-white" 
                />
              </div>
            </div>

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-emerald-500/20"
            >
              {isSubmitting ? 'MENGIRIM LAPORAN...' : 'KIRIM LAPORAN KEDATANGAN'}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="w-full text-[#4B6478] hover:text-white text-[10px] font-black uppercase"
            >
              Batalkan
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
