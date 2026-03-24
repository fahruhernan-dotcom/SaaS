import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Calendar, ChevronRight, FileText, 
  CheckCircle2, Clock, Calculator, Filter,
  ArrowRight
} from 'lucide-react'
import { useEggSales } from '@/lib/hooks/useEggSales'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatIDR } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/EmptyState'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export default function Transaksi() {
  const { data: sales, isLoading } = useEggSales()
  const [search, setSearch] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [openDetail, setOpenDetail] = useState(false)

  const filteredSales = sales?.filter(s => 
    s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    s.egg_customers?.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenDetail = (sale) => {
    setSelectedSale(sale)
    setOpenDetail(true)
  }

  return (
    <div className="bg-[#06090F] min-h-screen pb-24">
      <header className="px-5 pt-8 pb-4 border-b border-white/5 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 flex flex-col gap-1 text-left">
        <div>
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight leading-none">Riwayat Transaksi</h1>
          <p className="text-[11px] font-bold text-[#4B6478] uppercase mt-1 tracking-wider">Arsip penjualan telur</p>
        </div>
      </header>

      <div className="mx-5 mt-4 flex gap-3">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478] group-focus-within:text-emerald-400 transition-colors" />
          <Input 
              placeholder="Cari Invoice / Nama Pembeli..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111C24] border-white/10 h-13 pl-12 rounded-2xl focus:border-emerald-500/50 transition-all font-bold text-white text-[15px]"
          />
        </div>
        <Button variant="outline" className="h-13 w-13 p-0 rounded-2xl border-white/10 bg-[#111C24] text-[#4B6478]">
          <Filter size={18} />
        </Button>
      </div>

      <div className="mt-6 px-5 space-y-3">
        {isLoading ? (
          [1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-2xl bg-white/5" />)
        ) : filteredSales?.length === 0 ? (
          <EmptyState 
            icon={FileText} 
            title="Belum ada Transaksi" 
            description="Semua transaksi yang kamu buat di POS akan muncul di sini." 
          />
        ) : (
          filteredSales?.map((sale) => (
            <SaleCard key={sale.id} sale={sale} onClick={() => handleOpenDetail(sale)} />
          ))
        )}
      </div>

      <Sheet open={openDetail} onOpenChange={setOpenDetail}>
        <SheetContent className="bg-[#0C1319] border-white/10 p-8 w-full sm:max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-8">
            <SheetTitle className="text-left font-display text-2xl font-black text-white uppercase tracking-tight">Detail Transaksi</SheetTitle>
          </SheetHeader>
          {selectedSale && <SaleDetailView sale={selectedSale} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function SaleCard({ sale, onClick }) {
  const isLunas = sale.payment_status === 'lunas'
  
  return (
    <Card 
      onClick={onClick}
      className="bg-[#111C24] border-white/5 p-4 rounded-2xl cursor-pointer hover:border-white/10 transition-all flex items-center justify-between group active:scale-[0.98]"
    >
      <div className="flex items-center gap-4 text-left">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLunas ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
          <FileText size={20} />
        </div>
        <div className="space-y-0.5">
          <h4 className="font-black text-white text-sm uppercase leading-none">{sale.egg_customers?.name || 'Pembeli Umum'}</h4>
          <p className="text-[10px] font-bold text-[#4B6478] uppercase racking-widest">{sale.invoice_number}</p>
        </div>
      </div>

      <div className="text-right flex items-center gap-3">
        <div className="space-y-0.5">
          <p className="font-display font-black text-white text-base leading-none tracking-tight">{formatIDR(sale.total_amount)}</p>
          <div className="flex items-center justify-end gap-1">
            {isLunas ? 
              <span className="text-[9px] font-black text-emerald-400 uppercase">Lunas</span> : 
              <span className="text-[9px] font-black text-amber-500 uppercase">Piutang</span>
            }
          </div>
        </div>
        <ChevronRight size={16} className="text-[#4B6478] group-hover:translate-x-1 transition-transform" />
      </div>
    </Card>
  )
}

function SaleDetailView({ sale }) {
  return (
    <div className="space-y-8 text-left">
      <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">No. Invoice</p>
            <p className="font-display font-black text-lg text-white mt-1">{sale.invoice_number}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Status</p>
            <Badge className={sale.payment_status === 'lunas' ? 'bg-emerald-500/10 text-emerald-400 mt-1 uppercase text-[10px]' : 'bg-amber-500/10 text-amber-400 mt-1 uppercase text-[10px]'}>
              {sale.payment_status}
            </Badge>
          </div>
        </div>
        
        <div className="pt-4 border-t border-white/5">
          <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Pembeli</p>
          <p className="font-bold text-white mt-1 uppercase">{sale.egg_customers?.name}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Rincian Item</h3>
        <div className="space-y-3">
          {sale.egg_sale_items?.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-white/5">
              <div>
                <p className="font-black text-sm text-white uppercase">{item.egg_inventory?.product_name}</p>
                <p className="text-[10px] font-bold text-[#4B6478] mt-0.5">{item.qty_pack} pack x {formatIDR(item.price_per_pack)}</p>
              </div>
              <p className="font-black text-white text-sm">{formatIDR(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-white/10">
        <div className="flex justify-between items-center bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10">
          <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Total Transaksi</p>
          <p className="font-display text-2xl font-black text-white">{formatIDR(sale.total_amount)}</p>
        </div>
      </div>

      <Button className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl">
        Cetak Invoice PDF
      </Button>
    </div>
  )
}

function Badge({ children, className }) {
  return <span className={`px-2 py-1 rounded-md font-bold ${className}`}>{children}</span>
}
