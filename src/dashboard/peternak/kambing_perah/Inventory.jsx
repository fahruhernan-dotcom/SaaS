import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Minus, Package, AlertTriangle, 
  Search, History, ArrowUp, ArrowDown, Settings 
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  useKambingPerahInventory,
  useUpdateKambingPerahInventory
} from '@/lib/hooks/useKambingPerahData'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'

export default function KambingPerahInventory() {
  const { tenant } = useAuth()
  
  // Queries
  const { data: items = [], isLoading } = useKambingPerahInventory()
  const updateStock = useUpdateKambingPerahInventory()

  // State
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [adjustSheet, setAdjustSheet] = useState(null) // { item, type: 'in'|'out' }

  const [form, setForm] = useState({
    quantity: '',
    notes: ''
  })

  // Filtering
  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                          (i.brand ?? '').toLowerCase().includes(search.toLowerCase())
      const matchCat = selectedCategory === 'all' || i.category === selectedCategory
      return matchSearch && matchCat
    })
  }, [items, search, selectedCategory])

  const lowStockItems = useMemo(() => items.filter(i => i.stock_level <= i.min_threshold), [items])

  const handleAdjust = () => {
    if (!adjustSheet || !form.quantity) return
    
    updateStock.mutate({
      item_id: adjustSheet.item.id,
      type: adjustSheet.type,
      quantity: parseFloat(form.quantity),
      notes: form.notes
    }, {
      onSuccess: () => {
        setAdjustSheet(null)
        setForm({ quantity: '', notes: '' })
      }
    })
  }

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24 min-h-screen bg-[#06090F]">
      
      {/* Header */}
      <header className="px-6 pt-10 pb-6 bg-[#0C1319] border-b border-white/[0.04] sticky top-0 z-20 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black font-['Sora'] text-white">Inventori</h1>
            <p className="text-xs text-[#4B6478]">{items.length} item terdaftar</p>
          </div>
          <button className="p-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[#4B6478] hover:text-white transition-colors">
            <History size={18} />
          </button>
        </div>

        {/* Categories Scroller */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'Pakan', 'Obat', 'Suplemen', 'Lainnya'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-900/20' 
                  : 'bg-white/[0.03] border border-white/[0.06] text-[#4B6478]'
              }`}
            >
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>
      </header>

      {/* Low Stock Warning */}
      {lowStockItems.length > 0 && (
        <div className="px-4 mt-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Stok Menipis</p>
              <p className="text-[11px] text-amber-200/70 font-medium">
                {lowStockItems.length} item mencapai batas minimum. Segera lakukan restock.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-4 mt-6">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478]" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari Pakan / Obat..."
            className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40"
          />
        </div>
      </div>

      {/* Inventory List */}
      <div className="px-4 mt-8 space-y-4">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Package size={40} className="mx-auto text-[#4B6478] mb-4 opacity-20" />
            <p className="text-sm font-bold text-[#4B6478]">Tidak ada item ditemukan</p>
          </div>
        ) : (
          filtered.map(item => {
            const isLow = item.stock_level <= item.min_threshold
            return (
              <div key={item.id} className="bg-[#0F171F]/50 border border-white/[0.06] rounded-3xl p-5 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                      item.category === 'Pakan' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                      item.category === 'Obat' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                      'bg-blue-500/10 border-blue-500/20 text-blue-500'
                    }`}>
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white font-['Sora']">{item.name}</p>
                      <p className="text-[10px] text-[#4B6478] uppercase font-bold tracking-tight">
                        {item.category} · {item.brand ?? 'Polos'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black font-['Sora'] ${isLow ? 'text-amber-400' : 'text-white'}`}>
                      {item.stock_level}
                    </p>
                    <p className="text-[10px] font-bold text-[#4B6478] uppercase">{item.unit}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.04]">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAdjustSheet({ item, type: 'in' })}
                    className="flex items-center justify-center gap-2 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-[11px] font-black text-green-400"
                  >
                    <Plus size={14} /> RESTOCK
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setAdjustSheet({ item, type: 'out' })}
                    className="flex items-center justify-center gap-2 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[11px] font-black text-[#4B6478]"
                  >
                    <Minus size={14} /> KURANGI
                  </motion.button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Adjust Sheet */}
      <Sheet open={!!adjustSheet} onOpenChange={o => !o && setAdjustSheet(null)}>
        <SheetContent side="bottom" className="bg-[#0C1319] border-t border-white/10 rounded-t-[2.5rem] px-6 pt-8 pb-10">
          <SheetHeader className="mb-8 text-center">
            <div className={`w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center border-4 ${
              adjustSheet?.type === 'in' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}>
              {adjustSheet?.type === 'in' ? <ArrowUp size={32} /> : <ArrowDown size={32} />}
            </div>
            <SheetTitle className="text-xl font-black font-['Sora'] text-white">
              {adjustSheet?.type === 'in' ? 'Tambah Stok' : 'Catat Pemakaian'}
            </SheetTitle>
            <p className="text-xs text-[#4B6478] font-bold uppercase mt-1">
              {adjustSheet?.item?.name}
            </p>
          </SheetHeader>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block tracking-widest text-center">
                Jumlah ({adjustSheet?.item?.unit})
              </label>
              <input 
                type="number" step="0.1"
                value={form.quantity}
                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                placeholder="0.0"
                autoFocus
                className="w-full text-center py-4 bg-white/[0.05] border border-white/[0.1] rounded-2xl text-3xl font-black text-white focus:outline-none focus:border-green-500/50"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block tracking-widest px-1">Catatan</label>
              <textarea 
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Contoh: Pembelian rutin, pemakaian harian..."
                className="w-full h-24 p-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-sm text-white resize-none focus:outline-none"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={!form.quantity || updateStock.isPending}
              onClick={handleAdjust}
              className={`w-full py-5 rounded-2xl text-white font-black font-['Sora'] shadow-xl transition-all ${
                adjustSheet?.type === 'in' ? 'bg-green-600 shadow-green-900/20' : 'bg-slate-700 shadow-slate-900/20'
              }`}
            >
              {updateStock.isPending ? 'Memproses...' : 'Konfirmasi Transaksi'}
            </motion.button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}
