import KandangMiniMap from '@/dashboard/peternak/_shared/components/kandang/KandangMiniMap'
import {
  useDombaKandangs,
  useDombaAnimalsByBatches,
} from '@/lib/hooks/useDombaPenggemukanData'

const INACTIVE_BTN = 'bg-black/40 border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/10'

const DOMBA_CONFIG = {
  emoji: '🐑',
  palette: [
    { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.3)',   dotColor: '#22C55E' },
    { bg: 'rgba(2, 26, 2,0.08)',  border: 'rgba(2, 26, 2,0.3)',  dotColor: '#021a02' },
    { bg: 'rgba(2, 26, 2,0.08)',  border: 'rgba(2, 26, 2,0.3)',  dotColor: '#021a02' },
    { bg: 'rgba(132,204,22,0.08)',  border: 'rgba(132,204,22,0.3)',  dotColor: '#84CC16' },
    { bg: 'rgba(20,184,166,0.08)',  border: 'rgba(20,184,166,0.3)',  dotColor: '#14B8A6' },
  ],
  defaultFitMode: true,
  has3D: true,
  filterSold: true,
  getDotColor: (animal, batchColorMap) => batchColorMap[animal.batch_id] ?? '#4B6478',
  weightScaling: (w) => Math.pow(w, 1 / 3) * 0.28,
  accentGlow: 'rgba(34,197,94,0.03)',
  fitModeBorder: 'border border-emerald-500/20',
  fitModeBtn: {
    active:   'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30',
    inactive: INACTIVE_BTN,
  },
  threeDBtn: {
    active:   'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30',
    inactive: INACTIVE_BTN,
  },
}

const DOMBA_HOOKS = {
  useKandangs:         useDombaKandangs,
  useAnimalsByBatches: useDombaAnimalsByBatches,
}

export default function DombaKandangMiniMap({ batchIds, className, onAnimalClick, onKandangClick }) {
  return (
    <KandangMiniMap
      batchIds={batchIds}
      className={className}
      onAnimalClick={onAnimalClick}
      onKandangClick={onKandangClick}
      config={DOMBA_CONFIG}
      hooks={DOMBA_HOOKS}
    />
  )
}
