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
    biayaTransport: '',
    biayaKirimRpa: ''
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

  const ekor = Number(formData.ekor) || 0
  const bobot = Number(formData.bobot) || 0
  const hargaBeli = Number(formData.hargaBeli) || 0
  const hargaJual = Number(formData.hargaJual) || 0
  const transport = Number(formData.biayaTransport) || 0
  const kirimRpa = Number(formData.biayaKirimRpa) || 0

  const totalBerat = ekor * bobot
  const totalModal = (totalBerat * hargaBeli) + transport + kirimRpa
  const grossRevenue = totalBerat * hargaJual
  const netProfit = grossRevenue - totalModal
  const marginPerKg = totalBerat > 0 ? netProfit / totalBerat : 0
  const roi = totalModal > 0 ? (netProfit / totalModal) * 100 : 0
  const bep = totalBerat > 0 ? totalModal / totalBerat : 0

  const isFilled = ekor > 0 && bobot > 0 && (hargaBeli > 0 || hargaJual > 0)

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
      biayaTransport: '',
      biayaKirimRpa: ''
    })
  }

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
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="w-11 h-11 rounded-[16px] bg-secondary/10 border border-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors active:scale-90"
                >
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                <div>
                    <h1 className="font-display text-xl font-black text-white tracking-tight leading-none uppercase">Simulator</h1>
                    <p className="text-[10px] font-black text-[#4B6478] uppercase mt-1.5 tracking-wider">Estimasi Profit Cepat</p>
                </div>
            </div>
        </header>
      )}

      {/* Info Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="px-5 mt-5"
      >
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-[22px] p-5 flex gap-4 shadow-2xl shadow-amber-500/5">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Zap size={20} className="text-amber-500" fill="currentColor" />
            </div>
            <p className="text-[12px] font-bold text-amber-500/90 leading-relaxed uppercase tracking-tight">
                Simulasi angka sebelum transaksi. Data ini tidak disimpan ke pembukuan.
            </p>
        </div>
      </motion.div>

      {/* Form Calculator */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="px-5 mt-8 space-y-6"
      >
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
                <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478] ml-1">Jumlah Ekor</Label>
                <div className="relative">
                    <Input 
                        type="number" placeholder="0"
                        value={formData.ekor} 
                        onChange={e => setFormData({...formData, ekor: e.target.value})}
                        className="bg-[#111C24] border-white/10 h-14 font-black px-5 rounded-2xl focus:border-emerald-500/50 transition-all text-sm"
                    />
                </div>
            </div>
            <div className="space-y-2.5">
                <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478] ml-1">Avg Bobot (kg)</Label>
                <Input 
                    type="number" step="0.01" placeholder="1.85"
                    value={formData.bobot} 
                    onChange={e => setFormData({...formData, bobot: e.target.value})}
                    className="bg-[#111C24] border-white/10 h-14 font-black px-5 rounded-2xl focus:border-emerald-500/50 transition-all text-sm"
                />
            </div>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2.5">
                <div className="flex justify-between items-end px-1">
                    <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478]">Harga Beli (Farm)</Label>
                    <button 
                        onClick={() => handleUseMarketPrice('beli')}
                        className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md transition-colors"
                    >
                        Market Price
                    </button>
                </div>
                <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#4B6478] text-sm">Rp</span>
                    <Input 
                        type="number" placeholder="0"
                        value={formData.hargaBeli} 
                        onChange={e => setFormData({...formData, hargaBeli: e.target.value})}
                        className="bg-[#111C24] border-white/10 h-14 font-black pl-12 pr-5 rounded-2xl focus:border-emerald-500/50 transition-all text-sm"
                    />
                </div>
            </div>
            <div className="space-y-2.5">
                <div className="flex justify-between items-end px-1">
                    <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478]">Harga Jual</Label>
                    <button 
                        onClick={() => handleUseMarketPrice('jual')}
                        className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md transition-colors"
                    >
                        Market Price
                    </button>
                </div>
                <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#4B6478] text-sm">Rp</span>
                    <Input 
                        type="number" placeholder="0"
                        value={formData.hargaJual} 
                        onChange={e => setFormData({...formData, hargaJual: e.target.value})}
                        className="bg-[#111C24] border-white/10 h-14 font-black pl-12 pr-5 rounded-2xl focus:border-emerald-500/50 transition-all text-sm"
                    />
                </div>
            </div>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2.5">
                <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478] ml-1">Transport Farm</Label>
                <Input 
                    type="number" placeholder="0"
                    value={formData.biayaTransport} 
                    onChange={e => setFormData({...formData, biayaTransport: e.target.value})}
                    className="bg-[#111C24] border-white/10 h-14 font-black px-5 rounded-2xl focus:border-emerald-500/50 transition-all text-sm"
                />
            </div>
            <div className="space-y-2.5">
                <Label className="uppercase text-[10px] font-black tracking-[0.2em] text-[#4B6478] ml-1">Ongkir ke RPA</Label>
                <Input 
                    type="number" placeholder="0"
                    value={formData.biayaKirimRpa} 
                    onChange={e => setFormData({...formData, biayaKirimRpa: e.target.value})}
                    className="bg-[#111C24] border-white/10 h-14 font-black px-5 rounded-2xl focus:border-emerald-500/50 transition-all text-sm"
                />
            </div>
        </motion.div>
      </motion.div>

      {/* Result Area */}
      <div className="px-5 mt-10 pb-16">
        <AnimatePresence mode="wait">
            {!isFilled ? (
                <motion.div 
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="h-64 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-center p-10 bg-secondary/5"
                >
                    <div className="w-16 h-16 rounded-[22px] bg-secondary/10 flex items-center justify-center mb-5 group">
                        <Calculator size={28} className="text-white/20 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <p className="text-[12px] font-black text-[#4B6478] uppercase tracking-[0.15em] max-w-[240px] leading-relaxed">
                        Masukkan data di atas untuk melihat estimasi margin
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <Card className={cn(
                        "rounded-[32px] border-none shadow-3xl relative overflow-hidden transition-all duration-500",
                        netProfit > 500000 ? "bg-gradient-to-br from-[#10B981]/5 to-transparent ring-1 ring-[#10B981]/20 shadow-emerald-500/5" : 
                        netProfit > 0 ? "bg-gradient-to-br from-[#F59E0B]/5 to-transparent ring-1 ring-[#F59E0B]/20 shadow-amber-500/5" : 
                        "bg-gradient-to-br from-[#EF4444]/5 to-transparent ring-1 ring-[#EF4444]/20 shadow-red-500/5"
                    )}>
                        {/* Interactive Background Glow */}
                        <div className={cn(
                            "absolute -top-32 -right-32 w-64 h-64 blur-[100px] opacity-20 rounded-full transition-colors duration-500",
                            netProfit > 0 ? "bg-emerald-400" : "bg-red-400"
                        )} />

                        <div className="p-8 relative z-10 space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className={cn(netProfit > 0 ? "text-emerald-400" : "text-amber-500")} />
                                    <h3 className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.3em]",
                                        netProfit > 500000 ? "text-emerald-400" : 
                                        netProfit > 0 ? "text-amber-500" : 
                                        "text-red-400"
                                    )}>
                                        Summary Simulasi
                                    </h3>
                                </div>
                                {netProfit > 0 ? (
                                    <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] px-3 h-6 uppercase tracking-widest shadow-lg shadow-emerald-500/20">PROFIT</Badge>
                                ) : (
                                    <Badge className="bg-red-500 text-white border-none font-black text-[9px] px-3 h-6 uppercase tracking-widest shadow-lg shadow-red-500/20">LOSS</Badge>
                                )}
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] ml-1">Estimasi Profit Bersih</p>
                                <h2 className={cn(
                                    "text-5xl font-display font-black tracking-tighter transition-all",
                                    netProfit > 0 ? "text-white" : "text-red-400"
                                )}>
                                    {formatIDR(safeNumber(netProfit))}
                                </h2>
                            </div>

                            <Separator className="bg-secondary/10" />

                            <div className="grid grid-cols-2 gap-y-7 gap-x-4">
                                <ResultRow label="Total Berat" value={`${formatWeight(safeNumber(totalBerat))} KG`} icon={Scale} />
                                <ResultRow label="Total Modal" value={formatIDR(safeNumber(totalModal))} icon={DollarSign} />
                                <ResultRow label="Gross Revenue" value={formatIDR(safeNumber(grossRevenue))} icon={TrendingUp} />
                                <ResultRow label="ROI Project" value={`${safeNumber(roi).toFixed(1)}%`} icon={Target} isPositive={roi > 0} />
                            </div>

                            <div className="flex gap-4 justify-between items-center bg-secondary/15 border border-white/5 rounded-2xl p-5">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.25em]">Margin / Kg</p>
                                    <p className={cn("text-[13px] font-black tracking-tight", netProfit > 0 ? "text-emerald-400" : "text-red-400")}>
                                        {formatIDR(safeNumber(marginPerKg))}
                                    </p>
                                </div>
                                <div className="w-[1px] h-8 bg-secondary/10" />
                                <div className="space-y-1 text-right">
                                    <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.25em]">BEP Price</p>
                                    <p className="text-[13px] font-black text-white tracking-tight">{formatIDR(safeNumber(bep))}<span className="text-[10px] text-[#4B6478] ml-1">/KG</span></p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Feedback Messages */}
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-3"
                    >
                        {netProfit < 0 && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex gap-4 items-center">
                                <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                                    <AlertCircle size={18} className="text-red-500" />
                                </div>
                                <p className="text-[11px] font-black text-red-400 uppercase tracking-tight leading-relaxed">
                                    Warning: Harga jual di bawah modal produksi (Rugi!)
                                </p>
                            </div>
                        )}
                        {isFilled && netProfit >= 0 && marginPerKg < 500 && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex gap-4 items-center">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <TrendingDown size={18} className="text-amber-500" />
                                </div>
                                <p className="text-[11px] font-black text-amber-500 uppercase tracking-tight leading-relaxed">
                                    Hati-hati: Margin sangat tipis (di bawah Rp500/kg)
                                </p>
                            </div>
                        )}
                        {marginPerKg >= 2500 && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex gap-4 items-center">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <TrendingUp size={18} className="text-emerald-400" />
                                </div>
                                <p className="text-[11px] font-black text-emerald-400 uppercase tracking-tight leading-relaxed">
                                    Luar biasa: Margin sangat sehat di atas Rp2.500/kg
                                </p>
                            </div>
                        )}
                    </motion.div>

                    <Button 
                        variant="ghost" 
                        onClick={handleReset}
                        className="w-full h-15 rounded-2xl bg-secondary/15 border border-white/5 text-[#4B6478] font-black text-[11px] uppercase tracking-[0.25em] gap-3 hover:bg-secondary/20 hover:text-[#F1F5F9] transition-all active:scale-98"
                    >
                        <RefreshCw size={16} strokeWidth={2.5} /> Reset Simulator
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function ResultRow({ label, value, icon: Icon, isPositive = null }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Icon size={12} className="text-[#4B6478]" />
                <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.2em]">{label}</p>
            </div>
            <p className={cn(
                "text-[15px] font-black leading-none tracking-tight",
                isPositive === true ? "text-emerald-400" : isPositive === false ? "text-red-400" : "text-white"
            )}>
                {value}
            </p>
        </div>
    )
}

