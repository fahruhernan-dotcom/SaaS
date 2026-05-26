import KandangMiniMap from '@/dashboard/peternak/_shared/components/kandang/KandangMiniMap'
import {
  useSapiKandangs,
  useSapiAnimalsByBatches,
  calcSapiADGFromRecords,
} from '@/lib/hooks/useSapiPenggemukanData'

const INACTIVE_BTN = 'bg-black/40 border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/10'

function getADGTierColor(adgKg) {
  if (adgKg === null || adgKg === undefined) return '#4B6478'
  if (adgKg >= 0.8) return '#4ADE80'
  if (adgKg >= 0.5) return '#FBBF24'
  if (adgKg === 0)  return '#4B6478'
  return '#F87171'
}

const SAPI_CONFIG = {
  emoji: '🐄',
  palette: [
    { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', dotColor: '#FBBF24' },
    { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.3)',  dotColor: '#60A5FA' },
    { bg: 'rgba(2, 26, 2,0.08)', border: 'rgba(2, 26, 2,0.3)', dotColor: '#4ADE80' },
    { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.3)', dotColor: '#A78BFA' },
    { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)',  dotColor: '#F87171' },
  ],
  defaultFitMode: false,
  has3D: true,
  filterSold: false,
  getDotColor: (animal) => {
    const adg = calcSapiADGFromRecords(
      animal.sapi_penggemukan_weight_records,
      animal.entry_date,
      animal.entry_weight_kg,
    )
    return getADGTierColor(adg ? adg / 1000 : null)
  },
  weightScaling: (w) => Math.pow(w, 1 / 3) * 0.195,
  accentGlow: 'rgba(245,158,11,0.03)',
  fitModeBorder: 'border border-amber-500/20',
  fitModeBtn: {
    active:   'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30',
    inactive: INACTIVE_BTN,
  },
  threeDBtn: {
    active:   'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30',
    inactive: INACTIVE_BTN,
  },
}

const SAPI_HOOKS = {
  useKandangs:          useSapiKandangs,
  useAnimalsByBatches:  useSapiAnimalsByBatches,
}

export default function SapiKandangMiniMap({ batchIds, className, onAnimalClick, onKandangClick }) {
  return (
    <KandangMiniMap
      batchIds={batchIds}
      className={className}
      onAnimalClick={onAnimalClick}
      onKandangClick={onKandangClick}
      config={SAPI_CONFIG}
      hooks={SAPI_HOOKS}
    />
  )
}
