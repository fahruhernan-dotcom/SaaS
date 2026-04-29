import React, { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { DatePicker } from '@/components/ui/DatePicker'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { useAssignableMembers } from '@/lib/hooks/usePeternakTaskData'
import { Loader2 } from 'lucide-react'

const labelCls = 'block text-[10px] font-extrabold text-[#4B6478] uppercase tracking-wider mb-1.5'
const inputCls = 'w-full px-3.5 py-3 bg-[#111C24] border border-white/[0.08] rounded-xl text-slate-100 text-[15px] outline-none focus:border-violet-500/50 transition-colors'

export default function WorkerSheet({ open, onClose, worker, onSubmit, isPending }) {
  const isEdit = !!worker
  const today = new Date().toISOString().split('T')[0]
  const { data: teamMembers = [] } = useAssignableMembers()

  const [form, setForm] = useState({
    full_name: '', phone: '', join_date: today,
    base_salary: 0, bonus_per_kg: 0, bonus_threshold_fcr: '',
    notes: '', status: 'aktif', profile_id: '',
    salary_type: 'bulanan', pay_day: 1,
  })

  useEffect(() => {
    if (open) {
      setForm(worker ? {
        full_name: worker.full_name ?? '',
        phone: worker.phone ?? '',
        join_date: worker.join_date ?? today,
        base_salary: worker.base_salary ?? 0,
        bonus_per_kg: worker.bonus_per_kg ?? 0,
        bonus_threshold_fcr: worker.bonus_threshold_fcr ?? '',
        notes: worker.notes ?? '',
        status: worker.status ?? 'aktif',
        profile_id: worker.profile_id ?? '',
        salary_type: worker.salary_type ?? 'bulanan',
        pay_day: worker.pay_day ?? 1,
      } : {
        full_name: '', phone: '', join_date: today,
        base_salary: 0, bonus_per_kg: 0, bonus_threshold_fcr: '',
        notes: '', status: 'aktif', profile_id: '',
        salary_type: 'bulanan', pay_day: 1,
      })
    }
  }, [open, worker])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const canSubmit = !!form.full_name

  const handleSubmit = () => {
    if (!canSubmit || isPending) return
    onSubmit({
      ...(isEdit ? { id: worker.id } : {}),
      full_name: form.full_name,
      phone: form.phone || null,
      join_date: form.join_date || null,
      base_salary: Number(form.base_salary) || 0,
      bonus_per_kg: Number(form.bonus_per_kg) || 0,
      bonus_threshold_fcr: form.bonus_threshold_fcr ? parseFloat(form.bonus_threshold_fcr) : null,
      notes: form.notes || null,
      status: form.status,
      profile_id: form.profile_id || null,
      salary_type: form.salary_type,
      pay_day: Number(form.pay_day) || 1,
    })
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        className="bg-[#0C1319] border-white/8 overflow-y-auto p-0 w-full max-w-[420px] rounded-l-2xl"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/5">
          <SheetTitle className="text-white font-['Sora'] font-black text-base">
            {isEdit ? 'Edit Anak Kandang' : 'Tambah Anak Kandang'}
          </SheetTitle>
        </SheetHeader>

        <div className="p-5 pb-8 flex flex-col gap-4">
          {/* Nama */}
          <div>
            <label className={labelCls}>Nama Lengkap *</label>
            <input
              type="text" placeholder="cth. Budi Santoso"
              value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Link ke Akun Tim */}
          <div>
            <label className={labelCls}>Link ke Akun Tim</label>
            <select
              value={form.profile_id} onChange={e => set('profile_id', e.target.value)}
              className={inputCls}
            >
              <option value="">— Tidak terhubung —</option>
              {teamMembers.map(m => (
                <option key={m.profile_id} value={m.profile_id}>
                  {m.full_name} ({m.role})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[#4B6478] mt-1">
              Hubungkan anak kandang ke akun tim agar bisa menerima tugas otomatis.
            </p>
          </div>

          {/* HP */}
          <div>
            <label className={labelCls}>No. HP</label>
            <PhoneInput
              placeholder="08123456789"
              value={form.phone} onChange={e => set('phone', e.target.value)}
              style={{ width: '100%', padding: '12px 14px', background: '#111C24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#F1F5F9', fontSize: 15, outline: 'none' }}
            />
          </div>

          {/* Tanggal gabung */}
          <div>
            <label className={labelCls}>Tanggal Bergabung</label>
            <DatePicker value={form.join_date} onChange={v => set('join_date', v)} placeholder="Pilih tanggal" />
          </div>

          {/* Tipe Gaji */}
          <div>
            <label className={labelCls}>Tipe Gaji</label>
            <div className="flex gap-2">
              {[
                { value: 'bulanan', label: '📅 Bulanan', active: 'bg-blue-500/10 border-blue-400 text-blue-400' },
                { value: 'mingguan', label: '📆 Mingguan', active: 'bg-cyan-500/10 border-cyan-400 text-cyan-400' },
              ].map(s => (
                <button
                  key={s.value} type="button"
                  onClick={() => {
                    set('salary_type', s.value)
                    set('pay_day', s.value === 'mingguan' ? 1 : 1)
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-[1.5px] transition-all ${
                    form.salary_type === s.value
                      ? s.active
                      : 'bg-white/[0.04] border-white/[0.07] text-[#4B6478]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gaji + Bonus */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Gaji Pokok /{form.salary_type === 'mingguan' ? 'mgg' : 'bln'}</label>
              <InputRupiah value={form.base_salary} onChange={v => set('base_salary', v)} placeholder="2500000" />
            </div>
            <div>
              <label className={labelCls}>Bonus /kg</label>
              <InputRupiah value={form.bonus_per_kg} onChange={v => set('bonus_per_kg', v)} placeholder="100" />
            </div>
          </div>

          {/* Hari / Tanggal Gajian */}
          <div>
            <label className={labelCls}>
              {form.salary_type === 'mingguan' ? 'Hari Gajian' : 'Tanggal Gajian'}
            </label>
            {form.salary_type === 'mingguan' ? (
              <div className="flex gap-1.5 flex-wrap">
                {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'].map((h, i) => (
                  <button
                    key={i} type="button"
                    onClick={() => set('pay_day', i + 1)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border-[1.5px] transition-all ${
                      form.pay_day === (i + 1)
                        ? 'bg-violet-500/12 border-violet-500/40 text-violet-400'
                        : 'bg-white/[0.04] border-white/[0.07] text-[#4B6478]'
                    }`}
                  >
                    {h.slice(0, 3)}
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={form.pay_day}
                onChange={e => set('pay_day', parseInt(e.target.value))}
                className={inputCls}
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>Tanggal {d}</option>
                ))}
              </select>
            )}
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Status</label>
            <div className="flex gap-2">
              {[
                { value: 'aktif', label: '✅ Aktif', active: 'bg-emerald-500/10 border-emerald-400 text-emerald-400', idle: '' },
                { value: 'nonaktif', label: '⛔ Nonaktif', active: 'bg-red-500/10 border-red-400 text-red-400', idle: '' },
              ].map(s => (
                <button
                  key={s.value} type="button"
                  onClick={() => set('status', s.value)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-[1.5px] transition-all ${
                    form.status === s.value
                      ? s.active
                      : 'bg-white/[0.04] border-white/[0.07] text-[#4B6478]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className={labelCls}>Catatan</label>
            <textarea
              placeholder="Catatan tambahan..."
              value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} className={`${inputCls} resize-none leading-relaxed`}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className={`w-full py-3.5 rounded-xl font-['Sora'] font-extrabold text-[15px] text-white transition-all ${
              canSubmit && !isPending
                ? 'bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20'
                : 'bg-violet-600/40 cursor-not-allowed'
            }`}
          >
            {isPending ? <Loader2 size={18} className="animate-spin mx-auto" /> : isEdit ? '✏️ Perbarui Data' : '👤 Tambah Pekerja'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
