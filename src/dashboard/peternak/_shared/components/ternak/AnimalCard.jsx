import { motion } from 'framer-motion'
import { Scale } from 'lucide-react'
import { calcHariDiFarm, calcADGFromRecords, calcADG } from '@/lib/hooks/useKdPenggemukanData'
import { STATUS_CONFIG, WEIGH_METHOD_LABEL } from './constants'

// animal._weightRecords must be pre-normalized by the parent page
// batchLabel — shown as badge when viewing all-batches mode
export function AnimalCard({ animal, onClick, onWeigh, batchLabel }) {
  const weightRecords = animal._weightRecords ?? []
  const hari = calcHariDiFarm(animal.entry_date, animal.exit_date)
  const adg  = calcADGFromRecords(weightRecords, animal.entry_date, animal.entry_weight_kg)
    || (animal.latest_weight_kg > animal.entry_weight_kg && hari > 0
        ? calcADG(animal.entry_weight_kg, animal.latest_weight_kg, hari)
        : 0)

  const latestW = animal.latest_weight_kg ?? animal.entry_weight_kg
  const gain    = (latestW - animal.entry_weight_kg).toFixed(1)
  const st      = STATUS_CONFIG[animal.status] ?? STATUS_CONFIG.active

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 cursor-pointer active:bg-white/[0.05] transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-['Sora'] font-bold text-sm text-white">{animal.ear_tag}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${st.color}`}>
              {st.label}
            </span>
            {batchLabel && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wide">
                {batchLabel}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#4B6478] font-bold uppercase tracking-tight">
            {animal.breed || 'Breed tidak diketahui'} · {animal.sex === 'betina' ? 'BETINA' : 'JANTAN'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="text-right">
            <p className="text-sm font-black text-white font-['Sora'] leading-tight">
              {latestW} <span className="text-[10px] text-[#4B6478]">kg</span>
            </p>
            <p className={`text-[10px] font-bold ${parseFloat(gain) > 0 ? 'text-green-400' : 'text-[#4B6478]'}`}>
              {parseFloat(gain) > 0 ? `+${gain} kg` : gain === '0.0' ? 'Netral' : `${gain} kg`}
            </p>
          </div>
          {onWeigh && (
            <button
              onClick={(e) => { e.stopPropagation(); onWeigh(animal) }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
            >
              <Scale size={11} />
              Timbang
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-white/[0.04]">
        <div>
          <p className="text-[11px] font-black text-white">{hari}</p>
          <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-wider">Hari</p>
        </div>
        <div className="border-x border-white/[0.06]">
          <p className={`text-[11px] font-black ${adg >= 150 ? 'text-green-400' : adg > 0 ? 'text-amber-400' : 'text-[#4B6478]'}`}>
            {adg ? (adg >= 1000 ? `${(adg / 1000).toFixed(2)}kg` : `${adg.toFixed(0)}g`) : '—'}
          </p>
          <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-wider">ADG/hr</p>
        </div>
        <div>
          <p className="text-[11px] font-black text-white">
            {animal.entry_age_months || animal.age_estimate || '—'}{(animal.entry_age_months || animal.age_estimate) ? ' bln' : ''}
          </p>
          <p className="text-[9px] font-bold text-[#4B6478] uppercase tracking-wider">Usia</p>
        </div>
      </div>

      {animal.latest_weight_date && weightRecords.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-white/[0.04] flex justify-between items-center">
          <span className="text-[10px] text-[#4B6478] font-medium">
            Timbang: {new Date(animal.latest_weight_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </span>
          {(() => {
            const last = [...weightRecords].sort((a, b) => new Date(b.weigh_date) - new Date(a.weigh_date))[0]
            const cfg  = last ? WEIGH_METHOD_LABEL[last.weigh_method] : null
            return cfg ? <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span> : null
          })()}
        </div>
      )}
    </motion.div>
  )
}
