import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Package, AlertTriangle, ChevronDown, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { useParams, useNavigate } from 'react-router-dom'
import { useFeedStocks, useUpsertFeedStock, useReduceFeedStock, usePeternakFarms, useActiveCycles } from '@/lib/hooks/usePeternakData'
import { useAuth } from '@/lib/hooks/useAuth'
import FarmContextBar from '../_shared/components/FarmContextBar'

// ─── Constants ────────────────────────────────────────────────────────────────

const FEED_TYPE_LABELS = {
  starter:    'Starter',
  grower:     'Grower',
  finisher:   'Finisher',
  konsentrat: 'Konsentrat',
  jagung:     'Jagung',
  dedak:      'Dedak',
  lainnya:    'Lainnya',
}

const FEED_TYPE_OPTIONS = Object.entries(FEED_TYPE_LABELS).map(([value, label]) => ({ value, label }))

function getStatus(qty) {
  if (qty >= 500)  return { label: 'Aman',    color: '#34D399', pulse: false }
  if (qty >= 100)  return { label: 'Cukup',   color: '#FBBF24', pulse: false }
  return                  { label: 'Menipis', color: '#F87171', pulse: true  }
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatsCard({ label, value, sub, color = '#A78BFA' }) {
  return (
    <div className="bg-[#111C24] rounded-2xl p-5 border border-white/8">
      <p className="text-xs text-[#4B6478] mb-1">{label}</p>
      <p className="font-display font-black text-2xl leading-tight" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-[#4B6478] mt-1">{sub}</p>}
    </div>
  )
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────

function LowStockBanner({ stocks }) {
  const low = stocks.filter(s => s.quantity_kg < 100)
  if (!low.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3"
    >
      <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-red-300">Stok Menipis</p>
        <p className="text-xs text-red-400/80 mt-0.5">
          {low.map(s => `${FEED_TYPE_LABELS[s.feed_type] ?? s.feed_type} (${s.peternak_farms?.farm_name ?? '—'}) — ${s.quantity_kg.toFixed(1)} kg`).join(' · ')}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Sheet: Tambah Stok ───────────────────────────────────────────────────────

function SheetTambahStok({ isOpen, onClose, farms, cycles }) {
  const upsert = useUpsertFeedStock()
  const [form, setForm] = useState({
    peternak_farm_id: '',
    feed_type: '',
    quantity_kg: '',
    cycle_id: '',
    unit_price: '',
    notes: '',
  })

  const farmCycles = useMemo(
    () => cycles?.filter(c => c.peternak_farm_id === form.peternak_farm_id) ?? [],
    [cycles, form.peternak_farm_id]
  )

  function set(key, val) {
    setForm(p => ({ ...p, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.peternak_farm_id || !form.feed_type || !form.quantity_kg) {
      toast.error('Farm, jenis pakan, dan jumlah wajib diisi')
      return
    }
    const qty = parseFloat(form.quantity_kg)
    if (isNaN(qty) || qty <= 0) { toast.error('Jumlah harus lebih dari 0'); return }
    await upsert.mutateAsync({
      peternak_farm_id: form.peternak_farm_id,
      feed_type: form.feed_type,
      quantity_kg: qty,
      cycle_id: form.cycle_id || null,
      unit_price: form.unit_price ? parseFloat(form.unit_price) : null,
      notes: form.notes || null,
    })
    setForm({ peternak_farm_id: '', feed_type: '', quantity_kg: '', cycle_id: '', unit_price: '', notes: '' })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0C1319] border-l border-white/10 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <h3 className="font-bold text-[#F1F5F9] text-base">Tambah Stok Pakan</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center transition-colors">
                <X size={16} className="text-[#4B6478]" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Farm */}
              <div>
                <label htmlFor="ts-farm" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                  Kandang / Farm *
                </label>
                <select
                  id="ts-farm"
                  name="peternak_farm_id"
                  value={form.peternak_farm_id}
                  onChange={e => set('peternak_farm_id', e.target.value)}
                  className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-violet-500/50"
                >
                  <option value="">Pilih farm...</option>
                  {farms?.map(f => <option key={f.id} value={f.id}>{f.farm_name}</option>)}
                </select>
              </div>

              {/* Feed type */}
              <div>
                <label htmlFor="ts-feed-type" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                  Jenis Pakan *
                </label>
                <select
                  id="ts-feed-type"
                  name="feed_type"
                  value={form.feed_type}
                  onChange={e => set('feed_type', e.target.value)}
                  className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-violet-500/50"
                >
                  <option value="">Pilih jenis...</option>
                  {FEED_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="ts-qty" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                  Jumlah (kg) *
                </label>
                <input
                  id="ts-qty"
                  name="quantity_kg"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.quantity_kg}
                  onChange={e => set('quantity_kg', e.target.value)}
                  placeholder="Contoh: 500"
                  className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>

              {/* Optional: cost tracking */}
              <div className="border border-white/8 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-[#4B6478] uppercase tracking-wider">Catat Biaya (Opsional)</p>

                {/* Cycle */}
                <div>
                  <label htmlFor="ts-cycle" className="block text-xs text-[#4B6478] mb-1">Siklus Aktif</label>
                  <select
                    id="ts-cycle"
                    name="cycle_id"
                    value={form.cycle_id}
                    onChange={e => set('cycle_id', e.target.value)}
                    disabled={!form.peternak_farm_id}
                    className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-violet-500/50 disabled:opacity-40"
                  >
                    <option value="">Pilih siklus...</option>
                    {farmCycles.map(c => (
                      <option key={c.id} value={c.id}>Siklus #{c.cycle_number}</option>
                    ))}
                  </select>
                </div>

                {/* Unit price */}
                <div>
                  <label htmlFor="ts-price" className="block text-xs text-[#4B6478] mb-1">Harga per kg (Rp)</label>
                  <input
                    id="ts-price"
                    name="unit_price"
                    type="number"
                    min="0"
                    value={form.unit_price}
                    onChange={e => set('unit_price', e.target.value)}
                    placeholder="Contoh: 8500"
                    className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="ts-notes" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                  Catatan
                </label>
                <textarea
                  id="ts-notes"
                  name="notes"
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  rows={3}
                  placeholder="Opsional..."
                  className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/8 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-[#94A3B8] hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form=""
                onClick={handleSubmit}
                disabled={upsert.isPending}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                {upsert.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Sheet: Catat Pemakaian ───────────────────────────────────────────────────

function SheetPemakaian({ isOpen, onClose, stock }) {
  const reduce = useReduceFeedStock()
  const [qty, setQty] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const amount = parseFloat(qty)
    if (isNaN(amount) || amount <= 0) { toast.error('Jumlah pemakaian harus lebih dari 0'); return }
    if (amount > stock.quantity_kg) {
      toast.error(`Melebihi stok tersedia (${stock.quantity_kg.toFixed(1)} kg)`)
      return
    }
    await reduce.mutateAsync({ stock_id: stock.id, quantity_kg: amount, current_qty: stock.quantity_kg })
    setQty('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && stock && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[#0C1319] border-l border-white/10 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <div>
                <h3 className="font-bold text-[#F1F5F9] text-base">Catat Pemakaian</h3>
                <p className="text-xs text-[#4B6478] mt-0.5">
                  {FEED_TYPE_LABELS[stock.feed_type] ?? stock.feed_type} — {stock.peternak_farms?.farm_name}
                </p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center transition-colors">
                <X size={16} className="text-[#4B6478]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">
              {/* Stok saat ini */}
              <div className="bg-[#111C24] rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-[#4B6478]">Stok saat ini</span>
                <span className="text-sm font-bold text-[#F1F5F9]">{stock.quantity_kg.toFixed(1)} kg</span>
              </div>

              {/* Jumlah pemakaian */}
              <div>
                <label htmlFor="pm-qty" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                  Jumlah Pemakaian (kg) *
                </label>
                <input
                  id="pm-qty"
                  name="quantity_kg"
                  type="number"
                  min="0.1"
                  max={stock.quantity_kg}
                  step="0.1"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder={`Maks ${stock.quantity_kg.toFixed(1)} kg`}
                  autoFocus
                  className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>

              {/* Preview sisa */}
              {qty && !isNaN(parseFloat(qty)) && parseFloat(qty) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-[#111C24] rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-xs text-[#4B6478]">Sisa setelah catat</span>
                  <span className={`text-sm font-bold ${(stock.quantity_kg - parseFloat(qty)) < 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {(stock.quantity_kg - parseFloat(qty)).toFixed(1)} kg
                  </span>
                </motion.div>
              )}
            </form>

            <div className="px-6 py-4 border-t border-white/8 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-[#94A3B8] hover:bg-white/5 transition-colors">
                Batal
              </button>
              <button
                type="submit"
                form=""
                onClick={handleSubmit}
                disabled={reduce.isPending}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                {reduce.isPending ? 'Menyimpan...' : 'Catat'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Stock Row ────────────────────────────────────────────────────────────────

function StockRow({ stock, onUsage }) {
  const status = getStatus(stock.quantity_kg)
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#F1F5F9]">
          {FEED_TYPE_LABELS[stock.feed_type] ?? stock.feed_type}
        </p>
      </div>
      <p className="text-sm text-[#94A3B8] w-24 text-right tabular-nums">
        {stock.quantity_kg.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
      </p>
      {/* Status indicator */}
      <div className="flex items-center gap-1.5 w-20 justify-end">
        <span
          className={`w-2 h-2 rounded-full ${status.pulse ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: status.color }}
        />
        <span className="text-xs" style={{ color: status.color }}>{status.label}</span>
      </div>
      {/* Catat pemakaian */}
      <button
        onClick={() => onUsage(stock)}
        className="w-7 h-7 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 flex items-center justify-center transition-colors"
        title="Catat pemakaian"
      >
        <Minus size={13} className="text-violet-400" />
      </button>
    </div>
  )
}

// ─── Farm Stock Group ─────────────────────────────────────────────────────────

function FarmGroup({ farmName, stocks, onUsage }) {
  return (
    <div className="bg-[#111C24] rounded-2xl border border-white/8 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0C1319]">
        <Package size={14} className="text-violet-400" />
        <span className="text-sm font-bold text-[#F1F5F9]">{farmName}</span>
        <span className="ml-auto text-xs text-[#4B6478]">{stocks.length} jenis</span>
      </div>
      <div className="px-4">
        {stocks.map(s => (
          <StockRow key={s.id} stock={s} onUsage={onUsage} />
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PeternakPakan() {
  const { farmId } = useParams()   // present at /peternak/kandang/:farmId/pakan
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { data: allStocks = [], isLoading } = useFeedStocks()
  const { data: farms = [] } = usePeternakFarms()
  const { data: cycles = [] } = useActiveCycles()

  const peternakBase = `/peternak/${profile?.sub_type || 'peternak_broiler'}`

  // When at Level-2 route, scope to this farm only
  const stocks = farmId ? allStocks.filter(s => s.peternak_farm_id === farmId) : allStocks

  const [search, setSearch] = useState('')
  const [farmFilter, setFarmFilter] = useState(farmId ?? 'all')
  const [sheetTambah, setSheetTambah] = useState(false)
  const [sheetPemakaian, setSheetPemakaian] = useState(null) // stock object

  // ── Stats ──
  const totalTypes   = new Set(stocks.map(s => s.feed_type)).size
  const totalKg      = stocks.reduce((sum, s) => sum + (s.quantity_kg || 0), 0)
  const lowCount     = stocks.filter(s => s.quantity_kg < 100).length

  // ── Filter ──
  const filtered = useMemo(() => {
    let list = stocks
    if (farmFilter !== 'all') list = list.filter(s => s.peternak_farm_id === farmFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        (FEED_TYPE_LABELS[s.feed_type] ?? s.feed_type).toLowerCase().includes(q) ||
        s.peternak_farms?.farm_name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [stocks, farmFilter, search])

  // ── Group by farm ──
  const grouped = useMemo(() => {
    const map = {}
    for (const s of filtered) {
      const fid = s.peternak_farm_id
      if (!map[fid]) map[fid] = { farmName: s.peternak_farms?.farm_name ?? '—', stocks: [] }
      map[fid].stocks.push(s)
    }
    return Object.values(map)
  }, [filtered])

  return (
    <div className="pb-20">
      {farmId && <FarmContextBar subPath="pakan" />}
      <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-xl text-[#F1F5F9]">Stok & Pakan</h1>
          <p className="text-xs text-[#4B6478] mt-0.5">Kelola inventori pakan semua kandang</p>
        </div>
        <button
          onClick={() => setSheetTambah(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={15} />
          Tambah Stok
        </button>
      </div>

      {/* Alert banner */}
      <LowStockBanner stocks={stocks} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatsCard label="Jenis Pakan" value={totalTypes} sub="terdaftar" />
        <StatsCard
          label="Total Stok"
          value={`${totalKg.toLocaleString('id-ID', { maximumFractionDigits: 0 })} kg`}
          sub="semua kandang"
          color="#34D399"
        />
        <StatsCard
          label="Stok Menipis"
          value={lowCount}
          sub="< 100 kg"
          color={lowCount > 0 ? '#F87171' : '#34D399'}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
          <input
            id="pakan-search"
            name="search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari jenis pakan atau farm..."
            className="w-full bg-[#111C24] border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={12} className="text-[#4B6478]" />
            </button>
          )}
        </div>

        {/* Farm filter — hidden at Level-2 (already scoped to one farm) */}
        {!farmId && (
        <div className="relative">
          <select
            id="pakan-farm-filter"
            name="farm_filter"
            value={farmFilter}
            onChange={e => setFarmFilter(e.target.value)}
            className="appearance-none bg-[#111C24] border border-white/10 rounded-xl pl-3 pr-8 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-violet-500/50 transition-colors"
          >
            <option value="all">Semua Farm</option>
            {farms.map(f => <option key={f.id} value={f.id}>{f.farm_name}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
        </div>
        )}
      </div>

      {/* Stock list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package size={32} className="text-[#4B6478] mb-3" />
          <p className="text-sm font-semibold text-[#4B6478]">Belum ada stok pakan</p>
          <p className="text-xs text-[#4B6478]/70 mt-1">Klik "Tambah Stok" untuk mencatat pakan pertama</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((g, i) => (
            <motion.div
              key={g.farmName}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <FarmGroup
                farmName={g.farmName}
                stocks={g.stocks}
                onUsage={stock => setSheetPemakaian(stock)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Sheets */}
      <SheetTambahStok
        isOpen={sheetTambah}
        onClose={() => setSheetTambah(false)}
        farms={farms}
        cycles={cycles}
      />
      <SheetPemakaian
        isOpen={!!sheetPemakaian}
        onClose={() => setSheetPemakaian(null)}
        stock={sheetPemakaian}
      />
      </div>
    </div>
  )
}
