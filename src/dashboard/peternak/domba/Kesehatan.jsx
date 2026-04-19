import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Syringe, Calendar, Info, Trash2, ArrowLeft, HeartPulse, Activity } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useDombaActiveBatches,
  useDombaHealthLogs,
  useDombaAnimals,
  useAddDombaHealthLog,
  useDeleteDombaHealthLog
} from '@/lib/hooks/useDombaPenggemukanData'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { toast } from 'sonner'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'

const BASE = '/peternak/peternak_domba_penggemukan'

export default function DombaKesehatan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const batchId = searchParams.get('batch')
  
  const { profile } = useAuth()
  const { data: batches = [], isLoading: loadingBatches } = useDombaActiveBatches()
  const activeBatch = useMemo(() => 
    batchId ? batches.find(b => b.id === batchId) : batches[0]
  , [batchId, batches])

  const { data: logs = [], isLoading: loadingLogs } = useDombaHealthLogs(activeBatch?.id)
  const { data: animals = [] } = useDombaAnimals(activeBatch?.id)
  const addLog = useAddDombaHealthLog()
  const deleteLog = useDeleteDombaHealthLog()

  const [showAdd, setShowAdd] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    animal_id: '',
    log_type: 'sakit',
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
        animal_id: form.animal_id === 'null' || !form.animal_id ? null : form.animal_id
      })
      toast.success('Log kesehatan berhasil disimpan')
      setShowAdd(false)
      setForm({
        log_date: new Date().toISOString().split('T')[0],
        animal_id: '',
        log_type: 'sakit',
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
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/peternak/peternak_domba_penggemukan/beranda')} className="p-2 -ml-2 text-[#4B6478] hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-['Sora'] font-black text-xl text-white">Layanan Kesehatan Domba</h1>
        </div>
        
        {batches.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {batches.map(b => (
              <button
                key={b.id}
                onClick={() => navigate(`${BASE}/kesehatan?batch=${b.id}`)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeBatch?.id === b.id 
                    ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-600/20' 
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
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-green-600/10"
            >
              <Plus size={14} /> Catat Penanganan
            </button>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-[32px]">
                <Activity size={24} className="text-[#4B6478] mx-auto mb-2 opacity-20" />
                <p className="text-xs text-[#4B6478]">Belum ada catatan kesehatan untuk batch ini</p>
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="bg-white/[0.03] border border-white/[0.06] rounded-[24px] p-5 transition-all hover:bg-white/[0.05]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-inner">
                        <Syringe size={18} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{new Date(log.log_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-wider">
                          {log.animal_id ? `Ekor ID: ${log.kd_penggemukan_animals?.ear_tag || 'Unknown'}` : 'Seluruh Batch'}
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
                  
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/[0.04] mb-1">
                    <div>
                      <p className="text-[10px] text-[#4B6478] font-black uppercase mb-1.5 tracking-widest leading-none">Gejala</p>
                      <p className="text-xs text-white leading-relaxed font-medium">{log.symptoms || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#4B6478] font-black uppercase mb-1.5 tracking-widest leading-none">Diagnosa</p>
                      <p className="text-xs text-green-200 leading-relaxed font-bold">{log.diagnosis || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 shadow-inner">
                      <p className="text-[10px] text-[#4B6478] font-black uppercase mb-1.5 tracking-widest leading-none">Penanganan & Obat</p>
                      <div className="flex items-center gap-2 mb-1.5">
                         <span className="text-xs font-black text-green-400 uppercase">{log.medication_used || 'Tanpa Obat'}</span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed font-medium">{log.treatment || '-'}</p>
                    </div>
                  </div>

                  {log.notes && (
                    <div className="mt-4 flex items-start gap-2 pt-4 border-t border-white/[0.04]">
                      <Info size={12} className="text-[#4B6478] shrink-0 mt-0.5" />
                      <p className="text-[10px] text-[#4B6478] italic leading-relaxed font-bold">{log.notes}</p>
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
              className="relative w-full max-w-md bg-[#0C1319] border-t sm:border border-white/[0.06] rounded-t-[32px] sm:rounded-[40px] p-8 pb-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="font-['Sora'] font-black text-xl text-white mb-1">Catat Penanganan</h3>
                   <p className="text-[11px] text-[#4B6478] font-bold uppercase tracking-widest">Input Data Medis & Vaksin</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#4B6478] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={form.log_date}
                    onChange={e => setForm({...form, log_date: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Pilih Ternak (Opsional)</label>
                  <Select value={form.animal_id} onValueChange={v => setForm({...form, animal_id: v})}>
                    <SelectTrigger className="w-full h-14 bg-white/[0.03] border-white/10 rounded-2xl text-white px-5 shadow-inner">
                      <SelectValue placeholder="Pilih ekor... (biarkan kosong jika seluruh batch)" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0C1319] border-white/10 rounded-2xl shadow-2xl">
                      <SelectItem value="null">-- Seluruh Batch --</SelectItem>
                      {animals.map(a => (
                        <SelectItem key={a.id} value={a.id} className="py-3 px-4 border-b border-white/5 last:border-0">
                           <div className="flex flex-col">
                              <span className="font-black text-sm">{a.ear_tag}</span>
                              <span className="text-[10px] text-[#4B6478] font-bold uppercase">{a.breed || 'No Breed'}</span>
                           </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Gejala Teramati</label>
                  <input
                    type="text"
                    required
                    placeholder="Diare, lemas, nafsu makan turun..."
                    value={form.symptoms}
                    onChange={e => setForm({...form, symptoms: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#4B6478] focus:outline-none focus:border-green-500/50 transition-colors shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Diagnosa Sementara</label>
                  <input
                    type="text"
                    placeholder="Cacingan, Kembung, dll..."
                    value={form.diagnosis}
                    onChange={e => setForm({...form, diagnosis: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-green-200 placeholder:text-[#4B6478]/50 focus:outline-none focus:border-green-500/50 transition-colors shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Obat Digunakan</label>
                    <input
                      type="text"
                      placeholder="Albendazole, B-Complex..."
                      value={form.medication_used}
                      onChange={e => setForm({...form, medication_used: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Penanganan</label>
                    <input
                      type="text"
                      placeholder="Suntik IM, Karantina..."
                      value={form.treatment}
                      onChange={e => setForm({...form, treatment: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-[#4B6478] uppercase mb-2 ml-1 tracking-widest leading-none">Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    placeholder="Tambahkan detail lainnya..."
                    value={form.notes}
                    onChange={e => setForm({...form, notes: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-green-500/50 resize-none transition-colors shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:bg-white/[0.03] disabled:text-[#4B6478] text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 mt-4 active:scale-[0.98]"
                >
                  <HeartPulse size={18} className={isSubmitting ? 'animate-pulse' : ''} />
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