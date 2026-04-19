import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Syringe, Calendar, Info, Trash2, ArrowLeft, HeartPulse, Activity } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useSapiActiveBatches,
  useSapiHealthLogs,
  useAddSapiHealthLog,
  useDeleteSapiHealthLog
} from '@/lib/hooks/useSapiPenggemukanData'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { toast } from 'sonner'

const BASE = '/peternak/peternak_sapi_penggemukan'

export default function SapiKesehatan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const batchId = searchParams.get('batch')
  
  const { profile } = useAuth()
  const { data: batches = [], isLoading: loadingBatches } = useSapiActiveBatches()
  const activeBatch = useMemo(() => 
    batchId ? batches.find(b => b.id === batchId) : batches[0]
  , [batchId, batches])

  const { data: logs = [], isLoading: loadingLogs } = useSapiHealthLogs(activeBatch?.id)
  const addLog = useAddSapiHealthLog()
  const deleteLog = useDeleteSapiHealthLog()

  const [showAdd, setShowAdd] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    animal_id: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medication_used: '',
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!activeBatch) return
    
    setIsSubmitting(true)
    try {
      await addLog.mutateAsync({
        batch_id: activeBatch.id,
        ...form,
        animal_id: form.animal_id || null // Optional if logging for batch/general
      })
      toast.success('Log kesehatan berhasil disimpan')
      setShowAdd(false)
      setForm({
        log_date: new Date().toISOString().split('T')[0],
        animal_id: '',
        symptoms: '',
        diagnosis: '',
        treatment: '',
        medication_used: '',
        notes: ''
      })
    } catch (err) {
      toast.error('Gagal menyimpan log kesehatan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus log kesehatan ini?')) return
    try {
      await deleteLog.mutateAsync({ logId: id, batch_id: activeBatch?.id })
      toast.success('Log kesehatan dihapus')
    } catch (err) {
      toast.error('Gagal menghapus log')
    }
  }

  if (loadingBatches || (activeBatch && loadingLogs)) return <LoadingSpinner fullPage />

  return (
    <div className="text-slate-100 pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-5 bg-gradient-to-b from-[#0C1319] to-[#06090F] border-b border-white/[0.04]">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#4B6478]">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-['Sora'] font-black text-xl text-white">Layanan Kesehatan Sapi</h1>
        </div>
        
        {batches.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {batches.map(b => (
              <button
                key={b.id}
                onClick={() => navigate(`${BASE}/kesehatan?batch=${b.id}`)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeBatch?.id === b.id 
                    ? 'bg-amber-500 border-amber-400 text-[#06090F]' 
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
            <HeartPulse size={24} className="text-[#4B6478]" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Pilih Batch Terlebih Dahulu</p>
          <p className="text-xs text-[#4B6478]">Kamu perlu memiliki batch aktif untuk mencatat kesehatan</p>
        </div>
      ) : (
        <div className="px-4 mt-6">
          {/* Logs List */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-['Sora'] font-bold text-sm text-white">Riwayat Terapi & Vaksin</h2>
            <button
              onClick={() => setShowAdd(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} /> Catat Penanganan
            </button>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                <Activity size={24} className="text-[#4B6478] mx-auto mb-2 opacity-20" />
                <p className="text-xs text-[#4B6478]">Belum ada catatan kesehatan untuk batch ini</p>
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Syringe size={18} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{new Date(log.log_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p className="text-[10px] text-[#4B6478]">
                          {log.animal_id ? `Ekor ID: ${log.animal_ear_tag || 'Unknown'}` : 'Seluruh Batch'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(log.id)}
                      className="p-1.5 text-red-500/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 py-3 border-t border-white/[0.04] mb-2">
                    <div>
                      <p className="text-[10px] text-[#4B6478] font-bold uppercase mb-1">Gejala</p>
                      <p className="text-xs text-white leading-relaxed">{log.symptoms || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#4B6478] font-bold uppercase mb-1">Diagnosa</p>
                      <p className="text-xs text-amber-200 leading-relaxed font-semibold">{log.diagnosis || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 bg-white/[0.02] rounded-xl">
                      <p className="text-[10px] text-[#4B6478] font-bold uppercase mb-1">Penanganan & Obat</p>
                      <p className="text-xs text-green-400 font-bold mb-1">{log.medication_used || 'Tanpa Obat'}</p>
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">{log.treatment || '-'}</p>
                    </div>
                  </div>

                  {log.notes && (
                    <div className="mt-3 flex items-start gap-2 pt-3 border-t border-white/[0.04]">
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
              className="relative w-full max-w-md bg-[#0C1319] border-t sm:border border-white/[0.06] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-['Sora'] font-black text-lg text-white">Catat Penanganan</h3>
                <button onClick={() => setShowAdd(false)} className="p-2 -mr-2 text-[#4B6478]">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 font-['DM Sans']">
                <div>
                  <label className="block text-[10px] font-bold text-[#4B6478] uppercase mb-1.5 ml-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={form.log_date}
                    onChange={e => setForm({...form, log_date: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4B6478] uppercase mb-1.5 ml-1">ID Ekor (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: SAP-001"
                    value={form.animal_id}
                    onChange={e => setForm({...form, animal_id: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4B6478] uppercase mb-1.5 ml-1">Gejala Teramati</label>
                  <input
                    type="text"
                    required
                    placeholder="Mata berair, nafsu makan turun..."
                    value={form.symptoms}
                    onChange={e => setForm({...form, symptoms: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4B6478] uppercase mb-1.5 ml-1">Diagnosa Sementara</label>
                  <input
                    type="text"
                    placeholder="Kelelahan, Cacingan, dll..."
                    value={form.diagnosis}
                    onChange={e => setForm({...form, diagnosis: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-amber-200 placeholder:text-[#4B6478] focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4B6478] uppercase mb-1.5 ml-1">Obat Digunakan</label>
                    <input
                      type="text"
                      placeholder="Nama Vaksin/Vitamin"
                      value={form.medication_used}
                      onChange={e => setForm({...form, medication_used: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#4B6478] uppercase mb-1.5 ml-1">Penanganan</label>
                    <input
                      type="text"
                      placeholder="Suntik IM, Karantina..."
                      value={form.treatment}
                      onChange={e => setForm({...form, treatment: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4B6478] uppercase mb-1.5 ml-1">Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm({...form, notes: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-white/[0.03] disabled:text-[#4B6478] text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-amber-900/10 flex items-center justify-center gap-2 mt-4"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Log Kesehatan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}