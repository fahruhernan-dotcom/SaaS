import React, { useState, useMemo } from 'react'
import { Plus, X, Search } from 'lucide-react'
import {
  useKdBreedingHealthLogs,
  useKdBreedingAnimals,
  useAddKdBreedingHealthLog,
} from '@/lib/hooks/useKdBreedingData'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'

const LOG_TYPE_LABEL = {
  vaksinasi:   'Vaksinasi',
  obat_cacing: 'Obat Cacing',
  sakit:       'Sakit / Pengobatan',
  kematian:    'Kematian',
  lainnya:     'Lainnya',
}
const LOG_TYPE_COLOR = {
  vaksinasi:   'bg-teal-500/20 text-teal-300',
  obat_cacing: 'bg-violet-500/20 text-violet-300',
  sakit:       'bg-amber-500/20 text-amber-300',
  kematian:    'bg-red-500/20 text-red-300',
  lainnya:     'bg-slate-500/20 text-slate-300',
}

function LogCard({ log }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-bold text-white">
            {log.animal?.ear_tag}
            {log.animal?.name ? ` (${log.animal.name})` : ''}
          </p>
          <p className="text-[11px] text-[#4B6478]">
            {new Date(log.log_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${LOG_TYPE_COLOR[log.log_type] ?? LOG_TYPE_COLOR.lainnya}`}>
          {LOG_TYPE_LABEL[log.log_type] ?? log.log_type}
        </span>
      </div>

      {(log.vaccine_name || log.drug_name) && (
        <p className="text-xs text-white font-semibold mt-1">
          {log.vaccine_name ?? log.drug_name}
          {log.dose ? <span className="text-[#4B6478] font-normal"> · {log.dose}</span> : null}
          {log.route ? <span className="text-[#4B6478] font-normal"> · {log.route}</span> : null}
        </p>
      )}
      {log.symptoms && <p className="text-[11px] text-amber-300 mt-1">Gejala: {log.symptoms}</p>}
      {log.diagnosis && <p className="text-[11px] text-[#4B6478] mt-0.5">Dx: {log.diagnosis}</p>}
      {log.outcome && <p className="text-[11px] text-green-400 mt-0.5">Hasil: {log.outcome}</p>}
      {log.notes && <p className="text-[11px] text-[#4B6478] mt-1 italic">{log.notes}</p>}
    </div>
  )
}

function AddHealthSheet({ open, onClose, animals }) {
  const addLog = useAddKdBreedingHealthLog()
  const [form, setForm] = useState({
    animal_id: '',
    log_date: new Date().toISOString().slice(0, 10),
    log_type: 'vaksinasi',
    vaccine_name: '',
    drug_name: '',
    dose: '',
    route: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    outcome: '',
    notes: '',
    recorded_by: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const activeAnimals = animals.filter(a => a.status === 'aktif')

  const handleSubmit = () => {
    if (!form.animal_id || !form.log_date) return
    const payload = { ...form }
    // Remove empty strings
    Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k] })
    addLog.mutate(payload, { onSuccess: onClose })
  }

  const showVaccine  = form.log_type === 'vaksinasi' || form.log_type === 'obat_cacing'
  const showSymptoms = form.log_type === 'sakit' || form.log_type === 'kematian'

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto bg-[#0F1923] rounded-t-3xl p-5 pb-10 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-['Sora'] font-bold text-base text-white">Log Kesehatan</h3>
          <button onClick={onClose}><X size={20} className="text-[#4B6478]" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Ternak *</label>
            <select value={form.animal_id} onChange={e => set('animal_id', e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
              <option value="">— Pilih Ternak —</option>
              {activeAnimals.map(a => (
                <option key={a.id} value={a.id}>
                  {a.ear_tag}{a.name ? ` (${a.name})` : ''} · {a.species}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Tanggal *</label>
              <input type="date" value={form.log_date} onChange={e => set('log_date', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="text-[11px] text-[#4B6478] mb-1 block">Jenis Log *</label>
              <select value={form.log_type} onChange={e => set('log_type', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                {Object.entries(LOG_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {showVaccine && (
            <>
              <div>
                <label className="text-[11px] text-[#4B6478] mb-1 block">
                  {form.log_type === 'vaksinasi' ? 'Nama Vaksin' : 'Nama Obat Cacing'}
                </label>
                <input
                  value={form.log_type === 'vaksinasi' ? form.vaccine_name : form.drug_name}
                  onChange={e => set(form.log_type === 'vaksinasi' ? 'vaccine_name' : 'drug_name', e.target.value)}
                  placeholder={form.log_type === 'vaksinasi' ? 'PMK, Anthrax, dll.' : 'Albendazole, Ivermectin, dll.'}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[#4B6478] mb-1 block">Dosis</label>
                  <input value={form.dose} onChange={e => set('dose', e.target.value)}
                    placeholder="2 ml, 7.5 mg/kg"
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
                </div>
                <div>
                  <label className="text-[11px] text-[#4B6478] mb-1 block">Rute</label>
                  <select value={form.route} onChange={e => set('route', e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                    <option value="">— Pilih —</option>
                    {['IM','SC','Oral','Intranasal'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {showSymptoms && (
            <>
              <div>
                <label className="text-[11px] text-[#4B6478] mb-1 block">Gejala / Tanda Klinis</label>
                <input value={form.symptoms} onChange={e => set('symptoms', e.target.value)}
                  placeholder="Diare, lemas, nafsu makan turun, dll."
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
              </div>
              <div>
                <label className="text-[11px] text-[#4B6478] mb-1 block">Diagnosis</label>
                <input value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)}
                  placeholder="Enteritis, Pneumonia, dll."
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
              </div>
              {form.log_type !== 'kematian' && (
                <>
                  <div>
                    <label className="text-[11px] text-[#4B6478] mb-1 block">Terapi / Pengobatan</label>
                    <input value={form.treatment} onChange={e => set('treatment', e.target.value)}
                      placeholder="Nama obat, dosis, rute"
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#4B6478] mb-1 block">Hasil</label>
                    <select value={form.outcome} onChange={e => set('outcome', e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white">
                      <option value="">— Pilih —</option>
                      <option value="sembuh">Sembuh</option>
                      <option value="dalam perawatan">Dalam Perawatan</option>
                      <option value="mati">Mati</option>
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Petugas</label>
            <input value={form.recorded_by} onChange={e => set('recorded_by', e.target.value)}
              placeholder="Nama petugas / drh."
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
          </div>
          <div>
            <label className="text-[11px] text-[#4B6478] mb-1 block">Catatan</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Opsional"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
          </div>

          {form.log_type === 'kematian' && (
            <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              Status ternak akan otomatis diubah ke "Mati" setelah disimpan.
            </p>
          )}

          <button onClick={handleSubmit} disabled={!form.animal_id || addLog.isPending}
            className="mt-2 w-full bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm">
            {addLog.isPending ? 'Menyimpan…' : 'Simpan Log'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BreedingKesehatan() {
  const { data: logs    = [], isLoading } = useKdBreedingHealthLogs()
  const { data: animals = [] }            = useKdBreedingAnimals()
  const [search, setSearch]  = useState('')
  const [typeFilter, setTypeFilter] = useState('semua')
  const [showAdd, setShowAdd] = useState(false)

  const filtered = useMemo(() => {
    let list = logs
    if (typeFilter !== 'semua') list = list.filter(l => l.log_type === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(l =>
        (l.animal?.ear_tag ?? '').toLowerCase().includes(q) ||
        (l.vaccine_name ?? '').toLowerCase().includes(q) ||
        (l.drug_name ?? '').toLowerCase().includes(q) ||
        (l.diagnosis ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [logs, typeFilter, search])

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>

  return (
    <div className="flex flex-col gap-4 p-4 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Sora'] font-bold text-xl text-white">Kesehatan</h1>
          <p className="text-[11px] text-[#4B6478]">{logs.length} log dicatat</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-teal-500 text-white text-xs font-bold px-3 py-2 rounded-xl">
          <Plus size={14} /> Log
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari ear tag, vaksin, diagnosa…"
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#4B6478]" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {['semua', ...Object.keys(LOG_TYPE_LABEL)].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
              typeFilter === t
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                : 'border-white/[0.08] text-[#4B6478]'
            }`}>
            {t === 'semua' ? 'Semua' : LOG_TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="text-4xl">💊</span>
          <p className="text-sm font-bold text-[#F1F5F9]">Tidak ada log kesehatan</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(l => <LogCard key={l.id} log={l} />)}
        </div>
      )}

      <AddHealthSheet open={showAdd} onClose={() => setShowAdd(false)} animals={animals} />
    </div>
  )
}
