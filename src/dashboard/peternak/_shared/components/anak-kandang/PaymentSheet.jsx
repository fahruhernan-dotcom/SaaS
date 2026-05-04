import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { useKandangWorkerPayments, useAddKandangWorkerPayment, useDeleteKandangWorkerPayment } from '@/lib/hooks/usePeternakTaskData'
import { Plus, Loader2, Trash2, X, AlertCircle } from 'lucide-react'
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { toast } from 'sonner'

const TYPES = [
  { value: 'gaji',  label: '💰 Gaji',      color: '#34D399' },
  { value: 'bonus', label: '🎁 Bonus',      color: '#A78BFA' },
  { value: 'makan', label: '🍱 Uang Makan', color: '#F59E0B' },
  { value: 'lain',  label: '📌 Lainnya',    color: '#94A3B8' },
]

function formatIDR(n) { return !n ? 'Rp 0' : 'Rp ' + Number(n).toLocaleString('id-ID') }
function fmt(d) { return !d ? '—' : new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default function PaymentSheet({ open, onClose, worker, isDesktop, animalType, activeBatches }) {
  const today = new Date().toISOString().split('T')[0]
  const { data: payments = [], isLoading } = useKandangWorkerPayments(worker?.id)
  const addPayment = useAddKandangWorkerPayment()
  const deletePayment = useDeleteKandangWorkerPayment()

  const [addMode, setAddMode] = useState(false)
  const [form, setForm] = useState({ payment_date: today, payment_type: 'gaji', amount: 0, notes: '' })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, paymentId: null })
  
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (open && worker) {
      const lastSalary = payments.find(p => p.payment_type === 'gaji')
      const defaultAmount = lastSalary?.amount || worker.base_salary || 0
      
      const date = new Date()
      date.setMonth(date.getMonth() - 1)
      const prevMonth = date.toLocaleDateString('id-ID', { month: 'long' })
      
      setForm({
        payment_date: today,
        payment_type: 'gaji',
        amount: defaultAmount,
        notes: `Gaji Bulan ${prevMonth}`
      })
    }
  }, [open, worker?.id]) 

  const totalPaid = useMemo(() => payments.reduce((s, p) => s + (p.amount || 0), 0), [payments])

  const handleAdd = () => {
    if (!form.amount || addPayment.isPending || !worker) return
    addPayment.mutate({
      worker_id: worker.id,
      payment_date: form.payment_date,
      payment_type: form.payment_type,
      amount: form.amount,
      notes: form.notes,
      animalType,
      batches: activeBatches,
    }, {
      onSuccess: () => {
        setForm({ payment_date: today, payment_type: 'gaji', amount: 0, notes: '' })
        setAddMode(false)
      }
    })
  }

  const handleDelete = (id) => {
    setDeleteConfirm({ open: true, paymentId: id })
  }

  const confirmDelete = () => {
    deletePayment.mutate({ paymentId: deleteConfirm.paymentId, workerId: worker.id }, {
      onSuccess: () => setDeleteConfirm({ open: false, paymentId: null })
    })
  }

  if (!worker) return null

  return (
    <>
      <Sheet open={open} onOpenChange={v => !v && onClose()}>
        <SheetContent
          side={isDesktop ? 'right' : 'bottom'}
          hideClose
          className={`bg-[#0C1319] border-white/8 p-0 overflow-y-auto ${isDesktop ? 'w-[400px] sm:w-[450px]' : 'rounded-t-[28px] max-h-[94vh]'}`}
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/5 sticky top-0 bg-[#0C1319]/80 backdrop-blur-xl z-20 text-left sm:text-left space-y-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-white font-['Sora'] font-black text-lg">
                  Riwayat Gaji — {worker.full_name}
                </SheetTitle>
                <SheetDescription className="text-[#4B6478] text-[11px] font-bold uppercase tracking-wider mt-1">
                  {payments.length} Transaksi · Total {formatIDR(totalPaid)}
                </SheetDescription>
              </div>
              <button onClick={onClose} className="p-2 text-[#4B6478] hover:bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <button
              onClick={() => setAddMode(v => !v)}
              className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-3 bg-violet-600 rounded-xl text-white text-xs font-black font-['Sora'] shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
            >
              <Plus size={14} strokeWidth={3} /> {addMode ? 'TUTUP FORM' : 'CATAT PEMBAYARAN'}
            </button>
          </SheetHeader>

          <div className="p-5 pb-12 flex flex-col gap-4">
            {/* Add Form with Animation */}
            <AnimatePresence>
              {addMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-violet-500/5 border border-violet-500/15 rounded-2xl flex flex-col gap-4">
                    <p className="text-[11px] font-black text-violet-500 uppercase tracking-widest">Pencatatan Baru</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1.5">Tanggal</label>
                        <DatePicker value={form.payment_date} onChange={v => set('payment_date', v)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1.5">Jumlah (Rp)</label>
                        <InputRupiah value={form.amount} onChange={v => set('amount', v)} placeholder="500.000" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1.5">Tipe Pembayaran</label>
                      <div className="flex gap-2 flex-wrap">
                        {TYPES.map(t => (
                          <button
                            key={t.value} type="button"
                            onClick={() => set('payment_type', t.value)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                              form.payment_type === t.value
                                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                                : 'bg-white/[0.03] border border-white/[0.06] text-[#4B6478]'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1.5">Keterangan</label>
                      <input
                        type="text" placeholder="cth. Gaji bulan April"
                        value={form.notes} onChange={e => set('notes', e.target.value)}
                        className="w-full px-4 py-3 bg-[#111C24] border border-white/[0.08] rounded-xl text-slate-100 text-[15px] outline-none focus:border-violet-500/50 transition-colors"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setAddMode(false)} className="flex-1 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[#4B6478] text-xs font-black tracking-widest">
                        BATAL
                      </button>
                      <button
                        onClick={handleAdd}
                        disabled={!form.amount || addPayment.isPending}
                        className={`flex-[2] py-3.5 rounded-xl font-['Sora'] font-black text-xs text-white tracking-widest ${
                          form.amount && !addPayment.isPending ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20 active:scale-95' : 'bg-white/[0.05] text-[#4B6478] cursor-not-allowed'
                        } transition-all`}
                      >
                        {addPayment.isPending ? 'MENYIMPAN...' : 'SIMPAN DATA'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* History List */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-violet-500" size={32} />
                <p className="text-xs font-bold text-[#4B6478] tracking-widest">MEMUAT DATA...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-[32px] bg-white/[0.01]">
                <p className="text-xs font-bold text-[#4B6478] tracking-widest uppercase italic">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map(p => {
                  const typeInfo = TYPES.find(t => t.value === p.payment_type)
                  return (
                    <motion.div
                      layout
                      key={p.id}
                      className="group relative p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-between hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-lg">
                          {typeInfo?.label?.split(' ')[0] ?? '📌'}
                        </div>
                        <div>
                          <p className="text-[15px] font-black text-white font-['Sora']">{formatIDR(p.amount)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">{fmt(p.payment_date)}</p>
                            {p.notes && <span className="text-[10px] text-[#4B6478]">·</span>}
                            <p className="text-[10px] font-bold text-[#4B6478] truncate max-w-[150px]">{p.notes}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2.5 text-red-400/30 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Premium Confirmation Modal */}
          <AnimatePresence>
            {deleteConfirm.open && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-md"
                  onClick={() => setDeleteConfirm({ open: false, paymentId: null })}
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-[340px] bg-[#0C1319] border border-white/[0.1] rounded-[40px] p-8 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] z-[101]"
                >
                  <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={32} className="text-red-400" />
                  </div>
                  <h4 className="text-white font-['Sora'] font-black text-xl mb-3">Hapus Data?</h4>
                  <p className="text-[#94A3B8] text-[13px] font-medium leading-relaxed mb-10 px-2">
                    Tindakan ini permanen. Riwayat gaji pekerja ini akan dihapus dari sistem.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ open: false, paymentId: null })}
                      className="py-4 px-4 bg-white/[0.05] border border-white/[0.08] text-white text-[11px] font-black rounded-[20px] hover:bg-white/10 transition-all tracking-widest cursor-pointer active:scale-95"
                    >
                      BATAL
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      className="py-4 px-4 bg-red-500 text-white text-[11px] font-black rounded-[20px] hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 tracking-widest cursor-pointer active:scale-95"
                    >
                      HAPUS
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>
    </>
  )
}
