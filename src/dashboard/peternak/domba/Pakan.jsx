import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Wheat, ChevronDown, AlertTriangle } from 'lucide-react'
import {
  useDombaBatches, useDombaFeedLogs, useAddDombaFeedLog,
} from '@/lib/hooks/useDombaPenggemukanData'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { formatIDRShort } from '@/lib/format'

// Stok pakan — state lokal sederhana (Phase 4 bisa dipindah ke DB)
// Untuk sekarang: peternak input manual estimasi stok
const DEFAULT_STOK = [
  { name: 'Rumput Gajah segar',    satuan: 'kg', kebutuhan_per_hari: 200 },
  { name: 'Jerami fermentasi',     satuan: 'kg', kebutuhan_per_hari: 80  },
  { name: 'Konsentrat komersial',  satuan: 'kg', kebutuhan_per_hari: 50  },
  { name: 'Dedak padi',            satuan: 'kg', kebutuhan_per_hari: 30  },
]

function FeedLogCard({ log }) {
  const total = (log.hijauan_kg || 0) + (log.konsentrat_kg || 0) + (log.dedak_kg || 0) + (log.other_feed_kg || 0)

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-['Sora'] font-bold text-sm text-white">{log.log_date}</p>
          <p className="text-[11px] text-[#4B6478]">{log.kandang_name} · {log.animal_count} ekor</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm text-white">{log.consumed_kg ?? (total - (log.sisa_pakan_kg || 0)).toFixed(1)} kg</p>
          <p className="text-[10px] text-[#4B6478]">Dikonsumsi</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-white/[0.04]">
        <div>
          <p className="text-[11px] font-bold text-white">{log.hijauan_kg} kg</p>
          <p className="text-[10px] text-[#4B6478]">Hijauan</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-white">{log.konsentrat_kg} kg</p>
          <p className="text-[10px] text-[#4B6478]">Konsentrat</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-white">{log.dedak_kg} kg</p>
          <p className="text-[10px] text-[#4B6478]">Dedak</p>
        </div>
        <div>
          <p className="text-[11px] font-bold text-amber-400">{log.sisa_pakan_kg} kg</p>
          <p className="text-[10px] text-[#4B6478]">Sisa</p>
        </div>
      </div>

      {log.feed_cost_idr && (
        <p className="text-[10px] text-[#4B6478] mt-2">
          Biaya: <span className="text-white font-semibold">{formatIDRShort(log.feed_cost_idr)}</span>
        </p>
      )}
    </div>
  )
}

export default function KdPenggemukanPakan() {
  const { data: batches = [], isLoading: loadingBatches } = useDombaBatches()
  const [selectedBatch, setSelectedBatch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: feedLogs = [], isLoading: loadingLogs } = useDombaFeedLogs(selectedBatch)
  const addFeedLog = useAddDombaFeedLog()

  const [form, setForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    kandang_name: '', animal_count: '',
    hijauan_kg: '', konsentrat_kg: '', dedak_kg: '',
    other_feed_kg: '0', sisa_pakan_kg: '0',
    feed_cost_idr: '', notes: '',
  })

  // Summary konsumsi batch ini
  const summary = useMemo(() => {
    const totalHijauan    = feedLogs.reduce((s, l) => s + (l.hijauan_kg || 0), 0)
    const totalKonsentrat = feedLogs.reduce((s, l) => s + (l.konsentrat_kg || 0), 0)
    const totalDedak      = feedLogs.reduce((s, l) => s + (l.dedak_kg || 0), 0)
    const totalConsumed   = feedLogs.reduce((s, l) => s + (parseFloat(l.consumed_kg) || 0), 0)
    const totalCost       = feedLogs.reduce((s, l) => s + (l.feed_cost_idr || 0), 0)
    return { totalHijauan, totalKonsentrat, totalDedak, totalConsumed, totalCost, days: feedLogs.length }
  }, [feedLogs])

  function handleSave() {
    if (!form.kandang_name || !form.animal_count || !selectedBatch) return
    addFeedLog.mutate({
      batch_id: selectedBatch,
      log_date: form.log_date,
      kandang_name: form.kandang_name,
      animal_count: parseInt(form.animal_count),
      hijauan_kg:    parseFloat(form.hijauan_kg    || 0),
      konsentrat_kg: parseFloat(form.konsentrat_kg || 0),
      dedak_kg:      parseFloat(form.dedak_kg      || 0),
      other_feed_kg: parseFloat(form.other_feed_kg || 0),
      sisa_pakan_kg: parseFloat(form.sisa_pakan_kg || 0),
      feed_cost_idr: form.feed_cost_idr ? parseInt(form.feed_cost_idr) : null,
      notes: form.notes,
    }, {
      onSuccess: () => {
        setSheetOpen(false)
        setForm({ log_date: new Date().toISOString().split('T')[0], kandang_name: '', animal_count: '', hijauan_kg: '', konsentrat_kg: '', dedak_kg: '', other_feed_kg: '0', sisa_pakan_kg: '0', feed_cost_idr: '', notes: '' })
      }
    })
  }

  if (loadingBatches) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">

      {/* Header */}
      <header className="px-4 pt-6 pb-4 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <h1 className="font-['Sora'] font-black text-xl text-white mb-0.5">Log Pakan Harian</h1>
          <p className="text-xs text-[#4B6478]">{feedLogs.length} entri · {summary.days} hari tercatat</p>
        </div>
        {selectedBatch && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-green-600 rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-[0_3px_12px_rgba(22,163,74,0.35)]"
          >
            <Plus size={13} />
            Log Pakan
          </motion.button>
        )}
      </header>

      {/* Pilih Batch */}
      <div className="px-4 mt-4">
        <div className="relative">
          <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}
            className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none">
            <option value="">-- Pilih batch --</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.batch_code} — {b.kandang_name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
        </div>
      </div>

      {selectedBatch && (
        <>
          {/* Summary batch */}
          <div className="px-4 mt-4 grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <p className="font-['Sora'] font-black text-base text-white leading-none mb-0.5">
                {summary.totalConsumed.toFixed(0)} kg
              </p>
              <p className="text-[10px] text-[#4B6478]">Total Dikonsumsi</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <p className="font-['Sora'] font-black text-base text-white leading-none mb-0.5">
                {summary.totalCost ? formatIDRShort(summary.totalCost) : '—'}
              </p>
              <p className="text-[10px] text-[#4B6478]">Total Biaya Pakan</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <p className="font-['Sora'] font-black text-base text-white leading-none mb-0.5">
                {summary.totalHijauan.toFixed(0)} kg
              </p>
              <p className="text-[10px] text-[#4B6478]">Total Hijauan</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <p className="font-['Sora'] font-black text-base text-white leading-none mb-0.5">
                {summary.totalKonsentrat.toFixed(0)} kg
              </p>
              <p className="text-[10px] text-[#4B6478]">Total Konsentrat</p>
            </div>
          </div>

          {/* Log List */}
          <div className="px-4 mt-4 space-y-3">
            {loadingLogs ? <LoadingSpinner />
            : feedLogs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                <p className="text-3xl mb-3">ðŸŒ¾</p>
                <p className="text-sm font-semibold text-white mb-1">Belum ada log pakan</p>
                <p className="text-xs text-[#4B6478]">Catat konsumsi pakan harian untuk kalkulasi FCR</p>
              </div>
            ) : feedLogs.map(log => <FeedLogCard key={log.id} log={log} />)}
          </div>
        </>
      )}

      {/* Sheet Tambah Log */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="bg-[#0C1319] border-t border-white/10 rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="font-['Sora'] font-black text-white text-lg">Log Pakan Harian</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-8">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Tanggal *</label>
                <DatePicker value={form.log_date} onChange={v => setForm(f => ({ ...f, log_date: v }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Nama Kandang *</label>
                <input value={form.kandang_name} onChange={e => setForm(f => ({ ...f, kandang_name: e.target.value }))}
                  placeholder="KDG-F2"
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Jumlah Ternak di Kandang *</label>
              <input type="number" value={form.animal_count} onChange={e => setForm(f => ({ ...f, animal_count: e.target.value }))}
                placeholder="12"
                className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-3">
              <p className="text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Pakan Diberikan (kg)</p>
              {[
                ['hijauan_kg',    'Hijauan (rumput / jerami fermentasi)'],
                ['konsentrat_kg', 'Konsentrat komersial'],
                ['dedak_kg',      'Dedak padi / pollard'],
                ['other_feed_kg', 'Pakan lainnya'],
                ['sisa_pakan_kg', 'Sisa pakan (tidak dimakan)'],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-xs text-[#94A3B8] flex-1">{label}</label>
                  <input
                    type="number" step="0.1"
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="0"
                    className="w-20 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white text-right focus:outline-none focus:border-green-500/40"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Biaya Pakan Hari Ini (Rp)</label>
              <input type="number" value={form.feed_cost_idr} onChange={e => setForm(f => ({ ...f, feed_cost_idr: e.target.value }))}
                placeholder="Opsional"
                className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!form.kandang_name || !form.animal_count || addFeedLog.isPending}
              onClick={handleSave}
              className="w-full py-3.5 bg-green-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm"
            >
              {addFeedLog.isPending ? 'Menyimpan...' : 'Simpan Log Pakan'}
            </motion.button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}