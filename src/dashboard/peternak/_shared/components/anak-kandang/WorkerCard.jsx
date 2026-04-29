import React from 'react'
import { Phone, Clock, Edit2, Wallet, CalendarClock, Trash2 } from 'lucide-react'
import { formatPaySchedule, getPaydayInfo } from './PaydayReminder'

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatIDR(n) {
  if (!n) return 'Rp 0'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

export default function WorkerCard({ worker, onEdit, onPayment, onDelete }) {
  const isActive = worker.status === 'aktif'
  const linkedName = worker.linked_profile?.full_name
  const payInfo = getPaydayInfo(worker)
  const isPaydaySoon = isActive && payInfo.daysLeft <= 7

  return (
    <div className={`p-3.5 bg-[#0C1319] border border-white/[0.07] rounded-2xl transition-opacity ${isActive ? '' : 'opacity-60'}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-violet-500/15 border-[1.5px] border-violet-500/30 flex items-center justify-center font-['Sora'] font-extrabold text-[15px] text-violet-400 shrink-0">
          {initials(worker.full_name)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + Status */}
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="font-['Sora'] font-bold text-sm text-slate-100 truncate">{worker.full_name}</p>
              {linkedName && (
                <p className="text-[10px] text-emerald-400/80 mt-0.5">🔗 {linkedName}</p>
              )}
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/8 text-red-400 border border-red-500/15'
            }`}>
              {isActive ? '● Aktif' : '○ Nonaktif'}
            </span>
          </div>

          {/* Salary chips */}
          <div className="flex gap-4 mt-2.5 flex-wrap">
            {worker.base_salary > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-extrabold text-[#4B6478] uppercase tracking-wider">Gaji Pokok</span>
                <span className="font-['Sora'] font-bold text-xs text-slate-100">
                  {formatIDR(worker.base_salary)}/{(worker.salary_type || 'bulanan') === 'mingguan' ? 'mgg' : 'bln'}
                </span>
              </div>
            )}
            {worker.bonus_per_kg > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-extrabold text-[#4B6478] uppercase tracking-wider">Bonus</span>
                <span className="font-['Sora'] font-bold text-xs text-violet-400">{formatIDR(worker.bonus_per_kg)}/kg</span>
              </div>
            )}
          </div>

          {/* Pay schedule + Payday reminder */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] text-[#4B6478]">
              <CalendarClock size={10} /> {formatPaySchedule(worker)}
            </span>
            {isPaydaySoon && (
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                payInfo.daysLeft <= 1
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {payInfo.daysLeft === 0 ? '🔴 GAJIAN HARI INI' : payInfo.daysLeft === 1 ? '🟡 BESOK GAJIAN' : `⏰ ${payInfo.daysLeft} hari lagi`}
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="flex gap-3 mt-2 flex-wrap">
            {worker.phone && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#4B6478]">
                <Phone size={10} /> {worker.phone}
              </span>
            )}
            {worker.join_date && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#4B6478]">
                <Clock size={10} /> {fmt(worker.join_date)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[#94A3B8] text-[11px] font-bold hover:bg-white/[0.07] transition-colors"
            >
              <Edit2 size={11} /> Edit
            </button>
            <button
              onClick={onPayment}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-500/8 border border-violet-500/20 rounded-lg text-violet-400 text-[11px] font-bold hover:bg-violet-500/15 transition-colors"
            >
              <Wallet size={11} /> Gaji
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/8 border border-red-500/20 rounded-lg text-red-400 text-[11px] font-bold hover:bg-red-500/15 transition-colors ml-auto"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
