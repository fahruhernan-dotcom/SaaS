import { PenggemukanDailyTask } from '@/dashboard/peternak/_shared/components/penggemukan'
import { cn } from '@/lib/utils'
import {
  useDombaAnimals,
  useAddDombaWeightRecord,
  useDombaBatches,
  useDombaActiveBatches,
  useAddDombaHealthLog,
  useAddDombaFeedLog,
} from '@/lib/hooks/useDombaPenggemukanData'

const DOMBA_HOOKS = {
  useAnimals: useDombaAnimals,
  useAddWeight: useAddDombaWeightRecord,
  useBatches: useDombaBatches,
  useActiveBatches: useDombaActiveBatches,
  useAddHealth: useAddDombaHealthLog,
  useAddFeed: useAddDombaFeedLog,
  weightTable: 'domba_weight_records',
}

// FAMACHA score — domba-specific eye-color parasite assessment
function renderDombaExtraReportFields(context, data, setData) {
  if (context !== 'timbang') return null
  return (
    <div className="col-span-2 space-y-5 mt-2 animate-in slide-in-from-top-2 duration-500">
      <div className="flex items-center justify-between ml-4">
        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Skor FAMACHA (Wana Kelopak Mata)</label>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((score) => {
          const colors = [
            '',
            'bg-rose-500 border-rose-400 text-white',
            'bg-pink-400 border-pink-300 text-white',
            'bg-rose-200 border-rose-100 text-rose-800',
            'bg-slate-200 border-white text-slate-700',
            'bg-white border-slate-200 text-slate-900',
          ]
          const isSelected = data.famacha_score === score.toString()
          return (
            <button
              key={score}
              onClick={() => setData(w => ({ ...w, famacha_score: score.toString() }))}
              className={cn(
                'h-12 rounded-2xl flex items-center justify-center text-lg font-black transition-all border-2',
                isSelected ? colors[score] : 'bg-black/20 border-white/5 text-[#4B6478] hover:bg-black/40'
              )}
            >
              {score}
            </button>
          )
        })}
      </div>
      <p className="text-[10px] text-center text-[#4B6478] uppercase font-bold tracking-widest px-4">
        {data.famacha_score === '1' && '1: Optimal (Merah)'}
        {data.famacha_score === '2' && '2: Aman (Pink)'}
        {data.famacha_score === '3' && '3: Waspada (Pink Pucat)'}
        {data.famacha_score === '4' && '4: Bahaya (Pucat/Anemia)'}
        {data.famacha_score === '5' && '5: Kritis (Putih/Cacingan)'}
        {!data.famacha_score && 'Pilih skor 1-5 berdasarkan cek fisik'}
      </p>
    </div>
  )
}

export default function DombaDailyTask() {
  return (
    <PenggemukanDailyTask
      livestockType="domba_penggemukan"
      hooks={DOMBA_HOOKS}
      renderExtraReportFields={renderDombaExtraReportFields}
    />
  )
}
