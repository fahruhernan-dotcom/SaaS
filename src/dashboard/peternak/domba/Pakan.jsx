import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Wheat, Calendar, Info, Trash2, ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useDombaActiveBatches,
  useDombaFeedLogs,
  useAddDombaFeedLog,
  useDeleteDombaFeedLog
} from '@/lib/hooks/useDombaPenggemukanData'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { toast } from 'sonner'

const BASE = '/peternak/peternak_domba_penggemukan'

export default function DombaPakan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const batchId = searchParams.get('batch')
  
  const { profile } = useAuth()
  const { data: batches = [], isLoading: loadingBatches } = useDombaActiveBatches()
  const activeBatch = useMemo(() => 
    batchId ? batches.find(b => b.id === batchId) : batches[0]
  , [batchId, batches])

  const { data: logs = [], isLoading: loadingLogs } = useDombaFeedLogs(activeBatch?.id)
  const addLog = useAddDombaFeedLog()
  const deleteLog = useDeleteDombaFeedLog()

  const [showAdd, setShowAdd] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    hijauan_kg: '',
    konsentrat_kg: '',
    dedak_kg: '',
    other_feed_kg: '',
    sisa_pakan_kg: '',
    notes: ''
  })

  // Calculations
  const stats = useMemo(() => {
    if (!logs.length) return { total: 0, avg: 0 }
    const total = logs.reduce((sum, l) => sum + (l.consumed_kg || 0), 0)
    return {
      total: total.toFixed(1),
      avg: (total / logs.length).toFixed(1)
    }
  }, [logs])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!activeBatch) return
    
    setIsSubmitting(true)
    try {
      await addLog.mutateAsync({
        batch_id: activeBatch.id,
        ...form,
        hijauan_kg: parseFloat(form.hijauan_kg) || 0,
        konsentrat_kg: parseFloat(form.konsentrat_kg) || 0,
        dedak_kg: parseFloat(form.dedak_kg) || 0,
        other_feed_kg: parseFloat(form.other_feed_kg) || 0,
        sisa_pakan_kg: parseFloat(form.sisa_pakan_kg) || 0
      })
      toast.success('Log pakan berhasil disimpan')
      setShowAdd(false)
      setForm({
        log_date: new Date().toISOString().split('T')[0],
        hijauan_kg: '',
        konsentrat_kg: '',
        dedak_kg: '',
        other_feed_kg: '',
        sisa_pakan_kg: '',
        notes: ''
      })
    } catch (err) {
      toast.error('Gagal menyimpan log pakan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus log pakan ini?')) return
    try {
      await deleteLog.mutateAsync(id)
      toast.success('Log pakan dihapus')
    } catch (err) {
      toast.error('Gagal menghapus log')
    }
  }

  if (loadingBatches || (activeBatch && loadingLogs)) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#4B6478] hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-['Sora'] font-black text-xl text-white">Log Pakan Domba</h1>
        </div>
        
        {batches.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {batches.map(b => (
              <button
                key={b.id}
                onClick={() => navigate(`${BASE}/pakan?batch=${b.id}`)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeBatch?.id === b.id 
                    ? 'bg-green-600 border-green-500 text-white' 
                    : 'bg-white/[0.03] border-white/[0.06] text-[#4B6478]'
                }`}
              >
                {b.batch_code}
              </button>
            ))}
          </div>
        )}
      </header>

      {!activeBatch ? (
        <div className="px-4 py-20 text-center">
          <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
            <Wheat size={24} className="text-[#4B6478]" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Pilih Batch Terlebih Dahulu</p>
          <p className="text-xs text-[#4B6478]">Kamu perlu memiliki batch aktif untuk mencatat pakan</p>
        </div>
      ) : (
        <div className="px-4 mt-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-green-600/[0.05] border border-green-600/10 rounded-2xl p-4">
              <p className="text-[10px] text-green-500/60 font-bold uppercase tracking-wider mb-1">Total Konsumsi</p>
              <p className="text-xl font-black text-white font-['Sora']">{stats.total} <span className="text-xs font-normal text-[#4B6478]">kg</span></p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-wider mb-1">Rata-rata/Hari</p>
              <p className="text-xl font-black text-white font-['Sora']">{stats.avg} <span className="text-xs font-normal text-[#4B6478]">kg</span></p>
            </div>
          </div>

          {/* Logs List */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-['Sora'] font-bold text-sm text-white">Riwayat Pemberian Pakan</h2>
            <button
              onClick={() => setShowAdd(true)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} /> Catat Pakan
            </button>
          </div>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#4B6478]">Belum ada catatan pakan untuk batch ini</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 transition-all hover:bg-white/[0.05]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                        <Calendar size={14} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{new Date(log.log_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p className="text-[10px] text-[#4B6478]">Diinput oleh {log.created_by_name || 'Tim'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(log.id)}
                      className="p-1.5 text-red-500/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 py-2 border-t border-white/[0.04]">
                    <div>
                      <p className="text-[10px] text-[#4B6478] mb-0.5 font-bold uppercase tracking-widest">Input</p>
                      <p className="text-xs font-bold text-white">{(log.hijauan_kg + log.konsentrat_kg + log.dedak_kg + log.other_feed_kg).toFixed(1)} kg</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#4B6478] mb-0.5 font-bold uppercase tracking-widest">Sisa</p>
                      <p className="text-xs font-bold text-amber-400">{log.sisa_pakan_kg || 0} kg</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#4B6478] mb-0.5 font-bold uppercase tracking-widest">Konsumsi</p>
                      <p className="text-xs font-bold text-green-400">{log.consumed_kg || 0} kg</p>
                    </div>
                  </div>

                  {log.notes && (
                    <div className="mt-2 flex items-start gap-2 p-2 bg-white/[0.02] rounded-lg">
                      <Info size={12} className="text-[#4B6478] shrink-0 mt-0.5" />
                      <p className="text-[10px] text-[#4B6478] italic leading-relaxed">{log.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Log Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-[#06090F]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-[#0C1319] border-t sm:border border-white/[0.06] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-['Sora'] font-black text-lg text-white">Input Log Pakan</h3>
                <button onClick={() => setShowAdd(false)} className="p-2 -mr-2 text-[#4B6478]">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 font-['DM Sans']">
                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest leading-none">Tanggal Pemberian</label>
                  <input
                    type="date"
                    required
                    value={form.log_date}
                    onChange={e => setForm({...form, log_date: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest leading-none">Hijauan (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={form.hijauan_kg}
                      onChange={e => setForm({...form, hijauan_kg: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest leading-none">Konsentrat (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={form.konsentrat_kg}
                      onChange={e => setForm({...form, konsentrat_kg: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest leading-none">Dedak (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={form.dedak_kg}
                      onChange={e => setForm({...form, dedak_kg: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-400 uppercase mb-1.5 ml-1 tracking-widest leading-none">Sisa Pakan (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={form.sisa_pakan_kg}
                      onChange={e => setForm({...form, sisa_pakan_kg: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-amber-400 placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50 font-black transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest leading-none">Lainnya (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={form.other_feed_kg}
                    onChange={e => setForm({...form, other_feed_kg: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-1.5 ml-1 tracking-widest leading-none">Catatan</label>
                  <textarea
                    placeholder="Catatan pakan..."
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm({...form, notes: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50 resize-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:bg-white/[0.03] disabled:text-[#4B6478] text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-green-900/10 flex items-center justify-center gap-2 mt-4"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Log Pakan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}