import React, { useState, useMemo } from 'react'
import { Plus, X, Wheat } from 'lucide-react'
import {
  useKambingBreedingFeedLogs,
  useAddKambingBreedingFeedLog,
} from '@/lib/hooks/useKambingBreedingData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'

function FeedCard({ log }) {
  const date = new Date(log.log_date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-bold text-white">{log.group_name}</p>
          <p className="text-[11px] text-[#4B6478]">{date}</p>
        </div>
        {log.head_count && (
          <span className="text-[10px] bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-full">
            {log.head_count} ekor
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.04]">
        {[
          { label: 'Hijauan', value: log.hijauan_kg },
          { label: 'Konsentrat', value: log.konsentrat_kg },
          { label: 'Dedak', value: log.dedak_kg },
          { label: 'Mineral', value: log.mineral_kg },
          { label: 'Sisa', value: log.sisa_kg, color: 'text-amber-300' },
          { label: 'Konsumsi', value: log.consumed_kg, color: 'text-green-400' },
        ].map(f => (
          <div key={f.label}>
            <p className="text-[10px] text-[#4B6478]">{f.label}</p>
            <p className={`text-xs font-bold ${f.color ?? 'text-white'}`}>
              {f.value > 0 ? `${f.value} kg` : '—'}
            </p>
          </div>
        ))}
      </div>

      {log.notes && <p className="text-[11px] text-[#4B6478] mt-2 italic">{log.notes}</p>}
    </div>
  )
}

function AddFeedSheet({ open, onClose }) {
  const addFeed = useAddKambingBreedingFeedLog()
  const [form, setForm] = useState({
    log_date: new Date().toISOString().slice(0, 10),
    group_name: '',
    head_count: '',
    hijauan_kg: '',
    konsentrat_kg: '',
    dedak_kg: '',
    mineral_kg: '',
    sisa_kg: '',
    notes: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const parseNum = (v) => v ? parseFloat(v) : 0

  const handleSubmit = () => {
    if (!form.log_date || !form.group_name) return
    addFeed.mutate({
      log_date:      form.log_date,
      group_name:    form.group_name,
      head_count:    form.head_count ? parseInt(form.head_count) : null,
      hijauan_kg:    parseNum(form.hijauan_kg),
      konsentrat_kg: parseNum(form.konsentrat_kg),
      dedak_kg:      parseNum(form.dedak_kg),
      mineral_kg:    parseNum(form.mineral_kg),
      sisa_kg:       parseNum(form.sisa_kg),
      notes:         form.notes || null,
    }, { onSuccess: onClose })
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto bg-[#0F1923] rounded-t-3xl p-5 pb-10 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-['Sora'] font-bold text-base text-white">Log Pakan</h3>
          <button onClick={onClose}><X size={20} className="text-[#4B6478]" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Tanggal *</label>
              <input type="date" value={form.log_date} onChange={e => set('log_date', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Jumlah Ekor</label>
              <input type="number" value={form.head_count} onChange={e => set('head_count', e.target.value)}
                placeholder="0"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Nama Kandang / Kelompok *</label>
            <input value={form.group_name} onChange={e => set('group_name', e.target.value)}
              placeholder="Indukan Laktasi A, Dara, Pejantan, dll."
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
          </div>

          <p className="text-[11px] text-[#4B6478] font-semibold uppercase tracking-wider mt-1">Pakan Diberikan (kg)</p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Hijauan (kg)', key: 'hijauan_kg' },
              { label: 'Konsentrat (kg)', key: 'konsentrat_kg' },
              { label: 'Dedak (kg)', key: 'dedak_kg' },
              { label: 'Mineral (kg)', key: 'mineral_kg' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[11px] text-[#4B6478] mb-1 block">{f.label}</label>
                <input type="number" step="0.1" value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Sisa Pakan (kg)</label>
            <input type="number" step="0.1" value={form.sisa_kg} onChange={e => set('sisa_kg', e.target.value)}
              placeholder="0"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
          </div>

          {/* Preview consumed */}
          {(form.hijauan_kg || form.konsentrat_kg || form.dedak_kg || form.mineral_kg) && (
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl px-3 py-2">
              <p className="text-[11px] text-[#4B6478]">Estimasi Konsumsi</p>
              <p className="text-sm font-bold text-teal-300">
                {Math.max(0,
                  parseNum(form.hijauan_kg) +
                  parseNum(form.konsentrat_kg) +
                  parseNum(form.dedak_kg) +
                  parseNum(form.mineral_kg) -
                  parseNum(form.sisa_kg)
                ).toFixed(1)} kg
              </p>
            </div>
          )}

          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Catatan</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Opsional"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
          </div>

          <button onClick={handleSubmit} disabled={!form.log_date || !form.group_name || addFeed.isPending}
            className="mt-2 w-full bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm">
            {addFeed.isPending ? 'Menyimpan—¦' : 'Simpan Log Pakan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BreedingPakan() {
  const { data: logs = [], isLoading } = useKambingBreedingFeedLogs()
  const [showAdd, setShowAdd] = useState(false)

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayLogs = logs.filter(l => l.log_date === today)
    const totalConsumption = logs.slice(0, 30).reduce((s, l) => s + (l.consumed_kg ?? 0), 0)
    return { todayLogs: todayLogs.length, totalConsumption }
  }, [logs])

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Sora'] font-bold text-xl text-white">Log Pakan</h1>
          <p className="text-[11px] text-[#4B6478]">{logs.length} entri dicatat</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-teal-500 text-white text-xs font-bold px-3 py-2 rounded-xl">
          <Plus size={14} /> Log
        </button>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <Wheat size={14} className="text-[#4B6478] mb-2" />
          <p className="font-['Sora'] font-black text-xl text-teal-300">{summary.todayLogs}</p>
          <p className="text-[11px] text-[#4B6478] font-semibold">Log Hari Ini</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <Wheat size={14} className="text-[#4B6478] mb-2" />
          <p className="font-['Sora'] font-black text-xl text-white">{summary.totalConsumption.toFixed(0)} kg</p>
          <p className="text-[11px] text-[#4B6478] font-semibold">Konsumsi 30 Log Terakhir</p>
        </div>
      </div>

      {/* List */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Wheat size={32} className="text-[#4B6478]" />
          <p className="text-sm font-bold text-[#F1F5F9]">Belum ada log pakan</p>
          <p className="text-xs text-[#4B6478]">Catat pemberian pakan per kandang/kelompok</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {logs.map(l => <FeedCard key={l.id} log={l} />)}
        </div>
      )}

      <AddFeedSheet open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}