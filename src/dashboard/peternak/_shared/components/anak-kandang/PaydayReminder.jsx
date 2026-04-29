import React, { useMemo } from 'react'
import { Bell, AlertTriangle, CalendarClock } from 'lucide-react'

const HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

function formatIDR(n) {
  return !n ? 'Rp 0' : 'Rp ' + Number(n).toLocaleString('id-ID')
}

/**
 * Calculate days until next payday.
 * @param {'bulanan'|'mingguan'} salaryType
 * @param {number} payDay - for bulanan: 1-28, for mingguan: 1(Mon)-7(Sun)
 * @returns {{ daysLeft: number, nextDate: Date }}
 */
function getNextPayday(salaryType, payDay) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (salaryType === 'mingguan') {
    // payDay: 1=Mon, 7=Sun → JS getDay: 0=Sun, 1=Mon...6=Sat
    const jsDay = payDay === 7 ? 0 : payDay
    const currentDay = today.getDay()
    let diff = jsDay - currentDay
    if (diff <= 0) diff += 7
    const next = new Date(today)
    next.setDate(next.getDate() + diff)
    return { daysLeft: diff, nextDate: next }
  }

  // bulanan
  const pd = payDay || 1
  let next = new Date(today.getFullYear(), today.getMonth(), pd)
  if (next <= today) {
    next = new Date(today.getFullYear(), today.getMonth() + 1, pd)
  }
  const diffMs = next - today
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return { daysLeft, nextDate: next }
}

export function getPaydayInfo(worker) {
  const type = worker.salary_type || 'bulanan'
  const pd = worker.pay_day || 1
  return { ...getNextPayday(type, pd), salaryType: type, payDay: pd }
}

export function formatPaySchedule(worker) {
  const type = worker.salary_type || 'bulanan'
  const pd = worker.pay_day || 1
  if (type === 'mingguan') return `Mingguan · Setiap ${HARI[pd] || 'Senin'}`
  return `Bulanan · Tanggal ${pd}`
}

export default function PaydayReminder({ workers }) {
  const alerts = useMemo(() => {
    if (!workers?.length) return []
    return workers
      .filter(w => w.status === 'aktif')
      .map(w => {
        const info = getPaydayInfo(w)
        return { worker: w, ...info }
      })
      .filter(a => a.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }, [workers])

  if (alerts.length === 0) return null

  return (
    <div className="p-4 bg-amber-500/[0.06] border border-amber-500/15 rounded-2xl space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Bell size={14} className="text-amber-400" />
        </div>
        <p className="font-['Sora'] font-extrabold text-sm text-amber-400">
          ⚠️ Pengingat Gaji
        </p>
      </div>
      {alerts.map(a => {
        const isToday = a.daysLeft === 0
        const isTomorrow = a.daysLeft === 1
        const dateStr = a.nextDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
        return (
          <div
            key={a.worker.id}
            className={`flex items-center justify-between p-3 rounded-xl border ${
              isToday
                ? 'bg-red-500/8 border-red-500/20'
                : isTomorrow
                  ? 'bg-amber-500/8 border-amber-500/15'
                  : 'bg-white/[0.02] border-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isToday ? (
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
              ) : (
                <CalendarClock size={14} className="text-amber-400 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-100 truncate">{a.worker.full_name}</p>
                <p className="text-[10px] text-[#4B6478]">
                  {a.salaryType === 'mingguan' ? 'Mingguan' : 'Bulanan'} · {dateStr}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className={`text-xs font-extrabold ${isToday ? 'text-red-400' : isTomorrow ? 'text-amber-400' : 'text-slate-300'}`}>
                {isToday ? 'HARI INI!' : isTomorrow ? 'BESOK' : `${a.daysLeft} hari lagi`}
              </p>
              <p className="text-[10px] font-bold text-[#4B6478]">{formatIDR(a.worker.base_salary)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
