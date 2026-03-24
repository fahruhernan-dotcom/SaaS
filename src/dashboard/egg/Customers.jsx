import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Phone, MapPin, ChevronRight, CheckCircle2, User, Trash2, Users } from 'lucide-react'
import { useEggCustomers } from '@/lib/hooks/useEggCustomers'
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
import { formatIDR } from '@/lib/format'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export default function Customers() {
  const { tenant } = useAuth()
  const { data: customers, isLoading } = useEggCustomers()
  const [search, setSearch] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  
  const queryClient = useQueryClient()

  const filteredCustomers = useMemo(() => {
    if (!customers) return []
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [customers, search])

  const handleEdit = (customer, e) => {
    e.stopPropagation()
    setEditingCustomer(customer)
    setOpenModal(true)
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('egg_customers')
        .update({ is_deleted: true })
        .eq('id', id)
      
      if (error) throw error
      toast.success('Pelanggan berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['egg-customers', tenant?.id] })
      setOpenModal(false)
    } catch (err) {
      toast.error('Gagal menghapus pelanggan: ' + err.message)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('egg_customers')
          .update(formData)
          .eq('id', editingCustomer.id)
        if (error) throw error
        toast.success('Pelanggan diperbarui')
      } else {
        const { error } = await supabase
          .from('egg_customers')
          .insert([{ ...formData, tenant_id: tenant.id }])
        if (error) throw error
        toast.success('Pelanggan ditambahkan')
      }
      queryClient.invalidateQueries({ queryKey: ['egg-customers', tenant?.id] })
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
      <header className="px-5 pt-8 pb-4 border-b border-white/5 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 flex flex-col gap-1 text-left">
        <div className="flex justify-between items-center text-left">
            <div>
                <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight leading-none">Pelanggan Telur</h1>
                <p className="text-[11px] font-bold text-[#4B6478] uppercase mt-1 tracking-wider">{customers?.length || 0} PEMBELI TERDAFTAR</p>
            </div>
            <Button 
                size="sm" 
                onClick={() => { setEditingCustomer(null); setOpenModal(true); }}
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
            placeholder="Cari nama pelanggan..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#111C24] border-white/10 h-13 pl-12 rounded-2xl focus:border-emerald-500/50 transition-all font-bold text-white text-[15px]"
        />
      </div>

      <div className="mt-6 px-5 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
             <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
             <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState 
            icon={Users} 
            title="Belum ada Pelanggan" 
            description="Tambahkan pembeli pertamamu untuk mulai mencatat penjualan di POS." 
            action={
                <Button 
                    className="bg-[#10B981] hover:bg-emerald-600 h-11 px-6 font-black uppercase tracking-widest text-[10px] rounded-xl border-none" 
                    onClick={() => setOpenModal(true)}
                >
                    Tambah Pelanggan Pertama
                </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((c) => (
              <CustomerCard 
                  key={c.id}
                  customer={c} 
                  onEdit={(e) => handleEdit(c, e)}
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
              {editingCustomer ? "EDIT PELANGGAN" : "TAMBAH PELANGGAN"}
            </SheetTitle>
            <SheetDescription className="sr-only">Form Pelanggan</SheetDescription>
          </SheetHeader>

          <CustomerForm 
            customer={editingCustomer} 
            onClose={() => setOpenModal(false)} 
            onSave={handleSave}
            onDelete={handleDelete}
          />
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}

function CustomerCard({ customer, onEdit }) {
  return (
    <div
        onClick={onEdit}
        className="bg-[#111C24] border border-white/5 rounded-3xl p-4 flex justify-between items-center cursor-pointer hover:border-white/10 transition-all shadow-sm group active:scale-[0.98]"
    >
        <div className="flex gap-4 items-center flex-1">
            <Avatar className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <AvatarFallback className="bg-transparent text-[#34D399] font-display font-black text-lg">
                    {customer.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-left">
                <h3 className="font-display font-black text-[#F1F5F9] text-base group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{customer.name}</h3>
                <div className="flex items-center gap-3 text-[11px] font-bold text-[#4B6478]">
                    <p className="flex items-center gap-1.5"><Phone size={10} /> {customer.phone || 'No Phone'}</p>
                    <span className="text-white/10">•</span>
                    <p className="flex items-center gap-1.5"><MapPin size={10} /> {customer.location || 'No Location'}</p>
                </div>
            </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1 px-4">
             <p className="text-[9px] font-black text-[#4B6478] uppercase">Total Blanja</p>
             <p className="text-sm font-black text-emerald-400 leading-none tabular-nums">{formatIDR(customer.total_spent)}</p>
        </div>
        <ChevronRight size={16} className="text-[#4B6478] group-hover:translate-x-1 transition-transform ml-1" />
    </div>
  )
}

function CustomerForm({ customer, onClose, onSave, onDelete }) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState(customer || {
        name: '',
        phone: '',
        location: ''
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
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Nama Pelanggan / Pembeli *</Label>
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
                <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478]">Alamat / Lokasi</Label>
                <Input
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="bg-[#111C24] border-white/10 rounded-xl h-12 font-bold focus:border-emerald-500/50"
                />
            </div>

            <div className="flex gap-3 pt-4">
                {customer && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (confirm('Hapus pelanggan ini?')) {
                                onDelete(customer.id)
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
                    {isLoading ? 'Menyimpan...' : (customer ? 'Simpan Perubahan' : 'Tambah Pelanggan')}
                </Button>
            </div>
        </form>
    )
}


