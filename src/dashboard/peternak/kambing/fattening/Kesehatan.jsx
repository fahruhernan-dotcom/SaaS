import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, ChevronDown, AlertTriangle, Shield, Bug, Skull, Activity, Syringe } from 'lucide-react'
import {
  useKambingBatches, useKambingHealthLogs, useKambingAnimals, useAddKambingHealthLog,
} from '@/lib/hooks/useKambingPenggemukanData'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import LoadingSpinner from '../../../_shared/components/LoadingSpinner'

const LOG_TYPE_CFG = {
  sakit:       { label: 'Sakit',       icon: AlertTriangle, cls: 'text-red-400 bg-red-500/15 border-red-500/25' },
  vaksinasi:   { label: 'Vaksinasi',   icon: Shield,        cls: 'text-blue-400 bg-blue-500/15 border-blue-500/25' },
  obat_cacing: { label: 'Obat Cacing', icon: Bug,           cls: 'text-amber-400 bg-amber-500/15 border-amber-500/25' },
  kematian:    { label: 'Kematian',    icon: Skull,         cls: 'text-slate-400 bg-white/10 border-white/15' },
  lainnya:     { label: 'Lainnya',     icon: Activity,      cls: 'text-[#4B6478] bg-white/5 border-white/10' },
}

// Jadwal vaksin standar kambing/domba
const VACC_SCHEDULE = [
  { name: 'Obat Cacing (Masuk)',       interval: 'Saat masuk' },
  { name: 'Vaksin PMK',               interval: 'Saat masuk & H-90' },
  { name: 'Vaksin Clostridial (CDT)', interval: 'Saat masuk & H-90' },
  { name: 'Obat Cacing Rutin',        interval: 'H-30, H-60 (jika siklus panjang)' },
  { name: 'Vaksin Anthrax',           interval: 'Daerah endemik — awal kemarau' },
]

function HealthLogCard({ log }) {
  const cfg = LOG_TYPE_CFG[log.log_type] ?? LOG_TYPE_CFG.lainnya
  const Icon = cfg.icon
  const earTag = log.kd_penggemukan_animals?.ear_tag ?? '—'
  const species = log.kd_penggemukan_animals?.species

  return (
    <div className={`border rounded-2xl p-4 ${cfg.cls}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className="shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-white leading-none">{cfg.label}</p>
            <p className="text-[11px] text-[#4B6478] mt-0.5">
              {species === 'kambing' ? 'ðŸ' : 'ðŸ‘'} {earTag} · {log.log_date}
            </p>
          </div>
        </div>
        {log.outcome && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
            log.outcome === 'sembuh' ? 'text-green-400 bg-green-500/15 border-green-500/25'
            : log.outcome === 'mati'  ? 'text-red-400 bg-red-500/15 border-red-500/25'
            : 'text-[#4B6478] bg-white/5 border-white/10'
          }`}>
            {log.outcome}
          </span>
        )}
      </div>

      {log.symptoms && <p className="text-xs text-[#94A3B8] mb-1">Gejala: {log.symptoms}</p>}
      {log.vaccine_name && <p className="text-xs text-[#94A3B8] mb-1">Vaksin: {log.vaccine_name}</p>}
      {log.medicine_name && (
        <p className="text-xs text-[#94A3B8] mb-1">Obat: {log.medicine_name} {log.medicine_dose && `— ${log.medicine_dose}`}</p>
      )}
      {log.action_taken && <p className="text-xs text-[#94A3B8] mb-1">Tindakan: {log.action_taken}</p>}
      {log.handled_by && <p className="text-[10px] text-[#4B6478] mt-1">Petugas: {log.handled_by}</p>}
      {log.vaccine_next_due && <p className="text-[10px] text-blue-400 mt-1">Booster berikutnya: {log.vaccine_next_due}</p>}
      {log.loss_value_idr && (
        <p className="text-[10px] text-red-400 mt-1">
          Kerugian: Rp {parseInt(log.loss_value_idr).toLocaleString('id-ID')}
        </p>
      )}
    </div>
  )
}

export default function KdPenggemukanKesehatan() {
  const { data: batches = [], isLoading: loadingBatches } = useKambingBatches()
  const [selectedBatch, setSelectedBatch] = useState('')
  const [tab, setTab] = useState('log')   // 'log' | 'jadwal'
  const [filterType, setFilterType] = useState('all')
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: logs = [], isLoading: loadingLogs } = useKambingHealthLogs(selectedBatch)
  const { data: animals = [] } = useKambingAnimals(selectedBatch)
  const addLog = useAddKambingHealthLog()

  const activeAnimals = animals.filter(a => a.status === 'active')

  const [form, setForm] = useState({
    animal_id: '', log_date: new Date().toISOString().split('T')[0],
    log_type: 'sakit',
    symptoms: '', action_taken: '', medicine_name: '', medicine_dose: '',
    handled_by: '', outcome: '',
    vaccine_name: '', vaccine_next_due: '',
    death_cause: '', death_weight_kg: '', loss_value_idr: '',
    notes: '',
  })

  const filteredLogs = useMemo(() => {
    if (filterType === 'all') return logs
    return logs.filter(l => l.log_type === filterType)
  }, [logs, filterType])

  const stats = useMemo(() => ({
    sakit:     logs.filter(l => l.log_type === 'sakit').length,
    vaksinasi: logs.filter(l => l.log_type === 'vaksinasi').length,
    kematian:  logs.filter(l => l.log_type === 'kematian').length,
  }), [logs])

  function handleSave() {
    if (!form.animal_id || !selectedBatch) return
    addLog.mutate({
      ...form,
      batch_id: selectedBatch,
      death_weight_kg: form.death_weight_kg ? parseFloat(form.death_weight_kg) : null,
      loss_value_idr: form.loss_value_idr ? parseInt(form.loss_value_idr) : null,
    }, {
      onSuccess: () => {
        setSheetOpen(false)
        setForm({ animal_id: '', log_date: new Date().toISOString().split('T')[0], log_type: 'sakit', symptoms: '', action_taken: '', medicine_name: '', medicine_dose: '', handled_by: '', outcome: '', vaccine_name: '', vaccine_next_due: '', death_cause: '', death_weight_kg: '', loss_value_idr: '', notes: '' })
      }
    })
  }

  if (loadingBatches) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">

      {/* Header */}
      <header className="px-4 pt-6 pb-4 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <h1 className="font-['Sora'] font-black text-xl text-white mb-0.5">Kesehatan & Vaksinasi</h1>
          <p className="text-xs text-[#4B6478]">{stats.kematian} kematian · {stats.vaksinasi} vaksinasi · {stats.sakit} sakit</p>
        </div>
        {selectedBatch && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-green-600 rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-[0_3px_12px_rgba(22,163,74,0.35)]"
          >
            <Plus size={13} />
            Log Baru
          </motion.button>
        )}
      </header>

      {/* Pilih Batch */}
      <div className="px-4 mt-4">
        <div className="relative">
          <select
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
            className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-green-500/40 appearance-none"
          >
            <option value="">-- Pilih batch --</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.batch_code} — {b.kandang_name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
        </div>
      </div>

      {/* Tab: Log | Jadwal Vaksin */}
      <div className="flex gap-1 px-4 mt-3">
        {[['log','Log Kesehatan'],['jadwal','Jadwal Vaksin']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === k ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'text-[#4B6478]'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'jadwal' ? (
        <div className="px-4 mt-4 space-y-2">
          <p className="text-xs text-[#4B6478] mb-3">Protokol standar penggemukan kambing & domba:</p>
          {VACC_SCHEDULE.map((v, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <div className="flex items-center gap-2.5">
                <Shield size={13} className="text-blue-400 shrink-0" />
                <span className="text-sm font-semibold text-white">{v.name}</span>
              </div>
              <span className="text-[10px] text-[#4B6478] text-right max-w-[120px]">{v.interval}</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Filter type */}
          {selectedBatch && (
            <div className="flex gap-1 px-4 mt-3 overflow-x-auto scrollbar-none">
              {['all','sakit','vaksinasi','obat_cacing','kematian'].map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    filterType === t ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'text-[#4B6478]'
                  }`}>
                  {t === 'all' ? 'Semua' : t === 'obat_cacing' ? 'Cacing' : LOG_TYPE_CFG[t]?.label}
                </button>
              ))}
            </div>
          )}

          <div className="px-4 mt-4 space-y-3">
            {!selectedBatch ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                <div className="w-16 h-16 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <Syringe size={32} className="text-green-500" />
        </div>
                <p className="text-sm text-[#4B6478]">Pilih batch untuk melihat log kesehatan</p>
              </div>
            ) : loadingLogs ? <LoadingSpinner />
            : filteredLogs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                <p className="text-sm text-[#4B6478]">Belum ada log kesehatan</p>
              </div>
            ) : filteredLogs.map(log => <HealthLogCard key={log.id} log={log} />)}
          </div>
        </>
      )}

      {/* Sheet Tambah Log */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="bg-[#0C1319] border-t border-white/10 rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="font-['Sora'] font-black text-white text-lg">Log Kesehatan Baru</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-8">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Pilih Ekor *</label>
                <select value={form.animal_id} onChange={e => setForm(f => ({ ...f, animal_id: e.target.value }))}
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-green-500/40">
                  <option value="">-- Pilih --</option>
                  {animals.map(a => (
                    <option key={a.id} value={a.id}>{a.ear_tag} ({a.species})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Jenis Log *</label>
                <select value={form.log_type} onChange={e => setForm(f => ({ ...f, log_type: e.target.value }))}
                  className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-green-500/40">
                  {Object.entries(LOG_TYPE_CFG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Tanggal *</label>
              <DatePicker value={form.log_date} onChange={v => setForm(f => ({ ...f, log_date: v }))} />
            </div>

            {(form.log_type === 'sakit' || form.log_type === 'lainnya') && (
              <>
                <div>
                  <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Tanda Klinis / Gejala</label>
                  <input value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
                    placeholder="Diare, lemas, nafsu makan turun..."
                    className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Tindakan</label>
                  <input value={form.action_taken} onChange={e => setForm(f => ({ ...f, action_taken: e.target.value }))}
                    placeholder="Isolasi, injeksi, dll"
                    className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Nama Obat</label>
                    <input value={form.medicine_name} onChange={e => setForm(f => ({ ...f, medicine_name: e.target.value }))}
                      placeholder="Sulfa, Penisilin..."
                      className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Dosis</label>
                    <input value={form.medicine_dose} onChange={e => setForm(f => ({ ...f, medicine_dose: e.target.value }))}
                      placeholder="5 ml IM"
                      className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Hasil Akhir</label>
                  <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                    className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-green-500/40">
                    <option value="">-- Pilih --</option>
                    <option value="sembuh">Sembuh</option>
                    <option value="masih_diobati">Masih Diobati</option>
                    <option value="mati">Mati</option>
                  </select>
                </div>
              </>
            )}

            {(form.log_type === 'vaksinasi' || form.log_type === 'obat_cacing') && (
              <>
                <div>
                  <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">
                    {form.log_type === 'vaksinasi' ? 'Nama Vaksin' : 'Nama Obat Cacing'}
                  </label>
                  <input
                    value={form.log_type === 'vaksinasi' ? form.vaccine_name : form.medicine_name}
                    onChange={e => setForm(f => form.log_type === 'vaksinasi'
                      ? { ...f, vaccine_name: e.target.value }
                      : { ...f, medicine_name: e.target.value }
                    )}
                    placeholder={form.log_type === 'vaksinasi' ? 'PMK, CDT, Anthrax...' : 'Albendazole 10%...'}
                    className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Dosis</label>
                  <input value={form.medicine_dose} onChange={e => setForm(f => ({ ...f, medicine_dose: e.target.value }))}
                    placeholder="2 ml IM"
                    className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
                </div>
                {form.log_type === 'vaksinasi' && (
                  <div>
                    <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Jadwal Booster Berikutnya</label>
                    <DatePicker value={form.vaccine_next_due} onChange={v => setForm(f => ({ ...f, vaccine_next_due: v }))} />
                  </div>
                )}
              </>
            )}

            {form.log_type === 'kematian' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Dugaan Penyebab Kematian</label>
                  <input value={form.death_cause} onChange={e => setForm(f => ({ ...f, death_cause: e.target.value }))}
                    placeholder="Pneumonia, kecelakaan..."
                    className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Bobot Saat Mati (kg)</label>
                    <input type="number" step="0.1" value={form.death_weight_kg} onChange={e => setForm(f => ({ ...f, death_weight_kg: e.target.value }))}
                      placeholder="28.0"
                      className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Nilai Kerugian (Rp)</label>
                    <input type="number" value={form.loss_value_idr} onChange={e => setForm(f => ({ ...f, loss_value_idr: e.target.value }))}
                      placeholder="1800000"
                      className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-[#4B6478] mb-1.5 block">Petugas</label>
              <input value={form.handled_by} onChange={e => setForm(f => ({ ...f, handled_by: e.target.value }))}
                placeholder="Nama petugas / drh."
                className="w-full px-3.5 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-green-500/40" />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!form.animal_id || addLog.isPending}
              onClick={handleSave}
              className="w-full py-3.5 bg-green-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm"
            >
              {addLog.isPending ? 'Menyimpan...' : 'Simpan Log'}
            </motion.button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}