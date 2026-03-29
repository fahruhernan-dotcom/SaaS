import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Phone, MapPin, ChevronRight, CheckCircle2, User, Trash2, Warehouse } from 'lucide-react'
import { useEggSuppliers } from '@/lib/hooks/useEggSuppliers'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import EmptyState from '@/components/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } 
  }
}

export default function Suppliers() {
  const { tenant } = useAuth()
  const { data: suppliers, isLoading } = useEggSuppliers()
  const [search, setSearch] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  
  const queryClient = useQueryClient()

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return []
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [suppliers, search])

  const handleEdit = (supplier, e) => {
    e.stopPropagation()
    setEditingSupplier(supplier)
    setOpenModal(true)
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('egg_suppliers')
        .update({ is_deleted: true })
        .eq('id', id)
      
      if (error) throw error
      toast.success('Supplier berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['egg-suppliers', tenant?.id] })
      setOpenModal(false)
    } catch (err) {
      toast.error('Gagal menghapus supplier: ' + err.message)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (editingSupplier) {
        const { error } = await supabase
          .from('egg_suppliers')
          .update(formData)
          .eq('id', editingSupplier.id)
        if (error) throw error
        toast.success('Supplier diperbarui')
      } else {
        const { error } = await supabase
          .from('egg_suppliers')
          .insert([{ ...formData, tenant_id: tenant.id }])
        if (error) throw error
        toast.success('Supplier ditambahkan')
      }
      queryClient.invalidateQueries({ queryKey: ['egg-suppliers', tenant?.id] })
      setOpenModal(false)
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    }
  }

  return (
    <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#06090F] min-h-screen pb-24"
    >
      <header className="px-5 pt-8 pb-4 border-b border-white/5 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 flex flex-col gap-1">
        <div className="flex justify-between items-center text-left">
            <div>
                <h1 className="font-display text-2xl font-black text-white tracking-tight leading-none uppercase">Supplier Telur</h1>
                <p className="text-[11px] font-bold text-[#4B6478] uppercase mt-1">{suppliers?.length || 0} MASUK DALAM DATABASE</p>
            </div>
            <Button 
                size="sm" 
                onClick={() => { setEditingSupplier(null); setOpenModal(true); }}
                className="bg-[#10B981] hover:bg-[#0D9668] text-white font-black uppercase text-[10px] tracking-widest rounded-xl h-10 px-4 gap-2 border-none shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
            >
                <Plus size={16} />
                Tambah
            </Button>
        </div>
      </header>

      <div className="mx-5 mt-4 relative group">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478] group-focus-within:text-emerald-400 transition-colors" />
        <Input 
            placeholder="Cari nama supplier..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#111C24] border-white/10 h-13 pl-12 rounded-2xl focus:border-emerald-500/50 transition-all font-bold text-white text-[15px]"
        />
      </div>

      <div className="mt-6 px-5 space-y-3">
        {isLoading ? (
          <LoadingList />
        ) : filteredSuppliers.length === 0 ? (
          <EmptyState 
            icon={Warehouse} 
            title="Belum ada Supplier" 
            description="Tambahkan supplier pertamamu untuk mulai mencatat stok telur masuk." 
            action={
                <Button 
                    className="bg-[#10B981] hover:bg-emerald-600 h-11 px-6 font-black uppercase tracking-widest text-[10px] rounded-xl border-none" 
                    onClick={() => setOpenModal(true)}
                >
                    Tambah Supplier Pertama
                </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredSuppliers.map((s) => (
              <SupplierCard 
                  key={s.id}
                  supplier={s} 
                  onEdit={(e) => handleEdit(s, e)}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet open={openModal} onOpenChange={setOpenModal}>
        <SheetContent 
          side="right" 
          className="bg-[#0C1319] border-l border-white/8 w-full sm:max-w-[480px] p-8 overflow-y-auto"
        >
          <SheetHeader className="mb-8">
            <SheetTitle className="font-display text-2xl font-black text-white uppercase tracking-tight text-left">
              {editingSupplier ? "EDIT SUPPLIER" : "TAMBAH SUPPLIER"}
            </SheetTitle>
            <SheetDescription className="sr-only">Form Supplier</SheetDescription>
          </SheetHeader>

          <SupplierForm 
            supplier={editingSupplier} 
            onClose={() => setOpenModal(false)} 
            onSave={handleSave}
            onDelete={handleDelete}
          />
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}

function SupplierCard({ supplier, onEdit }) {
  return (
    <div
        onClick={onEdit}
        className="bg-[#111C24] border border-white/5 rounded-3xl p-4 flex justify-between items-center cursor-pointer hover:border-white/10 transition-all shadow-sm group active:scale-[0.98]"
    >
        <div className="flex gap-4 items-center flex-1">
            <Avatar className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <AvatarFallback className="bg-transparent text-[#34D399] font-display font-black text-lg">
                    {supplier.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-left">
                <h3 className="font-display font-black text-[#F1F5F9] text-base group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{supplier.name}</h3>
                <div className="flex items-center gap-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#4B6478]">
                        <Phone size={10} /> {supplier.phone || 'No Phone'}
                    </p>
                    <span className="text-white/10">•</span>
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#4B6478]">
                        <MapPin size={10} /> {supplier.location || 'No Location'}
                    </p>
                </div>
            </div>
        </div>
        <ChevronRight size={16} className="text-[#4B6478] group-hover:translate-x-1 transition-transform ml-1" />
    </div>
  )
}

function SupplierForm({ supplier, onClose, onSave, onDelete }) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState(supplier || {
        name: '',
        phone: '',
        location: '',
        notes: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        await onSave(formData)
        setIsLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-12">
            <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Nama Supplier *</Label>
                <Input
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold focus:border-emerald-500/50"
                />
            </div>

            <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">No HP / Telp</Label>
                <Input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold focus:border-emerald-500/50"
                />
            </div>

            <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Lokasi / Alamat</Label>
                <Input
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold focus:border-emerald-500/50"
                />
            </div>

            <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Catatan</Label>
                <Textarea
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="bg-[#111C24] border-white/10 rounded-xl min-h-[100px] focus:border-emerald-500/50"
                />
            </div>

            <div className="flex gap-3 pt-4">
                {supplier && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (confirm('Hapus supplier ini?')) {
                                onDelete(supplier.id)
                            }
                        }}
                        className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 text-[#F87171] hover:bg-red-500/10 transition-all"
                    >
                        <Trash2 size={20} />
                    </Button>
                )}
                <Button
                    type="submit"
                    className="flex-1 h-14 rounded-2xl bg-[#10B981] hover:bg-[#0D9668] text-base font-black border-none shadow-lg uppercase tracking-widest text-xs"
                    disabled={isLoading}
                >
                    {isLoading ? 'Menyimpan...' : (supplier ? 'Simpan Perubahan' : 'Tambah Supplier')}
                </Button>
            </div>
        </form>
    )
}

function LoadingList() {
    return (
        <div className="space-y-3">
            {[1,2,3].map(i => (
                <Skeleton key={i} className="h-[80px] w-full rounded-3xl bg-white/5" />
            ))}
        </div>
    )
}
