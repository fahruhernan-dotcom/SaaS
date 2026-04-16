import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LayoutGrid, AlertCircle, Maximize2, Trash2, Box, Info } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import {
  useKdActiveBatches,
  useKdAnimals,
  useKdKandangs,
  useCreateKdKandang,
  useMoveAnimalToKandang,
  useEnsureHoldingPen
} from '@/lib/hooks/useKdPenggemukanData'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const SPECIES_EMOJI = { kambing: '🐐', domba: '🐑' }

// Component: Hewan yang bisa di-drag
function AnimalToken({ animal, onDragStart }) {
  return (
    <motion.div
      layout
      layoutId={`animal-${animal.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, animal)}
      className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 cursor-grab active:cursor-grabbing text-xs flex items-center gap-1.5 shadow-sm transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95, opacity: 0.8 }}
    >
      <span>{SPECIES_EMOJI[animal.species] || '🐏'}</span>
      <span className="font-semibold text-white truncate max-w-[80px]" title={animal.ear_tag}>
        {animal.ear_tag}
      </span>
    </motion.div>
  )
}

// Component: Kotak Kandang (Drop Zone)
function KandangBox({ kandang, animalsInKandang, dragOver, onDragOver, onDragLeave, onDrop }) {
  const isOver = dragOver === kandang.id
  const isFull = kandang.capacity > 0 && animalsInKandang.length >= kandang.capacity
  const isHolding = kandang.is_holding

  // Warna border
  let borderColor = 'border-white/10'
  let bgGradient = 'bg-white/[0.02]'
  
  if (isOver) {
    if (isFull && !isHolding) {
      borderColor = 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
      bgGradient = 'bg-red-500/10'
    } else {
      borderColor = 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
      bgGradient = 'bg-green-500/10'
    }
  } else if (isHolding) {
    borderColor = 'border-white/20 border-dashed hover:border-white/30'
    bgGradient = 'bg-white/[0.01]'
  }

  // Animasi penuh
  const shakeVariants = {
    shake: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } },
    idle: { x: 0 }
  }

  const capacityRatio = !isHolding && kandang.capacity > 0 ? (animalsInKandang.length / kandang.capacity) : 0
  
  let capColor = 'text-[#4B6478]'
  if (capacityRatio >= 1) capColor = 'text-red-400'
  else if (capacityRatio >= 0.7) capColor = 'text-amber-400'
  else if (capacityRatio > 0) capColor = 'text-green-400'

  return (
    <motion.div
      variants={shakeVariants}
      animate={isOver && isFull && !isHolding ? 'shake' : 'idle'}
      onDragOver={(e) => onDragOver(e, kandang)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, kandang)}
      className={`rounded-2xl transition-all duration-200 border-2 ${borderColor} ${bgGradient} flex flex-col h-full`}
    >
      {/* Header Kandang */}
      <div className={`p-3 border-b ${isHolding ? 'border-dashed border-white/10' : 'border-white/5'} flex justify-between items-start`}>
        <div>
          <h3 className="font-['Sora'] font-bold text-white text-sm flex items-center gap-2">
            {isHolding ? <Box size={14} className="text-amber-400" /> : <LayoutGrid size={14} className="text-emerald-400" />}
            {kandang.name}
          </h3>
          {!isHolding && kandang.luas_m2 && (
            <p className="text-[10px] text-[#4B6478] mt-0.5">{kandang.panjang_m}m x {kandang.lebar_m}m ({kandang.luas_m2}m²)</p>
          )}
        </div>
        <div className={`px-2 py-1 rounded-md bg-black/40 text-[10px] font-bold ${capColor}`}>
          {animalsInKandang.length} {isHolding ? 'ekor' : `/ ${kandang.capacity}`}
        </div>
      </div>

      {/* Grid Hewan */}
      <div className={`p-3 p-4 flex-1 overflow-y-auto max-h-[250px] flex flex-wrap gap-2 ${animalsInKandang.length === 0 ? 'items-center justify-center' : 'items-start content-start'}`}>
        <AnimatePresence>
          {animalsInKandang.length === 0 ? (
            <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-xs text-[#4B6478]/50 text-center w-full">
              Kosong
            </motion.p>
          ) : (
            animalsInKandang.map(a => (
              <AnimalToken key={a.id} animal={a} onDragStart={onDragStart} />
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )

  // Drag handlers specifically for AnimalToken are passed down
  function onDragStart(e, animal) {
    e.dataTransfer.setData('animalId', animal.id)
    e.dataTransfer.effectAllowed = 'move'
  }
}


export default function KandangView() {
  const { tenant } = useAuth()
  const { data: batches = [], isLoading: loadingBatches } = useKdActiveBatches()
  const [selectedBatch, setSelectedBatch] = useState('')

  // Auto-select first active batch
  useEffect(() => {
    if (batches.length > 0 && !selectedBatch) {
      setSelectedBatch(batches[0].id)
    }
  }, [batches, selectedBatch])

  // Data Hooks
  const { data: kandangs = [], isLoading: loadKdg } = useKdKandangs(selectedBatch)
  const { data: animals = [], isLoading: loadAni } = useKdAnimals(selectedBatch)
  const ensureHoldingPen = useEnsureHoldingPen()
  
  // Ensure holding pen exists when batch is selected
  useEffect(() => {
    if (selectedBatch) {
      ensureHoldingPen.mutate(selectedBatch)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch])

  const createKandang = useCreateKdKandang()
  const moveAnimal = useMoveAnimalToKandang()

  // Drag State
  const [dragOverKandang, setDragOverKandang] = useState(null)

  // Add Modal State
  const [addSheet, setAddSheet] = useState(false)
  const [calcMode, setCalcMode] = useState('dimensi') // 'dimensi' or 'manual'
  const [form, setForm] = useState({
    name: '', capacity: '', panjang: '', lebar: '', standard: '1.0' // 1.0 domba, 1.25 kambing
  })

  // Group animals by kandang
  const groupedAnimals = useMemo(() => {
    const map = {}
    kandangs.forEach(k => map[k.id] = [])
    
    // Sort logic to handle missing holding pens gracefully
    const activeAnimals = animals.filter(a => a.status === 'active')
    
    activeAnimals.forEach(a => {
      // If animal's kandang_id matches a known kandang, put it there
      if (a.kandang_id && map[a.kandang_id]) {
        map[a.kandang_id].push(a)
      } else {
        // Find holding pen
        const holdingPen = kandangs.find(k => k.is_holding)
        if (holdingPen) {
          map[holdingPen.id].push(a)
        }
      }
    })
    return map
  }, [animals, kandangs])

  // Drag and Drop Logic
  const handleDragOver = (e, kandang) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverKandang !== kandang.id) setDragOverKandang(kandang.id)
  }

  const handleDragLeave = () => {
    setDragOverKandang(null)
  }

  const handleDrop = (e, targetKandang) => {
    e.preventDefault()
    setDragOverKandang(null)
    const animalId = e.dataTransfer.getData('animalId')
    if (!animalId) return

    const animal = animals.find(a => a.id === animalId)
    if (!animal) return

    // Cek apakah sama
    if (animal.kandang_id === targetKandang.id) return
    
    // Kalau sudah pernah punya nama slot lama tapi isHolding
    if (!animal.kandang_id && targetKandang.is_holding) return 

    // Cek Kapasitas
    if (!targetKandang.is_holding && targetKandang.capacity > 0) {
      const currentInTarget = groupedAnimals[targetKandang.id]?.length || 0
      if (currentInTarget >= targetKandang.capacity) {
        toast.error(`Kandang ${targetKandang.name} sudah penuh!`)
        // The shake animation has already ran because it checked isFull in handleDragOver
        return
      }
    }

    // Eksekusi Pindah
    moveAnimal.mutate({
      animalId,
      kandangId: targetKandang.id,
      kandangSlot: targetKandang.name,
      batchId: selectedBatch
    }, {
      onSuccess: () => {
        toast.success(`${animal.ear_tag} dipindah ke ${targetKandang.name}`)
      }
    })
  }

  // Create Kandang Logic
  const handleSaveKandang = () => {
    if (!form.name) return toast.error('Nama kandang wajib diisi')
    
    let finalCapacity = 0
    let panjang = null
    let lebar = null

    if (calcMode === 'dimensi') {
      const p = parseFloat(form.panjang)
      const l = parseFloat(form.lebar)
      if (!p || !l) return toast.error('Panjang dan lebar wajib diizsi')
      panjang = p
      lebar = l
      const std = parseFloat(form.standard) || 1
      finalCapacity = Math.floor((p * l) / std)
    } else {
      finalCapacity = parseInt(form.capacity)
      if (!finalCapacity || finalCapacity <= 0) return toast.error('Kapasitas tidak valid')
    }

    createKandang.mutate({
      batch_id: selectedBatch,
      name: form.name,
      capacity: finalCapacity,
      panjang_m: panjang,
      lebar_m: lebar,
      is_holding: false,
    }, {
      onSuccess: () => {
        setAddSheet(false)
        setForm({ name: '', capacity: '', panjang: '', lebar: '', standard: '1.0' })
      }
    })
  }

  // Dimensi Computed Preview
  const previewCapacity = useMemo(() => {
    if (calcMode !== 'dimensi') return 0
    const p = parseFloat(form.panjang)
    const l = parseFloat(form.lebar)
    const std = parseFloat(form.standard) || 1
    if (p && l && std) {
      return Math.floor((p * l) / std)
    }
    return 0
  }, [form.panjang, form.lebar, form.standard, calcMode])

  if (loadingBatches) return <LoadingSpinner fullPage />

  // Pisahkan Holding Pen dari kandang biasa
  const normalKandangs = kandangs.filter(k => !k.is_holding)
  const holdingPen = kandangs.find(k => k.is_holding)

  return (
    <div className="text-slate-100 min-h-screen pb-24 bg-[#06090F]">
      {/* Header */}
      <header className="px-5 pt-8 pb-6 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                <LayoutGrid size={18} />
              </div>
              <h1 className="font-['Sora'] font-black text-2xl text-white">Denah Kandang</h1>
            </div>
            <p className="text-sm text-[#4B6478]">Helicopter view manajemen alokasi ternak</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
              className="px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-emerald-500/50 min-w-[200px]"
            >
              <option value="">-- Pilih Batch --</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.batch_code} ({b.kandang_name})</option>
              ))}
            </select>
            
            {selectedBatch && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setAddSheet(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 transition-colors rounded-xl text-white text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <Plus size={16} /> Kandang
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-5">
        {!selectedBatch ? (
          <div className="text-center py-20">
            <p className="text-[#4B6478]">Pilih batch terlebih dahulu</p>
          </div>
        ) : loadKdg || loadAni ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="space-y-6">
            
            {/* Grid Kandang Normal */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Kandang Produksi</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
              </div>
              
              {normalKandangs.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <p className="text-xs text-[#4B6478]">Belum ada Kandang Produksi.</p>
                  <button onClick={() => setAddSheet(true)} className="mt-2 text-sm text-emerald-400 font-semibold hover:underline">Buat Baru</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {normalKandangs.map((k, i) => (
                      <motion.div
                        key={k.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="h-[300px]"
                      >
                        <KandangBox
                          kandang={k}
                          animalsInKandang={groupedAnimals[k.id] || []}
                          dragOver={dragOverKandang}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Holding Pen Area */}
            {holdingPen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} /> Holding Pen
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent"></div>
                </div>

                <div className="h-[250px]">
                  <KandangBox
                    kandang={holdingPen}
                    animalsInKandang={groupedAnimals[holdingPen.id] || []}
                    dragOver={dragOverKandang}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* Tambah Kandang Sheet */}
      <Sheet open={addSheet} onOpenChange={setAddSheet}>
        <SheetContent side="bottom" className="bg-[#0C1319] border-t border-white/10 rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="font-['Sora'] font-black text-white text-lg">Tambah Kandang Produksi</SheetTitle>
          </SheetHeader>

          <Tabs value={calcMode} onValueChange={setCalcMode} className="w-full">
            <TabsList className="bg-white/5 border border-white/10 mb-6 p-1">
              <TabsTrigger value="dimensi" className="text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Smart Capacity (Dimensi)</TabsTrigger>
              <TabsTrigger value="manual" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white">Input Manual</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Nama / Kode Kandang *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: KDH-Utara-01"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <TabsContent value="dimensi" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Panjang (meter) *</label>
                    <input
                      type="number" step="0.1"
                      value={form.panjang}
                      onChange={e => setForm(f => ({ ...f, panjang: e.target.value }))}
                      placeholder="10"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Lebar (meter) *</label>
                    <input
                      type="number" step="0.1"
                      value={form.lebar}
                      onChange={e => setForm(f => ({ ...f, lebar: e.target.value }))}
                      placeholder="5"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Standar Kepadatan (SNI/FAO)</label>
                  <select
                    value={form.standard}
                    onChange={e => setForm(f => ({ ...f, standard: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="1.0">1.0 m² / ekor (Domba Dewasa)</option>
                    <option value="1.25">1.25 m² / ekor (Kambing Dewasa)</option>
                    <option value="1.5">1.5 m² / ekor (Kambing/Domba Bunting)</option>
                    <option value="0.8">0.8 m² / ekor (Cempe Lepas Sapih)</option>
                  </select>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                  <Info size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400 mb-0.5">Preview Kapasitas Efektif</h4>
                    <p className="text-xs text-[#4B6478]">
                      Dengan luas {form.panjang && form.lebar ? (parseFloat(form.panjang) * parseFloat(form.lebar)).toFixed(1) : 0} m², kandang ini optimal untuk <span className="text-white font-bold">{previewCapacity} ekor</span>.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4 mt-0">
                <div>
                  <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Kapasitas Maksimal (ekor) *</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                    placeholder="25"
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                  <p className="text-[10px] text-[#4B6478] mt-1.5">Jika limit ini tercapai, hewan tidak bisa di-drop ke kandang ini.</p>
                </div>
              </TabsContent>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveKandang}
              disabled={createKandang.isPending}
              className="w-full mt-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex justify-center items-center gap-2"
            >
              {createKandang.isPending ? 'Menyimpan...' : 'Simpan Kandang'}
            </motion.button>
          </Tabs>
        </SheetContent>
      </Sheet>

    </div>
  )
}
