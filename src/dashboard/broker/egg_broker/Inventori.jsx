import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, ChevronRight, Package, Calculator, Trash2 } from 'lucide-react'
import { useEggInventory } from '@/lib/hooks/useEggInventory'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } 
  }
}

export default function Inventori() {
  const { tenant } = useAuth()
  const { data: inventory, isLoading } = useEggInventory()
  const [search, setSearch] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const filteredInventory = useMemo(() => {
    if (!inventory) return []
    return inventory.filter(i => 
      i.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [inventory, search])

  const handleEdit = (item, e) => {
    e.stopPropagation()
    setEditingItem(item)
    setOpenModal(true)
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('egg_inventory')
        .update({ is_deleted: true })
        .eq('id', id)
      
      if (error) throw error
      toast.success('Item berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['egg-inventory', tenant?.id] })
      setOpenModal(false)
    } catch (err) {
      toast.error('Gagal menghapus item: ' + err.message)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('egg_inventory')
          .update(formData)
          .eq('id', editingItem.id)
        if (error) throw error
        toast.success('Item diperbarui')
      } else {
        const { error } = await supabase
          .from('egg_inventory')
          .insert([{ ...formData, tenant_id: tenant.id }])
        if (error) throw error
        toast.success('Item ditambahkan')
      }
      queryClient.invalidateQueries({ queryKey: ['egg-inventory', tenant?.id] })
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
      <header className={cn("px-5 pb-4 border-b border-white/5 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 flex flex-col gap-1 text-left", isDesktop ? "pt-8" : "pt-10")}>
        <div className="flex justify-between items-center">
            <div>
                <h1 className="font-display text-2xl font-black text-white tracking-tight leading-none uppercase">Inventori & HPP</h1>
                <p className="text-[11px] font-bold text-[#4B6478] uppercase mt-1">Kelola stok telur per grade</p>
            </div>
            <Button 
                size="sm" 
                onClick={() => { setEditingItem(null); setOpenModal(true); }}
                className="bg-[#10B981] hover:bg-[#0D9668] text-white font-black uppercase text-[10px] tracking-widest rounded-xl h-10 px-4 gap-2 border-none shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
            >
                <Plus size={16} />
                Tambah Grade
            </Button>
        </div>
      </header>

      <div className="mx-5 mt-4 relative group">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478] group-focus-within:text-emerald-400 transition-colors" />
        <Input 
            placeholder="Cari grade (A, B, C...)" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#111C24] border-white/10 h-13 pl-12 rounded-2xl focus:border-emerald-500/50 transition-all font-bold text-white text-[15px]"
        />
      </div>

      <div className="mt-6 px-5 space-y-3">
        {isLoading ? (
          <LoadingList />
        ) : filteredInventory.length === 0 ? (
          <EmptyState 
            icon={Package} 
            title="Inventori Kosong" 
            description="Tambahkan grade telur (Gajah, TB, Lokal, dll) untuk mulai mencatat stok." 
            action={
                <Button 
                    className="bg-[#10B981] hover:bg-emerald-600 h-11 px-6 font-black uppercase tracking-widest text-[10px] rounded-xl border-none" 
                    onClick={() => setOpenModal(true)}
                >
                    Tambah Grade Pertama
                </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredInventory.map((item) => (
              <InventoryCard 
                  key={item.id}
                  item={item} 
                  onEdit={(e) => handleEdit(item, e)}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet open={openModal} onOpenChange={setOpenModal}>
        <SheetContent 
          side={isDesktop ? "right" : "bottom"} 
          className={cn("bg-[#0C1319] border-white/8 p-0 overflow-y-auto", isDesktop ? "w-full sm:max-w-[480px] border-l" : "h-[85vh] rounded-t-[40px] border-t")}
        >
          <div className={isDesktop ? "p-8" : "p-6 pt-10"}>
            <SheetHeader className="mb-8">
                <SheetTitle className="font-display text-2xl font-black text-white uppercase tracking-tight text-left">
                {editingItem ? "EDIT GRADE" : "TAMBAH GRADE"}
                </SheetTitle>
                <SheetDescription className="sr-only">Form Inventori</SheetDescription>
            </SheetHeader>

            <InventoryForm 
                item={editingItem} 
                onClose={() => setOpenModal(false)} 
                onSave={handleSave}
                onDelete={handleDelete}
            />
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}

function InventoryCard({ item, onEdit }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const stockColor = item.current_stock_butir < 5 ? 'text-red-400' : 'text-emerald-400'
  
  return (
    <Card
        onClick={onEdit}
        className="bg-[#111C24] border-white/5 rounded-[24px] p-5 cursor-pointer hover:border-white/10 transition-all active:scale-[0.98] relative overflow-hidden group"
    >
        <div className="flex justify-between items-start relative z-10 text-left">
            <div className="space-y-1.5">
                <h3 className={cn("font-display font-black text-[#F1F5F9] uppercase tracking-tight group-hover:text-emerald-400 transition-colors leading-none", isDesktop ? "text-xl" : "text-lg")}>{item.product_name}</h3>
                <p className={cn("font-black text-[#4B6478] uppercase tracking-widest leading-none", isDesktop ? "text-[10px]" : "text-[11px]")}>Harga Jual: {formatIDR(item.sell_price_per_pack)} / {item.unit || 'pack'}</p>
            </div>
            <div className="text-right">
                <p className={cn("font-black text-[#4B6478] uppercase tracking-widest mb-1 leading-none", isDesktop ? "text-[10px]" : "text-[11px]")}>Stok Saat Ini</p>
                <div className="flex items-baseline justify-end gap-1">
                    <span className={cn("font-display font-black", stockColor, isDesktop ? "text-2xl" : "text-xl")}>{item.current_stock_butir}</span>
                    <span className={cn("font-black text-[#4B6478] uppercase", isDesktop ? "text-[10px]" : "text-[11px]")}>butir</span>
                </div>
            </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/5 rounded-lg">
                    <Calculator size={isDesktop ? 14 : 16} className="text-[#4B6478]" />
                </div>
                <div className="text-left">
                    <p className={cn("font-bold text-[#4B6478] uppercase leading-none", isDesktop ? "text-[9px]" : "text-[10px]")}>HPP Rata-rata</p>
                    <p className={cn("font-black text-white mt-1", isDesktop ? "text-xs" : "text-sm")}>{formatIDR(item.cost_per_pack)}</p>
                </div>
            </div>
            <ChevronRight size={isDesktop ? 18 : 20} className="text-[#4B6478] group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Decorative background icon */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-white/[0.02] group-hover:text-emerald-500/[0.03] transition-colors rotate-12">
            <Package size={80} />
        </div>
    </Card>
  )
}

function InventoryForm({ item, onClose, onSave, onDelete }) {
    const isDesktop = useMediaQuery('(min-width: 1024px)')
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState(item || {
        product_name: '',
        current_stock_butir: 0,
        cost_per_pack: 0,
        sell_price_per_pack: 0,
        unit: 'kg',
        notes: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        await onSave(formData)
        setIsLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-12 text-left">
            <div className="space-y-2">
                <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Nama / Grade Telur *</Label>
                <Input
                    required
                    placeholder="Contoh: Grade A / Gajah"
                    value={formData.product_name}
                    onChange={e => setFormData({...formData, product_name: e.target.value})}
                    className="bg-[#111C24] border-white/10 rounded-xl h-14 font-bold focus:border-emerald-500/50 text-base text-white uppercase placeholder:text-white/10"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Stok Awal</Label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={formData.current_stock_butir}
                        onChange={e => setFormData({...formData, current_stock_butir: parseFloat(e.target.value)})}
                        className="bg-[#111C24] border-white/10 rounded-xl h-14 font-bold focus:border-emerald-500/50 text-base text-white"
                    />
                </div>
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Satuan</Label>
                    <Input
                        value={formData.unit}
                        onChange={e => setFormData({...formData, unit: e.target.value})}
                        className="bg-[#111C24] border-white/10 rounded-xl h-14 font-bold focus:border-emerald-500/50 text-base text-white uppercase placeholder:text-white/10"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>HPP (Modal)</Label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={formData.cost_per_pack}
                        onChange={e => setFormData({...formData, cost_per_pack: parseFloat(e.target.value)})}
                        className="bg-[#111C24] border-white/10 rounded-xl h-14 font-bold focus:border-emerald-500/50 text-base text-white"
                    />
                </div>
                <div className="space-y-2">
                    <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Harga Jual</Label>
                    <Input
                        type="number"
                        placeholder="0"
                        value={formData.sell_price_per_pack}
                        onChange={e => setFormData({...formData, sell_price_per_pack: parseFloat(e.target.value)})}
                        className="bg-[#111C24] border-white/10 rounded-xl h-14 font-bold focus:border-emerald-500/50 text-base text-white"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className={cn("uppercase font-black tracking-widest text-[#4B6478]", isDesktop ? "text-[10px]" : "text-xs")}>Catatan</Label>
                <Textarea
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="bg-[#111C24] border-white/10 rounded-2xl min-h-[100px] focus:border-emerald-500/50 text-base text-white placeholder:text-white/10"
                />
            </div>

            <div className="flex gap-3 pt-4">
                {item && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (confirm('Hapus item ini dari inventori?')) {
                                handleDelete(item.id)
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
                    {isLoading ? 'Menyimpan...' : (item ? 'Simpan Perubahan' : 'Tambah ke Inventori')}
                </Button>
            </div>
        </form>
    )
}

function LoadingList() {
    return (
        <div className="space-y-4">
            {[1,2,3].map(i => (
                <Skeleton key={i} className="h-[140px] w-full rounded-[24px] bg-white/5" />
            ))}
        </div>
    )
}
