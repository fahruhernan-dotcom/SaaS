import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LayoutGrid, AlertCircle, Maximize2, Trash2, Box, Info, HelpCircle, ArrowRightLeft, Ruler } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import {
  useDombaActiveBatches,
  useDombaAnimals,
  useDombaKandangs,
  useCreateDombaKandang,
  useMoveDombaToKandang,
  useEnsureDombaHoldingPen
} from '@/lib/hooks/useDombaPenggemukanData'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrokerPageHeader } from '../../_shared/components/transactions/BrokerPageHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SPECIES_EMOJI = { kambing: '🐑', domba: '🐑' }

// Component: Hewan yang bisa di-drag
function AnimalToken({ animal, onDragStart }) {
  return (
    <motion.div
      layout
      layoutId={`animal-${animal.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, animal)}
      className="group relative bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-green-500/30 rounded-xl p-2.5 cursor-grab active:cursor-grabbing transition-all duration-300"
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98, opacity: 0.8 }}
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[10px] shadow-inner">
          {SPECIES_EMOJI[animal.species] || '🐑'}
        </div>
        <span className="text-[11px] font-['Sora'] font-black text-white truncate max-w-[80px]" title={animal.ear_tag}>
          {animal.ear_tag}
        </span>
      </div>
      
      {/* Hidden detail on hover effect - subtle glow */}
      <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 rounded-xl blur-sm transition-opacity" />
    </motion.div>
  )
}

// Component: Kotak Kandang (Drop Zone)
function KandangBox({ kandang, animalsInKandang, dragOver, onDragOver, onDragLeave, onDrop }) {
  const isOver = dragOver === kandang.id
  const isFull = kandang.capacity > 0 && animalsInKandang.length >= kandang.capacity
  const isHolding = kandang.is_holding

  // Warna border & background
  let borderColor = 'border-white/[0.04]'
  let bgGradient = 'bg-white/[0.01]'
  
  if (isOver) {
    if (isFull && !isHolding) {
      borderColor = 'border-red-500 ring-4 ring-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
      bgGradient = 'bg-red-500/[0.08]'
    } else {
      borderColor = 'border-green-500 ring-4 ring-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.2)]'
      bgGradient = 'bg-green-500/[0.08]'
    }
  } else if (isHolding) {
    borderColor = 'border-dashed border-amber-500/20 hover:border-amber-500/40'
    bgGradient = 'bg-amber-500/[0.02]'
  }

  const capacityRatio = !isHolding && kandang.capacity > 0 ? (animalsInKandang.length / kandang.capacity) : 0
  
  let capColor = 'text-[#4B6478]'
  let capBg = 'bg-white/[0.03]'
  let progressColor = 'bg-[#4B6478]'

  if (capacityRatio >= 1) {
    capColor = 'text-red-400'
    capBg = 'bg-red-500/10'
    progressColor = 'bg-red-500'
  } else if (capacityRatio >= 0.8) {
    capColor = 'text-amber-400'
    capBg = 'bg-amber-500/10'
    progressColor = 'bg-amber-500'
  } else if (capacityRatio > 0) {
    capColor = 'text-green-400'
    capBg = 'bg-green-500/10'
    progressColor = 'bg-green-500'
  }

  const shakeVariants = {
    shake: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } },
    idle: { x: 0 }
  }

  const onDragHandlers = {
    onDragOver: (e) => onDragOver(e, kandang),
    onDragLeave,
    onDrop: (e) => onDrop(e, kandang)
  }

  return (
    <motion.div
      variants={shakeVariants}
      animate={isOver && isFull && !isHolding ? 'shake' : 'idle'}
      {...onDragHandlers}
      className={cn(
        "group h-full flex flex-col rounded-[2.5rem] border-2 transition-all duration-300 relative overflow-hidden shadow-2xl",
        borderColor,
        bgGradient
      )}
    >
      {/* Decorative background number/ID */}
      <div className="absolute -bottom-6 -right-6 text-[100px] font-black text-white/[0.02] pointer-events-none select-none italic">
        {kandang.name.split('-').pop()}
      </div>

      {/* Header Kandang */}
      <div className={cn(
        "p-6 flex flex-col gap-3 relative z-10",
        isHolding ? "bg-amber-500/[0.03]" : "bg-white/[0.01]"
      )}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors shadow-inner",
              isHolding ? "bg-amber-500/10 border-amber-500/20" : "bg-green-500/10 border-green-500/20"
            )}>
              {isHolding ? <Box size={18} className="text-amber-400" /> : <LayoutGrid size={18} className="text-green-400" />}
            </div>
            <div>
              <h3 className="font-['Sora'] font-black text-white text-base tracking-tight leading-none mb-1.5 uppercase">
                {kandang.name}
              </h3>
              {!isHolding && kandang.luas_m2 ? (
                <div className="flex items-center gap-1.5 opacity-50">
                   <Ruler size={10} className="text-[#4B6478]" />
                   <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">{kandang.panjang_m}x{kandang.lebar_m}m ({kandang.luas_m2}m²)</p>
                </div>
              ) : (
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest opacity-50">Area Holding</p>
              )}
            </div>
          </div>
          <div className={cn("px-3 py-1.5 rounded-xl border font-black text-[11px] tabular-nums shadow-inner", capBg, capColor, "border-white/5")}>
            {animalsInKandang.length} {isHolding ? 'EKOR' : `/ ${kandang.capacity}`}
          </div>
        </div>

        {!isHolding && (
           <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${Math.min(100, capacityRatio * 100)}%` }}
                 className={cn("h-full rounded-full transition-colors", progressColor)}
              />
           </div>
        )}
      </div>

      {/* Grid Hewan */}
      <div className={cn(
        "p-5 flex-1 overflow-y-auto no-scrollbar relative z-10",
        animalsInKandang.length === 0 ? "flex items-center justify-center" : "flex flex-wrap gap-2.5 content-start"
      )}>
        <AnimatePresence mode="popLayout">
          {animalsInKandang.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center opacity-20 transform -translate-y-2">
               <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center mb-3">
                 <Plus size={20} />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center">Empty Zone</p>
            </motion.div>
          ) : (
            animalsInKandang.map(a => (
              <AnimalToken key={a.id} animal={a} onDragStart={onDragStart} />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button for detail (Subtle) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <button className="p-1 px-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-[9px] font-black uppercase text-[#4B6478] hover:text-white transition-all">
            Manage
         </button>
      </div>
    </motion.div>
  )

  function onDragStart(e, animal) {
    e.dataTransfer.setData('animalId', animal.id)
    e.dataTransfer.effectAllowed = 'move'
    
    // Custom drag shadow
    const ghost = e.currentTarget.cloneNode(true)
    ghost.style.position = 'absolute'
    ghost.style.top = '-1000px'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => ghost.remove(), 0)
  }
}

export default function KandangView() {
  const { tenant } = useAuth()
  const { data: batches = [], isLoading: loadingBatches } = useDombaActiveBatches()
  const [selectedBatch, setSelectedBatch] = useState('')

  useEffect(() => {
    if (batches.length > 0 && !selectedBatch) setSelectedBatch(batches[0].id)
  }, [batches, selectedBatch])

  const { data: kandangs = [], isLoading: loadKdg } = useDombaKandangs(selectedBatch)
  const { data: animals = [], isLoading: loadAni } = useDombaAnimals(selectedBatch)
  const ensureHoldingPen = useEnsureDombaHoldingPen()
  
  useEffect(() => {
    if (selectedBatch) ensureHoldingPen.mutate(selectedBatch)
  }, [selectedBatch])

  const createKandang = useCreateDombaKandang()
  const moveAnimal = useMoveDombaToKandang()

  const [dragOverKandang, setDragOverKandang] = useState(null)
  const [addSheet, setAddSheet] = useState(false)
  const [calcMode, setCalcMode] = useState('dimensi')
  const [form, setForm] = useState({ name: '', capacity: '', panjang: '', lebar: '', standard: '1.0' })

  // Hooks for checking if isDesktop
  const isDesktop = true // Visual simplification

  const groupedAnimals = useMemo(() => {
    const map = {}
    kandangs.forEach(k => map[k.id] = [])
    const activeAnimals = animals.filter(a => a.status === 'active')
    activeAnimals.forEach(a => {
      if (a.kandang_id && map[a.kandang_id]) map[a.kandang_id].push(a)
      else {
        const holdingPen = kandangs.find(k => k.is_holding)
        if (holdingPen) map[holdingPen.id].push(a)
      }
    })
    return map
  }, [animals, kandangs])

  const handleDragOver = (e, kandang) => {
    e.preventDefault()
    if (dragOverKandang !== kandang.id) setDragOverKandang(kandang.id)
  }

  const handleDrop = (e, targetKandang) => {
    e.preventDefault()
    setDragOverKandang(null)
    const animalId = e.dataTransfer.getData('animalId')
    if (!animalId) return
    const animal = animals.find(a => a.id === animalId)
    if (!animal || animal.kandang_id === targetKandang.id) return
    if (!animal.kandang_id && targetKandang.is_holding) return 

    if (!targetKandang.is_holding && targetKandang.capacity > 0) {
      const currentInTarget = groupedAnimals[targetKandang.id]?.length || 0
      if (currentInTarget >= targetKandang.capacity) return toast.error(`Kandang ${targetKandang.name} sudah penuh!`)
    }

    moveAnimal.mutate({ animalId, kandangId: targetKandang.id, kandangSlot: targetKandang.name, batchId: selectedBatch }, {
      onSuccess: () => toast.success(`${animal.ear_tag} dipindah ke ${targetKandang.name}`)
    })
  }

  const handleSaveKandang = () => {
    if (!form.name) return toast.error('Nama kandang wajib diisi')
    let finalCapacity = 0, panjang = null, lebar = null
    if (calcMode === 'dimensi') {
      const p = parseFloat(form.panjang), l = parseFloat(form.lebar)
      if (!p || !l) return toast.error('Dimensi wajib diisi')
      panjang = p; lebar = l; finalCapacity = Math.floor((p * l) / parseFloat(form.standard))
    } else {
      finalCapacity = parseInt(form.capacity)
      if (!finalCapacity || finalCapacity <= 0) return toast.error('Kapasitas tidak valid')
    }
    createKandang.mutate({ batch_id: selectedBatch, name: form.name, capacity: finalCapacity, panjang_m: panjang, lebar_m: lebar, is_holding: false }, {
      onSuccess: () => { setAddSheet(false); setForm({ name: '', capacity: '', panjang: '', lebar: '', standard: '1.0' }) }
    })
  }

  const previewCapacity = useMemo(() => {
    if (calcMode !== 'dimensi') return 0
    const p = parseFloat(form.panjang), l = parseFloat(form.lebar)
    return (p && l) ? Math.floor((p * l) / parseFloat(form.standard)) : 0
  }, [form.panjang, form.lebar, form.standard, calcMode])

  if (loadingBatches) return <LoadingSpinner fullPage />
  const normalKandangs = kandangs.filter(k => !k.is_holding)
  const holdingPen = kandangs.find(k => k.is_holding)

  return (
    <div className="flex flex-col h-full bg-[#06090F]">
      <BrokerPageHeader 
        title="Helicopter View"
        subtitle="Manajemen alokasi kandang dan sebaran ternak secara visual."
        icon={<LayoutGrid size={20} className="text-green-400" />}
        actionButton={
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl pr-3">
                <select
                  value={selectedBatch}
                  onChange={e => setSelectedBatch(e.target.value)}
                  className="bg-transparent h-8 pl-3 text-[11px] font-black uppercase tracking-widest text-green-400 focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#121A21]">-- PILIH BATCH --</option>
                  {batches.map(b => <option key={b.id} value={b.id} className="bg-[#121A21]">{b.batch_code}</option>)}
                </select>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-1.5 min-w-[100px]">
                   <span className="text-[10px] font-black text-[#4B6478] uppercase">{animals.length} EKOR</span>
                </div>
             </div>
             
             {selectedBatch && (
               <Button onClick={() => setAddSheet(true)} className="bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[10px] tracking-widest h-10 px-5 rounded-xl shadow-[0_4px_15px_rgba(34,197,94,0.3)] gap-2">
                 <Plus size={16} /> Kandang
               </Button>
             )}
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-5 space-y-12 custom-scrollbar">
        {!selectedBatch ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
            <LayoutGrid size={48} className="text-[#4B6478] mb-4" />
            <p className="font-['Sora'] font-black text-white uppercase tracking-[0.2em]">Pilih Batch Terlebih Dahulu</p>
          </div>
        ) : loadKdg || loadAni ? (
          <div className="h-full flex justify-center items-center"><LoadingSpinner /></div>
        ) : (
          <div className="max-w-[1800px] mx-auto space-y-10">
            
            <div className="anime-grid-view">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Area Produksi</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20">{normalKandangs.length} KOTAK</span>
                </div>
              </div>
              
              {normalKandangs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-white/[0.04] rounded-[3rem] bg-white/[0.01]">
                   <Box size={40} className="text-white/10 mb-4" />
                   <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest mb-4">Gudang Produksi Kosong</p>
                   <Button variant="outline" onClick={() => setAddSheet(true)} className="border-white/10 text-white/40 hover:text-white rounded-xl uppercase text-[10px] font-black h-9">Buat Baru</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  <AnimatePresence mode="popLayout">
                    {normalKandangs.map((k, i) => (
                      <motion.div key={k.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="h-[340px]">
                        <KandangBox kandang={k} animalsInKandang={groupedAnimals[k.id] || []} dragOver={dragOverKandang} onDragOver={handleDragOver} onDragLeave={() => setDragOverKandang(null)} onDrop={handleDrop} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {holdingPen && (
              <div className="anime-holding-view mt-12">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-[11px] font-black text-amber-500/70 uppercase tracking-[0.3em]">Holding Area</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-amber-500/10 to-transparent"></div>
                   <div className="flex items-center gap-2 group cursor-help">
                      <HelpCircle size={14} className="text-[#4B6478]" />
                      <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Penampungan Sementara</span>
                   </div>
                </div>
                <div className="h-[280px]">
                  <KandangBox kandang={holdingPen} animalsInKandang={groupedAnimals[holdingPen.id] || []} dragOver={dragOverKandang} onDragOver={handleDragOver} onDragLeave={() => setDragOverKandang(null)} onDrop={handleDrop} />
                </div>
                
                <div className="mt-6 p-6 rounded-[2rem] bg-amber-500/[0.03] border border-amber-500/10 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                         <ArrowRightLeft size={20} className="text-amber-500" />
                      </div>
                      <div>
                         <p className="text-sm font-['Sora'] font-black text-white uppercase tracking-tight">Manual Alokasi</p>
                         <p className="text-[11px] text-[#4B6478] font-bold">Tarik koin ear-tag dari Holding Area ke Kandang Produksi untuk memindahkan secara visual.</p>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Sheet open={addSheet} onOpenChange={setAddSheet}>
        <SheetContent side="bottom" className={cn("bg-[#0C1319]/95 backdrop-blur-xl border-white/10 p-0 flex flex-col rounded-t-[40px] max-h-[92vh]")}>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <SheetHeader className="text-left">
              <SheetTitle className="font-['Sora'] font-black text-2xl text-white">Buat Kandang Baru</SheetTitle>
              <p className="text-xs text-[#4B6478] font-bold uppercase tracking-widest">Konfigurasi kapasitas dan dimensi gudang produksi.</p>
            </SheetHeader>

            <Tabs value={calcMode} onValueChange={setCalcMode} className="w-full">
              <TabsList className="bg-white/[0.03] border border-white/[0.08] p-1.5 mb-8 rounded-2xl w-full">
                <TabsTrigger value="dimensi" className="flex-1 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-xl h-10 transition-all">Smart Capacity</TabsTrigger>
                <TabsTrigger value="manual" className="flex-1 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 rounded-xl h-10 transition-all">Manual Input</TabsTrigger>
              </TabsList>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Nama / Identitas Kandang *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="CONTOH: KANDANG-A1" className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold focus:outline-none focus:border-green-500/50 transition-all text-white" />
                </div>

                <TabsContent value="dimensi" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Panjang (m)</label>
                      <input type="number" value={form.panjang} onChange={e => setForm(f => ({ ...f, panjang: e.target.value }))} className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Lebar (m)</label>
                      <input type="number" value={form.lebar} onChange={e => setForm(f => ({ ...f, lebar: e.target.value }))} className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Kepadatan Ideal</label>
                    <select value={form.standard} onChange={e => setForm(f => ({ ...f, standard: e.target.value }))} className="w-full h-14 bg-[#111C24] border border-white/10 rounded-2xl px-5 text-xs font-bold text-white">
                      <option value="1.0">1.0 m² / ekor (Standard Domba)</option>
                      <option value="1.5">1.5 m² / ekor (Domba Bunting)</option>
                      <option value="0.8">0.8 m² / ekor (Lepas Sapih)</option>
                    </select>
                  </div>
                  <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-[2rem] flex items-center gap-4">
                     <Info size={24} className="text-green-400 shrink-0" />
                     <div>
                        <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-1">Estimasi Smart Capacity</p>
                        <p className="text-sm font-bold text-white tabular-nums">{previewCapacity} Ekor Ternak</p>
                     </div>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-6 mt-0">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Limit Kapasitas *</label>
                      <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white" />
                   </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
          <div className="p-8 border-t border-white/[0.04] bg-[#06090F]">
             <Button onClick={handleSaveKandang} disabled={createKandang.isPending} className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[11px] tracking-widest rounded-[2rem] shadow-[0_8px_20px_rgba(34,197,94,0.3)]">
                {createKandang.isPending ? 'Menyimpan...' : 'Gunakan Kandang Ini'}
             </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}