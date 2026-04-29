import React, { useState, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { useKandangWorkerPayments, useAddKandangWorkerPayment } from '@/lib/hooks/usePeternakTaskData'
import { Plus, Loader2, Trash2 } from 'lucide-react'

const TYPES = [
  { value: 'gaji',  label: '💰 Gaji',      color: '#34D399' },
  { value: 'bonus', label: '🎁 Bonus',      color: '#A78BFA' },
  { value: 'makan', label: '🍱 Uang Makan', color: '#F59E0B' },
  { value: 'lain',  label: '📌 Lainnya',    color: '#94A3B8' },
]

function formatIDR(n) { return !n ? 'Rp 0' : 'Rp ' + Number(n).toLocaleString('id-ID') }
function fmt(d) { return !d ? '—' : new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default function PaymentSheet({ open, onClose, worker, isDesktop }) {
  const today = new Date().toISOString().split('T')[0]
  const { data: payments = [], isLoading } = useKandangWorkerPayments(worker?.id)
  const addPayment = useAddKandangWorkerPayment()

  const [addMode, setAddMode] = useState(false)
  const [form, setForm] = useState({ payment_date: today, payment_type: 'gaji', amount: 0, notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const totalPaid = useMemo(() => payments.reduce((s, p) => s + (p.amount || 0), 0), [payments])

  const handleAdd = () => {
    if (!form.amount || addPayment.isPending || !worker) return
    addPayment.mutate({
      worker_id: worker.id,
      payment_date: form.payment_date,
      payment_type: form.payment_type,
      amount: form.amount,
      notes: form.notes,
    }, {
      onSuccess: () => {
        setForm({ payment_date: today, payment_type: 'gaji', amount: 0, notes: '' })
        setAddMode(false)
      }
    })
  }

  if (!worker) return null

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        className={`bg-[#0C1319] border-white/8 overflow-y-auto p-0 ${
          isDesktop
            ? 'w-[420px] max-w-[420px] rounded-l-2xl'
            : 'rounded-t-[24px] max-h-[94vh]'
        }`}
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex justify-between items-start">
            <div>
              <SheetTitle className="text-white font-['Sora'] font-black text-base">
                Riwayat Gaji — {worker.full_name}
              </SheetTitle>
              <p className="text-[#4B6478] text-xs mt-0.5">
                {payments.length} transaksi · Total {formatIDR(totalPaid)}
              </p>
            </div>
            <button
              onClick={() => setAddMode(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 rounded-xl text-white text-xs font-extrabold font-['Sora'] shadow-md shadow-violet-500/30"
            >
              <Plus size={12} /> Catat
            </button>
          </div>
        </SheetHeader>

        <div className="p-5 pb-8 flex flex-col gap-3">
          {/* Add form */}
          {addMode && (
            <div className="p-4 bg-violet-500/5 border border-violet-500/15 rounded-2xl flex flex-col gap-3">
              <p className="text-[11px] font-black text-violet-500 uppercase tracking-wider">Catat Pembayaran Baru</p>

              <div>
                <label className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-wider mb-1">Tanggal</label>
                <DatePicker value={form.payment_date} onChange={v => set('payment_date', v)} />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-wider mb-1">Tipe</label>
                <div className="flex gap-1.5 flex-wrap">
                  {TYPES.map(t => (
                    <button
                      key={t.value} type="button"
                      onClick={() => set('payment_type', t.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-[1.5px] transition-all ${
                        form.payment_type === t.value
                          ? 'bg-violet-500/12 border-violet-500/40 text-violet-400'
                          : 'bg-white/[0.04] border-white/[0.07] text-[#4B6478]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-wider mb-1">Jumlah *</label>
                <InputRupiah value={form.amount} onChange={v => set('amount', v)} placeholder="500000" />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-wider mb-1">Catatan</label>
                <input
                  type="text" placeholder="cth. Gaji bulan April"
                  value={form.notes} onChange={e => set('notes', e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#111C24] border border-white/[0.08] rounded-xl text-slate-100 text-[15px] outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setAddMode(false)} className="flex-1 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[#4B6478] text-sm font-bold">
                  Batal
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!form.amount || addPayment.isPending}
                  className={`flex-[2] py-3 rounded-xl font-['Sora'] font-extrabold text-sm text-white ${
                    form.amount && !addPayment.isPending ? 'bg-violet-600 shadow-lg shadow-violet-500/20' : 'bg-violet-600/40 cursor-not-allowed'
                  }`}
                >
                  {addPayment.isPending ? 'Menyimpan...' : '💾 Simpan'}
                </button>
              </div>
            </div>
          )}

          {/* Payment history */}
          {isLoading ? (
            <div className="py-12 flex justify-center text-[#4B6478]"><Loader2 className="animate-spin" /></div>
          ) : payments.length === 0 ? (
            <div className="py-8 text-center text-[#4B6478] text-sm bg-[#111C24] rounded-2xl border border-dashed border-white/5">
              Belum ada riwayat pembayaran
            </div>
          ) : (
            payments.map(p => {
              const typeInfo = TYPES.find(t => t.value === p.payment_type)
              return (
                <div key={p.id} className="p-3 bg-[#111C24] rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{typeInfo?.label?.split(' ')[0] ?? '📌'}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-100">{formatIDR(p.amount)}</p>
                      <p className="text-[10px] text-[#4B6478]">{fmt(p.payment_date)} {p.notes && `· ${p.notes}`}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: typeInfo?.color, background: `${typeInfo?.color}15` }}>
                    {typeInfo?.label?.split(' ').slice(1).join(' ') ?? p.payment_type}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
