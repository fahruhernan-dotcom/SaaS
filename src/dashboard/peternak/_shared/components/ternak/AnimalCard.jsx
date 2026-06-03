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
      className="bg-[#111C24] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-4 cursor-pointer hover:bg-[#162530] transition-all shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
    >
      {/* Header Row (Law of Common Region / Fitts's Law) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-['Sora'] font-bold text-sm text-white tracking-tight">{animal.ear_tag}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${st.color}`}>
            {st.label}
          </span>
          {batchLabel && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wide">
              {batchLabel}
            </span>
          )}
        </div>
        {onWeigh && (
          <button
            onClick={(e) => { e.stopPropagation(); onWeigh(animal) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest hover:bg-green-500/20 active:scale-95 transition-all"
          >
            <Scale size={11} />
            Timbang
          </button>
        )}
      </div>

      {/* Separator line */}
      <div className="border-b border-white/[0.05] my-3" />

      {/* Metrics Grid 2x3 (Aesthetic-Usability Effect / Law of Proximity) */}
      <div className="grid grid-cols-3 gap-y-3.5 gap-x-2 text-left">
        {/* Ras & Kelamin */}
        <div>
          <span className="text-[8px] font-black text-[#4B6478] uppercase tracking-wider mb-0.5 block">Ras & Kelamin</span>
          <p className="text-[11px] font-bold text-white font-['Sora'] truncate max-w-full">
            {animal.breed || 'Breed'} · {animal.sex === 'betina' ? 'Betina' : 'Jantan'}
          </p>
        </div>
        
        {/* B. Masuk (Initial Weight) */}
        <div>
          <span className="text-[8px] font-black text-[#4B6478] uppercase tracking-wider mb-0.5 block">B. Masuk</span>
          <p className="text-[11px] font-black text-white font-['Sora']">
            {animal.entry_weight_kg ? (
              <>
                {animal.entry_weight_kg} <span className="text-[9px] text-[#4B6478] font-normal">kg</span>
              </>
            ) : '—'}
          </p>
        </div>

        {/* B. Terkini (Current Weight & Gain) */}
        <div>
          <span className="text-[8px] font-black text-[#4B6478] uppercase tracking-wider mb-0.5 block">B. Terkini</span>
          <p className="text-[11px] font-black text-white font-['Sora']">
            {latestW} <span className="text-[9px] text-[#4B6478] font-normal">kg</span>
            {parseFloat(gain) !== 0 && (
              <span className={`text-[9px] font-bold ml-1.5 ${parseFloat(gain) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({parseFloat(gain) > 0 ? `+${gain}` : gain} kg)
              </span>
            )}
          </p>
        </div>

        {/* ADG Harian */}
        <div>
          <span className="text-[8px] font-black text-[#4B6478] uppercase tracking-wider mb-0.5 block">ADG Harian</span>
          <p className={`text-[11px] font-black font-['Sora'] ${adg >= 150 ? 'text-green-400' : adg > 0 ? 'text-amber-400' : 'text-[#4B6478]'}`}>
            {adg ? (adg >= 1000 ? `+${(adg / 1000).toFixed(2)} kg` : `+${adg.toFixed(0)}g`) : '—'}
          </p>
        </div>

        {/* Hari di Farm */}
        <div>
          <span className="text-[8px] font-black text-[#4B6478] uppercase tracking-wider mb-0.5 block">Hari di Farm</span>
          <p className="text-[11px] font-bold text-white font-['Sora']">{hari} hari</p>
        </div>

        {/* Timbang Terakhir */}
        <div>
          <span className="text-[8px] font-black text-[#4B6478] uppercase tracking-wider mb-0.5 block">Timbang Terakhir</span>
          <p className="text-[10px] font-bold text-white font-['Sora'] truncate max-w-full">
            {animal.latest_weight_date ? (
              <>
                {new Date(animal.latest_weight_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                {(() => {
                  const last = [...weightRecords].sort((a, b) => new Date(b.weigh_date) - new Date(a.weigh_date))[0]
                  const cfg  = last ? WEIGH_METHOD_LABEL[last.weigh_method] : null
                  return cfg ? <span className="text-[8px] text-[#4B6478] font-normal ml-1">({cfg.label})</span> : null
                })()}
              </>
            ) : '—'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
