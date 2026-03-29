import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calculator, ArrowLeft, RefreshCw, Zap, 
  TrendingUp, TrendingDown, DollarSign, Scale, 
  Truck, ShoppingCart, Info, AlertCircle, CheckCircle2,
  Sparkles, Target
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR, formatWeight, safeNumber } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
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

export default function Simulator() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const navigate = useNavigate()
  const [marketPrices, setMarketPrices] = useState(null)
  const [formData, setFormData] = useState({
    ekor: '',
    bobot: '',
    hargaBeli: '',
    hargaJual: '',
    biayaKirim: '',
    susutPct: '0.8'
  })

  useEffect(() => {
    async function fetchMarketPrices() {
      const { data } = await supabase
        .from('market_prices')
        .select('*')
        .order('price_date', { ascending: false })
        .limit(1)
        .single()
      
      if (data) setMarketPrices(data)
    }
    fetchMarketPrices()
  }, [])

  // Calculations - TRUE Formula
  const jumlahEkor = Number(formData.ekor) || 0
  const avgBobot = Number(formData.bobot) || 0
  const hargaBeli = Number(formData.hargaBeli) || 0
  const hargaJual = Number(formData.hargaJual) || 0
  const biayaKirim = Number(formData.biayaKirim) || 0
  const susutPct = Number(formData.susutPct) || 0

  const bobotAwal = jumlahEkor * avgBobot
  const susutKg = bobotAwal * (susutPct / 100)
  const bobotTiba = bobotAwal - susutKg
  
  const pendapatan = bobotTiba * hargaJual
  const modal = bobotAwal * hargaBeli
  const biayaSusut = susutKg * hargaJual
  
  const netProfit = pendapatan - modal - biayaSusut - biayaKirim
  const marginPerKg = bobotTiba > 0 ? netProfit / bobotTiba : 0
  const roi = modal > 0 ? (netProfit / modal) * 100 : 0
  const bep = bobotTiba > 0 ? (modal + biayaKirim) / bobotTiba : 0

  const isFilled = jumlahEkor > 0 && avgBobot > 0 && (hargaBeli > 0 || hargaJual > 0)

  const handleUseMarketPrice = (type) => {
    if (!marketPrices) return
    if (type === 'beli') {
      setFormData(prev => ({ ...prev, hargaBeli: marketPrices.farm_gate_price || '' }))
    } else {
      setFormData(prev => ({ ...prev, hargaJual: marketPrices.buyer_price || '' }))
    }
  }

  const handleReset = () => {
    setFormData({
      ekor: '',
      bobot: '',
      hargaBeli: '',
      hargaJual: '',
      biayaKirim: '',
      susutPct: '0.8'
    })
  }

  return (
    <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn("bg-[#06090F] min-h-screen pb-24 text-left font-sans", isDesktop && "pb-10")}
    >
      {/* TopBar */}
      <header className="px-5 pt-8 pb-4 border-b border-white/5 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30">
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                  <button 
                      onClick={() => navigate(-1)} 
                      className="w-11 h-11 rounded-[16px] bg-secondary/10 border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors active:scale-90"
                  >
                      <ArrowLeft size={20} strokeWidth={2.5} />
                  </button>
                  <div>
                      <h1 className="font-display text-xl font-black text-white tracking-tight leading-none uppercase">Simulator Margin</h1>
                      <p className="text-[10px] font-black text-[#4B6478] uppercase mt-1.5 tracking-wider">Simulasi angka sebelum transaksi...</p>
                  </div>
              </div>
              {marketPrices && (
                <div className="flex gap-2">
                    <Badge variant="outline" className="bg-emerald-500/5 border-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-1 h-auto flex flex-col items-end">
                        <span className="opacity-50 text-[7px] uppercase tracking-tighter">Beli (Farm)</span>
                        {formatIDR(marketPrices.farm_gate_price)}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/5 border-blue-500/10 text-blue-400 text-[9px] font-black px-2 py-1 h-auto flex flex-col items-end">
                        <span className="opacity-50 text-[7px] uppercase tracking-tighter">Jual (RPA)</span>
                        {formatIDR(marketPrices.buyer_price)}
                    </Badge>
                </div>
              )}
          </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-5 mt-6 pb-20 space-y-6">
        {/* INPUT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* COLUMN LEFT: KANDANG & AYAM */}
            <Card className="bg-[#111C24] border-white/5 rounded-[32px] overflow-hidden">
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Target size={16} className="text-emerald-500" />
                        </div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Kandang & Ayam</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2.5">
                            <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478] ml-1">Jumlah Ayam (Ekor)</Label>
                            <Input 
                                type="number" placeholder="0"
                                value={formData.ekor} 
                                onChange={e => setFormData({...formData, ekor: e.target.value})}
                                className="bg-black/20 border-white/5 h-12 font-black px-4 rounded-xl focus:border-emerald-500/50 transition-all text-sm"
                            />
                        </div>
                        
                        <div className="space-y-2.5">
                            <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478] ml-1">Avg Bobot (kg/ekor)</Label>
                            <Input 
                                type="number" step="0.05" placeholder="1.85"
                                value={formData.bobot} 
                                onChange={e => setFormData({...formData, bobot: e.target.value})}
                                className="bg-black/20 border-white/5 h-12 font-black px-4 rounded-xl focus:border-emerald-500/50 transition-all text-sm"
                            />
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex justify-between items-end px-1">
                                <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478]">Harga Beli (Farm)</Label>
                                <button 
                                    onClick={() => handleUseMarketPrice('beli')}
                                    className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md transition-colors"
                                >
                                    Use Market
                                </button>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#4B6478] text-sm">Rp</span>
                                <Input 
                                    type="number" placeholder="0"
                                    value={formData.hargaBeli} 
                                    onChange={e => setFormData({...formData, hargaBeli: e.target.value})}
                                    className="bg-black/20 border-white/5 h-12 font-black pl-11 pr-4 rounded-xl focus:border-emerald-500/50 transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* COLUMN RIGHT: PENGIRIMAN & PENJUALAN */}
            <Card className="bg-[#111C24] border-white/5 rounded-[32px] overflow-hidden">
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Truck size={16} className="text-amber-500" />
                        </div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Pengiriman & Penjualan</h3>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478]">Estimasi Susut (%)</Label>
                                <span className="text-[11px] font-black text-amber-500">{formData.susutPct}%</span>
                            </div>
                            <div className="px-2">
                                <input 
                                    type="range" min="0" max="5" step="0.1"
                                    value={formData.susutPct}
                                    onChange={e => setFormData({...formData, susutPct: e.target.value})}
                                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                                <div className="flex justify-between mt-2 px-0.5">
                                    <span className="text-[8px] font-bold text-[#4B6478]">0%</span>
                                    <span className="text-[8px] font-bold text-[#4B6478]">2.5%</span>
                                    <span className="text-[8px] font-bold text-[#4B6478]">5%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478] ml-1">Total Biaya Kirim (Rp)</Label>
                            <Input 
                                type="number" placeholder="0"
                                value={formData.biayaKirim} 
                                onChange={e => setFormData({...formData, biayaKirim: e.target.value})}
                                className="bg-black/20 border-white/5 h-12 font-black px-4 rounded-xl focus:border-emerald-500/50 transition-all text-sm"
                            />
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex justify-between items-end px-1">
                                <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478]">Harga Jual (RPA)</Label>
                                <button 
                                    onClick={() => handleUseMarketPrice('jual')}
                                    className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md transition-colors"
                                >
                                    Use Market
                                </button>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#4B6478] text-sm">Rp</span>
                                <Input 
                                    type="number" placeholder="0"
                                    value={formData.hargaJual} 
                                    onChange={e => setFormData({...formData, hargaJual: e.target.value})}
                                    className="bg-black/20 border-white/5 h-12 font-black pl-11 pr-4 rounded-xl focus:border-emerald-500/50 transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        {/* ALUR KALKULASI */}
        <AnimatePresence>
            {isFilled && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                >
                    <Card className="bg-[#111C24]/50 border-white/5 border-dashed rounded-[22px]">
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Info size={14} className="text-[#4B6478]" />
                                <h3 className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Alur Kalkulasi Bobot</h3>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-[#94A3B8] font-medium uppercase tracking-wider">Bobot Awal ({jumlahEkor} ekor × {avgBobot}kg)</span>
                                    <span className="text-white font-black tabular-nums">{formatWeight(bobotAwal)} KG</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-amber-500/80 font-medium uppercase tracking-wider">Susut {susutPct.toFixed(1)}% ({formatWeight(susutKg)} kg)</span>
                                    <span className="text-amber-500 font-black tabular-nums">- {formatWeight(susutKg)} KG</span>
                                </div>
                                <Separator className="bg-white/5" />
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-black text-sm uppercase tracking-widest">Bobot Tiba (Yang Dijual)</span>
                                    <span className="text-emerald-400 font-display text-lg font-black tabular-nums">{formatWeight(bobotTiba)} KG</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>

        {/* RESULT AREA */}
        <div className="mt-4">
            {!isFilled ? (
                <div className="h-48 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-center p-8 bg-black/10">
                    <Calculator size={32} className="text-[#4B6478] mb-4 opacity-20" />
                    <p className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Masukkan data di atas untuk melihat estimasi</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                >
                    <Card className="bg-[#111C24] border-white/5 rounded-[32px] overflow-hidden shadow-2xl shadow-black/50">
                        <div className="p-8 space-y-8">
                            {/* 4 COLUMNS BREAKDOWN */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Pendapatan</p>
                                    <p className="text-sm font-black text-white tabular-nums leading-none">{formatIDR(pendapatan)}</p>
                                    <p className="text-[9px] font-medium text-[#4B6478] uppercase italic">Bobot Tiba × Jual</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Modal (Ayam)</p>
                                    <p className="text-sm font-black text-white tabular-nums leading-none">-{formatIDR(modal)}</p>
                                    <p className="text-[9px] font-medium text-[#4B6478] uppercase italic">Bobot Awal × Beli</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest">Biaya Susut</p>
                                    <p className="text-sm font-black text-amber-500 tabular-nums leading-none">-{formatIDR(biayaSusut)}</p>
                                    <p className="text-[9px] font-medium text-[#4B6478] uppercase italic">Susut Kg × Jual</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Biaya Kirim</p>
                                    <p className="text-sm font-black text-white tabular-nums leading-none">-{formatIDR(biayaKirim)}</p>
                                    <p className="text-[9px] font-medium text-[#4B6478] uppercase italic">Total Pengiriman</p>
                                </div>
                            </div>

                            <Separator className="bg-white/5" />

                            {/* FOOTER RESULTS */}
                            <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-black/20 rounded-[24px] p-6 border border-white/5">
                                <div className="text-center md:text-left space-y-1">
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.3em]",
                                        netProfit >= 0 ? "text-emerald-500/70" : "text-red-500/70"
                                    )}>
                                        ESTIMASI NET PROFIT
                                    </p>
                                    <h2 className={cn(
                                        "text-4xl font-display font-black tracking-tighter tabular-nums",
                                        netProfit >= 0 ? "text-emerald-400" : "text-red-400"
                                    )}>
                                        {netProfit >= 0 ? '+' : ''}{formatIDR(netProfit)}
                                    </h2>
                                </div>
                                <div className="hidden md:block w-[1px] h-12 bg-white/5" />
                                <div className="text-center md:text-right space-y-1">
                                    <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.3em]">MARGIN / KG TIBA</p>
                                    <p className="text-2xl font-display font-bold text-white tabular-nums tracking-tight">
                                        {formatIDR(marginPerKg)} <span className="text-[10px] text-[#4B6478]">/KG</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="flex gap-3">
                        <Button 
                            variant="ghost" 
                            onClick={handleReset}
                            className="flex-1 h-12 rounded-xl bg-white/[0.03] border border-white/5 text-[#4B6478] font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-white/[0.05] hover:text-[#F1F5F9] transition-all"
                        >
                            <RefreshCw size={14} /> Reset Data
                        </Button>
                        <Badge className={cn(
                            "h-12 px-6 rounded-xl border-none font-black text-[10px] flex items-center gap-2",
                            roi > 5 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500"
                        )}>
                            ROI: {roi.toFixed(1)}%
                        </Badge>
                    </div>
                </motion.div>
            )}
        </div>
      </div>
    </motion.div>
  )
}
