import React, { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Check, ListPlus, ChevronDown, Filter, ShoppingBag } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useDombaAnimals,
  useDombaAnimalsByBatches,
  useDombaBatches,
  useAddDombaAnimal,
  useUpdateDombaAnimal,
  useBulkAddDombaAnimals,
  useAddDombaSale,
  useAddDombaWeightRecord,
} from '@/lib/hooks/useDombaPenggemukanData'
import { calcHariDiFarm } from '@/lib/hooks/useKdPenggemukanData'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import NotificationBell from '@/dashboard/_shared/components/NotificationBell'
import { useTernakLimit } from '@/lib/hooks/useTernakLimit'
import {
  AnimalCard,
  AnimalDetailSheet,
  AddAnimalSheet,
  BulkAddSheet,
  SaleSheet,
  QuickWeighSheet,
} from '@/dashboard/peternak/_shared/components/ternak'

const BASE = '/peternak/peternak_domba_penggemukan'

const BREED_SUGGESTIONS = [
  'Garut', 'Priangan', 'Gembong', 'Texel', 'Dorper', 'Merino',
  'Ekor Gemuk (DEG)', 'Ekor Tipis (DET)', 'Sumbawa', 'Donggala',
  'Barros', 'Compass Agribisnis', 'Lainnya',
]

export default function DombaTernak() {
  const [params]    = useSearchParams()
  const navigate    = useNavigate()

  const { canAdd, currentCount, limit, isUnlimited } = useTernakLimit('domba_kambing')
  const limitLabel   = !isUnlimited ? `${currentCount}/${limit} ekor` : null
  const upgradeTitle = !canAdd ? `Limit ${limit} ekor tercapai. Upgrade ke Pro/Business untuk tambah lebih banyak.` : undefined

  // ── Batch selection ──────────────────────────────────────────────────────────
  const { data: batches = [], isLoading: loadingBatches } = useDombaBatches()
  const [selectedBatchId, setSelectedBatchId] = useState(params.get('batch') || 'all')

  useEffect(() => {
    setSelectedBatchId(params.get('batch') || 'all')
  }, [params])

  const isAllBatches = selectedBatchId === 'all'
  const allBatchIds  = useMemo(() => batches.map(b => b.id), [batches])

  const [batchOpen, setBatchOpen] = useState(false)
  const [batchRect, setBatchRect] = useState(null)
  const batchTriggerRef = useRef(null)
  const batchWrapperRef = useRef(null)

  useEffect(() => {
    if (!batchOpen) return
    const handler = (e) => {
      if (!batchWrapperRef.current?.contains(e.target) && !batchTriggerRef.current?.contains(e.target))
        setBatchOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [batchOpen])

  // ── Animals ─────────────────────────────────────────────────────────────────
  const { data: allAnimals    = [], isLoading: loadingAll    } = useDombaAnimalsByBatches(isAllBatches ? allBatchIds : [])
  const { data: singleAnimals = [], isLoading: loadingSingle } = useDombaAnimals(isAllBatches ? null : selectedBatchId)
  const rawAnimals     = isAllBatches ? allAnimals : singleAnimals
  const loadingAnimals = isAllBatches ? loadingAll : loadingSingle

  // Normalize domba-specific weight record field for shared components
  const animals = useMemo(
    () => rawAnimals.map(a => ({ ...a, _weightRecords: a.domba_penggemukan_weight_records ?? [] })),
    [rawAnimals]
  )

  // ── Domain mutations (injected into shared components as props) ───────────
  const { mutate: addAnimal,   isPending: addingAnimal   } = useAddDombaAnimal()
  const { mutate: updateAnimal, isPending: updatingAnimal } = useUpdateDombaAnimal()
  const { mutate: bulkAdd,     isPending: bulkAdding     } = useBulkAddDombaAnimals()
  const { mutate: addSale,     isPending: selling        } = useAddDombaSale()
  const { mutate: addWeight,   isPending: weighing       } = useAddDombaWeightRecord()

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('active')
  const [sheet, setSheet]           = useState(null)   // 'add' | 'bulk' | 'sale' | animal-object
  const [weighAnimal, setWeighAnimal] = useState(null)

  const isSamplingMode = params.get('sampling') === 'true'
  const selectedBatch  = useMemo(() => batches.find(b => b.id === selectedBatchId), [batches, selectedBatchId])

  const filtered = useMemo(() => {
    let list = animals
    if (filter !== 'all') list = list.filter(a => a.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a => a.ear_tag.toLowerCase().includes(q) || (a.breed || '').toLowerCase().includes(q))
    }
    if (isSamplingMode && selectedBatch) {
      const hari        = calcHariDiFarm(selectedBatch.start_date)
      const periodIndex = Math.floor(hari / 14)
      const sampleSize  = Math.max(1, Math.ceil(animals.length * 0.1))
      const seed        = selectedBatch.id + periodIndex
      const samplingList = [...animals].sort((a, b) => {
        const hA = (a.id + seed).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        const hB = (b.id + seed).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        return hA - hB
      }).slice(0, sampleSize)
      const sampleIds = new Set(samplingList.map(s => s.id))
      list = list.filter(a => sampleIds.has(a.id))
    }
    return list
  }, [animals, filter, search, isSamplingMode, selectedBatch])

  if (loadingBatches) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-['Sora'] font-black text-xl text-white tracking-tight">Data Ternak</h1>
            <p className="text-[11px] text-[#4B6478] font-black uppercase tracking-widest mt-0.5">
              {filter === 'all'
                ? `${animals.length} TOTAL UNIT`
                : `${filtered.length} ${filter === 'active' ? 'AKTIF' : filter === 'sold' ? 'TERJUAL' : filter === 'dead' ? 'MATI' : 'AFKIR'} · ${animals.length} TERDAFTAR`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {limitLabel && (
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${!canAdd ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-[#4B6478] bg-white/5 border-white/5'}`}>
                {limitLabel}
              </span>
            )}
            <button
              disabled={!canAdd} title={upgradeTitle}
              onClick={() => setSheet('bulk')}
              className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-[#4B6478] hover:text-white hover:bg-white/10 transition-all shadow-inner disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ListPlus size={18} />
            </button>
            <button
              disabled={isAllBatches}
              title={isAllBatches ? 'Pilih batch spesifik untuk menjual' : undefined}
              onClick={() => setSheet('sale')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-xs font-black font-['Sora'] shadow-[0_4px_12px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all"
            >
              <ShoppingBag size={14} strokeWidth={3} /> Jual
            </button>
            <button
              disabled={isAllBatches || !canAdd}
              title={isAllBatches ? 'Pilih batch spesifik untuk menambah ternak' : upgradeTitle}
              onClick={() => setSheet('add')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-xs font-black font-['Sora'] shadow-[0_4px_12px_rgba(22,163,74,0.3)] active:scale-[0.98] transition-all"
            >
              <Plus size={14} strokeWidth={3} /> Tambah
            </button>
          </div>
        </div>

        {/* Batch dropdown trigger */}
        <div ref={batchWrapperRef}>
          <button
            ref={batchTriggerRef}
            onClick={() => { const rect = batchTriggerRef.current?.getBoundingClientRect(); setBatchRect(rect ?? null); setBatchOpen(o => !o) }}
            className={cn('w-full h-12 px-4 flex items-center gap-3 bg-white/[0.03] border rounded-2xl text-sm font-bold text-white transition-all shadow-inner',
              batchOpen ? 'border-green-500/40 bg-white/[0.06]' : 'border-white/[0.08] hover:border-white/[0.14] hover:bg-white/[0.05]'
            )}
          >
            {isAllBatches ? (
              <><span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" /><span className="flex-1 text-left">Semua Batch<span className="text-[#4B6478] font-medium ml-2 text-xs">{batches.length} batch · {animals.length} ekor</span></span></>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-green-400 shrink-0" /><span className="flex-1 text-left">{batches.find(b => b.id === selectedBatchId)?.batch_code ?? '—'}<span className="text-[#4B6478] font-medium ml-2 text-xs">{batches.find(b => b.id === selectedBatchId)?.kandang_name}</span></span></>
            )}
            <motion.div animate={{ rotate: batchOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} className="text-[#4B6478] shrink-0" />
            </motion.div>
          </button>
        </div>
      </header>

      {/* ── Animal list ───────────────────────────────────────────────────── */}
      <div className="px-4 pt-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 group/search">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B6478] group-focus-within/search:text-green-500 transition-colors" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari ear tag / ras domba..."
              className="w-full h-11 pl-10 pr-4 bg-white/[0.03] border border-white/[0.06] focus:border-green-500/40 rounded-xl text-xs font-bold text-white placeholder-[#4B6478] outline-none transition-all shadow-inner"
            />
          </div>
          <div className="w-11 h-11 flex items-center justify-center bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#4B6478]">
            <Filter size={16} />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-5 no-scrollbar">
          {['active', 'sold', 'dead', 'culled', 'all'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn('px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all whitespace-nowrap shadow-sm',
                filter === s ? 'bg-green-600/10 border-green-600/30 text-green-400' : 'bg-white/[0.02] border-white/[0.06] text-[#4B6478] hover:border-white/10'
              )}
            >
              {s === 'active' ? 'Aktif' : s === 'sold' ? 'Terjual' : s === 'dead' ? 'Mati' : s === 'culled' ? 'Afkir' : 'Seluruhnya'}
            </button>
          ))}
        </div>

        {loadingAnimals ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 mt-1">
            {filtered.map(a => (
              <AnimalCard
                key={a.id} animal={a}
                onClick={() => setSheet(a)} onWeigh={setWeighAnimal}
                batchLabel={isAllBatches ? batches.find(b => b.id === a.batch_id)?.batch_code : undefined}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-white/[0.03] rounded-[32px] bg-white/[0.01]">
                <Search size={32} className="mx-auto text-white/5 mb-3" />
                <p className="text-xs font-black text-[#4B6478] uppercase tracking-widest">Data Tidak Ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Batch dropdown panel (fixed, escapes overflow) ────────────────── */}
      <AnimatePresence>
        {batchOpen && batchRect && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ position: 'fixed', top: batchRect.bottom + 6, left: batchRect.left, width: batchRect.width, zIndex: 9999 }}
            className="bg-[#0C1319]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            <button
              onClick={() => { setSelectedBatchId('all'); navigate(`${BASE}/ternak`); setBatchOpen(false) }}
              className={cn('flex items-center gap-3 w-full px-4 py-3 text-left transition-colors', isAllBatches ? 'bg-blue-500/10 text-white' : 'text-[#8CA0B3] hover:bg-white/[0.04] hover:text-white')}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-widest flex-1">Semua Batch</span>
              {isAllBatches && <Check size={12} className="text-blue-400 shrink-0" />}
            </button>

            {batches.length > 0 && <div className="mx-4 h-px bg-white/[0.06]" />}

            {batches.map(b => {
              const isActive  = selectedBatchId === b.id
              const isRunning = b.status === 'active'
              return (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBatchId(b.id); navigate(`${BASE}/ternak?batch=${b.id}`); setBatchOpen(false) }}
                  className={cn('flex items-center gap-3 w-full px-4 py-3 text-left transition-colors', isActive ? 'bg-green-500/10 text-white' : 'text-[#8CA0B3] hover:bg-white/[0.04] hover:text-white')}
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', isRunning ? 'bg-green-400' : 'bg-[#4B6478]')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-widest leading-none">{b.batch_code}</p>
                    <p className="text-[10px] text-[#4B6478] mt-0.5 truncate">{b.kandang_name} · {isRunning ? 'Aktif' : 'Selesai'}</p>
                  </div>
                  {isActive && <Check size={12} className="text-green-400 shrink-0" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sheets ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sheet === 'add' && (
          <AddAnimalSheet
            batchId={selectedBatchId} animals={animals}
            onAdd={addAnimal} isPending={addingAnimal}
            animalLabel="Domba" breedSuggestions={BREED_SUGGESTIONS}
            onClose={() => setSheet(null)}
          />
        )}
        {sheet === 'bulk' && (
          <BulkAddSheet
            batchId={selectedBatchId} animalsCount={animals.length}
            onBulkAdd={bulkAdd} isPending={bulkAdding}
            animalLabel="Domba" breedSuggestions={BREED_SUGGESTIONS}
            onClose={() => setSheet(null)}
          />
        )}
        {sheet === 'sale' && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={() => setSheet(null)} />
            <SaleSheet
              batchId={selectedBatchId} animals={animals}
              onSale={addSale} isPending={selling}
              animalLabel="Domba"
              onClose={() => setSheet(null)}
            />
          </>
        )}
        {typeof sheet === 'object' && sheet !== null && (
          <AnimalDetailSheet
            animal={sheet}
            onUpdate={updateAnimal} isPending={updatingAnimal}
            breedSuggestions={BREED_SUGGESTIONS}
            onClose={() => setSheet(null)}
          />
        )}
        {weighAnimal && (
          <QuickWeighSheet
            animal={weighAnimal}
            onAddWeight={addWeight} isPending={weighing}
            onClose={() => setWeighAnimal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
