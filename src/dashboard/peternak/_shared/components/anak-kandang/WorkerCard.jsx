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
    <>
      {/* ── DESKTOP: table-like compact row ── */}
      <div className={`hidden md:grid grid-cols-[minmax(180px,1fr)_140px_120px_110px_auto] gap-4 items-center px-4 py-3 transition-colors hover:bg-white/[0.015] ${isActive ? '' : 'opacity-60'}`}>

        {/* Col 1: Pekerja */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-['Sora'] font-extrabold text-[11px] text-emerald-400 shrink-0">
            {initials(worker.full_name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-['Sora'] font-bold text-sm text-slate-100 truncate">{worker.full_name}</span>
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 tracking-wider uppercase border ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/15'
              }`}>
                {isActive ? '● Aktif' : '○ Nonaktif'}
              </span>
              {isPaydaySoon && !worker.isPaid && (
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${
                  payInfo.daysLeft <= 1
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {payInfo.daysLeft === 0 ? '🔴 HARI INI' : payInfo.daysLeft === 1 ? '🟡 BESOK' : `⏰ ${payInfo.daysLeft}hr`}
                </span>
              )}
            </div>
            {linkedName && (
              <p className="text-[10px] text-emerald-400/70 mt-0.5 truncate">🔗 {linkedName}</p>
            )}
            {worker.phone && (
              <p className="text-[10px] text-[#4B6478] mt-0.5 flex items-center gap-1">
                <Phone size={9} /> {worker.phone}
              </p>
            )}
          </div>
        </div>

        {/* Col 2: Gaji Pokok */}
        <div className="flex flex-col gap-0.5">
          <span className="font-['Sora'] font-black text-sm text-slate-100">
            {worker.base_salary > 0 ? (
              <>
                {formatIDR(worker.base_salary)}
                <span className="text-[10px] font-normal text-[#4B6478]">/{(worker.salary_type || 'bulanan') === 'mingguan' ? 'mgg' : 'bln'}</span>
              </>
            ) : '—'}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-[#4B6478]">
            <CalendarClock size={9} className="shrink-0" /> {formatPaySchedule(worker)}
          </span>
        </div>

        {/* Col 3: Bonus */}
        <div>
          <span className="font-['Sora'] font-black text-sm text-emerald-400">
            {worker.bonus_per_kg > 0 ? `${formatIDR(worker.bonus_per_kg)}/kg` : '—'}
          </span>
        </div>

        {/* Col 4: Masuk */}
        <div>
          <span className="text-xs text-[#94A3B8]">
            {worker.join_date ? fmt(worker.join_date) : '—'}
          </span>
        </div>

        {/* Col 5: Aksi */}
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-[#94A3B8] text-[11px] font-bold hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <Edit2 size={11} /> Edit
          </button>
          <button
            onClick={onPayment}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[11px] font-bold hover:bg-emerald-600/20 transition-colors"
          >
            <Wallet size={11} /> Gaji
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-[#4B6478]/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              title="Hapus"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE: stacked card ── */}
      <div className={`md:hidden p-4 transition-colors hover:bg-white/[0.01] ${isActive ? '' : 'opacity-60'}`}>
        {/* Top: Avatar + Name + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-['Sora'] font-extrabold text-sm text-emerald-400 shrink-0">
              {initials(worker.full_name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-['Sora'] font-bold text-sm text-slate-100">{worker.full_name}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 tracking-wider uppercase border ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/15'
                }`}>
                  {isActive ? '● Aktif' : '○ Nonaktif'}
                </span>
              </div>
              {linkedName && (
                <p className="text-[10px] text-emerald-400/70 mt-0.5">🔗 {linkedName}</p>
              )}
              {worker.phone && (
                <p className="text-[10px] text-[#4B6478] mt-0.5 flex items-center gap-1">
                  <Phone size={9} /> {worker.phone}
                </p>
              )}
            </div>
          </div>
          {/* Payday badge on mobile */}
          {isPaydaySoon && !worker.isPaid && (
            <span className={`text-[9px] font-black px-2 py-1 rounded-full border shrink-0 ${
              payInfo.daysLeft <= 1
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {payInfo.daysLeft === 0 ? '🔴 Gajian Hari Ini' : payInfo.daysLeft === 1 ? '🟡 Besok Gajian' : `⏰ ${payInfo.daysLeft} Hari Lagi`}
            </span>
          )}
        </div>

        {/* Mid: Salary + Bonus + Join */}
        <div className="mt-3 flex flex-row gap-4 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-[#4B6478] uppercase tracking-wider">GAJI POKOK</span>
            <span className="font-['Sora'] font-black text-sm text-slate-100">
              {worker.base_salary > 0 ? (
                <>{formatIDR(worker.base_salary)}<span className="text-[10px] font-normal text-[#4B6478]">/{(worker.salary_type || 'bulanan') === 'mingguan' ? 'mgg' : 'bln'}</span></>
              ) : '—'}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-[#4B6478]">
              <CalendarClock size={9} /> {formatPaySchedule(worker)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-[#4B6478] uppercase tracking-wider">BONUS</span>
            <span className="font-['Sora'] font-black text-sm text-emerald-400">
              {worker.bonus_per_kg > 0 ? `${formatIDR(worker.bonus_per_kg)}/kg` : '—'}
            </span>
            {worker.join_date && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#4B6478]">
                <Clock size={9} /> {fmt(worker.join_date)}
              </span>
            )}
          </div>
        </div>

        {/* Bottom: Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-[#94A3B8] text-xs font-bold hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <Edit2 size={12} /> Edit
          </button>
          <button
            onClick={onPayment}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold hover:bg-emerald-600/20 transition-colors"
          >
            <Wallet size={12} /> Gaji
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-[#4B6478]/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              title="Hapus"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </>
  )
}
