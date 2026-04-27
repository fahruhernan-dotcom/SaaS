import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, LayoutGrid, Box, HelpCircle, ArrowRightLeft, Info,
  X, Map, Ruler, ChevronDown, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PALETTE } from './constants'
import LoadingSpinner from '../../../../_shared/components/LoadingSpinner'
import { BrokerPageHeader } from '../../../../_shared/components/transactions/BrokerPageHeader'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AnimalDetailSheet from './AnimalDetailSheet'
import BatchSummaryBar from './BatchSummaryBar'
import KandangBox from './KandangBox'
import DenahLantai from './DenahLantai'
import StickerPeel from '@/dashboard/peternak/_shared/components/StickerPeel'
import sheepSticker from '@/assets/sheep_sticker.png'

/**
 * Full kandang management page — supports any livestock species.
 *
 * @param {object} props.speciesConfig
 *   emoji, targetHari, adgThresholds, weightScaling, weightRecordsKey,
 *   calcADG, calcHari
 *
 * @param {object} props.hooks
 *   useActiveBatches, useAnimalsByBatches, useKandangs,
 *   useCreateKandang, useUpdateKandang, useUpdateKandangPosition,
 *   useDeleteKandang (optional), useMoveToKandang, useEnsureHoldingPen
 *
 * @param {string} [props.pageTitle]
 */
export default function KandangViewLayout({ speciesConfig, hooks, pageTitle }) {
  const { emoji, targetHari } = speciesConfig

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: batches = [], isLoading: loadingBatches } = hooks.useActiveBatches()
  const [selectedBatch, setSelectedBatch] = useState('all')
  const [viewMode, setViewMode] = useState('helicopter')

  const isAllBatches = selectedBatch === 'all'
  const batchIdsToLoad = useMemo(
    () => isAllBatches ? batches.map(b => b.id) : (selectedBatch ? [selectedBatch] : []),
    [isAllBatches, batches, selectedBatch]
  )

  const { data: kandangs = [], isLoading: loadKdg } = hooks.useKandangs()
  const { data: animals = [], isLoading: loadAni } = hooks.useAnimalsByBatches(batchIdsToLoad)
  const ensureHoldingPen = hooks.useEnsureHoldingPen()
  const createKandang = hooks.useCreateKandang()
  const updateKdg = hooks.useUpdateKandang()
  const moveAnimal = hooks.useMoveToKandang()
  const deleteKandang = hooks.useDeleteKandang?.()

  useEffect(() => { ensureHoldingPen.mutate() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeBatchId = isAllBatches ? (batches[0]?.id ?? null) : selectedBatch

  // ── Batch color map ───────────────────────────────────────────────────────
  const batchColorMap = useMemo(() => {
    const map = {}
    batches.forEach((b, i) => { map[b.id] = { ...PALETTE[i % PALETTE.length], batch_code: b.batch_code } })
    return map
  }, [batches])

  // ── Grouped animals ───────────────────────────────────────────────────────
  const groupedAnimals = useMemo(() => {
    const map = {}
    kandangs.forEach(k => { map[k.id] = [] })
    animals.filter(a => a.status === 'active' && !a.is_sold && !a.is_sale).forEach(a => {
      if (a.kandang_id && map[a.kandang_id]) map[a.kandang_id].push(a)
      else { const hp = kandangs.find(k => k.is_holding); if (hp) map[hp.id].push(a) }
    })
    return map
  }, [animals, kandangs])

  const holdingPen = kandangs.find(k => k.is_holding)
  const holdingCount = holdingPen ? (groupedAnimals[holdingPen.id]?.length || 0) : 0

  // ── UI state ─────────────────────────────────────────────────────────────
  const [dragOverKandang, setDragOverKandang] = useState(null)
  const [addSheet, setAddSheet] = useState(false)
  const [editingKandang, setEditingKandang] = useState(null)
  const [activeDetailKandang, setActiveDetailKandang] = useState(null)
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [calcMode, setCalcMode] = useState('dimensi')
  const [form, setForm] = useState({ name: '', capacity: '', panjang: '', lebar: '', standard: '1.5' })
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false)
  const [triggerRect, setTriggerRect] = useState(null)
  const batchDropdownRef = useRef(null)
  const batchTriggerRef = useRef(null)

  // Denah Lantai lifted state
  const [floorMode, setFloorMode] = useState('view')
  const [placingKandang, setPlacingKandang] = useState(null)
  const [drawStart, setDrawStart] = useState(null)
  const [drawCurrent, setDrawCurrent] = useState(null)
  const [pendingRect, setPendingRect] = useState(null)
  const [pendingName, setPendingName] = useState('')
  const [dragging, setDragging] = useState(null)

  // Click-outside to close batch dropdown
  useEffect(() => {
    if (!batchDropdownOpen) return
    const handler = (e) => {
      const inWrapper = batchDropdownRef.current?.contains(e.target)
      const inTrigger = batchTriggerRef.current?.contains(e.target)
      if (!inWrapper && !inTrigger) setBatchDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [batchDropdownOpen])

  useEffect(() => {
    const handleCustomDrop = (e) => {
      const { animalId, kandangId } = e.detail
      const targetK = kandangs.find(k => k.id === kandangId)
      if (!targetK) return

      const animal = animals.find(a => a.id === animalId)
      if (!animal || animal.kandang_id === targetK.id) return

      if (!targetK.is_holding && targetK.capacity > 0 && (groupedAnimals[targetK.id]?.length || 0) >= targetK.capacity) {
        return toast.error(`Kandang ${targetK.name} penuh!`)
      }

      moveAnimal.mutate(
        { animalId, kandangId: targetK.id, kandangSlot: targetK.name, batchId: animal.batch_id ?? activeBatchId },
        { onSuccess: () => toast.success(`${animal.ear_tag} dipindah ke ${targetK.name}`) }
      )
    }
    window.addEventListener('animalDrop', handleCustomDrop)
    return () => window.removeEventListener('animalDrop', handleCustomDrop)
  }, [kandangs, animals, groupedAnimals, activeBatchId, moveAnimal])

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragOver = (e, k) => { e.preventDefault(); if (dragOverKandang !== k.id) setDragOverKandang(k.id) }
  const handleDrop = (e, targetK) => {
    e.preventDefault(); setDragOverKandang(null)
    const animalId = e.dataTransfer.getData('animalId')
    if (!animalId) return
    const animal = animals.find(a => a.id === animalId)
    if (!animal || animal.kandang_id === targetK.id) return
    if (!targetK.is_holding && targetK.capacity > 0 && (groupedAnimals[targetK.id]?.length || 0) >= targetK.capacity) return toast.error(`Kandang ${targetK.name} penuh!`)
    moveAnimal.mutate(
      { animalId, kandangId: targetK.id, kandangSlot: targetK.name, batchId: animal.batch_id ?? activeBatchId },
      { onSuccess: () => toast.success(`${animal.ear_tag} dipindah ke ${targetK.name}`) }
    )
  }

  const handleMoveFromSheet = (targetK) => {
    if (!selectedAnimal) return
    const current = groupedAnimals[targetK.id]?.length || 0
    if (!targetK.is_holding && targetK.capacity > 0 && current >= targetK.capacity) return toast.error(`Kandang ${targetK.name} penuh!`)
    moveAnimal.mutate(
      { animalId: selectedAnimal.id, kandangId: targetK.id, kandangSlot: targetK.name, batchId: selectedAnimal.batch_id ?? activeBatchId },
      { onSuccess: () => { toast.success(`${selectedAnimal.ear_tag} dipindah ke ${targetK.name}`); setSelectedAnimal(null) } }
    )
  }

  // ── Kandang CRUD ──────────────────────────────────────────────────────────
  const previewCapacity = useMemo(() => {
    const p = parseFloat(form.panjang), l = parseFloat(form.lebar)
    return (p && l) ? Math.floor((p * l) / parseFloat(form.standard)) : 0
  }, [form.panjang, form.lebar, form.standard])

  const handleSaveKandang = () => {
    if (!form.name) return toast.error('Nama wajib diisi')
    let cap = 0, p = null, l = null
    if (calcMode === 'dimensi') {
      p = parseFloat(form.panjang); l = parseFloat(form.lebar)
      if (!p || !l) return toast.error('Dimensi wajib diisi')
      cap = Math.floor((p * l) / parseFloat(form.standard))
    } else {
      cap = parseInt(form.capacity)
      if (!cap || cap <= 0) return toast.error('Kapasitas tidak valid')
    }
    createKandang.mutate(
      { name: form.name, capacity: cap, panjang_m: p, lebar_m: l, is_holding: false },
      { onSuccess: () => { setAddSheet(false); setForm({ name: '', capacity: '', panjang: '', lebar: '', standard: '1.5' }) } }
    )
  }

  const handleSavePendingRect = () => {
    if (!pendingName.trim() || !pendingRect) return
    createKandang.mutate(
      { name: pendingName.trim().toUpperCase(), capacity: Math.max(1, Math.floor((pendingRect.w * pendingRect.h) / 1.5)), panjang_m: pendingRect.w, lebar_m: pendingRect.h, grid_x: pendingRect.x, grid_y: pendingRect.y, is_holding: false },
      { onSuccess: () => { setPendingRect(null); setPendingName('') } }
    )
  }

  const handleDeleteKandang = (id) => {
    if (!deleteKandang) return toast.error('Hapus kandang belum tersedia')
    if (groupedAnimals[id]?.length > 0) return toast.error('Pindahkan hewan terlebih dahulu!')
    if (!confirm('Hapus kandang ini?')) return
    deleteKandang.mutate({ kandangId: id }, { onSuccess: () => setEditingKandang(null) })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingBatches) return <LoadingSpinner fullPage />
  const normalKandangs = kandangs.filter(k => !k.is_holding)

  return (
    <div className="flex flex-col bg-[#06090F]" style={{ flex: 1, minHeight: 0, margin: '-24px -32px', overflow: 'hidden' }}>
      <div className="relative">
        <BrokerPageHeader
          title={viewMode === 'helicopter' ? (pageTitle ?? 'Helicopter View') : 'Denah Lantai'}
          subtitle={viewMode === 'helicopter' ? 'Manajemen visual alokasi kandang.' : 'Skala riil 1:1 (1 kotak = 1 meter).'}
          icon={<LayoutGrid size={20} className="text-emerald-400" />}
          actionButton={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                <button onClick={() => { setViewMode('helicopter'); setFloorMode('view') }} className={cn('flex items-center gap-1.5 px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all', viewMode === 'helicopter' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-[#4B6478] hover:text-white')}><LayoutGrid size={11} /> Grid</button>
                <button onClick={() => setViewMode('denah')} className={cn('flex items-center gap-1.5 px-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all', viewMode === 'denah' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-[#4B6478] hover:text-white')}><Map size={11} /> Denah</button>
              </div>
              {/* ── Batch Selector Dropdown ── */}
              <div ref={batchDropdownRef}>
                <button
                  ref={batchTriggerRef}
                  onClick={() => {
                    const rect = batchTriggerRef.current?.getBoundingClientRect()
                    setTriggerRect(rect ?? null)
                    setBatchDropdownOpen(o => !o)
                  }}
                  className={cn(
                    'flex items-center gap-2.5 h-9 pl-3 pr-2.5 rounded-xl border transition-all duration-200',
                    'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14]',
                    batchDropdownOpen && 'bg-white/[0.06] border-white/[0.14]'
                  )}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 whitespace-nowrap">
                    {selectedBatch === 'all'
                      ? '🌾 Semua Batch'
                      : batches.find(b => b.id === selectedBatch)?.batch_code ?? '—'}
                  </span>
                  <div className="w-px h-3.5 bg-white/10" />
                  <span className="text-[10px] font-black text-[#4B6478] uppercase whitespace-nowrap">
                    {animals.filter(a => a.status === 'active').length} Ekor
                  </span>
                  <motion.div animate={{ rotate: batchDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={13} className="text-[#4B6478]" />
                  </motion.div>
                </button>
              </div>

              {!isAllBatches && (
                <Button onClick={() => setAddSheet(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest h-10 px-5 rounded-xl shadow-lg shadow-emerald-500/30 gap-2">
                  <Plus size={16} /> Kandang
                </Button>
              )}
            </div>
          }
        />

        {/* Decorative Sticker */}
        <div className="absolute top-[100px] right-[40px] z-[50] hidden lg:block pointer-events-auto">
          <StickerPeel
            imageSrc={sheepSticker}
            width={120}
            rotate={20}
            peelBackHoverPct={30}
            peelBackActivePct={50}
            initialPosition={{ x: 0, y: 0 }}
            className="opacity-70 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
      {/* ── Batch Dropdown Panel (fixed, escapes overflow:hidden) ── */}
      <AnimatePresence>
        {batchDropdownOpen && triggerRect && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: triggerRect.bottom + 8,
              right: window.innerWidth - triggerRect.right,
              zIndex: 9999,
            }}
            className="min-w-[210px] bg-[#0C1319]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* All batches option */}
            <button
              onClick={() => { setSelectedBatch('all'); setBatchDropdownOpen(false) }}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors',
                selectedBatch === 'all'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-[#8CA0B3] hover:bg-white/[0.04] hover:text-white'
              )}
            >
              <span className="text-base leading-none">🌾</span>
              <span className="text-[11px] font-black uppercase tracking-widest flex-1">Semua Batch</span>
              {selectedBatch === 'all' && <Check size={12} className="text-emerald-400 shrink-0" />}
            </button>

            {batches.length > 0 && <div className="mx-4 my-1 h-px bg-white/[0.06]" />}

            {batches.map(b => {
              const color = batchColorMap[b.id]
              const isActive = selectedBatch === b.id
              return (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBatch(b.id); setBatchDropdownOpen(false) }}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors',
                    isActive
                      ? 'bg-white/[0.04] text-white'
                      : 'text-[#8CA0B3] hover:bg-white/[0.04] hover:text-white'
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color?.dotColor ?? '#4B6478' }}
                  />
                  <span className="text-[11px] font-black uppercase tracking-widest flex-1">{b.batch_code}</span>
                  {isActive && <Check size={12} className="text-emerald-400 shrink-0" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animal detail overlay */}
      <AnimatePresence>
        {selectedAnimal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedAnimal(null)} />
            <AnimalDetailSheet animal={selectedAnimal} kandangs={kandangs} speciesConfig={speciesConfig} onClose={() => setSelectedAnimal(null)} onMove={handleMoveFromSheet} />
          </>
        )}
        {activeDetailKandang && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-10 right-10 z-[60] w-72 bg-[#0C1319]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl pointer-events-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-['Sora'] font-black text-white uppercase tracking-tight text-lg leading-tight">{activeDetailKandang.name}</h3>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Detail Inventaris</p>
              </div>
              <button onClick={() => setActiveDetailKandang(null)} className="p-2 hover:bg-white/10 rounded-full transition text-[#4B6478] hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar pr-2 mb-6">
              {(groupedAnimals[activeDetailKandang.id] || []).map(a => (
                <div key={a.id} onClick={() => setSelectedAnimal(a)} className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl hover:bg-white/[0.06] transition cursor-pointer group">
                  <div className="flex items-center gap-3"><span className="text-sm">{emoji}</span><span className="text-xs font-black text-white uppercase group-hover:text-emerald-400 transition">{a.ear_tag}</span></div>
                  <span className="text-[10px] font-bold text-[#4B6478]">{a.latest_weight_kg || a.entry_weight_kg} kg</span>
                </div>
              ))}
              {(groupedAnimals[activeDetailKandang.id] || []).length === 0 && <p className="text-center py-8 text-[10px] font-black text-[#4B6478] uppercase tracking-widest opacity-40">Kosong</p>}
            </div>
            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#4B6478]">
              <span>Populasi</span>
              <span className="text-white">{(groupedAnimals[activeDetailKandang.id] || []).length} / {activeDetailKandang.capacity} Ekor</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main views */}
      {loadKdg || loadAni ? (
        <div className="flex-1 flex justify-center items-center"><LoadingSpinner /></div>
      ) : viewMode === 'denah' ? (
        <div className="flex-1 min-h-0">
          <DenahLantai
            kandangs={kandangs}
            groupedAnimals={groupedAnimals}
            activeBatchId={activeBatchId}
            onAnimalClick={setSelectedAnimal}
            onKandangClick={setActiveDetailKandang}
            onKandangDoubleClick={setEditingKandang}
            activeDetailKandang={activeDetailKandang}
            floorMode={floorMode} setFloorMode={setFloorMode}
            placingKandang={placingKandang} setPlacingKandang={setPlacingKandang}
            drawStart={drawStart} setDrawStart={setDrawStart}
            drawCurrent={drawCurrent} setDrawCurrent={setDrawCurrent}
            pendingRect={pendingRect} setPendingRect={setPendingRect}
            pendingName={pendingName} setPendingName={setPendingName}
            dragging={dragging} setDragging={setDragging}
            hooks={hooks}
            speciesConfig={speciesConfig}
            batchColorMap={batchColorMap}
          />
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="max-w-[1800px] mx-auto space-y-10">
            {animals.length > 0 && (
              <BatchSummaryBar
                speciesConfig={speciesConfig}
                animals={animals}
                holdingCount={holdingCount}
                batches={batches}
                batchColorMap={batchColorMap}
                isAllBatches={isAllBatches}
              />
            )}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.3em]">Area Produksi</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest">{normalKandangs.length} KOTAK</span>
              </div>
              {normalKandangs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-white/[0.04] rounded-[3rem] bg-white/[0.01]">
                  <Box size={40} className="text-white/10 mb-4" />
                  <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest mb-4">Belum ada kandang produksi</p>
                  <Button variant="outline" onClick={() => setAddSheet(true)} className="border-white/10 text-[#4B6478] hover:text-white rounded-xl uppercase text-[10px] font-black h-10">Buat Kandang Baru</Button>
                </div>
              ) : (() => {
                // 1-3 kandang → fit exactly in one row; 4+ → lock at 3 per row and wrap
                const cols = Math.min(normalKandangs.length, 3)
                return (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      gap: '2rem',
                    }}
                  >
                    <AnimatePresence mode="popLayout">
                      {normalKandangs.map((k, i) => (
                        <motion.div key={k.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="h-[460px]">
                          <KandangBox
                            kandang={k}
                            animalsInKandang={groupedAnimals[k.id] || []}
                            dragOver={dragOverKandang}
                            onDragOver={handleDragOver}
                            onDragLeave={() => setDragOverKandang(null)}
                            onDrop={handleDrop}
                            onAnimalClick={setSelectedAnimal}
                            onKandangDoubleClick={setEditingKandang}
                            speciesConfig={speciesConfig}
                            batchColorMap={batchColorMap}
                            isAllBatches={isAllBatches}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )
              })()}
            </div>

            {holdingPen && (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-[11px] font-black text-emerald-500/70 uppercase tracking-[0.3em]">Holding Area</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/10 to-transparent" />
                  <div className="flex items-center gap-2"><HelpCircle size={13} className="text-[#4B6478]" /><span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Penampungan Sementara</span></div>
                </div>
                <div className="h-[320px]">
                  <KandangBox
                    kandang={holdingPen}
                    animalsInKandang={groupedAnimals[holdingPen.id] || []}
                    dragOver={dragOverKandang}
                    onDragOver={handleDragOver}
                    onDragLeave={() => setDragOverKandang(null)}
                    onDrop={handleDrop}
                    onAnimalClick={setSelectedAnimal}
                    onKandangDoubleClick={setEditingKandang}
                    speciesConfig={speciesConfig}
                    batchColorMap={batchColorMap}
                    isAllBatches={isAllBatches}
                  />
                </div>
                <div className="mt-6 p-6 rounded-[2.5rem] bg-emerald-500/[0.03] border border-emerald-500/10 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0"><ArrowRightLeft size={20} className="text-emerald-500" /></div>
                  <div><p className="text-sm font-['Sora'] font-black text-white uppercase tracking-tight">Manual Alokasi</p><p className="text-[11px] text-[#4B6478] font-bold mt-1">Drag ear-tag ke kandang tujuan untuk memindahkan alokasi secara visual.</p></div>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Edit Kandang Sheet */}
      <Sheet open={!!editingKandang} onOpenChange={() => setEditingKandang(null)}>
        <SheetContent side="right" className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 p-0 flex flex-col w-full sm:max-w-[440px]">
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <SheetHeader className="text-left text-white">
              <SheetTitle className="font-['Sora'] font-black text-2xl">Edit Kandang: {editingKandang?.name}</SheetTitle>
              <p className="text-xs text-[#4B6478] font-bold uppercase tracking-widest">Konfigurasi ulang dimensi dan kapasitas kandang.</p>
            </SheetHeader>
            {editingKandang && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Identitas Kandang *</label>
                  <input
                    value={editingKandang.name}
                    onChange={e => setEditingKandang(k => ({ ...k, name: e.target.value }))}
                    className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Panjang (m)</label>
                    <input
                      type="number"
                      value={editingKandang.panjang_m || ''}
                      onChange={e => setEditingKandang(k => ({ ...k, panjang_m: parseFloat(e.target.value) }))}
                      className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Lebar (m)</label>
                    <input
                      type="number"
                      value={editingKandang.lebar_m || ''}
                      onChange={e => setEditingKandang(k => ({ ...k, lebar_m: parseFloat(e.target.value) }))}
                      className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Limit Kapasitas (Ekor)</label>
                  <input
                    type="number"
                    value={editingKandang.capacity || ''}
                    onChange={e => setEditingKandang(k => ({ ...k, capacity: parseInt(e.target.value) }))}
                    className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                {deleteKandang && (
                  <button
                    onClick={() => handleDeleteKandang(editingKandang.id)}
                    className="text-[11px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-[0.2em] transition-colors py-2"
                  >
                    Hapus Kandang
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="p-8 border-t border-white/[0.04] bg-[#06090F]">
            <Button
              onClick={() => updateKdg.mutate({
                kandangId: editingKandang.id,
                batchId: activeBatchId,
                updates: {
                  name: editingKandang.name,
                  panjang_m: editingKandang.panjang_m,
                  lebar_m: editingKandang.lebar_m,
                  capacity: editingKandang.capacity
                }
              }, { onSuccess: () => setEditingKandang(null) })}
              disabled={updateKdg.isPending}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest rounded-[2rem] shadow-xl shadow-emerald-500/30"
            >
              {updateKdg.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Kandang Sheet */}
      <Sheet open={addSheet} onOpenChange={setAddSheet}>
        <SheetContent side="bottom" className="bg-[#0C1319]/95 backdrop-blur-xl border-white/10 p-0 flex flex-col rounded-t-[40px] max-h-[92vh]">
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <SheetHeader className="text-left text-white">
              <SheetTitle className="font-['Sora'] font-black text-2xl">Tambah Kandang</SheetTitle>
              <p className="text-xs text-[#4B6478] font-bold uppercase tracking-widest">Konfigurasi kapasitas dan dimensi untuk unit kandang baru.</p>
            </SheetHeader>
            <Tabs value={calcMode} onValueChange={setCalcMode} className="w-full">
              <TabsList className="bg-white/[0.03] border border-white/[0.08] p-1.5 mb-8 rounded-2xl w-full">
                <TabsTrigger value="dimensi" className="flex-1 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-xl h-10 transition-all">Smart Capacity</TabsTrigger>
                <TabsTrigger value="manual" className="flex-1 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 rounded-xl h-10 transition-all">Manual Input</TabsTrigger>
              </TabsList>
              <div className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Nama Kandang *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="KANDANG-A1" className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 uppercase" /></div>
                <TabsContent value="dimensi" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Panjang (m)</label><input type="number" value={form.panjang} onChange={e => setForm(f => ({ ...f, panjang: e.target.value }))} className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Lebar (m)</label><input type="number" value={form.lebar} onChange={e => setForm(f => ({ ...f, lebar: e.target.value }))} className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" /></div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Standar Kepadatan</label>
                    <select value={form.standard} onChange={e => setForm(f => ({ ...f, standard: e.target.value }))} className="w-full h-14 bg-[#111C24] border border-white/10 rounded-2xl px-5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50">
                      <option value="1.0">1.0 m² / ekor — Kepadatan Tinggi</option>
                      <option value="1.5">1.5 m² / ekor — Standar Ideal</option>
                      <option value="2.0">2.0 m² / ekor — Kepadatan Rendah (Nyaman)</option>
                    </select>
                  </div>
                  <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] flex items-center gap-5">
                    <Info size={28} className="text-emerald-400 shrink-0" />
                    <div><p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Estimasi Smart Capacity</p><p className="text-lg font-black text-white">{previewCapacity} Ekor</p></div>
                  </div>
                </TabsContent>
                <TabsContent value="manual" className="space-y-6 mt-0">
                  <div className="space-y-2"><label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Limit Kapasitas (Ekor) *</label><input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="e.g. 50" className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50" /></div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
          <div className="p-8 border-t border-white/[0.04] bg-[#06090F]">
            <Button onClick={handleSaveKandang} disabled={createKandang.isPending} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[11px] tracking-widest rounded-[2rem] shadow-xl shadow-emerald-500/30">
              {createKandang.isPending ? 'Menyimpan...' : 'Gunakan Kandang Ini'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Draw mode → pending kandang name dialog */}
      <AnimatePresence>
        {pendingRect && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setPendingRect(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} className="bg-[#0C1319] border border-white/10 rounded-[2.5rem] p-8 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-['Sora'] font-black text-white text-xl mb-1 uppercase tracking-tight">Kandang Baru</h3>
              <p className="text-[10px] font-black text-[#4B6478] mb-6 uppercase tracking-widest">{pendingRect.w}m × {pendingRect.h}m · {(pendingRect.w * pendingRect.h).toFixed(1)}m² · Est. {Math.max(1, Math.floor((pendingRect.w * pendingRect.h) / 1.5))} ekor</p>
              <input autoFocus value={pendingName} onChange={e => setPendingName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSavePendingRect()} placeholder="KANDANG-A1" className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500/50 mb-6 uppercase" />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setPendingRect(null)} className="flex-1 border-white/10 text-[#4B6478] hover:text-white rounded-xl h-12 uppercase text-[10px] font-black">Batal</Button>
                <Button onClick={handleSavePendingRect} disabled={!pendingName.trim() || createKandang.isPending} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl h-12 uppercase text-[10px] tracking-widest">{createKandang.isPending ? 'Saving…' : 'Simpan'}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
