import { useMemo } from 'react'
import { Clock, CheckCircle2, CircleDashed, ChevronRight, ChevronLeft } from 'lucide-react'
import { format } from 'date-fns'

const TASK_CATEGORY_MAP = {
  pakan: { label: 'Pakan Pagi', time: '08:00', avatar: 'https://i.pravatar.cc/150?u=12', color: 'bg-emerald-500 dark:bg-emerald-400', textColor: 'text-emerald-700 dark:text-emerald-400' },
  kesehatan: { label: 'Cek Kesehatan', time: '09:00', avatar: 'https://i.pravatar.cc/150?u=32', color: 'bg-amber-500 dark:bg-amber-400', textColor: 'text-amber-700 dark:text-amber-400' },
  kebersihan_kandang: { label: 'Kebersihan Kandang', time: '12:00', avatar: 'https://i.pravatar.cc/150?u=44', color: 'bg-blue-500 dark:bg-blue-400', textColor: 'text-blue-700 dark:text-blue-400' },
  pemberian_pakan: { label: 'Pakan Sore', time: '15:00', avatar: 'https://i.pravatar.cc/150?u=68', color: 'bg-orange-500 dark:bg-orange-400', textColor: 'text-orange-700 dark:text-orange-400' },
  kebersihan: { label: 'Kebersihan Kandang', time: '12:00', avatar: 'https://i.pravatar.cc/150?u=44', color: 'bg-blue-500 dark:bg-blue-400', textColor: 'text-blue-700 dark:text-blue-400' },
  ceklis_kesehatan: { label: 'Cek Kesehatan', time: '09:00', avatar: 'https://i.pravatar.cc/150?u=32', color: 'bg-amber-500 dark:bg-amber-400', textColor: 'text-amber-700 dark:text-amber-400' },
  timbang: { label: 'Timbang', time: '07:00', avatar: 'https://i.pravatar.cc/150?u=11', color: 'bg-purple-500 dark:bg-purple-400', textColor: 'text-purple-700 dark:text-purple-400' },
  reproduksi: { label: 'Reproduksi', time: '11:00', avatar: 'https://i.pravatar.cc/150?u=22', color: 'bg-pink-500 dark:bg-pink-400', textColor: 'text-pink-700 dark:text-pink-400' },
  lainnya: { label: 'Lainnya', time: '16:00', avatar: 'https://i.pravatar.cc/150?u=99', color: 'bg-slate-500 dark:bg-slate-400', textColor: 'text-slate-700 dark:text-slate-400' },
}

export function TaskCategoryAudit({ tasks, onNavigate }) {
  const groups = useMemo(() => {
    const order = ['pakan', 'kesehatan', 'kebersihan_kandang', 'pemberian_pakan', 'lainnya']
    const map = {}
    tasks.forEach(t => {
      let type = t.task_type || t.template?.task_type || 'lainnya'
      // normalize types mapping to same output
      if (type === 'kebersihan') type = 'kebersihan_kandang'
      if (type === 'ceklis_kesehatan') type = 'kesehatan'

      // Logic: If pakan type but scheduled for afternoon/evening, treat as 'pemberian_pakan'
      if (type === 'pakan') {
        const title = (t.title || t.template?.title || '').toLowerCase()
        const hour = parseInt((t.due_time || '08:00').split(':')[0])
        if (hour >= 13 || title.includes('sore') || title.includes('afternoon')) {
          type = 'pemberian_pakan'
        }
      }

      if (!map[type]) map[type] = { type, tasks: [] }
      map[type].tasks.push(t)
    })

    // Sort to match the timeline sequence in mockup
    return Object.values(map).sort((a, b) => {
      const idxA = order.indexOf(a.type)
      const idxB = order.indexOf(b.type)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return 0
    })
  }, [tasks])

  if (tasks.length === 0) return null

  return (
    <section className="px-4 mt-2">
      <div className="bg-gradient-to-br from-emerald-50/80 to-slate-50 dark:from-[#1A3331] dark:to-[#121E23] border border-slate-200 dark:border-white/[0.03] rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="font-['Sora'] font-bold text-base sm:text-lg text-slate-900 dark:text-white">Audit Tugas Harian</h2>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-[#94A3B8] font-semibold cursor-pointer">
            <Clock size={12} className="text-slate-400 dark:text-white/40" />
            Hari ini
            <ChevronRight size={12} className="rotate-90 ml-1 text-slate-400 dark:text-white/40" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="relative group z-10">
          {/* Scroll Navigation Overlay */}
          <button className="absolute -left-2 top-[30px] -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white hover:bg-slate-55 dark:hover:bg-white/10 z-20 opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm dark:shadow-none">
            <ChevronLeft size={16} />
          </button>

          <button className="absolute -right-2 top-[30px] -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white hover:bg-slate-55 dark:hover:bg-white/10 z-20 opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm dark:shadow-none">
            <ChevronRight size={16} />
          </button>

          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 custom-scrollbar sm:px-6 -mx-4 sm:mx-0 px-4 sm:px-0 scroll-smooth">
            {groups.map(({ type, tasks: groupTasks }) => {
              const meta = TASK_CATEGORY_MAP[type] || TASK_CATEGORY_MAP.lainnya
              const done = groupTasks.filter(t => t.status === 'selesai').length
              const total = groupTasks.length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0

              let statusText = 'Tertunda'
              let statusColor = 'text-slate-500 dark:text-[#4B6478]'
              let barColor = 'bg-slate-200 dark:bg-white/10'
              let StatusIcon = CircleDashed
              let iconBg = 'bg-slate-100 dark:bg-[#1A3331]'
              let iconColor = 'text-slate-400 dark:text-white/40'

              if (pct === 100) {
                statusText = '100% Selesai'
                statusColor = meta.textColor
                barColor = meta.color
                StatusIcon = CheckCircle2
                iconBg = 'bg-emerald-600 dark:bg-emerald-500'
                iconColor = 'text-white'
              } else if (pct > 0) {
                statusText = `${pct}% Berjalan`
                statusColor = meta.textColor
                barColor = meta.color
                StatusIcon = Clock
                iconBg = 'bg-amber-500'
                iconColor = 'text-slate-900 dark:text-[#1A3331]'
              }

              // Determine worker & exact time from latest task
              const latestTask = [...groupTasks].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))[0]

              const getExactName = (task) => {
                if (!task) return 'Peternak'
                if (task.completed_by?.full_name) return task.completed_by.full_name
                if (task.completed_by?.kandang_workers?.[0]?.full_name) return task.completed_by.kandang_workers[0].full_name
                if (task.completed_by?.tenant_memberships?.[0]?.full_name) return task.completed_by.tenant_memberships[0].full_name
                return task.worker?.full_name || task.assigned_profile?.full_name || 'Peternak'
              }
              const workerName = getExactName(latestTask)

              // Exact Time
              let displayTime = meta.time
              if (latestTask) {
                if (latestTask.status === 'selesai' && latestTask.completed_at) {
                  const d = new Date(latestTask.completed_at)
                  if (!isNaN(d.getTime())) {
                    displayTime = `${format(d, 'HH:mm')} WIB`
                  }
                } else if (latestTask.due_time) {
                  displayTime = `${String(latestTask.due_time).substring(0, 5)} WIB`
                }
              }

              const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(workerName)}&background=random&color=fff&size=150`

              return (
                <div key={type} onClick={onNavigate} className="flex flex-col shrink-0 w-[140px] sm:w-[160px] cursor-pointer group/item">

                  {/* Avatar & Badge */}
                  <div className="relative w-11 h-11 mb-5" title={workerName}>
                    <img src={avatarUrl} alt={workerName} className="w-full h-full rounded-full object-cover shadow-lg border-2 border-slate-200 dark:border-[#182B2A]" />
                    <div className={`absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center border-[2.5px] border-slate-200 dark:border-[#182B2A] ${iconBg}`}>
                      <StatusIcon size={9} className={iconColor} strokeWidth={3} />
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-white/[0.04] rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>

                  {/* Text Information */}
                  <p className="text-[10px] text-slate-400 dark:text-[#4B6478] font-bold mb-0.5 opacity-80">{displayTime}</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-1">{meta.label}</p>
                  <p className={`text-[10px] font-bold ${statusColor}`}>{statusText}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
